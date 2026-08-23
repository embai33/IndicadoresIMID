# Cómo se construye la aplicación

Desde la v37 hay dos tipos de archivo, y conviene no confundirlos:

| Archivo | Qué es | ¿Se edita? |
|---|---|---|
| `fuente_analizador.html` | **El código fuente.** Contiene el JSX legible. | ✅ **Sí. Todos los cambios se hacen aquí.** |
| `analizador_dispensaciones_Vnn.html` | Resultado de compilar la fuente. Lleva las librerías dentro. | ❌ No. Se genera. |
| `index.html` | Copia de la última versión generada. Es lo que se publica. | ❌ No. Se genera. |

**Nunca edites los archivos generados**: contienen JavaScript ya compilado, y cualquier
cambio se perdería en la siguiente construcción.

## Qué hace la construcción

1. **Compilar**: traduce el JSX a JavaScript normal con Babel 7.23.5, para que el
   navegador no tenga que hacerlo en cada carga (era lo que provocaba los 8-16
   segundos de espera al abrir la aplicación).
2. **Ensamblar**: incrusta las 7 librerías dentro del propio HTML, de modo que la
   aplicación no dependa de internet ni de servidores externos (CDN).

## Pasos

Requiere Node.js instalado y, la primera vez, conexión a internet para descargar
las librerías.

```bash
# 1. Descargar las librerías (solo la primera vez)
mkdir -p lib
curl -o lib/react.js        https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js
curl -o lib/react-dom.js    https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js
curl -o lib/xlsx.js         https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
curl -o lib/chart.js        https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
curl -o lib/chart-sankey.js https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.12.1/dist/chartjs-chart-sankey.min.js
curl -o lib/jspdf.js        https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
curl -o lib/html2canvas.js  https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
curl -o babel-build-only.js https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js

# 2. Compilar el JSX de la fuente
node 1-compilar.js ../fuente_analizador.html

# 3. Ensamblar el archivo final (el número de versión se toma del <title> de la fuente)
node 2-ensamblar.js ../analizador_dispensaciones_V38.html

# 4. Publicar: copiar el resultado a index.html
cp ../analizador_dispensaciones_V38.html ../index.html
```

## Al crear una versión nueva

1. Edita `fuente_analizador.html` con los cambios.
2. Actualiza en la fuente el número de versión en dos sitios: la etiqueta `<title>`
   (`IMID - Vnn`) y el texto de la cabecera (`<strong>vnn</strong>`).
3. Repite los pasos 2, 3 y 4 de arriba con el nuevo número.

## Comprobaciones antes de publicar

El archivo generado debe cumplir:

- Ninguna referencia a CDN: `grep -c 'src="https://' index.html` → **0**
- Nada de Babel en el navegador: `grep -c 'text/babel' index.html` → **0**
- Abrirlo con doble clic (sin servidor ni internet) y comprobar que carga en menos
  de un segundo y que se pueden generar los análisis.
