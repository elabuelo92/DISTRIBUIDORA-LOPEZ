const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-maintenance-v142-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const maintenanceFile = path.join(tempDir, "maintenance-mode.json");
const port = 23142;

fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: {} }), "utf8");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);
fs.writeFileSync(maintenanceFile, JSON.stringify({
  active: true,
  startedAt: "2026-09-09T04:00:00Z",
  message: "Ventana de prueba"
}), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1",
    DL_PORT: String(port),
    PORT: String(port),
    DATA_DIR: tempDir,
    STATE_FILE: stateFile,
    USERS_FILE: usersFile,
    DL_MAINTENANCE_FILE: maintenanceFile,
    DL_VERSION: "8790-142",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString(); });

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`El servidor de prueba no inicio. ${childOutput.trim()}`);
}

(async () => {
  try {
    const healthDuring = await waitForHealth();
    assert.equal(healthDuring.maintenance.active, true);
    assert.equal(healthDuring.maintenance.message, "Ventana de prueba");

    const pageResponse = await fetch(`http://127.0.0.1:${port}/`);
    const page = await pageResponse.text();
    assert.equal(pageResponse.status, 503);
    assert.equal(pageResponse.headers.get("x-maintenance-mode"), "active");
    assert.match(page, /Distribuidora Lopez/);
    assert.match(page, /Volvemos en unos minutos/);
    assert.match(page, /logo-distribuidora-lopez-512\.png/);

    const apiGetResponse = await fetch(`http://127.0.0.1:${port}/api/orders`);
    const apiGetPayload = await apiGetResponse.json();
    assert.equal(apiGetResponse.status, 503);
    assert.equal(apiGetPayload.code, "MAINTENANCE_MODE");

    const apiResponse = await fetch(`http://127.0.0.1:${port}/api/presence/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    const apiPayload = await apiResponse.json();
    assert.equal(apiResponse.status, 503);
    assert.equal(apiPayload.code, "MAINTENANCE_MODE");

    fs.rmSync(maintenanceFile);
    const pageAfter = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(pageAfter.status, 200);
    const healthAfter = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json();
    assert.equal(healthAfter.maintenance.active, false);

    console.log(JSON.stringify({
      ok: true,
      version: "8790-142",
      maintenancePage: true,
      apiGuard: true,
      automaticReturn: true
    }, null, 2));
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
