# 🤖 MCP PTU Server – Agent Guidelines

This repository powers the MCP PTU Cloudflare Worker. Use this document as the primary reference when contributing or updating documentation. All contributions must be written in English.

## 🆕 Recent Updates (October 2025)

### 🚀 v5.10.0: Enhanced Reasoning Quality (Popper-Inspired Falsification)

**BREAKING CHANGES**:
- ✅ **Falsification tests now REQUIRED** (no longer optional)
- ✅ **Counterfactual scenarios now REQUIRED** (prevents overfitting to preferred assumptions)
- ✅ **Minimum 3 claims per critique** (prevents superficial reviews)
- ✅ **UCT-based depth tracking** (MCTS-inspired exploration guidance)

**Why this matters**:
1. **Prevents overfitting**: Falsification tests force rigorous hypothesis testing (Popper's falsifiability criterion)
2. **Prevents assumption lock-in**: Counterfactual scenarios explore "what if driver X doesn't hold?"
3. **Optimizes exploration**: UCT balances exploitation (high-benefit plans) vs exploration (under-explored plans)

**Example peer critique** (v5.10.0+):
```json
{
  "reviewer_plan_id": "plan_A",
  "reviewed_plan_id": "plan_B",
  "claims_challenged": [
    {
      "claim": "Market size is $50B",
      "evidence_ids": ["ev1"],
      "challenge": "Data is outdated (2022), market has contracted",
      "falsification_test": "If Q1 2025 growth is <5%, this claim is falsified",
      "counterfactual_scenario": "If market size is actually $30B, plan would need to reduce headcount by 40% and focus on premium segment only"
    },
    {
      "claim": "Customer acquisition cost is $100",
      "evidence_ids": ["ev2"],
      "challenge": "Assumes no competition, unrealistic",
      "falsification_test": "If CAC exceeds $150 in first 6 months, claim is falsified",
      "counterfactual_scenario": "If CAC is $200, plan would need to pivot to enterprise sales instead of SMB"
    },
    {
      "claim": "Churn rate will be <5%",
      "evidence_ids": ["ev3"],
      "challenge": "No evidence for this assumption",
      "falsification_test": "If churn exceeds 10% in first year, claim is falsified",
      "counterfactual_scenario": "If churn is 15%, plan would need to add customer success team and reduce growth targets by 50%"
    }
  ],
  "residual_risks": ["Market volatility", "Regulatory changes"],
  "agreement_score": 0.7,
  "timestamp": 1234567890
}
```

**UCT Depth Tracking**:
- `list_plan_status` now shows UCT-based exploration guidance
- Plans ranked by UCT score: `exploitation + C * exploration`
- ChatGPT receives clear recommendations: "🚀 START executing this plan" vs "⏩ CONTINUE" vs "✅ COMPLETE"
- Prevents premature convergence on single plan

**Implementation Details**:
- `PeerCritiqueSchema`: Added `.min(3)` to `claims_challenged`, made `falsification_test` and `counterfactual_scenario` required
- `calculatePlanDepthMetrics()`: Implements UCT formula with C=1.41 (sqrt(2))
- `formatPlanDepthMetrics()`: Formats guidance for ChatGPT consumption
- All tests updated to comply with new requirements

### Diversity Axis Format Support
**Fixed**: The system now supports both `Key: value` and `Key (value)` formats for diversity axes.

**Examples**:
- ✅ `Metodologia: econometrico` (colon format)
- ✅ `Metodologia (econometrico)` (parentheses format)
- ✅ `Narrativa di scenario (baseline ISTAT / WEF median automation)` (complex value in parentheses)

**Impact**: Plans using parentheses format are now correctly differentiated. Previously, plans like:
- `Metodologia (econometrico)` vs `Metodologia (sistemi dinamici)`

Were incorrectly considered identical (diversity = 0) because the parser removed parentheses content. Now they are correctly recognized as different (diversity = 1).

**When submitting plans**: You can use either format interchangeably. The system will parse both correctly and calculate semantic diversity accurately.

### Evidence Quality & Moderation Prevention

**Problem Solved**: ChatGPT was experiencing two critical issues:
1. **Confidence too low**: Even with quality evidence (ISTAT, WEF, Excelsior citations), confidence stayed below 85%
2. **Moderation blocks**: Using real source names in `evidence_refs.ref_id` triggered OpenAI 403 errors

**Solution Implemented**:
- **More generous bonuses**: Increased quality bonuses to reward evidence properly
  - Evidence items: +0.04 per item (max +0.35, was +0.3)
  - External sources: +0.015 per source (max +0.10, was +0.08)
  - Datapoints: +0.008 per datapoint (max +0.10, was +0.08)
  - Workpapers: +0.015 per workpaper (max +0.05, was +0.04)
- **Synthetic IDs enforced**: `evidence_refs.ref_id` MUST match `^(Source|Calc|Data|WP)\d+$`
- **Validation added**: Server rejects payloads with real source names

**CRITICAL RULES for ChatGPT**:
- ❌ **NEVER** use real source names in `evidence_refs.ref_id` (ISTAT, WEF, Excelsior, etc.)
- ❌ **NEVER** use URLs, citations, or organization names in payload
- ✅ **ALWAYS** use synthetic IDs: `Source1`, `Source2`, `Calc1`, `Data1`, `WP1`, etc.
- ✅ Keep `summary` ultra-short (max 200 chars) with ONLY numbers and generic terms
- ⚠️ Real names trigger OpenAI moderation blocks causing 403 errors!

**Example** (CORRECT):
```json
{
  "evidence_refs": [
    {"ref_id": "Source1", "type": "source"},
    {"ref_id": "Source2", "type": "source"},
    {"ref_id": "Calc1", "type": "calculation"}
  ],
  "summary": "12 journeys. Gap 12-25%. 3 sources, 5 calcs."
}
```

**Example** (WRONG - will cause 403 error):
```json
{
  "evidence_refs": [
    {"ref_id": "ISTAT", "type": "source"},  // ❌ Real name!
    {"ref_id": "WEF", "type": "source"}     // ❌ Real name!
  ],
  "summary": "Based on ISTAT data and WEF reports..."  // ❌ Too verbose!
}
```

## Core expectations
- Keep changes incremental and well scoped; update or add tests whenever behavior shifts.
- Follow the existing TypeScript + Cloudflare Workers architecture. **Do not** wrap imports in `try/catch` blocks.
- Maintain concise, accurate documentation. Update this guide and `README.md` whenever workflows or guardrails change.

## Parallel reasoning workflow guardrails
- `register_execution_results` **only accepts numeric self-assessment payloads**. Preserve validation that rejects raw evidence text and extra fields.
- Evidence references must remain synthetic: IDs must match `^(Source|Calc|Data|WP)\d+$` and summaries stay under 200 characters.
- Confidence, coverage, and consensus thresholds (85% / 95% / 80%) are enforced during readiness checks and finalization—keep tests aligned with these values.

## Development workflow
1. Confirm the task scope and locate affected modules under `src/workers/` or supporting packages.
2. Make changes in small commits, keeping TypeScript strictness intact.
3. Run targeted tests plus the relevant smoke scripts before submitting.
4. Provide clear commit messages and PR summaries describing functional impact.

## Useful commands
- `npm run build` – Type-check the worker.
- `npm test` – Run the Jest suite (`__tests__/`).
- `npm run test:coverage` – Coverage snapshot for MCP surfaces.
- `./test-direct-api.sh` / `./test-simple-direct-api.sh` – Direct API smoke tests.
- `./test-403-fix.sh` – Ensures moderation-safe payload validation stays intact.
- `./scripts/test-parallel-reasoning-simple.sh` – Persistence sanity check (requires `npm run workers:dev`).

## Reference map
- `src/workers/index.ts` – HTTP entrypoint, routing, heartbeat, proxy logic.
- `src/workers/session.ts` – Durable Object session state.
- `src/workers/manifest-execution.ts` – Self-assessment handling and evidence validation.
- `src/workers/parallel-reasoning-tools-v5.ts` – MCP tool implementations and workflow checklist output.
- `examples/` – Executable walkthroughs for reasoning, mediation, and capability orchestration.

When in doubt, read the related tests under `__tests__/` to understand expected behavior before making changes.
