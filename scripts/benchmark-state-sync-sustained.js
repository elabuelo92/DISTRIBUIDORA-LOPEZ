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
const durationSeconds = Math.max(30, Math.min(600, Number(process.argv[3] || 90)));
const pollIntervalMs = Math.max(1000, Math.min(30000, Number(process.argv[4] || 1000)));
const mutationIntervalMs = Math.max(10000, Math.min(60000, Number(process.argv[5] || 10000)));
const maxFullStateResponses = Math.max(1, Math.min(8, Number(process.argv[6] || 2)));
if (!process.argv[2] || !fs.statSync(source).isFile()) throw new Error("Indicar una copia local del estado.");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tempRoot = fs.realpathSync(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-sync-load-"));
const stateFile = path.join(tempDir, "demo-state.json");
const port = 26000 + crypto.randomInt(1000);
const base = `http://127.0.0.1:${port}`;
const password = "Sync-load-test";
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
const sourceState = JSON.parse(fs.readFileSync(source, "utf8"));
const sellerNames = new Map();
for (const order of sourceState.state.orders || []) {
  if (order.sellerUsername && order.seller) sellerNames.set(String(order.sellerUsername).toLowerCase(), order.seller);
}
const users = [
  ...Array.from(sellerNames.entries()).slice(0, 7).map(([username, name]) => ({ username, name, sellerName: name, role: "seller" })),
  ...Array.from({ length: 4 }, (_, index) => ({ username: `admin-load-${index}`, name: `Admin Load ${index}`, role: "admin" })),
  { username: "depot-load", name: "Depot Load", role: "depot" },
  { username: "driver-load", name: "Driver Load", role: "driver" }
].map((user) => ({ ...user, active: true, salt, passwordHash }));
assert.equal(users.length, 12);
fs.copyFileSync(source, stateFile);
fs.writeFileSync(path.join(tempDir, "users.json"), JSON.stringify({ users }));

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1",
    DL_PORT: String(port),
    PORT: String(port),
    DATA_DIR: tempDir,
    STATE_FILE: stateFile,
    USERS_FILE: path.join(tempDir, "users.json"),
    DL_VERSION: "8790-sync-load-test",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn",
    DL_MAX_FULL_STATE_RESPONSES: String(maxFullStateResponses)
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput = (childOutput + chunk.toString()).slice(-4000); });
child.stderr.on("data", (chunk) => { childOutput = (childOutput + chunk.toString()).slice(-4000); });

async function waitForServer() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      if ((await fetch(`${base}/api/health/live`)).ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`Servidor de prueba no inicio: ${childOutput}`);
}

async function login(username) {
  const input = { username, password, device: { id: `SYNC-LOAD-${username}` } };
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

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.ceil(sorted.length * fraction) - 1]);
}

(async () => {
  let mutationTimer;
  try {
    await waitForServer();
    const clients = [];
    for (const user of users) clients.push({ user, cookie: await login(user.username), version: 0 });
    const metrics = { full: [], unchanged: [], busy: [], health: [], errors: 0, mutations: 0 };
    const endAt = Date.now() + durationSeconds * 1000;
    mutationTimer = setInterval(() => {
      const payload = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      payload.version = Date.now();
      payload.state.syncLoadTestTick = metrics.mutations + 1;
      const nextFile = `${stateFile}.next`;
      fs.writeFileSync(nextFile, JSON.stringify(payload));
      fs.renameSync(nextFile, stateFile);
      metrics.mutations += 1;
    }, mutationIntervalMs);
    const poll = async (client, delay) => {
      await sleep(delay);
      while (Date.now() < endAt) {
        const startedAt = performance.now();
        try {
          const response = await fetch(`${base}/api/state?version=${client.version}`, { headers: { Cookie: client.cookie } });
          const body = await response.json();
          const elapsed = performance.now() - startedAt;
          if (response.status === 503 && body.code === "STATE_SYNC_BUSY") metrics.busy.push(elapsed);
          else if (response.ok && body.unchanged) metrics.unchanged.push(elapsed);
          else if (response.ok && body.state) {
            assert.ok(Number(body.version) >= client.version);
            client.version = Number(body.version);
            if (client.user.role === "seller") {
              assert.equal(body.state.accounts.length, 0);
              assert.ok(body.state.orders.every((order) =>
                String(order.sellerUsername || order.seller || "").toLowerCase() === client.user.username
                  || String(order.seller || "").toLowerCase() === client.user.sellerName.toLowerCase()));
            }
            metrics.full.push(elapsed);
          } else metrics.errors += 1;
        } catch {
          metrics.errors += 1;
        }
        await sleep(pollIntervalMs);
      }
    };
    const health = async () => {
      while (Date.now() < endAt) {
        const startedAt = performance.now();
        try {
          const response = await fetch(`${base}/api/health/live`, { signal: AbortSignal.timeout(10000) });
          if (!response.ok) metrics.errors += 1;
          metrics.health.push(performance.now() - startedAt);
        } catch {
          metrics.errors += 1;
        }
        await sleep(2000);
      }
    };
    await Promise.all([
      ...clients.map((client, index) => poll(client, index * Math.min(800, Math.floor(pollIntervalMs / 12)))),
      health()
    ]);
    clearInterval(mutationTimer);
    const finalVersion = Number(JSON.parse(fs.readFileSync(stateFile, "utf8")).version);
    const catchupStartedAt = performance.now();
    const catchupDeadline = Date.now() + 30000;
    await Promise.all(clients.map(async (client) => {
      while (client.version < finalVersion && Date.now() < catchupDeadline) {
        try {
          const response = await fetch(`${base}/api/state?version=${client.version}`, { headers: { Cookie: client.cookie } });
          const body = await response.json();
          if (response.ok && body.state) client.version = Number(body.version);
          else if (response.status !== 503) metrics.errors += 1;
        } catch {
          metrics.errors += 1;
        }
        if (client.version < finalVersion) await sleep(1000);
      }
    }));
    const laggingClients = clients.filter((client) => client.version < finalVersion).length;
    const healthFinal = await (await fetch(`${base}/api/health`)).json();
    const summary = {
      ok: metrics.errors === 0,
      users: clients.length,
      durationSeconds,
      pollIntervalMs,
      mutationIntervalMs,
      maxFullStateResponses,
      stateMutations: metrics.mutations,
      full: { count: metrics.full.length, p50Ms: percentile(metrics.full, .5), p95Ms: percentile(metrics.full, .95), maxMs: percentile(metrics.full, 1) },
      unchanged: { count: metrics.unchanged.length, p50Ms: percentile(metrics.unchanged, .5), p95Ms: percentile(metrics.unchanged, .95), maxMs: percentile(metrics.unchanged, 1) },
      busyResponses: metrics.busy.length,
      health: { count: metrics.health.length, p95Ms: percentile(metrics.health, .95), maxMs: percentile(metrics.health, 1) },
      errors: metrics.errors,
      activeSessions: healthFinal.activeSessions,
      catchupMs: Math.round(performance.now() - catchupStartedAt),
      laggingClients
    };
    console.log(JSON.stringify(summary));
    assert.equal(metrics.errors, 0);
    assert.equal(healthFinal.activeSessions, 12);
    assert.equal(laggingClients, 0);
    assert.ok(metrics.full.length >= 12);
  } finally {
    clearInterval(mutationTimer);
    if (child.exitCode === null) child.kill("SIGTERM");
    const resolved = fs.realpathSync(tempDir);
    if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith("dl-sync-load-")) {
      throw new Error(`Ruta temporal inesperada: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
