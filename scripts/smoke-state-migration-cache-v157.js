"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-migration-cache-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const password = `Migration-${crypto.randomBytes(8).toString("hex")}`;
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
const fixture = (stock) => ({ products: [{ codigo_producto: "P1", name: "Producto", stock }], clients: [], orders: [] });
fs.writeFileSync(usersFile, JSON.stringify({ users: [{ username: "admin-migration", name: "Admin Migracion", role: "admin", active: true, salt, passwordHash }] }));
fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: fixture(10) }));

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

(async () => {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir,
      STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-157-migration-test",
      DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output = (output + chunk).slice(-2000); });
  child.stderr.on("data", (chunk) => { output = (output + chunk).slice(-2000); });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        if ((await fetch(`${base}/api/health/live`)).ok) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(ready, `Servidor de prueba no inicio: ${output}`);
    const loginInput = { username: "admin-migration", password, device: { id: "MIGRATION-CACHE-TEST" } };
    let login = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginInput) });
    if (login.status === 428) {
      const required = await login.json();
      loginInput.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
      login = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginInput) });
    }
    assert.equal(login.status, 200);
    const headers = { Cookie: String(login.headers.get("set-cookie") || "").split(";")[0] };
    const first = await (await fetch(`${base}/api/state?version=0`, { headers })).json();
    assert.equal(first.state.products[0].stock_fisico, 10);
    const initial = await (await fetch(`${base}/api/admin/performance`, { headers })).json();
    fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now() + 10000, state: fixture(12) }));
    const future = new Date(Date.now() + 2000);
    fs.utimesSync(stateFile, future, future);
    const updated = await (await fetch(`${base}/api/state?version=0`, { headers })).json();
    assert.equal(updated.state.products[0].stock_fisico, 12);
    const after = await (await fetch(`${base}/api/admin/performance`, { headers })).json();
    assert.ok(after.stateReadMigration.count > initial.stateReadMigration.count);
    console.log(JSON.stringify({ ok: true, firstStock: 10, externalStock: 12, migrations: after.stateReadMigration.count }));
  } finally {
    await new Promise((resolve) => {
      if (child.exitCode !== null) { resolve(); return; }
      child.once("exit", resolve);
      child.kill("SIGTERM");
    });
    if (path.dirname(tempDir) !== tempRoot || !path.basename(tempDir).startsWith("dl-migration-cache-")) {
      throw new Error(`Ruta temporal inesperada: ${tempDir}`);
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
