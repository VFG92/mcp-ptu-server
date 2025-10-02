/**
 * Guardrail Generator
 * 
 * Automatically generates analytical guardrails from existing capability metadata.
 * This allows us to enrich 58+ existing capabilities with guardrail perspectives
 * WITHOUT modifying each capability individually.
 * 
 * Architecture:
 * - Input: CapabilityNode (existing capability definition)
 * - Output: GuardrailOutput (analytical perspectives)
 * - Integration: Called in execute_plan_step before capability execution
 * - Result: LLM receives both guardrails + traditional output
 */

import type { CapabilityNode } from './capability-graph.js';
import type { GuardrailOutput } from './guardrail-output.js';

/**
 * Category-specific guardrail templates
 */
const CATEGORY_TEMPLATES = {
  market: {
    key_questions_template: [
      'What is the market size and growth trajectory?',
      'Who are the key players and what is the competitive landscape?',
      'What are the market trends and drivers?',
      'What are the barriers to entry and market dynamics?'
    ],
    common_dimensions: ['market_size', 'competitive_landscape', 'growth_drivers', 'market_structure'],
    common_trade_offs: [
      { trade_off: 'Market definition breadth', option_a: 'Broad TAM', option_b: 'Narrow focus', context: 'Affects addressable market and competitive set' }
    ],
    common_risks: [
      { risk: 'Market definition mismatch', severity: 'high' as const, indicators: ['Conflicting size estimates', 'Unclear boundaries'] }
    ]
  },
  
  financial: {
    key_questions_template: [
      'What are the key financial metrics and their trends?',
      'What are the revenue and cost drivers?',
      'What is the profitability and cash flow profile?',
      'What are the financial risks and sensitivities?'
    ],
    common_dimensions: ['revenue_model', 'cost_structure', 'profitability', 'cash_flow', 'valuation'],
    common_trade_offs: [
      { trade_off: 'Precision vs speed', option_a: 'Detailed financial model', option_b: 'Quick estimate', context: 'Early stage vs detailed business case' }
    ],
    common_risks: [
      { risk: 'Unrealistic assumptions', severity: 'high' as const, indicators: ['Growth rates >50% sustained', 'Margins above industry'] }
    ]
  },
  
  operational: {
    key_questions_template: [
      'What are the key operational processes and their efficiency?',
      'What are the capacity constraints and bottlenecks?',
      'What are the quality and performance metrics?',
      'What are the operational risks and improvement opportunities?'
    ],
    common_dimensions: ['process_efficiency', 'capacity_utilization', 'quality_metrics', 'bottlenecks'],
    common_trade_offs: [
      { trade_off: 'Efficiency vs flexibility', option_a: 'Optimized for current state', option_b: 'Flexible for change', context: 'Stable vs dynamic environment' }
    ],
    common_risks: [
      { risk: 'Process bottlenecks', severity: 'medium' as const, indicators: ['Long wait times', 'Low throughput'] }
    ]
  },
  
  risk: {
    key_questions_template: [
      'What are the key risk categories and their severity?',
      'What are the risk drivers and triggers?',
      'What are the mitigation strategies and controls?',
      'What are the residual risks and monitoring approaches?'
    ],
    common_dimensions: ['risk_identification', 'risk_assessment', 'mitigation_strategies', 'monitoring'],
    common_trade_offs: [
      { trade_off: 'Risk tolerance', option_a: 'Conservative approach', option_b: 'Aggressive approach', context: 'Risk appetite and strategic goals' }
    ],
    common_risks: [
      { risk: 'Incomplete risk identification', severity: 'high' as const, indicators: ['Focus only on obvious risks', 'No tail risk analysis'] }
    ]
  },
  
  strategic: {
    key_questions_template: [
      'What are the strategic objectives and priorities?',
      'What are the strategic options and trade-offs?',
      'What are the competitive advantages and positioning?',
      'What are the strategic risks and dependencies?'
    ],
    common_dimensions: ['strategic_objectives', 'competitive_positioning', 'value_proposition', 'strategic_risks'],
    common_trade_offs: [
      { trade_off: 'Time horizon', option_a: 'Short-term wins', option_b: 'Long-term value', context: 'Stakeholder expectations and market dynamics' }
    ],
    common_risks: [
      { risk: 'Strategy-execution gap', severity: 'high' as const, indicators: ['Unclear priorities', 'Resource misalignment'] }
    ]
  },
  
  commercial: {
    key_questions_template: [
      'What is the value proposition and customer segments?',
      'What are the pricing and revenue models?',
      'What are the go-to-market strategies and channels?',
      'What are the customer acquisition and retention dynamics?'
    ],
    common_dimensions: ['value_proposition', 'pricing_strategy', 'customer_segments', 'gtm_strategy'],
    common_trade_offs: [
      { trade_off: 'Pricing strategy', option_a: 'Volume-based', option_b: 'Value-based', context: 'Market maturity and competitive dynamics' }
    ],
    common_risks: [
      { risk: 'Customer acquisition cost too high', severity: 'medium' as const, indicators: ['CAC > LTV', 'Long payback period'] }
    ]
  }
};

