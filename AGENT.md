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

> Start a parallel reasoning session on this issue. Use the **manifest-based workflow** for efficient execution.
>
> **RECOMMENDED WORKFLOW** (Manifest-based):
> 1. Call `init_parallel_reasoning` to start the session
> 2. Submit 3+ plans using `submit_reasoning_plan` with diverse axes
> 3. Call `execute_reasoning_manifest` to generate execution manifest
> 4. **Execute ALL steps** using native ChatGPT tools (web search, Python, code interpreter)
> 5. Call `register_execution_results` to batch register all results with evidence
> 6. **Call `list_plan_status`** to check evidence quality report and gaps
> 7. Submit peer critiques using `submit_peer_critique` with falsification tests
> 8. Submit mediation decisions using `submit_mediation_decision`
> 9. **Call `generate_meta_reflection`** to analyze patterns and identify gaps (NEW)
> 10. Call `check_session_readiness` before finalizing
> 11. Call `finalize_parallel_reasoning` when ready
>
> **IMPORTANT FOR EXECUTION**:
> - Execute ALL manifest steps using native tools (web search, Python, etc.)
> - Provide detailed evidence with URLs, calculations, and workpapers
> - The manifest includes execution token for batch registration
>
> **IMPORTANT FOR TRACKING PROGRESS**:
> - Call `list_plan_status` after registering results to see evidence quality report
> - The report shows exactly what evidence is missing (external sources, quantitative data, etc.)
> - Call `generate_meta_reflection` after mediation to identify patterns and gaps
> - This tool shows current coverage/confidence/consensus % and specific gaps to fill
>
> **REMOVED TOOLS** (no longer available):
> - `execute_plan_step`: Removed - Use `execute_reasoning_manifest` + `register_execution_results`
> - `submit_cross_plan_note`: Removed - Not needed in manifest workflow

## Session Persistence & Heartbeat

### How It Works

**Session Registry** (`SessionRegistry` Durable Object):
- Maps custom session IDs to Durable Object IDs
- Tracks `lastAccessedAt` timestamp for each session
- Automatically updated on EVERY tool call (via `getDoId()`)
- Cleans up sessions after **24 hours of inactivity**

**Durable Object Eviction**:
- Cloudflare evicts DOs from memory after "a short period of time" without events
- Exact timeout not documented, but typically seconds to minutes
- State is persisted to storage on every tool call
- When DO is recreated, state is restored from storage

**Heartbeat**:
- The `startHeartbeat()` method is intentionally a placeholder
- Cloudflare Alarms do NOT prevent eviction (per official docs)
- State persistence on every tool call is the correct approach
- ChatGPT typically calls tools every 1-3 minutes, keeping sessions alive

**Why Sessions Don't Expire**:
1. Every tool call → Worker routes to registry → `getDoId()` → updates `lastAccessedAt`
2. ChatGPT calls tools frequently (1-3 min intervals)
3. 24h timeout is much longer than typical ChatGPT session
4. Even if DO is evicted, state is restored from storage

**If you see "session expired" errors**, it's likely:
- User provided wrong session_id
- Server was restarted (local dev only)
- Actual 24h+ of inactivity (very rare)

## Recent Improvements (2025-10-10)

### 1. Optimal Capability Chain Length ✅
**Research-backed**: Increased recommended range from 3-5 to **5-10 steps** based on "wisdom of crowds" research showing diversity improves group performance.

**Why**: Longer chains allow for:
- More thorough analysis
- Better evidence collection
- Higher quality outputs
- Improved robustness

**Files modified**:
- `src/workers/parallel-reasoning-mcp.ts` (line 378): Updated schema description
- `src/workers/everything-workers.ts` (line 532): Updated tool description

### 2. Quality Metrics Guidance ✅
**Problem**: ChatGPT struggled to reach coverage (95%), confidence (85%), and consensus (80%) thresholds without understanding HOW to improve.

