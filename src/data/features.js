// The six LithoHub features. Their data lives in public/data/*.json.
export const FEATURES = [
  {
    id: 'f1',
    short: 'Trajectory & feed zones',
    name: '3D Well Trajectory & Feed-Zone Mapper',
    builtNote: 'Currently a 2D viewer. The 3D trajectories and the Salak feed-zone cloud are pending — see the dashed cards for what data is needed.',
  },
  {
    id: 'f2',
    short: 'Structure & fractures',
    name: 'Structural Modeling & Effective Fracture Filter',
  },
  {
    id: 'f3',
    short: 'Superheat & thermal',
    name: 'Superheat & Thermal Dynamics',
    builtNote: 'The well-pad series are illustrative, not digitized. Their result is shown as “Demo data” and never colors the map — until you enter your own logged values.',
  },
  {
    id: 'f4',
    short: 'Cross-sections',
    name: 'Integrated Cross-Section Generator',
    builtNote: 'Static schematic cross-sections with hover data. Relationships are ordinal, not magnitudes.',
  },
  {
    id: 'f5',
    short: 'Well health',
    name: 'Well Health & Deviation Diagnostic',
  },
  {
    id: 'f6',
    short: 'Ternary, isotope & tracer',
    name: 'Interactive Ternary, Isotope & Tracer Connectivity',
    builtNote: 'Only the NCG/HCO₃ injectate-breakthrough diagnosis (Silangkitang) is built. Ternary and isotope plots are pending.',
  },
];

export const featureById = Object.fromEntries(FEATURES.map((f) => [f.id, f]));
