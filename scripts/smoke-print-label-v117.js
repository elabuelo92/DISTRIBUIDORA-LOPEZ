const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(appSource, /@page \{ size: 100mm 60mm; margin: 0; \}/);
assert.match(appSource, /\.smart-label-page \{ width: 99mm; height: 59mm;/);
assert.match(appSource, /page-break-inside: avoid; break-inside: avoid;/);
assert.match(appSource, /\.smart-label-page:last-child \{ page-break-after: auto; break-after: auto; \}/);
assert.match(appSource, /height: 100, narrow: 3, wide: 7, quiet: 24/);
assert.match(appSource, /grid-template-rows: auto minmax\(0, 1fr\) 19mm;/);
assert.match(appSource, /\.smart-label-code svg \{ display: block; width: 100%; height: 15\.5mm;/);
assert.match(indexSource, /app\.js\?v=8790-117-r20260827b/);

console.log("OK: etiqueta Safari 100x60 queda contenida en una sola pagina.");
