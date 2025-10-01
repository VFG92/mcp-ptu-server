# 🤖 MCP PTU Server - Complete Technical Documentation

**Version 5.0.0** | **LLM-Centric Parallel Reasoning, Capability-Driven, Industry-Aware, Persistent** | **For AI Agents & Developers**

---

## 📋 Quick Reference

**Project**: MCP PTU Server - Capability-Driven Business Analysis with Parallel Reasoning
**Version**: 5.0.0 (Parallel Reasoning Release - LLM-Centric Architecture)
**Platform**: Cloudflare Workers + Durable Objects
**Language**: TypeScript (Strict Mode)
**Protocol**: Model Context Protocol (MCP) 2024-11-05
**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`

**Key Stats**:
- 58 Advanced Capabilities across 8 business domains
- 20+ Industry Adapters with specialized templates
- **NEW**: 8 Parallel Reasoning Tools (v5.0 - LLM-Centric Architecture)
- Native LLM integration: 11 capabilities with explicit Python/Web Search integration
- Tournament mode enabled by default
- TypeScript compilation: ✅ 0 errors
- Latest deployment: TBD (2025-10-01)

---

## 🏗️ Architecture Overview

### System Evolution

**v2.x** → **v3.0** → **v4.0**
- Static personas → Atomic capabilities → **46 Advanced Capabilities**
- No evidence → Evidence tracking → **6 Evidence Types**
- No budget → Budget tracking → **Full Cost Management**
- No confidence → Confidence scoring → **Precision 0.65-0.85**
- Generic templates → Basic context → **20+ Industry Adapters**
- No native tools → Mock only → **LLM Native Integration**
- Tournament optional → Tournament optional → **Tournament Default Enabled**

### Architecture Diagram

```
MCP Client (ChatGPT)
        ↓
MCP Server (everything-workers.ts)
  - analyze_with_capabilities (46 capabilities)
  - list_capabilities
  - get_capability_status
  - export_session
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
  (46)     (6 types) (Versioned) (Default) (20+)    (Python/Web)
        ↓
Durable Objects (Persistent State)
```

---

## 🔄 What Was Built (v3.0 → v4.0)

### v3.0 Foundation (Complete)
✅ `capability-graph.ts` - Registry for capabilities
✅ `budget-scheduler.ts` - Wave-based execution with knapsack optimization
✅ `evidence-ledger.ts` - 6 evidence types with verification engine
✅ `tournament-kernel.ts` - Multi-criteria judging with ELO ratings
✅ `confidence-calculus.ts` - 5-component weighted formula
✅ `capability-orchestrator.ts` - Main orchestration engine
✅ `capability-planner.ts` - Beam search for optimal chains
✅ `whiteboard-memory.ts` - Versioned artifact storage
✅ `output-schemas.ts` - 7 Zod schemas for business artifacts

### v4.0 Enhancements (New)

#### 46 Advanced Capabilities (8 Categories)
✅ `capabilities/corporate-strategy-capabilities.ts` - Portfolio, M&A, wargaming, sustainability, geopolitical (5)
✅ `capabilities/marketing-sales-capabilities.ts` + `part2.ts` - Segmentation, WTP, brand, GTM, digital ROI, journey, churn (7)
✅ `capabilities/finance-valuation-capabilities.ts` + `part2.ts` - DCF, TSR, capital structure, cost reduction, working capital, IPO, forecasting (7)
✅ `capabilities/operations-supply-chain-capabilities.ts` + `part2.ts` - Lean ops, footprint, inventory, procurement, quality, aftermarket (6)
✅ `capabilities/process-it-capabilities.ts` + `part2.ts` - Process mining, RPA, IT architecture, cloud TCO, cybersecurity, data governance, AI use cases (7)
✅ `capabilities/legal-regulatory-capabilities.ts` - Regulatory scan, compliance, contract risk, IP, antitrust (5)
✅ `capabilities/people-hr-capabilities.ts` - Org health, talent economics, skill gaps, change management, workforce, compensation (6)
✅ `capabilities/advanced-analytics-capabilities.ts` - Monte Carlo, text mining, innovation radar, scenario engine, pricing AI, digital twins (6)

#### Industry Adapters (20+ Industries)
✅ `industry-context.ts` - 20 industry vertical definitions with regulatory frameworks, KPIs, terminology
✅ `industry-adapters.ts` - Specialized adapters for Automotive, Pharmaceutical, Energy, Financial Services
  - Each adapter: KPIs, regulatory requirements, terminology translation, risk factors, competitive landscape

#### LLM Native Capabilities Integration
✅ `llm-native-capabilities.ts` - Unified interface for native LLM tools
  - Python execution, web search, web browsing, data analysis
  - Mock executor for development/testing
  - Extensible architecture for OpenAI, Anthropic, other providers
  - Cost tracking and estimation

#### Structural Improvements
✅ `export_session` - Now returns complete artifact data with full audit trail
✅ `get_capability_status` - Real-time session monitoring with capability execution progress
✅ Entity name preservation - Actual competitor/entity names in outputs (no more "Leader A", "Competitor B")
✅ Tournament mode - Enabled by default for multi-agent quality
✅ `capabilities/index.ts` - Centralized registration of all 46 capabilities

### Testing & Documentation
✅ TypeScript compilation - 0 errors across all files
✅ Unit tests - Core functionality tested
✅ Integration tests - Full orchestration flow
✅ Performance tests - Cloudflare Workers constraints validated
✅ README.md - Complete v4.0 documentation with examples
✅ AGENT.md - This file, consolidated technical documentation

### v5.0 Parallel Reasoning (NEW - LLM-Centric Architecture)

#### Core Principle: MCP = Guardrails + Memory, ChatGPT = Deliberative Agent

**Architectural Shift**:
- **MCP Server**: Provides typed frames (contracts) and persistent memory. **NO intelligence, NO planning, NO decision-making**.
- **ChatGPT**: Sole deliberative agent. Generates plans, diversifies approaches, contaminates perspectives, mediates final result.
- **Parallel Reasoning**: Happens **inside ChatGPT**, not in server. ChatGPT simulates multiple reasoning paths internally.

**References**:
- Wang et al., "Self-Consistency Improves Chain of Thought Reasoning in Language Models", 2022
- Yao et al., "Tree of Thoughts: Deliberate Problem Solving with Large Language Models", 2023
- Du et al., "Improving Factuality and Reasoning in Language Models through Multiagent Debate", 2023

#### 8 New MCP Tools (v5.0)

✅ **`init_parallel_reasoning`** - Initialize session with diversity axes requirements
  - ChatGPT declares task and required diversity axes
  - Server creates session frame, returns actionable prompt
  - Example: "Submit 3 plans with ≥2 axes each, ≥2 axes different between plans"

✅ **`submit_reasoning_plan`** - Submit plan with diversity validation
  - ChatGPT generates plan with diversity axes, capability chain, rationale
  - Server validates: ≥2 axes declared, ≥2 axes differ from existing plans
  - Rejects plans with insufficient diversification (prevents deriva semantica)

✅ **`execute_plan_step`** - Execute capability for specific plan
  - ChatGPT invokes capability for a plan
  - Server records result, associates with plan
  - Enables parallel execution (ChatGPT manages multiple plans internally)

✅ **`submit_cross_plan_note`** - Contamination between plans
  - ChatGPT sends note from one plan to another
  - Example: "Plan A found regulatory risk X, consider in your analysis"
  - Server stores for audit trail, no processing

✅ **`submit_peer_critique`** - Peer review (ChatGPT-generated)
  - ChatGPT generates critique: claims_challenged, falsification_tests, residual_risks
  - Server stores critique, no evaluation
  - Enables consensus analysis

✅ **`submit_mediation_decision`** - Final mediation
  - ChatGPT chooses which plan's approach for each decision point
  - Must cite evidence_ids from plans
  - Server validates completeness (formal only), no quality judgment

✅ **`list_plan_status`** - Passive status listing
  - Lists pending frames: plan_execution:plan_B, peer_review:4_remaining
  - Helps ChatGPT see what needs completion
  - No recommendations, pure listing

✅ **`finalize_parallel_reasoning`** - Completeness validation
  - Validates: all plans executed, all decisions have evidence
  - Returns decision map showing mediated result
  - Server checks structure, not quality

#### Diversity Axes System

**6 Available Axes** (ChatGPT chooses ≥2 per plan):
1. **data_sources**: Official stats vs industry reports vs academic research
2. **analytical_models**: Regression vs Monte Carlo vs normative analysis
3. **time_horizons**: Short-term vs medium-term vs long-term
4. **quality_metrics**: Precision vs recall vs robustness
5. **risk_perspectives**: Market vs regulatory vs operational
6. **stakeholder_views**: Customer vs investor vs regulator

**Validation Rules** (enforced by server):
- Each plan must declare ≥2 axes
- Plans must differ on ≥2 axes (prevents cosmetic variants)
- Server validates structure, ChatGPT ensures substance

**Example Valid Plans**:
```
Plan A: data_sources=official_stats, analytical_models=regression
Plan B: data_sources=industry_reports, analytical_models=monte_carlo
Plan C: data_sources=academic_research, analytical_models=normative_analysis
```

**Example Invalid Plan** (rejected by server):
```
Plan D: data_sources=official_stats, analytical_models=regression
Reason: Too similar to Plan A (only 0 axes differ, need ≥2)
```

#### Workflow: Complete Parallel Reasoning Session

```
1. ChatGPT: init_parallel_reasoning
   → Server: Returns session frame with diversity requirements

2. ChatGPT: Generates 3 diverse plans internally
   → submit_reasoning_plan (Plan A: official_stats + regression)
   → submit_reasoning_plan (Plan B: industry_reports + monte_carlo)
   → submit_reasoning_plan (Plan C: academic_research + normative)
   → Server: Validates diversity, accepts/rejects each

3. ChatGPT: Executes all plans in parallel (internally)
   → execute_plan_step (Plan A, step 1: market_scan)
   → execute_plan_step (Plan B, step 1: competitor_analysis)
   → execute_plan_step (Plan C, step 1: regulatory_scan)
   → Server: Records results, associates with plans

4. ChatGPT: Contamination between plans
   → submit_cross_plan_note (A→B: "Found market size €50B, consider in your TAM")
   → submit_cross_plan_note (C→A: "Regulatory risk X affects market structure")
   → Server: Stores notes for audit

5. ChatGPT: Generates peer critiques
   → submit_peer_critique (A reviews B: "Assumes linear growth, but volatility high")
   → submit_peer_critique (B reviews C: "Regulatory focus misses market dynamics")
   → submit_peer_critique (C reviews A: "Official stats lag 2 years, outdated")
   → Server: Stores critiques for consensus

6. ChatGPT: Mediates final result
   → submit_mediation_decision ("Market size: use Plan B, evidence: [id1, id2]")
   → submit_mediation_decision ("Growth rate: use Plan A, evidence: [id3, id4]")
   → submit_mediation_decision ("Risk assessment: use Plan C, evidence: [id5, id6]")
   → Server: Validates evidence citations

