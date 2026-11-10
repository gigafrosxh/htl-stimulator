// ---------------- minigames ----------------
const MG = { open: false, forced: false, test: false, cleanup: null, opts: null };
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
function startMG(o) {
  if (MG.open) closeMG(true);
  MG.open = true; MG.forced = !!o.forced; MG.test = !!o.test; MG.opts = o;
  const el = $('#mg'); el.classList.remove('hidden'); el.classList.toggle('board', !!o.board);
  $('#mgTitle').textContent = o.title; $('#mgSub').textContent = o.sub || '';
  $('#mgCancel').classList.toggle('hidden', MG.forced);
  $('#mgStress').textContent = o.stress >= 1 ? '💓 ' + TR('Stress: maximal') : o.stress >= .5 ? '💓 ' + TR('Stress: hoch') : o.stress > 0 ? TR('Stress: mittel') : '';
  const old = $('#mgPhone'); if (old) old.remove();
  if (o.phone && o.li !== undefined) { const b = document.createElement('button'); b.id = 'mgPhone'; b.className = 'sec'; b.type = 'button'; b.textContent = '📱 ' + TR('Übers Handy von {n}', { n: o.phone[1] }); b.onclick = () => { const li = o.li, q = o.phone[0]; closeMG(true); ME.copy = { li, q: q * .8, t: 6, total: 6, phone: true }; toast(TR('Du kopierst übers Handy von {n}. Ziemlich auffällig.', { n: o.phone[1] }), 'info'); }; $('#mgFoot').insertBefore(b, $('#mgCancel')); }
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
  const body = $('#mgBody'); body.innerHTML = '';
  const diff = clamp(o.diff || 0, 0, 3); const timeMul = (ME.energyT > 0 ? 1.35 : 1) * (1 - Math.min(.45, diff * .14));
  const finish = (q, fake = false) => { if (!MG.open || MG.opts !== o) return; closeMG(true); o.done && o.done(clamp(q, 0, 1), fake); };
  $('#mgFake').onclick = () => { Snd.paper(); finish(o.test ? rnd(0, .3) : rnd(.05, .4), true); };
  $('#mgCancel').onclick = () => closeMG();
  MG.cleanup = GAMES[o.kind](body, { diff, timeMul, finish });
}
function closeMG(silent) { if (!MG.open) return; MG.open = false; try { MG.cleanup && MG.cleanup(); } catch (e) { } MG.cleanup = null; $('#mg').classList.add('hidden'); $('#mgBody').innerHTML = ''; if (!silent) toast(TR('Hausübung weggepackt.'), 'info'); canvas.focus(); }
function timerBar(el) { const d = document.createElement('div'); d.className = 'mgt'; d.innerHTML = '<i></i>'; el.appendChild(d); return d.firstChild; }
const WORDS = TA(['Der Hamster', 'vom Bürgermeister', 'fährt heimlich', 'mit dem Moped', 'in die Schule,', 'weil', 'die Hausübung', 'nach Wurst', 'riecht', 'und der Lehrer', 'laut schreit.', 'Kartoffelsalat', 'ist kein Argument.', 'Donaudampfschiff', 'Eichhörnchen', 'quietschen', 'im Turnsaal', 'seit 1847']);
// Bei Übersetzungen dürfen Sprachwitze an die jeweilige Sprache angepasst werden. Die erste Antwort ist immer richtig.
const QUIZ = TA([
  ['Was heißt „Hausübung“ auf Englisch?', ['homework', 'house exercise', 'home sweat home', 'the übung']],
  ['„I have a cold“ heißt:', ['Ich bin erkältet', 'Ich habe ein Kaltes', 'Ich bin cool', 'Mir ist ein Eis']],
  ['Was ist die Mehrzahl von „mouse“?', ['mice', 'mouses', 'meese', 'mausis']],
  ['„Become“ heißt:', ['werden', 'bekommen', 'beckommen', 'Bekömmlich']],
  ['Was ist die Hauptstadt von Österreich?', ['Wien', 'Salzburg', 'Schnitzel', 'Wean (ist auch richtig?)']],
  ['Wie viele Beine hat eine Spinne?', ['8', '6', '10', 'genug']],
  ['Was ist 7 · 8?', ['56', '54', '78', 'Mittwoch']],
  ['„Chicken“ heißt:', ['Huhn', 'Küche', 'Kitchen', 'schicken']],
  ['Welches davon ist ein Säugetier?', ['Wal', 'Hai', 'Forelle', 'Fischstäbchen']],
  ['„Ich bin müde“ auf Englisch?', ['I am tired', 'I am mude', 'I am tied', 'I bims']],
  ['H₂O ist:', ['Wasser', 'Wasserstoffperoxid', 'ein Auto', 'Hilfe 2 Ohne']],
  ['„Gift“ heißt auf Deutsch:', ['Geschenk', 'Gift', 'Gefahr', 'Gitarre']],
  ['Wann war die Mondlandung?', ['1969', '1492', '2007', 'gestern']],
  ['„Handy“ heißt auf Englisch:', ['mobile phone', 'handy', 'hand-y', 'Knochen']],
  ['Was ist die Wurzel aus 81?', ['9', '8', '81', 'Karotte']],
  ['Wer hat „Faust“ geschrieben?', ['Goethe', 'Schiller', 'Mozart', 'Chuck Norris']],
]);
const ORDER_SETS = TA([
  ['Dinosaurier', 'Pyramiden', 'Römer', 'Erfindung der Pizza', 'Mondlandung', 'TikTok'],
  ['Urknall', 'Erde entsteht', 'Erste Fische', 'Dinosaurier', 'Menschen', 'Hausübung erfunden'],
  ['Ei', 'Kaulquappe', 'Kaulquappe mit Beinen', 'Frosch', 'Frosch mit Krone'],
  ['Samen', 'Keimling', 'Blume', 'Biene kommt', 'Honig', 'Honigbrot'],
  ['Steinzeit', 'Bronzezeit', 'Eisenzeit', 'Mittelalter', 'Industrialisierung', 'WLAN'],
  ['Raupe', 'Dicke Raupe', 'Kokon', 'Schmetterling', 'Schmetterling mit Sonnenbrille'],
]);
N_(['Stern', 'Haus', 'Fisch', 'Blitz']);
const SHAPES = { Stern: (() => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; })(), Haus: [[-1, 1], [-1, -.1], [0, -1], [1, -.1], [1, 1]], Fisch: [[-1, 0], [-.3, -.6], [.5, -.3], [1, -.7], [1, .7], [.5, .3], [-.3, .6]], Blitz: [[-.2, -1], [.5, -1], [.1, -.15], [.6, -.15], [-.4, 1], [-.05, .1], [-.5, .1]] };
function cheat(kind) {
  ME.cheatT = kind === 'phone' ? 3 : kind === 'look' ? 2 : 1;
  const extra = { phone: 26, look: 16, spick: 7 }[kind]; spikeIfSeen(extra);
  if (kind === 'phone') { setPose('phone', 2); Snd.click(); } else if (kind === 'look') { Snd.huh(); } else Snd.paper();
}
const GAMES = {
  exam(el, o) {
    const N = 8; const pool = [...QUIZ].sort(() => Math.random() - .5); const qs = [];
    for (let k = 0; k < N; k++) { if (k % 3 === 2) { const a = rint(3, 9 + Math.round(o.diff * 3)), b = rint(3, 12); const w = [a * b + rint(1, 4), a * b - rint(1, 5), a + b]; qs.push([`${a} · ${b} = ?`, [String(a * b), ...w.map(String)]]); } else qs.push(pool.pop()); }
    let i = 0, score = 0, tTot = 1, tLeft = 1, revealed = false;
    el.insertAdjacentHTML('beforeend', '<div class="mgq" style="font-size:21px"></div><div class="opts"></div><div class="cheats" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:14px"><b>' + TR('Schummeln:') + '</b></div><div class="mgInfo" style="font-size:14px;min-height:18px"></div>');
    const q = el.querySelector('.mgq'), opts = el.querySelector('.opts'), cbox = el.querySelector('.cheats'), info = el.querySelector('.mgInfo'); const bar = timerBar(el);
    const mkBtn = (label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sec'; b.style.fontSize = '14px'; b.style.padding = '3px 8px'; b.textContent = label; b.onclick = fn; cbox.appendChild(b); return b; };
    const reveal = (sure, src) => { if (revealed) return; revealed = true; const right = [...opts.children].find(b => b.dataset.k === '0'); const wrong = [...opts.children].filter(b => b.dataset.k !== '0'); const shown = sure || Math.random() < .65 ? right : pick(wrong); shown.style.outline = '4px solid var(--green)'; info.textContent = src; };
    mkBtn('👀 ' + TR('Beim Nachbarn schauen'), () => { cheat('look'); reveal(false, TR('Das hat dein Nachbar angekreuzt. Hoffentlich weiß er es.')); });
    mkBtn('📱 ' + TR('Handy unterm Tisch'), () => { cheat('phone'); reveal(true, TR('Laut Internet ist es das Grüne.')); });
    const spickBtn = mkBtn('📜 ' + TR('Spickzettel'), () => { const it = ['spick', 'rechner'].find(k => ME.items.includes(k)); if (!it) { info.textContent = TR('Du hast keinen Spickzettel. In der Bibliothek kannst du dir einen basteln.'); return; } useItem(it); cheat('spick'); reveal(true, TR('{n} benutzt.', { n: ITEMS[it].name })); });
    function next() {
      if (i >= N) return o.finish(score / N); const [txt, ans] = qs[i++]; q.textContent = `${i}/${N}: ${txt}`; revealed = false; info.textContent = '';
      tTot = Math.max(5, (11 - o.diff * 1.5) * o.timeMul); tLeft = tTot; opts.innerHTML = '';
      spickBtn.disabled = !['spick', 'rechner'].some(k => ME.items.includes(k));
      [...ans].map((a, k) => [a, k]).sort(() => Math.random() - .5).forEach(([a, k]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = a; b.onclick = () => { if (k === 0) { score += .7 + .3 * tLeft / tTot; Snd.coin(); } else Snd.buzz(); next(); }; opts.appendChild(b); });
    }
    const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) { Snd.buzz(); next(); } }, 50);
    next(); return () => clearInterval(iv);
  },
  math(el, o) {
    const N = 5; let i = 0, score = 0, ans = 0, tTot = 1, tLeft = 1;
    el.insertAdjacentHTML('beforeend', '<div class="mgq"></div><input type="text" id="mgIn" inputmode="numeric" autocomplete="off" aria-label="' + TR('Antwort') + '"><div class="mgInfo" style="text-align:center;font-size:15px"></div>');
    const q = el.querySelector('.mgq'), inp = el.querySelector('#mgIn'), info = el.querySelector('.mgInfo'); const bar = timerBar(el);
    function next() {
      if (i >= N) return o.finish(score / N); i++;
      const r = Math.random(), big = Math.round(10 + o.diff * 30); let a, b, txt;
      if (r < .33) { a = rint(2, big); b = rint(2, big); ans = a + b; txt = `${a} + ${b}`; }
      else if (r < .58) { a = rint(5, big + 10); b = rint(1, a); ans = a - b; txt = `${a} − ${b}`; }
      else if (r < .85) { a = rint(2, 6 + Math.round(o.diff * 4)); b = rint(2, 9 + Math.round(o.diff * 3)); ans = a * b; txt = `${a} · ${b}`; }
      else { b = rint(2, 9); ans = rint(2, 9 + Math.round(o.diff * 3)); a = b * ans; txt = `${a} : ${b}`; }
      q.textContent = txt + ' = ?'; tTot = Math.max(3.2, (9.5 - o.diff * 1.6) * o.timeMul); tLeft = tTot; inp.value = ''; inp.focus();
      info.textContent = TR('Aufgabe {i} von {n}', { i, n: N }) + (ME.items.includes('rechner') ? '   🧮 ' + TR('sagt: {a}', { a: ans }) : '');
    }
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { if (parseInt(inp.value, 10) === ans) { score += .55 + .45 * tLeft / tTot; Snd.coin(); } else Snd.buzz(); next(); } });
    const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) { Snd.buzz(); next(); } }, 50);
    next(); return () => clearInterval(iv);
  },
  type(el, o) {
    const n = Math.round(4 + o.diff * 1.5); const ws = []; for (let k = 0; k < n; k++) ws.push(pick(WORDS)); const target = ws.join(' ');
    const tTot = (target.length * .3 + 3) * o.timeMul; let tLeft = tTot;
    el.insertAdjacentHTML('beforeend', '<div style="font-size:14px">' + TR('Aufsatz: Schreib das so schnell wie möglich genau ab.') + '</div><div class="typeTarget"></div><input type="text" id="mgIn" autocomplete="off" spellcheck="false" aria-label="' + TR('Aufsatz') + '">');
    const tg = el.querySelector('.typeTarget'), inp = el.querySelector('#mgIn'); const bar = timerBar(el);
    const render = () => { const v = inp.value; tg.innerHTML = [...target].map((c, k) => k < v.length ? `<span class="${v[k] === c ? 'ok' : 'bad'}">${esc(c)}</span>` : esc(c)).join(''); };
    const score = () => { const v = inp.value; let ok = 0; for (let k = 0; k < Math.min(v.length, target.length); k++) if (v[k] === target[k]) ok++; return ok / target.length * (.75 + .25 * Math.max(0, tLeft) / tTot); };
    inp.addEventListener('input', () => { Snd.click(); render(); if (inp.value.length >= target.length) o.finish(score()); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') o.finish(score()); });
    render(); inp.focus();
    const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) o.finish(score()); }, 50);
    return () => clearInterval(iv);
  },
  quiz(el, o) {
    const N = 5; const qs = [...QUIZ].sort(() => Math.random() - .5).slice(0, N); let i = 0, score = 0, tTot = 1, tLeft = 1;
    el.insertAdjacentHTML('beforeend', '<div class="mgq" style="font-size:21px"></div><div class="opts"></div>');
    const q = el.querySelector('.mgq'), opts = el.querySelector('.opts'); const bar = timerBar(el);
    function next() {
      if (i >= N) return o.finish(score / N); const [txt, ans] = qs[i++]; q.textContent = `${i}/${N}: ${txt}`;
      tTot = Math.max(3.5, (8.5 - o.diff * 1.4) * o.timeMul); tLeft = tTot; opts.innerHTML = '';
      [...ans].map((a, k) => [a, k]).sort(() => Math.random() - .5).forEach(([a, k]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = a; b.onclick = () => { if (k === 0) { score += .6 + .4 * tLeft / tTot; Snd.coin(); } else Snd.buzz(); next(); }; opts.appendChild(b); });
    }
    const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) { Snd.buzz(); next(); } }, 50);
    next(); return () => clearInterval(iv);
  },
  timing(el, o) {
    const R = 4; let r = 0, score = 0, pos = 0, dir = 1, zone = [0, 0], spd = 0; const steps = TA(['Natrium vorsichtig dazugeben', 'Bunsenbrenner anzünden', 'Kräftig schütteln', 'Bitte nicht explodieren lassen', 'Messwert ablesen']);
    el.insertAdjacentHTML('beforeend', '<div class="mgq" style="font-size:20px"></div><canvas width="440" height="70"></canvas><div style="text-align:center;font-size:15px">' + TR('Drück die Leertaste oder klick, wenn der Zeiger im grünen Bereich ist.') + '</div>');
    const q = el.querySelector('.mgq'), cv = el.querySelector('canvas'), g = cv.getContext('2d');
    function next() { if (r >= R) return o.finish(score / R); q.textContent = `${r + 1}/${R}: ${steps[r]}`; r++; const w = Math.max(.07, .22 - o.diff * .05); const c = rnd(.15, .85); zone = [c - w / 2, c + w / 2]; spd = (.55 + r * .15 + o.diff * .3) / o.timeMul; }
    function hit() { const c = (zone[0] + zone[1]) / 2, w = zone[1] - zone[0]; const d = Math.abs(pos - c); const s = d < w / 2 ? 1 : Math.max(0, 1 - (d - w / 2) * 6); score += s; if (s < .3) { Snd.boing(); flash('#ffb000', .4); } else Snd.coin(); next(); }
    const onKey = e => { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); hit(); } };
    addEventListener('keydown', onKey, true); cv.addEventListener('pointerdown', hit);
    let last = performance.now(); let raf;
    const loop = now => { const dt = (now - last) / 1000; last = now; pos += dir * spd * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      g.fillStyle = '#fff'; g.fillRect(0, 0, 440, 70); g.fillStyle = '#ffd6d0'; g.fillRect(10, 20, 420, 30); g.fillStyle = '#36b45a'; g.fillRect(10 + zone[0] * 420, 20, (zone[1] - zone[0]) * 420, 30);
      g.fillStyle = '#1f1a33'; g.fillRect(10 + pos * 420 - 3, 8, 6, 54); raf = requestAnimationFrame(loop); };
    next(); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true); };
  },
  order(el, o) {
    const set = pick(ORDER_SETS); const n = Math.min(set.length, Math.round(4 + o.diff)); const st = rint(0, set.length - n); const items = set.slice(st, st + n);
    let nxt = 0, miss = 0; const tTot = n * 2.8 * o.timeMul; let tLeft = tTot;
    el.insertAdjacentHTML('beforeend', '<div style="font-size:16px">' + TR('Bring das in die richtige Reihenfolge (zuerst → zuletzt):') + '</div><div class="opts"></div><div class="mgInfo" style="font-size:15px"></div>');
    const opts = el.querySelector('.opts'), info = el.querySelector('.mgInfo'); const bar = timerBar(el);
    items.map((t, k) => [t, k]).sort(() => Math.random() - .5).forEach(([t, k]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { if (k === nxt) { nxt++; b.disabled = true; b.style.opacity = .35; Snd.click(); info.textContent = items.slice(0, nxt).join(' → '); if (nxt >= n) o.finish(Math.max(0, (n - miss) / n) * (.8 + .2 * tLeft / tTot)); } else { miss++; Snd.buzz(); b.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200); } }; opts.appendChild(b); });
    const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) o.finish(Math.max(0, (nxt - miss) / n) * .8); }, 50);
    return () => clearInterval(iv);
  },
  draw(el, o) {
    const name = pick(Object.keys(SHAPES)); const shp = SHAPES[name]; const W = 440, Hh = 250, S = 95 - o.diff * 8;
    el.insertAdjacentHTML('beforeend', `<div style="font-size:16px">${esc(TR('Kunst: Zeichne das nach: {x}', { x: name }))}</div><canvas width="${W}" height="${Hh}"></canvas><div style="display:flex;justify-content:flex-end"><button type="button" class="sec">${esc(TR('Fertig!'))}</button></div>`);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'); const bar = timerBar(el); const pts = []; const outline = [];
    for (let k = 0; k < shp.length; k++) { const a = shp[k], b = shp[(k + 1) % shp.length]; for (let s = 0; s < 12; s++) { const t = s / 12; outline.push([W / 2 + lerp(a[0], b[0], t) * S, Hh / 2 + lerp(a[1], b[1], t) * S]); } }
    const draw = () => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#b9b9c9'; outline.forEach(([x, y]) => g.fillRect(x - 1.5, y - 1.5, 3, 3)); g.strokeStyle = '#e8412c'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); pts.forEach((p, k) => { if (!p || !pts[k - 1]) { if (p) g.moveTo(p[0], p[1]); } else g.lineTo(p[0], p[1]); }); g.stroke(); };
    let down = false; const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * Hh / r.height]; };
    cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); pts.push(null, P(e)); draw(); });
    cv.addEventListener('pointermove', e => { if (down) { pts.push(P(e)); if (Math.random() < .2) Snd.click(); draw(); } });
    cv.addEventListener('pointerup', () => down = false);
    const score = () => { const real = pts.filter(Boolean); if (real.length < 5) return 0; const near = (a, list, r) => list.some(b => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 < r * r); const cov = outline.filter(p => near(p, real, 16)).length / outline.length; const prec = real.filter(p => near(p, outline, 20)).length / real.length; return cov * .7 + prec * .3; };
    el.querySelector('button').onclick = () => o.finish(score());
    const tTot = 10 * o.timeMul; let tLeft = tTot; const iv = setInterval(() => { tLeft -= .05; bar.style.width = (100 * tLeft / tTot) + '%'; if (tLeft <= 0) o.finish(score()); }, 50);
    draw(); return () => clearInterval(iv);
  },
};

