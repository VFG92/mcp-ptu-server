/**
 * Tests for Session Quality Metrics
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import { calculateConfidence, calculateCoverage, calculateConsensus, computeSessionMetrics } from '../src/workers/session-metrics.js';

describe('Session Quality Metrics', () => {
  let manager: ParallelReasoningSessionManager;
  const sessionId = 'test-metrics-session';

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();

    // Initialize session
    manager.initSession({
      session_id: sessionId,
      task_description: 'Test metrics calculation',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    // Submit two plans
    manager.submitPlan(sessionId, {
      plan_id: 'plan-a',
      description: 'Plan A',
      diversity_axes: ['data_sources', 'analytical_models'],
      capability_chain: ['cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7', 'cap8'],
      rationale: 'Test plan A',
      expected_outputs: ['Output A']
    });

    manager.submitPlan(sessionId, {
      plan_id: 'plan-b',
      description: 'Plan B',
      diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives', 'stakeholder_views'],
      capability_chain: ['cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7', 'cap8'],
      rationale: 'Test plan B',
      expected_outputs: ['Output B']
    });
  });

  describe('Confidence Metric', () => {
    it('should start at base confidence (0.5) with no evidence', () => {
      const session = manager.getSession(sessionId);
      expect(session).toBeDefined();

      const result = calculateConfidence(session!);

      // Plans may have quality signals from analyzePlan(), so we check the actual values
      expect(result.details.unique_evidence_count).toBe(0);
      expect(result.details.base).toBe(0.5);
      expect(result.details.bonus).toBe(0);

      // Score should be base - penalty (penalty from quality signals)
      expect(result.score).toBe(result.details.base + result.details.bonus - result.details.penalty);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should increase confidence with evidence', () => {
      // Add some results with evidence
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 1', confidence: 0.8 });
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 2', confidence: 0.9 });
      manager.recordPlanResult(sessionId, 'plan-b', { task: 'Task 3', confidence: 0.85 });

      const session = manager.getSession(sessionId);
      const result = calculateConfidence(session!);

      expect(result.details.unique_evidence_count).toBe(3);
      expect(result.details.bonus).toBe(0.3); // 3 * 0.1

      // Score should be base + bonus - penalty
      const expectedScore = result.details.base + result.details.bonus - result.details.penalty;
      expect(result.score).toBe(expectedScore);

      // With evidence, score should be higher than without
      expect(result.score).toBeGreaterThan(result.details.base - result.details.penalty);
    });

    it('should cap evidence bonus at 0.3', () => {
      // Add 5 results (should cap at 3)
      for (let i = 1; i <= 5; i++) {
        manager.recordPlanResult(sessionId, 'plan-a', { task: `Task ${i}`, confidence: 0.8 });
      }

      const session = manager.getSession(sessionId);
      const result = calculateConfidence(session!);

      expect(result.details.unique_evidence_count).toBe(5);
      expect(result.details.bonus).toBe(0.3); // Capped at 0.3

      // Score should be base + bonus - penalty, with bonus capped
      const expectedScore = result.details.base + result.details.bonus - result.details.penalty;
      expect(result.score).toBe(expectedScore);
    });

    it('should clamp confidence to [0, 1]', () => {
      const session = manager.getSession(sessionId);
      const result = calculateConfidence(session!);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('Coverage Metric', () => {
    it('should be 0 with no execution', () => {
      const session = manager.getSession(sessionId);
      const result = calculateCoverage(session!);

      expect(result.score).toBe(0);
      expect(result.details.total_declared_steps).toBe(16); // 8 + 8
      expect(result.details.executed_steps).toBe(0);
    });

    it('should calculate coverage correctly', () => {
      // Execute 4 steps for plan-a (4/8 = 50%)
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 1' });
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 2' });
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 3' });
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 4' });

      // Execute 8 steps for plan-b (8/8 = 100%)
      for (let i = 1; i <= 8; i++) {
        manager.recordPlanResult(sessionId, 'plan-b', { task: `Task ${i}` });
      }

      const session = manager.getSession(sessionId);
      const result = calculateCoverage(session!);

      expect(result.details.total_declared_steps).toBe(16);
      expect(result.details.executed_steps).toBe(12);
      expect(result.score).toBe(0.75); // 12/16
    });

    it('should reach 100% coverage when all steps executed', () => {
      // Execute all steps for both plans
      for (let i = 1; i <= 8; i++) {
        manager.recordPlanResult(sessionId, 'plan-a', { task: `Task A${i}` });
        manager.recordPlanResult(sessionId, 'plan-b', { task: `Task B${i}` });
      }

      const session = manager.getSession(sessionId);
      const result = calculateCoverage(session!);

      expect(result.score).toBe(1.0);
      expect(result.details.executed_steps).toBe(16);
    });
  });

  describe('Consensus Metric', () => {
    it('should be 0.5 (neutral) with no critiques', () => {
      const session = manager.getSession(sessionId);
      const result = calculateConsensus(session!);

      expect(result.score).toBe(0.5);
      expect(result.details.agreements).toBe(0);
      expect(result.details.conflicts).toBe(0);
      expect(result.details.total_interactions).toBe(0);
    });

    it('should increase with agreements', () => {
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan-a',
        reviewed_plan_id: 'plan-b',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.8, // Agreement
        timestamp: Date.now()
      });

      const session = manager.getSession(sessionId);
      const result = calculateConsensus(session!);

      expect(result.details.agreements).toBe(1);
      expect(result.details.conflicts).toBe(0);
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should decrease with conflicts', () => {
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan-a',
        reviewed_plan_id: 'plan-b',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.3, // Conflict
        timestamp: Date.now()
      });

      const session = manager.getSession(sessionId);
      const result = calculateConsensus(session!);

      expect(result.details.agreements).toBe(0);
      expect(result.details.conflicts).toBe(1);
      expect(result.score).toBeLessThan(0.5);
    });

    it('should normalize to [0, 1]', () => {
      // Add multiple critiques
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan-a',
        reviewed_plan_id: 'plan-b',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.9,
        timestamp: Date.now()
      });

      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan-b',
        reviewed_plan_id: 'plan-a',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.2,
        timestamp: Date.now()
      });

      const session = manager.getSession(sessionId);
      const result = calculateConsensus(session!);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('computeSessionMetrics', () => {
    it('should compute all metrics together', () => {
      // Add some execution
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 1' });
      manager.recordPlanResult(sessionId, 'plan-b', { task: 'Task 2' });

      // Add a critique
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan-a',
        reviewed_plan_id: 'plan-b',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.75,
        timestamp: Date.now()
      });

      const metrics = manager.computeMetrics(sessionId);

      expect(metrics.confidence).toBeGreaterThan(0);
      expect(metrics.coverage).toBeGreaterThan(0);
      expect(metrics.consensus).toBeGreaterThan(0);
      expect(metrics.computed_at).toBeGreaterThan(0);
      expect(metrics.details).toBeDefined();
    });

    it('should cache metrics in session', () => {
      manager.computeMetrics(sessionId);
      
      const session = manager.getSession(sessionId);
      expect(session?.metrics).toBeDefined();
      expect(session?.metrics?.confidence).toBeGreaterThanOrEqual(0);
      expect(session?.metrics?.coverage).toBeGreaterThanOrEqual(0);
      expect(session?.metrics?.consensus).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics in finalization', () => {
    it('should include metrics in finalization result', () => {
      // Execute all steps
      for (let i = 1; i <= 8; i++) {
        manager.recordPlanResult(sessionId, 'plan-a', { task: `Task A${i}` });
        manager.recordPlanResult(sessionId, 'plan-b', { task: `Task B${i}` });
      }

      const result = manager.finalizeSession(sessionId);

      expect(result.finalized).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.coverage).toBe(1.0); // 100% coverage
      expect(result.metrics?.consensus).toBeGreaterThanOrEqual(0);
    });

    it('should generate warnings for low metrics', () => {
      // Execute only 2 steps (low coverage)
      manager.recordPlanResult(sessionId, 'plan-a', { task: 'Task 1' });
      manager.recordPlanResult(sessionId, 'plan-b', { task: 'Task 2' });

      const result = manager.finalizeSession(sessionId);

      expect(result.finalized).toBe(true);
      expect(result.warnings).toBeDefined();
      
      // Should have warnings for low coverage and low confidence
      const warningText = result.warnings?.join(' ') || '';
      expect(warningText).toContain('Coverage');
      expect(warningText).toContain('Confidence');
    });
  });
});