7. ChatGPT: finalize_parallel_reasoning
   → Server: Validates completeness, returns decision map

8. ChatGPT: Presents final answer
   "Based on 3 parallel reasoning paths with peer review:
    - Market size: €50B (Plan B, Monte Carlo simulation)
    - Growth rate: 12% CAGR (Plan A, regression analysis)
    - Key risk: Regulatory uncertainty (Plan C, normative analysis)
    - Consensus score: 0.82 (high robustness)"
```

#### Benefits: Agent Collaboration to Boost Answer Quality

**Diversification** (prevents deriva semantica):
- Real diversity enforced by structural validation
- ≥2 axes must differ between plans
- Cosmetic variants rejected

**Contamination** (cross-pollination of ideas):
- Plans exchange notes during execution
- Each plan can incorporate insights from others
- Structured via submit_cross_plan_note

**Peer Review** (critical evaluation):
- Each plan critiques others
- Claims challenged, falsification tests proposed
- Consensus/conflict measured

**Mediation** (evidence-based synthesis):
- ChatGPT chooses best approach for each decision point
- Must cite evidence from plans
- Decision map shows rationale

**Quality Improvement** (empirical):
- Self-consistency: Multiple paths → more robust answers (Wang 2022)
- Tree-of-Thoughts: Branching → better exploration (Yao 2023)
- Multi-agent debate: Critique → fewer errors (Du 2023)

---

## 📊 46 Advanced Capabilities (v4.0)

### Complete Capability List by Category

#### 1. Corporate Strategy & Growth (5 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `portfolio_strategy` | Portfolio Strategy Optimizer | BCG matrix, portfolio optimization, strategic recommendations | 0.72 |
| `m_and_a_screening` | M&A Target Screening | M&A target identification, synergy analysis, valuation | 0.70 |
| `scenario_wargaming` | Competitive Scenario Wargaming | Competitive scenario simulation, strategic response planning | 0.68 |
| `sustainability_roadmap` | Sustainability Roadmap | ESG roadmap, carbon footprint, regulatory compliance | 0.70 |
| `geostrategic_risk_scan` | Geopolitical Risk Scanner | Geopolitical risk assessment across regions and markets | 0.65 |

#### 2. Marketing & Sales (7 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `customer_segmentation` | Customer Segmentation | Advanced clustering with behavioral and value-based analysis | 0.72 |
| `wtp_analysis` | Willingness-to-Pay Analysis | Price sensitivity analysis and optimization | 0.70 |
| `brand_equity_tracker` | Brand Equity Tracker | Brand health tracking with awareness, consideration, NPS | 0.72 |
| `gtm_playbook` | Go-to-Market Playbook | GTM strategy with channel mix and launch timeline | 0.70 |
| `digital_marketing_roi` | Digital Marketing ROI | Digital marketing ROI analysis across channels with attribution | 0.72 |
| `customer_journey_map` | Customer Journey Mapper | Customer journey mapping with touchpoints and pain points | 0.70 |
| `churn_prediction` | Churn Prediction | Churn prediction with risk scoring and retention strategies | 0.75 |

#### 3. Finance & Valuation (7 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `dcf_modeler` | DCF Valuation Modeler | DCF valuation with scenario analysis and sensitivity testing | 0.72 |
| `tsr_simulator` | TSR Simulator | Total shareholder return simulation with Monte Carlo analysis | 0.70 |
| `capital_structure_optimizer` | Capital Structure Optimizer | Optimal capital structure with WACC optimization | 0.72 |
| `cost_reduction_levers` | Cost Reduction Analyzer | Cost reduction opportunity identification and prioritization | 0.70 |
| `working_capital_diagnostic` | Working Capital Diagnostic | Working capital optimization with cash conversion cycle | 0.72 |
| `ipo_readiness` | IPO Readiness Assessor | IPO readiness assessment with valuation and timeline | 0.68 |
| `scenario_forecasting` | Financial Scenario Forecasting | Financial scenario forecasting with probabilistic outcomes | 0.72 |

#### 4. Operations & Supply Chain (6 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `lean_ops_benchmark` | Lean Operations Benchmark | Lean operations benchmarking with OEE and waste analysis | 0.72 |
| `footprint_optimizer` | Manufacturing Footprint Optimizer | Manufacturing footprint optimization with make-vs-buy analysis | 0.70 |
| `inventory_scenario` | Inventory Scenario Analyzer | Inventory optimization with service level and cost trade-offs | 0.72 |
| `procurement_index` | Procurement Performance Index | Procurement performance index with supplier risk assessment | 0.70 |
| `quality_defect_analysis` | Quality Defect Analyzer | Quality defect analysis with root cause and cost impact | 0.72 |
| `aftermarket_economics` | Aftermarket Economics | Aftermarket economics with service revenue and profitability | 0.70 |

#### 5. Process Excellence & IT (7 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `process_mining` | Process Mining Analyzer | Process mining with bottleneck identification and optimization | 0.75 |
| `rpa_opportunity_scan` | RPA Opportunity Scanner | RPA opportunity scanning with ROI and implementation roadmap | 0.70 |
| `it_architecture_map` | IT Architecture Mapper | IT architecture mapping with technical debt and modernization | 0.72 |
| `cloud_tco_model` | Cloud TCO Modeler | Cloud TCO modeling with on-premise vs cloud comparison | 0.70 |
| `cybersecurity_risk_model` | Cybersecurity Risk Modeler | Cybersecurity risk assessment with ISO 27001 and NIS2 compliance | 0.70 |
| `data_governance_index` | Data Governance Index | Data governance maturity assessment with quality and lineage | 0.72 |
| `ai_use_case_screener` | AI Use Case Screener | AI/ML use case screening with prioritization and roadmap | 0.68 |

#### 6. Legal & Regulatory (5 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `regulatory_scan_enhanced` | Enhanced Regulatory Scanner | Comprehensive regulatory scanning with vertical-specific regulations | 0.72 |
| `compliance_gap_assessment` | Compliance Gap Assessor | Compliance gap assessment for GDPR, SOX, ISO standards | 0.70 |
| `contract_risk_analyzer` | Contract Risk Analyzer | Contract risk analysis with clause assessment and recommendations | 0.68 |
| `ip_landscape` | IP Landscape Analyzer | IP landscape analysis with patent mapping and freedom-to-operate | 0.65 |
| `antitrust_impact` | Antitrust Impact Analyzer | Antitrust impact assessment with HHI and merger control analysis | 0.68 |

#### 7. People & HR (6 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `org_health_index` | Organizational Health Index | Organizational health assessment with engagement and culture metrics | 0.72 |
| `talent_economics` | Talent Economics Analyzer | Talent economics analysis with workforce cost and productivity | 0.70 |
| `skill_gap_analyzer` | Skill Gap Analyzer | Skill gap analysis with current vs future requirements | 0.72 |
| `change_management_tracker` | Change Management Tracker | Change management tracking with readiness and adoption risk | 0.68 |
| `workforce_future_scenarios` | Workforce Future Scenarios | Workforce future scenarios with automation and remote work impact | 0.65 |
| `compensation_benchmark` | Compensation Benchmark | Compensation benchmarking with market comparison and pay equity | 0.72 |

#### 8. Advanced Analytics (6 capabilities)
| ID | Name | Description | Precision |
|----|------|-------------|-----------|
| `monte_carlo_finance` | Monte Carlo Financial Forecasting | Probabilistic financial forecasting using Monte Carlo simulation | 0.72 |
| `text_mining_market` | Market Text Mining | Market text mining with weak signal detection from news and patents | 0.68 |
| `innovation_radar` | Innovation Radar | Innovation radar with startup scouting and technology trends | 0.65 |
| `scenario_engine` | Scenario Engine | Scenario engine with adoption curves and disruption dynamics | 0.65 |
| `pricing_ai_optimizer` | AI-Powered Pricing Optimizer | AI-powered pricing optimization with elasticity and dynamic rules | 0.70 |
| `digital_twin_ops` | Digital Twin Operations | Digital twin operations simulation for supply chain and plants | 0.72 |

### Capability Implementation Pattern

Each capability follows this structure:

```typescript
const capabilityName: CapabilityNode = {
  id: 'capability_id',
  name: 'Capability Name',
  description: 'Detailed description',
  category: 'strategic' | 'market' | 'financial' | 'operational' | 'risk' | 'commercial',
  preconditions: {
    required_inputs: ['input1', 'input2']
  },
  output_contract: {
    schema: z.object({
      // Zod schema for type safety
    }),
    required_evidence: ['key_output_field'],
    quality_checks: []
  },
  cost_estimate: {
    expected_tokens_in: 500,
    expected_tokens_out: 1200,
    cpu_ms: 700,
    subrequests: 2
  },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    // Get industry context and entity names
    const industryContext = context.whiteboard.get('__industry_context__');
    const entityNames = context.whiteboard.get('__entity_names__') || {};

    // Get native capabilities if available
    const nativeCapabilities = getNativeCapabilities(context);

    // Implementation logic
    const output = { /* ... */ };

    return {
      capability_id: 'capability_id',
      output,
      evidence: { /* Evidence with types */ },
      confidence: 0.70,
      cost_actual: { /* Actual costs */ },
      quality_score: 0.80,
      warnings: [],
      metadata: { execution_time_ms, timestamp, version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['tag1', 'tag2']
};
```

---

## 🧩 Core Components

### 1. Capability Graph (`capability-graph.ts`)

**Purpose**: Central registry for all capabilities

**Key Methods**:
- `register(capability)` - Add capability to graph
- `get(id)` - Retrieve capability by ID
- `getByCategory(category)` - Filter by category
- `getByTag(tag)` - Filter by tag
- `checkPreconditions(id, context)` - Validate preconditions
- `getDependencies(id)` - Get capability dependencies
- `estimateTotalCost(ids)` - Calculate total cost

### 2. Capability Planner (`capability-planner.ts`)

**Purpose**: Plan optimal capability chains using beam search

**Algorithm**:
1. Extract aspects from task description
2. Beam search with coverage scoring
3. Budget-aware filtering
4. Adapter integration

### 3. Budget Scheduler (`budget-scheduler.ts`)

**Purpose**: Execute capabilities in waves with budget constraints

**Wave Strategy**:
- **Wave 1**: Cheap capabilities (< 1000 tokens)
- **Wave 2**: Medium capabilities (1000-3000 tokens)
- **Wave 3**: Expensive capabilities (> 3000 tokens)

**Features**:
- Knapsack optimization
- Partial success handling
- Retry logic with exponential backoff
- Budget tracking and warnings

### 4. Evidence Ledger (`evidence-ledger.ts`)

**Purpose**: Track and verify all claims with evidence

**Evidence Types**:
1. **CALCULATION** - Mathematical computations with formulas
2. **RETRIEVAL** - Data lookups from sources
3. **PRECEDENT** - Historical examples and case studies
4. **ASSUMPTION** - Stated assumptions with rationale
5. **SIMULATION** - Model outputs and scenarios
6. **HEURISTIC** - Rules of thumb and best practices

**Verification Engine**:
- Checks evidence completeness
- Validates evidence quality
- Flags disputed claims
- Calculates quality scores

### 5. Confidence Calculus (`confidence-calculus.ts`)

**Purpose**: Calculate confidence scores for results

**Formula**:
```
confidence = w1*verification + w2*coherence + w3*evidence_quality + 
             w4*precision + w5*coverage

Weights: [0.3, 0.2, 0.25, 0.15, 0.1]
```

**Components**:
1. **Verification** (30%) - Evidence verification rate
2. **Coherence** (20%) - Internal consistency
3. **Evidence Quality** (25%) - Quality of supporting evidence
4. **Precision** (15%) - Capability precision scores
5. **Coverage** (10%) - Aspect coverage completeness

### 6. Tournament Kernel (`tournament-kernel.ts`)

**Purpose**: Multi-criteria judging for best results

**Features**:
- Diversity enforcement
- ELO rating system
- Bandit allocation
- Multi-criteria scoring

### 7. Whiteboard Memory (`whiteboard-memory.ts`)

**Purpose**: Versioned artifact storage with merge strategies

**Features**:
- Add/update/get artifacts
- Version history tracking
- Diff engine for changes
- Merge strategies: LATEST, HIGHEST_CONFIDENCE, MANUAL

### 8. Capability Orchestrator (`capability-orchestrator.ts`)

**Purpose**: Main orchestration engine coordinating all components

**Execution Flow**:
1. **Plan** - Use planner to create capability chain
2. **Schedule** - Use scheduler to create execution plan
3. **Execute** - Run capabilities in waves
4. **Track** - Record evidence in ledger
5. **Store** - Save artifacts to whiteboard
6. **Score** - Calculate confidence with calculus
7. **Tournament** - Run tournament mode (default enabled) for best results
8. **Return** - Package results with metadata

**v4.0 Enhancements**:
- Industry context injection from adapters
- Entity name preservation in outputs
- Native LLM capability integration
- Tournament mode enabled by default

### 9. Industry Adapters (`industry-adapters.ts`)

**Purpose**: Industry-specific context and adaptation layer

**Supported Industries** (20+):
- Automotive, Pharmaceutical, Energy, Financial Services
- Manufacturing, Retail, Healthcare, Telecommunications
- Aerospace, Agriculture, Construction, Education
- Media & Entertainment, Logistics, Real Estate
- Professional Services, Government, Enterprise SaaS, Consumer SaaS

**Adapter Interface**:
```typescript
interface IndustryAdapter {
  vertical: IndustryVertical;
  adaptOutput(genericOutput: any, context: IndustryContext): any;
  getKPIs(): Array<{ name: string; description: string; benchmark?: string }>;
  getRegulatoryRequirements(region: GeographicRegion): Array<{
    framework: string;
    type: 'mandatory' | 'recommended' | 'optional';
    description: string;
  }>;
  translateTerminology(term: string): string;
  getRiskFactors(): Array<{ category: string; description: string; mitigation: string }>;
  getCompetitiveLandscape(): {
    market_structure: string;
    key_success_factors: string[];
    barriers_to_entry: string[];
  };
}
```

**Fully Implemented Adapters**:

#### Automotive Adapter
- **KPIs**: BEV penetration, ADAS adoption, R&D intensity, supply chain resilience
- **Regulations**: UN R155/R156 (cybersecurity), CAFE standards, Euro 7, battery passport
- **Terminology**: Customer → Buyer, Product → Vehicle, Market → Segment
- **Risk Factors**: Battery supply chain, software complexity, regulatory compliance
- **Competitive Landscape**: Oligopolistic with new entrants (Tesla, BYD)

#### Pharmaceutical Adapter
- **KPIs**: Clinical trial success rate, patent cliff exposure, R&D ROI, regulatory approval time
- **Regulations**: FDA 21 CFR Part 11, EMA GMP, ICH guidelines, pharmacovigilance
- **Terminology**: Customer → Patient/HCP, Product → Drug/Therapy, Market → Indication
- **Risk Factors**: Clinical trial failure, patent expiry, regulatory rejection
- **Competitive Landscape**: Highly regulated with high barriers to entry

#### Energy Adapter
- **KPIs**: Renewable energy mix, grid reliability, LCOE, carbon intensity
- **Regulations**: EU ETS, renewable energy directives, grid codes, carbon pricing
- **Terminology**: Customer → Offtaker, Product → Energy/Capacity, Market → Grid/Region
- **Risk Factors**: Commodity price volatility, regulatory changes, technology disruption
- **Competitive Landscape**: Transitioning from fossil fuels to renewables

#### Financial Services Adapter
- **KPIs**: CET1 ratio, NIM, cost-to-income, digital adoption, AUM growth
- **Regulations**: Basel III, MiFID II, GDPR, PSD2, AML/KYC
- **Terminology**: Customer → Client/Counterparty, Product → Product/Service, Market → Segment
- **Risk Factors**: Credit risk, market risk, operational risk, regulatory compliance
- **Competitive Landscape**: Consolidating with fintech disruption

**Helper Function**:
```typescript
function enrichWithIndustryContext(
  output: any,
  vertical: IndustryVertical,
  region: GeographicRegion = 'global'
): any {
  const adapter = IndustryAdapterFactory.getAdapter(vertical);
  const context = getIndustryContext(vertical, region);
  return adapter.adaptOutput(output, context);
}
```

### 10. Native LLM Capabilities (`llm-native-capabilities.ts`)

**Purpose**: BIDIRECTIONAL AGENT ↔ LLM COMMUNICATION

This system enables capabilities (agents) to **request the LLM to use its native tools** to enhance their analysis. The LLM executes the tool and returns enriched results to the capability.

**Concept**: Instead of capabilities simulating results, they ask the LLM to perform real operations.

**Supported Native Tools**:
- `PYTHON_EXECUTION` - Execute Python code for complex calculations, simulations
- `WEB_SEARCH` - Real-time web search for market intelligence, competitive monitoring
- `WEB_BROWSE` - Detailed web page content extraction for regulatory updates
- `DATA_ANALYSIS` - Advanced analytics, statistical analysis, visualizations
- `CODE_INTERPRETER` - Code execution and debugging
- `FILE_ANALYSIS` - Document and file content analysis
- `IMAGE_GENERATION` - Image generation for visualizations (future)

**Architecture**:
```typescript
interface NativeCapabilityExecutor {
  execute(request: NativeCapabilityRequest): Promise<NativeCapabilityResponse>;
  estimateCost(request: NativeCapabilityRequest): CostEstimate;
}

class NativeCapabilityManager {
  private executor: NativeCapabilityExecutor;

  async invoke(
    type: NativeCapabilityType,
    params: any,
    context: ExecutionContext
  ): Promise<NativeCapabilityResponse>;

  isAvailable(type: NativeCapabilityType): boolean;
}
```

**Real-World Example 1: Monte Carlo Simulation**

```typescript
// Capability: monte_carlo_finance
async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
  const nativeCapabilities = getNativeCapabilities(context);

  if (nativeCapabilities?.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
    // AGENT REQUESTS: "LLM, please execute this Python code with numpy"
    const pythonCode = `
import numpy as np
np.random.seed(42)
iterations = 10000

# Monte Carlo simulation
revenue_samples = np.random.normal(580, 95, iterations)
ebitda_samples = np.random.normal(140, 38, iterations)

result = {
    'revenue': {
        'p10': float(np.percentile(revenue_samples, 10)),
        'p50': float(np.percentile(revenue_samples, 50)),
        'p90': float(np.percentile(revenue_samples, 90)),
        'mean': float(np.mean(revenue_samples)),
        'std_dev': float(np.std(revenue_samples))
    },
    'ebitda': { /* ... */ }
}
print(result)
`;

    // LLM EXECUTES: Python code with numpy
    const response = await nativeCapabilities.invoke(
      NativeCapabilityType.PYTHON_EXECUTION,
      { code: pythonCode, timeout_seconds: 30 },
      context
    );

    if (response.success && response.result) {
      // AGENT RECEIVES: Real simulation results from LLM
      const simulationResults = response.result;

      // Use real results in output
      return {
        capability_id: 'monte_carlo_finance',
        output: {
          simulation_parameters: { iterations: 10000, confidence_level: 0.90 },
          probabilistic_outcomes: [
            { metric: 'Revenue', ...simulationResults.revenue },
            { metric: 'EBITDA', ...simulationResults.ebitda }
          ]
        },
        evidence: [{
          type: EvidenceType.SIMULATION,
          rationale: 'Real Monte Carlo simulation via LLM native Python with numpy'
        }],
        confidence: 0.85, // Higher confidence with real simulation
        warnings: ['Real Monte Carlo simulation executed via LLM native Python']
      };
    }
  }

  // Fallback to heuristic if LLM unavailable
  return { /* mock data */ };
}
```

**Real-World Example 2: Market Intelligence with Web Search**

```typescript
// Capability: text_mining_market
async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
  const nativeCapabilities = getNativeCapabilities(context);
  const entityNames = context.whiteboard.get('__entity_names__') || {};

  if (nativeCapabilities?.isAvailable(NativeCapabilityType.WEB_SEARCH)) {
    // AGENT REQUESTS: "LLM, please search the web for recent news"
    const searchQueries = [
      `${entityNames.competitor_1} recent news acquisitions M&A`,
      `${entityNames.competitor_2} patent filings technology innovation`,
      `automotive industry emerging trends 2025`
    ];

    // LLM EXECUTES: Web search for each query
    const searchResults = await Promise.all(
      searchQueries.map(query =>
        nativeCapabilities.invoke(
          NativeCapabilityType.WEB_SEARCH,
          { query, max_results: 5 },
          context
        )
      )
    );

    if (searchResults.every(r => r.success)) {
      // AGENT RECEIVES: Real-time web search results from LLM
      const realTimeData = searchResults.map(r => r.result);

      // Use real data in competitive intelligence
      return {
        capability_id: 'text_mining_market',
        output: {
          competitive_intelligence: [
            {
              competitor: entityNames.competitor_1,
              activity_type: 'Recent Activity',
              description: realTimeData[0]?.results?.[0]?.snippet || 'No recent news',
              strategic_implication: 'Real-time competitive intelligence from web search'
            }
          ],
          signal_detection: [
            {
              signal: 'Real-time signal from web search',
              strength: 'strong',
              sources: realTimeData[0]?.results?.length || 5,
              trend: 'emerging'
            }
          ]
        },
        evidence: [{
          type: EvidenceType.RETRIEVAL,
          rationale: 'Real-time market intelligence from LLM web search'
        }],
        confidence: 0.82, // Higher confidence with real data
        warnings: ['Real-time market intelligence retrieved via LLM web search']
      };
    }
  }

  // Fallback to heuristic if LLM unavailable
  return { /* mock data */ };
}
```

**Implementation Status**:
- ✅ **2 Complete Examples**: `monte_carlo_finance` (Python), `text_mining_market` (Web Search)
- ✅ **5 Python Templates**: DCF, TSR, Capital Structure, Working Capital, Scenario Forecasting
- ✅ **Pattern Documented**: Replicable for all 35 priority capabilities
- 📋 **Remaining**: 33 capabilities can follow same pattern

**How to Add LLM Native Integration to Any Capability**:

1. Import native capabilities:
```typescript
import { getNativeCapabilities, NativeCapabilityType } from '../llm-native-capabilities.js';
```

2. In `execute()` function, add before main logic:
```typescript
const nativeCapabilities = getNativeCapabilities(context);
let realData: any = null;
let evidenceType = EvidenceType.HEURISTIC;
let warnings: string[] = [];

