// Dispatcher (Strategy Pattern), ported from computeAnomalies() in index.html.
// v2 change: the function is chosen explicitly per well (asset.diagnosis),
// instead of guessing from which data keys exist.
import { diagnoseSalak, RULES as SALAK_RULES } from './salak.js';
import { diagnoseLahendong, RULES as LAHENDONG_RULES } from './lahendong.js';
import { diagnoseSilangkitang, RULES as SILANGKITANG_RULES } from './silangkitang.js';
import { diagnoseUlubelu, RULES as ULUBELU_RULES } from './ulubelu.js';
import { diagnoseSuperheat, RULES as SUPERHEAT_RULES } from './superheat.js';

export const DIAGNOSES = {
  salak: { fn: diagnoseSalak, rules: SALAK_RULES, basis: 'diagnosed' },
  lahendong: { fn: diagnoseLahendong, rules: LAHENDONG_RULES, basis: 'diagnosed' },
  silangkitang: { fn: diagnoseSilangkitang, rules: SILANGKITANG_RULES, basis: 'diagnosed' },
  ulubelu: { fn: diagnoseUlubelu, rules: ULUBELU_RULES, basis: 'reported' },
  superheat: { fn: diagnoseSuperheat, rules: SUPERHEAT_RULES, basis: 'diagnosed', evidence: (a) => a.superheatSeries?.evidence },
};

export function runDiagnosis(key, asset, usingUserData = false) {
  const d = DIAGNOSES[key];
  if (!d) return null;
  const result = d.fn(asset);
  // A computed diagnosis with no flags and no usable data is 'nodata', not 'normal'.
  let severity = d.basis === 'diagnosed' && !result.hasAnomaly && !hasAnyData(key, asset) ? 'nodata' : result.severity;
  // Illustrative data: keep the rule's answer for display, but the status is 'demo'.
  const illustrative = !usingUserData && d.evidence?.(asset) === 'illustrative';
  const computedSeverity = severity;
  if (illustrative) severity = 'demo';
  return { ...result, severity, computedSeverity, illustrative, basis: d.basis, rules: d.rules };
}

function hasAnyData(key, asset) {
  const len = (x) => (Array.isArray(x) ? x.length : 0);
  if (key === 'salak') return len(asset.productionHistory?.points) > 0 || len(asset.productionHistory?.digitizedSteamRate?.points) > 1;
  if (key === 'lahendong') return len(asset.geochemicalTrend?.points) > 1 || len(asset.drynessMeasured?.points) > 1;
  if (key === 'silangkitang') return len(asset.geochemicalHistory?.points) > 1;
  if (key === 'superheat') return len(asset.superheatSeries?.points) > 1;
  return true;
}
