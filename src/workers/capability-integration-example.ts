/**
 * Capability System Integration Example
 * 
 * Demonstrates how to use the new capability-driven architecture
 * for business analysis tasks.
 */

import { globalCapabilityGraph } from './capability-graph.js';
import { globalEvidenceLedger } from './evidence-ledger.js';
import { globalWhiteboard } from './whiteboard-memory.js';
import { CapabilityOrchestrator, createDefaultBudget, createDefaultPolicy } from './capability-orchestrator.js';
import { registerAllCapabilities } from './capabilities/index.js';
import { getAdapter } from './capability-adapters.js';

/**
 * Initialize the capability system
 */
export function initializeCapabilitySystem(): CapabilityOrchestrator {
  // Register all capabilities
  registerAllCapabilities();
  
  console.log(`Registered ${globalCapabilityGraph.size()} capabilities`);
  
  // Create orchestrator
  const orchestrator = new CapabilityOrchestrator(
    globalCapabilityGraph,
    globalEvidenceLedger,
    globalWhiteboard
  );
  
  return orchestrator;
}

/**
 * Example 1: Market Entry Analysis
 */
export async function exampleMarketEntry() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Market Entry Analysis ===\n');
  
  const result = await orchestrator.execute({
    session_id: 'market_entry_001',
    task: 'Analyze market entry opportunity for B2B SaaS in European fintech market. Need market sizing, competitive landscape, and risk assessment.',
    budget: {
      max_tokens_in: 15000,
      max_tokens_out: 30000,
      max_cpu_ms: 45000,
      max_subrequests: 30
    },
    policy: createDefaultPolicy(),
    adapter_id: 'strategy',
    required_artifacts: ['market_map', 'tam_sam_som', 'risk_register'],
    tournament_mode: false
  });
  
  console.log(`✓ Success: ${result.success}`);
  console.log(`✓ Coverage: ${(result.coverage * 100).toFixed(1)}%`);
  console.log(`✓ Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);
  console.log(`✓ Artifacts: ${result.artifacts.length}`);
  console.log(`✓ Cost: ${result.cost_actual.tokens_in + result.cost_actual.tokens_out} tokens`);
  
  if (result.quality_flags.length > 0) {
    console.log(`⚠ Quality Flags: ${result.quality_flags.join(', ')}`);
  }
  
  // Display artifacts
  for (const artifact of result.artifacts) {
    console.log(`\n📊 ${artifact.id}:`);
    console.log(`   Type: ${artifact.type}`);
    console.log(`   Confidence: ${(artifact.confidence * 100).toFixed(1)}%`);
    console.log(`   Evidence Quality: ${(artifact.evidence_quality * 100).toFixed(1)}%`);
    
    if (artifact.validation_errors) {
      console.log(`   ❌ Validation Errors: ${artifact.validation_errors.length}`);
    }
  }
  
  return result;
}

/**
 * Example 2: Financial Modeling
 */
export async function exampleFinancialModeling() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Financial Modeling ===\n');
  
  const result = await orchestrator.execute({
    session_id: 'financial_001',
    task: 'Build comprehensive unit economics model with LTV/CAC analysis and pricing sensitivity. Include channel economics breakdown.',
    budget: createDefaultBudget(),
    policy: createDefaultPolicy(),
    adapter_id: 'finance',
    required_artifacts: ['unit_economics', 'pricing_analysis', 'channel_economics'],
    tournament_mode: false
  });
  
  console.log(`✓ Success: ${result.success}`);
  console.log(`✓ Partial: ${result.partial}`);
  
  // Find unit economics artifact
  const unitEcon = result.artifacts.find(a => a.id === 'unit_economics_model');
  if (unitEcon) {
    console.log('\n💰 Unit Economics:');
    console.log(`   LTV: $${unitEcon.data.ltv.value.toFixed(0)}`);
    console.log(`   CAC: $${unitEcon.data.cac.value.toFixed(0)}`);
    console.log(`   LTV/CAC: ${unitEcon.data.ltv_cac_ratio.value.toFixed(1)}x`);
    console.log(`   Assessment: ${unitEcon.data.ltv_cac_ratio.assessment}`);
    console.log(`   Payback: ${unitEcon.data.payback_period_months.value.toFixed(1)} months`);
  }
  
  return result;
}

/**
 * Example 3: Risk Assessment
 */
export async function exampleRiskAssessment() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Risk Assessment ===\n');
  
  const result = await orchestrator.execute({
    session_id: 'risk_001',
    task: 'Comprehensive risk assessment for new product launch including regulatory compliance scan and stakeholder analysis.',
    budget: createDefaultBudget(),
    policy: createDefaultPolicy(),
    adapter_id: 'risk',
    required_artifacts: ['risk_register', 'regulatory_scan', 'stakeholder_map'],
    tournament_mode: false
  });
  
  console.log(`✓ Success: ${result.success}`);
  
  // Find risk register
  const riskReg = result.artifacts.find(a => a.id === 'risk_register_build');
  if (riskReg) {
    console.log('\n⚠️  Risk Summary:');
    console.log(`   Total Risks: ${riskReg.data.risk_summary.total_risks}`);
    console.log(`   Critical: ${riskReg.data.risk_summary.critical_risks}`);
    console.log(`   High: ${riskReg.data.risk_summary.high_risks}`);
    console.log(`   Overall Level: ${riskReg.data.risk_summary.overall_risk_level}`);
    
    console.log('\n   Top 3 Risks:');
    riskReg.data.risk_summary.top_3_risks.forEach((risk: string, i: number) => {
      console.log(`   ${i + 1}. ${risk}`);
    });
  }
  
  return result;
}

/**
 * Example 4: Tournament Mode Comparison
 */
export async function exampleTournamentMode() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Tournament Mode ===\n');
  
  const result = await orchestrator.execute({
    session_id: 'tournament_001',
    task: 'Market sizing analysis - compare multiple approaches',
    budget: {
      max_tokens_in: 20000,
      max_tokens_out: 40000,
      max_cpu_ms: 60000,
      max_subrequests: 40
    },
    policy: createDefaultPolicy(),
    adapter_id: 'comprehensive',
    tournament_mode: true
  });
  
  console.log(`✓ Tournament Complete`);
  console.log(`✓ Winner Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);
  console.log(`✓ Approaches Tested: ${result.capabilities_executed.length}`);
  
  return result;
}

