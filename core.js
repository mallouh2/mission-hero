import * as THREE from './vendor/three.module.js';

/* ============================================================
   بطل المهمات — النواة المشتركة بين الألعاب
   (المشهد، الجزيرة، البنت، فواكه الحروف، الصوت، القائمة)
   كل لعبة جديدة = ملف يصدّر start() ويسجّل نفسه بالقائمة.
   ============================================================ */

export { THREE };
export const lam = c => new THREE.MeshLambertMaterial({ color: c });

/* ---------- بيانات مشتركة ---------- */
export const COLORS = {
  red:    { name: 'أحمر', adjM: 'الأحمر', adjF: 'الحمراء', hex: 0xe74c3c, css: '#e74c3c' },
  blue:   { name: 'أزرق', adjM: 'الأزرق', adjF: 'الزرقاء', hex: 0x0984e3, css: '#0984e3' },
  yellow: { name: 'أصفر', adjM: 'الأصفر', adjF: 'الصفراء', hex: 0xf39c12, css: '#f39c12' },
  green:  { name: 'أخضر', adjM: 'الأخضر', adjF: 'الخضراء', hex: 0x00b894, css: '#00b894' },
};
export const LETTERS_ALL = [
  { ch: 'أ', name: 'الألف' },   { ch: 'ب', name: 'الباء' },
  { ch: 'ت', name: 'التاء' },   { ch: 'ث', name: 'الثاء' },
  { ch: 'ج', name: 'الجيم' },   { ch: 'ح', name: 'الحاء' },
  { ch: 'خ', name: 'الخاء' },   { ch: 'د', name: 'الدال' },
  { ch: 'ذ', name: 'الذال' },   { ch: 'ر', name: 'الراء' },
  { ch: 'ز', name: 'الزاي' },   { ch: 'س', name: 'السين' },
  { ch: 'ش', name: 'الشين' },   { ch: 'ص', name: 'الصاد' },
  { ch: 'ض', name: 'الضاد' },   { ch: 'ط', name: 'الطا' },
  { ch: 'ظ', name: 'الظا' },    { ch: 'ع', name: 'العين' },
  { ch: 'غ', name: 'الغين' },   { ch: 'ف', name: 'الفا' },
  { ch: 'ق', name: 'القاف' },   { ch: 'ك', name: 'الكاف' },
  { ch: 'ل', name: 'اللام' },   { ch: 'م', name: 'الميم' },
  { ch: 'ن', name: 'النون' },   { ch: 'ه', name: 'الهاء' },
  { ch: 'و', name: 'الواو' },   { ch: 'ي', name: 'الياء' },
];
export const TREES = [{ x: -5.2, z: -5.0 }, { x: 0, z: -7.6 }, { x: 5.2, z: -5.0 }];
export const SPOTS = [[-3.2, 2.6], [0, 4.2], [3.2, 2.6], [0, 1.0]];
export const PRAISE = [
  { file: 'praise_1', text: 'أحسنت!' },
  { file: 'praise_2', text: 'رائع جداً!' },
  { file: 'praise_3', text: 'برافو عليك!' },
];
export const RETRY = [
  { file: 'retry_1', text: 'حاول مرة ثانية، أنت تقدر!' },
  { file: 'retry_2', text: 'ليس هذا! انظر جيداً!' },
];
export const HINT_FIRST = { file: 'hint_first', text: 'أولاً أحضر الحرف!' };

/* ---------- الصوت ---------- */
export const Sfx = {
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
  munch() { this.ensure(); this.tone(170, 0, .07, 'square', .1); this.tone(140, .12, .07, 'square', .1); this.tone(170, .24, .07, 'square', .1); },
};

