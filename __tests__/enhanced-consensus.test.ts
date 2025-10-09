/**
 * Enhanced Consensus Metrics Tests
 * 
 * Tests that the consensus calculation rewards constructive disagreement
 * instead of penalizing it.
 */

import { describe, it, expect } from '@jest/globals';
import { calculateConsensus } from '../src/workers/session-metrics.js';
import type { ParallelReasoningSession } from '../src/workers/parallel-reasoning-mcp.js';

describe('Enhanced Consensus Metrics', () => {
  const createMockSession = (critiques: any[]): ParallelReasoningSession => ({
    session_id: 'test_session',
    task_description: 'Test task',
    required_diversity_axes: ['data_sources', 'analytical_models'],
    min_plans: 3,
    plans: new Map(),
    rejected_plans: new Map(),
    plan_results: new Map(),
    cross_plan_notes: [],
    peer_critiques: critiques,
    mediation_decisions: [],
    status: 'peer_review',
    created_at: Date.now(),
    updated_at: Date.now()
  });

  it('should reward well-argued disagreement over shallow agreement', () => {
    // Shallow agreement (high score but no substance)
    const shallowAgreement = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [],
      residual_risks: [],
      agreement_score: 0.9,
      timestamp: Date.now()
    }]);

    // Well-argued disagreement (low score but rich argumentation)
    const deepDisagreement = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1', 'ev2'],
          challenge: 'Data sources are outdated',
          falsification_test: 'Check latest industry reports from 2024'
        },
        {
          claim: 'Growth rate is 20%',
          evidence_ids: ['ev3'],
          challenge: 'Methodology is flawed',
          falsification_test: 'Compare with historical data'
        }
      ],
      residual_risks: ['Data quality risk', 'Methodology risk'],
      agreement_score: 0.3,
      timestamp: Date.now()
    }]);

    const shallowResult = calculateConsensus(shallowAgreement);
    const deepResult = calculateConsensus(deepDisagreement);

    // Deep disagreement should score higher than shallow agreement
    expect(deepResult.score).toBeGreaterThan(shallowResult.score);
  });

  it('should give bonus for falsification tests', () => {
    const withoutFalsification = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data is questionable'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withFalsification = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data is questionable',
          falsification_test: 'Cross-check with 3 independent sources'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withoutResult = calculateConsensus(withoutFalsification);
    const withResult = calculateConsensus(withFalsification);

    expect(withResult.score).toBeGreaterThan(withoutResult.score);
  });

  it('should reward evidence-backed challenges', () => {
    const withoutEvidence = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: [],
          challenge: 'I disagree'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withEvidence = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1', 'ev2', 'ev3'],
          challenge: 'Alternative sources show $8B'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withoutResult = calculateConsensus(withoutEvidence);
    const withResult = calculateConsensus(withEvidence);

    expect(withResult.score).toBeGreaterThan(withoutResult.score);
  });

  it('should reward residual risk identification', () => {
    const withoutRisks = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data quality issues'
        }
      ],
      residual_risks: [],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withRisks = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Market size is $10B',
          evidence_ids: ['ev1'],
          challenge: 'Data quality issues'
        }
      ],
      residual_risks: [
        'Data source reliability risk',
        'Temporal validity risk',
        'Geographic coverage risk'
      ],
      agreement_score: 0.4,
      timestamp: Date.now()
    }]);

    const withoutResult = calculateConsensus(withoutRisks);
    const withResult = calculateConsensus(withRisks);

    expect(withResult.score).toBeGreaterThan(withoutResult.score);
  });

  it('should handle high-quality agreement appropriately', () => {
    const highQualityAgreement = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Analysis is thorough',
          evidence_ids: ['ev1', 'ev2'],
          challenge: 'Minor methodology concern'
        }
      ],
      residual_risks: ['Edge case not covered'],
      agreement_score: 0.85,
      timestamp: Date.now()
    }]);

    const result = calculateConsensus(highQualityAgreement);

    // High-quality agreement should score well
    expect(result.score).toBeGreaterThan(0.85);
    expect(result.details.agreements).toBe(1);
  });

  it('should return neutral score when no critiques exist', () => {
    const noCritiques = createMockSession([]);

    const result = calculateConsensus(noCritiques);

    expect(result.score).toBe(0.5);
    expect(result.details.agreements).toBe(0);
    expect(result.details.conflicts).toBe(0);
  });

  it('should handle multiple critiques with mixed quality', () => {
    const mixedCritiques = createMockSession([
      {
        reviewer_plan_id: 'plan_A',
        reviewed_plan_id: 'plan_B',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.9,
        timestamp: Date.now()
      },
      {
        reviewer_plan_id: 'plan_B',
        reviewed_plan_id: 'plan_C',
        claims_challenged: [
          {
            claim: 'Assumption X is valid',
            evidence_ids: ['ev1', 'ev2'],
            challenge: 'Counter-evidence suggests otherwise',
            falsification_test: 'Run sensitivity analysis'
          }
        ],
        residual_risks: ['Model risk', 'Data risk'],
        agreement_score: 0.3,
        timestamp: Date.now()
      },
      {
        reviewer_plan_id: 'plan_C',
        reviewed_plan_id: 'plan_A',
        claims_challenged: [
          {
            claim: 'Conclusion Y follows',
            evidence_ids: ['ev3'],
            challenge: 'Logic gap identified'
          }
        ],
        residual_risks: [],
        agreement_score: 0.5,
        timestamp: Date.now()
      }
    ]);

    const result = calculateConsensus(mixedCritiques);

    // Should average the quality across all critiques
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.score).toBeLessThan(1.0);
    expect(result.details.total_interactions).toBe(3);
  });

  it('should give diversity bonus for having both notes and critiques', () => {
    const onlyCritiques = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [],
      residual_risks: [],
      agreement_score: 0.8,
      timestamp: Date.now()
    }]);

    const withNotes: ParallelReasoningSession = {
      ...onlyCritiques,
      cross_plan_notes: [{
        from_plan_id: 'plan_A',
        to_plan_id: 'plan_B',
        note: 'Consider this alternative approach',
        references: ['ref1'],
        timestamp: Date.now()
      }]
    };

    const onlyCritiquesResult = calculateConsensus(onlyCritiques);
    const withNotesResult = calculateConsensus(withNotes);

    // Should get small diversity bonus
    expect(withNotesResult.score).toBeGreaterThan(onlyCritiquesResult.score);
  });

  it('should cap score at 1.0 even with maximum bonuses', () => {
    const maxQuality = createMockSession([{
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        {
          claim: 'Claim 1',
          evidence_ids: ['ev1', 'ev2', 'ev3'],
          challenge: 'Challenge 1',
          falsification_test: 'Test 1'
        },
        {
          claim: 'Claim 2',
          evidence_ids: ['ev4', 'ev5'],
          challenge: 'Challenge 2',
          falsification_test: 'Test 2'
        }
      ],
      residual_risks: ['Risk 1', 'Risk 2', 'Risk 3'],
      agreement_score: 0.95,
      timestamp: Date.now()
    }]);

    const result = calculateConsensus(maxQuality);

    expect(result.score).toBeLessThanOrEqual(1.0);
  });
});

