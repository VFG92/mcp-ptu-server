# Apps SDK Setup Guide - Step by Step

## 🎯 Obiettivo
Vedere l'UI personalizzata in ChatGPT quando usi il MCP PTU Server.

## ⚠️ Differenza Cruciale

### MCP Developer Mode (Standard)
- Configurazione: File locale `~/.config/chatgpt/mcp.json`
- Attivazione: Icona tool in basso → seleziona server
- UI: ❌ Nessuna UI personalizzata
- Risultato: Solo testo

### Apps SDK Connector (Quello che serve)
- Configurazione: Settings → Connectors → Create
- Attivazione: `+` button → Developer mode → toggle connector
- UI: ✅ UI personalizzata con React components
- Risultato: Testo + UI interattiva

## 📋 Prerequisiti

1. **Account ChatGPT Plus/Pro/Team/Enterprise** ✅
2. **Developer Mode Access** (vedi sotto come verificare)
3. **Server pubblico HTTPS** ✅ (già deployato)

## 🔍 Step 1: Verifica Accesso Apps SDK

### In ChatGPT Web:

1. Clicca sull'icona del tuo profilo (in alto a destra)
2. Vai su **Settings**
3. Cerca la sezione **Connectors** nel menu laterale
4. Guarda se vedi il pulsante **"Create"**

**Risultato**:
- ✅ **Vedi "Create"** → Hai accesso! Vai allo Step 2
- ❌ **Non vedi "Create"** → Vai allo Step 1B

### Step 1B: Abilita Developer Mode (se non hai "Create")

Se non vedi il pulsante "Create", prova:

1. **In Settings → Connectors**:
   - Cerca una sezione **"Advanced"** o **"Developer mode"**
   - Attiva il toggle **"Developer mode"**
   - Ricarica la pagina

2. **Se ancora non funziona**:
   - Vai su https://platform.openai.com/
   - Accedi con lo stesso account ChatGPT
   - Controlla se hai accesso alla sezione "Apps"
   - Se non ce l'hai, contatta il supporto OpenAI

## 🚀 Step 2: Crea il Connector

Una volta che vedi il pulsante "Create":

1. **Vai in Settings → Connectors**

2. **Clicca "Create"**

3. **Compila il form**:
   ```
   Connector name: MCP PTU Server
   
   Description: Multi-path parallel reasoning server with diversity enforcement. 
   Use this for complex business analysis requiring multiple perspectives. 
   The server orchestrates diverse reasoning plans, cross-plan contamination, 
   peer reviews, and quality metrics (confidence, coverage, consensus).
   
   Connector URL: https://mcp-server.vf-ghizzoni.workers.dev/mcp
   ```

4. **Clicca "Create"**

5. **Verifica la connessione**:
   - ChatGPT si connetterà al server
   - Vedrai la lista dei tool disponibili:
     * init_parallel_reasoning
     * submit_reasoning_plan
     * execute_plan_step
     * submit_cross_plan_note
     * submit_peer_critique
     * submit_mediation_decision
     * list_plan_status
     * finalize_parallel_reasoning
   - Se vedi errori, controlla che l'URL sia corretto

## 🎨 Step 3: Usa il Connector in una Chat

### Importante: NON usare il metodo standard!

❌ **NON fare così** (metodo MCP standard):
- Cliccare l'icona tool in basso
- Selezionare il server dalla lista
- ➡️ Questo NON mostra l'UI!

✅ **Fai così** (metodo Apps SDK):

1. **Apri una NUOVA conversazione**

2. **Clicca il pulsante `+`** (vicino al composer, in basso)

3. **Scegli "Developer mode"** dal menu

4. **Vedrai una lista di connectors disponibili**

5. **Attiva il toggle** per "MCP PTU Server"

6. **Ora scrivi un prompt**:
   ```
   Use the MCP PTU Server to analyze Q4 2025 market trends. 
   Create 3 diverse reasoning plans with different data sources and analytical models.
   ```

## 🎯 Step 4: Verifica che l'UI Funzioni

Quando ChatGPT chiama `init_parallel_reasoning`, dovresti vedere:

