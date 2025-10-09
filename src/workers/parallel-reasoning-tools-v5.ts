/**
 * MCP Tool Handlers for Parallel Reasoning v5.0
 * 
 * LLM-CENTRIC ARCHITECTURE:
 * - MCP = Guardrails + Persistent Memory (NO intelligence)
 * - ChatGPT = Unico agente deliberativo (planning, reasoning, mediation)
 * - Parallel reasoning happens INSIDE ChatGPT, not in server
 * 
 * WORKFLOW:
 * 1. ChatGPT: init_parallel_reasoning → declares diversity axes
 * 2. ChatGPT: submit_reasoning_plan (Plan A, B, C...) → server validates diversity
 * 3. ChatGPT: execute_plan_step → invokes capabilities, server persists
 * 4. ChatGPT: submit_cross_plan_note → contamination between plans
 * 5. ChatGPT: submit_peer_critique → peer review (ChatGPT writes, server stores)
 * 6. ChatGPT: finalize_parallel_reasoning → synthesis with decision map
 * 
 * References:
 * - Wang et al., Self-Consistency, 2022
 * - Yao et al., Tree of Thoughts, 2023
 * - Du et al., Improving Factuality via Debate, 2023
 */

import { z } from 'zod';
import {
  globalParallelReasoningManager,
  ParallelReasoningSessionManager,
  DiversityAxisSchema,
  ReasoningPlanSchema,
  CrossPlanNoteSchema,
  PeerCritiqueSchema,
  MediationDecisionSchema,
  suggestDiversityAxes
} from './parallel-reasoning-mcp.js';
import { handleAnalyzeWithCapabilities, type CapabilitySystemRefs } from './capability-tools.js';
import * as GuidedResponses from './guided-responses.js';
import { formatSignals } from './evidence-signals.js';
import {
  createStructuredContent,
  type WorkflowInitializedContent,
  type PlanSubmittedContent,
  type PlanExecutionContent,
  type WorkflowStatusContent,
  type WorkflowFinalizedContent
} from './ui-structured-content.js';

/**
 * Tool 1: Initialize Parallel Reasoning Session
 */
export const InitParallelReasoningSchema = z.object({
  session_id: z.string().describe('Unique session identifier'),
  task_description: z.string().describe('Task to analyze with parallel reasoning'),
  required_diversity_axes: z.array(z.string()).min(2).describe('Axes that must differ between plans (min 2). Can be any contextually relevant axes, not limited to predefined list.'),
  min_plans: z.number().int().min(3).max(32).default(3).describe('Minimum number of parallel plans (3-32, default 3)')
});

export async function handleInitParallelReasoning(
  args: z.infer<typeof InitParallelReasoningSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }>; structuredContent?: WorkflowInitializedContent }> {
  console.log(`[handleInitParallelReasoning] Using manager: ${manager === globalParallelReasoningManager ? 'global' : 'durable-object'}`);
  console.log(`[handleInitParallelReasoning] Session ID: ${args.session_id}`);

  // Check if session already exists before calling initSession
  const existingSession = manager.getSession(args.session_id);
  const isExisting = !!existingSession;

  const session = manager.initSession(args);

  // Suggest diversity axes based on task description
  const suggestedAxesResult = suggestDiversityAxes(session.task_description);

  // Use different response for existing vs new session
  const response = isExisting
    ? GuidedResponses.formatSessionAlreadyExists(
        session.session_id,
        session.task_description,
        session.status,
        session.plans.size,
        session.min_plans
      )
    : GuidedResponses.formatInitSuccess(
        session.session_id,
        session.task_description,
        session.required_diversity_axes,
        session.min_plans
      );

  // Create structured content for UI visualization
  const structuredContent = createStructuredContent<WorkflowInitializedContent>(
    'workflow_initialized',
    session.session_id,
    {
      task_description: session.task_description,
      required_diversity_axes: session.required_diversity_axes,
      min_plans: session.min_plans,
      suggested_axes: suggestedAxesResult.suggested_axes
    }
  );

  const oldResponse = `# ✅ Parallel Reasoning Session Initialized

**Session ID**: \`${session.session_id}\`
**Task**: ${session.task_description}
**Required Diversity Axes**: ${session.required_diversity_axes.join(', ')}
**Minimum Plans**: ${session.min_plans}

---

## 🎯 YOUR NEXT ACTION

You must now generate ${session.min_plans} **distinct reasoning plans** that approach this task from different angles.

**Use this tool**: \`submit_reasoning_plan\`

**For each plan, you MUST**:
1. Choose at least 2 diversity axes from the list below
2. Ensure at least 2 axes differ from other plans (server will validate)
3. Specify a capability chain (sequence of capabilities to invoke)
4. Provide rationale explaining why this plan adds unique value

---

## 📊 Diversity Axes (Choose ≥2 per plan)

- **data_sources**: Use different data sources
  - Example: Plan A uses official statistics, Plan B uses industry reports, Plan C uses academic research

- **analytical_models**: Use different analytical approaches
  - Example: Plan A uses regression analysis, Plan B uses Monte Carlo simulation, Plan C uses normative/regulatory analysis

- **time_horizons**: Analyze different time frames
  - Example: Plan A focuses on short-term (1-2 years), Plan B on medium-term (3-5 years), Plan C on long-term (5-10 years)

- **quality_metrics**: Optimize for different quality criteria
  - Example: Plan A optimizes for precision, Plan B for recall/coverage, Plan C for robustness

- **risk_perspectives**: View through different risk lenses
  - Example: Plan A focuses on market risks, Plan B on regulatory risks, Plan C on operational risks

- **stakeholder_views**: Adopt different stakeholder perspectives
  - Example: Plan A takes customer perspective, Plan B takes investor perspective, Plan C takes regulator perspective

---

## 💡 Example: Valid Plan Submission

\`\`\`json
{
  "session_id": "${session.session_id}",
  "plan": {
    "plan_id": "plan_A",
    "description": "Market-driven analysis using official statistics and regression models",
    "diversity_axes": ["data_sources", "analytical_models"],
    "capability_chain": ["market_scan", "tam_sam_som_build", "competitor_analysis"],
    "rationale": "This plan provides a data-driven baseline using official market statistics and proven regression techniques for TAM/SAM/SOM estimation.",
    "expected_outputs": ["market_map", "tam_sam_som", "competitive_landscape"]
  }
}
\`\`\`

---

## ⚠️ Validation Rules

The server will **reject** plans that:
- Declare fewer than 2 diversity axes
- Have fewer than 2 axes different from existing plans
- This ensures **real diversification**, not cosmetic variants

---

**Status**: ${session.status}
**Action Required**: Submit ${session.min_plans} plans now using \`submit_reasoning_plan\``;

  return {
    content: [{ type: 'text', text: response }],
    structuredContent
  };
}

