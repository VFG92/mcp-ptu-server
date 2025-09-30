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
export * from './corporate-strategy-capabilities.js';
export * from './marketing-sales-capabilities.js';
export * from './marketing-sales-capabilities-part2.js';
export * from './finance-valuation-capabilities.js';
export * from './finance-valuation-capabilities-part2.js';
export * from './operations-supply-chain-capabilities.js';
export * from './operations-supply-chain-capabilities-part2.js';
export * from './process-it-capabilities.js';
export * from './process-it-capabilities-part2.js';
export * from './legal-regulatory-capabilities.js';
export * from './people-hr-capabilities.js';
export * from './advanced-analytics-capabilities.js';

import { globalCapabilityGraph } from '../capability-graph.js';
import { registerMarketCapabilities } from './market-capabilities.js';
import { registerFinancialCapabilities } from './financial-capabilities.js';
import { registerRiskCapabilities } from './risk-capabilities.js';
import { registerStrategicCapabilities } from './strategic-capabilities.js';
import { registerCorporateStrategyCapabilities } from './corporate-strategy-capabilities.js';
import { registerMarketingSalesCapabilities } from './marketing-sales-capabilities.js';
import { registerMarketingSalesPart2Capabilities } from './marketing-sales-capabilities-part2.js';
import { registerFinanceValuationCapabilities } from './finance-valuation-capabilities.js';
import { registerFinanceValuationPart2Capabilities } from './finance-valuation-capabilities-part2.js';
import { registerOperationsSupplyChainCapabilities } from './operations-supply-chain-capabilities.js';
import { registerOperationsSupplyChainPart2Capabilities } from './operations-supply-chain-capabilities-part2.js';
import { registerProcessITCapabilities } from './process-it-capabilities.js';
import { registerProcessITPart2Capabilities } from './process-it-capabilities-part2.js';
import { registerLegalRegulatoryCapabilities } from './legal-regulatory-capabilities.js';
import { registerPeopleHRCapabilities } from './people-hr-capabilities.js';
import { registerAdvancedAnalyticsCapabilities } from './advanced-analytics-capabilities.js';

/**
 * Register all capabilities with the global graph
 */
export function registerAllCapabilities(): void {
  registerMarketCapabilities(globalCapabilityGraph);
  registerFinancialCapabilities(globalCapabilityGraph);
  registerRiskCapabilities(globalCapabilityGraph);
  registerStrategicCapabilities(globalCapabilityGraph);
  registerCorporateStrategyCapabilities(globalCapabilityGraph);
  registerMarketingSalesCapabilities(globalCapabilityGraph);
  registerMarketingSalesPart2Capabilities(globalCapabilityGraph);
  registerFinanceValuationCapabilities(globalCapabilityGraph);
  registerFinanceValuationPart2Capabilities(globalCapabilityGraph);
  registerOperationsSupplyChainCapabilities(globalCapabilityGraph);
  registerOperationsSupplyChainPart2Capabilities(globalCapabilityGraph);
  registerProcessITCapabilities(globalCapabilityGraph);
  registerProcessITPart2Capabilities(globalCapabilityGraph);
  registerLegalRegulatoryCapabilities(globalCapabilityGraph);
  registerPeopleHRCapabilities(globalCapabilityGraph);
  registerAdvancedAnalyticsCapabilities(globalCapabilityGraph);
}

