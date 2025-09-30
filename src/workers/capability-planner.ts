/**
 * Capability Planner
 * 
 * Maps user requests to capability chains using search algorithms.
 * Optimizes for coverage under budget constraints.
 */

import type {
  CapabilityNode,
  CostEstimate,
  ExecutionContext
} from './capability-graph.js';
import { CapabilityGraph } from './capability-graph.js';
import type { BudgetConstraints } from './budget-scheduler.js';

/**
 * Planning request
 */
export interface PlanningRequest {
  task_description: string;
  required_outputs?: string[];   // Specific artifacts needed
  preferred_categories?: string[]; // Preferred capability categories
  budget: BudgetConstraints;
  context: ExecutionContext;
}

/**
 * Capability chain - sequence of capabilities to execute
 */
export interface CapabilityChain {
  capabilities: string[];         // Capability IDs in execution order
  estimated_cost: CostEstimate;
  coverage_score: number;         // 0-1, how well it addresses the request
  confidence_score: number;       // 0-1, expected quality
  rationale: string;
}

/**
 * Planning result
 */
export interface PlanningResult {
  recommended_chain: CapabilityChain;
  alternatives: CapabilityChain[];
  coverage_analysis: {
    requested_aspects: string[];
    covered_aspects: string[];
    missing_aspects: string[];
  };
}

/**
 * Capability Planner
 */
export class CapabilityPlanner {
  private graph: CapabilityGraph;

  constructor(graph: CapabilityGraph) {
    this.graph = graph;
  }

  /**
   * Plan capability chain for a request
   */
  async plan(request: PlanningRequest): Promise<PlanningResult> {
    // Extract key aspects from task description
    const aspects = this.extractAspects(request.task_description);
    
    // Find candidate capabilities
    const candidates = this.findCandidateCapabilities(
      request.task_description,
      request.preferred_categories
    );

    // Generate multiple chains using beam search
    const chains = this.beamSearch(
      candidates,
      request.budget,
      aspects,
      request.context
    );

    // Rank chains by coverage and cost
    const rankedChains = this.rankChains(chains, aspects, request.budget);

    // Analyze coverage
    const coverage = this.analyzeCoverage(
      rankedChains[0],
      aspects,
      request.required_outputs
    );

    return {
      recommended_chain: rankedChains[0],
      alternatives: rankedChains.slice(1, 4),
      coverage_analysis: coverage
    };
  }

  /**
   * Extract key aspects from task description
   */
  private extractAspects(description: string): string[] {
    const aspects: string[] = [];
    const lower = description.toLowerCase();

    // Market aspects
    if (lower.includes('market') || lower.includes('competition') || lower.includes('industry')) {
      aspects.push('market_analysis');
    }
    if (lower.includes('tam') || lower.includes('sam') || lower.includes('market size')) {
      aspects.push('market_sizing');
    }
    if (lower.includes('competitor') || lower.includes('competitive')) {
      aspects.push('competitive_analysis');
    }

    // Financial aspects
    if (lower.includes('financial') || lower.includes('economics') || lower.includes('revenue')) {
      aspects.push('financial_analysis');
    }
    if (lower.includes('ltv') || lower.includes('cac') || lower.includes('unit economics')) {
      aspects.push('unit_economics');
    }
    if (lower.includes('pricing') || lower.includes('price')) {
      aspects.push('pricing_analysis');
    }

    // Risk aspects
    if (lower.includes('risk') || lower.includes('threat')) {
      aspects.push('risk_analysis');
    }
    if (lower.includes('regulatory') || lower.includes('compliance')) {
      aspects.push('regulatory_analysis');
    }

    // Strategic aspects
    if (lower.includes('strategy') || lower.includes('strategic')) {
      aspects.push('strategic_analysis');
    }
    if (lower.includes('stakeholder')) {
      aspects.push('stakeholder_analysis');
    }
    if (lower.includes('channel') || lower.includes('go-to-market') || lower.includes('gtm')) {
      aspects.push('channel_analysis');
    }

    // Default to comprehensive if nothing specific
    if (aspects.length === 0) {
      aspects.push('comprehensive_analysis');
    }

    return aspects;
  }

