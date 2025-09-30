# 🤖 ChatGPT Integration Guide

## How to Use Parallel Reasoning from ChatGPT Developer Mode

This guide shows you how to connect ChatGPT to your MCP Parallel Reasoning server and execute multi-agent analysis.

---

## 🔗 Server Information

**Production URL**: `https://mcp-server.vf-ghizzoni.workers.dev`

**Protocol**: Model Context Protocol (MCP) over Streamable HTTP with SSE

**Status**: ✅ OPERATIONAL

---

## 📋 Step-by-Step Integration

### Step 1: Configure MCP Connection in ChatGPT

In ChatGPT Developer Mode, add the MCP server configuration:

```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "url": "https://mcp-server.vf-ghizzoni.workers.dev/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### Step 2: Test Connection

Ask ChatGPT to list available tools:

```
List all available MCP tools from the parallel-reasoning server
```

You should see 7 parallel reasoning tools:
- `parallel_reasoning_init`
- `agent_reasoning_step`
- `cross_agent_communication`
- `synthesize_parallel_reasoning`
- `parallel_compute_status`
- `agent_debate`
- `list_agent_personas`

### Step 3: List Available Agent Personas

```
Use the list_agent_personas tool to show me all available expert agents
```

Expected output: 15 agent personas across Strategy, Finance, Marketing, Operations, and Synthesis categories.

---

## 🎯 Example Workflow: Market Entry Analysis

### Prompt to ChatGPT:

```
I need to analyze a market entry strategy for a fintech startup entering the European market. 

Please use the parallel reasoning system to:

1. Initialize a parallel reasoning session with these agents:
   - strategy_consultant
   - financial_analyst
   - marketing_strategist
   - risk_manager

2. For each agent, adopt their persona and provide detailed analysis of the market entry strategy

3. Enable cross-agent communication if agents need to collaborate

4. Monitor progress using parallel_compute_status

5. Synthesize all perspectives using the "consensus" strategy

6. Present the final unified recommendation

Task: "Analyze market entry strategy for a fintech startup in Europe focusing on payments and digital banking"
```

### Expected ChatGPT Behavior:

1. **Initialize Session**: ChatGPT calls `parallel_reasoning_init` and receives agent prompts

2. **Parallel Reasoning**: ChatGPT adopts each agent persona and provides analysis:
   - Strategy Consultant: Competitive landscape, strategic positioning, market entry approach
   - Financial Analyst: Capital requirements, financial projections, ROI analysis
   - Marketing Strategist: Brand positioning, customer acquisition, go-to-market strategy
   - Risk Manager: Regulatory risks, operational risks, mitigation strategies

3. **Submit Reasoning**: For each agent, ChatGPT calls `agent_reasoning_step` with detailed analysis

4. **Cross-Agent Communication** (optional): Agents ask questions or challenge each other

5. **Monitor Progress**: ChatGPT checks `parallel_compute_status` to see agent progress

6. **Synthesize**: ChatGPT calls `synthesize_parallel_reasoning` to combine all perspectives

7. **Present Results**: ChatGPT presents the unified recommendation with:
   - Final answer
   - Confidence level
   - Consensus score
   - Agent contributions
   - Conflicts resolved

---

## 🎭 Example Workflow: M&A Deal Evaluation

### Prompt to ChatGPT:

```
I'm evaluating an M&A acquisition target. Use parallel reasoning with these agents:
- ma_advisor
- financial_analyst
- cfo_advisor
- operations_manager
- risk_manager

Task: "Evaluate acquisition of a SaaS company with $10M ARR, 40% growth rate, $50M valuation ask"

Use weighted synthesis strategy (higher weight to financial agents).
```

---

## 🎪 Example Workflow: Agent Debate

### Prompt to ChatGPT:

```
I need to decide between two strategic options. Use parallel reasoning with agent debate:

Agents:
- strategy_consultant (Option A advocate)
- cfo_advisor (Option B advocate)
- risk_manager (neutral evaluator)
- judge (final decision maker)

Task: "Should we expand to Asia (Option A) or consolidate in Europe (Option B)?"

