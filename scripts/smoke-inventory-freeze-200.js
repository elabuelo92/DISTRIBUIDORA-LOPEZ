const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const maintenanceAccess = require("../maintenance-access");

const superadmin = { username: "SuperAdmin", role: "admin", active: true };
const admin = { username: "admin2", role: "admin", active: true };
const seller = { username: "superadmin", role: "seller", active: true };
const activeMode = { active: true, allowSuperadmin: true };

assert.equal(maintenanceAccess.isSuperAdmin(superadmin), true);
assert.equal(maintenanceAccess.isSuperAdmin(seller), false);
assert.equal(maintenanceAccess.allowsRequest({ status: activeMode, user: superadmin, method: "POST", pathname: "/api/orders" }), true);
assert.equal(maintenanceAccess.allowsRequest({ status: activeMode, user: admin, method: "POST", pathname: "/api/orders" }), false);
assert.equal(maintenanceAccess.allowsRequest({ status: activeMode, user: null, method: "GET", pathname: "/" }), true);
assert.equal(maintenanceAccess.allowsRequest({ status: activeMode, user: null, method: "GET", pathname: "/api/orders" }), false);
assert.equal(maintenanceAccess.allowsRequest({ status: activeMode, user: admin, method: "POST", pathname: "/api/logout" }), true);
assert.equal(maintenanceAccess.allowsLogin(activeMode, superadmin), true);
assert.equal(maintenanceAccess.allowsLogin(activeMode, admin), false);
assert.equal(maintenanceAccess.allowsRequest({ status: { active: true }, user: superadmin, method: "GET", pathname: "/" }), false);

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-inventory-freeze-200-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const maintenanceFile = path.join(tempDir, "maintenance-mode.json");
const password = "FreezeSmoke-200";
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
const portServer = net.createServer();
let child;

async function reservePort() {
  await new Promise((resolve, reject) => portServer.once("error", reject).listen(0, "127.0.0.1", resolve));
  const port = portServer.address().port;
  await new Promise((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()));
  return port;
}

function jsonUser(username, role) {
  return { username, name: username, role, active: true, salt, passwordHash };
}

function fileHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function request(baseUrl, pathname, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch {}
  return { response, payload, text };
}

async function login(baseUrl, username) {
  const input = { username, password, device: { id: `smoke-${username}`, label: "Prueba aislada" } };
  let result = await request(baseUrl, "/api/login", { method: "POST", body: input });
  if (result.response.status === 428) {
    const legal = result.payload.legal;
    input.legalAcceptance = { accepted: true, version: legal.currentVersion, hash: legal.hash };
    result = await request(baseUrl, "/api/login", { method: "POST", body: input });
  }
  const cookie = String(result.response.headers.get("set-cookie") || "").split(";")[0];
  return { ...result, cookie };
}

async function waitForHealth(baseUrl, output) {
  let lastResponse = "sin respuesta HTTP";
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const result = await request(baseUrl, "/api/health");
      if (result.response.ok) return result.payload;
      lastResponse = `HTTP ${result.response.status}: ${result.text.slice(0, 500)}`;
    } catch (error) { lastResponse = String(error && error.message || error); }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`El servidor aislado no paso health. ${lastResponse}. ${output()}`);
}

