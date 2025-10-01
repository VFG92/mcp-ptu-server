/**
 * Evidence Ledger System
 * 
 * Tracks evidence for all claims with formulas, sources, and rationales.
 * Enables verification and audit trails for business decisions.
 */

import type { Evidence } from './capability-graph.js';
import { EvidenceType } from './capability-graph.js';

/**
 * Evidence entry in the ledger
 */
export interface EvidenceLedgerEntry {
  id: string;
  artifact_id: string;           // Which artifact this evidence supports
  field_path: string;             // Path to the field (e.g., "ltv.value")
  claim: string;                  // The claim being made
  evidence: Evidence[];           // Supporting evidence
  verification_status: 'unverified' | 'verified' | 'disputed' | 'rejected';
  verification_notes?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Verification result
 */
export interface VerificationResult {
  passed: boolean;
  checks_run: number;
  checks_passed: number;
  failures: Array<{
    check: string;
    reason: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  confidence_adjustment: number;  // -1 to +1, how much to adjust confidence
}

/**
 * Evidence Ledger
 */
export class EvidenceLedger {
  private entries: Map<string, EvidenceLedgerEntry> = new Map();
  private artifactIndex: Map<string, Set<string>> = new Map(); // artifact_id -> entry_ids

  /**
   * Add evidence for a claim
   */
  addEvidence(
    artifactId: string,
    fieldPath: string,
    claim: string,
    evidence: Evidence[]
  ): string {
    const id = this.generateId();
    const entry: EvidenceLedgerEntry = {
      id,
      artifact_id: artifactId,
      field_path: fieldPath,
      claim,
      evidence,
      verification_status: 'unverified',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    this.entries.set(id, entry);

    // Update index
    if (!this.artifactIndex.has(artifactId)) {
      this.artifactIndex.set(artifactId, new Set());
    }
    this.artifactIndex.get(artifactId)!.add(id);

    return id;
  }

  /**
   * Get a specific evidence entry by ID
   */
  getEntry(entryId: string): EvidenceLedgerEntry | undefined {
    return this.entries.get(entryId);
  }

  /**
   * Check if an evidence entry exists
   */
  hasEntry(entryId: string): boolean {
    return this.entries.has(entryId);
  }

  /**
   * Get evidence for an artifact
   */
  getEvidenceForArtifact(artifactId: string): EvidenceLedgerEntry[] {
    const entryIds = this.artifactIndex.get(artifactId);
    if (!entryIds) return [];

    return Array.from(entryIds)
      .map(id => this.entries.get(id))
      .filter((e): e is EvidenceLedgerEntry => e !== undefined);
  }

  /**
   * Get evidence for a specific field
   */
  getEvidenceForField(artifactId: string, fieldPath: string): EvidenceLedgerEntry | undefined {
    const entries = this.getEvidenceForArtifact(artifactId);
    return entries.find(e => e.field_path === fieldPath);
  }

  /**
   * Verify evidence for an artifact
   */
  verifyArtifact(artifactId: string, artifactData: any): VerificationResult {
    const entries = this.getEvidenceForArtifact(artifactId);
    
    const result: VerificationResult = {
      passed: true,
      checks_run: 0,
      checks_passed: 0,
      failures: [],
      confidence_adjustment: 0
    };

    for (const entry of entries) {
      const verification = this.verifyEntry(entry, artifactData);
      result.checks_run += verification.checks_run;
      result.checks_passed += verification.checks_passed;
      result.failures.push(...verification.failures);
      
      if (!verification.passed) {
        result.passed = false;
      }
    }

    // Calculate confidence adjustment
    if (result.checks_run > 0) {
      const passRate = result.checks_passed / result.checks_run;
      result.confidence_adjustment = (passRate - 0.5) * 0.2; // -0.1 to +0.1
    }

    return result;
  }

  /**
   * Verify a single evidence entry
   */
  private verifyEntry(entry: EvidenceLedgerEntry, artifactData: any): VerificationResult {
    const result: VerificationResult = {
      passed: true,
      checks_run: 0,
      checks_passed: 0,
      failures: [],
      confidence_adjustment: 0
    };

    for (const evidence of entry.evidence) {
      result.checks_run++;

      switch (evidence.type) {
        case EvidenceType.CALCULATION:
          if (!this.verifyCalculation(evidence, entry, artifactData)) {
            result.passed = false;
            result.failures.push({
              check: 'calculation_verification',
              reason: `Calculation for ${entry.field_path} could not be verified`,
              severity: 'critical'
            });
          } else {
            result.checks_passed++;
          }
          break;

        case EvidenceType.ASSUMPTION:
          if (!evidence.rationale) {
            result.passed = false;
            result.failures.push({
              check: 'assumption_rationale',
              reason: `Assumption for ${entry.field_path} lacks rationale`,
              severity: 'warning'
            });
          } else {
            result.checks_passed++;
          }
          break;

        case EvidenceType.RETRIEVAL:
          if (!evidence.source) {
            result.failures.push({
              check: 'retrieval_source',
              reason: `Retrieval for ${entry.field_path} lacks source`,
              severity: 'warning'
            });
          } else {
            result.checks_passed++;
          }
          break;

        case EvidenceType.SIMULATION:
          if (!evidence.confidence) {
            result.failures.push({
              check: 'simulation_confidence',
              reason: `Simulation for ${entry.field_path} lacks confidence interval`,
              severity: 'info'
            });
          } else {
            result.checks_passed++;
          }
          break;

        default:
          result.checks_passed++;
      }
    }

    return result;
  }

  /**
   * Verify a calculation
   */
  private verifyCalculation(evidence: Evidence, entry: EvidenceLedgerEntry, artifactData: any): boolean {
    if (!evidence.formula || !evidence.inputs) {
      return false;
    }

    // Basic verification: check that inputs are present
    for (const inputKey of Object.keys(evidence.inputs)) {
      if (evidence.inputs[inputKey] === undefined || evidence.inputs[inputKey] === null) {
        return false;
      }
    }

    // TODO: More sophisticated formula evaluation
    // For now, just check that formula and inputs exist
    return true;
  }

  /**
   * Get verification summary for an artifact
   */
  getVerificationSummary(artifactId: string): {
    total_claims: number;
    verified: number;
    unverified: number;
    disputed: number;
    evidence_types: Record<string, number>;
  } {
    const entries = this.getEvidenceForArtifact(artifactId);
    
    const summary = {
      total_claims: entries.length,
      verified: 0,
      unverified: 0,
      disputed: 0,
      evidence_types: {} as Record<string, number>
    };

    for (const entry of entries) {
      switch (entry.verification_status) {
        case 'verified':
          summary.verified++;
          break;
        case 'unverified':
          summary.unverified++;
          break;
        case 'disputed':
        case 'rejected':
          summary.disputed++;
          break;
      }

      for (const evidence of entry.evidence) {
        summary.evidence_types[evidence.type] = (summary.evidence_types[evidence.type] || 0) + 1;
      }
    }

    return summary;
  }

  /**
   * Update verification status
   */
  updateVerificationStatus(
    entryId: string,
    status: EvidenceLedgerEntry['verification_status'],
    notes?: string
  ): void {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.verification_status = status;
      entry.verification_notes = notes;
      entry.updated_at = Date.now();
    }
  }

