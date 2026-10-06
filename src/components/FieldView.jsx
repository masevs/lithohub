import { useModel } from '../data/model.js';
import { FEATURES, featureById } from '../data/features.js';
import { SeverityBadge } from './Severity.jsx';
import DiagnosticPanel from './DiagnosticPanel.jsx';
import F1View from '../views/F1View.jsx';
import F2View from '../views/F2View.jsx';
import { F3Facts, F3Context } from '../views/F3View.jsx';
import F4View from '../views/F4View.jsx';

const STATE_TEXT = { pending: 'Pending', demo: 'Demo data' };

function WellPanels({ field, feature, results, user }) {
  const { wells } = useModel();
  return field.wells
    .filter((id) => wells[id].feature === feature.id)
    .map((id) => (
      <DiagnosticPanel
        key={id}
        wellId={id}
        result={results[id]}
        userEntry={user.data[id]}
        onSaveUser={(tables) => user.save(id, tables)}
        onToggleUser={(on) => user.toggle(id, on)}
        onDeleteUser={() => user.remove(id)}
      />
    ));
}

function FeatureContent({ field, feature, results, user }) {
  const wells = <WellPanels field={field} feature={feature} results={results} user={user} />;
  switch (feature.id) {
    case 'f1': return <F1View field={field} />;
    case 'f2': return <F2View field={field} />;
    case 'f3':
      return (
        <>
          <F3Facts field={field} />
          {wells}
          <F3Context field={field} />
        </>
      );
    case 'f4': return <F4View field={field} />;
    case 'f6':
      return (
        <>
          {wells}
          <div className="panel pending">
            <h2>Ternary & isotope plots</h2>
            <p>Not built yet. They need per-sample Cl, SO₄, HCO₃, Na, K, Mg and δ¹⁸O / δ²H values in the data files. LithoHub does not show placeholder data.</p>
          </div>
        </>
      );
    default: return wells;
  }
}

export default function FieldView({ fieldId, featureId, results, user, go, fieldStatus }) {
  const field = useModel().fieldById[fieldId];
  const feature = featureById[featureId] ?? FEATURES.find((f) => field.features[f.id]);

  return (
    <div>
      <div className="field-head">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1>{field.name}</h1>
          <SeverityBadge level={fieldStatus[field.id]} />
        </div>
        <div className="meta">{field.region}, Indonesia</div>
        <div className="coord">Map location: {field.coordinateNote}</div>
        <div className="tabs" role="tablist" aria-label="Features">
          {FEATURES.map((f) => {
            const st = field.features[f.id];
            return (
              <button key={f.id} role="tab" className="tab" aria-selected={feature.id === f.id} disabled={!st}
                onClick={() => go({ view: 'field', fieldId, featureId: f.id })}>
                {f.short}
                {!st ? <span className="tstate">No data</span> : STATE_TEXT[st] ? <span className="tstate">{STATE_TEXT[st]}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="feature-body">
        <h2 className="feature-title">{feature.name}</h2>
        {feature.builtNote && <div className="note">{feature.builtNote}</div>}
        <FeatureContent field={field} feature={feature} results={results} user={user} />
      </div>
    </div>
  );
}
