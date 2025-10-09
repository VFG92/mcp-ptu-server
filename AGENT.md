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

> Start a parallel reasoning session on this issue. Use **all** MCP endpoints and activate native capabilities whenever calculations or retrieval of real evidence is required.
>
> **CRITICAL WORKFLOW**:
> 1. Call `init_parallel_reasoning` to start the session
> 2. Submit ${min_plans} plans using `submit_reasoning_plan`
> 3. **Call `list_plan_status` immediately** to see what needs to be done
> 4. Execute capability steps using `execute_plan_step` with **DETAILED task descriptions** that trigger real reasoning and tool use
> 5. **Call `list_plan_status` frequently** to track progress and identify gaps
> 6. Submit peer critiques using `submit_peer_critique` to build consensus
> 7. Call `check_session_readiness` before finalizing
> 8. Call `finalize_parallel_reasoning` when ready
>
> **IMPORTANT FOR EXECUTE_PLAN_STEP**:
> - The `task` parameter must describe WHAT ANALYSIS TO PERFORM in detail
> - GOOD: "Analyze top 5 competitors: identify pricing models, estimate market share using web search, list differentiators"
> - BAD: "competitor analysis" (too vague)
> - Detailed tasks trigger real reasoning + tool use → high-quality evidence → higher confidence scores
>
> **IMPORTANT FOR TRACKING PROGRESS**:
> - Call `list_plan_status` after submitting all plans
> - Call `list_plan_status` after executing several steps
> - Call `list_plan_status` before attempting finalization
> - This tool shows current coverage/confidence/consensus % and specific gaps to fill

## Troubleshooting: Low confidence despite many evidence IDs

**Symptom**: You have 20+ evidence IDs but confidence is stuck at 40-50%.

**Root cause**: Too many `evidence_low` quality signals. This happens when `execute_plan_step` tasks are too vague.

**Confidence formula**:
```
confidence = 0.5 (base) + min(0.3, evidence_count * 0.1) - min(0.4, evidence_low_count * 0.2)
```

**Example scenario**:
- 26 evidence IDs → +30% bonus (max)
- Confidence = 40% → -40% penalty (max)
- Formula: 50% + 30% - 40% = 40% ✓

**Solution**:
1. Call `list_plan_status` to see the diagnostic
2. It will show: "⚠️ CRITICAL: You have 26 evidence IDs but confidence is still low (40%). This means your evidence has LOW QUALITY signals..."
3. Re-execute steps with MUCH MORE DETAILED task descriptions
4. Use specific analytical instructions that force tool use and reasoning

**Before (generates evidence_low)**:
```json
{"task": "market analysis"}
```

**After (generates high-quality evidence)**:
```json
{"task": "Search for top 5 B2B SaaS companies in healthcare. For EACH: 1) Find website, 2) Extract pricing page URL, 3) Identify pricing model, 4) Estimate revenue from Crunchbase, 5) List 3 differentiators. Provide URLs and data."}
```

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

