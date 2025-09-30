# 🤖 Agent Instructions

**For AI Agents (OpenAI Codex, Claude, GPT, etc.)**

This file provides comprehensive instructions for AI agents working with this repository.

---

## 📋 Repository Overview

**Project**: Multi-Agent Parallel Reasoning MCP Server
**Version**: 2.1.0
**Purpose**: Enable ChatGPT Developer Mode to perform multi-agent parallel reasoning for business analysis
**Domain**: Management consulting, finance, marketing strategy, project management
**Platform**: Cloudflare Workers + Durable Objects
**Language**: TypeScript
**Protocol**: Model Context Protocol (MCP) 2024-11-05

**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`

---

## 🎯 Core Concepts

### What This System Does

This is an MCP server that enables **multi-agent parallel reasoning**:
1. User requests analysis of a complex business problem
2. System initializes multiple expert AI "agent personas" (e.g., Strategy Consultant, Financial Analyst, Risk Manager)
3. Each agent analyzes the problem from their perspective **in parallel**
4. Agents can communicate and debate with each other
5. System synthesizes all perspectives into unified recommendations

**Think**: Virtual consulting team of 15+ experts working together in real-time.

### Key Components

1. **Agent Personas** (`src/workers/agent-personas.ts`)
   - 15 expert personas across Strategy, Finance, Marketing, Operations, Synthesis
   - Each has: role, focus, expertise, thinking_style, prompt_template
   - 60+ persona aliases for common variations (e.g., `product_manager` → `project_manager`)
   - Fuzzy matching with Levenshtein distance for typo detection

2. **Error Handling** (`src/workers/error-handling.ts`) ✨ NEW
   - Structured error system with machine-readable error types
   - HTTP semantic codes (404, 409, 412, 206, 500)
   - Retriable flag to indicate if errors can be retried
   - ErrorFactory with pre-built error constructors

3. **Synthesis Strategies** (`src/workers/synthesis-strategies.ts`)
   - 5 algorithms: consensus, weighted, dialectic, best_of_n, ensemble
   - Combine multiple agent outputs into unified recommendations
   - Support for partial synthesis with confidence intervals

4. **Parallel Reasoning Engine** (`src/workers/parallel-reasoning-engine.ts`)
   - Session management, agent state tracking, cross-agent communication
   - Progress monitoring, real-time status updates
   - Integrated structured error handling

5. **MCP Tools** (`src/workers/parallel-reasoning-tools.ts`)
   - 8 tools for ChatGPT to orchestrate parallel reasoning
   - Tool handlers that interact with the engine
   - Partial synthesis support with HTTP 206 and warnings

6. **Session Management** (`src/workers/session.ts`)
   - Durable Objects for stateful sessions
   - Persists agent states, messages, synthesis results

7. **MCP Server Integration** (`src/workers/everything-workers.ts`)
   - Main MCP server implementation
   - Registers all tools and handlers
   - Enhanced error handling for ParallelReasoningError

8. **Routing** (`src/workers/index.ts`)
   - Hono-based HTTP routing
   - Durable Objects session routing

---

## 🏗️ Architecture

```
ChatGPT (Developer Mode)
    ↓ MCP Protocol (Streamable HTTP + SSE)
Cloudflare Workers (index.ts)
    ↓ Hono Routing
Durable Objects (session.ts)
    ↓ State Management
MCP Server (everything-workers.ts)
    ↓ Tool Handlers
Parallel Reasoning Engine
    ├── Agent Personas
    ├── Synthesis Strategies
    └── Cross-Agent Communication
