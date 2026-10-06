// Feature 2 — Structural modeling & effective fracture filter (rebuilt from the F2 prototype).
// All values come from fields.json → <field>.features.f2.
import { useState } from 'react';
import DatasetPanel from '../components/Dataset.jsx';
import { useChart, Box, base, axis } from '../components/Charts.jsx';
import { binStrikes, gaussianLobe, polarToXY } from './structural.js';

function RoseDiagram({ bins, size = 220, color = '#d9540b', dashed = false, maxOverride, label }) {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 26;
  const max = maxOverride || Math.max(...bins.map((b) => b.v), 1);
  const step = 360 / bins.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={maxR * f} fill="none" stroke="#d9dcd6" strokeDasharray={dashed ? '2 3' : undefined} />
      ))}
      {[0, 45, 90, 135].map((deg) => {
        const p0 = polarToXY(cx, cy, maxR, deg), p1 = polarToXY(cx, cy, maxR, deg + 180);
        return <line key={deg} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#d9dcd6" />;
      })}
      {bins.map((b, i) => {
        const r = (b.v / max) * maxR;
        const p0 = polarToXY(cx, cy, r, i * step - step / 2), p1 = polarToXY(cx, cy, r, i * step + step / 2);
        return (
          <path key={i} d={`M${cx},${cy} L${p0.x.toFixed(2)},${p0.y.toFixed(2)} A${r},${r} 0 0 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)} Z`}
            fill={color} fillOpacity={dashed ? 0.35 : 0.6} stroke={color} strokeWidth={dashed ? 1 : 0.75} strokeDasharray={dashed ? '2 2' : undefined} />
        );
      })}
      {['N', 'E', 'S', 'W'].map((l, i) => {
        const p = polarToXY(cx, cy, maxR + 14, i * 90);
        return <text key={l} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fill="#4a565c">{l}</text>;
      })}
    </svg>
  );
}

const Stat = ({ k, v, unit }) => (
  <div className="stat"><div className="k">{k}</div><div className="v">{v}{unit && <small>{unit}</small>}</div></div>
);

function Bars({ rows, max }) {
  return rows.map((r) => (
    <div className="bar-row" key={r.label}>
      <div className="lbl"><span>{r.label}</span><strong>{r.text}</strong></div>
      {r.sub && <div className="caption" style={{ marginTop: 0, fontStyle: 'normal' }}>{r.sub}</div>}
      <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
    </div>
  ));
}

/* ---------------- Salak ---------------- */
function PIChart({ ds }) {
  const ref = useChart(
    {
      type: 'line',
      data: { datasets: [{ label: 'Cumulative % (reconstructed shape)', data: ds.points.map((p) => ({ x: p.pi, y: p.cum })), borderColor: '#d9540b', backgroundColor: '#d9540b', borderDash: [5, 4], pointRadius: 3, tension: 0.3 }] },
      options: base({
        x: axis(`PI′ (${ds.unit})`, { type: 'logarithmic', min: 0.0001, max: 0.01, ticks: { callback: (v) => Number(v).toExponential(0) } }),
        y: axis('Cumulative % of volume', { min: 0, max: 100 }),
      }),
    },
    []
  );
  return <Box canvasRef={ref} />;
}

function Salak({ f2 }) {
  const [effective, setEffective] = useState(false);
  const s = f2.fractureStats, rose = f2.fractureRose;
  const bins = gaussianLobe(effective ? rose.effective : rose.open);
  return (
    <div className="grid2">
      <DatasetPanel title="Effective fracture population" ds={s} wide>
        <div className="rose-row">
          <div>
            <RoseDiagram bins={bins} dashed size={220} maxOverride={rose.displayMax} label="Reconstructed fracture strike lobe" />
            <div style={{ marginTop: 6 }}><span className="tag reconstructed">Reconstructed shape — {rose.method}</span></div>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="seg" style={{ marginBottom: 12 }}>
              <button aria-pressed={!effective} onClick={() => setEffective(false)}>All open fractures ({s.openFractures.toLocaleString()})</button>
              <button aria-pressed={effective} onClick={() => setEffective(true)}>Feed-zone effective (~{s.effectiveFractures.value})</button>
            </div>
            <div className="stats">
              <Stat k="Wells logged (in boundary)" v={s.wellsInBoundary} unit={`/ ${s.wellsTotal} total`} />
              <Stat k="Cumulative log length" v={s.cumulativeLogLengthM.toLocaleString()} unit="m" />
              <Stat k="S_Hmax orientation" v={s.sHmaxLabel} />
              <Stat k="Correlated to feed zones" v={`~${s.correlatedToFeedZonesPercent.value}`} unit="% of open fractures" />
            </div>
            <p className="caption">{rose.note} Source of the lobe statistics: {rose.source}.</p>
          </div>
        </div>
      </DatasetPanel>
      <DatasetPanel title="Directional permeability anisotropy" ds={f2.permeabilityAnisotropy}>
        <Bars max={2.5} rows={f2.permeabilityAnisotropy.values.map((v) => ({ label: v.label, value: v.ratio, text: `${v.ratio.toFixed(1)}×` }))} />
      </DatasetPanel>
      <DatasetPanel title="MEQ-derived base of reservoir" ds={f2.meqReservoirBase}>
        <table className="data">
          <tbody>
            {f2.meqReservoirBase.zones.map((z) => (
              <tr key={z.zone}><th>{z.zone}</th><td>{z.top} to {z.base} {f2.meqReservoirBase.unit}<div className="caption" style={{ fontStyle: 'normal' }}>{z.note}</div></td></tr>
            ))}
          </tbody>
        </table>
      </DatasetPanel>
      <DatasetPanel title="Feed-zone productivity index (PI′)" ds={f2.productivityIndex} wide>
        <PIChart ds={f2.productivityIndex} />
      </DatasetPanel>
      <DatasetPanel title="Well-trajectory alignment checker" ds={f2.trajectoryChecker} />
      <DatasetPanel title="Critically-stressed fracture engine (Mohr-Coulomb)" ds={f2.mohrCoulomb} />
    </div>
  );
}

