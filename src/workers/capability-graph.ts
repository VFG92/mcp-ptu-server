/**
 * Capability Graph Architecture
 * 
 * Replaces static personas with composable, atomic capabilities.
 * Each capability is a node with contracts, costs, and verification rules.
 */

import { z } from 'zod';

/**
 * Evidence types for claims
 */
export enum EvidenceType {
  CALCULATION = 'calc',        // Mathematical calculation with formula
  RETRIEVAL = 'retrieval',     // Retrieved from data/memory
  PRECEDENT = 'precedent',     // Based on historical patterns
  ASSUMPTION = 'assumption',   // Explicit assumption with rationale
  SIMULATION = 'simulation',   // Monte Carlo or other simulation
  HEURISTIC = 'heuristic'      // Rule-based approximation
}

/**
 * Evidence for a claim
 */
export interface Evidence {
  type: EvidenceType;
  source?: string;              // Source reference
  formula?: string;             // For CALCULATION type
  inputs?: Record<string, any>; // Input values for calculation
  rationale?: string;           // For ASSUMPTION type
  confidence?: number;          // 0-1, only when statistically derived
  timestamp: number;
}

/**
 * Output contract for a capability
 */
export interface OutputContract {
  schema: z.ZodSchema;          // Zod schema for validation
  units?: Record<string, string>; // Units for numeric fields (e.g., {revenue: 'USD', growth: '%'})
  ranges?: Record<string, [number, number]>; // Valid ranges for fields
  required_evidence: string[];  // Fields that must have evidence
  quality_checks?: Array<{      // Automated quality checks
    name: string;
    check: (output: any) => boolean;
    error_message: string;
  }>;
}

/**
 * Cost estimate for a capability
 */
export interface CostEstimate {
  expected_tokens_in: number;   // Expected input tokens
  expected_tokens_out: number;  // Expected output tokens
  cpu_ms: number;               // Expected CPU time in ms
  subrequests: number;          // Number of sub-operations
  memory_kb?: number;           // Memory usage estimate
}

/**
 * Preconditions for capability execution
 */
export interface Preconditions {
  required_inputs: string[];    // Required input fields
  required_artifacts?: string[]; // Required artifacts from whiteboard
  min_confidence?: number;      // Minimum confidence of dependencies
  budget_required?: Partial<CostEstimate>; // Minimum budget needed
}

/**
 * Capability execution result
 */
export interface CapabilityResult {
  capability_id: string;
  output: any;                  // Validated against output contract
  evidence: Record<string, Evidence[]>; // Evidence for each claim
  confidence: number;           // Overall confidence (0-1)
  cost_actual: CostEstimate;    // Actual cost incurred
  quality_score: number;        // 0-1, based on quality checks
  warnings: string[];           // Non-blocking warnings
  metadata: {
    execution_time_ms: number;
    timestamp: number;
    version: string;
  };
}

/**
 * Surrogate operator for degraded execution
 */
export interface SurrogateOperator {
  id: string;
  description: string;
  execute: (inputs: any) => Promise<CapabilityResult>;
  cost_estimate: CostEstimate;
  quality_penalty: number;      // 0-1, how much quality is lost
}

/**
 * Capability Node - atomic unit of business analysis
 */
export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  category: 'market' | 'financial' | 'operational' | 'risk' | 'strategic' | 'commercial';
  
  // Contracts
  preconditions: Preconditions;
  output_contract: OutputContract;
  
  // Cost & Performance
  cost_estimate: CostEstimate;
  expected_precision: number;   // 0-1, expected accuracy
  sensitivity_data?: Record<string, number>; // Sensitivity to input variations
  
  // Execution
  execute: (inputs: any, context: ExecutionContext) => Promise<CapabilityResult>;
  
  // Fallbacks
  surrogate?: SurrogateOperator; // Cheap fallback when budget exceeded
  decomposition?: string[];      // IDs of sub-capabilities if this fails
  
  // Metadata
  version: string;
  tags: string[];
  examples?: Array<{
    input: any;
    expected_output: any;
    description: string;
  }>;
}

/**
 * Execution context for capabilities
 */
export interface ExecutionContext {
  session_id: string;
  budget_remaining: CostEstimate;
  whiteboard: Map<string, any>; // Global artifacts
  scratchpad: Map<string, any>; // Capability-local scratch space
  policy: PolicyConfig;
  trace: ExecutionTrace[];
}

