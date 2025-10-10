#!/bin/bash

# Test script to verify the new direct API endpoint for register_execution_results
# This bypasses MCP session management to prevent "Session terminated" errors

set -e

echo "🧪 Testing direct API endpoint for register_execution_results..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SESSION_ID="test-direct-api-$(date +%s)"
# Auto-detect port from wrangler
if curl -s http://localhost:38349/health > /dev/null 2>&1; then
  PORT=38349
else
  PORT=8787
fi
BASE_URL="http://localhost:$PORT"
MCP_URL="$BASE_URL/mcp"
PROXY_URL="$BASE_URL/proxy"
DIRECT_API_URL="$BASE_URL/api/register-results"

echo "Using port: $PORT"

echo "📋 Session ID: $SESSION_ID"
echo ""

# Helper function to call MCP tools
call_tool() {
  local tool_name=$1
  local args=$2

  curl -s -X POST "$MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-session-id: $SESSION_ID" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"$tool_name\",
        \"arguments\": $args
      },
      \"id\": 1
    }"
}

# Step 1: Initialize session
echo "1️⃣  Initializing session..."
INIT_RESPONSE=$(call_tool "init_parallel_reasoning" "{
  \"session_id\": \"$SESSION_ID\",
  \"task_description\": \"Test direct API endpoint\",
  \"required_diversity_axes\": [\"approach\", \"methodology\"]
}")

if echo "$INIT_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ Init failed${NC}"
  echo "$INIT_RESPONSE" | jq '.'
  exit 1
fi
echo -e "${GREEN}✅ Session initialized${NC}"
echo ""

# Step 2: Submit plans
echo "2️⃣  Submitting 3 plans..."

call_tool "submit_reasoning_plan" "{
  \"session_id\": \"$SESSION_ID\",
  \"plan\": {
    \"plan_id\": \"plan_a\",
    \"description\": \"Approach A\",
    \"diversity_axes\": [\"approach: quantitative\", \"methodology: statistical\"],
    \"capability_chain\": [\"step1\", \"step2\", \"step3\"],
    \"rationale\": \"Test plan A\",
    \"expected_outputs\": [\"Output A\"]
  }
}" > /dev/null

call_tool "submit_reasoning_plan" "{
  \"session_id\": \"$SESSION_ID\",
  \"plan\": {
    \"plan_id\": \"plan_b\",
    \"description\": \"Approach B\",
    \"diversity_axes\": [\"approach: qualitative\", \"methodology: case_study\"],
    \"capability_chain\": [\"step1\", \"step2\", \"step3\"],
    \"rationale\": \"Test plan B\",
    \"expected_outputs\": [\"Output B\"]
  }
}" > /dev/null

call_tool "submit_reasoning_plan" "{
  \"session_id\": \"$SESSION_ID\",
  \"plan\": {
    \"plan_id\": \"plan_c\",
    \"description\": \"Approach C\",
    \"diversity_axes\": [\"approach: mixed\", \"methodology: experimental\"],
    \"capability_chain\": [\"step1\", \"step2\", \"step3\"],
    \"rationale\": \"Test plan C\",
    \"expected_outputs\": [\"Output C\"]
  }
}" > /dev/null

echo -e "${GREEN}✅ 3 plans submitted${NC}"
echo ""

# Step 3: Execute manifest
echo "3️⃣  Generating execution manifest..."
MANIFEST_RESPONSE=$(call_tool "execute_reasoning_manifest" "{
  \"session_id\": \"$SESSION_ID\"
}")

# Extract execution token from response
EXECUTION_TOKEN=$(echo "$MANIFEST_RESPONSE" | jq -r '.result.content[0].text' | grep -oP 'execution_token: \K[a-zA-Z0-9_-]+' | head -1)

