#!/usr/bin/env node
'use strict';

/**
 * One-time script: converts raw source data to GeoJSON for the map.
 *   - data/sources/marathon.gpx       → data/marathon-route.geojson
 *   - data/sources/gtfs_subway/       → data/subway-1.geojson
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const GPX_FILE    = path.join(ROOT, 'data', 'sources', 'marathon.gpx');
const GTFS_DIR    = path.join(ROOT, 'data', 'sources', 'gtfs_subway');
const OUT_MARATHON = path.join(ROOT, 'data', 'marathon-route.geojson');
const OUT_SUBWAY   = path.join(ROOT, 'data', 'subway-1.geojson');

// Douglas-Peucker line simplification
function perpendicularDist([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dx * (y1 - y) - (x1 - x) * dy) / len;
}

function douglasPeucker(pts, epsilon) {
  if (pts.length <= 2) return pts;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const l = douglasPeucker(pts.slice(0, maxIdx + 1), epsilon);
    const r = douglasPeucker(pts.slice(maxIdx), epsilon);
    return [...l.slice(0, -1), ...r];
  }
  return [pts[0], pts[pts.length - 1]];
}

function writeGeoJSON(file, coords) {
  fs.writeFileSync(file, JSON.stringify({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {},
  }, null, 2));
}

// ── GPX → GeoJSON ──
function buildMarathon() {
  const xml = fs.readFileSync(GPX_FILE, 'utf8');
  const coords = [];
  for (const m of xml.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)) {
    coords.push([parseFloat(m[2]), parseFloat(m[1])]);
  }
  // epsilon ~0.00005° ≈ 5m — keeps shape accurate, drops redundant points
  const simplified = douglasPeucker(coords, 0.00005);
  console.log(`Marathon: ${coords.length} → ${simplified.length} points`);
  writeGeoJSON(OUT_MARATHON, simplified);
  console.log(`Wrote ${OUT_MARATHON}`);
}

// ── GTFS shapes.txt → GeoJSON for a given route ──
function buildSubwayRoute(routeId, epsilon = 0.00003) {
  const trips = fs.readFileSync(path.join(GTFS_DIR, 'trips.txt'), 'utf8').split('\n');
  const th = trips[0].split(',');
  const routeIdx = th.indexOf('route_id');
  const shapeIdx = th.indexOf('shape_id');
  const shapeIds = new Set();
  for (let i = 1; i < trips.length; i++) {
    const cols = trips[i].split(',');
    if (cols[routeIdx] === routeId) shapeIds.add(cols[shapeIdx]);
  }

  const shapes = fs.readFileSync(path.join(GTFS_DIR, 'shapes.txt'), 'utf8').split('\n');
  const sh = shapes[0].split(',');
  const sidIdx = sh.indexOf('shape_id');
  const latIdx = sh.indexOf('shape_pt_lat');
  const lonIdx = sh.indexOf('shape_pt_lon');
  const seqIdx = sh.indexOf('shape_pt_sequence');

  const byShape = {};
  for (let i = 1; i < shapes.length; i++) {
    const cols = shapes[i].split(',');
    const sid  = cols[sidIdx];
    if (!shapeIds.has(sid)) continue;
    if (!byShape[sid]) byShape[sid] = [];
    byShape[sid].push({ seq: parseInt(cols[seqIdx]), coord: [parseFloat(cols[lonIdx]), parseFloat(cols[latIdx])] });
  }

  let best = [], bestId = '';
  for (const [sid, pts] of Object.entries(byShape)) {
    if (pts.length > best.length) { best = pts; bestId = sid; }
  }
  best.sort((a, b) => a.seq - b.seq);
  const coords = best.map(p => p.coord);
  const simplified = douglasPeucker(coords, epsilon);
  const out = path.join(ROOT, 'data', `subway-${routeId}.geojson`);
  console.log(`Route ${routeId} (shape ${bestId}): ${coords.length} → ${simplified.length} points`);
  writeGeoJSON(out, simplified);
}

buildMarathon();
buildSubwayRoute('1');
buildSubwayRoute('6');
buildSubwayRoute('7');
console.log('Done.');