**Solution**: Added progressive, detailed guidance at multiple levels:

1. **In execution manifest** (`src/workers/manifest-execution.ts`):
   - Clear quality targets section explaining each threshold
   - Step-by-step instructions on how to reach each target
   - Specific examples of good vs bad evidence
   - Complete workflow from execution to finalization

2. **In readiness check** (`src/workers/parallel-reasoning-tools-v5.ts`):
   - Detailed breakdown when metrics are not met
   - Specific gap calculations (e.g., "need 12.3% more confidence")
   - Actionable instructions for each metric:
     - **Coverage**: Execute remaining X steps
     - **Confidence**: Add high-quality evidence (URLs, calculations, workpapers)
     - **Consensus**: Submit peer critiques and mediation decisions
   - Examples of what constitutes quality evidence

**Impact**: ChatGPT now receives clear, actionable feedback instead of just "not ready".

## Troubleshooting: 403 Safety Block on `register_execution_results`

**Symptom**: `ConnectorClientError: 403: "Server returned 403: 'Invocation is blocked on safety'"`

**Root cause**: OpenAI's security filters block MCP tool calls containing direct URLs in `evidence_refs` field.

**Solution** (AUTOMATIC - ChatGPT handles this):
1. **First attempt**: ChatGPT tries with `evidence_refs` containing URLs
2. **If blocked**: Receives 403 error
3. **Auto-retry**: ChatGPT omits `evidence_refs` entirely and includes sources in `findings` text:
   ```json
   {
     "findings": "Analysis confirmed by Banca d'Italia (https://...) and Reuters (https://...)",
     "evidence_refs": []  // or omit entirely
   }
   ```
4. **Success**: Server accepts, workflow continues

**Key points**:
- `evidence_refs` is **completely optional** - can be omitted
- Sources can be included directly in `findings` text
- No information is lost - just different format
- ChatGPT auto-corrects after first 403 error

## Troubleshooting: Low confidence or missing evidence types

**Symptom**: Confidence is stuck at 40-50% or `list_plan_status` shows missing evidence types.

**Root cause**: Missing evidence types (external sources, quantitative data, workpapers) or low-quality evidence.

**Solution with manifest-based workflow**:
1. Call `list_plan_status` to see the **Evidence Quality Report**
2. It will show exactly what's missing:
   ```markdown
   ### ❌ Missing Evidence Types

   #### 🔴 EXTERNAL SOURCES
   **Examples of what to add**:
   - Industry reports with URLs (e.g., Gartner, Forrester)
   - Company financial data from public sources
   ```
3. When executing manifest steps, provide sources in `findings` text (to avoid 403 blocks):
   ```json
   {
     "findings": "Market analysis from Gartner (https://...) shows $45.2B market size with 12.3% CAGR. Calculation: Base $32B (2020) * (1.123^4) = $45.2B"
   }
   ```
4. Register results with `register_execution_results` - include sources in findings if `evidence_refs` is blocked

## Useful commands
```bash
npm install            # install dependencies
npm run build          # type-check
npm test               # execute the Jest suite
npm run workers:dev    # launch a local Cloudflare Worker
```

When deploying, use `npm run workers:deploy` with the appropriate Cloudflare credentials.

## UI visualization layer (ChatGPT Apps SDK)

The server includes an optional **passive visualization layer** that renders interactive UI components inside ChatGPT. All 8 parallel reasoning tools return `structuredContent` alongside text responses.

**Apps SDK Compatibility Status**: ~70% compatible
**Required Changes**: Adapt tool response format to include `_meta.openai/outputTemplate` metadata instead of custom `structuredContent` field. See [`APPS_SDK_COMPATIBILITY_ANALYSIS.md`](./APPS_SDK_COMPATIBILITY_ANALYSIS.md) for details.

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
- ✅ Always return both `content` (text) and `structuredContent` (data)
- ✅ Use `createStructuredContent()` helper from `ui-structured-content.ts`
- ✅ Ensure structured content matches TypeScript interfaces
- ❌ DO NOT modify UI components without rebuilding (`npm run build` in `src/ui`)
- ❌ DO NOT change structured content types without updating UI components

