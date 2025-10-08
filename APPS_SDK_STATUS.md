# ChatGPT Apps SDK - Status & Verification

## Current Status (October 2025)

### Availability
- **Status**: Beta limitata
- **Accesso**: Solo sviluppatori whitelisted
- **Utenti Plus EU**: ❌ Non ancora disponibile pubblicamente
- **Requisiti**: Account OpenAI Platform + whitelist specifica

### Come Verificare l'Accesso

1. **Via Platform OpenAI**:
   - Vai su https://platform.openai.com/settings/organization/apps
   - Se vedi la sezione "Apps" → hai accesso
   - Altrimenti → devi richiedere accesso alla beta

2. **Via ChatGPT**:
   - Apri ChatGPT in Developer Mode
   - Chiama un tool MCP che ritorna `structuredContent`
   - Se vedi componenti UI interattivi → Apps SDK attivo
   - Se vedi solo testo → Apps SDK non disponibile

### Richiedere Accesso

Per richiedere l'accesso alla beta:
1. Vai su https://platform.openai.com/
2. Contatta il supporto OpenAI
3. Richiedi accesso a "ChatGPT Apps SDK Beta"
4. Fornisci use case e dettagli del progetto

## Implementazione nel MCP PTU Server

### ✅ Componenti Implementati

Il server è **già pronto** per l'Apps SDK:

1. **Structured Content**: Tutti gli 8 tool MCP ritornano `structuredContent`
2. **UI Components**: 5 componenti React pronti
3. **UI Resources**: Serviti via MCP protocol (`mcp://ui/*`)
4. **Build System**: Separato per UI (`src/ui/`)

### 📦 File UI

```
src/ui/
├── package.json                          # Dipendenze UI
├── tsconfig.json                         # Config TypeScript per React
├── src/
│   ├── index.tsx                         # Entry point
│   ├── types.ts                          # TypeScript interfaces
│   ├── WorkflowVisualizer.tsx            # Router principale
│   ├── styles.css                        # Stili con dark mode
│   └── components/
│       ├── WorkflowTimeline.tsx          # Timeline eventi
│       ├── PlanComparisonMatrix.tsx      # Confronto piani
│       └── QualityMetricsDashboard.tsx   # Metriche qualità
└── dist/
    ├── workflow-visualizer.js            # Bundle (154KB)
    └── workflow-visualizer.css           # Stili (8KB)
```

### 🔧 Come Funziona

Quando l'Apps SDK è disponibile:

1. **Tool Call**: ChatGPT chiama `init_parallel_reasoning`
2. **Server Response**:
   ```json
   {
     "content": [{"type": "text", "text": "Session initialized..."}],
     "structuredContent": {
       "type": "workflow_initialized",
       "session_id": "analysis_001",
       "task_description": "...",
       "required_diversity_axes": [...],
       "timestamp": 1696118400000
     }
   }
   ```
3. **ChatGPT Apps SDK**: Rileva `structuredContent`
4. **UI Rendering**: Carica `mcp://ui/workflow-visualizer.js`
5. **Component Display**: Mostra `WorkflowVisualizer` con i dati

### 🎨 Componenti Visualizzati

| Tool | Structured Content Type | Componente UI |
|------|------------------------|---------------|
| `init_parallel_reasoning` | `workflow_initialized` | Session card |
| `submit_reasoning_plan` | `plan_submitted` | Plan acceptance card |
| `execute_plan_step` | `plan_execution` | Progress bar + evidence |
| `list_plan_status` | `workflow_status` | Timeline + Matrix |
| `finalize_parallel_reasoning` | `workflow_finalized` | Metrics Dashboard |

## Testing Senza Apps SDK

### Opzione 1: Verificare Structured Content

Puoi verificare che il server ritorni `structuredContent` anche senza UI:

```bash
# Chiama un tool e verifica la risposta
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "test_001",
        "task_description": "Test task",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    },
    "id": 1
  }'
```

La risposta includerà sia `content` (testo) che `structuredContent` (dati).

### Opzione 2: Simulare UI Localmente

Puoi testare i componenti React localmente:

```bash
cd src/ui
npm install
npm run dev  # Avvia dev server (se configurato)
```

## Roadmap

### Quando Apps SDK sarà disponibile

1. **Nessuna modifica necessaria** - Il server è già pronto
2. **UI si attiverà automaticamente** - ChatGPT rileverà `structuredContent`
3. **Componenti verranno caricati** - Da `mcp://ui/workflow-visualizer.js`

### Cosa Fare Ora

1. ✅ **Server pronto** - Tutti i tool ritornano `structuredContent`
2. ✅ **UI components built** - Bundle disponibile in `src/ui/dist/`
3. ⏳ **Attendere accesso Apps SDK** - Richiedere beta se necessario
4. 🎯 **Testare quando disponibile** - UI si attiverà automaticamente

## Fallback Behavior

**Senza Apps SDK**:
- ✅ Tool calls funzionano normalmente
- ✅ Risposte testuali complete
- ❌ Nessuna UI interattiva
- ℹ️ `structuredContent` ignorato da ChatGPT

**Con Apps SDK**:
- ✅ Tool calls funzionano normalmente
- ✅ Risposte testuali complete
- ✅ UI interattiva visualizzata
- ✅ `structuredContent` renderizzato come componenti

## Riferimenti

- **OpenAI Platform**: https://platform.openai.com/
- **Apps SDK Docs**: https://platform.openai.com/docs/apps (quando disponibile)
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Repository**: https://github.com/VFG92/mcp-ptu-server

## Conclusione

Il server **è già completamente pronto** per l'Apps SDK. Non appena avrai accesso alla beta, l'UI si attiverà automaticamente senza bisogno di modifiche al codice. Nel frattempo, tutti i tool funzionano perfettamente con le risposte testuali standard.