/**
 * Policy configuration
 */
export interface PolicyConfig {
  allowed_domains?: string[];   // For external calls
  max_tokens_per_capability?: number;
  max_cpu_ms_per_capability?: number;
  require_evidence_for?: string[]; // Artifact types requiring evidence
  pii_filter_enabled: boolean;
  financial_data_filter_enabled: boolean;
}

/**
 * Execution trace for debugging
 */
export interface ExecutionTrace {
  capability_id: string;
  timestamp: number;
  duration_ms: number;
  cost: CostEstimate;
  success: boolean;
  error?: string;
}

/**
 * Capability Graph - manages all capabilities
 */
export class CapabilityGraph {
  private capabilities: Map<string, CapabilityNode> = new Map();
  private adjacency: Map<string, Set<string>> = new Map(); // capability -> dependencies

  /**
   * Register a capability
   */
  register(capability: CapabilityNode): void {
    this.capabilities.set(capability.id, capability);
    
    // Build adjacency for dependencies
    if (capability.decomposition) {
      this.adjacency.set(capability.id, new Set(capability.decomposition));
    }
  }

  /**
   * Get capability by ID
   */
  get(id: string): CapabilityNode | undefined {
    return this.capabilities.get(id);
  }

  /**
   * Get all capabilities in a category
   */
  getByCategory(category: CapabilityNode['category']): CapabilityNode[] {
    return Array.from(this.capabilities.values())
      .filter(cap => cap.category === category);
  }

  /**
   * Get all capabilities with a tag
   */
  getByTag(tag: string): CapabilityNode[] {
    return Array.from(this.capabilities.values())
      .filter(cap => cap.tags.includes(tag));
  }

  /**
   * Find capabilities matching a query
   */
  search(query: string): CapabilityNode[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.capabilities.values())
      .filter(cap => 
        cap.name.toLowerCase().includes(lowerQuery) ||
        cap.description.toLowerCase().includes(lowerQuery) ||
        cap.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }

  /**
   * Get dependencies for a capability
   */
  getDependencies(id: string): string[] {
    return Array.from(this.adjacency.get(id) || []);
  }

  /**
   * Check if preconditions are met
   */
  checkPreconditions(
    capability: CapabilityNode,
    inputs: any,
    context: ExecutionContext
  ): { met: boolean; missing: string[] } {
    const missing: string[] = [];

    // Check required inputs
    for (const required of capability.preconditions.required_inputs) {
      if (!(required in inputs)) {
        missing.push(`input:${required}`);
      }
    }

    // Check required artifacts
    if (capability.preconditions.required_artifacts) {
      for (const artifact of capability.preconditions.required_artifacts) {
        if (!context.whiteboard.has(artifact)) {
          missing.push(`artifact:${artifact}`);
        }
      }
    }

    // Check budget
    if (capability.preconditions.budget_required) {
      const required = capability.preconditions.budget_required;
      const remaining = context.budget_remaining;
      
      if (required.expected_tokens_in && remaining.expected_tokens_in < required.expected_tokens_in) {
        missing.push('budget:tokens_in');
      }
      if (required.cpu_ms && remaining.cpu_ms < required.cpu_ms) {
        missing.push('budget:cpu_ms');
      }
    }

    return { met: missing.length === 0, missing };
  }

  /**
   * Estimate total cost for a capability chain
   */
  estimateCost(capabilityIds: string[]): CostEstimate {
    const total: CostEstimate = {
      expected_tokens_in: 0,
      expected_tokens_out: 0,
      cpu_ms: 0,
      subrequests: 0,
      memory_kb: 0
    };

    for (const id of capabilityIds) {
      const cap = this.capabilities.get(id);
      if (cap) {
        total.expected_tokens_in += cap.cost_estimate.expected_tokens_in;
        total.expected_tokens_out += cap.cost_estimate.expected_tokens_out;
        total.cpu_ms += cap.cost_estimate.cpu_ms;
        total.subrequests += cap.cost_estimate.subrequests;
        total.memory_kb = (total.memory_kb || 0) + (cap.cost_estimate.memory_kb || 0);
      }
    }

    return total;
  }

  /**
   * Get all registered capability IDs
   */
  getAllIds(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Get capability count
   */
  size(): number {
    return this.capabilities.size;
  }
}

/**
 * Global capability graph instance
 */
export const globalCapabilityGraph = new CapabilityGraph();

