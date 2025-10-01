# Session ID Explained

## ⚠️ CRITICAL: Two Different Session IDs

There are **TWO DIFFERENT** session IDs in this system, and confusing them will cause 400 Bad Request errors:

### 1. MCP Session ID (Durable Object Routing)
- **Purpose**: Routes HTTP requests to the correct Durable Object instance
- **Where**: HTTP header `mcp-session-id`
- **When**: Returned by server in `initialize` response header
- **Format**: 64-character hexadecimal string (e.g., `9fee91d4027723e9af337bac227e882c8d142c84978ac9f404cd72e8dd028695`)
- **Lifetime**: Entire MCP connection (from `initialize` to disconnect)
- **Usage**: Include in EVERY HTTP request after `initialize`

### 2. Parallel Reasoning Session ID (Application Logic)
- **Purpose**: Identifies a specific parallel reasoning workflow within the Durable Object
- **Where**: Tool argument `session_id` in `init_parallel_reasoning` and other parallel reasoning tools
- **When**: You choose it when calling `init_parallel_reasoning`
- **Format**: Any string you want (e.g., `"analysis_001"`, `"my_workflow"`, `"session_abc"`)
- **Lifetime**: One parallel reasoning workflow (from `init` to `finalize`)
- **Usage**: Same value for all parallel reasoning tools in ONE workflow

## ❌ Common Mistake (Causes 400 Bad Request)

```python
# WRONG: Using parallel reasoning session_id for routing
response = requests.post('https://mcp-server.vf-ghizzoni.workers.dev/mcp',
    headers={
        'mcp-session-id': 'my_analysis_001'  # ❌ WRONG! This is not a valid DO ID
    },
    json={
        'method': 'tools/call',
        'params': {
            'name': 'init_parallel_reasoning',
            'arguments': {
                'session_id': 'my_analysis_001'  # This is fine for parallel reasoning
            }
        }
    }
)
```

**Result**: Server tries to route to Durable Object with ID `"my_analysis_001"`, which doesn't exist → 400 Bad Request

## ✅ Correct Usage

```python
# Step 1: Initialize MCP connection
response = requests.post('https://mcp-server.vf-ghizzoni.workers.dev/mcp',
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
    },
    json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'initialize',
        'params': {
            'protocolVersion': '2025-03-26',
            'capabilities': {},
            'clientInfo': {'name': 'my-client', 'version': '1.0'}
        }
    },
    stream=True
)

# Extract MCP session ID from response header
mcp_session_id = response.headers.get('mcp-session-id')
# Example: "9fee91d4027723e9af337bac227e882c8d142c84978ac9f404cd72e8dd028695"

# Step 2: Send notifications/initialized
requests.post('https://mcp-server.vf-ghizzoni.workers.dev/mcp',
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': mcp_session_id  # ✅ Use MCP session ID for routing
    },
    json={
        'jsonrpc': '2.0',
        'method': 'notifications/initialized'
    }
)

# Step 3: Initialize parallel reasoning
response = requests.post('https://mcp-server.vf-ghizzoni.workers.dev/mcp',
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': mcp_session_id  # ✅ Use MCP session ID for routing
    },
    json={
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'tools/call',
        'params': {
            'name': 'init_parallel_reasoning',
            'arguments': {
                'session_id': 'my_analysis_001',  # ✅ Your custom parallel reasoning ID
                'task_description': 'Analyze market opportunity',
                'required_diversity_axes': ['data_sources', 'analytical_models']
            }
        }
    },
    stream=True
)

# Step 4: Submit reasoning plan
response = requests.post('https://mcp-server.vf-ghizzoni.workers.dev/mcp',
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': mcp_session_id  # ✅ SAME MCP session ID
    },
    json={
        'jsonrpc': '2.0',
        'id': 3,
        'method': 'tools/call',
        'params': {
            'name': 'submit_reasoning_plan',
            'arguments': {
                'session_id': 'my_analysis_001',  # ✅ SAME parallel reasoning ID
                'plan': {
                    'plan_id': 'plan_A',
                    'description': 'Market analysis',
                    'diversity_axes': ['data_sources', 'analytical_models'],
                    'capability_chain': ['market_scan', 'tam_sam_som_build', ...],
                    'rationale': 'Quantitative approach',
                    'expected_outputs': ['market_size', 'growth_rate']
                }
            }
        }
    },
    stream=True
)
```

## 📊 Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request                                                 │
├─────────────────────────────────────────────────────────────┤
│ Headers:                                                     │
│   mcp-session-id: 9fee91d4027723e9...  ← MCP Session ID    │
│                                          (Durable Object)    │
│                                                              │
│ Body:                                                        │
│   {                                                          │
│     "method": "tools/call",                                  │
│     "params": {                                              │
│       "name": "init_parallel_reasoning",                     │
│       "arguments": {                                         │
│         "session_id": "my_analysis_001"  ← Parallel         │
│                                            Reasoning ID      │
│       }                                                      │
│     }                                                        │
│   }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Why Two Session IDs?

1. **MCP Session ID**: Infrastructure-level routing
   - Cloudflare needs to know which Durable Object instance to send the request to
   - This is like a "server address" - you can't make it up
   - Server generates it during `initialize` and you must use it

2. **Parallel Reasoning Session ID**: Application-level logic
   - Your workflow might have multiple parallel reasoning sessions
   - You can have `"analysis_001"`, `"analysis_002"`, etc. in the SAME Durable Object
   - This is like a "document name" - you choose it

## 🐛 Debugging 400 Bad Request

If you get 400 Bad Request when calling `init_parallel_reasoning`:

1. **Check**: Are you using the MCP session ID from `initialize` response header?
2. **Check**: Are you including `Accept: application/json, text/event-stream` header?
3. **Check**: Did you send `notifications/initialized` after `initialize`?
4. **Check**: Are you using the SAME `mcp-session-id` header for all requests?

## 📝 For ChatGPT Integration

When ChatGPT calls your MCP server:

1. ChatGPT calls `initialize` → Server returns `mcp-session-id` in header
2. ChatGPT stores this `mcp-session-id` and uses it for ALL subsequent requests
3. When ChatGPT calls `init_parallel_reasoning`, it:
   - Uses `mcp-session-id` header for routing (from step 1)
   - Chooses its own `session_id` argument for the parallel reasoning workflow

**The two IDs are completely independent!**

## 🎯 Key Takeaway

```
mcp-session-id (header)     = WHERE to route the request (Durable Object)
session_id (argument)       = WHAT workflow to work on (Parallel Reasoning)
```

**Never confuse them!**