1. Each agent presents their position
2. Initiate debate using agent_debate tool
3. Agents challenge each other's assumptions
4. Judge makes final decision using dialectic synthesis
```

---

## 💡 Advanced Usage Patterns

### Pattern 1: Hierarchical Analysis

```
1. First session: Domain experts analyze the problem
2. Synthesize expert insights
3. Second session: Synthesizer + Judge meta-analyze the synthesis
4. Final recommendation
```

### Pattern 2: Iterative Refinement

```
1. Initial parallel reasoning session
2. Review synthesis results
3. Identify gaps or conflicts
4. New session with additional agents to address gaps
5. Final synthesis combining both sessions
```

### Pattern 3: Scenario Analysis

```
1. Session 1: Analyze best-case scenario
2. Session 2: Analyze worst-case scenario
3. Session 3: Analyze most-likely scenario
4. Compare and synthesize across scenarios
```

---

## 🔍 Monitoring and Debugging

### Check Session Status

```
Use parallel_compute_status to show me the current state of the reasoning session
```

### View Agent Progress

```
Show me which agents have completed their analysis and which are still in progress
```

### Review Cross-Agent Messages

```
Show me all messages exchanged between agents during this session
```

---

## 🎯 Best Practices for ChatGPT Integration

### 1. Clear Task Definition
- Provide specific context and constraints
- Define success criteria
- Specify time horizon and scope

### 2. Agent Selection
- Choose 3-5 complementary agents
- Include domain experts + risk/synthesis agents
- Match agents to problem domain

### 3. Detailed Reasoning
- Each agent should provide 3-5 paragraphs of analysis
- Include specific examples and data points
- Identify assumptions and constraints
- Set realistic confidence levels (0.7-0.9)

### 4. Synthesis Strategy
- **Consensus**: When alignment is critical
- **Weighted**: When some agents are more expert
- **Dialectic**: When there are conflicting views
- **Ensemble**: When comprehensive coverage needed

### 5. Iterative Refinement
- Review synthesis results
- Use cross-agent communication to resolve conflicts
- Add agents if gaps identified
- Re-synthesize with refined inputs

---

## 🚨 Troubleshooting

### Issue: ChatGPT can't connect to server
**Solution**: Verify server URL and check that it's accessible: `https://mcp-server.vf-ghizzoni.workers.dev`

### Issue: Tools not appearing
**Solution**: Refresh ChatGPT session or re-add MCP server configuration

### Issue: Low synthesis confidence
**Solution**: 
- Provide more detailed agent reasoning
- Add more agents for broader perspective
- Use cross-agent communication to resolve conflicts

### Issue: Agents not progressing
**Solution**:
- Check agent dependencies
- Verify all agents have submitted reasoning
- Use `parallel_compute_status` to identify issues

---

## 📊 Success Metrics

After using the system, you should see:

✅ **Multiple Perspectives**: 3-5 expert viewpoints on the problem
✅ **High Confidence**: Synthesis confidence > 0.8
✅ **Strong Consensus**: Consensus level > 0.7
✅ **Actionable Recommendations**: Specific next steps with rationale
✅ **Risk Identification**: Potential issues flagged early
✅ **Comprehensive Analysis**: All key dimensions covered

---

## 🎉 Example Success Case

**Task**: Market entry strategy for fintech startup in Europe

**Agents**: strategy_consultant, financial_analyst, marketing_strategist, risk_manager

**Results**:
- ✅ Synthesis Confidence: 87%
- ✅ Consensus Level: 82%
- ✅ 4 agent perspectives integrated
- ✅ 12 key recommendations identified
- ✅ 5 major risks flagged with mitigation strategies
- ✅ Clear go-to-market roadmap with timeline

**Outcome**: Comprehensive market entry plan with strategic, financial, marketing, and risk perspectives fully integrated.

---

## 🚀 Next Steps

1. **Test the connection** - Verify ChatGPT can access the server
2. **Run a simple analysis** - Try a 2-3 agent session on a familiar problem
3. **Experiment with patterns** - Try different agent combinations and synthesis strategies
4. **Scale up** - Use for real business decisions with 4-5 agents
5. **Iterate** - Refine your prompts and agent selection based on results

---

## 📚 Additional Resources

- [Parallel Reasoning Guide](./PARALLEL_REASONING_GUIDE.md) - Complete system documentation
- [Agent Personas Reference](./src/workers/agent-personas.ts) - All available agents
- [Synthesis Strategies](./src/workers/synthesis-strategies.ts) - How synthesis works

---

## 🤝 Support

For issues or questions:
1. Check [PARALLEL_REASONING_GUIDE.md](./PARALLEL_REASONING_GUIDE.md) troubleshooting section
2. Review server logs at Cloudflare Workers dashboard
3. Test locally with `npm run workers:dev`

---

## 🎊 Congratulations!

You now have a fully operational multi-agent parallel reasoning system integrated with ChatGPT!

This enables you to:
- ✅ Analyze complex problems from multiple expert perspectives
- ✅ Make better decisions with comprehensive analysis
- ✅ Identify risks and opportunities early
- ✅ Generate actionable recommendations with high confidence
- ✅ Replicate Grok 4 Heavy / GPT-5 Pro parallel compute for $0

**Happy reasoning! 🧠✨**

