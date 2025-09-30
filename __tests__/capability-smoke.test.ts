import { describe, it, expect } from '@jest/globals';

import { registerAllCapabilities } from '../src/workers/capabilities/index.js';
import { globalCapabilityGraph, type CapabilityNode, type ExecutionContext } from '../src/workers/capability-graph.js';
import { attachNativeCapabilities, runNativeEnhancement, isNativeRequestForwardingEnabled } from '../src/workers/llm-native-capabilities.js';
import { getIndustryContext } from '../src/workers/industry-context.js';
import { createDefaultPolicy } from '../src/workers/capability-orchestrator.js';

registerAllCapabilities();

const capabilityIds = Array.from(globalCapabilityGraph.getAllIds());

const BUDGET = {
  expected_tokens_in: 20000,
  expected_tokens_out: 20000,
  cpu_ms: 20000,
  subrequests: 200,
  memory_kb: 0
};

function buildInputs(capability: CapabilityNode): Record<string, any> {
  const inputs: Record<string, any> = {};
  for (const key of capability.preconditions?.required_inputs ?? []) {
    inputs[key] = createDummyValue(key);
  }
  return inputs;
}

function createDummyValue(key: string): any {
  const lower = key.toLowerCase();
  if (lower.includes('list') || lower.includes('array') || lower.includes('segments')) {
    return ['placeholder'];
  }
  if (lower.includes('count') || lower.includes('number') || lower.includes('size') || lower.includes('volume')) {
    return 42;
  }
  if (lower.includes('rate') || lower.includes('ratio') || lower.includes('growth') || lower.includes('margin')) {
    return 0.1;
  }
  if (lower.includes('price') || lower.includes('value') || lower.includes('budget') || lower.includes('revenue')) {
    return 1000;
  }
  if (lower.includes('year')) {
    return 2024;
  }
  if (lower.includes('data') || lower.includes('model') || lower.includes('parameters')) {
    return { sample: true };
  }
  return 'placeholder';
}

function prepareContext(capability: CapabilityNode): ExecutionContext {
  const context: ExecutionContext = {
    session_id: `smoke_${capability.id}`,
    budget_remaining: { ...BUDGET },
    whiteboard: new Map(),
    scratchpad: new Map(),
    policy: createDefaultPolicy(),
    trace: []
  };

  attachNativeCapabilities(context);
  context.whiteboard.set('__industry_context__', getIndustryContext('generic', 'global'));
  context.whiteboard.set('__entity_names__', {});

  for (const artifactId of capability.preconditions?.required_artifacts ?? []) {
    if (!context.whiteboard.has(artifactId)) {
      context.whiteboard.set(artifactId, { placeholder: true });
    }
  }

  return context;
}

describe('Capability smoke validation', () => {
  for (const capabilityId of capabilityIds) {
    it(`executes ${capabilityId} and triggers native enhancement`, async () => {
      const capability = globalCapabilityGraph.get(capabilityId);
      expect(capability).toBeDefined();
      if (!capability) {
        return;
      }

      const context = prepareContext(capability);
      const inputs = buildInputs(capability);

      const result = await capability.execute(inputs, context);
      expect(result).toBeDefined();

      const validation = capability.output_contract.schema.safeParse(result.output);
      expect(validation.success).toBe(true);

      const enhancement = await runNativeEnhancement(capability, result, context);
      expect(enhancement.attempts.length).toBeGreaterThan(0);

      if (!isNativeRequestForwardingEnabled()) {
        expect(enhancement.outcome).not.toBeNull();
      }
    }, 20000);
  }
});
