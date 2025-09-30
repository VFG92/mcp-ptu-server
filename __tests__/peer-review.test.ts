/**
 * Peer Review Kernel Tests
 * 
 * Tests the peer review system that enables critical evaluation
 * between agents, measuring consensus/conflict as robustness indicators.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PeerReviewKernel } from '../src/workers/peer-review-kernel.js';
import type { CapabilityResult } from '../src/workers/capability-graph.js';
import type { VerificationResult } from '../src/workers/evidence-ledger.js';

describe('PeerReviewKernel', () => {
  let kernel: PeerReviewKernel;

  beforeEach(() => {
    kernel = new PeerReviewKernel();
  });

  // Helper function to create a valid CapabilityResult
  const createResult = (id: string, confidence: number, value: number): CapabilityResult => ({
    capability_id: id,
    output: { value },
    evidence: {},
    confidence,
    cost_actual: { expected_tokens_in: 100, expected_tokens_out: 200, cpu_ms: 50, subrequests: 1 },
    quality_score: 0.8,
    warnings: [],
    metadata: {
      execution_time_ms: 100,
      timestamp: Date.now(),
      version: '1.0.0'
    }
  });

  // Helper function to create a valid VerificationResult
  const createVerification = (passed: boolean, checksRun: number, checksPassed: number): VerificationResult => ({
    passed,
    checks_run: checksRun,
    checks_passed: checksPassed,
    failures: [],
    confidence_adjustment: passed ? 0.1 : -0.1
  });

  describe('conductPeerReview', () => {
    it('should handle single result gracefully', async () => {
      const results: CapabilityResult[] = [
        createResult('cap1', 0.9, 100)
      ];

      const verifications = new Map<string, VerificationResult>();
      verifications.set('cap1', createVerification(true, 5, 4));

      const session = await kernel.conductPeerReview(results, verifications);

      expect(session.results_reviewed).toBe(1);
      expect(session.consensus_analysis.consensus_score).toBe(1.0);
      expect(session.overall_robustness).toBe(0.5); // Single result has moderate robustness
    });

    it('should generate critiques between multiple results', async () => {
      const results: CapabilityResult[] = [
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.85, 95),
        createResult('cap3', 0.5, 50)
      ];

      const verifications = new Map<string, VerificationResult>();
      for (const result of results) {
        verifications.set(result.capability_id, createVerification(true, 5, 4));
      }

      const session = await kernel.conductPeerReview(results, verifications);

      expect(session.results_reviewed).toBe(3);
      expect(session.peer_reviews.size).toBe(3);

      // Each result should have received critiques from the other 2
      for (const [id, peerReview] of session.peer_reviews) {
        expect(peerReview.received_critiques.length).toBe(2);
        expect(peerReview.given_critiques.length).toBe(2);
      }
    });

    it('should calculate consensus score correctly', async () => {
      // Create results with high agreement
      const results: CapabilityResult[] = [
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.88, 98)
      ];

      const verifications = new Map<string, VerificationResult>();
      for (const result of results) {
        verifications.set(result.capability_id, createVerification(true, 5, 5));
      }

      const session = await kernel.conductPeerReview(results, verifications);

      // High confidence similarity should lead to high consensus
      expect(session.consensus_analysis.consensus_score).toBeGreaterThan(0.7);
      expect(session.consensus_analysis.conflict_score).toBeLessThan(0.3);
      expect(session.overall_robustness).toBeGreaterThan(0.7);
    });

    it('should detect conflicts and disagreements', async () => {
      // Create results with low agreement
      const results: CapabilityResult[] = [
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.3, 50)
      ];

      const verifications = new Map<string, VerificationResult>();
      verifications.set('cap1', createVerification(true, 5, 5));
      verifications.set('cap2', createVerification(false, 5, 2));

      const session = await kernel.conductPeerReview(results, verifications);

      // Low confidence similarity should lead to low consensus
      expect(session.consensus_analysis.consensus_score).toBeLessThan(0.5);
      expect(session.consensus_analysis.conflict_score).toBeGreaterThan(0.5);
      expect(session.consensus_analysis.critical_disagreements.length).toBeGreaterThan(0);
    });

    it('should identify clusters of agreeing results', async () => {
      const results: CapabilityResult[] = [
        // Cluster 1: High confidence results
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.88, 98),
        // Cluster 2: Medium confidence results
        createResult('cap3', 0.6, 60),
        createResult('cap4', 0.58, 58)
      ];

      const verifications = new Map<string, VerificationResult>();
      for (const result of results) {
        verifications.set(result.capability_id, createVerification(true, 5, 4));
      }

      const session = await kernel.conductPeerReview(results, verifications);

      // Should identify at least 1 cluster
      expect(session.consensus_analysis.clusters.length).toBeGreaterThanOrEqual(1);

      // Each cluster should have members
      for (const cluster of session.consensus_analysis.clusters) {
        expect(cluster.member_ids.length).toBeGreaterThan(0);
        expect(cluster.representative_id).toBeDefined();
      }
    });

    it('should identify outliers', async () => {
      const results: CapabilityResult[] = [
        // Normal results
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.85, 95),
        // Outlier
        createResult('cap3', 0.2, 10)
      ];

      const verifications = new Map<string, VerificationResult>();
      verifications.set('cap1', createVerification(true, 5, 5));
      verifications.set('cap2', createVerification(true, 5, 4));
      verifications.set('cap3', createVerification(false, 5, 1));

      const session = await kernel.conductPeerReview(results, verifications);

      // Should identify cap3 as outlier
      expect(session.consensus_analysis.outliers.length).toBeGreaterThan(0);
      expect(session.consensus_analysis.outliers).toContain('cap3');
    });

    it('should assess review quality', async () => {
      const results: CapabilityResult[] = [
        createResult('cap1', 0.9, 100),
        createResult('cap2', 0.85, 95)
      ];

      const verifications = new Map<string, VerificationResult>();
      for (const result of results) {
        verifications.set(result.capability_id, createVerification(true, 5, 4));
      }

      const session = await kernel.conductPeerReview(results, verifications);

      // Review quality should be reasonable (0-1 range)
      expect(session.review_quality).toBeGreaterThanOrEqual(0);
      expect(session.review_quality).toBeLessThanOrEqual(1);

      // With 2 results, should have full coverage (2 critiques expected)
      expect(session.review_quality).toBeGreaterThan(0.5);
    });
  });
});