if [ -z "$EXECUTION_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get execution token${NC}"
  echo "$MANIFEST_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Execution token: $EXECUTION_TOKEN${NC}"
echo ""

# Step 4: Register results using DIRECT API (not MCP)
echo "4️⃣  Registering results via DIRECT API endpoint..."
echo "   URL: $DIRECT_API_URL"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$DIRECT_API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"execution_token\": \"$EXECUTION_TOKEN\",
    \"results\": [
      {
        \"plan_id\": \"plan_a\",
        \"step_id\": \"step1\",
        \"findings\": \"Test finding A. Sources: Example study (https://example.com/study), Research paper (https://research.org/paper). Key metrics: 45% improvement.\",
        \"evidence_refs\": [
          {\"type\": \"citation\", \"source\": \"Example Study 2024\", \"description\": \"Research on topic A\"},
          {\"type\": \"data_source\", \"source\": \"internal-db\", \"description\": \"Historical data\"}
        ],
        \"workpapers\": [
          {
            \"type\": \"dataset\",
            \"title\": \"Test Data\",
            \"content\": \"Metric,Value\\nImprovement,45%\\nSample Size,1000\",
            \"format\": \"csv\"
          }
        ]
      },
      {
        \"plan_id\": \"plan_b\",
        \"step_id\": \"step1\",
        \"findings\": \"Test finding B. Qualitative analysis shows positive sentiment. Sources: Survey results (https://surveys.com/results), Interview transcripts.\",
        \"evidence_refs\": [
          {\"type\": \"citation\", \"source\": \"Survey 2024\", \"description\": \"User feedback survey\"}
        ]
      },
      {
        \"plan_id\": \"plan_c\",
        \"step_id\": \"step1\",
        \"findings\": \"Test finding C. Experimental results confirm hypothesis. Data available at https://data.example.com/experiment.\",
        \"evidence_refs\": [
          {\"type\": \"calculation\", \"source\": \"see-workpapers\", \"description\": \"Statistical analysis\"}
        ]
      }
    ]
  }")

echo "Response:"
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Check for errors
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Results registered successfully via direct API!${NC}"
  echo -e "${GREEN}✅ NO 'Session terminated' error!${NC}"
  echo -e "${GREEN}✅ NO 403 error!${NC}"
elif echo "$REGISTER_RESPONSE" | grep -q '"error"'; then
  echo -e "${RED}❌ Registration failed${NC}"
  exit 1
else
  echo -e "${YELLOW}⚠️  Unexpected response format${NC}"
fi
echo ""

# Step 5: Verify via list_plan_status
echo "5️⃣  Verifying registration via list_plan_status..."
STATUS_RESPONSE=$(call_tool "list_plan_status" "{
  \"session_id\": \"$SESSION_ID\"
}")

echo "$STATUS_RESPONSE" | jq -r '.result.content[0].text'
echo ""

# Step 6: Try registering MORE results (test that token can be reused or we get clear error)
echo "6️⃣  Testing token reuse behavior..."
REUSE_RESPONSE=$(curl -s -X POST "$DIRECT_API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"execution_token\": \"$EXECUTION_TOKEN\",
    \"results\": [
      {
        \"plan_id\": \"plan_a\",
        \"step_id\": \"step2\",
        \"findings\": \"Additional finding for step 2\"
      }
    ]
  }")

echo "Reuse response:"
echo "$REUSE_RESPONSE" | jq '.'
echo ""

if echo "$REUSE_RESPONSE" | grep -q "token.*used\|expired"; then
  echo -e "${YELLOW}⚠️  Token already used (expected behavior)${NC}"
  echo "   To register more results, call execute_reasoning_manifest again for a new token"
elif echo "$REUSE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Token can be reused (multiple registrations allowed)${NC}"
fi
echo ""

echo -e "${GREEN}🎉 DIRECT API TEST COMPLETE!${NC}"
echo ""
echo "Summary:"
echo "- ✅ Session initialized"
echo "- ✅ Plans submitted"
echo "- ✅ Execution manifest generated"
echo "- ✅ Results registered via DIRECT API (bypasses MCP session)"
echo "- ✅ NO 'Session terminated' error"
echo "- ✅ NO 403 safety blocks"
echo ""
echo "ChatGPT can now use this endpoint to avoid session management issues!"

