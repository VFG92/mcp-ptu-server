/**
 * Validation Helpers for MCP PTU Server
 *
 * Client-side validation utilities to help ChatGPT construct valid payloads
 * before calling MCP tools, preventing common errors.
 */

import { z } from 'zod';
import {
  parseAxisString,
  satisfiesRequiredAxes,
  calculateSemanticDiversity
} from './parallel-reasoning-mcp.js';

/**
 * Session health status
 */
export interface SessionHealthStatus {
  healthy: boolean;
  session_exists: boolean;
  session_active: boolean;
  token_valid: boolean;
  token_used: boolean;
  token_expired: boolean;
  time_until_expiry_hours: number;
  warnings: string[];
  recommendations: string[];
}

/**
 * Diversity axes validation result
 */
export interface DiversityAxesValidationResult {
  valid: boolean;
  satisfies_required: boolean;
  min_axes_met: boolean;
  unique_from_existing: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  missing_required_axes: string[];
  diversity_scores: { plan_id: string; diversity_count: number }[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Payload size breakdown
 */
export interface PayloadSizeBreakdown {
  total_bytes: number;
  total_kb: number;
  exceeds_limit: boolean;
  breakdown: {
    findings: number;
    evidence_refs: number;
    workpapers: number;
    other: number;
  };
}

/**
 * Validate execution results payload before calling register_execution_results
 * 
 * Checks for common issues:
 * - Extra fields (e.g., session_id)
 * - Null values in optional fields
 * - URLs in evidence_refs (causes 403)
 * - Payload size >10KB
 * - Missing required fields
 * 
 * @param payload - The payload to validate
 * @returns Validation result with errors, warnings, and suggestions
 */
export function validateExecutionResults(payload: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check if payload is an object
  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { valid: false, errors, warnings, suggestions };
  }

  // Check for required top-level fields
  if (!payload.execution_token) {
    errors.push('Missing required field: execution_token');
  }

  if (!payload.results) {
    errors.push('Missing required field: results');
  } else if (!Array.isArray(payload.results)) {
    errors.push('Field "results" must be an array');
  }

  // Check for extra top-level fields
  const allowedTopLevelFields = ['execution_token', 'results'];
  const extraFields = Object.keys(payload).filter(key => !allowedTopLevelFields.includes(key));
  
  if (extraFields.length > 0) {
    errors.push(`Extra fields not allowed: ${extraFields.join(', ')}. Only "execution_token" and "results" are allowed at top level.`);
    suggestions.push('Remove extra fields like "session_id" - they are inferred from the execution token');
  }

  // Validate each result
  if (Array.isArray(payload.results)) {
    payload.results.forEach((result: any, index: number) => {
      const resultPrefix = `results[${index}]`;

      // Check required fields
      if (!result.plan_id) {
        errors.push(`${resultPrefix}: Missing required field "plan_id"`);
      }
      if (!result.step_id) {
        errors.push(`${resultPrefix}: Missing required field "step_id"`);
      }
      if (!result.findings) {
        errors.push(`${resultPrefix}: Missing required field "findings"`);
      }

      // Check for null values in optional fields
      if (result.evidence_refs === null) {
        errors.push(`${resultPrefix}: Field "evidence_refs" cannot be null. Use [] (empty array) or omit the field.`);
        suggestions.push(`${resultPrefix}: Change "evidence_refs": null to "evidence_refs": []`);
      }

      if (result.workpapers === null) {
        errors.push(`${resultPrefix}: Field "workpapers" cannot be null. Use [] (empty array) or omit the field.`);
        suggestions.push(`${resultPrefix}: Change "workpapers": null to "workpapers": []`);
      }

      // Check for URLs in evidence_refs (causes 403 moderation block)
      if (Array.isArray(result.evidence_refs)) {
        result.evidence_refs.forEach((ref: any, refIndex: number) => {
          if (ref.type === 'url') {
            errors.push(`${resultPrefix}.evidence_refs[${refIndex}]: type "url" will cause 403 moderation block`);
            suggestions.push(`${resultPrefix}.evidence_refs[${refIndex}]: Use type "citation" instead and put URL in findings text or workpapers`);
          }

          if (ref.source && typeof ref.source === 'string' && ref.source.match(/^https?:\/\//)) {
            warnings.push(`${resultPrefix}.evidence_refs[${refIndex}]: URL in "source" field may cause 403 moderation block`);
            suggestions.push(`${resultPrefix}.evidence_refs[${refIndex}]: Move URL to findings text: "Source: ${ref.description} (${ref.source})"`);
          }
        });
      }

      // Check findings length
      if (result.findings && typeof result.findings === 'string') {
        if (result.findings.length > 1000) {
          warnings.push(`${resultPrefix}: findings is very long (${result.findings.length} chars). Consider moving details to workpapers.`);
          suggestions.push(`${resultPrefix}: Keep findings under 500 chars for optimal performance`);
        } else if (result.findings.length > 500) {
          warnings.push(`${resultPrefix}: findings is long (${result.findings.length} chars). Recommended: ≤500 chars.`);
        }
      }

      // Check for extra fields in result
      const allowedResultFields = ['plan_id', 'step_id', 'findings', 'evidence_refs', 'workpapers', 'reasoning_trace'];
      const extraResultFields = Object.keys(result).filter(key => !allowedResultFields.includes(key));
      
      if (extraResultFields.length > 0) {
        warnings.push(`${resultPrefix}: Extra fields may be ignored: ${extraResultFields.join(', ')}`);
      }
    });
  }

  // Check payload size
  const sizeCheck = checkPayloadSize(payload);
  if (sizeCheck.exceeds_limit) {
    warnings.push(`Payload size (${sizeCheck.total_kb.toFixed(2)} KB) exceeds recommended 10 KB limit`);
    suggestions.push('Consider splitting into multiple batches or moving large data to workpapers');
    suggestions.push(`Size breakdown: findings=${(sizeCheck.breakdown.findings / 1024).toFixed(2)}KB, workpapers=${(sizeCheck.breakdown.workpapers / 1024).toFixed(2)}KB, evidence_refs=${(sizeCheck.breakdown.evidence_refs / 1024).toFixed(2)}KB`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Check payload size and provide breakdown
 * 
 * @param payload - The payload to check
 * @returns Size breakdown with total and per-field sizes
 */
export function checkPayloadSize(payload: any): PayloadSizeBreakdown {
  const jsonString = JSON.stringify(payload);
  const totalBytes = new TextEncoder().encode(jsonString).length;
  const totalKb = totalBytes / 1024;

  // Calculate breakdown
  let findingsSize = 0;
  let evidenceRefsSize = 0;
  let workpapersSize = 0;

  if (Array.isArray(payload.results)) {
    payload.results.forEach((result: any) => {
      if (result.findings) {
        findingsSize += new TextEncoder().encode(JSON.stringify(result.findings)).length;
      }
      if (result.evidence_refs) {
        evidenceRefsSize += new TextEncoder().encode(JSON.stringify(result.evidence_refs)).length;
      }
      if (result.workpapers) {
        workpapersSize += new TextEncoder().encode(JSON.stringify(result.workpapers)).length;
      }
    });
  }

  const otherSize = totalBytes - findingsSize - evidenceRefsSize - workpapersSize;

  return {
    total_bytes: totalBytes,
    total_kb: totalKb,
    exceeds_limit: totalKb > 10,
    breakdown: {
      findings: findingsSize,
      evidence_refs: evidenceRefsSize,
      workpapers: workpapersSize,
      other: otherSize
    }
  };
}

/**
 * Format validation result as human-readable text
 * 
 * @param result - Validation result to format
 * @returns Formatted text output
 */
export function formatValidationResult(result: ValidationResult): string {
  let output = '';

  if (result.valid) {
    output += '✅ **Validation Passed**\n\n';
    output += 'Payload is valid and ready to submit.\n\n';
  } else {
    output += '❌ **Validation Failed**\n\n';
  }

  if (result.errors.length > 0) {
    output += '## Errors (must fix)\n\n';
    result.errors.forEach(error => {
      output += `- ❌ ${error}\n`;
    });
    output += '\n';
  }

  if (result.warnings.length > 0) {
    output += '## Warnings (recommended to fix)\n\n';
    result.warnings.forEach(warning => {
      output += `- ⚠️ ${warning}\n`;
    });
    output += '\n';
  }

  if (result.suggestions.length > 0) {
    output += '## Suggestions\n\n';
    result.suggestions.forEach(suggestion => {
      output += `- 💡 ${suggestion}\n`;
    });
    output += '\n';
  }

  return output;
}

/**
 * Sanitize payload for moderation safety
 *
 * Detects and fixes common patterns that cause 403 moderation blocks:
 * - URLs in evidence_refs → move to findings
 * - type: "url" → change to "citation"
 * - Long academic citations → truncate
 *
 * @param payload - The payload to sanitize
 * @returns Sanitized payload and list of changes made
 */
export function sanitizeForModeration(payload: any): { sanitized: any; changes: string[] } {
  const changes: string[] = [];
  const sanitized = JSON.parse(JSON.stringify(payload)); // Deep clone

  if (Array.isArray(sanitized.results)) {
    sanitized.results.forEach((result: any, index: number) => {
      // Move URLs from evidence_refs to findings
      if (Array.isArray(result.evidence_refs)) {
        const urlRefs: any[] = [];

        result.evidence_refs = result.evidence_refs.filter((ref: any, refIndex: number) => {
          // Remove type: "url"
          if (ref.type === 'url') {
            urlRefs.push(ref);
            changes.push(`results[${index}].evidence_refs[${refIndex}]: Removed type="url" reference (moved to findings)`);
            return false;
          }

          // Remove URLs in source field
          if (ref.source && typeof ref.source === 'string' && ref.source.match(/^https?:\/\//)) {
            urlRefs.push(ref);
            changes.push(`results[${index}].evidence_refs[${refIndex}]: Removed URL from source field (moved to findings)`);
            return false;
          }

          return true;
        });

        // Add URLs to findings text
        if (urlRefs.length > 0) {
          const urlText = urlRefs.map(ref => `${ref.description || 'Source'} (${ref.source})`).join(', ');
          result.findings = result.findings ? `${result.findings} Sources: ${urlText}` : `Sources: ${urlText}`;
          changes.push(`results[${index}].findings: Added ${urlRefs.length} URL(s) from evidence_refs`);
        }
      }
    });
  }

  return { sanitized, changes };
}

/**
 * Split execution results into chunks under size limit
 *
 * Automatically divides large payloads into multiple batches,
 * each under the specified size limit (default 10KB).
 *
 * OPTIMIZATIONS:
 * - Pre-calculates result sizes to avoid repeated JSON.stringify calls
 * - Uses cached TextEncoder for better performance
 * - Implements efficient bin-packing algorithm
 * - Minimizes memory allocations
 *
 * @param payload - The payload to split
 * @param maxSizeKb - Maximum size per chunk in KB (default: 10)
 * @returns Array of chunked payloads, each with same execution_token
 */
export function splitExecutionResults(
  payload: any,
  maxSizeKb: number = 10
): { chunks: any[]; summary: string } {
  const chunks: any[] = [];
  const maxSizeBytes = maxSizeKb * 1024;

  if (!payload.results || !Array.isArray(payload.results)) {
    return {
      chunks: [payload],
      summary: 'No splitting needed - results array is empty or missing'
    };
  }

  // Check if splitting is needed
  const totalSize = checkPayloadSize(payload);
  if (!totalSize.exceeds_limit) {
    return {
      chunks: [payload],
      summary: `No splitting needed - payload size (${totalSize.total_kb.toFixed(2)} KB) is under limit`
    };
  }

  // OPTIMIZATION: Pre-calculate all result sizes once
  const encoder = new TextEncoder();
  const resultSizes = new Map<any, number>();
  const resultsByPlan = new Map<string, Array<{ result: any; size: number }>>();

  payload.results.forEach((result: any) => {
    // Calculate size once and cache it
    const resultJson = JSON.stringify(result);
    const size = encoder.encode(resultJson).length;
    resultSizes.set(result, size);

    // Group by plan_id
    const planId = result.plan_id || 'unknown';
    if (!resultsByPlan.has(planId)) {
      resultsByPlan.set(planId, []);
    }
    resultsByPlan.get(planId)!.push({ result, size });
  });

  // OPTIMIZATION: Calculate base overhead once (execution_token + JSON structure)
  const baseOverhead = encoder.encode(JSON.stringify({
    execution_token: payload.execution_token,
    results: []
  })).length;

  // Create chunks using greedy bin-packing algorithm
  let currentChunk: any[] = [];
  let currentChunkSize = baseOverhead;

  for (const [planId, items] of resultsByPlan) {
    for (const { result, size } of items) {
      // If single result exceeds limit, it goes in its own chunk
      if (size + baseOverhead > maxSizeBytes) {
        // Flush current chunk if not empty
        if (currentChunk.length > 0) {
          chunks.push({
            execution_token: payload.execution_token,
            results: currentChunk
          });
          currentChunk = [];
          currentChunkSize = baseOverhead;
        }

        // Add oversized result as single chunk (with warning)
        chunks.push({
          execution_token: payload.execution_token,
          results: [result]
        });
        continue;
      }

      // OPTIMIZATION: Account for JSON array overhead (commas, brackets)
      const arrayOverhead = currentChunk.length > 0 ? 1 : 0; // comma separator

      // Check if adding this result would exceed limit
      if (currentChunkSize + size + arrayOverhead > maxSizeBytes && currentChunk.length > 0) {
        // Flush current chunk
        chunks.push({
          execution_token: payload.execution_token,
          results: currentChunk
        });
        currentChunk = [];
        currentChunkSize = baseOverhead;
      }

      // Add result to current chunk
      currentChunk.push(result);
      currentChunkSize += size + (currentChunk.length > 1 ? 1 : 0);
    }
  }

  // Flush remaining chunk
  if (currentChunk.length > 0) {
    chunks.push({
      execution_token: payload.execution_token,
      results: currentChunk
    });
  }

  // OPTIMIZATION: Calculate chunk sizes from cached data instead of re-serializing
  const chunkSummaries = chunks.map((chunk, i) => {
    const chunkSize = chunk.results.reduce((sum: number, r: any) =>
      sum + (resultSizes.get(r) || 0), baseOverhead);
    return `#${i + 1}: ${(chunkSize / 1024).toFixed(2)}KB (${chunk.results.length} results)`;
  });

  const summary = `Split ${payload.results.length} results into ${chunks.length} chunks. ` +
                  `Original size: ${totalSize.total_kb.toFixed(2)} KB. ` +
                  `Chunk sizes: ${chunkSummaries.join(', ')}`;

  return { chunks, summary };
}

/**
 * Compress findings by moving details to workpapers
 *
 * Identifies findings that are too long and suggests moving
 * detailed content to workpapers for better payload size management.
 *
 * @param payload - The payload to compress
 * @param maxFindingsLength - Maximum length for findings field (default: 500)
 * @returns Compressed payload and list of changes made
 */
export function compressFindings(
  payload: any,
  maxFindingsLength: number = 500
): { compressed: any; changes: string[]; preview: string } {
  const changes: string[] = [];
  const compressed = JSON.parse(JSON.stringify(payload)); // Deep clone

  if (!Array.isArray(compressed.results)) {
    return {
      compressed,
      changes: [],
      preview: 'No compression needed - results array is empty or missing'
    };
  }

  compressed.results.forEach((result: any, index: number) => {
    if (!result.findings || typeof result.findings !== 'string') {
      return;
    }

    if (result.findings.length <= maxFindingsLength) {
      return;
    }

    // Extract detailed content
    const originalFindings = result.findings;
    const summary = originalFindings.substring(0, maxFindingsLength - 50) + '... (see workpapers for details)';

    // Create workpaper with full content
    const workpaper = {
      type: 'analysis',
      title: `Detailed Findings for ${result.step_id}`,
      content: originalFindings,
      format: 'markdown'
    };

    // Update result
    result.findings = summary;
    if (!result.workpapers) {
      result.workpapers = [];
    }
    result.workpapers.push(workpaper);

    const savedBytes = originalFindings.length - summary.length;
    changes.push(
      `results[${index}]: Compressed findings from ${originalFindings.length} to ${summary.length} chars ` +
      `(saved ${savedBytes} bytes). Details moved to workpaper.`
    );
  });

  const preview = changes.length > 0
    ? `Compressed ${changes.length} findings. Total savings: ${changes.reduce((sum, change) => {
        const match = change.match(/saved ([0-9]+) bytes/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0)} bytes`
    : 'No compression needed - all findings are under limit';

  return { compressed, changes, preview };
}

/**
 * Check session health and token validity
 *
 * Verifies session state, token validity, and time remaining before expiration.
 * Provides warnings and recommendations for proactive token management.
 *
 * Note: This is a client-side helper that analyzes token structure.
 * For server-side validation, the actual session state is checked by the server.
 *
 * @param executionToken - The execution token to check
 * @returns Health status with warnings and recommendations
 */
export function checkSessionHealth(executionToken: string): SessionHealthStatus {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Parse token structure: exec_{session_id}_{timestamp}_{random}
  const tokenParts = executionToken.split('_');

  if (tokenParts.length < 4 || tokenParts[0] !== 'exec') {
    return {
      healthy: false,
      session_exists: false,
      session_active: false,
      token_valid: false,
      token_used: false,
      token_expired: false,
      time_until_expiry_hours: 0,
      warnings: ['Invalid token format. Expected: exec_{session_id}_{timestamp}_{random}'],
      recommendations: ['Generate a new token with execute_reasoning_manifest']
    };
  }

  // Extract timestamp (3rd part)
  const timestamp = parseInt(tokenParts[2]);
  if (isNaN(timestamp)) {
    warnings.push('Cannot parse token timestamp');
    recommendations.push('Generate a new token with execute_reasoning_manifest');
    return {
      healthy: false,
      session_exists: true,
      session_active: true,
      token_valid: false,
      token_used: false,
      token_expired: false,
      time_until_expiry_hours: 0,
      warnings,
      recommendations
    };
  }

  // Calculate expiry (tokens valid for 7 days)
  const now = Date.now();
  const expiresAt = timestamp + (7 * 24 * 60 * 60 * 1000); // 7 days
  const timeUntilExpiryMs = expiresAt - now;
  const timeUntilExpiryHours = timeUntilExpiryMs / (60 * 60 * 1000);
  const tokenExpired = timeUntilExpiryMs <= 0;

  // Generate warnings based on time remaining
  if (tokenExpired) {
    warnings.push(`Token expired ${Math.abs(timeUntilExpiryHours).toFixed(1)} hours ago`);
    recommendations.push('Use regenerate_execution_token to get a new token while preserving results');
  } else if (timeUntilExpiryHours < 1) {
    warnings.push(`Token expires in ${(timeUntilExpiryHours * 60).toFixed(0)} minutes`);
    recommendations.push('Regenerate token soon with regenerate_execution_token');
  } else if (timeUntilExpiryHours < 24) {
    warnings.push(`Token expires in ${timeUntilExpiryHours.toFixed(1)} hours`);
    recommendations.push('Consider regenerating token if workflow will take >24h');
  }

  const healthy = !tokenExpired && timeUntilExpiryHours > 1;

  return {
    healthy,
    session_exists: true,
    session_active: true,
    token_valid: !tokenExpired,
    token_used: false, // Cannot determine from token alone
    token_expired: tokenExpired,
    time_until_expiry_hours: timeUntilExpiryHours,
    warnings,
    recommendations
  };
}

/**
 * Format session health status as human-readable text
 *
 * @param status - Health status to format
 * @returns Formatted text output
 */
export function formatSessionHealth(status: SessionHealthStatus): string {
  let output = '';

  if (status.healthy) {
    output += '✅ **Session Health: Good**\n\n';
  } else {
    output += '⚠️ **Session Health: Issues Detected**\n\n';
  }

  output += '## Status\n\n';
  output += `- Session exists: ${status.session_exists ? '✅' : '❌'}\n`;
  output += `- Session active: ${status.session_active ? '✅' : '❌'}\n`;
  output += `- Token valid: ${status.token_valid ? '✅' : '❌'}\n`;
  output += `- Token expired: ${status.token_expired ? '❌ Yes' : '✅ No'}\n`;

  if (status.token_valid) {
    output += `- Time until expiry: ${status.time_until_expiry_hours.toFixed(1)} hours\n`;
  }

  output += '\n';

  if (status.warnings.length > 0) {
    output += '## Warnings\n\n';
    status.warnings.forEach(warning => {
      output += `- ⚠️ ${warning}\n`;
    });
    output += '\n';
  }

  if (status.recommendations.length > 0) {
    output += '## Recommendations\n\n';
    status.recommendations.forEach(rec => {
      output += `- 💡 ${rec}\n`;
    });
    output += '\n';
  }

  return output;
}

/**
 * Validate diversity axes before submitting a plan
 *
 * Checks if a plan's diversity axes satisfy all requirements:
 * - Minimum 2 axes
 * - All required axes present (semantic match)
 * - Differs from existing plans on ≥2 axes
 *
 * @param planAxes - The plan's diversity axes
 * @param requiredAxes - Required diversity axes from session
 * @param existingPlans - Existing plans with their axes
 * @returns Validation result with detailed feedback
 */
export function validateDiversityAxes(
  planAxes: string[],
  requiredAxes: string[],
  existingPlans: { plan_id: string; diversity_axes: string[] }[] = []
): DiversityAxesValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const missingRequiredAxes: string[] = [];
  const diversityScores: { plan_id: string; diversity_count: number }[] = [];

  // Check minimum axes (≥2)
  const minAxesMet = planAxes.length >= 2;
  if (!minAxesMet) {
    errors.push(`Plan must have at least 2 diversity axes (currently has ${planAxes.length})`);
    suggestions.push('Add more diversity axes to differentiate this plan from others');
  }

  // Check required axes (semantic match)
  const satisfiesRequired = satisfiesRequiredAxes(planAxes, requiredAxes);

  if (!satisfiesRequired) {
    errors.push('Plan does not satisfy all required diversity axes');

    // Find which required axes are missing
    const planParsed = planAxes.map(parseAxisString);
    const planKeys = new Set(planParsed.map(p => p.key));

    requiredAxes.forEach(reqAxis => {
      const reqParsed = parseAxisString(reqAxis);

      // Check for exact match or partial match
      let found = false;
      for (const planKey of planKeys) {
        if (planKey === reqParsed.key ||
            planKey.includes(reqParsed.key) ||
            reqParsed.key.includes(planKey)) {
          found = true;
          break;
        }
      }

      if (!found) {
        missingRequiredAxes.push(reqAxis);
      }
    });

    if (missingRequiredAxes.length > 0) {
      errors.push(`Missing required axes: ${missingRequiredAxes.join(', ')}`);
      suggestions.push('Add axes that match the missing required axes (semantic match - key must be present, value can differ)');

      // Suggest abbreviated forms
      missingRequiredAxes.forEach(missing => {
        const parsed = parseAxisString(missing);
        suggestions.push(`For "${missing}", you could use: "${parsed.key}: <your_value>"`);
      });
    }
  }

  // Check uniqueness from existing plans (≥2 axes different)
  let uniqueFromExisting = true;
  let minDiversityCount = Infinity;
  let mostSimilarPlanId = '';

  if (existingPlans.length > 0) {
    for (const existingPlan of existingPlans) {
      const diversityCount = calculateSemanticDiversity(planAxes, existingPlan.diversity_axes);

      diversityScores.push({
        plan_id: existingPlan.plan_id,
        diversity_count: diversityCount
      });

      if (diversityCount < minDiversityCount) {
        minDiversityCount = diversityCount;
        mostSimilarPlanId = existingPlan.plan_id;
      }

      if (diversityCount < 2) {
        uniqueFromExisting = false;
      }
    }

    if (!uniqueFromExisting) {
      errors.push(`Plan is too similar to existing plan "${mostSimilarPlanId}" (only ${minDiversityCount} axes differ, need ≥2)`);
      suggestions.push('Change at least 2 axes to be semantically different from all existing plans');
      suggestions.push('Semantic difference means: different keys OR same key with different values');

      // Show which axes are similar
      const mostSimilarPlan = existingPlans.find(p => p.plan_id === mostSimilarPlanId);
      if (mostSimilarPlan) {
        const planParsed = planAxes.map(parseAxisString);
        const similarParsed = mostSimilarPlan.diversity_axes.map(parseAxisString);

        const similarAxes: string[] = [];
        planParsed.forEach(p1 => {
          similarParsed.forEach(p2 => {
            if (p1.key === p2.key && p1.value === p2.value) {
              similarAxes.push(`"${p1.original}" (same as in ${mostSimilarPlanId})`);
            }
          });
        });

        if (similarAxes.length > 0) {
          warnings.push(`Similar axes to ${mostSimilarPlanId}: ${similarAxes.join(', ')}`);
        }
      }
    } else if (minDiversityCount === 2) {
      warnings.push(`Plan barely meets diversity requirement (only 2 axes differ from ${mostSimilarPlanId})`);
      suggestions.push('Consider adding more diverse axes for better plan differentiation');
    }
  }

  const valid = minAxesMet && satisfiesRequired && uniqueFromExisting;

  return {
    valid,
    satisfies_required: satisfiesRequired,
    min_axes_met: minAxesMet,
    unique_from_existing: uniqueFromExisting,
    errors,
    warnings,
    suggestions,
    missing_required_axes: missingRequiredAxes,
    diversity_scores: diversityScores
  };
}

/**
 * Format diversity axes validation result as human-readable text
 *
 * @param result - Validation result to format
 * @returns Formatted text output
 */
export function formatDiversityAxesValidation(result: DiversityAxesValidationResult): string {
  let output = '';

  if (result.valid) {
    output += '✅ **Diversity Axes Validation Passed**\n\n';
    output += 'Plan axes satisfy all requirements and are ready to submit.\n\n';
  } else {
    output += '❌ **Diversity Axes Validation Failed**\n\n';
  }

  // Status summary
  output += '## Validation Status\n\n';
  output += `- Minimum axes (≥2): ${result.min_axes_met ? '✅' : '❌'}\n`;
  output += `- Required axes satisfied: ${result.satisfies_required ? '✅' : '❌'}\n`;
  output += `- Unique from existing plans: ${result.unique_from_existing ? '✅' : '❌'}\n`;
  output += '\n';

  // Diversity scores
  if (result.diversity_scores.length > 0) {
    output += '## Diversity Scores (vs existing plans)\n\n';
    result.diversity_scores.forEach(score => {
      const status = score.diversity_count >= 2 ? '✅' : '❌';
      output += `- ${status} ${score.plan_id}: ${score.diversity_count} axes differ (need ≥2)\n`;
    });
    output += '\n';
  }

  // Errors
  if (result.errors.length > 0) {
    output += '## Errors (must fix)\n\n';
    result.errors.forEach(error => {
      output += `- ❌ ${error}\n`;
    });
    output += '\n';
  }

  // Missing required axes
  if (result.missing_required_axes.length > 0) {
    output += '## Missing Required Axes\n\n';
    result.missing_required_axes.forEach(axis => {
      const parsed = parseAxisString(axis);
      output += `- ❌ "${axis}"\n`;
      output += `  - Key: "${parsed.key}"\n`;
      output += `  - Suggested abbreviated form: "${parsed.key}: <your_value>"\n`;
    });
    output += '\n';
  }

  // Warnings
  if (result.warnings.length > 0) {
    output += '## Warnings\n\n';
    result.warnings.forEach(warning => {
      output += `- ⚠️ ${warning}\n`;
    });
    output += '\n';
  }

  // Suggestions
  if (result.suggestions.length > 0) {
    output += '## Suggestions\n\n';
    result.suggestions.forEach(suggestion => {
      output += `- 💡 ${suggestion}\n`;
    });
    output += '\n';
  }

  return output;
}

/**
 * Suggest diversity axes for a new plan
 *
 * Given required axes and existing plans, suggests valid axes for a new plan
 * that will satisfy requirements and ensure sufficient diversity.
 *
 * @param requiredAxes - Required diversity axes from session
 * @param existingPlans - Existing plans with their axes
 * @param preferredValues - Optional preferred values for specific axes
 * @returns Suggested axes with explanations
 */
export function suggestDiversityAxes(
  requiredAxes: string[],
  existingPlans: { plan_id: string; diversity_axes: string[] }[] = [],
  preferredValues: Record<string, string> = {}
): {
  suggested_axes: string[];
  explanations: string[];
  diversity_preview: { plan_id: string; diversity_count: number }[];
} {
  const suggestedAxes: string[] = [];
  const explanations: string[] = [];

  // Parse required axes to get keys
  const requiredParsed = requiredAxes.map(parseAxisString);

  // For each required axis, suggest a value
  requiredParsed.forEach(req => {
    // Check if user has a preferred value
    if (preferredValues[req.key]) {
      const suggestedAxis = `${req.key}: ${preferredValues[req.key]}`;
      suggestedAxes.push(suggestedAxis);
      explanations.push(`Using preferred value for "${req.original}": ${preferredValues[req.key]}`);
      return;
    }

    // Collect values used by existing plans for this key
    const usedValues = new Set<string>();
    existingPlans.forEach(plan => {
      plan.diversity_axes.forEach(axis => {
        const parsed = parseAxisString(axis);
        if (parsed.key === req.key ||
            parsed.key.includes(req.key) ||
            req.key.includes(parsed.key)) {
          if (parsed.value) {
            usedValues.add(parsed.value);
          }
        }
      });
    });

    // Extract possible values from required axis description
    const possibleValues = extractPossibleValues(req.original);

    // Find an unused value
    let selectedValue = '';
    if (possibleValues.length > 0) {
      // Try to find a value not used by existing plans
      const unusedValue = possibleValues.find(v => !usedValues.has(v.toLowerCase()));
      selectedValue = unusedValue || possibleValues[0];

      if (unusedValue) {
        explanations.push(`For "${req.original}": Selected "${selectedValue}" (not used by existing plans)`);
      } else {
        explanations.push(`For "${req.original}": Selected "${selectedValue}" (all values used, but different combinations ensure diversity)`);
      }
    } else {
      // No values in description, suggest a generic one
      selectedValue = 'option_' + (usedValues.size + 1);
      explanations.push(`For "${req.original}": Suggested "${selectedValue}" (no values specified in requirement)`);
    }

    suggestedAxes.push(`${req.key}: ${selectedValue}`);
  });

  // Calculate diversity preview
  const diversityPreview = existingPlans.map(plan => ({
    plan_id: plan.plan_id,
    diversity_count: calculateSemanticDiversity(suggestedAxes, plan.diversity_axes)
  }));

  // Check if diversity is sufficient (≥2 for all plans)
  const insufficientDiversity = diversityPreview.filter(p => p.diversity_count < 2);
  if (insufficientDiversity.length > 0) {
    explanations.push('⚠️ Warning: Suggested axes may not provide sufficient diversity from all existing plans');
    explanations.push('Consider changing values for: ' + insufficientDiversity.map(p => p.plan_id).join(', '));
  }

  return {
    suggested_axes: suggestedAxes,
    explanations,
    diversity_preview: diversityPreview
  };
}

/**
 * Extract possible values from axis description
 *
 * EXTENDED VERSION: Supports multiple separator patterns:
 * - "vs" separator: "Cloud vs Hybrid vs On-premise"
 * - Slash separator: "Cloud/Hybrid/On-premise"
 * - Comma separator: "Primary, Secondary, Tertiary"
 * - Dash separator: "Short-term - Long-term"
 * - Parentheses: "(Option A vs Option B)"
 * - Brackets: "[Option A, Option B]"
 * - Colon lists: "Options: A, B, C"
 * - Range notation: "1-5 years" (extracts endpoints)
 *
 * @param axisDescription - The axis description string
 * @returns Array of possible values
 */
function extractPossibleValues(axisDescription: string): string[] {
  const values: string[] = [];
  let match;

  // Pattern 1: "vs" separated values (most common)
  // Example: "Premium vs Budget vs Mid-market"
  const vsPattern = /\b([\w\-]+(?:\s+[\w\-]+)*)\s+vs\s+([\w\-]+(?:\s+[\w\-]+)*)/g;
  while ((match = vsPattern.exec(axisDescription)) !== null) {
    values.push(match[1].trim());
    values.push(match[2].trim());
  }

  // Pattern 2: Slash separated values
  // Example: "Cloud/Hybrid/On-premise"
  const slashPattern = /\b([\w\-]+(?:\s+[\w\-]+)*)\/+([\w\-]+(?:\s+[\w\-]+)*)/g;
  while ((match = slashPattern.exec(axisDescription)) !== null) {
    match[0].split('/').forEach(part => {
      const trimmed = part.trim();
      if (trimmed && !values.includes(trimmed)) {
        values.push(trimmed);
      }
    });
  }

  // Pattern 3: Comma separated values
  // Example: "Primary, Secondary, Tertiary"
  const commaPattern = /:\s*([^,\[\]()]+(?:,\s*[^,\[\]()]+)+)/g;
  while ((match = commaPattern.exec(axisDescription)) !== null) {
    match[1].split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed && trimmed.length > 1 && !values.includes(trimmed)) {
        values.push(trimmed);
      }
    });
  }

  // Pattern 4: Dash separated values (with spaces around dash)
  // Example: "Short-term - Long-term" or "Qualitative - Quantitative"
  const dashPattern = /\b([\w\-]+(?:\s+[\w\-]+)*)\s+-\s+([\w\-]+(?:\s+[\w\-]+)*)/g;
  while ((match = dashPattern.exec(axisDescription)) !== null) {
    values.push(match[1].trim());
    values.push(match[2].trim());
  }

  // Pattern 5: Values in parentheses
  // Example: "(accettazione vs contestazione)" or "(Option A, Option B)"
  const parenPattern = /\(([^)]+)\)/g;
  while ((match = parenPattern.exec(axisDescription)) !== null) {
    const content = match[1];

    // Try vs separator first
    if (content.includes(' vs ')) {
      content.split(/\s+vs\s+/).forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !values.includes(trimmed)) {
          values.push(trimmed);
        }
      });
    }
    // Try comma separator
    else if (content.includes(',')) {
      content.split(',').forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !values.includes(trimmed)) {
          values.push(trimmed);
        }
      });
    }
    // Try slash separator
    else if (content.includes('/')) {
      content.split('/').forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !values.includes(trimmed)) {
          values.push(trimmed);
        }
      });
    }
  }

  // Pattern 6: Values in brackets
  // Example: "[Option A, Option B]" or "[Cloud, Hybrid, On-premise]"
  const bracketPattern = /\[([^\]]+)\]/g;
  while ((match = bracketPattern.exec(axisDescription)) !== null) {
    const content = match[1];

    // Try comma separator
    if (content.includes(',')) {
      content.split(',').forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !values.includes(trimmed)) {
          values.push(trimmed);
        }
      });
    }
    // Try vs separator
    else if (content.includes(' vs ')) {
      content.split(/\s+vs\s+/).forEach(part => {
        const trimmed = part.trim();
        if (trimmed && !values.includes(trimmed)) {
          values.push(trimmed);
        }
      });
    }
  }

  // Pattern 7: Range notation (extract endpoints)
  // Example: "1-5 years" → ["1 years", "5 years"]
  // Example: "Short-term (1-3 years)" → ["1", "3"]
  const rangePattern = /(\d+)\s*-\s*(\d+)\s*(years?|months?|days?|quarters?)?/gi;
  while ((match = rangePattern.exec(axisDescription)) !== null) {
    const unit = match[3] || '';
    const val1 = `${match[1]}${unit ? ' ' + unit : ''}`;
    const val2 = `${match[2]}${unit ? ' ' + unit : ''}`;
    if (!values.includes(val1)) values.push(val1);
    if (!values.includes(val2)) values.push(val2);
  }

  // Pattern 8: Colon-prefixed lists
  // Example: "Options: A, B, C" or "Types: Cloud, Hybrid"
  const colonListPattern = /:\s*([A-Z][\w\-]*(?:,\s*[A-Z][\w\-]*)+)/g;
  while ((match = colonListPattern.exec(axisDescription)) !== null) {
    match[1].split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed && !values.includes(trimmed)) {
        values.push(trimmed);
      }
    });
  }

  // Remove duplicates and filter out very short values (likely noise)
  const uniqueValues = Array.from(new Set(values))
    .filter(v => {
      // Keep single uppercase letters (e.g., "A", "B", "C" as options)
      if (v.length === 1 && /[A-Z]/.test(v)) return true;
      // Keep values longer than 1 character
      if (v.length > 1) return true;
      // Filter out everything else (single lowercase, symbols, etc.)
      return false;
    })
    .filter(v => !/^[0-9]+$/.test(v) || v.length <= 2); // Keep numbers only if short

  return uniqueValues;
}

