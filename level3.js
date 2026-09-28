/* ============================================================
   المرحلة ٣ — مطبخ الوصفات
   طاولة وقِدر طبخ عالجزيرة، وفواكه ملونة منثورة عالأرض.
   الطباخة البنت بتقرأ وصفة: "أحضر لي فاكرتين حمراوين!" — الطفل
   يضغط الفواكه الصح (لون + عدد) فتمشي البنت وتجيبهن وتحطهن
   بالقِدر وحدة وحدة. لما تكتمل الوصفة، القِدر يغلي وتطلع الأكلة
   بالاحتفال — وبعدها وصفة جديدة. بيتعلم العدّ (١-٣) والألوان.
   ============================================================ */

import {
  THREE, RECIPE_SENTENCES, PRAISE, RETRY,
  Sfx, voice, banner, setStars, world, scene, billboard, tween, easeIO,
  addPickable, clearPickables, addUpdater, buildIsland, registerGame,
  setReplay, girlWalkTo, carryAnchor, burst, arNum,
} from './core.js';

const INSTR = {
  file: 'intro_kitchen',
  text: 'أهلاً بالمطبخ! اسمع الوصفة واضغط على الفواكه الصح حتى نطبخ مع بعض!',
};

/* ---------- الفواكه والألوان ---------- */
const FRUITS = [
  { emoji: '🍎', color: 'red' },
  { emoji: '🍓', color: 'red' },
  { emoji: '🍏', color: 'green' },
  { emoji: '🍌', color: 'yellow' },
  { emoji: '🍋', color: 'yellow' },
  { emoji: '🍊', color: 'orange' },
  { emoji: '🍇', color: 'purple' },
];
const COLORS3 = {
  red:    { hex: 0xe74c3c },
  yellow: { hex: 0xf1c40f },
  green:  { hex: 0x2ecc71 },
  orange: { hex: 0xe67e22 },
  purple: { hex: 0x9b59b6 },
};
const DISHES = ['🥗', '🍲', '🍰', '🧃', '🍨'];

/* متطلبات ممكنة: مفتاح الجملة + اللون المقبول + أقصى عدد متاح بالأرض */
const REQ_DEFS = [
  { key: 'apple',      color: 'red',    max: 2 }, // تفاحتان (تفاحتان منثورتان)
  { key: 'apple3',     color: 'red',    max: 3 }, // تفاحة + زبطة
  { key: 'zbeeteh',    color: 'red',    max: 1 },
  { key: 'greenApple', color: 'green',  max: 1 },
  { key: 'banana',     color: 'yellow', max: 1 },
  { key: 'lemon',      color: 'yellow', max: 1 },
  { key: 'orange',     color: 'orange', max: 1 },
  { key: 'grapes',     color: 'purple', max: 1 },
];
const reqVoice = (def, count) => ({
  file: 'recipe_' + def.key + '_' + count,
  text: RECIPE_SENTENCES[def.key][count],
});

