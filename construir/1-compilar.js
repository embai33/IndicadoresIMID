// Compila el JSX inline de la aplicación a JavaScript plano,
// usando la MISMA versión de Babel que la app usaba en el navegador (7.23.5).
const fs = require('fs');
const path = require('path');

const BUILD = __dirname;
const SRC = process.argv[2];
if (!SRC) { console.error('Uso: node compile.js <ruta-html>'); process.exit(1); }

const html = fs.readFileSync(SRC, 'utf8');

// Localizar el bloque <script type="text/babel"> ... </script>
const OPEN = '<script type="text/babel">';
const start = html.indexOf(OPEN);
if (start === -1) { console.error('ERROR: no se encontró <script type="text/babel">'); process.exit(1); }
const bodyStart = start + OPEN.length;
const end = html.indexOf('</script>', bodyStart);
if (end === -1) { console.error('ERROR: no se encontró el cierre </script>'); process.exit(1); }

const jsx = html.slice(bodyStart, end);
console.log('JSX extraído:', (jsx.length / 1024).toFixed(0), 'KB');

// Cargar babel-standalone (en Node se expone por module.exports)
global.self = global;
const Babel = require(path.join(BUILD, 'babel-build-only.js'));
if (!Babel || typeof Babel.transform !== 'function') { console.error('ERROR: no se pudo cargar Babel'); process.exit(1); }
console.log('Babel versión:', Babel.version);

// Transformar con el mismo preset que usa babel-standalone en el navegador
let out;
try {
  out = Babel.transform(jsx, {
    presets: ['react'],
    compact: false,
    comments: true,
    sourceType: 'script'
  }).code;
} catch (e) {
  console.error('ERROR de compilación:', e.message);
  process.exit(1);
}

console.log('JS compilado:', (out.length / 1024).toFixed(0), 'KB');

fs.writeFileSync(path.join(BUILD, 'app.compiled.js'), out, 'utf8');

// Guardar también las partes del HTML para el ensamblado posterior
fs.writeFileSync(path.join(BUILD, 'head.part.html'), html.slice(0, start), 'utf8');
fs.writeFileSync(path.join(BUILD, 'tail.part.html'), html.slice(end + '</script>'.length), 'utf8');
console.log('OK: app.compiled.js, head.part.html, tail.part.html');
