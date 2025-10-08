import React from 'react';
import type { WorkflowFinalizedContent } from '../types';

interface QualityMetricsDashboardProps {
  content: WorkflowFinalizedContent;
}

/**
 * QualityMetricsDashboard Component
 * Displays quality metrics, decision map, and recommendations
 */
export const QualityMetricsDashboard: React.FC<QualityMetricsDashboardProps> = ({ content }) => {
  const getMetricColor = (value: number): string => {
    if (value >= 0.8) return 'green';
    if (value >= 0.6) return 'yellow';
    return 'red';
  };

  const getMetricLabel = (value: number): string => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="mcp-quality-metrics-dashboard">
      <h3>📈 Quality Metrics Dashboard</h3>

      {content.finalized ? (
        <div className="finalization-status success">
          ✅ Workflow Finalized Successfully
        </div>
      ) : (
        <div className="finalization-status incomplete">
          ⚠️ Workflow Incomplete
        </div>
      )}

      {/* Quality Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" data-color={getMetricColor(content.metrics.confidence)}>
          <div className="metric-label">Confidence</div>
          <div className="metric-value">
            {(content.metrics.confidence * 100).toFixed(1)}%
          </div>
          <div className="metric-status">
            {getMetricLabel(content.metrics.confidence)}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${content.metrics.confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="metric-card" data-color={getMetricColor(content.metrics.coverage)}>
          <div className="metric-label">Coverage</div>
          <div className="metric-value">
            {(content.metrics.coverage * 100).toFixed(1)}%
          </div>
          <div className="metric-status">
            {getMetricLabel(content.metrics.coverage)}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${content.metrics.coverage * 100}%` }}
            />
          </div>
        </div>

        <div className="metric-card" data-color={getMetricColor(content.metrics.consensus)}>
          <div className="metric-label">Consensus</div>
          <div className="metric-value">
            {(content.metrics.consensus * 100).toFixed(1)}%
          </div>
          <div className="metric-status">
            {getMetricLabel(content.metrics.consensus)}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${content.metrics.consensus * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quality Summary */}
      <div className="quality-summary">
        <h4>🔍 Quality Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Artifacts:</span>
            <span className="summary-value">{content.quality_summary.total_artifacts}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Flagged Artifacts:</span>
            <span className="summary-value">{content.quality_summary.flagged_artifacts}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Critical Issues:</span>
            <span className="summary-value critical">{content.quality_summary.critical_issues}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Warnings:</span>
            <span className="summary-value warning">{content.quality_summary.warnings}</span>
          </div>
        </div>
      </div>

      {/* Decision Map */}
      {content.decision_map.length > 0 && (
        <div className="decision-map">
          <h4>⚖️ Decision Map</h4>
          <div className="decision-list">
            {content.decision_map.map((decision, i) => (
              <div key={i} className="decision-item">
                <div className="decision-header">
                  <span className="decision-number">{i + 1}</span>
                  <strong>{decision.decision_point}</strong>
                </div>
                <div className="decision-details">
                  <div className="decision-detail">
                    <span className="detail-label">Chosen from:</span>
                    <span className="detail-value">{decision.chosen_from_plan}</span>
                  </div>
                  <div className="decision-detail">
                    <span className="detail-label">Confidence:</span>
                    <span className="detail-value">
                      {(decision.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="decision-detail">
                    <span className="detail-label">Evidence:</span>
                    <span className="detail-value">
                      {decision.evidence_count} item(s)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {content.warnings && content.warnings.length > 0 && (
        <div className="warnings-section">
          <h4>⚠️ Warnings</h4>
          <ul className="warnings-list">
            {content.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {content.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4>💡 Recommendations</h4>
          <ul className="recommendations-list">
            {content.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="metrics-timestamp">
        Computed at: {new Date(content.metrics.computed_at).toLocaleString()}
      </div>
    </div>
  );
};