export function tts(text) {
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

export function voice(v) {
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
export const banner = document.getElementById('mission-banner');
export const starCount = document.getElementById('star-count');
export const container = document.getElementById('scene3d');
export const arNum = n => n.toLocaleString('ar-EG');

export function setStars(n) { starCount.textContent = arNum(n); }
export function starUp(current) { setStars(current); }

/* ---------- المشهد ---------- */
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
container.appendChild(renderer.domElement);
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9be7ff);
scene.fog = new THREE.Fog(0x9be7ff, 34, 72);
export const camera = new THREE.PerspectiveCamera(52, 1, .1, 120);
camera.position.set(0, 10.4, 20.5);

export const world = new THREE.Group();   // محتوى اللعبة الحالية
scene.add(world);

function resize() {
  const w = container.clientWidth || 1, h = container.clientHeight || 1;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

scene.add(new THREE.HemisphereLight(0xffffff, 0x9ccf70, 1.05));
const sun = new THREE.DirectionalLight(0xfff3d6, 1.1);
sun.position.set(8, 14, 6);
scene.add(sun);

/* ---------- الغيوم ---------- */
const clouds = [];
function cloud(x, y, z, s) {
  const g = new THREE.Group();
  [[0, 0, 0, 1], [.9, .15, .1, .7], [-.85, .1, -.05, .65]].forEach(([cx, cy, cz, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 10, 8), lam(0xffffff));
    m.position.set(cx * s, cy * s, cz * s);
    g.add(m);
  });
  g.position.set(x, y, z);
  scene.add(g);
  clouds.push({ g, a: Math.random() * 6, r: Math.hypot(x, z), y });
}
cloud(-14, 8.5, -10, 1.4); cloud(12, 10, -14, 1.7); cloud(2, 9, -20, 1.2); cloud(17, 8, 6, 1.3);

/* ---------- الجزيرة (مشتركة) ---------- */
export function buildIsland() {
  const water = new THREE.Mesh(new THREE.CircleGeometry(48, 48), new THREE.MeshBasicMaterial({ color: 0x3fb0e8 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.62;
  world.add(water);

  const sand = new THREE.Mesh(new THREE.CylinderGeometry(13.8, 15.2, 1.5, 44), lam(0xf0dca2));
  sand.position.y = -0.95;
  world.add(sand);

  const grass = new THREE.Mesh(new THREE.CylinderGeometry(12.3, 12.9, 0.55, 44), lam(0x7ecb5f));
  grass.position.y = -0.27;
  world.add(grass);

  [[-4.2, 6.8, .55], [5.4, 7.2, .7], [9.6, -1.2, .5]].forEach(([x, z, s]) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), lam(0xb2b6bd));
    m.position.set(x, s * .55, z);
    m.rotation.set(.4, Math.random() * 6, .2);
    world.add(m);
  });
  [[-8.8, 3.4, .6], [8.6, 3.8, .55], [-2.4, 8.2, .5], [2.8, -8.8, .6]].forEach(([x, z, s]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), lam(0x4cb944));
    m.position.set(x, s * .6, z);
    world.add(m);
  });

  TREES.forEach(t => {
    const g = new THREE.Group();
    g.position.set(t.x, 0, t.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.32, .45, 2.9, 10), lam(0x96613a));
    trunk.position.y = 1.45;
    g.add(trunk);
    [[0, 3.9, 0, 1.55], [-1.05, 3.35, .3, 1.05], [1.0, 3.4, -.2, 1.1], [0, 4.6, -.5, .95]].forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), lam(0x3faf5c));
      m.position.set(x, y, z);
      g.add(m);
    });
    [[-.5, 3.0, .95], [.55, 3.05, .9]].forEach(([x, y, z]) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 8), lam(0x6b4a2b));
      c.position.set(x, y, z);
      g.add(c);
    });
    world.add(g);
  });
}

