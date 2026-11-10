#!/usr/bin/env node
// Übersetzungs-Werkzeug für School With Your Friends.
//   node tools/i18n.js check            prüft alle Sprachdateien (fehlende/alte Texte, Platzhalter)
//   node tools/i18n.js keys             listet alle deutschen Texte (Schlüssel) nummeriert
//   node tools/i18n.js todo <lang>      schreibt fehlende Texte nach /tmp/i18n-todo-<lang>.txt
//   node tools/i18n.js merge <lang> <f> übernimmt Übersetzungen aus <f> (eine Zeile pro Text aus todo)
//   node tools/i18n.js scan             sucht deutsch aussehende Texte, die nicht übersetzt werden
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const SRC = ['00_i18n.js', '02_core.js', '03_net_host.js', '04_client.js', '05_ui.js'].map(f => path.join(root, 'src', f));
const HTML = path.join(root, 'src', '01_head.html');
const DIR = path.join(root, 'src', 'i18n');
const LANGS = ['en', 'es', 'fr', 'it', 'pt', 'pl', 'tr', 'ru', 'ja'];
// Tastennamen, Spielname und Klassennummern bleiben in allen Sprachen gleich.
const SKIP = new Set(['E', 'H', 'F', 'V', 'G', 'R', 'Q', 'X', 'M', 'T', 'WASD', 'Shift', 'Esc', 'Space', 'School With Your Friends', '1A', '1B', '1C', '2A', '2B']);
const hasLetter = s => /\p{L}/u.test(s) && !SKIP.has(s);

// Liest ab Position i ein JS-String-Literal; gibt [Wert, Ende, istTemplate] zurück.
function readStr(src, i) {
  const q = src[i]; let j = i + 1;
  while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; }
  const lit = src.slice(i, j + 1);
  let v; try { v = q === '`' ? lit.slice(1, -1) : eval(lit); } catch (e) { throw new Error('Literal nicht lesbar bei: ' + src.slice(Math.max(0, i - 80), i + 40)); }
  return [v, j + 1, q === '`'];
}
function literalsIn(src, start) { // alle Literale in der Klammer ab start ('(')
  const out = []; let depth = 0, i = start;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '\'' || c === '"' || c === '`') { const [v, e, tpl] = readStr(src, i); out.push({ v, tpl, at: i }); i = e - 1; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) break; }
  }
  return out;
}
function lineOf(src, at) { return src.slice(0, at).split('\n').length; }
function collect() {
  const keys = new Map(); const errors = [];
  const add = (k, where) => { if (hasLetter(k) && !keys.has(k)) keys.set(k, where); };
  for (const f of SRC) {
    const src = fs.readFileSync(f, 'utf8'); const name = path.basename(f);
    const re = /(?<![\w$.])(TR|N_|TA)\(/g; let m;
    while ((m = re.exec(src))) {
      if (name === '00_i18n.js' && /function TR|const (N_|TA) =/.test(src.slice(Math.max(0, m.index - 12), m.index + 4))) continue;
      const open = m.index + m[1].length;
      if (m[1] === 'TR') {
        let k = open + 1; while (/\s/.test(src[k])) k++;
        if (src[k] === '\'' || src[k] === '"') add(readStr(src, k)[0], `${name}:${lineOf(src, m.index)}`);
        else if (src[k] === '`') errors.push(`${name}:${lineOf(src, m.index)}: TR mit Template-String, bitte {platzhalter} benutzen`);
      } else literalsIn(src, open).forEach(l => { if (l.tpl) errors.push(`${name}:${lineOf(src, l.at)}: Template-String in ${m[1]}`); else add(l.v, `${name}:${lineOf(src, l.at)}`); });
    }
  }
  let html = fs.readFileSync(HTML, 'utf8').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<title>[\s\S]*?<\/title>/g, '');
  html.replace(/>([^<>]+)</g, (_, t) => { const k = t.trim(); if (k) add(k.replace(/&amp;/g, '&'), '01_head.html'); });
  html.replace(/(?:placeholder|aria-label)="([^"]+)"/g, (_, t) => add(t, '01_head.html'));
  return { keys, errors };
}
const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
const load = l => { const f = path.join(DIR, l + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; };
function save(l, obj, keys) {
  const out = {}; [...keys.keys()].forEach(k => { if (obj[k]) out[k] = obj[k]; });
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, l + '.json'), JSON.stringify(out, null, 1) + '\n');
}
const [cmd = 'check', a1, a2] = process.argv.slice(2);
const { keys, errors } = collect();
if (cmd === 'keys') { [...keys.keys()].forEach((k, i) => console.log(i + 1 + '\t' + k)); console.error(keys.size + ' Texte'); }
else if (cmd === 'todo') {
  const d = load(a1); const miss = [...keys.keys()].filter(k => !d[k]);
  const f = `/tmp/i18n-todo-${a1}.txt`; fs.writeFileSync(f, miss.join('\n') + '\n'); console.log(`${miss.length} fehlende Texte -> ${f}`);
}
else if (cmd === 'merge') {
  const d = load(a1); const miss = [...keys.keys()].filter(k => !d[k]);
  const lines = fs.readFileSync(a2, 'utf8').replace(/\n$/, '').split('\n');
  if (lines.length !== miss.length) { console.error(`Zeilenzahl passt nicht: ${lines.length} statt ${miss.length}`); process.exit(1); }
  let bad = 0; miss.forEach((k, i) => { const v = lines[i].trim(); if (ph(k) !== ph(v)) { bad++; console.error(`Platzhalter ${i + 1}: ${k} => ${v}`); } d[k] = v; });
  if (bad) process.exit(1);
  save(a1, d, keys); console.log(`${miss.length} Texte in ${a1}.json übernommen`);
}
else if (cmd === 'scan') {
  for (const f of SRC.slice(1)) {
    const src = fs.readFileSync(f, 'utf8');
    src.split('\n').forEach((line, n) => {
      if (/^\s*\/\//.test(line)) return;
      line.replace(/'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g, (m, s1, s2) => {
        const s = s1 ?? s2; if (!s || keys.has(s)) return;
        if (/[äöüÄÖÜß]|\b(der|die|das|und|ist|nicht|du|dich|hat|ein|eine|keine|Stunde|Lehrer)\b/.test(s) && !/^[\w.-]+$/.test(s)) console.log(`${path.basename(f)}:${n + 1}: ${s.slice(0, 90)}`);
      });
    });
  }
}
else {
  let fail = errors.length; errors.forEach(e => console.error(e));
  for (const l of LANGS) {
    const d = load(l); const miss = [...keys.keys()].filter(k => !d[k]); const extra = Object.keys(d).filter(k => !keys.has(k));
    const badPh = Object.entries(d).filter(([k, v]) => keys.has(k) && ph(k) !== ph(v));
    console.log(`${l}: ${keys.size - miss.length}/${keys.size}` + (extra.length ? `, ${extra.length} veraltet` : '') + (badPh.length ? `, ${badPh.length} Platzhalter falsch` : ''));
    badPh.forEach(([k, v]) => console.error(`  ${l} Platzhalter: ${k} => ${v}`));
    if (miss.length || badPh.length) fail++;
  }
  console.log(keys.size + ' Texte insgesamt');
  process.exit(fail ? 1 : 0);
}
