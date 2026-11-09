// ================= School With Your Friends =================
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------- game data ----------------
const SUBJ = {
  Mathe: { mg: 'math', icon: '➗' }, Deutsch: { mg: 'type', icon: '✍️' }, Englisch: { mg: 'quiz', icon: '💂' },
  Chemie: { mg: 'timing', icon: '⚗️' }, Physik: { mg: 'timing', icon: '🧲' }, Geschichte: { mg: 'order', icon: '🏛️' },
  Biologie: { mg: 'order', icon: '🐸' }, Kunst: { mg: 'draw', icon: '🎨' },
};
const TEACH = [
  { name: 'Prof. Kreidler', subj: ['Mathe', 'Physik'], pers: 'streng', col: 0x3b4a6b, hair: 0xdedede, pitch: 0.75, must: true },
  { name: 'Frau Gähnwald', subj: ['Deutsch', 'Englisch'], pers: 'entspannt', col: 0xc76b98, hair: 0x8b4513, pitch: 1.35 },
  { name: 'Dr. Zufallski', subj: ['Chemie', 'Biologie'], pers: 'chaotisch', col: 0x2e8b57, hair: 0xff6a00, pitch: 1.05 },
  { name: 'Mag. Schusselbauer', subj: ['Geschichte', 'Kunst'], pers: 'vergesslich', col: 0x8e6b3e, hair: 0x2b2b2b, pitch: 0.9, must: true },
  { name: 'Dir. Oberhuber', pers: 'direktor', col: 0x1d1d1d, hair: 0x9a9a9a, pitch: 0.55, must: true },
  { name: 'Herr Egal', pers: 'supplier', col: 0x8a8a7a, hair: 0x553311, pitch: 1.15 },
];
const DIR = 4, SUP = 5;
const PERS = {
  streng: { spd: 2.3, view: 13, fov: 1.7, sus: 1.45, board: .22, nap: 0, tele: 0, forget: 0, fake: .75, label: 'extrem streng' },
  entspannt: { spd: 1.3, view: 8, fov: 1.15, sus: .6, board: .32, nap: .28, tele: 0, forget: .15, fake: .2, label: 'entspannt' },
  chaotisch: { spd: 2.9, view: 11, fov: 1.45, sus: 1.1, board: .25, nap: .05, tele: .28, forget: .2, fake: .5, label: 'unberechenbar' },
  vergesslich: { spd: 1.6, view: 10, fov: 1.3, sus: .9, board: .3, nap: .1, tele: 0, forget: .5, fake: .35, label: 'vergesslich' },
  direktor: { spd: 1.5, view: 15, fov: 1.8, sus: 2.1, board: 0, nap: 0, tele: 0, forget: 0, fake: .9, label: 'der Direktor' },
  supplier: { spd: 1.0, view: 6, fov: 1.0, sus: .4, board: .2, nap: .6, tele: 0, forget: 1, fake: .1, label: 'Supplierlehrer' },
};
const ITEMS = {
  energy: { icon: '🥤', name: 'Energy Drink', desc: 'Schneller + mehr Zeit bei HÜs' },
  rechner: { icon: '🧮', name: 'Taschenrechner', desc: 'Nächste HÜ/Test +35%' },
  spick: { icon: '📜', name: 'Spickzettel', desc: 'Nächste HÜ/Test +35%' },
  ausrede: { icon: '📄', name: 'Entschuldigung', desc: 'Hebt die nächste Strafe auf' },
  loesung: { icon: '🗝️', name: 'Testlösungen', desc: 'Nächster Test = Sehr gut' },
  banane: { icon: '🍌', name: 'Bananenschale', desc: 'Fallen lassen. Warten. Lachen.' },
};
const COLORS = ['#e8412c', '#2f6fd6', '#36b45a', '#ffb000', '#9b59b6', '#ff6fb5', '#18b5b5', '#8d5a2b'];
const DAYNAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag?!', 'Sonntag?!?'];
const GRADE = q => q >= .9 ? [1, 'Sehr gut'] : q >= .75 ? [2, 'Gut'] : q >= .6 ? [3, 'Befriedigend'] : q >= .45 ? [4, 'Genügend'] : [5, 'Nicht genügend'];

const SAY = {
  check: ['Hausübungskontrolle! Hefte raus!', 'So, wer hat die Hausübung? Alle, oder?', 'Ich will Hausübungen sehen. JETZT.'],
  sus: ['Was machst du da, {n}?', '{n}... ich seh dich.', 'Hmm? {n}?', 'Ist das eine Hausübung für ein anderes Fach, {n}?'],
  caught: ['ERWISCHT, {n}!', '{n}! Das gibt Konsequenzen!', 'Glaubst du ich bin blind, {n}?!', 'Zu mir! Sofort! {n}!'],
  question: ['Gute Frage! Also, die Wurzel aus Banane ist...', 'Ähm. Das erkläre ich an der Tafel. Ausführlich.', 'Interessant! Napoleon war übrigens 1,57 Meter...', 'Wie bitte? Okay... *dreht sich zur Tafel*', 'Die Antwort ist 42. Ich zeig\'s euch.'],
  board: ['*kritzel kritzel*', 'Also, wie man hier sieht...', '*quietsch*', 'Und DAS kommt zur Schularbeit!'],
  nap: ['Zzz...', 'Zzzz... Hausübung... zzz', '*schnarch*'],
  late: ['Zu spät, {n}! Eintrag!', '{n}, schön dass du auch kommst.'],
  tele: ['Na?', 'Überraschung.', 'Buh.', 'Ich bin überall.'],
  snitch: ['Danke, {s}. {n}, nach vorne!', 'Ach so ist das, {n}?'],
  hit: ['AU! Wer war das?!', 'Hat mich gerade ein ZETTEL getroffen?!'],
  shove: ['HEY! Lehrerangriff!', 'Das sag ich dem Direktor!'],
  staff: ['Raus aus dem Lehrerzimmer!', 'Schüler im Lehrerzimmer!!'],
  coffee: ['*schlürf*', 'Der Kaffee ist kalt...', 'Noch 34 Jahre bis zur Pension.'],
  dir: ['Nicht laufen am Gang!', 'Ich beobachte euch alle.', 'Hmm.'],
};
const fillSay = (s, o = {}) => s.replace('{n}', o.n || '').replace('{s}', o.s || '');

// ---------------- audio ----------------
const Snd = (() => {
  let ac = null, master = null, on = true;
  function init() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination); } catch (e) { ac = null; } }
  function env(g, t, a, d, peak = 1) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f0, f1, dur, vol = .3, delay = 0, vib = 0) {
    if (!ac || !on) return; const t = ac.currentTime + delay; const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 7; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
    env(g, t, .01, dur, vol); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol = .3, fq = 1200, type = 'bandpass', delay = 0) {
    if (!ac || !on) return; const t = ac.currentTime + delay; const len = Math.floor(ac.sampleRate * dur); const b = ac.createBuffer(1, len, ac.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = fq; const g = ac.createGain(); env(g, t, .005, dur, vol);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function voice(text, pitch = 1, vol = .12) { // gibberish teacher talk
    if (!ac || !on) return; const n = Math.min(14, Math.max(3, Math.round(text.length / 4)));
    for (let i = 0; i < n; i++) { const f = (180 + Math.random() * 160) * pitch; osc('square', f, f * rnd(.8, 1.2), .07, vol, i * .085); }
  }
  return {
    init, voice, get on() { return on; }, set on(v) { on = v; },
    boing() { osc('sine', 140, 620, .18, .35); osc('sine', 620, 160, .3, .3, .18, 30); },
    slap() { noise(.12, .6, 2500, 'highpass'); osc('triangle', 220, 80, .1, .3); },
    whistleUp() { osc('sine', 380, 1500, .55, .2, 0, 12); },
    whistleDown() { osc('sine', 1500, 300, .6, .2, 0, 12); },
    bell() { [659, 523, 587, 392].forEach((f, i) => { osc('triangle', f, f, 1.1, .25, i * .45); osc('sine', f * 2, f * 2, .6, .08, i * .45); }); },
    ding() { osc('triangle', 880, 880, .5, .25); osc('triangle', 660, 660, .7, .25, .25); },
    alarm() { for (let i = 0; i < 10; i++) osc('square', i % 2 ? 640 : 860, i % 2 ? 640 : 860, .22, .12, i * .25); },
    scream(p = 1) { osc('sawtooth', 300 * p, 760 * p, .25, .18, 0, 25); osc('sawtooth', 760 * p, 420 * p, .55, .18, .25, 40); noise(.6, .05, 1500); },
    huh() { osc('sine', 300, 300, .12, .25); osc('sine', 300, 460, .2, .25, .13); },
    pop() { osc('sine', 900, 120, .12, .35); noise(.05, .2, 4000, 'highpass'); },
    coin() { osc('square', 988, 988, .08, .12); osc('square', 1319, 1319, .25, .12, .08); },
    buzz() { osc('sawtooth', 120, 100, .35, .22); },
    squeak() { osc('square', 900, 1300, .08, .07); osc('square', 1200, 700, .1, .07, .08); },
    pfft() { osc('sawtooth', 95, 60, .45, .2, 0, 18); noise(.4, .05, 300, 'lowpass'); },
    burp() { osc('sawtooth', 110, 70, .5, .25, 0, 22); },
    whoosh() { noise(.3, .25, 900, 'bandpass'); },
    paper() { noise(.15, .2, 3000, 'highpass'); noise(.1, .15, 2000, 'highpass', .12); },
    click() { osc('square', 1800, 1800, .02, .05); },
    trombone() { [[233, .5], [220, .5], [208, .5], [196, 1.6]].reduce((t, [f, d], i) => { osc('sawtooth', f, f, d, .16, t, i == 3 ? 9 : 0); return t + d; }, 0); },
    laugh() { for (let i = 0; i < 7; i++) osc('square', rnd(300, 480), rnd(250, 380), .09, .07, i * .12); },
    heart() { osc('sine', 70, 50, .12, .4); osc('sine', 70, 50, .12, .3, .18); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => osc('square', f, f, .2, .1, i * .13)); osc('square', 1047, 1047, .6, .1, .55); },
  };
})();

