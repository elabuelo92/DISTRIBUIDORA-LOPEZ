"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const DeliveryEngine = require("../delivery-engine");
const OrderEngine = require("../order-engine");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function buildState(volume) {
  const clients = Array.from({ length: volume }, (_, index) => ({
    codigo_cliente: `C-132-${String(index + 1).padStart(3, "0")}`,
    name: `Cliente Ruta 132 ${String(index + 1).padStart(3, "0")}`,
    domicilio: `Calle Operativa ${index + 1}`,
    localidad: "Cordoba",
    zona: "Centro",
    ruta: "Centro",
    latitud: -31.41 + index / 100000,
    longitud: -64.18 + index / 100000,
    status: "Activo"
  }));
  const orders = clients.map((client, index) => ({
    code: `PED-132-${String(index + 1).padStart(3, "0")}`,
    client: client.name,
    clientId: client.codigo_cliente,
    seller: "Vendedor Prueba",
    amount: 10000 + index,
    status: OrderEngine.STATUS.READY_DISPATCH,
    inventoryMode: "direct",
    items: [{
      productCode: "P-132",
      name: "Producto operativo",
      requestedQty: 1,
      reservedQty: 0,
      missingQty: 0,
      unitPrice: 10000 + index,
      lineTotal: 10000 + index
    }],
    assembly: {
      orderNumber: index + 1,
      bultosConfirmed: 1,
      label: {
        id: `ETQ-132-${index + 1}`,
        generated: true,
        scanned: false,
        scannerOptional: true,
        scannerOmitted: true,
        packageLabels: []
      }
    },
    trace: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  return {
    products: [{ codigo_producto: "P-132", name: "Producto operativo", stock_fisico: 1000, stock_actual: 1000, stock: 1000 }],
    clients,
    sellers: [],
    orders,
    activity: [],
    notifications: [],
    globalAudit: [],
    stockMovements: [],
    shortages: [],
    accounts: [],
    priceLists: [],
    deliveryRoutes: [],
    deliveryAudit: [],
    deliveryClosures: []
  };
}

const state = buildState(60);
const context = {
  user: "Darío",
  username: "dario",
  role: "driver",
  deviceId: "DARIO-MOBILE",
  deviceLabel: "Darío",
  gps: { lat: -31.4167, lng: -64.1833, accuracy: 10 }
};
const codes = state.orders.map((order) => order.code);
const route = DeliveryEngine.createPlannedRoute(state, {
  orderCodes: codes,
  day: "2026-09-05",
  zone: "Centro",
  driverUser: "dario",
  driverLabel: "Darío"
}, context);
assert.equal(route.stops.length, 60);
assert.equal(route.driverUser, "dario");

const undoState = buildState(3);
const undoRoute = DeliveryEngine.createPlannedRoute(undoState, {
  orderCodes: undoState.orders.map((order) => order.code),
  day: "2026-09-04",
  zone: "Centro",
  driverUser: "dario",
  driverLabel: "Darío"
}, context);
DeliveryEngine.removePlannedRoute(undoState, undoRoute.id, context);
assert.equal(undoState.deliveryRoutes.length, 0);
assert.equal(undoState.orders.filter((order) => order.status === OrderEngine.STATUS.READY_DISPATCH).length, 3);

const reversed = route.stops.map((stop) => stop.orderCode).reverse();
const reordered = DeliveryEngine.reorderRoute(state, route.id, reversed, context);
assert.equal(reordered.manualOrder, true);
assert.deepEqual(reordered.stops.map((stop) => stop.orderCode), reversed);
assert.deepEqual(reordered.stops.map((stop) => stop.sequence), Array.from({ length: 60 }, (_, index) => index + 1));

const published = DeliveryEngine.publishRoute(state, route.id, context);
assert.equal(published.status, DeliveryEngine.ROUTE_STATUS.READY);
assert.equal(state.orders.filter((order) => order.status === OrderEngine.STATUS.DISPATCHED).length, 60);
assert.equal(state.orders.filter((order) => order.assembly.label.scanned).length, 0);

DeliveryEngine.claimRoute(state, route.id, context);
const firstCode = published.stops[0].orderCode;
DeliveryEngine.updateStopStatus(state, firstCode, OrderEngine.STATUS.IN_ROUTE, context);
const rejected = DeliveryEngine.markStopException(state, firstCode, {
  status: OrderEngine.STATUS.REJECTED,
  reason: "Cliente rechazo",
  observations: "Prueba controlada sin firma",
  attachments: {}
}, context);
assert.equal(rejected.order.status, OrderEngine.STATUS.REJECTED);
assert.deepEqual(rejected.stop.attachments, {});

assert.match(app, /function canPlanDeliveryRoutes\(\)/);
assert.match(app, /currentUser\.role === "driver"[\s\S]*username[\s\S]*=== "dario"/);
assert.match(app, /data-route-drag/);
assert.match(app, /persistDeliveryDragOrder/);
assert.match(server, /function canPlanDeliveryRoutes\(user\)/);
assert.equal((server.match(/!canPlanDeliveryRoutes\(sessionUser\)/g) || []).length, 5);
assert.match(server, /Exportar reportes requiere Administrador o Planificador de reparto/);
assert.match(html, /delivery-planner-authorized/);
assert.match(html, /id="deliverySignatureBox" hidden/);
assert.match(html, /id="deliveryExceptionSignatureBox" hidden/);
assert.doesNotMatch(app, /La firma del cliente es obligatoria/);
assert.doesNotMatch(app, /uploadDeliveryImage\(orderCode, "signature"/);
assert.match(app, /Scanner opcional/);
assert.match(app, /class="delivery-stop-table"/);
assert.match(app, /data-route-manifest="csv"/);
assert.match(app, /data-unplan-planned-route/);
assert.match(app, /function unplanDeliveryRoute\(routeId, reason\)/);
assert.match(html, /Rutas abiertas/);
assert.doesNotMatch(server, /Planificacion permitida solo para administradores/);

console.log(JSON.stringify({
  ok: true,
  version: "8790-141",
  plannedOrders: route.stops.length,
  reorderedOrders: reordered.stops.length,
  dispatchedWithoutScanner: state.orders.filter((order) => !order.assembly.label.scanned).length,
  rejectedWithoutSignature: rejected.order.code,
  routePlannerRole: "dario",
  manualOrderPersisted: reordered.manualOrder
}, null, 2));
