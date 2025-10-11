# 🧠 MCP PTU Server

An MCP-compliant Cloudflare Worker that helps ChatGPT coordinate structured, multi-path reasoning sessions. The server keeps session state in a Durable Object, enforces diversity across plans, records evidence, and reports real-time quality metrics so the model can self-regulate its workflow.

## 🆕 What's New (January 2025)

### 🎯 Self-Assessment Approach (v5.9.0+) - NO MORE 403 ERRORS!

**MAJOR CHANGE**: ChatGPT now **counts evidence** and **self-evaluates quality** instead of sending textual content.

**Why this is revolutionary**:
- ✅ **10x smaller payload** (only numbers) → **NO 403 errors** from OpenAI gateway
- ✅ **NO batching needed** (payload always small enough)
- ✅ **Self-correction loop** (ChatGPT knows if evidence is insufficient and can improve)
- ✅ **Honest evaluation** (ChatGPT takes responsibility for quality verification)

**How it works**:
1. ChatGPT executes ALL steps using native tools (web search, Python, code interpreter)
2. ChatGPT **counts** evidence items (sources, datapoints, workpapers)
3. ChatGPT **self-evaluates** quality honestly (confidence, coverage)
4. ChatGPT calls `register_execution_results` with **self-assessment** (counts + evaluation)
5. Server validates and provides immediate feedback

**Example payload** (tiny, safe, no 403 errors):
```json
{
  "execution_token": "exec_...",
  "self_assessment": {
    "total_evidence_items": 45,
    "external_sources": 12,
    "quantitative_datapoints": 23,
    "workpapers_created": 8,
    "estimated_confidence": 0.82,
    "estimated_coverage": 0.96,
    "meets_confidence_threshold": false,
    "gaps_identified": ["Missing external validation for EV claims"]
  },
  "results": [{
    "plan_id": "P1",
    "step_id": "step_1",
    "evidence_count": 3,
    "summary": "12 journeys. Leakage 12-25%. Sources: NNG, Baymard."
  }]
}
```

**Benefits**:
- 🚫 **NO MORE 403 "safety" blocks** (payload too small to trigger filters)
- 🚫 **NO MORE batching complexity** (single call for all results)
- 🚫 **NO MORE URL handling issues** (no URLs in payload)
- ✅ **ChatGPT self-corrects** (knows when to add more evidence)
- ✅ **Server validates honesty** (compares declared vs calculated metrics)

### Previous Features (Still Active)

**Session Registry Integration**:
- `/api/register-results` correctly routes to the same Durable Object that created the session
- Mapping `session_id → DO_ID` registered in global SessionRegistry

**Enhanced Evidence Quality Guidance**:
- `list_plan_status` shows evidence quality report with self-assessment validation
- Server compares ChatGPT's self-evaluation with calculated metrics

**Constructive Disagreement Rewarded**:
- Consensus calculation values well-argued disagreement over shallow agreement
- Quality bonuses for: claims_challenged (+0.20), falsification_tests (+0.25), residual_risks (+0.15)

**Meta-Reflection Analysis**:
- `generate_meta_reflection` analyzes patterns in disagreements
- Identifies low-confidence decisions and provides actionable recommendations

## Key capabilities
- **Parallel reasoning orchestration** – create, execute, critique, and finalize reasoning plans through dedicated MCP tools.
- **Evidence ledger** – every piece of evidence recorded during plan execution is registered automatically with traceable IDs.
- **Dynamic quality metrics** – confidence, coverage, and consensus scores are calculated from session data and surfaced during finalization.
- **Session persistence** – the `/proxy` endpoint forwards requests to the correct Durable Object using the `session_id`, removing the need for custom headers in clients that cannot set them.

