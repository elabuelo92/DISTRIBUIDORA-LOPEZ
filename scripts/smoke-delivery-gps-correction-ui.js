"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const start = app.indexOf("let deliveryGpsCorrectionBusy = false;");
const end = app.indexOf("function renderDeliveryStops(", start);
assert.ok(start > 0 && end > start);
const panel = { innerHTML: "" };
const client = { codigo_cliente: "C1", name: "Cliente", updatedAt: "v1", gpsReview: { status: "needs_correction" } };
let calls = 0;
let request;
let options;
const ctx = vm.createContext({
  state: { clients: [client] }, currentUser: { role: "driver" }, deliveryDevice: { id: "D1", label: "Telefono" },
  byId: () => panel, escapeHtml: String, window: { confirm: () => true },
  canUseBrowserGeolocation: () => true,
  navigator: { geolocation: { getCurrentPosition: (ok, fail, opt) => { options = opt; ok({ coords: { latitude: -31.4, longitude: -64.2, accuracy: 8.75 } }); } } },
  makeLocationPayload: (lat, lng, accuracy, source) => ({ lat, lng, accuracy, source, deviceAt: new Date().toISOString() }),
  gpsClientRejectReason: () => "", showCompactNotice: () => {},
  postOperationalAction: async (url, body) => { calls++; request = { url, body }; client.gpsReview.status = "pending_validation"; }
});
vm.runInContext(app.slice(start, end), ctx);
(async () => {
  ctx.renderDeliveryGpsCorrections();
  assert.match(panel.innerHTML, /Registrar ubicacion actual/);
  await Promise.all([ctx.submitDeliveryClientGpsCorrection("C1"), ctx.submitDeliveryClientGpsCorrection("C1")]);
  assert.equal(calls, 1);
  assert.equal(request.body.gps.accuracy, 8.75);
  assert.equal(request.body.expectedUpdatedAt, "v1");
  assert.equal(request.body.deviceId, "D1");
  assert.equal(options.maximumAge, 0);
  assert.equal(options.enableHighAccuracy, true);
  assert.match(panel.innerHTML, /Pendiente de validacion/);
  assert.doesNotMatch(panel.innerHTML, /data-delivery-gps-client/);
  await ctx.submitDeliveryClientGpsCorrection("C1");
  assert.equal(calls, 1);
  client.gpsReview.status = "approved";
  assert.equal(ctx.deliveryGpsCorrectionClients().length, 0);
  ctx.currentUser.role = "seller";
  client.gpsReview.status = "needs_correction";
  await ctx.submitDeliveryClientGpsCorrection("C1");
  assert.equal(calls, 1);
  console.log("PASS delivery GPS UI: fresh precise capture, single request, expected version, pending button removed, approved hidden, role restriction.");
})().catch(error => { console.error(error); process.exitCode = 1; });
