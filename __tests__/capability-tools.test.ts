import { describe, it, expect, jest } from '@jest/globals';

import {
  handleAnalyzeWithCapabilities,
  handleGetCapabilityStatus,
  handleExportSession,
  handleListCapabilities
} from '../src/workers/capability-tools.js';
import { Whiteboard } from '../src/workers/whiteboard-memory.js';
import { EvidenceLedger } from '../src/workers/evidence-ledger.js';

describe('capability tools end-to-end', () => {
  it('runs analysis, reports status, exports session, and lists capabilities', async () => {
    const refs = {
      whiteboard: new Whiteboard(),
      ledger: new EvidenceLedger(),
      persistCallback: jest.fn(async () => undefined)
    };

    const analysis = await handleAnalyzeWithCapabilities({
      session_id: 'test-session',
      task: 'Evaluate cloud migration options for fintech startup.',
      adapter_id: 'strategy',
      tournament_mode: false,
      peer_review_mode: false
    }, refs);

    expect(refs.persistCallback).toHaveBeenCalled();
    expect(analysis.content[0].text).toContain('Analysis Results');

    const status = await handleGetCapabilityStatus({ session_id: 'test-session' }, refs);
    expect(status.content[0].text).toContain('Session Status: test-session');

    const exported = await handleExportSession({ session_id: 'test-session' }, refs);
    expect(exported.content[0].text).toContain('```json');

    const list = await handleListCapabilities({ category: 'market' });
    expect(list.content[0].text).toContain('MARKET');
  }, 60000);
});
