"use strict";

const fs = require("fs");
const path = require("path");
const orderEngine = require("../order-engine");
const accountEngine = require("../account-engine");
const maintenanceEngine = require("../maintenance-engine");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, "demo-state.json");
const args = process.argv.slice(2);

function argument(name) {
  const prefix = `--${name}=`;
  const value = args.find((part) => part.startsWith(prefix));
  return value ? value.slice(prefix.length).trim() : "";
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeAtomic(file, payload) {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

if (!fs.existsSync(STATE_FILE)) throw new Error(`No existe el estado ${STATE_FILE}.`);
const motive = argument("reason");
if (!motive) throw new Error("Indicar --reason=... para dejar trazabilidad.");
const expectedCount = Number(argument("expected") || 0);
const sellerNames = (argument("sellers") || "Axel,Ruggero").split(",").map((value) => value.trim()).filter(Boolean);
const dateFrom = argument("from") || "2026-09-04T03:00:00.000Z";
const dateTo = argument("to") || "";
const payload = JSON.parse(fs.readFileSync(STATE_FILE, "utf8").replace(/^\uFEFF/, ""));
if (!payload || !payload.state || typeof payload.state !== "object") {
  throw new Error("El estado no tiene formato valido { version, state }.");
}

const candidate = JSON.parse(JSON.stringify(payload.state));
orderEngine.migrateState(candidate);
accountEngine.migrateState(candidate);
const result = maintenanceEngine.restoreOperationalOrders(candidate, {
  sellers: sellerNames,
  statuses: [orderEngine.STATUS.READY, orderEngine.STATUS.READY_DISPATCH],
  reservationStatuses: [
    orderEngine.STATUS.PENDING,
    orderEngine.STATUS.COMMERCIAL_APPROVAL,
    orderEngine.STATUS.READY,
    orderEngine.STATUS.ASSEMBLY,
    orderEngine.STATUS.LABELED,
    orderEngine.STATUS.READY_DISPATCH
  ],
  dateFrom,
  dateTo,
  expectedCount
}, {
  motive,
  user: argument("user") || "Codex mantenimiento autorizado"
});
orderEngine.migrateState(candidate);
accountEngine.migrateState(candidate);

if (!args.includes("--apply")) {
  process.stdout.write(`${JSON.stringify({ ok: true, dryRun: true, stateFile: STATE_FILE, result }, null, 2)}\n`);
  process.exit(0);
}

const backupDir = path.join(DATA_DIR, "maintenance-backups", `${stamp()}-restauracion-operativa`);
fs.mkdirSync(backupDir, { recursive: true });
const backupFile = path.join(backupDir, path.basename(STATE_FILE));
fs.copyFileSync(STATE_FILE, backupFile);
payload.state = candidate;
payload.version = Date.now();
writeAtomic(STATE_FILE, payload);
process.stdout.write(`${JSON.stringify({ ok: true, applied: true, backup: backupFile, result }, null, 2)}\n`);
