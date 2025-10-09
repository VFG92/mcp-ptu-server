/**
 * Guided Response Helpers
 * 
 * Generates extremely explicit, actionable responses for MCP clients.
 * Each response includes:
 * - Clear explanation of what happened
 * - Exact reason for success/failure
 * - Concrete next steps
 * - Example JSON when applicable
 */

import type { DiversityAxis, ReasoningPlan } from './parallel-reasoning-mcp.js';
import { suggestDiversityAxes, COMMON_DIVERSITY_AXES, parseAxisString } from './parallel-reasoning-mcp.js';
import type { SessionMetrics } from './session-metrics.js';

/**
 * Format session already exists (idempotent behavior)
 */
export function formatSessionAlreadyExists(
  session_id: string,
  task_description: string,
  status: string,
  plans_count: number,
  min_plans: number
): string {
  return `# ℹ️ Session Already Exists (Idempotent)

**Session ID**: \`${session_id}\`

This session was already initialized. Returning existing session state.

## Current State
- **Task**: ${task_description}
- **Status**: ${status}
- **Plans submitted**: ${plans_count} / ${min_plans}

## What This Means
The \`init_parallel_reasoning\` tool is **idempotent**: calling it multiple times with the same \`session_id\` returns the existing session instead of creating a new one or throwing an error.

## Next Steps
${plans_count < min_plans
  ? `Continue submitting plans using \`submit_reasoning_plan\` (need ${min_plans - plans_count} more).`
  : status === 'initialized' || status === 'plans_submitted'
    ? `All plans submitted. Start executing with \`execute_plan_step\`.`
    : status === 'executing'
      ? `Continue executing plan steps with \`execute_plan_step\`.`
      : status === 'finalized'
        ? `Session already finalized. Use \`list_plan_status\` to view results.`
        : `Continue with the next phase of the workflow.`
}

⚠️ Use session_id \`${session_id}\` for all subsequent calls.
`;
}

/**
 * Format session initialization success
 */
export function formatInitSuccess(
  session_id: string,
  task_description: string,
  required_axes: DiversityAxis[],
  min_plans: number
): string {
  // Get contextual suggestions based on task
  const { suggested_axes, rationale } = suggestDiversityAxes(task_description);

  return `# ✅ Session Initialized Successfully

**Session ID**: \`${session_id}\`

⚠️ **IMPORTANT**: Use this EXACT session_id for ALL subsequent calls in this workflow.

## Task
${task_description}

## Requirements
- **Minimum plans**: ${min_plans}
- **Required diversity axes** (ALL plans must include these):
${required_axes.map(axis => `  - \`${axis}\``).join('\n')}

## 💡 Suggested Diversity Axes for This Task
Based on your task description, we recommend considering these axes:

${suggested_axes.map(axis => `- **\`${axis}\`**: ${COMMON_DIVERSITY_AXES[axis as keyof typeof COMMON_DIVERSITY_AXES] || 'Context-specific differentiation'}`).join('\n')}

**Why these axes?** ${rationale}

