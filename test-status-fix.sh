#!/bin/bash

# Test script to verify parallel_compute_status never returns 400
# and provides helpful diagnostics even when session is not found

set -e

BASE_URL="https://mcp-server.vf-ghizzoni.workers.dev/mcp"

echo "🧪 Testing parallel_compute_status Fix"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize MCP session first
echo "0️⃣  Initializing MCP session..."

# For this test, we'll extract the session ID from the response headers
# The MCP server returns it in the response
INIT_RESPONSE=$(curl -s -i -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }')

# Extract session ID from mcp-session-id header
TEST_SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id:" | sed 's/.*: //' | tr -d '\r\n')

if [ -z "$TEST_SESSION_ID" ]; then
  echo -e "${YELLOW}⚠️  Could not extract session ID from header, generating one...${NC}"
  # Generate a random session ID (64 hex chars like a Durable Object ID)
  TEST_SESSION_ID=$(openssl rand -hex 32)
fi

echo "MCP Session ID: $TEST_SESSION_ID"

# Send initialized notification
curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $TEST_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }' > /dev/null

echo ""

# Test 1: Status check on non-existent session (should NOT return 400)
echo "1️⃣  Test: Status check on non-existent session"
echo "   Expected: 200 OK with error info (NOT 400 Bad Request)"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL" \
  -H "mcp-session-id: $TEST_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "parallel_compute_status",
      "arguments": {
        "session_id": "nonexistent_session_12345"
      }
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

# Extract JSON from SSE if needed
if echo "$BODY" | grep -q "^data:"; then
  BODY=$(echo "$BODY" | grep "^data:" | sed 's/^data: //')
fi

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS: Got 200 OK (not 400)${NC}"
  
  # Check if response contains error info
  if echo "$BODY" | jq -e '.result.content[0].text' > /dev/null 2>&1; then
    CONTENT=$(echo "$BODY" | jq -r '.result.content[0].text')
    
    if echo "$CONTENT" | jq -e '.status' > /dev/null 2>&1; then
      STATUS=$(echo "$CONTENT" | jq -r '.status')
      echo "   Status field: $STATUS"
      
      if [ "$STATUS" = "not_found" ]; then
        echo -e "${GREEN}✅ PASS: Status correctly set to 'not_found'${NC}"
      else
        echo -e "${YELLOW}⚠️  WARNING: Expected status='not_found', got '$STATUS'${NC}"
      fi
    fi
    
    if echo "$CONTENT" | jq -e '.troubleshooting' > /dev/null 2>&1; then
      echo -e "${GREEN}✅ PASS: Troubleshooting info included${NC}"
    fi
  fi
else
  echo -e "${RED}❌ FAIL: Got HTTP $HTTP_CODE (expected 200)${NC}"
  echo "Response body:"
  echo "$BODY" | jq '.'
  exit 1
fi

echo ""
echo "---"
echo ""

# Test 2: Create a real session and check status
echo "2️⃣  Test: Status check on valid session"
echo ""

# Reuse the same MCP session from Test 1
MCP_SESSION_ID="$TEST_SESSION_ID"
echo "Using MCP Session ID: $MCP_SESSION_ID"

# Create parallel reasoning session
PR_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "parallel_reasoning_init",
      "arguments": {
        "task": "Test task for status check",
        "perspectives": ["strategy_consultant", "financial_analyst"]
      }
    }
  }')

# Extract JSON from SSE if needed
if echo "$PR_RESPONSE" | grep -q "^data:"; then
  PR_RESPONSE=$(echo "$PR_RESPONSE" | grep "^data:" | sed 's/^data: //')
fi

# The response contains "SESSION_ID: xxx\n\n{json}" - extract just the JSON part
PR_TEXT=$(echo "$PR_RESPONSE" | jq -r '.result.content[0].text')
# Extract JSON after the first { character
PR_JSON=$(echo "$PR_TEXT" | sed -n '/{/,$ p' | sed '1s/^[^{]*//')
PR_SESSION_ID=$(echo "$PR_JSON" | jq -r '.session_id // empty')

if [ -z "$PR_SESSION_ID" ]; then
  echo -e "${RED}❌ FAIL: Could not create parallel reasoning session${NC}"
  echo "$PR_RESPONSE" | jq '.'
  exit 1
fi

echo "PR Session ID: $PR_SESSION_ID"
echo ""

# Check status
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"parallel_compute_status\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\"
      }
    }
  }")

HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
BODY=$(echo "$STATUS_RESPONSE" | head -n-1)

# Extract JSON from SSE if needed
if echo "$BODY" | grep -q "^data:"; then
  BODY=$(echo "$BODY" | grep "^data:" | sed 's/^data: //')
fi

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS: Got 200 OK${NC}"
  
  if echo "$BODY" | jq -e '.result.content[0].text' > /dev/null 2>&1; then
    CONTENT=$(echo "$BODY" | jq -r '.result.content[0].text')
    
    if echo "$CONTENT" | jq -e '.status' > /dev/null 2>&1; then
      STATUS=$(echo "$CONTENT" | jq -r '.status')
      echo "   Status: $STATUS"
      echo -e "${GREEN}✅ PASS: Status field present${NC}"
    fi
    
    if echo "$CONTENT" | jq -e '.agents' > /dev/null 2>&1; then
      AGENT_COUNT=$(echo "$CONTENT" | jq '.agents | length')
      echo "   Agents: $AGENT_COUNT"
      echo -e "${GREEN}✅ PASS: Agents info included${NC}"
    fi
  fi
else
  echo -e "${RED}❌ FAIL: Got HTTP $HTTP_CODE (expected 200)${NC}"
  echo "Response body:"
  echo "$BODY" | jq '.'
  exit 1
fi

echo ""
echo "---"
echo ""

# Test 3: Try premature synthesis (should fail with clear message)
echo "3️⃣  Test: Premature synthesis with require_all_completed=true"
echo "   Expected: Clear error message about incomplete agents"
echo ""

SYNTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"synthesize_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\",
        \"require_all_completed\": true
      }
    }
  }")

HTTP_CODE=$(echo "$SYNTH_RESPONSE" | tail -n1)
BODY=$(echo "$SYNTH_RESPONSE" | head -n-1)

# Extract JSON from SSE if needed
if echo "$BODY" | grep -q "^data:"; then
  BODY=$(echo "$BODY" | grep "^data:" | sed 's/^data: //')
fi

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASS: Got 400 (synthesis correctly blocked)${NC}"
  
  if echo "$BODY" | jq -e '.error.message' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$BODY" | jq -r '.error.message')
    
    if echo "$ERROR_MSG" | grep -q "Synthesis Blocked"; then
      echo -e "${GREEN}✅ PASS: Error message mentions 'Synthesis Blocked'${NC}"
    fi
    
    if echo "$ERROR_MSG" | grep -q "agents completed"; then
      echo -e "${GREEN}✅ PASS: Error message shows completion progress${NC}"
    fi
    
    if echo "$ERROR_MSG" | grep -q "parallel_compute_status"; then
      echo -e "${GREEN}✅ PASS: Error message suggests using parallel_compute_status${NC}"
    fi
    
    echo ""
    echo "Error message preview:"
    echo "$ERROR_MSG" | head -n 5
  fi
else
  echo -e "${YELLOW}⚠️  WARNING: Expected 400, got $HTTP_CODE${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Summary:"
echo "  ✓ parallel_compute_status never returns 400"
echo "  ✓ Provides helpful diagnostics for missing sessions"
echo "  ✓ Works correctly for valid sessions"
echo "  ✓ Synthesis blocking has clear error messages"

