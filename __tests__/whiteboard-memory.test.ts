import { describe, it, expect } from '@jest/globals';

import { Whiteboard, Scratchpad, ArtifactMerger } from '../src/workers/whiteboard-memory.js';

describe('whiteboard memory system', () => {
  it('tracks artifact versions, diffs, and status updates', () => {
    const whiteboard = new Whiteboard();
    const initial = whiteboard.add('artifact-1', 'unit_economics', { revenue: 100, margin: 0.4 }, 'capability_a', 'accepted');
    expect(initial.metadata.version).toBe(1);

    const updated = whiteboard.update('artifact-1', { revenue: 120, margin: 0.45, notes: 'growth' }, 'capability_a', 'Increased revenue');
    expect(updated?.metadata.version).toBe(2);

    const history = whiteboard.getHistory('artifact-1');
    expect(history).toHaveLength(2);

    const diff = whiteboard.diff('artifact-1', 1, 2);
    expect(diff?.changes.find(change => change.path === 'revenue')?.change_type).toBe('modified');
    expect(diff?.changes.find(change => change.path === 'notes')?.change_type).toBe('added');

    const statusUpdated = whiteboard.updateStatus('artifact-1', 'review', 'Needs validation');
    expect(statusUpdated).toBe(true);
    expect(whiteboard.get('artifact-1')?.metadata.status).toBe('review');

    expect(whiteboard.getByType('unit_economics')).toHaveLength(1);
    expect(whiteboard.getAllIds()).toContain('artifact-1');

    const deleted = whiteboard.delete('artifact-1');
    expect(deleted).toBe(true);
    expect(whiteboard.has('artifact-1')).toBe(false);
  });

  it('manages scratchpad data per capability', () => {
    const pad = new Scratchpad('capability_x');
    pad.set('notes', 'draft analysis');
    expect(pad.get('notes')).toBe('draft analysis');
    expect(pad.has('notes')).toBe(true);
    pad.delete('notes');
    expect(pad.has('notes')).toBe(false);
    pad.set('another', 42);
    expect(pad.keys()).toEqual(['another']);
    pad.clear();
    expect(pad.keys()).toEqual([]);
    expect(pad.getCapabilityId()).toBe('capability_x');
  });

  it('merges artifacts using different strategies and reports conflicts', () => {
    const merger = new ArtifactMerger();
    const artifacts = [
      { source: 'A', data: { score: 0.8, note: 'Keep' }, confidence: 0.9 },
      { source: 'B', data: { score: 0.6, note: 'Review' }, confidence: 0.6 },
      { source: 'C', data: { score: 0.7 }, confidence: 0.5 }
    ];

    const highest = merger.merge(artifacts, 'highest_confidence');
    expect(highest.strategy_used).toBe('highest_confidence');
    expect(highest.merged_data.note).toBe('Keep');

    const averaged = merger.merge(artifacts, 'average');
    expect(averaged.merged_data.score).toBeCloseTo((0.8 * 0.9 + 0.6 * 0.6 + 0.7 * 0.5) / (0.9 + 0.6 + 0.5));
    expect(averaged.conflicts.some(conflict => conflict.field === 'note')).toBe(true);

    const consensus = merger.merge(artifacts, 'consensus');
    expect(consensus.strategy_used).toBe('highest_confidence');

    const manual = merger.merge([], 'manual');
    expect(manual.success).toBe(false);
  });
});
