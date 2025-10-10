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

## Operational toolkit
- `npm test` / `npm run test:integration` – primary guardrails for regressions across workers and Durable Objects.
- `./test-simple-direct-api.sh` – verifies the `/api/register-results` fallback path (session extraction + moderation safety).
- `./test-direct-api.sh` – drives a manifest workflow end to end through the direct API.
- `./test-403-fix.sh` – reproduces OpenAI safety filtering to ensure `evidence_refs` stay compliant.
- `./scripts/test-parallel-reasoning-simple.sh` – lightweight smoke test for Durable Object persistence (requires `npm run workers:dev`).
- `./scripts/test-parallel-reasoning-fix.sh` – verbose MCP walkthrough for debugging complex workflows.

## Direct results API
- Switch to `POST /api/register-results` when MCP sessions expire or moderation blocks `register_execution_results`.
- The endpoint extracts `session_id` from the `execution_token`, so clients never send session identifiers directly.
- Run `./test-simple-direct-api.sh` and `./test-direct-api.sh` before shipping changes that touch execution result handling.
- Error handling and storage writes live in `src/workers/session.ts#handleInternalRegisterResults`; keep the handler idempotent for safe retries.

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
> 9. **Call `generate_meta_reflection`** to analyze patterns and identify gaps
> 10. Call `check_session_readiness` before finalizing
> 11. Call `finalize_parallel_reasoning` when ready
>
> **IMPORTANT FOR EXECUTION**:
> - Execute ALL manifest steps using native tools (web search, Python, etc.)
> - Provide detailed evidence with URLs, calculations, and workpapers
> - The manifest includes execution token for batch registration
> - **Complete the workflow quickly** - MCP sessions can expire causing "Session terminated" errors
>
> **IMPORTANT FOR TRACKING PROGRESS**:
> - Call `list_plan_status` after registering results to see evidence quality report
> - The report shows exactly what evidence is missing (external sources, quantitative data, etc.)
> - Call `generate_meta_reflection` after mediation to identify patterns and gaps
> - This tool shows current coverage/confidence/consensus % and specific gaps to fill
>
> **⚠️ CRITICAL: Avoiding Errors**:
> - **403 Errors**: DO NOT put URLs in `evidence_refs`. Put ALL URLs in `findings` text instead.
> - **Session Terminated**: MCP sessions can expire. Complete workflow quickly without long pauses.
> - If you get "Session terminated", the workflow CANNOT be recovered - you must start over.
>
> **TOOLS NOT EXPOSED** (hidden from ChatGPT to avoid confusion):
> - `execute_plan_step`: Deprecated - Use `execute_reasoning_manifest` + `register_execution_results`
> - `submit_cross_plan_note`: Deprecated - Not needed in manifest workflow
> - `analyze_with_capabilities`: Internal capability system - not for parallel reasoning
> - `get_capability_status`: Internal capability system - not for parallel reasoning
> - `export_session`: Internal capability system - not for parallel reasoning

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

## 403 Safety Blocks on register_execution_results

### The Problem

OpenAI's security filters block MCP tool calls containing URLs **BEFORE** they reach our server. This causes:
```
ConnectorClientError: 403: "Server returned 403: 'Invocation is blocked on safety'"
```

**Why it happens**:
- OpenAI scans MCP payloads for "suspicious" patterns
- Direct URLs in `evidence_refs` trigger security filters
- Large payloads with many external links are flagged
- The block happens at OpenAI's gateway, NOT our server

**Why server-side sanitization doesn't work**:
- The 403 error occurs BEFORE the request reaches our code
- We never see the blocked request in our logs
- Any server-side validation is too late

### The Solution

**Guided Response**: Educate ChatGPT to construct safe payloads BEFORE making the call.

**Implementation**:
1. **Tool description** (`src/workers/everything-workers.ts`): Detailed guidance with examples
2. **Execution manifest** (`src/workers/manifest-execution.ts`): Critical instructions in the manifest
3. **Clear examples**: Show what works and what doesn't

**Safe patterns**:
```json
{
  "findings": "Analysis shows X. Sources: Reuters (https://...), Bloomberg (https://...)",
  "evidence_refs": [
    {"type": "citation", "source": "Smith 2024", "description": "Study"},
    {"type": "calculation", "source": "see-workpapers", "description": "ROI calc"}
  ],
  "workpapers": [
    {"type": "dataset", "content": "Source: https://...\n\nData: ...", "format": "markdown"}
  ]
}
```

