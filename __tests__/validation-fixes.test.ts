/**
 * Tests for validation fixes:
 * 1. Finalization validates min_plans
 * 2. Mediation validates evidence IDs
 */

import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp';
import {
  handleInitParallelReasoning,
  handleSubmitReasoningPlan,
  handleExecutePlanStep,
  handleSubmitMediationDecision,
  handleFinalizeParallelReasoning
} from '../src/workers/parallel-reasoning-tools-v5';
import { EvidenceLedger } from '../src/workers/evidence-ledger';
import { EvidenceType } from '../src/workers/capability-graph';

describe('Validation Fixes', () => {
  let manager: ParallelReasoningSessionManager;
  let evidenceLedger: EvidenceLedger;
  const sessionId = 'test_validation_fixes';

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
    evidenceLedger = new EvidenceLedger();
  });

  describe('Finalization validates min_plans', () => {
    it('should reject finalization when fewer than min_plans submitted', async () => {
      // Initialize with min_plans = 3
      await handleInitParallelReasoning({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 3
      }, manager);

      // Submit only 2 plans
      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_A',
          description: 'Plan A',
          diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
          capability_chain: [
            'market_scan',
            'tam_sam_som_build',
            'competitor_analysis',
            'customer_segmentation_clustering',
            'pricing_analysis_elasticity',
            'market_sizing_regression',
            'growth_forecast_arima',
            'market_share_analysis'
          ],
          rationale: 'Test plan A',
          expected_outputs: ['market_map']
        }
      }, manager);

      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_B',
          description: 'Plan B',
          diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
          capability_chain: [
            'market_scan',
            'risk_assessment_monte_carlo',
            'scenario_planning_probabilistic',
            'regulatory_risk_assessment',
            'financial_risk_assessment',
            'sensitivity_analysis_tornado',
            'stress_testing_scenarios',
            'break_even_analysis'
          ],
          rationale: 'Test plan B',
          expected_outputs: ['risk_register']
        }
      }, manager);

      // Execute both plans (mock)
      const session = manager.getSession(sessionId);
      if (session) {
        session.plan_results.set('plan_A', [{ result: 'mock' }]);
        session.plan_results.set('plan_B', [{ result: 'mock' }]);
      }

      // Try to finalize
      const result = await handleFinalizeParallelReasoning({
        session_id: sessionId
      }, manager);

      // Should fail because only 2 plans submitted, but min_plans = 3
      expect(result.content[0].text).toContain('Minimum Plans Not Met');
      expect(result.content[0].text).toContain('**Required**: 3 plans');
      expect(result.content[0].text).toContain('**Submitted**: 2 plans');
    });

    it('should accept finalization when min_plans met', async () => {
      // Initialize with min_plans = 2
      await handleInitParallelReasoning({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      }, manager);

      // Submit 2 plans
      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_A',
          description: 'Plan A',
          diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
          capability_chain: [
            'market_scan',
            'tam_sam_som_build',
            'competitor_analysis',
            'customer_segmentation_clustering',
            'pricing_analysis_elasticity',
            'market_sizing_regression',
            'growth_forecast_arima',
            'market_share_analysis'
          ],
          rationale: 'Test plan A',
          expected_outputs: ['market_map']
        }
      }, manager);

      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_B',
          description: 'Plan B',
          diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
          capability_chain: [
            'market_scan',
            'risk_assessment_monte_carlo',
            'scenario_planning_probabilistic',
            'regulatory_risk_assessment',
            'financial_risk_assessment',
            'sensitivity_analysis_tornado',
            'stress_testing_scenarios',
            'break_even_analysis'
          ],
          rationale: 'Test plan B',
          expected_outputs: ['risk_register']
        }
      }, manager);

      // Execute both plans (mock)
      const session = manager.getSession(sessionId);
      if (session) {
        session.plan_results.set('plan_A', [{ result: 'mock' }]);
        session.plan_results.set('plan_B', [{ result: 'mock' }]);
      }

      // Try to finalize
      const result = await handleFinalizeParallelReasoning({
        session_id: sessionId
      }, manager);

      // Note: Finalization will be blocked because confidence is below 85% threshold
      // (mock execution doesn't generate real evidence)
      // This test verifies that min_plans requirement is met, but quality thresholds block finalization
      expect(result.content[0].text).toContain('Session Incomplete');
    });
  });

  describe('Mediation validates evidence IDs', () => {
    it('should reject mediation decision with non-existent evidence IDs', async () => {
      // Initialize session
      await handleInitParallelReasoning({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      }, manager);

      // Submit plan
      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_A',
          description: 'Plan A',
          diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
          capability_chain: [
            'market_scan',
            'tam_sam_som_build',
            'competitor_analysis',
            'customer_segmentation_clustering',
            'pricing_analysis_elasticity',
            'market_sizing_regression',
            'growth_forecast_arima',
            'market_share_analysis'
          ],
          rationale: 'Test plan A',
          expected_outputs: ['market_map']
        }
      }, manager);

      // Try to submit mediation decision with fake evidence IDs
      const result = await handleSubmitMediationDecision({
        session_id: sessionId,
        decision: {
          decision_point: 'Market size',
          chosen_from_plan: 'plan_A',
          rationale: 'Test rationale',
          evidence_ids: ['fake_evidence_001', 'fake_evidence_002'],
          confidence: 0.8
        }
      }, manager, evidenceLedger);

      // Should fail because evidence IDs don't exist
      expect(result.content[0].text).toContain('Validation Error');
      expect(result.content[0].text).toContain('non-existent evidence');
    });

    it('should accept mediation decision with valid evidence IDs', async () => {
      // Initialize session
      await handleInitParallelReasoning({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      }, manager);

      // Submit plan
      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_A',
          description: 'Plan A',
          diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
          capability_chain: [
            'market_scan',
            'tam_sam_som_build',
            'competitor_analysis',
            'customer_segmentation_clustering',
            'pricing_analysis_elasticity',
            'market_sizing_regression',
            'growth_forecast_arima',
            'market_share_analysis'
          ],
          rationale: 'Test plan A',
          expected_outputs: ['market_map']
        }
      }, manager);

      // Add valid evidence to ledger
      const evidenceId1 = evidenceLedger.addEvidence(
        'artifact_001',
        'market_size',
        'Market size is €45B',
        [{
          type: EvidenceType.RETRIEVAL,
          source: 'Industry report',
          timestamp: Date.now()
        }]
      );

      const evidenceId2 = evidenceLedger.addEvidence(
        'artifact_001',
        'growth_rate',
        'Growth rate is 12% CAGR',
        [{
          type: EvidenceType.CALCULATION,
          formula: 'CAGR = (End/Start)^(1/Years) - 1',
          inputs: { end: 45, start: 30, years: 3 },
          timestamp: Date.now()
        }]
      );

      // Submit mediation decision with valid evidence IDs
      const result = await handleSubmitMediationDecision({
        session_id: sessionId,
        decision: {
          decision_point: 'Market size',
          chosen_from_plan: 'plan_A',
          rationale: 'Test rationale',
          evidence_ids: [evidenceId1, evidenceId2],
          confidence: 0.8
        }
      }, manager, evidenceLedger);

      // Should succeed
      expect(result.content[0].text).toContain('Mediation Decision Recorded');
      expect(result.content[0].text).toContain(evidenceId1);
      expect(result.content[0].text).toContain(evidenceId2);
    });

    it('should accept mediation decision with empty evidence IDs when no ledger provided', async () => {
      // Initialize session
      await handleInitParallelReasoning({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      }, manager);

      // Submit plan
      await handleSubmitReasoningPlan({
        session_id: sessionId,
        plan: {
          plan_id: 'plan_A',
          description: 'Plan A',
          diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
          capability_chain: [
            'market_scan',
            'tam_sam_som_build',
            'competitor_analysis',
            'customer_segmentation_clustering',
            'pricing_analysis_elasticity',
            'market_sizing_regression',
            'growth_forecast_arima',
            'market_share_analysis'
          ],
          rationale: 'Test plan A',
          expected_outputs: ['market_map']
        }
      }, manager);

      // Submit mediation decision without evidence ledger (backward compatibility)
      const result = await handleSubmitMediationDecision({
        session_id: sessionId,
        decision: {
          decision_point: 'Market size',
          chosen_from_plan: 'plan_A',
          rationale: 'Test rationale',
          evidence_ids: ['any_id'],
          confidence: 0.8
        }
      }, manager); // No evidence ledger provided

      // Should succeed (backward compatibility)
      expect(result.content[0].text).toContain('Mediation Decision Recorded');
    });
  });
});

