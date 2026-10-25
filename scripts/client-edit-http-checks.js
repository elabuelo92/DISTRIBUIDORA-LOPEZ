"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const edit = require("../client-edit");
module.exports = async function ({ request, read, admin, login, password, file, failureFile, base, folder }) {
  const checks = [];
  let sequence = 0;
  const get = id => read().clients.find(c => c.codigo_cliente === id);
  const body = (id, patch) => ({ patch, expected: Object.fromEntries(Object.keys(patch).map(key => [key, edit.snapshot(get(id))[key]])),
    motivo: "Prueba de integridad P143", operationId: `P143-CHECK-${++sequence}`, admin_password: password });
  const post = (id, input, expected = 200, cookie = admin) => request(`/api/clients/${id}/edit`, input, cookie, expected);
  const baseline = read();
  const untouched = ["products", "orders", "accounts", "supplierAccounts", "stockMovements", "deliveryRoutes"];
  for (const patch of [{ email: "test@example.com" }, { email: "" }, { telefono: "351223344" }, { domicilio: "Direccion nueva 25" },
    { zona: "Sur", ruta: "Ruta B" }, { vendedor_asignado: "Otro vendedor" }, { observaciones: "Nota nueva" }, { limite_credito: 53000.75 }]) {
    const previous = get("C0");
    const expectedResult = edit.apply(previous, patch, edit.snapshot(previous), require("../client-hours"));
    const result = (await post("C0", body("C0", patch))).data;
    const stored = get("C0");
    assert.deepEqual(result.changedFields, expectedResult.changedFields);
    for (const key of Object.keys(previous)) if (![...result.changedFields, "updatedAt", "editHistory"].includes(key)) assert.deepEqual(stored[key], previous[key], `preserve ${key}`);
    assert.deepEqual(stored.editHistory.at(-1).changedFields, result.changedFields);
  }
  checks.push("empty/valid email, phone/address/zone/route/seller/notes/credit edits preserve every unedited field and GPS");
  await post("C1", body("C1", { telefono: "351111222" }));
  assert.equal(get("C1").email, "Admin2");
  const beforeInvalid = fs.readFileSync(file, "utf8");
  for (const patch of [{ email: "Admin2" }, { email: "bad@" }, { balance: 0 }, { id: "REPLACED" }, { codigo_cliente: "REPLACED" }, { limite_credito: -1 }]) {
    await post("C0", body("C0", patch), 400);
    assert.equal(fs.readFileSync(file, "utf8"), beforeInvalid);
  }
  checks.push("legacy invalid email is retained, new invalid email and protected fields rejected without writes");
  const duplicate = body("C0", { telefono: "351222999" });
  await post("C0", duplicate);
  const saved = fs.readFileSync(file, "utf8");
  assert.equal((await post("C0", duplicate)).data.duplicate, true);
  assert.equal(fs.readFileSync(file, "utf8"), saved);
  await post("C0", { ...duplicate, patch: { telefono: "wrong" } }, 409);
  checks.push("retry after lost response is idempotent; changed operation reuse rejected");
  const first = body("C0", { telefono: "351777888" });
  const stale = body("C0", { telefono: "351666555" });
  const independent = body("C0", { domicilio: "Calle concurrente 99" });
  const otherAdmin = await login("admin2");
  await post("C0", first);
  await post("C0", stale, 409, otherAdmin);
  await post("C0", independent, 200, otherAdmin);
  assert.equal(get("C0").telefono, first.patch.telefono);
  assert.equal(get("C0").domicilio, independent.patch.domicilio);
  checks.push("two administrators: conflicting edit rejected, independent changes preserved");
  const seller = await login("seller-test");
  await post("C0", body("C0", { telefono: "unauthorized" }), 403, seller);
  const wrongPassword = body("C0", { telefono: "unauthorized" });
  const beforeAuth = JSON.stringify(get("C0"));
  await post("C0", { ...wrongPassword, admin_password: "wrong" }, 401);
  assert.equal(JSON.stringify(get("C0")), beforeAuth);
  checks.push("administrator password and role still required");
  const retry = body("C0", { telefono: "351123123" });
  const diskBefore = fs.readFileSync(file, "utf8");
  for (const stage of ["fsync", "rename"]) {
    fs.writeFileSync(failureFile, stage);
    await post("C0", retry, 503);
    fs.unlinkSync(failureFile);
    assert.equal(fs.readFileSync(file, "utf8"), diskBefore);
    const page = (await request("/api/clients?search=C0", null, admin)).data;
    assert.equal(page.records.find(c => c.codigo_cliente === "C0").telefono, get("C0").telefono, "uncommitted edit must not leak from memory");
  }
  await post("C0", retry);
  assert.equal(get("C0").editHistory.filter(e => e.operationId === retry.operationId).length, 1);
  checks.push("fsync/rename failure leaves disk and cached customer unchanged; retry persists exactly once");
  for (const key of untouched) assert.deepEqual(read()[key], baseline[key], `integrity ${key}`);
  const finalClients = new Map(read().clients.map(client => [client.codigo_cliente, client]));
  for (const client of baseline.clients.slice(2)) assert.deepEqual(finalClients.get(client.codigo_cliente), client);
  checks.push("orders, stock, reservations, movements, balances and 2498 other clients unchanged");
  checks.push(...await require("./client-edit-browser-check")({ base, password, request, read, admin, folder }));
  return checks;
};
