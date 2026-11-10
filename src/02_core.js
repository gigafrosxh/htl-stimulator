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
  streng: { spd: 2.3, view: 13, fov: 1.7, sus: 1.45, board: .22, nap: 0, tele: 0, forget: 0, fake: .75, label: TR('sehr streng') },
  entspannt: { spd: 1.3, view: 8, fov: 1.15, sus: .6, board: .32, nap: .28, tele: 0, forget: .15, fake: .2, label: TR('entspannt') },
  chaotisch: { spd: 2.9, view: 11, fov: 1.45, sus: 1.1, board: .25, nap: .05, tele: .28, forget: .2, fake: .5, label: TR('unberechenbar') },
  vergesslich: { spd: 1.6, view: 10, fov: 1.3, sus: .9, board: .3, nap: .1, tele: 0, forget: .5, fake: .35, label: TR('vergesslich') },
  direktor: { spd: 1.5, view: 15, fov: 1.8, sus: 2.1, board: 0, nap: 0, tele: 0, forget: 0, fake: .9, label: TR('Direktor') },
  supplier: { spd: 1.0, view: 6, fov: 1.0, sus: .4, board: .2, nap: .6, tele: 0, forget: 1, fake: .1, label: TR('Supplierlehrer') },
};
const ITEMS = {
  energy: { icon: '🥤', name: TR('Energy Drink'), desc: TR('Schneller laufen und mehr Zeit für die HÜ') },
  rechner: { icon: '🧮', name: TR('Taschenrechner'), desc: TR('Nächste HÜ oder nächster Test +35 %') },
  spick: { icon: '📜', name: TR('Spickzettel'), desc: TR('Nächste HÜ oder nächster Test +35 %') },
  ausrede: { icon: '📄', name: TR('Entschuldigung'), desc: TR('Rettet dich einmal vor einer Strafe') },
  loesung: { icon: '🗝️', name: TR('Testlösungen'), desc: TR('Beim nächsten Test gibt\'s ein Sehr gut') },
  banane: { icon: '🍌', name: TR('Bananenschale'), desc: TR('Hinlegen und warten, bis ein Lehrer drauftritt') },
};
const COLORS = ['#e8412c', '#2f6fd6', '#36b45a', '#ffb000', '#9b59b6', '#ff6fb5', '#18b5b5', '#8d5a2b'];
const DAYNAMES = TA(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag?!', 'Sonntag?!']);
const GRADE = q => q >= .9 ? [1, TR('Sehr gut')] : q >= .75 ? [2, TR('Gut')] : q >= .6 ? [3, TR('Befriedigend')] : q >= .45 ? [4, TR('Genügend')] : [5, TR('Nicht genügend')];

// Lehrersprüche bleiben deutsch im Netz (als Schlüssel) und werden erst beim Anzeigen übersetzt.
const SAY = N_({
  check: ['Hausübungskontrolle, Hefte raus!', 'So, dann zeigt mir mal eure Hausübungen.', 'Ich will jetzt eure Hausübungen sehen.'],
  sus: ['Was machst du da, {n}?', '{n}, ich seh dich.', 'Hm? {n}?', '{n}, ist das eine Hausübung für ein anderes Fach?'],
  caught: ['Erwischt, {n}!', '{n}! Das hat Konsequenzen!', 'Glaubst du, ich bin blind, {n}?', '{n}, sofort zu mir!'],
  question: ['Gute Frage! Also, die Wurzel aus Banane ist ungefähr ...', 'Äh. Das erklär ich euch an der Tafel. Ausführlich.', 'Spannend. Da muss ich ein bisschen ausholen.', 'Wie bitte? Na gut. *dreht sich zur Tafel*', 'Die Antwort ist 42. Ich zeig\'s euch.'],
  board: ['*kritzel kritzel*', 'Also, wie man hier sieht', '*quietsch*', 'Und genau das kommt zur Schularbeit!'],
  nap: ['Zzz', 'Zzz ... Hausübung ... zzz', '*schnarch*'],
  late: ['Zu spät, {n}. Das gibt einen Eintrag.', 'Ah, {n}. Schön, dass du auch noch kommst.'],
  tele: ['Na?', 'Überraschung!', 'Buh.', 'Ich bin überall.'],
  snitch: ['Danke, {s}. {n}, komm bitte nach vorne.', 'So ist das also, {n}?'],
  hit: ['Au! Wer war das?', 'Hat mich da grad ein Zettel getroffen?'],
  shove: ['Hey! Spinnst du?', 'Das sag ich dem Direktor!'],
  staff: ['Raus aus dem Lehrerzimmer!', 'Was macht ein Schüler im Lehrerzimmer?'],
  coffee: ['*schlürf*', 'Der Kaffee ist schon wieder kalt.', 'Noch 34 Jahre bis zur Pension.'],
  dir: ['Am Gang wird nicht gerannt!', 'Ich hab euch alle im Blick.', 'Hm.'],
});

// ---------------- audio ----------------
const Snd = (() => {
  let VOL = 1;
  let ac = null, master = null, on = true;
  function init() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5 * VOL; master.connect(ac.destination); } catch (e) { ac = null; } }
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
    init, voice, get on() { return on; }, set on(v) { on = v; }, set vol(v) { VOL = v; if (master) master.gain.value = .5 * v; },
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
// Bonbon-Abendhimmel: kräftig, warm, leicht lila. Alles darunter wird lila-warm ausgeleuchtet.
scene.background = new THREE.Color(0xe9a7d6);
scene.fog = new THREE.Fog(0xe9a7d6, 45, 125);
const camera = new THREE.PerspectiveCamera(74, 1, 0.05, 300);
scene.add(camera); // Kamera-Kinder (z. B. Effekte) brauchen die Kamera im Graph
scene.add(new THREE.HemisphereLight(0xfff0ff, 0x5b3d86, 0.95));
const sun = new THREE.DirectionalLight(0xffe2c4, 0.5); sun.position.set(20, 40, 15); scene.add(sun);
const sky = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#4b3bd6'); gr.addColorStop(.38, '#a768ff'); gr.addColorStop(.62, '#ff8fd0'); gr.addColorStop(.8, '#ffc38a'); gr.addColorStop(1, '#e9a7d6');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const m = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1; scene.add(m); return m;
})();
function onResize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', onResize); onResize();

