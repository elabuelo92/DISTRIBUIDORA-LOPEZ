#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const TIME_ZONE = "America/Argentina/Buenos_Aires";
const PROTECTED_STATUSES = new Set([
  "en preparacion",
  "preparado",
  "en armado",
  "armado",
  "etiquetado",
  "listo para despacho",
  "despachado",
  "en reparto",
  "controlado",
  "parcialmente entregado",
  "entregado",
  "cobrado",
  "cerrado"
]);

function parseArgs(argv) {
  const [mode = "create", ...rest] = argv;
  const options = { mode };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("--")) continue;
    options[value.slice(2)] = rest[index + 1];
    index += 1;
  }
  return options;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function localDate(value) {
  const date = value instanceof Date ? value : new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function rounded(value) {
  return Math.round(numeric(value) * 100) / 100;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function stateFromPayload(payload) {
  return payload && payload.state && typeof payload.state === "object" ? payload.state : payload;
}

function orderCode(order) {
  return String(order && (order.code || order.id || order.pedido_id) || "").trim();
}

function eventAt(event) {
  return String(event && (event.at || event.createdAt || event.updatedAt || event.dateIso) || "").trim();
}

function eventStatus(event) {
  return normalizeText(event && (event.status || event.state || event.estado || event.newStatus));
}

function routeOrderCode(stop) {
  return String(stop && (stop.orderCode || stop.code || stop.orderId || stop.pedidoId) || "").trim();
}

function routeIsForDate(route, targetDate) {
  const direct = String(route && (route.date || route.fecha) || "").trim();
  if (direct === targetDate) return true;
  return [route && route.createdAt, route && route.updatedAt, route && route.publishedAt, route && route.startedAt]
    .some((value) => localDate(value) === targetDate);
}

function processedToday(order, targetDate, auditedCodes, routedCodes) {
  const currentProtected = PROTECTED_STATUSES.has(normalizeText(order && order.status));
  const trace = Array.isArray(order && order.trace) ? order.trace : [];
  const protectedTraceToday = trace.some((entry) => (
    localDate(eventAt(entry)) === targetDate
    && (PROTECTED_STATUSES.has(eventStatus(entry)) || normalizeText(entry && entry.action).includes("pedido"))
  ));
  const orderActivityToday = [order && order.createdAt, order && order.receivedAt, order && order.updatedAt, order && order.dateIso]
    .some((value) => localDate(value) === targetDate);
  const code = orderCode(order);
  return protectedTraceToday
    || (currentProtected && (orderActivityToday || auditedCodes.has(code) || routedCodes.has(code)));
}

function normalizeItems(order) {
  const items = Array.isArray(order && order.items) ? order.items : [];
  return items.map((item) => ({
    productId: String(item.productId || item.productCode || item.codigo_producto || item.code || "").trim(),
    product: String(item.name || item.product || item.descripcion || "").trim(),
    requestedQty: rounded(item.requestedQty ?? item.qty ?? item.cantidad),
    reservedQty: rounded(item.reservedQty ?? item.reservado),
    missingQty: rounded(item.missingQty ?? item.faltante),
    deliveredQty: rounded(item.deliveredQty ?? item.entregado),
    unitPrice: rounded(item.unitPrice ?? item.price ?? item.precio),
    discountPct: rounded(item.discountPct ?? item.discount ?? item.descuento),
    lineTotal: rounded(item.lineTotal ?? item.total)
  })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function routeReferences(state, code) {
  return (Array.isArray(state.deliveryRoutes) ? state.deliveryRoutes : [])
    .filter((route) => (Array.isArray(route.stops) ? route.stops : []).some((stop) => routeOrderCode(stop) === code))
    .map((route) => ({
      id: String(route.id || route.code || ""),
      date: String(route.date || route.fecha || ""),
      zone: String(route.zone || route.zona || ""),
      status: String(route.status || route.estado || ""),
      driver: String(route.driverUser || route.driverName || route.repartidor || "")
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function relatedAudits(state, code, targetDate) {
  return (Array.isArray(state.globalAudit) ? state.globalAudit : [])
    .filter((entry) => String(entry.entityType || "") === "pedido"
      && String(entry.entityId || "") === code
      && localDate(entry.at || entry.createdAt) === targetDate)
    .map((entry) => ({
      id: String(entry.id || ""),
      at: String(entry.at || entry.createdAt || ""),
      action: String(entry.action || ""),
      user: String(entry.user || entry.username || ""),
      note: String(entry.note || "")
    }));
}

function canonicalOrder(state, order, targetDate) {
  const code = orderCode(order);
  const assembly = order && order.assembly && typeof order.assembly === "object" ? order.assembly : {};
  const label = assembly.label && typeof assembly.label === "object" ? assembly.label : {};
  const items = normalizeItems(order);
  const routes = routeReferences(state, code);
  const core = {
    id: String(order.id || order.pedido_id || code),
    code,
    clientId: String(order.clientId || order.cliente_id || ""),
    client: String(order.client || order.cliente || ""),
    seller: String(order.seller || order.vendedor || ""),
    status: String(order.status || order.estado || ""),
    amount: rounded(order.amount ?? order.total),
    paymentMethod: String(order.paymentMethod || order.forma_pago || ""),
    collectionStatus: String(order.collectionStatus || order.estado_cobranza || ""),
    items,
    assemblyOrderNumber: numeric(assembly.orderNumber ?? assembly.assemblyOrderNumber ?? order.assemblyOrderNumber),
    packages: numeric(assembly.bultosConfirmed ?? order.bultos),
    packageLabels: (Array.isArray(label.packageLabels) ? label.packageLabels : []).map((item) => ({
      id: String(item.id || item.uniqueId || ""),
      packageNumber: numeric(item.packageNumber || item.number),
      totalPackages: numeric(item.totalPackages),
      scanCode: String(item.scanCode || ""),
      scanned: Boolean(item.scanned)
    })).sort((left, right) => left.packageNumber - right.packageNumber),
    route: String(order.route || order.ruta || order.zone || order.zona || ""),
    driver: String(order.driverUser || order.driverName || order.repartidor || ""),
    routes,
    observations: String(order.observations || order.observaciones || assembly.observations || ""),
    credit: stableValue(order.credit || null)
  };
  return {
    ...core,
    createdAt: String(order.createdAt || order.receivedAt || order.date || ""),
    updatedAt: String(order.updatedAt || ""),
    trace: (Array.isArray(order.trace) ? order.trace : []).map((entry) => ({
      at: eventAt(entry),
      status: String(entry.status || entry.state || entry.estado || ""),
      action: String(entry.action || ""),
      actor: String(entry.actor || entry.user || entry.username || ""),
      note: String(entry.note || entry.text || "")
    })),
    audits: relatedAudits(state, code, targetDate),
    hash: digest(core)
  };
}

function createSnapshot(stateFile, targetDate) {
  const payload = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const state = stateFromPayload(payload) || {};
  const audits = Array.isArray(state.globalAudit) ? state.globalAudit : [];
  const auditedCodes = new Set(audits
    .filter((entry) => String(entry.entityType || "") === "pedido" && localDate(entry.at || entry.createdAt) === targetDate)
    .map((entry) => String(entry.entityId || "").trim())
    .filter(Boolean));
  const routesToday = (Array.isArray(state.deliveryRoutes) ? state.deliveryRoutes : []).filter((route) => routeIsForDate(route, targetDate));
  const routedCodes = new Set(routesToday.flatMap((route) => (Array.isArray(route.stops) ? route.stops : []).map(routeOrderCode)).filter(Boolean));
  const orders = (Array.isArray(state.orders) ? state.orders : [])
    .filter((order) => processedToday(order, targetDate, auditedCodes, routedCodes))
    .map((order) => canonicalOrder(state, order, targetDate))
    .sort((left, right) => left.code.localeCompare(right.code));
  const summary = {
    orders: orders.length,
    itemLines: orders.reduce((total, order) => total + order.items.length, 0),
    amount: rounded(orders.reduce((total, order) => total + order.amount, 0)),
    packages: orders.reduce((total, order) => total + numeric(order.packages), 0),
    prepared: orders.filter((order) => ["en preparacion", "preparado", "en armado", "armado", "etiquetado", "listo para despacho"].includes(normalizeText(order.status))).length,
    dispatched: orders.filter((order) => ["despachado", "en reparto", "controlado", "parcialmente entregado", "entregado", "cobrado", "cerrado"].includes(normalizeText(order.status))).length,
    orderCodes: orders.map((order) => order.code),
    firstOrder: orders[0] ? orders[0].code : "",
    lastOrder: orders.length ? orders[orders.length - 1].code : ""
  };
  return {
    schema: "DL_ORDER_DISPATCH_SNAPSHOT_V1",
    targetDate,
    timeZone: TIME_ZONE,
    generatedAt: new Date().toISOString(),
    stateFile: path.resolve(stateFile),
    summary,
    orders,
    logicalHash: digest(orders.map((order) => ({ code: order.code, hash: order.hash })))
  };
}

function compareSnapshots(before, after) {
  const beforeByCode = new Map((before.orders || []).map((order) => [order.code, order]));
  const afterByCode = new Map((after.orders || []).map((order) => [order.code, order]));
  const missing = [...beforeByCode.keys()].filter((code) => !afterByCode.has(code));
  const added = [...afterByCode.keys()].filter((code) => !beforeByCode.has(code));
  const changed = [...beforeByCode.keys()].filter((code) => afterByCode.has(code) && beforeByCode.get(code).hash !== afterByCode.get(code).hash)
    .map((code) => ({ code, before: beforeByCode.get(code).hash, after: afterByCode.get(code).hash }));
  const summaryFields = ["orders", "itemLines", "amount", "packages", "prepared", "dispatched"];
  const summaryDifferences = summaryFields.filter((field) => before.summary[field] !== after.summary[field])
    .map((field) => ({ field, before: before.summary[field], after: after.summary[field] }));
  const ok = before.targetDate === after.targetDate && !missing.length && !added.length && !changed.length && !summaryDifferences.length;
  return {
    ok,
    targetDate: before.targetDate,
    comparedAt: new Date().toISOString(),
    before: before.summary,
    after: after.summary,
    missing,
    added,
    changed,
    summaryDifferences,
    beforeHash: before.logicalHash,
    afterHash: after.logicalHash
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode === "create") {
    const stateFile = options.state || process.env.STATE_FILE || path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "demo-state.json");
    const targetDate = options.date || localDate(new Date());
    if (!options.output) throw new Error("Falta --output para guardar el snapshot.");
    const snapshot = createSnapshot(stateFile, targetDate);
    writeJson(options.output, snapshot);
    console.log(JSON.stringify({ ok: true, output: path.resolve(options.output), targetDate, summary: snapshot.summary, logicalHash: snapshot.logicalHash }, null, 2));
    return;
  }
  if (options.mode === "compare") {
    if (!options.before || !options.after) throw new Error("Faltan --before y --after para comparar.");
    const report = compareSnapshots(
      JSON.parse(fs.readFileSync(options.before, "utf8")),
      JSON.parse(fs.readFileSync(options.after, "utf8"))
    );
    if (options.output) writeJson(options.output, report);
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 42;
    return;
  }
  throw new Error(`Modo no soportado: ${options.mode}`);
}

if (require.main === module) main();

module.exports = { createSnapshot, compareSnapshots, localDate };