/* ---------- رسومات ---------- */
function fruitTexture(emoji) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  c.font = '190px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, 128, 138);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- المطبخ: طاولة وقِدر ---------- */
let potGroup = null;
function buildKitchen() {
  const g = new THREE.Group();
  g.position.set(0, 0, 1.6);
  const wood = 0xb98a55, woodDark = 0x96683c;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, .18, 1.8), new THREE.MeshLambertMaterial({ color: wood }));
  top.position.y = 1.12;
  g.add(top);
  [[-1.2, -.65], [1.2, -.65], [-1.2, .65], [1.2, .65]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.09, .08, 1.05, 8), new THREE.MeshLambertMaterial({ color: woodDark }));
    leg.position.set(x, .53, z);
    g.add(leg);
  });
  // القِدر
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.82, .66, .78, 20), new THREE.MeshLambertMaterial({ color: 0xd94f3d }));
  pot.position.y = 1.62;
  g.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.82, .07, 10, 24), new THREE.MeshLambertMaterial({ color: 0xb03a2a }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.99;
  g.add(rim);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(.74, 20), new THREE.MeshBasicMaterial({ color: 0x5d1a1a }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 1.98;
  g.add(inner);
  world.add(g);
  potGroup = { g, pot, rim, inner, dishSpot: new THREE.Vector3(0, 3.0, 1.6) };
}

/* ---------- عناصر الجولة ---------- */
let phase = 'idle', stars = 0, round = 0;
let reqIndex = 0, reqNeed = 0, reqDone = 0;
let recipe = null, items = [], dishMesh = null;
let steamRunning = false;

const ITEM_SPOTS = [[-3.2, 4.8], [-1.7, 6.2], [1.7, 6.2], [3.2, 4.8], [-3.2, 2.8], [3.2, 2.8], [-2.1, 1.3], [2.1, 1.3]];

function clearItems() {
  clearPickables();
  items.forEach(it => {
    it.plane.removeFromParent();
    it.plane.geometry.dispose();
    if (it.plane.material.map) it.plane.material.map.dispose();
    it.plane.material.dispose();
    it.shadow.removeFromParent();
    it.shadow.geometry.dispose();
    it.shadow.material.dispose();
  });
  items = [];
}

function makeItem(fruit, spot, idx) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ map: fruitTexture(fruit.emoji), transparent: true, depthWrite: false })
  );
  plane.position.set(spot[0], .95, spot[1]);
  world.add(plane);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.5, 16),
    new THREE.MeshBasicMaterial({ color: 0x1b4332, transparent: true, opacity: .2, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(spot[0], .02, spot[1]);
  world.add(shadow);
  const rec = {
    kind: 'item', colorKey: fruit.color, key: fruit.color + '_' + idx, emoji: fruit.emoji,
    plane, shadow, phase: Math.random() * 6, baseY: .95,
    walkPos: new THREE.Vector3(spot[0], 0, spot[1] + 1.1),
    pos: new THREE.Vector3(spot[0], .95, spot[1]),
    onTap: onTapItem,
  };
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 1.9, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.set(0, 0, 0); // بمركز الفاكهة نفسها
  hit.userData.rec = rec;
  plane.add(hit); // اللوحة بتواجه الكاميرا، واللمس محلي حول مركزها
  rec.hit = hit;
  addPickable(rec);
  items.push(rec);
}

function onTapItem(rec) {
  if (phase !== 'idle') return;
  const req = recipe.reqs[reqIndex];
  if (rec.colorKey !== req.color) {
    // اهتزاز لطيف
    const base = rec.plane.position.x;
    tween(.5, k => { rec.plane.position.x = base + Math.sin(k * Math.PI * 5) * .18 * (1 - k); }, () => { rec.plane.position.x = base; });
    Sfx.wrong();
    voice(RETRY[Math.floor(Math.random() * RETRY.length)]);
    return;
  }
  phase = 'busy';
  Sfx.pop();
  girlWalkTo(rec.walkPos, () => {
    rec.inHand = true; // المحدّث ما يععدل موقعها بعدها
    // الفاكهة بتطير لموف البنت
    const from = rec.plane.position.clone();
    rec.plane.removeFromParent();
    rec.shadow.removeFromParent();
    scene.add(rec.plane);
    rec.plane.position.copy(from);
    const to = new THREE.Vector3();
    carryAnchor.getWorldPosition(to);
    tween(.45, k => {
      rec.plane.position.lerpVectors(from, to, easeIO(k));
      rec.plane.position.y += Math.sin(easeIO(k) * Math.PI) * .6;
    }, () => {
      rec.plane.removeFromParent();
      rec.plane.position.set(0, 0, 0);
      carryAnchor.add(rec.plane);
      // البنت تمشي عالقِدر وتحطها
      girlWalkTo(new THREE.Vector3(0, 0, 4.1), () => dropInPot(rec));
    });
  });
}

function dropInPot(rec) {
  const plane = rec.plane;
  plane.removeFromParent();
  const from = new THREE.Vector3();
  plane.getWorldPosition(from);
  scene.add(plane);
  plane.position.copy(from);
  const to = new THREE.Vector3(0, 2.0, 1.6);
  tween(.5, k => {
    plane.position.lerpVectors(from, to, easeIO(k));
    plane.position.y += Math.sin(easeIO(k) * Math.PI) * .7;
    plane.scale.setScalar(1 - .75 * k);
  }, () => {
    plane.removeFromParent();
    plane.geometry.dispose();
    if (plane.material.map) plane.material.map.dispose();
    plane.material.dispose();
    items = items.filter(it => it !== rec);
    Sfx.munch();
    reqDone++;
    if (reqDone < reqNeed) {
      banner.textContent = `حلو! باقي ${arNum(reqNeed - reqDone)} — ${recipe.reqs[reqIndex].text} (${arNum(reqDone)}/${arNum(reqNeed)})`;
      phase = 'idle';
    } else {
      nextRequirement();
    }
  });
}

function nextRequirement() {
  reqIndex++;
  reqDone = 0;
  if (reqIndex < recipe.reqs.length) {
    const req = recipe.reqs[reqIndex];
    reqNeed = req.count;
    banner.textContent = `${req.text} (${arNum(0)}/${arNum(reqNeed)})`;
    voice(reqVoice(req.def, req.count));
    phase = 'idle';
  } else {
    cook();
  }
}

function cook() {
  phase = 'busy';
  banner.textContent = 'طبخ! 🎉';
  Sfx.ding();
  // القِدر يهتز ويغلي
  tween(1.2, k => {
    potGroup.g.position.x = Math.sin(k * Math.PI * 8) * .07 * (1 - k);
    potGroup.pot.position.y = 1.62 + Math.abs(Math.sin(k * Math.PI * 6)) * .1;
  }, () => {
    potGroup.g.position.x = 0;
    potGroup.pot.position.y = 1.62;
    // الأكلة تطلع
    const dish = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.9),
      new THREE.MeshBasicMaterial({ map: fruitTexture(recipe.dish), transparent: true, depthWrite: false })
    );
    dish.position.copy(potGroup.dishSpot);
    dish.scale.setScalar(.01);
    world.add(dish);
    dishMesh = dish;
    tween(.4, k => { dish.scale.setScalar(.01 + .99 * easeIO(k)); });
    burst();
    stars++;
    setStars(stars);
    voice(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    banner.textContent = `صارت الأكلة! ${recipe.dish} — نجمة جديدة!`;
    setTimeout(() => {
      dish.removeFromParent();
      dish.geometry.dispose();
      dish.material.map.dispose();
      dish.material.dispose();
      dishMesh = null;
      newRecipe();
    }, 2400);
  });
}

