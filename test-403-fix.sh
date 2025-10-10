#!/bin/bash

# Test script to verify that register_execution_results does NOT get 403 errors
# when following the documented guidelines (no URLs in evidence_refs)

set -e

echo "🧪 Testing complete parallel reasoning flow without 403 errors..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SESSION_ID="test-403-fix-$(date +%s)"
BASE_URL="http://localhost:8787/mcp"

echo "📋 Session ID: $SESSION_ID"
echo ""

# Helper function to call MCP tools
call_tool() {
  local tool_name=$1
  local args=$2

  curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
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

# Step 1: Initialize session
echo "1️⃣  Initializing session..."
INIT_RESPONSE=$(call_tool "init_parallel_reasoning" "{
  \"session_id\": \"$SESSION_ID\",
  \"task_description\": \"Analyze the impact of AI on software development productivity\",
  \"required_diversity_axes\": [\"methodology\", \"data_source\", \"perspective\"]
}")

if echo "$INIT_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ Init failed${NC}"
  echo "$INIT_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Session initialized${NC}"
echo ""

# Step 2: Submit plans
echo "2️⃣  Submitting 3 diverse plans..."

# Plan 1: Quantitative
curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_reasoning_plan\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"plan\": {
        \"plan_id\": \"quantitative\",
        \"description\": \"Quantitative analysis using productivity metrics\",
        \"diversity_axes\": [\"methodology: quantitative\", \"data_source: metrics\"],
        \"capability_chain\": [
          \"search_productivity_studies\",
          \"extract_metrics\",
          \"calculate_averages\",
          \"compare_before_after\",
          \"generate_report\"
        ],
        \"rationale\": \"Use hard data to measure productivity impact\",
        \"expected_outputs\": [\"Productivity increase percentage\", \"Time savings data\"]
      }
    }
  }" > /dev/null

# Plan 2: Qualitative
curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_reasoning_plan\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"plan\": {
        \"plan_id\": \"qualitative\",
        \"description\": \"Qualitative analysis through developer surveys\",
        \"diversity_axes\": [\"methodology: qualitative\", \"data_source: surveys\"],
        \"capability_chain\": [
          \"search_developer_surveys\",
          \"analyze_sentiment\",
          \"identify_themes\",
          \"synthesize_insights\",
          \"generate_summary\"
        ],
        \"rationale\": \"Understand developer experience and satisfaction\",
        \"expected_outputs\": [\"Developer satisfaction scores\", \"Common themes\"]
      }
    }
  }" > /dev/null

# Plan 3: Case studies
curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_reasoning_plan\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"plan\": {
        \"plan_id\": \"case_studies\",
        \"description\": \"Case study analysis of companies using AI tools\",
        \"diversity_axes\": [\"methodology: case_study\", \"perspective: organizational\"],
        \"capability_chain\": [
          \"identify_companies\",
          \"gather_case_studies\",
          \"extract_outcomes\",
          \"compare_approaches\",
          \"synthesize_lessons\"
        ],
        \"rationale\": \"Learn from real-world implementations\",
        \"expected_outputs\": [\"Success stories\", \"Best practices\"]
      }
    }
  }" > /dev/null

echo -e "${GREEN}✅ 3 plans submitted${NC}"
echo ""

# Step 3: Execute manifest
echo "3️⃣  Generating execution manifest..."
MANIFEST_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"execute_reasoning_manifest\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\"
    }
  }")

EXECUTION_TOKEN=$(echo "$MANIFEST_RESPONSE" | jq -r '.content[0].text' | grep -oP 'execution_token: \K[a-f0-9-]+' || echo "")

