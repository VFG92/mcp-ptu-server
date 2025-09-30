# 🤖 MCP PTU Server - Complete Technical Documentation

**Version 3.0.0** | **Capability-Driven Architecture** | **For AI Agents & Developers**

---

## 📋 Quick Reference

**Project**: MCP PTU Server - Capability-Driven Business Analysis  
**Version**: 3.0.0 (Major Architecture Upgrade)  
**Platform**: Cloudflare Workers + Durable Objects  
**Language**: TypeScript (Strict Mode)  
**Protocol**: Model Context Protocol (MCP) 2024-11-05  
**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`

---

## 🏗️ Architecture Overview

### System Transformation

**Old System (v2.x)** → **New System (v3.0)**
- Static personas → 80-120 atomic capabilities
- No evidence → 6 evidence types with verification
- No budget tracking → Full budget awareness
- No confidence → 5-component confidence calculus
- Weak validation → Strong Zod schemas
- No audit trail → Complete execution history

### Architecture Diagram

```
MCP Client (ChatGPT)
        ↓
MCP Server (everything-workers.ts)
  - analyze_with_capabilities
  - list_capabilities
  - export_session
        ↓
Capability Orchestrator
  ├─ Planner (Beam Search)
  ├─ Scheduler (Wave-Based)
  └─ Executor (Parallel)
        ↓
    ┌───┴───┬───────┬──────────┐
    ↓       ↓       ↓          ↓
Capability Evidence Whiteboard Tournament
  Graph    Ledger   Memory     Kernel
        ↓
Durable Objects (Persistent State)
```

---

## 🔄 What Was Built

### Sprint A: Core Foundation
✅ `capability-graph.ts` - Registry for 80-120 capabilities  
✅ `budget-scheduler.ts` - Wave-based execution with knapsack optimization  
✅ Core interfaces: CapabilityNode, ExecutionContext, CostEstimate

### Sprint B: Evidence & Schemas
✅ `output-schemas.ts` - 7 Zod schemas for business artifacts  
✅ `evidence-ledger.ts` - 6 evidence types with verification engine  
✅ Quality scoring and evidence export

### Sprint C: Quality & Judging
✅ `tournament-kernel.ts` - Multi-criteria judging with ELO ratings  
✅ `confidence-calculus.ts` - 5-component weighted formula  
✅ Diversity enforcement and bandit allocation

### Sprint D: Integration & DX
✅ `capability-orchestrator.ts` - Main orchestration engine  
✅ `capability-planner.ts` - Beam search for optimal chains  
✅ `capability-adapters.ts` - 5 pre-configured adapters  
✅ `whiteboard-memory.ts` - Versioned artifact storage  
✅ `capabilities/` - 80+ capability implementations

### Phase 1: Verification & Testing
✅ Type checking - Fixed 13 TypeScript errors across 6 files  
✅ Unit tests - 15 tests for capability-graph (all passing)  
✅ Integration tests - Full orchestration flow testing  
✅ Performance tests - Cloudflare Workers constraint validation

### Phase 2: MCP Integration
✅ `capability-tools.ts` - 4 new MCP tools  
✅ `session.ts` - Whiteboard + Evidence Ledger in Durable Objects  
✅ `parallel-reasoning-engine.ts` - Deprecation warnings  
✅ `agent-personas.ts` - Migration guide and warnings

### Phase 3: Deployment
✅ `.env.example` - Environment configuration  
✅ `DEPLOYMENT_GUIDE.md` - Complete deployment instructions  
✅ `MIGRATION_GUIDE.md` - Persona → Capability migration path

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
7. **Return** - Package results with metadata

---

## 🔌 MCP Tools API

### `analyze_with_capabilities`

Main analysis tool with evidence tracking and budget awareness.

**Input**:
```typescript
{
  session_id: string;
  task: string;
  adapter_id?: 'strategy' | 'finance' | 'commercial' | 'risk' | 'comprehensive';
  required_artifacts?: string[];
  budget?: {
    max_tokens_in: number;
    max_tokens_out: number;
    max_cpu_ms: number;
    max_subrequests: number;
  };
  tournament_mode?: boolean;
}
```

**Output**:
```typescript
{
  success: boolean;
  partial: boolean;
  artifacts: Array<{
    id: string;
    type: string;
    data: any;
    confidence: number;
    evidence_quality: number;
  }>;
  coverage: number;
  overall_confidence: number;
  cost_actual: CostEstimate;
  warnings: string[];
  missing_capabilities: string[];
  execution_time_ms: number;
}
```

### `list_capabilities`

Browse available capabilities by category or tag.

### `export_session`

Export complete session for audit/compliance.

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

See `.env.example` for all configuration options.

### Monitoring

- **Health**: `GET /health`
- **Metrics**: `GET /metrics`

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

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for complete details.

---

## 📚 File Structure

```
src/workers/
├── capability-graph.ts          # Capability registry
├── capability-planner.ts        # Beam search planner
├── budget-scheduler.ts          # Wave-based scheduler
├── capability-orchestrator.ts   # Main orchestrator
├── evidence-ledger.ts           # Evidence tracking
├── confidence-calculus.ts       # Confidence scoring
├── tournament-kernel.ts         # Multi-criteria judging
├── whiteboard-memory.ts         # Artifact storage
├── output-schemas.ts            # Zod schemas
├── capability-adapters.ts       # Pre-configured adapters
├── capability-tools.ts          # MCP tool handlers
├── capabilities/                # Capability implementations
├── everything-workers.ts        # MCP server (updated)
├── session.ts                   # Durable Objects (updated)
├── parallel-reasoning-engine.ts # Legacy (deprecated)
└── agent-personas.ts            # Legacy (deprecated)
```

---

## 📈 Statistics

- **Files Created**: 21 new TypeScript modules
- **Lines of Code**: ~4,500 lines
- **Capabilities**: 80-120 atomic capabilities
- **Tests**: 15+ unit tests + integration + performance
- **Documentation**: 5 comprehensive guides
- **TypeScript Errors Fixed**: 13
- **Integration Status**: Production Ready ✅

---

**Last Updated**: 2025-09-30  
**Version**: 3.0.0  
**Status**: Production Ready ✅

