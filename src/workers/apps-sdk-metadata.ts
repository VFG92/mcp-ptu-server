/**
 * OpenAI Apps SDK Metadata Helper
 * 
 * Converts structured content to OpenAI Apps SDK format for widget rendering.
 * 
 * APPS SDK FORMAT:
 * Tools must return responses with `_meta.openai/outputTemplate` metadata
 * that specifies the widget type and props for UI rendering in ChatGPT.
 * 
 * Reference: https://github.com/openai/openai-apps-sdk-examples
 */

import type { StructuredContent } from './ui-structured-content.js';

/**
 * OpenAI Apps SDK metadata format
 * This is the standard format expected by ChatGPT for rendering widgets
 */
export interface AppsSDKMetadata {
  "openai/outputTemplate": {
    type: string;
    props: Record<string, unknown>;
  };
}

/**
 * Widget component types for parallel reasoning workflows
 * Each type corresponds to a specific UI component in the Apps SDK
 */
export const WidgetTypes = {
  /** Main workflow visualization showing all plans and their status */
  WORKFLOW_VISUALIZER: 'workflow_visualizer',
  
  /** Timeline view of plan execution steps */
  PLAN_TIMELINE: 'plan_timeline',
  
  /** Matrix showing diversity axes across plans */
  DIVERSITY_MATRIX: 'diversity_matrix',
  
  /** Dashboard with quality metrics (confidence, coverage, consensus) */
  METRICS_DASHBOARD: 'metrics_dashboard'
} as const;

export type WidgetType = typeof WidgetTypes[keyof typeof WidgetTypes];

/**
 * Convert structured content to OpenAI Apps SDK metadata format
 * 
 * @param componentType - Widget type to render (from WidgetTypes)
 * @param structuredContent - Structured data to pass as props to the widget
 * @returns Apps SDK compatible metadata object
 * 
 * @example
 * ```typescript
 * const metadata = createAppsSDKMetadata(
 *   WidgetTypes.WORKFLOW_VISUALIZER,
 *   {
 *     type: 'workflow_initialized',
 *     session_id: 'session-123',
 *     timestamp: Date.now(),
 *     task_description: 'Analyze market trends',
 *     required_diversity_axes: [...],
 *     min_plans: 3
 *   }
 * );
 * 
 * // Returns:
 * // {
 * //   "openai/outputTemplate": {
 * //     type: "workflow_visualizer",
 * //     props: { ... }
 * //   }
 * // }
 * ```
 */
export function createAppsSDKMetadata(
  componentType: WidgetType,
  structuredContent: StructuredContent
): AppsSDKMetadata {
  return {
    "openai/outputTemplate": {
      type: componentType,
      props: structuredContent as unknown as Record<string, unknown>
    }
  };
}

/**
 * Tool response format compatible with OpenAI Apps SDK
 * All MCP tools should return this format
 */
export interface AppsSDKToolResponse {
  /** Text content for conversation (always required) */
  content: Array<{ type: string; text: string }>;

  /** Optional metadata for widget rendering (Apps SDK format) */
  _meta?: AppsSDKMetadata;

  /**
   * Legacy structured content for backward compatibility
   * @deprecated Use _meta instead for Apps SDK compatibility
   */
  structuredContent?: StructuredContent;
}

/**
 * Helper to create a complete tool response with both text and widget metadata
 * 
 * @param textContent - Text response for the conversation
 * @param widgetType - Widget type to render (optional)
 * @param structuredContent - Structured data for the widget (optional)
 * @returns Complete tool response with content and metadata
 * 
 * @example
 * ```typescript
 * return createToolResponse(
 *   "Session initialized successfully",
 *   WidgetTypes.WORKFLOW_VISUALIZER,
 *   structuredContent
 * );
 * ```
 */
export function createToolResponse(
  textContent: string,
  widgetType?: WidgetType,
  structuredContent?: StructuredContent
): AppsSDKToolResponse {
  const response: AppsSDKToolResponse = {
    content: [{ type: "text", text: textContent }]
  };

  if (widgetType && structuredContent) {
    // Apps SDK format (new)
    response._meta = createAppsSDKMetadata(widgetType, structuredContent);
    // Legacy format (for backward compatibility)
    response.structuredContent = structuredContent;
  }

  return response;
}

/**
 * Convert a legacy tool response to Apps SDK format
 * Use this to migrate existing handlers without rewriting them
 *
 * @param legacyResponse - Response with structuredContent
 * @param toolName - Name of the tool (to determine widget type)
 * @returns Apps SDK compatible response with _meta
 */
export function convertToAppsSDKResponse(
  legacyResponse: { content: Array<{ type: string; text: string }>; structuredContent?: StructuredContent },
  toolName: keyof typeof TOOL_WIDGET_MAPPING
): AppsSDKToolResponse {
  const response: AppsSDKToolResponse = {
    content: legacyResponse.content
  };

  if (legacyResponse.structuredContent) {
    const widgetType = TOOL_WIDGET_MAPPING[toolName];
    response._meta = createAppsSDKMetadata(widgetType, legacyResponse.structuredContent);
    // Keep legacy format for backward compatibility
    response.structuredContent = legacyResponse.structuredContent;
  }

  return response;
}

/**
 * Widget type mapping for each parallel reasoning tool
 * This defines which widget should be rendered for each tool's response
 */
export const TOOL_WIDGET_MAPPING = {
  // Core workflow tools
  init_parallel_reasoning: WidgetTypes.WORKFLOW_VISUALIZER,
  submit_reasoning_plan: WidgetTypes.PLAN_TIMELINE,

  // Manifest-based execution tools
  execute_reasoning_manifest: WidgetTypes.PLAN_TIMELINE,
  register_execution_results: WidgetTypes.METRICS_DASHBOARD,
  regenerate_execution_token: WidgetTypes.WORKFLOW_VISUALIZER,

  // Peer review and mediation
  submit_peer_critique: WidgetTypes.WORKFLOW_VISUALIZER,
  submit_mediation_decision: WidgetTypes.WORKFLOW_VISUALIZER,

  // Status and finalization
  list_plan_status: WidgetTypes.DIVERSITY_MATRIX,
  check_session_readiness: WidgetTypes.METRICS_DASHBOARD,
  generate_meta_reflection: WidgetTypes.METRICS_DASHBOARD,
  finalize_parallel_reasoning: WidgetTypes.METRICS_DASHBOARD,

  // Legacy tools (deprecated but kept for compatibility)
  execute_plan_step: WidgetTypes.PLAN_TIMELINE,
  submit_cross_plan_note: WidgetTypes.WORKFLOW_VISUALIZER
} as const;

/**
 * Get the appropriate widget type for a tool
 * 
 * @param toolName - Name of the MCP tool
 * @returns Widget type to use for this tool's response
 */
export function getWidgetTypeForTool(
  toolName: keyof typeof TOOL_WIDGET_MAPPING
): WidgetType {
  return TOOL_WIDGET_MAPPING[toolName];
}

