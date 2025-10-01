#!/bin/bash

# Manual test script for heartbeat endpoint
# This script tests the /heartbeat endpoint functionality

set -e

BASE_URL="${BASE_URL:-https://mcp-server.vf-ghizzoni.workers.dev}"
SESSION_ID=""

echo "🧪 Testing Heartbeat Endpoint"
echo "================================"
echo ""

# Test 1: Heartbeat without session (should fail)
echo "Test 1: Heartbeat without session initialization"
echo "-------------------------------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Session not initialized"; then
  echo "✅ Test 1 PASSED: Correctly rejected heartbeat without session"
else
  echo "❌ Test 1 FAILED: Should reject heartbeat without session"
  exit 1
fi
echo ""

# Test 2: Initialize session
echo "Test 2: Initialize MCP session"
echo "-------------------------------"
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "heartbeat-test",
        "version": "1.0.0"
      }
    },
    "id": 1
  }')

# Extract session ID from response header
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id" | cut -d: -f2 | tr -d ' \r\n' || true)

if [ -z "$SESSION_ID" ]; then
  # Try to extract from response body if header not available
  echo "Note: Could not extract session ID from header, trying body..."
  echo "Response: $INIT_RESPONSE"
  echo ""
  echo "⚠️  Manual session ID required for remaining tests"
  echo "Please run: export SESSION_ID=<your-session-id>"
  exit 0
fi

echo "Session ID: $SESSION_ID"
echo "✅ Test 2 PASSED: Session initialized"
echo ""

# Test 3: Send valid heartbeat
echo "Test 3: Send valid heartbeat"
echo "-----------------------------"
HEARTBEAT_RESPONSE=$(curl -s -X POST "$BASE_URL/heartbeat" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{}')

echo "Response: $HEARTBEAT_RESPONSE"
if echo "$HEARTBEAT_RESPONSE" | grep -q "Heartbeat acknowledged"; then
  echo "✅ Test 3 PASSED: Heartbeat accepted"
else
  echo "❌ Test 3 FAILED: Heartbeat should be accepted"
  exit 1
fi
echo ""

# Test 4: Send heartbeat with wrong session ID
echo "Test 4: Send heartbeat with wrong session ID"
echo "---------------------------------------------"
WRONG_RESPONSE=$(curl -s -X POST "$BASE_URL/heartbeat" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: wrong-session-id-123" \
  -d '{}')

echo "Response: $WRONG_RESPONSE"
if echo "$WRONG_RESPONSE" | grep -q "Session ID mismatch\|Invalid session ID format"; then
  echo "✅ Test 4 PASSED: Correctly rejected wrong session ID"
else
  echo "❌ Test 4 FAILED: Should reject wrong session ID"
  exit 1
fi
echo ""

# Test 5: Multiple heartbeats (simulate keep-alive)
echo "Test 5: Multiple heartbeats (simulating keep-alive)"
echo "----------------------------------------------------"
for i in {1..3}; do
  echo "Sending heartbeat $i/3..."
  MULTI_RESPONSE=$(curl -s -X POST "$BASE_URL/heartbeat" \
    -H "Content-Type: application/json" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{}')
  
  if echo "$MULTI_RESPONSE" | grep -q "Heartbeat acknowledged"; then
    echo "  ✅ Heartbeat $i accepted"
  else
    echo "  ❌ Heartbeat $i failed"
    exit 1
  fi
  
  # Wait 2 seconds between heartbeats
  if [ $i -lt 3 ]; then
    sleep 2
  fi
done
echo "✅ Test 5 PASSED: Multiple heartbeats successful"
echo ""

# Test 6: Verify session still alive after heartbeats
echo "Test 6: Verify session still alive after heartbeats"
echo "----------------------------------------------------"
LIST_TOOLS_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }')

if echo "$LIST_TOOLS_RESPONSE" | grep -q "init_parallel_reasoning"; then
  echo "✅ Test 6 PASSED: Session still alive and functional"
else
  echo "❌ Test 6 FAILED: Session should still be alive"
  echo "Response: $LIST_TOOLS_RESPONSE"
  exit 1
fi
echo ""

echo "================================"
echo "🎉 All heartbeat tests PASSED!"
echo "================================"
echo ""
echo "Summary:"
echo "  ✅ Heartbeat rejected without session"
echo "  ✅ Session initialization successful"
echo "  ✅ Valid heartbeat accepted"
echo "  ✅ Invalid session ID rejected"
echo "  ✅ Multiple heartbeats successful"
echo "  ✅ Session remains alive after heartbeats"
echo ""
echo "Session ID for manual testing: $SESSION_ID"