// ---------------- three.js world ----------------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ff);
scene.fog = new THREE.Fog(0x9fd3ff, 40, 110);
const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 300);
scene.add(new THREE.HemisphereLight(0xfff6e0, 0x6a6a8a, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(20, 40, 15); scene.add(sun);
function onResize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', onResize); onResize();

const matCache = {};
const M = (c, o = {}) => { const k = c + JSON.stringify(o); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); };
const BOX = new THREE.BoxGeometry(1, 1, 1);
function box(x, y, z, w, h, d, mat, parent = scene) { const m = new THREE.Mesh(BOX, typeof mat === 'number' ? M(mat) : mat); m.scale.set(w, h, d); m.position.set(x, y, z); parent.add(m); return m; }
// Shared mipmapped canvases; cap anisotropy on modest GPUs.
const texCache = {};
const textureAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = textureAnisotropy;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t;
}
function cTex(key, w, h, draw, rep) { return texCache[key] || (texCache[key] = canvasTex(w, h, draw, rep)); }
function texMat(key, w, h, draw, rep) { return TM(0xffffff, cTex(key, w, h, draw, rep), key); }
const hex = c => '#' + new THREE.Color(c).getHexString();
function shade(c, f) { const col = new THREE.Color(c); col.multiplyScalar(f); return '#' + col.getHexString(); }
function noiseFill(g, w, h, base, amt = 14, n = 900) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (Math.random() - .5) * amt; g.fillStyle = v > 0 ? `rgba(255,255,255,${v / 100})` : `rgba(0,0,0,${-v / 100})`; g.fillRect(Math.random() * w, Math.random() * h, i % 3 ? 1 : 3, i % 3 ? 1 : 3); } }
const SHIRTS = ['stripes', 'dots', 'number', 'star', 'hoodie', 'check', 'zigzag', 'plain'];
function shirtTex(col, kind, seed) {
  return cTex('shirt' + col + kind + seed, 256, 128, (g, w, h) => {
    const base = hex(col), dark = shade(col, .72), light = shade(col, 1.25); noiseFill(g, w, h, base, 10, 600);
    g.fillStyle = dark;
    if (kind === 'stripes') for (let y = 6; y < h; y += 22) g.fillRect(0, y, w, 9);
    else if (kind === 'dots') { g.fillStyle = light; for (let y = 10; y < h; y += 22) for (let x = (y / 22 % 2) * 11; x < w; x += 22) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }
    else if (kind === 'check') { g.globalAlpha = .45; for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 10, h); for (let y = 0; y < h; y += 24) g.fillRect(0, y, w, 10); g.globalAlpha = 1; }
    else if (kind === 'zigzag') { g.strokeStyle = light; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, 60 + (x / 16 % 2 ? 14 : -14)); g.stroke(); }
    else if (kind === 'number') { g.fillStyle = '#fffdf2'; g.font = 'bold 44px Impact, sans-serif'; g.textAlign = 'center'; g.fillText(String(seed % 99 + 1), w * .25, 82); g.fillRect(0, 118, w, 6); }
    else if (kind === 'star') { g.fillStyle = '#ffd23f'; g.save(); g.translate(w * .25, 64); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
    else if (kind === 'hoodie') { g.fillRect(w * .12, 70, w * .26, 30); g.strokeStyle = '#fffdf2'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .22, 0); g.lineTo(w * .22, 34); g.moveTo(w * .28, 0); g.lineTo(w * .28, 34); g.stroke(); }
    // Collar, double stitched hems and creases retain the silly big print.
    g.strokeStyle = dark; g.lineWidth = 3;
    g.beginPath(); g.ellipse(w * .25, 0, 19, 13, 0, 0, Math.PI); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h - 10, w, 10);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.setLineDash([3, 3]);
    [7, 121, 135, 249].forEach(x => { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, h - 5); g.stroke(); });
    g.strokeRect(2, h - 8, w - 4, 4); g.setLineDash([]);
    for (let i = 0; i < 7; i++) { const x = 15 + i * 35; g.strokeStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(x, h - 12); g.quadraticCurveTo(x + 9, 80, x + 3, 52); g.stroke(); }
    g.fillStyle = '#ffe9a0'; g.fillRect(91, 35, 15, 10); g.fillStyle = dark; g.font = '7px sans-serif'; g.fillText('404', 92, 43);
  });
}
function faceTex(skin, seed) {
  return cTex('face' + skin + seed, 256, 128, (g, w, h) => {
    const r = mulberry(seed); noiseFill(g, w, h, hex(skin), 8, 400);
    const fx = w * .25; g.fillStyle = 'rgba(255,90,110,.35)'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(fx + sd * 26, h * .58, 13, 8, 0, 0, 7); g.fill(); });
    if (r() < .6) { g.fillStyle = 'rgba(140,70,30,.48)'; [-1, 1].forEach(sd => { for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(fx + sd * (14 + r() * 18), h * .54 + (r() - .5) * 13, .6 + r() * .8, 0, 7); g.fill(); } }); }
    g.strokeStyle = 'rgba(40,25,15,.85)'; g.lineWidth = 4; g.lineCap = 'round'; const angry = r() < .4 ? 1 : -1;
    [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(fx + sd * 8, h * .3 + angry * sd * -3); g.quadraticCurveTo(fx + sd * 17, h * .3 - 5, fx + sd * 26, h * .3 - angry * sd * -3); g.stroke();
      g.lineWidth = 1; for (let i = 0; i < 5; i++) { const x = fx + sd * (10 + i * 3); g.beginPath(); g.moveTo(x, h * .3); g.lineTo(x + sd * 2, h * .3 - 4); g.stroke(); } g.lineWidth = 4; });
  });
}
const DENIM = () => cTex('denim', 128, 128, (g, w, h) => {
  noiseFill(g, w, h, '#f5f5f5', 24, 1800);
  g.strokeStyle = 'rgba(0,0,0,.12)'; for (let x = -h; x < w; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); }
  g.strokeStyle = 'rgba(65,50,35,.5)'; g.lineWidth = 2; g.strokeRect(9, 3, 110, 119);
  g.beginPath(); g.moveTo(28, 26); g.lineTo(68, 26); g.lineTo(65, 57); g.lineTo(48, 65); g.lineTo(30, 57); g.closePath(); g.stroke();
  g.strokeStyle = '#fff1bf'; g.lineWidth = 1; g.setLineDash([3, 2]); g.stroke(); g.strokeRect(12, 5, 104, 115); g.setLineDash([]);
});
const TWEED = () => cTex('tweed', 128, 128, (g, w, h) => {
  noiseFill(g, w, h, '#eeeeea', 22, 2000);
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 8) {
    g.strokeStyle = (x / 8 + y / 4) % 2 ? 'rgba(0,0,0,.23)' : 'rgba(255,255,255,.65)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 4); g.lineTo(x + 8, y); g.stroke();
  }
});
const texMatCache = {};
function TM(col, tex, key) { const k = col + ':' + key; return texMatCache[k] || (texMatCache[k] = new THREE.MeshLambertMaterial({ color: col, map: tex })); }
const checker = (a, b) => (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); };