/**
 * Generate guardrails from capability metadata
 */
export function generateGuardrails(capability: CapabilityNode): GuardrailOutput {
  const category = capability.category;
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.strategic; // Fallback to strategic
  
  // Generate contextual key questions
  const key_questions = [
    `What insights does "${capability.name}" provide for this analysis?`,
    `What are the key assumptions underlying the ${capability.name} analysis?`,
    ...template.key_questions_template.map(q => q.replace(/\b(market|financial|operational|risk|strategic|commercial)\b/gi, category))
  ];
  
  // Generate analysis dimensions from capability output contract
  const analysis_dimensions = template.common_dimensions.map(dim => ({
    dimension: dim,
    description: `${dim.replace(/_/g, ' ')} analysis from ${capability.name}`,
    considerations: [
      `How does ${capability.name} measure ${dim}?`,
      `What data sources are used for ${dim}?`,
      `What are the limitations of ${dim} analysis?`,
      `How does ${dim} relate to other dimensions?`
    ],
    data_sources: [`${capability.name} output`, 'Industry benchmarks', 'Historical data']
  }));
  
  // Add capability-specific dimension if output contract has schema
  if (capability.output_contract?.schema) {
    analysis_dimensions.unshift({
      dimension: capability.id,
      description: capability.description,
      considerations: [
        `What does ${capability.name} reveal about the situation?`,
        `How reliable is the ${capability.name} output?`,
        `What are the key takeaways from ${capability.name}?`,
        `How does ${capability.name} inform decision-making?`
      ],
      data_sources: [capability.name]
    });
  }
  
  // Use template trade-offs
  const trade_offs = template.common_trade_offs;
  
  // Generate risks specific to this capability
  const risks_to_monitor = [
    ...template.common_risks,
    {
      risk: `${capability.name} output may be incomplete or outdated`,
      severity: 'medium' as const,
      indicators: [
        'Data sources older than expected',
        'Missing key dimensions',
        'Conflicting with other analyses'
      ],
      mitigation_approaches: [
        'Triangulate with other capabilities',
        'Validate assumptions',
        'Update with recent data'
      ]
    }
  ];
  
  // Generate validation criteria
  const validation_criteria = [
    {
      criterion: `${capability.name} output completeness`,
      method: 'Check that all expected fields are present and non-null',
      threshold: 'All required fields from output contract'
    },
    {
      criterion: `${capability.name} output reasonableness`,
      method: 'Compare with industry benchmarks and historical patterns',
      threshold: 'Within 2 standard deviations of expected range'
    }
  ];
  
  // Generate context
  const context = {
    assumptions: [
      `${capability.name} provides accurate and current information`,
      `Output is representative of the actual situation`,
      `Methodology is appropriate for the context`
    ],
    constraints: [
      `Limited to ${capability.name} perspective`,
      `May not capture all nuances`,
      `Dependent on data availability and quality`
    ],
    dependencies: [
      'Other capabilities for comprehensive view',
      'Domain expertise for interpretation',
      'Contextual information for validation'
    ]
  };
  
  // Generate suggested next steps
  const suggested_next_steps = [
    `Analyze ${capability.name} output in detail`,
    `Cross-reference with other capability outputs`,
    `Identify gaps and areas needing deeper analysis`,
    `Validate key assumptions and findings`,
    `Synthesize insights across multiple perspectives`
  ];
  
  return {
    key_questions,
    analysis_dimensions,
    trade_offs,
    risks_to_monitor,
    validation_criteria,
    context,
    suggested_next_steps
  };
}

/**
 * Cache for generated guardrails (performance optimization)
 */
const guardrailCache = new Map<string, GuardrailOutput>();

/**
 * Get guardrails for a capability (with caching)
 */
export function getGuardrails(capability: CapabilityNode): GuardrailOutput {
  const cacheKey = `${capability.id}_${capability.version}`;
  
  if (guardrailCache.has(cacheKey)) {
    return guardrailCache.get(cacheKey)!;
  }
  
  const guardrails = generateGuardrails(capability);
  guardrailCache.set(cacheKey, guardrails);
  
  return guardrails;
}

/**
 * Clear guardrail cache (for testing or when capabilities are updated)
 */
export function clearGuardrailCache(): void {
  guardrailCache.clear();
}

