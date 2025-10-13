# 🤖 MCP PTU Server – Agent Guidelines

This repository powers the MCP PTU Cloudflare Worker. Use this document as the primary reference when contributing or updating documentation. All contributions must be written in English.

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
