import { useState } from 'react';
import { useModel } from '../data/model.js';
import { SCHEMAS } from '../data/schemas.js';
import { SeverityBadge, SEV_LABEL, BASIS_LABEL, EvidenceTag } from './Severity.jsx';
import DataEditor from './DataEditor.jsx';
import {
  SalakSteamChart, GeochemChart, EnthalpyFlowChart, PTProfileChart, ChlorideSulfateChart, DrynessChart, SuperheatChart,
} from './Charts.jsx';

const ANOMALY_TITLE = {
  production_decline: 'Production decline',
  boiling_dryness_increase: 'Reservoir boiling / increasing dryness',
  injection_breakthrough: 'Injectate chemical breakthrough',
  casing_leak_cold_influx: 'Casing defect / cold water influx',
  superheat_rise: 'Sustained superheat rise (steam-supply signal)',
  none: 'No anomaly detected',
};

function Charts({ diagnosis, asset, using }) {
  if (diagnosis === 'salak')
    return (
      <div className="panel">
        <h2>Steam rate vs calibrated hydraulic model</h2>
        <div className="sub"><EvidenceTag type="digitized" /></div>
        <SalakSteamChart asset={asset} />
      </div>
    );
  if (diagnosis === 'silangkitang')
    return (
      <div className="grid2">
        <div className="panel"><h2>Geochemical response</h2><div className="sub"><EvidenceTag type="digitized" /></div><GeochemChart asset={asset} /></div>
        <div className="panel"><h2>Enthalpy & flow rate</h2><div className="sub"><EvidenceTag type="digitized" /></div><EnthalpyFlowChart asset={asset} /></div>
      </div>
    );
  if (diagnosis === 'lahendong')
    return (
      <div className="grid2">
        <div className="panel"><h2>Chloride & sulfate</h2><div className="sub"><EvidenceTag type="quoted" /></div><ChlorideSulfateChart asset={asset} /></div>
        <div className="panel"><h2>Dryness</h2><div className="sub"><EvidenceTag type="digitized" /></div><DrynessChart asset={asset} /></div>
      </div>
    );
  if (diagnosis === 'superheat')
    return (
      <div className="panel">
        <h2>Surface superheat vs the pad’s own baseline</h2>
        <div className="sub"><EvidenceTag type={using ? 'user-entered' : asset.superheatSeries?.evidence} /></div>
        <SuperheatChart asset={asset} />
        {!using && asset.superheatSeries?.note && <p className="caption">{asset.superheatSeries.note}</p>}
      </div>
    );
  if (diagnosis === 'ulubelu')
    return (
      <div className="panel">
        <h2>Downhole PT profile</h2>
        <div className="sub"><EvidenceTag type="digitized" /></div>
        <PTProfileChart asset={asset} />
      </div>
    );
  return null;
}

function eventsFor(asset) {
  const list =
    asset.productionHistory?.points ??
    asset.geochemicalHistory?.points ??
    asset.eventLog?.points ??
    [];
  return list.filter((e) => e.eventLabel).slice().reverse();
}

