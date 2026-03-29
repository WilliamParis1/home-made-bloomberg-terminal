"""
MacroScope - Global Macroeconomic Dashboard
Flask backend that proxies World Bank API data.
"""

import requests
from flask import Flask, render_template, jsonify

app = Flask(__name__)

WB_BASE = "https://api.worldbank.org/v2"

INDICATORS = {
    "gdpGrowth":      {"code": "NY.GDP.MKTP.KD.ZG",    "label": "GDP Growth (%)",          "unit": "%"},
    "inflation":       {"code": "FP.CPI.TOTL.ZG",       "label": "Inflation, CPI (%)",      "unit": "%"},
    "unemployment":    {"code": "SL.UEM.TOTL.ZS",       "label": "Unemployment Rate (%)",   "unit": "%"},
    "currentAccount":  {"code": "BN.CAB.XOKA.GD.ZS",   "label": "Current Account (% GDP)", "unit": "%"},
    "govDebt":         {"code": "GC.DOD.TOTL.GD.ZS",   "label": "Gov. Debt (% GDP)",       "unit": "%"},
    "tradeOpenness":   {"code": "NE.TRD.GNFS.ZS",      "label": "Trade Openness (% GDP)",  "unit": "%"},
    "gdpPerCapita":    {"code": "NY.GDP.PCAP.KD",       "label": "GDP per Capita (USD)",    "unit": "$"},
    "fdi":             {"code": "BX.KLT.DINV.WD.GD.ZS", "label": "FDI Inflows (% GDP)",    "unit": "%"},
}

COUNTRIES = {
    "US": {"name": "United States",  "flag": "\U0001f1fa\U0001f1f8", "code": "US"},
    "CN": {"name": "China",          "flag": "\U0001f1e8\U0001f1f3", "code": "CN"},
    "DE": {"name": "Germany",        "flag": "\U0001f1e9\U0001f1ea", "code": "DE"},
    "JP": {"name": "Japan",          "flag": "\U0001f1ef\U0001f1f5", "code": "JP"},
    "GB": {"name": "United Kingdom", "flag": "\U0001f1ec\U0001f1e7", "code": "GB"},
    "IN": {"name": "India",          "flag": "\U0001f1ee\U0001f1f3", "code": "IN"},
    "FR": {"name": "France",         "flag": "\U0001f1eb\U0001f1f7", "code": "FR"},
    "BR": {"name": "Brazil",         "flag": "\U0001f1e7\U0001f1f7", "code": "BR"},
}


def fetch_indicator(country_code, indicator_code, years=20):
    """Fetch a single indicator time series for one country."""
    url = f"{WB_BASE}/country/{country_code}/indicator/{indicator_code}"
    params = {"format": "json", "per_page": years, "mrv": years}
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    payload = resp.json()

    if len(payload) < 2 or payload[1] is None:
        return []

    data = payload[1]
    results = []
    for d in data:
        if d["value"] is not None:
            results.append({"year": d["date"], "value": round(float(d["value"]), 2)})

    results.sort(key=lambda x: int(x["year"]))
    return results


def fetch_cross_country(indicator_code):
    """Fetch latest value for all countries for one indicator."""
    codes = ";".join(COUNTRIES.keys())
    url = f"{WB_BASE}/country/{codes}/indicator/{indicator_code}"
    params = {"format": "json", "per_page": 1, "mrv": 1}
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    payload = resp.json()

    if len(payload) < 2 or payload[1] is None:
        return {}

    result = {}
    for item in payload[1]:
        if item["value"] is not None:
            cc = (item.get("countryiso3code") or item["country"]["id"])[:2]
            result[cc] = {
                "value": round(float(item["value"]), 2),
                "year": item["date"],
            }
    return result


# ── Routes ──────────────────────────────────────────────────────────────────


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/countries")
def api_countries():
    return jsonify(COUNTRIES)


@app.route("/api/indicators")
def api_indicators():
    return jsonify(INDICATORS)


@app.route("/api/snapshot/<country_code>")
def api_snapshot(country_code):
    """Fetch latest values for all indicators for one country."""
    if country_code not in COUNTRIES:
        return jsonify({"error": "Unknown country"}), 404

    snapshot = {}
    for key, ind in INDICATORS.items():
        try:
            data = fetch_indicator(country_code, ind["code"], years=2)
            snapshot[key] = data[-1] if data else None
        except Exception:
            snapshot[key] = None
    return jsonify(snapshot)


@app.route("/api/timeseries/<country_code>")
def api_timeseries(country_code):
    """Fetch 25-year time series for main indicators."""
    if country_code not in COUNTRIES:
        return jsonify({"error": "Unknown country"}), 404

    series_keys = ["gdpGrowth", "inflation", "unemployment", "currentAccount"]
    series = {}
    for key in series_keys:
        try:
            series[key] = fetch_indicator(country_code, INDICATORS[key]["code"], years=25)
        except Exception:
            series[key] = []
    return jsonify(series)


@app.route("/api/crosscountry/<indicator_key>")
def api_crosscountry(indicator_key):
    """Fetch cross-country comparison for one indicator."""
    if indicator_key not in INDICATORS:
        return jsonify({"error": "Unknown indicator"}), 404

    try:
        data = fetch_cross_country(INDICATORS[indicator_key]["code"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
