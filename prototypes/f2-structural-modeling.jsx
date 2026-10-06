import React, { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ZAxis
} from "recharts";
import {
  Mountain, Waves, Thermometer, Flame, GitBranch, Compass,
  AlertTriangle, CheckCircle2, HelpCircle, ChevronRight, Layers
} from "lucide-react";

/* ---------------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------------- */
const C = {
  bg: "#12100E",
  bgPanel: "#1A1613",
  bgPanelAlt: "#201B17",
  bgInset: "#0D0B09",
  hairline: "#332C25",
  hairlineSoft: "#241F1A",
  ember: "#E0703A",
  emberDim: "#7A4128",
  mineral: "#4FA6A6",
  mineralDim: "#2C5A5A",
  slate: "#6E7873",
  textPrimary: "#EFE9E0",
  textSecondary: "#B4A99B",
  textMuted: "#7C7264",
  tierA1: "#4E9B6C",
  tierA2: "#4FA6A6",
  tierB: "#D1A24A",
  tierC: "#6E655A",
};

const TIER_DEF = {
  A1: { label: "A1 — direct measurement", color: C.tierA1, desc: "Instrumented field data (wellbore, borehole log, tracer)." },
  A2: { label: "A2 — kinematic inference", color: C.tierA2, desc: "Derived from geometric/structural interpretation, not instrument-measured." },
  B: { label: "B — cross-validated correlation", color: C.tierB, desc: "Pattern confirmed across two or more independent studies." },
  C: { label: "C — placeholder / pending", color: C.tierC, desc: "Not yet supported by available published data." },
};

