const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.join(__dirname, "..");
const USE_ENV_PATHS = process.env.DL_SUPPORT_USE_ENV_PATHS === "1";
const DATA_DIR = USE_ENV_PATHS && process.env.DATA_DIR ? process.env.DATA_DIR : path.join(ROOT, "data");
const STATE_FILE = USE_ENV_PATHS && process.env.STATE_FILE ? process.env.STATE_FILE : path.join(DATA_DIR, "demo-state.json");
const CONFIG_FILE = USE_ENV_PATHS && process.env.CONFIG_FILE ? process.env.CONFIG_FILE : path.join(ROOT, "config.js");
const PARAMETERS_FILE = USE_ENV_PATHS && process.env.PARAMETERS_FILE ? process.env.PARAMETERS_FILE : path.join(DATA_DIR, "parametros-soporte.json");
const action = String(process.argv[2] || "menu").toLowerCase();

const CONFIRMATIONS = {
  "reset-accumulators": "RESET ACUMULADOS",
  "reset-routes": "RESET RUTAS",
  "reset-gps": "RESET GPS",
  "reset-client-balances": "RESET SALDOS CLIENTES",
  "apply-parameters": "APLICAR PARAMETROS"
};

function parseArgs(argv) {
  return argv.reduce((args, part) => {
    const match = String(part).match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
    else if (String(part).startsWith("--")) args[String(part).slice(2)] = true;
    return args;
  }, {});
}

const args = parseArgs(process.argv.slice(3));

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function readPayload() {
  if (!fs.existsSync(STATE_FILE)) throw new Error(`No existe el estado: ${STATE_FILE}`);
  const payload = readJson(STATE_FILE);
  if (!payload || typeof payload !== "object" || !payload.state || typeof payload.state !== "object") {
    throw new Error("El archivo de estado no tiene formato valido { version, state }.");
  }
  return payload;
}

