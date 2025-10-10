#!/bin/bash

# Test to verify execute_reasoning_manifest points to /api/register-results

set -e

SESSION_ID="test-manifest-$(date +%s)"
MCP_URL="http://localhost:38349/mcp"

echo "🧪 Testing execute_reasoning_manifest endpoint reference..."
echo "Session ID: $SESSION_ID"
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

# 1. Init session
echo "1️⃣ Initializing session..."
INIT_RESP=$(call_tool "init_parallel_reasoning" "{
  \"session_id\": \"$SESSION_ID\",
  \"task_description\": \"Test manifest endpoint reference\",
  \"required_diversity_axes\": [\"approach\", \"methodology\"]
}")

if echo "$INIT_RESP" | grep -q "error"; then
  echo "❌ Init failed:"
  echo "$INIT_RESP" | jq '.'
  exit 1
fi
echo "✅ Session initialized"

# 2. Submit 3 plans
echo ""
echo "2️⃣ Submitting 3 plans..."
for i in 1 2 3; do
  call_tool "submit_reasoning_plan" "{
    \"session_id\": \"$SESSION_ID\",
    \"plan\": {
      \"plan_id\": \"plan_$i\",
      \"description\": \"Test plan $i\",
      \"diversity_axes\": [\"approach: test$i\", \"methodology: method$i\"],
      \"capability_chain\": [\"step1\", \"step2\", \"step3\"],
      \"rationale\": \"Test plan $i\",
      \"expected_outputs\": [\"Output $i\"]
    }
  }" > /dev/null
  echo "  ✅ Plan $i submitted"
done

# 3. Generate manifest
echo ""
echo "3️⃣ Generating manifest..."
MANIFEST_RESP=$(call_tool "execute_reasoning_manifest" "{
  \"session_id\": \"$SESSION_ID\"
}")

# Extract manifest text
MANIFEST=$(echo "$MANIFEST_RESP" | jq -r '.result.content[0].text' 2>/dev/null)

if [ -z "$MANIFEST" ] || [ "$MANIFEST" = "null" ]; then
  echo "❌ Failed to get manifest"
  echo "Response:"
  echo "$MANIFEST_RESP" | jq '.'
  exit 1
fi

echo "✅ Manifest generated"
echo ""

# 4. Check for /api/register-results
echo "🔍 Checking manifest content..."
echo ""

if echo "$MANIFEST" | grep -q "/api/register-results"; then
  echo "✅ SUCCESS: Manifest correctly points to /api/register-results"
  echo ""
  echo "📋 Relevant sections from manifest:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$MANIFEST" | grep -B 2 -A 10 "/api/register-results" | head -40
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "✅ Manifest instructs ChatGPT to use the direct API endpoint!"
else
  echo "❌ FAIL: Manifest does not mention /api/register-results"
  echo ""
  echo "Full manifest:"
  echo "$MANIFEST"
  exit 1
fi

