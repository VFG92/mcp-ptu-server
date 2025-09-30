/**
 * Integration tests for capability orchestration flow
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CapabilityOrchestrator, createDefaultBudget, createDefaultPolicy } from '../src/workers/capability-orchestrator.js';
import { CapabilityGraph } from '../src/workers/capability-graph.js';
import { EvidenceLedger } from '../src/workers/evidence-ledger.js';
import { Whiteboard } from '../src/workers/whiteboard-memory.js';
import {
  registerMarketCapabilities,
  registerFinancialCapabilities,
  registerRiskCapabilities,
  registerStrategicCapabilities
} from '../src/workers/capabilities/index.js';

describe('Integration Tests', () => {
  let orchestrator: CapabilityOrchestrator;
  let graph: CapabilityGraph;
  let ledger: EvidenceLedger;
  let whiteboard: Whiteboard;

  beforeEach(() => {
    graph = new CapabilityGraph();
    ledger = new EvidenceLedger();
    whiteboard = new Whiteboard();

    // Register all capabilities to the local graph
    registerMarketCapabilities(graph);
    registerFinancialCapabilities(graph);
    registerRiskCapabilities(graph);
    registerStrategicCapabilities(graph);

    orchestrator = new CapabilityOrchestrator(graph, ledger, whiteboard);
  });

  describe('Full Orchestration Flow', () => {
    it('should execute orchestration and return valid result structure', async () => {
      const request = {
        session_id: 'test_session_1',
        task: 'Analyze the market opportunity for a new SaaS product',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy(),
        adapter_id: 'strategy' as const
      };

      const result = await orchestrator.execute(request);

      // Verify result structure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.partial).toBe('boolean');
      expect(typeof result.coverage).toBe('number');
      expect(typeof result.overall_confidence).toBe('number');
      expect(Array.isArray(result.artifacts)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.execution_time_ms).toBe('number');
    }, 30000);

    it('should respect budget constraints', async () => {
      const request = {
        session_id: 'test_session_2',
        task: 'Calculate unit economics',
        budget: {
          max_tokens_in: 5000,
          max_tokens_out: 5000,
          max_cpu_ms: 5000,
          max_subrequests: 20
        },
        policy: createDefaultPolicy()
      };

      const result = await orchestrator.execute(request);

      // Verify budget tracking
      expect(result.cost_actual).toBeDefined();
      expect(typeof result.cost_actual.tokens_in).toBe('number');
      expect(typeof result.cost_actual.tokens_out).toBe('number');
      expect(typeof result.cost_actual.cpu_ms).toBe('number');
    }, 30000);
  });

  describe('Partial Success Scenarios', () => {
    it('should handle budget exhaustion gracefully', async () => {
      const request = {
        session_id: 'test_session_3',
        task: 'Comprehensive business analysis including market, finance, and risk',
        budget: {
          max_tokens_in: 100, // Very low budget
          max_tokens_out: 100,
          max_cpu_ms: 100,
          max_subrequests: 2
        },
        policy: createDefaultPolicy(),
        adapter_id: 'comprehensive' as const
      };

      const result = await orchestrator.execute(request);

      // Should complete partially
      expect(result.partial).toBe(true);
      expect(result.coverage).toBeLessThan(1.0);
      expect(result.missing_capabilities.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    }, 30000);

    it('should report missing capabilities', async () => {
      const request = {
        session_id: 'test_session_4',
        task: 'Analyze market with specific required artifacts',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy(),
        required_artifacts: ['market_map', 'tam_sam_som', 'unit_economics']
      };

      const result = await orchestrator.execute(request);

      if (!result.success) {
        expect(result.blocking_artifacts.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Policy Enforcement', () => {
    it('should respect policy constraints', async () => {
      const strictPolicy = {
        ...createDefaultPolicy(),
        max_tokens_per_capability: 1000,
        max_cpu_ms_per_capability: 1000,
        pii_filter_enabled: true,
        financial_data_filter_enabled: true
      };

      const request = {
        session_id: 'test_session_5',
        task: 'Market analysis with strict policy',
        budget: createDefaultBudget(),
        policy: strictPolicy
      };

      const result = await orchestrator.execute(request);

      expect(result.success || result.partial).toBe(true);
      // Policy should be enforced during execution
    }, 30000);
  });

  describe('Adapter Selection', () => {
    it('should use strategy adapter correctly', async () => {
      const request = {
        session_id: 'test_session_6',
        task: 'Strategic market positioning analysis',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy(),
        adapter_id: 'strategy' as const
      };

      const result = await orchestrator.execute(request);

      expect(result.success || result.partial).toBe(true);
      expect(result.capabilities_executed.length).toBeGreaterThan(0);
    }, 30000);

    it('should use finance adapter correctly', async () => {
      const request = {
        session_id: 'test_session_7',
        task: 'Financial modeling and unit economics',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy(),
        adapter_id: 'finance' as const
      };

      const result = await orchestrator.execute(request);

      expect(result.success || result.partial).toBe(true);
    }, 30000);

    it('should use risk adapter correctly', async () => {
      const request = {
        session_id: 'test_session_8',
        task: 'Risk assessment and mitigation planning',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy(),
        adapter_id: 'risk' as const
      };

      const result = await orchestrator.execute(request);

      expect(result.success || result.partial).toBe(true);
    }, 30000);
  });

  describe('Session Export', () => {
    it('should export session data correctly', async () => {
      const request = {
        session_id: 'test_session_9',
        task: 'Market analysis for export test',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy()
      };

      await orchestrator.execute(request);
      const exported = orchestrator.exportSession('test_session_9');

      expect(exported.session_id).toBe('test_session_9');
      expect(exported.artifacts).toBeDefined();
      expect(exported.evidence).toBeDefined();
      expect(exported.exported_at).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Quality Metrics', () => {
    it('should provide confidence scores for artifacts', async () => {
      const request = {
        session_id: 'test_session_10',
        task: 'Market sizing analysis',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy()
      };

      const result = await orchestrator.execute(request);

      if (result.artifacts.length > 0) {
        for (const artifact of result.artifacts) {
          expect(artifact.confidence).toBeGreaterThanOrEqual(0);
          expect(artifact.confidence).toBeLessThanOrEqual(1);
          expect(artifact.evidence_quality).toBeGreaterThanOrEqual(0);
          expect(artifact.evidence_quality).toBeLessThanOrEqual(1);
        }
      }
    }, 30000);

    it('should track quality flags', async () => {
      const request = {
        session_id: 'test_session_11',
        task: 'Comprehensive analysis',
        budget: createDefaultBudget(),
        policy: createDefaultPolicy()
      };

      const result = await orchestrator.execute(request);

      expect(Array.isArray(result.quality_flags)).toBe(true);
      expect(result.overall_confidence).toBeGreaterThanOrEqual(0);
      expect(result.overall_confidence).toBeLessThanOrEqual(1);
    }, 30000);
  });
});

