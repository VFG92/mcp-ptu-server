# Changelog

All notable changes to MCP PTU Server are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.1.0] - 2025-10-01

### Changed - Multi-Path Only Architecture

**Breaking Change**: Single-path tools (`analyze_with_capabilities`, `list_capabilities`, `get_capability_status`, `export_session`) are no longer exposed to clients.

**New Architecture**:
- **Exposed to clients**: 8 parallel reasoning tools only (multi-path workflow)
- **Internal use**: 58 capabilities invoked via `execute_plan_step`
- **Design principle**: ChatGPT orchestrates end-to-end, MCP provides guardrails + memory

### Added - Universal Prompt Templates

**Template 1: Maximum Coverage** (complex analysis, 6-10 major decisions)
- 3-4 plans with 12-20 capabilities each
- Structured contamination and peer review
- Evidence-based mediation

**Template 2: Rapid Coverage** (time-constrained, 3-5 major decisions)
- 3 plans with 8-12 capabilities each
- Streamlined workflow
- Quick decision synthesis

**Template 3: Deep Coverage** (high-stakes, 10+ major decisions)
- 5 plans with 20-32 capabilities each
- Exhaustive decision tree coverage
- Complete review matrix

### Added - Decision Tree Coverage Guide

**Capability Scaling**:
- Simple tasks: 8-12 capabilities per plan
- Medium tasks: 12-20 capabilities per plan
- Complex tasks: 20-32 capabilities per plan

**Coverage Strategy**:
- Identify decision branches
- Assign capabilities to plans
- Ensure no gaps in coverage
- Validate critical decisions covered by multiple plans

### Added - Workflow Orchestration Documentation

**7-Phase Pattern**:
1. Initialization (declare diversity requirements)
2. Plan Generation (real diversity, not cosmetic variants)
3. Execution (parallel internally, cover decision tree)
4. Contamination (structured cross-plan learning)
5. Peer Review (challenge assumptions)
6. Mediation (evidence-based synthesis)
7. Finalization (complete audit trail)

**External Constraints** (enforced by server):
- Diversity: ≥2 axes difference
- Completeness: Evidence IDs cited
- Capability range: 8-32 per plan
- Session persistence: Durable Objects

### Documentation

**README.md**: Rewritten with universal templates, adaptation guide, example applications
**AGENT.md**: Added decision tree coverage, workflow orchestration, constraint enforcement
**docs/EXAMPLES.md**: Updated with LLM-centric patterns

### Migration Guide

**From v5.0.x to v5.1.0**:

**Breaking Change**: `analyze_with_capabilities` no longer exposed to clients.

**Before (v5.0.x)**:
```typescript
// Direct single-path analysis
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "analysis_001",
    "task": "Analyze market opportunity",
    "adapter_id": "strategy"
  }
}
```

**After (v5.1.0)**:
```typescript
// Multi-path workflow
// 1. Initialize
{
  "name": "init_parallel_reasoning",
  "arguments": {
    "session_id": "analysis_001",
    "task_description": "Analyze market opportunity",
    "required_diversity_axes": ["data_sources", "analytical_models"],
    "min_plans": 3
  }
}

// 2. Submit plans (3x)
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "analysis_001",
    "plan": {
      "plan_id": "plan_A",
      "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
      "capability_chain": ["market_sizing_tam_sam_som", ...],
      ...
    }
  }
}

// 3. Execute plans
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "analysis_001",
    "plan_id": "plan_A",
    "task": "Perform market sizing",
    "adapter_id": "strategy"
  }
}

// 4-7. Contaminate, review, mediate, finalize
```

**Why this change?**
- Research shows multi-path reasoning improves quality (Wang 2022, Yao 2023, Du 2023)
- Single-path analysis is a special case of multi-path (1 plan)
- Enforces best practices: diversity, contamination, peer review, mediation

**Backward Compatibility**:
- Internal functions still exist (`handleAnalyzeWithCapabilities`)
- Used by `execute_plan_step` to invoke capabilities
- No breaking changes to capability system

---

## [5.0.3] - 2025-10-01

### Fixed
- **Critical**: Fixed "session not found" error in parallel reasoning workflows
- **Serialization**: Proper handling of nested Maps (`plans`, `plan_results`) in Durable Object storage
- **Persistence**: Custom serialization/deserialization converts Maps ↔ Arrays for JSON compatibility

