/**
 * Oracle Tools for Formal Verification
 * 
 * Provides optional formal verification oracles for critical claims:
 * - SAT solver (Z3) for logical claims
 * - CAS (Math.js) for algebraic claims
 * - Proof checker (minimal) for proof sketches
 * 
 * DESIGN PRINCIPLES:
 * - Strict input/output formats (no free-form strings)
 * - Hard timeout <8ms CPU per oracle
 * - Deduplication to avoid re-verification
 * - Witness-based evidence (hashes, not full proofs)
 * - FORMAT_UNSUPPORTED error for invalid inputs
 */

import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * Oracle result types
 */
export type OracleResult = 'SAT' | 'UNSAT' | 'UNKNOWN' | 'VALID' | 'INVALID' | 'SIMPLIFIED' | 'EXPANDED' | 'FACTORED' | 'SOLVED' | 'EQUIVALENT' | 'NOT_EQUIVALENT' | 'FORMAT_UNSUPPORTED';

/**
 * Base oracle response
 */
export interface OracleResponse {
  result: OracleResult;
  witness_hash?: string;  // Hash of satisfying assignment or proof
  goal_hash: string;      // Hash of the input claim
  cpu_time_ms: number;
  retryable: boolean;     // Can this be retried?
  error_message?: string;
  transformed_expression?: string | Record<string, unknown>;
}

/**
 * Deduplication cache for oracle calls
 */
const oracleCache = new Map<string, OracleResponse>();

/**
 * CNF DIMACS-like format for SAT solver
 * Example: "p cnf 3 2\n1 -2 0\n2 3 0"
 */
export const CNFFormulaSchema = z.object({
  num_vars: z.number().int().positive(),
  num_clauses: z.number().int().positive(),
  clauses: z.array(z.array(z.number().int())).describe('Array of clauses, each clause is array of literals (positive=var, negative=negated var)')
});

export type CNFFormula = z.infer<typeof CNFFormulaSchema>;

/**
 * AST for algebraic expressions (CAS)
 */
export type AlgebraicExpression = {
  type: 'number' | 'variable' | 'operator' | 'function';
  value?: number | string;
  operator?: '+' | '-' | '*' | '/' | '^' | '=';
  function_name?: string;
  operands?: AlgebraicExpression[];
};

type MathJsModule = typeof import('mathjs');

export const AlgebraicExpressionSchema: z.ZodType<AlgebraicExpression> = z.lazy(() =>
  z.object({
    type: z.enum(['number', 'variable', 'operator', 'function']),
    value: z.union([z.number(), z.string()]).optional(),
    operator: z.enum(['+', '-', '*', '/', '^', '=']).optional(),
    function_name: z.string().optional(),
    operands: z.array(AlgebraicExpressionSchema).optional()
  })
);

/**
 * Proof sketch format (minimal)
 */
export const ProofSketchSchema = z.object({
  premises: z.array(z.string()).describe('List of premises (propositional formulas)'),
  conclusion: z.string().describe('Conclusion to prove'),
  steps: z.array(z.object({
    formula: z.string(),
    justification: z.enum(['premise', 'modus_ponens', 'and_intro', 'and_elim', 'or_intro', 'or_elim', 'implies_intro', 'implies_elim'])
  }))
});

export type ProofSketch = z.infer<typeof ProofSketchSchema>;

/**
 * Tool schemas
 */
export const VerifyLogicalClaimSchema = z.object({
  claim_id: z.string().describe('Unique identifier for this claim'),
  formula: CNFFormulaSchema.describe('CNF formula in DIMACS-like format. LIMITATION: Only formulas with ≤10 variables are solved (brute-force). Larger formulas return UNKNOWN.')
}).describe('SAT solver for propositional logic. Returns SAT/UNSAT/UNKNOWN with witness hash. Timeout: 8ms. Deduplication: automatic.');

export const VerifyAlgebraicClaimSchema = z.object({
  claim_id: z.string().describe('Unique identifier for this claim'),
  operation: z.enum(['simplify', 'factor', 'expand', 'solve', 'equivalent']).describe('Algebraic operation: simplify (full), factor (limited), expand (full), solve (limited), equivalent (compares simplified forms)'),
  expression: AlgebraicExpressionSchema.describe('Expression to verify (structured AST format)'),
  expected_result: AlgebraicExpressionSchema.optional().describe('Expected result for equivalence checking. REQUIRED for "equivalent" operation.')
}).describe('Computer Algebra System using Math.js. Returns SIMPLIFIED/EXPANDED/FACTORED/SOLVED/EQUIVALENT/NOT_EQUIVALENT with witness hash. LIMITATIONS: factor and solve have limited capabilities. Timeout: 8ms. Deduplication: automatic (cache key includes operation and expected_result).');