## Architecture snapshot
| Layer | Purpose |
| --- | --- |
| `src/workers/index.ts` | HTTP entry point that routes requests to the Durable Object. |
| `src/workers/session.ts` | Durable Object that stores parallel reasoning sessions and orchestrates tool calls. |
| `src/workers/parallel-reasoning-mcp.ts` | Session manager with plan lifecycle logic, evidence registration, and quality metrics. |
| `src/workers/everything-workers.ts` | Registers MCP tools exposed by the server. |
| `src/workers/session-metrics.ts` | Implements confidence, coverage, and consensus calculations. |

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Type-check the project**
   ```bash
   npm run build
   ```
3. **Run the test suite**
   ```bash
   npm test
   ```
4. **Launch a local worker**
   ```bash
   npm run workers:dev
   ```

The project targets Node.js 20+ and Wrangler 4.40+. Cloudflare account credentials must be configured for `wrangler dev` and `wrangler deploy`.

## Testing & diagnostics
- `npm test` / `npm run test:integration` – unit and integration coverage for workers and Durable Objects.
- `./test-simple-direct-api.sh` – smoke tests the `/api/register-results` fallback (session extraction + moderation safety).
- `./test-direct-api.sh` – end-to-end manifest workflow for the direct API; last validated 2025-10-10 (token parsing, manifest instructions, internal routing all green).
- `./test-403-fix.sh` – regression check ensuring sanitized `evidence_refs` avoid OpenAI 403 blocks.
- `./scripts/test-parallel-reasoning-simple.sh` – Durable Object persistence smoke test (requires `npm run workers:dev`).
- `./scripts/test-parallel-reasoning-fix.sh` – verbose MCP run useful when debugging session lifecycle issues.

## MCP endpoints
The server implements the standard MCP transport plus a convenience proxy:
- `POST /mcp` – canonical MCP entry point (requires `mcp-session-id` header).
- `POST /proxy` – extracts the parallel reasoning `session_id` from the request body and forwards to `/mcp` with the correct header.
- `POST /api/register-results` – **DIRECT API** for registering execution results; extracts `session_id` from the `execution_token` and avoids stale MCP sessions or moderation-triggered 403s.

### MCP Tools (for ChatGPT)
Within the MCP session the following tools drive the workflow:

**Core Workflow Tools** (9 steps):
1. `init_parallel_reasoning` – declare a new reasoning workflow and expected diversity axes.
2. `submit_reasoning_plan` – register a plan path (submit 3-4 diverse plans).
3. `execute_reasoning_manifest` – generate execution manifest for batch execution of all steps.
4. **`register_execution_results`** – **NEW: Self-assessment based registration**. ChatGPT counts evidence and self-evaluates quality honestly. Server validates and provides feedback.
5. `submit_peer_critique` – critique other plans with falsification tests.
6. `submit_mediation_decision` – make mediation decisions between conflicting plans.
7. `generate_meta_reflection` – analyze patterns in disagreements.
8. `check_session_readiness` – verify if session meets quality thresholds (75%/85%/70%) before finalization.
9. `finalize_parallel_reasoning` – close the session, returning quality metrics.

**Step 4 Details** (Self-Assessment):
- ChatGPT executes ALL steps using native tools (web search, Python, code interpreter)
- ChatGPT **counts** evidence: sources, datapoints, workpapers
- ChatGPT **self-evaluates**: estimated confidence, coverage, gaps
- ChatGPT calls `register_execution_results` with counts + self-assessment
- Server validates honesty and provides immediate feedback
- **NO 403 errors** (payload is tiny, only numbers)
- **NO batching needed** (single call for all results)

**Monitoring Tools** (call frequently):
- **`list_plan_status`** – **PRIMARY tool for tracking progress**. Shows current coverage/confidence/consensus %, self-assessment validation, evidence quality report, and actionable next steps.
- **Workflow checklist in every response** – each MCP tool reply now includes a live checklist that marks completed steps and highlights the next required tool call, so the agent always knows how to continue.

**Utility Tools**:
- `regenerate_execution_token` – regenerate expired execution token (after 7 days).

All tools accept a `session_id` parameter. Reuse the same value throughout a workflow to keep state aligned.

