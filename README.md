# 🧠 MCP PTU Server - Capability-Driven Business Analysis

**Version 5.0.2** | **LLM-Centric Parallel Reasoning, Evidence-Backed, Industry-Aware, Production-Ready**

A next-generation [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server featuring a **capability-driven architecture** for enterprise business analysis with **58 advanced capabilities** across 8 business domains, plus **8 parallel reasoning tools** for multi-path analysis with diversity enforcement and contamination.

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed-Cloudflare%20Workers-orange)](https://mcp-server.vf-ghizzoni.workers.dev)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-5.0.2-green)](https://github.com/VFG92/mcp-ptu-server)
[![Capabilities](https://img.shields.io/badge/Capabilities-58-brightgreen)](./AGENT.md#-46-advanced-capabilities-v40)

---

## 🎯 What is This?

An MCP server that enables **ChatGPT Developer Mode** to perform **evidence-backed, industry-specific business analysis** with:

- **58 Advanced Capabilities** - Across 8 business domains (Corporate Strategy, Marketing, Finance, Operations, IT, Legal, HR, Analytics)
- **11 Native-Integrated Capabilities** - Explicit Python/Web Search integration for financial modeling, market intelligence, and advanced analytics (+18.5% avg confidence)
- **Industry Adapters** - Specialized templates for Automotive, Pharmaceutical, Energy, Financial Services, and 20+ more
- **LLM Native Integration** - Python execution, web search, data analysis with graceful degradation
- **Evidence Tracking** - 6 types (CALCULATION, RETRIEVAL, PRECEDENT, ASSUMPTION, SIMULATION, HEURISTIC)
- **Budget Awareness** - Token, CPU, memory tracking with cost optimization
- **Confidence Scoring** - 5-component quality formula with precision metrics (0.65-0.90)
- **Output Validation** - Strong Zod schemas for type safety
- **Tournament Mode** - Multi-criteria judging for best results (enabled by default)
- **Full Audit Trail** - Complete execution history with artifact versioning
- **🆕 Persistent Storage** - End-to-end persistence with Durable Objects (v4.1)

---

## ✨ Key Features

### 🆕 Version 5.0.2 - Constraints Update & Wrangler Update (2025-10-01)

**Constraints Update**:
- ✅ `min_plans`: Updated from 2-8 to **3-32** (default 3)
- ✅ `capability_chain`: Added validation **8-32 capabilities** per workflow
- ✅ All tests passing (161/161), build successful

**Dependencies**:
- ✅ Wrangler: Updated to **4.40.3** (no breaking changes)

### 🆕 Version 5.0 - Parallel Reasoning (LLM-Centric Architecture)

#### Multi-Path Reasoning with Diversity Enforcement
- ✅ **8 New MCP Tools** - Complete parallel reasoning workflow: init, submit_plan, execute_step, cross_note, peer_critique, mediation, list_status, finalize
- ✅ **Diversity Validation** - Server enforces ≥2 axes difference between plans (prevents deriva semantica)
- ✅ **Contamination** - Cross-plan notes enable interaction between reasoning paths
- ✅ **LLM-Centric Design** - ChatGPT is sole deliberative agent, MCP provides guardrails + memory
- ✅ **Evidence-Based Mediation** - Final decisions must cite evidence IDs from plans
- ✅ **6 Diversity Axes** - data_sources, analytical_models, time_horizons, quality_metrics, risk_perspectives, stakeholder_views
- ✅ **Quality Boost** - Based on Self-Consistency (Wang 2022), Tree-of-Thoughts (Yao 2023), Multi-Agent Debate (Du 2023)
- ✅ **Session Persistence** - Resolved Durable Object routing issues for reliable multi-step workflows

**Architecture Principle**: MCP = Guardrails + Persistent Memory | ChatGPT = Planning + Reasoning + Mediation

**⚠️ Critical Requirement**: For parallel reasoning to work correctly, clients **MUST** maintain the same `mcp-session-id` header across all tool calls in a workflow. Each request without a consistent session ID creates a new Durable Object, causing "Session not found" errors. See [AGENT.md](./AGENT.md#-important-session-persistence-requirements) for technical details.

### 🆕 Version 4.2 Enhancements

#### Peer Review System for Multi-Agent Consensus
- ✅ **PeerReviewKernel** - Each agent critiques every other result, producing agreement matrices and consensus insights
- ✅ **Consensus/Conflict Metrics** - Consensus, conflict, robustness, critical disagreements, and review quality available in orchestration results
- ✅ **Tournament Integration** - Peer agreement boosts ELO scores while controversy introduces penalties, sharpening final rankings
- ✅ **Orchestrator Controls** - `peer_review_mode` toggle (default `true`) keeps the feature backward compatible
- ✅ **Developer Visibility** - Results exposed via `result.peer_review` plus runnable example in `examples/peer-review-example.ts`

### 🆕 Version 4.0 Enhancements

#### 58 Advanced Capabilities Across 8 Domains (11 with Explicit Native Integration)
- ✅ **Corporate Strategy & Growth** (5) - Portfolio strategy, M&A screening, scenario wargaming, sustainability, geopolitical risk
- ✅ **Marketing & Sales** (7) - Customer segmentation, WTP analysis, brand equity, GTM, digital ROI, journey mapping, churn prediction
- ✅ **Finance & Valuation** (7) - DCF modeling, TSR simulation, capital structure, cost reduction, working capital, IPO readiness, scenario forecasting
- ✅ **Operations & Supply Chain** (6) - Lean ops, footprint optimization, inventory scenarios, procurement, quality analysis, aftermarket economics
- ✅ **Process Excellence & IT** (7) - Process mining, RPA opportunities, IT architecture, cloud TCO, cybersecurity, data governance, AI use cases
- ✅ **Legal & Regulatory** (5) - Regulatory scanning, compliance gaps, contract risk, IP landscape, antitrust impact
- ✅ **People & HR** (6) - Org health, talent economics, skill gaps, change management, workforce scenarios, compensation benchmarking
- ✅ **Advanced Analytics** (6) - Monte Carlo finance, text mining, innovation radar, scenario engine, pricing AI, digital twins

#### Industry-Specific Adapters
- ✅ **Automotive** - BEV transition, ADAS, UN R155/R156 compliance, supply chain resilience
- ✅ **Pharmaceutical** - Clinical trials, FDA/EMA approval, patent cliff management, pharmacovigilance
- ✅ **Energy** - Renewable transition, grid modernization, carbon pricing, LCOE optimization
- ✅ **Financial Services** - Basel III, MiFID II, digital banking, fintech disruption
- ✅ **20 Industry Verticals** - Manufacturing, Retail, Healthcare, Telecom, Aerospace, and more

#### LLM Native Capabilities Integration
- ✅ **Python Execution** - Real statistical simulations, complex calculations, data analysis
- ✅ **Web Search** - Real-time market intelligence, competitive monitoring, news analysis
- ✅ **Web Browsing** - Regulatory updates, detailed content extraction, structured data
- ✅ **Data Analysis** - Advanced analytics, visualizations, statistical modeling
- ✅ **Extensible Architecture** - Easy integration with OpenAI, Anthropic, and other LLM providers

### 🔧 Core Architecture (v3.0+)
- ✅ **Atomic Capabilities** - Composable analysis units with clear contracts
- ✅ **Evidence Ledger** - Track and verify all claims with quality scoring
- ✅ **Budget Scheduler** - Wave-based execution (cheap → expensive)
- ✅ **Confidence Calculus** - Weighted quality scoring with precision metrics
- ✅ **Whiteboard Memory** - Versioned artifact storage with full audit trail
- ✅ **Tournament Kernel** - Multi-criteria judging for optimal results
- ✅ **Policy Enforcement** - PII filtering, compliance, data governance

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/VFG92/mcp-ptu-server
cd mcp-ptu-server
npm install
npm test
npm run build
wrangler deploy
```

### Usage with ChatGPT

Add MCP server: `https://mcp-server.vf-ghizzoni.workers.dev`

#### Example 1: Industry-Specific Analysis (Automotive)

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "automotive_analysis_001",
    "task": "Analyze BEV market opportunity for automotive OEM in Europe. Include regulatory compliance (UN R155/R156), competitive landscape, and supply chain risks.",
    "adapter_id": "comprehensive",
    "context": {
      "industry": "automotive",
      "region": "europe",
      "competitors": ["Tesla", "VW Group", "BYD"]
    },
    "budget": {
      "max_tokens_in": 15000,
      "max_tokens_out": 15000
    }
  }
}
```

#### Example 2: Financial Modeling with Monte Carlo

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "finance_mc_001",
    "task": "Perform Monte Carlo simulation for revenue forecast with 10,000 iterations. Base case: $500M revenue, 20% std dev.",
    "adapter_id": "finance",
    "enable_native_capabilities": true,  // Enable Python execution
    "budget": {
      "max_tokens_in": 10000,
      "max_tokens_out": 10000
    }
  }
}
```

#### Example 3: Market Intelligence with Web Search

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "market_intel_001",
    "task": "Scan market for recent M&A activity in pharmaceutical sector. Focus on cell & gene therapy acquisitions.",
    "adapter_id": "strategy",
    "enable_native_capabilities": true,  // Enable web search
    "context": {
      "industry": "pharmaceutical",
      "region": "global"
    }
  }
}
```

#### Example 4: Parallel Reasoning (v5.0 - Multi-Path Analysis)

**Step 1: Initialize Session**
```typescript
{
  "name": "init_parallel_reasoning",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "task_description": "Analyze European fintech market for B2B SaaS opportunities",
    "required_diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
    "min_plans": 3  // 3-32 plans, each with 8-32 capabilities
  }
}
```

**Step 2: Submit Diverse Plans** (ChatGPT generates 3 plans internally)
```typescript
// Plan A: Official statistics + Regression
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "plan": {
      "plan_id": "plan_A",
      "description": "Data-driven baseline using official market statistics",
      "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
      "capability_chain": ["market_scan", "tam_sam_som_build", "competitor_analysis"],
      "rationale": "Provides reliable baseline using official statistics and proven regression techniques",
      "expected_outputs": ["market_map", "tam_sam_som"]
    }
  }
}

