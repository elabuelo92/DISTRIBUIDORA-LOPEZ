"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const DeliveryEngine = require("../delivery-engine");
const OrderEngine = require("../order-engine");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const fixtures = [
  { code: "READY-GPS-HOURS", status: OrderEngine.STATUS.READY_DISPATCH, gps: true, hours: true, zone: "Centro" },
  { code: "READY-NO-GPS", status: OrderEngine.STATUS.READY_DISPATCH, gps: false, hours: true, zone: "Centro" },
  { code: "READY-NO-HOURS", status: OrderEngine.STATUS.READY_DISPATCH, gps: true, hours: false, zone: "Centro" },
  { code: "READY-NO-ZONE", status: OrderEngine.STATUS.READY_DISPATCH, gps: true, hours: true, zone: "" },
  { code: "POSTPONED", status: OrderEngine.STATUS.POSTPONED, gps: false, hours: false, zone: "" },
  { code: "PENDING", status: OrderEngine.STATUS.PENDING, gps: true, hours: true, zone: "Centro" }
];

const eligible = fixtures.filter(DeliveryEngine.isEligibleForRoutePlanning);
assert.deepEqual(eligible.map((order) => order.code), [
  "READY-GPS-HOURS",
  "READY-NO-GPS",
  "READY-NO-HOURS",
  "READY-NO-ZONE",
  "POSTPONED"
]);
assert.equal(DeliveryEngine.isEligibleForRoutePlanning(null), false);
assert.doesNotMatch(app, /normalizeForMatch/);
assert.match(app, /filter\(DeliveryEngine\.isEligibleForRoutePlanning\)/);
assert.match(app, /Pedidos listos:/);
assert.match(app, /Sin asignar:/);
assert.match(app, /Con ruta:/);
assert.match(app, /No existen pedidos elegibles para planificacion con los filtros activos/);
assert.match(html, /data-planner-filter="all" class="active"/);
assert.doesNotMatch(html, /data-planner-filter="unassigned" class="active"/);

console.log(JSON.stringify({
  ok: true,
  version: "8790-130",
  eligible: eligible.length,
  withoutGpsVisible: eligible.some((order) => !order.gps),
  withoutHoursVisible: eligible.some((order) => !order.hours),
  withoutZoneVisible: eligible.some((order) => !order.zone),
  initialFilter: "all",
  missingFunctionReferences: 0
}, null, 2));
