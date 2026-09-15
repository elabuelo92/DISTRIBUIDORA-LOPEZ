"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-label-reprint-"));
const port = 22000 + Math.floor(Math.random() * 1000);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const usersPayload = JSON.parse(fs.readFileSync(path.join(root, "data", "users.json"), "utf8"));
const admin = usersPayload.users.find((user) => user.username === "admin1");
assert.ok(admin, "usuario de prueba admin1");
const password = "SmokeLabel2026!";
admin.salt = crypto.randomBytes(16).toString("hex");
admin.passwordHash = crypto.pbkdf2Sync(password, admin.salt, 120000, 32, "sha256").toString("hex");
admin.active = true;
fs.writeFileSync(usersFile, JSON.stringify(usersPayload), "utf8");
fs.writeFileSync(stateFile, JSON.stringify({
  version: 1,
  state: {
    orders: [{ code: "PED-LABEL-SMOKE", client: "Cliente prueba", status: "En Armado", assembly: { orderNumber: 1, bultosConfirmed: 2 } }],
    clients: [], products: [], accounts: [], activity: [], notifications: [], globalAudit: [], stockMovements: []
  }
}), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir,
    STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-label-smoke",
    DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
let exitStatus = "running";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });
child.on("exit", (code, signal) => { exitStatus = `exit=${code} signal=${signal || "none"}`; });
const base = `http://127.0.0.1:${port}`;
const orderPath = "api/orders/PED-LABEL-SMOKE/label";

async function request(endpoint, options = {}, expected = 200) {
  const response = await fetch(`${base}/${endpoint}`, options);
  const payload = await response.json();
  assert.equal(response.status, expected, payload.error || endpoint);
  return { payload, response };
}

async function main() {
  let healthy = false;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) { healthy = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(healthy, `servidor local no inicio (${exitStatus}): ${output}`);
  const loginInput = { username: "admin1", password, device: { id: "SMOKE-LABEL", label: "Smoke label", model: "Node", os: process.platform, appVersion: "8790-label-smoke" } };
  const loginOptions = () => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginInput) });
  let loginResponse = await fetch(`${base}/api/login`, loginOptions());
  if (loginResponse.status === 428) {
    const required = await loginResponse.json();
    loginInput.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    loginResponse = await fetch(`${base}/api/login`, loginOptions());
  }
  assert.equal(loginResponse.status, 200, "login local");
  const login = { response: loginResponse };
  const cookie = String(login.response.headers.get("set-cookie") || "").split(";")[0];
  assert.ok(cookie);
  const headers = { Cookie: cookie, "Content-Type": "application/json" };
  const input = { assemblyOrderNumber: 1, packages: 2, observations: "", printer: "", printed: true, operationId: "SMOKE-LABEL-0001" };
  const post = (endpoint, body, expected = 200) => request(endpoint, { method: "POST", headers, body: JSON.stringify(body) }, expected);
  const get = (endpoint) => request(endpoint, { headers: { Cookie: cookie } });

  const first = (await post(orderPath, input)).payload;
  assert.equal(first.order.assembly.label.operationId, input.operationId);
  assert.equal(first.order.assembly.label.packageLabels.length, 2);
  const originalCodes = first.order.assembly.label.packageLabels.map((label) => label.scanCode);
  const status = (await get(`${orderPath}/status`)).payload;
  assert.equal(status.version, first.version, "verificar no escribe estado");
  assert.deepEqual(status.order.assembly.label.packageLabels.map((label) => label.scanCode), originalCodes);

  const scanned = (await post("api/orders/PED-LABEL-SMOKE/scan", { scanValue: originalCodes[0] })).payload;
  assert.equal(scanned.order.assembly.label.packageLabels[0].scanned, true);
  const replay = (await post(orderPath, input)).payload;
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.version, scanned.version, "repetir no escribe estado");
  assert.equal(replay.order.assembly.label.packageLabels[0].scanned, true, "repetir no borra escaneos");
  assert.deepEqual(replay.order.assembly.label.packageLabels.map((label) => label.scanCode), originalCodes);

  const changed = (await post(orderPath, { ...input, packages: 3, operationId: "SMOKE-LABEL-0002" }, 409)).payload;
  assert.equal(changed.code, "LABEL_ALREADY_GENERATED");
  const after = (await get(`${orderPath}/status`)).payload;
  assert.equal(after.version, scanned.version);
  assert.equal(after.order.assembly.bultosConfirmed, 2);
  const denied = await request(`${orderPath}/status`, {}, 401);
  assert.equal(denied.payload.error, "SESSION_REQUIRED");
  console.log("OK: etiqueta local confirma, reimpresion idempotente y escaneos intactos.");
}

main().finally(() => {
  child.kill();
  const resolved = path.resolve(tempDir);
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith("dl-label-reprint-")) throw new Error("Ruta temporal de prueba inesperada.");
  fs.rmSync(resolved, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
