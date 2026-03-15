/**
 * dashboard.js — Main application controller
 */

import {
  COUNTRIES, INDICATORS,
  fetchCountrySnapshot, fetchCountryTimeSeries, fetchCrossCountry
} from './api.js';

import {
  renderGdpChart, renderInflationChart,
  renderUnemploymentChart, renderCurrentAccountChart,
  renderComparisonChart, renderSparkline,
  COUNTRY_COLORS, COLORS
} from './charts.js';

// ── STATE ───────────────────────────────────────────────────────────────────
const state = {
  activeCountry: 'US',
  snapshots:     {},   // { US: { gdpGrowth: {value, year}, ... } }
  timeSeries:    {},   // { US: { gdpGrowth: [...], ... } }
  crossCountry:  {},   // { gdpGrowth: { US: {value, year}, ... } }
  activeCompare: 'gdpGrowth',
};

// ── DOM HELPERS ─────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function setLoading(show) {
  const overlay = $('loadingOverlay');
  if (show) overlay.classList.remove('hidden');
  else      overlay.classList.add('hidden');
}

function showError(msg) {
  const toast = $('errorToast');
  toast.textContent = '⚠ ' + msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

function fmt(val, digits = 2) {
  if (val === null || val === undefined) return '—';
  return val.toFixed(digits);
}

function changeClass(val) {
  if (val === null || val === undefined) return 'neu';
  return val > 0 ? 'pos' : val < 0 ? 'neg' : 'neu';
}

function changeArrow(val) {
  if (val === null || val === undefined) return '';
  return val > 0 ? '▲' : val < 0 ? '▼' : '—';
}

// ── RENDER KPI CARDS ────────────────────────────────────────────────────────
function renderKPIs(countryCode) {
  const snap = state.snapshots[countryCode];
  const ts   = state.timeSeries[countryCode];
  if (!snap) return;

  const cards = [
    {
      id: 'kpiGdp',
      key: 'gdpGrowth',
      label: 'GDP Growth',
      unit: '%',
      color: 'teal',
      icon: '📈',
      sparkId: 'sparkGdp',
      sparkColor: COLORS.teal,
    },
    {
      id: 'kpiInflation',
      key: 'inflation',
      label: 'Inflation (CPI)',
      unit: '%',
      color: 'orange',
      icon: '💹',
      sparkId: 'sparkInflation',
      sparkColor: COLORS.orange,
    },
    {
      id: 'kpiUnemployment',
      key: 'unemployment',
      label: 'Unemployment',
      unit: '%',
      color: 'blue',
      icon: '👥',
      sparkId: 'sparkUnemployment',
      sparkColor: COLORS.blue,
    },
    {
      id: 'kpiCurrentAccount',
      key: 'currentAccount',
      label: 'Current Account',
      unit: '% GDP',
      color: 'yellow',
      icon: '⚖️',
      sparkId: 'sparkCurrentAccount',
      sparkColor: COLORS.yellow,
    },
  ];

  for (const card of cards) {
    const d = snap[card.key];
    const valEl = document.querySelector(`#${card.id} .kpi-value`);
    const subEl = document.querySelector(`#${card.id} .kpi-year`);
    const chgEl = document.querySelector(`#${card.id} .kpi-change`);

    if (!d) {
      if (valEl) valEl.textContent = '—';
      continue;
    }

    if (valEl) valEl.textContent = fmt(d.value) + card.unit;
    if (subEl) subEl.textContent = d.year;

    // compute YoY change from time series
    const series = ts?.[card.key] ?? [];
    if (series.length >= 2 && chgEl) {
      const prev = series.at(-2)?.value;
      const curr = series.at(-1)?.value;
      const diff = curr !== undefined && prev !== undefined ? parseFloat((curr - prev).toFixed(2)) : null;
      chgEl.textContent = diff !== null ? `${changeArrow(diff)} ${Math.abs(diff).toFixed(2)}pp` : '';
      chgEl.className = `kpi-change ${changeClass(diff)}`;
    }

    // sparkline
    if (series.length > 2 && card.sparkId) {
      renderSparkline(card.sparkId, series.slice(-10), card.sparkColor);
    }
  }
}

// ── RENDER MAIN CHARTS ───────────────────────────────────────────────────────
function renderCharts(countryCode) {
  const ts = state.timeSeries[countryCode];
  if (!ts) return;

  if (ts.gdpGrowth?.length)      renderGdpChart('chartGdp', ts.gdpGrowth);
  if (ts.inflation?.length)      renderInflationChart('chartInflation', ts.inflation);
  if (ts.unemployment?.length)   renderUnemploymentChart('chartUnemployment', ts.unemployment);
  if (ts.currentAccount?.length) renderCurrentAccountChart('chartCurrentAccount', ts.currentAccount);
}

// ── RENDER COMPARISON CHART ──────────────────────────────────────────────────
function renderComparison(indicatorKey) {
  const data = state.crossCountry[indicatorKey];
  if (!data) return;
  const label = INDICATORS[indicatorKey]?.label ?? indicatorKey;
  renderComparisonChart('chartCompare', data, label);
  state.activeCompare = indicatorKey;

  // update active tab
  $$('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.key === indicatorKey);
  });
}