## 📚 Additional Axes You Can Use
You can use ANY axis that makes sense for your task. Here are more examples:
- \`data_sources\` - Different data sources
- \`analytical_models\` - Different analytical approaches
- \`time_horizons\` - Different time frames
- \`quality_metrics\` - Different quality criteria
- \`risk_perspectives\` - Different risk lenses
- \`stakeholder_views\` - Different stakeholder perspectives
- \`geographic_scope\` - Different geographic scopes
- \`customer_segments\` - Different customer segments
- \`technology_stacks\` - Different technology approaches
- \`regulatory_frameworks\` - Different regulatory contexts
- \`cost_drivers\` - Different cost perspectives
- \`implementation_approaches\` - Different implementation strategies
- Or define your own custom axes relevant to your task!

## Key Principles
- **Plans must differ on ≥2 axes** to ensure real diversity, not cosmetic variants
- **Optimal capability chain length**: 3-5 steps per plan
  - Shorter chains = fewer \`execute_plan_step\` calls needed to reach 95% coverage
  - Longer chains (7+) = more execution time and token usage
  - Coverage formula: executed_steps / total_declared_steps ≥ 0.95

## Next Steps

1. **Submit ${min_plans} reasoning plans** using \`submit_reasoning_plan\`
2. **Check progress frequently** using \`list_plan_status\` to see what gaps need filling
3. **Execute capability steps** using \`execute_plan_step\` with detailed analytical tasks

**Example - Submit First Plan**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan": {
    "plan_id": "plan_A",
    "description": "Describe your plan's unique approach",
    "diversity_axes": [${required_axes.map(a => `"${a}"`).join(', ')}, "${suggested_axes[0] || 'additional_axis'}"],
    "capability_chain": ["capability_1", "capability_2", "capability_3", "capability_4"],
    "rationale": "Explain why this plan adds unique value",
    "expected_outputs": ["Output 1", "Output 2"]
  }
}
\`\`\`

💡 **Pro Tips**:
- Start with 3-5 capabilities per plan for optimal execution efficiency
- Call \`list_plan_status\` frequently to track progress and identify gaps
- Each \`execute_plan_step\` should describe WHAT ANALYSIS to perform, not just a label

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format plan acceptance
 */
export function formatPlanAccepted(
  plan_id: string,
  session_id: string,
  plans_submitted: number,
  min_plans: number,
  axes_declared: DiversityAxis[],
  total_declared_steps: number,
  current_plan_chain_length: number
): string {
  const needs_more = plans_submitted < min_plans;

  // Warning if capability chain is too long
  const chainLengthWarning = current_plan_chain_length > 7 ? `

⚠️ **Capability Chain Length Notice**: This plan declares ${current_plan_chain_length} capability steps.
Longer chains require more \`execute_plan_step\` calls to reach the 95% coverage threshold.
**Recommendation**: Consider 3-5 steps per plan for optimal execution efficiency.
` : '';

  // Prompt to check readiness when all plans submitted
  const readinessPrompt = !needs_more ? `

## 🎯 Next: Check Your Readiness

You've submitted all ${plans_submitted} required plans. Now it's time to execute them!

**IMPORTANT - Call this tool NOW**:
\`\`\`json
{
  "name": "list_plan_status",
  "arguments": {
    "session_id": "${session_id}"
  }
}
\`\`\`

This will show you:
- ✅ What % coverage, confidence, and consensus you currently have
- ❌ Specific gaps that need to be filled
- 🎯 Exact actions needed to reach finalization thresholds
- 📋 Detailed status of each plan's execution progress

**Don't skip this step!** The readiness preview will guide your next actions.
` : '';

  return `# ✅ Plan Accepted: ${plan_id}

**Session ID**: \`${session_id}\`
**Plans submitted**: ${plans_submitted}/${min_plans}
**Diversity axes**: ${axes_declared.join(', ')}
**Capability steps in this plan**: ${current_plan_chain_length}${chainLengthWarning}

${needs_more ? `
## Next Step
Submit ${min_plans - plans_submitted} more plan(s) to meet minimum requirement.

⚠️ **Diversity Requirement**: Each new plan must differ from existing plans on at least 2 axes.

## Key Principles for Next Plan
- **Real Diversity**: Choose a genuinely different approach, not a cosmetic variant
- **Contextual Axes**: Select axes that make sense for your specific task
- **Complementary Perspective**: Add value by covering aspects the first plan doesn't address
- **Optimal Length**: Aim for 3-5 capability steps per plan for execution efficiency

**Do NOT use template approaches** like "Plan A = quantitative, Plan B = qualitative".
Instead, think about what unique perspective would genuinely improve the analysis.
` : `
## Next Step
You have submitted the minimum number of plans (${min_plans}).
${readinessPrompt}

After checking readiness, you'll need to:
1. **Execute capabilities**: Call \`execute_plan_step\` with detailed analytical tasks
2. **Submit peer critiques**: Use \`submit_peer_critique\` to build consensus
3. **Check progress**: Call \`list_plan_status\` frequently to track gaps

**Example - Execute capability with REAL analysis**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan_id": "${plan_id}",
  "task": "Perform market scan for target market",
  "adapter_id": "strategy"
}
\`\`\`
`}

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format plan rejection - missing required axes
 */
