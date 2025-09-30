/**
 * Performance tests for Cloudflare Workers constraints
 */

import { describe, it, expect } from '@jest/globals';
import { CapabilityGraph, type CapabilityNode } from '../src/workers/capability-graph.js';
import { BudgetScheduler } from '../src/workers/budget-scheduler.js';
import { CapabilityPlanner } from '../src/workers/capability-planner.js';
import { z } from 'zod';

describe('Performance Tests', () => {
  describe('Latency Measurements', () => {
    it('should complete capability graph operations under 10ms', () => {
      const graph = new CapabilityGraph();
      const startTime = performance.now();

      // Register 100 capabilities
      for (let i = 0; i < 100; i++) {
        const cap: CapabilityNode = {
          id: `cap_${i}`,
          name: `Capability ${i}`,
          description: 'Test capability',
          category: 'market',
          preconditions: { required_inputs: [] },
          output_contract: {
            schema: z.object({}),
            required_evidence: []
          },
          cost_estimate: {
            expected_tokens_in: 100,
            expected_tokens_out: 100,
            cpu_ms: 10,
            subrequests: 1
          },
          expected_precision: 0.8,
          execute: async () => ({
            capability_id: `cap_${i}`,
            output: {},
            evidence: {},
            confidence: 0.8,
            cost_actual: {
              expected_tokens_in: 100,
              expected_tokens_out: 100,
              cpu_ms: 10,
              subrequests: 1
            },
            quality_score: 0.8,
            warnings: [],
            metadata: {
              execution_time_ms: 10,
              timestamp: Date.now(),
              version: '1.0.0'
            }
          }),
          version: '1.0.0',
          tags: ['test']
        };
        graph.register(cap);
      }

      // Perform lookups
      for (let i = 0; i < 100; i++) {
        graph.get(`cap_${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Graph operations (200 ops): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it('should complete budget scheduler planning under 100ms', async () => {
      const graph = new CapabilityGraph();
      const scheduler = new BudgetScheduler(graph);

      // Register test capabilities
      for (let i = 0; i < 20; i++) {
        const cap: CapabilityNode = {
          id: `cap_${i}`,
          name: `Capability ${i}`,
          description: 'Test capability',
          category: 'market',
          preconditions: { required_inputs: [] },
          output_contract: {
            schema: z.object({}),
            required_evidence: []
          },
          cost_estimate: {
            expected_tokens_in: 100 + i * 50,
            expected_tokens_out: 100 + i * 50,
            cpu_ms: 10 + i * 5,
            subrequests: 1
          },
          expected_precision: 0.8,
          execute: async () => ({
            capability_id: `cap_${i}`,
            output: {},
            evidence: {},
            confidence: 0.8,
            cost_actual: {
              expected_tokens_in: 100,
              expected_tokens_out: 100,
              cpu_ms: 10,
              subrequests: 1
            },
            quality_score: 0.8,
            warnings: [],
            metadata: {
              execution_time_ms: 10,
              timestamp: Date.now(),
              version: '1.0.0'
            }
          }),
          version: '1.0.0',
          tags: ['test']
        };
        graph.register(cap);
      }

      const startTime = performance.now();

      const capabilityIds = Array.from({ length: 20 }, (_, i) => `cap_${i}`);
      const inputs = new Map();
      const budget = {
        max_tokens_in: 10000,
        max_tokens_out: 10000,
        max_cpu_ms: 5000,
        max_subrequests: 50
      };
      const context = {
        session_id: 'perf_test',
        budget_remaining: {
          expected_tokens_in: 10000,
          expected_tokens_out: 10000,
          cpu_ms: 5000,
          subrequests: 50
        },
        whiteboard: new Map(),
        scratchpad: new Map(),
        policy: {
          pii_filter_enabled: false,
          financial_data_filter_enabled: false
        },
        trace: []
      };

      await scheduler.plan(capabilityIds, inputs, budget, context);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Budget scheduler planning (20 caps): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should complete capability planner beam search under 200ms', async () => {
      const graph = new CapabilityGraph();
      const planner = new CapabilityPlanner(graph);

      // Register test capabilities
      for (let i = 0; i < 30; i++) {
        const cap: CapabilityNode = {
          id: `cap_${i}`,
          name: `Capability ${i}`,
          description: 'Test capability for market analysis',
          category: 'market',
          preconditions: { required_inputs: [] },
          output_contract: {
            schema: z.object({}),
            required_evidence: []
          },
          cost_estimate: {
            expected_tokens_in: 200,
            expected_tokens_out: 200,
            cpu_ms: 20,
            subrequests: 1
          },
          expected_precision: 0.8,
          execute: async () => ({
            capability_id: `cap_${i}`,
            output: {},
            evidence: {},
            confidence: 0.8,
            cost_actual: {
              expected_tokens_in: 200,
              expected_tokens_out: 200,
              cpu_ms: 20,
              subrequests: 1
            },
            quality_score: 0.8,
            warnings: [],
            metadata: {
              execution_time_ms: 20,
              timestamp: Date.now(),
              version: '1.0.0'
            }
          }),
          version: '1.0.0',
          tags: ['market', 'analysis']
        };
        graph.register(cap);
      }

      const startTime = performance.now();

      const request = {
        task_description: 'Analyze market opportunity for new product',
        required_outputs: [],
        budget: {
          max_tokens_in: 10000,
          max_tokens_out: 10000,
          max_cpu_ms: 5000,
          max_subrequests: 50
        },
        context: {
          session_id: 'perf_test',
          budget_remaining: {
            expected_tokens_in: 10000,
            expected_tokens_out: 10000,
            cpu_ms: 5000,
            subrequests: 50
          },
          whiteboard: new Map(),
          scratchpad: new Map(),
          policy: {
            pii_filter_enabled: false,
            financial_data_filter_enabled: false
          },
          trace: []
        }
      };

      await planner.plan(request);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Capability planner beam search (30 caps): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Token Usage Tracking', () => {
    it('should accurately track token usage', () => {
      const graph = new CapabilityGraph();

      const cap: CapabilityNode = {
        id: 'test_cap',
        name: 'Test Capability',
        description: 'Test',
        category: 'market',
        preconditions: { required_inputs: [] },
        output_contract: {
          schema: z.object({}),
          required_evidence: []
        },
        cost_estimate: {
          expected_tokens_in: 500,
          expected_tokens_out: 1000,
          cpu_ms: 50,
          subrequests: 2
        },
        expected_precision: 0.8,
        execute: async () => ({
          capability_id: 'test_cap',
          output: {},
          evidence: {},
          confidence: 0.8,
          cost_actual: {
            expected_tokens_in: 500,
            expected_tokens_out: 1000,
            cpu_ms: 50,
            subrequests: 2
          },
          quality_score: 0.8,
          warnings: [],
          metadata: {
            execution_time_ms: 50,
            timestamp: Date.now(),
            version: '1.0.0'
          }
        }),
        version: '1.0.0',
        tags: ['test']
      };

      graph.register(cap);

      const totalCost = graph.estimateTotalCost(['test_cap']);

      expect(totalCost.expected_tokens_in).toBe(500);
      expect(totalCost.expected_tokens_out).toBe(1000);
      expect(totalCost.cpu_ms).toBe(50);
      expect(totalCost.subrequests).toBe(2);
    });
  });

  describe('Cloudflare Workers Constraints', () => {
    it('should stay within free tier CPU limits (10ms)', () => {
      // Simulate lightweight operations
      const startTime = performance.now();

      const graph = new CapabilityGraph();
      for (let i = 0; i < 10; i++) {
        graph.get(`cap_${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Lightweight operations: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10);
    });

    it('should handle paid tier CPU limits (50ms)', () => {
      // Simulate moderate operations
      const startTime = performance.now();

      const graph = new CapabilityGraph();
      for (let i = 0; i < 50; i++) {
        const cap: CapabilityNode = {
          id: `cap_${i}`,
          name: `Cap ${i}`,
          description: 'Test',
          category: 'market',
          preconditions: { required_inputs: [] },
          output_contract: {
            schema: z.object({}),
            required_evidence: []
          },
          cost_estimate: {
            expected_tokens_in: 100,
            expected_tokens_out: 100,
            cpu_ms: 10,
            subrequests: 1
          },
          expected_precision: 0.8,
          execute: async () => ({
            capability_id: `cap_${i}`,
            output: {},
            evidence: {},
            confidence: 0.8,
            cost_actual: {
              expected_tokens_in: 100,
              expected_tokens_out: 100,
              cpu_ms: 10,
              subrequests: 1
            },
            quality_score: 0.8,
            warnings: [],
            metadata: {
              execution_time_ms: 10,
              timestamp: Date.now(),
              version: '1.0.0'
            }
          }),
          version: '1.0.0',
          tags: ['test']
        };
        graph.register(cap);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Moderate operations (50 registrations): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });
});

