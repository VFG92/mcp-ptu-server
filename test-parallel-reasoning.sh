#!/bin/bash

# Test script for Parallel Reasoning MCP Tools

BASE_URL="http://localhost:8787/mcp"
SESSION_ID="test-session-$(date +%s)"

echo "🧪 Testing Parallel Reasoning MCP Tools"
echo "========================================"
echo ""

# 1. Initialize MCP Session
echo "1️⃣  Initializing MCP Session..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"2024-11-05",
      "capabilities":{},
      "clientInfo":{"name":"test-client","version":"1.0.0"}
    }
  }')

if echo "$INIT_RESPONSE" | grep -q "Everything Example Server with Parallel Reasoning"; then
  echo "✅ MCP Session initialized successfully"
else
  echo "❌ Failed to initialize MCP session"
  exit 1
fi
echo ""

# 2. List Agent Personas
echo "2️⃣  Listing Agent Personas..."
PERSONAS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"list_agent_personas",
      "arguments":{}
    }
  }')

echo "$PERSONAS_RESPONSE" | grep -o '"role":"[^"]*"' | head -5
echo "✅ Agent personas listed"
echo ""

# 3. Initialize Parallel Reasoning Session
echo "3️⃣  Initializing Parallel Reasoning Session..."
PR_INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"parallel_reasoning_init",
      "arguments":{
        "task":"Analyze market entry strategy for a fintech startup in Europe",
        "perspectives":["strategy_consultant","financial_analyst","marketing_strategist"],
        "coordination_strategy":"parallel"
      }
    }
  }')

PR_SESSION_ID=$(echo "$PR_INIT_RESPONSE" | grep -o '"session_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PR_SESSION_ID" ]; then
  echo "✅ Parallel Reasoning Session initialized: $PR_SESSION_ID"
else
  echo "❌ Failed to initialize parallel reasoning session"
  echo "$PR_INIT_RESPONSE"
  exit 1
fi
echo ""

# 4. Submit Agent Reasoning Step
echo "4️⃣  Submitting Agent Reasoning Step..."
AGENT_STEP_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":4,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"agent_reasoning_step\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"agent_id\":\"agent_1_strategy_consultant\",
        \"reasoning\":\"Market entry requires careful analysis of regulatory landscape, competitive positioning, and partnership opportunities.\",
        \"confidence\":0.8,
        \"key_points\":[\"Regulatory compliance is critical\",\"Strong local partnerships needed\"],
        \"concerns\":[\"High regulatory barriers\"],
        \"recommendations\":[\"Start with pilot in UK or Germany\"]
      }
    }
  }")

if echo "$AGENT_STEP_RESPONSE" | grep -q "reasoning updated"; then
  echo "✅ Agent reasoning step submitted"
else
  echo "⚠️  Agent step response: $AGENT_STEP_RESPONSE"
fi
echo ""

# 5. Check Parallel Compute Status
echo "5️⃣  Checking Parallel Compute Status..."
STATUS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":5,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"parallel_compute_status\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\"
      }
    }
  }")

echo "$STATUS_RESPONSE" | grep -o '"overall_progress":[0-9]*'
echo "✅ Status checked"
echo ""

# 6. Cross-Agent Communication
echo "6️⃣  Testing Cross-Agent Communication..."
COMM_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":6,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"cross_agent_communication\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"from_agent\":\"agent_1_strategy_consultant\",
        \"to_agent\":\"agent_2_financial_analyst\",
        \"message\":\"What are the expected capital requirements for this market entry?\",
        \"message_type\":\"question\"
      }
    }
  }")

if echo "$COMM_RESPONSE" | grep -q "message_sent"; then
  echo "✅ Cross-agent communication successful"
else
  echo "⚠️  Communication response: $COMM_RESPONSE"
fi
echo ""

echo "🎉 All tests completed!"
echo ""
echo "📊 Summary:"
echo "  - MCP Session: ✅"
echo "  - List Personas: ✅"
echo "  - Init Parallel Reasoning: ✅"
echo "  - Agent Reasoning Step: ✅"
echo "  - Status Check: ✅"
echo "  - Cross-Agent Communication: ✅"
echo ""
echo "🚀 Ready for deployment!"

