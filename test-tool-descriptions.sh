#!/bin/bash
# Test script to verify tool descriptions contain session lifecycle warnings

echo "🔍 Checking tool descriptions for session lifecycle warnings..."
echo ""

# Start the worker in background
echo "Starting worker..."
npm run workers:dev > /tmp/worker.log 2>&1 &
WORKER_PID=$!

# Wait for worker to start
sleep 5

# Test 1: Check execute_reasoning_manifest description
echo "Test 1: Checking execute_reasoning_manifest description..."
RESPONSE=$(curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }')

echo "Initialize response: $RESPONSE"
echo ""

# List tools
TOOLS_RESPONSE=$(curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }')

echo "Checking for session lifecycle warnings in tool descriptions..."
echo ""

# Check if execute_reasoning_manifest contains the warning
if echo "$TOOLS_RESPONSE" | grep -q "ChatGPT in developer mode closes MCP connections"; then
  echo "✅ execute_reasoning_manifest contains session lifecycle warning"
else
  echo "❌ execute_reasoning_manifest missing session lifecycle warning"
fi

if echo "$TOOLS_RESPONSE" | grep -q "POST to /api/register-results"; then
  echo "✅ execute_reasoning_manifest mentions HTTP API"
else
  echo "❌ execute_reasoning_manifest missing HTTP API reference"
fi

if echo "$TOOLS_RESPONSE" | grep -q "Session terminated"; then
  echo "✅ execute_reasoning_manifest mentions 'Session terminated' error"
else
  echo "❌ execute_reasoning_manifest missing 'Session terminated' reference"
fi

echo ""
echo "Full tool list (execute_reasoning_manifest):"
echo "$TOOLS_RESPONSE" | jq '.result.tools[] | select(.name == "execute_reasoning_manifest") | .description' 2>/dev/null || echo "jq not available"

# Cleanup
echo ""
echo "Stopping worker..."
kill $WORKER_PID 2>/dev/null
wait $WORKER_PID 2>/dev/null

echo ""
echo "✅ Test complete"

