# Test Plan: Capability Persistence Flow

## Obiettivo
Verificare che il flusso end-to-end di persistenza funzioni correttamente:
1. `analyze_with_capabilities` → genera artefatti
2. `get_capability_status` → legge artefatti persistiti
3. `export_session` → esporta tutti i dati persistiti

## Modifiche Implementate

### 1. **createServer() - everything-workers.ts**
- ✅ Aggiunto parametro `capabilityWhiteboard?: Whiteboard`
- ✅ Aggiunto parametro `capabilityLedger?: EvidenceLedger`
- ✅ Aggiunto parametro `capabilityPersistCallback?: () => Promise<void>`
- ✅ Creato oggetto `capabilitySystemRefs` per passare ai tool handlers

### 2. **MCPSession - session.ts**
- ✅ Passa `this.whiteboard` a createServer
- ✅ Passa `this.evidenceLedger` a createServer
- ✅ Passa `capabilityPersistCallback` che chiama `this.persistCapabilityState()`

### 3. **initializeCapabilitySystem() - capability-tools.ts**
- ✅ Accetta parametro opzionale `refs?: CapabilitySystemRefs`
- ✅ Usa `refs.whiteboard` se fornito, altrimenti `globalWhiteboard`
- ✅ Usa `refs.ledger` se fornito, altrimenti `globalEvidenceLedger`
- ✅ Crea orchestrator con storage appropriato

### 4. **Tool Handlers - capability-tools.ts**
- ✅ `handleAnalyzeWithCapabilities()` - accetta `refs`, chiama `refs.persistCallback()` dopo execute
- ✅ `handleGetCapabilityStatus()` - accetta `refs`, usa DO storage
- ✅ `handleExportSession()` - accetta `refs`, usa DO storage
- ✅ `handleListCapabilities()` - accetta `refs`

### 5. **CallTool Handler - everything-workers.ts**
- ✅ Passa `capabilitySystemRefs` a tutti i capability tool handlers

## Flusso di Persistenza

```
┌─────────────────────────────────────────────────────────────┐
│ 1. analyze_with_capabilities                                │
├─────────────────────────────────────────────────────────────┤
│ • initializeCapabilitySystem(refs) → usa DO whiteboard      │
│ • orchestrator.execute() → genera artefatti                 │
│ • artefatti salvati in DO whiteboard (in-memory)            │
│ • refs.persistCallback() → persistCapabilityState()         │
│ • DO storage.put('capability_whiteboard', data)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. get_capability_status                                    │
├─────────────────────────────────────────────────────────────┤
│ • initializeCapabilitySystem(refs) → usa DO whiteboard      │
│ • orchestrator.getSessionStatus() → legge da DO whiteboard  │
│ • whiteboard già caricato da loadCapabilityState()          │
│ • Ritorna artifacts_count, executions, costs                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. export_session                                           │
├─────────────────────────────────────────────────────────────┤
│ • initializeCapabilitySystem(refs) → usa DO whiteboard      │
│ • orchestrator.exportSession() → legge da DO whiteboard     │
│ • Esporta artifacts, evidence, execution_summary            │
│ • Ritorna JSON completo per audit trail                     │
└─────────────────────────────────────────────────────────────┘
```

## Test Manuale

### Prerequisiti
1. Server in esecuzione: `npm run dev`
2. Client MCP connesso (es. Claude Desktop)

### Sequenza di Test

#### Step 1: Analyze
```json
{
  "tool": "analyze_with_capabilities",
  "arguments": {
    "session_id": "test-persist-001",
    "task": "Analyze market positioning for a SaaS startup",
    "adapter_id": "strategy",
    "tournament_mode": false
  }
}
```

**Aspettative:**
- ✅ Ritorna artifacts con confidence scores
- ✅ Console log: `[CapabilityTools] Persisting capability state after execution`
- ✅ Console log: `[MCPSession] Successfully persisted capability state`

#### Step 2: Status (subito dopo)
```json
{
  "tool": "get_capability_status",
  "arguments": {
    "session_id": "test-persist-001"
  }
}
```

**Aspettative:**
- ✅ `artifacts_count` > 0 (non zero!)
- ✅ `capabilities_executed` > 0
- ✅ `total_cost` con valori realistici
- ✅ `recent_executions` con lista di capability eseguite

#### Step 3: Export
```json
{
  "tool": "export_session",
  "arguments": {
    "session_id": "test-persist-001"
  }
}
```

**Aspettative:**
- ✅ `artifacts` array non vuoto
- ✅ Ogni artifact ha `id`, `type`, `data`, `metadata`
- ✅ `evidence` array con verification data
- ✅ `execution_summary` con metriche aggregate

### Verifica Persistenza Cross-Request

#### Step 4: Nuovo Request (simula reconnect)
Chiudi e riapri la connessione MCP, poi:

```json
{
  "tool": "get_capability_status",
  "arguments": {
    "session_id": "test-persist-001"
  }
}
```

**Aspettative:**
- ✅ Dati ancora presenti (caricati da DO storage)
- ✅ `artifacts_count` uguale a prima
- ✅ Console log: `[MCPSession] Loaded X artifacts from whiteboard`

## Debugging

### Log da Monitorare

```bash
# Persistenza dopo analyze
[CapabilityTools] Persisting capability state after execution
[MCPSession] Persisting capability state
[MCPSession] Successfully persisted capability state

# Caricamento all'avvio
[MCPSession] Constructor called for DO ID: ...
[MCPSession] Loaded X sessions from storage
[MCPSession] Loaded Y artifacts from whiteboard

# Status/Export
[CallTool] Handling get_capability_status
[CapabilitySystem] Registered N capabilities
```

### Problemi Comuni

1. **artifacts_count = 0 in status**
   - Causa: persistCallback non chiamato o fallito
   - Fix: Verificare log di persistenza

2. **Dati persi dopo reconnect**
   - Causa: loadCapabilityState() non funziona
   - Fix: Verificare formato serializzazione

3. **Session ID mismatch**
   - Causa: Worker routing non corretto
   - Fix: Verificare header `mcp-session-id`

## Metriche di Successo

- ✅ Persistenza: 100% degli artefatti salvati
- ✅ Retrieval: 100% degli artefatti recuperati
- ✅ Latency: < 100ms overhead per persistenza
- ✅ Consistency: Dati identici pre/post reconnect

## Next Steps

1. ✅ Implementazione completata
2. 🔄 Test manuale in corso
3. ⏳ Test automatizzati (future)
4. ⏳ Performance benchmarking (future)

