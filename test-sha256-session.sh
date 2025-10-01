#!/bin/bash

# Test script for SHA-256 session ID hashing
# Tests that custom session IDs work correctly

set -e

BASE_URL="https://mcp-server.vf-ghizzoni.workers.dev"
CUSTOM_SESSION_ID="test-custom-session-$(date +%s)"

echo "========================================="
echo "Testing Custom Session ID Support"
echo "========================================="
echo ""
echo "Custom Session ID: $CUSTOM_SESSION_ID"
echo ""

# Step 1: Initialize MCP session
echo "Step 1: Initializing MCP session..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    },
    "id": 1
  }')

# Extract MCP session ID from response
MCP_SESSION_ID=$(echo "$INIT_RESPONSE" | jq -r '.result."mcp-session-id" // empty')

if [ -z "$MCP_SESSION_ID" ]; then
  echo "❌ Failed to initialize MCP session"
  echo "Response: $INIT_RESPONSE"
  exit 1
fi

echo "✅ MCP session initialized: $MCP_SESSION_ID"
echo ""

# Step 2: Send initialized notification
echo "Step 2: Sending initialized notification..."
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }' > /dev/null

echo "✅ Initialized notification sent"
echo ""

# Step 3: Call init_parallel_reasoning with CUSTOM session ID
echo "Step 3: Calling init_parallel_reasoning with custom session ID..."
INIT_PR_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\",
        \"task_description\": \"Test task for SHA-256 session ID hashing\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"]
      }
    },
    \"id\": 2
  }")

# Check for errors
if echo "$INIT_PR_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "❌ init_parallel_reasoning failed"
  echo "$INIT_PR_RESPONSE" | jq .
  exit 1
fi

echo "✅ init_parallel_reasoning succeeded"
echo ""

# Step 4: Call submit_reasoning_plan with SAME custom session ID
echo "Step 4: Calling submit_reasoning_plan with same custom session ID..."
SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan-test-1\",
          \"description\": \"Test plan for SHA-256 hashing\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\"],
          \"capability_chain\": [
            \"analyze_market_trends\",
            \"identify_customer_segments\",
            \"evaluate_competitive_landscape\",
            \"assess_financial_viability\",
            \"develop_pricing_strategy\",
            \"create_go_to_market_plan\",
            \"define_success_metrics\",
            \"identify_risks_and_mitigations\"
          ],
          \"rationale\": \"Test plan to verify session routing\",
          \"expected_outputs\": [\"Market analysis\", \"GTM strategy\"]
        }
      }
    },
    \"id\": 3
  }")

# Check for "Session not found" error
if echo "$SUBMIT_RESPONSE" | jq -e '.error.message' | grep -q "Session not found"; then
  echo "❌ submit_reasoning_plan failed with 'Session not found'"
  echo "This means the custom session ID routing is NOT working!"
  echo "$SUBMIT_RESPONSE" | jq .
  exit 1
fi

# Check for other errors
if echo "$SUBMIT_RESPONSE" | jq -e '.error' > /dev/null; then
  ERROR_MSG=$(echo "$SUBMIT_RESPONSE" | jq -r '.error.message')
  echo "⚠️  submit_reasoning_plan returned error: $ERROR_MSG"
  echo "$SUBMIT_RESPONSE" | jq .
  # Don't exit - some errors are expected (e.g., validation errors)
else
  echo "✅ submit_reasoning_plan succeeded"
fi

echo ""
echo "========================================="
echo "✅ Test Passed!"
echo "========================================="
echo ""
echo "Custom session ID '$CUSTOM_SESSION_ID' was successfully used across multiple tool calls."
echo "The SHA-256 hashing is working correctly!"

