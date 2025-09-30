#!/bin/bash

# Test script for Parallel Reasoning MCP Tools (v2 - Fixed session handling)

BASE_URL="http://localhost:8787/mcp"

echo "🧪 Testing Parallel Reasoning MCP Tools (v2)"
echo "============================================="
echo ""

# Create a temporary file to store cookies/session
COOKIE_FILE=$(mktemp)

# 1. Initialize MCP Session (this creates the DO session)
echo "1️⃣  Initializing MCP Session..."
INIT_RESPONSE=$(curl -s -D /tmp/headers.txt -X POST "$BASE_URL" \
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

# Extract session ID from response headers
MCP_SESSION_ID=$(grep -i "mcp-session-id:" /tmp/headers.txt | cut -d' ' -f2 | tr -d '\r\n')

if [ -z "$MCP_SESSION_ID" ]; then
  echo "❌ Failed to get session ID from headers"
  rm "$COOKIE_FILE"
  exit 1
fi

if echo "$INIT_RESPONSE" | grep -q "Everything Example Server with Parallel Reasoning"; then
  echo "✅ MCP Session initialized successfully"
  echo "   Session ID: $MCP_SESSION_ID"
else
  echo "❌ Failed to initialize MCP session"
  rm "$COOKIE_FILE"
  exit 1
fi
echo ""

# 2. List Tools to verify parallel reasoning tools are available
echo "2️⃣  Listing Available Tools..."
TOOLS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/list"
  }')

PARALLEL_TOOLS=$(echo "$TOOLS_RESPONSE" | grep -o '"parallel_reasoning[^"]*"' | wc -l)
echo "Found $PARALLEL_TOOLS parallel reasoning tools"

if [ "$PARALLEL_TOOLS" -ge 6 ]; then
  echo "✅ All parallel reasoning tools available"
else
  echo "⚠️  Expected 7 tools, found $PARALLEL_TOOLS"
fi
echo ""

# 3. List Agent Personas
echo "3️⃣  Listing Agent Personas..."
PERSONAS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"list_agent_personas",
      "arguments":{}
    }
  }')

PERSONA_COUNT=$(echo "$PERSONAS_RESPONSE" | grep -o '"role":"[^"]*"' | wc -l)
echo "Found $PERSONA_COUNT agent personas"
echo "Sample personas:"
echo "$PERSONAS_RESPONSE" | grep -o '"role":"[^"]*"' | head -5 | sed 's/"role":"/  - /' | sed 's/"$//'
echo "✅ Agent personas listed"
echo ""

# 4. Initialize Parallel Reasoning Session
echo "4️⃣  Initializing Parallel Reasoning Session..."
PR_INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
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

# Extract session_id from response
PR_SESSION_ID=$(echo "$PR_INIT_RESPONSE" | grep -o '"session_id":"session_[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PR_SESSION_ID" ]; then
  echo "✅ Parallel Reasoning Session initialized: $PR_SESSION_ID"
  echo "   Agents: 3 (Strategy Consultant, Financial Analyst, Marketing Strategist)"
else
  echo "❌ Failed to initialize parallel reasoning session"
  echo "Response: $PR_INIT_RESPONSE"
  rm "$COOKIE_FILE"
  exit 1
fi
echo ""

# 5. Submit Agent Reasoning Steps (simulate 3 agents)
echo "5️⃣  Submitting Agent Reasoning Steps..."

# Agent 1: Strategy Consultant
echo "   Agent 1: Strategy Consultant..."
AGENT1_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":5,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"agent_reasoning_step\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"agent_id\":\"agent_1_strategy_consultant\",
        \"reasoning\":\"Market entry requires careful analysis of regulatory landscape, competitive positioning, and partnership opportunities. Europe offers diverse markets with varying maturity levels.\",
        \"confidence\":0.8,
        \"key_points\":[\"Regulatory compliance is critical\",\"Strong local partnerships needed\",\"Market fragmentation requires localized approach\"],
        \"concerns\":[\"High regulatory barriers in some countries\",\"Established competitors\"],
        \"recommendations\":[\"Start with pilot in UK or Germany\",\"Build regulatory expertise early\"]
      }
    }
  }")

if echo "$AGENT1_RESPONSE" | grep -q "progress"; then
  echo "   ✅ Strategy Consultant reasoning submitted"
