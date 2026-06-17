'use strict';

// ── MAPBOX INIT ──
mapboxgl.accessToken = 'pk.eyJ1IjoiY2JhbGNhcmVrIiwiYSI6ImNtcWcxN2dqaTAyNDgycXBuMmcyeW03YzUifQ.hjMxeLpc2LWVddfGJbTPPg';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NYC_CENTER = [-73.971, 40.730];

const map = new mapboxgl.Map({
  container: 'map-container',
  style: 'mapbox://styles/mapbox/light-v11',
  center: NYC_CENTER,
  zoom: 11, bearing: 0, pitch: 0,
  attributionControl: false, minZoom: 9, maxZoom: 16,
});
map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

map.on('error', e => {
  if (e.error && e.error.status === 401) {
    const el = document.getElementById('map-container');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:system-ui;color:#6b7280;flex-direction:column;gap:8px"><div style="font-size:24px">🗺</div><div style="font-size:14px">Map unavailable — please try again later.</div></div>';
  }
});

// ── WORK STOPS — ordered newest→oldest for paging ──
const WORK_STOPS = [
  { name:'125 St',              label:'Medidata',    logo:'/assets/logos/medidata.svg',   coord:[-73.937594, 40.804138] },
  { name:'96 St',               label:'Codifyd',     logo:'/assets/logos/codifyd.svg',    coord:[-73.951070, 40.785672] },
  { name:'59 St',               label:'Scholastic',  logo:'/assets/logos/scholastic.svg', coord:[-73.967967, 40.762526] },
  { name:'Grand Central-42 St', label:'McGraw-Hill', logo:'/assets/logos/mcgrawhill.svg', coord:[-73.976848, 40.751776] },
  { name:'Bleecker St',         label:'NYU Stern',   logo:'/assets/logos/nyu.svg',        coord:[-73.994659, 40.725915] },
];

// ── STATION DATA ──
const STATIONS = [
  { key:'work', name:'125 St',               label:'Medidata',      coord:[-73.937594, 40.804138] },
  { key:'work', name:'96 St',                label:'Codifyd',       coord:[-73.951070, 40.785672] },
  { key:'work', name:'59 St',                label:'Scholastic',    coord:[-73.967967, 40.762526] },
  { key:'work', name:'Grand Central-42 St',  label:'McGraw-Hill',   coord:[-73.976848, 40.751776] },
  { key:'work', name:'28 St',                label:null,            coord:[-73.984264, 40.743070] },
  { key:'work', name:'14 St-Union Sq',       label:null,            coord:[-73.989951, 40.734673] },
  { key:'work', name:'Bleecker St',          label:'NYU Stern',     coord:[-73.994659, 40.725915] },
  { key:'work', name:'Brooklyn Bridge',      label:null,            coord:[-74.004131, 40.713065] },
  { key:'art',  name:'Flushing-Main St',     label:'Flushing',      coord:[-73.830030, 40.759600] },
  { key:'art',  name:'74 St-Broadway',       label:'Jackson Hts',   coord:[-73.891394, 40.746848] },
  { key:'art',  name:'Queensboro Plaza',     label:'LIC',           coord:[-73.940202, 40.750582] },
  { key:'art',  name:'Grand Central-42 St',  label:'Midtown',       coord:[-73.976041, 40.751431] },
  { key:'art',  name:'Times Sq-42 St',       label:'Times Sq',      coord:[-73.987691, 40.755477] },
  { key:'art',  name:'34 St-Hudson Yards',   label:'Hudson Yards',  coord:[-74.001910, 40.755882] },
  { key:'running', name:'Start',             label:'Verrazzano',    coord:[-74.06111,  40.60177 ] },
  { key:'running', name:'Mile 13',           label:'Pulaski Bridge',coord:[-73.95361,  40.72884 ] },
  { key:'running', name:'Mile 16',           label:'Queensboro',    coord:[-73.95450,  40.75677 ] },
  { key:'running', name:'Mile 21',           label:'The Bronx',     coord:[-73.92530,  40.81005 ] },
  { key:'running', name:'Finish',            label:'Central Park',  coord:[-73.97670,  40.77253 ] },
  { key:'tech', name:'Van Cortlandt-242 St', label:'Van Cortlandt', coord:[-73.898583, 40.889248] },
  { key:'tech', name:'96 St',               label:null,            coord:[-73.972323, 40.793919] },
  { key:'tech', name:'59 St-Columbus Circle',label:'Columbus Cir',  coord:[-73.981929, 40.768247] },
  { key:'tech', name:'34 St-Penn Station',  label:'Penn Station',   coord:[-73.991057, 40.750373] },
  { key:'tech', name:'18 St',               label:null,            coord:[-73.997871, 40.741040] },
  { key:'tech', name:'Chambers St',         label:'Chambers St',   coord:[-74.009266, 40.715478] },
];

