# 🤖 MCP PTU Server – Agent Guidelines

This document keeps contributors and AI agents aligned while working on the repository. All guidance is written for English-language contributions.

## Core expectations
- Follow the existing TypeScript and Cloudflare Workers architecture; keep imports free of try/catch wrappers.
- Prefer incremental, well-scoped changes. Update or create tests when behavior changes.
- Run relevant scripts from `package.json` before submitting significant modifications (`npm run build`, `npm test`, `npm run workers:dev`).
- Keep documentation concise, accurate, and up to date with the current feature set.

## Workflow checklist
1. Review open issues or tasks and confirm scope.
2. Modify code or documentation in small, reviewable commits.
3. Execute the appropriate test or build commands.
4. Document changes clearly in commit messages and pull requests.

## Recommended MCP prompt
Use the following prompt to exercise the server end-to-end:

> Start a parallel reasoning session on this issue, invoke every endpoint at the right moment, and use reasoning to drive a workflow that ends with closing the session. Use **all** MCP endpoints and activate native capabilities whenever calculations or retrieval of real evidence is required.
>
> **IMPORTANT**: Always call `check_session_readiness` before attempting `finalize_parallel_reasoning`. Finalization is **automatically blocked** unless the quality metrics report **Confidence ≥ 85%**, **Coverage ≥ 95%** (essential steps complete, no fluff), **Consensus ≥ 80%**, and every material figure is backed by at least two independent sources or one primary source plus a reconstruction workpaper.
>
> If readiness check shows metrics below thresholds, follow the recommendations provided (e.g., execute more capability steps, add more evidence, conduct peer reviews) before attempting finalization.

## Useful commands
```bash
npm install            # install dependencies
npm run build          # type-check
npm test               # execute the Jest suite
npm run workers:dev    # launch a local Cloudflare Worker
```

When deploying, use `npm run workers:deploy` with the appropriate Cloudflare credentials.

## UI visualization layer (ChatGPT Apps SDK)

The server includes an optional **passive visualization layer** that renders interactive UI components inside ChatGPT.

**Apps SDK output format**:
- Tools may return legacy `structuredContent` (used by the existing UI bundle).
- The server also emits Apps SDK-compatible widget metadata via `_meta["openai/outputTemplate"]` (used by ChatGPT Apps SDK iframe rendering).
- Metadata is added centrally in `src/workers/everything-workers.ts` using `src/workers/apps-sdk-metadata.ts`.

### Key files
- `src/ui/src/types.ts` – TypeScript interfaces for structured content
- `src/ui/src/WorkflowVisualizer.tsx` – main component router
- `src/ui/src/components/` – timeline, matrix, dashboard components
- `src/workers/ui-structured-content.ts` – structured content type definitions
- `src/workers/ui-resources.ts` – UI resource registration for MCP protocol

### Development workflow
```bash
cd src/ui
npm install
npm run build  # outputs to dist/workflow-visualizer.js
```

The main `tsconfig.json` excludes `src/ui` to avoid conflicts with React JSX configuration.

### Design principles
1. **Passive observer** – UI components only visualize data, never control workflow
2. **Structured content** – all tools return both text and structured data
3. **Backward compatible** – text responses unchanged, structuredContent is additive
4. **Zero configuration** – UI resources served automatically via MCP protocol
5. **Security first** – strict CSP, sandboxed execution, no external requests

### Rules for AI agents
**When modifying tool responses**:
- ✅ Always return `content` (text)
- ✅ If the response drives a widget, return `structuredContent` (legacy) using `createStructuredContent()` from `ui-structured-content.ts`
- ✅ Keep structured content aligned with TypeScript interfaces (UI relies on it); `_meta["openai/outputTemplate"]` is derived from it
- ❌ DO NOT modify UI components without rebuilding (`npm run build` in `src/ui`)
- ❌ DO NOT change structured content types without updating UI components

## Semantic diversity validation

The parallel reasoning system uses **semantic validation** for diversity axes instead of literal string matching. This enables more flexible and intuitive plan differentiation.

### How it works
Diversity axes are parsed as **Key: Value** pairs:
- `"Tech Stack: Hybrid"` → `{key: "tech_stack", value: "hybrid"}`
- `"Data Sources: Primary research"` → `{key: "data_sources", value: "primary research"}`

