/* ============================================================
   المرحلة ٢ — حيوانات الحروف
   ٣ حيوانات جعانة و٣ حروف على الأشجار. الطفل يضغط الحرف فتمشي
   البنت وتحمله فوق راسها، ثم يضغط الحيوان اللي بيبلش اسمه بنفس
   الحرف فتطعمه ياه — فيضغض ويقفر فرحان ويطلع قلب.
   لما تُطعَم الحيوانات الثلاثة، تجي جولة جديدة بحيوانات جداد.
   جميع الحروف العربية الـ٢٨ مدعومة.
   ============================================================ */

import {
  THREE, COLORS, LETTERS_ALL, SPOTS, PRAISE, RETRY, HINT_FIRST,
  Sfx, voice, banner, setStars, world, scene, billboard, tween, easeIO,
  addFruit, clearFruits, pickFruit, takeCarried, addPickable, clearPickables,
  addUpdater, buildIsland, registerGame, setReplay, girlWalkTo, burst,
} from './core.js?v=6';

const INSTR = {
  file: 'intro_animals',
  text: 'أهلاً! كل حيوان هنا بيبلش اسمو بحرف معين. اضغط على الحرف، وبعدين اضغط على الحيوان حتى تطعمه ياه!',
};

/* ---------- الحيوانات الـ٢٨ (كل اسم بيبلش بحرفو) ---------- */
const ANIMALS = {
  'أ': { name: 'أسد',         emoji: '🦁' },
  'ب': { name: 'بطة',         emoji: '🦆' },
  'ت': { name: 'تمساح',       emoji: '🐊' },
  'ث': { name: 'ثعلب',        emoji: '🦊' },
  'ج': { name: 'جمل',         emoji: '🐫' },
  'ح': { name: 'حوت',         emoji: '🐋' },
  'خ': { name: 'خروف',        emoji: '🐑' },
  'د': { name: 'ديك',         emoji: '🐓' },
  'ذ': { name: 'ذئب',         emoji: '🐺' },
  'ر': { name: 'راكون',       emoji: '🦝' },
  'ز': { name: 'زرافة',       emoji: '🦒' },
  'س': { name: 'سلحفاة',      emoji: '🐢' },
  'ش': { name: 'شمبانزي',     emoji: '🐒' },
  'ص': { name: 'صقر',         emoji: '🦅' },
  'ض': { name: 'ضفدع',        emoji: '🐸' },
  'ط': { name: 'طاووس',       emoji: '🦚' },
  'ظ': { name: 'ظربان',       emoji: '🐿️' },
  'ع': { name: 'عصفور',       emoji: '🐦' },
  'غ': { name: 'غزال',        emoji: '🦌' },
  'ف': { name: 'فيل',         emoji: '🐘' },
  'ق': { name: 'قطة',         emoji: '🐱' },
  'ك': { name: 'كنغر',        emoji: '🦘' },
  'ل': { name: 'لاما',        emoji: '🦙' },
  'م': { name: 'ماعز',        emoji: '🐐' },
  'ن': { name: 'نمر',         emoji: '🐆' },
  'ه': { name: 'هدهد',        draw: drawHoopoe },
  'و': { name: 'وحيد القرن',  emoji: '🦏' },
  'ي': { name: 'يعسوب',       draw: drawDragonfly },
};

