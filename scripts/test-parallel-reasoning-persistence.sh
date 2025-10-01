#!/bin/bash

# Test script for Parallel Reasoning v5.0 Session Persistence
# This script verifies that sessions persist across multiple HTTP requests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="${SERVER_URL:-http://localhost:8787/mcp}"
SESSION_ID="test_persistence_$(date +%s)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Parallel Reasoning v5.0 Persistence Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Server URL:${NC} $SERVER_URL"
echo -e "${YELLOW}Session ID:${NC} $SESSION_ID"
echo ""

# Function to make MCP tool call
call_tool() {
    local tool_name=$1
    local args=$2
    local session_header=$3
    
    echo -e "${BLUE}→ Calling tool: ${tool_name}${NC}"
    
    local headers=(-H "Content-Type: application/json")
    if [ -n "$session_header" ]; then
        headers+=(-H "mcp-session-id: $session_header")
        echo -e "${YELLOW}  Using session header: ${session_header}${NC}"
    fi
    
    local response=$(curl -s -w "\n%{http_code}" "${headers[@]}" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"tools/call\",
            \"params\": {
                \"name\": \"$tool_name\",
                \"arguments\": $args
            },
            \"id\": 1
        }" \
        "$SERVER_URL")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" != "200" ]; then
        echo -e "${RED}✗ HTTP Error: $http_code${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
    
    # Extract session ID from response header if present
    local new_session=$(echo "$body" | jq -r '.result.session_id // empty' 2>/dev/null)
    if [ -n "$new_session" ]; then
        echo -e "${GREEN}  Session ID from response: ${new_session}${NC}"
        echo "$new_session" > /tmp/mcp_session_id
    fi
    
    echo "$body"
}

# Step 1: Initialize session
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 1: Initialize Parallel Reasoning${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

INIT_ARGS="{
    \"session_id\": \"$SESSION_ID\",
    \"task_description\": \"Test session persistence across HTTP requests\",
    \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
    \"min_plans\": 3
}"

INIT_RESPONSE=$(call_tool "init_parallel_reasoning" "$INIT_ARGS" "")

# Extract session ID from response
RETURNED_SESSION=$(echo "$INIT_RESPONSE" | jq -r '.result.content[0].text' | grep -oP 'Session ID.*`\K[^`]+' || echo "$SESSION_ID")
echo -e "${GREEN}✓ Session initialized: ${RETURNED_SESSION}${NC}"

# Wait a bit to ensure persistence
sleep 2

# Step 2: Submit first plan
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 2: Submit Plan A${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PLAN_A_ARGS="{
    \"session_id\": \"$RETURNED_SESSION\",
    \"plan\": {
        \"plan_id\": \"plan_A\",
        \"description\": \"Data-driven baseline using official statistics\",
        \"diversity_axes\": [\"data_sources\", \"analytical_models\", \"time_horizons\"],
        \"capability_chain\": [
            \"market_scan\", \"tam_sam_som_build\", \"competitor_analysis\",
            \"customer_segmentation\", \"wtp_analysis\", \"gtm_playbook\",
            \"dcf_modeler\", \"scenario_forecasting\"
        ],
        \"rationale\": \"Provides reliable baseline using official statistics\",
        \"expected_outputs\": [\"market_map\", \"tam_sam_som\"]
    }
}"

PLAN_A_RESPONSE=$(call_tool "submit_reasoning_plan" "$PLAN_A_ARGS" "$RETURNED_SESSION")

if echo "$PLAN_A_RESPONSE" | jq -e '.result.content[0].text' | grep -q "accepted.*true"; then
    echo -e "${GREEN}✓ Plan A accepted${NC}"
else
    echo -e "${RED}✗ Plan A rejected${NC}"
    echo "$PLAN_A_RESPONSE" | jq '.result.content[0].text'
    exit 1
fi

sleep 2

# Step 3: Submit second plan
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 3: Submit Plan B${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PLAN_B_ARGS="{
    \"session_id\": \"$RETURNED_SESSION\",
    \"plan\": {
        \"plan_id\": \"plan_B\",
        \"description\": \"Probabilistic modeling using industry research\",
        \"diversity_axes\": [\"data_sources\", \"analytical_models\", \"risk_perspectives\"],
        \"capability_chain\": [
            \"market_scan\", \"monte_carlo_finance\", \"scenario_wargaming\",
            \"geostrategic_risk_scan\", \"regulatory_scan_enhanced\", \"compliance_gap_assessment\",
            \"cybersecurity_risk_model\", \"risk_assessment\"
        ],
        \"rationale\": \"Extends baseline with Monte Carlo simulations\",
        \"expected_outputs\": [\"market_map\", \"monte_carlo_results\"]
    }
}"

PLAN_B_RESPONSE=$(call_tool "submit_reasoning_plan" "$PLAN_B_ARGS" "$RETURNED_SESSION")

if echo "$PLAN_B_RESPONSE" | jq -e '.result.content[0].text' | grep -q "accepted.*true"; then
    echo -e "${GREEN}✓ Plan B accepted${NC}"
else
    echo -e "${RED}✗ Plan B rejected${NC}"
    echo "$PLAN_B_RESPONSE" | jq '.result.content[0].text'
    exit 1
fi

sleep 2

# Step 4: Check session status
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 4: Check Session Status${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

STATUS_ARGS="{
    \"session_id\": \"$RETURNED_SESSION\"
}"

STATUS_RESPONSE=$(call_tool "list_plan_status" "$STATUS_ARGS" "$RETURNED_SESSION")

echo "$STATUS_RESPONSE" | jq '.result.content[0].text'

# Verify session has 2 plans
PLAN_COUNT=$(echo "$STATUS_RESPONSE" | jq -r '.result.content[0].text' | grep -oP 'Plans submitted: \K\d+' || echo "0")

if [ "$PLAN_COUNT" -ge "2" ]; then
    echo -e "${GREEN}✓ Session persisted correctly: $PLAN_COUNT plans found${NC}"
else
    echo -e "${RED}✗ Session persistence failed: only $PLAN_COUNT plans found${NC}"
    exit 1
fi

# Final summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  • Session initialized: ${GREEN}✓${NC}"
echo -e "  • Plan A submitted: ${GREEN}✓${NC}"
echo -e "  • Plan B submitted: ${GREEN}✓${NC}"
echo -e "  • Session persisted: ${GREEN}✓${NC} ($PLAN_COUNT plans)"
echo ""
echo -e "${YELLOW}Session ID: ${RETURNED_SESSION}${NC}"
echo -e "${YELLOW}You can continue testing with this session ID${NC}"