// ---------------- HUD ----------------
let hudT = 0;
function hudTick(now) {
  if (now - hudT < 100) return; hudT = now;
  const L = plan(), el = gEl(now), rem = gRem(now);
  // timetable
  const rows = L.map((l, i) => {
    const ri = lessonRoomIdx(l, i === G.li ? el : 0); const rn = ROOMS[ri]; const moved = ri !== l.room;
    const tch = l.teacher >= 0 && (i < G.li || (i === G.li && G.ph === 'lesson') || l.ev !== 'supplier') ? TEACH[l.teacher] : TEACH[l.ti];
    const need = needHW(i); const q = ME.hw[i];
    let hw = !need ? `<span class="sub">${TR('keine HÜ')}</span>` : l.group && bestOf(i)[0] >= 0 ? `<span class="hwok">👥 ✔ ${Math.round(bestOf(i)[0] * 100)}%</span>` : q >= 0 ? `<span class="hwok">✔ ${Math.round(q * 100)}%${ME.hf[i] ? ' 🤥' : ''}</span>` : `<span class="hwno">✘ ${TR('HÜ fehlt')}</span>`;
    if (ME.checked[i] && ME.nach !== i) hw = `<span class="sub">${TR('kontrolliert')}</span>`; if (ME.nach === i) hw = `<span class="hwno">⏰ ${TR('nachreichen!')}</span>`;
    const flags = (l.group ? ' 👥' : '') + (l.sa ? ` <b style="color:var(--red)">📝${TR('SCHULARBEIT')}</b>` : '') + (ME.knowTests && l.test ? ' 📝' + TR('TEST') : '');
    const cls = (i === G.li && ['lesson', 'break'].includes(G.ph) ? 'cur' : '') + (i < G.li ? ' past' : '');
    return `<div class="lrow ${cls}" data-li="${i}"><span class="n">${i + 1}.</span><span>${SUBJ[l.s].icon} ${esc(TR(l.s))}${flags}<br><span class="sub">${moved ? `<s>${esc(TR(ROOMS[l.room].name))}</s> → ` : ''}${esc(TR(rn.name))} (${rn.f ? TR('OG') : TR('EG')}) · ${esc(tch.name)}</span></span><span class="hw">${hw}</span></div>`;
  }).join('');
  const pr = $('#planRows'); if (pr.dataset.h !== rows) { pr.innerHTML = rows; pr.dataset.h = rows; }
  $('#planTitle').textContent = TR('Stundenplan · Tag {d} ({w})', { d: G.day, w: DAYNAMES[(G.day - 1) % 7] });
  // clock
  const cur = L[G.li];
  let top = '', sub = '';
  if (G.ph === 'break') { top = G.li === 0 ? TR('Vor der 1. Stunde') : TR('Pause bis zur {n}. Stunde', { n: G.li + 1 }); sub = TR('{s} im Raum {r}', { s: cur.s, r: ROOMS[lessonRoomIdx(cur, 0)].name }); }
  else if (G.ph === 'lesson') { top = TR('{n}. Stunde · {s}', { n: G.li + 1, s: cur.s }); const ri = lessonRoomIdx(cur, el); sub = cur.teacher < 0 ? TR('Freistunde!') : `${TR(ROOMS[ri].name)} · ${TEACH[cur.teacher].name} (${PERS[TEACH[cur.teacher].pers].label})`; }
  else if (G.ph === 'dayEnd') top = TR('Zeugnisse'); else if (G.ph === 'detention') top = TR('Nachsitzen'); else top = TR('Warten');
  $('#clockTop').textContent = top; $('#clockBig').textContent = fmtT(rem); $('#clockSub').textContent = sub;
  // score
  $('#teamPts').textContent = G.tp || 0; $('#goalPts').textContent = G.goal || 0; $('#myPts').textContent = ME.pts;
  const gb = $('#goalBar'); gb.style.width = clamp(100 * (G.tp || 0) / Math.max(1, G.goal), 0, 100) + '%'; gb.style.background = (G.tp >= G.goal) ? 'var(--green)' : 'var(--yellow)';
  // suspicion
  const s = clamp(ME.sus, 0, 100); const sb = $('#susBar'); sb.style.width = s + '%'; sb.style.background = s > 70 ? 'var(--red)' : s > 40 ? 'var(--yellow)' : 'var(--green)';
  const [seen] = bestWatcher(); $('#eye').textContent = seen > 0 && activity() > 0 ? '👁 ' + TR('BEOBACHTET') : seen > 0 ? '👁 ' + TR('Lehrer schaut') : '😎 ' + TR('Verdacht');
  $('#vign').style.boxShadow = s > 50 ? `inset 0 0 ${Math.round(s * 1.6)}px rgba(232,65,44,${(s - 40) / 100})` : 'none';
  // items
  const inv = [0, 1, 2].map(i => { const it = ME.items[i]; return `<div class="slot" title="${it ? esc(ITEMS[it].desc) : ''}"><b>${i + 1}</b>${it ? ITEMS[it].icon + `<small>${esc(ITEMS[it].name)}</small>` : ''}</div>`; }).join('');
  const iv = $('#inv'); if (iv.dataset.h !== inv) { iv.innerHTML = inv; iv.dataset.h = inv; }
  // prompt
  let p = '';
  if (ME.copy) p = (ME.copy.phone ? '📱 ' + TR('Kopierst übers Handy') : '✍️ ' + TR('Schreibst ab')) + ` ${ME.copy.t.toFixed(1)} s · ` + TR('nicht bewegen!');
  else if (meCh.rg) p = TR('Du fliegst grad durch die Gegend.');
  else if (ME.seat) p = TR('E: Aufstehen · H: heimlich Hausübung machen · Q: dumme Frage');
  else {
    let best = null, bd = 9; INTER.forEach(it => { const d = Math.hypot(it.x - ME.x, it.z - ME.z); if (d < it.r && Math.abs(it.y - ME.y) < 1.5 && d < bd) { bd = d; best = it; } });
    if (best) p = 'E: ' + best.label; else if (nearestSeat()) p = TR('E: Hinsetzen');
    else if (G.ph === 'lesson' && !inLessonRoom() && cur && cur.teacher >= 0) p = TR('Du solltest jetzt im Raum {r} sein!', { r: ROOMS[lessonRoomIdx(cur, el)].name });
  }
  $('#prompt').textContent = p;
  const wp = $('#wp'); if (WP && !MG.open) { const fa = Math.atan2(-Math.sin(yaw), -Math.cos(yaw)); const rel = angDiff(fa, Math.atan2(WP.x - ME.x, WP.z - ME.z)); wp.hidden = false; $('#wpArrow').style.transform = `rotate(${-rel}rad)`; $('#wpText').textContent = `${WP.label} · ${Math.round(WP.d)} m`; } else wp.hidden = true;
  $('#lockHint').hidden = !(document.pointerLockElement !== canvas && !MG.open && !paused && G.ph !== 'detention'); if (paused && !canPause()) closePause(false);
  $('#netState').textContent = Net.solo ? TR('Solo · offline') : `${Net.connected ? TR('Online') : TR('Verbinde')} · ` + TR('{n} Spieler', { n: G.np }) + ' · ' + TR('Klasse {c}', { c: CODE }) + (isHost() ? ' · Host' : '');
}
$('#planRows').addEventListener('click', e => { const r = e.target.closest('.lrow'); if (r && !MG.open) openHW(+r.dataset.li); });

