(function initShareEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DLShareEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function shareEngineFactory() {
  "use strict";

  function numeric(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function lineText(value, fallback = "") {
    const text = String(value == null ? "" : value)
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text || fallback;
  }

  function formatNumber(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits }).format(numeric(value, 0));
  }

  function formatMoney(value) {
    return `$${formatNumber(Math.round(numeric(value, 0) * 100) / 100, 2)}`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    return safeDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function argentinaWhatsAppPhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("549")) return digits;
    if (digits.startsWith("54")) {
      let national = digits.slice(2).replace(/^0+/, "");
      if (national.startsWith("9")) return `54${national}`;
      national = national.replace(/^(351|11|261|341|342|343|345|362|364|370|376|379|380|381|383|385|387|388)15(?=\d{6,8}$)/, "$1");
      return national ? `549${national}` : "";
    }
    digits = digits.replace(/^0+/, "");
    digits = digits.replace(/^(351|11|261|341|342|343|345|362|364|370|376|379|380|381|383|385|387|388)15(?=\d{6,8}$)/, "$1");
    return digits ? `549${digits}` : "";
  }

  function orderItems(order) {
    return (Array.isArray(order && order.items) ? order.items : []).map((item) => {
      const qty = Math.max(0, numeric(item.requestedQty ?? item.qty ?? item.cantidad, 0));
      const unitPrice = Math.max(0, numeric(item.unitPrice ?? item.price ?? item.precio, 0));
      const discountPct = Math.min(100, Math.max(0, numeric(item.discountPct ?? item.discount ?? item.descuento, 0)));
      const lineTotal = Math.max(0, numeric(item.lineTotal ?? item.total, qty * unitPrice * (1 - discountPct / 100)));
      return { name: lineText(item.name || item.product || item.descripcion, "Producto"), qty, unitPrice, discountPct, lineTotal };
    }).filter((item) => item.qty > 0);
  }

  function buildOrderSummary(input = {}) {
    const order = input.order || {};
    const client = input.client || {};
    const items = orderItems(order);
    const clientName = lineText(client.name || client.nombre_comercial || order.client, "Cliente");
    const orderCode = lineText(order.code, "S/N");
    const total = Math.max(0, numeric(order.amount, items.reduce((sum, item) => sum + item.lineTotal, 0)));
    const gross = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = Math.max(0, gross - total);
    const commercial = order.commercialApproval && typeof order.commercialApproval === "object" ? order.commercialApproval : null;
    const commercialStatus = lineText(commercial && commercial.status).toLowerCase();
    const publicCommercialNote = commercialStatus === "aprobada"
      ? lineText(commercial.publicObservation || commercial.customerObservation || commercial.customerNote)
      : "";
    const lines = [
      "DISTRIBUIDORA L\u00d3PEZ", "", `Pedido N\u00b0 ${orderCode}`,
      `Fecha: ${formatDate(order.createdAt || order.receivedAt)}`, "", "Cliente:", clientName, "", "DETALLE", ""
    ];
    items.forEach((item) => {
      lines.push(item.name, `${formatNumber(item.qty)} x ${formatMoney(item.unitPrice)} = ${formatMoney(item.lineTotal)}`, "");
    });
    lines.push("-----------------");
    if (discount > 0.009) lines.push(`Descuento: -${formatMoney(discount)}`);
    lines.push(`TOTAL: ${formatMoney(total)}`);
    const paymentMethod = lineText(order.paymentMethod || order.forma_pago);
    if (paymentMethod) lines.push(`Forma de pago: ${paymentMethod}`);
    if (publicCommercialNote) lines.push(`Observacion comercial: ${publicCommercialNote}`);
    if (commercial && commercialStatus === "pendiente") lines.push("Importe sujeto a autorizacion comercial.");
    return {
      orderCode,
      clientName,
      phone: argentinaWhatsAppPhone(client.telefono || client.phone || client.celular),
      total,
      text: lines.join("\n").trim()
    };
  }

  function whatsappUrl(summary) {
    if (!summary || !summary.phone || !summary.text) return "";
    return `https://wa.me/${summary.phone}?text=${encodeURIComponent(summary.text)}`;
  }

  return { argentinaWhatsAppPhone, buildOrderSummary, formatMoney, whatsappUrl };
});
