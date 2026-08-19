const fs = require("fs");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const ExcelJS = require("exceljs");
const { spawn } = require("child_process");
const orderEngine = require("./order-engine");
const deliveryEngine = require("./delivery-engine");
const accountEngine = require("./account-engine");
const eventEngine = require("./event-engine");
const erpnextEngine = require("./erpnext-engine");
const licenseEngine = require("./license-engine");
const legalEngine = require("./legal-engine");

const ROOT = __dirname;
const PORT = Number(process.env.DL_PORT || process.env.PORT || 8790);
const HOST = process.env.DL_HOST || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const APP_RUNTIME_VERSION = process.env.DL_VERSION || "8790-100";
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, "demo-state.json");
const USERS_FILE = process.env.USERS_FILE || path.join(DATA_DIR, "users.json");
const PASSWORD_RECOVERY_LOG = path.join(DATA_DIR, "password-recovery.log");
const SESSION_CONFIG_FILE = path.join(DATA_DIR, "session-config.json");
const SESSION_AUDIT_LOG = path.join(DATA_DIR, "session-audit.log");
const GPS_HISTORY_LOG = path.join(DATA_DIR, "gps-history.log");
const PRINT_DIR = path.join(DATA_DIR, "print-jobs");
const UPLOAD_DIR = path.join(DATA_DIR, "delivery-uploads");
const SUPPLIER_UPLOAD_DIR = path.join(DATA_DIR, "supplier-uploads");
const PRINT_LOG = path.join(DATA_DIR, "print-jobs.log");
const STOCK_PRINT_SCRIPT = path.join(ROOT, "scripts", "print-stock-report.ps1");
const STOCK_PRINTER_NAME = process.env.DL_STOCK_PRINTER_NAME || "";
const DEFAULT_PASSWORD = process.env.DL_DEFAULT_PASSWORD || "Lopez2026!";
const MANAGED_USER_ROLES = ["admin", "seller", "driver", "receiver", "depot"];
const MAX_BODY = 16 * 1024 * 1024;
const DEFAULT_SESSION_TTL_MS = Math.max(16 * 60 * 60 * 1000, Number(process.env.DL_SESSION_TTL_MS || 20 * 60 * 60 * 1000));
const DEFAULT_WORKDAY_START_HOUR = Math.max(0, Math.min(23, Number(process.env.DL_WORKDAY_START_HOUR || 7)));
const DEFAULT_WORKDAY_END_HOUR = Math.max(1, Math.min(24, Number(process.env.DL_WORKDAY_END_HOUR || 22)));
const PRESENCE_OFFLINE_MS = Number(process.env.DL_PRESENCE_OFFLINE_MS || 45000);
const sessions = new Map();
const recentPresenceHistory = [];
const productPortfolioPreviews = new Map();
const securityEngine = licenseEngine.createEngine({
  root: ROOT,
  dataDir: DATA_DIR,
  version: APP_RUNTIME_VERSION
});

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".apk": "application/vnd.android.package-archive"
};

function send(res, status, type, body, headers) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ""), "utf8");
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": payload.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    ...(headers || {})
  });
  res.end(payload);
}

function sendJson(res, status, data, headers) {
  let payload = Buffer.from(JSON.stringify(data), "utf8");
  const responseHeaders = { ...(headers || {}) };
  const acceptEncoding = String(res._acceptEncoding || "gzip").toLowerCase();
  if (payload.length > 2048 && acceptEncoding.includes("gzip")) {
    payload = zlib.gzipSync(payload);
    responseHeaders["Content-Encoding"] = "gzip";
    responseHeaders["Vary"] = "Accept-Encoding";
  } else if (payload.length > 2048 && acceptEncoding.includes("deflate")) {
    payload = zlib.deflateSync(payload);
    responseHeaders["Content-Encoding"] = "deflate";
    responseHeaders["Vary"] = "Accept-Encoding";
  }
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": payload.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    ...responseHeaders
  });
  res.end(payload);
}

function boundedNumber(value, fallback, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

function normalizeSessionConfig(config = {}) {
  return {
    duplicatePolicy: config.duplicatePolicy === "reject" ? "reject" : "replace",
    offlineAfterMs: boundedNumber(config.offlineAfterMs, PRESENCE_OFFLINE_MS, 15000, 10 * 60 * 1000),
    heartbeatIntervalMs: boundedNumber(config.heartbeatIntervalMs, 10000, 5000, 5 * 60 * 1000),
    locationUpdateMinDistanceMeters: boundedNumber(config.locationUpdateMinDistanceMeters, 5, 0, 5000),
    locationMovingIntervalMs: boundedNumber(config.locationMovingIntervalMs, 10000, 5000, 5 * 60 * 1000),
    locationStationaryIntervalMs: boundedNumber(config.locationStationaryIntervalMs, 10000, 10000, 10 * 60 * 1000),
    locationMaxAgeMs: boundedNumber(config.locationMaxAgeMs, 300000, 30000, 60 * 60 * 1000),
    historyRetentionDays: boundedNumber(config.historyRetentionDays, 30, 1, 365),
    sessionTtlMs: boundedNumber(config.sessionTtlMs, DEFAULT_SESSION_TTL_MS, 16 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000),
    workdayStartHour: boundedNumber(config.workdayStartHour, DEFAULT_WORKDAY_START_HOUR, 0, 23),
    workdayEndHour: boundedNumber(config.workdayEndHour, DEFAULT_WORKDAY_END_HOUR, 1, 24),
    workdayTimezone: String(config.workdayTimezone || "America/Argentina/Cordoba").trim() || "America/Argentina/Cordoba"
  };
}

function sessionTtlMs(config = readSessionConfig()) {
  return normalizeSessionConfig(config).sessionTtlMs;
}

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(SUPPLIER_UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(SESSION_CONFIG_FILE)) {
    fs.writeFileSync(SESSION_CONFIG_FILE, JSON.stringify(normalizeSessionConfig({}), null, 2), "utf8");
  }
  if (!fs.existsSync(USERS_FILE)) {
    const users = seedUsers().map((user) => ({ ...user, password: undefined, ...hashPassword(user.password) }));
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      const users = Array.isArray(data.users) ? data.users : [];
      let changed = false;
      seedUsers().forEach((seedUser) => {
        const seedUsername = String(seedUser.username || "").trim().toLowerCase();
        const exists = users.some((user) => String(user.username || "").trim().toLowerCase() === seedUsername);
        if (!exists) {
          users.push({ ...seedUser, password: undefined, ...hashPassword(seedUser.password) });
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
      }
    } catch {
      const users = seedUsers().map((user) => ({ ...user, password: undefined, ...hashPassword(user.password) }));
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
    }
  }
}

function readSessionConfig() {
  ensureDataFiles();
  try {
    const config = JSON.parse(fs.readFileSync(SESSION_CONFIG_FILE, "utf8"));
    return normalizeSessionConfig(config);
  } catch {
    return normalizeSessionConfig({});
  }
}

function writeSessionConfig(config) {
  const next = normalizeSessionConfig(config);
  fs.writeFileSync(SESSION_CONFIG_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function writeSessionAudit(action, session, extra) {
  ensureDataFiles();
  const entry = {
    at: new Date().toISOString(),
    action,
    sessionId: session && session.sessionId || "",
    username: session && session.user && session.user.username || extra && extra.username || "",
    user: session && session.user && session.user.name || extra && extra.user || "",
    role: session && session.user && session.user.role || extra && extra.role || "",
    deviceId: session && session.device && session.device.id || extra && extra.deviceId || "",
    deviceLabel: session && session.device && session.device.label || extra && extra.deviceLabel || "",
    ip: session && session.ip || extra && extra.ip || "",
    gps: session && session.location || extra && extra.gps || null,
    note: extra && extra.note || ""
  };
  fs.appendFileSync(SESSION_AUDIT_LOG, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function seedUsers() {
  return [
    { username: "admin1", name: "Administracion 1", role: "admin", password: DEFAULT_PASSWORD },
    { username: "admin2", name: "Administracion 2", role: "admin", password: DEFAULT_PASSWORD },
    { username: "admin3", name: "Administracion 3", role: "admin", password: DEFAULT_PASSWORD },
    { username: "sofia", name: "Sofia Benitez", role: "seller", sellerName: "Sofia Benitez", password: DEFAULT_PASSWORD },
    { username: "carlos", name: "Carlos Roldan", role: "seller", sellerName: "Carlos Roldan", password: DEFAULT_PASSWORD },
    { username: "kevin", name: "Kevin Guibert", role: "seller", sellerName: "Kevin Guibert", defaultPriceListId: "PL-L4", defaultPriceListName: "Lista Nº 4", priceListLocked: true, password: DEFAULT_PASSWORD },
    { username: "nicolas", name: "Nicolas Vera", role: "seller", sellerName: "Nicolas Vera", password: DEFAULT_PASSWORD },
    { username: "vendedor4", name: "Vendedor 4", role: "seller", sellerName: "Vendedor 4", password: DEFAULT_PASSWORD },
    { username: "vendedor5", name: "Vendedor 5", role: "seller", sellerName: "Vendedor 5", password: DEFAULT_PASSWORD },
    { username: "reparto1", name: "Dispositivo Reparto 1", role: "driver", password: DEFAULT_PASSWORD },
    { username: "deposito1", name: "Encargado de Deposito", role: "depot", password: DEFAULT_PASSWORD },
    { username: "recepcion1", name: "Recepcion Mercaderia", role: "receiver", password: DEFAULT_PASSWORD }
  ];
}

function hashPassword(password, salt) {
  const nextSalt = salt || crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(String(password), nextSalt, 120000, 32, "sha256").toString("hex");
  return { salt: nextSalt, passwordHash };
}

function verifyPassword(password, user) {
  if (!user || !user.salt || !user.passwordHash) return false;
  const { passwordHash } = hashPassword(password, user.salt);
  const supplied = Buffer.from(passwordHash, "hex");
  const stored = Buffer.from(user.passwordHash, "hex");
  return supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
}

function verifyCurrentUserPassword(user, password) {
  const users = readUsers();
  const stored = users.find((item) => String(item.username || "").toLowerCase() === String(user && user.username || "").toLowerCase() && item.active !== false);
  return Boolean(stored && verifyPassword(password || "", stored));
}

function withoutSensitiveFields(input) {
  const copy = { ...(input || {}) };
  ["password", "admin_password", "adminPassword", "preventistaPassword", "sellerPassword", "clave", "clavePreventista"].forEach((key) => {
    if (key in copy) copy[key] = "[redacted]";
  });
  return copy;
}

function readUsers() {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")).users || [];
}

function writeUsers(users) {
  ensureDataFiles();
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users: Array.isArray(users) ? users : [] }, null, 2), "utf8");
}

function backupUsersFile() {
  ensureDataFiles();
  if (!fs.existsSync(USERS_FILE)) return "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${USERS_FILE}.backup-${stamp}`;
  fs.copyFileSync(USERS_FILE, backup);
  return backup;
}

function writeUsersWithBackup(users) {
  const backup = backupUsersFile();
  writeUsers(users);
  return backup;
}

function publicUser(user) {
  if (!user) return null;
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    sellerName: user.sellerName || null,
    defaultPriceListId: user.defaultPriceListId || user.priceListId || "",
    defaultPriceListName: user.defaultPriceListName || user.priceListName || "",
    priceListLocked: user.priceListLocked === true,
    creditAuthorization: user.role === "admin" || user.creditAuthorization === true || Boolean(user.permissions && user.permissions.creditAuthorization),
    priceEditAuthorization: user.role === "admin" && user.priceEditAuthorization !== false
      || user.priceEditAuthorization === true
      || hasPermissionFlag(user, "priceEditAuthorization")
      || hasPermissionFlag(user, "orders.edit_prices")
  };
}

function publicManagedUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    active: user.active !== false,
    updatedAt: user.updatedAt || "",
    updatedBy: user.updatedBy || "",
    createdAt: user.createdAt || "",
    createdBy: user.createdBy || ""
  };
}

function managedPriceListFromInput(input, previous) {
  const rawNumber = Number(input.defaultPriceListNumber || input.priceListNumber || input.listaPrecio || 0);
  const rawId = String(input.defaultPriceListId || input.priceListId || "").trim();
  const currentId = previous && (previous.defaultPriceListId || previous.priceListId) || "";
  const currentName = previous && (previous.defaultPriceListName || previous.priceListName) || "";
  const number = Number.isFinite(rawNumber) && rawNumber >= 1 && rawNumber <= 5
    ? Math.round(rawNumber)
    : Number(String(rawId || currentId || "").match(/[1-5]/) && String(rawId || currentId || "").match(/[1-5]/)[0] || 0);
  if (!number) {
    return {
      defaultPriceListId: currentId,
      defaultPriceListName: currentName,
      priceListLocked: input.priceListLocked === undefined ? previous && previous.priceListLocked === true : input.priceListLocked === true || input.priceListLocked === "true"
    };
  }
  return {
    defaultPriceListId: `PL-L${number}`,
    defaultPriceListName: `Lista Nº ${number}`,
    priceListLocked: input.priceListLocked === undefined ? previous && previous.priceListLocked === true : input.priceListLocked === true || input.priceListLocked === "true"
  };
}

function normalizeManagedUserInput(input, previous, sessionUser) {
  const username = String(input.username || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const role = String(input.role || "").trim().toLowerCase();
  const password = String(input.password || input.newPassword || "");
  if (!username || !name || !MANAGED_USER_ROLES.includes(role)) {
    throw new Error("Usuario, nombre y rol valido son obligatorios.");
  }
  if (!previous && !password) {
    throw new Error("Un usuario nuevo requiere una clave inicial.");
  }
  const now = new Date().toISOString();
  const next = {
    ...(previous || {}),
    username,
    name,
    role,
    active: input.active === undefined ? previous ? previous.active !== false : true : input.active === true || input.active === "true" || input.active === "on",
    updatedAt: now,
    updatedBy: sessionUser && sessionUser.username || "admin"
  };
  if (!previous) {
    next.createdAt = now;
    next.createdBy = sessionUser && sessionUser.username || "admin";
  }
  if (role === "seller") next.sellerName = String(input.sellerName || name).trim();
  else delete next.sellerName;
  const priceList = managedPriceListFromInput(input, previous);
  if (priceList.defaultPriceListId) {
    next.defaultPriceListId = priceList.defaultPriceListId;
    next.defaultPriceListName = priceList.defaultPriceListName;
    next.priceListLocked = priceList.priceListLocked === true;
  } else {
    delete next.defaultPriceListId;
    delete next.defaultPriceListName;
    delete next.priceListLocked;
  }
  if (password) Object.assign(next, hashPassword(password));
  if (!next.salt || !next.passwordHash) throw new Error("El usuario no tiene una clave valida.");
  return next;
}

function propagateSellerIdentity(state, previousUser, nextUser) {
  if (!state || !previousUser || !nextUser || nextUser.role !== "seller") return null;
  const previousName = String(previousUser.sellerName || previousUser.name || "").trim();
  const nextName = String(nextUser.sellerName || nextUser.name || "").trim();
  const previousUsername = String(previousUser.username || "").trim().toLowerCase();
  const nextUsername = String(nextUser.username || "").trim().toLowerCase();
  if (!previousName || !nextName || (previousName === nextName && previousUsername === nextUsername)) return null;
  const counts = { sellers: 0, orders: 0, clients: 0, rules: 0, visits: 0, priceLists: 0 };

  (state.sellers || []).forEach((seller) => {
    if (String(seller.name || "").trim() !== previousName) return;
    seller.name = nextName;
    seller.username = nextUsername;
    counts.sellers += 1;
  });
  (state.orders || []).forEach((order) => {
    const sameSeller = String(order.seller || "").trim() === previousName;
    const sameUsername = String(order.sellerUsername || "").trim().toLowerCase() === previousUsername;
    if (!sameSeller && !sameUsername) return;
    order.seller = nextName;
    order.sellerUsername = nextUsername;
    if (order.commissions && order.commissions.seller) order.commissions.seller.user = nextName;
    counts.orders += 1;
  });
  (state.clients || []).forEach((client) => {
    let changed = false;
    ["seller", "vendedor_asignado", "assignedSeller"].forEach((field) => {
      if (String(client[field] || "").trim() === previousName) {
        client[field] = nextName;
        changed = true;
      }
    });
    if (changed) counts.clients += 1;
  });
  (state.noPurchaseVisits || []).forEach((visit) => {
    if (String(visit.seller || visit.vendedor || "").trim() !== previousName) return;
    if (Object.prototype.hasOwnProperty.call(visit, "seller")) visit.seller = nextName;
    if (Object.prototype.hasOwnProperty.call(visit, "vendedor")) visit.vendedor = nextName;
    counts.visits += 1;
  });
  const rules = state.commissionSettings && Array.isArray(state.commissionSettings.rules) ? state.commissionSettings.rules : [];
  rules.forEach((rule) => {
    const sameLabel = String(rule.userLabel || "").trim() === previousName;
    const sameUsername = String(rule.username || "").trim().toLowerCase() === previousUsername;
    if (!sameLabel && !sameUsername) return;
    rule.userLabel = nextName;
    rule.username = nextUsername;
    counts.rules += 1;
  });
  (state.priceListAssignments || []).forEach((assignment) => {
    const sameLabel = String(assignment.sellerName || assignment.seller || "").trim() === previousName;
    const sameUsername = String(assignment.username || "").trim().toLowerCase() === previousUsername;
    if (!sameLabel && !sameUsername) return;
    if (Object.prototype.hasOwnProperty.call(assignment, "sellerName")) assignment.sellerName = nextName;
    if (Object.prototype.hasOwnProperty.call(assignment, "seller")) assignment.seller = nextName;
    assignment.username = nextUsername;
    counts.priceLists += 1;
  });
  return { previousName, nextName, previousUsername, nextUsername, counts };
}

function hasPermissionFlag(user, key) {
  const permissions = user && user.permissions;
  if (!permissions) return false;
  if (Array.isArray(permissions)) return permissions.includes(key);
  return permissions[key] === true;
}

function userCanEditOrderEconomics(user) {
  if (!user || user.priceEditAuthorization === false) return false;
  return user.role === "admin"
    || user.priceEditAuthorization === true
    || hasPermissionFlag(user, "priceEditAuthorization")
    || hasPermissionFlag(user, "orders.edit_prices");
}

function fullUserByUsername(username) {
  const target = String(username || "").trim().toLowerCase();
  if (!target) return null;
  return readUsers().find((item) => String(item.username || "").trim().toLowerCase() === target && item.active !== false) || null;
}

function orderEditItemKey(item) {
  return normalizeSearchText(item && (item.productCode || item.codigo_producto || item.code || item.name || item.descripcion || ""));
}

function orderEditHasEconomicChange(previousOrder, input) {
  const nextItems = Array.isArray(input && input.items) ? input.items : [];
  const previousItems = Array.isArray(previousOrder && previousOrder.items) ? previousOrder.items : [];
  if (!nextItems.length || !previousItems.length) return false;
  const previousByKey = new Map(previousItems.map((item) => [orderEditItemKey(item), item]));
  return nextItems.some((item) => {
    const key = orderEditItemKey(item);
    const previous = previousByKey.get(key);
    const nextUnitPrice = numeric(item && (item.unitPrice ?? item.price), NaN);
    const nextDiscount = numeric(item && (item.discountPct ?? item.discount ?? item.descuento), NaN);
    if (!previous) return Number.isFinite(nextUnitPrice) && nextUnitPrice > 0 || Number.isFinite(nextDiscount) && nextDiscount > 0;
    const previousUnitPrice = numeric(previous.unitPrice ?? previous.price, 0);
    const previousDiscount = numeric(previous.discountPct ?? previous.discount ?? previous.descuento, 0);
    return Number.isFinite(nextUnitPrice) && Math.abs(nextUnitPrice - previousUnitPrice) > 0.009
      || Number.isFinite(nextDiscount) && Math.abs(nextDiscount - previousDiscount) > 0.009;
  });
}

function cookieValue(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie.split(";").map((part) => part.trim()).reduce((found, part) => {
    if (found) return found;
    const index = part.indexOf("=");
    if (index < 0) return "";
    return part.slice(0, index) === name ? decodeURIComponent(part.slice(index + 1)) : "";
  }, "");
}

function sessionCookie(req, token, maxAge) {
  const secure = req.headers["x-forwarded-proto"] === "https" || req.socket.encrypted;
  return `dl_session=${encodeURIComponent(token || "")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function normalizeGps(gps) {
  if (!gps) return null;
  const lat = Number(gps.lat ?? gps.latitude);
  const lng = Number(gps.lng ?? gps.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const rawDeviceAt = gps.deviceAt || gps.clientAt || gps.at || "";
  const deviceAtDate = Number(rawDeviceAt) > 1000000000 ? new Date(Number(rawDeviceAt)) : new Date(String(rawDeviceAt || ""));
  const deviceAt = Number.isNaN(deviceAtDate.getTime()) ? "" : deviceAtDate.toISOString();
  const provider = String(gps.provider || "").trim();
  const mock = gps.mock === true || gps.isMock === true || gps.mocked === true || String(gps.mock || "").toLowerCase() === "true";
  const speed = Number(gps.speed ?? gps.velocity ?? gps.velocidad);
  const heading = Number(gps.heading ?? gps.bearing ?? gps.orientation ?? gps.orientacion);
  const battery = Number(gps.battery ?? gps.batteryPct ?? gps.bateria);
  const serverAt = new Date().toISOString();
  const deviceAgeMs = deviceAt ? Math.max(0, Date.now() - new Date(deviceAt).getTime()) : null;
  return {
    lat,
    lng,
    accuracy: Math.max(0, Number(gps.accuracy || 0)),
    speed: Number.isFinite(speed) ? Math.max(0, speed) : null,
    heading: Number.isFinite(heading) ? heading : null,
    battery: Number.isFinite(battery) ? Math.max(0, Math.min(100, Math.round(battery))) : null,
    online: gps.online === false ? false : true,
    source: String(gps.source || "gps"),
    provider,
    mock,
    reliable: !mock,
    deviceAt,
    serverAt,
    deviceAgeMs,
    updatedAt: serverAt
  };
}

function gpsRejectReason(gps, config = readSessionConfig()) {
  if (!gps) return "Ubicacion GPS invalida.";
  const source = normalizeSearchText(gps.source || "");
  if (gps.mock === true || gps.isMock === true || gps.mocked === true || String(gps.mock || "").toLowerCase() === "true") {
    return "Ubicacion no confiable o simulada.";
  }
  if (["demo", "simulada", "simulado", "mock", "fake", "server", "servidor", "ip", "geoip"].includes(source)) {
    return "Fuente GPS no permitida.";
  }
  if (Math.abs(Number(gps.lat)) > 90 || Math.abs(Number(gps.lng)) > 180) {
    return "Coordenadas fuera de rango.";
  }
  if (gps.deviceAt) {
    const deviceTime = new Date(gps.deviceAt).getTime();
    if (Number.isFinite(deviceTime)) {
      const age = Date.now() - deviceTime;
      const maxAge = Number(config.locationMaxAgeMs || 300000);
      if (age > maxAge) return "Ubicacion GPS desactualizada.";
      if (age < -60000) return "Fecha del GPS del dispositivo invalida.";
    }
  }
  return "";
}

function gpsWarning(gps) {
  if (!gps) return "";
  if (Number(gps.accuracy || 0) > 100) return `Precision GPS baja: ${Math.round(Number(gps.accuracy || 0))} m.`;
  if (!Number(gps.accuracy || 0)) return "GPS sin precision informada.";
  return "";
}

function appendGpsHistory(session, gps, input = {}) {
  if (!session || !gps) return null;
  ensureDataFiles();
  const entry = {
    at: new Date().toISOString(),
    sessionId: session.sessionId,
    username: session.user.username,
    user: session.user.name,
    role: session.user.role,
    sellerName: session.user.sellerName || "",
    deviceId: session.device && session.device.id || "",
    deviceLabel: session.device && session.device.label || "",
    ip: session.ip || "",
    status: session.presenceStatus || sessionStatus(session),
    route: String(input.route || input.routeId || input.context || "").trim(),
    lat: gps.lat,
    lng: gps.lng,
    accuracy: gps.accuracy,
    speed: gps.speed,
    heading: gps.heading,
    battery: gps.battery,
    online: gps.online,
    source: gps.source,
    provider: gps.provider,
    deviceAt: gps.deviceAt,
    serverAt: gps.serverAt
  };
  fs.appendFileSync(GPS_HISTORY_LOG, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function localHourFraction(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return NaN;
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

function gpsEntryTime(entry) {
  return entry && (entry.deviceAt || entry.serverAt || entry.at) || "";
}

function readGpsHistory(limit = 200, filters = {}) {
  ensureDataFiles();
  if (!fs.existsSync(GPS_HISTORY_LOG)) return [];
  const max = Math.min(100000, Math.max(1, Number(limit || 200)));
  const lines = fs.readFileSync(GPS_HISTORY_LOG, "utf8").split(/\r?\n/).filter(Boolean);
  const username = String(filters.username || "").trim().toLowerCase();
  const role = String(filters.role || "").trim().toLowerCase();
  const deviceId = String(filters.deviceId || "").trim().toLowerCase();
  const date = String(filters.date || "").trim();
  const startHour = Number(filters.startHour);
  const endHour = Number(filters.endHour);
  return lines.reverse().map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean)
    .filter((entry) => !username || String(entry.username || "").toLowerCase() === username)
    .filter((entry) => !role || String(entry.role || "").toLowerCase() === role)
    .filter((entry) => !deviceId || String(entry.deviceId || "").toLowerCase() === deviceId)
    .filter((entry) => !date || localDateKey(gpsEntryTime(entry)) === date)
    .filter((entry) => !Number.isFinite(startHour) || localHourFraction(gpsEntryTime(entry)) >= startHour)
    .filter((entry) => !Number.isFinite(endHour) || localHourFraction(gpsEntryTime(entry)) <= endHour)
    .slice(0, max);
}

function gpsDistanceMeters(a, b) {
  if (!a || !b) return 0;
  const aLat = Number(a.lat);
  const aLng = Number(a.lng);
  const bLat = Number(b.lat);
  const bLng = Number(b.lng);
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return 0;
  const rad = (degree) => degree * Math.PI / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const lat1 = rad(aLat);
  const lat2 = rad(bLat);
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function routeDistanceMeters(points) {
  return points.reduce((total, point, index) => {
    if (!index) return total;
    const segment = gpsDistanceMeters(points[index - 1], point);
    return total + (Number.isFinite(segment) && segment < 5000 ? segment : 0);
  }, 0);
}

function sampleRoutePoints(points, max = 160) {
  if (!Array.isArray(points) || points.length <= max) return points || [];
  const sampled = [];
  const step = (points.length - 1) / Math.max(1, max - 1);
  for (let index = 0; index < max; index += 1) {
    sampled.push(points[Math.round(index * step)]);
  }
  return sampled;
}

function googleMapsRouteUrl(points) {
  const valid = (points || []).filter((point) => Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)));
  if (!valid.length) return "";
  if (valid.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${valid[0].lat},${valid[0].lng}`)}`;
  }
  const sampled = sampleRoutePoints(valid, 10);
  const first = sampled[0];
  const last = sampled[sampled.length - 1];
  const middle = sampled.slice(1, -1).map((point) => `${point.lat},${point.lng}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: `${first.lat},${first.lng}`,
    destination: `${last.lat},${last.lng}`,
    travelmode: "driving"
  });
  if (middle) params.set("waypoints", middle);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildDailyGpsRoutes(filters = {}) {
  const config = readSessionConfig();
  const date = String(filters.date || localDateKey()).trim();
  const startHour = Number.isFinite(Number(filters.startHour)) ? Number(filters.startHour) : Number(config.workdayStartHour || 7);
  const endHour = Number.isFinite(Number(filters.endHour)) ? Number(filters.endHour) : Number(config.workdayEndHour || 22);
  const includePoints = filters.includePoints === true;
  const history = readGpsHistory(100000, {
    username: filters.username || "",
    role: filters.role || "",
    deviceId: filters.deviceId || "",
    date,
    startHour,
    endHour
  }).reverse();
  const grouped = new Map();
  history.forEach((entry) => {
    const role = String(entry.role || "").toLowerCase();
    if (!filters.role && !["seller", "driver"].includes(role)) return;
    const key = `${entry.username || "sin-usuario"}|${entry.deviceId || "sin-dispositivo"}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        username: entry.username || "",
        user: entry.user || entry.username || "",
        role: entry.role || "",
        sellerName: entry.sellerName || "",
        deviceId: entry.deviceId || "",
        deviceLabel: entry.deviceLabel || "",
        ip: entry.ip || "",
        route: entry.route || "",
        points: []
      });
    }
    grouped.get(key).points.push({
      at: entry.at || "",
      deviceAt: entry.deviceAt || "",
      serverAt: entry.serverAt || entry.at || "",
      lat: Number(entry.lat),
      lng: Number(entry.lng),
      accuracy: Number(entry.accuracy || 0),
      speed: Number.isFinite(Number(entry.speed)) ? Number(entry.speed) : null,
      heading: Number.isFinite(Number(entry.heading)) ? Number(entry.heading) : null,
      battery: Number.isFinite(Number(entry.battery)) ? Number(entry.battery) : null,
      online: entry.online !== false,
      source: entry.source || "gps",
      provider: entry.provider || ""
    });
  });
  const routes = Array.from(grouped.values()).map((route) => {
    const points = route.points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    const distanceMeters = Math.round(routeDistanceMeters(points));
    const accuracies = points.map((point) => Number(point.accuracy || 0)).filter((value) => value > 0);
    const batteries = points.map((point) => Number(point.battery)).filter(Number.isFinite);
    const first = points[0] || null;
    const last = points[points.length - 1] || null;
    return {
      ...route,
      points: includePoints ? points : sampleRoutePoints(points, 160),
      totalPoints: points.length,
      startedAt: first && (first.deviceAt || first.serverAt || first.at) || "",
      endedAt: last && (last.deviceAt || last.serverAt || last.at) || "",
      first,
      last,
      distanceMeters,
      distanceKm: Math.round(distanceMeters / 10) / 100,
      avgAccuracy: accuracies.length ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length) : 0,
      minBattery: batteries.length ? Math.min(...batteries) : null,
      maxBattery: batteries.length ? Math.max(...batteries) : null,
      mapsUrl: googleMapsRouteUrl(points)
    };
  }).sort((a, b) => String(a.user || a.username).localeCompare(String(b.user || b.username), "es"));
  return {
    ok: true,
    date,
    startHour,
    endHour,
    generatedAt: new Date().toISOString(),
    settings: config,
    routes,
    totals: {
      devices: routes.length,
      points: routes.reduce((sum, route) => sum + route.totalPoints, 0),
      distanceMeters: routes.reduce((sum, route) => sum + route.distanceMeters, 0)
    }
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function dailyGpsRoutesCsv(filters = {}) {
  const payload = buildDailyGpsRoutes({ ...filters, includePoints: true });
  const rows = [[
    "fecha",
    "usuario",
    "rol",
    "dispositivo",
    "hora_dispositivo",
    "hora_servidor",
    "latitud",
    "longitud",
    "precision_m",
    "velocidad",
    "bateria",
    "online",
    "ruta_contexto",
    "distancia_total_km",
    "maps"
  ]];
  payload.routes.forEach((route) => {
    route.points.forEach((point) => {
      rows.push([
        payload.date,
        route.user || route.username,
        route.role,
        route.deviceLabel || route.deviceId,
        point.deviceAt || "",
        point.serverAt || point.at || "",
        point.lat,
        point.lng,
        point.accuracy,
        point.speed ?? "",
        point.battery ?? "",
        point.online ? "online" : "offline",
        route.route || "",
        route.distanceKm,
        route.mapsUrl
      ]);
    });
  });
  return rows.map((row) => row.map(csvEscape).join(";")).join("\r\n");
}

function pruneGpsHistory(retentionDays = 30) {
  try {
    if (!fs.existsSync(GPS_HISTORY_LOG)) return;
    const cutoff = Date.now() - Math.max(1, Number(retentionDays || 30)) * 24 * 60 * 60 * 1000;
    const lines = fs.readFileSync(GPS_HISTORY_LOG, "utf8").split(/\r?\n/).filter(Boolean);
    if (lines.length < 50000 && fs.statSync(GPS_HISTORY_LOG).size < 24 * 1024 * 1024) return;
    const kept = lines.filter((line) => {
      try {
        const entry = JSON.parse(line);
        return new Date(entry.at || 0).getTime() >= cutoff;
      } catch {
        return false;
      }
    }).slice(-250000);
    fs.writeFileSync(GPS_HISTORY_LOG, kept.length ? `${kept.join("\n")}\n` : "", "utf8");
  } catch {
    // El historial no debe bloquear la operacion.
  }
}

function ensureRejectedGps(state) {
  if (!state || typeof state !== "object") return [];
  state.rejectedGps = Array.isArray(state.rejectedGps) ? state.rejectedGps : [];
  return state.rejectedGps;
}

function recordRejectedGps(req, session, input, normalizedGps, reason) {
  const payload = readStateFileCached();
  const state = payload.state || {};
  const publicUserValue = session ? session.user : null;
  const now = new Date().toISOString();
  const parts = auditLocalParts(now);
  const rejected = {
    id: `GPSR-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    at: now,
    date: parts.date,
    time: parts.time,
    user: publicUserValue ? publicUserValue.name : "",
    username: publicUserValue ? publicUserValue.username : "",
    role: publicUserValue ? publicUserValue.role : "",
    device: session ? session.device : normalizeDevice(input.device || {}, req),
    ip: clientIp(req),
    gps: normalizedGps,
    lat: normalizedGps ? normalizedGps.lat : null,
    lng: normalizedGps ? normalizedGps.lng : null,
    accuracy: normalizedGps ? normalizedGps.accuracy : null,
    source: normalizedGps ? normalizedGps.source : "",
    provider: normalizedGps ? normalizedGps.provider : "",
    reason
  };
  const rejectedGps = ensureRejectedGps(state);
  rejectedGps.unshift(rejected);
  state.rejectedGps = rejectedGps.slice(0, 500);
  const audit = auditEntry(req, publicUserValue, { ...input, gps: normalizedGps }, {
    action: "GPS_RECHAZADO",
    entityType: "gps",
    entityId: rejected.id,
    entityLabel: publicUserValue ? publicUserValue.name : "Dispositivo",
    previousValue: null,
    newValue: rejected,
    note: reason
  });
  appendGlobalAudit(state, audit);
  eventEngine.emitFromAuditEntries(state, audit);
  appendNotifications(state, notificationEntry(req, publicUserValue, { ...input, gps: normalizedGps }, {
    action: "GPS_RECHAZADO",
    category: "GPS",
    title: "Ubicacion no confiable o simulada",
    text: `${rejected.user || rejected.username || "Dispositivo"}: ${reason}`,
    tone: "danger",
    entityType: "gps",
    entityId: rejected.id,
    entityLabel: rejected.user || rejected.username || "GPS",
    audience: ["admin"]
  }));
  writeState(state);
  return rejected;
}

function cloneAuditValue(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value === null ? null : String(value);
  }
}

function auditLocalParts(value) {
  const date = new Date(value || Date.now());
  return {
    date: date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
    time: date.toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  };
}

function compactAuditValue(value) {
  const cloned = cloneAuditValue(value);
  if (!cloned || typeof cloned !== "object") return cloned;
  if (Array.isArray(cloned)) return cloned.slice(0, 40);
  const json = JSON.stringify(cloned);
  if (json.length <= 9000) return cloned;
  const summary = {};
  Object.keys(cloned).slice(0, 30).forEach((key) => {
    const item = cloned[key];
    if (item === null || ["string", "number", "boolean"].includes(typeof item)) summary[key] = item;
    else if (Array.isArray(item)) summary[key] = { type: "array", length: item.length };
    else summary[key] = { type: "object", keys: Object.keys(item || {}).slice(0, 12) };
  });
  summary._truncated = true;
  return summary;
}

function auditContext(req, user, input = {}) {
  const session = getSession(req);
  const gps = normalizeGps(input.gps || input.location || session && session.location || null);
  const device = session && session.device
    ? session.device
    : normalizeDevice(input.device || input, req);
  return {
    user: user && user.name || input.user || "Sistema",
    username: user && user.username || input.username || "",
    role: user && user.role || input.role || "",
    ip: clientIp(req),
    device: {
      id: device && device.id || "",
      label: device && device.label || "",
      model: device && device.model || "",
      os: device && device.os || "",
      appVersion: device && device.appVersion || ""
    },
    gps
  };
}