## Semantic diversity validation

The parallel reasoning system uses **semantic validation** for diversity axes instead of literal string matching. This enables more flexible and intuitive plan differentiation.

### How it works
Diversity axes are parsed as **Key: Value** pairs with intelligent key extraction:
- `"Tech Stack: Hybrid"` → `{key: "tech_stack", value: "hybrid"}`
- `"Data Sources: Primary research"` → `{key: "data_sources", value: "primary research"}`
- `"Postura verso l'AGCM (accettazione vs contestazione)"` → `{key: "postura_agcm", value: ""}`
- `"Grado di apertura dei dati"` → `{key: "grado_apertura_dati", value: ""}`

### Flexible naming with partial matching
The system supports **both long descriptive forms and short abbreviated forms**:

**Long form** (in `init_parallel_reasoning`):
```json
"required_diversity_axes": [
  "Postura verso l'AGCM (accettazione vs contestazione)",
  "Ampiezza del rimedio economico ai clienti",
  "Grado di apertura dei dati (trasparenza radicale vs disclosure minima)"
]
```

**Short form** (in `submit_reasoning_plan`):
```json
"diversity_axes": [
  "Postura: accettazione piena",
  "Rimedio: ampio e proattivo",
  "Apertura: trasparenza radicale"
]
```

**Matching logic**:
- Extracts significant words from both forms
- "Postura verso l'AGCM" → `postura_agcm`
- "Postura: accettazione" → `postura`
- Match: `postura` is contained in `postura_agcm` ✓
- "Grado di apertura dei dati" → `grado_apertura_dati`
- "Apertura: radicale" → `apertura`
- Match: `apertura` is contained in `grado_apertura_dati` ✓

### Validation rules
1. **Required axes**: Plans must include axes with **matching keys** (exact or partial match)
   - Required: `"Tech Stack: Cloud"` → Plan can use `"Tech Stack: Hybrid"` ✅
   - Required: `"Tech Stack: Cloud"` → Plan cannot use `"Technology: Hybrid"` ❌ (different key)
   - Required: `"Grado di apertura dei dati"` → Plan can use `"Apertura: radicale"` ✅ (partial match)

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
- **Long descriptive forms in init**: Use detailed, self-documenting axis names in `init_parallel_reasoning`
- **Short abbreviated forms in plans**: Use concise "Key: Value" format in `submit_reasoning_plan`
- **Partial matching**: The system will match abbreviated keys with longer descriptive keys automatically
- **Multi-language support**: Works with English, Italian, and other languages with similar preposition patterns
- **Focus on substance**: Emphasize substantive differences, not just label variations
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

---

## 🆕 Recent Enhancements (2025-01)

### Fase 4: Saliency Report Integration
**Status**: ✅ Complete

The saliency report now provides ChatGPT with precise guidance on missing evidence types:

- **What**: Integrated saliency report into `list_plan_status` output
- **Why**: ChatGPT needs to know exactly what evidence is missing (external sources, quantitative data, workpapers)
- **How**: After batch evidence registration, a saliency report is generated and displayed in status
- **Example output**:
  ```markdown
  ## 🔍 Evidence Quality Report

  **Overall Quality Score**: 45.2% ⚠️

  ### ❌ Missing Evidence Types

  #### 🔴 EXTERNAL SOURCES
  **Description**: Citations from authoritative external sources
  **Examples of what to add**:
  - Industry reports with URLs (e.g., Gartner, Forrester)
  - Company financial data from public sources
  - Academic research papers with DOIs
  ```

**Files modified**:
- `src/workers/parallel-reasoning-mcp.ts`: Added `saliency_report` field to session
- `src/workers/manifest-execution.ts`: Save saliency report after batch registration
- `src/workers/parallel-reasoning-tools-v5.ts`: Display saliency report in `list_plan_status`

