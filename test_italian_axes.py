#!/usr/bin/env python3
"""
Test the Italian diversity axes case that was failing
"""

import requests
import json
import time

BASE_URL = "https://mcp-server.vf-ghizzoni.workers.dev/proxy"
SESSION_ID = f"test_italian_{int(time.time())}"

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
print("TESTING ITALIAN DIVERSITY AXES")
print("=" * 80)
print(f"Session ID: {SESSION_ID}\n")

client = MCPClient(BASE_URL, SESSION_ID)

# Step 0: Initialize
print("Step 0: Initializing MCP server...")
client.initialize()
print("✅ MCP server initialized\n")

# Step 1: Init with long Italian axes
print("Step 1: Initializing with long Italian diversity axes...")
required_axes = [
    "Postura verso l'AGCM (accettazione vs contestazione)",
    "Ampiezza del rimedio economico ai clienti",
    "Velocità di implementazione vs robustezza del controllo",
    "Tonalità della comunicazione (penitente vs assertiva vs tecnica)",
    "Grado di apertura dei dati (trasparenza radicale vs disclosure minima)",
    "Propensione al rischio reputazionale e legale"
]

response = client.call_tool("init_parallel_reasoning", {
    "session_id": SESSION_ID,
    "task_description": "Strategia di risposta all'AGCM",
    "required_diversity_axes": required_axes,
    "min_plans": 3
})
print("✅ Session initialized\n")

# Step 2: Submit P1_consent_dei with abbreviated axes
print("Step 2: Submitting P1_consent_dei with abbreviated axes...")
p1_axes = [
    "Postura: accettazione piena",
    "Rimedio: ampio e proattivo",
    "Velocità: rapida",
    "Tonalità: penitente",
    "Apertura: trasparenza radicale",
    "Rischio: basso"
]

response_p1 = client.call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "P1_consent_dei",
        "description": "Accettazione piena con rimedio ampio",
        "diversity_axes": p1_axes,
        "capability_chain": ["step1", "step2", "step3", "step4"],
        "rationale": "Minimizza rischio reputazionale",
        "expected_outputs": ["output1"]
    }
})

if "✅ Plan Accepted" in response_p1:
    print("✅ P1_consent_dei ACCEPTED!")
else:
    print("❌ P1_consent_dei REJECTED")
    print(response_p1[:500])
print()

# Step 3: Submit P2_dual_track
print("Step 3: Submitting P2_dual_track...")
p2_axes = [
    "Postura: accettazione con riserve",
    "Rimedio: medio",
    "Velocità: bilanciata",
    "Tonalità: tecnica",
    "Apertura: disclosure selettiva",
    "Rischio: medio"
]

response_p2 = client.call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "P2_dual_track",
        "description": "Approccio bilanciato",
        "diversity_axes": p2_axes,
        "capability_chain": ["step1", "step2", "step3", "step4", "step5"],
        "rationale": "Bilanciamento rischio-beneficio",
        "expected_outputs": ["output2"]
    }
})

if "✅ Plan Accepted" in response_p2:
    print("✅ P2_dual_track ACCEPTED!")
else:
    print("❌ P2_dual_track REJECTED")
    print(response_p2[:500])
print()

# Step 4: Submit P3_contest_strategic
print("Step 4: Submitting P3_contest_strategic...")
p3_axes = [
    "Postura: contestazione strategica",
    "Rimedio: minimo",
    "Velocità: lenta e robusta",
    "Tonalità: assertiva",
    "Apertura: disclosure minima",
    "Rischio: alto"
]

response_p3 = client.call_tool("submit_reasoning_plan", {
    "session_id": SESSION_ID,
    "plan": {
        "plan_id": "P3_contest_strategic",
        "description": "Contestazione strategica",
        "diversity_axes": p3_axes,
        "capability_chain": ["step1", "step2", "step3", "step4"],
        "rationale": "Massimizza posizione negoziale",
        "expected_outputs": ["output3"]
    }
})

if "✅ Plan Accepted" in response_p3:
    print("✅ P3_contest_strategic ACCEPTED!")
else:
    print("❌ P3_contest_strategic REJECTED")
    print(response_p3[:500])
print()

print("=" * 80)
print("SUMMARY")
print("=" * 80)

all_accepted = (
    "✅ Plan Accepted" in response_p1 and
    "✅ Plan Accepted" in response_p2 and
    "✅ Plan Accepted" in response_p3
)

if all_accepted:
    print("🎉 SUCCESS! All plans accepted with abbreviated axes!")
    print()
    print("The fix works correctly:")
    print("- Long form: 'Postura verso l'AGCM (accettazione vs contestazione)'")
    print("- Short form: 'Postura: accettazione piena'")
    print("- Match: ✓ (partial key matching)")
else:
    print("❌ FAILURE: Some plans were rejected")

print("=" * 80)

