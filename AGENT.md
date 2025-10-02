# 🤖 MCP PTU Server - Agent Guidelines

**Version 5.8.0** | For AI Agents Working on This Repository

This document provides rules, guidelines, and technical context for AI agents (like you) working on this codebase.

---

## 🔧 Recent Fixes

### v5.8.0 - Dynamic Quality Metrics & Evidence Ledger Integration (2025-10-02)

**NEW FEATURES**: Real-time quality metrics calculation and automatic evidence ledger registration.

#### Problem Statement

Users requested:
1. **Evidence ID Validation Issue**: Mediation decisions were being rejected because automatically generated evidence IDs weren't registered in the evidence ledger
2. **Placeholder Metrics**: Quality indicators (confidence, coverage, consensus) were cosmetic values that didn't provide actionable feedback or guide workflow behavior

#### Solutions Implemented

##### 1. Evidence Ledger Integration

**Problem**: `recordPlanResult()` generated evidence IDs in format `{session_id}:{plan_id}:step{N}` but didn't register them in the evidence ledger. When mediation decisions referenced these IDs, validation failed because `ledger.getEntry(id)` returned `undefined`.

**Root Cause**:
```typescript
// Evidence ID generated but not registered
const evidence_id = `${session_id}:${plan_id}:step${stepNumber}`;
// Ledger validation failed
if (!ledger.getEntry(evidence_id)) {
  throw new Error('Evidence ID not found');
}
```

**Solution**:
- Added `evidenceLedger` property to `ParallelReasoningSessionManager`
- Added `setEvidenceLedger()` method to configure the ledger
- Modified `recordPlanResult()` to automatically register evidence IDs
- Enhanced `EvidenceLedger.addEvidence()` to accept custom IDs via optional `customId` parameter
- Configured manager with evidence ledger in `createServer()`

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Added evidence ledger integration
- `src/workers/evidence-ledger.ts` - Added `customId` parameter to `addEvidence()`
- `src/workers/everything-workers.ts` - Configure manager with ledger
- `__tests__/evidence-registration.test.ts` - NEW: Comprehensive test suite (8 tests)

**Result**: Evidence IDs are now automatically registered and validated successfully ✅

##### 2. Dynamic Quality Metrics

**Problem**: Quality indicators were placeholder values that didn't reflect actual session data or provide actionable guidance.

**Solution**: Implemented real-time metric calculation based on session data.

**Architecture**:
- **New Module**: `src/workers/session-metrics.ts` - Metric calculation functions
- **Integration**: Metrics computed during finalization
- **Storage**: Metrics cached in session state
- **Display**: Shown in finalization with thresholds and recommendations

**Metrics Implemented**:

1. **Confidence** (0-1, threshold: 0.6)
   ```typescript
   confidence = base + evidence_bonus - quality_penalty
   // base: 0.5
   // evidence_bonus: +0.1 per unique evidence ID (max +0.3)
   // quality_penalty: -0.2 per evidence_low signal (max -0.4)
   ```

2. **Coverage** (0-1, threshold: 0.8)
   ```typescript
   coverage = executed_steps / total_declared_steps
   ```

3. **Consensus** (0-1, threshold: 0.5)
   ```typescript
   consensus = (agreements - conflicts) / total_interactions
   // agreements: critiques with agreement_score > 0.7
   // conflicts: critiques with agreement_score < 0.4
   // normalized to [0, 1]
   ```

**Files Modified**:
- `src/workers/session-metrics.ts` - NEW: Metric calculation module
- `src/workers/parallel-reasoning-mcp.ts` - Added `metrics` field to session interface, `computeMetrics()` method
- `src/workers/guided-responses.ts` - Enhanced finalization display with metrics
- `src/workers/parallel-reasoning-tools-v5.ts` - Pass metrics to guided responses
- `__tests__/session-metrics.test.ts` - NEW: Comprehensive test suite (15 tests)

**Display Example**:
```
📊 Quality Metrics
- Confidence: 75.0% ✅ (3 evidence, 0 quality issues)
- Coverage: 87.5% ✅ (14/16 steps)
- Consensus: 60.0% ✅ (2 agreements, 0 conflicts)

💡 Recommendations
- Improve Coverage: Execute 2 more capability steps to reach 80% threshold
```

**Philosophy**: Metrics are **non-blocking recommendations**. They guide improvement without preventing finalization.

