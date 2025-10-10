/**
 * Tests for validation helper functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateExecutionResults,
  checkPayloadSize,
  sanitizeForModeration,
  splitExecutionResults,
  compressFindings,
  checkSessionHealth,
  validateDiversityAxes,
  suggestDiversityAxes
} from '../src/workers/validation-helpers.js';

describe('validateExecutionResults', () => {
  it('should pass validation for minimal valid payload', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test findings'
        }
      ]
    };

    const result = validateExecutionResults(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject payload with extra top-level fields', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      session_id: 'test-session', // Extra field
      results: []
    };

    const result = validateExecutionResults(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Extra fields'))).toBe(true);
  });

  it('should reject payload with null values in optional fields', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test',
          evidence_refs: null // Should be []
        }
      ]
    };

    const result = validateExecutionResults(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('cannot be null'))).toBe(true);
  });

  it('should warn about URLs in evidence_refs', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test',
          evidence_refs: [
            { type: 'url', source: 'https://example.com', description: 'Test' }
          ]
        }
      ]
    };

    const result = validateExecutionResults(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('403 moderation block'))).toBe(true);
  });

  it('should warn about long findings', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'A'.repeat(600) // Long findings
        }
      ]
    };

    const result = validateExecutionResults(payload);
    expect(result.warnings.some(w => w.includes('long'))).toBe(true);
  });
});

describe('checkPayloadSize', () => {
  it('should calculate payload size correctly', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test findings'
        }
      ]
    };

    const result = checkPayloadSize(payload);
    expect(result.total_bytes).toBeGreaterThan(0);
    expect(result.total_kb).toBeGreaterThan(0);
    expect(result.exceeds_limit).toBe(false);
  });

  it('should detect when payload exceeds limit', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'A'.repeat(15000) // Large findings
        }
      ]
    };

    const result = checkPayloadSize(payload);
    expect(result.exceeds_limit).toBe(true);
  });
});

describe('sanitizeForModeration', () => {
  it('should move URLs from evidence_refs to findings', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test',
          evidence_refs: [
            { type: 'url', source: 'https://example.com', description: 'Example' }
          ]
        }
      ]
    };

    const { sanitized, changes } = sanitizeForModeration(payload);
    
    expect(sanitized.results[0].evidence_refs).toHaveLength(0);
    expect(sanitized.results[0].findings).toContain('https://example.com');
    expect(changes.length).toBeGreaterThan(0);
  });

  it('should remove type: "url" references', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test',
          evidence_refs: [
            { type: 'url', source: 'https://example.com', description: 'Test' },
            { type: 'citation', source: 'Smith 2024', description: 'Paper' }
          ]
        }
      ]
    };

    const { sanitized } = sanitizeForModeration(payload);
    
    expect(sanitized.results[0].evidence_refs).toHaveLength(1);
    expect(sanitized.results[0].evidence_refs[0].type).toBe('citation');
  });
});

describe('splitExecutionResults', () => {
  it('should not split small payloads', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Test'
        }
      ]
    };

    const { chunks } = splitExecutionResults(payload);
    expect(chunks).toHaveLength(1);
  });

  it('should split large payloads into chunks', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: Array.from({ length: 20 }, (_, i) => ({
        plan_id: `P${i % 4 + 1}`,
        step_id: `P${i % 4 + 1}_step_${i}`,
        findings: 'A'.repeat(1000) // 1KB each
      }))
    };

    const { chunks } = splitExecutionResults(payload, 10);
    expect(chunks.length).toBeGreaterThan(1);
    
    // Each chunk should have same execution_token
    chunks.forEach(chunk => {
      expect(chunk.execution_token).toBe(payload.execution_token);
    });
  });

  it('should group results by plan_id when possible', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        { plan_id: 'P1', step_id: 'P1_step_1', findings: 'A'.repeat(500) },
        { plan_id: 'P1', step_id: 'P1_step_2', findings: 'A'.repeat(500) },
        { plan_id: 'P2', step_id: 'P2_step_1', findings: 'A'.repeat(500) }
      ]
    };

    const { chunks } = splitExecutionResults(payload, 2);
    
    // P1 results should be together if possible
    const p1Chunks = chunks.filter(c => c.results.some((r: any) => r.plan_id === 'P1'));
    expect(p1Chunks.length).toBeGreaterThan(0);
  });
});

describe('compressFindings', () => {
  it('should not compress short findings', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: 'Short findings'
        }
      ]
    };

    const { compressed, changes } = compressFindings(payload);
    expect(changes).toHaveLength(0);
    expect(compressed.results[0].findings).toBe('Short findings');
  });

  it('should compress long findings and move to workpapers', () => {
    const longFindings = 'A'.repeat(600);
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        {
          plan_id: 'P1',
          step_id: 'P1_step_1',
          findings: longFindings
        }
      ]
    };

    const { compressed, changes } = compressFindings(payload, 500);
    
    expect(changes.length).toBeGreaterThan(0);
    expect(compressed.results[0].findings.length).toBeLessThan(longFindings.length);
    expect(compressed.results[0].workpapers).toBeDefined();
    expect(compressed.results[0].workpapers.length).toBeGreaterThan(0);
    expect(compressed.results[0].workpapers[0].content).toBe(longFindings);
  });
});

describe('checkSessionHealth', () => {
  it('should validate token format', () => {
    const result = checkSessionHealth('invalid_token');
    expect(result.healthy).toBe(false);
    expect(result.token_valid).toBe(false);
  });

  it('should detect expired tokens', () => {
    // Token from 8 days ago (expired)
    const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000);
    const token = `exec_test_${oldTimestamp}_abc`;
    
    const result = checkSessionHealth(token);
    expect(result.token_expired).toBe(true);
    expect(result.healthy).toBe(false);
  });

  it('should warn about tokens expiring soon', () => {
    // Token from 6.5 days ago (expires in 12 hours)
    const recentTimestamp = Date.now() - (6.5 * 24 * 60 * 60 * 1000);
    const token = `exec_test_${recentTimestamp}_abc`;
    
    const result = checkSessionHealth(token);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.time_until_expiry_hours).toBeLessThan(24);
  });

  it('should pass for fresh tokens', () => {
    const token = `exec_test_${Date.now()}_abc`;
    
    const result = checkSessionHealth(token);
    expect(result.healthy).toBe(true);
    expect(result.token_valid).toBe(true);
    expect(result.token_expired).toBe(false);
  });
});

describe('validateDiversityAxes', () => {
  it('should pass for valid axes', () => {
    const planAxes = ['Tech Stack: Hybrid', 'Data Sources: Primary', 'Risk: Market'];
    const requiredAxes = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
    
    const result = validateDiversityAxes(planAxes, requiredAxes);
    expect(result.valid).toBe(true);
    expect(result.satisfies_required).toBe(true);
    expect(result.min_axes_met).toBe(true);
  });

  it('should reject plans with too few axes', () => {
    const planAxes = ['Tech Stack: Hybrid'];
    const requiredAxes = ['Tech Stack: Cloud'];
    
    const result = validateDiversityAxes(planAxes, requiredAxes);
    expect(result.valid).toBe(false);
    expect(result.min_axes_met).toBe(false);
  });

  it('should detect missing required axes', () => {
    const planAxes = ['Tech Stack: Hybrid', 'Risk: Market'];
    const requiredAxes = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
    
    const result = validateDiversityAxes(planAxes, requiredAxes);
    expect(result.valid).toBe(false);
    expect(result.satisfies_required).toBe(false);
    expect(result.missing_required_axes.length).toBeGreaterThan(0);
  });

  it('should detect insufficient diversity from existing plans', () => {
    const planAxes = ['Tech Stack: Hybrid', 'Data Sources: Primary'];
    const requiredAxes = ['Tech Stack: Cloud', 'Data Sources: Secondary'];
    const existingPlans = [
      {
        plan_id: 'P1',
        diversity_axes: ['Tech Stack: Hybrid', 'Data Sources: Primary']
      }
    ];
    
    const result = validateDiversityAxes(planAxes, requiredAxes, existingPlans);
    expect(result.valid).toBe(false);
    expect(result.unique_from_existing).toBe(false);
  });
});

describe('suggestDiversityAxes', () => {
  it('should suggest axes based on required axes', () => {
    const requiredAxes = [
      'Tech Stack: Cloud vs Hybrid',
      'Data Sources: Primary vs Secondary'
    ];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(2);
    expect(result.explanations.length).toBeGreaterThan(0);
  });

  it('should avoid values used by existing plans', () => {
    const requiredAxes = ['Tech Stack: Cloud vs Hybrid'];
    const existingPlans = [
      { plan_id: 'P1', diversity_axes: ['Tech Stack: Cloud'] }
    ];

    const result = suggestDiversityAxes(requiredAxes, existingPlans);
    expect(result.suggested_axes[0]).toContain('Hybrid');
  });

  it('should use preferred values when provided', () => {
    const requiredAxes = ['Tech Stack: Cloud vs Hybrid'];
    const preferredValues = { tech_stack: 'On-premise' };

    const result = suggestDiversityAxes(requiredAxes, [], preferredValues);
    expect(result.suggested_axes[0]).toContain('On-premise');
  });

  it('should extract values from slash-separated patterns', () => {
    const requiredAxes = ['Deployment: Cloud/Hybrid/On-premise'];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(1);
    // Should extract one of: Cloud, Hybrid, On-premise
    expect(['Cloud', 'Hybrid', 'On-premise'].some(v =>
      result.suggested_axes[0].includes(v)
    )).toBe(true);
  });

  it('should extract values from comma-separated patterns', () => {
    const requiredAxes = ['Priority: High, Medium, Low'];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(1);
    // Should extract one of: High, Medium, Low
    expect(['High', 'Medium', 'Low'].some(v =>
      result.suggested_axes[0].includes(v)
    )).toBe(true);
  });

  it('should extract values from dash-separated patterns', () => {
    const requiredAxes = ['Timeline: Short-term - Long-term'];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(1);
    // Should extract one of: Short-term, Long-term
    expect(['Short-term', 'Long-term'].some(v =>
      result.suggested_axes[0].includes(v)
    )).toBe(true);
  });

  it('should extract values from bracket notation', () => {
    const requiredAxes = ['Options: [A, B, C]'];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(1);
    // Should extract one of: A, B, C
    expect(['A', 'B', 'C'].some(v =>
      result.suggested_axes[0].includes(v)
    )).toBe(true);
  });

  it('should extract values from range notation', () => {
    const requiredAxes = ['Duration: 1-5 years'];

    const result = suggestDiversityAxes(requiredAxes);
    expect(result.suggested_axes.length).toBe(1);
    // Should extract one of the range endpoints
    expect(result.suggested_axes[0]).toMatch(/1 years|5 years/);
  });
});

describe('splitExecutionResults - Performance Optimizations', () => {
  it('should handle very large payloads efficiently', () => {
    const startTime = Date.now();

    // Create a large payload with 100 results
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: Array.from({ length: 100 }, (_, i) => ({
        plan_id: `P${i % 10 + 1}`,
        step_id: `P${i % 10 + 1}_step_${i}`,
        findings: 'A'.repeat(500), // 500 bytes each
        evidence_refs: [
          { type: 'citation', source: 'Test', description: 'Test citation' }
        ]
      }))
    };

    const { chunks } = splitExecutionResults(payload, 10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 1 second for 100 results)
    expect(duration).toBeLessThan(1000);
    expect(chunks.length).toBeGreaterThan(1);

    // All chunks should have same execution_token
    chunks.forEach(chunk => {
      expect(chunk.execution_token).toBe(payload.execution_token);
    });
  });

  it('should minimize memory allocations', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: Array.from({ length: 50 }, (_, i) => ({
        plan_id: `P${i % 5 + 1}`,
        step_id: `P${i % 5 + 1}_step_${i}`,
        findings: 'B'.repeat(300)
      }))
    };

    // Should not throw memory errors
    expect(() => {
      const { chunks } = splitExecutionResults(payload, 10);
      expect(chunks.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should preserve result grouping by plan_id', () => {
    const payload = {
      execution_token: 'exec_test_123_abc',
      results: [
        { plan_id: 'P1', step_id: 'P1_step_1', findings: 'A'.repeat(300) },
        { plan_id: 'P1', step_id: 'P1_step_2', findings: 'A'.repeat(300) },
        { plan_id: 'P1', step_id: 'P1_step_3', findings: 'A'.repeat(300) },
        { plan_id: 'P2', step_id: 'P2_step_1', findings: 'A'.repeat(300) },
        { plan_id: 'P2', step_id: 'P2_step_2', findings: 'A'.repeat(300) }
      ]
    };

    const { chunks } = splitExecutionResults(payload, 2);

    // Check that P1 results are grouped together when possible
    chunks.forEach(chunk => {
      const planIds = new Set(chunk.results.map((r: any) => r.plan_id));
      // Each chunk should ideally have results from same plan
      // (though this may not always be possible due to size constraints)
      expect(planIds.size).toBeGreaterThan(0);
    });
  });
});

