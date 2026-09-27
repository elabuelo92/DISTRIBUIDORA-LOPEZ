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

  return { build };
});