function auditEntry(req, user, input, details) {
  const at = new Date().toISOString();
  const parts = auditLocalParts(at);
  const context = auditContext(req, user, input);
  return {
    id: `AUDG-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    at,
    date: parts.date,
    time: parts.time,
    user: context.user,
    username: context.username,
    role: context.role,
    ip: context.ip,
    device: context.device,
    gps: context.gps,
    action: String(details.action || "ACCION"),
    entityType: String(details.entityType || ""),
    entityId: String(details.entityId || ""),
    entityLabel: String(details.entityLabel || ""),
    endpoint: String(req && req.url || ""),
    previousValue: compactAuditValue(details.previousValue),
    newValue: compactAuditValue(details.newValue),
    note: String(details.note || "")
  };
}

function ensureGlobalAudit(state) {
  if (!state || typeof state !== "object") return [];
  state.globalAudit = Array.isArray(state.globalAudit) ? state.globalAudit : [];
  return state.globalAudit;
}

function appendGlobalAudit(state, entries) {
  if (!state || typeof state !== "object") return state;
  const audit = ensureGlobalAudit(state);
  (Array.isArray(entries) ? entries : [entries]).filter(Boolean).forEach((entry) => {
    audit.unshift(entry);
  });
  return state;
}

function ensureNotifications(state) {
  if (!state || typeof state !== "object") return [];
  state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
  return state.notifications;
}

function notificationEntry(req, user, input = {}, details = {}) {
  const at = new Date().toISOString();
  const parts = auditLocalParts(at);
  const context = auditContext(req, user, input);
  const audience = Array.isArray(details.audience)
    ? details.audience
    : String(details.audience || "admin").split(",").map((item) => item.trim()).filter(Boolean);
  return {
    id: `NOTI-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    at,
    date: parts.date,
    time: parts.time,
    title: String(details.title || "Notificacion"),
    text: String(details.text || ""),
    tone: ["ok", "info", "warn", "danger"].includes(details.tone) ? details.tone : "info",
    category: String(details.category || "Sistema"),
    action: String(details.action || details.category || "NOTIFICACION"),
    entityType: String(details.entityType || ""),
    entityId: String(details.entityId || ""),
    entityLabel: String(details.entityLabel || ""),
    audience: audience.length ? audience : ["admin"],
    user: context.user,
    username: context.username,
    role: context.role,
    ip: context.ip,
    device: context.device,
    gps: context.gps,
    readBy: [],
    endpoint: String(req && req.url || "")
  };
}

function appendNotifications(state, entries) {
  if (!state || typeof state !== "object") return state;
  const notifications = ensureNotifications(state);
  (Array.isArray(entries) ? entries : [entries]).filter(Boolean).forEach((entry) => {
    notifications.unshift(entry);
  });
  state.notifications = notifications
    .filter((entry, index, list) => entry && entry.id && list.findIndex((item) => item.id === entry.id) === index)
    .slice(0, 1500);
  return state;
}

function stableAuditJson(value) {
  return JSON.stringify(value || null, (key, item) => {
    if (key === "globalAudit") return undefined;
    if (key === "notifications") return undefined;
    return item;
  });
}

function entitySnapshot(state, entityType, entityId) {
  if (!state) return null;
  const id = String(entityId || "");
  if (entityType === "pedido") return (state.orders || []).find((item) => item.code === id) || null;
  if (entityType === "cliente") return (state.clients || []).find((item) => item.codigo_cliente === id || item.name === id || item.nombre_comercial === id) || null;
  if (entityType === "producto") return (state.products || []).find((item) => item.codigo_producto === id || item.name === id || item.descripcion === id) || null;
  if (entityType === "ruta") return (state.deliveryRoutes || []).find((item) => item.id === id) || null;
  if (entityType === "transferencia") return (state.bankReconciliation || []).find((item) => item.id === id) || null;
  if (entityType === "lista-precios") return (state.priceLists || []).find((item) => item.id === id || item.name === id) || null;
  if (entityType === "configuracion") return state.deliverySettings || null;
  return null;
}

function appendOrderTraceEvent(state, orderCode, input = {}, details = {}) {
  if (!state || !orderCode) return null;
  const order = (state.orders || []).find((item) => String(item.code || "") === String(orderCode || ""));
  if (!order) return null;
  const at = new Date().toISOString();
  const parts = auditLocalParts(at);
  const actor = String(details.actor || details.user || input.user || "Sistema");
  const gps = normalizeGps(details.gps || input.gps || input.location || null);
  order.trace = Array.isArray(order.trace) ? order.trace : [];
  order.trace.push({
    status: String(details.status || order.status || orderEngine.STATUS.PENDING),
    at,
    date: parts.date,
    time: parts.time,
    actor,
    user: actor,
    gps,
    note: String(details.note || ""),
    action: String(details.action || "")
  });
  order.updatedAt = at;
  return order;
}

function collectionAuditDiff(req, user, input, beforeState, nextState) {
  const specs = [
    { key: "orders", type: "pedido", id: (item) => item.code, label: (item) => item.client || item.code, action: "SYNC_PEDIDO" },
    { key: "clients", type: "cliente", id: (item) => item.codigo_cliente || item.name, label: (item) => item.name || item.nombre_comercial, action: "SYNC_CLIENTE" },
    { key: "products", type: "producto", id: (item) => item.codigo_producto || item.name, label: (item) => item.name || item.descripcion, action: "SYNC_PRODUCTO" },
    { key: "accounts", type: "movimiento", id: (item, index) => item.id || `${item.date || ""}|${item.type || ""}|${item.account || ""}|${item.orderCode || ""}|${index}`, label: (item) => item.account || item.type, action: "SYNC_CUENTA" },
    { key: "stockMovements", type: "stock", id: (item, index) => item.id || `${item.type || ""}|${item.title || ""}|${index}`, label: (item) => item.title || item.type, action: "SYNC_STOCK" },
    { key: "physicalStockCounts", type: "inventario", id: (item, index) => item.id || `${item.productCode || ""}|${item.at || ""}|${index}`, label: (item) => item.productName || item.productCode, action: "SYNC_STOCK_FISICO_CONTEO" },
    { key: "physicalStockAdjustments", type: "inventario", id: (item, index) => item.id || `${item.productCode || ""}|${item.at || ""}|${index}`, label: (item) => item.productName || item.productCode, action: "SYNC_STOCK_FISICO_AJUSTE" },
    { key: "bankReconciliation", type: "transferencia", id: (item) => item.id, label: (item) => item.orderCode || item.client || item.id, action: "SYNC_TRANSFERENCIA" },
    { key: "deliveryRoutes", type: "ruta", id: (item) => item.id, label: (item) => item.zone || item.id, action: "SYNC_RUTA" },
    { key: "priceLists", type: "lista-precios", id: (item) => item.id, label: (item) => item.name || item.id, action: "SYNC_LISTA_PRECIOS" }
  ];
  const entries = [];
  specs.forEach((spec) => {
    const beforeItems = Array.isArray(beforeState && beforeState[spec.key]) ? beforeState[spec.key] : [];
    const nextItems = Array.isArray(nextState && nextState[spec.key]) ? nextState[spec.key] : [];
    const before = new Map(beforeItems.map((item, index) => [String(spec.id(item, index) || ""), item]).filter(([id]) => id));
    const after = new Map(nextItems.map((item, index) => [String(spec.id(item, index) || ""), item]).filter(([id]) => id));
    after.forEach((item, id) => {
      const previous = before.get(id) || null;
      if (previous && stableAuditJson(previous) === stableAuditJson(item)) return;
      entries.push(auditEntry(req, user, input, {
        action: previous ? `${spec.action}_MODIFICADO` : `${spec.action}_CREADO`,
        entityType: spec.type,
        entityId: id,
        entityLabel: spec.label(item),
        previousValue: previous,
        newValue: item,
        note: "Cambio sincronizado desde cliente web"
      }));
    });
    before.forEach((item, id) => {
      if (after.has(id)) return;
      entries.push(auditEntry(req, user, input, {
        action: `${spec.action}_QUITADO`,
        entityType: spec.type,
        entityId: id,
        entityLabel: spec.label(item),
        previousValue: item,
        newValue: null,
        note: "Elemento ausente en sincronizacion de estado"
      }));
    });
  });
  return entries;
}

function orderNotificationTone(order) {
  if (!order) return "info";
  if (order.priority === "Urgente" || order.status === orderEngine.STATUS.CANCELLED) return "danger";
  if (order.status === orderEngine.STATUS.PENDING || order.status === orderEngine.STATUS.PARTIAL_DELIVERED) return "warn";
  return "ok";
}

function orderStatusNotificationTitle(order, previousOrder) {
  if (!order) return "Pedido actualizado";
  if (order.status === orderEngine.STATUS.DISPATCHED) return `Pedido despachado ${order.code}`;
  if (order.status === orderEngine.STATUS.IN_ROUTE) return `Pedido en reparto ${order.code}`;
  if ([orderEngine.STATUS.DELIVERED, orderEngine.STATUS.COLLECTED, orderEngine.STATUS.CLOSED].includes(order.status)) return `Pedido entregado ${order.code}`;
  if (previousOrder && previousOrder.status !== order.status) return `Pedido cambio a ${order.status}`;
  return `Pedido actualizado ${order.code}`;
}

function orderStatusNotification(req, user, input, order, previousOrder, action = "PEDIDO_ESTADO") {
  return notificationEntry(req, user, input, {
    action,
    category: "Pedidos",
    title: orderStatusNotificationTitle(order, previousOrder),
    text: `${order.client || "Cliente"} - ${previousOrder && previousOrder.status ? `${previousOrder.status} -> ` : ""}${order.status || "sin estado"}.`,
    tone: orderNotificationTone(order),
    entityType: "pedido",
    entityId: order.code,
    entityLabel: order.client || order.code,
    audience: ["admin"]
  });
}

function collectionNotificationDiff(req, user, input, beforeState, nextState) {
  const beforeOrders = new Map((Array.isArray(beforeState && beforeState.orders) ? beforeState.orders : []).map((order) => [String(order.code || ""), order]).filter(([code]) => code));
  const nextOrders = Array.isArray(nextState && nextState.orders) ? nextState.orders : [];
  const entries = [];
  nextOrders.forEach((order) => {
    if (!order || !order.code) return;
    const previous = beforeOrders.get(order.code) || null;
    if (!previous) {
      entries.push(notificationEntry(req, user, input, {
        action: "PEDIDO_CREADO",
        category: "Pedidos",
        title: `Nuevo pedido ${order.code}`,
        text: `${order.seller || "Vendedor"} cargo ${order.client || "Cliente"} por ${order.amount || 0}.`,
        tone: orderNotificationTone(order),
        entityType: "pedido",
        entityId: order.code,
        entityLabel: order.client || order.code,
        audience: ["admin"]
      }));
      if (order.credit && order.credit.projectedBalance > order.credit.creditLimit) {
        entries.push(notificationEntry(req, user, input, {
          action: "CREDITO_LIMITE_SUPERADO",
          category: "Cuentas",
          title: `Limite de credito superado: ${order.client || order.code}`,
          text: `Pedido ${order.code}: proyectado ${order.credit.projectedBalance}, limite ${order.credit.creditLimit}.`,
          tone: "danger",
          entityType: "pedido",
          entityId: order.code,
          entityLabel: order.client || order.code,
          audience: ["admin"]
        }));
      }
      return;
    }
    if (previous.status !== order.status) {
      entries.push(orderStatusNotification(req, user, input, order, previous, order.status === orderEngine.STATUS.DISPATCHED ? "PEDIDO_DESPACHADO" : "PEDIDO_ESTADO"));
    } else if (stableAuditJson(previous) !== stableAuditJson(order)) {
      entries.push(notificationEntry(req, user, input, {
        action: "PEDIDO_MODIFICADO",
        category: "Pedidos",
        title: `Pedido modificado ${order.code}`,
        text: `${order.client || "Cliente"} fue actualizado desde sincronizacion.`,
        tone: "warn",
        entityType: "pedido",
        entityId: order.code,
        entityLabel: order.client || order.code,
        audience: ["admin"]
      }));
    }
  });
  return entries;
}

function normalizeDevice(input, req) {
  const userAgent = String(req.headers["user-agent"] || "");
  const fallback = crypto.createHash("sha1").update(`${userAgent}|${clientIp(req)}`).digest("hex").slice(0, 12);
  return {
    id: String(input && input.id || input && input.deviceId || fallback).trim() || fallback,
    label: String(input && input.label || input && input.deviceLabel || "").trim(),
    model: String(input && input.model || "").trim() || userAgent.slice(0, 90),
    os: String(input && input.os || "").trim() || "Web",
    appVersion: String(input && input.appVersion || "").trim() || "web",
    userAgent
  };
}

function presenceReferenceAt(session) {
  return session && (session.lastPresenceAt || session.lastHeartbeatAt || session.lastGpsAt || session.startedAt) || "";
}

function sessionStatus(session, config = readSessionConfig()) {
  if (!session || session.closedAt) return "Sin conexiÃ³n";
  const reference = new Date(presenceReferenceAt(session)).getTime();
  if (!Number.isFinite(reference) || Date.now() - reference > config.offlineAfterMs) return "Sin conexiÃ³n";
  return session.presenceStatus || (session.user.role === "driver" ? "En Reparto" : "Disponible");
}

function sessionMapTone(session, status, warning) {
  if (!session || normalizeSearchText(status) === "sin conexion") return "offline";
  if (!session.location) return "danger";
  if (warning) return "warn";
  const gpsAt = new Date(session.lastGpsAt || session.location.updatedAt || 0).getTime();
  if (!Number.isFinite(gpsAt)) return "warn";
  if (Date.now() - gpsAt > Math.min(readSessionConfig().offlineAfterMs, 60000)) return "stale";
  return "ok";
}

function publicSession(session) {
  const config = readSessionConfig();
  const warning = gpsWarning(session.location);
  const status = sessionStatus(session, config);
  const online = normalizeSearchText(status) !== "sin conexion";
  return {
    sessionId: session.sessionId,
    username: session.user.username,
    user: session.user,
    name: session.user.name,
    role: session.user.role,
    sellerName: session.user.sellerName || null,
    device: session.device,
    ip: session.ip,
    startedAt: session.startedAt,
    lastSeenAt: session.lastSeenAt,
    lastHeartbeatAt: session.lastHeartbeatAt || "",
    lastPresenceAt: presenceReferenceAt(session),
    lastSyncAt: session.lastSyncAt || session.lastSeenAt,
    lastGpsAt: session.lastGpsAt || "",
    connectedMs: Math.max(0, Date.now() - new Date(session.startedAt).getTime()),
    status,
    online,
    roleGroup: session.user.role === "driver" ? "reparto" : session.user.role === "seller" ? "ventas" : "admin",
    location: session.location || null,
    gpsAgeMs: session.location ? Math.max(0, Date.now() - new Date(session.lastGpsAt || session.location.updatedAt || 0).getTime()) : null,
    mapTone: sessionMapTone(session, status, warning),
    gpsWarning: warning
  };
}

function publicSessions(options = {}) {
  cleanupExpiredSessions();
  const activeOnly = options.activeOnly !== false;
  return Array.from(sessions.values())
    .map(publicSession)
    .filter((session) => !activeOnly || session.online)
    .sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
}

function rememberPresenceHistory(session, action, note = "") {
  if (!session) return;
  recentPresenceHistory.unshift({
    ...publicSession(session),
    historyAction: action || "",
    historyNote: note || "",
    historyAt: new Date().toISOString()
  });
  recentPresenceHistory.splice(80);
}

function publicPresenceHistory(limit = 50) {
  cleanupExpiredSessions();
  const offlineOpen = Array.from(sessions.values())
    .map(publicSession)
    .filter((session) => !session.online)
    .map((session) => ({ ...session, historyAction: "OFFLINE", historyAt: session.lastPresenceAt || session.lastSeenAt }));
  const byKey = new Map([...offlineOpen, ...recentPresenceHistory].map((session) => [`${session.sessionId}:${session.historyAction || session.status}`, session]));
  return Array.from(byKey.values())
    .sort((a, b) => new Date(b.historyAt || b.lastSeenAt || 0) - new Date(a.historyAt || a.lastSeenAt || 0))
    .slice(0, Math.min(100, Math.max(1, Number(limit || 50))));
}

function closeSession(token, reason, actor) {
  const session = sessions.get(token);
  if (!session) return null;
  session.closedAt = new Date().toISOString();
  session.closeReason = reason || "closed";
  writeSessionAudit("SESSION_CLOSED", session, { note: `${reason || "closed"}${actor ? ` por ${actor}` : ""}` });
  rememberPresenceHistory(session, "SESSION_CLOSED", reason || "closed");
  sessions.delete(token);
  return session;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  Array.from(sessions.entries()).forEach(([token, session]) => {
    if (!session || session.expiresAt < now) {
      closeSession(token, "expired", "Sistema");
    }
  });
}

function activeSessionsForUsername(username) {
  cleanupExpiredSessions();
  const normalized = String(username || "").toLowerCase();
  return Array.from(sessions.entries())
    .filter(([, session]) => session.user.username.toLowerCase() === normalized)
    .map(([token, session]) => ({ token, session }));
}

function getSession(req) {
  const token = cookieValue(req, "dl_session");
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) closeSession(token, "expired", "Sistema");
    return null;
  }
  session.expiresAt = Date.now() + sessionTtlMs();
  session.lastSeenAt = new Date().toISOString();
  session.ip = clientIp(req);
  return session;
}

function getSessionUser(req) {
  const session = getSession(req);
  if (!session) return null;
  return session.user;
}

function requireUser(req, res) {
  const user = getSessionUser(req);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
    return null;
  }
  return user;
}

function publicSecurityStatus(status, includeDetails = false) {
  const license = status && status.license || {};
  const integrity = status && status.integrity || {};
  const publicLicense = license.license || null;
  return {
    ok: Boolean(status && status.allowed),
    checkedAt: status && status.checkedAt || "",
    version: status && status.version || APP_RUNTIME_VERSION,
    license: {
      ok: Boolean(license.allowed),
      code: license.code || "",
      message: license.message || "",
      client: publicLicense && publicLicense.client || "",
      installation: publicLicense && publicLicense.installation || "",
      licenseId: publicLicense && publicLicense.licenseId || "",
      issuedAt: publicLicense && publicLicense.issuedAt || "",
      activatedAt: publicLicense && publicLicense.activatedAt || "",
      expiresAt: publicLicense && publicLicense.expiresAt || "",
      modules: publicLicense && publicLicense.modules || [],
      version: publicLicense && publicLicense.version || "",
      versionPattern: publicLicense && publicLicense.versionPattern || ""
    },
    integrity: {
      ok: Boolean(integrity.ok),
      code: integrity.code || "",
      message: integrity.message || "",
      checked: integrity.checked || 0,
      changed: includeDetails ? integrity.changed || [] : (integrity.changed || []).length,
      missing: includeDetails ? integrity.missing || [] : (integrity.missing || []).length,
      generatedAt: integrity.generatedAt || ""
    },
    enforcement: status && status.enforcement || {},
    fingerprint: includeDetails ? license.fingerprint || "" : "",
    maskedSignals: includeDetails ? license.maskedSignals || {} : {},
    componentKeys: includeDetails ? license.componentKeys || [] : [],
    events: includeDetails ? license.events || securityEngine.recentAudit(20) : []
  };
}

function readJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { version: 0, state: null };
  }
}

let stateCache = {
  mtimeMs: 0,
  payload: null
};

function readStateFileCached() {
  try {
    const stat = fs.statSync(STATE_FILE);
    if (stateCache.payload && stateCache.mtimeMs === stat.mtimeMs) {
      return stateCache.payload;
    }
    const payload = readJsonFile(STATE_FILE);
    stateCache = {
      mtimeMs: stat.mtimeMs,
      payload
    };
    return payload;
  } catch {
    return { version: 0, state: null };
  }
}

