'use strict';

/* ============================================================
   بطل المهمات — نموذج أولي
   مهمة = (حرف) + (شكل هدف بلون). الطفل يضغط الحرف الصحيح فتمشي
   الشخصية وتحمله، ثم يضغط الشكل الصحيح بلونه فتضعه فيه.
   الصوت: إن وُجد ملف audio/<اسم>.mp3 يُشغَّل، وإلا يُنطق آلياً.
   ============================================================ */

/* ---------- بيانات اللعبة ---------- */
const COLORS = {
  red:    { name: 'أحمر', hex: '#e74c3c' },
  blue:   { name: 'أزرق', hex: '#0984e3' },
  yellow: { name: 'أصفر', hex: '#f39c12' },
  green:  { name: 'أخضر', hex: '#00b894' },
};
const SHAPES = {
  square:   { name: 'المربع' },
  circle:   { name: 'الدائرة' },
  triangle: { name: 'المثلث' },
  star:     { name: 'النجمة' },
};
const LETTERS = [
  { ch: 'أ', name: 'الألف' },
  { ch: 'ب', name: 'الباء' },
  { ch: 'ت', name: 'التاء' },
  { ch: 'ث', name: 'الثاء' },
  { ch: 'ج', name: 'الجيم' },
  { ch: 'د', name: 'الدال' },
];
const MISSIONS = [
  { letter: 'أ', shape: 'square',   color: 'red' },
  { letter: 'ب', shape: 'circle',   color: 'blue' },
  { letter: 'ت', shape: 'triangle', color: 'yellow' },
  { letter: 'ث', shape: 'star',     color: 'green' },
  { letter: 'ج', shape: 'square',   color: 'blue' },
  { letter: 'د', shape: 'circle',   color: 'red' },
].map(m => {
  const l = LETTERS.find(x => x.ch === m.letter);
  m.text = `أحضر حرف ${l.name}، وضعه في ${SHAPES[m.shape].name} ${'ال' + COLORS[m.color].name}!`;
  return m;
});

const PRAISE = [
  { file: 'praise_1', text: 'أحسنت!' },
  { file: 'praise_2', text: 'رائع جداً!' },
  { file: 'praise_3', text: 'برافو عليك!' },
];
const RETRY = [
  { file: 'retry_1', text: 'حاول مرة ثانية، أنت تقدر!' },
  { file: 'retry_2', text: 'ليس هذا! انظر جيداً!' },
];
const HINT_CARRY = { file: 'hint_carry', text: 'ممتاز! الآن ضعه في مكانه الصحيح.' };
const HINT_FIRST = { file: 'hint_first', text: 'أولاً أحضر الحرف!' };
const DONE_ALL   = { file: 'done',       text: 'أكملت كل المهمات! أنت بطل حقيقي!' };

/* ---------- الصوت ---------- */
const Sfx = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* لا شيء */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, t0, dur, type = 'sine', gain = .18) {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + t0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .02);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.start(t); o.stop(t + dur + .05);
  },
  ding()  { this.ensure(); this.tone(660, 0, .18); this.tone(880, .12, .3); },
  pop()   { this.ensure(); this.tone(440, 0, .1, 'triangle'); },
  wrong() { this.ensure(); this.tone(220, 0, .2, 'sine', .12); this.tone(180, .15, .25, 'sine', .12); },
};

function tts(text) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar';
    const ar = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ar'));
    if (ar) u.voice = ar;
    u.rate = .95;
    speechSynthesis.speak(u);
  } catch (e) { /* لا شيء */ }
}

function voice(v) {
  if (!v) return;
  let settled = false;
  const fallback = () => { if (!settled) { settled = true; tts(v.text); } };
  try {
    const a = new Audio('audio/' + v.file + '.mp3');
    a.addEventListener('error', fallback, { once: true });
    a.addEventListener('playing', () => { settled = true; }, { once: true });
    a.play().catch(fallback);
  } catch (e) { fallback(); }
}

/* ---------- عناصر الصفحة ---------- */
const $ = s => document.querySelector(s);
const scene = $('#scene');
const banner = $('#mission-banner');
const starCount = $('#star-count');
const targetsEl = $('#targets');
const itemsLayer = document.createElement('div');
scene.appendChild(itemsLayer);
const confettiCanvas = $('#confetti');
const arNum = n => n.toLocaleString('ar-EG');

const state = { idx: 0, stars: 0, phase: 'idle', charX: 60, moving: false, mission: null };

/* ---------- رسومات ---------- */
const SHAPE_PATHS = {
  square:   '<rect x="12" y="12" width="76" height="76" rx="10"/>',
  circle:   '<circle cx="50" cy="50" r="38"/>',
  triangle: '<polygon points="50,12 92,86 8,86"/>',
  star:     '<polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38"/>',
};
function shapeSVG(shape, hex) {
  return `<svg viewBox="0 0 100 100"><g class="outline" fill="rgba(255,255,255,.3)" stroke="${hex}" stroke-width="7" stroke-linejoin="round">${SHAPE_PATHS[shape]}</g></svg>`;
}

