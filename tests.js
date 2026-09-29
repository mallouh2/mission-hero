/* ============================================================
   مجموعة اختبارات بطل المهمات — تشغَّل يدوياً من المتصفح:
   await import('/tests.js'); await window.__runTests()
   أو على مراحل: await window.__runTests(['L1']) إلخ.
   تلعب بنقرات حقيقية (PointerEvents على الكانفس بنقاط الشاشة)
   حتى تختبر مسار الإصبع الفعلي — مش منطق اللعبة فقط.
   ============================================================ */

window.__runTests = async function runTests(phases) {
  phases = phases || ['boot', 'L1', 'L2', 'L3', 'admin', 'nav'];
  const R = { steps: [], ok: true };
  const step = (name, pass, info) => {
    R.steps.push({ name, pass: !!pass, info: info === undefined ? null : info });
    if (!pass) R.ok = false;
  };
  const canvas = document.querySelector('#scene3d canvas');
  const pump = s => window.__pump(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* نقرة حقيقية على عنصر (pointerdown عالكانفس + pointerup عالنافذة) */
  const tapAt = async (kind, key) => {
    const pos = window.__screenPosOf(kind, key);
    if (!pos) return { ok: false, why: 'no screen pos' };
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: pos.x, clientY: pos.y, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: pos.x, clientY: pos.y, bubbles: true }));
    return { ok: true, pos };
  };
  const startLevel = async i => {
    document.getElementById('btn-home').click();
    await wait(250);
    document.querySelectorAll('.game-card')[i].click();
    await wait(250);
    pump(1);
  };

  try {
    if (phases.includes('boot')) {
      step('boot: قائمة من ٣ ألعاب', document.querySelectorAll('.game-card').length === 3);
      step('boot: لا أخطاء تحميل', !window.__loadErrors, window.__loadErrors);
    }

    /* ---------- المرحلة ١ ---------- */
    if (phases.includes('L1')) {
      await startLevel(0);
      for (let m = 0; m < 6; m++) {
        pump(1);
        const st = window.__state();
        const ch = st.mission;
        const correctKey = st.shape + '_' + st.color;

        /* رفض حرف غلط بنقرة حقيقية */
        const others = window.__pickables().filter(p => p.kind === 'letter' && p.key !== ch);
        if (others.length) {
          await tapAt('letter', others[0].key);
          pump(1);
          const after = window.__state();
          step(`L1 م${m + 1}: الحرف الغلط مرفوض`, after.stars === st.stars && after.phase === 'idle' && !window.__carrying());
        }

        /* التقاط الحرف الصحيح بنقرة حقيقية */
        const pick = await tapAt('letter', ch);
        pump(8);
        step(`L1 م${m + 1}: التقط الحرف الصحيح`, window.__carrying() === ch, pick.why || null);

        if (m === 0) {
          /* ضرب شكل غلط وهو حامل — لازم يرفض ويضل حامل */
          const wrongTarget = window.__pickables().find(p => p.kind === 'target' && p.key !== correctKey);
          if (wrongTarget) {
            await tapAt('target', wrongTarget.key);
            pump(2);
            step('L1 م1: الشكل الغلط مرفوض والحرف باليد', window.__carrying() === ch && window.__state().stars === st.stars);
          }
        }

        /* الوضع بالشكل الصحيح */
        const place = await tapAt('target', correctKey);
        pump(9);
        step(`L1 م${m + 1}: وضعه بالشكل الصحيح (+نجمة)`, window.__state().stars === st.stars + 1, place.why || null);

        if (m === 1) {
          /* لا تراكم: مهمة جديدة = ٣ أشكال و٣ حروف فقط */
          await wait(2000); pump(1);
          const counts = { t: 0, l: 0 };
          window.__pickables().forEach(p => { if (p.kind === 'target') counts.t++; if (p.kind === 'letter') counts.l++; });
          step('L1: لا تراكم أشكال قديمة بعد المهمة', counts.t === 3 && counts.l === 3, counts);
        }

        /* انتظار انطلاق المهمة الجاية (setTimeout حقيقي) */
        await wait(2000);
        pump(1);
      }
      step('L1: شاشة الفوز ظهرت', document.getElementById('finale').classList.contains('show'));
      document.getElementById('btn-again').click();
      await wait(300); pump(1);
      step('L1: إعادة اللعب صفّرت المهمات', window.__state().idx === 0 && window.__state().stars === 0);
      const freshCounts = { t: 0, l: 0 };
      window.__pickables().forEach(p => { if (p.kind === 'target') freshCounts.t++; if (p.kind === 'letter') freshCounts.l++; });
      step('L1: إعادة اللعب نظيفة (٦ عناصر)', freshCounts.t === 3 && freshCounts.l === 3, freshCounts);
    }

    /* ---------- المرحلة ٢ ---------- */
    if (phases.includes('L2')) {
      await startLevel(1);
      for (let round = 1; round <= 2; round++) {
        for (let f = 0; f < 3; f++) {
          pump(1);
          const letters = window.__pickables().filter(p => p.kind === 'letter').map(p => p.key);
          const ch = letters[f];
          step(`L2 ج${round} ح${f + 1}: في حرف بالجولة`, !!ch, letters);

          /* حرف غلط للحيوان الغلط — لازم يرفض */
          await tapAt('letter', ch);
          pump(8);
          step(`L2 ج${round} ح${f + 1}: التقط الحرف`, window.__carrying() === ch);

          const wrongAnimal = window.__pickables().find(p => p.kind === 'animal' && p.key !== ch);
          if (wrongAnimal) {
            await tapAt('animal', wrongAnimal.key);
            pump(2);
            step(`L2 ج${round} ح${f + 1}: الحيوان الغلط مرفوض`, window.__carrying() === ch);
          }

          await tapAt('animal', ch);
          pump(9);
          step(`L2 ج${round} ح${f + 1}: أطعم الحيوان الصحيح`, window.__state2().fed === f + 1);
        }
        /* بعد الثلاثة: جولة جديدة (setTimeout حقيقي ٢.٣ ث) */
        await wait(2600);
        pump(1);
      }
      step('L2: وصل للجولة الثالثة بحيوانات جديدة', window.__state2().round === 3 && window.__state2().fed === 0);
    }

    /* ---------- المرحلة ٣ ---------- */
    if (phases.includes('L3')) {
      await startLevel(2);
      const startRound = window.__state3().round;
      const startStars = window.__state3().stars;
      let guard = 0, cooked = false;
      while (guard++ < 30) {
        pump(1);
        const st = window.__state3();
        if (!st.req) { pump(4); await wait(2700); pump(1); cooked = true; break; }
        /* فاكهة غلط أولاً */
        const items = window.__pickables().filter(p => p.kind === 'item');
        const wrongItem = items.find(p => !p.key.startsWith(st.req.color));
        if (wrongItem && st.req.done === 0) {
          await tapAt('item', wrongItem.key);
          pump(1);
          step('L3: الفاكهة باللون الغلط مرفوضة', window.__state3().req && window.__state3().req.done === 0);
        }
        const rightItem = window.__pickables().find(p => p.kind === 'item' && p.key.startsWith(st.req.color));
        if (!rightItem) { step('L3: في فاكهة باللون المطلوب', false, st.req); break; }
        await tapAt('item', rightItem.key);
        pump(10);
      }
      step('L3: طبخ وصفة كاملة (+نجمة)', cooked && window.__state3().stars === startStars + 1, { round: window.__state3().round, startRound });
      step('L3: انتقل لوصفة جديدة', window.__state3().round === startRound + 1 && window.__state3().phase === 'idle');
    }

    /* ---------- لوحة التحكم ---------- */
    if (phases.includes('admin')) {
      document.getElementById('btn-home').click();
      await wait(250);
      document.getElementById('btn-admin').click();
      await wait(150);
      document.getElementById('admin-pass').value = 'غلط';
      document.getElementById('admin-enter').click();
      step('admin: كلمة السر الغلط مرفوضة', document.getElementById('admin-err').textContent.length > 0);
      document.getElementById('admin-pass').value = 'Ws@650860';
      document.getElementById('admin-enter').click();
      await wait(600);
      step('admin: القائمة ظهرت (٥٥ جملة)', document.querySelectorAll('.slot-row').length === 55);
      step('admin: زر التصدير موجود', !!document.getElementById('admin-export'));
      document.getElementById('admin-close').click();
      step('admin: الإغلاق يخفي اللوحة', document.getElementById('admin').style.display === 'none');
    }

    /* ---------- التنقل ---------- */
    if (phases.includes('nav')) {
      await startLevel(0);
      const nav1 = window.__pickables().length;
      await startLevel(2);
      const nav2 = window.__pickables().length;
      await startLevel(1);
      const nav3 = window.__pickables().length;
      step('nav: تنقل سليم بين الألعاب (٦/٨/٦ عناصر)', nav1 === 6 && nav2 === 8 && nav3 === 6, { nav1, nav2, nav3 });
      step('nav: لا أخطاء تحميل بالنهاية', !window.__loadErrors, window.__loadErrors);
      document.getElementById('btn-home').click();
      await wait(200);
    }
  } catch (e) {
    step('استثناء غير متوقع', false, String(e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e));
  }
  return R;
};
