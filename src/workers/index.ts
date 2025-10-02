/**
 * Cloudflare Workers entry point for MCP Streamable HTTP Server
 * 
 * This file implements a Hono-based HTTP server that routes MCP requests
 * to Durable Objects for session management.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const DURABLE_OBJECT_ID_REGEX = /^[0-9a-f]{64}$/i;

/**
 * Extract or validate session ID for Durable Object routing
 *
 * Supports two formats:
 * 1. 64-character hex string (native Durable Object ID)
 * 2. Any string (will be hashed to create deterministic DO ID)
 *
 * Returns the session ID if valid, null otherwise
 */
const extractSessionId = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  // Trim whitespace
  value = value.trim();

  if (!value) {
    return null;
  }

  // Accept any non-empty string as session ID
  return value;
};

/**
 * Check if a session ID is a native Durable Object ID (64 hex chars)
 */
const isNativeDurableObjectId = (value: string): boolean => {
  return DURABLE_OBJECT_ID_REGEX.test(value);
};

/**
 * Get Durable Object ID from session ID
 * Supports both native DO IDs (64 hex chars) and custom named IDs
 */
function getDurableObjectId(
  namespace: DurableObjectNamespace,
  sessionId: string
): DurableObjectId {
  console.log(`[getDurableObjectId] Input session ID: ${sessionId}`);
  const isNative = isNativeDurableObjectId(sessionId);
  console.log(`[getDurableObjectId] Is native DO ID: ${isNative}`);

  if (isNative) {
    // Native DO ID - use idFromString
    console.log(`[getDurableObjectId] Using native DO ID directly`);
    return namespace.idFromString(sessionId);
  } else {
    // Custom session ID - use idFromName
    // idFromName is a standard Cloudflare Workers API but not in all TypeScript definitions
    console.log(`[getDurableObjectId] Using idFromName for custom session ID`);
    return (namespace as any).idFromName(sessionId);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Type definitions for Cloudflare Workers environment
export interface Env {
  MCP_SESSION: DurableObjectNamespace;
}

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware - Enhanced for ChatGPT compatibility
app.use('/*', cors({
  origin: '*', // Allow all origins for MCP clients
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
  allowHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'mcp-session-id',
    'last-event-id',
    'mcp-protocol-version',
    'X-Requested-With',
    'Cache-Control'
  ],
  exposeHeaders: [
    'mcp-session-id',
    'last-event-id',
    'mcp-protocol-version',
    'Content-Type'
  ],
  credentials: false,
  maxAge: 86400, // 24 hours
}));

// Root endpoint with server info
app.get('/', (c) => {
  return c.json({
    name: 'MCP Streamable HTTP Server (Cloudflare Workers)',
    version: '0.7.0',
    protocol: 'Model Context Protocol',
    transport: 'Streamable HTTP with SSE',
    runtime: 'Cloudflare Workers + Durable Objects',
    endpoints: {
      mcp: 'POST /mcp',
      stream: 'GET /mcp',
      health: 'GET /health'
    },
    documentation: 'https://modelcontextprotocol.io'
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'Cloudflare Workers'
  });
});

// OPTIONS handler for CORS preflight
app.options('/*', (c) => {
  return c.newResponse(null, { status: 204 });
});

// Heartbeat endpoint - lightweight keep-alive for long-running sessions
app.post('/heartbeat', async (c) => {
  const sessionId = c.req.header('mcp-session-id');

  if (!sessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No session ID provided in mcp-session-id header',
      },
      id: null,
    }, 400);
  }

  // Validate session ID is not empty
  const trimmedSessionId = sessionId.trim();
  if (!trimmedSessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session ID cannot be empty',
      },
      id: null,
    }, 400);
  }

  console.log(`[Worker] POST /heartbeat - Session ID: ${trimmedSessionId}`);

  // Get the Durable Object for this session
  let id: DurableObjectId;
  try {
    id = getDurableObjectId(c.env.MCP_SESSION, trimmedSessionId);
    console.log(`[Worker] Heartbeat for session: ${trimmedSessionId}`);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Failed to resolve session ID: ${error}`,
      },
      id: null,
    }, 400);
  }

  const stub = c.env.MCP_SESSION.get(id);

  // Forward to the Durable Object's /heartbeat handler
  return stub.fetch(c.req.raw);
});

// Proxy endpoint - ChatGPT compatible (extracts session_id from body)
app.post('/proxy', async (c) => {
  console.log('[Proxy] Request received');

  // Read request body
  const body = await c.req.json();
  console.log('[Proxy] Body:', JSON.stringify(body).substring(0, 200));

  // Extract session_id from body if present
  let sessionId: string | null = null;

  if (body.params?.arguments?.session_id) {
    sessionId = body.params.arguments.session_id;
    console.log(`[Proxy] Found session_id in body.params.arguments.session_id: ${sessionId}`);
  } else if (body.params?.session_id) {
    sessionId = body.params.session_id;
    console.log(`[Proxy] Found session_id in body.params.session_id: ${sessionId}`);
  }

  // Create new request with mcp-session-id header
  const headers = new Headers(c.req.raw.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json, text/event-stream');

  if (sessionId) {
    headers.set('mcp-session-id', sessionId);
    console.log(`[Proxy] Added mcp-session-id header: ${sessionId}`);
  }

  // Create new request to /mcp endpoint
  const mcpUrl = new URL('/mcp', c.req.url);
  const mcpRequest = new Request(mcpUrl.toString(), {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  console.log('[Proxy] Forwarding to /mcp endpoint');

  // Forward to /mcp handler using app.fetch for internal routing
  return app.fetch(mcpRequest, c.env, c.executionCtx);
});

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const rawRequest = c.req.raw;
  const headerSessionId = c.req.header('mcp-session-id');
  console.log(`[Worker] POST /mcp - Session ID from header: ${headerSessionId || 'none'}`);

  let routedDoId: string | null = null;
  let routedDoIdSource: string | null = null;
  let routedDoIdRawValue: string | null = null;

  // PRIORITY 1: Check header first (for MCP session routing)
  // The mcp-session-id header is the authoritative source for Durable Object routing
  routedDoId = extractSessionId(headerSessionId ?? null);
  if (routedDoId) {
    routedDoIdSource = 'header';
    routedDoIdRawValue = headerSessionId ?? null;
    console.log(`[Worker] Using session_id from header: ${headerSessionId}`);
  }

  // PRIORITY 2: Fall back to body only if no header (e.g., during initialize)
  if (!routedDoId) {
    console.log(`[Worker] No session_id found in header, checking body...`);

    let parsedBody: unknown = null;
    try {
      parsedBody = await rawRequest.clone().json();
      console.log(`[Worker] Request body for routing: ${JSON.stringify(parsedBody).substring(0, 500)}`);
    } catch (error) {
      console.log(`[Worker] Unable to parse request body for session routing: ${error}`);
    }

    const considerCandidate = (value: unknown, source: string) => {
      if (routedDoId || typeof value !== 'string') {
        return;
      }
      const extracted = extractSessionId(value);
      if (extracted) {
        routedDoId = extracted;
        routedDoIdSource = source;
        routedDoIdRawValue = value;
        console.log(`[Worker] Found session_id candidate from ${source}: ${value}`);
      }
    };

    if (isRecord(parsedBody)) {
      considerCandidate(parsedBody['transport_session_id'], 'body.transport_session_id');
      considerCandidate(parsedBody['session_id'], 'body.session_id');

      const params = isRecord(parsedBody['params']) ? parsedBody['params'] : null;
      if (params) {
        considerCandidate(params['transport_session_id'], 'body.params.transport_session_id');
        considerCandidate(params['session_id'], 'body.params.session_id');

        const args = isRecord(params['arguments']) ? params['arguments'] : null;
        if (args) {
          considerCandidate(args['transport_session_id'], 'body.params.arguments.transport_session_id');
          // NOTE: Do NOT use args['session_id'] for routing - it's for internal parallel reasoning logic
          // considerCandidate(args['session_id'], 'body.params.arguments.session_id');
        }
      }
    }
  }

  if (!routedDoId) {
    console.log(`[Worker] No session_id found in body or header`);
  }

  let id: DurableObjectId;

  if (routedDoId) {
    try {
      id = getDurableObjectId(c.env.MCP_SESSION, routedDoId);
      const idString = id.toString();
      console.log(`[Worker] Routed to DO: ${idString} (from session: ${routedDoId}, source: ${routedDoIdSource})`);
    } catch (error) {
      console.error(
        `[Worker] Failed to resolve session identifier "${routedDoIdRawValue ?? routedDoId}": ${error}. Creating new DO.`
      );
      id = c.env.MCP_SESSION.newUniqueId();
      console.log(`[Worker] Created fallback DO with ID: ${id.toString()}`);
    }
  } else {
    id = c.env.MCP_SESSION.newUniqueId();
    console.log(`[Worker] Creating new DO with ID: ${id.toString()}`);
  }

  const stub = c.env.MCP_SESSION.get(id);
  return stub.fetch(rawRequest);
});

// MCP GET endpoint - SSE streaming
app.get('/mcp', async (c) => {
  const sessionId = c.req.header('mcp-session-id');

  if (!sessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    }, 400);
  }

  // Validate session ID is not empty
  const trimmedSessionId = sessionId.trim();
  if (!trimmedSessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session ID cannot be empty',
      },
      id: null,
    }, 400);
  }

  // Get the Durable Object for this session
  let id: DurableObjectId;
  try {
    id = getDurableObjectId(c.env.MCP_SESSION, trimmedSessionId);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Failed to resolve session ID: ${error}`,
      },
      id: null,
    }, 400);
  }

  const stub = c.env.MCP_SESSION.get(id);

  // Forward the request to the Durable Object
  return stub.fetch(c.req.raw);
});

// MCP DELETE endpoint - session termination
app.delete('/mcp', async (c) => {
  const sessionId = c.req.header('mcp-session-id');

  if (!sessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    }, 400);
  }

  // Validate session ID is not empty
  const trimmedSessionId = sessionId.trim();
  if (!trimmedSessionId) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session ID cannot be empty',
      },
      id: null,
    }, 400);
  }

  // Get the Durable Object for this session
  let id: DurableObjectId;
  try {
    id = getDurableObjectId(c.env.MCP_SESSION, trimmedSessionId);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Failed to resolve session ID: ${error}`,
      },
      id: null,
    }, 400);
  }

  const stub = c.env.MCP_SESSION.get(id);

  // Forward the request to the Durable Object
  return stub.fetch(c.req.raw);
});

// Export the app as the default Worker handler
export default app;

// Export the Durable Object class
export { MCPSession } from './session.js';

