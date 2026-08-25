// Ensambla la versión autónoma: librerías incrustadas + JS precompilado.
// Sin CDN y sin Babel en el navegador.
const fs = require('fs');
const path = require('path');

const BUILD = __dirname;
const OUT = process.argv[2];
if (!OUT) { console.error('Uso: node assemble.js <salida-html>'); process.exit(1); }

let head = fs.readFileSync(path.join(BUILD, 'head.part.html'), 'utf8');
const tail = fs.readFileSync(path.join(BUILD, 'tail.part.html'), 'utf8');
const app = fs.readFileSync(path.join(BUILD, 'app.compiled.js'), 'utf8');

// 1) Eliminar las etiquetas <script src="https://..."> del <head>
const cdnBefore = (head.match(/<script src="https:\/\/[^"]*"><\/script>\s*/g) || []).length;
head = head.replace(/[ \t]*<script src="https:\/\/[^"]*"><\/script>\n?/g, '');
const cdnAfter = (head.match(/<script src="https:\/\//g) || []).length;
console.log(`Etiquetas CDN eliminadas: ${cdnBefore} (quedan ${cdnAfter})`);
if (cdnAfter !== 0) { console.error('ERROR: quedan referencias a CDN'); process.exit(1); }

// 2) La versión la define el archivo fuente. Se detecta por el patrón "Vnn" al final
//    del <title>, sin depender del nombre de la aplicación (que puede cambiar).
const mTitle = head.match(/<title>([^<]*)<\/title>/i);
if (!mTitle) { console.error('ERROR: el archivo fuente no tiene <title>'); process.exit(1); }
const mVer = mTitle[1].match(/\bV(\d+)\s*$/i);
if (!mVer) {
  console.error('ERROR: el <title> no termina con un número de versión.');
  console.error('  <title> encontrado: "' + mTitle[1].trim() + '"');
  console.error('  Se esperaba que terminase en "Vnn", por ejemplo: "VIGIA-IMID - V39".');
  process.exit(1);
}
const version = 'V' + mVer[1];
console.log('Versión detectada en la fuente:', version, '(título: "' + mTitle[1].trim() + '")');

// Comprobar que el nombre del archivo de salida coincide con esa versión,
// para no publicar por error un contenido con un número distinto al del nombre.
const mOut = require('path').basename(OUT).match(/V(\d+)/i);
if (mOut && ('V' + mOut[1]).toUpperCase() !== version.toUpperCase()) {
  console.error('ERROR: la versión del archivo fuente (' + version + ') no coincide con la del archivo de salida (V' + mOut[1] + ').');
  console.error('  Actualiza el <title> y la cabecera de la fuente, o corrige el nombre de salida.');
  process.exit(1);
}

// 3) Nota de dependencias incrustadas (con licencias)
const nota = `    <!--
      DEPENDENCIAS INCRUSTADAS (sin CDN, funciona sin conexión a internet)
      Se incluyen sin modificar, en las mismas versiones que usaba la app:
        · React 18.2.0 y React-DOM 18.2.0 .............. MIT (Meta Platforms, Inc.)
        · SheetJS (xlsx) 0.18.5 ........................ Apache-2.0 (SheetJS LLC)
        · Chart.js 4.4.0 ............................... MIT (Chart.js Contributors)
        · chartjs-chart-sankey 0.12.1 .................. MIT (Jukka Kurkela)
        · jsPDF 2.5.1 .................................. MIT (James Hall / yWorks)
        · html2canvas 1.4.1 ............................ MIT (Niklas von Hertzen)
      El código de la aplicación va precompilado (sin Babel en el navegador).
    -->
`;
head = head.replace('</head>', nota + '</head>');

// 4) Ensamblar los scripts en orden de dependencia
// Coherencia entre la versión del <title> y la que se muestra en la cabecera de la
// aplicación: son dos sitios distintos del archivo fuente y es fácil actualizar uno y
// olvidar el otro.
const mHdr = app.match(/createElement\("strong",\s*null,\s*"v(\d+)"\)/i);
if (!mHdr) {
  console.warn('AVISO: no se ha localizado la versión en la cabecera de la aplicación; no se ha podido comprobar la coherencia.');
} else if (('V' + mHdr[1]).toUpperCase() !== version.toUpperCase()) {
  console.error('ERROR: el <title> indica ' + version + ' pero la cabecera de la aplicación muestra v' + mHdr[1] + '.');
  console.error('  Corrige ambos en fuente_analizador.html antes de construir.');
  process.exit(1);
} else {
  console.log('Coherencia de versión verificada: título y cabecera coinciden (' + version + ').');
}

const LIBS = [
  ['react.js',        'React 18.2.0 — MIT'],
  ['react-dom.js',    'React-DOM 18.2.0 — MIT'],
  ['xlsx.js',         'SheetJS 0.18.5 — Apache-2.0'],
  ['chart.js',        'Chart.js 4.4.0 — MIT'],
  ['chart-sankey.js', 'chartjs-chart-sankey 0.12.1 — MIT (requiere Chart.js)'],
  ['jspdf.js',        'jsPDF 2.5.1 — MIT'],
  ['html2canvas.js',  'html2canvas 1.4.1 — MIT'],
];

let scripts = '';
for (const [file, desc] of LIBS) {
  const code = fs.readFileSync(path.join(BUILD, 'lib', file), 'utf8');
  if (code.includes('</script')) { console.error('ERROR: ' + file + ' contiene </script'); process.exit(1); }
  scripts += `    <!-- ${desc} -->\n    <script>\n${code}\n    </script>\n`;
  console.log(`  incrustada: ${file} (${(code.length / 1024).toFixed(0)} KB)`);
}

if (app.includes('</script')) { console.error('ERROR: el código de la app contiene </script'); process.exit(1); }
scripts += `    <!-- Aplicación (precompilada desde JSX con Babel 7.23.5) -->\n    <script>\n${app}\n    </script>\n`;

const out = head + scripts + tail;
fs.writeFileSync(OUT, out, 'utf8');
console.log('\nEscrito:', OUT, '(' + (out.length / 1024 / 1024).toFixed(2) + ' MB)');
