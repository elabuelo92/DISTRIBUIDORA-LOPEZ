"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const portfolio = require("../client-portfolio-engine");
const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
// Exercise the actual seller projection without starting or changing production.
const start = source.indexOf("function stateForUser(state, user) {");
const end = source.indexOf('  if (user && user.role === "depot")', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({
  legalEngine: { migrateState() {} }, normalizeSearchText: portfolio.normalize
});
vm.runInContext(source.slice(start, end) + "\n}", context);

const clients = Array.from({ length: 3000 }, (_, index) => ({
  codigo_cliente: `CAT-${index}`, name: `Cliente ${index}`,
  vendedor_asignado: index % 3 === 0 ? "Vendedor A" : index % 3 === 1 ? "Vendedor B" : "",
  dia_visita: index % 2 ? "Martes" : "Lunes", activo: "SI"
}));
clients.push({ codigo_cliente: "INACTIVE", name: "Baja", activo: "NO" });
const state = {
  clients, orders: [{ code: "A", seller: "Vendedor A" }, { code: "B", seller: "Vendedor B" }],
  archivedOrders: [{ code: "OLD-A", seller: "Vendedor A" }, { code: "OLD-B", seller: "Vendedor B" }],
  accounts: [{ private: true }], globalAudit: [{ private: true }], stockMovements: [{ private: true }]
};
for (const name of ["Vendedor A", "Vendedor B", "Sin asignaciones"]) {
  const user = { username: name, name, role: "seller" };
  const projected = context.stateForUser(state, user);
  assert.equal(projected.clients.length, 3001);
  assert.ok(projected.orders.every((order) => order.seller === name));
  assert.ok(projected.archivedOrders.every((order) => order.seller === name));
  for (const field of ["accounts", "globalAudit", "stockMovements"]) assert.equal(projected[field].length, 0);
  const options = { scope: "outside", sellerIdentities: [name], workday: "Lunes" };
  assert.equal(portfolio.filterClients(projected.clients, options).length, 3000);
  assert.equal(portfolio.filterClients(projected.clients, { ...options, search: "CAT-2999" }).length, 1);
  const own = portfolio.filterClients(projected.clients, { ...options, scope: "portfolio" });
  assert.ok(own.every((client) => client.vendedor_asignado === name));
  const today = portfolio.filterClients(projected.clients, { ...options, scope: "today" });
  assert.ok(today.every((client) => client.vendedor_asignado === name && client.dia_visita === "Lunes"));
}
assert.equal(state.orders.length, 2);
assert.equal(state.accounts.length, 1);
console.log(JSON.stringify({ ok: true, sellers: 3, activeClientsPerSeller: 3000, lastClientSearchable: true, privateHistoryScoped: true }));