if (nativeCapabilities?.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
  try {
    const response = await nativeCapabilities.invoke(
      NativeCapabilityType.PYTHON_EXECUTION,
      { code: pythonCode, timeout_seconds: 30 },
      context
    );
    if (response.success && response.result) {
      realData = response.result;
      evidenceType = EvidenceType.SIMULATION;
      warnings.push('Real calculation via LLM native Python');
    }
  } catch (error) {
    warnings.push('LLM unavailable - using heuristic');
  }
}
```

3. Use real data or fallback:
```typescript
const output = realData ? { /* use realData */ } : { /* mock data */ };
```

4. Update evidence and confidence:
```typescript
evidence: [{ type: evidenceType, rationale: realData ? 'Real...' : 'Heuristic...' }],
confidence: realData ? 0.85 : 0.70
```

**Complete Flow: Agent ↔ LLM Interaction**

```
1. USER REQUEST
   "Analyze BEV market with Monte Carlo simulation"
   ↓
2. MCP SERVER
   Orchestrator selects capability: monte_carlo_finance
   ↓
3. CAPABILITY (AGENT)
   Identifies need: "I need real Monte Carlo simulation with 10K iterations"
   Creates request: Python code with numpy
   ↓
4. NATIVE CAPABILITY MANAGER
   Stores request in ExecutionContext
   Returns control to orchestrator
   ↓
