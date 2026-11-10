// ---------------- day plan ----------------
const NL = 4; // lessons per day
function genDay(seed, day) {
  const r = mulberry(seed * 31 + day * 977); const subjects = Object.keys(SUBJ); const used = new Set(); const out = [];
  for (let i = 0; i < NL; i++) {
    let s; do { s = subjects[Math.floor(r() * subjects.length)]; } while (used.has(s)); used.add(s);
    const ti = TEACH.findIndex(t => t.subj && t.subj.includes(s));
    const room = CLASSROOMS[Math.floor(r() * CLASSROOMS.length)];
    const L = { i, s, ti, room: room.i, real: room.i, ev: null, group: r() < .22, test: false, forget: false };
    if (i > 0 && r() < .28 + day * .08) L.ev = ['supplier', 'absent', 'test', 'director', 'wrongroom', 'alarm', 'director', 'test'][Math.floor(r() * 8)];
    if (L.ev === 'test' || r() < .1 + day * .04) L.test = true;
    if (L.ev === 'wrongroom') { let o; do { o = CLASSROOMS[Math.floor(r() * CLASSROOMS.length)]; } while (o.i === room.i); L.real = o.i; }
    // Schularbeit: every G.saEvery days the 3rd lesson is an announced exam (cheating allowed, if you dare)
    if (G.saEvery > 0 && day % G.saEvery === 0 && i === 2) { L.sa = true; L.test = false; L.group = false; if (L.ev !== 'director') L.ev = null; L.real = L.room; }
    L.teacher = L.ev === 'supplier' ? SUP : L.ev === 'absent' ? -1 : ti;
    L.forget = r() < PERS[TEACH[L.teacher < 0 ? ti : L.teacher].pers].forget;
    out.push(L);
  }
  return out;
}
let PLAN = []; let planKey = '';
function plan() { const k = G.seed + ':' + G.day + ':' + G.saEvery; if (k !== planKey) { planKey = k; PLAN = genDay(G.seed, G.day); } return PLAN; }
function needHW(li, name = ME.name) { const L = plan()[li]; if (!L) return false; return L.group || (hashStr(G.seed + ':' + G.day + ':' + name + ':' + li) % 100) < 82; }
function lessonRoomIdx(L, el) { if (!L) return -1; if (L.ev === 'wrongroom') return (G.ph === 'lesson' && G.li === L.i && el >= 6) || (G.li > L.i) ? L.real : L.room; return L.room; }

// ---------------- wandering NPCs ----------------
const WAND = [
  { n: 'Streber Günther', col: 0xf2f2f2, hair: 0x1a1a1a, role: 'streber', hat: 0 },
  { n: 'Hausmeister Kurt', col: 0x55657f, hair: 0x777777, role: 'janitor', sz: 1.15, teacher: true },
  { n: 'Dennis', col: 0xff7a00, hair: 0xf5d76e, hat: 2 }, { n: 'Jacqueline', col: 0xff6fb5, hair: 0x6b3a1a, hat: 1 },
  { n: 'Kevin-Pascal', col: 0x2fbf71, hair: 0x111111, hat: 3 }, { n: 'Schorsch', col: 0x8d5a2b, hair: 0xd35400, hat: 4 },
  { n: 'Lisa-Marie', col: 0x9b59b6, hair: 0xf5d76e, hat: 1 }, { n: 'Ömer', col: 0x18b5b5, hair: 0x111111, hat: 2 },
];
const WSAY = N_({
  any: ['Hat wer die Mathe-HÜ?', 'Ich hab so einen Hunger.', 'Wer hat meinen Turnbeutel?', 'Brrrm brrrm.', 'Moment, morgen ist Test?', 'Ich bin eigentlich in der 4C.', 'Der Hausmeister ist irgendwie komisch, oder?', 'Ich hab seit drei Tagen nicht geschlafen.', 'Wo ist das Klo?', 'Hehe.', 'Psst, ich schwänz grad.'],
  streber: ['Ich hab die Hausübung zweimal gemacht.', 'Ich seh alles.', 'Herr Professor, Sie haben die HÜ noch nicht kontrolliert!', 'Schummeln ist unfair.'],
  janitor: ['Wer hat da schon wieder hingespuckt?', 'Nicht auf den nassen Boden!', 'Ich putz das sicher nicht nochmal.', 'Früher war hier alles besser.'],
});

