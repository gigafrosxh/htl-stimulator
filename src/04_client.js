// ---------------- local player ----------------
const ME = { name: TR('Schüler'), color: COLORS[0], x: -20, y: 0, z: 0, ry: Math.PI / 2, vy: 0, seat: null, pts: 0, sus: 0, hw: [-1, -1, -1, -1], hf: [0, 0, 0, 0], items: [], rgc: 0, rv: [0, 0, 0], energyT: 0, warned: false, copy: null, cool: {}, pendLate: -1, nach: -1, checked: {}, awayT: 0, awayWarn: 0, tagT: 0, bonus: 0, knowTests: false, day: 0, run: -1, pose: 'idle', poseT: 0, spd: 0 };
let meCh = null; const remote = new Map(); const tchCh = []; const npcCh = []; const wanCh = []; const WV = WAND.map(() => ({ x: 0, y: -50, z: 0, ry: 0, init: false })); const projs = []; const bananas = new Map();
let started = false, yaw = -Math.PI / 2, pitch = 0, camDist = 3.6;
const keys = new Set();
// ---------------- Einstellungen + Esc-Menü ----------------
const SET = Object.assign({ sens: 1, fov: 74, vol: 1, inv: false, bob: true, tips: true }, (() => { try { return JSON.parse(localStorage.getItem('swyf-settings') || '{}'); } catch (e) { return {}; } })());
function applySettings() { $('#help').classList.toggle('mini', !SET.tips); camera.fov = SET.fov; camera.updateProjectionMatrix(); Snd.vol = SET.vol; try { localStorage.setItem('swyf-settings', JSON.stringify(SET)); } catch (e) { } }
let paused = false;
function canPause() { return started && G.ph !== 'lobby' && G.ph !== 'detention' && !MG.open; }
function openPause() { if (paused || !canPause()) return; paused = true; keys.clear(); jumpBuffer = 0; $('#pause').classList.remove('hidden'); $('#pauseSub').textContent = others().length ? TR('Achtung, im Mehrspieler läuft die Zeit weiter.') : TR('Die Zeit ist angehalten.'); if (document.pointerLockElement === canvas) { try { document.exitPointerLock(); } catch (e) { } } setTimeout(() => $('#pResume').focus(), 0); }
function closePause(lock = true) { if (!paused) return; paused = false; $('#pause').classList.add('hidden'); canvas.focus(); if (lock) { try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } } }
let lockLostAt = 0;
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== canvas && canPause() && !paused) { lockLostAt = performance.now(); openPause(); } });
(function initPauseUI() {
  const bind = (id, out, key, fmt) => { const el = $(id); el.value = SET[key]; $(out).textContent = fmt(SET[key]); el.addEventListener('input', () => { SET[key] = +el.value; $(out).textContent = fmt(SET[key]); applySettings(); }); };
  bind('#sSens', '#oSens', 'sens', v => v.toFixed(2) + '×'); bind('#sFov', '#oFov', 'fov', v => v + '°'); bind('#sVol', '#oVol', 'vol', v => Math.round(v * 100) + '%');
  $('#sInv').checked = SET.inv; $('#sInv').addEventListener('change', e => { SET.inv = e.target.checked; applySettings(); });
  $('#sBob').checked = SET.bob; $('#sBob').addEventListener('change', e => { SET.bob = e.target.checked; applySettings(); });
  $('#pResume').addEventListener('click', () => closePause(true));
  $('#pKeys').addEventListener('click', () => $('#pKeyList').classList.toggle('hidden'));
  $('#pLeave').addEventListener('click', () => { location.reload(); });
  const sl = $('#sLang'); fillLangSelect(sl); sl.addEventListener('change', () => { setLang(sl.value); $('#langNote').classList.toggle('hidden', sl.value === LANG); });
  $('#langReload').addEventListener('click', () => location.reload());
  $('#pause').addEventListener('mousedown', e => { if (e.target.id === 'pause') closePause(true); });
  applySettings();
})();
let jumpBuffer = 0, coyoteTime = 0;
const meName = () => ME.name;

function initChars() {
  meCh = makeChar({ col: new THREE.Color(ME.color).getHex(), name: ME.name });
  TEACH.forEach((t, i) => { const c = makeChar({ col: t.col, hair: t.hair, pants: 0x333333, sz: 1.18, teacher: true, must: t.must, name: t.name, skin: i === SUP ? 0xe0b890 : 0xf2c79b }); c.x = 0; c.y = -50; tchCh.push(c); });
  WAND.forEach(w => { const c = makeChar({ col: w.col, hair: w.hair, name: w.n, hat: w.hat ?? -1, sz: w.sz || 1, teacher: !!w.teacher, pants: w.role === 'janitor' ? 0x3b4a6b : 0x2b3a67 }); c.y = -50; wanCh.push(c); });
  for (let i = 0; i < 6; i++) { const c = makeChar({ col: [0x5d8aa8, 0xc0392b, 0x27ae60, 0xf39c12, 0x8e44ad, 0x16a085][i], hair: [0x2b1a0e, 0xf5d76e, 0x111111, 0x8b4513, 0xd35400, 0x555555][i], name: ['Jonas', 'Lea', 'Mehmet', 'Sophie', 'Lukas', 'Mia'][i] }); c.y = -50; c.pose = 'sit'; npcCh.push(c); }
}

// ---------------- input ----------------
addEventListener('keydown', e => {
  if (paused) { if (e.code === 'Escape' && performance.now() - lockLostAt > 250) { e.preventDefault(); closePause(true); } return; }
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) { if (e.code === 'Escape') { e.target.blur(); if (MG.open && !MG.forced) closeMG(); } return; }
  if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  if (!started) return;
  Snd.init();
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'Escape' && MG.open && !MG.forced) { closeMG(); return; }
  if (e.code === 'Escape' && !MG.open) { openPause(); return; }
  if (MG.open) return;
  if (e.code === 'Space') jumpBuffer = .14;
  onKey(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); jumpBuffer = 0; });
let dragging = false;
canvas.addEventListener('mousedown', e => { Snd.init(); if (paused) return; dragging = true; if (started && !MG.open && document.pointerLockElement !== canvas) { try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { } } });
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', e => {
  if (paused) return; if (document.pointerLockElement === canvas || dragging) { yaw -= e.movementX * .0026 * SET.sens; pitch = clamp(pitch + e.movementY * .0024 * SET.sens * (SET.inv ? -1 : 1), -1.4, 1.4); }
});

// ---------------- helpers ----------------
function myRoom() { return roomAt(ME.x, ME.z, ME.y); }
function curL() { return plan()[G.li]; }
function inLessonRoom() { const L = curL(); return L && myRoom().i === lessonRoomIdx(L, gEl(performance.now())) && myRoom().type === 'class'; }
function toast(txt, k = '', dur = 3200) { const d = document.createElement('div'); d.className = 'toast ' + k; d.textContent = txt; const box = $('#toasts'); box.appendChild(d); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => d.remove(), dur); }
function addPts(n, why) { ME.pts += n; if (n > 0) { Snd.coin(); toast(`+${n} ${why || ''}`, 'good'); } else if (n < 0) { Snd.buzz(); toast(`${n} ${why || ''}`, 'bad'); } }
function flash(c = 'red', o = .35) { const f = $('#flash'); f.style.background = c; f.style.opacity = o; setTimeout(() => f.style.opacity = 0, 180); }
function setPose(p, t = 1.2) { ME.pose = p; ME.poseT = t; }
function subjOf(li) { const L = plan()[li]; return L ? TR(L.s) : ''; }
function hwOpen(li) { // can this HW still be done?
  const L = plan()[li]; if (!L || !needHW(li)) return false;
  if (ME.checked[li]) return ME.nach === li;
  if (G.ph === 'lesson' && li < G.li) return false; if (G.ph === 'break' && li < G.li) return false;
  return G.ph === 'break' || G.ph === 'lesson';
}
function useItem(kind) { const i = ME.items.indexOf(kind); if (i < 0) return false; ME.items.splice(i, 1); return true; }
function peerName(peer) { if (peer === Net.me) return ME.name; const p = others().find(o => o.peer === peer); return p ? p.presence.n : '???'; }
function bestOf(li) { let best = -1, who = ''; allPlayers().forEach(p => { const q = p.isMe ? ME.hw[li] : ((p.presence.hw || [])[li] ?? -1) / 100; if (p.presence.day === G.day && p.presence.run === G.run && q > best) { best = q; who = p.isMe ? ME.name : p.presence.n; } }); return [best, who]; }
const ptsFor = q => Math.round(30 + 90 * q);

