# 📊 MacroScope — Global Macroeconomic Dashboard

> A sleek, data-driven dashboard for analysing macroeconomic indicators across G8 economies using **live World Bank API data** — no API key required.

![MacroScope Dashboard](https://img.shields.io/badge/data-World%20Bank%20API-00d4a8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/built%20with-Vanilla%20JS%20%2B%20Chart.js-yellow?style=flat-square)
![No API Key](https://img.shields.io/badge/API%20key-not%20required-brightgreen?style=flat-square)

---

## 🌍 Features

- **Real-time data** — fetched live from the [World Bank Open Data API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581) on every page load
- **8 countries tracked** — USA, China, Germany, Japan, UK, India, France, Brazil
- **8 macroeconomic indicators** per country:
  - GDP Growth Rate (annual %)
  - Inflation — Consumer Price Index (annual %)
  - Unemployment Rate (% of labour force)
  - Current Account Balance (% of GDP)
  - Government Debt (% of GDP)
  - Trade Openness (% of GDP)
  - GDP per Capita (constant 2015 USD)
  - FDI Inflows (% of GDP)
- **Interactive charts** — 25-year time series with Chart.js
- **Cross-country comparison** — ranked bar charts with tab switcher
- **Sortable rankings table** — all countries side by side
- **Macro Health Score** — composite indicator computed from key metrics
- **Zero dependencies** — pure ES modules, no bundler, no framework

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/macro-dashboard.git
cd macro-dashboard

# Serve locally (any static server works)
npx serve .
# or
python -m http.server 8080
# then open http://localhost:8080
```

> ⚠️ Must be served over HTTP(S) — opening `index.html` directly in a browser blocks ES module imports.

---

## 📁 Project Structure

```
macro-dashboard/
├── index.html          # App shell & layout
├── css/
│   └── style.css       # Design system & Bloomberg Terminal aesthetic
├── js/
│   ├── api.js          # World Bank API wrapper (fetch + parsing)
│   ├── charts.js       # Chart.js rendering helpers
│   └── dashboard.js    # App state, event handling, orchestration
└── README.md
```

---

## 🔌 API — World Bank Open Data

All data comes from the **World Bank Open Data API v2**, which is:

- ✅ Completely **free**
- ✅ No API key needed
- ✅ CORS-enabled (works from browser)
- ✅ Data updated **annually**

### Example Endpoints Used

| Indicator         | Endpoint |
|-------------------|---------|
| GDP Growth        | `api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.KD.ZG` |
| CPI Inflation     | `api.worldbank.org/v2/country/US/indicator/FP.CPI.TOTL.ZG` |
| Unemployment      | `api.worldbank.org/v2/country/US/indicator/SL.UEM.TOTL.ZS` |
| Current Account   | `api.worldbank.org/v2/country/US/indicator/BN.CAB.XOKA.GD.ZS` |
| Gov. Debt         | `api.worldbank.org/v2/country/US/indicator/GC.DOD.TOTL.GD.ZS` |

Full indicator list: [World Bank Indicators](https://data.worldbank.org/indicator)

---

## 📈 Macro Health Score

The **Macro Health Score** (0–100) is a composite metric computed as:

```
Score = 50
      + min(25,  GDP_growth  × 3)      // rewards growth
      − min(20,  |inflation − 2| × 4)  // penalises deviation from 2% target
      − min(15,  unemployment × 1.5)   // penalises high unemployment
```

Thresholds: **Strong** ≥ 70 · **Moderate** ≥ 50 · **Weak** ≥ 30 · **Fragile** < 30

---

## 🛠 Extending the Dashboard

### Add a New Country

In `js/api.js`, add an entry to `COUNTRIES`:
```js
ZA: { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
```

### Add a New Indicator

In `js/api.js`, add an entry to `INDICATORS`:
```js
povertyRate: { code: 'SI.POV.DDAY', label: 'Poverty Rate (%)', unit: '%' },
```
Then call `fetchIndicator(countryCode, INDICATORS.povertyRate.code)` as needed.

### Use Another Free API

The modular `api.js` makes it easy to swap in:
- [FRED API](https://fred.stlouisfed.org/docs/api/fred/) (US Federal Reserve — free key required)
- [IMF Data API](https://datahelp.imf.org/knowledgebase/articles/667681) (no key)
- [OECD.Stat API](https://stats.oecd.org/SDMX-JSON/data/) (no key)

---

## 🎨 Design

The UI is inspired by professional financial terminals (Bloomberg, Refinitiv) with:

- **Dark navy palette** (#060b18 background)
- **Teal/orange accent** system for positive/negative values
- **Syne** display font + **Space Mono** for data/numbers
- CSS Grid layout, responsive down to mobile
- Subtle dot-grid background texture
- Animated KPI cards with sparklines

---

## 📚 Academic Context

This project demonstrates:

1. **API integration** — RESTful JSON consumption, async/await, error handling
2. **Data visualisation** — time series, bar comparisons, sparklines
3. **Macroeconomic analysis** — GDP, inflation, unemployment, BoP, fiscal metrics
4. **Software architecture** — separation of concerns (api / charts / dashboard)
5. **Performance** — client-side data caching, parallel fetch with `Promise.all`

---

## 📄 License

MIT © 2024 — free to use, modify and distribute.

---

*Data sourced from the World Bank Open Data platform. All values are the most recently published annual figures.*
