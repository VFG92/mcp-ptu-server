#!/bin/bash

# Simple production test for Parallel Reasoning v5.0
# Tests session persistence with proper MCP protocol handling

set -e

SERVER_URL="${SERVER_URL:-https://mcp-server.vf-ghizzoni.workers.dev/mcp}"
SESSION_ID="prod_test_$(date +%s)"

echo "========================================="
echo "Production Test - Parallel Reasoning v5.0"
echo "========================================="
echo ""
echo "Server: $SERVER_URL"
echo "Session: $SESSION_ID"
echo ""

# Function to extract JSON from SSE response
extract_json() {
    grep "^data: " | sed 's/^data: //' | jq -r "$1"
}

# Step 1: Initialize MCP session and capture session ID
echo "→ Step 1: Initialize MCP session"
INIT_RESPONSE=$(curl -s -i -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }')

# Extract mcp-session-id from headers
MCP_SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id:" | sed 's/.*: //' | tr -d '\r\n')

if [ -z "$MCP_SESSION_ID" ]; then
    echo "✗ Failed to get mcp-session-id from response"
    echo "$INIT_RESPONSE"
    exit 1
fi

echo "✓ MCP session initialized: $MCP_SESSION_ID"

# Step 1.5: Send initialized notification
echo "→ Step 1.5: Send initialized notification"
curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized",
    "params": {}
  }' > /dev/null

echo "✓ Initialized notification sent"

sleep 1

# Step 2: Initialize parallel reasoning
echo ""
echo "→ Step 2: Initialize parallel reasoning"
PR_INIT=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"task_description\": \"Test production deployment\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    },
    \"id\": 2
  }")

if echo "$PR_INIT" | grep -q "Session Initialized"; then
    echo "✓ Parallel reasoning session initialized"
else
    echo "✗ Failed to initialize parallel reasoning"
    echo "$PR_INIT" | extract_json '.result.content[0].text // .error.message // .'
    exit 1
fi

sleep 2

# Step 3: Submit Plan A
echo ""
echo "→ Step 3: Submit Plan A"
PLAN_A=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_A\",
          \"description\": \"Data-driven baseline\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\", \"time_horizons\"],
          \"capability_chain\": [
            \"market_scan\", \"tam_sam_som_build\", \"competitor_analysis\",
            \"customer_segmentation\", \"wtp_analysis\", \"gtm_playbook\",
            \"dcf_modeler\", \"scenario_forecasting\"
          ],
          \"rationale\": \"Baseline using official statistics\",
          \"expected_outputs\": [\"market_map\", \"tam_sam_som\"]
        }
      }
    },
    \"id\": 3
  }")

if echo "$PLAN_A" | grep -q "Plan Accepted"; then
    echo "✓ Plan A accepted"
else
    echo "✗ Plan A rejected"
    echo "$PLAN_A" | extract_json '.result.content[0].text // .error.message // .'
    exit 1
fi

sleep 2

# Step 4: Submit Plan B
echo ""
echo "→ Step 4: Submit Plan B"
PLAN_B=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_B\",
          \"description\": \"Probabilistic modeling\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\", \"risk_perspectives\"],
          \"capability_chain\": [
            \"market_scan\", \"monte_carlo_finance\", \"scenario_wargaming\",
            \"geostrategic_risk_scan\", \"regulatory_scan_enhanced\", \"compliance_gap_assessment\",
            \"cybersecurity_risk_model\", \"risk_assessment\"
          ],
          \"rationale\": \"Monte Carlo simulations with risk assessment\",
          \"expected_outputs\": [\"market_map\", \"monte_carlo_results\"]
        }
      }
    },
    \"id\": 4
  }")

if echo "$PLAN_B" | grep -q "Plan Accepted"; then
    echo "✓ Plan B accepted"
else
    echo "✗ Plan B rejected"
    echo "$PLAN_B" | extract_json '.result.content[0].text // .error.message // .'
    exit 1
fi

sleep 2

# Step 5: Check session status
echo ""
echo "→ Step 5: Check session status"
STATUS=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_plan_status\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\"
      }
    },
    \"id\": 5
  }")

PLAN_COUNT=$(echo "$STATUS" | extract_json '.result.content[0].text' | grep -oP '\*\*Plans\*\*: \K\d+' || echo "0")

if [ "$PLAN_COUNT" -ge "2" ]; then
    echo "✓ Session persisted: $PLAN_COUNT plans found"
else
    echo "✗ Session persistence failed: only $PLAN_COUNT plans"
    echo "$STATUS" | extract_json '.result.content[0].text // .error.message // .'
    exit 1
fi

# Final summary
echo ""
echo "========================================="
echo "✓ ALL TESTS PASSED"
echo "========================================="
echo ""
echo "Summary:"
echo "  • MCP session initialized: ✓"
echo "  • Parallel reasoning initialized: ✓"
echo "  • Plan A submitted: ✓"
echo "  • Plan B submitted: ✓"
echo "  • Session persisted: ✓ ($PLAN_COUNT plans)"
echo ""
echo "Session ID: $SESSION_ID"
echo "Server: $SERVER_URL"