// ---------------- vision / suspicion ----------------
const TV = TEACH.map(() => ({ x: 0, y: -50, z: 0, ry: 0, st: 'c', rg: 0, tx: 0, ty: -50, tz: 0, tr: 0, init: false }));
function teacherSees(i, x, y, z) {
  const t = TV[i]; if (!t || t.rg || !'fsxpwc'.includes(t.st)) return 0; if (Math.abs(t.y - y) > 1.8) return 0;
  const rt = roomAt(t.x, t.z, t.y), rp = roomAt(x, z, y); if (rt.name !== rp.name || rp.type === 'toilet') return 0;
  const P = PERS[TEACH[i].pers]; const dx = x - t.x, dz = z - t.z, d = Math.hypot(dx, dz); const view = P.view * (1 + .07 * (G.day - 1)); if (d > view) return 0;
  const a = Math.abs(angDiff(t.ry, Math.atan2(dx, dz))); const fov = P.fov * 1.15 * (t.st === 'c' ? .75 : t.st === 'w' ? .85 : 1);
  if (a > fov / 2 && d > 2.1) return 0;
  return P.sus * (.55 + .45 * (1 - d / view)) * (1 + .12 * (G.day - 1));
}
function bestWatcher() { let b = 0, w = -1; TEACH.forEach((_, i) => { const s = teacherSees(i, ME.x, ME.y + .5, ME.z); if (s > b) { b = s; w = i; } }); return [b, w]; }
function activity() {
  const r = myRoom(); const moving = ME.spd > .5, sprint = moving && (keys.has('ShiftLeft') || keys.has('ShiftRight'));
  if (r.type === 'staff') return 1.7; if (r.type === 'office') return 1.2; if (r.type === 'toilet') return 0;
  if (meCh.rg) return .5;
  let a = 0;
  if (G.ph === 'lesson') {
    const L = curL();
    if (inLessonRoom()) { a = ME.cheatT > 0 ? 1.4 : MG.open && !MG.forced ? 1 : ME.copy ? (ME.copy.phone ? 1.5 : 1.2) : ME.pose === 'phone' ? 1.4 : sprint ? 1 : moving ? .55 : ME.seat ? 0 : .3; }
    else if (r.type === 'hall') a = sprint ? 1 : .6;
    if (L && L.ev === 'director' && a > 0) a *= 1.2;
  } else if (G.ph === 'break') { if (r.type === 'hall' && sprint) a = .45; }
  return a;
}
function spikeIfSeen(n, why) { const [s, w] = bestWatcher(); if (s > 0) { ME.sus += n * 1.3 * Math.max(.7, s); if (why) toast(why, 'bad'); if (ME.sus >= 100) caught(w); return true; } return false; }
function updateSus(dt) {
  if (!['lesson', 'break'].includes(G.ph)) { ME.sus = Math.max(0, ME.sus - 20 * dt); return; }
  const a = activity(); const [s, w] = bestWatcher(); const g = a * s;
  if (g > 0) { ME.sus += g * 48 * dt; if (Math.random() < dt * 2) Snd.heart(); }
  else ME.sus = Math.max(0, ME.sus - 4.5 * dt); // langsamer vergessen: erwischt wird man jetzt öfter
  if (myRoom().type === 'staff' && s > 0 && !ME.staffWarn) { ME.staffWarn = 1; act('staff', { w }); setTimeout(() => ME.staffWarn = 0, 8000); }
  const gu = wanCh[0]; const cheating = (MG.open && !MG.forced) || ME.copy;
  if (gu && cheating && !gu.rg && Math.hypot(gu.x - ME.x, gu.z - ME.z) < 4.5 && Math.abs(gu.y - ME.y) < 1.5 && (ME.cool.streber || 0) < performance.now() / 1000) {
    ME.cool.streber = performance.now() / 1000 + 25; ME.sus = Math.min(97, ME.sus + 30); say(gu, TR('Herr Professor, der schummelt!'), 1.6, 3); Snd.huh(); toast(TR('Streber Günther hat dich verpetzt!'), 'bad');
  }
  if (ME.sus > 55 && !ME.warned && w >= 0) { ME.warned = true; act('sus50', { w }); Snd.huh(); }
  if (ME.sus < 30) ME.warned = false;
  if (ME.sus >= 100) caught(w);
}
function caught(w, heavy = false) {
  ME.sus = 45; ME.warned = false; ME.cheatT = 0;
  if (MG.open && MG.opts && MG.opts.exam) { closeMG(true); toast(TR('Beim Schummeln erwischt. Die Schularbeit ist weg!'), 'bad', 4500); addPts(-80, TR('Schularbeit: Nicht genügend (Schummeln)')); }
  if (MG.open && !MG.forced) closeMG(true); ME.copy = null;
  const t = TV[w] || { x: ME.x - 1, z: ME.z }; const dx = ME.x - t.x, dz = ME.z - t.z, d = Math.hypot(dx, dz) || 1;
  myRagdoll(dx / d * 7, 7, dz / d * 7, 2.4); Snd.scream(1.1); flash('red', .45);
  act('caught', { w: Math.max(0, w) });
  if (useItem('ausrede')) { toast(TR('Erwischt! Zum Glück hast du eine gefälschte Entschuldigung dabei.'), 'good', 4000); return; }
  if (heavy) { toast(TR('Beim Feueralarm erwischt!'), 'bad'); addPts(-80, TR('Ab in die Direktion')); return; }
  const r = Math.random();
  if (r < .3 && G.ph === 'lesson') { toast(TR('Erwischt! Ab an die Tafel.'), 'bad', 3500); setTimeout(() => startTafel(), 1800); }
  else if (r < .55) { toast(TR('Erwischt! Das gibt eine Strafarbeit.'), 'bad'); addPts(-30, TR('Strafarbeit')); }
  else if (r < .8) {
    const li = [0, 1, 2, 3].find(i => needHW(i) && !ME.checked[i] && ME.hw[i] < 0);
    toast(TR('Erwischt! Jetzt wird spontan deine Hausübung kontrolliert.'), 'bad');
    if (li !== undefined) addPts(-40, TR('HÜ in {s} fehlt', { s: subjOf(li) })); else toast(TR('Alles da. Der Lehrer ist fast enttäuscht.'), 'good');
  } else { toast(ME.items.length ? TR('Erwischt! Deine Sachen werden eingesammelt.') : TR('Erwischt! Das gibt einen Eintrag ins Klassenbuch.'), 'bad'); ME.items = []; addPts(-15, TR('Eintrag')); }
}