// ---------------- big cards & phase handling ----------------
let bigT = 0;
function showBig(html, dur = 4) { $('#bigCard').innerHTML = html; $('#big').classList.remove('hidden'); bigT = dur; }
let prevPh = 'lobby', prevLi = -1, prevDayKey = '';
function phaseCheck(dt) {
  if (bigT > 0) { bigT -= dt; if (bigT <= 0) $('#big').classList.add('hidden'); }
  const dk = G.run + ':' + G.day;
  if (['break', 'lesson'].includes(G.ph) && dk !== prevDayKey) {
    prevDayKey = dk; const newRun = ME.run !== G.run;
    Object.assign(ME, { pts: 0, hw: [-1, -1, -1, -1], hf: [0, 0, 0, 0], checked: {}, nach: -1, pendLate: -1, knowTests: false, sus: 0, day: G.day, run: G.run, awayT: 0, awayWarn: 0 });
    if (G.ph === 'break' && G.li === 0) { ME.x = rnd(-22, -18); ME.z = rnd(-1.5, 1.5); ME.y = 0; ME.seat = null; yaw = -Math.PI / 2; pitch = 0; ME.ry = Math.PI / 2; }
    if (newRun && G.day === 1) ME.items = [];
    const nextSA = Math.ceil(G.day / G.saEvery) * G.saEvery === G.day ? G.day + G.saEvery : Math.ceil(G.day / G.saEvery) * G.saEvery;
    showBig(`<h2>${esc(TR('Tag {d}: {w}', { d: G.day, w: DAYNAMES[(G.day - 1) % 7] }))}</h2><p>${esc(TR('Klassenziel: {n} Punkte', { n: G.goal }))}<br>${esc(TR('Die Hausübungen hat natürlich wieder keiner gemacht.'))}</p><p style="font-size:15px">${esc(TR('Erste Stunde: {s} im Raum {r}', { s: plan()[0].s, r: ROOMS[plan()[0].room].name }))}</p>${plan().some(l => l.sa) ? `<p style="color:var(--red);font-size:18px">⚠️ ${esc(TR('Heute ist Schularbeit in {s} (3. Stunde). Besorg dir einen Spickzettel!', { s: plan().find(l => l.sa).s }))}</p>` : G.saEvery ? `<p style="font-size:14px">${esc(TR('Nächste Schularbeit: Tag {d}', { d: nextSA }))}</p>` : ''}`, Math.max(1.5, gIntro()));
    Snd.fanfare();
  }
  if (G.ph !== prevPh || G.li !== prevLi) {
    // lesson ended → consequences
    if (prevPh === 'lesson' && ME.day === G.day) {
      if (ME.pendLate === prevLi && !ME.checked[prevLi]) { ME.checked[prevLi] = true; ME.pendLate = -1; if (!useItem('ausrede')) addPts(-50, TR('geschwänzt')); }
      if (ME.nach === prevLi) { ME.nach = -1; addPts(-40, TR('HÜ nicht nachgereicht')); }
    }
    if (G.ph === 'lesson') { const L = curL(); toast(TR('{n}. Stunde: {s}', { n: G.li + 1, s: L.s }), 'info'); }
    if (G.ph === 'break' && prevPh === 'lesson') toast(TR('Pause. Jetzt kannst du den Raum wechseln, HÜs machen oder Items holen.'), 'info');
    if (G.ph === 'dayEnd') showReport();
    if (G.ph === 'detention') startCut();
    if (prevPh === 'detention' && G.ph !== 'detention') endCut();
    prevPh = G.ph; prevLi = G.li;
  }
}
function showReport() {
  const res = G.res || { tp: G.tp, goal: G.goal, pass: G.tp >= G.goal };
  const ps = allPlayers().filter(p => p.presence.n).map(p => ({ n: p.isMe ? ME.name : p.presence.n, pts: p.isMe ? ME.pts : (p.presence.pts || 0) })).sort((a, b) => b.pts - a.pts);
  const per = res.goal / Math.max(1, ps.length);
  const rows = ps.map(p => { const [g, gn] = GRADE(clamp(p.pts / Math.max(1, per) * .75, 0, 1)); return `<span>${esc(p.n)}</span><span>${esc(TR('{n} P.', { n: p.pts }))}</span><span class="g">${g}</span>`; }).join('');
  showBig(`<h2>${esc(res.pass ? TR('Bestanden!') : TR('Nicht bestanden'))}</h2><p>${esc(TR('Zeugnis für Tag {d}: {a} von {b} Punkten', { d: G.day, a: res.tp, b: res.goal }))}</p><div class="grades">${rows}</div><p style="font-size:15px">${esc(res.pass ? TR('Morgen wird es schwieriger. Viel Glück.') : TR('Das heißt: Nachsitzen.'))}</p>`, 10.5);
  if (res.pass) Snd.fanfare(); else Snd.trombone();
}

