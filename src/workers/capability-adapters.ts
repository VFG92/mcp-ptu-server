/**
 * Capability Adapters (formerly "Personas")
 * 
 * Transform static personas into views/presets of the capability graph.
 * Each adapter is a weighted set of capabilities, not a rigid role.
 */

import type { CapabilityGraph } from './capability-graph.js';

/**
 * Capability Adapter - a view of the capability graph
 */
export interface CapabilityAdapter {
  id: string;
  name: string;
  description: string;
  focus_areas: string[];
  
  // Weighted capability preferences
  capability_weights: Record<string, number>; // capability_id -> weight (0-1)
  
  // Default capabilities to include
  default_capabilities: string[];
  
  // Categories to prioritize
  preferred_categories: Array<'market' | 'financial' | 'operational' | 'risk' | 'strategic' | 'commercial'>;
  
  // Thinking style (for prompt engineering when needed)
  thinking_style: string;
}

/**
 * Strategy Adapter - focuses on strategic analysis
 */
export const strategyAdapter: CapabilityAdapter = {
  id: 'strategy',
  name: 'Strategy Advisor',
  description: 'Strategic analysis focusing on market positioning, competitive dynamics, and long-term value creation',
  focus_areas: ['competitive positioning', 'market dynamics', 'strategic planning', 'value creation'],
  
  capability_weights: {
    'market_scan': 1.0,
    'competitor_analysis': 1.0,
    'tam_sam_som_build': 0.9,
    'stakeholder_mapping': 0.8,
    'channel_economics': 0.7,
    'risk_register_build': 0.6,
    'unit_economics_model': 0.5,
    'pricing_sensitivity': 0.4,
    'regulatory_scan': 0.3
  },
  
  default_capabilities: [
    'market_scan',
    'competitor_analysis',
    'tam_sam_som_build'
  ],
  
  preferred_categories: ['market', 'strategic'],
  
  thinking_style: 'Strategic, framework-driven, long-term focused. Uses Porter\'s 5 Forces, SWOT, and strategic frameworks.'
};

/**
 * Finance Adapter - focuses on financial analysis
 */
export const financeAdapter: CapabilityAdapter = {
  id: 'finance',
  name: 'Finance Advisor',
  description: 'Financial analysis focusing on unit economics, pricing, and financial viability',
  focus_areas: ['unit economics', 'financial modeling', 'pricing strategy', 'ROI analysis'],
  
  capability_weights: {
    'unit_economics_model': 1.0,
    'pricing_sensitivity': 1.0,
    'tam_sam_som_build': 0.8,
    'channel_economics': 0.7,
    'risk_register_build': 0.6,
    'market_scan': 0.5,
    'competitor_analysis': 0.4,
    'regulatory_scan': 0.3,
    'stakeholder_mapping': 0.2
  },
  
  default_capabilities: [
    'unit_economics_model',
    'pricing_sensitivity',
    'tam_sam_som_build'
  ],
  
  preferred_categories: ['financial', 'commercial'],
  
  thinking_style: 'Analytical, data-driven, ROI-focused. Emphasizes financial metrics, sensitivity analysis, and risk-adjusted returns.'
};

/**
 * Commercial Adapter - focuses on go-to-market
 */
export const commercialAdapter: CapabilityAdapter = {
  id: 'commercial',
  name: 'Commercial Advisor',
  description: 'Go-to-market analysis focusing on channels, pricing, and customer acquisition',
  focus_areas: ['go-to-market strategy', 'channel optimization', 'pricing', 'customer acquisition'],
  
  capability_weights: {
    'channel_economics': 1.0,
    'pricing_sensitivity': 1.0,
    'unit_economics_model': 0.9,
    'competitor_analysis': 0.8,
    'market_scan': 0.7,
    'tam_sam_som_build': 0.6,
    'stakeholder_mapping': 0.4,
    'risk_register_build': 0.3,
    'regulatory_scan': 0.2
  },
  
  default_capabilities: [
    'channel_economics',
    'pricing_sensitivity',
    'unit_economics_model'
  ],
  
  preferred_categories: ['commercial', 'financial', 'market'],
  
  thinking_style: 'Customer-focused, pragmatic, execution-oriented. Emphasizes market fit, sales efficiency, and customer economics.'
};

/**
 * Risk Adapter - focuses on risk and compliance
 */
export const riskAdapter: CapabilityAdapter = {
  id: 'risk',
  name: 'Risk Advisor',
  description: 'Risk analysis focusing on threats, compliance, and mitigation strategies',
  focus_areas: ['risk identification', 'compliance', 'mitigation planning', 'regulatory landscape'],
  
  capability_weights: {
    'risk_register_build': 1.0,
    'regulatory_scan': 1.0,
    'competitor_analysis': 0.6,
    'market_scan': 0.5,
    'stakeholder_mapping': 0.5,
    'unit_economics_model': 0.4,
    'channel_economics': 0.3,
    'pricing_sensitivity': 0.2,
    'tam_sam_som_build': 0.2
  },
  
  default_capabilities: [
    'risk_register_build',
    'regulatory_scan'
  ],
  
  preferred_categories: ['risk', 'operational'],
  
  thinking_style: 'Risk-aware, thorough, compliance-focused. Emphasizes threat identification, mitigation strategies, and regulatory requirements.'
};

