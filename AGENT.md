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

> Start a parallel reasoning session on this issue, invoke every endpoint at the right moment, and use reasoning to drive a workflow that ends with closing the session. Use **all** MCP endpoints and activate native capabilities whenever calculations or retrieval of real evidence is required.
>
> Finalization is blocked unless the quality metrics returned by the endpoints report **Confidence ≥ 85%**, **Coverage ≥ 95%** (essential steps complete, no fluff), **Consensus ≥ 80%**, and every material figure is backed by at least two independent sources or one primary source plus a reconstruction workpaper.

## Useful commands
```bash
npm install            # install dependencies
npm run build          # type-check
npm test               # execute the Jest suite
npm run workers:dev    # launch a local Cloudflare Worker
```

When deploying, use `npm run workers:deploy` with the appropriate Cloudflare credentials.