```

---

## 📁 File Structure

```
src/workers/
├── agent-personas.ts              # 15 expert personas + 60+ aliases + fuzzy matching
├── error-handling.ts              # Structured error system (NEW in v2.1.0)
├── synthesis-strategies.ts        # 5 synthesis algorithms
├── parallel-reasoning-engine.ts   # Core engine (session, agents, messages)
├── parallel-reasoning-tools.ts    # 8 MCP tool handlers (added validate_session_spec)
├── session.ts                     # Durable Objects state management
├── everything-workers.ts          # MCP server integration + error handling
├── everything-adapter.ts          # MCP adapter utilities
├── express-adapter.ts             # Express→Workers adapter
└── index.ts                       # Hono routing + DO routing
```

---

## 🛠️ Development Rules

### DO ✅

1. **Respect the Domain**
   - This is for **business consulting**, not software development
   - Agent personas are: Strategy Consultant, Financial Analyst, Marketing Strategist, etc.
   - Use cases: Market entry, M&A deals, digital transformation, strategic decisions

2. **Maintain Type Safety**
   - All code is TypeScript with strict types
   - Use interfaces for all data structures
   - No `any` types unless absolutely necessary

3. **Follow MCP Protocol**
   - Tools must follow MCP 2024-11-05 specification
   - Use proper JSON-RPC 2.0 format
   - Support SSE streaming for real-time updates

4. **Preserve Session State**
   - All session data must persist in Durable Objects
   - Use `session.ts` methods for state management
   - Never lose agent reasoning or synthesis results

5. **Test Locally First**
   - Always test with `npm run workers:dev` before deploying
   - Verify all 7 tools work correctly
   - Test session persistence across requests

6. **Document Changes**
   - Update README.md for user-facing changes
   - Update AGENT.md for development guidelines
   - Keep documentation in sync with code

### DON'T ❌

1. **Don't Add Software Development Personas**
   - No "Software Engineer", "DevOps Engineer", etc.
   - Keep focus on business consulting domain

2. **Don't Break Session Routing**
   - Always use `idFromString()` for session IDs (not `idFromName()`)
   - This was a critical bug that was fixed - don't reintroduce it

3. **Don't Remove Core Files**
   - All files in `src/workers/` are essential
   - Don't delete or rename without understanding dependencies

4. **Don't Change MCP Protocol Version**
   - Locked to 2024-11-05 for compatibility
   - Changing this breaks ChatGPT integration

5. **Don't Add External Dependencies**
   - Keep dependencies minimal
   - Cloudflare Workers has size limits
   - Only add if absolutely necessary

6. **Don't Modify Synthesis Algorithms Without Testing**
   - Synthesis strategies are mathematically designed
   - Changes can break consensus/confidence calculations
   - Test thoroughly if modifying

---

## 🔧 Common Tasks

### Adding a New Agent Persona

1. Open `src/workers/agent-personas.ts`
2. Add to appropriate category (Strategy, Finance, Marketing, Operations, Synthesis)
3. Follow the `AgentPersona` interface:
   ```typescript
   {
     id: "unique_id",
     role: "Expert Title",
     focus: "Primary focus area",
     expertise: ["skill1", "skill2", "skill3"],
     thinking_style: "How they approach problems",
     prompt_template: "Detailed prompt for ChatGPT to adopt this persona"
   }
   ```
4. Add to `AGENT_PERSONAS` object
5. Update README.md with new persona in the list
6. Test with `list_agent_personas` tool

### Adding a New Synthesis Strategy

1. Open `src/workers/synthesis-strategies.ts`
2. Create new function following pattern:
   ```typescript
   function myStrategySynthesis(results: AgentResult[]): SynthesisResult
   ```
3. Add to `synthesizeResults()` switch statement
4. Update type union: `'consensus' | 'weighted' | ... | 'my_strategy'`
5. Document in README.md
6. Test with `synthesize_parallel_reasoning` tool

### Adding a New MCP Tool

1. Define tool schema in `src/workers/parallel-reasoning-tools.ts`
2. Implement handler function
3. Register in `src/workers/everything-workers.ts`:
   - Add to `tools` array
   - Add to tool handler switch statement
4. Update README.md API reference
5. Update AGENT.md with usage guidelines
6. Test locally and in production

### Modifying Session State

1. Update interface in `src/workers/parallel-reasoning-engine.ts`
2. Update persistence methods in `src/workers/session.ts`:
   - `getParallelReasoningSessions()`
   - `persistParallelReasoningSessions()`
3. Handle migration for existing sessions (if breaking change)
4. Test session persistence across requests

### Debugging Issues

1. **Local Testing**:
   ```bash
   npm run workers:dev
   # Server runs on http://localhost:8787
   ```

2. **Check Logs**:
   - Local: Terminal output from wrangler dev
   - Production: Cloudflare Workers dashboard → Logs

3. **Test Tools**:
   ```bash
   ./test-parallel-reasoning-v2.sh
   ```

4. **Common Issues**:
   - Session not found → Check `idFromString()` usage
   - Tool not found → Check registration in everything-workers.ts
   - State not persisting → Check Durable Objects persistence
   - SSE not working → Check Express adapter implementation

---

## 📊 Testing Guidelines

### Local Testing

```bash
# Start local server
npm run workers:dev

