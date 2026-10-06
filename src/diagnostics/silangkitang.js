// SILANGKITANG — Northernmost Production Well (well-005)
// Feature 6: Connectivity (chemical injectate breakthrough)
// Source: Simatupang, Matsuda & Astra (2020). Logic ported unchanged from index.html.
import { maxSeverity, emptyResult } from './severity.js';

export const RULES = [
  { key: 'NCG_DROP_WARNING', value: 15, unit: '% NCG decline from the well’s first sample', level: 'warning' },
  { key: 'ENTHALPY_STABLE', value: 95, unit: '% of baseline enthalpy — below this the flag becomes critical', level: 'critical' },
];
const R = Object.fromEntries(RULES.map((r) => [r.key, r.value]));

export function diagnoseSilangkitang(asset) {
  const result = emptyResult();
  if (!asset.geochemicalHistory || !asset.geochemicalHistory.points) return result;

  const gpoints = asset.geochemicalHistory.points;
  if (gpoints.length > 0) {
    const baselineNCG = gpoints[0].ncgWtPercent;
    const latestPoint = gpoints[gpoints.length - 1];
    const latestNCG = latestPoint.ncgWtPercent;
    const pctDrop = ((baselineNCG - latestNCG) / baselineNCG) * 100;

    if (pctDrop >= R.NCG_DROP_WARNING) {
      const baselineEnthalpy = gpoints[0].enthalpyKjKg;
      const latestEnthalpy = latestPoint.enthalpyKjKg;
      const thermalStable = latestEnthalpy >= baselineEnthalpy * (R.ENTHALPY_STABLE / 100);
      result.severity = maxSeverity(result.severity, thermalStable ? 'warning' : 'critical');
      result.anomalyFlags.push({
        metric: 'NCG Concentration',
        deviation: pctDrop.toFixed(1) + '% decline',
        value: latestNCG + ' wt%',
        baseline: baselineNCG + ' wt%',
        percentChange: (-pctDrop).toFixed(1),
        interpretation: latestPoint.eventLabel,
      });
      result.hasAnomaly = true;
      result.anomalyType = 'injection_breakthrough';
      result.recommendation = thermalStable
        ? 'Continue routine geochemical monitoring (NCG, HCO3)'
        : 'Evaluate injection rate/location urgently';
    }
  }
  return result;
}
