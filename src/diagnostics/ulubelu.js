// ULUBELU — Production well, unnamed in source (well-006)
// Feature 5: Well health (casing defect / cold water influx)
// Source: Yuniar et al. (2015)
// NOT calculated from data — this reproduces the paper's conclusion ("reported by source").
export const RULES = [];

export function diagnoseUlubelu() {
  return {
    hasAnomaly: true,
    anomalyFlags: [
      {
        metric: 'Casing Defect',
        deviation: 'N/A — historical case, not computed',
        value: 'Confirmed via downhole PT survey',
        baseline: 'Static pre-intrusion temperature profile',
        interpretation:
          'Caused by a shallow casing defect allowing cold water intrusion into the wellbore, confirmed via downhole PT survey showing temperature decline versus the static baseline profile.',
      },
    ],
    anomalyType: 'casing_leak_cold_influx',
    severity: 'critical',
    summary: 'Casing defect / cold water influx',
    recommendation: 'Plan for well repair.',
  };
}
