import React from 'react';
import type { WorkflowStatusContent } from '../types';

interface PlanComparisonMatrixProps {
  content: WorkflowStatusContent;
}

/**
 * PlanComparisonMatrix Component
 * Displays a side-by-side comparison of all plans with diversity axes
 */
export const PlanComparisonMatrix: React.FC<PlanComparisonMatrixProps> = ({ content }) => {
  // Extract all unique diversity axes across all plans
  const allAxes = Array.from(
    new Set(content.plans.flatMap(plan => plan.diversity_axes))
  );

  return (
    <div className="mcp-plan-comparison-matrix">
      <h3>🔀 Plan Comparison Matrix</h3>
      
      <div className="matrix-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Attribute</th>
              {content.plans.map(plan => (
                <th key={plan.plan_id} className="plan-column">
                  {plan.plan_id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Description Row */}
            <tr>
              <td className="attribute-label">Description</td>
              {content.plans.map(plan => (
                <td key={plan.plan_id} className="plan-cell">
                  {plan.description}
                </td>
              ))}
            </tr>

            {/* Progress Row */}
            <tr>
              <td className="attribute-label">Progress</td>
              {content.plans.map(plan => (
                <td key={plan.plan_id} className="plan-cell">
                  <div className="progress-indicator">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${plan.progress_percentage}%` }}
                      />
                    </div>
                    <span>{plan.executed_steps}/{plan.total_steps}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Diversity Axes Rows */}
            <tr className="section-header">
              <td colSpan={content.plans.length + 1}>
                <strong>Diversity Axes</strong>
              </td>
            </tr>
            {allAxes.map(axis => (
              <tr key={axis}>
                <td className="attribute-label axis-label">{axis}</td>
                {content.plans.map(plan => (
                  <td 
                    key={plan.plan_id} 
                    className="plan-cell axis-cell"
                    data-has-axis={plan.diversity_axes.includes(axis)}
                  >
                    {plan.diversity_axes.includes(axis) ? '✓' : '—'}
                  </td>
                ))}
              </tr>
            ))}

            {/* Capability Chain Row */}
            <tr className="section-header">
              <td colSpan={content.plans.length + 1}>
                <strong>Capability Chain</strong>
              </td>
            </tr>
            <tr>
              <td className="attribute-label">Capabilities</td>
              {content.plans.map(plan => (
                <td key={plan.plan_id} className="plan-cell">
                  <ul className="capability-list">
                    {plan.capability_chain.map((cap, i) => (
                      <li key={i}>{cap}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Diversity Summary */}
      <div className="diversity-summary">
        <h4>Diversity Summary</h4>
        <p>
          <strong>{allAxes.length}</strong> unique diversity axes across{' '}
          <strong>{content.plans.length}</strong> plans
        </p>
        <div className="axes-list">
          {allAxes.map(axis => (
            <span key={axis} className="axis-badge">
              {axis}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

