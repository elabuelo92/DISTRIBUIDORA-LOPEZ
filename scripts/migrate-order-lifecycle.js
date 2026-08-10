const fs = require("fs");
const path = require("path");
const orderEngine = require("../order-engine");
const deliveryEngine = require("../delivery-engine");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, "demo-state.json");

if (!fs.existsSync(STATE_FILE)) {
  throw new Error(`No existe el archivo de estado: ${STATE_FILE}`);
}

const payload = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
if (!payload.state || typeof payload.state !== "object") {
  throw new Error("El archivo no contiene un estado valido.");
}

const before = (payload.state.orders || []).reduce((counts, order) => {
  counts[order.status || "Sin estado"] = (counts[order.status || "Sin estado"] || 0) + 1;
  return counts;
}, {});
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${STATE_FILE}.backup-ciclo-${stamp}`;
fs.copyFileSync(STATE_FILE, backup);

orderEngine.migrateState(payload.state);
deliveryEngine.migrateState(payload.state);
payload.version = Date.now();
const temporary = `${STATE_FILE}.tmp-${process.pid}`;
fs.writeFileSync(temporary, JSON.stringify(payload), "utf8");
fs.renameSync(temporary, STATE_FILE);

const after = payload.state.orders.reduce((counts, order) => {
  counts[order.status || "Sin estado"] = (counts[order.status || "Sin estado"] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  ok: true,
  stateFile: STATE_FILE,
  backup,
  orders: payload.state.orders.length,
  products: payload.state.products.length,
  clients: payload.state.clients.length,
  before,
  after
}, null, 2));
