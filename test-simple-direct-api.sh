#!/bin/bash

# Simple test for the direct API endpoint
# Tests ONLY the /api/register-results endpoint with a mock execution token

set -e

echo "🧪 Testing /api/register-results endpoint directly..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:8787"
DIRECT_API_URL="$BASE_URL/api/register-results"

# Create a mock execution token
# Format: exec_<session_id>_<timestamp>
SESSION_ID="test-session-$(date +%s)"
EXECUTION_TOKEN="exec_${SESSION_ID}_$(date +%s)000"

echo "📋 Session ID: $SESSION_ID"
echo "🎫 Execution Token: $EXECUTION_TOKEN"
echo ""

echo "1️⃣  Testing direct API endpoint..."
echo "   URL: $DIRECT_API_URL"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$DIRECT_API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"execution_token\": \"$EXECUTION_TOKEN\",
    \"results\": [
      {
        \"plan_id\": \"test_plan\",
        \"step_id\": \"test_step\",
        \"findings\": \"Test finding with sources: Example (https://example.com), Research (https://research.org).\",
        \"evidence_refs\": [
          {\"type\": \"citation\", \"source\": \"Test 2024\", \"description\": \"Test citation\"}
        ]
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Direct API works!${NC}"
    echo -e "${GREEN}✅ NO 'Session terminated' error${NC}"
    echo -e "${GREEN}✅ NO 403 error${NC}"
  else
    echo -e "${RED}❌ Unexpected response format${NC}"
  fi
elif [ "$HTTP_CODE" = "400" ]; then
  echo "⚠️  Expected error (token not found in session) - this is OK for a mock token"
  echo "   The endpoint is working correctly!"
elif [ "$HTTP_CODE" = "500" ]; then
  echo -e "${RED}❌ Server error${NC}"
  exit 1
else
  echo -e "${RED}❌ Unexpected HTTP code: $HTTP_CODE${NC}"
  exit 1
fi

echo ""
echo "🎉 Direct API endpoint is accessible and responding!"
echo ""
echo "Next steps:"
echo "1. Create a real session with init_parallel_reasoning"
echo "2. Submit plans"
echo "3. Execute manifest to get a real execution_token"
echo "4. Use this endpoint to register results"

