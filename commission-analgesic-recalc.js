"use strict";

const crypto = require("crypto");
const orderEngine = require("./order-engine");

const OPERATION = Object.freeze({
  id: "COM-ANALGESICOS-20261101-20261104-V1",
  dateFrom: "2026-11-01T03:00:00.000Z",
  dateTo: "2026-11-05T02:59:59.999Z",
  motive: "Regularizacion autorizada de comisiones de analgesicos desde 01/11/2026; sin recalcular liquidaciones previas.",
  sellers: [
    { name: "Axel", usernames: ["david"] },
    { name: "Kevin Guibert", usernames: ["kevin"] },
    { name: "Matias", usernames: ["matias"] },
    { name: "Ruggero", usernames: ["ruggero david"] }
  ]
});

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function orderTime(order) {
  const value = Date.parse(order && (order.createdAt || order.receivedAt));
  return Number.isFinite(value) ? value : NaN;
}

function operationMarker(state) {
  return (Array.isArray(state && state.commissionAudit) ? state.commissionAudit : [])
    .find(entry => entry && entry.operationId === OPERATION.id && entry.action === "COMISION_RECALCULO_OPERACION") || null;
}

function scopedOrders(state) {
  const from = Date.parse(OPERATION.dateFrom);
  const to = Date.parse(OPERATION.dateTo);
  const names = new Set(OPERATION.sellers.map(item => normalize(item.name)));
  return (Array.isArray(state.orders) ? state.orders : []).filter(order => {
    const time = orderTime(order);
    return Number.isFinite(time) && time >= from && time <= to && names.has(normalize(order.seller));
  });
}

function protectedOrderCodes(state, orders) {
  const settled = new Set();
  (Array.isArray(state.commissionSettlements) ? state.commissionSettlements : []).forEach(settlement => {
    (Array.isArray(settlement.allocations) ? settlement.allocations : []).forEach(item => {
      if (item && item.orderCode) settled.add(String(item.orderCode));
    });
    (Array.isArray(settlement.orders) ? settlement.orders : []).forEach(code => settled.add(String(code)));
  });
  return new Set(orders.filter(order => order.commissionLiquidated === true
    || order.commissionsLiquidated === true
    || Number(order.commissionPaidAmount || 0) > 0
    || settled.has(String(order.code || ""))).map(order => String(order.code || "")));
}

function validateRules(state) {
  const rules = state.commissionSettings && Array.isArray(state.commissionSettings.rules)
    ? state.commissionSettings.rules : [];
  const start = Date.parse(OPERATION.dateFrom);
  for (const seller of OPERATION.sellers) {
    const matches = rules.filter(rule => {
      if (!rule || rule.role !== "seller" || rule.active === false || rule.status === "Inactiva" || Number(rule.percent) !== 10) return false;
      if (!normalize(rule.rubro).includes("analges")) return false;
      const targets = [rule.userLabel, rule.username].map(normalize);
      if (!targets.some(target => target === normalize(seller.name) || seller.usernames.includes(target))) return false;
      const from = Date.parse(rule.startsAt || "2026-01-01T00:00:00.000Z");
      const to = rule.endsAt ? Date.parse(rule.endsAt) : Number.POSITIVE_INFINITY;
      return from <= start && to >= start;
    });
    if (!matches.length) throw new Error(`No se encontro una regla vigente de Analgesicos al 10% para ${seller.name}. No se modifico ningun pedido.`);
  }
}

function orderFingerprint(order) {
  return {
    code: order.code,
    seller: order.seller,
    sellerUsername: order.sellerUsername || "",
    createdAt: order.createdAt || order.receivedAt || "",
    status: order.status || "",
    commissionLiquidated: order.commissionLiquidated === true,
    commissionsLiquidated: order.commissionsLiquidated === true,
    commissionPaidAmount: Number(order.commissionPaidAmount || 0),
    items: (order.items || []).map(item => ({
      productCode: item.productCode || item.codigo_producto || item.code || "",
      name: item.name || item.product || "",
      requestedQty: item.requestedQty ?? item.qty ?? item.cantidad ?? 0,
      unitPrice: item.unitPrice ?? item.price ?? 0,
      lineTotal: item.lineTotal ?? null,
      returnedQty: item.returnedQty ?? 0,
      returnedAmount: item.returnedAmount ?? 0
    })),
    commissions: order.commissions || {}
  };
}

