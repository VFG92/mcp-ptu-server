import { describe, it, expect } from '@jest/globals';

import {
  tsrSimulatorPythonTemplate,
  capitalStructureOptimizerPythonTemplate,
  workingCapitalDiagnosticPythonTemplate,
  scenarioForecastingPythonTemplate,
  competitorAnalysisWebSearchQueries,
  regulatoryScanWebSearchQueries,
  innovationRadarWebSearchQueries,
  pricingAIOptimizerPythonTemplate
} from '../src/workers/capabilities/native-integration-templates.js';

describe('native integration templates', () => {
  it('generates TSR simulator template with custom inputs', () => {
    const script = tsrSimulatorPythonTemplate({ current_stock_price: 150, num_simulations: 500 });
    expect(script).toContain('initial_price = 150');
    expect(script).toContain('simulations = 500');
    expect(script.trim().endsWith('print(json.dumps(result))')).toBe(true);
  });

  it('generates capital structure optimizer template including leverage scenarios', () => {
    const script = capitalStructureOptimizerPythonTemplate({ current_debt: 300, ebitda: 120, tax_rate: 0.25 });
    expect(script).toContain('current_debt = 300');
    expect(script).toContain('ebitda = 120');
    expect(script).toContain("'credit_rating': credit_rating");
  });

  it('produces working capital diagnostic template with benchmark gaps', () => {
    const script = workingCapitalDiagnosticPythonTemplate({ revenue: 2000, receivables: 220 });
    expect(script).toContain('revenue = 2000');
    expect(script).toContain('receivables = 220');
    expect(script).toContain("'ccc': round(ccc, 1)");
  });

  it('builds scenario forecasting template with scenario breakdown', () => {
    const script = scenarioForecastingPythonTemplate({ base_revenue: 500, num_simulations: 250 });
    expect(script).toContain('base_revenue = 500');
    expect(script).toContain('simulations = 250');
    expect(script).toContain("'scenario_breakdown': [");
  });

  it('creates competitor analysis queries using provided competitors', () => {
    const queries = competitorAnalysisWebSearchQueries({ competitors: ['Alpha', 'Beta'], industry: 'Fintech' });
    expect(queries).toHaveLength(5);
    expect(queries[0]).toContain('Alpha recent news');
    expect(queries[1]).toContain('Beta product launches');
  });

  it('creates regulatory scan queries scoped by industry and region', () => {
    const queries = regulatoryScanWebSearchQueries({ industry: 'Energy', region: 'Europe' });
    expect(queries).toHaveLength(5);
    expect(queries.every(q => q.includes('Energy'))).toBe(true);
    expect(queries[0]).toContain('Europe');
  });

  it('creates innovation radar queries using technology area', () => {
    const queries = innovationRadarWebSearchQueries({ technology_area: 'Quantum', industry: 'Manufacturing' });
    expect(queries).toHaveLength(5);
    expect(queries[0]).toContain('Quantum breakthrough innovations');
  });

  it('produces pricing AI optimizer template with elasticity logic', () => {
    const script = pricingAIOptimizerPythonTemplate({ current_price: 120, unit_cost: 35, price_elasticity: -1.2, base_demand: 800 });
    expect(script).toContain('current_price = 120');
    expect(script).toContain('demand_elasticity = -1.2');
    expect(script).toContain('print(json.dumps(result))');
  });
});
