import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildModel, ModelContext } from './data/model.js';
import { featureById } from './data/features.js';
import { loadUserData, saveUserData, resolveAsset } from './data/store.js';
import { runDiagnosis } from './diagnostics/index.js';
import { worstSeverity } from './diagnostics/severity.js';
import Rail from './components/Rail.jsx';
import AlertBar from './components/AlertBar.jsx';
import MapView from './components/MapView.jsx';
import FieldView from './components/FieldView.jsx';
import AlertsPage from './components/AlertsPage.jsx';

// Same data file and URL as the v1 dashboard (/data/assets.json), plus fields.json for F1–F4.
const DATA = (name) => `${import.meta.env.BASE_URL}data/${name}`;

async function loadJson(name) {
  const r = await fetch(DATA(name), { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Could not load data/${name} (HTTP ${r.status}).`);
  try {
    return await r.json();
  } catch (e) {
    throw new Error(`data/${name} is not valid JSON: ${e.message}`);
  }
}

export default function App() {
  const [model, setModel] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    Promise.all([loadJson('assets.json'), loadJson('fields.json')])
      .then(([assets, fields]) => setModel(buildModel(assets, fields)))
      .catch((e) => setLoadError(e.message));
  }, []);

  if (loadError) {
    return (
      <div className="center">
        <div className="panel">
          <h2>The well data could not be loaded</h2>
          <p>{loadError}</p>
          <p>Check that <code>public/data/assets.json</code> and <code>public/data/fields.json</code> exist and are valid JSON (no trailing commas).</p>
        </div>
      </div>
    );
  }
  if (!model) return <div className="center">Loading well data…</div>;

  return (
    <ModelContext.Provider value={model}>
      <Dashboard model={model} />
    </ModelContext.Provider>
  );
}

function Dashboard({ model }) {
  const [nav, setNav] = useState({ view: 'map' });
  const [userData, setUserData] = useState(loadUserData);
  const go = useCallback((next) => setNav(next), []);

  const updateUser = (next) => {
    setUserData(next);
    saveUserData(next);
  };
  const user = {
    data: userData,
    save: (id, tables) => updateUser({ ...userData, [id]: { tables, active: true, savedAt: new Date().toISOString() } }),
    toggle: (id, on) => userData[id] && updateUser({ ...userData, [id]: { ...userData[id], active: on } }),
    remove: (id) => {
      const next = { ...userData };
      delete next[id];
      updateUser(next);
    },
  };

  // Run every diagnosis on the active dataset (paper data, or the user's data if switched on).
  const results = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(model.wells).map(([id, w]) => {
          const usingUserData = !!userData[id]?.active;
          const asset = resolveAsset(w, id, userData, usingUserData);
          return [id, { ...runDiagnosis(w.diagnosis, asset, usingUserData), asset, usingUserData }];
        })
      ),
    [model, userData]
  );

  // Field color: worst well diagnosis. No wells → visualization only ('none') or demo-only ('demo').
  const fieldStatus = useMemo(
    () =>
      Object.fromEntries(
        model.fields.map((f) => {
          if (f.wells.length) return [f.id, worstSeverity(f.wells.map((id) => results[id].severity))];
          const states = Object.values(f.features);
          return [f.id, states.length && states.every((s) => s === 'demo') ? 'demo' : 'none'];
        })
      ),
    [model, results]
  );

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, normal: 0, nodata: 0 };
    Object.values(results).forEach((r) => { if (r.severity in c) c[r.severity] += 1; });
    return c;
  }, [results]);

  const title =
    nav.view === 'map' ? 'Indonesian geothermal fields'
      : nav.view === 'alerts' ? 'Alerts'
      : `${model.fieldById[nav.fieldId].name} — ${featureById[nav.featureId]?.short ?? ''}`;

  return (
    <div className="app">
      <Rail nav={nav} go={go} fieldStatus={fieldStatus} />
      <div className="main">
        <AlertBar title={title} counts={counts} usingUserData={Object.values(results).some((r) => r.usingUserData)} go={go} />
        <main className="content">
          {nav.view === 'map' && <MapView fieldStatus={fieldStatus} go={go} />}
          {nav.view === 'alerts' && <AlertsPage results={results} filter={nav.filter} go={go} />}
          {nav.view === 'field' && (
            <FieldView
              key={`${nav.fieldId}-${nav.featureId}`}
              fieldId={nav.fieldId}
              featureId={nav.featureId}
              results={results}
              user={user}
              go={go}
              fieldStatus={fieldStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
