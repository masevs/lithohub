// Editable datasets per diagnosis: which tables a user can replace with their own data.
// `path` is where the points live inside the asset object.
export const SCHEMAS = {
  salak: [
    {
      path: 'productionHistory.points',
      title: 'Decline-rate events',
      evidence: 'quoted',
      columns: [
        { key: 'date', label: 'Date', type: 'text' },
        { key: 'steamRateKph', label: 'Steam rate (kph)', type: 'number' },
        { key: 'declineRatePercent', label: 'Decline rate (%/yr)', type: 'number' },
        { key: 'eventLabel', label: 'Event', type: 'text' },
      ],
    },
    {
      path: 'productionHistory.digitizedSteamRate.points',
      title: 'Measured steam rate',
      evidence: 'digitized',
      columns: [
        { key: 'yearApprox', label: 'Year (decimal)', type: 'number', required: true },
        { key: 'steamRateKph', label: 'Steam rate (kph)', type: 'number', required: true },
      ],
    },
    {
      path: 'productionHistory.digitizedModelRate.points',
      title: 'WELLHIST model curve',
      evidence: 'digitized',
      columns: [
        { key: 'year', label: 'Year', type: 'number', required: true },
        { key: 'modelRateKph', label: 'Model rate (kph)', type: 'number', required: true },
      ],
    },
  ],
  lahendong: [
    {
      path: 'geochemicalTrend.points',
      title: 'Chloride & sulfate',
      evidence: 'quoted',
      columns: [
        { key: 'date', label: 'Year', type: 'text', required: true },
        { key: 'clPpm', label: 'Cl (mg/l)', type: 'number', required: true },
        { key: 'so4Ppm', label: 'SO₄ (mg/l)', type: 'number', required: true },
      ],
    },
    {
      path: 'drynessMeasured.points',
      title: 'Dryness',
      evidence: 'digitized',
      columns: [
        { key: 'year', label: 'Year', type: 'text', required: true },
        { key: 'drynessPercent', label: 'Dryness (%)', type: 'number', required: true },
      ],
    },
  ],
  silangkitang: [
    {
      path: 'geochemicalHistory.points',
      title: 'NCG, HCO₃, enthalpy & flow',
      evidence: 'digitized',
      columns: [
        { key: 'date', label: 'Date', type: 'text', required: true },
        { key: 'ncgWtPercent', label: 'NCG (wt%)', type: 'number', required: true },
        { key: 'hco3Ppm', label: 'HCO₃ (ppm)', type: 'number' },
        { key: 'enthalpyKjKg', label: 'Enthalpy (kJ/kg)', type: 'number', required: true },
        { key: 'flowRateTPerHr', label: 'Flow (t/h)', type: 'number' },
        { key: 'eventLabel', label: 'Event', type: 'text' },
      ],
    },
  ],
  ulubelu: [],
  superheat: [
    {
      path: 'superheatSeries.points',
      title: 'Surface superheat by year',
      evidence: 'illustrative',
      columns: [
        { key: 'year', label: 'Year / label', type: 'text', required: true },
        { key: 'deltaTC', label: 'ΔT superheat (°C)', type: 'number', required: true },
      ],
    },
  ],
};

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => {
    if (o[k] == null) o[k] = {};
    o = o[k];
  });
  o[keys[keys.length - 1]] = value;
}
