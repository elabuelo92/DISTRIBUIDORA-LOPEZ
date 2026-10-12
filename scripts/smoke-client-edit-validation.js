"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const start = server.indexOf("function editedClientFromInput(");
const end = server.indexOf("\nfunction ", start + 1);
assert.ok(start >= 0 && end > start);
const ctx = vm.createContext({ numeric: (v, d) => Number.isFinite(Number(v)) ? Number(v) : d,
  normalizedClientVisitDays: () => [], normalizedVisitOrders: () => ({}),
  clientHoursEngine: { normalize: () => [], assertValid: x => x, summary: () => "" } });
vm.runInContext(server.slice(start, end), ctx);
for (const balance of [27409.66, -1234.56, 0]) {
  const previous = { name: "Cliente prueba", balance, limit: 12500.25, latitud: -31.4167123456, longitud: -64.1833123456 };
  const before = JSON.stringify(previous);
  const result = ctx.editedClientFromInput(previous, { nombre_comercial: previous.name, domicilio: "Direccion nueva", latitud: previous.latitud, longitud: previous.longitud, saldo_inicial: 999999 }, { role: "admin" });
  assert.equal(result.balance, balance);
  assert.equal(result.saldo_actual, balance);
  assert.equal(result.limit, previous.limit);
  assert.equal(result.latitud, previous.latitud);
  assert.equal(result.longitud, previous.longitud);
  assert.equal(result.domicilio, "Direccion nueva");
  assert.equal(JSON.stringify(previous), before);
  assert.throws(() => ctx.editedClientFromInput(previous, { limite_credito: 1 }, { role: "seller" }), /Administrador/);
}
for (const name of ["saldo_inicial", "limite_credito"]) {
  const input = html.match(new RegExp(`<input name="${name}"[^>]+>`))[0];
  assert.match(input, /step="0.01"/);
}
for (const name of ["latitud", "longitud"]) {
  assert.match(html.match(new RegExp(`<input name="${name}"[^>]+>`))[0], /step="any"/);
}
console.log("PASS client address edit preserves cents, negative credit, coordinates, original object and limit permissions; numeric HTML constraints checked. Browser acceptance pending.");
