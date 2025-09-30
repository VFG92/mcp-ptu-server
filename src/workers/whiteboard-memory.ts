/**
 * Whiteboard & Scratchpad Memory System
 * 
 * - Global whiteboard (DO-backed) for accepted artifacts
 * - Isolated scratchpads per capability
 * - Deterministic merge functions
 * - Diff-based updates with review gates
 */

import type { CapabilityResult } from './capability-graph.js';

/**
 * Artifact status
 */
export type ArtifactStatus = 'draft' | 'review' | 'accepted' | 'rejected';

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  id: string;
  type: string;                   // Schema type (e.g., 'unit_economics')
  status: ArtifactStatus;
  version: number;
  created_by: string;             // Capability ID
  created_at: number;
  updated_at: number;
  review_notes?: string;
}

/**
 * Artifact with metadata
 */
export interface Artifact {
  metadata: ArtifactMetadata;
  data: any;
  evidence_id?: string;           // Link to evidence ledger
}

/**
 * Diff between artifact versions
 */
export interface ArtifactDiff {
  artifact_id: string;
  from_version: number;
  to_version: number;
  changes: Array<{
    path: string;
    old_value: any;
    new_value: any;
    change_type: 'added' | 'modified' | 'removed';
  }>;
  summary: string;
}

/**
 * Merge conflict
 */
export interface MergeConflict {
  field: string;
  values: Array<{
    source: string;
    value: any;
    confidence: number;
  }>;
  resolution?: any;
  resolution_strategy?: string;
}

/**
 * Merge result
 */
export interface MergeResult {
  success: boolean;
  merged_data: any;
  conflicts: MergeConflict[];
  strategy_used: string;
}

/**
 * Global Whiteboard - persistent storage for accepted artifacts
 */
export class Whiteboard {
  private artifacts: Map<string, Artifact> = new Map();
  private versionHistory: Map<string, Artifact[]> = new Map();

  /**
   * Add artifact to whiteboard
   */
  add(
    id: string,
    type: string,
    data: any,
    createdBy: string,
    status: ArtifactStatus = 'draft'
  ): Artifact {
    const artifact: Artifact = {
      metadata: {
        id,
        type,
        status,
        version: 1,
        created_by: createdBy,
        created_at: Date.now(),
        updated_at: Date.now()
      },
      data
    };

    this.artifacts.set(id, artifact);
    this.versionHistory.set(id, [artifact]);

    return artifact;
  }

  /**
   * Update artifact (creates new version)
   */
  update(
    id: string,
    data: any,
    updatedBy: string,
    reviewNotes?: string
  ): Artifact | null {
    const current = this.artifacts.get(id);
    if (!current) return null;

    const updated: Artifact = {
      metadata: {
        ...current.metadata,
        version: current.metadata.version + 1,
        updated_at: Date.now(),
        review_notes: reviewNotes
      },
      data
    };

    this.artifacts.set(id, updated);
    
    // Add to version history
    const history = this.versionHistory.get(id) || [];
    history.push(updated);
    this.versionHistory.set(id, history);

    return updated;
  }

  /**
   * Get artifact
   */
  get(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Get artifact data only
   */
  getData(id: string): any | undefined {
    return this.artifacts.get(id)?.data;
  }

  /**
   * Check if artifact exists
   */
  has(id: string): boolean {
    return this.artifacts.has(id);
  }

  /**
   * Get all artifacts of a type
   */
  getByType(type: string): Artifact[] {
    return Array.from(this.artifacts.values())
      .filter(a => a.metadata.type === type);
  }

  /**
   * Get artifact history
   */
  getHistory(id: string): Artifact[] {
    return this.versionHistory.get(id) || [];
  }

  /**
   * Calculate diff between versions
   */
  diff(id: string, fromVersion: number, toVersion: number): ArtifactDiff | null {
    const history = this.versionHistory.get(id);
    if (!history) return null;

    const from = history.find(a => a.metadata.version === fromVersion);
    const to = history.find(a => a.metadata.version === toVersion);
    if (!from || !to) return null;

    const changes = this.calculateChanges(from.data, to.data, '');

    return {
      artifact_id: id,
      from_version: fromVersion,
      to_version: toVersion,
      changes,
      summary: `${changes.length} changes between v${fromVersion} and v${toVersion}`
    };
  }

  /**
   * Update artifact status
   */
  updateStatus(id: string, status: ArtifactStatus, notes?: string): boolean {
    const artifact = this.artifacts.get(id);
    if (!artifact) return false;

    artifact.metadata.status = status;
    artifact.metadata.updated_at = Date.now();
    if (notes) {
      artifact.metadata.review_notes = notes;
    }

    return true;
  }

  /**
   * Delete artifact
   */
  delete(id: string): boolean {
    const deleted = this.artifacts.delete(id);
    this.versionHistory.delete(id);
    return deleted;
  }

  /**
   * Get all artifact IDs
   */
  getAllIds(): string[] {
    return Array.from(this.artifacts.keys());
  }

  /**
   * Calculate changes between two objects
   */
  private calculateChanges(oldData: any, newData: any, path: string): ArtifactDiff['changes'] {
    const changes: ArtifactDiff['changes'] = [];

    // Handle primitives
    if (typeof oldData !== 'object' || typeof newData !== 'object') {
      if (oldData !== newData) {
        changes.push({
          path,
          old_value: oldData,
          new_value: newData,
          change_type: 'modified'
        });
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          path: newPath,
          old_value: undefined,
          new_value: newValue,
          change_type: 'added'
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          path: newPath,
          old_value: oldValue,
          new_value: undefined,
          change_type: 'removed'
        });
      } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
        changes.push(...this.calculateChanges(oldValue, newValue, newPath));
      } else if (oldValue !== newValue) {
        changes.push({
          path: newPath,
          old_value: oldValue,
          new_value: newValue,
          change_type: 'modified'
        });
      }
    }

    return changes;
  }
}

