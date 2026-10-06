// KAMOJANG — well pads C-1, C-2, A-2 — Feature 3: Superheat & thermal dynamics
// Ported from compute() in the F3 prototype ("Tier B — rule engine"), unchanged.
// The rule only checks a sustained rise above the pad's OWN baseline — no global cutoff.
// Severity: the prototype only says "Flagged"; LithoHub shows a flag as 'warning'.
import { emptyResult } from './severity.js';

export const RULES = [
  { key: 'BASELINE_N', value: 3, unit: 'first points form the pad’s own baseline (mean)', level: 'warning' },
  { key: 'THRESHOLD_C', value: 3, unit: '°C above that baseline', level: 'warning' },
  { key: 'MIN_RUN', value: 3, unit: 'consecutive latest points above the threshold to flag', level: 'warning' },
];
const R = Object.fromEntries(RULES.map((r) => [r.key, r.value]));

// Same arithmetic as the prototype. series = [{ year, deltaTC }]
export function computeSuperheat(series, params = R) {
  const valid = series.filter((p) => p.deltaTC != null && !Number.isNaN(p.deltaTC));
  if (valid.length < 2) return null;
  const N = Math.max(2, Math.min(params.BASELINE_N || 3, valid.length - 1));
  const thresh = params.THRESHOLD_C || 3;
  const minRun = Math.max(1, params.MIN_RUN || 3);
  const baselinePts = valid.slice(0, N).map((p) => p.deltaTC);
  const baselineMean = baselinePts.reduce((a, b) => a + b, 0) / baselinePts.length;
  let run = 0;
  for (let i = valid.length - 1; i >= 0; i--) {
    if (valid[i].deltaTC > baselineMean + thresh) run++;
    else break;
  }
  const flagged = run >= minRun;
  return {
    series: valid, N, thresh, minRun, baselineMean, run, flagged,
    flagIdxStart: flagged ? valid.length - run : -1,
    latest: valid[valid.length - 1].deltaTC,
  };
}

export function diagnoseSuperheat(asset) {
  const result = emptyResult();
  const c = computeSuperheat(asset.superheatSeries?.points ?? []);
  if (!c) return result;
  result.details = c;
  if (c.flagged) {
    result.severity = 'warning';
    result.hasAnomaly = true;
    result.anomalyType = 'superheat_rise';
    result.anomalyFlags.push({
      metric: 'Surface superheat',
      deviation: `${c.run} consecutive point(s) above baseline + ${c.thresh}°C`,
      value: c.latest.toFixed(1) + ' °C',
      baseline: c.baselineMean.toFixed(1) + ' °C (mean of first ' + c.N + ')',
      interpretation:
        'Sustained upward deviation, consistent with the reported depletion pattern — treat as a steam-supply signal, not a corrosion signal.',
    });
    result.recommendation = 'Review steam supply at this pad; check injection placement (see mitigation note).';
  } else {
    result.recommendation = `No sustained deviation. Longest current run: ${c.run} of ${c.minRun} required point(s).`;
  }
  return result;
}