**Unsafe patterns** (will cause 403):
```json
{
  "evidence_refs": [
    {"type": "url", "source": "https://example.com", "description": "..."}
  ]
}
```

**Key rules**:
- ✅ URLs in `findings` text (markdown format)
- ✅ URLs in `workpapers.content` field
- ✅ `evidence_refs` with type="citation", "calculation", "data_source" (NO URLs)
- ❌ URLs in `evidence_refs.source` field
- ❌ `type: "url"` in evidence_refs

## Confidence Calculation Enhancement (2025-10-10)

### The Problem

The original confidence calculation only counted `evidence_ids` from legacy `plan_results`. When ChatGPT followed our guidance to avoid 403 errors by putting URLs in `findings` text instead of `evidence_refs`, the confidence score was artificially low because:

1. **Evidence_refs weren't counted** (only legacy evidence_ids)
2. **Workpapers weren't considered** (high-quality structured evidence)
3. **Findings quality was ignored** (URLs, quantitative data, length)

This created a paradox: ChatGPT followed our safety guidance but got penalized with low confidence scores.

### The Solution

**Enhanced confidence calculation** (`src/workers/session-metrics.ts`) that considers multiple evidence sources:

**Evidence sources counted**:
1. ✅ Legacy `evidence_id` (backward compatibility)
2. ✅ `evidence_refs` from `register_execution_results` (citations, calculations, data sources)
3. ✅ `workpapers` (high-value structured evidence - datasets, calculations, analyses)
4. ✅ `findings` quality indicators:
   - URLs in findings text (external sources)
   - Quantitative data (numbers, percentages, currency)
   - Length and depth

**New formula**:
```
confidence = base + evidence_bonus + content_bonus - quality_penalty

Where:
- base: 0.4 (was 0.5)
- evidence_bonus: +0.05 per unique evidence item (max +0.3)
  - Counts: evidence_ids + evidence_refs + workpapers
- content_bonus: +0.2 max for high-quality findings
  - +0.02 per workpaper (max +0.1)
  - +0.01 per finding with URLs (max +0.05)
  - +0.01 per finding with numbers (max +0.05)
- quality_penalty: -0.2 per evidence_low signal (max -0.4)
```

**Impact**:
- ChatGPT can now reach 85%+ confidence by providing quality findings with URLs and workpapers
- No need to use `evidence_refs` with URLs (which cause 403 errors)
- Workpapers are properly valued as high-quality evidence
- Quantitative analysis is rewarded

**Example**:
```json
{
  "findings": "Market size: $45.2B (CAGR 12.3%). Sources: Gartner (https://...), IDC (https://...)",
  "workpapers": [
    {"type": "calculation", "title": "Market Size Calc", "content": "..."}
  ]
}
```

This would score:
- Base: 0.4
- Evidence bonus: +0.15 (3 items: evidence_id + workpaper + finding)
- Content bonus: +0.07 (workpaper +0.02, URL +0.01, numbers +0.01)
- **Total: 0.62 (62%)** from a single high-quality result

With 4-5 such results per plan × 4 plans = **85%+ confidence easily achievable**.

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

## 🚨 Critical Issues and Solutions (ChatGPT Feedback - 2025-01)

This section documents **5 critical issues** identified through real-world ChatGPT usage and their solutions.

### Issue 1: Schema Validation Rigido (Blocking at Register Phase)

**Problem**: `register_execution_results` uses extremely strict JSON Schema validation with `additionalProperties: false`.

**Common Errors**:
- ❌ Extra field `session_id` in payload → rejected
- ❌ `null` values in optional fields → "None is not of type 'object'"
- ❌ Nested structures with extra keys (e.g., `reliability_score` in `evidence_refs`) → rejected

**Root Cause**: Server rejects ANY argument that doesn't match the exact JSON Schema.

**Solution - Minimal Valid Payload**:
```json
{
  "execution_token": "exec_...",
  "results": [
    {
      "plan_id": "P1r",
      "step_id": "P1r_step_1",
      "findings": "...",
      "workpapers": [],      // Empty array, NOT null
      "evidence_refs": []    // Empty array, NOT null
    }
  ]
}
```

