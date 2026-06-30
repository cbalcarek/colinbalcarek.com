'use strict';

// ── BOTTOM SHEET ──
const bs     = document.getElementById('bottom-sheet');
const bsBody = document.getElementById('bs-body');

function openBS() {
  bs.classList.add('open');
  document.body.classList.add('sheet-open');
  document.getElementById('identity-header').classList.add('collapsed');
  requestAnimationFrame(() => {
    const h = bs.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--sheet-height', (h + 8) + 'px');
  });
}
function closeBS() {
  bs.classList.remove('open');
  document.body.classList.remove('sheet-open');
  document.getElementById('identity-header').classList.remove('collapsed');
  const activePill = document.querySelector('.mode-pill.active');
  if (activePill) {
    activePill.classList.remove('active');
    setMode('all');
  }
}

function sheetAwarePadding() {
  const sheetH = bs.classList.contains('open') ? bs.getBoundingClientRect().height : 0;
  return { top: 110, bottom: sheetH + 60, left: 16, right: 16 };
}

document.getElementById('bs-close').addEventListener('click', closeBS);
document.getElementById('bs-handle-row').addEventListener('click', closeBS);

// Delegated handler for work sheet pagination — avoids listener accumulation on re-render
bsBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-ws]');
  if (!btn || btn.disabled) return;
  if (btn.dataset.ws === 'prev' && _workPageIdx > 0) {
    openWorkSheet(_workPageIdx - 1);
  } else if (btn.dataset.ws === 'next' && _workPageIdx < getWorkDetail().length - 1) {
    openWorkSheet(_workPageIdx + 1);
  }
});

let touchStartY = 0;
bs.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive:true });
bs.addEventListener('touchend',   e => { if (e.changedTouches[0].clientY - touchStartY > 60) closeBS(); }, { passive:true });

// ── PAGED WORK SHEET ──
let _workPageIdx = 0;

function openWorkSheet(idx) {
  _workPageIdx = idx;
  renderWorkSheet();
  openBS();
  requestAnimationFrame(() => {
    map.flyTo({ center: WORK_STOPS[idx].coord, zoom: 13, bearing: currentBearing(), duration: 600, padding: sheetAwarePadding() });
  });
  document.querySelectorAll('.logo-marker').forEach((el, i) =>
    el.classList.toggle('active', i === idx)
  );
}

function renderWorkSheet() {
  const d = getWorkDetail()[_workPageIdx];
  const total = getWorkDetail().length;
  const bullets = d.bullets.map(b => `<li>${b}</li>`).join('');
  const actions = d.actions.length
    ? `<div class="pc-actions" style="margin-top:12px">${d.actions.map(a=>`<a class="ac-btn" href="${a.href}" target="_blank" rel="noopener"><span class="ac-icon">${a.icon}</span><span class="ac-label">${a.label}</span></a>`).join('')}</div>`
    : '';
  bsBody.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <img src="${d.logo}" alt="${d.label}" style="width:44px;height:44px;border-radius:10px;border:.5px solid rgba(0,0,0,.1)">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;line-height:1.2">${d.label}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${d.role}</div>
          ${d.dates ? `<div style="font-size:11px;color:#9ca3af">${d.dates}</div>` : ''}
        </div>
      </div>
      <ul style="margin:0;padding-left:16px;font-size:13px;line-height:1.65;color:#374151">${bullets}</ul>
      ${actions}
      <div class="ws-pager">
        <button class="ws-arrow" data-ws="prev" ${_workPageIdx === 0 ? 'disabled' : ''}>←</button>
        <span class="ws-counter">${_workPageIdx + 1} / ${total}</span>
        <button class="ws-arrow" data-ws="next" ${_workPageIdx === total - 1 ? 'disabled' : ''}>→</button>
      </div>
    </div>`;
}

// ── RUNNING SHEET ──
function openRunningSheet() {
  const n = MARATHON_DATA.length || 11;
  const statsRow = `<div class="stats-row" style="margin:12px 0">
    <div class="stat-item"><div class="stat-n" style="color:#EE352E">${n}</div><div class="stat-l">Finishes</div></div>
    <div class="stat-item"><div class="stat-n">26.2</div><div class="stat-l">Miles</div></div>
    <div class="stat-item"><div class="stat-n">5</div><div class="stat-l">Boroughs</div></div>
  </div>`;
  const table = MARATHON_DATA.length ? marathonTableHtml(MARATHON_DATA) : '<p style="font-size:11px;color:#9ca3af;margin-top:8px">Loading results…</p>';
  bsBody.innerHTML = `<div style="padding:4px 0 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:38px;height:38px;border-radius:9px;background:#EE352E;display:flex;align-items:center;justify-content:center;font-size:18px">🏃</div>
      <div><div style="font-size:17px;font-weight:700">NYC Marathon ×${n}</div><div style="font-size:11px;color:#6b7280">26.2 mi · 5 boroughs · every year since 2014</div></div>
    </div>
    ${statsRow}
    ${table}
  </div>`;
  openBS();
}

// ── STATION SHEET ──
function stationSheetHtml(key, name) {
  const d = getStationDetail()[`${key}:${name}`];
  if (!d) {
    return `<div style="padding:8px 0 20px">
      <div style="font-size:17px;font-weight:700;margin-bottom:4px">${name}</div>
      <div style="font-size:12px;color:#6b7280">Tap a highlighted station to learn more.</div>
    </div>`;
  }
  const photo = d.photo ? `<img src="${d.photo}" alt="${d.title}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:12px;display:block">` : '';
  const bullets = d.bullets.length
    ? `<ul style="margin:8px 0 0;padding-left:16px;font-size:13px;line-height:1.6;color:#374151">${d.bullets.map(b=>`<li style="margin-bottom:5px">${b}</li>`).join('')}</ul>`
    : '';
  const actions = d.actions.length
    ? `<div class="pc-actions" style="margin-top:12px">${d.actions.map(a=>`<a class="ac-btn" href="${a.href}" target="_blank" rel="noopener noreferrer"><span class="ac-icon">${a.icon}</span><span class="ac-label">${a.label}</span></a>`).join('')}</div>`
    : '';
  return `<div style="padding:4px 0 20px">
    ${photo}
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700;line-height:1.2">${d.title}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:3px">${d.sub}</div>
      </div>
      <div style="width:10px;height:10px;border-radius:50%;background:${d.color};flex-shrink:0;margin-top:5px"></div>
    </div>
    ${bullets}
    ${actions}
  </div>`;
}

function openStationSheet(key, name) {
  bsBody.innerHTML = stationSheetHtml(key, name);
  openBS();
  const station = STATIONS.find(s => s.key === key && s.name === name);
  if (station) {
    requestAnimationFrame(() => {
      map.flyTo({ center: station.coord, zoom: 13, bearing: currentBearing(), duration: 600, padding: sheetAwarePadding() });
    });
  }
}

// ── MODE INTRO SHEET ──
function openModeIntroSheet(mode) {
  const d = getModeIntro(mode);
  if (!d) return;
  const actions = mode === 'tech'
    ? `<div class="pc-actions" style="margin-top:14px">
        <a class="ac-btn" href="https://1train.nyc" target="_blank" rel="noopener"><span class="ac-icon">→</span><span class="ac-label">1train.nyc</span></a>
        <a class="ac-btn" href="https://github.com/cbalcarek" target="_blank" rel="noopener"><span class="ac-icon">gh</span><span class="ac-label">GitHub</span></a>
       </div>`
    : '';
  bsBody.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:10px;background:${d.color};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${d.icon}</div>
        <div>
          <div style="font-size:17px;font-weight:700">${d.title}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${d.sub}</div>
        </div>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin-bottom:10px">${d.body}</p>
      <p style="font-size:12px;color:#9ca3af">${d.cta}</p>
      ${actions}
    </div>`;
  openBS();
}

