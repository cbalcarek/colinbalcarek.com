'use strict';

// ── MARATHON ──
const MARATHON_CACHE_KEY = 'marathons_v2';

async function loadMarathons() {
  try {
    const raw = localStorage.getItem(MARATHON_CACHE_KEY);
    if (raw) {
      const { items } = JSON.parse(raw);
      if (items?.length) return items;
    }
  } catch {}

  return fetch('/data/marathons.json')
    .then(r => r.json())
    .then(d => d.items || [])
    .catch(() => []);
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
  .then(r => {
    if (!r.ok) throw new Error(`content.json ${r.status}`);
    return r.json();
  })
  .then(data => { CONTENT = data; return data; })
  .catch(err => {
    console.warn('Failed to load content.json:', err);
    CONTENT = { workDetail: [], runningPhotos: [], stationDetail: {}, about: {}, modeIntros: {}, panels: {}, searchIndex: [] };
    return CONTENT;
  });

// Convenience accessors (available after contentReady resolves)
function getWorkDetail()    { return CONTENT ? CONTENT.workDetail    : []; }
function getRunningPhotos() { return CONTENT ? CONTENT.runningPhotos : []; }
function getStationDetail() { return CONTENT ? CONTENT.stationDetail : {}; }
function getSearchIndex()   { return CONTENT ? CONTENT.searchIndex   : []; }
function getAbout()         { return CONTENT ? CONTENT.about         : {}; }
function getModeIntro(mode) { return CONTENT && CONTENT.modeIntros ? CONTENT.modeIntros[mode] : null; }
