# LithoHub v2

Geothermal well diagnostics for Indonesian fields. Six features in one web app: an Indonesia field map, per-field feature menus, diagnostics with warning flags, and live data input. All data lives in two JSON files — no data is written inside the code.

Every value shows where it comes from. Missing data stays empty — LithoHub never fills gaps with invented numbers.

## Run it in VS Code

You need **Node.js 18 or newer** (download the LTS version from nodejs.org).

1. Open this folder in VS Code (File → Open Folder).
2. Open the terminal (View → Terminal) and run:

```
npm install
npm run dev
```

3. Open the address it prints (usually http://localhost:5173).

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Checks the data files (sources present, values match the prototypes) and that every diagnosis gives the same result as the originals |
| `npm run build` | Builds the site into `dist/` for hosting (Netlify: build command `npm run build`, publish folder `dist`) |

The map tiles and fonts load from the internet, so you need a connection while using the app.

## Put it in the GitHub repo and on Netlify

v2 is built to slot into the existing `masevs/lithohub` repo. It keeps v1's data architecture: one file, `data/assets.json`, served at the same URL (`/data/assets.json`) and in the same format (an array of assets).

**1. Get the repo and make a branch** (in Command Prompt):

```
git clone https://github.com/masevs/lithohub.git
cd lithohub
git checkout -b v2
```

**2. Move v1 into a `legacy/` folder** so nothing is lost:

```
mkdir legacy
git mv index.html js css data server.py legacy/
```

**3. Copy everything from this `lithohub-app` folder into `lithohub/`** (except `node_modules`). Keep the repo's own `README.md` or replace it with this one.

**4. v1 demo assets (optional).** The case-study wells and Kamojang pads are already in `public/data/assets.json`. To also show the v1 demo assets, copy their entries from `legacy/data/assets.json` into it. They load fine: they are not diagnosed and only appear on the map when you tick "Show v1 demo assets".

**5. Test, then push:**

```
npm install
npm test
npm run dev
git add .
git commit -m "LithoHub v2: six features in one app"
git push -u origin v2
```

**6. Netlify.** The included `netlify.toml` tells Netlify to run `npm run build` and publish `dist/`. Netlify builds a preview for the `v2` branch if branch deploys are on (Site configuration → Build & deploy → Branches). When you are happy, merge `v2` into `main` on GitHub, and lithohub.netlify.app switches to v2 automatically.

## Editing the data

There are two data files. Change them and refresh the page — no code change needed.

| File | What it holds | Used by |
|---|---|---|
| `public/data/assets.json` | Wells with a diagnosis (same file and format as v1) | F3 rule engine, F5, F6 |
| `public/data/fields.json` | Field information (name, region, map location) and field-level datasets | F1, F2, F3 facts, F4 |

**Every dataset carries its evidence and source**, for example:

```json
"permeabilityAnisotropy": {
  "evidence": "quoted",
  "source": "Nordquist (2017), via Kurniawan et al. (2026), SGP-TR-230, §2.2.1",
  "confidence": "A1",
  "note": "...",
  "values": [ ... ]
}
```

`evidence` is one of: `quoted` (number from a paper's text or table), `digitized` (read from a figure), `reconstructed` (shape matched to reported statistics), `illustrative` (not real data), `derived` (LithoHub calculation or estimate), `pending` (not available yet — shown as a dashed card). A feature tab is enabled when its datasets have real data, labeled "Demo data" when they are only illustrative, and "Pending" when nothing is available yet. `npm test` fails if a dataset with values has no `source`.

**How a well in assets.json gets its diagnosis** (same order as v1's `computeAnomalies()`):

| The asset has | Diagnosis | Shown in |
|---|---|---|
| `productionHistory` | Production decline (Salak logic) | Well health |
| `geochemicalHistory` | Injectate breakthrough (Silangkitang logic) | Ternary, isotope & tracer |
| `anomalyType: "casing_leak_cold_influx"` | Reported by source (Ulubelu) | Well health |
| `geochemicalTrend` | Boiling / dryness (Lahendong logic) | Well health |
| `superheatSeries` | Superheat rule engine (F3) | Superheat & thermal |

Add `"field": "salak"` (or another field id from fields.json) to put a well under a field. A well whose series has `"evidence": "illustrative"` is shown as demo data and never counts as an alert — until a user enters their own values. Both files must be valid JSON: no trailing commas. If one isn't, the app shows which file is broken instead of a blank page.

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

## Adding a new kind of diagnosis

Add a file in `src/diagnostics/`, register it in `diagnostics/index.js`, add its detection rule to `pickDiagnosis()` in `src/data/model.js`, add its editable tables to `schemas.js`, and add a test.

## Known open items

- **F1** is a 2D viewer. The 3D trajectories need directional surveys; the Salak feed-zone cloud needs Figure 7 of Golla (2018) digitized. Both show as dashed "pending" cards listing what is needed.
- **F1 Sibayak depths:** the source table gives total depth as TVD but the maximum-temperature depth in m MD, and the chart puts both on one axis. Verify against Supriyanto (2005).
- **F2** rose diagram (Salak) and PI′ curve are reconstructed shapes, now tagged as such. The Lahendong 1500 µS/cm split line has no stated source — verify it.
- **F3** Kamojang series are illustrative. Replace them in `assets.json` with digitized or logged values (and change `"evidence"` to `"digitized"`) to make the rule engine count. The 24 °C / 10 °C corrosion thresholds need a citation.
- **F6** ternary and isotope plots are pending: they need per-sample Cl, SO₄, HCO₃, Na, K, Mg and δ¹⁸O / δ²H.
- **Map locations** for Sibayak and Kamojang are approximate field-level points, not from the source papers.
- **v1 bug carried over:** the diagnosis functions leave `summary` as "No anomalies detected" even when they find one. The app does not display it.
- **Backend:** user data lives in the browser. To share data between users, replace `loadUserData`/`saveUserData` in `src/data/store.js` with calls to a server.