### ✅ Con Apps SDK (corretto):
- **Testo della risposta** (come prima)
- **+ UI Component** con:
  - Card con session info
  - Task description
  - Required diversity axes
  - Suggested axes
  - Progress indicators

### ❌ Con MCP standard (sbagliato):
- Solo testo della risposta
- Nessun componente UI
- Nessuna visualizzazione interattiva

## 🐛 Troubleshooting

### Problema 1: Non vedo il pulsante "Create"
**Causa**: Non hai accesso Apps SDK
**Soluzione**: 
- Verifica di avere ChatGPT Plus/Pro/Team/Enterprise
- Prova ad abilitare Developer Mode in Settings → Connectors → Advanced
- Contatta il supporto OpenAI se necessario

### Problema 2: Errore di connessione al server
**Causa**: URL non raggiungibile o formato sbagliato
**Soluzione**:
- Verifica che l'URL sia: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`
- Testa con: `curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp`
- Controlla che il server sia online

### Problema 3: Connector creato ma nessuna UI
**Causa**: Stai usando il metodo sbagliato per attivare il connector
**Soluzione**:
- NON usare l'icona tool in basso
- USA il pulsante `+` → Developer mode → toggle connector

### Problema 4: Tool calls funzionano ma nessuna UI
**Causa**: Stai usando MCP Developer Mode standard, non Apps SDK Connector
**Soluzione**:
- Verifica di aver creato il connector (Step 2)
- Verifica di attivarlo con `+` → Developer mode (Step 3)
- Assicurati di essere in una nuova conversazione

### Problema 5: "Developer mode" non appare nel menu `+`
**Causa**: Connector non creato o non abilitato
**Soluzione**:
- Torna allo Step 2 e crea il connector
- Verifica che il connector sia stato creato con successo
- Ricarica la pagina di ChatGPT

## 📊 Differenze Visive

### MCP Standard (quello che vedi ora):
```
User: Analyze market trends
Assistant: [Calling init_parallel_reasoning...]
✅ Session initialized successfully

Session ID: analysis_001
Task: Analyze market trends
...
[Solo testo]
```

### Apps SDK (quello che dovresti vedere):
```
User: Analyze market trends
Assistant: [Calling init_parallel_reasoning...]

┌─────────────────────────────────────┐
│ 🎯 Session Initialized              │
│                                     │
│ Session ID: analysis_001            │
│ Task: Analyze market trends         │
│                                     │
│ Required Diversity Axes:            │
│ • data_sources                      │
│ • analytical_models                 │
│                                     │
│ Progress: ▓▓▓░░░░░░░ 30%           │
└─────────────────────────────────────┘

✅ Session initialized successfully
...
[Testo + UI Component interattivo]
```

## 🎓 Recap

1. **Verifica accesso**: Settings → Connectors → cerca "Create"
2. **Crea connector**: Usa l'URL pubblico del server
3. **Usa connector**: `+` button → Developer mode → toggle ON
4. **Testa**: Prompt che usa il server
5. **Verifica UI**: Dovresti vedere componenti React

## 📚 Risorse

- **Documentazione**: https://developers.openai.com/apps-sdk/
- **Guida connessione**: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- **Server URL**: https://mcp-server.vf-ghizzoni.workers.dev/mcp
- **Verifica server**: `./verify-structured-content.sh`

## ❓ Domande Frequenti

**Q: Posso usare sia MCP standard che Apps SDK?**
A: Sì, sono indipendenti. MCP standard usa server locali, Apps SDK usa connettori remoti.

**Q: L'UI funziona su mobile?**
A: Sì, una volta creato il connector su web, funziona anche su mobile.

**Q: Devo ricreare il connector ogni volta?**
A: No, una volta creato rimane salvato nel tuo account.

**Q: Posso avere più connettori?**
A: Sì, puoi creare più connettori per server diversi.

**Q: Il connector è privato?**
A: Sì, solo tu puoi vedere e usare i tuoi connettori.

---

Se segui questi passi e ancora non vedi l'UI, fammi sapere esattamente:
1. Vedi il pulsante "Create" in Settings → Connectors?
2. Hai creato il connector con successo?
3. Come attivi il server (icona tool o `+` button)?
4. Cosa vedi esattamente quando ChatGPT chiama i tool?

