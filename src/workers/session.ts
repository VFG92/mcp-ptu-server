/**
 * Durable Object for managing MCP session state
 * 
 * Each instance of this DO represents a single MCP session and owns:
 * - StreamableHTTPServerTransport
 * - MCP Server instance
 * - Event store for resumability
 * - Heartbeat interval for SSE keep-alive
 */

import { DurableObject } from 'cloudflare:workers';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { createServer } from './everything-workers.js';

export interface Env {
  MCP_SESSION: DurableObjectNamespace;
}

export class MCPSession extends DurableObject {
  private transport: StreamableHTTPServerTransport | null = null;
  private server: any | null = null;
  private cleanup: (() => Promise<void>) | null = null;
  private heartbeatInterval: number | null = null;
  private sessionId: string | null = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle POST requests (initialization and tool calls)
    if (method === 'POST') {
      return this.handlePost(request);
    }

    // Handle GET requests (SSE streaming)
    if (method === 'GET') {
      return this.handleGet(request);
    }

    // Handle DELETE requests (session termination)
    if (method === 'DELETE') {
      return this.handleDelete(request);
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handlePost(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    // If we don't have a transport yet, this is initialization
    if (!this.transport) {
      // Generate a session ID based on the DO ID
      this.sessionId = this.ctx.id.toString();

      // Create the MCP server
      const { server, cleanup, startNotificationIntervals } = createServer();
      this.server = server;
      this.cleanup = cleanup;

      // Create event store for resumability
      const eventStore = new InMemoryEventStore();

      // Create the transport
      this.transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => this.sessionId!,
        eventStore,
        onsessioninitialized: (sessionId: string) => {
          console.log(`Session initialized with ID: ${sessionId}`);
        }
      });

      // Set up onclose handler
      this.server.onclose = async () => {
        console.log(`Transport closed for session ${this.sessionId}`);
        if (this.cleanup) {
          await this.cleanup();
        }
        this.stopHeartbeat();
      };

      // Connect the transport to the server
      await this.server.connect(this.transport);

      // Convert Request to Express-like req/res objects
      const expressReq = await this.convertToExpressRequest(request);
      const expressRes = this.createExpressResponse();

      // Handle the request
      await this.transport.handleRequest(expressReq, expressRes);

      // Start notification intervals after initialization
      startNotificationIntervals(this.sessionId);

      // Start heartbeat for SSE
      this.startHeartbeat();

      // Return the response
      return this.convertFromExpressResponse(expressRes);
    }

    // Existing session - handle the request
    if (!sessionIdHeader || sessionIdHeader !== this.sessionId) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Invalid session ID',
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert and handle the request
    const expressReq = await this.convertToExpressRequest(request);
    const expressRes = this.createExpressResponse();

    await this.transport!.handleRequest(expressReq, expressRes);

    return this.convertFromExpressResponse(expressRes);
  }

  private async handleGet(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    if (!this.transport || !sessionIdHeader || sessionIdHeader !== this.sessionId) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for Last-Event-ID for resumability
    const lastEventId = request.headers.get('last-event-id');
    if (lastEventId) {
      console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.log(`Establishing new SSE stream for session ${this.sessionId}`);
    }

    // Convert and handle the request
    const expressReq = await this.convertToExpressRequest(request);
    const expressRes = this.createExpressResponse();

    await this.transport.handleRequest(expressReq, expressRes);

    return this.convertFromExpressResponse(expressRes);
  }

  private async handleDelete(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    if (!this.transport || !sessionIdHeader || sessionIdHeader !== this.sessionId) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Received session termination request for session ${this.sessionId}`);

    try {
      const expressReq = await this.convertToExpressRequest(request);
      const expressRes = this.createExpressResponse();

      await this.transport.handleRequest(expressReq, expressRes);

      return this.convertFromExpressResponse(expressRes);
    } catch (error) {
      console.error('Error handling session termination:', error);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Error handling session termination',
        },
        id: null,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private startHeartbeat() {
    // Send heartbeat every 30 seconds to keep SSE connection alive
    this.heartbeatInterval = setInterval(() => {
      // Heartbeat logic would go here if needed
      // For now, the transport handles keep-alive
    }, 30000) as unknown as number;
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Helper methods to convert between Workers Request/Response and Express-like objects
  private async convertToExpressRequest(request: Request): any {
    const url = new URL(request.url);
    const body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};

    return {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      query: Object.fromEntries(url.searchParams.entries()),
    };
  }

  private createExpressResponse(): any {
    const response: any = {
      statusCode: 200,
      headers: {},
      body: null,
      headersSent: false,
    };

    response.status = (code: number) => {
      response.statusCode = code;
      return response;
    };

    response.json = (data: any) => {
      response.body = JSON.stringify(data);
      response.headers['Content-Type'] = 'application/json';
      response.headersSent = true;
      return response;
    };

    response.setHeader = (name: string, value: string) => {
      response.headers[name] = value;
    };

    response.write = (chunk: any) => {
      if (!response.body) response.body = '';
      response.body += chunk;
    };

    response.end = (data?: any) => {
      if (data) response.body = data;
      response.headersSent = true;
    };

    return response;
  }

  private convertFromExpressResponse(expressRes: any): Response {
    const headers = new Headers(expressRes.headers);
    return new Response(expressRes.body, {
      status: expressRes.statusCode,
      headers,
    });
  }
}