function SourceFacts({ asset }) {
  const facts = [
    ['Depth', asset.depth != null ? `${asset.depth} m` : null, asset.depthNote || asset.depthEstimateNote],
    ['Rock type', asset.rockType, asset.rockTypeNote],
    ['Temperature', asset.currentTemp != null ? `${asset.currentTemp} °C` : null, asset.currentTempNote],
    ['WHP', asset.currentWHP != null ? `${asset.currentWHP} psi` : null, asset.currentWHPNote || asset.pressureNote],
  ];
  return (
    <table className="data">
      <tbody>
        {facts.map(([k, v, note]) => (
          <tr key={k}>
            <th style={{ width: 120 }}>{k}</th>
            <td>{v ?? <span className="tag">No data</span>}{note && <div className="caption">{note}</div>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DiagnosticPanel({ wellId, result, userEntry, onSaveUser, onToggleUser, onDeleteUser }) {
  const [editing, setEditing] = useState(false);
  const well = useModel().wells[wellId];
  const { asset } = result;
  const schema = SCHEMAS[well.diagnosis];
  const using = result.usingUserData;
  const level = result.severity;

  return (
    <div>
      <div className={`panel status ${level}`}>
        <SeverityBadge level={level} />
        <div>
          <div className="big">
            {result.hasAnomaly ? ANOMALY_TITLE[result.anomalyType] : result.computedSeverity === 'nodata' ? 'Not enough data to diagnose' : ANOMALY_TITLE.none}
          </div>
          {result.illustrative && (
            <div className="well">
              Rule result on this demo series: <strong>{SEV_LABEL[result.computedSeverity]}</strong>. It is not counted as an alert. Enter logged values to run it on real data.
            </div>
          )}
          <div className="well">{asset.name} — {asset.location}</div>
          <div className="basis">{BASIS_LABEL[result.basis]}</div>
          <div className="basis">Running on {using ? <EvidenceTag type="user-entered" /> : result.illustrative ? <EvidenceTag type="illustrative" /> : 'paper data'}</div>
        </div>
        <div className="actions">
          {schema.length > 0 && (
            <div className="seg" aria-label="Data source">
              <button aria-pressed={!using} onClick={() => onToggleUser(false)}>Paper data</button>
              <button aria-pressed={using} disabled={!userEntry} onClick={() => onToggleUser(true)} title={userEntry ? '' : 'Enter your data first'}>
                My data
              </button>
            </div>
          )}
          <button className="btn" onClick={() => setEditing((e) => !e)}>{editing ? 'Hide data input' : 'Enter your data'}</button>
          {userEntry && (
            <button className="btn ghost" onClick={() => { if (window.confirm('Delete your data for this well? Paper data is not affected.')) onDeleteUser(); }}>
              Delete my data
            </button>
          )}
        </div>
      </div>

      {editing && (
        <DataEditor
          schema={schema}
          paperAsset={well.asset}
          saved={userEntry}
          onSave={(tables) => onSaveUser(tables)}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="grid2">
        <div className="panel">
          <h2>What triggered this</h2>
          <div className="sub">Each flag compares the well only with its own earlier record.</div>
          {result.anomalyFlags.length === 0 && <p>No flags. {level === 'nodata' ? 'Add data to run the diagnosis.' : ''}</p>}
          {result.anomalyFlags.map((f, i) => (
            <div className="flag" key={i}>
              <div className="metric">{f.metric}</div>
              <div className="dev">{f.deviation}</div>
              <div className="vals">
                <div><span>Latest</span>{f.value}</div>
                <div><span>Baseline</span>{f.baseline}</div>
              </div>
              {f.interpretation && <div className="interp">{f.interpretation}</div>}
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Recommended action</h2>
          {result.illustrative ? (
            <p className="reco">No action — demo data. On real data, the rule would say: <em>{result.recommendation}</em></p>
          ) : (
            <p className="reco">{result.recommendation}</p>
          )}
          <h2 style={{ marginTop: 16 }}>Rule parameters</h2>
          {result.rules.length === 0 ? (
            <p className="sub">No rule — this status is the paper’s own conclusion.</p>
          ) : (
            <>
              <div className="sub">These thresholds are LithoHub rule parameters, not values from the paper.</div>
              <table className="data">
                <tbody>
                  {result.rules.map((r) => (
                    <tr key={r.key}>
                      <td><SeverityBadge level={r.level}>{SEV_LABEL[r.level]}</SeverityBadge></td>
                      <td><strong>{r.value}</strong> {r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <Charts diagnosis={well.diagnosis} asset={asset} using={using} />

      <div className="grid2">
        {eventsFor(asset).length > 0 && (
          <div className="panel events">
            <h2>Event log</h2>
            <div className="sub">Newest first</div>
            {eventsFor(asset).map((e, i) => (
              <div className="ev" key={i}>
                <div className="d">{e.date}</div>
                <div>
                  <div className="l">{e.eventLabel}</div>
                  {e.eventDescription && <div>{e.eventDescription}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {well.diagnosis !== 'superheat' && <div className="panel">
          <h2>Well facts</h2>
          <div className="sub">Field-level values are labeled; empty means the source does not report it.</div>
          <SourceFacts asset={well.asset} />
        </div>}
      </div>

      <div className="panel">
        <h2>Source</h2>
        <p className="cite">{well.asset.source}</p>
      </div>
    </div>
  );
}