/**
 * Tool 2: Submit Reasoning Plan
 */
export const SubmitReasoningPlanSchema = z.object({
  session_id: z.string(),
  plan: ReasoningPlanSchema
});

export async function handleSubmitReasoningPlan(
  args: z.infer<typeof SubmitReasoningPlanSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }>; structuredContent?: PlanSubmittedContent }> {
  console.log(`[handleSubmitReasoningPlan] Using manager: ${manager === globalParallelReasoningManager ? 'global' : 'durable-object'}`);
  console.log(`[handleSubmitReasoningPlan] Session ID: ${args.session_id}`);
  console.log(`[handleSubmitReasoningPlan] Manager has ${manager.getAllSessions().size} sessions`);
  console.log(`[handleSubmitReasoningPlan] Available session IDs: ${Array.from(manager.getAllSessions().keys()).join(', ')}`);

  // Check if session exists
  const session = manager.getSession(args.session_id);
  if (!session) {
    console.error(`[handleSubmitReasoningPlan] Session ${args.session_id} NOT FOUND in manager!`);
    console.error(`[handleSubmitReasoningPlan] This suggests the request was routed to a different Durable Object instance.`);
    const response = GuidedResponses.formatSessionNotFound(args.session_id);
    return { content: [{ type: 'text', text: response }] };
  }

  const result = manager.submitPlan(args.session_id, args.plan);

  let response: string;

  if (result.accepted) {
    // Calculate total declared steps across all plans
    let total_declared_steps = 0;
    for (const plan of session.plans.values()) {
      total_declared_steps += plan.capability_chain.length;
    }

    // Plan accepted - use guided response with readiness preview
    response = GuidedResponses.formatPlanAccepted(
      args.plan.plan_id,
      args.session_id,
      session.plans.size,
      session.min_plans,
      args.plan.diversity_axes,
      total_declared_steps,
      args.plan.capability_chain.length
    );

    // Append quality signals if any
    const submittedPlan = session.plans.get(args.plan.plan_id);
    if (submittedPlan?.signals && submittedPlan.signals.signals.length > 0) {
      response += `\n\n## 📊 Quality Analysis\n`;
      response += formatSignals(submittedPlan.signals.signals);
    }
  } else {
    // Plan rejected - determine reason and use appropriate guided response
    if (!result.diversity_validation.required_axes_satisfied) {
      // Missing required axes
      response = GuidedResponses.formatPlanRejectedMissingAxes(
        args.plan.plan_id,
        args.session_id,
        result.diversity_validation.required_axes,
        result.diversity_validation.axes_declared
      );
    } else if (!result.diversity_validation.axes_unique_to_existing) {
      // Too similar to existing plans
      const existing_plans = Array.from(session.plans.values()).map(p => ({
        plan_id: p.plan_id,
        axes: p.diversity_axes
      }));
      response = GuidedResponses.formatPlanRejectedTooSimilar(
        args.plan.plan_id,
        args.session_id,
        result.diversity_validation.axes_declared,
        existing_plans,
        result.diversity_validation.required_axes
      );
    } else {
      // Fallback to old response for other cases
      response = `# ❌ Plan Rejected: ${args.plan.plan_id}\n\n`;
      response += `**Reason**: ${result.reason}\n\n`;
      response += `**Diversity Validation**:\n`;
      response += `- Axes declared: ${result.diversity_validation.axes_declared.join(', ')}\n`;
      response += `- Min axes met (≥2): ${result.diversity_validation.min_axes_met ? '✅' : '❌'}\n`;
      response += `- Required axes included: ${result.diversity_validation.required_axes_satisfied ? '✅' : '❌'}\n`;
      response += `- Unique to existing plans: ${result.diversity_validation.axes_unique_to_existing ? '✅' : '❌'}\n\n`;
    }

    if (!result.diversity_validation.axes_unique_to_existing) {
      response += `Your plan's diversity axes are too similar to existing plans. **At least 2 axes must differ from other plans**.\n\n`;
      response += `Try choosing different axes or changing your approach significantly.\n\n`;
    }

    response += `**Action Required**: Revise and resubmit this plan with proper diversification.\n`;
  }

  // Calculate axes different from existing plans
  let axesDifferent = 0;
  if (session.plans.size > 0) {
    const existingAxes = Array.from(session.plans.values())
      .filter(p => p.plan_id !== args.plan.plan_id)
      .flatMap(p => p.diversity_axes);
    axesDifferent = args.plan.diversity_axes.filter(axis => !existingAxes.includes(axis)).length;
  }

  // Create structured content for UI visualization
  const structuredContent = createStructuredContent<PlanSubmittedContent>(
    'plan_submitted',
    args.session_id,
    {
      plan: {
        plan_id: args.plan.plan_id,
        description: args.plan.description,
        diversity_axes: args.plan.diversity_axes,
        capability_chain: args.plan.capability_chain,
        rationale: args.plan.rationale,
        expected_outputs: args.plan.expected_outputs
      },
      accepted: result.accepted,
      reason: result.reason,
      diversity_validation: {
        axes_different: axesDifferent,
        required_minimum: 2,
        compared_with: Array.from(session.plans.keys()).filter(id => id !== args.plan.plan_id)
      }
    }
  );

  return {
    content: [{ type: 'text', text: response }],
    structuredContent
  };
}