/**
 * Comprehensive Adapter - balanced view across all areas
 */
export const comprehensiveAdapter: CapabilityAdapter = {
  id: 'comprehensive',
  name: 'Comprehensive Advisor',
  description: 'Balanced analysis across strategy, finance, commercial, and risk dimensions',
  focus_areas: ['holistic analysis', 'integrated perspective', 'cross-functional insights'],
  
  capability_weights: {
    'market_scan': 0.9,
    'competitor_analysis': 0.9,
    'tam_sam_som_build': 0.9,
    'unit_economics_model': 0.9,
    'pricing_sensitivity': 0.8,
    'channel_economics': 0.8,
    'risk_register_build': 0.8,
    'regulatory_scan': 0.7,
    'stakeholder_mapping': 0.7
  },
  
  default_capabilities: [
    'market_scan',
    'tam_sam_som_build',
    'unit_economics_model',
    'risk_register_build'
  ],
  
  preferred_categories: ['market', 'financial', 'strategic', 'risk'],
  
  thinking_style: 'Holistic, integrative, balanced. Considers multiple perspectives and trade-offs across strategy, finance, operations, and risk.'
};

/**
 * All available adapters
 */
export const CAPABILITY_ADAPTERS: Record<string, CapabilityAdapter> = {
  strategy: strategyAdapter,
  finance: financeAdapter,
  commercial: commercialAdapter,
  risk: riskAdapter,
  comprehensive: comprehensiveAdapter
};

/**
 * Adapter aliases for backward compatibility
 */
export const ADAPTER_ALIASES: Record<string, string> = {
  // Strategy aliases
  'strategy_consultant': 'strategy',
  'strategist': 'strategy',
  'business_strategist': 'strategy',
  
  // Finance aliases
  'financial_analyst': 'finance',
  'finance_analyst': 'finance',
  'cfo': 'finance',
  'finance_advisor': 'finance',
  
  // Commercial aliases
  'marketing_strategist': 'commercial',
  'marketing': 'commercial',
  'sales': 'commercial',
  'gtm': 'commercial',
  'go_to_market': 'commercial',
  
  // Risk aliases
  'risk_manager': 'risk',
  'compliance': 'risk',
  'risk_analyst': 'risk',
  
  // Comprehensive aliases
  'synthesizer': 'comprehensive',
  'integrator': 'comprehensive',
  'generalist': 'comprehensive'
};

/**
 * Get adapter by ID or alias
 */
export function getAdapter(id: string): CapabilityAdapter | undefined {
  // Try direct lookup
  let adapter = CAPABILITY_ADAPTERS[id];
  if (adapter) return adapter;
  
  // Try alias
  const aliasedId = ADAPTER_ALIASES[id];
  if (aliasedId) {
    return CAPABILITY_ADAPTERS[aliasedId];
  }
  
  return undefined;
}

/**
 * Get all adapters
 */
export function getAllAdapters(): CapabilityAdapter[] {
  return Object.values(CAPABILITY_ADAPTERS);
}

/**
 * Apply adapter weights to capability selection
 */
export function applyAdapterWeights(
  capabilities: string[],
  adapter: CapabilityAdapter
): Array<{ capability_id: string; weight: number }> {
  return capabilities.map(id => ({
    capability_id: id,
    weight: adapter.capability_weights[id] || 0.5 // Default weight if not specified
  })).sort((a, b) => b.weight - a.weight);
}

/**
 * Get recommended capabilities for an adapter
 */
export function getRecommendedCapabilities(
  adapter: CapabilityAdapter,
  graph: CapabilityGraph,
  maxCapabilities: number = 5
): string[] {
  // Start with defaults
  const recommended = new Set<string>(adapter.default_capabilities);
  
  // Add high-weight capabilities
  const weighted = Object.entries(adapter.capability_weights)
    .filter(([id, weight]) => weight >= 0.7)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);
  
  for (const id of weighted) {
    if (recommended.size >= maxCapabilities) break;
    recommended.add(id);
  }
  
  // Fill remaining with capabilities from preferred categories
  if (recommended.size < maxCapabilities) {
    for (const category of adapter.preferred_categories) {
      const categoryCaps = graph.getByCategory(category);
      for (const cap of categoryCaps) {
        if (recommended.size >= maxCapabilities) break;
        recommended.add(cap.id);
      }
    }
  }
  
  return Array.from(recommended);
}

