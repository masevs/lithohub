# LithoHub

**Geothermal Well Anomaly Detection | Real-time P/T Monitoring for Indonesian Energy Operators**

![Live Demo](https://lithohub.netlify.app/)

---

## The Problem

Indonesia possesses the world's second largest geothermal potential (~23.9 GW), but only ~2.6 GW is currently installed. The Ministry of Energy & Mineral Resources (ESDM) has set an ambitious target of 9.3 GW by 2035, which is requiring 8x expansion in 14 years. The bottleneck isn't geology or policy. It's operations.

### The Real Cost of Manual Diagnostics

Geothermal wells operate at 200–300°C in corrosive, mineral-rich environments. Wells degrade progressively through:
- **Casing corrosion** (high-temperature brine attacks metal)
- **Mineral scaling** (silica & calcite deposits choke flow)
- **Pressure anomalies** (kinks in P/T gradients signal leaks or blockages)
- **Chemistry shifts** (chloride spikes indicate casing failure or cold water infiltration)

**Current workflow:** Operators manually normalize 10+ years of historical P/T data, overlay current sensor readings, and spend 60% of diagnostic time trying to determine if a 5% pressure drop is a normal fluctuation or a failure indicator. This is before they can even begin prioritization for expensive workovers ($2M+ per well).

**The gap:** Transparent, contextual anomaly detection doesn't exist in most geothermal operations. Operators either use no detection (reactive failures) or blackbox ML models (unauditable in regulated environments).

---

## The Solution

**LithoHub** is a **web-based anomaly detection dashboard** that:

1. **Reads data operators already collect** — Sensor exports (P/T, chlorides) from SCADA systems or Excel
2. **Detects deviations automatically** — Flags anomalies >1.5σ from 90 day baseline without operator guessing
3. **Explains each flag with geological context** — Not just "anomaly detected," but "pressure kink at depth = scaling; recommend caliper log"
4. **Ranks wells by priority** — Combine anomaly severity, asset type, and geology to focus limited inspection budgets
5. **Uses transparent statistics, not black boxes** — Every threshold, every flag, every recommendation can be audited by regulators

### What Makes It Different

| Aspect | Typical Approach | LithoHub |
|--------|------------------|----------|
| **Data input** | Manual spreadsheet review | Auto-read Excel/SCADA export, 30s refresh |
| **Anomaly detection** | Operator experience ("does this look wrong?") | Quantified: 1.5σ deviation from baseline |
| **Geological context** | None; treats all wells equally | Asset-type calibration (geothermal 200–310°C normal, oil 60–85°C) |
| **Root cause hints** | None; just a red flag | Suggests likely cause: "scaling," "corrosion," "cold water infiltration" |
| **Auditability** | "I think it's risky" | "WHP dropped 8% vs baseline; here's the math" |
| **Scalability** | One well at a time | 5+ wells on one screen; cross-asset comparison |

---

## Key Features

### 🗺️ **Interactive Asset Map**
- Real-time marker status (🔴 anomaly, 🔵 normal) on Indonesia map
- Click any marker for detailed asset diagnostics
- Supports geothermal wells, oil/gas wells, pipelines, processing facilities

### 📊 **90-Day Trend Analysis**
- **Wellhead Pressure (WHP)** — Detects gradual decline (depletion/scaling)
- **Temperature** — Flagged if outside asset type safe range
- **Chloride Concentration (ppm)** — Chemical spike = casing integrity risk
- Switchable tabs; baseline mean line included

### ⚡ **Geological Context Scoring**
Each anomaly includes:
- **Asset-type specific thresholds** (not one size fits all)
- **Rock formation modifiers** (alluvium scales risk up; granite down)
- **Interpreted cause** (e.g., "mineral scaling at 1200m depth")
- **Recommended action** (e.g., "Run caliper log within 30 days")

### 🔄 **Live Excel Feed (Optional)**
- Python backend reads `lithohub_assets.xlsx` every 30 seconds
- Operators edit one spreadsheet; dashboard auto-updates
- Zero API learning curve

---

## Quick Start

### **For Industry Users (Just Want to See It Work)**

1. Open [https://lithohub.netlify.app/](https://lithohub.netlify.app/)
2. View 5 sample assets across Indonesia
3. Click a marker → See detailed trend charts, anomaly status, geological interpretation
4. Tab through WHP, Temperature, Chloride metrics
5. No account needed; no data submission

**Current demo includes:**
- Kutai Basin Geothermal (normal operation baseline)
- Madura Strait Oil Well (pressure anomaly detected)
- Tarakan Basin Gas Well (chemistry shift flagged)
- Trans Sumatra Pipeline, Barito Processing Facility (mixed asset types)

---
### **Why Not Machine Learning?**

Geothermal operators work in heavily regulated environments (Ministry of ESDM oversight). Black-box ML models (neural networks, ensemble classifiers) cannot be audited by regulators. A chloride spike flagged by a statistical model can be explained to inspectors; a neural network's prediction cannot.

LithoHub uses **descriptive statistics** (mean, std dev, quantile) instead — auditable, explainable, sufficient for v1.0 proof-of-concept.

**Future roadmap** includes: predictive models (time series forecasting, degradation curves) once production data accumulates.

---

## Project Structure

```
lithohub/
├── index.html              # Main dashboard UI
├── server.py               # Python backend (anomaly API, Excel reading)
├── js/
│   ├── map.js              # Azure Maps initialization & marker management
│   ├── dashboard.js        # Chart.js integration, UI updates
│   └── ai-risk.js          # Anomaly scoring & geological context logic
├── css/
│   └── style.css           # Dark theme, responsive layout
├── data/
│   └── assets.json         # Demo data (5 sample wells/assets)
└── README.md               # This file
```

### **Key Dependencies**

| Component | Purpose | License |
|-----------|---------|---------|
| [Azure Maps SDK](https://learn.microsoft.com/en-us/azure/azure-maps/) | Interactive geospatial visualization | Commercial (free tier available) |
| [Chart.js](https://www.chartjs.org/) | Time-series trend charts | MIT |
| HTML5, CSS3, Vanilla JS | Frontend framework (no Node, no build step) | - |
| Python 3.8+ | Backend server, anomaly computation | MIT |

**Zero external API keys required for static demo** — uses public map tiles. Demo deployment on Netlify + optional local Python backend.

---

## Validation & Evidence

### **Problem Validation**
- **Direct operator interview** (April 2026): Geothermal field operator confirmed 60% of diagnostic time spent normalizing historical P/T data
- **Literature review:** SPE 2025 study on Muara Laboh (Indonesia) found automated monitoring workflows still experimental across Indonesia
- **Regulatory context:** ANSI/ISA-18.2 standard recognizes "alarm fatigue" as cross-sector risk in oil/gas and energy

### **Technical Validation**
- **Dataset:** 5 assets × 46 readings each × 90-day window = 230 synthetic data points (realistic SCADA export format)
- **Threshold calibration:** 1.5σ rule tested against domain literature (Karlsdottir 2018, Mundhenk et al. 2013 on scaling indicators)
- **Geological context:** Asset-type thresholds validated against operational ranges cited in geothermal engineering handbooks

---

## Development Roadmap

### **v1.0 (Current)**
- Statistical anomaly detection (1.5σ baseline)
- Multi-asset-type support (geothermal, oil, gas, pipeline, processing)
- Geological context scoring
- Interactive map + trend charts
- Transparent, auditable thresholds

### **v1.1**
- Sensor simulation (realistic synthetic readings with temporal patterns)
- Risk breakdown chart (isolate contribution of each metric: temp vs. pressure vs. chemistry)
- Maintenance history integration (link anomalies to past workover dates)

### **v2.0**
- **Per-asset differentiation:**
  - Oil/gas: add flow rate, water cut, GOR monitoring
  - Pipeline: pressure drop, segmentation analysis
  - Geothermal: dedicated scaling/corrosion chemistry models
- **Temporal resolution:** Flexible 1h → 24h → 90h aggregation
- **Three-level map status:** Normal → Warning → Critical (instant visual priority)

### **v3.0**
- **Predictive maintenance:** Time series forecasting to estimate degradation curves before critical thresholds
- **SCADA historian integration:** Real-time data streaming (replaces Excel)
- **Alert system:** Email/SMS notifications at warning + critical thresholds
- **Regulatory audit trail:** Logged decisions, recommendation timestamps, operator actions

### **v4.0+ (Vision)**
- Cross-asset predictive models (well lifespan remaining given current degradation rate)
- Economic ROI calculator (is repair worth the cost, or let well decline?)
- National-scale asset inventory (200+ wells across multiple operators)

---

## For Industry Operators: Getting Started

### **If You're a Geothermal Operator:**
1. **Export your SCADA historian** for one well (90-day rolling window of P/T, chloride)
2. **Convert to assets.json format** (template above)
3. **Test locally:** `python3 server.py` → open http://localhost:8000
4. **Share feedback:** Does the anomaly detection make sense? Are the thresholds right? What features would you add?

### **If You're a Regulator:**
- The anomaly detection logic is **fully transparent**: no black boxes, no proprietary models
- All thresholds and calculations are **open source** and can be audited
- Logs can be extended to include operator decisions, inspector notes, and regulatory approval stamps

### **If You're an Investor/Stakeholder:**
- This addresses a **documented gap** in Indonesia's geothermal expansion pipeline
- The technology is **immediately deployable** (no massive R&D needed)
- The market is **national scale**: 200+ geothermal wells, expanding to oil/gas (1000+ wells)
- Revenue streams: SaaS dashboard (per well/month) + consulting on threshold tuning + alerts API

---

## License

MIT License — Free for educational, research, and commercial use. See [LICENSE](./LICENSE) for full terms.

---

## Questions? Ideas?

- **For technical questions and Contributors are welcome in:** Open an [Issue](https://github.com/masevs/lithohub/issues) Email imasviestawati22@gmail.com
- **To see a live demo:** Visit [https://lithohub.netlify.app/](https://lithohub.netlify.app/)

---

**LithoHub v1.0** | May 2026 | Built by Imas Viestawati for Indonesia's Energy Transition
