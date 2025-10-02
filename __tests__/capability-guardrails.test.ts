/**
 * Capability Guardrails Output Tests
 * 
 * Verifies that capabilities return guardrails (analytical perspectives)
 * instead of pre-formatted deterministic output.
 */

import { generateGuardrails, getGuardrails, clearGuardrailCache } from '../src/workers/guardrail-generator.js';
import type { CapabilityNode } from '../src/workers/capability-graph.js';
import { GuardrailOutputSchema } from '../src/workers/guardrail-output.js';

describe('Capability Guardrails Output', () => {
  
  describe('GuardrailGenerator', () => {
    it('should generate guardrails from capability metadata', () => {
      const capability: CapabilityNode = {
        id: 'test_capability',
        name: 'Test Capability',
        description: 'A test capability for validation',
        category: 'market',
        preconditions: { required_inputs: [] },
        output_contract: {
          schema: {} as any,
          required_evidence: [],
          quality_checks: []
        },
        cost_estimate: {
          expected_tokens_in: 100,
          expected_tokens_out: 200,
          cpu_ms: 50,
          subrequests: 0
        },
        expected_precision: 0.8,
        execute: async () => ({
          capability_id: 'test',
          guardrails: {},
          evidence: {},
          confidence: 0.8,
          cost_actual: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
          quality_score: 0.9,
          warnings: [],
          metadata: { execution_time_ms: 50, timestamp: Date.now(), version: '1.0.0' }
        }),
        version: '1.0.0',
        tags: ['test']
      };

      const guardrails = generateGuardrails(capability);

      // Validate schema
      const validation = GuardrailOutputSchema.safeParse(guardrails);
      expect(validation.success).toBe(true);

      // Check required fields
      expect(guardrails.key_questions).toBeDefined();
      expect(Array.isArray(guardrails.key_questions)).toBe(true);
      expect(guardrails.key_questions.length).toBeGreaterThan(0);

      expect(guardrails.analysis_dimensions).toBeDefined();
      expect(Array.isArray(guardrails.analysis_dimensions)).toBe(true);
      expect(guardrails.analysis_dimensions.length).toBeGreaterThan(0);

      expect(guardrails.trade_offs).toBeDefined();
      expect(Array.isArray(guardrails.trade_offs)).toBe(true);

      expect(guardrails.risks_to_monitor).toBeDefined();
      expect(Array.isArray(guardrails.risks_to_monitor)).toBe(true);
    });

    it('should generate category-specific guardrails for market capabilities', () => {
      const capability: CapabilityNode = {
        id: 'market_scan',
        name: 'Market Scan',
        description: 'Analyze market structure and dynamics',
        category: 'market',
        preconditions: { required_inputs: ['industry', 'geography'] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 200, expected_tokens_out: 500, cpu_ms: 100, subrequests: 0 },
        expected_precision: 0.85,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: ['market', 'analysis']
      };

      const guardrails = generateGuardrails(capability);

      // Should include market-specific questions
      const hasMarketQuestions = guardrails.key_questions.some((q: string) => 
        q.toLowerCase().includes('market') || 
        q.toLowerCase().includes('competitive') ||
        q.toLowerCase().includes('growth')
      );
      expect(hasMarketQuestions).toBe(true);

      // Should include market-specific dimensions
      const hasMarketDimensions = guardrails.analysis_dimensions.some((d: any) => 
        d.dimension.includes('market') || 
        d.dimension.includes('competitive') ||
        d.dimension.includes('growth')
      );
      expect(hasMarketDimensions).toBe(true);
    });

    it('should generate category-specific guardrails for financial capabilities', () => {
      const capability: CapabilityNode = {
        id: 'dcf_valuation',
        name: 'DCF Valuation',
        description: 'Perform discounted cash flow valuation',
        category: 'financial',
        preconditions: { required_inputs: ['revenue_forecast', 'discount_rate'] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 300, expected_tokens_out: 600, cpu_ms: 150, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: ['financial', 'valuation']
      };

      const guardrails = generateGuardrails(capability);

      // Should include financial-specific questions
      const hasFinancialQuestions = guardrails.key_questions.some((q: string) => 
        q.toLowerCase().includes('financial') || 
        q.toLowerCase().includes('revenue') ||
        q.toLowerCase().includes('profitability') ||
        q.toLowerCase().includes('cash flow')
      );
      expect(hasFinancialQuestions).toBe(true);
    });

    it('should generate category-specific guardrails for risk capabilities', () => {
      const capability: CapabilityNode = {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        description: 'Assess operational and strategic risks',
        category: 'risk',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 250, expected_tokens_out: 550, cpu_ms: 120, subrequests: 0 },
        expected_precision: 0.75,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: ['risk']
      };

      const guardrails = generateGuardrails(capability);

      // Should include risk-specific questions
      const hasRiskQuestions = guardrails.key_questions.some((q: string) => 
        q.toLowerCase().includes('risk')
      );
      expect(hasRiskQuestions).toBe(true);

      // Should include risk-specific dimensions
      const hasRiskDimensions = guardrails.analysis_dimensions.some((d: any) => 
        d.dimension.includes('risk')
      );
      expect(hasRiskDimensions).toBe(true);
    });

    it('should include validation criteria in guardrails', () => {
      const capability: CapabilityNode = {
        id: 'test_cap',
        name: 'Test',
        description: 'Test',
        category: 'strategic',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      expect(guardrails.validation_criteria).toBeDefined();
      expect(Array.isArray(guardrails.validation_criteria)).toBe(true);
      if (guardrails.validation_criteria) {
        expect(guardrails.validation_criteria.length).toBeGreaterThan(0);

        guardrails.validation_criteria.forEach((criterion: any) => {
          expect(criterion.criterion).toBeDefined();
          expect(criterion.method).toBeDefined();
        });
      }
    });

    it('should include context (assumptions, constraints, dependencies)', () => {
      const capability: CapabilityNode = {
        id: 'test_cap',
        name: 'Test',
        description: 'Test',
        category: 'operational',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      expect(guardrails.context).toBeDefined();
      if (guardrails.context) {
        expect(guardrails.context.assumptions).toBeDefined();
        expect(Array.isArray(guardrails.context.assumptions)).toBe(true);
        expect(guardrails.context.constraints).toBeDefined();
        expect(Array.isArray(guardrails.context.constraints)).toBe(true);
        expect(guardrails.context.dependencies).toBeDefined();
        expect(Array.isArray(guardrails.context.dependencies)).toBe(true);
      }
    });

    it('should include suggested next steps', () => {
      const capability: CapabilityNode = {
        id: 'test_cap',
        name: 'Test',
        description: 'Test',
        category: 'commercial',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      expect(guardrails.suggested_next_steps).toBeDefined();
      expect(Array.isArray(guardrails.suggested_next_steps)).toBe(true);
      if (guardrails.suggested_next_steps) {
        expect(guardrails.suggested_next_steps.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Guardrail Caching', () => {
    it('should cache generated guardrails', () => {
      clearGuardrailCache();

      const capability: CapabilityNode = {
        id: 'cached_test',
        name: 'Cached Test',
        description: 'Test caching',
        category: 'market',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      // First call - generates and caches
      const guardrails1 = getGuardrails(capability);
      
      // Second call - should return cached version
      const guardrails2 = getGuardrails(capability);

      // Should be the same object reference (cached)
      expect(guardrails1).toBe(guardrails2);
    });

    it('should clear cache when requested', () => {
      const capability: CapabilityNode = {
        id: 'clear_test',
        name: 'Clear Test',
        description: 'Test cache clearing',
        category: 'market',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails1 = getGuardrails(capability);
      
      clearGuardrailCache();
      
      const guardrails2 = getGuardrails(capability);

      // Should be different object references (cache cleared)
      expect(guardrails1).not.toBe(guardrails2);
      
      // But content should be equivalent
      expect(guardrails1.key_questions).toEqual(guardrails2.key_questions);
    });
  });

  describe('Guardrail Structure Validation', () => {
    it('should have properly structured analysis dimensions', () => {
      const capability: CapabilityNode = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'market',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      guardrails.analysis_dimensions.forEach((dim: any) => {
        expect(dim.dimension).toBeDefined();
        expect(typeof dim.dimension).toBe('string');
        expect(dim.description).toBeDefined();
        expect(typeof dim.description).toBe('string');
        expect(dim.considerations).toBeDefined();
        expect(Array.isArray(dim.considerations)).toBe(true);
        expect(dim.considerations.length).toBeGreaterThan(0);
      });
    });

    it('should have properly structured trade-offs', () => {
      const capability: CapabilityNode = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'financial',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      guardrails.trade_offs.forEach((tradeOff: any) => {
        expect(tradeOff.trade_off).toBeDefined();
        expect(tradeOff.option_a).toBeDefined();
        expect(tradeOff.option_b).toBeDefined();
        expect(tradeOff.context).toBeDefined();
      });
    });

    it('should have properly structured risks', () => {
      const capability: CapabilityNode = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'risk',
        preconditions: { required_inputs: [] },
        output_contract: { schema: {} as any, required_evidence: [], quality_checks: [] },
        cost_estimate: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 0 },
        expected_precision: 0.8,
        execute: async () => ({} as any),
        version: '1.0.0',
        tags: []
      };

      const guardrails = generateGuardrails(capability);

      guardrails.risks_to_monitor.forEach((risk: any) => {
        expect(risk.risk).toBeDefined();
        expect(risk.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(risk.severity);
        expect(risk.indicators).toBeDefined();
        expect(Array.isArray(risk.indicators)).toBe(true);
      });
    });
  });
});

