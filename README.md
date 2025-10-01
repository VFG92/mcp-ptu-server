# 🧠 MCP PTU Server

**Version 5.0.3** | Enterprise Business Analysis with Parallel Reasoning

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed-Cloudflare%20Workers-orange)](https://mcp-server.vf-ghizzoni.workers.dev)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-5.0.3-green)](https://github.com/VFG92/mcp-ptu-server)
[![Tests](https://img.shields.io/badge/Tests-162%2F162-brightgreen)]()

An MCP server that enables **ChatGPT** to perform evidence-backed business analysis with **58 capabilities** across 8 domains, plus **parallel reasoning** for multi-path analysis.

---

## 🚀 Quick Start

### Connect to ChatGPT

1. Open ChatGPT Settings → Beta Features → Enable "Developer Mode"
2. Add MCP Server: `https://mcp-server.vf-ghizzoni.workers.dev`
3. Start using the prompt templates below!

### 📝 Ready-to-Use Prompt Templates

#### 1. Market Analysis (Automotive Industry)

```
Analyze the European BEV market opportunity for an automotive OEM.

Use analyze_with_capabilities with:
- Industry: automotive
- Region: europe  
- Include: regulatory compliance (UN R155/R156), competitive landscape, supply chain risks
- Competitors: Tesla, VW Group, BYD

Provide evidence-backed recommendations with confidence scores.
```

#### 2. Financial Modeling with Monte Carlo

```
Perform a Monte Carlo revenue forecast simulation.

Use analyze_with_capabilities with:
- Enable Python execution (enable_native_capabilities: true)
- Base case: $500M revenue, 20% standard deviation
- Run 10,000 iterations
- Provide P10, P50, P90 scenarios with confidence intervals
```

#### 3. M&A Market Intelligence

```
Scan recent M&A activity in pharmaceutical sector, focusing on cell & gene therapy.

Use analyze_with_capabilities with:
- Enable web search (enable_native_capabilities: true)
- Industry: pharmaceutical
- Region: global
- Time frame: last 12 months
- Include deal values, strategic rationale, and market implications
```

#### 4. Multi-Path Strategic Analysis (Parallel Reasoning)

```
Analyze market entry strategy for fintech startup using parallel reasoning.

Step 1 - Initialize:
Use init_parallel_reasoning with:
- Task: "Market entry strategy for B2B payment platform in EU"
- Required diversity axes: data_sources, analytical_models
- Min plans: 3

Step 2 - Submit 3 diverse plans:
Plan A: Official statistics + Regression analysis + 3-year horizon
Plan B: Industry reports + Monte Carlo + Risk-adjusted scenarios  
Plan C: Expert interviews + Qualitative analysis + Stakeholder perspectives

Step 3 - Execute each plan with execute_plan_step

Step 4 - Cross-contaminate insights with submit_cross_plan_note

Step 5 - Peer review with submit_peer_critique

Step 6 - Mediate final decision with submit_mediation_decision

Step 7 - Finalize with finalize_parallel_reasoning
```

#### 5. Industry-Specific Deep Dive

```
Perform comprehensive pharmaceutical industry analysis for drug launch.

Use analyze_with_capabilities with:
- Adapter: comprehensive
- Industry: pharmaceutical
- Context: Phase III oncology drug, EU/US markets
- Include: clinical trial design, regulatory pathway (FDA/EMA), pricing strategy, market access, competitive landscape
```

---

## 🎯 What Can It Do?

### 58 Advanced Capabilities

**Corporate Strategy** (5): Portfolio strategy, M&A screening, scenario planning, sustainability, geopolitical risk

**Marketing & Sales** (7): Customer segmentation, pricing, brand equity, GTM strategy, digital ROI, journey mapping, churn prediction

**Finance & Valuation** (7): DCF modeling, Monte Carlo, capital structure, cost reduction, working capital, IPO readiness, forecasting

**Operations & Supply Chain** (6): Lean operations, footprint optimization, inventory management, procurement, quality, aftermarket

**IT & Process** (7): Process mining, RPA, IT architecture, cloud TCO, cybersecurity, data governance, AI use cases

**Legal & Regulatory** (5): Regulatory scanning, compliance, contract risk, IP landscape, antitrust

**People & HR** (6): Org health, talent economics, skill gaps, change management, workforce planning, compensation

**Advanced Analytics** (6): Monte Carlo, text mining, innovation radar, scenario engine, pricing AI, digital twins

### 8 Parallel Reasoning Tools (v5.0)

Multi-path analysis with diversity enforcement and cross-contamination:

1. **init_parallel_reasoning** - Start session with diversity requirements
2. **submit_reasoning_plan** - Submit diverse analysis plans (validated for ≥2 axes difference)
3. **execute_plan_step** - Execute capabilities for each plan
4. **submit_cross_plan_note** - Share insights between plans (contamination)
5. **submit_peer_critique** - Peer review between plans
6. **submit_mediation_decision** - Make evidence-backed final decisions
7. **list_plan_status** - Check progress across all plans
8. **finalize_parallel_reasoning** - Complete workflow with audit trail

### 20+ Industry Adapters

Specialized templates for: Automotive, Pharmaceutical, Energy, Financial Services, Manufacturing, Retail, Healthcare, Telecom, Aerospace, Consumer Goods, and more.

---

## 💡 Key Features

✅ **Evidence-Backed** - 6 evidence types (CALCULATION, RETRIEVAL, PRECEDENT, ASSUMPTION, SIMULATION, HEURISTIC)  
✅ **Confidence Scoring** - 5-component quality formula (0.65-0.90 precision)  
✅ **Budget Aware** - Token, CPU, memory tracking with cost optimization  
✅ **Tournament Mode** - Multi-criteria judging for best results (default enabled)  
✅ **Native Integration** - Python execution, web search, data analysis (11 capabilities)  
✅ **Persistent Sessions** - Durable Objects for multi-step workflows  
✅ **Industry Context** - 20+ specialized adapters with domain knowledge  
✅ **Audit Trail** - Complete execution history with artifact versioning  

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

### v5.0.3 (2025-10-01) - Session Persistence Fix

✅ Fixed "session not found" error in parallel reasoning workflows  
✅ Proper serialization of nested Maps in Durable Object storage  
✅ All 162 tests passing

### v5.0.0 (2025-10-01) - Parallel Reasoning Release

✅ 8 new MCP tools for multi-path analysis  
✅ Diversity validation (≥2 axes difference enforced)  
✅ Cross-plan contamination and peer review  
✅ Evidence-based mediation with audit trail

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

