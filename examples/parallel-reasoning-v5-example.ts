/**
 * Parallel Reasoning v5.0 Example
 * 
 * Demonstrates complete workflow for LLM-centric parallel reasoning:
 * 1. Initialize session with diversity requirements
 * 2. Submit 3 diverse reasoning plans
 * 3. Execute plan steps (capabilities)
 * 4. Cross-plan contamination (notes)
 * 5. Peer review (critiques)
 * 6. Mediation (final decisions)
 * 7. Finalize session
 * 
 * This example shows the format of responses that guide ChatGPT.
 */

import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import {
  handleInitParallelReasoning,
  handleSubmitReasoningPlan,
  handleSubmitCrossPlanNote,
  handleSubmitPeerCritique,
  handleSubmitMediationDecision,
  handleListPlanStatus,
  handleFinalizeParallelReasoning
} from '../src/workers/parallel-reasoning-tools-v5.js';

async function runParallelReasoningExample() {
  console.log('='.repeat(80));
  console.log('PARALLEL REASONING v5.0 - COMPLETE WORKFLOW EXAMPLE');
  console.log('='.repeat(80));
  console.log();

  // Create a manager for this example
  const manager = new ParallelReasoningSessionManager();

  // Step 1: Initialize Session
  console.log('📋 STEP 1: Initialize Parallel Reasoning Session');
  console.log('-'.repeat(80));
  const initResult = await handleInitParallelReasoning({
    session_id: 'fintech_analysis_001',
    task_description: 'Analyze European fintech market for B2B SaaS opportunities',
    required_diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
    min_plans: 3
  }, manager);
  console.log(initResult.content[0].text);
  console.log();

  // Step 2: Submit Plan A (Official Statistics + Regression)
  console.log('📝 STEP 2a: Submit Plan A (Official Statistics + Regression)');
  console.log('-'.repeat(80));
  const planAResult = await handleSubmitReasoningPlan({
    session_id: 'fintech_analysis_001',
    plan: {
      plan_id: 'plan_A',
      description: 'Data-driven baseline using official market statistics',
      diversity_axes: ['data_sources', 'analytical_models'],
      capability_chain: ['market_scan', 'tam_sam_som_build', 'competitor_analysis'],
      rationale: 'Provides reliable baseline using official statistics and proven regression techniques for TAM/SAM/SOM estimation',
      expected_outputs: ['market_map', 'tam_sam_som', 'competitive_landscape']
    }
  }, manager);
  console.log(planAResult.content[0].text);
  console.log();

  // Step 2b: Submit Plan B (Industry Reports + Monte Carlo)
  console.log('📝 STEP 2b: Submit Plan B (Industry Reports + Monte Carlo)');
  console.log('-'.repeat(80));
  const planBResult = await handleSubmitReasoningPlan({
    session_id: 'fintech_analysis_001',
    plan: {
      plan_id: 'plan_B',
      description: 'Probabilistic analysis using industry reports and Monte Carlo simulation',
      diversity_axes: ['data_sources', 'analytical_models'],
      capability_chain: ['market_scan', 'monte_carlo_finance', 'risk_register_build'],
      rationale: 'Provides confidence intervals and risk assessment using Monte Carlo simulation with industry data',
      expected_outputs: ['market_map', 'monte_carlo_results', 'risk_register']
    }
  }, manager);
  console.log(planBResult.content[0].text);
  console.log();

  // Step 2c: Submit Plan C (Academic Research + Long-term)
  console.log('📝 STEP 2c: Submit Plan C (Academic Research + Long-term Horizon)');
  console.log('-'.repeat(80));
  const planCResult = await handleSubmitReasoningPlan({
    session_id: 'fintech_analysis_001',
    plan: {
      plan_id: 'plan_C',
      description: 'Long-term strategic analysis using academic research',
      diversity_axes: ['data_sources', 'time_horizons'],
      capability_chain: ['market_scan', 'scenario_wargaming', 'sustainability_roadmap'],
      rationale: 'Provides long-term perspective (5-10 years) using academic research and scenario planning',
      expected_outputs: ['market_map', 'scenario_analysis', 'sustainability_roadmap']
    }
  }, manager);
  console.log(planCResult.content[0].text);
  console.log();

  // Step 3: Simulate Plan Execution (in real scenario, this would call actual capabilities)
  console.log('⚙️ STEP 3: Execute Plan Steps (Simulated)');
  console.log('-'.repeat(80));
  console.log('In production, this would call execute_plan_step for each capability in each plan.');
  console.log('For this example, we simulate execution by recording results.');
  console.log();

  // Step 4: Cross-Plan Contamination
  console.log('🔄 STEP 4: Cross-Plan Contamination (Notes)');
  console.log('-'.repeat(80));
  const noteABResult = await handleSubmitCrossPlanNote({
    session_id: 'fintech_analysis_001',
    note: {
      from_plan_id: 'plan_A',
      to_plan_id: 'plan_B',
      note: 'Found market size €50B using official statistics (Eurostat 2024). Consider this baseline in your Monte Carlo simulation.',
      references: ['evidence_001', 'evidence_002'],
      timestamp: Date.now()
    }
  }, manager);
  console.log(noteABResult.content[0].text);
  console.log();

  const noteCBResult = await handleSubmitCrossPlanNote({
    session_id: 'fintech_analysis_001',
    note: {
      from_plan_id: 'plan_C',
      to_plan_id: 'plan_B',
      note: 'Academic research (MIT 2023) suggests regulatory changes will impact market structure. Factor this into your risk assessment.',
      references: ['evidence_010', 'evidence_011'],
      timestamp: Date.now()
    }
  }, manager);
  console.log(noteCBResult.content[0].text);
  console.log();

  // Step 5: Peer Review
  console.log('🔍 STEP 5: Peer Review (Critiques)');
  console.log('-'.repeat(80));
  const critiqueBAResult = await handleSubmitPeerCritique({
    session_id: 'fintech_analysis_001',
    critique: {
      reviewer_plan_id: 'plan_B',
      reviewed_plan_id: 'plan_A',
      claims_challenged: [
        'Assumes linear growth, but market shows high volatility (±15% annually)',
        'Official statistics lag 2 years, may not reflect current market dynamics'
      ],
      falsification_tests: [
        'Test with 2008 financial crisis data to validate growth assumptions',
        'Compare with real-time industry reports for validation'
      ],
      residual_risks: [
        'Regulatory changes not considered in baseline model',
        'Currency fluctuations (EUR/USD) ignored in projections'
      ],
      agreement_score: 0.65
    }
  }, manager);
  console.log(critiqueBAResult.content[0].text);
  console.log();

  const critiqueCAResult = await handleSubmitPeerCritique({
    session_id: 'fintech_analysis_001',
    critique: {
      reviewer_plan_id: 'plan_C',
      reviewed_plan_id: 'plan_A',
      claims_challenged: [
        'Short-term focus misses long-term structural shifts (open banking, DeFi)',
        'Ignores sustainability requirements (ESG) becoming mandatory'
      ],
      falsification_tests: [
        'Extend analysis to 10-year horizon to capture structural changes',
        'Include ESG compliance costs in financial projections'
      ],
      residual_risks: [
        'Technological disruption (blockchain, AI) not factored',
        'Geopolitical risks (Brexit, EU regulations) underestimated'
      ],
      agreement_score: 0.58
    }
  }, manager);
  console.log(critiqueCAResult.content[0].text);
  console.log();

  // Step 6: Mediation (Final Decisions)
  console.log('⚖️ STEP 6: Mediation (Final Decisions)');
  console.log('-'.repeat(80));
  const decision1Result = await handleSubmitMediationDecision({
    session_id: 'fintech_analysis_001',
    decision: {
      decision_point: 'Market size estimation',
      chosen_from_plan: 'plan_B',
      rationale: 'Monte Carlo simulation provides confidence intervals (€45B-€55B, 95% CI), more robust than point estimate. Incorporates volatility identified by peer review.',
      evidence_ids: ['evidence_005', 'evidence_006', 'evidence_007'],
      confidence: 0.82
    }
  }, manager);
  console.log(decision1Result.content[0].text);
  console.log();

  const decision2Result = await handleSubmitMediationDecision({
    session_id: 'fintech_analysis_001',
    decision: {
      decision_point: 'Growth rate projection',
      chosen_from_plan: 'plan_A',
      rationale: 'Regression analysis on official statistics provides conservative baseline (12% CAGR). Validated by Plan B\'s Monte Carlo lower bound.',
      evidence_ids: ['evidence_003', 'evidence_004'],
      confidence: 0.75
    }
  }, manager);
  console.log(decision2Result.content[0].text);
  console.log();

  const decision3Result = await handleSubmitMediationDecision({
    session_id: 'fintech_analysis_001',
    decision: {
      decision_point: 'Risk assessment and long-term outlook',
      chosen_from_plan: 'plan_C',
      rationale: 'Long-term scenario analysis captures regulatory and technological risks missed by short-term models. Critical for strategic planning.',
      evidence_ids: ['evidence_012', 'evidence_013', 'evidence_014'],
      confidence: 0.78
    }
  }, manager);
  console.log(decision3Result.content[0].text);
  console.log();

  // Step 7: List Status (Check Completeness)
  console.log('📊 STEP 7: List Plan Status (Check Completeness)');
  console.log('-'.repeat(80));
  const statusResult = await handleListPlanStatus({
    session_id: 'fintech_analysis_001'
  }, manager);
  console.log(statusResult.content[0].text);
  console.log();

  // Step 8: Finalize Session
  console.log('✅ STEP 8: Finalize Parallel Reasoning Session');
  console.log('-'.repeat(80));
  const finalizeResult = await handleFinalizeParallelReasoning({
    session_id: 'fintech_analysis_001'
  }, manager);
  console.log(finalizeResult.content[0].text);
  console.log();

  console.log('='.repeat(80));
  console.log('✅ PARALLEL REASONING v5.0 WORKFLOW COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('Key Takeaways:');
  console.log('1. ✅ Diversity enforced: Plans differ on ≥2 axes (data_sources, analytical_models, time_horizons)');
  console.log('2. ✅ Contamination enabled: Plans exchanged insights via cross-plan notes');
  console.log('3. ✅ Peer review: Plans critiqued each other, identifying weaknesses');
  console.log('4. ✅ Mediation: Final decisions cite evidence from multiple plans');
  console.log('5. ✅ Quality boost: Consensus score 0.78 (high robustness from diverse perspectives)');
  console.log();
}

// Run the example
runParallelReasoningExample().catch(console.error);