// Plan B: Industry reports + Monte Carlo (shares required axes, adds risk lens)
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "plan": {
      "plan_id": "plan_B",
      "description": "Probabilistic modeling using industry research",
      "diversity_axes": ["data_sources", "analytical_models", "risk_perspectives"],
      "capability_chain": ["market_scan", "monte_carlo_finance"],
      "rationale": "Extends baseline with Monte Carlo simulations and risk assessments",
      "expected_outputs": ["market_map", "monte_carlo_results"]
    }
  }
}

// Plan C: Academic research + Normative analysis (shares required axes, adds quality & stakeholder views)
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "plan": {
      "plan_id": "plan_C",
      "description": "Normative perspective using academic research",
      "diversity_axes": ["data_sources", "analytical_models", "quality_metrics", "stakeholder_views"],
      "capability_chain": ["market_scan", "regulatory_scan"],
      "rationale": "Incorporates qualitative stakeholder insights with academic benchmarks",
      "expected_outputs": ["market_map", "regulatory_analysis"]
    }
  }
}
```

> ℹ️ **Plan IDs must be unique per session.** The server rejects duplicate `plan_id` values and preserves existing results.

**Step 3: Execute Plan Steps (results persist on the session manager you provide)**
```typescript
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "plan_id": "plan_A",
    "task": "Run market_scan for plan A",
    "adapter_id": "strategy"
  }
}

