# MacroScope — Global Macroeconomic Dashboard

> A sleek, data-driven dashboard for analysing macroeconomic indicators across G8 economies using **live World Bank API data** — no API key required.

![MacroScope Dashboard](https://img.shields.io/badge/data-World%20Bank%20API-00d4a8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Python + Flask](https://img.shields.io/badge/built%20with-Python%20%2B%20Flask%20%2B%20Chart.js-yellow?style=flat-square)
![No API Key](https://img.shields.io/badge/API%20key-not%20required-brightgreen?style=flat-square)

---

## Features

- **Real-time data** — fetched live from the [World Bank Open Data API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581)
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
- **Rankings table** — all countries side by side
- **Macro Health Score** — composite indicator computed from key metrics
- **Python Flask backend** — proxies World Bank API, serves data via REST endpoints

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/home-made-bloomberg-terminal.git
cd home-made-bloomberg-terminal

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py

# Open http://localhost:5000
```

---

## Project Structure

```
home-made-bloomberg-terminal/
├── app.py                  # Flask backend — API routes & World Bank proxy
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Jinja2 template — app shell & layout
└── static/
    ├── css/
    │   └── style.css       # Design system & Bloomberg Terminal aesthetic
    └── js/
        ├── charts.js       # Chart.js rendering helpers
        └── dashboard.js    # Frontend state, event handling, orchestration
```

---

## API Endpoints

The Flask backend exposes these REST endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /` | Serves the dashboard HTML |
| `GET /api/countries` | Returns the list of tracked countries |
| `GET /api/indicators` | Returns the list of tracked indicators |
| `GET /api/snapshot/<country>` | Latest values for all indicators (one country) |
| `GET /api/timeseries/<country>` | 25-year time series for main indicators |
| `GET /api/crosscountry/<indicator>` | Latest value across all countries |

All data is fetched from the **World Bank Open Data API v2**, which is free and requires no API key.

---

## Macro Health Score

The **Macro Health Score** (0-100) is a composite metric computed as:

```
Score = 50
      + min(25,  GDP_growth  x 3)      // rewards growth
      - min(20,  |inflation - 2| x 4)  // penalises deviation from 2% target
      - min(15,  unemployment x 1.5)   // penalises high unemployment
```

Thresholds: **Strong** >= 70 · **Moderate** >= 50 · **Weak** >= 30 · **Fragile** < 30

---

## Extending the Dashboard

### Add a New Country

In `app.py`, add an entry to `COUNTRIES`:
```python
"ZA": {"name": "South Africa", "flag": "\U0001f1ff\U0001f1e6", "code": "ZA"},
```

### Add a New Indicator

In `app.py`, add an entry to `INDICATORS`:
```python
"povertyRate": {"code": "SI.POV.DDAY", "label": "Poverty Rate (%)", "unit": "%"},
```

---

## Design

The UI is inspired by professional financial terminals (Bloomberg, Refinitiv) with:

- **Dark navy palette** (#060b18 background)
- **Teal/orange accent** system for positive/negative values
- **Syne** display font + **Space Mono** for data/numbers
- CSS Grid layout, responsive down to mobile
- Subtle dot-grid background texture
- Animated KPI cards with sparklines

---

## License

MIT — free to use, modify and distribute.

---

*Data sourced from the World Bank Open Data platform. All values are the most recently published annual figures.*
