const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const USERS_FILE = process.env.USERS_FILE || path.join(ROOT, "data", "users.json");
const action = String(process.argv[2] || "list").toLowerCase();

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const payload = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  return Array.isArray(payload.users) ? payload.users : [];
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, passwordHash };
}

function readStdinJson() {
  const text = fs.readFileSync(0, "utf8").trim();
  return text ? JSON.parse(text) : {};
}

function backupUsersFile() {
  if (!fs.existsSync(USERS_FILE)) return "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${USERS_FILE}.backup-${stamp}`;
  fs.copyFileSync(USERS_FILE, backup);
  return backup;
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  const backup = backupUsersFile();
  fs.writeFileSync(USERS_FILE, `${JSON.stringify({ users }, null, 2)}\n`, "utf8");
  return backup;
}

function publicUser(user) {
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    sellerName: user.sellerName || "",
    active: user.active !== false
  };
}

if (action === "list") {
  console.log(JSON.stringify({ file: USERS_FILE, users: readUsers().map(publicUser) }, null, 2));
  process.exit(0);
}

if (action === "upsert") {
  const input = readStdinJson();
  const users = readUsers();
  const targetUsername = String(input.targetUsername || input.username || "").trim().toLowerCase();
  const username = String(input.username || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const role = String(input.role || "").trim().toLowerCase();
  const password = String(input.password || "");
  if (!username || !name || !["admin", "seller", "driver", "receiver", "depot"].includes(role)) {
    throw new Error("Usuario, nombre y rol admin/seller/driver/receiver/depot son obligatorios.");
  }
  const index = users.findIndex((user) => String(user.username).toLowerCase() === targetUsername);
  const duplicate = users.findIndex((user, userIndex) => userIndex !== index && String(user.username).toLowerCase() === username);
  if (duplicate >= 0) throw new Error(`El usuario ${username} ya existe.`);
  if (index < 0 && !password) throw new Error("Un usuario nuevo requiere una clave inicial.");

  const previous = index >= 0 ? users[index] : {};
  const next = {
    ...previous,
    username,
    name,
    role,
    active: input.active !== false
  };
  if (role === "seller") {
    next.sellerName = String(input.sellerName || name).trim();
  } else {
    delete next.sellerName;
  }
  if (password) Object.assign(next, hashPassword(password));
  if (!next.salt || !next.passwordHash) throw new Error("El usuario no tiene una clave valida.");
  if (index >= 0) users[index] = next;
  else users.push(next);
  const backup = saveUsers(users);
  console.log(JSON.stringify({ ok: true, file: USERS_FILE, backup, user: publicUser(next) }, null, 2));
  process.exit(0);
}

if (action === "disable") {
  const input = readStdinJson();
  const username = String(input.username || "").trim().toLowerCase();
  const users = readUsers();
  const user = users.find((item) => String(item.username).toLowerCase() === username);
  if (!user) throw new Error(`No existe el usuario ${username}.`);
  user.active = false;
  const backup = saveUsers(users);
  console.log(JSON.stringify({ ok: true, file: USERS_FILE, backup, user: publicUser(user) }, null, 2));
  process.exit(0);
}

throw new Error(`Accion desconocida: ${action}.`);
