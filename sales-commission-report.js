(function initSalesCommissionReport(root, factory) {
  const report = factory();
  if (typeof module === "object" && module.exports) module.exports = report;
  if (root) root.DLSalesCommissionReport = report;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildSalesCommissionReport() {
  "use strict";

  function amount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function build(orders) {
    const bySeller = new Map();
    const details = [];
    (orders || []).forEach((order) => {
      if (["cancelado", "rechazado"].includes(String(order.status || "").trim().toLocaleLowerCase("es"))) return;
      const block = order.commissions?.seller;
      const seller = String(block?.user || order.seller || "").trim();
      if (!seller) return;
      const row = bySeller.get(seller) || {
        seller, clients: new Set(), orders: 0, units: 0, gross: 0,
        general: 0, cigarettes: 0, commissionBase: 0, commission: 0
      };
      row.clients.add(String(order.client || ""));
      row.orders += 1;
      row.gross += amount(order.amount);
      row.commissionBase += amount(block?.baseAmount);
      row.commission += amount(block?.total);
      (order.items || []).forEach((item, index) => {
        const line = block?.lines?.[index] || {};
        const quantity = amount(line.quantity ?? item.requestedQty ?? item.qty ?? item.quantity ?? item.cantidad);
        const base = amount(line.baseAmount ?? item.lineTotal);
        const group = line.group || "mercaderia";
        row.units += quantity;
        if (group === "cigarrillos") row.cigarettes += base;
        else row.general += base;
        details.push({
          seller, orderCode: order.code || "", date: order.createdAt || order.receivedAt || order.date || "",
          client: order.client || "", product: line.productName || item.name || "",
          quantity, gross: base, group, percent: amount(line.percent), commission: amount(line.commission),
          ruleId: line.ruleId || ""
        });
      });
      bySeller.set(seller, row);
    });
    return {
      sellers: [...bySeller.values()].map((row) => ({
        ...row,
        clients: [...row.clients].filter(Boolean).length,
        percent: row.commissionBase ? row.commission * 100 / row.commissionBase : 0
      })).sort((a, b) => a.seller.localeCompare(b.seller, "es")),
      details
    };
  }

  function dateKey(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const parsed = new Date(`${value}T12:00:00Z`);
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : "";
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function currentWeek(now = new Date()) {
    const to = dateKey(now);
    const date = new Date(`${to}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return { from: date.toISOString().slice(0, 10), to };
  }

  function buildStatistics(orders, filters = currentWeek()) {
    const { from, to } = filters;
    if (!dateKey(from) || !dateKey(to) || from > to) throw new Error("Indicar un periodo valido: desde no puede superar hasta.");
    const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const seen = new Set(), products = new Map(), sellers = new Map();
    const missingCosts = [];
    let gross = 0, returns = 0, knownCost = 0, missingCostLines = 0, invalidDates = 0, orderCount = 0;
    for (const order of orders || []) {
      const key = String(order.code || order.id || "");
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      if (["cancelado", "rechazado", "anulado"].includes(normalize(order.status))) continue;
      const kind = normalize(order.type || order.kind || order.orderType).replace(/[_-]/g, " ");
      if (order.isCollectionOrder === true || order.collectionOnly === true || ["orden de cobro", "orden cobro", "collection", "collection order"].includes(kind)) continue;
      const allItems = order.items || [];
      const items = allItems.filter(item => normalize(item.name || item.product) !== "saldo a cobrar");
      if (allItems.length && !items.length) continue;
      const date = dateKey(order.createdAt || order.receivedAt || order.date);
      if (!date) { invalidDates++; continue; }
      if (date < from || date > to) continue;
      const total = amount(order.amount);
      gross += total;
      orderCount++;
      const sellerName = String(order.seller || order.commissions?.seller?.user || "Sin vendedor");
      const seller = sellers.get(sellerName) || { seller: sellerName, orders: 0, gross: 0 };
      seller.orders++;
      seller.gross += total;
      sellers.set(sellerName, seller);
      if (!items.length) {
        missingCostLines++;
        missingCosts.push({ orderCode: key, date, code: "", product: "Sin detalle de productos", quantity: 0 });
      }
      for (const item of items) {
        const code = String(item.productCode || item.codigo_producto || item.code || "");
        const name = String(item.name || item.product || "Sin producto");
        const requested = Math.max(0, amount(item.requestedQty ?? item.qty ?? item.quantity ?? item.cantidad));
        const returned = Math.min(requested, Math.max(0, amount(item.returnedQty)));
        const quantity = requested - returned;
        const lineTotal = amount(item.lineTotal ?? (requested * amount(item.unitPrice)));
        const returnedValue = requested ? lineTotal * returned / requested : 0;
        returns += returnedValue;
        const value = lineTotal - returnedValue;
        const row = products.get(code || name) || { code, product: name, units: 0, gross: 0 };
        row.units += quantity;
        row.gross += value;
        products.set(code || name, row);
        const cost = item.unitCostAtSale ?? item.costSnapshot?.unitCost;
        if (quantity > 0 && (cost === undefined || cost === null || String(cost).trim() === "" || typeof cost === "boolean" || !Number.isFinite(Number(cost)) || Number(cost) < 0)) {
          missingCostLines++;
          missingCosts.push({ orderCode: key, date, code, product: name, quantity });
        } else if (quantity > 0) knownCost += quantity * Number(cost);
      }
    }
    const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
    return { from, to, orders: orderCount, gross: round(gross), returns: round(returns), netSales: round(gross - returns), knownCost: round(knownCost),
      cmv: missingCostLines ? null : round(knownCost), profit: missingCostLines ? null : round(gross - returns - knownCost),
      missingCostLines, missingCosts, invalidDates,
      costRecordingFrom: dateKey(filters.costHistory?.startedAt) ? filters.costHistory.startedAt : null,
      products: [...products.values()].map(row => ({ ...row, gross: round(row.gross) })).sort((a,b) => a.product.localeCompare(b.product, "es")),
      sellers: [...sellers.values()].map(row => ({ ...row, gross: round(row.gross) })).sort((a,b) => a.seller.localeCompare(b.seller, "es")) };
  }

  return { build, buildStatistics, currentWeek };
});
