/**
 * AI Risk Scoring Module
 * Computes statistical anomalies for geothermal assets
 */

/**
 * Compute Risk Score (Legacy - kept for reference)
 * Now replaced by anomaly detection
 */
function computeRiskScore(asset) {
    let score = 0;
    let riskLevel = "LOW";

    // Asset type thresholds
    const typeThresholds = {
        "Geothermal Well": { tempMin: 150, tempMax: 350, pressureMin: 2000, pressureMax: 5000 },
        "Oil Well": { tempMin: 50, tempMax: 150, pressureMin: 2000, pressureMax: 4000 },
        "Gas Well": { tempMin: 80, tempMax: 180, pressureMin: 2500, pressureMax: 5000 },
        "Pipeline": { tempMin: 30, tempMax: 100, pressureMin: 500, pressureMax: 3000 },
        "Processing Facility": { tempMin: 40, tempMax: 120, pressureMin: 500, pressureMax: 2500 }
    };

    const threshold = typeThresholds[asset.type] || { tempMin: 0, tempMax: 300, pressureMin: 0, pressureMax: 5000 };

    // Temperature assessment
    if (asset.currentTemp < threshold.tempMin || asset.currentTemp > threshold.tempMax) {
        score += 30;
    }

    // Pressure assessment
    if (asset.currentPressure < threshold.pressureMin || asset.currentPressure > threshold.pressureMax) {
        score += 30;
    }

    // Vibration assessment
    if (asset.vibration > 3.0) {
        score += 20;
    }

    // Subsidence risk
    if (asset.subsidenceRisk === "High") {
        score += 10;
    } else if (asset.subsidenceRisk === "Medium") {
        score += 5;
    }

    // Determine risk level
    if (score >= 60) {
        riskLevel = "HIGH";
    } else if (score >= 30) {
        riskLevel = "MEDIUM";
    } else {
        riskLevel = "LOW";
    }

    return {
        score: score,
        level: riskLevel,
        factors: {
            temperature: asset.currentTemp,
            pressure: asset.currentPressure,
            vibration: asset.vibration,
            subsidenceRisk: asset.subsidenceRisk
        }
    };
}

/**
 * Compute Statistical Anomalies (NEW)
 * Flags deviations >1.5σ from 90-day baseline
 */
