/**
 * Manifest-Based Execution System
 * 
 * Enables ChatGPT to execute all reasoning steps in a single native session,
 * then register results in batch.
 */

import { z } from 'zod';
import type { ParallelReasoningSessionManager } from './parallel-reasoning-mcp.js';
import type {
  ExecutionManifest,
  ExecutionResults,
  ExecutionToken,
  BatchRegistrationResult,
  QualitySignals,
  SaliencyReport,
  MissingEvidenceType,
  WeakStep,
  ConsensusGap
} from '../types/manifest-execution.js';

/**
 * Generate execution token
 *
 * Token expires after 7 days to allow for complex analysis workflows
 * that may require multiple sessions or extended research time.
 */
function generateExecutionToken(session_id: string): ExecutionToken {
  const now = Date.now();
  const expires_at = now + 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = `exec_${session_id}_${now}_${Math.random().toString(36).substring(7)}`;

  console.log(`[Token Generation] Creating token for session: ${session_id}`);
  console.log(`[Token Generation] Current time: ${now} (${new Date(now).toISOString()})`);
  console.log(`[Token Generation] Expires at: ${expires_at} (${new Date(expires_at).toISOString()})`);
  console.log(`[Token Generation] Validity period: 7 days (${7 * 24} hours)`);

  return {
    token,
    session_id,
    created_at: now,
    expires_at: expires_at,
    used: false
  };
}

/**
 * Generate execution manifest
 */
export function generateExecutionManifest(
  session_id: string,
  manager: ParallelReasoningSessionManager
): ExecutionManifest {
  const session = manager.getSession(session_id);
  if (!session) {
    throw new Error(`Session ${session_id} not found`);
  }

  const execution_token = generateExecutionToken(session_id);
  
  // Store token in session for validation
  if (!session.execution_tokens) {
    session.execution_tokens = [];
  }
  session.execution_tokens.push(execution_token);

  const manifest: ExecutionManifest = {
    session_id,
    execution_token: execution_token.token,
    created_at: Date.now(),
    plans: Array.from(session.plans.values()).map(plan => ({
      plan_id: plan.plan_id,
      description: plan.description,
      diversity_axes: plan.diversity_axes,
      rationale: plan.rationale,
      steps: plan.capability_chain.map((capability, index) => ({
        step_id: `${plan.plan_id}_step_${index + 1}`,
        capability,
        context: `Step ${index + 1} of ${plan.capability_chain.length} for ${plan.plan_id}`,
        expected_outputs: plan.expected_outputs,
        quality_requirements: {
          requires_external_sources: true,
          requires_quantitative_data: index % 2 === 0, // Alternate for variety
          requires_comparative_analysis: plan.capability_chain.length > 1,
          requires_workpapers: true
        }
      }))
    })),
    quality_targets: {
      coverage: 0.95,
      confidence: 0.85,
      consensus: 0.80
    },
    guidance: generateExecutionGuidance(session_id, session.task_description)
  };

  return manifest;
}

/**
 * Generate execution guidance for ChatGPT
 */