/* ---------- البنت الصغيرة ---------- */
const GIRL = { skin: 0xf7c5a4, hair: 0x4a2c1a, dress: 0xff6b81 };
export const girl = new THREE.Group();
girl.visible = false;
scene.add(girl);
export let carryAnchor;
{
  const skinM = lam(GIRL.skin), hairM = lam(GIRL.hair), dressM = lam(GIRL.dress);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.75, 20), new THREE.MeshBasicMaterial({ color: 0x1b4332, transparent: true, opacity: .22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .02;
  girl.add(shadow);
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(.13, .11, .78, 10), skinM);
  legL.geometry.translate(0, -.39, 0);
  legL.position.set(-.19, .82, 0);
  girl.add(legL);
  const legR = legL.clone();
  legR.position.x = .19;
  girl.add(legR);
  const dress = new THREE.Mesh(new THREE.CylinderGeometry(.34, .8, 1.1, 18), dressM);
  dress.position.y = 1.32;
  girl.add(dress);
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(.09, .08, .64, 10), skinM);
  armL.geometry.translate(0, -.32, 0);
  armL.position.set(-.52, 1.78, 0);
  armL.rotation.z = .3;
  girl.add(armL);
  const armR = armL.clone();
  armR.position.x = .52;
  armR.rotation.z = -.3;
  girl.add(armR);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.52, 18, 14), skinM);
  head.position.y = 2.42;
  girl.add(head);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(.55, 18, 14), hairM);
  hairBack.position.set(0, 2.5, -.08);
  hairBack.scale.set(1, .95, 1);
  girl.add(hairBack);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(.53, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), hairM);
  fringe.position.set(0, 2.46, 0);
  girl.add(fringe);
  const p1 = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hairM);
  p1.position.set(-.58, 2.28, -.05);
  girl.add(p1);
  const p2 = p1.clone();
  p2.position.x = .58;
  girl.add(p2);
  [[-.19], [.19]].forEach(([x]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2d3436 }));
    e.position.set(x, 2.48, .45);
    girl.add(e);
  });
  [[-.33], [.33]].forEach(([x]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb3ba }));
    b.position.set(x, 2.36, .42);
    girl.add(b);
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.11, .022, 8, 14, Math.PI), new THREE.MeshBasicMaterial({ color: 0x843b3b }));
  smile.position.set(0, 2.32, .47);
  smile.rotation.z = Math.PI;
  girl.add(smile);
  carryAnchor = new THREE.Group();
  carryAnchor.position.set(0, 4.9, 0);
  girl.add(carryAnchor);
  girl.userData.legs = { legL, legR, armL, armR };
}

/* ---------- حركة البنت ---------- */
export const gs = { pos: new THREE.Vector3(0, 0, 7.2), angle: Math.PI, phase: 0, sw: 0, target: null, onArrive: null };
export function girlWalkTo(v, cb) {
  gs.target = v.clone();
  gs.onArrive = cb;
}
export function resetGirl(x = 0, z = 7.2) {
  gs.pos.set(x, 0, z);
  gs.angle = Math.PI;
  gs.phase = 0;
  gs.sw = 0;
  gs.target = null;
  gs.onArrive = null;
  girl.visible = true;
}
const _v = new THREE.Vector3();
export function lerpAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

/* ---------- الكاميرا ---------- */
export let camTheta = 0;
export function resetCamera() { camTheta = 0; }
const CAM_R = 14, CAM_H = 10.4;
const camWant = new THREE.Vector3();
function updateCamera(dt) {
  camWant.set(
    Math.sin(camTheta) * CAM_R,
    CAM_H,
    Math.cos(camTheta) * CAM_R + gs.pos.z * .25
  );
  camera.position.lerp(camWant, Math.min(1, dt * 4));
  // تقييد انزياح النظرة حتى لا تنزلق الأشياء الأمامية خارج الكادر
  const lookZ = Math.min(1.4, Math.max(-1.2, gs.pos.z * .3 - 1.0));
  camera.lookAt(gs.pos.x * .35, 1.2, lookZ);
}

