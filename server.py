#!/usr/bin/env python3
"""
LithoHub Backend Server
Serves static files + computes real-time anomaly detection
"""

import json
import math
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import sys

class LithoHubHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler with anomaly detection API"""

    STATIC_DIR = Path(__file__).parent

    def do_GET(self):
        if self.path.startswith('/api/anomalies/'):
            asset_id = self.path.split('/')[-1]
            self.handle_anomaly_request(asset_id)
            return

        if self.path == '/api/assets':
            self.handle_assets_request()
            return

        super().do_GET()

    def handle_anomaly_request(self, asset_id):
        try:
            assets_path = self.STATIC_DIR / 'data' / 'assets.json'
            if not assets_path.exists():
                assets_path = self.STATIC_DIR / 'assets.json'

            with open(assets_path, 'r') as f:
                assets = json.load(f)

            asset = next((a for a in assets if a['id'] == asset_id), None)
            if not asset:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Asset not found"}).encode())
                return

            anomaly_result = self.compute_anomalies(asset)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(anomaly_result).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_assets_request(self):
        try:
            assets_path = self.STATIC_DIR / 'data' / 'assets.json'
            if not assets_path.exists():
                assets_path = self.STATIC_DIR / 'assets.json'

            with open(assets_path, 'r') as f:
                assets = json.load(f)

            for asset in assets:
                asset['computedAnomaly'] = self.compute_anomalies(asset)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(assets).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    @staticmethod
    def _mean(values):
        return sum(values) / len(values)

    @staticmethod
    def _std(values, m):
        return math.sqrt(sum((x - m) ** 2 for x in values) / len(values))

    @staticmethod
    def compute_anomalies(asset):
        """
        Compute statistical anomalies for an asset.
        Flags deviations > 1.5σ from 90-day baseline.

        Returns:
        {
            "hasAnomaly": bool,
            "anomalyFlags": [...],
            "summary": str,
            "recommendation": str
        }
        """
        result = {
            "hasAnomaly": False,
            "anomalyFlags": [],
            "summary": "No anomalies detected",
            "recommendation": "Continue routine monitoring"
        }

        historical = asset.get('historicalData')
        if not historical:
            return result

        whp_values = historical.get('whp', [])
        if not whp_values:
            return result

        SIGMA_THRESHOLD = 1.5

        # ── WHP ──────────────────────────────────────────────────────────────
        whp_mean = LithoHubHandler._mean(whp_values)
        whp_std  = LithoHubHandler._std(whp_values, whp_mean)
        current_whp = asset.get('currentWHP', whp_values[-1])
        whp_deviation = abs(current_whp - whp_mean) / (whp_std + 0.001)

        if whp_deviation > SIGMA_THRESHOLD:
            percent_change = ((current_whp - whp_mean) / whp_mean) * 100
            result["anomalyFlags"].append({
                "type": "pressure",
                "metric": "Wellhead Pressure",
                "deviation": round(whp_deviation, 2),
                "value": current_whp,
                "baseline": round(whp_mean, 1),
                "percentChange": round(percent_change, 1),
                "status": "ANOMALY",
                "interpretation": f"WHP is {whp_deviation:.1f}σ from baseline — possible scale blockage or reservoir depletion"
            })
            result["hasAnomaly"] = True
            result["summary"] = f"⚠️ WHP dropped {abs(percent_change):.1f}% vs 90-day baseline"
            result["recommendation"] = "Run caliper log; check for mineral scaling; compare reservoir pressure history"

        # ── Temperature ───────────────────────────────────────────────────────
        temp_values = historical.get('temperature', [])
        if temp_values:
            temp_mean = LithoHubHandler._mean(temp_values)
            temp_std  = LithoHubHandler._std(temp_values, temp_mean)
            current_temp = asset.get('currentTemp', temp_values[-1])
            temp_deviation = abs(current_temp - temp_mean) / (temp_std + 0.001)

            if temp_deviation > SIGMA_THRESHOLD:
                percent_change = ((current_temp - temp_mean) / temp_mean) * 100
                result["anomalyFlags"].append({
                    "type": "temperature",
                    "metric": "Temperature",
                    "deviation": round(temp_deviation, 2),
                    "value": current_temp,
                    "baseline": round(temp_mean, 1),
                    "percentChange": round(percent_change, 1),
                    "status": "ANOMALY",
                    "interpretation": f"Temperature kink {temp_deviation:.1f}σ from baseline — inspect for corrosion or partial blockage"
                })
                result["hasAnomaly"] = True
                result["summary"] = "⚠️ Temperature gradient anomaly (potential corrosion or partial blockage)"
                result["recommendation"] = "Inspect casing integrity; check for internal scaling or corrosion"

        # ── Chemistry: numeric chloride ppm (chemistry_chlorides) ────────────
        # Uses first 30 readings as baseline; compares last reading against that.
        # Old string-based 'chemistry' field is no longer used.
        chloride_values = historical.get('chemistry_chlorides', [])
        if len(chloride_values) >= 30:
            early_baseline = LithoHubHandler._mean(chloride_values[:30])
            recent_chloride = chloride_values[-1]
            chem_pct = ((recent_chloride - early_baseline) / early_baseline) * 100

            if chem_pct > 20:  # >20% rise from early baseline
                result["anomalyFlags"].append({
                    "type": "chemistry",
                    "metric": "Chloride Concentration",
                    "deviation": round(chem_pct / 10, 2),   # normalised for display
                    "value": f"{recent_chloride} ppm",
                    "baseline": f"{round(early_baseline, 0):.0f} ppm",
                    "percentChange": round(chem_pct, 1),
                    "status": "ANOMALY",
                    "interpretation": (
                        f"Chlorides {chem_pct:.0f}% above early baseline — "
                        "potential casing failure or cold water infiltration"
                    )
                })
                result["hasAnomaly"] = True
                result["summary"] = "⚠️ Chemical signature change — chloride spike detected"
                result["recommendation"] = (
                    "Test casing integrity immediately; run mechanical integrity test (MIT)"
                )

        return result

    def log_message(self, format, *args):
        pass  # suppress default access log noise


def run_server(port=8000):
    address = ('localhost', port)
    httpd = HTTPServer(address, LithoHubHandler)
    print(f"🪨 LithoHub Server running on http://localhost:{port}")
    print(f"   Static files : {LithoHubHandler.STATIC_DIR}")
    print(f"   API endpoints: /api/assets  |  /api/anomalies/<asset-id>")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
    