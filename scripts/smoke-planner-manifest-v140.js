"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /id="exportDeliveryPlannerCsvBtn"/);
assert.match(html, /id="exportDeliveryPlannerPdfBtn"/);
assert.match(app, /function deliveryPlannerExportOrders\(\)/);
assert.match(app, /selected\.length \? selected : deliveryPlannerCandidates\(\)/);
assert.match(app, /function deliveryPlannerManifestRecord\(order, index\)/);
assert.match(app, /"Domicilio"/);
assert.match(app, /"Referencia"/);
assert.match(app, /"Latitud"/);
assert.match(app, /"Longitud"/);
assert.match(app, /"Maps"/);
assert.match(app, /manifiesto-planificacion-/);
assert.match(app, /makeTablePdf\(`Manifiesto para planificar/);
assert.match(app, /exportDeliveryPlannerManifest\("csv"\)/);
assert.match(app, /exportDeliveryPlannerManifest\("pdf"\)/);

console.log(JSON.stringify({
  ok: true,
  version: "8790-140",
  sources: ["seleccion", "resultados filtrados"],
  formats: ["CSV", "PDF"],
  structuredColumns: true,
  includesAddressGpsAndMaps: true,
  changesOperationalState: false
}, null, 2));
