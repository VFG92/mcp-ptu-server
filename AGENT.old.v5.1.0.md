# 🤖 MCP PTU Server - Technical Documentation

**Version 5.1.0** | For AI Agents & Developers

---

## 📋 Quick Reference

**Platform**: Cloudflare Workers + Durable Objects
**Language**: TypeScript (Strict Mode)
**Protocol**: Model Context Protocol (MCP) 2024-11-05
**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`
**Tests**: 162/162 passing
**Build**: ✅ 0 TypeScript errors

**Architecture**: LLM-Centric Parallel Reasoning
- **ChatGPT**: Sole deliberative agent (generates plans, executes, reviews, mediates)
- **MCP Server**: Guardrails only (validates diversity ≥2 axes, completeness)
- **Capabilities**: 58 execution units (8-32 per plan, scale based on decision tree depth)
- **Workflow**: End-to-end orchestration by ChatGPT with external constraints

---

## 🏗️ Architecture: LLM-Centric Design

### Core Principle

**ChatGPT is the sole deliberative agent.** MCP server provides only:
1. **Guardrails**: Validates diversity (≥2 axes), completeness (evidence citations)
2. **Persistent Memory**: Stores plans, results, notes, critiques across requests
3. **Typed Contracts**: Defines required fields, no computation

**ChatGPT orchestrates:**
- Generates diverse reasoning plans internally
- Executes capabilities through each plan's lens
- Cross-contaminates insights between plans
- Peer reviews from multiple perspectives
- Mediates final decisions with evidence

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│ ChatGPT (Sole Deliberative Agent)                           │
│ - Generates diverse reasoning plans                         │
│ - Executes plans in parallel (internally)                   │
│ - Cross-contaminates insights                               │
│ - Peer reviews between plans                                │
│ - Mediates final decisions                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Tool Calls
┌────────────────────▼────────────────────────────────────────┐
│ Cloudflare Worker (index.ts)                                │
│ - Routes by session_id to Durable Object                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Durable Object (session.ts)                                 │
│ - One instance per session_id                               │
│ - Persists parallel reasoning state                         │
│ - Serializes/deserializes nested Maps                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ MCP Server (everything-workers.ts)                          │
│ - Exposes 8 parallel reasoning tools                        │
│ - Validates diversity (≥2 axes difference)                  │
│ - Validates completeness (evidence IDs cited)               │
│ - NO computation, NO evaluation, NO planning                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Capability System (Internal, Not Exposed)                   │
│ - 58 capabilities invoked via execute_plan_step             │
│ - Evidence tracking, budget management                      │
│ - Tournament mode, peer review                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

**index.ts** - Worker entry point
- Routes requests by `session_id` (from body or header)
- Creates/retrieves Durable Object instances
- Handles CORS, health checks

**session.ts** - Durable Object
- One instance per `session_id`
- Manages MCP Server lifecycle
- Persists state to DO storage
- **Critical**: Serializes nested Maps (`plans`, `plan_results`) to arrays before storage

**everything-workers.ts** - MCP Server
- **Exposes**: 8 parallel reasoning tools (multi-path only)
- **Internal**: 58 capabilities (invoked via `execute_plan_step`)
- **Validates**: Diversity (≥2 axes), completeness (evidence IDs)
- **Never**: Computes, evaluates, or plans

**parallel-reasoning-mcp.ts** - Session Manager
- Manages parallel reasoning sessions
- Validates diversity (≥2 axes difference)
- Stores plans, results, notes, critiques
- **Fixed in v5.0.3**: Proper Map serialization for Durable Objects

### Design Rationale

**Why LLM-centric?**
- Research shows quality improves when LLM explores multiple reasoning paths (Wang 2022, Yao 2023, Du 2023)
- MCP's role is "standardized connector" between models and systems (OpenAI 2025, modelcontextprotocol.io 2024)
- Function calling is the interface, but deliberation stays in the model (OpenAI 2025)

**Why diversity validation?**
- Prevents semantic drift (cosmetic variants don't improve quality)
- Forces real exploration of different hypotheses
- Server validates structure (≥2 axes), ChatGPT chooses substance

**Why contamination?**
- Multi-agent debate improves factuality (Du 2023)
- Cross-plan notes enable structured interaction
- Server stores for audit, ChatGPT decides what to share

**Why evidence-based mediation?**
- Self-consistency: marginalize over multiple coherent paths (Wang 2022)
- Server validates evidence IDs exist, ChatGPT chooses synthesis
- Audit trail for compliance and review

---

## 🌳 Decision Tree Coverage

### Maximizing Coverage with Parallel Plans

**Goal**: Each plan explores different branches of the decision tree, collectively covering all major decision points.

#### Decision Tree Depth → Capability Scaling

```
Simple Decision Tree (3-5 major decisions)
├─ Plan A: 8-12 capabilities
├─ Plan B: 8-12 capabilities
└─ Plan C: 8-12 capabilities
Total: 24-36 capability executions

