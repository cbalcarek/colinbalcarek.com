'use strict';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·- ';

const LINES = [
  { row: 'sb-r1', text: 'COLIN  BALCAREK' },
  { row: 'sb-r2', text: 'TECHNICAL  PRODUCT  MANAGER' },
  { row: 'sb-r3', text: 'NEW  YORK  CITY  ·  2026' },
];

function makeCells(rowId, text) {
  const row = document.getElementById(rowId);
  return text.split('').map(ch => {
    const cell = document.createElement('div');
    cell.className = 'sb-cell' + (ch === ' ' ? ' space' : '');
    cell.innerHTML = `<div class="sb-top">${ch === ' ' ? '&nbsp;' : ch}</div><div class="sb-bot">${ch === ' ' ? '&nbsp;' : ch}</div>`;
    row.appendChild(cell);
    return { el: cell, final: ch };
  });
}

function animateLine(cells, baseDelay) {
  const promises = cells.map((c, i) => {
    if (c.final === ' ') return Promise.resolve();
    return new Promise(res => {
      setTimeout(() => {
        let n = 0;
        const top = c.el.querySelector('.sb-top');
        const bot = c.el.querySelector('.sb-bot');
        const iv = setInterval(() => {
          const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
          top.textContent = ch;
          bot.textContent = ch;
          n++;
          if (n > 5 + Math.floor(Math.random() * 4)) {
            clearInterval(iv);
            top.textContent = c.final;
            bot.textContent = c.final;
            res();
          }
        }, 60);
      }, baseDelay + i * 35);
    });
  });
  return Promise.all(promises);
}

function dismissSolari() {
  const sol = document.getElementById('solari');
  sol.classList.add('hide');
  setTimeout(() => { sol.style.display = 'none'; }, 700);
}

async function runSolari() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById('solari').style.display = 'none';
    return;
  }

  const allCells = LINES.map(l => makeCells(l.row, l.text));
  for (let i = 0; i < allCells.length; i++) {
    await animateLine(allCells[i], i * 120);
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 1000));
  dismissSolari();
}

document.addEventListener('DOMContentLoaded', () => {
  const skipBtn = document.getElementById('solari-skip');

  // Only show Solari once per session
  if (localStorage.getItem('solari_v1')) {
    document.getElementById('solari').style.display = 'none';
    return;
  }

  runSolari().then(() => localStorage.setItem('solari_v1', '1'));

  skipBtn.addEventListener('click', () => {
    const s = document.getElementById('solari');
    s.classList.add('hide');
    setTimeout(() => { s.style.display = 'none'; }, 400);
    localStorage.setItem('solari_v1', '1');
  });
});
