import { useModel } from '../data/model.js';
import { featureById } from '../data/features.js';
import { SeverityBadge, SEV_LABEL, BASIS_LABEL, EvidenceTag } from './Severity.jsx';
import { SEVERITY_ORDER } from '../diagnostics/severity.js';

const FILTERS = ['all', 'critical', 'warning', 'normal', 'nodata'];

export default function AlertsPage({ results, filter = 'all', go }) {
  const { wells: WELLS, fieldById } = useModel();
  const rows = Object.entries(results)
    .map(([id, r]) => ({ id, r, w: WELLS[id] }))
    .filter(({ r }) => r.severity !== 'demo')
    .filter(({ r }) => filter === 'all' || r.severity === filter)
    .sort((a, b) => SEVERITY_ORDER[b.r.severity] - SEVERITY_ORDER[a.r.severity]);

  return (
    <div className="page">
      <h1>Alerts</h1>
      <p className="sub" style={{ color: 'var(--ink-2)' }}>
        Every well with a diagnosis, worst first. Results on demo data (the illustrative Kamojang superheat series) are never listed as alerts.
      </p>
      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f} className="btn ghost" aria-pressed={filter === f} onClick={() => go({ view: 'alerts', filter: f })}>
            {f === 'all' ? 'All' : SEV_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="data">
          <thead>
            <tr><th>Status</th><th>Well</th><th>Feature</th><th>Triggered by</th><th>Basis</th><th>Recommended action</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (<tr><td colSpan={6}>No wells match this filter.</td></tr>)}
            {rows.map(({ id, r, w }) => (
              <tr key={id}>
                <td><SeverityBadge level={r.severity} /></td>
                <td>
                  <button className="linkbtn" onClick={() => go({ view: 'field', fieldId: w.field, featureId: w.feature })}>
                    {r.asset.name}
                  </button>
                  <div className="caption" style={{ fontStyle: 'normal' }}>{fieldById[w.field].name}</div>
                </td>
                <td>{featureById[w.feature].short}</td>
                <td>
                  {r.anomalyFlags.length === 0 ? '—' : r.anomalyFlags.map((f, i) => (
                    <div key={i}><strong>{f.metric}</strong>: {f.deviation}</div>
                  ))}
                </td>
                <td>{BASIS_LABEL[r.basis]}{r.usingUserData && <div><EvidenceTag type="user-entered" /></div>}</td>
                <td>{r.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
