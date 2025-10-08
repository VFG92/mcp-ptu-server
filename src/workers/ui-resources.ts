/**
 * UI Resources for ChatGPT Apps SDK Integration
 * Provides React components and assets for workflow visualization
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * UI Resources for MCP Workflow Visualizer
 * These are served to ChatGPT for rendering interactive UI
 */
export const UI_RESOURCES: Resource[] = [
  {
    uri: 'mcp://ui/workflow-visualizer.js',
    name: 'Workflow Visualizer Component',
    description: 'React component bundle for visualizing parallel reasoning workflows',
    mimeType: 'application/javascript',
    text: '' // Will be loaded from dist/workflow-visualizer.js
  },
  {
    uri: 'mcp://ui/workflow-visualizer.css',
    name: 'Workflow Visualizer Styles',
    description: 'CSS styles for workflow visualization components',
    mimeType: 'text/css',
    text: '' // Will be loaded from dist/workflow-visualizer.css
  },
  {
    uri: 'mcp://ui/manifest.json',
    name: 'UI Manifest',
    description: 'Manifest for ChatGPT Apps SDK integration',
    mimeType: 'application/json',
    text: JSON.stringify({
      name: 'MCP PTU Server Workflow Visualizer',
      version: '1.0.0',
      description: 'Interactive visualization for parallel reasoning workflows',
      components: [
        {
          id: 'workflow-visualizer',
          name: 'Workflow Visualizer',
          description: 'Main visualization component',
          entry: 'mcp://ui/workflow-visualizer.js',
          styles: 'mcp://ui/workflow-visualizer.css',
          modes: ['inline', 'pip', 'fullscreen']
        }
      ],
      csp: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"]
      }
    }, null, 2)
  }
];

/**
 * Load UI assets from filesystem (for local development)
 * In production, these would be loaded from Workers KV
 */
export function loadUIAssets(): void {
  try {
    // Try to load compiled assets
    const jsPath = join(process.cwd(), 'src/ui/dist/workflow-visualizer.js');
    const cssPath = join(process.cwd(), 'src/ui/dist/workflow-visualizer.css');
    
    const jsContent = readFileSync(jsPath, 'utf-8');
    const cssContent = readFileSync(cssPath, 'utf-8');
    
    UI_RESOURCES[0].text = jsContent;
    UI_RESOURCES[1].text = cssContent;
    
    console.log('[UI Resources] Loaded UI assets from filesystem');
  } catch (error) {
    console.warn('[UI Resources] Could not load UI assets:', error);
    console.warn('[UI Resources] UI components will not be available');
  }
}

/**
 * Get UI resource by URI
 */
export function getUIResource(uri: string): Resource | undefined {
  return UI_RESOURCES.find(r => r.uri === uri);
}

/**
 * Check if URI is a UI resource
 */
export function isUIResource(uri: string): boolean {
  return uri.startsWith('mcp://ui/');
}

