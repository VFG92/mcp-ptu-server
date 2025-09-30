import { describe, it, expect } from '@jest/globals';

import {
  IndustryAdapterFactory,
  enrichWithIndustryContext
} from '../src/workers/industry-adapters.js';
import { getIndustryContext } from '../src/workers/industry-context.js';

describe('industry adapters', () => {
  it('provides specialized adapter details for automotive', () => {
    const adapter = IndustryAdapterFactory.getAdapter('automotive');
    expect(adapter).toBeDefined();
    if (!adapter) return;

    const kpis = adapter.getKPIs();
    expect(kpis.some(kpi => kpi.name === 'Units Sold')).toBe(true);

    const requirements = adapter.getRegulatoryRequirements('europe');
    expect(requirements.map(r => r.framework)).toContain('Euro NCAP');
    const naRequirements = adapter.getRegulatoryRequirements('north_america');
    expect(naRequirements.map(r => r.framework)).toContain('FMVSS');

    const translated = adapter.translateTerminology('customer');
    expect(translated).toMatch(/buyer/i);

    const risks = adapter.getRiskFactors();
    expect(risks.length).toBeGreaterThan(0);
  });

  it('enriches output with adapter-specific context when available', () => {
    const base = { summary: 'Base analysis' };
    const enriched = enrichWithIndustryContext(base, 'automotive', 'europe');
    expect(enriched.industry_context.vertical).toBe('automotive');
    expect(enriched.industry_context.regulatory_focus.length).toBeGreaterThan(0);
  });

  it('falls back to generic context when adapter is missing', () => {
    const base = { summary: 'Base analysis' };
    const enriched = enrichWithIndustryContext(base, 'generic', 'global');
    expect(enriched.industry_context.vertical).toBe('generic');
    expect(Array.isArray(enriched.industry_context.key_metrics)).toBe(true);
  });

  it('allows registering custom adapters at runtime', () => {
    const context = getIndustryContext('generic', 'global');
    const customAdapter = {
      vertical: 'generic' as const,
      adaptOutput: (output: any) => ({ ...output, custom: true }),
      getKPIs: () => [{ name: 'Test KPI', description: 'Example' }],
      getRegulatoryRequirements: () => [],
      translateTerminology: (term: string) => term.toUpperCase(),
      getRiskFactors: () => [],
      getCompetitiveLandscape: () => ({
        market_structure: 'fragmented',
        key_success_factors: [],
        barriers_to_entry: [],
        typical_players: []
      })
    };

    IndustryAdapterFactory.registerAdapter('generic', customAdapter);
    const adapter = IndustryAdapterFactory.getAdapter('generic');
    expect(adapter).toBe(customAdapter);

    const adapted = adapter?.adaptOutput({ base: true }, context);
    expect(adapted?.custom).toBe(true);
  });
});
