"use strict";

// Read-only authenticated production verification. No test orders or legal acceptance.
const assert = require("node:assert/strict");
const portfolio = require("../client-portfolio-engine");
const base = process.env.DL_VERIFY_BASE_URL;
const password = process.env.DL_VERIFY_ADMIN_PASSWORD || process.env.DL_DEFAULT_PASSWORD;
const username = process.env.DL_VERIFY_ADMIN_USER || "admin1";
assert.ok(base && password, "Missing verification URL or password");
(async () => {
  const response = await fetch(`${base}/api/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, device: { id: "VERIFY-CATALOG-149", label: "Verificacion cartera", appVersion: "8790-149" } })
  });
  assert.equal(response.status, 200, `Login returned ${response.status}`);
  const cookie = String(response.headers.get("set-cookie") || "").split(";")[0];
  try {
    let result;
    for (let attempt = 0; attempt < 4; attempt++) {
      result = await fetch(`${base}/api/state?version=0`, { headers: { Cookie: cookie } });
      if (result.status !== 503) break;
      await new Promise((resolve) => setTimeout(resolve, 5500));
    }
    assert.equal(result.status, 200);
    const payload = await result.json();
    const clients = payload.state.clients;
    assert.ok(clients.length > 0);
    const active = clients.filter(portfolio.isActiveClient);
    const outside = portfolio.filterClients(clients, { scope: "outside", sellerIdentities: [username], workday: "Viernes" });
    assert.equal(outside.length, active.length);
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.ok, true);
    assert.equal(health.security.integrity.ok, true);
    assert.equal(health.security.license.ok, true);
    console.log(JSON.stringify({ ok: true, version: health.version, authenticatedRole: (await response.json()).user?.role,
      clients: clients.length, activeClients: active.length, outsideVisible: outside.length,
      payloadBytes: Buffer.byteLength(JSON.stringify(payload)), orders: payload.state.orders.length,
      integrity: true, license: true }));
  } finally {
    await fetch(`${base}/api/logout`, { method: "POST", headers: { Cookie: cookie } });
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
