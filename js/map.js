'use strict';

// ── MAP STYLE SWITCHER ──
const mssBtns = document.getElementById('mss-btns');
MAP_STYLES.forEach(s => {
  const btn = document.createElement('button');
  btn.className = 'map-style-btn' + (s.id === 'standard' ? ' active' : '');
  btn.dataset.style = s.id;
  btn.textContent = s.label;
  btn.addEventListener('click', () => switchMapStyle(s.id));
  mssBtns.appendChild(btn);
});

// ── MODE PILLS ──
document.querySelectorAll('.mode-pill').forEach(b =>
  b.addEventListener('click', () => setMode(b.dataset.mode))
);

// ── ZOOM CONTROLS ──
document.getElementById('zoom-in').addEventListener('click',  () => map.zoomIn());
document.getElementById('zoom-out').addEventListener('click', () => map.zoomOut());

// ── SEARCH TOGGLE ──
const searchToggle  = document.getElementById('search-toggle');
const searchExpand  = document.getElementById('search-expand');
searchToggle.addEventListener('click', () => {
  const open = !searchExpand.hidden;
  searchExpand.hidden = open;
  searchToggle.setAttribute('aria-expanded', String(!open));
  if (!open) { setTimeout(() => document.getElementById('search-input').focus(), 50); }
  else { document.getElementById('search-results').style.display = 'none'; }
});

// ── SEARCH ──
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.style.display = 'none'; return; }
  const hits = getSearchIndex().filter(i =>
    i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)
  ).slice(0, 5);
  if (!hits.length) { searchResults.style.display = 'none'; return; }
  searchResults.innerHTML = hits.map(m =>
    `<div class="sr-item" data-mode="${escapeHtml(m.key)}" role="button" tabindex="0">
       <div class="sr-icon" style="background:${escapeHtml(m.color)}">${escapeHtml(m.icon)}</div>
       <div><div class="sr-title">${escapeHtml(m.title)}</div><div class="sr-sub">${escapeHtml(m.sub)}</div></div>
     </div>`
  ).join('');
  searchResults.style.display = 'block';
  searchResults.querySelectorAll('.sr-item').forEach(item => {
    item.addEventListener('click', () => {
      setMode(item.dataset.mode);
      searchResults.style.display = 'none';
      searchInput.value = '';
    });
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('#identity-header')) {
    searchResults.style.display = 'none';
  }
});

// ── TAP HINT — show once ──
if (!localStorage.getItem('tap_hint_v1')) {
  const hint = document.getElementById('tap-hint');
  setTimeout(() => hint.classList.add('show'), 1200);
  setTimeout(() => {
    hint.classList.remove('show');
    localStorage.setItem('tap_hint_v1', '1');
  }, 4500);
}

// ── MARATHON DATA ──
loadMarathons().then(items => {
  MARATHON_DATA = items;
  buildYearButtons(items);
  if (currentMode === 'running') setMode('running');
});

// ── CLOSE BOTTOM SHEET ON EMPTY MAP CLICK ──
map.on('click', e => {
  if (!e.originalEvent.defaultPrevented) closeBS();
});

map.getCanvas().addEventListener('click', e => {
  if (!e.defaultPrevented) closeBS();
});