  /**
   * Get evidence quality score for an artifact
   */
  getEvidenceQualityScore(artifactId: string): number {
    const entries = this.getEvidenceForArtifact(artifactId);
    if (entries.length === 0) return 0;

    let totalScore = 0;
    for (const entry of entries) {
      let entryScore = 0;
      
      for (const evidence of entry.evidence) {
        // Score by evidence type (higher is better)
        switch (evidence.type) {
          case EvidenceType.CALCULATION:
            entryScore += evidence.formula && evidence.inputs ? 1.0 : 0.3;
            break;
          case EvidenceType.RETRIEVAL:
            entryScore += evidence.source ? 0.9 : 0.3;
            break;
          case EvidenceType.SIMULATION:
            entryScore += evidence.confidence ? 0.8 : 0.4;
            break;
          case EvidenceType.PRECEDENT:
            entryScore += 0.7;
            break;
          case EvidenceType.ASSUMPTION:
            entryScore += evidence.rationale ? 0.5 : 0.2;
            break;
          case EvidenceType.HEURISTIC:
            entryScore += 0.4;
            break;
        }
      }
      
      // Average score for this entry
      if (entry.evidence.length > 0) {
        totalScore += entryScore / entry.evidence.length;
      }
    }

    return totalScore / entries.length;
  }

  /**
   * Export evidence for an artifact (for audit trail)
   */
  exportEvidence(artifactId: string): {
    artifact_id: string;
    exported_at: number;
    entries: EvidenceLedgerEntry[];
    summary: {
      total_claims: number;
      verified: number;
      unverified: number;
      disputed: number;
      evidence_types: Record<string, number>;
    };
    quality_score: number;
  } {
    return {
      artifact_id: artifactId,
      exported_at: Date.now(),
      entries: this.getEvidenceForArtifact(artifactId),
      summary: this.getVerificationSummary(artifactId),
      quality_score: this.getEvidenceQualityScore(artifactId)
    };
  }

  /**
   * Clear evidence for an artifact
   */
  clearArtifact(artifactId: string): void {
    const entryIds = this.artifactIndex.get(artifactId);
    if (entryIds) {
      for (const id of entryIds) {
        this.entries.delete(id);
      }
      this.artifactIndex.delete(artifactId);
    }
  }

  /**
   * Get all artifacts with evidence
   */
  getAllArtifactIds(): string[] {
    return Array.from(this.artifactIndex.keys());
  }

  private generateId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global evidence ledger instance
 */
export const globalEvidenceLedger = new EvidenceLedger();

