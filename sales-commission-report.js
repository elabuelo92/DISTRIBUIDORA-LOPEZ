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
        const row = products.get(code || name) || { code, product: name, units: 0, gross: 0, billed: 0, returns: 0,
          knownCost: 0, missingCostLines: 0, missingCostUnits: 0 };
        row.units += quantity;
        row.gross += value;
        row.billed += lineTotal;
        row.returns += returnedValue;
        products.set(code || name, row);
        const cost = item.unitCostAtSale ?? item.costSnapshot?.unitCost;
        if (quantity > 0 && (cost === undefined || cost === null || String(cost).trim() === "" || typeof cost === "boolean" || !Number.isFinite(Number(cost)) || Number(cost) < 0)) {
          missingCostLines++;
          row.missingCostLines++;
          row.missingCostUnits += quantity;
          missingCosts.push({ orderCode: key, date, code, product: name, quantity });
        } else if (quantity > 0) {
          knownCost += quantity * Number(cost);
          row.knownCost += quantity * Number(cost);
        }
      }
    }
    const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
    return { from, to, orders: orderCount, gross: round(gross), returns: round(returns), netSales: round(gross - returns), knownCost: round(knownCost),
      cmv: missingCostLines ? null : round(knownCost), profit: missingCostLines ? null : round(gross - returns - knownCost),
      missingCostLines, missingCosts, invalidDates,
      unallocatedSales: round(gross - [...products.values()].reduce((sum, row) => sum + row.billed, 0)),
      costRecordingFrom: dateKey(filters.costHistory?.startedAt) ? filters.costHistory.startedAt : null,
      products: [...products.values()].map(row => ({ ...row, billed: round(row.billed), returns: round(row.returns),
        gross: round(row.gross), knownCost: round(row.knownCost), cost: row.missingCostLines ? null : round(row.knownCost),
        profit: row.missingCostLines ? null : round(row.gross - row.knownCost) })).sort((a,b) => a.product.localeCompare(b.product, "es")),
      sellers: [...sellers.values()].map(row => ({ ...row, gross: round(row.gross) })).sort((a,b) => a.seller.localeCompare(b.seller, "es")) };
  }

  function buildDriver(orders, filters = {}) {
    const from = filters.from || "", to = filters.to || "", driver = filters.driver || "";
    const selectedDrivers = Array.isArray(filters.drivers) ? filters.drivers.filter(Boolean) : (driver ? [driver] : []);
    if ((from && !dateKey(from)) || (to && !dateKey(to)) || (from && to && from > to)) {
      throw new Error("Indicar un periodo valido: desde no puede superar hasta.");
    }
    const seen = new Set(), drivers = new Map(), details = [], issues = [];
    const number = value => value !== null && value !== undefined && typeof value !== "boolean"
      && String(value).trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
    for (const order of orders || []) {
      const key = String(order.code || order.id || "");
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      const block = order.commissions?.driver;
      if (!block?.user || (selectedDrivers.length && !selectedDrivers.includes(block.user))) continue;
      const date = dateKey(order.commissions.calculatedAt);
      if (!date) { issues.push({ orderCode: key, reason: "Sin fecha de calculo registrada" }); continue; }
      if ((from && date < from) || (to && date > to)) continue;
      const total = number(block.total), base = number(block.baseAmount);
      if (total === null || base === null) { issues.push({ orderCode: key, reason: "Importe registrado invalido" }); continue; }
      const row = { driver: block.user, date, orderCode: key, client: String(order.client || ""),
        status: String(order.status || ""), base, cigarettes: number(block.cigarettes), merchandise: number(block.merchandise), total };
      details.push(row);
      const group = drivers.get(row.driver) || { driver: row.driver, orders: 0, base: 0, total: 0 };
      group.orders++; group.base += base; group.total += total; drivers.set(row.driver, group);
    }
    const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
    return { from, to, driver: selectedDrivers.join(", "), issues, details: details.sort((a,b) => a.date.localeCompare(b.date) || a.orderCode.localeCompare(b.orderCode)),
      drivers: [...drivers.values()].map(row => ({ ...row, base: round(row.base), total: round(row.total) })).sort((a,b) => a.driver.localeCompare(b.driver, "es")),
      total: round(details.reduce((sum, row) => sum + row.total, 0)) };
  }

  return { build, buildStatistics, buildDriver, currentWeek };
});
