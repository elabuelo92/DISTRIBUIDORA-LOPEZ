"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const start = app.indexOf('renderOperationalWorkspace("reparto"');
const end = app.indexOf("\n  ]);", start);
assert.ok(start >= 0 && end > start, "reparto workspace tool list exists");
const source = app.slice(start, end + 6);

function toolsFor(role) {
  let tools = [];
  const context = {
    renderOperationalWorkspace: (_module, _root, _title, entries) => { tools = entries; },
    byId: () => ({}),
    routes: [],
    allStops: [],
    delivered: 0,
    isAdminUser: () => role === "admin",
    canPlanDeliveryRoutes: () => role === "admin",
    currentUser: { role },
    deliveryDevice: { label: "Equipo prueba" },
    deliveryGpsCorrectionClients: () => [],
    escapeHtml: (value) => String(value)
  };
  vm.runInNewContext(source, context);
  return tools;
}

const expectedAdmin = ["planning", "routes", "deliveries", "collections", "collection-corrections", "collection-visits", "gps-corrections", "audit", "settings"];
const adminTools = toolsFor("admin");
assert.deepEqual(Array.from(adminTools, (tool) => tool.id), expectedAdmin);
assert.equal(adminTools[6].title, "Corregir ubicacion de cliente");

const driverTools = toolsFor("driver").filter((tool) => tool.allowed !== false);
assert.deepEqual(Array.from(driverTools, (tool) => tool.id), ["routes", "deliveries", "collection-visits", "gps-corrections", "settings"]);
assert.equal(driverTools.some((tool) => tool.id === "collections" || tool.id === "collection-corrections" || tool.id === "audit"), false);
assert.equal(adminTools.find((tool) => tool.id === "collections").allowed, true);
assert.equal(adminTools.find((tool) => tool.id === "collection-corrections").allowed, true);
assert.equal(adminTools.find((tool) => tool.id === "audit").allowed, true);

console.log("PASS: reparto sigue la secuencia operativa y conserva herramientas segun permisos de administrador y repartidor.");
