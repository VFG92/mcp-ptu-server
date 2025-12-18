# 🔄 Apps SDK Migration Guide

Guida pratica per adattare mcp-ptu-server al formato OpenAI Apps SDK.

## 📋 Checklist Migrazione

### Fase 1: Metadata Format (CRITICO)
- [ ] Creare helper `createAppsSDKMetadata()`
- [ ] Aggiornare tipo di ritorno dei tool handlers
- [ ] Modificare tutti i 9 tool handlers
- [ ] Testare con MCP inspector

### Fase 2: Widget Bundles (IMPORTANTE)
- [ ] Setup Vite build per widget
- [ ] Generare bundle statici
- [ ] Configurare serving degli asset
- [ ] Testare rendering in ChatGPT

### Fase 3: Testing & Deploy (FINALE)
- [ ] Test end-to-end con ChatGPT developer mode
- [ ] Verificare tutti i widget
- [ ] Deploy su Cloudflare Workers
- [ ] Documentare per submission

---

## 🛠️ Implementazione Dettagliata

### Step 1: Creare Helper per Metadata

**File**: `src/workers/apps-sdk-metadata.ts`

```typescript
/**
 * Apps SDK Metadata Helper
 * Converts structured content to OpenAI Apps SDK format
 */

import type { StructuredContent } from './ui-structured-content.js';

/**
 * Apps SDK metadata format
 */
export interface AppsSDKMetadata {
  "openai/outputTemplate": {
    type: string;
    props: Record<string, unknown>;
  };
}

/**
 * Convert structured content to Apps SDK metadata format
 */
export function createAppsSDKMetadata(
  componentType: string,
  structuredContent: StructuredContent
): AppsSDKMetadata {
  return {
    "openai/outputTemplate": {
      type: componentType,
      props: structuredContent
    }
  };
}

/**
 * Widget component types for parallel reasoning
 */
export const WidgetTypes = {
  WORKFLOW_VISUALIZER: 'workflow_visualizer',
  PLAN_TIMELINE: 'plan_timeline',
  DIVERSITY_MATRIX: 'diversity_matrix',
  METRICS_DASHBOARD: 'metrics_dashboard'
} as const;

export type WidgetType = typeof WidgetTypes[keyof typeof WidgetTypes];
```

### Step 2: Aggiornare Tool Response Type

**File**: `src/workers/parallel-reasoning-tools-v5.ts`

```typescript
// AGGIUNGERE all'inizio del file
import { createAppsSDKMetadata, WidgetTypes, type AppsSDKMetadata } from './apps-sdk-metadata.js';

// MODIFICARE tipo di ritorno
export type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  _meta?: AppsSDKMetadata;
};
```

### Step 3: Modificare Tool Handler (Esempio)

**Prima** (formato attuale):
```typescript
export async function handleInitParallelReasoning(
  args: z.infer<typeof InitParallelReasoningSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<{ 
  content: Array<{ type: string; text: string }>; 
  structuredContent?: WorkflowInitializedContent 
}> {
  // ... logica esistente ...
  
  const structuredContent = createStructuredContent<WorkflowInitializedContent>(
    'workflow_initialized',
    session.session_id,
    {
      task_description: session.task_description,
      required_diversity_axes: session.required_diversity_axes,
      min_plans: session.min_plans,
      suggested_axes: suggestedAxesResult.suggested_axes
    }
  );

  return {
    content: [{ type: "text", text: response }],
    structuredContent: structuredContent
  };
}
```

**Dopo** (formato Apps SDK):
```typescript
export async function handleInitParallelReasoning(
  args: z.infer<typeof InitParallelReasoningSchema>,
  manager: ParallelReasoningSessionManager = globalParallelReasoningManager
): Promise<ToolResponse> {
  // ... logica esistente INVARIATA ...
  
  const structuredContent = createStructuredContent<WorkflowInitializedContent>(
    'workflow_initialized',
    session.session_id,
    {
      task_description: session.task_description,
      required_diversity_axes: session.required_diversity_axes,
      min_plans: session.min_plans,
      suggested_axes: suggestedAxesResult.suggested_axes
    }
  );

  // NUOVO: Converti a formato Apps SDK
  const metadata = createAppsSDKMetadata(
    WidgetTypes.WORKFLOW_VISUALIZER,
    structuredContent
  );

  return {
    content: [{ type: "text", text: response }],
    _meta: metadata  // ← Cambiamento chiave
  };
}
```

