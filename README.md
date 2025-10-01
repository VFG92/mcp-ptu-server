# 🧠 MCP PTU Server

**Version 5.1.0** | LLM-Centric Parallel Reasoning for Enterprise Analysis

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed-Cloudflare%20Workers-orange)](https://mcp-server.vf-ghizzoni.workers.dev)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-5.1.0-green)](https://github.com/VFG92/mcp-ptu-server)
[![Tests](https://img.shields.io/badge/Tests-162%2F162-brightgreen)]()

An MCP server that enables **ChatGPT** to orchestrate multi-path business analysis. **You (ChatGPT) are the sole deliberative agent** — the server provides only guardrails (diversity validation) and persistent memory. You generate diverse reasoning plans, cross-contaminate insights, peer review, and mediate final decisions.

---

## 🚀 Quick Start

### Connect to ChatGPT

1. Open ChatGPT Settings → Beta Features → Enable "Developer Mode"
2. Add MCP Server: `https://mcp-server.vf-ghizzoni.workers.dev`
3. Start using the prompt templates below!

### 📝 Universal Prompt Template

**Core Principle**: You (ChatGPT) orchestrate the entire workflow. MCP provides only guardrails (diversity validation) and persistent memory.

#### Template 1: Maximum Coverage (Complex Analysis)

```
I need to analyze: [YOUR TASK]

Orchestrate a complete parallel reasoning workflow:

PHASE 1 - INITIALIZATION
- Initialize session with init_parallel_reasoning
- Declare diversity requirements: [2-3 axes from: data_sources, analytical_models, time_horizons, quality_metrics, risk_perspectives, stakeholder_views]
- Set min_plans: [3-5 based on task complexity]

PHASE 2 - PLAN GENERATION (Real Diversity, Not Cosmetic Variants)
For each plan, ensure:
- Differs on ≥2 axes from other plans
- Uses 8-32 capabilities (scale based on decision tree depth)
- Covers different branches of the decision tree
- Has clear rationale for approach

Example diversity patterns:
- Plan A: Quantitative (official data + regression + short-term)
- Plan B: Risk-adjusted (industry data + Monte Carlo + stress scenarios)
- Plan C: Qualitative (expert input + stakeholder analysis + long-term)

PHASE 3 - EXECUTION (Full Decision Tree Coverage)
For each plan:
- Execute capabilities systematically (use execute_plan_step)
- Cover all decision branches relevant to that plan's perspective
- Record evidence IDs for all findings
- Scale capability usage: simple tasks (8-12), complex tasks (16-32)

PHASE 4 - CONTAMINATION (Cross-Plan Learning)
As you execute:
- Share quantitative findings from Plan A with Plan B/C
- Share risk insights from Plan B with Plan A/C
- Share stakeholder concerns from Plan C with Plan A/B
- Use submit_cross_plan_note for each insight transfer

PHASE 5 - PEER REVIEW (Challenge Assumptions)
Each plan reviews others:
- Identify claims that need validation
- Propose falsification tests
- Highlight residual risks
- Suggest improvements
- Use submit_peer_critique for each review

PHASE 6 - MEDIATION (Evidence-Based Synthesis)
For each major decision point:
- Identify which plan's approach to use
- Cite evidence IDs from multiple plans
- Explain why this synthesis is optimal
- Use submit_mediation_decision for each decision

PHASE 7 - FINALIZATION
- Use finalize_parallel_reasoning
- Ensure all decision branches covered
- Validate evidence trail complete

Execute this workflow end-to-end. The MCP server will validate diversity and store state, but you orchestrate everything.
```

#### Template 2: Rapid Coverage (Time-Constrained)

```
I need to analyze: [YOUR TASK]

Orchestrate a streamlined parallel reasoning workflow:

1. INIT: Use init_parallel_reasoning with 3 plans, 2 diversity axes

2. GENERATE 3 PLANS (Real Diversity):
   - Plan A: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities
   - Plan B: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities
   - Plan C: [Axis 1 variant] + [Axis 2 variant] + 8-12 capabilities

3. EXECUTE: Run capabilities for each plan, cover main decision branches

4. CONTAMINATE: Share 2-3 key insights between plans

5. PEER REVIEW: Each plan reviews one other (3 total reviews)

6. MEDIATE: Make 3-5 key decisions citing evidence from multiple plans

7. FINALIZE: Close session with complete decision map

Execute end-to-end. MCP validates and stores, you orchestrate.
```

#### Template 3: Deep Coverage (High-Stakes Decision)

```
I need to analyze: [YOUR TASK]

Orchestrate an exhaustive parallel reasoning workflow:

1. INIT: Use init_parallel_reasoning with 5 plans, 3 diversity axes

2. GENERATE 5 PLANS (Maximum Diversity):
   - Plan A: [Axis 1 + Axis 2 + Axis 3] + 16-24 capabilities
   - Plan B: [Axis 1 + Axis 2 + Axis 3] + 16-24 capabilities
   - Plan C: [Axis 1 + Axis 2 + Axis 3] + 16-24 capabilities
   - Plan D: [Axis 1 + Axis 2 + Axis 3] + 16-24 capabilities
   - Plan E: [Axis 1 + Axis 2 + Axis 3] + 16-24 capabilities

3. EXECUTE: Systematic capability execution
   - Cover all decision tree branches
   - Document evidence IDs for every finding
   - Use 20-32 capabilities per plan for complex decisions

4. CONTAMINATE: Structured cross-plan learning
   - Share quantitative findings across all plans
   - Share risk insights across all plans
   - Share stakeholder concerns across all plans
   - 10-15 cross-plan notes total

5. PEER REVIEW: Complete review matrix
   - Each plan reviews every other plan
   - 20 total reviews (5 plans × 4 reviews each)
   - Focus on: claim validation, falsification tests, residual risks

6. MEDIATE: Comprehensive decision synthesis
   - 10-15 major decision points
   - Each decision cites evidence from 3+ plans
   - Explain conflicts and how resolved

7. FINALIZE: Complete audit trail with full decision coverage

Execute end-to-end. MCP validates and stores, you orchestrate.
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

**Built with ❤️ for enterprise business analysis**

