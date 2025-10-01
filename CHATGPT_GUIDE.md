# ChatGPT Quick Start Guide

## 🎯 Setup (One Time)

1. **Enable Developer Mode** in ChatGPT Settings → Beta Features
2. **Add MCP Server**: `https://mcp-server.vf-ghizzoni.workers.dev/proxy`
3. **Done!** You can now use all parallel reasoning tools

## ✅ Simple Usage (Recommended)

**Just use the SAME `session_id` for all tool calls in your workflow!**

```
I need to analyze: [YOUR TASK]

Use session_id="my_analysis_001" for ALL tool calls below:

1. init_parallel_reasoning with session_id="my_analysis_001"
2. submit_reasoning_plan with session_id="my_analysis_001"
3. execute_plan_step with session_id="my_analysis_001"
... and so on
```

**That's it!** The `/proxy` endpoint automatically handles the MCP session routing for you.

## 🔧 How It Works

### What You Do
- Choose a `session_id` (e.g., `"my_analysis_001"`)
- Use the SAME `session_id` in all parallel reasoning tool calls
- No need to manage HTTP headers or MCP session IDs

### What the Proxy Does
1. Extracts your `session_id` from the request body
2. Adds it as `mcp-session-id` header for Durable Object routing
3. Forwards the request to the MCP server
4. Returns the response to you

## 📝 Example Workflow

```
Task: Analyze market opportunity for AI-powered CRM

Step 1: Initialize
Tool: init_parallel_reasoning
Arguments:
  session_id: "crm_analysis_2025"
  task_description: "Analyze market opportunity for AI-powered CRM"
  required_diversity_axes: ["data_sources", "analytical_models", "risk_perspectives"]

Step 2: Submit Plan A
Tool: submit_reasoning_plan
Arguments:
  session_id: "crm_analysis_2025"  ← SAME session_id
  plan:
    plan_id: "plan_quantitative"
    description: "Quantitative market analysis"
    diversity_axes: ["data_sources", "analytical_models"]
    capability_chain: ["market_scan", "tam_sam_som_build", ...]
    rationale: "Data-driven approach"
    expected_outputs: ["market_size", "growth_rate"]

Step 3: Submit Plan B
Tool: submit_reasoning_plan
Arguments:
  session_id: "crm_analysis_2025"  ← SAME session_id
  plan:
    plan_id: "plan_qualitative"
    description: "Qualitative risk analysis"
    diversity_axes: ["analytical_models", "risk_perspectives"]
    capability_chain: ["risk_scan", "scenario_build", ...]
    rationale: "Risk-focused approach"
    expected_outputs: ["risk_factors", "mitigation_strategies"]

... continue with execute_plan_step, submit_peer_critique, etc.
```

## ⚠️ Common Mistakes

### ❌ WRONG: Changing session_id between calls
```
init_parallel_reasoning with session_id="session_001"
submit_reasoning_plan with session_id="session_002"  ← Different ID!
```
**Result**: "Session not found" error

### ✅ CORRECT: Same session_id for all calls
```
init_parallel_reasoning with session_id="session_001"
submit_reasoning_plan with session_id="session_001"  ← Same ID!
execute_plan_step with session_id="session_001"      ← Same ID!
```
**Result**: Works perfectly!

## 🚀 Advanced: Multiple Workflows

You can run multiple parallel reasoning workflows simultaneously by using different `session_id` values:

```
Workflow 1: session_id="market_analysis"
  - init_parallel_reasoning
  - submit_reasoning_plan (plan_A)
  - submit_reasoning_plan (plan_B)
  - ...

Workflow 2: session_id="competitor_analysis"
  - init_parallel_reasoning
  - submit_reasoning_plan (plan_X)
  - submit_reasoning_plan (plan_Y)
  - ...
```

Each workflow is independent and has its own state.

## 🔍 Troubleshooting

### "Session not found" error
- **Cause**: You changed `session_id` between tool calls
- **Fix**: Use the SAME `session_id` for all calls in one workflow

### "400 Bad Request" error
- **Cause**: You're using the wrong endpoint
- **Fix**: Make sure you're using `/proxy` endpoint, not `/mcp`

### "Tool not found" error
- **Cause**: MCP server not properly configured
- **Fix**: Check that you added `https://mcp-server.vf-ghizzoni.workers.dev/proxy` in ChatGPT settings

## 📚 Available Tools

1. **init_parallel_reasoning** - Initialize a new parallel reasoning session
2. **submit_reasoning_plan** - Submit a reasoning plan (need 3+ plans with diverse axes)
3. **execute_plan_step** - Execute a capability in a plan
4. **submit_cross_plan_note** - Share insights between plans
5. **submit_peer_critique** - One plan critiques another
6. **submit_mediation_decision** - Mediate between conflicting approaches
7. **list_plan_status** - Check status of all plans
8. **finalize_parallel_reasoning** - Finalize and get decision map

## 🎓 Best Practices

1. **Choose meaningful session_id**: Use descriptive names like `"market_analysis_2025"` instead of `"session_001"`
2. **Use diverse plans**: Make sure your plans differ on at least 2 diversity axes
3. **Execute all plans**: Don't skip plan execution - it's required for finalization
4. **Peer review**: Have plans critique each other for better insights
5. **Mediate decisions**: Use mediation to resolve conflicts between plans

## 🆘 Need Help?

- **Documentation**: See [README.md](./README.md) for detailed prompt templates
- **Technical Details**: See [SESSION_ID_EXPLAINED.md](./SESSION_ID_EXPLAINED.md) for how session IDs work
- **Agent Guidelines**: See [AGENT.md](./AGENT.md) for technical implementation details

## 🎉 You're Ready!

Start with a simple analysis task and use the same `session_id` for all tool calls. The proxy handles everything else!

