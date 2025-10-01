# 🤖 MCP PTU Server - Technical Documentation

**Version 5.0.3** | For AI Agents & Developers

---

## 📋 Quick Reference

**Platform**: Cloudflare Workers + Durable Objects  
**Language**: TypeScript (Strict Mode)  
**Protocol**: Model Context Protocol (MCP) 2024-11-05  
**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`  
**Tests**: 162/162 passing  
**Build**: ✅ 0 TypeScript errors

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│ MCP Client (ChatGPT)                                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/SSE
┌────────────────────▼────────────────────────────────────────┐
│ Cloudflare Worker (index.ts)                                │
│ - Extracts session_id from body/header                      │
│ - Routes to Durable Object by ID                            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Durable Object (session.ts)                                 │
│ - One instance per session_id                               │
│ - Manages MCP Server lifecycle                              │
│ - Persists parallel reasoning state                         │
│ - Loads/saves to DO storage                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ MCP Server (everything-workers.ts)                          │
│ - 58 capabilities + 8 parallel reasoning tools              │
│ - Evidence tracking, budget management                      │
│ - Tournament mode, peer review                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Capability System                                            │
│ - Graph: Capability registry                                │
│ - Orchestrator: Execution engine                            │
│ - Planner: Beam search optimization                         │
│ - Whiteboard: Versioned artifact storage                    │
│ - Evidence Ledger: Quality tracking                         │
│ - Industry Adapters: Domain templates                       │
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
- Handles serialization of nested Maps

**everything-workers.ts** - MCP Server
- Registers 58 capabilities + 8 parallel reasoning tools
- Handles tool calls via `CallToolRequestSchema`
- Manages capability execution and persistence

**parallel-reasoning-mcp.ts** - Session Manager
- Manages parallel reasoning sessions
- Validates diversity (≥2 axes difference)
- Serializes/deserializes nested Maps correctly

---

## 🔧 API Reference

### Core Tools

#### analyze_with_capabilities

Execute business analysis with capability-driven architecture.

```typescript
{
  session_id: string;              // Required: Unique session identifier
  task: string;                    // Required: Analysis task description
  adapter_id?: string;             // Optional: strategy|finance|commercial|risk|comprehensive
  context?: {                      // Optional: Industry/region context
    industry?: string;
    region?: string;
    competitors?: string[];
    [key: string]: any;
  };
  budget?: {                       // Optional: Resource limits
    max_tokens_in?: number;
    max_tokens_out?: number;
    max_cpu_ms?: number;
    max_subrequests?: number;
  };
  enable_native_capabilities?: boolean;  // Optional: Enable Python/Web Search
  tournament_mode?: boolean;       // Optional: Enable multi-criteria judging (default: true)
  peer_review_mode?: boolean;      // Optional: Enable peer review (default: true)
}
```

### Parallel Reasoning Tools (v5.0)

#### 1. init_parallel_reasoning

Initialize a parallel reasoning session.

```typescript
{
  session_id: string;                    // Required: Unique session ID
  task_description: string;              // Required: Task to analyze
  required_diversity_axes: string[];     // Required: 2+ axes from list below
  min_plans: number;                     // Required: 3-32 plans
}
```

**Diversity Axes**: `data_sources`, `analytical_models`, `time_horizons`, `quality_metrics`, `risk_perspectives`, `stakeholder_views`

#### 2. submit_reasoning_plan

Submit a reasoning plan (validated for diversity).

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

