// Feature 4 — Integrated cross-section generator (rebuilt from the F4 prototype).
// The two schematic drawings are reused unchanged; all hover text and tables come from
// fields.json → <field>.features.f4.
import { useEffect, useRef, useState } from 'react';
import DatasetPanel from '../components/Dataset.jsx';
import silSvg from './f4/silangkitang-xsec.svg?raw';
import lhdSvg from './f4/lahendong-xsec.svg?raw';

// Hover tooltips over elements carrying data-<attr> in the drawing.
// The SVG is inserted once, and the mouse is tracked on the wrapper (event delegation),
// so re-renders never detach the hover behavior.
function Drawing({ svg, attr, lookup, highlight }) {
  const wrap = useRef(null);
  const holder = useRef(null);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    holder.current.innerHTML = svg;
  }, [svg]);

  useEffect(() => {
    holder.current.querySelectorAll(`[data-${attr}]`).forEach((el) => {
      el.style.opacity = !highlight || highlight.includes(el.getAttribute(`data-${attr}`)) ? '1' : '0.25';
    });
  }, [svg, attr, highlight]);

  const onMove = (e) => {
    const target = e.target.closest?.(`[data-${attr}]`);
    const d = target && lookup(target.getAttribute(`data-${attr}`));
    if (!d) return setTip(null);
    const r = wrap.current.getBoundingClientRect();
    let x = e.clientX - r.left + 14;
    if (x + 270 > r.width) x = e.clientX - r.left - 274;
    setTip({ ...d, x, y: e.clientY - r.top + 14 });
  };

  return (
    <div className="xsec-wrap f4-drawing" ref={wrap} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
      <div ref={holder} />
      {tip && (
        <div className="xsec-tip" style={{ left: tip.x, top: tip.y }}>
          <b>{tip.title}</b>{tip.body}
        </div>
      )}
    </div>
  );
}

function Silangkitang({ f4 }) {
  const m = f4.fluidModel;
  const [hl, setHl] = useState(null);
  const lookup = (k) => m.fluids[k] && { title: m.fluids[k].name, body: m.fluids[k].detail };
  return (
    <div className="grid2">
      <DatasetPanel title="Hydrogeochemical cross-section" ds={m} wide>
        <div className="note grey">{m.scopeNote}</div>
        <Drawing svg={silSvg} attr="fluid" lookup={lookup} highlight={hl} />
        <div className="stats" style={{ marginTop: 12 }}>
          {Object.entries(m.fluids).map(([k, f]) => (
            <div className="stat" key={k}><div className="k">{k}</div><div style={{ fontWeight: 600 }}>{f.name}</div><div className="k">{f.role}</div></div>
          ))}
        </div>
      </DatasetPanel>
      <div className="panel">
        <h2>Fluid ranking</h2>
        <div className="sub">Ordinal only. Hover a row to highlight the fluids it compares.</div>
        <table className="data">
          <tbody>
            {m.relations.map((r) => (
              <tr key={r.expr} className={`ord-row ${hl === r.fluids ? 'on' : ''}`} onMouseEnter={() => setHl(r.fluids)} onMouseLeave={() => setHl(null)}>
                <td style={{ whiteSpace: 'nowrap' }}><strong>{r.expr}</strong></td><td>{r.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DatasetPanel title="Dynamic slicing" ds={f4.slicing} />
    </div>
  );
}

function Lahendong({ f4 }) {
  const x = f4.crossSection;
  const lookup = (k) => {
    const w = x.wells.find((v) => v.svgId === k);
    return w && { title: `${w.well} — ${w.dryness} dryness`, body: w.detail };
  };
  const cl = (w) => (w.cl2012 == null ? '—' : `${w.cl2012} → ${w.cl2018}`);
  return (
    <div className="grid2">
      <DatasetPanel title="Southern reservoir cross-section" ds={x} wide>
        <Drawing svg={lhdSvg} attr="well" lookup={lookup} />
        <div className="sub" style={{ marginTop: 10 }}>
          {Object.entries(x.groups).map(([k, v]) => <div key={k}>{v}</div>)}
        </div>
      </DatasetPanel>
      <div className="panel" style={{ overflowX: 'auto' }}>
        <h2>Well readings</h2>
        <table className="data">
          <thead><tr><th>Well</th><th>Dryness trend</th><th>Cl 2012 → 2018 (mg/l)</th><th>Reading</th></tr></thead>
          <tbody>
            {x.wells.map((w) => (
              <tr key={w.well}><td><strong>{w.well}</strong></td><td>{w.dryness}</td><td>{cl(w)}</td><td>{w.reading}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h2>Source caveats — read before treating as fact</h2>
        {x.caveats.map((c) => (
          <div className="discrepancy" key={c.title}><strong>{c.title}</strong><div>{c.text}</div></div>
        ))}
      </div>
    </div>
  );
}

export default function F4View({ field }) {
  const f4 = field.data.f4;
  if (field.id === 'silangkitang') return <Silangkitang f4={f4} />;
  if (field.id === 'lahendong') return <Lahendong f4={f4} />;
  return <p>No Feature 4 view for this field yet.</p>;
}
