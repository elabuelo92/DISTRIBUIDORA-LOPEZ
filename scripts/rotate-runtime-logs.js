"use strict";

const fs = require("node:fs");
const path = require("node:path");

const apply = process.argv.includes("--apply");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
const thresholdBytes = Math.max(1024 * 1024, Number(process.env.DL_LOG_ROTATE_BYTES || 128 * 1024 * 1024));
const files = ["session-audit.log", "gps-history.log", "global-audit.log"];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const results = [];

for (const name of files) {
  const source = path.resolve(dataDir, name);
  if (path.dirname(source) !== dataDir) throw new Error(`Ruta de log inesperada: ${source}`);
  if (!fs.existsSync(source)) {
    results.push({ file: name, action: "missing", bytes: 0 });
    continue;
  }
  const bytes = fs.statSync(source).size;
  if (bytes < thresholdBytes) {
    results.push({ file: name, action: "below-threshold", bytes });
    continue;
  }
  const archive = path.resolve(dataDir, `${name}.${stamp}`);
  if (path.dirname(archive) !== dataDir || fs.existsSync(archive)) throw new Error(`Archivo de destino invalido: ${archive}`);
  if (apply) {
    fs.renameSync(source, archive);
    fs.writeFileSync(source, "", { encoding: "utf8", flag: "wx" });
  }
  results.push({ file: name, action: apply ? "rotated" : "would-rotate", bytes, archive });
}

console.log(JSON.stringify({ ok: true, apply, dataDir, thresholdBytes, results }, null, 2));
