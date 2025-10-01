#!/bin/bash

# Test session persistence with delays (simulating ChatGPT thinking)
# This verifies that the DO stays alive during long idle periods

SERVER_URL="http://localhost:34835/mcp"
SESSION_ID="test-timeout-$(date +%s)"

echo "=========================================="
echo "Testing Session Timeout Resilience"
echo "=========================================="
echo "Session ID: $SESSION_ID"
echo ""

# Step 1: Initialize MCP
echo "Step 1: Initialize MCP..."
INIT_RESPONSE=$(curl -si -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"initialize\",
    \"params\": {
      \"protocolVersion\": \"2024-11-05\",
      \"capabilities\": {},
      \"clientInfo\": {
        \"name\": \"test-client\",
        \"version\": \"1.0.0\"
      }
    }
  }")

DO_SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id:" | awk '{print $2}' | tr -d '\r')
if [ -z "$DO_SESSION_ID" ]; then
  echo "❌ Failed to extract DO session ID"
  echo "$INIT_RESPONSE" | head -20
  exit 1
fi
echo "✅ MCP initialized"
echo "DO Session ID: ${DO_SESSION_ID:0:16}..."
echo ""

# Step 2: Init parallel reasoning
echo "Step 2: Init parallel reasoning..."
INIT_PR_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $DO_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"task_description\": \"Test task with delay\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    }
  }")

if echo "$INIT_PR_RESPONSE" | grep -q "Session Initialized Successfully"; then
  echo "✅ Parallel reasoning initialized"
else
  echo "❌ Failed to initialize"
  exit 1
fi
echo ""

# Step 3: Wait 180 seconds (3 minutes - simulating ChatGPT deep thinking)
echo "Step 3: Waiting 180 seconds / 3 minutes (simulating ChatGPT thinking)..."
for i in {180..1}; do
  echo -ne "   Waiting: $i seconds remaining...\r"
  sleep 1
done
echo ""
echo "✅ Wait complete"
echo ""

# Step 4: Submit plan (should still work if alarm keeps DO alive)
echo "Step 4: Submit reasoning plan after delay..."
SUBMIT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $DO_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_A\",
          \"description\": \"Test plan after delay\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\", \"time_horizons\"],
          \"capability_chain\": [
            \"market_scan\",
            \"tam_sam_som_build\",
            \"competitor_analysis\",
            \"customer_segmentation_clustering\",
            \"pricing_analysis_elasticity\",
            \"market_sizing_regression\",
            \"growth_forecast_arima\",
            \"market_share_analysis\"
          ],
          \"rationale\": \"Test rationale\",
          \"expected_outputs\": [\"market_map\"]
        }
      }
    }
  }")

if echo "$SUBMIT_RESPONSE" | grep -q "Plan Accepted"; then
  echo "✅ Plan submitted successfully after 180s (3 min) delay"
  echo ""
  echo "=========================================="
  echo "✅ SESSION PERSISTENCE WORKS!"
  echo "=========================================="
  echo "The DO state is persisted to storage and"
  echo "restored after eviction (70-140s timeout)."
  echo "ChatGPT can think for 3+ minutes safely!"
elif echo "$SUBMIT_RESPONSE" | grep -q "Session not found"; then
  echo "❌ Session not found after delay!"
  echo ""
  echo "=========================================="
  echo "❌ SESSION PERSISTENCE ISSUE!"
  echo "=========================================="
  echo "The DO was evicted and state was not restored."
  echo "Check loadParallelReasoningV5Sessions() call."
  echo ""
  echo "Response:"
  echo "$SUBMIT_RESPONSE" | head -30
  exit 1
else
  echo "❌ Unexpected response"
  echo "$SUBMIT_RESPONSE" | head -30
  exit 1
fi

