/**
 * charts.js — Chart.js rendering helpers
 */

var Charts = (function () {

  var COLORS = {
    teal:   '#00d4a8',
    orange: '#ff7043',
    blue:   '#4a9eff',
    yellow: '#ffd166',
    red:    '#ff4d6d',
    purple: '#b388ff',
    cyan:   '#26c6da',
    green:  '#66bb6a',
  };

  var COUNTRY_COLORS = {
    US: '#4a9eff',
    CN: '#ff7043',
    DE: '#00d4a8',
    JP: '#ffd166',
    GB: '#b388ff',
    IN: '#ff8a65',
    FR: '#26c6da',
    BR: '#66bb6a',
  };

  var CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        labels: {
          color: '#6b82a8',
          font: { family: "'Space Mono', monospace", size: 10 },
          boxWidth: 10, boxHeight: 10,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0b1225',
        borderColor: '#1c2e54',
        borderWidth: 1,
        titleColor: '#dde6f4',
        bodyColor: '#6b82a8',
        padding: 12,
        titleFont: { family: "'Syne', sans-serif", size: 12, weight: '700' },
        bodyFont:  { family: "'Space Mono', monospace", size: 11 },
        callbacks: {
          label: function (ctx) {
            return ' ' + (ctx.parsed.y !== undefined
              ? ctx.parsed.y.toFixed(2) + '%'
              : ctx.parsed.toFixed(2) + '%');
          },
        },
      },
    },
    scales: {
      x: {
        grid:  { color: 'rgba(28,46,84,.4)', drawBorder: false },
        ticks: { color: '#6b82a8', font: { family: "'Space Mono', monospace", size: 9 }, maxTicksLimit: 8 },
        border: { display: false },
      },
      y: {
        grid:  { color: 'rgba(28,46,84,.4)', drawBorder: false },
        ticks: {
          color: '#6b82a8',
          font: { family: "'Space Mono', monospace", size: 9 },
          callback: function (v) { return v.toFixed(1) + '%'; },
        },
        border: { display: false },
      },
    },
  };

  function mergeDeep(target, source) {
    var out = Object.assign({}, target);
    if (isObj(target) && isObj(source)) {
      Object.keys(source).forEach(function (k) {
        if (isObj(source[k])) {
          if (!(k in target)) Object.assign(out, { [k]: source[k] });
          else out[k] = mergeDeep(target[k], source[k]);
        } else {
          Object.assign(out, { [k]: source[k] });
        }
      });
    }
    return out;
  }
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  var chartRegistry = {};

  function destroyChart(id) {
    if (chartRegistry[id]) {
      chartRegistry[id].destroy();
      delete chartRegistry[id];
    }
  }

  function makeGradient(ctx, color, alpha1, alpha2) {
    alpha1 = alpha1 !== undefined ? alpha1 : 0.25;
    alpha2 = alpha2 !== undefined ? alpha2 : 0;
    var gradient = ctx.createLinearGradient(0, 0, 0, 200);
    var hex2rgba = function (hex, a) {
      var r = parseInt(hex.slice(1,3),16);
      var g = parseInt(hex.slice(3,5),16);
      var b = parseInt(hex.slice(5,7),16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    };
    gradient.addColorStop(0, hex2rgba(color, alpha1));
    gradient.addColorStop(1, hex2rgba(color, alpha2));
    return gradient;
  }

  function renderGdpChart(canvasId, series) {
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var gradient = makeGradient(ctx, COLORS.teal, 0.3, 0);

    var instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(function (d) { return d.year; }),
        datasets: [{
          label: 'GDP Growth',
          data: series.map(function (d) { return d.value; }),
          borderColor: COLORS.teal,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: COLORS.teal,
          pointBorderColor: '#060b18',
          pointBorderWidth: 2,
        }],
      },
      options: mergeDeep(CHART_DEFAULTS, {
        plugins: {
          legend: { display: false },
          annotation: {
            annotations: {
              zeroLine: {
                type: 'line', yMin: 0, yMax: 0,
                borderColor: 'rgba(255,77,109,.4)',
                borderWidth: 1, borderDash: [5,5],
              },
            },
          },
        },
      }),
    });
    chartRegistry[canvasId] = instance;
  }

  function renderInflationChart(canvasId, series) {
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var gradient = makeGradient(ctx, COLORS.orange, 0.3, 0);

    var instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(function (d) { return d.year; }),
        datasets: [{
          label: 'Inflation (CPI)',
          data: series.map(function (d) { return d.value; }),
          borderColor: COLORS.orange,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: COLORS.orange,
          pointBorderColor: '#060b18',
          pointBorderWidth: 2,
        }],
      },
      options: mergeDeep(CHART_DEFAULTS, {
        plugins: { legend: { display: false } },
      }),
    });
    chartRegistry[canvasId] = instance;
  }

  function renderUnemploymentChart(canvasId, series) {
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var gradient = makeGradient(ctx, COLORS.blue, 0.3, 0);

    var instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(function (d) { return d.year; }),
        datasets: [{
          label: 'Unemployment',
          data: series.map(function (d) { return d.value; }),
          borderColor: COLORS.blue,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: COLORS.blue,
          pointBorderColor: '#060b18',
          pointBorderWidth: 2,
        }],
      },
      options: mergeDeep(CHART_DEFAULTS, {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: function (v) { return v.toFixed(1) + '%'; } } } },
      }),
    });
    chartRegistry[canvasId] = instance;
  }

  function renderCurrentAccountChart(canvasId, series) {
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var instance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: series.map(function (d) { return d.year; }),
        datasets: [{
          label: 'Current Account (% GDP)',
          data: series.map(function (d) { return d.value; }),
          backgroundColor: series.map(function (d) {
            return d.value >= 0 ? 'rgba(0,212,168,.35)' : 'rgba(255,77,109,.35)';
          }),
          borderColor: series.map(function (d) {
            return d.value >= 0 ? COLORS.teal : COLORS.red;
          }),
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: mergeDeep(CHART_DEFAULTS, {
        plugins: { legend: { display: false } },
      }),
    });
    chartRegistry[canvasId] = instance;
  }

  function renderComparisonChart(canvasId, data, label, unit) {
    unit = unit || '%';
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var entries = Object.entries(data).sort(function (a, b) { return b[1].value - a[1].value; });
    var labels  = entries.map(function (e) { return e[0]; });
    var values  = entries.map(function (e) { return e[1].value; });
    var colors  = labels.map(function (cc) { return COUNTRY_COLORS[cc] || COLORS.teal; });
    var bgColors = colors.map(function (c) { return c + '40'; });

    var instance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: values,
          backgroundColor: bgColors,
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: mergeDeep(CHART_DEFAULTS, {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: function (ctx) { return ' ' + ctx.parsed.x.toFixed(2) + unit; } },
          },
        },
        scales: {
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
          x: { ticks: { callback: function (v) { return v.toFixed(1) + unit; } } },
        },
      }),
    });
    chartRegistry[canvasId] = instance;
  }

  function renderSparkline(canvasId, series, color) {
    color = color || COLORS.teal;
    destroyChart(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var instance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(function (d) { return d.year; }),
        datasets: [{
          data: series.map(function (d) { return d.value; }),
          borderColor: color,
          borderWidth: 1.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
    chartRegistry[canvasId] = instance;
  }

  return {
    COLORS: COLORS,
    COUNTRY_COLORS: COUNTRY_COLORS,
    renderGdpChart: renderGdpChart,
    renderInflationChart: renderInflationChart,
    renderUnemploymentChart: renderUnemploymentChart,
    renderCurrentAccountChart: renderCurrentAccountChart,
    renderComparisonChart: renderComparisonChart,
    renderSparkline: renderSparkline,
  };

})();
