import React from 'react';
import type { WorkflowVisualizerProps, StructuredContent } from './types';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { PlanComparisonMatrix } from './components/PlanComparisonMatrix';
import { QualityMetricsDashboard } from './components/QualityMetricsDashboard';

/**
 * Main WorkflowVisualizer component
 * Routes to appropriate visualization based on structured content type
 */
export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ 
  structuredContent, 
  mode = 'inline' 
}) => {
  const renderVisualization = () => {
    switch (structuredContent.type) {
      case 'workflow_initialized':
        return (
          <div className="mcp-workflow-init">
            <h3>🚀 Workflow Initialized</h3>
            <div className="task-description">
              <strong>Task:</strong> {structuredContent.task_description}
            </div>
            <div className="diversity-axes">
              <strong>Required Diversity Axes:</strong>
              <ul>
                {structuredContent.required_diversity_axes.map((axis, i) => (
                  <li key={i}>{axis}</li>
                ))}
              </ul>
            </div>
            {structuredContent.suggested_axes && (
              <div className="suggested-axes">
                <strong>Suggested Axes:</strong>
                <ul>
                  {structuredContent.suggested_axes.map((axis, i) => (
                    <li key={i}>{axis}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="min-plans">
              <strong>Minimum Plans Required:</strong> {structuredContent.min_plans}
            </div>
          </div>
        );

      case 'plan_submitted':
        return (
          <div className="mcp-plan-submitted">
            <h3>{structuredContent.accepted ? '✅ Plan Accepted' : '❌ Plan Rejected'}</h3>
            <div className="plan-info">
              <strong>Plan ID:</strong> {structuredContent.plan.plan_id}
            </div>
            <div className="plan-description">
              <strong>Description:</strong> {structuredContent.plan.description}
            </div>
            <div className="diversity-axes">
              <strong>Diversity Axes:</strong> {structuredContent.plan.diversity_axes.join(', ')}
            </div>
            {structuredContent.diversity_validation && (
              <div className="diversity-validation">
                <strong>Diversity Validation:</strong>
                <ul>
                  <li>Axes Different: {structuredContent.diversity_validation.axes_different}</li>
                  <li>Required Minimum: {structuredContent.diversity_validation.required_minimum}</li>
                  <li>Compared With: {structuredContent.diversity_validation.compared_with.join(', ') || 'None'}</li>
                </ul>
              </div>
            )}
            {!structuredContent.accepted && structuredContent.reason && (
              <div className="rejection-reason">
                <strong>Reason:</strong> {structuredContent.reason}
              </div>
            )}
          </div>
        );

      case 'plan_execution':
        return (
          <div className="mcp-plan-execution">
            <h3>⚙️ Plan Execution Step</h3>
            <div className="execution-info">
              <strong>Plan ID:</strong> {structuredContent.plan_id}
            </div>
            <div className="progress">
              <strong>Progress:</strong> Step {structuredContent.step_number} of {structuredContent.total_steps}
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(structuredContent.step_number / structuredContent.total_steps) * 100}%` }}
                />
              </div>
            </div>
            <div className="capability">
              <strong>Capability:</strong> {structuredContent.capability_name}
            </div>
            <div className="evidence-id">
              <strong>Evidence ID:</strong> <code>{structuredContent.evidence_id}</code>
            </div>
          </div>
        );

      case 'workflow_status':
        return (
          <div className="mcp-workflow-status">
            <WorkflowTimeline content={structuredContent} />
            <PlanComparisonMatrix content={structuredContent} />
          </div>
        );

      case 'workflow_finalized':
        return (
          <div className="mcp-workflow-finalized">
            <QualityMetricsDashboard content={structuredContent} />
          </div>
        );

      default:
        return (
          <div className="mcp-unknown">
            <p>Unknown content type: {(structuredContent as any).type}</p>
          </div>
        );
    }
  };

  return (
    <div className={`mcp-workflow-visualizer mcp-mode-${mode}`}>
      {renderVisualization()}
    </div>
  );
};