# Test with curl
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Expected: MCP initialization response
```

### Production Testing

```bash
# Test production endpoint
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

### Integration Testing (ChatGPT)

1. Configure MCP in ChatGPT Developer Mode
2. Ask ChatGPT to list available tools
3. Run a simple 2-agent analysis
4. Verify synthesis results
5. Check session persistence

---

## 🚀 Deployment

### Prerequisites

- Cloudflare account
- API Token with Workers permissions
- Account ID: `a6bc052b995103bc3ac7329151ccd785`

### Deploy Command

```bash
# Set credentials
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="a6bc052b995103bc3ac7329151ccd785"

# Deploy
npm run workers:deploy

# Verify
curl https://mcp-server.vf-ghizzoni.workers.dev/
```

### Post-Deployment

1. Test all 7 tools in production
2. Verify Durable Objects working
3. Check session persistence
4. Monitor logs with `npx wrangler tail`

---

## 📚 Key Documentation

1. **[README.md](README.md)** - Project overview, quick start, API reference
2. **[AGENT.md](AGENT.md)** - This file - AI agent development guidelines
3. **[LICENSE](LICENSE)** - MIT License

---

## 🎯 Design Principles

1. **Business Focus** - Always prioritize business consulting use cases
2. **Type Safety** - Strict TypeScript, no shortcuts
3. **State Persistence** - Never lose user data
4. **MCP Compliance** - Follow protocol exactly
5. **Performance** - Optimize for Cloudflare Workers edge
6. **Documentation** - Keep docs in sync with code
7. **Testing** - Test locally before deploying
8. **Simplicity** - Prefer simple solutions over complex ones

---

## 🔐 Security Considerations

1. **No API Keys Required** - System uses ChatGPT's own reasoning
2. **Session Isolation** - Each session is isolated in Durable Objects
3. **No External Calls** - All computation happens in Workers
4. **Input Validation** - Validate all tool inputs
5. **Rate Limiting** - Cloudflare Workers provides DDoS protection

---

## 💡 Best Practices

### Code Style

- Use descriptive variable names
- Add comments for complex logic
- Keep functions focused and small
- Use async/await for promises
- Handle errors gracefully

### Git Commits

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Write descriptive commit messages
- Reference issues if applicable
- Keep commits atomic

### Performance