// ---------------- actions by key ----------------
function nearestPlayer(maxD, filter = () => true) { let best = null, bd = maxD; others().forEach(p => { const q = p.presence; if (!q.n || Math.abs(q.y - ME.y) > 1.5) return; const d = Math.hypot(q.x - ME.x, q.z - ME.z); if (d < bd && filter(p)) { bd = d; best = p; } }); return best; }
function frontTarget(maxD) {
  const cands = [];
  others().forEach(p => { const q = p.presence; if (q.n && Math.abs(q.y - ME.y) < 1.5) cands.push({ k: 'p', id: p.peer, x: q.x, z: q.z, name: q.n }); });
  TV.forEach((t, i) => { if (Math.abs(t.y - ME.y) < 1.5 && !t.rg) cands.push({ k: 't', id: i, x: t.x, z: t.z, name: TEACH[i].name }); });
  npcCh.forEach((c, i) => { if (Math.abs(c.y - ME.y) < 1.5) cands.push({ k: 'n', id: i, x: c.x, z: c.z, name: 'NPC' }); });
  wanCh.forEach((c, i) => { if (Math.abs(c.y - ME.y) < 1.5 && !c.rg) cands.push({ k: 'w', id: i, x: c.x, z: c.z, name: WAND[i].n }); });
  let best = null, bd = maxD; cands.forEach(c => { const d = Math.hypot(c.x - ME.x, c.z - ME.z); const a = Math.abs(angDiff(ME.ry, Math.atan2(c.x - ME.x, c.z - ME.z))); if (d < bd && (a < 1.3 || d < .9)) { bd = d; best = c; } });
  return best;
}
function hwLessons() { return [0, 1, 2, 3].filter(li => hwOpen(li)); }
function onKey(code) {
  const now = performance.now() / 1000; const cd = (k, s) => { if ((ME.cool[k] || 0) > now) return false; ME.cool[k] = now + s; return true; };
  if (code === 'KeyT') { SET.tips = !SET.tips; applySettings(); return; }
  if (introOn() && code !== 'KeyM') return; // Tageskarte: erst loslegen, wenn sie weg ist
  if (meCh.rg && code !== 'KeyH') return;
  switch (code) {
    case 'KeyE': interact(); break;
    case 'KeyH': { const li = hwLessons().find(i => ME.hw[i] < 0 || i === ME.nach) ?? hwLessons()[0]; if (li === undefined) toast(TR('Du hast gerade keine Hausübung offen.'), 'info'); else openHW(li); break; }
    case 'KeyQ': if (G.ph === 'lesson' && inLessonRoom() && cd('q', 15)) { setPose('raise', 2.5); act('question'); Snd.huh(); toast(TR('„Herr Professor, warum ist Wasser eigentlich nass?“'), 'info'); } break;
    case 'KeyF': {
      const p = nearestPlayer(2.4, p => hwLessons().some(li => ((p.presence.hw || [])[li] ?? -1) > Math.max(0, ME.hw[li] * 100)));
      if (!p) { toast(TR('Hier hat niemand was zum Abschreiben.'), 'info'); break; }
      const li = hwLessons().filter(li => (p.presence.hw[li] ?? -1) > ME.hw[li] * 100).sort((a, b) => a - b)[0];
      ME.copy = { li, from: p.peer, q: p.presence.hw[li] / 100 * .9, t: 3.2, total: 3.2, phone: false, fake: p.presence.hf && p.presence.hf[li] };
      act('copy', { tg: p.peer, li }); toast(TR('Du schreibst {s} von {n} ab.', { s: subjOf(li), n: p.presence.n }), 'info'); break;
    }
    case 'KeyV': {
      if (!cd('v', 6)) break;
      const p = nearestPlayer(1.9, p => hwLessons().some(li => ((p.presence.hw || [])[li] ?? -1) > 0));
      if (!p) { toast(TR('Da ist keiner, den du beklauen kannst.'), 'info'); break; }
      const li = hwLessons().filter(li => (p.presence.hw[li] ?? -1) > 0).sort((a, b) => p.presence.hw[b] - p.presence.hw[a])[0];
      ME.hw[li] = Math.max(ME.hw[li], p.presence.hw[li] / 100); ME.hf[li] = p.presence.hf ? p.presence.hf[li] : 0;
      act('steal', { tg: p.peer, li }); Snd.slap(); setPose('point', .6); toast(TR('Du hast {n} die HÜ in {s} geklaut!', { s: subjOf(li), n: p.presence.n }), 'good');
      spikeIfSeen(30, TR('Der Lehrer hat dich beim Klauen gesehen!')); break;
    }
    case 'KeyG': {
      if (!cd('g', 1.2)) break;
      const lis = hwLessons().filter(li => ME.hw[li] > 0); const li = lis.length ? lis.sort((a, b) => ME.hw[b] - ME.hw[a])[0] : -1;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw); if (!ME.seat) ME.ry = Math.atan2(fx, fz);
      const cp = Math.cos(pitch), p = [ME.x + fx * .5, ME.y + 1.7, ME.z + fz * .5], v = [fx * 12 * cp, 2.6 - Math.sin(pitch) * 12, fz * 12 * cp]; ME.throwT = .35;
      spawnProj(p, v, true, li, li >= 0 ? ME.hw[li] : 0, li >= 0 ? ME.hf[li] : 0); act('throw', { p, v }); Snd.whoosh(); setPose('raise', .5);
      spikeIfSeen(22); break;
    }
    case 'KeyR': {
      if (!cd('r', 1.2)) break; const t = frontTarget(1.8); setPose('point', .5); Snd.whoosh();
      if (!t) break; const fx = Math.sin(ME.ry), fz = Math.cos(ME.ry); const v = [fx * 7, 5, fz * 7];
      if (t.k === 'p') { act('shove', { tg: t.id, v }); Snd.slap(); spikeIfSeen(28, TR('Der Lehrer hat das Schubsen gesehen!')); }
      else if (t.k === 'n') { act('npc', { k: t.id, v }); Snd.slap(); spikeIfSeen(20); }
      else if (t.k === 'w') { act('npcW', { k: t.id, v }); Snd.slap(); spikeIfSeen(20); }
      else if (t.k === 't') { act('shoveT', { w: t.id, v }); Snd.slap(); Snd.scream(.7); toast(TR('Du hast {n} geschubst. Das war keine gute Idee.', { n: t.name }), 'bad'); setTimeout(() => { ME.sus = 100; caught(t.id); }, 1200); }
      break;
    }
    case 'KeyX': {
      if (!cd('x', 10)) break;
      let w = -1, bd = 4.5; TV.forEach((t, i) => { const d = Math.hypot(t.x - ME.x, t.z - ME.z); if (d < bd && Math.abs(t.y - ME.y) < 1.5 && !t.rg) { bd = d; w = i; } });
      if (w < 0) { toast(TR('Hier ist kein Lehrer, bei dem du petzen kannst.'), 'info'); break; }
      const vic = others().filter(p => p.presence.n && roomAt(p.presence.x, p.presence.z, p.presence.y).name === myRoom().name).sort((a, b) => (b.presence.sus || 0) - (a.presence.sus || 0))[0];
      if (!vic) { toast(TR('{n}: „Petzen, wenn gar nichts war? Frech.“', { n: TEACH[w].name }), 'bad'); ME.sus += 20; break; }
      act('snitch', { tg: vic.peer, w, tn: vic.presence.n }); ME.tagT = 40; addPts(10, TR('fürs Petzen')); setPose('point', 1); break;
    }
    case 'Digit1': case 'Digit2': case 'Digit3': useSlot(+code.slice(5) - 1); break;
    case 'KeyM': Snd.on = !Snd.on; toast(Snd.on ? TR('Ton an') : TR('Ton aus'), 'info'); break;
  }
}
function useSlot(i) {
  const it = ME.items[i]; if (!it) return;
  if (it === 'energy') { ME.items.splice(i, 1); ME.energyT = 15; Snd.pfft(); toast(TR('Energy Drink! Jetzt geht alles schneller.'), 'good'); setTimeout(() => Snd.burp(), 15000); }
  else if (it === 'rechner' || it === 'spick') { ME.items.splice(i, 1); ME.bonus = Math.min(.7, ME.bonus + .35); toast(TR('{n} ist bereit: nächste HÜ oder nächster Test +35 %', { n: ITEMS[it].name }), 'good'); Snd.paper(); }
  else if (it === 'banane') { ME.items.splice(i, 1); const id = Net.me + ':' + Date.now(); const p = [ME.x - Math.sin(ME.ry) * .9, ME.y, ME.z - Math.cos(ME.ry) * .9]; act('banana', { id, p }); Snd.squeak(); toast(TR('Bananenschale liegt. Jetzt heißt es warten.'), 'info'); }
  else toast(TR('{n} wird automatisch benutzt, wenn du es brauchst.', { n: ITEMS[it].name }), 'info');
}
function interact() {
  if (ME.seat) { ME.seat = null; Snd.squeak(); return; }
  const now = performance.now() / 1000;
  let best = null, bd = 9; INTER.forEach(it => { const d = Math.hypot(it.x - ME.x, it.z - ME.z); if (d < it.r && Math.abs(it.y - ME.y) < 1.5 && d < bd) { bd = d; best = it; } });
  if (best) { doInter(best, now); return; }
  const s = nearestSeat(); if (s) { ME.seat = s; ME.x = s.x; ME.z = s.z; ME.y = s.y; ME.ry = s.ry; yaw = s.ry + Math.PI; pitch = .12; Snd.squeak(); }
}
function nearestSeat() {
  const r = myRoom(); if (r.type !== 'class') return null; const seats = SEATS[r.i]; let best = null, bd = 1.6;
  const taken = new Set(others().map(p => p.presence.seat).filter(Boolean)); npcSeats().forEach(k => taken.add(k));
  seats.forEach((s, k) => { const key = r.i + ':' + k; if (taken.has(key)) return; const d = Math.hypot(s.x - ME.x, s.z - ME.z); if (d < bd) { bd = d; best = Object.assign({ key }, s); } });
  return best;
}
function doInter(it, now) {
  const ck = 'i' + it.label;
  if (it.key === 'alarm') {
    if ((ME.cool.alarm || 0) > now) { toast(TR('Den Alarm hat grad erst wer ausgelöst.'), 'info'); return; } ME.cool.alarm = now + 60;
    const [s, w] = bestWatcher(); act('alarm'); setPose('point', .8);
    if (s > 0) setTimeout(() => caught(w, true), 900); return;
  }
  if ((ME.cool[ck] || 0) > now) { toast(TR('Noch {s} s warten.', { s: Math.ceil(ME.cool[ck] - now) }), 'info'); return; }
  if (it.key === 'item') {
    if (ME.items.length >= 3) { toast(TR('Dein Rucksack ist voll (höchstens 3 Items).'), 'info'); return; }
    ME.cool[ck] = now + (it.cd || 20);
    const kind = it.item === 'rand' ? pick(['energy', 'energy', 'rechner', 'banane', 'spick']) : it.item; ME.items.push(kind);
    Snd.pop(); toast(`${ITEMS[kind].icon} ${ITEMS[kind].name}: ${ITEMS[kind].desc}`, 'good', 3800); if (it.risky) spikeIfSeen(25, TR('Ein Lehrer hat dich gesehen!'));
  } else if (it.key === 'grades') { ME.cool[ck] = now + it.cd; addPts(60, TR('Noten „korrigiert“')); Snd.click(); spikeIfSeen(45, TR('Am Lehrer-PC ertappt!')); }
  else if (it.key === 'calendar') { ME.knowTests = true; Snd.paper(); const n = plan().filter(L => L.test).length; toast(n ? TR('Laut Kalender gibt es heute Tests: {n}. Sie sind jetzt im Stundenplan markiert.', { n }) : TR('Laut Kalender gibt es heute keinen Test.'), 'info', 4000); spikeIfSeen(15); }
}
function myRagdoll(vx, vy, vz, dur = 2.5) { ME.rgc++; ME.rv = [vx, vy, vz, dur]; ME.seat = null; startRagdoll(meCh, vx, vy, vz, dur); ME.copy = null; if (MG.open && !MG.forced) closeMG(true); }