/**
 * Tool 3: Execute Plan Step
 *
 * CRITICAL: This tool executes REAL ANALYSIS using reasoning and tool use.
 * The `task` parameter must describe WHAT ANALYSIS TO PERFORM in detail.
 *
 * GOOD: "Analyze top 5 competitors: identify pricing models, estimate market share, list differentiators. Use web search."
 * BAD: "competitor analysis" (too vague, won't trigger deep reasoning)
 *
 * The system will:
 * 1. Parse your task description
 * 2. Activate reasoning capabilities
 * 3. Use tools (web search, calculations, etc.) as needed
 * 4. Generate evidence with traceable ID
 * 5. Return detailed analysis results
 */
export const ExecutePlanStepSchema = z.object({
  session_id: z.string().describe('Session ID'),
  plan_id: z.string().describe('Plan ID to execute step for'),
  task: z.string().describe('DETAILED description of what analysis to perform. Be specific about: 1) What to analyze, 2) What data to collect, 3) What tools/methods to use, 4) What outputs are expected. Detailed tasks trigger deeper reasoning and tool use.'),
  adapter_id: z.enum(['strategy', 'finance', 'commercial', 'risk', 'comprehensive']).optional().describe('Analysis adapter type (default: comprehensive)'),
  budget: z.object({
    max_tokens_in: z.number().int().min(1),
    max_tokens_out: z.number().int().min(1),
    max_cpu_ms: z.number().int().min(1),
    max_subrequests: z.number().int().min(1)
  }).optional().describe('Resource limits for execution (optional)')
});