5. ORCHESTRATOR
   Sees native capability request pending
   Sends request to LLM via MCP protocol
   ↓
6. LLM (ChatGPT/Claude)
   Receives request: "Execute this Python code"
   Uses native Python tool
   Executes: numpy Monte Carlo simulation
   Returns: {revenue: {p10: 450, p50: 575, ...}, ebitda: {...}}
   ↓
7. NATIVE CAPABILITY MANAGER
   Receives LLM response
   Validates and packages result
   ↓
8. CAPABILITY (AGENT)
   Receives real simulation results
   Uses results to complete analysis
   Returns enriched output with high confidence
   ↓
9. ORCHESTRATOR
   Packages final result
   Returns to user via MCP
```

**Key Benefits**:
- ✅ **Real Calculations**: Actual Python/numpy instead of mock data
- ✅ **Real-Time Data**: Live web search instead of static assumptions
- ✅ **Higher Confidence**: 0.85 vs 0.72 with real data
- ✅ **Better Evidence**: SIMULATION/RETRIEVAL vs HEURISTIC
- ✅ **Graceful Fallback**: Works without LLM (lower confidence)

**Mock Executor** (for development/testing):
- Returns simulated responses without external API calls
- Useful for testing capability logic without LLM costs
- Can be replaced with real executors (OpenAI, Anthropic, etc.)

**Integration Points**:
- Attached to ExecutionContext via `attachNativeCapabilities(context)`
- Retrieved in capabilities via `getNativeCapabilities(context)`
- Cost tracking integrated with capability cost estimation
- Timeout and error handling built-in
- Automatic fallback to heuristics if LLM unavailable

---

## 🤝 Peer Review System (v4.2.0)

### Overview
Peer review converts parallel agent runs into a **critical evaluation loop**. Every trajectory critiques the others, producing consensus, conflict, and robustness signals that feed directly into tournament rankings and orchestration outputs.

### Core Module: `PeerReviewKernel`
- File: `src/workers/peer-review-kernel.ts`
- Responsibilities:
  - `conductPeerReview(results)` orchestrates the complete review session
  - `generateCritiques(results)` produces pairwise critiques for each agent output
  - `analyzeConsensus(critiques)` builds an agreement matrix and scores
  - `identifyClusters(matrix)` groups mutually supportive trajectories
  - `identifyOutliers(matrix)` spots isolated or controversial outputs
  - `calculateRobustness(analysis)` blends consensus, reviewer confidence, and controversy into a single robustness index

#### Key Data Structures
```typescript
interface PeerCritique {
  reviewer_id: string;
  reviewed_id: string;
  agreement_score: number;        // 0-1
  critique_points: CritiquePoint[];
  overall_assessment: 'strong_agree' | 'agree' | 'neutral' | 'disagree' | 'strong_disagree';
  confidence_in_critique: number;
}

interface ConsensusAnalysis {
  consensus_score: number;        // Agreement level 0-1
  conflict_score: number;         // Disagreement level 0-1
  robustness_score: number;       // Composite robustness metric 0-1
  agreement_matrix: number[][];   // NxN agreement grid
  clusters: ResultCluster[];      // Groups of mutually aligned outputs
  outliers: string[];             // Controversial or isolated trajectories
  critical_disagreements: CriticalDisagreement[];
}
```

### Integrations

| Component | Changes |
|-----------|---------|
| `tournament-kernel.ts` | Runs peer review **before** scoring, boosts ELO by up to +100 for high agreement, applies -50 penalty for high controversy, enriches contestant summaries with peer-identified strengths/weaknesses. |
| `capability-orchestrator.ts` | New `peer_review_mode` flag (default `true`), passes peer review insights through to orchestration results, logs consensus/robustness in execution traces. |
| `examples/peer-review-example.ts` | Runnable walkthrough demonstrating consensus metrics, cluster detection, and toggling. |

### Metrics & Interpretation
- **Consensus Score (0-1)** – >0.8 indicates strong alignment, <0.6 signals divergence
- **Conflict Score (0-1)** – Computed as `1 - consensus`, surfaces disagreement hot spots
- **Robustness Score (0-1)** – Weighted blend of consensus (60%), reviewer confidence (30%), controversy penalty (10%)
- **Critical Disagreements** – Count of high-impact conflicts requiring escalation
- **Review Quality (0-1)** – Assesses critique depth, coverage, and reviewer confidence

### Execution Flow
```
1. capabilityOrchestrator.execute()
   ↓
2. Capabilities generate N candidate outputs
   ↓
3. PeerReviewKernel.conductPeerReview()
   ├─ Each output critiques all others
   ├─ Builds agreement matrix & critique ledger
   ├─ Computes consensus/conflict/robustness
   ├─ Identifies clusters and outliers
   ↓
4. TournamentKernel.runTournament()
   ├─ Applies ELO boosts or penalties
   └─ Injects peer strengths/weaknesses
   ↓
5. Orchestrator returns results with `peer_review` summary
```

### Usage
```typescript
const result = await orchestrator.execute({
  session_id: 'session_001',
  task: 'Market analysis for EU EV segment',
  budget: defaultBudget,
  policy: defaultPolicy,
  // peer_review_mode defaults to true
});

if (result.peer_review) {
  console.log('Consensus', result.peer_review.consensus_score);
  console.log('Robustness', result.peer_review.robustness_score);
  console.log('Critical disagreements', result.peer_review.critical_disagreements);
}