export function formatPlanRejectedMissingAxes(
  plan_id: string,
  session_id: string,
  required_axes: DiversityAxis[],
  declared_axes: DiversityAxis[]
): string {
  // Check semantic matches using parseAxisString (imported at top)
  const declaredKeys = new Set(declared_axes.map(axis => parseAxisString(axis).key));
  const requiredParsed = required_axes.map(axis => ({
    original: axis,
    parsed: parseAxisString(axis)
  }));

  return `# ❌ Plan Rejected: ${plan_id}

**Reason**: Missing required diversity axes (semantic validation)

## How Semantic Validation Works
The system checks if your plan includes axes with the **same keys** as required axes.
- Required axis "Tech Stack: Cloud" → needs any axis with key "tech_stack"
- Your axis "Tech Stack: Hybrid" → ✓ matches (same key, different value is OK)
- Your axis "Technology: Hybrid" → ✗ doesn't match (different key)

## Required Axes (must include ALL keys)
${requiredParsed.map(({ original, parsed }) => {
  const has = declaredKeys.has(parsed.key);
  return `  ${has ? '✓' : '✗'} \`${original}\` (key: "${parsed.key}")${has ? ' (present)' : ' **← MISSING**'}`;
}).join('\n')}

## Your Plan Declared
${declared_axes.map(axis => {
  const parsed = parseAxisString(axis);
  return `  - \`${axis}\` (key: "${parsed.key}")`;
}).join('\n')}

## Action Required
Add axes with the missing **keys** to your \`diversity_axes\` array. You can use different values.

**Example Fix**:
If required axis is "Tech Stack: Cloud" and you want a different approach:
- ✅ Use "Tech Stack: Hybrid" (same key, different value)
- ✅ Use "Tech Stack: On-premise" (same key, different value)
- ❌ Don't use "Technology: Hybrid" (different key)

**Fixed Example**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan": {
    "plan_id": "${plan_id}",
    "description": "...",
    "diversity_axes": [${[...new Set([...required_axes, ...declared_axes])].map(a => `"${a}"`).join(', ')}],
    "capability_chain": [...],
    "rationale": "...",
    "expected_outputs": [...]
  }
}
\`\`\`

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format plan rejection - too similar to existing
 */
export function formatPlanRejectedTooSimilar(
  plan_id: string,
  session_id: string,
  declared_axes: DiversityAxis[],
  existing_plans: Array<{ plan_id: string; axes: DiversityAxis[] }>,
  required_axes: DiversityAxis[]
): string {
  return `# ❌ Plan Rejected: ${plan_id}

**Reason**: Diversity axes too similar to existing plans (must differ on ≥2 axes **semantically**)

## Diversity Requirement
Each plan must differ from ALL existing plans on at least **2 axes semantically**.

### What "Semantic Diversity" Means
The system now uses **semantic comparison** instead of literal string matching:
- Axes are parsed as **Key: Value** pairs
- Example: "Tech Stack: Hybrid" → key="tech_stack", value="hybrid"
- Two axes are **different** if they have:
  - Different keys (e.g., "Tech Stack" vs "Data Sources"), OR
  - Same key but different values (e.g., "Tech Stack: Hybrid" vs "Tech Stack: Cloud")

## Your Plan
- **Axes**: ${declared_axes.join(', ')}

## Existing Plans
${existing_plans.map(p => `- **${p.plan_id}**: ${p.axes.join(', ')}`).join('\n')}

## Problem
Your plan's axes overlap too much with existing plans. You need at least 2 axes that differ **semantically**.

## How to Fix
1. **Use Key: Value format**: Structure axes as "Category: Specific Value"
   - Good: "Tech Stack: Hybrid", "Risk Perspective: Market-focused"
   - Avoid: "hybrid_tech", "market_risk" (harder to parse semantically)

2. **Change values, not just labels**: If an existing plan uses "Tech Stack: Cloud", use:
   - ✅ "Tech Stack: On-premise" (same key, different value)
   - ✅ "Data Sources: Primary research" (different key)
   - ❌ "Technology Stack: Cloud" (same key and value, just rephrased)

