const fs = require("fs");
const path = require("path");
const orderEngine = require("../order-engine");
const deliveryEngine = require("../delivery-engine");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, "demo-state.json");
const DRY_RUN = process.argv.includes("--dry-run");

function countByStatus(orders) {
  return (orders || []).reduce((counts, order) => {
    const status = order.status || "Sin estado";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function missingSummary(orders) {
  return (orders || [])
    .filter((order) => order.inventoryMode === "reservation")
    .map((order) => ({
      code: order.code,
      client: order.client,
      status: order.status,
      missing: (order.items || []).reduce((sum, item) => sum + Math.max(0, Number(item.missingQty) || 0), 0)
    }))
    .filter((order) => order.missing > 0);
}

if (!fs.existsSync(STATE_FILE)) {
  throw new Error(`No existe el archivo de estado: ${STATE_FILE}`);
}

const payload = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
if (!payload.state || typeof payload.state !== "object") {
  throw new Error("El archivo no contiene un estado valido.");
}

const state = payload.state;
orderEngine.migrateState(state);
deliveryEngine.migrateState(state);

const before = {
  statuses: countByStatus(state.orders),
  shortages: missingSummary(state.orders)
};

const completedOrders = orderEngine.allocatePendingOrders(state, "Regeneracion operativa de pedidos");
orderEngine.migrateState(state);
deliveryEngine.migrateState(state);

const after = {
  statuses: countByStatus(state.orders),
  shortages: missingSummary(state.orders)
};

let backup = "";
if (!DRY_RUN) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  backup = `${STATE_FILE}.backup-regenerar-pedidos-${stamp}`;
  fs.copyFileSync(STATE_FILE, backup);
  payload.version = Date.now();
  const temporary = `${STATE_FILE}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(payload), "utf8");
  fs.renameSync(temporary, STATE_FILE);
}

console.log(JSON.stringify({
  ok: true,
  dryRun: DRY_RUN,
  stateFile: STATE_FILE,
  backup,
  completedOrders,
  before,
  after
}, null, 2));
