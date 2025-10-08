/**
 * Test semantic diversity parsing and validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseAxisString,
  compareAxesSemantically,
  satisfiesRequiredAxes,
  calculateSemanticDiversity
} from '../src/workers/parallel-reasoning-mcp.js';

describe('Semantic Diversity Parsing', () => {
  describe('parseAxisString', () => {
    it('should parse "Key: Value" format correctly', () => {
      const result = parseAxisString('Tech Stack: Hybrid');
      expect(result.key).toBe('tech_stack');
      expect(result.value).toBe('hybrid');
      expect(result.original).toBe('Tech Stack: Hybrid');
    });

    it('should parse key-only format', () => {
      const result = parseAxisString('data_sources');
      expect(result.key).toBe('data_sources');
      expect(result.value).toBe('');
      expect(result.original).toBe('data_sources');
    });

    it('should handle complex values with "vs"', () => {
      const result = parseAxisString('Risk: Market vs Operational vs Reputational');
      expect(result.key).toBe('risk');
      expect(result.value).toBe('market vs operational vs reputational');
    });

    it('should normalize whitespace in keys', () => {
      const result = parseAxisString('Technology  Stack: Cloud');
      expect(result.key).toBe('technology_stack');
    });

    it('should handle lowercase and uppercase', () => {
      const result1 = parseAxisString('TECH STACK: CLOUD');
      const result2 = parseAxisString('tech stack: cloud');
      expect(result1.key).toBe(result2.key);
      expect(result1.value).toBe(result2.value);
    });
  });

  describe('compareAxesSemantically', () => {
    it('should return true for different keys', () => {
      expect(compareAxesSemantically('Tech Stack: Hybrid', 'Data Sources: Primary')).toBe(true);
    });

    it('should return true for same key but different values', () => {
      expect(compareAxesSemantically('Tech Stack: Hybrid', 'Tech Stack: Cloud')).toBe(true);
    });

    it('should return false for same key and same value', () => {
      expect(compareAxesSemantically('Tech Stack: Hybrid', 'Tech Stack: Hybrid')).toBe(false);
    });

    it('should return false for same key when one has no value', () => {
      expect(compareAxesSemantically('tech_stack', 'Tech Stack: Hybrid')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(compareAxesSemantically('TECH STACK: HYBRID', 'tech stack: hybrid')).toBe(false);
    });
  });

  describe('satisfiesRequiredAxes', () => {
    it('should return true when all required keys are present', () => {
      const planAxes = ['Tech Stack: Hybrid', 'Data Sources: Primary', 'Risk: Market'];
      const requiredAxes = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
      expect(satisfiesRequiredAxes(planAxes, requiredAxes)).toBe(true);
    });

    it('should return false when a required key is missing', () => {
      const planAxes = ['Tech Stack: Hybrid', 'Risk: Market'];
      const requiredAxes = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
      expect(satisfiesRequiredAxes(planAxes, requiredAxes)).toBe(false);
    });

    it('should work with key-only format', () => {
      const planAxes = ['tech_stack', 'data_sources'];
      const requiredAxes = ['tech_stack', 'data_sources'];
      expect(satisfiesRequiredAxes(planAxes, requiredAxes)).toBe(true);
    });

    it('should match keys regardless of value', () => {
      const planAxes = ['Tech Stack: On-premise'];
      const requiredAxes = ['Tech Stack: Cloud'];
      expect(satisfiesRequiredAxes(planAxes, requiredAxes)).toBe(true);
    });
  });

  describe('calculateSemanticDiversity', () => {
    it('should return 0 for identical axes', () => {
      const plan1 = ['Tech Stack: Hybrid', 'Data Sources: Primary'];
      const plan2 = ['Tech Stack: Hybrid', 'Data Sources: Primary'];
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(0);
    });

    it('should count axes with different keys', () => {
      const plan1 = ['Tech Stack: Hybrid', 'Data Sources: Primary'];
      const plan2 = ['Risk: Market', 'Time Horizon: Long-term'];
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(4);
    });

    it('should count axes with same key but different values', () => {
      const plan1 = ['Tech Stack: Hybrid', 'Data Sources: Primary'];
      const plan2 = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(2);
    });

    it('should handle mixed scenarios', () => {
      const plan1 = ['Tech Stack: Hybrid', 'Data Sources: Primary', 'Risk: Market'];
      const plan2 = ['Tech Stack: Cloud', 'Data Sources: Primary', 'Time Horizon: Long-term'];
      // Tech Stack: different values (1)
      // Data Sources: same value (0)
      // Risk: only in plan1 (1)
      // Time Horizon: only in plan2 (1)
      // Total: 3
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(3);
    });

    it('should handle case insensitivity', () => {
      const plan1 = ['TECH STACK: HYBRID'];
      const plan2 = ['tech stack: hybrid'];
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(0);
    });

    it('should return correct count for real-world example', () => {
      const plan1 = [
        'Tech Stack: Open-source/on-prem',
        'Risk Perspective: Internal Efficiency',
        'Time Horizon: 12-18 months',
        'Data Sources: Official statistics',
        'Analytical Models: Regression-based'
      ];
      const plan2 = [
        'Tech Stack: Hybrid',
        'Risk Perspective: External Monetization',
        'Time Horizon: 3-5 years',
        'Data Sources: Expert interviews',
        'Analytical Models: Scenario planning'
      ];
      // All 5 axes have same keys but different values
      expect(calculateSemanticDiversity(plan1, plan2)).toBe(5);
    });
  });
});

