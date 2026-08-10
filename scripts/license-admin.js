const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const licenseEngine = require("../license-engine");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const VERSION = process.env.DL_VERSION || "8790-71";
const DEFAULT_INSTALLATION_NAME = "SERVIDOR_UNICO_8790";
const DEFAULT_PRIVATE_KEY = path.join(ROOT, "..", ".security", "distribuidora-lopez-license-private.pem");
const DEFAULT_PUBLIC_KEY = path.join(ROOT, "config", "license-public-key.pem");
const DEFAULT_LICENSE = path.join(DATA_DIR, "license.json");

function usage() {
  console.log(`
Uso:
  node scripts/license-admin.js fingerprint
  node scripts/license-admin.js keygen [--private <archivo>] [--public <archivo>]
  node scripts/license-admin.js issue --client "Distribuidora Lopez" [--installation SERVIDOR_UNICO_8790] [--expires 2027-12-31] [--fingerprint <hash-servidor>]
  node scripts/license-admin.js manifest
  node scripts/license-admin.js status

Notas:
  - La clave privada predeterminada queda fuera de la carpeta productiva: ${DEFAULT_PRIVATE_KEY}
  - El paquete productivo solo debe incluir la clave publica y la licencia firmada.
`);
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(file, content, mode) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, { encoding: "utf8", mode });
}

function engine() {
  return licenseEngine.createEngine({
    root: ROOT,
    dataDir: DATA_DIR,
    version: VERSION
  });
}

function keygen() {
  const privateFile = path.resolve(argValue("--private", DEFAULT_PRIVATE_KEY));
  const publicFile = path.resolve(argValue("--public", DEFAULT_PUBLIC_KEY));
  if (fs.existsSync(privateFile) && process.argv.includes("--no-overwrite")) {
    throw new Error(`Ya existe la clave privada: ${privateFile}`);
  }
  const pair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  writeFileSafe(privateFile, pair.privateKey, 0o600);
  writeFileSafe(publicFile, pair.publicKey, 0o644);
  console.log(JSON.stringify({
    ok: true,
    privateKey: privateFile,
    publicKey: publicFile,
    warning: "No copiar la clave privada a la instalacion productiva."
  }, null, 2));
}

function fingerprint() {
  const fp = engine().fingerprint();
  console.log(JSON.stringify({
    fingerprint: fp.hash,
    componentKeys: fp.componentKeys,
    maskedSignals: fp.maskedSignals
  }, null, 2));
}

function issue() {
  const privateFile = path.resolve(argValue("--private", DEFAULT_PRIVATE_KEY));
  const licenseFile = path.resolve(argValue("--license", DEFAULT_LICENSE));
  if (!fs.existsSync(privateFile)) {
    throw new Error(`No existe la clave privada: ${privateFile}. Ejecutar keygen primero.`);
  }
  const fp = engine().fingerprint();
  const fingerprintOverride = argValue("--fingerprint", "").trim();
  const now = new Date().toISOString();
  const payload = {
    licenseId: argValue("--license-id", `DL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`),
    client: argValue("--client", "Distribuidora Lopez"),
    installation: argValue("--installation", process.env.DL_INSTALLATION_NAME || DEFAULT_INSTALLATION_NAME),
    issuedAt: now,
    activatedAt: now,
    status: argValue("--status", "active"),
    version: argValue("--version", VERSION),
    versionPattern: argValue("--version-pattern", "8790-*"),
    expiresAt: argValue("--expires", ""),
    modules: argValue("--modules", licenseEngine.DEFAULT_MODULES.join(","))
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    fingerprint: fingerprintOverride || fp.hash,
    fingerprintAlgorithm: "sha256",
    graceDays: Number(argValue("--grace-days", "7"))
  };
  const privateKey = fs.readFileSync(privateFile, "utf8");
  const license = licenseEngine.signLicense(payload, privateKey);
  writeFileSafe(licenseFile, JSON.stringify(license, null, 2), 0o644);
  console.log(JSON.stringify({
    ok: true,
    license: licenseFile,
    licenseId: payload.licenseId,
    client: payload.client,
    installation: payload.installation,
    fingerprint: payload.fingerprint,
    fingerprintSource: fingerprintOverride ? "argumento" : "runtime",
    version: payload.version,
    expiresAt: payload.expiresAt || "sin vencimiento"
  }, null, 2));
}

function manifest() {
  const manifest = engine().buildIntegrityManifest();
  console.log(JSON.stringify({
    ok: true,
    file: engine().paths.integrityFile,
    version: manifest.version,
    files: manifest.entries.length
  }, null, 2));
}

function status() {
  const result = engine().verifyRuntime(true);
  console.log(JSON.stringify(result, null, 2));
}

function main() {
  const command = process.argv[2] || "";
  if (!command || command === "help" || command === "--help") {
    usage();
    return;
  }
  if (command === "fingerprint") return fingerprint();
  if (command === "keygen") return keygen();
  if (command === "issue") return issue();
  if (command === "manifest") return manifest();
  if (command === "status") return status();
  throw new Error(`Comando no reconocido: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
