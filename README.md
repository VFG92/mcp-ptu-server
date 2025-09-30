# 🧠 Multi-Agent Parallel Reasoning MCP Server

**Version 2.1.0** | **Replicate Grok 4 Heavy / GPT-5 Pro style parallel compute for $0**

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that enables multi-agent parallel reasoning for complex business analysis. Built for **management consulting, finance, marketing strategy, and project management**.

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed-Cloudflare%20Workers-orange)](https://mcp-server.vf-ghizzoni.workers.dev)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-2.1.0-green)](https://github.com/yourusername/mcp-ptu-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 What is This?

This MCP server enables **ChatGPT Developer Mode** (and other MCP clients) to perform **multi-agent parallel reasoning** - where multiple expert AI personas analyze complex problems simultaneously from different perspectives, then synthesize their insights into unified recommendations.

Think of it as having a virtual consulting team of 15+ experts (Strategy Consultants, Financial Analysts, Marketing Strategists, Risk Managers, etc.) working together in real-time to solve your business problems.

---

## ✨ Features

- 🤖 **15+ Expert Agent Personas** - Strategy, Finance, Marketing, Operations, Risk, Synthesis
- 🏷️ **60+ Persona Aliases** - Automatic resolution (e.g., `product_manager` → `project_manager`) ✨ NEW
- ⚡ **Parallel Compute** - Multiple agents reason simultaneously
- 🔄 **Cross-Agent Communication** - Agents collaborate and debate
- 📊 **5 Synthesis Strategies** - Consensus, weighted, dialectic, best-of-n, ensemble
- ⚠️ **Partial Synthesis Support** - HTTP 206 with warnings and confidence intervals ✨ NEW
- 🛡️ **Structured Error Handling** - Semantic HTTP codes with actionable suggestions ✨ NEW
- 🔍 **Fuzzy Matching** - Typo detection with Levenshtein distance ✨ NEW
- 💾 **Stateful Sessions** - Durable Objects maintain state across requests
- 📈 **Real-Time Progress** - Monitor agent status and progress
- 🌐 **Production Ready** - Deployed on Cloudflare Workers edge network
- 💰 **$0 Cost** - Runs on Cloudflare Workers free tier

---

## 🆕 What's New in v2.1.0

### Phase 1: Error Handling Robustness
- ✅ **Structured Errors**: Machine-readable errors with `error_type`, `retriable`, and `suggestions`
- ✅ **Semantic HTTP Codes**: 404 (Not Found), 409 (Conflict), 412 (Precondition Failed), 206 (Partial Content)
- ✅ **Actionable Messages**: Every error includes suggestions for resolution

### Phase 2: Partial Synthesis Enhancement
- ✅ **HTTP 206 Partial Content**: Clear distinction between full and partial synthesis
- ✅ **Confidence Intervals**: Lower/upper bounds for partial results
- ✅ **Detailed Warnings**: Know exactly which agents are incomplete and why
- ✅ **Coverage Metrics**: See percentage of agents completed (e.g., "67% coverage")

### Phase 3: Persona Management
- ✅ **60+ Aliases**: Use `product_manager`, `pm`, `finance`, `marketing` - they auto-resolve!
- ✅ **Fuzzy Matching**: Typos like `stratgy_consultant` get suggestions
- ✅ **Pre-Validation**: New `validate_session_spec` tool checks personas before init
- ✅ **Better DX**: Less friction, faster iteration

**Migration**: Fully backward compatible - no breaking changes!

---

## 🚀 Quick Start

### 1. Production Server (Ready to Use)

The server is already deployed and ready to use:

```
https://mcp-server.vf-ghizzoni.workers.dev
```

### 2. Connect from ChatGPT Developer Mode

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "url": "https://mcp-server.vf-ghizzoni.workers.dev/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### 3. Start Using

Ask ChatGPT:

```
Use the parallel reasoning system to analyze a market entry strategy 
for a fintech startup in Europe. Use these agents:
- strategy_consultant
- financial_analyst
- marketing_strategist
- risk_manager

Synthesize with consensus strategy.
```

---

---

## 🤖 Available Agent Personas

### Strategy & Consulting
- **strategy_consultant** - Business strategy, competitive positioning
- **management_consultant** - Organizational effectiveness, process optimization
- **change_manager** - Change management, stakeholder engagement

### Finance
- **financial_analyst** - Financial modeling, valuation, investment analysis
- **cfo_advisor** - Financial strategy, capital allocation, FP&A
- **ma_advisor** - M&A, due diligence, deal structuring
- **risk_manager** - Risk assessment, mitigation, compliance

### Marketing
- **marketing_strategist** - Marketing strategy, brand positioning
- **digital_marketing** - Digital channels, SEO/SEM, analytics
- **market_researcher** - Market analysis, competitive intelligence

### Operations
- **project_manager** - Project planning, execution, delivery
- **operations_manager** - Operational efficiency, supply chain
- **data_analyst** - Data analysis, business intelligence

### Synthesis
- **synthesizer** - Combining multiple perspectives
- **judge** - Evaluating options and making decisions

---

## 🛠️ MCP Tools

The server provides 8 MCP tools:

1. **`parallel_reasoning_init`** - Initialize multi-agent session
2. **`agent_reasoning_step`** - Submit agent analysis
3. **`cross_agent_communication`** - Enable agent collaboration
4. **`synthesize_parallel_reasoning`** - Combine all perspectives
5. **`parallel_compute_status`** - Monitor progress
6. **`agent_debate`** - Facilitate agent debates
7. **`list_agent_personas`** - See available experts
8. **`validate_session_spec`** - Validate personas before initialization (NEW ✨)

---

## 💡 Example Use Cases

### Market Entry Strategy
```
Agents: strategy_consultant, financial_analyst, marketing_strategist, risk_manager
Output: Comprehensive market entry plan with strategic, financial, marketing, and risk perspectives
```

### M&A Deal Evaluation
```
Agents: ma_advisor, financial_analyst, cfo_advisor, operations_manager, risk_manager
Output: Deal recommendation with valuation, synergies, integration plan, and risk assessment
```

### Digital Transformation
```
Agents: management_consultant, project_manager, change_manager, data_analyst
Output: Transformation roadmap with change management, project plan, and data strategy
```

---

## 🏗️ Architecture

```
ChatGPT (Developer Mode)
    ↓
MCP Protocol (Streamable HTTP + SSE)
    ↓
Cloudflare Workers (Edge Network)
    ↓
Durable Objects (State Management)
    ↓
Parallel Reasoning Engine
    ├── Agent Personas
    ├── Session Management
    ├── Cross-Agent Communication
    └── Synthesis Strategies
```

---

## 🔧 Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Setup

```bash
# Clone repository
git clone https://github.com/VFG92/mcp-ptu-server.git
cd mcp-ptu-server

# Install dependencies
npm install

# Run locally
npm run workers:dev
# Server runs on http://localhost:8787
```

### Deploy

```bash
# Set Cloudflare credentials
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Deploy to production
npm run workers:deploy
```

---

## 📁 Project Structure

```
mcp-ptu-server/
├── src/workers/              # Main implementation
│   ├── agent-personas.ts     # 15 expert personas
│   ├── synthesis-strategies.ts  # 5 synthesis algorithms
│   ├── parallel-reasoning-engine.ts  # Core engine
│   ├── parallel-reasoning-tools.ts   # MCP tool handlers
│   ├── session.ts            # Durable Objects state
│   ├── everything-workers.ts # MCP server integration
│   ├── express-adapter.ts    # Express→Workers adapter
│   └── index.ts              # Hono routing
├── README.md                 # This file
├── AGENT.md                  # AI agent instructions
├── wrangler.toml             # Cloudflare config
└── package.json              # Dependencies
```

---

## 🎯 Why This Project?

Traditional AI assistants provide single-perspective analysis. This system enables:

✅ **Multiple Expert Perspectives** - 3-5 expert viewpoints on every problem
✅ **Higher Quality Decisions** - Comprehensive analysis from all angles
✅ **Risk Identification** - Multiple agents catch blind spots
✅ **Actionable Recommendations** - Synthesized insights with high confidence
✅ **Zero Cost** - Runs entirely on free tier infrastructure

---

## 🤝 Contributing

This is a personal project for management consulting, finance, and marketing strategy analysis. Feel free to fork and adapt for your own use cases!

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [Cloudflare Workers](https://workers.cloudflare.com/) for edge computing
- [Durable Objects](https://developers.cloudflare.com/durable-objects/) for state management
- [Hono](https://hono.dev/) for routing

---

## 📞 Support

For issues or questions:
1. Check [AGENT.md](AGENT.md) for development guidelines
2. Review the MCP Tools section above for API reference
3. Open an issue on GitHub

---

## 🔄 Recent Updates

### v2.0.2 (2025-09-30)

**Improved Error Handling & Diagnostics**

- ✅ `parallel_compute_status` now **never returns 400** - always provides diagnostic info
- ✅ Enhanced synthesis error messages with detailed progress and suggestions
- ✅ Changed `require_all_completed` default to `true` (prevents premature synthesis)
- ✅ Improved tool descriptions to guide proper workflow
- ✅ Better troubleshooting information for session issues

**Key Improvements:**
- Status checks work even when sessions are not found (returns diagnostic info)
- Synthesis errors now show exactly which agents are incomplete and what to do
- Default behavior prevents partial synthesis unless explicitly requested
- All error messages include actionable next steps

---

**🎉 Ready to enable multi-agent parallel reasoning in ChatGPT? Connect to the production server and start analyzing!**

