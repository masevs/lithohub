// Feature 1 — Well location & feed-zone viewer (rebuilt from the F1 prototype).
// All values come from fields.json → <field>.features.f1.
import { useState } from 'react';
import DatasetPanel from '../components/Dataset.jsx';
import { useChart, Box, base, axis } from '../components/Charts.jsx';

// Temperature color scale from the prototype (cool blue → hot red).
const STOPS = [
  { t: 100, c: [59, 126, 161] }, { t: 180, c: [79, 184, 168] }, { t: 230, c: [232, 178, 60] },
  { t: 270, c: [232, 130, 60] }, { t: 310, c: [212, 69, 58] },
];
export function tempColor(t) {
  if (t <= STOPS[0].t) return `rgb(${STOPS[0].c})`;
  if (t >= STOPS[STOPS.length - 1].t) return `rgb(${STOPS[STOPS.length - 1].c})`;
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i], b = STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return `rgb(${a.c.map((v, k) => Math.round(v + (b.c[k] - v) * f))})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1].c})`;
}

/* ---------------- Sibayak ---------------- */
function SibayakChart({ wells, selected, onSelect }) {
  const ref = useChart(
    {
      type: 'scatter',
      data: {
        datasets: wells.map((w) => ({
          label: w.id,
          data: [{ x: w.tempTDC, y: w.tvdM }, { x: w.maxTempC, y: w.maxTempDepthM }],
          showLine: true,
          borderColor: tempColor(w.maxTempC),
          backgroundColor: tempColor(w.maxTempC),
          borderWidth: selected === w.id ? 3.5 : 1.5,
          pointRadius: selected === w.id ? 6 : 4,
        })),
      },
      options: {
        ...base({
          x: axis('Temperature (°C)', { min: 80, max: 320 }),
          y: axis('Depth (m) — see column note', { reverse: true, min: 0, max: 2200 }),
        }),
        onClick: (_, els) => els[0] && onSelect(wells[els[0].datasetIndex].id),
        plugins: { legend: { display: false } },
      },
    },
    [selected]
  );
  return <Box canvasRef={ref} caption="Each well: two points joined by a straight line — not a P-T profile. Click a line to select the well." />;
}

