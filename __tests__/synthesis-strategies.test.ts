import { describe, it, expect } from '@jest/globals';

import {
  consensusSynthesis,
  weightedSynthesis,
  dialecticSynthesis,
  bestOfNSynthesis,
  ensembleSynthesis,
  synthesizeResults,
  detectConflicts,
  calculateConsensusScore
} from '../src/workers/synthesis-strategies.js';

const agents = [
  {
    agent_id: 'agent_strategy',
    role: 'Strategy Advisor',
    reasoning: 'Focus on enterprise expansion with premium tiers.',
    confidence: 0.85,
    key_points: ['enterprise expansion', 'premium features'],
    concerns: ['long sales cycle'],
    recommendations: ['Invest in account-based marketing']
  },
  {
    agent_id: 'agent_finance',
    role: 'Finance Advisor',
    reasoning: 'Maintain healthy gross margin while scaling.',
    confidence: 0.78,
    key_points: ['gross margin', 'unit economics'],
    concerns: ['budget constraints'],
    recommendations: ['Tighten CAC targets']
  },
  {
    agent_id: 'agent_risk',
    role: 'Risk Advisor',
    reasoning: 'Ensure regulatory compliance in new markets.',
    confidence: 0.7,
    key_points: ['compliance readiness', 'regional regulations'],
    concerns: ['regulatory delays'],
    recommendations: ['Create compliance task force']
  }
];

describe('synthesis strategies', () => {
  it('constructs consensus synthesis from overlapping insights', () => {
    const result = consensusSynthesis(agents);
    expect(result.strategy_used).toBe('consensus');
    expect(result.final_answer).toContain('Consensus');
    expect(result.agent_contributions.agent_strategy.weight).toBeGreaterThan(0);
  });

  it('weights high confidence agents more heavily', () => {
    const result = weightedSynthesis(agents);
    expect(result.strategy_used).toBe('weighted');
    expect(result.agent_contributions.agent_strategy.weight).toBeGreaterThan(result.agent_contributions.agent_risk.weight);
  });

  it('captures conflicts via dialectic approach', () => {
    const result = dialecticSynthesis(agents);
    expect(result.strategy_used).toBe('dialectic');
    expect(result.conflicts_resolved?.length).toBeGreaterThan(0);
    expect(result.consensus_level).toBeLessThan(1);
  });

  it('selects the best agent result in best-of-n strategy', () => {
    const result = bestOfNSynthesis(agents);
    expect(result.strategy_used).toBe('best_of_n');
    expect(result.final_answer).toContain('Strategy Advisor');
    expect(result.agent_contributions.agent_strategy.weight).toBe(1);
  });

  it('combines all insights in ensemble strategy', () => {
    const result = ensembleSynthesis(agents);
    expect(result.strategy_used).toBe('ensemble');
    expect(result.final_answer).toContain('Ensemble of');
    expect(Object.keys(result.agent_contributions).length).toBe(agents.length);
  });

  it('routes through main synthesizeResults switch', () => {
    const result = synthesizeResults(agents, 'dialectic');
    expect(result.strategy_used).toBe('dialectic');
  });

  it('detects conflicts and calculates consensus score', () => {
    const conflicts = detectConflicts(agents);
    expect(Array.isArray(conflicts)).toBe(true);

    const consensus = calculateConsensusScore(agents);
    expect(consensus).toBeGreaterThanOrEqual(0);
    expect(consensus).toBeLessThanOrEqual(1);
  });
});
