import { describe, it, expect } from '@jest/globals';

import {
  getAdapter,
  getAllAdapters,
  applyAdapterWeights,
  getRecommendedCapabilities,
  strategyAdapter
} from '../src/workers/capability-adapters.js';
import { z } from 'zod';
import { CapabilityGraph } from '../src/workers/capability-graph.js';

describe('capability adapters', () => {
  it('resolves adapters via IDs and aliases', () => {
    expect(getAdapter('strategy')).toBeDefined();
    expect(getAdapter('strategy_consultant')).toBe(getAdapter('strategy'));
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('lists all available adapters', () => {
    const adapters = getAllAdapters();
    expect(adapters.length).toBeGreaterThan(0);
    expect(adapters.some(adapter => adapter.id === 'finance')).toBe(true);
  });

  it('applies adapter weights preserving ordering', () => {
    const entries = applyAdapterWeights(['market_scan', 'risk_register_build'], strategyAdapter);
    expect(entries[0].capability_id).toBe('market_scan');
    expect(entries.find(entry => entry.capability_id === 'risk_register_build')?.weight).toBe(0.6);
  });

  it('recommends capabilities combining defaults, weights, and categories', () => {
    const graph = new CapabilityGraph();
    graph.register({
      id: 'placeholder_capability',
      name: 'Placeholder Capability',
      description: 'Used for testing category fill',
      category: 'strategic',
      preconditions: { required_inputs: [] },
      output_contract: {
        schema: z.object({}),
        required_evidence: [],
        quality_checks: []
      },
      cost_estimate: {
        expected_tokens_in: 100,
        expected_tokens_out: 200,
        cpu_ms: 50,
        subrequests: 1
      },
      expected_precision: 0.7,
      async execute() {
        return {
          capability_id: 'placeholder_capability',
          output: {},
          evidence: {},
          confidence: 0.7,
          cost_actual: {
            expected_tokens_in: 100,
            expected_tokens_out: 200,
            cpu_ms: 50,
            subrequests: 1
          },
          quality_score: 0.7,
          warnings: [],
          metadata: { execution_time_ms: 0, timestamp: Date.now(), version: '1.0.0' }
        };
      },
      version: '1.0.0',
      tags: ['test']
    });

    const recommended = getRecommendedCapabilities(strategyAdapter, graph, 5);
    expect(recommended).toContain('market_scan');
    expect(recommended.length).toBeGreaterThan(0);
  });
});
