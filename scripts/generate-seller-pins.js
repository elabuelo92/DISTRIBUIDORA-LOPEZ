"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const usersFile = process.env.USERS_FILE || path.join(process.env.DATA_DIR || path.join(root, "data"), "users.json");
if (!process.argv.includes("--apply")) {
  throw new Error("Ejecucion protegida. Usar --apply para generar y guardar PIN de vendedores activos.");
}

const payload = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const users = Array.isArray(payload.users) ? payload.users : [];
const generated = [];
users.filter((user) => user.role === "seller" && user.active !== false).forEach((user) => {
  const pin = String(crypto.randomInt(0, 10000)).padStart(4, "0");
  const salt = crypto.randomBytes(16).toString("hex");
  user.operationPinSalt = salt;
  user.operationPinHash = crypto.pbkdf2Sync(pin, salt, 120000, 32, "sha256").toString("hex");
  user.operationPinUpdatedAt = new Date().toISOString();
  user.operationPinUpdatedBy = "maintenance-script";
  generated.push({ username: user.username, seller: user.sellerName || user.name, pin });
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${usersFile}.backup-pins-${stamp}`;
fs.copyFileSync(usersFile, backup);
const temporary = `${usersFile}.${process.pid}.tmp`;
fs.writeFileSync(temporary, JSON.stringify({ users }, null, 2), "utf8");
fs.renameSync(temporary, usersFile);
console.log(JSON.stringify({ ok: true, usersFile, backup, generated }, null, 2));