**Test Coverage**:
- Evidence registration: 8 tests (all passing)
- Quality metrics: 15 tests (all passing)
- Total: 182 tests passing

---

### v5.7.0 - Lightweight Quality Analytics (2025-10-02)

**NEW FEATURE**: Non-blocking quality signals for content analysis.

#### Problem Statement

Users requested lightweight analytics to flag "weak" content (low evidence, no quantitative data, too brief) without blocking workflow completion. The system should act as a "process guardian" that guides improvement through warnings rather than hard blocks.

#### Solution Implemented

##### Quality Signals System

**Architecture**:
- **New Module**: `src/workers/evidence-signals.ts` - Standalone analytics module
- **Integration**: Signals computed automatically after each artifact submission
- **Storage**: Signals persisted with artifacts in session state
- **Display**: Formatted badges shown in tool responses

**Signal Types**:
```typescript
type SignalType =
  | 'evidence_low'        // < 2 unique evidence refs
  | 'no_quantitative'     // No numbers/metrics
  | 'too_brief'           // Below min length
  | 'no_cross_refs'       // No cross-references
  | 'weak_rationale'      // Rationale too short
  | 'missing_falsification'; // No falsification test
```

**Severity Levels**: `info`, `warning`, `critical`

**Soft Thresholds** (non-blocking):
```typescript
const SIGNAL_THRESHOLDS = {
  min_evidence_refs: 2,
  min_numeric_ratio: 0.05,
  min_plan_length: 200,
  min_rationale_length: 50,
  min_critique_length: 100,
  min_cross_refs: 1,
  min_avg_sentence_length: 10,
  max_avg_sentence_length: 50
};
```

**Files Modified**:
- `src/workers/evidence-signals.ts` - NEW: Quality analysis module
- `src/workers/parallel-reasoning-mcp.ts` - Added `signals?: SignalSummary` to all artifact types
- `src/workers/parallel-reasoning-tools-v5.ts` - Display signals in tool responses

**Integration Points**:
1. `submitPlan()` - Calls `analyzePlan()` and stores signals
2. `submitCrossPlanNote()` - Calls `analyzeCrossPlanNote()` and stores signals
3. `submitPeerCritique()` - Calls `analyzeCritique()` and stores signals
4. `submitMediationDecision()` - Calls `analyzeMediationDecision()` and stores signals
5. `finalizeSession()` - Aggregates all signals and displays quality summary

**Philosophy**: Signals are **recommendations, not requirements**. They guide improvement without blocking workflow completion.

---

### v5.6.0 - Evidence System & Registry Priority (2025-10-02)

**CRITICAL FIXES**: Resolved session routing with registry priority and implemented automatic evidence ID generation.

#### Problem Statement

After v5.5.1 deployment, users reported:
1. **Session Not Found**: `submit_reasoning_plan` couldn't find sessions created by `init_parallel_reasoning`
2. **Evidence ID Blocking**: Finalization failed due to missing evidence IDs in mediation decisions
3. **No Evidence Traceability**: No way to link mediation decisions back to execution results

#### Solutions Implemented

##### 1. Session Registry Priority Fix

**Problem**: ChatGPT opens new MCP connections for each tool call sequence, creating new Durable Object instances with different IDs. The registry was created but never consulted because header-based routing had priority.

**Root Cause**:
```typescript
// BEFORE (WRONG): Header had priority, registry never checked
if (headerSessionId) {
  routedDoId = extractSessionId(headerSessionId);
  // Registry lookup code never reached
}
```

**Solution**:
- **Inverted priority**: Check body for custom `session_id` FIRST
- If custom `session_id` found, check registry for mapping
- Only fall back to header if no registry mapping exists
- Registry lookup happens BEFORE header-based routing

**Files Modified**:
- `src/workers/index.ts` - Lines 241-300: Routing logic refactored with registry priority

**Code Flow**:
```typescript
// STEP 1: Parse body and check for custom session_id
const customSessionId = extractFromBody(body, 'params.arguments.session_id');

// STEP 2: If custom session_id exists, check registry FIRST
if (customSessionId) {
  const registryMapping = await lookupRegistry(customSessionId);
  if (registryMapping) {
    routedDoId = registryMapping; // Use registry mapping
  }
}

// STEP 3: Fall back to header only if no registry mapping
if (!routedDoId) {
  routedDoId = extractSessionId(headerSessionId);
}
```

**Result**: All tool calls with custom `session_id` now correctly route to the same DO instance ✅