### Step 4: Aggiornare Tutti i Tool Handlers

**Lista completa** (in `parallel-reasoning-tools-v5.ts`):

1. **handleInitParallelReasoning** → `WidgetTypes.WORKFLOW_VISUALIZER`
2. **handleSubmitReasoningPlan** → `WidgetTypes.PLAN_TIMELINE`
3. **handleExecutePlanStep** → `WidgetTypes.PLAN_TIMELINE`
4. **handleSubmitCrossPlanNote** → `WidgetTypes.WORKFLOW_VISUALIZER`
5. **handleSubmitPeerCritique** → `WidgetTypes.WORKFLOW_VISUALIZER`
6. **handleSubmitMediationDecision** → `WidgetTypes.WORKFLOW_VISUALIZER`
7. **handleListPlanStatus** → `WidgetTypes.DIVERSITY_MATRIX`
8. **handleCheckSessionReadiness** → `WidgetTypes.METRICS_DASHBOARD`
9. **handleFinalizeParallelReasoning** → `WidgetTypes.METRICS_DASHBOARD`

**Template per ogni handler**:
```typescript
export async function handle[ToolName](
  args: z.infer<typeof [ToolName]Schema>,
  // ... altri parametri ...
): Promise<ToolResponse> {
  // ... logica esistente ...
  
  const structuredContent = createStructuredContent<[ContentType]>(
    '[content_type]',
    args.session_id,
    { /* dati */ }
  );

  const metadata = createAppsSDKMetadata(
    WidgetTypes.[WIDGET_TYPE],
    structuredContent
  );

  return {
    content: [{ type: "text", text: response }],
    _meta: metadata
  };
}
```

---

## 🏗️ Widget Build System

### Step 5: Creare Build Script

**File**: `build-widgets.mts`

```typescript
import { build } from 'vite';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';

const srcDir = resolve(__dirname, 'src/ui/src/components');
const outDir = resolve(__dirname, 'assets');

// Trova tutti i componenti
const components = readdirSync(srcDir)
  .filter(file => file.endsWith('.tsx'))
  .map(file => file.replace('.tsx', ''));

console.log(`Building ${components.length} widget components...`);

for (const component of components) {
  await build({
    build: {
      lib: {
        entry: resolve(srcDir, `${component}.tsx`),
        name: component,
        fileName: (format) => `${component}-[hash].${format}.js`,
        formats: ['es']
      },
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    }
  });
  
  console.log(`✓ Built ${component}`);
}

console.log(`\n✅ All widgets built to ${outDir}/`);
```

**Aggiungere a `package.json`**:
```json
{
  "scripts": {
    "build:widgets": "tsx build-widgets.mts",
    "build:all": "npm run build && npm run build:widgets"
  }
}
```

### Step 6: Servire Asset Statici

**Opzione A: Cloudflare Workers Sites**

**File**: `wrangler.toml`
```toml
[site]
bucket = "./assets"
entry-point = "workers-site"
```

**Opzione B: Endpoint Dedicato**

**File**: `src/workers/index.ts`
```typescript
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

// Serve widget assets
app.get('/assets/*', serveStatic({ root: './' }));

// Existing MCP endpoints
app.post('/mcp', handleMCP);
app.post('/proxy', handleProxy);

export default app;
```

**Opzione C: CDN Esterno (Raccomandato per produzione)**

1. Deploy assets su Cloudflare R2:
```bash
wrangler r2 bucket create mcp-ptu-widgets
wrangler r2 object put mcp-ptu-widgets/workflow-visualizer.js --file=assets/workflow-visualizer-[hash].js
```

