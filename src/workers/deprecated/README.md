# Deprecated Code

This directory contains deprecated code that is no longer used in the current version of the MCP PTU Server.

## Files

### `agent-personas.ts`

**Deprecated in**: v3.0
**Replaced by**: Capability-driven architecture

**Reason**: The persona-based approach was replaced with atomic capabilities for better composability and flexibility.

**Migration**: Use the capability system in `src/workers/capabilities/` instead.

### `parallel-reasoning-engine.ts`

**Deprecated in**: v5.0
**Replaced by**: `parallel-reasoning-mcp.ts` and `parallel-reasoning-tools-v5.ts`

**Reason**: The original parallel reasoning engine was replaced with an LLM-centric architecture where ChatGPT is the sole deliberative agent and MCP provides only guardrails and persistent memory.

**Migration**: Use the new parallel reasoning tools:
- `init_parallel_reasoning`
- `submit_reasoning_plan`
- `execute_plan_step`
- `submit_cross_plan_note`
- `submit_peer_critique`
- `submit_mediation_decision`
- `list_plan_status`
- `finalize_parallel_reasoning`

## Why Keep Deprecated Code?

These files are kept for:
1. **Historical reference** - Understanding the evolution of the architecture
2. **Migration support** - Helping users migrate from old APIs
3. **Documentation** - Providing context for design decisions

## Removal Policy

Deprecated code will be removed in the next major version (v6.0) if:
- No active users are using the deprecated APIs
- All migration paths are documented
- At least 6 months have passed since deprecation

