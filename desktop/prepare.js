// Nimmt das von ../build.sh gebaute index.html und legt eine Offline-Version
// nach app/: Three.js und die Schriften werden lokal mitgeliefert statt aus dem Netz geladen.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(__dirname, 'app');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes(cdn)) throw new Error('Three.js-CDN-Tag nicht in index.html gefunden');
html = html.replace(cdn, '<script src="three.min.js"></script>');

// Google Fonts ebenfalls lokal einbinden, damit die App offline gleich aussieht.
const fontLinks = /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/;
if (!fontLinks.test(html)) throw new Error('Google-Fonts-Links nicht in index.html gefunden');
html = html.replace(fontLinks, '<link rel="stylesheet" href="fonts/fonts.css">');
const fonts = [['Luckiest Guy', 'luckiest-guy'], ['Patrick Hand', 'patrick-hand']];
fs.mkdirSync(path.join(out, 'fonts'));
let css = '';
for (const [family, pkg] of fonts) {
  const file = `${pkg}-latin-400-normal.woff2`;
  fs.copyFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`), path.join(out, 'fonts', file));
  css += `@font-face{font-family:'${family}';font-style:normal;font-weight:400;font-display:swap;src:url(${file}) format('woff2');}\n`;
}
fs.writeFileSync(path.join(out, 'fonts', 'fonts.css'), css);

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(require.resolve('three/build/three.min.js'), path.join(out, 'three.min.js'));
console.log('Spiel nach desktop/app/ vorbereitet.');
