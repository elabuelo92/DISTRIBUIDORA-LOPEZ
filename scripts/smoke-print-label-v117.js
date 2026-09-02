const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(appSource, /@page \{ size: 100mm 60mm; margin: 0; \}/);
assert.match(appSource, /html, body \{ width: 100mm; height: 60mm;/);
assert.match(appSource, /\.smart-label-page \{ width: 100mm; height: 60mm;/);
assert.match(appSource, /page-break-inside: avoid; break-inside: avoid;/);
assert.match(appSource, /\.smart-label-page:last-child \{ page-break-after: auto; break-after: auto; \}/);
assert.match(appSource, /height: 100,[\s\S]*narrow: 3,[\s\S]*wide: 7,[\s\S]*quiet: 18,[\s\S]*showCaption: false,[\s\S]*stretch: true/);
assert.match(appSource, /preserveAspectRatio="\$\{preserveAspectRatio\}" shape-rendering="crispEdges"/);
assert.match(appSource, /grid-template-rows: 15mm 16mm 20mm;/);
assert.match(appSource, /\.smart-label-code svg \{ display: block; width: 100%; height: 13mm;/);
assert.match(appSource, /-webkit-print-color-adjust: exact;/);
assert.match(indexSource, /app\.js\?v=8790-128-r20260902b/);

console.log("OK: etiqueta Safari 100x60 usa ancho fisico completo y barras nitidas.");