/* شخصية مؤقتة (روبوت) — تُستبدل لاحقاً بشخصية من صورة المستخدم */
const CHAR_SVG = `
<svg viewBox="0 0 100 130">
  <g class="bob">
    <g class="flip">
      <rect x="46" y="-10" width="8" height="14" rx="4" fill="#576574"/>
      <circle cx="50" cy="-12" r="6" fill="#ff6b6b"/>
      <rect x="24" y="2" width="52" height="42" rx="16" fill="#74b9ff" stroke="#487eb0" stroke-width="3"/>
      <circle cx="38" cy="20" r="7" fill="#fff"/><circle cx="62" cy="20" r="7" fill="#fff"/>
      <circle cx="39" cy="21" r="3" fill="#2d3436"/><circle cx="63" cy="21" r="3" fill="#2d3436"/>
      <path d="M40 33 Q50 40 60 33" stroke="#2d3436" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="28" y="46" width="44" height="46" rx="14" fill="#ff9f43" stroke="#e67e22" stroke-width="3"/>
      <rect class="arm arm-l" x="12" y="48" width="13" height="34" rx="6.5" fill="#ff9f43" stroke="#e67e22" stroke-width="3"/>
      <rect class="arm arm-r" x="75" y="48" width="13" height="34" rx="6.5" fill="#ff9f43" stroke="#e67e22" stroke-width="3"/>
      <rect class="leg leg-l" x="34" y="90" width="13" height="36" rx="6.5" fill="#576574"/>
      <rect class="leg leg-r" x="53" y="90" width="13" height="36" rx="6.5" fill="#576574"/>
    </g>
  </g>
</svg>`;

const charEl = document.createElement('div');
charEl.id = 'char';
charEl.innerHTML = CHAR_SVG + '<div class="item-slot"></div>';
scene.appendChild(charEl);
charEl.style.left = state.charX + '%';
const slot = charEl.querySelector('.item-slot');

/* ---------- الحركة ---------- */
function walkTo(x, cb) {
  const dist = Math.abs(x - state.charX);
  if (dist < 1.5) { cb(); return; }
  charEl.querySelector('.flip').style.transform = x < state.charX ? 'scaleX(-1)' : 'scaleX(1)';
  charEl.classList.add('walking');
  const dur = Math.max(.5, dist / 20);
  state.moving = true;
  charEl.style.transition = `left ${dur}s linear`;
  charEl.style.left = x + '%';
  setTimeout(() => {
    charEl.classList.remove('walking');
    state.moving = false;
    state.charX = x;
    cb();
  }, dur * 1000 + 60);
}

/* ---------- بناء المهمة ---------- */
function buildMission(i) {
  state.idx = i;
  state.phase = 'idle';
  state.mission = MISSIONS[i];
  banner.textContent = state.mission.text;

  /* أشكال الهدف على الطاولة: الصحيح + مشتّتان */
  targetsEl.innerHTML = '';
  const combos = Object.keys(SHAPES).flatMap(s => Object.keys(COLORS).map(c => s + '_' + c));
  const correctKey = state.mission.shape + '_' + state.mission.color;
  const distractors = combos.filter(k => k !== correctKey).sort(() => Math.random() - .5).slice(0, 2);
  [correctKey, ...distractors].sort(() => Math.random() - .5).forEach(k => {
    const [s, c] = k.split('_');
    const el = document.createElement('div');
    el.className = 'target';
    el.dataset.key = k;
    el.innerHTML = shapeSVG(s, COLORS[c].hex);
    el.addEventListener('pointerdown', () => onTapTarget(el));
    targetsEl.appendChild(el);
  });

  /* حروف على الأرض: الصحيح + حرفان مشتّتان */
  itemsLayer.innerHTML = '';
  const xs = [38, 58, 78, 90].sort(() => Math.random() - .5).slice(0, 3);
  const others = LETTERS.filter(l => l.ch !== state.mission.letter)
    .sort(() => Math.random() - .5).slice(0, 2);
  [state.mission.letter, ...others.map(l => l.ch)].forEach((ch, n) => {
    const colorKeys = Object.keys(COLORS);
    const color = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.letter = ch;
    el.style.left = xs[n] + '%';
    el.innerHTML = `<span class="glyph" style="color:${COLORS[color].hex}">${ch}</span>`;
    el.addEventListener('pointerdown', () => onTapItem(el));
    itemsLayer.appendChild(el);
  });

  voice({ file: 'mission_' + (i + 1), text: state.mission.text });
}

/* ---------- التفاعل ---------- */
function shakeEl(el, cls) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 450);
}

