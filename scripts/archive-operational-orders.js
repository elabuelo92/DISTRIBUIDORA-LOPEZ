"use strict";

const fs = require("fs");
const path = require("path");
const orderEngine = require("../order-engine");
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

if (!args.includes("--apply")) {
  throw new Error("Modo seguro: agregar --apply y --reason=... para ejecutar el archivado.");
}
const motive = argument("reason");
if (!motive) throw new Error("Indicar --reason=... para dejar trazabilidad.");
if (!fs.existsSync(STATE_FILE)) throw new Error(`No existe el estado ${STATE_FILE}.`);

const payload = JSON.parse(fs.readFileSync(STATE_FILE, "utf8").replace(/^\uFEFF/, ""));
if (!payload || !payload.state || typeof payload.state !== "object") {
  throw new Error("El estado no tiene formato valido { version, state }.");
}
const backupDir = path.join(DATA_DIR, "maintenance-backups", `${stamp()}-archivo-operativo`);
fs.mkdirSync(backupDir, { recursive: true });
const backupFile = path.join(backupDir, path.basename(STATE_FILE));
fs.copyFileSync(STATE_FILE, backupFile);

orderEngine.migrateState(payload.state);
const result = maintenanceEngine.archiveOperationalOrders(payload.state, {
  motive,
  user: argument("user") || "Codex mantenimiento autorizado"
});
orderEngine.migrateState(payload.state);
payload.version = Date.now();
writeAtomic(STATE_FILE, payload);

process.stdout.write(`${JSON.stringify({ ok: true, backup: backupFile, result }, null, 2)}\n`);