// Response includes "# Plan Step Executed: plan_A" followed by capability output.
// Result is recorded via the injected ParallelReasoningSessionManager (supports Durable Objects).
```

> ✅ **Structural validation:** cross-plan notes, peer critiques, and mediation decisions must reference plans that exist in the session. Invalid references return a structured validation error so you can correct the request.

**Step 4: Contamination** (Plans exchange insights)
```typescript
{
  "name": "submit_cross_plan_note",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "from_plan_id": "plan_A",
    "to_plan_id": "plan_B",
    "note": "Found market size €50B using official statistics. Consider this baseline in your Monte Carlo simulation.",
    "references": ["evidence_001", "evidence_002"]
  }
}
```

**Step 5: Peer Review** (ChatGPT generates critiques)
```typescript
{
  "name": "submit_peer_critique",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "reviewer_plan_id": "plan_B",
    "reviewed_plan_id": "plan_A",
    "critique": {
      "claims_challenged": ["Assumes linear growth, but market shows high volatility"],
      "falsification_tests": ["Test with 2008 crisis data"],
      "residual_risks": ["Regulatory changes not considered"],
      "agreement_score": 0.65
    }
  }
}
```

**Step 6: Mediation** (ChatGPT chooses best approach for each decision)
```typescript
{
  "name": "submit_mediation_decision",
  "arguments": {
    "session_id": "fintech_parallel_001",
    "decision": {
      "decision_point": "Market size estimation",
      "chosen_from_plan": "plan_B",
      "rationale": "Monte Carlo provides confidence intervals, more robust than point estimate",
      "evidence_ids": ["evidence_005", "evidence_006"],
      "confidence": 0.82
    }
  }
}
```

**Step 7: Finalize**
```typescript
{
  "name": "finalize_parallel_reasoning",
  "arguments": {
    "session_id": "fintech_parallel_001"
  }
}
```

**Result**: ChatGPT presents mediated answer with decision map showing which plan contributed each insight, with evidence citations and consensus score.

---

## 📚 Available Tools (12 tools)

### Capability-Driven Analysis (4 tools)

### `analyze_with_capabilities`
Main analysis tool with evidence tracking, industry adaptation, and budget awareness.

**Arguments**:
- `session_id` - Unique session ID
- `task` - Analysis task description
- `adapter_id` - `strategy`, `finance`, `commercial`, `risk`, `comprehensive`
- `context` - Optional: `{ industry, region, competitors, entity_names }`
- `enable_native_capabilities` - Enable Python, web search, data analysis (default: false)
- `budget` - Optional budget constraints
- `tournament_mode` - Enable for highest quality

**Returns**: Artifacts with confidence scores, evidence, budget consumption, industry-specific insights

**Status**: ✅ Production Ready | 46 Capabilities | 20 Industries

---

### `list_capabilities`
Browse available capabilities by category or tag.

**Returns**: 46 advanced capabilities across 8 categories:
- Corporate Strategy & Growth (5)
- Marketing & Sales (7)
- Finance & Valuation (7)
- Operations & Supply Chain (6)
- Process Excellence & IT (7)
- Legal & Regulatory (5)
- People & HR (6)
- Advanced Analytics (6)

**Status**: ✅ Production Ready | Fully Documented

---

### `get_capability_status`
Check status of capability analysis session.

**Arguments**:
- `session_id` - Session identifier

**Returns**: Progress, artifacts produced, budget consumed

**Status**: ✅ Production Ready

---

### `export_session`
Export complete session for audit/compliance.

**Arguments**:
- `session_id` - Session identifier

**Returns**: Complete session data with artifacts, evidence, confidence scores, audit trail

**Status**: ✅ Production Ready

---

### Parallel Reasoning v5.0 (8 tools - NEW)

**LLM-Centric Architecture**: MCP provides guardrails + memory, ChatGPT is sole deliberative agent

#### `init_parallel_reasoning`
Initialize parallel reasoning session with diversity requirements.

**Arguments**:
- `session_id` - Unique session identifier
- `task_description` - Task to analyze
- `required_diversity_axes` - Axes that must differ (min 2)
- `min_plans` - Minimum number of plans (3-32, default 3)

**Constraints**:
- **Plans**: 3-32 parallel reasoning plans per session
- **Capabilities**: 8-32 capabilities per plan workflow

**Returns**: Actionable prompt with diversity axes reference

**Status**: ✅ Production Ready | v5.0

---

#### `submit_reasoning_plan`
Submit reasoning plan with diversity validation (≥2 axes differ from existing plans).

**Arguments**: `session_id`, `plan` (with `diversity_axes`, `capability_chain`, `rationale`). Every plan must include the session’s `required_diversity_axes` plus any additional axes needed for differentiation.

**Returns**: Acceptance/rejection with diversity validation feedback

**Status**: ✅ Production Ready | v5.0

---

#### `execute_plan_step`
Execute capability for specific plan (enables parallel execution).

**Arguments**: `session_id`, `plan_id`, `capability_id`, `inputs`

**Returns**: Capability result associated with plan

**Status**: ✅ Production Ready | v5.0

---

#### `submit_cross_plan_note`
Submit note from one plan to another (contamination).

**Arguments**: `session_id`, `from_plan_id`, `to_plan_id`, `note`, `references`

**Returns**: Confirmation of note storage

**Status**: ✅ Production Ready | v5.0

---

#### `submit_peer_critique`
Submit peer critique (ChatGPT-generated).

**Arguments**: `session_id`, `reviewer_plan_id`, `reviewed_plan_id`, `critique`

**Returns**: Confirmation of critique storage

**Status**: ✅ Production Ready | v5.0

---

#### `submit_mediation_decision`
Submit mediation decision with evidence citations.

**Arguments**: `session_id`, `decision` (with `chosen_from_plan`, `evidence_ids`)

**Returns**: Confirmation of decision storage

**Status**: ✅ Production Ready | v5.0

---

#### `list_plan_status`
List pending frames (passive status listing).

**Arguments**: `session_id`

**Returns**: Pending frames (plan executions, peer reviews, decisions)

**Status**: ✅ Production Ready | v5.0

---

#### `finalize_parallel_reasoning`
Finalize session with completeness validation.

**Arguments**: `session_id`

**Returns**: Decision map with mediated result

**Status**: ✅ Production Ready | v5.0

---

## 📋 Complete Capability List

### 46 Advanced Capabilities Across 8 Domains

For detailed descriptions, see [AGENT.md](./AGENT.md#-46-advanced-capabilities-v40)

#### 1. Corporate Strategy & Growth (5)
- `portfolio_strategy` - Portfolio optimization with BCG matrix
- `m_and_a_screening` - M&A target screening with synergy analysis
- `scenario_wargaming` - Competitive scenario simulation
- `sustainability_roadmap` - ESG roadmap with carbon footprint
- `geostrategic_risk_scan` - Geopolitical risk assessment

#### 2. Marketing & Sales (7)
- `customer_segmentation` - Advanced customer clustering
- `wtp_analysis` - Willingness-to-pay analysis
- `brand_equity_tracker` - Brand health tracking
- `gtm_playbook` - Go-to-market strategy
- `digital_marketing_roi` - Digital marketing ROI analysis
- `customer_journey_map` - Customer journey mapping
- `churn_prediction` - Churn prediction with retention strategies

#### 3. Finance & Valuation (7)
- `dcf_modeler` - DCF valuation with scenarios
- `tsr_simulator` - Total shareholder return simulation
- `capital_structure_optimizer` - Optimal capital structure
- `cost_reduction_levers` - Cost reduction opportunities
- `working_capital_diagnostic` - Working capital optimization
- `ipo_readiness` - IPO readiness assessment
- `scenario_forecasting` - Financial scenario forecasting

#### 4. Operations & Supply Chain (6)
- `lean_ops_benchmark` - Lean operations benchmarking
- `footprint_optimizer` - Manufacturing footprint optimization
- `inventory_scenario` - Inventory optimization
- `procurement_index` - Procurement performance index
- `quality_defect_analysis` - Quality defect analysis
- `aftermarket_economics` - Aftermarket economics

#### 5. Process Excellence & IT (7)
- `process_mining` - Process mining with bottleneck identification
- `rpa_opportunity_scan` - RPA opportunity scanning
- `it_architecture_map` - IT architecture mapping
- `cloud_tco_model` - Cloud TCO modeling
- `cybersecurity_risk_model` - Cybersecurity risk assessment
- `data_governance_index` - Data governance maturity
- `ai_use_case_screener` - AI/ML use case screening

#### 6. Legal & Regulatory (5)
- `regulatory_scan_enhanced` - Enhanced regulatory scanning
- `compliance_gap_assessment` - Compliance gap assessment
- `contract_risk_analyzer` - Contract risk analysis
- `ip_landscape` - IP landscape analysis
- `antitrust_impact` - Antitrust impact assessment

#### 7. People & HR (6)
- `org_health_index` - Organizational health assessment
- `talent_economics` - Talent economics analysis
- `skill_gap_analyzer` - Skill gap analysis
- `change_management_tracker` - Change management tracking
- `workforce_future_scenarios` - Workforce future scenarios
- `compensation_benchmark` - Compensation benchmarking

#### 8. Advanced Analytics (6)
- `monte_carlo_finance` - Monte Carlo financial forecasting
- `text_mining_market` - Market text mining
- `innovation_radar` - Innovation radar with startup scouting
- `scenario_engine` - Scenario engine with adoption curves
- `pricing_ai_optimizer` - AI-powered pricing optimization
- `digital_twin_ops` - Digital twin operations simulation

---

## 🏭 Industry Adapters

### Specialized Adapters for 20+ Industries

Each adapter provides:
- ✅ Industry-specific KPIs and benchmarks
- ✅ Regulatory framework mapping
- ✅ Terminology translation
- ✅ Risk factor identification
- ✅ Competitive landscape insights

**Fully Implemented Adapters:**
- 🚗 **Automotive** - BEV transition, ADAS, UN R155/R156, supply chain
- 💊 **Pharmaceutical** - Clinical trials, FDA/EMA, patent cliff, pharmacovigilance
- ⚡ **Energy** - Renewable transition, grid modernization, carbon pricing, LCOE
- 🏦 **Financial Services** - Basel III, MiFID II, digital banking, fintech

**Additional Industries Supported:**
- Manufacturing, Retail, Healthcare, Telecommunications, Aerospace
- Agriculture, Construction, Education, Media & Entertainment, Logistics
- Real Estate, Professional Services, Government, Enterprise SaaS, Consumer SaaS

See [src/workers/industry-adapters.ts](./src/workers/industry-adapters.ts) for implementation details.

---

## 🔍 Tool Verification Status

**4 production-ready tools tested and verified via ChatGPT Developer Mode (2025-09-30)**

### Test Results Summary
- ✅ **`analyze_with_capabilities`** - Tested with comprehensive market analysis
  - 46 capabilities available across 8 domains
  - Industry-specific adaptation for 20+ verticals
  - Confidence: ~70-85%, Evidence quality: High
  - Budget tracking: Full token/CPU/subrequest monitoring
  - Native LLM capabilities: Python, web search, data analysis

- ✅ **`list_capabilities`** - Verified 46 advanced capabilities across 8 categories
  - Corporate Strategy (5), Marketing & Sales (7), Finance (7), Operations (6)
  - Process & IT (7), Legal & Regulatory (5), People & HR (6), Analytics (6)

- ✅ **`get_capability_status`** - Session status tracking operational

- ✅ **`export_session`** - Complete session export with audit trail

### Legacy Tools
Legacy persona-based tools (8 tools) have been **removed from the public API** but remain functional internally for backward compatibility. New integrations should use only the 4 capability-driven tools above.

---

## 🤝 Peer Review Metrics & Usage

- **Consensus Score (0-1)** – Measures agreement among agent outputs (>0.8 = strong alignment)
- **Conflict Score (0-1)** – Highlights disagreement hot spots (inverse of consensus)
- **Robustness Score (0-1)** – Blends consensus, reviewer confidence, and controversy penalties
- **Critical Disagreements** – Counts high-impact conflicts that merit follow-up investigation
- **Review Quality (0-1)** – Assesses thoroughness of critiques and cross-checks

Peer review runs by default whenever the orchestrator executes multiple trajectories. Toggle it explicitly with `peer_review_mode: false` if you need a faster, single-pass run.

```typescript
const result = await orchestrator.execute({
  session_id: 'session_001',
  task: 'Market analysis',
  budget: defaultBudget,
  policy: defaultPolicy,
  // peer_review_mode defaults to true
});