// --- layout ---
const FH = 4, WH = 3.7; // floor height, wall height
const COLS = [-24, -12, 0, 12, 24];
const LAYOUT = [
  [0, 1, 0, '1A', 'class'], [0, 1, 1, '1B', 'class'], [0, 1, 2, 'Chemiesaal', 'class'], [0, 1, 3, '1C', 'class'],
  [0, -1, 0, 'Klo EG', 'toilet'], [0, -1, 1, 'Bibliothek', 'library'], [0, -1, 2, 'Buffet', 'buffet'], [0, -1, 3, 'Stiegenhaus', 'stairs'],
  [1, 1, 0, '2A', 'class'], [1, 1, 1, '2B', 'class'], [1, 1, 2, 'Physiksaal', 'class'], [1, 1, 3, 'Lehrerzimmer', 'staff'],
  [1, -1, 0, 'Klo OG', 'toilet'], [1, -1, 1, 'Zeichensaal', 'class'], [1, -1, 2, 'Direktion', 'office'], [1, -1, 3, 'Stiegenhaus', 'stairs'],
];
const ROOMS = LAYOUT.map(([f, side, col, name, type], i) => {
  const x0 = COLS[col], x1 = COLS[col + 1], z0 = side > 0 ? 2.5 : -12, z1 = side > 0 ? 12 : -2.5;
  return { i, f, side, name, type, x0, x1, z0, z1, cx: (x0 + x1) / 2, doorX: (x0 + x1) / 2, y: f * FH };
});
const CLASSROOMS = ROOMS.filter(r => r.type === 'class');
const roomByName = n => ROOMS.find(r => r.name === n);
const RAMP = { x0: 13, x1: 21, z0: -11.5, z1: -7.5 };
const HOLE = { x0: -20, x1: -18, z0: -9, z1: -7 }; // secret shortcut in Klo OG
function inRect(x, z, r, m = 0) { return x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m; }
function rampY(x) { return clamp((x - RAMP.x0) / (RAMP.x1 - RAMP.x0), 0, 1) * FH; }
function groundAt(x, z, y) {
  let g = 0;
  if (inRect(x, z, RAMP)) { const ry = rampY(x); if (y >= ry - 0.65) g = ry; }
  if (y >= FH - 0.65 && !inRect(x, z, RAMP) && !inRect(x, z, HOLE)) g = Math.max(g, FH);
  if (Math.abs(x) > 24.2 || Math.abs(z) > 12.2) g = 0; // outside
  return g;
}
const floorOf = y => y > FH * .5 ? 1 : 0;
function roomAt(x, z, y) {
  const f = floorOf(y);
  if (Math.abs(x) > 24 || Math.abs(z) > 12) return { name: 'Schulhof', type: 'out', f };
  if (Math.abs(z) < 2.5) return { name: f ? 'Gang OG' : 'Gang EG', type: 'hall', f, i: -1 - f };
  return ROOMS.find(r => r.f === f && inRect(x, z, r)) || { name: '?', type: 'hall', f, i: -1 - f };
}

// --- colliders ---
const WALLS = []; // {x0,x1,z0,z1,f,maxY?}
const camBlockers = [];
const wallMatFor = t => ({ class: 0xd9ecd4, toilet: 0xcfe3f0, staff: 0xf0dcc0, office: 0xe6d0e8, library: 0xeee2c4, buffet: 0xffe0b0, stairs: 0xdcdcdc }[t] || 0xe8e4d4);
const WALLTEX = () => cTex('wall', 256, 256, (g, w, h) => {
  noiseFill(g, w, h, '#faf9f4', 18, 6500);
  g.fillStyle = 'rgba(60,80,70,.28)'; g.fillRect(0, h * .62, w, h * .38);
  g.fillStyle = 'rgba(40,50,45,.55)'; g.fillRect(0, h * .61, w, 5); g.fillRect(0, h - 10, w, 10);
  const r = mulberry(442); g.strokeStyle = 'rgba(60,50,40,.16)';
  for (let i = 0; i < 45; i++) { const x = r() * w, y = 160 + r() * 85; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 12, y - r() * 4); g.stroke(); }
  g.fillStyle = '#e7dbab'; g.fillRect(154, 53, 35, 47); g.fillStyle = '#566b65'; g.font = 'bold 8px sans-serif'; g.fillText('KEIN', 158, 66); g.fillText('BOOM!', 156, 78);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(165, 50, 12, 6);
  g.strokeStyle = '#687a8a'; g.beginPath(); g.arc(60, 181, 10, 0, 7); g.moveTo(54, 184); g.quadraticCurveTo(60, 191, 66, 184); g.stroke();
  g.fillStyle = '#687a8a'; g.fillRect(55, 178, 2, 2); g.fillRect(63, 178, 2, 2);
});
function wall(x0, x1, z0, z1, f, col = 0xe8e4d4, h = WH, collide = true) {
  if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
  const m = box((x0 + x1) / 2, f * FH + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, h > 3 ? TM(col, WALLTEX(), 'wall') : M(col));
  camBlockers.push(m);
  if (collide) WALLS.push({ x0, x1, z0, z1, f });
  return m;
}
const T = 0.12; // half wall thickness
function wallWithDoors(axis, c, a0, a1, f, doors, col, dw = 1.0) {
  // axis 'x': wall along x at z=c from a0..a1; doors are positions along axis
  const segs = []; let s = a0; [...doors].sort((a, b) => a - b).forEach(d => { segs.push([s, d - dw]); s = d + dw; }); segs.push([s, a1]);
  segs.forEach(([p, q]) => { if (axis === 'x') wall(p, q, c - T, c + T, f, col); else wall(c - T, c + T, p, q, f, col); });
  doors.forEach(d => { if (axis === 'x') box(d, f * FH + WH - .35, c, dw * 2, .7, T * 2, woodMat(col)); else box(c, f * FH + WH - .35, d, T * 2, .7, dw * 2, woodMat(col)); });
}

// Texture repeat belongs to the cached usage, never mutated per mesh.
function floorDraw(a, b) { return (g, w, h) => {
  checker(a, b)(g, w, h); const r = mulberry(72);
  for (let i = 0; i < 4500; i++) { g.fillStyle = i % 2 ? 'rgba(80,65,40,.12)' : 'rgba(255,255,255,.22)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
  g.strokeStyle = '#8e8c7f'; g.lineWidth = 3;
  for (let y = 0; y < h; y += h / 2) for (let x = 0; x < w; x += w / 2) { g.strokeRect(x, y, w / 2, h / 2); g.strokeStyle = 'rgba(95,85,65,.4)'; }
  g.strokeStyle = 'rgba(60,50,40,.15)'; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7 + r() * 15, y + 3); g.stroke(); }
}; }
function woodDraw(g, w, h) {
  noiseFill(g, w, h, '#eee1c5', 15, 2200); const r = mulberry(93);
  for (let y = 0; y < h; y += 3) { g.strokeStyle = `rgba(85,48,16,${.08 + r() * .15})`; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y - 5, w * .65, y + 5, w, y); g.stroke(); }
  g.strokeStyle = 'rgba(70,40,20,.35)'; for (let y = 0; y < h; y += 64) { g.strokeRect(0, y, w, 64); g.strokeRect(y % 128 ? 50 : 170, y, w, 64); }
  g.strokeStyle = 'rgba(90,50,15,.22)'; for (let i = 1; i < 5; i++) { g.beginPath(); g.ellipse(83, 93, i * 6, i * 2, 0, 0, 7); g.stroke(); }
}
const WOOD = () => cTex('woodFurniture', 256, 256, woodDraw);
const woodMat = col => TM(col, WOOD(), 'woodFurniture');
const texLino = texMat('lino', 256, 256, floorDraw('#d8d2c2', '#b9b1a0'), [24, 2.5]);
const texWood = TM(0xc99a5b, cTex('woodFloor', 256, 256, woodDraw, [4, 3]), 'woodFloor');
const texTile = texMat('tile', 256, 256, floorDraw('#f2f6f8', '#e0e8e8'), [6, 5]);
const texCarpet = texMat('carpet', 128, 128, (g, w, h) => noiseFill(g, w, h, '#8a3b3b', 30, 5000), [6, 5]);
const texGrass = texMat('grass', 256, 256, (g, w, h) => {
  noiseFill(g, w, h, '#6bab49', 28, 5000); const r = mulberry(82);
  for (let i = 0; i < 1500; i++) { const x = r() * w, y = r() * h; g.strokeStyle = ['#52923c', '#81b957', '#629f40'][i % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 6 - 3, y - 3 - r() * 8); g.stroke(); }
}, [40, 40]);
const LOCKER = () => cTex('locker', 128, 256, (g, w, h) => {
  noiseFill(g, w, h, '#eeeeee', 14, 1800); g.strokeStyle = '#777'; g.lineWidth = 2; g.strokeRect(5, 5, w - 10, h - 10);
  g.strokeStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(80, 175); g.lineTo(65, 184); g.lineTo(84, 200); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(82, 176); g.lineTo(68, 184); g.stroke();
  g.save(); g.translate(24, 104); g.rotate(-.15); g.fillStyle = '#fff1a6'; g.fillRect(0, 0, 36, 26); g.fillStyle = '#403d37'; g.font = 'bold 10px sans-serif'; g.fillText('404', 7, 12); g.font = '7px sans-serif'; g.fillText('BRAIN', 6, 21); g.restore();
});
function boardTex(lines) { return texMat('board:' + lines.join('|'), 512, 256, (g, w, h) => {
  noiseFill(g, w, h, '#24493a', 16, 3500); const r = mulberry(38);
  for (let i = 0; i < 35; i++) { g.fillStyle = 'rgba(230,240,220,.035)'; g.fillRect(r() * w, r() * h, 40 + r() * 100, 4 + r() * 15); }
  g.strokeStyle = '#b4be9a'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = '#f4f1e6'; g.font = '40px "Patrick Hand", "Comic Sans MS", cursive'; lines.forEach((l, i) => g.fillText(l, 28, 64 + i * 60));
}); }
const BOARD_TEXT = [['2 + 2 = Fisch', 'x = vielleicht', 'Hausübung: ALLES'], ['Der Hund, die Katze,', 'das Hausübung (?)', 'Diktat morgen!!'], ['H2O + Wurst = ?', 'NICHT trinken!!', 'Explosion ≠ gut'], ['1492: irgendwas', 'Napoleon: klein', 'Test bald (geheim)'], ['F = m · a · Pech', 'Schwerkraft: ja', 'Formel lernen!'], ['Zeichnet eine Katze', 'aber realistisch', 'mit Gefühl']];

