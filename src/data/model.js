// Builds the app's data model from the two data files:
//   data/assets.json  – wells with a diagnosis (same file and format as v1)
//   data/fields.json  – field information and the field-level datasets for F1–F4
// Edit those JSON files to change data; no code change is needed.
import { createContext, useContext } from 'react';

// Older assets.json files have no "field" key: fall back to the v1 well ids.
const KNOWN_FIELD = { 'well-004': 'salak', 'well-005': 'silangkitang', 'well-006': 'ulubelu', 'well-007': 'lahendong' };

// Which feature shows each diagnosis.
export const FEATURE_FOR = { salak: 'f5', lahendong: 'f5', ulubelu: 'f5', silangkitang: 'f6', superheat: 'f3' };

// Same order as computeAnomalies() in the v1 index.html, plus the F3 superheat series.
export function pickDiagnosis(asset) {
  if (asset.productionHistory) return 'salak';
  if (asset.geochemicalHistory) return 'silangkitang';
  if (asset.anomalyType === 'casing_leak_cold_influx') return 'ulubelu';
  if (asset.geochemicalTrend) return 'lahendong';
  if (asset.superheatSeries) return 'superheat';
  return null; // v1 demo assets (synthetic sensor data) — not diagnosed in v2
}

const STATE_RANK = { pending: 0, demo: 1, data: 2 };
const better = (a, b) => (a == null ? b : b == null ? a : STATE_RANK[b] > STATE_RANK[a] ? b : a);

// A feature has 'data' if any dataset holds real (non-illustrative) values,
// 'demo' if it only has illustrative values, 'pending' if everything is pending.
export function featureState(datasets) {
  let state = null;
  Object.values(datasets ?? {}).forEach((ds) => {
    if (!ds || !ds.evidence) return;
    const s = ds.evidence === 'pending' ? 'pending' : ds.evidence === 'illustrative' ? 'demo' : 'data';
    state = better(state, s);
  });
  return state;
}

export function buildModel(assets, fieldsData = {}) {
  if (!Array.isArray(assets)) throw new Error('data/assets.json must be an array of assets, like in v1.');

  const fields = Object.entries(fieldsData)
    .filter(([id]) => !id.startsWith('_'))
    .map(([id, f]) => {
      const features = {};
      Object.entries(f.features ?? {}).forEach(([fid, ds]) => {
        const st = featureState(ds);
        if (st) features[fid] = st;
      });
      return { id, name: f.name, region: f.region ?? '', lat: f.lat, lng: f.lng, coordinateNote: f.coordinateNote, data: f.features ?? {}, features, wells: [] };
    });

  const wells = {};
  const demo = [];

  assets.forEach((asset) => {
    const diagnosis = pickDiagnosis(asset);
    if (!diagnosis) {
      demo.push(asset);
      return;
    }
    const fieldId = asset.field ?? KNOWN_FIELD[asset.id] ?? asset.id;
    let field = fields.find((f) => f.id === fieldId);
    if (!field) {
      // A well from a field not in fields.json gets its own map marker.
      field = { id: fieldId, name: asset.name, region: asset.location ?? '', data: {}, features: {}, wells: [] };
      fields.push(field);
    }
    if (field.lat == null && asset.latitude != null) {
      field.lat = asset.latitude;
      field.lng = asset.longitude;
      field.coordinateNote = asset.coordinateNote ?? 'Location from data/assets.json.';
    }
    const feature = FEATURE_FOR[diagnosis];
    const wellState = asset.superheatSeries?.evidence === 'illustrative' ? 'demo' : 'data';
    field.wells.push(asset.id);
    field.features[feature] = better(field.features[feature], wellState);
    wells[asset.id] = { asset, diagnosis, feature, field: field.id };
  });

  const mapped = fields.filter((f) => f.lat != null);
  return {
    wells,
    fields: mapped,
    fieldById: Object.fromEntries(mapped.map((f) => [f.id, f])),
    demo: demo.filter((a) => a.latitude != null),
  };
}

export const ModelContext = createContext(null);
export const useModel = () => useContext(ModelContext);