const STATION_FC = {
  type: 'FeatureCollection',
  features: STATIONS.map(s => ({
    type: 'Feature',
    properties: { key: s.key, name: s.name, label: s.label || s.name },
    geometry: { type: 'Point', coordinates: s.coord },
  })),
};

const MODE_COLORS = { work:'#FF6319', running:'#EE352E', art:'#0039A6', tech:'#00933C' };

// ── MAP STYLES ──
const MAP_STYLES = [
  { id:'standard',   label:'Standard',   url:'mapbox://styles/mapbox/light-v11' },
  { id:'minimal',    label:'Minimal',    url:'mapbox://styles/mapbox/light-v11' }, // street map with layers suppressed
  { id:'dark',       label:'Dark',       url:'mapbox://styles/mapbox/dark-v11' },
  { id:'blank',      label:'Schematic',  url:'mapbox://styles/mapbox/empty-v9' },
];
let _currentStyleId = 'standard';

const LINE_DEFS = [
  { id:'line-running', src:'marathon-line',  file:'/data/marathon-route.geojson', color:'#EE352E', width:3.5 },
  { id:'line-tech',    src:'subway-1-line',  file:'/data/subway-1.geojson',       color:'#00933C', width:4   },
  { id:'line-work',    src:'subway-6-line',  file:'/data/subway-6.geojson',       color:'#FF6319', width:4   },
  { id:'line-art',     src:'subway-7-line',  file:'/data/subway-7.geojson',       color:'#0039A6', width:4   },
];

// Layers to hide in 'minimal' mode (street labels, roads, buildings, POIs)
const MINIMAL_HIDE = [
  'road-motorway-trunk','road-primary','road-secondary-tertiary',
  'road-street','road-minor','road-label',
  'building','building-outline',
  'poi-label','transit-label','airport-label',
  'natural-point-label','natural-line-label',
  'waterway-label','settlement-label','settlement-subdivision-label',
  'state-label','country-label',
  'admin-0-boundary','admin-1-boundary',
  'road-motorway-trunk-case','road-primary-case','road-secondary-tertiary-case',
  'road-street-case','road-minor-case',
  'tunnel-motorway-trunk','tunnel-primary','tunnel-secondary-tertiary',
  'tunnel-street','tunnel-minor',
  'bridge-motorway-trunk','bridge-primary','bridge-secondary-tertiary',
  'bridge-street','bridge-minor',
];