function computeAnomalies(asset) {
    const result = {
        hasAnomaly: false,
        anomalyFlags: [],
        summary: "No anomalies detected",
        recommendation: "Continue routine monitoring"
    };

    if (!asset.historicalData) {
        return result;
    }

    const historical = asset.historicalData;
    if (!historical.whp || historical.whp.length === 0) {
        return result;
    }

    // Compute WHP statistics
    const whp_values = historical.whp;
    const whp_mean = whp_values.reduce((a, b) => a + b, 0) / whp_values.length;
    const whp_variance = whp_values.reduce((sum, val) => sum + Math.pow(val - whp_mean, 2), 0) / whp_values.length;
    const whp_std = Math.sqrt(whp_variance);

    const current_whp = asset.currentWHP || whp_values[whp_values.length - 1];
    const whp_deviation = Math.abs(current_whp - whp_mean) / (whp_std + 0.001);

    // Temperature statistics
    const temp_values = historical.temperature || [];
    let temp_deviation = 0;
    if (temp_values.length > 0) {
        const temp_mean = temp_values.reduce((a, b) => a + b, 0) / temp_values.length;
        const temp_variance = temp_values.reduce((sum, val) => sum + Math.pow(val - temp_mean, 2), 0) / temp_values.length;
        const temp_std = Math.sqrt(temp_variance);
        const current_temp = asset.currentTemp || temp_values[temp_values.length - 1];
        temp_deviation = Math.abs(current_temp - temp_mean) / (temp_std + 0.001);
    }

    // Chemistry analysis
    const chemistry = historical.chemistry || [];
    const chemistry_normal_count = chemistry.filter(c => c === 'normal').length;
    const chemistry_anomaly_rate = chemistry.length > 0 ? (chemistry.length - chemistry_normal_count) / chemistry.length : 0;

    // Flagging threshold: 1.5σ
    const SIGMA_THRESHOLD = 1.5;

    // Flag WHP anomalies
    if (whp_deviation > SIGMA_THRESHOLD) {
        const percent_change = ((current_whp - whp_mean) / whp_mean) * 100;
        result.anomalyFlags.push({
            type: "pressure",
            metric: "WHP",
            deviation: parseFloat(whp_deviation.toFixed(2)),
            value: current_whp,
            baseline: parseFloat(whp_mean.toFixed(1)),
            percentChange: parseFloat(percent_change.toFixed(1)),
            status: "ANOMALY",
            interpretation: `WHP deviation is ${whp_deviation.toFixed(1)}σ from baseline`
        });
        result.hasAnomaly = true;
        result.summary = `⚠️ Wellhead pressure dropped ${Math.abs(percent_change).toFixed(1)}% (potential scale blockage or reservoir depletion)`;
        result.recommendation = "Run caliper log and check for mineral scaling; compare reservoir pressure history";
    }

    // Flag temperature kinks
    if (temp_deviation > SIGMA_THRESHOLD && temp_values.length > 0) {
        const temp_mean = temp_values.reduce((a, b) => a + b, 0) / temp_values.length;
        const current_temp = asset.currentTemp || temp_values[temp_values.length - 1];
        const percent_change = ((current_temp - temp_mean) / temp_mean) * 100;
        result.anomalyFlags.push({
            type: "temperature",
            metric: "Temperature",
            deviation: parseFloat(temp_deviation.toFixed(2)),
            value: current_temp,
            baseline: parseFloat(temp_mean.toFixed(1)),
            percentChange: parseFloat(percent_change.toFixed(1)),
            status: "ANOMALY",
            interpretation: `Temperature kink detected (deviation: ${temp_deviation.toFixed(1)}σ)`
        });
        result.hasAnomaly = true;
        result.summary = `⚠️ Temperature gradient anomaly (potential corrosion or partial blockage)`;
        result.recommendation = "Inspect casing integrity; check for internal scaling or corrosion";
    }

    // Flag chemistry anomalies
    if (chemistry_anomaly_rate > 0.15) {
        result.anomalyFlags.push({
            type: "chemistry",
            metric: "Non-Condensable Gases / Chlorides",
            anomalyRate: parseFloat((chemistry_anomaly_rate * 100).toFixed(1)),
            status: "ANOMALY",
            interpretation: `${(chemistry_anomaly_rate * 100).toFixed(0)}% of recent readings show chemical anomalies`
        });
        result.hasAnomaly = true;
        result.summary = `⚠️ Chemical signature change (elevated chlorides or gas ratio spike)`;
        result.recommendation = "Test casing integrity; check for cold water infiltration or casing failure";
    }

    return result;
}

/**
 * Get interpretation message based on anomaly type
 */
function getAnomalyInterpretation(asset) {
    const interpretations = {
        "pressure_drop": "Wellhead pressure declining - may indicate scale blockage, mineral deposit, or reservoir depletion at depth " + (asset.anomalyDepth || "unknown"),
        "temperature_kink": "Temperature gradient anomaly - suggests internal corrosion, partial blockage, or flow restriction at depth " + (asset.anomalyDepth || "unknown"),
        "chemistry_spike": "Chemical composition change - indicates potential casing failure or cold water infiltration. Non-condensable gases or chloride spikes are red flags.",
        "none": "All parameters within normal operating ranges for " + asset.type + " in " + asset.rockType + " formation."
    };

    return interpretations[asset.anomalyType] || "Check anomaly flags above for detailed interpretation.";
}

/**
 * Get recommendation for next steps
 */
function getRecommendation(asset) {
    const recommendations = {
        "pressure_drop": [
            "1. Run a caliper log to check for scale deposits",
            "2. Compare WHP against 6-month baseline trend",
            "3. Estimate economic impact: repair cost vs. well depletion timeline",
            "4. Schedule mineral cleaning/scale removal if cost-effective"
        ],
        "temperature_kink": [
            "1. Inspect casing integrity (potential corrosion)",
            "2. Run temperature profile survey to locate kink depth",
            "3. Check for mineral scaling (silica, calcite deposits)",
            "4. Evaluate casing repair vs. well replacement"
        ],
        "chemistry_spike": [
            "1. Test casing integrity immediately (potential failure)",
            "2. Monitor non-condensable gas ratio and chloride levels",
            "3. Check for cold water infiltration into wellbore",
            "4. Run mechanical integrity test (MIT) if not recent"
        ],
        "none": [
            "1. Continue routine monitoring every 30 days",
            "2. Maintain baseline P/T profiles for trending",
            "3. Document any sensor changes for historical comparison",
            "4. No immediate intervention required"
        ]
    };

    return recommendations[asset.anomalyType] || [];
}
