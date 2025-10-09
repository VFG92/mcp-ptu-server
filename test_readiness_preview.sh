#!/bin/bash

# Test script for Readiness Preview feature
# Tests the deployed worker at https://mcp-server.vf-ghizzoni.workers.dev

set -e

BASE_URL="https://mcp-server.vf-ghizzoni.workers.dev/proxy"
SESSION_ID="test_readiness_$(date +%s)"

echo "=== Testing Readiness Preview Feature ==="
echo "Session ID: $SESSION_ID"
echo ""

# Step 1: Initialize session
echo "Step 1: Initializing session..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"init_parallel_reasoning\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"task_description\": \"Test readiness preview feature\",
        \"required_diversity_axes\": [\"data_sources\", \"analytical_models\"],
        \"min_plans\": 3
      }
    }
  }")

echo "$INIT_RESPONSE" | python3 -m json.tool | head -30
echo ""

# Check for "Key Principles" in response (new feature)
if echo "$INIT_RESPONSE" | grep -q "Optimal capability chain length"; then
  echo "✅ Found new guidance on optimal capability chain length"
else
  echo "❌ Missing new guidance on optimal capability chain length"
fi
echo ""

# Step 2: Submit Plan A (4 steps - optimal)
echo "Step 2: Submitting Plan A (4 steps - optimal)..."
PLAN_A_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_A\",
          \"description\": \"Data-driven analysis\",
          \"diversity_axes\": [\"data_sources: market reports\", \"analytical_models: quantitative\"],
          \"capability_chain\": [\"step1\", \"step2\", \"step3\", \"step4\"],
          \"rationale\": \"Test plan A\",
          \"expected_outputs\": [\"output1\"]
        }
      }
    }
  }")

echo "$PLAN_A_RESPONSE" | python3 -m json.tool | head -20
echo ""

# Step 3: Submit Plan B (5 steps - optimal)
echo "Step 3: Submitting Plan B (5 steps - optimal)..."
PLAN_B_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 3,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_B\",
          \"description\": \"Expert validation\",
          \"diversity_axes\": [\"data_sources: expert interviews\", \"analytical_models: qualitative\"],
          \"capability_chain\": [\"step1\", \"step2\", \"step3\", \"step4\", \"step5\"],
          \"rationale\": \"Test plan B\",
          \"expected_outputs\": [\"output2\"]
        }
      }
    }
  }")

echo "$PLAN_B_RESPONSE" | python3 -m json.tool | head -20
echo ""

# Step 4: Submit Plan C (4 steps - optimal) - THIS SHOULD TRIGGER READINESS PREVIEW
echo "Step 4: Submitting Plan C (4 steps - optimal) - SHOULD TRIGGER READINESS PREVIEW..."
PLAN_C_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 4,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"submit_reasoning_plan\",
      \"arguments\": {
        \"session_id\": \"$SESSION_ID\",
        \"plan\": {
          \"plan_id\": \"plan_C\",
          \"description\": \"Financial modeling\",
          \"diversity_axes\": [\"data_sources: financial data\", \"analytical_models: financial\"],
          \"capability_chain\": [\"step1\", \"step2\", \"step3\", \"step4\"],
          \"rationale\": \"Test plan C\",
          \"expected_outputs\": [\"output3\"]
        }
      }
    }
  }")

echo "=== PLAN C RESPONSE (should contain Readiness Preview) ==="
echo "$PLAN_C_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('content', [{}])[0].get('text', 'No text found'))"
echo ""

# Check for Readiness Preview
if echo "$PLAN_C_RESPONSE" | grep -q "🎯 Readiness Preview"; then
  echo "✅ READINESS PREVIEW FOUND!"
else
  echo "❌ READINESS PREVIEW NOT FOUND"
fi

if echo "$PLAN_C_RESPONSE" | grep -q "Total declared steps"; then
  echo "✅ Found 'Total declared steps' calculation"
else
  echo "❌ Missing 'Total declared steps' calculation"
fi

if echo "$PLAN_C_RESPONSE" | grep -q "Coverage ≥ 95%"; then
  echo "✅ Found Coverage metric"
else
  echo "❌ Missing Coverage metric"
fi

if echo "$PLAN_C_RESPONSE" | grep -q "Confidence ≥ 85%"; then
  echo "✅ Found Confidence metric"
else
  echo "❌ Missing Confidence metric"
fi

if echo "$PLAN_C_RESPONSE" | grep -q "Consensus ≥ 80%"; then
  echo "✅ Found Consensus metric"
else
  echo "❌ Missing Consensus metric"
fi

echo ""
echo "=== Test Complete ==="