##### 2. Automatic Evidence ID Generation

**Problem**: System required evidence IDs in mediation decisions but provided no way to generate them. Users had to manually create arbitrary IDs.

**Solution**:
- `recordPlanResult()` now generates and returns evidence IDs automatically
- Format: `{session_id}:{plan_id}:step{N}` (e.g., `sess-abc:plan1:step1`)
- Evidence ID stored with execution result
- Evidence ID displayed prominently in tool response

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Lines 410-440: `recordPlanResult()` now returns evidence ID
- `src/workers/parallel-reasoning-tools-v5.ts` - Lines 300-321: Display evidence ID in response

**Code Changes**:
```typescript
// BEFORE
recordPlanResult(session_id: string, plan_id: string, result: any): void {
  results.push(result);
}

// AFTER
recordPlanResult(session_id: string, plan_id: string, result: any): string {
  const evidence_id = `${session_id}:${plan_id}:step${results.length + 1}`;
  const resultWithEvidence = { ...result, evidence_id };
  results.push(resultWithEvidence);
  return evidence_id; // Return for display
}
```

**User Experience**:
```
📋 Evidence ID Generated: `sess-abc:plan1:step1`

Important: Use this evidence ID when:
- Submitting peer critiques (in `evidence_ids` field)
- Submitting mediation decisions (in `evidence_ids` field)
```

##### 3. Flexible Evidence Validation

**Problem**: Finalization was blocked if any mediation decision lacked evidence IDs, even though the system didn't provide clear guidance on generating them.

**Solution**:
- Evidence IDs now **recommended but not required** for finalization
- Finalization succeeds with warnings instead of hard blocking
- Warnings clearly indicate which decisions lack evidence
- Maintains forcing mechanism while reducing friction

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Lines 566-600: Finalization logic updated
- `src/workers/parallel-reasoning-tools-v5.ts` - Lines 547-572: Display warnings in response

**Code Changes**:
```typescript
// BEFORE: Hard blocking
const finalized = min_plans_met && all_plans_executed && all_decisions_have_evidence;

// AFTER: Warning-based
const finalized = min_plans_met && all_plans_executed;
return {
  finalized,
  warnings: decisions_without_evidence.length > 0 ? [
    `⚠️ ${decisions_without_evidence.length} decision(s) lack evidence IDs`
  ] : []
};
```

**Result**: Users can finalize workflows while being reminded about evidence traceability ✅

---

### v5.5.1 - Critical Bug Fixes (2025-10-02)

**CRITICAL FIXES**: Resolved session routing and lifecycle issues that prevented proper operation.

#### Problem Statement

After v5.5.0 deployment, three critical bugs were discovered:
1. **Session Routing**: Worker used `session_id` from tool arguments for DO routing, creating separate DO instances
2. **Terminated Session Handling**: `initSession()` returned terminated sessions unchanged, blocking reuse
3. **Silent Failures**: Some methods returned silently instead of throwing errors

#### Solutions Implemented

##### 1. Session Routing Priority Fix

**Problem**: Worker extracted `session_id` from `body.params.arguments.session_id` and used it for Durable Object routing. This created a new DO instance for each parallel reasoning session, separate from the MCP session DO.

**Root Cause**:
```typescript
// BEFORE (WRONG): Body had priority over header
considerCandidate(args['session_id'], 'body.params.arguments.session_id');
// This routed to DO with ID based on "sess-2025-10-02-cost-ops-r2"
// But MCP session was on DO with ID "15a55a4e0d4014b672ab7dc49c831f9225c2b8678ae49a959b6ba3d0b7d9b67b"
```

