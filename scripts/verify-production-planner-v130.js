"use strict";

const assert = require("node:assert/strict");
const DeliveryEngine = require("../delivery-engine");

const baseUrl = String(process.env.DL_VERIFY_BASE_URL || "").replace(/\/$/, "");
const username = String(process.env.DL_VERIFY_ADMIN_USER || "").trim();
const password = String(process.env.DL_VERIFY_ADMIN_PASSWORD || "");

if (!baseUrl || !username || !password) {
  throw new Error("Definir DL_VERIFY_BASE_URL, DL_VERIFY_ADMIN_USER y DL_VERIFY_ADMIN_PASSWORD.");
}

async function login() {
  const input = {
    username,
    password,
    device: { id: "VERIFY-PLANNER-V130", label: "Verificacion Planificacion v130", model: "Node", os: process.platform, appVersion: "8790-130" }
  };
  let response = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
  }
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || "No se pudo iniciar sesion.");
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

function openRouteForOrder(routes, code) {
  return routes.find((route) => String(route.status || "") !== "Completada"
    && (route.stops || []).some((stop) => stop.orderCode === code)) || null;
}

(async () => {
  const cookie = await login();
  try {
    const response = await fetch(`${baseUrl}/api/state?version=0`, { headers: { Cookie: cookie }, cache: "no-store" });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.error || "No se pudo leer el estado.");
    const state = payload.state || {};
    const routes = state.deliveryRoutes || [];
    const eligible = (state.orders || []).filter(DeliveryEngine.isEligibleForRoutePlanning);
    const assigned = eligible.filter((order) => openRouteForOrder(routes, order.code));
    const unassigned = eligible.filter((order) => !openRouteForOrder(routes, order.code));
    assert.ok(eligible.length > 0, "Produccion no devolvio pedidos elegibles.");
    console.log(JSON.stringify({
      ok: true,
      version: payload.version,
      ordersReceived: (state.orders || []).length,
      eligible: eligible.length,
      assigned: assigned.length,
      unassigned: unassigned.length,
      unassignedCodes: unassigned.map((order) => order.code),
      statuses: Array.from(new Set(eligible.map((order) => order.status))).sort()
    }, null, 2));
  } finally {
    await fetch(`${baseUrl}/api/logout`, { method: "POST", headers: { Cookie: cookie } }).catch(() => {});
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
