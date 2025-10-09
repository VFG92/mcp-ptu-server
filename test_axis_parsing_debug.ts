import { parseAxisString } from './src/workers/parallel-reasoning-mcp';

const testCases = [
  'Postura verso l\'AGCM (accettazione vs contestazione)',
  'Postura: accettazione',
  'Ampiezza del rimedio economico ai clienti',
  'Rimedio: ampio',
  'Velocità di implementazione vs robustezza del controllo',
  'Velocità: alta',
  'Tonalità della comunicazione (penitente vs assertiva vs tecnica)',
  'Tonalità: penitente',
  'Grado di apertura dei dati (trasparenza radicale vs disclosure minima)',
  'Apertura: radicale',
  'Propensione al rischio reputazionale e legale',
  'Rischio: basso',
  'Tech Stack: Hybrid',
  'data_sources'
];

console.log('Axis Parsing Debug:\n');
testCases.forEach(axis => {
  const result = parseAxisString(axis);
  console.log(`Input:  "${axis}"`);
  console.log(`Key:    "${result.key}"`);
  console.log(`Value:  "${result.value}"`);
  console.log('---');
});

