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
import { Whiteboard, type Artifact } from './whiteboard-memory.js';
import { EvidenceLedger } from './evidence-ledger.js';
import { ParallelReasoningSessionManager, type ParallelReasoningSession } from './parallel-reasoning-mcp.js';
import { getDurableObjectId } from './index.js';

export interface Env {
  MCP_SESSION: DurableObjectNamespace;
  SESSION_REGISTRY: DurableObjectNamespace;
}

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  const structuredCloneFn = (globalThis as any).structuredClone as (<U>(value: U) => U) | undefined;
  if (structuredCloneFn) {
    return structuredCloneFn(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export class MCPSession extends DurableObject {
  private transport: StreamableHTTPServerTransport | null = null;
  private server: any | null = null;
  private cleanup: (() => Promise<void>) | null = null;
  private heartbeatInterval: number | null = null;
  private sessionId: string | null = null;
  private readonly ctx: DurableObjectState;
  private readonly env: Env;
  private transportInitialized = false;

  // Parallel reasoning state storage (legacy)
  private parallelReasoningSessions: Map<string, ParallelReasoningSession> = new Map();

  // Parallel reasoning v5 state storage (NEW)
  private parallelReasoningV5Manager: ParallelReasoningSessionManager = new ParallelReasoningSessionManager();

  // Capability system state storage
  private whiteboard: Whiteboard = new Whiteboard();
  private evidenceLedger: EvidenceLedger = new EvidenceLedger();
  private capabilityExecutionHistory: Array<{
    session_id: string;
    capability_id: string;
    timestamp: number;
    success: boolean;
    cost: any;
  }> = [];

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.ctx = state;
    this.env = env;
    console.log(`[MCPSession] Constructor called for DO ID: ${state.id.toString()}`);
    console.log(`[MCPSession] parallelReasoningV5Manager instance created: ${!!this.parallelReasoningV5Manager}`);
    // Load state from storage on initialization
    this.ctx.blockConcurrencyWhile(async () => {
      await this.loadParallelReasoningSessions();
      await this.loadParallelReasoningV5Sessions();
      await this.loadCapabilityState();
      console.log(`[MCPSession] Loaded ${this.parallelReasoningSessions.size} legacy sessions from storage`);
      console.log(`[MCPSession] Loaded ${this.parallelReasoningV5Manager.getAllSessions().size} v5 sessions from storage`);
      console.log(`[MCPSession] Loaded ${this.whiteboard.getAllIds().length} artifacts from whiteboard`);
      console.log(`[MCPSession] V5 Manager ready with ${this.parallelReasoningV5Manager.getAllSessions().size} sessions`);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // CRITICAL LOGGING: Log every request that arrives at the DO
    const sessionHeader = request.headers.get('mcp-session-id');
    console.log(`[MCPSession] fetch() called: ${method} ${pathname}, session header: ${sessionHeader}, DO ID: ${this.sessionId}`);

    // Handle heartbeat endpoint - lightweight keep-alive
    if (method === 'POST' && pathname === '/heartbeat') {
      return this.handleHeartbeat(request);
    }

    // Handle POST requests (initialization and tool calls)
    if (method === 'POST') {
      console.log(`[MCPSession] Routing to handlePost for ${pathname}`);
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
    console.log(`[MCPSession] Current sessionStore has ${this.parallelReasoningSessions.size} sessions: ${Array.from(this.parallelReasoningSessions.keys()).join(', ') || 'none'}`);

    // If we don't have a transport yet, this is initialization (or re-initialization after eviction)
    if (!this.transport) {
      // Generate a session ID based on the DO ID
      this.sessionId = this.ctx.id.toString();
      console.log(`[MCPSession] Initializing session: ${this.sessionId}`);

      // CRITICAL: Load persisted state from storage (in case of eviction/restart)
      console.log(`[MCPSession] Loading persisted state from DO storage...`);
      await this.loadParallelReasoningV5Sessions();
      await this.loadCapabilityState();
      console.log(`[MCPSession] State loaded. V5 sessions: ${this.parallelReasoningV5Manager.getAllSessions().size}`);

      // Create the MCP server with parallel reasoning session store and persist callback
      const persistCallback = async () => {
        await this.persistParallelReasoningSessions();
      };
      const getTransportSessionId = () => {
        console.log(`[MCPSession] getTransportSessionId called, returning: ${this.sessionId}`);
        return this.sessionId;
      };
      const capabilityPersistCallback = async () => {
        await this.persistCapabilityState();
      };
      const parallelReasoningV5PersistCallback = async () => {
        await this.persistParallelReasoningV5Sessions();
      };

      // Session registry callback for mapping custom session IDs to DO IDs
      const sessionRegistryCallback = async (customSessionId: string, durableObjectId: string) => {
        try {
          // Get deterministic registry DO ID
          const registryId = getDurableObjectId(this.env.SESSION_REGISTRY, 'global-session-registry');
          const registryStub = this.env.SESSION_REGISTRY.get(registryId);

          // Register the mapping
          await registryStub.fetch(
            new Request('http://internal/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customSessionId, durableObjectId })
            })
          );
          console.log(`[MCPSession] Registered session mapping: ${customSessionId} → ${durableObjectId.substring(0, 16)}...`);
        } catch (error) {
          console.error(`[MCPSession] Failed to register session in registry: ${error}`);
        }
      };

      console.log(`[MCPSession] Creating server with parallelReasoningV5Manager: ${!!this.parallelReasoningV5Manager}`);
      console.log(`[MCPSession] Manager has ${this.parallelReasoningV5Manager.getAllSessions().size} sessions before createServer`);
      const { server, cleanup, startNotificationIntervals } = createServer(
        this.parallelReasoningSessions,
        persistCallback,
        getTransportSessionId,
        this.whiteboard,
        this.evidenceLedger,
        capabilityPersistCallback,
        this.parallelReasoningV5Manager,
        parallelReasoningV5PersistCallback,
        sessionRegistryCallback
      );
      console.log(`[MCPSession] Server created successfully`);
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
        this.transportInitialized = false;
      };

      // Connect the transport to the server
      await this.server.connect(this.transport);

      // Convert Request to Express-like req/res objects using adapter
      const expressReq = new ExpressRequestAdapter(request);
      await expressReq.parseBody();
      const expressRes = new ExpressResponseAdapter();

      const requestMethod = this.getJsonRpcMethod(expressReq.body);
      if (!this.transportInitialized && requestMethod !== 'initialize') {
        await this.autoInitializeTransport(request.url);
      }

      // Handle the request - pass the parsed body as third parameter
      await this.transport.handleRequest(expressReq as any, expressRes as any, expressReq.body);
      if (requestMethod === 'initialize') {
        this.transportInitialized = true;
      }

      // Start notification intervals after initialization
      startNotificationIntervals(this.sessionId ?? undefined);

      // Start heartbeat for SSE
      this.startHeartbeat();

      // Return the response
      const response = await expressRes.toResponse();
      return this.attachSessionHeader(response);
    }

    // Existing session - handle the request
    // IMPORTANT: Trust worker routing - header may differ from DO ID when using body-based routing
    // The worker has already routed to the correct DO based on session_id in body parameters
    if (sessionIdHeader && sessionIdHeader !== this.sessionId) {
      console.log(`[MCPSession] Header mismatch (header="${sessionIdHeader}" vs DO="${this.sessionId}") - trusting worker routing from body`);
    }

    if (!sessionIdHeader || sessionIdHeader !== this.sessionId) {
      console.log(`[MCPSession] POST request with mismatched/missing header; trusting worker routing for session ${this.sessionId}`);
      // CRITICAL FIX: Inject the correct session ID header for MCP SDK compatibility
      // ChatGPT tool calls may have different header, but worker routed based on body session_id
      if (this.sessionId) {
        const headers = new Headers(request.headers);
        headers.set('mcp-session-id', this.sessionId);
        request = new Request(request, { headers });
      }

      // CRITICAL: Auto-initialize transport IMMEDIATELY when header mismatch detected
      // This happens when ChatGPT closes the original connection and opens a new one
      // but the worker routes to the correct DO based on session_id in body
      if (!this.transportInitialized) {
        console.log(`[MCPSession] Header mismatch detected - auto-initializing transport BEFORE processing request`);
        await this.autoInitializeTransport(request.url);
        console.log(`[MCPSession] Transport auto-initialized, transportInitialized: ${this.transportInitialized}`);
      }
    }

    // Convert and handle the request using adapter
    console.log(`[MCPSession] Converting request to Express format`);
    const expressReq = new ExpressRequestAdapter(request);
    await expressReq.parseBody();
    console.log(`[MCPSession] Request body parsed, method: ${expressReq.body?.method || 'unknown'}`);
    const expressRes = new ExpressResponseAdapter();

    const requestMethod = this.getJsonRpcMethod(expressReq.body);
    console.log(`[MCPSession] Request method: ${requestMethod}, transportInitialized: ${this.transportInitialized}, transport exists: ${!!this.transport}`);

    // Double-check transport initialization (fallback)
    if (!this.transportInitialized && requestMethod !== 'initialize') {
      console.log(`[MCPSession] Transport still not initialized - auto-initializing before handling ${requestMethod}...`);
      await this.autoInitializeTransport(request.url);
      console.log(`[MCPSession] Auto-initialization completed, transportInitialized: ${this.transportInitialized}`);
    }

    console.log(`[MCPSession] Calling transport.handleRequest for method: ${requestMethod}`);
    await this.transport!.handleRequest(expressReq as any, expressRes as any, expressReq.body);
    console.log(`[MCPSession] transport.handleRequest completed`);
    if (requestMethod === 'initialize') {
      this.transportInitialized = true;
    }

    const response = await expressRes.toResponse();
    console.log(`[MCPSession] Response created, status: ${response.status}`);
    return this.attachSessionHeader(response);
  }

  private getJsonRpcMethod(body: any): string | undefined {
    if (!body) {
      return undefined;
    }

    if (Array.isArray(body)) {
      const first = body.find((item) => typeof item === 'object' && item && 'method' in item);
      return typeof first?.method === 'string' ? first.method : undefined;
    }

    if (typeof body === 'object' && 'method' in body && typeof body.method === 'string') {
      return body.method;
    }

    return undefined;
  }

  private async autoInitializeTransport(requestUrl: string): Promise<void> {
    if (!this.transport || this.transportInitialized) {
      return;
    }

    const protocolVersion = '2025-03-26';
    const initPayload = {
      jsonrpc: '2.0',
      id: '__auto_init__',
      method: 'initialize' as const,
      params: {
        protocolVersion,
        capabilities: {
          tools: {},
          logging: {},
          prompts: {},
          resources: { subscribe: true },
          sampling: {},
          completions: {}
        },
        clientInfo: {
          name: 'mcp-auto-initializer',
          version: '1.0.0'
        }
      }
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json, text/event-stream');
    headers.set('mcp-protocol-version', protocolVersion);
    if (this.sessionId) {
      headers.set('mcp-session-id', this.sessionId);
    }

    try {
      const initRequest = new Request(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(initPayload)
      });
      const expressReq = new ExpressRequestAdapter(initRequest);
      await expressReq.parseBody();
      const expressRes = new ExpressResponseAdapter();
      await this.transport.handleRequest(expressReq as any, expressRes as any, expressReq.body);
      await expressRes.toResponse();
      this.transportInitialized = true;
      console.log(`[MCPSession] Auto-initialized transport for session ${this.sessionId}`);
    } catch (error) {
      console.error(`[MCPSession] Auto-initialization failed for session ${this.sessionId}:`, error);
    }
  }

  private async handleGet(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    if (!this.transport) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session transport available',
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (sessionIdHeader && sessionIdHeader !== this.sessionId) {
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

    if (!sessionIdHeader) {
      console.log(`[MCPSession] GET request missing session header; continuing with session ${this.sessionId}`);
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

  private async handleHeartbeat(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    console.log(`[MCPSession] HEARTBEAT received. Session header: ${sessionIdHeader}, DO ID: ${this.sessionId}`);

    // Validate session
    if (!this.sessionId) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Session not initialized'
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (sessionIdHeader && sessionIdHeader !== this.sessionId) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: `Session ID mismatch (expected ${this.sessionId}, got ${sessionIdHeader})`
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update last activity timestamp
    const now = Date.now();
    console.log(`[MCPSession] Heartbeat keeping session ${this.sessionId} alive at ${new Date(now).toISOString()}`);

    // Persist state to ensure resilience against eviction
    try {
      await Promise.all([
        this.persistParallelReasoningV5Sessions(),
        this.persistCapabilityState()
      ]);
      console.log(`[MCPSession] State persisted successfully on heartbeat`);
    } catch (error) {
      console.error(`[MCPSession] Failed to persist state on heartbeat:`, error);
    }

    // Return lightweight response
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      result: {
        success: true,
        session_id: this.sessionId,
        timestamp: now,
        message: 'Heartbeat acknowledged, session kept alive'
      },
      id: null,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'mcp-session-id': this.sessionId
      }
    });
  }

  private async handleDelete(request: Request): Promise<Response> {
    const sessionIdHeader = request.headers.get('mcp-session-id');

    console.log(`[MCPSession] DELETE request received. Session header: ${sessionIdHeader}, DO ID: ${this.sessionId}`);
    console.log(`[MCPSession] IGNORING DELETE to preserve session state for parallel reasoning`);

    // CRITICAL FIX: Do NOT close the transport when ChatGPT sends DELETE
    // ChatGPT closes MCP connections after each tool call, but we need to preserve
    // the session state (parallel reasoning sessions) across multiple tool calls.
    //
    // Instead of closing the transport, we:
    // 1. Acknowledge the DELETE request
    // 2. Keep the transport and server alive
    // 3. Allow subsequent tool calls to reuse the same session
    //
    // This fixes the issue where agent_reasoning_step fails because the session
    // was lost when the transport was closed after parallel_reasoning_init.

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      result: {
        success: true,
        message: 'Session preserved for stateful operations'
      },
      id: null,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'mcp-session-id': this.sessionId || ''
      }
    });
  }

  private startHeartbeat() {
    // Note: Alarms do NOT prevent eviction (per Cloudflare docs)
    // DOs are evicted after 70-140s of inactivity regardless of alarms
    // State persistence on every tool call is the correct approach
    console.log(`[MCPSession] Heartbeat placeholder (state persisted on each tool call)`);
  }

  private stopHeartbeat() {
    console.log(`[MCPSession] Stopping heartbeat`);
  }

  /**
   * Get parallel reasoning session store (for tool handlers)
   */
  getParallelReasoningSessions(): Map<string, ParallelReasoningSession> {
    return this.parallelReasoningSessions;
  }

  /**
   * Get whiteboard (for capability tools)
   */
  getWhiteboard(): Whiteboard {
    return this.whiteboard;
  }

  /**
   * Get evidence ledger (for capability tools)
   */
  getEvidenceLedger(): EvidenceLedger {
    return this.evidenceLedger;
  }

  /**
   * Get capability execution history (for capability tools)
   */
  getCapabilityExecutionHistory(): Array<any> {
    return this.capabilityExecutionHistory;
  }

  /**
   * Add capability execution to history
   */
  addCapabilityExecution(execution: {
    session_id: string;
    capability_id: string;
    timestamp: number;
    success: boolean;
    cost: any;
  }): void {
    this.capabilityExecutionHistory.push(execution);
    // Persist asynchronously
    this.persistCapabilityState().catch(err => {
      console.error('[MCPSession] Failed to persist capability state:', err);
    });
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

  /**
   * Persist capability state to Durable Object storage
   */
  async persistCapabilityState(): Promise<void> {
    console.log(`[MCPSession] Persisting capability state`);

    // Serialize whiteboard artifacts
    const whiteboardData = this.whiteboard.getAllIds().map(id => ({
      id,
      artifact: cloneValue(this.whiteboard.get(id)),
      history: cloneValue(this.whiteboard.getHistory(id))
    }));

    // Serialize evidence ledger (complete serialization)
    const evidenceLedgerData = this.evidenceLedger.serialize();

    // Use multiple put calls instead of batch
    await this.ctx.storage.put('capability_whiteboard', whiteboardData);
    await this.ctx.storage.put('capability_evidence_ledger', evidenceLedgerData);
    await this.ctx.storage.put('capability_execution_history', this.capabilityExecutionHistory);

    console.log(`[MCPSession] Successfully persisted capability state (${evidenceLedgerData.entries.length} evidence entries)`);
  }

  /**
   * Load capability state from Durable Object storage
   */
  async loadCapabilityState(): Promise<void> {
    const whiteboardData = await this.ctx.storage.get<Array<{ id: string; artifact: Artifact | null; history?: Artifact[] }>>('capability_whiteboard');
    const evidenceLedgerData = await this.ctx.storage.get<{
      entries: Array<[string, any]>;
      artifactIndex: Array<[string, string[]]>;
    }>('capability_evidence_ledger');
    const historyData = await this.ctx.storage.get<Array<any>>('capability_execution_history');

    // Restore whiteboard using add() method
    if (whiteboardData) {
      for (const { id, artifact, history } of whiteboardData) {
        if (artifact && artifact.metadata) {
          this.whiteboard.restore(id, artifact, history);
        }
      }
    }

    // Restore evidence ledger (complete restoration)
    if (evidenceLedgerData) {
      this.evidenceLedger.deserialize(evidenceLedgerData);
      console.log(`[MCPSession] Restored ${evidenceLedgerData.entries.length} evidence entries from storage`);
    }

    // Restore execution history
    if (historyData) {
      this.capabilityExecutionHistory = historyData;
    }
  }

  /**
   * Persist parallel reasoning v5 sessions to Durable Object storage
   */
  async persistParallelReasoningV5Sessions(): Promise<void> {
    const sessions = this.parallelReasoningV5Manager.serializeSessions();
    console.log(`[MCPSession] Persisting ${sessions.length} v5 sessions to storage`);
    console.log(`[MCPSession] Session IDs being persisted: ${sessions.map(([id]) => id).join(', ')}`);
    await this.ctx.storage.put('parallel_reasoning_v5_sessions', sessions);
    console.log(`[MCPSession] Successfully persisted v5 sessions to DO storage`);
  }

  /**
   * Load parallel reasoning v5 sessions from Durable Object storage
   */
  async loadParallelReasoningV5Sessions(): Promise<void> {
    const sessions = await this.ctx.storage.get<Array<[string, any]>>('parallel_reasoning_v5_sessions');
    if (sessions) {
      console.log(`[MCPSession] Loading ${sessions.length} v5 sessions from DO storage`);
      console.log(`[MCPSession] Session IDs being loaded: ${sessions.map(([id]) => id).join(', ')}`);
      this.parallelReasoningV5Manager.loadSessions(sessions);
      console.log(`[MCPSession] Successfully loaded v5 sessions into manager`);
    } else {
      console.log(`[MCPSession] No v5 sessions found in DO storage (first initialization)`);
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