function readStateVersionFast() {
  try {
    const fd = fs.openSync(STATE_FILE, "r");
    try {
      const buffer = Buffer.alloc(256);
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
      const head = buffer.toString("utf8", 0, bytes);
      const match = head.match(/"version"\s*:\s*(\d+)/);
      return match ? Number(match[1]) : 0;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return 0;
  }
}

function writeState(state) {
  if (state && typeof state === "object") {
    ensureGlobalAudit(state);
    ensureNotifications(state);
    ensureRejectedGps(state);
    orderEngine.migrateState(state);
    deliveryEngine.migrateState(state);
    accountEngine.migrateState(state);
    eventEngine.migrateState(state);
    legalEngine.migrateState(state);
    syncMixedEntityRelations(state);
    ensureRouteLearningState(state);
    ensurePrintState(state);
    ensurePriceListsState(state);
    applyDuePriceLists(state);
  }
  const payload = {
    version: Date.now(),
    state: sanitizeState(state)
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(payload), "utf8");
  try {
    stateCache = {
      mtimeMs: fs.statSync(STATE_FILE).mtimeMs,
      payload
    };
  } catch {
    stateCache = {
      mtimeMs: Date.now(),
      payload
    };
  }
  return payload.version;
}

function writeStateResponse(res, state, extra, auditEntries, notificationEntries, userForState = null) {
  const auditList = (Array.isArray(auditEntries) ? auditEntries : [auditEntries]).filter(Boolean);
  const notificationList = (Array.isArray(notificationEntries) ? notificationEntries : [notificationEntries]).filter(Boolean);
  if (auditList.length) {
    appendGlobalAudit(state, auditList);
    eventEngine.emitFromAuditEntries(state, auditList);
  }
  if (notificationList.length) {
    appendNotifications(state, notificationList);
    eventEngine.emitFromNotificationEntries(state, notificationList);
  }
  ensureRejectedGps(state);
  const version = writeState(state);
  sendJson(res, 200, { ok: true, version, state: stateForUser(state, userForState), ...(extra || {}) });
}

function writeCompactStateResponse(res, state, extra, auditEntries, notificationEntries) {
  const auditList = (Array.isArray(auditEntries) ? auditEntries : [auditEntries]).filter(Boolean);
  const notificationList = (Array.isArray(notificationEntries) ? notificationEntries : [notificationEntries]).filter(Boolean);
  if (auditList.length) {
    appendGlobalAudit(state, auditList);
    eventEngine.emitFromAuditEntries(state, auditList);
  }
  if (notificationList.length) {
    appendNotifications(state, notificationList);
    eventEngine.emitFromNotificationEntries(state, notificationList);
  }
  ensureRejectedGps(state);
  const version = writeState(state);
  sendJson(res, 200, { ok: true, version, compact: true, ...(extra || {}) });
}

function appendAuditToStateFile(req, user, input, details) {
  const payload = readStateFileCached();
  const state = payload.state || {};
  const entry = auditEntry(req, user, input, details);
  appendGlobalAudit(state, entry);
  eventEngine.emitFromAuditEntries(state, entry);
  writeState(state);
}

function appendNotificationToStateFile(req, user, input, details) {
  const payload = readStateFileCached();
  const state = payload.state || {};
  const entry = notificationEntry(req, user, input, details);
  appendNotifications(state, entry);
  eventEngine.emitFromNotificationEntries(state, entry);
  writeState(state);
}

function requireDeliveryUser(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (!["admin", "driver"].includes(user.role)) {
    sendJson(res, 403, { ok: false, error: "Operacion permitida solo para reparto o administracion." });
    return null;
  }
  return user;
}

function deliveryContext(user, input) {
  return {
    user: user.name,
    username: user.username,
    role: user.role,
    deviceId: String(input.deviceId || ""),
    deviceLabel: String(input.deviceLabel || user.name || "Dispositivo reparto"),
    gps: input.gps || null,
    note: input.note || ""
  };
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "";
}

function saveDeliveryUpload(input, user) {
  ensureDataFiles();
  const match = String(input.dataUrl || "").match(/^data:(image\/png|image\/jpeg|image\/jpg|image\/webp|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("El adjunto debe ser PNG, JPG, WEBP o PDF valido.");
  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  const maxBytes = mimeType === "application/pdf" ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
  if (!buffer.length || buffer.length > maxBytes) {
    throw new Error(mimeType === "application/pdf" ? "El PDF debe pesar menos de 8 MB." : "La imagen debe pesar menos de 5 MB.");
  }
  const extension = mimeType === "application/pdf" ? "pdf" : (mimeType === "image/png" ? "png" : (mimeType === "image/webp" ? "webp" : "jpg"));
  const kind = String(input.kind || "evidence").replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || "evidence";
  const orderCode = String(input.orderCode || "pedido").replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "pedido";
  const filename = `${Date.now()}-${orderCode}-${kind}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return {
    kind,
    filename,
    url: `/api/uploads/${encodeURIComponent(filename)}`,
    size: buffer.length,
    mimeType,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user.username
  };
}

function saveSupplierUpload(input, user) {
  ensureDataFiles();
  if (!input.dataUrl) return null;
  const match = String(input.dataUrl || "").match(/^data:(image\/png|image\/jpeg|image\/jpg|image\/webp|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("El remito adjunto debe ser PNG, JPG, WEBP o PDF valido.");
  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  const maxBytes = mimeType === "application/pdf" ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
  if (!buffer.length || buffer.length > maxBytes) {
    throw new Error(mimeType === "application/pdf" ? "El PDF del remito debe pesar menos de 8 MB." : "La imagen del remito debe pesar menos de 5 MB.");
  }
  const extension = mimeType === "application/pdf" ? "pdf" : (mimeType === "image/png" ? "png" : (mimeType === "image/webp" ? "webp" : "jpg"));
  const kind = String(input.kind || "supplier-remit").replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || "supplier-remit";
  const supplier = String(input.supplier || "proveedor").replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "proveedor";
  const remit = String(input.remitNumber || input.reference || "remito").replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "remito";
  const filename = `${Date.now()}-${supplier}-${kind}-${remit}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  fs.writeFileSync(path.join(SUPPLIER_UPLOAD_DIR, filename), buffer);
  return {
    kind,
    filename,
    url: `/api/supplier-uploads/${encodeURIComponent(filename)}`,
    size: buffer.length,
    mimeType,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user.username
  };
}

function normalizeSupplierServerRecord(supplier) {
  const name = String(supplier.razon_social || supplier.name || supplier.nombre_comercial || supplier.nombre || "").trim();
  const balance = Math.max(0, numeric(supplier.balance ?? supplier.saldo_pendiente, 0));
  const paid = Math.max(0, numeric(supplier.totalPaid ?? supplier.total_pagado, 0));
  const purchased = Math.max(balance + paid, numeric(supplier.totalPurchased ?? supplier.total_comprado, balance + paid));
  const commercialName = String(supplier.nombre_comercial || supplier.commercialName || supplier.nombre || name).trim();
  return {
    ...supplier,
    name,
    razon_social: name,
    nombre_comercial: commercialName,
    cuit: String(supplier.cuit || "").trim(),
    direccion: String(supplier.direccion || supplier.address || "").trim(),
    localidad: String(supplier.localidad || supplier.city || "").trim(),
    provincia: String(supplier.provincia || supplier.state || "").trim(),
    telefono: String(supplier.telefono || supplier.phone || "").trim(),
    whatsapp: String(supplier.whatsapp || supplier.whatsApp || supplier.telefono || supplier.phone || "").trim(),
    email: String(supplier.email || supplier.contact || "").trim(),
    contact: String(supplier.contact || supplier.contacto_principal || supplier.email || supplier.telefono || "").trim(),
    contacto_principal: String(supplier.contacto_principal || supplier.contact || "").trim(),
    condicion_pago: String(supplier.condicion_pago || supplier.paymentCondition || "Cuenta corriente").trim(),
    datos_bancarios: supplier.datos_bancarios || supplier.bankData || supplier.bank || "",
    observaciones: String(supplier.observaciones || "").trim(),
    sector: String(supplier.sector || supplier.rubro || "Sin rubro").trim(),
    estado_operativo: String(supplier.estado_operativo || supplier.estadoProveedor || supplier.estado || "Activo").trim() || "Activo",
    balance,
    saldo_pendiente: balance,
    totalPurchased: purchased,
    total_comprado: purchased,
    totalPaid: paid,
    total_pagado: paid,
    overdueDebt: Math.max(0, numeric(supplier.overdueDebt ?? supplier.deuda_vencida, 0)),
    due: String(supplier.due || supplier.proximo_vencimiento || "-").trim(),
    status: String(supplier.status || supplier.estado || (balance > 0 ? "A pagar" : "Al dia")).trim(),
    movements: Array.isArray(supplier.movements) ? supplier.movements : []
  };
}

function normalizeSupplierCreateInput(input) {
  const razonSocial = String(input.razon_social || input.razonSocial || input.name || input.nombre || "").trim();
  if (!razonSocial) throw new Error("Indicar razon social del proveedor.");
  return normalizeSupplierServerRecord({
    razon_social: razonSocial,
    name: razonSocial,
    nombre_comercial: String(input.nombre_comercial || input.commercialName || input.nombreComercial || razonSocial).trim(),
    cuit: String(input.cuit || "").trim(),
    direccion: String(input.direccion || input.address || "").trim(),
    localidad: String(input.localidad || input.city || "").trim(),
    provincia: String(input.provincia || input.state || "").trim(),
    telefono: String(input.telefono || input.phone || "").trim(),
    whatsapp: String(input.whatsapp || input.whatsApp || input.telefono || input.phone || "").trim(),
    email: String(input.email || "").trim(),
    contacto_principal: String(input.contacto_principal || input.contact || input.contacto || "").trim(),
    contact: String(input.contacto_principal || input.contact || input.contacto || input.email || input.telefono || "").trim(),
    condicion_pago: String(input.condicion_pago || input.paymentCondition || "Cuenta corriente").trim(),
    datos_bancarios: input.datos_bancarios || input.bankData || "",
    observaciones: String(input.observaciones || input.notes || "").trim(),
    sector: String(input.sector || input.rubro || "Sin rubro").trim(),
    estado_operativo: String(input.estado_operativo || input.estado || "Activo").trim() || "Activo",
    status: "Al dia",
    balance: 0,
    totalPaid: 0,
    totalPurchased: 0,
    movements: []
  });
}

function supplierDuplicateCandidates(state, supplier) {
  const suppliers = Array.isArray(state.suppliers) ? state.suppliers.map(normalizeSupplierServerRecord) : [];
  const cuit = taxIdKey(supplier.cuit);
  const reason = normalizeSearchText(supplier.razon_social || supplier.name);
  const commercial = normalizeSearchText(supplier.nombre_comercial);
  return suppliers.filter((item) => {
    const itemCuit = taxIdKey(item.cuit);
    if (cuit && itemCuit && cuit === itemCuit) return true;
    const itemReason = normalizeSearchText(item.razon_social || item.name);
    const itemCommercial = normalizeSearchText(item.nombre_comercial);
    return Boolean((reason && (itemReason === reason || itemCommercial === reason))
      || (commercial && (itemReason === commercial || itemCommercial === commercial)));
  });
}

function nextProductCode(state, offset = 0) {
  const numericCodes = (Array.isArray(state.products) ? state.products : [])
    .map((product) => String(product.codigo_producto || product.code || "").trim())
    .map((code) => (/^\d+$/.test(code) ? Number(code) : 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (numericCodes.length) {
    return String(Math.max(...numericCodes) + 1 + offset);
  }
  return `NP${Date.now().toString().slice(-8)}${offset ? `-${offset}` : ""}`;
}

function productDuplicateCandidates(state, reference) {
  const products = Array.isArray(state.products) ? state.products : [];
  const code = String(reference.productCode || reference.codigo_producto || reference.code || "").trim();
  const barcode = String(reference.barcode || reference.codigo_barras || "").trim();
  const name = normalizeSearchText(reference.name || reference.product || reference.descripcion);
  const brand = normalizeSearchText(reference.marca || reference.brand);
  const category = normalizeSearchText(reference.rubro || reference.category || reference.categoria);
  const presentation = [
    numeric(reference.unitsPerBlister ?? reference.unidades_por_blister, 0),
    numeric(reference.blistersPerBox ?? reference.blisters_por_caja, 0),
    numeric(reference.unitsPerBox ?? reference.unidades_por_caja, 0)
  ].join("|");
  return products.filter((product) => {
    if (code && sameText(product.codigo_producto || product.code, code)) return true;
    if (barcode && sameText(product.codigo_barras, barcode)) return true;
    const productName = normalizeSearchText(product.name || product.descripcion);
    const productBrand = normalizeSearchText(product.marca || product.brand);
    const productCategory = normalizeSearchText(product.rubro || product.category || product.categoria);
    const productPresentation = [
      numeric(product.unitsPerBlister ?? product.unidades_por_blister, 0),
      numeric(product.blistersPerBox ?? product.blisters_por_caja, 0),
      numeric(product.unitsPerBox ?? product.unidades_por_caja, 0)
    ].join("|");
    return Boolean(name && productName === name && (!brand || productBrand === brand) && (!category || productCategory === category) && productPresentation === presentation);
  }).slice(0, 5);
}

function normalizeNewRemitProduct(state, item, input, index = 0) {
  const source = item.newProduct && typeof item.newProduct === "object" ? item.newProduct : item;
  const name = String(source.name || source.descripcion || source.product || "").trim();
  if (!name) throw new Error("Indicar descripcion del producto nuevo.");
  const code = String(source.productCode || source.codigo_producto || source.code || "").trim() || nextProductCode(state, index);
  const unitsPerBlister = Math.max(0, numeric(source.unitsPerBlister ?? source.unidades_por_blister, 0));
  const blistersPerBox = Math.max(0, numeric(source.blistersPerBox ?? source.blisters_por_caja, 0));
  const boxesReceived = Math.max(0, numeric(source.boxesReceived ?? source.cajas_recibidas ?? item.boxesReceived, 0));
  const unitsPerBox = Math.max(0, numeric(source.unitsPerBox ?? source.unidades_por_caja, unitsPerBlister && blistersPerBox ? unitsPerBlister * blistersPerBox : 0));
  const totalUnitsReceived = Math.max(0, numeric(source.totalUnitsReceived ?? source.total_unidades_recibidas, unitsPerBox && boxesReceived ? unitsPerBox * boxesReceived : 0));
  return {
    productCode: code,
    codigo_producto: code,
    barcode: String(source.barcode || source.codigo_barras || "").trim(),
    codigo_barras: String(source.barcode || source.codigo_barras || "").trim(),
    name,
    descripcion: name,
    marca: String(source.marca || source.brand || "S/D").trim() || "S/D",
    rubro: String(source.rubro || source.categoria || source.category || "S/D").trim() || "S/D",
    categoria: String(source.categoria || source.rubro || source.category || "S/D").trim() || "S/D",
    proveedor: String(source.proveedor || input.supplier || "").trim(),
    unidad_venta: String(source.unidad_venta || source.unit || source.unidad || "unidad").trim() || "unidad",
    unitsPerBlister,
    blistersPerBox,
    boxesReceived,
    unitsPerBox,
    totalUnitsReceived,
    forceNewProduct: item.forceNewProduct === true || source.forceNewProduct === true,
    photoDataUrl: String(source.photoDataUrl || source.photo_data_url || "").trim(),
    photoUpload: source.photoUpload || null
  };
}

function pendingProductFromRemitLine(line, sessionUser, at) {
  const product = line.newProduct || {};
  const parts = auditLocalParts(at);
  return {
    codigo_producto: line.productCode || product.productCode,
    code: line.productCode || product.productCode,
    codigo_barras: line.barcode || product.barcode || "",
    name: line.name,
    descripcion: line.name,
    rubro: product.rubro || line.category || "S/D",
    categoria: product.categoria || product.rubro || line.category || "S/D",
    familia: product.rubro || line.category || "S/D",
    marca: product.marca || "S/D",
    proveedor: line.supplier || product.proveedor || "",
    unidad_venta: product.unidad_venta || line.unit || "unidad",
    unitsPerBlister: product.unitsPerBlister || 0,
    blistersPerBox: product.blistersPerBox || 0,
    boxesReceived: product.boxesReceived || 0,
    unitsPerBox: product.unitsPerBox || 0,
    totalUnitsReceived: product.totalUnitsReceived || line.stockQty || 0,
    photoUpload: product.photoUpload || null,
    stock_fisico: 0,
    stock_actual: 0,
    stock: 0,
    stock_reservado: 0,
    stock_disponible: 0,
    stock_en_transito: 0,
    stock_minimo: 0,
    costo: 0,
    cost: 0,
    margen: 0,
    precio_lista_1: 0,
    precio_lista_2: 0,
    precio_lista_3: 0,
    precio_lista_4: 0,
    precio_lista_5: 0,
    price: 0,
    activo: "NO",
    estado: "Pendiente de validacion",
    pendingValidation: true,
    pendingRemitId: line.remitId || "",
    pendingRemitNumber: line.remitNumber || "",
    origen: "remito-proveedor",
    createdAt: at,
    createdDate: parts.date,
    createdTime: parts.time,
    createdBy: sessionUser.name,
    createdByUsername: sessionUser.username
  };
}

function validationForRemitLine(lineValidations, line, index) {
  const code = normalizeSearchText(line.productCode || line.codigo_producto || "");
  const barcode = normalizeSearchText(line.barcode || line.codigo_barras || "");
  const name = normalizeSearchText(line.name || line.product || "");
  return lineValidations.find((item) => {
    const itemCode = normalizeSearchText(item.productCode || item.codigo_producto || "");
    const itemBarcode = normalizeSearchText(item.barcode || item.codigo_barras || "");
    const itemName = normalizeSearchText(item.name || item.product || "");
    return (item.index === index)
      || (code && itemCode === code)
      || (barcode && itemBarcode === barcode)
      || (name && itemName === name);
  }) || {};
}

function applyValidatedPricing(product, validation, sessionUser, at) {
  const previous = cloneAuditValue(product);
  const cost = Math.max(0, numeric(validation.cost ?? validation.costo ?? product.costo ?? product.cost, 0));
  if (cost <= 0) throw new Error(`Indicar costo valido para ${product.name || product.descripcion}.`);
  product.costo = cost;
  product.cost = cost;
  const listInput = validation.priceLists || validation.lists || {};
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const row = Array.isArray(listInput)
      ? listInput.find((item) => Number(item.listNumber || item.number || item.lista) === number)
      : listInput[number] || listInput[`lista_${number}`] || listInput[`precio_lista_${number}`] || {};
    const pct = Math.max(0, numeric(row.marginPct ?? row.pct ?? row.percent ?? row.porcentaje, 0));
    const rawPrice = Math.max(0, numeric(row.price ?? row.precio ?? row.value, 0));
    const price = rawPrice > 0 ? rawPrice : cost * (1 + pct / 100);
    product[`precio_lista_${number}`] = Math.round(price * 100) / 100;
    product[`margen_lista_${number}`] = Math.round((cost > 0 ? ((product[`precio_lista_${number}`] / cost) - 1) * 100 : pct) * 100) / 100;
  });
  product.margen = product.margen_lista_2 || 0;
  product.price = product.precio_lista_2 || product.precio_lista_1 || 0;
  product.priceListId = "PL-L2";
  product.priceListName = "Lista Nº 2";
  product.activo = "SI";
  product.estado = "Activo";
  product.pendingValidation = false;
  product.validatedAt = at;
  product.validatedBy = sessionUser.name;
  product.priceUpdatedAt = at;
  product.priceUpdatedBy = sessionUser.name;
  return previous;
}

function taxIdKey(value) {
  return String(value || "").replace(/\D/g, "");
}

function mixedEntityKey(record) {
  const taxId = taxIdKey(record && record.cuit);
  if (taxId.length >= 7) return `cuit:${taxId}`;
  const name = normalizeSearchText(record && (record.razon_social || record.name || record.nombre_comercial || record.nombre));
  return name ? `nombre:${name}` : "";
}

function sharedEntityName(record) {
  return String(record && (record.razon_social || record.name || record.nombre_comercial || record.nombre) || "").trim();
}

function ensureRouteLearningState(state) {
  state.routeLearning = state.routeLearning && typeof state.routeLearning === "object" ? state.routeLearning : {};
  state.routeLearning.visits = Array.isArray(state.routeLearning.visits) ? state.routeLearning.visits : [];
  state.routeLearning.clientStats = Array.isArray(state.routeLearning.clientStats) ? state.routeLearning.clientStats : [];
  state.routeLearning.recommendations = Array.isArray(state.routeLearning.recommendations) ? state.routeLearning.recommendations : [];
  return state.routeLearning;
}

function ensurePrintState(state) {
  state.printSettings = state.printSettings && typeof state.printSettings === "object" ? state.printSettings : {};
  state.printSettings.assembly = state.printSettings.assembly && typeof state.printSettings.assembly === "object"
    ? state.printSettings.assembly
    : {};
  state.printAudit = Array.isArray(state.printAudit) ? state.printAudit : [];
  return state.printSettings;
}

function syncMixedEntityRelations(state) {
  state.clients = Array.isArray(state.clients) ? state.clients : [];
  state.suppliers = Array.isArray(state.suppliers) ? state.suppliers.map(normalizeSupplierServerRecord) : [];
  const relations = new Map();
  const ensure = (key, label) => {
    if (!relations.has(key)) {
      relations.set(key, {
        key,
        name: label || "Entidad sin nombre",
        cuit: "",
        domicilio: "",
        telefono: "",
        email: "",
        clientId: "",
        clientName: "",
        supplierName: "",
        clientBalance: 0,
        supplierBalance: 0,
        salesTotal: 0,
        purchasesTotal: 0,
        roles: [],
        updatedAt: new Date().toISOString()
      });
    }
    return relations.get(key);
  };

  state.clients.forEach((client) => {
    const key = mixedEntityKey(client);
    if (!key) return;
    const entity = ensure(key, sharedEntityName(client));
    entity.name = sharedEntityName(client) || entity.name;
    entity.cuit = client.cuit || entity.cuit;
    entity.domicilio = client.domicilio || entity.domicilio;
    entity.telefono = client.telefono || entity.telefono;
    entity.email = client.email || entity.email;
    entity.clientId = client.codigo_cliente || client.name || entity.clientId;
    entity.clientName = client.name || client.nombre_comercial || entity.clientName;
    entity.clientBalance = numeric(client.balance ?? client.saldo_inicial, 0);
  });

  state.suppliers.forEach((supplier) => {
    const key = mixedEntityKey(supplier);
    if (!key) return;
    const entity = ensure(key, sharedEntityName(supplier));
    entity.name = entity.name || sharedEntityName(supplier);
    entity.cuit = entity.cuit || supplier.cuit;
    entity.domicilio = entity.domicilio || supplier.direccion;
    entity.telefono = entity.telefono || supplier.telefono;
    entity.email = entity.email || supplier.email;
    entity.supplierName = supplier.name || supplier.razon_social || entity.supplierName;
    entity.supplierBalance = numeric(supplier.balance, 0);
    entity.purchasesTotal = numeric(supplier.totalPurchased, 0);
  });

  relations.forEach((entity) => {
    if (!entity.clientName || !entity.supplierName) return;
    const client = state.clients.find((item) => sameText(item.name || item.nombre_comercial, entity.clientName));
    const supplier = state.suppliers.find((item) => sameText(item.name || item.razon_social, entity.supplierName));
    if (client && supplier) {
      if (!client.cuit && supplier.cuit) client.cuit = supplier.cuit;
      if (!supplier.cuit && client.cuit) supplier.cuit = client.cuit;
      if (!client.domicilio && supplier.direccion) client.domicilio = supplier.direccion;
      if (!supplier.direccion && client.domicilio) supplier.direccion = client.domicilio;
      if (!client.telefono && supplier.telefono) client.telefono = supplier.telefono;
      if (!supplier.telefono && client.telefono) supplier.telefono = client.telefono;
      if (!client.email && supplier.email) client.email = supplier.email;
      if (!supplier.email && client.email) supplier.email = client.email;
      if (!client.razon_social && supplier.razon_social) client.razon_social = supplier.razon_social;
      if (!supplier.razon_social && client.razon_social) supplier.razon_social = client.razon_social;
    }
    entity.roles = ["Cliente", "Proveedor"];
    entity.salesTotal = (state.orders || [])
      .filter((order) => sameText(order.client, entity.clientName))
      .reduce((total, order) => total + numeric(order.amount, 0), 0);
  });

  state.entityRelations = Array.from(relations.values())
    .filter((entity) => entity.clientName && entity.supplierName)
    .sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
  return state.entityRelations;
}

function supplierStatusFromBalance(balance) {
  return numeric(balance, 0) > 0 ? "A pagar" : "Al dia";
}

function findProductByRemitItem(state, item) {
  const products = Array.isArray(state.products) ? state.products : [];
  const code = String(item.productCode || item.codigo_producto || item.code || "").trim();
  const barcode = String(item.barcode || item.codigo_barras || "").trim();
  const name = String(item.name || item.product || item.descripcion || "").trim();
  if (code) {
    const byCode = products.find((product) => sameText(product.codigo_producto, code) || sameText(product.code, code));
    if (byCode) return byCode;
  }
  if (barcode) {
    const byBarcode = products.find((product) => sameText(product.codigo_barras, barcode));
    if (byBarcode) return byBarcode;
  }
  if (name) {
    return products.find((product) => sameText(product.name, name) || sameText(product.descripcion, name)) || null;
  }
  return null;
}

function normalizeSupplierRemitItems(state, input) {
  const structured = Array.isArray(input.items) ? input.items : [];
  if (structured.length) {
    return structured.map((item, index) => {
      const isNewProduct = Boolean(item.isNewProduct || item.newProduct);
      const newProduct = isNewProduct ? normalizeNewRemitProduct(state, item, input, index) : null;
      const product = isNewProduct ? null : findProductByRemitItem(state, item);
      const qty = Math.max(0, numeric(item.qty ?? item.cantidad, 0));
      const unitsPerBlister = Math.max(0, numeric(item.unitsPerBlister ?? item.unidades_por_blister ?? (newProduct && newProduct.unitsPerBlister), 0));
      const blistersPerBox = Math.max(0, numeric(item.blistersPerBox ?? item.blisters_por_caja ?? (newProduct && newProduct.blistersPerBox), 0));
      const boxesReceived = Math.max(0, numeric(item.boxesReceived ?? item.cajas_recibidas ?? (newProduct && newProduct.boxesReceived), 0));
      const unitsPerBox = Math.max(0, numeric(item.unitsPerBox ?? item.unidades_por_caja ?? (newProduct && newProduct.unitsPerBox), unitsPerBlister && blistersPerBox ? unitsPerBlister * blistersPerBox : 0));
      const calculatedTotalUnits = unitsPerBox && boxesReceived ? unitsPerBox * boxesReceived : 0;
      const multiplier = Math.max(0.01, numeric(item.multiplier ?? item.multiplicador, unitsPerBox || 1));
      const unitPrice = Math.max(0, numeric(item.unitPrice ?? item.precio_unitario, 0));
      const subtotal = Math.max(0, numeric(item.subtotal, qty * unitPrice));
      const stockQty = Math.max(0, numeric(item.stockQty ?? item.stock_qty ?? (newProduct && newProduct.totalUnitsReceived), calculatedTotalUnits || qty * multiplier));
      const candidate = newProduct || item;
      return {
        isNewProduct,
        newProduct,
        possibleDuplicates: isNewProduct ? productDuplicateCandidates(state, candidate).map((match) => ({
          productCode: match.codigo_producto || match.code || "",
          barcode: match.codigo_barras || "",
          name: match.name || match.descripcion || "",
          marca: match.marca || "",
          rubro: match.rubro || ""
        })) : [],
        productCode: product && (product.codigo_producto || product.code) || String(candidate.productCode || candidate.codigo_producto || "").trim(),
        barcode: product && product.codigo_barras || String(candidate.barcode || candidate.codigo_barras || "").trim(),
        name: product && (product.name || product.descripcion) || String(candidate.name || candidate.product || candidate.descripcion || "").trim(),
        category: product && product.rubro || String(candidate.category || candidate.rubro || candidate.categoria || "").trim(),
        supplier: String(item.supplier || input.supplier || "").trim(),
        nomenclator: String(item.nomenclator || item.nomenclador || item.codigo_interno || candidate.productCode || "").trim(),
        qty,
        unit: String(item.unit || item.unidad || "unidad").trim() || "unidad",
        unitPrice,
        multiplier,
        unitsPerBlister,
        blistersPerBox,
        boxesReceived,
        unitsPerBox,
        stockQty,
        subtotal: Math.round(subtotal * 100) / 100
      };
    }).filter((item) => item.name && item.qty > 0 && item.stockQty > 0);
  }
  return orderEngine.parseProductText(input.productsText || input.products || "").map((line) => ({
    productCode: "",
    barcode: "",
    name: line.name,
    category: "",
    supplier: String(input.supplier || "").trim(),
    nomenclator: "",
    qty: line.qty,
    unit: "unidad",
    unitPrice: 0,
    multiplier: 1,
    stockQty: line.qty,
    subtotal: 0
  }));
}

function sanitizeState(state) {
  if (!state || typeof state !== "object") return null;
  const clean = JSON.parse(JSON.stringify(state));
  if (Array.isArray(clean.sellers)) {
    clean.sellers = clean.sellers.map((seller) => ({
      ...seller,
      gps: seller.location ? "GPS pendiente" : seller.gps,
      location: null
    }));
  }
  return clean;
}

function stateForUser(state, user) {
  legalEngine.migrateState(state || {});
  if (user && user.role === "seller") {
    const clean = { ...(state || {}) };
    const visibleLists = Array.isArray(clean.priceLists)
      ? clean.priceLists
        .filter((list) => list.isDefault || list.status === "Activa")
        .map((list) => ({
          id: list.id,
          name: list.name,
          status: list.status,
          effectiveAt: list.effectiveAt,
          isDefault: list.isDefault,
          productCount: list.productCount,
          updatedAt: list.updatedAt,
          updatedBy: list.updatedBy
        }))
      : [];
    clean.priceLists = visibleLists;
    clean.priceListAudit = [];
    clean.commissionAudit = [];
    clean.legalAudit = [];
    clean.legalAcceptances = [];
    return clean;
  }
  if (user && user.role === "depot") {
    const source = JSON.parse(JSON.stringify(state || {}));
    const allowedStatuses = new Set([
      orderEngine.STATUS.PENDING,
      orderEngine.STATUS.READY,
      orderEngine.STATUS.ASSEMBLY,
      orderEngine.STATUS.LABELED,
      orderEngine.STATUS.READY_DISPATCH,
      "Confirmado",
      "Pendiente de preparacion",
      "Pendiente de preparación"
    ].map(normalizeSearchText));
    const visibleOrders = Array.isArray(source.orders) ? source.orders
      .filter((order) => order && allowedStatuses.has(normalizeSearchText(order.status)))
      .map((order) => ({
        code: order.code,
        id: order.id,
        client: order.client,
        seller: order.seller,
        products: order.products,
        status: order.status,
        priority: order.priority,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        source: order.source,
        origin: order.origin,
        route: order.route,
        zone: order.zone,
        address: order.address,
        deliveryAddress: order.deliveryAddress,
        horario: order.horario,
        hours: order.hours,
        observations: order.observations || order.observaciones || "",
        observaciones: order.observations || order.observaciones || "",
        inventoryMode: order.inventoryMode,
        supply: order.supply,
        print: order.print,
        printCount: order.printCount,
        lastPrintedAt: order.lastPrintedAt,
        lastPrintedBy: order.lastPrintedBy,
        assembly: order.assembly,
        labels: order.labels,
        trace: order.trace,
        timeline: order.timeline,
        items: Array.isArray(order.items) ? order.items.map((item) => ({
          productCode: item.productCode || item.codigo_producto || item.code || "",
          codigo_producto: item.productCode || item.codigo_producto || item.code || "",
          code: item.productCode || item.codigo_producto || item.code || "",
          name: item.name || item.descripcion || item.product || "",
          descripcion: item.name || item.descripcion || item.product || "",
          product: item.name || item.descripcion || item.product || "",
          requestedQty: item.requestedQty ?? item.qty ?? item.quantity,
          qty: item.requestedQty ?? item.qty ?? item.quantity,
          quantity: item.requestedQty ?? item.qty ?? item.quantity,
          unit: item.unit || item.unidad || "unidad",
          unidad: item.unit || item.unidad || "unidad",
          tags: item.tags,
          tipo: item.tipo,
          category: item.category,
          rubro: item.rubro,
          promo: item.promo,
          fragil: item.fragil,
          refrigerado: item.refrigerado,
          especial: item.especial,
          observations: item.observations || item.observaciones || ""
        })) : [],
        amount: 0
      })) : [];
    const visibleCodes = new Set(visibleOrders.map((order) => String(order.code || "")));
    const visibleClients = new Set(visibleOrders.map((order) => normalizeSearchText(order.client)));
    source.orders = visibleOrders;
    source.clients = Array.isArray(source.clients) ? source.clients
      .filter((client) => visibleClients.has(normalizeSearchText(client.name || client.nombre_comercial)))
      .map((client) => ({
        codigo_cliente: client.codigo_cliente || "",
        name: client.name || client.nombre_comercial || "",
        nombre_comercial: client.nombre_comercial || client.name || "",
        razon_social: client.razon_social || client.name || "",
        domicilio: client.domicilio || client.address || "",
        address: client.domicilio || client.address || "",
        telefono: client.telefono || client.phone || "",
        phone: client.telefono || client.phone || "",
        zona: client.zona || client.zone || "",
        zone: client.zona || client.zone || "",
        ruta: client.ruta || client.route || "",
        route: client.ruta || client.route || "",
        localidad: client.localidad || "",
        gps: client.gps || null
      })) : [];
    source.products = Array.isArray(source.products) ? source.products.map((product) => ({
      codigo_producto: product.codigo_producto || product.code || "",
      codigo_barras: product.codigo_barras || "",
      code: product.codigo_producto || product.code || "",
      name: product.name || product.descripcion || "",
      descripcion: product.descripcion || product.name || "",
      rubro: product.rubro || "",
      marca: product.marca || "",
      familia: product.familia || "",
      segmento: product.segmento || "",
      proveedor: product.proveedor || product.supplier || "",
      tags: product.tags,
      tipo: product.tipo,
      promo: product.promo,
      fragil: product.fragil,
      refrigerado: product.refrigerado,
      especial: product.especial,
      observaciones: product.observaciones || ""
    })) : [];
    source.accounts = [];
    source.bankReconciliation = [];
    source.suppliers = [];
    source.supplierMovements = [];
    source.entityRelations = [];
    source.priceLists = [];
    source.priceListAudit = [];
    source.commissionSettings = { rules: [] };
    source.commissionAudit = [];
    source.legalAudit = [];
    source.legalAcceptances = [];
    source.printSettings = state && state.printSettings || {};
    source.printAudit = Array.isArray(source.printAudit) ? source.printAudit.filter((entry) => visibleCodes.has(String(entry.orderCode || ""))) : [];
    source.globalAudit = Array.isArray(source.globalAudit) ? source.globalAudit
      .filter((entry) => String(entry.entityType || "") === "pedido" && visibleCodes.has(String(entry.entityId || "")))
      .slice(0, 1000) : [];
    source.notifications = Array.isArray(source.notifications) ? source.notifications
      .filter((entry) => String(entry.entityType || "") === "pedido" && visibleCodes.has(String(entry.entityId || "")))
      .slice(0, 200) : [];
    source.routeLearning = { visits: [], clientStats: [], recommendations: [] };
    return source;
  }
  if (user && user.role === "driver") {
    const clean = { ...(state || {}) };
    clean.priceListAudit = [];
    clean.commissionAudit = [];
    clean.legalAudit = [];
    clean.legalAcceptances = [];
    return clean;
  }
  if (!user || user.role !== "receiver") return state;
  const clean = JSON.parse(JSON.stringify(state || {}));
  clean.suppliers = Array.isArray(clean.suppliers) ? clean.suppliers.map((supplier) => ({
    name: supplier.name || supplier.razon_social || "",
    razon_social: supplier.razon_social || supplier.name || "",
    cuit: supplier.cuit || "",
    telefono: supplier.telefono || "",
    email: supplier.email || "",
    contact: supplier.contact || supplier.contacto_principal || "",
    sector: supplier.sector || supplier.rubro || "Sin rubro",
    status: "Recepcion"
  })) : [];
  clean.products = Array.isArray(clean.products) ? clean.products.map((product) => ({
    codigo_producto: product.codigo_producto || product.code || "",
    codigo_barras: product.codigo_barras || "",
    name: product.name || product.descripcion || "",
    descripcion: product.descripcion || product.name || "",
    rubro: product.rubro || "",
    marca: product.marca || "",
    familia: product.familia || "",
    segmento: product.segmento || "",
    proveedor: product.proveedor || product.supplier || "",
    nomenclador: product.nomenclador || product.codigo_interno || ""
  })) : [];
  clean.supplierMovements = Array.isArray(clean.supplierMovements) ? clean.supplierMovements
    .filter((movement) => String(movement.type || "") === "Remito")
    .map((movement) => ({
    id: movement.id,
    type: movement.type,
    supplier: movement.supplier,
    remitNumber: movement.remitNumber,
    date: movement.date,
    time: movement.time,
    at: movement.at,
    products: Array.isArray(movement.products) ? movement.products.map((item) => ({
      product: item.product,
      productCode: item.productCode,
      qty: item.qty,
      unit: item.unit,
      stockQty: item.stockQty
    })) : [],
    observations: movement.observations,
    upload: movement.upload,
    user: movement.user,
    username: movement.username,
    adminValidationStatus: movement.adminValidationStatus
  })) : [];
  clean.accounts = [];
  clean.bankReconciliation = [];
  clean.orders = [];
  clean.clients = [];
  clean.entityRelations = [];
  clean.routeLearning = { visits: [], clientStats: [], recommendations: [] };
  clean.globalAudit = [];
  clean.priceLists = [];
  clean.priceListAudit = [];
  clean.commissionSettings = { rules: [] };
  clean.commissionAudit = [];
  clean.printSettings = state && state.printSettings || {};
  clean.printAudit = [];
  clean.legalSettings = state && state.legalSettings || legalEngine.defaultLegalSettings();
  clean.legalAcceptances = [];
  clean.legalAudit = [];
  clean.helpCenter = state && state.helpCenter || { topics: legalEngine.DEFAULT_HELP_TOPICS, tourCompletions: [] };
  clean.aboutSystem = state && state.aboutSystem || { releaseNotes: legalEngine.DEFAULT_RELEASE_NOTES };
  return clean;
}

function clientListEntityKey(record) {
  const taxId = taxIdKey(record && record.cuit);
  if (taxId.length >= 7) return `cuit:${taxId}`;
  const name = normalizeSearchText(record && (record.razon_social || record.name || record.nombre_comercial));
  return name ? `nombre:${name}` : "";
}

function clientListSearchText(client) {
  return normalizeSearchText([
    client.codigo_cliente,
    client.name,
    client.nombre_comercial,
    client.razon_social,
    client.cuit,
    client.telefono,
    client.email,
    client.domicilio,
    client.localidad,
    client.zone,
    client.zona,
    client.ruta,
    client.seller,
    client.vendedor,
    client.status,
    client.estado
  ].filter(Boolean).join(" "));
}

function clientListRecord(state, client, supplierKeys) {
  const account = accountEngine.accountSummary(state, client, 0);
  const entityKey = clientListEntityKey(client);
  return {
    codigo_cliente: client.codigo_cliente || client.code || "",
    name: client.name || client.nombre_comercial || client.razon_social || "Cliente",
    razon_social: client.razon_social || "",
    cuit: client.cuit || "",
    condicion_fiscal: client.condicion_fiscal || "",
    telefono: client.telefono || client.phone || "",
    email: client.email || "",
    domicilio: client.domicilio || client.address || "",
    localidad: client.localidad || "",
    zone: client.zone || client.zona || "",
    ruta: client.ruta || client.route || "",
    seller: client.seller || client.vendedor || "",
    horario_atencion: client.horario_atencion || client.hours || "",
    latitud: client.latitud ?? client.latitude ?? null,
    longitud: client.longitud ?? client.longitude ?? null,
    status: client.status || client.estado || "Activo",
    tipo_cliente: client.tipo_cliente || "",
    condicion_comercial: client.condicion_comercial || "",
    forma_pago: client.forma_pago || client.paymentMethod || "",
    dia_visita: client.dia_visita || "",
    frecuencia_visita: client.frecuencia_visita || "",
    account: account && account.ok ? {
      currentBalance: account.currentBalance,
      creditLimit: account.creditLimit,
      overdueDebt: account.overdueDebt,
      totalDebt: account.totalDebt,
      pendingOrderExposure: account.pendingOrderExposure,
      status: account.status
    } : null,
    mixedEntityKey: entityKey && supplierKeys.has(entityKey) ? entityKey : ""
  };
}

function paginatedClientsPayload(state, searchParams, stateVersion) {
  const startedAt = performance.now();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(20, Number.parseInt(searchParams.get("limit") || "50", 10) || 50));
  const search = normalizeSearchText(searchParams.get("search") || "");
  const terms = search.split(/\s+/).filter(Boolean);
  const status = String(searchParams.get("status") || "all");
  const seller = String(searchParams.get("seller") || "all");
  const zone = String(searchParams.get("zone") || "all");
  const accountFilter = String(searchParams.get("account") || "all");
  const source = Array.isArray(state && state.clients) ? state.clients : [];
  const suppliers = Array.isArray(state && state.suppliers) ? state.suppliers : [];
  const supplierKeys = new Set(suppliers.map(clientListEntityKey).filter(Boolean));
  const sellers = new Set();
  const zones = new Set();

  const filtered = source.filter((client) => {
    const clientSeller = String(client.seller || client.vendedor || "");
    const clientZone = String(client.zone || client.zona || client.ruta || "");
    if (clientSeller) sellers.add(clientSeller);
    if (clientZone) zones.add(clientZone);
    if (terms.length && !terms.every((term) => clientListSearchText(client).includes(term))) return false;
    if (status !== "all" && String(client.status || client.estado || "Activo") !== status) return false;
    if (seller !== "all" && clientSeller !== seller) return false;
    if (zone !== "all" && clientZone !== zone) return false;
    const balance = Number(client.balance ?? client.saldo_actual ?? client.saldo_inicial ?? 0) || 0;
    const creditLimit = Number(client.limit ?? client.limite_credito ?? 0) || 0;
    if (accountFilter === "debt" && balance <= 0) return false;
    if (accountFilter === "overlimit" && !(creditLimit > 0 && balance > creditLimit)) return false;
    if (accountFilter === "clear" && balance > 0) return false;
    return true;
  }).sort((a, b) => String(a.name || a.nombre_comercial || "").localeCompare(String(b.name || b.nombre_comercial || ""), "es-AR"));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const records = filtered.slice(offset, offset + limit).map((client) => clientListRecord(state, client, supplierKeys));
  const queryMs = Math.round((performance.now() - startedAt) * 10) / 10;
  return {
    ok: true,
    records,
    page: safePage,
    limit,
    total,
    totalPages,
    stateVersion: Number(stateVersion || 0),
    filters: {
      sellers: Array.from(sellers).sort((a, b) => a.localeCompare(b, "es-AR")),
      zones: Array.from(zones).sort((a, b) => a.localeCompare(b, "es-AR"))
    },
    performance: {
      queryMs,
      sourceRecords: source.length,
      returnedRecords: records.length
    }
  };
}

function collectionSize(state, key) {
  return state && Array.isArray(state[key]) ? state[key].length : 0;
}

function validateStateWrite(currentState, nextState, allowReset) {
  if (allowReset) return { ok: true };
  if (!nextState || typeof nextState !== "object") {
    return { ok: false, error: "Estado invalido." };
  }
  const checks = [
    { key: "clients", label: "clientes", critical: 100 },
    { key: "products", label: "productos", critical: 100 },
    { key: "orders", label: "pedidos", critical: 10 }
  ];
  for (const check of checks) {
    const currentCount = collectionSize(currentState, check.key);
    const nextCount = collectionSize(nextState, check.key);
    if (currentCount >= check.critical && nextCount < Math.floor(currentCount * 0.75)) {
      return {
        ok: false,
        error: `Proteccion de datos: se rechazo un estado con menos ${check.label} (${nextCount}/${currentCount}).`
      };
    }
  }
  return { ok: true };
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stockStatus(product) {
  const stock = orderEngine.inventory(product).available;
  const min = numeric(product.stock_minimo ?? product.min, 0);
  if (stock <= 0) return { key: "empty", label: "Sin stock" };
  if (stock < min) return { key: "critical", label: "Reponer" };
  return { key: "ok", label: "OK" };
}

function sameText(a, b) {
  return normalizeSearchText(a) === normalizeSearchText(b);
}

function clientRecordId(client) {
  return String(client && (client.codigo_cliente || client.name || client.nombre_comercial) || "").trim();
}

function findClientIndex(state, id) {
  const normalized = normalizeSearchText(id);
  return (state.clients || []).findIndex((client) => (
    normalizeSearchText(client.codigo_cliente) === normalized
    || normalizeSearchText(client.name) === normalized
    || normalizeSearchText(client.nombre_comercial) === normalized
  ));
}

function clientSensitiveSnapshot(client) {
  if (!client) return null;
  return {
    limite_credito: numeric(client.limite_credito ?? client.limit, 0),
    condicion_comercial: String(client.condicion_comercial || ""),
    forma_pago: String(client.forma_pago || ""),
    dias_credito: numeric(client.dias_credito, 0),
    razon_social: String(client.razon_social || ""),
    cuit: String(client.cuit || ""),
    condicion_fiscal: String(client.condicion_fiscal || ""),
    domicilio: String(client.domicilio || ""),
    localidad: String(client.localidad || "")
  };
}

function sensitiveClientChanged(before, after) {
  return stableAuditJson(clientSensitiveSnapshot(before)) !== stableAuditJson(clientSensitiveSnapshot(after));
}

function applyClientNameReferences(state, previousName, nextName) {
  if (!previousName || !nextName || sameText(previousName, nextName)) return;
  (state.orders || []).forEach((order) => {
    if (sameText(order.client, previousName)) order.client = nextName;
  });
  (state.accounts || []).forEach((entry) => {
    if (sameText(entry.account, previousName)) entry.account = nextName;
  });
  (state.bankReconciliation || []).forEach((record) => {
    if (sameText(record.client, previousName)) record.client = nextName;
  });
  (state.deliveryRoutes || []).forEach((route) => {
    (route.stops || []).forEach((stop) => {
      if (sameText(stop.client, previousName)) stop.client = nextName;
    });
  });
}

function editedClientFromInput(previous, input, user) {
  const name = String(input.nombre_comercial || input.name || previous.name || previous.nombre_comercial || "").trim();
  if (!name) throw new Error("El cliente debe tener nombre comercial.");
  const currentLimit = numeric(previous.limite_credito ?? previous.limit, 0);
  const requestedLimit = input.limite_credito === undefined && input.limit === undefined
    ? currentLimit
    : Math.max(0, numeric(input.limite_credito ?? input.limit, 0));
  if (requestedLimit !== currentLimit && (!user || user.role !== "admin")) {
    throw new Error("Solo un usuario Administrador puede modificar el limite de credito.");
  }
  const zone = String(input.zona || input.zone || previous.zona || previous.zone || "Sin zona").trim() || "Sin zona";
  const seller = String(input.vendedor_asignado || input.seller || previous.vendedor_asignado || previous.seller || "").trim();
  const balance = Math.max(0, numeric(previous.balance ?? previous.saldo_actual ?? previous.saldo_inicial, 0));
  return {
    ...previous,
    codigo_cliente: String(input.codigo_cliente || previous.codigo_cliente || "").trim(),
    name,
    nombre_comercial: name,
    razon_social: String(input.razon_social || name).trim(),
    cuit: String(input.cuit || "").trim(),
    condicion_fiscal: String(input.condicion_fiscal || "Cons.Final").trim(),
    domicilio: String(input.domicilio || "").trim(),
    localidad: String(input.localidad || "").trim(),
    telefono: String(input.telefono || "").trim(),
    email: String(input.email || "").trim(),
    zona: zone,
    zone,
    ruta: String(input.ruta || zone).trim(),
    vendedor_asignado: seller,
    seller,
    tipo_cliente: String(input.tipo_cliente || "OTROS").trim(),
    forma_pago: String(input.forma_pago || "Contado").trim(),
    condicion_comercial: String(input.condicion_comercial || input.forma_pago || "").trim(),
    dias_credito: Math.max(0, numeric(input.dias_credito, 0)),
    limite_credito: requestedLimit,
    limit: requestedLimit,
    balance,
    saldo_inicial: balance,
    saldo_actual: balance,
    dia_visita: String(input.dia_visita || "").trim(),
    frecuencia_visita: String(input.frecuencia_visita || "").trim(),
    estado: String(input.estado || "Activo").trim() || "Activo",
    status: String(input.estado || "Activo").trim() || "Activo",
    observaciones: String(input.observaciones || "").trim(),
    horario_atencion: String(input.horario_atencion || "").trim(),
    latitud: input.latitud === null || input.latitud === "" ? null : numeric(input.latitud, null),
    longitud: input.longitud === null || input.longitud === "" ? null : numeric(input.longitud, null),
    updatedAt: new Date().toISOString()
  };
}

function mobileClientFromInput(input, user) {
  const name = String(input.nombre_comercial || input.name || "").trim();
  if (!name) throw new Error("El cliente debe tener nombre comercial.");
  const consumerFinal = Boolean(input.consumidor_final || input.consumidorFinal || input.consumerFinal);
  const taxId = String(input.cuit || input.cuil || input.taxId || "").trim();
  if (!consumerFinal && !taxId) throw new Error("Completar CUIT/CUIL o marcar Consumidor Final.");
  const phone = String(input.telefono || input.phone || "").trim();
  if (!phone) throw new Error("El telefono es obligatorio.");
  const address = String(input.domicilio || input.address || "").trim();
  if (!address) throw new Error("La direccion es obligatoria.");
  const city = String(input.localidad || input.city || "").trim();
  if (!city) throw new Error("La localidad es obligatoria.");
  const payment = String(input.forma_pago || input.condicion_pago || input.payment || "").trim();
  if (!payment) throw new Error("La condicion de pago es obligatoria.");
  if (input.limite_credito === undefined && input.limit === undefined) throw new Error("El limite de credito es obligatorio.");
  const gps = normalizeGps(input.gps || input.location || {
    lat: input.latitud,
    lng: input.longitud,
    accuracy: input.gpsAccuracy
  });
  const rejectReason = gpsRejectReason(gps);
  if (rejectReason) throw new Error(rejectReason);
  const zone = String(input.zona || input.zone || input.ruta || "").trim();
  if (!zone) throw new Error("La ruta asignada es obligatoria.");
  const seller = String(input.vendedor_asignado || input.seller || user && (user.sellerName || user.name) || "").trim();
  const limit = Math.max(0, numeric(input.limite_credito ?? input.limit, 0));
  const at = new Date().toISOString();
  return {
    codigo_cliente: String(input.codigo_cliente || `MOB-${Date.now()}`).trim(),
    name,
    nombre_comercial: name,
    razon_social: String(input.razon_social || name).trim(),
    cuit: taxId,
    consumidor_final: consumerFinal,
    condicion_fiscal: String(input.condicion_fiscal || (consumerFinal ? "Cons.Final" : "Responsable Inscripto")).trim(),
    domicilio: address,
    localidad: city,
    telefono: phone,
    email: String(input.email || "").trim(),
    forma_pago: payment,
    condicion_comercial: String(input.condicion_comercial || payment || "Alta preventa").trim(),
    dias_credito: Math.max(0, numeric(input.dias_credito, 0)),
    limite_credito: limit,
    limit,
    saldo_inicial: 0,
    balance: 0,
    tipo_cliente: String(input.tipo_cliente || "Preventa").trim(),
    zona: zone,
    zone,
    ruta: String(input.ruta || zone).trim(),
    vendedor_asignado: seller,
    seller,
    dia_visita: String(input.dia_visita || "").trim(),
    frecuencia_visita: String(input.frecuencia_visita || "Semanal").trim(),
    estado: String(input.estado || "Activo").trim() || "Activo",
    status: String(input.estado || "Activo").trim() || "Activo",
    observaciones: String(input.observaciones || "Alta rapida desde celular").trim(),
    horario_atencion: String(input.horario_atencion || "").trim(),
    latitud: gps.lat,
    longitud: gps.lng,
    gpsAccuracy: gps.accuracy,
    gps,
    origen: "preventa",
    createdAt: at,
    updatedAt: at,
    createdBy: user && user.name || "Preventa"
  };
}

function productSearchText(product) {
  return [
    product.codigo_producto,
    product.codigo_barras,
    product.descripcion,
    product.name,
    product.rubro,
    product.marca,
    product.familia,
    product.segmento,
    product.bultos
  ].join(" ");
}

function filteredStockProducts(state, filter) {
  const products = Array.isArray(state.products) ? state.products : [];
  const terms = normalizeSearchText(filter && filter.searchTerm).split(/\s+/).filter(Boolean);
  const statusFilter = filter && filter.statusFilter ? String(filter.statusFilter) : "all";
  const rubricFilter = filter && filter.rubricFilter ? String(filter.rubricFilter) : "all";
  const brandFilter = filter && filter.brandFilter ? String(filter.brandFilter) : "all";
  return products.filter((product) => {
    const normalized = normalizeSearchText(productSearchText(product));
    const matchesText = !terms.length || terms.every((term) => normalized.includes(term));
    const status = stockStatus(product);
    const matchesStatus = statusFilter === "all" || status.key === statusFilter;
    const matchesRubric = rubricFilter === "all" || String(product.rubro || "") === rubricFilter;
    const matchesBrand = brandFilter === "all" || String(product.marca || "") === brandFilter;
    return matchesText && matchesStatus && matchesRubric && matchesBrand;
  });
}

function priceProductKey(product) {
  return String(product && (product.codigo_producto || product.codigo_barras || product.name || product.descripcion) || "").trim();
}

function currentProductPrice(product) {
  return Math.max(0, numeric(product && (product.price ?? product.precio_lista_2 ?? product.precio_lista_1), 0));
}

const SYSTEM_PRICE_LISTS = [1, 2, 3, 4, 5];

function priceListIdForNumber(number) {
  return `PL-L${Math.min(5, Math.max(1, Math.round(numeric(number, 2))))}`;
}

function priceListNameForNumber(number) {
  return `Lista Nº ${Math.min(5, Math.max(1, Math.round(numeric(number, 2))))}`;
}

function priceListNumberFromValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/(?:PL-L|lista\s*(?:n|nº|#)?\s*|precio_lista_)([1-5])/i);
  return match ? Number(match[1]) : 0;
}

function priceListNumberFromRecord(list) {
  const declared = Number(list && (list.number || list.numero || list.listNumber));
  if (Number.isFinite(declared) && declared >= 1 && declared <= 5) return Math.round(declared);
  return priceListNumberFromValue(list && (list.id || list.name || list.nombre));
}

function productPriceForListNumber(product, listNumber) {
  const number = Math.min(5, Math.max(1, Math.round(numeric(listNumber, 2))));
  const direct = Math.max(0, numeric(product && product[`precio_lista_${number}`], 0));
  return direct || currentProductPrice(product);
}

function priceListItemFromProduct(product, overrides = {}) {
  const listNumber = Math.min(5, Math.max(1, Math.round(numeric(overrides.listNumber, 2))));
  const price = Math.max(0, numeric(overrides.price ?? productPriceForListNumber(product, listNumber), 0));
  const previousPrice = Math.max(0, numeric(overrides.previousPrice ?? price, 0));
  return {
    productCode: String(product.codigo_producto || product.code || "").trim(),
    productName: String(product.name || product.descripcion || "").trim(),
    codigo_barras: String(product.codigo_barras || "").trim(),
    rubro: String(product.rubro || "S/D").trim() || "S/D",
    marca: String(product.marca || "S/D").trim() || "S/D",
    proveedor: String(product.proveedor || product.supplier || "").trim(),
    previousPrice,
    price,
    newPrice: price,
    listNumber,
    difference: price - previousPrice,
    percentApplied: numeric(overrides.percentApplied, previousPrice > 0 ? ((price - previousPrice) / previousPrice) * 100 : 0),
    marginPct: numeric(overrides.marginPct, 0),
    increasePct: numeric(overrides.increasePct, 0)
  };
}

function defaultPriceListItems(state, listNumber = 2) {
  return (Array.isArray(state.products) ? state.products : []).map((product) => priceListItemFromProduct(product, { listNumber }));
}

function normalizePriceListAssignment(assignment) {
  const username = String(assignment && (assignment.username || assignment.user || assignment.usuario) || "").trim().toLowerCase();
  const sellerName = String(assignment && (assignment.sellerName || assignment.seller || assignment.vendedor || assignment.name) || "").trim();
  const number = Math.min(5, Math.max(1, Math.round(numeric(
    assignment && (assignment.listNumber || assignment.number || assignment.lista),
    priceListNumberFromValue(assignment && (assignment.priceListId || assignment.priceListName || assignment.lista_precio)) || 2
  ))));
  return {
    username,
    sellerName,
    priceListId: String(assignment && (assignment.priceListId || assignment.listId) || priceListIdForNumber(number)).trim(),
    priceListName: String(assignment && (assignment.priceListName || assignment.listName) || priceListNameForNumber(number)).trim(),
    listNumber: number,
    locked: assignment && assignment.locked !== undefined ? Boolean(assignment.locked) : true,
    active: assignment && assignment.active === false ? false : true,
    updatedAt: String(assignment && assignment.updatedAt || ""),
    updatedBy: String(assignment && assignment.updatedBy || "Sistema")
  };
}

function ensurePriceListAssignmentsState(state) {
  state.priceListAssignments = Array.isArray(state.priceListAssignments)
    ? state.priceListAssignments.map(normalizePriceListAssignment).filter((item) => item.username || item.sellerName)
    : [];
  if (!state.priceListAssignments.some((item) => item.username === "kevin" || sameText(item.sellerName, "Kevin Guibert"))) {
    state.priceListAssignments.push(normalizePriceListAssignment({
      username: "kevin",
      sellerName: "Kevin Guibert",
      priceListId: "PL-L4",
      priceListName: "Lista Nº 4",
      listNumber: 4,
      locked: true,
      updatedBy: "Sistema"
    }));
  }
  state.productPortfolioAudit = Array.isArray(state.productPortfolioAudit) ? state.productPortfolioAudit : [];
  state.maintenanceBackups = Array.isArray(state.maintenanceBackups) ? state.maintenanceBackups : [];
  return state.priceListAssignments;
}

function ensurePriceListsState(state) {
  if (!state || typeof state !== "object") return state;
  const products = Array.isArray(state.products) ? state.products : [];
  state.priceLists = Array.isArray(state.priceLists) ? state.priceLists : [];
  state.priceListAudit = Array.isArray(state.priceListAudit) ? state.priceListAudit : [];
  if (!state.priceLists.length) {
    state.priceLists.push({
      id: "PL-BASE",
      name: "Lista vigente",
      status: "Activa",
      effectiveAt: "2026-01-01T00:00:00.000Z",
      isDefault: true,
      productCount: products.length,
      updatedAt: "",
      updatedBy: "Sistema",
      rounding: 1,
      operation: "base",
      number: 2,
      items: defaultPriceListItems(state, 2)
    });
  }
  state.priceLists = state.priceLists.map((list, index) => {
    const number = priceListNumberFromRecord(list) || 2;
    const items = Array.isArray(list.items) ? list.items : defaultPriceListItems(state, number);
    return {
      id: String(list.id || `PL-${index + 1}`),
      name: String(list.name || list.nombre || "Lista de precios").trim() || "Lista de precios",
      status: normalizePriceListStatus(list.status || list.estado || (index === 0 ? "Activa" : "Borrador")),
      effectiveAt: validIsoOrNow(list.effectiveAt || list.vigencia || list.fecha_vigencia),
      isDefault: Boolean(list.isDefault || list.default || index === 0),
      productCount: numeric(list.productCount ?? items.length, items.length),
      updatedAt: String(list.updatedAt || list.modificado || ""),
      updatedBy: String(list.updatedBy || list.usuario || "Sistema"),
      rounding: Math.max(0, numeric(list.rounding ?? list.redondeo, 1)),
      operation: String(list.operation || list.operacion || "base"),
      motive: String(list.motive || list.motivo || ""),
      number,
      items
    };
  });
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const id = priceListIdForNumber(number);
    const name = priceListNameForNumber(number);
    const current = state.priceLists.find((list) => list.id === id || priceListNumberFromRecord(list) === number);
    const generated = {
      id,
      name,
      status: "Activa",
      effectiveAt: "2026-01-01T00:00:00.000Z",
      isDefault: number === 2,
      productCount: products.length,
      updatedAt: current && current.updatedAt || "",
      updatedBy: current && current.updatedBy || "Sistema",
      rounding: current && current.rounding || 1,
      operation: "columna_producto",
      motive: current && current.motive || "",
      number,
      generatedFromColumns: true,
      items: defaultPriceListItems(state, number)
    };
    if (current) Object.assign(current, { ...generated, status: current.status || generated.status });
    else state.priceLists.push(generated);
  });
  const seenPriceListNumbers = new Set();
  state.priceLists = state.priceLists.filter((list) => {
    const number = priceListNumberFromRecord(list);
    if (!number || !seenPriceListNumbers.has(number)) {
      if (number) seenPriceListNumbers.add(number);
      return true;
    }
    return false;
  });
  state.priceLists.forEach((list) => {
    list.isDefault = list.id === "PL-L2";
    if (list.id === "PL-L2") list.status = "Activa";
  });
  if (!state.priceLists.some((list) => list.isDefault && list.status === "Activa")) {
    const active = state.priceLists.find((list) => list.status === "Activa") || state.priceLists[0];
    if (active) active.isDefault = true;
  }
  ensurePriceListAssignmentsState(state);
  return state;
}

function findProductForPricing(state, reference) {
  const products = Array.isArray(state.products) ? state.products : [];
  const code = String(reference && (reference.productCode || reference.codigo_producto || reference.code) || "").trim();
  const barcode = String(reference && (reference.codigo_barras || reference.barcode || reference.ean) || "").trim();
  const name = String(reference && (reference.name || reference.product || reference.descripcion) || reference || "").trim();
  if (code) {
    const byCode = products.find((product) => String(product.codigo_producto || product.code || "").trim() === code);
    if (byCode) return byCode;
  }
  if (barcode) {
    const byBarcode = products.find((product) => String(product.codigo_barras || product.barcode || product.ean || "").trim() === barcode);
    if (byBarcode) return byBarcode;
  }
  const normalizedName = normalizeSearchText(name);
  if (!normalizedName) return null;
  return products.find((product) => normalizeSearchText(product.name || product.descripcion) === normalizedName) || null;
}

function assignedPriceListForOrder(state, user, sellerName) {
  ensurePriceListsState(state);
  const username = String(user && user.username || "").trim().toLowerCase();
  const seller = String(sellerName || user && (user.sellerName || user.name) || "").trim();
  const fromState = (state.priceListAssignments || []).find((assignment) => assignment.active !== false && (
    (username && assignment.username === username)
    || (seller && sameText(assignment.sellerName, seller))
  ));
  const userNumber = priceListNumberFromValue(user && (user.defaultPriceListId || user.priceListId || user.defaultPriceListName || user.priceListName));
  const fallbackNumber = userNumber || priceListNumberFromValue(fromState && fromState.priceListId) || numeric(fromState && fromState.listNumber, 2) || 2;
  const number = Math.min(5, Math.max(1, Math.round(numeric(fromState && fromState.listNumber, fallbackNumber))));
  const list = (state.priceLists || []).find((item) => item.id === (fromState && fromState.priceListId)) || (state.priceLists || []).find((item) => priceListNumberFromRecord(item) === number);
  return {
    username,
    sellerName: seller,
    priceListId: list && list.id || fromState && fromState.priceListId || priceListIdForNumber(number),
    priceListName: list && list.name || fromState && fromState.priceListName || priceListNameForNumber(number),
    listNumber: number,
    locked: fromState ? fromState.locked !== false : true
  };
}

function priceOrderItemsForAssignedList(state, input, user, sellerName) {
  const assignment = assignedPriceListForOrder(state, user, sellerName);
  if (!Array.isArray(input.items) || !input.items.length) {
    return { ...input, priceListId: assignment.priceListId, priceListName: assignment.priceListName };
  }
  return {
    ...input,
    priceListId: assignment.priceListId,
    priceListName: assignment.priceListName,
    items: input.items.map((item) => {
      const product = findProductForPricing(state, item);
      if (!product) return item;
      const unitPrice = productPriceForListNumber(product, assignment.listNumber);
      return {
        ...item,
        productCode: product.codigo_producto || product.code || item.productCode || "",
        name: product.name || product.descripcion || item.name || "",
        unitPrice,
        price: unitPrice,
        priceListId: assignment.priceListId,
        priceListName: assignment.priceListName
      };
    })
  };
}

function createMaintenanceBackup(label, state) {
  ensureDataFiles();
  const safeLabel = String(label || "backup").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60) || "backup";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(DATA_DIR, "backups", `${stamp}-${safeLabel}`);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(STATE_FILE)) fs.copyFileSync(STATE_FILE, path.join(dir, "demo-state.json"));
  if (fs.existsSync(USERS_FILE)) fs.copyFileSync(USERS_FILE, path.join(dir, "users.json"));
  fs.writeFileSync(path.join(dir, "README.txt"), [
    "Backup automatico previo a mantenimiento.",
    `Fecha: ${new Date().toISOString()}`,
    `Origen estado: ${STATE_FILE}`,
    `Origen usuarios: ${USERS_FILE}`
  ].join("\r\n"), "utf8");
  const record = {
    id: `BK-${Date.now()}`,
    at: new Date().toISOString(),
    label: safeLabel,
    path: dir,
    stateVersion: readStateVersionFast(),
    clients: Array.isArray(state && state.clients) ? state.clients.length : 0,
    orders: Array.isArray(state && state.orders) ? state.orders.length : 0,
    products: Array.isArray(state && state.products) ? state.products.length : 0
  };
  if (state && typeof state === "object") {
    state.maintenanceBackups = Array.isArray(state.maintenanceBackups) ? state.maintenanceBackups : [];
    state.maintenanceBackups.unshift(record);
    state.maintenanceBackups = state.maintenanceBackups.slice(0, 50);
  }
  return record;
}