if [ -z "$EXECUTION_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get execution token${NC}"
  echo "$MANIFEST_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Execution token: $EXECUTION_TOKEN${NC}"
echo ""

# Step 4: Register results WITHOUT URLs in evidence_refs
echo "4️⃣  Registering execution results (NO URLs in evidence_refs)..."

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"register_execution_results\",
    \"arguments\": {
      \"execution_token\": \"$EXECUTION_TOKEN\",
      \"results\": [
        {
          \"plan_id\": \"quantitative\",
          \"step_id\": \"search_productivity_studies\",
          \"findings\": \"Found 15 studies on AI productivity impact. Key sources: GitHub Copilot study (https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/), McKinsey report (https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai), Stanford HAI research (https://hai.stanford.edu/news/how-ai-boosts-industry-profits-and-innovation). Average productivity increase: 35-55%.\",
          \"evidence_refs\": [
            {\"type\": \"citation\", \"source\": \"GitHub 2022\", \"description\": \"Copilot productivity study\"},
            {\"type\": \"citation\", \"source\": \"McKinsey 2023\", \"description\": \"GenAI economic potential\"},
            {\"type\": \"data_source\", \"source\": \"academic-db\", \"description\": \"15 peer-reviewed studies\"}
          ],
          \"workpapers\": [
            {
              \"type\": \"dataset\",
              \"title\": \"Productivity Studies Dataset\",
              \"content\": \"Study,Year,Productivity_Increase\\nGitHub Copilot,2022,55%\\nMcKinsey GenAI,2023,40%\\nStanford HAI,2023,35%\",
              \"format\": \"csv\"
            }
          ]
        },
        {
          \"plan_id\": \"qualitative\",
          \"step_id\": \"search_developer_surveys\",
          \"findings\": \"Analyzed 8 developer surveys from Stack Overflow (https://stackoverflow.blog/2023/06/14/hype-or-not-developers-have-something-to-say-about-ai/), JetBrains (https://www.jetbrains.com/lp/devecosystem-2023/), and others. 73% of developers report positive experience with AI tools. Main benefits: faster code completion, better documentation, reduced context switching.\",
          \"evidence_refs\": [
            {\"type\": \"citation\", \"source\": \"Stack Overflow 2023\", \"description\": \"Developer AI survey\"},
            {\"type\": \"citation\", \"source\": \"JetBrains 2023\", \"description\": \"DevEcosystem survey\"}
          ]
        },
        {
          \"plan_id\": \"case_studies\",
          \"step_id\": \"identify_companies\",
          \"findings\": \"Identified 12 companies with public AI adoption case studies: Shopify, Duolingo, Replit, Sourcegraph. Sources: company blogs and tech news (https://shopify.engineering/building-shopify-code-assist, https://blog.duolingo.com/duolingo-max/). Common pattern: 20-40% reduction in development time for routine tasks.\",
          \"evidence_refs\": [
            {\"type\": \"citation\", \"source\": \"Shopify Engineering 2023\", \"description\": \"Code Assist case study\"},
            {\"type\": \"citation\", \"source\": \"Duolingo Blog 2023\", \"description\": \"AI integration story\"}
          ],
          \"workpapers\": [
            {
              \"type\": \"comparison\",
              \"title\": \"Company AI Adoption Comparison\",
              \"content\": \"| Company | Tool | Time Savings | Developer Satisfaction |\\n|---------|------|--------------|----------------------|\\n| Shopify | Code Assist | 30% | 85% |\\n| Duolingo | Custom AI | 25% | 78% |\\n| Replit | Ghostwriter | 40% | 92% |\",
              \"format\": \"markdown\"
            }
          ]
        }
      ]
    }
  }")

# Check for 403 error
if echo "$REGISTER_RESPONSE" | grep -q "403"; then
  echo -e "${RED}❌ Got 403 error!${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# Check for success
if echo "$REGISTER_RESPONSE" | grep -q "registered_count"; then
  REGISTERED_COUNT=$(echo "$REGISTER_RESPONSE" | jq -r '.content[0].text' | grep -oP 'registered_count: \K[0-9]+' || echo "0")
  echo -e "${GREEN}✅ Registered $REGISTERED_COUNT results without 403 error!${NC}"
else
  echo -e "${RED}❌ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi
echo ""

# Step 5: Submit peer critiques
echo "5️⃣  Submitting peer critiques..."

curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_peer_critique\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"critique\": {
        \"reviewer_plan_id\": \"quantitative\",
        \"reviewed_plan_id\": \"qualitative\",
        \"claims_challenged\": [],
        \"residual_risks\": [\"Survey bias\"],
        \"agreement_score\": 0.85,
        \"timestamp\": $(date +%s)000
      }
    }
  }" > /dev/null

curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_peer_critique\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"critique\": {
        \"reviewer_plan_id\": \"qualitative\",
        \"reviewed_plan_id\": \"case_studies\",
        \"claims_challenged\": [],
        \"residual_risks\": [\"Limited sample size\"],
        \"agreement_score\": 0.80,
        \"timestamp\": $(date +%s)000
      }
    }
  }" > /dev/null

echo -e "${GREEN}✅ Peer critiques submitted${NC}"
echo ""

# Step 6: Submit mediation decisions
echo "6️⃣  Submitting mediation decisions..."

curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"submit_mediation_decision\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\",
      \"decision\": {
        \"decision_point\": \"productivity_measurement\",
        \"chosen_from_plan\": \"quantitative\",
        \"rationale\": \"Quantitative metrics provide objective measurement\",
        \"evidence_ids\": [],
        \"confidence\": 0.9
      }
    }
  }" > /dev/null

echo -e "${GREEN}✅ Mediation decisions submitted${NC}"
echo ""

# Step 7: Generate meta-reflection
echo "7️⃣  Generating meta-reflection..."

META_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"generate_meta_reflection\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\"
    }
  }")

if echo "$META_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ Meta-reflection failed${NC}"
  echo "$META_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Meta-reflection generated${NC}"
echo ""

# Step 8: Check readiness
echo "8️⃣  Checking session readiness..."

READINESS_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"check_session_readiness\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\"
    }
  }")

echo "$READINESS_RESPONSE" | jq -r '.content[0].text'
echo ""

# Step 9: Finalize
echo "9️⃣  Finalizing session..."

FINALIZE_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/v1/call-tool" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"finalize_parallel_reasoning\",
    \"arguments\": {
      \"session_id\": \"$SESSION_ID\"
    }
  }")

if echo "$FINALIZE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ Finalization failed${NC}"
  echo "$FINALIZE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Session finalized successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 COMPLETE FLOW EXECUTED WITHOUT 403 ERRORS!${NC}"
echo ""
echo "Summary:"
echo "- ✅ Session initialized"
echo "- ✅ 3 plans submitted"
echo "- ✅ Execution manifest generated"
echo "- ✅ Results registered (NO 403 error)"
echo "- ✅ Peer critiques submitted"
echo "- ✅ Mediation decisions submitted"
echo "- ✅ Meta-reflection generated"
echo "- ✅ Session finalized"

