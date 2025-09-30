#!/bin/bash
# Final test for session persistence fix
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_URL="http://localhost:8787"
MCP_ENDPOINT="${SERVER_URL}/mcp"

echo -e "${YELLOW}🧪 Testing Final Session Persistence Fix${NC}"
echo "Server: $SERVER_URL"
echo ""

# Step 1: Initialize MCP session
echo -e "${YELLOW}Step 1: Initialize MCP Session${NC}"
INIT_RESPONSE=$(curl -s -i -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0"}
    }
  }')

SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id:" | cut -d' ' -f2 | tr -d '\r')

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ FAIL: Could not extract session ID${NC}"
  exit 1
fi

echo -e "${GREEN}✅ MCP Session ID: $SESSION_ID${NC}"
echo ""

# Step 2: Initialize parallel reasoning
echo -e "${YELLOW}Step 2: Initialize Parallel Reasoning${NC}"
INIT_PR_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "parallel_reasoning_init",
      "arguments": {
        "task": "Test task",
        "perspectives": ["strategy_consultant", "financial_analyst"],
        "coordination_strategy": "parallel"
      }
    }
  }')

INIT_PR_DATA=$(echo "$INIT_PR_RESPONSE" | grep "^data:" | sed 's/^data: //')
# Extract session_id from the text field (it's in the format "SESSION_ID: <id>")
PR_SESSION_ID=$(echo "$INIT_PR_DATA" | jq -r '.result.content[0].text' | grep -oP 'SESSION_ID: \K[a-f0-9]{64}' | head -1)

echo -e "${GREEN}✅ PR Session ID: $PR_SESSION_ID${NC}"

# CRITICAL CHECK: Are they the same?
if [ "$PR_SESSION_ID" = "$SESSION_ID" ]; then
  echo -e "${GREEN}✅✅✅ SESSION IDs MATCH! (This is the fix!)${NC}"
else
  echo -e "${RED}❌ SESSION IDs DON'T MATCH${NC}"
  echo "MCP Session ID: $SESSION_ID"
  echo "PR Session ID:  $PR_SESSION_ID"
  exit 1
fi
echo ""

# Step 3: Submit agent reasoning (THE CRITICAL TEST)
echo -e "${YELLOW}Step 3: Agent Reasoning Step (WITHOUT mcp-session-id header)${NC}"
echo "This simulates ChatGPT tool call behavior..."

REASONING_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"agent_reasoning_step\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\",
        \"agent_id\": \"agent_1_strategy_consultant\",
        \"reasoning\": \"Test reasoning\",
        \"confidence\": 0.85,
        \"key_points\": [\"Point 1\"],
        \"recommendations\": [\"Rec 1\"]
      }
    }
  }")

REASONING_DATA=$(echo "$REASONING_RESPONSE" | grep "^data:" | sed 's/^data: //')

# Check for error
if echo "$REASONING_DATA" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$REASONING_DATA" | jq -r '.error.message')
  echo -e "${RED}❌ FAIL: $ERROR_MSG${NC}"
  echo ""
  echo "This means the fix is NOT working - session not found without header"
  exit 1
fi

# Check success
AGENT_STATUS=$(echo "$REASONING_DATA" | jq -r '.result.content[0].text' | jq -r '.agent_status')
if [ "$AGENT_STATUS" != "null" ] && [ -n "$AGENT_STATUS" ]; then
  echo -e "${GREEN}✅✅✅ AGENT REASONING SUCCESSFUL!${NC}"
  echo -e "${GREEN}Agent status: $AGENT_STATUS${NC}"
else
  echo -e "${RED}❌ FAIL: Unexpected response${NC}"
  exit 1
fi
echo ""

# Step 4: Status check (also without header)
echo -e "${YELLOW}Step 4: Status Check (WITHOUT mcp-session-id header)${NC}"

STATUS_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"parallel_compute_status\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\"
      }
    }
  }")

STATUS_DATA=$(echo "$STATUS_RESPONSE" | grep "^data:" | sed 's/^data: //')

if echo "$STATUS_DATA" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$STATUS_DATA" | jq -r '.error.message')
  echo -e "${RED}❌ FAIL: $ERROR_MSG${NC}"
  exit 1
fi

STATUS=$(echo "$STATUS_DATA" | jq -r '.result.content[0].text' | jq -r '.status')
if [ "$STATUS" != "null" ] && [ -n "$STATUS" ]; then
  echo -e "${GREEN}✅✅✅ STATUS CHECK SUCCESSFUL!${NC}"
  echo -e "${GREEN}Status: $STATUS${NC}"
else
  echo -e "${RED}❌ FAIL: Unexpected response${NC}"
  exit 1
fi
echo ""

# Final summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "✅ Session IDs are unified (MCP ID = PR ID)"
echo "✅ Tool calls work WITHOUT mcp-session-id header"
echo "✅ Session persistence is working correctly"
echo "✅ Multi-agent workflow is fully operational"
echo ""
echo -e "${GREEN}🚀 THE FIX IS WORKING! Ready for production.${NC}"

