'use strict';
// ---------------- Sprachen ----------------
// Deutsch ist die Quellsprache: jeder deutsche Text ist gleichzeitig sein eigener Schlüssel.
// Die Übersetzungen liegen in src/i18n/<code>.json als { deutscher Text: Übersetzung }; tools/i18n.js prüft sie.
// TR(text, { n: name }) übersetzt und setzt Platzhalter ein, N_(...) markiert Daten nur fürs Sammeln.
const LANGS = [
  ['de', 'Deutsch'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'],
  ['pt', 'Português'], ['pl', 'Polski'], ['tr', 'Türkçe'], ['ru', 'Русский'], ['ja', '日本語'],
];
const LOCALES = { de: 'de-AT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-BR', pl: 'pl-PL', tr: 'tr-TR', ru: 'ru-RU', ja: 'ja-JP' };
const I18N = {};
const LANG = (() => {
  const ok = c => LANGS.some(l => l[0] === c);
  try { const s = localStorage.getItem('swyf-lang'); if (ok(s)) return s; } catch (e) { }
  const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'de']).map(x => String(x).slice(0, 2).toLowerCase());
  return nav.find(ok) || 'en';
})();
function TR(s, p) {
  if (s == null) return '';
  s = String(s);
  const d = LANG !== 'de' && I18N[LANG];
  let r = (d && Object.prototype.hasOwnProperty.call(d, s) && d[s]) || s;
  if (p) r = r.replace(/\{(\w+)\}/g, (m, k) => (k in p ? TR(String(p[k])) : m));
  return r;
}
const N_ = x => x;
const fmtNum = n => Number(n).toLocaleString(LOCALES[LANG] || 'de-AT');
function setLang(code) { try { localStorage.setItem('swyf-lang', code); } catch (e) { } }
// Statische Texte im HTML: jeder Textknoten und jedes placeholder/aria-label wird übersetzt.
function applyDomI18n(root = document.body) {
  document.documentElement.lang = LANG;
  if (LANG === 'de') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const v = n.nodeValue, k = v.trim(); if (!k) return; const t = TR(k); if (t !== k) n.nodeValue = v.replace(k, t); });
  root.querySelectorAll('[placeholder],[aria-label]').forEach(el => ['placeholder', 'aria-label'].forEach(a => { const v = el.getAttribute(a); if (v) el.setAttribute(a, TR(v)); }));
}
function fillLangSelect(sel) { sel.innerHTML = LANGS.map(([c, n]) => `<option value="${c}"${c === LANG ? ' selected' : ''}>${n}</option>`).join(''); }
// Übersetzt ganze (auch verschachtelte) Text-Arrays, z. B. Quizfragen.
const TA = a => a.map(x => Array.isArray(x) ? TA(x) : TR(x));