// ---------------- projectiles & bananas ----------------
const paperGeo = new THREE.IcosahedronGeometry(.13, 0);
function spawnProj(p, v, mine, li = -1, q = 0, f = 0) { const m = new THREE.Mesh(paperGeo, M(0xffffff)); m.position.set(...p); scene.add(m); projs.push({ m, v: new THREE.Vector3(...v), mine, li, q, f, t: 0 }); }
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const P = projs[i]; P.t += dt; P.v.y -= 14 * dt; P.m.position.addScaledVector(P.v, dt); P.m.rotation.x += dt * 9; P.m.rotation.y += dt * 7;
    const p = P.m.position; let dead = P.t > 4; const g = groundAt(p.x, p.z, p.y + .2);
    if (p.y < g + .1) { p.y = g + .1; P.v.set(P.v.x * .3, Math.abs(P.v.y) * .3, P.v.z * .3); if (P.v.length() < .5) dead = true; }
    const [nx, nz] = collide(p.x, p.z, p.x, p.z, .1, p.y); if (nx !== p.x || nz !== p.z) { p.x = nx; p.z = nz; P.v.x *= -.4; P.v.z *= -.4; }
    if (P.mine && P.t > .08 && !dead) {
      for (const o of others()) { const c = remote.get(o.peer); if (!c) continue; if (c.ch.J[0].distanceTo(p) < .55 || c.ch.J[1].distanceTo(p) < .5) { dead = true; Snd.paper(); act('note', { tg: o.peer, li: P.li, q: Math.round(P.q * 100), f: P.f }); toast(P.li >= 0 ? TR('Zettel mit {s} ist bei {n} angekommen!', { s: subjOf(P.li), n: o.presence.n }) : TR('Volltreffer bei {n}!', { n: o.presence.n }), 'good'); break; } }
      if (!dead) TV.forEach((t, w) => { if (!dead && tchCh[w].J[0].distanceTo(p) < .7) { dead = true; act('hitT', { w }); Snd.boing(); ME.sus += 45; toast(TR('Du hast {n} abgeschossen!', { n: TEACH[w].name }), 'bad'); if (ME.sus >= 100) caught(w); } });
      if (!dead) wanCh.forEach((c, k) => { if (!dead && c.y > -10 && c.J[0].distanceTo(p) < .6) { dead = true; Snd.boing(); act('npcW', { k, v: [P.v.x * .4, 4, P.v.z * .4] }); } });
      if (!dead) npcCh.forEach((c, k) => { if (!dead && c.y > -10 && c.J[0].distanceTo(p) < .55) { dead = true; act('npc', { k, v: [P.v.x * .3, 3, P.v.z * .3] }); } });
    }
    if (dead) { scene.remove(P.m); projs.splice(i, 1); }
  }
}
function addBanana(id, p) { if (bananas.has(id)) return; const m = new THREE.Group(); box(0, .05, 0, .5, .08, .18, 0xffd23f, m); box(.2, .06, .12, .3, .06, .14, 0xffd23f, m).rotation.y = .7; box(-.2, .06, .12, .3, .06, .14, 0xffd23f, m).rotation.y = -.7; m.position.set(...p); scene.add(m); bananas.set(id, { m, x: p[0], y: p[1], z: p[2], t: performance.now() }); }
function rmBanana(id) { const b = bananas.get(id); if (b) { scene.remove(b.m); bananas.delete(id); } }
function checkBananas() { bananas.forEach((b, id) => { if (performance.now() - b.t < 1200) return; if (!meCh.rg && Math.hypot(b.x - ME.x, b.z - ME.z) < .5 && Math.abs(b.y - ME.y) < 1) { myRagdoll(Math.sin(ME.ry) * 6, 7, Math.cos(ME.ry) * 6, 2.6); Snd.whistleUp(); Snd.boing(); toast('AUSGERUTSCHT!', 'bad'); act('rmB', { id }); rmBanana(id); } }); }