export async function handleExecutePlanStep(
  args: z.infer<typeof ExecutePlanStepSchema>,
  refs?: CapabilitySystemRefs,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }>; structuredContent?: PlanExecutionContent }> {
  const session = manager.getSession(args.session_id);

  if (!session) {
    const response = GuidedResponses.formatSessionNotFound(args.session_id);
    return { content: [{ type: 'text', text: response }] };
  }

  if (!session.plans.has(args.plan_id)) {
    const response = `# ❌ Plan Not Found\n\n` +
      `**Plan ID**: \`${args.plan_id}\`\n` +
      `**Session ID**: \`${args.session_id}\`\n\n` +
      `## Problem\n` +
      `This plan does not exist in the session.\n\n` +
      `## Available Plans\n` +
      `${Array.from(session.plans.keys()).map(id => `- \`${id}\``).join('\n')}\n\n` +
      `## Solution\n` +
      `Either:\n` +
      `1. Use one of the available plan IDs listed above\n` +
      `2. Submit this plan first using \`submit_reasoning_plan\`\n\n` +
      `⚠️ Remember: Use session_id \`${args.session_id}\` for all calls.`;

    return { content: [{ type: 'text', text: response }] };
  }

  if (!session.plan_results.has(args.plan_id)) {
    session.plan_results.set(args.plan_id, []);
  }

  // Execute capability using existing analyze_with_capabilities
  const result = await handleAnalyzeWithCapabilities({
    session_id: `${args.session_id}_${args.plan_id}`,
    task: args.task,
    adapter_id: args.adapter_id,
    budget: args.budget,
    tournament_mode: true,
    peer_review_mode: true
  }, refs);

  // Record result for plan using the provided session manager instance and get evidence ID
  const evidence_id = manager.recordPlanResult(args.session_id, args.plan_id, result);

  // Extract summary from result
  const originalText = result.content[0].text;
  const summary = originalText.substring(0, 200) + (originalText.length > 200 ? '...' : '');

  // Use guided response
  const guidedResponse = GuidedResponses.formatCapabilityExecuted(
    args.session_id,
    args.plan_id,
    summary
  );

  // Append evidence ID and full result
  const evidenceNotice = `\n\n**📋 Evidence ID Generated**: \`${evidence_id}\`\n\n**Important**: Use this evidence ID when:\n- Submitting peer critiques (in \`evidence_ids\` field of challenged claims)\n- Submitting mediation decisions (in \`evidence_ids\` field)\n\nThis allows the system to trace decisions back to specific execution results.`;
  const fullResponse = guidedResponse + evidenceNotice + '\n\n---\n\n## Full Capability Result\n\n' + originalText;

  // Get plan info for structured content
  const plan = session.plans.get(args.plan_id)!;
  const planResults = session.plan_results.get(args.plan_id) || [];
  const stepNumber = planResults.length;

  // Create structured content for UI visualization
  const structuredContent = createStructuredContent<PlanExecutionContent>(
    'plan_execution',
    args.session_id,
    {
      plan_id: args.plan_id,
      step_number: stepNumber,
      total_steps: plan.capability_chain.length,
      capability_name: args.task,
      adapter_id: args.adapter_id || 'comprehensive',
      evidence_id,
      result: {
        guardrails: (result as any).guardrails,
        output: (result as any).output,
        metadata: {
          execution_time_ms: Date.now() - Date.now(), // Placeholder
          tokens_used: 0 // Placeholder
        }
      }
    }
  );

  return {
    content: [{ type: 'text', text: fullResponse }],
    structuredContent
  };
}

/**
 * Tool 4: Submit Cross-Plan Note (Contamination)
 */
export const SubmitCrossPlanNoteSchema = z.object({
  session_id: z.string(),
  note: CrossPlanNoteSchema
});

export async function handleSubmitCrossPlanNote(
  args: z.infer<typeof SubmitCrossPlanNoteSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    manager.submitCrossPlanNote(args.session_id, args.note);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response = `# ❌ Validation Error\n\n${message}\n\nPlease correct the plan references and try again.`;

    return {
      content: [{ type: 'text', text: response }]
    };
  }

  const response = `# Cross-Plan Note Recorded

**From**: ${args.note.from_plan_id}
**To**: ${args.note.to_plan_id}
**Note**: ${args.note.note}
**References**: ${args.note.references.join(', ')}

This note enables contamination between reasoning paths.
Plan ${args.note.to_plan_id} can now consider insights from Plan ${args.note.from_plan_id}.`;

  return {
    content: [{ type: 'text', text: response }]
  };
}

/**
 * Tool 5: Submit Peer Critique
 */
export const SubmitPeerCritiqueSchema = z.object({
  session_id: z.string(),
  critique: PeerCritiqueSchema
});

export async function handleSubmitPeerCritique(
  args: z.infer<typeof SubmitPeerCritiqueSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    manager.submitPeerCritique(args.session_id, args.critique);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response = `# ❌ Validation Error\n\n${message}\n\nPlease fix the critique and resubmit.`;

    return {
      content: [{ type: 'text', text: response }]
    };
  }

  const response = `# Peer Critique Recorded

**Reviewer**: ${args.critique.reviewer_plan_id}
**Reviewed**: ${args.critique.reviewed_plan_id}
**Agreement Score**: ${(args.critique.agreement_score * 100).toFixed(1)}%

## Claims Challenged

${args.critique.claims_challenged.map((c, i) => `
${i + 1}. **Claim**: ${c.claim}
   - **Evidence**: ${c.evidence_ids.join(', ')}
   - **Challenge**: ${c.challenge}
   ${c.falsification_test ? `- **Falsification Test**: ${c.falsification_test}` : ''}