const matCache = {};
const M = (c, o = {}) => { const k = c + JSON.stringify(o); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); };
const BOX = new THREE.BoxGeometry(1, 1, 1);
// Shared smooth palette for instanced scenery and characters.
const SPH = new THREE.SphereGeometry(.5, 28, 20), CYL = new THREE.CylinderGeometry(.5, .5, 1, 20), CONE = new THREE.ConeGeometry(.5, 1, 24), TOR = new THREE.TorusGeometry(.5, .09, 12, 32);
const SOFTBOX = (() => {
  // Project a subdivided cube onto a rounded cube; analytic normals keep seams smooth.
  const geo = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8), p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = clamp(x, -.36, .36), cy = clamp(y, -.36, .36), cz = clamp(z, -.36, .36);
    const dx = x - cx, dy = y - cy, dz = z - cz, len = Math.hypot(dx, dy, dz);
    p.setXYZ(i, cx + dx / len * .14, cy + dy / len * .14, cz + dz / len * .14);
    n.setXYZ(i, dx / len, dy / len, dz / len);
  }
  return geo;
})();
function softBox(x, y, z, w, h, d, mat, parent) {
  const m = new THREE.Mesh(SOFTBOX, typeof mat === 'number' ? M(mat) : mat);
  m.position.set(x, y, z); m.scale.set(w, h, d); parent.add(m); return m;
}
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
function noiseFill(g, w, h, base, amt = 14, n = 900) { amt *= .3; n = Math.floor(n * .4); g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (Math.random() - .5) * amt; g.fillStyle = v > 0 ? `rgba(255,255,255,${v / 100})` : `rgba(0,0,0,${-v / 100})`; g.fillRect(Math.random() * w, Math.random() * h, i % 3 ? 1 : 3, i % 3 ? 1 : 3); } }
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
const FH = 5, WH = 4.6; // Geschoss- und Wandhöhe: höhere, luftigere Räume
const CHAR_SCALE = .8; // Figuren kleiner als Möbel/Räume, damit alles proportional wirkt
const COLS = [-24, -12, 0, 12, 24];
const LAYOUT = [
  [0, 1, 0, '1A', 'class'], [0, 1, 1, '1B', 'class'], [0, 1, 2, 'Chemiesaal', 'class'], [0, 1, 3, '1C', 'class'],
  [0, -1, 0, 'Klo EG', 'toilet'], [0, -1, 1, 'Bibliothek', 'library'], [0, -1, 2, 'Buffet', 'buffet'], [0, -1, 3, 'Stiegenhaus', 'stairs'],
  [1, 1, 0, '2A', 'class'], [1, 1, 1, '2B', 'class'], [1, 1, 2, 'Physiksaal', 'class'], [1, 1, 3, 'Lehrerzimmer', 'staff'],
  [1, -1, 0, 'Klo OG', 'toilet'], [1, -1, 1, 'Zeichensaal', 'class'], [1, -1, 2, 'Direktion', 'office'], [1, -1, 3, 'Stiegenhaus', 'stairs'],
];
// Raumnamen sind auch IDs und bleiben deutsch, angezeigt wird TR(name).
N_(['1A', '1B', '1C', '2A', '2B', 'Chemiesaal', 'Klo EG', 'Bibliothek', 'Buffet', 'Stiegenhaus', 'Physiksaal', 'Lehrerzimmer', 'Klo OG', 'Zeichensaal', 'Direktion', 'Gang OG', 'Gang EG', 'Schulhof', 'Mathe', 'Deutsch', 'Englisch', 'Chemie', 'Physik', 'Geschichte', 'Biologie', 'Kunst']);
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
const wallMatFor = t => ({ class: 0x8fe0c8, toilet: 0x8fd6ff, staff: 0xff9cb0, office: 0xd2b0ff, library: 0xffc98a, buffet: 0xffdf80, stairs: 0xb6beff }[t] || 0xffd6b4);
// Tapete: helles Muster, das per Materialfarbe eingefärbt wird. Unten Holzvertäfelung, oben Streifen + Rauten.
const WALLTEX = () => cTex('wallpaper2', 256, 256, (g, w, h) => {
  const top = h * .76; g.fillStyle = '#fbf6f2'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(80,40,100,.07)'; g.fillRect(x, 0, 16, top); }
  g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 24; y < top - 12; y += 48) for (let x = 24; x < w; x += 32) { g.beginPath(); g.arc(x, y + (x / 32 % 2) * 24, 3, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(70,30,60,.28)'; g.fillRect(0, top, w, h - top);
  g.strokeStyle = 'rgba(255,245,235,.35)'; g.lineWidth = 2; for (let x = 8; x < w; x += 64) { g.beginPath(); g.roundRect ? g.roundRect(x, top + 16, 48, h - top - 34, 6) : g.rect(x, top + 16, 48, h - top - 34); g.stroke(); }
  g.fillStyle = 'rgba(255,250,240,.9)'; g.fillRect(0, top - 5, w, 7); g.fillStyle = 'rgba(70,30,60,.25)'; g.fillRect(0, top + 2, w, 2); g.fillRect(0, h - 10, w, 10);
}, [1, 1]);
// Box mit Welt-UVs: das Muster wird nicht gestreckt, egal wie lang die Wand ist.
function worldBoxGeo(w, h, d, tile = 1.8, vt = WH) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) { const [fu, fv] = dims[Math.floor(i / 4)]; uv.setXY(i, uv.getX(i) * fu / tile, uv.getY(i) * fv / vt); }
  return geo;
}
function wall(x0, x1, z0, z1, f, col = 0xe8e4d4, h = WH, collide = true) {
  if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
  let m;
  if (h > 3) { m = new THREE.Mesh(worldBoxGeo(x1 - x0, h, z1 - z0), TM(col, WALLTEX(), 'wall')); m.position.set((x0 + x1) / 2, f * FH + h / 2, (z0 + z1) / 2); scene.add(m); }
  else m = box((x0 + x1) / 2, f * FH + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, M(col));
  camBlockers.push(m);
  if (collide) WALLS.push({ x0, x1, z0, z1, f });
  return m;
}
const T = 0.12; // half wall thickness
function wallWithDoors(axis, c, a0, a1, f, doors, col, dw = 1.0) {
  // axis 'x': wall along x at z=c from a0..a1; doors are positions along axis
  const segs = []; let s = a0; [...doors].sort((a, b) => a - b).forEach(d => { segs.push([s, d - dw]); s = d + dw; }); segs.push([s, a1]);
  segs.forEach(([p, q]) => { if (axis === 'x') wall(p, q, c - T, c + T, f, col); else wall(c - T, c + T, p, q, f, col); });
  const DH = 2.9, lh = WH - DH; doors.forEach(d => { if (axis === 'x') box(d, f * FH + DH + lh / 2, c, dw * 2, lh, T * 2, woodMat(col)); else box(c, f * FH + DH + lh / 2, d, T * 2, lh, dw * 2, woodMat(col)); });
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
// Gemusterte Teppiche: dunkle Basis, Rautengitter, bunte Konfetti-Formen (Casino-Flur trifft Schulgang).
// Teppich: ruhige Basis, weiches Rautengitter, große runde Punkte. Sauber statt Konfetti-Chaos.
function carpetDraw(base, line, cols, seed) { return (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h); const q = w / 4;
  g.fillStyle = line;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if ((x + y) % 2) continue; g.beginPath(); g.moveTo(x * q + q / 2, y * q + 4); g.lineTo(x * q + q - 4, y * q + q / 2); g.lineTo(x * q + q / 2, y * q + q - 4); g.lineTo(x * q + 4, y * q + q / 2); g.closePath(); g.fill(); }
  for (let y = 0; y <= 4; y++) for (let x = 0; x <= 4; x++) { g.fillStyle = cols[(x + y * 2 + seed) % cols.length]; g.beginPath(); g.arc(x * q, y * q, 7, 0, 7); g.fill(); }
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (!((x + y) % 2)) continue; g.fillStyle = cols[(x + seed) % cols.length]; g.globalAlpha = .55; g.beginPath(); g.arc(x * q + q / 2, y * q + q / 2, 4, 0, 7); g.fill(); g.globalAlpha = 1; }
}; }
const texLino = texMat('hallCarpet', 256, 256, carpetDraw('#46307a', 'rgba(130,100,200,.55)', ['#5fe3d8', '#ff7fc0', '#ffd666'], 1), [20, 2.1]);
const texWood = TM(0xe0a060, cTex('woodFloor', 256, 256, woodDraw, [6, 4.75]), 'woodFloor');
const texTile = texMat('tile', 256, 256, (g, w, h) => {
  checker('#ffffff', '#3fd0d8')(g, w, h); const q = w / 2;
  for (let y = 0; y < h; y += q) for (let x = 0; x < w; x += q) { g.fillStyle = (x + y) / q % 2 ? 'rgba(255,255,255,.35)' : 'rgba(0,60,80,.15)'; g.beginPath(); g.moveTo(x + q / 2, y + 12); g.lineTo(x + q - 12, y + q / 2); g.lineTo(x + q / 2, y + q - 12); g.lineTo(x + 12, y + q / 2); g.closePath(); g.fill(); }
  g.strokeStyle = 'rgba(30,60,70,.35)'; g.lineWidth = 3; for (let k = 0; k <= w; k += q) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); }
}, [12, 9.5]);
const texCarpet = texMat('carpet', 256, 256, carpetDraw('#9a3050', 'rgba(200,90,110,.6)', ['#ffd666', '#ffb08a'], 0), [5, 4]);
const texCarpetOffice = texMat('carpetOffice', 256, 256, carpetDraw('#245a72', 'rgba(70,140,160,.6)', ['#7ff0e0', '#d0a8ff'], 0), [5, 4]);
const texCeil = texMat('ceil', 128, 128, (g, w, h) => {
  noiseFill(g, w, h, '#f4ecff', 10, 900); g.strokeStyle = 'rgba(80,60,120,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  g.fillStyle = 'rgba(80,60,120,.12)'; for (let i = 0; i < 60; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
}, [1, 1]);
const LIGHTM = new THREE.MeshBasicMaterial({ color: 0xfff4dc }), NEON_PINK = new THREE.MeshBasicMaterial({ color: 0xff4fb8 }), NEON_CYAN = new THREE.MeshBasicMaterial({ color: 0x3ff0e0 }), NEON_YEL = new THREE.MeshBasicMaterial({ color: 0xffd23f });
// Decke nur nach unten sichtbar: von oben (Lobby-Kamera) bleibt das Gebäude offen.
function ceiling(x0, x1, z0, z1, y) {
  const w = x1 - x0, d = z1 - z0, geo = new THREE.PlaneGeometry(w, d), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2, uv.getY(i) * d / 2);
  const m = new THREE.Mesh(geo, texCeil); m.rotation.x = Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); scene.add(m); return m;
}
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
const BOARD_TEXT = TA([['2 + 2 = Fisch', 'x = vielleicht', 'Hausübung: ALLES'], ['Der Hund, die Katze,', 'das Hausübung (?)', 'Diktat morgen!!'], ['H2O + Wurst = ?', 'NICHT trinken!!', 'Explosion ≠ gut'], ['1492: irgendwas', 'Napoleon: klein', 'Test bald (geheim)'], ['F = m · a · Pech', 'Schwerkraft: ja', 'Formel lernen!'], ['Zeichnet eine Katze,', 'aber realistisch', 'und mit Gefühl']]);

