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
const other = { codigo_cliente: "C2", name: "Otro cliente", updatedAt: "v2", gpsReview: { status: "needs_correction" } };
let resolveGps;
let rejectGps;
let captures = 0;
let calls = 0;
let request;
let options;
const ctx = vm.createContext({
  state: { clients: [client, other] }, currentUser: { role: "driver" }, deliveryDevice: { id: "D1", label: "Telefono" },
  byId: id => id === "deliveryGpsSearch" ? { value: "" } : panel, escapeHtml: String, window: { confirm: () => true },
  normalizeSearchText: value => String(value || "").toLowerCase(), clientIdentity: client => client.codigo_cliente,
  DeliveryEngine: { clientCoordinates: () => ({ lat: -31.5, lng: -64.3 }) }, isAdminUser: () => ctx.currentUser.role === "admin",
  canUseBrowserGeolocation: () => true,
  navigator: { geolocation: { getCurrentPosition: (ok, fail, opt) => { captures++; options = opt; resolveGps = ok; rejectGps = fail; } } },
  makeLocationPayload: (lat, lng, accuracy, source) => ({ lat, lng, accuracy, source, deviceAt: new Date().toISOString() }),
  gpsClientRejectReason: () => "", showCompactNotice: () => {},
  postOperationalAction: async (url, body) => { calls++; request = { url, body }; client.gpsReview.status = "pending_validation"; }
});
vm.runInContext(app.slice(start, end), ctx);
(async () => {
  ctx.renderDeliveryGpsCorrections();
  assert.match(panel.innerHTML, /Seleccionar cliente/);
  const first = ctx.submitDeliveryClientGpsCorrection("C1");
  await ctx.submitDeliveryClientGpsCorrection("C2");
  await ctx.submitDeliveryClientGpsCorrection("C1");
  ctx.renderDeliveryGpsCorrections();
  assert.equal(captures, 1);
  assert.equal((panel.innerHTML.match(/Procesando GPS/g) || []).length, 1);
  assert.match(panel.innerHTML, /data-delivery-gps-client="C1" disabled/);
  assert.doesNotMatch(panel.innerHTML, /data-delivery-gps-client="C2"/);
  resolveGps({ coords: { latitude: -31.4, longitude: -64.2, accuracy: 8.75 } });
  await first;
  assert.equal(calls, 0, "capture only, no server mutation before explicit send");
  assert.match(panel.innerHTML, /Nueva captura, sin enviar/);
  await ctx.sendDeliveryGpsReview("submit");
  assert.equal(request.url, "api/clients/C1/gps-review");
  assert.equal(other.gpsReview.status, "needs_correction");
  assert.equal(calls, 1);
  assert.equal(request.body.gps.accuracy, 8.75);
  assert.equal(request.body.expectedUpdatedAt, "v1");
  assert.equal(request.body.deviceId, "D1");
  assert.equal(options.maximumAge, 0);
  assert.equal(options.enableHighAccuracy, true);
  assert.match(panel.innerHTML, /Pendiente de validacion/);
  assert.doesNotMatch(panel.innerHTML, /data-delivery-gps-client="C1"/);
  assert.doesNotMatch(panel.innerHTML, /disabled/);
  const failed = ctx.submitDeliveryClientGpsCorrection("C2");
  rejectGps({ message: "Permiso GPS denegado" });
  await failed;
  assert.equal(calls, 1);
  assert.equal((panel.innerHTML.match(/Permiso GPS denegado/g) || []).length, 1);
  assert.match(panel.innerHTML, /role="alert"/);
  assert.doesNotMatch(panel.innerHTML, /disabled|Tomando GPS/);
  const retry = ctx.submitDeliveryClientGpsCorrection("C2");
  assert.doesNotMatch(panel.innerHTML, /Permiso GPS denegado/);
  rejectGps({ message: "Tiempo de espera agotado" });
  await retry;
  assert.equal(captures, 3);
  assert.equal(calls, 1);
  await ctx.submitDeliveryClientGpsCorrection("C1");
  assert.equal(calls, 1);
  client.gpsReview.status = "approved";
  assert.equal(ctx.deliveryGpsCorrectionClients().length, 1);
  ctx.currentUser.role = "seller";
  client.gpsReview.status = "needs_correction";
  await ctx.submitDeliveryClientGpsCorrection("C1");
  assert.equal(calls, 1);
  console.log("PASS delivery GPS UI: fresh precise capture, single request, expected version, pending button removed, approved hidden, role restriction.");
  ctx.currentUser.role = "driver";
  let tick;
  let cleared = 0;
  ctx.setInterval = fn => { tick = fn; return 1; };
  ctx.clearInterval = () => { cleared++; };
  ctx.deliveryLocation = null;
  ctx.window.AndroidLocation = { start: () => {} };
  for (const numeric of [true, false]) {
    const capture = ctx.captureDeliveryClientGps();
    ctx.deliveryLocation = { lat: -31.4, lng: -64.2, accuracy: 8, deviceAt: numeric ? Date.now() : new Date().toISOString() };
    tick();
    const result = await capture;
    assert.equal(typeof result.deviceAt, "string");
    assert.ok(Number.isFinite(Date.parse(result.deviceAt)));
  }
  assert.equal(cleared, 2);
  console.log("PASS Android native milliseconds and ISO timestamps normalized; capture timers released.");
})().catch(error => { console.error(error); process.exitCode = 1; });