// ---------------- detention cutscene ----------------
let cut = null; const CX = 140;
function buildDetention() {
  const g = new THREE.Group(); scene.add(g);
  box(CX, -.1, 0, 14, .2, 12, 0x3a3340, g); box(CX, 2, -6, 14, 4, .2, 0x4a4458, g); box(CX - 7, 2, 0, .2, 4, 12, 0x4a4458, g); box(CX + 7, 2, 0, .2, 4, 12, 0x4a4458, g);
  const b = box(CX, 2.2, -5.85, 6, 1.6, .05, texMat('detBoard', 256, 64, (c, w, h) => { c.fillStyle = '#24493a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f4f1e6'; c.font = '34px "Luckiest Guy",Impact'; c.textAlign = 'center'; c.fillText(TR('Nachsitzen'), w / 2, 46); }), g);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), M(0xffffff)); face.position.set(CX + 4.5, 2.6, -5.8); g.add(face);
  const hand = box(0, .35, .02, .08, .7, .02, 0x111111); const pivot = new THREE.Group(); pivot.position.copy(face.position); pivot.position.z += .03; pivot.add(hand); g.add(pivot);
  const hand2 = box(0, .25, .03, .1, .5, .02, 0xe8412c); const pivot2 = new THREE.Group(); pivot2.position.copy(pivot.position); pivot2.add(hand2); g.add(pivot2);
  return { g, pivot, pivot2 };
}
function startCut() {
  closeMG(true); $('#big').classList.add('hidden'); bigT = 0; if (!cut || !cut.room) cut = { room: buildDetention() };
  cut.room.g.visible = true; cut.t = 0; cut.chars = [];
  const ps = allPlayers().filter(p => p.presence.n);
  ps.forEach((p, k) => { const c = makeChar({ col: new THREE.Color(p.isMe ? ME.color : p.presence.c).getHex(), name: p.isMe ? ME.name : p.presence.n }); Object.assign(c, { x: CX - 4 + (k % 3) * 4, y: 0, z: -1 + Math.floor(k / 3) * 3, ry: Math.PI, pose: 'sit' }); cut.chars.push(c); });
  const d = makeChar({ col: TEACH[DIR].col, hair: TEACH[DIR].hair, teacher: true, must: TEACH[DIR].must, sz: 1.18, name: TEACH[DIR].name }); Object.assign(d, { x: CX, y: 0, z: -4.3, ry: 0, pose: 'nap' }); cut.chars.push(d); cut.dir = d;
  $('#cut').classList.remove('hidden'); $('#hud').classList.add('hidden'); Snd.trombone();
}
function updateCut(dt, t) {
  if (!cut || !cut.chars) return; cut.t += dt; const T_ = cut.t;
  const years = Math.floor(Math.pow(T_, 3.1) * 2.2);
  $('#cutY').textContent = T_ < 13 ? TR('{n} Jahre', { n: fmtNum(years) }) : TR('{n} Jahre', { n: '∞' });
  $('#cutS').textContent = T_ < 4 ? TR('Nachsitzen, und zwar bis in alle Ewigkeit.') : T_ < 9 ? TR('Euch wachsen schon Bärte, und die Hausübung ist immer noch nicht fertig.') : T_ < 13 ? TR('Der Direktor schläft, die Uhr läuft weiter.') : TR('Zurück zu Tag 1');
  cut.room.pivot.rotation.z -= dt * (2 + T_ * T_); cut.room.pivot2.rotation.z -= dt * (.2 + T_ * T_ * .08);
  const dayN = (Math.sin(T_ * T_ * .6) + 1) / 2; scene.background.setRGB(lerp(.05, .62, dayN), lerp(.05, .83, dayN), lerp(.15, 1, dayN));
  cut.chars.forEach((c, k) => {
    if (c !== cut.dir) { c.beard.visible = T_ > 3.5; c.beard.scale.set(1.02, .5 + Math.min(3, (T_ - 3.5) * .45), .5); c.beard.position.y = -.42 - Math.min(3, (T_ - 3.5) * .45) * .5; if (T_ > 9 && !c.skel) { c.skel = true; c.parts.forEach(m => m.material = M(0xf3efe0)); Snd.pop(); } c.pose = T_ > 9 ? (Math.sin(T_ * 3 + k) > .7 ? 'raise' : 'sit') : 'sit'; }
    renderChar(c, t, dt);
  });
  const a = T_ * .25; camera.position.set(CX + Math.sin(a) * 7, 4 + Math.sin(T_ * .5), Math.cos(a) * 7 + 2); camera.lookAt(CX, 1, -1);
}
function endCut() { if (!cut) return; (cut.chars || []).forEach(removeChar); cut.chars = null; cut.room.g.visible = false; $('#cut').classList.add('hidden'); $('#hud').classList.remove('hidden'); scene.background.set(0x9fd3ff); }