**Solution**:
- Inverted routing priority: header `mcp-session-id` now has absolute priority
- Body parameters only used during `initialize` (when no header exists yet)
- Removed `args['session_id']` from routing candidates (it's for internal logic, not routing)

**Files Modified**:
- `src/workers/index.ts` - Lines 240-291: Routing logic refactored

**Result**: All tool calls now correctly route to the same DO instance with initialized MCP transport.

##### 2. Terminated Session Auto-Reset

**Problem**: `initSession()` was idempotent but returned terminated sessions unchanged. Subsequent operations failed because the session was still marked as terminated.

**Root Cause**:
```typescript
// BEFORE (WRONG): Returned terminated session as-is
if (existingSession) {
  existingSession.updated_at = Date.now();
  return existingSession; // Still has status: 'terminated'
}
```

**Solution**:
- Added special case in `initSession()` to detect terminated sessions
- Automatically calls `resetSession()` to clear execution state
- Updates session parameters with new values from init call

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Lines 201-264: `initSession()` method
- `__tests__/session-lifecycle.test.ts` - Lines 90-120: Updated test expectations

**Result**: Sessions can be reused after termination without manual intervention.

##### 3. Explicit Error Handling

**Problem**: `submitPlan()` returned `{accepted: false, reason: 'Session not found'}` and `recordPlanResult()` did silent return when session not found.

**Solution**:
- Changed both methods to throw explicit errors for non-existent sessions
- Enhanced `loadSessions()` to handle corrupted/invalid storage data gracefully
- Added validation for null/undefined/non-array inputs

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts`:
  - Lines 266-294: `submitPlan()` now throws error
  - Lines 410-426: `recordPlanResult()` now throws error
  - Lines 658-710: `loadSessions()` with robust error handling

**Result**: Clear error messages, no silent failures, graceful degradation for corrupted data.

---

### v5.5.0 - Complete Architecture Refinement (2025-10-01)

**MAJOR UPDATE**: Complete refactoring to eliminate pre-script behavior and enable truly LLM-centric parallel reasoning.

#### Problem Statement

After initial deployment, three critical issues were identified:
1. **Rigid Diversity Axes**: Fixed 6 axes were always suggested, regardless of task context
2. **Pre-Script Capabilities**: Capabilities returned deterministic output instead of analytical guardrails
3. **Session Lifecycle**: Basic idempotency issues

#### Solutions Implemented

##### 1. Session Lifecycle Improvements (Enhanced in v5.5.1)

**Problem**: `initSession()` was not idempotent - calling it twice with same `session_id` would overwrite the existing session.

**Solution**:
- Made `initSession()` idempotent - returns existing session instead of creating new one
- Added `terminateSession()` method to explicitly terminate sessions
- Added `listSessions()` method to inspect all active sessions
- Added `resetSession()` and `deleteSession()` for recovery
- Added `'terminated'` status to session state machine
- **v5.5.1**: Auto-reset terminated sessions on init

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Session management methods
- `__tests__/session-lifecycle.test.ts` - Comprehensive session lifecycle tests

##### 2. Dynamic Diversity Axes

**Problem**: `DiversityAxisSchema` was a fixed enum with only 6 predefined axes.

**Solution**:
- Changed `DiversityAxisSchema` to `z.string()` to accept any axis
- Created `COMMON_DIVERSITY_AXES` object with 20+ predefined axes
- Created `suggestDiversityAxes()` function that analyzes `task_description` and suggests contextually relevant axes
- Domain-specific logic for: financial, market, technical, regulatory, supply chain, HR, strategy

**Example**:
```typescript
// Financial task
suggestDiversityAxes('DCF valuation for tech startup')
// Returns: ['analytical_models', 'time_horizons', 'risk_perspectives']

// Market task
suggestDiversityAxes('Market entry strategy for APAC')
// Returns: ['data_sources', 'customer_segments', 'competitive_dynamics']
```

**Files Modified**:
- `src/workers/parallel-reasoning-mcp.ts` - Dynamic axes logic
- `__tests__/dynamic-diversity-axes.test.ts` - NEW: Dynamic axes tests

##### 3. Capabilities as Guardrails

**Problem**: Capabilities were returning pre-formatted output (`{market_size: 1000, revenue: 500}`) which:
- Created "noise" that distracted from analytical reasoning
- Made ChatGPT rely on deterministic data instead of holistic analysis
- Violated the LLM-centric principle (ChatGPT should drive analysis, not consume pre-computed results)

**Solution**: Capabilities now return ONLY analytical guardrails:
- **Key Questions**: Critical questions to explore
- **Analysis Dimensions**: Dimensions to consider with data sources
- **Trade-offs**: Key trade-offs to evaluate
- **Risks to Monitor**: Risks with severity and indicators
- **Validation Criteria**: How to validate the analysis
- **Context**: Assumptions, constraints, dependencies
- **Suggested Next Steps**: Follow-up actions

**Key Principle**: ChatGPT NEVER sees deterministic output. Only analytical perspectives are shown.

**Implementation**:
1. Created `GuardrailGenerator` that automatically generates guardrails from capability metadata
2. Modified `CapabilityResult` to make `output` optional (deprecated), `guardrails` optional (will become required)
3. Modified `CapabilityOrchestrator` to use ONLY guardrails in artifacts, filter out legacy output
4. Modified `capability-tools.ts` to format guardrails in readable way (NOT raw JSON)
5. Updated documentation to clarify capabilities = vertical expertise perspectives

**Zero Refactor Approach**: 58 existing capabilities continue to work without modification. Their legacy output is simply filtered out, and guardrails are generated automatically from their metadata.

**Files Modified**:
- `src/workers/capability-graph.ts` - Modified `CapabilityResult` interface
- `src/workers/guardrail-generator.ts` - NEW: Automatic guardrail generation
- `src/workers/guardrail-output.ts` - NEW: Guardrail schema definition
- `src/workers/capability-orchestrator.ts` - Enrichment and filtering logic
- `src/workers/capability-tools.ts` - Formatting for ChatGPT
- `__tests__/capability-guardrails.test.ts` - NEW: Guardrail generation tests

##### 4. Less Prescriptive Guided Responses

**Problem**: `guided-responses.ts` was too prescriptive, suggesting fixed plan templates like "Plan A: quantitative, Plan B: qualitative".

**Solution**:
- Removed fixed plan templates
- Provide general principles instead: "Ensure plans differ on ≥2 axes"
- Emphasize contextual axes selection
- Warn against cosmetic variants

**Files Modified**:
- `src/workers/guided-responses.ts` - Less prescriptive responses

#### Testing

Created comprehensive test suites:
- `__tests__/session-lifecycle.test.ts` - Session management edge cases (8 tests)
- `__tests__/dynamic-diversity-axes.test.ts` - Dynamic axes suggestion (20+ tests)
- `__tests__/capability-guardrails.test.ts` - Guardrail generation (15+ tests)

#### Documentation

Updated documentation to reflect changes:
- `README.md` - Version 5.5.0 section with architecture changes
- `AGENT.md` - This section

#### Key Architectural Principles

1. **LLM-Centric**: ChatGPT is the sole deliberative agent. Server provides only guardrails and memory.
2. **Dynamic, Not Fixed**: Diversity axes, plan types, and analytical approaches are context-specific, not pre-defined.
3. **Guardrails, Not Pre-Script**: Capabilities provide analytical perspectives, not deterministic output.
4. **Idempotent Operations**: Session operations are safe to retry without side effects.
5. **Zero Refactor**: Existing capabilities work without modification through automatic guardrail generation.

---

### v5.4.0 - Session Persistence Fix (2025-02-01)

**Problem**: Cloudflare Durable Objects are evicted after 70-140 seconds of inactivity. ChatGPT can "think" for 3+ minutes between tool calls, causing session loss and "Session not found" errors.

**Root Cause Analysis**:
1. ❌ **Initial Hypothesis (WRONG)**: Alarms prevent eviction
   - Tested alarm API with 20-second intervals
   - **Cloudflare docs confirm**: "Alarms do NOT prevent eviction"
   - Alarms only execute code at scheduled times, don't keep DO alive

2. ✅ **Correct Solution**: State persistence + restoration
   - State was being persisted after each tool call ✅
   - **BUT**: State was NOT being restored when DO woke up after eviction ❌

**Fix**:
- Added `loadParallelReasoningV5Sessions()` call in `session.ts` line 123
- Added `loadCapabilityState()` call in `session.ts` line 124
- These are called when `!this.transport` (DO initialization/re-initialization)
- State is now restored from DO Storage when DO wakes up after eviction

**Testing**:
- Created `test-session-timeout.sh` with 180-second (3 minute) delay
- ✅ Test passes: Session survives eviction and restores state correctly
- ChatGPT can now think for 3+ minutes without losing session

**Files Changed**:
- `src/workers/session.ts` (lines 116-128, 478-487)
- `test-session-timeout.sh` (new test script)

**Key Learnings**:
- Cloudflare DO eviction timeout: 70-140 seconds (not 30s as initially thought)
- Alarms are for scheduled tasks, NOT for keeping DOs alive
- Only solution: Persist state + restore on wake-up
- DO Storage API is strongly consistent and perfect for this use case

---

### v5.3.0 - Validation Guardrails (2025-01-31)

### Bug Fix: Finalization Ignores `min_plans`

**Problem**: `finalizeSession()` only checked if submitted plans had execution results, but didn't validate that at least `min_plans` were submitted. A workflow with `min_plans=3` could finalize with only 2 plans.

**Fix**:
- Added `min_plans_met` check to `finalizeSession()`
- Added `plans_submitted` and `min_plans_required` to completeness check
- Updated finalization response to show "Minimum Plans Not Met" error
- Added test coverage in `__tests__/validation-fixes.test.ts`

**Files Changed**:
- `src/workers/parallel-reasoning-mcp.ts` (lines 399-479)
- `src/workers/parallel-reasoning-tools-v5.ts` (lines 547-578)

### Bug Fix: Mediation Accepts Non-Existent Evidence IDs

**Problem**: `submitMediationDecision()` accepted any evidence IDs without validating they exist in the evidence ledger. Fake IDs like `"fake_evidence_001"` would pass validation.

**Fix**:
- Added optional `validateEvidenceIds` parameter to `submitMediationDecision()`
- Evidence ledger now provides `getEntry()` and `hasEntry()` methods
- Handler validates evidence IDs when ledger is provided
- Backward compatible: validation skipped if no ledger provided
- Added test coverage in `__tests__/validation-fixes.test.ts`

**Files Changed**:
- `src/workers/parallel-reasoning-mcp.ts` (lines 367-397)
- `src/workers/parallel-reasoning-tools-v5.ts` (lines 399-442)
- `src/workers/everything-workers.ts` (line 665)
- `src/workers/evidence-ledger.ts` (lines 80-104)

---

## 📋 Rules for AI Agents

### 1. Documentation Updates

**ONLY these files should be updated at the end of work**:
- ✅ `README.md` - User-facing documentation with prompt templates
- ✅ `AGENT.md` - This file, guidelines for AI agents

**DO NOT update unless explicitly requested**:
- ❌ `docs/CHANGELOG.md` - Only when releasing a new version
- ❌ `docs/EXAMPLES.md` - Only when adding new use case patterns

### 2. Code Changes Workflow

**Before making any code changes**:
1. Use `codebase-retrieval` to understand existing patterns
2. Use `view` to read relevant files
3. Use `git-commit-retrieval` to see how similar changes were made
4. Confirm with user before making breaking changes

**When making changes**:
- ✅ Use `str-replace-editor` for editing existing files (NEVER recreate from scratch)
- ✅ Use `save-file` only for new files
- ✅ Keep edits under 150 lines per tool call
- ✅ Run `npm run build` after TypeScript changes
- ✅ Run `npm test` after any changes

**After making changes**:
```bash
npm run build  # Check TypeScript compilation (0 errors expected)
npm test       # Run all 162 tests (all must pass)
```

### 3. Testing Protocol

**If tests fail**:
1. Read error message carefully
2. Use `view` to inspect failing test file
3. Fix issue (usually test expectations need updating)
4. Re-run tests to verify fix

**Common test failures**:
- Tool list changed → Update `__tests__/everything-workers.test.ts`
- Schema changed → Update relevant test expectations
- New feature → Add new test file

### 4. Architecture Constraints (DO NOT VIOLATE)

**LLM-Centric Design** (v5.1.0+):
- ✅ ChatGPT orchestrates entire workflow
- ✅ MCP provides only guardrails (diversity validation) + persistent memory
- ❌ DO NOT add server-side intelligence or decision-making

**Capabilities as Guardrails** (v5.5.0+):
- ✅ Capabilities return analytical perspectives (questions, dimensions, trade-offs, risks)
- ✅ Guardrails guide ChatGPT's reasoning, NOT replace it
- ❌ DO NOT return deterministic output (`{market_size: 1000}`)
- ❌ DO NOT show legacy output to ChatGPT (filter it out)
- ✅ Use `GuardrailGenerator` to auto-generate guardrails from capability metadata
- ✅ Capabilities are vertical expertise perspectives, NOT computation engines

**Multi-Path Only** (v5.1.0+):
- ✅ Only expose 8 parallel reasoning tools to clients
- ❌ DO NOT expose single-path tools (`analyze_with_capabilities`, `list_capabilities`, etc.)
- ✅ Keep single-path functions internal (used by `execute_plan_step`)

**Diversity Validation**:
- ✅ Server enforces ≥2 axes difference between plans
- ✅ Server validates structure only, NOT substance
- ❌ DO NOT add semantic analysis or quality checks

**Evidence-Based Mediation** (v5.3.0+):
- ✅ All decisions must cite evidence IDs
- ✅ Server validates evidence IDs exist in ledger (v5.3.0 fix)
- ✅ Validation only when evidence ledger is provided
- ❌ DO NOT validate evidence quality or relevance

**Finalization Validation** (v5.3.0+):
- ✅ Server validates minimum plan count (`min_plans`) before finalization
- ✅ Server validates all plans have execution results
- ✅ Server validates all decisions cite evidence
- ❌ DO NOT allow finalization if `plans_submitted < min_plans`

**Session Persistence**:
- ✅ Use Durable Objects for state across requests
- ✅ Route requests by `session_id` (from body or header)
- ✅ Serialize/deserialize Maps properly (see v5.0.3 fix)
- ✅ Persist state after every mutating operation
- ✅ Reload state on Durable Object startup

**Custom Session IDs** (v5.2.2+):
- ✅ Support for user-friendly session IDs (e.g., `"sess-it-2025-10-01-a"`)
- ✅ Deterministic SHA-256 hashing ensures consistent routing
- ✅ Native 64-char hex IDs still work (backward compatible)
- ✅ Same session ID always routes to same Durable Object
- ✅ See [SESSION_ID_FIX.md](./SESSION_ID_FIX.md) for technical details

**Session Keep-Alive** (v5.2.1+):
- ✅ Heartbeat endpoint (`POST /heartbeat`) keeps sessions alive
- ✅ Cloudflare evicts Durable Objects after 30s of inactivity
- ✅ Clients should send heartbeat every 20s during long operations
- ✅ State is persisted on every heartbeat for resilience
- ✅ See [HEARTBEAT.md](./HEARTBEAT.md) for implementation details

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         ChatGPT                             │
│  (Sole Deliberative Agent - Orchestrates Everything)       │
└────────────┬────────────────────────────────────┬───────────┘
             │                                    │
             │ MCP Protocol                       │ MCP Protocol
             │ (Tool Calls)                       │ (Responses)
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (index.ts)                   │
│  - Routes requests by session_id                            │
│  - Extracts session_id from body or header                  │
│  - Creates/reuses Durable Object                            │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Forwards request
             ▼
┌─────────────────────────────────────────────────────────────┐
│         Durable Object (session.ts)                         │
│  - Persistent state for session                             │
│  - Hosts MCP server (everything-workers.ts)                 │
│  - Manages ParallelReasoningSessionManager                  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Tool handlers
             ▼
┌─────────────────────────────────────────────────────────────┐
│     Parallel Reasoning Tools (parallel-reasoning-tools-v5)  │
│  - init_parallel_reasoning                                  │
│  - submit_reasoning_plan (validates diversity)              │
│  - execute_plan_step (invokes capabilities)                 │
│  - submit_cross_plan_note                                   │
│  - submit_peer_critique                                     │
│  - submit_mediation_decision (validates evidence IDs)       │
│  - list_plan_status                                         │
│  - finalize_parallel_reasoning                              │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Internal calls
             ▼
┌─────────────────────────────────────────────────────────────┐
│         Capability System (capability-tools.ts)             │
│  - 58 capabilities (market, finance, operations, etc.)      │
│  - Invoked by execute_plan_step                             │
│  - NOT exposed to clients                                   │
└─────────────────────────────────────────────────────────────┘
```

### Request Routing (Critical for Session Persistence)

**Priority 1**: Extract `session_id` from request body
- Check `body.params.arguments.session_id`
- Check `body.params.session_id`
- Check `body.session_id`

**Priority 2**: Fall back to `mcp-session-id` header

**Result**: Route to Durable Object with that ID
- If `session_id` found → `c.env.MCP_SESSION.idFromString(session_id)`
- If not found → `c.env.MCP_SESSION.newUniqueId()` (new session)

**⚠️ CRITICAL**: If ChatGPT changes `session_id` between calls, server creates new Durable Object → "Session not found" error.

---

## 🔧 Key Files

**`src/workers/index.ts`** - Cloudflare Worker entry point, routes by session_id  
**`src/workers/session.ts`** - Durable Object with persistent state  
**`src/workers/everything-workers.ts`** - MCP server, registers 8 tools  
**`src/workers/parallel-reasoning-tools-v5.ts`** - Tool handlers, validates diversity  
**`src/workers/parallel-reasoning-mcp.ts`** - Session manager, serializes state  
**`src/workers/capability-tools.ts`** - 58 capabilities (internal only)

---

## 🎯 Design Principles

### 1. LLM-Centric Architecture
ChatGPT is sole deliberative agent. MCP provides only guardrails and memory.

### 2. Diversity Validation
Plans must differ on ≥2 axes to prevent semantic drift.

### 3. Evidence-Based Mediation
Final decisions must cite evidence IDs from multiple plans.

### 4. Session Persistence
State persists across requests using Durable Objects.

---

## 🐛 Common Issues

### HTTP 400 Bad Request: "Server not initialized"
**Status**: Auto-mitigated in v5.2.3 (server performs implicit `initialize` if the first call is `tools/call`).
**Best practice**: Still call `initialize` explicitly so the server can negotiate capabilities. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### HTTP 406 Not Acceptable: "Client must accept both application/json and text/event-stream"
**Cause**: Missing or incorrect `Accept` header.
**Fix**: Include `Accept: application/json, text/event-stream` in all requests. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### HTTP 400 Bad Request: Validation errors
**Cause**: Parameters don't match Zod schema (e.g., `required_diversity_axes` has <2 elements).
**Fix**: Check server logs for detailed Zod error, fix parameters. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### "Session not found" Error
**Cause**: ChatGPT used different `session_id` than in `init_parallel_reasoning`.
**Fix**: Update prompt templates to emphasize using SAME `session_id` for ALL calls.

### "Your plan declares only 0 axis/axes"
**Cause**: Session not found (see above).
**Fix**: Ensure consistent `session_id`.

### Test Failures After Removing Tools
**Cause**: Test expects removed tool in list.
**Fix**: Update test to verify tool is NOT exposed.

### Map Serialization in Durable Objects
**Cause**: Maps serialize to `{}` in JSON.
**Fix** (v5.0.3): Convert Maps ↔ Arrays in `serializeSessions()` / `loadSessions()`.

---

## 📚 Research References

- Wang et al. (2022): Self-Consistency Improves Chain of Thought Reasoning
- Yao et al. (2023): Tree of Thoughts
- Du et al. (2023): Improving Factuality through Multiagent Debate
- OpenAI (2025): Model Context Protocol
- modelcontextprotocol.io (2024): MCP Specification

---

## ⚠️ CRITICAL: Two Different Session IDs

**DO NOT CONFUSE THESE TWO!**

### 1. MCP Session ID (Durable Object Routing)
- **Location**: HTTP header `mcp-session-id`
- **Source**: Returned by server in `initialize` response header
- **Format**: 64-character hexadecimal string
- **Purpose**: Routes requests to correct Durable Object instance
- **Usage**: Include in EVERY HTTP request after `initialize`

### 2. Parallel Reasoning Session ID (Application Logic)
- **Location**: Tool argument `session_id` in parallel reasoning tools
- **Source**: You choose it (any string)
- **Format**: Any string (e.g., `"analysis_001"`, `"my_workflow"`)
- **Purpose**: Identifies a specific parallel reasoning workflow
- **Usage**: Same value for all parallel reasoning tools in ONE workflow

**See [SESSION_ID_EXPLAINED.md](./SESSION_ID_EXPLAINED.md) for detailed explanation with code examples.**

**Common Bug**: Using parallel reasoning `session_id` in `mcp-session-id` header causes 400 Bad Request because the server tries to route to a non-existent Durable Object.

### Proxy Endpoint for ChatGPT

**Problem**: ChatGPT's `api_tool.call_tool` doesn't support custom headers, so it can't send `mcp-session-id` header.

**Solution**: Use `/proxy` endpoint instead of `/mcp`:
- URL: `https://mcp-server.vf-ghizzoni.workers.dev/proxy`
- Automatically extracts `session_id` from `body.params.arguments.session_id`
- Adds it as `mcp-session-id` header before forwarding to `/mcp`
- ChatGPT can use the same `session_id` value for all tool calls without header management

---

## 🚀 Version History

- **v5.2.4** (2025-10-01): Added /proxy endpoint for ChatGPT compatibility (no header management needed)
- **v5.2.3** (2025-10-01): Clarified two different session IDs, added SESSION_ID_EXPLAINED.md
- **v5.2.2** (2025-10-01): Custom session IDs with idFromName()
- **v5.1.0** (2025-10-01): Multi-path only, universal prompt templates
- **v5.0.3** (2025-10-01): Fixed Map serialization
- **v5.0.0** (2025-10-01): Parallel reasoning v5

See `docs/CHANGELOG.md` for complete history.