function productRecordKey(product) {
  return String(product && (product.codigo_producto || product.codigo_barras || product.name || product.descripcion) || "").trim();
}

function findProductForInitialInventory(state, row) {
  const products = Array.isArray(state.products) ? state.products : [];
  const code = normalizeSearchText(row && (row.productCode || row.codigo_producto || row.code));
  const barcode = normalizeSearchText(row && (row.barcode || row.codigo_barras || row.ean));
  const description = normalizeSearchText(row && (row.description || row.descripcion || row.product || row.name));
  return products.find((product) => code && normalizeSearchText(product.codigo_producto) === code)
    || products.find((product) => barcode && normalizeSearchText(product.codigo_barras) === barcode)
    || products.find((product) => description && normalizeSearchText(product.name || product.descripcion) === description)
    || null;
}

function buildInitialInventoryPreview(state, rows) {
  orderEngine.migrateState(state);
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const product = findProductForInitialInventory(state, row);
    const rawQuantity = String((row && (row.quantityPhysical ?? row.cantidad_fisica ?? row.stock ?? row.quantity)) ?? "").replace(",", ".");
    const quantity = numeric(rawQuantity, NaN);
    const inventory = product ? orderEngine.inventory(product) : null;
    const key = product ? productRecordKey(product) : "";
    const errors = [];
    if (!product) errors.push("Producto inexistente");
    if (!Number.isFinite(quantity) || quantity < 0) errors.push("Cantidad fisica invalida");
    if (product && seen.has(key)) errors.push("Producto duplicado en archivo");
    if (product) seen.add(key);
    if (product && Number.isFinite(quantity) && quantity < inventory.reserved) {
      errors.push(`Cantidad menor a stock reservado (${inventory.reserved})`);
    }
    return {
      rowNumber: Number(row && row.rowNumber) || index + 1,
      productCode: product ? productRecordKey(product) : String(row && (row.productCode || row.codigo_producto || "") || ""),
      barcode: product ? String(product.codigo_barras || "") : String(row && (row.barcode || row.codigo_barras || "") || ""),
      productName: product ? String(product.name || product.descripcion || "") : String(row && (row.description || row.product || "") || ""),
      quantityPhysical: Number.isFinite(quantity) ? Math.floor(quantity) : row && row.quantityPhysical,
      currentPhysical: inventory ? inventory.physical : null,
      reserved: inventory ? inventory.reserved : 0,
      difference: inventory && Number.isFinite(quantity) ? Math.floor(quantity) - inventory.physical : null,
      warehouse: String(row && (row.warehouse || row.deposito || "") || "Deposito").trim() || "Deposito",
      observation: String(row && (row.observation || row.observacion || "") || "").trim(),
      errors
    };
  });
}