/* ---------- توينات ---------- */
const tweens = [];
export function tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }
export const easeIO = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/* ---------- فواكه الحروف ---------- */
function letterTexture(ch, colorCss) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#7a4a22';
  c.fillRect(122, 6, 12, 32);
  c.fillStyle = '#3faf5c';
  c.beginPath(); c.ellipse(148, 20, 16, 8, -.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = colorCss;
  c.beginPath(); c.arc(128, 140, 108, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.18)';
  c.lineWidth = 10;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.beginPath(); c.ellipse(92, 96, 26, 16, -.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.font = '800 150px "Baloo Bhaijaan 2", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, 128, 152);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export let fruits = [];
export function clearFruits() {
  fruits.forEach(f => {
    f.pivot.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    f.pivot.removeFromParent();
  });
  fruits = [];
}
export function addFruit(ch, colorKey, treeIdx, onTap) {
  const color = COLORS[colorKey];
  const pivot = new THREE.Group();
  pivot.position.set(TREES[treeIdx].x * .82 + (treeIdx === 1 ? .45 : 0), 2.75, TREES[treeIdx].z + 1.35);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    new THREE.MeshBasicMaterial({ map: letterTexture(ch, color.css), transparent: true, depthWrite: false })
  );
  plane.geometry.translate(0, -0.9, 0);
  pivot.add(plane);
  const hit = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.y = -0.9;
  pivot.add(hit);
  world.add(pivot);
  const rec = {
    kind: 'letter', ch, colorKey, colorCss: color.css,
    pivot, plane, hit, phase: Math.random() * 6,
    walkPos: new THREE.Vector3(TREES[treeIdx].x, 0, TREES[treeIdx].z + 2.8),
    pos: pivot.position.clone(),
    onTap,
  };
  hit.userData.rec = rec;
  fruits.push(rec);
  addPickable(rec);
  return rec;
}

export let carried = null; // { plane, ch, colorCss }
export function pickFruit(rec, cb) {
  Sfx.pop();
  girlWalkTo(rec.walkPos, () => {
    const from = new THREE.Vector3();
    rec.plane.getWorldPosition(from);
    rec.pivot.removeFromParent();
    fruits = fruits.filter(f => f !== rec);
    scene.add(rec.plane);
    rec.plane.position.copy(from);
    const to = new THREE.Vector3();
    carryAnchor.getWorldPosition(to);
    tween(.5, k => {
      rec.plane.position.lerpVectors(from, to, easeIO(k));
      rec.plane.position.y += Math.sin(easeIO(k) * Math.PI) * .8;
    }, () => {
      rec.plane.removeFromParent();
      rec.plane.position.set(0, 0, 0);
      carryAnchor.add(rec.plane);
      carried = { plane: rec.plane, ch: rec.ch, colorCss: rec.colorCss };
      if (cb) cb();
    });
  });
}
export function takeCarried() {
  const c = carried;
  carried = null;
  return c;
}
export function dropCarried() {
  if (!carried) return;
  carried.plane.removeFromParent();
  carried.plane.geometry.dispose();
  if (carried.plane.material.map) carried.plane.material.map.dispose();
  carried.plane.material.dispose();
  carried = null;
}

/* ---------- القابل للنقر (raycast) ---------- */
export let pickables = [];
export function addPickable(rec) { pickables.push(rec); }
export function clearPickables() { pickables = []; }

const ray = new THREE.Raycaster();
let pDown = null, dragging = false;
renderer.domElement.addEventListener('pointerdown', e => {
  pDown = { x: e.clientX, y: e.clientY, theta: camTheta };
  dragging = false;
});
addEventListener('pointermove', e => {
  if (!pDown) return;
  const dx = e.clientX - pDown.x;
  if (dragging || Math.abs(dx) > 9) {
    dragging = true;
    camTheta = Math.max(-1.35, Math.min(1.35, pDown.theta - dx * .005));
  }
});
addEventListener('pointerup', e => {
  if (!pDown) return;
  const wasDrag = dragging;
  pDown = null;
  if (wasDrag || girl.visible === false) return;
  const r = renderer.domElement.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
  const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hits = ray.intersectObjects(pickables.map(p => p.hit), false);
  window.__lastPick = {
    x: e.clientX, y: e.clientY, nx: +nx.toFixed(2), ny: +ny.toFixed(2),
    hitCount: hits.length,
    hitKind: hits.length ? hits[0].object.userData.rec.kind + ':' + (hits[0].object.userData.rec.key || hits[0].object.userData.rec.ch) : null,
  };
  if (hits.length) {
    const rec = hits[0].object.userData.rec;
    if (rec.onTap) rec.onTap(rec);
  }
});

/* ---------- الكونفيتي ---------- */
const confettiCanvas = document.getElementById('confetti');
const c2d = confettiCanvas.getContext('2d');
let parts = [], confettiRunning = false;
function sizeCanvas() { confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
sizeCanvas();
addEventListener('resize', sizeCanvas);
const CONF_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#fd79a8'];
export function burst(n = 90) {
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
  if (!confettiRunning) { confettiRunning = true; tickConfetti(); }
}
export function bigBurst() {
  burst(160);
  setTimeout(() => burst(120), 500);
  setTimeout(() => burst(120), 1000);
}
function tickConfetti() {
  c2d.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  parts = parts.filter(p => p.life-- > 0 && p.y < confettiCanvas.height + 30);
  for (const p of parts) {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= .99;
    c2d.save();
    c2d.translate(p.x, p.y);
    c2d.rotate(p.r);
    c2d.fillStyle = p.c;
    c2d.globalAlpha = Math.min(1, p.life / 40);
    c2d.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
    c2d.restore();
  }
  if (parts.length) requestAnimationFrame(tickConfetti);
  else { confettiRunning = false; c2d.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}

/* ---------- لوحة/بطاقة قائمة الألعاب ---------- */
const GAMES = [];
export function registerGame(g) { GAMES.push(g); }
function renderMenu() {
  const box = document.getElementById('menu-games');
  box.innerHTML = '';
  GAMES.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.innerHTML = `<span class="emoji">${g.emoji}</span><span><span class="t">${g.title}</span><br><span class="d">${g.desc}</span></span>`;
    btn.addEventListener('click', () => beginLevel(g));
    box.appendChild(btn);
  });
}

let currentLevelId = null;
export function levelId() { return currentLevelId; }

/* ---------- إدارة الألعاب ---------- */
const updaters = new Set();
export function addUpdater(fn) { updaters.add(fn); }
export function clearUpdaters() { updaters.clear(); }

export function clearWorld() {
  dropCarried();
  clearPickables();
  clearUpdaters();
  world.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (o.material.map) o.material.map.dispose();
      o.material.dispose();
    }
  });
  world.clear();
  fruits = [];
}

