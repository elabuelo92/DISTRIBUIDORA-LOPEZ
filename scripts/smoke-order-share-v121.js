"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ShareEngine = require("../share-engine.js");

const root = path.join(__dirname, "..");
const summary = ShareEngine.buildOrderSummary({
  client: { name: "Kiosco Centro", telefono: "0351 15 222 3344", saldo: 999999 },
  order: {
    code: "PED-2301",
    client: "Kiosco Centro",
    createdAt: "2026-08-30T22:00:00-03:00",
    paymentMethod: "Transferencia",
    amount: 7000,
    observations: "NOTA_INTERNA_DEPOSITO",
    internalNote: "MARGEN_SECRETO",
    commission: 880,
    stock: 12,
    items: [
      { name: "Producto A", requestedQty: 2, unitPrice: 1500, lineTotal: 3000, cost: 400, margin: 70, stock: 10 },
      { name: "Producto B", requestedQty: 5, unitPrice: 800, lineTotal: 4000, cost: 100, commission: 45 }
    ],
    commercialApproval: {
      status: "Aprobada",
      publicObservation: "Promocion autorizada para el cliente",
      resolutionNote: "NO_COMPARTIR_NOTA_ADMIN"
    }
  }
});

assert.equal(summary.phone, "5493512223344");
assert.equal(summary.total, 7000);
assert.match(summary.text, /DISTRIBUIDORA L\u00d3PEZ/);
assert.match(summary.text, /Pedido N\u00b0 PED-2301/);
assert.match(summary.text, /Producto A\n2 x \$1\.500 = \$3\.000/);
assert.match(summary.text, /TOTAL: \$7\.000/);
assert.match(summary.text, /Forma de pago: Transferencia/);
assert.match(summary.text, /Promocion autorizada para el cliente/);
["NOTA_INTERNA_DEPOSITO", "MARGEN_SECRETO", "NO_COMPARTIR_NOTA_ADMIN", "999999", "880"].forEach((secret) => {
  assert.equal(summary.text.includes(secret), false, `Se filtro informacion interna: ${secret}`);
});
assert.match(ShareEngine.whatsappUrl(summary), /^https:\/\/wa\.me\/5493512223344\?text=/);
assert.equal(ShareEngine.argentinaWhatsAppPhone("+54 9 351 222 3344"), "5493512223344");
assert.equal(ShareEngine.argentinaWhatsAppPhone("3512223344"), "5493512223344");

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(indexSource, /id="shareMobileOrderWhatsAppBtn"/);
assert.match(indexSource, /share-engine\.js\?v=8790-123-r20260901a/);
assert.match(appSource, /const order = payload\.order;[\s\S]{0,900}mobileLastConfirmedOrderShare =/);
assert.match(appSource, /shareConfirmedMobileOrderWhatsApp/);
assert.match(appSource, /navigator\.share/);

async function verifyConfirmedOrder() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v121-share-"));
  const stateFile = path.join(tempDir, "demo-state.json");
  const usersFile = path.join(tempDir, "users.json");
  const port = Number(process.env.DL_TEST_PORT || (21300 + Math.floor(Math.random() * 150)));
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync("Share-121", salt, 120000, 32, "sha256").toString("hex");
  fs.writeFileSync(usersFile, JSON.stringify({ users: [{ username: "sofia", name: "Sofia Benitez", sellerName: "Sofia Benitez", role: "seller", active: true, salt, passwordHash }] }));
  fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state: {
    products: [{ codigo_producto: "P-A", name: "Producto A", price: 1500, precio_lista_2: 1500, stock: 50, stock_fisico: 50, stock_actual: 50 }],
    clients: [{ codigo_cliente: "C-WA", name: "Kiosco Centro", nombre_comercial: "Kiosco Centro", telefono: "3512223344", vendedor_asignado: "Sofia Benitez", seller: "Sofia Benitez", status: "Activo", limite_credito: 100000 }],
    sellers: [{ name: "Sofia Benitez", username: "sofia" }],
    orders: [], accounts: [], activity: [], notifications: [], globalAudit: [], priceLists: []
  } }));
  const child = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-121", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        const health = await fetch(`${base}/api/health`);
        if (health.ok) break;
      } catch {}
      if (attempt === 99) throw new Error(`Servidor v121 no inicio. ${output}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const loginInput = { username: "sofia", password: "Share-121", device: { id: "SMOKE-SHARE-121" } };
    let login = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginInput) });
    if (login.status === 428) {
      const legal = await login.json();
      loginInput.legalAcceptance = { accepted: true, version: legal.legal.currentVersion, hash: legal.legal.hash };
      login = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginInput) });
    }
    assert.equal(login.status, 200);
    const cookie = String(login.headers.get("set-cookie") || "").split(";")[0];
    const response = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ operationId: "ORDER-SHARE-121", client: "Kiosco Centro", seller: "Sofia Benitez", source: "mobile", origin: "preventa", paymentMethod: "Contado", observations: "INTERNO_NO_COMPARTIR", items: [{ productCode: "P-A", name: "Producto A", qty: 2 }] })
    });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.error || "Pedido v121");
    assert.equal(payload.compact, true);
    const confirmedSummary = ShareEngine.buildOrderSummary({ order: payload.order, client: { name: "Kiosco Centro", telefono: "3512223344" } });
    assert.match(confirmedSummary.text, new RegExp(`Pedido N\\u00b0 ${payload.order.code}`));
    assert.match(confirmedSummary.text, /Producto A\n2 x \$1\.500 = \$3\.000/);
    assert.equal(confirmedSummary.text.includes("INTERNO_NO_COMPARTIR"), false);
    const contactResponse = await fetch(`${base}/api/preventa/whatsapp-contact`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ client: "Kiosco Centro", seller: "Sofia Benitez", phone: confirmedSummary.phone, orderCode: payload.order.code })
    });
    const contactPayload = await contactResponse.json();
    assert.equal(contactResponse.status, 200);
    assert.equal(contactPayload.compact, true);
    assert.equal(contactPayload.contact.orderCode, payload.order.code);
    if (process.env.DL_V121_UI_KEEP === "1") {
      console.log(`UI_FIXTURE_READY ${base}/ usuario=sofia clave=Share-121`);
      await new Promise(() => {});
    }
    return payload.order.code;
  } finally {
    child.kill("SIGTERM");
  }
}

(async () => {
  const confirmedOrder = await verifyConfirmedOrder();
  console.log(JSON.stringify({
    ok: true,
    version: "8790-121",
    targetPhone: summary.phone,
    total: summary.total,
    confirmedOrder,
    privateFieldsExcluded: true,
    standardShareFallback: true,
    onlyAfterServerConfirmation: true
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