function signTex(text, bg = '#1f1a33', fg = '#fffdf2', w = 256, h = 64) { return cTex('sign:' + [text, bg, fg, w, h].join('|'), w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `${Math.floor(h * .55)}px "Luckiest Guy", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); }); }
function sign(text, x, y, z, ry, w = 2.2, bg, fg) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: signTex(text, bg, fg) })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; }

const INTER = []; // interactables {x,y,z,r,label,fn,cond}
const SEATS = {}; // roomIndex -> [{x,z,y,ry}]
const FRONT = {}; // roomIndex -> {front:{x,z}, board:{x,z}, desk:{x,z}, back:{x,z}, ry (facing class)}
const STAFFSPOTS = [];

function buildWorld() {
  // Reine Kulisse: gleiche Farbe = ein Drawcall, keine Collider/Kamerablocker.
  const decor = new Map(), dm = new THREE.Object3D();
  const db = (x, y, z, w, h, d, col) => { dm.position.set(x, y, z); dm.scale.set(w, h, d); dm.updateMatrix(); if (!decor.has(col)) decor.set(col, []); decor.get(col).push(dm.matrix.clone()); };
  const windowDeco = (x, y, z, end = false) => {
    const b = (dx, dy, dz, w, h, d, c) => end ? db(x + dz, y + dy, z + dx, d, h, w, c) : db(x + dx, y + dy, z + dz, w, h, d, c);
    b(0, 0, 0, 2.65, 1.65, .12, 0xfff0ce); b(0, 0, Math.sign(end ? x : z) * .08, 2.35, 1.35, .04, 0x719fae);
    b(0, 0, 0, .1, 1.5, .26, 0xfff0ce); b(0, 0, 0, 2.45, .09, .26, 0xfff0ce);
    b(0, -.85, 0, 2.85, .14, .45, woodMat(0xc48257));
  };
  // outside
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), texGrass); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; scene.add(grass);
  for (let i = 0; i < 26; i++) { const a = rnd(Math.PI * 2), r = rnd(34, 70); const x = Math.cos(a) * r, z = Math.sin(a) * r; box(x, 1.2, z, .5, 2.4, .5, 0x7a5230); const s = rnd(2, 3.5); const t = box(x, 2.6 + s / 2, z, s, s, s, 0x3f9b3a); t.rotation.y = rnd(3); }
  box(-31, 0.01, 0, 14, .02, 5, 0xb0a890); // path
  sign('SCHULE', -24.39, 6.2, 0, -Math.PI / 2, 5, '#e8412c');
  // Dachkante statt Dachplatte: OG bleibt von oben lesbar.
  [FH - .08, FH + WH + .08].forEach(y => {
    [-12.2, 12.2].forEach(z => db(0, y, z, 48.6, .24, .38, 0xb56c4e));
    [-24.2, 24.2].forEach(x => db(x, y, 0, .38, .24, 24.4, 0xb56c4e));
  });
  [-23.85, -12, 0, 12, 23.85].forEach(x => [-12.19, 12.19].forEach(z => db(x, 3.85, z, .35, 7.7, .18, 0xffe7bb)));
  db(-24.35, 3.1, 0, .55, .35, 3.3, 0xb56c4e); // Eingang, lichte Breite bleibt frei
  [-1.48, 1.48].forEach(z => db(-24.22, 1.5, z, .32, 3, .22, 0xffe7bb));
  db(-24.28, 6.2, 0, .16, 1.45, 5.4, 0xffe7bb);
  sign('Kein Boom!', -24.38, 4.95, 0, -Math.PI / 2, 3.2, '#416957');
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  [-1, 1].forEach(side => {
    const z = side * 7;
    db(-28, .62, z, 1.1, .18, 3.4, woodMat(0xc48257)); db(-28.45, 1.12, z, .16, .75, 3.4, woodMat(0xc48257));
    [-1.2, 1.2].forEach(d => db(-28, .28, z + d, .8, .56, .16, 0x416957));
    db(-27, .3, side * 10.5, 2.4, .6, 2, 0xb56c4e);
    for (let k = 0; k < 3; k++) { const leaf = new THREE.Mesh(leafGeo, M(k & 1 ? 0x7eac50 : 0x50894b, { flatShading: true })); leaf.position.set(-27.7 + k * .7, .9, side * 10.5); leaf.scale.set(.75, .7, .8); scene.add(leaf); }
    db(-32, 1.35, side * 12, .5, 2.7, .5, 0x7a5230);
    const crown = new THREE.Mesh(leafGeo, M(0x50894b, { flatShading: true })); crown.position.set(-32, 3.4, side * 12); crown.scale.set(2.2, 2.5, 1.9); crown.rotation.z = side * .15; scene.add(crown);
  });
  // floors
  for (let f = 0; f < 2; f++) {
    const y = f * FH;
    const hall = new THREE.Mesh(BOX, texLino); hall.scale.set(48, .2, 5); hall.position.set(0, y - .1, 0); scene.add(hall);
    ROOMS.filter(r => r.f === f).forEach(r => {
      const mat = r.type === 'toilet' ? texTile : r.type === 'staff' || r.type === 'office' ? texCarpet : r.type === 'stairs' ? M(0xbdbdbd) : texWood;
      const pieces = [];
      if (f === 1 && r.type === 'stairs') pieces.push([12, 24, -7.5, -2.5], [21, 24, -12, -7.5], [12, 13, -12, -7.5]);
      else if (f === 1 && r.name === 'Klo OG') pieces.push([r.x0, HOLE.x0, r.z0, r.z1], [HOLE.x1, r.x1, r.z0, r.z1], [HOLE.x0, HOLE.x1, r.z0, HOLE.z0], [HOLE.x0, HOLE.x1, HOLE.z1, r.z1]);
      else pieces.push([r.x0, r.x1, r.z0, r.z1]);
      pieces.forEach(([a, b, c, d]) => { const m = new THREE.Mesh(BOX, mat); m.scale.set(b - a, .2, d - c); m.position.set((a + b) / 2, y - .1, (c + d) / 2); scene.add(m); });
    });
    // outer walls
    const ow = 0xf2d6a2;
    wall(-24, 24, 12 - T, 12 + T, f, ow); wall(-24, 24, -12 - T, -12 + T, f, ow); wall(24 - T, 24 + T, -12, 12, f, ow);
    if (f === 0) wallWithDoors('z', -24, -12, 12, 0, [0], ow, 1.3); else wall(-24 - T, -24 + T, -12, 12, f, ow);
    // windows on outer walls
    for (let x = -21; x <= 21; x += 6) { windowDeco(x, y + 2, 12.17); windowDeco(x, y + 2, -12.17); }
    [-8.5, -4.5, 4.5, 8.5].forEach(z => { windowDeco(-24.17, y + 2, z, true); windowDeco(24.17, y + 2, z, true); });
    // hallway walls with doors
    const doorsN = ROOMS.filter(r => r.f === f && r.side > 0).map(r => r.doorX), doorsS = ROOMS.filter(r => r.f === f && r.side < 0).map(r => r.doorX);
    wallWithDoors('x', 2.5, -24, 24, f, doorsN, 0xbfe0d0); wallWithDoors('x', -2.5, -24, 24, f, doorsS, 0xbfe0d0);
    [-12, 0, 12].forEach(x => { wall(x - T, x + T, 2.5, 12, f, 0xe8e4d4); wall(x - T, x + T, -12, -2.5, f, 0xe8e4d4); });
    // room signs + lockers
    ROOMS.filter(r => r.f === f).forEach(r => {
      const zs = r.side > 0 ? 2.5 - T - .02 : -2.5 + T + .02;
      sign(r.name, r.doorX + 2.4, y + 2.9, zs, r.side > 0 ? Math.PI : 0, 2.2, r.type === 'class' ? '#2f6fd6' : r.type === 'toilet' ? '#18b5b5' : r.type === 'staff' ? '#e8412c' : '#1f1a33');
      for (let k = -4; k <= -2; k++) {
        const x = r.doorX + k * .7 - .3, z = r.side * 2.2, front = z - r.side * .26;
        db(x, y + 1, z, .62, 2, .5, TM([0x527d9b, 0xb96551, 0x72916a, 0xd2a451][(k + r.i) & 3], LOCKER(), 'locker'));
        db(x + .19, y + 1.02, front, .055, .22, .045, 0xffe7bb);
        [1.55, 1.65, 1.75].forEach(h => db(x, y + h, front, .32, .025, .025, 0x416957));
        db(x, y + .12, front, .52, .06, .035, 0x416957);
      }
      // Dünne Wandverkleidung innerhalb bestehender Wände, Türen bleiben offen.
      const tint = new THREE.Color(wallMatFor(r.type)).multiplyScalar(.95 + (r.i % 3) * .025).getHex();
      [r.x0 + .126, r.x1 - .126].forEach(x => {
        db(x, y + WH / 2, (r.z0 + r.z1) / 2, .008, WH, 9.2, TM(tint, WALLTEX(), 'wall'));
        db(x, y + .13, (r.z0 + r.z1) / 2, .025, .22, 9.2, 0xb8aa8f);
      });
    });
    // fire alarm on each floor
    const ax = f ? 3.2 : -9, az = 2.35;
    box(ax, y + 1.5, az, .4, .5, .15, 0xe8412c); sign('FEUER', ax, y + 2, az - .09, Math.PI, .8, '#e8412c');
    INTER.push({ x: ax, y, z: az - .6, r: 1.6, label: 'Feueralarm auslösen', key: 'alarm' });
  }
  // stairs ramp
  const len = Math.hypot(RAMP.x1 - RAMP.x0, FH); const ramp = box((RAMP.x0 + RAMP.x1) / 2, FH / 2 - .1, (RAMP.z0 + RAMP.z1) / 2, len, .2, RAMP.z1 - RAMP.z0, 0xa0a0a0);
  ramp.rotation.z = Math.atan2(FH, RAMP.x1 - RAMP.x0);
  for (let i = 0; i < 12; i++) box(RAMP.x0 + (i + .5) * (RAMP.x1 - RAMP.x0) / 12, rampY(RAMP.x0 + (i + .5) * (RAMP.x1 - RAMP.x0) / 12) + .02, (RAMP.z0 + RAMP.z1) / 2, .08, .06, RAMP.z1 - RAMP.z0, 0x777777);
  WALLS.push({ x0: 14, x1: 21, z0: RAMP.z0, z1: RAMP.z1, f: 0, maxY: .3 }); // under-ramp
  box(17.5, .9, RAMP.z1 + .05, 7, 1.8, .1, 0x888888);
  wall(12, 21, RAMP.z1 - .05, RAMP.z1 + .15, 1, 0x999999, 1.1); wall(12.85, 12.95, -12, -7.5, 1, 0x999999, 1.1);
  WALLS.push({ x0: 13, x1: 21, z0: -12, z1: RAMP.z0 - .1, f: 0, maxY: 99 });
  // secret shortcut hole
  sign('GEHEIME ABKÜRZUNG', -19, FH + 1.2, -6.3, 0, 2.6, '#ffd23f', '#1f1a33');
  box(-19, FH - .1, HOLE.z0 - .1, 2.2, .25, .1, 0x553311);
  // ---- room contents ----
  let boardI = 0;
  ROOMS.forEach(r => {
    const y = r.y, s = r.side; const zIn = d => s > 0 ? 2.5 + d : -2.5 - d; const face = s > 0 ? 0 : Math.PI; // facing into room (toward board)
    if (r.type === 'class') {
      const seats = []; SEATS[r.i] = seats;
      [-3.4, 0, 3.4].forEach(dx => [3.6, 5.6, 7.6].forEach(d => {
        const x = r.cx + dx, z = zIn(d);
        box(x, y + .75, z, 1.3, .08, .62, woodMat(0xc99a5b)); box(x, y + .37, z, 1.15, .74, .5, woodMat(0x9a7a50));
        box(x, y + .45, zIn(d - .65), .5, .08, .45, 0x2f6fd6); box(x, y + .75, zIn(d - .88), .5, .6, .06, 0x2f6fd6);
        WALLS.push({ x0: x - .65, x1: x + .65, z0: z - .31, z1: z + .31, f: r.f });
        seats.push({ x, z: zIn(d - .7), y, ry: face, dz: zIn(d) });
      }));
      box(r.cx, y + 1.9, zIn(9.35), 6, 2, .1, boardTex(BOARD_TEXT[boardI++ % BOARD_TEXT.length])).rotation.y = s > 0 ? Math.PI : 0;
      box(r.cx, y + 1.9, zIn(9.42), 6.3, 2.2, .06, woodMat(0x7a5a32));
      box(r.cx + 3.2, y + .45, zIn(8.2), 1.8, .9, .8, woodMat(0x7a5a32)); WALLS.push({ x0: r.cx + 2.3, x1: r.cx + 4.1, z0: Math.min(zIn(7.8), zIn(8.6)), z1: Math.max(zIn(7.8), zIn(8.6)), f: r.f });
      FRONT[r.i] = { front: { x: r.cx - 1, z: zIn(8.4) }, board: { x: r.cx + rnd(-1.5, 1.5), z: zIn(9) }, desk: { x: r.cx + 3.2, z: zIn(8.9) }, back: { x: r.cx, z: zIn(2.2) }, ry: face + Math.PI, boardRy: face, aisles: [-1.7, 1.7].flatMap(dx => [3, 5, 7].map(d => ({ x: r.cx + dx, z: zIn(d) }))) };
    } else if (r.type === 'toilet') {
      for (let k = 0; k < 3; k++) { const x = r.x0 + 1.5 + k * 1.8; box(x, y + .4, zIn(8.6), .7, .8, .9, 0xffffff); box(x + .9, y + 1.1, zIn(7.6), .08, 2.2, 2.6, 0x7fb3d5); }
      box(r.x1 - 1.5, y + .9, zIn(4), .9, .2, 2.5, 0xffffff);
      sign(r.f ? 'WC 🚽 OG' : 'WC 🚽 EG', r.cx, y + 2.8, zIn(9.4) - s * .01, s > 0 ? Math.PI : 0, 2.4, '#18b5b5');
    } else if (r.type === 'library') {
      for (let k = 0; k < 4; k++) { const z = zIn(3.5 + k * 1.6); box(r.cx, y + 1.1, z, 8, 2.2, .5, woodMat(0x7a4a2a)); for (let b = 0; b < 16; b++) box(r.cx - 3.7 + b * .5, y + 1.1 + (b % 3 - 1) * .55, z - s * .26, .4, .45, .05, [0xe8412c, 0x2f6fd6, 0xffb000, 0x36b45a][b & 3]); WALLS.push({ x0: r.cx - 4, x1: r.cx + 4, z0: z - .25, z1: z + .25, f: r.f }); }
      INTER.push({ x: r.cx + 4.8, y, z: zIn(4), r: 1.8, label: 'Spickzettel aus Buch basteln', key: 'item', item: 'spick', cd: 25 });
    } else if (r.type === 'buffet') {
      box(r.cx + 3, y + 1.2, zIn(8.8), 1.6, 2.4, 1, 0xe8412c); box(r.cx + 3, y + 1.5, zIn(8.25), 1.2, 1.2, .05, 0x9fdcff);
      sign('AUTOMAT', r.cx + 3, y + 2.25, zIn(8.27), s > 0 ? Math.PI : 0, 1.2, '#ffd23f', '#1f1a33');
      WALLS.push({ x0: r.cx + 2.2, x1: r.cx + 3.8, z0: Math.min(zIn(8.3), zIn(9.3)), z1: Math.max(zIn(8.3), zIn(9.3)), f: r.f });
      INTER.push({ x: r.cx + 3, y, z: zIn(7.5), r: 1.8, label: 'Automat (Zufallsitem)', key: 'item', item: 'rand', cd: 20 });
      box(r.cx - 2, y + .45, zIn(5), 5, .9, 1.2, woodMat(0xc99a5b));
    } else if (r.type === 'staff') {
      box(r.cx, y + .45, zIn(5.5), 6, .9, 2.4, woodMat(0x7a5a32)); WALLS.push({ x0: r.cx - 3, x1: r.cx + 3, z0: Math.min(zIn(4.3), zIn(6.7)), z1: Math.max(zIn(4.3), zIn(6.7)), f: r.f });
      box(r.cx - 2, y + 1.05, zIn(5.5), .5, .3, .4, 0xe8412c); // test folder
      box(r.cx + 2, y + 1.15, zIn(5.5), .7, .5, .1, 0x222222); // pc
      box(r.x1 - 1, y + 1, zIn(8.8), .8, 2, .8, 0x333333); // coffee machine
      sign('LEHRERZIMMER – BETRETEN VERBOTEN', r.doorX - 2.6, y + 2.9, s > 0 ? 2.5 - T - .03 : -2.5 + T + .03, s > 0 ? Math.PI : 0, 3.2, '#e8412c');
      INTER.push({ x: r.cx - 2, y, z: zIn(4), r: 1.6, label: 'Testmappe stehlen', key: 'item', item: 'loesung', cd: 60, risky: 1 });
      INTER.push({ x: r.cx + 2, y, z: zIn(4), r: 1.6, label: 'Noten manipulieren (+60)', key: 'grades', cd: 90, risky: 1 });
      INTER.push({ x: r.cx, y, z: zIn(7.4), r: 1.6, label: 'Prüfungskalender lesen', key: 'calendar', risky: 1 });
      [[-2, 4], [0, 4], [2, 4], [-2, 7], [2, 7]].forEach(([dx, d]) => STAFFSPOTS.push({ x: r.cx + dx, z: zIn(d), y, ry: d < 5 ? face : face + Math.PI }));
    } else if (r.type === 'office') {
      box(r.cx, y + .45, zIn(7), 3, .9, 1.2, woodMat(0x5a3a22)); box(r.cx, y + 1.2, zIn(9.3), 2, 1, .06, 0xffd23f);
      WALLS.push({ x0: r.cx - 1.5, x1: r.cx + 1.5, z0: Math.min(zIn(6.4), zIn(7.6)), z1: Math.max(zIn(6.4), zIn(7.6)), f: r.f });
      INTER.push({ x: r.cx, y, z: zIn(5.6), r: 1.8, label: 'Stempel klauen (Entschuldigung)', key: 'item', item: 'ausrede', cd: 45, risky: 1 });
    }
  });
  // plant + benches in hallways
  for (let f = 0; f < 2; f++) for (let x = -18; x <= 18; x += 12) { box(x, f * FH + .35, -1.9, 2.2, .45, .45, woodMat(0x7a5a32)); }
  decor.forEach((matrices, col) => { const mesh = new THREE.InstancedMesh(BOX, typeof col === 'number' ? M(col) : col, matrices.length); matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.instanceMatrix.needsUpdate = true; scene.add(mesh); });
}
buildWorld();
const ROUTE_STAIRS_UP = [[18, 0, -4.6], [12.6, 0, -5.2], [12.6, 0, -9.5], [RAMP.x1, FH, -9.5], [22.5, FH, -9.5], [22.5, FH, -5], [18, FH, -4.6]];

function collide(x, z, nx, nz, rad, y) {
  const f = floorOf(y);
  for (const w of WALLS) {
    if (w.f !== f) continue; if (w.maxY !== undefined && y > w.maxY) continue;
    if (nx > w.x0 - rad && nx < w.x1 + rad && nz > w.z0 - rad && nz < w.z1 + rad) {
      // push out along minimal axis
      const dl = nx - (w.x0 - rad), dr = (w.x1 + rad) - nx, db = nz - (w.z0 - rad), dt = (w.z1 + rad) - nz;
      const m = Math.min(dl, dr, db, dt);
      if (m === dl) nx = w.x0 - rad; else if (m === dr) nx = w.x1 + rad; else if (m === db) nz = w.z0 - rad; else nz = w.z1 + rad;
    }
  }
  return [nx, nz];
}

// ---------------- characters & ragdolls ----------------
// joints: 0 head,1 neck,2 pelvis,3 handL,4 handR,5 footL,6 footR,7 shL,8 shR,9 hipL,10 hipR
const STICKS = [[0, 1], [1, 7], [1, 8], [7, 8], [1, 2], [7, 2], [8, 2], [2, 9], [2, 10], [9, 10], [7, 9], [8, 10], [7, 10], [8, 9], [7, 3], [8, 4], [9, 5], [10, 6], [0, 7], [0, 8]];
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
function labelSprite(text, bg = 'rgba(31,26,51,.8)', fg = '#fffdf2', scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, depthWrite: false, transparent: true })); s.renderOrder = 10;
  s.userData = { c, t, text: null, bg, fg, scale }; setLabel(s, text); return s;
}
function setLabel(s, text) {
  const u = s.userData; if (u.text === text) return; u.text = text; const g = u.c.getContext('2d'); g.clearRect(0, 0, 512, 96);
  if (!text) { s.visible = false; return; } s.visible = true;
  g.font = '40px "Patrick Hand","Comic Sans MS",cursive'; const w = Math.min(500, g.measureText(text).width + 30);
  g.fillStyle = u.bg; g.beginPath(); g.roundRect ? g.roundRect(256 - w / 2, 10, w, 70, 18) : g.rect(256 - w / 2, 10, w, 70); g.fill();
  g.fillStyle = u.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 47, 490); u.t.needsUpdate = true;
  s.scale.set(3.4 * u.scale, .64 * u.scale, 1);
}
const SPH = new THREE.SphereGeometry(.5, 12, 8), CYL = new THREE.CylinderGeometry(.5, .5, 1, 10), CONE = new THREE.ConeGeometry(.5, 1, 12), TOR = new THREE.TorusGeometry(.5, .09, 6, 16);
function ball(x, y, z, sx, sy, sz, mat, parent) { const m = new THREE.Mesh(SPH, typeof mat === 'number' ? M(mat) : mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; }
// Kleine Geometrie-Palette: deterministische Beulen ohne Risse an UV-Naht/Polen.
const potatoCache = new Map();
function potato(seed) {
  const key = seed % 32; if (potatoCache.has(key)) return potatoCache.get(key);
  const r = mulberry(key + 781), geo = SPH.clone(), p = geo.attributes.position;
  const phase = r() * 6.28, lean = (r() - .5) * .13;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const bump = 1 + .065 * Math.sin(x * 11 + y * 7 + phase) * Math.cos(z * 9 - phase) + .035 * Math.sin(y * 15 + phase);
    p.setXYZ(i, x * bump + lean * y, y * bump, z * bump);
  }
  geo.computeVertexNormals(); potatoCache.set(key, geo); return geo;
}
function makeChar(opts) {
  const o = Object.assign({ col: 0xe8412c, skin: 0xf2c79b, hair: 0x4a2a12, pants: 0x2b3a67, sz: 1, teacher: false, name: '', hat: -1 }, opts);
  const g = new THREE.Group(); scene.add(g);
  const h = hashStr(o.name + o.col); const r = mulberry(h);
  const kind = o.teacher ? 'tweed' : (o.shirt || SHIRTS[h % SHIRTS.length]);
  const sk = M(o.skin), body = o.teacher ? TM(o.col, TWEED(), 'tweed') : new THREE.MeshLambertMaterial({ map: shirtTex(o.col, kind, h % 97), flatShading: true }), pants = TM(o.pants, DENIM(), 'denim');
  body.flatShading = true;
  const faceM = new THREE.MeshLambertMaterial({ map: faceTex(o.skin, h % 53), flatShading: true });
  const mk = (geo, w, d, mat) => { const m = new THREE.Mesh(geo, mat); m.userData.w = w; m.userData.d = d; g.add(m); return m; };
  const s = o.sz;
  // big round potato head
  const head = new THREE.Mesh(potato(h), faceM); head.scale.set((o.teacher ? 1.05 : 1.02) * s, .98 * s, .94 * s); g.add(head);
  const eyes = []; const big = r() < .5 ? 0 : 1;
  [-.21, .21].forEach((x, i) => { const es = i === big ? .48 : .38; const e = ball(x, .12 + (i === big ? .03 : 0), .38, es, es, es * .7, 0xffffff, head); const p = ball(0, 0, .45, .47, .51, .24, 0x222032, e); ball(-.1, .12, .11, .16, .16, .1, 0xffffff, p); eyes.push(p); });
  [-1, 1].forEach(sd => ball(sd * .31, -.12, .37, .22, .12, .075, 0xef918c, head)); // Apfelbacken
  ball(0, -.2, .43, .34, .1 + r() * .08, .1, 0x6b2020, head); // mouth
  if (r() < .45) box(r() < .5 ? .05 : -.05, -.25, .47, .08, .08, .03, M(0xffffff), head); // buck tooth
  if (o.teacher) {
    ball(0, -.02, .52, .26, .22, .26, 0xff8f7a, head); // clown-ish nose
    [-.21, .21].forEach(x => { const t = new THREE.Mesh(TOR, M(0x111111)); t.position.set(x, .14, .5); t.scale.set(.55, .52, .32); head.add(t); });
    box(0, .14, .52, .13, .035, .04, 0x222032, head);
    if (o.must) [-1, 1].forEach(sd => { const m = ball(sd * .12, -.14, .49, .3, .12, .15, M(o.hair), head); m.rotation.z = sd * -.22; }); // Schnauzer
    [-.46, .46].forEach(x => ball(x, .1, -.05, .18, .32, .36, M(o.hair), head)); // side tufts, shiny bald top
  } else {
    const hat = o.hat >= 0 ? o.hat : h % 7;
    if (hat === 0) ball(0, .3, -.05, 1.0, .5, 1.0, M(o.hair), head);
    else if (hat === 1) { const c = new THREE.Mesh(CONE, M([0xffd23f, 0x36b45a, 0xff6fb5][h % 3])); c.position.set(.05, .62, 0); c.scale.set(.45, .55, .45); c.rotation.z = -.25; head.add(c); ball(.18, .9, 0, .12, .12, .12, 0xffffff, head); }
    else if (hat === 2) { ball(0, .25, 0, .95, .55, .95, M(o.col), head); const pr = box(0, .55, 0, .9, .03, .12, M(0xe8412c), head); pr.userData.spin = 1; box(0, .5, 0, .05, .12, .05, M(0x333333), head); o.prop = pr; }
    else if (hat === 3) { box(0, .55, 0, .03, .35, .03, M(0x333333), head); ball(0, .75, 0, .16, .16, .16, 0xe8412c, head); ball(0, .38, 0, .7, .2, .7, M(o.hair), head); }
    else if (hat === 4) { ball(0, .28, 0, 1.02, .5, 1.02, M([0x2f6fd6, 0xe8412c, 0x9b59b6][h % 3]), head); ball(0, .6, 0, .22, .22, .22, 0xffffff, head); }
    else if (hat === 5) { ball(0, .32, -.04, 1.03, .52, 1.03, M(o.col), head); ball(.08, .28, .4, .82, .1, .62, M(o.col), head); }
    else if (hat === 6) { [-.21, .21].forEach(x => { const rim = new THREE.Mesh(TOR, M(0x59364f)); rim.position.set(x, .13, .54); rim.scale.set(.56, .53, .28); head.add(rim); }); box(0, .13, .54, .14, .04, .04, 0x59364f, head); }
  }
  const beard = ball(0, -.45, .2, .9, .6, .6, 0xdddddd, head); beard.visible = false;
  // egg body
  const torso = mk(potato(h + 13), (o.teacher ? 1.28 : 1.15) * s, (o.teacher ? 1.02 : .94) * s, body);
  if (!o.teacher) {
    const bag = M([0x525c87, 0xd69c45, 0x679580][h % 3]);
    ball(0, .03, -.49, .7, .65, .38, bag, torso); ball(0, -.12, -.65, .45, .24, .12, bag, torso);
    [-.27, .27].forEach(x => box(x, .13, -.33, .085, .55, .12, 0xffe0ac, torso));
  } else {
    const tie = box(0, .11, .5, .14, .4, .045, 0xe8412c, torso); tie.rotation.z = -.14;
    ball(0, .34, .47, .18, .14, .1, 0xffd23f, torso);
  }
  ball(0, -.05, .47, .14, .1, .05, 0xffffff, torso); // belly button / badge
  const limbs = [mk(SPH, .29 * s, .29 * s, M(o.col, { flatShading: true })), mk(SPH, .29 * s, .29 * s, M(o.col, { flatShading: true })), mk(CYL, .18 * s, .18 * s, pants), mk(CYL, .18 * s, .18 * s, pants)];
  const hands = [ball(0, 0, 0, .29 * s, .27 * s, .29 * s, sk, g), ball(0, 0, 0, .29 * s, .27 * s, .29 * s, sk, g)];
  if (o.teacher) {
    // Hand-Skalierung ausgleichen, damit Papier und Klemme nicht mitschrumpfen.
    const clip = new THREE.Group(); clip.position.set(.14, -.35, .4); clip.scale.set(1 / .29, 1 / .27, 1 / .29); clip.rotation.z = -.18; hands[0].add(clip);
    box(0, 0, 0, .36, .48, .055, 0x9b7048, clip);
    box(0, -.01, .035, .29, .36, .012, 0xfff0ce, clip); box(0, .21, .045, .14, .07, .025, 0x777e87, clip);
  }
  const shoeM = M(o.teacher ? 0x3a2a1a : [0xffffff, 0xe8412c, 0xffd23f, 0x111111][h % 4]);
  const feet = [ball(0, 0, 0, .36 * s, .24 * s, .48 * s, shoeM, g), ball(0, 0, 0, .36 * s, .24 * s, .48 * s, shoeM, g)];
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.55 * s, 14), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  const tag = labelSprite(o.name, o.teacher ? 'rgba(232,65,44,.85)' : 'rgba(31,26,51,.75)', '#fffdf2', .5); scene.add(tag);
  const bub = labelSprite('', 'rgba(255,253,242,.95)', '#1f1a33', .8); scene.add(bub);
  const J = Array.from({ length: 11 }, () => new THREE.Vector3());
  const ch = { g, head, torso, limbs, hands, feet, eyes, beard, shadow, tag, bub, J, prop: o.prop, parts: [head, torso, ...limbs, ...hands, ...feet], sz: s, x: 0, y: 0, z: 0, ry: 0, ph: 0, spd: 0, pose: 'idle', rg: null, blend: 0, bubT: 0, wob: r() * 10, skel: false, teacher: o.teacher };
  return ch;
}
function removeChar(ch) { [ch.g, ch.shadow, ch.tag, ch.bub].forEach(o => scene.remove(o)); }
const LP = Array.from({ length: 11 }, () => new THREE.Vector3());
function poseLocal(ch, t) {
  const s = ch.sz, p = ch.pose, sp = ch.spd; const a = Math.sin(ch.ph) * Math.min(1, sp / 4) * .8;
  const sit = p === 'sit', bob = sit ? 0 : Math.abs(Math.sin(ch.ph)) * .06 * Math.min(1, sp / 3);
  const hipY = (sit ? .5 : .6 + bob * 2) * s;
  LP[2].set(0, hipY, 0); LP[1].set(Math.sin(ch.ph) * .06 * Math.min(1, sp / 3), hipY + .78 * s, sp > 5 ? .15 : 0); LP[0].set(LP[1].x, LP[1].y + .5 * s, LP[1].z + (p === 'write' ? .12 : 0));
  LP[7].set(.5 * s, LP[1].y - .28 * s, LP[1].z); LP[8].set(-.5 * s, LP[1].y - .28 * s, LP[1].z);
  LP[9].set(.22 * s, hipY, 0); LP[10].set(-.22 * s, hipY, 0);
  const al = .5 * s, ll = .52 * s;
  if (p === 'write' || p === 'phone') { LP[3].copy(LP[7]).add(_v.set(-.12, -.25, .45)); LP[4].copy(LP[8]).add(_v.set(.12, p === 'phone' ? .05 : -.25, .45)); LP[4].x += Math.sin(t * 25) * .04 * (p === 'write'); }
  else if (p === 'raise') { LP[3].copy(LP[7]).add(_v.set(.05, -al * Math.cos(a), al * Math.sin(a))); LP[4].copy(LP[8]).add(_v.set(-.1, al, .1 + Math.sin(t * 12) * .1)); }
  else if (p === 'panic') { LP[3].copy(LP[7]).add(_v.set(.2, al * .9, Math.sin(t * 20) * .3)); LP[4].copy(LP[8]).add(_v.set(-.2, al * .9, Math.cos(t * 20) * .3)); }
  else if (p === 'coffee') { LP[3].copy(LP[7]).add(_v.set(0, -al, 0)); LP[4].copy(LP[8]).add(_v.set(.15, -.1, .4)); }
  else if (p === 'point') { LP[3].copy(LP[7]).add(_v.set(0, -al, 0)); LP[4].copy(LP[8]).add(_v.set(0, .15, al)); }
  else { LP[3].copy(LP[7]).add(_v.set(.05, -al * Math.cos(a), al * Math.sin(a))); LP[4].copy(LP[8]).add(_v.set(-.05, -al * Math.cos(-a), al * Math.sin(-a))); }
  if (sit) { LP[5].copy(LP[9]).add(_v.set(.05, -.36 * s, .38 * s)); LP[6].copy(LP[10]).add(_v.set(-.05, -.36 * s, .38 * s)); }
  else { LP[5].copy(LP[9]).add(_v.set(0, -ll * Math.cos(-a), ll * Math.sin(-a))); LP[6].copy(LP[10]).add(_v.set(0, -ll * Math.cos(a), ll * Math.sin(a))); }
  if (p === 'nap') { LP[0].set(0, LP[1].y - .05, LP[1].z + .35); }
  const c = Math.cos(ch.ry), sn = Math.sin(ch.ry);
  for (let i = 0; i < 11; i++) { const v = LP[i]; const x = v.x * c + v.z * sn, z = -v.x * sn + v.z * c; v.set(ch.x + x, ch.y + v.y, ch.z + z); }
}
function startRagdoll(ch, vx = 0, vy = 4, vz = 0, dur = 2.6, spin = 3) {
  if (!ch.rg) { poseLocal(ch, performance.now() / 1000); }
  const src = ch.rg ? ch.rg.p : LP;
  const p = src.map(v => v.clone()); const dt = 1 / 60;
  const o = p.map((v, i) => { const sw = (i === 0 || i > 2 ? spin : 0); return v.clone().sub(_v.set((vx + rnd(-sw, sw)) * dt, (vy + rnd(-sw, sw) * .5) * dt, (vz + rnd(-sw, sw)) * dt)); });
  const len = STICKS.map(([a, b]) => p[a].distanceTo(p[b]));
  ch.rg = { p, o, len, t: 0, dur, acc: 0 }; ch.blend = 1;
}
function stepRagdoll(ch, dt) {
  const r = ch.rg; r.t += dt; r.acc += Math.min(dt, .1); const h = 1 / 60;
  while (r.acc >= h) {
    r.acc -= h;
    for (let i = 0; i < 11; i++) {
      const p = r.p[i], o = r.o[i]; const vx = (p.x - o.x) * .99, vy = (p.y - o.y) * .99, vz = (p.z - o.z) * .99; o.copy(p); p.x += vx; p.y += vy - 18 * h * h; p.z += vz;
    }
    for (let k = 0; k < 4; k++) {
      STICKS.forEach(([a, b], j) => { const pa = r.p[a], pb = r.p[b]; _v.subVectors(pb, pa); const d = _v.length() || 1e-4; const diff = (d - r.len[j]) / d * .5; _v.multiplyScalar(diff); pa.add(_v); pb.sub(_v); });
      for (let i = 0; i < 11; i++) {
        const p = r.p[i], o = r.o[i]; const gy = groundAt(p.x, p.z, p.y + .3) + .09;
        if (p.y < gy) { p.y = gy; o.x = lerp(o.x, p.x, .35); o.z = lerp(o.z, p.z, .35); if (o.y < p.y - .05) o.y = p.y + (p.y - o.y) * .3; }
        const [nx, nz] = collide(p.x, p.z, p.x, p.z, .1, p.y); if (nx !== p.x || nz !== p.z) { p.x = nx; p.z = nz; }
      }
    }
  }
}
const _basis = new THREE.Matrix4(), _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
function renderChar(ch, t, dt) {
  const J = ch.J;
  if (ch.rg) {
    stepRagdoll(ch, dt);
    if (ch.rg.t > ch.rg.dur && ch.rg.dur > 0) { ch.rg = null; ch.blend = 1; }
    else { for (let i = 0; i < 11; i++) J[i].copy(ch.rg.p[i]); }
  }
  if (!ch.rg) {
    ch.aspd = lerp(ch.aspd || 0, ch.spd, 1 - Math.exp(-10 * dt)); const realSpd = ch.spd; ch.spd = ch.aspd;
    poseLocal(ch, t); ch.spd = realSpd;
    const jump = !ch.posed || J[2].distanceTo(LP[2]) > 2.5; ch.posed = true;
    if (jump) { for (let i = 0; i < 11; i++) J[i].copy(LP[i]); ch.blend = 0; }
    else { const k = ch.blend > 0 ? 1 - Math.exp(-6 * dt) : 1 - Math.exp(-22 * dt); ch.blend = Math.max(0, ch.blend - dt * 2.5); for (let i = 0; i < 11; i++) J[i].lerp(LP[i], k); }
  }
  // torso basis
  _bx.subVectors(J[7], J[8]).normalize(); _by.subVectors(J[1], J[2]); const tl = _by.length(); _by.normalize();
  _bz.crossVectors(_bx, _by).normalize(); _bx.crossVectors(_by, _bz).normalize();
  _basis.makeBasis(_bx, _by, _bz); _q.setFromRotationMatrix(_basis);
  const tor = ch.torso; tor.position.addVectors(J[1], J[2]).multiplyScalar(.5).addScaledVector(_by, -.05); tor.quaternion.copy(_q); ch.sq = lerp(ch.sq || 0, 0, 1 - Math.exp(-9 * dt)); const breath = ch.rg ? 0 : Math.sin(t * 2.2 + ch.wob) * .025; const sq = clamp(ch.sq, -.35, .35); tor.scale.set(tor.userData.w * (1 - sq * .5 + breath), (tl + .5 * ch.sz) * (1 + sq), tor.userData.d * (1 - sq * .5 + breath));
  ch.head.position.copy(J[0]).addScaledVector(_by, .05 * ch.sz); ch.head.quaternion.copy(_q);
  if (!ch.rg) ch.head.rotateZ(Math.sin(ch.wob * 2.3) * .08);
  ch.hands[0].position.copy(J[3]); ch.hands[1].position.copy(J[4]);
  ch.feet.forEach((f, i) => { f.position.copy(J[5 + i]); f.position.y -= .02; f.quaternion.copy(_q); f.position.addScaledVector(_bz, .1 * ch.sz); });
  if (ch.prop) ch.prop.rotation.y += dt * (8 + ch.spd * 4);
  if (ch.pose === 'nap' && !ch.rg) ch.head.rotateX(.6);
  [[7, 3], [8, 4], [9, 5], [10, 6]].forEach(([a, b], i) => {
    const m = ch.limbs[i]; _v.subVectors(J[b], J[a]); const l = _v.length(); m.position.addVectors(J[a], J[b]).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(UP, _v.normalize()); m.scale.set(m.userData.w, l + .1, m.userData.d);
  });
  // googly eyes
  ch.wob += dt; const jig = ch.rg ? 1 : .3 + Math.min(.7, ch.spd * .1); ch.eyes.forEach((e, i) => { e.position.x = Math.sin(ch.wob * (7 + i * 3) + i) * .22 * jig; e.position.y = Math.cos(ch.wob * (5 + i * 4)) * .22 * jig; });
  const gy = groundAt(J[2].x, J[2].z, J[2].y + .2);
  ch.shadow.position.set(J[2].x, gy + .03, J[2].z);
  ch.tag.position.set(J[0].x, J[0].y + .95 * ch.sz, J[0].z);
  ch.bub.position.set(J[0].x, J[0].y + 1.45 * ch.sz, J[0].z);
  if (ch.bubT > 0) { ch.bubT -= dt; if (ch.bubT <= 0) setLabel(ch.bub, ''); }
}
function say(ch, text, pitch = 1, dur = 3) { if (!ch) return; setLabel(ch.bub, text); ch.bubT = dur; const d = _v.set(ch.x, ch.y, ch.z).distanceTo(camera.position); if (d < 22) Snd.voice(text, pitch, .12 * (1 - d / 25)); }