  /**
   * Find candidate capabilities based on request
   */
  private findCandidateCapabilities(
    description: string,
    preferredCategories?: string[]
  ): CapabilityNode[] {
    let candidates: CapabilityNode[] = [];

    // Search by description
    const searchResults = this.graph.search(description);
    candidates.push(...searchResults);

    // Add by category if specified
    if (preferredCategories) {
      for (const category of preferredCategories) {
        const categoryCaps = this.graph.getByCategory(category as any);
        candidates.push(...categoryCaps);
      }
    }

    // Remove duplicates
    const seen = new Set<string>();
    candidates = candidates.filter(cap => {
      if (seen.has(cap.id)) return false;
      seen.add(cap.id);
      return true;
    });

    return candidates;
  }

  /**
   * Beam search to find optimal capability chains
   */
  private beamSearch(
    candidates: CapabilityNode[],
    budget: BudgetConstraints,
    aspects: string[],
    context: ExecutionContext,
    beamWidth: number = 5
  ): CapabilityChain[] {
    // Start with single-capability chains
    let beam: CapabilityChain[] = candidates.map(cap => ({
      capabilities: [cap.id],
      estimated_cost: cap.cost_estimate,
      coverage_score: this.calculateCoverage([cap], aspects),
      confidence_score: cap.expected_precision,
      rationale: `Single capability: ${cap.name}`
    }));

    // Filter by budget
    beam = beam.filter(chain => this.fitsInBudget(chain.estimated_cost, budget));

    // Sort by coverage * confidence
    beam.sort((a, b) => 
      (b.coverage_score * b.confidence_score) - (a.coverage_score * a.confidence_score)
    );

    // Keep top beamWidth
    beam = beam.slice(0, beamWidth);

    // Expand beam by adding compatible capabilities
    const maxDepth = 5;
    for (let depth = 1; depth < maxDepth; depth++) {
      const expanded: CapabilityChain[] = [];

      for (const chain of beam) {
        // Try adding each candidate
        for (const candidate of candidates) {
          // Skip if already in chain
          if (chain.capabilities.includes(candidate.id)) continue;

          // Check if preconditions can be met
          const newChain: CapabilityChain = {
            capabilities: [...chain.capabilities, candidate.id],
            estimated_cost: this.addCosts(chain.estimated_cost, candidate.cost_estimate),
            coverage_score: 0,
            confidence_score: 0,
            rationale: ''
          };

          // Check budget
          if (!this.fitsInBudget(newChain.estimated_cost, budget)) continue;

          // Calculate scores
          const caps = newChain.capabilities.map(id => this.graph.get(id)!).filter(c => c);
          newChain.coverage_score = this.calculateCoverage(caps, aspects);
          newChain.confidence_score = caps.reduce((sum, c) => sum + c.expected_precision, 0) / caps.length;
          newChain.rationale = `Chain of ${caps.length}: ${caps.map(c => c.name).join(' → ')}`;

          expanded.push(newChain);
        }
      }

      // Merge with existing beam
      beam.push(...expanded);

      // Sort and prune
      beam.sort((a, b) => 
        (b.coverage_score * b.confidence_score) - (a.coverage_score * a.confidence_score)
      );
      beam = beam.slice(0, beamWidth);
    }

    return beam;
  }

