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
export function getDurableObjectId(
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
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Type definitions for Cloudflare Workers environment
export interface Env {
  MCP_SESSION: DurableObjectNamespace;
  SESSION_REGISTRY: DurableObjectNamespace;
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

  // Try multiple locations for session_id
  if (body.params?.arguments?.session_id) {
    sessionId = body.params.arguments.session_id;
    console.log(`[Proxy] Found session_id in body.params.arguments.session_id: ${sessionId}`);
  } else if (body.params?.session_id) {
    sessionId = body.params.session_id;
    console.log(`[Proxy] Found session_id in body.params.session_id: ${sessionId}`);
  } else if (body.arguments?.session_id) {
    // Direct arguments (not nested in params)
    sessionId = body.arguments.session_id;
    console.log(`[Proxy] Found session_id in body.arguments.session_id: ${sessionId}`);
  } else if (body.session_id) {
    // Top-level session_id
    sessionId = body.session_id;
    console.log(`[Proxy] Found session_id in body.session_id: ${sessionId}`);
  } else if (body.params?.arguments?.execution_token) {
    // For register_execution_results, extract session_id from execution_token
    const token = body.params.arguments.execution_token;
    console.log(`[Proxy] Found execution_token, extracting session_id: ${token}`);
    // Token format: exec_<session_id>_<timestamp>
    const match = token.match(/^exec_(.+)_\d+$/);
    if (match) {
      sessionId = match[1];
      console.log(`[Proxy] Extracted session_id from execution_token: ${sessionId}`);
    }
  }

  console.log(`[Proxy] Final extracted session_id: ${sessionId || 'none'}`);
  console.log(`[Proxy] Body structure: ${JSON.stringify(Object.keys(body))}, params: ${JSON.stringify(Object.keys(body.params || {}))}, arguments: ${JSON.stringify(Object.keys(body.params?.arguments || {}))}`);


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

// Direct API endpoint for register_execution_results - bypasses MCP session management
// This prevents "Session terminated" errors that block ChatGPT
app.post('/api/register-results', async (c) => {
  console.log('[API] Direct register_execution_results call');

  try {
    const body = await c.req.json();
    const { execution_token, results } = body;

    if (!execution_token) {
      return c.json({
        error: 'Missing execution_token',
        message: 'execution_token is required'
      }, 400);
    }

    // Extract session_id from execution_token
    // Token format: exec_<session_id>_<timestamp>
    const match = execution_token.match(/^exec_(.+)_\d+$/);
    if (!match) {
      return c.json({
        error: 'Invalid execution_token format',
        message: 'Token must be in format: exec_<session_id>_<timestamp>'
      }, 400);
    }

    const sessionId = match[1];
    console.log(`[API] Extracted session_id: ${sessionId}`);

    // Get Durable Object stub using the helper function
    const doId = getDurableObjectId(c.env.MCP_SESSION, sessionId);
    const stub = c.env.MCP_SESSION.get(doId);

    // Call the DO directly with a special internal endpoint
    const doRequest = new Request('http://internal/internal/register-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ execution_token, results })
    });

    const response = await stub.fetch(doRequest);
    const result = await response.json();

    return c.json(result);

  } catch (error) {
    console.error('[API] Error:', error);
    return c.json({
      error: 'Internal error',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const rawRequest = c.req.raw;
  const headerSessionId = c.req.header('mcp-session-id');
  console.log(`[Worker] POST /mcp - Session ID from header: ${headerSessionId || 'none'}`);

  let routedDoId: string | null = null;
  let routedDoIdSource: string | null = null;
  let routedDoIdRawValue: string | null = null;

  // STEP 1: Parse body to check for custom session_id (parallel reasoning)
  let parsedBody: unknown = null;
  let customSessionId: string | null = null;

  try {
    parsedBody = await rawRequest.clone().json();
    console.log(`[Worker] Request body for routing: ${JSON.stringify(parsedBody).substring(0, 500)}`);

    // Check if this is a tool call with a custom session_id
    if (isRecord(parsedBody)) {
      const params = isRecord(parsedBody['params']) ? parsedBody['params'] : null;
      if (params) {
        const args = isRecord(params['arguments']) ? params['arguments'] : null;
        const toolName = typeof params['name'] === 'string' ? params['name'] : null;

        // Direct session_id in arguments (most tools)
        if (args && typeof args['session_id'] === 'string') {
          customSessionId = args['session_id'];
          console.log(`[Worker] Found custom session_id in tool arguments: ${customSessionId}`);
        }
        // Extract session_id from execution_token for register_execution_results
        else if (toolName === 'register_execution_results' && args && typeof args['execution_token'] === 'string') {
          const token = args['execution_token'];
          // Token format: exec_${session_id}_${timestamp}_${random}
          const match = token.match(/^exec_([^_]+(?:_[^_]+)*?)_\d+_[a-z0-9]+$/);
          if (match && match[1]) {
            customSessionId = match[1];
            console.log(`[Worker] Extracted session_id from execution_token: ${customSessionId}`);
          } else {
            console.log(`[Worker] ⚠️ Unable to extract session_id from execution_token: ${token.substring(0, 50)}...`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`[Worker] Unable to parse request body for session routing: ${error}`);
  }

  // STEP 2: If we have a custom session_id, check registry FIRST (highest priority)
  if (customSessionId) {
    console.log(`[Worker] Checking registry for custom session_id: ${customSessionId}`);
    try {
      const registryId = getDurableObjectId(c.env.SESSION_REGISTRY, 'global-session-registry');
      const registryStub = c.env.SESSION_REGISTRY.get(registryId);
      const registryResponse = await registryStub.fetch(
        new Request(`http://internal/lookup?session_id=${encodeURIComponent(customSessionId)}`)
      );

      if (registryResponse.ok) {
        const data = await registryResponse.json() as { doId: string | null };
        if (data.doId) {
          routedDoId = data.doId;
          routedDoIdSource = 'registry';
          routedDoIdRawValue = customSessionId;
          console.log(`[Worker] ✅ Found mapping in registry: ${customSessionId} → ${data.doId.substring(0, 16)}...`);
        } else {
          console.log(`[Worker] ⚠️ No mapping found in registry for: ${customSessionId} (will use header or create new)`);
        }
      }
    } catch (error) {
      console.error(`[Worker] ❌ Error checking registry: ${error}`);
    }
  }

  // STEP 3: Fall back to header if no registry mapping found
  if (!routedDoId) {
    routedDoId = extractSessionId(headerSessionId ?? null);
    if (routedDoId) {
      routedDoIdSource = 'header';
      routedDoIdRawValue = headerSessionId ?? null;
      console.log(`[Worker] Using session_id from header: ${headerSessionId}`);
    } else {
      console.log(`[Worker] No session_id found in header or registry`);
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

// Export the Durable Object classes
export { MCPSession } from './session.js';
export { SessionRegistry } from './session-registry.js';
