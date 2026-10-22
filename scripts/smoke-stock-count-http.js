"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const root = path.resolve(__dirname, "..");
const multi = process.argv.includes("--multi");
const mixed = process.argv.includes("--mixed");
const soak = process.argv.includes("--soak");
const traffic = process.argv.includes("--traffic");
const profile = process.argv.includes("--profile");
const durability = process.argv.includes("--durability");
const reportArg = process.argv.indexOf("--output");
const reportFile = reportArg >= 0 ? path.resolve(process.argv[reportArg + 1]) : null;
let serverPerformance;
assert.ok(!traffic || (multi && mixed), "--traffic requires --multi --mixed");
const soakRounds = [];
const trafficRounds = [];
let syncBusyRetries = 0;
const snapshotIndex = process.argv.indexOf("--snapshot");
const snapshotFile = snapshotIndex >= 0 ? path.resolve(process.argv[snapshotIndex + 1]) : null;
const snapshotHash = snapshotFile ? crypto.createHash("sha256").update(fs.readFileSync(snapshotFile)).digest("hex") : null;
const timing = [];
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "dl-count-http-"));
const file = path.join(folder, "demo-state.json");
const password = "LocalCountTest-Only!";
const users = (multi ? ["admin1", "admin-test2", "admin-test3", "seller-test", "seller-test2", "driver-test1", "driver-test2"] : ["admin1", "seller-test"]).map(username => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name: username, role: username.startsWith("admin") ? "admin" : username.startsWith("driver") ? "driver" : "seller", active: true,
    salt, passwordHash: crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex") };
});
fs.writeFileSync(path.join(folder, "users.json"), JSON.stringify({ users }));
const fixture = {
  products: [{ codigo_producto: "A", name: "Test A", stock_fisico: 100, stock_reservado: 10 },
    { codigo_producto: "B", name: "Test B", stock_fisico: 50, stock_reservado: 5 }],
  orders: [{ code: "PED-TEST-1", client: "Test", status: "En Armado", inventoryMode: "reservation",
    items: [{ productCode: "A", name: "Test A", requestedQty: 10, reservedQty: 10, missingQty: 0, unitPrice: 20 }] }],
  clients: [], accounts: [], supplierAccounts: [{ balance: 456.78 }],
  physicalStockCounts: [], physicalStockAdjustments: [], stockMovements: [], activity: []
};
if (snapshotFile) {
  const copy = JSON.parse(fs.readFileSync(snapshotFile, "utf8")).state;
  fixture.products = [...fixture.products, ...(copy.products || []).filter(p => !["A", "B"].includes(p.codigo_producto))];
  fixture.orders = [...fixture.orders, ...(copy.orders || [])];
  for (const [key, value] of Object.entries(copy)) {
    if (!["products", "orders", "legalAcceptances"].includes(key)) fixture[key] = value;
  }
}
let driverFixture, driverInput;
if (mixed) {
  const test = require("./smoke-driver-multiple-proofs");
  driverFixture = test.fixture(); driverInput = test.input;
  driverFixture.state.clients[0].name = "Isolated Collection Client";
  driverFixture.state.clients[0].codigo_cliente = "LOCAL-COLLECTION";
  driverFixture.state.orders[0].client = "Isolated Collection Client";
  driverFixture.route.driverUser = "driver-test1";
  for (const key of ["clients", "orders", "deliveryRoutes"]) fixture[key] = [...(fixture[key] || []), ...driverFixture.state[key]];
  fixture.clients.push({ codigo_cliente: "LOCAL-SALE", name: "Isolated Sale Client", status: "Activo", balance: 0, saldo_inicial: 0, latitud: -31.4, longitud: -64.2 });
  Object.assign(fixture.products.find(p => p.codigo_producto === "B"), { precio_lista_1: 20, precio_lista_2: 20, precio: 20 });
}
if (traffic) {
  const Delivery = require("../delivery-engine");
  const Order = require("../order-engine");
  for (let driverIndex = 0; driverIndex < 2; driverIndex++) {
    const codes = [];
    for (let round = 0; round < 10; round++) {
      const code = `PED-TRAFFIC-${driverIndex}-${round}`;
      const client = `Isolated Traffic Client ${driverIndex}-${round}`;
      codes.push(code);
      fixture.clients.push({ codigo_cliente: `LOCAL-TRAFFIC-${driverIndex}-${round}`, name: client,
        balance: 0, status: "Activo", latitud: -31.4, longitud: -64.2 });
      fixture.orders.push({ code, client, amount: 1000, status: Order.STATUS.READY_DISPATCH, inventoryMode: "direct",
        items: [{ productCode: "P1", name: "Producto", requestedQty: 1, unitPrice: 1000, lineTotal: 1000 }],
        assembly: { orderNumber: round + 1, bultosConfirmed: 1, label: { generated: true, scannerOptional: true } }, trace: [] });
    }
    const actor = { ...driverFixture.driver, username: `driver-test${driverIndex + 1}`, user: `driver-test${driverIndex + 1}` };
    const route = Delivery.createPlannedRoute(fixture, { orderCodes: codes, day: "2026-10-21",
      zone: `Isolated Traffic ${driverIndex}`, driverUser: actor.username, driverLabel: actor.user }, actor);
    Delivery.publishRoute(fixture, route.id, actor);
    Delivery.claimRoute(fixture, route.id, actor);
  }
}
fs.writeFileSync(file, JSON.stringify({ version: 1, state: fixture }));
const memoryFile = path.join(folder, "memory.jsonl");
const writeFailureFile = path.join(folder, "write-failure.txt");
const port = 23000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["--max-old-space-size=512", "--require", "./scripts/local-memory-probe.js", ...(profile ? ["--require", "./scripts/local-cpu-probe.js"] : []), ...(durability ? ["--require", "./scripts/local-write-failure-probe.js"] : []), "server.js"], {
  cwd: root, env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), DATA_DIR: folder,
    STATE_FILE: file, LOCAL_TEST_WRITE_FAILURE: durability ? writeFailureFile : "", LOCAL_TEST_MEMORY_FILE: memoryFile, LOCAL_TEST_CPU_FILE: profile ? path.join(root, "docs/CPU-183-baseline.json") : "", USERS_FILE: path.join(folder, "users.json"), DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn", DL_MAX_FULL_STATE_RESPONSES: "2" }, stdio: ["ignore", "pipe", "pipe"]
});
let logs = "";
child.stdout.on("data", data => { logs += data; }); child.stderr.on("data", data => { logs += data; });
const exited = once(child, "exit");
const read = () => JSON.parse(fs.readFileSync(file)).state;
async function request(url, body, cookie, expected = 200) {
  const started = performance.now();
  const response = await fetch(`${base}${url}`, { method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  const raw = await response.text();
  let result;
  try { result = JSON.parse(raw); } catch { throw new Error(`${url}: HTTP ${response.status}: ${raw.slice(0, 400)}`); }
  timing.push({ operation: body?.action || url.split("&sections=")[0], ms: Math.round(performance.now() - started), status: response.status, bytes: Buffer.byteLength(raw) });
  assert.ok((Array.isArray(expected) ? expected : [expected]).includes(response.status), `${response.status}: ${JSON.stringify(result).slice(0, 250)}`);
  return { result, status: response.status, syncBusy: response.headers.get("X-State-Sync-Busy"),
    retryAfter: Number(response.headers.get("Retry-After")), cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}
async function trafficSync(cookie) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const reply = await request("/api/state?syncFormat=sections-v1", null, cookie, [200, 503]);
    if (reply.status === 200) return reply;
    assert.equal(reply.syncBusy, "1");
    assert.equal(reply.result.code, "STATE_SYNC_BUSY");
    syncBusyRetries++;
    console.log(`SYNC BUSY: bounded automatic retry ${attempt + 1}`);
    await new Promise(resolve => setTimeout(resolve, Math.min(60000, Math.max(1000, (reply.retryAfter || 5) * 1000)) + 500));
  }
  throw new Error("State sync did not recover after four busy responses");
}
async function login(username) {
  const input = { username, password, device: { id: `TEST-${username}`, label: "Isolated test" } };
  const legal = (await request("/api/legal")).result.legal;
  input.legalAcceptance = { accepted: true, version: legal.currentVersion, hash: legal.hash };
  return (await request("/api/login", input)).cookie;
}
async function main() {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try { await request("/api/health"); ready = true; break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs.slice(-2000));
  const admin = await login("admin1");
  const seller = await login("seller-test");
  const admins = [admin], workers = [seller];
  if (multi) {
    for (const username of ["admin-test2", "admin-test3"]) admins.push(await login(username));
    for (const username of ["seller-test2", "driver-test1", "driver-test2"]) workers.push(await login(username));
  }
  const initial = await request("/api/state", null, admin);
  const post = (body, expected = 200, cookie = admin) => request("/api/stock/entry", body, cookie, expected);
  const before = initial.result.state;
  const physical = before.products.find(p => p.codigo_producto === "A").stock_fisico;
  const reserved = before.products.find(p => p.codigo_producto === "A").stock_reservado;
  assert.equal(reserved, 10, "fixture must exercise active reservations");
  const count = { action: "recordCount", countId: "CNT-HTTP-TEST-001", productCode: "A", expectedQty: physical, countedQty: physical - 10 };
  await post(count, 401, ""); await post(count, 403, seller);
  const counts = await Promise.all(Array.from({ length: 6 }, (_, i) => post(count, 200, admins[i % admins.length])));
  assert.equal(counts.filter(p => !p.result.replayed).length, 1);
  for (const p of counts) { assert.equal(p.result.state, undefined); assert.ok(JSON.stringify(p.result).length < 12000); }
  assert.equal(read().physicalStockCounts.filter(c => c.id === count.countId).length, 1);
  assert.equal(read().products.find(p => p.codigo_producto === "A").stock_fisico, physical);
  const adjust = { action: "reconcileCount", productCode: "A", countId: count.countId, reason: "Prueba local", admin_password: password };
  const bytes = fs.readFileSync(file, "utf8");
  await post({ ...adjust, admin_password: "incorrect" }, 400);
  assert.equal(fs.readFileSync(file, "utf8"), bytes);
  const results = await Promise.all([
    ...Array.from({ length: 6 }, (_, i) => post(adjust, 200, admins[i % admins.length])),
    request("/api/state", null, admin), ...workers.map(cookie => request("/api/state", null, cookie))
  ]);
  assert.equal(results.slice(0, 6).filter(p => !p.result.replayed).length, 1);
  const after = read();
  assert.equal(after.stockMovements.filter(m => m.id === `STK-${count.countId}`).length, 1);
  assert.equal(after.physicalStockAdjustments.filter(a => a.countId === count.countId).length, 1);
  assert.equal(after.products.find(p => p.codigo_producto === "A").stock_fisico, physical - 10);
  assert.equal(after.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
  for (const key of ["orders", "accounts", "supplierAccounts"]) assert.deepEqual(after[key], before[key], key);
  const sameCount = { ...count, countId: "CNT-HTTP-TEST-002", expectedQty: physical - 10, countedQty: physical - 10 };
  await post(sameCount); await post({ ...adjust, countId: sameCount.countId });
  assert.equal(read().stockMovements.length, after.stockMovements.length, "zero adjustment adds no movement");
  const low = { ...count, countId: "CNT-HTTP-TEST-003", expectedQty: physical - 10, countedQty: Math.max(0, reserved - 1) };
  if (reserved > 0) {
    await post(low); const unchanged = fs.readFileSync(file, "utf8");
    await post({ ...adjust, countId: low.countId }, 400);
    assert.equal(fs.readFileSync(file, "utf8"), unchanged);
  }
  await post({ ...count, countId: "CNT-HTTP-TEST-004", expectedQty: physical }, 400);
  const health = (await request("/api/health")).result;
  assert.equal(health.activeSessions, users.length);
  console.log("PASS HTTP: simultaneous retries + state reads, one movement, no stock on count, reserves/accounts unchanged, stale/invalid/password/role checks, sessions retained");
  console.log(JSON.stringify({ responseBytes: Buffer.byteLength(JSON.stringify(results[0].result)), heapLimitMiB: 512, sessions: health.activeSessions }));
  if (multi) {
    for (let round = 0; round < 3; round++) {
      const qty = read().products.find(p => p.codigo_producto === "A").stock_fisico;
      const competing = admins.map((_, i) => ({ ...count, countId: `CNT-RACE-${round}-000${i}`, expectedQty: qty, countedQty: qty + i + 1 }));
      await Promise.all(competing.map((input, i) => post(input, 200, admins[i])));
      const replies = await Promise.all(competing.map(async (input, i) => {
        const response = await fetch(`${base}/api/stock/entry`, { method: "POST", headers: { Cookie: admins[i], "Content-Type": "application/json" },
          body: JSON.stringify({ ...adjust, countId: input.countId }), signal: AbortSignal.timeout(60000) });
        const payload = await response.json();
        return { status: response.status, payload };
      }));
      assert.equal(replies.filter(r => r.status === 200).length, 1, "one competing count wins");
      assert.equal(replies.filter(r => r.status === 400 && /stock cambio/.test(r.payload.error)).length, 2);
      await Promise.all(workers.map(cookie => request("/api/state", null, cookie)));
    }
    const final = read();
    for (const key of ["orders", "accounts", "supplierAccounts"]) assert.deepEqual(final[key], before[key], key);
    assert.equal(final.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
    for (const a of final.physicalStockAdjustments.filter(a => /CNT-(HTTP|RACE)/.test(a.countId))) {
      assert.equal(final.physicalStockAdjustments.filter(x => x.countId === a.countId).length, 1);
      assert.equal(final.stockMovements.filter(m => m.id === `STK-${a.countId}`).length, a.newStock === a.previousStock ? 0 : 1);
    }
    assert.equal((await request("/api/health")).result.activeSessions, users.length);
    console.log("PASS three admins, two sellers, two drivers; conflicting counts rejected; protected records unchanged");
    if (mixed) {
      const baseline = read();
      const qty = baseline.products.find(p => p.codigo_producto === "A").stock_fisico;
      const collection = { ...driverInput, deviceId: driverFixture.driver.deviceId, gps: driverFixture.driver.gps };
      const sale = { client: "Isolated Sale Client", source: "mobile", operationId: "LOCAL-SALE-0001", items: [{ productCode: "B", qty: 2, unitPrice: 20 }] };
      if (durability) {
        for (const stage of ["fsync", "rename"]) {
          const original = fs.readFileSync(file);
          fs.writeFileSync(writeFailureFile, stage);
          const failures = await Promise.all([
            request("/api/orders", sale, seller, 503),
            request("/api/delivery/orders/PED-MULTI/collect", collection, workers[2], 503)
          ]);
          assert.ok(failures.every(r => r.result.code === "STATE_WRITE_FAILED"));
          assert.deepEqual(fs.readFileSync(file), original, "failed batch must preserve durable state byte for byte");
          assert.equal(fs.readdirSync(folder).filter(name => name.endsWith(".tmp")).length, 0);
          fs.unlinkSync(writeFailureFile);
          console.log(`PASS HTTP ${stage} failure: no successful acknowledgement, original state intact, temporary files cleaned`);
        }
      }
      await Promise.all([
        post({ ...count, countId: "CNT-MIXED-001", expectedQty: qty, countedQty: qty - 1 }),
        request("/api/orders", sale, seller),
        request("/api/delivery/orders/PED-MULTI/collect", collection, workers[2]),
        ...workers.map(cookie => request("/api/state", null, cookie))
      ]);
      await Promise.all([
        post({ ...adjust, countId: "CNT-MIXED-001" }),
        request("/api/orders", sale, seller),
        request("/api/delivery/orders/PED-MULTI/collect", collection, workers[2])
      ]);
      const done = read();
      assert.equal(done.orders.filter(o => o.client === sale.client).length, 1);
      assert.equal(done.orders.find(o => o.code === "PED-MULTI").collections.length, 1);
      assert.equal(done.clients.find(c => c.name === "Isolated Collection Client").balance, 600);
      assert.equal(done.bankReconciliation.filter(t => t.orderCode === "PED-MULTI").length, 2);
      assert.equal(done.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
      assert.equal(done.products.find(p => p.codigo_producto === "B").stock_reservado, 2);
      for (const order of baseline.orders.filter(o => o.code !== "PED-MULTI")) assert.deepEqual(done.orders.find(o => o.code === order.code), order);
      assert.deepEqual(done.accounts.filter(a => !["Isolated Collection Client", "Isolated Sale Client"].includes(a.account)), baseline.accounts);
      assert.deepEqual(done.supplierAccounts, baseline.supplierAccounts);
      for (const product of baseline.products.filter(p => !["A", "B"].includes(p.codigo_producto))) {
        assert.deepEqual(done.products.find(p => p.codigo_producto === product.codigo_producto), product, `unrelated product ${product.codigo_producto}`);
      }
      assert.equal((await request("/api/health")).result.activeSessions, users.length);
      console.log("PASS mixed stock + sale + collection and retries: expected reservation/debt only, historical records unchanged");
      if (traffic) {
        const baselineTraffic = read();
        const originalOrders = baselineTraffic.orders.filter(o => !o.code.startsWith("PED-TRAFFIC-"));
        const originalAccounts = baselineTraffic.accounts.filter(a => !String(a.account).startsWith("Isolated Traffic Client "));
        for (let round = 0; round < 10; round++) {
          const started = Date.now();
          const current = read();
          const qty = current.products.find(p => p.codigo_producto === "A").stock_fisico;
          const countId = `CNT-TRAFFIC-${round}-001`;
          await post({ ...count, countId, expectedQty: qty, countedQty: qty + (round % 2 ? -1 : 1) }, 200, admins[round % 3]);
          const sales = [0, 1].map(i => ({ ...sale, operationId: `LOCAL-TRAFFIC-SALE-${i}-${round}`, items: [{ productCode: "B", qty: 1, unitPrice: 20 }] }));
          const payments = [0, 1].map(i => ({ ...collection, requestId: `LOCAL-TRAFFIC-COLLECT-${i}-${round}` }));
          const replies = await Promise.all([
            post({ ...adjust, countId }, 200, admins[0]), post({ ...adjust, countId }, 200, admins[1]),
            ...sales.map((input, i) => request("/api/orders", input, workers[i])),
            ...payments.map((input, i) => request(`/api/delivery/orders/PED-TRAFFIC-${i}-${round}/collect`, input, workers[i + 2])),
            ...workers.map(trafficSync)
          ]);
          assert.equal(replies.slice(0, 2).filter(r => !r.result.replayed).length, 1);
          await Promise.all([
            ...sales.map((input, i) => request("/api/orders", input, workers[i])),
            ...payments.map((input, i) => request(`/api/delivery/orders/PED-TRAFFIC-${i}-${round}/collect`, input, workers[i + 2]))
          ]);
          const persisted = read();
          assert.equal(persisted.orders.filter(o => o.client === sale.client).length, 1 + (round + 1) * 2);
          assert.equal(persisted.products.find(p => p.codigo_producto === "B").stock_reservado, 2 + (round + 1) * 2);
          assert.equal(persisted.products.find(p => p.codigo_producto === "B").stock_fisico, baselineTraffic.products.find(p => p.codigo_producto === "B").stock_fisico);
          assert.equal(persisted.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
          assert.equal(persisted.stockMovements.filter(m => m.id === `STK-${countId}`).length, 1);
          assert.equal(persisted.physicalStockAdjustments.filter(a => a.countId === countId).length, 1);
          for (let i = 0; i < 2; i++) {
            const code = `PED-TRAFFIC-${i}-${round}`;
            assert.equal(persisted.orders.find(o => o.code === code).collections.length, 1);
            assert.equal(persisted.bankReconciliation.filter(t => t.orderCode === code).length, 2);
            assert.equal(persisted.clients.find(c => c.name === `Isolated Traffic Client ${i}-${round}`).balance, 600);
          }
          for (const order of originalOrders) assert.deepEqual(persisted.orders.find(o => o.code === order.code), order);
          assert.deepEqual(persisted.accounts.filter(a => !String(a.account).startsWith("Isolated Traffic Client ")), originalAccounts);
          assert.deepEqual(persisted.supplierAccounts, baselineTraffic.supplierAccounts);
          assert.deepEqual(persisted.deliveryClosures, baselineTraffic.deliveryClosures);
          for (const product of baselineTraffic.products.filter(p => !["A", "B"].includes(p.codigo_producto))) {
            assert.deepEqual(persisted.products.find(p => p.codigo_producto === product.codigo_producto), product);
          }
          assert.equal((await request("/api/health")).result.activeSessions, users.length);
          trafficRounds.push({ round, ms: Date.now() - started, sales: 2, collections: 2 });
          console.log(`PASS new traffic round ${round + 1}: two sales, two collections, one stock movement, retries and balances verified`);
        }
      }
      if (soak) {
        const soakBaseline = read();
        const protectedKeys = ["orders", "accounts", "supplierAccounts", "clients", "deliveryRoutes", "deliveryClosures", "bankReconciliation"];
        const hash = value => crypto.createHash("sha256").update(JSON.stringify(value) || "null").digest("hex");
        const protectedHashes = Object.fromEntries(protectedKeys.map(key => [key, hash(soakBaseline[key])]));
        const productsHash = hash(soakBaseline.products.filter(p => p.codigo_producto !== "A"));
        let synced = (await request("/api/state?syncFormat=sections-v1", null, admin)).result;
        let reconstructed = synced.state;
        const started = Date.now();
        let round = 0;
        while (Date.now() - started < 300000) {
          const roundStarted = Date.now();
          const currentQty = reconstructed.products.find(p => p.codigo_producto === "A").stock_fisico;
          const countId = `CNT-SOAK-${String(round).padStart(5, "0")}`;
          await post({ ...count, countId, expectedQty: currentQty, countedQty: currentQty + (round % 2 ? -1 : 1) }, 200, admins[round % 3]);
          const requests = await Promise.all([
            post({ ...adjust, countId }, 200, admins[0]), post({ ...adjust, countId }, 200, admins[1]),
            request("/api/orders", sale, seller),
            request("/api/delivery/orders/PED-MULTI/collect", collection, workers[2]),
            ...workers.map(cookie => request("/api/state?syncFormat=sections-v1", null, cookie))
          ]);
          assert.equal(requests.slice(0, 2).filter(r => !r.result.replayed).length, 1);
          const delta = (await request(`/api/state?syncFormat=sections-v1&version=${synced.version}&sections=${encodeURIComponent(JSON.stringify(synced.sections))}`, null, admin)).result;
          assert.equal(delta.partial, true);
          assert.equal(delta.baseVersion, synced.version);
          reconstructed = { ...reconstructed, ...delta.state };
          for (const key of delta.removed || []) delete reconstructed[key];
          synced = delta;
          const persisted = read();
          for (const key of protectedKeys) assert.equal(hash(persisted[key]), protectedHashes[key], key);
          assert.equal(hash(persisted.products.filter(p => p.codigo_producto !== "A")), productsHash);
          assert.equal(persisted.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
          assert.deepEqual(reconstructed.products, persisted.products);
          assert.equal(persisted.stockMovements.filter(m => m.id === `STK-${countId}`).length, 1);
          assert.equal((await request("/api/health")).result.activeSessions, users.length);
          soakRounds.push({ round, ms: Date.now() - roundStarted, deltaKeys: Object.keys(delta.state), deltaBytes: Buffer.byteLength(JSON.stringify(delta)) });
          console.log(`PASS soak round ${++round}: delta reconstructed, one movement, all protected records unchanged`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const complete = (await request("/api/state?syncFormat=sections-v1", null, admin)).result;
        assert.equal(hash(reconstructed), hash(complete.state), "incremental state must equal full projected state");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  serverPerformance = (await request("/api/admin/performance", null, admin)).result;
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  child.kill(); await exited;
  if (multi) fs.writeFileSync(reportFile || path.join(root, traffic ? "docs/STOCK-TRAFFIC-183-results.json" : soak ? "docs/STOCK-SOAK-183-results.json" : "docs/STOCK-MULTIUSER-20261021-results.json"), JSON.stringify({
    at: new Date().toISOString(), passed: !process.exitCode, environment: "local-isolated", node: process.version, serverPerformance,
    users: users.map(u => ({ username: u.username, role: u.role })), snapshotUsed: Boolean(snapshotFile), mixed, soak, soakRounds, traffic, trafficRounds, syncBusyRetries, timing,
    memory: fs.existsSync(memoryFile) ? fs.readFileSync(memoryFile, "utf8").trim().split("\n").map(line => JSON.parse(line)) : [],
    logs: logs.slice(-3000)
  }, null, 2));
  if (snapshotFile) assert.equal(crypto.createHash("sha256").update(fs.readFileSync(snapshotFile)).digest("hex"), snapshotHash);
  if (path.dirname(folder) !== path.resolve(os.tmpdir()) || !path.basename(folder).startsWith("dl-count-http-")) throw new Error("Unexpected test path");
  fs.rmSync(folder, { recursive: true, force: true });
});
