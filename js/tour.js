'use strict';

// ── GUIDED TOUR ──

const TOUR_STOPS = [
  {
    mode:   null,
    label:  'Colin',
    color:  '#FF6319',
    center: [-73.971, 40.775],
    zoom:   11,
    open() {
      document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
      document.getElementById('pill-about').classList.add('active');
      openAboutSheet();
    },
  },
  {
    mode:   'work',
    label:  'Work',
    color:  '#FF6319',
    center: [-73.970, 40.760],
    zoom:   12,
    open() { setMode('work'); },
  },
  {
    mode:   'work',
    label:  'Medidata',
    color:  '#FF6319',
    center: [-73.937594, 40.804138],
    zoom:   14,
    open() { setMode('work'); openWorkSheet(0); },
  },
  {
    mode:   'running',
    label:  'Marathon',
    color:  '#EE352E',
    center: [-73.97670, 40.77253],
    zoom:   12,
    open() { setMode('running'); },
  },
  {
    mode:   'tech',
    label:  '1train.nyc',
    color:  '#00933C',
    center: [-73.898583, 40.889248],
    zoom:   13,
    open() { setMode('tech'); openStationSheet('tech', 'Van Cortlandt-242 St'); },
  },
  {
    mode:   'art',
    label:  'Ceramics',
    color:  '#0039A6',
    center: [-73.830030, 40.759600],
    zoom:   12,
    open() { setMode('art'); openStationSheet('art', 'Flushing-Main St'); },
  },
  {
    mode:   null,
    label:  'Say Hi',
    color:  '#1a1a1a',
    center: [-73.971, 40.730],
    zoom:   11,
    open() { setMode('all'); openTourFinalSheet(); },
  },
];

const TOUR_DURATION = 8000; // ms per stop

let _tourActive    = false;
let _tourIdx       = 0;
let _tourTimer     = null;
let _tourStarted   = 0; // timestamp when current stop began
let _tourRafId     = null;

// ── DOM refs (set after DOMContentLoaded) ──
let _tourBar, _tourDots, _tourNext, _tourExit, _tourOverlay, _tourLabel;

function buildTourUI() {
  // Tour overlay bar — sits above the bottom sheet
  const el = document.createElement('div');
  el.id = 'tour-bar';
  el.setAttribute('aria-label', 'Guided tour controls');
  el.innerHTML = `
    <div id="tour-progress-track"><div id="tour-progress-fill"></div></div>
    <div id="tour-controls">
      <div id="tour-dots"></div>
      <span id="tour-label"></span>
      <div id="tour-btns">
        <button id="tour-next" aria-label="Next stop">Next →</button>
        <button id="tour-exit" aria-label="Exit tour">✕</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  _tourBar    = el;
  _tourDots   = document.getElementById('tour-dots');
  _tourNext   = document.getElementById('tour-next');
  _tourExit   = document.getElementById('tour-exit');
  _tourLabel  = document.getElementById('tour-label');

  _tourNext.addEventListener('click', () => tourAdvance());
  _tourExit.addEventListener('click', () => tourStop());
}

function renderTourDots() {
  _tourDots.innerHTML = TOUR_STOPS.map((s, i) =>
    `<span class="tour-dot ${i === _tourIdx ? 'active' : i < _tourIdx ? 'done' : ''}"
           style="--dot-color:${s.color}" aria-label="${s.label}"></span>`
  ).join('');
}

function startProgressBar() {
  cancelAnimationFrame(_tourRafId);
  _tourStarted = performance.now();
  const fill = document.getElementById('tour-progress-fill');

  function tick(now) {
    const pct = Math.min((now - _tourStarted) / TOUR_DURATION * 100, 100);
    fill.style.width = pct + '%';
    if (pct < 100) {
      _tourRafId = requestAnimationFrame(tick);
    }
  }
  _tourRafId = requestAnimationFrame(tick);
}

function scheduleAdvance() {
  clearTimeout(_tourTimer);
  _tourTimer = setTimeout(() => {
    if (_tourIdx < TOUR_STOPS.length - 1) {
      tourAdvance();
    }
    // Last stop: stay, no auto-advance
  }, TOUR_DURATION);
}

function tourGoTo(idx) {
  _tourIdx = idx;
  const stop = TOUR_STOPS[idx];

  renderTourDots();
  _tourLabel.textContent = `${idx + 1} / ${TOUR_STOPS.length} · ${stop.label}`;
  _tourNext.textContent  = idx === TOUR_STOPS.length - 1 ? 'Done' : 'Next →';

  map.flyTo({ center: stop.center, zoom: stop.zoom, duration: 900 });
  stop.open();

  startProgressBar();
  scheduleAdvance();
}

function tourAdvance() {
  if (_tourIdx >= TOUR_STOPS.length - 1) {
    tourStop();
    return;
  }
  tourGoTo(_tourIdx + 1);
}

function tourStart() {
  if (_tourActive) return;
  _tourActive = true;
  _tourIdx    = 0;

  _tourBar.classList.add('visible');
  document.body.classList.add('tour-active');
  document.getElementById('tour-start-btn').classList.add('hidden');

  tourGoTo(0);
}

function tourStop() {
  _tourActive = false;
  clearTimeout(_tourTimer);
  cancelAnimationFrame(_tourRafId);

  _tourBar.classList.remove('visible');
  document.body.classList.remove('tour-active');
  document.getElementById('tour-start-btn').classList.remove('hidden');
  closeBS();
}

function openTourFinalSheet() {
  const bsBody = document.getElementById('bs-body');
  bsBody.innerHTML = `
    <div style="padding:4px 0 24px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">👋</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">Let's connect</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:20px;line-height:1.6">
        Technical Product Manager with a background in data,<br>
        MDM, and building things that work.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:260px;margin:0 auto">
        <a href="https://www.linkedin.com/in/colin-balcarek/" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:12px;background:#0077B5;color:#fff;text-decoration:none;border-radius:12px;padding:12px 16px;font-weight:600;font-size:14px">
          <span style="font-size:18px">💼</span> LinkedIn
        </a>
        <a href="mailto:colin@balcarek.org"
           style="display:flex;align-items:center;gap:12px;background:#f3f4f6;color:#1a1a1a;text-decoration:none;border-radius:12px;padding:12px 16px;font-weight:600;font-size:14px">
          <span style="font-size:18px">✉️</span> colin@balcarek.org
        </a>
        <a href="/assets/resume.pdf" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:12px;background:#f3f4f6;color:#1a1a1a;text-decoration:none;border-radius:12px;padding:12px 16px;font-weight:600;font-size:14px">
          <span style="font-size:18px">📄</span> Download Résumé
        </a>
      </div>
    </div>`;
  openBS();
}

// ── TOUR START BUTTON ──
function addTourButton() {
  const btn = document.createElement('button');
  btn.id = 'tour-start-btn';
  btn.setAttribute('aria-label', 'Take the tour');
  btn.innerHTML = `Take the Tour →`;
  btn.addEventListener('click', tourStart);
  document.getElementById('identity-header').appendChild(btn);
}

buildTourUI();
addTourButton();
