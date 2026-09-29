/* ============================================================
   المرحلة ١ — جزيرة الحروف
   الحروف معلّقة عالأشجار زي الفواكه، والطفل يضغط الحرف الصحيح
   فتمشي البنت وتحمله، ثم يضغط الشكل الصحيح بلونه فتضعه فيه.
   ============================================================ */

import {
  THREE, lam, COLORS, LETTERS_ALL, SPOTS, PRAISE, RETRY, HINT_FIRST,
  Sfx, voice, banner, setStars, world, billboard, tween, easeIO,
  addFruit, pickFruit, takeCarried, addPickable, addUpdater,
  buildIsland, registerGame, setReplay, girlWalkTo, burst, bigBurst,
} from './core.js?v=5';

const SHAPES = {
  square:   { name: 'المربع',  fem: false },
  circle:   { name: 'الدائرة', fem: true },
  triangle: { name: 'المثلث',  fem: false },
  star:     { name: 'النجمة',  fem: true },
};
const LETTERS = ['أ', 'ب', 'ت', 'ث', 'ج', 'د'].map(ch => LETTERS_ALL.find(l => l.ch === ch));
const MISSIONS = [
  { letter: 'أ', shape: 'square',   color: 'red' },
  { letter: 'ب', shape: 'circle',   color: 'blue' },
  { letter: 'ت', shape: 'triangle', color: 'yellow' },
  { letter: 'ث', shape: 'star',     color: 'green' },
  { letter: 'ج', shape: 'square',   color: 'blue' },
  { letter: 'د', shape: 'circle',   color: 'red' },
].map(m => {
  const l = LETTERS.find(x => x.ch === m.letter);
  const s = SHAPES[m.shape];
  m.text = `أحضر حرف ${l.name}، وضعه في ${s.name} ${COLORS[m.color][s.fem ? 'adjF' : 'adjM']}!`;
  return m;
});

const HINT_CARRY = { file: 'hint_carry', text: 'ممتاز! الآن ضعه في مكانه الصحيح.' };
const DONE_ALL   = { file: 'done',       text: 'أكملت كل المهمات! أنت بطل حقيقي!' };

/* أشكال الأرض */
function circlePts(r, n = 40) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return p;
}
function starPts(ro, ri) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : ro;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    p.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return p;
}
const SHAPE_PTS = {
  square:   { outer: [[-1.55, -1.55], [1.55, -1.55], [1.55, 1.55], [-1.55, 1.55]], k: .72 },
  circle:   { outer: circlePts(1.6), k: .68 },
  triangle: { outer: [[0, 1.85], [-1.66, -1.0], [1.66, -1.0]], k: .68 },
  star:     { outer: starPts(1.85, .8), k: .65 },
};
const ptsScaled = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);
function shapeFromPts(pts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function frameMesh(shape, colorHex) {
  const def = SHAPE_PTS[shape];
  const sh = shapeFromPts(def.outer);
  sh.holes.push(shapeFromPts(ptsScaled(def.outer, def.k)));
  const geo = new THREE.ShapeGeometry(sh);
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colorHex }));
}

/* حالة المرحلة */
let idx = 0, stars = 0, phase = 'idle', mission = null;
let targets = [], placedPlanes = [];

function shakeMesh(rec) {
  const base = rec.pivot ? rec.pivot.rotation.z : 0;
  if (rec.pivot) {
    tween(.55, k => { rec.pivot.rotation.z = base + Math.sin(k * Math.PI * 5) * .3 * (1 - k); }, () => { rec.pivot.rotation.z = base; });
  } else {
    const y0 = rec.frame.position.y;
    tween(.5, k => { rec.frame.position.y = y0 + Math.max(0, Math.sin(k * Math.PI * 3)) * .18; }, () => { rec.frame.position.y = y0; });
  }
}