3. **Ensure ≥2 semantic differences**: At least 2 of your axes must differ from each existing plan

## Principles for Semantic Diversity
- **Focus on substance, not syntax**: "Quantitative approach" vs "Qualitative approach" are semantically different
- **Use consistent key names**: If one plan uses "Tech Stack", use the same key with a different value
- **Think about real differences**: Different data sources, time horizons, stakeholder views
- **Add complementary value**: What perspective is missing from existing plans?

## Examples of Semantic Diversity
✅ **Good diversity**:
- Plan A: ["Tech Stack: Cloud", "Risk: Market"]
- Plan B: ["Tech Stack: Hybrid", "Risk: Operational"] → 2 differences (both values changed)

❌ **Insufficient diversity**:
- Plan A: ["Tech Stack: Cloud", "Risk: Market"]
- Plan B: ["Tech Stack: Cloud", "Risk: Market-focused"] → Only 1 difference (risk value slightly different)

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format session not found error
 */
export function formatSessionNotFound(session_id: string): string {
  return `# ❌ Session Not Found

**Session ID**: \`${session_id}\`

## Problem
The server cannot find a session with this ID. This usually means:

1. **Wrong session_id**: You're using a different session_id than the one returned by \`init_parallel_reasoning\`
2. **Session expired**: The session may have timed out (sessions expire after 1 hour of inactivity)
3. **Server restart**: The local development server was restarted

## Solution

### If you have the correct session_id
Make sure you're using the EXACT session_id returned by \`init_parallel_reasoning\`.

### If you lost the session_id or it expired
Start a new session:

\`\`\`json
{
  "name": "init_parallel_reasoning",
  "arguments": {
    "session_id": "new_session_${Date.now()}",
    "task_description": "Your analysis task",
    "required_diversity_axes": ["data_sources", "analytical_models"],
    "min_plans": 3
  }
}
\`\`\`

⚠️ **Important**: Save the session_id returned by init and use it for ALL subsequent calls.
`;
}

/**
 * Format capability execution success
 */
export function formatCapabilityExecuted(
  session_id: string,
  plan_id: string,
  result_summary: string
): string {
  return `# ✅ Capability Executed: ${plan_id}

**Session ID**: \`${session_id}\`

## Result Summary
${result_summary}

---

## 🎯 Critical: Check Your Progress

**Call this NOW to see what's next**:
\`\`\`json
{
  "name": "list_plan_status",
  "arguments": {
    "session_id": "${session_id}"
  }
}
\`\`\`

This will show you:
- How many more steps you need to execute
- Current coverage, confidence, and consensus percentages
- Specific gaps that need to be filled

---

## Next Actions

After checking status, continue with:

### 1. Execute More Capabilities (if coverage < 95%)

**CRITICAL**: The \`task\` parameter must describe WHAT ANALYSIS TO PERFORM, not just a label.

**GOOD Example** (triggers real reasoning + tool use):
\`\`\`json
{
  "session_id": "${session_id}",
  "plan_id": "${plan_id}",
  "task": "Research the top 5 competitors in the B2B SaaS healthcare market. For each competitor: 1) Identify their primary product offering, 2) Estimate their annual revenue using web search and financial databases, 3) List their key differentiators, 4) Analyze their pricing strategy. Provide specific data points and sources."
}
\`\`\`

**BAD Example** (don't do this - too vague):
\`\`\`json
{
  "task": "competitor analysis"  // ❌ Won't trigger deep reasoning
}
\`\`\`

**Why this matters**:
- Detailed tasks → System uses reasoning + tools → High-quality evidence
- Vague tasks → System just returns text → Low-quality evidence
- Quality evidence → Higher confidence score → Easier to finalize

### 2. Submit Cross-Plan Notes (optional)
\`\`\`json
{
  "session_id": "${session_id}",
  "note": {
    "from_plan_id": "${plan_id}",
    "to_plan_id": "other_plan_id",
    "note": "Key insight to share",
       "references": ["evidence_001"],
       "timestamp": ${Date.now()}
     }
   }
   \`\`\`

4. **Submit peer critiques** to review other plans

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format finalization incomplete
 */
export function formatFinalizationIncomplete(
  session_id: string,
  plans_submitted: number,
  min_plans: number,
  plans_executed: string[],
  plans_not_executed: string[]
): string {
  return `# ⚠️ Session Incomplete

**Session ID**: \`${session_id}\`

## Status
- Plans submitted: ${plans_submitted}/${min_plans}
- Plans executed: ${plans_executed.length}
- Plans not executed: ${plans_not_executed.length}

${plans_not_executed.length > 0 ? `
## Plans Not Yet Executed
${plans_not_executed.map(p => `- \`${p}\``).join('\n')}

## Action Required
Execute at least one capability for each plan before finalizing.

**Example**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan_id": "${plans_not_executed[0]}",
  "task": "Perform analysis for this plan",
  "adapter_id": "strategy"
}
\`\`\`
` : ''}

