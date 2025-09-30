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

const extractDurableObjectId = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (DURABLE_OBJECT_ID_REGEX.test(value)) {
    return value;
  }

  const delimiterIndex = value.indexOf(SESSION_DELIMITER);
  if (delimiterIndex > 0) {
    const candidate = value.slice(0, delimiterIndex);
    if (DURABLE_OBJECT_ID_REGEX.test(candidate)) {
      return candidate;
    }
  }

  return null;
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

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const rawRequest = c.req.raw;
  const headerSessionId = c.req.header('mcp-session-id');
  console.log(`[Worker] POST /mcp - Session ID from header: ${headerSessionId || 'none'}`);

  let routedDoId: string | null = extractDurableObjectId(headerSessionId ?? null);
  let routedDoIdSource: string | null = routedDoId ? 'header' : null;
  let routedDoIdRawValue: string | null = routedDoId ? headerSessionId ?? null : null;

  if (!routedDoId) {
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
      const extracted = extractDurableObjectId(value);
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

    if (!routedDoId) {
      console.log(`[Worker] No session_id found in request body after checking all paths`);
    }
  }

  let id: DurableObjectId;

  if (routedDoId) {
    try {
      id = c.env.MCP_SESSION.idFromString(routedDoId);
      const idString = id.toString();
      if (routedDoIdSource === 'header') {
        console.log(`[Worker] Using existing DO for session: ${routedDoId}`);
        console.log(`[Worker] DO ID after idFromString: ${idString}`);
      } else {
        console.log(
          `[Worker] Derived Durable Object ID ${routedDoId} from ${routedDoIdSource ?? 'request body'} (${routedDoIdRawValue}). ` +
          'Reusing existing session without header.'
        );
        console.log(`[Worker] DO ID after idFromString: ${idString}`);
        console.log(`[Worker] IDs match: ${idString === routedDoId}`);
      }
    } catch (error) {
      console.error(
        `[Worker] Failed to parse session identifier "${routedDoIdRawValue ?? routedDoId}": ${error}. Creating new DO.`
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

  // Validate session ID format
  if (sessionId.length !== 64 || !/^[0-9a-f]+$/i.test(sessionId)) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Invalid session ID format (expected 64 hex chars, got ${sessionId.length})`,
      },
      id: null,
    }, 400);
  }

  // Get the Durable Object for this session
  let id: DurableObjectId;
  try {
    id = c.env.MCP_SESSION.idFromString(sessionId);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Failed to parse session ID: ${error}`,
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

  // Validate session ID format
  if (sessionId.length !== 64 || !/^[0-9a-f]+$/i.test(sessionId)) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Invalid session ID format (expected 64 hex chars, got ${sessionId.length})`,
      },
      id: null,
    }, 400);
  }

  // Get the Durable Object for this session
  let id: DurableObjectId;
  try {
    id = c.env.MCP_SESSION.idFromString(sessionId);
  } catch (error) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Bad Request: Failed to parse session ID: ${error}`,
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

