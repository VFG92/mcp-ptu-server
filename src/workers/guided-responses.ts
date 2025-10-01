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

/**
 * Format session initialization success
 */
export function formatInitSuccess(
  session_id: string,
  task_description: string,
  required_axes: DiversityAxis[],
  min_plans: number
): string {
  return `# ✅ Session Initialized Successfully

**Session ID**: \`${session_id}\`

⚠️ **IMPORTANT**: Use this EXACT session_id for ALL subsequent calls in this workflow.

## Task
${task_description}

## Requirements
- **Minimum plans**: ${min_plans}
- **Required diversity axes** (ALL plans must include these):
${required_axes.map(axis => `  - \`${axis}\``).join('\n')}

## Available Diversity Axes
You can use any combination of these axes (must include all required axes above):
- \`data_sources\` - Different data sources (official stats vs industry reports vs expert interviews)
- \`analytical_models\` - Different models (regression vs Monte Carlo vs frameworks)
- \`time_horizons\` - Different time frames (short-term vs long-term)
- \`quality_metrics\` - Different quality criteria (precision vs recall vs robustness)
- \`risk_perspectives\` - Different risk lenses (market vs regulatory vs operational)
- \`stakeholder_views\` - Different stakeholder perspectives (customer vs investor vs regulator)

## Next Step
Call \`submit_reasoning_plan\` to submit your first plan.

**Example**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan": {
    "plan_id": "plan_A",
    "description": "Quantitative analysis using official statistics",
    "diversity_axes": [${required_axes.map(a => `"${a}"`).join(', ')}, "time_horizons"],
    "capability_chain": ["market_scan", "tam_sam_som_build", "competitor_analysis", "customer_segmentation_clustering", "pricing_analysis_elasticity", "market_sizing_regression", "growth_forecast_arima", "market_share_analysis"],
    "rationale": "Uses official statistics and quantitative models",
    "expected_outputs": ["Market size", "Competitive landscape"]
  }
}
\`\`\`

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
  axes_declared: DiversityAxis[]
): string {
  const needs_more = plans_submitted < min_plans;
  
  return `# ✅ Plan Accepted: ${plan_id}

**Session ID**: \`${session_id}\`
**Plans submitted**: ${plans_submitted}/${min_plans}
**Diversity axes**: ${axes_declared.join(', ')}

${needs_more ? `
## Next Step
Submit ${min_plans - plans_submitted} more plan(s) to meet minimum requirement.

⚠️ **Diversity Requirement**: Each new plan must differ from existing plans on at least 2 axes.

**Example for next plan**:
\`\`\`json
{
  "session_id": "${session_id}",
  "plan": {
    "plan_id": "plan_B",
    "description": "Risk-adjusted analysis using Monte Carlo",
    "diversity_axes": ["data_sources", "analytical_models", "risk_perspectives"],
    "capability_chain": [...8-32 capabilities...],
    "rationale": "Uses probabilistic modeling for risk assessment",
    "expected_outputs": ["Risk-adjusted projections"]
  }
}
\`\`\`
` : `
## Next Step
You have submitted the minimum number of plans (${min_plans}).

You can now:
1. **Execute capabilities**: Call \`execute_plan_step\` to run analysis for each plan
2. **Submit more plans**: Add additional plans for deeper analysis (optional)

**Example - Execute capability**:
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
  const missing = required_axes.filter(axis => !declared_axes.includes(axis));
  const present = required_axes.filter(axis => declared_axes.includes(axis));
  
  return `# ❌ Plan Rejected: ${plan_id}

**Reason**: Missing required diversity axes

## Required Axes (must include ALL)
${required_axes.map(axis => {
  const has = declared_axes.includes(axis);
  return `  ${has ? '✓' : '✗'} \`${axis}\`${has ? ' (present)' : ' **← MISSING**'}`;
}).join('\n')}

## Your Plan Declared
${declared_axes.map(axis => `  - \`${axis}\``).join('\n')}

## Action Required
Add the missing axis/axes to your \`diversity_axes\` array and resubmit.

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

**Reason**: Diversity axes too similar to existing plans

## Diversity Requirement
Each plan must differ from ALL existing plans on at least **2 axes**.

## Your Plan
- **Axes**: ${declared_axes.join(', ')}

## Existing Plans
${existing_plans.map(p => `- **${p.plan_id}**: ${p.axes.join(', ')}`).join('\n')}

## Problem
Your plan's axes overlap too much with existing plans. You need at least 2 axes that differ.

## Suggested Fixes

### Option 1: Change one axis
\`\`\`json
{
  "diversity_axes": [${[...required_axes, 'time_horizons'].map(a => `"${a}"`).join(', ')}]
}
\`\`\`

### Option 2: Use different combination
\`\`\`json
{
  "diversity_axes": [${[...required_axes, 'stakeholder_views'].map(a => `"${a}"`).join(', ')}]
}
\`\`\`

### Option 3: Add more axes
\`\`\`json
{
  "diversity_axes": [${[...required_axes, 'quality_metrics', 'risk_perspectives'].map(a => `"${a}"`).join(', ')}]
}
\`\`\`

## Available Axes
- \`data_sources\`, \`analytical_models\`, \`time_horizons\`, \`quality_metrics\`, \`risk_perspectives\`, \`stakeholder_views\`

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

## Result
${result_summary}

## Next Steps

You can now:

1. **Execute more capabilities** for this plan:
   \`\`\`json
   {
     "session_id": "${session_id}",
     "plan_id": "${plan_id}",
     "task": "Next capability task",
     "adapter_id": "strategy"
   }
   \`\`\`

2. **Execute capabilities for other plans**

3. **Submit cross-plan notes** to share insights:
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
  decisions_count: number
): string {
  return `# ✅ Session Finalized Successfully

**Session ID**: \`${session_id}\`

## Summary
- **Plans analyzed**: ${plans_count}
- **Mediation decisions**: ${decisions_count}
- **Status**: Complete

## Results
The parallel reasoning workflow is complete. All plans have been executed, cross-contaminated, peer-reviewed, and mediated.

You can now use the synthesized insights from the mediation decisions to make your final recommendation.

---

**Workflow Complete** 🎉
`;
}

