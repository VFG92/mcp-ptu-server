/**
 * Session Registry for mapping custom session IDs to Durable Object IDs
 * 
 * Problem: ChatGPT calls initialize() for each new MCP connection, creating new DO instances.
 * Solution: Store mapping of custom session_id (e.g., "sess-2025-10-02-r5") to DO ID.
 * 
 * When a tool call arrives with a custom session_id:
 * 1. Check if mapping exists in registry
 * 2. If yes, route to the existing DO
 * 3. If no, create new DO and store mapping
 * 
 * Storage: Uses Durable Object storage (not KV) for consistency
 */

export interface SessionMapping {
  customSessionId: string;
  durableObjectId: string;
  createdAt: number;
  lastAccessedAt: number;
}

/**
 * Global Session Registry (Durable Object)
 * 
 * Single instance that stores all session mappings
 */
export class SessionRegistry {
  private ctx: DurableObjectState;
  private mappings: Map<string, SessionMapping> = new Map();

  constructor(state: DurableObjectState) {
    this.ctx = state;
    
    // Load mappings from storage on initialization
    this.ctx.blockConcurrencyWhile(async () => {
      await this.loadMappings();
      console.log(`[SessionRegistry] Loaded ${this.mappings.size} session mappings`);
    });
  }

  /**
   * Get DO ID for a custom session ID
   */
  async getDoId(customSessionId: string): Promise<string | null> {
    const mapping = this.mappings.get(customSessionId);
    if (mapping) {
      // Update last accessed timestamp
      mapping.lastAccessedAt = Date.now();
      await this.persistMappings();
      console.log(`[SessionRegistry] Found mapping: ${customSessionId} → ${mapping.durableObjectId}`);
      return mapping.durableObjectId;
    }
    console.log(`[SessionRegistry] No mapping found for: ${customSessionId}`);
    return null;
  }

  /**
   * Register a new session mapping
   */
  async registerSession(customSessionId: string, durableObjectId: string): Promise<void> {
    const mapping: SessionMapping = {
      customSessionId,
      durableObjectId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    this.mappings.set(customSessionId, mapping);
    await this.persistMappings();
    console.log(`[SessionRegistry] Registered mapping: ${customSessionId} → ${durableObjectId}`);
  }

  /**
   * Delete a session mapping
   */
  async deleteSession(customSessionId: string): Promise<void> {
    this.mappings.delete(customSessionId);
    await this.persistMappings();
    console.log(`[SessionRegistry] Deleted mapping: ${customSessionId}`);
  }

  /**
   * List all mappings
   */
  listMappings(): SessionMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Clean up old mappings (older than 24 hours)
   */
  async cleanupOldMappings(): Promise<number> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let deleted = 0;

    for (const [customSessionId, mapping] of this.mappings.entries()) {
      if (now - mapping.lastAccessedAt > maxAge) {
        this.mappings.delete(customSessionId);
        deleted++;
      }
    }

    if (deleted > 0) {
      await this.persistMappings();
      console.log(`[SessionRegistry] Cleaned up ${deleted} old mappings`);
    }

    return deleted;
  }

  /**
   * Load mappings from Durable Object storage
   */
  private async loadMappings(): Promise<void> {
    const stored = await this.ctx.storage.get<Array<[string, SessionMapping]>>('session_mappings');
    if (stored) {
      this.mappings = new Map(stored);
    }
  }

  /**
   * Persist mappings to Durable Object storage
   */
  private async persistMappings(): Promise<void> {
    const serialized = Array.from(this.mappings.entries());
    await this.ctx.storage.put('session_mappings', serialized);
  }

  /**
   * Handle HTTP requests (for debugging/admin and internal lookups)
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // GET /lookup?session_id=xxx - Lookup DO ID for custom session ID
    if (method === 'GET' && url.pathname === '/lookup') {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'Missing session_id parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const doId = await this.getDoId(sessionId);
      return new Response(JSON.stringify({ doId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /get-mapping - Get mapping (for internal use)
    if (method === 'POST' && url.pathname === '/get-mapping') {
      const body = await request.json() as { session_id: string };
      const doId = await this.getDoId(body.session_id);
      return new Response(JSON.stringify({ do_id: doId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /register - Register new mapping
    if (method === 'POST' && url.pathname === '/register') {
      const body = await request.json() as { customSessionId: string; durableObjectId: string };
      await this.registerSession(body.customSessionId, body.durableObjectId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /registry - List all mappings
    if (method === 'GET' && url.pathname === '/registry') {
      const mappings = this.listMappings();
      return new Response(JSON.stringify({
        count: mappings.length,
        mappings: mappings.map(m => ({
          customSessionId: m.customSessionId,
          durableObjectId: m.durableObjectId.substring(0, 16) + '...',
          createdAt: new Date(m.createdAt).toISOString(),
          lastAccessedAt: new Date(m.lastAccessedAt).toISOString()
        }))
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /registry/cleanup - Clean up old mappings
    if (method === 'POST' && url.pathname === '/registry/cleanup') {
      const deleted = await this.cleanupOldMappings();
      return new Response(JSON.stringify({
        deleted,
        remaining: this.mappings.size
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}

