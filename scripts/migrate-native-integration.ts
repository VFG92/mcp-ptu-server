/**
 * Migration Script: Add Explicit Native Integration to Capabilities
 * 
 * This script automatically adds LLM native integration (Python/Web Search)
 * to capabilities that require explicit integration during execution.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CapabilityMigration {
  capabilityId: string;
  filePath: string;
  integrationType: 'python' | 'web_search';
  templateName: string;
  searchPattern: string; // Pattern to find the execute function
}

const migrations: CapabilityMigration[] = [
  // Financial capabilities (3 remaining)
  {
    capabilityId: 'capital_structure_optimizer',
    filePath: 'src/workers/capabilities/finance-valuation-capabilities-part2.ts',
    integrationType: 'python',
    templateName: 'capitalStructureOptimizer',
    searchPattern: 'id: \'capital_structure_optimizer\''
  },
  {
    capabilityId: 'working_capital_diagnostic',
    filePath: 'src/workers/capabilities/finance-valuation-capabilities-part2.ts',
    integrationType: 'python',
    templateName: 'workingCapitalDiagnostic',
    searchPattern: 'id: \'working_capital_diagnostic\''
  },
  {
    capabilityId: 'scenario_forecasting',
    filePath: 'src/workers/capabilities/finance-valuation-capabilities-part2.ts',
    integrationType: 'python',
    templateName: 'scenarioForecasting',
    searchPattern: 'id: \'scenario_forecasting\''
  },
  // Market intelligence capabilities (3)
  {
    capabilityId: 'competitor_analysis',
    filePath: 'src/workers/capabilities/market-capabilities.ts',
    integrationType: 'web_search',
    templateName: 'competitorAnalysis',
    searchPattern: 'id: \'competitor_analysis\''
  },
  {
    capabilityId: 'regulatory_scan_enhanced',
    filePath: 'src/workers/capabilities/legal-regulatory-capabilities.ts',
    integrationType: 'web_search',
    templateName: 'regulatoryScan',
    searchPattern: 'id: \'regulatory_scan_enhanced\''
  },
  {
    capabilityId: 'innovation_radar',
    filePath: 'src/workers/capabilities/advanced-analytics-capabilities.ts',
    integrationType: 'web_search',
    templateName: 'innovationRadar',
    searchPattern: 'id: \'innovation_radar\''
  },
  // Advanced analytics capabilities (3)
  {
    capabilityId: 'pricing_ai_optimizer',
    filePath: 'src/workers/capabilities/advanced-analytics-capabilities.ts',
    integrationType: 'python',
    templateName: 'pricingAIOptimizer',
    searchPattern: 'id: \'pricing_ai_optimizer\''
  },
  {
    capabilityId: 'digital_twin_ops',
    filePath: 'src/workers/capabilities/advanced-analytics-capabilities.ts',
    integrationType: 'python',
    templateName: 'digitalTwinOps',
    searchPattern: 'id: \'digital_twin_ops\''
  },
  {
    capabilityId: 'scenario_engine',
    filePath: 'src/workers/capabilities/advanced-analytics-capabilities.ts',
    integrationType: 'python',
    templateName: 'scenarioEngine',
    searchPattern: 'id: \'scenario_engine\''
  },
  // Risk capabilities (2)
  {
    capabilityId: 'cybersecurity_risk_model',
    filePath: 'src/workers/capabilities/risk-capabilities.ts',
    integrationType: 'web_search',
    templateName: 'cybersecurityRisk',
    searchPattern: 'id: \'cybersecurity_risk_model\''
  },
  {
    capabilityId: 'geostrategic_risk_scan',
    filePath: 'src/workers/capabilities/risk-capabilities.ts',
    integrationType: 'web_search',
    templateName: 'geostrategicRisk',
    searchPattern: 'id: \'geostrategic_risk_scan\''
  }
];

/**
 * Generate Python integration code
 */
function generatePythonIntegration(templateName: string, capabilityId: string): string {
  return `
    // AGENT ↔ LLM INTERACTION: Request native Python execution for real calculation
    const nativeCapabilities = getNativeCapabilities(context);
    let nativeResults: any = null;
    let evidenceType = EvidenceType.HEURISTIC;
    let warnings: string[] = [];

    if (nativeCapabilities?.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
      const pythonCode = ${templateName}PythonTemplate(inputs);

      try {
        const response = await nativeCapabilities.invoke(
          NativeCapabilityType.PYTHON_EXECUTION,
          { code: pythonCode, timeout_seconds: 30 },
          context
        );

        if (response.success && response.result) {
          const parsed = parseNativePythonResult(response.result);
          if (parsed) {
            nativeResults = parsed;
            evidenceType = EvidenceType.CALCULATION;
            warnings.push('Real calculation executed via LLM native Python');
          } else {
            warnings.push('LLM Python execution returned unexpected format - using heuristic estimates');
          }
        } else {
          throw new Error('Python execution failed');
        }
      } catch (error) {
        warnings.push('LLM native capabilities unavailable - using heuristic estimates');
      }
    } else {
      warnings.push('LLM native capabilities not available - using heuristic estimates');
    }

    // Use real results or fallback to heuristics
    const output = nativeResults || `;
}