function beginLevel(g) {
  Sfx.ensure();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.lang = 'ar';
    speechSynthesis.speak(u);
  } catch (e) { /* لا شيء */ }
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('finale').classList.remove('show');
  clearWorld();
  resetCamera();
  resetGirl();
  setStars(0);
  currentLevelId = g.id;
  g.start();
}

export function showMenu() {
  tts('');
  clearWorld();
  girl.visible = false;
  banner.textContent = '…';
  setStars(0);
  currentLevelId = null;
  document.getElementById('finale').classList.remove('show');
  document.getElementById('start-screen').style.display = 'flex';
}

/* زر إعادة الصوت: كل لعبة تضبط replayFn */
let replayFn = null;
export function setReplay(fn) { replayFn = fn; }

/* ---------- حلقة الرسم ---------- */
const _pq = new THREE.Quaternion();
export function billboard(plane) {
  plane.parent.getWorldQuaternion(_pq).invert();
  plane.quaternion.copy(_pq.multiply(camera.quaternion));
}

const clock = new THREE.Clock();
let elapsed = 0;
function step(dt, render = true) {
  elapsed += dt;
  const t = elapsed;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
  }

  if (girl.visible) {
    if (gs.target) {
      _v.subVectors(gs.target, gs.pos);
      _v.y = 0;
      const dist = _v.length();
      if (dist < .15) {
        gs.pos.copy(gs.target);
        gs.target = null;
        const cb = gs.onArrive;
        gs.onArrive = null;
        if (cb) cb();
      } else {
        _v.normalize();
        gs.pos.addScaledVector(_v, Math.min(dist, 3.4 * dt));
        gs.angle = lerpAngle(gs.angle, Math.atan2(_v.x, _v.z), Math.min(1, dt * 9));
        gs.phase += dt * 11;
      }
    }
    gs.sw += ((gs.target ? 1 : 0) - gs.sw) * Math.min(1, dt * 8);
    girl.position.set(gs.pos.x, Math.abs(Math.sin(gs.phase)) * .09 * gs.sw, gs.pos.z);
    girl.rotation.y = gs.angle;
    const swing = Math.sin(gs.phase) * gs.sw;
    girl.userData.legs.legL.rotation.x = swing * .6;
    girl.userData.legs.legR.rotation.x = -swing * .6;
    girl.userData.legs.armL.rotation.x = -swing * .45;
    girl.userData.legs.armR.rotation.x = swing * .45;
  }

  fruits.forEach(f => {
    f.pivot.rotation.z = Math.sin(t * 1.7 + f.phase) * .09;
    billboard(f.plane);
  });
  if (carried) billboard(carried.plane);

  updaters.forEach(fn => fn(dt, t));

  clouds.forEach(c => {
    c.a += dt * .02;
    c.g.position.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r);
  });

  updateCamera(dt);
  if (render) renderer.render(scene, camera);
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  step(dt);
}