### ⚠️ Critical: MCP Session Lifecycle in ChatGPT Developer Mode

**The Problem**: ChatGPT in developer mode closes the MCP connection after EVERY tool call by sending `DELETE /mcp`. The official MCP transport (`@modelcontextprotocol/sdk`) marks the session as terminated when it receives DELETE. When ChatGPT tries to reuse the same `session_id` for the next request, the transport sees the session as closed and returns:

```
JSON-RPC error code: -32600
message: "Session terminated"
```

**Why This Happens**:
1. ChatGPT calls tool → Worker routes to Durable Object → Tool executes successfully
2. ChatGPT sends `DELETE /mcp` → Transport calls `_onsessionclosed` and `close()` → Session marked as terminated
3. ChatGPT calls next tool with same `session_id` → Transport rejects: "Session terminated"

**The Workaround**: The worker has code to reinject the session header (src/workers/session.ts:252-259), but it **cannot reopen a session that the transport has already closed**.

**The Solution**: Use the HTTP API `/api/register-results` for critical operations (especially `register_execution_results`). This endpoint:
- Bypasses MCP session management entirely
- Extracts `session_id` from the `execution_token`
- Routes directly to the Durable Object
- Avoids `-32600` errors completely

**Best Practices**:
- Use MCP tools for lightweight operations (init, submit plans, status checks)
- Use `/api/register-results` for heavy operations (registering execution results)
- Complete workflows quickly to minimize connection closures
- If you get "Session terminated", the workflow CANNOT be recovered - start over
- Run `./test-simple-direct-api.sh` to verify the HTTP API is healthy

### Best practice: Use list_plan_status frequently
Call `list_plan_status` after submitting plans and during execution to:
- See current progress toward finalization thresholds (coverage ≥85%, confidence ≥75%, consensus ≥70%)
- Identify specific gaps that need to be filled
- Get actionable recommendations for next steps
- Track which plans need more execution

This tool provides a **readiness preview** that guides your workflow and prevents premature finalization attempts.

### Best practice: Execute plan steps with detailed tasks
When calling `execute_plan_step`, the `task` parameter must describe **WHAT ANALYSIS TO PERFORM** in detail, not just a label.

**GOOD Example** (triggers real reasoning + tool use):
```json
{
  "task": "Analyze the top 5 competitors in the B2B SaaS healthcare market. For each: 1) Identify their primary product, 2) Estimate annual revenue using web search, 3) List key differentiators, 4) Analyze pricing strategy. Provide specific data and sources."
}
```

