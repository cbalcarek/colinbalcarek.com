'use strict';

// ── BOTTOM SHEET ──
const bs     = document.getElementById('bottom-sheet');
const bsBody = document.getElementById('bs-body');

function openBS()  { bs.classList.add('open'); }
function closeBS() { bs.classList.remove('open'); }

document.getElementById('bs-close').addEventListener('click', closeBS);
document.getElementById('bs-handle-row').addEventListener('click', closeBS);

let touchStartY = 0;
bs.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive:true });
bs.addEventListener('touchend',   e => { if (e.changedTouches[0].clientY - touchStartY > 60) closeBS(); }, { passive:true });

// ── PAGED WORK SHEET ──
let _workPageIdx = 0;

function openWorkSheet(idx) {
  _workPageIdx = idx;
  renderWorkSheet();
  openBS();
  map.flyTo({ center: WORK_STOPS[idx].coord, zoom: 13, duration: 600 });
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
          <div style="font-size:11px;color:#9ca3af">${d.dates}</div>
        </div>
      </div>
      <ul style="margin:0;padding-left:16px;font-size:13px;line-height:1.65;color:#374151">${bullets}</ul>
      ${actions}
      <div class="ws-pager">
        <button class="ws-arrow" id="ws-prev" ${_workPageIdx === 0 ? 'disabled' : ''}>←</button>
        <span class="ws-counter">${_workPageIdx + 1} / ${total}</span>
        <button class="ws-arrow" id="ws-next" ${_workPageIdx === total - 1 ? 'disabled' : ''}>→</button>
      </div>
    </div>`;
  document.getElementById('ws-prev').addEventListener('click', () => {
    if (_workPageIdx > 0) { _workPageIdx--; renderWorkSheet(); openWorkSheet(_workPageIdx); }
  });
  document.getElementById('ws-next').addEventListener('click', () => {
    if (_workPageIdx < getWorkDetail().length - 1) { _workPageIdx++; renderWorkSheet(); openWorkSheet(_workPageIdx); }
  });
}

// ── RUNNING SHEET ──
function openRunningSheet() {
  const n = MARATHON_DATA.length || 11;
  const photos = getRunningPhotos();
  const isDesktop = window.innerWidth > 680;
  const photoGrid = isDesktop
    ? `<div class="run-photo-desktop">
        <div class="rpd-hero run-photo-tap" data-idx="0">
          <img src="${photos[0].src}" alt="${photos[0].cap}" style="object-position:${photos[0].pos}">
          <span class="rpd-cap">${photos[0].cap}</span>
        </div>
        <div class="rpd-thumbs">
          ${photos.slice(1).map((p,i)=>`<div class="rpd-thumb run-photo-tap" data-idx="${i+1}"><img src="${p.src}" alt="${p.cap}" style="object-position:${p.pos}"><span>${p.cap}</span></div>`).join('')}
        </div>
      </div>`
    : `<div class="run-photo-grid">${photos.map((p,i)=>`<div class="run-photo-cell run-photo-tap" data-idx="${i}"><img src="${p.src}" alt="${p.cap}" style="object-position:${p.pos}"><span>${p.cap}</span></div>`).join('')}</div>`;
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
    ${photoGrid}
    ${statsRow}
    ${table}
  </div>`;
  openBS();

  setTimeout(() => {
    bsBody.querySelectorAll('.run-photo-tap').forEach(el => {
      el.addEventListener('click', () => openLightbox(photos, +el.dataset.idx));
    });
  }, 0);
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
  document.getElementById('lb-img').src = p.src;
  document.getElementById('lb-img').style.objectPosition = p.pos;
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

// ── MARATHON YEAR BUTTONS ──
const ysDiv = document.getElementById('marathon-year-selector');

function buildYearButtons(items) {
  ysDiv.querySelectorAll('.yr-btn').forEach(b => b.remove());
  const total = items.length;
  items.forEach((race, i) => {
    const btn = document.createElement('button');
    btn.className = 'yr-btn';
    btn.textContent = race.year;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.yr-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const finishNum = total - i;
      bsBody.innerHTML = `
        <div style="padding:4px 0 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <div style="width:36px;height:36px;border-radius:9px;background:#EE352E;display:flex;align-items:center;justify-content:center;font-size:20px">🏃</div>
            <div><div style="font-size:17px;font-weight:700">NYC Marathon ${race.year}</div><div style="font-size:12px;color:#6b7280">Finish #${finishNum} of ${total}</div></div>
          </div>
          <div style="display:flex;gap:12px;padding:12px 0;border-top:.5px solid rgba(0,0,0,.08);border-bottom:.5px solid rgba(0,0,0,.08);margin-bottom:12px">
            <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700;color:#EE352E">${race.time||'—'}</div><div style="font-size:10px;color:#6b7280">Time</div></div>
            <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700">${race.pace ? race.pace+'/mi' : '—'}</div><div style="font-size:10px;color:#6b7280">Pace</div></div>
            <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:700">${finishNum}</div><div style="font-size:10px;color:#6b7280">of ${total}</div></div>
          </div>
          <p style="font-size:13px;color:#374151">Staten Island → Brooklyn → Queens → The Bronx → Central Park.</p>
        </div>`;
      openBS();
    });
    ysDiv.appendChild(btn);
  });
}