/* ---------- حيوانات مرسومة يدوياً (لا يوجد إيموجي لها) ---------- */
function drawHoopoe(c) {
  // الجسم
  c.fillStyle = '#e09a5a';
  c.beginPath(); c.ellipse(128, 182, 56, 48, 0, 0, Math.PI * 2); c.fill();
  // جناحان مخططان
  [-1, 1].forEach(sg => {
    c.fillStyle = '#2d2a26';
    c.beginPath(); c.ellipse(128 + sg * 58, 178, 26, 46, sg * .25, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(128 + sg * 58, 162, 24, 7, sg * .25, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(128 + sg * 58, 190, 24, 7, sg * .25, 0, Math.PI * 2); c.fill();
  });
  // الرأس
  c.fillStyle = '#e09a5a';
  c.beginPath(); c.arc(128, 108, 48, 0, Math.PI * 2); c.fill();
  // التاج (ريش برتقالي بأطراف سوداء)
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * .38;
    c.save();
    c.translate(128, 74);
    c.rotate(a);
    c.fillStyle = '#e09a5a';
    c.fillRect(-7, -52, 14, 52);
    c.fillStyle = '#2d2a26';
    c.fillRect(-7, -52, 14, 16);
    c.restore();
  }
  // المنقار الطويل المنحني
  c.strokeStyle = '#2d2a26';
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(128, 122);
  c.quadraticCurveTo(132, 160, 124, 196);
  c.stroke();
  // العيون
  [-1, 1].forEach(sg => {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(128 + sg * 20, 104, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2d2a26';
    c.beginPath(); c.arc(128 + sg * 20, 106, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(128 + sg * 22, 103, 2.2, 0, Math.PI * 2); c.fill();
  });
}

function drawDragonfly(c) {
  // الأجنحة الشفافة
  c.fillStyle = 'rgba(191, 227, 242, .75)';
  c.strokeStyle = 'rgba(120, 180, 210, .9)';
  c.lineWidth = 3;
  [-1, 1].forEach(sg => {
    c.beginPath(); c.ellipse(128 + sg * 66, 92, 62, 20, sg * -.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(128 + sg * 62, 136, 56, 18, sg * .45, 0, Math.PI * 2); c.fill(); c.stroke();
  });
  // البطن المقطع
  for (let i = 0; i < 5; i++) {
    c.fillStyle = i % 2 ? '#74b9ff' : '#2e86c1';
    c.beginPath();
    c.ellipse(128, 168 + i * 22, 15 - i * 2.4, 13, 0, 0, Math.PI * 2);
    c.fill();
  }
  // الصدر
  c.fillStyle = '#2e86c1';
  c.beginPath(); c.ellipse(128, 128, 22, 26, 0, 0, Math.PI * 2); c.fill();
  // الرأس والعيون الكبيرة
  c.fillStyle = '#1b6ca8';
  c.beginPath(); c.arc(128, 88, 27, 0, Math.PI * 2); c.fill();
  [-1, 1].forEach(sg => {
    c.fillStyle = '#1b6ca8';
    c.beginPath(); c.arc(128 + sg * 18, 76, 15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(128 + sg * 18, 76, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2d3436';
    c.beginPath(); c.arc(128 + sg * 19, 77, 3.6, 0, Math.PI * 2); c.fill();
  });
  // ابتسامة
  c.strokeStyle = '#fff';
  c.lineWidth = 3.5;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(128, 96, 9, .35, Math.PI - .35);
  c.stroke();
}

/* ---------- رسومات ---------- */
function emojiTexture(emoji) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  c.font = '200px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, 128, 138);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function animalTexture(info) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  if (info.draw) {
    info.draw(c);
  } else {
    c.font = '200px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(info.emoji, 128, 138);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function labelTexture(name, accent) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const c = cv.getContext('2d');
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  c.lineJoin = 'round';
  const first = name[0], rest = name.slice(1);
  // الحروف الواصلة تُرَدّ بطـونل حتى تظهر بصيغتها المتصلة أول الكلمة (هـدهد بدل هدهد)
  const CONNECTS = !'اأإآدذرزوء'.includes(first);
  const head = CONNECTS ? first + 'ـ' : first;
  c.font = '800 128px "Baloo Bhaijaan 2", sans-serif';
  const w1 = c.measureText(head).width;
  c.font = '800 96px "Baloo Bhaijaan 2", sans-serif';
  const w2 = c.measureText(rest).width;
  const rightX = 256 + (w1 + w2) / 2;
  c.font = '800 128px "Baloo Bhaijaan 2", sans-serif';
  c.lineWidth = 16; c.strokeStyle = 'rgba(0,0,0,.5)';
  c.strokeText(head, rightX - w1 / 2, 74);
  c.fillStyle = accent;
  c.fillText(head, rightX - w1 / 2, 74);
  c.font = '800 96px "Baloo Bhaijaan 2", sans-serif';
  c.strokeText(rest, rightX - w1 - w2 / 2, 80);
  c.fillStyle = '#fff';
  c.fillText(rest, rightX - w1 - w2 / 2, 80);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function heartTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.font = '100px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('❤️', 64, 68);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const HEART_TEX = heartTexture();

/* ---------- بناء حيوان (إيموجي + ظل + لوحة اسم) ---------- */
function makeAnimal(ch, spot) {
  const info = ANIMALS[ch];

  const group = new THREE.Group();
  group.position.set(spot[0], 0, spot[1]);
  group.rotation.y = (Math.random() - .5) * .3;
  world.add(group);

  const body = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 2.3),
    new THREE.MeshBasicMaterial({ map: animalTexture(info), transparent: true, depthWrite: false })
  );
  body.geometry.translate(0, 0, 0);
  body.position.y = 1.2;
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.85, 20),
    new THREE.MeshBasicMaterial({ color: 0x1b4332, transparent: true, opacity: .2, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .02;
  group.add(shadow);

  const colorKeys = Object.keys(COLORS);
  const accentCss = COLORS[colorKeys[Math.floor(Math.random() * colorKeys.length)]].css;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, .9),
    new THREE.MeshBasicMaterial({ map: labelTexture(info.name, accentCss), transparent: true, depthWrite: false })
  );
  label.position.set(spot[0], 2.95, spot[1]);
  world.add(label);

  const dir = new THREE.Vector3(spot[0], 0, spot[1] - 1.2);
  if (dir.length() < .8) dir.set(0, 0, 1);
  dir.normalize();

  const rec = {
    kind: 'animal', ch, key: ch, name: info.name,
    group, body, label, fed: false,
    baseY: 0, hopY: 0, chew: 0, phase: Math.random() * 6,
    walkPos: new THREE.Vector3(spot[0] + dir.x * 2.1, 0, spot[1] + dir.z * 2.1),
    mouthWorld: () => {
      const p = new THREE.Vector3(spot[0], 1.2, spot[1]);
      return p;
    },
    onTap: onTapAnimal,
  };
  // مسافة النقر: اسطوانة حول الحيوان (محلية حول مركزه — نصف قطر أصغر حتى لا تتداخل الجيران)
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.6, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.set(0, 1.3, 0);
  hit.userData.rec = rec;
  group.add(hit);
  rec.hit = hit;
  rec.pos = new THREE.Vector3(spot[0], 1.3, spot[1]);
  return rec;
}

function floatHeart(x, y, z) {
  const heart = new THREE.Mesh(
    new THREE.PlaneGeometry(.7, .7),
    new THREE.MeshBasicMaterial({ map: HEART_TEX, transparent: true, depthWrite: false })
  );
  heart.position.set(x, y, z);
  world.add(heart);
  tween(1.0, k => {
    heart.position.y = y + k * 1.4;
    heart.position.x = x + Math.sin(k * Math.PI * 3) * .2;
    heart.material.opacity = 1 - k;
  }, () => {
    heart.removeFromParent();
    heart.geometry.dispose();
    heart.material.dispose();
  });
}

/* ---------- جولات اللعبة ---------- */
let phase = 'idle', fed = 0, stars = 0, round = 0, lastLetters = [];
let animals = [];

function clearRound() {
  clearFruits();
  animals.forEach(a => {
    a.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    a.group.removeFromParent();
    a.label.removeFromParent();
    a.label.geometry.dispose();
    a.label.material.map.dispose();
    a.label.material.dispose();
  });
  animals = [];
  clearPickables();
}

function newRound() {
  clearRound();
  round++;
  phase = 'idle';
  fed = 0;

  /* اختيار ٣ حروف جداد (بدون تكرار الجولة السابقة) */
  const pool = LETTERS_ALL.filter(l => !lastLetters.includes(l.ch)).sort(() => Math.random() - .5);
  const picked = pool.slice(0, 3);
  lastLetters = picked.map(l => l.ch);

  /* فواكه الحروف على الأشجار */
  const colorKeys = Object.keys(COLORS);
  const treeOrder = [0, 1, 2].sort(() => Math.random() - .5);
  picked.forEach((l, n) => {
    addFruit(l.ch, colorKeys[Math.floor(Math.random() * colorKeys.length)], treeOrder[n], onTapFruit);
  });

  /* الحيوانات */
  const spots = SPOTS.slice().sort(() => Math.random() - .5).slice(0, 3);
  picked.forEach((l, n) => {
    const rec = makeAnimal(l.ch, spots[n]);
    addPickable(rec);
    animals.push(rec);
  });

  if (round === 1) {
    banner.textContent = 'كل حيوان بيبلش اسمو بحرف معين — طعّم كل واحد حرفه!';
    voice(INSTR);
  } else {
    banner.textContent = 'جولة جديدة! طعّم كل حيوان حرفه!';
    Sfx.ding();
  }
}

function onTapFruit(rec) {
  if (phase !== 'idle') return;
  phase = 'busy';
  pickFruit(rec, () => {
    phase = 'carrying';
    const l = LETTERS_ALL.find(x => x.ch === rec.ch);
    banner.textContent = `حلو! هلّق طعّم الحيوان اللي بيبلش اسمو بحرف ${l.name}!`;
    voice({ file: 'letter_' + rec.ch, text: l.name });
  });
}

function headShake(rec) {
  const base = rec.group.rotation.y;
  tween(.55, k => { rec.group.rotation.y = base + Math.sin(k * Math.PI * 5) * .25 * (1 - k); }, () => { rec.group.rotation.y = base; });
}

function onTapAnimal(rec) {
  if (phase === 'busy') return;
  if (phase !== 'carrying') { voice(HINT_FIRST); return; }
  const carried = window.__carrying();
  if (rec.ch === carried) {
    phase = 'busy';
    girlWalkTo(rec.walkPos, () => feed(rec));
  } else {
    headShake(rec);
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
  }
}

function feed(rec) {
  const carried = takeCarried();
  const plane = carried.plane;
  plane.removeFromParent();
  const from = new THREE.Vector3();
  plane.getWorldPosition(from);
  scene.add(plane);
  plane.position.copy(from);
  const to = rec.mouthWorld();
  tween(.55, k => {
    plane.position.lerpVectors(from, to, easeIO(k));
    plane.position.y += Math.sin(easeIO(k) * Math.PI) * .5;
    plane.scale.setScalar(1 - .8 * k);
  }, () => {
    plane.removeFromParent();
    plane.geometry.dispose();
    if (plane.material.map) plane.material.map.dispose();
    plane.material.dispose();
    eat(rec);
  });
}

function eat(rec) {
  rec.fed = true;
  // ضغض: انضغاط وتمدد
  tween(1.0, k => { rec.chew = Math.abs(Math.sin(k * Math.PI * 3)) * .18; }, () => { rec.chew = 0; });
  Sfx.munch();
  tween(.4, k => { rec.hopY = Math.sin(k * Math.PI) * .45; }, () => { rec.hopY = 0; });
  floatHeart(rec.group.position.x, 2.1, rec.group.position.z);
  stars++;
  setStars(stars);
  voice(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  fed++;
  if (fed >= 3) {
    banner.textContent = 'أكملت الجولة! 🎉 جاي دور حيوانات جداد…';
    burst(120);
    setTimeout(() => newRound(), 2300);
  } else {
    banner.textContent = 'رائع! في حيوانات تانية جعانة!';
    phase = 'idle';
  }
}

function animalUpdater(dt, t) {
  animals.forEach(a => {
    const idleBob = a.fed ? 0 : Math.sin(t * 2.2 + a.phase) * .06;
    a.group.position.y = a.hopY + idleBob;
    a.body.scale.set(1 + a.chew * .6, 1 - a.chew, 1);
    billboard(a.body);
    billboard(a.label);
  });
}

export function startLevel2() {
  buildIsland();
  stars = 0;
  setStars(0);
  fed = 0;
  round = 0;
  lastLetters = [];
  addUpdater(animalUpdater);
  newRound();
}

setReplay(() => voice(INSTR));

registerGame({
  id: 'animals',
  emoji: '🦁',
  title: 'حيوانات الحروف',
  desc: 'المرحلة ٢ — طعّم كل حيوان الحرف اللي بيبلش بيه اسمو!',
  start: startLevel2,
});

window.__state2 = () => ({ phase, fed, round, stars, carrying: window.__carrying() });
window.__spawnAnimal = (ch, x = 0, z = 4.2) => {
  const rec = makeAnimal(ch, [x, z]);
  addPickable(rec);
  animals.push(rec);
  return rec.name;
};
