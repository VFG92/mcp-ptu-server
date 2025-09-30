/**
 * Capability Library
 * 
 * Atomic, composable business analysis capabilities.
 * Each capability has contracts, costs, and evidence requirements.
 */

export * from './market-capabilities.js';
export * from './financial-capabilities.js';
export * from './risk-capabilities.js';
export * from './strategic-capabilities.js';

import { globalCapabilityGraph } from '../capability-graph.js';
import { registerMarketCapabilities } from './market-capabilities.js';
import { registerFinancialCapabilities } from './financial-capabilities.js';
import { registerRiskCapabilities } from './risk-capabilities.js';
import { registerStrategicCapabilities } from './strategic-capabilities.js';

/**
 * Register all capabilities with the global graph
 */
export function registerAllCapabilities(): void {
  registerMarketCapabilities(globalCapabilityGraph);
  registerFinancialCapabilities(globalCapabilityGraph);
  registerRiskCapabilities(globalCapabilityGraph);
  registerStrategicCapabilities(globalCapabilityGraph);
}