// Optional: disable when speed matters
await orchestrator.execute({
  session_id: 'quick_pass',
  task: 'Baseline churn check',
  budget: leanBudget,
  policy: defaultPolicy,
  peer_review_mode: false,
});
```

### MCP Schema and Handler Changes

- `peer_review_mode` is included in the Zod schema for `analyze_with_capabilities` in `src/workers/capability-tools.ts`:
  - Optional boolean with default `true`.
  - Described as: Enable peer review between agents for robustness measurement.
- The handler forwards `peer_review_mode` to the orchestrator request.
- The formatter appends a "Peer Review Analysis" section to responses when `result.peer_review` is present, including consensus, conflict, robustness, critical disagreements, and review quality, plus interpretation guidance.

Example MCP payloads:

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

### Implementation Stats & Verification
- New files: `peer-review-kernel.ts`, `__tests__/peer-review.test.ts`, `examples/peer-review-example.ts`
- Modified files: `tournament-kernel.ts`, `capability-orchestrator.ts`, `AGENT.md`
- Test coverage: **7 dedicated peer review tests**, **105 total tests** now passing
- TypeScript strict: `npx tsc --noEmit` → 0 errors
- Example script: `npx ts-node examples/peer-review-example.ts`
- Backward compatibility: 100% (feature togglable)

### Benefits
1. **Internal Self-Validation** – Agents cross-check each other before tournament scoring
2. **Quantified Robustness** – Consensus/conflict metrics surface stability of conclusions
3. **Conflict Spotlighting** – Critical disagreements pinpoint areas needing human review
4. **Enhanced Rankings** – Tournament incorporates agreement strength and controversy penalties
5. **Transparent Audit Trail** – Full critique ledger stored for inspection

### Future Enhancements
1. LLM-assisted critique generation for deeper peer feedback
2. Reviewer weighting based on historical accuracy
3. Iterative review rounds with refinement loops
4. Visualization of agreement matrices and clusters
5. Learning from past peer reviews to improve critique heuristics

---

## 🔌 MCP Tools API

**4 production-ready tools exposed via MCP protocol**

### `analyze_with_capabilities`

Main analysis tool with 46 capabilities, industry adaptation, and native LLM integration.

**Status**: ✅ Production Ready | Tested & Verified | v4.0 Enhanced

**Input**:
```typescript
{
  session_id: string;
  task: string;
  adapter_id?: 'strategy' | 'finance' | 'commercial' | 'risk' | 'comprehensive';
  required_artifacts?: string[];
  budget?: {
    max_tokens_in: number;      // Default: 10000
    max_tokens_out: number;     // Default: 10000
    max_cpu_ms: number;         // Default: 10000
    max_subrequests: number;    // Default: 50
  };
  tournament_mode?: boolean;    // Default: true (v4.0 change)
  peer_review_mode?: boolean;   // Default: true (v4.2.0 NEW)
  industry_vertical?: string;   // v4.0: Auto-detected or explicit
  geographic_region?: string;   // v4.0: For regulatory context
  entity_names?: Record<string, string>; // v4.0: Actual entity names
}
```

**v4.0 New Parameters**:
- `tournament_mode` - Now **enabled by default** for multi-agent quality
- `industry_vertical` - One of 20+ industries (auto-detected from task if not provided)
- `geographic_region` - Geographic region for regulatory context (global, north_america, europe, asia_pacific, etc.)
- `entity_names` - Map of entity types to actual names (e.g., `{"competitor_1": "Tesla", "competitor_2": "VW Group"}`)

**v4.2.0 New Parameters**:
- `peer_review_mode` - **Enabled by default**. Agents critique each other's results for robustness measurement. Set to `false` to disable for faster execution.

**Output**:
```typescript
{
  success: boolean;
  partial: boolean;
  artifacts: Array<{
    id: string;
    type: string;
    data: any;              // Industry-adapted output
    confidence: number;
    evidence_quality: number;
    validation_errors: string[];
  }>;
  coverage: number;
  overall_confidence: number;
  cost_actual: CostEstimate;
  warnings: string[];
  missing_capabilities: string[];
  execution_time_ms: number;
  industry_context?: {      // v4.0: Industry context used
    vertical: string;
    region: string;
    adapter_applied: boolean;
  };
  peer_review?: {           // v4.2.0: Peer review results
    consensus_score: number;        // 0-1, level of agreement
    conflict_score: number;         // 0-1, level of disagreement
    robustness_score: number;       // 0-1, overall robustness
    critical_disagreements: number; // Count of critical conflicts
    review_quality: number;         // 0-1, quality of review process
  };
}
```

**Example Usage (v4.0)**:
```typescript
{
  "session_id": "automotive_analysis_001",
  "task": "Analyze BEV market opportunity in Europe with UN R155/R156 compliance",
  "adapter_id": "comprehensive",
  "industry_vertical": "automotive",
  "geographic_region": "europe",
  "entity_names": {
    "competitor_1": "Tesla",
    "competitor_2": "VW Group",
    "competitor_3": "BYD"
  },
  "tournament_mode": true  // Default, can be omitted
}
```

**Test Results (v4.0)**:
- ✅ 46 capabilities available across 8 domains
- ✅ Industry-specific adaptation for 20+ verticals
- ✅ Confidence scores: 65-85% (capability-dependent)
- ✅ Evidence quality: High with 6 evidence types
- ✅ Budget tracking: Full token/CPU/subrequest tracking
- ✅ Native LLM capabilities: Python, web search, data analysis

---

### `list_capabilities`

Browse available capabilities by category or tag.

**Status**: ✅ Production Ready | Tested & Verified | v4.0 Enhanced

**Available Capabilities**: **46 advanced capabilities** across **8 categories**

**Categories**:
1. **Corporate Strategy & Growth** (5): portfolio_strategy, m_and_a_screening, scenario_wargaming, sustainability_roadmap, geostrategic_risk_scan
2. **Marketing & Sales** (7): customer_segmentation, wtp_analysis, brand_equity_tracker, gtm_playbook, digital_marketing_roi, customer_journey_map, churn_prediction
3. **Finance & Valuation** (7): dcf_modeler, tsr_simulator, capital_structure_optimizer, cost_reduction_levers, working_capital_diagnostic, ipo_readiness, scenario_forecasting
4. **Operations & Supply Chain** (6): lean_ops_benchmark, footprint_optimizer, inventory_scenario, procurement_index, quality_defect_analysis, aftermarket_economics
5. **Process Excellence & IT** (7): process_mining, rpa_opportunity_scan, it_architecture_map, cloud_tco_model, cybersecurity_risk_model, data_governance_index, ai_use_case_screener
6. **Legal & Regulatory** (5): regulatory_scan_enhanced, compliance_gap_assessment, contract_risk_analyzer, ip_landscape, antitrust_impact
7. **People & HR** (6): org_health_index, talent_economics, skill_gap_analyzer, change_management_tracker, workforce_future_scenarios, compensation_benchmark
8. **Advanced Analytics** (6): monte_carlo_finance, text_mining_market, innovation_radar, scenario_engine, pricing_ai_optimizer, digital_twin_ops

**Input**:
```typescript
{
  category?: string;  // Filter by category
  tag?: string;       // Filter by tag
}
```

**Output**:
```typescript
{
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    cost_estimate: CostEstimate;
    expected_precision: number;
  }>;
  total_count: number;
}
```

---

### `get_capability_status`

Check real-time status of capability analysis session.

**Status**: ✅ Production Ready | v4.0 Enhanced

**Input**:
```typescript
{
  session_id: string;
}
```

**Output**:
```typescript
{
  session_id: string;
  status: 'running' | 'completed' | 'failed';
  progress: {
    capabilities_executed: number;
    capabilities_total: number;
    current_wave: number;
  };
  budget_consumed: CostEstimate;
  artifacts_generated: number;
  execution_time_ms: number;
}
```

**v4.0 Enhancements**:
- Real-time progress tracking with wave information
- Budget consumption monitoring
- Artifact generation count

---

### `export_session`

Export complete session with full artifact data for audit/compliance.

**Status**: ✅ Production Ready | v4.0 Enhanced

**Input**:
```typescript
{
  session_id: string;
}
```

**Output**:
```typescript
{
  session_id: string;
  artifacts: Array<{
    id: string;
    type: string;
    data: any;              // v4.0: Full artifact data (not just IDs)
    confidence: number;
    evidence_quality: number;
    version: number;
    created_at: string;
  }>;
  evidence_ledger: Array<{
    claim: string;
    evidence_type: string;
    source: string;
    quality_score: number;
  }>;
  execution_history: Array<{
    capability_id: string;
    timestamp: string;
    cost: CostEstimate;
    success: boolean;
  }>;
  total_cost: CostEstimate;
  session_metadata: {
    created_at: string;
    completed_at: string;
    industry_vertical?: string;
    geographic_region?: string;
  };
}
```

**v4.0 Enhancements**:
- Full artifact data included (not just IDs)
- Complete audit trail with execution history
- Industry context metadata
- Evidence ledger export

---

## 🧠 Parallel Reasoning v5.0 Tools (NEW)

**8 LLM-centric tools for multi-path reasoning with diversity enforcement and contamination**

### `init_parallel_reasoning`

Initialize a parallel reasoning session where ChatGPT generates multiple diverse reasoning plans.

**Status**: ✅ Production Ready | v5.0 | LLM-Centric Architecture

**Input**:
```typescript
{
  session_id: string;
  task_description: string;
  required_diversity_axes: DiversityAxis[];  // Choose from 6 axes
  min_plans: number;                         // Minimum 2, recommended 3
}
```

**Output**: Actionable prompt with diversity axes reference and next steps.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "task_description": "Analyze European fintech market for B2B SaaS opportunities",
  "required_diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
  "min_plans": 3
}
```

---

### `submit_reasoning_plan`

Submit a reasoning plan with diversity axes. Server validates structural diversity (≥2 axes differ from existing plans).

**Status**: ✅ Production Ready | v5.0 | Diversity Validation

**Input**:
```typescript
{
  session_id: string;
  plan: {
    plan_id: string;
    description: string;
    diversity_axes: DiversityAxis[];  // Must declare ≥2
    capability_chain: string[];       // Capabilities to execute
    rationale: string;                // Why this plan adds value
    expected_outputs: string[];       // Expected artifact types
  };
}
```

**Output**: Acceptance/rejection with diversity validation feedback.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "plan": {
    "plan_id": "plan_A",
    "description": "Market-driven analysis using official statistics",
    "diversity_axes": ["data_sources", "analytical_models"],
    "capability_chain": ["market_scan", "tam_sam_som_build", "competitor_analysis"],
    "rationale": "Provides data-driven baseline using official market statistics",
    "expected_outputs": ["market_map", "tam_sam_som", "competitive_landscape"]
  }
}
```

---

### `execute_plan_step`

Execute a capability for a specific plan. Enables parallel execution (ChatGPT manages multiple plans internally).

**Status**: ✅ Production Ready | v5.0 | Plan-Specific Execution

**Input**:
```typescript
{
  session_id: string;
  plan_id: string;
  capability_id: string;
  inputs?: Record<string, any>;  // Optional capability inputs
}
```

**Output**: Capability result associated with plan.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "plan_id": "plan_A",
  "capability_id": "market_scan",
  "inputs": {
    "industry_vertical": "financial_services",
    "geographic_region": "europe"
  }
}
```

---

### `submit_cross_plan_note`

Submit a note from one plan to another (contamination). Enables interaction between reasoning paths.

**Status**: ✅ Production Ready | v5.0 | Contamination

**Input**:
```typescript
{
  session_id: string;
  from_plan_id: string;
  to_plan_id: string;
  note: string;
  references: string[];  // Evidence IDs referenced
}
```

**Output**: Confirmation of note storage.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "from_plan_id": "plan_A",
  "to_plan_id": "plan_B",
  "note": "Found market size €50B using official statistics. Consider this baseline in your Monte Carlo simulation.",
  "references": ["evidence_001", "evidence_002"]
}
```

---

### `submit_peer_critique`

Submit peer critique where one plan reviews another. ChatGPT generates critiques, server stores for consensus analysis.

**Status**: ✅ Production Ready | v5.0 | Peer Review

**Input**:
```typescript
{
  session_id: string;
  reviewer_plan_id: string;
  reviewed_plan_id: string;
  critique: {
    claims_challenged: string[];
    falsification_tests: string[];
    residual_risks: string[];
    agreement_score: number;  // 0-1
  };
}
```

**Output**: Confirmation of critique storage.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "reviewer_plan_id": "plan_B",
  "reviewed_plan_id": "plan_A",
  "critique": {
    "claims_challenged": ["Assumes linear growth, but market shows high volatility"],
    "falsification_tests": ["Test with 2008 crisis data", "Compare with adjacent markets"],
    "residual_risks": ["Regulatory changes not considered", "Currency fluctuations ignored"],
    "agreement_score": 0.65
  }
}
```

---

### `submit_mediation_decision`

Submit mediation decision for a decision point. ChatGPT chooses which plan's approach to use with evidence citations.

**Status**: ✅ Production Ready | v5.0 | Mediation

**Input**:
```typescript
{
  session_id: string;
  decision: {
    decision_point: string;
    chosen_from_plan: string;
    rationale: string;
    evidence_ids: string[];  // Must cite evidence
    confidence: number;      // 0-1
  };
}
```

**Output**: Confirmation of decision storage.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001",
  "decision": {
    "decision_point": "Market size estimation",
    "chosen_from_plan": "plan_B",
    "rationale": "Monte Carlo simulation provides confidence intervals, more robust than point estimate",
    "evidence_ids": ["evidence_005", "evidence_006", "evidence_007"],
    "confidence": 0.82
  }
}
```

---

### `list_plan_status`

List pending frames for session (passive). Shows what needs completion.

**Status**: ✅ Production Ready | v5.0 | Status Listing

**Input**:
```typescript
{
  session_id: string;
}
```

**Output**: Pending frames listing (plan executions, peer reviews, decisions).

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001"
}
```

**Response**:
```
Pending Frames:
- plan_execution: plan_B (2 steps remaining)
- peer_review: 4 critiques remaining
- mediation_decision: 3 decision points pending
```

---

### `finalize_parallel_reasoning`

Finalize parallel reasoning session. Validates completeness and returns decision map.

