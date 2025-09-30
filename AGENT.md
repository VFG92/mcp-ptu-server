# 🤖 Agent Instructions

**For AI Agents (OpenAI Codex, Claude, GPT, etc.)**

This file provides comprehensive instructions for AI agents working with this repository.

---

## 📋 Repository Overview

**Project**: Multi-Agent Parallel Reasoning MCP Server
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

2. **Synthesis Strategies** (`src/workers/synthesis-strategies.ts`)
   - 5 algorithms: consensus, weighted, dialectic, best_of_n, ensemble
   - Combine multiple agent outputs into unified recommendations

3. **Parallel Reasoning Engine** (`src/workers/parallel-reasoning-engine.ts`)
   - Session management, agent state tracking, cross-agent communication
   - Progress monitoring, real-time status updates

4. **MCP Tools** (`src/workers/parallel-reasoning-tools.ts`)
   - 7 tools for ChatGPT to orchestrate parallel reasoning
   - Tool handlers that interact with the engine

5. **Session Management** (`src/workers/session.ts`)
   - Durable Objects for stateful sessions
   - Persists agent states, messages, synthesis results

6. **MCP Server Integration** (`src/workers/everything-workers.ts`)
   - Main MCP server implementation
   - Registers all tools and handlers

7. **Routing** (`src/workers/index.ts`)
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
├── agent-personas.ts              # 15 expert personas definitions
├── synthesis-strategies.ts        # 5 synthesis algorithms
├── parallel-reasoning-engine.ts   # Core engine (session, agents, messages)
├── parallel-reasoning-tools.ts    # 7 MCP tool handlers
├── session.ts                     # Durable Objects state management
├── everything-workers.ts          # MCP server integration
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
   - Use `test-parallel-reasoning-v2.sh` for automated testing
   - Verify all 7 tools work correctly

6. **Document Changes**
   - Update relevant .md files when changing functionality
   - Keep PARALLEL_REASONING_GUIDE.md in sync with code
   - Update REPOSITORY_STATUS.md for major changes

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
5. Update `PARALLEL_REASONING_GUIDE.md` with new persona
6. Test with `list_agent_personas` tool

### Adding a New Synthesis Strategy

1. Open `src/workers/synthesis-strategies.ts`
2. Create new function following pattern:
   ```typescript
   function myStrategySynthesis(results: AgentResult[]): SynthesisResult
   ```
3. Add to `synthesizeResults()` switch statement
4. Update type union: `'consensus' | 'weighted' | ... | 'my_strategy'`
5. Document in `PARALLEL_REASONING_GUIDE.md`
6. Test with `synthesize_parallel_reasoning` tool

### Adding a New MCP Tool

1. Define tool schema in `src/workers/parallel-reasoning-tools.ts`
2. Implement handler function
3. Register in `src/workers/everything-workers.ts`:
   - Add to `tools` array
   - Add to tool handler switch statement
4. Update `PARALLEL_REASONING_GUIDE.md` API reference
5. Update `CHATGPT_INTEGRATION.md` if user-facing
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

# In another terminal, run tests
./test-parallel-reasoning-v2.sh

# Expected output:
# ✅ MCP Session initialized
# ✅ List personas: 15 agents
# ✅ Parallel reasoning session created
# ✅ Agent reasoning submitted
# ✅ Status retrieved
# ✅ Cross-agent communication
# ✅ Synthesis completed
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
4. Update REPOSITORY_STATUS.md if needed

---

## 📚 Key Documentation

1. **[README.md](README.md)** - Project overview, quick start
2. **[PARALLEL_REASONING_GUIDE.md](PARALLEL_REASONING_GUIDE.md)** - Complete system guide (300 lines)
3. **[CHATGPT_INTEGRATION.md](CHATGPT_INTEGRATION.md)** - ChatGPT integration (300 lines)
4. **[REPOSITORY_STATUS.md](REPOSITORY_STATUS.md)** - Current status, metrics
5. **[CLEANUP_PLAN.md](CLEANUP_PLAN.md)** - Cleanup rationale

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

---

## 🆘 Getting Help

1. **Check Documentation** - Read PARALLEL_REASONING_GUIDE.md first
2. **Review Code** - Look at existing implementations
3. **Test Locally** - Reproduce issues in local environment
4. **Check Logs** - Cloudflare Workers dashboard
5. **Ask User** - If unclear, ask for clarification

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
**Version**: 2.0.0

