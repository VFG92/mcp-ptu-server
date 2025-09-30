/**
 * MCP Tools for Capability-Driven Architecture
 * 
 * New tools that expose the capability system to MCP clients.
 */

import { z } from 'zod';
import { CapabilityOrchestrator, type OrchestrationRequest, createDefaultBudget, createDefaultPolicy } from './capability-orchestrator.js';
import { globalCapabilityGraph } from './capability-graph.js';
import { globalEvidenceLedger, EvidenceLedger } from './evidence-ledger.js';
import { globalWhiteboard, Whiteboard } from './whiteboard-memory.js';
import { registerAllCapabilities } from './capabilities/index.js';

/**
 * Capability system references from Durable Object
 */
export interface CapabilitySystemRefs {
  whiteboard?: Whiteboard;
  ledger?: EvidenceLedger;
  persistCallback?: () => Promise<void>;
}

/**
 * Tool names
 */
export enum CapabilityToolName {
  ANALYZE_WITH_CAPABILITIES = 'analyze_with_capabilities',
  GET_CAPABILITY_STATUS = 'get_capability_status',
  EXPORT_SESSION = 'export_session',
  LIST_CAPABILITIES = 'list_capabilities'
}

/**
 * Schemas for tool inputs
 */
export const AnalyzeWithCapabilitiesSchema = z.object({
  session_id: z.string().describe('Unique session identifier'),
  task: z.string().describe('Business analysis task description'),
  adapter_id: z.enum(['strategy', 'finance', 'commercial', 'risk', 'comprehensive']).optional()
    .describe('Optional adapter to focus analysis (strategy, finance, commercial, risk, comprehensive)'),
  required_artifacts: z.array(z.string()).optional()
    .describe('Optional list of required output artifact types'),
  budget: z.object({
    max_tokens_in: z.number().default(10000),
    max_tokens_out: z.number().default(10000),
    max_cpu_ms: z.number().default(10000),
    max_subrequests: z.number().default(50)
  }).optional().describe('Optional budget constraints'),
  tournament_mode: z.boolean().optional().default(true)
    .describe('Tournament mode for multi-agent quality (DEFAULT: enabled, set to false to disable)'),
  industry_vertical: z.enum([
    'consumer_saas', 'enterprise_saas', 'automotive', 'pharmaceutical', 'energy',
    'financial_services', 'manufacturing', 'retail', 'healthcare', 'telecommunications',
    'aerospace', 'agriculture', 'construction', 'education', 'media_entertainment',
    'logistics', 'real_estate', 'professional_services', 'government', 'generic'
  ]).optional().describe('Industry vertical (auto-detected if not provided)'),
  geographic_region: z.enum([
    'north_america', 'europe', 'asia_pacific', 'latin_america', 'middle_east', 'africa', 'global'
  ]).optional().describe('Geographic region for regulatory context'),
  entity_names: z.record(z.string()).optional()
    .describe('Actual entity names to use (e.g., {"competitor_1": "Tesla", "competitor_2": "BYD"})')
});

export const GetCapabilityStatusSchema = z.object({
  session_id: z.string().describe('Session identifier')
});

export const ExportSessionSchema = z.object({
  session_id: z.string().describe('Session identifier')
});

export const ListCapabilitiesSchema = z.object({
  category: z.enum(['market', 'financial', 'operational', 'risk', 'strategic', 'commercial']).optional()
    .describe('Optional category filter'),
  tag: z.string().optional().describe('Optional tag filter')
});

/**
 * Initialize capability system (call once at startup)
 * Now accepts optional DO references for persistence
 */
let orchestrator: CapabilityOrchestrator | null = null;
let currentWhiteboard: Whiteboard | null = null;
let currentLedger: EvidenceLedger | null = null;

export function initializeCapabilitySystem(refs?: CapabilitySystemRefs): CapabilityOrchestrator {
  // Always register capabilities
  registerAllCapabilities();

  console.log(`[CapabilitySystem] Registered ${globalCapabilityGraph.size()} capabilities`);

  // Use DO whiteboard/ledger if provided, otherwise use globals
  const whiteboard = refs?.whiteboard || globalWhiteboard;
  const ledger = refs?.ledger || globalEvidenceLedger;

  // Only create a new orchestrator if:
  // 1. No orchestrator exists yet, OR
  // 2. The storage references have changed (e.g., different DO instance)
  if (!orchestrator || currentWhiteboard !== whiteboard || currentLedger !== ledger) {
    console.log('[CapabilitySystem] Creating new orchestrator instance');
    orchestrator = new CapabilityOrchestrator(
      globalCapabilityGraph,
      ledger,
      whiteboard
    );
    currentWhiteboard = whiteboard;
    currentLedger = ledger;
  } else {
    console.log('[CapabilitySystem] Reusing existing orchestrator instance');
  }

  return orchestrator;
}

/**
 * Tool handlers
 */

