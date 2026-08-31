const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const LICENSE_TYPE = "DistribuidoraLopezLicense";
const SIGN_ALGORITHM = "RSA-SHA256";
const DEFAULT_INSTALLATION_NAME = "SERVIDOR_UNICO_8790";
const DEFAULT_MODULES = [
  "dashboard",
  "preventa",
  "pedidos",
  "reparto",
  "clientes",
  "cuentas",
  "stock",
  "proveedores",
  "estadisticas",
  "legal",
  "ayuda",
  "acerca",
  "admin"
];

const CRITICAL_FILES = [
  "server.js",
  "app.js",
  "index.html",
  "config.js",
  "sw.js",
  "order-engine.js",
  "share-engine.js",
  "delivery-engine.js",
  "account-engine.js",
  "event-engine.js",
  "erpnext-engine.js",
  "legal-engine.js",
  "license-engine.js",
  "config/license-public-key.pem",
  "data/license.json",
  "scripts/run-server-prod.ps1"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, payload) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

function run(command, args) {
  try {
    return String(execFileSync(command, args, {
      encoding: "utf8",
      timeout: 2500,
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true
    }) || "").trim();
  } catch {
    return "";
  }
}

function firstDataLine(output) {
  return String(output || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .join(" ")
    .trim();
}

function windowsRegistryValue(key, value) {
  const output = run("reg", ["query", key, "/v", value]);
  const line = output.split(/\r?\n/).find((item) => item.includes(value));
  if (!line) return "";
  const parts = line.trim().split(/\s{2,}/);
  return parts[parts.length - 1] || "";
}

function collectHardwareSignals(root, dataDir, installId) {
  const signals = {
    installationId: installId,
    installationName: process.env.DL_INSTALLATION_NAME || DEFAULT_INSTALLATION_NAME,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    machineGuid: "",
    biosUuid: "",
    baseboardSerial: "",
    diskSerial: "",
    machineId: ""
  };

  if (process.platform === "win32") {
    signals.machineGuid = windowsRegistryValue("HKLM\\SOFTWARE\\Microsoft\\Cryptography", "MachineGuid");
  } else {
    signals.machineId = fs.existsSync("/etc/machine-id") ? fs.readFileSync("/etc/machine-id", "utf8").trim() : "";
    signals.diskSerial = run("sh", ["-lc", "lsblk -ndo SERIAL 2>/dev/null | head -n 1"]);
  }

  return Object.fromEntries(Object.entries(signals).map(([key, value]) => [key, String(value || "").trim()]));
}

function maskedSignals(signals) {
  return Object.fromEntries(Object.keys(signals).map((key) => [key, signals[key] ? sha256(signals[key]).slice(0, 12) : ""]));
}

function createEngine(options) {
  const root = options.root;
  const dataDir = options.dataDir;
  const version = options.version;
  const licenseFile = options.licenseFile || process.env.DL_LICENSE_FILE || path.join(dataDir, "license.json");
  const publicKeyFile = options.publicKeyFile || process.env.DL_LICENSE_PUBLIC_KEY_FILE || path.join(root, "config", "license-public-key.pem");
  const installIdFile = options.installIdFile || process.env.DL_INSTALL_ID_FILE || path.join(dataDir, "install-id.json");
  const integrityFile = options.integrityFile || process.env.DL_INTEGRITY_FILE || path.join(dataDir, "integrity-manifest.json");
  const auditFile = options.auditFile || process.env.DL_SECURITY_AUDIT_FILE || path.join(dataDir, "security-audit.log");
  const graceFile = options.graceFile || path.join(dataDir, "license-grace.json");
  const enforceIntegrity = String(process.env.DL_INTEGRITY_ENFORCE || "block").toLowerCase() !== "warn";
  const enforceLicense = String(process.env.DL_LICENSE_ENFORCEMENT || "strict").toLowerCase() !== "disabled";
  let cachedStatus = null;
  let cachedAt = 0;

  function audit(action, details = {}, level = "info") {
    ensureDir(path.dirname(auditFile));
    fs.appendFileSync(auditFile, JSON.stringify({
      at: new Date().toISOString(),
      level,
      action,
      details
    }) + "\n", "utf8");
  }

  function ensureInstallId() {
    const existing = readJson(installIdFile, null);
    if (existing && existing.id) return String(existing.id);
    const payload = {
      id: crypto.randomBytes(24).toString("hex"),
      installationName: process.env.DL_INSTALLATION_NAME || DEFAULT_INSTALLATION_NAME,
      createdAt: new Date().toISOString()
    };
    writeJson(installIdFile, payload);
    audit("INSTALL_ID_CREATED", { installIdHash: sha256(payload.id).slice(0, 16), installationName: payload.installationName });
    return payload.id;
  }

  function fingerprint() {
    const installId = ensureInstallId();
    const signals = collectHardwareSignals(root, dataDir, installId);
    const hash = sha256(stableJson(signals));
    return {
      hash,
      signals,
      maskedSignals: maskedSignals(signals),
      componentKeys: Object.keys(signals).filter((key) => Boolean(signals[key]))
    };
  }

  function readLicense() {
    return readJson(licenseFile, null);
  }

  function criticalFilePath(relativePath) {
    const normalized = String(relativePath || "").replace(/\\/g, "/");
    if (normalized.startsWith("data/")) {
      return path.join(dataDir, normalized.slice("data/".length));
    }
    return path.join(root, normalized);
  }

  function verifySignature(license, publicKey) {
    if (!license || license.type !== LICENSE_TYPE || !license.payload || !license.signature) {
      return false;
    }
    const verifier = crypto.createVerify(SIGN_ALGORITHM);
    verifier.update(stableJson(license.payload));
    verifier.end();
    return verifier.verify(publicKey, license.signature, "base64");
  }

  function versionAllowed(payload) {
    if (!payload.version && !payload.versionPattern) return true;
    if (payload.version === "*" || payload.version === version) return true;
    if (payload.versionPattern) {
      const pattern = String(payload.versionPattern).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(version);
    }
    return false;
  }

  function verifyLicense() {
    if (!enforceLicense) {
      return {
        ok: true,
        allowed: true,
        mode: "disabled",
        message: "Licenciamiento desactivado por entorno.",
        fingerprint: fingerprint().hash,
        events: recentAudit()
      };
    }
    const fp = fingerprint();
    const license = readLicense();
    if (!license) {
      return { ok: false, allowed: false, code: "LICENSE_MISSING", message: "Licencia no instalada.", fingerprint: fp.hash, events: recentAudit() };
    }
    if (!fs.existsSync(publicKeyFile)) {
      return { ok: false, allowed: false, code: "PUBLIC_KEY_MISSING", message: "Clave publica de licencia no instalada.", fingerprint: fp.hash, events: recentAudit() };
    }

    const publicKey = fs.readFileSync(publicKeyFile, "utf8");
    if (!verifySignature(license, publicKey)) {
      return { ok: false, allowed: false, code: "LICENSE_SIGNATURE_INVALID", message: "Licencia alterada o firma invalida.", fingerprint: fp.hash, license: publicLicense(license), events: recentAudit() };
    }

    const payload = license.payload;
    const now = Date.now();
    const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : null;
    if (String(payload.status || "").toLowerCase() !== "active") {
      return { ok: false, allowed: false, code: "LICENSE_INACTIVE", message: "Licencia inactiva.", fingerprint: fp.hash, license: publicLicense(license), events: recentAudit() };
    }
    if (payload.fingerprint !== fp.hash) {
      return {
        ok: false,
        allowed: false,
        code: "FINGERPRINT_MISMATCH",
        message: "La licencia corresponde a otro servidor.",
        fingerprint: fp.hash,
        maskedSignals: fp.maskedSignals,
        componentKeys: fp.componentKeys,
        license: publicLicense(license),
        events: recentAudit()
      };
    }
    if (expiresAt && now > expiresAt) {
      return { ok: false, allowed: false, code: "LICENSE_EXPIRED", message: "Licencia vencida.", fingerprint: fp.hash, license: publicLicense(license), events: recentAudit() };
    }
    if (!versionAllowed(payload)) {
      return { ok: false, allowed: false, code: "VERSION_NOT_ALLOWED", message: "Version no habilitada por licencia.", fingerprint: fp.hash, license: publicLicense(license), events: recentAudit() };
    }

    writeJson(graceFile, { lastValidAt: new Date().toISOString(), fingerprint: fp.hash, licenseId: payload.licenseId || "" });
    return {
      ok: true,
      allowed: true,
      code: "LICENSE_OK",
      message: "Licencia valida.",
      fingerprint: fp.hash,
      maskedSignals: fp.maskedSignals,
      componentKeys: fp.componentKeys,
      license: publicLicense(license),
      events: recentAudit()
    };
  }

  function buildIntegrityManifest(extraFiles = []) {
    const files = Array.from(new Set([...CRITICAL_FILES, ...extraFiles])).sort();
    const entries = files
      .map((relativePath) => relativePath.replace(/\\/g, "/"))
      .filter((relativePath) => fs.existsSync(criticalFilePath(relativePath)))
      .map((relativePath) => ({
        path: relativePath,
        sha256: fileSha256(criticalFilePath(relativePath)),
        bytes: fs.statSync(criticalFilePath(relativePath)).size
      }));
    const manifest = {
      generatedAt: new Date().toISOString(),
      version,
      rootName: path.basename(root),
      entries
    };
    writeJson(integrityFile, manifest);
    audit("INTEGRITY_MANIFEST_GENERATED", { files: entries.length, version });
    return manifest;
  }

  function verifyIntegrity() {
    const manifest = readJson(integrityFile, null);
    if (!manifest || !Array.isArray(manifest.entries)) {
      return { ok: false, code: "INTEGRITY_MANIFEST_MISSING", message: "Manifest de integridad no instalado.", changed: [], missing: [], checked: 0 };
    }
    const changed = [];
    const missing = [];
    manifest.entries.forEach((entry) => {
      const file = criticalFilePath(entry.path);
      if (!fs.existsSync(file)) {
        missing.push(entry.path);
        return;
      }
      const current = fileSha256(file);
      if (current !== entry.sha256) {
        changed.push({ path: entry.path, expected: entry.sha256, actual: current });
      }
    });
    const ok = changed.length === 0 && missing.length === 0;
    return {
      ok,
      code: ok ? "INTEGRITY_OK" : "INTEGRITY_CHANGED",
      message: ok ? "Integridad verificada." : "Se detectaron archivos criticos modificados.",
      generatedAt: manifest.generatedAt,
      version: manifest.version,
      changed,
      missing,
      checked: manifest.entries.length
    };
  }

  function verifyRuntime(force = false) {
    if (!force && cachedStatus && Date.now() - cachedAt < 30000) return cachedStatus;
    const license = verifyLicense();
    const integrity = verifyIntegrity();
    const allowed = license.allowed && (integrity.ok || !enforceIntegrity);
    const status = {
      ok: allowed,
      allowed,
      checkedAt: new Date().toISOString(),
      version,
      license,
      integrity,
      enforcement: {
        license: enforceLicense ? "strict" : "disabled",
        integrity: enforceIntegrity ? "block" : "warn"
      }
    };
    cachedStatus = status;
    cachedAt = Date.now();
    return status;
  }

  function assertRuntimeAllowed() {
    const status = verifyRuntime(true);
    if (!status.allowed) {
      audit("SECURITY_BOOT_BLOCKED", {
        license: status.license.code,
        integrity: status.integrity.code,
        runtimeFingerprint: status.license.fingerprint || "",
        licenseFingerprint: status.license.license && status.license.license.fingerprint || "",
        componentKeys: status.license.componentKeys || [],
        maskedSignals: status.license.maskedSignals || {},
        changed: status.integrity.changed.map((item) => item.path),
        missing: status.integrity.missing
      }, "danger");
      const publicMessage = "Distribuidora Lopez: licencia o integridad invalida. Contactar a soporte tecnico para reactivar la instalacion.";
      const error = new Error(publicMessage);
      error.status = status;
      throw error;
    }
    audit("SECURITY_BOOT_OK", {
      licenseId: status.license.license && status.license.license.licenseId || "",
      fingerprint: status.license.fingerprint,
      integrityFiles: status.integrity.checked
    });
    return status;
  }

  function recentAudit(limit = 20) {
    try {
      return fs.readFileSync(auditFile, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-limit)
        .map((line) => {
          try { return JSON.parse(line); } catch { return { raw: line }; }
        })
        .reverse();
    } catch {
      return [];
    }
  }

  function publicLicense(license) {
    if (!license || !license.payload) return null;
    const payload = license.payload;
    return {
      licenseId: payload.licenseId || "",
      client: payload.client || "",
      installation: payload.installation || "",
      issuedAt: payload.issuedAt || "",
      activatedAt: payload.activatedAt || "",
      status: payload.status || "",
      version: payload.version || "",
      versionPattern: payload.versionPattern || "",
      expiresAt: payload.expiresAt || "",
      modules: Array.isArray(payload.modules) ? payload.modules : [],
      fingerprint: payload.fingerprint || ""
    };
  }

  function status() {
    return verifyRuntime(false);
  }

  return {
    LICENSE_TYPE,
    SIGN_ALGORITHM,
    DEFAULT_MODULES,
    CRITICAL_FILES,
    stableJson,
    sha256,
    fingerprint,
    audit,
    buildIntegrityManifest,
    verifyIntegrity,
    verifyLicense,
    verifyRuntime,
    assertRuntimeAllowed,
    status,
    recentAudit,
    paths: {
      licenseFile,
      publicKeyFile,
      installIdFile,
      integrityFile,
      auditFile,
      graceFile
    }
  };
}

function signLicense(payload, privateKeyPem) {
  const signer = crypto.createSign(SIGN_ALGORITHM);
  signer.update(stableJson(payload));
  signer.end();
  return {
    type: LICENSE_TYPE,
    algorithm: SIGN_ALGORITHM,
    payload,
    signature: signer.sign(privateKeyPem, "base64")
  };
}

module.exports = {
  createEngine,
  signLicense,
  stableJson,
  sha256,
  LICENSE_TYPE,
  SIGN_ALGORITHM,
  DEFAULT_MODULES,
  CRITICAL_FILES
};