/**
 * Example 5: Partial Success Handling
 */
export async function examplePartialSuccess() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Partial Success Handling ===\n');
  
  // Use very tight budget to force partial execution
  const result = await orchestrator.execute({
    session_id: 'partial_001',
    task: 'Full business analysis with market, financial, and risk components',
    budget: {
      max_tokens_in: 3000,  // Very limited
      max_tokens_out: 5000,
      max_cpu_ms: 10000,
      max_subrequests: 5
    },
    policy: createDefaultPolicy(),
    adapter_id: 'comprehensive'
  });
  
  console.log(`✓ Success: ${result.success}`);
  console.log(`✓ Partial: ${result.partial}`);
  console.log(`✓ Coverage: ${(result.coverage * 100).toFixed(1)}%`);
  console.log(`✓ Completed: ${result.capabilities_executed.length} capabilities`);
  console.log(`✓ Failed: ${result.capabilities_failed.length} capabilities`);
  
  if (result.missing_capabilities.length > 0) {
    console.log(`\n⚠️  Missing Capabilities:`);
    result.missing_capabilities.forEach(cap => {
      console.log(`   - ${cap}`);
    });
  }
  
  if (result.blocking_artifacts.length > 0) {
    console.log(`\n❌ Blocking Artifacts (couldn't be produced):`);
    result.blocking_artifacts.forEach(art => {
      console.log(`   - ${art}`);
    });
  }
  
  return result;
}

/**
 * Example 6: Adapter Comparison
 */
export async function exampleAdapterComparison() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Adapter Comparison ===\n');
  
  const task = 'Analyze pricing strategy for new product';
  const adapters = ['strategy', 'finance', 'commercial'];
  
  for (const adapterId of adapters) {
    const adapter = getAdapter(adapterId);
    console.log(`\n📋 ${adapter?.name}:`);
    
    const result = await orchestrator.execute({
      session_id: `adapter_${adapterId}`,
      task,
      budget: createDefaultBudget(),
      policy: createDefaultPolicy(),
      adapter_id: adapterId
    });
    
    console.log(`   Capabilities: ${result.capabilities_executed.join(', ')}`);
    console.log(`   Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);
    console.log(`   Cost: ${result.cost_actual.tokens_in + result.cost_actual.tokens_out} tokens`);
  }
}

/**
 * Example 7: Session Export for Audit
 */
export async function exampleSessionExport() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Session Export ===\n');
  
  // Run analysis
  await orchestrator.execute({
    session_id: 'export_001',
    task: 'Market analysis for audit trail demo',
    budget: createDefaultBudget(),
    policy: createDefaultPolicy(),
    adapter_id: 'strategy'
  });
  
  // Export session
  const exported = orchestrator.exportSession('export_001');
  
  console.log(`✓ Exported Session: ${exported.session_id}`);
  console.log(`✓ Artifacts: ${exported.artifacts.length}`);
  console.log(`✓ Evidence Entries: ${exported.evidence.length}`);
  console.log(`✓ Timestamp: ${new Date(exported.exported_at).toISOString()}`);
  
  // Show evidence summary
  for (const evidence of exported.evidence) {
    console.log(`\n📝 Evidence for ${evidence.artifact_id}:`);
    console.log(`   Total Claims: ${evidence.summary.total_claims}`);
    console.log(`   Verified: ${evidence.summary.verified}`);
    console.log(`   Quality Score: ${(evidence.quality_score * 100).toFixed(1)}%`);
    console.log(`   Evidence Types:`, evidence.summary.evidence_types);
  }
  
  return exported;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Capability-Driven Architecture - Examples            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    await exampleMarketEntry();
    await exampleFinancialModeling();
    await exampleRiskAssessment();
    await exampleTournamentMode();
    await examplePartialSuccess();
    await exampleAdapterComparison();
    await exampleSessionExport();
    
    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Note: initializeCapabilitySystem is already exported above
// Re-exporting createDefaultBudget and createDefaultPolicy from orchestrator
export { createDefaultBudget, createDefaultPolicy } from './capability-orchestrator.js';