export async function handleAnalyzeWithCapabilities(
  args: z.infer<typeof AnalyzeWithCapabilitiesSchema>,
  refs?: CapabilitySystemRefs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const orch = initializeCapabilitySystem(refs);

  const request: OrchestrationRequest = {
    session_id: args.session_id,
    task: args.task,
    budget: args.budget || createDefaultBudget(),
    policy: createDefaultPolicy(),
    adapter_id: args.adapter_id,
    required_artifacts: args.required_artifacts,
    tournament_mode: args.tournament_mode,
    industry_vertical: args.industry_vertical,
    geographic_region: args.geographic_region,
    entity_names: args.entity_names
  };

  try {
    const result = await orch.execute(request);

    // Persist to Durable Object storage after execution
    if (refs?.persistCallback) {
      console.log(`[CapabilityTools] Persisting capability state after execution`);
      await refs.persistCallback();
      console.log(`[CapabilityTools] Capability state persisted successfully`);
    }
    
    // Format response
    let response = `# Analysis Results\n\n`;
    response += `**Status**: ${result.success ? '✅ Complete' : result.partial ? '⚠️ Partial' : '❌ Failed'}\n`;
    response += `**Coverage**: ${(result.coverage * 100).toFixed(1)}%\n`;
    response += `**Confidence**: ${(result.overall_confidence * 100).toFixed(1)}%\n\n`;
    
    if (result.artifacts.length > 0) {
      response += `## Artifacts (${result.artifacts.length})\n\n`;
      for (const artifact of result.artifacts) {
        response += `### ${artifact.type}\n`;
        response += `- **Confidence**: ${(artifact.confidence * 100).toFixed(1)}%\n`;
        response += `- **Evidence Quality**: ${(artifact.evidence_quality * 100).toFixed(1)}%\n`;
        response += `\`\`\`json\n${JSON.stringify(artifact.data, null, 2)}\n\`\`\`\n\n`;
      }
    }
    
    if (result.warnings.length > 0) {
      response += `## Warnings\n`;
      for (const warning of result.warnings) {
        response += `- ⚠️ ${warning}\n`;
      }
      response += `\n`;
    }
    
    if (result.missing_capabilities.length > 0) {
      response += `## Missing Capabilities\n`;
      for (const cap of result.missing_capabilities) {
        response += `- ${cap}\n`;
      }
      response += `\n`;
    }
    
    response += `## Cost\n`;
    response += `- **Tokens In**: ${result.cost_actual.tokens_in}\n`;
    response += `- **Tokens Out**: ${result.cost_actual.tokens_out}\n`;
    response += `- **CPU Time**: ${result.cost_actual.cpu_ms}ms\n`;
    response += `- **Subrequests**: ${result.cost_actual.subrequests}\n`;
    
    return {
      content: [{ type: 'text', text: response }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

export async function handleGetCapabilityStatus(
  args: z.infer<typeof GetCapabilityStatusSchema>,
  refs?: CapabilitySystemRefs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const orch = initializeCapabilitySystem(refs);

  try {
    const status = orch.getSessionStatus(args.session_id);

    let response = `# Session Status: ${status.session_id}\n\n`;
    response += `## Overview\n`;
    response += `- **Artifacts Generated**: ${status.artifacts_count}\n`;
    response += `- **Capabilities Executed**: ${status.capabilities_executed}\n\n`;

    response += `## Resource Consumption\n`;
    response += `- **Tokens In**: ${status.total_cost.tokens_in.toLocaleString()}\n`;
    response += `- **Tokens Out**: ${status.total_cost.tokens_out.toLocaleString()}\n`;
    response += `- **CPU Time**: ${status.total_cost.cpu_ms.toLocaleString()}ms\n`;
    response += `- **Subrequests**: ${status.total_cost.subrequests}\n\n`;

    if (status.recent_executions.length > 0) {
      response += `## Recent Executions\n`;
      for (const exec of status.recent_executions) {
        const timestamp = new Date(exec.timestamp).toISOString();
        const statusIcon = exec.success ? '✅' : '❌';
        response += `- ${statusIcon} **${exec.capability_id}** at ${timestamp}\n`;
      }
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

export async function handleExportSession(
  args: z.infer<typeof ExportSessionSchema>,
  refs?: CapabilitySystemRefs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const orch = initializeCapabilitySystem(refs);

  try {
    const exported = orch.exportSession(args.session_id);
    
    return {
      content: [{
        type: 'text',
        text: `\`\`\`json\n${JSON.stringify(exported, null, 2)}\n\`\`\``
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

export async function handleListCapabilities(
  args: z.infer<typeof ListCapabilitiesSchema>,
  refs?: CapabilitySystemRefs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  initializeCapabilitySystem(refs);
  
  let capabilities = globalCapabilityGraph.getAllIds().map(id => globalCapabilityGraph.get(id)!);
  
  if (args.category) {
    capabilities = capabilities.filter(cap => cap.category === args.category);
  }
  
  if (args.tag) {
    capabilities = capabilities.filter(cap => cap.tags.includes(args.tag!));
  }
  
  let response = `# Available Capabilities (${capabilities.length})\n\n`;
  
  const byCategory = capabilities.reduce((acc, cap) => {
    if (!acc[cap.category]) acc[cap.category] = [];
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, typeof capabilities>);
  
  for (const [category, caps] of Object.entries(byCategory)) {
    response += `## ${category.toUpperCase()} (${caps.length})\n\n`;
    for (const cap of caps) {
      response += `### ${cap.name} (\`${cap.id}\`)\n`;
      response += `${cap.description}\n\n`;
      response += `- **Cost**: ${cap.cost_estimate.expected_tokens_in + cap.cost_estimate.expected_tokens_out} tokens, ${cap.cost_estimate.cpu_ms}ms\n`;
      response += `- **Precision**: ${(cap.expected_precision * 100).toFixed(0)}%\n`;
      response += `- **Tags**: ${cap.tags.join(', ')}\n\n`;
    }
  }
  
  return {
    content: [{ type: 'text', text: response }]
  };
}