  /**
   * Calculate coverage score for capabilities
   */
  private calculateCoverage(capabilities: CapabilityNode[], aspects: string[]): number {
    const covered = new Set<string>();

    for (const cap of capabilities) {
      // Map capability to aspects it covers
      if (cap.category === 'market') {
        covered.add('market_analysis');
        if (cap.id === 'tam_sam_som_build') covered.add('market_sizing');
        if (cap.id === 'competitor_analysis') covered.add('competitive_analysis');
      }
      if (cap.category === 'financial') {
        covered.add('financial_analysis');
        if (cap.id === 'unit_economics_model') covered.add('unit_economics');
        if (cap.id === 'pricing_sensitivity') covered.add('pricing_analysis');
      }
      if (cap.category === 'risk') {
        covered.add('risk_analysis');
        if (cap.id === 'regulatory_scan') covered.add('regulatory_analysis');
      }
      if (cap.category === 'strategic') {
        covered.add('strategic_analysis');
        if (cap.id === 'stakeholder_mapping') covered.add('stakeholder_analysis');
        if (cap.id === 'channel_economics') covered.add('channel_analysis');
      }
    }

    // Handle comprehensive analysis
    if (aspects.includes('comprehensive_analysis')) {
      return covered.size / 8; // Normalize by typical number of aspects
    }

    // Calculate coverage
    const coveredCount = aspects.filter(a => covered.has(a)).length;
    return aspects.length > 0 ? coveredCount / aspects.length : 0;
  }

  /**
   * Rank chains by multiple criteria
   */
  private rankChains(
    chains: CapabilityChain[],
    aspects: string[],
    budget: BudgetConstraints
  ): CapabilityChain[] {
    return chains.sort((a, b) => {
      // Primary: coverage score
      const coverageDiff = b.coverage_score - a.coverage_score;
      if (Math.abs(coverageDiff) > 0.1) return coverageDiff;

      // Secondary: confidence
      const confidenceDiff = b.confidence_score - a.confidence_score;
      if (Math.abs(confidenceDiff) > 0.05) return confidenceDiff;

      // Tertiary: cost efficiency (lower is better)
      const aCostRatio = this.calculateCostRatio(a.estimated_cost, budget);
      const bCostRatio = this.calculateCostRatio(b.estimated_cost, budget);
      return aCostRatio - bCostRatio;
    });
  }

  /**
   * Analyze coverage gaps
   */
  private analyzeCoverage(
    chain: CapabilityChain,
    aspects: string[],
    requiredOutputs?: string[]
  ): {
    requested_aspects: string[];
    covered_aspects: string[];
    missing_aspects: string[];
  } {
    const capabilities = chain.capabilities
      .map(id => this.graph.get(id))
      .filter((c): c is CapabilityNode => c !== undefined);

    const covered = new Set<string>();
    for (const cap of capabilities) {
      if (cap.category === 'market') covered.add('market_analysis');
      if (cap.category === 'financial') covered.add('financial_analysis');
      if (cap.category === 'risk') covered.add('risk_analysis');
      if (cap.category === 'strategic') covered.add('strategic_analysis');
    }

    const missing = aspects.filter(a => !covered.has(a));

    return {
      requested_aspects: aspects,
      covered_aspects: Array.from(covered),
      missing_aspects: missing
    };
  }

  // Helper methods
  private fitsInBudget(cost: CostEstimate, budget: BudgetConstraints): boolean {
    return (
      cost.expected_tokens_in <= budget.max_tokens_in &&
      cost.expected_tokens_out <= budget.max_tokens_out &&
      cost.cpu_ms <= budget.max_cpu_ms &&
      cost.subrequests <= budget.max_subrequests
    );
  }

  private addCosts(a: CostEstimate, b: CostEstimate): CostEstimate {
    return {
      expected_tokens_in: a.expected_tokens_in + b.expected_tokens_in,
      expected_tokens_out: a.expected_tokens_out + b.expected_tokens_out,
      cpu_ms: a.cpu_ms + b.cpu_ms,
      subrequests: a.subrequests + b.subrequests,
      memory_kb: (a.memory_kb || 0) + (b.memory_kb || 0)
    };
  }

  private calculateCostRatio(cost: CostEstimate, budget: BudgetConstraints): number {
    return (
      cost.expected_tokens_in / budget.max_tokens_in +
      cost.expected_tokens_out / budget.max_tokens_out +
      cost.cpu_ms / budget.max_cpu_ms +
      cost.subrequests / budget.max_subrequests
    ) / 4;
  }
}

