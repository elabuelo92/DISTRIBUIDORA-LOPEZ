const fs = require("node:fs");
const crypto = require("node:crypto");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const OrderEngine = require("../order-engine");
const DeliveryEngine = require("../delivery-engine");

const root = path.resolve(__dirname, "..");
const previewDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-delivery-preview-v150-"));
const publicDemo = process.argv.includes("--public-demo");
const password = publicDemo ? crypto.randomBytes(18).toString("base64url") : "VistaPrevia150!";

function availablePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function main() {
  const clients = Array.from({ length: 100 }, (_, index) => ({
    codigo_cliente: `PREVIEW-C${index + 1}`,
    name: `Cliente de prueba ${index + 1}`,
    domicilio: `Calle de prueba ${index + 1}`,
    localidad: "Cordoba",
    telefono: publicDemo ? "" : `351000${String(index + 1).padStart(4, "0")}`,
    referencia: index % 3 === 0 ? "Porton verde" : "",
    horario_atencion: "08:00-13:00 / 17:00-21:00",
    zona: "Zona prueba",
    ruta: "Ruta prueba",
    latitud: -31.4 + index / 100000,
    longitud: -64.18 + index / 100000,
    status: "Activo"
  }));
  const orders = clients.map((client, index) => ({
    code: `PED-PREVIEW-${String(index + 1).padStart(3, "0")}`,
    client: client.name,
    clientId: client.codigo_cliente,
    seller: "Vendedor de prueba",
    amount: 5000 + index * 100,
    status: OrderEngine.STATUS.READY_DISPATCH,
    items: [{ productCode: "PREVIEW-P1", name: "Producto de prueba", requestedQty: 1, unitPrice: 5000 + index * 100, lineTotal: 5000 + index * 100 }],
    assembly: { orderNumber: index + 1, bultosConfirmed: index % 4 + 1, label: { generated: true, scanned: false, scannerOptional: true } },
    trace: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  const state = {
    products: [{ codigo_producto: "PREVIEW-P1", name: "Producto de prueba", stock_fisico: 1000, stock_actual: 1000, stock: 1000 }],
    clients, sellers: [{ name: "Vendedor de prueba", orders: 100, sales: 0, commission: 0 }],
    orders, accounts: [], activity: [], notifications: [], globalAudit: [], stockMovements: [], shortages: [],
    deliveryRoutes: [], deliveryAudit: [], deliveryClosures: [], priceLists: []
  };
  const actor = { user: "Administracion", username: "admin1", role: "admin" };
  const route = DeliveryEngine.createPlannedRoute(state, {
    orderCodes: orders.map((order) => order.code),
    day: new Date().toISOString().slice(0, 10),
    zone: "Zona prueba",
    driverUser: publicDemo ? "reparto-demo" : "reparto1",
    driverLabel: "Repartidor de prueba"
  }, actor);
  DeliveryEngine.publishRoute(state, route.id, actor);
  fs.writeFileSync(path.join(previewDir, "demo-state.json"), JSON.stringify({ version: Date.now(), state }));
  if (publicDemo) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
    fs.writeFileSync(path.join(previewDir, "users.json"), JSON.stringify({ users: [{
      username: "reparto-demo", name: "Repartidor de prueba", role: "driver", salt, passwordHash
    }] }));
  }

  let port = 0;
  for (let candidate = publicDemo ? 21910 : 21889; candidate < (publicDemo ? 21930 : 21910); candidate += 1) {
    if (await availablePort(candidate)) { port = candidate; break; }
  }
  if (!port) throw new Error("No hay puerto libre para la vista previa.");
  const child = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: {
      ...process.env,
      DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: previewDir,
      STATE_FILE: path.join(previewDir, "demo-state.json"), USERS_FILE: path.join(previewDir, "users.json"),
      DL_DEFAULT_PASSWORD: password, DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn",
      DL_SEED_DEFAULT_USERS: publicDemo ? "false" : "true",
      DL_PUBLIC_DEMO: publicDemo ? "true" : "false",
      DL_API_BASE_URL: "", DL_VERSION: "8790-150-preview"
    },
    stdio: "ignore",
    detached: true,
    windowsHide: true
  });
  child.unref();
  const url = `http://127.0.0.1:${port}/`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${url}api/health`);
      if (response.ok) {
        console.log(JSON.stringify({ url, user: publicDemo ? "reparto-demo" : "reparto1", password, orders: 100, pid: child.pid, dataDir: previewDir, productionWrites: 0 }));
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  child.kill();
  throw new Error("La vista previa no inicio.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