function TierBadge({ tier }) {
  const t = TIER_DEF[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${t.color}1F`, color: t.color, border: `1px solid ${t.color}55` }}
      title={t.desc}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
      {tier}
    </span>
  );
}

function Cite({ children }) {
  return <span className="text-[11px]" style={{ color: C.textMuted }}>{children}</span>;
}

function Panel({ title, subtitle, tier, children, accent = C.ember }) {
  return (
    <div
      className="rounded-sm"
      style={{ backgroundColor: C.bgPanel, border: `1px solid ${C.hairline}`, borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: C.textPrimary }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: C.textSecondary }}>{subtitle}</p>}
        </div>
        {tier && <TierBadge tier={tier} />}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit, color = C.textPrimary }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: C.textMuted, letterSpacing: "0.06em" }}>{label}</div>
      <div className="mt-1 font-mono text-[20px] leading-none" style={{ color }}>
        {value}
        {unit && <span className="ml-1 text-[12px]" style={{ color: C.textSecondary }}>{unit}</span>}
      </div>
    </div>
  );
}

function PendingCard({ title, reason }) {
  return (
    <div
      className="rounded-sm px-5 py-4"
      style={{ backgroundColor: C.bgInset, border: `1px dashed ${C.hairline}` }}
    >
      <div className="flex items-center gap-2">
        <HelpCircle size={15} style={{ color: C.tierC }} />
        <span className="text-[13.5px] font-medium" style={{ color: C.textSecondary }}>{title}</span>
        <TierBadge tier="C" />
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.textMuted }}>{reason}</p>
    </div>
  );
}

/* ---------------------------------------------------------------
   ROSE DIAGRAM (shared SVG component)
   mode="measured": bars drawn from real binned strike data
   mode="reconstructed": smooth lobe from qualitative description
--------------------------------------------------------------- */
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RoseDiagram({ bins, size = 220, color = C.mineral, dashed = false, maxOverride }) {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 26;
  const max = maxOverride || Math.max(...bins.map((b) => b.v), 1);
  const rings = [0.25, 0.5, 0.75, 1];
  const step = 360 / bins.length;

  const petals = bins.map((b, i) => {
    const r = (b.v / max) * maxR;
    const a0 = i * step - step / 2;
    const a1 = i * step + step / 2;
    const p0 = polarToXY(cx, cy, r, a0);
    const p1 = polarToXY(cx, cy, r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M${cx},${cy} L${p0.x.toFixed(2)},${p0.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)} Z`;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxR * f} fill="none" stroke={C.hairline} strokeWidth="1" strokeDasharray={dashed ? "2 3" : undefined} />
      ))}
      {[0, 45, 90, 135].map((deg) => {
        const p0 = polarToXY(cx, cy, maxR, deg);
        const p1 = polarToXY(cx, cy, maxR, deg + 180);
        return <line key={deg} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.hairline} strokeWidth="1" />;
      })}
      {petals.map((d, i) => (
        <path key={i} d={d} fill={color} fillOpacity={dashed ? 0.35 : 0.55} stroke={color} strokeWidth={dashed ? 1 : 0.75} strokeDasharray={dashed ? "2 2" : undefined} />
      ))}
      <circle cx={cx} cy={cy} r={2} fill={C.textSecondary} />
      {["N", "E", "S", "W"].map((label, i) => {
        const p = polarToXY(cx, cy, maxR + 14, i * 90);
        return (
          <text key={label} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill={C.textMuted} fontFamily="ui-monospace, monospace">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function binStrikes(strikes, binSize = 10) {
  const nBins = 360 / binSize;
  const bins = Array.from({ length: nBins }, (_, i) => ({ angle: i * binSize, v: 0 }));
  strikes.forEach((s) => {
    [s, s + 180].forEach((a) => {
      const norm = ((a % 360) + 360) % 360;
      const idx = Math.floor(norm / binSize);
      bins[idx].v += 1;
    });
  });
  return bins;
}

function gaussianLobe({ centerDeg, spreadDeg, peak, floor = 0, binSize = 10 }) {
  const nBins = 360 / binSize;
  return Array.from({ length: nBins }, (_, i) => {
    const angle = i * binSize;
    const d1 = Math.min(Math.abs(angle - centerDeg), 360 - Math.abs(angle - centerDeg));
    const d2 = Math.min(Math.abs(angle - (centerDeg + 180)), 360 - Math.abs(angle - (centerDeg + 180)));
    const d = Math.min(d1, d2);
    const v = peak * Math.exp(-(d * d) / (2 * spreadDeg * spreadDeg)) + floor;
    return { angle, v };
  });
}

/* ---------------------------------------------------------------
   DATA — SALAK
--------------------------------------------------------------- */
const salakOpenLobe = gaussianLobe({ centerDeg: 22, spreadDeg: 34, peak: 10, floor: 2.4 });
const salakEffectiveLobe = gaussianLobe({ centerDeg: 22, spreadDeg: 16, peak: 10, floor: 0.3 });

const salakPI = [
  { pi: 0.00014, cum: 2 }, { pi: 0.0003, cum: 6 }, { pi: 0.0007, cum: 14 },
  { pi: 0.0013, cum: 28 }, { pi: 0.002, cum: 45 }, { pi: 0.003, cum: 62 },
  { pi: 0.0045, cum: 78 }, { pi: 0.006, cum: 90 }, { pi: 0.008, cum: 98 },
];

const salakHypocenters = [
  { zone: "West (injection-related)", top: -500, base: -4500, note: "Brine (Awi 9) & condensate (Awi 18/20) injection" },
  { zone: "East (production-related)", top: 500, base: -1000, note: "Steam-cap compaction, shallow feed zones" },
];

/* ---------------------------------------------------------------
   DATA — LAHENDONG (real values, Suherlina et al. 2022, Table 1)
--------------------------------------------------------------- */
const lahendongFaults = [
  { no: 1, region: "West", strike: 100 }, { no: 2, region: "West", strike: 50 },
  { no: 3, region: "West", strike: 130 }, { no: 4, region: "West", strike: 0 },
  { no: 5, region: "West", strike: 80 }, { no: 6, region: "West", strike: 165 },
  { no: 7, region: "North", strike: 150 }, { no: 8, region: "North", strike: 170 },
  { no: 9, region: "North", strike: 50 }, { no: 10, region: "North", strike: 170 },
  { no: 11, region: "East", strike: 5 }, { no: 12, region: "East", strike: 40 },
  { no: 13, region: "East", strike: 51 }, { no: 14, region: "East", strike: 80 },
  { no: 15, region: "East", strike: 350 }, { no: 16, region: "East", strike: 225 },
  { no: 17, region: "East", strike: 200 },
];
const lahendongBins = binStrikes(lahendongFaults.map((f) => f.strike), 10);

const lahendongWells = [
  { well: "LHD 5", ph: 8.7, ec: 1847 }, { well: "LHD 8", ph: 6.87, ec: 2130 },
  { well: "LHD 11", ph: 7.77, ec: 1154 }, { well: "LHD 12", ph: 4.79, ec: 1380 },
  { well: "LHD 18", ph: 7.36, ec: 2550 }, { well: "LHD 37", ph: 8.44, ec: 1962 },
  { well: "LHD 48", ph: 6.15, ec: 1079 },
];

const lahendongFormations = [
  { name: "Post-Tondano / Pangolombian", top: 0, base: 850, nu: 0.40 },
  { name: "Tondano", top: 350, base: 1100, nu: 0.35 },
  { name: "Pre-Tondano", top: 1100, base: 1600, nu: 0.30 },
];

const thermalForecast = {
  "LHD-11": [{ yr: 0, t: 275 }, { yr: 9, t: 268 }, { yr: 18, t: 260 }, { yr: 27, t: 253 }, { yr: 36, t: 248 }],
  "LHD-17": [{ yr: 0, t: 282 }, { yr: 7.5, t: 271 }, { yr: 15, t: 260 }, { yr: 22.5, t: 249 }, { yr: 30, t: 238 }],
};

/* ---------------------------------------------------------------
   DATA — SIBAYAK (names only — verification pending)
--------------------------------------------------------------- */
const sibayakFaults = ["Sesar Tengkorak", "Sesar Semangat Gunung", "Sesar Pariban (NW–SE & NE–SW)", "Kaldera Singkut (ring fault)"];

/* ---------------------------------------------------------------
   FIELD: SALAK
--------------------------------------------------------------- */
function SalakView() {
  const [showEffective, setShowEffective] = useState(false);
  const lobe = showEffective ? salakEffectiveLobe : salakOpenLobe;

  return (
    <div className="space-y-5">
      <Panel
        title="Effective fracture population"
        subtitle="12 of 18 logged wells fall inside the commercial production boundary — only those 12 (9,612 m cumulative) feed this analysis."
        tier="A1"
        accent={C.ember}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <RoseDiagram bins={lobe} color={C.ember} dashed size={200} maxOverride={12.6} />
          </div>
          <div className="flex-1 space-y-4">
            <div className="inline-flex rounded-sm p-0.5" style={{ backgroundColor: C.bgInset, border: `1px solid ${C.hairline}` }}>
              <button
                onClick={() => setShowEffective(false)}
                className="rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                style={{ backgroundColor: !showEffective ? C.emberDim : "transparent", color: !showEffective ? C.textPrimary : C.textMuted }}
              >
                All open fractures (4,900)
              </button>
              <button
                onClick={() => setShowEffective(true)}
                className="rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                style={{ backgroundColor: showEffective ? C.emberDim : "transparent", color: showEffective ? C.textPrimary : C.textMuted }}
              >
                Feed-zone effective (~100)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Wells logged (in-boundary)" value="12" unit="/ 18 total" />
              <Stat label="Cumulative log length" value="9,612" unit="m" />
              <Stat label="S_Hmax orientation" value="N22°" unit="E" color={C.ember} />
              <Stat label="Correlated to feed zones" value="~2" unit="% of open fractures" />
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
              Reconstructed concentration lobe from reported strike/dip statistics (NE–SW dominant, dip &gt;60°) —
              not digitized from the original stereonet. Real per-fracture coordinates were not published.
            </p>
            <Cite>Golla et al. (2018), <em>Geothermics</em> 83 — Fig. 9–10.</Cite>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Directional permeability anisotropy" tier="A1" accent={C.mineral}>
          <div className="space-y-3">
            {[
              { label: "ky — NE-SW (∥ S_Hmax)", val: 2.5, color: C.mineral },
              { label: "kx — NW-SE (⊥ S_Hmax)", val: 1.0, color: C.slate },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-[12px]" style={{ color: C.textSecondary }}>
                  <span>{r.label}</span>
                  <span className="font-mono">{r.val.toFixed(1)}×</span>
                </div>
                <div className="h-2 rounded-sm" style={{ backgroundColor: C.bgInset }}>
                  <div className="h-2 rounded-sm" style={{ width: `${(r.val / 2.5) * 100}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
            <p className="pt-1 text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
              Fracture flow is 2.5× more transmissive along strike than across it — matched grid orientation (NE) in the reservoir model.
            </p>
            <Cite>Nordquist (2017), via Kurniawan et al. (2026), SGP-TR-230, §2.2.1.</Cite>
          </div>
        </Panel>

        <Panel title="MEQ-derived base of reservoir" tier="B" accent={C.mineral}>
          <div className="space-y-3">
            {salakHypocenters.map((z) => (
              <div key={z.zone}>
                <div className="text-[12.5px] font-medium" style={{ color: C.textPrimary }}>{z.zone}</div>
                <div className="mt-0.5 font-mono text-[13px]" style={{ color: C.mineral }}>{z.top} to {z.base} m (rel. sea level)</div>
                <div className="text-[11.5px]" style={{ color: C.textMuted }}>{z.note}</div>
              </div>
            ))}
            <p className="pt-1 text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
              Interpreted as imaging the stimulated/connected fracture network extent — a correlative reading of MEQ
              clustering, not a direct fracture count.
            </p>
            <Cite>Perdana et al. (2020), WGC Reykjavik — §2, Fig. 4.</Cite>
          </div>
        </Panel>
      </div>

      <Panel
        title="Feed-zone productivity index (PI′) — cumulative distribution"
        subtitle="Reconstructed S-curve shape matched to documented range; not digitized from source plot."
        tier="B"
        accent={C.ember}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={salakPI} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={C.hairlineSoft} strokeDasharray="3 3" />
            <XAxis
              dataKey="pi" scale="log" domain={[0.0001, 0.01]} type="number"
              tick={{ fill: C.textMuted, fontSize: 11, fontFamily: "ui-monospace" }}
              stroke={C.hairline}
              tickFormatter={(v) => v.toExponential(0)}
              label={{ value: "PI′  (kph·cuft·cp / lb / psi)", position: "insideBottom", offset: -4, fill: C.textMuted, fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: C.textMuted, fontSize: 11, fontFamily: "ui-monospace" }} stroke={C.hairline}
              label={{ value: "Cumulative % of volume", angle: -90, position: "insideLeft", fill: C.textMuted, fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: C.bgInset, border: `1px solid ${C.hairline}`, fontSize: 12 }}
              labelFormatter={(v) => `PI′ ≈ ${Number(v).toExponential(2)}`}
              formatter={(v) => [`${v}%`, "cumulative"]}
            />
            <Line type="monotone" dataKey="cum" stroke={C.ember} strokeWidth={2} dot={{ r: 3, fill: C.ember }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-between text-[11.5px]" style={{ color: C.textMuted }}>
          <span>280+ calibrated feed zones · range 1.4×10⁻⁴ – 8×10⁻³</span>
          <Cite>Kurniawan et al. (2026), Fig. 3.</Cite>
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <PendingCard
          title="Well-trajectory alignment checker"
          reason="Golla et al. (2018) recommends NW or E-SE trajectories qualitatively — no exact azimuth range is published. A prior draft of this tool invented 310–320°/110–120° cutoffs; that number was not sourced and has been removed pending a checker built directly from the measured rose diagram above."
        />
        <PendingCard
          title="Critically-stressed fracture engine (Mohr-Coulomb)"
          reason="Requires full stress tensor (S_v, S_Hmax magnitude, S_hmin, pore pressure). Neither Golla (2018) nor Kurniawan (2026) publish these magnitudes — only S_Hmax orientation (N22°E) is known."
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   FIELD: LAHENDONG
--------------------------------------------------------------- */
function LahendongView() {
  return (
    <div className="space-y-5">
      <Panel
        title="Fault strike distribution — 17 field observations"
        subtitle="Every bar reflects an actual mapped point (Table 1); regions: West n=6, North n=4, East n=7."
        tier="A2"
        accent={C.mineral}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <RoseDiagram bins={lahendongBins} color={C.mineral} size={200} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-[12px]" style={{ color: C.textSecondary }}>
              <div><div className="font-mono text-[16px]" style={{ color: C.mineral }}>N5°–N80°</div>NE-SW strike-slip</div>
              <div><div className="font-mono text-[16px]" style={{ color: C.mineral }}>N130°–N170°</div>NW-SE thrust, dip ≈20°</div>
              <div><div className="font-mono text-[16px]" style={{ color: C.mineral }}>N-S / E-W</div>normal, dip 78–88°</div>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
              σ1 (S_Hmax) trends NNW-SSE, inferred from Riedel-shear kinematics on the mapped fault set — a
              structural interpretation, not an instrumented stress measurement.
            </p>
            <Cite>Suherlina et al. (2022), <em>Geothermics</em> 105 — Table 1, §4.1.</Cite>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Geochemical compartments" subtitle="7 sampled wells, 2018" tier="B" accent={C.ember}>
          <ResponsiveContainer width="100%" height={210}>
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C.hairlineSoft} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="ph" name="pH" domain={[4, 9]} tick={{ fill: C.textMuted, fontSize: 11 }} stroke={C.hairline}
                label={{ value: "pH", position: "insideBottom", offset: -4, fill: C.textMuted, fontSize: 11 }} />
              <YAxis type="number" dataKey="ec" name="EC" tick={{ fill: C.textMuted, fontSize: 11 }} stroke={C.hairline}
                label={{ value: "EC (µS/cm)", angle: -90, position: "insideLeft", fill: C.textMuted, fontSize: 11 }} />
              <ZAxis range={[80, 80]} />
              <ReferenceLine y={1500} stroke={C.hairline} strokeDasharray="4 3" label={{ value: "1500 µS/cm split", fill: C.textMuted, fontSize: 10, position: "insideTopRight" }} />
              <Tooltip
                contentStyle={{ backgroundColor: C.bgInset, border: `1px solid ${C.hairline}`, fontSize: 12 }}
                formatter={(v, n) => [v, n]}
              />
              <Scatter data={lahendongWells} fill={C.ember}>
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
            Two compartments confirmed across independent studies: acidic / high-gas / fault-permeable vs. neutral / lower-productivity.
          </p>
          <Cite>Brehme et al. (2016), <em>Grundwasser</em> 21 + Suherlina et al. (2022), Table 3.</Cite>
        </Panel>

        <Panel title="Poisson's ratio by formation" tier="B" accent={C.mineral}>
          <div className="space-y-3">
            {lahendongFormations.map((f) => (
              <div key={f.name}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span style={{ color: C.textPrimary }}>{f.name}</span>
                  <span className="font-mono" style={{ color: C.mineral }}>ν = {f.nu.toFixed(2)}</span>
                </div>
                <div className="mt-1 h-2 rounded-sm" style={{ backgroundColor: C.bgInset }}>
                  <div className="h-2 rounded-sm" style={{ width: `${f.nu * 200}%`, backgroundColor: C.mineral, opacity: 0.4 + f.nu }} />
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: C.textMuted }}>{f.top}–{f.base} m depth</div>
              </div>
            ))}
            <p className="pt-1 text-[12px] leading-relaxed" style={{ color: C.textMuted }}>
              Higher ν near-surface = fractured rock; lower ν at depth = silicified, unfractured rock.
            </p>
            <Cite>Silitonga et al. (2005), WGC Antalya — via Qarinur et al. (2020), Table 4.</Cite>
          </div>
        </Panel>
      </div>

      <Panel
        title="Thermal drawdown forecast (36-year production)"
        subtitle="Endpoints from Qarinur et al. (2020); intermediate points interpolated for display, not modeled year-by-year."
        tier="B"
        accent={C.ember}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={C.hairlineSoft} strokeDasharray="3 3" />
            <XAxis dataKey="yr" type="number" domain={[0, 36]} tick={{ fill: C.textMuted, fontSize: 11 }} stroke={C.hairline}
              label={{ value: "years of production", position: "insideBottom", offset: -4, fill: C.textMuted, fontSize: 11 }} />
            <YAxis domain={[230, 290]} tick={{ fill: C.textMuted, fontSize: 11 }} stroke={C.hairline}
              label={{ value: "reservoir temp (°C)", angle: -90, position: "insideLeft", fill: C.textMuted, fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: C.bgInset, border: `1px solid ${C.hairline}`, fontSize: 12 }} />
            <Line data={thermalForecast["LHD-11"]} dataKey="t" name="LHD-11 (Cluster-4)" stroke={C.ember} strokeWidth={2} dot={{ r: 3 }} />
            <Line data={thermalForecast["LHD-17"]} dataKey="t" name="LHD-17 (Cluster-13)" stroke={C.mineral} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-5 text-[11.5px]" style={{ color: C.textMuted }}>
          <span><span style={{ color: C.ember }}>■</span> LHD-11: 275°C → 248°C</span>
          <span><span style={{ color: C.mineral }}>■</span> LHD-17: 282°C → 238°C</span>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   FIELD: SIBAYAK
--------------------------------------------------------------- */
function SibayakView() {
  return (
    <div className="space-y-5">
      <div
        className="flex items-start gap-3 rounded-sm px-5 py-4"
        style={{ backgroundColor: `${C.tierB}14`, border: `1px solid ${C.tierB}55` }}
      >
        <AlertTriangle size={18} style={{ color: C.tierB, marginTop: 2 }} />
        <div>
          <div className="text-[13.5px] font-medium" style={{ color: C.textPrimary }}>Source not yet cross-verified in full</div>
          <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.textSecondary }}>
            Fault names below were confirmed against Firanda et al. (2024), 49th Stanford Geothermal Workshop, via
            search snippets only — the full PDF has not been read line-by-line the way Salak and Lahendong sources were.
            No quantitative claims (strike/dip, permeability, stress) are included until that verification pass is done.
          </p>
        </div>
      </div>

      <Panel title="Named structures" tier="C" accent={C.slate}>
        <div className="grid gap-3 sm:grid-cols-2">
          {sibayakFaults.map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-sm px-3 py-2.5" style={{ backgroundColor: C.bgInset, border: `1px solid ${C.hairlineSoft}` }}>
              <GitBranch size={14} style={{ color: C.slate }} />
              <span className="text-[13px]" style={{ color: C.textSecondary }}>{f}</span>
            </div>
          ))}
        </div>
        <Cite>Firanda et al. (2024), 49th Stanford Geothermal Workshop — name-level only.</Cite>
      </Panel>

      <PendingCard
        title="All structural / fracture panels for Sibayak"
        reason="Same treatment as Salak and Lahendong (rose diagram, effective-fracture filter, stress orientation) will be added once the primary PDF is read in full and cross-checked, following the same process used for the other two fields."
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   ROOT APP
--------------------------------------------------------------- */
const FIELDS = [
  { id: "salak", label: "Salak", region: "West Java", icon: Flame, completeness: "full", view: SalakView },
  { id: "lahendong", label: "Lahendong", region: "North Sulawesi", icon: Waves, completeness: "full", view: LahendongView },
  { id: "sibayak", label: "Sibayak", region: "North Sumatra", icon: Mountain, completeness: "partial", view: SibayakView },
];

export default function StructuralModelingPrototype() {
  const [active, setActive] = useState("salak");
  const [legendOpen, setLegendOpen] = useState(false);
  const field = FIELDS.find((f) => f.id === active);
  const View = field.view;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={18} style={{ color: C.ember }} />
              <h1 className="text-[19px] font-semibold" style={{ color: C.textPrimary }}>
                Structural modeling &amp; effective fracture filter
              </h1>
            </div>
            <p className="mt-1 text-[13px]" style={{ color: C.textMuted }}>
              Per-field prototype — every figure is either sourced from a verified publication or explicitly marked reconstructed / pending.
            </p>
          </div>
          <button
            onClick={() => setLegendOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px]"
            style={{ backgroundColor: C.bgPanel, border: `1px solid ${C.hairline}`, color: C.textSecondary }}
          >
            evidence tiers
            <ChevronRight size={13} style={{ transform: legendOpen ? "rotate(90deg)" : "none", transition: "transform 120ms" }} />
          </button>
        </div>

        {legendOpen && (
          <div className="mb-6 grid gap-3 rounded-sm px-5 py-4 sm:grid-cols-4" style={{ backgroundColor: C.bgPanel, border: `1px solid ${C.hairline}` }}>
            {Object.entries(TIER_DEF).map(([k, t]) => (
              <div key={k} className="flex items-start gap-2">
                <TierBadge tier={k} />
                <span className="text-[11.5px] leading-snug" style={{ color: C.textMuted }}>{t.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* field nav */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {FIELDS.map((f) => {
            const Icon = f.icon;
            const isActive = f.id === active;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className="flex shrink-0 items-center gap-2.5 rounded-sm px-4 py-2.5 transition-colors"
                style={{
                  backgroundColor: isActive ? C.bgPanelAlt : C.bgPanel,
                  border: `1px solid ${isActive ? C.ember : C.hairline}`,
                }}
              >
                <Icon size={15} style={{ color: isActive ? C.ember : C.textMuted }} />
                <span>
                  <span className="block text-[13px] font-medium" style={{ color: isActive ? C.textPrimary : C.textSecondary }}>
                    {f.label}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.textMuted }}>{f.region}</span>
                </span>
                {f.completeness === "partial" ? (
                  <AlertTriangle size={13} style={{ color: C.tierB }} />
                ) : (
                  <CheckCircle2 size={13} style={{ color: C.tierA1 }} />
                )}
              </button>
            );
          })}
        </div>

        <View />

        <div className="mt-8 flex items-center gap-2 pt-4 text-[11px]" style={{ borderTop: `1px solid ${C.hairlineSoft}`, color: C.textMuted }}>
          <Compass size={12} />
          Prototype build — figures reconstructed from cited publications where raw datasets are not public. Not for reservoir-management decisions.
        </div>
      </div>
    </div>
  );
}
