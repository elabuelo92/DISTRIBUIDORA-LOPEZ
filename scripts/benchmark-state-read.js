"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { performance } = require("node:perf_hooks");

const root = path.resolve(__dirname, "..");
const source = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.statSync(source).isFile()) {
  throw new Error("Indicar una copia local del archivo de estado.");
}

const tempRoot = fs.realpathSync(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-state-read-"));
const port = 25000 + crypto.randomInt(1000);
const base = `http://127.0.0.1:${port}`;
const password = "State-read-test";
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
const users = [
  { username: "admin-read", name: "Admin Read", role: "admin" },
  { username: "david", name: "Axel", sellerName: "Axel", role: "seller" }
].map((user) => ({ ...user, active: true, salt, passwordHash }));
fs.copyFileSync(source, path.join(tempDir, "demo-state.json"));
fs.writeFileSync(path.join(tempDir, "users.json"), JSON.stringify({ users }));

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1",
    DL_PORT: String(port),
    PORT: String(port),
    DATA_DIR: tempDir,
    STATE_FILE: path.join(tempDir, "demo-state.json"),
    USERS_FILE: path.join(tempDir, "users.json"),
    DL_VERSION: "8790-state-read-test",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString().slice(0, 2000); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString().slice(0, 2000); });

async function waitForServer() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      if ((await fetch(`${base}/api/health/live`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor de prueba no inicio: ${childOutput}`);
}

async function login(username) {
  const input = { username, password, device: { id: `STATE-READ-${username}` } };
  let response = await fetch(`${base}/api/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)
  });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)
    });
  }
  assert.equal(response.status, 200, `Login de prueba ${username}`);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function readState(cookie, version = 0) {
  const startedAt = performance.now();
  const response = await fetch(`${base}/api/state?version=${version}`, { headers: { Cookie: cookie } });
  const body = await response.json();
  assert.equal(response.status, 200);
  return { ms: Math.round(performance.now() - startedAt), body };
}

(async () => {
  try {
    await waitForServer();
    const admin = await login("admin-read");
    const seller = await login("david");
    const firstAdmin = await readState(admin);
    const repeatAdmin = await readState(admin);
    const firstSeller = await readState(seller);
    const repeatSeller = await readState(seller);
    const unchanged = await readState(admin, firstAdmin.body.version);
    assert.equal(unchanged.body.unchanged, true);
    assert.equal(firstAdmin.body.state.orders.length, repeatAdmin.body.state.orders.length);
    assert.ok(firstSeller.body.state.orders.every((order) =>
      [order.sellerUsername, order.username, order.seller, order.vendedor_titular, order.vendedor, order.assignedSeller]
        .some((value) => ["axel", "david"].includes(String(value || "").toLowerCase()))));
    assert.ok(firstSeller.body.state.orders.length > 0);
    assert.equal(firstSeller.body.state.orders.length, repeatSeller.body.state.orders.length);
    assert.equal(firstSeller.body.state.accounts.length, 0);
    console.log(JSON.stringify({
      ok: true,
      orders: firstAdmin.body.state.orders.length,
      adminFirstMs: firstAdmin.ms,
      adminRepeatMs: repeatAdmin.ms,
      sellerFirstMs: firstSeller.ms,
      sellerRepeatMs: repeatSeller.ms,
      unchangedMs: unchanged.ms,
      sellerOrders: firstSeller.body.state.orders.length
    }));
  } finally {
    child.kill("SIGTERM");
    const resolved = fs.realpathSync(tempDir);
    if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith("dl-state-read-")) {
      throw new Error(`Ruta temporal inesperada: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
