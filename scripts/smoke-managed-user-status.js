"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styleSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.ok(htmlSource.includes('id="managedUsersStatusFilter"'), "filtro por estado visible");
assert.ok(htmlSource.indexOf('class="panel users-directory-panel"') < htmlSource.indexOf('id="managedUserFormPanel" hidden'),
  "el directorio aparece antes que el formulario y ocupa el flujo principal");
assert.ok(htmlSource.includes('id="newManagedUserBtn"'), "alta accesible desde el directorio");
assert.ok(htmlSource.includes('id="closeManagedUserFormBtn"'), "el formulario tiene una salida clara");
assert.ok(htmlSource.includes('data-view="usuarios"><span class="icon" aria-hidden="true"><img src="icons/tools/users.svg"'), "la navegacion usa el icono de usuarios");
for (const [, asset] of htmlSource.matchAll(/<span class="icon"[^>]*><img src="([^"]+)"/g)) {
  assert.ok(fs.existsSync(path.join(root, asset)), `existe el icono ${asset}`);
}
assert.ok(styleSource.includes("@media (prefers-reduced-motion: reduce)"), "los efectos respetan movimiento reducido");
assert.ok(styleSource.includes("--depth-hover"), "la elevacion utiliza una sombra CSS liviana");
assert.ok(appSource.includes("function prepareManagedUserStatusChange("), "accion directa para baja/reactivacion");
assert.ok(appSource.includes("function setManagedUserFormOpen(open)"), "el editor se abre bajo demanda");
assert.ok(appSource.includes("resetManagedUserForm(null, { open: false })"), "la carga inicial mantiene el editor cerrado");
assert.ok(appSource.includes("data-managed-user-active="), "la accion expresa el estado destino");
assert.ok(appSource.includes("No se borraran datos."), "la confirmacion aclara que no hay borrado fisico");
assert.ok(appSource.includes("historial conservado."), "la confirmacion de exito informa conservacion del historial");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-managed-user-status-"));
const stateFile = path.join(dir, "demo-state.json");
const usersFile = path.join(dir, "users.json");
const port = 27500 + Math.floor(Math.random() * 400);
const base = `http://127.0.0.1:${port}`;
const adminPassword = "User-Status-Admin-Test-2026!";
const sellerPassword = "Lisandro-User-Status-Test-2026!";

const makeUser = (username, name, role, password, extra = {}) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    username, name, role, active: true, salt,
    passwordHash: crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex"),
    createdAt: "2026-01-01T00:00:00.000Z", createdBy: "fixture", ...extra
  };
};

const initialState = {
  sellers: [{ name: "Lisandro", username: "lisandro" }],
  clients: [{ id: "CLI-1", name: "Cliente fixture", seller: "Lisandro", balance: 1250, observations: "No modificar" }],
  orders: [{ code: "PED-FIXTURE-1", seller: "Lisandro", total: 1250, commissions: { seller: { user: "Lisandro", total: 37.5 } } }],
  commissionSettings: { rules: [{ id: "COM-FIXTURE-1", role: "seller", username: "lisandro", userLabel: "Lisandro", rubro: "*", percent: 3, active: true }] },
  commissionSettlements: [{ id: "PAY-FIXTURE-1", seller: "Lisandro", amount: 37.5 }],
  stockMovements: [{ id: "STOCK-FIXTURE-1", qty: 4 }]
};
fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: initialState }));
fs.writeFileSync(usersFile, JSON.stringify({ users: [
  makeUser("admin-test", "Admin test", "admin", adminPassword),
  makeUser("lisandro", "Lisandro", "seller", sellerPassword, { sellerName: "Lisandro" }),
  makeUser("reparto-test", "Reparto test", "driver", "Driver-Status-Test-2026!")
] }));

const excelShim = path.join(dir, "node_modules", "exceljs");
fs.mkdirSync(excelShim, { recursive: true });
fs.writeFileSync(path.join(excelShim, "index.js"), "module.exports = {};\n");
const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1",
    DL_PORT: String(port),
    PORT: String(port),
    DATA_DIR: dir,
    STATE_FILE: stateFile,
    USERS_FILE: usersFile,
    DL_MAINTENANCE_FILE: path.join(dir, "maintenance.json"),
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn",
    DL_SEED_DEFAULT_USERS: "false",
    NODE_PATH: [path.join(dir, "node_modules"), process.env.NODE_PATH || ""].filter(Boolean).join(path.delimiter)
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let logs = "";
child.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
child.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
const exited = once(child, "exit");