if (result.peer_review) {
  console.log('Consensus', result.peer_review.consensus_score);
  console.log('Robustness', result.peer_review.robustness_score);
  console.log('Critical disagreements', result.peer_review.critical_disagreements);
}
```

### MCP Integration

- `peer_review_mode` is now part of the MCP tool schema for `analyze_with_capabilities` and defaults to `true`.
- Clients can explicitly disable peer review for faster runs by sending `"peer_review_mode": false` in the MCP request.

MCP request examples:

```json
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "market_analysis_001",
    "task": "Analyze the European fintech market for B2B SaaS opportunities",
    "adapter_id": "strategy",
    "tournament_mode": true
  }
}
```

```json
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "quick_check_001",
    "task": "Quick baseline churn analysis",
    "adapter_id": "commercial",
    "peer_review_mode": false
  }
}
```

---

## 🏛️ Architecture

```
MCP Client (ChatGPT)
        ↓
MCP Server (everything-workers.ts)
        ↓
Capability Orchestrator
  ├─ Planner (Beam Search)
  ├─ Scheduler (Wave-Based)
  ├─ Industry Adapter (Context Injection)
  └─ Executor (Parallel)
        ↓
    ┌───┴───┬───────┬──────────┬──────────┬─────────────┐
    ↓       ↓       ↓          ↓          ↓             ↓
