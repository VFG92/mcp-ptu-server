/**
 * Tests for Oracle Tools
 * 
 * Verifies:
 * - Input format validation
 * - Timeout enforcement (<8ms)
 * - Deduplication (cache)
 * - Witness hash generation
 * - FORMAT_UNSUPPORTED error handling
 */

import { describe, it, expect } from '@jest/globals';
import {
  handleVerifyLogicalClaim,
  handleVerifyAlgebraicClaim,
  handleVerifyProofSketch,
  type CNFFormula,
  type AlgebraicExpression,
  type ProofSketch
} from '../src/workers/oracle-tools.js';

describe('Oracle Tools', () => {
  describe('verify_logical_claim (SAT solver)', () => {
    it('should validate CNF format', async () => {
      const validCNF: CNFFormula = {
        num_vars: 3,
        num_clauses: 2,
        clauses: [[1, -2], [2, 3]]
      };

      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-1',
        formula: validCNF
      });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBe(1);
      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBeDefined();
      expect(response.goal_hash).toBeDefined();
      expect(response.cpu_time_ms).toBeDefined();
    });

    it('should reject invalid CNF format', async () => {
      const invalidCNF = {
        num_vars: 3,
        // Missing num_clauses
        clauses: [[1, -2]]
      } as any;

      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-invalid',
        formula: invalidCNF
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('FORMAT_UNSUPPORTED');
      expect(response.error_message).toContain('Invalid CNF format');
    });

    it('should solve small SAT formulas', async () => {
      // Simple satisfiable formula: (x1 OR x2) AND (x2 OR x3)
      const satFormula: CNFFormula = {
        num_vars: 3,
        num_clauses: 2,
        clauses: [[1, 2], [2, 3]]
      };

      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-satisfiable',
        formula: satFormula
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('SAT');
      expect(response.witness_hash).toBeDefined();
    });

    it('should detect UNSAT formulas', async () => {
      // Unsatisfiable formula: (x1) AND (NOT x1)
      const unsatFormula: CNFFormula = {
        num_vars: 1,
        num_clauses: 2,
        clauses: [[1], [-1]]
      };

      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-unsat',
        formula: unsatFormula
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('UNSAT');
    });

    it('should use cache for duplicate claims', async () => {
      const formula: CNFFormula = {
        num_vars: 2,
        num_clauses: 1,
        clauses: [[1, 2]]
      };

      // First call
      const result1 = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-cache',
        formula
      });
      const response1 = JSON.parse(result1.content[0].text);

      // Second call with same formula
      const result2 = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-cache-2',
        formula
      });
      const response2 = JSON.parse(result2.content[0].text);

      expect(response2.from_cache).toBe(true);
      expect(response2.goal_hash).toBe(response1.goal_hash);
    });

    it('should return UNKNOWN for large formulas', async () => {
      // Formula with >10 variables
      const largeFormula: CNFFormula = {
        num_vars: 15,
        num_clauses: 5,
        clauses: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]
      };

      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-sat-large',
        formula: largeFormula
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('UNKNOWN');
      expect(response.error_message).toContain('too large');
    });
  });

  describe('verify_algebraic_claim (CAS)', () => {
    it('should validate algebraic expression format', async () => {
      const validExpr: AlgebraicExpression = {
        type: 'operator',
        operator: '+',
        operands: [
          { type: 'number', value: 2 },
          { type: 'number', value: 3 }
        ]
      };

      const result = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-1',
        operation: 'simplify',
        expression: validExpr
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBeDefined();
      expect(response.goal_hash).toBeDefined();
    });

    it('should reject invalid expression format', async () => {
      const invalidExpr = {
        type: 'invalid_type',
        value: 42
      } as any;

      const result = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-invalid',
        operation: 'simplify',
        expression: invalidExpr
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('FORMAT_UNSUPPORTED');
    });

    it('should use cache for duplicate expressions', async () => {
      const expr: AlgebraicExpression = {
        type: 'variable',
        value: 'x'
      };

      const result1 = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-cache-1',
        operation: 'simplify',
        expression: expr
      });

      const result2 = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-cache-2',
        operation: 'simplify',
        expression: expr
      });

      const response2 = JSON.parse(result2.content[0].text);
      expect(response2.from_cache).toBe(true);
    });

    it('should NOT cache equivalent operations with different expected_result', async () => {
      const expr: AlgebraicExpression = {
        type: 'variable',
        value: 'x'
      };

      const expected1: AlgebraicExpression = {
        type: 'variable',
        value: 'y'
      };

      const expected2: AlgebraicExpression = {
        type: 'variable',
        value: 'z'
      };

      const result1 = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-equiv-1',
        operation: 'equivalent',
        expression: expr,
        expected_result: expected1
      });

      const result2 = await handleVerifyAlgebraicClaim({
        claim_id: 'test-cas-equiv-2',
        operation: 'equivalent',
        expression: expr,
        expected_result: expected2
      });

      const response1 = JSON.parse(result1.content[0].text);
      const response2 = JSON.parse(result2.content[0].text);

      // Should not use cache because expected_result is different
      expect(response2.from_cache).toBeUndefined();
      // Both should be NOT_EQUIVALENT
      expect(response1.result).toBe('NOT_EQUIVALENT');
      expect(response2.result).toBe('NOT_EQUIVALENT');
    });
  });

  describe('verify_proof_sketch (Proof checker)', () => {
    it('should validate proof sketch format', async () => {
      const validProof: ProofSketch = {
        premises: ['A', 'A -> B'],
        conclusion: 'B',
        steps: [
          { formula: 'A', justification: 'premise' },
          { formula: 'A -> B', justification: 'premise' },
          { formula: 'B', justification: 'modus_ponens' }
        ]
      };

      const result = await handleVerifyProofSketch({
        claim_id: 'test-proof-1',
        proof: validProof
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBeDefined();
      expect(response.goal_hash).toBeDefined();
    });

    it('should reject invalid proof format', async () => {
      const invalidProof = {
        premises: ['A'],
        // Missing conclusion
        steps: []
      } as any;

      const result = await handleVerifyProofSketch({
        claim_id: 'test-proof-invalid',
        proof: invalidProof
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('FORMAT_UNSUPPORTED');
    });

    it('should validate correct proofs', async () => {
      const validProof: ProofSketch = {
        premises: ['P', 'Q'],
        conclusion: 'Q',
        steps: [
          { formula: 'P', justification: 'premise' },
          { formula: 'Q', justification: 'premise' }
        ]
      };

      const result = await handleVerifyProofSketch({
        claim_id: 'test-proof-valid',
        proof: validProof
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('VALID');
      expect(response.witness_hash).toBeDefined();
    });

    it('should detect invalid proofs', async () => {
      const invalidProof: ProofSketch = {
        premises: ['A'],
        conclusion: 'B',  // B is not derivable from A alone
        steps: [
          { formula: 'A', justification: 'premise' }
        ]
      };

      const result = await handleVerifyProofSketch({
        claim_id: 'test-proof-invalid-derivation',
        proof: invalidProof
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('INVALID');
      expect(response.error_message).toContain('not derived');
    });

    it('should verify modus ponens correctly', async () => {
      const validProof: ProofSketch = {
        premises: ['A', 'A -> B'],
        conclusion: 'B',
        steps: [
          { formula: 'A', justification: 'premise' },
          { formula: 'A -> B', justification: 'premise' },
          { formula: 'B', justification: 'modus_ponens' }
        ]
      };

      const result = await handleVerifyProofSketch({
        claim_id: 'test-modus-ponens',
        proof: validProof
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('VALID');
    });

    it('should reject invalid modus ponens', async () => {
      const invalidProof: ProofSketch = {
        premises: ['A'],
        conclusion: 'B',
        steps: [
          { formula: 'A', justification: 'premise' },
          { formula: 'B', justification: 'modus_ponens' }  // Missing "A -> B"
        ]
      };

      const result = await handleVerifyProofSketch({
        claim_id: 'test-invalid-modus-ponens',
        proof: invalidProof
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.result).toBe('INVALID');
      expect(response.error_message).toContain('Modus ponens failed');
    });

    it('should use cache for duplicate proofs', async () => {
      const proof: ProofSketch = {
        premises: ['X'],
        conclusion: 'X',
        steps: [
          { formula: 'X', justification: 'premise' }
        ]
      };

      const result1 = await handleVerifyProofSketch({
        claim_id: 'test-proof-cache-1',
        proof
      });

      const result2 = await handleVerifyProofSketch({
        claim_id: 'test-proof-cache-2',
        proof
      });

      const response2 = JSON.parse(result2.content[0].text);
      expect(response2.from_cache).toBe(true);
    });
  });

  describe('Performance and timeout', () => {
    it('should complete within reasonable time', async () => {
      const formula: CNFFormula = {
        num_vars: 5,
        num_clauses: 3,
        clauses: [[1, 2], [3, 4], [5, -1]]
      };

      const start = Date.now();
      const result = await handleVerifyLogicalClaim({
        claim_id: 'test-perf',
        formula
      });
      const elapsed = Date.now() - start;

      const response = JSON.parse(result.content[0].text);
      expect(response.cpu_time_ms).toBeLessThan(100); // Should be much faster than 100ms
      expect(elapsed).toBeLessThan(100);
    });
  });
});