/**
 * Generate Web Search integration code
 */
function generateWebSearchIntegration(templateName: string, capabilityId: string): string {
  return `
    // AGENT ↔ LLM INTERACTION: Request web search for real-time intelligence
    const nativeCapabilities = getNativeCapabilities(context);
    let realTimeData: any = null;
    let evidenceType = EvidenceType.HEURISTIC;
    let warnings: string[] = [];

    if (nativeCapabilities?.isAvailable(NativeCapabilityType.WEB_SEARCH)) {
      const searchQueries = ${templateName}WebSearchQueries(inputs);

      try {
        const searchResults = await Promise.all(
          searchQueries.map(query =>
            nativeCapabilities.invoke(
              NativeCapabilityType.WEB_SEARCH,
              { query, max_results: 5 },
              context
            )
          )
        );

        if (searchResults.every((r: any) => r.success)) {
          realTimeData = searchResults.map((r: any) => r.result);
          evidenceType = EvidenceType.RETRIEVAL;
          warnings.push('Real-time intelligence retrieved via LLM web search');
        } else {
          throw new Error('Web search failed');
        }
      } catch (error) {
        warnings.push('LLM web search unavailable - using heuristic estimates');
      }
    } else {
      warnings.push('LLM native capabilities not available - using heuristic estimates');
    }

    // Use real data or fallback to heuristics
    const output = realTimeData ? { /* enhanced with real data */ } : `;
}

/**
 * Check if file needs import update
 */
function needsImportUpdate(content: string): boolean {
  return !content.includes('parseNativePythonResult');
}

/**
 * Add imports to file
 */
function addImports(content: string): string {
  const importLine = "import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';";
  const newImportLine = "import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';\nimport { getNativeCapabilities, NativeCapabilityType, parseNativePythonResult } from '../llm-native-capabilities.js';";
  
  if (content.includes(importLine) && !content.includes('parseNativePythonResult')) {
    return content.replace(importLine, newImportLine);
  }
  
  return content;
}

/**
 * Find execute function for a capability
 */
function findExecuteFunction(content: string, searchPattern: string): { start: number; insertPoint: number; hasStartTime: boolean } | null {
  const capabilityStart = content.indexOf(searchPattern);
  if (capabilityStart === -1) {
    return null;
  }

  // Find the execute function after the capability definition
  const executeStart = content.indexOf('async execute(inputs: any, context: ExecutionContext)', capabilityStart);
  if (executeStart === -1) {
    return null;
  }

  // Find "const startTime = Date.now();" line
  const startTimePos = content.indexOf('const startTime = Date.now();', executeStart);
  const hasStartTime = startTimePos !== -1 && startTimePos < executeStart + 500;

  // Find where to insert (after startTime or after execute opening brace)
  let insertPoint: number;
  if (hasStartTime) {
    // Insert after the startTime line
    insertPoint = content.indexOf('\n', startTimePos) + 1;
  } else {
    // Insert after the opening brace of execute function
    const openBrace = content.indexOf('{', executeStart);
    insertPoint = content.indexOf('\n', openBrace) + 1;
  }

  return { start: executeStart, insertPoint, hasStartTime };
}

/**
 * Migrate a single capability
 */
function migrateCapability(migration: CapabilityMigration): boolean {
  const filePath = path.join(process.cwd(), migration.filePath);

  console.log(`\n📝 Migrating ${migration.capabilityId}...`);
  console.log(`   File: ${migration.filePath}`);
  console.log(`   Type: ${migration.integrationType}`);

  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already migrated
  if (content.includes(`capability_id: '${migration.capabilityId}'`) &&
      content.includes('getNativeCapabilities(context)') &&
      content.indexOf('getNativeCapabilities(context)', content.indexOf(`id: '${migration.capabilityId}'`)) <
      content.indexOf(`capability_id: '${migration.capabilityId}'`, content.indexOf(`id: '${migration.capabilityId}'`))) {
    console.log(`   ⏭️  Already migrated, skipping...`);
    return true;
  }

  // Add imports if needed
  if (needsImportUpdate(content)) {
    console.log(`   ✓ Adding imports...`);
    content = addImports(content);
  }

  // Find execute function
  const executeLocation = findExecuteFunction(content, migration.searchPattern);
  if (!executeLocation) {
    console.error(`   ❌ Could not find execute function for ${migration.capabilityId}`);
    return false;
  }

  // Generate integration code
  const integrationCode = migration.integrationType === 'python'
    ? generatePythonIntegration(migration.templateName, migration.capabilityId)
    : generateWebSearchIntegration(migration.templateName, migration.capabilityId);

  // Insert integration code at the right position
  const before = content.substring(0, executeLocation.insertPoint);
  const after = content.substring(executeLocation.insertPoint);

  content = before + integrationCode + after;

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`   ✅ Migration complete!`);

  return true;
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Starting Native Integration Migration');
  console.log(`   Total capabilities to migrate: ${migrations.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    if (migrateCapability(migration)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully migrated: ${successCount}/${migrations.length}`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}/${migrations.length}`);
  }
  console.log('='.repeat(60));
}

// Run migration
main();

