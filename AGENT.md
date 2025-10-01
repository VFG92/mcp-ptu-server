# 🤖 MCP PTU Server - Agent Guidelines

**Version 5.2.0** | For AI Agents Working on This Repository

This document provides rules, guidelines, and technical context for AI agents (like you) working on this codebase.

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

**Multi-Path Only** (v5.1.0+):
- ✅ Only expose 8 parallel reasoning tools to clients
- ❌ DO NOT expose single-path tools (`analyze_with_capabilities`, `list_capabilities`, etc.)
- ✅ Keep single-path functions internal (used by `execute_plan_step`)

**Diversity Validation**:
- ✅ Server enforces ≥2 axes difference between plans
- ✅ Server validates structure only, NOT substance
- ❌ DO NOT add semantic analysis or quality checks

**Evidence-Based Mediation**:
- ✅ All decisions must cite evidence IDs
- ✅ Server validates evidence IDs exist
- ❌ DO NOT validate evidence quality or relevance

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

