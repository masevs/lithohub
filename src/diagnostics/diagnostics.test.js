// Run with: npm test
// Expected values were produced by running the ORIGINAL index.html functions
// (review copies salak-code.js, lahendong-code.js, ...) on the same data.
// If any of these fail, the port changed a calculation.
import { describe, it, expect } from 'vitest';
import assets from '../../public/data/assets.json';
import fieldsData from '../../public/data/fields.json';
import { buildModel, pickDiagnosis } from '../data/model.js';
import { diagnoseSalak, computeModelDivergence } from './salak.js';
import { diagnoseLahendong } from './lahendong.js';
import { diagnoseSilangkitang } from './silangkitang.js';
import { diagnoseUlubelu } from './ulubelu.js';
import { computeSuperheat } from './superheat.js';
import { runDiagnosis } from './index.js';
import { binStrikes, gaussianLobe } from '../views/structural.js';

const byId = Object.fromEntries(assets.map((a) => [a.id, a]));
const salak = byId['well-004'];
const silangkitang = byId['well-005'];
const ulubelu = byId['well-006'];
const lahendong = byId['well-007'];

describe('data/assets.json', () => {
  it('each well gets the same diagnosis as the v1 dispatcher', () => {
    expect(assets.map((a) => pickDiagnosis(a))).toEqual(['salak', 'silangkitang', 'ulubelu', 'lahendong', 'superheat', 'superheat', 'superheat']);
  });
  it('wells land in the right fields', () => {
    const m = buildModel(assets, fieldsData);
    expect(Object.values(m.wells).map((w) => w.field)).toEqual(['salak', 'silangkitang', 'ulubelu', 'lahendong', 'kamojang', 'kamojang', 'kamojang']);
    expect(m.fields.map((f) => f.id)).toEqual(['salak', 'sibayak', 'lahendong', 'silangkitang', 'kamojang', 'ulubelu']);
  });
  it('assets without case-study data become demo assets, not diagnoses', () => {
    const m = buildModel([...assets, { id: 'demo-1', name: 'Demo', latitude: 0, longitude: 110, historicalData: [] }], fieldsData);
    expect(m.demo.map((a) => a.id)).toEqual(['demo-1']);
    expect(m.wells['demo-1']).toBe(undefined);
  });
});

describe('Salak Well #1 (Libert & Pasikki 2010)', () => {
  const r = diagnoseSalak(salak);
  it('is critical with two flags', () => {
    expect(r.severity).toBe('critical');
    expect(r.anomalyFlags.map((f) => f.metric)).toEqual(['Decline Rate', 'Model Divergence']);
  });
  it('decline rate flag matches v1', () => {
    expect(r.anomalyFlags[0].deviation).toBe('29.6x baseline');
    expect(r.anomalyFlags[0].value).toBe('237%');
    expect(r.anomalyFlags[0].baseline).toBe('8%');
  });
  it('model divergence worst gap matches v1', () => {
    expect(r.anomalyFlags[1].value).toBe('90 kph');
    expect(r.anomalyFlags[1].baseline).toBe('223 kph');
  });
  it('divergence series matches v1', () => {
    const d = computeModelDivergence(salak);
    expect(d.map((p) => p.modelKph)).toEqual([340, 334, 328, 320, 300, 274, 244, 223, 177]);
    expect(d.map((p) => p.belowModel)).toEqual([false, false, true, true, true, true, true, true, true]);
  });
});

describe('Lahendong LHD-8 (Suherlina et al. 2022)', () => {
  const r = diagnoseLahendong(lahendong);
  it('is critical (Cl up + SO4 down + dryness up)', () => {
    expect(r.severity).toBe('critical');
    expect(r.anomalyFlags[0].deviation).toBe('Cl up + SO4 down (aligned boiling signature)');
    expect(r.anomalyFlags[1].deviation).toBe('+5pp');
  });
});