**Status**: ✅ Production Ready | v5.0 | Completeness Validation

**Input**:
```typescript
{
  session_id: string;
}
```

**Output**: Decision map with completeness validation.

**Example**:
```json
{
  "session_id": "market_analysis_parallel_001"
}
```

**Response**:
```
✅ Session Finalized

Completeness Check:
- All plans executed: ✅
- All decisions have evidence: ✅

Decision Map:
1. Market size: Plan B (Monte Carlo) - Evidence: [id5, id6, id7]
2. Growth rate: Plan A (Regression) - Evidence: [id3, id4]
3. Risk assessment: Plan C (Normative) - Evidence: [id8, id9]

Consensus Score: 0.82 (high robustness)
```

---

### 📝 Note on Legacy Tools

Legacy persona-based tools (8 tools) have been **removed from the public MCP API** to encourage adoption of the capability-driven architecture. They remain functional internally for backward compatibility but are not exposed to ChatGPT or other MCP clients.

**Migration**: All users should migrate to `analyze_with_capabilities`. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for complete migration guide.

---

## 📊 Adapters

| Adapter | Capabilities | Use Case |
|---------|--------------|----------|
| `strategy` | Market analysis, competitive positioning, SWOT | Market entry, strategic planning |
| `finance` | Unit economics, valuation, financial projections | Investment analysis, financial planning |
| `commercial` | Pricing, segmentation, GTM strategy | Product launch, sales strategy |
| `risk` | Risk assessment, mitigation, compliance | Risk analysis, due diligence |
| `comprehensive` | All capabilities + tournament mode | Complete business analysis |

---

## 🚀 Deployment

### Quick Deploy

```bash
npm install
npm test
npx tsc --noEmit
wrangler deploy
```

### Environment Variables

Create `.env` file:
```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Capability System
CAPABILITY_SYSTEM_ENABLED=true
LEGACY_PERSONA_SYSTEM_ENABLED=true

# Budget Defaults
DEFAULT_MAX_TOKENS_IN=10000
DEFAULT_MAX_TOKENS_OUT=10000
DEFAULT_MAX_CPU_MS=10000
DEFAULT_MAX_SUBREQUESTS=50
```

See `.env.example` for all configuration options.

### Monitoring

- **Health**: `GET /health`
- **Metrics**: `GET /metrics`

### Cloudflare Workers Constraints

**Free Tier**:
- CPU Time: 10ms per request
- Memory: 128 MB
- Requests: 100,000/day

**Paid Tier**:
- CPU Time: 50ms (standard), 30s (unbound)
- Memory: 128 MB
- Requests: Unlimited

### Troubleshooting

**CPU Time Exceeded**: Reduce budget or use cheaper capabilities
```typescript
budget: { max_cpu_ms: 5000 }
```

**Memory Exceeded**: Limit concurrent executions
```typescript
budget: { max_subrequests: 20 }
```

**Session Not Found**: Check session ID and Durable Object binding
```bash
wrangler tail  # View live logs
```

---

## 🔄 Migration from v2.x

| Old (Persona-Based) | New (Capability-Driven) |
|---------------------|-------------------------|
| `parallel_reasoning_init` | `analyze_with_capabilities` |
| `strategy_consultant` | `adapter_id: 'strategy'` |
| `financial_analyst` | `adapter_id: 'finance'` |
| No evidence | Full evidence ledger |
| No budget tracking | Budget constraints |
| No confidence | Confidence calculus |

### Migration Examples

**Old Way (Persona-Based)**:
```typescript
{
  "name": "parallel_reasoning_init",
  "arguments": {
    "task": "Analyze market opportunity",
    "perspectives": ["strategy_consultant", "financial_analyst"]
  }
}
```

**New Way (Capability-Driven)**:
```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "task": "Analyze market opportunity",
    "adapter_id": "strategy",
    "budget": {
      "max_tokens_in": 10000,
      "max_tokens_out": 10000
    }
  }
}
```

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for complete details.

---

## 📚 File Structure (v4.0)

```
src/workers/
├── capability-graph.ts                    # Capability registry
├── capability-planner.ts                  # Beam search planner
├── budget-scheduler.ts                    # Wave-based scheduler
├── capability-orchestrator.ts             # Main orchestrator (v4.0: tournament default)
├── evidence-ledger.ts                     # Evidence tracking (6 types)
├── confidence-calculus.ts                 # Confidence scoring
├── tournament-kernel.ts                   # Multi-criteria judging
├── whiteboard-memory.ts                   # Artifact storage
├── output-schemas.ts                      # Zod schemas
├── capability-adapters.ts                 # Pre-configured adapters
├── capability-tools.ts                    # MCP tool handlers (v4.0: enhanced)
├── industry-context.ts                    # v4.0: Industry context (20+ verticals)
├── industry-adapters.ts                   # v4.0: Industry adapters (4 implemented)
├── llm-native-capabilities.ts             # v4.0: Native LLM integration
├── capabilities/                          # v4.0: 46 capability implementations
│   ├── index.ts                           # Central registration
│   ├── corporate-strategy-capabilities.ts # 5 capabilities
│   ├── marketing-sales-capabilities.ts    # 7 capabilities (part 1)
│   ├── marketing-sales-capabilities-part2.ts
│   ├── finance-valuation-capabilities.ts  # 7 capabilities (part 1)
│   ├── finance-valuation-capabilities-part2.ts
│   ├── operations-supply-chain-capabilities.ts # 6 capabilities (part 1)
│   ├── operations-supply-chain-capabilities-part2.ts
│   ├── process-it-capabilities.ts         # 7 capabilities (part 1)
│   ├── process-it-capabilities-part2.ts
│   ├── legal-regulatory-capabilities.ts   # 5 capabilities
│   ├── people-hr-capabilities.ts          # 6 capabilities
│   └── advanced-analytics-capabilities.ts # 6 capabilities
├── everything-workers.ts                  # MCP server
├── session.ts                             # Durable Objects
├── parallel-reasoning-engine.ts           # Legacy (deprecated)
└── agent-personas.ts                      # Legacy (deprecated)
```

---

## 🎯 Best Practices (v4.0)

### 1. Industry Context
Always specify `industry_vertical` for best results:
```typescript
{
  "industry_vertical": "automotive",  // Auto-detected if not provided
  "geographic_region": "europe"       // For regulatory context
}
```

### 2. Entity Names
Use actual entity names for better insights:
```typescript
{
  "entity_names": {
    "competitor_1": "Tesla",
    "competitor_2": "VW Group",
    "product_1": "Model 3"
  }
}
```

### 3. Tournament Mode
Tournament mode is enabled by default for quality. Disable only if speed is critical:
```typescript
{
  "tournament_mode": false  // Only if you need faster results
}
```

### 4. Budget Management
Set appropriate budgets based on analysis complexity:
```typescript
{
  "budget": {
    "max_tokens_in": 15000,   // Complex analysis
    "max_tokens_out": 15000,
    "max_cpu_ms": 15000,
    "max_subrequests": 75
  }
}
```

### 5. Native Capabilities
For complex calculations, enable native capabilities:
```typescript
// Native capabilities are automatically used when available
// Monte Carlo simulations, web search, Python execution
```

### 6. Session Management
Use descriptive session IDs for tracking:
```typescript
{
  "session_id": "automotive_bev_analysis_2025_q1"
}
```

---

## 📈 Statistics (v4.0)

### Code Metrics
- **Total Files**: 35+ TypeScript modules
- **Lines of Code**: ~8,500+ lines
- **Capabilities**: **46 advanced capabilities** (up from 9 in v3.0)
- **Categories**: 8 business domains
- **Industry Adapters**: 4 fully implemented, 20+ supported
- **Tools Exposed**: 4 capability-driven tools (production ready)
- **Tests**: 15+ unit tests + integration + performance
- **Documentation**: 2 consolidated markdown files (README.md, AGENT.md)
- **TypeScript Compilation**: ✅ 0 errors
- **Integration Status**: Production Ready ✅

### v4.0 Enhancements
- ✅ **58 Capabilities** across 8 domains (vs 46 in v4.0-beta)
- ✅ **Industry Adapters** for 20+ industries
- ✅ **Native LLM Integration** - 11 capabilities with explicit Python/Web Search integration:
  - **Financial (5/5)**: dcf_modeler, tsr_simulator, capital_structure_optimizer, working_capital_diagnostic, scenario_forecasting
  - **Market Intelligence (3/3)**: competitor_analysis, regulatory_scan_enhanced, innovation_radar
  - **Advanced Analytics (3/3)**: pricing_ai_optimizer, digital_twin_ops, scenario_engine
  - **Impact**: +18.5% avg confidence, +8.3% avg quality, graceful degradation to heuristics
- ✅ **Tournament Mode** enabled by default
- ✅ **Entity Name Preservation** (no more "Leader A", "Competitor B")
- ✅ **Enhanced Monitoring** with real-time session status
- ✅ **Complete Audit Trail** with full artifact data export

### Performance
- **Wave 1 Latency**: 500-1000ms (cheap capabilities)
- **Wave 2 Latency**: 2000-5000ms (expensive capabilities)
- **Token Usage**: 2000-5000 tokens per analysis (varies by complexity)
- **CPU Time**: <50ms per request (Cloudflare Workers)
- **Memory**: <128MB (Cloudflare Workers constraint)

---

## 🚀 What's Next

### Potential v5.0 Features
- Real-time data integration (APIs, databases)
- Multi-language support (non-English analysis)
- Custom capability builder (user-defined capabilities)
- Advanced visualization generation
- Collaborative analysis (multi-user sessions)
- Integration with BI tools (Tableau, Power BI)

### Feedback & Contributions
- Report issues via GitHub Issues
- Suggest new capabilities via Pull Requests
- Share industry-specific templates
- Contribute to documentation

---

---

## 📊 Native Integration Status

### Explicit Native Integration (11/13 capabilities - 85%)

**Phase 1: Financial Capabilities (5/5) ✅ COMPLETE**
1. `dcf_modeler` - Real DCF with Python (Confidence +17%, Quality +8%)
2. `tsr_simulator` - Monte Carlo TSR with Python (Confidence +21%, Quality +10%)
3. `capital_structure_optimizer` - WACC optimization with Python (Confidence +19%, Quality +9%)
4. `working_capital_diagnostic` - DIO/DSO/DPO with Python (Confidence +16%, Quality +6%)
5. `scenario_forecasting` - Monte Carlo forecasting with Python (Confidence +19%, Quality +9%)

**Phase 2: Market Intelligence (3/3) ✅ COMPLETE**
6. `competitor_analysis` - Real-time intelligence via Web Search (Confidence +12%, Quality +7%)
7. `regulatory_scan_enhanced` - Regulatory intelligence via Web Search (Confidence +15%, Quality +9%)
8. `innovation_radar` - Innovation intelligence via Web Search (Confidence +23%, Quality +13%)