// ---------------- lobby ----------------
let CODE = ''; let joined = false;
const genCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
(function initLobby() {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('swyf') || '{}'); } catch (e) { }
  applyDomI18n();
  const ls = $('#langSel'); fillLangSelect(ls); ls.onchange = () => { setLang(ls.value); location.reload(); };
  $('#nameIn').value = saved.name || pick(['Kevin', 'Chantal', 'Jonas', 'Leonie', 'Tobias', 'Lena', 'Ali', 'Marie']);
  ME.color = saved.color || pick(COLORS);
  $('#codeIn').value = (location.hash.slice(1).match(/^[A-Za-z0-9]{3,8}$/) ? location.hash.slice(1) : saved.code || genCode()).toUpperCase();
  const sw = $('#swatches'); COLORS.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch' + (c === ME.color ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', TR('Farbe') + ' ' + c); b.onclick = () => { ME.color = c; sw.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === b)); }; sw.appendChild(b); });
  $('#newCode').onclick = () => { $('#codeIn').value = genCode(); };
  $('#joinBtn').onclick = async () => {
    Snd.init(); if (joined) return; joined = true;
    ME.name = ($('#nameIn').value.trim() || TR('Schüler')).slice(0, 14); CODE = ($('#codeIn').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || genCode()).slice(0, 8);
    try { localStorage.setItem('swyf', JSON.stringify({ name: ME.name, color: ME.color, code: CODE })); } catch (e) { }
    $('#joinBtn').textContent = TR('Verbinde'); $('#joinBtn').disabled = true;
    const online = await netJoin(CODE);
    initChars();
    $('#lobbyRoom').classList.remove('hidden'); $('#joinBtn').textContent = TR('Drinnen ✔');
    $('#lobbyNote').textContent = online ? TR('Klasse {c}: Deine Freunde öffnen dieselbe Seite und geben den gleichen Code ein. Starten kann jeder.', { c: CODE }) : TR('Mehrspieler geht hier nicht, also spielst du allein. Über einen claude.ai-Link funktioniert der Klassen-Code.');
    started = true;
  };
  $('#startBtn').onclick = () => { act('start', { dur: +$('#lenSel').value, sa: +$('#saSel').value }); $('#startBtn').textContent = TR('Startet'); };
})();
function lobbyTick() {
  const list = allPlayers().filter(p => p.presence.n).map(p => `<span class="pchip"><i style="background:${esc(p.isMe ? ME.color : p.presence.c)}"></i>${esc(p.isMe ? ME.name + ' (' + TR('du') + ')' : p.presence.n)}</span>`).join('');
  const pl = $('#plist'); if (pl.dataset.h !== list) { pl.innerHTML = list; pl.dataset.h = list; }
}