const Net = { room: null, me: 'local', solo: true, peers: [], connected: false };
const G = { saEvery: 3, ph: 'lobby', day: 1, seed: 1, li: 0, rem: 0, dur: 180, el: 0, goal: 0, tp: 0, ev: [], es: 0, T: [], run: 0, res: null, np: 1, alarms: 0 };
let gRecv = 0, lastHost = null, lastSeenG = null;
async function netJoin(code) {
  try {
    if (window.claude && typeof claude.use === 'function') {
      const lobby = await Promise.race([claude.use('room'), new Promise(r => setTimeout(() => r(null), 7000))]);
      if (lobby) {
        const room = await lobby.join('swyf-' + code.toLowerCase().replace(/[^a-z0-9]/g, ''));
        Net.room = room; Net.solo = false; Net.me = null;
        room.onPeers(ch => { Net.peers = ch.peers; const m = ch.peers.find(p => p.sameTab); if (m) Net.me = m.peer; });
        room.onConnection(c => { Net.connected = c; });
        return true;
      }
    }
  } catch (e) { console.warn('room unavailable', e); }
  Net.solo = true; Net.me = 'local'; return false;
}
function others() { if (Net.solo) return []; return Net.peers.filter(p => !p.sameTab && p.kind === 'viewer' && p.presence && p.presence.v === 1); }
function allPlayers() { return [{ peer: Net.me, presence: myP, isMe: true }, ...others()]; }
function hostId() { if (Net.solo) return Net.me; if (!Net.me) return undefined; return [Net.me, ...others().map(p => p.peer)].sort()[0]; }
const isHost = () => hostId() === Net.me;
let myP = { v: 1, a: [] }; let aSeq = 0;
function act(t, d = {}) { myP.a = [...(myP.a || []).slice(-7), Object.assign({ s: ++aSeq, t }, d)]; }
let lastSend = 0;
function sendPresence(now) {
  if (Net.solo || !Net.room) return; if (now - lastSend < 66) return; lastSend = now;
  Net.room.presence(myP).catch(e => { if (!sendPresence.warned) { console.warn(e); sendPresence.warned = 1; } });
}
function syncG(now) {
  const hid = hostId();
  if (hid === Net.me) { if (lastHost !== Net.me && lastSeenG) { Object.assign(G, JSON.parse(JSON.stringify(lastSeenG))); hostAdopt(); } lastHost = Net.me; myP.g = G; return; }
  delete myP.g;
  const hp = others().find(p => p.peer === hid); const g = hp && hp.presence.g;
  if (g && g !== syncG.lastObj) { syncG.lastObj = g; Object.assign(G, g); gRecv = now; lastSeenG = g; }
  lastHost = hid;
}
function gRem(now) { return isHost() ? G.rem : G.rem - (now - gRecv) / 1000; }
function gEl(now) { return isHost() ? G.el : G.el + (now - gRecv) / 1000; }