function addMapLayers() {
  LINE_DEFS.forEach(({ id, src, file, color, width }) => {
    if (!map.getSource(src)) map.addSource(src, { type:'geojson', data: file });
    if (!map.getLayer(id)) {
      map.addLayer({ id, type:'line', source: src,
        paint: { 'line-color': color, 'line-width': width, 'line-cap':'round', 'line-join':'round' },
        layout: { visibility:'none' },
      });
    }
  });

  LINE_DEFS.forEach(({ id, src, color, width }) => {
    const drawSrc = `${src}-draw`;
    const drawId  = `${id}-draw`;
    if (!map.getSource(drawSrc)) map.addSource(drawSrc, { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:[] }, properties:{} } });
    if (!map.getLayer(drawId)) {
      map.addLayer({ id: drawId, type:'line', source: drawSrc,
        paint: { 'line-color': color, 'line-width': width + 1, 'line-cap':'round', 'line-join':'round' },
        layout: { visibility:'none' },
      });
    }
  });

  if (!map.getSource('stations')) map.addSource('stations', { type:'geojson', data: STATION_FC });

  if (!map.getLayer('station-glow')) {
    map.addLayer({ id:'station-glow', type:'circle', source:'stations',
      paint: {
        'circle-radius': 16,
        'circle-color': ['match',['get','key'],'work','#FF6319','running','#EE352E','art','#0039A6','tech','#00933C','#6b7280'],
        'circle-opacity': 0.13,
      }, layout:{ visibility:'none' },
    });
  }
  if (!map.getLayer('station-ring')) {
    map.addLayer({ id:'station-ring', type:'circle', source:'stations',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': ['match',['get','key'],'work','#FF6319','running','#EE352E','art','#0039A6','tech','#00933C','#6b7280'],
      }, layout:{ visibility:'none' },
    });
  }
  if (!map.getLayer('station-dot')) {
    map.addLayer({ id:'station-dot', type:'circle', source:'stations',
      paint: {
        'circle-radius': 3.5,
        'circle-color': ['match',['get','key'],'work','#FF6319','running','#EE352E','art','#0039A6','tech','#00933C','#6b7280'],
      }, layout:{ visibility:'none' },
    });
  }
  if (!map.getLayer('station-labels')) {
    map.addLayer({ id:'station-labels', type:'symbol', source:'stations',
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': 11,
        'text-offset': [0, 1.6],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        visibility: 'none',
      },
      paint: {
        'text-color': ['match',['get','key'],'work','#FF6319','running','#EE352E','art','#0039A6','tech','#00933C','#6b7280'],
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });
  }

  // Suppress street layers in minimal mode
  if (_currentStyleId === 'minimal') {
    MINIMAL_HIDE.forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });
  }

  // Re-register station click handlers
  function handleStationClick(e) {
    e.originalEvent.preventDefault();
    const props = e.features[0].properties;
    if (props.key === 'work') {
      const idx = WORK_STOPS.findIndex(s => s.name === props.name);
      openWorkSheet(idx >= 0 ? idx : 0);
    } else if (props.key === 'running') {
      openRunningSheet();
    } else {
      openStationSheet(props.key, props.name);
    }
  }
  ['station-ring','station-glow','station-dot','station-labels'].forEach(layerId => {
    map.on('click', layerId, handleStationClick);
    map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
  });

  setMode(currentMode || 'all');
}

// ── MAP LOAD ──
map.on('load', () => {
  addMapLayers();
});

// ── STYLE SWITCHER ──
function switchMapStyle(styleId) {
  const style = MAP_STYLES.find(s => s.id === styleId);
  if (!style) return;
  _currentStyleId = styleId;

  // Clear coord cache — draw layers get wiped by setStyle
  Object.keys(_lineCoordCache).forEach(k => delete _lineCoordCache[k]);

  map.once('style.load', () => {
    addMapLayers();
    // Update station ring halo color for dark/blank styles
    const halo = (styleId === 'dark') ? '#1a1a1a' : '#ffffff';
    if (map.getLayer('station-ring')) map.setPaintProperty('station-ring', 'circle-halo-color', halo);
  });
  map.setStyle(style.url);

  // Update switcher UI
  document.querySelectorAll('.map-style-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.style === styleId)
  );
}

// ── LOGO MARKERS (work mode) ──
const _logoMarkers = [];

function showLogoMarkers() {
  WORK_STOPS.forEach((stop, idx) => {
    const el = document.createElement('div');
    el.className = 'logo-marker';
    el.innerHTML = `<img src="${stop.logo}" alt="${stop.label}"><span class="logo-label">${stop.label}</span>`;
    el.addEventListener('click', e => {
      e.stopPropagation();
      openWorkSheet(idx);
    });
    const m = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(stop.coord)
      .addTo(map);
    _logoMarkers.push(m);
  });
}

function hideLogoMarkers() {
  _logoMarkers.forEach(m => m.remove());
  _logoMarkers.length = 0;
}