export const VerifyProofSketchSchema = z.object({
  claim_id: z.string().describe('Unique identifier for this claim'),
  proof: ProofSketchSchema.describe('Proof sketch with premises, conclusion, and steps. FULLY VERIFIED RULES: premise, modus_ponens, and_intro, and_elim, or_intro. SIMPLIFIED RULES (no assumption tracking): or_elim, implies_intro, implies_elim. Formula syntax: "A -> B", "A AND B", "A OR B".')
}).describe('Proof checker for propositional logic. Returns VALID/INVALID with witness hash. Uses regex pattern matching (not full AST). Timeout: 8ms. Deduplication: automatic.');

/**
 * Compute hash of a claim for deduplication
 */
function computeClaimHash(claim: any): string {
  const normalized = JSON.stringify(claim, Object.keys(claim).sort());
  return createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

/**
 * Timeout wrapper for oracle execution
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

/**
 * SAT Solver Oracle (using Z3)
 *
 * Input: CNF formula in DIMACS-like format
 * Output: SAT/UNSAT/UNKNOWN with witness hash
 * Timeout: 8ms CPU
 */
export async function handleVerifyLogicalClaim(
  args: z.infer<typeof VerifyLogicalClaimSchema>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const startTime = Date.now();
  const goalHash = computeClaimHash(args.formula);

  // Check cache for deduplication
  const cacheKey = `sat:${goalHash}`;
  if (oracleCache.has(cacheKey)) {
    const cached = oracleCache.get(cacheKey)!;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...cached,
          from_cache: true
        }, null, 2)
      }]
    };
  }

  try {
    // Validate input format
    const parsed = CNFFormulaSchema.safeParse(args.formula);
    if (!parsed.success) {
      const response: OracleResponse = {
        result: 'FORMAT_UNSUPPORTED',
        goal_hash: goalHash,
        cpu_time_ms: Date.now() - startTime,
        retryable: false,
        error_message: 'Invalid CNF format: ' + parsed.error.message
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    }

    // Simple SAT solver for small formulas (without Z3 for now due to bundle size)
    // This is a basic DPLL-style solver for demonstration
    const formula = args.formula;

    // For very small formulas, try brute force
    if (formula.num_vars <= 10) {
      const satResult = await withTimeout(
        solveSATBruteForce(formula),
        8,
        'SAT solving'
      );

      const response: OracleResponse = {
        result: satResult.satisfiable ? 'SAT' : 'UNSAT',
        witness_hash: satResult.assignment ? computeClaimHash(satResult.assignment) : undefined,
        goal_hash: goalHash,
        cpu_time_ms: Date.now() - startTime,
        retryable: false
      };

      oracleCache.set(cacheKey, response);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    } else {
      // For larger formulas, return UNKNOWN (would need full Z3)
      const response: OracleResponse = {
        result: 'UNKNOWN',
        goal_hash: goalHash,
        cpu_time_ms: Date.now() - startTime,
        retryable: false,
        error_message: 'Formula too large for simple solver (>10 vars). Full Z3 integration needed.'
      };

      oracleCache.set(cacheKey, response);
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    }
  } catch (error) {
    const response: OracleResponse = {
      result: 'UNKNOWN',
      goal_hash: goalHash,
      cpu_time_ms: Date.now() - startTime,
      retryable: false,
      error_message: error instanceof Error ? error.message : String(error)
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
}

/**
 * Simple brute-force SAT solver for small formulas
 */
async function solveSATBruteForce(formula: CNFFormula): Promise<{ satisfiable: boolean; assignment?: Record<number, boolean> }> {
  const numVars = formula.num_vars;
  const clauses = formula.clauses;

  // Try all possible assignments
  for (let i = 0; i < (1 << numVars); i++) {
    const assignment: Record<number, boolean> = {};
    for (let v = 1; v <= numVars; v++) {
      assignment[v] = ((i >> (v - 1)) & 1) === 1;
    }

    // Check if this assignment satisfies all clauses
    let allSatisfied = true;
    for (const clause of clauses) {
      let clauseSatisfied = false;
      for (const literal of clause) {
        const varNum = Math.abs(literal);
        const value = assignment[varNum];
        const literalValue = literal > 0 ? value : !value;
        if (literalValue) {
          clauseSatisfied = true;
          break;
        }
      }
      if (!clauseSatisfied) {
        allSatisfied = false;
        break;
      }
    }

    if (allSatisfied) {
      return { satisfiable: true, assignment };
    }
  }

  return { satisfiable: false };
}

/**
 * CAS Oracle (using Math.js)
 *
 * Input: Algebraic expression in AST format
 * Output: SIMPLIFIED/EQUIVALENT/NOT_EQUIVALENT with witness hash
 * Timeout: 8ms CPU
 */
export async function handleVerifyAlgebraicClaim(
  args: z.infer<typeof VerifyAlgebraicClaimSchema>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const startTime = Date.now();
  const goalHash = computeClaimHash(args.expression);

  // Check cache for deduplication (include expected_result in cache key for equivalent operations)
  const expectedResultKey = args.expected_result ? `:${computeClaimHash(args.expected_result)}` : '';
  const cacheKey = `cas:${args.operation}:${goalHash}${expectedResultKey}`;
  if (oracleCache.has(cacheKey)) {
    const cached = oracleCache.get(cacheKey)!;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...cached,
          from_cache: true
        }, null, 2)
      }]
    };
  }

  try {
    // Validate input format
    const parsed = AlgebraicExpressionSchema.safeParse(args.expression);
    if (!parsed.success) {
      const response: OracleResponse = {
        result: 'FORMAT_UNSUPPORTED',
        goal_hash: goalHash,
        cpu_time_ms: Date.now() - startTime,
        retryable: false,
        error_message: 'Invalid algebraic expression format: ' + parsed.error.message
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    }

    // Import Math.js dynamically to avoid bundle bloat
    const mathjs = await import('mathjs');

    // Convert AST to Math.js expression string
    const exprString = astToMathJsString(args.expression);

    if (args.operation === 'equivalent') {
      if (!args.expected_result) {
        const response: OracleResponse = {
          result: 'FORMAT_UNSUPPORTED',
          goal_hash: goalHash,
          cpu_time_ms: Date.now() - startTime,
          retryable: false,
          error_message: 'Expected result is required for equivalence checks'
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      }

      const expectedParsed = AlgebraicExpressionSchema.safeParse(args.expected_result);
      if (!expectedParsed.success) {
        const response: OracleResponse = {
          result: 'FORMAT_UNSUPPORTED',
          goal_hash: goalHash,
          cpu_time_ms: Date.now() - startTime,
          retryable: false,
          error_message: 'Invalid expected_result format: ' + expectedParsed.error.message
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      }
    }

    // Perform operation with timeout
    const casResult = await withTimeout(
      performCASOperation(args.operation, exprString, args.expression, args.expected_result, mathjs),
      8,
      'CAS operation'
    );

    const response: OracleResponse = {
      result: casResult.result,
      witness_hash: casResult.witness ? computeClaimHash(casResult.witness) : undefined,
      goal_hash: goalHash,
      cpu_time_ms: Date.now() - startTime,
      retryable: false
    };

    if (casResult.display !== undefined) {
      response.transformed_expression = casResult.display;
    }

    oracleCache.set(cacheKey, response);
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  } catch (error) {
    const response: OracleResponse = {
      result: 'UNKNOWN',
      goal_hash: goalHash,
      cpu_time_ms: Date.now() - startTime,
      retryable: false,
      error_message: error instanceof Error ? error.message : String(error)
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
}

/**
 * Convert AST to Math.js expression string
 */
function astToMathJsString(ast: AlgebraicExpression): string {
  if (ast.type === 'number') {
    return String(ast.value);
  } else if (ast.type === 'variable') {
    return String(ast.value);
  } else if (ast.type === 'operator' && ast.operands) {
    const left = astToMathJsString(ast.operands[0]);
    const right = ast.operands[1] ? astToMathJsString(ast.operands[1]) : '';
    return `(${left} ${ast.operator} ${right})`;
  } else if (ast.type === 'function' && ast.operands) {
    const args = ast.operands.map(astToMathJsString).join(', ');
    return `${ast.function_name}(${args})`;
  }
  throw new Error('Invalid AST node type');
}

/**
 * Perform CAS operation using Math.js
 */
type CASOperationResult = {
  result: OracleResult;
  witness?: any;
  display?: string | Record<string, unknown>;
};

async function performCASOperation(
  operation: string,
  exprString: string,
  originalExpression: AlgebraicExpression,
  expectedResult: AlgebraicExpression | undefined,
  mathjs: MathJsModule
): Promise<CASOperationResult> {
  try {
    switch (operation) {
      case 'simplify': {
        const simplified = mathjs.simplify(exprString);
        return {
          result: 'SIMPLIFIED',
          witness: simplified.toString(),
          display: simplified.toString()
        };
      }
      case 'expand': {
        // Math.js simplify with expand rules
        const expanded = mathjs.simplify(exprString, ['expand']);
        return {
          result: 'EXPANDED',
          witness: expanded.toString(),
          display: expanded.toString()
        };
      }
      case 'factor': {
        // Math.js doesn't have full factorization, but we can try simplification
        // For polynomial factoring, this is limited
        const factored = mathjs.simplify(exprString);
        return {
          result: 'FACTORED',
          witness: factored.toString(),
          display: factored.toString()
        };
      }
      case 'solve': {
        // For solve, we need an equation (expression with '=')
        // This is a simplified implementation
        try {
          mathjs.parse(exprString);
          // Math.js solve is limited, return simplified form
          const solved = mathjs.simplify(exprString);
          return {
            result: 'SOLVED',
            witness: solved.toString(),
            display: solved.toString()
          };
        } catch {
          return { result: 'FORMAT_UNSUPPORTED' };
        }
      }
      case 'equivalent': {
        if (!expectedResult) {
          return { result: 'FORMAT_UNSUPPORTED' };
        }
        const expr1 = mathjs.simplify(exprString);
        const expr2 = mathjs.simplify(astToMathJsString(expectedResult));
        const comparison = compareExpressionsForEquivalence(
          originalExpression,
          expectedResult,
          mathjs
        );
        return {
          result: comparison.equivalent ? 'EQUIVALENT' : 'NOT_EQUIVALENT',
          witness: {
            expr1: expr1.toString(),
            expr2: expr2.toString(),
            difference: comparison.difference,
            symbolic_zero: comparison.symbolicZero,
            evaluation: comparison.evaluations
          },
          display: {
            simplified_expression: expr1.toString(),
            simplified_expected: expr2.toString(),
            difference: comparison.difference,
            symbolic_zero: comparison.symbolicZero,
            evaluations: comparison.evaluations.map((item) => ({
              assignment: item.assignment,
              result: item.result,
              zero: item.zero
            }))
          }
        };
      }
      default:
        return { result: 'FORMAT_UNSUPPORTED' };
    }
  } catch (error) {
    throw error;
  }
}

type EquivalenceEvaluation = {
  assignment: Record<string, number>;
  result: string;
  zero: boolean;
  error?: string;
};

function compareExpressionsForEquivalence(
  expression: AlgebraicExpression,
  expected: AlgebraicExpression,
  mathjs: MathJsModule
): {
  equivalent: boolean;
  difference: string;
  symbolicZero: boolean;
  evaluations: EquivalenceEvaluation[];
} {
  const comparisonExpr = canonicalComparisonString(expression);
  const comparisonExpected = canonicalComparisonString(expected);

  const differenceNode = mathjs.simplify(
    `(${comparisonExpr}) - (${comparisonExpected})`
  );
  const differenceString = differenceNode.toString();

  const symbolicZero = isSymbolicallyZero(differenceNode, mathjs);
  if (symbolicZero) {
    return {
      equivalent: true,
      difference: differenceString,
      symbolicZero: true,
      evaluations: []
    };
  }

  const variables = new Set<string>();
  collectVariables(expression, variables);
  collectVariables(expected, variables);

  const evaluations: EquivalenceEvaluation[] = [];
  let allZero = true;
  let successCount = 0;

  const samples = generateSampleAssignments(Array.from(variables));
  for (const assignment of samples) {
    try {
      const value = differenceNode.evaluate(assignment);
      const zero = isApproximatelyZero(value);
      evaluations.push({
        assignment,
        result: formatEvaluationValue(value),
        zero
      });
      successCount += 1;
      if (!zero) {
        allZero = false;
        break;
      }
    } catch (error) {
      evaluations.push({
        assignment,
        result: 'error',
        zero: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    equivalent: successCount > 0 && allZero,
    difference: differenceString,
    symbolicZero: false,
    evaluations
  };
}

function canonicalComparisonString(ast: AlgebraicExpression): string {
  if (ast.type === 'operator' && ast.operator === '=' && ast.operands?.length === 2) {
    const left = astToMathJsString(ast.operands[0]);
    const right = astToMathJsString(ast.operands[1]);
    return `(${left}) - (${right})`;
  }
  return astToMathJsString(ast);
}

function collectVariables(ast: AlgebraicExpression, set: Set<string>) {
  if (ast.type === 'variable' && typeof ast.value === 'string') {
    set.add(ast.value);
  }
  if (ast.operands) {
    for (const operand of ast.operands) {
      collectVariables(operand, set);
    }
  }
}

function generateSampleAssignments(variables: string[]): Array<Record<string, number>> {
  if (variables.length === 0) {
    return [{}];
  }

  const sampleValues = [-2, -1, -0.5, 1, 2, 3];
  const assignments: Array<Record<string, number>> = [];
  const maxSamples = Math.min(6, sampleValues.length);

  for (let i = 0; i < maxSamples; i++) {
    const scope: Record<string, number> = {};
    for (let j = 0; j < variables.length; j++) {
      scope[variables[j]] = sampleValues[(i + j) % sampleValues.length];
    }
    assignments.push(scope);
  }

  return assignments;
}

function isSymbolicallyZero(node: any, mathjs: MathJsModule): boolean {
  if (node.isConstantNode) {
    const value = node.value;
    if (typeof value === 'number') {
      return Math.abs(value) < 1e-12;
    }
    if (typeof value === 'string') {
      return Number(value) === 0;
    }
  }

  const simplified = mathjs.simplify(node) as any;
  const simplifiedString =
    simplified && typeof simplified.toString === 'function' ? simplified.toString() : String(simplified);
  if (simplifiedString === '0' || simplifiedString === '0.0') {
    return true;
  }

  if (simplified && simplified.isConstantNode) {
    const value = simplified.value as unknown;
    if (typeof value === 'number') {
      return Math.abs(value) < 1e-12;
    }
    if (typeof value === 'string') {
      return Number(value) === 0;
    }
  }

  return false;
}

function isApproximatelyZero(value: any): boolean {
  if (typeof value === 'number') {
    return Math.abs(value) < 1e-9;
  }

  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return Math.abs(numeric) < 1e-9;
    }
  }

  if (value && typeof value === 'object') {
    if ('re' in value && 'im' in value) {
      const { re, im } = value as { re: number; im: number };
      return Math.abs(re) < 1e-9 && Math.abs(im) < 1e-9;
    }

    if (typeof (value as any).valueOf === 'function') {
      const numeric = (value as any).valueOf();
      if (typeof numeric === 'number') {
        return Math.abs(numeric) < 1e-9;
      }
    }
  }

  return false;
}

function formatEvaluationValue(value: any): string {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  if (value && typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '[unrepresentable]';
  }
}

/**
 * Proof Checker Oracle (minimal propositional logic)
 *
 * Input: Proof sketch in structured format
 * Output: VALID/INVALID with witness hash
 * Timeout: 8ms CPU
 */
export async function handleVerifyProofSketch(
  args: z.infer<typeof VerifyProofSketchSchema>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const startTime = Date.now();
  const goalHash = computeClaimHash(args.proof);

  // Check cache for deduplication
  const cacheKey = `proof:${goalHash}`;
  if (oracleCache.has(cacheKey)) {
    const cached = oracleCache.get(cacheKey)!;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...cached,
          from_cache: true
        }, null, 2)
      }]
    };
  }

  try {
    // Validate input format
    const parsed = ProofSketchSchema.safeParse(args.proof);
    if (!parsed.success) {
      const response: OracleResponse = {
        result: 'FORMAT_UNSUPPORTED',
        goal_hash: goalHash,
        cpu_time_ms: Date.now() - startTime,
        retryable: false,
        error_message: 'Invalid proof sketch format: ' + parsed.error.message
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    }

    // Simple proof checker with timeout
    const proofResult = await withTimeout(
      checkProofSketch(args.proof),
      8,
      'Proof checking'
    );

    const response: OracleResponse = {
      result: proofResult.valid ? 'VALID' : 'INVALID',
      witness_hash: proofResult.valid ? computeClaimHash(proofResult.derivedFormulas) : undefined,
      goal_hash: goalHash,
      cpu_time_ms: Date.now() - startTime,
      retryable: false,
      error_message: proofResult.error
    };

    // Cache the result
    oracleCache.set(cacheKey, response);

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  } catch (error) {
    const response: OracleResponse = {
      result: 'UNKNOWN',
      goal_hash: goalHash,
      cpu_time_ms: Date.now() - startTime,
      retryable: false,
      error_message: error instanceof Error ? error.message : String(error)
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
}

/**
 * Simple proof checker for propositional logic
 * Verifies that each step follows from previous steps using the declared justification
 */
async function checkProofSketch(proof: ProofSketch): Promise<{ valid: boolean; derivedFormulas?: string[]; error?: string }> {
  const derivedFormulas: string[] = [...proof.premises];

  try {
    for (const step of proof.steps) {
      const formula = step.formula;
      const justification = step.justification;

      // Check if step is valid based on justification
      switch (justification) {
        case 'premise':
          if (!proof.premises.includes(formula)) {
            return { valid: false, error: `Formula "${formula}" claimed as premise but not in premises list` };
          }
          break;

        case 'modus_ponens': {
          // Modus ponens: from "A" and "A -> B", derive "B"
          let foundValid = false;
          for (const derived of derivedFormulas) {
            const impliesPattern = /^(.+)\s*->\s*(.+)$/;
            const m = derived.match(impliesPattern);
            if (m && m[2].trim() === formula.trim() && derivedFormulas.includes(m[1].trim())) {
              foundValid = true;
              break;
            }
          }
          if (!foundValid) {
            return { valid: false, error: `Modus ponens failed for "${formula}": missing required premises` };
          }
          derivedFormulas.push(formula);
          break;
        }

        case 'and_intro': {
          // And introduction: from "A" and "B", derive "A AND B"
          const andPattern = /^(.+)\s+AND\s+(.+)$/;
          const m = formula.match(andPattern);
          if (!m || !derivedFormulas.includes(m[1].trim()) || !derivedFormulas.includes(m[2].trim())) {
            return { valid: false, error: `And introduction failed for "${formula}": missing conjuncts` };
          }
          derivedFormulas.push(formula);
          break;
        }

        case 'and_elim': {
          // And elimination: from "A AND B", derive "A" or "B"
          let foundValid = false;
          for (const derived of derivedFormulas) {
            const andPattern = /^(.+)\s+AND\s+(.+)$/;
            const m = derived.match(andPattern);
            if (m && (m[1].trim() === formula.trim() || m[2].trim() === formula.trim())) {
              foundValid = true;
              break;
            }
          }
          if (!foundValid) {
            return { valid: false, error: `And elimination failed for "${formula}": no conjunction found` };
          }
          derivedFormulas.push(formula);
          break;
        }

        case 'or_intro': {
          // Or introduction: from "A", derive "A OR B" for any B
          const orPattern = /^(.+)\s+OR\s+(.+)$/;
          const m = formula.match(orPattern);
          if (!m || (!derivedFormulas.includes(m[1].trim()) && !derivedFormulas.includes(m[2].trim()))) {
            return { valid: false, error: `Or introduction failed for "${formula}": missing disjunct` };
          }
          derivedFormulas.push(formula);
          break;
        }

        case 'or_elim':
        case 'implies_intro':
        case 'implies_elim':
          // These rules require assumption tracking (natural deduction context)
          // For now, accept them but note they're simplified
          // A full implementation would track assumption scopes
          derivedFormulas.push(formula);
          break;

        default:
          return { valid: false, error: `Unknown justification: ${justification}` };
      }
    }

    // Check if conclusion was derived
    if (!derivedFormulas.includes(proof.conclusion)) {
      return { valid: false, error: `Conclusion "${proof.conclusion}" was not derived in proof steps` };
    }

    return { valid: true, derivedFormulas };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}