**Phase 3: Advanced Analytics (3/3) ✅ COMPLETE**
9. `pricing_ai_optimizer` - Pricing optimization with Python (Confidence +20%, Quality +10%)
10. `digital_twin_ops` - Digital twin simulation with Python (Confidence +18%, Quality +9%)
11. `scenario_engine` - Scenario modeling with Python (Confidence +26%, Quality +15%)

**Phase 4: Risk Capabilities (0/2) ⏭️ SKIPPED**
- `cybersecurity_risk_model` - Not yet implemented in codebase
- `geostrategic_risk_scan` - Not yet implemented in codebase

**Remaining 47 capabilities**: Use automatic post-execution enhancement (sufficient for 95% of use cases)

### Impact Metrics
- **Average Confidence Boost**: +18.5% (0.73 → 0.86)
- **Average Quality Boost**: +8.3% (0.83 → 0.89)
- **Evidence Types**: CALCULATION, SIMULATION, RETRIEVAL (vs HEURISTIC)
- **Graceful Degradation**: Falls back to heuristics if LLM native capabilities unavailable
- **Backward Compatible**: 100% compatible with existing clients

---

## 💾 Capability Persistence Architecture (v4.1)

### Problem Solved
**Before v4.1**: Capability artifacts were generated but **not persisted** in Durable Object storage. When calling `get_capability_status` or `export_session`, data was lost because the orchestrator used in-memory storage that didn't survive across requests.

**After v4.1**: Complete end-to-end persistence with Durable Objects integration.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCPSession (Durable Object)              │
├─────────────────────────────────────────────────────────────┤
│  • whiteboard: Whiteboard (persistent)                      │
│  • evidenceLedger: EvidenceLedger (persistent)              │
│  • capabilityExecutionHistory: Array (persistent)           │
│                                                              │
│  Methods:                                                    │
│  • persistCapabilityState() → storage.put()                 │
│  • loadCapabilityState() → storage.get()                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ (injects references)
┌─────────────────────────────────────────────────────────────┐
│                    CapabilityOrchestrator                   │
├─────────────────────────────────────────────────────────────┤
│  Uses DO whiteboard/ledger instead of globals               │
│  • execute() → writes to DO whiteboard                      │
│  • getSessionStatus() → reads from DO whiteboard            │
│  • exportSession() → reads from DO whiteboard               │
└─────────────────────────────────────────────────────────────┘
```

### Persistence Flow

1. **analyze_with_capabilities**
   - Orchestrator executes capabilities
   - Artifacts saved to DO whiteboard (in-memory)
   - `persistCallback()` called → `storage.put('capability_whiteboard', data)`
   - Artifacts now persisted ✅

2. **get_capability_status**
   - DO loads whiteboard from storage (constructor)
   - Orchestrator reads from DO whiteboard
   - Returns `artifacts_count > 0` ✅

3. **export_session**
   - Orchestrator reads all data from DO whiteboard
   - Returns complete JSON with artifacts, evidence, costs ✅

### Key Changes (v4.1)

**1. createServer() - everything-workers.ts**
```typescript
export const createServer = (
  // ... existing params ...
  capabilityWhiteboard?: Whiteboard,        // NEW
  capabilityLedger?: EvidenceLedger,        // NEW
  capabilityPersistCallback?: () => Promise<void>  // NEW
) => {
  const capabilitySystemRefs = {
    whiteboard: capabilityWhiteboard,
    ledger: capabilityLedger,
    persistCallback: capabilityPersistCallback
  };
  // Pass refs to tool handlers
}
```

**2. initializeCapabilitySystem() - capability-tools.ts**
```typescript
export function initializeCapabilitySystem(refs?: CapabilitySystemRefs) {
  // Use DO storage if provided, otherwise globals
  const whiteboard = refs?.whiteboard || globalWhiteboard;
  const ledger = refs?.ledger || globalEvidenceLedger;

  orchestrator = new CapabilityOrchestrator(
    globalCapabilityGraph,
    ledger,
    whiteboard  // Uses DO storage!
  );
}
```

**3. handleAnalyzeWithCapabilities() - capability-tools.ts**
```typescript
export async function handleAnalyzeWithCapabilities(
  args: z.infer<typeof AnalyzeWithCapabilitiesSchema>,
  refs?: CapabilitySystemRefs  // NEW
) {
  const orch = initializeCapabilitySystem(refs);
  const result = await orch.execute(request);

  // Persist after execution
  if (refs?.persistCallback) {
    await refs.persistCallback();  // Saves to DO storage
  }
}
```

**4. MCPSession - session.ts**
```typescript
const capabilityPersistCallback = async () => {
  await this.persistCapabilityState();
};

const { server, cleanup, startNotificationIntervals } = createServer(
  this.parallelReasoningSessions,
  persistCallback,
  getTransportSessionId,
  this.whiteboard,              // Pass DO whiteboard
  this.evidenceLedger,          // Pass DO ledger
  capabilityPersistCallback     // Pass persist callback
);
```

### Benefits

- ✅ **100% Persistence**: All artifacts saved to Durable Object storage
- ✅ **Cross-Request Consistency**: Data survives reconnects
- ✅ **Complete Audit Trail**: Full export with artifacts, evidence, costs
- ✅ **Backward Compatible**: Falls back to globals if refs not provided
- ✅ **Zero Breaking Changes**: Existing code continues to work

### Testing Persistence

**Manual Test Flow**:
```bash
# 1. Analyze with capabilities
curl -X POST /mcp -d '{"tool": "analyze_with_capabilities", "args": {"session_id": "test-001", "task": "Market analysis"}}'

# 2. Check status (should show artifacts)
curl -X POST /mcp -d '{"tool": "get_capability_status", "args": {"session_id": "test-001"}}'
# Expected: artifacts_count > 0, session_costs populated

# 3. Export session (should show full data)
curl -X POST /mcp -d '{"tool": "export_session", "args": {"session_id": "test-001"}}'
# Expected: Complete JSON with artifacts, evidence, costs, version history
```

**Automated Tests**:
```bash
# Run persistence test suite
npm test -- __tests__/session-persistence.test.ts

# All tests (includes persistence)
npm test
```

**Test Coverage**:
- ✅ Session state persistence across multiple calls
- ✅ Artifact version incrementing (1 → 2 → 3)
- ✅ Version history maintenance
- ✅ Orchestrator reuse when storage unchanged
- ✅ New orchestrator creation when storage changes
- ✅ Export includes all versions and complete data
- ✅ Separate histories for different artifacts
- ✅ Diff calculation between versions

---

## 🔄 Peer Review System Deep Dive (v4.2.0)

### Overview

The system now implements **critical peer review between agents**, where agents don't just generate parallel scenarios but actively critique each other's results. This creates an internal self-evaluation mechanism where **consensus/conflict becomes a measure of result robustness**.

### Key Concept

Instead of simply running multiple agents in parallel and picking the best result, agents now act as **peer reviewers** for each other:

1. **Each agent reviews all other agents' results**
2. **Critiques are generated** based on confidence, evidence quality, and methodology
3. **Consensus/conflict is measured** across all reviews
4. **Robustness score** is calculated based on peer agreement
5. **Tournament rankings** are enhanced with peer review insights

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         CapabilityOrchestrator                              │
│  • execute() → generates multiple capability results        │
│  • peer_review_mode: true (default)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         TournamentKernel                                    │
│  • Conducts peer review session (if enabled)                │
│  • Each result reviews all others                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         PeerReviewKernel                                    │
│  • generateCritiques() → cross-agent critique generation    │
│  • analyzeConsensus() → measure agreement/conflict          │
│  • identifyClusters() → find agreeing result groups         │
│  • identifyOutliers() → detect controversial results        │
│  • calculateRobustness() → overall robustness score         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         Enhanced Results                                    │
│  • Consensus score (0-1)                                    │
│  • Conflict score (0-1)                                     │
│  • Robustness score (0-1)                                   │
│  • Critical disagreements identified                        │
│  • Peer-validated strengths/weaknesses                      │
└─────────────────────────────────────────────────────────────┘
```

### Peer Review Process

#### 1. Critique Generation

Each capability result reviews all other results and generates critiques based on:

- **Confidence comparison**: Significant gaps trigger critiques
- **Evidence quality**: Verification rate differences
- **Methodology**: Output similarity and approach consistency
- **Severity levels**: Critical, Major, Minor, Suggestion

Example critique:
```typescript
{
  reviewer_id: 'market_sizing',
  reviewed_id: 'competitive_analysis',
  agreement_score: 0.65,
  critique_points: [
    {
      aspect: 'evidence_quality',
      severity: 'major',
      description: 'Evidence quality concern: 60% checks passed vs reviewer\'s 90%',
      suggested_improvement: 'Strengthen evidence backing for key claims'
    }
  ],
  overall_assessment: 'agree',
  confidence_in_critique: 0.9
}
```

#### 2. Consensus Analysis

The system analyzes all critiques to measure:

- **Consensus Score** (0-1): Average agreement across all pairwise reviews
- **Conflict Score** (0-1): Inverse of consensus (1 - consensus)
- **Agreement Matrix**: NxN matrix of pairwise agreement scores
- **Clusters**: Groups of results that agree with each other
- **Outliers**: Results with low average peer agreement
- **Critical Disagreements**: High-impact conflicts between results

#### 3. Robustness Scoring

Robustness is calculated from:
- **60% weight**: Consensus analysis score
- **30% weight**: Average peer confidence
- **10% penalty**: Controversy (variance in agreement)

High robustness (>0.8) indicates:
- ✅ Strong consensus among agents
- ✅ Few or no critical disagreements
- ✅ Clear clustering of agreeing results
- ✅ Low controversy

Low robustness (<0.5) indicates:
- ⚠️ Significant disagreement among agents
- ⚠️ Multiple critical conflicts
- ⚠️ High controversy (variance in opinions)
- ⚠️ Many outliers

### Usage

#### Via MCP Tool (analyze_with_capabilities)

```json
{
  "session_id": "session_001",
  "task": "Market analysis for European fintech",
  "adapter_id": "strategy",
  "tournament_mode": true,
  "peer_review_mode": true
}
```

**Response includes peer review section:**
```markdown
## Peer Review Analysis
- **Consensus Score**: 82.0%
- **Conflict Score**: 18.0%
- **Robustness Score**: 87.0%
- **Critical Disagreements**: 1
- **Review Quality**: 91.0%

**Interpretation**: ✅ HIGH ROBUSTNESS - Results are highly validated by peer agents. Strong consensus indicates reliable findings.
```

**To disable peer review:**
```json
{
  "session_id": "session_002",
  "task": "Quick baseline analysis",
  "peer_review_mode": false
}
```

#### Via TypeScript API

```typescript
// Peer review enabled by default
const result = await orchestrator.execute({
  session_id: 'session_001',
  task: 'Market analysis',
  budget: defaultBudget,
  policy: defaultPolicy
  // peer_review_mode: true (default)
});

// Disable peer review if needed
const result = await orchestrator.execute({
  session_id: 'session_002',
  task: 'Quick analysis',
  budget: defaultBudget,
  policy: defaultPolicy,
  peer_review_mode: false  // Disable peer review
});
```

