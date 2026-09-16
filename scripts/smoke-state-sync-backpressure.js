"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-state-sync-"));
const port = 25000 + crypto.randomInt(1000);
const base = `http://127.0.0.1:${port}`;
const password = "State-sync-test";
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");

fs.writeFileSync(path.join(tempDir, "users.json"), JSON.stringify({
  users: [{ username: "admin-sync", name: "Admin Sync", role: "admin", active: true, salt, passwordHash }]
}));

const largeAudit = Array.from({ length: 1500 }, (_, index) => ({
  id: `AUDIT-${index}`,
  at: new Date().toISOString(),
  action: "STATE_SYNC_STRESS",
  payload: crypto.randomBytes(12 * 1024).toString("hex")
}));
fs.writeFileSync(path.join(tempDir, "demo-state.json"), JSON.stringify({
  version: 1,
  state: { globalAudit: largeAudit, products: [], clients: [], orders: [] }
}));

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
    DL_VERSION: "8790-state-sync-test",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn",
    DL_MAX_FULL_STATE_RESPONSES: "1"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health/live`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor de prueba no inicio: ${childOutput}`);
}

async function login() {
  const input = { username: "admin-sync", password, device: { id: "STATE-SYNC-TEST" } };
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
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

(async () => {
  try {
    await waitForServer();
    const cookie = await login();
    const stateVersion = Number((await (await fetch(`${base}/api/health`)).json()).stateVersion);
    assert.ok(stateVersion > 0);
    const fullRequests = Array.from({ length: 12 }, () => fetch(`${base}/api/state?version=0`, {
      headers: { Cookie: cookie, "Accept-Encoding": "gzip" }
    }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    const fastPath = await fetch(`${base}/api/state?version=${stateVersion}`, { headers: { Cookie: cookie } });
    const live = await fetch(`${base}/api/health/live`);
    const responses = await Promise.all(fullRequests);
    const statuses = responses.map((response) => response.status);
    const accepted = statuses.filter((status) => status === 200).length;
    const busy = statuses.filter((status) => status === 503).length;
    assert.equal(accepted, 1);
    assert.equal(busy, 11);
    assert.equal(fastPath.status, 200);
    assert.equal((await fastPath.json()).unchanged, true);
    assert.equal(live.status, 200);
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.stateSync.maxConcurrent, 1);
    assert.equal(health.stateSync.rejectedSinceStart, 11);
    console.log(JSON.stringify({ ok: true, requests: statuses.length, accepted, busy, liveResponsive: true, unchangedFastPath: true }));
  } finally {
    child.kill("SIGTERM");
    if (path.dirname(tempDir) !== tempRoot || !path.basename(tempDir).startsWith("dl-state-sync-")) {
      throw new Error(`Ruta temporal inesperada: ${tempDir}`);
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