function makeRecipe() {
  /* اختيار متطلبين من عائلتين مختلفتين (بعدد متاح فعلاً بالأرض) */
  const defs = REQ_DEFS.slice().sort(() => Math.random() - .5);
  const reqs = [];
  for (const def of defs) {
    if (reqs.length >= 2) break;
    const counts = Object.keys(RECIPE_SENTENCES[def.key]).map(Number).filter(c => c <= def.max);
    if (!counts.length) continue;
    const count = counts[Math.floor(Math.random() * counts.length)];
    reqs.push({ def, key: def.key, color: def.color, count, text: RECIPE_SENTENCES[def.key][count] });
  }
  return { reqs, dish: DISHES[Math.floor(Math.random() * DISHES.length)] };
}

function newRecipe() {
  clearItems();
  round++;
  reqIndex = 0;
  reqDone = 0;
  recipe = makeRecipe();
  reqNeed = recipe.reqs[0].count;

  /* الفواكه المنثورة: ٨ حبات (تفاحة إضافية حتى يسمح الأحمر بثلاث) */
  const spawnList = [FRUITS[0], FRUITS[1], FRUITS[0], FRUITS[2], FRUITS[3], FRUITS[4], FRUITS[5], FRUITS[6]];
  const spots = ITEM_SPOTS.slice().sort(() => Math.random() - .5);
  spawnList.forEach((f, i) => makeItem(f, spots[i], i));

  const req = recipe.reqs[0];
  if (round === 1) {
    banner.textContent = `${req.text} (${arNum(0)}/${arNum(reqNeed)})`;
    voice(INSTR);
    setTimeout(() => { voice(reqVoice(req.def, req.count)); }, 7000);
  } else {
    banner.textContent = `وصفة جديدة! ${req.text} (${arNum(0)}/${arNum(reqNeed)})`;
    Sfx.ding();
    voice(reqVoice(req.def, req.count));
  }
  phase = 'idle';
}

function kitchenUpdater(dt, t) {
  items.forEach(it => {
    if (!it.inHand) it.plane.position.y = it.baseY + Math.sin(t * 2 + it.phase) * .05;
    billboard(it.plane);
  });
  if (dishMesh) billboard(dishMesh);
}

export function startLevel3() {
  buildIsland();
  buildKitchen();
  stars = 0;
  setStars(0);
  round = 0;
  addUpdater(kitchenUpdater);
  newRecipe();
}

setReplay(() => {
  if (recipe && recipe.reqs[reqIndex]) voice(reqVoice(recipe.reqs[reqIndex].def, recipe.reqs[reqIndex].count));
});

registerGame({
  id: 'kitchen',
  emoji: '🍲',
  title: 'مطبخ الوصفات',
  desc: 'المرحلة ٣ — ساعد البنت تطبخ! أحضر الفواكه الصح باللون والعدد!',
  start: startLevel3,
});

window.__state3 = () => ({
  phase, round, stars,
  req: recipe && recipe.reqs[reqIndex] ? { color: recipe.reqs[reqIndex].color, need: reqNeed, done: reqDone } : null,
  carrying: window.__carrying(),
});
