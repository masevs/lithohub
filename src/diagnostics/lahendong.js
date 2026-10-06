// LAHENDONG — LHD-8 (well-007) — Feature 5: Well health (drying / boiling signature)
// Source: Suherlina et al. (2022). Logic ported unchanged from index.html.
import { maxSeverity, emptyResult } from './severity.js';

export const RULES = [
  { key: 'CHEM_DIRECTION', value: 'Cl ↑ and/or SO₄ ↓', unit: 'latest vs first sample (no magnitude cutoff)', level: 'warning' },
  { key: 'DRYNESS_DIRECTION', value: 'dryness ↑', unit: 'latest vs first reading (no magnitude cutoff)', level: 'warning' },
  { key: 'ALL_ALIGNED', value: 'Cl ↑ + SO₄ ↓ + dryness ↑', unit: 'all three signals together', level: 'critical' },
];

export function diagnoseLahendong(asset) {
  const result = emptyResult();
  if (!asset.geochemicalTrend || !asset.geochemicalTrend.points || asset.geochemicalTrend.points.length === 0) return result;

  const gPoints = asset.geochemicalTrend.points;
  const clBaseline = gPoints[0], clLatest = gPoints[gPoints.length - 1];
  const clIncreasing = clLatest.clPpm > clBaseline.clPpm;
  const so4Decreasing = clLatest.so4Ppm < clBaseline.so4Ppm;
  const chemAligned = clIncreasing && so4Decreasing;

  let drynessIncreasing = false;
  const drynessPoints = asset.drynessMeasured && asset.drynessMeasured.points;
  if (drynessPoints && drynessPoints.length >= 2) {
    const dBaseline = drynessPoints[0], dLatest = drynessPoints[drynessPoints.length - 1];
    drynessIncreasing = dLatest.drynessPercent > dBaseline.drynessPercent;
  }

  if (clIncreasing || so4Decreasing || drynessIncreasing) {
    const allAligned = chemAligned && drynessIncreasing;
    result.severity = maxSeverity(result.severity, allAligned ? 'critical' : 'warning');

    if (clIncreasing || so4Decreasing) {
      result.anomalyFlags.push({
        metric: 'Reservoir Boiling (Chemical Signature)',
        deviation: chemAligned ? 'Cl up + SO4 down (aligned boiling signature)' : clIncreasing ? 'Cl up only' : 'SO4 down only',
        value: clLatest.clPpm + ' mg/l Cl, ' + clLatest.so4Ppm + ' mg/l SO4',
        baseline: clBaseline.clPpm + ' mg/l Cl, ' + clBaseline.so4Ppm + ' mg/l SO4',
        interpretation: chemAligned
          ? 'Consistent with fluid concentration from reservoir boiling'
          : 'Partial signal — only one indicator shows the boiling-consistent direction',
      });
    }

    if (drynessPoints && drynessPoints.length >= 2) {
      const dBaseline = drynessPoints[0], dLatest = drynessPoints[drynessPoints.length - 1];
      result.anomalyFlags.push({
        metric: 'Increasing Dryness',
        deviation: drynessIncreasing
          ? `+${(dLatest.drynessPercent - dBaseline.drynessPercent).toFixed(0)}pp`
          : 'Stable/decreasing',
        value: dLatest.drynessPercent + '%',
        baseline: dBaseline.drynessPercent + '%',
        interpretation: drynessIncreasing
          ? `Steam fraction rose from ${dBaseline.year} to ${dLatest.year}, consistent with boiling from pressure drawdown`
          : 'No increasing trend observed in the digitized dryness data',
      });
    }

    result.hasAnomaly = true;
    result.anomalyType = 'boiling_dryness_increase';
    result.recommendation = allAligned
      ? 'Monitor for continued boiling/dryness progression; evaluate need for make-up wells if productivity declines further'
      : 'Continue geochemical monitoring; confirm trend with additional sampling';
  }
  return result;
}