function onTapItem(el) {
  if (state.moving || state.phase !== 'idle') return;
  if (el.dataset.letter === state.mission.letter) {
    Sfx.pop();
    const x = parseFloat(el.style.left);
    walkTo(x, () => {
      const glyph = el.querySelector('.glyph');
      slot.innerHTML = '';
      slot.appendChild(glyph);
      el.remove();
      state.phase = 'carrying';
      voice(HINT_CARRY);
      targetsEl.querySelectorAll('.target').forEach(t => t.classList.add('correct-hint'));
    });
  } else {
    shakeEl(el, 'wrong');
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
  }
}

function onTapTarget(el) {
  if (state.moving) return;
  if (state.phase !== 'carrying') { voice(HINT_FIRST); return; }
  const [s, c] = el.dataset.key.split('_');
  if (s === state.mission.shape && c === state.mission.color) {
    targetsEl.querySelectorAll('.target').forEach(t => t.classList.remove('correct-hint'));
    walkTo(33, () => placeInTarget(el));
  } else {
    shakeEl(el, 'wrong');
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
  }
}

function placeInTarget(targetEl) {
  const glyph = slot.querySelector('.glyph');
  const s = scene.getBoundingClientRect();
  const t = targetEl.getBoundingClientRect();
  const l = glyph.getBoundingClientRect();
  slot.innerHTML = '';
  const fly = document.createElement('span');
  fly.className = 'glyph flying';
  fly.style.color = glyph.style.color;
  fly.textContent = glyph.textContent;
  fly.style.left = (l.left + l.width / 2 - s.left) + 'px';
  fly.style.top  = (l.top + l.height / 2 - s.top) + 'px';
  scene.appendChild(fly);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fly.style.transition = 'left .55s ease, top .55s ease';
    fly.style.left = (t.left + t.width / 2 - s.left) + 'px';
    fly.style.top  = (t.top + t.height / 2 - s.top) + 'px';
  }));
  setTimeout(() => {
    fly.remove();
    const inside = document.createElement('span');
    inside.className = 'glyph placed-glyph';
    inside.style.color = fly.style.color;
    inside.textContent = fly.textContent;
    targetEl.appendChild(inside);
    targetEl.classList.add('filled');
    succeed();
  }, 620);
}

function succeed() {
  state.phase = 'idle';
  Sfx.ding();
  burst();
  state.stars++;
  starCount.textContent = arNum(state.stars);
  voice(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  setTimeout(() => {
    if (state.idx + 1 < MISSIONS.length) buildMission(state.idx + 1);
    else finale();
  }, 1800);
}

function finale() {
  banner.textContent = 'أكملت كل المهمات! 🏆';
  voice(DONE_ALL);
  bigBurst();
  $('#finale').classList.add('show');
}

/* ---------- الكونفيتي ---------- */
const c2d = confettiCanvas.getContext('2d');
let parts = [], confettiRunning = false;
function sizeCanvas() { confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
sizeCanvas();
addEventListener('resize', sizeCanvas);
const CONF_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#fd79a8'];
function burst(n = 90) {
  for (let i = 0; i < n; i++) {
    parts.push({
      x: innerWidth / 2 + (Math.random() - .5) * 120,
      y: innerHeight * .25,
      vx: (Math.random() - .5) * 9, vy: Math.random() * -7 - 2,
      g: .28, s: 6 + Math.random() * 7,
      c: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3, life: 110,
    });
  }
  if (!confettiRunning) { confettiRunning = true; tick(); }
}
function bigBurst() {
  burst(160);
  setTimeout(() => burst(120), 500);
  setTimeout(() => burst(120), 1000);
}
function tick() {
  c2d.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  parts = parts.filter(p => p.life-- > 0 && p.y < confettiCanvas.height + 30);
  for (const p of parts) {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= .99;
    c2d.save();
    c2d.translate(p.x, p.y); c2d.rotate(p.r);
    c2d.fillStyle = p.c;
    c2d.globalAlpha = Math.min(1, p.life / 40);
    c2d.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
    c2d.restore();
  }
  if (parts.length) requestAnimationFrame(tick);
  else { confettiRunning = false; c2d.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}

/* ---------- الأزرار ---------- */
$('#btn-start').addEventListener('click', () => {
  Sfx.ensure();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.lang = 'ar';
    speechSynthesis.speak(u);
  } catch (e) { /* لا شيء */ }
  $('#start-screen').style.display = 'none';
  state.stars = 0;
  starCount.textContent = arNum(0);
  buildMission(0);
});
$('#btn-again').addEventListener('click', () => {
  $('#finale').classList.remove('show');
  state.stars = 0;
  starCount.textContent = arNum(0);
  buildMission(0);
});
$('#btn-audio').addEventListener('click', () => {
  if (state.mission) voice({ file: 'mission_' + (state.idx + 1), text: state.mission.text });
});