/* ---------------- Lahendong ---------------- */
function CompartmentChart({ ds }) {
  const line = ds.referenceLineEcUsCm.value;
  const ref = useChart(
    {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Wells (2018)', data: ds.wells.map((w) => ({ x: w.pH, y: w.ecUsCm, well: w.well })), backgroundColor: '#d9540b', pointRadius: 6 },
          { label: `${line} µS/cm reference line (unsourced)`, data: [{ x: 4, y: line }, { x: 9, y: line }], showLine: true, borderColor: '#7b858a', borderDash: [4, 3], pointRadius: 0 },
        ],
      },
      options: {
        ...base({ x: axis('pH', { min: 4, max: 9 }), y: axis('EC (µS/cm)') }),
        plugins: { legend: { labels: { font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => (c.raw.well ? `${c.raw.well}: pH ${c.raw.x}, EC ${c.raw.y}` : '') } } },
      },
    },
    []
  );
  return <Box canvasRef={ref} caption={ds.referenceLineEcUsCm.note} />;
}

function ForecastChart({ ds }) {
  const colors = ['#d9540b', '#0f8a74'];
  const ref = useChart(
    {
      type: 'scatter',
      data: {
        datasets: ds.wells.map((w, i) => ({
          label: `${w.well} (${w.cluster})`,
          data: [{ x: w.start.years, y: w.start.tempC }, { x: w.end.years, y: w.end.tempC }],
          showLine: true, borderColor: colors[i], backgroundColor: colors[i], borderDash: [6, 4], pointRadius: 5,
        })),
      },
      options: base({ x: axis('Years of production', { min: 0, max: 36 }), y: axis('Reservoir temperature (°C)', { min: 230, max: 290 }) }),
    },
    []
  );
  return <Box canvasRef={ref} caption="Points = source values. Dashed line = connection for reading, not a model curve." />;
}

function Lahendong({ f2 }) {
  const fs = f2.faultStrikes;
  const counts = ['West', 'North', 'East'].map((r) => `${r} n=${fs.faults.filter((x) => x.region === r).length}`).join(', ');
  return (
    <div className="grid2">
      <DatasetPanel title={`Fault strike distribution — ${fs.faults.length} field observations`} ds={fs}>
        <div className="rose-row">
          <RoseDiagram bins={binStrikes(fs.faults.map((x) => x.strike))} color="#0f8a74" label="Fault strike rose diagram" />
          <p className="sub" style={{ flex: 1, minWidth: 160 }}>Every bar is a mapped fault. Regions: {counts}.</p>
        </div>
      </DatasetPanel>
      <DatasetPanel title="Geochemical compartments" ds={f2.compartments}>
        <CompartmentChart ds={f2.compartments} />
      </DatasetPanel>
      <DatasetPanel title="Poisson's ratio by formation" ds={f2.poissonRatio}>
        <Bars max={0.5} rows={f2.poissonRatio.formations.map((f) => ({ label: f.name, value: f.nu, text: `ν = ${f.nu.toFixed(2)}`, sub: `${f.topM}–${f.baseM} m depth` }))} />
      </DatasetPanel>
      <DatasetPanel title="Thermal drawdown forecast" ds={f2.thermalForecast}>
        <ForecastChart ds={f2.thermalForecast} />
      </DatasetPanel>
    </div>
  );
}

/* ---------------- Sibayak ---------------- */
function Sibayak({ f2 }) {
  return (
    <div className="grid2">
      <DatasetPanel title="Named structures" ds={f2.namedStructures}>
        <ul>{f2.namedStructures.items.map((x) => <li key={x}>{x}</li>)}</ul>
      </DatasetPanel>
      <DatasetPanel title="Structural and fracture panels" ds={f2.allPanels} />
    </div>
  );
}

export default function F2View({ field }) {
  const f2 = field.data.f2;
  if (field.id === 'salak') return <Salak f2={f2} />;
  if (field.id === 'lahendong') return <Lahendong f2={f2} />;
  if (field.id === 'sibayak') return <Sibayak f2={f2} />;
  return <p>No Feature 2 view for this field yet.</p>;
}
