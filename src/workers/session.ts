/**
 * Durable Object for managing MCP session state
 *
 * Each instance of this DO represents a single MCP session and owns:
 * - StreamableHTTPServerTransport
 * - MCP Server instance
 * - Event store for resumability
 * - Heartbeat interval for SSE keep-alive
 * - Parallel reasoning session state (NEW)
 */

import { DurableObject } from 'cloudflare:workers';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { createServer } from './everything-workers.js';
import { ExpressRequestAdapter, ExpressResponseAdapter } from './express-adapter.js';
import type { ParallelReasoningSession } from './parallel-reasoning-engine.js';

export interface Env {
  MCP_SESSION: DurableObjectNamespace;
}

export class MCPSession extends DurableObject {
  private transport: StreamableHTTPServerTransport | null = null;
  private server: any | null = null;
  private cleanup: (() => Promise<void>) | null = null;
  private heartbeatInterval: number | null = null;
  private sessionId: string | null = null;

  // Parallel reasoning state storage
  private parallelReasoningSessions: Map<string, ParallelReasoningSession> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    console.log(`[MCPSession] Constructor called for DO ID: ${state.id.toString()}`);
    // Load parallel reasoning sessions from storage on initialization
    this.ctx.blockConcurrencyWhile(async () => {
      await this.loadParallelReasoningSessions();
      console.log(`[MCPSession] Loaded ${this.parallelReasoningSessions.size} sessions from storage`);
    });
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
    console.log(`[MCPSession] POST request. Session header: ${sessionIdHeader}, DO ID: ${this.ctx.id.toString()}, Has transport: ${!!this.transport}`);

    // If we don't have a transport yet, this is initialization
    if (!this.transport) {
      // Generate a session ID based on the DO ID
      this.sessionId = this.ctx.id.toString();
      console.log(`[MCPSession] Initializing new session: ${this.sessionId}`);

      // Create the MCP server with parallel reasoning session store and persist callback
      const persistCallback = async () => {
        await this.persistParallelReasoningSessions();
      };
      const { server, cleanup, startNotificationIntervals } = createServer(
        this.parallelReasoningSessions,
        persistCallback,
        () => this.sessionId
      );
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

      // Convert Request to Express-like req/res objects using adapter
      const expressReq = new ExpressRequestAdapter(request);
      await expressReq.parseBody();
      const expressRes = new ExpressResponseAdapter();

      // Handle the request - pass the parsed body as third parameter
      await this.transport.handleRequest(expressReq as any, expressRes as any, expressReq.body);

      // Start notification intervals after initialization
      startNotificationIntervals(this.sessionId);

      // Start heartbeat for SSE
      this.startHeartbeat();

      // Return the response
      const response = await expressRes.toResponse();
      return this.attachSessionHeader(response);
    }

    // Existing session - handle the request
    if (!sessionIdHeader || sessionIdHeader !== this.sessionId) {
      console.log(`Session ID mismatch: header="${sessionIdHeader}" expected="${this.sessionId}"`);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: `Bad Request: Invalid session ID (expected ${this.sessionId}, got ${sessionIdHeader})`,
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert and handle the request using adapter
    const expressReq = new ExpressRequestAdapter(request);
    await expressReq.parseBody();
    const expressRes = new ExpressResponseAdapter();

    await this.transport!.handleRequest(expressReq as any, expressRes as any, expressReq.body);

    const response = await expressRes.toResponse();
    return this.attachSessionHeader(response);
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

    // Convert and handle the request using adapter
    const expressReq = new ExpressRequestAdapter(request);
    await expressReq.parseBody();
    const expressRes = new ExpressResponseAdapter();

    await this.transport.handleRequest(expressReq as any, expressRes as any, expressReq.body);

    const response = await expressRes.toResponse();
    return this.attachSessionHeader(response);
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
      const expressReq = new ExpressRequestAdapter(request);
      await expressReq.parseBody();
      const expressRes = new ExpressResponseAdapter();

      await this.transport.handleRequest(expressReq as any, expressRes as any, expressReq.body);

      const response = await expressRes.toResponse();
      return this.attachSessionHeader(response);
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

  /**
   * Get parallel reasoning session store (for tool handlers)
   */
  getParallelReasoningSessions(): Map<string, ParallelReasoningSession> {
    return this.parallelReasoningSessions;
  }

  /**
   * Persist parallel reasoning sessions to Durable Object storage
   */
  async persistParallelReasoningSessions(): Promise<void> {
    const sessions = Array.from(this.parallelReasoningSessions.entries());
    console.log(`[MCPSession] Persisting ${sessions.length} sessions to storage`);
    await this.ctx.storage.put('parallel_reasoning_sessions', sessions);
    console.log(`[MCPSession] Successfully persisted sessions`);
  }

  /**
   * Load parallel reasoning sessions from Durable Object storage
   */
  async loadParallelReasoningSessions(): Promise<void> {
    const sessions = await this.ctx.storage.get<Array<[string, ParallelReasoningSession]>>('parallel_reasoning_sessions');
    if (sessions) {
      this.parallelReasoningSessions = new Map(sessions);
    }
  }

  private attachSessionHeader(response: Response): Response {
    if (!this.sessionId) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('mcp-session-id', this.sessionId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

