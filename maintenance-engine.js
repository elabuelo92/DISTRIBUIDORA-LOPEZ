"use strict";

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function orderLines(order) {
  return Array.isArray(order && order.items) ? order.items.length : 0;
}

function orderPackages(order) {
  return Math.max(0, numeric((order && order.assembly && order.assembly.bultosConfirmed) ?? (order && order.bultos), 0));
}

function archiveUnique(existing, incoming, keyFor) {
  const seen = new Set();
  return [...incoming, ...existing].filter((item, index) => {
    const key = String(keyFor(item) || `SIN-ID-${index}`).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function archiveOperationalOrders(state, context = {}) {
  if (!state || typeof state !== "object") throw new Error("El estado operativo no es valido.");
  const motive = String(context.motive || context.reason || "").trim();
  if (!motive) throw new Error("Indicar motivo del archivado operativo.");
  const activeOrders = Array.isArray(state.orders) ? state.orders : [];
  const activeRoutes = Array.isArray(state.deliveryRoutes) ? state.deliveryRoutes : [];
  const products = Array.isArray(state.products) ? state.products : [];
  const archivedAt = String(context.at || new Date().toISOString());
  const archivedBy = String(context.user || context.username || "Administracion");
  const batchId = String(context.batchId || `ARCH-${Date.now()}`);
  const before = {
    orders: activeOrders.length,
    routes: activeRoutes.length,
    lines: activeOrders.reduce((sum, order) => sum + orderLines(order), 0),
    amount: activeOrders.reduce((sum, order) => sum + Math.max(0, numeric(order && order.amount, 0)), 0),
    packages: activeOrders.reduce((sum, order) => sum + orderPackages(order), 0),
    reserved: products.reduce((sum, product) => sum + Math.max(0, numeric(product && product.stock_reservado, 0)), 0),
    physical: products.reduce((sum, product) => sum + Math.max(0, numeric(product && (product.stock_fisico ?? product.stock_actual ?? product.stock), 0)), 0)
  };
  const archiveMeta = { archivedAt, archivedBy, archiveReason: motive, archiveBatchId: batchId };
  const archivedOrders = activeOrders.map((order) => ({ ...order, ...archiveMeta }));
  const archivedRoutes = activeRoutes.map((route) => ({ ...route, ...archiveMeta }));
  state.archivedOrders = archiveUnique(
    Array.isArray(state.archivedOrders) ? state.archivedOrders : [],
    archivedOrders,
    (order) => order && order.code
  );
  state.archivedDeliveryRoutes = archiveUnique(
    Array.isArray(state.archivedDeliveryRoutes) ? state.archivedDeliveryRoutes : [],
    archivedRoutes,
    (route) => route && route.id
  );
  state.orders = [];
  state.deliveryRoutes = [];
  products.forEach((product) => {
    const physical = Math.max(0, numeric(product.stock_fisico ?? product.stock_actual ?? product.stock, 0));
    product.stock_fisico = physical;
    product.stock_actual = physical;
    product.stock = physical;
    product.stock_reservado = 0;
    product.stock_disponible = physical;
  });
  const result = {
    id: batchId,
    at: archivedAt,
    user: archivedBy,
    motive,
    before,
    after: {
      orders: 0,
      routes: 0,
      reserved: 0,
      available: products.reduce((sum, product) => sum + Math.max(0, numeric(product && product.stock_disponible, 0)), 0)
    },
    preserved: {
      clients: Array.isArray(state.clients) ? state.clients.length : 0,
      suppliers: Array.isArray(state.suppliers) ? state.suppliers.length : 0,
      commissionRules: state.commissionSettings && Array.isArray(state.commissionSettings.rules) ? state.commissionSettings.rules.length : 0,
      bankReconciliation: Array.isArray(state.bankReconciliation) ? state.bankReconciliation.length : 0
    }
  };
  state.maintenanceArchiveRuns = Array.isArray(state.maintenanceArchiveRuns) ? state.maintenanceArchiveRuns : [];
  state.maintenanceArchiveRuns.unshift(result);
  return result;
}

module.exports = { archiveOperationalOrders };