Capability Evidence Whiteboard Tournament Industry   Native LLM
  Graph    Ledger   Memory     Kernel    Adapters   Capabilities
  (46)     (6 types) (Versioned) (Judging) (20+)    (Python/Web)
        ↓
Durable Objects (State Storage)
```

### Key Components

#### Capability Graph (46 Capabilities)
- **8 Categories**: Corporate Strategy, Marketing, Finance, Operations, IT, Legal, HR, Analytics
- **Atomic Units**: Each capability is self-contained with clear inputs/outputs
- **Composable**: Capabilities can be chained and orchestrated
- **Evidence-Backed**: All outputs include evidence with quality scoring

#### Industry Adapters (20+ Industries)
- **Context Injection**: Automatically adapts analysis to industry vertical
- **Regulatory Mapping**: Industry-specific compliance requirements
- **KPI Benchmarking**: Relevant metrics and typical ranges
- **Terminology Translation**: Domain-specific language
- **Competitive Insights**: Market structure and success factors

#### Native LLM Capabilities
- **Python Execution**: Real statistical simulations, complex calculations
- **Web Search**: Real-time market intelligence, competitive monitoring
- **Web Browsing**: Regulatory updates, detailed content extraction
- **Data Analysis**: Advanced analytics, visualizations
- **Extensible**: Easy integration with OpenAI, Anthropic, other providers

#### Evidence Ledger (6 Types)
- `CALCULATION` - Mathematical computations with formulas
- `RETRIEVAL` - Data fetched from external sources
- `PRECEDENT` - Historical examples and benchmarks
- `ASSUMPTION` - Stated assumptions with rationale
- `SIMULATION` - Monte Carlo and scenario modeling
- `HEURISTIC` - Expert rules and frameworks

#### Whiteboard Memory
- **Versioned Artifacts**: Full history of all generated artifacts
- **Cross-Capability Sharing**: Capabilities can read/write shared state
- **Audit Trail**: Complete execution history for compliance

#### Tournament Kernel
- **Multi-Criteria Judging**: Evaluate outputs on multiple dimensions
- **Confidence Scoring**: 5-component quality formula
- **Best-of-N Selection**: Choose optimal result from multiple attempts

---

## 📊 Adapters

| Adapter | Focus | Use Case |
|---------|-------|----------|
| `strategy` | Strategic Analysis | Market entry, strategic planning |
| `finance` | Financial Modeling | Investment analysis, financial planning |
| `commercial` | Go-to-Market | Product launch, sales strategy |
| `risk` | Risk Management | Risk analysis, due diligence |
| `comprehensive` | Full Analysis | Complete business analysis |

---

## 🎯 Use Cases

### Market Analysis
```typescript
{
  "task": "Analyze market opportunity for AI-powered CRM",
  "adapter_id": "strategy"
}
```

### Financial Modeling
```typescript
{
  "task": "Calculate unit economics for subscription business",
  "adapter_id": "finance"
}
```

### Risk Assessment
```typescript
{
  "task": "Assess risks for international expansion",
  "adapter_id": "risk"
}
```

---

## 📈 Performance

- **Wave 1 Latency**: 500-1000ms (cheap capabilities)
- **Wave 2 Latency**: 2000-5000ms (expensive capabilities)
- **Token Usage**: 2000-5000 tokens per analysis
- **CPU Time**: <50ms per request
- **Memory**: <128MB

---

## 🔒 Security

- ✅ PII Filtering
- ✅ Financial Data Protection
- ✅ Audit Trail
- ✅ Evidence Verification
- ✅ Policy Enforcement

---

## 📖 Documentation

### Complete Documentation (2 Files Only)

#### **[README.md](./README.md)** - This File
- Overview and quick start
- 58 capabilities list with descriptions
- Industry adapters (20+ industries)
- Usage examples and best practices
- Version history and what's new

#### **[AGENT.md](./AGENT.md)** - Technical Documentation
- Complete architecture overview
- Detailed capability specifications
- Industry adapter implementations
- Native LLM integration guide
- MCP Tools API reference
- Deployment and configuration
- Development guide
- Bug fixes and improvements (v4.1.1)

### Key Implementation Files
- **[src/workers/capabilities/](./src/workers/capabilities/)** - All 58 capability implementations (12 files)
- **[src/workers/industry-adapters.ts](./src/workers/industry-adapters.ts)** - Industry-specific adapters (4 fully implemented)
- **[src/workers/industry-context.ts](./src/workers/industry-context.ts)** - Industry context system (20+ verticals)
- **[src/workers/llm-native-capabilities.ts](./src/workers/llm-native-capabilities.ts)** - Native LLM capability integration
- **[src/workers/capability-orchestrator.ts](./src/workers/capability-orchestrator.ts)** - Main orchestration engine
- **[src/workers/capability-tools.ts](./src/workers/capability-tools.ts)** - MCP tools implementation

---

## 🛠️ Development

```bash
npm install          # Install dependencies
npx tsc --noEmit     # Type check
npm test             # Run tests
npm run test:coverage # Coverage report
wrangler deploy      # Deploy
```

---

## 📊 Monitoring

- **Health**: `GET /health`
- **Metrics**: `GET /metrics`

---

## 🔄 Migration from v2.x

| Old (Persona-Based) | New (Capability-Driven) |
|---------------------|-------------------------|
| `parallel_reasoning_init` | `analyze_with_capabilities` |
| `strategy_consultant` | `adapter_id: 'strategy'` |
| No evidence | Full evidence ledger |
| No budget tracking | Budget constraints |
| No confidence | Confidence calculus |

**Key Changes**:
- Replace persona-based tools with `analyze_with_capabilities`
- Use `adapter_id` parameter to specify industry context
- All capabilities now provide evidence backing
- Budget constraints enforced automatically
- Confidence scores calculated for all outputs

---

## 🆕 What's New in v4.0

### Major Enhancements
- ✅ **46 Advanced Capabilities** - Across 8 business domains (Corporate Strategy, Marketing, Finance, Operations, IT, Legal, HR, Analytics)
- ✅ **Industry Adapters** - Specialized templates for 20+ industries (Automotive, Pharmaceutical, Energy, Financial Services, etc.)
- ✅ **LLM Native Integration** - Python execution, web search, data analysis capabilities
- ✅ **Entity Name Preservation** - Use actual competitor/entity names instead of anonymizing
- ✅ **Enhanced Monitoring** - Real-time session status tracking with capability execution progress
- ✅ **Complete Audit Trail** - Full artifact data in session exports

### v4.0 Statistics
- **Capabilities**: 46 advanced capabilities (up from 9 in v3.0)
- **Categories**: 8 business domains
- **Industries**: 20+ industry verticals with specialized adapters
- **Files Created**: 12 new capability files + 2 adapter files + 1 native integration system
- **Lines of Code**: ~8,000+ lines (including all capabilities)
- **Compilation**: ✅ TypeScript compilation successful (0 errors)
- **Documentation**: 4 comprehensive guides + implementation summary

### v3.0 Foundation
- ✅ **Capability-Driven System** - Atomic, composable analysis units
- ✅ **Evidence Tracking** - 6 evidence types with verification
- ✅ **Budget Awareness** - Token, CPU, memory tracking
- ✅ **Confidence Scoring** - 5-component quality formula
- ✅ **Output Validation** - Strong Zod schemas
- ✅ **Tournament Mode** - Multi-criteria judging
- ✅ **Audit Trail** - Complete execution history

---

## ✅ Quality Verification

- `npm test` → **105 tests passing** (includes 7 new peer review tests)
- `npm test -- __tests__/peer-review.test.ts` → Focused peer review coverage
- `npx tsc --noEmit` → TypeScript strict compilation with **0 errors**
- `npx ts-node examples/peer-review-example.ts` → End-to-end peer review walkthrough

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests
4. Submit a pull request

---

## 📁 Project Structure

```
mcp-ptu-server/
├── src/workers/              # Core server implementation
│   ├── capabilities/         # 58 business capabilities (8 domains)
│   ├── deprecated/           # Legacy code (v2.x, pre-v5.0)
│   ├── examples/             # Code examples and integration guides
│   ├── everything-workers.ts # Main MCP server with tool handlers
│   ├── session.ts            # Durable Object session management
│   ├── parallel-reasoning-*.ts # Parallel reasoning v5.0 tools
│   └── capability-*.ts       # Capability orchestration system
├── __tests__/                # Comprehensive test suite (20 test files)
├── examples/                 # Working examples (parallel reasoning, peer review)
├── scripts/                  # Test and utility scripts
│   ├── test-parallel-reasoning-simple.sh
│   └── test-parallel-reasoning-fix.sh
├── docs/                     # Additional documentation (if needed)
├── README.md                 # User documentation (this file)
├── AGENT.md                  # Technical documentation
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── wrangler.toml             # Cloudflare Workers configuration
```

**Key Directories**:
- **`src/workers/capabilities/`** - All 58 business capabilities organized by domain
- **`src/workers/deprecated/`** - Legacy code kept for reference (will be removed in v6.0)
- **`__tests__/`** - Unit and integration tests with 100% coverage of critical paths
- **`scripts/`** - Test scripts for smoke testing and validation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

---

## 🆕 What's New in v4.2.0

### Peer Review System
- ✅ **Critical Peer Review** - Agents now critique each other's results, not just generate parallel scenarios
- ✅ **Consensus/Conflict Measurement** - Quantitative robustness metrics based on peer agreement
- ✅ **Self-Validation** - Internal self-evaluation mechanism where consensus indicates robustness
- ✅ **Automatic Conflict Detection** - Critical disagreements automatically identified
- ✅ **Enhanced Tournament** - Rankings now include peer review insights
- ✅ **Enabled by Default** - Can be disabled with `peer_review_mode: false`

### Bug Fixes

#### v5.0.1 - Parallel Reasoning Session Persistence (2025-10-01)
- ✅ **Session Persistence** - Fixed "Session not found" errors in parallel reasoning workflow
- ✅ **Durable Object Routing** - Resolved inconsistent DO routing between requests
- ✅ **Diversity Axes Validation** - Fixed "0 axes" error (was symptom of session persistence issue)
- ✅ **Defensive Checks** - Added validation in all 8 parallel reasoning tool handlers
- ✅ **Enhanced Logging** - Comprehensive session management tracking
- ✅ **Test Coverage** - Added `test-parallel-reasoning-simple.sh` demonstrating correct usage

#### v4.1.1 - Capability Session Persistence
- ✅ **Session State Persistence** - Fixed session costs and execution history being reset on every call
- ✅ **Artifact Versioning** - Fixed artifact versions always resetting to 1, now properly increments (1 → 2 → 3)
- ✅ **Orchestrator Reuse** - Orchestrator instance now reused when storage references unchanged
- ✅ **Audit Trail** - Complete version history now maintained for compliance
- ✅ **Test Coverage** - Added comprehensive test suite for session persistence and versioning

### Technical Details
See [AGENT.md](./AGENT.md) for complete technical documentation including session persistence requirements, peer review system, and bug fix details.

---

**Ready to get started?** Check out [AGENT.md](./AGENT.md) for complete technical documentation!
