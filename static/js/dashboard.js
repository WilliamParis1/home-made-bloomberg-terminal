/**
 * dashboard.js — Main application controller
 * Fetches data from the Flask backend API.
 */

(function () {

  // ── CONSTANTS (loaded from backend) ──────────────────────────────────────
  var COUNTRIES = {};
  var INDICATORS = {};

  // ── STATE ────────────────────────────────────────────────────────────────
  var state = {
    activeCountry: 'US',
    snapshots:     {},
    timeSeries:    {},
    crossCountry:  {},
    activeCompare: 'gdpGrowth',
  };

  // ── DOM HELPERS ──────────────────────────────────────────────────────────
  var $ = function (id) { return document.getElementById(id); };

  function setLoading(show) {
    var overlay = $('loadingOverlay');
    if (show) overlay.classList.remove('hidden');
    else      overlay.classList.add('hidden');
  }

  function showError(msg) {
    var toast = $('errorToast');
    toast.textContent = '\u26a0 ' + msg;
    toast.style.display = 'block';
    setTimeout(function () { toast.style.display = 'none'; }, 5000);
  }

  function fmt(val, digits) {
    digits = digits !== undefined ? digits : 2;
    if (val === null || val === undefined) return '\u2014';
    return val.toFixed(digits);
  }

  function changeClass(val) {
    if (val === null || val === undefined) return 'neu';
    return val > 0 ? 'pos' : val < 0 ? 'neg' : 'neu';
  }

  function changeArrow(val) {
    if (val === null || val === undefined) return '';
    return val > 0 ? '\u25b2' : val < 0 ? '\u25bc' : '\u2014';
  }

  // ── API HELPERS ──────────────────────────────────────────────────────────
  function apiGet(path) {
    return fetch('/api/' + path)
      .then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      });
  }

  // ── RENDER KPI CARDS ─────────────────────────────────────────────────────
  function renderKPIs(countryCode) {
    var snap = state.snapshots[countryCode];
    var ts   = state.timeSeries[countryCode];
    if (!snap) return;

    var cards = [
      { id: 'kpiGdp',            key: 'gdpGrowth',      unit: '%',     sparkId: 'sparkGdp',            sparkColor: Charts.COLORS.teal },
      { id: 'kpiInflation',      key: 'inflation',       unit: '%',     sparkId: 'sparkInflation',      sparkColor: Charts.COLORS.orange },
      { id: 'kpiUnemployment',   key: 'unemployment',    unit: '%',     sparkId: 'sparkUnemployment',   sparkColor: Charts.COLORS.blue },
      { id: 'kpiCurrentAccount', key: 'currentAccount',  unit: '% GDP', sparkId: 'sparkCurrentAccount', sparkColor: Charts.COLORS.yellow },
    ];

    cards.forEach(function (card) {
      var d = snap[card.key];
      var valEl = document.querySelector('#' + card.id + ' .kpi-value');
      var subEl = document.querySelector('#' + card.id + ' .kpi-year');
      var chgEl = document.querySelector('#' + card.id + ' .kpi-change');

      if (!d) {
        if (valEl) valEl.textContent = '\u2014';
        return;
      }

      if (valEl) valEl.textContent = fmt(d.value) + card.unit;
      if (subEl) subEl.textContent = d.year;

      var series = (ts && ts[card.key]) ? ts[card.key] : [];
      if (series.length >= 2 && chgEl) {
        var prev = series[series.length - 2] ? series[series.length - 2].value : undefined;
        var curr = series[series.length - 1] ? series[series.length - 1].value : undefined;
        var diff = (curr !== undefined && prev !== undefined) ? parseFloat((curr - prev).toFixed(2)) : null;
        chgEl.textContent = diff !== null ? changeArrow(diff) + ' ' + Math.abs(diff).toFixed(2) + 'pp' : '';
        chgEl.className = 'kpi-change ' + changeClass(diff);
      }

      if (series.length > 2 && card.sparkId) {
        Charts.renderSparkline(card.sparkId, series.slice(-10), card.sparkColor);
      }
    });
  }

  // ── RENDER MAIN CHARTS ───────────────────────────────────────────────────
  function renderCharts(countryCode) {
    var ts = state.timeSeries[countryCode];
    if (!ts) return;

    if (ts.gdpGrowth && ts.gdpGrowth.length)           Charts.renderGdpChart('chartGdp', ts.gdpGrowth);
    if (ts.inflation && ts.inflation.length)             Charts.renderInflationChart('chartInflation', ts.inflation);
    if (ts.unemployment && ts.unemployment.length)       Charts.renderUnemploymentChart('chartUnemployment', ts.unemployment);
    if (ts.currentAccount && ts.currentAccount.length)   Charts.renderCurrentAccountChart('chartCurrentAccount', ts.currentAccount);
  }

  // ── RENDER COMPARISON CHART ──────────────────────────────────────────────
  function renderComparison(indicatorKey) {
    var data = state.crossCountry[indicatorKey];
    if (!data) return;
    var label = (INDICATORS[indicatorKey] && INDICATORS[indicatorKey].label) || indicatorKey;
    Charts.renderComparisonChart('chartCompare', data, label);
    state.activeCompare = indicatorKey;

    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.key === indicatorKey);
    });
  }

  // ── RENDER COMPARISON TABLE ──────────────────────────────────────────────
  function renderTable() {
    var tbody = $('compTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    var countries = Object.keys(COUNTRIES);
    var rows = countries.map(function (cc) {
      return {
        cc:   cc,
        gdp:  state.crossCountry.gdpGrowth      && state.crossCountry.gdpGrowth[cc]      ? state.crossCountry.gdpGrowth[cc].value      : undefined,
        inf:  state.crossCountry.inflation       && state.crossCountry.inflation[cc]       ? state.crossCountry.inflation[cc].value       : undefined,
        unem: state.crossCountry.unemployment    && state.crossCountry.unemployment[cc]    ? state.crossCountry.unemployment[cc].value    : undefined,
        ca:   state.crossCountry.currentAccount  && state.crossCountry.currentAccount[cc]  ? state.crossCountry.currentAccount[cc].value  : undefined,
        debt: state.crossCountry.govDebt         && state.crossCountry.govDebt[cc]         ? state.crossCountry.govDebt[cc].value         : undefined,
      };
    }).sort(function (a, b) { return (b.gdp || -99) - (a.gdp || -99); });

    var maxGdp = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.gdp || 0); }));

    rows.forEach(function (row, i) {
      var cc = row.cc;
      var country = COUNTRIES[cc];
      var rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      var barW = maxGdp > 0 ? Math.max(0, ((row.gdp || 0) / maxGdp) * 100) : 0;
      var barColor = (row.gdp || 0) >= 0 ? (Charts.COUNTRY_COLORS[cc] || '#4a9eff') : '#ff4d6d';

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="rank-badge ' + rankClass + '">' + (i+1) + '</span></td>' +
        '<td><div class="country-cell"><span>' + country.flag + '</span><span>' + country.name + '</span></div></td>' +
        '<td class="num" style="color:' + ((row.gdp||0)>=0 ? 'var(--teal)' : 'var(--red)') + '">' +
          (row.gdp !== undefined ? fmt(row.gdp)+'%' : '\u2014') + '</td>' +
        '<td class="num">' + (row.inf !== undefined ? fmt(row.inf)+'%' : '\u2014') + '</td>' +
        '<td class="num">' + (row.unem !== undefined ? fmt(row.unem)+'%' : '\u2014') + '</td>' +
        '<td class="num" style="color:' + ((row.ca||0)>=0 ? 'var(--teal)' : 'var(--red)') + '">' +
          (row.ca !== undefined ? fmt(row.ca)+'%' : '\u2014') + '</td>' +
        '<td class="num">' + (row.debt !== undefined ? fmt(row.debt)+'%' : '\u2014') + '</td>' +
        '<td class="bar-cell"><div class="mini-bar-track"><div class="mini-bar-fill" style="width:' + barW + '%;background:' + barColor + '"></div></div></td>';
      tbody.appendChild(tr);
    });
  }

  // ── RENDER STATS PANELS ──────────────────────────────────────────────────
  function renderStatPanels(countryCode) {
    var snap = state.snapshots[countryCode];
    var cross = state.crossCountry;
    if (!snap) return;

    // Macro health panel
    var healthEl = $('macroHealth');
    if (healthEl) {
      var gdpVal  = snap.gdpGrowth  ? snap.gdpGrowth.value  : null;
      var infVal  = snap.inflation   ? snap.inflation.value   : null;
      var unemVal = snap.unemployment ? snap.unemployment.value : null;

      var score = 50;
      if (gdpVal  !== null && gdpVal  !== undefined) score += Math.min(25, gdpVal  * 3);
      if (infVal  !== null && infVal  !== undefined) score -= Math.min(20, Math.abs(infVal - 2) * 4);
      if (unemVal !== null && unemVal !== undefined) score -= Math.min(15, unemVal * 1.5);
      score = Math.round(Math.max(0, Math.min(100, score)));

      var healthLabel = score >= 70 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 30 ? 'Weak' : 'Fragile';
      var healthColor = score >= 70 ? 'var(--teal)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';

      healthEl.innerHTML =
        '<div class="stat-row"><span class="stat-name">Economy Score</span>' +
          '<span class="stat-val" style="color:' + healthColor + ';font-size:1.2rem">' + score + '/100</span></div>' +
        '<div class="stat-row"><span class="stat-name">Status</span>' +
          '<span class="stat-val" style="color:' + healthColor + '">' + healthLabel + '</span></div>' +
        '<div class="stat-row"><span class="stat-name">Gov. Debt</span>' +
          '<span class="stat-val">' + (snap.govDebt && snap.govDebt.value != null ? fmt(snap.govDebt.value) + '% GDP' : '\u2014') + '</span></div>' +
        '<div class="stat-row"><span class="stat-name">Trade Openness</span>' +
          '<span class="stat-val">' + (snap.tradeOpenness && snap.tradeOpenness.value != null ? fmt(snap.tradeOpenness.value) + '% GDP' : '\u2014') + '</span></div>' +
        '<div class="stat-row"><span class="stat-name">FDI Inflows</span>' +
          '<span class="stat-val">' + (snap.fdi && snap.fdi.value != null ? fmt(snap.fdi.value) + '% GDP' : '\u2014') + '</span></div>';
    }

    // World rankings panel
    var rankEl = $('worldRanking');
    if (rankEl) {
      var metrics = [
        { key: 'gdpGrowth', label: 'GDP Growth' },
        { key: 'gdpPerCapita', label: 'GDP per Capita' },
        { key: 'unemployment', label: 'Unemployment', inverse: true },
        { key: 'inflation', label: 'Inflation', inverse: true },
      ];
      var html = '';
      metrics.forEach(function (m) {
        var cd = cross[m.key];
        if (!cd) {
          html += '<div class="stat-row"><span class="stat-name">' + m.label + '</span><span class="stat-val">\u2014</span></div>';
          return;
        }
        var sorted = Object.entries(cd).sort(function (a, b) {
          return m.inverse ? a[1].value - b[1].value : b[1].value - a[1].value;
        });
        var rank = sorted.findIndex(function (e) { return e[0] === countryCode; }) + 1;
        html += '<div class="stat-row"><span class="stat-name">' + m.label + '</span>' +
          '<span class="stat-val">' + (rank > 0 ? '#' + rank + ' of ' + sorted.length : '\u2014') + '</span></div>';
      });
      rankEl.innerHTML = html;
    }

    // Latest data year panel
    var dataEl = $('dataRecency');
    if (dataEl) {
      var keys = ['gdpGrowth','inflation','unemployment','currentAccount','govDebt'];
      var labels = ['GDP Growth','Inflation','Unemployment','Current Account','Gov. Debt'];
      var html2 = '';
      keys.forEach(function (k, i) {
        var d = snap[k];
        html2 += '<div class="stat-row">' +
          '<span class="stat-name">' + labels[i] + '</span>' +
          '<span class="stat-val" style="color:var(--teal)">' + (d && d.year ? d.year : '\u2014') + '</span>' +
          '</div>';
      });
      dataEl.innerHTML = html2;
    }
  }

  // ── COUNTRY SWITCH ───────────────────────────────────────────────────────
  function switchCountry(countryCode) {
    state.activeCountry = countryCode;

    document.querySelectorAll('.country-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.cc === countryCode);
    });

    var c = COUNTRIES[countryCode];
    var headerEl = $('countryHeader');
    if (headerEl) headerEl.textContent = c.flag + ' ' + c.name;

    if (state.snapshots[countryCode] && state.timeSeries[countryCode]) {
      renderKPIs(countryCode);
      renderCharts(countryCode);
      renderStatPanels(countryCode);
      return;
    }

    setLoading(true);
    Promise.all([
      apiGet('snapshot/' + countryCode),
      apiGet('timeseries/' + countryCode),
    ]).then(function (results) {
      state.snapshots[countryCode]  = results[0];
      state.timeSeries[countryCode] = results[1];
      renderKPIs(countryCode);
      renderCharts(countryCode);
      renderStatPanels(countryCode);
    }).catch(function (e) {
      showError('Failed to load data for ' + c.name + '. ' + e.message);
    }).finally(function () {
      setLoading(false);
    });
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    setLoading(true);

    // Load constants from backend, then bootstrap the app
    Promise.all([
      apiGet('countries'),
      apiGet('indicators'),
    ]).then(function (results) {
      COUNTRIES  = results[0];
      INDICATORS = results[1];
      return bootstrap();
    }).catch(function (e) {
      showError('Initialisation failed: ' + e.message);
      console.error(e);
      setLoading(false);
    });
  }

  function bootstrap() {
    // Build country buttons
    var countryBar = $('countryBar');
    if (countryBar) {
      Object.keys(COUNTRIES).forEach(function (cc) {
        var c = COUNTRIES[cc];
        var btn = document.createElement('button');
        btn.className = 'country-btn' + (cc === 'US' ? ' active' : '');
        btn.dataset.cc = cc;
        btn.innerHTML = '<span class="flag">' + c.flag + '</span>' + cc;
        btn.addEventListener('click', function () { switchCountry(cc); });
        countryBar.appendChild(btn);
      });
    }

    // Build compare tabs
    var tabGroup = $('compareTabGroup');
    if (tabGroup) {
      var tabs = [
        { key: 'gdpGrowth',      label: 'GDP Growth' },
        { key: 'inflation',      label: 'Inflation' },
        { key: 'unemployment',   label: 'Unemployment' },
        { key: 'currentAccount', label: 'Curr. Account' },
        { key: 'govDebt',        label: 'Gov. Debt' },
      ];
      tabs.forEach(function (t) {
        var btn = document.createElement('button');
        btn.className = 'tab-btn' + (t.key === 'gdpGrowth' ? ' active' : '');
        btn.dataset.key = t.key;
        btn.textContent = t.label;
        btn.addEventListener('click', function () { renderComparison(t.key); });
        tabGroup.appendChild(btn);
      });
    }

    // Fetch initial data
    var crossKeys = ['gdpGrowth','inflation','unemployment','currentAccount','govDebt','gdpPerCapita'];
    var crossPromises = crossKeys.map(function (key) {
      return apiGet('crosscountry/' + key)
        .then(function (d) { return { key: key, d: d }; })
        .catch(function () { return { key: key, d: {} }; });
    });

    return Promise.all([
      apiGet('snapshot/US'),
      apiGet('timeseries/US'),
    ].concat(crossPromises)).then(function (results) {
      state.snapshots.US  = results[0];
      state.timeSeries.US = results[1];

      for (var i = 2; i < results.length; i++) {
        var r = results[i];
        state.crossCountry[r.key] = r.d;
      }

      renderKPIs('US');
      renderCharts('US');
      renderComparison('gdpGrowth');
      renderTable();
      renderStatPanels('US');

      var tsEl = $('lastUpdated');
      if (tsEl) tsEl.textContent = 'Data fetched: ' + new Date().toUTCString();
    }).catch(function (e) {
      showError('Initialisation failed: ' + e.message);
      console.error(e);
    }).finally(function () {
      setLoading(false);
    });
  }

  // ── BOOT ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
