#!/usr/bin/env node
// Wandelt die Kenney-Modelle (CC0, www.kenney.nl) aus assets/kenney-furniture/*.glb in src/01b_models.js um.
// Pro Modell werden alle Teile nach Materialfarbe zusammengefasst, die Knoten-Transformationen eingerechnet
// und das Modell so verschoben, dass es mittig auf dem Boden (y = 0) steht. Ergebnis: kleine Base64-Puffer.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'assets', 'kenney-furniture');

function mat4(t = [0, 0, 0], r = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = r; const [sx, sy, sz] = s;
  return [
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
    (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
    (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    t[0], t[1], t[2], 1];
}
function mul(a, b) { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
const apply = (m, v, w) => [0, 1, 2].map(i => m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + (w ? m[12 + i] : 0));
// Kenney-Farben sind schon pastellig; ohne Gamma-Umrechnung passen sie besser zu den Spielfarben.
const hex = c => (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255);

function convert(file) {
  const b = fs.readFileSync(file); const jl = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + jl).toString());
  const bin = b.slice(20 + jl + 8);
  const acc = (i) => { const a = j.accessors[i], v = j.bufferViews[a.bufferView]; const off = (v.byteOffset || 0) + (a.byteOffset || 0);
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]; const T = a.componentType === 5126 ? Float32Array : a.componentType === 5123 ? Uint16Array : Uint32Array;
    return new T(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT)); };
  const parts = new Map();
  const walk = (ni, parent) => {
    const nd = j.nodes[ni]; const m = mul(parent, nd.matrix || mat4(nd.translation, nd.rotation, nd.scale));
    if (nd.mesh != null) j.meshes[nd.mesh].primitives.forEach(p => {
      const col = hex(((j.materials[p.material] || {}).pbrMetallicRoughness || {}).baseColorFactor || [1, 1, 1, 1]);
      if (!parts.has(col)) parts.set(col, { p: [], n: [], i: [] }); const P = parts.get(col); const base = P.p.length / 3;
      const pos = acc(p.attributes.POSITION), nor = acc(p.attributes.NORMAL), idx = p.indices != null ? acc(p.indices) : null;
      for (let k = 0; k < pos.length; k += 3) { P.p.push(...apply(m, [pos[k], pos[k + 1], pos[k + 2]], 1)); const q = apply(m, [nor[k], nor[k + 1], nor[k + 2]], 0); const l = Math.hypot(...q) || 1; P.n.push(q[0] / l, q[1] / l, q[2] / l); }
      if (idx) idx.forEach(v => P.i.push(v + base)); else for (let k = 0; k < pos.length / 3; k++) P.i.push(k + base);
    });
    (nd.children || []).forEach(c => walk(c, m));
  };
  (j.scenes[j.scene || 0].nodes).forEach(n => walk(n, mat4()));
  const all = [...parts.values()].flatMap(P => P.p); const mn = [0, 1, 2].map(a => Math.min(...all.filter((_, k) => k % 3 === a))); const mx = [0, 1, 2].map(a => Math.max(...all.filter((_, k) => k % 3 === a)));
  const c = [(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2];
  const b64 = (T, a) => Buffer.from(new T(a).buffer).toString('base64');
  return { s: mx.map((v, a) => +(v - mn[a]).toFixed(3)), parts: [...parts.entries()].map(([col, P]) => [col, b64(Float32Array, P.p.map((v, k) => +(v - c[k % 3]).toFixed(4))), b64(Float32Array, P.n.map(v => +v.toFixed(3))), b64(P.p.length / 3 > 65535 ? Uint32Array : Uint16Array, P.i)]) };
}
const out = {};
fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort().forEach(f => { out[f.replace('.glb', '')] = convert(path.join(dir, f)); });
fs.writeFileSync(path.join(root, 'src', '01b_models.js'), '// Erzeugt von tools/models.js aus Kenney Furniture Kit (CC0, www.kenney.nl). Nicht von Hand bearbeiten.\nconst KMODELS = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length + ' Modelle, ' + fs.statSync(path.join(root, 'src', '01b_models.js')).size + ' Bytes');