async function request(url, body, cookie = "", expected = 200) {
  const response = await fetch(base + url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-ERP-Response": "compact-v1", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json();
  assert.equal(response.status, expected, `${url}: ${JSON.stringify(payload).slice(0, 500)}`);
  return { payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}

async function login(username, password) {
  const legal = (await request("/api/legal")).payload.legal;
  return (await request("/api/login", {
    username, password,
    device: { id: `USER-STATUS-${username}`, label: "Prueba aislada" },
    legalAcceptance: { accepted: true, version: legal.currentVersion, hash: legal.hash }
  })).cookie;
}

function readState() { return JSON.parse(fs.readFileSync(stateFile, "utf8")); }
function protectedData(state) {
  return JSON.stringify({
    clients: (state.clients || []).map((client) => ({ id: client.id, seller: client.seller, balance: client.balance, observations: client.observations })),
    orders: (state.orders || []).map((order) => ({
      code: order.code,
      seller: order.seller,
      total: order.total,
      sellerCommissionUser: order.commissions && order.commissions.seller && order.commissions.seller.user,
      sellerCommissionTotal: order.commissions && order.commissions.seller && order.commissions.seller.total
    })),
    commissionRules: (state.commissionSettings && state.commissionSettings.rules || []).map((rule) => ({
      id: rule.id, role: rule.role, username: rule.username, userLabel: rule.userLabel, rubro: rule.rubro,
      percent: rule.percent, active: rule.active
    })),
    commissionSettlements: (state.commissionSettlements || []).map((item) => ({ id: item.id, seller: item.seller, amount: item.amount })),
    stockMovements: (state.stockMovements || []).map((item) => ({ id: item.id, qty: item.qty }))
  });
}

(async () => {
  try {
    let ready = false;
    let healthDetails = "";
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        const response = await fetch(`${base}/api/health`);
        healthDetails = `${response.status} ${await response.text()}`;
        if (response.ok) { ready = true; break; }
      } catch (error) {
        const cause = error && error.cause;
        healthDetails = `${error.name || "Error"}: ${error.message || String(error)}${cause ? ` (${cause.code || cause.message || cause})` : ""}`;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `${logs.slice(-1500)}\n${healthDetails.slice(0, 1000)}`);

    const admin = await login("admin-test", adminPassword);
    const seller = await login("lisandro", sellerPassword);
    const before = readState();
    const protectedBefore = protectedData(before.state);
    const userBefore = JSON.parse(fs.readFileSync(usersFile, "utf8")).users.find((user) => user.username === "lisandro");

    const change = {
      targetUsername: "lisandro", username: "lisandro", name: "Lisandro", role: "seller", sellerName: "Lisandro",
      active: false, mustChangePassword: false, motive: "Baja operativa de prueba", admin_password: adminPassword
    };
    await request("/api/admin/users", { ...change, motive: "" }, admin, 400);
    assert.equal(JSON.parse(fs.readFileSync(usersFile, "utf8")).users.find((user) => user.username === "lisandro").active, true,
      "un motivo vacio no desactiva la cuenta");
    const deactivated = await request("/api/admin/users", change, admin);
    assert.equal(deactivated.payload.user.active, false);
    assert.ok(deactivated.payload.backup, "la baja genera respaldo de usuarios");
    assert.ok(fs.existsSync(path.join(dir, deactivated.payload.backup)), "el respaldo informado existe");
    const storedUser = JSON.parse(fs.readFileSync(usersFile, "utf8")).users.find((user) => user.username === "lisandro");
    assert.equal(storedUser.active, false);
    assert.equal(storedUser.passwordHash, userBefore.passwordHash, "la baja no cambia credenciales");
    assert.equal(storedUser.createdAt, userBefore.createdAt, "la baja conserva el registro original");
    assert.equal(protectedData(readState().state), protectedBefore, "pedidos, cartera, comisiones, pagos y stock quedan intactos");
    assert.ok(readState().state.globalAudit.some((entry) => entry.entityId === "lisandro" && entry.action === "USUARIO_ACTUALIZADO"),
      "la baja queda registrada en auditoria global");
    assert.equal((await request("/api/state", null, seller, 401)).payload.ok, false, "se cierra la sesion activa del usuario dado de baja");
    await request("/api/login", { username: "lisandro", password: sellerPassword }, "", 401);

    const reactivated = await request("/api/admin/users", {
      ...change, active: true, motive: "Reactivacion de prueba"
    }, admin);
    assert.equal(reactivated.payload.user.active, true);
    assert.equal(protectedData(readState().state), protectedBefore, "la reactivacion tampoco altera datos historicos");
    assert.ok(await login("lisandro", sellerPassword), "el acceso vuelve a funcionar al reactivar");

    const selfDisable = await request("/api/admin/users", {
      targetUsername: "admin-test", username: "admin-test", name: "Admin test", role: "admin",
      active: false, motive: "Intento de auto-baja", admin_password: adminPassword
    }, admin, 400);
    assert.match(selfDisable.payload.error, /No se puede desactivar/);
    assert.equal(JSON.parse(fs.readFileSync(usersFile, "utf8")).users.find((user) => user.username === "admin-test").active, true);

    console.log("PASS: baja/reactivacion reversible, clave administrativa, motivo, backup, cierre/bloqueo de sesion y datos comerciales intactos; fixture aislada.");
  } finally {
    child.kill();
    await exited;
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