// ── RENDER COMPARISON TABLE ──────────────────────────────────────────────────
function renderTable() {
  const tbody = $('compTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  const countries = Object.keys(COUNTRIES);
  const rows = countries.map(cc => {
    const gdp  = state.crossCountry.gdpGrowth?.[cc]?.value;
    const inf  = state.crossCountry.inflation?.[cc]?.value;
    const unem = state.crossCountry.unemployment?.[cc]?.value;
    const ca   = state.crossCountry.currentAccount?.[cc]?.value;
    const debt = state.crossCountry.govDebt?.[cc]?.value;
    return { cc, gdp, inf, unem, ca, debt };
  }).sort((a,b) => (b.gdp ?? -99) - (a.gdp ?? -99));

  const maxGdp = Math.max(...rows.map(r => Math.abs(r.gdp ?? 0)));

  rows.forEach((row, i) => {
    const { cc, gdp, inf, unem, ca, debt } = row;
    const country = COUNTRIES[cc];
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const barW = maxGdp > 0 ? Math.max(0, ((gdp ?? 0) / maxGdp) * 100) : 0;
    const barColor = (gdp ?? 0) >= 0 ? COUNTRY_COLORS[cc] ?? '#4a9eff' : '#ff4d6d';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${i+1}</span></td>
      <td>
        <div class="country-cell">
          <span>${country.flag}</span>
          <span>${country.name}</span>
        </div>
      </td>
      <td class="num" style="color:${(gdp??0)>=0?'var(--teal)':'var(--red)'}">
        ${gdp !== undefined ? fmt(gdp)+'%' : '—'}
      </td>
      <td class="num">${inf !== undefined ? fmt(inf)+'%' : '—'}</td>
      <td class="num">${unem !== undefined ? fmt(unem)+'%' : '—'}</td>
      <td class="num" style="color:${(ca??0)>=0?'var(--teal)':'var(--red)'}">
        ${ca !== undefined ? fmt(ca)+'%' : '—'}
      </td>
      <td class="num">${debt !== undefined ? fmt(debt)+'%' : '—'}</td>
      <td class="bar-cell">
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${barW}%;background:${barColor}"></div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── RENDER STATS PANELS ──────────────────────────────────────────────────────
function renderStatPanels(countryCode) {
  const snap = state.snapshots[countryCode];
  const cross = state.crossCountry;
  if (!snap) return;

  // Macro health panel
  const healthEl = $('macroHealth');
  if (healthEl) {
    const gdpVal  = snap.gdpGrowth?.value;
    const infVal  = snap.inflation?.value;
    const unemVal = snap.unemployment?.value;

    let score = 50;
    if (gdpVal  !== null && gdpVal  !== undefined) score += Math.min(25, gdpVal  * 3);
    if (infVal  !== null && infVal  !== undefined) score -= Math.min(20, Math.abs(infVal - 2) * 4);
    if (unemVal !== null && unemVal !== undefined) score -= Math.min(15, unemVal * 1.5);
    score = Math.round(Math.max(0, Math.min(100, score)));

    const healthLabel = score >= 70 ? 'Strong'
                      : score >= 50 ? 'Moderate'
                      : score >= 30 ? 'Weak'
                      : 'Fragile';
    const healthColor = score >= 70 ? 'var(--teal)'
                      : score >= 50 ? 'var(--yellow)'
                      : 'var(--red)';

    healthEl.innerHTML = `
      <div class="stat-row"><span class="stat-name">Economy Score</span>
        <span class="stat-val" style="color:${healthColor};font-size:1.2rem">${score}/100</span></div>
      <div class="stat-row"><span class="stat-name">Status</span>
        <span class="stat-val" style="color:${healthColor}">${healthLabel}</span></div>
      <div class="stat-row"><span class="stat-name">Gov. Debt</span>
        <span class="stat-val">${snap.govDebt?.value != null ? fmt(snap.govDebt.value)+'% GDP' : '—'}</span></div>
      <div class="stat-row"><span class="stat-name">Trade Openness</span>
        <span class="stat-val">${snap.tradeOpenness?.value != null ? fmt(snap.tradeOpenness.value)+'% GDP' : '—'}</span></div>
      <div class="stat-row"><span class="stat-name">FDI Inflows</span>
        <span class="stat-val">${snap.fdi?.value != null ? fmt(snap.fdi.value)+'% GDP' : '—'}</span></div>
    `;
  }

  // World rankings panel
  const rankEl = $('worldRanking');
  if (rankEl) {
    const metrics = [
      { key: 'gdpGrowth', label: 'GDP Growth' },
      { key: 'gdpPerCapita', label: 'GDP per Capita' },
      { key: 'unemployment', label: 'Unemployment', inverse: true },
      { key: 'inflation', label: 'Inflation', inverse: true },
    ];
    let html = '';
    for (const m of metrics) {
      const cd = cross[m.key];
      if (!cd) { html += `<div class="stat-row"><span class="stat-name">${m.label}</span><span class="stat-val">—</span></div>`; continue; }
      const sorted = Object.entries(cd).sort((a,b) =>
        m.inverse ? a[1].value - b[1].value : b[1].value - a[1].value);
      const rank = sorted.findIndex(([cc]) => cc === countryCode || cc === countryCode + 'X') + 1;
      html += `<div class="stat-row"><span class="stat-name">${m.label}</span>
        <span class="stat-val">${rank > 0 ? `#${rank} of ${sorted.length}` : '—'}</span></div>`;
    }
    rankEl.innerHTML = html;
  }

  // Latest data year panel
  const dataEl = $('dataRecency');
  if (dataEl) {
    const keys = ['gdpGrowth','inflation','unemployment','currentAccount','govDebt'];
    const labels = ['GDP Growth','Inflation','Unemployment','Current Account','Gov. Debt'];
    let html = '';
    keys.forEach((k, i) => {
      const d = snap[k];
      html += `<div class="stat-row">
        <span class="stat-name">${labels[i]}</span>
        <span class="stat-val" style="color:var(--teal)">${d?.year ?? '—'}</span>
      </div>`;
    });
    dataEl.innerHTML = html;
  }
}

// ── COUNTRY SWITCH ───────────────────────────────────────────────────────────
async function switchCountry(countryCode) {
  state.activeCountry = countryCode;

  // Update button states
  $$('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cc === countryCode);
  });

  // Update country header
  const c = COUNTRIES[countryCode];
  const headerEl = $('countryHeader');
  if (headerEl) {
    headerEl.textContent = `${c.flag} ${c.name}`;
  }

  // If data already cached, just re-render
  if (state.snapshots[countryCode] && state.timeSeries[countryCode]) {
    renderKPIs(countryCode);
    renderCharts(countryCode);
    renderStatPanels(countryCode);
    return;
  }

  // Fetch data
  setLoading(true);
  try {
    const [snap, ts] = await Promise.all([
      fetchCountrySnapshot(countryCode),
      fetchCountryTimeSeries(countryCode),
    ]);
    state.snapshots[countryCode]  = snap;
    state.timeSeries[countryCode] = ts;

    renderKPIs(countryCode);
    renderCharts(countryCode);
    renderStatPanels(countryCode);
  } catch (e) {
    showError('Failed to load data for ' + c.name + '. ' + e.message);
  } finally {
    setLoading(false);
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  setLoading(true);

  // Build country buttons
  const countryBar = $('countryBar');
  if (countryBar) {
    Object.entries(COUNTRIES).forEach(([cc, c]) => {
      const btn = document.createElement('button');
      btn.className = 'country-btn' + (cc === 'US' ? ' active' : '');
      btn.dataset.cc = cc;
      btn.innerHTML = `<span class="flag">${c.flag}</span>${cc}`;
      btn.addEventListener('click', () => switchCountry(cc));
      countryBar.appendChild(btn);
    });
  }

  // Build compare tabs
  const tabGroup = $('compareTabGroup');
  if (tabGroup) {
    const tabs = [
      { key: 'gdpGrowth',    label: 'GDP Growth' },
      { key: 'inflation',    label: 'Inflation'   },
      { key: 'unemployment', label: 'Unemployment'},
      { key: 'currentAccount', label: 'Curr. Account'},
      { key: 'govDebt',      label: 'Gov. Debt' },
    ];
    tabs.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (key === 'gdpGrowth' ? ' active' : '');
      btn.dataset.key = key;
      btn.textContent = label;
      btn.addEventListener('click', () => renderComparison(key));
      tabGroup.appendChild(btn);
    });
  }

  try {
    // Fetch initial data in parallel
    const [snap, ts, ...crossAll] = await Promise.all([
      fetchCountrySnapshot('US'),
      fetchCountryTimeSeries('US'),
      ...['gdpGrowth','inflation','unemployment','currentAccount','govDebt','gdpPerCapita'].map(
        key => fetchCrossCountry(INDICATORS[key].code)
          .then(d => ({ key, d }))
          .catch(() => ({ key, d: {} }))
      ),
    ]);

    state.snapshots.US  = snap;
    state.timeSeries.US = ts;
    for (const { key, d } of crossAll) state.crossCountry[key] = d;

    renderKPIs('US');
    renderCharts('US');
    renderComparison('gdpGrowth');
    renderTable();
    renderStatPanels('US');

    // Update timestamp
    const tsEl = $('lastUpdated');
    if (tsEl) tsEl.textContent = `Data fetched: ${new Date().toUTCString()}`;

  } catch (e) {
    showError('Initialisation failed: ' + e.message);
    console.error(e);
  } finally {
    setLoading(false);
  }
}

// ── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
