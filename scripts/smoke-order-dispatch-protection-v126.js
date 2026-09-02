"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createSnapshot, compareSnapshots } = require("./order-dispatch-snapshot");

const deploySource = fs.readFileSync(path.join(__dirname, "deploy", "safe-production-deploy.py"), "utf8");
assert.match(deploySource, /orders-today-before\.json/);
assert.match(deploySource, /orders-today-after\.json/);
assert.match(deploySource, /orders-today-comparison\.json/);
assert.match(deploySource, /rollback_deploy 42 'ORDER_INTEGRITY_COMPARISON_FAILED'/);
assert.match(deploySource, /DESTRUCTIVE_MIGRATION_REQUIRES_EXPLICIT_REVIEW/);
assert.match(deploySource, /':!scripts\/deploy\/safe-production-deploy\.py'/);
assert.match(deploySource, /sudo systemctl stop \{SERVICE\}[\s\S]*data\.tar\.gz[\s\S]*orders-today-before\.json[\s\S]*git checkout main/);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-order-protection-"));
const stateFile = path.join(tempDir, "state.json");
const targetDate = "2026-09-01";
const processedOrder = {
  code: "PED-9001",
  client: "Cliente Protegido",
  status: "Listo para Despacho",
  amount: 2500,
  createdAt: "2026-09-01T11:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  items: [
    { productCode: "A", name: "Producto A", requestedQty: 2, reservedQty: 2, missingQty: 0, unitPrice: 1000, lineTotal: 2000 },
    { productCode: "B", name: "Producto B", requestedQty: 1, reservedQty: 1, missingQty: 0, unitPrice: 500, lineTotal: 500 }
  ],
  assembly: {
    orderNumber: 18,
    bultosConfirmed: 2,
    observations: "Cuidar mercaderia",
    label: { packageLabels: [{ id: "PED9001B1", packageNumber: 1, totalPackages: 2, scanCode: "PED9001B1", scanned: true }] }
  },
  trace: [{ at: "2026-09-01T12:00:00.000Z", status: "Listo para Despacho", action: "PEDIDO_ETIQUETA_ESCANEADA" }]
};
const historicalProcessedToday = {
  code: "PED-8999",
  client: "Cliente Historico",
  status: "Despachado",
  amount: 1000,
  createdAt: "2026-08-31T14:00:00.000Z",
  updatedAt: "2026-09-01T13:00:00.000Z",
  items: [{ productCode: "C", name: "Producto C", requestedQty: 1, unitPrice: 1000, lineTotal: 1000 }],
  assembly: { orderNumber: 17, bultosConfirmed: 1, label: { packageLabels: [] } },
  trace: [{ at: "2026-09-01T13:00:00.000Z", status: "Despachado", action: "PEDIDO_DESPACHADO" }]
};
const pendingOrder = {
  code: "PED-9002",
  client: "Cliente Pendiente",
  status: "Pendiente",
  amount: 700,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  items: [{ productCode: "D", name: "Producto D", requestedQty: 1, unitPrice: 700, lineTotal: 700 }]
};
const state = {
  state: {
    orders: [processedOrder, historicalProcessedToday, pendingOrder],
    deliveryRoutes: [{ id: "RUTA-1", date: targetDate, zone: "Norte", driverUser: "repartidor1", stops: [{ orderCode: "PED-9001" }] }],
    globalAudit: [{ id: "AUD-1", at: "2026-09-01T12:01:00.000Z", entityType: "pedido", entityId: "PED-9001", action: "PEDIDO_ETIQUETA_ESCANEADA" }]
  }
};

fs.writeFileSync(stateFile, JSON.stringify(state), "utf8");
const before = createSnapshot(stateFile, targetDate);
assert.equal(before.summary.orders, 2, "protege los pedidos procesados y excluye pendientes");
assert.equal(before.summary.itemLines, 3);
assert.equal(before.summary.amount, 3500);
assert.equal(before.summary.packages, 3);
assert.deepEqual(before.summary.orderCodes, ["PED-8999", "PED-9001"]);
assert.equal(compareSnapshots(before, JSON.parse(JSON.stringify(before))).ok, true, "snapshot identico habilita despliegue");

const changedQuantity = JSON.parse(JSON.stringify(before));
changedQuantity.orders.find((order) => order.code === "PED-9001").items[0].requestedQty = 3;
changedQuantity.orders.find((order) => order.code === "PED-9001").hash = "alterado";
const changedReport = compareSnapshots(before, changedQuantity);
assert.equal(changedReport.ok, false);
assert.equal(changedReport.changed[0].code, "PED-9001", "cantidad alterada bloquea despliegue");

const missingOrder = JSON.parse(JSON.stringify(before));
missingOrder.orders = missingOrder.orders.filter((order) => order.code !== "PED-8999");
missingOrder.summary.orders -= 1;
missingOrder.summary.itemLines -= 1;
missingOrder.summary.amount -= 1000;
missingOrder.summary.packages -= 1;
const missingReport = compareSnapshots(before, missingOrder);
assert.equal(missingReport.ok, false);
assert.deepEqual(missingReport.missing, ["PED-8999"], "pedido faltante bloquea despliegue");

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(JSON.stringify({
  ok: true,
  version: "8790-126",
  protectedOrders: before.summary.orders,
  logicalHash: before.logicalHash,
  changedBlocked: !changedReport.ok,
  missingBlocked: !missingReport.ok
}, null, 2));