// Neonschilder: dunkles Feld, leuchtende Schrift mit Glühen und Leuchtrahmen.
function neonCol(c) { const col = new THREE.Color(c); const hsl = {}; col.getHSL(hsl); col.setHSL(hsl.h, Math.min(1, hsl.s + .2), Math.max(.62, hsl.l)); return '#' + col.getHexString(); }
function signTex(text, bg = '#1f1a33', fg = '#fffdf2', w = 512, h = 128) { return cTex('sign:' + [text, bg, fg, w, h].join('|'), w, h, (g) => {
  const n = bg === '#1f1a33' ? '#c58cff' : neonCol(bg);
  g.fillStyle = '#1a0f2e'; g.fillRect(0, 0, w, h);
  g.shadowColor = n; g.shadowBlur = 14; g.strokeStyle = n; g.lineWidth = 6; g.strokeRect(9, 9, w - 18, h - 18);
  let fs = Math.floor(h * .5); g.font = `${fs}px "Luckiest Guy", Impact, sans-serif`; while (g.measureText(text).width > w - 50 && fs > 10) { fs -= 2; g.font = `${fs}px "Luckiest Guy", Impact, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = n; g.shadowBlur = 22; g.fillText(text, w / 2, h / 2 + 3); g.fillText(text, w / 2, h / 2 + 3);
  g.shadowBlur = 4; g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `${fs * .96}px "Luckiest Guy", Impact, sans-serif`; g.fillText(text, w / 2, h / 2 + 3);
}); }
function sign(text, x, y, z, ry, w = 2.2, bg, fg) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: signTex(text, bg, fg) })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; }

const INTER = []; // interactables {x,y,z,r,label,fn,cond}
const SEATS = {}; // roomIndex -> [{x,z,y,ry}]
const FRONT = {}; // roomIndex -> {front:{x,z}, board:{x,z}, desk:{x,z}, back:{x,z}, ry (facing class)}
const STAFFSPOTS = [];

function buildWorld() {
  // Reine Kulisse: gleiche Farbe = ein Drawcall, keine Collider/Kamerablocker.
  const decor = new Map(), dm = new THREE.Object3D();
  const db = (x, y, z, w, h, d, col, geo = BOX, rx = 0, rz = 0) => {
    dm.position.set(x, y, z); dm.scale.set(w, h, d); dm.rotation.set(rx, 0, rz); dm.updateMatrix();
    if (!decor.has(geo)) decor.set(geo, new Map());
    const batch = decor.get(geo); if (!batch.has(col)) batch.set(col, []); batch.get(col).push(dm.matrix.clone());
  };
  const rounded = (x, y, z, w, h, d, col) => db(x, y, z, w, h, d, col, SOFTBOX);
  const table = (x, y, z, w, h, d, col, drawerSide = 0) => {
    rounded(x, y + h - .065, z, w, .13, d, woodMat(col));
    db(x, y + h - .19, z, w - .16, .13, d - .14, woodMat(col));
    [-1, 1].forEach(a => [-1, 1].forEach(b => {
      db(x + a * (w / 2 - .12), y + (h - .13) / 2, z + b * (d / 2 - .1), .09, h - .13, .09, 0x567b8b, CYL);
      rounded(x + a * (w / 2 - .12), y + .04, z + b * (d / 2 - .1), .12, .08, .12, 0x344b62);
    }));
    if (drawerSide) {
      rounded(x + w * .22, y + h - .29, z, w * .36, .3, d * .84, woodMat(0xc99a5b));
      rounded(x + w * .22, y + h - .29, z + drawerSide * d * .43, w * .32, .24, .035, 0xe6b777);
      rounded(x + w * .22, y + h - .29, z + drawerSide * d * .47, .22, .045, .06, 0xffe7bb);
    }
  };
  const chair = (x, y, z, side) => {
    rounded(x, y + .45, z, .5, .08, .45, 0x62badd);
    rounded(x, y + .81, z - side * .23, .5, .43, .075, 0x62badd);
    [-.18, .18].forEach(dx => {
      [-.16, .16].forEach(dz => db(x + dx, y + .21, z + dz, .055, .42, .055, 0x567b8b, CYL));
      db(x + dx, y + .67, z - side * .2, .045, .6, .045, 0x567b8b, CYL);
    });
  };
  const plant = (x, y, z) => {
    db(x, y + .24, z, .48, .48, .48, 0xe49b7b, CYL);
    db(x, y + .45, z, .53, .11, .53, 0xffcf9c, CYL);
    db(x, y + .51, z, .41, .025, .41, 0x674d42, CYL);
    db(x, y + .82, z, .045, .64, .045, 0x438264, CYL);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      db(x + Math.cos(a) * .16, y + .84 + (i % 2) * .16, z + Math.sin(a) * .16, .32, .6, .25, i % 2 ? 0x8dcc75 : 0x51ac82, SPH, Math.sin(a) * .6, -Math.cos(a) * .6);
    }
  };
  const windowDeco = (x, y, z, end = false) => {
    const b = (dx, dy, dz, w, h, d, c) => end ? db(x + dz, y + dy, z + dx, d, h, w, c) : db(x + dx, y + dy, z + dz, w, h, d, c);
    b(0, 0, 0, 2.65, 1.65, .12, 0xfff0ce); b(0, 0, Math.sign(end ? x : z) * .08, 2.35, 1.35, .04, 0x719fae);
    b(0, 0, 0, .1, 1.5, .26, 0xfff0ce); b(0, 0, 0, 2.45, .09, .26, 0xfff0ce);
    b(0, -.85, 0, 2.85, .14, .45, woodMat(0xc48257));
  };
  // outside
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), texGrass); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; scene.add(grass);
  for (let i = 0; i < 26; i++) { const a = rnd(Math.PI * 2), r = rnd(34, 70); const x = Math.cos(a) * r, z = Math.sin(a) * r; box(x, 1.2, z, .5, 2.4, .5, 0x7a5230); const s = rnd(2, 3.5); const t = box(x, 2.6 + s / 2, z, s, s, s, 0x3f9b3a); t.geometry = SPH; t.rotation.y = rnd(3); }
  box(-31, 0.01, 0, 14, .02, 5, 0xb0a890); // path
  sign(TR('SCHULE'), -24.39, FH + 2.4, 0, -Math.PI / 2, 5, '#e8412c');
  // Dachkante statt Dachplatte: OG bleibt von oben lesbar.
  [FH - .08, FH + WH + .08].forEach(y => {
    [-12.2, 12.2].forEach(z => db(0, y, z, 48.6, .24, .38, 0xb56c4e));
    [-24.2, 24.2].forEach(x => db(x, y, 0, .38, .24, 24.4, 0xb56c4e));
  });
  [-23.85, -12, 0, 12, 23.85].forEach(x => [-12.19, 12.19].forEach(z => db(x, (FH + WH) / 2, z, .35, FH + WH, .18, 0xffe7bb)));
  db(-24.35, 3.1, 0, .55, .35, 3.3, 0xb56c4e); // Eingang, lichte Breite bleibt frei
  [-1.48, 1.48].forEach(z => db(-24.22, 1.5, z, .32, 3, .22, 0xffe7bb));
  db(-24.28, FH + 2.4, 0, .16, 1.45, 5.4, 0xffe7bb);
  sign(TR('Kein Boom!'), -24.38, FH + .9, 0, -Math.PI / 2, 3.2, '#416957');
  const leafGeo = new THREE.SphereGeometry(1, 16, 10);
  [-1, 1].forEach(side => {
    const z = side * 7;
    rounded(-28, .405, z, 1.1, .09, 3.4, woodMat(0xc48257)); rounded(-28.45, .78, z, .16, .65, 3.4, woodMat(0xc48257));
    [-1.2, 1.2].forEach(d => db(-28, .18, z + d, .8, .36, .16, 0x416957));
    db(-27, .3, side * 10.5, 2.4, .6, 2, 0xb56c4e);
    for (let k = 0; k < 3; k++) { const leaf = new THREE.Mesh(leafGeo, M(k & 1 ? 0x7eac50 : 0x50894b)); leaf.position.set(-27.7 + k * .7, .9, side * 10.5); leaf.scale.set(.75, .7, .8); scene.add(leaf); }
    db(-32, 1.35, side * 12, .5, 2.7, .5, 0x7a5230);
    const crown = new THREE.Mesh(leafGeo, M(0x50894b)); crown.position.set(-32, 3.4, side * 12); crown.scale.set(2.2, 2.5, 1.9); crown.rotation.z = side * .15; scene.add(crown);
  });
  // floors
  for (let f = 0; f < 2; f++) {
    const y = f * FH;
    const hall = new THREE.Mesh(BOX, texLino); hall.scale.set(48, .2, 5); hall.position.set(0, y - .1, 0); scene.add(hall);
    ROOMS.filter(r => r.f === f).forEach(r => {
      const mat = r.type === 'toilet' ? texTile : r.type === 'staff' ? texCarpet : r.type === 'office' || r.type === 'library' ? texCarpetOffice : r.type === 'stairs' ? M(0x8f86c8) : texWood;
      const pieces = [];
      if (f === 1 && r.type === 'stairs') pieces.push([12, 24, -7.5, -2.5], [21, 24, -12, -7.5], [12, 13, -12, -7.5]);
      else if (f === 1 && r.name === 'Klo OG') pieces.push([r.x0, HOLE.x0, r.z0, r.z1], [HOLE.x1, r.x1, r.z0, r.z1], [HOLE.x0, HOLE.x1, r.z0, HOLE.z0], [HOLE.x0, HOLE.x1, HOLE.z1, r.z1]);
      else pieces.push([r.x0, r.x1, r.z0, r.z1]);
      pieces.forEach(([a, b, c, d]) => { const geo = BOX.clone(), uv = geo.attributes.uv;
        for (let i = 8; i < 16; i++) uv.setXY(i, (a + (uv.getX(i)) * (b - a)) / 12, (-d + uv.getY(i) * (d - c)) / 9.5);
        const m = new THREE.Mesh(geo, mat); m.scale.set(b - a, .2, d - c); m.position.set((a + b) / 2, y - .1, (c + d) / 2); scene.add(m); });
      if (f === 1) pieces.forEach(([a, b, c, d]) => ceiling(a, b, c, d, WH));
      [-.25, .25].forEach(k => db(r.cx + k * (r.x1 - r.x0), y + WH - .03, (r.z0 + r.z1) / 2, 2.2, .05, .7, LIGHTM));
    });
    if (f === 1) { ceiling(-24, 24, -2.5, 2.5, WH); ceiling(-24, 24, -12, 12, FH + WH); }
    for (let x = -21; x <= 21; x += 4) db(x, y + WH - .03, 0, 1.6, .05, .6, LIGHTM);
    [[2.5 - T - .04, NEON_PINK], [-2.5 + T + .04, NEON_CYAN]].forEach(([z, mt]) => { db(0, y + WH - .1, z, 48, .06, .06, mt); });
    // outer walls
    const ow = 0xffc48c;
    wall(-24, 24, 12 - T, 12 + T, f, ow); wall(-24, 24, -12 - T, -12 + T, f, ow); wall(24 - T, 24 + T, -12, 12, f, ow);
    if (f === 0) wallWithDoors('z', -24, -12, 12, 0, [0], ow, 1.3); else wall(-24 - T, -24 + T, -12, 12, f, ow);
    if (f === 0) { // Schulhof gibt's in dieser Version noch nicht: Ausgang verbarrikadiert
      WALLS.push({ x0: -24.3, x1: -23.6, z0: -1.4, z1: 1.4, f: 0 });
      const tape = texMat('barrier', 128, 32, (g, w, h) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f1a33'; for (let x = -h; x < w + h; x += 24) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 12, h); g.lineTo(x + 12 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); } }, [3, 1]);
      [[.75, .35], [1.55, -.35], [2.3, .2]].forEach(([y, rx]) => { const b = box(-23.8, y, 0, .12, .32, 3.1, tape); b.rotation.x = rx; });
      [-1.35, 1.35].forEach(z => box(-23.8, 1.25, z, .2, 2.5, .2, woodMat(0x9a6a3a)));
      sign(TR('COMING SOON'), -23.66, 2.85, 0, Math.PI / 2, 2.6, '#ff4fb8');
      const note = new THREE.Mesh(new THREE.PlaneGeometry(.9, .6), new THREE.MeshBasicMaterial({ map: cTex('soonNote', 192, 128, (g, w, h) => { g.fillStyle = '#fffdf2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f1a33'; g.font = '26px "Patrick Hand", cursive'; g.textAlign = 'center'; g.fillText(TR('Schulhof'), w / 2, 40); g.fillText(TR('kommt bald!'), w / 2, 72); g.font = '18px "Patrick Hand", cursive'; g.fillText(TR('Die Direktion'), w / 2, 108); }) }));
      note.position.set(-23.6, 1.15, .55); note.rotation.y = Math.PI / 2; note.rotation.z = .08; scene.add(note);
    }
    // windows on outer walls
    for (let x = -21; x <= 21; x += 6) { windowDeco(x, y + 2, 12.17); windowDeco(x, y + 2, -12.17); }
    [-8.5, -4.5, 4.5, 8.5].forEach(z => { windowDeco(-24.17, y + 2, z, true); windowDeco(24.17, y + 2, z, true); });
    // hallway walls with doors
    const doorsN = ROOMS.filter(r => r.f === f && r.side > 0).map(r => r.doorX), doorsS = ROOMS.filter(r => r.f === f && r.side < 0).map(r => r.doorX);
    const hc = f ? 0xc9b0ff : 0xffb3d6; wallWithDoors('x', 2.5, -24, 24, f, doorsN, hc); wallWithDoors('x', -2.5, -24, 24, f, doorsS, hc);
    [-12, 0, 12].forEach(x => { wall(x - T, x + T, 2.5, 12, f, 0xffd9a8); wall(x - T, x + T, -12, -2.5, f, 0xffd9a8); });
    // room signs + lockers
    ROOMS.filter(r => r.f === f).forEach(r => {
      const zs = r.side > 0 ? 2.5 - T - .02 : -2.5 + T + .02;
      sign(TR(r.name), r.doorX + 2.4, y + 2.9, zs, r.side > 0 ? Math.PI : 0, 2.2, r.type === 'class' ? '#2f6fd6' : r.type === 'toilet' ? '#18b5b5' : r.type === 'staff' ? '#e8412c' : '#1f1a33');
      for (let k = -4; k <= -2; k++) {
        const x = r.doorX + k * .7 - .3, z = r.side * 2.2, front = z - r.side * .26;
        rounded(x, y + 0.9, z, .62, 1.8, .5, TM([0x527d9b, 0xb96551, 0x72916a, 0xd2a451][(k + r.i) & 3], LOCKER(), 'locker'));
        rounded(x, y + 1.719, front, .49, 0.081, .035, 0xffe7bb);
        db(x - .2, y + 0.918, front, .025, 1.485, .025, 0x416957);
        db(x + .19, y + 0.756, front, .05, 0.045, .04, 0x344b62, CYL, Math.PI / 2);
        db(x + .19, y + 0.918, front, .055, 0.198, .045, 0xffe7bb);
        [1.395, 1.485, 1.575].forEach(h => db(x, y + h, front, .32, 0.0225, .025, 0x416957));
        db(x, y + 0.108, front, .52, 0.054, .035, 0x416957);
      }
      // Dünne Wandverkleidung innerhalb bestehender Wände, Türen bleiben offen.
      const tint = new THREE.Color(wallMatFor(r.type)).multiplyScalar(.95 + (r.i % 3) * .025).getHex();
      [r.x0 + .126, r.x1 - .126].forEach(x => {
        { const pm = new THREE.Mesh(worldBoxGeo(.008, WH, 9.2), TM(tint, WALLTEX(), 'wall')); pm.position.set(x, y + WH / 2, (r.z0 + r.z1) / 2); scene.add(pm); }
        db(x, y + .13, (r.z0 + r.z1) / 2, .025, .22, 9.2, 0xb8aa8f);
      });
      { const zf = r.side > 0 ? r.z1 - .126 : r.z0 + .126; const pm = new THREE.Mesh(worldBoxGeo(r.x1 - r.x0 - .26, WH, .008), TM(tint, WALLTEX(), 'wall')); pm.position.set(r.cx, y + WH / 2, zf); scene.add(pm); }
    });
    // fire alarm on each floor
    const ax = f ? 3.2 : -9, az = 2.35;
    box(ax, y + 1.5, az, .4, .5, .15, 0xe8412c); sign(TR('FEUER'), ax, y + 2, az - .09, Math.PI, .8, '#e8412c');
    INTER.push({ x: ax, y, z: az - .6, r: 1.6, label: TR('Feueralarm auslösen'), key: 'alarm' });
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
  sign(TR('GEHEIME ABKÜRZUNG'), -19, FH + 1.2, -6.3, 0, 2.6, '#ffd23f', '#1f1a33');
  box(-19, FH - .1, HOLE.z0 - .1, 2.2, .25, .1, 0x553311);
  // ---- room contents ----
  let boardI = 0;
  ROOMS.forEach(r => {
    const y = r.y, s = r.side; const zIn = d => s > 0 ? 2.5 + d : -2.5 - d; const face = s > 0 ? 0 : Math.PI; // facing into room (toward board)
    if (r.type === 'class') {
      const seats = []; SEATS[r.i] = seats;
      [-3.4, 0, 3.4].forEach(dx => [3.6, 5.6, 7.6].forEach(d => {
        const x = r.cx + dx, z = zIn(d);
        table(x, y, z, 1.3, .7, .62, 0xc99a5b);
        chair(x, y, zIn(d - .65), s);
        WALLS.push({ x0: x - .65, x1: x + .65, z0: z - .31, z1: z + .31, f: r.f });
        seats.push({ x, z: zIn(d - .7), y, ry: face, dz: zIn(d) });
      }));
      box(r.cx, y + 1.65, zIn(9.35), 5.2, 1.5, .1, boardTex(BOARD_TEXT[boardI++ % BOARD_TEXT.length])).rotation.y = s > 0 ? Math.PI : 0;
      rounded(r.cx, y + 1.65, zIn(9.42), 5.45, 1.7, .06, woodMat(0x7a5a32)); db(r.cx, y + 2.53, zIn(9.3), 5.5, .07, .07, [NEON_PINK, NEON_CYAN, NEON_YEL][r.i % 3]);
      table(r.cx + 3.2, y, zIn(8.2), 1.8, .74, .8, 0x7a5a32, s); WALLS.push({ x0: r.cx + 2.3, x1: r.cx + 4.1, z0: Math.min(zIn(7.8), zIn(8.6)), z1: Math.max(zIn(7.8), zIn(8.6)), f: r.f });
      rounded(r.cx, y + .83, zIn(9.19), 5.45, .1, .27, 0xcaa77b);
      db(r.cx - 1.7, y + .9, zIn(9.12), .27, .045, .045, 0xfff8dc);
      db(r.cx - 1.2, y + .9, zIn(9.12), .22, .045, .045, 0xffa7c8);
      rounded(r.cx + 1.8, y + .92, zIn(9.12), .34, .12, .16, 0x547c77);
      FRONT[r.i] = { front: { x: r.cx - 1, z: zIn(8.4) }, board: { x: r.cx + rnd(-1.5, 1.5), z: zIn(9) }, desk: { x: r.cx + 3.2, z: zIn(8.9) }, back: { x: r.cx, z: zIn(2.2) }, ry: face + Math.PI, boardRy: face, aisles: [-1.7, 1.7].flatMap(dx => [3, 5, 7].map(d => ({ x: r.cx + dx, z: zIn(d) }))) };
    } else if (r.type === 'toilet') {
      for (let k = 0; k < 3; k++) { const x = r.x0 + 1.5 + k * 1.8; db(x, y + 0.154, zIn(8.6), .4, 0.308, .48, 0xe8f6ff, SPH);
        db(x, y + 0.329, zIn(8.6), .7, 0.35, .9, 0xffffff, SPH);
        db(x, y + 0.476, zIn(8.56), .53, 0.0245, .69, 0x385d70, SPH);
        db(x, y + 0.49, zIn(8.56), .59, .76, .12, 0xfff9ed, TOR, Math.PI / 2);
        rounded(x, y + 0.525, zIn(8.92), .64, 0.476, .24, 0xe8f6ff);
        rounded(x, y + 0.777, zIn(8.92), .68, 0.056, .28, 0xffffff);
        rounded(x, y + 0.672, zIn(8.76), .48, 0.336, .06, 0xffffff); // raised lid
        rounded(x + .2, y + 0.665, zIn(8.77), .13, 0.035, .05, 0x82b5c9); box(x + .9, y + 1.1, zIn(7.6), .08, 2.2, 2.6, 0x7fb3d5); }
      { // Waschtisch an der Wand: Unterschrank, Platte, zwei Becken, Hähne und Spiegel
        const wx = r.x1 - T - .34, wz = zIn(4);
        rounded(wx, y + .38, wz, .62, .76, 2.5, 0x6fc7c9);
        rounded(wx, y + .8, wz, .68, .08, 2.6, 0xffffff);
        [-.6, .6].forEach(dz => {
          db(wx - .02, y + .83, wz + dz, .42, .06, .5, 0xd9eef7, SPH);
          db(wx + .22, y + .92, wz + dz, .05, .18, .05, 0xb8c4cc, CYL);
          db(wx + .14, y + 1.0, wz + dz, .2, .04, .04, 0xb8c4cc);
          rounded(r.x1 - T - .006, y + 1.55, wz + dz, .012, .88, .7, 0xffffff);
          box(r.x1 - T - .022, y + 1.55, wz + dz, .02, .8, .62, 0xbfe7f5);
        });
        WALLS.push({ x0: wx - .34, x1: r.x1, z0: wz - 1.3, z1: wz + 1.3, f: r.f });
      }
      sign(r.f ? TR('WC 🚽 OG') : TR('WC 🚽 EG'), r.cx, y + 2.8, zIn(9.4) - s * .01, s > 0 ? Math.PI : 0, 2.4, '#18b5b5');
    } else if (r.type === 'library') {
      for (let k = 0; k < 4; k++) {
        const z = zIn(3.5 + k * 1.6);
        rounded(r.cx, y + .9, z + s * .21, 8, 1.8, .08, woodMat(0x7a4a2a));
        [-3.94, 3.94].forEach(dx => rounded(r.cx + dx, y + .9, z, .12, 1.8, .5, woodMat(0xb4774a)));
        for (let row = 0; row < 4; row++) {
          rounded(r.cx, y + .08 + row * .43, z, 8, .08, .5, woodMat(0xd49b60));
          for (let b = 0; b < 20; b++) {
            const height = .25 + (b % 3) * .035;
            rounded(r.cx - 3.65 + b * .38, y + .12 + row * .43 + height / 2, z - s * .05, .26, height, .3, [0xf46687, 0x488cdb, 0xffc857, 0x50c8a2][(b + row) & 3]);
          }
        }
        rounded(r.cx, y + 1.78, z, 8, .08, .5, woodMat(0xd49b60));
        WALLS.push({ x0: r.cx - 4, x1: r.cx + 4, z0: z - .25, z1: z + .25, f: r.f });
      }
      INTER.push({ x: r.cx + 4.8, y, z: zIn(4), r: 1.8, label: TR('Spickzettel aus einem Buch basteln'), key: 'item', item: 'spick', cd: 25 });
    } else if (r.type === 'buffet') {
      rounded(r.cx + 3, y + 0.96, zIn(8.8), 1.6, 1.92, 1, 0xef677b);
      rounded(r.cx + 2.85, y + 1.2, zIn(8.25), .95, 0.96, .05, 0x34576d);
      for (let row = 0; row < 3; row++) {
        db(r.cx + 2.85, y + 0.824 + row * .28, zIn(8.18), .86, 0.036, .08, 0xffe7bb);
        for (let k = 0; k < 3; k++) db(r.cx + 2.57 + k * .28, y + 0.936 + row * .28, zIn(8.2), .16, 0.184, .16, [0xffc85c, 0x71d9c4, 0xf18fc0][k], CYL);
        db(r.cx + 3.57, y + 0.96 + row * .192, zIn(8.25), .12, 0.096, .055, NEON_CYAN, SPH);
      }
      rounded(r.cx + 3.57, y + 1.488, zIn(8.25), .2, 0.104, .05, 0xbaffd9);
      rounded(r.cx + 3, y + 0.344, zIn(8.25), .92, 0.24, .08, 0x344b62);
      rounded(r.cx + 3, y + 0.216, zIn(8.18), 1, 0.056, .15, 0xffe7bb);
      sign(TR('AUTOMAT'), r.cx + 3, y + 1.8, zIn(8.27), s > 0 ? Math.PI : 0, 1.2, '#ffd23f', '#1f1a33');
      WALLS.push({ x0: r.cx + 2.2, x1: r.cx + 3.8, z0: Math.min(zIn(8.3), zIn(9.3)), z1: Math.max(zIn(8.3), zIn(9.3)), f: r.f });
      INTER.push({ x: r.cx + 3, y, z: zIn(7.5), r: 1.8, label: TR('Automat (zufälliges Item)'), key: 'item', item: 'rand', cd: 20 });
      table(r.cx - 2, y, zIn(5), 5, .74, 1.2, 0xc99a5b);
    } else if (r.type === 'staff') {
      table(r.cx, y, zIn(5.5), 6, .74, 2.4, 0x7a5a32); WALLS.push({ x0: r.cx - 3, x1: r.cx + 3, z0: Math.min(zIn(4.3), zIn(6.7)), z1: Math.max(zIn(4.3), zIn(6.7)), f: r.f });
      rounded(r.cx - 2, y + .82, zIn(5.5), .5, .16, .4, 0xe8412c); // test folder
      rounded(r.cx + 2, y + .99, zIn(5.5), .7, .5, .1, 0x222222); // pc
      rounded(r.x1 - 1, y + .38, zIn(8.8), .8, .76, .8, woodMat(0xc99a5b));
      rounded(r.x1 - 1, y + 1.01, zIn(8.8), .58, .5, .52, 0x34576d);
      rounded(r.x1 - 1, y + 1.08, zIn(8.51), .3, .1, .04, NEON_CYAN); // coffee machine
      sign(TR('LEHRERZIMMER: ZUTRITT VERBOTEN'), r.doorX - 2.6, y + 2.9, s > 0 ? 2.5 - T - .03 : -2.5 + T + .03, s > 0 ? Math.PI : 0, 3.2, '#e8412c');
      INTER.push({ x: r.cx - 2, y, z: zIn(4), r: 1.6, label: TR('Testmappe klauen'), key: 'item', item: 'loesung', cd: 60, risky: 1 });
      INTER.push({ x: r.cx + 2, y, z: zIn(4), r: 1.6, label: TR('Noten ausbessern (+60)'), key: 'grades', cd: 90, risky: 1 });
      INTER.push({ x: r.cx, y, z: zIn(7.4), r: 1.6, label: TR('Prüfungskalender lesen'), key: 'calendar', risky: 1 });
      [[-2, 4], [0, 4], [2, 4], [-2, 7], [2, 7], [-4.2, 5.5]].forEach(([dx, d]) => STAFFSPOTS.push({ x: r.cx + dx, z: zIn(d), y, ry: d < 5 ? face : face + Math.PI }));
    } else if (r.type === 'office') {
      table(r.cx, y, zIn(7), 3, .74, 1.2, 0x5a3a22, -s); box(r.cx, y + 1.2, zIn(9.3), 2, 1, .06, 0xffd23f);
      WALLS.push({ x0: r.cx - 1.5, x1: r.cx + 1.5, z0: Math.min(zIn(6.4), zIn(7.6)), z1: Math.max(zIn(6.4), zIn(7.6)), f: r.f });
      INTER.push({ x: r.cx, y, z: zIn(5.6), r: 1.8, label: TR('Stempel klauen (Entschuldigung)'), key: 'item', item: 'ausrede', cd: 45, risky: 1 });
    }
  });
  // Pots sit beside existing lockers, away from door openings and walking routes.
  ROOMS.forEach(r => plant(r.doorX - 3.9, r.y, r.side * 2.14));
  // plant + benches in hallways
  for (let f = 0; f < 2; f++) for (let x = -18; x <= 18; x += 12) { rounded(x, f * FH + .225, -1.9, 2.2, .45, .45, woodMat(0x7a5a32)); }
  decor.forEach((batch, geo) => batch.forEach((matrices, col) => { const mesh = new THREE.InstancedMesh(geo, typeof col === 'number' ? M(col) : col, matrices.length); matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.instanceMatrix.needsUpdate = true; scene.add(mesh); }));
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
const EYEM = new THREE.MeshBasicMaterial({ color: 0xffffff });
function ball(x, y, z, sx, sy, sz, mat, parent) { const m = new THREE.Mesh(SPH, typeof mat === 'number' ? M(mat) : mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; }
// Kleine Geometrie-Palette: deterministische Beulen ohne Risse an UV-Naht/Polen.
const potatoCache = new Map();
function potato(seed) {
  const key = seed % 32; if (potatoCache.has(key)) return potatoCache.get(key);
  const r = mulberry(key + 781), geo = SPH.clone(), p = geo.attributes.position;
  const phase = r() * 6.28, lean = (r() - .5) * .06;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const bump = 1 + .009 * Math.sin(x * 11 + y * 7 + phase) * Math.cos(z * 9 - phase) + .006 * Math.sin(y * 15 + phase);
    p.setXYZ(i, x * bump + lean * y, y * bump, z * bump);
  }
  geo.computeVertexNormals(); potatoCache.set(key, geo); return geo;
}
function makeChar(opts) {
  const o = Object.assign({ col: 0xe8412c, skin: 0xf2c79b, hair: 0x4a2a12, pants: 0x2b3a67, sz: 1, teacher: false, name: '', hat: -1 }, opts);
  const g = new THREE.Group(); scene.add(g);
  const h = hashStr(o.name + o.col); const r = mulberry(h);
  const kind = o.teacher ? 'tweed' : (o.shirt || SHIRTS[h % SHIRTS.length]);
  const sk = M(o.skin), body = o.teacher ? TM(o.col, TWEED(), 'tweed') : TM(0xffffff, shirtTex(o.col, kind, h % 97), 'shirt:' + o.col + ':' + kind + ':' + h % 97), pants = TM(o.pants, DENIM(), 'denim');
  body.flatShading = false;
  const faceM = TM(0xffffff, faceTex(o.skin, h % 53), 'face:' + o.skin + ':' + h % 53);
  const mk = (geo, w, d, mat) => { const m = new THREE.Mesh(geo, mat); m.userData.w = w; m.userData.d = d; g.add(m); return m; };
  const s = o.sz * CHAR_SCALE;
  // big round potato head
  const head = new THREE.Mesh(potato(h), faceM); head.scale.set((o.teacher ? 1.05 : 1.02) * s, .98 * s, .94 * s); g.add(head);
  const eyes = []; const big = r() < .5 ? 0 : 1;
  // Große, leicht leuchtende Glubschaugen (unbeleuchtetes Weiß), dicke Augenbrauen.
  const browM = M(new THREE.Color(o.hair).multiplyScalar(.55).getHex()), angry = r() < .45 ? 1 : -1;
  [-.22, .22].forEach((x, i) => {
    const es = i === big ? .6 : .5, ey = .14 + (i === big ? .04 : 0);
    const e = ball(x, ey, .36, es, es, es * .62, EYEM, head); const p = ball(0, 0, .46, .4, .44, .2, 0x150f24, e); ball(-.1, .12, .11, .2, .2, .1, EYEM, p); ball(.1, -.09, .12, .09, .09, .06, EYEM, p); eyes.push(p);
    ball(0, .38, -.02, .88, .23, .54, sk, e); // soft upper eyelid, behind the pupil
    const b = softBox(x * 1.05, ey + es * .62, .47, .32, .085, .07, browM, head); b.rotation.z = (x < 0 ? 1 : -1) * angry * (.18 + r() * .2);
  });
  [-1, 1].forEach(sd => ball(sd * .33, -.13, .37, .22, .12, .075, 0xff8fa8, head)); // Apfelbacken
  if (!o.teacher) ball(0, -.04, .5, .2, .16, .16, 0xff8fa0, head); // rosa Knubbelnase
  ball(0, -.24, .42, .4, .12 + r() * .08, .1, 0x5a1430, head); // mouth
  if (r() < .45) softBox(r() < .5 ? .05 : -.05, -.25, .47, .08, .08, .03, M(0xffffff), head); // buck tooth
  if (o.teacher) {
    ball(0, -.02, .52, .26, .22, .26, 0xff8f7a, head); // clown-ish nose
    [-.21, .21].forEach(x => { const t = new THREE.Mesh(TOR, M(0x111111)); t.position.set(x, .14, .5); t.scale.set(.55, .52, .32); head.add(t); });
    softBox(0, .14, .52, .13, .035, .04, 0x222032, head);
    if (o.must) [-1, 1].forEach(sd => { const m = ball(sd * .12, -.14, .49, .3, .12, .15, M(o.hair), head); m.rotation.z = sd * -.22; }); // Schnauzer
    [-.46, .46].forEach(x => ball(x, .1, -.05, .18, .32, .36, M(o.hair), head)); // side tufts, shiny bald top
  } else {
    const hat = o.hat >= 0 ? o.hat : h % 7;
    if (hat === 0) ball(0, .3, -.05, 1.0, .5, 1.0, M(o.hair), head);
    else if (hat === 1) { const c = new THREE.Mesh(CONE, M([0xffd23f, 0x36b45a, 0xff6fb5][h % 3])); c.position.set(.05, .62, 0); c.scale.set(.45, .55, .45); c.rotation.z = -.25; head.add(c); ball(.18, .9, 0, .12, .12, .12, 0xffffff, head); }
    else if (hat === 2) { ball(0, .25, 0, .95, .55, .95, M(o.col), head); const pr = softBox(0, .55, 0, .9, .03, .12, M(0xe8412c), head); pr.userData.spin = 1; softBox(0, .5, 0, .05, .12, .05, M(0x333333), head); o.prop = pr; }
    else if (hat === 3) { softBox(0, .55, 0, .03, .35, .03, M(0x333333), head); ball(0, .75, 0, .16, .16, .16, 0xe8412c, head); ball(0, .38, 0, .7, .2, .7, M(o.hair), head); }
    else if (hat === 4) { ball(0, .28, 0, 1.02, .5, 1.02, M([0x2f6fd6, 0xe8412c, 0x9b59b6][h % 3]), head); ball(0, .6, 0, .22, .22, .22, 0xffffff, head); }
    else if (hat === 5) { ball(0, .32, -.04, 1.03, .52, 1.03, M(o.col), head); ball(.08, .28, .4, .82, .1, .62, M(o.col), head); }
    else if (hat === 6) { [-.21, .21].forEach(x => { const rim = new THREE.Mesh(TOR, M(0x59364f)); rim.position.set(x, .13, .54); rim.scale.set(.56, .53, .28); head.add(rim); }); softBox(0, .13, .54, .14, .04, .04, 0x59364f, head); }
  }
  [-1, 1].forEach(sd => {
    ball(sd * .48, -.02, 0, .18, .25, .16, sk, head);
    ball(sd * .52, -.02, .055, .075, .13, .04, 0xe99798, head);
  });
  if (!o.teacher) {
    const hat = o.hat >= 0 ? o.hat : h % 7;
    // Rounded fringe locks follow the forehead without covering the glowing eyes.
    if (hat === 0 || hat === 3 || hat === 6) for (let i = 0; i < 5; i++) {
      const lock = ball((i - 2) * .16, .4 + (i % 2) * .035, .2, .27, .25, .32, M(o.hair), head);
      lock.rotation.z = (i - 2) * -.2;
    }
    if (hat === 2 || hat === 4 || hat === 5) {
      const band = new THREE.Mesh(TOR, M(o.col)); band.position.set(0, .33, 0);
      band.rotation.x = Math.PI / 2; band.scale.set(.88, .88, .65); head.add(band);
      ball(0, .48, .04, .1, .09, .1, 0xffe7bb, head);
    }
  }
  const beard = ball(0, -.45, .2, .9, .6, .6, 0xdddddd, head); beard.visible = false;
  // egg body
  const torso = mk(potato(h + 13), (o.teacher ? 1.28 : 1.15) * s, (o.teacher ? 1.02 : .94) * s, body);
  if (!o.teacher) {
    const bag = M([0x525c87, 0xd69c45, 0x679580][h % 3]);
    ball(0, .03, -.49, .7, .65, .38, bag, torso); ball(0, -.12, -.65, .45, .24, .12, bag, torso);
    [-.27, .27].forEach(x => softBox(x, .13, -.33, .085, .55, .12, 0xffe0ac, torso));
  } else {
    const tie = softBox(0, .11, .5, .14, .4, .045, 0xe8412c, torso); tie.rotation.z = -.14;
    ball(0, .34, .47, .18, .14, .1, 0xffd23f, torso);
  }
  ball(0, -.05, .47, .14, .1, .05, 0xffffff, torso); // belly button / badge
  const limbs = [mk(SPH, .29 * s, .29 * s, M(o.col)), mk(SPH, .29 * s, .29 * s, M(o.col)), mk(SPH, .23 * s, .23 * s, pants), mk(SPH, .23 * s, .23 * s, pants)];
  const hands = [ball(0, 0, 0, .29 * s, .27 * s, .29 * s, sk, g), ball(0, 0, 0, .29 * s, .27 * s, .29 * s, sk, g)];
  hands.forEach((hand, i) => {
    const sd = i === 0 ? -1 : 1;
    const thumb = ball(sd * .4, .03, .18, .52, .58, .58, sk, hand); thumb.rotation.z = -sd * .45;
    ball(0, .34, -.02, .87, .3, .87, M(o.col), hand); // sleeve cuff
  });
  if (o.teacher) {
    // Hand-Skalierung ausgleichen, damit Papier und Klemme nicht mitschrumpfen.
    const clip = new THREE.Group(); clip.position.set(.14, -.35, .4); clip.scale.set(1 / .29, 1 / .27, 1 / .29); clip.rotation.z = -.18; hands[0].add(clip);
    softBox(0, 0, 0, .36, .48, .055, 0x9b7048, clip);
    softBox(0, -.01, .035, .29, .36, .012, 0xfff0ce, clip); softBox(0, .21, .045, .14, .07, .025, 0x777e87, clip);
  }
  const shoeM = M(o.teacher ? 0x3a2a1a : [0xffffff, 0xe8412c, 0xffd23f, 0x111111][h % 4]);
  const feet = [ball(0, 0, 0, .36 * s, .24 * s, .48 * s, shoeM, g), ball(0, 0, 0, .36 * s, .24 * s, .48 * s, shoeM, g)];
  feet.forEach(foot => {
    softBox(0, -.34, 0, .98, .28, .99, 0xfff2d7, foot);
    ball(0, -.02, .3, .9, .59, .46, o.teacher ? 0x725142 : 0xfffaf0, foot);
    [-.08, .12].forEach(z => softBox(0, .39, z, .53, .07, .075, 0xfff2d7, foot));
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.55 * s, 14), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  const tag = labelSprite(o.name, o.teacher ? 'rgba(232,65,44,.85)' : 'rgba(31,26,51,.75)', '#fffdf2', .5); scene.add(tag);
  const bub = labelSprite('', 'rgba(255,253,242,.95)', '#1f1a33', .8); scene.add(bub);
  const J = Array.from({ length: 11 }, () => new THREE.Vector3());
  const ch = { g, head, torso, limbs, hands, feet, eyes, beard, shadow, tag, bub, J, prop: o.prop, parts: [head, torso, ...limbs, ...hands, ...feet], sz: s, x: 0, y: 0, z: 0, ry: 0, ph: 0, spd: 0, pose: 'idle', rg: null, blend: 0, bubT: 0, wob: r() * 10, skel: false, teacher: o.teacher };
  return ch;
}
function removeChar(ch) { [ch.g, ch.shadow, ch.tag, ch.bub].forEach(o => scene.remove(o)); }
const LP = Array.from({ length: 11 }, () => new THREE.Vector3());
function poseLocal(ch, t, dt = 1 / 60) {
  const s = ch.sz, p = ch.pose, sp = ch.spd;
  const anim = ch.g.userData.anim || (ch.g.userData.anim = { local: LP.map(() => new THREE.Vector3()), ready: false, yaw: ch.ry });
  const moving = clamp(sp / 4, 0, 1), run = clamp((sp - 4) / 4, 0, 1);
  const wave = Math.sin(ch.ph), a = wave * (.9 - .15 * wave * wave) * moving;
  const sit = p === 'sit' || (!!ch.home && (p === 'write' || p === 'nap'));
  anim.seated = anim.ready ? lerp(anim.seated, sit ? 1 : 0, 1 - Math.exp(-12 * dt)) : (sit ? 1 : 0);
  const bob = sit ? 0 : (1 - Math.cos(ch.ph * 2)) * .018 * moving;
  const breathe = Math.sin(t * 2.1 + ch.wob * .15) * .009 * (1 - moving);
  const hipY = sit ? .54 : (.6 + bob) * s;
  LP[2].set(0, hipY, 0);
  LP[1].set(wave * .035 * moving * s, hipY + ((sit ? .6 : .78) + breathe) * s, run * .12 * s);
  LP[0].set(LP[1].x, LP[1].y + .5 * s, LP[1].z + (p === 'write' ? .08 * s : 0));
  LP[7].set(.5 * s, LP[1].y - .28 * s, LP[1].z); LP[8].set(-.5 * s, LP[1].y - .28 * s, LP[1].z);
  LP[9].set(.22 * s, hipY, 0); LP[10].set(-.22 * s, hipY, 0);
  const al = .5 * s, ll = .52 * s;
  if (p === 'write' || p === 'phone') { LP[3].copy(LP[7]).add(_v.set(-.12, -.25, .45)); LP[4].copy(LP[8]).add(_v.set(.12, p === 'phone' ? .05 : -.25, .45)); LP[4].x += Math.sin(t * 7) * .018 * (p === 'write'); }
  else if (p === 'raise') { LP[3].copy(LP[7]).add(_v.set(.05, -al * Math.cos(a), al * Math.sin(a))); LP[4].copy(LP[8]).add(_v.set(-.1, al, .1 + Math.sin(t * 3.5) * .04)); }
  else if (p === 'panic') { LP[3].copy(LP[7]).add(_v.set(.2, al * .9, Math.sin(t * 6) * .13)); LP[4].copy(LP[8]).add(_v.set(-.2, al * .9, Math.cos(t * 6) * .13)); }
  else if (p === 'coffee') { LP[3].copy(LP[7]).add(_v.set(0, -al, 0)); LP[4].copy(LP[8]).add(_v.set(.15, -.1, .4)); }
  else if (p === 'point') { LP[3].copy(LP[7]).add(_v.set(0, -al, 0)); LP[4].copy(LP[8]).add(_v.set(0, .15, al)); }
  else { LP[3].copy(LP[7]).add(_v.set(.05, -al * Math.cos(a), al * Math.sin(a))); LP[4].copy(LP[8]).add(_v.set(-.05, -al * Math.cos(-a), al * Math.sin(-a))); }
  if (sit) { LP[5].copy(LP[9]).add(_v.set(.05, -.43, .32 * s)); LP[6].copy(LP[10]).add(_v.set(-.05, -.43, .32 * s)); }
  else { LP[5].copy(LP[9]).add(_v.set(0, -ll * Math.cos(-a), ll * Math.sin(-a))); LP[6].copy(LP[10]).add(_v.set(0, -ll * Math.cos(a), ll * Math.sin(a))); }
  if (p === 'nap') { LP[0].set(0, LP[1].y - .05, LP[1].z + .35); }
  // Blend in local space so pose easing never drags a moving character behind its anchor.
  const k = 1 - Math.exp(-12 * Math.max(0, dt));
  anim.yaw += angDiff(anim.yaw, ch.ry) * (1 - Math.exp(-10 * Math.max(0, dt)));
  const c = Math.cos(anim.yaw), sn = Math.sin(anim.yaw);
  for (let i = 0; i < 11; i++) {
    const v = LP[i], local = anim.local[i];
    if (!anim.ready) local.copy(v); else local.lerp(v, k);
    const x = local.x * c + local.z * sn, z = -local.x * sn + local.z * c;
    v.set(ch.x + x, ch.y + local.y, ch.z + z);
  }
  anim.ready = true;
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
  // Previous fixed-step positions are visual-only; collision and Verlet state stay intact.
  const anim = ch.g.userData.anim;
  if (!anim.ragPrev || anim.rag !== r) { anim.ragPrev = r.p.map(v => v.clone()); anim.rag = r; }
  while (r.acc >= h) {
    for (let i = 0; i < 11; i++) anim.ragPrev[i].copy(r.p[i]);
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
const _headQ = new THREE.Quaternion(), _headE = new THREE.Euler();
const _basis = new THREE.Matrix4(), _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
function renderChar(ch, t, dt) {
  const J = ch.J;
  if (ch.rg) {
    stepRagdoll(ch, dt);
    if (ch.rg.t > ch.rg.dur && ch.rg.dur > 0) { ch.rg = null; ch.blend = 1; }
    else { const alpha = ch.rg.acc * 60; for (let i = 0; i < 11; i++) J[i].lerpVectors(ch.g.userData.anim.ragPrev[i], ch.rg.p[i], alpha); }
  }
  if (!ch.rg) {
    ch.aspd = lerp(ch.aspd || 0, ch.spd, 1 - Math.exp(-10 * dt)); const realSpd = ch.spd; ch.spd = ch.aspd;
    poseLocal(ch, t, dt); ch.spd = realSpd;
    const jump = !ch.posed || J[2].distanceTo(LP[2]) > 2.5; ch.posed = true;
    if (jump) { for (let i = 0; i < 11; i++) J[i].copy(LP[i]); ch.blend = 0; }
    else { const k = ch.blend > 0 ? 1 - Math.exp(-6 * dt) : 1 - Math.exp(-22 * dt); ch.blend = Math.max(0, ch.blend - dt * 2.5); for (let i = 0; i < 11; i++) J[i].lerp(LP[i], k); }
  }
  // torso basis
  _bx.subVectors(J[7], J[8]).normalize(); _by.subVectors(J[1], J[2]); const tl = _by.length(); _by.normalize();
  _bz.crossVectors(_bx, _by).normalize(); _bx.crossVectors(_by, _bz).normalize();
  _basis.makeBasis(_bx, _by, _bz); _q.setFromRotationMatrix(_basis);
  const tor = ch.torso; tor.position.addVectors(J[1], J[2]).multiplyScalar(.5).addScaledVector(_by, -.05); tor.quaternion.copy(_q); ch.sq = lerp(ch.sq || 0, 0, 1 - Math.exp(-9 * dt)); const breath = ch.rg ? 0 : Math.sin(t * 2.1 + ch.wob * .15) * .012; const sq = clamp(ch.sq, -.35, .35); tor.scale.set(tor.userData.w * (1 - sq * .5 + breath), (tl + (.5 - .42 * ch.g.userData.anim.seated) * ch.sz) * (1 + sq), tor.userData.d * (1 - sq * .5 + breath));
  ch.head.position.copy(J[0]).addScaledVector(_by, .05 * ch.sz);
  _headE.set(ch.pose === 'nap' ? .6 : ch.pose === 'phone' || ch.pose === 'write' ? .1 : 0, Math.sin(t * .7 + ch.wob * .1) * .035, Math.sin(t * 1.3) * .025);
  _headQ.setFromEuler(_headE).premultiply(_q);
  if (ch.rg) ch.head.quaternion.copy(_q);
  else ch.head.quaternion.slerp(_headQ, 1 - Math.exp(-9 * dt));
  ch.hands[0].position.copy(J[3]); ch.hands[1].position.copy(J[4]);
  ch.hands.forEach(hand => hand.quaternion.copy(_q));
  ch.feet.forEach((f, i) => { f.position.copy(J[5 + i]); f.position.y -= .02; f.quaternion.copy(_q); f.position.addScaledVector(_bz, .1 * ch.sz); });
  if (ch.prop) ch.prop.rotation.y += dt * (8 + ch.spd * 4);
  [[7, 3], [8, 4], [9, 5], [10, 6]].forEach(([a, b], i) => {
    const m = ch.limbs[i]; _v.subVectors(J[b], J[a]); const l = _v.length(); m.position.addVectors(J[a], J[b]).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(UP, _v.normalize()); m.scale.set(m.userData.w, l + .1, m.userData.d);
  });
  // Both pupils track the same slow gaze, keeping the large luminous whites readable.
  ch.wob += dt;
  const gazeX = Math.sin(t * .8 + ch.wob * .1) * (ch.rg ? .1 : .055);
  const gazeY = Math.sin(t * 1.1) * .025;
  ch.eyes.forEach(e => { const k = 1 - Math.exp(-8 * dt); e.position.x = lerp(e.position.x, gazeX, k); e.position.y = lerp(e.position.y, gazeY, k); });
  const gy = groundAt(J[2].x, J[2].z, J[2].y + .2);
  ch.shadow.position.set(J[2].x, gy + .03, J[2].z);
  ch.tag.position.set(J[0].x, J[0].y + .95 * ch.sz, J[0].z);
  ch.bub.position.set(J[0].x, J[0].y + 1.45 * ch.sz, J[0].z);
  if (ch.bubT > 0) { ch.bubT -= dt; if (ch.bubT <= 0) setLabel(ch.bub, ''); }
}
function say(ch, text, pitch = 1, dur = 3) { if (!ch) return; setLabel(ch.bub, text); ch.bubT = dur; const d = _v.set(ch.x, ch.y, ch.z).distanceTo(camera.position); if (d < 22) Snd.voice(text, pitch, .12 * (1 - d / 25)); }