`).join('\n')}

## Residual Risks

${args.critique.residual_risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Critique stored for consensus analysis.`;

  return {
    content: [{ type: 'text', text: response }]
  };
}

/**
 * Tool 6: Submit Mediation Decision
 */
export const SubmitMediationDecisionSchema = z.object({
  session_id: z.string(),
  decision: MediationDecisionSchema
});

export async function handleSubmitMediationDecision(
  args: z.infer<typeof SubmitMediationDecisionSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager,
  evidenceLedger?: any // EvidenceLedger type from evidence-ledger.ts
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Create evidence validator if ledger provided
    const validateEvidenceIds = evidenceLedger ? (ids: string[]) => {
      // Check if all evidence IDs exist in the ledger
      for (const id of ids) {
        const entry = evidenceLedger.getEntry(id);
        if (!entry) {
          return false;
        }
      }
      return true;
    } : undefined;

    manager.submitMediationDecision(args.session_id, args.decision, validateEvidenceIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response = `# ❌ Validation Error\n\n${message}\n\nPlease update the mediation decision with valid plan and evidence references.`;

    return {
      content: [{ type: 'text', text: response }]
    };
  }

  const response = `# Mediation Decision Recorded

**Decision Point**: ${args.decision.decision_point}
**Chosen From**: ${args.decision.chosen_from_plan}
**Confidence**: ${(args.decision.confidence * 100).toFixed(1)}%

**Rationale**: ${args.decision.rationale}

**Evidence References**: ${args.decision.evidence_ids.join(', ')}

Decision stored. Continue submitting decisions for all key points.`;

  return {
    content: [{ type: 'text', text: response }]
  };
}

/**
 * Tool 7: Get Readiness Preview & Session Status
 *
 * This is the PRIMARY tool for checking session progress and understanding what needs to be done.
 * Call this frequently to:
 * - See current progress toward finalization thresholds
 * - Identify specific gaps that need to be filled
 * - Get actionable recommendations for next steps
 */
export const ListPlanStatusSchema = z.object({
  session_id: z.string().describe('Session ID to get readiness preview and status for')
});

