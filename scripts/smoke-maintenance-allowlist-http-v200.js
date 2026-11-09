const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-maintenance-allowlist-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const maintenanceFile = path.join(tempDir, "maintenance-mode.json");
const port = 23143;
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync("MaintenanceSmoke-200", salt, 120000, 32, "sha256").toString("hex");

fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: {} }), "utf8");
fs.writeFileSync(usersFile, JSON.stringify({ users: [
  { username: "AgustinRocha", name: "Agustin", role: "admin", active: true, salt, passwordHash },
  { username: "Admin2", name: "Other Admin", role: "admin", active: true, salt, passwordHash },
  { username: "Ruggero", name: "Seller", role: "seller", active: true, salt, passwordHash }
] }), "utf8");
fs.writeFileSync(maintenanceFile, JSON.stringify({
  active: true,
  allowSuperadmin: true,
  allowedAdminUsers: ["AgustinRocha"],
  startedAt: "2026-11-08T00:00:00Z",
  message: "Inventario fisico"
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
    DL_SEED_DEFAULT_USERS: "false",
    DL_MAINTENANCE_FILE: maintenanceFile,
    DL_VERSION: "8790-200",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString(); });

async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`El servidor aislado no inicio. ${childOutput.trim()}`);
}

async function login(username) {
  return fetch(`http://127.0.0.1:${port}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "MaintenanceSmoke-200" })
  });
}

(async () => {
  try {
    const health = await waitForHealth();
    assert.equal(health.maintenance.active, true);
    assert.equal(Object.hasOwn(health.maintenance, "allowedAdminUsers"), false);

    const permitted = await login("AgustinRocha");
    assert.equal(permitted.status, 428, "allowlisted admin should reach terms acceptance");
    assert.equal((await permitted.json()).code, "TERMS_REQUIRED");

    const otherAdmin = await login("Admin2");
    assert.equal(otherAdmin.status, 503, "other admins remain blocked");

    const seller = await login("Ruggero");
    assert.equal(seller.status, 503, "seller remains blocked");

    console.log("PASS: AgustinRocha puede iniciar el acceso; los demas usuarios quedan bloqueados y el allowlist no se publica en health.");
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