// ── ABOUT SHEET ──
function openAboutSheet() {
  const d = getAbout();
  const details = (d.details || []).map(x => `<div style="font-size:13px;color:#6b7280;margin-bottom:4px">${x}</div>`).join('');
  const GH_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
  const allActions = [
    ...(d.actions || []).map(a => ({ ...a, svg: a.icon === 'in' ? 'in' : a.icon === '✉️' ? '✉' : a.icon })),
    { label: 'GitHub', href: 'https://github.com/cbalcarek', svg: GH_SVG },
  ];
  const actions = allActions.map(a =>
    `<a class="id-link" href="${a.href}" target="_blank" rel="noopener noreferrer" aria-label="${a.label}" title="${a.label}">${a.svg}</a>`
  ).join('');
  const resumeBtn = d.resume
    ? `<a href="${d.resume}" target="_blank" rel="noopener" class="about-cta-btn" style="margin-right:8px">Resume ↗</a>`
    : '';
  bsBody.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <img src="/assets/headshot.jpg" alt="Colin Balcarek" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.1);flex-shrink:0">
        <div>
          <div style="font-size:20px;font-weight:700;line-height:1.2">Colin Balcarek</div>
          <div style="font-size:12px;color:#6b7280;margin-top:3px">Data & Platform PM · NYC</div>
        </div>
      </div>
      <p style="font-size:14px;line-height:1.65;color:#374151;margin-bottom:14px">${d.bio || ''}</p>
      <div style="margin-bottom:16px">${details}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px">
        ${resumeBtn}
        <a href="mailto:colin@balcarek.org" class="about-cta-btn about-cta-btn--primary">Get in touch →</a>
      </div>
      <div style="display:flex;gap:5px">${actions}</div>
    </div>`;
  openBS();
}

// ── LIGHTBOX ──
let _lbIdx = 0;
let _lbPhotos = [];

function openLightbox(photoList, startIdx) {
  _lbPhotos = photoList;
  _lbIdx = startIdx;
  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

function renderLightbox() {
  const p = _lbPhotos[_lbIdx];
  const img = document.getElementById('lb-img');
  img.src = p.src;
  img.style.objectPosition = '';
  img.onerror = () => { img.alt = 'Image unavailable'; };
  document.getElementById('lb-cap').textContent = p.cap;
  document.getElementById('lb-counter').textContent = `${_lbIdx + 1} / ${_lbPhotos.length}`;
  document.getElementById('lb-prev').style.opacity = _lbIdx === 0 ? '0.3' : '1';
  document.getElementById('lb-next').style.opacity = _lbIdx === _lbPhotos.length - 1 ? '0.3' : '1';
}

document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => {
  if (_lbIdx > 0) { _lbIdx--; renderLightbox(); }
});
document.getElementById('lb-next').addEventListener('click', () => {
  if (_lbIdx < _lbPhotos.length - 1) { _lbIdx++; renderLightbox(); }
});
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});
document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft'  && _lbIdx > 0) { _lbIdx--; renderLightbox(); }
  if (e.key === 'ArrowRight' && _lbIdx < _lbPhotos.length - 1) { _lbIdx++; renderLightbox(); }
});
