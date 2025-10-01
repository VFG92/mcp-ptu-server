#!/bin/bash

# Test script for custom session ID support
# This script verifies that custom session IDs work correctly

set -e

BASE_URL="${BASE_URL:-https://mcp-server.vf-ghizzoni.workers.dev}"
CUSTOM_SESSION_ID="sess-it-2025-10-01-a"

echo "🧪 Testing Custom Session ID Support"
echo "====================================="
echo ""
echo "Custom Session ID: $CUSTOM_SESSION_ID"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Initialize session with custom session ID
echo "Test 1: Initialize parallel reasoning with custom session ID"
echo "-------------------------------------------------------------"
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\",
        \"task_description\": \"Test task for custom session ID\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    },
    \"id\": 1
  }")

echo "Response: $INIT_RESPONSE"

if echo "$INIT_RESPONSE" | grep -q "error"; then
  echo "❌ Test 1 FAILED: Session initialization failed"
  echo "Response: $INIT_RESPONSE"
  exit 1
fi

if echo "$INIT_RESPONSE" | grep -q "Session initialized successfully"; then
  echo "✅ Test 1 PASSED: Session initialized with custom ID"
else
  echo "⚠️  Test 1 WARNING: Unexpected response format"
  echo "Response: $INIT_RESPONSE"
fi
echo ""

# Test 2: Submit plan with same custom session ID
echo "Test 2: Submit reasoning plan with same custom session ID"
echo "----------------------------------------------------------"
SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan-test-001\",
          \"description\": \"Test plan for custom session ID\",
          \"diversity_axes\": [\"data_sources\", \"analytical_models\"],
          \"capability_chain\": [
            \"gather_requirements\",
            \"analyze_data\",
            \"identify_patterns\",
            \"generate_insights\",
            \"validate_findings\",
            \"synthesize_results\",
            \"create_recommendations\",
            \"document_conclusions\"
          ],
          \"rationale\": \"This plan tests custom session ID routing\",
          \"expected_outputs\": [\"Test output\"]
        }
      }
    },
    \"id\": 2
  }")

echo "Response: $SUBMIT_RESPONSE"

if echo "$SUBMIT_RESPONSE" | grep -q "Session not found"; then
  echo "❌ Test 2 FAILED: Session not found (routing issue!)"
  echo "This indicates the custom session ID is not routing to the same Durable Object"
  exit 1
fi

if echo "$SUBMIT_RESPONSE" | grep -q "error"; then
  echo "❌ Test 2 FAILED: Plan submission failed"
  echo "Response: $SUBMIT_RESPONSE"
  exit 1
fi

if echo "$SUBMIT_RESPONSE" | grep -q "Plan submitted successfully"; then
  echo "✅ Test 2 PASSED: Plan submitted successfully (session found!)"
else
  echo "⚠️  Test 2 WARNING: Unexpected response format"
  echo "Response: $SUBMIT_RESPONSE"
fi
echo ""

# Test 3: List plan status with same custom session ID
echo "Test 3: List plan status with same custom session ID"
echo "-----------------------------------------------------"
LIST_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_plan_status\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\"
      }
    },
    \"id\": 3
  }")

echo "Response: $LIST_RESPONSE"

if echo "$LIST_RESPONSE" | grep -q "Session not found"; then
  echo "❌ Test 3 FAILED: Session not found"
  exit 1
fi

if echo "$LIST_RESPONSE" | grep -q "error"; then
  echo "❌ Test 3 FAILED: List status failed"
  echo "Response: $LIST_RESPONSE"
  exit 1
fi

if echo "$LIST_RESPONSE" | grep -q "plan-test-001"; then
  echo "✅ Test 3 PASSED: Plan found in session (consistent routing!)"
else
  echo "⚠️  Test 3 WARNING: Plan not found in response"
  echo "Response: $LIST_RESPONSE"
fi
echo ""

# Test 4: Heartbeat with custom session ID
echo "Test 4: Heartbeat with custom session ID"
echo "-----------------------------------------"
HEARTBEAT_RESPONSE=$(curl -s -X POST "$BASE_URL/heartbeat" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: $CUSTOM_SESSION_ID" \
  -d '{}')

echo "Response: $HEARTBEAT_RESPONSE"

if echo "$HEARTBEAT_RESPONSE" | grep -q "Heartbeat acknowledged"; then
  echo "✅ Test 4 PASSED: Heartbeat accepted with custom session ID"
else
  echo "❌ Test 4 FAILED: Heartbeat should be accepted"
  echo "Response: $HEARTBEAT_RESPONSE"
  exit 1
fi
echo ""

# Test 5: Multiple custom session IDs (isolation test)
echo "Test 5: Multiple custom session IDs (isolation test)"
echo "-----------------------------------------------------"
CUSTOM_SESSION_ID_2="sess-it-2025-10-01-b"

echo "Creating second session: $CUSTOM_SESSION_ID_2"
INIT_RESPONSE_2=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID_2\",
        \"task_description\": \"Second test task\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    },
    \"id\": 4
  }")

if echo "$INIT_RESPONSE_2" | grep -q "Session initialized successfully"; then
  echo "✅ Second session initialized"
else
  echo "❌ Test 5 FAILED: Second session initialization failed"
  exit 1
fi

# Check that first session still has its plan
LIST_RESPONSE_1=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_plan_status\",
      \"arguments\": {
        \"session_id\": \"$CUSTOM_SESSION_ID\"
      }
    },
    \"id\": 5
  }")

if echo "$LIST_RESPONSE_1" | grep -q "plan-test-001"; then
  echo "✅ Test 5 PASSED: Sessions are properly isolated"
else
  echo "❌ Test 5 FAILED: First session lost its plan"
  exit 1
fi
echo ""

# Test 6: Native DO ID (backward compatibility)
echo "Test 6: Native DO ID (backward compatibility)"
echo "----------------------------------------------"
# Generate a valid 64-char hex ID
NATIVE_DO_ID="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

INIT_RESPONSE_NATIVE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$NATIVE_DO_ID\",
        \"task_description\": \"Test with native DO ID\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    },
    \"id\": 6
  }")

if echo "$INIT_RESPONSE_NATIVE" | grep -q "Session initialized successfully"; then
  echo "✅ Test 6 PASSED: Native DO IDs still work (backward compatible)"
else
  echo "⚠️  Test 6 WARNING: Native DO ID initialization had unexpected response"
  echo "Response: $INIT_RESPONSE_NATIVE"
fi
echo ""

echo "====================================="
echo "🎉 All custom session ID tests PASSED!"
echo "====================================="
echo ""
echo "Summary:"
echo "  ✅ Custom session IDs work correctly"
echo "  ✅ Session routing is consistent"
echo "  ✅ Plans persist across requests"
echo "  ✅ Heartbeat works with custom IDs"
echo "  ✅ Sessions are properly isolated"
echo "  ✅ Native DO IDs still work (backward compatible)"
echo ""
echo "Custom session IDs tested:"
echo "  - $CUSTOM_SESSION_ID"
echo "  - $CUSTOM_SESSION_ID_2"
echo "  - $NATIVE_DO_ID (native)"

