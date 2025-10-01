# MCP Server Heartbeat & Session Keep-Alive

## Problem Statement

Cloudflare Durable Objects have a **30-second CPU time limit per request**. Each incoming HTTP request resets this timer. However, if no requests arrive for 30+ seconds, the Durable Object may be evicted, causing session state loss.

### Scenario

1. **Client calls `init_parallel_reasoning`** → Session created in Durable Object ✅
2. **Client thinks/reasons for 30+ seconds** → No HTTP requests sent 🤔
3. **Durable Object evicted** → Session state potentially lost ⚠️
4. **Client calls `submit_reasoning_plan`** → Session not found ❌

This is particularly problematic for LLM clients (like ChatGPT) that may spend significant time reasoning between tool calls.

## Solution: Heartbeat Endpoint

We've implemented a **lightweight heartbeat endpoint** that clients should call periodically to keep sessions alive.

### Endpoint

```
POST /heartbeat
```

### Headers

```
mcp-session-id: <your-session-id>
Content-Type: application/json
```

### Request Body

Empty or minimal JSON:

```json
{}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "session_id": "abc123...",
    "timestamp": 1234567890,
    "message": "Heartbeat acknowledged, session kept alive"
  },
  "id": null
}
```

### Error Responses

**Session not initialized:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Session not initialized"
  },
  "id": null
}
```

**Session ID mismatch:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Session ID mismatch (expected abc123..., got xyz789...)"
  },
  "id": null
}
```

## Usage Guidelines

### Recommended Heartbeat Interval

**Send a heartbeat every 20 seconds** to ensure the Durable Object stays alive.

- Cloudflare's limit: 30 seconds
- Recommended interval: 20 seconds (33% safety margin)
- Maximum safe interval: 25 seconds

### When to Send Heartbeats

Send heartbeats during:

1. **Long reasoning/thinking periods** between tool calls
2. **Multi-step workflows** where steps take time
3. **User interaction delays** (waiting for user input)
4. **Any gap > 15 seconds** between MCP requests

### When NOT to Send Heartbeats

Don't send heartbeats:

1. **During active tool calls** - the tool call itself keeps the session alive
2. **When session is idle** - no need to keep unused sessions alive
3. **After session completion** - let the session naturally expire

## Implementation Examples

### Python Client

```python
import time
import threading
import requests

class MCPClientWithHeartbeat:
    def __init__(self, base_url, session_id):
        self.base_url = base_url
        self.session_id = session_id
        self.heartbeat_thread = None
        self.stop_heartbeat = False
    
    def start_heartbeat(self):
        """Start background heartbeat thread"""
        self.stop_heartbeat = False
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()
    
    def stop_heartbeat_thread(self):
        """Stop background heartbeat thread"""
        self.stop_heartbeat = True
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=1)
    
    def _heartbeat_loop(self):
        """Background loop that sends heartbeats every 20 seconds"""
        while not self.stop_heartbeat:
            try:
                response = requests.post(
                    f"{self.base_url}/heartbeat",
                    headers={
                        "mcp-session-id": self.session_id,
                        "Content-Type": "application/json"
                    },
                    json={},
                    timeout=5
                )
                if response.status_code == 200:
                    print(f"[Heartbeat] Session {self.session_id[:8]}... kept alive")
                else:
                    print(f"[Heartbeat] Warning: {response.status_code}")
            except Exception as e:
                print(f"[Heartbeat] Error: {e}")
            
            # Wait 20 seconds before next heartbeat
            time.sleep(20)
    
    def long_operation(self):
        """Example: operation that takes time"""
        self.start_heartbeat()
        try:
            # Your long-running operation here
            time.sleep(60)  # Simulating 60 seconds of work
        finally:
            self.stop_heartbeat_thread()

# Usage
client = MCPClientWithHeartbeat("https://your-server.workers.dev", "abc123...")
client.long_operation()
```

### JavaScript/TypeScript Client