// ---------------- processing logs ----------------
const seenA = {}; let seenE = -1, seenEHost = null;
function processLogs() {
  const host = isHost();
  allPlayers().forEach(p => {
    const a = p.presence.a || []; const key = p.isMe ? '__me' : p.peer;
    if (seenA[key] === undefined) { seenA[key] = p.isMe || !a.length ? 0 : a[a.length - 1].s; if (!p.isMe) return; }
    a.forEach(x => {
      if (x.s <= seenA[key]) return; seenA[key] = x.s;
      if (host) hostAction(p, x);
      clientAction(p, x);
    });
  });
  // host events
  const hid = hostId(); if (seenEHost !== hid) { seenEHost = hid; if (seenE < 0) seenE = G.es || 0; }
  (G.ev || []).forEach(e => { if (e.s > seenE) { seenE = e.s; hostEvent(e); } });
}
function clientAction(p, x) {
  const mine = x.tg === Net.me && !p.isMe; const n = p.presence.n;
  switch (x.t) {
    case 'shove': if (mine) { myRagdoll(x.v[0], x.v[1], x.v[2], 2.2); Snd.scream(1.3); toast(TR('{n} hat dich geschubst!', { n }), 'bad'); } break;
    case 'steal': if (mine) { ME.hw[x.li] = -1; ME.hf[x.li] = 0; toast(TR('{n} hat dir die HÜ in {s} geklaut!', { n, s: subjOf(x.li) }), 'bad', 4000); Snd.buzz(); } break;
    case 'note': if (mine) { Snd.paper(); if (x.li >= 0 && hwOpen(x.li) && x.q / 100 > ME.hw[x.li]) { ME.hw[x.li] = x.q / 100; ME.hf[x.li] = x.f; toast(TR('{n} hat dir die HÜ in {s} zugeworfen!', { n, s: subjOf(x.li) }), 'good', 4000); } else toast(TR('{n} hat dich mit einem Papierknäuel getroffen.', { n }), 'info'); } break;
    case 'snitch': if (mine) { ME.sus = Math.min(99, ME.sus + 45); toast(TR('{n} hat dich verpetzt!', { n }), 'bad', 4000); Snd.huh(); } break;
    case 'copy': if (mine) toast(TR('{n} schreibt grad von dir ab.', { n }), 'info'); break;
    case 'throw': if (!p.isMe) spawnProj(x.p, x.v, false); break;
    case 'npc': { const c = npcCh[x.k]; if (c) { startRagdoll(c, x.v[0], x.v[1], x.v[2], 2.5); if (Math.random() < .5) say(c, TR(pick(N_(['Au!', 'Ey!', 'Mama!', 'Was soll das?']))), 1.5, 2); } break; }
    case 'npcW': { const c = wanCh[x.k]; if (c) { startRagdoll(c, x.v[0], x.v[1], x.v[2], 2.6); Snd.scream(1.4 + Math.random() * .4); say(c, TR(pick(N_(['Aua!', 'Das sag ich meiner Mama!', 'Warum?', 'Mein Rücken!', 'Hey, mein Gesicht!']))), 1.5, 2.2); } break; }
    case 'banana': addBanana(x.id, x.p); break;
    case 'rmB': rmBanana(x.id); break;
  }
}
function hostEvent(e) {
  switch (e.t) {
    case 'wsay': { const c = wanCh[e.k]; if (c) say(c, e.m ? TR(e.m) : e.txt, WAND[e.k].role === 'janitor' ? .7 : 1.4, 3); break; }
    case 'say': { const c = tchCh[e.w]; if (c) say(c, e.m ? TR(e.m, e.p) : e.txt, TEACH[e.w].pitch, 3.2); break; }
    case 'toast': toast(e.m ? TR(e.m, e.p) : e.txt, e.k || 'info', 4500); break;
    case 'ding': Snd.ding(); break;
    case 'bell': Snd.bell(); break;
    case 'pop': Snd.pop(); flash('white', .25); break;
    case 'trg': { const c = tchCh[e.w]; if (c) { startRagdoll(c, e.v[0], e.v[1], e.v[2], 3); Snd.boing(); Snd.whistleDown(); } break; }
    case 'check': onCheck(e.li); break;
    case 'test': onTest(e.li); break;
    case 'sa': onSA(e.li); break;
    case 'tafel': if (e.p === Net.me) setTimeout(() => startTafel(), 1200); break;
    case 'alarm': onAlarm(e.p); break;
    case 'day': break;
  }
}
function onCheck(li) {
  if (ME.day !== G.day) return;
  if (inLessonRoom()) evalCheck(li, false); else if (myRoom().type !== 'toilet' || true) { ME.pendLate = li; toast(TR('Gerade ist Hausübungskontrolle, und du bist nicht da!'), 'bad'); }
}
function evalCheck(li, late) {
  if (ME.checked[li]) return; ME.checked[li] = true; ME.pendLate = -1;
  const L = plan()[li]; const P = PERS[TEACH[L.teacher >= 0 ? L.teacher : L.ti].pers];
  if (late) { if (useItem('ausrede')) toast(TR('Zu spät, aber du hast eine gefälschte Entschuldigung. Passt.'), 'good'); else { addPts(-15, TR('zu spät')); act('late'); ME.sus = Math.min(95, ME.sus + 20); } }
  if (!needHW(li)) { toast(TR('In {s} hattest du heute keine HÜ auf. Glück gehabt!', { s: L.s }), 'good'); return; }
  if (L.group) {
    const [q, who] = bestOf(li);
    if (q >= 0) { addPts(ptsFor(q), TR('Gruppenarbeit ({g})', { g: GRADE(q)[1] })); if (who !== ME.name) toast(TR('{n} hat die ganze Gruppenarbeit allein gemacht. Die Punkte kriegst du trotzdem.', { n: who }), 'info', 4500); return; }
  } else if (ME.hw[li] >= 0) {
    const q = ME.hw[li];
    if (ME.hf[li] && Math.random() < P.fake) { addPts(-20, TR('Erfundene Antworten aufgeflogen')); toast(TR('„Was soll ‚Die Antwort ist Käse‘ bitte heißen?“ Nicht genügend.'), 'bad', 4500); return; }
    addPts(ptsFor(q), ME.hf[li] ? TR('HÜ in {s}: {g} (erfunden, hat aber keiner gemerkt)', { s: L.s, g: GRADE(q)[1] }) : TR('HÜ in {s}: {g}', { s: L.s, g: GRADE(q)[1] })); return;
  }
  // no homework
  if (useItem('ausrede')) { toast(TR('Keine HÜ, aber die gefälschte Entschuldigung zieht!'), 'good'); return; }
  if (Math.random() < .5) { toast(TR('Keine Hausübung? Dann komm an die Tafel!'), 'bad'); setTimeout(() => startTafel(), 1500); }
  else { ME.nach = li; toast(TR('Keine HÜ! Gib sie bis zum Stundenende ab, sonst gibt es Minuspunkte.'), 'bad', 4500); }
}
function onTest(li) {
  if (ME.day !== G.day) return;
  if (!inLessonRoom()) { toast(myRoom().type === 'toilet' ? TR('Du warst am Klo und hast den Test verpasst. Perfektes Timing.') : TR('Du hast den Test verpasst. Wo steckst du eigentlich?'), myRoom().type === 'toilet' ? 'good' : 'bad'); return; }
  ME.seat = ME.seat; if (useItem('loesung')) { addPts(100, TR('Test: Sehr gut (dank Testlösungen)')); return; }
  startMG({ kind: 'quiz', title: TR('Test in {s}', { s: plan()[li].s }), sub: TR('Natürlich unangekündigt.'), forced: true, test: true, diff: .4 + .25 * (G.day - 1), done: (q, fake) => { const pts = Math.round(90 * q) - (q < .45 ? 25 : 0); addPts(pts, TR('Test: {g}', { g: GRADE(q)[1] })); } });
}
function onSA(li) {
  if (ME.day !== G.day) return; const L = plan()[li];
  if (!inLessonRoom()) { if (useItem('ausrede')) { toast(TR('Schularbeit verpasst, aber du bist entschuldigt. Nachschreiben musst du irgendwann. Vielleicht.'), 'good', 4500); return; } addPts(-60, TR('Schularbeit verpasst: Nicht genügend')); return; }
  if (useItem('loesung')) { addPts(200, TR('Schularbeit in {s}: Sehr gut (mit geklauten Lösungen)', { s: L.s })); return; }
  startMG({ kind: 'exam', title: TR('📝 Schularbeit in {s}', { s: L.s }), sub: TR('Schummeln geht. Erwischt werden solltest du halt nicht.'), forced: true, test: true, exam: true, diff: .5 + .25 * (G.day - 1),
    done: (q, fake) => { const [g, gn] = GRADE(q); const pts = Math.round(200 * q) - (q < .45 ? 60 : 0); addPts(pts, TR('Schularbeit: {g} ({n})', { g, n: gn })); if (g === 1) Snd.fanfare(); } });
}
function onAlarm(p) {
  Snd.alarm(); flash('red', .5); let n = 0; const iv = setInterval(() => { flash('red', .3); if (++n > 6) clearInterval(iv); }, 500);
  if (MG.open && MG.test) { closeMG(true); toast(TR('Test abgebrochen. Danke, Feueralarm!'), 'good'); }
  if (!meCh.rg) setPose('panic', 4);
  npcCh.forEach(c => { if (c.y > -10 && Math.random() < .6) startRagdoll(c, rnd(-4, 4), 5, rnd(-4, 4), 3); });
  if (p && p !== Net.me) toast(TR('{n} hat den Feueralarm ausgelöst!', { n: peerName(p) }), 'info');
}
function startTafel() { if (G.ph !== 'lesson' && G.ph !== 'break') return; if (MG.open) closeMG(true); startMG({ kind: 'math', title: TR('An der Tafel'), sub: TR('Die ganze Klasse schaut dir zu.'), forced: true, board: true, diff: .8 + .25 * (G.day - 1), done: (q) => { if (q >= .5) { addPts(25, TR('an der Tafel geschafft')); } else { addPts(-25, TR('an der Tafel blamiert')); Snd.laugh(); } } }); }

// ---------------- homework ----------------
function openHW(li) {
  if (!hwOpen(li)) { toast(TR('Für diese HÜ ist es schon zu spät.'), 'info'); return; }
  if (MG.open) return; if (meCh.rg) return;
  const L = plan()[li]; const stressN = stressFor(li);
  const others_ = bestOf(li); const phoneOK = others_[0] > 0 && others_[1] !== ME.name;
  startMG({
    kind: SUBJ[L.s].mg, title: `${SUBJ[L.s].icon} ` + TR('Hausübung in {s}', { s: L.s }), sub: TR('für die {n}. Stunde', { n: li + 1 }) + (L.group ? ' · ' + TR('Gruppenarbeit') : ''), li,
    diff: .3 * (G.day - 1) + stressN - (ME.energyT > 0 ? .3 : 0), stress: stressN, phone: phoneOK ? others_ : null,
    done: (q, fake) => {
      q = clamp(q + (fake ? 0 : ME.bonus), 0, 1); if (!fake && ME.bonus) { toast(TR('Spickzettel oder Taschenrechner benutzt!'), 'info'); ME.bonus = 0; }
      if (q > ME.hw[li] || fake) { ME.hw[li] = q; ME.hf[li] = fake ? 1 : 0; }
      const [g, gn] = GRADE(q); toast(fake ? TR('HÜ in {s} fertig: {g} ({n}), alles frei erfunden', { s: L.s, g, n: gn }) : TR('HÜ in {s} fertig: {g} ({n})', { s: L.s, g, n: gn }), q >= .6 ? 'good' : 'info');
      if (ME.nach === li && G.ph === 'lesson' && G.li === li) { ME.nach = -1; addPts(Math.round(ptsFor(q) / 2), TR('nachgereicht')); }
    }
  });
}
function stressFor(li) { if (G.ph === 'lesson' && G.li === li) return 1; if (G.ph === 'break' && G.li === li) return .5; if (G.ph === 'lesson' && G.li + 1 === li) return .35; return 0; }

