# LithoHub v2

Geothermal well diagnostics for Indonesian fields. Six features in one web app: an Indonesia field map, per-field feature menus, diagnostics with warning flags, and live data input. All data lives in two JSON files — no data is written inside the code.

Every value shows where it comes from. Missing data stays empty — LithoHub never fills gaps with invented numbers.


## What's inside

```
public/data/
  assets.json             wells with a diagnosis — same file and format as v1
  fields.json             field info + all F1–F4 datasets, each with evidence and source
prototypes/               the original F1–F4 prototype files, kept for audit (not built)
netlify.toml              Netlify build settings
src/
  App.jsx                 loads both data files, runs all diagnoses, computes field colors
  data/
    model.js              builds fields, wells and feature states from the two files
    features.js           the 6 features and their notes
    schemas.js            which tables a user can edit, per diagnosis
    store.js              user data (saved in the browser, separate from paper data)
  diagnostics/            F3/F5/F6 rule logic ported unchanged from the prototypes + tests
  views/                  F1–F4 rebuilt as app views (F4 reuses the two original drawings)
  components/             map, side menu, alert bar, panels, charts, data editor
```

## How the parts work

**Map and colors.** Each field marker shows the worst diagnosis among its wells. Fields with only visualizations get an orange marker. Kamojang has only illustrative data, so it gets a dashed "demo data" marker and never counts as an alert.

**Diagnoses.** `src/diagnostics/` holds the four v1 diagnoses (Salak, Lahendong, Silangkitang, Ulubelu) and the F3 superheat rule engine. The calculations are the same as in the originals; the thresholds were moved into a `RULES` list so the app can show them, labeled as LithoHub rule parameters. Two small guards were added so empty user tables return "No data" instead of crashing.

**Data input.** On F3 (each Kamojang pad), F5 and F6, "Enter your data" opens an editable table. You can type values, upload a CSV, paste a CSV, or download a template. Rows with errors are highlighted and saving is blocked until they are fixed. After saving, the diagnosis, map color, and alert bar update immediately. "Paper data / My data" switches between the two; your data never overwrites the paper data. It is stored in your browser only (localStorage).

## Known open items

- **F1** is a 2D viewer. The 3D trajectories need directional surveys; the Salak feed-zone cloud needs Figure 7 of Golla (2018) digitized. Both show as dashed "pending" cards listing what is needed.
- **F1 Sibayak depths:** the source table gives total depth as TVD but the maximum-temperature depth in m MD, and the chart puts both on one axis. Verify against Supriyanto (2005).
- **F2** rose diagram (Salak) and PI′ curve are reconstructed shapes, now tagged as such. The Lahendong 1500 µS/cm split line has no stated source — verify it.
- **F3** Kamojang series are illustrative. Replace them in `assets.json` with digitized or logged values (and change `"evidence"` to `"digitized"`) to make the rule engine count. The 24 °C / 10 °C corrosion thresholds need a citation.
- **F6** ternary and isotope plots are pending: they need per-sample Cl, SO₄, HCO₃, Na, K, Mg and δ¹⁸O / δ²H.
- **Map locations** for Sibayak and Kamojang are approximate field-level points, not from the source papers.
- **v1 bug carried over:** the diagnosis functions leave `summary` as "No anomalies detected" even when they find one. The app does not display it.
- **Backend:** user data lives in the browser. To share data between users, replace `loadUserData`/`saveUserData` in `src/data/store.js` with calls to a server.