export async function handleListPlanStatus(
  args: z.infer<typeof ListPlanStatusSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }>; structuredContent?: WorkflowStatusContent }> {
  const status = manager.getSessionStatus(args.session_id);

  if (!status.session) {
    return {
      content: [{ type: 'text', text: 'Session not found.' }]
    };
  }

  const session = status.session;

  // Calculate readiness metrics
  const readiness = manager.checkSessionReadiness(args.session_id);

  // Calculate total declared and executed steps
  let total_declared_steps = 0;
  let total_executed_steps = 0;
  for (const plan of session.plans.values()) {
    total_declared_steps += plan.capability_chain.length;
    total_executed_steps += session.plan_results.get(plan.plan_id)?.length || 0;
  }

  const coverage_pct = total_declared_steps > 0 ? (total_executed_steps / total_declared_steps * 100) : 0;
  const confidence_pct = readiness.metrics.confidence * 100;
  const consensus_pct = readiness.metrics.consensus * 100;
  const evidence_count = readiness.metrics.details.confidence.unique_evidence_count;

  // Build response with READINESS PREVIEW as primary content
  let response = `# 🎯 Readiness Preview & Session Status

**Session ID**: \`${session.session_id}\`
**Status**: ${session.status}
**Plans Submitted**: ${session.plans.size}/${session.min_plans}

---

## 📊 Finalization Readiness

${readiness.ready ? '✅ **READY TO FINALIZE**' : '⚠️ **NOT READY - Action Required**'}

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Coverage** | ${coverage_pct.toFixed(1)}% (${total_executed_steps}/${total_declared_steps} steps) | ≥95% | ${readiness.quality_check.coverage_met ? '✅' : '❌'} |
| **Confidence** | ${confidence_pct.toFixed(1)}% | ≥85% | ${readiness.quality_check.confidence_met ? '✅' : '❌'} |
| **Consensus** | ${consensus_pct.toFixed(1)}% | ≥80% | ${readiness.quality_check.consensus_met ? '✅' : '❌'} |

---

## 🎬 What You Need To Do Now

${!readiness.quality_check.coverage_met ? `
### ❌ Coverage Gap: ${(95 - coverage_pct).toFixed(1)}% short

**Problem**: You've only executed ${total_executed_steps} out of ${total_declared_steps} declared capability steps.
**Target**: Execute at least ${Math.ceil(total_declared_steps * 0.95)} steps (95% coverage).
**Gap**: ${Math.ceil(total_declared_steps * 0.95) - total_executed_steps} more steps needed.

**Action Required**:
1. Call \`execute_plan_step\` for each remaining capability in your plans
2. For EACH step, use the \`task\` parameter to describe WHAT ANALYSIS TO PERFORM
3. **CRITICAL**: The system will execute real reasoning and tool use for each task
4. Don't just list steps - describe the actual analytical work needed

**Example - GOOD**:
\`\`\`json
{
  "session_id": "${session.session_id}",
  "plan_id": "plan_A",
  "task": "Analyze the top 5 competitors in the healthcare SaaS market. For each: 1) Identify their pricing model, 2) Estimate market share, 3) List key differentiators. Use web search and financial data."
}
\`\`\`

**Example - BAD** (don't do this):
\`\`\`json
{
  "task": "competitor analysis"  // ❌ Too vague, won't trigger deep reasoning
}
\`\`\`

` : ''}${!readiness.quality_check.confidence_met ? `
### ❌ Confidence Gap: ${(85 - confidence_pct).toFixed(1)}% short

**Problem**: ${evidence_count < 4 ? 'Not enough evidence collected' : 'Evidence quality is too low'}.
**Current Evidence IDs**: ${evidence_count}
**Target**: At least 4 unique evidence IDs with HIGH QUALITY

${evidence_count >= 4 ? `
**⚠️ CRITICAL**: You have ${evidence_count} evidence IDs but confidence is still low (${confidence_pct.toFixed(1)}%).
This means your evidence has LOW QUALITY signals - the system detected that your \`execute_plan_step\` tasks were too vague or didn't trigger real reasoning.

**Root Cause**: Using vague tasks like "analyze competitors" instead of detailed analytical instructions.

**Solution**: Re-execute steps with MUCH MORE DETAILED tasks that force the system to:
- Use specific tools (web search, calculations, data analysis)
- Collect specific data points
- Perform specific analytical operations
- Generate traceable, verifiable outputs

` : ''}
**Action Required**:
1. Call \`execute_plan_step\` with EXTREMELY DETAILED task descriptions
2. **BAD Example**: \`{"task": "market analysis"}\` ❌
3. **GOOD Example**: \`{"task": "Search for the top 5 B2B SaaS companies in healthcare. For EACH company: 1) Find their website, 2) Extract their pricing page URL, 3) Identify their pricing model (per-user/per-feature/tiered), 4) Estimate their annual revenue from Crunchbase or similar sources, 5) List 3 key product differentiators. Provide URLs and specific data points for each finding."}\` ✅

**Why this matters**: Detailed tasks → System uses reasoning + tools → High-quality evidence → Higher confidence

` : ''}${!readiness.quality_check.consensus_met ? `
### ❌ Consensus Gap: ${(80 - consensus_pct).toFixed(1)}% short

**Problem**: Not enough peer critiques to establish consensus.
**Current Critiques**: ${session.peer_critiques.length}
**Target**: 3-5 peer critiques with high agreement scores

**Action Required**:
1. Call \`submit_peer_critique\` to have plans review each other
2. Aim for agreement_score > 0.7 in each critique
3. Focus on substantive agreement/disagreement, not superficial points

` : ''}${readiness.ready ? `
### ✅ All Requirements Met

You can now call \`finalize_parallel_reasoning\` to complete the session.

` : ''}
---

## 📋 Detailed Plan Status