function applyInitialInventoryLoad(state, input, user) {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  if (!rows.length) throw new Error("No hay filas para aplicar.");
  const preview = buildInitialInventoryPreview(state, rows);
  const errors = preview.filter((row) => row.errors.length);
  if (errors.length) {
    throw new Error(`La vista previa contiene ${errors.length} filas con error. No se aplico ningun cambio.`);
  }
  if (input.confirmed !== true || String(input.confirmText || "").trim() !== "CONFIRMAR") {
    throw new Error("Escribir CONFIRMAR para aplicar el inventario inicial.");
  }
  const backup = createMaintenanceBackup("inventario-inicial", state);
  const at = new Date().toISOString();
  const parts = auditLocalParts(at);
  const applied = [];
  const generalObservation = String(input.observation || input.observacion || "").trim();
  const fileName = String(input.fileName || input.file_name || input.source || "Carga manual").trim();
  state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements : [];
  preview.forEach((row) => {
    const product = findProductForInitialInventory(state, row);
    const before = orderEngine.inventory(product);
    const nextPhysical = Math.max(0, Math.floor(numeric(row.quantityPhysical, before.physical)));
    product.stock_fisico = nextPhysical;
    product.stock_actual = nextPhysical;
    product.stock = nextPhysical;
    product.stock_reservado = before.reserved;
    product.updatedAt = at;
    product.updated_by = user && (user.username || user.name) || "admin";
    product.deposito = row.warehouse || product.deposito || "Deposito";
    orderEngine.refreshProductInventory(product);
    const after = orderEngine.inventory(product);
    const movement = {
      id: `STK-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      at,
      date: parts.date,
      time: parts.time,
      type: "Inventario inicial",
      productCode: productRecordKey(product),
      productName: product.name || product.descripcion || row.productName,
      qty: after.physical - before.physical,
      stockBefore: before.physical,
      stockAfter: after.physical,
      previousStock: before.physical,
      newStock: after.physical,
      reservedStock: after.reserved,
      availableStock: after.available,
      warehouse: row.warehouse,
      user: user && user.name || "Administracion",
      username: user && user.username || "",
      reason: row.observation || generalObservation || "Carga inicial controlada",
      observation: row.observation || generalObservation,
      fileName,
      title: product.name || row.productName,
      text: `Inventario inicial ${before.physical} -> ${after.physical}. Diferencia ${after.physical - before.physical}. ${row.observation || generalObservation || ""}`.trim()
    };
    state.stockMovements.unshift(movement);
    applied.push(movement);
  });
  const completedOrders = orderEngine.allocatePendingOrders(state, user && user.name || "Inventario inicial");
  state.physicalStockCounts = Array.isArray(state.physicalStockCounts) ? state.physicalStockCounts : [];
  state.initialInventoryLoads = Array.isArray(state.initialInventoryLoads) ? state.initialInventoryLoads : [];
  const loadRecord = {
    id: `INVINI-${Date.now()}`,
    at,
    date: parts.date,
    time: parts.time,
    user: user && user.name || "Administracion",
    username: user && user.username || "",
    fileName,
    observation: generalObservation,
    rows: preview.length,
    applied: applied.length,
    backup
  };
  state.initialInventoryLoads.unshift(loadRecord);
  state.initialInventoryLoads = state.initialInventoryLoads.slice(0, 200);
  state.activity = Array.isArray(state.activity) ? state.activity : [];
  state.activity.unshift({
    type: "Inventario",
    title: "Inventario inicial aplicado",
    text: `${applied.length} productos actualizados. Backup ${backup.id}.`
  });
  state.shortages = orderEngine.buildShortageList(state);
  return { preview, applied, completedOrders, backup, loadRecord };
}

function normalizeImportedProductRecord(raw, index = 0) {
  const source = raw && typeof raw === "object" ? raw : {};
  const name = String(source.descripcion || source.description || source.name || source.producto || "").trim();
  if (!name) throw new Error(`Producto sin descripcion en fila ${index + 1}.`);
  const stock = Math.max(0, numeric(source.stock_fisico ?? source.stock_actual ?? source.stock ?? source.cantidad, 0));
  const cost = Math.max(0, numeric(source.costo ?? source.cost ?? source.precio_costo, 0));
  const price1 = Math.max(0, numeric(source.precio_lista_1 ?? source.lista_1 ?? source.lista1 ?? source.precio1, 0));
  const price2 = Math.max(0, numeric(source.precio_lista_2 ?? source.lista_2 ?? source.lista2 ?? source.precio2 ?? source.price, price1));
  const price3 = Math.max(0, numeric(source.precio_lista_3 ?? source.lista_3 ?? source.lista3 ?? source.precio3, 0));
  const price4 = Math.max(0, numeric(source.precio_lista_4 ?? source.lista_4 ?? source.lista4 ?? source.precio4, 0));
  const price5 = Math.max(0, numeric(source.precio_lista_5 ?? source.lista_5 ?? source.lista5 ?? source.precio5, 0));
  return {
    ...source,
    codigo_producto: String(source.codigo_producto || source.codigo || source.code || source.codigo_interno || "").trim(),
    codigo_barras: String(source.codigo_barras || source.barcode || source.ean || "").trim(),
    name,
    descripcion: name,
    rubro: String(source.rubro || source.categoria || source.category || "S/D").trim() || "S/D",
    familia: String(source.familia || source.rubro || source.categoria || "S/D").trim() || "S/D",
    marca: String(source.marca || source.brand || "S/D").trim() || "S/D",
    proveedor: String(source.proveedor || source.supplier || "").trim(),
    unidad_venta: String(source.unidad_venta || source.unidad || source.unit || "unidad").trim() || "unidad",
    stock_fisico: stock,
    stock_actual: stock,
    stock,
    stock_reservado: 0,
    stock_disponible: stock,
    stock_en_transito: Math.max(0, numeric(source.stock_en_transito, 0)),
    stock_minimo: Math.max(0, numeric(source.stock_minimo ?? source.min, 0)),
    min: Math.max(0, numeric(source.stock_minimo ?? source.min, 0)),
    costo: cost,
    cost,
    margen: Math.max(0, numeric(source.margen ?? source.margin, 0)),
    precio_lista_1: price1,
    precio_lista_2: price2 || price1,
    precio_lista_3: price3,
    precio_lista_4: price4,
    precio_lista_5: price5,
    price: price2 || price1,
    priceListId: "PL-L2",
    priceListName: "Lista Nº 2",
    activo: String(source.activo || source.estado || "SI").trim().toUpperCase().startsWith("INACT") ? "NO" : String(source.activo || "SI").trim() || "SI",
    origen: String(source.origen || "importacion-cartera").trim(),
    updatedAt: new Date().toISOString()
  };
}

const PORTFOLIO_TEMPLATE_COLUMNS = [
  "Accion", "ID_Sistema", "Descripcion", "Stock", "Costo", "Lista_1", "Lista_2_Preventa",
  "Lista_3", "Lista_4", "Lista_5", "Unidad_Medida", "Codigo_Proveedor", "Subrubro",
  "Categoria", "Codigo_Barras", "Activo", "Observaciones_Importacion"
];

function normalizedPortfolioHeader(value) {
  return normalizeSearchText(value).replace(/\s+/g, "_");
}

const PORTFOLIO_HEADER_ALIASES = new Map([
  ["accion", "Accion"], ["id_sistema", "ID_Sistema"], ["id", "ID_Sistema"],
  ["descripcion", "Descripcion"], ["descripcion_producto", "Descripcion"], ["producto", "Descripcion"],
  ["stock", "Stock"], ["stock_actual", "Stock"], ["cantidad", "Stock"],
  ["costo", "Costo"], ["$_costo", "Costo"], ["precio_costo", "Costo"],
  ["lista_1", "Lista_1"], ["lista_2", "Lista_2_Preventa"], ["lista_2_preventa", "Lista_2_Preventa"],
  ["lista_3", "Lista_3"], ["lista_4", "Lista_4"], ["lista_5", "Lista_5"],
  ["unid_med", "Unidad_Medida"], ["unidad_medida", "Unidad_Medida"], ["unidad", "Unidad_Medida"],
  ["codigo_proveedor", "Codigo_Proveedor"], ["subrubro", "Subrubro"], ["categoria", "Categoria"],
  ["codigo_barra", "Codigo_Barras"], ["codigo_barras", "Codigo_Barras"], ["barcode", "Codigo_Barras"],
  ["activo", "Activo"], ["observaciones_importacion", "Observaciones_Importacion"]
]);

function portfolioCellValue(cell) {
  if (cell == null) return "";
  if (typeof cell === "object") {
    if (cell.result != null) return cell.result;
    if (cell.text != null) return cell.text;
    if (Array.isArray(cell.richText)) return cell.richText.map((part) => part.text || "").join("");
  }
  return cell;
}

function dataUrlBuffer(value, maxBytes = MAX_BODY) {
  const match = String(value || "").match(/^data:([^;,]+)?(?:;base64)?,([\s\S]+)$/);
  if (!match) throw new Error("Archivo XLSX invalido o incompleto.");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error("El archivo XLSX supera el limite permitido.");
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error("El archivo seleccionado no es un XLSX valido. Descargar la plantilla vigente y guardar el archivo como Libro de Excel (.xlsx).");
  }
  return buffer;
}

async function readPortfolioWorkbook(fileDataUrl) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(dataUrlBuffer(fileDataUrl));
  } catch (error) {
    const message = String(error && error.message || "");
    if (message.startsWith("El archivo")) throw error;
    throw new Error("No se pudo abrir el Excel. Verificar que sea un archivo .xlsx real, no protegido y generado con la plantilla vigente.");
  }
  const worksheet = workbook.worksheets.find((sheet) => sheet.actualRowCount > 0);
  if (!worksheet) throw new Error("El Excel no contiene hojas con datos.");
  let headerRowNumber = 0;
  let headerMap = new Map();
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerRowNumber) return;
    const candidate = new Map();
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const alias = PORTFOLIO_HEADER_ALIASES.get(normalizedPortfolioHeader(portfolioCellValue(cell.value)));
      if (alias) candidate.set(columnNumber, alias);
    });
    if (candidate.has("x")) return;
    if ([...candidate.values()].includes("Descripcion") && candidate.size >= 5) {
      headerRowNumber = rowNumber;
      headerMap = candidate;
    }
  });
  if (!headerRowNumber) throw new Error("No se encontro una fila de encabezados valida. Descargar y usar la plantilla vigente.");
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const record = {};
    headerMap.forEach((field, columnNumber) => {
      record[field] = portfolioCellValue(row.getCell(columnNumber).value);
    });
    const description = String(record.Descripcion || "").trim();
    if (!description || normalizeSearchText(description).startsWith("valoracion stock")) return;
    record.__row = rowNumber;
    rows.push(record);
  });
  if (!rows.length) throw new Error("El Excel no contiene productos para procesar.");
  return { rows, sheetName: worksheet.name, headerRowNumber };
}

function portfolioComparableProduct(raw) {
  return {
    id: String(raw.ID_Sistema || raw.id || raw.codigo_producto || "").trim(),
    description: String(raw.Descripcion || raw.name || raw.descripcion || "").trim(),
    stock: Math.max(0, numeric(raw.Stock ?? raw.stock, 0)),
    cost: Math.max(0, numeric(raw.Costo ?? raw.cost, 0)),
    prices: [1, 2, 3, 4, 5].map((number) => Math.max(0, numeric(raw[number === 2 ? "Lista_2_Preventa" : `Lista_${number}`] ?? raw[`precio_lista_${number}`], 0))),
    unit: String(raw.Unidad_Medida || raw.unidad_venta || raw.unidad || "unidad").trim() || "unidad",
    supplierCode: String(raw.Codigo_Proveedor || raw.codigo_proveedor || "").trim(),
    subrubric: String(raw.Subrubro || raw.subrubro || raw.rubro || "S/D").trim() || "S/D",
    category: String(raw.Categoria || raw.categoria || raw.familia || "S/D").trim() || "S/D",
    barcode: String(raw.Codigo_Barras || raw.codigo_barras || "").trim(),
    active: !String(raw.Activo || raw.activo || "SI").trim().toUpperCase().startsWith("NO"),
    notes: String(raw.Observaciones_Importacion || "").trim(),
    row: numeric(raw.__row, 0)
  };
}

function portfolioProductIdentity(product) {
  return String(product.id || product.codigo_producto || product.code || "").trim();
}

function previewProductPortfolio(state, rawRows, meta = {}) {
  const products = Array.isArray(state.products) ? state.products : [];
  const byId = new Map(products.map((product) => [normalizeSearchText(portfolioProductIdentity(product)), product]).filter(([key]) => key));
  const byBarcode = new Map(products.map((product) => [normalizeSearchText(product.codigo_barras), product]).filter(([key]) => key));
  const bySupplierCode = new Map(products.map((product) => [normalizeSearchText(product.codigo_proveedor), product]).filter(([key]) => key));
  const byName = new Map(products.map((product) => [normalizeSearchText(product.name || product.descripcion), product]).filter(([key]) => key));
  const matchedIds = new Set();
  const duplicateKeys = new Set();
  const incomingKeys = new Set();
  const rows = rawRows.map((raw) => {
    const incoming = portfolioComparableProduct(raw);
    const incomingKey = normalizeSearchText(incoming.id || incoming.barcode || incoming.supplierCode || incoming.description);
    if (incomingKeys.has(incomingKey)) duplicateKeys.add(incomingKey);
    incomingKeys.add(incomingKey);
    let match = null;
    let matchType = "";
    if (incoming.id && byId.has(normalizeSearchText(incoming.id))) { match = byId.get(normalizeSearchText(incoming.id)); matchType = "ID sistema"; }
    else if (incoming.barcode && byBarcode.has(normalizeSearchText(incoming.barcode))) { match = byBarcode.get(normalizeSearchText(incoming.barcode)); matchType = "Codigo de barras"; }
    else if (incoming.supplierCode && bySupplierCode.has(normalizeSearchText(incoming.supplierCode))) { match = bySupplierCode.get(normalizeSearchText(incoming.supplierCode)); matchType = "Codigo proveedor"; }
    else if (incoming.description && byName.has(normalizeSearchText(incoming.description))) { match = byName.get(normalizeSearchText(incoming.description)); matchType = "Descripcion exacta"; }
    if (match) matchedIds.add(portfolioProductIdentity(match) || match.name);
    const previous = match ? portfolioComparableProduct(match) : null;
    const fields = previous ? [
      ["Descripcion", previous.description, incoming.description], ["Stock", previous.stock, incoming.stock],
      ["Costo", previous.cost, incoming.cost], ["Lista 1", previous.prices[0], incoming.prices[0]],
      ["Lista 2", previous.prices[1], incoming.prices[1]], ["Lista 3", previous.prices[2], incoming.prices[2]],
      ["Lista 4", previous.prices[3], incoming.prices[3]], ["Lista 5", previous.prices[4], incoming.prices[4]],
      ["Unidad", previous.unit, incoming.unit], ["Codigo proveedor", previous.supplierCode, incoming.supplierCode],
      ["Subrubro", previous.subrubric, incoming.subrubric], ["Categoria", previous.category, incoming.category],
      ["Codigo barras", previous.barcode, incoming.barcode], ["Activo", previous.active, incoming.active]
    ].filter(([, before, after]) => String(before) !== String(after)).map(([field, before, after]) => ({ field, before, after })) : [];
    return {
      row: incoming.row,
      key: incomingKey || `fila-${incoming.row}`,
      incoming,
      matchedProductId: match ? portfolioProductIdentity(match) : "",
      matchedProductName: match ? match.name : "",
      matchType,
      action: match ? (fields.length ? "ACTUALIZAR" : "SIN_CAMBIOS") : "REQUIERE_HOMOLOGACION",
      changes: fields,
      errors: duplicateKeys.has(incomingKey) ? ["Identificador o descripcion duplicada dentro del archivo."] : []
    };
  });
  const missing = products.filter((product) => !matchedIds.has(portfolioProductIdentity(product) || product.name)).map((product) => ({
    id: portfolioProductIdentity(product), name: product.name, active: String(product.activo || "SI").toUpperCase() !== "NO"
  }));
  const token = crypto.randomBytes(18).toString("hex");
  const preview = {
    token,
    createdAt: new Date().toISOString(),
    fileName: String(meta.fileName || "cartera.xlsx").slice(0, 180),
    sheetName: meta.sheetName || "",
    rows,
    missing,
    summary: {
      total: rows.length,
      updates: rows.filter((row) => row.action === "ACTUALIZAR").length,
      unchanged: rows.filter((row) => row.action === "SIN_CAMBIOS").length,
      unresolved: rows.filter((row) => row.action === "REQUIERE_HOMOLOGACION").length,
      errors: rows.filter((row) => row.errors.length).length,
      missing: missing.length
    }
  };
  productPortfolioPreviews.set(token, preview);
  while (productPortfolioPreviews.size > 20) productPortfolioPreviews.delete(productPortfolioPreviews.keys().next().value);
  return preview;
}

function applyHomologatedPortfolioImport(state, preview, input, user) {
  const resolutions = input.resolutions && typeof input.resolutions === "object" ? input.resolutions : {};
  const inactivateIds = new Set(Array.isArray(input.inactivateIds) ? input.inactivateIds.map(String) : []);
  const products = Array.isArray(state.products) ? state.products : [];
  const backup = createMaintenanceBackup("importar-cartera-homologada", state);
  const applied = [];
  preview.rows.forEach((row) => {
    if (row.errors.length) return;
    const resolution = String(resolutions[row.key] || row.action).toUpperCase();
    if (["OMITIR", "SIN_CAMBIOS", "REQUIERE_HOMOLOGACION"].includes(resolution)) return;
    const incoming = row.incoming;
    let index = row.matchedProductId ? products.findIndex((product) => portfolioProductIdentity(product) === row.matchedProductId) : -1;
    if (resolution === "ACTUALIZAR" && index < 0) throw new Error(`No se encontro el producto a actualizar en fila ${row.row}.`);
    if (resolution === "ALTA" && index >= 0) throw new Error(`La fila ${row.row} ya esta homologada y no puede duplicarse.`);
    const previous = index >= 0 ? products[index] : null;
    const nextId = previous ? portfolioProductIdentity(previous) : incoming.id || `PRD-${Date.now()}-${row.row}`;
    const next = normalizeImportedProductRecord({
      ...(previous || {}), codigo_producto: nextId, descripcion: incoming.description, stock: incoming.stock,
      costo: incoming.cost, lista_1: incoming.prices[0], lista_2: incoming.prices[1], lista_3: incoming.prices[2],
      lista_4: incoming.prices[3], lista_5: incoming.prices[4], unidad: incoming.unit,
      codigo_proveedor: incoming.supplierCode, subrubro: incoming.subrubric, categoria: incoming.category,
      codigo_barras: incoming.barcode, activo: incoming.active ? "SI" : "NO", origen: "importacion-cartera-homologada"
    }, row.row - 1);
    next.rubro = incoming.subrubric;
    next.familia = incoming.category;
    next.subrubro = incoming.subrubric;
    next.categoria = incoming.category;
    next.codigo_proveedor = incoming.supplierCode;
    next.updatedBy = user.name;
    if (index >= 0) products[index] = next; else products.push(next);
    applied.push({ action: index >= 0 ? "ACTUALIZAR" : "ALTA", id: nextId, name: next.name, previous, next });
  });
  const inactivated = [];
  products.forEach((product, index) => {
    const id = portfolioProductIdentity(product);
    if (!inactivateIds.has(id)) return;
    const previous = { ...product };
    products[index] = { ...product, activo: "NO", updatedAt: new Date().toISOString(), updatedBy: user.name };
    inactivated.push({ action: "INACTIVAR", id, name: product.name, previous, next: products[index] });
  });
  state.products = products;
  ensurePriceListsState(state);
  const record = {
    id: `PORT-${Date.now()}`, at: new Date().toISOString(), user: user.name, username: user.username || "",
    action: "IMPORTACION_CARTERA_HOMOLOGADA", source: preview.fileName, previousCount: products.length - applied.filter((item) => item.action === "ALTA").length,
    newCount: products.length, updated: applied.filter((item) => item.action === "ACTUALIZAR").length,
    created: applied.filter((item) => item.action === "ALTA").length, inactivated: inactivated.length,
    unresolved: preview.summary.unresolved - applied.filter((item) => item.action === "ALTA").length, backup
  };
  state.productPortfolioAudit = Array.isArray(state.productPortfolioAudit) ? state.productPortfolioAudit : [];
  const detailAudit = [...applied, ...inactivated].map((item, index) => ({
    id: `${record.id}-${String(index + 1).padStart(4, "0")}`,
    at: record.at,
    user: user.name,
    username: user.username || "",
    action: item.action,
    productId: item.id,
    product: item.name,
    previousValue: item.previous,
    newValue: item.next,
    motive: String(input.motive || input.motivo || "Importacion homologada").trim(),
    source: preview.fileName
  }));
  state.productPortfolioAudit.unshift(record, ...detailAudit);
  state.productPortfolioAudit = state.productPortfolioAudit.slice(0, 10000);
  orderEngine.migrateState(state);
  return { record, backup, applied, inactivated };
}

async function portfolioTemplateBase64() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Grupo Rocha Solutions";
  const sheet = workbook.addWorksheet("Cartera");
  sheet.addRow(PORTFOLIO_TEMPLATE_COLUMNS);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "Q1" };
  sheet.columns = PORTFOLIO_TEMPLATE_COLUMNS.map((header) => ({ header, key: header, width: Math.max(14, Math.min(34, header.length + 4)) }));
  sheet.addRow(["ACTUALIZAR", "COD-001", "Producto ejemplo", 10, 100, 130, 140, 150, 160, 170, "unidad", "", "Rubro", "Categoria", "", "SI", "Fila de ejemplo: eliminar antes de importar"]);
  return Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");
}

async function reportWorkbookBase64(input, user) {
  const headers = Array.isArray(input.headers) ? input.headers.map((value) => String(value || "").slice(0, 80)) : [];
  const rows = Array.isArray(input.rows) ? input.rows.slice(0, 50000) : [];
  if (!headers.length || headers.length > 40) throw new Error("El reporte no tiene columnas validas.");
  if (rows.some((row) => !Array.isArray(row) || row.length !== headers.length)) throw new Error("El reporte contiene filas invalidas.");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Grupo Rocha Solutions";
  workbook.lastModifiedBy = user.name || user.username || "Administracion";
  workbook.created = new Date();
  const sheetName = String(input.sheetName || "Reporte").replace(/[\\/*?:\[\]]/g, " ").slice(0, 31) || "Reporte";
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row.map((value) => value == null ? "" : value)));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  sheet.columns.forEach((column, index) => {
    const values = [headers[index], ...rows.slice(0, 500).map((row) => row[index])];
    column.width = Math.max(12, Math.min(48, values.reduce((max, value) => Math.max(max, String(value == null ? "" : value).length), 0) + 2));
  });
  sheet.eachRow((row, number) => {
    if (number > 1 && number % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F4" } };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");
}

function applyProductPortfolioImport(state, products, user, input = {}) {
  if (!Array.isArray(products) || !products.length) throw new Error("La importacion no contiene productos.");
  const normalized = products.map(normalizeImportedProductRecord);
  const backup = createMaintenanceBackup("importar-cartera-productos", state);
  const previousCount = Array.isArray(state.products) ? state.products.length : 0;
  state.products = normalized;
  state.priceLists = [];
  ensurePriceListsState(state);
  state.activity = Array.isArray(state.activity) ? state.activity : [];
  state.activity.unshift({
    type: "Productos",
    title: "Cartera de productos importada",
    text: `${normalized.length} productos reemplazaron ${previousCount}. Backup: ${backup.id}.`
  });
  const record = {
    id: `PORT-${Date.now()}`,
    at: new Date().toISOString(),
    user: user && user.name || "Administracion",
    username: user && user.username || "",
    action: "IMPORTACION_CARTERA_PRODUCTOS",
    source: String(input.source || input.fileName || input.file || "JSON normalizado").trim(),
    previousCount,
    newCount: normalized.length,
    backup
  };
  state.productPortfolioAudit = Array.isArray(state.productPortfolioAudit) ? state.productPortfolioAudit : [];
  state.productPortfolioAudit.unshift(record);
  state.productPortfolioAudit = state.productPortfolioAudit.slice(0, 500);
  return { imported: normalized.length, previousCount, backup, audit: record };
}

function validIsoOrNow(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizePriceListStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("program")) return "Programada";
  if (text.includes("inactiv")) return "Inactiva";
  if (text.includes("histor")) return "Historica";
  if (text.includes("borr")) return "Borrador";
  if (text.includes("act")) return "Activa";
  return "Borrador";
}

function roundPriceValue(value, rounding) {
  const amount = Math.max(0, numeric(value, 0));
  const step = Math.max(0, numeric(rounding, 0));
  if (!step || step <= 1) return Math.round(amount);
  return Math.ceil(amount / step) * step;
}

function priceListProductMatches(product, input = {}) {
  const operation = String(input.operation || input.mode || "general").toLowerCase();
  const productKey = normalizeSearchText(input.productKey || input.productCode || input.product || "");
  if (operation === "individual") {
    if (!productKey) return false;
    return [
      product.codigo_producto,
      product.codigo_barras,
      product.name,
      product.descripcion
    ].some((value) => normalizeSearchText(value) === productKey || normalizeSearchText(value).includes(productKey));
  }
  if (operation === "rubro") return sameText(product.rubro, input.rubro);
  if (operation === "marca") return sameText(product.marca, input.marca);
  if (operation === "proveedor") return sameText(product.proveedor || product.supplier, input.proveedor || input.supplier);
  return true;
}

function computePriceListSimulation(state, input = {}) {
  ensurePriceListsState(state);
  const operation = String(input.operation || input.mode || "general").toLowerCase();
  const rounding = Math.max(0, numeric(input.rounding ?? input.redondeo, 1));
  const increasePct = numeric(input.increasePct ?? input.porcentaje_aumento, 0);
  const marginPct = numeric(input.marginPct ?? input.porcentaje_margen, 0);
  const fixedPrice = numeric(input.fixedPrice ?? input.price ?? input.precio_venta, NaN);
  const products = (Array.isArray(state.products) ? state.products : []).filter((product) => priceListProductMatches(product, { ...input, operation }));
  const items = products.map((product) => {
    const previousPrice = currentProductPrice(product);
    const cost = Math.max(0, numeric(product.costo ?? product.cost, 0));
    let nextPrice = previousPrice;
    if (Number.isFinite(fixedPrice) && fixedPrice > 0) {
      nextPrice = fixedPrice;
    } else if (marginPct > 0 && cost > 0) {
      nextPrice = cost * (1 + marginPct / 100);
    } else {
      nextPrice = previousPrice * (1 + increasePct / 100);
    }
    nextPrice = roundPriceValue(nextPrice, rounding);
    return priceListItemFromProduct(product, {
      previousPrice,
      price: nextPrice,
      increasePct,
      marginPct,
      percentApplied: previousPrice > 0 ? ((nextPrice - previousPrice) / previousPrice) * 100 : 0
    });
  });
  const totals = items.reduce((acc, item) => {
    acc.previous += item.previousPrice;
    acc.next += item.price;
    acc.difference += item.difference;
    return acc;
  }, { previous: 0, next: 0, difference: 0 });
  return {
    operation,
    affected: items.length,
    items,
    totals,
    sample: items.slice(0, 120),
    rounding,
    increasePct,
    marginPct
  };
}

function activatePriceList(state, list, userName, motive) {
  ensurePriceListsState(state);
  const byKey = new Map(list.items.map((item) => [
    normalizeSearchText(item.productCode || item.productName || item.codigo_barras),
    item
  ]));
  state.products = (Array.isArray(state.products) ? state.products : []).map((product) => {
    const keys = [
      normalizeSearchText(product.codigo_producto),
      normalizeSearchText(product.codigo_barras),
      normalizeSearchText(product.name),
      normalizeSearchText(product.descripcion)
    ].filter(Boolean);
    const item = keys.map((key) => byKey.get(key)).find(Boolean);
    if (!item) return product;
    const price = Math.max(0, numeric(item.price ?? item.newPrice, currentProductPrice(product)));
    return {
      ...product,
      price,
      precio_lista_2: price,
      priceListId: list.id,
      priceListName: list.name,
      priceUpdatedAt: list.updatedAt || new Date().toISOString(),
      priceUpdatedBy: userName || "Sistema"
    };
  });
  state.priceLists.forEach((item) => {
    if (item.id !== list.id && item.isDefault && item.status === "Activa") {
      item.isDefault = false;
      item.status = "Historica";
    }
  });
  list.status = "Activa";
  list.isDefault = true;
  list.activatedAt = new Date().toISOString();
  list.activatedBy = userName || "Sistema";
  list.motive = motive || list.motive || "";
  return list;
}

function appendPriceListAudit(state, list, simulation, input, userName) {
  ensurePriceListsState(state);
  const at = new Date().toISOString();
  const parts = auditLocalParts(at);
  const motive = String(input.motive || input.motivo || "").trim();
  const operation = String(input.operation || simulation.operation || "general");
  const entries = simulation.items.map((item) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"),
    at,
    date: parts.date,
    time: parts.time,
    user: userName || "Sistema",
    username: userName || "Sistema",
    operation,
    motive,
    listId: list.id,
    listName: list.name,
    productCode: item.productCode,
    productName: item.productName,
    previousPrice: item.previousPrice,
    newPrice: item.price,
    difference: item.difference,
    percentApplied: item.percentApplied,
    mode: simulation.operation
  }));
  state.priceListAudit.unshift(...entries);
  state.priceListAudit = state.priceListAudit.slice(0, 10000);
  return entries;
}

function applyPriceListChange(state, input, user) {
  ensurePriceListsState(state);
  if (!input || input.confirmed !== true) throw new Error("La modificacion de precios requiere confirmacion administrativa.");
  const motive = String(input.motive || input.motivo || "").trim();
  if (!motive) throw new Error("Indicar motivo del cambio de lista de precios.");
  const simulation = computePriceListSimulation(state, input);
  if (!simulation.affected) throw new Error("No hay productos afectados por la seleccion.");
  const now = new Date();
  const effectiveAt = validIsoOrNow(input.effectiveAt || input.vigencia || now.toISOString());
  const scheduled = new Date(effectiveAt).getTime() > now.getTime();
  const requestedStatus = normalizePriceListStatus(input.status || input.estado || "Activa");
  const status = scheduled && !["Borrador", "Inactiva"].includes(requestedStatus) ? "Programada" : requestedStatus;
  const listId = String(input.listId || "").trim() || `PL-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const existingIndex = state.priceLists.findIndex((list) => list.id === listId);
  const list = {
    id: listId,
    name: String(input.name || input.listName || "Lista de precios").trim() || "Lista de precios",
    status,
    effectiveAt,
    isDefault: false,
    productCount: simulation.affected,
    updatedAt: now.toISOString(),
    updatedBy: user && user.name || "Administracion",
    rounding: simulation.rounding,
    operation: simulation.operation,
    motive,
    filters: {
      productKey: String(input.productKey || input.productCode || input.product || ""),
      rubro: String(input.rubro || ""),
      marca: String(input.marca || ""),
      proveedor: String(input.proveedor || input.supplier || "")
    },
    items: simulation.items
  };
  if (existingIndex >= 0) state.priceLists[existingIndex] = list;
  else state.priceLists.unshift(list);
  const appliedNow = status === "Activa" && new Date(effectiveAt).getTime() <= now.getTime();
  if (appliedNow) activatePriceList(state, list, user && user.name || "Administracion", motive);
  const auditEntries = appendPriceListAudit(state, list, simulation, input, user && user.name);
  state.activity = Array.isArray(state.activity) ? state.activity : [];
  state.activity.unshift({
    type: "Precios",
    title: appliedNow ? `${list.name} aplicada` : `${list.name} ${status.toLowerCase()}`,
    text: `${simulation.affected} productos afectados por ${user && user.name || "Administracion"}. Motivo: ${motive}.`
  });
  return { list, simulation, appliedNow, auditRows: auditEntries.length };
}

function applyDuePriceLists(state, actor = "Sistema") {
  ensurePriceListsState(state);
  const now = Date.now();
  const due = state.priceLists
    .filter((list) => list.status === "Programada" && new Date(list.effectiveAt).getTime() <= now)
    .sort((a, b) => new Date(a.effectiveAt) - new Date(b.effectiveAt));
  due.forEach((list) => {
    const simulation = {
      operation: list.operation || "programada",
      affected: Array.isArray(list.items) ? list.items.length : 0,
      items: Array.isArray(list.items) ? list.items : [],
      rounding: list.rounding,
      increasePct: 0,
      marginPct: 0
    };
    activatePriceList(state, list, actor, list.motive || "Vigencia programada alcanzada");
    appendPriceListAudit(state, list, simulation, { operation: list.operation || "programada", motive: list.motive || "Vigencia programada alcanzada" }, actor);
  });
  return due.length;
}

function padText(value, size) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length > size) return text.slice(0, Math.max(0, size - 1)) + " ";
  return text.padEnd(size, " ");
}

function moneyText(value) {
  return `$ ${Math.round(numeric(value, 0)).toLocaleString("es-AR")}`;
}

function buildStockReportText(state, user, filter) {
  const products = filteredStockProducts(state, filter);
  const header = [
    "DISTRIBUIDORA LOPEZ - REPORTE DE STOCK",
    `Fecha: ${new Date().toLocaleString("es-AR")}`,
    `Administrador: ${user.name} (${user.username})`,
    `Filtro texto: ${(filter && filter.searchTerm) || "Todos"}`,
    `Filtro estado: ${(filter && filter.statusFilter) || "all"}`,
    `Filtro rubro: ${(filter && filter.rubricFilter) || "all"}`,
    `Filtro marca: ${(filter && filter.brandFilter) || "all"}`,
    `Productos listados: ${products.length}`,
    "",
    `${padText("CODIGO", 12)} ${padText("PRODUCTO", 32)} ${padText("FIS", 7)} ${padText("RES", 7)} ${padText("DISP", 7)} ${padText("TRANS", 7)} ${padText("MIN", 7)} ${padText("PRECIO", 14)} ESTADO`,
    "-".repeat(125)
  ];

  const rows = products.map((product) => {
    const status = stockStatus(product);
    const name = product.name || product.descripcion || "";
    const stock = orderEngine.inventory(product);
    const min = numeric(product.stock_minimo ?? product.min, 0);
    const price = numeric(product.precio_lista_2 ?? product.price, 0);
    return `${padText(product.codigo_producto || "S/C", 12)} ${padText(name, 32)} ${padText(stock.physical, 7)} ${padText(stock.reserved, 7)} ${padText(stock.available, 7)} ${padText(stock.inTransit, 7)} ${padText(min, 7)} ${padText(moneyText(price), 14)} ${status.label}`;
  });

  return [...header, ...rows, "", "Fin del reporte."].join("\r\n");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: process.platform === "win32",
      ...options
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      reject(new Error(`No se pudo ejecutar ${command}: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error((stderr || stdout || `${command} finalizo con codigo ${code}`).trim()));
      }
    });
  });
}

function runPowerShellScript(scriptPath, args) {
  return runCommand("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    ...args
  ]);
}

function printTextFile(reportFile) {
  if (process.platform === "win32") {
    const args = ["-ReportFile", reportFile];
    if (STOCK_PRINTER_NAME) args.push("-PrinterName", STOCK_PRINTER_NAME);
    return runPowerShellScript(STOCK_PRINT_SCRIPT, args);
  }

  if (process.platform === "darwin" || process.platform === "linux") {
    const args = [];
    if (STOCK_PRINTER_NAME) args.push("-d", STOCK_PRINTER_NAME);
    args.push(reportFile);
    return runCommand("lp", args).then((output) => output || `Trabajo enviado a ${STOCK_PRINTER_NAME || "impresora predeterminada"}.`);
  }

  return Promise.reject(new Error(`Impresion directa no soportada en ${process.platform}.`));
}

async function printStockReport(state, user, filter) {
  ensureDataFiles();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFile = path.join(PRINT_DIR, `stock-${stamp}.txt`);
  const reportText = buildStockReportText(state, user, filter || {});
  fs.writeFileSync(reportFile, reportText, "utf8");
  const result = await printTextFile(reportFile);
  fs.appendFileSync(PRINT_LOG, JSON.stringify({
    at: new Date().toISOString(),
    user: user.username,
    reportFile,
    printer: STOCK_PRINTER_NAME || "DEFAULT",
    filter: filter || {},
    result
  }) + "\n", "utf8");
  return { reportFile, result };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Request too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveFile(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  if (pathname === "/config.js") {
    const envGoogleMapsKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim();
    const supportPhone = String(process.env.DL_SUPPORT_WHATSAPP_PHONE || "").trim();
    const connectionConfig = {
      API_BASE_URL: String(process.env.DL_API_BASE_URL || "").trim(),
      API_PORT: Number(process.env.DL_API_PORT || PORT),
      SOCKET_URL: String(process.env.DL_SOCKET_URL || "").trim(),
      SERVER_NAME: String(process.env.DL_SERVER_NAME || "SERVIDOR_UNICO_8790").trim(),
      MAGIC_DNS_HOST: String(process.env.DL_MAGIC_DNS_HOST || "").trim(),
      VERSION: APP_RUNTIME_VERSION,
      TIMEOUTS: {
        server: Number(process.env.DL_TIMEOUT_SERVER_MS || 7000),
        health: Number(process.env.DL_TIMEOUT_HEALTH_MS || 4500),
        loginGrace: Number(process.env.DL_TIMEOUT_LOGIN_GRACE_MS || 30000),
        healthRetries: [0, 800, 1600, 3000, 5000],
        loginRetries: [0, 800, 1600, 3000, 5000],
        syncInterval: Number(process.env.DL_SYNC_INTERVAL_MS || 2500),
        mobileSyncInterval: Number(process.env.DL_MOBILE_SYNC_INTERVAL_MS || 7000)
      }
    };
    const googleMapsKey = envGoogleMapsKey && envGoogleMapsKey !== "api-key-de-google-maps"
      ? envGoogleMapsKey
      : "AIzaSyAL2oUZwVG9XoZaj4QLr6jBh29mjHrx4pU";
    send(
      res,
      200,
      "text/javascript; charset=utf-8",
      `window.DL_CONNECTION_CONFIG = ${JSON.stringify(connectionConfig)};\nwindow.DL_CONFIG = { USE_GOOGLE_MAPS: true, GOOGLE_MAPS_API_KEY: ${JSON.stringify(googleMapsKey)} };\nwindow.DL_SUPPORT_WHATSAPP_PHONE = ${JSON.stringify(supportPhone || "5493512410535")};\n`
    );
    return;
  }

  const file = path.resolve(ROOT, pathname.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, "text/plain; charset=utf-8", "Not found");
    return;
  }

  send(res, 200, TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", fs.readFileSync(file));
}

const server = http.createServer(async (req, res) => {
  try {
    res._acceptEncoding = req.headers["accept-encoding"] || "";
    if (req.method === "OPTIONS") {
      send(res, 204, "text/plain", "");
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const runtimeSecurity = securityEngine.verifyRuntime(false);
    if (!runtimeSecurity.allowed && requestUrl.pathname !== "/api/health") {
      sendJson(res, 423, {
        ok: false,
        error: "Instalacion no habilitada. Contactar a soporte tecnico.",
        security: publicSecurityStatus(runtimeSecurity, false)
      });
      return;
    }
    if (requestUrl.pathname === "/api/login" && req.method === "POST") {
      const body = await readBody(req);
      const credentials = JSON.parse(body || "{}");
      const username = String(credentials.username || "").trim().toLowerCase();
      const user = readUsers().find((item) => item.username.toLowerCase() === username && item.active !== false);
      if (!user || !verifyPassword(credentials.password || "", user)) {
        appendAuditToStateFile(req, null, { username }, {
          action: "LOGIN_FALLIDO",
          entityType: "sesion",
          entityId: username,
          entityLabel: username,
          previousValue: null,
          newValue: { username, ok: false },
          note: "Usuario o clave incorrectos"
        });
        sendJson(res, 401, { ok: false, error: "Usuario o clave incorrectos." });
        return;
      }
      const config = readSessionConfig();
      const device = normalizeDevice(credentials.device || credentials, req);
      const ip = clientIp(req);
      const publicAccount = publicUser(user);
      const legalPayload = readStateFileCached();
      const legalState = legalPayload.state || {};
      legalEngine.migrateState(legalState);
      const legalVersion = legalState.legalSettings.currentVersion;
      const legalHash = legalState.legalSettings.hash;
      const hasCurrentLegalAcceptance = (legalState.legalAcceptances || []).some((item) => String(item.username || "").trim().toLowerCase() === user.username.toLowerCase()
        && item.version === legalVersion
        && item.hash === legalHash
        && item.revoked !== true);
      const providedLegalAcceptance = credentials.legalAcceptance || null;
      const hasValidProvidedLegalAcceptance = Boolean(providedLegalAcceptance
        && providedLegalAcceptance.accepted === true
        && providedLegalAcceptance.version === legalVersion
        && providedLegalAcceptance.hash === legalHash);
      if (!hasCurrentLegalAcceptance) {
        if (!hasValidProvidedLegalAcceptance) {
          sendJson(res, 428, {
            ok: false,
            code: "TERMS_REQUIRED",
            error: "Debe aceptar los terminos y condiciones vigentes para ingresar.",
            legal: legalEngine.publicLegalPacket(legalState),
            user: publicAccount
          });
          return;
        }
        const acceptedAt = new Date().toISOString();
        const parts = auditLocalParts(acceptedAt);
        const acceptanceRecord = legalEngine.registerAcceptance(legalState, publicAccount, {
          at: acceptedAt,
          date: parts.date,
          time: parts.time,
          ip,
          device,
          gps: normalizeGps(credentials.gps),
          userAgent: req.headers["user-agent"] || ""
        });
        const legalAudit = auditEntry(req, publicAccount, credentials, {
          action: "TERMINOS_ACEPTADOS",
          entityType: "legal",
          entityId: acceptanceRecord.version,
          entityLabel: acceptanceRecord.title,
          previousValue: null,
          newValue: acceptanceRecord,
          note: "Aceptacion electronica previa al ingreso."
        });
        appendGlobalAudit(legalState, legalAudit);
        eventEngine.emitFromAuditEntries(legalState, legalAudit);
        writeState(legalState);
      }
      const active = activeSessionsForUsername(user.username);
      const differentActive = active.filter((item) => item.session.device.id !== device.id);
      if (differentActive.length && config.duplicatePolicy === "reject") {
        writeSessionAudit("MULTIPLE_LOGIN_REJECTED", null, {
          username: user.username,
          user: user.name,
          role: user.role,
          deviceId: device.id,
          deviceLabel: device.label,
          ip,
          gps: normalizeGps(credentials.gps),
          note: `Sesion activa en ${differentActive[0].session.device.label || differentActive[0].session.device.id}`
        });
        appendAuditToStateFile(req, publicUser(user), credentials, {
          action: "LOGIN_MULTIPLE_RECHAZADO",
          entityType: "sesion",
          entityId: user.username,
          entityLabel: user.name,
          previousValue: publicSession(differentActive[0].session),
          newValue: { username: user.username, device },
          note: "Politica de sesion unica rechazo el acceso"
        });
        sendJson(res, 409, {
          ok: false,
          error: "El usuario ya tiene una sesion activa en otro dispositivo.",
          code: "DUPLICATE_SESSION",
          activeSession: publicSession(differentActive[0].session),
          policy: config.duplicatePolicy
        });
        return;
      }
      active.forEach((item) => {
        closeSession(item.token, item.session.device.id === device.id ? "login-renewed" : "replaced-by-new-device", user.name);
      });
      const token = crypto.randomBytes(32).toString("hex");
      const now = new Date().toISOString();
      const loginGps = normalizeGps(credentials.gps);
      const loginGpsReject = gpsRejectReason(loginGps);
      if (loginGpsReject) {
        recordRejectedGps(req, { user: publicAccount, device }, credentials, loginGps, loginGpsReject);
      }
      const ttlMs = sessionTtlMs(config);
      const session = {
        token,
        sessionId: crypto.randomBytes(12).toString("hex"),
        user: publicAccount,
        device,
        ip,
        startedAt: now,
        lastSeenAt: now,
        lastHeartbeatAt: now,
        lastPresenceAt: now,
        lastSyncAt: now,
        lastGpsAt: "",
        expiresAt: Date.now() + ttlMs,
        presenceStatus: user.role === "driver" ? "En Reparto" : "Disponible",
        location: loginGpsReject ? null : loginGps,
        userAgent: req.headers["user-agent"] || ""
      };
      if (session.location) session.lastGpsAt = session.location.updatedAt;
      sessions.set(token, session);
      writeSessionAudit("SESSION_STARTED", session, { note: active.length ? "Inicio con reemplazo de sesion anterior" : "Inicio de sesion" });
      appendAuditToStateFile(req, publicAccount, credentials, {
        action: "SESSION_STARTED",
        entityType: "sesion",
        entityId: session.sessionId,
        entityLabel: publicAccount.name,
        previousValue: active.map((item) => publicSession(item.session)),
        newValue: publicSession(session),
        note: active.length ? "Inicio con reemplazo de sesion anterior" : "Inicio de sesion"
      });
      sendJson(res, 200, {
        ok: true,
        user: publicAccount,
        session: publicSession(session),
        sessionConfig: config,
        presence: {
          sessions: publicSessions(),
          recent: publicPresenceHistory(30),
          settings: config
        }
      }, { "Set-Cookie": sessionCookie(req, token, Math.floor(ttlMs / 1000)) });
      return;
    }

    if (requestUrl.pathname === "/api/legal" && req.method === "GET") {
      const payload = readStateFileCached();
      const currentState = payload.state || {};
      legalEngine.migrateState(currentState);
      sendJson(res, 200, {
        ok: true,
        legal: legalEngine.publicLegalPacket(currentState),
        copyright: legalEngine.COPYRIGHT_TEXT,
        version: APP_RUNTIME_VERSION
      });
      return;
    }

    if (requestUrl.pathname === "/api/password-recovery" && req.method === "POST") {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const username = String(payload.username || "").trim().toLowerCase();
      const user = readUsers().find((item) => item.username.toLowerCase() === username && item.active !== false);
      const remoteAddress = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "desconocido";
      const line = JSON.stringify({
        at: new Date().toISOString(),
        username,
        found: Boolean(user),
        remoteAddress,
        userAgent: req.headers["user-agent"] || ""
      });
      fs.appendFileSync(PASSWORD_RECOVERY_LOG, `${line}\n`, "utf8");
      appendAuditToStateFile(req, user ? publicUser(user) : null, { username }, {
        action: "PASSWORD_RECOVERY_SOLICITADO",
        entityType: "sesion",
        entityId: username,
        entityLabel: username,
        previousValue: null,
        newValue: { username, found: Boolean(user) },
        note: "Solicitud de recupero de clave"
      });
      sendJson(res, 200, {
        ok: true,
        message: "Solicitud registrada. Administracion o soporte tecnico debe restablecer la clave del usuario."
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/reauth" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const users = readUsers();
      const user = users.find((item) => item.username.toLowerCase() === sessionUser.username.toLowerCase() && item.active !== false);
      if (!user || !verifyPassword(payload.password || "", user)) {
        sendJson(res, 401, { ok: false, error: "Clave de administrador incorrecta." });
        return;
      }
      sendJson(res, 200, { ok: true, user: publicUser(user), validatedAt: new Date().toISOString() });
      return;
    }

    if (requestUrl.pathname === "/api/admin/users" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Administracion de usuarios permitida solo para administradores." });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        users: readUsers().map(publicManagedUser),
        roles: MANAGED_USER_ROLES
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/users" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Administracion de usuarios permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      if (!verifyCurrentUserPassword(sessionUser, input.admin_password || input.adminPassword || "")) {
        appendAuditToStateFile(req, sessionUser, input, {
          action: "USUARIO_CLAVE_ADMIN_RECHAZADA",
          entityType: "usuario",
          entityId: String(input.username || input.targetUsername || "").trim().toLowerCase(),
          entityLabel: String(input.name || input.username || input.targetUsername || "").trim(),
          previousValue: null,
          newValue: { username: String(input.username || input.targetUsername || "").trim().toLowerCase() },
          note: "Clave de administrador incorrecta al gestionar usuarios"
        });
        sendJson(res, 401, { ok: false, error: "Clave de administrador incorrecta." });
        return;
      }
      try {
        const users = readUsers();
        const targetUsername = String(input.targetUsername || input.originalUsername || input.username || "").trim().toLowerCase();
        const index = users.findIndex((user) => String(user.username || "").trim().toLowerCase() === targetUsername);
        const previous = index >= 0 ? users[index] : null;
        const next = normalizeManagedUserInput(input, previous, sessionUser);
        const duplicate = users.findIndex((user, userIndex) => userIndex !== index && String(user.username || "").trim().toLowerCase() === next.username);
        if (duplicate >= 0) {
          sendJson(res, 409, { ok: false, error: `El usuario ${next.username} ya existe.` });
          return;
        }
        if (previous && previous.username === sessionUser.username && next.active === false) {
          sendJson(res, 400, { ok: false, error: "No se puede desactivar el usuario administrador conectado." });
          return;
        }
        if (index >= 0) users[index] = next;
        else users.push(next);
        const backup = writeUsersWithBackup(users);
        if (next.active === false) {
          activeSessionsForUsername(next.username).forEach((item) => closeSession(item.token, "disabled-by-admin", sessionUser.name));
        }
        const userAudit = auditEntry(req, sessionUser, input, {
          action: previous ? "USUARIO_ACTUALIZADO" : "USUARIO_CREADO",
          entityType: "usuario",
          entityId: next.username,
          entityLabel: next.name,
          previousValue: publicManagedUser(previous),
          newValue: publicManagedUser(next),
          note: String(input.motive || input.motivo || "Gestion web de usuarios").trim()
        });
        let sellerMigration = null;
        if (previous && previous.role === "seller" && next.role === "seller") {
          const currentPayload = readStateFileCached();
          const currentState = currentPayload.state || {};
          orderEngine.migrateState(currentState);
          sellerMigration = propagateSellerIdentity(currentState, previous, next);
          appendGlobalAudit(currentState, userAudit);
          eventEngine.emitFromAuditEntries(currentState, userAudit);
          if (sellerMigration) {
            const migrationAudit = auditEntry(req, sessionUser, input, {
              action: "VENDEDOR_IDENTIDAD_PROPAGADA",
              entityType: "vendedor",
              entityId: next.username,
              entityLabel: next.sellerName || next.name,
              previousValue: sellerMigration.previousName,
              newValue: sellerMigration,
              note: String(input.motive || input.motivo || "Cambio de identidad visible del vendedor").trim()
            });
            appendGlobalAudit(currentState, migrationAudit);
            eventEngine.emitFromAuditEntries(currentState, migrationAudit);
            orderEngine.refreshSellerMetrics(currentState);
          }
          writeState(currentState);
        } else {
          appendAuditToStateFile(req, sessionUser, input, {
            action: previous ? "USUARIO_ACTUALIZADO" : "USUARIO_CREADO",
            entityType: "usuario",
            entityId: next.username,
            entityLabel: next.name,
            previousValue: publicManagedUser(previous),
            newValue: publicManagedUser(next),
            note: String(input.motive || input.motivo || "Gestion web de usuarios").trim()
          });
        }
        sendJson(res, 200, {
          ok: true,
          user: publicManagedUser(next),
          users: readUsers().map(publicManagedUser),
          backup: backup ? path.basename(backup) : "",
          sellerMigration
        });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo guardar el usuario." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/admin/sessions" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Monitor permitido solo para administradores." });
        return;
      }
      cleanupExpiredSessions();
      sendJson(res, 200, {
        ok: true,
        sessions: publicSessions(),
        recent: publicPresenceHistory(50),
        settings: readSessionConfig()
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/presence/history" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Historial GPS permitido solo para administradores." });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        history: readGpsHistory(Number(requestUrl.searchParams.get("limit") || 200), {
          username: requestUrl.searchParams.get("username") || "",
          role: requestUrl.searchParams.get("role") || "",
          date: requestUrl.searchParams.get("date") || ""
        }),
        recent: publicPresenceHistory(80),
        settings: readSessionConfig()
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/presence/daily-routes" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Recorridos GPS permitidos solo para administradores." });
        return;
      }
      const filters = {
        date: requestUrl.searchParams.get("date") || "",
        username: requestUrl.searchParams.get("username") || "",
        role: requestUrl.searchParams.get("role") || "",
        deviceId: requestUrl.searchParams.get("deviceId") || "",
        startHour: requestUrl.searchParams.get("startHour") || "",
        endHour: requestUrl.searchParams.get("endHour") || ""
      };
      if (requestUrl.searchParams.get("format") === "csv") {
        const csv = dailyGpsRoutesCsv(filters);
        const date = filters.date || localDateKey();
        send(res, 200, "text/csv; charset=utf-8", `\uFEFF${csv}`, {
          "Content-Disposition": `attachment; filename="recorridos-gps-${date}.csv"`
        });
        return;
      }
      sendJson(res, 200, buildDailyGpsRoutes(filters));
      return;
    }

    if (requestUrl.pathname === "/api/admin/session-settings" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Configuracion permitida solo para administradores." });
        return;
      }
      sendJson(res, 200, { ok: true, settings: readSessionConfig() });
      return;
    }

    if (requestUrl.pathname === "/api/admin/session-settings" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Configuracion permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const settings = writeSessionConfig(input);
      writeSessionAudit("SESSION_POLICY_UPDATED", null, {
        username: sessionUser.username,
        user: sessionUser.name,
        role: sessionUser.role,
        ip: clientIp(req),
        note: `Politica duplicados: ${settings.duplicatePolicy}`
      });
      appendAuditToStateFile(req, sessionUser, input, {
        action: "SESSION_POLICY_UPDATED",
        entityType: "configuracion",
        entityId: "session-settings",
        entityLabel: "Politica de sesiones",
        previousValue: null,
        newValue: settings,
        note: `Politica duplicados: ${settings.duplicatePolicy}`
      });
      sendJson(res, 200, { ok: true, settings, sessions: publicSessions(), recent: publicPresenceHistory(50) });
      return;
    }

    const forceSessionCloseMatch = requestUrl.pathname.match(/^\/api\/admin\/sessions\/([^/]+)\/close$/);
    if (forceSessionCloseMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Cierre permitido solo para administradores." });
        return;
      }
      const sessionId = decodeURIComponent(forceSessionCloseMatch[1]);
      const found = Array.from(sessions.entries()).find(([, session]) => session.sessionId === sessionId);
      if (!found) {
        sendJson(res, 404, { ok: false, error: "Sesion no encontrada o ya cerrada." });
        return;
      }
      const previousSession = publicSession(found[1]);
      closeSession(found[0], "forced-by-admin", sessionUser.name);
      appendAuditToStateFile(req, sessionUser, {}, {
        action: "SESSION_FORZADA_CERRADA",
        entityType: "sesion",
        entityId: sessionId,
        entityLabel: previousSession.name || sessionId,
        previousValue: previousSession,
        newValue: null,
        note: "Cierre forzado por administrador"
      });
      sendJson(res, 200, {
        ok: true,
        sessions: publicSessions(),
        recent: publicPresenceHistory(50),
        settings: readSessionConfig()
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/license" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Licencia permitida solo para administradores." });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        security: publicSecurityStatus(securityEngine.verifyRuntime(true), true)
      });
      return;
    }

    if (requestUrl.pathname === "/api/presence/heartbeat" && req.method === "POST") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      if (input.device) session.device = { ...session.device, ...normalizeDevice(input.device, req) };
      session.presenceStatus = String(input.status || session.presenceStatus || "Disponible");
      const now = new Date().toISOString();
      session.lastHeartbeatAt = now;
      session.lastPresenceAt = now;
      session.lastSyncAt = now;
      session.ip = clientIp(req);
      sendJson(res, 200, {
        ok: true,
        session: publicSession(session),
        settings: readSessionConfig(),
        presence: {
          sessions: publicSessions(),
          recent: publicPresenceHistory(30),
          settings: readSessionConfig()
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/presence/location" && req.method === "POST") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const gps = normalizeGps(input.gps || input.location || input);
      if (!gps) {
        sendJson(res, 400, { ok: false, error: "Ubicacion GPS invalida." });
        return;
      }
      const rejectReason = gpsRejectReason(gps);
      if (rejectReason) {
        const rejected = recordRejectedGps(req, session, input, gps, rejectReason);
        sendJson(res, 422, {
          ok: false,
          code: "GPS_REJECTED",
          error: rejectReason,
          rejected,
          session: publicSession(session),
          settings: readSessionConfig()
        });
        return;
      }
      if (input.device) session.device = { ...session.device, ...normalizeDevice(input.device, req) };
      session.location = gps;
      session.lastGpsAt = gps.updatedAt;
      session.lastPresenceAt = gps.updatedAt;
      session.lastSyncAt = gps.updatedAt;
      session.presenceStatus = String(input.status || session.presenceStatus || "Disponible");
      session.ip = clientIp(req);
      appendGpsHistory(session, gps, input);
      const warning = gpsWarning(gps);
      writeSessionAudit("GPS_UPDATED", session, { gps, note: warning || `GPS ${gps.lat}, ${gps.lng}` });
      if (warning) {
        appendNotificationToStateFile(req, session.user, { ...input, gps }, {
          action: "GPS_PRECISION_BAJA",
          category: "GPS",
          title: "GPS con baja precision",
          text: `${session.user.name}: ${warning}`,
          tone: "warn",
          entityType: "sesion",
          entityId: session.sessionId,
          entityLabel: session.user.name,
          audience: ["admin"]
        });
      }
      sendJson(res, 200, {
        ok: true,
        session: publicSession(session),
        settings: readSessionConfig(),
        presence: {
          sessions: publicSessions(),
          recent: publicPresenceHistory(30),
          settings: readSessionConfig()
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/presence/status" && req.method === "GET") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        serverAt: new Date().toISOString(),
        session: publicSession(session),
        settings: readSessionConfig(),
        presence: {
          sessions: publicSessions(),
          recent: publicPresenceHistory(30),
          settings: readSessionConfig()
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/admin/print-stock" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      try {
        const result = await printStockReport(currentPayload.state || {}, sessionUser, {
          searchTerm: payload.searchTerm || "",
          statusFilter: payload.statusFilter || "all"
        });
        appendAuditToStateFile(req, sessionUser, payload, {
          action: "STOCK_IMPRESION",
          entityType: "stock",
          entityId: "reporte-stock",
          entityLabel: "Reporte de stock",
          previousValue: null,
          newValue: result,
          note: "Reporte enviado a impresora"
        });
        sendJson(res, 200, { ok: true, message: result.result, reportFile: result.reportFile });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message || "No se pudo imprimir el reporte de stock." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/legal/publish" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Legal permitido solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      if (!String(input.motive || "").trim()) {
        sendJson(res, 400, { ok: false, error: "Indicar motivo de publicacion legal." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      legalEngine.migrateState(currentState);
      const previous = legalEngine.publicLegalPacket(currentState);
      const settings = legalEngine.publishLegalVersion(currentState, input, sessionUser);
      writeStateResponse(res, currentState, {
        legal: legalEngine.publicLegalPacket(currentState),
        settings
      }, auditEntry(req, sessionUser, input, {
        action: "TERMINOS_PUBLICADOS",
        entityType: "legal",
        entityId: settings.currentVersion,
        entityLabel: settings.title,
        previousValue: previous,
        newValue: legalEngine.publicLegalPacket(currentState),
        note: input.motive
      }), notificationEntry(req, sessionUser, input, {
        action: "TERMINOS_PUBLICADOS",
        category: "Legal",
        title: "Nueva version legal publicada",
        text: `Version ${settings.currentVersion}. Los usuarios deberan aceptar nuevamente.`,
        tone: "warn",
        entityType: "legal",
        entityId: settings.currentVersion,
        entityLabel: settings.title,
        audience: ["admin"]
      }), sessionUser);
      return;
    }

    if (requestUrl.pathname === "/api/help/tour-complete" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      legalEngine.migrateState(currentState);
      const completion = legalEngine.completeTour(currentState, sessionUser, input.topicId || input.module || "general");
      writeStateResponse(res, currentState, { completion }, auditEntry(req, sessionUser, input, {
        action: "AYUDA_RECORRIDO_COMPLETADO",
        entityType: "ayuda",
        entityId: completion.topicId,
        entityLabel: "Centro de ayuda",
        previousValue: null,
        newValue: completion,
        note: "Usuario marco recorrido guiado como completado."
      }), null, sessionUser);
      return;
    }

    if (requestUrl.pathname === "/api/price-lists/simulate" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Listas de precios permitidas solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      ensurePriceListsState(currentState);
      try {
        const simulation = computePriceListSimulation(currentState, input);
        sendJson(res, 200, { ok: true, simulation });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo simular la lista de precios." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/price-lists/apply" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Listas de precios permitidas solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      ensurePriceListsState(currentState);
      const previousList = entitySnapshot(currentState, "lista-precios", input.listId || input.name || input.listName || "");
      try {
        const result = applyPriceListChange(currentState, input, sessionUser);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: result.appliedNow ? "LISTA_PRECIOS_APLICADA" : "LISTA_PRECIOS_GUARDADA",
          entityType: "lista-precios",
          entityId: result.list.id,
          entityLabel: result.list.name,
          previousValue: previousList,
          newValue: result.list,
          note: input.motive || input.motivo || ""
        }), notificationEntry(req, sessionUser, input, {
          action: result.appliedNow ? "LISTA_PRECIOS_APLICADA" : "LISTA_PRECIOS_GUARDADA",
          category: "Precios",
          title: result.appliedNow ? `Lista aplicada: ${result.list.name}` : `Lista ${result.list.status.toLowerCase()}: ${result.list.name}`,
          text: `${result.simulation.affected} productos afectados. Vigencia ${result.list.effectiveAt}.`,
          tone: result.appliedNow ? "ok" : "warn",
          entityType: "lista-precios",
          entityId: result.list.id,
          entityLabel: result.list.name,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo aplicar la lista de precios." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/product-portfolio/assign-price-list" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Asignar listas por vendedor requiere Administrador." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const username = String(input.username || input.user || "").trim().toLowerCase();
      const sellerName = String(input.sellerName || input.seller || "").trim();
      const listNumber = Math.min(5, Math.max(1, Math.round(numeric(input.listNumber, priceListNumberFromValue(input.priceListId || input.priceListName) || 2))));
      const motive = String(input.motive || input.motivo || "").trim();
      if (!username && !sellerName) {
        sendJson(res, 400, { ok: false, error: "Indicar usuario o vendedor." });
        return;
      }
      if (!motive) {
        sendJson(res, 400, { ok: false, error: "Indicar motivo administrativo." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      ensurePriceListsState(currentState);
      const previous = (currentState.priceListAssignments || []).find((assignment) => (
        (username && assignment.username === username)
        || (sellerName && sameText(assignment.sellerName, sellerName))
      ));
      const next = normalizePriceListAssignment({
        username: username || previous && previous.username,
        sellerName: sellerName || previous && previous.sellerName,
        priceListId: priceListIdForNumber(listNumber),
        priceListName: priceListNameForNumber(listNumber),
        listNumber,
        locked: input.locked === undefined ? true : input.locked,
        updatedAt: new Date().toISOString(),
        updatedBy: sessionUser.name
      });
      currentState.priceListAssignments = (currentState.priceListAssignments || []).filter((assignment) => !(
        (next.username && assignment.username === next.username)
        || (next.sellerName && sameText(assignment.sellerName, next.sellerName))
      ));
      currentState.priceListAssignments.unshift(next);
      const users = readUsers();
      const userIndex = users.findIndex((user) => String(user.username || "").toLowerCase() === next.username);
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          defaultPriceListId: next.priceListId,
          defaultPriceListName: next.priceListName,
          priceListLocked: next.locked,
          updatedAt: new Date().toISOString()
        };
        writeUsers(users);
      }
      writeStateResponse(res, currentState, { assignment: next }, auditEntry(req, sessionUser, input, {
        action: "LISTA_PRECIO_ASIGNADA_USUARIO",
        entityType: "lista-precios",
        entityId: next.username || next.sellerName,
        entityLabel: next.sellerName || next.username,
        previousValue: previous || null,
        newValue: next,
        note: motive
      }), notificationEntry(req, sessionUser, input, {
        action: "LISTA_PRECIO_ASIGNADA_USUARIO",
        category: "Precios",
        title: `Lista asignada: ${next.sellerName || next.username}`,
        text: `${next.priceListName} asignada por ${sessionUser.name}.`,
        tone: "ok",
        entityType: "lista-precios",
        entityId: next.username || next.sellerName,
        entityLabel: next.sellerName || next.username,
        audience: ["admin"]
      }), sessionUser);
      return;
    }

    if (requestUrl.pathname === "/api/product-portfolio/template" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Descargar plantilla requiere Administrador." });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        fileName: "plantilla-cartera-productos.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: await portfolioTemplateBase64()
      });
      return;
    }

    if (requestUrl.pathname === "/api/reports/xlsx" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Exportar reportes requiere Administrador." });
        return;
      }
      try {
        const input = JSON.parse(await readBody(req) || "{}");
        const base64 = await reportWorkbookBase64(input, sessionUser);
        sendJson(res, 200, {
          ok: true,
          fileName: String(input.fileName || "reporte.xlsx").replace(/[^a-z0-9._-]/gi, "-").slice(0, 160),
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          base64
        });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo generar el Excel." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/product-portfolio/preview" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Previsualizar cartera requiere Administrador." });
        return;
      }
      try {
        const input = JSON.parse(await readBody(req) || "{}");
        const workbook = await readPortfolioWorkbook(input.fileDataUrl);
        const currentState = readStateFileCached().state || {};
        const preview = previewProductPortfolio(currentState, workbook.rows, {
          fileName: input.fileName,
          sheetName: workbook.sheetName
        });
        sendJson(res, 200, { ok: true, preview });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo validar la cartera." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/product-portfolio/apply" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Aplicar cartera requiere Administrador." });
        return;
      }
      try {
        const input = JSON.parse(await readBody(req) || "{}");
        if (input.confirmed !== true) throw new Error("La importacion requiere confirmacion administrativa.");
        const motive = String(input.motive || input.motivo || "").trim();
        if (!motive) throw new Error("Indicar el motivo de importacion.");
        const preview = productPortfolioPreviews.get(String(input.token || ""));
        if (!preview) throw new Error("La vista previa vencio. Volver a validar el archivo.");
        if (Date.now() - new Date(preview.createdAt).getTime() > 30 * 60 * 1000) throw new Error("La vista previa vencio. Volver a validar el archivo.");
        const unresolved = preview.rows.filter((row) => row.action === "REQUIERE_HOMOLOGACION" && !["ALTA", "OMITIR"].includes(String(input.resolutions && input.resolutions[row.key] || "").toUpperCase()));
        if (unresolved.length) throw new Error(`Resolver ${unresolved.length} productos sin homologacion antes de aplicar.`);
        const currentState = readStateFileCached().state || {};
        const result = applyHomologatedPortfolioImport(currentState, preview, input, sessionUser);
        productPortfolioPreviews.delete(preview.token);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "IMPORTACION_CARTERA_HOMOLOGADA",
          entityType: "producto",
          entityId: result.record.id,
          entityLabel: preview.fileName,
          previousValue: { products: result.record.previousCount },
          newValue: { products: result.record.newCount, updated: result.record.updated, created: result.record.created, inactivated: result.record.inactivated },
          note: motive
        }), notificationEntry(req, sessionUser, input, {
          action: "IMPORTACION_CARTERA_HOMOLOGADA",
          category: "Productos",
          title: "Cartera homologada aplicada",
          text: `${result.record.updated} actualizados, ${result.record.created} altas y ${result.record.inactivated} inactivos.`,
          tone: "ok",
          entityType: "producto",
          entityId: result.record.id,
          entityLabel: preview.fileName,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo aplicar la cartera." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/product-portfolio/import-json" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      sendJson(res, 410, { ok: false, error: "Importador reemplazado por el flujo homologado con vista previa en /api/product-portfolio/preview." });
      return;
      /* compatibilidad historica deshabilitada: nunca volver a reemplazar toda la cartera */
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Importar cartera requiere Administrador." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      if (input.confirmed !== true) {
        sendJson(res, 400, { ok: false, error: "La importacion requiere confirmacion administrativa." });
        return;
      }
      const motive = String(input.motive || input.motivo || "").trim();
      if (!motive) {
        sendJson(res, 400, { ok: false, error: "Indicar motivo de importacion." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const result = applyProductPortfolioImport(currentState, input.products || [], sessionUser, input);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "IMPORTACION_CARTERA_PRODUCTOS",
          entityType: "producto",
          entityId: result.audit.id,
          entityLabel: "Cartera de productos",
          previousValue: { products: result.previousCount },
          newValue: { products: result.imported },
          note: motive
        }), notificationEntry(req, sessionUser, input, {
          action: "IMPORTACION_CARTERA_PRODUCTOS",
          category: "Productos",
          title: "Cartera de productos importada",
          text: `${result.imported} productos cargados. Backup ${result.backup.id}.`,
          tone: "ok",
          entityType: "producto",
          entityId: result.audit.id,
          entityLabel: "Cartera de productos",
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo importar la cartera." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/admin/maintenance/cleanup" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Mantenimiento permitido solo para Administracion." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const target = String(input.target || "").trim();
      const motive = String(input.motive || input.motivo || "").trim();
      if (!["clients", "orders"].includes(target)) {
        sendJson(res, 400, { ok: false, error: "Objetivo de limpieza invalido." });
        return;
      }
      if (input.confirmed !== true || String(input.confirmText || "").trim() !== "CONFIRMAR") {
        sendJson(res, 400, { ok: false, error: "Escribir CONFIRMAR para ejecutar la limpieza." });
        return;
      }
      if (!motive) {
        sendJson(res, 400, { ok: false, error: "Indicar motivo de mantenimiento." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      accountEngine.migrateState(currentState);
      const backup = createMaintenanceBackup(`limpiar-${target}`, currentState);
      const previousValue = {
        clients: Array.isArray(currentState.clients) ? currentState.clients.length : 0,
        orders: Array.isArray(currentState.orders) ? currentState.orders.length : 0,
        accounts: Array.isArray(currentState.accounts) ? currentState.accounts.length : 0
      };
      if (target === "clients") {
        currentState.clients = [];
        currentState.accounts = [];
        currentState.bankReconciliation = [];
      }
      if (target === "orders") {
        currentState.archivedOrders = Array.isArray(currentState.archivedOrders) ? currentState.archivedOrders : [];
        currentState.archivedDeliveryRoutes = Array.isArray(currentState.archivedDeliveryRoutes) ? currentState.archivedDeliveryRoutes : [];
        currentState.archivedBankReconciliation = Array.isArray(currentState.archivedBankReconciliation) ? currentState.archivedBankReconciliation : [];
        const archivedAt = new Date().toISOString();
        const archivedBy = sessionUser.name || sessionUser.username || "Administracion";
        currentState.archivedOrders.unshift(...(currentState.orders || []).map((order) => ({
          ...order,
          archivedAt,
          archivedBy,
          archiveReason: motive
        })));
        currentState.archivedDeliveryRoutes.unshift(...(currentState.deliveryRoutes || []).map((route) => ({
          ...route,
          archivedAt,
          archivedBy,
          archiveReason: motive
        })));
        currentState.archivedBankReconciliation.unshift(...(currentState.bankReconciliation || []).map((record) => ({
          ...record,
          archivedAt,
          archivedBy,
          archiveReason: motive
        })));
        currentState.archivedOrders = currentState.archivedOrders.slice(0, 10000);
        currentState.archivedDeliveryRoutes = currentState.archivedDeliveryRoutes.slice(0, 2000);
        currentState.archivedBankReconciliation = currentState.archivedBankReconciliation.slice(0, 10000);
        currentState.orders = [];
        currentState.deliveryRoutes = [];
        currentState.bankReconciliation = [];
        (currentState.products || []).forEach((product) => {
          product.stock_reservado = 0;
          product.stock_disponible = Math.max(0, numeric(product.stock_fisico ?? product.stock_actual ?? product.stock, 0));
        });
      }
      currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
      currentState.activity.unshift({
        type: "Mantenimiento",
        title: target === "clients" ? "Base de clientes limpiada" : "Base de pedidos limpiada",
        text: `${sessionUser.name}: ${motive}. Backup ${backup.id}.`
      });
      writeStateResponse(res, currentState, { target, backup, previousValue }, auditEntry(req, sessionUser, input, {
        action: target === "clients" ? "MANTENIMIENTO_LIMPIAR_CLIENTES" : "MANTENIMIENTO_LIMPIAR_PEDIDOS",
        entityType: "mantenimiento",
        entityId: target,
        entityLabel: target === "clients" ? "Clientes" : "Pedidos",
        previousValue,
        newValue: { target, backup },
        note: motive
      }), notificationEntry(req, sessionUser, input, {
        action: "MANTENIMIENTO_EJECUTADO",
        category: "Mantenimiento",
        title: target === "clients" ? "Clientes limpiados" : "Pedidos limpiados",
        text: `${sessionUser.name} ejecuto mantenimiento. Backup ${backup.id}.`,
        tone: "warn",
        entityType: "mantenimiento",
        entityId: target,
        entityLabel: target,
        audience: ["admin"]
      }), sessionUser);
      return;
    }

    if (requestUrl.pathname === "/api/commissions/rules" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Comisiones permitidas solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      try {
        const result = orderEngine.saveCommissionRule(currentState, input, sessionUser);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: result.previous ? "COMISION_REGLA_EDITADA" : "COMISION_REGLA_CREADA",
          entityType: "comision",
          entityId: result.rule.id,
          entityLabel: `${result.rule.role} ${result.rule.rubro || result.rule.productName || result.rule.productCode}`,
          previousValue: result.previous,
          newValue: result.rule,
          note: input.motive || input.motivo || ""
        }), notificationEntry(req, sessionUser, input, {
          action: "COMISION_REGLA_GUARDADA",
          category: "Comisiones",
          title: `Regla de comision ${result.rule.status.toLowerCase()}`,
          text: `${result.rule.role}: ${result.rule.percent}% sobre ${result.rule.productName || result.rule.productCode || result.rule.rubro || "general"}.`,
          tone: result.rule.active === false ? "warn" : "ok",
          entityType: "comision",
          entityId: result.rule.id,
          entityLabel: result.rule.rubro || result.rule.productName || result.rule.id,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo guardar la regla de comision." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/commissions/recalculate" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Recalcular comisiones esta permitido solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const result = orderEngine.recalculateCommissions(currentState, input, sessionUser);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "COMISIONES_RECALCULADAS",
          entityType: "comision",
          entityId: result.orders.join(","),
          entityLabel: `${result.count} pedidos`,
          previousValue: { total: result.previousTotal },
          newValue: { total: result.nextTotal, difference: result.difference, orders: result.orders },
          note: result.motive
        }), notificationEntry(req, sessionUser, input, {
          action: "COMISIONES_RECALCULADAS",
          category: "Comisiones",
          title: "Comisiones recalculadas",
          text: `${result.count} pedidos ajustados. Diferencia ${result.difference}.`,
          tone: "info",
          entityType: "comision",
          entityId: result.orders.join(","),
          entityLabel: `${result.count} pedidos`,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudieron recalcular las comisiones." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/clients" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Consultar el padron completo requiere usuario administrador." });
        return;
      }
      const currentPayload = readStateFileCached();
      const payload = paginatedClientsPayload(currentPayload.state || {}, requestUrl.searchParams, currentPayload.version);
      sendJson(res, 200, payload, {
        "Server-Timing": `clients;dur=${payload.performance.queryMs}`,
        "X-DL-Clients-Query-Ms": String(payload.performance.queryMs)
      });
      return;
    }

    const clientEditMatch = requestUrl.pathname.match(/^\/api\/clients\/([^/]+)\/edit$/);
    if (clientEditMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Editar clientes requiere usuario administrador." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const adminPassword = String(input.admin_password || input.adminPassword || "").trim();
      const users = readUsers();
      const adminUser = users.find((item) => item.username.toLowerCase() === sessionUser.username.toLowerCase() && item.active !== false);
      if (!adminUser || !verifyPassword(adminPassword, adminUser)) {
        appendAuditToStateFile(req, sessionUser, input, {
          action: "CLIENTE_EDICION_CLAVE_RECHAZADA",
          entityType: "cliente",
          entityId: decodeURIComponent(clientEditMatch[1]),
          entityLabel: decodeURIComponent(clientEditMatch[1]),
          previousValue: null,
          newValue: { username: sessionUser.username },
          note: "Clave de administrador incorrecta al editar cliente"
        });
        sendJson(res, 401, { ok: false, error: "Clave de administrador incorrecta." });
        return;
      }
      const motive = String(input.motivo || input.motive || input.motivo_cambio || "").trim();
      if (!motive) {
        sendJson(res, 400, { ok: false, error: "Para editar un cliente se debe indicar motivo del cambio." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      currentState.clients = Array.isArray(currentState.clients) ? currentState.clients : [];
      const id = decodeURIComponent(clientEditMatch[1]);
      const index = findClientIndex(currentState, id);
      if (index < 0) {
        sendJson(res, 404, { ok: false, error: "Cliente no encontrado." });
        return;
      }
      try {
        const previousClient = JSON.parse(JSON.stringify(currentState.clients[index]));
        const nextClient = editedClientFromInput(previousClient, input, sessionUser);
        const duplicate = currentState.clients.find((client, itemIndex) => itemIndex !== index && (
          (nextClient.codigo_cliente && sameText(client.codigo_cliente, nextClient.codigo_cliente))
          || sameText(client.name || client.nombre_comercial, nextClient.name)
        ));
        if (duplicate) {
          sendJson(res, 409, { ok: false, error: "Ya existe otro cliente con ese codigo o nombre comercial." });
          return;
        }
        currentState.clients[index] = nextClient;
        applyClientNameReferences(currentState, previousClient.name || previousClient.nombre_comercial, nextClient.name);
        nextClient.editHistory = Array.isArray(nextClient.editHistory) ? nextClient.editHistory : [];
        nextClient.editHistory.push({
          at: new Date().toISOString(),
          user: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          ip: clientIp(req),
          motive,
          previousValue: clientSensitiveSnapshot(previousClient),
          newValue: clientSensitiveSnapshot(nextClient)
        });
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Clientes",
          title: `${nextClient.name} modificado`,
          text: `Cambio administrativo registrado por ${sessionUser.name}. Motivo: ${motive}.`
        });
        accountEngine.migrateState(currentState);
        const sensitive = sensitiveClientChanged(previousClient, nextClient);
        writeStateResponse(res, currentState, { client: nextClient }, auditEntry(req, sessionUser, input, {
          action: sensitive ? "CLIENTE_CAMBIO_SENSIBLE" : "CLIENTE_EDITADO",
          entityType: "cliente",
          entityId: clientRecordId(nextClient),
          entityLabel: nextClient.name,
          previousValue: previousClient,
          newValue: nextClient,
          note: motive
        }), notificationEntry(req, sessionUser, input, {
          action: sensitive ? "CLIENTE_CAMBIO_SENSIBLE" : "CLIENTE_EDITADO",
          category: "Clientes",
          title: `Cliente modificado: ${nextClient.name}`,
          text: `${sessionUser.name}: ${motive}`,
          tone: sensitive ? "warn" : "info",
          entityType: "cliente",
          entityId: clientRecordId(nextClient),
          entityLabel: nextClient.name,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo editar el cliente." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/orders" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      deliveryEngine.migrateState(currentState);
      accountEngine.migrateState(currentState);
      const seller = sessionUser.role === "seller"
        ? sessionUser.sellerName || sessionUser.name
        : String(input.seller || sessionUser.name);
      const pricedInput = priceOrderItemsForAssignedList(currentState, input, sessionUser, seller);
      if (!(currentState.clients || []).some((client) => client.name === input.client)) {
        sendJson(res, 400, { ok: false, error: "El cliente seleccionado no existe en el padron." });
        return;
      }
      try {
        const quote = orderEngine.quoteOrder(currentState, pricedInput);
        const credit = accountEngine.accountSummary(currentState, input.client, quote.amount);
        if (credit.requiresAuthorization) {
          if (!accountEngine.canAuthorize(sessionUser)) {
            appendNotificationToStateFile(req, sessionUser, input, {
              action: "CREDITO_LIMITE_SUPERADO",
              category: "Cuentas",
              title: `Limite de credito superado: ${input.client || "Cliente"}`,
              text: `Pedido no autorizado. ${credit.warning}`,
              tone: "danger",
              entityType: "cliente",
              entityId: input.client || "",
              entityLabel: input.client || "",
              audience: ["admin"]
            });
            sendJson(res, 403, {
              ok: false,
              error: `Cuenta corriente requiere autorizacion administrativa. ${credit.warning}`,
              credit
            });
            return;
          }
          if (input.creditOverride !== true) {
            appendNotificationToStateFile(req, sessionUser, input, {
              action: "CREDITO_LIMITE_SUPERADO",
              category: "Cuentas",
              title: `Pedido requiere autorizacion: ${input.client || "Cliente"}`,
              text: credit.warning,
              tone: "danger",
              entityType: "cliente",
              entityId: input.client || "",
              entityLabel: input.client || "",
              audience: ["admin"]
            });
            sendJson(res, 409, {
              ok: false,
              error: `CREDIT_AUTH_REQUIRED: ${credit.warning}`,
              credit
            });
            return;
          }
        }
        const quotedItems = quote.items.map((item) => ({
          productCode: item.productCode,
          name: item.name,
          qty: item.requestedQty,
          unitPrice: item.unitPrice,
          price: item.unitPrice,
          priceListId: item.priceListId,
          priceListName: item.priceListName
        }));
        const order = orderEngine.createOrder(currentState, {
          ...pricedInput,
          items: Array.isArray(pricedInput.items) && pricedInput.items.length ? pricedInput.items : quotedItems,
          seller,
          sellerUsername: sessionUser.role === "seller" ? sessionUser.username : String(input.sellerUsername || ""),
          source: sessionUser.role === "seller" ? "mobile" : (input.source || "dashboard"),
          origin: sessionUser.role === "seller" ? "preventa" : (input.origin || "dashboard")
        }, sessionUser.name);
        order.credit = {
          currentBalance: credit.currentBalance,
          creditLimit: credit.creditLimit,
          overdueDebt: credit.overdueDebt,
          totalDebt: credit.totalDebt,
          projectedBalance: credit.projectedBalance,
          status: credit.status,
          authorized: credit.requiresAuthorization && accountEngine.canAuthorize(sessionUser)
        };
        if (credit.requiresAuthorization) {
          order.creditAuthorization = {
            user: sessionUser.name,
            username: sessionUser.username,
            at: new Date().toISOString(),
            reason: credit.warning
          };
          currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
          currentState.activity.unshift({
            type: "Cuentas",
            title: `${order.code} autorizado por credito`,
            text: `${order.client}: ${credit.warning}`
          });
        }
        accountEngine.migrateState(currentState);
        writeStateResponse(res, currentState, { order, credit }, auditEntry(req, sessionUser, input, {
          action: "PEDIDO_CREADO",
          entityType: "pedido",
          entityId: order.code,
          entityLabel: order.client,
          previousValue: null,
          newValue: order,
          note: credit.requiresAuthorization ? `Pedido con autorizacion de credito: ${credit.warning}` : "Pedido ingresado"
        }), [
          notificationEntry(req, sessionUser, input, {
            action: "PEDIDO_CREADO",
            category: "Pedidos",
            title: `Nuevo pedido ${order.code}`,
            text: `${order.seller || "Vendedor"} cargo ${order.client} por ${order.amount}. Estado: ${order.status}.`,
            tone: orderNotificationTone(order),
            entityType: "pedido",
            entityId: order.code,
            entityLabel: order.client,
            audience: ["admin"]
          }),
          credit.requiresAuthorization ? notificationEntry(req, sessionUser, input, {
            action: "CREDITO_LIMITE_SUPERADO",
            category: "Cuentas",
            title: `Limite de credito superado: ${order.client}`,
            text: `${credit.warning} Pedido ${order.code} autorizado por ${sessionUser.name}.`,
            tone: "danger",
            entityType: "pedido",
            entityId: order.code,
            entityLabel: order.client,
            audience: ["admin"]
          }) : null
        ]);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar el pedido." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/clients/mobile" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "seller"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Alta movil permitida solo para preventa o administracion." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const sellerPassword = String(input.preventistaPassword || input.sellerPassword || input.password || "").trim();
      if (!sellerPassword) {
        sendJson(res, 400, { ok: false, error: "Reingresar la clave del usuario para guardar el cliente." });
        return;
      }
      if (!verifyCurrentUserPassword(sessionUser, sellerPassword)) {
        appendAuditToStateFile(req, sessionUser, withoutSensitiveFields(input), {
          action: "CLIENTE_ALTA_MOVIL_CLAVE_RECHAZADA",
          entityType: "cliente",
          entityId: String(input.nombre_comercial || input.name || "").trim(),
          entityLabel: String(input.nombre_comercial || input.name || "").trim(),
          previousValue: null,
          newValue: { username: sessionUser.username, ok: false },
          note: "Clave reingresada incorrecta al intentar alta movil"
        });
        sendJson(res, 401, { ok: false, error: "Clave del usuario incorrecta." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      currentState.clients = Array.isArray(currentState.clients) ? currentState.clients : [];
      try {
        const client = mobileClientFromInput(input, sessionUser);
        if (currentState.clients.some((item) => sameText(item.codigo_cliente, client.codigo_cliente) || sameText(item.name || item.nombre_comercial, client.name))) {
          throw new Error("Ese cliente ya esta cargado en el padron.");
        }
        currentState.clients.unshift(client);
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Clientes",
          title: `${client.name} cargado desde preventa`,
          text: `Alta movil asignada a ${client.seller || "sin vendedor"} con GPS ${client.gpsAccuracy || 0} m.`
        });
        const sanitizedInput = withoutSensitiveFields({ ...input, gps: client.gps });
        writeCompactStateResponse(res, currentState, { client }, [
          auditEntry(req, sessionUser, sanitizedInput, {
            action: "PREVENTISTA_REVALIDADO_ALTA_CLIENTE",
            entityType: "cliente",
            entityId: client.codigo_cliente || client.name,
            entityLabel: client.name,
            previousValue: null,
            newValue: { username: sessionUser.username, gps: client.gps, device: input.device || null },
            note: "Clave del usuario revalidada contra servidor antes de guardar cliente"
          }),
          auditEntry(req, sessionUser, sanitizedInput, {
          action: "CLIENTE_ALTA_MOVIL",
          entityType: "cliente",
          entityId: client.codigo_cliente || client.name,
          entityLabel: client.name,
          previousValue: null,
          newValue: client,
          note: "Alta obligatoria desde Preventa Movil"
          })
        ], notificationEntry(req, sessionUser, sanitizedInput, {
          action: "CLIENTE_ALTA_MOVIL",
          category: "Clientes",
          title: `Cliente nuevo ${client.name}`,
          text: `${sessionUser.name} cargo cliente con telefono, direccion y GPS.`,
          tone: "ok",
          entityType: "cliente",
          entityId: client.codigo_cliente || client.name,
          entityLabel: client.name,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo crear el cliente." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/preventa/no-purchase" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "seller"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Registro permitido solo para preventa o administracion." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const clientName = String(input.client || "").trim();
        const client = (currentState.clients || []).find((item) => sameText(item.name || item.nombre_comercial, clientName));
        if (!client) throw new Error("El cliente seleccionado no existe en el padron.");
        const reason = String(input.reason || input.motivo || "").trim();
        if (!reason) throw new Error("El motivo de no compra es obligatorio.");
        const observation = String(input.observation || input.observacion || "").trim();
        if (reason === "Otros" && !observation) throw new Error("Para Otros se debe completar observacion.");
        const gps = normalizeGps(input.gps || input.location || null);
        const rejectReason = gpsRejectReason(gps);
        if (rejectReason) throw new Error(rejectReason);
        const at = new Date().toISOString();
        const parts = auditLocalParts(at);
        const visit = {
          id: `VSC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          at,
          date: parts.date,
          time: parts.time,
          client: client.name || client.nombre_comercial,
          clientCode: client.codigo_cliente || "",
          seller: sessionUser.role === "seller" ? sessionUser.sellerName || sessionUser.name : String(input.seller || sessionUser.name),
          username: sessionUser.username,
          workday: String(input.workday || "").trim(),
          reason,
          observation,
          gps,
          device: normalizeDevice(input.device || {}, req)
        };
        currentState.noPurchaseVisits = Array.isArray(currentState.noPurchaseVisits) ? currentState.noPurchaseVisits : [];
        currentState.noPurchaseVisits.unshift(visit);
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Preventa",
          title: `Sin compra - ${visit.client}`,
          text: `${visit.seller}: ${visit.reason}${visit.observation ? ` - ${visit.observation}` : ""}.`
        });
        writeStateResponse(res, currentState, { visit }, auditEntry(req, sessionUser, { ...input, gps }, {
          action: "PREVENTA_SIN_COMPRA",
          entityType: "cliente",
          entityId: client.codigo_cliente || client.name,
          entityLabel: client.name || client.nombre_comercial,
          previousValue: null,
          newValue: visit,
          note: reason
        }), notificationEntry(req, sessionUser, input, {
          action: "PREVENTA_SIN_COMPRA",
          category: "Preventa",
          title: `Sin compra ${visit.client}`,
          text: `${visit.seller}: ${visit.reason}.`,
          tone: "warn",
          entityType: "cliente",
          entityId: client.codigo_cliente || client.name,
          entityLabel: client.name || client.nombre_comercial,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar la visita sin compra." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/preventa/audit-consultation" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "seller"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Auditoria permitida solo para preventa o administracion." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      currentState.preventaConsultations = Array.isArray(currentState.preventaConsultations) ? currentState.preventaConsultations : [];
      const at = new Date().toISOString();
      const parts = auditLocalParts(at);
      const record = {
        id: `PVC-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        at,
        date: parts.date,
        time: parts.time,
        action: String(input.action || "PREVENTA_CONSULTA").trim(),
        seller: String(input.seller || sessionUser.sellerName || sessionUser.name || "").trim(),
        username: sessionUser.username,
        note: String(input.note || "").trim(),
        gps: normalizeGps(input.gps || input.location || null),
        device: normalizeDevice(input.device || {}, req)
      };
      currentState.preventaConsultations.unshift(record);
      currentState.preventaConsultations = currentState.preventaConsultations.slice(0, 5000);
      writeStateResponse(res, currentState, { consultation: record }, auditEntry(req, sessionUser, input, {
        action: record.action,
        entityType: "preventa",
        entityId: record.seller || sessionUser.username,
        entityLabel: "Consulta Preventa",
        previousValue: null,
        newValue: record,
        note: record.note || "Consulta realizada desde Preventa"
      }), null, sessionUser);
      return;
    }

    if (requestUrl.pathname === "/api/preventa/whatsapp-contact" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "seller"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Contacto permitido solo para preventa o administracion." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      currentState.whatsappContacts = Array.isArray(currentState.whatsappContacts) ? currentState.whatsappContacts : [];
      const clientName = String(input.client || "").trim();
      const client = (currentState.clients || []).find((item) => sameText(item.name || item.nombre_comercial, clientName));
      const at = new Date().toISOString();
      const parts = auditLocalParts(at);
      const contact = {
        id: `WSP-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        at,
        date: parts.date,
        time: parts.time,
        client: client ? client.name || client.nombre_comercial : clientName,
        clientCode: client ? client.codigo_cliente || "" : "",
        seller: String(input.seller || sessionUser.sellerName || sessionUser.name || "").trim(),
        username: sessionUser.username,
        phone: String(input.phone || "").trim(),
        gps: normalizeGps(input.gps || input.location || null),
        device: normalizeDevice(input.device || {}, req)
      };
      currentState.whatsappContacts.unshift(contact);
      currentState.whatsappContacts = currentState.whatsappContacts.slice(0, 5000);
      writeStateResponse(res, currentState, { contact }, auditEntry(req, sessionUser, input, {
        action: "PREVENTA_WHATSAPP_CLIENTE",
        entityType: "cliente",
        entityId: contact.clientCode || contact.client,
        entityLabel: contact.client,
        previousValue: null,
        newValue: contact,
        note: "Contacto de cliente por WhatsApp desde Preventa"
      }), null, sessionUser);
      return;
    }

    const orderCommercialApprovalMatch = requestUrl.pathname.match(/^\/api\/orders\/([^/]+)\/commercial-approval$/);
    if (orderCommercialApprovalMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Aprobacion comercial permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      const code = decodeURIComponent(orderCommercialApprovalMatch[1]);
      try {
        const previousOrder = entitySnapshot(currentState, "pedido", code);
        const result = orderEngine.resolveCommercialApproval(currentState, code, input, {
          user: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          ip: clientIp(req),
          gps: input.gps || null
        });
        accountEngine.migrateState(currentState);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: result.audit && result.audit.decision === "Aprobada" ? "PEDIDO_APROBACION_COMERCIAL_APROBADA" : "PEDIDO_APROBACION_COMERCIAL_RECHAZADA",
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          previousValue: previousOrder,
          newValue: result.order,
          note: input.motive || input.motivo || input.note || "Resolucion comercial"
        }), notificationEntry(req, sessionUser, input, {
          action: "PEDIDO_MODIFICADO",
          category: "Comercial",
          title: `Solicitud comercial ${result.audit && result.audit.decision || ""} ${code}`,
          text: `${result.order && result.order.client || "Cliente"} - ${input.motive || input.motivo || input.note || "Resolucion comercial"}.`,
          tone: result.audit && result.audit.decision === "Aprobada" ? "ok" : "warn",
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo resolver la aprobacion comercial." });
      }
      return;
    }

    const orderEditMatch = requestUrl.pathname.match(/^\/api\/orders\/([^/]+)\/edit$/);
    if (orderEditMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Edicion permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      const code = decodeURIComponent(orderEditMatch[1]);
      try {
        const previousOrder = entitySnapshot(currentState, "pedido", code);
        const fullUser = fullUserByUsername(sessionUser.username) || sessionUser;
        if (orderEditHasEconomicChange(previousOrder, input) && !userCanEditOrderEconomics(fullUser)) {
          sendJson(res, 403, { ok: false, error: "Modificar precios o descuentos requiere autorizacion administrativa especifica." });
          return;
        }
        const result = orderEngine.editOrder(currentState, code, input, {
          user: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          ip: clientIp(req)
        });
        accountEngine.migrateState(currentState);
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "PEDIDO_EDITADO",
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          previousValue: previousOrder,
          newValue: result.order,
          note: input.motive || input.motivo || "Edicion administrativa"
        }), notificationEntry(req, sessionUser, input, {
          action: "PEDIDO_MODIFICADO",
          category: "Pedidos",
          title: `Pedido modificado ${code}`,
          text: `${result.order && result.order.client || "Cliente"} fue editado. Motivo: ${input.motive || input.motivo || "Edicion administrativa"}.`,
          tone: "warn",
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo editar el pedido." });
      }
      return;
    }

    const orderLabelMatch = requestUrl.pathname.match(/^\/api\/orders\/([^/]+)\/(label|scan)$/);
    if (orderLabelMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "depot"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores o deposito autorizado." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      const code = decodeURIComponent(orderLabelMatch[1]);
      const action = orderLabelMatch[2];
      try {
        const previousOrder = entitySnapshot(currentState, "pedido", code);
        const context = {
          user: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          ip: clientIp(req),
          gps: input.gps || null
        };
        const result = action === "label"
          ? orderEngine.generateOrderLabel(currentState, code, input, context)
          : orderEngine.scanOrderLabel(currentState, code, input, context);
        const auditAction = action === "label" ? "PEDIDO_ETIQUETA_GENERADA" : "PEDIDO_ETIQUETA_ESCANEADA";
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: auditAction,
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          previousValue: previousOrder,
          newValue: result.order,
          note: action === "label"
            ? `Etiqueta generada. Bultos ${result.label && result.label.packages || 0}.`
            : "Etiqueta escaneada. Pedido listo para despacho."
        }), notificationEntry(req, sessionUser, input, {
          action: auditAction,
          category: "Deposito",
          title: action === "label" ? `Etiqueta generada ${code}` : `Pedido listo para despacho ${code}`,
          text: action === "label"
            ? `${result.order.client}: ${result.label && result.label.packages || 0} bultos.`
            : `${result.order.client}: etiqueta validada por scanner.`,
          tone: "ok",
          entityType: "pedido",
          entityId: code,
          entityLabel: result.order && result.order.client || code,
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo procesar la etiqueta." });
      }
      return;
    }

    const orderActionMatch = requestUrl.pathname.match(/^\/api\/orders\/([^/]+)\/(advance|priority|cancel)$/);
    if (orderActionMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (orderActionMatch[2] === "advance" && !["admin", "depot"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores o deposito autorizado." });
        return;
      }
      if (orderActionMatch[2] !== "advance" && sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      const code = decodeURIComponent(orderActionMatch[1]);
      try {
        const previousOrder = entitySnapshot(currentState, "pedido", code);
        let order;
        if (orderActionMatch[2] === "advance") {
          const currentOrder = (currentState.orders || []).find((item) => item.code === code);
          if (currentOrder && [orderEngine.STATUS.ASSEMBLY, orderEngine.STATUS.LABELED, orderEngine.STATUS.READY_DISPATCH].includes(currentOrder.status)) {
            throw new Error("Los pedidos de armado, etiquetado y despacho se gestionan desde etiqueta y planificador de rutas.");
          }
          order = orderEngine.advanceOrder(currentState, code, sessionUser.name);
        } else if (orderActionMatch[2] === "priority") {
          order = orderEngine.setPriority(currentState, code, input.priority, sessionUser.name);
        } else {
          order = orderEngine.cancelOrder(currentState, code, sessionUser.name);
        }
        writeStateResponse(res, currentState, { order }, auditEntry(req, sessionUser, input, {
          action: orderActionMatch[2] === "advance" ? "PEDIDO_AVANZADO" : orderActionMatch[2] === "priority" ? "PEDIDO_PRIORIDAD" : "PEDIDO_CANCELADO",
          entityType: "pedido",
          entityId: code,
          entityLabel: order && order.client || code,
          previousValue: previousOrder,
          newValue: order,
          note: orderActionMatch[2]
        }), orderActionMatch[2] === "advance"
          ? orderStatusNotification(req, sessionUser, input, order, previousOrder, order && order.status === orderEngine.STATUS.DISPATCHED ? "PEDIDO_DESPACHADO" : "PEDIDO_ESTADO")
          : notificationEntry(req, sessionUser, input, {
            action: orderActionMatch[2] === "priority" ? "PEDIDO_MODIFICADO" : "PEDIDO_CANCELADO",
            category: "Pedidos",
            title: orderActionMatch[2] === "priority" ? `Urgencia actualizada ${code}` : `Pedido cancelado ${code}`,
            text: `${order && order.client || "Cliente"} - ${order && order.status || ""}.`,
            tone: orderActionMatch[2] === "cancel" ? "danger" : "warn",
            entityType: "pedido",
            entityId: code,
            entityLabel: order && order.client || code,
            audience: ["admin"]
          }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo modificar el pedido." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/stock/initial-inventory" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Inventario inicial permitido solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        orderEngine.migrateState(currentState);
        const preview = buildInitialInventoryPreview(currentState, input.rows || []);
        if (input.previewOnly === true) {
          sendJson(res, 200, { ok: true, preview });
          return;
        }
        const previousValue = {
          products: Array.isArray(currentState.products) ? currentState.products.length : 0,
          stockMovements: Array.isArray(currentState.stockMovements) ? currentState.stockMovements.length : 0
        };
        const result = applyInitialInventoryLoad(currentState, input, sessionUser);
        writeStateResponse(res, currentState, {
          preview: result.preview,
          applied: result.applied.length,
          completedOrders: result.completedOrders,
          backup: result.backup,
          loadRecord: result.loadRecord
        }, auditEntry(req, sessionUser, input, {
          action: "STOCK_INVENTARIO_INICIAL",
          entityType: "stock",
          entityId: result.loadRecord.id,
          entityLabel: "Inventario inicial",
          previousValue,
          newValue: {
            applied: result.applied.length,
            backup: result.backup && result.backup.id,
            source: input.fileName || input.file_name || "Carga manual"
          },
          note: input.observation || input.observacion || "Carga inicial controlada"
        }), notificationEntry(req, sessionUser, input, {
          action: "STOCK_INVENTARIO_INICIAL",
          category: "Inventario",
          title: "Inventario inicial aplicado",
          text: `${result.applied.length} productos actualizados. Backup ${result.backup.id}.`,
          tone: "ok",
          entityType: "stock",
          entityId: result.loadRecord.id,
          entityLabel: "Inventario inicial",
          audience: ["admin"]
        }), sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo aplicar el inventario inicial." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/stock/entry" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Operacion permitida solo para administradores." });
        return;
      }
      const body = await readBody(req);
      const input = JSON.parse(body || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const previousProduct = entitySnapshot(currentState, "producto", input.productCode || input.product);
        const previousOrdersByCode = new Map((currentState.orders || []).map((order) => [order.code, cloneAuditValue(order)]));
        const result = orderEngine.applyStockEntry(currentState, input, sessionUser.name);
        writeStateResponse(res, currentState, {
          completedOrders: result.completedOrders,
          product: result.product
        }, auditEntry(req, sessionUser, input, {
          action: "STOCK_MOVIMIENTO",
          entityType: "producto",
          entityId: result.product && (result.product.codigo_producto || result.product.name) || input.productCode || input.product,
          entityLabel: result.product && (result.product.name || result.product.descripcion) || input.product,
          previousValue: previousProduct,
          newValue: result.product,
          note: `${input.movementType || input.movement_type || "Ingreso"} ${input.qty || ""}`.trim()
        }), (result.completedOrders || []).map((code) => {
          const order = (currentState.orders || []).find((item) => item.code === code);
          return order ? orderStatusNotification(req, sessionUser, input, order, previousOrdersByCode.get(code), "PEDIDO_ESTADO") : null;
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar el movimiento de stock." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/suppliers" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Alta de proveedores permitida solo para administracion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        currentState.suppliers = Array.isArray(currentState.suppliers) ? currentState.suppliers.map(normalizeSupplierServerRecord) : [];
        const supplier = normalizeSupplierCreateInput(input);
        const duplicates = supplierDuplicateCandidates(currentState, supplier);
        const exactCuit = taxIdKey(supplier.cuit)
          ? duplicates.find((item) => taxIdKey(item.cuit) === taxIdKey(supplier.cuit))
          : null;
        if (exactCuit) throw new Error(`Ya existe un proveedor con ese CUIT: ${exactCuit.name}.`);
        if (duplicates.length && input.allowPossibleDuplicate !== true) {
          throw new Error(`Posible proveedor existente: ${duplicates.map((item) => item.name).join(", ")}. Confirmar duplicado para continuar.`);
        }
        const at = new Date().toISOString();
        supplier.createdAt = at;
        supplier.createdBy = sessionUser.name;
        supplier.updatedAt = at;
        supplier.updatedBy = sessionUser.name;
        currentState.suppliers.unshift(supplier);
        currentState.suppliers = currentState.suppliers.map(normalizeSupplierServerRecord);
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Proveedores",
          title: `Proveedor creado: ${supplier.name}`,
          text: `${supplier.nombre_comercial || supplier.name} queda disponible para remitos.`
        });
        writeStateResponse(res, currentState, { supplier }, auditEntry(req, sessionUser, input, {
          action: "PROVEEDOR_CREADO",
          entityType: "proveedor",
          entityId: supplier.name,
          entityLabel: supplier.name,
          previousValue: null,
          newValue: supplier,
          note: "Alta de proveedor desde modulo Proveedores"
        }), [
          notificationEntry(req, sessionUser, input, {
            action: "PROVEEDOR_CREADO",
            category: "Proveedores",
            title: "Proveedor creado",
            text: `${supplier.name} disponible para carga de remitos.`,
            tone: "ok",
            entityType: "proveedor",
            entityId: supplier.name,
            entityLabel: supplier.name,
            audience: ["admin"]
          })
        ], sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo crear el proveedor." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/suppliers/remits" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (!["admin", "receiver"].includes(sessionUser.role)) {
        sendJson(res, 403, { ok: false, error: "Carga de remitos permitida solo para administracion o recepcion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const receiverMode = sessionUser.role === "receiver" || input.receiverMode === true;
        const supplierName = String(input.supplier || "").trim();
        const remitNumber = String(input.remitNumber || input.numero_remito || "").trim();
        if (!supplierName) throw new Error("Seleccionar proveedor.");
        if (!remitNumber) throw new Error("Indicar numero de remito.");
        if (!input.fileDataUrl && !input.dataUrl) throw new Error("Adjuntar foto, imagen o PDF del remito.");
        currentState.suppliers = Array.isArray(currentState.suppliers) ? currentState.suppliers.map(normalizeSupplierServerRecord) : [];
        currentState.products = Array.isArray(currentState.products) ? currentState.products : [];
        let supplier = currentState.suppliers.find((item) => sameText(item.name, supplierName) || sameText(item.razon_social, supplierName));
        if (!supplier) {
          throw new Error("Proveedor no encontrado. Crear proveedor primero con + Nuevo proveedor.");
        }
        const duplicateRemit = (Array.isArray(currentState.supplierMovements) ? currentState.supplierMovements : []).find((movement) =>
          sameText(movement.supplier, supplier.name) && sameText(movement.remitNumber, remitNumber)
        );
        if (duplicateRemit) throw new Error(`El remito ${remitNumber} de ${supplier.name} ya fue registrado.`);
        let lines = normalizeSupplierRemitItems(currentState, { ...input, supplier: supplier.name });
        if (receiverMode) {
          lines = lines.map((line) => ({
            ...line,
            unit: "unidad",
            unitPrice: 0,
            multiplier: 1,
            stockQty: line.qty,
            subtotal: 0
          }));
        }
        if (!lines.length) throw new Error("Indicar productos recibidos en el remito.");
        lines.forEach((line) => {
          if (!line.isNewProduct) return;
          const exactDuplicates = productDuplicateCandidates(currentState, line.newProduct || line).filter((match) => {
            const sameCode = line.productCode && sameText(match.codigo_producto || match.code, line.productCode);
            const sameBarcode = line.barcode && sameText(match.codigo_barras, line.barcode);
            return sameCode || sameBarcode;
          });
          if (exactDuplicates.length) {
            throw new Error(`No se puede crear ${line.name}: el codigo o codigo de barras ya existe en ${exactDuplicates[0].name || exactDuplicates[0].descripcion}.`);
          }
        });
        const upload = saveSupplierUpload({
          dataUrl: input.fileDataUrl || input.dataUrl || "",
          supplier: supplier.name,
          remitNumber,
          kind: "supplier-remit"
        }, sessionUser);
        const previousSupplier = cloneAuditValue(supplier);
        lines = lines.map((line) => {
          if (!line.isNewProduct || !(line.newProduct && line.newProduct.photoDataUrl)) return line;
          return {
            ...line,
            newProduct: {
              ...line.newProduct,
              photoUpload: saveSupplierUpload({
                dataUrl: line.newProduct.photoDataUrl,
                supplier: supplier.name,
                remitNumber,
                kind: "supplier-product"
              }, sessionUser)
            }
          };
        });
        const at = new Date().toISOString();
        const parts = auditLocalParts(at);
        const remitId = `REM-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
        const pendingProducts = [];
        const productResults = lines.map((line) => ({
          product: line.name,
          name: line.name,
          productCode: line.productCode,
          barcode: line.barcode,
          category: line.category,
          nomenclator: line.nomenclator,
          isNewProduct: line.isNewProduct,
          newProduct: line.newProduct ? { ...line.newProduct, photoDataUrl: "" } : null,
          possibleDuplicates: line.possibleDuplicates || [],
          qty: line.qty,
          unit: line.unit,
          multiplier: line.multiplier,
          unitsPerBlister: line.unitsPerBlister,
          blistersPerBox: line.blistersPerBox,
          boxesReceived: line.boxesReceived,
          unitsPerBox: line.unitsPerBox,
          stockQty: line.stockQty,
          unitPrice: receiverMode ? 0 : line.unitPrice,
          subtotal: receiverMode ? 0 : line.subtotal,
          productValidationStatus: line.isNewProduct ? "Producto pendiente de validacion" : "Producto existente",
          stockStatus: "Pendiente de Validacion"
        }));
        const declaredAmount = receiverMode ? 0 : Math.max(0, numeric(input.amount, 0) || productResults.reduce((sum, item) => sum + numeric(item.subtotal, 0), 0));
        const remit = {
          id: remitId,
          type: "Remito",
          supplier: supplier.name,
          remitNumber,
          date: input.date || parts.date,
          time: parts.time,
          at,
          amount: 0,
          declaredAmount,
          products: productResults,
          observations: String(input.observations || input.note || "").trim(),
          upload,
          user: sessionUser.name,
          username: sessionUser.username,
          receiverOnly: receiverMode,
          adminValidationStatus: "Pendiente de Validacion",
          stockStatus: "Pendiente de Validacion",
          economicValidated: false,
          stockApplied: false,
          validatedAt: null,
          validatedBy: "",
          invoiceNumber: "",
          invoiceDate: "",
          invoiceUpload: null,
          costsValidated: false,
          differences: "",
          differenceAmount: 0,
          adminObservations: ""
        };
        productResults.forEach((line) => {
          if (!line.isNewProduct) return;
          const pendingProduct = pendingProductFromRemitLine({
            ...line,
            remitId: remit.id,
            remitNumber: remit.remitNumber
          }, sessionUser, at);
          pendingProduct.pendingRemitId = remit.id;
          pendingProduct.pendingRemitNumber = remit.remitNumber;
          pendingProducts.push(pendingProduct);
          currentState.products.unshift(pendingProduct);
        });
        if (pendingProducts.length) {
          ensurePriceListsState(currentState);
        }
        supplier.movements = Array.isArray(supplier.movements) ? supplier.movements : [];
        supplier.movements.unshift({
          type: "Remito",
          id: remit.id,
          remitNumber,
          date: remit.date,
          at,
          amount: 0,
          declaredAmount,
          text: `${productResults.length} productos recibidos. Pendiente de Validacion. ${remit.observations}`.trim(),
          upload,
          adminValidationStatus: remit.adminValidationStatus,
          stockStatus: remit.stockStatus,
          economicValidated: remit.economicValidated,
          receiverOnly: receiverMode
        });
        supplier.movements = supplier.movements.slice(0, 200);
        currentState.supplierMovements = Array.isArray(currentState.supplierMovements) ? currentState.supplierMovements : [];
        currentState.supplierMovements.unshift(remit);
        currentState.supplierMovements = currentState.supplierMovements.slice(0, 500);
        currentState.accounts = Array.isArray(currentState.accounts) ? currentState.accounts : [];
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Proveedores",
          title: `Remito ${remitNumber} pendiente`,
          text: `${supplier.name}: ${productResults.length} productos recibidos. Stock y cuenta proveedor pendientes de validacion administrativa.`
        });
        const completedOrders = [];
        const remitAuditEntries = [
          auditEntry(req, sessionUser, input, {
            action: "PROVEEDOR_REMITO_CARGADO",
            entityType: "proveedor",
            entityId: supplier.name,
            entityLabel: supplier.name,
            previousValue: previousSupplier,
            newValue: { supplier, remit },
            note: `Remito ${remitNumber} pendiente de validacion - ${productResults.length} productos`
          }),
          ...pendingProducts.map((product) => auditEntry(req, sessionUser, input, {
            action: "PRODUCTO_NUEVO_PENDIENTE_REMITO",
            entityType: "producto",
            entityId: product.codigo_producto || product.name,
            entityLabel: product.name,
            previousValue: null,
            newValue: product,
            note: `Producto creado pendiente de validacion por remito ${remitNumber}. Stock no actualizado.`
          }))
        ];
        writeStateResponse(res, currentState, { remit, supplier: stateForUser({ suppliers: [supplier] }, sessionUser).suppliers[0] || supplier, completedOrders }, remitAuditEntries, [
          notificationEntry(req, sessionUser, input, {
            action: "PROVEEDOR_REMITO_CARGADO",
            category: "Proveedores",
            title: `Remito cargado ${supplier.name}`,
            text: `Remito ${remitNumber}: ${productResults.length} productos. Pendiente validar remito, factura, costos y diferencias.`,
            tone: "warn",
            entityType: "proveedor",
            entityId: supplier.name,
            entityLabel: supplier.name,
            audience: ["admin"]
          })
        ], sessionUser);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo cargar el remito del proveedor." });
      }
      return;
    }

    const supplierRemitValidateMatch = requestUrl.pathname.match(/^\/api\/suppliers\/remits\/([^/]+)\/validate$/);
    if (supplierRemitValidateMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Validacion economica permitida solo para administracion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const remitId = decodeURIComponent(supplierRemitValidateMatch[1]);
        currentState.supplierMovements = Array.isArray(currentState.supplierMovements) ? currentState.supplierMovements : [];
        currentState.suppliers = Array.isArray(currentState.suppliers) ? currentState.suppliers.map(normalizeSupplierServerRecord) : [];
        currentState.products = Array.isArray(currentState.products) ? currentState.products : [];
        const remit = currentState.supplierMovements.find((item) => item.id === remitId);
        if (!remit) throw new Error("Remito no encontrado.");
        if (remit.economicValidated) throw new Error("El remito ya fue validado administrativamente.");
        const supplier = currentState.suppliers.find((item) => sameText(item.name, remit.supplier) || sameText(item.razon_social, remit.supplier));
        if (!supplier) throw new Error("Proveedor no encontrado para validar remito.");
        const amount = Math.max(0, numeric(input.amount, 0));
        const invoiceNumber = String(input.invoiceNumber || input.factura || "").trim();
        if (!invoiceNumber) throw new Error("Indicar numero de factura para conciliar el remito.");
        const previousSupplier = cloneAuditValue(supplier);
        const previousRemit = cloneAuditValue(remit);
        const previousOrdersByCode = new Map((currentState.orders || []).map((order) => [order.code, cloneAuditValue(order)]));
        const lineValidations = Array.isArray(input.lineValidations) ? input.lineValidations : [];
        const pricingAuditEntries = [];
        const at = new Date().toISOString();
        const parts = auditLocalParts(at);
        const invoiceUpload = input.invoiceFileDataUrl || input.invoiceDataUrl
          ? saveSupplierUpload({
              dataUrl: input.invoiceFileDataUrl || input.invoiceDataUrl,
              supplier: supplier.name,
              remitNumber: invoiceNumber || remit.remitNumber || remit.id,
              kind: "supplier-invoice"
            }, sessionUser)
          : null;
        const completedSet = new Set();
        const productResults = (Array.isArray(remit.products) ? remit.products : []).map((line, index) => {
          const product = findProductByRemitItem(currentState, line);
          if (!product) throw new Error(`Producto no encontrado para validar remito: ${line.name || line.product || index + 1}.`);
          const validation = validationForRemitLine(lineValidations, line, index);
          const productWasPending = Boolean(line.isNewProduct || product.pendingValidation || normalizeSearchText(product.estado).includes("pendiente"));
          const shouldUpdatePricing = productWasPending || validation.updatePricing === true;
          let previousProductForPricing = null;
          if (shouldUpdatePricing) {
            previousProductForPricing = applyValidatedPricing(product, validation, sessionUser, at);
            pricingAuditEntries.push(auditEntry(req, sessionUser, input, {
              action: productWasPending ? "PRODUCTO_NUEVO_VALIDADO" : "PRODUCTO_COSTO_LISTAS_ACTUALIZADO",
              entityType: "producto",
              entityId: product.codigo_producto || product.name,
              entityLabel: product.name || product.descripcion,
              previousValue: previousProductForPricing,
              newValue: product,
              note: `Validacion de costo/listas por remito ${remit.remitNumber || remit.id}`
            }));
          }
          const result = orderEngine.applyStockEntry(currentState, {
            productCode: product.codigo_producto || line.productCode,
            product: product.name || line.product || line.name,
            qty: numeric(line.stockQty, line.qty),
            supplier: supplier.name,
            movementType: "INGRESO POR REMITO DE PROVEEDOR",
            remitNumber: remit.remitNumber || remit.id,
            note: `Remito ${remit.remitNumber || remit.id} validado`
          }, sessionUser.name);
          (result.completedOrders || []).forEach((code) => completedSet.add(code));
          const productName = result.product && (result.product.name || result.product.descripcion) || line.product || line.name;
          return {
            ...line,
            product: productName,
            name: productName,
            isNewProduct: false,
            productValidationStatus: "Validado por administracion",
            costValidated: shouldUpdatePricing,
            costValidatedAt: shouldUpdatePricing ? at : line.costValidatedAt || "",
            costValidatedBy: shouldUpdatePricing ? sessionUser.name : line.costValidatedBy || "",
            unitPrice: shouldUpdatePricing ? numeric(result.product && result.product.costo, line.unitPrice) : line.unitPrice,
            priceLists: SYSTEM_PRICE_LISTS.map((number) => ({
              listNumber: number,
              marginPct: numeric(result.product && result.product[`margen_lista_${number}`], 0),
              price: numeric(result.product && result.product[`precio_lista_${number}`], 0)
            })),
            stockStatus: "Ingresado a Stock",
            stockAppliedQty: numeric(line.stockQty, line.qty),
            stockAppliedAt: at,
            stockAppliedBy: sessionUser.name
          };
        });
        remit.amount = amount;
        remit.adminValidationStatus = "Validado por administracion";
        remit.stockStatus = "Ingresado a Stock";
        remit.economicValidated = true;
        remit.stockApplied = true;
        remit.validatedAt = at;
        remit.validatedBy = sessionUser.name;
        remit.invoiceNumber = invoiceNumber;
        remit.invoiceDate = String(input.invoiceDate || "").trim();
        remit.invoiceUpload = invoiceUpload || remit.invoiceUpload || null;
        remit.costsValidated = input.costsValidated !== false;
        remit.differences = String(input.differences || "").trim();
        remit.differenceAmount = numeric(input.differenceAmount, 0);
        remit.adminObservations = String(input.observations || input.note || "").trim();
        remit.products = productResults;
        ensurePriceListsState(currentState);
        supplier.totalPurchased = numeric(supplier.totalPurchased, 0) + amount;
        supplier.total_comprado = supplier.totalPurchased;
        supplier.balance = numeric(supplier.balance, 0) + amount;
        supplier.saldo_pendiente = supplier.balance;
        supplier.status = supplierStatusFromBalance(supplier.balance);
        supplier.movements = Array.isArray(supplier.movements) ? supplier.movements : [];
        supplier.movements = supplier.movements.map((movement) => {
          if (movement.id !== remit.id && movement.remitNumber !== remit.remitNumber) return movement;
          return {
            ...movement,
            amount,
            adminValidationStatus: remit.adminValidationStatus,
            stockStatus: remit.stockStatus,
            economicValidated: true,
            stockApplied: true,
            validatedAt: at,
            validatedBy: sessionUser.name,
            invoiceNumber: remit.invoiceNumber,
            invoiceUpload: remit.invoiceUpload,
            differences: remit.differences,
            differenceAmount: remit.differenceAmount,
            adminObservations: remit.adminObservations
          };
        });
        currentState.accounts = Array.isArray(currentState.accounts) ? currentState.accounts : [];
        if (amount > 0) {
          currentState.accounts.unshift({
            date: remit.date || parts.date,
            type: "Remito proveedor validado",
            account: supplier.name,
            method: "Cuenta proveedor",
            debit: amount,
            credit: 0,
            balance: supplier.balance,
            remitNumber: remit.remitNumber,
            remitId: remit.id,
            user: sessionUser.name
          });
        }
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Proveedores",
          title: `Remito ${remit.remitNumber || remit.id} validado`,
          text: `${supplier.name}: factura ${invoiceNumber}, stock ingresado, importe ${amount}. ${remit.adminObservations}`.trim()
        });
        const completedOrders = Array.from(completedSet);
        writeStateResponse(res, currentState, { remit, supplier, completedOrders }, [
          auditEntry(req, sessionUser, input, {
            action: "PROVEEDOR_REMITO_VALIDADO",
            entityType: "proveedor",
            entityId: supplier.name,
            entityLabel: supplier.name,
            previousValue: { supplier: previousSupplier, remit: previousRemit },
            newValue: { supplier, remit },
            note: `Remito ${remit.remitNumber || remit.id} conciliado con factura ${invoiceNumber} por ${amount}`
          }),
          ...pricingAuditEntries
        ], [
          notificationEntry(req, sessionUser, input, {
            action: "PROVEEDOR_REMITO_VALIDADO",
            category: "Proveedores",
            title: `Remito validado ${supplier.name}`,
            text: `Remito ${remit.remitNumber || remit.id}: factura ${invoiceNumber}, stock ingresado, saldo proveedor ${supplier.balance}.`,
            tone: "ok",
            entityType: "proveedor",
            entityId: supplier.name,
            entityLabel: supplier.name,
            audience: ["admin"]
          }),
          ...completedOrders.map((code) => {
            const order = (currentState.orders || []).find((item) => item.code === code);
            return order ? orderStatusNotification(req, sessionUser, input, order, previousOrdersByCode.get(code), "PEDIDO_ESTADO") : null;
          })
        ]);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo validar el remito." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/suppliers/payments" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Pagos a proveedores permitidos solo para administracion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        currentState.suppliers = Array.isArray(currentState.suppliers) ? currentState.suppliers.map(normalizeSupplierServerRecord) : [];
        currentState.supplierMovements = Array.isArray(currentState.supplierMovements) ? currentState.supplierMovements : [];
        const supplierName = String(input.supplier || "").trim();
        const method = String(input.method || input.paymentMethod || "").trim();
        const amount = Math.max(0, numeric(input.amount, 0));
        if (!supplierName) throw new Error("Seleccionar proveedor.");
        if (!["Efectivo", "Transferencia", "Mercaderia"].includes(method)) throw new Error("Seleccionar medio de pago valido.");
        if (amount <= 0) throw new Error("Indicar importe del pago.");
        if (!input.fileDataUrl && !input.dataUrl) throw new Error("Adjuntar documentacion de respaldo del pago.");
        const supplier = currentState.suppliers.find((item) => sameText(item.name, supplierName) || sameText(item.razon_social, supplierName));
        if (!supplier) throw new Error("Proveedor no encontrado.");
        const previousSupplier = cloneAuditValue(supplier);
        const at = new Date().toISOString();
        const parts = auditLocalParts(at);
        const upload = saveSupplierUpload({
          dataUrl: input.fileDataUrl || input.dataUrl,
          supplier: supplier.name,
          remitNumber: `pago-${method}`,
          kind: "supplier-payment"
        }, sessionUser);
        const payment = {
          id: `PAG-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          type: "Pago proveedor",
          supplier: supplier.name,
          method,
          date: input.date || parts.date,
          time: parts.time,
          at,
          amount,
          bank: String(input.bank || "").trim(),
          operationNumber: String(input.operationNumber || "").trim(),
          merchandiseDetail: String(input.merchandiseDetail || "").trim(),
          observations: String(input.observations || input.note || "").trim(),
          upload,
          status: "Pendiente conciliacion",
          paymentStatus: "Pendiente conciliacion",
          reconciled: false,
          reconciledAt: null,
          reconciledBy: "",
          user: sessionUser.name,
          username: sessionUser.username
        };
        supplier.movements = Array.isArray(supplier.movements) ? supplier.movements : [];
        supplier.movements.unshift({
          type: "Pago proveedor",
          id: payment.id,
          date: payment.date,
          at,
          amount,
          method,
          text: `Pago ${method} pendiente de conciliacion. ${payment.observations}`.trim(),
          upload,
          status: payment.status,
          paymentStatus: payment.paymentStatus,
          reconciled: false
        });
        supplier.movements = supplier.movements.slice(0, 200);
        currentState.supplierMovements.unshift(payment);
        currentState.supplierMovements = currentState.supplierMovements.slice(0, 500);
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Proveedores",
          title: `Pago proveedor ${supplier.name}`,
          text: `${method} ${amount}. Pendiente de conciliacion administrativa.`
        });
        writeStateResponse(res, currentState, { payment, supplier }, auditEntry(req, sessionUser, input, {
          action: "PROVEEDOR_PAGO_CARGADO",
          entityType: "proveedor",
          entityId: supplier.name,
          entityLabel: supplier.name,
          previousValue: previousSupplier,
          newValue: { supplier, payment },
          note: `Pago ${method} pendiente de conciliacion por ${amount}`
        }), notificationEntry(req, sessionUser, input, {
          action: "PROVEEDOR_PAGO_CARGADO",
          category: "Proveedores",
          title: `Pago pendiente ${supplier.name}`,
          text: `${method} ${amount}. Requiere conciliacion administrativa.`,
          tone: "warn",
          entityType: "proveedor",
          entityId: supplier.name,
          entityLabel: supplier.name,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar el pago del proveedor." });
      }
      return;
    }

    const supplierPaymentReconcileMatch = requestUrl.pathname.match(/^\/api\/suppliers\/payments\/([^/]+)\/reconcile$/);
    if (supplierPaymentReconcileMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Conciliacion de pagos permitida solo para administracion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const paymentId = decodeURIComponent(supplierPaymentReconcileMatch[1]);
        currentState.supplierMovements = Array.isArray(currentState.supplierMovements) ? currentState.supplierMovements : [];
        currentState.suppliers = Array.isArray(currentState.suppliers) ? currentState.suppliers.map(normalizeSupplierServerRecord) : [];
        const payment = currentState.supplierMovements.find((item) => item.id === paymentId && String(item.type || "") === "Pago proveedor");
        if (!payment) throw new Error("Pago no encontrado.");
        if (payment.reconciled) throw new Error("El pago ya fue conciliado.");
        const supplier = currentState.suppliers.find((item) => sameText(item.name, payment.supplier) || sameText(item.razon_social, payment.supplier));
        if (!supplier) throw new Error("Proveedor no encontrado para conciliar pago.");
        const previousSupplier = cloneAuditValue(supplier);
        const previousPayment = cloneAuditValue(payment);
        const at = new Date().toISOString();
        const parts = auditLocalParts(at);
        const amount = Math.max(0, numeric(payment.amount, 0));
        supplier.totalPaid = numeric(supplier.totalPaid, 0) + amount;
        supplier.total_pagado = supplier.totalPaid;
        supplier.balance = Math.max(0, numeric(supplier.balance, 0) - amount);
        supplier.saldo_pendiente = supplier.balance;
        supplier.status = supplierStatusFromBalance(supplier.balance);
        payment.status = "Pago conciliado";
        payment.paymentStatus = "Pago conciliado";
        payment.reconciled = true;
        payment.reconciledAt = at;
        payment.reconciledBy = sessionUser.name;
        payment.adminObservations = String(input.observations || input.note || "").trim();
        supplier.movements = Array.isArray(supplier.movements) ? supplier.movements : [];
        supplier.movements = supplier.movements.map((movement) => {
          if (movement.id !== payment.id) return movement;
          return {
            ...movement,
            status: payment.status,
            paymentStatus: payment.paymentStatus,
            reconciled: true,
            reconciledAt: at,
            reconciledBy: sessionUser.name,
            adminObservations: payment.adminObservations,
            text: `Pago ${payment.method} conciliado. ${payment.adminObservations}`.trim()
          };
        });
        currentState.accounts = Array.isArray(currentState.accounts) ? currentState.accounts : [];
        currentState.accounts.unshift({
          date: payment.date || parts.date,
          type: "Pago proveedor conciliado",
          account: supplier.name,
          method: payment.method,
          debit: 0,
          credit: amount,
          balance: supplier.balance,
          paymentId: payment.id,
          user: sessionUser.name
        });
        currentState.activity = Array.isArray(currentState.activity) ? currentState.activity : [];
        currentState.activity.unshift({
          type: "Proveedores",
          title: `Pago ${payment.id} conciliado`,
          text: `${supplier.name}: ${payment.method} ${amount}. Saldo proveedor ${supplier.balance}.`
        });
        writeStateResponse(res, currentState, { payment, supplier }, auditEntry(req, sessionUser, input, {
          action: "PROVEEDOR_PAGO_CONCILIADO",
          entityType: "proveedor",
          entityId: supplier.name,
          entityLabel: supplier.name,
          previousValue: { supplier: previousSupplier, payment: previousPayment },
          newValue: { supplier, payment },
          note: `Pago ${payment.id} conciliado por ${amount}`
        }), notificationEntry(req, sessionUser, input, {
          action: "PROVEEDOR_PAGO_CONCILIADO",
          category: "Proveedores",
          title: `Pago conciliado ${supplier.name}`,
          text: `${payment.method} ${amount}. Saldo proveedor ${supplier.balance}.`,
          tone: "ok",
          entityType: "proveedor",
          entityId: supplier.name,
          entityLabel: supplier.name,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo conciliar el pago del proveedor." });
      }
      return;
    }

    const transferProofMatch = requestUrl.pathname.match(/^\/api\/bank-reconciliation\/transfers\/([^/]+)\/proof$/);
    if (transferProofMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Carga de comprobantes permitida solo para administracion." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const transferId = decodeURIComponent(transferProofMatch[1]);
        const previousTransfer = entitySnapshot(currentState, "transferencia", transferId);
        const transferBefore = (accountEngine.ensureTransferReconciliation(currentState) || []).find((item) => item.id === transferId);
        if (!transferBefore) throw new Error("Transferencia no encontrada para adjuntar comprobante.");
        const upload = saveDeliveryUpload({
          orderCode: transferBefore.orderCode || transferId,
          kind: "transfer-proof",
          dataUrl: input.dataUrl || input.fileDataUrl || ""
        }, sessionUser);
        const transfer = accountEngine.attachTransferProof(
          currentState,
          transferId,
          { attachment: upload, observations: input.observations || input.note || "" },
          { user: sessionUser.name, username: sessionUser.username, role: sessionUser.role }
        );
        if (transfer && transfer.orderCode) {
          appendOrderTraceEvent(currentState, transfer.orderCode, input, {
            actor: sessionUser.name,
            action: "COMPROBANTE_RECIBIDO",
            status: entitySnapshot(currentState, "pedido", transfer.orderCode)?.status || orderEngine.STATUS.DELIVERED,
            note: `${transfer.bank || "Banco"} - ${transfer.alias || "Alias"} - ${transfer.amount || 0}. Comprobante cargado, deuda pendiente hasta validacion bancaria.`
          });
        }
        writeStateResponse(res, currentState, { transfer, upload }, auditEntry(req, sessionUser, input, {
          action: "COMPROBANTE_RECIBIDO",
          entityType: "transferencia",
          entityId: transferId,
          entityLabel: transfer && (transfer.orderCode || transfer.client) || transferId,
          previousValue: previousTransfer,
          newValue: transfer,
          note: input.observations || input.note || ""
        }), notificationEntry(req, sessionUser, input, {
          action: "COMPROBANTE_RECIBIDO",
          category: "Conciliacion",
          title: `Comprobante recibido ${transfer.orderCode || transferId}`,
          text: `${transfer.client || "Cliente"} - ${transfer.amount}. Pendiente de validacion bancaria.`,
          tone: "warn",
          entityType: "transferencia",
          entityId: transferId,
          entityLabel: transfer.orderCode || transfer.client || transferId,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo cargar el comprobante." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/bank-reconciliation/transfers/bulk-status" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Conciliacion masiva permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const transferIds = Array.from(new Set((input.transferIds || input.ids || []).map((id) => String(id || "").trim()).filter(Boolean)));
        if (!transferIds.length) throw new Error("Seleccionar comprobantes para operar en lote.");
        accountEngine.ensureTransferReconciliation(currentState);
        const status = String(input.status || "");
        const transferStatus = accountEngine.TRANSFER_STATUS || {};
        const context = {
          user: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          reason: input.reason || input.note || input.observations || ""
        };
        const previousById = new Map(transferIds.map((id) => [id, entitySnapshot(currentState, "transferencia", id)]));
        const processed = [];
        const errors = [];
        transferIds.forEach((transferId) => {
          try {
            let transfer = null;
            if (status === "OBSERVACION_ADMIN") {
              transfer = (currentState.bankReconciliation || []).find((item) => item.id === transferId);
              if (!transfer) throw new Error("Transferencia no encontrada.");
              transfer.adminObservations = String(input.observations || input.note || "").trim();
              transfer.history = Array.isArray(transfer.history) ? transfer.history : [];
              transfer.history.push({
                action: "OBSERVACION_ADMINISTRATIVA",
                user: sessionUser.name,
                username: sessionUser.username,
                at: new Date().toISOString(),
                date: auditLocalParts(new Date().toISOString()).date,
                time: auditLocalParts(new Date().toISOString()).time,
                observations: transfer.adminObservations
              });
            } else if (status === "Validada" || status === transferStatus.VALIDATED || status === transferStatus.CONFIRMED || status === transferStatus.ACCOUNT_UPDATED) {
              transfer = accountEngine.validateTransfer(currentState, transferId, input, context);
            } else if (status === "Rechazada" || status === transferStatus.OBSERVED) {
              transfer = accountEngine.rejectTransferProof(currentState, transferId, input, context);
            } else {
              transfer = accountEngine.setTransferStatus(currentState, transferId, status, context);
            }
            if (transfer && transfer.orderCode) {
              appendOrderTraceEvent(currentState, transfer.orderCode, input, {
                actor: sessionUser.name,
                action: status === "OBSERVACION_ADMIN" ? "OBSERVACION_ADMINISTRATIVA" : "TRANSFERENCIA_ESTADO_MASIVO",
                status: entitySnapshot(currentState, "pedido", transfer.orderCode)?.status || orderEngine.STATUS.COLLECTED,
                note: `${transfer.bank || "Banco"} - ${transfer.amount || 0}. Estado: ${transfer.status || status}. ${input.observations || input.reason || ""}`.trim()
              });
            }
            processed.push(transfer);
          } catch (error) {
            errors.push({ transferId, error: error.message || "Error" });
          }
        });
        if (!processed.length && errors.length) throw new Error(errors.map((item) => `${item.transferId}: ${item.error}`).join(" | "));
        writeStateResponse(res, currentState, { processed: processed.length, transfers: processed, errors }, processed.map((transfer) => auditEntry(req, sessionUser, input, {
          action: status === "OBSERVACION_ADMIN" ? "TRANSFERENCIA_OBSERVACION_ADMIN" : "TRANSFERENCIA_ESTADO_MASIVO",
          entityType: "transferencia",
          entityId: transfer && transfer.id,
          entityLabel: transfer && (transfer.orderCode || transfer.client || transfer.id),
          previousValue: transfer && previousById.get(transfer.id),
          newValue: transfer,
          note: input.reason || input.observations || input.status || status
        })), processed.map((transfer) => notificationEntry(req, sessionUser, input, {
          action: status === "OBSERVACION_ADMIN" ? "TRANSFERENCIA_OBSERVACION_ADMIN" : "TRANSFERENCIA_ESTADO_MASIVO",
          category: "Conciliacion",
          title: `${processed.length} transferencias procesadas`,
          text: `${transfer.client || "Cliente"} - ${transfer.amount || 0} - ${transfer.status || status}.`,
          tone: transfer.status === transferStatus.ACCOUNT_UPDATED ? "ok" : (transfer.status === transferStatus.OBSERVED ? "danger" : "warn"),
          entityType: "transferencia",
          entityId: transfer.id,
          entityLabel: transfer.orderCode || transfer.client || transfer.id,
          audience: ["admin"]
        })));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo procesar la conciliacion masiva." });
      }
      return;
    }

    const transferStatusMatch = requestUrl.pathname.match(/^\/api\/bank-reconciliation\/transfers\/([^/]+)\/status$/);
    if (transferStatusMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Conciliacion permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const transferId = decodeURIComponent(transferStatusMatch[1]);
        const previousTransfer = entitySnapshot(currentState, "transferencia", transferId);
        const status = String(input.status || "");
        const transferStatus = accountEngine.TRANSFER_STATUS || {};
        const context = { user: sessionUser.name, username: sessionUser.username, role: sessionUser.role, reason: input.reason || input.note || "" };
        const transfer = status === "Validada" || status === transferStatus.VALIDATED || status === transferStatus.CONFIRMED || status === transferStatus.ACCOUNT_UPDATED
          ? accountEngine.validateTransfer(currentState, transferId, input, context)
          : (status === "Rechazada" || status === transferStatus.OBSERVED
              ? accountEngine.rejectTransferProof(currentState, transferId, input, context)
              : accountEngine.setTransferStatus(currentState, transferId, status, context));
        if (transfer && transfer.orderCode) {
          const action = transfer.status === transferStatus.ACCOUNT_UPDATED || transfer.status === transferStatus.VALIDATED
            ? "COMPROBANTE_VALIDADO"
            : transfer.status === transferStatus.OBSERVED
              ? "COMPROBANTE_RECHAZADO"
              : "TRANSFERENCIA_ESTADO";
          appendOrderTraceEvent(currentState, transfer.orderCode, input, {
            actor: sessionUser.name,
            action,
            status: entitySnapshot(currentState, "pedido", transfer.orderCode)?.status || orderEngine.STATUS.COLLECTED,
            note: `${transfer.bank || "Banco"} - ${transfer.alias || "Alias"} - ${transfer.amount || 0}. Estado: ${transfer.status || input.status || ""}${transfer.statusReason ? ` - ${transfer.statusReason}` : ""}`
          });
        }
        writeStateResponse(res, currentState, { transfer }, auditEntry(req, sessionUser, input, {
          action: "TRANSFERENCIA_ESTADO",
          entityType: "transferencia",
          entityId: transferId,
          entityLabel: transfer && (transfer.orderCode || transfer.client) || transferId,
          previousValue: previousTransfer,
          newValue: transfer,
          note: input.reason || input.note || input.status || ""
        }), transfer ? notificationEntry(req, sessionUser, input, {
          action: transfer.status === transferStatus.ACCOUNT_UPDATED ? "TRANSFERENCIA_VALIDADA" : (transfer.status === transferStatus.OBSERVED ? "COMPROBANTE_RECHAZADO" : "TRANSFERENCIA_ESTADO"),
          category: "Conciliacion",
          title: transfer.status === transferStatus.ACCOUNT_UPDATED
            ? `Transferencia validada ${transfer.orderCode || transferId}`
            : (transfer.status === transferStatus.OBSERVED ? `Comprobante observado ${transfer.orderCode || transferId}` : `Transferencia ${transfer.status}`),
          text: `${transfer.client || "Cliente"} - ${transfer.bank || "Banco"} - ${transfer.amount}. ${transfer.statusReason || ""}`.trim(),
          tone: transfer.status === transferStatus.ACCOUNT_UPDATED ? "ok" : (transfer.status === transferStatus.OBSERVED ? "danger" : "warn"),
          entityType: "transferencia",
          entityId: transferId,
          entityLabel: transfer.orderCode || transfer.client || transferId,
          audience: ["admin", "driver"]
        }) : null);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo actualizar la transferencia." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/delivery" && req.method === "GET") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      orderEngine.migrateState(currentState);
      deliveryEngine.migrateState(currentState);
      sendJson(res, 200, {
        ok: true,
        version: currentPayload.version || 0,
        settings: currentState.deliverySettings,
        routes: currentState.deliveryRoutes,
        closures: currentState.deliveryClosures || [],
        audit: currentState.deliveryAudit.slice(0, 200)
      });
      return;
    }

    if (requestUrl.pathname === "/api/delivery/routes/plan" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Planificacion permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const route = deliveryEngine.createPlannedRoute(currentState, input, deliveryContext(sessionUser, input));
        writeStateResponse(res, currentState, { route }, auditEntry(req, sessionUser, input, {
          action: "RUTA_PLANIFICADA",
          entityType: "ruta",
          entityId: route.id,
          entityLabel: route.zone || route.id,
          previousValue: null,
          newValue: route,
          note: `${(route.stops || []).length} pedidos planificados`
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo planificar la ruta." });
      }
      return;
    }

    const routeReorderMatch = requestUrl.pathname.match(/^\/api\/delivery\/routes\/([^/]+)\/reorder$/);
    if (routeReorderMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Reordenamiento permitido solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const routeId = decodeURIComponent(routeReorderMatch[1]);
        const previousRoute = entitySnapshot(currentState, "ruta", routeId);
        const route = deliveryEngine.reorderRoute(
          currentState,
          routeId,
          input.orderCodes || [],
          deliveryContext(sessionUser, input)
        );
        writeStateResponse(res, currentState, { route }, auditEntry(req, sessionUser, input, {
          action: "RUTA_REORDENADA",
          entityType: "ruta",
          entityId: routeId,
          entityLabel: route.zone || routeId,
          previousValue: previousRoute,
          newValue: route,
          note: "Orden manual de paradas"
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo reordenar la ruta." });
      }
      return;
    }

    const routePublishMatch = requestUrl.pathname.match(/^\/api\/delivery\/routes\/([^/]+)\/publish$/);
    if (routePublishMatch && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Publicacion permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const routeId = decodeURIComponent(routePublishMatch[1]);
        const previousRoute = entitySnapshot(currentState, "ruta", routeId);
        const previousOrdersByCode = new Map((currentState.orders || []).map((order) => [order.code, cloneAuditValue(order)]));
        const route = deliveryEngine.publishRoute(
          currentState,
          routeId,
          deliveryContext(sessionUser, input)
        );
        writeStateResponse(res, currentState, { route }, auditEntry(req, sessionUser, input, {
          action: "RUTA_PUBLICADA",
          entityType: "ruta",
          entityId: routeId,
          entityLabel: route.zone || routeId,
          previousValue: previousRoute,
          newValue: route,
          note: "Ruta publicada para despacho"
        }), [
          notificationEntry(req, sessionUser, input, {
            action: "RUTA_PUBLICADA",
            category: "Reparto",
            title: `Ruta publicada ${route.id}`,
            text: `${(route.stops || []).length} pedidos despachados para ${route.deviceLabel || route.driverUser || "reparto"}.`,
            tone: "ok",
            entityType: "ruta",
            entityId: route.id,
            entityLabel: route.zone || route.id,
            audience: ["admin", "driver"]
          }),
          ...(route.stops || []).map((stop) => {
            const order = (currentState.orders || []).find((item) => item.code === stop.orderCode);
            return order ? orderStatusNotification(req, sessionUser, input, order, previousOrdersByCode.get(order.code), "PEDIDO_DESPACHADO") : null;
          })
        ]);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo publicar la ruta." });
      }
      return;
    }

    const claimRouteMatch = requestUrl.pathname.match(/^\/api\/delivery\/routes\/([^/]+)\/claim$/);
    if (claimRouteMatch && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const routeId = decodeURIComponent(claimRouteMatch[1]);
        const previousRoute = entitySnapshot(currentState, "ruta", routeId);
        const route = deliveryEngine.claimRoute(
          currentState,
          routeId,
          deliveryContext(sessionUser, input)
        );
        writeStateResponse(res, currentState, { route }, auditEntry(req, sessionUser, input, {
          action: "RUTA_TOMADA",
          entityType: "ruta",
          entityId: routeId,
          entityLabel: route.zone || routeId,
          previousValue: previousRoute,
          newValue: route,
          note: "Dispositivo tomo la ruta"
        }), notificationEntry(req, sessionUser, input, {
          action: "RUTA_INICIADA",
          category: "Reparto",
          title: `Repartidor inicio ruta ${route.id}`,
          text: `${route.deviceLabel || sessionUser.name} tomo ${route.zone || "ruta"} con ${(route.stops || []).length} paradas.`,
          tone: "ok",
          entityType: "ruta",
          entityId: route.id,
          entityLabel: route.zone || route.id,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo asignar la ruta." });
      }
      return;
    }

    const closeRouteMatch = requestUrl.pathname.match(/^\/api\/delivery\/routes\/([^/]+)\/close$/);
    if (closeRouteMatch && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const routeId = decodeURIComponent(closeRouteMatch[1]);
        const previousRoute = entitySnapshot(currentState, "ruta", routeId);
        const result = deliveryEngine.closeRoute(
          currentState,
          routeId,
          input,
          deliveryContext(sessionUser, input)
        );
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "RUTA_CIERRE_DIARIO",
          entityType: "ruta",
          entityId: routeId,
          entityLabel: result.route && (result.route.zone || result.route.id) || routeId,
          previousValue: previousRoute,
          newValue: result.route,
          note: result.closure ? `Diferencia ${result.closure.totalDifference}` : "Cierre diario"
        }), notificationEntry(req, sessionUser, input, {
          action: "RUTA_CERRADA",
          category: "Reparto",
          title: `Ruta cerrada ${routeId}`,
          text: result.closure ? `Entregados ${result.closure.deliveredOrders || 0}, pendientes ${result.closure.pendingOrders || 0}, diferencia ${result.closure.totalDifference || 0}.` : "Cierre diario registrado.",
          tone: result.closure && Math.abs(Number(result.closure.totalDifference || 0)) > 0 ? "warn" : "ok",
          entityType: "ruta",
          entityId: routeId,
          entityLabel: result.route && (result.route.zone || result.route.id) || routeId,
          audience: ["admin"]
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo cerrar la ruta." });
      }
      return;
    }

    const deliveryStatusMatch = requestUrl.pathname.match(/^\/api\/delivery\/orders\/([^/]+)\/status$/);
    if (deliveryStatusMatch && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const orderCode = decodeURIComponent(deliveryStatusMatch[1]);
        const previousOrder = entitySnapshot(currentState, "pedido", orderCode);
        const result = deliveryEngine.updateStopStatus(
          currentState,
          orderCode,
          String(input.status || ""),
          deliveryContext(sessionUser, input)
        );
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "REPARTO_ESTADO",
          entityType: "pedido",
          entityId: orderCode,
          entityLabel: result.order && result.order.client || orderCode,
          previousValue: previousOrder,
          newValue: result.order,
          note: input.status || ""
        }), orderStatusNotification(req, sessionUser, input, result.order, previousOrder, "PEDIDO_ESTADO"));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo actualizar la entrega." });
      }
      return;
    }

    const deliveryCollectMatch = requestUrl.pathname.match(/^\/api\/delivery\/orders\/([^/]+)\/collect$/);
    if (deliveryCollectMatch && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const context = deliveryContext(sessionUser, input);
        const orderCode = decodeURIComponent(deliveryCollectMatch[1]);
        const previousOrder = entitySnapshot(currentState, "pedido", orderCode);
        const result = deliveryEngine.collectAndDeliver(
          currentState,
          orderCode,
          input,
          context
        );
        const collection = result.order && result.order.collection || {};
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: "REPARTO_ENTREGA_COBRANZA",
          entityType: "pedido",
          entityId: orderCode,
          entityLabel: result.order && result.order.client || orderCode,
          previousValue: previousOrder,
          newValue: result.order,
          note: `${collection.method || input.method || ""} efectivo ${collection.cashAmount || 0}, transferencia ${collection.transferAmount || 0}, cuenta corriente ${collection.pendingAmount || 0}`
        }), [
          notificationEntry(req, sessionUser, input, {
            action: "PEDIDO_ENTREGADO",
            category: "Reparto",
            title: `Pedido entregado ${orderCode}`,
            text: `${result.order && result.order.client || "Cliente"} - ${collection.method || input.method || ""}, efectivo ${collection.cashAmount || 0}, transferencia ${collection.transferAmount || 0}, pendiente ${collection.pendingAmount || 0}.`,
            tone: Number(collection.pendingAmount || 0) > 0 ? "warn" : "ok",
            entityType: "pedido",
            entityId: orderCode,
            entityLabel: result.order && result.order.client || orderCode,
            audience: ["admin"]
          }),
          result.order && result.order.collection && result.order.collection.transferReceipt && !result.order.collection.transferReceipt.attachment ? notificationEntry(req, sessionUser, input, {
            action: "COMPROBANTE_SUBIDO",
            category: "Comprobantes",
            title: `Comprobante subido ${orderCode}`,
            text: `${result.order.collection.transferReceipt.bank || "Banco"} - ${result.order.collection.transferReceipt.alias || "Alias"} - ${result.order.collection.transferReceipt.amount || input.amountPaid || 0}.`,
            tone: "warn",
            entityType: "pedido",
            entityId: orderCode,
            entityLabel: result.order && result.order.client || orderCode,
            audience: ["admin"]
          }) : null,
          result.order && result.order.returnSummary && Number(result.order.returnSummary.returnedQty || 0) > 0 ? notificationEntry(req, sessionUser, input, {
            action: "DEVOLUCION_REGISTRADA",
            category: "Reparto",
            title: `Devolucion registrada ${orderCode}`,
            text: `${result.order.returnSummary.returnedQty} unidades por ${result.order.collection && result.order.collection.returnReason || "motivo informado"}.`,
            tone: "warn",
            entityType: "pedido",
            entityId: orderCode,
            entityLabel: result.order && result.order.client || orderCode,
            audience: ["admin"]
          }) : null
        ]);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar la cobranza." });
      }
      return;
    }

    const deliveryExceptionMatch = requestUrl.pathname.match(/^\/api\/delivery\/orders\/([^/]+)\/exception$/);
    if (deliveryExceptionMatch && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const context = deliveryContext(sessionUser, input);
        const orderCode = decodeURIComponent(deliveryExceptionMatch[1]);
        const previousOrder = entitySnapshot(currentState, "pedido", orderCode);
        const result = deliveryEngine.markStopException(
          currentState,
          orderCode,
          input,
          context
        );
        const isRejected = result.order && result.order.status === orderEngine.STATUS.REJECTED;
        writeStateResponse(res, currentState, result, auditEntry(req, sessionUser, input, {
          action: isRejected ? "PEDIDO_RECHAZADO" : "PEDIDO_NO_ENTREGADO",
          entityType: "pedido",
          entityId: orderCode,
          entityLabel: result.order && result.order.client || orderCode,
          previousValue: previousOrder,
          newValue: result.order,
          note: `${input.status || ""} - ${input.reason || input.motivo || ""}`
        }), [
          notificationEntry(req, sessionUser, input, {
            action: isRejected ? "PEDIDO_RECHAZADO" : "PEDIDO_NO_ENTREGADO",
            category: "Reparto",
            title: `${isRejected ? "Pedido rechazado" : "Pedido no entregado"} ${orderCode}`,
            text: `${result.order && result.order.client || "Cliente"} - ${input.reason || input.motivo || "motivo informado"}.`,
            tone: isRejected ? "danger" : "warn",
            entityType: "pedido",
            entityId: orderCode,
            entityLabel: result.order && result.order.client || orderCode,
            audience: ["admin"]
          }),
          orderStatusNotification(req, sessionUser, input, result.order, previousOrder, isRejected ? "PEDIDO_RECHAZADO" : "PEDIDO_ESTADO")
        ]);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo registrar la incidencia de reparto." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/delivery/settings" && req.method === "POST") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Configuracion permitida solo para administradores." });
        return;
      }
      const input = JSON.parse(await readBody(req) || "{}");
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      try {
        const previousSettings = cloneAuditValue(currentState.deliverySettings || {});
        const settings = deliveryEngine.updateSettings(currentState, input, deliveryContext(sessionUser, input));
        writeStateResponse(res, currentState, { settings }, auditEntry(req, sessionUser, input, {
          action: "REPARTO_CONFIGURACION",
          entityType: "configuracion",
          entityId: "deliverySettings",
          entityLabel: "Configuracion de cobranza",
          previousValue: previousSettings,
          newValue: settings,
          note: "Alias, CBU o deposito"
        }));
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo guardar la configuracion." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/delivery/upload" && req.method === "POST") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      try {
        const input = JSON.parse(await readBody(req) || "{}");
        const currentPayload = readStateFileCached();
        const currentState = currentPayload.state || {};
        const upload = saveDeliveryUpload(input, sessionUser);
        const action = upload.kind === "transfer" ? "COMPROBANTE_SUBIDO" : "EVIDENCIA_REPARTO_CARGADA";
        const order = appendOrderTraceEvent(currentState, input.orderCode || "", input, {
          actor: sessionUser.name,
          action,
          status: entitySnapshot(currentState, "pedido", input.orderCode || "")?.status || orderEngine.STATUS.IN_ROUTE,
          note: `Adjunto ${upload.kind}: ${upload.filename}`
        });
        writeStateResponse(res, currentState, { upload, order }, auditEntry(req, sessionUser, input, {
          action: "EVIDENCIA_REPARTO_CARGADA",
          entityType: "pedido",
          entityId: input.orderCode || "",
          entityLabel: input.orderCode || "",
          previousValue: null,
          newValue: upload,
          note: `Adjunto ${upload.kind}`
        }), upload.kind === "transfer" ? notificationEntry(req, sessionUser, input, {
            action: "COMPROBANTE_SUBIDO",
            category: "Comprobantes",
            title: `Comprobante subido ${input.orderCode || ""}`.trim(),
            text: `${upload.filename}`,
            tone: "warn",
            entityType: "pedido",
            entityId: input.orderCode || "",
            entityLabel: input.orderCode || "",
            audience: ["admin"]
          }) : null);
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message || "No se pudo guardar el adjunto." });
      }
      return;
    }

    const uploadMatch = requestUrl.pathname.match(/^\/api\/uploads\/([^/]+)$/);
    if (uploadMatch && req.method === "GET") {
      const sessionUser = requireDeliveryUser(req, res);
      if (!sessionUser) return;
      const filename = path.basename(decodeURIComponent(uploadMatch[1]));
      const file = path.join(UPLOAD_DIR, filename);
      if (!filename || !file.startsWith(UPLOAD_DIR) || !fs.existsSync(file)) {
        send(res, 404, "text/plain; charset=utf-8", "Adjunto no encontrado");
        return;
      }
      send(res, 200, TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", fs.readFileSync(file));
      return;
    }

    const supplierUploadMatch = requestUrl.pathname.match(/^\/api\/supplier-uploads\/([^/]+)$/);
    if (supplierUploadMatch && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      const filename = path.basename(decodeURIComponent(supplierUploadMatch[1]));
      const file = path.join(SUPPLIER_UPLOAD_DIR, filename);
      if (!filename || !file.startsWith(SUPPLIER_UPLOAD_DIR) || !fs.existsSync(file)) {
        send(res, 404, "text/plain; charset=utf-8", "Adjunto no encontrado");
        return;
      }
      send(res, 200, TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", fs.readFileSync(file));
      return;
    }

    if (requestUrl.pathname === "/api/logout" && req.method === "POST") {
      const token = cookieValue(req, "dl_session");
      const sessionBeforeClose = token && sessions.get(token) ? publicSession(sessions.get(token)) : null;
      if (token) closeSession(token, "logout", "Usuario");
      if (sessionBeforeClose) {
        appendAuditToStateFile(req, sessionBeforeClose.user, {}, {
          action: "SESSION_CLOSED",
          entityType: "sesion",
          entityId: sessionBeforeClose.sessionId,
          entityLabel: sessionBeforeClose.name || sessionBeforeClose.username,
          previousValue: sessionBeforeClose,
          newValue: null,
          note: "Cierre de sesion"
        });
      }
      sendJson(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req, "", 0) });
      return;
    }

    if (requestUrl.pathname === "/api/session" && req.method === "GET") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        user: session.user,
        session: publicSession(session),
        sessionConfig: readSessionConfig(),
        presence: {
          sessions: publicSessions(),
          recent: publicPresenceHistory(30),
          settings: readSessionConfig()
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/audit" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Auditoria permitida solo para administradores." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      const terms = normalizeSearchText(requestUrl.searchParams.get("q") || "").split(/\s+/).filter(Boolean);
      const entityType = String(requestUrl.searchParams.get("entityType") || "all");
      const entityId = String(requestUrl.searchParams.get("entityId") || "").trim();
      const action = String(requestUrl.searchParams.get("action") || "all");
      const limit = Math.min(1000, Math.max(1, Number(requestUrl.searchParams.get("limit") || 300)));
      const audit = ensureGlobalAudit(currentState)
        .filter((entry) => entityType === "all" || entry.entityType === entityType)
        .filter((entry) => !entityId || String(entry.entityId || "").toLowerCase() === entityId.toLowerCase())
        .filter((entry) => action === "all" || entry.action === action)
        .filter((entry) => {
          if (!terms.length) return true;
          const text = normalizeSearchText([
            entry.action,
            entry.entityType,
            entry.entityId,
            entry.entityLabel,
            entry.user,
            entry.username,
            entry.ip,
            entry.note
          ].join(" "));
          return terms.every((term) => text.includes(term));
        })
        .slice(0, limit);
      sendJson(res, 200, { ok: true, version: currentPayload.version || 0, audit });
      return;
    }

    if (requestUrl.pathname === "/api/events" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "Eventos permitidos solo para administradores." });
        return;
      }
      const currentPayload = readStateFileCached();
      const currentState = currentPayload.state || {};
      eventEngine.migrateState(currentState);
      const filter = {
        entityType: requestUrl.searchParams.get("entityType") || "",
        entityId: requestUrl.searchParams.get("entityId") || "",
        type: requestUrl.searchParams.get("type") || "",
        module: requestUrl.searchParams.get("module") || ""
      };
      const limit = Math.min(1000, Math.max(1, Number(requestUrl.searchParams.get("limit") || 300)));
      const events = eventEngine.queryEvents(currentState, filter).slice(0, limit);
      const target = String(requestUrl.searchParams.get("target") || "").trim();
      const outbox = (currentState.integrationOutbox || [])
        .filter((item) => !target || item.target === target)
        .slice(0, limit);
      sendJson(res, 200, {
        ok: true,
        version: currentPayload.version || 0,
        events,
        outbox,
        totals: {
          events: (currentState.domainEvents || []).length,
          outbox: (currentState.integrationOutbox || []).length
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/erpnext/status" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "ERPNext permitido solo para administradores." });
        return;
      }
      const config = erpnextEngine.readConfig();
      const live = requestUrl.searchParams.get("live") === "1";
      try {
        const status = live ? await erpnextEngine.health(config) : {
          ok: true,
          enabled: config.enabled,
          configured: erpnextEngine.missingConfig(config).length === 0,
          missing: erpnextEngine.missingConfig(config),
          url: config.url,
          company: config.company,
          defaultWarehouse: config.defaultWarehouse,
          priceList: config.priceList
        };
        sendJson(res, 200, { ok: true, erpnext: status });
      } catch (error) {
        sendJson(res, 502, { ok: false, error: error.message || "No se pudo conectar con ERPNext." });
      }
      return;
    }

    if (requestUrl.pathname === "/api/erpnext/preview" && req.method === "GET") {
      const sessionUser = requireUser(req, res);
      if (!sessionUser) return;
      if (sessionUser.role !== "admin") {
        sendJson(res, 403, { ok: false, error: "ERPNext permitido solo para administradores." });
        return;
      }
      const payload = readStateFileCached();
      const currentState = payload.state || {};
      orderEngine.migrateState(currentState);
      const config = erpnextEngine.readConfig();
      const client = (currentState.clients || [])[0] || {};
      const product = (currentState.products || [])[0] || {};
      const order = (currentState.orders || [])[0] || {};
      sendJson(res, 200, {
        ok: true,
        erpnext: {
          enabled: config.enabled,
          configured: erpnextEngine.missingConfig(config).length === 0,
          missing: erpnextEngine.missingConfig(config),
          customer: client.name ? erpnextEngine.customerPayload(client, config) : null,
          item: product.name || product.descripcion ? erpnextEngine.itemPayload(product, config) : null,
          salesOrder: order.code ? erpnextEngine.salesOrderPayload(order, currentState, config) : null
        }
      });
      return;
    }

    if (requestUrl.pathname === "/api/health" && req.method === "GET") {
      const payload = readStateFileCached();
      const currentState = payload.state || {};
      const includeDetails = requestUrl.searchParams.get("details") === "1";
      orderEngine.migrateState(currentState);
      deliveryEngine.migrateState(currentState);
      accountEngine.migrateState(currentState);
      eventEngine.migrateState(currentState);
      legalEngine.migrateState(currentState);
      ensurePriceListsState(currentState);
      sendJson(res, 200, {
        ok: true,
        instance: "SERVIDOR_UNICO_8790",
        port: PORT,
        bindHost: HOST,
        connection: {
          apiBaseUrl: String(process.env.DL_API_BASE_URL || "").trim(),
          magicDnsHost: String(process.env.DL_MAGIC_DNS_HOST || "").trim(),
          serverName: String(process.env.DL_SERVER_NAME || "SERVIDOR_UNICO_8790").trim(),
          version: APP_RUNTIME_VERSION
        },
        root: ROOT,
        dataDir: DATA_DIR,
        stateFile: STATE_FILE,
        usersFile: USERS_FILE,
        version: APP_RUNTIME_VERSION,
        runtimeVersion: APP_RUNTIME_VERSION,
        stateVersion: payload.version || 0,
        activeSessions: publicSessions().length,
        openSessions: sessions.size,
        security: publicSecurityStatus(securityEngine.verifyRuntime(false), false),
        orders: Array.isArray(currentState.orders) ? currentState.orders.length : 0,
        deliveryRoutes: Array.isArray(currentState.deliveryRoutes) ? currentState.deliveryRoutes.length : 0,
        domainEvents: Array.isArray(currentState.domainEvents) ? currentState.domainEvents.length : 0,
        integrationOutbox: Array.isArray(currentState.integrationOutbox) ? currentState.integrationOutbox.length : 0,
        priceLists: Array.isArray(currentState.priceLists) ? currentState.priceLists.length : 0,
        priceListAssignments: Array.isArray(currentState.priceListAssignments) ? currentState.priceListAssignments.length : 0,
        legalVersion: currentState.legalSettings && currentState.legalSettings.currentVersion || "",
        legalAcceptances: Array.isArray(currentState.legalAcceptances) ? currentState.legalAcceptances.length : 0,
        helpTopics: currentState.helpCenter && Array.isArray(currentState.helpCenter.topics) ? currentState.helpCenter.topics.length : 0,
        latestOrder: Array.isArray(currentState.orders) && currentState.orders[0] ? currentState.orders[0].code : null,
        productsCount: Array.isArray(currentState.products) ? currentState.products.length : 0,
        products: includeDetails && Array.isArray(currentState.products) ? currentState.products.slice(0, 80).map((product) => ({
          name: product.name,
          stock: orderEngine.inventory(product).physical,
          reserved: orderEngine.inventory(product).reserved,
          available: orderEngine.inventory(product).available,
          inTransit: orderEngine.inventory(product).inTransit
        })) : undefined,
        locatedSellers: includeDetails && Array.isArray(currentState.sellers) ? currentState.sellers
          .filter((seller) => seller.location)
          .map((seller) => ({
            name: seller.name,
            gps: seller.gps,
            updatedAt: seller.location.updatedAt,
            source: seller.location.source
          })) : undefined
      });
      return;
    }

    if (requestUrl.pathname === "/api/state") {
      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: "SESSION_REQUIRED" });
        return;
      }
      const user = session.user;
      if (req.method === "GET") {
        const clientVersion = Number(requestUrl.searchParams.get("version") || req.headers["x-state-version"] || 0);
        let currentPayload = readStateFileCached();
        if (currentPayload.state) {
          ensureGlobalAudit(currentPayload.state);
          ensureNotifications(currentPayload.state);
          ensureRejectedGps(currentPayload.state);
          orderEngine.migrateState(currentPayload.state);
          deliveryEngine.migrateState(currentPayload.state);
          accountEngine.migrateState(currentPayload.state);
          eventEngine.migrateState(currentPayload.state);
          legalEngine.migrateState(currentPayload.state);
          ensurePriceListsState(currentPayload.state);
          ensurePrintState(currentPayload.state);
          if (applyDuePriceLists(currentPayload.state)) {
            currentPayload = {
              version: writeState(currentPayload.state),
              state: currentPayload.state
            };
          }
        }
        const currentVersion = currentPayload.version || readStateVersionFast();
        if (requestUrl.searchParams.get("deferState") === "clients" && (!clientVersion || clientVersion < currentVersion)) {
          session.lastSyncAt = new Date().toISOString();
          sendJson(res, 200, {
            ok: true,
            version: currentVersion,
            state: null,
            unchanged: false,
            deferred: true,
            presence: {
              sessions: publicSessions(),
              settings: readSessionConfig()
            }
          });
          return;
        }
        if (clientVersion && currentVersion && clientVersion >= currentVersion) {
          session.lastSyncAt = new Date().toISOString();
          sendJson(res, 200, {
            ok: true,
            version: currentVersion,
            state: null,
            unchanged: true,
            presence: {
              sessions: publicSessions(),
              settings: readSessionConfig()
            }
          });
          return;
        }
        session.lastSyncAt = new Date().toISOString();
        sendJson(res, 200, {
          ...currentPayload,
          state: stateForUser(currentPayload.state, user),
          presence: {
            sessions: publicSessions(),
            settings: readSessionConfig()
          }
        });
        return;
      }
      if (req.method === "POST") {
        if (user.role === "receiver" || user.role === "depot") {
          sendJson(res, 403, { ok: false, error: "Este rol solo puede operar desde sus flujos autorizados." });
          return;
        }
        const body = await readBody(req);
        const payload = JSON.parse(body || "{}");
        const currentPayload = readStateFileCached();
        if (payload.baseVersion && currentPayload.version && payload.baseVersion !== currentPayload.version) {
          sendJson(res, 409, {
            ok: false,
            error: "El servidor recibio cambios mas nuevos. Se debe sincronizar antes de guardar.",
            version: currentPayload.version
          });
          return;
        }
        if (payload.state) {
          orderEngine.migrateState(currentPayload.state || {});
          deliveryEngine.migrateState(currentPayload.state || {});
          accountEngine.migrateState(currentPayload.state || {});
          orderEngine.migrateState(payload.state);
          deliveryEngine.migrateState(payload.state);
          accountEngine.migrateState(payload.state);
          eventEngine.migrateState(currentPayload.state || {});
          eventEngine.migrateState(payload.state);
          legalEngine.migrateState(currentPayload.state || {});
          legalEngine.migrateState(payload.state);
          ensurePrintState(currentPayload.state || {});
          ensurePrintState(payload.state);
        }
        const validation = validateStateWrite(currentPayload.state, payload.state, payload.allowReset === true);
        if (!validation.ok) {
          sendJson(res, 409, { ok: false, error: validation.error });
          return;
        }
        if (payload.state) {
          const previousAudit = ensureGlobalAudit(currentPayload.state || {});
          const incomingAudit = ensureGlobalAudit(payload.state);
          const auditById = new Map([...previousAudit, ...incomingAudit].map((entry) => [entry.id, entry]));
          payload.state.globalAudit = Array.from(auditById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
          const previousNotifications = ensureNotifications(currentPayload.state || {});
          const incomingNotifications = ensureNotifications(payload.state);
          const notificationsById = new Map([...previousNotifications, ...incomingNotifications].map((entry) => [entry.id, entry]));
          payload.state.notifications = Array.from(notificationsById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
            .slice(0, 1500);
          const previousRejectedGps = ensureRejectedGps(currentPayload.state || {});
          const incomingRejectedGps = ensureRejectedGps(payload.state);
          const rejectedById = new Map([...previousRejectedGps, ...incomingRejectedGps].map((entry) => [entry.id, entry]));
          payload.state.rejectedGps = Array.from(rejectedById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
            .slice(0, 500);
          const previousLegalState = legalEngine.migrateState(currentPayload.state || {});
          const incomingLegalState = legalEngine.migrateState(payload.state);
          payload.state.legalSettings = previousLegalState.legalSettings || incomingLegalState.legalSettings;
          const legalAcceptanceById = new Map([
            ...(previousLegalState.legalAcceptances || []),
            ...(incomingLegalState.legalAcceptances || [])
          ].map((entry) => [entry.id, entry]));
          payload.state.legalAcceptances = Array.from(legalAcceptanceById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
          const legalAuditById = new Map([
            ...(previousLegalState.legalAudit || []),
            ...(incomingLegalState.legalAudit || [])
          ].map((entry) => [entry.id, entry]));
          payload.state.legalAudit = Array.from(legalAuditById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
            .slice(0, 1000);
          payload.state.helpCenter = payload.state.helpCenter || {};
          payload.state.helpCenter.topics = previousLegalState.helpCenter && previousLegalState.helpCenter.topics || incomingLegalState.helpCenter.topics || [];
          const completionById = new Map([
            ...((previousLegalState.helpCenter && previousLegalState.helpCenter.tourCompletions) || []),
            ...((incomingLegalState.helpCenter && incomingLegalState.helpCenter.tourCompletions) || [])
          ].map((entry) => [entry.id, entry]));
          payload.state.helpCenter.tourCompletions = Array.from(completionById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
            .slice(0, 1000);
          payload.state.aboutSystem = previousLegalState.aboutSystem || incomingLegalState.aboutSystem || {};
          const previousPrintAudit = ensurePrintState(currentPayload.state || {}) && ((currentPayload.state || {}).printAudit || []);
          const incomingPrintAudit = ensurePrintState(payload.state) && (payload.state.printAudit || []);
          const printAuditById = new Map([...previousPrintAudit, ...incomingPrintAudit].map((entry) => [entry.id, entry]));
          payload.state.printAudit = Array.from(printAuditById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
            .slice(0, 2000);
          payload.state.printSettings = payload.state.printSettings || (currentPayload.state && currentPayload.state.printSettings) || {};
          const previousEvents = eventEngine.ensureState(currentPayload.state || {}).domainEvents || [];
          const incomingEvents = eventEngine.ensureState(payload.state).domainEvents || [];
          const eventsById = new Map([...previousEvents, ...incomingEvents].map((entry) => [entry.id, entry]));
          payload.state.domainEvents = Array.from(eventsById.values())
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
          const previousOutbox = eventEngine.ensureState(currentPayload.state || {}).integrationOutbox || [];
          const incomingOutbox = eventEngine.ensureState(payload.state).integrationOutbox || [];
          const outboxById = new Map([...previousOutbox, ...incomingOutbox].map((entry) => [entry.id, entry]));
          payload.state.integrationOutbox = Array.from(outboxById.values())
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          const diffAudit = collectionAuditDiff(req, user, payload, currentPayload.state || {}, payload.state);
          const diffNotifications = collectionNotificationDiff(req, user, payload, currentPayload.state || {}, payload.state);
          appendGlobalAudit(payload.state, diffAudit);
          appendNotifications(payload.state, diffNotifications);
          eventEngine.emitFromAuditEntries(payload.state, diffAudit);
          eventEngine.emitFromNotificationEntries(payload.state, diffNotifications);
        }
        const version = writeState(payload.state);
        send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, version }));
        return;
      }
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "text/plain; charset=utf-8", "Method not allowed");
      return;
    }

    serveFile(req, res);
  } catch (error) {
    send(res, 500, "text/plain; charset=utf-8", error.stack || error.message || "Server error");
  }
});

try {
  ensureDataFiles();
  securityEngine.assertRuntimeAllowed();
} catch (error) {
  console.error(error.message || "Instalacion no habilitada.");
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  console.log(`Distribuidora Lopez SERVIDOR_UNICO_8790 ${APP_RUNTIME_VERSION} listening on ${HOST}:${PORT}`);
});