// ---------------- presence & main loop ----------------
function buildPresence() {
  Object.assign(myP, {
    v: 1, n: ME.name, c: ME.color, x: +ME.x.toFixed(2), y: +ME.y.toFixed(2), z: +ME.z.toFixed(2), ry: +ME.ry.toFixed(2), po: meCh.pose, sp: +ME.spd.toFixed(1),
    seat: ME.seat ? ME.seat.key : '', pts: ME.pts, sus: Math.round(ME.sus), hw: ME.hw.map(q => q < 0 ? -1 : Math.round(q * 100)), hf: ME.hf, rgc: ME.rgc, rv: ME.rv.map(v => +(+v).toFixed(1)), tag: ME.tagT > 0 ? 1 : 0, day: ME.day, run: ME.run,
  });
}
let lastT = performance.now(); let inGame = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, Math.max(0, (now - lastT) / 1000)); lastT = now; const t = now / 1000;
  try {
    if (!started) { const a = t * .05; camera.position.set(Math.sin(a) * 45, 22, Math.cos(a) * 45); camera.lookAt(0, 2, 0); renderer.render(scene, camera); return; }
    syncG(now);
    const frozen = paused && !others().length; // solo: Pause hält die Zeit an
    if (isHost() && !frozen) hostTick(dt);
    buildPresence();
    processLogs();
    const was = inGame; inGame = G.ph !== 'lobby';
    if (inGame && !was) { $('#lobby').classList.add('hidden'); $('#hud').classList.remove('hidden'); canvas.focus(); }
    if (!inGame) { lobbyTick(); const a = t * .05; camera.position.set(Math.sin(a) * 45, 22, Math.cos(a) * 45); camera.lookAt(0, 2, 0); }
    phaseCheck(dt);
    if (inGame && G.ph === 'detention') updateCut(dt, t);
    else if (inGame) { if (!frozen) { updateMe(dt, t); updateSus(dt); checkBananas(); } updateCamera(dt); updateHands(dt, t); }
    else renderChar(meCh, t, dt);
    if (inGame && G.ph !== 'detention') { updateCones(t); updateWaypoint(t); } else { wpArrow.visible = false; cones.forEach(c => c && (c.g.visible = false)); }
    meCh.shadow.visible = G.ph !== 'detention'; meCh.g.visible = G.ph !== 'detention' && (!inGame || !!meCh.rg); // 1st person: eigener Körper nur beim Ragdoll
    updateRemote(dt, t); updateTeachers(dt, t); updateWanderers(dt, t); updateNPC(dt, t); updateProjs(dt);
    sendPresence(now);
    if (inGame) hudTick(now);
  } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } }
  renderer.render(scene, camera);
  if (inGame) renderHands();
}
requestAnimationFrame(frame);
window.__swyf = { G, ME, H, Net, act, startMG, GAMES, plan };
