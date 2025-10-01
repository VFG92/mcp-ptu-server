/**
 * Test session state persistence and artifact versioning
 * 
 * These tests verify:
 * 1. Session state (costs, executions) persists across multiple calls
 * 2. Artifact versions increment correctly instead of resetting to 1
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CapabilityOrchestrator } from '../src/workers/capability-orchestrator.js';
import { CapabilityGraph } from '../src/workers/capability-graph.js';
import { EvidenceLedger } from '../src/workers/evidence-ledger.js';
import { Whiteboard } from '../src/workers/whiteboard-memory.js';
import { initializeCapabilitySystem } from '../src/workers/capability-tools.js';
import { createDefaultBudget, createDefaultPolicy } from '../src/workers/capability-orchestrator.js';

describe('Session Persistence', () => {
  let whiteboard: Whiteboard;
  let ledger: EvidenceLedger;
  let graph: CapabilityGraph;

  beforeEach(() => {
    // Create fresh instances for each test
    whiteboard = new Whiteboard();
    ledger = new EvidenceLedger();
    graph = new CapabilityGraph();

    // Register a simple test capability
    graph.register({
      id: 'test_capability',
      name: 'Test Capability',
      description: 'A test capability',
      category: 'financial',
      tags: ['test'],
      version: '1.0.0',
      preconditions: {
        required_inputs: []
      },
      output_contract: {
        schema: {} as any,
        required_evidence: []
      },
      cost_estimate: {
        expected_tokens_in: 100,
        expected_tokens_out: 100,
        cpu_ms: 100,
        subrequests: 1,
        memory_kb: 1024
      },
      expected_precision: 0.9,
      execute: async (input: any, context: any) => {
        return {
          capability_id: 'test_capability',
          output: { test: 'data', timestamp: Date.now() },
          evidence: {},
          confidence: 0.9,
          cost_actual: {
            expected_tokens_in: 100,
            expected_tokens_out: 100,
            cpu_ms: 100,
            subrequests: 1,
            memory_kb: 1024
          },
          quality_score: 0.9,
          warnings: [],
          metadata: {
            execution_time_ms: 100,
            timestamp: Date.now(),
            version: '1.0.0'
          }
        };
      }
    });
  });

  it('should persist session state across multiple calls to initializeCapabilitySystem', async () => {
    const refs = { whiteboard, ledger };
    const sessionId = 'test-session-1';

    // First call - initialize
    const orch1 = initializeCapabilitySystem(refs);

    // Manually track some session data to simulate execution
    // @ts-ignore - accessing private method for testing
    orch1.trackSessionCost(sessionId, { tokens_in: 100, tokens_out: 100, cpu_ms: 100, subrequests: 1 });
    // @ts-ignore - accessing private method for testing
    orch1.trackCapabilityExecution(sessionId, {
      capability_id: 'test_cap_1',
      timestamp: Date.now(),
      success: true,
      cost: {}
    });

    // Get status after first "execution"
    const status1 = orch1.getSessionStatus(sessionId);
    expect(status1.capabilities_executed).toBe(1);
    expect(status1.total_cost.tokens_in).toBe(100);

    // Second call - should reuse the same orchestrator
    const orch2 = initializeCapabilitySystem(refs);

    // Verify it's the same instance
    expect(orch2).toBe(orch1);

    // Track more session data
    // @ts-ignore - accessing private method for testing
    orch2.trackSessionCost(sessionId, { tokens_in: 50, tokens_out: 50, cpu_ms: 50, subrequests: 1 });
    // @ts-ignore - accessing private method for testing
    orch2.trackCapabilityExecution(sessionId, {
      capability_id: 'test_cap_2',
      timestamp: Date.now(),
      success: true,
      cost: {}
    });

    // Get status after second "execution" - should show cumulative data
    const status2 = orch2.getSessionStatus(sessionId);
    expect(status2.capabilities_executed).toBe(2); // Should be 2, not 1
    expect(status2.total_cost.tokens_in).toBe(150); // Should be cumulative
  });

  it('should increment artifact version on subsequent executions', () => {
    const refs = { whiteboard, ledger };
    const capId = 'test_capability';

    // Simulate first execution - add artifact
    whiteboard.add(capId, 'financial', { data: 'v1' }, capId, 'accepted');

    const artifact1 = whiteboard.get(capId);
    expect(artifact1).toBeDefined();
    expect(artifact1?.metadata.version).toBe(1);

    // Simulate second execution - should use update() to increment version
    if (whiteboard.has(capId)) {
      whiteboard.update(capId, { data: 'v2' }, capId, 'Updated');
    } else {
      whiteboard.add(capId, 'financial', { data: 'v2' }, capId, 'accepted');
    }

    const artifact2 = whiteboard.get(capId);
    expect(artifact2).toBeDefined();
    expect(artifact2?.metadata.version).toBe(2); // Should be 2, not 1

    // Simulate third execution - should increment again
    if (whiteboard.has(capId)) {
      whiteboard.update(capId, { data: 'v3' }, capId, 'Updated');
    } else {
      whiteboard.add(capId, 'financial', { data: 'v3' }, capId, 'accepted');
    }

    const artifact3 = whiteboard.get(capId);
    expect(artifact3).toBeDefined();
    expect(artifact3?.metadata.version).toBe(3); // Should be 3, not 1
  });

  it('should maintain version history for artifacts', () => {
    const refs = { whiteboard, ledger };
    const capId = 'test_capability';

    // Simulate three executions
    whiteboard.add(capId, 'financial', { data: 'v1' }, capId, 'accepted');
    whiteboard.update(capId, { data: 'v2' }, capId, 'Updated');
    whiteboard.update(capId, { data: 'v3' }, capId, 'Updated');

    // Check version history
    const history = whiteboard.getHistory(capId);
    expect(history).toHaveLength(3);
    expect(history[0].metadata.version).toBe(1);
    expect(history[1].metadata.version).toBe(2);
    expect(history[2].metadata.version).toBe(3);
  });

  it('should rehydrate artifacts with original metadata and history intact', () => {
    const capId = 'rehydrate_capability';

    whiteboard.add(capId, 'financial', { data: 'v1' }, capId, 'accepted');
    whiteboard.update(capId, { data: 'v2' }, capId, 'Updated');
    whiteboard.update(capId, { data: 'v3' }, capId, 'Updated');

    const latestBefore = whiteboard.get(capId);
    const historyBefore = whiteboard.getHistory(capId);

    const snapshot = whiteboard.getAllIds().map(id => ({
      id,
      artifact: whiteboard.get(id)!,
      history: whiteboard.getHistory(id)
    }));

    const restored = new Whiteboard();
    for (const entry of snapshot) {
      restored.restore(entry.id, entry.artifact, entry.history);
    }

    const restoredArtifact = restored.get(capId);
    expect(restoredArtifact?.metadata.version).toBe(latestBefore?.metadata.version);
    expect(restoredArtifact?.metadata.created_at).toBe(latestBefore?.metadata.created_at);
    expect(restoredArtifact?.metadata.updated_at).toBe(latestBefore?.metadata.updated_at);

    const restoredHistory = restored.getHistory(capId);
    expect(restoredHistory).toHaveLength(historyBefore.length);
    expect(restoredHistory.map(h => h.metadata.version)).toEqual(
      historyBefore.map(h => h.metadata.version)
    );
  });

  it('should create new orchestrator when storage references change', async () => {
    const refs1 = { whiteboard: new Whiteboard(), ledger: new EvidenceLedger() };
    const refs2 = { whiteboard: new Whiteboard(), ledger: new EvidenceLedger() };

    const orch1 = initializeCapabilitySystem(refs1);
    const orch2 = initializeCapabilitySystem(refs2);

    // Should be different instances because storage changed
    expect(orch2).not.toBe(orch1);
  });

  it('should export complete session data with all versions', () => {
    const refs = { whiteboard, ledger };
    const sessionId = 'test-session-4';
    const capId = 'test_capability';

    const orch = initializeCapabilitySystem(refs);

    // Simulate two executions
    whiteboard.add(capId, 'financial', { data: 'v1' }, capId, 'accepted');
    whiteboard.update(capId, { data: 'v2' }, capId, 'Updated');

    // Track executions
    // @ts-ignore - accessing private method for testing
    orch.trackCapabilityExecution(sessionId, {
      capability_id: capId,
      timestamp: Date.now(),
      success: true,
      cost: {}
    });
    // @ts-ignore - accessing private method for testing
    orch.trackCapabilityExecution(sessionId, {
      capability_id: capId,
      timestamp: Date.now(),
      success: true,
      cost: {}
    });

    // Export session
    const exported = orch.exportSession(sessionId);

    expect(exported.session_id).toBe(sessionId);
    expect(exported.execution_summary.total_capabilities_executed).toBe(2);
    expect(exported.artifacts).toHaveLength(1);
    expect(exported.artifacts[0].version).toBe(2); // Should show latest version
  });
});

describe('Artifact Versioning Edge Cases', () => {
  let whiteboard: Whiteboard;

  beforeEach(() => {
    whiteboard = new Whiteboard();
  });

  it('should handle add() followed by update() correctly', () => {
    // Add initial artifact
    const artifact1 = whiteboard.add('test-id', 'test-type', { value: 1 }, 'creator-1');
    expect(artifact1.metadata.version).toBe(1);

    // Update artifact
    const artifact2 = whiteboard.update('test-id', { value: 2 }, 'creator-1');
    expect(artifact2?.metadata.version).toBe(2);

    // Update again
    const artifact3 = whiteboard.update('test-id', { value: 3 }, 'creator-1');
    expect(artifact3?.metadata.version).toBe(3);
  });

  it('should maintain separate version histories for different artifacts', () => {
    whiteboard.add('artifact-1', 'type-1', { value: 1 }, 'creator-1');
    whiteboard.add('artifact-2', 'type-2', { value: 1 }, 'creator-2');

    whiteboard.update('artifact-1', { value: 2 }, 'creator-1');
    whiteboard.update('artifact-1', { value: 3 }, 'creator-1');

    whiteboard.update('artifact-2', { value: 2 }, 'creator-2');

    const history1 = whiteboard.getHistory('artifact-1');
    const history2 = whiteboard.getHistory('artifact-2');

    expect(history1).toHaveLength(3);
    expect(history2).toHaveLength(2);
  });

  it('should calculate diff between versions correctly', () => {
    whiteboard.add('test-id', 'test-type', { value: 1, name: 'test' }, 'creator-1');
    whiteboard.update('test-id', { value: 2, name: 'test', extra: 'field' }, 'creator-1');

    const diff = whiteboard.diff('test-id', 1, 2);
    expect(diff).toBeDefined();
    expect(diff?.changes).toHaveLength(2); // value modified, extra added
  });
});
