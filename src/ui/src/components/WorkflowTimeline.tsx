import React from 'react';
import type { WorkflowStatusContent } from '../types';

interface WorkflowTimelineProps {
  content: WorkflowStatusContent;
}

/**
 * WorkflowTimeline Component
 * Displays a timeline of workflow events and plan progress
 */
export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ content }) => {
  return (
    <div className="mcp-workflow-timeline">
      <h3>📊 Workflow Timeline</h3>
      
      <div className="timeline-header">
        <div className="session-info">
          <strong>Session:</strong> {content.session_id}
        </div>
        <div className="status-badge" data-status={content.status}>
          {content.status}
        </div>
      </div>

      <div className="timeline-task">
        <strong>Task:</strong> {content.task_description}
      </div>

      <div className="timeline-events">
        {content.plans.map((plan, index) => (
          <div key={plan.plan_id} className="timeline-event">
            <div className="event-marker" data-index={index + 1}>
              {index + 1}
            </div>
            <div className="event-content">
              <div className="event-header">
                <strong>{plan.plan_id}</strong>
                <span className="progress-badge">
                  {plan.executed_steps}/{plan.total_steps} steps
                </span>
              </div>
              <div className="event-description">
                {plan.description}
              </div>
              <div className="event-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${plan.progress_percentage}%` }}
                    data-complete={plan.progress_percentage === 100}
                  />
                </div>
                <span className="progress-text">
                  {plan.progress_percentage.toFixed(0)}%
                </span>
              </div>
              <div className="event-axes">
                <strong>Axes:</strong> {plan.diversity_axes.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {content.peer_critiques.length > 0 && (
        <div className="timeline-critiques">
          <h4>🔍 Peer Reviews</h4>
          <div className="critique-count">
            {content.peer_critiques.length} critique(s) submitted
          </div>
          <div className="critique-list">
            {content.peer_critiques.map((critique, i) => (
              <div key={i} className="critique-item">
                <span className="reviewer">{critique.reviewer_plan_id}</span>
                {' → '}
                <span className="reviewed">{critique.reviewed_plan_id}</span>
                <span className="agreement-score">
                  Agreement: {(critique.agreement_score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.mediation_decisions.length > 0 && (
        <div className="timeline-decisions">
          <h4>⚖️ Mediation Decisions</h4>
          <div className="decision-count">
            {content.mediation_decisions.length} decision(s) recorded
          </div>
        </div>
      )}

      <div className="timeline-completeness">
        <h4>✓ Completeness Check</h4>
        <ul>
          <li data-complete={content.completeness.min_plans_met}>
            {content.completeness.min_plans_met ? '✅' : '❌'} Minimum plans met
          </li>
          <li data-complete={content.completeness.all_plans_executed}>
            {content.completeness.all_plans_executed ? '✅' : '❌'} All plans executed
          </li>
          <li data-complete={content.completeness.has_peer_reviews}>
            {content.completeness.has_peer_reviews ? '✅' : '❌'} Peer reviews submitted
          </li>
          <li data-complete={content.completeness.has_mediation_decisions}>
            {content.completeness.has_mediation_decisions ? '✅' : '❌'} Mediation decisions recorded
          </li>
        </ul>
      </div>
    </div>
  );
};

