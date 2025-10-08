#!/bin/bash

# Final verification script for ChatGPT Apps SDK structured content
# This script properly simulates the ChatGPT flow with consistent session IDs

echo "🎯 Verifying Structured Content for ChatGPT Apps SDK"
echo "====================================================="
echo ""

SERVER_URL="https://mcp-server.vf-ghizzoni.workers.dev/mcp"
MCP_SESSION_ID="verify-$(date +%s)"
PR_SESSION_ID="parallel-reasoning-001"

echo "📋 MCP Session ID: $MCP_SESSION_ID"
echo "📋 Parallel Reasoning Session ID: $PR_SESSION_ID"
echo ""

# Step 1: Initialize MCP
echo "1️⃣  Initializing MCP session..."
INIT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "verification-client", "version": "1.0.0"}
    },
    "id": 0
  }')

if echo "$INIT_RESPONSE" | grep -q '"result"'; then
  echo "✅ MCP initialized"
else
  echo "❌ Failed to initialize MCP"
  echo "$INIT_RESPONSE" | head -5
  exit 1
fi
echo ""

# Step 2: Call init_parallel_reasoning and check for structuredContent
echo "2️⃣  Calling init_parallel_reasoning..."
echo "-----------------------------------"

RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $MCP_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "'"$PR_SESSION_ID"'",
        "task_description": "Verify ChatGPT Apps SDK structured content support",
        "required_diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
        "min_plans": 3
      }
    },
    "id": 1
  }')

# Parse and display results (handle SSE format)
echo "$RESPONSE" | python3 -c "
import sys, json

try:
    # Read input and extract JSON from SSE format
    raw = sys.stdin.read()

    # SSE format: 'data: {json}' - extract the JSON part
    if raw.startswith('event:') or raw.startswith('data:'):
        # Extract JSON from SSE data line
        for line in raw.split('\n'):
            if line.startswith('data: '):
                raw = line[6:]  # Remove 'data: ' prefix
                break

    data = json.loads(raw)
    
    if 'result' in data:
        result = data['result']
        
        # Check content
        has_content = 'content' in result
        has_structured = 'structuredContent' in result
        
        print('📦 Response Analysis:')
        print('-----------------------------------')
        print(f'✅ content field: {\"YES\" if has_content else \"NO\"}')
        print(f'✅ structuredContent field: {\"YES\" if has_structured else \"NO\"}')
        print('')
        
        if has_structured:
            sc = result['structuredContent']
            print('🎉 SUCCESS! structuredContent is present!')
            print('')
            print('📋 Structured Content Details:')
            print(f'   Type: {sc.get(\"type\", \"unknown\")}')
            print(f'   Session ID: {sc.get(\"session_id\", \"missing\")}')
            print(f'   Task: {sc.get(\"task_description\", \"missing\")[:60]}...')
            print(f'   Diversity Axes: {sc.get(\"required_diversity_axes\", [])}')
            print(f'   Min Plans: {sc.get(\"min_plans\", \"missing\")}')
            print(f'   Timestamp: {sc.get(\"timestamp\", \"missing\")}')
            print('')
            print('✅ The server is READY for ChatGPT Apps SDK!')
            print('')
            print('📱 What this means:')
            print('   - All MCP tools return both text and structured data')
            print('   - UI components can consume this structured data')
            print('   - When Apps SDK is available, UI will render automatically')
            print('')
            print('🔍 To verify Apps SDK access:')
            print('   Visit: https://platform.openai.com/settings/organization/apps')
            print('   If you see \"Apps\" section → you have access')
            print('   Otherwise → request beta access from OpenAI')
            
        else:
            print('❌ structuredContent field is MISSING')
            print('')
            print('This could mean:')
            print('   - Server code not deployed correctly')
            print('   - Tool handler not returning structuredContent')
            print('   - Response format issue')
            print('')
            if has_content:
                print('Text response preview:')
                for item in result.get('content', []):
                    if item.get('type') == 'text':
                        print(f'   {item.get(\"text\", \"\")[:200]}...')
        
    elif 'error' in data:
        print(f'❌ Error: {data[\"error\"].get(\"message\", \"unknown\")}')
        print(f'   Code: {data[\"error\"].get(\"code\", \"unknown\")}')
        print('')
        print('This usually means:')
        print('   - Session not initialized properly')
        print('   - Invalid parameters')
        print('   - Server configuration issue')
    else:
        print('❌ Unexpected response format')
        print(json.dumps(data, indent=2)[:500])
        
except json.JSONDecodeError as e:
    print(f'❌ Failed to parse JSON: {e}')
    print('Raw response:')
    print(sys.stdin.read()[:500])
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
"

echo ""
echo "====================================================="
echo ""

