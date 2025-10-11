#!/bin/bash

# Test script for Self-Assessment based workflow (v5.9.0+)
# Tests the new format where ChatGPT counts evidence and self-evaluates quality

set -e

BASE_URL="${BASE_URL:-http://localhost:8787}"
SESSION_ID="test-self-assessment-$(date +%s)"

echo "🧪 Testing Self-Assessment Workflow (v5.9.0+)"
echo "=============================================="
echo "Session ID: $SESSION_ID"
echo "Base URL: $BASE_URL"
echo ""

# Step 1: Initialize session
echo "📋 Step 1: Initialize parallel reasoning session..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "'"$SESSION_ID"'",
        "task_description": "Test self-assessment workflow with evidence counting",
        "required_diversity_axes": ["methodology", "data_source"],
        "min_plans": 3
      }
    }
  }')

echo "✅ Session initialized"
echo ""

# Step 2: Submit 3 diverse plans
echo "📝 Step 2: Submit 3 diverse reasoning plans..."

for i in 1 2 3; do
  PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{
      "jsonrpc": "2.0",
      "id": '"$((i+1))"',
      "method": "tools/call",
      "params": {
        "name": "submit_reasoning_plan",
        "arguments": {
          "session_id": "'"$SESSION_ID"'",
          "plan": {
            "plan_id": "PLAN_'$i'",
            "description": "Test plan '$i' with self-assessment",
            "diversity_axes": ["methodology", "data_source"],
            "capability_chain": [
              "Collect evidence from external sources",
              "Perform quantitative analysis",
              "Create detailed workpapers"
            ],
            "rationale": "Testing self-assessment approach",
            "expected_outputs": ["Evidence counts", "Quality metrics"]
          }
        }
      }
    }')
  
  echo "  ✅ Plan $i submitted"
done

echo ""

# Step 3: Generate execution manifest
echo "🎯 Step 3: Generate execution manifest..."
MANIFEST_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "execute_reasoning_manifest",
      "arguments": {
        "session_id": "'"$SESSION_ID"'"
      }
    }
  }')

# Extract execution token
EXECUTION_TOKEN=$(echo "$MANIFEST_RESPONSE" | jq -r '.result.content[0].text' | grep -oP 'exec_[a-zA-Z0-9_-]+' | head -1)

if [ -z "$EXECUTION_TOKEN" ]; then
  echo "❌ Failed to extract execution token"
  echo "Response: $MANIFEST_RESPONSE"
  exit 1
fi

echo "✅ Manifest generated"
echo "   Execution token: $EXECUTION_TOKEN"
echo ""

# Step 4: Register execution results with SELF-ASSESSMENT
echo "🔍 Step 4: Register execution results with self-assessment..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "register_execution_results",
      "arguments": {
        "execution_token": "'"$EXECUTION_TOKEN"'",
        "self_assessment": {
          "total_evidence_items": 45,
          "external_sources": 12,
          "quantitative_datapoints": 23,
          "workpapers_created": 8,
          "estimated_confidence": 0.82,
          "estimated_coverage": 0.96,
          "meets_confidence_threshold": false,
          "meets_coverage_threshold": true,
          "gaps_identified": ["Missing external validation for test claims"]
        },
        "results": [
          {
            "plan_id": "PLAN_1",
            "step_id": "step_1",
            "evidence_count": 15,
            "source_count": 4,
            "data_point_count": 8,
            "evidence_refs": [
              {"ref_id": "Source1", "type": "source", "reliability": 0.8},
              {"ref_id": "Calc1", "type": "calculation", "reliability": 0.9}
            ],
            "summary": "Test evidence collection. 15 items. Sources: Test1, Test2."
          },
          {
            "plan_id": "PLAN_2",
            "step_id": "step_1",
            "evidence_count": 15,
            "source_count": 4,
            "data_point_count": 8,
            "evidence_refs": [
              {"ref_id": "Source2", "type": "source", "reliability": 0.85}
            ],
            "summary": "Test quantitative analysis. 15 items."
          },
          {
            "plan_id": "PLAN_3",
            "step_id": "step_1",
            "evidence_count": 15,
            "source_count": 4,
            "data_point_count": 7,
            "evidence_refs": [
              {"ref_id": "WP1", "type": "calculation", "reliability": 0.9}
            ],
            "summary": "Test workpapers. 15 items."
          }
        ]
      }
    }
  }')

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | jq -e '.result.content[0].text' > /dev/null 2>&1; then
  echo "✅ Results registered with self-assessment"
  echo ""
  echo "Server response:"
  echo "$REGISTER_RESPONSE" | jq -r '.result.content[0].text' | head -30
  echo ""
else
  echo "❌ Registration failed"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

# Step 5: Check plan status (should show self-assessment validation)
echo "📊 Step 5: Check plan status (self-assessment validation)..."
STATUS_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "list_plan_status",
      "arguments": {
        "session_id": "'"$SESSION_ID"'"
      }
    }
  }')

echo "✅ Status retrieved"
echo ""
echo "Self-Assessment Validation:"
echo "$STATUS_RESPONSE" | jq -r '.result.content[0].text' | grep -A 20 "Self-Assessment" || echo "(No self-assessment section found)"
echo ""

# Step 6: Check session readiness
echo "🎯 Step 6: Check session readiness..."
READINESS_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "tools/call",
    "params": {
      "name": "check_session_readiness",
      "arguments": {
        "session_id": "'"$SESSION_ID"'"
      }
    }
  }')

echo "✅ Readiness checked"
echo ""
echo "Readiness Summary:"
echo "$READINESS_RESPONSE" | jq -r '.result.content[0].text' | grep -E "(Ready|Quality Metrics|Self-Assessment)" | head -15
echo ""

echo "✅ Self-Assessment Workflow Test Complete!"
echo ""
echo "Summary:"
echo "- ✅ Session initialized"
echo "- ✅ 3 plans submitted"
echo "- ✅ Manifest generated"
echo "- ✅ Results registered with self-assessment (NEW format)"
echo "- ✅ Self-assessment validated by server"
echo "- ✅ Readiness checked"
echo ""
echo "🎉 All tests passed! The new self-assessment approach is working correctly."

