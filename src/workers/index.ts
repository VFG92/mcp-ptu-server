/**
 * Cloudflare Workers entry point for MCP Streamable HTTP Server
 * 
 * This file implements a Hono-based HTTP server that routes MCP requests
 * to Durable Objects for session management.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const DURABLE_OBJECT_ID_REGEX = /^[0-9a-f]{64}$/i;
const SESSION_DELIMITER = '::';

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
 * Create a deterministic Durable Object ID from a custom session ID
 * Uses SHA-256 hash to create a consistent 64-character hex string
 */
async function createDeterministicDoId(sessionId: string): Promise<string> {
  // Use Web Crypto API to create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // SHA-256 produces 32 bytes = 64 hex chars (perfect for DO ID!)
  return hashHex;
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
    // Support both native DO IDs and custom session IDs
    if (isNativeDurableObjectId(trimmedSessionId)) {
      // Native DO ID - use directly
      id = c.env.MCP_SESSION.idFromString(trimmedSessionId);
      console.log(`[Worker] Heartbeat using native DO ID: ${trimmedSessionId}`);
    } else {
      // Custom session ID - create deterministic hash
      const deterministicId = await createDeterministicDoId(trimmedSessionId);
      id = c.env.MCP_SESSION.idFromString(deterministicId);
      console.log(`[Worker] Heartbeat using custom session ID: ${trimmedSessionId} -> ${deterministicId}`);
    }
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

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const rawRequest = c.req.raw;
  const headerSessionId = c.req.header('mcp-session-id');
  console.log(`[Worker] POST /mcp - Session ID from header: ${headerSessionId || 'none'}`);

  let routedDoId: string | null = null;
  let routedDoIdSource: string | null = null;
  let routedDoIdRawValue: string | null = null;

  // PRIORITY 1: Check body first (for tool calls with session_id parameter)
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
        considerCandidate(args['session_id'], 'body.params.arguments.session_id');
      }
    }
  }

  // PRIORITY 2: Fall back to header if no session_id in body
  if (!routedDoId) {
    console.log(`[Worker] No session_id found in request body, checking header...`);
    routedDoId = extractSessionId(headerSessionId ?? null);
    if (routedDoId) {
      routedDoIdSource = 'header';
      routedDoIdRawValue = headerSessionId ?? null;
      console.log(`[Worker] Using session_id from header: ${headerSessionId}`);
    }
  } else {
    console.log(`[Worker] Using session_id from body (priority over header): ${routedDoIdRawValue}`);
  }

  if (!routedDoId) {
    console.log(`[Worker] No session_id found in body or header`);
  }

  let id: DurableObjectId;

  if (routedDoId) {
    try {
      // Check if this is a native Durable Object ID (64 hex chars) or a custom session ID
      if (isNativeDurableObjectId(routedDoId)) {
        // Native DO ID - use directly
        id = c.env.MCP_SESSION.idFromString(routedDoId);
        console.log(`[Worker] Using native DO ID: ${routedDoId}`);
      } else {
        // Custom session ID - create deterministic hash
        const deterministicId = await createDeterministicDoId(routedDoId);
        id = c.env.MCP_SESSION.idFromString(deterministicId);
        console.log(`[Worker] Using custom session ID: ${routedDoId} -> ${deterministicId}`);
      }

      const idString = id.toString();
      console.log(`[Worker] DO ID resolved to: ${idString}`);
      console.log(`[Worker] Source: ${routedDoIdSource}`);
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
    // Support both native DO IDs and custom session IDs
    if (isNativeDurableObjectId(trimmedSessionId)) {
      id = c.env.MCP_SESSION.idFromString(trimmedSessionId);
    } else {
      const deterministicId = await createDeterministicDoId(trimmedSessionId);
      id = c.env.MCP_SESSION.idFromString(deterministicId);
    }
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
    // Support both native DO IDs and custom session IDs
    if (isNativeDurableObjectId(trimmedSessionId)) {
      id = c.env.MCP_SESSION.idFromString(trimmedSessionId);
    } else {
      const deterministicId = await createDeterministicDoId(trimmedSessionId);
      id = c.env.MCP_SESSION.idFromString(deterministicId);
    }
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

