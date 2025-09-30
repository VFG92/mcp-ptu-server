/**
 * Unit tests for Capability Graph
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CapabilityGraph, type CapabilityNode, type ExecutionContext } from '../src/workers/capability-graph.js';
import { z } from 'zod';

describe('CapabilityGraph', () => {
  let graph: CapabilityGraph;
  let mockCapability: CapabilityNode;

  beforeEach(() => {
    graph = new CapabilityGraph();

    mockCapability = {
      id: 'test_capability',
      name: 'Test Capability',
      description: 'A test capability',
      category: 'market',
      preconditions: {
        required_inputs: ['input1'],
        required_artifacts: [],
        budget_required: {
          expected_tokens_in: 100,
          expected_tokens_out: 100,
          cpu_ms: 50,
          subrequests: 1
        }
      },
      output_contract: {
        schema: z.object({ field1: z.string() }),
        required_evidence: ['field1'],
        quality_checks: []
      },
      cost_estimate: {
        expected_tokens_in: 200,
        expected_tokens_out: 300,
        cpu_ms: 100,
        subrequests: 2
      },
      expected_precision: 0.85,
      execute: async (inputs: any, context: ExecutionContext) => {
        return {
          capability_id: 'test_capability',
          output: { field1: 'value1' },
          evidence: {},
          confidence: 0.85,
          cost_actual: mockCapability.cost_estimate,
          quality_score: 0.9,
          warnings: [],
          metadata: {
            execution_time_ms: 100,
            timestamp: Date.now(),
            version: '1.0.0'
          }
        };
      },
      version: '1.0.0',
      tags: ['test']
    };
  });

  describe('register', () => {
    it('should register a capability', () => {
      graph.register(mockCapability);
      const retrieved = graph.get('test_capability');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test_capability');
    });

    it('should allow registering multiple capabilities', () => {
      const cap2: CapabilityNode = { ...mockCapability, id: 'test_capability_2' };
      graph.register(mockCapability);
      graph.register(cap2);
      
      expect(graph.size()).toBe(2);
    });
  });

  describe('get', () => {
    it('should retrieve a registered capability', () => {
      graph.register(mockCapability);
      const retrieved = graph.get('test_capability');
      expect(retrieved).toEqual(mockCapability);
    });

    it('should return undefined for non-existent capability', () => {
      const retrieved = graph.get('non_existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getByCategory', () => {
    it('should find capabilities by category', () => {
      const marketCap: CapabilityNode = { ...mockCapability, id: 'market_cap', category: 'market' };
      const financialCap: CapabilityNode = { ...mockCapability, id: 'financial_cap', category: 'financial' };

      graph.register(marketCap);
      graph.register(financialCap);

      const marketCaps = graph.getByCategory('market');
      expect(marketCaps).toHaveLength(1);
      expect(marketCaps[0].id).toBe('market_cap');
    });

    it('should return empty array for category with no capabilities', () => {
      const caps = graph.getByCategory('strategic');
      expect(caps).toEqual([]);
    });
  });

  describe('getByTag', () => {
    it('should find capabilities by tag', () => {
      const cap1: CapabilityNode = { ...mockCapability, id: 'cap1', tags: ['tag1', 'tag2'] };
      const cap2: CapabilityNode = { ...mockCapability, id: 'cap2', tags: ['tag2', 'tag3'] };
      const cap3: CapabilityNode = { ...mockCapability, id: 'cap3', tags: ['tag3'] };

      graph.register(cap1);
      graph.register(cap2);
      graph.register(cap3);

      const capsWithTag2 = graph.getByTag('tag2');
      expect(capsWithTag2).toHaveLength(2);
      expect(capsWithTag2.map((c: CapabilityNode) => c.id).sort()).toEqual(['cap1', 'cap2']);
    });
  });

  describe('checkPreconditions', () => {
    it('should pass when all preconditions are met', () => {
      const inputs = { input1: 'value1' };
      const context: ExecutionContext = {
        session_id: 'test_session',
        budget_remaining: {
          expected_tokens_in: 1000,
          expected_tokens_out: 1000,
          cpu_ms: 1000,
          subrequests: 10
        },
        whiteboard: new Map(),
        scratchpad: new Map(),
        policy: {
          pii_filter_enabled: false,
          financial_data_filter_enabled: false
        },
        trace: []
      };
      
      const result = graph.checkPreconditions(mockCapability, inputs, context);
      expect(result.met).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should fail when required inputs are missing', () => {
      const inputs = {};
      const context: ExecutionContext = {
        session_id: 'test_session',
        budget_remaining: {
          expected_tokens_in: 1000,
          expected_tokens_out: 1000,
          cpu_ms: 1000,
          subrequests: 10
        },
        whiteboard: new Map(),
        scratchpad: new Map(),
        policy: {
          pii_filter_enabled: false,
          financial_data_filter_enabled: false
        },
        trace: []
      };
      
      const result = graph.checkPreconditions(mockCapability, inputs, context);
      expect(result.met).toBe(false);
      expect(result.missing).toContain('input:input1');
    });

    it('should fail when budget is insufficient', () => {
      const inputs = { input1: 'value1' };
      const context: ExecutionContext = {
        session_id: 'test_session',
        budget_remaining: {
          expected_tokens_in: 50,  // Less than required
          expected_tokens_out: 50,
          cpu_ms: 25,
          subrequests: 0
        },
        whiteboard: new Map(),
        scratchpad: new Map(),
        policy: {
          pii_filter_enabled: false,
          financial_data_filter_enabled: false
        },
        trace: []
      };
      
      const result = graph.checkPreconditions(mockCapability, inputs, context);
      expect(result.met).toBe(false);
      expect(result.missing.some(m => m.startsWith('budget:'))).toBe(true);
    });
  });

  describe('getDependencies', () => {
    it('should return dependencies for a capability with decomposition', () => {
      const capWithDeps: CapabilityNode = {
        ...mockCapability,
        id: 'parent_cap',
        decomposition: ['child_cap_1', 'child_cap_2']
      };
      
      graph.register(capWithDeps);
      const deps = graph.getDependencies('parent_cap');
      expect(deps).toEqual(['child_cap_1', 'child_cap_2']);
    });

    it('should return empty array for capability without dependencies', () => {
      graph.register(mockCapability);
      const deps = graph.getDependencies('test_capability');
      expect(deps).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return 0 for empty graph', () => {
      expect(graph.size()).toBe(0);
    });

    it('should return correct count after registrations', () => {
      graph.register(mockCapability);
      graph.register({ ...mockCapability, id: 'cap2' });
      graph.register({ ...mockCapability, id: 'cap3' });
      expect(graph.size()).toBe(3);
    });
  });

  describe('getAllIds', () => {
    it('should return all registered capability IDs', () => {
      graph.register(mockCapability);
      graph.register({ ...mockCapability, id: 'cap2' });

      const allIds = graph.getAllIds();
      expect(allIds).toHaveLength(2);
      expect(allIds.sort()).toEqual(['cap2', 'test_capability']);
    });
  });
});

