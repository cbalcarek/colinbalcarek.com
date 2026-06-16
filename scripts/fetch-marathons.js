#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'marathons.json');

const body = JSON.stringify({
  runnerId: '52453605',
  searchString: null,
  year: null,
  distance: 'MAR',
  teamCode: null,
  overallPlaceFrom: null,
  overallPlaceTo: null,
  paceFrom: null,
  paceTo: null,
  overallTimeFrom: null,
  overallTimeTo: null,
  gunTimeFrom: null,
  gunTimeTo: null,
  ageGradedTimeFrom: null,
  ageGradedTimeTo: null,
  ageGradedPlaceFrom: null,
  ageGradedPlaceTo: null,
  ageGradedPerformanceFrom: null,
  ageGradedPerformanceTo: null,
  pageIndex: 1,
  pageSize: 51,
  sortColumn: 'EventDate',
  sortDescending: true,
});

const options = {
  hostname: 'rmsprodapi.nyrr.org',
  path: '/api/v2/runners/races',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Accept': 'application/json',
    'Origin': 'https://results.nyrr.org',
    'Referer': 'https://results.nyrr.org/',
    'User-Agent': 'Mozilla/5.0',
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`NYRR API returned ${res.statusCode}`);
      process.exit(1);
    }

    const parsed = JSON.parse(data);
    const items = parsed.items.map((r) => ({
      year: new Date(r.startDateTime).getFullYear(),
      time: r.actualTime,
      pace: r.actualPace,
    }));

    const out = { fetchedAt: new Date().toISOString(), items };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote ${items.length} races to ${OUT}`);
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