function generateExecutionGuidance(session_id: string, task_description: string): string {
  return `# 🎯 Execution Manifest for Parallel Reasoning Session

**Session ID**: \`${session_id}\`
**Task**: ${task_description}

## CRITICAL INSTRUCTIONS

You have received an execution manifest containing ALL steps across ALL plans.

**YOUR MISSION**: Execute ALL steps using your NATIVE reasoning capabilities and tools.

### Execution Approach

1. **Use Native Tools**:
   - Web search for external data and sources
   - Python for calculations, data analysis, visualizations
   - Code interpreter for complex computations
   - Your own reasoning for synthesis and interpretation

2. **Generate "Load Bearing" Evidence**:
   - **External Sources**: Cite URLs, reports, academic papers with specific claims
   - **Quantitative Data**: Show numbers, calculations, datasets with methodology
   - **Workpapers**: Create structured artifacts (tables, charts, calculations)
   - **Comparative Analysis**: Build explicit comparisons with metrics

3. **Quality Standards**:
   - Each finding must be traceable to specific evidence
   - Quantitative claims must show data sources and calculations
   - Qualitative claims must cite authoritative sources
   - Comparative claims must show explicit side-by-side analysis

### Execution Strategy

**For Each Plan**:
1. Read the plan description and diversity axes
2. Understand the unique perspective this plan brings
3. Execute each step systematically
4. Document findings, evidence, and workpapers

**For Each Step**:
1. Understand the capability being exercised
2. Perform the analysis using appropriate tools
3. Generate workpapers (datasets, calculations, comparisons)
4. Cite external sources with URLs and specific data points
5. Document your reasoning process

### Evidence Requirements

**CRITICAL**: Your evidence must be independently verifiable.

**Good Evidence Examples**:
- "According to Gartner's 2024 Market Guide (URL), the market size is $X billion"
- "Calculation: Revenue = Units × Price = 1M × $50 = $50M (see workpaper)"
- "Comparison table shows Company A has 2x the market share of Company B (see dataset)"

**Bad Evidence Examples** (avoid these):
- "The market is large" (no data)
- "Competitors exist" (no specifics)
- "Analysis shows..." (no methodology)

### Workpaper Types

Create structured artifacts for each analysis:

1. **Datasets**: Tables with raw data and sources
2. **Calculations**: Step-by-step computations with formulas
3. **Comparisons**: Side-by-side analysis with metrics
4. **Visualizations**: Charts, graphs (as code or descriptions)

### After Completion

When you've executed ALL steps across ALL plans:

1. Review your work for quality
2. Ensure each step has evidence and workpapers
3. Call \`register_execution_results\` with your findings

**Remember**: This is NOT about writing descriptions. This is about DOING THE ANALYSIS and SHOWING YOUR WORK.

Good luck! 🚀
`;
}

/**
 * Schema for execute_reasoning_manifest tool
 */
export const ExecuteReasoningManifestSchema = z.object({
  session_id: z.string().describe('Session ID to generate manifest for')
});

/**
 * Schema for regenerate_execution_token tool
 */
export const RegenerateExecutionTokenSchema = z.object({
  session_id: z.string().describe('Session ID to regenerate token for'),
  preserve_results: z.boolean().optional().default(true).describe('If true, preserves existing execution results (default: true)')
});

/**
 * Handler for execute_reasoning_manifest tool
 */
