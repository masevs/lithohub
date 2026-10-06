import { useModel } from '../data/model.js';
import { FEATURES } from '../data/features.js';

const STATE_TEXT = { data: '', pending: 'Pending', demo: 'Demo data' };

export default function Rail({ nav, go, fieldStatus }) {
  const { fields: FIELDS } = useModel();
  return (
    <nav className="rail" aria-label="Main">
      <div className="wordmark">
        <div className="name">LithoHub</div>
        <div className="tagline">Geothermal well diagnostics, Indonesia</div>
      </div>
      <div className="rail-nav">
        <button aria-current={nav.view === 'map'} onClick={() => go({ view: 'map' })}>Map</button>
        <button aria-current={nav.view === 'alerts'} onClick={() => go({ view: 'alerts' })}>Alerts</button>
      </div>

      <div className="rail-heading">Fields</div>
      {FIELDS.map((f) => {
        const active = nav.view === 'field' && nav.fieldId === f.id;
        const firstFeature = FEATURES.find((x) => f.features[x.id])?.id;
        return (
          <div key={f.id}>
            <button
              className="field-btn"
              aria-current={active}
              onClick={() => go({ view: 'field', fieldId: f.id, featureId: firstFeature })}
            >
              <span className={`dot ${fieldStatus[f.id]}`} aria-hidden="true" />
              <span>
                <div className="fname">{f.name}</div>
                <div className="fregion">{f.region}</div>
              </span>
              <span className="fregion">{Object.keys(f.features).length} {Object.keys(f.features).length === 1 ? "feature" : "features"}</span>
            </button>
            {active && (
              <div className="feature-list">
                {FEATURES.map((ft) => {
                  const st = f.features[ft.id];
                  return (
                    <button
                      key={ft.id}
                      className="feature-btn"
                      disabled={!st}
                      aria-current={nav.featureId === ft.id}
                      onClick={() => go({ view: 'field', fieldId: f.id, featureId: ft.id })}
                    >
                      <span>{ft.short}</span>
                      <span className="state">{st ? STATE_TEXT[st] : 'No data'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="rail-foot">
        Every value carries its source. Missing data stays empty — LithoHub never fills gaps with invented numbers.
      </div>
    </nav>
  );
}