/* ---------- الأزرار ---------- */
document.getElementById('btn-home').addEventListener('click', showMenu);
document.getElementById('btn-audio').addEventListener('click', () => { if (replayFn) replayFn(); });

/* ---------- خطافات اختبار ---------- */
window.__tap = (kind, key) => {
  const r = pickables.find(p => p.kind === kind && (p.key === key || p.ch === key));
  if (r && r.onTap) r.onTap(r);
};
window.__screenPosOf = (kind, key) => {
  const r = pickables.find(p => p.kind === kind && (p.key === key || p.ch === key));
  if (!r || !r.hit) return null;
  const p = new THREE.Vector3();
  r.hit.getWorldPosition(p);
  p.project(camera);
  const el = renderer.domElement.getBoundingClientRect();
  return { x: (p.x + 1) / 2 * el.width + el.left, y: (1 - p.y) / 2 * el.height + el.top };
};
window.__carrying = () => (carried ? carried.ch : null);
window.__level = () => currentLevelId;
window.__pickables = () => pickables.map(p => ({ kind: p.kind, key: p.key || p.ch }));
/* تقديم يدوي للزمن (للاختبار): يشغّل تحديثات اللعبة بدون انتظار إطارات العرض */
window.__pump = secs => {
  const n = Math.max(1, Math.round(secs * 60));
  for (let i = 0; i < n; i++) step(1 / 60, false);
  renderer.render(scene, camera);
  return window.__boot;
};

/* ---------- تشغيل ---------- */
/* ملاحظة: لا يستخدم core.js أي await بمستواه الأعلى حتى يكتمل تقييمه
   قبل أن تستورد ملفات المراحل ثنائياً — وإلا حدث جمود دوري (deadlock). */
window.__boot = 'fonts';
(async () => {
  try {
    await Promise.race([
      document.fonts.load('800 150px "Baloo Bhaijaan 2"'),
      new Promise(r => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* الخط الاحتياطي */ }

  window.__boot = 'levels';
  window.__letters = LETTERS_ALL;
  await import('./level1.js').catch(err => {
    window.__loadErrors = (window.__loadErrors || []).concat(['level1: ' + (err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : err)]);
  });
  await import('./level2.js').catch(err => {
    window.__loadErrors = (window.__loadErrors || []).concat(['level2: ' + (err && err.message ? err.message : err)]);
  });
  window.__boot = 'menu';
  renderMenu();
  window.__boot = 'animate';
  animate();
})();
