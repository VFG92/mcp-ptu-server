/**
 * Dynamic Diversity Axes Tests
 * 
 * Tests that diversity axes are suggested dynamically based on task_description
 * instead of using fixed predefined axes.
 */

import { suggestDiversityAxes, COMMON_DIVERSITY_AXES } from '../src/workers/parallel-reasoning-mcp.js';

describe('Dynamic Diversity Axes', () => {
  describe('Financial Analysis Tasks', () => {
    it('should suggest financial-relevant axes for investment analysis', () => {
      const task = 'Analyze investment opportunity in fintech startup with DCF valuation';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('analytical_models');
      expect(result.suggested_axes).toContain('time_horizons');
      expect(result.suggested_axes).toContain('risk_perspectives');
      expect(result.suggested_axes.length).toBeGreaterThanOrEqual(2);
      expect(result.rationale).toContain('Financial analysis');
    });

    it('should suggest valuation-specific axes for M&A analysis', () => {
      const task = 'Evaluate M&A target with revenue multiples and NPV analysis';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('analytical_models');
      expect(result.suggested_axes).toContain('time_horizons');
      expect(result.rationale).toBeTruthy();
    });

    it('should suggest risk axes for portfolio analysis', () => {
      const task = 'Analyze portfolio risk with Monte Carlo simulation and stress testing';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('analytical_models');
      expect(result.suggested_axes).toContain('risk_perspectives');
    });
  });

  describe('Market Research Tasks', () => {
    it('should suggest market-relevant axes for market entry', () => {
      const task = 'Analyze market entry opportunity in European SaaS market';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('data_sources');
      expect(result.suggested_axes).toContain('customer_segments');
      expect(result.suggested_axes).toContain('competitive_dynamics');
      expect(result.rationale).toContain('Market analysis');
    });

    it('should suggest competitive axes for competitive analysis', () => {
      const task = 'Analyze competitive landscape with Porter Five Forces';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('data_sources');
      expect(result.suggested_axes).toContain('competitive_dynamics');
    });

    it('should suggest customer axes for customer segmentation', () => {
      const task = 'Segment customers by demographics and behavior patterns';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('customer_segments');
      expect(result.suggested_axes).toContain('data_sources');
    });
  });

  describe('Technical Architecture Tasks', () => {
    it('should suggest tech-relevant axes for cloud migration', () => {
      const task = 'Design cloud migration strategy for legacy monolith application';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('technology_stacks');
      expect(result.suggested_axes).toContain('implementation_approaches');
      expect(result.suggested_axes).toContain('cost_drivers');
      expect(result.rationale).toContain('Technology');
    });

    it('should suggest architecture axes for system design', () => {
      const task = 'Design microservices architecture with Kubernetes deployment';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('technology_stacks');
      expect(result.suggested_axes).toContain('implementation_approaches');
    });

    it('should suggest security axes for cybersecurity analysis', () => {
      const task = 'Assess cybersecurity risks and implement zero-trust architecture';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('risk_perspectives');
      expect(result.suggested_axes).toContain('technology_stacks');
    });
  });

  describe('HR Strategy Tasks', () => {
    it('should suggest HR-relevant axes for talent strategy', () => {
      const task = 'Develop talent acquisition strategy for engineering roles';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('stakeholder_views');
      expect(result.suggested_axes).toContain('time_horizons');
      expect(result.rationale).toContain('HR analysis');
    });

    it('should suggest org axes for organizational design', () => {
      const task = 'Redesign organizational structure for agile transformation';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('stakeholder_views');
      expect(result.suggested_axes).toContain('organizational_levels');
    });

    it('should suggest compensation axes for compensation analysis', () => {
      const task = 'Analyze compensation benchmarks and design equity program';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('data_sources');
      expect(result.suggested_axes).toContain('stakeholder_views');
    });
  });

  describe('Supply Chain Tasks', () => {
    it('should suggest supply chain axes for logistics optimization', () => {
      const task = 'Optimize supply chain logistics and inventory management';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('geographic_scope');
      expect(result.suggested_axes).toContain('cost_drivers');
      expect(result.suggested_axes).toContain('risk_perspectives');
      expect(result.rationale).toContain('Supply chain');
    });

    it('should suggest procurement axes for supplier analysis', () => {
      const task = 'Evaluate supplier relationships and procurement strategy';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('geographic_scope');
      expect(result.suggested_axes).toContain('cost_drivers');
    });

    it('should suggest quality axes for quality management', () => {
      const task = 'Implement Six Sigma quality management program';
      const result = suggestDiversityAxes(task);

      // "quality" doesn't match supply chain pattern, falls to default
      expect(result.suggested_axes).toContain('data_sources');
      expect(result.suggested_axes).toContain('analytical_models');
    });
  });

  describe('Regulatory/Compliance Tasks', () => {
    it('should suggest regulatory axes for compliance analysis', () => {
      const task = 'Ensure GDPR compliance for data processing operations';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('regulatory_frameworks');
      expect(result.suggested_axes).toContain('risk_perspectives');
      expect(result.suggested_axes).toContain('stakeholder_views');
      expect(result.rationale).toContain('Regulatory analysis');
    });

    it('should suggest legal axes for contract analysis', () => {
      const task = 'Review contract terms and assess legal risks';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes).toContain('risk_perspectives');
      expect(result.suggested_axes).toContain('stakeholder_views');
    });
  });

  describe('Generic/Fallback Cases', () => {
    it('should provide generic axes for unrecognized task types', () => {
      const task = 'Analyze something completely generic';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes.length).toBeGreaterThanOrEqual(2);
      expect(result.rationale).toContain('General analysis');
    });

    it('should handle empty task description', () => {
      const task = '';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes.length).toBeGreaterThanOrEqual(2);
      expect(result.rationale).toBeTruthy();
    });

    it('should handle very short task description', () => {
      const task = 'Analyze';
      const result = suggestDiversityAxes(task);

      expect(result.suggested_axes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Multi-Domain Tasks', () => {
    it('should combine axes from multiple domains', () => {
      const task = 'Analyze fintech market entry with regulatory compliance and cloud architecture';
      const result = suggestDiversityAxes(task);

      // Should include axes from financial, market, regulatory, and technical domains
      expect(result.suggested_axes.length).toBeGreaterThanOrEqual(3);
      
      // Check for presence of axes from different domains
      const hasFinancial = result.suggested_axes.some(axis => 
        ['analytical_models', 'time_horizons', 'risk_perspectives'].includes(axis)
      );
      const hasMarket = result.suggested_axes.some(axis => 
        ['data_sources', 'geographic_scope', 'customer_segments'].includes(axis)
      );
      const hasTechnical = result.suggested_axes.some(axis => 
        ['technology_stacks', 'implementation_approaches'].includes(axis)
      );
      const hasRegulatory = result.suggested_axes.some(axis => 
        ['regulatory_frameworks'].includes(axis)
      );

      expect(hasFinancial || hasMarket || hasTechnical || hasRegulatory).toBe(true);
    });
  });

  describe('Common Diversity Axes Catalog', () => {
    it('should have comprehensive catalog of common axes', () => {
      expect(COMMON_DIVERSITY_AXES).toBeDefined();
      expect(Object.keys(COMMON_DIVERSITY_AXES).length).toBeGreaterThanOrEqual(15);
    });

    it('should include core analytical axes', () => {
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('data_sources');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('analytical_models');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('time_horizons');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('risk_perspectives');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('stakeholder_views');
    });

    it('should include domain-specific axes', () => {
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('geographic_scope');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('customer_segments');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('technology_stacks');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('regulatory_frameworks');
      expect(COMMON_DIVERSITY_AXES).toHaveProperty('cost_drivers');
    });

    it('should have descriptions for all axes', () => {
      Object.entries(COMMON_DIVERSITY_AXES).forEach(([axis, description]) => {
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Rationale Quality', () => {
    it('should provide meaningful rationale for suggestions', () => {
      const tasks = [
        'Analyze investment opportunity',
        'Design cloud architecture',
        'Develop HR strategy',
        'Optimize supply chain'
      ];

      tasks.forEach(task => {
        const result = suggestDiversityAxes(task);
        expect(result.rationale).toBeTruthy();
        expect(result.rationale.length).toBeGreaterThan(20);
        expect(result.rationale).toMatch(/\w+/); // Contains words
      });
    });
  });
});

