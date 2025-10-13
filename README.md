# 🧠 MCP PTU Server

An MCP-compliant Cloudflare Worker that orchestrates structured multi-path reasoning sessions for ChatGPT and other Model Context Protocol clients. The worker keeps session state inside Durable Objects, enforces plan diversity, records evidence, and continuously reports quality metrics so agents can self-regulate their workflow.

## Feature highlights
- **Parallel reasoning workflow** – Durable Objects coordinate the end-to-end lifecycle: session init, plan submission, manifest execution, evidence registration, peer critiques, mediation, readiness checks, and finalization.
- **Self-assessment based evidence ledger** – `register_execution_results` accepts counts instead of raw text. Payloads must use synthetic reference IDs matching `^(Source|Calc|Data|WP)\d+$` and include honest coverage/confidence estimates to avoid moderation throttles.
- **Quality metrics in real time** – Confidence, coverage, consensus, and saliency reports are recalculated after every registration. `list_plan_status` and readiness tools surface actionable gaps.
- **Session registry & proxy endpoints** – Requests automatically resolve to the correct Durable Object, whether they arrive through `/mcp`, `/proxy`, or the `/api/register-results` direct API. Heartbeat and regeneration helpers keep long sessions alive.
- **Capability adapters** – The worker bundles the "everything" capability set alongside filesystem, memory, and sequential-thinking modules, with rich integration tests under `__tests__/`.

## Project structure
| Path | Purpose |
| --- | --- |
| `src/workers/` | Cloudflare Worker entrypoint, Durable Objects, manifest execution logic, and MCP tool handlers. |
| `src/types/` | Shared type definitions for manifests, payload validation, and capability wiring. |
| `src/ui/` | Lightweight diagnostic UI bundle used by the worker when running with Wrangler. |
| `examples/` | Scripted walkthroughs for manifest execution, peer review, and capability integration. |
| `scripts/` | Shell helpers for local smoke tests and debugging complex sessions. |
| `__tests__/` | Jest suites covering parallel reasoning flows, evidence validation, consensus metrics, and persistence.

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Type-check the project**
   ```bash
   npm run build
   ```
3. **Run the unit and integration suite**
   ```bash
   npm test
   ```
4. **Start a local worker** (requires configured Cloudflare credentials)
   ```bash
   npm run workers:dev
   ```

Target runtime: Node.js 20+ locally and Cloudflare Workers (Wrangler 4.40+). Update `wrangler.toml` with your account bindings before deploying.

## Testing & diagnostics
| Command | What it verifies |
| --- | --- |
| `npm test` | Core Jest suite for Durable Objects, manifest execution, metrics, and adapters. |
| `npm run test:coverage` | Generates code coverage for the MCP worker surface. |
| `./test-direct-api.sh` | End-to-end manifest workflow via the direct HTTP API (session extraction and routing). |
| `./test-simple-direct-api.sh` | Minimal register-results smoke test with moderation-safe payloads. |
| `./test-403-fix.sh` | Regression test ensuring synthetic IDs and short summaries prevent OpenAI 403 moderation errors. |
| `./scripts/test-parallel-reasoning-simple.sh` | Lightweight smoke test for Durable Object persistence (requires `workers:dev`). |
| `./scripts/test-parallel-reasoning-fix.sh` | Verbose MCP walkthrough useful for debugging session lifecycle or mediation issues.

## MCP interfaces
### HTTP endpoints
- `POST /mcp` – Canonical MCP transport (requires `mcp-session-id` header).
- `GET /mcp` – Server-sent events stream for MCP responses.
- `POST /proxy` – Extracts `session_id` from the request body for clients that cannot set custom headers.
- `POST /api/register-results` – Direct API alternative that reuses execution tokens to bypass stale MCP sessions.
- `POST /heartbeat` – Keeps long-running sessions alive.
- `GET /health` – Basic health check.

### Core MCP tools
1. `init_parallel_reasoning`
2. `submit_reasoning_plan`
3. `execute_reasoning_manifest`
4. `register_execution_results` (with self-assessment counts)
5. `list_plan_status`
6. `submit_peer_critique`
7. `submit_mediation_decision`
8. `generate_meta_reflection`
9. `check_session_readiness`
10. `finalize_parallel_reasoning`
11. Utility helpers such as `regenerate_execution_token`

Each response includes a workflow checklist that tracks progress toward readiness thresholds (confidence ≥ 85%, coverage ≥ 95%, consensus ≥ 80%).

## Examples & further reading
- `examples/parallel-reasoning-v5-example.ts` – Complete manifest workflow showcasing self-assessment registration.
- `examples/peer-review-example.ts` – Peer critique and mediation lifecycle.
- `examples/capability-integration-example.ts` – Capability orchestration and evidence handling primer.
- `src/workers/everything-workers.ts` – Tool registry and descriptions surfaced to MCP clients.
- `src/workers/session-metrics.ts` – Implementation of consensus, confidence, coverage, and saliency calculations.

For more background on the Model Context Protocol, visit [modelcontextprotocol.io](https://modelcontextprotocol.io).