function Sibayak({ f1 }) {
  const wells = f1.wells.wells;
  const [sel, setSel] = useState(null);
  const w = wells.find((x) => x.id === sel);
  const show = (v, unit) => (v == null ? <span className="tag">Not reported</span> : `${v}${unit}`);
  return (
    <>
      <div className="grid2">
        <DatasetPanel title="Temperature vs depth — 10 wells" ds={f1.wells}>
          <SibayakChart wells={wells} selected={sel} onSelect={setSel} />
          <p className="caption" style={{ fontStyle: 'normal' }}>{f1.wells.columnNote}</p>
        </DatasetPanel>
        <div className="panel">
          <h2>{w ? w.id : 'Well detail'}</h2>
          {!w && <p className="sub">Select a well in the table or the chart.</p>}
          {w && (
            <table className="data">
              <tbody>
                <tr><th>Type</th><td>{w.type}</td></tr>
                <tr><th>Wellpad elevation</th><td>{show(w.elevM, ' m ASL')}</td></tr>
                <tr><th>Total depth (TVD)</th><td>{show(w.tvdM, ' m')}</td></tr>
                <tr><th>Temp at TD</th><td>{show(w.tempTDC, ' °C')}</td></tr>
                <tr><th>Max temp</th><td>{w.maxTempC} °C @ {w.maxTempDepthM} m MD</td></tr>
                <tr><th>Steam flow (2005)</th><td>{show(w.steam2005Tph, ' t/h')}</td></tr>
                <tr><th>Output (2005)</th><td>{show(w.mwe2005, ' MWe')}</td></tr>
                <tr><th>Injectivity index</th><td>{show(w.injectivityKgSBar, ' kg/s·bar')}</td></tr>
              </tbody>
            </table>
          )}
          {w?.note && <div className="note">{w.note}</div>}
        </div>
      </div>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <h2>Well table</h2>
        <table className="data">
          <thead>
            <tr><th>Well</th><th>Type</th><th>Elev (m ASL)</th><th>TVD (m)</th><th>T @ TD (°C)</th><th>T max (°C)</th><th>Steam 2005 (t/h)</th><th>Injectivity (kg/s·bar)</th></tr>
          </thead>
          <tbody>
            {wells.map((x) => (
              <tr key={x.id} className={`selectable ${sel === x.id ? 'selected' : ''}`} onClick={() => setSel(x.id)}>
                <td><strong>{x.id}</strong></td><td>{x.type}</td><td>{x.elevM}</td><td>{x.tvdM}</td>
                <td>{x.tempTDC ?? '—'}</td><td>{x.maxTempC}</td><td>{x.steam2005Tph ?? '—'}</td><td>{x.injectivityKgSBar ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid2">
        <DatasetPanel title="Source discrepancies" ds={f1.discrepancies}>
          {f1.discrepancies.items.map((d) => (
            <div className="discrepancy" key={d.well}>
              <strong>{d.well} — {d.topic}</strong>
              {d.records.map((r) => (
                <div key={r.source}>{r.source}{r.period ? ` (${r.period})` : ''}: {r.value}</div>
              ))}
              <div className="caption" style={{ fontStyle: 'normal' }}>{d.resolution}</div>
            </div>
          ))}
        </DatasetPanel>
        <DatasetPanel title="Verified fault structures" ds={f1.faults}>
          <ul>{f1.faults.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </DatasetPanel>
      </div>
    </>
  );
}

/* ---------------- Salak ---------------- */
function Section({ s }) {
  const W = 760, H = 330, pad = { l: 24, r: 24 };
  const w = W - pad.l - pad.r;
  const sx = (v) => pad.l + (v / s.axisMax) * w;
  const ground = 56, cellTop = 92, cellBottom = 280, wellBottom = 210;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Schematic ${s.title}`}>
      {s.cells.map((c) => (
        <g key={c.name}>
          <rect x={sx(c.from)} y={cellTop} width={sx(c.to) - sx(c.from)} height={cellBottom - cellTop} fill={tempColor(c.displayTempC)} opacity="0.55" />
          <text x={(sx(c.from) + sx(c.to)) / 2} y={cellBottom - 30} textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e2a2f">{c.name}</text>
          <text x={(sx(c.from) + sx(c.to)) / 2} y={cellBottom - 13} textAnchor="middle" fontSize="12" fill="#1e2a2f">{c.tempRangeC} °C</text>
        </g>
      ))}
      <line x1={pad.l} y1={ground} x2={W - pad.r} y2={ground} stroke="#4a565c" strokeWidth="1.5" />
      <text x={W - pad.r} y={ground - 8} textAnchor="end" fontSize="11" fill="#4a565c">Surface</text>
      {s.wells.map((wl) => (
        <g key={wl.id}>
          <line x1={sx(wl.x)} y1={ground} x2={sx(wl.x)} y2={wellBottom} stroke="#1e2a2f" strokeWidth="2" />
          <circle cx={sx(wl.x)} cy={ground} r="4" fill="#1e2a2f" />
          <text x={sx(wl.x)} y={ground - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1e2a2f">{wl.id}</text>
        </g>
      ))}
      {[0, 2000, 4000, 6000, 8000].filter((v) => v <= s.axisMax).map((v) => (
        <text key={v} x={sx(v)} y={cellBottom + 18} textAnchor="middle" fontSize="10.5" fill="#7b858a">{v}</text>
      ))}
      <text x={W / 2} y={cellBottom + 38} textAnchor="middle" fontSize="10.5" fill="#7b858a">Horizontal position (figure axis units — not stated in the paper)</text>
    </svg>
  );
}

function Salak({ f1 }) {
  const secs = f1.crossSections.sections;
  const [id, setId] = useState(secs[0].id);
  const s = secs.find((x) => x.id === id);
  const p = f1.singleWellProfile;
  return (
    <div className="grid2">
      <DatasetPanel title="Cross-sections with named wells" ds={f1.crossSections} wide>
        <div className="seg" style={{ marginBottom: 10 }}>
          {secs.map((x) => <button key={x.id} aria-pressed={x.id === id} onClick={() => setId(x.id)}>{x.title}</button>)}
        </div>
        <div className="xsec-wrap"><Section s={s} /></div>
      </DatasetPanel>
      <DatasetPanel title={`Single-well profile — ${p.well}`} ds={p}>
        <table className="data">
          <tbody>
            <tr><th>Total depth</th><td>{p.totalDepth.md.toLocaleString()} m MD ({p.totalDepth.bslM.toLocaleString()} m BSL)</td></tr>
            {p.feedZones.map((z) => (
              <tr key={z.name}><th>{z.name}</th><td>{z.mdM != null ? `${z.mdM.toLocaleString()} m MD` : `${z.mdFromM.toLocaleString()}–${z.mdToM.toLocaleString()} m MD`}</td></tr>
            ))}
            <tr><th>Temperature @ FZ3</th><td>~{p.atDeepestFeedZone.tempC} °C</td></tr>
            <tr><th>Pressure @ FZ3</th><td>~{p.atDeepestFeedZone.pressureBarg} barg</td></tr>
            <tr><th>Enthalpy @ FZ3</th><td>~{p.atDeepestFeedZone.enthalpyKjKg.toLocaleString()} kJ/kg</td></tr>
          </tbody>
        </table>
      </DatasetPanel>
      <DatasetPanel title="Feed-zone point cloud" ds={f1.feedZoneCloud} />
      <DatasetPanel title="3D well trajectories" ds={f1.trajectory3d} />
    </div>
  );
}

export default function F1View({ field }) {
  const f1 = field.data.f1;
  if (field.id === 'sibayak') return <Sibayak f1={f1} />;
  if (field.id === 'salak') return <Salak f1={f1} />;
  return <p>No Feature 1 view for this field yet.</p>;
}
