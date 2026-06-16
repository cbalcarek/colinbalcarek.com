'use strict';

// ── MARATHON API ──
const NYRR_BODY = JSON.stringify({
  runnerId:'52453605',searchString:null,year:null,distance:'MAR',teamCode:null,
  overallPlaceFrom:null,overallPlaceTo:null,paceFrom:null,paceTo:null,
  overallTimeFrom:null,overallTimeTo:null,gunTimeFrom:null,gunTimeTo:null,
  ageGradedTimeFrom:null,ageGradedTimeTo:null,ageGradedPlaceFrom:null,
  ageGradedPlaceTo:null,ageGradedPerformanceFrom:null,ageGradedPerformanceTo:null,
  pageIndex:1,pageSize:51,sortColumn:'EventDate',sortDescending:true,
});

const MARATHON_CACHE_KEY = 'marathons_v1';
const MARATHON_CACHE_TTL = 24 * 60 * 60 * 1000;

async function loadMarathons() {
  const cached = (() => {
    try {
      const raw = localStorage.getItem(MARATHON_CACHE_KEY);
      if (!raw) return null;
      const { ts, items } = JSON.parse(raw);
      return (Date.now() - ts < MARATHON_CACHE_TTL) ? items : null;
    } catch { return null; }
  })();
  if (cached) return cached;

  const fromApi = await fetch('https://rmsprodapi.nyrr.org/api/v2/runners/races', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8', 'Origin': 'https://results.nyrr.org' },
    body: NYRR_BODY,
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  if (fromApi) {
    const items = fromApi.items.map(r => ({
      year: new Date(r.startDateTime).getFullYear(),
      time: r.actualTime,
      pace: r.actualPace,
    }));
    try { localStorage.setItem(MARATHON_CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch {}
    return items;
  }

  return fetch('/data/marathons.json')
    .then(r => r.json()).then(d => d.items)
    .catch(() => [2013,2014,2015,2016,2017,2018,2019,2021,2022,2023,2024,2025]
      .map(year => ({ year, time: null, pace: null })));
}

function marathonTableHtml(items) {
  const rows = items.map((r, i) =>
    `<tr>
      <td style="color:#6b7280;font-size:10px">#${items.length - i}</td>
      <td style="font-weight:600">${r.year}</td>
      <td style="font-family:monospace">${r.time || '—'}</td>
      <td style="font-family:monospace;color:#6b7280">${r.pace ? r.pace + '/mi' : '—'}</td>
    </tr>`
  ).join('');
  return `<table class="mr-table" style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
    <thead><tr style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.05em">
      <th style="text-align:left;padding:2px 6px 4px 0">#</th>
      <th style="text-align:left;padding:2px 6px 4px 0">Year</th>
      <th style="text-align:left;padding:2px 6px 4px 0">Time</th>
      <th style="text-align:left;padding:2px 0 4px 0">Pace</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

let MARATHON_DATA = [];

// ── CONTENT — loaded from data/content.json ──
let CONTENT = null;

const contentReady = fetch('/data/content.json')
  .then(r => r.json())
  .then(data => { CONTENT = data; return data; })
  .catch(() => {
    // Fallback: empty-but-safe structure so the page still loads
    CONTENT = { workDetail: [], runningPhotos: [], stationDetail: {}, panels: {}, searchIndex: [] };
    return CONTENT;
  });

// Convenience accessors (available after contentReady resolves)
function getWorkDetail()    { return CONTENT ? CONTENT.workDetail    : []; }
function getRunningPhotos() { return CONTENT ? CONTENT.runningPhotos : []; }
function getStationDetail() { return CONTENT ? CONTENT.stationDetail : {}; }
function getSearchIndex()   { return CONTENT ? CONTENT.searchIndex   : []; }
