/**
 * Session Lifecycle Edge Cases Tests
 * 
 * Tests for session management edge cases:
 * 1. Init with duplicate session_id
 * 2. Init after session terminated
 * 3. Operations on non-existent session
 * 4. Concurrent init with same session_id
 * 5. Recovery after DO eviction
 */

import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';

describe('Session Lifecycle Edge Cases', () => {
  let manager: ParallelReasoningSessionManager;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
  });

  describe('Init with duplicate session_id', () => {
    it('should return existing session when init called twice with same session_id', () => {
      const sessionId = 'test-session-001';
      const taskDescription = 'Analyze market opportunity';
      const requiredAxes = ['data_sources', 'analytical_models'];
      const minPlans = 3;

      // First init
      const session1 = manager.initSession({
        session_id: sessionId,
        task_description: taskDescription,
        required_diversity_axes: requiredAxes,
        min_plans: minPlans
      });

      expect(session1.session_id).toBe(sessionId);
      expect(session1.status).toBe('initialized');

      // Second init with same session_id (should be idempotent)
      const session2 = manager.initSession({
        session_id: sessionId,
        task_description: taskDescription,
        required_diversity_axes: requiredAxes,
        min_plans: minPlans
      });

      expect(session2.session_id).toBe(sessionId);
      expect(session2.status).toBe('initialized');
      expect(session2.created_at).toBe(session1.created_at); // Same session
      expect(session2.updated_at).toBeGreaterThanOrEqual(session1.updated_at); // Updated timestamp
    });

    it('should preserve existing plans when init called on existing session', () => {
      const sessionId = 'test-session-002';
      
      // Init session
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      // Submit a plan
      const plan = {
        plan_id: 'plan_A',
        description: 'Quantitative analysis',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan', 'competitive_analysis'],
        rationale: 'Data-driven approach',
        expected_outputs: ['Market size', 'Competitive landscape']
      };

      manager.submitPlan(sessionId, plan);

      // Init again (should RESET session to allow new workflow)
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      const session = manager.getSession(sessionId);
      // Session should be reset, so plans should be empty
      expect(session?.plans.size).toBe(0);
      expect(session?.status).toBe('initialized');
    });
  });

  describe('Init after session terminated', () => {
    it('should automatically reset terminated session on init', () => {
      const sessionId = 'test-session-003';

      // Init and terminate
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      manager.terminateSession(sessionId);

      const terminatedSession = manager.getSession(sessionId);
      expect(terminatedSession?.status).toBe('terminated');

      // Try to init again - should automatically reset to initialized
      const session2 = manager.initSession({
        session_id: sessionId,
        task_description: 'New test task',
        required_diversity_axes: ['data_sources', 'time_horizons'],
        min_plans: 3
      });

      expect(session2.status).toBe('initialized'); // Automatically reset
      expect(session2.task_description).toBe('New test task'); // Updated with new params
      expect(session2.required_diversity_axes).toEqual(['data_sources', 'time_horizons']);
      expect(session2.min_plans).toBe(3);
      expect(session2.plans.size).toBe(0); // Cleared
    });

    it('should allow reset and reinit after termination', () => {
      const sessionId = 'test-session-004';
      
      // Init, submit plan, terminate
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      manager.submitPlan(sessionId, {
        plan_id: 'plan_A',
        description: 'Test plan',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['Test output']
      });

      manager.terminateSession(sessionId);

      // Reset session (clears execution state but keeps config)
      manager.resetSession(sessionId);

      const resetSession = manager.getSession(sessionId);
      expect(resetSession?.status).toBe('initialized');
      expect(resetSession?.plans.size).toBe(0); // Plans cleared
    });
  });

  describe('Operations on non-existent session', () => {
    it('should return null when getting non-existent session', () => {
      const session = manager.getSession('non-existent-session');
      expect(session).toBeNull();
    });

    it('should throw error when submitting plan to non-existent session', () => {
      expect(() => {
        manager.submitPlan('non-existent-session', {
          plan_id: 'plan_A',
          description: 'Test',
          diversity_axes: ['data_sources', 'analytical_models'],
          capability_chain: ['market_scan'],
          rationale: 'Test',
          expected_outputs: ['Test']
        });
      }).toThrow();
    });

    it('should throw error when recording result for non-existent session', () => {
      expect(() => {
        manager.recordPlanResult('non-existent-session', 'plan_A', {
          content: [{ type: 'text', text: 'Test result' }]
        });
      }).toThrow();
    });

    it('should throw error when terminating non-existent session', () => {
      expect(() => {
        manager.terminateSession('non-existent-session');
      }).toThrow();
    });
  });

  describe('Concurrent init with same session_id', () => {
    it('should handle concurrent init calls gracefully', () => {
      const sessionId = 'test-session-005';
      const config = {
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      };

      // Simulate concurrent init calls
      const session1 = manager.initSession(config);
      const session2 = manager.initSession(config);
      const session3 = manager.initSession(config);

      // All should return the same session
      expect(session1.session_id).toBe(sessionId);
      expect(session2.session_id).toBe(sessionId);
      expect(session3.session_id).toBe(sessionId);
      expect(session1.created_at).toBe(session2.created_at);
      expect(session2.created_at).toBe(session3.created_at);

      // Only one session should exist
      const allSessions = manager.listSessions();
      const matchingSessions = allSessions.filter(s => s.session_id === sessionId);
      expect(matchingSessions.length).toBe(1);
    });
  });

  describe('Recovery after DO eviction', () => {
    it('should restore session state from serialized data', () => {
      const sessionId = 'test-session-006';
      
      // Create session with plan
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      manager.submitPlan(sessionId, {
        plan_id: 'plan_A',
        description: 'Test plan',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan', 'competitive_analysis'],
        rationale: 'Test rationale',
        expected_outputs: ['Test output']
      });

      // Serialize state (simulating persistence before eviction)
      const serialized = manager.serializeSessions();

      // Create new manager (simulating DO restart after eviction)
      const newManager = new ParallelReasoningSessionManager();
      
      // Restore state
      newManager.loadSessions(serialized);

      // Verify session was restored
      const restoredSession = newManager.getSession(sessionId);
      expect(restoredSession).not.toBeNull();
      expect(restoredSession?.session_id).toBe(sessionId);
      expect(restoredSession?.task_description).toBe('Test task');
      expect(restoredSession?.plans.size).toBe(1);
      expect(restoredSession?.plans.has('plan_A')).toBe(true);
    });

    it('should handle empty state restoration', () => {
      const manager = new ParallelReasoningSessionManager();
      
      // Load empty state
      manager.loadSessions([]);

      const sessions = manager.listSessions();
      expect(sessions.length).toBe(0);
    });

    it('should handle corrupted state gracefully', () => {
      const manager = new ParallelReasoningSessionManager();
      
      // Try to load invalid data (should not crash)
      expect(() => {
        manager.loadSessions(null as any);
      }).not.toThrow();

      expect(() => {
        manager.loadSessions(undefined as any);
      }).not.toThrow();
    });
  });

  describe('Session reset and delete', () => {
    it('should reset session execution state but keep config', () => {
      const sessionId = 'test-session-007';
      
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      manager.submitPlan(sessionId, {
        plan_id: 'plan_A',
        description: 'Test plan',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['Test']
      });

      // Reset
      manager.resetSession(sessionId);

      const session = manager.getSession(sessionId);
      expect(session?.status).toBe('initialized');
      expect(session?.task_description).toBe('Test task'); // Config preserved
      expect(session?.plans.size).toBe(0); // Execution state cleared
    });

    it('should completely delete session', () => {
      const sessionId = 'test-session-008';
      
      manager.initSession({
        session_id: sessionId,
        task_description: 'Test task',
        required_diversity_axes: ['data_sources', 'analytical_models'],
        min_plans: 2
      });

      // Delete
      manager.deleteSession(sessionId);

      const session = manager.getSession(sessionId);
      expect(session).toBeNull();
    });
  });
});