**Rules**:
- ✅ Only include required fields: `plan_id`, `step_id`, `findings`
- ✅ Optional fields can be **omitted entirely** or set to `[]`
- ❌ DO NOT include `session_id` (it's inferred from execution token)
- ❌ DO NOT use `null` for optional fields (use `[]` or omit)
- ❌ DO NOT add extra keys not in schema

**Best Practice**: Start with minimal payload, add optional fields only if needed.

### Issue 2: Moderation Layer Blocking

**Problem**: OpenAI's moderation layer blocks payloads that are:
- Long (tens of thousands of characters in `findings`)
- Contain URLs (especially in `evidence_refs`)
- Contain academic citations with author names + years
- Combine multiple "suspicious" patterns

**Error**: `This tool call was blocked by a moderation check`

**Root Cause**: Moderation happens **BEFORE** the request reaches our server. We never see blocked requests in logs.

**Solution - Safe Payload Construction**:

**✅ SAFE - URLs in findings text**:
```json
{
  "findings": "Analysis shows X. Sources: Reuters (https://reuters.com/article), Bloomberg (https://bloomberg.com/data)",
  "evidence_refs": [
    {"type": "citation", "source": "Reuters 2024", "description": "Market analysis"},
    {"type": "citation", "source": "Bloomberg 2024", "description": "Financial data"}
  ]
}
```

**✅ SAFE - URLs in workpapers**:
```json
{
  "findings": "Market size: $45.2B. See workpapers for sources.",
  "workpapers": [
    {
      "type": "dataset",
      "title": "Data Sources",
      "content": "Gartner: https://gartner.com/report\nIDC: https://idc.com/forecast",
      "format": "markdown"
    }
  ]
}
```

**❌ UNSAFE - URLs in evidence_refs (WILL CAUSE 403)**:
```json
{
  "evidence_refs": [
    {"type": "url", "source": "https://example.com", "description": "..."}  // ❌ BLOCKED
  ]
}
```

**Payload Size Limits**:
- Keep each result under **10KB**
- If registering many steps, **split into multiple calls** with new tokens
- Move large datasets to `workpapers`, not `findings`

**Best Practice**:
1. Put URLs in `findings` text (markdown format: `[title](url)`)
2. Use `evidence_refs` ONLY for non-URL references (citations, calculations)
3. Or OMIT `evidence_refs` entirely and put everything in `findings`

### Issue 3: Session Lifecycle e Race Conditions

**Problem**: Sessions and execution tokens have complex lifecycle rules:
- Execution tokens are **single-use only** (even if registration fails)
- Sessions expire after **24 hours of inactivity**
- Tokens expire after **7 days**
- No retry with same token after validation failure

**Common Errors**:
- `Session terminated` → session expired or closed
- `Execution token already used` → token was consumed in previous attempt
- `Execution token expired` → token older than 7 days

**Solutions**:

**For "token already used"**:
```bash
# Token is consumed even if registration failed
1. Call execute_reasoning_manifest → get NEW token
2. Use new token in register_execution_results
3. DO NOT retry with same token
```

**For "session terminated"**:
```bash
# Session was closed or timed out
1. Verify session_id is correct
2. Check if >24h since last activity
3. Start new session if needed
```

**For "token expired"**:
```bash
# Token older than 7 days
1. Call regenerate_execution_token
2. Use new token (valid for 7 more days)
3. Existing results are preserved
```

**Best Practices**:
- ✅ Register results **incrementally** (one plan at a time)
- ✅ Generate **new token** for each registration batch
- ✅ Use `regenerate_execution_token` for long workflows (>7 days)
- ❌ DO NOT retry with same token after failure
- ❌ DO NOT register all results in one giant batch

### Issue 4: Gestione della Diversità e Pianificazione

**Problem**: Plans are rejected if they don't contain ALL required diversity axes with exact semantic matching.

**Example Rejection**:
```json
// Required axes (from init_parallel_reasoning)
[
  "Mathematical framework",
  "Search strategy",
  "Constraint encoding",
  "Proof style",
  "Data support"
]

// Plan rejected - missing "Data support"
{
  "diversity_axes": [
    "Framework: algebraic",
    "Search: breadth-first",
    "Encoding: explicit",
    "Proof: constructive"
    // ❌ Missing "Data support" axis
  ]
}
```

**Solution - Semantic Matching**:

The server uses **semantic validation** with partial key matching:

```json
// ✅ ACCEPTED - All 5 axes present (semantic match)
{
  "diversity_axes": [
    "Framework: algebraic",           // Matches "Mathematical framework"
    "Search: breadth-first",          // Matches "Search strategy"
    "Encoding: explicit",             // Matches "Constraint encoding"
    "Proof: constructive",            // Matches "Proof style"
    "Data: empirical validation"      // Matches "Data support"
  ]
}
```

**Matching Rules**:
- "Mathematical framework" → key: `mathematical_framework`
- "Framework: algebraic" → key: `framework`
- Match: `framework` is contained in `mathematical_framework` ✓

**Best Practices**:
- ✅ Use **long descriptive forms** in `init_parallel_reasoning`
- ✅ Use **short "Key: Value" forms** in `submit_reasoning_plan`
- ✅ Ensure ALL required axes are covered (semantic match)
- ✅ Ensure ≥2 axes differ from existing plans
- ❌ DO NOT copy exact strings (semantic matching is flexible)

### Issue 5: Limiti Strutturali di Serializzazione

**Problem**: Very large payloads (>25KB JSON) cause:
- Server timeout during parsing
- Moderation layer blocking (more content = higher risk)
- Memory overflow in Durable Objects

**Common Causes**:
- Hundreds of lines in `findings` field
- Complex mathematical notation with escape sequences (`\\prod`, `\\leq`)
- Dozens of results in single batch

**Solutions**:

**1. Compress findings** (≤500 characters):
```json
// ✅ GOOD - Concise findings
{
  "findings": "Proved theorem using algebraic approach. Result: optimal solution exists. See workpapers for proof.",
  "workpapers": [
    {
      "type": "analysis",
      "title": "Complete Proof",
      "content": "[Full mathematical proof with all steps...]",
      "format": "markdown"
    }
  ]
}

// ❌ BAD - Everything in findings (bloated)
{
  "findings": "Step 1: Assume X. Step 2: Apply lemma Y. Step 3: Derive Z. Step 4: ... [5000 characters of proof] ... Therefore optimal solution exists."
}
```

**2. Avoid complex escape sequences**:
```json
// ✅ GOOD - Plain text or markdown
"findings": "Formula: sum(i=1 to n) of x_i <= M"

// ❌ BAD - LaTeX escapes (parsing issues)
"findings": "Formula: \\sum_{i=1}^{n} x_i \\leq M"
```

**3. Split large batches**:
```bash
# Instead of 20 results at once:
Batch 1: Register 5 results (plan P1) → new token
Batch 2: Register 5 results (plan P2) → new token
Batch 3: Register 5 results (plan P3) → new token
Batch 4: Register 5 results (plan P4) → new token
```

**Optimal Payload Structure**:
- `findings`: ≤500 characters (summary)
- `workpapers`: Detailed data, calculations, proofs
- `evidence_refs`: ≤5 items per result
- Batch size: ≤10 results per call

**Best Practices**:
- ✅ Keep `findings` concise (summary only)
- ✅ Move details to `workpapers`
- ✅ Use plain text/markdown (avoid LaTeX)
- ✅ Split into batches of 5-10 results
- ❌ DO NOT put entire analysis in `findings`
- ❌ DO NOT use complex escape sequences

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

## 🛠️ Validation Helpers

Il server fornisce utility di validazione client-side per aiutare ChatGPT a costruire payload validi ed evitare errori comuni. Queste utility sono disponibili in `src/workers/validation-helpers.ts`:

### Funzioni Disponibili

1. **`validateExecutionResults(payload)`** - Valida payload prima della chiamata `register_execution_results`
2. **`sanitizeForModeration(payload)`** - Rimuove URL da `evidence_refs`, li sposta in `findings`
3. **`checkPayloadSize(payload)`** - Calcola dimensione JSON con breakdown per campo
4. **`splitExecutionResults(payload, maxKB)`** - Divide payload grandi in chunk <10KB
   - ⚡ **OTTIMIZZATO**: Pre-calcola dimensioni, usa TextEncoder cached, bin-packing efficiente
   - Gestisce 100+ risultati in <1 secondo
5. **`compressFindings(payload, maxLength)`** - Sposta findings lunghi in workpapers
6. **`checkSessionHealth(token)`** - Valida scadenza token e fornisce warning
7. **`validateDiversityAxes(planAxes, requiredAxes, existingPlans)`** - Valida assi del piano
8. **`suggestDiversityAxes(requiredAxes, existingPlans, preferredValues)`** - Suggerisce assi per nuovi piani
   - 🔧 **ESTESO**: Supporta 8 pattern di separatori (vs, /, ,, -, (), [], :, range)

### Esempio d'Uso

```typescript
import {
  validateExecutionResults,
  sanitizeForModeration,
  suggestDiversityAxes
} from './validation-helpers';

// Prima di submit results
const validation = validateExecutionResults(payload);
if (!validation.valid) {
  console.error('Errori:', validation.errors);
  return;
}

// Sanitizza per moderation
const { sanitized } = sanitizeForModeration(payload);

// Suggerisci assi per nuovo piano
const suggestions = suggestDiversityAxes(requiredAxes, existingPlans);
console.log('Assi suggeriti:', suggestions.suggested_axes);
```

Vedi README.md per documentazione completa e esempi dettagliati.

## ✅ Pre-Invio Checklist for ChatGPT

Before calling `register_execution_results`, verify:

### Schema Validation
- [ ] Payload contains ONLY required fields: `execution_token`, `results`
- [ ] Each result has: `plan_id`, `step_id`, `findings`
- [ ] Optional fields are `[]` (empty array) or omitted, NOT `null`
- [ ] NO extra fields like `session_id`, `reasoning_trace` (unless explicitly needed)

### Moderation Safety
- [ ] URLs are in `findings` text or `workpapers.content`, NOT in `evidence_refs`
- [ ] No `type: "url"` in `evidence_refs` array
- [ ] Academic citations use `type: "citation"` with author/year in `source` field
- [ ] Payload size <10KB per result (check with `JSON.stringify(result).length`)

### Session Lifecycle
- [ ] Using a FRESH execution token (not previously used)
- [ ] Token is <7 days old (or regenerated with `regenerate_execution_token`)
- [ ] Session is active (<24h since last activity)

### Payload Size
- [ ] `findings` field is ≤500 characters (summary only)
- [ ] Detailed data moved to `workpapers`
- [ ] No complex escape sequences (`\\prod`, `\\leq`) - use plain text
- [ ] Batch size ≤10 results per call

### Diversity Axes (for `submit_reasoning_plan`)
- [ ] Plan includes ALL required diversity axes (semantic match)
- [ ] Plan differs from existing plans on ≥2 axes
- [ ] Using "Key: Value" format for axes

### Example Valid Payload

```json
{
  "execution_token": "exec_bonza-001_1760100180012_qnyf6",
  "results": [
    {
      "plan_id": "P1r",
      "step_id": "P1r_step_1",
      "findings": "Market size: $45.2B (CAGR 12.3%). Sources: Gartner (https://gartner.com/report), Bloomberg (https://bloomberg.com/data). See workpapers for calculations.",
      "evidence_refs": [
        {
          "type": "citation",
          "source": "Gartner 2024",
          "description": "Market analysis report"
        },
        {
          "type": "calculation",
          "source": "see-workpapers",
          "description": "Market size calculation"
        }
      ],
      "workpapers": [
        {
          "type": "calculation",
          "title": "Market Size Calculation",
          "content": "Base (2020): $32B\nGrowth rate: 12.3%\nYears: 4\nFormula: $32B * (1.123^4) = $45.2B\n\nSources:\n- Gartner: https://gartner.com/report\n- Bloomberg: https://bloomberg.com/data",
          "format": "markdown"
        }
      ]
    }
  ]
}
```

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

## Code reference map
- `src/workers/examples/capability-integration-example.ts` – capability orchestration, evidence handling, and tournament kernel reference.
- `examples/parallel-reasoning-v5-example.ts` – runnable manifest workflow covering every MCP tool.
- `examples/peer-review-example.ts` – peer review lifecycle with critiques, mediation, and evidence capture.
- `src/workers/deprecated/agent-personas.ts` – preserved for historical context; superseded by capability modules in v3.0.
- `src/workers/deprecated/parallel-reasoning-engine.ts` – legacy engine replaced by `parallel-reasoning-mcp.ts` and manifest tooling in v5.0.
- Preferred replacements live under `src/workers/capabilities/` and `src/workers/parallel-reasoning-mcp.ts`; keep future work aligned there.