/**
 * Scratchpad - isolated workspace for a capability
 */
export class Scratchpad {
  private data: Map<string, any> = new Map();
  private capabilityId: string;

  constructor(capabilityId: string) {
    this.capabilityId = capabilityId;
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): boolean {
    return this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  getCapabilityId(): string {
    return this.capabilityId;
  }
}

/**
 * Merge strategies for conflicting artifacts
 */
export class ArtifactMerger {
  /**
   * Merge multiple artifacts using a strategy
   */
  merge(
    artifacts: Array<{ source: string; data: any; confidence: number }>,
    strategy: 'highest_confidence' | 'average' | 'consensus' | 'manual' = 'highest_confidence'
  ): MergeResult {
    switch (strategy) {
      case 'highest_confidence':
        return this.mergeByHighestConfidence(artifacts);
      case 'average':
        return this.mergeByAverage(artifacts);
      case 'consensus':
        return this.mergeByConsensus(artifacts);
      default:
        return {
          success: false,
          merged_data: null,
          conflicts: [],
          strategy_used: strategy
        };
    }
  }

  /**
   * Merge by selecting highest confidence values
   */
  private mergeByHighestConfidence(
    artifacts: Array<{ source: string; data: any; confidence: number }>
  ): MergeResult {
    if (artifacts.length === 0) {
      return {
        success: false,
        merged_data: null,
        conflicts: [],
        strategy_used: 'highest_confidence'
      };
    }

    // Sort by confidence
    const sorted = [...artifacts].sort((a, b) => b.confidence - a.confidence);
    
    return {
      success: true,
      merged_data: sorted[0].data,
      conflicts: [],
      strategy_used: 'highest_confidence'
    };
  }

  /**
   * Merge by averaging numeric values
   */
  private mergeByAverage(
    artifacts: Array<{ source: string; data: any; confidence: number }>
  ): MergeResult {
    // Simple implementation: just average top-level numeric fields
    const merged: any = {};
    const conflicts: MergeConflict[] = [];

    // Get all keys
    const allKeys = new Set<string>();
    for (const artifact of artifacts) {
      Object.keys(artifact.data).forEach(k => allKeys.add(k));
    }

    for (const key of allKeys) {
      const values = artifacts
        .filter(a => key in a.data)
        .map(a => ({ source: a.source, value: a.data[key], confidence: a.confidence }));

      if (values.length === 0) continue;

      // If all numeric, average them
      if (values.every(v => typeof v.value === 'number')) {
        const weightedSum = values.reduce((sum, v) => sum + v.value * v.confidence, 0);
        const totalWeight = values.reduce((sum, v) => sum + v.confidence, 0);
        merged[key] = weightedSum / totalWeight;
      } else {
        // Non-numeric: take highest confidence
        const best = values.sort((a, b) => b.confidence - a.confidence)[0];
        merged[key] = best.value;

        if (values.length > 1) {
          conflicts.push({
            field: key,
            values,
            resolution: best.value,
            resolution_strategy: 'highest_confidence'
          });
        }
      }
    }

    return {
      success: true,
      merged_data: merged,
      conflicts,
      strategy_used: 'average'
    };
  }

  /**
   * Merge by consensus (majority vote)
   */
  private mergeByConsensus(
    artifacts: Array<{ source: string; data: any; confidence: number }>
  ): MergeResult {
    // For now, fall back to highest confidence
    return this.mergeByHighestConfidence(artifacts);
  }
}

/**
 * Global instances
 */
export const globalWhiteboard = new Whiteboard();
export const globalArtifactMerger = new ArtifactMerger();

