/**
 * api.js — World Bank API wrapper
 * Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581
 *
 * All endpoints are free, no API key required.
 * Data is updated annually (most recent year usually 1–2 years prior).
 */

const WB_BASE = 'https://api.worldbank.org/v2';
const DEFAULT_PARAMS = 'format=json&per_page=20&mrv=20'; // last 20 values

// ── INDICATOR CODES ─────────────────────────────────────────────────────────
export const INDICATORS = {
  gdpGrowth:         { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP Growth (%)',          unit: '%'  },
  inflation:         { code: 'FP.CPI.TOTL.ZG',    label: 'Inflation, CPI (%)',      unit: '%'  },
  unemployment:      { code: 'SL.UEM.TOTL.ZS',    label: 'Unemployment Rate (%)',   unit: '%'  },
  currentAccount:    { code: 'BN.CAB.XOKA.GD.ZS', label: 'Current Account (% GDP)', unit: '%' },
  govDebt:           { code: 'GC.DOD.TOTL.GD.ZS', label: 'Gov. Debt (% GDP)',       unit: '%'  },
  tradeOpenness:     { code: 'NE.TRD.GNFS.ZS',    label: 'Trade Openness (% GDP)',  unit: '%'  },
  gdpPerCapita:      { code: 'NY.GDP.PCAP.KD',     label: 'GDP per Capita (USD)',    unit: '$'  },
  fdi:               { code: 'BX.KLT.DINV.WD.GD.ZS', label: 'FDI Inflows (% GDP)', unit: '%'  },
};

// ── COUNTRIES ───────────────────────────────────────────────────────────────
export const COUNTRIES = {
  US: { name: 'United States', flag: '🇺🇸', code: 'US' },
  CN: { name: 'China',         flag: '🇨🇳', code: 'CN' },
  DE: { name: 'Germany',       flag: '🇩🇪', code: 'DE' },
  JP: { name: 'Japan',         flag: '🇯🇵', code: 'JP' },
  GB: { name: 'United Kingdom',flag: '🇬🇧', code: 'GB' },
  IN: { name: 'India',         flag: '🇮🇳', code: 'IN' },
  FR: { name: 'France',        flag: '🇫🇷', code: 'FR' },
  BR: { name: 'Brazil',        flag: '🇧🇷', code: 'BR' },
};

// ── FETCH HELPERS ────────────────────────────────────────────────────────────

/**
 * Fetch a single indicator time series for one country.
 * Returns: [{ year: '2023', value: 2.5 }, ...]  sorted ascending by year.
 */
export async function fetchIndicator(countryCode, indicatorCode, years = 20) {
  const url = `${WB_BASE}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=${years}&mrv=${years}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WB API error ${res.status}`);
  const [meta, data] = await res.json();
  if (!data) return [];

  return data
    .filter(d => d.value !== null)
    .map(d => ({ year: d.date, value: parseFloat(d.value.toFixed(2)) }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

/**
 * Fetch the same indicator for multiple countries (latest value only).
 * Returns: { US: 2.1, CN: 5.2, ... }
 */
export async function fetchCrossCountry(indicatorCode) {
  const codes = Object.keys(COUNTRIES).join(';');
  const url   = `${WB_BASE}/country/${codes}/indicator/${indicatorCode}?format=json&per_page=1&mrv=1`;
  const res   = await fetch(url);
  if (!res.ok) throw new Error(`WB API error ${res.status}`);
  const [, data] = await res.json();
  if (!data) return {};

  const result = {};
  for (const item of data) {
    if (item.value !== null) {
      result[item.countryiso3code?.slice(0,2) || item.country.id] = {
        value: parseFloat(item.value.toFixed(2)),
        year:  item.date,
      };
    }
  }
  return result;
}

/**
 * Fetch a snapshot of all key indicators for one country (latest values).
 * Returns: { gdpGrowth: { value, year }, inflation: { value, year }, ... }
 */
export async function fetchCountrySnapshot(countryCode) {
  const keys      = Object.keys(INDICATORS);
  const promises  = keys.map(k =>
    fetchIndicator(countryCode, INDICATORS[k].code, 2)
      .then(data => ({ key: k, data: data.at(-1) ?? null }))
      .catch(() => ({ key: k, data: null }))
  );
  const results = await Promise.all(promises);
  const snapshot = {};
  for (const { key, data } of results) snapshot[key] = data;
  return snapshot;
}

/**
 * Fetch full time-series for a country (all main indicators).
 */
export async function fetchCountryTimeSeries(countryCode) {
  const keys = ['gdpGrowth', 'inflation', 'unemployment', 'currentAccount'];
  const promises = keys.map(k =>
    fetchIndicator(countryCode, INDICATORS[k].code, 25)
      .then(data => ({ key: k, data }))
      .catch(() => ({ key: k, data: [] }))
  );
  const results = await Promise.all(promises);
  const series = {};
  for (const { key, data } of results) series[key] = data;
  return series;
}