### Validation rules
1. **Required axes**: Plans must include axes with the **same keys** as required axes (values can differ)
   - Required: `"Tech Stack: Cloud"` → Plan can use `"Tech Stack: Hybrid"` ✅
   - Required: `"Tech Stack: Cloud"` → Plan cannot use `"Technology: Hybrid"` ❌ (different key)

2. **Inter-plan diversity**: Plans must differ from existing plans on **at least 2 axes semantically**
   - Same key, different values → counts as different
   - Different keys → counts as different
   - Same key, same value → counts as same

### Examples
**Good diversity** (2+ semantic differences):
```typescript
Plan A: ["Tech Stack: Cloud", "Risk: Market", "Time: Short-term"]
Plan B: ["Tech Stack: Hybrid", "Risk: Operational", "Time: Short-term"]
// Differences: Tech Stack value, Risk value (2 differences) ✅
```

**Insufficient diversity** (<2 differences):
```typescript
Plan A: ["Tech Stack: Cloud", "Risk: Market", "Time: Short-term"]
Plan B: ["Tech Stack: Cloud", "Risk: Market-focused", "Time: Short-term"]
// Differences: Only Risk value slightly different (1 difference) ❌
```

### Best practices for agents
- Use consistent key names across plans (e.g., always "Tech Stack", not "Technology Stack")
- Structure axes as "Category: Specific Value" for clarity
- Focus on substantive differences, not just label variations
- When a plan is rejected, check the semantic diversity count in logs

### Implementation details
- Parser: `parseAxisString()` in `src/workers/parallel-reasoning-mcp.ts`
- Validator: `calculateSemanticDiversity()` compares plans semantically
- Rejected plans are stored in `session.rejected_plans` for audit and cross-contamination
- Budget validation now accepts values ≥1 instead of >0

## Quality thresholds and finalization blocking

The server enforces strict quality thresholds to prevent premature finalization of parallel reasoning sessions.

### Quality metrics and thresholds
| Metric | Threshold | Formula |
|--------|-----------|---------|
| **Confidence** | ≥85% | Base (50%) + Evidence bonus (max +30%) - Quality penalty (max -40%) |
| **Coverage** | ≥95% | Executed steps / Declared capability chain steps |
| **Consensus** | ≥80% | Normalized from peer critique agreement scores |

### Workflow enforcement
1. **Pre-finalization check**: Always call `check_session_readiness` before `finalize_parallel_reasoning`
   - Returns structural check (min plans, all executed)
   - Returns quality check (which thresholds are met/unmet)
   - Provides actionable recommendations if not ready
   - Lists specific blockers preventing finalization

2. **Finalization blocking**: `finalize_parallel_reasoning` will **block** if:
   - Structural requirements not met (min plans, execution incomplete)
   - **OR** any quality metric below threshold
   - Returns `finalized: false` with detailed warnings
   - Explains which metrics need improvement
   - Provides next steps to reach thresholds

### Best practices for agents
- ✅ Always call `check_session_readiness` before attempting finalization
- ✅ If not ready, follow the recommendations (execute more steps, add evidence, conduct reviews)
- ✅ Re-check readiness after improvements
- ✅ Only attempt finalization when `ready: true`
- ❌ DO NOT repeatedly call `finalize_parallel_reasoning` if blocked
- ❌ DO NOT skip `check_session_readiness` to "save time"

### Implementation details
- Thresholds: `CONFIDENCE_THRESHOLD`, `COVERAGE_THRESHOLD`, `CONSENSUS_THRESHOLD` in `src/workers/session-metrics.ts`
- Readiness check: `checkSessionReadiness()` in `src/workers/parallel-reasoning-mcp.ts`
- Blocking logic: `finalizeSession()` checks `meetsThresholds()` before allowing finalization
- New MCP tool: `check_session_readiness` registered in `src/workers/everything-workers.ts`

### Test coverage
- `__tests__/session-readiness.test.ts`: 4 tests covering readiness checks and blocking behavior
- `__tests__/session-metrics.test.ts`: Updated to reflect blocking finalization
- `__tests__/parallel-reasoning-v5.test.ts`: Updated to reflect quality threshold enforcement
- All 266 tests passing ✅
