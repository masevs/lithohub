import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { computeModelDivergence } from '../diagnostics/salak.js';
import { computeSuperheat } from '../diagnostics/superheat.js';

export const AXIS = { color: '#4a565c', font: { size: 11 } };
export const GRID = { color: '#e8eae5' };
const LEGEND = { labels: { color: '#1e2a2f', font: { size: 11 }, usePointStyle: true } };

export function useChart(config, deps) {
  const ref = useRef(null);
  useEffect(() => {
    if (!config) return undefined;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export function Box({ canvasRef, caption }) {
  return (
    <>
      <div className="chart-box"><canvas ref={canvasRef} /></div>
      {caption && <div className="caption">{caption}</div>}
    </>
  );
}

export const base = (scales) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: LEGEND },
  scales,
});
export const axis = (title, extra = {}) => ({
  title: { display: true, text: title, ...AXIS },
  ticks: AXIS,
  grid: GRID,
  ...extra,
});

/* Salak — measured steam rate vs calibrated WELLHIST model (Libert & Pasikki 2010, Fig. 4) */
export function SalakSteamChart({ asset }) {
  const div = computeModelDivergence(asset) ?? [];
  const model = asset.productionHistory?.digitizedModelRate?.points ?? [];
  const ref = useChart(
    {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Measured steam rate (kph)',
            data: div.map((p) => ({ x: p.yearApprox, y: p.measuredKph })),
            showLine: true,
            borderColor: 'rgba(200,16,46,0.4)',
            backgroundColor: div.map((p) => (p.belowModel ? '#c8102e' : '#4a565c')),
            pointRadius: 5,
            borderWidth: 1.5,
          },
          {
            label: 'WELLHIST model (kph)',
            data: model.map((p) => ({ x: p.year, y: p.modelRateKph })),
            showLine: true,
            borderColor: '#2e8b57',
            borderDash: [6, 4],
            backgroundColor: '#2e8b57',
            pointRadius: 2,
            borderWidth: 2,
          },
        ],
      },
      options: base({ x: axis('Year'), y: axis('Steam rate (kph)') }),
    },
    [JSON.stringify(div), JSON.stringify(model)]
  );
  return <Box canvasRef={ref} caption="Values approximate — digitized from Figure 4. Red points sit below the model curve." />;
}

/* Silangkitang — NCG & HCO3 (Simatupang et al. 2020, Fig. 11b) */
export function GeochemChart({ asset }) {
  const pts = asset.geochemicalHistory?.points ?? [];
  const ref = useChart(
    {
      type: 'line',
      data: {
        labels: pts.map((p) => p.date),
        datasets: [
          { label: 'NCG (wt%)', data: pts.map((p) => p.ncgWtPercent), borderColor: '#d9540b', backgroundColor: '#d9540b', pointStyle: 'rectRot', pointRadius: 5, tension: 0.2, yAxisID: 'yNCG' },
          { label: 'HCO₃ (ppm)', data: pts.map((p) => p.hco3Ppm), borderColor: '#2563eb', backgroundColor: '#2563eb', pointStyle: 'rectRot', pointRadius: 5, tension: 0.2, yAxisID: 'yHCO3' },
        ],
      },
      options: base({
        yNCG: axis('NCG (wt%)', { position: 'left', min: 0 }),
        yHCO3: axis('HCO₃ (ppm)', { position: 'right', min: 0, grid: { drawOnChartArea: false } }),
        x: { ticks: AXIS, grid: GRID },
      }),
    },
    [JSON.stringify(pts)]
  );
  return <Box canvasRef={ref} caption="Values approximate — digitized from the original figure." />;
}

export function EnthalpyFlowChart({ asset }) {
  const pts = asset.geochemicalHistory?.points ?? [];
  const ref = useChart(
    {
      type: 'line',
      data: {
        labels: pts.map((p) => p.date),
        datasets: [
          { label: 'Enthalpy (kJ/kg)', data: pts.map((p) => p.enthalpyKjKg), borderColor: '#0f8a74', backgroundColor: '#0f8a74', pointRadius: 4, tension: 0.2, yAxisID: 'yH' },
          { label: 'Flow rate (t/h)', data: pts.map((p) => p.flowRateTPerHr), borderColor: '#c8102e', backgroundColor: '#c8102e', pointRadius: 4, tension: 0.2, yAxisID: 'yF' },
        ],
      },
      options: base({
        yH: axis('Enthalpy (kJ/kg)', { position: 'left', min: 0, max: 2000 }),
        yF: axis('Flow rate (t/h)', { position: 'right', min: 0, grid: { drawOnChartArea: false } }),
        x: { ticks: AXIS, grid: GRID },
      }),
    },
    [JSON.stringify(pts)]
  );
  return <Box canvasRef={ref} caption="Thermal impact check. Values approximate — digitized from the original figure." />;
}

