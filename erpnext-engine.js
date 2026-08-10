const http = require("http");
const https = require("https");

function cleanBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readConfig(env = process.env) {
  const url = cleanBaseUrl(env.ERPNEXT_URL || "");
  const apiKey = String(env.ERPNEXT_API_KEY || "").trim();
  const apiSecret = String(env.ERPNEXT_API_SECRET || "").trim();
  return {
    enabled: String(env.ERPNEXT_ENABLED || "false").toLowerCase() === "true",
    url,
    apiKey,
    apiSecret,
    company: String(env.ERPNEXT_COMPANY || "Distribuidora Lopez").trim(),
    defaultWarehouse: String(env.ERPNEXT_DEFAULT_WAREHOUSE || "").trim(),
    priceList: String(env.ERPNEXT_PRICE_LIST || "Standard Selling").trim(),
    customerGroup: String(env.ERPNEXT_CUSTOMER_GROUP || "Comercial").trim(),
    territory: String(env.ERPNEXT_TERRITORY || "Cordoba").trim()
  };
}

function missingConfig(config) {
  const missing = [];
  if (!config.url) missing.push("ERPNEXT_URL");
  if (!config.apiKey) missing.push("ERPNEXT_API_KEY");
  if (!config.apiSecret) missing.push("ERPNEXT_API_SECRET");
  return missing;
}

function isConfigured(config = readConfig()) {
  return config.enabled && missingConfig(config).length === 0;
}

function request(config, method, path, body) {
  return new Promise((resolve, reject) => {
    if (!isConfigured(config)) {
      reject(new Error(`ERPNext no configurado: ${missingConfig(config).join(", ") || "ERPNEXT_ENABLED=false"}`));
      return;
    }
    const base = new URL(config.url);
    const target = new URL(path, `${base.origin}/`);
    const payload = body === undefined ? "" : JSON.stringify(body);
    const transport = target.protocol === "https:" ? https : http;
    const req = transport.request({
      method,
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      headers: {
        Authorization: `token ${config.apiKey}:${config.apiSecret}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      },
      timeout: 15000
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = data;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: parsed });
        } else {
          const message = parsed && (parsed.exception || parsed.exc || parsed.message)
            ? JSON.stringify(parsed)
            : `ERPNext respondio HTTP ${res.statusCode}`;
          reject(new Error(message));
        }
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("Timeout conectando con ERPNext."));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function resourcePath(doctype, name) {
  const base = `/api/resource/${encodeURIComponent(doctype)}`;
  return name ? `${base}/${encodeURIComponent(name)}` : base;
}

async function health(config = readConfig()) {
  if (!isConfigured(config)) {
    return { ok: true, enabled: config.enabled, configured: false, missing: missingConfig(config) };
  }
  const response = await request(config, "GET", "/api/method/frappe.auth.get_logged_user");
  return {
    ok: true,
    enabled: true,
    configured: true,
    url: config.url,
    user: response.data && (response.data.message || response.data.data || "")
  };
}

function firstNonEmpty(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function customerPayload(client, config = readConfig()) {
  const customerName = firstNonEmpty(client.name, client.nombre_comercial, client.razon_social, client.codigo_cliente);
  return {
    doctype: "Customer",
    customer_name: customerName,
    customer_type: "Company",
    customer_group: config.customerGroup,
    territory: firstNonEmpty(client.zona, client.zone, client.ruta, config.territory),
    tax_id: firstNonEmpty(client.cuit, client.cuit_dni, client.documento),
    mobile_no: firstNonEmpty(client.telefono, client.phone),
    email_id: firstNonEmpty(client.email),
    dl_external_id: firstNonEmpty(client.codigo_cliente, client.id, customerName),
    dl_source: "DL Preventa"
  };
}

function itemPayload(product, config = readConfig()) {
  const itemCode = firstNonEmpty(product.codigo_producto, product.code, product.sku, product.name);
  const itemName = firstNonEmpty(product.name, product.descripcion, itemCode);
  return {
    doctype: "Item",
    item_code: itemCode,
    item_name: itemName,
    item_group: firstNonEmpty(product.rubro, product.familia, "Productos"),
    stock_uom: firstNonEmpty(product.uom, product.unidad, "Nos"),
    is_stock_item: 1,
    standard_rate: Number(product.price || product.precio_lista_2 || product.precio_lista_1 || 0),
    default_warehouse: config.defaultWarehouse || undefined,
    dl_external_id: itemCode,
    dl_source: "DL Preventa"
  };
}

function salesOrderPayload(order, state, config = readConfig()) {
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    doctype: "Sales Order",
    customer: order.client,
    company: config.company,
    selling_price_list: config.priceList,
    transaction_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
    delivery_date: new Date(order.updatedAt || Date.now()).toISOString().slice(0, 10),
    po_no: order.code,
    dl_external_id: order.code,
    dl_order_code: order.code,
    dl_source: order.source || "DL Preventa",
    dl_seller: order.seller || "",
    dl_delivery_status: order.status || "",
    items: items.map((item) => ({
      item_code: firstNonEmpty(item.productCode, item.codigo_producto, item.name),
      item_name: item.name,
      qty: Number(item.requestedQty || item.qty || 1),
      rate: Number(item.unitPrice || item.price || 0),
      warehouse: config.defaultWarehouse || undefined
    }))
  };
}

async function createResource(config, doctype, payload) {
  return request(config, "POST", resourcePath(doctype), payload);
}

module.exports = {
  readConfig,
  missingConfig,
  isConfigured,
  request,
  health,
  customerPayload,
  itemPayload,
  salesOrderPayload,
  createResource
};