**BAD Example** (too vague, won't trigger deep reasoning):
```json
{
  "task": "competitor analysis"
}
```

**Why this matters**:
- Detailed tasks → System uses reasoning + tools → High-quality evidence → Higher confidence score
- Vague tasks → System just returns text → Low-quality evidence → Lower confidence score

### Understanding confidence scores

Confidence is calculated as:
```
confidence = 0.5 (base) + min(0.3, evidence_count * 0.1) - min(0.4, evidence_low_count * 0.2)
```

**Common issue**: You have many evidence IDs but confidence is still low (e.g., 40%).

**Root cause**: Too many `evidence_low` quality signals from vague tasks.

**Example scenario**:
- 26 evidence IDs → +30% bonus (max reached)
- But confidence = 40% → means -40% penalty (max penalty)
- Formula: 50% + 30% - 40% = 40% ✓

**Solution**: Call `list_plan_status` to see the diagnostic. It will show:
```
⚠️ CRITICAL: You have 26 evidence IDs but confidence is still low (40%).
This means your evidence has LOW QUALITY signals - the system detected that your
execute_plan_step tasks were too vague or didn't trigger real reasoning.
```

Then re-execute steps with MUCH MORE DETAILED task descriptions.

## Semantic diversity validation
The server uses **semantic validation** for diversity axes, enabling more flexible plan differentiation:

### How it works
- Axes are parsed as **Key: Value** pairs (e.g., `"Tech Stack: Hybrid"` → `{key: "tech_stack", value: "hybrid"}`)
- **Required axes**: Plans must include axes with matching **keys** (values can differ)
- **Inter-plan diversity**: Plans must differ on ≥2 axes semantically (same key + different value = different)
- **Flexible naming**: Supports both long descriptive forms and short abbreviated forms with **partial key matching**

### Example: Basic semantic matching
```json
{
  "required_diversity_axes": ["Tech Stack: Cloud", "Data Sources: Official"],
  "plan_A": {
    "diversity_axes": ["Tech Stack: Hybrid", "Data Sources: Primary research"]
  },
  "plan_B": {
    "diversity_axes": ["Tech Stack: On-premise", "Data Sources: Expert interviews"]
  }
}
```
Both plans satisfy required axes (matching keys) and differ on 2 axes (different values) ✅

### Example: Flexible naming with partial matching
```json
{
  "required_diversity_axes": [
    "Postura verso l'AGCM (accettazione vs contestazione)",
    "Ampiezza del rimedio economico ai clienti",
    "Grado di apertura dei dati (trasparenza radicale vs disclosure minima)"
  ],
  "plan": {
    "diversity_axes": [
      "Postura: accettazione piena",
      "Rimedio: ampio e proattivo",
      "Apertura: trasparenza radicale"
    ]
  }
}
```
**How matching works**:
- "Postura verso l'AGCM..." → key: `postura_agcm`
- "Postura: accettazione" → key: `postura`
- Match: `postura` is contained in `postura_agcm` ✓
- "Grado di apertura dei dati" → key: `grado_apertura_dati`
- "Apertura: radicale" → key: `apertura`
- Match: `apertura` is contained in `grado_apertura_dati` ✓

### Diversity axes examples by domain

#### Business Strategy
```json
{
  "required_diversity_axes": [
    "Market Positioning: Premium vs Budget",
    "Growth Strategy: Organic vs Acquisition",
    "Risk Appetite: Conservative vs Aggressive",
    "Time Horizon: Short-term (1-2y) vs Long-term (5-10y)",
    "Geographic Focus: Local vs Global"
  ]
}
```

**Example plans**:
- **Plan A (Conservative Growth)**: `["Positioning: Premium", "Growth: Organic", "Risk: Conservative", "Horizon: Long-term", "Focus: Local"]`
- **Plan B (Aggressive Expansion)**: `["Positioning: Budget", "Growth: Acquisition", "Risk: Aggressive", "Horizon: Short-term", "Focus: Global"]`

#### Technical Architecture
```json
{
  "required_diversity_axes": [
    "Tech Stack: Cloud-native vs Hybrid vs On-premise",
    "Data Architecture: Centralized vs Distributed",
    "Security Model: Zero-trust vs Perimeter-based",
    "Scalability Approach: Vertical vs Horizontal",
    "Integration Pattern: API-first vs Event-driven"
  ]
}
```

**Example plans**:
- **Plan A (Cloud-first)**: `["Stack: Cloud-native", "Data: Distributed", "Security: Zero-trust", "Scale: Horizontal", "Integration: Event-driven"]`
- **Plan B (Hybrid)**: `["Stack: Hybrid", "Data: Centralized", "Security: Perimeter-based", "Scale: Vertical", "Integration: API-first"]`

#### Scientific Research
```json
{
  "required_diversity_axes": [
    "Methodology: Experimental vs Observational vs Theoretical",
    "Data Sources: Primary vs Secondary vs Meta-analysis",
    "Statistical Approach: Frequentist vs Bayesian",
    "Scope: Exploratory vs Confirmatory",
    "Validation: Cross-validation vs Hold-out vs Bootstrap"
  ]
}
```

**Example plans**:
- **Plan A (Experimental)**: `["Method: Experimental", "Data: Primary", "Stats: Frequentist", "Scope: Confirmatory", "Validation: Cross-validation"]`
- **Plan B (Meta-analysis)**: `["Method: Theoretical", "Data: Meta-analysis", "Stats: Bayesian", "Scope: Exploratory", "Validation: Bootstrap"]`

#### Product Development
```json
{
  "required_diversity_axes": [
    "Development Approach: Agile vs Waterfall vs Hybrid",
    "User Research: Qualitative vs Quantitative vs Mixed",
    "Feature Prioritization: User-driven vs Business-driven vs Data-driven",
    "Release Strategy: Continuous vs Staged vs Big-bang",
    "Quality Assurance: Automated vs Manual vs Hybrid"
  ]
}
```

**Example plans**:
- **Plan A (Agile/User-centric)**: `["Approach: Agile", "Research: Qualitative", "Priority: User-driven", "Release: Continuous", "QA: Automated"]`
- **Plan B (Waterfall/Business-centric)**: `["Approach: Waterfall", "Research: Quantitative", "Priority: Business-driven", "Release: Big-bang", "QA: Manual"]`

### Best practices for formulating diversity axes

1. **Use "Key: Value" format** for clarity:
   - ✅ `"Tech Stack: Cloud-native"`
   - ❌ `"cloud-native tech stack"` (harder to parse)

2. **Make keys descriptive but concise**:
   - ✅ `"Risk Appetite: Conservative"`
   - ❌ `"The level of risk that the organization is willing to accept: Conservative"` (too verbose)

3. **Provide clear value options** in required axes:
   - ✅ `"Market Positioning: Premium vs Budget vs Mid-market"`
   - ❌ `"Market Positioning"` (no guidance on values)

4. **Ensure axes are truly independent**:
   - ✅ `["Tech Stack: Cloud", "Security: Zero-trust"]` (independent dimensions)
   - ❌ `["Tech Stack: Cloud", "Cloud Provider: AWS"]` (second depends on first)

5. **Use domain-appropriate terminology**:
   - Business: Market, Strategy, Risk, Growth, Revenue
   - Technical: Architecture, Stack, Pattern, Protocol, Framework
   - Scientific: Methodology, Data, Analysis, Validation, Hypothesis

### Benefits
- No need to copy exact strings from `required_diversity_axes`
- Use long descriptive forms in `init`, short forms in plans
- Focus on substantive differences, not syntax
- Supports multiple languages (English, Italian, etc.)
- Rejected plans are stored for audit and cross-contamination

## Quality metrics and thresholds
The server enforces quality thresholds to prevent premature finalization:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Confidence** | ≥75% | Weighted by evidence volume and quality signals |
| **Coverage** | ≥85% | Ratio of executed capability steps to plan commitments |
| **Consensus** | ≥70% | Balance of positive vs. conflicting peer reviews |

### Enforcement behavior
- `check_session_readiness` reports which thresholds are met/unmet
- `finalize_parallel_reasoning` **blocks finalization** if any threshold is unmet
- Blocking warnings explain which metrics need improvement and provide actionable next steps
- Sessions can only finalize when all structural requirements AND quality thresholds are satisfied

## Validation Helpers

The server provides client-side validation utilities to help ChatGPT construct valid payloads and avoid common errors. These utilities are available in `src/workers/validation-helpers.ts`:

### Available Functions

1. **`validateExecutionResults(payload)`** - Validates payload before `register_execution_results` call
   - Checks for extra fields (e.g., `session_id`)
   - Detects null values in optional fields
   - Warns about URLs in `evidence_refs` (causes 403)
   - Checks payload size

2. **`sanitizeForModeration(payload)`** - Removes URLs from `evidence_refs`, moves to `findings`
   - Automatically detects `type: "url"` references
   - Moves URLs to findings text
   - Returns list of changes made

3. **`checkPayloadSize(payload)`** - Calculates JSON size with breakdown by field
   - Shows total size in bytes and KB
   - Breaks down size by field
   - Warns if exceeds 10KB limit

4. **`splitExecutionResults(payload, maxKB)`** - Splits large payloads into <10KB chunks
   - **OPTIMIZED**: Pre-calculates result sizes to avoid repeated JSON.stringify calls
   - **OPTIMIZED**: Uses cached TextEncoder for better performance
   - **OPTIMIZED**: Implements efficient bin-packing algorithm
   - Groups results by `plan_id` when possible
   - Preserves execution token
   - Returns array of smaller payloads
   - Handles very large payloads (100+ results) efficiently (<1s)

5. **`compressFindings(payload, maxLength)`** - Moves long findings to workpapers
   - Compresses findings longer than threshold
   - Creates workpapers automatically
   - Returns compressed payload

6. **`checkSessionHealth(token)`** - Validates token expiry and provides warnings
   - Parses token structure
   - Calculates time until expiry
   - Suggests using `regenerate_execution_token`

7. **`validateDiversityAxes(planAxes, requiredAxes, existingPlans)`** - Validates plan axes
   - Checks minimum 2 axes
   - Validates all required axes present (semantic match)
   - Checks ≥2 axes differ from each existing plan

8. **`suggestDiversityAxes(requiredAxes, existingPlans, preferredValues)`** - Suggests axes for new plans
   - **EXTENDED**: Supports 8 separator patterns for value extraction:
     * "vs" separator: `"Cloud vs Hybrid vs On-premise"`
     * Slash separator: `"Cloud/Hybrid/On-premise"`
     * Comma separator: `"Primary, Secondary, Tertiary"`
     * Dash separator: `"Short-term - Long-term"`
     * Parentheses: `"(Option A vs Option B)"`
     * Brackets: `"[Option A, Option B]"`
     * Colon lists: `"Options: A, B, C"`
     * Range notation: `"1-5 years"` (extracts endpoints)
   - Analyzes required axes and existing plans
   - Suggests values that maximize diversity
   - Provides diversity preview vs existing plans

### Usage Example

```typescript
import {
  validateExecutionResults,
  sanitizeForModeration,
  checkPayloadSize,
  suggestDiversityAxes
} from './validation-helpers';

// Before submitting results
const payload = { execution_token: 'exec_...', results: [...] };

// 1. Validate payload
const validation = validateExecutionResults(payload);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// 2. Sanitize for moderation
const { sanitized, changes } = sanitizeForModeration(payload);
console.log('Moderation changes:', changes);

// 3. Check size
const sizeCheck = checkPayloadSize(sanitized);
if (sizeCheck.exceeds_limit) {
  console.warn('Payload too large, splitting...');
  const { chunks } = splitExecutionResults(sanitized, 10);
  // Submit chunks separately
}

// 4. Suggest diversity axes for new plan
const suggestions = suggestDiversityAxes(
  ['Tech Stack: Cloud vs Hybrid', 'Data Sources: Primary vs Secondary'],
  existingPlans,
  { tech_stack: 'On-premise' } // Optional preferred values
);
console.log('Suggested axes:', suggestions.suggested_axes);
console.log('Diversity preview:', suggestions.diversity_preview);
```

## Troubleshooting Common Issues

### Quick Wins
- **400 "Server not initialized"** – call `initialize` before using `tools/call`, or let `/proxy` perform the handshake automatically.
- **406 "Client must accept..."** – include `Accept: application/json, text/event-stream` in every MCP request.
- **"Session not found"** – ensure the same `session_id` is passed to all parallel reasoning tools in the workflow.

### Known Issues and Solutions

#### 1. Schema Validation Errors (32600 Invalid Request)

**Symptom**: `register_execution_results` fails with "Invalid Request" or "None is not of type 'object'"

**Root Cause**: The server uses strict JSON Schema validation (`additionalProperties: false`). Common issues:
- Extra fields like `session_id` in the payload (not allowed)
- `null` values in optional fields (use empty arrays `[]` instead)
- Incorrect types in nested structures (`evidence_refs`, `workpapers`)

**Solution**:
```json
// ✅ CORRECT - Minimal valid payload
{
  "execution_token": "exec_...",
  "results": [
    {
      "plan_id": "P1",
      "step_id": "P1_step_1",
      "findings": "Detailed analysis...",
      "evidence_refs": [],  // Empty array, not null
      "workpapers": []      // Empty array, not null
    }
  ]
}

// ❌ WRONG - Extra fields or null values
{
  "execution_token": "exec_...",
  "session_id": "bonza-001",  // ❌ Extra field
  "results": [
    {
      "plan_id": "P1",
      "step_id": "P1_step_1",
      "findings": "...",
      "evidence_refs": null,  // ❌ Should be []
      "workpapers": null      // ❌ Should be []
    }
  ]
}
```

**Best Practice**: Only include required fields (`plan_id`, `step_id`, `findings`). Optional fields can be omitted entirely or set to empty arrays.

#### 2. Moderation Layer Blocking (403 Safety Error)

**Symptom**: `This tool call was blocked by a moderation check`

**Root Cause**: OpenAI's security filters block payloads containing:
- URLs in `evidence_refs` field
- Long text blocks with academic citations
- Pattern combinations like `https://` + author names

**Solution**: Put URLs in `findings` text or `workpapers.content`, NOT in `evidence_refs`:

```json
// ✅ CORRECT - URLs in findings text
{
  "findings": "Market analysis from Gartner (https://gartner.com/report) shows $45.2B market size. Bloomberg (https://bloomberg.com/article) confirms 12.3% CAGR.",
  "evidence_refs": [
    {"type": "citation", "source": "Gartner 2024", "description": "Market report"},
    {"type": "citation", "source": "Bloomberg 2024", "description": "Industry analysis"}
  ],
  "workpapers": [
    {
      "type": "dataset",
      "title": "Market Data Sources",
      "content": "Gartner: https://gartner.com/report\nBloomberg: https://bloomberg.com/article",
      "format": "markdown"
    }
  ]
}

// ❌ WRONG - URLs in evidence_refs (causes 403)
{
  "findings": "Market analysis shows...",
  "evidence_refs": [
    {"type": "url", "source": "https://gartner.com/report", "description": "..."}  // ❌ Blocked
  ]
}
```

**Payload Size Limit**: Keep each result under 10KB. If registering many steps, split into multiple calls with new tokens.

#### 3. Session Lifecycle and Token Issues

**Symptom**: `Session terminated` or `Execution token already used`

**Root Causes**:
- Execution tokens are **single-use only** - once used (successfully or not), they cannot be reused
- Sessions expire after 24 hours of inactivity
- Token expires after 7 days

**Solutions**:

**For "token already used"**:
```bash
# Generate a new token before retrying
1. Call execute_reasoning_manifest again → get new token
2. Use the NEW token in register_execution_results
```

**For "session terminated"**:
```bash
# Session was closed or timed out
1. Verify session_id is correct
2. Check if session expired (24h+ inactivity)
3. Start a new session if needed
```

**Best Practice**:
- Register results incrementally (one plan at a time) instead of all at once
- Generate new token for each registration batch
- Use `regenerate_execution_token` for long-running workflows (>7 days)

#### 4. Diversity Axes Validation Failures

**Symptom**: Plan rejected with "Plan must include required diversity axes"

**Root Cause**: Server requires **exact semantic matching** of diversity axes. Plans must:
- Include ALL required axes (matching keys, values can differ)
- Differ from existing plans on ≥2 axes

**Solution**: Use semantic key matching with partial matches:

```json
// ✅ CORRECT - Semantic matching
{
  "required_diversity_axes": [
    "Mathematical framework (algebraic vs geometric)",
    "Search strategy (breadth-first vs depth-first)",
    "Constraint encoding (explicit vs implicit)"
  ],
  "plan": {
    "diversity_axes": [
      "Framework: algebraic",      // Matches "Mathematical framework"
      "Search: breadth-first",     // Matches "Search strategy"
      "Encoding: explicit"         // Matches "Constraint encoding"
    ]
  }
}

// ❌ WRONG - Missing required axes
{
  "plan": {
    "diversity_axes": [
      "Framework: algebraic",
      "Approach: iterative"  // ❌ Doesn't match any required axis
    ]
  }
}
```

**Best Practice**: Use short "Key: Value" format in plans, long descriptive format in `init_parallel_reasoning`.

#### 5. Payload Size and Serialization Limits

**Symptom**: Timeout or parsing errors with large payloads (>25KB)

**Root Cause**: Very large JSON payloads cause:
- Server timeout during parsing
- Moderation layer blocking (more content = higher risk)
- Memory issues in Durable Objects

**Solutions**:

**Compress findings** (move details to workpapers):
```json
// ✅ GOOD - Concise findings, details in workpapers
{
  "findings": "Market size: $45.2B (CAGR 12.3%). See workpapers for calculations.",
  "workpapers": [
    {
      "type": "calculation",
      "title": "Market Size Calculation",
      "content": "Base (2020): $32B\nGrowth rate: 12.3%\nYears: 4\nFormula: $32B * (1.123^4) = $45.2B",
      "format": "markdown"
    }
  ]
}

// ❌ BAD - Everything in findings (bloated)
{
  "findings": "Market size calculation: Base (2020) was $32B. Applied 12.3% CAGR over 4 years using compound growth formula. Year 1: $32B * 1.123 = $35.94B. Year 2: $35.94B * 1.123 = $40.36B. Year 3: $40.36B * 1.123 = $45.32B. Year 4: $45.32B * 1.123 = $50.89B. Final result: $45.2B in 2024. Sources: Gartner report (https://...), Bloomberg analysis (https://...), IDC forecast (https://...)..."
}
```

**Split large batches**:
```bash
# Instead of registering 20 steps at once:
1. Register steps 1-5 (plan P1) → get new token
2. Register steps 6-10 (plan P2) → get new token
3. Register steps 11-15 (plan P3) → get new token
4. Register steps 16-20 (plan P4) → get new token
```

**Best Practices**:
- Keep `findings` under 500 characters
- Use `workpapers` for detailed data, calculations, long citations
- Avoid complex escape sequences (`\\prod`, `\\leq`) - use plain text or markdown
- Register results in batches of 5-10 steps maximum

## Reference examples
- `src/workers/examples/capability-integration-example.ts` – illustrates capability orchestration, evidence handling, and tournament kernel usage.
- `examples/parallel-reasoning-v5-example.ts` – runnable manifest-based parallel reasoning walkthrough.
- `examples/peer-review-example.ts` – demonstrates the peer review tooling flow.
- `__tests__/` – executable suites covering capabilities, parallel reasoning, peer review, and session persistence.

## Deprecated modules
- `src/workers/deprecated/agent-personas.ts` – persona-based workflow replaced by capability-driven architecture in v3.0.
- `src/workers/deprecated/parallel-reasoning-engine.ts` – legacy engine superseded by `parallel-reasoning-mcp.ts` in v5.0.
- Preferred replacements live under `src/workers/capabilities/` and `src/workers/parallel-reasoning-mcp.ts`.
- Deprecated code remains read-only for migration context and is slated for removal in v6.0 once external usage ends.

## OpenAI Apps SDK Compatibility

This server is **architecturally compatible** with [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) for building ChatGPT apps. The MCP protocol implementation, tool system, and UI layer align with Apps SDK requirements.

**Current Status**: ~70% compatible
**Required Changes**: Adapt tool response format to include `_meta.openai/outputTemplate` metadata

Compatibility notes are documented inline throughout the repository; continue aligning tool responses before enabling Apps SDK mode.

## Additional resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- `AGENT.md` – consolidated operational playbook for contributors and AI agents.