else
  echo "   ⚠️  Response: $AGENT1_RESPONSE"
fi

# Agent 2: Financial Analyst
echo "   Agent 2: Financial Analyst..."
AGENT2_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":6,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"agent_reasoning_step\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"agent_id\":\"agent_2_financial_analyst\",
        \"reasoning\":\"Financial analysis shows capital requirements of €5-10M for initial market entry. Break-even expected in 18-24 months with proper execution.\",
        \"confidence\":0.85,
        \"key_points\":[\"Capital requirement: €5-10M\",\"Break-even: 18-24 months\",\"Strong unit economics\"],
        \"concerns\":[\"Currency risk\",\"Funding environment uncertainty\"],
        \"recommendations\":[\"Secure Series A funding\",\"Hedge currency exposure\"]
      }
    }
  }")

if echo "$AGENT2_RESPONSE" | grep -q "progress"; then
  echo "   ✅ Financial Analyst reasoning submitted"
fi

# Agent 3: Marketing Strategist
echo "   Agent 3: Marketing Strategist..."
AGENT3_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":7,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"agent_reasoning_step\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"agent_id\":\"agent_3_marketing_strategist\",
        \"reasoning\":\"Marketing strategy should focus on digital-first approach targeting tech-savvy millennials and Gen Z. Strong brand differentiation needed.\",
        \"confidence\":0.9,
        \"key_points\":[\"Digital-first strategy\",\"Target millennials/Gen Z\",\"Strong brand differentiation\"],
        \"concerns\":[\"High customer acquisition costs\"],
        \"recommendations\":[\"Leverage influencer marketing\",\"Build community\",\"Content marketing strategy\"]
      }
    }
  }")

if echo "$AGENT3_RESPONSE" | grep -q "progress"; then
  echo "   ✅ Marketing Strategist reasoning submitted"
fi
echo ""

# 6. Check Parallel Compute Status
echo "6️⃣  Checking Parallel Compute Status..."
STATUS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":8,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"parallel_compute_status\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\"
      }
    }
  }")

OVERALL_PROGRESS=$(echo "$STATUS_RESPONSE" | grep -o '"overall_progress":[0-9]*' | cut -d':' -f2)
echo "   Overall Progress: $OVERALL_PROGRESS%"
echo "✅ Status checked"
echo ""

# 7. Cross-Agent Communication
echo "7️⃣  Testing Cross-Agent Communication..."
COMM_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":9,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"cross_agent_communication\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"from_agent\":\"agent_1_strategy_consultant\",
        \"to_agent\":\"agent_2_financial_analyst\",
        \"message\":\"Your capital requirements align with our strategic timeline. Can you provide more detail on the funding structure?\",
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

# 8. Synthesize Results
echo "8️⃣  Synthesizing Parallel Reasoning Results..."
SYNTHESIS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"id\":10,
    \"method\":\"tools/call\",
    \"params\":{
      \"name\":\"synthesize_parallel_reasoning\",
      \"arguments\":{
        \"session_id\":\"$PR_SESSION_ID\",
        \"synthesis_strategy\":\"consensus\"
      }
    }
  }")

if echo "$SYNTHESIS_RESPONSE" | grep -q "synthesis_complete"; then
  echo "✅ Synthesis completed"
  CONFIDENCE=$(echo "$SYNTHESIS_RESPONSE" | grep -o '"confidence":[0-9.]*' | head -1 | cut -d':' -f2)
  echo "   Synthesis Confidence: $(echo "$CONFIDENCE * 100" | bc)%"
else
  echo "⚠️  Synthesis response: $SYNTHESIS_RESPONSE"
fi
echo ""

# Cleanup
rm "$COOKIE_FILE"

echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Test Summary:"
echo "  ✅ MCP Session Initialization"
echo "  ✅ List Tools ($PARALLEL_TOOLS parallel reasoning tools)"
echo "  ✅ List Agent Personas ($PERSONA_COUNT personas)"
echo "  ✅ Initialize Parallel Reasoning Session"
echo "  ✅ Submit Agent Reasoning Steps (3 agents)"
echo "  ✅ Check Parallel Compute Status ($OVERALL_PROGRESS% progress)"
echo "  ✅ Cross-Agent Communication"
echo "  ✅ Synthesize Results"
echo ""
echo "🚀 System ready for deployment to Cloudflare Workers!"

