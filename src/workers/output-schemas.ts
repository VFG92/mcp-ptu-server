/**
 * Output Schemas for Business Artifacts
 * 
 * Strong contracts with JSON Schema validation, units, ranges, and evidence requirements.
 */

import { z } from 'zod';

/**
 * Evidence schema (reusable)
 */
export const EvidenceSchema = z.object({
  type: z.enum(['calc', 'retrieval', 'precedent', 'assumption', 'simulation', 'heuristic']),
  source: z.string().optional(),
  formula: z.string().optional(),
  inputs: z.record(z.any()).optional(),
  rationale: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  timestamp: z.number()
});

/**
 * Unit Economics Schema
 */
export const UnitEconomicsSchema = z.object({
  ltv: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    calculation_method: z.string(),
    assumptions: z.array(z.string()),
    evidence: z.array(EvidenceSchema)
  }),
  cac: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    breakdown: z.record(z.number()),
    channels: z.array(z.object({
      channel: z.string(),
      cac: z.number(),
      volume: z.number()
    })),
    evidence: z.array(EvidenceSchema)
  }),
  ltv_cac_ratio: z.object({
    value: z.number().positive(),
    assessment: z.enum(['excellent', 'good', 'acceptable', 'poor']),
    benchmark: z.number(),
    evidence: z.array(EvidenceSchema)
  }),
  payback_period_months: z.object({
    value: z.number().positive(),
    unit: z.literal('months'),
    assessment: z.enum(['excellent', 'good', 'acceptable', 'poor'])
  }),
  contribution_margin: z.object({
    value: z.number().min(0).max(100),
    unit: z.literal('%'),
    breakdown: z.object({
      revenue: z.number(),
      cogs: z.number(),
      gross_profit: z.number()
    })
  }),
  sensitivity: z.object({
    churn_rate: z.object({
      base: z.number(),
      plus_10pct: z.number(),
      minus_10pct: z.number()
    }),
    pricing: z.object({
      base: z.number(),
      plus_10pct: z.number(),
      minus_10pct: z.number()
    })
  }),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type UnitEconomics = z.infer<typeof UnitEconomicsSchema>;

/**
 * TAM/SAM/SOM Schema
 */
export const TAM_SAM_SOM_Schema = z.object({
  tam: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    methodology: z.string(),
    assumptions: z.array(z.string()),
    evidence: z.array(EvidenceSchema)
  }),
  sam: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    percentage_of_tam: z.number().min(0).max(100),
    rationale: z.string(),
    evidence: z.array(EvidenceSchema)
  }),
  som: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    percentage_of_sam: z.number().min(0).max(100),
    year_1: z.number().positive(),
    year_3: z.number().positive(),
    year_5: z.number().positive(),
    rationale: z.string(),
    evidence: z.array(EvidenceSchema)
  }),
  bottoms_up_validation: z.object({
    customers: z.number().int().positive(),
    avg_revenue_per_customer: z.number().positive(),
    total: z.number().positive()
  }).optional(),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type TAM_SAM_SOM = z.infer<typeof TAM_SAM_SOM_Schema>;

/**
 * Risk Register Schema
 */