Medium Decision Tree (6-10 major decisions)
├─ Plan A: 12-20 capabilities
├─ Plan B: 12-20 capabilities
├─ Plan C: 12-20 capabilities
└─ Plan D: 12-20 capabilities
Total: 48-80 capability executions

Complex Decision Tree (10+ major decisions)
├─ Plan A: 20-32 capabilities
├─ Plan B: 20-32 capabilities
├─ Plan C: 20-32 capabilities
├─ Plan D: 20-32 capabilities
└─ Plan E: 20-32 capabilities
Total: 100-160 capability executions
```

#### Coverage Strategy

**1. Identify Decision Branches**
```
Example: Market Entry Strategy
├─ Market Sizing
│   ├─ TAM/SAM/SOM (Plan A: regression)
│   ├─ Growth scenarios (Plan B: Monte Carlo)
│   └─ Addressable segments (Plan C: qualitative)
├─ Competitive Analysis
│   ├─ Market share (Plan A: quantitative)
│   ├─ Positioning (Plan B: perceptual map)
│   └─ Barriers to entry (Plan C: Porter's 5 forces)
├─ Go-to-Market
│   ├─ Channel strategy (Plan A: cost analysis)
│   ├─ Pricing (Plan B: elasticity model)
│   └─ Customer acquisition (Plan C: journey mapping)
└─ Financial Projections
    ├─ Revenue forecast (Plan A: regression)
    ├─ Risk-adjusted NPV (Plan B: Monte Carlo)
    └─ Scenario analysis (Plan C: stress testing)
```

**2. Assign Capabilities to Plans**
- Plan A covers quantitative branches (regression, cost analysis, revenue forecast)
- Plan B covers probabilistic branches (Monte Carlo, elasticity, risk-adjusted NPV)
- Plan C covers qualitative branches (segments, positioning, journey mapping)

**3. Ensure No Gaps**
- Every major decision has ≥1 plan covering it
- Critical decisions have ≥2 plans covering them (for validation)
- High-risk decisions have all plans covering them (for consensus)

#### Coverage Validation

**Server validates** (formal only):
- ✅ Each plan has 8-32 capabilities declared
- ✅ Plans differ on ≥2 diversity axes
- ✅ Evidence IDs cited in mediation exist

**ChatGPT ensures** (substantive):
- ✅ All decision branches covered by at least one plan
- ✅ Critical decisions covered by multiple plans
- ✅ No redundant capability executions (unless intentional for validation)
- ✅ Capability chains logically flow through decision tree

---

## 🔄 Workflow Orchestration

### End-to-End Orchestration Pattern

**⚠️ CRITICAL**: ChatGPT must use the **same session_id** for ALL tool calls in a workflow. If session_id changes between calls, the server creates a new Durable Object and returns "Session not found".

**Phase 1: Initialization**
```
ChatGPT → CALL init_parallel_reasoning with session_id "analysis_001"
Server → Validates structure, creates Durable Object with ID "analysis_001"
Server → Returns: "✅ Session Initialized" with session_id confirmation
ChatGPT → WAIT FOR RESPONSE. Record session_id for all subsequent calls.
```

**Phase 2: Plan Generation**
```
ChatGPT → Generates Plan A with diversity axes [X, Y, Z]
ChatGPT → CALL submit_reasoning_plan with session_id "analysis_001"
Server → Routes to Durable Object "analysis_001"
Server → Validates diversity (first plan, auto-accept)
Server → Returns: "✅ Plan Accepted"
ChatGPT → WAIT FOR RESPONSE.

ChatGPT → Generates Plan B with diversity axes [X, Y, W]
ChatGPT → CALL submit_reasoning_plan with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Validates diversity (differs from A on ≥2 axes? Yes → accept)
Server → Returns: "✅ Plan Accepted"
ChatGPT → WAIT FOR RESPONSE.

ChatGPT → Generates Plan C with diversity axes [X, Q, R]
ChatGPT → CALL submit_reasoning_plan with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Validates diversity (differs from A,B on ≥2 axes? Yes → accept)
Server → Returns: "✅ Plan Accepted"
ChatGPT → WAIT FOR RESPONSE.
```

**Phase 3: Execution (Parallel Internally)**
```
ChatGPT → Executes Plan A, step 1
ChatGPT → CALL execute_plan_step with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Invokes capability, records result
Server → Returns: Analysis result with evidence_001
ChatGPT → WAIT FOR RESPONSE. Record evidence_001.

ChatGPT → Executes Plan B, step 1
ChatGPT → CALL execute_plan_step with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Invokes capability, records result
Server → Returns: Analysis result with evidence_002
ChatGPT → WAIT FOR RESPONSE. Record evidence_002.

[Continue for all capabilities across all plans, always using session_id "analysis_001"]
```

**Phase 4: Contamination**
```
ChatGPT → Discovers insight in Plan A relevant to Plan B
ChatGPT → CALL submit_cross_plan_note with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Stores note for audit trail
Server → Returns: "✅ Cross-plan note recorded"
ChatGPT → WAIT FOR RESPONSE.

[Repeat for all cross-plan insights, always using session_id "analysis_001"]
```

**Phase 5: Peer Review**
```
ChatGPT → Plan A reviews Plan B
ChatGPT → CALL submit_peer_critique with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Stores critique
Server → Returns: "✅ Peer critique recorded"
ChatGPT → WAIT FOR RESPONSE.

[Repeat for all plan pairs, always using session_id "analysis_001"]
```

**Phase 6: Mediation**
```
ChatGPT → Decision point: "Market sizing approach"
ChatGPT → CALL submit_mediation_decision with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Validates evidence IDs exist
Server → Returns: "✅ Mediation decision recorded" or "❌ Evidence IDs not found"
ChatGPT → WAIT FOR RESPONSE.

[Repeat for all decision points, always using session_id "analysis_001"]
```

**Phase 7: Finalization**
```
ChatGPT → CALL finalize_parallel_reasoning with session_id "analysis_001" (⚠️ SAME ID)
Server → Routes to Durable Object "analysis_001"
Server → Validates completeness (all plans executed, all decisions have evidence)
Server → Returns: "✅ Session finalized" with decision map and audit trail
ChatGPT → WAIT FOR RESPONSE. Use the server's synthesized result.
```

### Constraints (External, Enforced by Server)

1. **Diversity Constraint**: Plans must differ on ≥2 axes
   - Server rejects plans that violate this
   - Prevents semantic drift

2. **Completeness Constraint**: Decisions must cite evidence IDs
   - Server validates evidence IDs exist
   - Ensures traceability

3. **Capability Range Constraint**: 8-32 capabilities per plan
   - Server validates range
   - Prevents under/over-specification

4. **Session Persistence**: State stored in Durable Objects
   - Server handles serialization/deserialization
   - Enables multi-step workflows across requests

---

## 🔧 API Reference

### Parallel Reasoning Tools (v5.0)

**Design Philosophy**: MCP provides guardrails and memory, ChatGPT provides intelligence.

- **Server validates**: Structure (required fields), diversity (≥2 axes), completeness (evidence IDs)
- **Server stores**: Plans, results, notes, critiques (persistent memory)
- **Server never**: Computes, evaluates, scores, or plans
- **ChatGPT generates**: Plans, insights, critiques, decisions

#### 1. init_parallel_reasoning

**Purpose**: Initialize session, declare diversity requirements.

**Server role**: Creates session, stores requirements, returns session ID.

**ChatGPT role**: Decides task, chooses diversity axes, sets min_plans.

```typescript
{
  session_id: string;                    // Required: Unique session ID
  task_description: string;              // Required: Task to analyze
  required_diversity_axes: string[];     // Required: 2+ axes from list below
  min_plans: number;                     // Required: 3-32 plans
}
```

**Diversity Axes**:
- `data_sources`: Official statistics vs industry reports vs expert interviews
- `analytical_models`: Regression vs Monte Carlo vs qualitative analysis
- `time_horizons`: 1-year vs 3-year vs 10-year outlook
- `quality_metrics`: Precision vs recall vs robustness vs speed
- `risk_perspectives`: Optimistic vs base case vs stress scenarios
- `stakeholder_views`: Customer vs investor vs regulator vs employee

#### 2. submit_reasoning_plan

**Purpose**: Submit a reasoning plan with diversity axes.

**Server role**:
- Validates plan differs by ≥2 axes from existing plans
- Rejects if diversity insufficient (prevents semantic drift)
- Stores plan if valid

**ChatGPT role**:
- Generates plan with real diversity (not cosmetic variants)
- Chooses capability chain (8-32 capabilities, scale based on task)
- Provides rationale for approach

```typescript
{
  session_id: string;
  plan: {
    plan_id: string;                     // Unique plan identifier
    description: string;                 // Plan description
    diversity_axes: string[];            // Must differ by ≥2 axes from existing plans
    capability_chain: string[];          // 8-32 capability IDs
    rationale: string;                   // Why this approach
    expected_outputs: string[];          // Expected artifacts
  };
}
```

**Example - Good Diversity**:
```typescript
// Plan A
diversity_axes: ["data_sources", "analytical_models", "time_horizons"]
// Official statistics + Regression + 3-year horizon

// Plan B
diversity_axes: ["data_sources", "analytical_models", "risk_perspectives"]
// Industry reports + Monte Carlo + Stress scenarios

// ✅ Differs on 2 axes: data_sources, analytical_models
```

**Example - Bad Diversity** (rejected):
```typescript
// Plan A
diversity_axes: ["data_sources", "analytical_models", "time_horizons"]

// Plan B
diversity_axes: ["data_sources", "quality_metrics", "stakeholder_views"]

// ❌ Differs on only 1 axis: data_sources (semantic drift risk)
```

#### 3. execute_plan_step

Execute a capability step within a plan.

```typescript
{
  session_id: string;
  plan_id: string;
  task: string;                          // Capability-specific task
  adapter_id: string;                    // Adapter to use
  budget?: { ... };                      // Optional budget
}
```

#### 4. submit_cross_plan_note

Share insights between plans (contamination).

```typescript
{
  session_id: string;
  note: {
    from_plan_id: string;
    to_plan_id: string;
    note: string;
    references: string[];                // Evidence IDs
    timestamp: number;
  };
}
```

#### 5. submit_peer_critique

Peer review between plans.

```typescript
{
  session_id: string;
  critique: {
    reviewer_plan_id: string;
    reviewed_plan_id: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    confidence: number;                  // 0.0-1.0
  };
}
```

#### 6. submit_mediation_decision

Make evidence-backed final decision.

```typescript
{
  session_id: string;
  decision: {
    decision_point: string;
    chosen_from_plan: string;            // Plan ID
    rationale: string;
    evidence_ids: string[];              // Must reference evidence
    confidence: number;                  // 0.0-1.0
  };
}
```

#### 7. list_plan_status

Check progress across all plans.

```typescript
{
  session_id: string;
}
```

#### 8. finalize_parallel_reasoning

Complete workflow with audit trail.

```typescript
{
  session_id: string;
}
```

---

## 🔬 Development

### Setup

```bash
git clone https://github.com/VFG92/mcp-ptu-server
cd mcp-ptu-server
npm install
```

### Testing

```bash
npm test                    # Run all tests (162)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### Building

```bash
npm run build               # TypeScript compilation (no emit)
npx tsc --noEmit            # Check types
```

### Deployment

```bash
wrangler dev                # Local development
wrangler deploy             # Deploy to production
wrangler tail               # View live logs
```

### Environment Variables

Create `.dev.vars` for local development:

```bash
# Optional: Add any environment variables here
# EXAMPLE_VAR=value
```

---

## 🐛 Troubleshooting

### "Session not found" Error

**Cause**: Session ID mismatch or Durable Object routing issue.

**Solution**:
1. Ensure consistent `session_id` across all tool calls
2. Check that `session_id` is passed in request body (preferred) or header
3. Verify Durable Object binding in `wrangler.toml`

### Nested Map Serialization Issues

**Fixed in v5.0.3**: Custom serialization now handles nested Maps correctly.

**Technical Details**:
- `plans` and `plan_results` are Maps, not plain objects
- Serialization converts Maps → Arrays before storage
- Deserialization converts Arrays → Maps after loading

### TypeScript Compilation Errors

```bash
npm run build               # Should show 0 errors
npx tsc --noEmit            # Detailed type checking
```

### Test Failures

```bash
npm test -- --verbose       # Detailed test output
npm test -- <test-file>     # Run specific test
```

---

## 📊 Performance

### Cloudflare Workers Limits

**Free Tier**:
- CPU Time: 10ms per request
- Memory: 128 MB
- Requests: 100,000/day

**Paid Tier**:
- CPU Time: 50ms (standard), 30s (unbound)
- Memory: 128 MB
- Requests: Unlimited

### Optimization Tips

1. **Budget Management**: Set appropriate `max_tokens_in/out` limits
2. **Capability Selection**: Use targeted adapters (strategy, finance) vs comprehensive
3. **Tournament Mode**: Disable if speed > quality
4. **Parallel Reasoning**: Use 3-5 plans (not 32) for practical workflows

---

## 🔐 Security

### PII Filtering

Automatic PII detection and filtering in capability outputs.

### Compliance

- GDPR-compliant data handling
- No persistent storage of user data (except session state in DO)
- Audit trail for all operations

---

## 📚 Additional Resources

- **[README.md](./README.md)** - User-friendly guide with prompt templates
- **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** - Version history
- **[docs/EXAMPLES.md](./docs/EXAMPLES.md)** - Advanced use cases
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Deep dive into system design

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

