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

// 2) La versión la define el archivo fuente; aquí solo se comprueba que exista
const mVer = head.match(/IMID - (V\d+)/);
if (!mVer) { console.error('ERROR: el <title> del archivo fuente no indica versión (IMID - Vnn)'); process.exit(1); }
console.log('Versión detectada en la fuente:', mVer[1]);

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
