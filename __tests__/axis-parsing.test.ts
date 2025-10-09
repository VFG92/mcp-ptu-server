/**
 * Tests for improved diversity axis parsing
 * Verifies that long descriptive axes in init match abbreviated axes in plans
 */

import { parseAxisString, satisfiesRequiredAxes } from '../src/workers/parallel-reasoning-mcp';

describe('Diversity Axis Parsing - Italian Case', () => {
  describe('parseAxisString - extracting main keys', () => {
    test('extracts key from long Italian description with parentheses', () => {
      const result = parseAxisString('Postura verso l\'AGCM (accettazione vs contestazione)');
      expect(result.key).toBe('postura_agcm');
      expect(result.value).toBe('');
    });

    test('extracts key from abbreviated form with value', () => {
      const result = parseAxisString('Postura: accettazione');
      expect(result.key).toBe('postura');
      expect(result.value).toBe('accettazione');
    });

    test('extracts key from "del/della" constructions', () => {
      const result1 = parseAxisString('Ampiezza del rimedio economico ai clienti');
      expect(result1.key).toBe('ampiezza_rimedio_economico');

      const result2 = parseAxisString('Tonalità della comunicazione (penitente vs assertiva vs tecnica)');
      expect(result2.key).toBe('tonalità_comunicazione');

      const result3 = parseAxisString('Grado di apertura dei dati (trasparenza radicale vs disclosure minima)');
      expect(result3.key).toBe('grado_apertura_dati');
    });

    test('extracts key from "vs" constructions', () => {
      const result = parseAxisString('Velocità di implementazione vs robustezza del controllo');
      expect(result.key).toBe('velocità_implementazione');
    });

    test('extracts key from "al/alla" constructions', () => {
      const result = parseAxisString('Propensione al rischio reputazionale e legale');
      expect(result.key).toBe('propensione_rischio_reputazionale');
    });

    test('handles abbreviated forms with values', () => {
      const result1 = parseAxisString('Rimedio: ampio');
      expect(result1.key).toBe('rimedio');
      expect(result1.value).toBe('ampio');

      const result2 = parseAxisString('Velocità: alta');
      expect(result2.key).toBe('velocità');
      expect(result2.value).toBe('alta');

      const result3 = parseAxisString('Tonalità: penitente');
      expect(result3.key).toBe('tonalità');
      expect(result3.value).toBe('penitente');
    });
  });

  describe('satisfiesRequiredAxes - matching long and short forms', () => {
    test('matches Italian long-form required axes with short-form plan axes', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti',
        'Velocità di implementazione vs robustezza del controllo',
        'Tonalità della comunicazione (penitente vs assertiva vs tecnica)',
        'Grado di apertura dei dati (trasparenza radicale vs disclosure minima)',
        'Propensione al rischio reputazionale e legale'
      ];

      const planAxes = [
        'Postura: accettazione',
        'Rimedio: ampio',
        'Velocità: alta',
        'Tonalità: penitente',
        'Apertura: radicale',
        'Rischio: basso'
      ];

      const result = satisfiesRequiredAxes(planAxes, requiredAxes);
      expect(result).toBe(true);
    });

    test('rejects plan missing required axes', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti',
        'Velocità di implementazione vs robustezza del controllo'
      ];

      const planAxes = [
        'Postura: accettazione',
        'Rimedio: ampio'
        // Missing Velocità
      ];

      const result = satisfiesRequiredAxes(planAxes, requiredAxes);
      expect(result).toBe(false);
    });

    test('accepts plan with extra axes beyond required', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti'
      ];

      const planAxes = [
        'Postura: accettazione',
        'Rimedio: ampio',
        'Extra: value',
        'Another: value'
      ];

      const result = satisfiesRequiredAxes(planAxes, requiredAxes);
      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('handles simple English axes (backward compatibility)', () => {
      const result1 = parseAxisString('data_sources');
      expect(result1.key).toBe('data_sources');

      const result2 = parseAxisString('Tech Stack: Hybrid');
      expect(result2.key).toBe('tech_stack');
      expect(result2.value).toBe('hybrid');
    });

    test('handles axes with multiple parentheses', () => {
      const result = parseAxisString('Key (detail 1) with (detail 2) extra');
      expect(result.key).toBe('key_with_extra');
    });

    test('handles axes with accented characters', () => {
      const result1 = parseAxisString('Velocità: alta');
      expect(result1.key).toBe('velocità');

      const result2 = parseAxisString('Tonalità della comunicazione');
      expect(result2.key).toBe('tonalità_comunicazione');
    });

    test('handles mixed case', () => {
      const result1 = parseAxisString('POSTURA: ACCETTAZIONE');
      expect(result1.key).toBe('postura');
      expect(result1.value).toBe('accettazione');

      const result2 = parseAxisString('Postura Verso L\'AGCM');
      expect(result2.key).toBe('postura_agcm');
    });
  });

  describe('Real-world scenario from user', () => {
    test('P1_consent_dei plan should match required axes', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti',
        'Velocità di implementazione vs robustezza del controllo',
        'Tonalità della comunicazione (penitente vs assertiva vs tecnica)',
        'Grado di apertura dei dati (trasparenza radicale vs disclosure minima)',
        'Propensione al rischio reputazionale e legale'
      ];

      // Example plan axes from P1_consent_dei
      const p1Axes = [
        'Postura: accettazione piena',
        'Rimedio: ampio e proattivo',
        'Velocità: rapida',
        'Tonalità: penitente',
        'Apertura: trasparenza radicale',
        'Rischio: basso'
      ];

      const result = satisfiesRequiredAxes(p1Axes, requiredAxes);
      expect(result).toBe(true);
    });

    test('P2_dual_track plan should match required axes', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti',
        'Velocità di implementazione vs robustezza del controllo',
        'Tonalità della comunicazione (penitente vs assertiva vs tecnica)',
        'Grado di apertura dei dati (trasparenza radicale vs disclosure minima)',
        'Propensione al rischio reputazionale e legale'
      ];

      // Example plan axes from P2_dual_track
      const p2Axes = [
        'Postura: accettazione con riserve',
        'Rimedio: medio',
        'Velocità: bilanciata',
        'Tonalità: tecnica',
        'Apertura: disclosure selettiva',
        'Rischio: medio'
      ];

      const result = satisfiesRequiredAxes(p2Axes, requiredAxes);
      expect(result).toBe(true);
    });

    test('P3_contest_strategic plan should match required axes', () => {
      const requiredAxes = [
        'Postura verso l\'AGCM (accettazione vs contestazione)',
        'Ampiezza del rimedio economico ai clienti',
        'Velocità di implementazione vs robustezza del controllo',
        'Tonalità della comunicazione (penitente vs assertiva vs tecnica)',
        'Grado di apertura dei dati (trasparenza radicale vs disclosure minima)',
        'Propensione al rischio reputazionale e legale'
      ];

      // Example plan axes from P3_contest_strategic
      const p3Axes = [
        'Postura: contestazione strategica',
        'Rimedio: minimo',
        'Velocità: lenta e robusta',
        'Tonalità: assertiva',
        'Apertura: disclosure minima',
        'Rischio: alto'
      ];

      const result = satisfiesRequiredAxes(p3Axes, requiredAxes);
      expect(result).toBe(true);
    });
  });
});