// ---------------- host simulation ----------------
const H = { wan: [], tch: [], checkDone: -1, testDone: -1, revealDone: -1, startDone: -1, qcd: 0, caught: 0, repeated: false, bananas: [], lastSeen: {}, patrolT: 0 };
function hostInitTeachers() {
  H.tch = TEACH.map((t, i) => { const sp = i === DIR ? { x: roomByName('Direktion').cx, z: -7, y: FH } : STAFFSPOTS[i % STAFFSPOTS.length]; return { i, x: sp.x, y: sp.y, z: sp.z, ry: 0, st: 'c', path: [], tmr: rnd(2, 5), after: 'c', afterRy: null, rg: 0, goal: '', spd: PERS[t.pers].spd }; });
}
function hostWanderTick(dt) {
  if (!H.wan.length) H.wan = WAND.map((w, k) => ({ k, x: rnd(-20, 20), y: k % 2 ? FH : 0, z: rnd(-1.5, 1.5), ry: 0, path: [], tmr: rnd(1, 4), st: 'i', spd: w.role === 'janitor' ? 1.3 : rnd(1.8, 2.8) }));
  H.wan.forEach(w => {
    if (w.path.length) {
      const p = w.path[0]; const dx = p.x - w.x, dy = p.y - w.y, dz = p.z - w.z; const d = Math.hypot(dx, dy, dz); const sp = w.spd * dt;
      if (d < sp + .02) { w.x = p.x; w.y = p.y; w.z = p.z; w.path.shift(); if (!w.path.length) { w.st = pick(['i', 'i', 'd', 'r', 'p']); w.tmr = rnd(2, 7); } }
      else { w.x += dx / d * sp; w.y += dy / d * sp; w.z += dz / d * sp; if (Math.hypot(dx, dz) > .05) w.ry = lerpAng(w.ry, Math.atan2(dx, dz), Math.min(1, dt * 10)); }
    } else {
      w.tmr -= dt; if (w.st === 'i') w.ry += Math.sin(performance.now() / 900 + w.k) * dt;
      if (w.tmr <= 0) {
        let dest; const f = Math.random() < .5 ? 0 : 1;
        if (Math.random() < .55) dest = { x: rnd(-22, 22), y: f * FH, z: rnd(-1.5, 1.5) };
        else { const opts = ROOMS.filter(r => ['toilet', 'library', 'buffet'].includes(r.type) || (r.type === 'class' && G.ph !== 'lesson')); const rm = pick(opts); dest = { x: rm.cx + rnd(-3.5, 3.5), y: rm.y, z: rm.side * rnd(4.5, 6.5) + (rm.type === 'class' ? 0 : 0) }; }
        w.path = route(w, dest); w.st = 'w';
      }
    }
    if (Math.random() < dt * .025) { const role = WAND[w.k].role; hev('wsay', { k: w.k, m: pick(role ? WSAY[role] : WSAY.any) }); }
  });
  G.W = H.wan.map(w => [+w.x.toFixed(1), +w.y.toFixed(1), +w.z.toFixed(1), +w.ry.toFixed(1), w.st]);
}
function hostAdopt() { if (!H.tch.length) hostInitTeachers(); if (G.W && G.W.length) H.wan = G.W.map((a, k) => ({ k, x: a[0], y: a[1], z: a[2], ry: a[3], path: [], tmr: 1, st: 'i', spd: rnd(1.8, 2.6) })); if (G.T && G.T.length) G.T.forEach((a, i) => { const t = H.tch[i]; if (t) { t.x = a[0]; t.y = a[1]; t.z = a[2]; t.ry = a[3]; t.path = []; t.zone = ''; } }); H.checkDone = H.testDone = H.revealDone = H.startDone = -1; if (G.ph === 'lesson') { H.checkDone = G.li; H.startDone = G.li; } }
function hev(t, d = {}) { G.es = (G.es || 0) + 1; G.ev = [...(G.ev || []).slice(-9), Object.assign({ s: G.es, t }, d)]; }
// Gesendet wird der deutsche Text als Schlüssel plus Platzhalter: jeder Client zeigt ihn in seiner Sprache an.
function hsay(w, key, o) { const m = Array.isArray(key) ? pick(key) : pick(SAY[key]); hev('say', o ? { w, m, p: o } : { w, m }); }
function htoast(m, k, p) { hev('toast', p ? { m, k, p } : { m, k }); }
function doorOut(r) { return [r.doorX, r.y, r.side * 1.3]; }
function doorIn(r) { return [r.doorX, r.y, r.side * 3.2]; }
function route(from, to) {
  const pts = []; const rf = roomAt(from.x, from.z, from.y), rt = roomAt(to.x, to.z, to.y);
  const same = rf.type !== 'hall' && rf.type !== 'out' && rf.i === rt.i;
  if (!same) {
    if (rf.type !== 'hall' && rf.type !== 'out') pts.push(doorIn(rf), doorOut(rf));
    if (rf.type === 'out') pts.push([-25.5, 0, 0], [-22, 0, 0]);
    if (rf.f !== rt.f) { const seq = rf.f === 0 ? ROUTE_STAIRS_UP : [...ROUTE_STAIRS_UP].reverse(); pts.push([18, rf.f * FH, -1.3]); pts.push(...seq); pts.push([18, rt.f * FH, -1.3]); }
    if (rt.type !== 'hall' && rt.type !== 'out') pts.push(doorOut(rt), doorIn(rt));
  }
  pts.push([to.x, to.y, to.z]);
  return pts.map(p => ({ x: p[0], y: p[1], z: p[2] }));
}
function goTo(t, dest, goal, after, afterRy, tmr = 4) {
  t.path = route(t, dest); t.st = 'w'; t.after = after; t.afterRy = afterRy; t.afterT = tmr;
}
function zoneTo(t, zone, dest, after, afterRy, tmr) { if (t.zone === zone) return; t.zone = zone; goTo(t, dest, zone, after, afterRy, tmr); }
function playersIn(ri) { return allPlayers().filter(p => { const q = p.presence; return q && q.n && roomAt(q.x, q.z, q.y).i === ri; }); }
function hostTeacherTick(dt) {
  const L = plan()[G.li]; const lesson = G.ph === 'lesson';
  const ri = lessonRoomIdx(L, G.el); const room = ROOMS[ri];
  H.patrolT -= dt;
  H.tch.forEach((t, i) => {
    if (t.rg > 0) { t.rg -= dt; if (t.rg <= 0) { t.zone = ''; } return; }
    const P = PERS[TEACH[i].pers];
    const isActive = L && L.teacher === i && (G.ph === 'lesson' || G.ph === 'break');
    const dirInClass = i === DIR && L && L.ev === 'director' && lesson;
    // high level goals
    if (G.ph === 'detention' || G.ph === 'dayEnd' || G.ph === 'lobby') { const sp = STAFFSPOTS[i % STAFFSPOTS.length]; zoneTo(t, 'staff', sp, 'c', sp.ry, 3); }
    else if (isActive && room) { const F = FRONT[ri]; zoneTo(t, 'class' + ri, { x: F.front.x, y: room.y, z: F.front.z }, 'f', F.ry, 3); }
    else if (dirInClass && room) { const F = FRONT[ri]; zoneTo(t, 'dclass' + ri, { x: F.back.x, y: room.y, z: F.back.z }, 's', F.ry + Math.PI, 99); }
    else if (i === DIR) {
      t.zone = 'patrol';
      if (H.patrolT <= 0 && !t.path.length) { H.patrolT = rnd(8, 16); const f = Math.random() < .5 ? 0 : 1; goTo(t, { x: rnd(-20, 20), y: f * FH, z: rnd(-1, 1) }, 'p', 's', null, 4); }
    } else { const sp = STAFFSPOTS[i % STAFFSPOTS.length]; zoneTo(t, 'staff', sp, 'c', sp.ry, rnd(3, 8)); }
    // movement
    if (t.path.length) {
      const p = t.path[0]; const dx = p.x - t.x, dy = p.y - t.y, dz = p.z - t.z; const d = Math.hypot(dx, dy, dz);
      const sp = (t.path.length > 2 ? Math.max(2.8, t.spd * 1.25) : t.spd * 1.25) * (1 + .08 * (G.day - 1)) * dt;
      if (d < sp + .02) { t.x = p.x; t.y = p.y; t.z = p.z; t.path.shift(); if (!t.path.length) { t.st = t.after; t.tmr = t.afterT; if (t.afterRy != null) t.ry = t.afterRy; } }
      else { t.x += dx / d * sp; t.y += dy / d * sp; t.z += dz / d * sp; if (Math.hypot(dx, dz) > .05) t.ry = lerpAng(t.ry, Math.atan2(dx, dz), Math.min(1, dt * 10)); }
      return;
    }
    t.tmr -= dt;
    if (t.st === 's') t.ry += Math.sin(performance.now() / 700 + i) * dt * 1.2;
    if (t.st === 'c' && Math.random() < dt * .08) hsay(i, 'coffee');
    if (t.tmr > 0) return;
    // behaviour choice
    if (isActive && lesson && room) {
      const F = FRONT[ri]; const r = Math.random(); const inRoom = playersIn(ri);
      if (H.checkDone !== G.li && !L.forget) { t.st = 'f'; t.ry = F.ry; t.tmr = 1; return; }
      if (P.tele && r < P.tele && inRoom.length) {
        const v = pick(inRoom).presence; const back = { x: v.x - Math.sin(v.ry) * 1.1, z: v.z - Math.cos(v.ry) * 1.1 };
        t.x = back.x; t.z = back.z; t.y = room.y; t.ry = v.ry; t.st = 'x'; t.tmr = 3; hev('pop', { w: i }); hsay(i, 'tele'); return;
      }
      if (L.sa && r < .55) { const a = pick(F.aisles); goTo(t, { x: a.x, y: room.y, z: a.z }, 'sa', 's', null, rnd(2, 3.5)); return; }
      if (r < P.nap) { goTo(t, { x: F.desk.x, y: room.y, z: F.desk.z }, 'nap' + Math.random(), 'n', F.ry, rnd(8, 15)); hsay(i, 'nap'); return; }
      if (r < P.nap + P.board) { goTo(t, { x: F.board.x + rnd(-1.5, 1.5), y: room.y, z: F.board.z }, 'board' + Math.random(), 'b', F.boardRy, rnd(4, 8)); if (Math.random() < .5) hsay(i, 'board'); return; }
      if (r < .62) { const a = pick(F.aisles); goTo(t, { x: a.x, y: room.y, z: a.z }, 'patrol' + Math.random(), 's', null, rnd(2, 3.5)); return; }
      goTo(t, { x: F.front.x + rnd(-1, 1), y: room.y, z: F.front.z }, 'front' + Math.random(), 'f', F.ry, rnd(3, 6));
    } else if (dirInClass) { t.st = 's'; t.tmr = 2; }
    else if (t.st === 'c' && Math.random() < .15 && i !== DIR) { t.st = 'n'; t.tmr = rnd(6, 12); }
    else { t.st = t.st === 'n' ? 'c' : t.st; t.tmr = rnd(3, 6); }
  });
  G.T = H.tch.map(t => [+t.x.toFixed(2), +t.y.toFixed(2), +t.z.toFixed(2), +t.ry.toFixed(2), t.st, t.rg > 0 ? 1 : 0]);
}
function lerpAng(a, b, t) { return a + angDiff(a, b) * t; }
function nPlayers() { return Math.max(1, allPlayers().filter(p => p.presence && p.presence.n).length); }
function hostBeginDay(day) {
  G.day = day; G.ph = 'break'; G.li = 0; G.rem = 45; G.el = 0; G.alarms = 0; G.res = null; planKey = '';
  H.checkDone = H.testDone = H.revealDone = H.startDone = -1; H.caught = 0; H.repeated = false;
  hev('day', { day });
}
function hostEndLesson() {
  if (G.li < NL - 1) { G.li++; G.ph = 'break'; G.rem = 40; G.el = 0; H.caught = 0; H.repeated = false; hev('bell'); }
  else { G.ph = 'dayEnd'; G.rem = 11; G.el = 0; G.res = { tp: G.tp, goal: G.goal, pass: G.tp >= G.goal }; hev('bell'); }
}
function hostTick(dt) {
  if (!H.tch.length) hostInitTeachers();
  // process actions of everybody (host role)
  if (G.ph !== 'lobby') { G.rem -= dt; G.el += dt; }
  G.np = nPlayers();
  G.tp = allPlayers().reduce((s, p) => s + ((p.presence && p.presence.day === G.day && p.presence.run === G.run && p.presence.pts) || 0), 0);
  G.goal = Math.round(G.np * (150 + 70 * (G.day - 1)));
  H.qcd -= dt;
  const L = plan()[G.li];
  if (G.ph === 'break' && G.rem <= 0) { G.ph = 'lesson'; G.rem = L.ev === 'absent' ? G.dur * .5 : G.dur; G.el = 0; hev('bell'); }
  else if (G.ph === 'lesson') {
    const t = L.teacher >= 0 ? H.tch[L.teacher] : null;
    if (H.startDone !== G.li) {
      H.startDone = G.li;
      if (L.ev === 'absent') htoast(N_('{t} ist heute nicht da. Freistunde!'), 'good', { t: TEACH[L.ti].name });
      if (L.ev === 'supplier') htoast(N_('Supplierstunde: {s} vertritt {t}.'), 'info', { s: TEACH[SUP].name, t: TEACH[L.ti].name });
      if (L.ev === 'director') htoast(N_('Heute sitzt der Direktor hinten in der Klasse.'), 'bad');
    }
    if (L.ev === 'wrongroom' && H.revealDone !== G.li && G.el >= 6) { H.revealDone = G.li; htoast(N_('📢 Durchsage: {t} unterrichtet heute im Raum {r}. Beeilt euch!'), 'bad', { t: TEACH[L.teacher].name, r: ROOMS[L.real].name }); hev('ding'); }
    const ready = t && !t.path.length && t.st !== 'w' && roomAt(t.x, t.z, t.y).i === lessonRoomIdx(L, G.el);
    if (H.checkDone !== G.li && t && ready && G.el > (L.ev === 'wrongroom' ? 22 : 9)) {
      H.checkDone = G.li;
      if (L.forget) { htoast(N_('{t} hat auf die Hausübungskontrolle vergessen!'), 'good', { t: TEACH[L.teacher].name }); hsay(L.teacher, N_(['Hausübung? Ach, egal.', 'Wo waren wir? Ich weiß nicht mehr, was ich wollte.'])); }
      else { hsay(L.teacher, 'check'); hev('check', { li: G.li }); }
    }
    if (L.sa && H.testDone !== G.li && G.el > 18 && G.rem > 30 && (!t || ready)) { H.testDone = G.li; hev('sa', { li: G.li }); htoast(N_('Schularbeit in {s}! Hefte weg, Handys weg (als ob).'), 'bad', { s: L.s }); if (t) hsay(L.teacher, N_(['Schularbeit. Wer schummelt, kriegt einen Fünfer.', 'Ich hab Augen am Hinterkopf, nur dass ihr\'s wisst.', 'Ihr dürft das Blatt jetzt umdrehen.'])); }
    if (L.test && H.testDone !== G.li && G.el > G.dur * .5 && G.rem > 25) { H.testDone = G.li; hev('test', { li: G.li }); htoast(N_('Unangekündigter Test! Hefte weg!'), 'bad'); if (t) hsay(L.teacher, N_(['Überraschung, wir schreiben einen Test!', 'Nehmt einen Zettel raus, wir machen einen Test.'])); }
    if (L.ev === 'alarm' && H.testDone !== 100 + G.li && G.el > G.dur * .7) { H.testDone = 100 + G.li; hostAlarm(null); return; }
    if (G.rem <= 0) hostEndLesson();
  } else if (G.ph === 'dayEnd' && G.rem <= 0) {
    if (G.res && G.res.pass) hostBeginDay(G.day + 1);
    else { G.ph = 'detention'; G.rem = 16; G.el = 0; }
  } else if (G.ph === 'detention' && G.rem <= 0) { G.run++; G.seed = Math.floor(Math.random() * 1e9); hostBeginDay(1); }
  hostTeacherTick(dt);
  hostWanderTick(dt);
  // teachers vs bananas
  H.bananas = H.bananas.filter(b => {
    for (const t of H.tch) if (t.rg <= 0 && Math.hypot(t.x - b.x, t.z - b.z) < .55 && Math.abs(t.y - b.y) < 1) { t.rg = 3; t.path = []; t.zone = ''; hev('trg', { w: t.i, v: [Math.sin(t.ry) * 5, 6, Math.cos(t.ry) * 5] }); hev('rmB', { id: b.id }); return false; }
    return true;
  });
}
function hostAlarm(peer) {
  hev('alarm', { p: peer || '' });
  if (G.ph === 'lesson' && G.alarms < 2) { G.alarms++; htoast(N_('Feueralarm! Die Stunde ist vorbei.'), 'bad'); hostEndLesson(); }
}
function hostAction(from, a) {
  const L = plan()[G.li]; const name = from.presence.n;
  switch (a.t) {
    case 'start': if (G.ph === 'lobby' || G.ph === 'detention') { G.dur = clamp(+a.dur || 180, 60, 400); G.saEvery = clamp(Math.round(+a.sa), 0, 7); if (isNaN(G.saEvery)) G.saEvery = 3; G.run++; G.seed = Math.floor(Math.random() * 1e9); hostBeginDay(1); } break;
    case 'sus50': { const t = H.tch[a.w]; if (t && !t.path.length && t.rg <= 0) { t.st = 'x'; t.tmr = 2.2; t.ry = Math.atan2(from.presence.x - t.x, from.presence.z - t.z); hsay(a.w, 'sus', { n: name }); } break; }
    case 'caught': { const t = H.tch[a.w]; if (t && t.rg <= 0) { t.st = 'x'; t.tmr = 2.5; t.path = []; t.ry = Math.atan2(from.presence.x - t.x, from.presence.z - t.z); hsay(a.w, 'caught', { n: name }); }
      if (G.ph === 'lesson') { H.caught++; if (!H.repeated && H.caught >= Math.max(2, Math.ceil(G.np / 2))) { H.repeated = true; G.rem += G.dur * .4; htoast(N_('Zu viele erwischt. Die Stunde wird verlängert!'), 'bad'); } } break; }
    case 'question': {
      const t = L && L.teacher >= 0 ? H.tch[L.teacher] : null;
      if (G.ph === 'lesson' && t && H.qcd <= 0 && t.rg <= 0) {
        H.qcd = 18;
        if (Math.random() < .22) { hsay(L.teacher, N_(['Gute Frage, {n}. Komm an die Tafel!', '{n}, erklär du\'s uns doch!']), { n: name }); hev('tafel', { p: from.peer }); t.ry = Math.atan2(from.presence.x - t.x, from.presence.z - t.z); t.st = 'x'; t.tmr = 4; }
        else { const F = FRONT[lessonRoomIdx(L, G.el)]; if (F) { goTo(t, { x: F.board.x, y: t.y, z: F.board.z }, 'q' + Math.random(), 'b', F.boardRy, rnd(8, 11)); } hsay(L.teacher, 'question'); }
      } break;
    }
    case 'alarm': hostAlarm(from.peer); break;
    case 'hitT': { const t = H.tch[a.w]; if (t && t.rg <= 0) { t.st = 'x'; t.tmr = 2; t.ry = Math.atan2(from.presence.x - t.x, from.presence.z - t.z); hsay(a.w, 'hit'); } break; }
    case 'shoveT': { const t = H.tch[a.w]; if (t && t.rg <= 0) { t.rg = 3; t.path = []; t.zone = ''; hev('trg', { w: a.w, v: a.v }); setTimeout(() => hsay(a.w, 'shove'), 2500); } break; }
    case 'snitch': { const w = a.w; if (H.tch[w]) hsay(w, 'snitch', { n: a.tn, s: name }); break; }
    case 'late': { if (L && L.teacher >= 0) hsay(L.teacher, 'late', { n: name }); break; }
    case 'staff': { if (H.tch[a.w]) hsay(a.w, 'staff'); break; }
    case 'banana': H.bananas.push({ id: a.id, x: a.p[0], y: a.p[1], z: a.p[2] }); break;
    case 'rmB': H.bananas = H.bananas.filter(b => b.id !== a.id); break;
    case 'away': { if (L && L.teacher >= 0) hsay(L.teacher, N_(['Wo ist {n}?', 'Ist {n} schon wieder so lang am Klo?']), { n: name }); break; }
  }
}
