#!/usr/bin/env python3
"""
Simple test to verify Readiness Preview feature
"""

import requests
import json

BASE_URL = "https://mcp-server.vf-ghizzoni.workers.dev/proxy"
SESSION_ID = f"test_readiness_{int(__import__('time').time())}"

def call_mcp(method, params):
    """Call MCP method"""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }

    response = requests.post(BASE_URL, headers=headers, json=payload, stream=True)

    # Parse SSE response
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                try:
                    data = json.loads(line_str[6:])
                    if 'result' in data:
                        # For tools/call, extract text content
                        if method == "tools/call" and 'content' in data['result']:
                            return data['result']['content'][0]['text']
                        # For initialize, return full result
                        return data['result']
                    elif 'error' in data:
                        return f"ERROR: {data['error']}"
                except json.JSONDecodeError:
                    continue

    return "No response"

def call_tool(name, arguments):
    """Call MCP tool"""
    return call_mcp("tools/call", {"name": name, "arguments": arguments})

print("=" * 80)
print("TESTING READINESS PREVIEW FEATURE")
print("=" * 80)
print(f"Session ID: {SESSION_ID}\n")

# Step 0: Initialize MCP server
print("Step 0: Initializing MCP server...")
init_response = call_mcp("initialize", {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
        "name": "python-test-client",
        "version": "1.0.0"
    }
})
print("✅ MCP server initialized\n")

# Step 1: Init
print("Step 1: Initializing session...")
response = call_tool("init_parallel_reasoning", {
    "session_id": SESSION_ID,
    "task_description": "Test readiness preview",
    "required_diversity_axes": ["data_sources", "analytical_models"],
    "min_plans": 3
})
print(response[:500])
print()

# Check for new guidance
if "Optimal capability chain length" in response or "3-5 steps" in response:
    print("✅ Found new guidance on optimal capability chain length")
else:
    print("❌ Missing new guidance on optimal capability chain length")
print()

# Step 2: Submit Plan A (4 steps)
print("Step 2: Submitting Plan A (4 steps)...")
response_a = call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "plan_A",
        "description": "Data-driven analysis",
        "diversity_axes": ["data_sources: market reports", "analytical_models: quantitative"],
        "capability_chain": ["step1", "step2", "step3", "step4"],
        "rationale": "Test plan A",
        "expected_outputs": ["output1"]
    }
})
print(response_a[:300])
print()

# Step 3: Submit Plan B (5 steps)
print("Step 3: Submitting Plan B (5 steps)...")
response_b = call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "plan_B",
        "description": "Expert validation",
        "diversity_axes": ["data_sources: expert interviews", "analytical_models: qualitative"],
        "capability_chain": ["step1", "step2", "step3", "step4", "step5"],
        "rationale": "Test plan B",
        "expected_outputs": ["output2"]
    }
})
print(response_b[:300])
print()

# Step 4: Submit Plan C (4 steps) - SHOULD TRIGGER READINESS PREVIEW
print("Step 4: Submitting Plan C (4 steps) - SHOULD TRIGGER READINESS PREVIEW...")
response_c = call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "plan_C",
        "description": "Financial modeling",
        "diversity_axes": ["data_sources: financial data", "analytical_models: financial"],
        "capability_chain": ["step1", "step2", "step3", "step4"],
        "rationale": "Test plan C",
        "expected_outputs": ["output3"]
    }
})

print("=" * 80)
print("PLAN C RESPONSE (should contain Readiness Preview):")
print("=" * 80)
print(response_c)
print()

# Check for Readiness Preview
print("=" * 80)
print("VERIFICATION:")
print("=" * 80)

checks = [
    ("🎯 Readiness Preview", "Readiness Preview section"),
    ("Total declared steps", "Total declared steps calculation"),
    ("Coverage ≥ 95%", "Coverage metric"),
    ("Confidence ≥ 85%", "Confidence metric"),
    ("Consensus ≥ 80%", "Consensus metric"),
    ("13", "Correct total steps (4+5+4=13)")
]

for check_str, description in checks:
    if check_str in response_c:
        print(f"✅ Found: {description}")
    else:
        print(f"❌ Missing: {description}")

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)