${plans_submitted < min_plans ? `
## Missing Plans
You need ${min_plans - plans_submitted} more plan(s) to meet minimum requirement.

Submit additional plans with \`submit_reasoning_plan\`.
` : ''}

⚠️ Remember: Use session_id \`${session_id}\` for all calls.
`;
}

/**
 * Format finalization success
 */
export function formatFinalizationSuccess(
  session_id: string,
  plans_count: number,
  decisions_count: number,
  metrics?: SessionMetrics
): string {
  let response = `# ✅ Session Finalized Successfully

**Session ID**: \`${session_id}\`

## Summary
- **Plans analyzed**: ${plans_count}
- **Mediation decisions**: ${decisions_count}
- **Status**: Complete

`;

  // Add metrics if available
  if (metrics) {
    response += `## 📊 Quality Metrics

`;

    response += `- **Confidence**: ${(metrics.confidence * 100).toFixed(1)}% `;
    response += metrics.confidence >= 0.85 ? '✅' : '⚠️';
    response += ` (target: 85%, ${metrics.details.confidence.unique_evidence_count} evidence, `;
    response += `${metrics.details.confidence.evidence_low_count} quality issues)\n`;

    response += `- **Coverage**: ${(metrics.coverage * 100).toFixed(1)}% `;
    response += metrics.coverage >= 0.95 ? '✅' : '⚠️';
    response += ` (target: 95%, ${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} steps)\n`;

    response += `- **Consensus**: ${(metrics.consensus * 100).toFixed(1)}% `;
    response += metrics.consensus >= 0.80 ? '✅' : '⚠️';
    response += ` (target: 80%, ${metrics.details.consensus.agreements} agreements, `;
    response += `${metrics.details.consensus.conflicts} conflicts)\n\n`;

    // Add recommendations if metrics are below thresholds
    const hasLowMetrics = metrics.confidence < 0.85 || metrics.coverage < 0.95 || metrics.consensus < 0.80;

    if (hasLowMetrics) {
      response += `### 💡 Recommendations\n\n`;

      if (metrics.confidence < 0.85) {
        const needed = Math.ceil((0.85 - metrics.confidence) / 0.1);
        response += `- **Improve Confidence**: Add ${needed} more evidence references using \`execute_plan_step\` to strengthen claims\n`;
      }

      if (metrics.coverage < 0.95) {
        const needed = Math.ceil((0.95 - metrics.coverage) * metrics.details.coverage.total_declared_steps);
        response += `- **Improve Coverage**: Execute ${needed} more capability steps to complete declared workflows\n`;
      }

      if (metrics.consensus < 0.80) {
        response += `- **Improve Consensus**: Submit additional peer critiques using \`submit_peer_critique\` to resolve conflicts\n`;
      }

      response += `\n`;
    }
  }

  response += `## Results
The parallel reasoning workflow is complete. All plans have been executed, cross-contaminated, peer-reviewed, and mediated.

You can now use the synthesized insights from the mediation decisions to make your final recommendation.

---

**Workflow Complete** 🎉
`;

  return response;
}