/**
 * Format diversity axes suggestions as human-readable text
 *
 * @param suggestions - Suggestions result to format
 * @returns Formatted text output
 */
export function formatDiversityAxesSuggestions(suggestions: {
  suggested_axes: string[];
  explanations: string[];
  diversity_preview: { plan_id: string; diversity_count: number }[];
}): string {
  let output = '💡 **Diversity Axes Suggestions**\n\n';

  output += '## Suggested Axes\n\n';
  output += '```json\n';
  output += '[\n';
  suggestions.suggested_axes.forEach((axis, i) => {
    output += `  "${axis}"${i < suggestions.suggested_axes.length - 1 ? ',' : ''}\n`;
  });
  output += ']\n';
  output += '```\n\n';

  output += '## Explanations\n\n';
  suggestions.explanations.forEach(exp => {
    output += `- ${exp}\n`;
  });
  output += '\n';

  if (suggestions.diversity_preview.length > 0) {
    output += '## Diversity Preview (vs existing plans)\n\n';
    suggestions.diversity_preview.forEach(preview => {
      const status = preview.diversity_count >= 2 ? '✅' : '⚠️';
      output += `- ${status} ${preview.plan_id}: ${preview.diversity_count} axes differ (need ≥2)\n`;
    });
    output += '\n';
  }

  output += '**Next steps**: Review suggestions and adjust values as needed to match your plan\'s approach.\n';

  return output;
}
