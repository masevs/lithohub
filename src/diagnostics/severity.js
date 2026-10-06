// Severity order used across LithoHub.
// 'nodata' is new in v2: a well without enough data is never shown as 'normal'.
// 'demo': the result comes from illustrative data — never counted as an alert.
export const SEVERITY_ORDER = { demo: -2, nodata: -1, normal: 0, warning: 1, critical: 2 };

// Ported unchanged from index.html: picks the more severe of two statuses.
export function maxSeverity(a, b) {
  const order = { normal: 0, warning: 1, critical: 2 };
  return order[b] > order[a] ? b : a;
}

// For combining wells/fields in the UI (includes 'nodata').
export function worstSeverity(list) {
  return list.reduce(
    (worst, s) => (SEVERITY_ORDER[s] > SEVERITY_ORDER[worst] ? s : worst),
    'demo'
  );
}

export function emptyResult() {
  return {
    hasAnomaly: false,
    anomalyFlags: [],
    anomalyType: 'none',
    severity: 'normal',
    summary: 'No anomalies detected',
    recommendation: 'Continue routine monitoring',
  };
}
