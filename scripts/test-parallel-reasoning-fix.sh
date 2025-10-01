#!/bin/bash

# Test script to verify parallel reasoning session persistence fixes
# This script tests the smoke test scenarios mentioned in the issue

BASE_URL="http://localhost:8787/mcp"
PR_SESSION_ID="test_session_$(date +%s)"

# Generate a valid Durable Object ID (64 hex characters)
MCP_SESSION_ID=$(echo -n "test_session_$(date +%s%N)" | sha256sum | cut -d' ' -f1)

echo "=========================================="
echo "Testing Parallel Reasoning Session Fixes"
echo "=========================================="
echo ""
echo "Parallel Reasoning Session ID: $PR_SESSION_ID"
echo "MCP Session ID (DO): $MCP_SESSION_ID"
echo ""

# Step 1: Initialize MCP session
echo "Step 1: Initializing MCP session..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
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

# Extract JSON from SSE response
INIT_JSON=$(echo "$INIT_RESPONSE" | grep "^data: " | sed 's/^data: //')
if echo "$INIT_JSON" | jq -e '.result' > /dev/null 2>&1; then
  echo "✅ MCP session initialized"
else
  echo "❌ Failed to initialize MCP session"
  echo "$INIT_JSON" | jq '.'
  exit 1
fi

echo ""

# Step 2: Initialize parallel reasoning session
echo "Step 2: Initializing parallel reasoning session..."
PR_INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\",
        \"task_description\": \"Test task for smoke testing\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 2
      }
    }
  }")

# Extract JSON from SSE response
PR_INIT_JSON=$(echo "$PR_INIT_RESPONSE" | grep "^data: " | sed 's/^data: //')
echo "$PR_INIT_JSON" | jq '.'
echo ""

# Check if init was successful
if echo "$PR_INIT_JSON" | jq -e '.result' > /dev/null 2>&1; then
  echo "✅ Parallel reasoning session initialized successfully"
else
  echo "❌ Failed to initialize parallel reasoning session"
  exit 1
fi

echo ""

# Step 3: Submit a reasoning plan
echo "Step 3: Submitting reasoning plan..."
PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_a\",
          \"description\": \"Test plan A\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\"],
          \"capability_chain\": [\"market_scan\", \"regulatory_mapping\"],
          \"rationale\": \"Testing diversity axes validation\",
          \"expected_outputs\": [\"market_analysis\", \"regulatory_compliance\"]
        }
      }
    }
  }")

# Extract JSON from SSE response
PLAN_JSON=$(echo "$PLAN_RESPONSE" | grep "^data: " | sed 's/^data: //')
echo "$PLAN_JSON" | jq '.'
echo ""

# Check if plan submission was successful
if echo "$PLAN_JSON" | jq -e '.result' > /dev/null 2>&1; then
  PLAN_TEXT=$(echo "$PLAN_JSON" | jq -r '.result.content[0].text')
  if echo "$PLAN_TEXT" | grep -q "Session not found"; then
    echo "❌ FAILED: Session not found error (Issue A - Session persistence)"
    exit 1
  elif echo "$PLAN_TEXT" | grep -q "declares only 0 axis"; then
    echo "❌ FAILED: Diversity axes validation error (Issue B - Schema drift)"
    exit 1
  elif echo "$PLAN_TEXT" | grep -q "Plan Accepted"; then
    echo "✅ Plan submitted successfully"
  else
    echo "⚠️  Plan submission response unclear"
  fi
else
  echo "❌ Failed to submit plan"
  exit 1
fi

echo ""

# Step 4: List plan status
echo "Step 4: Listing plan status..."
STATUS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_plan_status\",
      \"arguments\": {
        \"session_id\": \"$PR_SESSION_ID\"
      }
    }
  }")

# Extract JSON from SSE response
STATUS_JSON=$(echo "$STATUS_RESPONSE" | grep "^data: " | sed 's/^data: //')
echo "$STATUS_JSON" | jq '.'
echo ""

# Check if status listing was successful
if echo "$STATUS_JSON" | jq -e '.result' > /dev/null 2>&1; then
  STATUS_TEXT=$(echo "$STATUS_JSON" | jq -r '.result.content[0].text')
  if echo "$STATUS_TEXT" | grep -q "Session not found"; then
    echo "❌ FAILED: Session not found error in list_plan_status"
    exit 1
  else
    echo "✅ Plan status retrieved successfully"
  fi
else
  echo "❌ Failed to list plan status"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ ALL TESTS PASSED"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Session persistence: WORKING"
echo "- Diversity axes validation: WORKING"
echo "- Plan status listing: WORKING"
echo ""

