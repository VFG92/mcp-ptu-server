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
- `execute_plan_step` – perform capability steps and automatically log evidence IDs.
- `submit_peer_review` – critique other plans and update consensus tallies.
- `record_plan_result` – save outcomes and evidence references for a plan.
- `finalize_parallel_reasoning` – close the session, returning quality metrics and a consolidated recommendation.

All tools accept a `session_id` parameter. Reuse the same value throughout a workflow to keep state aligned.

## Semantic diversity validation
The server uses **semantic validation** for diversity axes, enabling more flexible plan differentiation:

### How it works
- Axes are parsed as **Key: Value** pairs (e.g., `"Tech Stack: Hybrid"` → `{key: "tech_stack", value: "hybrid"}`)
- **Required axes**: Plans must include axes with matching **keys** (values can differ)
- **Inter-plan diversity**: Plans must differ on ≥2 axes semantically (same key + different value = different)

### Example
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

### Benefits
- No need to copy exact strings from `required_diversity_axes`
- Focus on substantive differences, not syntax
- Rejected plans are stored for audit and cross-contamination

## Quality metrics
During finalization the server reports:
- **Confidence** – weighted by evidence volume and quality signals.
- **Coverage** – ratio of executed capability steps to the plan commitments.
- **Consensus** – balance of positive vs. conflicting peer reviews.

Clients should treat the recommended thresholds (≥85% confidence, ≥95% coverage, ≥80% consensus) as gating criteria when determining whether a session is ready to close.

## Troubleshooting quick wins
- **400 "Server not initialized"** – call `initialize` before using `tools/call`, or let `/proxy` perform the handshake automatically.
- **406 "Client must accept..."** – include `Accept: application/json, text/event-stream` in every MCP request.
- **"Session not found"** – ensure the same `session_id` is passed to all parallel reasoning tools in the workflow.

## Additional resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [`SESSION_ID_EXPLAINED.md`](./SESSION_ID_EXPLAINED.md) – detailed guidance on the two types of session identifiers.
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) – subsystem overview for maintainers.