### Technical Details
- Problem: When sessions were persisted to Durable Object storage, nested Maps were converted to empty objects `{}` during JSON serialization
- Solution: `serializeSessions()` converts Maps to arrays before storage, `loadSessions()` converts arrays back to Maps after loading
- Impact: Session state now persists correctly across requests, enabling reliable multi-step parallel reasoning workflows

### Testing
- Added new test case for serialization/deserialization with nested Maps
- All 162 tests passing

---

## [5.0.2] - 2025-10-01

### Changed
- **Constraints**: Updated `min_plans` from 2-8 to **3-32** (default 3)
- **Validation**: Added `capability_chain` validation for **8-32 capabilities** per workflow

### Updated
- **Dependencies**: Wrangler updated to **4.40.2** (no breaking changes)

### Testing
- All 161 tests passing
- Build successful with 0 TypeScript errors

---

## [5.0.0] - 2025-10-01

### Added - Parallel Reasoning (LLM-Centric Architecture)

#### New MCP Tools (8)
1. `init_parallel_reasoning` - Initialize session with diversity requirements
2. `submit_reasoning_plan` - Submit diverse analysis plans (validated for ≥2 axes difference)
3. `execute_plan_step` - Execute capabilities for each plan
4. `submit_cross_plan_note` - Share insights between plans (contamination)
5. `submit_peer_critique` - Peer review between plans
6. `submit_mediation_decision` - Make evidence-backed final decisions
7. `list_plan_status` - Check progress across all plans
8. `finalize_parallel_reasoning` - Complete workflow with audit trail

#### Features
- **Diversity Validation**: Server enforces ≥2 axes difference between plans (prevents semantic drift)
- **Contamination**: Cross-plan notes enable interaction between reasoning paths
- **LLM-Centric Design**: ChatGPT is sole deliberative agent, MCP provides guardrails + memory
- **Evidence-Based Mediation**: Final decisions must cite evidence IDs from plans
- **6 Diversity Axes**: data_sources, analytical_models, time_horizons, quality_metrics, risk_perspectives, stakeholder_views
- **Session Persistence**: Resolved Durable Object routing issues for reliable multi-step workflows

#### Architecture Principle
MCP = Guardrails + Persistent Memory | ChatGPT = Planning + Reasoning + Mediation

#### Research Foundation
Based on:
- Self-Consistency (Wang et al., 2022)
- Tree-of-Thoughts (Yao et al., 2023)
- Multi-Agent Debate (Du et al., 2023)

---

## [4.2.0] - 2025-09-XX

### Added - Peer Review System

#### Features
- **PeerReviewKernel**: Each agent critiques every other result, producing agreement matrices and consensus insights
- **Consensus/Conflict Metrics**: Consensus, conflict, robustness, critical disagreements, and review quality
- **Tournament Integration**: Peer agreement boosts ELO scores while controversy introduces penalties
- **Orchestrator Controls**: `peer_review_mode` toggle (default `true`) for backward compatibility
- **Developer Visibility**: Results exposed via `result.peer_review` plus runnable example

---

## [4.1.0] - 2025-09-XX

### Added - Persistent Storage

#### Features
- **Durable Objects**: End-to-end persistence with Cloudflare Durable Objects
- **Session Management**: One Durable Object instance per session_id
- **State Persistence**: Automatic save/load of session state
- **Routing**: Worker routes requests by session_id to correct DO instance

---

## [4.0.0] - 2025-09-XX

### Added - 58 Advanced Capabilities

#### Capabilities by Domain
- **Corporate Strategy & Growth** (5): Portfolio strategy, M&A screening, scenario wargaming, sustainability, geopolitical risk
- **Marketing & Sales** (7): Customer segmentation, WTP analysis, brand equity, GTM, digital ROI, journey mapping, churn prediction
- **Finance & Valuation** (7): DCF modeling, TSR simulation, capital structure, cost reduction, working capital, IPO readiness, scenario forecasting
- **Operations & Supply Chain** (6): Lean ops, footprint optimization, inventory scenarios, procurement, quality analysis, aftermarket economics
- **Process Excellence & IT** (7): Process mining, RPA opportunities, IT architecture, cloud TCO, cybersecurity, data governance, AI use cases
- **Legal & Regulatory** (5): Regulatory scanning, compliance gaps, contract risk, IP landscape, antitrust impact
- **People & HR** (6): Org health, talent economics, skill gaps, change management, workforce scenarios, compensation benchmarking
- **Advanced Analytics** (6): Monte Carlo finance, text mining, innovation radar, scenario engine, pricing AI, digital twins