/* Ulubelu — downhole PT profile (Yuniar et al. 2015, Fig. 6) */
export function PTProfileChart({ asset }) {
  const pt = asset.ptProfileIllustration;
  const ref = useChart(
    pt && {
      type: 'line',
      data: {
        datasets: [
          { label: 'Static temperature', data: pt.staticTemperature.points.map((p) => ({ x: p.tempC, y: p.elevationM })), borderColor: '#e0a800', borderDash: [5, 3], pointRadius: 3, tension: 0.2 },
          { label: 'Post-intrusion (2013)', data: pt.postIntrusion2013.points.map((p) => ({ x: p.tempC, y: p.elevationM })), borderColor: '#c8102e', borderDash: [5, 3], pointRadius: 3, tension: 0.2 },
        ],
      },
      options: base({ x: axis('Temperature (°C)', { type: 'linear' }), y: axis('Elevation (m RSL)') }),
    },
    [pt]
  );
  if (!pt) return null;
  return <Box canvasRef={ref} caption={pt.note} />;
}

/* Lahendong — Cl & SO4 (Table 4) and dryness (Fig. 7A) */
export function ChlorideSulfateChart({ asset }) {
  const pts = asset.geochemicalTrend?.points ?? [];
  const ref = useChart(
    {
      type: 'bar',
      data: {
        labels: pts.map((p) => p.date),
        datasets: [
          { label: 'Cl (mg/l)', data: pts.map((p) => p.clPpm), backgroundColor: '#d9540b' },
          { label: 'SO₄ (mg/l)', data: pts.map((p) => p.so4Ppm), backgroundColor: '#4a565c' },
        ],
      },
      options: base({ y: axis('mg/l', { min: 0 }), x: { ticks: AXIS, grid: { display: false } } }),
    },
    [JSON.stringify(pts)]
  );
  return <Box canvasRef={ref} caption="Quoted from Table 4 (Suherlina et al. 2022)." />;
}

export function DrynessChart({ asset }) {
  const pts = asset.drynessMeasured?.points ?? [];
  const ref = useChart(
    {
      type: 'line',
      data: {
        labels: pts.map((p) => p.year),
        datasets: [{ label: 'Dryness (%)', data: pts.map((p) => p.drynessPercent), borderColor: '#d9540b', backgroundColor: '#d9540b', pointRadius: 5 }],
      },
      options: base({ y: axis('Dryness (%)', { min: 0, max: 100 }), x: { ticks: AXIS, grid: GRID } }),
    },
    [JSON.stringify(pts)]
  );
  return <Box canvasRef={ref} caption="Approximate — digitized from Fig. 7A." />;
}

/* Kamojang — surface superheat vs the pad's own baseline (F3 rule engine) */
export function SuperheatChart({ asset }) {
  const c = computeSuperheat(asset.superheatSeries?.points ?? []);
  const pts = c?.series ?? [];
  const ref = useChart(
    c && {
      type: 'line',
      data: {
        labels: pts.map((p) => p.year),
        datasets: [
          {
            label: 'ΔT superheat (°C)', data: pts.map((p) => p.deltaTC), borderColor: '#1e2a2f',
            pointBackgroundColor: pts.map((_, i) => (c.flagIdxStart >= 0 && i >= c.flagIdxStart ? '#e0a800' : '#7b858a')),
            pointRadius: 5, borderWidth: 1.6,
          },
          { label: `Baseline ${c.baselineMean.toFixed(1)} °C (mean of first ${c.N})`, data: pts.map(() => c.baselineMean), borderColor: '#0f8a74', borderDash: [4, 3], pointRadius: 0, borderWidth: 1 },
          { label: `Flag threshold +${c.thresh} °C`, data: pts.map(() => c.baselineMean + c.thresh), borderColor: '#e0a800', borderDash: [2, 3], pointRadius: 0, borderWidth: 1 },
        ],
      },
      options: base({ y: axis('ΔT superheat (°C)'), x: { ticks: AXIS, grid: GRID } }),
    },
    [JSON.stringify(pts)]
  );
  if (!c) return <p className="sub">Not enough points to compute a baseline.</p>;
  return <Box canvasRef={ref} caption="Yellow points are inside a trailing run long enough to trigger the flag." />;
}