function readConfigValues() {
  const fallback = {
    useGoogleMaps: true,
    googleMapsApiKey: "",
    supportWhatsAppPhone: ""
  };
  if (!fs.existsSync(CONFIG_FILE)) return fallback;
  const text = fs.readFileSync(CONFIG_FILE, "utf8");
  return {
    useGoogleMaps: !/USE_GOOGLE_MAPS:\s*false/i.test(text),
    googleMapsApiKey: (text.match(/GOOGLE_MAPS_API_KEY:\s*(["'])(.*?)\1/) || [])[2] || "",
    supportWhatsAppPhone: (text.match(/DL_SUPPORT_WHATSAPP_PHONE\s*=\s*(["'])(.*?)\1/) || [])[2] || ""
  };
}

function writeConfigValues(values) {
  const next = {
    ...readConfigValues(),
    ...values
  };
  const text = [
    "window.DL_CONFIG = {",
    `  USE_GOOGLE_MAPS: ${next.useGoogleMaps ? "true" : "false"},`,
    `  GOOGLE_MAPS_API_KEY: ${JSON.stringify(next.googleMapsApiKey || "")}`,
    "};",
    `window.DL_SUPPORT_WHATSAPP_PHONE = ${JSON.stringify(next.supportWhatsAppPhone || "")};`,
    ""
  ].join("\n");
  fs.writeFileSync(CONFIG_FILE, text, "utf8");
}

function backupFiles(label, files = ["state"]) {
  const folder = path.join(DATA_DIR, "support-backups", `${stamp()}-${label}`);
  fs.mkdirSync(folder, { recursive: true });
  const copied = [];
  const map = {
    state: STATE_FILE,
    config: CONFIG_FILE,
    parameters: PARAMETERS_FILE
  };
  files.forEach((key) => {
    const file = map[key] || key;
    if (fs.existsSync(file)) {
      const destination = path.join(folder, path.basename(file));
      fs.copyFileSync(file, destination);
      copied.push(destination);
    }
  });
  return { folder, files: copied };
}

function savePayload(payload, label) {
  const backup = backupFiles(label, ["state"]);
  payload.version = Date.now();
  writeJsonAtomic(STATE_FILE, payload);
  return backup;
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function money(value) {
  return Math.max(0, Math.round(numeric(value, 0) * 100) / 100);
}

function refreshProductInventory(product) {
  const physical = money(product.stock_fisico ?? product.stock_actual ?? product.stock);
  const reserved = Math.min(physical, money(product.stock_reservado));
  const inTransit = money(product.stock_en_transito);
  product.stock_fisico = physical;
  product.stock_actual = physical;
  product.stock = physical;
  product.stock_reservado = reserved;
  product.stock_disponible = Math.max(0, physical - reserved);
  product.stock_en_transito = inTransit;
  return product;
}

function releaseReservations(state, clearTransit = false) {
  (state.products || []).forEach((product) => {
    refreshProductInventory(product);
    product.stock_reservado = 0;
    if (clearTransit) product.stock_en_transito = 0;
    refreshProductInventory(product);
  });
}

function resetSellerAccumulators(state, clearGps = false) {
  (state.sellers || []).forEach((seller) => {
    seller.orders = 0;
    seller.sales = 0;
    seller.commission = 0;
    seller.progress = 0;
    if (clearGps) {
      seller.gps = "GPS pendiente";
      seller.location = null;
    }
  });
}

function resetGps(state) {
  (state.sellers || []).forEach((seller) => {
    seller.gps = "GPS pendiente";
    seller.location = null;
  });
}

function resetClientBalances(state) {
  (state.clients || []).forEach((client) => {
    client.balance = 0;
    client.saldo_inicial = 0;
    client.status = client.estado || "Activo";
  });
  state.accounts = [];
  state.bankTransfers = [];
}

function resetRoutes(state) {
  const backToDispatched = new Set(["Bajar", "Controlado"]);
  (state.orders || []).forEach((order) => {
    if (backToDispatched.has(order.status)) {
      order.status = "Despachado";
      order.updatedAt = new Date().toISOString();
      order.trace = Array.isArray(order.trace) ? order.trace : [];
      order.trace.push({
        status: "Despachado",
        at: order.updatedAt,
        actor: "Soporte",
        note: "Reset externo de ruta/cobranza"
      });
    }
    if (order.status !== "Entregado") {
      delete order.collection;
      delete order.deliveryGps;
      delete order.deliveryAttachments;
      order.collectionStatus = "Pendiente";
    }
  });
  state.deliveryRoutes = [];
  state.deliveryAudit = [];
  state.deliveryClosures = [];
  state.bankReconciliation = [];
}

function resetAccumulators(state, options = {}) {
  state.orders = [];
  state.accounts = [];
  state.bankTransfers = [];
  state.stockMovements = [];
  state.activity = [];
  state.shortages = [];
  state.deliveryRoutes = [];
  state.deliveryAudit = [];
  state.deliveryClosures = [];
  state.bankReconciliation = [];
  resetSellerAccumulators(state, Boolean(options.clearGps));
  releaseReservations(state, Boolean(options.clearTransit));
  if (options.clearGps) resetGps(state);
  if (options.zeroClientBalances) resetClientBalances(state);
}

function summary(payload) {
  const state = payload.state;
  const sum = (items, getter) => (items || []).reduce((total, item) => total + money(getter(item)), 0);
  return {
    stateFile: STATE_FILE,
    configFile: CONFIG_FILE,
    version: payload.version || 0,
    counts: {
      clients: (state.clients || []).length,
      products: (state.products || []).length,
      orders: (state.orders || []).length,
      accounts: (state.accounts || []).length,
      stockMovements: (state.stockMovements || []).length,
      deliveryRoutes: (state.deliveryRoutes || []).length,
      deliveryAudit: (state.deliveryAudit || []).length,
      deliveryClosures: (state.deliveryClosures || []).length,
      bankReconciliation: (state.bankReconciliation || []).length,
      globalAudit: (state.globalAudit || []).length,
      notifications: (state.notifications || []).length
    },
    totals: {
      salesInOrders: sum(state.orders, (order) => order.amount),
      clientBalances: sum(state.clients, (client) => client.balance),
      sellerSales: sum(state.sellers, (seller) => seller.sales),
      routeCash: sum(state.deliveryRoutes, (route) => route.cashTotal),
      routeTransfers: sum(state.deliveryRoutes, (route) => route.transferTotal),
      routePending: sum(state.deliveryRoutes, (route) => route.pendingTotal)
    },
    deliverySettings: state.deliverySettings || {},
    supportWhatsAppPhone: readConfigValues().supportWhatsAppPhone || ""
  };
}

function printSummary(payload) {
  console.log(JSON.stringify(summary(payload), null, 2));
}

function exportParameters(payload) {
  const config = readConfigValues();
  const state = payload.state;
  const parameters = {
    _uso: "Editar solo estos campos y luego ejecutar SOPORTE-MANTENIMIENTO > Aplicar parametros. No editar demo-state.json a mano.",
    supportWhatsAppPhone: config.supportWhatsAppPhone || "5493512410535",
    googleMaps: {
      useGoogleMaps: config.useGoogleMaps,
      googleMapsApiKey: config.googleMapsApiKey || ""
    },
    delivery: {
      bankAlias: state.deliverySettings && state.deliverySettings.bankAlias || "DISTRIBUIDORA.LOPEZ",
      bankAccountName: state.deliverySettings && state.deliverySettings.bankAccountName || "Distribuidora Lopez",
      depotLat: numeric(state.deliverySettings && state.deliverySettings.depotLat, -31.4167),
      depotLng: numeric(state.deliverySettings && state.deliverySettings.depotLng, -64.1833)
    }
  };
  writeJsonAtomic(PARAMETERS_FILE, parameters);
  console.log(JSON.stringify({ ok: true, file: PARAMETERS_FILE, parameters }, null, 2));
}

function applyParameters(payload) {
  if (!fs.existsSync(PARAMETERS_FILE)) throw new Error(`No existe ${PARAMETERS_FILE}. Primero exportar parametros.`);
  const parameters = readJson(PARAMETERS_FILE);
  const state = payload.state;
  state.deliverySettings = {
    ...(state.deliverySettings || {}),
    bankAlias: String(parameters.delivery && parameters.delivery.bankAlias || "").trim(),
    bankAccountName: String(parameters.delivery && parameters.delivery.bankAccountName || "").trim(),
    depotLat: numeric(parameters.delivery && parameters.delivery.depotLat, -31.4167),
    depotLng: numeric(parameters.delivery && parameters.delivery.depotLng, -64.1833)
  };
  if (!state.deliverySettings.bankAlias) throw new Error("delivery.bankAlias no puede quedar vacio.");
  if (!state.deliverySettings.bankAccountName) throw new Error("delivery.bankAccountName no puede quedar vacio.");
  backupFiles("parametros-config", ["config", "parameters"]);
  writeConfigValues({
    supportWhatsAppPhone: String(parameters.supportWhatsAppPhone || "").replace(/\D/g, ""),
    useGoogleMaps: parameters.googleMaps ? parameters.googleMaps.useGoogleMaps !== false : readConfigValues().useGoogleMaps,
    googleMapsApiKey: parameters.googleMaps ? String(parameters.googleMaps.googleMapsApiKey || "") : readConfigValues().googleMapsApiKey
  });
  const backup = savePayload(payload, "aplicar-parametros");
  console.log(JSON.stringify({ ok: true, stateFile: STATE_FILE, parametersFile: PARAMETERS_FILE, backup, settings: state.deliverySettings }, null, 2));
}

function question(rl, text) {
  return new Promise((resolve) => rl.question(text, (answer) => resolve(answer)));
}

async function requireConfirmation(key) {
  const expected = CONFIRMATIONS[key];
  if (!expected) return;
  if (args.confirm === expected) return;
  if (args.yes && process.env.DL_SUPPORT_ALLOW_YES === "1") return;
  if (!process.stdin.isTTY) throw new Error(`Confirmacion requerida: --confirm=\"${expected}\"`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await question(rl, `Escribir exactamente "${expected}" para continuar: `);
  rl.close();
  if (answer !== expected) throw new Error("Operacion cancelada por confirmacion incorrecta.");
}

async function menu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const options = [
    ["status", "Ver diagnostico"],
    ["backup", "Crear backup manual"],
    ["export-parameters", "Exportar parametros editables"],
    ["apply-parameters", "Aplicar parametros editados"],
    ["reset-accumulators", "Reset acumulados operativos"],
    ["reset-routes", "Reset rutas y cobranza"],
    ["reset-gps", "Reset GPS vendedores"],
    ["reset-client-balances", "Reset saldos de clientes"]
  ];
  console.log("\nDL Preventa - Herramienta externa de soporte\n");
  options.forEach((item, index) => console.log(`${index + 1}. ${item[1]}`));
  const answer = await question(rl, "\nSeleccionar opcion: ");
  rl.close();
  const index = Number(answer) - 1;
  if (!options[index]) throw new Error("Opcion invalida.");
  await run(options[index][0]);
}

async function run(selectedAction) {
  const currentAction = selectedAction || action;
  const payload = readPayload();
  switch (currentAction) {
    case "menu":
      await menu();
      break;
    case "status":
    case "diagnostico":
      printSummary(payload);
      break;
    case "backup": {
      const backup = backupFiles("manual", ["state", "config", "parameters"]);
      console.log(JSON.stringify({ ok: true, backup }, null, 2));
      break;
    }
    case "export-parameters":
    case "exportar-parametros":
      exportParameters(payload);
      break;
    case "apply-parameters":
    case "aplicar-parametros":
      await requireConfirmation("apply-parameters");
      applyParameters(payload);
      break;
    case "reset-accumulators":
    case "reset-acumulados":
      await requireConfirmation("reset-accumulators");
      resetAccumulators(payload.state, {
        clearGps: Boolean(args["clear-gps"]),
        clearTransit: Boolean(args["clear-transit"]),
        zeroClientBalances: Boolean(args["zero-client-balances"])
      });
      console.log(JSON.stringify({ ok: true, operation: "reset-accumulators", backup: savePayload(payload, "reset-acumulados"), summary: summary(payload) }, null, 2));
      break;
    case "reset-routes":
    case "reset-rutas":
      await requireConfirmation("reset-routes");
      resetRoutes(payload.state);
      console.log(JSON.stringify({ ok: true, operation: "reset-routes", backup: savePayload(payload, "reset-rutas"), summary: summary(payload) }, null, 2));
      break;
    case "reset-gps":
      await requireConfirmation("reset-gps");
      resetGps(payload.state);
      console.log(JSON.stringify({ ok: true, operation: "reset-gps", backup: savePayload(payload, "reset-gps"), summary: summary(payload) }, null, 2));
      break;
    case "reset-client-balances":
    case "reset-saldos-clientes":
      await requireConfirmation("reset-client-balances");
      resetClientBalances(payload.state);
      console.log(JSON.stringify({ ok: true, operation: "reset-client-balances", backup: savePayload(payload, "reset-saldos-clientes"), summary: summary(payload) }, null, 2));
      break;
    default:
      throw new Error(`Accion desconocida: ${currentAction}`);
  }
}

run(action).catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});