export async function handleExecuteReasoningManifest(
  args: z.infer<typeof ExecuteReasoningManifestSchema>,
  manager: ParallelReasoningSessionManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const manifest = generateExecutionManifest(args.session_id, manager);

    // Format manifest as readable text
    const manifestText = formatManifest(manifest);

    return {
      content: [{
        type: 'text',
        text: manifestText
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error generating execution manifest: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Handler for regenerate_execution_token tool
 *
 * Regenerates execution token when the previous one has expired.
 * Useful for long-running analysis workflows that exceed the token validity period.
 */
export async function handleRegenerateExecutionToken(
  args: z.infer<typeof RegenerateExecutionTokenSchema>,
  manager: ParallelReasoningSessionManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const session = manager.getSession(args.session_id);
    if (!session) {
      throw new Error(`Session ${args.session_id} not found`);
    }

    // Count existing results if preserving
    let existing_results_count = 0;
    if (args.preserve_results) {
      for (const results of session.plan_results.values()) {
        existing_results_count += results.length;
      }
    }

    // Generate new token
    const new_token = generateExecutionToken(args.session_id);

    // Add to session
    if (!session.execution_tokens) {
      session.execution_tokens = [];
    }
    session.execution_tokens.push(new_token);

    // Mark old tokens as expired (but keep them for audit trail)
    for (const token of session.execution_tokens) {
      if (token.token !== new_token.token && !token.used) {
        token.expires_at = Date.now() - 1; // Mark as expired
      }
    }

    session.updated_at = Date.now();

    let output = '# 🔄 Execution Token Regenerated\n\n';
    output += `**Session ID**: \`${args.session_id}\`\n`;
    output += `**New Execution Token**: \`${new_token.token}\`\n`;
    output += `**Valid Until**: ${new Date(new_token.expires_at).toISOString()}\n`;
    output += `**Validity Period**: 7 days\n\n`;

    if (args.preserve_results && existing_results_count > 0) {
      output += `## ✅ Preserved Existing Results\n\n`;
      output += `${existing_results_count} execution results have been preserved.\n\n`;
      output += `You can continue registering additional results using the new token.\n\n`;
    }

    output += `## 📋 Next Steps\n\n`;
    output += `1. Continue executing remaining steps from your manifest\n`;
    output += `2. Call \`register_execution_results\` with the new token when ready\n`;
    output += `3. The new token is valid for 7 days from now\n\n`;

    output += `**Important**: Use the new token for registration:\n`;
    output += `\`\`\`\n${new_token.token}\n\`\`\`\n`;

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error regenerating execution token: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Format manifest for display
 */
function formatManifest(manifest: ExecutionManifest): string {
  let output = manifest.guidance;
  
  output += '\n\n---\n\n## 📋 Execution Manifest\n\n';
  output += `**Execution Token**: \`${manifest.execution_token}\`\n`;
  output += `**Created**: ${new Date(manifest.created_at).toISOString()}\n\n`;
  
  output += '### Quality Targets\n\n';
  output += `- **Coverage**: ≥${(manifest.quality_targets.coverage * 100).toFixed(0)}%\n`;
  output += `- **Confidence**: ≥${(manifest.quality_targets.confidence * 100).toFixed(0)}%\n`;
  output += `- **Consensus**: ≥${(manifest.quality_targets.consensus * 100).toFixed(0)}%\n\n`;
  
  output += '### Plans to Execute\n\n';
  
  for (const plan of manifest.plans) {
    output += `#### ${plan.plan_id}\n\n`;
    output += `**Description**: ${plan.description}\n\n`;
    output += `**Diversity Axes**: ${plan.diversity_axes.join(', ')}\n\n`;
    output += `**Rationale**: ${plan.rationale}\n\n`;
    output += `**Steps** (${plan.steps.length} total):\n\n`;
    
    for (const step of plan.steps) {
      output += `${plan.steps.indexOf(step) + 1}. **${step.capability}**\n`;
      output += `   - Step ID: \`${step.step_id}\`\n`;
      output += `   - Context: ${step.context}\n`;
      output += `   - Quality Requirements:\n`;
      if (step.quality_requirements.requires_external_sources) {
        output += `     - ✅ External sources required\n`;
      }
      if (step.quality_requirements.requires_quantitative_data) {
        output += `     - ✅ Quantitative data required\n`;
      }
      if (step.quality_requirements.requires_comparative_analysis) {
        output += `     - ✅ Comparative analysis required\n`;
      }
      if (step.quality_requirements.requires_workpapers) {
        output += `     - ✅ Workpapers required\n`;
      }
      output += '\n';
    }
    output += '\n';
  }
  
  output += '---\n\n';
  output += '## 🎬 Next Steps\n\n';
  output += '1. Execute ALL steps across ALL plans using your native reasoning and tools\n';
  output += '2. Generate workpapers (datasets, calculations, comparisons) for each analysis\n';
  output += '3. Cite external sources with URLs and specific data points\n';
  output += '4. Document your findings and reasoning process\n';
  output += '5. Call `register_execution_results` with your complete results\n\n';
  output += `**Execution Token**: \`${manifest.execution_token}\` (you'll need this for registration)\n`;
  
  return output;
}

/**
 * Schema for register_execution_results tool
 */
export const RegisterExecutionResultsSchema = z.object({
  execution_token: z.string().describe('Execution token from execute_reasoning_manifest'),
  results: z.array(z.object({
    plan_id: z.string(),
    step_id: z.string(),
    findings: z.string().describe('Detailed findings from this step'),
    evidence_refs: z.array(z.object({
      type: z.enum(['url', 'citation', 'data_source', 'calculation', 'comparison']),
      source: z.string(),
      description: z.string(),
      reliability_score: z.number().min(0).max(1).optional()
    })).optional().default([]).describe('Evidence references (URLs, citations, data sources). Optional but recommended for quality scoring.'),
    workpapers: z.array(z.object({
      type: z.enum(['dataset', 'calculation', 'comparison', 'analysis', 'visualization']),
      title: z.string(),
      content: z.string(),
      format: z.enum(['markdown', 'json', 'csv', 'python']),
      metadata: z.record(z.any()).optional()
    })).optional().default([]).describe('Supporting workpapers (datasets, calculations, analyses). Optional but recommended for quality scoring.'),
    reasoning_trace: z.string().optional()
  }))
});

/**
 * Handler for register_execution_results tool
 */
export async function handleRegisterExecutionResults(
  args: z.infer<typeof RegisterExecutionResultsSchema>,
  manager: ParallelReasoningSessionManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate execution token
    const session = findSessionByExecutionToken(args.execution_token, manager);
    if (!session) {
      throw new Error(
        'Invalid or expired execution token. ' +
        'The token may have been deleted or the session may have been terminated. ' +
        'Generate a new manifest with `execute_reasoning_manifest` to continue.'
      );
    }

    // Mark token as used
    const token = session.execution_tokens?.find((t: ExecutionToken) => t.token === args.execution_token);
    if (!token) {
      throw new Error(
        'Execution token not found in session. ' +
        'This may indicate a session state issue. ' +
        'Generate a new manifest with `execute_reasoning_manifest` to continue.'
      );
    }
    if (token.used) {
      throw new Error(
        'Execution token already used. Each token can only be used once. ' +
        'If you need to register additional results, generate a new manifest with `execute_reasoning_manifest`.'
      );
    }

    // Detailed expiration check with diagnostic info
    const now = Date.now();
    const age_ms = now - token.created_at;
    const age_minutes = Math.floor(age_ms / (60 * 1000));
    const age_hours = Math.floor(age_ms / (60 * 60 * 1000));
    const validity_period_ms = token.expires_at - token.created_at;
    const validity_period_hours = Math.floor(validity_period_ms / (60 * 60 * 1000));
    const time_until_expiry_ms = token.expires_at - now;
    const time_until_expiry_hours = Math.floor(time_until_expiry_ms / (60 * 60 * 1000));

    console.log(`[Token Validation] Current time: ${now} (${new Date(now).toISOString()})`);
    console.log(`[Token Validation] Token created: ${token.created_at} (${new Date(token.created_at).toISOString()})`);
    console.log(`[Token Validation] Token expires: ${token.expires_at} (${new Date(token.expires_at).toISOString()})`);
    console.log(`[Token Validation] Token age: ${age_minutes} minutes (${age_hours} hours)`);
    console.log(`[Token Validation] Validity period: ${validity_period_hours} hours`);
    console.log(`[Token Validation] Time until expiry: ${time_until_expiry_hours} hours`);
    console.log(`[Token Validation] Is expired? ${token.expires_at < now}`);

    if (token.expires_at < now) {
      throw new Error(
        `Execution token expired. ` +
        `Token was created ${age_hours} hours ago (${age_minutes} minutes) and was valid for ${validity_period_hours} hours. ` +
        `Current time: ${new Date(now).toISOString()}, ` +
        `Token created: ${new Date(token.created_at).toISOString()}, ` +
        `Token expired: ${new Date(token.expires_at).toISOString()}. ` +
        `Use 'regenerate_execution_token' to generate a new token while preserving existing results.`
      );
    }
    token.used = true;

    // Register all results in batch
    let registered_count = 0;
    let failed_count = 0;

    for (const result of args.results) {
      try {
        // Create evidence ID
        const evidence_id = `evidence_${result.plan_id}_${result.step_id}_${Date.now()}`;

        // Register in plan_results
        if (!session.plan_results.has(result.plan_id)) {
          session.plan_results.set(result.plan_id, []);
        }

        session.plan_results.get(result.plan_id)!.push({
          step_id: result.step_id,
          evidence_id,
          findings: result.findings,
          evidence_refs: result.evidence_refs,
          workpapers: result.workpapers,
          reasoning_trace: result.reasoning_trace,
          timestamp: Date.now()
        });

        registered_count++;
      } catch (error) {
        console.error(`Failed to register result for ${result.plan_id}/${result.step_id}:`, error);
        failed_count++;
      }
    }

    // Calculate quality signals
    const quality_signals = calculateQualitySignals(session, args.results);

    // Generate saliency report
    const saliency_report = generateSaliencyReport(session, quality_signals);

    // Save saliency report to session
    session.saliency_report = saliency_report;
    session.updated_at = Date.now();

    // Update metrics
    const metrics = manager.computeMetrics(session.session_id);

    const batch_result: BatchRegistrationResult = {
      session_id: session.session_id,
      execution_token: args.execution_token,
      registered_count,
      failed_count,
      quality_signals,
      saliency_report,
      updated_metrics: {
        coverage: metrics.coverage,
        confidence: metrics.confidence,
        consensus: metrics.consensus
      }
    };

    return {
      content: [{
        type: 'text',
        text: formatBatchRegistrationResult(batch_result)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error registering execution results: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Find session by execution token
 */
function findSessionByExecutionToken(
  token: string,
  manager: ParallelReasoningSessionManager
): any | null {
  // Iterate through all sessions to find the one with this token
  for (const [session_id, session] of (manager as any).sessions) {
    if (session.execution_tokens?.some((t: ExecutionToken) => t.token === token)) {
      return session;
    }
  }
  return null;
}

/**
 * Calculate quality signals from results
 */
function calculateQualitySignals(session: any, results: any[]): QualitySignals {
  let external_source_count = 0;
  let quantitative_data_points = 0;
  let workpaper_count = 0;
  let comparison_count = 0;
  let citation_count = 0;

  for (const result of results) {
    // Count evidence types (handle optional arrays)
    const evidence_refs = result.evidence_refs || [];
    for (const ref of evidence_refs) {
      if (ref.type === 'url' || ref.type === 'citation') {
        external_source_count++;
        if (ref.type === 'citation') citation_count++;
      }
      if (ref.type === 'data_source') quantitative_data_points++;
      if (ref.type === 'calculation') quantitative_data_points++;
      if (ref.type === 'comparison') comparison_count++;
    }

    // Count workpapers (handle optional array)
    const workpapers = result.workpapers || [];
    workpaper_count += workpapers.length;
  }

  const has_external_sources = external_source_count > 0;
  const has_quantitative_data = quantitative_data_points > 0;
  const has_workpapers = workpaper_count > 0;
  const has_comparative_analysis = comparison_count > 0;
  const has_citations = citation_count > 0;

  // Calculate quality scores
  const evidence_depth_score = Math.min(1.0, (
    (has_external_sources ? 0.3 : 0) +
    (has_quantitative_data ? 0.3 : 0) +
    (has_workpapers ? 0.2 : 0) +
    (has_comparative_analysis ? 0.2 : 0)
  ));

  const evidence_breadth_score = Math.min(1.0, (
    external_source_count * 0.1 +
    quantitative_data_points * 0.05 +
    workpaper_count * 0.1 +
    comparison_count * 0.1
  ));

  const evidence_reliability_score = Math.min(1.0, (
    (has_citations ? 0.4 : 0) +
    (has_external_sources ? 0.3 : 0) +
    (has_workpapers ? 0.3 : 0)
  ));

  const evidence_low = evidence_depth_score < 0.5;
  const evidence_high = evidence_depth_score >= 0.8;

  return {
    has_external_sources,
    external_source_count,
    has_quantitative_data,
    quantitative_data_points,
    has_workpapers,
    workpaper_count,
    has_comparative_analysis,
    comparison_count,
    has_citations,
    citation_count,
    evidence_depth_score,
    evidence_breadth_score,
    evidence_reliability_score,
    evidence_low,
    evidence_high
  };
}

/**
 * Generate saliency report
 */
function generateSaliencyReport(session: any, quality_signals: QualitySignals): SaliencyReport {
  const missing_evidence_types: MissingEvidenceType[] = [];
  const weak_steps: WeakStep[] = [];
  const consensus_gaps: ConsensusGap[] = [];

  // Identify missing evidence types
  if (!quality_signals.has_external_sources || quality_signals.external_source_count < 3) {
    missing_evidence_types.push({
      type: 'external_sources',
      description: 'Citations from authoritative external sources',
      examples: [
        'Industry reports with URLs (e.g., Gartner, Forrester)',
        'Company financial data from public sources',
        'Academic research papers with DOIs',
        'Government statistics with source URLs'
      ],
      priority: 'critical',
      affected_plans: Array.from(session.plans.keys()),
      affected_steps: []
    });
  }

  if (!quality_signals.has_quantitative_data || quality_signals.quantitative_data_points < 5) {
    missing_evidence_types.push({
      type: 'quantitative_data',
      description: 'Numerical analysis with calculations and data sources',
      examples: [
        'Market size calculations with methodology',
        'Revenue estimates with data sources',
        'Growth rate analysis with historical data',
        'Statistical comparisons with significance tests'
      ],
      priority: 'high',
      affected_plans: Array.from(session.plans.keys()),
      affected_steps: []
    });
  }

  if (!quality_signals.has_workpapers || quality_signals.workpaper_count < 3) {
    missing_evidence_types.push({
      type: 'workpapers',
      description: 'Structured analytical artifacts',
      examples: [
        'Datasets in CSV or JSON format',
        'Calculation workpapers showing step-by-step math',
        'Comparison tables with side-by-side metrics',
        'Visualization code or descriptions'
      ],
      priority: 'high',
      affected_plans: Array.from(session.plans.keys()),
      affected_steps: []
    });
  }

  const overall_quality_score = (
    quality_signals.evidence_depth_score * 0.4 +
    quality_signals.evidence_breadth_score * 0.3 +
    quality_signals.evidence_reliability_score * 0.3
  );

  const recommendations: string[] = [];
  if (overall_quality_score < 0.7) {
    recommendations.push('Overall evidence quality is below target. Focus on adding external sources and workpapers.');
  }
  if (!quality_signals.has_external_sources) {
    recommendations.push('Add citations to authoritative sources with URLs.');
  }
  if (!quality_signals.has_quantitative_data) {
    recommendations.push('Include numerical analysis with calculations and data sources.');
  }
  if (!quality_signals.has_workpapers) {
    recommendations.push('Create structured workpapers (datasets, calculations, comparisons).');
  }

  return {
    session_id: session.session_id,
    generated_at: Date.now(),
    overall_quality_score,
    missing_evidence_types,
    weak_steps,
    consensus_gaps,
    recommendations
  };
}

/**
 * Format batch registration result
 */
function formatBatchRegistrationResult(result: BatchRegistrationResult): string {
  let output = '# ✅ Execution Results Registered\n\n';
  output += `**Session ID**: \`${result.session_id}\`\n`;
  output += `**Execution Token**: \`${result.execution_token}\`\n\n`;

  output += '## Registration Summary\n\n';
  output += `- **Registered**: ${result.registered_count} steps\n`;
  output += `- **Failed**: ${result.failed_count} steps\n\n`;

  output += '## Quality Signals\n\n';
  const qs = result.quality_signals;
  output += `- **External Sources**: ${qs.external_source_count} (${qs.has_external_sources ? '✅' : '❌'})\n`;
  output += `- **Quantitative Data Points**: ${qs.quantitative_data_points} (${qs.has_quantitative_data ? '✅' : '❌'})\n`;
  output += `- **Workpapers**: ${qs.workpaper_count} (${qs.has_workpapers ? '✅' : '❌'})\n`;
  output += `- **Comparisons**: ${qs.comparison_count} (${qs.has_comparative_analysis ? '✅' : '❌'})\n`;
  output += `- **Citations**: ${qs.citation_count} (${qs.has_citations ? '✅' : '❌'})\n\n`;

  output += '### Quality Scores\n\n';
  output += `- **Evidence Depth**: ${(qs.evidence_depth_score * 100).toFixed(1)}%\n`;
  output += `- **Evidence Breadth**: ${(qs.evidence_breadth_score * 100).toFixed(1)}%\n`;
  output += `- **Evidence Reliability**: ${(qs.evidence_reliability_score * 100).toFixed(1)}%\n\n`;

  if (qs.evidence_high) {
    output += '✅ **High Quality Evidence Detected**\n\n';
  } else if (qs.evidence_low) {
    output += '⚠️ **Low Quality Evidence Detected** - See saliency report below\n\n';
  }

  output += '## Updated Metrics\n\n';
  output += `- **Coverage**: ${(result.updated_metrics.coverage * 100).toFixed(1)}%\n`;
  output += `- **Confidence**: ${(result.updated_metrics.confidence * 100).toFixed(1)}%\n`;
  output += `- **Consensus**: ${(result.updated_metrics.consensus * 100).toFixed(1)}%\n\n`;

  output += '## Saliency Report\n\n';
  const sr = result.saliency_report;
  output += `**Overall Quality Score**: ${(sr.overall_quality_score * 100).toFixed(1)}%\n\n`;

  if (sr.missing_evidence_types.length > 0) {
    output += '### Missing Evidence Types\n\n';
    for (const met of sr.missing_evidence_types) {
      output += `#### ${met.type} (${met.priority} priority)\n\n`;
      output += `${met.description}\n\n`;
      output += '**Examples**:\n';
      for (const example of met.examples) {
        output += `- ${example}\n`;
      }
      output += '\n';
    }
  }

  if (sr.recommendations.length > 0) {
    output += '### Recommendations\n\n';
    for (const rec of sr.recommendations) {
      output += `- ${rec}\n`;
    }
    output += '\n';
  }

  output += '---\n\n';
  output += '## Next Steps\n\n';
  output += '1. Review the saliency report to understand quality gaps\n';
  output += '2. If quality is sufficient, proceed with peer critiques\n';
  output += '3. If quality needs improvement, consider re-executing weak steps\n';
  output += '4. Call `list_plan_status` to see overall session readiness\n';

  return output;
}

