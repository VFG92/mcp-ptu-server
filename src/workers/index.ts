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
  return c.text('', 204);
});

// MCP POST endpoint - initialization and requests
app.post('/mcp', async (c) => {
  const sessionId = c.req.header('mcp-session-id');
  console.log(`[Worker] POST /mcp - Session ID from header: ${sessionId || 'none'}`);

  // Get or create Durable Object for this session
  let id: DurableObjectId;

  if (sessionId) {
    // Existing session - use the session ID (which is the DO ID hex string) to get the DO
    id = c.env.MCP_SESSION.idFromString(sessionId);
    console.log(`[Worker] Using existing DO for session: ${sessionId}`);
  } else {
    // New session - create a new DO with a unique ID
    id = c.env.MCP_SESSION.newUniqueId();
    console.log(`[Worker] Creating new DO with ID: ${id.toString()}`);
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