describe('Silangkitang (Simatupang et al. 2020)', () => {
  const r = diagnoseSilangkitang(silangkitang);
  it('is warning: NCG -29.5%, enthalpy stable', () => {
    expect(r.severity).toBe('warning');
    expect(r.anomalyFlags[0].deviation).toBe('29.5% decline');
    expect(r.recommendation).toBe('Continue routine geochemical monitoring (NCG, HCO3)');
  });
});

describe('Ulubelu (Yuniar et al. 2015)', () => {
  it('is reported critical', () => {
    expect(diagnoseUlubelu(ulubelu).severity).toBe('critical');
  });
});

describe('data/fields.json (F1–F4 data moved from the prototypes)', () => {
  const m = buildModel(assets, fieldsData);
  it('each field shows the right features', () => {
    const st = Object.fromEntries(m.fields.map((f) => [f.id, f.features]));
    expect(st.salak).toEqual({ f1: 'data', f2: 'data', f5: 'data' });
    expect(st.sibayak).toEqual({ f1: 'data', f2: 'pending' });
    expect(st.lahendong).toEqual({ f2: 'data', f4: 'data', f5: 'data' });
    expect(st.silangkitang).toEqual({ f4: 'data', f6: 'data' });
    expect(st.kamojang).toEqual({ f3: 'data' });
    expect(st.ulubelu).toEqual({ f5: 'data' });
  });
  it('every dataset with values names its source', () => {
    const missing = [];
    Object.entries(fieldsData).filter(([k]) => !k.startsWith('_')).forEach(([fid, f]) =>
      Object.entries(f.features).forEach(([feat, sets]) =>
        Object.entries(sets).forEach(([name, ds]) => {
          if (ds.evidence && !['pending', 'derived'].includes(ds.evidence) && !ds.source) missing.push(`${fid}.${feat}.${name}`);
        })));
    expect(missing).toEqual([]);
  });
  it('values match the prototypes', () => {
    const sby = fieldsData.sibayak.features.f1.wells.wells;
    expect(sby.length).toBe(10);
    expect(sby.find((w) => w.id === 'SBY-5').maxTempC).toBe(302);
    expect(sby.find((w) => w.id === 'SBY-5').injectivityKgSBar).toBe(18.6);
    expect(sby.find((w) => w.id === 'SBY-10').maxTempDepthM).toBe(400);
    expect(fieldsData.lahendong.features.f2.faultStrikes.faults.length).toBe(17);
    expect(fieldsData.lahendong.features.f2.thermalForecast.wells.map((w) => [w.start.tempC, w.end.tempC])).toEqual([[275, 248], [282, 238]]);
    expect(fieldsData.salak.features.f2.fractureStats.cumulativeLogLengthM).toBe(9612);
    expect(fieldsData.silangkitang.features.f4.fluidModel.relations.length).toBe(5);
  });
  it('fault rose counts every strike twice (both directions)', () => {
    const bins = binStrikes(fieldsData.lahendong.features.f2.faultStrikes.faults.map((f) => f.strike));
    expect(bins.reduce((a, b) => a + b.v, 0)).toBe(34);
    expect(gaussianLobe(fieldsData.salak.features.f2.fractureRose.open).length).toBe(36);
  });
});

describe('Kamojang superheat (F3 rule engine)', () => {
  const pad = (id) => assets.find((a) => a.id === id);
  it('matches the prototype arithmetic', () => {
    const c1 = computeSuperheat(pad('kamojang-c-1').superheatSeries.points);
    expect(c1.baselineMean.toFixed(2)).toBe('1.43');
    expect(c1.run).toBe(5);
    expect(c1.flagged).toBe(true);
    expect(computeSuperheat(pad('kamojang-c-2').superheatSeries.points).run).toBe(4);
    expect(computeSuperheat(pad('kamojang-a-2').superheatSeries.points).run).toBe(5);
  });
  it('illustrative data is demo, never an alert', () => {
    const r = runDiagnosis('superheat', pad('kamojang-c-1'));
    expect(r.severity).toBe('demo');
    expect(r.computedSeverity).toBe('warning');
  });
  it('the same series entered as user data counts', () => {
    expect(runDiagnosis('superheat', pad('kamojang-c-1'), true).severity).toBe('warning');
  });
});
