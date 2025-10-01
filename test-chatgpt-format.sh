#!/bin/bash

# Test script to simulate ChatGPT's exact request format
# This helps debug the 400 Bad Request error

SERVER_URL="https://mcp-server.vf-ghizzoni.workers.dev/mcp"

echo "=========================================="
echo "Testing ChatGPT-style MCP requests"
echo "=========================================="
echo ""

# Step 1: Initialize MCP session
echo "Step 1: Initialize MCP session..."
INIT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "openai-mcp",
        "version": "1.0.0"
      }
    }
  }')

echo "$INIT_RESPONSE" | jq '.' 2>/dev/null || echo "$INIT_RESPONSE"

# Extract session ID from response header
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id" | cut -d: -f2 | tr -d ' \r\n' || echo "")

if [ -z "$SESSION_ID" ]; then
  echo "Warning: Could not extract session ID from response"
  SESSION_ID="test_session_001"
fi

echo ""
echo "Session ID: $SESSION_ID"
echo ""

# Step 2: Send notifications/initialized
echo "Step 2: Send notifications/initialized..."
curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  --data '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }' | jq '.' 2>/dev/null

echo ""

# Step 3: Call init_parallel_reasoning - Format 1 (without min_plans)
echo "=========================================="
echo "Step 3a: Call init_parallel_reasoning (without min_plans)"
echo "=========================================="
curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  --data '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "session_001",
        "task_description": "Analisi strategica AI generativa",
        "required_diversity_axes": ["data_sources", "analytical_models"]
      }
    }
  }' | jq '.' 2>/dev/null

echo ""
echo ""

# Step 4: Call init_parallel_reasoning - Format 2 (with min_plans)
echo "=========================================="
echo "Step 4: Call init_parallel_reasoning (with min_plans)"
echo "=========================================="
curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  --data '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "session_002",
        "task_description": "Analisi strategica AI generativa",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    }
  }' | jq '.' 2>/dev/null

echo ""
echo ""

# Step 5: Call init_parallel_reasoning - Format 3 (with _meta like ChatGPT)
echo "=========================================="
echo "Step 5: Call init_parallel_reasoning (with _meta like ChatGPT)"
echo "=========================================="
curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  --data '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "_meta": {
        "openai/userAgent": "Mozilla/5.0",
        "openai/locale": "it-IT"
      },
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "session_003",
        "task_description": "Analisi strategica AI generativa",
        "required_diversity_axes": ["data_sources", "analytical_models"]
      }
    }
  }' | jq '.' 2>/dev/null

echo ""
echo ""
echo "=========================================="
echo "Test completed"
echo "=========================================="

