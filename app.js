/* Word Factory. All state lives in this browser. Nothing is ever sent anywhere. */
(function () {
  'use strict';
  const KEY = 'wordfactory.v1';
  const PASS = 8;            // out of 10 to clear a level
  const PER_LEVEL = 10;

  const $ = (id) => document.getElementById(id);
  const screens = ['screenStart', 'screenMenu', 'screenPlay', 'screenDone', 'screenReport'];
  const show = (id) => screens.forEach(s => $(s).classList.toggle('hide', s !== id));

  let me = { name: '', grade: 0 };
  let save = {};
  let run = null;

  /* ---------------------------------------------------------- storage */
  function load() {
    canSave = probeStorage();
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); me = d.me || me; save = d.save || {}; } }
    catch (e) { save = {}; }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ me, save })); } catch (e) { canSave = false; }
  }

  /* Some browsers hand back a localStorage that throws on write, or accepts the
     write and drops it: Safari's older private mode, "block all cookies", a
     locked-down school device. Write a probe and read it back rather than
     trusting that the object exists. A private window is different again: this
     probe passes, because storage works fine until the window closes. That case
     is covered by wording, not detection, since every reliable way to sniff
     private mode breaks on the next browser release. */
  let canSave = true;
  function probeStorage() {
    try {
      const k = KEY + '.probe';
      localStorage.setItem(k, '1');
      const ok = localStorage.getItem(k) === '1';
      localStorage.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }

  function storageNotice() {
    const el = $('storageNote');
    if (!canSave) {
      el.innerHTML = '<b>This browser is not saving anything.</b>' +
        'Everything still works, and the report card still downloads. But stars and ' +
        'levels will start over when you close this tab.';
      el.classList.remove('hide');
      // Nothing is stored, so there is nothing for a parent to erase.
      $('resetBtn').closest('.parentline').classList.add('hide');
    } else {
      el.classList.add('hide');
    }
  }
  const gradeSave = () => (save[me.grade] = save[me.grade] || { levels: {}, asked: 0, right: 0 });
  const starsFor = (score) => score >= 10 ? 3 : score >= 9 ? 2 : score >= PASS ? 1 : 0;

  /* ------------------------------------------------------------ sound */
  let actx = null;
  function beep(freq, ms, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + ms / 1000);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + ms / 1000);
    } catch (e) {}
  }
  const goodSound = () => { beep(660, 110); setTimeout(() => beep(880, 140), 90); };
  const badSound = () => beep(220, 180, 'triangle');

  /* --------------------------------------------------------- confetti */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const cols = ['#2563EB', '#12885A', '#F59E0B', '#C6274B', '#7C3AED'];
    const bits = Array.from({ length: 90 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * 120,
      r: 4 + Math.random() * 5, vy: 2 + Math.random() * 3.4, vx: -1.5 + Math.random() * 3,
      col: cols[Math.floor(Math.random() * cols.length)], rot: Math.random() * 6
    }));
    let frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach(b => {
        b.y += b.vy; b.x += b.vx; b.rot += 0.1;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.col; ctx.fillRect(-b.r, -b.r, b.r * 2, b.r * 1.4); ctx.restore();
      });
      if (++frames < 150) requestAnimationFrame(tick); else c.remove();
    })();
  }

  /* ------------------------------------------------------- start screen */
  function buildGradePicker() {
    const labels = { 1: 'Grade 1', 2: 'Grade 2', 3: 'Grade 3', 4: 'Grade 4', 5: 'Grade 5' };
    $('gradePicker').innerHTML = [1, 2, 3, 4, 5].map(g =>
      `<button class="grade" data-g="${g}" aria-pressed="false"><b>${g}</b><small>${labels[g]}</small></button>`).join('');
    $('gradePicker').querySelectorAll('.grade').forEach(b => b.addEventListener('click', () => {
      me.grade = Number(b.dataset.g);
      $('gradePicker').querySelectorAll('.grade').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      checkStart();
    }));
  }
  // "Grade 4" spelled out does not fit beside the wordmark on a small phone,
  // so it shortens rather than truncating the child's name.
  function labelWho() {
    if (!me.grade) return;
    const tight = window.matchMedia('(max-width: 480px)').matches;
    $('switchBtn').textContent = tight ? `${me.name} · G${me.grade}` : `${me.name} · Grade ${me.grade}`;
  }
  window.addEventListener('resize', labelWho);

  function checkStart() {
    $('startBtn').disabled = !($('nameInput').value.trim().length >= 1 && me.grade);
  }

  /* -------------------------------------------------------- level menu */
  function openMenu() {
    show('screenMenu');
    // The button both shows who is playing and is how you change it.
    labelWho();
    $('switchBtn').classList.remove('hide');
    const nLev = LEVELS[me.grade].length;
    $('menuTitle').textContent = `Grade ${me.grade}: climb all ${nLev} levels`;
    const gs = gradeSave();
    const done = Object.values(gs.levels).filter(l => l.stars > 0).length;
    $('menuSub').textContent = done === 10
      ? 'Every level cleared. You can replay any level to earn more stars.'
      : `Clear a level to unlock the next one. ${done} of ${nLev} done so far.`;

    const levels = LEVELS[me.grade];
    $('topicList').innerHTML = levels.map((L) => {
      const st = gs.levels[L.n] || { stars: 0, best: 0 };
      const prev = L.n === 1 ? { stars: 1 } : (gs.levels[L.n - 1] || { stars: 0 });
      const locked = prev.stars === 0;
      const stars = '★★★'.slice(0, st.stars) + '☆☆☆'.slice(0, 3 - st.stars);
      const bench = topicsFor(me.grade, L).map(t => t.b).join(', ');
      return `<button class="topic${locked ? ' topic--lock' : ''}" data-lv="${L.n}" ${locked ? 'disabled' : ''}>
          <span class="pill ${L.boss ? 'pill--amber' : ''}" style="min-width:38px;justify-content:center">${locked ? '🔒' : L.n}</span>
          <span>
            <span class="topic__t">${L.name}</span><br>
            <span class="topic__b">${locked ? 'Clear level ' + (L.n - 1) + ' to unlock' : bench}</span>
          </span>
          <span class="topic__stars" style="color:${st.stars ? '#F59E0B' : '#C7D0E4'}">${stars}</span>
        </button>`;
    }).join('');
    $('topicList').querySelectorAll('.topic').forEach(b => b.addEventListener('click', () => startLevel(Number(b.dataset.lv))));
  }

  /* -------------------------------------------------------------- play */
  const shuffleArr = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
  // Level 0 is the mixed challenge: not a rung on the ladder, so it is always
  // unlocked and never awards a level's stars.
  const MIXED = () => ({ n: 0, name: 'Mixed challenge', topics: '*', mixed: true });

  function startLevel(n) {
    const L = n === 0 ? MIXED() : LEVELS[me.grade].find(l => l.n === n);
    const base = topicsFor(me.grade, L);
    // Shuffle, otherwise a level with more topics than questions always draws
    // the same first ten in the same order.
    let bag = shuffleArr(base);
    const qs = [];
    const seen = new Set();
    let guard = 0;
    while (qs.length < PER_LEVEL && guard++ < 400) {
      if (!bag.length) bag = shuffleArr(base);
      const t = bag.pop();
      const q = t.gen();
      const sig = q.q + '|' + (q.sub || '') + '|' + q.a;
      if (seen.has(sig)) continue;         // no repeats inside one round
      seen.add(sig);
      q._topic = t;
      qs.push(q);
    }
    run = { level: L, qs, i: 0, right: 0, hearts: 3, wrongTopics: {} };
    show('screenPlay');
    renderQ();
  }

  function renderQ() {
    const q = run.qs[run.i];
    $('playTopic').textContent = `Level ${run.level.n} · ${run.level.name}`;
    $('hearts').textContent = '❤️'.repeat(run.hearts) + '🤍'.repeat(3 - run.hearts);
    $('counter').textContent = `${run.i + 1} / ${run.qs.length}`;
    $('progressBar').style.width = (run.i / run.qs.length * 100) + '%';
    $('question').innerHTML = q.q;
    $('questionSub').innerHTML = q.sub || '';
    $('questionSub').classList.toggle('hide', !q.sub);
    $('visual').innerHTML = q.visual || '';
    $('visual').classList.toggle('hide', !q.visual);
    $('feedback').className = 'feedback';
    $('nextBtn').classList.add('hide');
    $('choices').innerHTML = q.choices.map(c => `<button class="choice">${c}</button>`).join('');
    $('choices').querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => answer(b, q)));

    // help card: the method the benchmark expects, with different numbers
    const how = HOW[q._topic.id];
    $('helpBtn').classList.toggle('hide', !how);
    $('help').classList.add('hide');
    $('helpBtn').setAttribute('aria-expanded', 'false');
    if (how) {
      $('help').innerHTML = `<h3>${q._topic.t}</h3><span class="bench">${q._topic.b}</span>
        <ol>${how.steps.map(st => `<li>${st}</li>`).join('')}</ol>
        <p class="eg"><b>For example</b>${how.eg}</p>`;
    }
  }

  function answer(btn, q) {
    const chosen = btn.textContent;
    const ok = chosen === String(q.a);
    $('choices').querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      if (b.textContent === String(q.a)) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    const fb = $('feedback');
    if (ok) {
      run.right++;
      goodSound();
      fb.className = 'feedback show ok';
      fb.innerHTML = `<b>Yes! ${chosen} is right.</b>${q.why || ''}${q.whyVisual ? '<div style="margin-top:10px">' + q.whyVisual + '</div>' : ''}`;
    } else {
      run.hearts--;
      $('hearts').textContent = '❤️'.repeat(run.hearts) + '🤍'.repeat(3 - run.hearts);  // show the loss now, not next question
      badSound();
      run.wrongTopics[q._topic.id] = (run.wrongTopics[q._topic.id] || 0) + 1;
      fb.className = 'feedback show no';
      fb.innerHTML = `<b>Not quite. The answer is ${q.a}.</b>${q.why || ''}${q.whyVisual ? '<div style="margin-top:10px">' + q.whyVisual + '</div>' : ''}`;
    }
    const gs = gradeSave();
    gs.asked++; if (ok) gs.right++;
    persist();
    $('nextBtn').classList.remove('hide');
    $('nextBtn').textContent = run.i === run.qs.length - 1 ? 'See my score' : 'Next';
    $('nextBtn').focus();
  }

  function next() {
    if (run.hearts <= 0 || run.i === run.qs.length - 1) return finish();
    run.i++;
    renderQ();
  }

  function finish() {
    const score = run.right, stars = starsFor(score), passed = score >= PASS;
    const gs = gradeSave();
    if (!run.level.mixed) {
      const prev = gs.levels[run.level.n] || { stars: 0, best: 0 };
      gs.levels[run.level.n] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, score) };
    }
    persist();

    show('screenDone');
    $('doneScore').textContent = `${score}/${run.qs.length}`;
    if (passed) {
      confetti();
      const last = run.level.n === LEVELS[me.grade].length;
      if (run.level.mixed) {
        $('doneTitle').textContent = 'Mixed challenge cleared!';
        $('doneMsg').textContent = `${score} out of ${run.qs.length}, drawn from every skill in grade ${me.grade}.`;
      } else {
        $('doneTitle').textContent = last ? `Grade ${me.grade} complete!` : `Level ${run.level.n} cleared!`;
        $('doneMsg').textContent = last
          ? `You climbed all ${LEVELS[me.grade].length} levels. Every skill for this grade has been practised.`
          : (stars === 3 ? 'Perfect round. Level ' + (run.level.n + 1) + ' is unlocked.' : 'Level ' + (run.level.n + 1) + ' is unlocked. Replay for three stars.');
      }
    } else {
      $('doneTitle').textContent = run.hearts <= 0 ? 'Out of hearts' : 'Almost there';
      const worst = Object.keys(run.wrongTopics).sort((a, b) => run.wrongTopics[b] - run.wrongTopics[a])[0];
      const t = GRADES[me.grade].find(x => x.id === worst);
      $('doneMsg').textContent = `You need ${PASS} out of ${PER_LEVEL} to clear it.` + (t ? ` Keep working on ${t.t.toLowerCase()}.` : '');
    }
  }

  /* No scratch paper here: science questions are reasoned, not computed. */

  /* ------------------------------------------------------- report card */
  function reportData() {
    const gs = gradeSave();
    const levels = LEVELS[me.grade].map(L => {
      const st = gs.levels[L.n] || { stars: 0, best: 0 };
      return { n: L.n, name: L.name, stars: st.stars, best: st.best, bench: topicsFor(me.grade, L).map(t => t.b) };
    });
    const cleared = levels.filter(l => l.stars > 0).length;
    const totalStars = levels.reduce((s, l) => s + l.stars, 0);
    const acc = gs.asked ? Math.round(gs.right / gs.asked * 100) : 0;
    return { levels, cleared, totalStars, acc, asked: gs.asked, nLev: levels.length };
  }

  function openReport() {
    show('screenReport');
    const d = reportData();
    const badge = d.cleared === 10 ? '🏆 Grade ' + me.grade + ' Champion' : d.cleared >= 7 ? '🌟 Rising Star' : d.cleared >= 4 ? '🚀 Climbing' : '🌱 Getting Started';
    $('reportBody').innerHTML = `
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
        <h2 style="margin:0">${escapeHtml(me.name)}</h2>
        <span class="pill">Grade ${me.grade}</span>
        <span class="pill pill--green">${badge}</span>
      </div>
      <p class="muted small" style="margin:6px 0 12px">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ·
        ${d.cleared} of ${d.nLev} levels cleared · ${d.totalStars} of ${d.nLev * 3} stars · ${d.acc}% correct over ${d.asked} questions</p>
      ${d.levels.map(l => `<div class="rrow">
          <span class="rt">${l.n}. ${l.name}<br><span class="topic__b">${l.bench.join(', ')}</span></span>
          <span class="rs" style="color:${l.stars ? '#F59E0B' : '#C7D0E4'}">${'★'.repeat(l.stars)}${'☆'.repeat(3 - l.stars)}</span>
        </div>`).join('')}
      <p class="small muted" style="margin-top:12px">Aligned to Florida's B.E.S.T. ELA benchmarks. Practice tool only, not an official assessment.</p>`;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function downloadReport() {
    const d = reportData();
    const W = 900, H = 1180, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#2563EB'; x.fillRect(0, 0, W, 132);
    x.fillStyle = '#fff';
    x.font = '800 40px system-ui, sans-serif'; x.fillText('Word Factory Report Card', 44, 62);
    x.font = '600 20px system-ui, sans-serif';
    x.fillText('Grade ' + me.grade + ' · Florida B.E.S.T. ELA benchmarks', 44, 96);

    x.fillStyle = '#17203A';
    x.font = '800 34px system-ui, sans-serif'; x.fillText(me.name, 44, 196);
    x.fillStyle = '#5A6683'; x.font = '500 18px system-ui, sans-serif';
    x.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 44, 226);

    const stats = [[d.cleared + ' / ' + d.nLev, 'levels cleared'], [d.totalStars + ' / ' + (d.nLev * 3), 'stars earned'], [d.acc + '%', 'correct'], [String(d.asked), 'questions']];
    stats.forEach(([big, small], i) => {
      const bx = 44 + i * 205;
      x.fillStyle = '#F7F9FF'; x.fillRect(bx, 252, 190, 92);
      x.strokeStyle = '#DDE4F5'; x.lineWidth = 2; x.strokeRect(bx, 252, 190, 92);
      x.fillStyle = '#2563EB'; x.font = '800 30px system-ui, sans-serif'; x.fillText(big, bx + 16, 296);
      x.fillStyle = '#5A6683'; x.font = '600 15px system-ui, sans-serif'; x.fillText(small, bx + 16, 324);
    });

    let y = 400;
    x.fillStyle = '#17203A'; x.font = '800 22px system-ui, sans-serif'; x.fillText('The climb', 44, y); y += 22;
    d.levels.forEach(l => {
      y += 34;
      x.fillStyle = l.stars ? '#17203A' : '#98A2BC';
      x.font = '700 18px system-ui, sans-serif';
      x.fillText(l.n + '. ' + l.name, 44, y);
      x.fillStyle = '#5A6683'; x.font = '500 13px system-ui, sans-serif';
      x.fillText(l.bench.join(', ').slice(0, 74), 44, y + 17);
      x.fillStyle = l.stars ? '#F59E0B' : '#D5DCEC';
      x.font = '700 20px system-ui, sans-serif';
      x.fillText('★'.repeat(l.stars) + '☆'.repeat(3 - l.stars), W - 130, y);
      y += 18;
    });

    const badge = d.cleared === 10 ? 'Grade ' + me.grade + ' Champion' : d.cleared >= 7 ? 'Rising Star' : d.cleared >= 4 ? 'Climbing' : 'Getting Started';
    y += 40;
    x.fillStyle = '#DFF6EC'; x.fillRect(44, y - 26, W - 88, 56);
    x.fillStyle = '#0B6B46'; x.font = '800 22px system-ui, sans-serif';
    x.fillText('Badge earned: ' + badge, 64, y + 8);

    x.fillStyle = '#98A2BC'; x.font = '500 14px system-ui, sans-serif';
    x.fillText('math.mehdee.com · a free practice game by The Mehdees', 44, H - 54);
    x.fillText('Practice tool aligned to Florida B.E.S.T. ELA benchmarks. Not an official assessment.', 44, H - 30);

    const a = document.createElement('a');
    a.download = `math-arena-${me.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-grade-${me.grade}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  /* ------------------------------------------------------------- wiring */
  load();
  storageNotice();
  buildGradePicker();
  $('nameInput').addEventListener('input', checkStart);
  $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('startBtn').disabled) $('startBtn').click(); });
  $('startBtn').addEventListener('click', () => { me.name = $('nameInput').value.trim().slice(0, 24); persist(); openMenu(); });
  $('switchBtn').addEventListener('click', () => {
    show('screenStart');
    $('switchBtn').textContent = 'Change';
    $('switchBtn').classList.add('hide');
    $('nameInput').value = me.name;
    $('gradePicker').querySelectorAll('.grade').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.g) === me.grade)));
    checkStart();
  });
  // Parents can wipe the device. Deliberately two-step: a checkbox, then the button.
  $('resetBtn').addEventListener('click', () => {
    $('resetOk').checked = false;
    $('resetGo').disabled = true;
    $('reset').classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  $('resetOk').addEventListener('change', (e) => { $('resetGo').disabled = !e.target.checked; });
  $('resetCancel').addEventListener('click', () => { $('reset').classList.remove('open'); document.body.style.overflow = ''; });
  $('resetGo').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    me = { name: '', grade: 0 };
    save = {};
    $('reset').classList.remove('open');
    document.body.style.overflow = '';
    $('nameInput').value = '';
    $('gradePicker').querySelectorAll('.grade').forEach(x => x.setAttribute('aria-pressed', 'false'));
    $('switchBtn').textContent = 'Change';
    $('switchBtn').classList.add('hide');
    checkStart();
    show('screenStart');
  });

  $('helpBtn').addEventListener('click', () => {
    const open = $('help').classList.toggle('hide') === false;
    $('helpBtn').setAttribute('aria-expanded', String(open));
  });
  $('mixedBtn').addEventListener('click', () => startLevel(0));
  $('nextBtn').addEventListener('click', next);
  $('quitBtn').addEventListener('click', openMenu);
  $('againBtn').addEventListener('click', () => startLevel(run.level.n));
  $('backBtn').addEventListener('click', openMenu);
  // Tapping the game's name goes back to the skills list, or to the start
  // screen if no grade has been picked yet.
  $('homeBtn').addEventListener('click', () => {
    if (me.grade) openMenu(); else show('screenStart');
  });

  $('reportBtn').addEventListener('click', openReport);
  $('reportBackBtn').addEventListener('click', openMenu);
  $('downloadBtn').addEventListener('click', downloadReport);

  if (me.name && me.grade) {
    $('nameInput').value = me.name;
    $('gradePicker').querySelectorAll('.grade').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.g) === me.grade)));
    checkStart();
    openMenu();
  }
})();
