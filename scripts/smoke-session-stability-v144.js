"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-session-v144-"));
const port = 24000 + crypto.randomInt(1000);
const base = `http://127.0.0.1:${port}`;
const password = "Session-v144-test";
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
fs.writeFileSync(path.join(tempDir, "users.json"), JSON.stringify({
  users: [{ username: "seller-test", name: "Seller Test", role: "seller", active: true, salt, passwordHash }]
}));
fs.writeFileSync(path.join(tempDir, "demo-state.json"), JSON.stringify({ version: 1, state: {} }));

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
    DL_VERSION: "8790-144-test",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
let childStatus = "running";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString(); });
child.on("error", (error) => { childStatus = `spawn error: ${error.message}`; });
child.on("exit", (code, signal) => { childStatus = `exit=${code} signal=${signal || "none"}`; });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health/live`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor de prueba no inicio (${childStatus}): ${childOutput}`);
}

async function login() {
  const input = { username: "seller-test", password, device: { id: "SESSION-V144-TEST" } };
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

async function postGps(cookie) {
  const response = await fetch(`${base}/api/presence/location`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ gps: { lat: -31.4, lng: -64.2, accuracy: 10, source: "gps" } })
  });
  assert.equal(response.status, 200);
  return response.json();
}

(async () => {
  try {
    await waitForServer();
    const cookie = await login();
    const results = await Promise.all(Array.from({ length: 25 }, () => postGps(cookie)));
    assert.equal(results.filter((result) => result.throttled === true).length, 24);
    assert.equal(results.filter((result) => result.throttled !== true).length, 1);
    const audit = fs.readFileSync(path.join(tempDir, "session-audit.log"), "utf8")
      .split("\n").filter(Boolean).map((line) => JSON.parse(line));
    assert.equal(audit.filter((entry) => entry.action === "GPS_UPDATED").length, 1);
    const gpsHistory = fs.readFileSync(path.join(tempDir, "gps-history.log"), "utf8")
      .split("\n").filter(Boolean);
    assert.equal(gpsHistory.length, 1);
    assert.equal((await fetch(`${base}/api/health/live`)).status, 200);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 5100));
    assert.equal((await postGps(cookie)).throttled, undefined);
    assert.equal((await fetch(`${base}/api/presence/status`, { headers: { Cookie: cookie } })).status, 200);
    fs.writeFileSync(path.join(tempDir, "maintenance-mode.json"), JSON.stringify({ active: true }));
    assert.equal((await fetch(`${base}/api/health/live`)).status, 200);
    console.log(JSON.stringify({ ok: true, burstRequests: 25, gpsWrites: 1, sessionPreserved: true, liveDuringMaintenance: true }));
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
