// SALAK — Well #1 (well-004) — Feature 5: Well health (production decline)
// Source: Libert & Pasikki (2010)
// Logic ported unchanged from index.html (diagnoseSalak, computeModelDivergence,
// interpolateModelRate). Thresholds were moved into RULES with the same values.
import { maxSeverity, emptyResult } from './severity.js';

export const RULES = [
  { key: 'RATIO_WARNING', value: 1.5, unit: '× baseline decline rate', level: 'warning' },
  { key: 'PP_WARNING', value: 5, unit: 'pp above baseline decline rate', level: 'warning' },
  { key: 'RATIO_CRITICAL', value: 2, unit: '× baseline decline rate', level: 'critical' },
  { key: 'PP_CRITICAL', value: 10, unit: 'pp above baseline decline rate', level: 'critical' },
  { key: 'MODEL_SUSTAINED', value: 2, unit: 'consecutive points below the WELLHIST model', level: 'critical' },
];
const R = Object.fromEntries(RULES.map((r) => [r.key, r.value]));

// Interpolates the calibrated WELLHIST model curve at an arbitrary year.
// No extrapolation — returns null outside the digitized range.
export function interpolateModelRate(modelPoints, year) {
  const sorted = modelPoints.slice().sort((a, b) => a.year - b.year);
  if (year < sorted[0].year || year > sorted[sorted.length - 1].year) return null;
  for (let i = 0; i < sorted.length - 1; i++) {
    const p0 = sorted[i], p1 = sorted[i + 1];
    if (year >= p0.year && year <= p1.year) {
      const frac = (year - p0.year) / (p1.year - p0.year);
      return p0.modelRateKph + frac * (p1.modelRateKph - p0.modelRateKph);
    }
  }
  return null;
}

// Pairs each measured point with the interpolated model value.
export function computeModelDivergence(asset) {
  const measured = asset.productionHistory?.digitizedSteamRate?.points;
  const model = asset.productionHistory?.digitizedModelRate?.points;
  if (!measured || !model || measured.length === 0 || model.length === 0) return null;
  return measured.map((p) => {
    const modelVal = interpolateModelRate(model, p.yearApprox);
    return {
      yearApprox: p.yearApprox,
      measuredKph: p.steamRateKph,
      modelKph: modelVal !== null ? Math.round(modelVal * 10) / 10 : null,
      belowModel: modelVal !== null ? p.steamRateKph < modelVal : null,
    };
  });
}

export function diagnoseSalak(asset) {
  const result = emptyResult();
  if (!asset.productionHistory || !asset.productionHistory.points) return result;

  // Tier A: decline rate vs the well's own baseline
  const points = asset.productionHistory.points.filter((p) => p.declineRatePercent != null);
  if (points.length > 0) {
    const baseline = points[0].declineRatePercent;
    const latestPoint = points[points.length - 1];
    const latest = latestPoint.declineRatePercent;
    const ratio = latest / baseline;
    const ppIncrease = latest - baseline;

    if (ratio >= R.RATIO_WARNING || ppIncrease >= R.PP_WARNING) {
      const isCritical = ratio >= R.RATIO_CRITICAL || ppIncrease >= R.PP_CRITICAL;
      result.severity = maxSeverity(result.severity, isCritical ? 'critical' : 'warning');
      result.anomalyFlags.push({
        metric: 'Decline Rate',
        deviation: ratio.toFixed(1) + 'x baseline',
        value: latest + '%',
        baseline: baseline + '%',
        percentChange: ppIncrease.toFixed(1),
        interpretation: latestPoint.eventLabel,
      });
      result.hasAnomaly = true;
      result.anomalyType = 'production_decline';
      result.recommendation = isCritical
        ? 'Schedule workover evaluation (e.g. caliper log, mechanical clean-out)'
        : 'Continue monitoring; investigate contributing wells or reservoir changes';
    }
  }

  // Tier B: divergence from the calibrated WELLHIST hydraulic model.
  // "Sustained" = the last 2 points are both below the model.
  const divergence = computeModelDivergence(asset);
  if (divergence && divergence.length >= 2) {
    const last = divergence[divergence.length - 1];
    const prev = divergence[divergence.length - 2];
    if (last.belowModel) {
      const sustained = prev.belowModel === true;
      result.severity = maxSeverity(result.severity, sustained ? 'critical' : 'warning');
      const valid = divergence.filter((p) => p.modelKph !== null);
      const worst = valid.reduce(
        (min, p) =>
          min === null || p.measuredKph - p.modelKph < min.measuredKph - min.modelKph ? p : min,
        null
      );
      result.anomalyFlags.push({
        metric: 'Model Divergence',
        deviation: sustained ? 'Sustained — 2+ points below model' : 'Early — 1 point below model',
        value: worst.measuredKph + ' kph',
        baseline: worst.modelKph + ' kph',
        interpretation:
          'Actual steam rate has stayed below the calibrated hydraulic model across consecutive points',
      });
      result.hasAnomaly = true;
      if (result.anomalyType === 'none') result.anomalyType = 'production_decline';
      if (sustained) {
        result.recommendation = 'Schedule workover evaluation (e.g. caliper log, mechanical clean-out)';
      }
    }
  }
  return result;
}