2. Configurare public URL in metadata:
```typescript
const WIDGET_BASE_URL = 'https://widgets.your-domain.com';

export function createAppsSDKMetadata(
  componentType: string,
  structuredContent: StructuredContent
): AppsSDKMetadata {
  return {
    "openai/outputTemplate": {
      type: componentType,
      props: {
        ...structuredContent,
        _widgetUrl: `${WIDGET_BASE_URL}/${componentType}.js`
      }
    }
  };
}
```

---

## 🧪 Testing

### Test Locale con MCP Inspector

```bash
# Terminal 1: Avvia server
npm run workers:dev

# Terminal 2: Testa tool
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test-123",
        "task_description": "Test task",
        "required_diversity_axes": ["axis1", "axis2"],
        "min_plans": 3
      }
    }
  }'
```

**Verifica risposta**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "..." }
    ],
    "_meta": {
      "openai/outputTemplate": {
        "type": "workflow_visualizer",
        "props": {
          "type": "workflow_initialized",
          "session_id": "test-123",
          "timestamp": 1234567890,
          "task_description": "Test task",
          "required_diversity_axes": [...],
          "min_plans": 3
        }
      }
    }
  }
}
```

### Test con ChatGPT Developer Mode

1. Abilita [developer mode](https://platform.openai.com/docs/guides/developer-mode)
2. Vai in Settings > Connectors
3. Aggiungi server:
   - **URL**: `https://your-worker.workers.dev/mcp`
   - **Type**: Remote MCP Server
4. Testa conversazione:
   ```
   User: "Initialize a parallel reasoning session for analyzing market trends"
   
   ChatGPT: [Chiama init_parallel_reasoning]
   [Dovrebbe renderizzare workflow visualizer widget]
   ```

---

## 📦 Deploy

### Deploy su Cloudflare Workers

```bash
# Build tutto
npm run build:all

# Deploy
npm run workers:deploy

# Verifica
curl https://your-worker.workers.dev/mcp
```

### Configurare per Apps SDK Submission

Quando le submission apriranno:

1. **Manifest File** (`app-manifest.json`):
```json
{
  "name": "MCP PTU Server",
  "description": "Parallel reasoning orchestration with quality metrics",
  "version": "1.0.0",
  "mcp_endpoint": "https://your-worker.workers.dev/mcp",
  "widgets": [
    {
      "type": "workflow_visualizer",
      "name": "Workflow Visualizer",
      "description": "Interactive parallel reasoning workflow visualization"
    },
    {
      "type": "metrics_dashboard",
      "name": "Metrics Dashboard",
      "description": "Real-time quality metrics dashboard"
    }
  ],
  "capabilities": [
    "parallel_reasoning",
    "quality_metrics",
    "evidence_tracking"
  ]
}
```

2. **Screenshots** (per submission):
   - Workflow visualizer in azione
   - Metrics dashboard
   - Plan timeline
   - Diversity matrix

3. **Documentation**:
   - README aggiornato
   - API documentation
   - Usage examples

---

## 🎯 Priorità Implementazione

### Must Have (per submission)
1. ✅ Metadata format con `_meta.openai/outputTemplate`
2. ✅ Almeno 1 widget funzionante (workflow visualizer)
3. ✅ Deploy stabile su Cloudflare Workers

### Should Have (per buona UX)
1. 🔶 Tutti i 4 widget implementati
2. 🔶 Asset serving ottimizzato
3. 🔶 Error handling robusto

### Nice to Have (per differenziazione)
1. 💡 Animazioni smooth nei widget
2. 💡 Export/import session data
3. 💡 Real-time collaboration features

---

## 🚨 Troubleshooting

### Problema: Widget non si carica in ChatGPT
**Soluzione**: Verifica CORS headers e CSP policy

### Problema: Metadata non riconosciuto
**Soluzione**: Verifica formato esatto `_meta.openai/outputTemplate`

### Problema: Build fallisce
**Soluzione**: Verifica versioni Node.js e dipendenze

---

## 📚 Riferimenti Utili

- [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Prossimo Step**: Inizia con Step 1 (creare helper metadata) e testa con un singolo tool prima di rollout completo.

