const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const USERS_FILE = process.env.USERS_FILE || path.join(DATA_DIR, "users.json");
const DEFAULT_PASSWORD = process.argv[2] || process.env.DL_DEFAULT_PASSWORD || "Lopez2026!";

const users = [
  { username: "admin1", name: "Administracion 1", role: "admin" },
  { username: "admin2", name: "Administracion 2", role: "admin" },
  { username: "admin3", name: "Administracion 3", role: "admin" },
  { username: "sofia", name: "Sofia Benitez", role: "seller", sellerName: "Sofia Benitez" },
  { username: "carlos", name: "Carlos Roldan", role: "seller", sellerName: "Carlos Roldan" },
  { username: "nicolas", name: "Nicolas Vera", role: "seller", sellerName: "Nicolas Vera" },
  { username: "vendedor4", name: "Vendedor 4", role: "seller", sellerName: "Vendedor 4" },
  { username: "vendedor5", name: "Vendedor 5", role: "seller", sellerName: "Vendedor 5" },
  { username: "reparto1", name: "Dispositivo Reparto 1", role: "driver" }
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, passwordHash };
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(
  USERS_FILE,
  JSON.stringify({ users: users.map((user) => ({ ...user, ...hashPassword(DEFAULT_PASSWORD) })) }, null, 2) + "\n",
  "utf8"
);

console.log(`Usuarios regenerados en ${USERS_FILE}`);
console.log(`Clave aplicada: ${DEFAULT_PASSWORD}`);