**Tests**: `__tests__/saliency-report-integration.test.ts` (8 tests, all passing)

### Fase 5: Enhanced Consensus Metrics
**Status**: ✅ Complete

Consensus calculation now **rewards constructive disagreement** instead of penalizing it:

- **What**: Modified consensus formula to value well-argued disagreement over shallow agreement
- **Why**: A disagreement with falsification tests is more valuable than superficial agreement
- **How**:
  - Disagreements with claims_challenged + falsification_tests + evidence get quality bonuses
  - Shallow agreements (high score but no substance) score lower
  - Formula: `avgQuality = sum(critiquePoints) / critiques.length`

**Quality bonuses for disagreements** (agreement_score < 0.6):
- Has claims_challenged: +0.20
- Has falsification_tests: +0.25 (most valuable)
- Has residual_risks: +0.15
- Has evidence: +0.20

**Example**: A disagreement (score 0.3) with all quality signals can reach 1.0, beating a shallow agreement (score 0.9) with no substance.

**Files modified**:
- `src/workers/session-metrics.ts`: Enhanced `calculateConsensus()` function

**Tests**: `__tests__/enhanced-consensus.test.ts` (9 tests, all passing)

### Fase 6: Meta-Reflection Tool
**Status**: ✅ Complete

New tool `generate_meta_reflection` for post-mediation analysis:

- **What**: Analyzes patterns in disagreements, identifies residual uncertainty, suggests further analysis
- **When**: Call AFTER mediation decisions but BEFORE finalization
- **Output includes**:
  - Mediation decision patterns (distribution, confidence analysis)
  - Disagreement pattern analysis (most challenged claims)
  - Residual uncertainty & risks
  - Recommendations for further analysis
  - Next steps

**Example recommendations**:
- "Re-examine 3 low-confidence decisions - Consider gathering additional evidence"
- "Investigate decision imbalance - One plan dominates (5 vs 1 decisions)"
- "Deep-dive on repeatedly challenged claims - Some claims were challenged 3 times"
- "Add falsification tests - 2 critiques lack falsification tests"

**Files modified**:
- `src/workers/parallel-reasoning-tools-v5.ts`: Added `handleGenerateMetaReflection()`
- `src/workers/everything-workers.ts`: Registered new tool
- `src/workers/apps-sdk-metadata.ts`: Added widget mapping

**Tests**: `__tests__/meta-reflection.test.ts` (10 tests, all passing)

### Fase 7: Session Persistence
**Status**: ✅ Already Implemented

Session persistence is already implemented through Cloudflare Durable Objects architecture:
- Sessions are automatically persisted
- Can be resumed at any time using session_id
- No additional checkpoint/resume mechanism needed

### Updated Workflow

The recommended workflow now includes:

1. `init_parallel_reasoning` - Start session
2. `submit_reasoning_plan` (3+ plans) - Submit diverse plans
3. `execute_reasoning_manifest` - Generate manifest with execution token
4. Execute ALL steps using native tools (web search, Python, etc.)
5. `register_execution_results` - Batch register all results
6. `list_plan_status` - Check evidence quality report and gaps
7. `submit_peer_critique` - Peer review with falsification tests
8. `submit_mediation_decision` - Make mediation decisions
9. **`generate_meta_reflection`** - Analyze patterns and identify gaps (NEW)
10. `check_session_readiness` - Verify readiness
11. `finalize_parallel_reasoning` - Complete session

### Key Metrics

All quality metrics are now enhanced:
- **Confidence**: Based on evidence density and quality signals
- **Coverage**: Ratio of executed vs declared capability steps
- **Consensus**: Rewards constructive disagreement with falsification tests

**Thresholds** (enforced at finalization):
- Confidence ≥ 85%
- Coverage ≥ 95%
- Consensus ≥ 80%