export const RiskRegisterSchema = z.object({
  risks: z.array(z.object({
    id: z.string(),
    category: z.enum(['market', 'execution', 'financial', 'regulatory', 'technology', 'operational']),
    description: z.string(),
    likelihood: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
    impact: z.enum(['critical', 'high', 'medium', 'low', 'minimal']),
    severity_score: z.number().int().min(1).max(25),
    current_mitigations: z.array(z.string()),
    additional_mitigations: z.array(z.object({
      action: z.string(),
      cost: z.string(),
      effectiveness: z.enum(['high', 'medium', 'low'])
    })),
    owner: z.string().optional(),
    status: z.enum(['identified', 'assessed', 'mitigated', 'accepted']),
    evidence: z.array(EvidenceSchema).optional()
  })),
  risk_summary: z.object({
    total_risks: z.number().int().nonnegative(),
    critical_risks: z.number().int().nonnegative(),
    high_risks: z.number().int().nonnegative(),
    overall_risk_level: z.enum(['very_high', 'high', 'moderate', 'low']),
    top_3_risks: z.array(z.string())
  }),
  risk_matrix: z.array(z.array(z.number())),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type RiskRegister = z.infer<typeof RiskRegisterSchema>;

/**
 * Market Map Schema
 */
export const MarketMapSchema = z.object({
  market_size: z.object({
    value: z.number().positive(),
    unit: z.literal('USD'),
    year: z.number().int(),
    evidence: z.array(EvidenceSchema)
  }),
  growth_rate: z.object({
    value: z.number(),
    unit: z.literal('%'),
    period: z.string(),
    evidence: z.array(EvidenceSchema)
  }),
  key_players: z.array(z.object({
    name: z.string(),
    market_share: z.number().min(0).max(100).optional(),
    description: z.string(),
    position: z.enum(['leader', 'challenger', 'follower', 'niche']).optional()
  })),
  market_structure: z.enum(['monopoly', 'oligopoly', 'monopolistic_competition', 'perfect_competition']),
  trends: z.array(z.string()),
  barriers_to_entry: z.array(z.string()).optional(),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type MarketMap = z.infer<typeof MarketMapSchema>;

/**
 * Pricing Analysis Schema
 */
export const PricingAnalysisSchema = z.object({
  price_elasticity: z.object({
    coefficient: z.number().negative(),
    interpretation: z.string(),
    evidence: z.array(EvidenceSchema)
  }),
  optimal_price_range: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    recommended: z.number().positive(),
    rationale: z.string(),
    evidence: z.array(EvidenceSchema)
  }),
  revenue_scenarios: z.array(z.object({
    price: z.number().positive(),
    volume: z.number().nonnegative(),
    revenue: z.number().nonnegative(),
    margin: z.number().min(0).max(1)
  })),
  pricing_fences: z.array(z.object({
    segment: z.string(),
    price_point: z.number().positive(),
    value_drivers: z.array(z.string())
  })),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type PricingAnalysis = z.infer<typeof PricingAnalysisSchema>;

/**
 * Channel Economics Schema
 */
export const ChannelEconomicsSchema = z.object({
  channels: z.array(z.object({
    name: z.string(),
    type: z.enum(['direct_sales', 'inside_sales', 'digital_marketing', 'channel_partners', 'self_service']),
    cac: z.number().positive(),
    conversion_rate: z.number().min(0).max(1),
    sales_cycle_days: z.number().int().positive(),
    avg_deal_size: z.number().positive(),
    capacity: z.number().int().positive(),
    efficiency_score: z.number().min(0).max(1),
    best_for_segments: z.array(z.string()),
    pros: z.array(z.string()),
    cons: z.array(z.string())
  })),
  recommended_mix: z.array(z.object({
    channel: z.string(),
    allocation_pct: z.number().min(0).max(100),
    rationale: z.string()
  })),
  blended_metrics: z.object({
    blended_cac: z.number().positive(),
    blended_conversion: z.number().min(0).max(1),
    blended_cycle_days: z.number().positive()
  }),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type ChannelEconomics = z.infer<typeof ChannelEconomicsSchema>;

/**
 * Stakeholder Map Schema
 */
export const StakeholderMapSchema = z.object({
  stakeholders: z.array(z.object({
    name: z.string(),
    role: z.string(),
    influence: z.enum(['very_high', 'high', 'medium', 'low']),
    interest: z.enum(['very_high', 'high', 'medium', 'low']),
    position: z.enum(['champion', 'supporter', 'neutral', 'skeptic', 'blocker']),
    concerns: z.array(z.string()),
    motivations: z.array(z.string()),
    engagement_strategy: z.string()
  })),
  power_interest_matrix: z.object({
    manage_closely: z.array(z.string()),
    keep_satisfied: z.array(z.string()),
    keep_informed: z.array(z.string()),
    monitor: z.array(z.string())
  }),
  key_relationships: z.array(z.object({
    stakeholder_1: z.string(),
    stakeholder_2: z.string(),
    relationship: z.enum(['aligned', 'neutral', 'conflicting']),
    implication: z.string()
  })),
  explain: z.string(),
  metadata: z.object({
    created_at: z.number(),
    version: z.string(),
    confidence: z.number().min(0).max(1)
  })
});

export type StakeholderMap = z.infer<typeof StakeholderMapSchema>;

/**
 * Validate artifact against schema
 */
export function validateArtifact(
  artifactType: string,
  data: any
): { valid: boolean; errors?: string[] } {
  const schemas: Record<string, z.ZodSchema> = {
    'unit_economics': UnitEconomicsSchema,
    'tam_sam_som': TAM_SAM_SOM_Schema,
    'risk_register': RiskRegisterSchema,
    'market_map': MarketMapSchema,
    'pricing_analysis': PricingAnalysisSchema,
    'channel_economics': ChannelEconomicsSchema,
    'stakeholder_map': StakeholderMapSchema
  };

  const schema = schemas[artifactType];
  if (!schema) {
    return { valid: false, errors: [`Unknown artifact type: ${artifactType}`] };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true };
  } else {
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  }
}

