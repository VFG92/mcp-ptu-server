# 🧠 MCP PTU Server

**Version 5.2.0** | LLM-Centric Parallel Reasoning with Guided Responses

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed-Cloudflare%20Workers-orange)](https://mcp-server.vf-ghizzoni.workers.dev)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-5.2.0-green)](https://github.com/VFG92/mcp-ptu-server)
[![Tests](https://img.shields.io/badge/Tests-162%2F162-brightgreen)]()

An MCP server that enables **ChatGPT** to orchestrate multi-path business analysis. **You (ChatGPT) are the sole deliberative agent** — the server provides only guardrails (diversity validation) and persistent memory. You generate diverse reasoning plans, cross-contaminate insights, peer review, and mediate final decisions.

---

## 🚀 Quick Start

### Connect to ChatGPT

1. Open ChatGPT Settings → Beta Features → Enable "Developer Mode"
2. Add MCP Server: `https://mcp-server.vf-ghizzoni.workers.dev`
3. Start using the prompt templates below!

### ⚠️ Important: Session Keep-Alive

**For long-running workflows (>30 seconds between tool calls)**, you must send heartbeats to prevent session eviction:

```bash
# Send heartbeat every 20 seconds
POST /heartbeat
Headers: mcp-session-id: <your-session-id>
```

See [HEARTBEAT.md](./HEARTBEAT.md) for detailed implementation examples in Python, JavaScript, and Bash.

**Why?** Cloudflare Durable Objects are evicted after 30 seconds of inactivity. Heartbeats keep your session alive during long reasoning periods.

### 📝 Universal Prompt Template

**Core Principle**: You (ChatGPT) orchestrate the entire workflow. MCP provides only guardrails (diversity validation) and persistent memory.

**⚠️ CRITICAL**: There are TWO different session IDs:
1. **MCP Session ID** (header `mcp-session-id`): For Durable Object routing - returned by `initialize`, use for ALL requests
2. **Parallel Reasoning Session ID** (tool argument `session_id`): For your workflow - you choose it, use same value for all parallel reasoning tools

**See [SESSION_ID_EXPLAINED.md](./SESSION_ID_EXPLAINED.md) for detailed explanation and examples.**

#### Template 1: Maximum Coverage (Complex Analysis)

```
I need to analyze: [YOUR TASK]

⚠️ IMPORTANT: Use the SAME session_id for ALL tool calls below (e.g., "analysis_001")

Orchestrate a complete parallel reasoning workflow:

PHASE 1 - INITIALIZATION
⚠️ CALL TOOL: init_parallel_reasoning

{
  "name": "init_parallel_reasoning",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ USE THIS EXACT ID FOR ALL SUBSEQUENT CALLS
    "task_description": "[YOUR TASK]",
    "required_diversity_axes": ["data_sources", "analytical_models"],
    "min_plans": 3
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Session Initialized" with session_id confirmation
- List of diversity axes you must use
- Minimum number of plans required

DO NOT PROCEED until you receive this confirmation.

PHASE 2 - PLAN GENERATION (Real Diversity, Not Cosmetic Variants)
⚠️ CALL TOOL: submit_reasoning_plan (3 times, once per plan)
⚠️ CRITICAL: Use session_id: "analysis_001" for ALL calls
CALL 1 - Submit Plan A:
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID AS INIT
    "plan": {
      "plan_id": "plan_A",
      "description": "Quantitative analysis with official data",
      "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
      "capability_chain": ["capability_1", "capability_2", ..., "capability_N"],  // 8-32 capabilities
      "rationale": "Uses official statistics + regression + 3-year horizon",
      "expected_outputs": ["Market size", "Growth forecast", "Risk assessment"]
    }
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Plan Accepted" if diversity is sufficient (≥2 axes different from existing plans)
- ❌ "Plan Rejected" if diversity is insufficient (<2 axes different)

If rejected, MODIFY the diversity_axes and resubmit.

CALL 2 - Submit Plan B:
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "plan": {
      "plan_id": "plan_B",
      "description": "Risk-adjusted analysis with Monte Carlo",
      "diversity_axes": ["data_sources", "analytical_models", "risk_perspectives"],  // ⚠️ Must differ on ≥2 axes from Plan A
      "capability_chain": ["capability_X", "capability_Y", ..., "capability_Z"],
      "rationale": "Uses industry reports + Monte Carlo + stress scenarios",
      "expected_outputs": ["Risk-adjusted NPV", "Scenario analysis", "Sensitivity"]
    }
  }
}

WAIT FOR RESPONSE. Check if accepted.

CALL 3 - Submit Plan C:
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "plan": {
      "plan_id": "plan_C",
      "description": "Qualitative stakeholder analysis",
      "diversity_axes": ["data_sources", "stakeholder_views", "quality_metrics"],  // ⚠️ Must differ on ≥2 axes from A and B
      "capability_chain": ["capability_P", "capability_Q", ..., "capability_R"],
      "rationale": "Uses expert interviews + stakeholder perspectives + robustness focus",
      "expected_outputs": ["Stakeholder map", "Pain points", "Success criteria"]
    }
  }
}

WAIT FOR RESPONSE. Check if accepted.

PHASE 3 - EXECUTION (Full Decision Tree Coverage)
⚠️ CALL TOOL: execute_plan_step (multiple times per plan)
⚠️ CRITICAL: Use session_id: "analysis_001" for ALL calls

For Plan A, execute each capability:
CALL 1:
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "plan_id": "plan_A",
    "task": "Perform market sizing using official statistics",
    "adapter_id": "strategy",
    "budget": {"max_tokens_in": 15000, "max_tokens_out": 15000}
  }
}

WAIT FOR RESPONSE. The server will return:
- Analysis result with evidence IDs (e.g., evidence_001, evidence_002)
- Record these evidence IDs for later mediation

CALL 2:
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "plan_id": "plan_A",
    "task": "Forecast growth using regression analysis",
    "adapter_id": "finance"
  }
}

WAIT FOR RESPONSE. Record evidence IDs.

Repeat for all capabilities in Plan A (8-32 calls total).
Then repeat for Plan B and Plan C.

PHASE 4 - CONTAMINATION (Cross-Plan Learning)
⚠️ CALL TOOL: submit_cross_plan_note (multiple times)
⚠️ CRITICAL: Use session_id: "analysis_001" for ALL calls

When Plan A discovers something relevant to Plan B:
{
  "name": "submit_cross_plan_note",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "note": {
      "from_plan_id": "plan_A",
      "to_plan_id": "plan_B",
      "note": "Market size is €2.5B with 15% CAGR. Use this as base case for Monte Carlo.",
      "references": ["evidence_001"],  // Evidence IDs from Plan A execution
      "timestamp": 1696118400000
    }
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Cross-plan note recorded"

Repeat for all insights you want to share between plans (5-10 notes total).

PHASE 5 - PEER REVIEW (Challenge Assumptions)
⚠️ CALL TOOL: submit_peer_critique (multiple times)
⚠️ CRITICAL: Use session_id: "analysis_001" for ALL calls

Plan A reviews Plan B:
{
  "name": "submit_peer_critique",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "critique": {
      "reviewer_plan_id": "plan_A",
      "reviewed_plan_id": "plan_B",
      "strengths": ["Comprehensive risk modeling", "Probabilistic outcomes"],
      "weaknesses": ["Assumes normal distribution", "Lacks specific triggers"],
      "suggestions": ["Use log-normal for revenue", "Define regulatory triggers"],
      "confidence": 0.75
    }
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Peer critique recorded"

Repeat for all plan pairs (Plan A→B, Plan A→C, Plan B→A, Plan B→C, Plan C→A, Plan C→B = 6 critiques).

PHASE 6 - MEDIATION (Evidence-Based Synthesis)
⚠️ CALL TOOL: submit_mediation_decision (multiple times)
⚠️ CRITICAL: Use session_id: "analysis_001" for ALL calls

For each major decision point:
{
  "name": "submit_mediation_decision",
  "arguments": {
    "session_id": "analysis_001",  // ⚠️ SAME ID
    "decision": {
      "decision_point": "Target market selection",
      "chosen_from_plan": "plan_A",
      "rationale": "Plan A's data-driven TAM/SAM/SOM provides most defensible sizing. Incorporate Plan B's risk-adjusted NPV and Plan C's customer pain points.",
      "evidence_ids": ["evidence_001", "evidence_042", "evidence_089"],  // Must cite evidence from multiple plans
      "confidence": 0.85
    }
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Mediation decision recorded" if evidence IDs exist
- ❌ "Evidence IDs not found" if you cite non-existent evidence

Repeat for all major decision points (5-15 decisions total).

PHASE 7 - FINALIZATION
⚠️ CALL TOOL: finalize_parallel_reasoning

{
  "name": "finalize_parallel_reasoning",
  "arguments": {
    "session_id": "analysis_001"  // ⚠️ SAME ID
  }
}

WAIT FOR RESPONSE. The server will return:
- ✅ "Session finalized" with complete decision map and audit trail
- ❌ "Incomplete session" if any plans not executed or decisions missing evidence

DO NOT SUMMARIZE OR SYNTHESIZE ON YOUR OWN. The server response contains the complete mediated result.

Execute this workflow end-to-end using the exact tool calls above. The MCP server validates diversity and stores state, but you orchestrate everything.
```

#### Template 2: Rapid Coverage (Time-Constrained)

```
I need to analyze: [YOUR TASK]

⚠️ IMPORTANT: Use session_id "rapid_001" for ALL tool calls below.

Orchestrate a streamlined parallel reasoning workflow:

1. INIT: ⚠️ CALL init_parallel_reasoning
   {"name": "init_parallel_reasoning", "arguments": {"session_id": "rapid_001", "task_description": "[YOUR TASK]", "required_diversity_axes": ["data_sources", "analytical_models"], "min_plans": 3}}
   WAIT FOR RESPONSE.

2. GENERATE 3 PLANS: ⚠️ CALL submit_reasoning_plan (3 times with session_id "rapid_001")
   - Plan A: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities
   - Plan B: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities (must differ on ≥2 axes)
   - Plan C: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities (must differ on ≥2 axes)
   WAIT FOR ACCEPTANCE after each submission.

3. EXECUTE: ⚠️ CALL execute_plan_step (24-36 times with session_id "rapid_001")
   Run capabilities for each plan, cover main decision branches.
   WAIT FOR RESPONSE after each call. Record evidence IDs.

4. CONTAMINATE: ⚠️ CALL submit_cross_plan_note (2-3 times with session_id "rapid_001")
   Share 2-3 key insights between plans.
   WAIT FOR RESPONSE after each call.

5. PEER REVIEW: ⚠️ CALL submit_peer_critique (3 times with session_id "rapid_001")
   Each plan reviews one other (3 total reviews).
   WAIT FOR RESPONSE after each call.

6. MEDIATE: ⚠️ CALL submit_mediation_decision (3-5 times with session_id "rapid_001")
   Make 3-5 key decisions citing evidence from multiple plans.
   WAIT FOR RESPONSE after each call.

7. FINALIZE: ⚠️ CALL finalize_parallel_reasoning
   {"name": "finalize_parallel_reasoning", "arguments": {"session_id": "rapid_001"}}
   WAIT FOR RESPONSE. Use the server's synthesized result.

Execute end-to-end using exact tool calls. MCP validates and stores, you orchestrate.
```

#### Template 3: Deep Coverage (High-Stakes Decision)

```
I need to analyze: [YOUR TASK]

⚠️ IMPORTANT: Use session_id "deep_001" for ALL tool calls below.

Orchestrate an exhaustive parallel reasoning workflow:

1. INIT: ⚠️ CALL init_parallel_reasoning
   {"name": "init_parallel_reasoning", "arguments": {"session_id": "deep_001", "task_description": "[YOUR TASK]", "required_diversity_axes": ["data_sources", "analytical_models", "risk_perspectives"], "min_plans": 5}}
   WAIT FOR RESPONSE.

2. GENERATE 5 PLANS: ⚠️ CALL submit_reasoning_plan (5 times with session_id "deep_001")
   - Plan A: [Axis 1 + Axis 2 + Axis 3] + 20-32 capabilities
   - Plan B: [Axis 1 + Axis 2 + Axis 3] + 20-32 capabilities (must differ on ≥2 axes)
   - Plan C: [Axis 1 + Axis 2 + Axis 3] + 20-32 capabilities (must differ on ≥2 axes)
   - Plan D: [Axis 1 + Axis 2 + Axis 3] + 20-32 capabilities (must differ on ≥2 axes)
   - Plan E: [Axis 1 + Axis 2 + Axis 3] + 20-32 capabilities (must differ on ≥2 axes)
   WAIT FOR ACCEPTANCE after each submission.

3. EXECUTE: ⚠️ CALL execute_plan_step (100-160 times with session_id "deep_001")
   - Cover all decision tree branches
   - Document evidence IDs for every finding
   - Use 20-32 capabilities per plan for complex decisions
   WAIT FOR RESPONSE after each call. Record evidence IDs.

4. CONTAMINATE: ⚠️ CALL submit_cross_plan_note (10-15 times with session_id "deep_001")
   - Share quantitative findings across all plans
   - Share risk insights across all plans
   - Share stakeholder concerns across all plans
   WAIT FOR RESPONSE after each call.

5. PEER REVIEW: ⚠️ CALL submit_peer_critique (20 times with session_id "deep_001")
   - Each plan reviews every other plan
   - 20 total reviews (5 plans × 4 reviews each)
   - Focus on: claim validation, falsification tests, residual risks
   WAIT FOR RESPONSE after each call.

6. MEDIATE: ⚠️ CALL submit_mediation_decision (10-15 times with session_id "deep_001")
   - 10-15 major decision points
   - Each decision cites evidence from 3+ plans
   - Explain conflicts and how resolved
   WAIT FOR RESPONSE after each call.

7. FINALIZE: ⚠️ CALL finalize_parallel_reasoning
   {"name": "finalize_parallel_reasoning", "arguments": {"session_id": "deep_001"}}
   WAIT FOR RESPONSE. Use the server's complete audit trail.

Execute end-to-end using exact tool calls. This is for high-stakes decisions where thoroughness is critical.
```

---

### 🎯 Adaptation Guide

**How to adapt templates to your domain:**

1. **Identify decision tree depth**:
   - Simple (3-5 major decisions) → Use Template 2 (Rapid Coverage)
   - Medium (6-10 major decisions) → Use Template 1 (Maximum Coverage)
   - Complex (10+ major decisions) → Use Template 3 (Deep Coverage)

2. **Choose diversity axes** based on domain:
   - **Financial analysis**: analytical_models, risk_perspectives, time_horizons
   - **Market analysis**: data_sources, stakeholder_views, quality_metrics
   - **Strategic planning**: time_horizons, risk_perspectives, stakeholder_views
   - **Operational analysis**: data_sources, analytical_models, quality_metrics

3. **Scale capability usage**:
   - Simple tasks: 8-12 capabilities per plan
   - Medium tasks: 12-20 capabilities per plan
   - Complex tasks: 20-32 capabilities per plan

4. **Adjust plan count**:
   - Quick analysis: 3 plans
   - Standard analysis: 3-4 plans
   - High-stakes decision: 5+ plans

---

### 📋 Example Applications

#### Financial Analysis
```
I need to analyze: 5-year revenue forecast for SaaS startup

[Use Template 1 with:]
- Diversity axes: analytical_models, risk_perspectives, time_horizons
- 3 plans: Regression (Plan A), Monte Carlo (Plan B), Scenario analysis (Plan C)
- 12-16 capabilities per plan
```

#### Market Entry
```
I need to analyze: Market entry strategy for new geography

[Use Template 1 with:]
- Diversity axes: data_sources, stakeholder_views, quality_metrics
- 4 plans: Quantitative (A), Qualitative (B), Risk-adjusted (C), Competitive (D)
- 16-20 capabilities per plan
```

#### M&A Due Diligence
```
I need to analyze: Acquisition target evaluation

[Use Template 3 with:]
- Diversity axes: analytical_models, risk_perspectives, time_horizons
- 5 plans: Financial (A), Strategic (B), Operational (C), Legal (D), Cultural (E)
- 20-24 capabilities per plan
```

#### Supply Chain Optimization
```
I need to analyze: Supply chain resilience improvement

[Use Template 1 with:]
- Diversity axes: data_sources, risk_perspectives, quality_metrics
- 3 plans: Material risk (A), Supplier risk (B), Strategic options (C)
- 12-16 capabilities per plan
```

---

## 🎯 Architecture: LLM-Centric Parallel Reasoning

### Core Principle

**You (ChatGPT) are the sole deliberative agent.** The MCP server provides only:
- **Guardrails**: Validates diversity (≥2 axes difference), completeness (evidence citations)
- **Persistent Memory**: Stores plans, results, notes, critiques across requests
- **Typed Contracts**: Defines what you must provide (no computation, no evaluation)

**You orchestrate everything:**
- Generate diverse reasoning plans internally
- Execute capabilities through each plan's lens
- Cross-contaminate insights between plans
- Peer review from multiple perspectives
- Mediate final decisions with evidence

This architecture is based on:
- **Self-Consistency** (Wang et al., 2022): Sample multiple reasoning paths, marginalize over consistent ones
- **Tree-of-Thoughts** (Yao et al., 2023): Branch reasoning with intermediate evaluations
- **Multi-Agent Debate** (Du et al., 2023): Multiple perspectives challenge assumptions, improve factuality

### 8 MCP Tools (Guardrails + Memory Only)

1. **init_parallel_reasoning** - Initialize session, declare diversity requirements
2. **submit_reasoning_plan** - Submit plan with diversity axes (server validates ≥2 axes difference)
3. **execute_plan_step** - Execute capabilities for a plan (server records result)
4. **submit_cross_plan_note** - Share insight from Plan A to Plan B (server stores for audit)
5. **submit_peer_critique** - Plan A critiques Plan B (server stores, no scoring)
6. **submit_mediation_decision** - Choose approach for decision point (server validates evidence IDs cited)
7. **list_plan_status** - List pending work (passive, helps you see what's incomplete)
8. **finalize_parallel_reasoning** - Close session (server validates completeness)

### 58 Capabilities (Execution Engine)

Capabilities are invoked through `execute_plan_step`. Scale from 8-32 capabilities per plan based on task complexity.

**Corporate Strategy** (5): Portfolio strategy, M&A screening, scenario planning, sustainability, geopolitical risk

**Marketing & Sales** (7): Customer segmentation, pricing, brand equity, GTM strategy, digital ROI, journey mapping, churn prediction

**Finance & Valuation** (7): DCF modeling, Monte Carlo, capital structure, cost reduction, working capital, IPO readiness, forecasting

**Operations & Supply Chain** (6): Lean operations, footprint optimization, inventory management, procurement, quality, aftermarket

**IT & Process** (7): Process mining, RPA, IT architecture, cloud TCO, cybersecurity, data governance, AI use cases

**Legal & Regulatory** (5): Regulatory scanning, compliance, contract risk, IP landscape, antitrust

**People & HR** (6): Org health, talent economics, skill gaps, change management, workforce planning, compensation

**Advanced Analytics** (6): Monte Carlo, text mining, innovation radar, scenario engine, pricing AI, digital twins

### 6 Diversity Axes (Real Diversification)

Plans must differ on ≥2 axes to prevent semantic drift:

1. **data_sources**: Official statistics vs industry reports vs expert interviews
2. **analytical_models**: Regression vs Monte Carlo vs qualitative analysis
3. **time_horizons**: 1-year vs 3-year vs 10-year outlook
4. **quality_metrics**: Precision vs recall vs robustness vs speed
5. **risk_perspectives**: Optimistic vs base case vs stress scenarios
6. **stakeholder_views**: Customer vs investor vs regulator vs employee

### 20+ Industry Adapters

Specialized templates for: Automotive, Pharmaceutical, Energy, Financial Services, Manufacturing, Retail, Healthcare, Telecom, Aerospace, Consumer Goods, and more.

---

## 💡 How It Works

### 1. Real Diversification (Not Cosmetic Variants)

**Bad** (semantic drift):
- Plan A: "Analyze market with focus on growth"
- Plan B: "Analyze market with focus on expansion"
- Plan C: "Analyze market with focus on scaling"

**Good** (real diversity):
- Plan A: Official statistics + Regression + 3-year horizon
- Plan B: Industry reports + Monte Carlo + Risk scenarios
- Plan C: Expert interviews + Qualitative + Stakeholder views

Server validates ≥2 axes difference, but you choose the substance.

### 2. Structured Contamination

As you execute plans, share insights:
- Plan A finds: "Market size €2.5B with 15% CAGR"
- → Share with Plan B: "Use this as base case for Monte Carlo"
- Plan C finds: "40% churn due to poor integration support"
- → Share with Plan A: "Adjust CAC/LTV assumptions"

Server stores notes for audit trail, but you decide what to share.

### 3. Peer Review (Challenge Assumptions)

Each plan reviews others:
- Plan A reviews Plan B: "Monte Carlo assumes normal distribution, but revenue has fat tails. Suggest log-normal."
- Plan B reviews Plan C: "Stakeholder interviews lack quantitative validation. Cross-check with Plan A's regression."

Server stores critiques, but you generate them.

### 4. Evidence-Based Mediation

For each decision point, cite evidence from multiple plans:
- Decision: "Target market selection"
- Chosen from: Plan A (data-driven TAM/SAM/SOM)
- But incorporate: Plan B's risk-adjusted NPV + Plan C's customer pain points
- Evidence IDs: [evidence_001, evidence_042, evidence_089]

Server validates evidence IDs exist, but you choose the synthesis.

### 5. Quality Guarantees

✅ **Diversity Enforcement** - Server rejects plans that differ on <2 axes
✅ **Completeness Validation** - Server requires evidence citations for decisions
✅ **Persistent Memory** - Durable Objects store state across requests
✅ **Audit Trail** - Complete history of plans, notes, critiques, decisions
✅ **No Server Intelligence** - Server never computes, evaluates, or plans

---

## 📚 Documentation

- **[AGENT.md](./AGENT.md)** - Complete technical documentation for developers
- **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and migration guides
- **[docs/EXAMPLES.md](./docs/EXAMPLES.md)** - Advanced use cases and patterns
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and internals

---

## 🔧 For Developers

### Local Development

```bash
git clone https://github.com/VFG92/mcp-ptu-server
cd mcp-ptu-server
npm install
npm test          # Run test suite (162 tests)
npm run build     # TypeScript compilation
wrangler dev      # Local development server
wrangler deploy   # Deploy to Cloudflare Workers
```

### Architecture

```
MCP Client (ChatGPT)
     ↓
Cloudflare Worker (index.ts)
  - Routes requests by session_id
     ↓
Durable Object (session.ts)
  - Manages session state
  - Persists parallel reasoning sessions
     ↓
MCP Server (everything-workers.ts)
  - 58 capabilities + 8 parallel reasoning tools
  - Evidence tracking, budget management
  - Tournament mode, peer review
     ↓
Capability System
  - Graph, Orchestrator, Planner
  - Whiteboard memory, Evidence ledger
  - Industry adapters, Native integration
```

### Key Technologies

- **Platform**: Cloudflare Workers + Durable Objects
- **Language**: TypeScript (strict mode)
- **Protocol**: Model Context Protocol (MCP) 2024-11-05
- **Testing**: Jest (162 tests, 100% passing)
- **Deployment**: Wrangler 4.40.2

---

## 📊 Recent Updates

### v5.2.2 (2025-01-15) - Custom Session ID Support

✅ **New**: Support for user-friendly session IDs (e.g., `"sess-it-2025-10-01-a"`)
✅ **Fix**: "Session not found" error when using custom session IDs
✅ **Implementation**: Deterministic SHA-256 hashing for consistent routing
✅ **Backward Compatible**: Native 64-char hex IDs still work
✅ **Testing**: All 162 tests passing

**Why this matters**: Users can now use meaningful session IDs instead of cryptic hex strings!

See [SESSION_ID_FIX.md](./SESSION_ID_FIX.md) for technical details.

### v5.2.1 (2025-01-15) - Session Keep-Alive & Heartbeat

✅ **New**: `/heartbeat` endpoint prevents session eviction during long operations
✅ **Fix**: Cloudflare Durable Objects timeout issue (30s inactivity limit)
✅ **Resilience**: Aggressive state persistence + automatic recovery
✅ **Documentation**: Complete guide with Python/JS/Bash examples
✅ **Testing**: All 162 tests passing + manual test suite

**Why this matters**: ChatGPT can now perform long-running parallel reasoning workflows without losing session state!

See [HEARTBEAT.md](./HEARTBEAT.md) for implementation details.

### v5.1.0 (2025-10-01) - Multi-Path Only Architecture

✅ **Breaking**: Single-path tools no longer exposed (multi-path only)
✅ **Universal templates**: 3 templates for any domain (rapid, maximum, deep coverage)
✅ **Decision tree coverage**: Scale 8-32 capabilities based on complexity
✅ **Workflow orchestration**: 7-phase pattern with external constraints
✅ **LLM-centric design**: ChatGPT orchestrates, MCP provides guardrails + memory

### v5.0.3 (2025-10-01) - Session Persistence Fix

✅ Fixed "session not found" error in parallel reasoning workflows
✅ Proper serialization of nested Maps in Durable Object storage
✅ All 162 tests passing

[Full changelog →](./docs/CHANGELOG.md)

---

## 🤝 Contributing

Contributions welcome! See [AGENT.md](./AGENT.md) for development guidelines.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **Production URL**: https://mcp-server.vf-ghizzoni.workers.dev
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Cloudflare Workers**: https://workers.cloudflare.com/

---

## 📋 Changelog

### v5.2.2 - Custom Session ID Support (2025-10-01)

**Fixed**: Custom session IDs now work correctly with parallel reasoning tools.

- **Problem**: Session IDs like `"session_001"` or `"sess-it-2025-10-01-a"` were rejected, causing "Session not found" errors
- **Solution**: Implemented deterministic SHA-256 hashing to map custom session IDs to valid Durable Object IDs
- **Impact**: ChatGPT and other LLM clients can now use human-readable session IDs for better tracking and debugging

**Technical Details**:
- Added `hashSessionId()` function that uses SHA-256 for deterministic mapping
- Custom session IDs are hashed to 64-char hex strings compatible with `idFromString()`
- Same session ID always routes to the same Durable Object (deterministic)
- Updated all endpoints (POST /mcp, GET /mcp, DELETE /mcp, POST /heartbeat) to support custom IDs
- Backward compatible: Native 64-char hex IDs continue to work as before
- No configuration changes needed

See [SESSION_ID_FIX.md](./SESSION_ID_FIX.md) for complete technical documentation.

### v5.2.0 - Heartbeat Keep-Alive (2025-10-01)

**Added**: Real keep-alive mechanism to prevent Durable Object eviction during long reasoning periods.

- **Problem**: Cloudflare evicts Durable Objects after 30 seconds without HTTP requests
- **Solution**: New `POST /heartbeat` endpoint + aggressive state persistence
- **Impact**: Sessions survive long reasoning periods (30+ seconds between tool calls)

See [HEARTBEAT.md](./HEARTBEAT.md) for implementation details.

---

**Built with ❤️ for enterprise business analysis**

