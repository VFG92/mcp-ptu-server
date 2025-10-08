#!/bin/bash

# Test script that simulates ChatGPT Apps SDK flow
# This demonstrates how ChatGPT would interact with the server

echo "🧪 Testing ChatGPT Apps SDK Flow"
echo "=================================="
echo ""

SERVER_URL="https://mcp-server.vf-ghizzoni.workers.dev/mcp"
SESSION_ID="apps-sdk-test-$(date +%s)"

echo "📋 Session ID: $SESSION_ID"
echo ""

# Step 1: Initialize MCP session
echo "1️⃣  Initializing MCP session..."
echo "-----------------------------------"

INIT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "chatgpt-apps-sdk",
        "version": "1.0.0"
      }
    },
    "id": 0
  }')

if echo "$INIT_RESPONSE" | grep -q '"result"'; then
  echo "✅ MCP session initialized"
else
  echo "❌ Failed to initialize MCP session"
  echo "$INIT_RESPONSE"
  exit 1
fi

echo ""

# Step 2: Call init_parallel_reasoning
echo "2️⃣  Calling init_parallel_reasoning..."
echo "-----------------------------------"

TOOL_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "parallel_session_001",
        "task_description": "Analyze market trends for Q4 2025",
        "required_diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
        "min_plans": 3
      }
    },
    "id": 1
  }')

echo "Response:"
echo "$TOOL_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'result' in data:
        result = data['result']
        
        # Check for content
        if 'content' in result:
            print('✅ content field present')
            for item in result['content']:
                if item.get('type') == 'text':
                    text = item.get('text', '')
                    print(f'   Text preview: {text[:100]}...')
        
        # Check for structuredContent
        if 'structuredContent' in result:
            print('✅ structuredContent field present')
            sc = result['structuredContent']
            print(f'   Type: {sc.get(\"type\", \"unknown\")}')
            print(f'   Session ID: {sc.get(\"session_id\", \"missing\")}')
            print(f'   Task: {sc.get(\"task_description\", \"missing\")[:50]}...')
            print(f'   Diversity Axes: {len(sc.get(\"required_diversity_axes\", []))} axes')
            print(f'   Timestamp: {sc.get(\"timestamp\", \"missing\")}')
            print('')
            print('🎉 SUCCESS: Server is returning structuredContent!')
            print('   This means the server is READY for ChatGPT Apps SDK.')
        else:
            print('❌ structuredContent field NOT present')
            print('   The server may not be configured correctly.')
    elif 'error' in data:
        print(f'❌ Error: {data[\"error\"].get(\"message\", \"unknown\")}')
    else:
        print('❌ Unexpected response format')
        print(json.dumps(data, indent=2)[:500])
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
    print(sys.stdin.read()[:500])
"

echo ""
echo "=================================="
echo ""
echo "📊 Summary"
echo "-----------------------------------"
echo ""
echo "This test simulates how ChatGPT would interact with the server:"
echo "1. Initialize MCP session with a session ID"
echo "2. Call tools using the same session ID"
echo ""
echo "If structuredContent is present, the server is ready for Apps SDK."
echo "The UI will appear automatically when:"
echo "- You have access to ChatGPT Apps SDK beta"
echo "- ChatGPT recognizes the structuredContent field"
echo "- UI resources are loaded from mcp://ui/* URIs"
echo ""
echo "For more info, see: APPS_SDK_STATUS.md"
echo ""