```typescript
class MCPClientWithHeartbeat {
  private baseUrl: string;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(baseUrl: string, sessionId: string) {
    this.baseUrl = baseUrl;
    this.sessionId = sessionId;
  }

  startHeartbeat(): void {
    // Send heartbeat every 20 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/heartbeat`, {
          method: 'POST',
          headers: {
            'mcp-session-id': this.sessionId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          console.log(`[Heartbeat] Session ${this.sessionId.slice(0, 8)}... kept alive`);
        } else {
          console.warn(`[Heartbeat] Warning: ${response.status}`);
        }
      } catch (error) {
        console.error(`[Heartbeat] Error:`, error);
      }
    }, 20000); // 20 seconds
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async longOperation(): Promise<void> {
    this.startHeartbeat();
    try {
      // Your long-running operation here
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    } finally {
      this.stopHeartbeat();
    }
  }
}

// Usage
const client = new MCPClientWithHeartbeat('https://your-server.workers.dev', 'abc123...');
await client.longOperation();
```

### Bash/cURL

```bash
#!/bin/bash

SESSION_ID="abc123..."
BASE_URL="https://your-server.workers.dev"

# Function to send heartbeat
send_heartbeat() {
    curl -X POST "$BASE_URL/heartbeat" \
        -H "mcp-session-id: $SESSION_ID" \
        -H "Content-Type: application/json" \
        -d '{}' \
        -s | jq -r '.result.message'
}

# Background heartbeat loop
heartbeat_loop() {
    while true; do
        send_heartbeat
        sleep 20
    done
}

# Start heartbeat in background
heartbeat_loop &
HEARTBEAT_PID=$!

# Your long operation here
echo "Doing long operation..."
sleep 60

# Stop heartbeat
kill $HEARTBEAT_PID
```

## Persistence & Resilience

In addition to the heartbeat mechanism, the server implements **aggressive state persistence**:

1. **After every mutating operation** (init, submit_plan, execute_step, etc.)
2. **On every heartbeat** (double safety)
3. **State is reloaded** when Durable Object starts up

This means:
- Even if a Durable Object is evicted, state is preserved in Durable Object storage
- When the next request arrives, state is automatically restored
- **Heartbeats reduce the chance of eviction** but eviction is not catastrophic

## Monitoring & Debugging

### Server Logs

The server logs heartbeat activity:

```
[MCPSession] HEARTBEAT received. Session header: abc123..., DO ID: abc123...
[MCPSession] Heartbeat keeping session abc123... alive at 2025-01-15T10:30:00.000Z
[MCPSession] State persisted successfully on heartbeat
```

### Client-Side Monitoring

Track heartbeat success/failure rates:

```python
class HeartbeatMonitor:
    def __init__(self):
        self.success_count = 0
        self.failure_count = 0
    
    def record_success(self):
        self.success_count += 1
    
    def record_failure(self):
        self.failure_count += 1
    
    def get_stats(self):
        total = self.success_count + self.failure_count
        if total == 0:
            return "No heartbeats sent"
        success_rate = (self.success_count / total) * 100
        return f"Heartbeat success rate: {success_rate:.1f}% ({self.success_count}/{total})"
```

## Best Practices

1. **Start heartbeat immediately** after session initialization
2. **Stop heartbeat** when session is no longer needed
3. **Handle heartbeat failures gracefully** - don't crash your application
4. **Log heartbeat activity** for debugging
5. **Use exponential backoff** if heartbeats start failing
6. **Don't send heartbeats too frequently** - 20 seconds is optimal

## FAQ

**Q: What happens if I don't send heartbeats?**  
A: Your session may be evicted after 30 seconds of inactivity. State is persisted, but there's a small window where requests might fail.

**Q: Can I send heartbeats more frequently?**  
A: Yes, but it's unnecessary and wastes resources. 20 seconds is optimal.

**Q: What if my heartbeat fails?**  
A: The session might be evicted, but state is persisted. Your next tool call will restore the session.

**Q: Do I need heartbeats for short operations?**  
A: No. If your operations complete within 30 seconds, heartbeats are unnecessary.

**Q: Can I use SSE instead of polling?**  
A: The current implementation uses explicit POST requests. SSE support may be added in the future.

## Related Documentation

- [Cloudflare Durable Objects Limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Parallel Reasoning Tools](./docs/parallel-reasoning.md)