// ── LINE DRAW ANIMATION ──
const LINE_FILES = {
  'line-running': '/data/marathon-route.geojson',
  'line-tech':    '/data/subway-1.geojson',
  'line-work':    '/data/subway-6.geojson',
  'line-art':     '/data/subway-7.geojson',
};
const LINE_SOURCES = {
  'line-running': 'marathon-line-draw',
  'line-tech':    'subway-1-line-draw',
  'line-work':    'subway-6-line-draw',
  'line-art':     'subway-7-line-draw',
};
const _lineCoordCache = {};
let _animFrame = null;

function animateLine(lineId) {
  if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }

  const drawLayerId = `${lineId}-draw`;
  const drawSrcId   = LINE_SOURCES[lineId];
  if (!drawSrcId) return;

  map.setLayoutProperty(lineId, 'visibility', 'none');
  map.setLayoutProperty(drawLayerId, 'visibility', 'visible');

  const run = (coords) => {
    const total = coords.length;
    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const pct = Math.min(elapsed / duration, 1);
      const count = Math.max(2, Math.floor(pct * total));
      const src = map.getSource(drawSrcId);
      if (src) src.setData({ type:'Feature', geometry:{ type:'LineString', coordinates: coords.slice(0, count) }, properties:{} });
      if (pct < 1) {
        _animFrame = requestAnimationFrame(frame);
      } else {
        map.setLayoutProperty(lineId, 'visibility', 'visible');
        map.setLayoutProperty(drawLayerId, 'visibility', 'none');
        if (src) src.setData({ type:'Feature', geometry:{ type:'LineString', coordinates:[] }, properties:{} });
      }
    }
    _animFrame = requestAnimationFrame(frame);
  };

  if (_lineCoordCache[lineId]) {
    run(_lineCoordCache[lineId]);
  } else {
    fetch(LINE_FILES[lineId]).then(r => r.json()).then(gj => {
      const coords = gj.geometry.coordinates;
      _lineCoordCache[lineId] = coords;
      run(coords);
    });
  }
}

// ── MODE SWITCHER ──
let currentMode = 'all';

function setMode(mode) {
  currentMode = mode;
  closeBS();

  document.querySelectorAll('.mode-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.mode === mode)
  );

  const lineLayers    = ['line-work','line-running','line-art','line-tech'];
  const stationLayers = ['station-glow','station-ring','station-dot','station-labels'];

  if (mode === 'all') {
    lineLayers.forEach(id => {
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, 'visibility', 'visible');
      map.setLayoutProperty(`${id}-draw`, 'visibility', 'none');
    });
  } else {
    lineLayers.forEach(id => {
      if (!map.getLayer(id)) return;
      const key = id.replace('line-', '');
      if (key === mode) {
        animateLine(id);
      } else {
        map.setLayoutProperty(id, 'visibility', 'none');
        map.setLayoutProperty(`${id}-draw`, 'visibility', 'none');
      }
    });
  }

  stationLayers.forEach(id => {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(id, 'visibility', 'visible');
    map.setFilter(id, mode === 'all' ? null : ['==', ['get','key'], mode]);
  });

  if (map.getLayer('station-labels')) {
    map.setLayoutProperty('station-labels', 'visibility', mode === 'all' ? 'none' : 'visible');
  }

  document.getElementById('marathon-year-selector')
    .classList.toggle('visible', mode === 'running');

  hideLogoMarkers();
  if (mode === 'work') showLogoMarkers();

  if (mode === 'running') openRunningSheet();

  const flyTargets = {
    work:    { center:[-73.970, 40.760], zoom:12   },
    running: { center:[-73.971, 40.710], zoom:10.5 },
    art:     { center:[-73.930, 40.752], zoom:11   },
    tech:    { center:[-73.975, 40.780], zoom:11.5 },
    all:     { center: NYC_CENTER,       zoom:11   },
  };
  const target = flyTargets[mode] || flyTargets.all;
  map.flyTo({ ...target, bearing:0, duration:900 });
}
