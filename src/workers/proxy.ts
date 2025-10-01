/**
 * MCP Proxy Worker
 * 
 * Translates session_id from request body to mcp-session-id header
 * for ChatGPT compatibility with api_tool.call_tool
 * 
 * Flow:
 * 1. ChatGPT calls proxy without mcp-session-id header
 * 2. Proxy extracts session_id from body.params.arguments.session_id
 * 3. Proxy adds mcp-session-id header
 * 4. Proxy forwards to actual MCP server
 * 5. Proxy returns response to ChatGPT
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Main proxy endpoint
app.post('/mcp', async (c) => {
  const targetUrl = 'https://mcp-server.vf-ghizzoni.workers.dev/mcp';
  
  // Read request body
  const body = await c.req.json();
  
  console.log('[Proxy] Received request:', JSON.stringify(body).substring(0, 200));
  
  // Extract session_id from body if present
  let sessionId: string | null = null;
  
  // Check various locations where session_id might be
  if (body.params?.arguments?.session_id) {
    sessionId = body.params.arguments.session_id;
    console.log(`[Proxy] Found session_id in body.params.arguments.session_id: ${sessionId}`);
  } else if (body.params?.session_id) {
    sessionId = body.params.session_id;
    console.log(`[Proxy] Found session_id in body.params.session_id: ${sessionId}`);
  }
  
  // Build headers for forwarding
  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  
  // Add session_id as mcp-session-id header if found
  if (sessionId) {
    forwardHeaders['mcp-session-id'] = sessionId;
    console.log(`[Proxy] Added mcp-session-id header: ${sessionId}`);
  } else {
    console.log('[Proxy] No session_id found in body, forwarding without mcp-session-id header');
  }
  
  // Forward request to actual MCP server
  console.log(`[Proxy] Forwarding to: ${targetUrl}`);
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: forwardHeaders,
    body: JSON.stringify(body),
  });
  
  console.log(`[Proxy] Response status: ${response.status}`);
  
  // Check if response is SSE (text/event-stream)
  const contentType = response.headers.get('content-type') || '';
  
  // Copy mcp-session-id header from response if present
  const mcpSessionIdFromResponse = response.headers.get('mcp-session-id');
  if (mcpSessionIdFromResponse) {
    console.log(`[Proxy] Response has mcp-session-id: ${mcpSessionIdFromResponse}`);
  }

  if (contentType.includes('text/event-stream')) {
    // SSE response - stream it back
    console.log('[Proxy] Streaming SSE response');

    // Copy relevant headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');

    // Copy mcp-session-id header if present
    if (mcpSessionIdFromResponse) {
      responseHeaders.set('mcp-session-id', mcpSessionIdFromResponse);
      console.log(`[Proxy] Forwarding mcp-session-id header in SSE response`);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } else {
    // JSON response
    console.log('[Proxy] Returning JSON response');
    const responseBody = await response.text();

    // Build response headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');

    // Copy mcp-session-id header if present
    if (mcpSessionIdFromResponse) {
      responseHeaders.set('mcp-session-id', mcpSessionIdFromResponse);
      console.log(`[Proxy] Forwarding mcp-session-id header in JSON response`);
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'mcp-proxy',
    version: '1.0.0',
    target: 'https://mcp-server.vf-ghizzoni.workers.dev/mcp',
  });
});

// Root endpoint with info
app.get('/', (c) => {
  return c.json({
    service: 'MCP Proxy Worker',
    version: '1.0.0',
    description: 'Translates session_id from body to mcp-session-id header for ChatGPT compatibility',
    endpoints: {
      '/mcp': 'POST - Main proxy endpoint',
      '/health': 'GET - Health check',
    },
    usage: {
      target: 'https://mcp-server.vf-ghizzoni.workers.dev/mcp',
      flow: [
        '1. ChatGPT calls /mcp without mcp-session-id header',
        '2. Proxy extracts session_id from body.params.arguments.session_id',
        '3. Proxy adds mcp-session-id header',
        '4. Proxy forwards to actual MCP server',
        '5. Proxy returns response to ChatGPT',
      ],
    },
  });
});

export default app;

