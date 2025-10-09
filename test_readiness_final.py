#!/usr/bin/env python3
"""
Test Readiness Preview feature using working MCP client code
"""

import requests
import json
import time

BASE_URL = "https://mcp-server.vf-ghizzoni.workers.dev/proxy"
SESSION_ID = f"test_readiness_{int(time.time())}"

class MCPClient:
    def __init__(self, base_url, session_id):
        self.base_url = base_url
        self.session_id = session_id
        self.request_id = 0
        self.durable_object_session_id = None
        
    def _make_request(self, method, params):
        """Make MCP request and parse SSE response"""
        self.request_id += 1

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }

        if self.durable_object_session_id:
            headers["mcp-session-id"] = self.durable_object_session_id
        else:
            headers["mcp-session-id"] = self.session_id
        
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params
        }
        
        response = requests.post(self.base_url, headers=headers, json=payload, stream=True)

        if 'mcp-session-id' in response.headers:
            server_session_id = response.headers['mcp-session-id']
            if not self.durable_object_session_id:
                self.durable_object_session_id = server_session_id
                print(f"   [Captured DO session ID: {server_session_id[:16]}...]")

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    try:
                        data = json.loads(line_str[6:])
                        if 'result' in data or 'error' in data:
                            return data
                    except json.JSONDecodeError:
                        continue

        raise Exception("No data received from server")
    
    def initialize(self):
        """Initialize MCP server"""
        result = self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "python-test-client",
                "version": "1.0.0"
            }
        })
        return result
    
    def call_tool(self, tool_name, arguments):
        """Call MCP tool"""
        result = self._make_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
        
        if 'result' in result and 'content' in result['result']:
            content = result['result']['content']
            if content and len(content) > 0:
                return content[0].get('text', '')
        
        return result

print("=" * 80)
print("TESTING READINESS PREVIEW FEATURE")
print("=" * 80)
print(f"Session ID: {SESSION_ID}\n")

client = MCPClient(BASE_URL, SESSION_ID)

# Step 0: Initialize
print("Step 0: Initializing MCP server...")
client.initialize()
print("✅ MCP server initialized\n")

# Step 1: Init parallel reasoning
print("Step 1: Initializing parallel reasoning session...")
response = client.call_tool("init_parallel_reasoning", {
    "session_id": SESSION_ID,
    "task_description": "Test readiness preview",
    "required_diversity_axes": ["data_sources", "analytical_models"],
    "min_plans": 3
})
print(response[:800])
print()

# Check for new guidance
if "Optimal capability chain length" in response or "3-5 steps" in response:
    print("✅ Found new guidance on optimal capability chain length")
else:
    print("❌ Missing new guidance on optimal capability chain length")
print()

# Step 2: Submit Plan A (4 steps)
print("Step 2: Submitting Plan A (4 steps)...")
response_a = client.call_tool("submit_reasoning_plan", {
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
print("✅ Plan A submitted\n")

# Step 3: Submit Plan B (5 steps)
print("Step 3: Submitting Plan B (5 steps)...")
response_b = client.call_tool("submit_reasoning_plan", {
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
print("✅ Plan B submitted\n")

# Step 4: Submit Plan C (4 steps) - SHOULD TRIGGER READINESS PREVIEW
print("Step 4: Submitting Plan C (4 steps) - SHOULD TRIGGER READINESS PREVIEW...")
response_c = client.call_tool("submit_reasoning_plan", {
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

