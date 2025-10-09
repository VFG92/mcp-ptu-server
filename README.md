# 🧠 MCP PTU Server

An MCP-compliant Cloudflare Worker that helps ChatGPT coordinate structured, multi-path reasoning sessions. The server keeps session state in a Durable Object, enforces diversity across plans, records evidence, and reports real-time quality metrics so the model can self-regulate its workflow.

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

## MCP endpoints
The server implements the standard MCP transport plus a convenience proxy:
- `POST /mcp` – canonical MCP entry point (requires `mcp-session-id` header).
- `POST /proxy` – extracts the parallel reasoning `session_id` from the request body and forwards to `/mcp` with the correct header.

Within the MCP session the following tools drive the workflow:
- `init_parallel_reasoning` – declare a new reasoning workflow and expected diversity axes.
- `submit_reasoning_plan` – register a plan path.
- **`list_plan_status`** – **PRIMARY tool for tracking progress**. Shows current coverage/confidence/consensus %, specific gaps, and actionable next steps. **Call this frequently!**
- `execute_plan_step` – perform REAL ANALYSIS with reasoning and tool use. Use detailed task descriptions to trigger deep reasoning.
- `submit_peer_critique` – critique other plans and update consensus tallies.
- `check_session_readiness` – verify if session meets quality thresholds before finalization (recommended).
- `finalize_parallel_reasoning` – close the session, returning quality metrics and a consolidated recommendation.

All tools accept a `session_id` parameter. Reuse the same value throughout a workflow to keep state aligned.

### Best practice: Use list_plan_status frequently
Call `list_plan_status` after submitting plans and during execution to:
- See current progress toward finalization thresholds (coverage ≥95%, confidence ≥85%, consensus ≥80%)
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
| **Confidence** | ≥85% | Weighted by evidence volume and quality signals |
| **Coverage** | ≥95% | Ratio of executed capability steps to plan commitments |
| **Consensus** | ≥80% | Balance of positive vs. conflicting peer reviews |

### Enforcement behavior
- `check_session_readiness` reports which thresholds are met/unmet
- `finalize_parallel_reasoning` **blocks finalization** if any threshold is unmet
- Blocking warnings explain which metrics need improvement and provide actionable next steps
- Sessions can only finalize when all structural requirements AND quality thresholds are satisfied

## Troubleshooting quick wins
- **400 "Server not initialized"** – call `initialize` before using `tools/call`, or let `/proxy` perform the handshake automatically.
- **406 "Client must accept..."** – include `Accept: application/json, text/event-stream` in every MCP request.
- **"Session not found"** – ensure the same `session_id` is passed to all parallel reasoning tools in the workflow.

## OpenAI Apps SDK Compatibility

This server is **architecturally compatible** with [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) for building ChatGPT apps. The MCP protocol implementation, tool system, and UI layer align with Apps SDK requirements.

**Current Status**: ~70% compatible
**Required Changes**: Adapt tool response format to include `_meta.openai/outputTemplate` metadata

See [`APPS_SDK_COMPATIBILITY_ANALYSIS.md`](./APPS_SDK_COMPATIBILITY_ANALYSIS.md) for detailed compatibility analysis and implementation roadmap.

## Additional resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [`SESSION_ID_EXPLAINED.md`](./SESSION_ID_EXPLAINED.md) – detailed guidance on the two types of session identifiers.
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) – subsystem overview for maintainers.
- [`APPS_SDK_COMPATIBILITY_ANALYSIS.md`](./APPS_SDK_COMPATIBILITY_ANALYSIS.md) – Apps SDK compatibility analysis and roadmap.