- Minimize Durable Objects writes (they're slower)
- Use batch operations where possible
- Cache frequently accessed data
- Optimize JSON serialization

### Timeouts

**Current Configuration**:
- **Regular Responses**: 30 seconds (`express-adapter.ts:332`)
- **LLM Sampling**: 30 seconds (same timeout)
- **Long Running Operations**: Configurable via tool parameters

**When to Adjust**:
- If operations consistently take >25 seconds, consider increasing timeout
- If operations are fast (<5 seconds), current timeout is fine
- Monitor logs for "Response timeout - returning buffered content" warnings

**Cloudflare Workers Limits**:
- Free Plan: 10ms CPU time per request
- Paid Plan: 50ms CPU time per request
- Wall-clock time: No hard limit, but keep under 30 seconds for UX

---

## 🆘 Getting Help

1. **Check Documentation** - Read README.md and this file first
2. **Review Code** - Look at existing implementations
3. **Test Locally** - Reproduce issues in local environment
4. **Check Logs** - Use `npx wrangler tail` for real-time logs
5. **Review Recent Updates** - Check the "Recent Updates" section below
6. **Ask User** - If unclear, ask for clarification

### Debugging Session Issues

If parallel reasoning tools fail with "Session not found":

1. **Check Logs** - Look for these patterns:
   ```
   [Worker] POST /mcp - Session ID from header: <id>
   [MCPSession] Loaded N sessions from storage
   [ParallelReasoning] Looking for session <id>. Total sessions: N
   ```

2. **Verify Session ID** - Ensure the session_id from `parallel_reasoning_init` is used exactly

3. **Check Durable Object Routing**:
   - Same session_id should route to same DO
   - Look for "Using existing DO" vs "Creating new DO" in logs

4. **Verify Persistence**:
   - Look for "Persisting N sessions to storage"
   - Look for "Successfully persisted sessions"
   - Check if N matches expected count

5. **Common Causes**:
   - Client not passing `mcp-session-id` header → New DO created each time
   - Storage not persisting → Sessions lost between requests
   - Typo in session_id → Wrong session requested

---

## ✅ Checklist for Changes

Before committing changes:

- [ ] Code compiles without errors
- [ ] All types are properly defined
- [ ] Local testing passes
- [ ] Documentation updated
- [ ] No breaking changes to MCP protocol
- [ ] Session state migration handled (if needed)
- [ ] Commit message follows conventions
- [ ] Ready for production deployment

---

## 🎊 Success Criteria

A successful change should:

✅ Maintain or improve system functionality
✅ Not break existing features
✅ Be well-documented
✅ Be tested locally and in production
✅ Follow TypeScript best practices
✅ Respect the business consulting domain
✅ Maintain MCP protocol compliance

---

**Remember**: This system enables ChatGPT to perform multi-agent parallel reasoning for complex business analysis. Every change should enhance this core capability while maintaining reliability, performance, and user experience.

**Production URL**: https://mcp-server.vf-ghizzoni.workers.dev
**Status**: ✅ OPERATIONAL
**Version**: 2.0.2

---

## 🔧 Recent Updates

### v2.0.2 - Error Handling & Diagnostics (2025-09-30)

**Critical Fixes for ChatGPT Integration**

#### Issues Resolved:

1. **`parallel_compute_status` Never Returns 400** ✅
   - **Problem**: Status check would fail with 400 Bad Request when session not found
   - **Root Cause**: Function threw errors instead of returning diagnostic info
   - **Solution**: Modified to always return 200 OK with diagnostic information
   - **Files Modified**: `src/workers/parallel-reasoning-tools.ts` (lines 372-449)
   - **Impact**: Clients can always diagnose issues, even when sessions are missing

2. **Enhanced Synthesis Error Messages** ✅
   - **Problem**: Generic "Synthesis blocked" errors without actionable information
   - **Root Cause**: Error message didn't show which agents were incomplete or what to do
   - **Solution**: Enhanced error messages with:
     - Exact progress percentage (e.g., "1/3 agents completed (33%)")
     - List of incomplete agents with their status
     - Three clear options on how to proceed
     - Explicit suggestion to use `parallel_compute_status`
   - **Files Modified**: `src/workers/parallel-reasoning-tools.ts` (lines 294-320)
   - **Impact**: ChatGPT receives actionable guidance on how to proceed

3. **Changed Default `require_all_completed` to `true`** ✅
   - **Problem**: Default `false` allowed premature synthesis before all agents completed
   - **Root Cause**: Poor default behavior led to incomplete analysis
   - **Solution**: Changed default to `true` to prevent premature synthesis
   - **Files Modified**: `src/workers/parallel-reasoning-tools.ts` (line 59)
   - **Impact**: Better quality results by default, clients must explicitly opt-in to partial synthesis

4. **Improved Tool Descriptions** ✅
   - **Problem**: Tool descriptions didn't mention default behavior or best practices
   - **Solution**: Updated `synthesize_parallel_reasoning` description to:
     - Mention default `require_all_completed=true`
     - Suggest using `parallel_compute_status` first
   - **Files Modified**: `src/workers/everything-workers.ts` (lines 407-412)
   - **Impact**: Better guidance for ChatGPT on proper workflow

#### Key Changes:

**Status Check Always Returns 200 OK** (`src/workers/parallel-reasoning-tools.ts`):
```typescript
// IMPORTANT: Never throw error for status check - always return status info
if (!session) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        session_id: args.session_id,
        status: 'not_found',
        error: true,
        error_type: 'session_not_found',
        troubleshooting: {
          tip: 'Make sure you are using the session_id returned by parallel_reasoning_init',
          possible_causes: [...]
        }
      }, null, 2)
    }]
  };
}
```

**Enhanced Synthesis Error Message**:
```typescript
throw new Error(
  `❌ Synthesis Blocked: Waiting for ${incompleteAgents.length} more agent(s) to complete.\n\n` +
  `Progress: ${completedCount}/${agentStates.length} agents completed (${Math.round(completedCount/agentStates.length*100)}%)\n\n` +
  `Incomplete agents:\n${incompleteDetails.map(a =>
    `  • ${a.role} (${a.agent_id}): ${a.status} - ${a.progress}% complete`
  ).join('\n')}\n\n` +
  `💡 Options:\n` +
  `  1. Wait for all agents to complete their reasoning steps\n` +
  `  2. Call synthesize_parallel_reasoning with require_all_completed=false for partial synthesis\n` +
  `  3. Use parallel_compute_status to monitor progress`
);
```

**Workflow Improvements**:
- Status checks never fail → Always provide diagnostic information
- Error messages are actionable → Show exactly what's wrong and how to fix it
- Default behavior is safe → Prevents incomplete analysis by default
- Tool descriptions guide proper usage → ChatGPT knows the recommended workflow

#### Recommended Workflow for ChatGPT:

1. **Initialize Session**: Call `parallel_reasoning_init` with task and perspectives
2. **Submit Agent Reasoning**: Call `agent_reasoning_step` for each agent
3. **Check Status**: Always call `parallel_compute_status` before synthesis
4. **Synthesize**: Call `synthesize_parallel_reasoning` only when all agents complete
5. **Handle Errors**: If synthesis fails, check the error message for guidance

#### Testing the Fixes:

1. **Test Status Check on Non-Existent Session**:
   ```json
   {"tool": "parallel_compute_status", "arguments": {"session_id": "fake_session_id"}}
   ```
   Expected: 200 OK with diagnostic info (not 400 error)

2. **Test Premature Synthesis**:
   ```json
   // Step 1: Create session with 3 agents
   {"tool": "parallel_reasoning_init", "arguments": {"task": "...", "perspectives": ["agent_1", "agent_2", "agent_3"]}}

   // Step 2: Submit only 1 agent reasoning
   {"tool": "agent_reasoning_step", "arguments": {"session_id": "...", "agent_id": "agent_1", ...}}

   // Step 3: Try to synthesize (should fail with detailed message)
   {"tool": "synthesize_parallel_reasoning", "arguments": {"session_id": "..."}}
   ```
   Expected: Error message showing "1/3 agents completed (33%)" with actionable options

3. **Test Status Check After Error**:
   ```json
   {"tool": "parallel_compute_status", "arguments": {"session_id": "..."}}
   ```
   Expected: Works correctly (returns current status)

#### For AI Agents Working on This Codebase:

When debugging parallel reasoning issues:
1. **Status Check Failures**: Remember that `parallel_compute_status` should NEVER return 400 - if it does, the fix was broken
2. **Synthesis Errors**: Check that error messages include progress percentage and actionable options
3. **Default Behavior**: Verify `require_all_completed` defaults to `true` in the schema
4. **Tool Descriptions**: Ensure tool descriptions guide proper workflow (status check before synthesis)
5. **Error Handling Philosophy**: Status/diagnostic tools should always succeed and provide information, never fail with errors

---

### v2.1.0 - Phase 1-3 Improvements (2025-09-30)

**Latest Update - Operational Effectiveness Enhancements**

This release implements three major phases of improvements based on production usage analysis:

#### Phase 1: Error Handling Robustness ✅

**Problem**: Generic 400/500 errors with no context or retry guidance.

**Solution**:
- ✅ New `error-handling.ts` module with structured error system
- ✅ HTTP semantic codes: 404 (Not Found), 409 (Conflict), 412 (Precondition Failed), 206 (Partial Content)
- ✅ Machine-readable errors with `error_type`, `retriable`, `details`, `suggestions`
- ✅ ErrorFactory with pre-built constructors for common errors
- ✅ Integration across all tool handlers

**Example Error**:
```json
{
  "error": "Session not found: abc123",
  "error_type": "session_not_found",
  "http_code": 404,
  "retriable": false,
  "details": { "session_id": "abc123", "available_sessions": [...] },
  "suggestions": ["Make sure you're using the correct session_id", ...]
}
```

#### Phase 2: Partial Synthesis Enhancement ✅

**Problem**: Synthesis with incomplete agents returned generic success (HTTP 200) with no warnings.

**Solution**:
- ✅ HTTP 206 Partial Content for incomplete synthesis
- ✅ `confidence_interval` with lower/upper bounds for partial results
- ✅ Detailed `warnings` array listing incomplete agents
- ✅ `coverage_percentage` metric (e.g., "67% coverage - 2 of 3 agents")
- ✅ Visual distinction: 🎉 HTTP 200 (full) vs ⚠️ HTTP 206 (partial)

**Example Partial Synthesis**:
```json
{
  "http_status": 206,
  "partial_synthesis": true,
  "confidence": 0.75,
  "confidence_interval": {
    "lower_bound": 0.6375,
    "upper_bound": 0.75,
    "note": "Confidence interval widened due to incomplete agents"
  },
  "warnings": [
    "Synthesis performed with 1 of 3 agents incomplete (67% coverage)",
    "Results may be partial and less comprehensive",
    "Agent Marketing Strategist is reasoning at 40% progress"
  ],
  "coverage_percentage": 67
}
```

#### Phase 3: Persona Management ✅

**Problem**: `product_manager` not supported → immediate error. No fuzzy matching for typos.

**Solution**:
- ✅ 60+ persona aliases (e.g., `product_manager` → `project_manager`, `pm` → `project_manager`, `finance` → `financial_analyst`)
- ✅ Automatic alias resolution in `getAgentPersona()`
- ✅ Fuzzy matching with Levenshtein distance for typo detection
- ✅ New tool: `validate_session_spec` for pre-validation before session init
- ✅ Enhanced error messages with `did_you_mean` suggestions

**Example Validation**:
```json
{
  "validation_status": "invalid",
  "results": [
    {
      "persona_id": "product_manager",
      "status": "invalid",
      "did_you_mean": ["project_manager"],
      "suggestions": [...]
    }
  ]
}
```

#### Impact Summary

**Before v2.1.0**:
- ❌ Generic 400/500 errors
- ❌ Partial synthesis indistinguishable from full
- ❌ `product_manager` → immediate failure
- ❌ No pre-validation capability

**After v2.1.0**:
- ✅ Semantic HTTP codes with actionable errors
- ✅ HTTP 206 + warnings + confidence intervals
- ✅ 60+ aliases + fuzzy matching
- ✅ `validate_session_spec` tool
- ✅ Better developer experience

#### Files Modified
- `src/workers/error-handling.ts` (NEW)
- `src/workers/agent-personas.ts` (aliases + fuzzy matching)
- `src/workers/parallel-reasoning-engine.ts` (error integration)
- `src/workers/parallel-reasoning-tools.ts` (partial synthesis + new tool)
- `src/workers/everything-workers.ts` (error handling)

---

### v2.0.2 - Status Endpoint Improvements (2025-09-30)

**Previous Update**

#### Issues Resolved:

1. **sampleLLM Timeout** ✅
   - Increased timeout from 5 to 30 seconds in `express-adapter.ts`
   - Tool now completes successfully without 500 errors

2. **Session Diagnostics** ✅
   - Added extensive logging throughout session lifecycle
   - Files: `index.ts`, `session.ts`, `parallel-reasoning-tools.ts`
   - Can now diagnose session persistence issues in production

3. **Improved Error Messages** ✅
   - Enhanced "Session not found" errors with available sessions list
   - Added helpful tips for users

