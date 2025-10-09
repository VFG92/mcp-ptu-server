/**
 * Meta-Reflection Tool Tests
 * 
 * Tests the generate_meta_reflection tool that analyzes patterns in disagreements,
 * identifies residual uncertainty, and suggests further analysis.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import { handleGenerateMetaReflection } from '../src/workers/parallel-reasoning-tools-v5.js';

const setupPlans = (mgr: ParallelReasoningSessionManager, sid: string) => {
  const result1 = mgr.submitPlan(sid, {
    plan_id: 'plan_A',
    description: 'Data-driven analysis',
    diversity_axes: ['data_sources', 'analytical_models', 'quantitative_data', 'statistical_models'],
    capability_chain: ['market_scan', 'competitor_analysis'],
    rationale: 'Focus on hard data',
    expected_outputs: ['Market size estimate']
  });
  if (!result1.accepted) throw new Error(`Plan A rejected: ${result1.reason}`);

  const result2 = mgr.submitPlan(sid, {
    plan_id: 'plan_B',
    description: 'Qualitative analysis',
    diversity_axes: ['data_sources', 'analytical_models', 'expert_interviews', 'case_studies'],
    capability_chain: ['stakeholder_mapping', 'risk_assessment'],
    rationale: 'Focus on insights',
    expected_outputs: ['Risk assessment']
  });
  if (!result2.accepted) throw new Error(`Plan B rejected: ${result2.reason}`);

  const result3 = mgr.submitPlan(sid, {
    plan_id: 'plan_C',
    description: 'Risk-focused analysis',
    diversity_axes: ['data_sources', 'analytical_models', 'scenario_planning', 'monte_carlo_simulation'],
    capability_chain: ['risk_assessment', 'sensitivity_analysis'],
    rationale: 'Focus on uncertainty',
    expected_outputs: ['Risk matrix']
  });
  if (!result3.accepted) throw new Error(`Plan C rejected: ${result3.reason}`);
};

describe('Meta-Reflection Tool', () => {
  let manager: ParallelReasoningSessionManager;
  let sessionId: string;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
    sessionId = `test_meta_${Date.now()}`;

    // Initialize session
    manager.initSession({
      session_id: sessionId,
      task_description: 'Analyze market opportunity for new product',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });

    // Submit plans with diverse axes
    setupPlans(manager, sessionId);
  });

  it('should warn when no mediation decisions exist', async () => {
    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('No mediation decisions yet');
    expect(result.content[0].text).toContain('submit_mediation_decision');
  });

  it('should analyze mediation decision patterns', async () => {
    // Add mediation decisions
    manager.submitMediationDecision(sessionId, {
      decision_point: 'Market size estimation',
      chosen_from_plan: 'plan_A',
      rationale: 'More rigorous methodology',
      evidence_ids: ['ev1', 'ev2'],
      confidence: 0.85
    });

    manager.submitMediationDecision(sessionId, {
      decision_point: 'Risk assessment',
      chosen_from_plan: 'plan_B',
      rationale: 'Better stakeholder coverage',
      evidence_ids: ['ev3'],
      confidence: 0.75
    });

    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toMatch(/Total Decisions.*2/);
    expect(result.content[0].text).toContain('Decision Distribution');
    expect(result.content[0].text).toContain('plan_A');
    expect(result.content[0].text).toContain('plan_B');
  });

  it('should identify low confidence decisions', async () => {
    // Add low confidence decision
    manager.submitMediationDecision(sessionId, {
      decision_point: 'Growth rate projection',
      chosen_from_plan: 'plan_A',
      rationale: 'Uncertain data quality',
      evidence_ids: ['ev1'],
      confidence: 0.55
    });

    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('Low Confidence Decisions');
    expect(result.content[0].text).toContain('55.0% confidence');
    expect(result.content[0].text).toContain('Growth rate projection');
  });

  it('should analyze disagreement patterns from peer critiques', async () => {
    // Add peer critiques
    manager.submitPeerCritique(sessionId, {
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data source is outdated',
          falsification_test: 'Check latest industry reports'
        }
      ],
      residual_risks: ['Data quality risk'],
      agreement_score: 0.4,
      timestamp: Date.now()
    });

    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('Disagreement Pattern Analysis');
    expect(result.content[0].text).toMatch(/Total Critiques.*1/);
    expect(result.content[0].text).toContain('Disagreements');
  });

  it('should identify most challenged claims', async () => {
    // Add multiple critiques challenging same claim
    manager.submitPeerCritique(sessionId, {
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data source is outdated'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    });

    manager.submitPeerCritique(sessionId, {
      reviewer_plan_id: 'plan_B',
      reviewed_plan_id: 'plan_A',
      claims_challenged: [
        {
          claim: 'Market size is $10B based on 2023 data',
          evidence_ids: ['ev2'],
          challenge: 'Methodology is flawed'
        }
      ],
      residual_risks: [],
      agreement_score: 0.3,
      timestamp: Date.now()
    });

    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('Most Challenged Claims');
    expect(result.content[0].text).toContain('Market size');
  });

  it('should identify residual risks', async () => {
    manager.submitPeerCritique(sessionId, {
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [],
      residual_risks: [
        'Data quality risk',
        'Methodology risk',
        'Temporal validity risk'
      ],
      agreement_score: 0.6,
      timestamp: Date.now()
    });

    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('Residual Uncertainty & Risks');
    expect(result.content[0].text).toMatch(/Total Unique Risks Identified.*3/);
    expect(result.content[0].text).toContain('Data quality risk');
  });

  it('should recommend re-examining low confidence decisions', async () => {
    // Create new session with plans for this test
    const testSessionId = `test_meta_${Date.now()}`;
    manager.initSession({
      session_id: testSessionId,
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });
    setupPlans(manager, testSessionId);

    manager.submitMediationDecision(testSessionId, {
      decision_point: 'Market size',
      chosen_from_plan: 'plan_A',
      rationale: 'Uncertain',
      evidence_ids: ['ev1'],
      confidence: 0.6
    });

    const result = await handleGenerateMetaReflection({ session_id: testSessionId }, manager);

    expect(result.content[0].text).toContain('Recommendations for Further Analysis');
    expect(result.content[0].text).toContain('Re-examine');
    expect(result.content[0].text).toContain('low-confidence decisions');
  });

  it('should detect decision imbalance', async () => {
    // Create new session with plans for this test
    const testSessionId = `test_meta_${Date.now()}`;
    manager.initSession({
      session_id: testSessionId,
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });
    setupPlans(manager, testSessionId);

    // Add many decisions favoring one plan
    for (let i = 0; i < 5; i++) {
      manager.submitMediationDecision(testSessionId, {
        decision_point: `Decision ${i}`,
        chosen_from_plan: 'plan_A',
        rationale: 'Better',
        evidence_ids: ['ev1'],
        confidence: 0.8
      });
    }

    manager.submitMediationDecision(testSessionId, {
      decision_point: 'Decision 6',
      chosen_from_plan: 'plan_B',
      rationale: 'Good',
      evidence_ids: ['ev2'],
      confidence: 0.8
    });

    const result = await handleGenerateMetaReflection({ session_id: testSessionId }, manager);

    expect(result.content[0].text).toContain('decision imbalance');
  });

  it('should recommend adding falsification tests', async () => {
    // Create new session with plans for this test
    const testSessionId = `test_meta_${Date.now()}`;
    manager.initSession({
      session_id: testSessionId,
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });
    setupPlans(manager, testSessionId);

    manager.submitPeerCritique(testSessionId, {
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market is growing',
          evidence_ids: ['ev1'],
          challenge: 'No evidence'
          // No falsification_test
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    });

    const result = await handleGenerateMetaReflection({ session_id: testSessionId }, manager);

    expect(result.content[0].text).toContain('Add falsification tests');
  });

  it('should provide next steps', async () => {
    const result = await handleGenerateMetaReflection({ session_id: sessionId }, manager);

    expect(result.content[0].text).toContain('Next Steps');
  });
});

