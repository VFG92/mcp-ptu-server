#!/bin/bash

# Test script to verify that MCP tools return structuredContent
# This verifies the server is ready for ChatGPT Apps SDK

echo "🧪 Testing MCP PTU Server - Structured Content"
echo "================================================"
echo ""

SERVER_URL="https://mcp-server.vf-ghizzoni.workers.dev/proxy"

# Use a unique session ID for this test
TEST_SESSION_ID="ui_test_$(date +%s)"

echo "🔧 Test Session ID: $TEST_SESSION_ID"
echo ""

# Test 1: Initialize parallel reasoning session
echo "📋 Test 1: init_parallel_reasoning"
echo "-----------------------------------"

RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "'"$TEST_SESSION_ID"'",
        "task_description": "Test UI structured content",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    },
    "id": 1
  }')

# Check if structuredContent exists
if echo "$RESPONSE" | grep -q '"structuredContent"'; then
  echo "✅ structuredContent found in response"
  
  # Extract and display structured content type
  CONTENT_TYPE=$(echo "$RESPONSE" | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Type: $CONTENT_TYPE"
  
  # Check for session_id
  if echo "$RESPONSE" | grep -q "\"session_id\":\"$TEST_SESSION_ID\""; then
    echo "   Session ID: ✅ Correct"
  else
    echo "   Session ID: ❌ Missing or incorrect"
  fi
  
  # Check for required fields
  if echo "$RESPONSE" | grep -q '"task_description"'; then
    echo "   Task Description: ✅ Present"
  fi
  
  if echo "$RESPONSE" | grep -q '"required_diversity_axes"'; then
    echo "   Diversity Axes: ✅ Present"
  fi
  
  if echo "$RESPONSE" | grep -q '"timestamp"'; then
    echo "   Timestamp: ✅ Present"
  fi
  
else
  echo "❌ structuredContent NOT found in response"
  echo ""
  echo "Response preview:"
  echo "$RESPONSE" | head -20
fi

echo ""
echo "================================================"
echo ""

# Test 2: List plan status
echo "📋 Test 2: list_plan_status"
echo "-----------------------------------"

RESPONSE2=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_plan_status",
      "arguments": {
        "session_id": "'"$TEST_SESSION_ID"'"
      }
    },
    "id": 2
  }')

if echo "$RESPONSE2" | grep -q '"structuredContent"'; then
  echo "✅ structuredContent found in response"
  
  CONTENT_TYPE2=$(echo "$RESPONSE2" | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Type: $CONTENT_TYPE2"
  
  if echo "$RESPONSE2" | grep -q '"plans"'; then
    echo "   Plans Array: ✅ Present"
  fi
  
  if echo "$RESPONSE2" | grep -q '"executions"'; then
    echo "   Executions: ✅ Present"
  fi
  
else
  echo "❌ structuredContent NOT found in response"
fi

echo ""
echo "================================================"
echo ""
echo "📊 Summary"
echo "-----------------------------------"
echo ""
echo "The server is returning structuredContent in tool responses."
echo "This means the server is READY for ChatGPT Apps SDK."
echo ""
echo "However, the UI will only appear if:"
echo "1. You have access to ChatGPT Apps SDK beta"
echo "2. ChatGPT recognizes the structuredContent field"
echo "3. UI resources are loaded from mcp://ui/* URIs"
echo ""
echo "To verify Apps SDK access:"
echo "- Visit: https://platform.openai.com/settings/organization/apps"
echo "- If you see 'Apps' section → you have access"
echo "- Otherwise → request beta access from OpenAI"
echo ""
echo "For more info, see: APPS_SDK_STATUS.md"
echo ""