function fingerprint(state, orders) {
  const payload = {
    orders: orders.map(orderFingerprint),
    settlements: (state.commissionSettlements || []).map(item => ({ id: item.id, orders: item.orders || [], allocations: item.allocations || [] })),
    rules: state.commissionSettings && state.commissionSettings.rules || [],
    products: (state.products || []).map(product => [
      product.codigo_producto || product.code || "",
      product.name || product.descripcion || "",
      product.rubro || product.category || product.categoria || product.familia || product.segmento || ""
    ])
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildReport(orders, protectedCodes) {
  const sellers = new Map(OPERATION.sellers.map(seller => [seller.name, {
    seller: seller.name, orders: new Set(), regularizedOrders: new Set(), protectedOrders: new Set(),
    lines: 0, regularizedLines: 0, protectedLines: 0, units: 0, baseAmount: 0,
    commissionAmount: 0, protectedCommissionAmount: 0
  }]));
  const productRows = new Map();
  orders.forEach(order => {
    const sellerName = OPERATION.sellers.find(item => normalize(item.name) === normalize(order.seller))?.name;
    const seller = sellers.get(sellerName);
    if (!seller) return;
    const protectedOrder = protectedCodes.has(String(order.code || ""));
    const lines = order.commissions && order.commissions.seller && order.commissions.seller.lines || [];
    lines.filter(line => normalize(line.rubro || "").includes("analges")).forEach(line => {
      const code = String(line.productCode || "");
      const product = String(line.productName || "");
      const percent = Number(line.percent || 0);
      const key = [sellerName, code, product, percent, protectedOrder].join("\u0000");
      const row = productRows.get(key) || {
        seller: sellerName, productCode: code, product, percent, protected: protectedOrder,
        orders: new Set(), lines: 0, units: 0, baseAmount: 0, commissionAmount: 0
      };
      row.orders.add(String(order.code || ""));
      row.lines += 1;
      row.units += Number(line.quantity || 0);
      row.baseAmount += Number(line.baseAmount || 0);
      row.commissionAmount += Number(line.commission || 0);
      productRows.set(key, row);

      seller.orders.add(String(order.code || ""));
      (protectedOrder ? seller.protectedOrders : seller.regularizedOrders).add(String(order.code || ""));
      seller.lines += 1;
      if (protectedOrder) seller.protectedLines += 1;
      else seller.regularizedLines += 1;
      seller.units += Number(line.quantity || 0);
      seller.baseAmount += Number(line.baseAmount || 0);
      seller.commissionAmount += Number(line.commission || 0);
      if (protectedOrder) seller.protectedCommissionAmount += Number(line.commission || 0);
    });
  });
  const summaries = [...sellers.values()].map(item => ({
    seller: item.seller,
    orders: item.orders.size,
    regularizedOrders: item.regularizedOrders.size,
    protectedOrders: item.protectedOrders.size,
    lines: item.lines,
    regularizedLines: item.regularizedLines,
    protectedLines: item.protectedLines,
    units: item.units,
    baseAmount: round(item.baseAmount),
    commissionAmount: round(item.commissionAmount),
    protectedCommissionAmount: round(item.protectedCommissionAmount)
  }));
  const totals = summaries.reduce((total, item) => {
    ["orders", "regularizedOrders", "protectedOrders", "lines", "regularizedLines", "protectedLines", "units", "baseAmount", "commissionAmount", "protectedCommissionAmount"].forEach(key => total[key] += item[key]);
    return total;
  }, { orders: 0, regularizedOrders: 0, protectedOrders: 0, lines: 0, regularizedLines: 0, protectedLines: 0, units: 0, baseAmount: 0, commissionAmount: 0, protectedCommissionAmount: 0 });
  const details = [...productRows.values()].map(item => ({
    seller: item.seller,
    productCode: item.productCode,
    product: item.product,
    percent: item.percent,
    protected: item.protected,
    orders: item.orders.size,
    lines: item.lines,
    units: item.units,
    baseAmount: round(item.baseAmount),
    commissionAmount: round(item.commissionAmount)
  })).sort((a, b) => a.seller.localeCompare(b.seller) || a.product.localeCompare(b.product) || a.percent - b.percent);
  return {
    period: "01/11/2026 al 04/11/2026",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    note: "Comision devengada por lineas de Analgesicos. Los pedidos vinculados a pagos o liquidaciones se informan, pero no se recalculan.",
    sellers: summaries,
    totals,
    details
  };
}

function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function operationInput(orderCodes) {
  return {
    dateFrom: OPERATION.dateFrom,
    dateTo: OPERATION.dateTo,
    sellerNames: OPERATION.sellers.map(item => item.name),
    orderCodes,
    motive: OPERATION.motive,
    operationId: OPERATION.id,
    sellerOnly: true,
    skipMigration: true,
    skipMetricsRefresh: true
  };
}

function calculatePreview(state, actor = { name: "Vista previa" }) {
  validateRules(state);
  const orders = scopedOrders(state);
  const protectedCodes = protectedOrderCodes(state, orders);
  const eligible = orders.filter(order => !protectedCodes.has(String(order.code || "")));
  if (!eligible.length) throw new Error("No hay pedidos pendientes de regularizacion en el periodo; no se escribio ningun dato.");
  const eligibleCodes = eligible.map(order => String(order.code || ""));
  if (eligibleCodes.some(code => !code) || new Set(eligibleCodes).size !== eligibleCodes.length) {
    throw new Error("Hay pedidos sin codigo unico en el periodo; no se modifico ningun dato.");
  }

  const draft = {
    products: deepCopy(state.products || []),
    commissionSettings: deepCopy(state.commissionSettings || { rules: [] }),
    sellers: deepCopy((state.sellers || []).filter(seller => OPERATION.sellers.some(item => normalize(item.name) === normalize(seller.name)))),
    orders: deepCopy(orders),
    commissionAudit: []
  };
  const result = orderEngine.recalculateCommissions(draft, operationInput(eligibleCodes), actor);
  if (result.count !== eligible.length) throw new Error("La vista previa no pudo resolver todos los pedidos elegibles; no se modifico ningun dato.");
  const report = buildReport(draft.orders, protectedCodes);
  const wrongRate = report.details.filter(line => !line.protected && Math.abs(line.percent - 10) > 0.0001);
  if (wrongRate.length) throw new Error(`La vista previa detecto ${wrongRate.length} linea(s) de Analgesicos que no quedarian al 10%. No se modifico ningun dato.`);

  return {
    operationId: OPERATION.id,
    fingerprint: fingerprint(state, orders),
    dateFrom: OPERATION.dateFrom,
    dateTo: OPERATION.dateTo,
    motive: OPERATION.motive,
    count: result.count,
    protectedCount: protectedCodes.size,
    previousTotal: result.previousTotal,
    nextTotal: result.nextTotal,
    difference: result.difference,
    report,
    calculatedOrders: draft.orders.filter(order => eligibleCodes.includes(String(order.code || ""))),
    auditEntries: draft.commissionAudit
  };
}

function summaryFromMarker(marker) {
  return { alreadyExecuted: true, result: marker.result, report: marker.report };
}

function preview(state, operationId) {
  if (operationId !== OPERATION.id) throw new Error("Identificador de regularizacion invalido.");
  const marker = operationMarker(state);
  if (marker) return summaryFromMarker(marker);
  const result = calculatePreview(state);
  delete result.calculatedOrders;
  delete result.auditEntries;
  return result;
}

function execute(state, input, actor = {}) {
  if (!input || input.operationId !== OPERATION.id) throw new Error("Identificador de regularizacion invalido.");
  const marker = operationMarker(state);
  if (marker) return summaryFromMarker(marker);
  const calculation = calculatePreview(state, actor);
  if (!input.fingerprint || input.fingerprint !== calculation.fingerprint) {
    throw new Error("Los pedidos o las reglas cambiaron desde la vista previa. Volve a previsualizar; no se modifico ningun dato.");
  }
  const actualOrders = new Map((state.orders || []).map(order => [String(order.code || ""), order]));
  for (const order of calculation.calculatedOrders) {
    if (!actualOrders.has(String(order.code || ""))) throw new Error(`El pedido ${order.code} ya no esta disponible; no se aplico la regularizacion.`);
  }

  const result = {
    count: calculation.count,
    protectedCount: calculation.protectedCount,
    previousTotal: calculation.previousTotal,
    nextTotal: calculation.nextTotal,
    difference: calculation.difference,
    dateFrom: calculation.dateFrom,
    dateTo: calculation.dateTo,
    motive: calculation.motive
  };
  calculation.calculatedOrders.forEach(order => {
    actualOrders.get(String(order.code || "")).commissions = deepCopy(order.commissions);
  });
  state.commissionAudit = Array.isArray(state.commissionAudit) ? state.commissionAudit : [];
  state.commissionAudit.unshift(...calculation.auditEntries);
  OPERATION.sellers.forEach(seller => orderEngine.refreshSellerMetrics(state, seller.name));
  const markerEntry = {
    id: `${OPERATION.id}-AUDIT`,
    action: "COMISION_RECALCULO_OPERACION",
    operationId: OPERATION.id,
    at: new Date().toISOString(),
    user: String(actor.name || actor.username || "Administracion"),
    username: String(actor.username || ""),
    motive: OPERATION.motive,
    result,
    report: calculation.report
  };
  state.commissionAudit.unshift(markerEntry);
  return { ...result, operationId: OPERATION.id, report: calculation.report, alreadyExecuted: false };
}

module.exports = { OPERATION, preview, execute };