// ---------------- NPC classmates ----------------
let npcKey = '';
function npcSeats() {
  const L = curL(); if (!L || !['break', 'lesson'].includes(G.ph)) return [];
  const ri = lessonRoomIdx(L, gEl(performance.now())); const n = clamp(8 - G.np, 2, 6); const r = mulberry(G.seed + G.day * 13 + G.li);
  const idx = [...Array(9).keys()].sort(() => r() - .5).slice(0, n); return idx.map(k => ri + ':' + k);
}
function updateNPC(dt, t) {
  const seats = npcSeats(); const key = seats.join(',');
  if (key !== npcKey) { npcKey = key; npcCh.forEach((c, i) => { const s = seats[i]; if (!s) { c.y = -50; c.x = 0; c.z = 0; c.rg = null; return; } const [ri, k] = s.split(':').map(Number); const S = SEATS[ri][k]; Object.assign(c, { x: S.x, y: S.y, z: S.z, ry: S.ry, pose: 'sit', rg: null, home: S }); }); }
  npcCh.forEach((c, i) => {
    if (c.y < -10) { c.g.visible = c.shadow.visible = false; c.tag.visible = false; return; } c.g.visible = c.shadow.visible = true; c.tag.visible = false;
    if (c.home && !c.rg) { c.x = c.home.x; c.z = c.home.z; c.y = c.home.y; }
    if (Math.random() < dt * .08) c.pose = pick(['sit', 'sit', 'write', 'nap']);
    renderChar(c, t, dt);
  });
}

// ---------------- remote players / teachers rendering ----------------
// dead reckoning: estimate velocity from successive network samples, extrapolate up to 0.2 s
function predict(st, x, y, z, key) {
  const now = performance.now();
  if (st.pk !== key) { if (st.pt) { const d = Math.max(.03, (now - st.pt) / 1000); st.v = [(x - st.p[0]) / d, (y - st.p[1]) / d, (z - st.p[2]) / d]; if (Math.hypot(st.v[0], st.v[2]) > 12) st.v = [0, 0, 0]; } st.pk = key; st.pt = now; st.p = [x, y, z]; }
  const e = Math.min(.2, (now - (st.pt || now)) / 1000); const v = st.v || [0, 0, 0];
  return [x + v[0] * e, y + v[1] * e * .5, z + v[2] * e];
}
function updateRemote(dt, t) {
  const seen = new Set();
  others().forEach(p => {
    const q = p.presence; if (!q.n) return; seen.add(p.peer);
    let r = remote.get(p.peer);
    if (!r || r.col !== q.c || r.name !== q.n) { if (r) removeChar(r.ch); const ch = makeChar({ col: new THREE.Color(q.c || '#888').getHex(), name: q.n }); ch.x = q.x; ch.y = q.y; ch.z = q.z; r = { ch, col: q.c, name: q.n, rgc: q.rgc || 0 }; remote.set(p.peer, r); }
    const ch = r.ch; const k = 1 - Math.exp(-12 * dt);
    if ((q.rgc || 0) !== r.rgc) { r.rgc = q.rgc || 0; const v = q.rv || [0, 5, 0, 2]; startRagdoll(ch, v[0], v[1], v[2], v[3] || 2.4); }
    const pr = predict(r, q.x, q.y, q.z, q);
    const pd = Math.hypot(pr[0] - ch.x, pr[2] - ch.z); if (pd > 6) { ch.x = q.x; ch.z = q.z; ch.y = q.y; }
    ch.x = lerp(ch.x, pr[0], k); ch.y = lerp(ch.y, pr[1], k); ch.z = lerp(ch.z, pr[2], k); ch.ry = lerpAng(ch.ry, q.ry, k);
    ch.pose = q.po || 'idle'; ch.spd = q.sp || 0; ch.ph += dt * ch.spd * 2.4;
    setLabel(ch.tag, q.n + (q.tag ? ' 🐀' + TR('PETZE') : ''));
    ch.g.visible = ch.shadow.visible = true;
    renderChar(ch, t, dt);
  });
  remote.forEach((r, k) => { if (!seen.has(k)) { removeChar(r.ch); remote.delete(k); } });
}
function updateWanderers(dt, t) {
  (G.W || []).forEach((a, i) => {
    const v = WV[i], c = wanCh[i]; if (!c) return;
    if (!v.init || Math.hypot(a[0] - v.x, a[2] - v.z) > 5) { Object.assign(v, { x: a[0], y: a[1], z: a[2], ry: a[3], init: true }); }
    const k = 1 - Math.exp(-8 * dt); const mv = Math.hypot(a[0] - v.x, a[2] - v.z); v.x = lerp(v.x, a[0], k); v.y = lerp(v.y, a[1], k); v.z = lerp(v.z, a[2], k); v.ry = lerpAng(v.ry, a[3], k);
    if (!c.rg) { c.x = v.x; c.y = v.y; c.z = v.z; c.ry = v.ry; }
    c.spd = a[4] === 'w' ? 2.4 : 0; c.ph += dt * c.spd * 2.4;
    c.pose = { d: 'panic', r: 'raise', p: 'phone' }[a[4]] || 'idle';
    c.tag.visible = Math.hypot(c.x - ME.x, c.z - ME.z) < 9;
    renderChar(c, t, dt);
  });
}
function updateTeachers(dt, t) {
  (G.T || []).forEach((a, i) => {
    const v = TV[i], c = tchCh[i]; if (!c) return;
    if (!v.init || Math.hypot(a[0] - v.x, a[2] - v.z) > 5) { v.x = a[0]; v.y = a[1]; v.z = a[2]; v.ry = a[3]; v.init = true; }
    const pr = isHost() ? a : predict(v, a[0], a[1], a[2], a); const k = 1 - Math.exp(-12 * dt); v.x = lerp(v.x, pr[0], k); v.y = lerp(v.y, pr[1], k); v.z = lerp(v.z, pr[2], k); v.ry = lerpAng(v.ry, a[3], k);
    const moving = Math.hypot(a[0] - v.x, a[2] - v.z) > .05 || a[4] === 'w'; v.st = a[4]; v.rg = a[5];
    if (!c.rg) { c.x = v.x; c.y = v.y; c.z = v.z; c.ry = v.ry; }
    c.spd = moving ? PERS[TEACH[i].pers].spd * 1.3 : 0; c.ph += dt * c.spd * 2.2;
    c.pose = a[4] === 'n' ? 'nap' : a[4] === 'b' ? 'raise' : a[4] === 'c' ? 'coffee' : a[4] === 'x' ? 'point' : 'idle';
    if (c.rg && !v.rg && c.rg.t > 1.2) { c.rg = null; c.blend = 1; }
    renderChar(c, t, dt);
  });
}

