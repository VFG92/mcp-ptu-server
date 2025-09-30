import { describe, it, expect } from '@jest/globals';

import {
  UnitEconomicsSchema,
  TAM_SAM_SOM_Schema,
  RiskRegisterSchema,
  EvidenceSchema
} from '../src/workers/output-schemas.js';

const baseEvidence = {
  type: 'calc' as const,
  timestamp: Date.now(),
  rationale: 'Model output'
};

describe('output schemas', () => {
  it('validates a complete unit economics artifact', () => {
    const artifact = UnitEconomicsSchema.parse({
      ltv: {
        value: 4200,
        unit: 'USD',
        calculation_method: 'ARPU / churn',
        assumptions: ['12 month retention'],
        evidence: [baseEvidence]
      },
      cac: {
        value: 1200,
        unit: 'USD',
        breakdown: { paid: 600, organic: 300, success: 300 },
        channels: [
          { channel: 'paid_search', cac: 800, volume: 120 },
          { channel: 'events', cac: 1500, volume: 30 }
        ],
        evidence: [baseEvidence]
      },
      ltv_cac_ratio: {
        value: 3.5,
        assessment: 'good',
        benchmark: 3,
        evidence: [baseEvidence]
      },
      payback_period_months: {
        value: 10,
        unit: 'months',
        assessment: 'acceptable'
      },
      contribution_margin: {
        value: 62,
        unit: '%',
        breakdown: { revenue: 1000, cogs: 380, gross_profit: 620 }
      },
      sensitivity: {
        churn_rate: { base: 0.08, plus_10pct: 0.088, minus_10pct: 0.072 },
        pricing: { base: 100, plus_10pct: 110, minus_10pct: 90 }
      },
      explain: 'Healthy unit economics with fast payback.',
      metadata: {
        created_at: Date.now(),
        version: '1.0.0',
        confidence: 0.82
      }
    });

    expect(artifact.ltv.value).toBe(4200);
  });

  it('rejects invalid evidence entries', () => {
    const invalid = { type: 'invalid', timestamp: Date.now() } as any;
    const result = EvidenceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates TAM/SAM/SOM structures and optional bottoms-up data', () => {
    const artifact = TAM_SAM_SOM_Schema.parse({
      tam: {
        value: 100000000,
        unit: 'USD',
        methodology: 'Top-down',
        assumptions: ['10% CAGR'],
        evidence: [baseEvidence]
      },
      sam: {
        value: 20000000,
        unit: 'USD',
        percentage_of_tam: 20,
        rationale: 'Regional focus',
        evidence: [baseEvidence]
      },
      som: {
        value: 5000000,
        unit: 'USD',
        percentage_of_sam: 25,
        year_1: 1000000,
        year_3: 2500000,
        year_5: 4000000,
        rationale: 'Execution dependent',
        evidence: [baseEvidence]
      },
      bottoms_up_validation: {
        customers: 1000,
        avg_revenue_per_customer: 5000,
        total: 5000000
      },
      explain: 'Clear segmentation of total addressable market.',
      metadata: {
        created_at: Date.now(),
        version: '1.0.0',
        confidence: 0.75
      }
    });

    expect(artifact.bottoms_up_validation?.total).toBe(5000000);
  });

  it('validates a risk register with mitigation details', () => {
    const artifact = RiskRegisterSchema.parse({
      risks: [
        {
          id: 'R1',
          category: 'market',
          description: 'Market contraction',
          likelihood: 'medium',
          impact: 'high',
          severity_score: 12,
          current_mitigations: ['Diversify segments'],
          additional_mitigations: [
            { action: 'Introduce mid-tier offer', cost: '$200K', effectiveness: 'medium' }
          ],
          status: 'assessed',
          evidence: [baseEvidence]
        }
      ],
      risk_summary: {
        total_risks: 1,
        critical_risks: 0,
        high_risks: 1,
        overall_risk_level: 'moderate',
        top_3_risks: ['Market contraction']
      },
      risk_matrix: [[0, 1], [0, 0]],
      explain: 'Primary risk comes from macro demand contraction.',
      metadata: {
        created_at: Date.now(),
        version: '1.0.0',
        confidence: 0.7
      }
    });

    expect(artifact.risks[0].id).toBe('R1');
  });
});
