#!/bin/bash
# Test script for common HTTP errors
# Usage: ./scripts/test-http-errors.sh [server_url]

SERVER_URL="${1:-http://localhost:8787/mcp}"
SESSION_ID="test-http-errors-$(date +%s)"

echo "=========================================="
echo "MCP PTU Server - HTTP Error Tests"
echo "=========================================="
echo "Server: $SERVER_URL"
echo "Session ID: $SESSION_ID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Missing Accept header (should get 406)
echo "=========================================="
echo "TEST 1: Missing Accept header (expect 406)"
echo "=========================================="
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "406" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Got expected 406 Not Acceptable"
  echo "Response: $BODY"
else
  echo -e "${RED}❌ FAIL${NC}: Expected 406, got $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Correct initialization
echo "=========================================="
echo "TEST 2: Correct initialization (expect 200)"
echo "=========================================="
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Got expected 200 OK"
  # Extract MCP session ID from response
  MCP_SESSION_ID=$(echo "$BODY" | grep -o '"mcp-session-id":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$MCP_SESSION_ID" ]; then
    echo "MCP Session ID: ${MCP_SESSION_ID:0:16}..."
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Expected 200, got $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Tool call without initialization (should get 400)
echo "=========================================="
echo "TEST 3: Tool call without init (expect 400)"
echo "=========================================="
NEW_SESSION_ID="test-no-init-$(date +%s)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $NEW_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test-session",
        "task_description": "Test",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Got expected 400 Bad Request"
  echo "Response: $BODY"
else
  echo -e "${RED}❌ FAIL${NC}: Expected 400, got $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 4: Invalid diversity axes (should get validation error)
echo "=========================================="
echo "TEST 4: Invalid diversity axes (expect validation error)"
echo "=========================================="
# Note: This test uses the initialized session from Test 2
RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test-validation",
        "task_description": "Test",
        "required_diversity_axes": ["invalid_axis"],
        "min_plans": 3
      }
    }
  }' 2>&1)

if echo "$RESPONSE" | grep -q "Validation Error\|Invalid enum value"; then
  echo -e "${GREEN}✅ PASS${NC}: Got expected validation error"
  echo "Response excerpt: $(echo "$RESPONSE" | grep -o 'Validation Error[^}]*\|Invalid enum[^}]*' | head -1)"
else
  echo -e "${YELLOW}⚠️  UNEXPECTED${NC}: Response doesn't contain validation error"
  echo "Response: ${RESPONSE:0:200}..."
fi
echo ""

# Test 5: Too few diversity axes (should get validation error)
echo "=========================================="
echo "TEST 5: Too few diversity axes (expect validation error)"
echo "=========================================="
RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test-too-few",
        "task_description": "Test",
        "required_diversity_axes": ["data_sources"],
        "min_plans": 3
      }
    }
  }' 2>&1)

if echo "$RESPONSE" | grep -q "Validation Error\|at least 2"; then
  echo -e "${GREEN}✅ PASS${NC}: Got expected validation error for too few axes"
  echo "Response excerpt: $(echo "$RESPONSE" | grep -o 'Validation Error[^}]*\|at least 2[^}]*' | head -1)"
else
  echo -e "${YELLOW}⚠️  UNEXPECTED${NC}: Response doesn't contain validation error"
  echo "Response: ${RESPONSE:0:200}..."
fi
echo ""

# Test 6: Successful parallel reasoning init
echo "=========================================="
echo "TEST 6: Successful parallel reasoning init (expect 200)"
echo "=========================================="
RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test-success",
        "task_description": "Test task for validation",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    }
  }' 2>&1)

if echo "$RESPONSE" | grep -q "Session Initialized\|Parallel Reasoning Session Initialized"; then
  echo -e "${GREEN}✅ PASS${NC}: Successfully initialized parallel reasoning session"
  echo "Response excerpt: $(echo "$RESPONSE" | grep -o 'Session Initialized[^}]*' | head -1)"
else
  echo -e "${RED}❌ FAIL${NC}: Failed to initialize parallel reasoning"
  echo "Response: ${RESPONSE:0:300}..."
fi
echo ""

# Summary
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "All tests completed. Check results above."
echo ""
echo "For more details, see:"
echo "  - TROUBLESHOOTING.md for error solutions"
echo "  - README.md for correct usage examples"
echo "  - test_mcp_client.py for full end-to-end test"
echo "=========================================="