// ---------------- local movement & camera ----------------
function updateMe(dt, t) {
  if (ME.energyT > 0) ME.energyT -= dt;
  if (ME.cheatT > 0) ME.cheatT -= dt;
  if (ME.tagT > 0) ME.tagT -= dt;
  if (ME.poseT > 0) { ME.poseT -= dt; if (ME.poseT <= 0) ME.pose = 'idle'; }
  let mx = 0, mz = 0; const busy = MG.open || meCh.rg || G.ph === 'detention' || introOn();
  if (!busy) { if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) mx += 1; if (keys.has('KeyD') || keys.has('ArrowRight')) mx -= 1; }
  if (busy || ME.seat) { jumpBuffer = 0; coyoteTime = 0; }
  if ((mx || mz) && ME.seat) { ME.seat = null; Snd.squeak(); }
  if (ME.copy && (mx || mz)) { ME.copy = null; toast(TR('Abschreiben abgebrochen.'), 'info'); }
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  let speed = (sprint ? 8.5 : 5.0) * (ME.energyT > 0 ? 1.6 : 1);
  if (meCh.rg) {
    ME.vx = ME.vz = ME.vy = 0; const pv = meCh.rg.p[2]; ME.x = pv.x; ME.z = pv.z; ME.y = Math.max(groundAt(pv.x, pv.z, pv.y + .5), 0); ME.spd = 0;
    if (meCh.rg.t > meCh.rg.dur - .05) { const g = groundAt(ME.x, ME.z, pv.y + .6); ME.y = g; }
  } else if (ME.seat) { ME.vx = ME.vz = ME.vy = 0; ME.x = ME.seat.x; ME.z = ME.seat.z; ME.y = ME.seat.y; ME.ry = ME.seat.ry; ME.spd = 0; }
  else {
    // Small physics steps keep boosted sprint from crossing thin walls and
    // keep ramp grounding/jump arcs consistent at low render frame rates.
    const steps = Math.max(1, Math.ceil(dt * 120)), stepDt = dt / steps;
    for (let step = 0; step < steps; step++) {
      const dt = stepDt;
      let tvx = 0, tvz = 0;
      if (mx || mz) { const l = Math.hypot(mx, mz); const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const rx = -fz, rz = fx; tvx = (fx * mz - rx * mx) / l * speed; tvz = (fz * mz - rz * mx) / l * speed; }
      const onGround = ME.vy <= 0 && ME.y <= groundAt(ME.x, ME.z, ME.y) + .02;
      if (onGround && !busy) coyoteTime = .10;
      const acc = (mx || mz) ? (onGround ? 32 : 24) : 48;
      ME.vx = lerp(ME.vx || 0, tvx, 1 - Math.exp(-acc * dt)); ME.vz = lerp(ME.vz || 0, tvz, 1 - Math.exp(-acc * dt));
      const vx = ME.vx, vz = ME.vz;
      const nx = ME.x + vx * dt, nz = ME.z + vz * dt; const [cx, cz] = collide(ME.x, ME.z, nx, nz, .35, ME.y + .1);
      ME.spd = Math.hypot(cx - ME.x, cz - ME.z) / Math.max(dt, 1e-3); if (cx !== nx) ME.vx *= .3; if (cz !== nz) ME.vz *= .3; ME.x = cx; ME.z = cz;
      if (Math.abs(ME.x) > 60 || Math.abs(ME.z) > 60) { ME.x = clamp(ME.x, -60, 60); ME.z = clamp(ME.z, -60, 60); }
      const g = groundAt(ME.x, ME.z, ME.y);
      if (jumpBuffer > 0 && (coyoteTime > 0 || (ME.vy <= 0 && ME.y <= g + .02)) && !busy) {
        ME.vy = 8.2; jumpBuffer = coyoteTime = 0; Snd.boing(); meCh.sq = .3;
      }
      const gravity = ME.vy > 0 ? 26 : 34;
      ME.y += ME.vy * dt - .5 * gravity * dt * dt; ME.vy -= gravity * dt;
      if (ME.y <= g) { if (ME.vy < -4) meCh.sq = -Math.min(.35, -ME.vy * .03); if (ME.vy < -14) { myRagdoll(0, 2, 0, 1.6); Snd.slap(); toast('Autsch.', 'info'); } ME.y = g; ME.vy = 0; }
      else if (ME.y - g < .25 && ME.vy <= 0 && g > ME.y - .7) { ME.y = g; ME.vy = 0; }
      jumpBuffer = Math.max(0, jumpBuffer - dt);
      coyoteTime = Math.max(0, coyoteTime - dt);
    }
  }
  if (!ME.seat && !meCh.rg && !busy) ME.ry = lerpAng(ME.ry, Math.atan2(-Math.sin(yaw), -Math.cos(yaw)), 1 - Math.exp(-30 * dt));
  if (ME.y < -5) { ME.x = -20; ME.z = 0; ME.y = 0; }
  if (ME.x < -22.9 && Math.abs(ME.z) < 1.5 && ME.y < 1 && (ME.soonT || 0) < t) { ME.soonT = t + 6; toast(TR('Der Schulhof ist wegen Bauarbeiten gesperrt.'), 'info'); Snd.huh(); }
  if (ME.x < -24.2) { ME.x = -22.5; ME.z = clamp(ME.z, -1.5, 1.5); } // falls man doch rausrutscht (Ragdoll)
  // copy progress
  if (ME.copy) {
    ME.copy.t -= dt; setPose(ME.copy.phone ? 'phone' : 'write', .3);
    if (ME.copy.t <= 0) { const c = ME.copy; ME.copy = null; if (hwOpen(c.li) && c.q > ME.hw[c.li]) { ME.hw[c.li] = c.q; ME.hf[c.li] = c.fake ? 1 : 0; } toast(TR('{s} abgeschrieben ({g}) und ein bisschen umformuliert.', { s: subjOf(c.li), g: GRADE(c.q)[1] }), 'good'); Snd.paper(); if (ME.nach === c.li && G.li === c.li) { ME.nach = -1; addPts(Math.round(ptsFor(c.q) / 2), TR('nachgereicht')); } }
  }
  meCh.x = ME.x; meCh.y = ME.y; meCh.z = ME.z; meCh.ry = ME.ry; meCh.spd = ME.spd; meCh.ph += dt * ME.spd * 2.4;
  meCh.pose = ME.pose !== 'idle' ? ME.pose : MG.open ? 'write' : ME.seat ? 'sit' : 'idle';
  if (ME.seat && (ME.pose === 'write' || ME.pose === 'phone')) meCh.pose = 'sit';
  if (ME.seat && MG.open) meCh.pose = 'sit';
  setLabel(meCh.tag, ME.tagT > 0 ? '🐀' + TR('PETZE') : '');
  renderChar(meCh, t, dt);
  if (meCh.pose === 'sit' && (MG.open || ME.copy)) { meCh.limbs[0].position.z += 0; }
  // late arrival & absence
  if (G.ph === 'lesson' && ME.day === G.day) {
    if (ME.pendLate === G.li && inLessonRoom()) evalCheck(G.li, true);
    const L = curL();
    if (L && L.teacher >= 0 && !inLessonRoom() && gEl(performance.now()) > 15) {
      ME.awayT += dt;
      if (ME.awayT > 50 && ME.awayWarn === 0) { ME.awayWarn = 1; act('away'); toast(TR('{n} fragt schon, wo du bist.', { n: TEACH[L.teacher].name }), 'bad'); }
      if (ME.awayT > 100 && ME.awayWarn === 1) { ME.awayWarn = 2; if (!useItem('ausrede')) addPts(-30, TR('geschwänzt')); }
    } else if (inLessonRoom()) { ME.awayT = Math.max(0, ME.awayT - dt * 2); if (ME.awayT < 20) ME.awayWarn = 0; }
  }
}
// ---------- playability helpers: teacher vision cones + waypoint to the classroom ----------
const cones = [];
function updateCones(t) {
  TEACH.forEach((T_, i) => {
    let c = cones[i];
    if (!c) { const P = PERS[T_.pers]; const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24, -Math.PI / 2 - P.fov / 2, P.fov), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; g.add(m); scene.add(g); c = cones[i] = { g, m }; }
    const v = TV[i], ch = tchCh[i]; const P = PERS[T_.pers];
    const show = v.init && !v.rg && 'fsxpwc'.includes(v.st) && Math.abs(v.y - ME.y) < 1.8 && roomAt(v.x, v.z, v.y).name === myRoom().name && G.ph !== 'detention';
    c.g.visible = show; if (!show) return;
    const view = P.view * (1 + .07 * (G.day - 1)); c.g.position.set(ch.J[2].x, v.y + .04, ch.J[2].z); c.g.rotation.y = v.ry; c.m.scale.set(view, view, 1);
    const [s_] = bestWatcher(); c.m.material.opacity = (s_ > 0 && activity() > 0 ? .32 : .16) + Math.sin(t * 6) * .03;
    c.m.material.color.setHex(v.st === 'c' ? 0xffa53b : 0xff3b2f);
  });
}
const wpArrow = (() => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(.45, .9, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f })); c.rotation.x = Math.PI; g.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .07, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffd23f })); r.rotation.x = Math.PI / 2; r.position.y = -1.6; g.add(r); g.visible = false; scene.add(g); return g; })();
let WP = null;
function updateWaypoint(t) {
  WP = null;
  const L = curL(); if (!L || !['break', 'lesson'].includes(G.ph) || G.ph === 'detention') { wpArrow.visible = false; return; }
  const ri = lessonRoomIdx(L, gEl(performance.now())); const R = ROOMS[ri]; if (!R || inLessonRoom()) { wpArrow.visible = false; return; }
  const myF = floorOf(ME.y + .2); let tgt, label = `${TR(R.name)} (${R.f ? TR('OG') : TR('EG')})`;
  if (myF !== R.f) {
    const inStairs = ME.x > 12 && ME.z < -2.5;
    if (!inStairs) tgt = { x: 18, y: myF * FH, z: -2.2 }; else tgt = myF === 0 ? { x: 13.4, y: 0, z: -9.5 } : { x: 21.5, y: FH, z: -9.5 };
    label = `${TR('Stiege')} → ${label}`;
  } else tgt = { x: R.doorX, y: R.y, z: R.side * 3.6 };
  WP = { ...tgt, label, d: Math.hypot(tgt.x - ME.x, tgt.z - ME.z) };
  wpArrow.visible = true; wpArrow.position.set(tgt.x, tgt.y + 2.6 + Math.sin(t * 4) * .2, tgt.z); wpArrow.rotation.y = t * 2;
}
const ray = new THREE.Raycaster(); const camTarget = new THREE.Vector3(); let camD = 3.6, eyeY = null;
const lookDir = new THREE.Vector3();
function updateCamera(dt) {
  lookDir.set(-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  if (meCh.rg) {
    // Beim Ragdoll kurz raus aus dem Kopf: man soll sich fliegen sehen.
    const head = meCh.rg.p[1]; camTarget.lerp(head, 1 - Math.exp(-6 * dt)); if (camTarget.distanceTo(head) > 6) camTarget.copy(head);
    const dir = new THREE.Vector3(Math.sin(yaw) * .9, .44, Math.cos(yaw) * .9).normalize();
    let d = camDist; ray.set(camTarget, dir); ray.far = camDist + .3; const hit = ray.intersectObjects(camBlockers, false)[0]; if (hit) d = Math.max(.6, hit.distance - .3);
    camD = d < camD ? d : lerp(camD, d, 1 - Math.exp(-8 * dt));
    camera.position.copy(camTarget).addScaledVector(dir, camD); camera.lookAt(camTarget); eyeY = null; return;
  }
  const bob = SET.bob ? Math.abs(Math.sin(meCh.ph)) * .07 * Math.min(1, ME.spd / 5) : 0;
  const target = ME.y + (ME.seat ? 1.92 : 1.95) * meCh.sz + bob + clamp(meCh.sq || 0, -.35, .35) * .35;
  eyeY = eyeY === null || Math.abs(eyeY - target) > 2 ? target : lerp(eyeY, target, 1 - Math.exp(-30 * dt));
  camera.position.set(ME.x, eyeY, ME.z);
  if (ME.energyT > 0) { camera.position.x += Math.sin(performance.now() / 40) * .02; }
  camTarget.copy(camera.position); camD = 0;
  camera.lookAt(_v2.copy(camera.position).add(lookDir));
  // leichtes Neigen beim Seitwärtslaufen
  const side = (ME.vx || 0) * Math.cos(yaw) - (ME.vz || 0) * Math.sin(yaw);
  ME.roll = lerp(ME.roll || 0, clamp(-side * .006, -.04, .04), 1 - Math.exp(-8 * dt)); camera.rotateZ(ME.roll);
}
// ---------- first person: Cartoon-Handschuhe als eigene Szene (clippen nie in Wände) ----------
const handScene = new THREE.Scene(), handCam = new THREE.PerspectiveCamera(62, 1, .01, 10);
handScene.add(new THREE.HemisphereLight(0xfff4ff, 0x7a5aa8, 1.05)); { const l = new THREE.DirectionalLight(0xfff0e0, .45); l.position.set(1, 2, 1.5); handScene.add(l); }
function makeGlove(sd) {
  // Runder Fäustling: ein Fingerblob statt einzelner Finger, kein Nähte-Gruseln.
  const g = new THREE.Group(), w = M(0xfff8f0), wd = M(0xf1e6f5);
  const palm = new THREE.Group(); g.add(palm);
  ball(0, 0, 0, .19, .14, .2, w, palm);
  const mit = ball(0, -.005, -.13, .19, .13, .17, w, palm); mit.rotation.x = .25;
  ball(.002 * sd, -.035, -.2, .17, .1, .09, w, palm); // eingerollte Fingerspitzen
  const th = ball(-.105 * sd, .01, -.06, .08, .075, .11, w, palm); th.rotation.y = .5 * sd;
  const cuff = new THREE.Mesh(TOR, wd); cuff.scale.set(.27, .27, .55); cuff.position.z = .12; palm.add(cuff);
  ball(0, 0, .13, .21, .17, .08, wd, palm);
  const sleeve = new THREE.Mesh(CYL, M(new THREE.Color(ME.color).getHex())); sleeve.rotation.x = Math.PI / 2; sleeve.scale.set(.18, .36, .18); sleeve.position.z = .32; palm.add(sleeve);
  g.scale.setScalar(.6); handScene.add(g); g.userData = { sd, palm, sleeve, p: new THREE.Vector3(), r: new THREE.Euler() }; return g;
}
let hands = null, phone = null;
function initHands() {
  if (hands) hands.forEach(h => handScene.remove(h));
  hands = [makeGlove(1), makeGlove(-1)];
  phone = new THREE.Group(); box(0, 0, 0, .12, .22, .02, 0x1f1a33, phone); const scr = new THREE.Mesh(new THREE.PlaneGeometry(.1, .18), new THREE.MeshBasicMaterial({ color: 0x8af0ff })); scr.position.z = .012; phone.add(scr);
  handScene.add(phone); phone.visible = false;
}
const _hp = new THREE.Vector3();
function updateHands(dt, t) {
  if (!hands) initHands();
  const pose = meCh.pose, k = Math.min(1, ME.spd / 5), ph = meCh.ph;
  ME.lyaw = ME.lyaw ?? yaw; ME.lpitch = ME.lpitch ?? pitch;
  const dy = angDiff(ME.lyaw, yaw), dp = pitch - ME.lpitch; ME.lyaw = yaw; ME.lpitch = pitch;
  ME.sway = ME.sway || { x: 0, y: 0 }; ME.sway.x = lerp(ME.sway.x + dy * .6, 0, 1 - Math.exp(-10 * dt)); ME.sway.y = lerp(ME.sway.y - dp * .6, 0, 1 - Math.exp(-10 * dt));
  if (ME.throwT > 0) ME.throwT -= dt;
  hands.forEach((h, i) => {
    const sd = h.userData.sd, swing = Math.sin(ph + i * Math.PI);
    let x = .28 * sd, y = -.31 - (1 + Math.cos(ph * 2)) * .008 * k + Math.sin(t * 2) * .005, z = -.6 + swing * .04 * k, rx = .45, ry = -.18 * sd, rz = .15 * sd;
    if (ME.seat) { y -= .04; z -= .03; }
    if (pose === 'write') { x = .14 * sd; y = -.36; z = -.5; rx = .9; ry = 0; if (i === 0) { x += Math.sin(t * 7) * .009; z += Math.cos(t * 5) * .006; } }
    if (pose === 'phone' && i === 1) { x = -.1; y = -.24; z = -.5; rx = .7; ry = .1; rz = 0; }
    if (pose === 'raise' && i === 0) { if (ME.throwT > 0) { const q = 1 - ME.throwT / .35; x = .26; y = -.05 + Math.sin(q * Math.PI) * .1; z = -.4 - q * .45; rx = -.4 + q * .8; } else { x = .3; y = .12 + Math.sin(t * 3.5) * .03; z = -.55; rx = -.9; rz = Math.sin(t * 3.5) * .25; } }
    if (pose === 'point' && i === 0) { const q = clamp(ME.poseT / .5, 0, 1); x = .16; y = -.2; z = -.62 - Math.sin(q * Math.PI) * .32; rx = .05; ry = 0; }
    if (pose === 'panic') { x = .28 * sd; y = .02 + Math.sin(t * 6 + i * 3) * .08; z = -.5; rx = -.8; rz = Math.sin(t * 6 + i) * .22; }
    if (ME.vy) y -= clamp(ME.vy * .008, -.06, .06);
    x += ME.sway.x * .5; y += ME.sway.y * .5;
    const u = h.userData, f = 1 - Math.exp(-11 * dt);
    // Analytic critically damped spring: stable at any frame rate, with retained momentum.
    if (!u.velocity) { u.velocity = new THREE.Vector3(); u.p.set(x, y, z); u.r.set(rx, ry, rz); }
    _hp.set(x, y, z);
    const step = Math.min(dt, .1), omega = 15, decay = Math.exp(-omega * step);
    for (const axis of ['x', 'y', 'z']) {
      const offset = u.p[axis] - _hp[axis], impulse = u.velocity[axis] + omega * offset;
      u.p[axis] = _hp[axis] + (offset + impulse * step) * decay;
      u.velocity[axis] = (u.velocity[axis] - omega * impulse * step) * decay;
    }
    u.r.set(lerp(u.r.x, rx, f), lerp(u.r.y, ry, f), lerp(u.r.z, rz, f));
    h.position.copy(u.p); h.rotation.copy(u.r);
  });
  phone.visible = pose === 'phone'; if (phone.visible) { phone.position.copy(hands[1].position).add(_hp.set(.02, .1, -.04)); phone.rotation.set(-.12, .12, 0); }
}
function renderHands() {
  const show = started && G.ph !== 'lobby' && G.ph !== 'detention' && !meCh.rg;
  if (!show || !hands) return;
  if (handCam.aspect !== camera.aspect) { handCam.aspect = camera.aspect; handCam.updateProjectionMatrix(); }
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(handScene, handCam); renderer.autoClear = true;
}
