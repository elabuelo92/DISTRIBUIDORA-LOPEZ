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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function orderDate(order) {
  const value = order && (order.createdAt || order.receivedAt || order.updatedAt || order.dateIso || order.date);
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function productKeys(source) {
  return [
    source && source.productCode,
    source && source.codigo_producto,
    source && source.code,
    source && source.barcode,
    source && source.codigo_barras,
    source && source.name,
    source && source.productName
  ].map(normalizeText).filter(Boolean);
}

function reservationDemand(orders, statuses, productByKey, label) {
  const demand = new Map();
  const missingProducts = [];
  (Array.isArray(orders) ? orders : [])
    .filter((order) => order && order.inventoryMode === "reservation" && statuses.has(String(order.status || "")))
    .forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const qty = Math.max(0, numeric(item && item.reservedQty, 0));
        if (!qty) return;
        const product = productKeys(item).map((key) => productByKey.get(key)).find(Boolean);
        if (!product) {
          missingProducts.push({ orderCode: order.code, product: item.name || item.productCode || "Producto sin identificar", qty, source: label });
          return;
        }
        const key = productKeys(product)[0];
        demand.set(key, (demand.get(key) || 0) + qty);
      });
    });
  return { demand, missingProducts };
}

function restoreOperationalOrders(state, criteria = {}, context = {}) {
  if (!state || typeof state !== "object") throw new Error("El estado operativo no es valido.");
  const motive = String(context.motive || context.reason || "").trim();
  if (!motive) throw new Error("Indicar motivo de la restauracion operativa.");
  const sellers = new Set((Array.isArray(criteria.sellers) ? criteria.sellers : []).map(normalizeText).filter(Boolean));
  const statuses = new Set((Array.isArray(criteria.statuses) ? criteria.statuses : []).map((value) => String(value || "")).filter(Boolean));
  const reservationStatuses = new Set((Array.isArray(criteria.reservationStatuses) ? criteria.reservationStatuses : []).map((value) => String(value || "")).filter(Boolean));
  if (!sellers.size) throw new Error("Seleccionar al menos un vendedor para restaurar.");
  if (!statuses.size || !reservationStatuses.size) throw new Error("Definir estados restaurables y estados que reservan stock.");
  const from = new Date(criteria.dateFrom || 0).getTime();
  const to = criteria.dateTo ? new Date(criteria.dateTo).getTime() : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(from) || (criteria.dateTo && !Number.isFinite(to)) || from > to) throw new Error("El periodo de restauracion no es valido.");

  const activeOrders = Array.isArray(state.orders) ? state.orders : [];
  const archivedOrders = Array.isArray(state.archivedOrders) ? state.archivedOrders : [];
  const activeCodes = new Set(activeOrders.map((order) => String(order && order.code || "").trim()).filter(Boolean));
  const selected = archivedOrders.filter((order) => {
    const code = String(order && order.code || "").trim();
    const at = orderDate(order);
    return code && !activeCodes.has(code)
      && sellers.has(normalizeText(order.seller || order.sellerUsername))
      && statuses.has(String(order.status || ""))
      && at >= from && at <= to;
  });
  const expected = numeric(criteria.expectedCount, 0);
  if (expected > 0 && selected.length !== expected) {
    throw new Error(`La restauracion esperaba ${expected} pedidos y encontro ${selected.length}. No se aplicaron cambios.`);
  }
  if (!selected.length) throw new Error("No se encontraron pedidos archivados para restaurar con esos criterios.");

  const products = Array.isArray(state.products) ? state.products : [];
  const productByKey = new Map();
  products.forEach((product) => productKeys(product).forEach((key) => {
    if (!productByKey.has(key)) productByKey.set(key, product);
  }));
  const currentDemand = reservationDemand(activeOrders, reservationStatuses, productByKey, "activo");
  const restoredDemand = reservationDemand(selected, reservationStatuses, productByKey, "restaurado");
  const missingProducts = [...currentDemand.missingProducts, ...restoredDemand.missingProducts];
  if (missingProducts.length) {
    const first = missingProducts[0];
    throw new Error(`No se puede restaurar: ${first.orderCode} referencia ${first.product} sin producto vigente.`);
  }
  const reservationConflicts = [];
  restoredDemand.demand.forEach((restoredQty, key) => {
    const product = productByKey.get(key);
    const physical = Math.max(0, numeric(product && (product.stock_fisico ?? product.stock_actual ?? product.stock), 0));
    const activeQty = currentDemand.demand.get(key) || 0;
    if (activeQty + restoredQty > physical) {
      reservationConflicts.push({
        productCode: product && (product.codigo_producto || product.code) || key,
        productName: product && product.name || key,
        physical,
        activeReserved: activeQty,
        restoreReserved: restoredQty,
        deficit: activeQty + restoredQty - physical
      });
    }
  });
  if (reservationConflicts.length) {
    const first = reservationConflicts[0];
    throw new Error(`Stock insuficiente para restaurar ${first.productName}: faltan ${first.deficit} unidades. No se aplicaron cambios.`);
  }

  const restoredAt = String(context.at || new Date().toISOString());
  const restoredBy = String(context.user || context.username || "Administracion");
  const batchId = String(context.batchId || `REST-${Date.now()}`);
  const selectedCodes = new Set(selected.map((order) => String(order.code)));
  const restoredOrders = selected.map((order) => {
    const archiveRecord = {
      archivedAt: order.archivedAt || "",
      archivedBy: order.archivedBy || "",
      archiveReason: order.archiveReason || "",
      archiveBatchId: order.archiveBatchId || "",
      restoredAt,
      restoredBy,
      restoreReason: motive,
      restoreBatchId: batchId
    };
    const restored = {
      ...order,
      archiveHistory: [...(Array.isArray(order.archiveHistory) ? order.archiveHistory : []), archiveRecord],
      restoredAt,
      restoredBy,
      restoreReason: motive,
      restoreBatchId: batchId,
      trace: [...(Array.isArray(order.trace) ? order.trace : []), {
        status: order.status,
        at: restoredAt,
        actor: restoredBy,
        user: restoredBy,
        action: "PEDIDO_REACTIVADO_DESDE_HISTORICO",
        note: motive
      }]
    };
    delete restored.archivedAt;
    delete restored.archivedBy;
    delete restored.archiveReason;
    delete restored.archiveBatchId;
    return restored;
  });

  state.orders = [...activeOrders, ...restoredOrders]
    .sort((left, right) => orderDate(right) - orderDate(left));
  state.archivedOrders = archivedOrders.filter((order) => !selectedCodes.has(String(order && order.code || "")));
  const result = {
    id: batchId,
    at: restoredAt,
    user: restoredBy,
    motive,
    criteria: {
      sellers: Array.from(sellers),
      statuses: Array.from(statuses),
      dateFrom: new Date(from).toISOString(),
      dateTo: Number.isFinite(to) ? new Date(to).toISOString() : ""
    },
    restored: restoredOrders.length,
    codes: restoredOrders.map((order) => order.code),
    preservedArchived: state.archivedOrders.length,
    activeOrders: state.orders.length,
    activeRoutes: Array.isArray(state.deliveryRoutes) ? state.deliveryRoutes.length : 0,
    archivedRoutes: Array.isArray(state.archivedDeliveryRoutes) ? state.archivedDeliveryRoutes.length : 0,
    reservationDemand: Array.from(restoredDemand.demand.values()).reduce((sum, qty) => sum + qty, 0),
    reservationConflicts
  };
  state.maintenanceRestoreRuns = Array.isArray(state.maintenanceRestoreRuns) ? state.maintenanceRestoreRuns : [];
  state.maintenanceRestoreRuns.unshift(result);
  state.activity = Array.isArray(state.activity) ? state.activity : [];
  state.activity.unshift({
    type: "Mantenimiento",
    title: `${restoredOrders.length} pedidos reactivados`,
    text: `${restoredBy}: ${motive}. Rutas historicas preservadas sin reactivar.`
  });
  return result;
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

module.exports = { archiveOperationalOrders, restoreOperationalOrders };