${Array.from(session.plans.values()).map(plan => {
  const executed = session.plan_results.get(plan.plan_id)?.length || 0;
  const declared = plan.capability_chain.length;
  const plan_coverage = declared > 0 ? (executed / declared * 100) : 0;

  return `
### ${plan.plan_id} ${plan_coverage >= 95 ? '✅' : '⚠️'}

- **Coverage**: ${plan_coverage.toFixed(0)}% (${executed}/${declared} steps executed)
- **Diversity Axes**: ${plan.diversity_axes.join(', ')}
- **Capability Chain**: ${plan.capability_chain.join(' → ')}
${executed < declared ? `
**Missing Steps**: ${declared - executed} steps not yet executed
**Next Action**: Call \`execute_plan_step\` with detailed analytical tasks for remaining capabilities
` : ''}`;
}).join('\n')}

---

## 📈 Session Activity

- **Cross-Plan Notes**: ${session.cross_plan_notes.length} notes exchanged
- **Peer Critiques**: ${session.peer_critiques.length} critiques submitted
- **Mediation Decisions**: ${session.mediation_decisions.length} decisions recorded

---

**💡 Pro Tip**: Call this tool frequently to track progress and identify gaps. Don't wait until the end!`;

  // Create structured content for UI visualization
  const structuredContent = createStructuredContent<WorkflowStatusContent>(
    'workflow_status',
    args.session_id,
    {
      status: session.status,
      task_description: session.task_description,
      plans: Array.from(session.plans.values()).map(plan => {
        const executedSteps = session.plan_results.get(plan.plan_id)?.length || 0;
        const totalSteps = plan.capability_chain.length;
        return {
          plan_id: plan.plan_id,
          description: plan.description,
          diversity_axes: plan.diversity_axes,
          capability_chain: plan.capability_chain,
          executed_steps: executedSteps,
          total_steps: totalSteps,
          progress_percentage: totalSteps > 0 ? (executedSteps / totalSteps) * 100 : 0
        };
      }),
      cross_plan_notes: session.cross_plan_notes,
      peer_critiques: session.peer_critiques.map(c => ({
        reviewer_plan_id: c.reviewer_plan_id,
        reviewed_plan_id: c.reviewed_plan_id,
        agreement_score: c.agreement_score,
        timestamp: c.timestamp
      })),
      mediation_decisions: session.mediation_decisions,
      metrics: session.metrics,
      completeness: {
        min_plans_met: session.plans.size >= session.min_plans,
        all_plans_executed: Array.from(session.plans.keys()).every(planId => {
          const plan = session.plans.get(planId)!;
          const results = session.plan_results.get(planId) || [];
          return results.length >= plan.capability_chain.length;
        }),
        has_peer_reviews: session.peer_critiques.length > 0,
        has_mediation_decisions: session.mediation_decisions.length > 0
      }
    }
  );

  return {
    content: [{ type: 'text', text: response }],
    structuredContent
  };
}

/**
 * Tool 8: Check Session Readiness
 *
 * Verifies if session is ready for finalization by checking:
 * - Structural requirements (min plans, all executed)
 * - Quality metrics (confidence ≥85%, coverage ≥95%, consensus ≥80%)
 *
 * Use this BEFORE calling finalize_parallel_reasoning to avoid rejection
 */
export const CheckSessionReadinessSchema = z.object({
  session_id: z.string().describe('Session ID to check readiness for')
});

export async function handleCheckSessionReadiness(
  args: z.infer<typeof CheckSessionReadinessSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const readiness = manager.checkSessionReadiness(args.session_id);

  let response = `# 🔍 Session Readiness Check\n\n`;
  response += `**Session ID**: \`${args.session_id}\`\n\n`;

  if (readiness.ready) {
    response += `## ✅ Session Ready for Finalization\n\n`;
    response += `All structural and quality requirements are met. You can now call \`finalize_parallel_reasoning\`.\n\n`;
  } else {
    response += `## ⚠️ Session Not Ready for Finalization\n\n`;
    response += `**Blockers** (${readiness.blockers.length}):\n`;
    for (const blocker of readiness.blockers) {
      response += `- ${blocker}\n`;
    }
    response += `\n`;
  }

  // Structural check details
  response += `### 📋 Structural Requirements\n\n`;
  response += `- **Minimum plans**: ${readiness.structural_check.min_plans_met ? '✅' : '❌'} `;
  response += `(${readiness.structural_check.plans_submitted}/${readiness.structural_check.min_plans_required})\n`;
  response += `- **All plans executed**: ${readiness.structural_check.all_plans_executed ? '✅' : '❌'}`;
  if (readiness.structural_check.missing_plans.length > 0) {
    response += ` (missing: ${readiness.structural_check.missing_plans.join(', ')})`;
  }
  response += `\n\n`;

  // Quality metrics
  response += `### 📊 Quality Metrics\n\n`;
  response += `- **Confidence**: ${(readiness.metrics.confidence * 100).toFixed(1)}% `;
  response += readiness.quality_check.confidence_met ? '✅' : '❌';
  response += ` (target: 85%, ${readiness.metrics.details.confidence.unique_evidence_count} evidence)\n`;

  response += `- **Coverage**: ${(readiness.metrics.coverage * 100).toFixed(1)}% `;
  response += readiness.quality_check.coverage_met ? '✅' : '❌';
  response += ` (target: 95%, ${readiness.metrics.details.coverage.executed_steps}/${readiness.metrics.details.coverage.total_declared_steps} steps)\n`;

  response += `- **Consensus**: ${(readiness.metrics.consensus * 100).toFixed(1)}% `;
  response += readiness.quality_check.consensus_met ? '✅' : '❌';
  response += ` (target: 80%, ${readiness.metrics.details.consensus.agreements} agreements, ${readiness.metrics.details.consensus.conflicts} conflicts)\n\n`;

  // Recommendations
  if (readiness.recommendations.length > 0) {
    response += `### 💡 Recommendations\n\n`;
    for (const rec of readiness.recommendations) {
      response += `${rec}\n`;
    }
    response += `\n`;
  }

  // Next steps
  if (!readiness.ready) {
    response += `### 🎯 Next Steps\n\n`;
    if (!readiness.quality_check.coverage_met) {
      response += `1. **Execute remaining capability steps** using \`execute_plan_step\` to complete declared workflows\n`;
    }
    if (!readiness.quality_check.confidence_met) {
      response += `2. **Add more evidence** by executing plan steps with detailed analysis\n`;
    }
    if (!readiness.quality_check.consensus_met) {
      response += `3. **Submit peer critiques** using \`submit_peer_critique\` to build consensus\n`;
    }
    response += `4. **Re-check readiness** using \`check_session_readiness\` before attempting finalization\n`;
  } else {
    response += `### 🎯 Next Step\n\n`;
    response += `Call \`finalize_parallel_reasoning\` to complete the session.\n`;
  }

  return {
    content: [{ type: 'text', text: response }]
  };
}

/**
 * Tool 9: Finalize Parallel Reasoning
 */
export const FinalizeParallelReasoningSchema = z.object({
  session_id: z.string()
});

export async function handleFinalizeParallelReasoning(
  args: z.infer<typeof FinalizeParallelReasoningSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ content: Array<{ type: string; text: string }>; structuredContent?: WorkflowFinalizedContent }> {
  const session = manager.getSession(args.session_id);

  if (!session) {
    const response = GuidedResponses.formatSessionNotFound(args.session_id);
    return { content: [{ type: 'text', text: response }] };
  }

  const result = manager.finalizeSession(args.session_id);

  let response: string;

  if (result.finalized) {
    // Success - use guided response with metrics
    response = GuidedResponses.formatFinalizationSuccess(
      args.session_id,
      session.plans.size,
      session.mediation_decisions.length,
      result.metrics
    );

    // Append warnings if any (metrics warnings are already included in formatFinalizationSuccess)
    if (result.warnings && result.warnings.length > 0) {
      response += `\n\n## ⚠️ Additional Warnings\n\n`;
      response += result.warnings.map(w => `- ${w}`).join('\n') + '\n';
    }

    // Append decision map
    if (session.mediation_decisions.length > 0) {
      response += `\n\n## Decision Map\n\n`;
      response += session.mediation_decisions.map((d, i) => `
${i + 1}. **${d.decision_point}**
   - Chosen from: ${d.chosen_from_plan}
   - Confidence: ${(d.confidence * 100).toFixed(1)}%
   - Rationale: ${d.rationale}
   - Evidence: ${d.evidence_ids.length > 0 ? d.evidence_ids.join(', ') : '(no evidence IDs provided)'}
`).join('\n');
    }
  } else {
    // Incomplete - use guided response
    const plans_executed = Array.from(session.plans.keys()).filter(plan_id => {
      const results = session.plan_results.get(plan_id);
      return results && results.length > 0;
    });
    const plans_not_executed = Array.from(session.plans.keys()).filter(plan_id => {
      const results = session.plan_results.get(plan_id);
      return !results || results.length === 0;
    });

    response = GuidedResponses.formatFinalizationIncomplete(
      args.session_id,
      session.plans.size,
      session.min_plans,
      plans_executed,
      plans_not_executed
    );

    // Add min_plans check
    if (!result.completeness_check.min_plans_met) {
      response += `\n### ❌ Minimum Plans Not Met\n\n`;
      response += `**Required**: ${result.completeness_check.min_plans_required} plans\n`;
      response += `**Submitted**: ${result.completeness_check.plans_submitted} plans\n\n`;
      response += `You must submit at least ${result.completeness_check.min_plans_required - result.completeness_check.plans_submitted} more diverse plan(s) before finalization.\n\n`;
    }

    if (result.completeness_check.decisions_without_evidence.length > 0) {
      response += `### Decisions Without Evidence\n\n`;
      response += result.completeness_check.decisions_without_evidence.map(d => `- ${d}`).join('\n') + '\n\n';
    }
  }

  // Count quality signals across all artifacts
  let totalArtifacts = 0;
  let flaggedArtifacts = 0;
  let criticalIssues = 0;
  let warnings = 0;

  // Count from plans
  session.plans.forEach(plan => {
    totalArtifacts++;
    if (plan.signals && plan.signals.signals.length > 0) {
      flaggedArtifacts++;
      plan.signals.signals.forEach(s => {
        if (s.severity === 'critical') criticalIssues++;
        if (s.severity === 'warning') warnings++;
      });
    }
  });

  // Create structured content for UI visualization
  const structuredContent = createStructuredContent<WorkflowFinalizedContent>(
    'workflow_finalized',
    args.session_id,
    {
      finalized: result.finalized,
      metrics: result.metrics || {
        confidence: 0,
        coverage: 0,
        consensus: 0,
        computed_at: Date.now()
      },
      quality_summary: {
        total_artifacts: totalArtifacts,
        flagged_artifacts: flaggedArtifacts,
        critical_issues: criticalIssues,
        warnings: warnings
      },
      decision_map: session.mediation_decisions.map(d => ({
        decision_point: d.decision_point,
        chosen_from_plan: d.chosen_from_plan,
        confidence: d.confidence,
        evidence_count: d.evidence_ids.length
      })),
      recommendations: [],
      warnings: result.warnings
    }
  );

  return {
    content: [{ type: 'text', text: response }],
    structuredContent
  };
}
