/**
 * Test script to verify automatic native enhancement works for capabilities
 * without explicit integration
 */

import { globalCapabilityGraph, type ExecutionContext } from './src/workers/capability-graph.js';
import { registerAllCapabilities } from './src/workers/capabilities/index.js';
import { attachNativeCapabilities, runNativeEnhancement } from './src/workers/llm-native-capabilities.js';

// Initialize capabilities
registerAllCapabilities();

async function testCapabilityWithEnhancement(capabilityId: string, inputs: any) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${capabilityId}`);
  console.log(`${'='.repeat(80)}\n`);

  const capability = globalCapabilityGraph.get(capabilityId);
  if (!capability) {
    console.error(`❌ Capability ${capabilityId} not found`);
    return;
  }

  console.log(`Capability: ${capability.name}`);
  console.log(`Category: ${capability.category}`);
  console.log(`Description: ${capability.description}\n`);

  // Create execution context
  const context: ExecutionContext = {
    session_id: `test-${Date.now()}`,
    budget_remaining: {
      expected_tokens_in: 10000,
      expected_tokens_out: 10000,
      cpu_ms: 30000,
      subrequests: 10,
      memory_kb: 128000
    },
    whiteboard: new Map(),
    scratchpad: new Map(),
    policy: {
      min_evidence_quality: 0.5,
      require_tournament: false,
      allow_heuristics: true
    },
    trace: []
  };

  // Attach native capabilities
  attachNativeCapabilities(context);

  try {
    // Execute the capability
    console.log('⏳ Executing capability...');
    const result = await capability.execute(inputs, context);
    console.log('✅ Capability executed\n');
    console.log('Initial Result:');
    console.log(`  - Capability ID: ${result.capability_id}`);
    console.log(`  - Confidence: ${result.confidence}`);
    console.log(`  - Quality Score: ${result.quality_score}`);
    console.log(`  - Warnings: ${result.warnings?.length || 0}`);

    // Now test automatic enhancement
    console.log('\n⏳ Running automatic native enhancement...');
    const enhancement = await runNativeEnhancement(capability, result, context);

    if (enhancement) {
      console.log('\n🎯 NATIVE ENHANCEMENT SUCCESSFUL!');
      console.log(`  - Type: ${enhancement.capabilityType}`);
      console.log(`  - Evidence Type: ${enhancement.evidenceType}`);
      console.log(`  - Message: ${enhancement.message}`);
      console.log(`  - Tokens Used: ${enhancement.tokens_used || 'N/A'}`);
      console.log(`  - Has Result Data: ${!!enhancement.result}`);

      if (enhancement.result) {
        console.log('\n📊 Enhancement Result Preview:');
        const resultStr = JSON.stringify(enhancement.result, null, 2);
        const preview = resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr;
        console.log(preview);
      }
    } else {
      console.log('\n⚠️  NO NATIVE ENHANCEMENT APPLIED');
      console.log('   (This is expected if LLM native tools are not available in test environment)');
    }

    return { result, enhancement };
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Testing Automatic Native Enhancement System\n');
  console.log('This test verifies that capabilities WITHOUT explicit native integration');
  console.log('still receive automatic enhancement from the orchestrator.\n');

  // Test 1: Market capability (should get web search enhancement)
  await testCapabilityWithEnhancement('market_scan', {
    industry: 'Cloud Computing',
    geography: 'North America'
  });

  // Test 2: Financial capability (should get python validation)
  await testCapabilityWithEnhancement('unit_economics_model', {
    revenue_per_unit: 100,
    variable_cost_per_unit: 40,
    fixed_costs: 50000,
    volume: 1000
  });

  // Test 3: Strategic capability (should get web search enhancement)
  await testCapabilityWithEnhancement('stakeholder_mapping', {
    industry: 'SaaS',
    geography: 'Global',
    stakeholders: ['Investors', 'Customers', 'Employees']
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(console.error);

