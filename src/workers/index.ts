/**
 * Cloudflare Workers entry point for MCP Streamable HTTP Server
 * 
 * This file implements a Hono-based HTTP server that routes MCP requests
 * to Durable Objects for session management.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Type definitions for Cloudflare Workers environment
export interface Env {
  MCP_SESSION: DurableObjectNamespace;
}

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware - mirror the Express configuration
app.use('/*', cors({
  origin: '*', // Use with caution in production
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  exposeHeaders: [
    'mcp-session-id',
    'last-event-id',
    'mcp-protocol-version'
  ],
  credentials: false,
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

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const sessionId = c.req.header('mcp-session-id');

  // Get or create Durable Object for this session
  let id: DurableObjectId;

  if (sessionId) {
    // Existing session - use the session ID (which is the DO ID hex string) to get the DO
    id = c.env.MCP_SESSION.idFromString(sessionId);
  } else {
    // New session - create a new DO with a unique ID
    id = c.env.MCP_SESSION.newUniqueId();
  }

  // Get the Durable Object stub
  const stub = c.env.MCP_SESSION.get(id);

  // Forward the request to the Durable Object
  return stub.fetch(c.req.raw);
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

  // Get the Durable Object for this session
  const id = c.env.MCP_SESSION.idFromString(sessionId);
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

  // Get the Durable Object for this session
  const id = c.env.MCP_SESSION.idFromString(sessionId);
  const stub = c.env.MCP_SESSION.get(id);

  // Forward the request to the Durable Object
  return stub.fetch(c.req.raw);
});

// Export the app as the default Worker handler
export default app;

// Export the Durable Object class
export { MCPSession } from './session';

