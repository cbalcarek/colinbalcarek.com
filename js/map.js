'use strict';


// ── MODE PILLS ──
document.querySelectorAll('.mode-pill').forEach(b => {
  b.addEventListener('click', () => {
    if (b.id === 'pill-about') {
      if (b.classList.contains('active')) {
        b.classList.remove('active');
        closeBS();
      } else {
        contentReady.then(() => {
          document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
          b.classList.add('active');
          openAboutSheet();
        });
      }
    } else {
      if (b.classList.contains('active')) {
        setMode('all');
      } else {
        contentReady.then(() => setMode(b.dataset.mode));
      }
    }
  });
});

// ── IDENTITY CARD → ABOUT SHEET ──
const ihMain = document.getElementById('ih-main');
function openAboutFromCard(e) {
  if (e.target.closest('#ih-actions')) return; // don't intercept action buttons
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
  document.getElementById('pill-about').classList.add('active');
  openAboutSheet();
}
ihMain.addEventListener('click', openAboutFromCard);
ihMain.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openAboutFromCard(e); });



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
  if (currentMode === 'running') openRunningSheet();
});

// ── CLOSE BOTTOM SHEET ON EMPTY MAP CLICK ──
map.on('click', e => {
  if (!e.originalEvent.defaultPrevented) closeBS();
});

map.getCanvas().addEventListener('click', e => {
  if (!e.defaultPrevented) closeBS();
});
