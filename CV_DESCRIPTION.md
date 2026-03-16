# CV Description — MacroScope

---

## Short version (1–2 lines)

**MacroScope — Global Macroeconomic Dashboard** | *Vanilla JS, Chart.js, World Bank API*
Built a Bloomberg Terminal-inspired web dashboard tracking 8 macroeconomic indicators across G8 economies, with live World Bank API integration, interactive 25-year time-series charts, cross-country comparison views, and a composite Macro Health Score algorithm — zero npm dependencies, no build step.

---

## Medium version (3–5 bullet points)

**MacroScope — Global Macroeconomic Dashboard** *(Personal Project)*
*Vanilla JavaScript · Chart.js · World Bank Open Data API · CSS Grid · ES Modules*

- Built a fully client-side financial dashboard tracking GDP growth, inflation, unemployment, and 5 further macroeconomic indicators across G8 economies using live World Bank API data — no API key required.
- Designed a modular three-file ES module architecture (api.js / charts.js / dashboard.js) achieving clean separation of concerns without any framework or bundler.
- Implemented parallel `Promise.all()` data fetching with client-side caching, reducing redundant API calls when switching between countries.
- Engineered a composite **Macro Health Score** (0–100) algorithm weighing GDP growth, inflation deviation from the 2% target, and unemployment rate to rank economic performance.
- Created a Bloomberg Terminal-inspired dark UI with responsive CSS Grid layout, staggered entrance animations, Chart.js sparklines, and ranked comparison bar charts.

---

## Long version (full paragraph)

**MacroScope** is a browser-based macroeconomic dashboard I built to deepen my understanding of financial data visualisation and modern web APIs. It pulls live data from the World Bank Open Data API — no authentication required — and renders interactive 25-year time-series charts for eight G8 economies (USA, China, Germany, Japan, UK, India, France, Brazil) across eight indicators including GDP growth, inflation, unemployment, current account balance, government debt, and FDI inflows.

The project is written entirely in vanilla JavaScript using native ES modules, with Chart.js as the only external dependency (loaded via CDN). There is no bundler, no framework, and no build step, demonstrating that well-structured vanilla JS can handle real-world complexity cleanly. The codebase is split into three focused modules — an API layer, a charting layer, and a dashboard controller — keeping responsibilities sharply separated and the code easy to extend.

On the data side I implemented parallel fetching with `Promise.all()` and a client-side cache so country switching is instant after the first load. I also built a **Macro Health Score** — a composite 0–100 metric that translates raw economic data into a single ranked signal, drawing on macroeconomic theory around inflation targets and growth thresholds.

The UI takes visual cues from Bloomberg Terminal: a dark navy palette, monospace data typography, teal/orange positive/negative colouring, and inline sparklines alongside KPI cards. The layout is fully responsive using CSS Grid and Flexbox, and subtle entrance animations give the dashboard a polished feel.
