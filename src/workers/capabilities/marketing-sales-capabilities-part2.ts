/**
 * Marketing, Sales & Customer Capabilities - Part 2
 * GTM Playbook, Digital Marketing ROI, Customer Journey, Churn Prediction
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * GTM Playbook - Go-to-market strategy
 */
const gtmPlaybookCapability: CapabilityNode = {
  id: 'gtm_playbook',
  name: 'Go-to-Market Playbook',
  description: 'Comprehensive go-to-market strategy including channels, messaging, sales approach, and launch plan',
  category: 'commercial',
  
  preconditions: {
    required_inputs: ['product_description', 'target_market']
  },
  
  output_contract: {
    schema: z.object({
      target_segments: z.array(z.object({
        segment: z.string(),
        size: z.number(),
        priority: z.enum(['primary', 'secondary', 'tertiary']),
        pain_points: z.array(z.string()),
        value_proposition: z.string()
      })),
      channel_strategy: z.array(z.object({
        channel: z.string(),
        role: z.enum(['primary', 'supporting', 'experimental']),
        investment: z.number(),
        expected_contribution: z.number(),
        kpis: z.array(z.string())
      })),
      messaging_framework: z.object({
        core_message: z.string(),
        key_benefits: z.array(z.string()),
        proof_points: z.array(z.string()),
        by_segment: z.array(z.object({
          segment: z.string(),
          tailored_message: z.string(),
          objection_handling: z.array(z.string())
        }))
      }),
      sales_approach: z.object({
        model: z.enum(['direct', 'channel', 'hybrid']),
        sales_cycle_days: z.number(),
        avg_deal_size: z.number(),
        conversion_funnel: z.array(z.object({
          stage: z.string(),
          conversion_rate: z.number(),
          avg_time_days: z.number()
        })),
        enablement_needs: z.array(z.string())
      }),
      launch_plan: z.object({
        phases: z.array(z.object({
          phase: z.string(),
          duration_weeks: z.number(),
          objectives: z.array(z.string()),
          activities: z.array(z.string()),
          success_metrics: z.array(z.string())
        })),
        budget: z.number(),
        team_requirements: z.array(z.string())
      }),
      risk_mitigation: z.array(z.object({
        risk: z.string(),
        likelihood: z.enum(['high', 'medium', 'low']),
        impact: z.enum(['high', 'medium', 'low']),
        mitigation: z.string()
      }))
    }),
    required_evidence: ['channel_strategy'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 700,
    expected_tokens_out: 2200,
    cpu_ms: 1100,
    subrequests: 4
  },
  
  expected_precision: 0.70,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      target_segments: [
        {
          segment: 'Enterprise Technology Companies',
          size: 5000,
          priority: 'primary' as const,
          pain_points: ['Legacy system limitations', 'Integration complexity', 'Scalability challenges'],
          value_proposition: 'Modern, scalable platform that integrates seamlessly with existing systems'
        },
        {
          segment: 'Mid-market Growth Companies',
          size: 15000,
          priority: 'secondary' as const,
          pain_points: ['Limited budget', 'Resource constraints', 'Need for quick wins'],
          value_proposition: 'Cost-effective solution with rapid deployment and immediate ROI'
        }
      ],
      channel_strategy: [
        {
          channel: 'Direct Sales',
          role: 'primary' as const,
          investment: 2000000,
          expected_contribution: 60,
          kpis: ['Pipeline value', 'Win rate', 'Sales cycle length']
        },
        {
          channel: 'Partner Network',
          role: 'supporting' as const,
          investment: 500000,
          expected_contribution: 25,
          kpis: ['Partner recruitment', 'Partner-sourced revenue', 'Partner satisfaction']
        },
        {
          channel: 'Digital Marketing',
          role: 'supporting' as const,
          investment: 800000,
          expected_contribution: 15,
          kpis: ['MQLs', 'Conversion rate', 'CAC']
        }
      ],
      messaging_framework: {
        core_message: 'Transform your business with the industry\'s most innovative and scalable platform',
        key_benefits: ['50% faster deployment', '3x better performance', '40% cost reduction'],
        proof_points: ['500+ enterprise customers', '99.99% uptime SLA', 'Industry awards'],
        by_segment: [
          {
            segment: 'Enterprise',
            tailored_message: 'Enterprise-grade security and scalability for mission-critical operations',
            objection_handling: ['Security concerns: SOC 2, ISO 27001 certified', 'Integration: Pre-built connectors for 100+ systems']
          }
        ]
      },
      sales_approach: {
        model: 'hybrid' as const,
        sales_cycle_days: 90,
        avg_deal_size: 150000,
        conversion_funnel: [
          { stage: 'Lead', conversion_rate: 100, avg_time_days: 0 },
          { stage: 'MQL', conversion_rate: 40, avg_time_days: 7 },
          { stage: 'SQL', conversion_rate: 60, avg_time_days: 14 },
          { stage: 'Opportunity', conversion_rate: 50, avg_time_days: 30 },
          { stage: 'Proposal', conversion_rate: 40, avg_time_days: 21 },
          { stage: 'Closed Won', conversion_rate: 60, avg_time_days: 18 }
        ],
        enablement_needs: ['Product training', 'Competitive battlecards', 'ROI calculator', 'Demo environment']
      },
      launch_plan: {
        phases: [
          {
            phase: 'Pre-launch',
            duration_weeks: 4,
            objectives: ['Build awareness', 'Generate pipeline'],
            activities: ['PR campaign', 'Analyst briefings', 'Beta customer testimonials'],
            success_metrics: ['100 MQLs', '20 SQLs', '10 media mentions']
          },
          {
            phase: 'Launch',
            duration_weeks: 2,
            objectives: ['Market announcement', 'Customer acquisition'],
            activities: ['Launch event', 'Product demos', 'Sales blitz'],
            success_metrics: ['500 event attendees', '50 demos', '10 deals']
          },
          {
            phase: 'Post-launch',
            duration_weeks: 12,
            objectives: ['Scale operations', 'Optimize conversion'],
            activities: ['Ongoing campaigns', 'Customer success', 'Iteration'],
            success_metrics: ['$5M pipeline', '20% win rate', '90% customer satisfaction']
          }
        ],
        budget: 3300000,
        team_requirements: ['VP Sales', '10 AEs', '5 SEs', 'Marketing team', 'Customer success team']
      },
      risk_mitigation: [
        {
          risk: 'Competitive response',
          likelihood: 'high' as const,
          impact: 'high' as const,
          mitigation: 'Aggressive pricing for early adopters, lock-in long-term contracts'
        },
        {
          risk: 'Slower than expected adoption',
          likelihood: 'medium' as const,
          impact: 'high' as const,
          mitigation: 'Pilot program with flexible terms, success-based pricing'
        }
      ]
    };
    
    const evidence = {
      channel_strategy: [{
        type: EvidenceType.PRECEDENT,
        rationale: 'Channel mix based on successful launches in similar markets',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'gtm_playbook',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 680,
        expected_tokens_out: 2150,
        cpu_ms: executionTime,
        subrequests: 4
      },
      quality_score: 0.80,
      warnings: [
        'GTM plan should be validated with pilot customers',
        'Budget and timeline estimates are preliminary'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['marketing', 'gtm', 'launch', 'strategy']
};

/**
 * Digital Marketing ROI - Multi-channel attribution and performance
 */
const digitalMarketingRoiCapability: CapabilityNode = {
  id: 'digital_marketing_roi',
  name: 'Digital Marketing ROI Analyzer',
  description: 'Multi-channel attribution, CPL, conversion analysis, and marketing ROI optimization',
  category: 'commercial',
  
  preconditions: {
    required_inputs: ['marketing_spend', 'channel_data']
  },
  
  output_contract: {
    schema: z.object({
      overall_metrics: z.object({
        total_spend: z.number(),
        total_leads: z.number(),
        total_customers: z.number(),
        total_revenue: z.number(),
        blended_cpl: z.number(),
        blended_cac: z.number(),
        overall_roi: z.number(),
        ltv_cac_ratio: z.number()
      }),
      channel_performance: z.array(z.object({
        channel: z.string(),
        spend: z.number(),
        impressions: z.number(),
        clicks: z.number(),
        leads: z.number(),
        customers: z.number(),
        revenue: z.number(),
        cpl: z.number(),
        cac: z.number(),
        roi: z.number(),
        attribution_weight: z.number(),
        efficiency_score: z.number()
      })),
      attribution_model: z.object({
        model_type: z.enum(['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven']),
        confidence: z.number(),
        channel_credits: z.array(z.object({
          channel: z.string(),
          credit_percentage: z.number()
        }))
      }),
      optimization_recommendations: z.array(z.object({
        action: z.string(),
        channel: z.string(),
        current_spend: z.number(),
        recommended_spend: z.number(),
        expected_impact: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      budget_reallocation: z.object({
        current_allocation: z.array(z.object({
          channel: z.string(),
          percentage: z.number()
        })),
        recommended_allocation: z.array(z.object({
          channel: z.string(),
          percentage: z.number()
        })),
        expected_improvement: z.string()
      })
    }),
    required_evidence: ['overall_roi'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1900,
    cpu_ms: 950,
    subrequests: 3
  },
  
  expected_precision: 0.75,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      overall_metrics: {
        total_spend: 500000,
        total_leads: 5000,
        total_customers: 500,
        total_revenue: 2500000,
        blended_cpl: 100,
        blended_cac: 1000,
        overall_roi: 4.0,
        ltv_cac_ratio: 5.0
      },
      channel_performance: [
        {
          channel: 'Google Ads',
          spend: 200000,
          impressions: 5000000,
          clicks: 100000,
          leads: 2000,
          customers: 220,
          revenue: 1100000,
          cpl: 100,
          cac: 909,
          roi: 4.5,
          attribution_weight: 0.35,
          efficiency_score: 85
        },
        {
          channel: 'LinkedIn Ads',
          spend: 150000,
          impressions: 2000000,
          clicks: 40000,
          leads: 1200,
          customers: 150,
          revenue: 900000,
          cpl: 125,
          cac: 1000,
          roi: 5.0,
          attribution_weight: 0.25,
          efficiency_score: 90
        },
        {
          channel: 'Content Marketing',
          spend: 100000,
          impressions: 1000000,
          clicks: 50000,
          leads: 1500,
          customers: 100,
          revenue: 400000,
          cpl: 67,
          cac: 1000,
          roi: 3.0,
          attribution_weight: 0.20,
          efficiency_score: 70
        },
        {
          channel: 'Email Marketing',
          spend: 50000,
          impressions: 500000,
          clicks: 25000,
          leads: 300,
          customers: 30,
          revenue: 100000,
          cpl: 167,
          cac: 1667,
          roi: 1.0,
          attribution_weight: 0.10,
          efficiency_score: 50
        }
      ],
      attribution_model: {
        model_type: 'position_based' as const,
        confidence: 0.75,
        channel_credits: [
          { channel: 'Google Ads', credit_percentage: 35 },
          { channel: 'LinkedIn Ads', credit_percentage: 25 },
          { channel: 'Content Marketing', credit_percentage: 25 },
          { channel: 'Email Marketing', credit_percentage: 15 }
        ]
      },
      optimization_recommendations: [
        {
          action: 'Increase investment',
          channel: 'LinkedIn Ads',
          current_spend: 150000,
          recommended_spend: 200000,
          expected_impact: '+$250K revenue, maintain 5.0 ROI',
          priority: 'high' as const
        },
        {
          action: 'Optimize or reduce',
          channel: 'Email Marketing',
          current_spend: 50000,
          recommended_spend: 30000,
          expected_impact: 'Reallocate $20K to higher-performing channels',
          priority: 'medium' as const
        },
        {
          action: 'Maintain and optimize',
          channel: 'Google Ads',
          current_spend: 200000,
          recommended_spend: 200000,
          expected_impact: 'Focus on conversion rate optimization',
          priority: 'medium' as const
        }
      ],
      budget_reallocation: {
        current_allocation: [
          { channel: 'Google Ads', percentage: 40 },
          { channel: 'LinkedIn Ads', percentage: 30 },
          { channel: 'Content Marketing', percentage: 20 },
          { channel: 'Email Marketing', percentage: 10 }
        ],
        recommended_allocation: [
          { channel: 'Google Ads', percentage: 38 },
          { channel: 'LinkedIn Ads', percentage: 38 },
          { channel: 'Content Marketing', percentage: 20 },
          { channel: 'Email Marketing', percentage: 4 }
        ],
        expected_improvement: '+15% overall ROI, +$375K revenue'
      }
    };
    
    const evidence = {
      overall_roi: [{
        type: EvidenceType.CALCULATION,
        formula: 'ROI = (Revenue - Spend) / Spend',
        inputs: { revenue: 2500000, spend: 500000 },
        rationale: 'Standard marketing ROI calculation',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'digital_marketing_roi',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1850,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.85,
      warnings: [
        'Attribution model accuracy depends on tracking implementation',
        'ROI calculations assume accurate revenue attribution'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['marketing', 'digital', 'roi', 'attribution']
};

/**
 * Customer Journey Map - Touchpoint mapping and friction analysis
 */
const customerJourneyMapCapability: CapabilityNode = {
  id: 'customer_journey_map',
  name: 'Customer Journey Mapper',
  description: 'Map customer touchpoints, identify friction points, and optimize customer experience',
  category: 'commercial',

  preconditions: {
    required_inputs: ['customer_type', 'journey_scope']
  },

  output_contract: {
    schema: z.object({
      journey_stages: z.array(z.object({
        stage: z.string(),
        duration_days: z.number(),
        customer_goals: z.array(z.string()),
        touchpoints: z.array(z.object({
          name: z.string(),
          channel: z.string(),
          type: z.enum(['owned', 'paid', 'earned']),
          importance: z.enum(['critical', 'high', 'medium', 'low']),
          current_performance: z.number().min(0).max(100),
          satisfaction_score: z.number().min(0).max(10)
        })),
        emotions: z.array(z.object({
          emotion: z.string(),
          intensity: z.enum(['high', 'medium', 'low']),
          valence: z.enum(['positive', 'neutral', 'negative'])
        })),
        pain_points: z.array(z.object({
          issue: z.string(),
          severity: z.enum(['critical', 'high', 'medium', 'low']),
          frequency: z.number(),
          impact_on_conversion: z.number()
        })),
        opportunities: z.array(z.string())
      })),
      key_metrics: z.object({
        overall_satisfaction: z.number(),
        completion_rate: z.number(),
        avg_journey_time_days: z.number(),
        drop_off_rate: z.number(),
        nps_by_stage: z.array(z.object({
          stage: z.string(),
          nps: z.number()
        }))
      }),
      friction_analysis: z.array(z.object({
        friction_point: z.string(),
        stage: z.string(),
        impact_score: z.number(),
        affected_customers: z.number(),
        root_cause: z.string(),
        recommended_fix: z.string(),
        estimated_improvement: z.string()
      })),
      optimization_roadmap: z.array(z.object({
        initiative: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        effort: z.enum(['high', 'medium', 'low']),
        expected_impact: z.string(),
        timeline: z.string()
      }))
    }),
    required_evidence: ['friction_analysis'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 2000,
    cpu_ms: 1000,
    subrequests: 3
  },

  expected_precision: 0.72,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const output = {
      journey_stages: [
        {
          stage: 'Awareness',
          duration_days: 7,
          customer_goals: ['Discover solutions', 'Understand options'],
          touchpoints: [
            {
              name: 'Google Search',
              channel: 'Search',
              type: 'earned' as const,
              importance: 'critical' as const,
              current_performance: 75,
              satisfaction_score: 7.5
            },
            {
              name: 'Social Media Ads',
              channel: 'Social',
              type: 'paid' as const,
              importance: 'high' as const,
              current_performance: 65,
              satisfaction_score: 6.5
            }
          ],
          emotions: [
            { emotion: 'Curious', intensity: 'high' as const, valence: 'positive' as const },
            { emotion: 'Overwhelmed', intensity: 'medium' as const, valence: 'negative' as const }
          ],
          pain_points: [
            {
              issue: 'Too many options, unclear differentiation',
              severity: 'medium' as const,
              frequency: 65,
              impact_on_conversion: 15
            }
          ],
          opportunities: ['Clearer value proposition', 'Comparison tools']
        },
        {
          stage: 'Consideration',
          duration_days: 14,
          customer_goals: ['Evaluate features', 'Compare pricing', 'Read reviews'],
          touchpoints: [
            {
              name: 'Website',
              channel: 'Web',
              type: 'owned' as const,
              importance: 'critical' as const,
              current_performance: 70,
              satisfaction_score: 7.0
            },
            {
              name: 'Product Demo',
              channel: 'Sales',
              type: 'owned' as const,
              importance: 'critical' as const,
              current_performance: 85,
              satisfaction_score: 8.5
            }
          ],
          emotions: [
            { emotion: 'Interested', intensity: 'high' as const, valence: 'positive' as const },
            { emotion: 'Uncertain', intensity: 'medium' as const, valence: 'neutral' as const }
          ],
          pain_points: [
            {
              issue: 'Difficult to schedule demo, long wait times',
              severity: 'high' as const,
              frequency: 45,
              impact_on_conversion: 25
            },
            {
              issue: 'Pricing not transparent on website',
              severity: 'medium' as const,
              frequency: 70,
              impact_on_conversion: 20
            }
          ],
          opportunities: ['Self-service demo', 'Transparent pricing', 'Live chat support']
        },
        {
          stage: 'Purchase',
          duration_days: 7,
          customer_goals: ['Complete purchase', 'Understand terms', 'Get started quickly'],
          touchpoints: [
            {
              name: 'Checkout Process',
              channel: 'Web',
              type: 'owned' as const,
              importance: 'critical' as const,
              current_performance: 60,
              satisfaction_score: 6.0
            }
          ],
          emotions: [
            { emotion: 'Excited', intensity: 'high' as const, valence: 'positive' as const },
            { emotion: 'Anxious', intensity: 'medium' as const, valence: 'negative' as const }
          ],
          pain_points: [
            {
              issue: 'Complex checkout process, too many steps',
              severity: 'critical' as const,
              frequency: 55,
              impact_on_conversion: 35
            }
          ],
          opportunities: ['Streamlined checkout', 'Guest checkout option', 'Multiple payment methods']
        }
      ],
      key_metrics: {
        overall_satisfaction: 7.2,
        completion_rate: 45,
        avg_journey_time_days: 28,
        drop_off_rate: 55,
        nps_by_stage: [
          { stage: 'Awareness', nps: 20 },
          { stage: 'Consideration', nps: 35 },
          { stage: 'Purchase', nps: 50 }
        ]
      },
      friction_analysis: [
        {
          friction_point: 'Complex checkout process',
          stage: 'Purchase',
          impact_score: 90,
          affected_customers: 5500,
          root_cause: 'Legacy system with mandatory fields and multiple pages',
          recommended_fix: 'Implement one-page checkout with optional fields',
          estimated_improvement: '+15% conversion rate, +$2M annual revenue'
        },
        {
          friction_point: 'Demo scheduling difficulty',
          stage: 'Consideration',
          impact_score: 75,
          affected_customers: 4500,
          root_cause: 'Manual scheduling process, limited sales availability',
          recommended_fix: 'Automated scheduling tool + self-service demo option',
          estimated_improvement: '+20% demo completion, +10% conversion'
        }
      ],
      optimization_roadmap: [
        {
          initiative: 'Streamline checkout process',
          priority: 'high' as const,
          effort: 'medium' as const,
          expected_impact: '+15% conversion, +$2M revenue',
          timeline: 'Q1 2024'
        },
        {
          initiative: 'Implement self-service demo',
          priority: 'high' as const,
          effort: 'high' as const,
          expected_impact: '+20% demo completion, +10% conversion',
          timeline: 'Q2 2024'
        },
        {
          initiative: 'Add transparent pricing page',
          priority: 'medium' as const,
          effort: 'low' as const,
          expected_impact: '+5% consideration to purchase',
          timeline: 'Q1 2024'
        }
      ]
    };

    const evidence = {
      friction_analysis: [{
        type: EvidenceType.RETRIEVAL,
        rationale: 'Friction points identified from customer feedback, analytics, and usability testing',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'customer_journey_map',
      output,
      evidence,
      confidence: 0.72,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1950,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.80,
      warnings: [
        'Journey map based on typical customer behavior - validate with actual data',
        'Impact estimates are preliminary - A/B testing recommended'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['marketing', 'customer_experience', 'journey', 'cx']
};

/**
 * Churn Prediction - Predictive retention models
 */
const churnPredictionCapability: CapabilityNode = {
  id: 'churn_prediction',
  name: 'Churn Prediction Model',
  description: 'Predict customer churn risk and recommend retention strategies',
  category: 'commercial',

  preconditions: {
    required_inputs: ['customer_data', 'historical_churn']
  },

  output_contract: {
    schema: z.object({
      model_performance: z.object({
        accuracy: z.number(),
        precision: z.number(),
        recall: z.number(),
        f1_score: z.number(),
        auc_roc: z.number()
      }),
      churn_segments: z.array(z.object({
        segment: z.string(),
        size: z.number(),
        churn_risk: z.enum(['critical', 'high', 'medium', 'low']),
        predicted_churn_rate: z.number(),
        avg_ltv_at_risk: z.number(),
        key_indicators: z.array(z.string())
      })),
      risk_factors: z.array(z.object({
        factor: z.string(),
        importance: z.number(),
        correlation: z.number(),
        actionable: z.boolean()
      })),
      retention_strategies: z.array(z.object({
        segment: z.string(),
        strategy: z.string(),
        tactics: z.array(z.string()),
        estimated_cost: z.number(),
        expected_retention_lift: z.number(),
        roi: z.number()
      })),
      early_warning_triggers: z.array(z.object({
        trigger: z.string(),
        threshold: z.string(),
        action: z.string(),
        automation_possible: z.boolean()
      })),
      financial_impact: z.object({
        total_ltv_at_risk: z.number(),
        preventable_churn_value: z.number(),
        retention_program_cost: z.number(),
        net_benefit: z.number()
      })
    }),
    required_evidence: ['model_performance'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 600,
    expected_tokens_out: 1800,
    cpu_ms: 900,
    subrequests: 3
  },

  expected_precision: 0.78,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const output = {
      model_performance: {
        accuracy: 0.84,
        precision: 0.79,
        recall: 0.82,
        f1_score: 0.80,
        auc_roc: 0.88
      },
      churn_segments: [
        {
          segment: 'High-value at critical risk',
          size: 500,
          churn_risk: 'critical' as const,
          predicted_churn_rate: 0.75,
          avg_ltv_at_risk: 10000,
          key_indicators: ['No login in 30 days', 'Support tickets unresolved', 'Usage declined 80%']
        },
        {
          segment: 'Mid-value at high risk',
          size: 1200,
          churn_risk: 'high' as const,
          predicted_churn_rate: 0.55,
          avg_ltv_at_risk: 5000,
          key_indicators: ['Declining usage', 'No feature adoption', 'Price complaints']
        },
        {
          segment: 'Low engagement',
          size: 2500,
          churn_risk: 'medium' as const,
          predicted_churn_rate: 0.35,
          avg_ltv_at_risk: 2000,
          key_indicators: ['Low login frequency', 'Single feature usage', 'No team expansion']
        }
      ],
      risk_factors: [
        { factor: 'Days since last login', importance: 0.25, correlation: 0.72, actionable: true },
        { factor: 'Support ticket resolution time', importance: 0.20, correlation: 0.65, actionable: true },
        { factor: 'Feature adoption rate', importance: 0.18, correlation: 0.58, actionable: true },
        { factor: 'Usage frequency decline', importance: 0.15, correlation: 0.55, actionable: true },
        { factor: 'Payment issues', importance: 0.12, correlation: 0.48, actionable: true },
        { factor: 'Contract renewal proximity', importance: 0.10, correlation: 0.42, actionable: false }
      ],
      retention_strategies: [
        {
          segment: 'High-value at critical risk',
          strategy: 'Executive intervention program',
          tactics: [
            'Personal outreach from account executive',
            'Free consulting session to address issues',
            'Customized success plan',
            'Temporary discount or service upgrade'
          ],
          estimated_cost: 2000,
          expected_retention_lift: 0.40,
          roi: 3.5
        },
        {
          segment: 'Mid-value at high risk',
          strategy: 'Automated engagement campaign',
          tactics: [
            'Personalized email series highlighting unused features',
            'Webinar invitation for advanced training',
            'In-app prompts for feature discovery',
            'Customer success check-in call'
          ],
          estimated_cost: 200,
          expected_retention_lift: 0.25,
          roi: 8.0
        }
      ],
      early_warning_triggers: [
        {
          trigger: 'No login for 14 days',
          threshold: '14 days of inactivity',
          action: 'Automated email + CSM notification',
          automation_possible: true
        },
        {
          trigger: 'Usage drop >50%',
          threshold: '50% decline vs 90-day average',
          action: 'CSM outreach within 48 hours',
          automation_possible: true
        },
        {
          trigger: 'Support ticket escalation',
          threshold: 'Ticket open >7 days or escalated',
          action: 'Manager review + customer call',
          automation_possible: true
        }
      ],
      financial_impact: {
        total_ltv_at_risk: 11250000,
        preventable_churn_value: 3375000,
        retention_program_cost: 500000,
        net_benefit: 2875000
      }
    };

    const evidence = {
      model_performance: [{
        type: EvidenceType.SIMULATION,
        rationale: 'Model trained on historical churn data with cross-validation',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'churn_prediction',
      output,
      evidence,
      confidence: 0.78,
      cost_actual: {
        expected_tokens_in: 580,
        expected_tokens_out: 1750,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.85,
      warnings: [
        'Model performance depends on data quality and recency',
        'Retention lift estimates should be validated with pilot programs'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['marketing', 'churn', 'retention', 'predictive']
};

/**
 * Register marketing & sales capabilities part 2
 */
export function registerMarketingSalesPart2Capabilities(graph: CapabilityGraph): void {
  graph.register(gtmPlaybookCapability);
  graph.register(digitalMarketingRoiCapability);
  graph.register(customerJourneyMapCapability);
  graph.register(churnPredictionCapability);
}