#### Industry Adapters (20+)
- Automotive, Pharmaceutical, Energy, Financial Services, Manufacturing, Retail, Healthcare, Telecom, Aerospace, Consumer Goods, and more

#### LLM Native Integration (11 capabilities)
- **Python Execution**: Real statistical simulations, complex calculations, data analysis
- **Web Search**: Real-time market intelligence, competitive monitoring, news analysis
- **Web Browsing**: Regulatory updates, detailed content extraction, structured data
- **Data Analysis**: Advanced analytics, visualizations, statistical modeling

#### Core Features
- **Evidence Tracking**: 6 types (CALCULATION, RETRIEVAL, PRECEDENT, ASSUMPTION, SIMULATION, HEURISTIC)
- **Budget Awareness**: Token, CPU, memory tracking with cost optimization
- **Confidence Scoring**: 5-component quality formula with precision metrics (0.65-0.90)
- **Tournament Mode**: Multi-criteria judging for best results (enabled by default)
- **Audit Trail**: Complete execution history with artifact versioning

---

## [3.0.0] - 2025-08-XX

### Changed - Atomic Capabilities Architecture

#### Breaking Changes
- Replaced static personas with atomic capabilities
- New capability-driven execution model
- Composable analysis units with clear contracts

#### Features
- **Capability Graph**: Registry of atomic capabilities
- **Orchestrator**: Wave-based execution engine (cheap → expensive)
- **Planner**: Beam search optimization for capability selection
- **Whiteboard Memory**: Versioned artifact storage
- **Evidence Ledger**: Quality tracking and verification
- **Policy Enforcement**: PII filtering, compliance, data governance

---

## [2.x] - 2025-07-XX

### Initial Release

#### Features
- Static personas for business analysis
- Basic MCP protocol support
- Simple task execution
- No evidence tracking
- No budget management
- No confidence scoring

---

## Migration Guides

### 4.x → 5.0

**Breaking Changes**: None (backward compatible)

**New Features**:
- 8 new parallel reasoning tools
- Diversity validation for multi-path analysis
- Cross-plan contamination and peer review

**Migration Steps**:
1. Update to v5.0.3
2. Use existing `analyze_with_capabilities` as before
3. Optionally adopt parallel reasoning for complex analyses

### 3.x → 4.0

**Breaking Changes**: None (backward compatible)

**New Features**:
- 58 advanced capabilities (up from 46)
- 11 native-integrated capabilities
- 20+ industry adapters
- Peer review system

**Migration Steps**:
1. Update to v4.0+
2. Use existing adapters as before
3. Optionally enable `peer_review_mode` and `enable_native_capabilities`

### 2.x → 3.0

**Breaking Changes**: Persona-based API removed

**Migration Steps**:
1. Replace persona calls with `analyze_with_capabilities`
2. Specify `adapter_id` instead of persona
3. Update task descriptions to be capability-focused

---

## Deprecation Notices

### v5.0
- None

### v4.0
- None

### v3.0
- **Removed**: Persona-based API (replaced with capability-driven architecture)

---

## Roadmap

### v5.1 (Planned)
- Enhanced diversity validation with semantic similarity checks
- Automatic plan generation based on task analysis
- Real-time collaboration between plans

### v6.0 (Future)
- Multi-modal capabilities (image, video analysis)
- Advanced reasoning strategies (analogical, causal)
- Integration with external knowledge bases

---

[5.0.3]: https://github.com/VFG92/mcp-ptu-server/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/VFG92/mcp-ptu-server/compare/v5.0.0...v5.0.2
[5.0.0]: https://github.com/VFG92/mcp-ptu-server/compare/v4.2.0...v5.0.0
[4.2.0]: https://github.com/VFG92/mcp-ptu-server/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/VFG92/mcp-ptu-server/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/VFG92/mcp-ptu-server/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/VFG92/mcp-ptu-server/compare/v2.0.0...v3.0.0