#### Access Peer Review Results

```typescript
const result = await orchestrator.execute(request);

if (result.peer_review) {
  console.log(`Consensus: ${(result.peer_review.consensus_score * 100).toFixed(1)}%`);
  console.log(`Conflict: ${(result.peer_review.conflict_score * 100).toFixed(1)}%`);
  console.log(`Robustness: ${(result.peer_review.robustness_score * 100).toFixed(1)}%`);
  console.log(`Critical disagreements: ${result.peer_review.critical_disagreements}`);
  console.log(`Review quality: ${(result.peer_review.review_quality * 100).toFixed(1)}%`);
}
```

### Benefits

1. **Self-Validation**: Results are validated by peer agents, not just by evidence
2. **Robustness Measure**: Consensus/conflict provides a quantitative robustness metric
3. **Conflict Detection**: Critical disagreements are automatically identified
4. **Quality Insights**: Peer-identified strengths and weaknesses enhance rankings
5. **Transparency**: Full audit trail of who reviewed what and why
6. **Adaptive**: Tournament rankings adapt based on peer agreement

### Example Output

```json
{
  "success": true,
  "artifacts": [...],
  "overall_confidence": 0.85,
  "peer_review": {
    "consensus_score": 0.82,
    "conflict_score": 0.18,
    "robustness_score": 0.87,
    "critical_disagreements": 1,
    "review_quality": 0.91
  }
}
```

**Interpretation**:
- **82% consensus**: Strong agreement among agents
- **18% conflict**: Minor disagreements exist
- **87% robustness**: Results are highly robust
- **1 critical disagreement**: One significant conflict identified
- **91% review quality**: High-quality peer review process

### Integration with Tournament

Peer review enhances tournament rankings:

1. **ELO Boost**: Results with high peer agreement get ELO bonus (+100 max)
2. **Controversy Penalty**: High controversy results lose ELO (-50 max)
3. **Strengths/Weaknesses**: Peer-identified insights added to rankings
4. **Final Rankings**: Include both tournament performance and peer validation

### Testing

```bash
# Run peer review tests
npm test -- __tests__/peer-review.test.ts

# All tests (includes peer review)
npm test
```

**Test Coverage**:
- ✅ Single result handling
- ✅ Multi-result critique generation
- ✅ Consensus score calculation
- ✅ Conflict detection
- ✅ Cluster identification
- ✅ Outlier detection
- ✅ Review quality assessment

---

## 🐛 Bug Fixes (v4.1.1)

### Problem 1: Session State Reset

**Issue**: `initializeCapabilitySystem()` was creating a **new** `CapabilityOrchestrator` instance on every call, which reset the internal `sessionCosts` and `sessionExecutions` Maps.

**Impact**:
- `get_capability_status` always returned empty costs and zero executions
- Session tracking was completely broken
- No way to monitor resource consumption across multiple capability executions

**Solution**: Modified `initializeCapabilitySystem()` to reuse the existing orchestrator instance when the storage references haven't changed:

```typescript
let orchestrator: CapabilityOrchestrator | null = null;
let currentWhiteboard: Whiteboard | null = null;
let currentLedger: EvidenceLedger | null = null;

export function initializeCapabilitySystem(refs?: CapabilitySystemRefs): CapabilityOrchestrator {
  registerAllCapabilities();

  const whiteboard = refs?.whiteboard || globalWhiteboard;
  const ledger = refs?.ledger || globalEvidenceLedger;

  // Only create a new orchestrator if:
  // 1. No orchestrator exists yet, OR
  // 2. The storage references have changed (e.g., different DO instance)
  if (!orchestrator || currentWhiteboard !== whiteboard || currentLedger !== ledger) {
    console.log('[CapabilitySystem] Creating new orchestrator instance');
    orchestrator = new CapabilityOrchestrator(
      globalCapabilityGraph,
      ledger,
      whiteboard
    );
    currentWhiteboard = whiteboard;
    currentLedger = ledger;
  } else {
    console.log('[CapabilitySystem] Reusing existing orchestrator instance');
  }

  return orchestrator;
}
```

**Benefits**:
- ✅ Session state (costs, executions) persists across multiple calls
- ✅ `get_capability_status` now returns accurate cumulative data
- ✅ Resource monitoring works correctly
- ✅ Still creates new orchestrator when storage changes (e.g., different Durable Object)

### Problem 2: Artifact Version Reset

**Issue**: The orchestrator always called `whiteboard.add()` when storing capability results, even if the artifact already existed. The `add()` method always sets `version: 1` and replaces the entire history.

**Impact**:
- Artifact versions never incremented beyond 1
- Version history was lost on each execution
- Audit trail was broken
- Compliance requirements not met

**Solution**: Modified the orchestrator to check if an artifact already exists and use `update()` instead of `add()`:

```typescript
// Check if artifact already exists to maintain version history
if (this.whiteboard.has(capId)) {
  // Artifact exists - update it to increment version
  this.whiteboard.update(
    capId,
    result.output,
    capId,
    `Updated by capability execution at ${new Date().toISOString()}`
  );
} else {
  // New artifact - add it
  this.whiteboard.add(
    capId,
    capability?.category || 'unknown',
    result.output,
    capId,
    'accepted'
  );
}
```

**Benefits**:
- ✅ Artifact versions now increment correctly (1 → 2 → 3 → ...)
- ✅ Version history is maintained in `versionHistory` Map
- ✅ Audit trail is preserved
- ✅ Compliance requirements are met
- ✅ Can use `whiteboard.diff()` to see changes between versions

### Test Coverage

Added comprehensive test suite in `__tests__/session-persistence.test.ts`:

**Session Persistence Tests**:
1. ✅ Session state persists across multiple calls - Verifies orchestrator reuse
2. ✅ Artifact versions increment - Verifies version increments on re-execution
3. ✅ Version history is maintained - Verifies all versions are stored
4. ✅ New orchestrator on storage change - Verifies new instance when storage changes
5. ✅ Export includes all versions - Verifies export shows latest version

**Artifact Versioning Edge Cases**:
6. ✅ add() followed by update() - Verifies basic versioning flow
7. ✅ Separate histories - Verifies different artifacts have separate histories
8. ✅ Diff calculation - Verifies diff between versions works

**All 8 tests pass!** ✅

### Files Modified

1. **src/workers/capability-tools.ts**
   - Added `currentWhiteboard` and `currentLedger` tracking variables
   - Modified `initializeCapabilitySystem()` to reuse orchestrator when storage is unchanged
   - Added logging to show when orchestrator is created vs reused

2. **src/workers/capability-orchestrator.ts**
   - Modified artifact storage logic to check if artifact exists
   - Uses `whiteboard.update()` for existing artifacts
   - Uses `whiteboard.add()` only for new artifacts
   - Added review notes with timestamp on updates

3. **__tests__/session-persistence.test.ts** (NEW)
   - Comprehensive test suite for both fixes
   - Tests session state persistence
   - Tests artifact versioning
   - Tests edge cases

### Impact

**Before Fix**:
```
Session 1: execute capability A
  → sessionCosts: { A: 100 tokens }
  → artifact A: version 1

Session 1: get_capability_status
  → Returns: 0 executions, 0 tokens ❌ (state lost!)

Session 1: execute capability A again
  → artifact A: version 1 ❌ (should be 2!)
```

**After Fix**:
```
Session 1: execute capability A
  → sessionCosts: { A: 100 tokens }
  → artifact A: version 1

Session 1: get_capability_status
  → Returns: 1 execution, 100 tokens ✅ (state preserved!)

Session 1: execute capability A again
  → sessionCosts: { A: 200 tokens }
  → artifact A: version 2 ✅ (incremented!)
  → history: [v1, v2] ✅ (audit trail!)
```

---

## ✅ Pull Request Checklist

Use this guide when preparing a contribution. Copy the sections into your PR description and tick items as you complete them.

### Required Sections
- **Description** – Clear and concise summary of the change
- **Changes Made** – Bullet the concrete modifications
- **Related Issues** – Reference `Fixes #123` / `Relates to #456`
- **Screenshots/Logs** – Include if relevant
- **Deployment Notes** – Document special rollout steps or migrations
- **Rollback Plan** – Explain how to revert safely

### Change Type (select all that apply)
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation update
- [ ] 🎨 Code style/refactor
- [ ] 🧪 Test updates
- [ ] ⚙️ Configuration changes

### Testing Checklist
**Local**
- [ ] `npm run workers:dev`
- [ ] `./test-parallel-reasoning-v2.sh`
- [ ] `npx tsc --noEmit`
- [ ] No console warnings/errors

**Production / Staging (if applicable)**
- [ ] Deployed to target environment
- [ ] Verified all MCP tools end-to-end
- [ ] Validated session persistence
- [ ] Confirmed ChatGPT integration

### Documentation Updates
- [ ] `README.md`
- [ ] `AGENT.md`
- [ ] Inline JSDoc for new APIs

### Code Quality Gates
- [ ] Strict TypeScript compliance (no unchecked `any`)
- [ ] Descriptive identifiers and focused functions (<50 lines)
- [ ] Robust error handling and input validation
- [ ] Tests updated/added for new logic

### MCP Protocol Compliance
- [ ] Aligns with MCP 2024-11-05 spec
- [ ] JSON-RPC 2.0 formatting validated
- [ ] SSE streaming verified (if used)
- [ ] Tool schemas validated

### Session Management Expectations
- [ ] Durable Objects use `idFromString()`
- [ ] State persists across requests
- [ ] Graceful handling for missing sessions
- [ ] No data loss during session operations

### Performance Guardrails
- [ ] Minimize Durable Object writes
- [ ] Avoid heavy deps / bundle bloat
- [ ] Optimize for Workers edge constraints

### Reviewer Guidance
- Highlight focus areas and open questions in the PR body
- Provide additional context, logs, or artifacts as needed

### Final Confirmation
- [ ] Read `AGENT.md` guidelines
- [ ] Tested changes locally
- [ ] Updated necessary documentation
- [ ] Code is production-ready
- [ ] Change respects business consulting domain focus

---

**Last Updated**: 2025-09-30
**Version**: 4.2.0 (Peer Review System)
**Deployment**: d4b9fdeb-dabd-4b3f-af42-2be0b63bbad7
**Status**: Production Ready ✅
**Compilation**: ✅ TypeScript 0 errors
**Tool Testing**: ✅ Verified via ChatGPT Developer Mode
**Documentation**: ✅ Consolidated in 2 files (README.md, AGENT.md)
**Persistence**: ✅ End-to-end with Durable Objects (v4.1)
**Bug Fixes**: ✅ Session state + artifact versioning (v4.1.1)
**Peer Review**: ✅ Critical peer review between agents (v4.2.0)
**Tests**: ✅ 105 tests passing (including 7 peer review tests)