function buildMission(i) {
  idx = i;
  phase = 'idle';
  mission = MISSIONS[i];
  banner.textContent = mission.text;
  targets = [];
  placedPlanes = [];

  /* أشكال الأرض: الصحيح + مشتّتين */
  const combos = Object.keys(SHAPES).flatMap(s => Object.keys(COLORS).map(c => s + '_' + c));
  const correctKey = mission.shape + '_' + mission.color;
  const dis = combos.filter(k => k !== correctKey).sort(() => Math.random() - .5).slice(0, 2);
  const spots = SPOTS.slice().sort(() => Math.random() - .5);
  [correctKey, ...dis].forEach((k, n) => {
    const [s, c] = k.split('_');
    const frame = frameMesh(s, COLORS[c].hex);
    frame.position.set(spots[n][0], 0.04, spots[n][1]);
    world.add(frame);
    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, .9, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.set(spots[n][0], .45, spots[n][1]);
    world.add(hit);
    const rec = {
      kind: 'target', shape: s, colorKey: c, key: s + '_' + c,
      frame, hit, center: frame.position.clone(),
      pos: frame.position.clone(),
      onTap: onTapTarget,
    };
    hit.userData.rec = rec;
    const dir = new THREE.Vector3(spots[n][0], 0, spots[n][1] - 1.2);
    if (dir.length() < .8) dir.set(0, 0, 1);
    dir.normalize();
    rec.walkPos = new THREE.Vector3(spots[n][0] + dir.x * 2.15, 0, spots[n][1] + dir.z * 2.15);
    addPickable(rec);
    targets.push(rec);
  });

  /* فواكه الحروف: الصحيح + مشتّتان */
  const others = LETTERS.filter(l => l.ch !== mission.letter).sort(() => Math.random() - .5).slice(0, 2);
  const letters = [mission.letter, ...others.map(l => l.ch)];
  const treeOrder = [0, 1, 2].sort(() => Math.random() - .5);
  const colorKeys = Object.keys(COLORS);
  letters.forEach((ch, n) => {
    addFruit(ch, colorKeys[Math.floor(Math.random() * colorKeys.length)], treeOrder[n], onTapFruit);
  });

  voice({ file: 'mission_' + (i + 1), text: mission.text });
}

function onTapFruit(rec) {
  if (phase === 'busy' || phase === 'carrying') return;
  if (rec.ch === mission.letter) {
    phase = 'busy';
    pickFruit(rec, () => {
      phase = 'carrying';
      banner.textContent = HINT_CARRY.text;
      voice(HINT_CARRY);
      targets.forEach(t => { t.hint = true; });
    });
  } else {
    shakeMesh(rec);
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
  }
}

function onTapTarget(rec) {
  if (phase === 'busy') return;
  if (phase !== 'carrying') { voice(HINT_FIRST); return; }
  if (rec.shape === mission.shape && rec.colorKey === mission.color) {
    phase = 'busy';
    targets.forEach(t => { t.hint = false; });
    girlWalkTo(rec.walkPos, () => placeLetter(rec));
  } else {
    shakeMesh(rec);
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
  }
}

function placeLetter(rec) {
  const carried = takeCarried();
  const plane = carried.plane;
  plane.removeFromParent();
  const from = new THREE.Vector3();
  plane.getWorldPosition(from);
  world.add(plane);
  plane.position.copy(from);
  const to = rec.center.clone();
  to.y = 1.72;
  tween(.6, k => {
    plane.position.lerpVectors(from, to, easeIO(k));
    plane.position.y += Math.sin(easeIO(k) * Math.PI) * 1.1;
  }, () => {
    tween(.28, k => { plane.scale.setScalar(1 + Math.sin(k * Math.PI) * .12); });
    placedPlanes.push(plane);
    succeed();
  });
}

function succeed() {
  phase = 'idle';
  Sfx.ding();
  burst();
  stars++;
  setStars(stars);
  voice(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  setTimeout(() => {
    if (idx + 1 < MISSIONS.length) buildMission(idx + 1);
    else finale();
  }, 1800);
}

function finale() {
  banner.textContent = 'أكملت كل المهمات! 🏆';
  voice(DONE_ALL);
  bigBurst();
  document.getElementById('finale').classList.add('show');
}

function levelUpdater(dt, t) {
  targets.forEach(tt => {
    tt.frame.scale.setScalar(tt.hint ? 1 + Math.sin(t * 5.5) * .07 : 1);
  });
  placedPlanes.forEach(p => billboard(p));
}

export function startLevel1() {
  buildIsland();
  stars = 0;
  setStars(0);
  addUpdater(levelUpdater);
  buildMission(0);
}

setReplay(() => {
  if (mission) voice({ file: 'mission_' + (idx + 1), text: mission.text });
});

document.getElementById('btn-again').addEventListener('click', () => {
  document.getElementById('finale').classList.remove('show');
  stars = 0;
  setStars(0);
  buildMission(0);
});

registerGame({
  id: 'island',
  emoji: '🏝️',
  title: 'جزيرة الحروف',
  desc: 'المرحلة ١ — حطّ الحرف المقطوف من الشجرة بالشكل الصح بلونه!',
  start: startLevel1,
});

window.__state = () => ({ phase, idx, stars, mission: mission ? mission.letter : null });