(async () => {
  try {
    const port = await reservePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: {} }), "utf8");
    fs.writeFileSync(usersFile, JSON.stringify({ users: [jsonUser("superadmin", "admin"), jsonUser("admin2", "admin"), jsonUser("seller1", "seller")] }), "utf8");

    child = spawn(process.execPath, [path.join(root, "server.js")], {
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
        DL_SEED_DEFAULT_USERS: "false",
        DL_VERSION: "8790-200-test",
        DL_LICENSE_ENFORCEMENT: "disabled",
        DL_INTEGRITY_ENFORCE: "warn"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });

    await waitForHealth(baseUrl, () => output.trim());
    const adminLogin = await login(baseUrl, "admin2");
    const superLogin = await login(baseUrl, "superadmin");
    assert.equal(adminLogin.response.status, 200, "admin de control debe iniciar antes del corte");
    assert.equal(superLogin.response.status, 200, "superadmin debe iniciar antes del corte");
    assert.ok(adminLogin.cookie && superLogin.cookie, "ambas sesiones deben tener cookie de prueba");
    const stateHashBeforeFreeze = fileHash(stateFile);
    const usersHashBeforeFreeze = fileHash(usersFile);

    fs.writeFileSync(maintenanceFile, JSON.stringify({
      active: true,
      allowSuperadmin: true,
      startedAt: new Date().toISOString(),
      message: "Inventario fisico: solo superadmin"
    }), "utf8");

    const healthDuring = await request(baseUrl, "/api/health");
    assert.equal(healthDuring.response.status, 200);
    assert.equal(healthDuring.payload.maintenance.active, true);
    assert.equal(healthDuring.payload.maintenance.allowSuperadmin, true);
    const loginPage = await request(baseUrl, "/");
    assert.equal(loginPage.response.status, 200, "la pantalla de ingreso debe seguir accesible");
    const loginScript = await request(baseUrl, "/app.js");
    assert.equal(loginScript.response.status, 200, "los recursos para autenticacion deben seguir accesibles");

    const blockedPage = await request(baseUrl, "/", { cookie: adminLogin.cookie });
    assert.equal(blockedPage.response.status, 503);
    assert.equal(blockedPage.response.headers.get("x-maintenance-mode"), "active");
    const blockedRead = await request(baseUrl, "/api/session", { cookie: adminLogin.cookie });
    assert.equal(blockedRead.response.status, 503);
    assert.equal(blockedRead.payload.code, "MAINTENANCE_MODE");
    const blockedWrite = await request(baseUrl, "/api/orders", { method: "POST", body: {}, cookie: adminLogin.cookie });
    assert.equal(blockedWrite.response.status, 503);

    const superSession = await request(baseUrl, "/api/session", { cookie: superLogin.cookie });
    assert.equal(superSession.response.status, 200);
    assert.equal(superSession.payload.user.username, "superadmin");
    const superRead = await request(baseUrl, "/api/admin/performance", { cookie: superLogin.cookie });
    assert.equal(superRead.response.status, 200);

    const rejectedLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: { username: "admin2", password, device: { id: "attempt", label: "Prueba" } }
    });
    assert.equal(rejectedLogin.response.status, 503);
    assert.equal(rejectedLogin.payload.code, "MAINTENANCE_MODE");

    const allowedLogin = await login(baseUrl, "superadmin");
    assert.equal(allowedLogin.response.status, 200, "solo superadmin puede autenticarse durante el corte");
    const allowedSession = await request(baseUrl, "/api/session", { cookie: allowedLogin.cookie });
    assert.equal(allowedSession.response.status, 200);
    assert.equal(fileHash(stateFile), stateHashBeforeFreeze, "el corte no debe modificar el estado comercial");
    assert.equal(fileHash(usersFile), usersHashBeforeFreeze, "el corte no debe modificar usuarios o permisos");

    fs.rmSync(maintenanceFile);
    const normalLogin = await request(baseUrl, "/api/login", {
      method: "POST",
      body: { username: "admin2", password, device: { id: "after-freeze", label: "Prueba" } }
    });
    assert.equal(normalLogin.response.status, 200, "quitar el modo mantenimiento restablece el login normal");

    console.log(JSON.stringify({
      ok: true,
      version: "8790-200-test",
      adminBlockedFromPageAndApi: true,
      adminLoginRejectedDuringFreeze: true,
      superadminSessionAndLoginAllowed: true,
      normalLoginRestoredAfterRemoval: true,
      stateAndUsersUnchangedDuringFreeze: true,
      productionDataTouched: false
    }, null, 2));
  } finally {
    if (child && child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
