import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import type { StructuredContent } from './types';
import './styles.css';

/**
 * Entry point for MCP Workflow UI
 * Exposes global API for ChatGPT Apps SDK integration
 */

// Declare global interface for window.openai
declare global {
  interface Window {
    openai?: {
      toolOutput?: StructuredContent;
      widgetState?: any;
      callTool?: (toolName: string, args: any) => Promise<any>;
      setWidgetState?: (state: any) => void;
    };
    MCPWorkflowUI?: {
      render: (containerId: string, structuredContent: StructuredContent) => void;
      version: string;
    };
  }
}

/**
 * Render the WorkflowVisualizer component
 */
function render(containerId: string, structuredContent: StructuredContent) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <WorkflowVisualizer structuredContent={structuredContent} />
    </React.StrictMode>
  );
}

/**
 * Auto-render if window.openai.toolOutput is available
 */
function autoRender() {
  if (window.openai?.toolOutput) {
    const container = document.getElementById('mcp-workflow-root');
    if (container) {
      render('mcp-workflow-root', window.openai.toolOutput as StructuredContent);
    }
  }
}

// Expose global API
window.MCPWorkflowUI = {
  render,
  version: '1.0.0'
};

// Auto-render on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoRender);
} else {
  autoRender();
}

export { WorkflowVisualizer };
export type { StructuredContent };

