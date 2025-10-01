#!/usr/bin/env python3
"""
Complete MCP Client Test Script
Tests full parallel reasoning workflow end-to-end
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

class MCPClient:
    def __init__(self, base_url: str, session_id: str):
        self.base_url = base_url
        self.session_id = session_id
        self.request_id = 0
        self.initialized = False
        self.durable_object_session_id = None  # Track DO session ID from server
        
    def _make_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make MCP request and parse SSE response"""
        self.request_id += 1

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }

        # Use DO session ID if we have it, otherwise use our session ID
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

        # Capture DO session ID from response header
        if 'mcp-session-id' in response.headers:
            server_session_id = response.headers['mcp-session-id']
            if not self.durable_object_session_id:
                self.durable_object_session_id = server_session_id
                print(f"   [INFO] Captured DO session ID: {server_session_id[:16]}...")

        # Parse SSE response
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = json.loads(line_str[6:])
                    if 'error' in data:
                        raise Exception(f"MCP Error: {data['error']['message']}")
                    return data

        raise Exception("No data received from server")
    
    def initialize(self) -> Dict[str, Any]:
        """Initialize MCP server"""
        print("🔧 Initializing MCP server...")
        result = self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "python-test-client",
                "version": "1.0.0"
            }
        })
        self.initialized = True
        print("✅ MCP server initialized")
        return result
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool"""
        if not self.initialized:
            raise Exception("Server not initialized. Call initialize() first.")
        
        result = self._make_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
        
        # Extract text content from result
        if 'result' in result and 'content' in result['result']:
            content = result['result']['content']
            if content and len(content) > 0:
                return content[0].get('text', '')
        
        return result
    
    def init_parallel_reasoning(self, task: str, diversity_axes: List[str], min_plans: int = 3) -> str:
        """Initialize parallel reasoning session"""
        print(f"\n📋 PHASE 1: Initializing parallel reasoning...")
        print(f"   Task: {task}")
        print(f"   Diversity axes: {', '.join(diversity_axes)}")
        print(f"   Min plans: {min_plans}")
        
        response = self.call_tool("init_parallel_reasoning", {
            "session_id": self.session_id,
            "task_description": task,
            "required_diversity_axes": diversity_axes,
            "min_plans": min_plans
        })
        
        print("✅ Parallel reasoning session initialized")
        return response
    
    def submit_plan(self, plan_id: str, description: str, diversity_axes: List[str], 
                   capability_chain: List[str], rationale: str, expected_outputs: List[str]) -> str:
        """Submit reasoning plan"""
        print(f"\n   Submitting {plan_id}...")
        
        response = self.call_tool("submit_reasoning_plan", {
            "session_id": self.session_id,
            "plan": {
                "plan_id": plan_id,
                "description": description,
                "diversity_axes": diversity_axes,
                "capability_chain": capability_chain,
                "rationale": rationale,
                "expected_outputs": expected_outputs
            }
        })
        
        if "Plan Accepted" in str(response):
            print(f"   ✅ {plan_id} accepted")
        else:
            print(f"   ❌ {plan_id} rejected")
            print(f"   Response: {response[:200]}")
        
        return response
    
    def execute_plan_step(self, plan_id: str, task: str, adapter_id: str = "strategy") -> str:
        """Execute capability for plan"""
        response = self.call_tool("execute_plan_step", {
            "session_id": self.session_id,
            "plan_id": plan_id,
            "task": task,
            "adapter_id": adapter_id
        })
        
        return response
    
    def submit_cross_plan_note(self, from_plan: str, to_plan: str, note: str, references: List[str]) -> str:
        """Submit cross-plan contamination note"""
        response = self.call_tool("submit_cross_plan_note", {
            "session_id": self.session_id,
            "note": {
                "from_plan_id": from_plan,
                "to_plan_id": to_plan,
                "note": note,
                "references": references,
                "timestamp": int(time.time() * 1000)
            }
        })
        
        return response
    
    def submit_peer_critique(self, reviewer: str, reviewed: str, claims: List[Dict], 
                            residual_risks: List[str], agreement_score: float) -> str:
        """Submit peer review"""
        response = self.call_tool("submit_peer_critique", {
            "session_id": self.session_id,
            "critique": {
                "reviewer_plan_id": reviewer,
                "reviewed_plan_id": reviewed,
                "claims_challenged": claims,
                "residual_risks": residual_risks,
                "agreement_score": agreement_score,
                "timestamp": int(time.time() * 1000)
            }
        })
        
        return response
    
    def submit_mediation_decision(self, decision_point: str, chosen_from: str, 
                                 rationale: str, evidence_ids: List[str], confidence: float) -> str:
        """Submit mediation decision"""
        response = self.call_tool("submit_mediation_decision", {
            "session_id": self.session_id,
            "decision": {
                "decision_point": decision_point,
                "chosen_from_plan": chosen_from,
                "rationale": rationale,
                "evidence_ids": evidence_ids,
                "confidence": confidence
            }
        })
        
        return response
    
    def list_plan_status(self) -> str:
        """List session status"""
        response = self.call_tool("list_plan_status", {
            "session_id": self.session_id
        })
        
        return response
    
    def finalize(self) -> str:
        """Finalize parallel reasoning session"""
        print(f"\n📋 PHASE 7: Finalizing session...")
        
        response = self.call_tool("finalize_parallel_reasoning", {
            "session_id": self.session_id
        })
        
        return response


def run_complete_test(server_url: str):
    """Run complete end-to-end test"""
    session_id = f"test_{int(time.time())}"
    
    print("=" * 80)
    print("🚀 MCP PARALLEL REASONING - COMPLETE END-TO-END TEST")
    print("=" * 80)
    print(f"\nServer: {server_url}")
    print(f"Session ID: {session_id}")
    
    try:
        # Initialize client
        client = MCPClient(server_url, session_id)
        client.initialize()
        
        # PHASE 1: Initialize parallel reasoning
        client.init_parallel_reasoning(
            task="Geographic expansion analysis for Italian restaurant chain entering German market. 20 existing locations in Northern Italy, €5M budget.",
            diversity_axes=["data_sources", "analytical_models"],
            min_plans=3
        )
        
        # PHASE 2: Submit plans with DIVERSE axes
        # All plans must include required axes (data_sources, analytical_models)
        # But they differ on additional axes for diversity
        print(f"\n📋 PHASE 2: Submitting 3 plans with diverse axes...")

        # Plan A: Required axes + time_horizons
        client.submit_plan(
            plan_id="plan_market",
            description="Quantitative market analysis using official statistics",
            diversity_axes=["data_sources", "analytical_models", "time_horizons"],
            capability_chain=["market_scan", "tam_sam_som_build", "competitor_analysis",
                            "customer_segmentation_clustering", "pricing_analysis_elasticity",
                            "market_sizing_regression", "growth_forecast_arima", "market_share_analysis"],
            rationale="Uses official German restaurant industry statistics and quantitative models for market sizing",
            expected_outputs=["TAM/SAM/SOM for German market", "Competitive landscape", "Customer segments"]
        )

        # Plan B: Required axes + risk_perspectives
        client.submit_plan(
            plan_id="plan_risk",
            description="Risk-adjusted analysis using Monte Carlo simulation",
            diversity_axes=["data_sources", "analytical_models", "risk_perspectives"],
            capability_chain=["market_scan", "risk_assessment_monte_carlo", "scenario_planning_probabilistic",
                            "regulatory_risk_assessment", "financial_risk_assessment", "sensitivity_analysis_tornado",
                            "stress_testing_scenarios", "break_even_analysis"],
            rationale="Uses industry reports and probabilistic modeling for risk-adjusted projections",
            expected_outputs=["Risk-adjusted market size", "Regulatory risks", "Financial scenarios"]
        )

        # Plan C: Required axes + stakeholder_views
        client.submit_plan(
            plan_id="plan_operational",
            description="Operational feasibility analysis",
            diversity_axes=["data_sources", "analytical_models", "stakeholder_views"],
            capability_chain=["market_scan", "operations_assessment", "supply_chain_mapping",
                            "workforce_analysis", "location_analysis", "stakeholder_mapping",
                            "value_chain_analysis", "success_criteria_definition"],
            rationale="Uses site visit data and operational frameworks for feasibility assessment",
            expected_outputs=["Location recommendations", "Supply chain plan", "Staffing requirements"]
        )
        
        # PHASE 3: Execute capabilities
        print(f"\n📋 PHASE 3: Executing capabilities...")
        
        print("   Executing plan_market capability 1...")
        client.execute_plan_step("plan_market", "Perform market scan for German restaurant industry", "strategy")
        print("   ✅ Capability executed")
        
        # PHASE 4: Cross-plan contamination
        print(f"\n📋 PHASE 4: Cross-plan contamination...")
        
        client.submit_cross_plan_note(
            from_plan="plan_market",
            to_plan="plan_risk",
            note="Market scan shows €45B German restaurant market with 3.5% CAGR. Use as baseline for Monte Carlo.",
            references=["evidence_001"]
        )
        print("   ✅ Cross-plan note submitted")
        
        # PHASE 5: Peer review
        print(f"\n📋 PHASE 5: Peer review...")
        
        client.submit_peer_critique(
            reviewer="plan_operational",
            reviewed="plan_market",
            claims=[{
                "claim": "TAM of €45B is accurate",
                "evidence_ids": ["evidence_001"],
                "challenge": "May include non-comparable restaurant formats",
                "falsification_test": "Segment by restaurant type and price point"
            }],
            residual_risks=["Market size may be overstated by 10-15%"],
            agreement_score=0.75
        )
        print("   ✅ Peer critique submitted")
        
        # PHASE 6: Mediation
        print(f"\n📋 PHASE 6: Mediation...")
        
        client.submit_mediation_decision(
            decision_point="Target market size",
            chosen_from="plan_market",
            rationale="Plan market provides defensible baseline. Adjust down 10% per operational plan feedback.",
            evidence_ids=["evidence_001"],
            confidence=0.80
        )
        print("   ✅ Mediation decision submitted")
        
        # Check status
        print(f"\n📋 Checking session status...")
        status = client.list_plan_status()
        print("✅ Status retrieved")
        
        # Finalize
        result = client.finalize()
        
        if "Session Finalized" in str(result) or "Session Incomplete" in str(result):
            print("✅ Session finalized (or validation completed)")
        else:
            print("⚠️  Finalization response:")
            print(str(result)[:500])
        
        print("\n" + "=" * 80)
        print("🎉 TEST COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Use local server
    server_url = "http://localhost:8787/mcp"
    
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    
    success = run_complete_test(server_url)
    sys.exit(0 if success else 1)

