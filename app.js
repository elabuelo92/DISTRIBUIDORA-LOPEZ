const seedData = {
  clients: [
    { name: "Autoservicio La Esquina", zone: "Centro", seller: "Sofia Benitez", status: "Con deuda", balance: 148000, limit: 220000, last: "Hoy 09:35" },
    { name: "Kiosco Avenida", zone: "Norte", seller: "Carlos Roldan", status: "Activo", balance: 0, limit: 120000, last: "Hoy 10:10" },
    { name: "Mercadito San Cayetano", zone: "Sur", seller: "Nicolas Vera", status: "Bloqueado", balance: 310000, limit: 180000, last: "Hace 8 dias" },
    { name: "Despensa Mitre", zone: "Centro", seller: "Sofia Benitez", status: "Activo", balance: 42000, limit: 160000, last: "Ayer" },
    { name: "Mini Market Sol", zone: "Oeste", seller: "Carlos Roldan", status: "Activo", balance: 76000, limit: 200000, last: "Hoy 11:20" }
  ],
  orders: [
    { code: "PED-2048", client: "Autoservicio La Esquina", seller: "Sofia Benitez", products: "Aceite x12, arroz x20, yerba x10", amount: 184000, status: "Recibido", print: false },
    { code: "PED-2049", client: "Kiosco Avenida", seller: "Carlos Roldan", products: "Gaseosas x30, alfajores x60", amount: 92000, status: "En armado", print: true },
    { code: "PED-2050", client: "Despensa Mitre", seller: "Sofia Benitez", products: "Harina x20, fideos x24, azucar x12", amount: 117000, status: "Listo reparto", print: true },
    { code: "PED-2051", client: "Mini Market Sol", seller: "Carlos Roldan", products: "Leche x24, cafe x8, galletitas x40", amount: 138000, status: "Facturado", print: true }
  ],
  products: [
    { name: "Aceite girasol 900ml", stock: 36, min: 80, cost: 980, price: 1380 },
    { name: "Arroz largo fino 1kg", stock: 124, min: 150, cost: 610, price: 850 },
    { name: "Yerba mate 1kg", stock: 54, min: 90, cost: 1850, price: 2490 },
    { name: "Gaseosa cola 2.25l", stock: 210, min: 160, cost: 940, price: 1290 },
    { name: "Harina 000 1kg", stock: 72, min: 120, cost: 410, price: 620 }
  ],
  suppliers: [
    { name: "Alimentos Pampeanos SA", contact: "ventas@pampeanos.com", sector: "Secos", balance: 940000, due: "07/06", status: "A pagar" },
    { name: "Bebidas Norte", contact: "Mauro Gimenez", sector: "Bebidas", balance: 0, due: "-", status: "Al dia" },
    { name: "Mayorista del Sur", contact: "Laura Castro", sector: "Lacteos", balance: 420000, due: "05/06", status: "Vence pronto" }
  ],
  accounts: [
    { date: "03/06", type: "Venta", account: "Autoservicio La Esquina", method: "Cuenta corriente", debit: 184000, credit: 0, balance: 148000 },
    { date: "03/06", type: "Cobro", account: "Clinica bancaria", method: "Transferencia", debit: 0, credit: 85000, balance: 63000 },
    { date: "02/06", type: "Pago proveedor", account: "Alimentos Pampeanos SA", method: "Transferencia", debit: 0, credit: 230000, balance: 940000 },
    { date: "02/06", type: "Venta", account: "Mini Market Sol", method: "Efectivo", debit: 138000, credit: 0, balance: 76000 }
  ],
  bankTransfers: [
    { title: "Transferencia sin aplicar", text: "$ 85.000 recibidos, falta asociar a cliente.", tone: "warn" },
    { title: "Diferencia de caja", text: "$ 12.500 entre efectivo informado y rendido.", tone: "danger" }
  ],
  sellers: [
    { name: "Sofia Benitez", route: "Centro", orders: 2, sales: 301000, commission: 9030, gps: "GPS pendiente", progress: 72, location: null },
    { name: "Carlos Roldan", route: "Norte/Oeste", orders: 2, sales: 230000, commission: 6900, gps: "GPS pendiente", progress: 58, location: null },
    { name: "Nicolas Vera", route: "Sur", orders: 0, sales: 0, commission: 0, gps: "GPS pendiente", progress: 18, location: null },
    { name: "Vendedor 4", route: "Ruta 4", orders: 0, sales: 0, commission: 0, gps: "GPS pendiente", progress: 0, location: null },
    { name: "Vendedor 5", route: "Ruta 5", orders: 0, sales: 0, commission: 0, gps: "GPS pendiente", progress: 0, location: null }
  ],
  stockMovements: [
    { type: "Factura", title: "Salida por PED-2051", text: "Se desconto leche, cafe y galletitas del stock." },
    { type: "Compra", title: "Ingreso proveedor Bebidas Norte", text: "Se cargaron 96 unidades de gaseosa cola." },
    { type: "Ajuste", title: "Control deposito", text: "Diferencia de 4 unidades en yerba mate." }
  ],
  activity: [
    { type: "Preventa", title: "PED-2048 recibido desde celular", text: "Sofia Benitez envio pedido desde Autoservicio La Esquina." },
    { type: "Deposito", title: "PED-2049 impreso para armado", text: "El pedido ya esta en cola de preparacion." },
    { type: "Cobranza", title: "Transferencia pendiente", text: "Hay un pago sin cliente asociado para conciliar." },
    { type: "Compra", title: "Factura proveedor cargada", text: "Stock actualizado automaticamente por ingreso de mercaderia." }
  ],
  requirements: [
    { title: "Venta desde celular", text: "Preventistas cargan pedidos en calle y los envian a la distribuidora." },
    { title: "Cliente completo", text: "CUIT, razon social, direccion, condicion fiscal, tipo de cliente y forma de pago." },
    { title: "Pedido a deposito", text: "Ventas internas recibe el pedido y deposito imprime hoja de armado." },
    { title: "Stock semanal", text: "Ingresos, egresos, ajustes y cierre semanal de inventario los lunes." },
    { title: "Proveedores", text: "Datos fiscales, listas de precios, condiciones comerciales y plazos de pago." },
    { title: "Cobranzas reales", text: "Efectivo, transferencia, Mercado Pago, cuenta corriente y mercaderia como parte de pago." },
    { title: "Reparto y rendicion", text: "Rutas por zona, entregas, devoluciones, cobranzas y rendicion de choferes." },
    { title: "Indicadores gerenciales", text: "Facturacion, margen, caja, rentabilidad, rotacion, clientes activos y productividad." }
  ]
};

const titles = {
  dashboard: "Tablero general",
  preventa: "Preventa movil",
  pedidos: "Pedidos y deposito",
  armado: "Armado / Deposito",
  reparto: "Reparto y cobranza",
  clientes: "Clientes",
  cuentas: "Cuentas corrientes",
  stock: "Stock e Inventario",
  "control-stock": "Control fisico",
  precios: "Listas de precios",
  comisiones: "Comisiones",
  proveedores: "Proveedores",
  estadisticas: "Estadisticas operativas",
  diagnostico: "Diagnostico tecnico",
  legal: "Legal",
  ayuda: "Centro de ayuda",
  acerca: "Acerca del sistema",
  admin: "Administracion"
};

const DEMO_PASSWORD = "Lopez2026!";
const demoUsers = [
  { username: "admin1", name: "Administracion 1", role: "admin" },
  { username: "admin2", name: "Administracion 2", role: "admin" },
  { username: "admin3", name: "Administracion 3", role: "admin" },
  { username: "martin", name: "Martin Lopez", role: "admin" },
  { username: "cecilia", name: "Cecilia - Compras y stock", role: "admin" },
  { username: "eric", name: "Eric - Ventas internas", role: "admin" },
  { username: "deposito1", name: "Encargado de Deposito", role: "depot" },
  { username: "recepcion1", name: "Recepcion Mercaderia", role: "receiver" },
  { username: "sofia", name: "Sofia Benitez", role: "seller", sellerName: "Sofia Benitez" },
  { username: "carlos", name: "Carlos Roldan", role: "seller", sellerName: "Carlos Roldan" },
  { username: "nicolas", name: "Nicolas Vera", role: "seller", sellerName: "Nicolas Vera" },
  { username: "vendedor4", name: "Vendedor 4", role: "seller", sellerName: "Vendedor 4" },
  { username: "vendedor5", name: "Vendedor 5", role: "seller", sellerName: "Vendedor 5" },
  { username: "reparto1", name: "Dispositivo Reparto 1", role: "driver" }
];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

const SUPPORT_WHATSAPP_PHONE = (window.DL_SUPPORT_WHATSAPP_PHONE || "").replace(/\D/g, "");
const SUPPORT_WHATSAPP_TEXT = "Hola, necesito soporte tecnico con DL Preventa.";
const DEVELOPER_BRAND = {
  name: "Grupo Rocha Solutions",
  shortName: "GRS",
  supportLabel: "Soporte Tecnico",
  website: "https://gruporochasolutions.com",
  email: "soporte@gruporochasolutions.com",
  phone: SUPPORT_WHATSAPP_PHONE ? `+${SUPPORT_WHATSAPP_PHONE}` : "+54 9 351 241 0535",
  hours: "Lunes a viernes de 9 a 18 hs",
  tagline: "Transformando procesos empresariales mediante software, automatizacion e inteligencia aplicada.",
  poweredBy: "Powered by Grupo Rocha Solutions"
};
const DEFAULT_ASSEMBLY_PRINT_SETTINGS = {
  showPrices: true,
  showAmounts: true,
  showInternalCode: true,
  showObservations: true,
  showQr: true,
  showClientLogo: true,
  fontSize: 12,
  highlightColors: {
    promo: "#fff4ce",
    fragile: "#ffe4e6",
    cold: "#dbeafe",
    special: "#ede9fe"
  }
};
const OrderEngine = window.DLOrderEngine;
const DeliveryEngine = window.DLDeliveryEngine;
const AccountEngine = window.DLAccountEngine;
const LegalEngine = window.DLLegalEngine;
const ORDER_STATUS = OrderEngine.STATUS;
const TRANSFER_STATUS = AccountEngine.TRANSFER_STATUS || {
  PENDING: "Pendiente de Transferencia",
  RECEIVED: "Comprobante Recibido",
  BANK_PENDING: "Pendiente de Validacion Bancaria",
  VALIDATED: "Transferencia Validada",
  CONFIRMED: "Pago Confirmado",
  ACCOUNT_UPDATED: "Cuenta Corriente Actualizada",
  OBSERVED: "Transferencia Observada"
};
const TRANSFER_FINAL_STATUSES = new Set([
  TRANSFER_STATUS.VALIDATED,
  TRANSFER_STATUS.CONFIRMED,
  TRANSFER_STATUS.ACCOUNT_UPDATED,
  "Validada"
]);
const DELIVERY_OPERATIVE_ROUTE_STATUSES = new Set([
  "Disponible",
  "Pendiente",
  "Asignada",
  "Iniciada",
  "En reparto",
  "En Reparto",
  "Pausada",
  "Despachada",
  "En curso"
]);
const DELIVERY_CLOSED_ROUTE_STATUSES = new Set([
  "Cerrada",
  "Rendida",
  "Finalizada",
  "Cancelada",
  "Completada"
]);
const DELIVERY_CASH_DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10];
const CONNECTION_CONFIG = window.DL_CONNECTION_CONFIG || {};
const CONNECTION_TIMEOUTS = CONNECTION_CONFIG.TIMEOUTS || {};
const APP_VERSION = CONNECTION_CONFIG.VERSION || "8790-88";

function configNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const SERVER_TIMEOUT_MS = configNumber(CONNECTION_TIMEOUTS.server, 7000);
const HEALTH_TIMEOUT_MS = configNumber(CONNECTION_TIMEOUTS.health, 4500);
const SERVER_HEALTH_RETRY_DELAYS_MS = Array.isArray(CONNECTION_TIMEOUTS.healthRetries)
  ? CONNECTION_TIMEOUTS.healthRetries
  : [0, 800, 1600, 3000, 5000];
const LOGIN_RETRY_DELAYS_MS = Array.isArray(CONNECTION_TIMEOUTS.loginRetries)
  ? CONNECTION_TIMEOUTS.loginRetries
  : [0, 800, 1600, 3000, 5000];
const LOGIN_CONNECTION_GRACE_MS = configNumber(CONNECTION_TIMEOUTS.loginGrace, 30000);
const SYNC_INTERVAL_MS = configNumber(CONNECTION_TIMEOUTS.syncInterval, 2500);
const MOBILE_SYNC_INTERVAL_MS = Math.max(SYNC_INTERVAL_MS, configNumber(CONNECTION_TIMEOUTS.mobileSyncInterval, 7000));
const LEGACY_LOCAL_STATE_KEY = "distribuidoraLopezDemo";
const LOCAL_META_KEY = "dlPreventaLocalMeta";
const LOCAL_STORAGE_MAX_VALUE_BYTES = 180000;
const SYSTEM_LOCAL_PREFIXES = ["dl", "distribuidoraLopez"];
const SYSTEM_LOCAL_KEYS = [
  LEGACY_LOCAL_STATE_KEY,
  LOCAL_META_KEY,
  "lastOwnSellerLocation",
  "dlDeliveryDevice",
  "dlSessionDevice",
  "dlLabelPrinter"
];
const ORDER_WORKFLOW = [
  { status: ORDER_STATUS.PENDING, label: "Pendiente", short: "PEN" },
  { status: ORDER_STATUS.READY, label: "En PreparaciÃ³n", short: "PRE" },
  { status: ORDER_STATUS.ASSEMBLY, label: "En Armado", short: "ARM" },
  { status: ORDER_STATUS.LABELED, label: "Etiquetado", short: "ETQ" },
  { status: ORDER_STATUS.READY_DISPATCH, label: "Listo para Despacho", short: "LIS" },
  { status: ORDER_STATUS.DISPATCHED, label: "Despachado", short: "DSP" },
  { status: ORDER_STATUS.IN_ROUTE, label: "En Reparto", short: "RTA" },
  { status: ORDER_STATUS.DELIVERED, label: "Entregado", short: "ENT" },
  { status: ORDER_STATUS.COLLECTED, label: "Cobrado", short: "COB" },
  { status: ORDER_STATUS.CLOSED, label: "Cerrado", short: "CER" }
];
const ORDER_COMMERCIAL_STAGE = { status: ORDER_STATUS.COMMERCIAL_APPROVAL, label: "Aprobacion comercial", short: "APR" };
const ORDER_PIPELINE_STAGES = [
  { key: "pendiente", label: "Pendiente", statuses: [ORDER_STATUS.PENDING, ORDER_STATUS.COMMERCIAL_APPROVAL], text: "Validando stock, abastecimiento o aprobacion comercial.", tone: "warn" },
  { key: "preparacion", label: "En PreparaciÃ³n", statuses: [ORDER_STATUS.READY], text: "Stock completo y listo para deposito.", tone: "ok" },
  { key: "armado", label: "En Armado", statuses: [ORDER_STATUS.ASSEMBLY], text: "Deposito preparando mercaderia.", tone: "warn" },
  { key: "etiquetado", label: "Etiquetado", statuses: [ORDER_STATUS.LABELED], text: "Etiqueta generada, esperando escaneo.", tone: "warn" },
  { key: "listo", label: "Listo para Despacho", statuses: [ORDER_STATUS.READY_DISPATCH], text: "Bultos y etiqueta validados.", tone: "ok" },
  { key: "despachado", label: "Despachado", statuses: [ORDER_STATUS.DISPATCHED], text: "Publicado para salir a ruta.", tone: "ok" },
  { key: "reparto", label: "En Reparto", statuses: [ORDER_STATUS.IN_ROUTE], text: "Pedido viajando al cliente.", tone: "ok" },
  { key: "parcial", label: "Parcial", statuses: [ORDER_STATUS.PARTIAL_DELIVERED], text: "Entrega parcial con saldo pendiente.", tone: "warn" },
  { key: "entregado", label: "Entregado", statuses: [ORDER_STATUS.DELIVERED], text: "Recepcion confirmada por el cliente.", tone: "ok" },
  { key: "cobrado", label: "Cobrado", statuses: [ORDER_STATUS.COLLECTED], text: "Pago registrado en reparto.", tone: "ok" },
  { key: "cerrado", label: "Cerrado", statuses: [ORDER_STATUS.CLOSED], text: "Pedido cerrado administrativamente.", tone: "ok" },
  { key: "incidencias", label: "Incidencias", statuses: [ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED, ORDER_STATUS.REJECTED], text: "No entregados, postergados o rechazados.", tone: "danger" }
];
const ORDER_DASHBOARD_STAGES = [
  { key: "pendiente", label: "Pendientes", statuses: [ORDER_STATUS.PENDING, ORDER_STATUS.COMMERCIAL_APPROVAL], text: "Validando stock, abastecimiento o aprobacion comercial.", tone: "warn" },
  { key: "preparacion", label: "En Preparacion", statuses: [ORDER_STATUS.READY], text: "Stock completo y listo para deposito.", tone: "ok" },
  { key: "armado", label: "Armados", statuses: [ORDER_STATUS.ASSEMBLY], text: "Deposito preparando mercaderia.", tone: "warn" },
  { key: "etiquetado", label: "Etiquetados", statuses: [ORDER_STATUS.LABELED], text: "Esperan escaneo.", tone: "warn" },
  { key: "listo", label: "Listos Despacho", statuses: [ORDER_STATUS.READY_DISPATCH], text: "Preparados para hoja de ruta.", tone: "ok" },
  { key: "reparto", label: "En Reparto", statuses: [ORDER_STATUS.DISPATCHED, ORDER_STATUS.IN_ROUTE, ORDER_STATUS.CHECKED], text: "Despachados o viajando al cliente.", tone: "ok" },
  { key: "entregado", label: "Entregados", statuses: [ORDER_STATUS.PARTIAL_DELIVERED, ORDER_STATUS.DELIVERED], text: "Recepcion total o parcial confirmada.", tone: "ok" },
  { key: "cobrado", label: "Cobrados", statuses: [ORDER_STATUS.COLLECTED], text: "Pago registrado en reparto.", tone: "ok" },
  { key: "cerrado", label: "Cerrados", statuses: [ORDER_STATUS.CLOSED], text: "Pedido cerrado administrativamente.", tone: "ok" },
  { key: "incidencias", label: "Incidencias", statuses: [ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED, ORDER_STATUS.REJECTED], text: "No entregados, postergados o rechazados.", tone: "danger" }
];
const ORDER_DELAY_LIMITS_MIN = {
  [ORDER_STATUS.PENDING]: 1440,
  [ORDER_STATUS.COMMERCIAL_APPROVAL]: 60,
  [ORDER_STATUS.READY]: 45,
  [ORDER_STATUS.ASSEMBLY]: 60,
  [ORDER_STATUS.LABELED]: 30,
  [ORDER_STATUS.READY_DISPATCH]: 180,
  [ORDER_STATUS.DISPATCHED]: 240,
  [ORDER_STATUS.IN_ROUTE]: 45,
  [ORDER_STATUS.CHECKED]: 30,
  [ORDER_STATUS.PARTIAL_DELIVERED]: 0,
  [ORDER_STATUS.DELIVERED]: 0,
  [ORDER_STATUS.COLLECTED]: 0,
  [ORDER_STATUS.CLOSED]: 0,
  [ORDER_STATUS.NOT_DELIVERED]: 0,
  [ORDER_STATUS.POSTPONED]: 0,
  [ORDER_STATUS.REJECTED]: 0,
  [ORDER_STATUS.CANCELLED]: 0
};
const WORK_DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Fuera de Ruta"];
const NO_PURCHASE_REASONS = [
  "Cliente cerrado",
  "Tenia mercaderia",
  "No tenia dinero",
  "Compra a otro proveedor",
  "Precios altos",
  "Espera cobrar",
  "Dueno ausente",
  "No quiso comprar",
  "Vacaciones",
  "Remodelacion",
  "Cambio de rubro",
  "Cliente perdido",
  "Otros"
];
const SYSTEM_PRICE_LISTS = [1, 2, 3, 4, 5];

let state = loadState();
let mobileSeller = "Sofia Benitez";
let mobileClient = "Autoservicio La Esquina";
let mobileCart = {};
let mobileProduct = "";
let mobileWorkday = defaultMobileWorkday();
let mobilePreventaTab = "order";
let mobileNewClientLocation = null;
let mobileSalesSearchTerm = "";
let mobileSalesSelectedOrderCode = "";
let mobileClientHistoryOpen = false;
let lastMobileConsultationAuditKey = "";
let syncVersion = 0;
let syncReady = false;
let saveTimer = null;
let geoWatchId = null;
let nativeGpsRefreshTimer = null;
let lastOwnLocation = loadLastOwnLocation();
let googleMapsPromise = null;
let googleMap = null;
let googleMarkers = [];
let dashboardPresenceGoogleMap = null;
let dashboardPresenceGoogleMarkers = [];
let dashboardPresenceGoogleSignature = "";
let dashboardPresenceLastRenderAt = 0;
let presenceLocationActions = new Map();
let deliveryRouteMap = null;
let deliveryRouteMarkers = [];
let deliveryRoutePolyline = null;
let deliveryMapGeocoder = null;
let deliveryMapRenderToken = 0;
const deliveryMapGeocodeCache = new Map();
let currentUser = null;
let appBackGuardInstalled = false;
let appBackGuardArmed = false;
let lastBackGuardNoticeAt = 0;
let viewHistoryStack = [];
let authMode = "pending";
let syncIntervalId = null;
let syncPullInFlight = false;
let syncPushInFlight = false;
let pendingPullAfterPush = false;
let activeRenderFrame = null;
let lastPresenceRenderAt = 0;
let gpsStartRequestedAt = 0;
let pendingLoginLocation = null;
let pendingLoginLocationResolver = null;
let sessionRetryTimer = null;
let loginConnectionStartedAt = 0;
let orderSearchTerm = "";
let orderStatusFilter = "all";
let orderSellerFilter = "all";
let orderUrgencyFilter = "all";
let orderQuickFilter = "all";
let orderSortKey = "created_desc";
let orderPage = 1;
const ORDERS_PAGE_SIZE = 25;
let currentFilteredOrders = [];
let currentPageOrders = [];
const selectedOrderCodes = new Set();
let assemblyDepotSearchTerm = "";
let assemblyDepotStatusFilter = "all";
let assemblyDepotUrgencyFilter = "all";
let assemblyDepotOnlyShortages = false;
let assemblyControlSortKey = "assembly_order";
let currentAssemblyDepotOrders = [];
let clientSearchTerm = "";
let clientStatusFilter = "all";
let clientSellerFilter = "all";
let clientZoneFilter = "all";
let clientAccountFilter = "all";
let accountSearchTerm = "";
let accountTypeFilter = "all";
let accountMethodFilter = "all";
let accountStatusFilter = "all";
let bankStatusFilter = "all";
let bankClientFilter = "";
let bankDateFilter = "";
let bankBankFilter = "";
let bankAmountFilter = "";
let bankPendingClientsFilter = "all";
let transferProofSelectedFile = null;
const selectedTransferIds = new Set();
let stockSearchTerm = "";
let stockStatusFilter = "all";
let stockRubricFilter = "all";
let stockBrandFilter = "all";
let stockLedgerSearchTerm = "";
let stockLedgerTypeFilter = "all";
let stockLedgerUserFilter = "all";
let stockLedgerDateFilter = "";
let initialStockPreviewRows = [];
let priceListSearchTerm = "";
let priceListListFilter = "all";
let priceListRubricFilter = "all";
let priceListBrandFilter = "all";
let priceListSupplierFilter = "all";
let priceListStatusFilter = "all";
let priceListEffectiveFilter = "";
let priceListLastSimulation = null;
let commissionSearchTerm = "";
let commissionRoleFilter = "all";
let commissionStatusFilter = "all";
let legalAcceptancePacket = null;
let pendingLegalLogin = null;
let helpSearchTerm = "";
let helpRoleFilter = "all";
let helpModuleFilter = "all";
let activeHelpTopicId = "";
let physicalStockSearchTerm = "";
let physicalStockRubricFilter = "all";
let physicalStockBrandFilter = "all";
let physicalStockSupplierFilter = "all";
let physicalStockWarehouseFilter = "all";
let physicalStockDateFilter = "";
let physicalStockUserFilter = "all";
let physicalStockMode = "all";
let physicalStockReportType = "current";
let physicalStockCountMode = false;
let physicalStockAdjustTargetCode = "";
let supplierSearchTerm = "";
let supplierStatusFilter = "all";
let supplierSectorFilter = "all";
let selectedSupplierAccountName = "";
let shortageDateFrom = "";
let shortageDateTo = "";
let shortageTimeFrom = "";
let shortageTimeTo = "";
let shortageProductTerm = "";
let shortageClientTerm = "";
let shortageSellerFilter = "all";
let shortageZoneFilter = "all";
let shortageStatusFilter = "all";
let auditSearchTerm = "";
let auditEntityFilter = "all";
let auditActionFilter = "all";
let notificationSearchTerm = "";
let notificationToneFilter = "all";
let notificationCategoryFilter = "all";
let knownNotificationIds = new Set();
let notificationTrackerReady = false;
let readNotificationIds = loadReadNotificationIds();
let stockEditTargetName = "";
let adminOrderNotificationReady = false;
let adminKnownOrderCodes = new Set();
let highlightedOrderCode = "";
let deliveryDevice = loadDeliveryDevice();
let sessionDevice = loadSessionDevice();
let currentSession = null;
let presenceSessions = [];
let presenceHistory = [];
let presenceMapFilter = "all";
let sessionSettings = {
  duplicatePolicy: "replace",
  offlineAfterMs: 45000,
  heartbeatIntervalMs: 10000,
  locationUpdateMinDistanceMeters: 5,
  locationMovingIntervalMs: 10000,
  locationStationaryIntervalMs: 10000,
  locationMaxAgeMs: 300000,
  historyRetentionDays: 30,
  sessionTtlMs: 20 * 60 * 60 * 1000,
  workdayStartHour: 7,
  workdayEndHour: 22,
  workdayTimezone: "America/Argentina/Cordoba"
};
let gpsDailyRoutesPayload = null;
let gpsDailyRoutesLoading = false;
let gpsDailyRoutesLastFetchKey = "";
let securityLicenseStatus = null;
let presenceHeartbeatIntervalId = null;
let presenceLocationIntervalId = null;
let lastPresenceLocationSent = null;
let deliveryLocation = null;
let deliveryGpsStartRequestedAt = 0;
let deliveryGpsRefreshTimer = null;
let activeDeliveryRouteId = "";
let deliverySignatureDirty = false;
let deliveryExceptionSignatureDirty = false;
let deliveryPlannerSelection = new Set();
let deliveryPlannerSortKey = "route";
let deliveryPlannerGroupByRoute = true;
let orderEditTargetCode = "";
let orderEditDraftItems = [];
let orderLabelTargetCode = "";
let orderScanTargetCode = "";
let clientEditTargetId = "";
let supplierRemitItems = [];
let connectionDiagnostics = {
  status: "Pendiente",
  server: CONNECTION_CONFIG.SERVER_NAME || "SERVIDOR_UNICO_8790",
  apiBaseUrl: "",
  healthUrl: "",
  socketUrl: CONNECTION_CONFIG.SOCKET_URL || "",
  latencyMs: null,
  apiStatus: "Sin comprobar",
  syncStatus: "Sin sincronizar",
  dbStatus: "Sin comprobar",
  tailscaleStatus: "No verificado",
  lastSuccess: "",
  lastError: "",
  checkedAt: ""
};

function apiUrl(path) {
  const cleanPath = String(path).replace(/^\/+/, "");
  const base = getApiBaseUrl();
  return `${base}/${cleanPath}`;
}

function normalizeBaseUrl(value) {
  const text = String(value || "").trim().replace(/\/+$/, "");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function getApiBaseUrl() {
  const explicit = normalizeBaseUrl(CONNECTION_CONFIG.API_BASE_URL);
  if (explicit) return explicit;
  const magicDns = normalizeBaseUrl(CONNECTION_CONFIG.MAGIC_DNS_HOST);
  if (magicDns && location.protocol === "file:") return magicDns;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localHosts.has(location.hostname)) {
    return `http://127.0.0.1:${location.port || CONNECTION_CONFIG.API_PORT || "8790"}`;
  }
  if (location.origin && location.origin !== "null") return location.origin.replace(/\/+$/, "");
  return `http://127.0.0.1:${CONNECTION_CONFIG.API_PORT || "8790"}`;
}

function getSocketUrl() {
  const explicit = normalizeBaseUrl(CONNECTION_CONFIG.SOCKET_URL);
  if (explicit) return explicit;
  const base = getApiBaseUrl();
  return base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(url, options = {}, timeoutMs = SERVER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

function updateConnectionDiagnostics(patch = {}) {
  connectionDiagnostics = {
    ...connectionDiagnostics,
    server: CONNECTION_CONFIG.SERVER_NAME || "SERVIDOR_UNICO_8790",
    apiBaseUrl: getApiBaseUrl(),
    healthUrl: apiUrl("api/health"),
    socketUrl: getSocketUrl(),
    checkedAt: patch.checkedAt || new Date().toISOString(),
    ...patch
  };
  renderDiagnostics();
}

function renderDiagnostics() {
  const grid = byId("diagnosticsGrid");
  const log = byId("diagnosticsLog");
  if (!grid || !log) return;
  const diag = connectionDiagnostics;
  const location = currentRoleLocation();
  const gpsReject = gpsClientRejectReason(location);
  const sessionOnline = currentSession && currentSession.online !== false;
  const statusTone = diag.status === "OK" ? "ok" : diag.status === "Error" ? "danger" : "warn";
  const items = [
    { label: "Estado", value: diag.status, tone: statusTone },
    { label: "Servidor", value: diag.server || "Sin nombre", tone: "ok" },
    { label: "URL API", value: diag.apiBaseUrl || "-", tone: "ok" },
    { label: "Latencia", value: diag.latencyMs === null ? "-" : `${diag.latencyMs} ms`, tone: diag.latencyMs !== null && diag.latencyMs < 1000 ? "ok" : "warn" },
    { label: "API", value: diag.apiStatus || "Sin comprobar", tone: diag.apiStatus === "OK" ? "ok" : "warn" },
    { label: "Base de datos", value: diag.dbStatus || "Sin comprobar", tone: diag.dbStatus === "OK" ? "ok" : "warn" },
    { label: "Sincronizacion", value: diag.syncStatus || "Sin sincronizar", tone: syncReady ? "ok" : "warn" },
    { label: "Tailnet", value: diag.tailscaleStatus || "No verificado", tone: String(diag.apiBaseUrl || "").includes(".ts.net") ? "ok" : "warn" },
    { label: "Sesion", value: currentSession ? (sessionOnline ? "Activa" : "Sin presencia") : "Sin sesion", tone: sessionOnline ? "ok" : "warn" },
    { label: "GPS", value: location ? `${Math.round(Number(location.accuracy || 0))} m` : "Sin coordenada", tone: location && !gpsReject ? "ok" : "danger" },
    { label: "Heartbeat", value: currentSession && currentSession.lastHeartbeatAt ? formatOrderTime(currentSession.lastHeartbeatAt) : "Pendiente", tone: currentSession && currentSession.lastHeartbeatAt ? "ok" : "warn" }
  ];
  grid.innerHTML = items.map((item) => `
    <article class="diagnostic-card ${item.tone}">
      <small>${escapeHtml(item.label)}</small>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");
  log.innerHTML = `
    <article class="diagnostic-detail">
      <strong>Endpoint de salud</strong>
      <code>${escapeHtml(diag.healthUrl || apiUrl("api/health"))}</code>
    </article>
    <article class="diagnostic-detail">
      <strong>WebSocket preparado</strong>
      <code>${escapeHtml(diag.socketUrl || getSocketUrl())}</code>
    </article>
    <article class="diagnostic-detail">
      <strong>Ultima conexion correcta</strong>
      <span>${escapeHtml(diag.lastSuccess ? formatOrderTime(diag.lastSuccess) : "Sin registro")}</span>
    </article>
    <article class="diagnostic-detail ${diag.lastError ? "danger" : ""}">
      <strong>Ultimo error</strong>
      <span>${escapeHtml(diag.lastError || "Sin errores registrados")}</span>
    </article>
    <article class="diagnostic-detail">
      <strong>Version</strong>
      <span>${escapeHtml(APP_VERSION)}</span>
    </article>
    <article class="diagnostic-detail ${gpsReject ? "danger" : ""}">
      <strong>GPS dispositivo</strong>
      <span>${escapeHtml(location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} - ${gpsTrustLabel(location)} - ${location.updatedAt || formatOrderTime(location.at)}` : "Sin lectura del dispositivo")}</span>
    </article>
    <article class="diagnostic-detail">
      <strong>Sesion / dispositivo</strong>
      <code>${escapeHtml(currentSession ? `${currentSession.sessionId} / ${sessionDevicePayload().id}` : sessionDevicePayload().id)}</code>
    </article>
  `;
}

async function runConnectionDiagnostics() {
  const startedAt = performance.now();
  updateConnectionDiagnostics({
    status: "Probando",
    apiStatus: "Consultando",
    dbStatus: "Consultando",
    syncStatus: syncReady ? "Online" : "Pendiente",
    tailscaleStatus: String(getApiBaseUrl()).includes(".ts.net") ? "MagicDNS / HTTPS configurado" : "Usando origen actual"
  });
  try {
    const response = await fetchWithTimeout(apiUrl("api/health"), { cache: "no-store" }, HEALTH_TIMEOUT_MS);
    const latencyMs = Math.round(performance.now() - startedAt);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${response.status}`);
    if (payload.security) {
      securityLicenseStatus = payload.security;
      renderLicensePanel();
    }
    if (currentUser) {
      try {
        const presenceResponse = await fetchWithTimeout(apiUrl("api/presence/status"), { cache: "no-store" }, 5000);
        const presencePayload = await presenceResponse.json().catch(() => ({}));
        if (presenceResponse.ok) applyPresencePayload(presencePayload);
      } catch {
        // Diagnostico de presencia no debe invalidar el health general.
      }
    }
    updateConnectionDiagnostics({
      status: "OK",
      latencyMs,
      apiStatus: "OK",
      dbStatus: payload.stateFile ? "OK" : "Sin estado",
      syncStatus: syncReady ? "Online" : "API online, esperando sync",
      tailscaleStatus: String(getApiBaseUrl()).includes(".ts.net") ? "MagicDNS activo" : "Origen actual activo",
      lastSuccess: new Date().toISOString(),
      lastError: "",
      server: payload.instance || CONNECTION_CONFIG.SERVER_NAME || "SERVIDOR_UNICO_8790"
    });
    return true;
  } catch (error) {
    updateConnectionDiagnostics({
      status: "Error",
      latencyMs: null,
      apiStatus: "Sin respuesta",
      dbStatus: "No verificado",
      syncStatus: "Offline",
      lastError: error.message || "No se pudo conectar con la API"
    });
    return false;
  }
}

function storageBytes(value) {
  try {
    return new Blob([String(value ?? "")]).size;
  } catch {
    return String(value ?? "").length * 2;
  }
}

function keepOnlySelectedFileInput(activeId, ids) {
  const active = byId(activeId);
  if (!active || !active.files || !active.files[0]) return;
  ids.forEach((id) => {
    if (id !== activeId) byId(id).value = "";
  });
}

function removeStorageKey(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Sin accion: algunos navegadores bloquean Storage en modo privado.
  }
}

function cleanupNonCriticalLocalStorage(reason = "") {
  removeStorageKey(localStorage, LEGACY_LOCAL_STATE_KEY);
  removeStorageKey(localStorage, "lastOwnSellerLocation");
  try {
    const meta = {
      cleanedAt: new Date().toISOString(),
      reason
    };
    localStorage.setItem(LOCAL_META_KEY, JSON.stringify(meta));
  } catch {
    // Si no hay cuota ni para metadatos, el flujo sigue sin bloquear al usuario.
  }
}

function safeLocalStorageSet(key, value, maxBytes = LOCAL_STORAGE_MAX_VALUE_BYTES) {
  const text = String(value ?? "");
  if (storageBytes(text) > maxBytes) {
    cleanupNonCriticalLocalStorage(`valor demasiado grande: ${key}`);
    return false;
  }
  try {
    localStorage.setItem(key, text);
    return true;
  } catch (error) {
    cleanupNonCriticalLocalStorage(`quota: ${key}`);
    try {
      localStorage.setItem(key, text);
      return true;
    } catch {
      console.warn("No se pudo guardar cache local liviana.", key, error);
      return false;
    }
  }
}

function safeSessionStorageSet(key, value) {
  try {
    sessionStorage.setItem(key, String(value ?? ""));
    return true;
  } catch {
    return false;
  }
}

function persistLocalMeta(reason = "") {
  safeLocalStorageSet(LOCAL_META_KEY, JSON.stringify({
    version: "v88",
    reason,
    savedAt: new Date().toISOString(),
    user: currentUser && {
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role
    },
    view: location.hash.replace("#", "") || "dashboard"
  }), 12000);
}

function cleanupOperationalLocalData(reason = "") {
  cleanupNonCriticalLocalStorage(reason);
  removeStorageKey(sessionStorage, "dlPendingMobileOrder");
}

function appHomeView() {
  if (currentUser && currentUser.role === "seller") return "preventa";
  if (currentUser && currentUser.role === "driver") return "reparto";
  if (currentUser && currentUser.role === "receiver") return "proveedores";
  if (currentUser && currentUser.role === "depot") return "armado";
  return "dashboard";
}

function activeViewId() {
  const active = document.querySelector(".view.active");
  return active && active.id || location.hash.replace("#", "") || appHomeView();
}

function closeTopDialogForBack() {
  const dialogs = Array.from(document.querySelectorAll("dialog[open]"));
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) return false;
  dialog.close("back");
  return true;
}

function canUseView(viewId) {
  if (!viewId) return false;
  const view = byId(viewId);
  if (!view) return false;
  const navItem = Array.from(document.querySelectorAll(".nav-item")).find((item) => item.dataset.view === viewId);
  return !navItem || !navItem.hidden;
}

function rememberViewTransition(nextViewId, options = {}) {
  if (!currentUser || options.skipHistory) return;
  const current = activeViewId();
  if (!current || current === nextViewId || !canUseView(current)) return;
  if (viewHistoryStack[viewHistoryStack.length - 1] !== current) {
    viewHistoryStack.push(current);
  }
  if (viewHistoryStack.length > 10) viewHistoryStack = viewHistoryStack.slice(-10);
}

function popPreviousView() {
  while (viewHistoryStack.length) {
    const previous = viewHistoryStack.pop();
    if (previous && previous !== activeViewId() && canUseView(previous)) return previous;
  }
  return "";
}

function updateBackButtons() {
  const home = appHomeView();
  const current = activeViewId();
  const hasBackTarget = Boolean(currentUser && (current !== home || viewHistoryStack.length));
  ["appBackBtn", "mobileBackBtn"].forEach((id) => {
    const button = byId(id);
    if (!button) return;
    button.disabled = !currentUser;
    button.dataset.state = hasBackTarget ? "ready" : "home";
    button.title = hasBackTarget ? "Volver a la pantalla anterior" : "Estas en la pantalla principal";
  });
}

function armAppBackGuard() {
  if (!currentUser || !appBackGuardInstalled) return;
  if (appBackGuardArmed) return;
  try {
    history.pushState({ dlBackGuard: true }, "", location.href);
    appBackGuardArmed = true;
  } catch {
    // Navegadores viejos pueden negar History API; la app sigue operativa.
  }
}

function navigateBackInApp() {
  if (!currentUser) return false;
  if (closeTopDialogForBack()) {
    armAppBackGuard();
    return true;
  }
  const home = appHomeView();
  const current = activeViewId();
  const previous = popPreviousView();
  if (previous) {
    switchView(previous, { skipHistory: true, replaceHistory: true });
    armAppBackGuard();
    return true;
  }
  if (current !== home && canUseView(home)) {
    switchView(home, { skipHistory: true, replaceHistory: true });
    armAppBackGuard();
    return true;
  }
  const now = Date.now();
  if (now - lastBackGuardNoticeAt > 1800) {
    showCompactNotice("Estas en el inicio operativo. Usar Salir solo al terminar la jornada.", "info", 1800);
    lastBackGuardNoticeAt = now;
  }
  armAppBackGuard();
  return true;
}

function handleAppBackRequest() {
  return navigateBackInApp();
}

function installAppBackGuard() {
  if (appBackGuardInstalled) return;
  appBackGuardInstalled = true;
  window.addEventListener("popstate", () => {
    appBackGuardArmed = false;
    handleAppBackRequest();
  });
  window.DL_HANDLE_ANDROID_BACK = handleAppBackRequest;
  armAppBackGuard();
}

function openExternalUrl(url, context = "enlace") {
  const targetUrl = String(url || "").trim();
  if (!targetUrl) return false;
  try {
    if (window.AndroidConnection && typeof window.AndroidConnection.openExternalUrl === "function") {
      window.AndroidConnection.openExternalUrl(targetUrl);
      return true;
    }
  } catch (error) {
    console.warn("No se pudo usar el puente Android para abrir enlace externo.", error);
  }
  try {
    const opened = window.open(targetUrl, "_blank", "noopener,noreferrer");
    if (opened) return true;
  } catch (error) {
    console.warn(`No se pudo abrir ${context} en ventana nueva.`, error);
  }
  try {
    const link = document.createElement("a");
    link.href = targetUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    console.warn(`No se pudo abrir ${context}.`, error);
    return false;
  }
}

function emergencyCleanLocalData() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (SYSTEM_LOCAL_KEYS.includes(key) || SYSTEM_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    SYSTEM_LOCAL_KEYS.forEach((key) => removeStorageKey(localStorage, key));
  }
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (SYSTEM_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))) sessionStorage.removeItem(key);
    });
  } catch {
    sessionStorage.clear();
  }
}

function loadState() {
  cleanupNonCriticalLocalStorage("inicio de app");
  return normalizeState(structuredClone(seedData));
}

function normalizeAssemblyPrintSettings(settings) {
  const incoming = settings && typeof settings === "object" ? settings : {};
  const highlightColors = incoming.highlightColors && typeof incoming.highlightColors === "object"
    ? incoming.highlightColors
    : {};
  return {
    ...DEFAULT_ASSEMBLY_PRINT_SETTINGS,
    ...incoming,
    fontSize: Math.min(16, Math.max(10, numeric(incoming.fontSize, DEFAULT_ASSEMBLY_PRINT_SETTINGS.fontSize))),
    highlightColors: {
      ...DEFAULT_ASSEMBLY_PRINT_SETTINGS.highlightColors,
      ...highlightColors
    }
  };
}

function normalizePrintSettings(settings) {
  const incoming = settings && typeof settings === "object" ? settings : {};
  return {
    ...incoming,
    assembly: normalizeAssemblyPrintSettings(incoming.assembly)
  };
}

function assemblyPrintSettings() {
  state.printSettings = normalizePrintSettings(state.printSettings);
  return state.printSettings.assembly;
}

function normalizeState(nextState) {
  const base = structuredClone(seedData);
  nextState.clients = Array.isArray(nextState.clients) ? nextState.clients.map(normalizeClientRecord) : base.clients.map(normalizeClientRecord);
  nextState.products = Array.isArray(nextState.products) ? nextState.products.map(normalizeProductRecord) : base.products.map(normalizeProductRecord);
  nextState.priceLists = normalizePriceListsState(nextState.priceLists, nextState.products);
  nextState.priceListAssignments = normalizePriceListAssignmentsState(nextState.priceListAssignments);
  nextState.priceListAudit = Array.isArray(nextState.priceListAudit) ? nextState.priceListAudit : [];
  nextState.productPortfolioAudit = Array.isArray(nextState.productPortfolioAudit) ? nextState.productPortfolioAudit : [];
  nextState.maintenanceBackups = Array.isArray(nextState.maintenanceBackups) ? nextState.maintenanceBackups : [];
  nextState.commissionSettings = nextState.commissionSettings && typeof nextState.commissionSettings === "object" ? nextState.commissionSettings : {};
  nextState.commissionAudit = Array.isArray(nextState.commissionAudit) ? nextState.commissionAudit : [];
  applyDuePriceListsLocal(nextState);
  const incomingSellers = nextState.sellers || [];
  const sellerNames = new Set(incomingSellers.map((seller) => seller.name));
  const mergedSellers = [
    ...incomingSellers,
    ...base.sellers.filter((seller) => !sellerNames.has(seller.name))
  ];
  nextState.sellers = mergedSellers.map((seller) => {
    const defaultSeller = base.sellers.find((item) => item.name === seller.name) || {};
    return {
      ...defaultSeller,
      ...seller,
      location: seller.location || defaultSeller.location || null
    };
  });
  nextState.orders = Array.isArray(nextState.orders) ? nextState.orders.map(normalizeOrderRecord) : base.orders.map(normalizeOrderRecord);
  nextState.suppliers = Array.isArray(nextState.suppliers) ? nextState.suppliers.map(normalizeSupplierRecord) : base.suppliers.map(normalizeSupplierRecord);
  nextState.supplierMovements = Array.isArray(nextState.supplierMovements) ? nextState.supplierMovements : [];
  nextState.accounts = nextState.accounts || base.accounts;
  nextState.bankTransfers = nextState.bankTransfers || base.bankTransfers;
  nextState.bankReconciliation = Array.isArray(nextState.bankReconciliation) ? nextState.bankReconciliation : [];
  nextState.globalAudit = Array.isArray(nextState.globalAudit) ? nextState.globalAudit : [];
  nextState.printSettings = normalizePrintSettings(nextState.printSettings);
  nextState.printAudit = Array.isArray(nextState.printAudit) ? nextState.printAudit : [];
  nextState.notifications = Array.isArray(nextState.notifications) ? nextState.notifications : [];
  nextState.rejectedGps = Array.isArray(nextState.rejectedGps) ? nextState.rejectedGps : [];
  nextState.noPurchaseVisits = Array.isArray(nextState.noPurchaseVisits) ? nextState.noPurchaseVisits : [];
  nextState.preventaConsultations = Array.isArray(nextState.preventaConsultations) ? nextState.preventaConsultations : [];
  nextState.whatsappContacts = Array.isArray(nextState.whatsappContacts) ? nextState.whatsappContacts : [];
  nextState.entityRelations = Array.isArray(nextState.entityRelations) ? nextState.entityRelations : [];
  nextState.routeLearning = nextState.routeLearning && typeof nextState.routeLearning === "object"
    ? {
      visits: Array.isArray(nextState.routeLearning.visits) ? nextState.routeLearning.visits : [],
      clientStats: Array.isArray(nextState.routeLearning.clientStats) ? nextState.routeLearning.clientStats : [],
      recommendations: Array.isArray(nextState.routeLearning.recommendations) ? nextState.routeLearning.recommendations : []
    }
    : { visits: [], clientStats: [], recommendations: [] };
  nextState.stockMovements = nextState.stockMovements || base.stockMovements;
  nextState.physicalStockCounts = Array.isArray(nextState.physicalStockCounts) ? nextState.physicalStockCounts : [];
  nextState.physicalStockAdjustments = Array.isArray(nextState.physicalStockAdjustments) ? nextState.physicalStockAdjustments : [];
  nextState.activity = nextState.activity || base.activity;
  const incomingRequirements = nextState.requirements || [];
  const requirementTitles = new Set(incomingRequirements.map((item) => item.title));
  nextState.requirements = [
    ...incomingRequirements,
    ...base.requirements.filter((item) => !requirementTitles.has(item.title))
  ];
  OrderEngine.migrateState(nextState);
  DeliveryEngine.migrateState(nextState);
  AccountEngine.migrateState(nextState);
  if (LegalEngine && typeof LegalEngine.migrateState === "function") LegalEngine.migrateState(nextState);
  return nextState;
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeWorkday(value) {
  const text = normalizeSearchText(value || "");
  if (text.includes("fuera")) return "Fuera de Ruta";
  if (text.startsWith("lun")) return "Lunes";
  if (text.startsWith("mar")) return "Martes";
  if (text.startsWith("mie")) return "Miercoles";
  if (text.startsWith("jue")) return "Jueves";
  if (text.startsWith("vie")) return "Viernes";
  if (text.startsWith("sab")) return "Sabado";
  return "";
}

function defaultMobileWorkday() {
  const index = new Date().getDay();
  return ["Fuera de Ruta", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][index] || "Fuera de Ruta";
}

function routeModeWorkday() {
  return mobileWorkday === "Fuera de Ruta" ? "Fuera de Ruta" : defaultMobileWorkday();
}

function clientGpsPoint(client) {
  if (!client) return null;
  const lat = Number(client.latitud ?? client.latitude ?? client.lat);
  const lng = Number(client.longitud ?? client.longitude ?? client.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function selectedSellerGpsPoint() {
  const seller = getSelectedMobileSeller();
  return seller && seller.location ? { lat: seller.location.lat, lng: seller.location.lng } : null;
}

function canAuthorizeCredit() {
  return AccountEngine.canAuthorize(currentUser);
}

function clientAccountSummary(clientName, orderAmount = 0) {
  return AccountEngine.accountSummary(state, clientName, orderAmount);
}

function accountStatusTone(status) {
  const normalized = normalizeSearchText(status);
  if (normalized.includes("bloquead") || normalized.includes("limite")) return "danger";
  if (normalized.includes("vencid") || normalized.includes("saldo")) return "warn";
  return "ok";
}

function formatLastPayment(lastPayment) {
  if (!lastPayment) return "Sin pagos registrados";
  return `${lastPayment.date || "Sin fecha"} - ${money.format(lastPayment.amount || 0)}${lastPayment.method ? ` - ${lastPayment.method}` : ""}`;
}

function accountSummaryHtml(summary, mode = "default") {
  if (!summary || !summary.ok) {
    return '<p class="account-warning danger">Cliente no encontrado en cuentas corrientes.</p>';
  }
  const tone = accountStatusTone(summary.status);
  const compact = mode === "compact";
  return `
    <div class="account-summary-card ${tone}">
      <div class="account-summary-head">
        <div>
          <small>Cuenta corriente</small>
          <strong>${escapeHtml(summary.clientName)}</strong>
        </div>
        <span class="tag ${tone}">${escapeHtml(summary.status)}</span>
      </div>
      <div class="account-metrics ${compact ? "compact" : ""}">
        <span><small>Saldo actual</small><strong>${money.format(summary.currentBalance)}</strong></span>
        <span><small>Limite credito</small><strong>${money.format(summary.creditLimit)}</strong></span>
        <span><small>Deuda vencida</small><strong>${money.format(summary.overdueDebt)}</strong></span>
        <span><small>Deuda total</small><strong>${money.format(summary.totalDebt)}</strong></span>
        ${compact ? "" : `<span><small>Ultimo pago</small><strong>${escapeHtml(formatLastPayment(summary.lastPayment))}</strong></span>`}
        ${summary.newOrderAmount > 0 ? `<span><small>Con pedido nuevo</small><strong>${money.format(summary.projectedBalance)}</strong></span>` : ""}
      </div>
      <p class="account-warning ${summary.requiresAuthorization ? "danger" : tone}">${escapeHtml(summary.warning)}</p>
    </div>
  `;
}

function estimateOrderAmount(order) {
  try {
    return OrderEngine.quoteOrder(state, order).amount;
  } catch {
    return Math.max(0, numeric(order && order.amount, 0));
  }
}

function renderOrderAccountPreview() {
  const container = byId("orderClientAccountInfo");
  const form = byId("orderForm");
  if (!container || !form) return;
  const formData = new FormData(form);
  const clientName = String(formData.get("client") || "").trim();
  if (!clientName) {
    container.innerHTML = "";
    return;
  }
  const client = state.clients.find((item) => normalizeSearchText(item.name) === normalizeSearchText(clientName));
  if (!client) {
    container.innerHTML = '<p class="account-warning danger">Cliente no encontrado en el padron.</p>';
    return;
  }
  const amount = estimateOrderAmount({
    client: client.name,
    products: formData.get("products"),
    amount: formData.get("amount")
  });
  container.innerHTML = accountSummaryHtml(clientAccountSummary(client.name, amount), "compact");
}

function authorizeCreditIfNeeded(clientName, orderAmount) {
  const credit = clientAccountSummary(clientName, orderAmount);
  if (!credit.ok || !credit.requiresAuthorization) {
    return { creditOverride: false, credit };
  }
  if (!canAuthorizeCredit()) {
    throw new Error(`Cuenta corriente requiere autorizacion administrativa. ${credit.warning}`);
  }
  const accepted = window.confirm([
    "La cuenta corriente requiere autorizacion.",
    credit.warning,
    `Saldo actual: ${money.format(credit.currentBalance)}`,
    `Deuda total: ${money.format(credit.totalDebt)}`,
    `Pedido nuevo: ${money.format(orderAmount)}`,
    `Proyectado: ${money.format(credit.projectedBalance)}`,
    "Continuar bajo responsabilidad administrativa?"
  ].join("\n"));
  if (!accepted) {
    const error = new Error("Pedido cancelado: no se autorizo el limite de cuenta corriente.");
    error.cancelled = true;
    throw error;
  }
  return { creditOverride: true, credit };
}

function normalizeClientRecord(client) {
  const name = String(client.nombre_comercial || client.name || "").trim();
  const zone = String(client.zona || client.zone || "Sin zona").trim() || "Sin zona";
  const seller = String(client.vendedor_asignado || client.seller || "").trim();
  const status = String(client.estado || client.status || "Activo").trim() || "Activo";
  const balance = Math.max(0, numeric(client.saldo_inicial ?? client.balance, 0));
  const limit = Math.max(0, numeric(client.limite_credito ?? client.limit, 0));
  const latitude = numeric(client.latitud ?? client.latitude ?? client.lat, NaN);
  const longitude = numeric(client.longitud ?? client.longitude ?? client.lng, NaN);
  return {
    ...client,
    codigo_cliente: String(client.codigo_cliente || client.code || "").trim(),
    name,
    nombre_comercial: name,
    razon_social: String(client.razon_social || name).trim(),
    cuit: String(client.cuit || "").trim(),
    condicion_fiscal: String(client.condicion_fiscal || "Cons.Final").trim(),
    domicilio: String(client.domicilio || client.address || "").trim(),
    localidad: String(client.localidad || "").trim(),
    telefono: String(client.telefono || client.phone || "").trim(),
    email: String(client.email || client.mail || "").trim(),
    forma_pago: String(client.forma_pago || (limit > 0 ? "Cuenta corriente" : "Contado")).trim(),
    condicion_comercial: String(client.condicion_comercial || client.commercialCondition || client.forma_pago || "").trim(),
    dias_credito: Math.max(0, numeric(client.dias_credito, 0)),
    limite_credito: limit,
    limit,
    saldo_inicial: balance,
    balance,
    tipo_cliente: String(client.tipo_cliente || client.channel || "OTROS").trim(),
    zona: zone,
    zone,
    ruta: String(client.ruta || zone).trim(),
    vendedor_asignado: seller,
    seller,
    dia_visita: String(client.dia_visita || "").trim(),
    frecuencia_visita: String(client.frecuencia_visita || "").trim(),
    estado: status,
    status,
    observaciones: String(client.observaciones || "").trim(),
    horario_atencion: String(client.horario_atencion || client.horario || "").trim(),
    latitud: Number.isFinite(latitude) ? latitude : null,
    longitud: Number.isFinite(longitude) ? longitude : null,
    origen: String(client.origen || "manual").trim(),
    last: String(client.last || client.dia_visita || "Sin visita").trim()
  };
}

function normalizeProductRecord(product) {
  const name = String(product.descripcion || product.name || "").trim();
  const stock = Math.max(0, numeric(product.stock_fisico ?? product.stock_actual ?? product.stock, 0));
  const reserved = Math.min(stock, Math.max(0, numeric(product.stock_reservado, 0)));
  const inTransit = Math.max(0, numeric(product.stock_en_transito, 0));
  const min = Math.max(0, numeric(product.stock_minimo ?? product.min, 0));
  const cost = Math.max(0, numeric(product.costo ?? product.cost, 0));
  const price1 = Math.max(0, numeric(product.precio_lista_1, 0));
  const price2 = Math.max(0, numeric(product.precio_lista_2 ?? product.price, 0));
  const price = price2 || price1 || Math.max(0, numeric(product.price, 0));
  return {
    ...product,
    codigo_producto: String(product.codigo_producto || product.code || "").trim(),
    codigo_barras: String(product.codigo_barras || "").trim(),
    name,
    descripcion: name,
    rubro: String(product.rubro || "S/D").trim() || "S/D",
    marca: String(product.marca || "S/D").trim() || "S/D",
    familia: String(product.familia || "S/D").trim() || "S/D",
    segmento: String(product.segmento || "S/D").trim() || "S/D",
    stock_actual: stock,
    stock,
    stock_fisico: stock,
    stock_reservado: reserved,
    stock_disponible: Math.max(0, stock - reserved),
    stock_en_transito: inTransit,
    stock_minimo: min,
    min,
    bultos: String(product.bultos || "").trim(),
    costo: cost,
    cost,
    precio_lista_1: price1,
    precio_lista_2: price2 || price,
    precio_lista_3: Math.max(0, numeric(product.precio_lista_3, 0)),
    precio_lista_4: Math.max(0, numeric(product.precio_lista_4, 0)),
    precio_lista_5: Math.max(0, numeric(product.precio_lista_5, 0)),
    price,
    priceListId: String(product.priceListId || product.lista_precio_id || "").trim(),
    priceListName: String(product.priceListName || product.lista_precio_actual || "Lista vigente").trim() || "Lista vigente",
    priceUpdatedAt: String(product.priceUpdatedAt || "").trim(),
    priceUpdatedBy: String(product.priceUpdatedBy || "").trim(),
    iva: Math.max(0, numeric(product.iva, 0)),
    bonificacion: String(product.bonificacion || "").trim(),
    activo: String(product.activo || "SI").trim(),
    origen: String(product.origen || "manual").trim()
  };
}

function priceProductKey(product) {
  return String(product && (product.codigo_producto || product.codigo_barras || product.name || product.descripcion) || "").trim();
}

function currentProductPrice(product) {
  return Math.max(0, numeric(product && (product.price ?? product.precio_lista_2 ?? product.precio_lista_1), 0));
}

function priceListIdForNumber(number) {
  return `PL-L${Math.min(5, Math.max(1, Math.round(numeric(number, 2))))}`;
}

function priceListNameForNumber(number) {
  return `Lista Nº ${Math.min(5, Math.max(1, Math.round(numeric(number, 2))))}`;
}

function priceListNumberFromValue(value) {
  const match = String(value || "").match(/(?:PL-L|lista\s*(?:n|nº|#)?\s*|precio_lista_)([1-5])/i);
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

function priceMarginFromCost(price, cost) {
  const base = Math.max(0, numeric(cost, 0));
  const amount = Math.max(0, numeric(price, 0));
  if (base <= 0) return 0;
  return ((amount / base) - 1) * 100;
}

function priceFromMargin(cost, pct) {
  const base = Math.max(0, numeric(cost, 0));
  const margin = Math.max(0, numeric(pct, 0));
  return base * (1 + margin / 100);
}

function formatDecimalInput(value) {
  const number = Math.max(0, numeric(value, 0));
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function syncPriceListEditor(form, sourceName = "") {
  if (!form) return;
  const cost = Math.max(0, numeric(form.elements.costo && form.elements.costo.value, 0));
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const priceInput = form.elements[`precio_lista_${number}`];
    const pctInput = form.elements[`precio_lista_${number}_pct`];
    if (!priceInput || !pctInput) return;
    if (sourceName === `precio_lista_${number}_pct`) {
      priceInput.value = formatDecimalInput(priceFromMargin(cost, pctInput.value));
    } else if (sourceName === `precio_lista_${number}`) {
      pctInput.value = formatDecimalInput(priceMarginFromCost(priceInput.value, cost));
    } else if (sourceName === "costo") {
      priceInput.value = formatDecimalInput(priceFromMargin(cost, pctInput.value));
    } else {
      pctInput.value = formatDecimalInput(priceMarginFromCost(priceInput.value, cost));
    }
  });
}

function hydratePriceListEditor(form, product = {}) {
  if (!form) return;
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const priceInput = form.elements[`precio_lista_${number}`];
    if (priceInput) priceInput.value = formatDecimalInput(productPriceForListNumber(product, number));
  });
  syncPriceListEditor(form);
}

function priceListAuditEntries(previous, next, motive = "") {
  const entries = [];
  const at = new Date().toISOString();
  const user = currentUser && (currentUser.name || currentUser.username) || "Administracion";
  const previousCost = numeric(previous && previous.cost, numeric(previous && previous.costo, 0));
  const nextCost = numeric(next && next.cost, numeric(next && next.costo, 0));
  if (previousCost !== nextCost) {
    entries.push({
      at,
      user,
      productCode: next.codigo_producto || previous.codigo_producto || "",
      product: next.name || previous.name || "",
      list: "Costo",
      previousCost,
      newCost: nextCost,
      previousValue: previousCost,
      newValue: nextCost,
      motive
    });
  }
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const prevPrice = productPriceForListNumber(previous, number);
    const nextPrice = productPriceForListNumber(next, number);
    const prevPct = priceMarginFromCost(prevPrice, previousCost);
    const nextPct = priceMarginFromCost(nextPrice, nextCost);
    if (prevPrice !== nextPrice || Math.round(prevPct * 100) !== Math.round(nextPct * 100)) {
      entries.push({
        at,
        user,
        productCode: next.codigo_producto || previous.codigo_producto || "",
        product: next.name || previous.name || "",
        list: `Lista ${number}`,
        previousCost,
        newCost: nextCost,
        previousPct: prevPct,
        newPct: nextPct,
        previousPrice: prevPrice,
        newPrice: nextPrice,
        motive
      });
    }
  });
  return entries;
}

function normalizePriceListAssignmentRecord(assignment) {
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

function normalizePriceListAssignmentsState(assignments) {
  const rows = Array.isArray(assignments)
    ? assignments.map(normalizePriceListAssignmentRecord).filter((item) => item.username || item.sellerName)
    : [];
  if (!rows.some((item) => item.username === "kevin" || normalizeSearchText(item.sellerName) === normalizeSearchText("Kevin Guibert"))) {
    rows.push(normalizePriceListAssignmentRecord({
      username: "kevin",
      sellerName: "Kevin Guibert",
      priceListId: "PL-L4",
      priceListName: "Lista Nº 4",
      listNumber: 4,
      locked: true,
      updatedBy: "Sistema"
    }));
  }
  return rows;
}

function roundPriceValue(value, rounding) {
  const amount = Math.max(0, numeric(value, 0));
  const step = Math.max(0, numeric(rounding, 0));
  if (!step || step <= 1) return Math.round(amount);
  return Math.ceil(amount / step) * step;
}

function normalizePriceListStatus(value) {
  const text = normalizeSearchText(value || "");
  if (text.includes("program")) return "Programada";
  if (text.includes("inactiv")) return "Inactiva";
  if (text.includes("histor")) return "Historica";
  if (text.includes("borr")) return "Borrador";
  if (text.includes("act")) return "Activa";
  return "Borrador";
}

function validIsoOrNow(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function priceListItemFromProduct(product, overrides = {}) {
  const listNumber = Math.min(5, Math.max(1, Math.round(numeric(overrides.listNumber, 2))));
  const previousPrice = Math.max(0, numeric(overrides.previousPrice ?? productPriceForListNumber(product, listNumber), 0));
  const price = Math.max(0, numeric(overrides.price ?? overrides.newPrice ?? previousPrice, previousPrice));
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

function defaultPriceListItems(products, listNumber = 2) {
  return (Array.isArray(products) ? products : []).map((product) => priceListItemFromProduct(product, { listNumber }));
}

function normalizePriceListRecord(list, products, index = 0) {
  const number = priceListNumberFromRecord(list) || 2;
  const items = Array.isArray(list && list.items) ? list.items : defaultPriceListItems(products, number);
  return {
    id: String(list && list.id || `PL-${index + 1}`),
    name: String(list && (list.name || list.nombre) || "Lista de precios").trim() || "Lista de precios",
    status: normalizePriceListStatus(list && (list.status || list.estado) || (index === 0 ? "Activa" : "Borrador")),
    effectiveAt: validIsoOrNow(list && (list.effectiveAt || list.vigencia || list.fecha_vigencia)),
    isDefault: Boolean(list && (list.isDefault || list.default || index === 0)),
    productCount: numeric(list && list.productCount, items.length),
    updatedAt: String(list && list.updatedAt || ""),
    updatedBy: String(list && list.updatedBy || "Sistema"),
    rounding: Math.max(0, numeric(list && (list.rounding ?? list.redondeo), 1)),
    operation: String(list && (list.operation || list.operacion) || "base"),
    motive: String(list && (list.motive || list.motivo) || ""),
    filters: list && list.filters && typeof list.filters === "object" ? list.filters : {},
    number,
    items
  };
}

function normalizePriceListsState(priceLists, products) {
  const source = Array.isArray(priceLists) && priceLists.length
    ? priceLists
    : [{
      id: "PL-BASE",
      name: "Lista vigente",
      status: "Activa",
      effectiveAt: "2026-01-01T00:00:00.000Z",
      isDefault: true,
      productCount: Array.isArray(products) ? products.length : 0,
      updatedAt: "",
      updatedBy: "Sistema",
      rounding: 1,
      operation: "base",
      number: 2,
      items: defaultPriceListItems(products, 2)
    }];
  const lists = source.map((list, index) => normalizePriceListRecord(list, products, index));
  SYSTEM_PRICE_LISTS.forEach((number) => {
    const id = priceListIdForNumber(number);
    const current = lists.find((list) => list.id === id || priceListNumberFromRecord(list) === number);
    const generated = {
      id,
      name: priceListNameForNumber(number),
      status: "Activa",
      effectiveAt: "2026-01-01T00:00:00.000Z",
      isDefault: number === 2,
      productCount: Array.isArray(products) ? products.length : 0,
      updatedAt: current && current.updatedAt || "",
      updatedBy: current && current.updatedBy || "Sistema",
      rounding: current && current.rounding || 1,
      operation: "columna_producto",
      motive: current && current.motive || "",
      filters: current && current.filters || {},
      number,
      generatedFromColumns: true,
      items: defaultPriceListItems(products, number)
    };
    if (current) Object.assign(current, { ...generated, status: current.status || generated.status });
    else lists.push(generated);
  });
  lists.forEach((list) => {
    list.isDefault = list.id === "PL-L2";
    if (list.id === "PL-L2") list.status = "Activa";
  });
  if (!lists.some((list) => list.isDefault && list.status === "Activa") && lists[0]) {
    lists[0].isDefault = true;
    if (lists[0].status === "Borrador") lists[0].status = "Activa";
  }
  return lists;
}

function activePriceList() {
  return (state.priceLists || []).find((list) => list.isDefault && list.status === "Activa")
    || (state.priceLists || []).find((list) => list.status === "Activa")
    || (state.priceLists || [])[0]
    || null;
}

function assignedPriceListForUser(user = currentUser) {
  const username = String(user && user.username || "").trim().toLowerCase();
  const sellerName = String(user && (user.sellerName || user.name) || mobileSeller || "").trim();
  const assignment = (state.priceListAssignments || []).find((item) => item.active !== false && (
    (username && item.username === username)
    || (sellerName && normalizeSearchText(item.sellerName) === normalizeSearchText(sellerName))
  ));
  const userNumber = priceListNumberFromValue(user && (user.defaultPriceListId || user.priceListId || user.defaultPriceListName || user.priceListName));
  const number = Math.min(5, Math.max(1, Math.round(numeric(
    assignment && assignment.listNumber,
    userNumber || priceListNumberFromValue(assignment && assignment.priceListId) || 2
  ))));
  const list = (state.priceLists || []).find((item) => item.id === (assignment && assignment.priceListId))
    || (state.priceLists || []).find((item) => priceListNumberFromRecord(item) === number)
    || activePriceList();
  return {
    id: list && list.id || assignment && assignment.priceListId || priceListIdForNumber(number),
    name: list && list.name || assignment && assignment.priceListName || priceListNameForNumber(number),
    number,
    locked: assignment ? assignment.locked !== false : Boolean(user && user.priceListLocked)
  };
}

function productPriceForUser(product, user = currentUser) {
  const assignment = assignedPriceListForUser(user);
  return productPriceForListNumber(product, assignment.number);
}

function productWithUserPrice(product, user = currentUser) {
  const assignment = assignedPriceListForUser(user);
  const price = productPriceForListNumber(product, assignment.number);
  return {
    ...product,
    price,
    priceListId: assignment.id,
    priceListName: assignment.name
  };
}

function currentUserPriceListLabel() {
  const assignment = assignedPriceListForUser(currentUser);
  return `${assignment.name}${assignment.locked ? " bloqueada" : ""}`;
}

function priceListProductMatches(product, input = {}) {
  const operation = String(input.operation || "general").toLowerCase();
  const productKey = normalizeSearchText(input.productKey || input.productCode || input.product || "");
  if (operation === "individual") {
    if (!productKey) return false;
    return [product.codigo_producto, product.codigo_barras, product.name, product.descripcion]
      .some((value) => normalizeSearchText(value) === productKey || normalizeSearchText(value).includes(productKey));
  }
  if (operation === "rubro") return normalizeSearchText(product.rubro) === normalizeSearchText(input.rubro);
  if (operation === "marca") return normalizeSearchText(product.marca) === normalizeSearchText(input.marca);
  if (operation === "proveedor") return normalizeSearchText(product.proveedor || product.supplier) === normalizeSearchText(input.proveedor || input.supplier);
  return true;
}

function simulatePriceListChangeLocal(input = {}) {
  const operation = String(input.operation || "general").toLowerCase();
  const rounding = Math.max(0, numeric(input.rounding, 1));
  const increasePct = numeric(input.increasePct, 0);
  const marginPct = numeric(input.marginPct, 0);
  const fixedPrice = numeric(input.fixedPrice, NaN);
  const items = state.products
    .filter((product) => priceListProductMatches(product, { ...input, operation }))
    .map((product) => {
      const previousPrice = currentProductPrice(product);
      const cost = Math.max(0, numeric(product.costo ?? product.cost, 0));
      let price = previousPrice;
      if (Number.isFinite(fixedPrice) && fixedPrice > 0) price = fixedPrice;
      else if (marginPct > 0 && cost > 0) price = cost * (1 + marginPct / 100);
      else price = previousPrice * (1 + increasePct / 100);
      price = roundPriceValue(price, rounding);
      return priceListItemFromProduct(product, {
        previousPrice,
        price,
        increasePct,
        marginPct,
        percentApplied: previousPrice > 0 ? ((price - previousPrice) / previousPrice) * 100 : 0
      });
    });
  const totals = items.reduce((acc, item) => {
    acc.previous += item.previousPrice;
    acc.next += item.price;
    acc.difference += item.difference;
    return acc;
  }, { previous: 0, next: 0, difference: 0 });
  return { operation, affected: items.length, items, sample: items.slice(0, 120), totals, rounding, increasePct, marginPct };
}

function applyDuePriceListsLocal(nextState) {
  const lists = Array.isArray(nextState.priceLists) ? nextState.priceLists : [];
  const due = lists
    .filter((list) => list.status === "Programada" && new Date(list.effectiveAt).getTime() <= Date.now())
    .sort((a, b) => new Date(a.effectiveAt) - new Date(b.effectiveAt));
  due.forEach((list) => {
    const byKey = new Map((list.items || []).map((item) => [normalizeSearchText(item.productCode || item.productName || item.codigo_barras), item]));
    nextState.products = nextState.products.map((product) => {
      const item = [
        product.codigo_producto,
        product.codigo_barras,
        product.name,
        product.descripcion
      ].map((key) => byKey.get(normalizeSearchText(key))).find(Boolean);
      if (!item) return product;
      const price = Math.max(0, numeric(item.price ?? item.newPrice, currentProductPrice(product)));
      return normalizeProductRecord({
        ...product,
        price,
        precio_lista_2: price,
        priceListId: list.id,
        priceListName: list.name,
        priceUpdatedAt: new Date().toISOString(),
        priceUpdatedBy: "Sistema"
      });
    });
    lists.forEach((item) => {
      if (item.id !== list.id && item.isDefault && item.status === "Activa") {
        item.isDefault = false;
        item.status = "Historica";
      }
    });
    list.status = "Activa";
    list.isDefault = true;
  });
}

function normalizeSupplierRecord(supplier) {
  const name = String(supplier.razon_social || supplier.name || supplier.nombre || "").trim();
  const balance = Math.max(0, numeric(supplier.balance ?? supplier.saldo_pendiente, 0));
  const paid = Math.max(0, numeric(supplier.totalPaid ?? supplier.total_pagado, 0));
  const purchased = Math.max(balance + paid, numeric(supplier.totalPurchased ?? supplier.total_comprado, balance + paid));
  return {
    ...supplier,
    name,
    razon_social: name,
    cuit: String(supplier.cuit || "").trim(),
    direccion: String(supplier.direccion || supplier.address || "").trim(),
    telefono: String(supplier.telefono || supplier.phone || "").trim(),
    email: String(supplier.email || supplier.contact || "").trim(),
    contact: String(supplier.contact || supplier.contacto_principal || supplier.email || supplier.telefono || "").trim(),
    contacto_principal: String(supplier.contacto_principal || supplier.contact || "").trim(),
    condicion_pago: String(supplier.condicion_pago || supplier.paymentCondition || "Cuenta corriente").trim(),
    observaciones: String(supplier.observaciones || "").trim(),
    sector: String(supplier.sector || supplier.rubro || "Sin rubro").trim(),
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

function normalizeOrderRecord(order) {
  const createdAt = validIsoDate(order.createdAt || order.receivedAt || order.dateIso) || new Date().toISOString();
  const status = String(order.status || ORDER_STATUS.PENDING).trim() || ORDER_STATUS.PENDING;
  const source = String(order.source || (order.origin === "preventa" ? "mobile" : "dashboard")).trim();
  const normalized = {
    ...order,
    code: String(order.code || `PED-${Date.now()}`).trim(),
    client: String(order.client || "").trim(),
    seller: String(order.seller || "").trim(),
    products: String(order.products || "").trim(),
    amount: numeric(order.amount, 0),
    status,
    priority: String(order.priority || "Normal").trim() || "Normal",
    source,
    origin: String(order.origin || (source === "mobile" ? "preventa" : "dashboard")).trim(),
    createdAt,
    receivedAt: validIsoDate(order.receivedAt) || createdAt,
    updatedAt: validIsoDate(order.updatedAt) || createdAt,
    print: Boolean(order.print)
  };
  normalized.trace = normalizeOrderTrace(order.trace, normalized);
  return normalized;
}

function validIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function localTraceParts(value) {
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

function normalizeOrderTrace(trace, order) {
  const entries = Array.isArray(trace) ? trace : [];
  const normalized = entries
    .map((entry) => {
      const at = validIsoDate(entry.at || entry.createdAt) || order.createdAt;
      const parts = localTraceParts(at);
      return {
        status: String(entry.status || order.status || ORDER_STATUS.PENDING),
        at,
        date: entry.date || parts.date,
        time: entry.time || parts.time,
        actor: String(entry.actor || entry.user || "Sistema"),
        user: String(entry.user || entry.actor || "Sistema"),
        gps: entry.gps || null,
        note: String(entry.note || entry.text || ""),
        action: String(entry.action || entry.event || "")
      };
    })
    .filter((entry) => entry.status);

  if (!normalized.some((entry) => entry.status === ORDER_STATUS.PENDING)) {
    normalized.unshift({
      status: ORDER_STATUS.PENDING,
      at: order.receivedAt || order.createdAt,
      ...localTraceParts(order.receivedAt || order.createdAt),
      actor: order.seller || "Preventa",
      user: order.seller || "Preventa",
      gps: null,
      note: order.source === "mobile" ? "Ingreso desde celular" : "Ingreso manual"
    });
  }

  if (order.status && !normalized.some((entry) => entry.status === order.status)) {
    normalized.push({
      status: order.status,
      at: order.updatedAt || order.createdAt,
      ...localTraceParts(order.updatedAt || order.createdAt),
      actor: "Sistema",
      user: "Sistema",
      gps: null,
      note: "Estado actual"
    });
  }

  return normalized.sort((a, b) => new Date(a.at) - new Date(b.at));
}

function saveState() {
  persistLocalMeta("saveState");
  if (isDepotUser()) return;
  if (syncReady) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushStateToServer, 120);
  }
}

function notificationReadStorageKey() {
  return `dlNotificationRead:${currentUser && currentUser.username || "anonimo"}`;
}

function loadReadNotificationIds() {
  try {
    const stored = localStorage.getItem(notificationReadStorageKey());
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds() {
  safeLocalStorageSet(notificationReadStorageKey(), JSON.stringify(Array.from(readNotificationIds).slice(0, 500)), 40000);
}

function loadLastOwnLocation() {
  cleanupNonCriticalLocalStorage("gps no persistente");
  return null;
}

function loadDeliveryDevice() {
  try {
    const stored = JSON.parse(localStorage.getItem("dlDeliveryDevice") || "null");
    if (stored && stored.id) return stored;
  } catch {
    localStorage.removeItem("dlDeliveryDevice");
  }
  const id = `DL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const device = { id, label: `Dispositivo ${id.slice(-5)}` };
  safeLocalStorageSet("dlDeliveryDevice", JSON.stringify(device), 12000);
  return device;
}

function detectDeviceOs() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac/i.test(navigator.platform || ua)) return "macOS";
  if (/Win/i.test(navigator.platform || ua)) return "Windows";
  return "Web";
}

function loadSessionDevice() {
  try {
    const stored = JSON.parse(localStorage.getItem("dlSessionDevice") || "null");
    if (stored && stored.id) return stored;
  } catch {
    localStorage.removeItem("dlSessionDevice");
  }
  const id = `DLS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const device = {
    id,
    label: `Equipo ${id.slice(-6)}`,
    model: (navigator.userAgent || "Navegador").slice(0, 90),
    os: detectDeviceOs(),
    appVersion: "v88-web"
  };
  safeLocalStorageSet("dlSessionDevice", JSON.stringify(device), 12000);
  return device;
}

function sessionDevicePayload() {
  return {
    ...sessionDevice,
    model: sessionDevice.model || (navigator.userAgent || "Navegador").slice(0, 90),
    os: sessionDevice.os || detectDeviceOs(),
    appVersion: "v88-web"
  };
}

function saveDeliveryDevice(label) {
  deliveryDevice.label = String(label || deliveryDevice.label).trim() || deliveryDevice.label;
  safeLocalStorageSet("dlDeliveryDevice", JSON.stringify(deliveryDevice), 12000);
}

function saveLastOwnLocation() {
  // GPS queda solo en memoria y se sincroniza al backend. No se persiste en localStorage.
}

function getStateForServer() {
  return structuredClone(state);
}

function applyPresencePayload(payload) {
  if (!payload) return;
  if (payload.session) currentSession = payload.session;
  const config = payload.sessionConfig || payload.settings || payload.presence?.settings;
  if (config) sessionSettings = { ...sessionSettings, ...config };
  if (payload.presence && Array.isArray(payload.presence.sessions)) {
    presenceSessions = uniquePresenceSessions(payload.presence.sessions);
    presenceHistory = Array.isArray(payload.presence.recent) ? payload.presence.recent : presenceHistory;
  } else if (Array.isArray(payload.sessions)) {
    presenceSessions = uniquePresenceSessions(payload.sessions);
    presenceHistory = Array.isArray(payload.recent) ? payload.recent : presenceHistory;
  }
  refreshPresenceViews();
}

function uniquePresenceSessions(sessionsList = []) {
  const byUser = new Map();
  sessionsList.forEach((session) => {
    if (!session || !session.username) return;
    const key = String(session.username).toLowerCase();
    const previous = byUser.get(key);
    if (!previous || new Date(session.lastSeenAt || 0) > new Date(previous.lastSeenAt || 0)) {
      byUser.set(key, session);
    }
  });
  return Array.from(byUser.values()).sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
}

function refreshPresenceViews() {
  if (!currentUser) return;
  if (activeViewId() === "dashboard") renderDashboardPresence();
  if (activeViewId() === "estadisticas") renderRoutes();
  if (activeViewId() === "admin") renderSessionMonitor();
}

function normalizeGpsLocation(location, fallbackAt = "") {
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    accuracy: Math.max(0, Number(location.accuracy || 0)),
    speed: Number.isFinite(Number(location.speed)) ? Number(location.speed) : null,
    heading: Number.isFinite(Number(location.heading)) ? Number(location.heading) : null,
    updatedAt: location.updatedAt ? formatOrderTime(location.updatedAt) : (fallbackAt ? formatOrderTime(fallbackAt) : "Sin hora"),
    source: location.source || "gps",
    provider: location.provider || "",
    mock: Boolean(location.mock),
    serverAt: location.serverAt || location.updatedAt || fallbackAt || "",
    deviceAt: location.deviceAt || location.at || ""
  };
}

function gpsAccuracyWarning(location) {
  if (!location) return "";
  const accuracy = Number(location.accuracy || 0);
  if (accuracy > 100) return `Precision baja ${Math.round(accuracy)} m`;
  if (!accuracy) return "Sin precision informada";
  return "";
}

function gpsTrustLabel(location) {
  if (!location) return "GPS pendiente";
  const warning = gpsAccuracyWarning(location);
  if (warning) return warning;
  return `${locationSourceLabel(location.source)} ${Math.round(Number(location.accuracy || 0))} m`;
}

function applyPresenceToState() {
  const bySeller = new Map();
  presenceSessions.forEach((session) => {
    const sellerName = session.sellerName || (session.role === "seller" ? session.name : "");
    if (!sellerName || !session.location) return;
    bySeller.set(sellerName, session);
  });
  const sellerNames = new Set((state.sellers || []).map((seller) => seller.name));
  bySeller.forEach((session, sellerName) => {
    if (sellerNames.has(sellerName)) return;
    state.sellers.push({
      name: sellerName,
      route: session.user && session.user.route || session.sellerName || "Sin ruta",
      orders: 0,
      sales: 0,
      commission: 0,
      gps: "Disponible",
      progress: 0,
      location: null,
      dynamicPresence: true
    });
    sellerNames.add(sellerName);
  });
  state.sellers = (state.sellers || []).map((seller) => {
    const session = bySeller.get(seller.name);
    if (!session) {
      return { ...seller, gps: "Sin conexiÃ³n", location: null, presence: null };
    }
    const location = normalizeGpsLocation(session.location, session.lastGpsAt || session.lastSeenAt);
    return {
      ...seller,
      gps: gpsAccuracyWarning(location) || session.status || "Disponible",
      location,
      presence: session
    };
  });
}

function applyServerStatePayload(payload) {
  if (!payload || !payload.state) return;
  applyPresencePayload(payload);
  const nextState = normalizeState(payload.state);
  trackIncomingNotifications(nextState);
  state = nextState;
  applyPresenceToState();
  syncVersion = payload.version || syncVersion;
  syncReady = true;
  persistLocalMeta("server-payload");
  scheduleRenderForCurrentUser();
}

async function postOperationalAction(path, body) {
  const response = await fetchWithTimeout(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body || {})
  }, 12000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "No se pudo completar la operacion.");
    error.payload = payload;
    throw error;
  }
  applyServerStatePayload(payload);
  cleanupOperationalLocalData(`operacion ${path}`);
  return payload;
}

function currentPresenceStatus() {
  if (!currentUser) return "Sin conexiÃ³n";
  if (currentUser.role === "driver") return "En Reparto";
  if (currentUser.role === "depot") return "En Deposito";
  return "Disponible";
}

async function postPresence(path, body) {
  if (authMode !== "required" || !currentUser) return null;
  try {
    const response = await fetchWithTimeout(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        device: sessionDevicePayload(),
        status: currentPresenceStatus(),
        ...(body || {})
      })
    }, 8000);
    if (response.status === 401) {
      stopRealtimeChannels();
      currentUser = null;
      showLogin("Sesion cerrada o reemplazada por otro dispositivo.");
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      applyPresencePayload(payload);
      renderSessionMonitor();
      return payload;
    }
  } catch {
    // La presencia se reintenta en el proximo heartbeat o GPS.
  }
  return null;
}

function distanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const rad = (degree) => degree * Math.PI / 180;
  const dLat = rad(Number(b.lat) - Number(a.lat));
  const dLng = rad(Number(b.lng) - Number(a.lng));
  const lat1 = rad(Number(a.lat));
  const lat2 = rad(Number(b.lat));
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function shouldSendPresenceLocation(location, force = false) {
  if (force || !lastPresenceLocationSent) return true;
  const minDistance = Number(sessionSettings.locationUpdateMinDistanceMeters || 5);
  const moved = distanceMeters(lastPresenceLocationSent, location);
  const elapsed = Date.now() - new Date(lastPresenceLocationSent.sentAt || 0).getTime();
  return moved >= minDistance || elapsed > Number(sessionSettings.locationStationaryIntervalMs || 10000);
}

async function sendPresenceHeartbeat() {
  return postPresence("api/presence/heartbeat", {});
}

function gpsClientRejectReason(location) {
  if (!location) return "GPS sin datos.";
  const source = normalizeSearchText(location.source || "");
  if (location.mock === true || location.isMock === true || location.mocked === true) return "Ubicacion no confiable o simulada.";
  if (["demo", "simulada", "simulado", "mock", "fake", "server", "servidor", "ip", "geoip"].includes(source)) return "Fuente GPS no permitida.";
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return "Coordenadas GPS invalidas.";
  return "";
}

function showGpsWarning(message) {
  if (currentUser && currentUser.role === "driver") {
    setDeliveryGpsBadge(message || "GPS rechazado", "danger");
    return;
  }
  const status = byId("locationStatus");
  if (status) status.textContent = message || "GPS rechazado.";
  setGpsBadge("Revisar", "danger");
}

function trustedGpsForLogin(location) {
  return gpsClientRejectReason(location) ? null : location;
}

function makeLocationPayload(lat, lng, accuracy, source, extra = {}) {
  return {
    lat: Number(lat),
    lng: Number(lng),
    accuracy: Math.round(Number(accuracy || 0)),
    speed: Number.isFinite(Number(extra.speed)) ? Number(extra.speed) : null,
    heading: Number.isFinite(Number(extra.heading ?? extra.bearing ?? extra.orientation)) ? Number(extra.heading ?? extra.bearing ?? extra.orientation) : null,
    source: source || "gps",
    provider: extra.provider || "",
    mock: Boolean(extra.mock),
    battery: Number.isFinite(Number(extra.battery ?? extra.batteryPct)) ? Math.max(0, Math.min(100, Math.round(Number(extra.battery ?? extra.batteryPct)))) : null,
    online: extra.online === false ? false : navigator.onLine !== false,
    deviceAt: extra.deviceAt || extra.at || new Date().toISOString(),
    at: new Date().toISOString()
  };
}

async function captureLoginLocation() {
  if (trustedGpsForLogin(pendingLoginLocation)) return pendingLoginLocation;
  if (window.AndroidLocation && typeof window.AndroidLocation.start === "function") {
    return new Promise((resolve) => {
      let done = false;
      pendingLoginLocationResolver = (location) => {
        if (done) return;
        done = true;
        pendingLoginLocationResolver = null;
        resolve(trustedGpsForLogin(location));
      };
      window.AndroidLocation.start("LOGIN");
      window.setTimeout(() => {
        if (done) return;
        done = true;
        pendingLoginLocationResolver = null;
        resolve(null);
      }, 3500);
    });
  }
  if (canUseBrowserGeolocation() && "geolocation" in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = makeLocationPayload(position.coords.latitude, position.coords.longitude, position.coords.accuracy, "gps", {
          speed: position.coords.speed,
          heading: position.coords.heading
        });
        pendingLoginLocation = location;
        resolve(trustedGpsForLogin(location));
      }, () => resolve(null), { enableHighAccuracy: true, maximumAge: 5000, timeout: 3500 });
    });
  }
  return null;
}

async function sendPresenceLocation(location, force = false) {
  if (!location || !shouldSendPresenceLocation(location, force)) return null;
  const response = await fetchWithTimeout(apiUrl("api/presence/location"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      device: sessionDevicePayload(),
      status: currentPresenceStatus(),
      gps: {
        ...location,
        deviceAt: location.deviceAt || location.at || new Date().toISOString()
      }
    })
  }, 8000).catch(() => null);
  if (!response) return null;
  if (response.status === 401) {
    stopRealtimeChannels();
    currentUser = null;
    showLogin("Sesion cerrada o reemplazada por otro dispositivo.");
    return null;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload.code === "GPS_REJECTED") {
      lastPresenceLocationSent = { ...location, sentAt: new Date().toISOString() };
      showGpsWarning(payload.error || "Ubicacion no confiable o simulada.");
      renderNotificationCenter();
    }
    return payload;
  }
  lastPresenceLocationSent = { ...location, sentAt: new Date().toISOString() };
  applyPresencePayload(payload);
  renderSessionMonitor();
  return payload;
}

function startPresenceHeartbeat() {
  if (presenceHeartbeatIntervalId) clearInterval(presenceHeartbeatIntervalId);
  sendPresenceHeartbeat();
  presenceHeartbeatIntervalId = setInterval(() => {
    sendPresenceHeartbeat();
  }, Number(sessionSettings.heartbeatIntervalMs || 10000));
}

function currentRoleLocation() {
  if (!currentUser) return null;
  if (currentUser.role === "driver") return deliveryLocation;
  if (currentUser.role === "seller") return lastOwnLocation && lastOwnLocation.location ? lastOwnLocation.location : null;
  return null;
}

function currentLocationPushInterval(location) {
  const speed = Number(location && location.speed);
  const moving = Number.isFinite(speed) && speed > 0.8;
  return moving
    ? Number(sessionSettings.locationMovingIntervalMs || 10000)
    : Number(sessionSettings.locationStationaryIntervalMs || 10000);
}

function nativeGpsContextLabel(reason = "") {
  if (!currentUser) return reason || "GPS";
  if (currentUser.role === "driver") {
    return `REPARTO:${deliveryDevice.id}:${reason || "tracking"}`;
  }
  if (currentUser.role === "seller") {
    return `VENTA:${mobileSeller || currentUser.name || currentUser.username}:${reason || "tracking"}`;
  }
  return reason || "GPS";
}

function requestNativeContinuousLocation(reason = "tracking") {
  try {
    if (
      window.AndroidLocation
        && typeof window.AndroidLocation.startContinuous === "function"
        && currentUser
        && ["seller", "driver"].includes(currentUser.role)
    ) {
      window.AndroidLocation.startContinuous(nativeGpsContextLabel(reason));
      return true;
    }
  } catch {
    // El WebView puede no exponer el puente si se abre desde navegador.
  }
  return false;
}

function stopNativeLocationTracking() {
  try {
    if (window.AndroidLocation && typeof window.AndroidLocation.stop === "function") {
      window.AndroidLocation.stop();
    }
  } catch {
    // Android puede no estar disponible fuera de la APK.
  }
}

function pushPresenceLocationTick(force = true) {
  if (!currentUser || !["seller", "driver"].includes(currentUser.role)) return;
  requestNativeContinuousLocation("presence");
  requestActiveRoleGps("presence-service");
  const location = currentRoleLocation();
  if (location) sendPresenceLocation(location, force).catch(() => {});
}

function schedulePresenceLocationTick(delayMs) {
  clearTimeout(presenceLocationIntervalId);
  presenceLocationIntervalId = setTimeout(() => {
    pushPresenceLocationTick(true);
    schedulePresenceLocationTick(currentLocationPushInterval(currentRoleLocation()));
  }, Math.max(5000, Number(delayMs || 10000)));
}

function startPresenceLocationService() {
  clearTimeout(presenceLocationIntervalId);
  if (!currentUser || !["seller", "driver"].includes(currentUser.role)) return;
  pushPresenceLocationTick(true);
  schedulePresenceLocationTick(currentLocationPushInterval(currentRoleLocation()));
}

function byId(id) {
  return document.getElementById(id);
}

function triggerFileInput(inputId) {
  const input = byId(inputId);
  if (!input) return;
  input.value = "";
  const previous = {
    position: input.style.position,
    left: input.style.left,
    top: input.style.top,
    width: input.style.width,
    height: input.style.height,
    opacity: input.style.opacity,
    zIndex: input.style.zIndex,
    pointerEvents: input.style.pointerEvents
  };
  Object.assign(input.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "1px",
    height: "1px",
    opacity: "0.01",
    zIndex: "99999",
    pointerEvents: "auto"
  });
  try {
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  } catch {
    input.click();
  } finally {
    window.setTimeout(() => Object.assign(input.style, previous), 300);
  }
}

function debounce(fn, wait = 180) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

function setSyncStatus(text, tone) {
  const status = byId("syncStatus");
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone || "ok";
}

function setLoginMessage(text, tone = "danger") {
  const message = byId("loginMessage");
  if (!message) return;
  message.textContent = text || "";
  if (text) {
    message.dataset.tone = tone;
  } else {
    delete message.dataset.tone;
  }
}

function setRecoveryMessage(text, tone = "danger") {
  const message = byId("passwordRecoveryMessage");
  if (!message) return;
  message.textContent = text || "";
  if (text) {
    message.dataset.tone = tone;
  } else {
    delete message.dataset.tone;
  }
}

function setLoginBusy(isBusy) {
  const button = byId("loginSubmitBtn");
  if (!button) return;
  button.disabled = Boolean(isBusy);
  button.textContent = isBusy ? "Conectando..." : "Ingresar";
}

function toggleLoginPasswordVisibility() {
  const input = byId("loginPassword");
  const button = byId("toggleLoginPasswordBtn");
  if (!input || !button) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.setAttribute("aria-label", show ? "Ocultar clave" : "Mostrar clave");
  button.title = show ? "Ocultar clave" : "Mostrar clave";
}

function setRecoveryBusy(isBusy) {
  const button = byId("passwordRecoverySubmitBtn");
  if (!button) return;
  button.disabled = Boolean(isBusy);
  button.textContent = isBusy ? "Registrando..." : "Solicitar recupero";
}

function showLogin(text, tone = "info") {
  byId("loginScreen").hidden = false;
  byId("appShell").hidden = true;
  setLoginMessage(text || "", tone);
}

function resetLoginConnectionStatus() {
  loginConnectionStartedAt = 0;
}

function getLoginConnectionStatus() {
  if (!loginConnectionStartedAt) loginConnectionStartedAt = Date.now();
  const elapsed = Date.now() - loginConnectionStartedAt;
  if (elapsed < LOGIN_CONNECTION_GRACE_MS) {
    return {
      text: "Conectando con servidor local 8790. Si esta iniciando, el sistema reintenta automaticamente...",
      tone: "info"
    };
  }
  return {
    text: loginConnectionMessage(),
    tone: "danger"
  };
}

function setLoginConnectionStatus() {
  const status = getLoginConnectionStatus();
  setLoginMessage(status.text, status.tone);
}

function showLoginConnectionStatus() {
  const status = getLoginConnectionStatus();
  showLogin(status.text, status.tone);
}

function showApp() {
  if (sessionRetryTimer) {
    clearTimeout(sessionRetryTimer);
    sessionRetryTimer = null;
  }
  viewHistoryStack = [];
  resetLoginConnectionStatus();
  byId("loginScreen").hidden = true;
  byId("appShell").hidden = false;
  const name = byId("sessionUserName");
  const role = byId("sessionUserRole");
  if (name) name.textContent = currentUser ? currentUser.name : "Modo demo";
  if (role) role.textContent = currentUser ? roleLabel(currentUser.role) : "Demo";
  const mobileName = byId("mobileSessionName");
  const mobileRole = byId("mobileSessionRole");
  if (mobileName) mobileName.textContent = currentUser ? currentUser.name : "Modo demo";
  if (mobileRole) mobileRole.textContent = currentUser ? roleLabel(currentUser.role) : "Demo";
  renderInstitutionalFooter();
  updateBackButtons();
}

function developerMarkHtml(size = "small") {
  return `
    <span class="developer-mark ${escapeHtml(size)}" aria-label="${escapeHtml(DEVELOPER_BRAND.name)}">
      <b>${escapeHtml(DEVELOPER_BRAND.shortName)}</b>
    </span>
  `;
}

function licenseStatusText() {
  const security = securityLicenseStatus || {};
  const license = security.license || {};
  if (license.ok || security.ok) return "Licencia activa";
  return "Licencia pendiente de verificacion";
}

function institutionalFooterText() {
  return `Sistema de Gestion Distribuidora Lopez. Version del sistema: ${APP_VERSION}. ${licenseStatusText()}.`;
}

function renderInstitutionalFooter() {
  const version = byId("appFooterVersion");
  const license = byId("appFooterLicense");
  if (version) version.textContent = `Version del sistema: ${APP_VERSION}`;
  if (license) license.textContent = licenseStatusText();
}

function roleLabel(role) {
  if (role === "seller") return "Vendedor";
  if (role === "admin") return "Administracion";
  if (role === "driver") return "Dispositivo de reparto";
  if (role === "receiver") return "Recepcion";
  if (role === "depot") return "Encargado de Deposito";
  return role || "Demo";
}

function isAdminUser() {
  return Boolean(currentUser && currentUser.role === "admin");
}

function isReceiverUser() {
  return Boolean(currentUser && currentUser.role === "receiver");
}

function isDepotUser() {
  return Boolean(currentUser && currentUser.role === "depot");
}

function canOperateAssembly() {
  return isAdminUser() || isDepotUser();
}

function canReceiveSupplierRemits() {
  return isAdminUser() || isReceiverUser();
}

function updateAdminOnlyVisibility() {
  document.querySelectorAll(".admin-only").forEach((item) => {
    item.hidden = !isAdminUser();
  });
  document.querySelectorAll(".admin-receiver-only").forEach((item) => {
    item.hidden = !canReceiveSupplierRemits();
  });
  document.querySelectorAll(".receiver-only").forEach((item) => {
    item.hidden = !isReceiverUser();
  });
  document.querySelectorAll(".supplier-admin-view").forEach((item) => {
    item.hidden = isReceiverUser();
  });
}

function scheduleSessionRetry() {
  if (sessionRetryTimer) clearTimeout(sessionRetryTimer);
  sessionRetryTimer = setTimeout(() => {
    sessionRetryTimer = null;
    checkSession({ fromRetry: true });
  }, 4000);
}

function readDemoSession() {
  try {
    const stored = sessionStorage.getItem("dlDemoUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    sessionStorage.removeItem("dlDemoUser");
    return null;
  }
}

function findDemoUser(username, password) {
  if (String(password || "") !== DEMO_PASSWORD) return null;
  const normalized = String(username || "").trim().toLowerCase();
  return demoUsers.find((user) => user.username === normalized) || null;
}

function startDemoLogin(user, form) {
  currentUser = { ...user };
  authMode = "demo-login";
  safeSessionStorageSet("dlDemoUser", JSON.stringify(currentUser));
  if (form) form.reset();
  startAuthenticatedApp();
}

function tryDemoLogin(credentials, form) {
  const user = findDemoUser(credentials.username, credentials.password);
  if (!user) {
    setLoginMessage("Usuario o clave incorrectos.");
    return false;
  }
  const packet = legalPacketFromState();
  if (!hasLocalLegalAcceptance(packet)) {
    pendingLegalLogin = { credentials, form, demoUser: user, demo: true };
    openLegalAcceptanceDialog(packet);
    setLoginMessage("Leer y aceptar los terminos vigentes para ingresar.", "info");
    return true;
  }
  startDemoLogin(user, form);
  return true;
}

function applyCurrentUserRole() {
  const isSeller = currentUser && currentUser.role === "seller";
  const isDriver = currentUser && currentUser.role === "driver";
  const isReceiver = currentUser && currentUser.role === "receiver";
  const isDepot = currentUser && currentUser.role === "depot";
  const commonViews = new Set(["legal", "ayuda", "acerca"]);
  document.querySelectorAll(".nav-item").forEach((item) => {
    const allowed = isSeller
      ? item.dataset.view === "preventa" || commonViews.has(item.dataset.view)
      : isDriver
        ? item.dataset.view === "reparto" || commonViews.has(item.dataset.view)
        : isReceiver
          ? item.dataset.view === "proveedores" || commonViews.has(item.dataset.view)
          : isDepot
            ? item.dataset.view === "armado" || commonViews.has(item.dataset.view)
            : true;
    item.hidden = !allowed;
  });
  updateAdminOnlyVisibility();
  const sellerSelect = byId("sellerSelect");
  if (isSeller && currentUser.sellerName) {
    mobileSeller = currentUser.sellerName;
    renderMobileSeller();
    if (sellerSelect) sellerSelect.disabled = true;
    switchView("preventa");
  } else if (isDriver) {
    if (sellerSelect) sellerSelect.disabled = true;
    switchView("reparto");
  } else if (isReceiver) {
    if (sellerSelect) sellerSelect.disabled = true;
    switchView("proveedores");
  } else if (isDepot) {
    if (sellerSelect) sellerSelect.disabled = true;
    switchView("armado");
  } else {
    if (sellerSelect) sellerSelect.disabled = false;
  }
}

async function waitForServerHealth(attempts = SERVER_HEALTH_RETRY_DELAYS_MS.length) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const delay = SERVER_HEALTH_RETRY_DELAYS_MS[attempt] || 0;
    if (delay) await sleep(delay);
    try {
      const response = await fetchWithTimeout(apiUrl("api/health"), { cache: "no-store" }, HEALTH_TIMEOUT_MS);
      if (response.ok) {
        updateConnectionDiagnostics({
          status: "OK",
          apiStatus: "OK",
          syncStatus: syncReady ? "Online" : "API online",
          lastSuccess: new Date().toISOString(),
          lastError: ""
        });
        return true;
      }
    } catch {
      // The caller shows the user-facing connection message after all retries.
    }
  }
  return false;
}

async function postLoginWithRetry(credentials) {
  let lastError = null;
  for (let attempt = 0; attempt < LOGIN_RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = LOGIN_RETRY_DELAYS_MS[attempt] || 0;
    if (delay) {
      setLoginMessage(`Servidor sin respuesta. Reintentando ingreso ${attempt + 1}/${LOGIN_RETRY_DELAYS_MS.length}...`, "info");
      await sleep(delay);
    }
    try {
      return await fetchWithTimeout(apiUrl("api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(credentials)
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No se pudo conectar con el servidor.");
}

function loginConnectionMessage() {
  updateConnectionDiagnostics({
    status: "Error",
    apiStatus: "Sin respuesta",
    syncStatus: "Offline",
    lastError: `No responde ${apiUrl("api/health")}`
  });
  return `No se pudo conectar con el servidor configurado. Verificar Tailscale/servidor y probar ${apiUrl("api/health")}.`;
}

async function checkSession(options = {}) {
  try {
    const response = await fetchWithTimeout(apiUrl("api/session"), { cache: "no-store" }, HEALTH_TIMEOUT_MS);
    if (response.status === 404) {
      resetLoginConnectionStatus();
      authMode = "demo-login";
      const demoSession = readDemoSession();
      if (demoSession) {
        currentUser = demoSession;
        startAuthenticatedApp();
        return;
      }
      showLogin("Demo local: ingresar usuario y clave.", "info");
      return;
    }
    if (!response.ok) {
      resetLoginConnectionStatus();
      authMode = "required";
      showLogin("Ingresar con usuario y clave.", "info");
      return;
    }
    const payload = await response.json();
    applyPresencePayload(payload);
    resetLoginConnectionStatus();
    authMode = "required";
    currentUser = payload.user;
    startAuthenticatedApp();
  } catch {
    authMode = "required";
    const demoSession = readDemoSession();
    if (demoSession) {
      currentUser = demoSession;
      startAuthenticatedApp();
      return;
    }
    showLoginConnectionStatus();
    scheduleSessionRetry();
  }
}

async function submitLogin(event) {
  event.preventDefault();
  setLoginMessage("Conectando con servidor...", "info");
  setLoginBusy(true);
  const form = new FormData(event.currentTarget);
  const loginGps = await captureLoginLocation();
  const credentials = {
    username: form.get("username"),
    password: form.get("password"),
    device: sessionDevicePayload(),
    gps: loginGps || trustedGpsForLogin(lastOwnLocation && lastOwnLocation.location ? lastOwnLocation.location : null)
  };
  try {
    loginConnectionStartedAt = Date.now();
    const serverReady = await waitForServerHealth();
    if (!serverReady && authMode !== "demo-login") {
      setLoginConnectionStatus();
    }
    const response = await postLoginWithRetry(credentials);
    if (response.status === 404) {
      resetLoginConnectionStatus();
      tryDemoLogin(credentials, event.currentTarget);
      return;
    }
    const payload = await response.json().catch(() => ({}));
    if (response.status === 428 && payload.code === "TERMS_REQUIRED") {
      resetLoginConnectionStatus();
      pendingLegalLogin = { credentials, form: event.currentTarget };
      openLegalAcceptanceDialog(payload.legal);
      setLoginMessage("Leer y aceptar los terminos vigentes para ingresar.", "info");
      return;
    }
    if (!response.ok) {
      resetLoginConnectionStatus();
      setLoginMessage(payload.error || "No se pudo iniciar sesion.");
      return;
    }
    resetLoginConnectionStatus();
    applyPresencePayload(payload);
    currentUser = payload.user;
    authMode = "required";
    event.currentTarget.reset();
    startAuthenticatedApp();
  } catch {
    if (authMode === "demo-login" || authMode === "pending") {
      tryDemoLogin(credentials, event.currentTarget);
      return;
    }
    setLoginConnectionStatus();
    scheduleSessionRetry();
  } finally {
    setLoginBusy(false);
  }
}

function stopRealtimeChannels() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  if (presenceHeartbeatIntervalId) {
    clearInterval(presenceHeartbeatIntervalId);
    presenceHeartbeatIntervalId = null;
  }
  if (presenceLocationIntervalId) {
    clearTimeout(presenceLocationIntervalId);
    presenceLocationIntervalId = null;
  }
  if (geoWatchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
  stopNativeLocationTracking();
  clearInterval(nativeGpsRefreshTimer);
  nativeGpsRefreshTimer = null;
  clearInterval(deliveryGpsRefreshTimer);
  deliveryGpsRefreshTimer = null;
  syncReady = false;
  currentSession = null;
  presenceSessions = [];
  lastPresenceLocationSent = null;
  adminOrderNotificationReady = false;
  adminKnownOrderCodes = new Set();
  const toasts = byId("adminOrderToasts");
  if (toasts) toasts.innerHTML = "";
}

async function logout() {
  if (authMode === "required") {
    await fetch(apiUrl("api/logout"), { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  }
  sessionStorage.removeItem("dlDemoUser");
  cleanupOperationalLocalData("logout");
  stopRealtimeChannels();
  currentUser = null;
  showLogin("Sesion cerrada.");
}

async function cleanLocalDataFromAdmin() {
  if (!window.confirm("Limpiar datos locales de emergencia en este dispositivo? Se cerrara la sesion y se recargara desde el servidor.")) return;
  if (authMode === "required") {
    await fetch(apiUrl("api/logout"), { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  }
  emergencyCleanLocalData();
  stopRealtimeChannels();
  currentUser = null;
  location.hash = "";
  window.location.reload();
}

function openSupportWhatsApp() {
  const context = currentUser ? ` Usuario: ${currentUser.name} (${roleLabel(currentUser.role)}).` : "";
  const message = encodeURIComponent(`${SUPPORT_WHATSAPP_TEXT}${context}`);
  if (!SUPPORT_WHATSAPP_PHONE) {
    window.alert("Falta configurar el numero de WhatsApp de soporte en config.js.");
    return;
  }
  if (!openExternalUrl(`https://wa.me/${SUPPORT_WHATSAPP_PHONE}?text=${message}`, "WhatsApp")) {
    window.alert("No se pudo abrir WhatsApp desde este dispositivo.");
  }
}

function openPasswordRecoveryDialog() {
  const dialog = byId("passwordRecoveryDialog");
  if (!dialog) return;
  const loginForm = byId("loginForm");
  const recoveryForm = byId("passwordRecoveryForm");
  const loginUsername = loginForm ? loginForm.elements.username.value : "";
  if (recoveryForm) {
    recoveryForm.reset();
    recoveryForm.elements.username.value = loginUsername || "";
  }
  setRecoveryMessage("");
  dialog.showModal();
}

async function submitPasswordRecovery(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const username = String(new FormData(form).get("username") || "").trim();
  if (!username) {
    setRecoveryMessage("Ingresar el usuario para solicitar recupero.");
    return;
  }
  setRecoveryBusy(true);
  setRecoveryMessage("Registrando solicitud...", "info");
  try {
    const response = await fetchWithTimeout(apiUrl("api/password-recovery"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ username })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setRecoveryMessage(payload.error || "No se pudo registrar el recupero.");
      return;
    }
    setRecoveryMessage(payload.message || "Solicitud registrada.", "ok");
    setLoginMessage("Recupero solicitado. Administracion o soporte tecnico debe restablecer la clave.", "info");
  } catch {
    setRecoveryMessage(loginConnectionMessage());
  } finally {
    setRecoveryBusy(false);
  }
}

function legalPacketFromState() {
  if (state && state.legalSettings) {
    return {
      currentVersion: state.legalSettings.currentVersion,
      title: state.legalSettings.title,
      publishedAt: state.legalSettings.publishedAt,
      publishedBy: state.legalSettings.publishedBy,
      hash: state.legalSettings.hash,
      documents: state.legalSettings.documents || [],
      history: state.legalSettings.history || []
    };
  }
  if (LegalEngine && typeof LegalEngine.defaultLegalSettings === "function") {
    const settings = LegalEngine.defaultLegalSettings();
    return {
      currentVersion: settings.currentVersion,
      title: settings.title,
      publishedAt: settings.publishedAt,
      publishedBy: settings.publishedBy,
      hash: settings.hash,
      documents: settings.documents || [],
      history: settings.history || []
    };
  }
  return {
    currentVersion: "LEGAL-2026-07-27-v1",
    title: "Terminos, Licencia y Privacidad",
    hash: "",
    documents: []
  };
}

function localLegalAcceptanceKey(packet = legalPacketFromState()) {
  return `dlLegalAccepted:${packet.currentVersion || ""}:${packet.hash || ""}`;
}

function hasLocalLegalAcceptance(packet = legalPacketFromState()) {
  try {
    return localStorage.getItem(localLegalAcceptanceKey(packet)) === "1";
  } catch {
    return false;
  }
}

function rememberLocalLegalAcceptance(packet = legalPacketFromState()) {
  try {
    localStorage.setItem(localLegalAcceptanceKey(packet), "1");
  } catch {
    // La aceptacion real se guarda en servidor cuando hay sesion normal.
  }
}

function legalDocumentHtml(packet = legalPacketFromState()) {
  const documents = Array.isArray(packet.documents) ? packet.documents : [];
  return documents.map((document) => `
    <article class="legal-document">
      <h3>${escapeHtml(document.title || "Documento legal")}</h3>
      ${document.summary ? `<p class="form-help">${escapeHtml(document.summary)}</p>` : ""}
      <ul>
        ${(Array.isArray(document.body) ? document.body : String(document.body || "").split(/\n+/))
          .filter(Boolean)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}
      </ul>
    </article>
  `).join("") || '<article class="legal-document"><p>No hay documentos legales cargados.</p></article>';
}

async function fetchPublicLegalPacket() {
  try {
    const response = await fetchWithTimeout(apiUrl("api/legal"), { cache: "no-store" }, HEALTH_TIMEOUT_MS);
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.legal) return payload.legal;
  } catch {
    // Usar estado local si el servidor todavia no respondio.
  }
  return legalPacketFromState();
}

function fillLegalAcceptanceDialog(packet) {
  legalAcceptancePacket = packet || legalPacketFromState();
  const title = byId("legalAcceptanceTitle");
  const meta = byId("legalAcceptanceMeta");
  const body = byId("legalAcceptanceBody");
  const checkbox = byId("legalAcceptCheckbox");
  const submit = byId("legalAcceptSubmitBtn");
  if (title) title.textContent = legalAcceptancePacket.title || "Terminos legales";
  if (meta) {
    meta.innerHTML = `
      <span class="tag info">Version ${escapeHtml(legalAcceptancePacket.currentVersion || "-")}</span>
      <span>Hash ${escapeHtml(legalAcceptancePacket.hash || "-")}</span>
      <span>Publicado ${escapeHtml(formatOrderTime(legalAcceptancePacket.publishedAt) || "-")}</span>
    `;
  }
  if (body) body.innerHTML = legalDocumentHtml(legalAcceptancePacket);
  if (checkbox) checkbox.checked = false;
  if (submit) submit.disabled = true;
}

async function openLegalAcceptanceDialog(packet) {
  const dialog = byId("legalAcceptanceDialog");
  if (!dialog) return;
  fillLegalAcceptanceDialog(packet || await fetchPublicLegalPacket());
  if (!dialog.open) dialog.showModal();
}

async function acceptLegalAndContinue(event) {
  event.preventDefault();
  const checkbox = byId("legalAcceptCheckbox");
  if (!checkbox || !checkbox.checked) return;
  const dialog = byId("legalAcceptanceDialog");
  const packet = legalAcceptancePacket || legalPacketFromState();
  rememberLocalLegalAcceptance(packet);
  if (!pendingLegalLogin) {
    if (dialog && dialog.open) dialog.close("accepted");
    showCompactNotice("Terminos aceptados en este dispositivo.", "ok");
    return;
  }
  const pending = pendingLegalLogin;
  pendingLegalLogin = null;
  if (pending.demo) {
    if (dialog && dialog.open) dialog.close("accepted");
    startDemoLogin(pending.demoUser, pending.form);
    return;
  }
  const credentials = {
    ...pending.credentials,
    legalAcceptance: {
      accepted: true,
      version: packet.currentVersion,
      hash: packet.hash,
      title: packet.title,
      acceptedAt: new Date().toISOString()
    }
  };
  setLoginBusy(true);
  setLoginMessage("Registrando aceptacion e iniciando sesion...", "info");
  try {
    const response = await postLoginWithRetry(credentials);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 428 && payload.legal) {
        pendingLegalLogin = pending;
        fillLegalAcceptanceDialog(payload.legal);
        setLoginMessage("La version legal cambio. Revisar y aceptar nuevamente.", "info");
        return;
      }
      setLoginMessage(payload.error || "No se pudo iniciar sesion.");
      return;
    }
    if (dialog && dialog.open) dialog.close("accepted");
    resetLoginConnectionStatus();
    applyPresencePayload(payload);
    currentUser = payload.user;
    authMode = "required";
    if (pending.form) pending.form.reset();
    startAuthenticatedApp();
  } catch {
    pendingLegalLogin = pending;
    setLoginConnectionStatus();
  } finally {
    setLoginBusy(false);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeText(value) {
  return normalizeSearchText(value);
}

function sameText(left, right) {
  return normalizeSearchText(left) === normalizeSearchText(right);
}

function matchesSearch(value, terms) {
  const normalized = normalizeSearchText(value);
  return terms.every((term) => normalized.includes(term));
}

function searchTerms(...values) {
  return normalizeSearchText(values.filter((value) => value !== null && value !== undefined).join(" "))
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values
    .map((value) => String(value || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es-AR"));
}

function taxIdKey(value) {
  return String(value || "").replace(/\D/g, "");
}

function mixedEntityKey(record) {
  const taxId = taxIdKey(record && record.cuit);
  if (taxId.length >= 7) return `cuit:${taxId}`;
  const name = normalizeSearchText(record && (record.razon_social || record.name || record.nombre_comercial));
  return name ? `nombre:${name}` : "";
}

function mixedEntityClientName(record) {
  return String(record && (record.name || record.nombre_comercial || record.razon_social) || "").trim();
}

function mixedEntitySupplierName(record) {
  return String(record && (record.name || record.razon_social || record.nombre) || "").trim();
}

function buildMixedEntities() {
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
        cliente: null,
        proveedor: null,
        ventasTotal: 0,
        comprasTotal: 0
      });
    }
    return relations.get(key);
  };

  (state.clients || []).forEach((client) => {
    const key = mixedEntityKey(client);
    if (!key) return;
    const entity = ensure(key, mixedEntityClientName(client));
    entity.cliente = client;
    entity.name = client.razon_social || client.name || entity.name;
    entity.cuit = client.cuit || entity.cuit;
    entity.domicilio = client.domicilio || entity.domicilio;
    entity.telefono = client.telefono || entity.telefono;
    entity.email = client.email || entity.email;
  });

  (state.suppliers || []).forEach((supplier) => {
    const key = mixedEntityKey(supplier);
    if (!key) return;
    const entity = ensure(key, mixedEntitySupplierName(supplier));
    entity.proveedor = supplier;
    entity.name = entity.name || supplier.razon_social || supplier.name;
    entity.cuit = entity.cuit || supplier.cuit;
    entity.domicilio = entity.domicilio || supplier.direccion;
    entity.telefono = entity.telefono || supplier.telefono;
    entity.email = entity.email || supplier.email;
  });

  relations.forEach((entity) => {
    const clientName = entity.cliente && mixedEntityClientName(entity.cliente);
    const supplierName = entity.proveedor && mixedEntitySupplierName(entity.proveedor);
    entity.ventasTotal = (state.orders || [])
      .filter((order) => clientName && normalizeSearchText(order.client) === normalizeSearchText(clientName))
      .reduce((total, order) => total + numeric(order.amount, 0), 0);
    entity.comprasTotal = numeric(entity.proveedor && entity.proveedor.totalPurchased, 0);
    entity.roles = [entity.cliente ? "Cliente" : "", entity.proveedor ? "Proveedor" : ""].filter(Boolean);
  });

  return Array.from(relations.values())
    .filter((entity) => entity.cliente && entity.proveedor)
    .sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
}

function mixedEntityByKey(key) {
  return buildMixedEntities().find((entity) => entity.key === key) || null;
}

function mixedEntityForClient(client) {
  const key = mixedEntityKey(client);
  return key ? mixedEntityByKey(key) : null;
}

function mixedEntityForSupplier(supplier) {
  const key = mixedEntityKey(supplier);
  return key ? mixedEntityByKey(key) : null;
}

function mixedEntityRecentMovements(entity) {
  const clientName = entity.cliente && mixedEntityClientName(entity.cliente);
  const supplierName = entity.proveedor && mixedEntitySupplierName(entity.proveedor);
  return [
    ...(state.orders || [])
      .filter((order) => clientName && normalizeSearchText(order.client) === normalizeSearchText(clientName))
      .map((order) => ({
        at: order.updatedAt || order.createdAt || "",
        type: "Venta",
        detail: `${order.code} - ${order.status}`,
        amount: order.amount || 0
      })),
    ...(state.supplierMovements || [])
      .filter((movement) => supplierName && normalizeSearchText(movement.supplier || movement.proveedor) === normalizeSearchText(supplierName))
      .map((movement) => ({
        at: movement.at || movement.date || "",
        type: movement.type || "Compra",
        detail: movement.remitNumber || movement.invoiceNumber || movement.status || "",
        amount: movement.amount || movement.declaredAmount || 0
      }))
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 8);
}

function openMixedEntityDialog(key) {
  const entity = mixedEntityByKey(key);
  if (!entity) {
    showCompactNotice("No se encontro una relacion cliente/proveedor para esta ficha.", "warn");
    return;
  }
  const client = entity.cliente || {};
  const supplier = entity.proveedor || {};
  const account = client.name ? clientAccountSummary(client.name, 0) : null;
  byId("mixedEntityTitle").textContent = entity.name;
  byId("mixedEntitySubtitle").textContent = `Entidad mixta: ${entity.roles.join(" + ")}${entity.cuit ? ` - CUIT ${entity.cuit}` : ""}`;
  byId("mixedEntityBody").innerHTML = `
    <section class="mixed-entity-grid">
      <article class="mixed-entity-card">
        <span>Datos compartidos</span>
        <strong>${escapeHtml(entity.name)}</strong>
        <small>CUIT: ${escapeHtml(entity.cuit || "Sin CUIT")}</small>
        <small>Domicilio: ${escapeHtml(entity.domicilio || "Sin domicilio")}</small>
        <small>Telefono: ${escapeHtml(entity.telefono || "Sin telefono")}</small>
        <small>Email: ${escapeHtml(entity.email || "Sin email")}</small>
      </article>
      <article class="mixed-entity-card">
        <span>Relacion cliente</span>
        <strong>${escapeHtml(client.name || "Sin ficha cliente")}</strong>
        <small>Saldo: ${money.format(account ? account.currentBalance : 0)}</small>
        <small>Limite: ${money.format(account ? account.creditLimit : 0)}</small>
        <small>Ventas registradas: ${money.format(entity.ventasTotal)}</small>
        <small>Estado: ${escapeHtml(client.status || client.estado || "-")}</small>
      </article>
      <article class="mixed-entity-card">
        <span>Relacion proveedor</span>
        <strong>${escapeHtml(supplier.name || "Sin ficha proveedor")}</strong>
        <small>Saldo proveedor: ${money.format(supplier.balance || 0)}</small>
        <small>Comprado: ${money.format(entity.comprasTotal)}</small>
        <small>Pagado: ${money.format(supplier.totalPaid || 0)}</small>
        <small>Estado: ${escapeHtml(supplier.status || "-")}</small>
      </article>
    </section>
    <section class="mixed-entity-history">
      <h3>Movimientos recientes</h3>
      ${mixedEntityRecentMovements(entity).length ? mixedEntityRecentMovements(entity).map((movement) => `
        <article class="activity compact-activity">
          <span class="tag info">${escapeHtml(movement.type)}</span>
          <strong>${escapeHtml(movement.detail || "Movimiento")}</strong>
          <p>${money.format(movement.amount || 0)} - ${escapeHtml(formatOrderTime(movement.at) || movement.at || "Sin fecha")}</p>
        </article>
      `).join("") : '<p class="empty-note">Sin movimientos recientes para cruzar.</p>'}
    </section>
  `;
  byId("mixedEntityDialog").showModal();
}

function updateDynamicFilter(id, values, selectedValue, allLabel) {
  const select = byId(id);
  if (!select) return selectedValue;
  const options = uniqueSorted(values);
  const nextValue = selectedValue === "all" || options.includes(selectedValue) ? selectedValue : "all";
  select.innerHTML = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
  ].join("");
  select.value = nextValue;
  return nextValue;
}

function renderAll() {
  renderMetrics();
  renderDashboardInsights();
  renderFlow();
  renderDashboardPresence();
  renderDashboardDailyRoutes();
  renderAlerts();
  renderActivity();
  renderCommissions();
  renderMobileSeller();
  renderAssistantGuide();
  renderRoutes();
  renderOrders();
  renderDelivery();
  renderClients();
  renderAccounts();
  renderStock();
  renderPriceLists();
  renderCommissionsModule();
  renderPhysicalStockControl();
  renderSuppliers();
  renderAnalytics();
  renderAdmin();
  renderRejectedGps();
  renderNotificationCenter();
  updateAdminOnlyVisibility();
}

function isOperationalMobileUser() {
  return Boolean(currentUser && (currentUser.role === "seller" || currentUser.role === "driver"));
}

function renderDashboardView() {
  renderMetrics();
  renderDashboardInsights();
  renderFlow();
  renderDashboardPresence();
  renderAlerts();
  renderActivity();
  renderCommissions();
}

function renderActiveView(viewId = activeViewId()) {
  if (!currentUser) return;
  switch (viewId) {
    case "dashboard":
      renderDashboardView();
      break;
    case "preventa":
      renderMobileSeller();
      break;
    case "pedidos":
      renderOrders();
      break;
    case "armado":
      renderAssemblyDepot();
      break;
    case "reparto":
      renderDelivery();
      break;
    case "clientes":
      renderClients();
      break;
    case "cuentas":
      renderAccounts();
      break;
    case "stock":
      renderStock();
      break;
    case "precios":
      renderPriceLists();
      break;
    case "comisiones":
      renderCommissionsModule();
      break;
    case "control-stock":
      renderPhysicalStockControl();
      break;
    case "proveedores":
      renderSuppliers();
      break;
    case "estadisticas":
      renderAnalytics();
      renderRoutes();
      break;
    case "diagnostico":
      renderDiagnostics();
      break;
    case "legal":
      renderLegalModule();
      break;
    case "ayuda":
      renderHelpCenter();
      break;
    case "acerca":
      renderAboutSystem();
      break;
    case "admin":
      renderAdmin();
      renderRejectedGps();
      break;
    default:
      renderDashboardView();
      break;
  }
  renderOpenNotificationCenter();
  updateAdminOnlyVisibility();
}

function scheduleRenderForCurrentUser() {
  if (activeRenderFrame) return;
  activeRenderFrame = requestAnimationFrame(() => {
    activeRenderFrame = null;
    renderForCurrentUser();
  });
}

function renderOpenNotificationCenter() {
  const center = byId("notificationCenter");
  if (center && !center.hidden) renderNotificationCenter();
}

function renderOperationalRole() {
  if (!currentUser) return false;
  if (currentUser.role === "seller") {
    renderMobileSeller();
    renderOpenNotificationCenter();
    updateAdminOnlyVisibility();
    return true;
  }
  if (currentUser.role === "driver") {
    renderDelivery();
    renderOpenNotificationCenter();
    updateAdminOnlyVisibility();
    return true;
  }
  if (currentUser.role === "depot") {
    renderAssemblyDepot();
    renderOpenNotificationCenter();
    updateAdminOnlyVisibility();
    return true;
  }
  return false;
}

function renderForCurrentUser() {
  renderInstitutionalFooter();
  if (!renderOperationalRole()) renderActiveView();
}

function currentSyncIntervalMs() {
  return isOperationalMobileUser() ? MOBILE_SYNC_INTERVAL_MS : SYNC_INTERVAL_MS;
}

function renderMetrics() {
  const dailySales = state.orders.filter((order) => order.status !== ORDER_STATUS.CANCELLED).reduce((total, order) => total + order.amount, 0);
  const receivables = state.clients.reduce((total, client) => total + client.balance, 0);
  const payables = state.suppliers.reduce((total, supplier) => total + supplier.balance, 0);
  const criticalStock = state.products.filter((product) => OrderEngine.inventory(product).available < product.min).length;
  const metrics = [
    { label: "Ventas del dia", value: money.format(dailySales), hint: `${state.orders.length} pedidos recibidos` },
    { label: "Saldos clientes", value: money.format(receivables), hint: "Cuenta corriente online" },
    { label: "Deuda proveedores", value: money.format(payables), hint: "Vencimientos controlados" },
    { label: "Stock critico", value: criticalStock, hint: "Productos bajo minimo" }
  ];

  byId("metricsGrid").innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
      <small>${metric.hint}</small>
    </article>
  `).join("");
}

function renderDashboardInsights() {
  const container = byId("dashboardInsights");
  if (!container) return;
  const totalOrders = Math.max(1, state.orders.filter((order) => order.status !== ORDER_STATUS.CANCELLED).length);
  const inTransit = state.orders.filter((order) => [ORDER_STATUS.DISPATCHED, ORDER_STATUS.IN_ROUTE].includes(order.status)).length;
  const delivered = state.orders.filter((order) => [ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(order.status)).length;
  const income = state.accounts.reduce((total, entry) => total + numeric(entry.credit, 0), 0);
  const expenses = state.suppliers.reduce((total, supplier) => total + numeric(supplier.balance, 0), 0);
  const physicalStock = state.products.reduce((total, product) => total + OrderEngine.inventory(product).physical, 0);
  const reservedStock = state.products.reduce((total, product) => total + OrderEngine.inventory(product).reserved, 0);
  const inTransitPercent = Math.round((inTransit / totalOrders) * 100);
  const deliveredPercent = Math.round((delivered / totalOrders) * 100);
  const stockReservedPercent = physicalStock ? Math.round((reservedStock / physicalStock) * 100) : 0;
  const cashflowBase = Math.max(1, income, expenses);
  container.innerHTML = `
    <article class="insight-card">
      <div class="donut" style="--value:${inTransitPercent}"><span>${inTransitPercent}%</span></div>
      <div>
        <strong>Pedidos en transito</strong>
        <p>${inTransit} pedidos entre despacho, bajada y control.</p>
      </div>
    </article>
    <article class="insight-card">
      <div class="donut ok" style="--value:${deliveredPercent}"><span>${deliveredPercent}%</span></div>
      <div>
        <strong>Entregas cerradas</strong>
        <p>${delivered} pedidos entregados sobre ${totalOrders} activos.</p>
      </div>
    </article>
    <article class="insight-card cashflow-card">
      <strong>Ingresos vs egresos</strong>
      <div class="cashflow-bars">
        <span><i style="width:${Math.round((income / cashflowBase) * 100)}%"></i></span>
        <span><i class="expense" style="width:${Math.round((expenses / cashflowBase) * 100)}%"></i></span>
      </div>
      <p>Ingresos ${money.format(income)} / Egresos ${money.format(expenses)}</p>
    </article>
    <article class="insight-card">
      <div class="donut warn" style="--value:${stockReservedPercent}"><span>${stockReservedPercent}%</span></div>
      <div>
        <strong>Stock comprometido</strong>
        <p>${reservedStock} unidades reservadas sobre ${physicalStock} fisicas.</p>
      </div>
    </article>
  `;
}

function renderFlow() {
  const counts = ORDER_PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: state.orders.filter((order) => stage.statuses.includes(order.status)).length
  }));
  const total = state.orders.length;
  const maxCount = Math.max(1, ...counts.map((stage) => stage.count));
  const activeCount = state.orders.filter((order) => ![ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status)).length;
  const deliveredCount = counts.find((stage) => stage.label === "Entregado")?.count || 0;
  const completion = total ? Math.round((deliveredCount / total) * 100) : 0;

  byId("flowGrid").innerHTML = `
    <article class="flow-card pipeline-summary">
      <strong>Pipeline de pedidos</strong>
      <p>${activeCount} pedidos activos sobre ${total} totales.</p>
      <span>${completion}% entregado</span>
      <div class="pipeline-summary-bar"><i style="width:${completion}%"></i></div>
    </article>
    ${counts.map((stage, index) => {
      const percent = Math.round((stage.count / maxCount) * 100);
      return `
        <article class="flow-card order-stage-card ${stage.tone}" role="button" tabindex="0" data-order-stage="${escapeHtml(stage.key)}" aria-label="Generar PDF de ${escapeHtml(stage.label)}">
          <div class="stage-topline">
            <strong>${index + 1}. ${escapeHtml(stage.label)}</strong>
            <span>${stage.count}</span>
          </div>
          <p>${escapeHtml(stage.text)}</p>
          <div class="stage-bar" aria-label="${escapeHtml(stage.label)} ${stage.count}">
            <i style="width:${percent}%"></i>
          </div>
          <small>PDF de corte</small>
        </article>
      `;
    }).join("")}
  `;
}

function renderAlerts() {
  const overLimit = state.clients.filter((client) => client.balance > client.limit);
  const lowStock = state.products.filter((product) => OrderEngine.inventory(product).available < product.min);
  const orderAlerts = state.orders
    .filter((order) => ![ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status))
    .map((order) => {
      const delay = orderDelayInfo(order);
      const priority = orderPriorityInfo(order);
      if (priority.label === "Normal" && !delay.delayed) return null;
      const danger = priority.tone === "danger" || delay.tone === "danger";
      return {
        title: `${order.code} - ${order.client}`,
        text: `${order.status}: ${delay.label}. ${priority.reason}.`,
        tone: danger ? "danger" : "warn",
        score: danger ? 1200 + delay.minutes : 800 + delay.minutes
      };
    })
    .filter(Boolean);
  const alerts = [
    ...orderAlerts,
    ...overLimit.map((client) => ({
      title: client.name,
      text: `Saldo ${money.format(client.balance)} supera limite ${money.format(client.limit)}.`,
      tone: "danger",
      score: 1000 + Math.max(0, client.balance - client.limit)
    })),
    ...lowStock.map((product) => ({
      title: product.name,
      text: `Disponible ${OrderEngine.inventory(product).available}, fisico ${OrderEngine.inventory(product).physical}, reservado ${OrderEngine.inventory(product).reserved}, minimo ${product.min}.`,
      tone: OrderEngine.inventory(product).available <= 0 ? "danger" : "warn",
      score: (OrderEngine.inventory(product).available <= 0 ? 900 : 600) + Math.max(0, product.min - OrderEngine.inventory(product).available)
    })),
    ...state.bankTransfers.map((item) => ({
      ...item,
      score: item.tone === "danger" ? 950 : 650
    }))
  ]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 4);

  byId("alertsList").innerHTML = alerts.map((alert) => `
    <article class="alert">
      <span class="tag ${alert.tone}">${alert.tone === "danger" ? "Critico" : "Atencion"}</span>
      <strong>${escapeHtml(alert.title)}</strong>
      <p>${escapeHtml(alert.text)}</p>
    </article>
  `).join("");
}

function dashboardDateKey(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function dashboardTodayParts() {
  const parts = new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).split("/");
  return { day: Number(parts[0]), month: Number(parts[1]), year: Number(parts[2]) };
}

function dashboardDateIsToday(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  const short = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (short) {
    const today = dashboardTodayParts();
    const day = Number(short[1]);
    const month = Number(short[2]);
    const year = short[3] ? Number(short[3].length === 2 ? `20${short[3]}` : short[3]) : today.year;
    return day === today.day && month === today.month && year === today.year;
  }
  return dashboardDateKey(text) === dashboardDateKey(new Date());
}

function orderHappenedToday(order) {
  return dashboardDateIsToday(order.createdAt || order.receivedAt || order.dateIso || order.updatedAt);
}

function accountEntryHappenedToday(entry) {
  return dashboardDateIsToday(entry.at || entry.createdAt || entry.dateIso || entry.date);
}

function buildOperationalDashboard() {
  const orders = (state.orders || []).filter((order) => order.status !== ORDER_STATUS.CANCELLED);
  const activeStatuses = new Set([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.READY,
    ORDER_STATUS.ASSEMBLY,
    ORDER_STATUS.DISPATCHED,
    ORDER_STATUS.IN_ROUTE,
    ORDER_STATUS.CHECKED,
    ORDER_STATUS.PARTIAL_DELIVERED
  ]);
  const todayOrders = orders.filter(orderHappenedToday);
  const accountSummaries = (state.clients || []).map((client) => clientAccountSummary(client.name, 0)).filter((summary) => summary.ok);
  const debtClients = accountSummaries.filter((summary) => numeric(summary.currentBalance, 0) > 0);
  const overLimitClients = accountSummaries.filter((summary) => numeric(summary.overLimitAmount, 0) > 0 || summary.status === "Sobre limite");
  const pendingTransfers = (state.bankReconciliation || []).filter((record) => {
    const status = normalizeTransferStatus(record.status, record.attachment);
    return !TRANSFER_FINAL_STATUSES.has(status);
  });
  const delayedOrders = orders
    .filter((order) => activeStatuses.has(order.status))
    .map((order) => ({ order, delay: orderDelayInfo(order), priority: orderPriorityInfo(order) }))
    .filter((item) => item.delay.delayed)
    .sort((a, b) => b.delay.minutes - a.delay.minutes);
  const collectedToday = (state.accounts || [])
    .filter((entry) => numeric(entry.credit, 0) > 0 && accountEntryHappenedToday(entry))
    .reduce((total, entry) => total + numeric(entry.credit, 0), 0);
  const dailySales = todayOrders.reduce((total, order) => total + numeric(order.amount, 0), 0);
  const totalPending = accountSummaries.reduce((total, summary) => total + numeric(summary.totalDebt, 0), 0);
  const stageCounts = ORDER_DASHBOARD_STAGES.map((stage) => {
    const stageOrders = orders.filter((order) => stage.statuses.includes(order.status));
    return {
      ...stage,
      count: stageOrders.length,
      amount: stageOrders.reduce((total, order) => total + numeric(order.amount, 0), 0)
    };
  });
  return {
    orders,
    todayOrders,
    stageCounts,
    dailySales,
    collectedToday,
    totalPending,
    pendingTransfers,
    pendingTransferAmount: pendingTransfers.reduce((total, record) => total + numeric(record.amount, 0), 0),
    debtClients,
    debtAmount: debtClients.reduce((total, summary) => total + numeric(summary.currentBalance, 0), 0),
    overLimitClients,
    overLimitAmount: overLimitClients.reduce((total, summary) => total + numeric(summary.overLimitAmount, 0), 0),
    delayedOrders,
    activeOrders: orders.filter((order) => activeStatuses.has(order.status)),
    closedOrders: orders.filter((order) => [ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(order.status))
  };
}

function renderMetrics() {
  const dashboard = buildOperationalDashboard();
  const metrics = [
    { tone: "ok", label: "Total vendido hoy", value: money.format(dashboard.dailySales), hint: `${dashboard.todayOrders.length} pedidos ingresados hoy` },
    { tone: "ok", label: "Total cobrado hoy", value: money.format(dashboard.collectedToday), hint: "Cobros registrados en cuentas/reparto" },
    { tone: "warn", label: "Total pendiente", value: money.format(dashboard.totalPending), hint: "Saldo de clientes mas pedidos expuestos" },
    { tone: dashboard.pendingTransfers.length ? "danger" : "ok", label: "Transferencias a validar", value: dashboard.pendingTransfers.length, hint: money.format(dashboard.pendingTransferAmount) }
  ];

  byId("metricsGrid").innerHTML = metrics.map((metric) => `
    <article class="metric-card ${metric.tone}">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <small>${escapeHtml(metric.hint)}</small>
    </article>
  `).join("");
}

function renderDashboardInsights() {
  const container = byId("dashboardInsights");
  if (!container) return;
  const dashboard = buildOperationalDashboard();
  const totalOrders = Math.max(1, dashboard.orders.length);
  const inTransitCount = (dashboard.stageCounts.find((stage) => stage.key === "reparto") || {}).count || 0;
  const closedPercent = Math.round((dashboard.closedOrders.length / totalOrders) * 100);
  const transitPercent = Math.round((inTransitCount / totalOrders) * 100);
  const topDelay = dashboard.delayedOrders[0];
  const cashflowBase = Math.max(1, dashboard.dailySales, dashboard.collectedToday, dashboard.totalPending);
  const transferCounts = transferSummaryCounts(state.bankReconciliation || []);
  const stockRows = physicalStockRows();
  const stockAvailable = stockRows.reduce((sum, row) => sum + row.available, 0);
  const stockPhysical = stockRows.reduce((sum, row) => sum + row.expected, 0);
  const stockCommitted = stockRows.reduce((sum, row) => sum + row.totalPreDispatch, 0);
  const stockGapPercent = stockPhysical ? Math.round((stockCommitted / stockPhysical) * 100) : 0;
  container.innerHTML = `
    <article class="insight-card">
      <div class="donut" style="--value:${transitPercent}"><span>${transitPercent}%</span></div>
      <div>
        <strong>Pedidos en transito</strong>
        <p>${inTransitCount} pedidos entre despacho, control y reparto.</p>
      </div>
    </article>
    <article class="insight-card">
      <div class="donut ok" style="--value:${closedPercent}"><span>${closedPercent}%</span></div>
      <div>
        <strong>Avance operativo</strong>
        <p>${dashboard.closedOrders.length} pedidos entregados, cobrados o cerrados sobre ${dashboard.orders.length}.</p>
      </div>
    </article>
    <article class="insight-card cashflow-card">
      <strong>Caja del dia</strong>
      <div class="cashflow-bars">
        <span title="Vendido"><i style="width:${Math.round((dashboard.dailySales / cashflowBase) * 100)}%"></i></span>
        <span title="Cobrado"><i class="ok" style="width:${Math.round((dashboard.collectedToday / cashflowBase) * 100)}%"></i></span>
        <span title="Pendiente"><i class="expense" style="width:${Math.round((dashboard.totalPending / cashflowBase) * 100)}%"></i></span>
      </div>
      <p>Vendido ${money.format(dashboard.dailySales)} / Cobrado ${money.format(dashboard.collectedToday)} / Pendiente ${money.format(dashboard.totalPending)}</p>
    </article>
    <article class="insight-card dashboard-risk-card">
      <span class="tag ${dashboard.delayedOrders.length || dashboard.overLimitClients.length ? "danger" : "ok"}">Control</span>
      <strong>Alertas gerenciales</strong>
      <p>${dashboard.delayedOrders.length} pedidos demorados. ${dashboard.debtClients.length} clientes con deuda. ${dashboard.overLimitClients.length} fuera de limite.</p>
      ${topDelay ? `<small>${escapeHtml(topDelay.order.code)} - ${escapeHtml(topDelay.delay.label)}</small>` : "<small>Sin demoras criticas activas.</small>"}
    </article>
    <article class="insight-card transfer-dashboard-card">
      <span class="tag ${transferCounts.critical || transferCounts.red ? "danger" : (transferCounts.yellow ? "warn" : "ok")}">Transferencias</span>
      <strong>Semaforo bancario</strong>
      <div class="transfer-chip-row">
        <button type="button" data-bank-summary-filter="red"><span class="traffic-dot red"></span>${transferCounts.red || 0}</button>
        <button type="button" data-bank-summary-filter="yellow"><span class="traffic-dot yellow"></span>${transferCounts.yellow || 0}</button>
        <button type="button" data-bank-summary-filter="green"><span class="traffic-dot green"></span>${transferCounts.green || 0}</button>
        <button type="button" data-bank-summary-filter="critical"><span class="traffic-dot critical"></span>${transferCounts.critical || 0}</button>
      </div>
      <small>Pendiente bancario ${money.format(transferCounts.pendingAmount || 0)}</small>
    </article>
    <article class="insight-card physical-stock-dashboard-card">
      <div class="donut warn" style="--value:${stockGapPercent}"><span>${stockGapPercent}%</span></div>
      <div>
        <strong>Stock fisico vs disponible</strong>
        <p>Disponible ${stockAvailable} / Fisico ${stockPhysical}. Comprometido no despachado ${stockCommitted}.</p>
        <small>Diferencia operativa: ${stockPhysical - stockAvailable} unidades dentro del deposito.</small>
      </div>
    </article>
  `;
}

function renderFlow() {
  const dashboard = buildOperationalDashboard();
  const counts = dashboard.stageCounts;
  const total = dashboard.orders.length;
  const maxCount = Math.max(1, ...counts.map((stage) => stage.count));
  const closedCount = dashboard.closedOrders.length;
  const completion = total ? Math.round((closedCount / total) * 100) : 0;

  byId("flowGrid").innerHTML = `
    <article class="flow-card pipeline-summary">
      <strong>Dashboard Operativo</strong>
      <p>${dashboard.activeOrders.length} pedidos activos sobre ${total} totales. Actualiza automaticamente sin recargar la pagina.</p>
      <span>${completion}% resuelto</span>
      <div class="pipeline-summary-bar"><i style="width:${completion}%"></i></div>
    </article>
    ${counts.map((stage, index) => {
      const percent = Math.round((stage.count / maxCount) * 100);
      return `
        <article class="flow-card order-stage-card ${stage.tone}" role="button" tabindex="0" data-order-stage="${escapeHtml(stage.key)}" aria-label="Generar PDF de ${escapeHtml(stage.label)}">
          <div class="stage-topline">
            <strong>${index + 1}. ${escapeHtml(stage.label)}</strong>
            <span>${stage.count}</span>
          </div>
          <p>${escapeHtml(stage.text)}</p>
          <div class="stage-bar" aria-label="${escapeHtml(stage.label)} ${stage.count}">
            <i style="width:${percent}%"></i>
          </div>
          <small>${money.format(stage.amount)} - PDF de corte</small>
        </article>
      `;
    }).join("")}
  `;
}

function renderAlerts() {
  const dashboard = buildOperationalDashboard();
  const lowStock = state.products.filter((product) => OrderEngine.inventory(product).available < product.min);
  const alerts = [
    ...dashboard.delayedOrders.map((item) => ({
      title: `${item.order.code} - ${item.order.client}`,
      text: `${item.order.status}: ${item.delay.label}. ${item.priority.reason}.`,
      tone: item.delay.tone === "danger" ? "danger" : "warn",
      score: (item.delay.tone === "danger" ? 1400 : 1000) + item.delay.minutes
    })),
    ...dashboard.overLimitClients.map((summary) => ({
      title: summary.clientName,
      text: `Fuera de limite por ${money.format(summary.overLimitAmount)}. Deuda total ${money.format(summary.totalDebt)}.`,
      tone: "danger",
      score: 1300 + summary.overLimitAmount
    })),
    ...dashboard.pendingTransfers.map((record) => ({
      title: `${record.orderCode || "Transferencia"} - ${record.client || "Sin cliente"}`,
      text: `${record.bank || "Banco sin informar"} - ${money.format(record.amount || 0)} pendiente de validar.`,
      tone: "warn",
      score: 900 + numeric(record.amount, 0)
    })),
    ...dashboard.debtClients.map((summary) => ({
      title: summary.clientName,
      text: `Cliente con deuda: ${money.format(summary.currentBalance)}. Estado ${summary.status}.`,
      tone: "warn",
      score: 700 + summary.currentBalance
    })),
    ...lowStock.map((product) => ({
      title: product.name,
      text: `Disponible ${OrderEngine.inventory(product).available}, fisico ${OrderEngine.inventory(product).physical}, reservado ${OrderEngine.inventory(product).reserved}, minimo ${product.min}.`,
      tone: OrderEngine.inventory(product).available <= 0 ? "danger" : "warn",
      score: (OrderEngine.inventory(product).available <= 0 ? 850 : 600) + Math.max(0, product.min - OrderEngine.inventory(product).available)
    }))
  ]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 4);

  byId("alertsList").innerHTML = alerts.length ? alerts.map((alert) => `
    <article class="alert">
      <span class="tag ${alert.tone}">${alert.tone === "danger" ? "Critico" : "Atencion"}</span>
      <strong>${escapeHtml(alert.title)}</strong>
      <p>${escapeHtml(alert.text)}</p>
    </article>
  `).join("") : '<article class="alert"><span class="tag ok">OK</span><strong>Sin alertas criticas</strong><p>El tablero no detecta demoras, deuda fuera de limite ni transferencias pendientes.</p></article>';
}

function renderActivity() {
  const recent = (state.activity || []).slice(0, 8);
  byId("activityList").innerHTML = recent.map((item) => `
    <article class="activity">
      <span class="tag">${escapeHtml(item.type)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("") || '<article class="activity"><span class="tag ok">Sin actividad</span><strong>Sin movimientos recientes</strong><p>El panel se actualiza al cargar pedidos, stock y cobranzas.</p></article>';
}

function ensureLocalCommissionSettings() {
  if (OrderEngine && typeof OrderEngine.ensureCommissionSettings === "function") {
    OrderEngine.ensureCommissionSettings(state);
  }
  state.commissionSettings = state.commissionSettings || { rules: [] };
  state.commissionAudit = Array.isArray(state.commissionAudit) ? state.commissionAudit : [];
  return state.commissionSettings;
}

function orderCommission(order, options = {}) {
  ensureLocalCommissionSettings();
  if (order && order.commissions && !options.force) return order.commissions;
  if (OrderEngine && typeof OrderEngine.calculateOrderCommissions === "function") {
    return OrderEngine.calculateOrderCommissions(state, order || {}, options);
  }
  const total = Math.round(numeric(order && order.amount, 0) * 0.03);
  return {
    seller: { total, cigarettes: 0, merchandise: total, baseAmount: numeric(order && order.amount, 0), lines: [] },
    driver: { total: 0, cigarettes: 0, merchandise: 0, baseAmount: 0, lines: [] },
    total,
    cigarettes: 0,
    merchandise: total
  };
}

function cartCommission(summary) {
  const order = {
    code: "COTIZACION",
    seller: mobileSeller,
    status: ORDER_STATUS.PREVENTA,
    amount: summary.total,
    createdAt: new Date().toISOString(),
    items: summary.lines.map((line) => ({
      productCode: line.product.codigo_producto || line.product.code || "",
      name: line.product.name,
      requestedQty: line.qty,
      unitPrice: numeric(line.product.price, 0),
      lineTotal: line.total
    }))
  };
  return orderCommission(order, { force: true, includeDriver: false });
}

function sellerCommissionValue(sellerName) {
  if (!OrderEngine || typeof OrderEngine.summarizeCommissions !== "function") {
    const seller = state.sellers.find((item) => item.name === sellerName);
    return seller ? numeric(seller.commission, 0) : 0;
  }
  const row = OrderEngine.summarizeCommissions(state, { role: "seller" }).find((item) => item.user === sellerName);
  return row ? numeric(row.total, 0) : 0;
}

function sellerSalesValue(sellerName) {
  const row = OrderEngine && typeof OrderEngine.summarizeCommissions === "function"
    ? OrderEngine.summarizeCommissions(state, { role: "seller" }).find((item) => item.user === sellerName)
    : null;
  if (row) return numeric(row.baseAmount, 0);
  const seller = state.sellers.find((item) => item.name === sellerName);
  return seller ? numeric(seller.sales, 0) : 0;
}

function orderCommissionInline(order) {
  const commissions = orderCommission(order);
  const seller = commissions.seller || {};
  return `
    <small>Comision vend.: ${money.format(seller.total || 0)}</small>
    <small>Cig. ${money.format(seller.cigarettes || 0)} / Resto ${money.format(seller.merchandise || 0)}</small>
  `;
}

function renderCommissions() {
  const rows = OrderEngine && typeof OrderEngine.summarizeCommissions === "function"
    ? OrderEngine.summarizeCommissions(state, { role: "seller" })
    : [...state.sellers].map((seller) => ({ user: seller.name, orders: seller.orders, baseAmount: seller.sales, total: seller.commission }));
  const totalCommission = rows.reduce((total, row) => total + numeric(row.total, 0), 0);
  byId("commissionList").innerHTML = `
    <article class="stock-item commission-total">
      <strong>Total comisiones</strong>
      <p>${money.format(totalCommission)} por reglas vigentes al momento del pedido</p>
    </article>
    ${rows.map((row) => `
    <article class="stock-item">
      <strong>${escapeHtml(row.user)}</strong>
      <p>${row.orders} pedidos - Base ${money.format(row.baseAmount)}</p>
      <span class="tag ok">Comision ${money.format(row.total)}</span>
    </article>
    `).join("")}
  `;
}

function renderMobileSeller() {
  const seller = state.sellers.find((item) => item.name === mobileSeller) || state.sellers[0];
  if (!seller) return;
  mobileSeller = seller.name;
  mobileWorkday = routeModeWorkday();
  const outsideRoute = mobileWorkday === "Fuera de Ruta";
  const clientsForSeller = getMobileClientOptions(seller);
  const selectedClient = state.clients.find((client) => client.name === mobileClient) || clientsForSeller[0] || state.clients[0];
  if (selectedClient) mobileClient = selectedClient.name;
  if (!mobileProduct || !state.products.some((product) => product.name === mobileProduct)) {
    mobileProduct = state.products[0] ? state.products[0].name : "";
  }

  byId("sellerRouteLabel").textContent = `${seller.route || "Ruta"} - ${outsideRoute ? "Fuera de Ruta" : mobileWorkday}`;
  const sessionSeller = byId("mobileSessionSellerLabel");
  if (sessionSeller) sessionSeller.textContent = `${seller.name} - ${outsideRoute ? "Fuera de Ruta" : `Ruta ${seller.route || mobileWorkday}`}`;
  const outsideToggle = byId("outsideRouteToggle");
  if (outsideToggle) outsideToggle.checked = outsideRoute;
  byId("sellerSelect").innerHTML = state.sellers.map((item) => `
    <option value="${escapeHtml(item.name)}" ${item.name === seller.name ? "selected" : ""}>${escapeHtml(item.name)}</option>
  `).join("");
  const daySelect = byId("sellerWorkdaySelect");
  if (daySelect) {
    daySelect.value = outsideRoute ? "Fuera de Ruta" : "Ruta asignada";
  }
  byId("mobileClientSelect").innerHTML = clientsForSeller.map((client) => `
    <option value="${escapeHtml(client.name)}" ${client.name === mobileClient ? "selected" : ""}>${escapeHtml(client.name)}</option>
  `).join("");
  renderMobileClientPicker(clientsForSeller);

  if (selectedClient) {
    const credit = clientAccountSummary(selectedClient.name, getCartSummary().total);
    byId("mobileClientName").textContent = selectedClient.name;
    byId("mobileClientInfo").innerHTML = `
      <span>Saldo ${money.format(credit.currentBalance)} - Limite ${money.format(credit.creditLimit)}</span>
      <span>Deuda vencida ${money.format(credit.overdueDebt)} - Total ${money.format(credit.totalDebt)}</span>
      <span>Ultimo pago: ${escapeHtml(formatLastPayment(credit.lastPayment))}</span>
      <span class="account-inline-status ${accountStatusTone(credit.status)}">${escapeHtml(credit.warning)}</span>
    `;
  }

  renderMobileProductSelect();
  renderMobileCart();
  renderMobileSummary();
  renderDailyRoutePanel();
  renderMobileProgressDashboard();
  renderMobileSalesPanel();
  renderMobileClientHistory();
  renderSellerStatsPanel();
  renderLocationStatus();
  renderMobilePreventaTabs();
  renderAssistantGuide();
}

function getSelectedMobileClient() {
  return state.clients.find((client) => client.name === mobileClient) || null;
}

function getSelectedMobileSeller() {
  return state.sellers.find((seller) => seller.name === mobileSeller) || null;
}

function renderMobilePreventaTabs() {
  const validTabs = new Set(["status", "order", "client", "sales"]);
  if (!validTabs.has(mobilePreventaTab)) mobilePreventaTab = "order";
  document.querySelectorAll("[data-mobile-preventa-tab]").forEach((button) => {
    const active = button.dataset.mobilePreventaTab === mobilePreventaTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll("[data-mobile-preventa-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.mobilePreventaPanel !== mobilePreventaTab;
  });
  const form = byId("mobileClientForm");
  const button = byId("toggleMobileClientFormBtn");
  if (form) form.hidden = mobilePreventaTab !== "client";
  if (button) button.setAttribute("aria-expanded", mobilePreventaTab === "client" ? "true" : "false");
}

function setMobilePreventaTab(tab) {
  mobilePreventaTab = ["status", "order", "client", "sales"].includes(tab) ? tab : "order";
  renderMobilePreventaTabs();
  if (mobilePreventaTab === "client") {
    renderMobileNewClientGpsStatus();
    const field = byId("mobileNewClientName");
    if (field) window.setTimeout(() => field.focus(), 40);
  } else if (mobilePreventaTab === "sales") {
    renderMobileSalesPanel();
    logMobileConsultation("MIS_VENTAS_CONSULTA", "Listado de ventas de jornada");
  }
}

function getClientMapsQuery(client) {
  if (!client) return "";
  return [
    client.domicilio,
    client.localidad && client.localidad !== "Pendiente" ? client.localidad : "Cordoba",
    "Argentina"
  ].filter(Boolean).join(", ");
}

function renderDailyRoutePanel() {
  const container = byId("dailyRouteSteps");
  if (!container) return;
  const seller = getSelectedMobileSeller();
  const client = getSelectedMobileClient();
  const summary = getCartSummary();
  const gpsOk = Boolean(seller && seller.location);
  const hasClient = Boolean(client);
  const hasProducts = summary.lines.length > 0;
  const goals = [
    { ok: gpsOk, label: gpsOk ? "GPS encendido y compartido" : "GPS obligatorio en proceso" },
    { ok: hasClient, label: hasClient ? `Cliente: ${client.name}` : "Seleccionar cliente" },
    { ok: hasProducts, label: hasProducts ? `${summary.lines.length} articulos listos` : "Agregar productos al pedido" },
    { ok: summary.total > 0, label: summary.total > 0 ? `Pedido ${money.format(summary.total)}` : "Enviar pedido para sumar objetivo" }
  ];
  const complete = goals.filter((goal) => goal.ok).length;
  const reward = byId("dailyRewardBadge");
  if (reward) reward.textContent = complete >= 3 ? "Premio diario en marcha" : `${complete}/${goals.length} objetivos`;
  container.innerHTML = goals.map((goal) => `
    <article class="objective-item ${goal.ok ? "done" : ""}">
      <span>${goal.ok ? "OK" : "..."}</span>
      <strong>${escapeHtml(goal.label)}</strong>
    </article>
  `).join("");
  const mapsButton = byId("openMapsBtn");
  if (mapsButton) mapsButton.disabled = !getClientMapsQuery(client);
}

function renderAssistantGuide() {
  const title = byId("assistantTitle");
  const text = byId("assistantText");
  if (!title || !text) return;
  const seller = getSelectedMobileSeller();
  const client = getSelectedMobileClient();
  const summary = getCartSummary();
  const activeView = document.querySelector(".view.active");
  if (!currentUser) {
    title.textContent = "Asistente DL";
    text.textContent = "Ingresar con usuario para empezar.";
    return;
  }
  if (activeView && activeView.id !== "preventa") {
    title.textContent = "Panel activo";
    text.textContent = `${titles[activeView.id] || "Sistema"} listo. Preventa queda sincronizada.`;
    return;
  }
  title.textContent = seller ? `${seller.name}` : "Preventa";
  if (!seller || !seller.location) {
    text.textContent = "GPS obligatorio en proceso. Permitir ubicacion precisa.";
  } else if (!client) {
    text.textContent = "Elegir cliente cargado o crear alta rapida.";
  } else if (!summary.lines.length) {
    text.textContent = `Ruta ${seller.route}. Cargar articulos para ${client.name}.`;
  } else if (summary.shortages.length) {
    text.textContent = "Hay faltantes: el pedido se enviara a abastecimiento sin alterar el stock fisico.";
  } else {
    text.textContent = `${summary.lines.length} articulos listos. Enviar pedido suma objetivo.`;
  }
}

function getMobileClientOptions(seller) {
  const route = String(seller.route || "").toLowerCase();
  const selectedDay = routeModeWorkday();
  const origin = selectedSellerGpsPoint();
  const distanceFor = (client) => {
    const point = clientGpsPoint(client);
    return origin && point ? distanceMeters(origin, point) : Number.POSITIVE_INFINITY;
  };
  const matchesDay = (client) => {
    const day = normalizeWorkday(client.dia_visita || client.day || client.last || "");
    if (selectedDay === "Fuera de Ruta") return true;
    return !day || day === selectedDay;
  };
  return [...state.clients].filter((client) => {
    const assigned = client.seller === seller.name || client.vendedor_asignado === seller.name || !client.seller;
    return assigned && matchesDay(client);
  }).sort((a, b) => {
    const score = (client) => {
      if (client.seller === seller.name) return 0;
      const clientRoute = String(client.ruta || client.zone || client.zona || "").toLowerCase();
      if (route && clientRoute && (clientRoute.includes(route) || route.includes(clientRoute))) return 1;
      if (!client.seller) return 2;
      return 3;
    };
    const scoreDiff = score(a) - score(b);
    if (scoreDiff !== 0) return scoreDiff;
    const distanceDiff = distanceFor(a) - distanceFor(b);
    if (Number.isFinite(distanceDiff) && distanceDiff !== 0) return distanceDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "es");
  });
}

function renderMobileProductSelect() {
  const select = byId("mobileProductSelect");
  if (!select) return;
  select.innerHTML = state.products.map((product) => {
    const code = product.codigo_producto ? `${product.codigo_producto} - ` : "";
    const price = productPriceForUser(product);
    const available = OrderEngine.inventory(product).available;
    const stockLabel = available <= 0 ? "sin disponible" : `disponible ${available}`;
    return `
      <option value="${escapeHtml(product.name)}" ${product.name === mobileProduct ? "selected" : ""}>
        ${escapeHtml(`${code}${product.name} - ${money.format(price)} - ${stockLabel}`)}
      </option>
    `;
  }).join("");
  renderMobileProductPicker();
  renderMobileProductInfo();
  renderMobileCommercialProductOptions();
}

function renderMobileCommercialProductOptions() {
  const select = byId("mobileCommercialProduct");
  if (!select) return;
  const summary = getCartSummary();
  const lines = summary.lines.length ? summary.lines : state.products.slice(0, 80).map((product) => ({ product }));
  select.innerHTML = lines.map((line) => {
    const product = line.product || {};
    const code = product.codigo_producto ? `${product.codigo_producto} - ` : "";
    return `<option value="${escapeHtml(product.codigo_producto || product.name)}">${escapeHtml(`${code}${product.name}`)}</option>`;
  }).join("");
}

function selectedCommercialProduct() {
  const value = byId("mobileCommercialProduct") ? byId("mobileCommercialProduct").value : "";
  return state.products.find((product) => product.codigo_producto === value)
    || state.products.find((product) => product.name === value)
    || null;
}

function updateMobileCommercialRequestVisibility() {
  const type = byId("mobileCommercialChangeType") ? byId("mobileCommercialChangeType").value : "";
  const motiveField = byId("mobileCommercialMotiveField");
  const productField = byId("mobileCommercialProduct");
  const valueField = byId("mobileCommercialValue");
  const status = byId("mobileCommercialStatus");
  if (motiveField) motiveField.hidden = !type;
  if (productField) productField.disabled = type === "general_discount" || !type;
  if (valueField) {
    valueField.disabled = !type;
    valueField.placeholder = type === "price_change" ? "Precio solicitado" : "% descuento solicitado";
  }
  if (status) {
    status.textContent = type
      ? "La solicitud quedara pendiente hasta que Administracion apruebe o rechace."
      : "";
  }
}

function mobileCommercialRequestPayload() {
  const type = byId("mobileCommercialChangeType") ? byId("mobileCommercialChangeType").value : "";
  if (!type) return null;
  const motive = byId("mobileCommercialMotive") ? byId("mobileCommercialMotive").value.trim() : "";
  const proposedValue = Math.max(0, numeric(byId("mobileCommercialValue") ? byId("mobileCommercialValue").value : 0, 0));
  if (!motive) throw new Error("La solicitud comercial requiere motivo obligatorio.");
  if (proposedValue <= 0) throw new Error("Indicar el valor solicitado para la modificacion comercial.");
  const product = selectedCommercialProduct();
  if (type !== "general_discount" && !product) throw new Error("Seleccionar el producto de la solicitud comercial.");
  return {
    type,
    productCode: product ? product.codigo_producto || "" : "",
    productName: product ? product.name : "",
    originalPrice: product ? productPriceForUser(product) : 0,
    proposedValue,
    discountPct: type === "price_change" ? 0 : proposedValue,
    motive
  };
}

function clearMobileCommercialRequest() {
  const type = byId("mobileCommercialChangeType");
  const product = byId("mobileCommercialProduct");
  const value = byId("mobileCommercialValue");
  const motive = byId("mobileCommercialMotive");
  const observations = byId("mobileOrderObservations");
  if (type) type.value = "";
  if (product) product.value = "";
  if (value) value.value = "";
  if (motive) motive.value = "";
  if (observations) observations.value = "";
  updateMobileCommercialRequestVisibility();
}

function setMobilePickerOpen(kind, open) {
  const isClient = kind === "client";
  const panel = byId(isClient ? "mobileClientPickerPanel" : "mobileProductPickerPanel");
  const button = byId(isClient ? "mobileClientPickerBtn" : "mobileProductPickerBtn");
  const otherPanel = byId(isClient ? "mobileProductPickerPanel" : "mobileClientPickerPanel");
  const otherButton = byId(isClient ? "mobileProductPickerBtn" : "mobileClientPickerBtn");
  if (!panel || !button) return;
  if (otherPanel && otherButton) {
    otherPanel.hidden = true;
    otherButton.setAttribute("aria-expanded", "false");
  }
  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    const search = byId(isClient ? "mobileClientSearch" : "mobileProductSearch");
    if (search) {
      search.focus();
      search.select();
    }
  }
}

function renderMobileClientPicker(clientsForSeller = null) {
  const seller = state.sellers.find((item) => item.name === mobileSeller) || state.sellers[0];
  const clients = clientsForSeller || getMobileClientOptions(seller || {});
  const selected = state.clients.find((client) => client.name === mobileClient) || clients[0];
  const label = byId("mobileClientPickerLabel");
  const meta = byId("mobileClientPickerMeta");
  if (label) label.textContent = selected ? selected.name : "Seleccionar cliente";
  if (meta) {
    meta.textContent = selected
      ? `${selected.status || "Sin estado"} - ${selected.ruta || selected.zone || "Sin ruta"}`
      : "Buscar por nombre, ruta o vendedor";
  }
  renderMobileClientOptions(clients);
}

function renderMobileClientOptions(clientsForSeller = null) {
  const seller = state.sellers.find((item) => item.name === mobileSeller) || state.sellers[0];
  const clients = clientsForSeller || getMobileClientOptions(seller || {});
  const list = byId("mobileClientOptions");
  const search = byId("mobileClientSearch");
  if (!list) return;
  const terms = normalizeSearchText(search ? search.value : "").split(/\s+/).filter(Boolean);
  const filteredClients = clients.filter((client) => {
    if (!terms.length) return true;
    return matchesSearch([
      client.name,
      client.codigo_cliente,
      client.razon_social,
      client.ruta,
      client.zone,
      client.zona,
      client.seller,
      client.vendedor_asignado
    ].join(" "), terms);
  });
  const visibleClients = filteredClients.slice(0, 60);
  if (!visibleClients.length) {
    list.innerHTML = '<div class="mobile-picker-empty">Sin clientes para esa busqueda.</div>';
    return;
  }
  list.innerHTML = visibleClients.map((client) => `
    <button class="mobile-picker-option ${client.name === mobileClient ? "active" : ""}" type="button" data-mobile-client-option="${escapeHtml(client.name)}">
      <strong>${escapeHtml(client.name)}</strong>
      <small>${escapeHtml(`${client.codigo_cliente || "S/C"} - ${client.status || "Sin estado"} - ${normalizeWorkday(client.dia_visita) || "Sin dia"} - ${client.ruta || client.zone || "Sin ruta"}${clientGpsPoint(client) && selectedSellerGpsPoint() ? ` - ${Math.round(distanceMeters(selectedSellerGpsPoint(), clientGpsPoint(client)))} m` : " - GPS pendiente"}`)}</small>
    </button>
  `).join("") + (filteredClients.length > visibleClients.length
    ? `<div class="mobile-picker-more">Mostrando 60 de ${filteredClients.length}. Seguir escribiendo para afinar.</div>`
    : "");
}

function renderMobileProductPicker() {
  const product = state.products.find((item) => item.name === mobileProduct);
  const label = byId("mobileProductPickerLabel");
  const meta = byId("mobileProductPickerMeta");
  if (label) label.textContent = product ? product.name : "Seleccionar articulo";
  if (meta) {
    const price = product ? productPriceForUser(product) : 0;
    meta.textContent = product
      ? `${product.codigo_producto || "S/C"} - Disponible ${OrderEngine.inventory(product).available} - ${money.format(price)} - ${currentUserPriceListLabel()}`
      : "Buscar por descripcion, codigo o rubro";
  }
  renderMobileProductOptions();
}

function renderMobileProductOptions() {
  const list = byId("mobileProductOptions");
  const search = byId("mobileProductSearch");
  if (!list) return;
  const terms = normalizeSearchText(search ? search.value : "").split(/\s+/).filter(Boolean);
  const filteredProducts = state.products.filter((product) => {
    if (!terms.length) return true;
    return matchesSearch([
      product.name,
      product.codigo_producto,
      product.codigo_barras,
      product.rubro,
      product.marca,
      product.familia,
      product.segmento
    ].join(" "), terms);
  });
  const visibleProducts = filteredProducts.slice(0, 60);
  if (!visibleProducts.length) {
    list.innerHTML = '<div class="mobile-picker-empty">Sin articulos para esa busqueda.</div>';
    return;
  }
  list.innerHTML = visibleProducts.map((product) => {
    const available = OrderEngine.inventory(product).available;
    const tone = available <= 0 ? "danger" : available < product.min ? "warn" : "ok";
    const price = productPriceForUser(product);
    return `
      <button class="mobile-picker-option ${product.name === mobileProduct ? "active" : ""}" type="button" data-mobile-product-option="${escapeHtml(product.name)}">
        <strong>${escapeHtml(product.name)}</strong>
        <small>${escapeHtml(`${product.codigo_producto || "S/C"} - ${product.rubro || "S/R"} - ${money.format(price)}`)} <span class="stock-dot ${tone}">Disponible ${escapeHtml(available)}</span></small>
      </button>
    `;
  }).join("") + (filteredProducts.length > visibleProducts.length
    ? `<div class="mobile-picker-more">Mostrando 60 de ${filteredProducts.length}. Seguir escribiendo para afinar.</div>`
    : "");
}

function renderMobileProductInfo() {
  const info = byId("mobileProductInfo");
  const addButton = byId("addMobileProductBtn");
  const qtyInput = byId("mobileProductQty");
  if (!info || !addButton || !qtyInput) return;
  const product = state.products.find((item) => item.name === mobileProduct);
  if (!product) {
    info.textContent = "No hay articulos cargados en el catalogo.";
    addButton.disabled = true;
    return;
  }
  const qty = Math.max(1, Number(qtyInput.value || 1));
  const code = product.codigo_producto ? `Codigo ${product.codigo_producto} - ` : "";
  const rubric = product.rubro && product.rubro !== "S/D" ? `${product.rubro} - ` : "";
  const stock = OrderEngine.inventory(product);
  const price = productPriceForUser(product);
  info.textContent = `${code}${rubric}Disponible ${stock.available} - Fisico ${stock.physical} - En transito ${stock.inTransit} - Precio ${money.format(price)} - ${currentUserPriceListLabel()} - Subtotal ${money.format(qty * price)}`;
  addButton.disabled = false;
}

function renderMobileCart() {
  const container = byId("phoneProducts");
  if (!container) return;
  const summary = getCartSummary();
  if (!summary.lines.length) {
    container.innerHTML = '<article class="cart-empty"><strong>Pedido sin articulos</strong><span>Seleccionar un producto, indicar cantidad y tocar Agregar.</span></article>';
    renderMobileCommercialProductOptions();
    return;
  }
  container.innerHTML = summary.lines.map((line, index) => {
    const product = line.product;
    const qty = Number(mobileCart[product.name] || 0);
    const stock = OrderEngine.inventory(product);
    const tone = qty > stock.available ? "danger" : stock.available < product.min ? "warn" : "ok";
    const stockLabel = qty > stock.available
      ? `Reserva ${stock.available}, faltan ${qty - stock.available}`
      : `Disponible para reservar ${stock.available}`;
    return `
      <article class="product-line">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <span class="tag ${tone}">${stockLabel}</span>
          <small>${money.format(product.price)} x unidad - ${money.format(line.total)}</small>
        </div>
        <div class="cart-actions">
          <input class="qty-input" data-cart-product="${escapeHtml(product.name)}" type="number" min="0" max="999" value="${qty}" inputmode="numeric" aria-label="Cantidad ${index + 1}">
          <button class="mini-btn" data-remove-cart="${escapeHtml(product.name)}" type="button">Quitar</button>
        </div>
      </article>
    `;
  }).join("");
  renderMobileCommercialProductOptions();
}

function renderMobileSummary() {
  const summary = getCartSummary();
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  const client = getSelectedMobileClient();
  const credit = client ? clientAccountSummary(client.name, summary.total) : null;
  const creditBlocked = Boolean(credit && credit.requiresAuthorization && !canAuthorizeCredit());
  const nextCommission = cartCommission(summary).seller || {};
  byId("mobileSummary").innerHTML = `
    <div>
      <span>Total pedido</span>
      <strong>${money.format(summary.total)}</strong>
    </div>
    <div>
      <span>Comision de este pedido</span>
      <strong>${money.format(nextCommission.total || 0)}</strong>
    </div>
    <div>
      <span>Ventas del vendedor</span>
      <strong>${money.format(seller ? sellerSalesValue(seller.name) : 0)}</strong>
    </div>
    <div>
      <span>Comision acumulada</span>
      <strong>${money.format(seller ? sellerCommissionValue(seller.name) : 0)}</strong>
    </div>
    ${summary.shortages.length
      ? `<p class="stock-error">El pedido se registrara pendiente de abastecimiento. ${summary.shortages.join(" ")}</p>`
      : '<p class="stock-ok">Stock completo: el pedido quedara listo para armado.</p>'}
    ${credit ? `<p class="${credit.requiresAuthorization ? "stock-error" : "stock-ok"}">Cuenta corriente: ${escapeHtml(credit.warning)} Proyectado ${money.format(credit.projectedBalance)}.</p>` : ""}
  `;
  byId("sendMobileOrderBtn").disabled = summary.total <= 0 || creditBlocked;
}

function mobileCommercialStats(seller) {
  if (!seller) {
    return {
      assignedClients: [],
      sellerOrders: [],
      noPurchaseVisits: [],
      assignedCount: 0,
      visitedCount: 0,
      pendingCount: 0,
      withPurchase: 0,
      withoutPurchase: 0,
      progress: 0,
      effectiveness: 0,
      sales: 0,
      commission: 0,
      avgTicket: 0,
      whatsappContacts: 0,
      visitedClients: new Set(),
      purchaseClients: new Set(),
      noPurchaseClients: new Set()
    };
  }
  const assignedClients = getMobileClientOptions(seller);
  const assignedNames = new Set(assignedClients.map((client) => normalizeSearchText(client.name)));
  const sellerOrders = state.orders.filter((order) => (
    order.seller === seller.name
    && orderHappenedToday(order)
    && (!assignedNames.size || assignedNames.has(normalizeSearchText(order.client)))
  ));
  const noPurchaseVisits = (state.noPurchaseVisits || []).filter((visit) => (
    visit.seller === seller.name
    && dashboardDateIsToday(visit.at || visit.date)
    && (normalizeWorkday(visit.workday) || routeModeWorkday()) === routeModeWorkday()
  ));
  const purchaseClients = new Set(sellerOrders.map((order) => normalizeSearchText(order.client)));
  const noPurchaseClients = new Set(noPurchaseVisits.map((visit) => normalizeSearchText(visit.client)));
  const visitedClients = new Set([...purchaseClients, ...noPurchaseClients]);
  const assignedCount = assignedClients.length;
  const visitedCount = visitedClients.size;
  const pendingCount = Math.max(0, assignedCount - visitedCount);
  const withPurchase = purchaseClients.size;
  const withoutPurchase = [...noPurchaseClients].filter((client) => !purchaseClients.has(client)).length;
  const progress = assignedCount ? Math.round((visitedCount / assignedCount) * 100) : 0;
  const effectiveness = visitedCount ? Math.round((withPurchase / visitedCount) * 100) : 0;
  const sales = sellerOrders.reduce((total, order) => total + numeric(order.amount, 0), 0);
  const commission = sellerOrders.reduce((total, order) => total + numeric((orderCommission(order).seller || {}).total, 0), 0);
  const avgTicket = sellerOrders.length ? Math.round(sales / sellerOrders.length) : 0;
  const whatsappContacts = (state.whatsappContacts || []).filter((item) => (
    item.seller === seller.name
    && dashboardDateIsToday(item.at || item.date)
  )).length;
  return {
    assignedClients,
    sellerOrders,
    noPurchaseVisits,
    assignedCount,
    visitedCount,
    pendingCount,
    withPurchase,
    withoutPurchase,
    progress,
    effectiveness,
    sales,
    commission,
    avgTicket,
    whatsappContacts,
    visitedClients,
    purchaseClients,
    noPurchaseClients
  };
}

function progressTone(progress) {
  if (progress >= 75) return "ok";
  if (progress >= 40) return "warn";
  return "danger";
}

function renderMobileProgressDashboard() {
  const container = byId("mobileProgressDashboard");
  if (!container) return;
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  const stats = mobileCommercialStats(seller);
  const target = stats.assignedCount || 20;
  const progress = target ? Math.min(100, Math.round((stats.visitedCount / target) * 100)) : 0;
  const tone = progressTone(progress);
  const gpsText = seller && seller.location ? "Activo" : "Pendiente";
  container.innerHTML = `
    <section class="mobile-progress-hero" data-tone="${tone}">
      <div>
        <small>Estado general</small>
        <strong>${stats.visitedCount} / ${target}</strong>
        <span>Objetivo diario</span>
      </div>
      <div class="mobile-progress-bar" aria-label="Avance ${progress}%">
        <i style="width: ${progress}%"></i>
      </div>
    </section>
    <section class="mobile-commercial-grid">
      <article><span>Visitados</span><strong>${stats.visitedCount}</strong></article>
      <article><span>Ventas</span><strong>${stats.withPurchase}</strong></article>
      <article><span>Pendientes</span><strong>${stats.pendingCount}</strong></article>
      <article><span>Sin compra</span><strong>${stats.withoutPurchase}</strong></article>
      <article><span>WhatsApp</span><strong>${stats.whatsappContacts}</strong></article>
      <article><span>Importe vendido</span><strong>${money.format(stats.sales)}</strong></article>
      <article><span>Comision</span><strong>${money.format(stats.commission)}</strong></article>
      <article><span>Cumplimiento</span><strong>${progress}%</strong></article>
      <article><span>Ticket promedio</span><strong>${money.format(stats.avgTicket)}</strong></article>
      <article><span>Pedidos</span><strong>${stats.sellerOrders.length}</strong></article>
      <article><span>GPS</span><strong>${gpsText}</strong></article>
    </section>
  `;
}

function mobileSalesOrders() {
  const seller = getSelectedMobileSeller();
  if (!seller) return [];
  const terms = normalizeSearchText(mobileSalesSearchTerm).split(/\s+/).filter(Boolean);
  return state.orders
    .filter((order) => order.seller === seller.name && orderHappenedToday(order))
    .filter((order) => {
      if (!terms.length) return true;
      return matchesSearch([
        order.code,
        order.client,
        order.status,
        order.paymentMethod,
        order.amount,
        order.createdAt,
        order.receivedAt
      ].join(" "), terms);
    })
    .sort((a, b) => new Date(b.createdAt || b.receivedAt || 0) - new Date(a.createdAt || a.receivedAt || 0));
}

function mobileSalesSummary(orders = mobileSalesOrders()) {
  const total = orders.reduce((sum, order) => sum + numeric(order.amount, 0), 0);
  const commission = orders.reduce((sum, order) => sum + numeric((orderCommission(order).seller || {}).total, 0), 0);
  return {
    count: orders.length,
    total,
    avg: orders.length ? Math.round(total / orders.length) : 0,
    commission
  };
}

function mobileSaleDate(order) {
  const at = order.createdAt || order.receivedAt || order.updatedAt || "";
  const date = at ? new Date(at) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: "-", time: "-" };
  return {
    date: date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  };
}

function orderDetailLines(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : OrderEngine.parseProductText(order.products || "");
  return items.map((item) => {
    const name = item.name || item.product || item.descripcion || "Articulo";
    const qty = numeric(item.qty ?? item.requestedQty ?? item.cantidad, 1);
    const unit = numeric(item.unitPrice ?? item.price ?? item.precio, 0);
    const discountPct = numeric(item.discountPct ?? item.discount ?? item.descuento, 0);
    const total = numeric(item.lineTotal ?? item.total, qty * unit);
    return { name, qty, unit, discountPct, total };
  });
}

function renderMobileSalesPanel() {
  const list = byId("mobileSalesList");
  const detail = byId("mobileSalesDetail");
  const summaryBox = byId("mobileSalesSummary");
  if (!list || !detail || !summaryBox) return;
  const orders = mobileSalesOrders();
  if (!mobileSalesSelectedOrderCode || !orders.some((order) => order.code === mobileSalesSelectedOrderCode)) {
    mobileSalesSelectedOrderCode = orders[0] ? orders[0].code : "";
  }
  if (!orders.length) {
    list.innerHTML = '<article class="cart-empty"><strong>Sin ventas registradas hoy</strong><span>Cuando envies pedidos desde Preventa apareceran aca.</span></article>';
  } else {
    list.innerHTML = orders.map((order) => {
      const parts = mobileSaleDate(order);
      const commission = numeric((orderCommission(order).seller || {}).total, 0);
      return `
        <button class="mobile-sale-row ${order.code === mobileSalesSelectedOrderCode ? "active" : ""}" type="button" data-mobile-sale="${escapeHtml(order.code)}">
          <strong>${escapeHtml(order.code)}</strong>
          <span>${escapeHtml(parts.date)} ${escapeHtml(parts.time)}</span>
          <b>${escapeHtml(order.client || "Sin cliente")}</b>
          <em>${money.format(numeric(order.amount, 0))}</em>
          <span class="sale-commission">${money.format(commission)}</span>
          <small>${escapeHtml(order.status || "Pendiente")} - ${escapeHtml(order.paymentMethod || "Sin forma de pago")}</small>
        </button>
      `;
    }).join("");
  }
  const selected = orders.find((order) => order.code === mobileSalesSelectedOrderCode);
  if (!selected) {
    detail.innerHTML = '<small>Detalle</small><strong>Seleccionar una venta</strong><p>No hay venta seleccionada.</p>';
  } else {
    const lines = orderDetailLines(selected);
    detail.innerHTML = `
      <small>Detalle de venta</small>
      <strong>${escapeHtml(selected.code)} - ${escapeHtml(selected.client)}</strong>
      <p>Estado: ${escapeHtml(selected.status || "Pendiente")} - Forma de pago: ${escapeHtml(selected.paymentMethod || "Sin informar")}</p>
      <div class="mobile-sale-products">
        ${lines.map((line) => `
          <span>
            <b>${escapeHtml(line.name)}</b>
            <small>${line.qty} x ${money.format(line.unit)}${line.discountPct ? ` - desc. ${line.discountPct}%` : ""} = ${money.format(line.total)}</small>
          </span>
        `).join("") || "<span><b>Sin detalle de articulos</b></span>"}
      </div>
      ${selected.observations || selected.observaciones ? `<p>Obs: ${escapeHtml(selected.observations || selected.observaciones)}</p>` : ""}
      ${selected.commercialApproval ? `<p>Solicitud comercial: ${escapeHtml(selected.commercialApproval.status || "Pendiente")} - ${escapeHtml(selected.commercialApproval.motive || "")}</p>` : ""}
    `;
  }
  const totals = mobileSalesSummary(orders);
  summaryBox.innerHTML = `
    <div><span>Cantidad de pedidos</span><strong>${totals.count}</strong></div>
    <div><span>Total vendido</span><strong>${money.format(totals.total)}</strong></div>
    <div><span>Promedio</span><strong>${money.format(totals.avg)}</strong></div>
    <div><span>Comision generada</span><strong>${money.format(totals.commission)}</strong></div>
  `;
}

function exportMobileSalesCsv() {
  const orders = mobileSalesOrders();
  const rows = [
    ["Numero", "Fecha", "Hora", "Cliente", "Importe", "Estado", "Forma de pago", "Comision"],
    ...orders.map((order) => {
      const parts = mobileSaleDate(order);
      return [order.code, parts.date, parts.time, order.client, numeric(order.amount, 0), order.status, order.paymentMethod || "", numeric((orderCommission(order).seller || {}).total, 0)];
    })
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadBlob(`mis-ventas-${safeFilePart(mobileSeller)}-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  logMobileConsultation("MIS_VENTAS_EXPORT_CSV", `${orders.length} ventas exportadas`);
}

function exportMobileSalesPdf() {
  const orders = mobileSalesOrders();
  const totals = mobileSalesSummary(orders);
  const lines = [
    `Vendedor: ${mobileSeller}`,
    `Pedidos: ${totals.count}`,
    `Total vendido: ${money.format(totals.total)}`,
    `Promedio: ${money.format(totals.avg)}`,
    `Comision: ${money.format(totals.commission)}`,
    "",
    ...orders.flatMap((order) => {
      const parts = mobileSaleDate(order);
      const commission = numeric((orderCommission(order).seller || {}).total, 0);
      return [`${order.code} | ${parts.date} ${parts.time} | ${order.client} | ${money.format(numeric(order.amount, 0))} | Comision ${money.format(commission)} | ${order.status}`];
    })
  ];
  downloadBlob(`mis-ventas-${safeFilePart(mobileSeller)}-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Mis Ventas", lines));
  logMobileConsultation("MIS_VENTAS_EXPORT_PDF", `${orders.length} ventas exportadas`);
}

function clientPurchaseHistory(client) {
  if (!client) return null;
  const clientKey = normalizeSearchText(client.name || client.nombre_comercial || "");
  const orders = state.orders
    .filter((order) => normalizeSearchText(order.client) === clientKey)
    .sort((a, b) => new Date(b.createdAt || b.receivedAt || 0) - new Date(a.createdAt || a.receivedAt || 0));
  const visits = (state.noPurchaseVisits || [])
    .filter((visit) => normalizeSearchText(visit.client) === clientKey)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  const products = new Map();
  orders.forEach((order) => {
    orderDetailLines(order).forEach((line) => {
      const key = normalizeSearchText(line.name);
      const current = products.get(key) || { name: line.name, qty: 0, total: 0 };
      current.qty += numeric(line.qty, 0);
      current.total += numeric(line.total, 0);
      products.set(key, current);
    });
  });
  const lastOrder = orders[0] || null;
  const lastVisitAt = lastOrder && (lastOrder.createdAt || lastOrder.receivedAt) || visits[0]?.at || "";
  const lastVisitDate = lastVisitAt ? new Date(lastVisitAt) : null;
  const daysSince = lastVisitDate && !Number.isNaN(lastVisitDate.getTime())
    ? Math.max(0, Math.floor((Date.now() - lastVisitDate.getTime()) / 86400000))
    : null;
  const account = clientAccountSummary(client.name, 0);
  return {
    orders,
    lastOrder,
    lastVisitAt,
    daysSince,
    topProducts: Array.from(products.values()).sort((a, b) => b.qty - a.qty || b.total - a.total).slice(0, 5),
    average: orders.length ? Math.round(orders.reduce((sum, order) => sum + numeric(order.amount, 0), 0) / orders.length) : 0,
    account,
    pendingClaims: (state.notifications || []).filter((item) => normalizeSearchText(item.entityLabel || item.text || "").includes(clientKey) && String(item.category || "").toLowerCase().includes("reclamo")).length
  };
}

function renderMobileClientHistory() {
  const card = byId("mobileClientHistoryCard");
  if (!card) return;
  const client = getSelectedMobileClient();
  if (!mobileClientHistoryOpen || !client) {
    card.hidden = true;
    return;
  }
  const history = clientPurchaseHistory(client);
  card.hidden = false;
  card.innerHTML = `
    <small>Historial del cliente</small>
    <strong>${escapeHtml(client.name)}</strong>
    <div class="mobile-history-grid">
      <span><b>Ultima visita</b>${escapeHtml(history.lastVisitAt ? formatOrderTime(history.lastVisitAt) : "Sin visitas")}</span>
      <span><b>Ultimo vendedor</b>${escapeHtml(history.lastOrder?.seller || client.seller || client.vendedor_asignado || "Sin dato")}</span>
      <span><b>Promedio</b>${money.format(history.average)}</span>
      <span><b>Dias desde compra</b>${history.daysSince === null ? "Sin dato" : `${history.daysSince}`}</span>
      <span><b>Saldo</b>${money.format(history.account.currentBalance)}</span>
      <span><b>Reclamos</b>${history.pendingClaims}</span>
    </div>
    <div class="mobile-sale-products">
      <span><b>Ultimas compras</b><small>${history.orders.slice(0, 10).map((order) => `${order.code} ${money.format(numeric(order.amount, 0))}`).join(" / ") || "Sin compras"}</small></span>
      <span><b>Productos mas comprados</b><small>${history.topProducts.map((item) => `${item.name} x${item.qty}`).join(" / ") || "Sin historial"}</small></span>
      <span><b>Observaciones</b><small>${escapeHtml(client.observaciones || client.observations || "Sin observaciones")}</small></span>
    </div>
  `;
}

async function logMobileConsultation(action, note) {
  const key = `${action}:${note}:${mobileSeller}:${new Date().toLocaleDateString("en-CA")}`;
  if (lastMobileConsultationAuditKey === key) return;
  lastMobileConsultationAuditKey = key;
  try {
    await postOperationalAction("api/preventa/audit-consultation", {
      action,
      seller: mobileSeller,
      note,
      gps: lastOwnLocation && lastOwnLocation.location || null
    });
  } catch {
    lastMobileConsultationAuditKey = "";
  }
}

async function openSelectedClientWhatsApp() {
  const client = getSelectedMobileClient();
  if (!client) return;
  const phone = String(client.telefono || client.phone || "").replace(/\D/g, "");
  if (!phone) {
    window.alert("El cliente no tiene telefono cargado.");
    return;
  }
  const targetPhone = phone.startsWith("54") ? phone : `54${phone}`;
  const message = encodeURIComponent(`Hola ${client.name}, te contactamos de Distribuidora Lopez.`);
  try {
    await postOperationalAction("api/preventa/whatsapp-contact", {
      client: client.name,
      seller: mobileSeller,
      phone: targetPhone,
      gps: lastOwnLocation && lastOwnLocation.location || null
    });
  } catch {}
  openExternalUrl(`https://wa.me/${targetPhone}?text=${message}`, "WhatsApp cliente");
}

function renderSellerStatsPanel() {
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  if (!seller) return;
  const stats = mobileCommercialStats(seller);
  byId("sellerStatsPanel").innerHTML = `
    <article class="flow-card">
      <strong>${escapeHtml(seller.name)}</strong>
      <p>${escapeHtml(routeModeWorkday())} - Ruta ${escapeHtml(seller.route)}</p>
      <span>${stats.visitedCount}/${stats.assignedCount} clientes visitados</span>
    </article>
    <article class="flow-card">
      <strong>Avance de jornada</strong>
      <p>Pendientes ${stats.pendingCount} - Sin compra ${stats.withoutPurchase}</p>
      <span>${stats.progress}% avance</span>
    </article>
    <article class="flow-card">
      <strong>Efectividad</strong>
      <p>Con compra ${stats.withPurchase} - Sin compra ${stats.withoutPurchase}</p>
      <span>${stats.effectiveness}% efectividad</span>
    </article>
    <article class="flow-card">
      <strong>Ventas realizadas</strong>
      <p>${stats.sellerOrders.length} pedidos - Ticket ${money.format(stats.avgTicket)}</p>
      <span>${money.format(stats.sales)}</span>
    </article>
    <article class="flow-card">
      <strong>WhatsApp</strong>
      <p>Clientes contactados durante la jornada.</p>
      <span>${stats.whatsappContacts} contactos</span>
    </article>
    <article class="flow-card">
      <strong>Comision generada</strong>
      <p>Segun reglas por rubro y producto.</p>
      <span>${money.format(stats.commission)}</span>
    </article>
    <article class="flow-card">
      <strong>Comision acumulada</strong>
      <p>Total acumulado historico del vendedor.</p>
      <span>${money.format(sellerCommissionValue(seller.name))}</span>
    </article>
    <article class="flow-card">
      <strong>Clientes pendientes</strong>
      <p>${stats.assignedClients.slice(0, 3).filter((client) => !stats.visitedClients.has(normalizeSearchText(client.name))).map((client) => client.name).join(" / ") || "Jornada completa o sin cartera"}</p>
      <span>${stats.pendingCount} pendientes</span>
    </article>
    <article class="flow-card">
      <strong>Ubicacion</strong>
      <p>${seller.location ? `${seller.location.lat.toFixed(5)}, ${seller.location.lng.toFixed(5)}` : "Sin ubicacion informada"}</p>
      <span>${seller.location ? `${gpsTrustLabel(seller.location)} - ${seller.location.updatedAt}` : "GPS pendiente"}</span>
    </article>
  `;
}

function renderLocationStatus() {
  const status = byId("locationStatus");
  if (!status) return;
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  if (!seller || !seller.location) {
    status.textContent = "GPS obligatorio iniciando. Permitir ubicacion precisa si Android lo solicita.";
    setGpsBadge("Iniciando", "warn");
    return;
  }
  const warning = gpsAccuracyWarning(seller.location);
  const battery = Number.isFinite(Number(seller.location.battery)) ? ` - bateria ${Math.round(Number(seller.location.battery))}%` : "";
  status.textContent = `${gpsTrustLabel(seller.location)}: ${seller.location.lat.toFixed(5)}, ${seller.location.lng.toFixed(5)} - ${seller.location.updatedAt}${seller.location.provider ? ` - ${seller.location.provider}` : ""}${battery}`;
  setGpsBadge(warning ? "Precision baja" : "Encendido", warning ? "warn" : "ok");
}

function setGpsBadge(text, tone) {
  const badge = byId("gpsStatusBadge");
  if (!badge) return;
  badge.dataset.tone = tone || "warn";
  badge.innerHTML = `<i></i>${escapeHtml(text)}`;
}

function openBatteryOptimizationSettings() {
  try {
    if (window.AndroidLocation && typeof window.AndroidLocation.openBatterySettings === "function") {
      window.AndroidLocation.openBatterySettings();
      return;
    }
    if (window.AndroidConnection && typeof window.AndroidConnection.openExternalUrl === "function") {
      window.AndroidConnection.openExternalUrl("intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end");
      return;
    }
  } catch {}
  window.alert("En Android abrir Ajustes > Aplicaciones > DL Preventa > Bateria y permitir uso sin restricciones.");
}

function locationSourceLabel(source) {
  if (source === "native") return "GPS real nativo";
  if (source === "gps") return "GPS real navegador";
  if (source === "demo") return "Ubicacion DEMO Cordoba";
  if (source === "simulada") return "Ubicacion simulada";
  return "Ubicacion";
}

function getCartSummary() {
  const lines = state.products.map((product) => {
    const qty = Number(mobileCart[product.name] || 0);
    const pricedProduct = productWithUserPrice(product);
    return { product: pricedProduct, qty, total: qty * pricedProduct.price };
  }).filter((line) => line.qty > 0);
  const shortages = lines
    .map((line) => {
      const available = OrderEngine.inventory(line.product).available;
      return line.qty > available ? `${line.product.name}: faltan ${line.qty - available}.` : "";
    })
    .filter(Boolean);
  return {
    lines,
    errors: [],
    shortages,
    total: lines.reduce((sum, line) => sum + line.total, 0)
  };
}

function activePresenceMapPoints() {
  const sellerByName = new Map((state.sellers || []).map((seller) => [seller.name, seller]));
  return uniquePresenceSessions(presenceSessions)
    .filter((session) => session.location)
    .filter((session) => ["seller", "driver"].includes(session.role))
    .filter((session) => {
      if (presenceMapFilter === "seller") return session.role === "seller";
      if (presenceMapFilter === "driver") return session.role === "driver";
      if (presenceMapFilter === "alert") return ["danger", "warn", "stale"].includes(session.mapTone || "");
      return true;
    })
    .map((session) => {
      const seller = sellerByName.get(session.sellerName || session.name) || {};
      const location = normalizeGpsLocation(session.location, session.lastGpsAt || session.lastPresenceAt || session.lastSeenAt);
      return {
        id: session.sessionId,
        name: session.name || session.username,
        username: session.username,
        role: session.role,
        roleLabel: roleLabel(session.role),
        route: seller.route || session.device && session.device.label || (session.role === "driver" ? "Reparto" : "Ventas"),
        status: session.status || "Disponible",
        gps: session.gpsWarning || gpsAccuracyWarning(location) || session.status || "GPS activo",
        location,
        device: session.device || {},
        mapTone: session.mapTone || "ok",
        lastPresenceAt: session.lastPresenceAt || session.lastHeartbeatAt || session.lastSeenAt || ""
      };
    });
}

function renderRoutes() {
  renderPresenceMapFilters();
  if (canUseGoogleMaps()) {
    renderGoogleRoutes();
  } else if (window.DL_CONFIG && window.DL_CONFIG.USE_GOOGLE_MAPS === true) {
    renderGoogleMapsError("Google Maps no esta configurado", "Falta la clave de API en maps-config.js o en la variable GOOGLE_MAPS_API_KEY.");
  } else {
    renderFallbackRoutes();
  }

  renderRouteList();
}

function renderPresenceMapFilters(targetId = "presenceMapFilters") {
  const wrapper = byId(targetId);
  if (!wrapper) return;
  const counts = uniquePresenceSessions(presenceSessions)
    .filter((session) => session.location)
    .filter((session) => ["seller", "driver"].includes(session.role))
    .reduce((acc, session) => {
      acc.all += 1;
      acc[session.role] += 1;
      if (["danger", "warn", "stale"].includes(session.mapTone || "")) acc.alert += 1;
      return acc;
    }, { all: 0, seller: 0, driver: 0, alert: 0 });
  wrapper.innerHTML = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "seller", label: "Vendedores", count: counts.seller },
    { key: "driver", label: "Repartidores", count: counts.driver },
    { key: "alert", label: "Alertas GPS", count: counts.alert }
  ].map((item) => `
    <button class="mini-btn ${presenceMapFilter === item.key ? "active" : ""}" type="button" data-presence-map-filter="${item.key}">
      ${escapeHtml(item.label)} <span>${item.count}</span>
    </button>
  `).join("");
}

function renderFallbackRoutes() {
  const mapElement = byId("routeMap");
  if (!mapElement) return;
  mapElement.classList.remove("google-loaded", "google-error");
  mapElement.dataset.mapMode = "fallback";
  const located = activePresenceMapPoints();
  const bounds = getLocationBounds(located);
  if (!located.length) {
    mapElement.innerHTML = '<div class="empty-note">Sin ubicaciones GPS reales activas.</div>';
    return;
  }
  mapElement.innerHTML = located.map((seller, index) => {
    const point = getMapPoint(seller.location, bounds, index);
    return `
      <span class="route-dot" style="left:${point.x}%; top:${point.y}%;" title="${escapeHtml(seller.name)}"></span>
      <article class="map-label" style="left:${Math.min(82, point.x + 3)}%; top:${Math.max(4, point.y - 4)}%;">
        <strong>${escapeHtml(seller.name)}</strong>
        <span>${escapeHtml(gpsTrustLabel(seller.location))} - ${escapeHtml(seller.location.updatedAt)}</span>
      </article>
    `;
  }).join("");
}

function renderRouteList() {
  const routeList = byId("routeList");
  if (!routeList) return;
  const points = activePresenceMapPoints();
  routeList.innerHTML = points.length ? points.map((seller) => `
    <article class="stock-item">
      <strong>${escapeHtml(seller.name)} - ${escapeHtml(seller.roleLabel)}</strong>
      <p>${escapeHtml(seller.route)} - ${escapeHtml(seller.status)} - ${seller.location ? `${gpsTrustLabel(seller.location)} - ${seller.location.lat.toFixed(5)}, ${seller.location.lng.toFixed(5)} - ${seller.location.updatedAt}` : "sin ubicacion"}</p>
      <div class="stock-meter"><span style="width:${seller.mapTone === "ok" ? 100 : seller.mapTone === "warn" ? 65 : 35}%"></span></div>
    </article>
  `).join("") : '<article class="stock-item"><strong>Sin presencia activa</strong><p>Los usuarios sin heartbeat quedan fuera del mapa operativo.</p></article>';
}

function presencePointAgeMs(point) {
  const at = point && point.location && (point.location.serverAt || point.location.updatedAt || point.lastPresenceAt);
  const time = new Date(at || 0).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Date.now() - time);
}

function presenceAgeLabel(point) {
  const age = presencePointAgeMs(point);
  if (age === null) return "sin hora";
  if (age < 60000) return `${Math.max(1, Math.round(age / 1000))} seg`;
  return sessionDuration(age);
}

function presenceLocationActionId(point) {
  return String(point && (point.id || point.username || point.name) || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function presenceMapsUrl(point) {
  const location = point && point.location;
  if (!location) return "";
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function presenceLocationText(point) {
  if (!point || !point.location) return "";
  const lat = Number(point.location.lat);
  const lng = Number(point.location.lng);
  const updatedAt = formatOrderTime(point.location.serverAt || point.lastPresenceAt || point.location.updatedAt);
  return [
    `${point.name || point.username || "Usuario"} (${point.roleLabel || point.role || "sin rol"})`,
    `Estado: ${point.status || "Disponible"}`,
    `Ruta/Zona: ${point.route || "-"}`,
    `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    `Precision: ${Math.round(Number(point.location.accuracy || 0)) || "S/D"} m`,
    `Actualizado: ${updatedAt || presenceAgeLabel(point)}`,
    `Maps: ${presenceMapsUrl(point)}`
  ].join("\n");
}

function presenceLocationActionsHtml(point, compact = false) {
  const actionId = presenceLocationActionId(point);
  const mapsUrl = presenceMapsUrl(point);
  if (!actionId || !mapsUrl) return "";
  presenceLocationActions.set(actionId, point);
  return `
    <div class="presence-location-actions ${compact ? "compact" : ""}">
      <a class="mini-btn" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer" data-presence-open-maps="${escapeHtml(actionId)}">Abrir Maps</a>
      <button class="mini-btn" type="button" data-presence-copy-gps="${escapeHtml(actionId)}">Copiar GPS</button>
      <button class="mini-btn" type="button" data-presence-copy-card="${escapeHtml(actionId)}">Copiar ficha</button>
    </div>
  `;
}

async function copyTextToClipboard(text, successMessage = "Copiado.") {
  const value = String(text || "").trim();
  if (!value) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      showCompactNotice(successMessage, "ok");
      return true;
    }
  } catch {
    // Usar fallback compatible con HTTP/WebView.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (copied) {
      showCompactNotice(successMessage, "ok");
      return true;
    }
  } catch {
    // Si el navegador bloquea, devolvemos falso.
  }
  window.prompt("Copiar ubicacion GPS:", value);
  return false;
}

function renderDashboardPresence() {
  const mapElement = byId("dashboardLivePresenceMap");
  const listElement = byId("dashboardLivePresenceList");
  if (!mapElement || !listElement || !isAdminUser()) return;
  const now = Date.now();
  if (
    dashboardPresenceLastRenderAt
      && now - dashboardPresenceLastRenderAt < Number(sessionSettings.locationMovingIntervalMs || 10000)
  ) {
    return;
  }
  dashboardPresenceLastRenderAt = now;
  renderPresenceMapFilters("dashboardPresenceFilters");
  const points = activePresenceMapPoints();
  const sellersCount = points.filter((point) => point.role === "seller").length;
  const driversCount = points.filter((point) => point.role === "driver").length;
  const alertCount = points.filter((point) => ["danger", "warn", "stale", "offline"].includes(point.mapTone || "")).length;
  const summary = byId("dashboardPresenceSummary");
  if (summary) {
    summary.innerHTML = `
      <span>Online <strong>${points.length}</strong></span>
      <span>Vendedores <strong>${sellersCount}</strong></span>
      <span>Repartidores <strong>${driversCount}</strong></span>
      <span>Alertas <strong>${alertCount}</strong></span>
    `;
  }

  if (canUseGoogleMaps()) {
    renderDashboardGooglePresence(points);
  } else if (window.DL_CONFIG && window.DL_CONFIG.USE_GOOGLE_MAPS === true) {
    renderDashboardGooglePresenceError("Google Maps no esta configurado", "Falta la clave de API en maps-config.js o en la variable GOOGLE_MAPS_API_KEY.");
  } else {
    renderDashboardFallbackPresence(points);
  }

  presenceLocationActions = new Map();
  listElement.innerHTML = points.length ? points.map((point) => `
    <article class="stock-item presence-live-card ${escapeHtml(point.role)} ${escapeHtml(point.mapTone || "ok")}">
      <div class="line">
        <strong>${escapeHtml(point.name)}</strong>
        <span class="tag ${point.mapTone === "ok" ? "ok" : point.mapTone === "warn" ? "warn" : "danger"}">${escapeHtml(point.status || "Disponible")}</span>
      </div>
      <p>${escapeHtml(point.roleLabel)} - ${escapeHtml(point.route)} - ${escapeHtml(gpsTrustLabel(point.location))}</p>
      <p><code>${point.location.lat.toFixed(5)}, ${point.location.lng.toFixed(5)}</code> actualizado hace ${escapeHtml(presenceAgeLabel(point))}</p>
      <p>Equipo: ${escapeHtml(point.device.label || point.device.id || "sin etiqueta")}</p>
      ${presenceLocationActionsHtml(point, true)}
    </article>
  `).join("") : '<article class="stock-item"><strong>Sin GPS activo</strong><p>Abrir la APK de vendedor o reparto, iniciar sesion y permitir ubicacion precisa.</p></article>';
}

function renderDashboardFallbackPresence(points) {
  const mapElement = byId("dashboardLivePresenceMap");
  if (!mapElement) return;
  dashboardPresenceGoogleMarkers.forEach((marker) => marker.setMap && marker.setMap(null));
  dashboardPresenceGoogleMarkers = [];
  dashboardPresenceGoogleMap = null;
  dashboardPresenceGoogleSignature = "";
  mapElement.classList.remove("google-loaded", "google-error");
  mapElement.dataset.mapMode = "fallback";
  if (!points.length) {
    mapElement.innerHTML = '<div class="empty-note">Sin ubicaciones GPS reales activas.</div>';
    return;
  }
  const bounds = getLocationBounds(points);
  mapElement.innerHTML = points.map((point, index) => {
    const position = getMapPoint(point.location, bounds, index);
    const toneClass = point.mapTone && point.mapTone !== "ok" ? point.mapTone : point.role;
    const actionId = presenceLocationActionId(point);
    presenceLocationActions.set(actionId, point);
    return `
      <button class="route-dot map-action-dot ${escapeHtml(toneClass)}" type="button" style="left:${position.x}%; top:${position.y}%;" title="Abrir ubicacion de ${escapeHtml(point.name)} en Maps" data-presence-open-maps="${escapeHtml(actionId)}"></button>
      <article class="map-label" style="left:${Math.min(82, position.x + 3)}%; top:${Math.max(4, position.y - 4)}%;">
        <strong>${escapeHtml(point.name)}</strong>
        <span>${escapeHtml(point.roleLabel)} - ${escapeHtml(gpsTrustLabel(point.location))}</span>
        <span>Hace ${escapeHtml(presenceAgeLabel(point))}</span>
        ${presenceLocationActionsHtml(point, true)}
      </article>
    `;
  }).join("");
}

async function renderDashboardGooglePresence(points) {
  try {
    await ensureGoogleMaps();
    const mapElement = byId("dashboardLivePresenceMap");
    if (!mapElement) return;
    mapElement.classList.add("google-loaded");
    mapElement.classList.remove("google-error");
    mapElement.dataset.mapMode = "google";
    const center = getGoogleMapCenter(points);
    const hadMap = Boolean(dashboardPresenceGoogleMap);
    const nextSignature = points
      .map((point) => `${point.role}:${point.username || point.name}`)
      .sort()
      .join("|");
    const shouldFitMap = !hadMap || nextSignature !== dashboardPresenceGoogleSignature;
    if (!dashboardPresenceGoogleMap) {
      const { Map } = await google.maps.importLibrary("maps");
      dashboardPresenceGoogleMap = new Map(mapElement, {
        center,
        zoom: points.length > 1 ? 12 : 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
    }
    dashboardPresenceGoogleSignature = nextSignature;

    dashboardPresenceGoogleMarkers.forEach((marker) => marker.setMap(null));
    dashboardPresenceGoogleMarkers = [];
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => {
      if (!point.location) return;
      const position = { lat: point.location.lat, lng: point.location.lng };
      const marker = new google.maps.Marker({
        map: dashboardPresenceGoogleMap,
        position,
        title: point.name,
        label: point.role === "driver" ? "R" : "V",
        optimized: true
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="maps-info">
            <strong>${escapeHtml(point.name)}</strong>
            <span>Rol: ${escapeHtml(point.roleLabel)}</span>
            <span>Ruta: ${escapeHtml(point.route)}</span>
            <span>Estado: ${escapeHtml(point.status || "Disponible")}</span>
            <span>GPS: ${escapeHtml(gpsTrustLabel(point.location))}</span>
            <code>${point.location.lat.toFixed(6)}, ${point.location.lng.toFixed(6)}</code>
            <span>Ultima actualizacion: ${escapeHtml(formatOrderTime(point.location.serverAt || point.lastPresenceAt || point.location.updatedAt))}</span>
            <span>Equipo: ${escapeHtml(point.device.label || point.device.id || "sin etiqueta")}</span>
            ${presenceLocationActionsHtml(point)}
          </div>
        `
      });
      marker.addListener("click", () => infoWindow.open({ anchor: marker, map: dashboardPresenceGoogleMap }));
      dashboardPresenceGoogleMarkers.push(marker);
      bounds.extend(position);
    });

    if (shouldFitMap && dashboardPresenceGoogleMarkers.length > 1) {
      dashboardPresenceGoogleMap.fitBounds(bounds, 70);
    } else if (shouldFitMap) {
      dashboardPresenceGoogleMap.setCenter(center);
    }
  } catch (error) {
    dashboardPresenceGoogleMap = null;
    dashboardPresenceGoogleMarkers = [];
    dashboardPresenceGoogleSignature = "";
    renderDashboardGooglePresenceError(
      "Google Maps no pudo cargar",
      error && error.message ? error.message : "Revisar clave de API, facturacion, permisos de dominio o conexion."
    );
  }
}

function renderDashboardGooglePresenceError(title, detail) {
  const mapElement = byId("dashboardLivePresenceMap");
  if (!mapElement) return;
  mapElement.classList.remove("google-loaded");
  mapElement.classList.add("google-error");
  mapElement.dataset.mapMode = "google-error";
  mapElement.innerHTML = `
    <div class="map-error">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
      <small>El tablero espera GPS real de la APK y Google Maps valido para mostrar rastreo vivo.</small>
    </div>
  `;
}

function canUseGoogleMaps() {
  return Boolean(
    window.DL_CONFIG
      && window.DL_CONFIG.USE_GOOGLE_MAPS === true
      && window.DL_CONFIG.GOOGLE_MAPS_API_KEY
  );
}

function routeReportDateValue() {
  const input = byId("gpsRouteReportDate");
  return input && input.value ? input.value : reportDateStamp();
}

function gpsDailyRouteFilters() {
  const date = routeReportDateValue();
  const role = byId("gpsRouteRoleFilter") ? byId("gpsRouteRoleFilter").value : "";
  const startHour = byId("gpsRouteStartHour") ? byId("gpsRouteStartHour").value : sessionSettings.workdayStartHour || 7;
  const endHour = byId("gpsRouteEndHour") ? byId("gpsRouteEndHour").value : sessionSettings.workdayEndHour || 22;
  return { date, role, startHour, endHour };
}

function gpsDailyRouteQuery(extra = {}) {
  const filters = gpsDailyRouteFilters();
  const params = new URLSearchParams({
    date: filters.date,
    startHour: String(filters.startHour || 7),
    endHour: String(filters.endHour || 22),
    ...extra
  });
  if (filters.role) params.set("role", filters.role);
  return params.toString();
}

function gpsDailyRoutesFetchKey() {
  return gpsDailyRouteQuery();
}

function routeReportTimeLabel(value) {
  return value ? formatOrderTime(value) : "Sin dato";
}

function renderDashboardDailyRoutes() {
  const panel = byId("gpsDailyRoutesPanel");
  if (!panel || !isAdminUser()) return;
  const dateInput = byId("gpsRouteReportDate");
  const startInput = byId("gpsRouteStartHour");
  const endInput = byId("gpsRouteEndHour");
  if (dateInput && !dateInput.value) dateInput.value = reportDateStamp();
  if (startInput && !startInput.value) startInput.value = String(sessionSettings.workdayStartHour || 7);
  if (endInput && !endInput.value) endInput.value = String(sessionSettings.workdayEndHour || 22);
  const summary = byId("gpsDailyRoutesSummary");
  const list = byId("gpsDailyRoutesList");
  if (!summary || !list) return;

  if (!gpsDailyRoutesPayload) {
    summary.innerHTML = `
      <article class="session-kpi warn">
        <span>Recorridos</span>
        <strong>${gpsDailyRoutesLoading ? "Cargando" : "Pendiente"}</strong>
      </article>
      <article class="session-kpi">
        <span>Horario</span>
        <strong>${escapeHtml(String(sessionSettings.workdayStartHour || 7))}:00-${escapeHtml(String(sessionSettings.workdayEndHour || 22))}:00</strong>
      </article>
    `;
    list.innerHTML = '<article class="stock-item"><strong>Sin reporte cargado</strong><p>Actualizar para ver la ruta de jornada de vendedores y repartidores.</p></article>';
    const key = gpsDailyRoutesFetchKey();
    if (!gpsDailyRoutesLoading && gpsDailyRoutesLastFetchKey !== key) {
      refreshDashboardDailyRoutes(true);
    }
    return;
  }

  const payload = gpsDailyRoutesPayload;
  const routes = Array.isArray(payload.routes) ? payload.routes : [];
  const totalKm = Math.round(Number(payload.totals && payload.totals.distanceMeters || 0) / 10) / 100;
  summary.innerHTML = [
    { label: "Dispositivos", value: routes.length, tone: routes.length ? "ok" : "warn" },
    { label: "Puntos GPS", value: payload.totals && payload.totals.points || 0, tone: "ok" },
    { label: "Km estimados", value: totalKm, tone: "info" },
    { label: "Jornada", value: `${payload.startHour}:00-${payload.endHour}:00`, tone: "info" }
  ].map((item) => `
    <article class="session-kpi ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");

  list.innerHTML = routes.length ? routes.map((route) => {
    const roleTone = route.role === "driver" ? "warn" : "ok";
    const last = route.last || {};
    const mapsUrl = route.mapsUrl || (last.lat && last.lng ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${last.lat},${last.lng}`)}` : "");
    return `
      <article class="gps-route-card">
        <div class="gps-route-card-head">
          <div>
            <strong>${escapeHtml(route.user || route.username || "Usuario")}</strong>
            <span>${escapeHtml(route.deviceLabel || route.deviceId || "Dispositivo sin etiqueta")}</span>
          </div>
          <span class="tag ${roleTone}">${escapeHtml(roleLabel(route.role))}</span>
        </div>
        <div class="gps-route-metrics">
          <span><b>${escapeHtml(route.distanceKm || 0)}</b> km</span>
          <span><b>${escapeHtml(route.totalPoints || 0)}</b> puntos</span>
          <span><b>${escapeHtml(route.avgAccuracy || 0)}</b> m precision</span>
        </div>
        <p>Inicio ${escapeHtml(routeReportTimeLabel(route.startedAt))} - Ultima ${escapeHtml(routeReportTimeLabel(route.endedAt))}</p>
        ${last && Number.isFinite(Number(last.lat)) ? `<p><code>${Number(last.lat).toFixed(6)}, ${Number(last.lng).toFixed(6)}</code></p>` : ""}
        <div class="presence-location-actions compact">
          ${mapsUrl ? `<a class="mini-btn" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir recorrido en Maps</a>` : ""}
          <button class="mini-btn" type="button" data-gps-route-print="${escapeHtml(route.key)}">Imprimir hoja</button>
        </div>
      </article>
    `;
  }).join("") : '<article class="stock-item"><strong>Sin recorrido para el filtro</strong><p>No hubo puntos GPS registrados en la jornada seleccionada.</p></article>';
}

async function refreshDashboardDailyRoutes(silent = false) {
  if (!isAdminUser() || gpsDailyRoutesLoading) return;
  gpsDailyRoutesLoading = true;
  const key = gpsDailyRoutesFetchKey();
  gpsDailyRoutesLastFetchKey = key;
  renderDashboardDailyRoutes();
  try {
    const response = await fetchWithTimeout(apiUrl(`api/admin/presence/daily-routes?${key}`), { cache: "no-store" }, 12000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo cargar el recorrido GPS.");
    gpsDailyRoutesPayload = payload;
    renderDashboardDailyRoutes();
    if (!silent) showCompactNotice("Recorridos GPS actualizados.", "ok");
  } catch (error) {
    if (!silent) window.alert(error.message || "No se pudo cargar el recorrido GPS.");
  } finally {
    gpsDailyRoutesLoading = false;
    renderDashboardDailyRoutes();
  }
}

async function exportDashboardDailyRoutesCsv() {
  if (!isAdminUser()) return;
  try {
    const response = await fetchWithTimeout(apiUrl(`api/admin/presence/daily-routes?${gpsDailyRouteQuery({ format: "csv" })}`), { cache: "no-store" }, 20000);
    const blob = await response.blob();
    if (!response.ok) throw new Error("No se pudo descargar el CSV.");
    downloadBlob(`recorridos-gps-${routeReportDateValue()}.csv`, blob);
  } catch (error) {
    window.alert(error.message || "No se pudo descargar el CSV de recorridos.");
  }
}

function gpsDailyRoutePrintableLines(routes) {
  const payload = gpsDailyRoutesPayload || {};
  const selectedRoutes = Array.isArray(routes) ? routes : (Array.isArray(payload.routes) ? payload.routes : []);
  const lines = [
    `Fecha: ${payload.date || routeReportDateValue()}`,
    `Jornada: ${payload.startHour || sessionSettings.workdayStartHour || 7}:00 a ${payload.endHour || sessionSettings.workdayEndHour || 22}:00`,
    `Dispositivos: ${selectedRoutes.length}`,
    ""
  ];
  selectedRoutes.forEach((route) => {
    lines.push(`${route.user || route.username} - ${roleLabel(route.role)} - ${route.deviceLabel || route.deviceId}`);
    lines.push(`Inicio: ${routeReportTimeLabel(route.startedAt)} | Ultima: ${routeReportTimeLabel(route.endedAt)} | Km: ${route.distanceKm || 0} | Puntos: ${route.totalPoints || 0}`);
    if (route.mapsUrl) lines.push(`Maps: ${route.mapsUrl}`);
    lines.push("");
  });
  return lines;
}

function printDashboardDailyRoutes(routeKey = "") {
  const routes = gpsDailyRoutesPayload && Array.isArray(gpsDailyRoutesPayload.routes) ? gpsDailyRoutesPayload.routes : [];
  const selected = routeKey ? routes.filter((route) => route.key === routeKey) : routes;
  if (!selected.length) {
    window.alert("No hay recorridos para imprimir.");
    return;
  }
  downloadBlob(`recorridos-gps-${routeReportDateValue()}.pdf`, makeSimplePdf("Distribuidora Lopez - Recorridos GPS", gpsDailyRoutePrintableLines(selected)));
}

async function renderGoogleRoutes() {
  try {
    await ensureGoogleMaps();
    const mapElement = byId("routeMap");
    mapElement.classList.add("google-loaded");
    mapElement.classList.remove("google-error");
    mapElement.dataset.mapMode = "google";
    const located = activePresenceMapPoints();
    const center = getGoogleMapCenter(located);

    if (!googleMap) {
      const { Map } = await google.maps.importLibrary("maps");
      googleMap = new Map(mapElement, {
        center,
        zoom: located.length > 1 ? 12 : 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
    }

    googleMarkers.forEach((marker) => marker.setMap(null));
    googleMarkers = [];

    const bounds = new google.maps.LatLngBounds();
    located.forEach((seller) => {
      if (!seller.location) return;
      const position = { lat: seller.location.lat, lng: seller.location.lng };
      const marker = new google.maps.Marker({
        map: googleMap,
        position,
        title: seller.name,
        label: seller.role === "driver" ? "R" : seller.name.slice(0, 1),
        optimized: true
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="maps-info">
            <strong>${escapeHtml(seller.name)}</strong><br>
            Rol: ${escapeHtml(seller.roleLabel)}<br>
            Ruta: ${escapeHtml(seller.route)}<br>
            Estado: ${escapeHtml(seller.gps)}<br>
            GPS: ${escapeHtml(gpsTrustLabel(seller.location))}<br>
            Actualizado: ${escapeHtml(seller.location.updatedAt)}
          </div>
        `
      });
      marker.addListener("click", () => infoWindow.open({ anchor: marker, map: googleMap }));
      googleMarkers.push(marker);
      bounds.extend(position);
    });

    if (googleMarkers.length > 1) {
      googleMap.fitBounds(bounds, 60);
    } else {
      googleMap.setCenter(center);
    }
  } catch (error) {
    googleMap = null;
    googleMarkers = [];
    renderGoogleMapsError(
      "Google Maps no pudo cargar",
      error && error.message ? error.message : "Revisar clave de API, facturacion, permisos de dominio o conexion."
    );
  }
}

function renderGoogleMapsError(title, detail) {
  const mapElement = byId("routeMap");
  if (!mapElement) return;
  mapElement.classList.remove("google-loaded");
  mapElement.classList.add("google-error");
  mapElement.dataset.mapMode = "google-error";
  mapElement.innerHTML = `
    <div class="map-error">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
      <small>Modo Google Maps solicitado. No se muestra el mapa interno para evitar lecturas falsas.</small>
    </div>
  `;
}

function getGoogleMapCenter(sellers) {
  const located = sellers.filter((seller) => seller.location);
  if (!located.length) return { lat: -34.6037, lng: -58.3816 };
  const total = located.reduce((sum, seller) => ({
    lat: sum.lat + seller.location.lat,
    lng: sum.lng + seller.location.lng
  }), { lat: 0, lng: 0 });
  return {
    lat: total.lat / located.length,
    lng: total.lng / located.length
  };
}

function ensureGoogleMaps() {
  if (window.google && window.google.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__dlGoogleMapsReady";
    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };
    window.gm_authFailure = () => {
      googleMapsPromise = null;
      reject(new Error("Google Maps rechazo la clave. Revisar API habilitada, facturacion y restricciones de dominio."));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.DL_CONFIG.GOOGLE_MAPS_API_KEY)}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps no cargo. Revisar API key, red o facturacion."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function getLocationBounds(sellers) {
  if (!sellers.length) return null;
  const lats = sellers.map((seller) => seller.location.lat);
  const lngs = sellers.map((seller) => seller.location.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

function getMapPoint(location, bounds, fallbackIndex) {
  if (!location || !bounds) {
    return { x: 20 + fallbackIndex * 24, y: 30 + fallbackIndex * 18 };
  }
  const latRange = Math.max(0.001, bounds.maxLat - bounds.minLat);
  const lngRange = Math.max(0.001, bounds.maxLng - bounds.minLng);
  return {
    x: 10 + ((location.lng - bounds.minLng) / lngRange) * 80,
    y: 88 - ((location.lat - bounds.minLat) / latRange) * 76
  };
}

function filtered(term, values) {
  return !term || values.join(" ").toLowerCase().includes(term);
}

function orderWorkflowIndex(status) {
  if (status === ORDER_STATUS.CANCELLED) return -1;
  if (status === ORDER_STATUS.COMMERCIAL_APPROVAL) {
    return ORDER_WORKFLOW.findIndex((item) => item.status === ORDER_STATUS.PENDING);
  }
  if (status === ORDER_STATUS.PARTIAL_DELIVERED) {
    return ORDER_WORKFLOW.findIndex((item) => item.status === ORDER_STATUS.DELIVERED);
  }
  const index = ORDER_WORKFLOW.findIndex((item) => item.status === status);
  return index >= 0 ? index : 0;
}

function nextOrderStatus(status) {
  return OrderEngine.nextStatus(status);
}

function latestTraceForStatus(order, status) {
  const matches = (order.trace || []).filter((entry) => entry.status === status);
  return matches[matches.length - 1] || null;
}

function orderStageStartedAt(order) {
  const entry = latestTraceForStatus(order, order.status);
  return entry ? entry.at : order.updatedAt || order.createdAt;
}

function minutesSince(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
}

function formatOrderTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin hora";
  return date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function orderDelayInfo(order) {
  const threshold = ORDER_DELAY_LIMITS_MIN[order.status] ?? 45;
  if (!threshold || [ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    return { delayed: false, minutes: 0, label: "Sin demora", tone: "ok" };
  }
  const minutes = minutesSince(orderStageStartedAt(order));
  if (minutes >= threshold * 2) {
    return { delayed: true, minutes, label: `Demora critica ${minutes} min`, tone: "danger" };
  }
  if (minutes >= threshold) {
    return { delayed: true, minutes, label: `Demora ${minutes} min`, tone: "warn" };
  }
  return { delayed: false, minutes, label: `${minutes} min en etapa`, tone: "ok" };
}

function orderPriorityInfo(order) {
  const client = state.clients.find((item) => item.name === order.client);
  const delay = orderDelayInfo(order);
  if (order.priority === "Urgente") {
    return { label: "Urgente", tone: "danger", reason: "Marcado por administracion" };
  }
  if (order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0) {
    const missing = orderSupplySummary(order).missing;
    return { label: "Alta", tone: "warn", reason: `Faltan ${missing} unidades para completar` };
  }
  if (delay.tone === "danger") {
    return { label: "Urgente", tone: "danger", reason: "Demora critica" };
  }
  if (delay.delayed) {
    return { label: "Alta", tone: "warn", reason: "Demora operativa" };
  }
  if (client && client.limit > 0 && client.balance > client.limit) {
    return { label: "Alta", tone: "warn", reason: "Cliente excede limite" };
  }
  if (numeric(order.amount, 0) >= 250000) {
    return { label: "Alta", tone: "warn", reason: "Pedido de alto valor" };
  }
  return { label: "Normal", tone: "ok", reason: "Dentro de proceso" };
}

function orderSourceLabel(order) {
  if (order.source === "mobile" || order.origin === "preventa") return "Celular";
  if (order.source === "dashboard") return "Dashboard";
  return order.source || "Sistema";
}

function renderOrderProgress(order) {
  const stages = order && order.commercialApproval
    ? [ORDER_WORKFLOW[0], ORDER_COMMERCIAL_STAGE, ...ORDER_WORKFLOW.slice(1)]
    : ORDER_WORKFLOW;
  const currentIndex = (() => {
    if (order.status === ORDER_STATUS.PARTIAL_DELIVERED) return stages.findIndex((item) => item.status === ORDER_STATUS.DELIVERED);
    const index = stages.findIndex((item) => item.status === order.status);
    return index >= 0 ? index : 0;
  })();
  const traced = new Set((order.trace || []).map((entry) => entry.status));
  return `
    <div class="order-progress" aria-label="Trazabilidad ${escapeHtml(order.code)}">
      ${stages.map((stage, index) => {
        const done = traced.has(stage.status) || currentIndex >= index;
        return `<span class="${done ? "done" : ""}" title="${escapeHtml(stage.label)}">${escapeHtml(stage.short)}</span>`;
      }).join("")}
    </div>
  `;
}

function clientOrderSummary(clientName) {
  const client = state.clients.find((item) => item.name === clientName);
  if (!client) return "Cliente no encontrado";
  const credit = client.limit > 0 && client.balance > client.limit ? "Excede limite" : client.status || "Sin estado";
  return `${credit} - Saldo ${money.format(client.balance)}`;
}

function orderClient(order) {
  const name = String(order && order.client || "").trim();
  if (!name) return null;
  return state.clients.find((item) => item.name === name)
    || state.clients.find((item) => normalizeSearchText(item.name) === normalizeSearchText(name))
    || null;
}

function firstText(...values) {
  return values
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";
}

function orderAddressText(order) {
  const client = orderClient(order);
  const address = firstText(order.address, order.domicilio, client && client.domicilio);
  const city = firstText(order.localidad, client && client.localidad);
  return [address, city].filter(Boolean).join(", ") || "Sin domicilio";
}

function orderZoneText(order) {
  const client = orderClient(order);
  return firstText(order.zone, order.zona, client && (client.zone || client.zona), client && client.ruta) || "Sin zona";
}

function orderRouteText(order) {
  const client = orderClient(order);
  return firstText(order.route, order.ruta, client && client.ruta, orderZoneText(order)) || "Sin ruta";
}

function orderHoursText(order) {
  const client = orderClient(order);
  return firstText(order.deliveryWindow, order.horario_entrega, order.horario, client && client.horario_atencion) || "Sin horario";
}

function orderQuickFilterMatches(order) {
  const status = order.status;
  const deliveredStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED];
  const notDeliveredExcluded = [...deliveredStatuses, ORDER_STATUS.CANCELLED];
  switch (orderQuickFilter) {
    case "pending":
      return status === ORDER_STATUS.PENDING;
    case "preparation":
      return status === ORDER_STATUS.READY;
    case "assembly":
      return status === ORDER_STATUS.ASSEMBLY;
    case "labeled":
      return status === ORDER_STATUS.LABELED;
    case "ready_dispatch":
      return status === ORDER_STATUS.READY_DISPATCH;
    case "in_route":
      return [ORDER_STATUS.DISPATCHED, ORDER_STATUS.IN_ROUTE, ORDER_STATUS.CHECKED].includes(status);
    case "delivered":
      return deliveredStatuses.includes(status) || status === ORDER_STATUS.PARTIAL_DELIVERED;
    case "not_delivered":
      return !notDeliveredExcluded.includes(status);
    default:
      return true;
  }
}

function orderPriorityRank(order) {
  const priority = orderPriorityInfo(order);
  if (priority.tone === "danger") return 0;
  if (priority.tone === "warn") return 1;
  return 2;
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "es-AR", { numeric: true, sensitivity: "base" });
}

function compareOrdersBySort(a, b, sortKey = orderSortKey) {
  const created = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  switch (sortKey) {
    case "priority":
      return orderPriorityRank(a) - orderPriorityRank(b)
        || orderDelayInfo(b).minutes - orderDelayInfo(a).minutes
        || orderWorkflowIndex(a.status) - orderWorkflowIndex(b.status)
        || created;
    case "zone":
      return compareText(orderZoneText(a), orderZoneText(b))
        || compareText(orderRouteText(a), orderRouteText(b))
        || compareText(a.client, b.client)
        || created;
    case "route":
      return compareText(orderRouteText(a), orderRouteText(b))
        || compareText(orderZoneText(a), orderZoneText(b))
        || compareText(a.client, b.client)
        || created;
    case "hours":
      return compareText(orderHoursText(a), orderHoursText(b))
        || compareText(orderRouteText(a), orderRouteText(b))
        || compareText(a.client, b.client)
        || created;
    case "client":
      return compareText(a.client, b.client) || created;
    case "status":
      return orderWorkflowIndex(a.status) - orderWorkflowIndex(b.status)
        || compareText(orderRouteText(a), orderRouteText(b))
        || created;
    default:
      return created;
  }
}

function orderSupplySummary(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length || order.inventoryMode === "legacy-deducted") {
    return { requested: 0, reserved: 0, missing: 0, label: "Pedido historico: stock ya contabilizado" };
  }
  const requested = items.reduce((sum, item) => sum + numeric(item.requestedQty, 0), 0);
  const reserved = items.reduce((sum, item) => sum + numeric(item.reservedQty, 0), 0);
  const missing = items.reduce((sum, item) => sum + numeric(item.missingQty, 0), 0);
  return {
    requested,
    reserved,
    missing,
    label: missing > 0 ? `${reserved}/${requested} reservadas - faltan ${missing}` : `${requested}/${requested} reservadas`
  };
}

function orderAssemblyInfo(order) {
  const assembly = order && order.assembly && typeof order.assembly === "object" ? order.assembly : {};
  const label = assembly.label && typeof assembly.label === "object" ? assembly.label : {};
  const orderNumber = numeric(assembly.orderNumber || assembly.assemblyOrderNumber || order?.assemblyOrderNumber || 0, 0);
  return {
    orderNumber,
    assemblyOrderNumber: orderNumber,
    bultos: numeric(assembly.bultosConfirmed || assembly.bultos || 0, 0),
    observations: String(assembly.observations || ""),
    labelId: String(label.id || ""),
    scanCode: String(label.scanCode || order?.code || ""),
    generated: Boolean(label.generated),
    generatedAt: label.generatedAt || null,
    generatedBy: String(label.generatedBy || ""),
    printer: String(label.printer || ""),
    printed: Boolean(label.printed),
    printedAt: label.printedAt || null,
    scanned: Boolean(label.scanned),
    scannedAt: label.scannedAt || null,
    scannedBy: String(label.scannedBy || ""),
    invalidatedAt: label.invalidatedAt || null,
    invalidationReason: String(label.invalidationReason || ""),
    packageLabels: Array.isArray(label.packageLabels) ? label.packageLabels : []
  };
}

function formatAssemblyPedidoNumber(code) {
  const raw = String(code || "").trim();
  const digits = raw.match(/\d+/g);
  if (!digits) return raw || "SIN NUMERO";
  return String(digits.join("")).padStart(6, "0");
}

function formatAssemblyOrderNumber(orderOrInfo) {
  const info = orderOrInfo && (orderOrInfo.orderNumber !== undefined || orderOrInfo.assemblyOrderNumber !== undefined)
    ? orderOrInfo
    : orderAssemblyInfo(orderOrInfo);
  const number = numeric(info.orderNumber || info.assemblyOrderNumber || 0, 0);
  return number > 0 ? String(number) : "S/N";
}

function formatLabelHumanCode(value) {
  return String(value || "").replace(/-/g, "");
}

function renderOrderAssemblyChecklist(order) {
  const info = orderAssemblyInfo(order);
  if (![ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED, ORDER_STATUS.IN_ROUTE].includes(order.status)) {
    return "";
  }
  const parts = [
    { label: "Orden", ok: info.orderNumber > 0, text: formatAssemblyOrderNumber(info) },
    { label: "Bultos", ok: info.bultos > 0, text: info.bultos > 0 ? `${info.bultos}` : "pendiente" },
    { label: "Etiqueta", ok: info.generated, text: info.generated ? "generada" : "pendiente" },
    { label: "Scanner", ok: info.scanned, text: info.scanned ? "validado" : "pendiente" }
  ];
  return `
    <div class="assembly-checklist">
      ${parts.map((part) => `
        <span class="${part.ok ? "ok" : "warn"}">
          <b>${escapeHtml(part.label)}</b>
          <small>${escapeHtml(part.text)}</small>
        </span>
      `).join("")}
    </div>
  `;
}

function canOpenLabelDialog(order) {
  return canOperateAssembly() && order && [ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status);
}

function canOpenScanDialog(order) {
  const info = orderAssemblyInfo(order);
  return canOperateAssembly() && order && order.status === ORDER_STATUS.LABELED && info.generated && info.bultos > 0;
}

const CODE39_PATTERNS = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "$": "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn"
};

function code39Sanitize(value) {
  const allowed = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
  return String(value || "").toUpperCase().split("").filter((char) => allowed.includes(char)).join("") || "SIN-CODIGO";
}

function code39Svg(value, options = {}) {
  const text = code39Sanitize(value);
  const caption = code39Sanitize(options.caption || value);
  const narrow = numeric(options.narrow, 2) || 2;
  const wide = numeric(options.wide, narrow * 3) || narrow * 3;
  const height = numeric(options.height, 72) || 72;
  const quiet = numeric(options.quiet, 14) || 14;
  const encoded = `*${text}*`;
  let x = quiet;
  const bars = [];
  encoded.split("").forEach((char) => {
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS["-"];
    pattern.split("").forEach((part, index) => {
      const width = part === "w" ? wide : narrow;
      if (index % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#111827"/>`);
      x += width;
    });
    x += narrow;
  });
  const width = x + quiet;
  return `<svg class="barcode-svg" viewBox="0 0 ${width} ${height + 28}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Codigo ${escapeHtml(text)}">${bars.join("")}<text x="${width / 2}" y="${height + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeHtml(caption)}</text></svg>`;
}

function orderLabelFields(order) {
  const client = state.clients.find((item) => item.name === order.client) || {};
  const info = orderAssemblyInfo(order);
  return {
    orderCode: order.code,
    displayOrderCode: formatAssemblyPedidoNumber(order.code),
    assemblyOrderNumber: info.orderNumber || 0,
    client: order.client,
    address: [client.domicilio || client.direccion, client.localidad || "Cordoba"].filter(Boolean).join(", "),
    phone: client.telefono || client.phone || client.celular || "",
    zone: client.ruta || client.zona || client.zone || "Sin ruta",
    packages: info.bultos,
    observations: info.observations || order.observations || order.observaciones || "",
    scanCode: info.scanCode || order.code,
    labelId: info.labelId || `ETQ-${order.code}`,
    printer: info.printer || localStorage.getItem("dlLabelPrinter") || "",
    packageLabels: info.packageLabels
  };
}

function orderPackageLabels(order) {
  const fields = orderLabelFields(order);
  const total = Math.max(1, Math.floor(numeric(fields.packages, 0)) || 1);
  const existing = Array.isArray(fields.packageLabels) && fields.packageLabels.length
    ? fields.packageLabels
    : [];
  return Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const found = existing.find((item) => Number(item.packageNumber || item.index || item.number) === number) || existing[index] || {};
    const scanCode = String(found.scanCode || `${String(fields.orderCode || "PEDIDO").replace(/-/g, "")}B${String(number)}`).replace(/-/g, "");
    return {
      id: found.id || found.uniqueId || scanCode,
      uniqueId: found.uniqueId || found.id || scanCode,
      packageNumber: number,
      totalPackages: total,
      scanCode,
      scanned: Boolean(found.scanned),
      scannedAt: found.scannedAt || null,
      scannedBy: found.scannedBy || ""
    };
  });
}

function smartLabelPageHtml(order, packageLabel) {
  const label = orderLabelFields(order);
  const barcode = code39Svg(packageLabel.scanCode, { height: 78, narrow: 2, wide: 5, quiet: 14, caption: formatLabelHumanCode(packageLabel.scanCode) });
  return `
    <section class="smart-label-page">
      <header>
        <div class="smart-label-title">
          <span>Distribuidora Lopez</span>
          <strong>Pedido: ${escapeHtml(label.displayOrderCode)}</strong>
        </div>
        <div class="smart-label-metrics" aria-label="Orden de armado y cantidad de bultos">
          <div class="smart-label-metric">
            <span>Orden de Armado</span>
            <strong>${escapeHtml(formatAssemblyOrderNumber(label))}</strong>
          </div>
          <i aria-hidden="true"></i>
          <div class="smart-label-metric">
            <span>Bultos</span>
            <strong>${escapeHtml(String(packageLabel.packageNumber))}/${escapeHtml(String(packageLabel.totalPackages))}</strong>
          </div>
        </div>
      </header>
      <div class="smart-label-body">
        <main>
          <h1>${escapeHtml(label.client)}</h1>
          <p><b>Direccion:</b> ${escapeHtml(label.address || "Sin direccion")}</p>
          <p><b>Telefono:</b> ${escapeHtml(label.phone || "S/D")}</p>
          <p><b>Ruta:</b> ${escapeHtml(label.zone || "Sin ruta")}</p>
          ${label.observations ? `<p><b>Obs:</b> ${escapeHtml(label.observations)}</p>` : ""}
        </main>
        <div class="smart-label-code">${barcode}</div>
      </div>
      <footer>
        <span>ID bulto: ${escapeHtml(formatLabelHumanCode(packageLabel.uniqueId || packageLabel.scanCode))}</span>
        ${label.printer ? `<span>Impresora: ${escapeHtml(label.printer)}</span>` : ""}
      </footer>
    </section>
  `;
}

function printOrderLabel(order) {
  if (!order) return;
  const label = orderLabelFields(order);
  const packageLabels = orderPackageLabels(order);
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Etiquetas ${escapeHtml(label.orderCode)}</title>
        <style>
          @page { size: 100mm 60mm; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
          .smart-label-page { width: 100mm; height: 60mm; page-break-after: always; border: 2px solid #111827; padding: 4mm; display: grid; grid-template-rows: auto 1fr auto; gap: 2.5mm; overflow: hidden; }
          .smart-label-page:last-child { page-break-after: auto; }
          header { display: flex; justify-content: space-between; gap: 4mm; align-items: flex-start; border-bottom: 1.5px solid #111827; padding-bottom: 2mm; }
          footer { display: flex; justify-content: space-between; gap: 3mm; align-items: center; border-top: 1.5px solid #111827; padding-top: 1.5mm; font-size: 8pt; }
          .smart-label-title span, footer span { font-size: 8pt; text-transform: uppercase; color: #374151; }
          .smart-label-title strong { display: block; font-size: 19pt; line-height: 1; letter-spacing: 0; }
          .smart-label-metrics { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-width: 38mm; border: 2px solid #111827; border-radius: 4px; padding: 1.5mm 2.5mm; gap: 2mm; text-align: center; white-space: nowrap; }
          .smart-label-metrics i { display: block; width: 1.5px; height: 12mm; background: #111827; }
          .smart-label-metric span { display: block; font-size: 7.5pt; line-height: 1; text-transform: uppercase; color: #111827; font-weight: 800; }
          .smart-label-metric strong { display: block; margin-top: 1mm; font-size: 22pt; line-height: 0.9; font-weight: 900; letter-spacing: 0; }
          .smart-label-body { display: grid; grid-template-columns: 52% 1fr; gap: 5mm; align-items: center; min-height: 0; }
          h1 { margin: 0 0 1.5mm; font-size: 18pt; line-height: 1.05; }
          p { margin: 1mm 0; font-size: 10pt; line-height: 1.12; }
          .smart-label-code { border-left: 1.5px solid #111827; padding-left: 3mm; display: grid; align-content: center; justify-items: center; min-width: 0; }
          svg { width: 100%; height: auto; max-height: 24mm; border: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${packageLabels.map((packageLabel) => smartLabelPageHtml(order, packageLabel)).join("")}
        <script>window.onload = function () { window.focus(); window.print(); };</script>
      </body>
    </html>`;
  const printWindow = window.open("", "_blank", "width=520,height=420");
  if (!printWindow) {
    window.alert("El navegador bloqueo la ventana de impresion. Habilitar popups para imprimir etiquetas.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function printOrderNumber(order) {
  const raw = String(order && order.code || "").trim();
  const digits = raw.match(/\d+/g);
  if (!digits) return raw || "SIN NUMERO";
  return String(digits.join("")).padStart(8, "0");
}

function orderCreatedDateParts(order) {
  const date = new Date(order.createdAt || order.receivedAt || order.updatedAt || Date.now());
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };
  return {
    date: date.toLocaleDateString("es-AR"),
    time: date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  };
}

function orderSaleCondition(order, client) {
  return firstText(
    order.saleCondition,
    order.condicion_venta,
    order.paymentCondition,
    client && client.condicion_comercial,
    client && client.status,
    "Cuenta corriente"
  );
}

function assemblyItemProduct(item) {
  const code = String(item.productCode || item.codigo_producto || item.code || "").trim();
  const name = String(item.name || item.descripcion || item.product || "").trim();
  const products = Array.isArray(state.products) ? state.products : [];
  return (code && products.find((product) => sameText(product.codigo_producto || product.code, code)))
    || (name && products.find((product) => sameText(product.name || product.descripcion, name)))
    || {};
}

function assemblyItemFlags(item) {
  const product = assemblyItemProduct(item);
  const text = normalizeSearchText([
    item.tags,
    item.tipo,
    item.category,
    item.rubro,
    item.observations,
    product.tags,
    product.tipo,
    product.rubro,
    product.familia,
    product.observaciones
  ].flat().join(" "));
  const flags = [];
  if (item.promo || item.promocion || product.promo || text.includes("promo") || text.includes("oferta")) flags.push("promo");
  if (item.fragil || product.fragil || text.includes("fragil") || text.includes("vidrio")) flags.push("fragile");
  if (item.refrigerado || product.refrigerado || text.includes("frio") || text.includes("refriger")) flags.push("cold");
  if (item.especial || product.especial || text.includes("especial")) flags.push("special");
  return flags;
}

function assemblyFlagLabel(flag) {
  const labels = {
    promo: "Promo",
    fragile: "Fragil",
    cold: "Frio",
    special: "Especial"
  };
  return labels[flag] || flag;
}

function assemblyOrderItems(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : String(order.products || "").split(",").map((text) => ({ name: text.trim(), requestedQty: "", unitPrice: 0, lineTotal: 0 }));
  return items.filter((item) => String(item.name || item.descripcion || item.product || "").trim());
}

function orderInvoiceRows(order, settings) {
  const items = assemblyOrderItems(order);
  return items.map((item) => {
    const qty = numeric(item.requestedQty ?? item.qty ?? item.quantity, 0);
    const unitPrice = numeric(item.unitPrice || (qty ? numeric(item.lineTotal, 0) / qty : 0), 0);
    const lineTotal = numeric(item.lineTotal, qty * unitPrice);
    const flags = assemblyItemFlags(item);
    const background = flags[0] ? settings.highlightColors[flags[0]] || DEFAULT_ASSEMBLY_PRINT_SETTINGS.highlightColors[flags[0]] : "";
    const style = background ? ` style="background:${escapeHtml(background)}"` : "";
    const badges = flags.map((flag) => `<span class="print-badge">${escapeHtml(assemblyFlagLabel(flag))}</span>`).join("");
    return `
      <tr${style}>
        ${settings.showInternalCode ? `<td class="code-col">${escapeHtml(item.productCode || item.codigo_producto || item.code || "-")}</td>` : ""}
        <td class="qty-col">${qty || escapeHtml(item.qty || "")}</td>
        <td><strong>${escapeHtml(item.name || item.descripcion || "Producto")}</strong>${badges}</td>
        ${settings.showPrices ? `<td class="money-col">${unitPrice ? money.format(unitPrice) : "-"}</td>` : ""}
        ${settings.showAmounts ? `<td class="money-col">${lineTotal ? money.format(lineTotal) : "-"}</td>` : ""}
        <td class="control-col"></td>
      </tr>
    `;
  }).join("");
}

function findClientByName(name) {
  const target = normalizeText(name);
  return (state.clients || []).find((client) => normalizeText(client.name || client.nombre_comercial) === target) || null;
}

function orderInvoiceHtml(order) {
  const client = findClientByName(order.client) || {};
  const settings = assemblyPrintSettings();
  const label = orderLabelFields(order);
  const info = orderAssemblyInfo(order);
  const items = assemblyOrderItems(order);
  const totalUnits = items.reduce((sum, item) => sum + numeric(item.requestedQty ?? item.qty ?? item.quantity, 0), 0);
  const bultos = Math.max(0, numeric(info.bultos || label.packages, 0));
  const when = orderCreatedDateParts(order);
  const orderPayload = [
    `pedido:${order.code}`,
    `numero:${printOrderNumber(order)}`,
    `cliente:${order.client}`,
    `id:${order.id || order.code}`
  ].join("|");
  const displayStatus = order.status || "Sin comenzar";
  const statusSteps = [
    { label: "Sin comenzar", active: [ORDER_STATUS.PENDING, ORDER_STATUS.READY].includes(order.status) },
    { label: "En armado", active: order.status === ORDER_STATUS.ASSEMBLY },
    { label: "Armado completo", active: [ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED].includes(order.status) },
    { label: "Etiquetado", active: [ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED].includes(order.status) },
    { label: "Listo para despacho", active: [ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED].includes(order.status) }
  ];
  return `
    <section class="invoice-page">
      <header class="invoice-header">
        <div class="invoice-brand">
          ${settings.showClientLogo ? '<img src="icons/logo-distribuidora-lopez-192.png" alt="Distribuidora Lopez">' : ""}
          <div>
            <h1>Distribuidora Lopez</h1>
            <p>Factura / guia de armado</p>
          </div>
        </div>
        <div class="invoice-code">
          <span>PEDIDO N&ordm;</span>
          <strong>${escapeHtml(printOrderNumber(order))}</strong>
          <small>${escapeHtml(order.code || "")}</small>
        </div>
        <div class="invoice-packages">
          <span>BOLSAS</span>
          <strong>${escapeHtml(String(bultos || 0))}</strong>
        </div>
      </header>
      <section class="invoice-progress">
        <strong>Estado del pedido: ${escapeHtml(displayStatus)}</strong>
        <div>
          ${statusSteps.map((step) => `<span class="${step.active ? "checked" : ""}">${step.active ? "☑" : "☐"} ${escapeHtml(step.label)}</span>`).join("")}
        </div>
      </section>
      <div class="invoice-grid">
        <p><strong>Cliente:</strong> ${escapeHtml(order.client)}</p>
        <p><strong>Fecha:</strong> ${escapeHtml(when.date)}</p>
        <p><strong>Hora:</strong> ${escapeHtml(when.time)}</p>
        <p><strong>Direccion:</strong> ${escapeHtml(label.address || orderAddressText(order) || "Sin direccion")}</p>
        <p><strong>Localidad:</strong> ${escapeHtml(client.localidad || order.localidad || "Cordoba")}</p>
        <p><strong>Zona/Ruta:</strong> ${escapeHtml(label.zone || orderZoneText(order))}</p>
        <p><strong>Vendedor:</strong> ${escapeHtml(order.seller || "-")}</p>
        <p><strong>Condicion:</strong> ${escapeHtml(orderSaleCondition(order, client))}</p>
        <p><strong>CUIT/DNI:</strong> ${escapeHtml(client.cuit || "S/D")}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${settings.showInternalCode ? "<th>Codigo</th>" : ""}
            <th>Cant.</th>
            <th>Descripcion</th>
            ${settings.showPrices ? "<th>Precio Unit.</th>" : ""}
            ${settings.showAmounts ? "<th>Importe</th>" : ""}
            <th>Control</th>
          </tr>
        </thead>
        <tbody>${orderInvoiceRows(order, settings)}</tbody>
      </table>
      <section class="invoice-summary">
        <div><span>Total articulos</span><strong>${items.length}</strong></div>
        <div><span>Total unidades</span><strong>${totalUnits}</strong></div>
        <div><span>Total bultos</span><strong>${bultos || 0}</strong></div>
        ${settings.showAmounts ? `<div><span>Total pedido</span><strong>${money.format(order.amount || 0)}</strong></div>` : ""}
      </section>
      <footer>
        <div>
          ${settings.showObservations ? `
            <strong>Observaciones del pedido</strong>
            <p>${escapeHtml(label.observations || order.observations || order.observaciones || "-")}</p>
          ` : "<strong>Observaciones ocultas por configuracion</strong>"}
          <p class="developer-print-foot">Documento generado automaticamente por el Sistema de Gestion desarrollado por ${escapeHtml(DEVELOPER_BRAND.name)}.</p>
        </div>
        ${settings.showQr ? `
          <div class="invoice-qr">
            ${pseudoQrSvg(orderPayload)}
            <small>${escapeHtml(order.code)} | ${escapeHtml(order.client)}</small>
          </div>
        ` : ""}
      </footer>
    </section>
  `;
}

function pseudoQrSvg(payload) {
  const text = String(payload || "");
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed = (Math.imul(seed ^ text.charCodeAt(index), 16777619) >>> 0);
  }
  const size = 21;
  const cell = 5;
  const finder = (x, y) => x < 7 && y < 7 || x > 13 && y < 7 || x < 7 && y > 13;
  const rects = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inFinder = finder(x, y);
      const border = inFinder && (x % 7 === 0 || y % 7 === 0 || x % 7 === 6 || y % 7 === 6);
      const center = inFinder && x % 7 >= 2 && x % 7 <= 4 && y % 7 >= 2 && y % 7 <= 4;
      seed = (Math.imul(seed + x * 31 + y * 17 + 0x9e3779b9, 1664525) + 1013904223) >>> 0;
      if (border || center || (!inFinder && (seed % 5 < 2))) {
        rects.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#111827"/>`);
      }
    }
  }
  const total = size * cell;
  return `<svg class="invoice-qr-svg" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR ${escapeHtml(text)}"><rect width="${total}" height="${total}" fill="#fff"/>${rects.join("")}</svg>`;
}

function printAuditCount(orderCode) {
  return (state.printAudit || []).filter((entry) => entry.orderCode === orderCode).length;
}

function recordAssemblyPrintAudit(orders, motive = "") {
  const at = new Date().toISOString();
  const parts = localTraceParts(at);
  state.printAudit = Array.isArray(state.printAudit) ? state.printAudit : [];
  state.globalAudit = Array.isArray(state.globalAudit) ? state.globalAudit : [];
  orders.forEach((order) => {
    const previousCount = printAuditCount(order.code);
    const reprint = previousCount > 0;
    const printCount = previousCount + 1;
    const entry = {
      id: `PRINT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at,
      date: parts.date,
      time: parts.time,
      user: currentUser ? currentUser.name : "Sistema",
      username: currentUser ? currentUser.username : "",
      role: currentUser ? currentUser.role : "",
      orderCode: order.code,
      client: order.client,
      printCount,
      reprint,
      motive: reprint ? (motive || "Reimpresion operativa") : "Primera impresion",
      settings: assemblyPrintSettings()
    };
    state.printAudit.unshift(entry);
    state.globalAudit.unshift({
      id: `AUDG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at,
      date: parts.date,
      time: parts.time,
      user: entry.user,
      username: entry.username,
      role: entry.role,
      ip: "",
      device: sessionDevicePayload ? sessionDevicePayload() : null,
      gps: null,
      action: "PEDIDO_IMPRESION_ARMADO",
      entityType: "pedido",
      entityId: order.code,
      entityLabel: order.client,
      previousValue: { printCount: previousCount },
      newValue: { printCount, reprint, motive: entry.motive },
      note: entry.motive
    });
    order.print = true;
    order.printCount = printCount;
    order.lastPrintedAt = at;
    order.lastPrintedBy = entry.user;
  });
  state.printAudit = state.printAudit.slice(0, 2000);
}

function reprintMotiveForOrders(orders) {
  const reprints = orders.filter((order) => printAuditCount(order.code) > 0);
  if (!reprints.length) return "";
  return window.prompt(`Hay ${reprints.length} pedido/s con impresion previa. Motivo de reimpresion:`, "Reimpresion por ajuste operativo") || "Reimpresion operativa";
}

function printOrderInvoice(orderOrOrders) {
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders.filter(Boolean) : [orderOrOrders].filter(Boolean);
  if (!orders.length) return false;
  const motive = reprintMotiveForOrders(orders);
  const settings = assemblyPrintSettings();
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Factura armado ${escapeHtml(orders.map((order) => order.code).join("-"))}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111827; font-family: Arial, sans-serif; font-size: ${settings.fontSize}px; }
          .invoice-page { page-break-after: always; display: grid; gap: 10px; }
          .invoice-page:last-child { page-break-after: auto; }
          header, footer { display: flex; justify-content: space-between; gap: 12px; border: 2px solid #111827; padding: 10px; }
          h1 { margin: 0; font-size: 22px; }
          p { margin: 3px 0; font-size: ${Math.max(10, settings.fontSize - 1)}px; }
          .invoice-brand { display: flex; align-items: center; gap: 10px; }
          .invoice-brand img { width: 54px; height: 54px; object-fit: contain; border: 1px solid #d1d5db; border-radius: 6px; }
          .invoice-code, .invoice-packages { text-align: right; min-width: 116px; }
          .invoice-code span, .invoice-packages span { display: block; font-size: 11px; text-transform: uppercase; color: #4b5563; }
          .invoice-code strong { display: block; font-size: 30px; line-height: 1; letter-spacing: 0; }
          .invoice-code small { color: #4b5563; font-weight: 700; }
          .invoice-packages { border: 3px solid #111827; padding: 6px 10px; }
          .invoice-packages strong { display: block; font-size: 34px; line-height: 1; }
          .invoice-progress { border: 1px solid #9ca3af; padding: 8px; display: grid; gap: 5px; }
          .invoice-progress div { display: flex; flex-wrap: wrap; gap: 8px 14px; }
          .invoice-progress span { font-size: 11px; font-weight: 700; color: #374151; }
          .invoice-progress .checked { color: #047857; }
          .invoice-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px 14px; border: 1px solid #9ca3af; padding: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #9ca3af; padding: 7px; text-align: left; font-size: ${settings.fontSize}px; vertical-align: top; }
          th { background: #eef2f7; text-transform: uppercase; font-size: 11px; }
          .code-col { width: 92px; }
          .qty-col { width: 72px; text-align: center; font-weight: 900; }
          .money-col { width: 108px; text-align: right; white-space: nowrap; }
          .control-col { width: 92px; height: 30px; background: #fff; }
          .print-badge { display: inline-block; margin-left: 6px; padding: 2px 5px; border: 1px solid #111827; border-radius: 3px; font-size: 9px; text-transform: uppercase; }
          .invoice-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
          .invoice-summary div { border: 1px solid #9ca3af; padding: 8px; }
          .invoice-summary span { display: block; color: #4b5563; font-size: 10px; text-transform: uppercase; }
          .invoice-summary strong { font-size: 18px; }
          footer { align-items: flex-start; }
          .invoice-qr { display: grid; justify-items: center; gap: 4px; min-width: 120px; }
          .invoice-qr-svg { width: 104px; height: 104px; border: 1px solid #111827; padding: 4px; background: white; }
          .invoice-qr small { max-width: 150px; text-align: center; font-size: 9px; overflow-wrap: anywhere; }
          .developer-print-foot { margin-top: 8px; color: #4b5563; font-size: 10px; }
        </style>
      </head>
      <body>
        ${orders.map(orderInvoiceHtml).join("")}
        <script>window.onload = function () { window.focus(); window.print(); };</script>
      </body>
    </html>`;
  const printWindow = window.open("", "_blank", "width=900,height=720");
  if (!printWindow) {
    showCompactNotice("El navegador bloqueo la impresion. Habilitar popups.", "danger");
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  recordAssemblyPrintAudit(orders, motive);
  return true;
}

function renderOrderTrace(order) {
  return (order.trace || []).slice(-5).map((entry) => `
    <li>
      <strong>${escapeHtml(entry.status)}</strong>
      <span>${escapeHtml(formatOrderTime(entry.at))} - ${escapeHtml(entry.actor || "Sistema")}</span>
      ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
      ${entry.gps ? `<small>GPS ${escapeHtml(Number(entry.gps.lat).toFixed(5))}, ${escapeHtml(Number(entry.gps.lng).toFixed(5))}</small>` : ""}
    </li>
  `).join("");
}

function orderTimelineGpsText(gps) {
  if (!gps || !Number.isFinite(Number(gps.lat)) || !Number.isFinite(Number(gps.lng))) return "";
  const accuracy = Number(gps.accuracy || 0);
  return `${Number(gps.lat).toFixed(5)}, ${Number(gps.lng).toFixed(5)}${accuracy ? ` - ${Math.round(accuracy)} m` : ""}`;
}

function orderTimelineActionLabel(action, status, note = "") {
  const key = String(action || "").toUpperCase();
  const text = String(note || "").toLowerCase();
  const labels = {
    PEDIDO_CREADO: "Pedido creado",
    PEDIDO_EDITADO: "Pedido modificado",
    PEDIDO_MODIFICADO: "Pedido modificado",
    PEDIDO_AVANZADO: "Cambio de estado",
    PEDIDO_ETIQUETA_GENERADA: "Etiqueta generada",
    PEDIDO_ETIQUETA_ESCANEADA: "Etiqueta escaneada",
    PEDIDO_ETIQUETA_INVALIDADA: "Etiqueta invalidada",
    PEDIDO_DESPACHADO: "Pedido despachado",
    PEDIDO_ESTADO: "Cambio de estado",
    PEDIDO_PRIORIDAD: "Urgencia modificada",
    PEDIDO_CANCELADO: "Pedido cancelado",
    EVIDENCIA_REPARTO_CARGADA: "Evidencia cargada",
    COMPROBANTE_SUBIDO: "Comprobante cargado",
    COMPROBANTE_VALIDADO: "Comprobante validado",
    COMPROBANTE_RECHAZADO: "Comprobante rechazado",
    TRANSFERENCIA_ESTADO: "Conciliacion bancaria",
    EN_REPARTO: "Inicio del reparto",
    ENTREGADO_Y_COBRADO: "Entrega y cobranza",
    PARCIAL_ENTREGADO_Y_COBRADO: "Entrega parcial",
    CIERRE_DIARIO_REPARTO: "Cierre diario de reparto"
  };
  if (labels[key]) return labels[key];
  if (text.includes("comprobante")) return "Comprobante cargado";
  if (text.includes("transferencia")) return "Cobranza por transferencia";
  if (text.includes("cobrado") || text.includes("pendiente")) return "Cobranza";
  if (text.includes("gps")) return "Ubicacion GPS";
  if (status === ORDER_STATUS.PENDING) return "Pedido creado";
  if (status === ORDER_STATUS.READY) return "Pedido preparado";
  if (status === ORDER_STATUS.ASSEMBLY) return "Pedido armado";
  if (status === ORDER_STATUS.LABELED) return "Pedido etiquetado";
  if (status === ORDER_STATUS.READY_DISPATCH) return "Listo para despacho";
  if (status === ORDER_STATUS.DISPATCHED) return "Pedido despachado";
  if (status === ORDER_STATUS.IN_ROUTE) return "Inicio del reparto";
  if (status === ORDER_STATUS.PARTIAL_DELIVERED) return "Entrega parcial";
  if (status === ORDER_STATUS.DELIVERED) return "Entrega";
  if (status === ORDER_STATUS.COLLECTED) return "Cobranza";
  if (status === ORDER_STATUS.CLOSED) return "Cierre";
  if (status === ORDER_STATUS.CANCELLED) return "Pedido cancelado";
  return "Evento del pedido";
}

function orderTimelineTone(action, status, note = "") {
  const key = String(action || "").toUpperCase();
  const text = String(note || "").toLowerCase();
  if (key.includes("RECHAZ") || key.includes("CANCEL") || text.includes("rechaz")) return "danger";
  if ([ORDER_STATUS.CANCELLED].includes(status)) return "danger";
  if (key.includes("COMPROBANTE") || key.includes("TRANSFERENCIA") || status === ORDER_STATUS.PENDING || status === ORDER_STATUS.PARTIAL_DELIVERED) return "warn";
  if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(status) || key.includes("VALIDADO")) return "ok";
  return "info";
}

function pushTimelineEvent(events, event) {
  if (!event || !event.at) return;
  const key = [
    event.source || "",
    event.action || "",
    event.status || "",
    event.at || "",
    event.note || "",
    event.id || ""
  ].join("|");
  if (events.some((item) => item._key === key)) return;
  events.push({ ...event, _key: key });
}

function orderTimelineEvents(order) {
  const events = [];
  const code = String(order.code || "");
  (order.trace || []).forEach((entry, index) => {
    const action = entry.action || entry.event || "";
    pushTimelineEvent(events, {
      id: `trace-${index}`,
      source: "Pedido",
      action,
      status: entry.status || order.status,
      at: entry.at || order.updatedAt || order.createdAt,
      date: entry.date,
      time: entry.time,
      user: entry.actor || entry.user || "Sistema",
      gps: entry.gps || null,
      note: entry.note || "",
      label: orderTimelineActionLabel(action, entry.status || order.status, entry.note)
    });
  });

  (order.editHistory || []).forEach((entry, index) => {
    pushTimelineEvent(events, {
      id: `edit-${index}`,
      source: "Administracion",
      action: "PEDIDO_EDITADO",
      status: order.status,
      at: entry.at || order.updatedAt || order.createdAt,
      date: entry.date,
      time: entry.time,
      user: entry.user || "Administracion",
      note: `Motivo: ${entry.motive || "sin motivo informado"}`,
      label: "Pedido modificado",
      previousValue: entry.previous,
      newValue: entry.next
    });
  });

  (state.deliveryAudit || [])
    .filter((entry) => String(entry.orderCode || "") === code)
    .forEach((entry) => {
      pushTimelineEvent(events, {
        id: entry.id,
        source: "Reparto",
        action: entry.action || "",
        status: order.status,
        at: entry.at,
        date: entry.date,
        time: entry.time,
        user: entry.user || entry.deviceLabel || "Reparto",
        gps: entry.gps || null,
        note: [
          entry.note,
          entry.paymentMethod ? `Pago: ${entry.paymentMethod}` : "",
          entry.amountPaid ? `Cobrado ${money.format(entry.amountPaid)}` : "",
          entry.pendingAmount ? `Pendiente ${money.format(entry.pendingAmount)}` : "",
          entry.returnAmount ? `Devolucion ${money.format(entry.returnAmount)}` : ""
        ].filter(Boolean).join(" - "),
        label: orderTimelineActionLabel(entry.action, order.status, entry.note)
      });
    });

  const transferIds = new Set();
  (state.bankReconciliation || [])
    .filter((record) => String(record.orderCode || "") === code)
    .forEach((record) => {
      if (record.id) transferIds.add(record.id);
      pushTimelineEvent(events, {
        id: record.id,
        source: "Conciliacion",
        action: `COMPROBANTE_${String(record.status || "PENDIENTE").toUpperCase()}`,
        status: order.status,
        at: record.updatedAt || record.at || record.createdAt || record.dateIso || order.updatedAt,
        date: record.date,
        time: record.time,
        user: record.statusUser || record.user || "Administracion",
        note: `${record.bank || "Banco"} - ${record.alias || "Alias"} - ${money.format(record.amount || 0)} - ${record.status || "Pendiente"}${record.statusReason ? ` - ${record.statusReason}` : ""}`,
        label: orderTimelineActionLabel(`COMPROBANTE_${String(record.status || "PENDIENTE").toUpperCase()}`, order.status, record.statusReason)
      });
    });

  (state.globalAudit || [])
    .filter((entry) => (
      (entry.entityType === "pedido" && String(entry.entityId || "") === code)
      || (entry.entityType === "transferencia" && transferIds.has(entry.entityId))
    ))
    .forEach((entry) => {
      pushTimelineEvent(events, {
        id: entry.id,
        source: "Auditoria",
        action: entry.action,
        status: order.status,
        at: entry.at,
        date: entry.date,
        time: entry.time,
        user: entry.user || "Sistema",
        ip: entry.ip || "",
        device: entry.device || null,
        gps: entry.gps || null,
        note: entry.note || entry.endpoint || "",
        label: orderTimelineActionLabel(entry.action, order.status, entry.note),
        previousValue: entry.previousValue,
        newValue: entry.newValue
      });
    });

  (order.collections || []).forEach((collection, index) => {
    pushTimelineEvent(events, {
      id: `collection-${index}`,
      source: "Cobranza",
      action: collection.pendingAmount > 0 ? "COBRANZA_PARCIAL" : "COBRANZA_COMPLETA",
      status: collection.pendingAmount > 0 ? ORDER_STATUS.DELIVERED : ORDER_STATUS.COLLECTED,
      at: collection.at || order.updatedAt,
      user: collection.user || collection.deviceLabel || "Reparto",
      gps: collection.gps || null,
      note: `${collection.method || "Cobro"} - cobrado ${money.format(collection.amountPaid || 0)} - pendiente ${money.format(collection.pendingAmount || 0)}`,
      label: "Cobranza"
    });
  });

  return events
    .map((event) => ({
      ...event,
      tone: event.tone || orderTimelineTone(event.action, event.status, event.note),
      label: event.label || orderTimelineActionLabel(event.action, event.status, event.note)
    }))
    .sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
}

function renderOrderTimelineEvent(event) {
  const gps = orderTimelineGpsText(event.gps);
  const device = event.device && (event.device.label || event.device.model || event.device.id)
    ? [event.device.label, event.device.model, event.device.appVersion].filter(Boolean).join(" - ")
    : "";
  return `
    <article class="timeline-event ${escapeHtml(event.tone || "info")}">
      <div class="timeline-marker"></div>
      <div class="timeline-event-body">
        <div class="timeline-event-head">
          <span class="tag ${escapeHtml(event.tone || "info")}">${escapeHtml(event.label || "Evento")}</span>
          <small>${escapeHtml(event.date || "")} ${escapeHtml(event.time || formatOrderTime(event.at))}</small>
        </div>
        <strong>${escapeHtml(event.status || event.source || "Pedido")}</strong>
        ${event.note ? `<p>${escapeHtml(event.note)}</p>` : ""}
        <div class="timeline-meta">
          <span>${escapeHtml(event.source || "Sistema")}</span>
          <span>${escapeHtml(event.user || "Sistema")}</span>
          ${event.ip ? `<span>IP ${escapeHtml(event.ip)}</span>` : ""}
          ${device ? `<span>${escapeHtml(device)}</span>` : ""}
          ${gps ? `<span>GPS ${escapeHtml(gps)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function showCompactNotice(message, tone = "info", timeout = 2600) {
  let container = byId("adminOrderToasts");
  if (!container) return;
  const notice = document.createElement("article");
  notice.className = `admin-order-toast compact ${tone}`;
  notice.innerHTML = `
    <strong>${escapeHtml(message)}</strong>
    <button class="mini-btn" type="button" aria-label="Cerrar aviso">Cerrar</button>
  `;
  notice.querySelector("button").addEventListener("click", () => notice.remove());
  container.prepend(notice);
  window.setTimeout(() => {
    if (notice.isConnected) notice.remove();
  }, timeout);
}

function openOrderTimeline(code) {
  const order = state.orders.find((item) => item.code === code);
  const dialog = byId("orderTimelineDialog");
  if (!order || !dialog) return;
  const events = orderTimelineEvents(order);
  byId("orderTimelineTitle").textContent = `${order.code} - ${order.client}`;
  byId("orderTimelineMeta").innerHTML = `
    <span class="tag ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span>
    <span>${escapeHtml(order.seller || "Sin vendedor")}</span>
    <span>${escapeHtml(money.format(order.amount || 0))}</span>
    <span>${events.length} eventos</span>
  `;
  byId("orderTimelineSummary").innerHTML = [
    { label: "Creacion", value: formatOrderTime(order.createdAt) },
    { label: "Ultima actualizacion", value: formatOrderTime(order.updatedAt) },
    { label: "GPS registrados", value: events.filter((event) => event.gps).length },
    { label: "Comprobantes", value: events.filter((event) => String(event.action || "").toUpperCase().includes("COMPROBANTE")).length }
  ].map((item) => `
    <article>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.value || "0"))}</strong>
    </article>
  `).join("");
  byId("orderTimelineList").innerHTML = events.length
    ? events.map(renderOrderTimelineEvent).join("")
    : '<p class="empty-note">Este pedido todavia no tiene eventos registrados.</p>';
  dialog.showModal();
}

function setOrderStatus(order, nextStatus, actor, note) {
  if (!order || !nextStatus) return;
  const now = new Date().toISOString();
  const parts = localTraceParts(now);
  order.status = nextStatus;
  order.updatedAt = now;
  if (orderWorkflowIndex(nextStatus) >= 1) order.print = true;
  order.trace = Array.isArray(order.trace) ? order.trace : [];
  order.trace.push({
    status: nextStatus,
    at: now,
    date: parts.date,
    time: parts.time,
    actor: actor || (currentUser ? currentUser.name : "Administracion"),
    user: actor || (currentUser ? currentUser.name : "Administracion"),
    gps: null,
    note: note || ""
  });
}

function nextOrderCode() {
  const maxNumber = state.orders.reduce((max, order) => {
    const match = String(order.code || "").match(/PED-(\d+)/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 2051);
  return `PED-${maxNumber + 1}`;
}

function isMobileSellerOrder(order) {
  return order && (order.source === "mobile" || order.origin === "preventa");
}

function trackAdminOrderNotifications(nextState) {
  if (!isAdminUser()) return;
  const nextOrders = Array.isArray(nextState.orders) ? nextState.orders.map(normalizeOrderRecord) : [];
  if (!adminOrderNotificationReady) {
    adminKnownOrderCodes = new Set(nextOrders.map((order) => order.code));
    adminOrderNotificationReady = true;
    return;
  }

  const newOrders = nextOrders.filter((order) => !adminKnownOrderCodes.has(order.code) && isMobileSellerOrder(order));
  nextOrders.forEach((order) => adminKnownOrderCodes.add(order.code));
  newOrders.reverse().forEach(showAdminOrderNotification);
}

function showAdminOrderNotification(order) {
  const container = byId("adminOrderToasts");
  if (!container) return;
  const priority = orderPriorityInfo(order);
  const toast = document.createElement("article");
  toast.className = `admin-order-toast ${priority.tone}`;
  toast.dataset.toastOrder = order.code;
  toast.innerHTML = `
    <div>
      <span class="tag ${priority.tone}">${escapeHtml(priority.label)}</span>
      <strong>Nuevo pedido ${escapeHtml(order.code)}</strong>
      <p>${escapeHtml(order.seller)} cargo ${escapeHtml(order.client)} por ${money.format(order.amount)}.</p>
      <small>${escapeHtml(order.products)}</small>
    </div>
    <div class="toast-actions">
      <button class="mini-btn" type="button" data-open-order="${escapeHtml(order.code)}">Ver pedido</button>
      <button class="mini-btn" type="button" data-dismiss-toast="${escapeHtml(order.code)}">Cerrar</button>
    </div>
  `;
  container.prepend(toast);
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 12000);
}

function notificationAudience(notification) {
  const audience = Array.isArray(notification.audience)
    ? notification.audience
    : String(notification.audience || "all").split(",").map((item) => item.trim()).filter(Boolean);
  return audience.length ? audience : ["all"];
}

function notificationVisibleToCurrentUser(notification) {
  if (!currentUser) return false;
  const audience = notificationAudience(notification).map((item) => String(item).toLowerCase());
  return audience.includes("all")
    || audience.includes(currentUser.role)
    || audience.includes(currentUser.username)
    || audience.includes(currentUser.name && currentUser.name.toLowerCase());
}

function notificationIsRead(notification) {
  if (!notification) return true;
  const serverRead = Array.isArray(notification.readBy) && currentUser
    ? notification.readBy.includes(currentUser.username)
    : false;
  return serverRead || readNotificationIds.has(notification.id);
}

function visibleNotifications() {
  return (Array.isArray(state.notifications) ? state.notifications : [])
    .filter(notificationVisibleToCurrentUser)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}

function notificationToneLabel(tone) {
  if (tone === "danger") return "Critico";
  if (tone === "warn") return "Atencion";
  if (tone === "ok") return "OK";
  return "Info";
}

function notificationSearchText(notification) {
  return [
    notification.title,
    notification.text,
    notification.category,
    notification.action,
    notification.entityType,
    notification.entityId,
    notification.entityLabel,
    notification.user,
    notification.username,
    notification.ip
  ].join(" ");
}

function renderNotificationCenter() {
  const list = byId("notificationList");
  const visible = visibleNotifications();
  const unread = visible.filter((notification) => !notificationIsRead(notification));
  document.querySelectorAll("[data-notification-badge]").forEach((badge) => {
    badge.textContent = unread.length > 99 ? "99+" : String(unread.length);
    badge.hidden = unread.length === 0;
  });
  const summary = byId("notificationSummary");
  if (summary) summary.textContent = `${unread.length} sin leer de ${visible.length} avisos`;
  if (!list) return;

  notificationCategoryFilter = updateDynamicFilter("notificationCategoryFilter", visible.map((item) => item.category), notificationCategoryFilter, "Todas las categorias");
  const terms = searchTerms(notificationSearchTerm);
  const filtered = visible
    .filter((notification) => notificationToneFilter === "all" || notification.tone === notificationToneFilter)
    .filter((notification) => notificationCategoryFilter === "all" || notification.category === notificationCategoryFilter)
    .filter((notification) => !terms.length || matchesSearch(notificationSearchText(notification), terms))
    .slice(0, 160);

  list.innerHTML = filtered.length ? filtered.map((notification) => `
    <article class="notification-item ${notificationIsRead(notification) ? "read" : "unread"}">
      <div class="notification-item-head">
        <span class="tag ${notification.tone || ""}">${escapeHtml(notificationToneLabel(notification.tone))}</span>
        <small>${escapeHtml(notification.date || "")} ${escapeHtml(notification.time || formatOrderTime(notification.at))}</small>
      </div>
      <strong>${escapeHtml(notification.title || "Notificacion")}</strong>
      <p>${escapeHtml(notification.text || "")}</p>
      <div class="notification-meta">
        <span>${escapeHtml(notification.category || "Sistema")}</span>
        <span>${escapeHtml(notification.entityType || "sin entidad")} ${escapeHtml(notification.entityId || "")}</span>
        <span>${escapeHtml(notification.user || "Sistema")}</span>
      </div>
      <div class="notification-actions">
        <button class="mini-btn" type="button" data-focus-notification="${escapeHtml(notification.id)}">Ver</button>
        <button class="mini-btn" type="button" data-read-notification="${escapeHtml(notification.id)}">Leida</button>
      </div>
    </article>
  `).join("") : '<p class="empty-note">Sin notificaciones para los filtros seleccionados.</p>';
}

function trackIncomingNotifications(nextState) {
  const incoming = Array.isArray(nextState.notifications) ? nextState.notifications : [];
  const visible = incoming.filter(notificationVisibleToCurrentUser);
  if (!notificationTrackerReady) {
    knownNotificationIds = new Set(visible.map((notification) => notification.id));
    notificationTrackerReady = true;
    return;
  }
  const fresh = visible.filter((notification) => notification.id && !knownNotificationIds.has(notification.id));
  visible.forEach((notification) => {
    if (notification.id) knownNotificationIds.add(notification.id);
  });
  fresh.reverse().forEach(showSystemNotification);
}

function showSystemNotification(notification) {
  const container = byId("adminOrderToasts");
  if (!container || !notificationVisibleToCurrentUser(notification)) return;
  const toast = document.createElement("article");
  toast.className = `admin-order-toast ${notification.tone || "info"}`;
  toast.dataset.toastNotification = notification.id;
  toast.innerHTML = `
    <div>
      <span class="tag ${notification.tone || ""}">${escapeHtml(notificationToneLabel(notification.tone))}</span>
      <strong>${escapeHtml(notification.title || "Notificacion")}</strong>
      <p>${escapeHtml(notification.text || "")}</p>
      <small>${escapeHtml(notification.category || "Sistema")} - ${escapeHtml(notification.entityId || "")}</small>
    </div>
    <div class="toast-actions">
      <button class="mini-btn" type="button" data-focus-notification="${escapeHtml(notification.id)}">Ver</button>
      <button class="mini-btn" type="button" data-dismiss-notification="${escapeHtml(notification.id)}">Cerrar</button>
    </div>
  `;
  container.prepend(toast);
  if (navigator.vibrate) navigator.vibrate(notification.tone === "danger" ? [120, 60, 120] : [80, 40, 80]);
  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, notification.tone === "danger" ? 16000 : 10000);
}

function setNotificationCenterOpen(open) {
  const center = byId("notificationCenter");
  if (!center) return;
  center.hidden = !open;
  document.querySelectorAll("[data-open-notifications]").forEach((button) => {
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
  if (open) renderNotificationCenter();
}

function markVisibleNotificationsRead() {
  visibleNotifications().forEach((notification) => {
    if (notification.id) readNotificationIds.add(notification.id);
  });
  saveReadNotificationIds();
  renderNotificationCenter();
}

function markNotificationRead(id) {
  if (id) readNotificationIds.add(id);
  saveReadNotificationIds();
  renderNotificationCenter();
}

function focusNotification(id) {
  const notification = (state.notifications || []).find((item) => item.id === id);
  if (!notification) return;
  markNotificationRead(id);
  setNotificationCenterOpen(false);
  if (notification.entityType === "pedido" && notification.entityId) {
    focusOrder(notification.entityId);
  } else if (notification.entityType === "ruta" && notification.entityId) {
    activeDeliveryRouteId = notification.entityId;
    switchView("reparto");
    renderDelivery();
  } else if (notification.entityType === "transferencia") {
    switchView("reparto");
  } else if (notification.entityType === "cliente") {
    switchView("clientes");
  } else if (notification.entityType === "producto" || notification.entityType === "stock") {
    switchView("stock");
  } else {
    switchView("admin");
  }
}

function focusOrder(code) {
  highlightedOrderCode = code;
  switchView("pedidos");
  renderOrders();
  window.setTimeout(() => {
    const row = Array.from(document.querySelectorAll("[data-order-row]")).find((item) => item.dataset.orderRow === code);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
  window.setTimeout(() => {
    if (highlightedOrderCode === code) {
      highlightedOrderCode = "";
      renderOrders();
    }
  }, 9000);
}

function orderSearchText(order) {
  const assembly = orderAssemblyInfo(order);
  const client = orderClient(order);
  return [
    order.code,
    order.client,
    order.seller,
    order.products,
    order.status,
    order.priority,
    orderAddressText(order),
    orderZoneText(order),
    orderRouteText(order),
    orderHoursText(order),
    client && client.codigo_cliente,
    client && client.razon_social,
    client && client.cuit,
    orderSourceLabel(order),
    orderSupplySummary(order).label,
    orderDelayInfo(order).label,
    assembly.labelId,
    assembly.scanCode,
    assembly.orderNumber,
    assembly.generated ? "etiqueta generada" : "etiqueta pendiente",
    assembly.scanned ? "scanner validado" : "scanner pendiente",
    assembly.bultos
  ].join(" ");
}

function orderUrgencyKey(order) {
  const priority = orderPriorityInfo(order);
  const delay = orderDelayInfo(order);
  if (priority.tone === "danger" || order.priority === "Urgente") return "urgent";
  if (delay.delayed) return "delayed";
  return "normal";
}

function localDateKey(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function orderIsFromToday(order) {
  const today = localDateKey();
  return [order && order.createdAt, order && order.receivedAt, order && order.updatedAt]
    .filter(Boolean)
    .some((value) => localDateKey(value) === today);
}

function renderOrdersPager(total, visibleCount) {
  const pager = byId("ordersPager");
  if (!pager) return;
  const pageCount = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const from = total ? ((orderPage - 1) * ORDERS_PAGE_SIZE) + 1 : 0;
  const to = total ? from + visibleCount - 1 : 0;
  const windowStart = Math.max(1, orderPage - 2);
  const windowEnd = Math.min(pageCount, windowStart + 4);
  const buttons = [];
  if (pageCount > 1) {
    buttons.push(`<button class="mini-btn" type="button" data-orders-page="${Math.max(1, orderPage - 1)}" ${orderPage === 1 ? "disabled" : ""}>Anterior</button>`);
    for (let page = windowStart; page <= windowEnd; page += 1) {
      buttons.push(`<button class="mini-btn ${page === orderPage ? "active" : ""}" type="button" data-orders-page="${page}">${page}</button>`);
    }
    buttons.push(`<button class="mini-btn" type="button" data-orders-page="${Math.min(pageCount, orderPage + 1)}" ${orderPage === pageCount ? "disabled" : ""}>Siguiente</button>`);
  }
  pager.innerHTML = `
    <span>Mostrando ${from}-${to} de ${total} pedidos filtrados</span>
    <div>${buttons.join("")}</div>
  `;
}

function filteredOrdersForCurrentFilters() {
  const globalTerms = [];
  const localTerms = searchTerms(orderSearchTerm);
  return state.orders.filter((order) => {
    const text = orderSearchText(order);
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesQuick = orderQuickFilterMatches(order);
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSeller = orderSellerFilter === "all" || order.seller === orderSellerFilter;
    const matchesUrgency = orderUrgencyFilter === "all" || orderUrgencyKey(order) === orderUrgencyFilter;
    return orderIsFromToday(order) && matchesGlobal && matchesLocal && matchesQuick && matchesStatus && matchesSeller && matchesUrgency;
  }).sort((a, b) => compareOrdersBySort(a, b, orderSortKey));
}

function selectedOrders() {
  return state.orders.filter((order) => selectedOrderCodes.has(order.code));
}

function setOrdersBulkStatus(text, tone = "info") {
  const node = byId("ordersBulkStatus");
  if (node) {
    node.textContent = text;
    node.dataset.tone = tone;
  }
  const assemblyNode = byId("assemblyDepotBulkStatus");
  if (assemblyNode) {
    assemblyNode.textContent = text;
    assemblyNode.dataset.tone = tone;
  }
}

function renderOrdersBulkPanel() {
  const count = selectedOrderCodes.size;
  const countNode = byId("ordersSelectedCount");
  if (countNode) countNode.textContent = `Pedidos seleccionados: ${count}`;
  const pageCheckbox = byId("ordersSelectPageCheckbox");
  if (pageCheckbox) {
    pageCheckbox.checked = currentPageOrders.length > 0 && currentPageOrders.every((order) => selectedOrderCodes.has(order.code));
    pageCheckbox.indeterminate = currentPageOrders.some((order) => selectedOrderCodes.has(order.code)) && !pageCheckbox.checked;
  }
  const actions = byId("ordersBulkActions");
  if (actions) actions.dataset.enabled = count > 0 ? "true" : "false";
  if (!count) setOrdersBulkStatus(`Filtros activos: ${currentFilteredOrders.length} pedidos. Seleccionar para operar en lote.`, "info");
}

function renderAssemblyPrintSettings() {
  const form = byId("assemblyPrintSettingsForm");
  if (!form) return;
  const settings = assemblyPrintSettings();
  form.elements.showPrices.checked = settings.showPrices;
  form.elements.showAmounts.checked = settings.showAmounts;
  form.elements.showInternalCode.checked = settings.showInternalCode;
  form.elements.showObservations.checked = settings.showObservations;
  form.elements.showQr.checked = settings.showQr;
  form.elements.showClientLogo.checked = settings.showClientLogo;
  form.elements.fontSize.value = settings.fontSize;
  form.elements.promoColor.value = settings.highlightColors.promo;
  form.elements.fragileColor.value = settings.highlightColors.fragile;
  form.elements.coldColor.value = settings.highlightColors.cold;
  form.elements.specialColor.value = settings.highlightColors.special;
}

function saveAssemblyPrintSettings(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    showCompactNotice("Solo administracion puede modificar impresion.", "warn");
    return;
  }
  const form = event.currentTarget;
  const previous = structuredClone(assemblyPrintSettings());
  state.printSettings = normalizePrintSettings({
    ...(state.printSettings || {}),
    assembly: {
      showPrices: form.elements.showPrices.checked,
      showAmounts: form.elements.showAmounts.checked,
      showInternalCode: form.elements.showInternalCode.checked,
      showObservations: form.elements.showObservations.checked,
      showQr: form.elements.showQr.checked,
      showClientLogo: form.elements.showClientLogo.checked,
      fontSize: Number(form.elements.fontSize.value || DEFAULT_ASSEMBLY_PRINT_SETTINGS.fontSize),
      highlightColors: {
        promo: form.elements.promoColor.value,
        fragile: form.elements.fragileColor.value,
        cold: form.elements.coldColor.value,
        special: form.elements.specialColor.value
      }
    }
  });
  const at = new Date().toISOString();
  const parts = localTraceParts(at);
  state.globalAudit = Array.isArray(state.globalAudit) ? state.globalAudit : [];
  state.globalAudit.unshift({
    id: `AUDG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    date: parts.date,
    time: parts.time,
    user: currentUser ? currentUser.name : "Administracion",
    username: currentUser ? currentUser.username : "",
    role: currentUser ? currentUser.role : "admin",
    ip: "",
    device: sessionDevicePayload ? sessionDevicePayload() : null,
    gps: null,
    action: "CONFIG_IMPRESION_ARMADO",
    entityType: "configuracion",
    entityId: "printSettings.assembly",
    entityLabel: "Impresion de armado",
    previousValue: previous,
    newValue: assemblyPrintSettings(),
    note: "Configuracion de hoja de armado actualizada"
  });
  saveState();
  showCompactNotice("Configuracion de impresion guardada.", "ok");
  renderAssemblyPrintSettings();
}

function selectOrders(orders, selected = true) {
  orders.forEach((order) => {
    if (!order || !order.code) return;
    if (selected) selectedOrderCodes.add(order.code);
    else selectedOrderCodes.delete(order.code);
  });
  renderOrders();
}

function invertVisibleOrderSelection() {
  currentPageOrders.forEach((order) => {
    if (selectedOrderCodes.has(order.code)) selectedOrderCodes.delete(order.code);
    else selectedOrderCodes.add(order.code);
  });
  renderOrders();
}

function pendingCommercialApproval(order) {
  return Boolean(order && order.commercialApproval && (order.commercialApproval.status || "Pendiente") === "Pendiente");
}

function commercialApprovalSummary(order) {
  if (!order || !order.commercialApproval) return "";
  const request = order.commercialApproval;
  const typeLabel = {
    product_discount: "Descuento producto",
    general_discount: "Descuento general",
    price_change: "Cambio de precio"
  }[request.type] || "Solicitud comercial";
  const value = request.type === "price_change"
    ? money.format(request.proposedValue || 0)
    : `${formatDecimalInput(request.discountPct || request.proposedValue || 0)}%`;
  return `${typeLabel}: ${value}. ${request.productName ? `${request.productName}. ` : ""}${request.motive || ""}`;
}

function renderCommercialApprovalBadge(order) {
  if (!order || !order.commercialApproval) return "";
  const request = order.commercialApproval;
  const pending = pendingCommercialApproval(order);
  const tone = pending ? "warn" : request.status === "Aprobada" ? "ok" : "danger";
  return `<small class="commercial-approval-line"><span class="tag ${tone}">${escapeHtml(request.status || "Pendiente")}</span> ${escapeHtml(commercialApprovalSummary(order))}</small>`;
}

function exportSelectedOrdersCsv() {
  const rows = selectedOrders();
  const headers = ["pedido", "cliente", "vendedor", "zona", "ruta", "estado", "prioridad", "importe", "productos"];
  const csv = [
    headers.join(","),
    ...rows.map((order) => [
      order.code,
      order.client,
      order.seller,
      orderZoneText(order),
      orderRouteText(order),
      order.status,
      order.priority,
      order.amount,
      order.products
    ].map(csvCell).join(","))
  ].join("\n");
  downloadBlob(`pedidos-seleccionados-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function assemblyOrderRows(orders) {
  return orders.flatMap((order) => {
    const assembly = orderAssemblyInfo(order);
    const client = orderClient(order);
    const items = Array.isArray(order.items) && order.items.length
      ? order.items
      : OrderEngine.parseProductText(order.products || "").map((item) => ({ name: item.name, requestedQty: item.qty }));
    return items.map((item) => ({
      pedido: order.code,
      cliente: order.client,
      direccion: orderAddressText(order) || client?.domicilio || "",
      zona: orderZoneText(order),
      ruta: orderRouteText(order),
      estado: order.status,
      producto: item.name || "",
      cantidad: numeric(item.requestedQty ?? item.qty, 0),
      bultos: assembly.bultos || 0,
      observaciones: assembly.observations || order.observations || order.observaciones || ""
    }));
  });
}

function exportAssemblyList(orders) {
  const eligible = orders.filter((order) => [ORDER_STATUS.READY, ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status));
  if (!eligible.length) {
    setOrdersBulkStatus("No hay pedidos seleccionados en preparacion/armado para exportar.", "warn");
    return;
  }
  const rows = assemblyOrderRows(eligible);
  const headers = ["pedido", "cliente", "direccion", "zona", "ruta", "estado", "producto", "cantidad", "bultos", "observaciones"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))
  ].join("\n");
  downloadBlob(`listado-armado-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const lines = [
    `Pedidos seleccionados: ${eligible.length}`,
    `Generado: ${new Date().toLocaleString("es-AR")}`,
    "",
    ...eligible.flatMap((order) => [
      `${order.code} - ${order.client} - ${order.status} - ${money.format(order.amount || 0)}`,
      `Direccion: ${orderAddressText(order) || "S/D"} | Zona: ${orderZoneText(order)} | Ruta: ${orderRouteText(order)}`,
      `Productos: ${order.products || (order.items || []).map((item) => `${item.name} x${numeric(item.requestedQty ?? item.qty, 0)}`).join(", ")}`,
      `Bultos: ${orderAssemblyInfo(order).bultos || 0} | Obs: ${orderAssemblyInfo(order).observations || order.observations || order.observaciones || "-"}`,
      ""
    ])
  ];
  downloadBlob(`listado-armado-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Listado de Armado", lines));
}

function orderCanBulkPrint(order) {
  return order
    && !(order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0)
    && order.status !== ORDER_STATUS.CANCELLED;
}

async function advanceOrderUntil(orderCode, targetStatus) {
  let guard = 0;
  while (guard < 8) {
    const order = state.orders.find((item) => item.code === orderCode);
    if (!order) throw new Error("Pedido no encontrado.");
    if (order.status === targetStatus) return order;
    const next = nextOrderStatus(order.status);
    if (!next) throw new Error(`No se puede avanzar desde ${order.status}.`);
    if (order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0) {
      throw new Error("Pedido con abastecimiento pendiente.");
    }
    if ([ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status) && targetStatus !== order.status) {
      throw new Error("Este estado requiere etiqueta/escaneo especifico.");
    }
    await postOperationalAction(`api/orders/${encodeURIComponent(orderCode)}/advance`, {});
    guard += 1;
  }
  throw new Error("No se pudo alcanzar el estado solicitado.");
}

async function bulkGenerateLabel(order) {
  const info = orderAssemblyInfo(order);
  await postOperationalAction(`api/orders/${encodeURIComponent(order.code)}/label`, {
    bultos: info.bultos || 1,
    observations: info.observations || "Etiqueta generada por operacion masiva",
    printer: localStorage.getItem("dlLabelPrinter") || ""
  });
}

async function processSingleBulkOrder(order, action, targetStatus) {
  if (targetStatus === ORDER_STATUS.READY) {
    await advanceOrderUntil(order.code, ORDER_STATUS.READY);
    return;
  }
  if (action === "labels" || action === "state-etiquetado" || targetStatus === ORDER_STATUS.LABELED) {
    if (order.status !== ORDER_STATUS.ASSEMBLY && order.status !== ORDER_STATUS.LABELED && order.status !== ORDER_STATUS.READY_DISPATCH) {
      await advanceOrderUntil(order.code, ORDER_STATUS.ASSEMBLY);
    }
    const updated = state.orders.find((item) => item.code === order.code) || order;
    if (!orderAssemblyInfo(updated).generated) await bulkGenerateLabel(updated);
    return;
  }
  if (action === "state-listo" || targetStatus === ORDER_STATUS.READY_DISPATCH) {
    if (order.status !== ORDER_STATUS.READY_DISPATCH) {
      await processSingleBulkOrder(order, "state-etiquetado", ORDER_STATUS.LABELED);
      const updated = state.orders.find((item) => item.code === order.code) || order;
      await postOperationalAction(`api/orders/${encodeURIComponent(order.code)}/scan`, {
        scanValue: orderAssemblyInfo(updated).scanCode || order.code
      });
    }
    return;
  }
  if (action === "state-armado" || targetStatus === ORDER_STATUS.ASSEMBLY) {
    await advanceOrderUntil(order.code, ORDER_STATUS.ASSEMBLY);
    return;
  }
  if (targetStatus === ORDER_STATUS.DISPATCHED) {
    await processSingleBulkOrder(order, "state-listo", ORDER_STATUS.READY_DISPATCH);
    await advanceOrderUntil(order.code, ORDER_STATUS.DISPATCHED);
  }
}

async function runBulkOrderAction(action) {
  const orders = selectedOrders();
  if (!orders.length) {
    setOrdersBulkStatus("No hay pedidos seleccionados.", "warn");
    return;
  }
  if (action === "print") {
    const printable = orders.filter(orderCanBulkPrint);
    if (!printable.length) {
      setOrdersBulkStatus("Los pedidos seleccionados no estan habilitados para imprimir.", "warn");
      return;
    }
    if (!window.confirm(`Se imprimiran ${printable.length} pedidos para Armado. Desea continuar?`)) return;
    printable.forEach((order) => {
      order.updatedAt = new Date().toISOString();
    });
    if (!printOrderInvoice(printable)) return;
    state.activity.unshift({ type: "Deposito", title: "Impresion masiva de armado", text: `${printable.length} facturas/guia emitidas.` });
    saveState();
    setOrdersBulkStatus(`Impresion generada: ${printable.length} pedidos.`, "ok");
    renderForCurrentUser();
    return;
  }
  if (action === "export") {
    exportSelectedOrdersCsv();
    setOrdersBulkStatus(`Listado exportado: ${orders.length} pedidos.`, "ok");
    return;
  }
  if (action === "export-assembly") {
    exportAssemblyList(orders);
    return;
  }
  if (action === "assign-route") {
    const zone = window.prompt("Nombre de zona/ruta para la hoja de reparto:", orderRouteText(orders[0]) || orderZoneText(orders[0]) || "Ruta");
    if (!zone) return;
    const driverUser = window.prompt("Usuario repartidor asignado:", "reparto1") || "reparto1";
    if (!window.confirm(`Se asignaran ${orders.length} pedidos a la ruta ${zone}. Desea continuar?`)) return;
    const payload = await postOperationalAction("api/delivery/routes/plan", {
      orderCodes: orders.map((order) => order.code),
      day: routeDayToday(),
      zone,
      driverUser,
      driverLabel: driverUser
    });
    deliveryPlannerSelection.clear();
    activeDeliveryRouteId = payload.route && payload.route.id || "";
    selectedOrderCodes.clear();
    setOrdersBulkStatus(`Hoja ${activeDeliveryRouteId} planificada con ${orders.length} pedidos.`, "ok");
    renderForCurrentUser();
    return;
  }

  let targetStatus = "";
  if (action === "state-preparacion") targetStatus = ORDER_STATUS.READY;
  if (action === "state-armado") targetStatus = ORDER_STATUS.ASSEMBLY;
  if (action === "state-etiquetado") targetStatus = ORDER_STATUS.LABELED;
  if (action === "state-listo") targetStatus = ORDER_STATUS.READY_DISPATCH;
  if (action === "state-custom") targetStatus = byId("ordersBulkStateSelect").value;
  if (!targetStatus && action !== "labels") {
    setOrdersBulkStatus("Seleccionar estado masivo.", "warn");
    return;
  }
  const label = action === "labels" ? "generar etiquetas" : `cambiar a ${targetStatus}`;
  if (!window.confirm(`Se van a procesar ${orders.length} pedidos para ${label}. Desea continuar?`)) return;
  const started = performance.now();
  const errors = [];
  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index];
    setOrdersBulkStatus(`Procesando pedido ${index + 1} de ${orders.length}: ${order.code}`, "info");
    try {
      await processSingleBulkOrder(order, action, targetStatus);
    } catch (error) {
      errors.push(`${order.code}: ${error.message || "error"}`);
    }
  }
  const seconds = Math.round((performance.now() - started) / 100) / 10;
  if (!errors.length) selectedOrderCodes.clear();
  setOrdersBulkStatus(`Procesados ${orders.length - errors.length}/${orders.length}. Errores: ${errors.length}. Tiempo ${seconds}s.${errors.length ? ` ${errors.slice(0, 3).join(" | ")}` : ""}`, errors.length ? "warn" : "ok");
  renderForCurrentUser();
}

function renderOrders() {
  orderSellerFilter = updateDynamicFilter("ordersSellerFilter", [
    ...state.sellers.map((seller) => seller.name),
    ...state.orders.map((order) => order.seller)
  ], orderSellerFilter, "Todos los vendedores");
  const orders = filteredOrdersForCurrentFilters();
  currentFilteredOrders = orders;

  const pageCount = Math.max(1, Math.ceil(orders.length / ORDERS_PAGE_SIZE));
  if (orderPage > pageCount) orderPage = pageCount;
  if (orderPage < 1) orderPage = 1;
  const pageOrders = orders.slice((orderPage - 1) * ORDERS_PAGE_SIZE, orderPage * ORDERS_PAGE_SIZE);
  currentPageOrders = pageOrders;
  renderOrdersPager(orders.length, pageOrders.length);

  byId("ordersTable").innerHTML = pageOrders.length ? pageOrders.map((order) => `
    <tr class="${order.code === highlightedOrderCode ? "row-highlight" : ""} ${canEditOrder(order) ? "order-editable-row" : ""}" data-order-row="${escapeHtml(order.code)}" ${canEditOrder(order) ? 'title="Doble click para editar pedido"' : ""}>
      <td class="select-col">
        <input class="order-select-checkbox" data-order-select="${escapeHtml(order.code)}" type="checkbox" aria-label="Seleccionar ${escapeHtml(order.code)}" ${selectedOrderCodes.has(order.code) ? "checked" : ""}>
      </td>
      <td>
        <strong>${escapeHtml(order.code)}</strong>
        <small>${escapeHtml(orderSourceLabel(order))} - ${escapeHtml(formatOrderTime(order.createdAt))}</small>
      </td>
      <td>
        <strong>${escapeHtml(order.client)}</strong>
        <small>${escapeHtml(clientOrderSummary(order.client))}</small>
        <small>${escapeHtml(orderAddressText(order))}</small>
      </td>
      <td>
        <strong>${escapeHtml(order.seller)}</strong>
        <small>${escapeHtml(orderZoneText(order))} - ${escapeHtml(orderRouteText(order))}</small>
        <small>${escapeHtml(orderHoursText(order))}</small>
      </td>
      <td>
        ${escapeHtml(order.products)}
        ${order.observations || order.observaciones ? `<small>Obs: ${escapeHtml(order.observations || order.observaciones)}</small>` : ""}
        ${renderCommercialApprovalBadge(order)}
        <small class="${orderSupplySummary(order).missing > 0 ? "stock-error" : "stock-ok"}">${escapeHtml(orderSupplySummary(order).label)}</small>
      </td>
      <td>
        <strong>${money.format(order.amount)}</strong>
        ${orderCommissionInline(order)}
      </td>
      <td>
        <span class="tag ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span>
        <small>${escapeHtml(orderDelayInfo(order).label)}</small>
        ${renderOrderProgress(order)}
        ${renderOrderAssemblyChecklist(order)}
      </td>
      <td>
        ${(() => {
          const priority = orderPriorityInfo(order);
          return `<span class="tag ${priority.tone}">${escapeHtml(priority.label)}</span><small>${escapeHtml(priority.reason)}</small>`;
        })()}
      </td>
      <td>
        <div class="order-actions">
          <button class="mini-btn" type="button" data-order-trace="${escapeHtml(order.code)}">Trazabilidad</button>
          ${isAdminUser() && pendingCommercialApproval(order) ? `<button class="mini-btn" type="button" data-commercial-approval="${escapeHtml(order.code)}" data-commercial-decision="approve">Aprobar</button><button class="mini-btn danger-btn" type="button" data-commercial-approval="${escapeHtml(order.code)}" data-commercial-decision="reject">Rechazar</button>` : ""}
          ${canEditOrder(order) ? `<button class="mini-btn order-edit-btn" type="button" data-order-edit="${escapeHtml(order.code)}">Editar pedido</button>` : ""}
          ${canOpenLabelDialog(order) ? `<button class="mini-btn" type="button" data-order-label="${escapeHtml(order.code)}">Etiqueta</button>` : ""}
          ${canOpenScanDialog(order) ? `<button class="mini-btn" type="button" data-order-scan="${escapeHtml(order.code)}">Escanear</button>` : ""}
          ${!(order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0) && order.status !== ORDER_STATUS.CANCELLED ? `<button class="mini-btn" type="button" data-print="${escapeHtml(order.code)}">Factura</button>` : ""}
          ${nextOrderStatus(order.status) && ![ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status) ? `<button class="mini-btn" type="button" data-order-next="${escapeHtml(order.code)}">Avanzar</button>` : ""}
          ${![ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status) ? `<button class="mini-btn" type="button" data-order-urgent="${escapeHtml(order.code)}">${order.priority === "Urgente" ? "Normal" : "Urgente"}</button>` : ""}
          ${order.inventoryMode === "reservation" && ![ORDER_STATUS.DISPATCHED, ORDER_STATUS.IN_ROUTE, ORDER_STATUS.CHECKED, ORDER_STATUS.PARTIAL_DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status) ? `<button class="mini-btn danger-btn" type="button" data-order-cancel="${escapeHtml(order.code)}">Cancelar</button>` : ""}
        </div>
      </td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="9">No hay pedidos para los filtros seleccionados.</td></tr>';
  renderOrdersBulkPanel();
  renderAssemblyPrintSettings();

  const activeOrders = state.orders
    .filter((order) => ![ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(order.status))
    .sort((a, b) => {
      const urgency = { danger: 0, warn: 1, ok: 2 };
      return urgency[orderPriorityInfo(a).tone] - urgency[orderPriorityInfo(b).tone]
        || orderWorkflowIndex(a.status) - orderWorkflowIndex(b.status)
        || new Date(a.createdAt) - new Date(b.createdAt);
    });

  byId("printQueue").innerHTML = activeOrders.slice(0, 5).map((order) => {
    const priority = orderPriorityInfo(order);
    return `
      <article class="stock-item order-side-card">
        <span class="tag ${priority.tone}">${escapeHtml(priority.label)}</span>
        <strong>${escapeHtml(order.code)} - ${escapeHtml(order.client)}</strong>
        <p>${escapeHtml(order.status)} - ${escapeHtml(orderDelayInfo(order).label)}</p>
        ${renderOrderProgress(order)}
      </article>
    `;
  }).join("") || `<article class="stock-item"><strong>Sin pedidos pendientes</strong><p>No hay pedidos demorados ni en preparacion.</p></article>`;

  const traceOrders = activeOrders.slice(0, 4);
  byId("orderTraceList").innerHTML = traceOrders.map((order) => `
    <article class="order-trace-card">
      <div>
        <strong>${escapeHtml(order.code)} - ${escapeHtml(order.client)}</strong>
        <span class="tag ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <ol>${renderOrderTrace(order)}</ol>
      ${(order.editHistory || []).length ? `<p class="audit-note">Ultima edicion: ${escapeHtml(order.editHistory[order.editHistory.length - 1].user)} - ${escapeHtml(order.editHistory[order.editHistory.length - 1].motive)}</p>` : ""}
    </article>
  `).join("") || `<article class="order-trace-card"><strong>Trazabilidad limpia</strong><p>Sin pedidos activos para mostrar.</p></article>`;
}

function assemblyDepotStatusValues() {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.READY,
    ORDER_STATUS.ASSEMBLY,
    ORDER_STATUS.LABELED,
    ORDER_STATUS.READY_DISPATCH,
    "Confirmado",
    "Pendiente de preparacion",
    "Pendiente de preparaciÃ³n"
  ].filter(Boolean);
}

function isAssemblyDepotOrder(order) {
  if (!order || order.status === ORDER_STATUS.CANCELLED) return false;
  return assemblyDepotStatusValues().some((status) => sameText(order.status, status));
}

function assemblyDepotHasShortage(order) {
  const supply = orderSupplySummary(order);
  const assembly = order && order.assembly && typeof order.assembly === "object" ? order.assembly : {};
  return numeric(supply.missing, 0) > 0 || (Array.isArray(assembly.shortages) && assembly.shortages.length > 0);
}

function assemblyDepotStatusMatches(order) {
  if (assemblyDepotStatusFilter === "all") return true;
  if (assemblyDepotStatusFilter === "shortages") return assemblyDepotHasShortage(order);
  if (assemblyDepotStatusFilter === "delayed") return orderDelayInfo(order).delayed;
  const map = {
    pending: [ORDER_STATUS.PENDING, "Confirmado"],
    ready: [ORDER_STATUS.READY, "Pendiente de preparacion", "Pendiente de preparaciÃ³n"],
    assembly: [ORDER_STATUS.ASSEMBLY],
    labeled: [ORDER_STATUS.LABELED],
    ready_dispatch: [ORDER_STATUS.READY_DISPATCH]
  };
  return (map[assemblyDepotStatusFilter] || []).some((status) => sameText(order.status, status));
}

function assemblyDepotFilteredOrders() {
  const terms = searchTerms(assemblyDepotSearchTerm);
  return (state.orders || [])
    .filter(isAssemblyDepotOrder)
    .filter((order) => assemblyDepotStatusMatches(order))
    .filter((order) => assemblyDepotUrgencyFilter === "all" || orderUrgencyKey(order) === assemblyDepotUrgencyFilter)
    .filter((order) => !assemblyDepotOnlyShortages || assemblyDepotHasShortage(order))
    .filter((order) => !terms.length || matchesSearch(orderSearchText(order), terms))
    .sort((a, b) => compareOrdersBySort(a, b, "priority"));
}

function assemblyControlStatusTone(order) {
  if (sameText(order.status, ORDER_STATUS.READY)) return { className: "prep", label: "En preparacion" };
  if (sameText(order.status, ORDER_STATUS.ASSEMBLY)) return { className: "armed", label: "Armado" };
  if (sameText(order.status, ORDER_STATUS.LABELED)) return { className: "labeled", label: "Etiquetado" };
  if (sameText(order.status, ORDER_STATUS.READY_DISPATCH)) return { className: "ready", label: "Listo para despacho" };
  return { className: "pending", label: order.status || "Pendiente" };
}

function deliveryRouteForOrder(orderCode) {
  return (state.deliveryRoutes || []).find((route) => (
    (route.stops || []).some((stop) => stop.orderCode === orderCode)
    && !isDeliveryRouteClosed(route)
  )) || null;
}

function assemblyControlOrders() {
  const rows = (state.orders || []).filter((order) => (
    [ORDER_STATUS.READY, ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH]
      .some((status) => sameText(order.status, status))
  ));
  const numberFor = (order) => numeric(orderAssemblyInfo(order).orderNumber, Number.MAX_SAFE_INTEGER);
  const textSort = (a, b, getter) => String(getter(a) || "").localeCompare(String(getter(b) || ""), "es") || numberFor(a) - numberFor(b);
  return rows.sort((a, b) => {
    if (assemblyControlSortKey === "route") return textSort(a, b, (order) => orderRouteText(order) || orderZoneText(order));
    if (assemblyControlSortKey === "hours") return textSort(a, b, orderHoursText);
    if (assemblyControlSortKey === "client") return textSort(a, b, (order) => order.client);
    return numberFor(a) - numberFor(b) || new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
  });
}

function renderAssemblyControlPanel() {
  const rows = assemblyControlOrders();
  return `
    <section class="table-panel assembly-control-panel">
      <div class="table-header">
        <div>
          <h2>Panel de Control de Armado</h2>
          <p>${rows.length} pedidos en cola operativa. Priorizar por orden de armado y ruta.</p>
        </div>
        <label class="compact-select-label">
          <span>Ordenar por</span>
          <select id="assemblyControlSort" aria-label="Ordenar panel de armado">
            <option value="assembly_order" ${assemblyControlSortKey === "assembly_order" ? "selected" : ""}>Orden de Armado</option>
            <option value="route" ${assemblyControlSortKey === "route" ? "selected" : ""}>Ruta</option>
            <option value="hours" ${assemblyControlSortKey === "hours" ? "selected" : ""}>Horario</option>
            <option value="client" ${assemblyControlSortKey === "client" ? "selected" : ""}>Cliente</option>
          </select>
        </label>
      </div>
      <div class="assembly-control-legend">
        <span><i class="assembly-dot armed"></i>Armado</span>
        <span><i class="assembly-dot prep"></i>En preparacion</span>
        <span><i class="assembly-dot labeled"></i>Etiquetado</span>
        <span><i class="assembly-dot ready"></i>Listo para despacho</span>
      </div>
      <div class="responsive-table assembly-control-table">
        <table>
          <thead>
            <tr>
              <th>Orden</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Bultos</th>
              <th>Estado</th>
              <th>Ruta</th>
              <th>Repartidor</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((order) => {
              const assembly = orderAssemblyInfo(order);
              const route = deliveryRouteForOrder(order.code);
              const tone = assemblyControlStatusTone(order);
              return `
                <tr>
                  <td><strong>${escapeHtml(formatAssemblyOrderNumber(assembly))}</strong></td>
                  <td>Pedido ${escapeHtml(formatAssemblyPedidoNumber(order.code))}</td>
                  <td><strong>${escapeHtml(order.client)}</strong><small>${escapeHtml(orderHoursText(order) || "Sin horario")}</small></td>
                  <td>${escapeHtml(String(assembly.bultos || 0))}</td>
                  <td><span class="assembly-state ${tone.className}">${escapeHtml(tone.label)}</span></td>
                  <td>${escapeHtml(route ? route.id : (orderRouteText(order) || orderZoneText(order) || "Sin ruta"))}</td>
                  <td>${escapeHtml(route ? (route.deviceLabel || route.driverUser || "Sin asignar") : "Sin asignar")}</td>
                </tr>
              `;
            }).join("") : '<tr><td colspan="7" class="stock-empty">No hay pedidos activos para armado.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function assemblyDepotMetric(label, value, hint, tone = "") {
  return `
    <article class="metric-card ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(hint)}</small>
    </article>
  `;
}

function assemblyDepotStats() {
  const orders = (state.orders || []).filter(isAssemblyDepotOrder);
  const today = routeDayToday();
  const isToday = (value) => String(value || "").slice(0, 10) === today;
  return {
    pending: orders.filter((order) => [ORDER_STATUS.PENDING, ORDER_STATUS.READY].some((status) => sameText(order.status, status))).length,
    preparation: orders.filter((order) => sameText(order.status, ORDER_STATUS.READY)).length,
    assembly: orders.filter((order) => sameText(order.status, ORDER_STATUS.ASSEMBLY)).length,
    shortages: orders.filter(assemblyDepotHasShortage).length,
    labels: orders.filter((order) => sameText(order.status, ORDER_STATUS.ASSEMBLY) && !orderAssemblyInfo(order).generated).length,
    readyDispatch: orders.filter((order) => sameText(order.status, ORDER_STATUS.READY_DISPATCH)).length,
    delayed: orders.filter((order) => orderDelayInfo(order).delayed).length,
    packagesToday: orders
      .filter((order) => isToday(order.updatedAt) || isToday(order.lastPrintedAt) || isToday(order.createdAt))
      .reduce((sum, order) => sum + numeric(orderAssemblyInfo(order).bultos, 0), 0)
  };
}

function assemblyDepotActionLabel(order) {
  if (sameText(order.status, ORDER_STATUS.PENDING)) return "Pasar a preparacion";
  if (sameText(order.status, ORDER_STATUS.READY)) return "Finalizar armado";
  return "Avanzar";
}

function assemblyDepotOrderItemsHtml(order) {
  const items = assemblyOrderItems(order);
  if (!items.length) return '<p class="empty-note">Pedido sin detalle de productos.</p>';
  return `
    <div class="assembly-depot-items">
      ${items.map((item) => {
        const qty = numeric(item.requestedQty ?? item.qty ?? item.quantity, 0);
        const controlled = [ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status);
        return `
          <label class="assembly-depot-item">
            <input type="checkbox" ${controlled ? "checked" : ""}>
            <span>
              <strong>${escapeHtml(item.name || item.descripcion || "Producto")}</strong>
              <small>${escapeHtml(item.productCode || item.codigo_producto || item.code || "Sin codigo")} - Cantidad ${escapeHtml(String(qty || item.qty || "-"))}</small>
            </span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function assemblyDepotOrderCard(order) {
  const supply = orderSupplySummary(order);
  const priority = orderPriorityInfo(order);
  const delay = orderDelayInfo(order);
  const assembly = orderAssemblyInfo(order);
  const client = orderClient(order) || {};
  const canAdvance = nextOrderStatus(order.status)
    && ![ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status)
    && !(order.status === ORDER_STATUS.PENDING && supply.missing > 0);
  return `
    <article class="assembly-depot-card ${delay.delayed ? "delayed" : ""}" data-order-row="${escapeHtml(order.code)}">
      <div class="assembly-depot-card-head">
        <label class="assembly-select">
          <input type="checkbox" data-assembly-select="${escapeHtml(order.code)}" ${selectedOrderCodes.has(order.code) ? "checked" : ""}>
          <span>${escapeHtml(order.code)}</span>
        </label>
        <span class="tag ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <div class="assembly-depot-main">
        <div>
          <h3>${escapeHtml(order.client)}</h3>
          <p>${escapeHtml(orderAddressText(order) || client.domicilio || "Sin direccion")}</p>
          <small>${escapeHtml(order.seller || "-")} - ${escapeHtml(orderZoneText(order))} - ${escapeHtml(orderRouteText(order))}</small>
        </div>
        <div class="assembly-depot-side">
          <span class="tag ${priority.tone}">${escapeHtml(priority.label)}</span>
          <small>${escapeHtml(delay.label)}</small>
          <small>Orden ${escapeHtml(formatAssemblyOrderNumber(assembly))}</small>
          <strong>${escapeHtml(String(assembly.bultos || 0))} bultos</strong>
        </div>
      </div>
      ${assemblyDepotOrderItemsHtml(order)}
      <div class="assembly-depot-flags">
        <span class="${supply.missing > 0 ? "stock-error" : "stock-ok"}">${escapeHtml(supply.label)}</span>
        ${renderOrderAssemblyChecklist(order)}
      </div>
      <div class="assembly-depot-actions">
        <button class="mini-btn" type="button" data-print="${escapeHtml(order.code)}">Factura / guia</button>
        <button class="mini-btn" type="button" data-order-trace="${escapeHtml(order.code)}">Historial</button>
        ${canAdvance ? `<button class="mini-btn primary-mini" type="button" data-order-next="${escapeHtml(order.code)}">${escapeHtml(assemblyDepotActionLabel(order))}</button>` : ""}
        ${canOpenLabelDialog(order) ? `<button class="mini-btn primary-mini" type="button" data-order-label="${escapeHtml(order.code)}">Etiquetas</button>` : ""}
        ${canOpenScanDialog(order) ? `<button class="mini-btn primary-mini" type="button" data-order-scan="${escapeHtml(order.code)}">Scanner</button>` : ""}
      </div>
    </article>
  `;
}

function selectedAssemblyDepotOrders() {
  return currentAssemblyDepotOrders.filter((order) => selectedOrderCodes.has(order.code));
}

async function runAssemblyDepotBulkAction(action) {
  const orders = selectedAssemblyDepotOrders();
  if (!orders.length) {
    setOrdersBulkStatus("Seleccionar pedidos visibles de armado.", "warn");
    return;
  }
  selectedOrderCodes.clear();
  orders.forEach((order) => selectedOrderCodes.add(order.code));
  await runBulkOrderAction(action);
  renderAssemblyDepot();
}

function renderAssemblyDepot() {
  const workspace = byId("assemblyDepotWorkspace");
  if (!workspace) return;
  const stats = assemblyDepotStats();
  const orders = assemblyDepotFilteredOrders();
  currentAssemblyDepotOrders = orders;
  const selectedCount = selectedAssemblyDepotOrders().length;
  workspace.innerHTML = `
    <section class="panel assembly-depot-hero">
      <div>
        <span class="eyebrow">Operacion de deposito</span>
        <h2>Armado / Deposito</h2>
        <p>Preparar, controlar, imprimir, etiquetar y dejar pedidos listos para despacho.</p>
      </div>
      <div class="assembly-depot-hero-actions">
        <button class="primary-btn" type="button" data-assembly-bulk-action="print">Imprimir hojas</button>
        <button class="secondary-btn" type="button" data-assembly-bulk-action="labels">Generar etiquetas</button>
        <button class="secondary-btn" type="button" data-assembly-bulk-action="export-assembly">Exportar armado</button>
      </div>
    </section>
    <section class="metrics-grid assembly-depot-metrics">
      ${assemblyDepotMetric("Pendientes", stats.pending, "Pedidos por preparar", "warn")}
      ${assemblyDepotMetric("En preparacion", stats.preparation, "Listos para mesa", "ok")}
      ${assemblyDepotMetric("Armados", stats.assembly, "Esperan etiqueta", "warn")}
      ${assemblyDepotMetric("Con faltantes", stats.shortages, "Revisar compras", stats.shortages ? "danger" : "ok")}
      ${assemblyDepotMetric("Pendientes etiqueta", stats.labels, "Bultos sin etiqueta", "warn")}
      ${assemblyDepotMetric("Listos despacho", stats.readyDispatch, "Para hoja de ruta", "ok")}
      ${assemblyDepotMetric("Demorados", stats.delayed, "Atencion operativa", stats.delayed ? "danger" : "ok")}
      ${assemblyDepotMetric("Bultos hoy", stats.packagesToday, "Preparados en la jornada", "ok")}
    </section>
    ${renderAssemblyControlPanel()}
    <section class="table-panel assembly-depot-board">
      <div class="table-header">
        <div>
          <h2>Cola de armado</h2>
          <p>${orders.length} pedidos visibles. ${selectedCount} seleccionados.</p>
        </div>
        <span id="assemblyDepotBulkStatus" class="bulk-inline-status" data-tone="info">Seleccionar pedidos para operar.</span>
      </div>
      <div class="data-filter-bar">
        <label class="data-search-box">
          <span>Buscar pedido</span>
          <input id="assemblyDepotSearch" type="search" value="${escapeHtml(assemblyDepotSearchTerm)}" autocomplete="off" placeholder="Pedido, cliente, producto, zona o vendedor">
        </label>
        <select id="assemblyDepotStatusFilter" aria-label="Filtrar armado por estado">
          <option value="all" ${assemblyDepotStatusFilter === "all" ? "selected" : ""}>Todos los estados</option>
          <option value="pending" ${assemblyDepotStatusFilter === "pending" ? "selected" : ""}>Pendientes</option>
          <option value="ready" ${assemblyDepotStatusFilter === "ready" ? "selected" : ""}>En preparacion</option>
          <option value="assembly" ${assemblyDepotStatusFilter === "assembly" ? "selected" : ""}>Armados</option>
          <option value="labeled" ${assemblyDepotStatusFilter === "labeled" ? "selected" : ""}>Etiquetados</option>
          <option value="ready_dispatch" ${assemblyDepotStatusFilter === "ready_dispatch" ? "selected" : ""}>Listos despacho</option>
          <option value="shortages" ${assemblyDepotStatusFilter === "shortages" ? "selected" : ""}>Con faltantes</option>
          <option value="delayed" ${assemblyDepotStatusFilter === "delayed" ? "selected" : ""}>Demorados</option>
        </select>
        <select id="assemblyDepotUrgencyFilter" aria-label="Filtrar armado por urgencia">
          <option value="all" ${assemblyDepotUrgencyFilter === "all" ? "selected" : ""}>Todas las urgencias</option>
          <option value="urgent" ${assemblyDepotUrgencyFilter === "urgent" ? "selected" : ""}>Urgentes</option>
          <option value="delayed" ${assemblyDepotUrgencyFilter === "delayed" ? "selected" : ""}>Con demora</option>
          <option value="normal" ${assemblyDepotUrgencyFilter === "normal" ? "selected" : ""}>Normal</option>
        </select>
        <label class="inline-check assembly-shortage-check"><input id="assemblyDepotOnlyShortages" type="checkbox" ${assemblyDepotOnlyShortages ? "checked" : ""}> Solo faltantes</label>
        <button class="ghost-btn" type="button" data-assembly-clear-filters>Limpiar</button>
      </div>
      <div class="bulk-actions-panel assembly-depot-bulk">
        <div class="bulk-actions-head">
          <strong>Pedidos seleccionados: ${selectedCount}</strong>
          <span>La seleccion se mantiene mientras filtres o cambies de vista.</span>
        </div>
        <div class="bulk-actions-row">
          <button class="mini-btn" type="button" data-assembly-select-visible>Seleccionar visibles</button>
          <button class="mini-btn" type="button" data-assembly-invert-visible>Invertir visibles</button>
          <button class="mini-btn" type="button" data-assembly-clear-selection>Quitar seleccion</button>
        </div>
        <div class="bulk-actions-row">
          <button class="secondary-btn" type="button" data-assembly-bulk-action="print">Imprimir para armado</button>
          <button class="secondary-btn" type="button" data-assembly-bulk-action="state-preparacion">Marcar en preparacion</button>
          <button class="secondary-btn" type="button" data-assembly-bulk-action="state-armado">Marcar armado</button>
          <button class="secondary-btn" type="button" data-assembly-bulk-action="state-etiquetado">Marcar etiquetado</button>
          <button class="secondary-btn" type="button" data-assembly-bulk-action="state-listo">Listo despacho</button>
          <button class="secondary-btn" type="button" data-assembly-bulk-action="export-assembly">Exportar armado</button>
        </div>
      </div>
      <div class="assembly-depot-list">
        ${orders.length ? orders.map(assemblyDepotOrderCard).join("") : '<p class="stock-empty">No hay pedidos para los filtros seleccionados.</p>'}
      </div>
    </section>
  `;
}

function routeDayToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function routeContainsActiveOrder(orderCode) {
  return (state.deliveryRoutes || []).some((route) => (
    !isDeliveryRouteClosed(route)
    && (route.stops || []).some((stop) => (
      stop.orderCode === orderCode
      && ![ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED, ORDER_STATUS.REJECTED].includes(stop.status)
    ))
  ));
}

function deliveryOrderDestinationInfo(order) {
  const address = orderAddressText(order);
  const hasDestination = Boolean(DeliveryEngine.navigationUrl(state, order.code));
  return {
    hasDestination,
    text: hasDestination ? (address || "GPS cargado") : "Sin domicilio ni GPS"
  };
}

function deliveryPlannerCandidates() {
  return state.orders
    .filter((order) => [ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED].includes(order.status) && !routeContainsActiveOrder(order.code))
    .sort((a, b) => compareOrdersBySort(a, b, deliveryPlannerSortKey));
}

function deliveryPlannerGroupKey(order) {
  return orderRouteText(order) || orderZoneText(order) || "Sin ruta";
}

function renderDeliveryPlannerOrder(order) {
  const destination = deliveryOrderDestinationInfo(order);
  const route = deliveryPlannerGroupKey(order);
  const assembly = orderAssemblyInfo(order);
  const selected = deliveryPlannerSelection.has(order.code);
  return `
    <label class="delivery-planner-order ${selected ? "selected" : ""} ${destination.hasDestination ? "" : "invalid"}">
      <input type="checkbox" data-planner-order="${escapeHtml(order.code)}" ${selected ? "checked" : ""} ${destination.hasDestination ? "" : "disabled"}>
      <span>
        <strong>${escapeHtml(order.code)} - ${escapeHtml(order.client)}</strong>
        <small>${escapeHtml(route)} - ${escapeHtml(orderZoneText(order))} - ${escapeHtml(orderHoursText(order))}</small>
        <small>${escapeHtml(destination.text)} - ${money.format(order.amount)} - Orden ${escapeHtml(formatAssemblyOrderNumber(assembly))} - ${escapeHtml(String(assembly.bultos || 0))} bultos</small>
      </span>
      <em>${escapeHtml(order.priority || "Normal")}</em>
    </label>
  `;
}

function renderDeliveryPlanner() {
  const form = byId("deliveryPlannerForm");
  const list = byId("deliveryPlannerList");
  const summary = byId("deliveryPlannerSummary");
  if (!form || !list || !summary) return;
  const day = byId("deliveryPlannerDay");
  if (day && !day.value) day.value = routeDayToday();

  const candidates = deliveryPlannerCandidates();
  const candidateCodes = new Set(candidates.map((order) => order.code));
  deliveryPlannerSelection = new Set(Array.from(deliveryPlannerSelection).filter((code) => candidateCodes.has(code)));
  const selectedOrders = candidates.filter((order) => deliveryPlannerSelection.has(order.code));
  const blocked = candidates.filter((order) => !deliveryOrderDestinationInfo(order).hasDestination).length;
  const routeCount = new Set(candidates.map(deliveryPlannerGroupKey)).size;
  const total = selectedOrders.reduce((sum, order) => sum + numeric(order.amount, 0), 0);
  summary.innerHTML = `
    <span>${candidates.length} listos para despacho</span>
    <span>${selectedOrders.length} seleccionados</span>
    <span>${money.format(total)}</span>
    <span>${routeCount} rutas detectadas</span>
    <span>${blocked} con domicilio pendiente</span>
  `;

  if (!candidates.length) {
    list.innerHTML = '<div class="empty-note">No hay pedidos listos para despacho disponibles para planificar.</div>';
    return;
  }
  if (!deliveryPlannerGroupByRoute) {
    list.innerHTML = candidates.map(renderDeliveryPlannerOrder).join("");
    return;
  }
  const groups = candidates.reduce((acc, order) => {
    const key = deliveryPlannerGroupKey(order);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(order);
    return acc;
  }, new Map());
  list.innerHTML = Array.from(groups.entries()).map(([route, orders]) => `
    <section class="delivery-planner-group">
      <div class="delivery-planner-group-head">
        <strong>${escapeHtml(route)}</strong>
        <span>${orders.length} pedidos</span>
      </div>
      <div class="delivery-planner-group-list">
        ${orders.map(renderDeliveryPlannerOrder).join("")}
      </div>
    </section>
  `).join("");
}

function isDeliveryRouteClosed(routeOrStatus) {
  const status = typeof routeOrStatus === "string" ? routeOrStatus : routeOrStatus && routeOrStatus.status;
  if (routeOrStatus && typeof routeOrStatus === "object" && String(status || "").trim() === "Completada" && !routeOrStatus.closure) {
    return false;
  }
  return DELIVERY_CLOSED_ROUTE_STATUSES.has(String(status || "").trim());
}

function isDeliveryRouteOperative(route) {
  if (!route || isDeliveryRouteClosed(route)) return false;
  const status = String(route.status || "").trim();
  return !status || DELIVERY_OPERATIVE_ROUTE_STATUSES.has(status) || status !== "Planificada";
}

function isDeliveryRoutePublished(route) {
  return route && !isDeliveryRouteClosed(route) && String(route.status || "").trim() !== "Planificada";
}

function visibleDeliveryRoutes() {
  const routes = state.deliveryRoutes || [];
  if (!currentUser) return [];
  if (currentUser.role === "admin") {
    return routes.filter((route) => isDeliveryRoutePublished(route) || route.id === activeDeliveryRouteId);
  }
  if (currentUser.role === "driver") {
    return routes.filter((route) => (
      isDeliveryRoutePublished(route)
      && (
        route.driverUser === currentUser.username
        || route.deviceId === deliveryDevice.id
        || (!route.driverUser && !route.deviceId)
      )
    ));
  }
  return [];
}

function deliveryTone(status) {
  if ([ORDER_STATUS.REJECTED, ORDER_STATUS.NOT_DELIVERED].includes(status)) return "danger";
  if (status === ORDER_STATUS.POSTPONED) return "warn";
  if (["Completada", ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(status)) return "ok";
  if ([ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED].includes(status)) return "ok";
  if (status === ORDER_STATUS.PARTIAL_DELIVERED) return "warn";
  if ([ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.IN_ROUTE, ORDER_STATUS.CHECKED, "En curso", "Planificada"].includes(status)) return "warn";
  return "";
}

function isDeliveryStopClosed(status) {
  return [ORDER_STATUS.PARTIAL_DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED, ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED, ORDER_STATUS.REJECTED].includes(status);
}

function isDeliveryStopDelivered(status) {
  return [ORDER_STATUS.PARTIAL_DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(status);
}

function deliveryClosureSummary(route, input = {}) {
  if (!route) return null;
  return DeliveryEngine.routeClosureSummary(route, input);
}

function deliveryDifferenceTone(value) {
  const difference = numeric(value, 0);
  if (Math.abs(difference) < 0.01) return "ok";
  return difference < 0 ? "danger" : "warn";
}

function deliveryClosureMetricsHtml(summary) {
  if (!summary) return "";
  return `
    <div class="delivery-closure-grid">
      <div class="delivery-closure-metric">
        <span>Entregados</span>
        <strong>${summary.deliveredOrders}/${summary.totalOrders}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Pendientes</span>
        <strong>${summary.pendingOrders}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Devueltos</span>
        <strong>${summary.returnedOrders}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Efectivo esperado</span>
        <strong>${money.format(summary.expectedCash)}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Transferencias esperadas</span>
        <strong>${money.format(summary.expectedTransfer)}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Saldo pendiente</span>
        <strong>${money.format(summary.pendingAmount)}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Efectivo informado</span>
        <strong>${money.format(summary.reportedCash)}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Transferencias informadas</span>
        <strong>${money.format(summary.reportedTransfer)}</strong>
      </div>
      <div class="delivery-closure-metric">
        <span>Diferencia total</span>
        <strong>${money.format(summary.totalDifference)}</strong>
      </div>
    </div>
  `;
}

function activeRouteForDelivery(routes) {
  let route = routes.find((item) => item.id === activeDeliveryRouteId);
  if (!route) {
    route = routes.find((item) => item.driverUser === currentUser?.username && !isDeliveryRouteClosed(item))
      || routes.find((item) => item.deviceId === deliveryDevice.id && !isDeliveryRouteClosed(item))
      || routes.find((item) => !isDeliveryRouteClosed(item))
      || routes[0]
      || null;
    activeDeliveryRouteId = route ? route.id : "";
  }
  return route;
}

function deliveryRouteStats(route) {
  const stops = route && Array.isArray(route.stops) ? route.stops : [];
  const closed = stops.filter((stop) => isDeliveryStopClosed(stop.status)).length;
  const delivered = stops.filter((stop) => isDeliveryStopDelivered(stop.status)).length;
  const exceptions = stops.filter((stop) => [ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.POSTPONED, ORDER_STATUS.REJECTED].includes(stop.status)).length;
  const pending = Math.max(0, stops.length - closed);
  const progress = stops.length ? Math.round((closed / stops.length) * 100) : 0;
  return { stops, closed, delivered, exceptions, pending, progress };
}

function deliveryStopDestination(stop) {
  const coordinates = stop && stop.coordinates;
  if (coordinates && Number.isFinite(Number(coordinates.lat)) && Number.isFinite(Number(coordinates.lng))) {
    return `${Number(coordinates.lat)},${Number(coordinates.lng)}`;
  }
  return String(stop && stop.address || "").trim();
}

function deliveryRouteDirectionsUrl(route) {
  const pendingStops = (route && route.stops || []).filter((stop) => !isDeliveryStopClosed(stop.status));
  const destinations = pendingStops.map(deliveryStopDestination).filter((value) => value && value !== "Sin domicilio");
  if (!destinations.length) return "";
  const origin = deliveryLocation && Number.isFinite(Number(deliveryLocation.lat)) && Number.isFinite(Number(deliveryLocation.lng))
    ? `${deliveryLocation.lat},${deliveryLocation.lng}`
    : "";
  const destination = destinations[destinations.length - 1];
  const waypoints = destinations.slice(0, -1).slice(0, 9);
  return `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${encodeURIComponent(origin)}` : ""}&destination=${encodeURIComponent(destination)}${waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}` : ""}`;
}

function routeClientByName(name) {
  const target = normalizeSearchText(name);
  return (state.clients || []).find((client) => normalizeSearchText(client.name || client.nombre_comercial) === target) || null;
}

function deliveryRouteMapStops(route) {
  return (route && route.stops || []).map((stop, index) => {
    const order = state.orders.find((item) => item.code === stop.orderCode) || null;
    const client = order ? orderClient(order) : routeClientByName(stop.client);
    const clientPoint = clientGpsPoint(client);
    const coordinates = stop.coordinates || clientPoint || null;
    const address = firstText(stop.address, order && orderAddressText(order), client && client.domicilio);
    return {
      stop,
      order,
      client,
      index,
      sequence: stop.sequence || index + 1,
      label: stop.client || order && order.client || "Cliente",
      amount: numeric(stop.amount || order && order.amount, 0),
      status: stop.status || order && order.status || "",
      address,
      coordinates: coordinates && Number.isFinite(Number(coordinates.lat)) && Number.isFinite(Number(coordinates.lng))
        ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
        : null
    };
  }).sort((a, b) => numeric(a.sequence, a.index + 1) - numeric(b.sequence, b.index + 1));
}

function renderDeliveryActivePanel(route, routes) {
  const title = byId("deliveryLiveRouteTitle");
  const meta = byId("deliveryLiveRouteMeta");
  const summary = byId("deliveryActiveRouteSummary");
  const actions = byId("deliveryLiveRouteActions");
  if (!title || !meta || !summary || !actions) return;

  if (!route) {
    title.textContent = "Hoja de ruta activa";
    meta.textContent = routes.length ? "Seleccionar una ruta disponible" : "Sin rutas disponibles para este equipo";
    actions.innerHTML = "";
    summary.innerHTML = `
      <article class="delivery-active-empty">
        <strong>Sin ruta activa</strong>
        <p>Cuando Administracion publique una hoja de ruta, aparecera arriba con mapa, paradas y progreso.</p>
      </article>
    `;
    renderDeliveryRouteMap(null);
    return;
  }

  const stats = deliveryRouteStats(route);
  const current = DeliveryEngine.nextStop(route);
  const allStopsManaged = stats.stops.length > 0 && stats.stops.every((stop) => isDeliveryStopClosed(stop.status));
  const assignedHere = route.deviceId === deliveryDevice.id || route.driverUser === currentUser?.username || (!route.driverUser && !route.deviceId);
  const canClaim = currentUser?.role === "driver" && isDeliveryRoutePublished(route) && assignedHere && !route.deviceId;
  const canCloseRoute = !route.closure && isDeliveryRoutePublished(route) && (isAdminUser() || assignedHere) && allStopsManaged;
  const directionsUrl = deliveryRouteDirectionsUrl(route);

  title.textContent = `${route.zone || "Ruta"} - ${route.id}`;
  meta.textContent = `${route.day || "Sin dia"} - ${route.deviceLabel || route.driverUser || "Sin dispositivo"} - ${stats.closed}/${stats.stops.length} gestionadas`;
  actions.innerHTML = `
    ${directionsUrl ? `<button class="secondary-btn" type="button" data-delivery-route-map-open="${escapeHtml(route.id)}">Abrir recorrido</button>` : ""}
    ${canClaim ? `<button class="primary-btn" type="button" data-claim-route="${escapeHtml(route.id)}">Tomar Ruta</button>` : ""}
    ${canCloseRoute ? `<button class="primary-btn" type="button" data-close-route="${escapeHtml(route.id)}">Rendir caja</button>` : ""}
  `;
  summary.innerHTML = `
    <div class="delivery-progress-hero">
      <span class="tag ${deliveryTone(route.status)}">${escapeHtml(route.status || "Ruta")}</span>
      <strong>${stats.progress}% completado</strong>
      <div class="delivery-progress-track"><i style="width:${stats.progress}%"></i></div>
      <small>${stats.delivered} entregadas - ${stats.exceptions} incidencias - ${stats.pending} pendientes</small>
    </div>
    <article class="delivery-next-stop-card">
      <span>Proxima parada</span>
      ${current ? `
        <strong>${escapeHtml(current.client)}</strong>
        <p>${escapeHtml(current.address || "Domicilio pendiente")}</p>
        <small>${escapeHtml(current.hours || "Sin horario")} - ${money.format(current.amount || 0)}</small>
        <div class="delivery-next-actions">
          ${DeliveryEngine.navigationUrl(state, current.orderCode) ? `<button class="secondary-btn" type="button" data-delivery-map="${escapeHtml(current.orderCode)}">IR AL CLIENTE</button>` : ""}
        </div>
      ` : `
        <strong>Ruta gestionada</strong>
        <p>${route.closure ? "Caja rendida y cierre diario registrado." : "Ya no quedan paradas activas. Rendir caja cuando corresponda."}</p>
      `}
    </article>
    <div class="delivery-route-finance">
      <span><small>Efectivo</small><strong>${money.format(route.cashTotal || 0)}</strong></span>
      <span><small>Transferencias</small><strong>${money.format(route.transferTotal || 0)}</strong></span>
      <span><small>Pendiente</small><strong>${money.format(route.pendingTotal || 0)}</strong></span>
    </div>
  `;
  renderDeliveryRouteMap(route);
}

function deliveryMapEmpty(message, detail = "") {
  const mapElement = byId("deliveryRouteMap");
  const legend = byId("deliveryRouteMapLegend");
  if (!mapElement) return;
  mapElement.classList.remove("google-loaded", "delivery-fallback-loaded");
  mapElement.innerHTML = `
    <div class="delivery-route-map-empty">
      <strong>${escapeHtml(message)}</strong>
      ${detail ? `<span>${escapeHtml(detail)}</span>` : ""}
    </div>
  `;
  if (legend) legend.innerHTML = "";
}

function clearDeliveryGoogleMap() {
  deliveryRouteMarkers.forEach((marker) => marker.setMap(null));
  deliveryRouteMarkers = [];
  if (deliveryRoutePolyline) {
    deliveryRoutePolyline.setMap(null);
    deliveryRoutePolyline = null;
  }
}

function deliveryFallbackBounds(stops) {
  const located = stops.filter((item) => item.coordinates);
  if (!located.length) return null;
  const lats = located.map((item) => item.coordinates.lat);
  const lngs = located.map((item) => item.coordinates.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    latSpan: Math.max(0.0001, maxLat - minLat),
    lngSpan: Math.max(0.0001, maxLng - minLng)
  };
}

function deliveryFallbackPoint(item, index, total, bounds) {
  if (item.coordinates && bounds) {
    return {
      x: 10 + ((item.coordinates.lng - bounds.minLng) / bounds.lngSpan) * 80,
      y: 84 - ((item.coordinates.lat - bounds.minLat) / bounds.latSpan) * 68
    };
  }
  const safeTotal = Math.max(1, total - 1);
  const ratio = safeTotal ? index / safeTotal : 0.5;
  return {
    x: 14 + ratio * 72,
    y: 72 - Math.sin(ratio * Math.PI) * 46
  };
}

function renderDeliveryRouteMapFallback(route, stops, detail = "") {
  const mapElement = byId("deliveryRouteMap");
  const legend = byId("deliveryRouteMapLegend");
  if (!mapElement) return;
  clearDeliveryGoogleMap();
  deliveryRouteMap = null;
  const sortedStops = stops.length ? stops : deliveryRouteMapStops(route).filter((item) => !isDeliveryStopDelivered(item.status));
  const bounds = deliveryFallbackBounds(sortedStops);
  const pointButtons = sortedStops.map((item, index) => {
    const point = deliveryFallbackPoint(item, index, sortedStops.length, bounds);
    return `
      <button class="delivery-route-pin" type="button" data-delivery-map="${escapeHtml(item.stop.orderCode)}" style="left:${point.x}%; top:${point.y}%;" aria-label="Abrir Maps para ${escapeHtml(item.label)}">
        ${escapeHtml(String(item.sequence))}
      </button>
    `;
  }).join("");
  mapElement.classList.remove("google-loaded");
  mapElement.classList.add("delivery-fallback-loaded");
  mapElement.innerHTML = `
    <div class="delivery-route-board">
      <div class="delivery-route-board-map">
        <span class="delivery-route-board-road main"></span>
        <span class="delivery-route-board-road side"></span>
        ${pointButtons}
      </div>
      <div class="delivery-route-board-list">
        ${sortedStops.map((item) => `
          <button type="button" data-delivery-map="${escapeHtml(item.stop.orderCode)}">
            <strong>${escapeHtml(item.sequence)}. ${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.address || "Domicilio pendiente")}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
  if (legend) {
    const withGps = sortedStops.filter((item) => item.coordinates).length;
    legend.innerHTML = `
      <span>${sortedStops.length} paradas interactivas</span>
      <span>${withGps} con GPS cliente${detail ? ` - ${escapeHtml(detail)}` : ""}</span>
    `;
  }
}

function geocodeDeliveryAddress(address) {
  const cleanAddress = String(address || "").trim();
  if (!cleanAddress || cleanAddress === "Sin domicilio") return Promise.resolve(null);
  const key = normalizeSearchText(cleanAddress);
  if (deliveryMapGeocodeCache.has(key)) return Promise.resolve(deliveryMapGeocodeCache.get(key));
  deliveryMapGeocoder = deliveryMapGeocoder || new google.maps.Geocoder();
  return new Promise((resolve) => {
    deliveryMapGeocoder.geocode({ address: cleanAddress }, (results, status) => {
      if (status === "OK" && results && results[0] && results[0].geometry && results[0].geometry.location) {
        const location = results[0].geometry.location;
        const point = { lat: location.lat(), lng: location.lng() };
        deliveryMapGeocodeCache.set(key, point);
        resolve(point);
        return;
      }
      resolve(null);
    });
  });
}

async function resolveDeliveryMapStops(stops) {
  return Promise.all(stops.map(async (item) => {
    if (item.coordinates) return { ...item, position: item.coordinates, source: "GPS cliente" };
    const geocoded = await geocodeDeliveryAddress(item.address);
    return geocoded ? { ...item, position: geocoded, source: "Domicilio geocodificado" } : { ...item, position: null, source: "Sin ubicacion" };
  }));
}

async function renderDeliveryRouteMap(route) {
  const token = ++deliveryMapRenderToken;
  const mapElement = byId("deliveryRouteMap");
  const legend = byId("deliveryRouteMapLegend");
  if (!mapElement) return;
  if (!route) {
    clearDeliveryGoogleMap();
    deliveryRouteMap = null;
    deliveryMapEmpty("Sin ruta activa", "Seleccionar o tomar una hoja de ruta para ver sus paradas.");
    return;
  }
  const stops = deliveryRouteMapStops(route).filter((item) => !isDeliveryStopDelivered(item.status));
  if (!stops.length) {
    clearDeliveryGoogleMap();
    deliveryMapEmpty("Ruta sin paradas pendientes", "Los pedidos entregados se ocultan automaticamente.");
    return;
  }
  if (!canUseGoogleMaps()) {
    renderDeliveryRouteMapFallback(route, stops, "Maps externo disponible");
    return;
  }
  if (!deliveryRouteMap) renderDeliveryRouteMapFallback(route, stops, "Tocar un pin para abrir Maps");
  try {
    await ensureGoogleMaps();
    const resolved = await resolveDeliveryMapStops(stops);
    if (token !== deliveryMapRenderToken) return;
    const located = resolved.filter((item) => item.position);
    if (!located.length) {
      clearDeliveryGoogleMap();
      deliveryMapEmpty("No hay ubicaciones para mapear", "Cargar coordenadas o domicilio valido en la ficha del cliente.");
      return;
    }
    const { Map } = await google.maps.importLibrary("maps");
    const center = located.reduce((sum, item) => ({
      lat: sum.lat + item.position.lat,
      lng: sum.lng + item.position.lng
    }), { lat: 0, lng: 0 });
    const mapCenter = { lat: center.lat / located.length, lng: center.lng / located.length };
    if (!deliveryRouteMap) {
      deliveryRouteMap = new Map(mapElement, {
        center: mapCenter,
        zoom: located.length > 1 ? 13 : 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
    } else {
      deliveryRouteMap.setCenter(mapCenter);
    }
    mapElement.classList.add("google-loaded");
    mapElement.classList.remove("delivery-fallback-loaded");
    clearDeliveryGoogleMap();
    const bounds = new google.maps.LatLngBounds();
    const path = [];
    located.forEach((item) => {
      const marker = new google.maps.Marker({
        map: deliveryRouteMap,
        position: item.position,
        title: item.label,
        label: String(item.sequence),
        optimized: true
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="maps-info">
            <strong>${escapeHtml(item.sequence)}. ${escapeHtml(item.label)}</strong><br>
            ${escapeHtml(item.address || "Sin domicilio")}<br>
            Estado: ${escapeHtml(item.status || "-")}<br>
            Importe: ${escapeHtml(money.format(item.amount || 0))}<br>
            Fuente: ${escapeHtml(item.source)}
          </div>
        `
      });
      marker.addListener("click", () => infoWindow.open({ anchor: marker, map: deliveryRouteMap }));
      deliveryRouteMarkers.push(marker);
      bounds.extend(item.position);
      path.push(item.position);
    });
    if (path.length > 1) {
      deliveryRoutePolyline = new google.maps.Polyline({
        map: deliveryRouteMap,
        path,
        strokeColor: "#0f7c75",
        strokeOpacity: 0.8,
        strokeWeight: 4
      });
    }
    if (located.length > 1) deliveryRouteMap.fitBounds(bounds, 50);
    else deliveryRouteMap.setZoom(16);
    if (legend) {
      const missing = resolved.length - located.length;
      legend.innerHTML = `
        <span>${located.length} puntos en mapa</span>
        ${missing ? `<span class="danger-text">${missing} sin domicilio/GPS valido</span>` : ""}
      `;
    }
  } catch (error) {
    renderDeliveryRouteMapFallback(route, stops, "Google Maps embebido no disponible");
  }
}

function renderDelivery() {
  const deviceId = byId("deliveryDeviceId");
  const deviceLabel = byId("deliveryDeviceLabel");
  if (!deviceId || !deviceLabel) return;
  deviceId.textContent = deliveryDevice.id;
  if (document.activeElement !== deviceLabel) deviceLabel.value = deliveryDevice.label;

  const routes = visibleDeliveryRoutes();
  if (isAdminUser()) renderDeliveryPlanner();
  const activeRoute = activeRouteForDelivery(routes);
  const allStops = routes.flatMap((route) => route.stops || []);
  const delivered = allStops.filter((stop) => isDeliveryStopClosed(stop.status)).length;
  const cash = routes.reduce((sum, route) => sum + numeric(route.cashTotal, 0), 0);
  const pending = routes.reduce((sum, route) => sum + numeric(route.pendingTotal, 0), 0);
  byId("deliveryKpis").innerHTML = [
    { label: "Rutas", value: routes.length, hint: "Visibles para este equipo" },
    { label: "Entregas", value: `${delivered}/${allStops.length}`, hint: "Paradas finalizadas" },
    { label: "Efectivo", value: money.format(cash), hint: "Acumulado de ruta" },
    { label: "Cuenta corriente", value: money.format(pending), hint: "Saldo pendiente generado" }
  ].map((item) => `
    <article class="delivery-kpi">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.hint)}</small>
    </article>
  `).join("");

  renderDeliveryActivePanel(activeRoute, routes);

  byId("deliveryRouteList").innerHTML = routes.length ? routes.map((route) => {
    const completedStops = (route.stops || []).filter((stop) => isDeliveryStopClosed(stop.status)).length;
    const totalStops = (route.stops || []).length;
    const allStopsManaged = totalStops > 0 && (route.stops || []).every((stop) => isDeliveryStopClosed(stop.status));
    const assignedHere = route.deviceId === deliveryDevice.id || route.driverUser === currentUser?.username || (!route.driverUser && !route.deviceId);
    const canClaim = currentUser?.role === "driver" && isDeliveryRoutePublished(route) && assignedHere && !route.deviceId;
    const canPublish = isAdminUser() && route.status === "Planificada";
    const canCloseRoute = !route.closure && isDeliveryRoutePublished(route) && (isAdminUser() || assignedHere) && allStopsManaged;
    const closure = route.closure || null;
    return `
      <article class="delivery-route-card ${route.id === activeDeliveryRouteId ? "active" : ""}">
        <button class="delivery-route-select" type="button" data-delivery-route="${escapeHtml(route.id)}">
          <div class="delivery-route-head">
            <strong>${escapeHtml(route.id)}</strong>
            <span class="tag ${deliveryTone(route.status)}">${escapeHtml(route.status)}</span>
          </div>
          <p>${escapeHtml(route.zone)} - ${escapeHtml(route.day)}</p>
          <div class="delivery-route-summary">
            <span>${completedStops}/${totalStops} gestionadas</span>
            <span>${escapeHtml(route.deviceLabel || route.driverUser || "Sin dispositivo")}</span>
          </div>
        </button>
        ${closure ? `<div class="delivery-route-closure"><strong>Cierre rendido ${escapeHtml(closure.time || formatOrderTime(closure.at))}</strong><span>Diferencia ${escapeHtml(money.format(closure.totalDifference || 0))} - Pendientes ${escapeHtml(String(closure.pendingOrders || 0))}</span></div>` : ""}
        ${canPublish ? `<button class="primary-btn" type="button" data-publish-route="${escapeHtml(route.id)}">Publicar despacho</button>` : ""}
        ${canClaim && !isDeliveryRouteClosed(route) ? `<button class="secondary-btn" type="button" data-claim-route="${escapeHtml(route.id)}">Tomar Ruta</button>` : ""}
        ${canCloseRoute ? `<button class="primary-btn" type="button" data-close-route="${escapeHtml(route.id)}">Rendir caja</button>` : ""}
        ${!canCloseRoute && !route.closure && isDeliveryRoutePublished(route) ? `<button class="secondary-btn" type="button" disabled title="Se habilita cuando todos los pedidos esten gestionados">Rendir caja</button>` : ""}
      </article>
    `;
  }).join("") : '<div class="empty-note">No hay rutas publicadas para repartir.</div>';

  renderDeliveryStops(activeRoute);
  if (isAdminUser()) {
    renderDeliverySettings();
    renderDeliveryAudit();
    renderDeliveryClosures();
  }
}

function renderDeliveryStops(route) {
  const title = byId("deliveryActiveRouteTitle");
  const meta = byId("deliveryActiveRouteMeta");
  const list = byId("deliveryStopList");
  if (!route) {
    title.textContent = "Paradas";
    meta.textContent = "Seleccionar una hoja de ruta";
    list.innerHTML = '<div class="empty-note">Sin hoja de ruta activa.</div>';
    return;
  }
  title.textContent = `${route.zone} - ${route.id}`;
  meta.textContent = `${route.deviceLabel || "Sin dispositivo"} - Efectivo ${money.format(route.cashTotal || 0)} - Transferencias ${money.format(route.transferTotal || 0)} - Devoluciones ${money.format(route.returnTotal || 0)}`;
  const current = DeliveryEngine.nextStop(route);
  const ownsRoute = isAdminUser() || route.deviceId === deliveryDevice.id || route.driverUser === currentUser?.username;
  const visibleStops = (route.stops || []).filter((stop) => !isDeliveryStopDelivered(stop.status));
  const closureNote = route.closure ? `
    <article class="delivery-closure-card">
      <strong>Cierre diario registrado</strong>
      <small>${escapeHtml(route.closure.user || "Reparto")} - ${escapeHtml(route.closure.date || "")} ${escapeHtml(route.closure.time || "")}</small>
      ${deliveryClosureMetricsHtml(route.closure)}
      ${route.closure.observations ? `<p>${escapeHtml(route.closure.observations)}</p>` : ""}
    </article>
  ` : "";
  if (!visibleStops.length) {
    list.innerHTML = closureNote + '<div class="empty-note">No quedan pedidos visibles en esta ruta. Los entregados se ocultan automaticamente.</div>';
    return;
  }
  list.innerHTML = closureNote + visibleStops.map((stop) => {
    const index = route.stops.findIndex((item) => item.orderCode === stop.orderCode);
    const order = state.orders.find((item) => item.code === stop.orderCode);
    const assembly = orderAssemblyInfo(order || { code: stop.orderCode, assembly: stop.assembly || { orderNumber: stop.assemblyOrderNumber, bultosConfirmed: stop.packages } });
    const isCurrent = current && current.orderCode === stop.orderCode;
    const canOperate = ownsRoute && isCurrent && !isDeliveryRouteClosed(route) && route.status !== "Planificada";
    const canReorder = isAdminUser() && !route.closure && !isDeliveryRouteClosed(route) && route.status !== "Completada";
    const mapsUrl = DeliveryEngine.navigationUrl(state, stop.orderCode);
    const collection = stop.collection;
    const exception = stop.exception || order && order.deliveryException;
    const receipt = collection && collection.transferReceipt;
    const attachmentLinks = collection && collection.attachments
      ? Object.values(collection.attachments).filter(Boolean).map((attachment) => `<a href="${escapeHtml(attachment.url)}" target="_blank" rel="noopener">${escapeHtml(attachment.kind)}</a>`).join(" | ")
      : "";
    return `
      <article class="delivery-stop-card ${isCurrent ? "current" : ""} ${isDeliveryStopClosed(stop.status) ? "completed" : ""}">
        <div class="delivery-stop-head">
          ${canReorder ? `
            <label class="delivery-sequence-control">
              <span>Sec.</span>
              <input data-route-sequence="${escapeHtml(route.id)}" data-order-code="${escapeHtml(stop.orderCode)}" type="number" min="1" max="${route.stops.length}" step="1" value="${escapeHtml(String(stop.sequence || index + 1))}" inputmode="numeric" aria-label="Secuencia de ${escapeHtml(stop.client)}">
            </label>
          ` : `<span class="delivery-stop-number">${escapeHtml(String(stop.sequence || index + 1))}</span>`}
          <div class="delivery-stop-main">
            <strong>${escapeHtml(stop.client)}</strong>
            <span>${escapeHtml(stop.address || "Domicilio pendiente")}</span>
            <small>${escapeHtml(stop.hours || "Sin horario informado")} - ${money.format(stop.amount)}</small>
            <small class="delivery-assembly-meta">Pedido ${escapeHtml(formatAssemblyPedidoNumber(stop.orderCode))} - Orden de Armado: ${escapeHtml(formatAssemblyOrderNumber(assembly))} - Bultos: ${escapeHtml(String(assembly.bultos || stop.packages || 0))}</small>
          </div>
          <span class="tag ${deliveryTone(stop.status)}">${escapeHtml(stop.status)}</span>
        </div>
        ${collection ? `<p>${escapeHtml(collection.method)} - Cobrado ${money.format(collection.amountPaid)} - Pendiente ${money.format(collection.pendingAmount)}${deliverySummaryText(collection) ? ` - ${escapeHtml(deliverySummaryText(collection))}` : ""}</p>` : ""}
        ${collection && collection.returnSummary && collection.returnSummary.returnedQty > 0 ? `<p>Devolucion: ${collection.returnSummary.returnedQty} unidades - ${money.format(collection.returnSummary.returnedAmount)}${collection.returnReason ? ` - ${escapeHtml(collection.returnReason)}` : ""}</p>` : ""}
        ${collection && collection.observations ? `<p>Obs: ${escapeHtml(collection.observations)}</p>` : ""}
        ${exception ? `<p class="stock-error">Incidencia: ${escapeHtml(exception.status || stop.status)} - ${escapeHtml(exception.reason || "")}. ${escapeHtml(exception.observations || "")}</p>` : ""}
        ${receipt ? `<p>Comprobante transferencia: ${escapeHtml(receipt.bank)}${receipt.alias ? ` - ${escapeHtml(receipt.alias)}` : ""} - ${money.format(receipt.amount)}</p>` : ""}
        ${attachmentLinks ? `<p class="delivery-evidence-links">Evidencias: ${attachmentLinks}</p>` : ""}
        <div class="delivery-stop-actions">
          ${mapsUrl ? `<button class="secondary-btn" type="button" data-delivery-map="${escapeHtml(stop.orderCode)}">IR AL CLIENTE</button>` : ""}
          ${canReorder && index > 0 ? `<button class="secondary-btn" type="button" data-route-move="${escapeHtml(route.id)}" data-order-code="${escapeHtml(stop.orderCode)}" data-direction="-1">Subir</button>` : ""}
          ${canReorder && index < route.stops.length - 1 ? `<button class="secondary-btn" type="button" data-route-move="${escapeHtml(route.id)}" data-order-code="${escapeHtml(stop.orderCode)}" data-direction="1">Bajar</button>` : ""}
          ${canOperate && order && order.status === ORDER_STATUS.DISPATCHED ? `<button class="primary-btn" type="button" data-delivery-status="${escapeHtml(stop.orderCode)}" data-status="${ORDER_STATUS.IN_ROUTE}">INICIAR REPARTO</button>` : ""}
          ${canOperate && order && order.status === ORDER_STATUS.IN_ROUTE ? `<button class="primary-btn" type="button" data-delivery-collect="${escapeHtml(stop.orderCode)}">COBRAR Y ENTREGAR</button>` : ""}
          ${canOperate && order && order.status === ORDER_STATUS.IN_ROUTE ? `<button class="secondary-btn" type="button" data-delivery-exception="${escapeHtml(stop.orderCode)}" data-exception-status="${ORDER_STATUS.NOT_DELIVERED}">No entregado</button>` : ""}
          ${canOperate && order && order.status === ORDER_STATUS.IN_ROUTE ? `<button class="secondary-btn" type="button" data-delivery-exception="${escapeHtml(stop.orderCode)}" data-exception-status="${ORDER_STATUS.POSTPONED}">Postergar</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function applyDeliverySequenceChange(input, focusNext = false) {
  if (!input) return;
  const route = (state.deliveryRoutes || []).find((item) => item.id === input.dataset.routeSequence);
  if (!route) return;
  const codes = (route.stops || []).map((stop) => stop.orderCode);
  const currentIndex = codes.indexOf(input.dataset.orderCode);
  if (currentIndex < 0) return;
  const requestedIndex = Math.max(0, Math.min(codes.length - 1, Math.floor(numeric(input.value, currentIndex + 1)) - 1));
  input.value = String(requestedIndex + 1);
  if (requestedIndex === currentIndex) {
    if (focusNext) {
      const inputs = Array.from(document.querySelectorAll("[data-route-sequence]"));
      const next = inputs[Math.min(inputs.indexOf(input) + 1, inputs.length - 1)];
      if (next && next !== input) {
        next.focus();
        next.select();
      }
    }
    return;
  }
  const [code] = codes.splice(currentIndex, 1);
  codes.splice(requestedIndex, 0, code);
  input.disabled = true;
  try {
    await postOperationalAction(`api/delivery/routes/${encodeURIComponent(route.id)}/reorder`, {
      orderCodes: codes
    });
    activeDeliveryRouteId = route.id;
    if (focusNext) {
      window.setTimeout(() => {
        const inputs = Array.from(document.querySelectorAll("[data-route-sequence]"));
        const next = inputs[Math.min(requestedIndex + 1, inputs.length - 1)];
        if (next) {
          next.focus();
          next.select();
        }
      }, 80);
    }
  } catch (error) {
    input.value = String(currentIndex + 1);
    window.alert(error.message || "No se pudo reordenar la ruta.");
  } finally {
    input.disabled = false;
  }
}

function renderDeliverySettings() {
  const settings = state.deliverySettings || {};
  const fields = {
    deliveryBankAlias: settings.bankAlias || "",
    deliveryBankAccountName: settings.bankAccountName || "",
    deliveryBankCbu: settings.bankCbu || "",
    deliveryDepotLat: settings.depotLat ?? "",
    deliveryDepotLng: settings.depotLng ?? ""
  };
  Object.entries(fields).forEach(([id, value]) => {
    const field = byId(id);
    if (field && document.activeElement !== field) field.value = value;
  });
}

function renderDeliveryAudit() {
  const list = byId("deliveryAuditList");
  if (!list) return;
  const audit = (state.deliveryAudit || []).slice(0, 40);
  list.innerHTML = audit.length ? audit.map((entry) => `
    <article class="activity">
      <span class="tag">${escapeHtml(entry.action)}</span>
      <strong>${escapeHtml(entry.orderCode || entry.routeId || "Configuracion")}</strong>
      <p>${escapeHtml(entry.client || "")} ${entry.deviceLabel ? `- ${escapeHtml(entry.deviceLabel)}` : ""}</p>
      <small>${escapeHtml(formatOrderTime(entry.at))} - ${escapeHtml(entry.user || "Sistema")}</small>
    </article>
  `).join("") : '<div class="empty-note">Sin movimientos de reparto registrados.</div>';
}

function deliveryClosureRecords() {
  const byKey = new Map();
  (state.deliveryClosures || []).forEach((closure) => {
    if (closure && (closure.id || closure.routeId)) byKey.set(closure.id || closure.routeId, closure);
  });
  (state.deliveryRoutes || []).forEach((route) => {
    if (route.closure) byKey.set(route.closure.id || route.id, route.closure);
  });
  return Array.from(byKey.values()).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}

function renderDeliveryClosures() {
  const list = byId("deliveryClosureList");
  if (!list) return;
  const closures = deliveryClosureRecords().slice(0, 20);
  list.innerHTML = closures.length ? closures.map((closure) => {
    const tone = deliveryDifferenceTone(closure.totalDifference);
    return `
      <article class="delivery-closure-card">
        <div class="delivery-route-head">
          <strong>${escapeHtml(closure.routeId || "Ruta")}</strong>
          <span class="tag ${tone}">${escapeHtml(money.format(closure.totalDifference || 0))}</span>
        </div>
        <small>${escapeHtml(closure.deviceLabel || closure.driverUser || "Reparto")} - ${escapeHtml(closure.date || "")} ${escapeHtml(closure.time || formatOrderTime(closure.at))}</small>
        ${deliveryClosureMetricsHtml(closure)}
        ${closure.observations ? `<p>${escapeHtml(closure.observations)}</p>` : ""}
      </article>
    `;
  }).join("") : '<div class="empty-note">Sin cierres diarios registrados.</div>';
}

function normalizeTransferStatus(status, hasAttachment = false) {
  const text = String(status || "").trim();
  if (text === "Pendiente") return TRANSFER_STATUS.PENDING;
  if (text === "Validada") return TRANSFER_STATUS.ACCOUNT_UPDATED;
  if (text === "Rechazada") return TRANSFER_STATUS.OBSERVED;
  return Object.values(TRANSFER_STATUS).includes(text)
    ? text
    : (hasAttachment ? TRANSFER_STATUS.RECEIVED : TRANSFER_STATUS.PENDING);
}

function transferTrafficLight(record) {
  const status = normalizeTransferStatus(record.status, record.attachment);
  if (status === TRANSFER_STATUS.OBSERVED) {
    return { key: "critical", tone: "danger", dot: "critical", label: "Observada", text: "Comprobante observado. La deuda sigue pendiente." };
  }
  if (TRANSFER_FINAL_STATUSES.has(status)) {
    return { key: "green", tone: "ok", dot: "green", label: "Validada", text: "Banco validado y cuenta corriente actualizada." };
  }
  if (status === TRANSFER_STATUS.RECEIVED || status === TRANSFER_STATUS.BANK_PENDING || record.attachment) {
    return { key: "yellow", tone: "warn", dot: "yellow", label: "Comprobante recibido", text: "Pendiente de validacion bancaria." };
  }
  return { key: "red", tone: "danger", dot: "red", label: "Pendiente", text: "Sin comprobante. La deuda sigue pendiente." };
}

function bankTransferStatusTone(status) {
  return transferTrafficLight({ status }).tone;
}

function transferSummaryCounts(records) {
  return records.reduce((acc, record) => {
    const light = transferTrafficLight(record);
    acc[light.key] = (acc[light.key] || 0) + 1;
    if (light.key !== "green") acc.pendingAmount += numeric(record.amount, 0);
    return acc;
  }, { red: 0, yellow: 0, green: 0, critical: 0, pendingAmount: 0 });
}

function renderBankTransferSummary(records) {
  const box = byId("bankTransferSummary");
  if (!box) return;
  const todayValidated = records.filter((record) => {
    const light = transferTrafficLight(record);
    return light.key === "green" && dashboardDateIsToday(record.validatedAt || record.accountUpdatedAt || record.at || record.date);
  }).length;
  const counts = transferSummaryCounts(records);
  const cards = [
    { key: "red", label: "Sin comprobante", value: counts.red, tone: "danger", hint: "Cliente prometio transferir." },
    { key: "yellow", label: "A validar", value: counts.yellow, tone: "warn", hint: "Comprobante recibido." },
    { key: "green", label: "Validadas hoy", value: todayValidated, tone: "ok", hint: "Cuenta actualizada." },
    { key: "critical", label: "Observadas", value: counts.critical, tone: "danger", hint: "Revisar diferencias." }
  ];
  box.innerHTML = cards.map((card) => `
    <button class="transfer-summary-card ${card.tone}" type="button" data-bank-summary-filter="${card.key}">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(String(card.value))}</strong>
      <small>${escapeHtml(card.hint)}</small>
    </button>
  `).join("");
}

function transferMatchesFilters(record, globalTerms, localTerms) {
  const light = transferTrafficLight(record);
  const client = state.clients.find((item) => normalizeSearchText(item.name) === normalizeSearchText(record.client));
  const text = [
    record.id,
    record.orderCode,
    record.client,
    record.seller,
    record.driver,
    record.uploadedBy,
    record.validatedBy,
    record.bank,
    record.alias,
    record.cbu,
    record.date,
    record.time,
    record.amount,
    record.status,
    record.observations,
    record.statusReason,
    record.adminObservations
  ].join(" ");
  const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
  const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
  const matchesStatus = bankStatusFilter === "all" || light.key === bankStatusFilter;
  const bankClientTerms = searchTerms(bankClientFilter);
  const matchesClient = !bankClientTerms.length || matchesSearch(text, bankClientTerms);
  const matchesBank = !bankBankFilter || normalizeText(record.bank).includes(normalizeText(bankBankFilter));
  const matchesDate = !bankDateFilter || dashboardDateKey(record.at || record.date) === bankDateFilter;
  const amount = numeric(record.amount, 0);
  const targetAmount = numeric(bankAmountFilter, -1);
  const matchesAmount = !bankAmountFilter || Math.abs(amount - targetAmount) < 0.01;
  const matchesPendingClient = bankPendingClientsFilter === "all" || numeric(client && client.balance, 0) > 0;
  return matchesGlobal && matchesLocal && matchesStatus && matchesClient && matchesBank && matchesDate && matchesAmount && matchesPendingClient;
}

function selectedBankTransfers() {
  return (state.bankReconciliation || []).filter((record) => selectedTransferIds.has(record.id));
}

function setBankBulkStatus(text, tone = "info") {
  const status = byId("bankBulkStatus");
  if (!status) return;
  status.textContent = text || "";
  status.dataset.tone = tone;
}

function renderBankBulkPanel(records = []) {
  const count = byId("bankSelectedCount");
  const panel = byId("bankBulkPanel");
  if (!count || !panel) return;
  const existingIds = new Set((state.bankReconciliation || []).map((record) => record.id));
  Array.from(selectedTransferIds).forEach((id) => {
    if (!existingIds.has(id)) selectedTransferIds.delete(id);
  });
  count.textContent = String(selectedTransferIds.size);
  panel.dataset.enabled = selectedTransferIds.size > 0 ? "true" : "false";
  if (!selectedTransferIds.size) setBankBulkStatus(`${records.length} comprobantes visibles. Seleccionar para operar en lote.`, "info");
}

function transferHistoryHtml(record) {
  const history = Array.isArray(record.history) ? record.history : [];
  if (!history.length) return '<p class="empty-note">Sin historial detallado para esta transferencia.</p>';
  return history.slice().reverse().map((entry) => `
    <p><strong>${escapeHtml(entry.action || "Evento")}</strong> - ${escapeHtml(entry.date || "")} ${escapeHtml(entry.time || "")} - ${escapeHtml(entry.user || "Sistema")}</p>
  `).join("");
}

function updateTransferProofFileStatus() {
  const status = byId("transferProofFileStatus");
  if (status) status.textContent = transferProofSelectedFile
    ? `Archivo listo: ${transferProofSelectedFile.name || "captura pegada"}`
    : "Sin archivo seleccionado.";
}

function setTransferProofFile(file) {
  transferProofSelectedFile = file || null;
  updateTransferProofFileStatus();
}

function openTransferProofDialog(transferId) {
  const transfer = (state.bankReconciliation || []).find((item) => item.id === transferId);
  if (!transfer) return;
  byId("transferProofId").value = transfer.id;
  byId("transferProofTitle").textContent = `${transfer.orderCode || "Transferencia"} - ${transfer.client || "Sin cliente"}`;
  byId("transferProofObservations").value = transfer.uploadObservations || "";
  byId("transferProofMessage").textContent = "";
  ["transferProofCamera", "transferProofGallery", "transferProofFile"].forEach((id) => { byId(id).value = ""; });
  setTransferProofFile(null);
  byId("transferProofDialog").showModal();
}

function setTransferProofMessage(text, tone = "danger") {
  const node = byId("transferProofMessage");
  if (!node) return;
  node.textContent = text || "";
  node.dataset.tone = tone;
}

async function submitTransferProof(event) {
  event.preventDefault();
  const transferId = byId("transferProofId").value;
  if (!transferId) return;
  const file = transferProofSelectedFile
    || byId("transferProofCamera").files[0]
    || byId("transferProofGallery").files[0]
    || byId("transferProofFile").files[0]
    || null;
  if (!file) {
    setTransferProofMessage("Adjuntar foto, imagen o PDF del comprobante.");
    return;
  }
  const submit = byId("transferProofSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Guardando...";
  setTransferProofMessage("Subiendo comprobante...", "info");
  try {
    const dataUrl = await fileToEvidenceDataUrl(file);
    await postOperationalAction(`api/bank-reconciliation/transfers/${encodeURIComponent(transferId)}/proof`, {
      dataUrl,
      observations: byId("transferProofObservations").value.trim()
    });
    byId("transferProofDialog").close("default");
  } catch (error) {
    setTransferProofMessage(error.message || "No se pudo cargar el comprobante.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Guardar comprobante";
  }
}

function downloadSelectedTransferProofs() {
  const records = selectedBankTransfers().filter((record) => record.attachment && record.attachment.url);
  if (!records.length) {
    setBankBulkStatus("Los seleccionados no tienen comprobantes descargables.", "warn");
    return;
  }
  const manifest = [
    "id,pedido,cliente,banco,importe,archivo,url",
    ...records.map((record) => [
      record.id,
      record.orderCode || "",
      record.client || "",
      record.bank || "",
      numeric(record.amount, 0),
      record.attachment.filename || "",
      record.attachment.url || ""
    ].map(csvCell).join(","))
  ].join("\n");
  downloadBlob(`comprobantes-seleccionados-${reportDateStamp()}.csv`, new Blob([manifest], { type: "text/csv;charset=utf-8" }));
  records.forEach((record, index) => {
    window.setTimeout(() => {
      const link = document.createElement("a");
      link.href = record.attachment.url;
      link.download = record.attachment.filename || `${record.orderCode || record.id}-comprobante`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, index * 250);
  });
  setBankBulkStatus(`Descarga iniciada: ${records.length} comprobantes y manifiesto CSV.`, "ok");
}

async function postBankBulkStatus(status, extra = {}) {
  const transferIds = selectedBankTransfers().map((record) => record.id);
  if (!transferIds.length) {
    setBankBulkStatus("No hay comprobantes seleccionados.", "warn");
    return null;
  }
  const payload = await postOperationalAction("api/bank-reconciliation/transfers/bulk-status", {
    transferIds,
    status,
    ...extra
  });
  selectedTransferIds.clear();
  setBankBulkStatus(`Procesadas ${payload.processed || transferIds.length} transferencias.`, "ok");
  return payload;
}

async function runBankBulkAction(action) {
  const records = selectedBankTransfers();
  if (!records.length) {
    setBankBulkStatus("Seleccionar al menos una transferencia.", "warn");
    return;
  }
  if (action === "download") {
    downloadSelectedTransferProofs();
    return;
  }
  if (action === "observe") {
    const observations = window.prompt(`Observacion administrativa para ${records.length} comprobantes:`, "") || "";
    if (!observations.trim()) return;
    await postBankBulkStatus("OBSERVACION_ADMIN", { observations });
    return;
  }
  if (action === "reject") {
    const reason = window.prompt(`Motivo de rechazo/observacion para ${records.length} comprobantes:`, "") || "";
    if (!reason.trim()) {
      window.alert("Indicar motivo para rechazar comprobantes.");
      return;
    }
    if (!window.confirm(`Rechazar ${records.length} comprobantes seleccionados?`)) return;
    await postBankBulkStatus(TRANSFER_STATUS.OBSERVED, { reason });
    return;
  }
  if (action === "validate") {
    const validatable = records.filter((record) => record.attachment && !TRANSFER_FINAL_STATUSES.has(normalizeTransferStatus(record.status, record.attachment)));
    if (!validatable.length) {
      setBankBulkStatus("No hay comprobantes seleccionados aptos para validar.", "warn");
      return;
    }
    const bank = window.prompt("Banco donde impactaron las transferencias:", validatable[0].validationBank || validatable[0].bank || "") || "";
    const operationNumber = window.prompt("Referencia general / lote bancario:", "") || "";
    if (!window.confirm(`Validar ${validatable.length} transferencias?\n\nEsto descontara saldos de cuenta corriente.`)) return;
    await postBankBulkStatus(TRANSFER_STATUS.ACCOUNT_UPDATED, {
      transferIds: validatable.map((record) => record.id),
      bank,
      operationNumber
    });
  }
}

function renderBankReconciliationList(globalTerms, localTerms) {
  const list = byId("bankList");
  if (!list) return;
  if (AccountEngine && typeof AccountEngine.ensureTransferReconciliation === "function") {
    AccountEngine.ensureTransferReconciliation(state);
  }
  const allRecords = state.bankReconciliation || [];
  renderBankTransferSummary(allRecords);
  const records = allRecords.filter((record) => transferMatchesFilters(record, globalTerms, localTerms));
  renderBankBulkPanel(records);
  if (records.length) {
    list.innerHTML = records.slice(0, 80).map((record) => {
      const light = transferTrafficLight(record);
      const status = normalizeTransferStatus(record.status, record.attachment);
      const isFinal = TRANSFER_FINAL_STATUSES.has(status);
      const attachment = record.attachment && record.attachment.url
        ? `<a class="mini-btn" href="${escapeHtml(record.attachment.url)}" target="_blank" rel="noopener">Ver comprobante</a>`
        : "";
      const validatedInfo = isFinal
        ? `<p>Validada por ${escapeHtml(record.validatedBy || record.accountUpdatedBy || "Administracion")} - ${escapeHtml(formatOrderTime(record.validatedAt || record.accountUpdatedAt || ""))} - Banco ${escapeHtml(record.validationBank || record.bank || "S/D")} - Op. ${escapeHtml(record.operationNumber || "S/D")}</p>`
        : "";
      return `
        <article class="alert bank-transfer-card ${light.key}">
          <div class="bank-transfer-head">
            <input type="checkbox" data-transfer-select="${escapeHtml(record.id)}" aria-label="Seleccionar ${escapeHtml(record.orderCode || record.id)}" ${selectedTransferIds.has(record.id) ? "checked" : ""}>
            <span class="traffic-dot ${light.dot}" aria-hidden="true"></span>
            <span class="tag ${light.tone}">${escapeHtml(light.label)}</span>
            <strong>${escapeHtml(record.orderCode || "Sin pedido")} - ${escapeHtml(record.client || "Sin cliente")}</strong>
          </div>
          <p>${escapeHtml(light.text)} Importe ${money.format(record.amount || 0)}.</p>
          <p>${escapeHtml(record.bank || "Banco sin informar")} - Alias ${escapeHtml(record.alias || "S/D")} - CBU ${escapeHtml(record.cbu || "S/D")}</p>
          <p>${escapeHtml(record.date || "")} ${escapeHtml(record.time || "")} - Cargado por ${escapeHtml(record.uploadedBy || record.loadedBy || "S/D")}</p>
          ${record.observations ? `<p>Obs: ${escapeHtml(record.observations)}</p>` : ""}
          ${record.adminObservations ? `<p>Obs. administracion: ${escapeHtml(record.adminObservations)}</p>` : ""}
          ${record.statusReason ? `<p class="danger-text">Motivo: ${escapeHtml(record.statusReason)}</p>` : ""}
          ${validatedInfo}
          <div class="order-actions">
            ${attachment}
            ${!isFinal ? `<button class="mini-btn" type="button" data-transfer-proof="${escapeHtml(record.id)}">${record.attachment ? "Reemplazar comprobante" : "Cargar comprobante"}</button>` : ""}
            ${!isFinal && record.attachment ? `<button class="mini-btn primary-mini" type="button" data-transfer-status="${escapeHtml(record.id)}" data-status="${escapeHtml(TRANSFER_STATUS.ACCOUNT_UPDATED)}">Validar transferencia</button>` : ""}
            ${!isFinal ? `<button class="mini-btn danger-btn" type="button" data-transfer-status="${escapeHtml(record.id)}" data-status="${escapeHtml(TRANSFER_STATUS.OBSERVED)}">Rechazar comprobante</button>` : ""}
            <button class="mini-btn" type="button" data-transfer-history="${escapeHtml(record.id)}">Ver historial</button>
          </div>
        </article>
      `;
    }).join("");
    return;
  }
  const legacy = state.bankTransfers || [];
  list.innerHTML = legacy.length ? legacy.map((item) => `
    <article class="alert">
      <span class="tag ${item.tone}">${item.tone === "danger" ? "Revisar" : "Pendiente"}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("") : '<div class="empty-note">Sin transferencias pendientes de conciliacion.</div>';
}

function renderClients() {
  const globalTerms = [];
  const localTerms = searchTerms(clientSearchTerm);
  clientSellerFilter = updateDynamicFilter("clientSellerFilter", state.clients.map((client) => client.seller), clientSellerFilter, "Todos los vendedores");
  clientZoneFilter = updateDynamicFilter("clientZoneFilter", state.clients.map((client) => client.zone || client.ruta), clientZoneFilter, "Todas las zonas");
  const clients = state.clients.filter((client) => {
    const text = [
      client.codigo_cliente,
      client.name,
      client.razon_social,
      client.cuit,
      client.telefono,
      client.email,
      client.domicilio,
      client.localidad,
      client.zone,
      client.ruta,
      client.seller,
      client.tipo_cliente,
      client.status,
      client.forma_pago,
      client.condicion_comercial
    ].join(" ");
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesStatus = clientStatusFilter === "all" || client.status === clientStatusFilter;
    const matchesSeller = clientSellerFilter === "all" || client.seller === clientSellerFilter;
    const zone = client.zone || client.ruta || "";
    const matchesZone = clientZoneFilter === "all" || zone === clientZoneFilter;
    const balance = numeric(client.balance, 0);
    const limit = numeric(client.limit, 0);
    const matchesAccount = clientAccountFilter === "all"
      || (clientAccountFilter === "debt" && balance > 0)
      || (clientAccountFilter === "overlimit" && limit > 0 && balance > limit)
      || (clientAccountFilter === "clear" && balance <= 0);
    return matchesGlobal && matchesLocal && matchesStatus && matchesSeller && matchesZone && matchesAccount;
  });

  byId("clientsTable").innerHTML = clients.length ? clients.map((client) => {
    const account = clientAccountSummary(client.name, 0);
    const mixedEntity = mixedEntityForClient(client);
    return `
    <tr>
      <td>
        <strong>${escapeHtml(client.name)}</strong>
        <small>${escapeHtml(client.codigo_cliente || "Sin codigo")} - ${escapeHtml(client.razon_social || client.name)}</small>
        ${mixedEntity ? '<small><span class="tag info">Tambien proveedor</span></small>' : ""}
      </td>
      <td>
        <strong>${escapeHtml(client.cuit || "CUIT pendiente")}</strong>
        <small>${escapeHtml(client.condicion_fiscal)} - ${escapeHtml(client.telefono || "Sin telefono")}</small>
        <small>${escapeHtml(client.email || "Sin email")}</small>
      </td>
      <td>
        <strong>${escapeHtml(client.domicilio || "Sin domicilio")}</strong>
        <small>${escapeHtml(client.localidad || "Sin localidad")}</small>
      </td>
      <td>
        <strong>${escapeHtml(client.zone)}</strong>
        <small>${escapeHtml(client.ruta || client.zone)} - ${escapeHtml(client.seller || "Sin vendedor")}</small>
        <small>${escapeHtml(client.horario_atencion || "Sin horario")} - ${Number.isFinite(client.latitud) && Number.isFinite(client.longitud) ? "GPS cargado" : "GPS pendiente"}</small>
      </td>
      <td>
        <span class="tag ${clientStatusClass(client.status)}">${escapeHtml(client.status)}</span>
        <small>${escapeHtml(client.tipo_cliente || "Sin tipo")}</small>
        <small>${escapeHtml(client.condicion_comercial || client.forma_pago || "Sin condicion comercial")}</small>
      </td>
      <td>
        <strong>${money.format(account.currentBalance)}</strong>
        <small>Limite ${money.format(account.creditLimit)} - Total ${money.format(account.totalDebt)}</small>
        <small><span class="tag ${accountStatusTone(account.status)}">${escapeHtml(account.status)}</span></small>
      </td>
      <td>
        <strong>${escapeHtml(client.dia_visita || "Sin dia")}</strong>
        <small>${escapeHtml(client.frecuencia_visita || "Sin frecuencia")}</small>
      </td>
      <td>
        <button class="mini-btn" type="button" data-client-edit="${escapeHtml(client.codigo_cliente || client.name)}">Editar</button>
        ${mixedEntity ? `<button class="mini-btn primary-mini" type="button" data-mixed-entity="${escapeHtml(mixedEntity.key)}">Ficha mixta</button>` : ""}
      </td>
    </tr>
  `;
  }).join("") : '<tr><td class="stock-empty" colspan="8">No hay clientes para los filtros seleccionados.</td></tr>';
}

function renderAccounts() {
  const globalTerms = [];
  const localTerms = searchTerms(accountSearchTerm);
  const summaries = state.clients.map((client) => clientAccountSummary(client.name, 0)).filter((summary) => summary.ok);
  accountStatusFilter = updateDynamicFilter("accountsStatusFilter", summaries.map((summary) => summary.status), accountStatusFilter, "Todos los estados");
  const filteredSummaries = summaries.filter((summary) => {
    const text = [
      summary.clientName,
      summary.status,
      summary.currentBalance,
      summary.creditLimit,
      summary.overdueDebt,
      summary.totalDebt,
      summary.lastPayment && summary.lastPayment.date,
      summary.lastPayment && summary.lastPayment.method
    ].join(" ");
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesStatus = accountStatusFilter === "all" || summary.status === accountStatusFilter;
    return matchesGlobal && matchesLocal && matchesStatus;
  });

  const totals = summaries.reduce((acc, summary) => {
    acc.current += summary.currentBalance;
    acc.overdue += summary.overdueDebt;
    acc.total += summary.totalDebt;
    acc.pending += summary.pendingOrderExposure;
    if (summary.overLimitAmount > 0) acc.overLimit += 1;
    return acc;
  }, { current: 0, overdue: 0, total: 0, pending: 0, overLimit: 0 });

  const kpiBox = byId("accountsSummaryCards");
  if (kpiBox) {
    kpiBox.innerHTML = [
      { label: "Saldo actual", value: money.format(totals.current), text: "Deuda registrada en clientes." },
      { label: "Deuda vencida", value: money.format(totals.overdue), text: "Requiere seguimiento." },
      { label: "Deuda total", value: money.format(totals.total), text: "Saldo mas pedidos pendientes." },
      { label: "Sobre limite", value: String(totals.overLimit), text: "Clientes que requieren autorizacion." }
    ].map((item) => `
      <article class="account-kpi-card">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
        <small>${escapeHtml(item.text)}</small>
      </article>
    `).join("");
  }

  const clientTable = byId("clientAccountsTable");
  if (clientTable) {
    clientTable.innerHTML = filteredSummaries.length ? filteredSummaries.map((summary) => `
      <tr>
        <td><strong>${escapeHtml(summary.clientName)}</strong><small>Pedidos pendientes ${money.format(summary.pendingOrderExposure)}</small></td>
        <td>${money.format(summary.currentBalance)}</td>
        <td>${money.format(summary.creditLimit)}</td>
        <td>${money.format(summary.overdueDebt)}</td>
        <td><strong>${money.format(summary.totalDebt)}</strong></td>
        <td><small>${escapeHtml(formatLastPayment(summary.lastPayment))}</small></td>
        <td><span class="tag ${accountStatusTone(summary.status)}">${escapeHtml(summary.status)}</span></td>
      </tr>
    `).join("") : '<tr><td class="stock-empty" colspan="7">No hay cuentas para los filtros seleccionados.</td></tr>';
  }

  accountTypeFilter = updateDynamicFilter("accountsTypeFilter", state.accounts.map((entry) => entry.type), accountTypeFilter, "Todos los tipos");
  accountMethodFilter = updateDynamicFilter("accountsMethodFilter", state.accounts.map((entry) => entry.method), accountMethodFilter, "Todos los medios");
  const accounts = state.accounts.filter((entry) => {
    const text = [
      entry.date,
      entry.type,
      entry.account,
      entry.method,
      entry.debit,
      entry.credit,
      entry.balance
    ].join(" ");
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesType = accountTypeFilter === "all" || entry.type === accountTypeFilter;
    const matchesMethod = accountMethodFilter === "all" || entry.method === accountMethodFilter;
    return matchesGlobal && matchesLocal && matchesType && matchesMethod;
  });

  byId("accountsTable").innerHTML = accounts.length ? accounts.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td><span class="tag">${escapeHtml(entry.type)}</span></td>
      <td><strong>${escapeHtml(entry.account)}</strong></td>
      <td>${escapeHtml(entry.method)}</td>
      <td>${entry.debit ? money.format(entry.debit) : "-"}</td>
      <td>${entry.credit ? money.format(entry.credit) : "-"}</td>
      <td>${money.format(entry.balance)}</td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="7">No hay movimientos para los filtros seleccionados.</td></tr>';

  renderBankReconciliationList(globalTerms, localTerms);
}

function renderStock() {
  renderStockProductOptions();
  renderStockCharts();
  stockRubricFilter = updateDynamicFilter("stockRubricFilter", state.products.map((product) => product.rubro), stockRubricFilter, "Todos los rubros");
  stockBrandFilter = updateDynamicFilter("stockBrandFilter", state.products.map((product) => product.marca), stockBrandFilter, "Todas las marcas");
  const products = getFilteredStockProducts();
  byId("stockTable").innerHTML = products.length ? products.map((product) => {
    const status = stockStatus(product);
    const row = physicalStockRow(product);
    const inventory = OrderEngine.inventory(product);
    const updatedAt = product.updatedAt || product.updated_at || product.priceUpdatedAt || "";
    return `
    <tr>
      <td>
        <strong>${escapeHtml(product.name)}</strong>
        <small>${escapeHtml(product.marca || "S/D")} - ${escapeHtml(product.familia || "S/D")}</small>
      </td>
      <td><strong>${escapeHtml(product.codigo_producto || "S/C")}</strong><small>${product.codigo_barras ? `EAN ${escapeHtml(product.codigo_barras)}` : "Sin barras"}</small></td>
      <td>
        <strong>${escapeHtml(product.rubro)}</strong>
        <small>${escapeHtml(product.segmento || "S/D")} - ${escapeHtml(productSupplierName(product))}</small>
      </td>
      <td>
        <strong>${inventory.available}</strong>
        <small>Minimo ${numeric(product.min, 0)}</small>
      </td>
      <td>
        <strong>${row.totalPreDispatch}</strong>
        <small>Reservado ${inventory.reserved}</small>
      </td>
      <td><strong>${row.expected}</strong><small>Motor ${inventory.physical} / Transito ${inventory.inTransit}</small></td>
      <td>${row.preparing}</td>
      <td>${row.assembled}</td>
      <td>${row.readyDispatch}</td>
      <td><span class="tag ${status.tone}">${escapeHtml(status.label)}</span><small>${escapeHtml(updatedAt ? formatOrderTime(updatedAt) : "Sin fecha")}</small></td>
      <td class="admin-only">
        <button class="mini-btn" type="button" data-edit-product="${escapeHtml(product.name)}">Modificar</button>
        <button class="mini-btn" type="button" data-stock-ledger-product="${escapeHtml(product.codigo_producto || product.codigo_barras || product.name)}">Ver movimientos</button>
      </td>
    </tr>
  `;
  }).join("") : '<tr><td class="stock-empty" colspan="11">No hay productos para el filtro seleccionado.</td></tr>';

  byId("stockMovements").innerHTML = (state.stockMovements || []).slice(0, 8).map((item) => `
    <article class="activity">
      <span class="tag">${escapeHtml(item.type)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("") || '<article class="activity"><span class="tag warn">Sin movimientos</span><strong>No hay kardex registrado</strong><p>Los movimientos apareceran al cargar inventario, compras, reservas o despachos.</p></article>';

  const shortages = OrderEngine.buildShortageList(state);
  byId("shortageList").innerHTML = shortages.length ? shortages.map((item) => `
    <article class="activity shortage-item">
      <span class="tag ${item.purchaseQty > 0 ? "danger" : "warn"}">${item.purchaseQty > 0 ? "Comprar" : "En transito"}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <p>Faltan ${item.missingQty}. En transito ${item.inTransit}. Compra necesaria ${item.purchaseQty}.</p>
      <small>${escapeHtml(item.orders.map((order) => `${order.code} ${order.client} x${order.qty}`).join(" | "))}</small>
    </article>
  `).join("") : '<article class="activity"><span class="tag ok">Completo</span><strong>Sin faltantes comprometidos</strong><p>Todos los pedidos activos tienen stock reservado.</p></article>';
  renderSupplyPlanner(shortages);
  renderStockLedger();
}

function stockMovementDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function stockMovementRows() {
  const movements = Array.isArray(state.stockMovements) ? state.stockMovements : [];
  const adjustments = (state.physicalStockAdjustments || []).map((entry) => ({
    ...entry,
    type: "Ajuste fisico",
    productCode: entry.productCode,
    productName: entry.productName,
    qty: numeric(entry.newStock, 0) - numeric(entry.previousStock, 0),
    stockBefore: entry.previousStock,
    stockAfter: entry.newStock,
    reason: entry.reason,
    title: entry.productName,
    text: entry.reason
  }));
  return [...movements, ...adjustments]
    .map((item, index) => {
      const productCode = String(item.productCode || item.codigo_producto || item.code || "").trim();
      const productName = String(item.productName || item.product || item.title || "").trim();
      const at = item.at || item.createdAt || item.date || "";
      const type = String(item.type || item.movementType || "Movimiento").trim();
      const orderCode = String(item.orderCode || item.order || item.pedido || "").trim();
      const remitNumber = String(item.remitNumber || item.remito || item.remit || "").trim();
      const supplier = String(item.supplier || item.provider || item.proveedor || "").trim();
      const client = String(item.client || item.cliente || "").trim();
      const user = String(item.user || item.username || item.actor || item.by || "").trim();
      const reason = String(item.reason || item.motive || item.note || item.observation || item.text || "").trim();
      const qty = item.qty ?? item.quantity ?? item.cantidad ?? "";
      const stockBefore = item.stockBefore ?? item.previousStock ?? item.stockAnterior ?? "";
      const stockAfter = item.stockAfter ?? item.newStock ?? item.stockPosterior ?? item.stockAfterPhysical ?? "";
      return {
        id: item.id || `stock-move-${index}`,
        at,
        dateKey: stockMovementDateKey(at),
        type,
        productCode,
        productName,
        qty,
        stockBefore,
        stockAfter,
        associated: [orderCode, remitNumber].filter(Boolean).join(" / "),
        party: [client, supplier].filter(Boolean).join(" / "),
        user,
        reason,
        search: [
          type,
          productCode,
          productName,
          orderCode,
          remitNumber,
          client,
          supplier,
          user,
          reason
        ].join(" ")
      };
    })
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}

function filteredStockMovementRows() {
  const terms = searchTerms(stockLedgerSearchTerm);
  return stockMovementRows()
    .filter((row) => !terms.length || matchesSearch(row.search, terms))
    .filter((row) => stockLedgerTypeFilter === "all" || row.type === stockLedgerTypeFilter)
    .filter((row) => stockLedgerUserFilter === "all" || row.user === stockLedgerUserFilter)
    .filter((row) => !stockLedgerDateFilter || row.dateKey === stockLedgerDateFilter);
}

function renderStockLedger() {
  const table = byId("stockLedgerTable");
  if (!table) return;
  const allRows = stockMovementRows();
  stockLedgerTypeFilter = updateDynamicFilter("stockLedgerTypeFilter", allRows.map((row) => row.type), stockLedgerTypeFilter, "Todos los tipos");
  stockLedgerUserFilter = updateDynamicFilter("stockLedgerUserFilter", allRows.map((row) => row.user).filter(Boolean), stockLedgerUserFilter, "Todos los usuarios");
  const rows = filteredStockMovementRows();
  const count = byId("stockLedgerCount");
  if (count) count.textContent = `${rows.length} movimientos`;
  table.innerHTML = rows.length ? rows.slice(0, 300).map((row) => `
    <tr>
      <td>${escapeHtml(row.at ? formatOrderTime(row.at) : "-")}</td>
      <td><span class="tag">${escapeHtml(row.type)}</span></td>
      <td><strong>${escapeHtml(row.productName || "Producto")}</strong><small>${escapeHtml(row.productCode || "Sin codigo")}</small></td>
      <td>${escapeHtml(String(row.qty === "" ? "-" : row.qty))}</td>
      <td>${escapeHtml(String(row.stockBefore === "" ? "-" : row.stockBefore))}</td>
      <td>${escapeHtml(String(row.stockAfter === "" ? "-" : row.stockAfter))}</td>
      <td>${escapeHtml(row.associated || "-")}</td>
      <td>${escapeHtml(row.party || "-")}</td>
      <td>${escapeHtml(row.user || "Sistema")}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="10">No hay movimientos para los filtros seleccionados.</td></tr>';
}

function focusStockLedgerProduct(productKey) {
  stockLedgerSearchTerm = String(productKey || "").trim();
  const input = byId("stockLedgerSearch");
  if (input) input.value = stockLedgerSearchTerm;
  renderStockLedger();
  const table = byId("stockLedgerTable");
  if (table) table.scrollIntoView({ behavior: "smooth", block: "center" });
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  String(line || "").split("").forEach((char, index, chars) => {
    if (char === '"' && chars[index + 1] === '"') {
      current += '"';
      chars[index + 1] = "";
      return;
    }
    if (char === '"') {
      quoted = !quoted;
      return;
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      return;
    }
    current += char;
  });
  cells.push(current.trim());
  return cells;
}

function inventoryDelimiter(text) {
  const firstLine = String(text || "").split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates = ["\t", ";", ","];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(firstLine, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function normalizeInventoryHeader(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, "");
}

function inventoryCell(row, keys) {
  const wanted = keys.map(normalizeInventoryHeader);
  const match = Object.keys(row).find((key) => wanted.includes(normalizeInventoryHeader(key)));
  return match ? row[match] : "";
}

function parseInitialStockText(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = inventoryDelimiter(text);
  const headers = splitDelimitedLine(lines[0], delimiter);
  const hasHeader = headers.some((header) => ["codigo", "codigoproducto", "codigodebarras", "descripcion", "cantidadfisica", "stock"].includes(normalizeInventoryHeader(header)));
  const finalHeaders = hasHeader
    ? headers
    : ["codigo_producto", "codigo_barras", "descripcion", "cantidad_fisica", "deposito", "observacion"];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line, index) => {
    const cells = splitDelimitedLine(line, delimiter);
    const row = {};
    finalHeaders.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] || "";
    });
    return {
      rowNumber: index + (hasHeader ? 2 : 1),
      productCode: String(inventoryCell(row, ["codigo_producto", "codigo", "codigo interno", "code"]) || "").trim(),
      barcode: String(inventoryCell(row, ["codigo_barras", "barras", "ean", "barcode"]) || "").trim(),
      description: String(inventoryCell(row, ["descripcion", "producto", "nombre", "name"]) || "").trim(),
      quantityPhysical: String(inventoryCell(row, ["cantidad_fisica", "cantidad", "stock", "stock_fisico", "conteo"]) || "").trim(),
      warehouse: String(inventoryCell(row, ["deposito", "almacen", "warehouse"]) || "").trim(),
      observation: String(inventoryCell(row, ["observacion", "observaciones", "nota", "motivo"]) || "").trim()
    };
  }).filter((row) => row.productCode || row.barcode || row.description || row.quantityPhysical);
}

function resolveInitialStockProduct(row) {
  const code = normalizeSearchText(row.productCode);
  const barcode = normalizeSearchText(row.barcode);
  const description = normalizeSearchText(row.description);
  return state.products.find((product) => code && normalizeSearchText(product.codigo_producto) === code)
    || state.products.find((product) => barcode && normalizeSearchText(product.codigo_barras) === barcode)
    || state.products.find((product) => description && normalizeSearchText(product.name) === description)
    || null;
}

function buildInitialStockPreview(rows) {
  const seen = new Set();
  return rows.map((row) => {
    const product = resolveInitialStockProduct(row);
    const quantity = numeric(String(row.quantityPhysical || "").replace(",", "."), NaN);
    const inventory = product ? OrderEngine.inventory(product) : null;
    const key = product ? productInventoryKey(product) : "";
    const errors = [];
    if (!product) errors.push("Producto inexistente");
    if (!Number.isFinite(quantity) || quantity < 0) errors.push("Cantidad invalida");
    if (product && seen.has(key)) errors.push("Codigo duplicado");
    if (product) seen.add(key);
    if (product && Number.isFinite(quantity) && quantity < inventory.reserved) errors.push(`Menor al reservado (${inventory.reserved})`);
    return {
      ...row,
      productCode: product ? productInventoryKey(product) : row.productCode,
      productName: product ? product.name : row.description,
      quantityPhysical: Number.isFinite(quantity) ? Math.floor(quantity) : row.quantityPhysical,
      currentPhysical: inventory ? inventory.physical : "",
      reserved: inventory ? inventory.reserved : 0,
      difference: inventory && Number.isFinite(quantity) ? Math.floor(quantity) - inventory.physical : "",
      errors
    };
  });
}

function renderInitialStockPreview() {
  const table = byId("initialStockPreviewTable");
  const summary = byId("initialStockSummary");
  const apply = byId("applyInitialStockBtn");
  if (!table || !summary || !apply) return;
  const errors = initialStockPreviewRows.reduce((total, row) => total + row.errors.length, 0);
  const okRows = initialStockPreviewRows.filter((row) => !row.errors.length);
  summary.value = initialStockPreviewRows.length
    ? `${okRows.length} correctas / ${errors} errores`
    : "Sin vista previa";
  apply.disabled = !okRows.length || errors > 0;
  table.innerHTML = initialStockPreviewRows.length ? initialStockPreviewRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.rowNumber)}</td>
      <td><strong>${escapeHtml(row.productName || "-")}</strong></td>
      <td>${escapeHtml(row.productCode || row.barcode || "-")}</td>
      <td>${escapeHtml(String(row.quantityPhysical))}</td>
      <td>${escapeHtml(String(row.currentPhysical === "" ? "-" : row.currentPhysical))}</td>
      <td>${escapeHtml(String(row.difference === "" ? "-" : row.difference))}</td>
      <td>${escapeHtml(row.warehouse || "Deposito")}</td>
      <td><span class="tag ${row.errors.length ? "danger" : "ok"}">${escapeHtml(row.errors.length ? row.errors.join(" / ") : "Correcta")}</span></td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="8">Cargar archivo o pegar datos y tocar Vista previa.</td></tr>';
}

function openInitialStockDialog() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede cargar inventario inicial.");
    return;
  }
  initialStockPreviewRows = [];
  byId("initialStockForm").reset();
  byId("initialStockMessage").textContent = "";
  renderInitialStockPreview();
  byId("initialStockDialog").showModal();
}

function previewInitialStockImport() {
  const text = byId("initialStockText").value;
  const rows = parseInitialStockText(text);
  initialStockPreviewRows = buildInitialStockPreview(rows);
  const message = byId("initialStockMessage");
  if (!rows.length) {
    message.textContent = "No se detectaron filas para importar.";
  } else if (initialStockPreviewRows.some((row) => row.errors.length)) {
    message.textContent = "Corregir las filas marcadas antes de aplicar. No se importara parcialmente.";
  } else {
    message.textContent = "Vista previa correcta. Confirmar para aplicar inventario inicial.";
  }
  renderInitialStockPreview();
}

async function readInitialStockFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  byId("initialStockFileName").value = file.name;
  const text = await file.text();
  byId("initialStockText").value = text;
  previewInitialStockImport();
}

async function applyInitialStockImport(event) {
  event.preventDefault();
  const message = byId("initialStockMessage");
  const validRows = initialStockPreviewRows.filter((row) => !row.errors.length);
  if (!validRows.length || validRows.length !== initialStockPreviewRows.length) {
    message.textContent = "Primero generar una vista previa sin errores.";
    return;
  }
  const confirmText = String(byId("initialStockConfirmText").value || "").trim();
  if (confirmText !== "CONFIRMAR") {
    message.textContent = "Escribir CONFIRMAR para aplicar la carga inicial.";
    return;
  }
  const button = byId("applyInitialStockBtn");
  button.disabled = true;
  button.textContent = "Aplicando...";
  try {
    const payload = await postOperationalAction("api/stock/initial-inventory", {
      confirmed: true,
      confirmText,
      fileName: String(byId("initialStockFileName").value || "").trim(),
      observation: String(byId("initialStockObservation").value || "").trim(),
      rows: validRows.map((row) => ({
        productCode: row.productCode,
        barcode: row.barcode,
        description: row.productName || row.description,
        quantityPhysical: row.quantityPhysical,
        warehouse: row.warehouse,
        observation: row.observation
      }))
    });
    byId("initialStockDialog").close("default");
    showCompactNotice(`Inventario inicial aplicado: ${payload.applied || validRows.length} productos. Backup ${payload.backup?.id || "generado"}.`, "ok");
  } catch (error) {
    message.textContent = error.message || "No se pudo aplicar el inventario inicial.";
  } finally {
    button.disabled = false;
    button.textContent = "Aplicar inventario inicial";
  }
}

function populatePriceListSelectors() {
  const productOptions = byId("priceListProductOptions");
  if (productOptions) {
    productOptions.innerHTML = state.products.map((product) => `
      <option value="${escapeHtml(priceProductKey(product))}">${escapeHtml(product.name)} - ${escapeHtml(product.rubro)} - ${money.format(currentProductPrice(product))}</option>
    `).join("");
  }
  const fillSelect = (id, values, placeholder) => {
    const select = byId(id);
    if (!select) return;
    const current = select.value;
    const options = uniqueSorted(values.filter(Boolean));
    select.innerHTML = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join("");
    if (options.includes(current)) select.value = current;
  };
  fillSelect("priceListTargetRubric", state.products.map((product) => product.rubro), "Seleccionar rubro");
  fillSelect("priceListTargetBrand", state.products.map((product) => product.marca), "Seleccionar marca");
  fillSelect("priceListTargetSupplier", state.products.map((product) => product.proveedor || product.supplier), "Seleccionar proveedor");
  priceListListFilter = updateDynamicFilter("priceListFilterList", state.priceLists.map((list) => list.name), priceListListFilter, "Todas las listas");
  priceListRubricFilter = updateDynamicFilter("priceListRubricFilter", state.products.map((product) => product.rubro), priceListRubricFilter, "Todos los rubros");
  priceListBrandFilter = updateDynamicFilter("priceListBrandFilter", state.products.map((product) => product.marca), priceListBrandFilter, "Todas las marcas");
  priceListSupplierFilter = updateDynamicFilter("priceListSupplierFilter", state.products.map((product) => product.proveedor || product.supplier), priceListSupplierFilter, "Todos los proveedores");
}

function priceListStatusTone(status) {
  const normalized = normalizeSearchText(status);
  if (normalized.includes("act")) return "ok";
  if (normalized.includes("program")) return "warn";
  if (normalized.includes("borr")) return "info";
  if (normalized.includes("histor")) return "muted";
  return "danger";
}

function filteredPriceListProducts() {
  const globalTerms = [];
  const localTerms = searchTerms(priceListSearchTerm);
  return state.products.filter((product) => {
    const text = [
      product.codigo_producto,
      product.codigo_barras,
      product.name,
      product.descripcion,
      product.rubro,
      product.marca,
      product.proveedor,
      product.priceListName,
      currentProductPrice(product)
    ].join(" ");
    const listName = product.priceListName || activePriceList()?.name || "Lista vigente";
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesList = priceListListFilter === "all" || listName === priceListListFilter;
    const matchesRubric = priceListRubricFilter === "all" || product.rubro === priceListRubricFilter;
    const matchesBrand = priceListBrandFilter === "all" || product.marca === priceListBrandFilter;
    const supplier = product.proveedor || product.supplier || "";
    const matchesSupplier = priceListSupplierFilter === "all" || supplier === priceListSupplierFilter;
    const matchesStatus = priceListStatusFilter === "all" || (product.activo || "SI") === priceListStatusFilter;
    const matchesDate = !priceListEffectiveFilter || (product.priceUpdatedAt || activePriceList()?.effectiveAt || "").slice(0, 10) === priceListEffectiveFilter;
    return matchesGlobal && matchesLocal && matchesList && matchesRubric && matchesBrand && matchesSupplier && matchesStatus && matchesDate;
  });
}

function renderPriceListCards() {
  const container = byId("priceListCards");
  if (!container) return;
  const active = activePriceList();
  const lists = state.priceLists || [];
  const programmed = lists.filter((list) => list.status === "Programada").length;
  const auditCount = Array.isArray(state.priceListAudit) ? state.priceListAudit.length : 0;
  const priceTotal = state.products.reduce((sum, product) => sum + currentProductPrice(product), 0);
  const items = [
    { label: "Lista predeterminada", value: active ? active.name : "Sin lista", text: active ? `Vigencia ${formatOrderTime(active.effectiveAt)}` : "Crear lista activa", tone: active ? "ok" : "warn" },
    { label: "Productos con precio", value: String(state.products.filter((product) => currentProductPrice(product) > 0).length), text: `${state.products.length} productos normalizados`, tone: "ok" },
    { label: "Listas operativas", value: String((state.priceLists || []).filter((list) => /^PL-L[1-5]$/.test(list.id)).length), text: "Columnas Lista Nº 1 a Nº 5", tone: "info" },
    { label: "Vendedores con lista", value: String((state.priceListAssignments || []).length), text: "Kevin queda en Lista Nº 4", tone: "ok" },
    { label: "Programadas", value: String(programmed), text: "No impactan hasta su vigencia", tone: programmed ? "warn" : "ok" },
    { label: "Auditoria", value: String(auditCount), text: "Cambios historicos registrados", tone: auditCount ? "ok" : "warn" },
    { label: "Total precios lista", value: money.format(priceTotal), text: "Suma referencial por unidad", tone: "info" }
  ];
  container.innerHTML = items.map((item) => `
    <article class="price-list-kpi ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.text)}</small>
    </article>
  `).join("");
}

function renderProductPortfolioPanel() {
  const panel = byId("productPortfolioPanel");
  if (!panel) return;
  const kevinAssignment = (state.priceListAssignments || []).find((item) => item.username === "kevin" || normalizeSearchText(item.sellerName) === normalizeSearchText("Kevin Guibert"));
  const latestBackup = (state.maintenanceBackups || [])[0];
  const latestPortfolio = (state.productPortfolioAudit || [])[0];
  const inactive = state.products.filter((product) => String(product.activo || "SI").toUpperCase() === "NO").length;
  const rubrics = uniqueSorted(state.products.map((product) => product.rubro).filter(Boolean)).length;
  panel.innerHTML = [
    { label: "Productos", value: state.products.length, text: `${inactive} inactivos - ${rubrics} rubros`, tone: "info" },
    { label: "Lista Kevin", value: kevinAssignment ? kevinAssignment.priceListName : "Lista Nº 4", text: kevinAssignment ? `Usuario ${kevinAssignment.username || "kevin"}` : "Asignacion base pendiente de guardar", tone: "ok" },
    { label: "Importaciones", value: (state.productPortfolioAudit || []).length, text: latestPortfolio ? `${latestPortfolio.newCount || 0} productos - ${formatOrderTime(latestPortfolio.at)}` : "Sin importaciones registradas", tone: latestPortfolio ? "ok" : "warn" },
    { label: "Ultimo backup", value: latestBackup ? latestBackup.id : "Sin backup", text: latestBackup ? formatOrderTime(latestBackup.at) : "Se crea antes de limpiar/importar", tone: latestBackup ? "ok" : "warn" }
  ].map((item) => `
    <article class="price-list-kpi ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.value))}</strong>
      <small>${escapeHtml(item.text)}</small>
    </article>
  `).join("");
}

function renderPriceListDirectory() {
  const list = byId("priceListDirectory");
  if (!list) return;
  const rows = (state.priceLists || []).slice(0, 12);
  list.innerHTML = rows.length ? rows.map((item) => `
    <article class="price-list-card ${item.isDefault ? "active" : ""}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.id)} - ${escapeHtml(item.updatedBy || "Sistema")}</small>
      </div>
      <span class="tag ${priceListStatusTone(item.status)}">${escapeHtml(item.status)}</span>
      <small>Vigencia ${escapeHtml(formatOrderTime(item.effectiveAt))} - ${numeric(item.productCount, (item.items || []).length)} productos</small>
      <small>${item.isDefault ? "Predeterminada" : "No predeterminada"}</small>
    </article>
  `).join("") : '<div class="empty-note">Sin listas registradas.</div>';
}

function renderPriceListProductsTable() {
  const table = byId("priceListProductsTable");
  if (!table) return;
  const products = filteredPriceListProducts();
  table.innerHTML = products.length ? products.slice(0, 180).map((product) => {
    const price = currentProductPrice(product);
    const margin = product.cost > 0 ? ((price - product.cost) / product.cost) * 100 : 0;
    const listPrices = SYSTEM_PRICE_LISTS.map((number) => `
      <span class="price-list-chip ${number === 4 ? "highlight" : ""}">L${number} ${money.format(productPriceForListNumber(product, number))}</span>
    `).join("");
    return `
      <tr>
        <td>
          <strong>${escapeHtml(product.name)}</strong>
          <small>${escapeHtml(product.codigo_producto || "Sin codigo")} ${product.codigo_barras ? `- EAN ${escapeHtml(product.codigo_barras)}` : ""}</small>
        </td>
        <td>
          <strong>${escapeHtml(product.rubro)}</strong>
          <small>${escapeHtml(product.marca)} - ${escapeHtml(product.proveedor || product.supplier || "Sin proveedor")}</small>
        </td>
        <td>
          <strong>${money.format(price)}</strong>
          <small>Costo ${money.format(product.cost)} - Margen ${Math.round(margin)}%</small>
          <div class="price-list-chip-row">${listPrices}</div>
        </td>
        <td>
          <strong>${escapeHtml(product.priceListName || activePriceList()?.name || "Lista vigente")}</strong>
          <small>${product.priceUpdatedAt ? `Actualizado ${escapeHtml(formatOrderTime(product.priceUpdatedAt))}` : "Precio base"}</small>
        </td>
        <td><span class="tag ${product.activo === "NO" ? "danger" : "ok"}">${escapeHtml(product.activo === "NO" ? "Inactivo" : "Activo")}</span></td>
        <td class="admin-only"><button class="mini-btn" type="button" data-price-product="${escapeHtml(priceProductKey(product))}">Editar precio</button></td>
      </tr>
    `;
  }).join("") : '<tr><td class="stock-empty" colspan="6">No hay productos para los filtros seleccionados.</td></tr>';
  const count = byId("priceListProductsCount");
  if (count) count.textContent = `${products.length} productos visibles`;
}

function priceListFormInput() {
  const form = byId("priceListForm");
  const data = new FormData(form);
  const effectiveValue = String(data.get("effectiveAt") || "").trim();
  return {
    name: String(data.get("listName") || "Lista de precios").trim(),
    operation: String(data.get("operation") || "general"),
    productKey: String(data.get("productKey") || "").trim(),
    rubro: String(data.get("rubro") || "").trim(),
    marca: String(data.get("marca") || "").trim(),
    proveedor: String(data.get("proveedor") || "").trim(),
    fixedPrice: data.get("fixedPrice") === "" ? NaN : Number(data.get("fixedPrice")),
    marginPct: Number(data.get("marginPct") || 0),
    increasePct: Number(data.get("increasePct") || 0),
    rounding: Number(data.get("rounding") || 1),
    status: String(data.get("status") || "Activa"),
    effectiveAt: effectiveValue ? new Date(effectiveValue).toISOString() : new Date().toISOString(),
    motive: String(data.get("motive") || "").trim()
  };
}

function validatePriceListInput(input, options = {}) {
  if (!isAdminUser()) throw new Error("Solo Administracion puede modificar listas de precios.");
  if (input.operation === "individual" && !input.productKey) throw new Error("Seleccionar producto para modificacion individual.");
  if (input.operation === "rubro" && !input.rubro) throw new Error("Seleccionar rubro para modificacion masiva.");
  if (input.operation === "marca" && !input.marca) throw new Error("Seleccionar marca para modificacion masiva.");
  if (input.operation === "proveedor" && !input.proveedor) throw new Error("Seleccionar proveedor para modificacion masiva.");
  if (options.requireMotive && !input.motive) throw new Error("Indicar motivo administrativo del cambio.");
}

function renderPriceListSimulation(simulation = priceListLastSimulation) {
  const box = byId("priceListSimulation");
  if (!box) return;
  if (!simulation) {
    box.innerHTML = '<div class="empty-note">Simular un cambio para revisar precio anterior, precio nuevo y productos afectados antes de aplicar.</div>';
    return;
  }
  box.innerHTML = `
    <div class="price-simulation-summary">
      <article><span>Productos afectados</span><strong>${simulation.affected}</strong></article>
      <article><span>Precio anterior</span><strong>${money.format(simulation.totals.previous)}</strong></article>
      <article><span>Precio nuevo</span><strong>${money.format(simulation.totals.next)}</strong></article>
      <article><span>Diferencia</span><strong>${money.format(simulation.totals.difference)}</strong></article>
    </div>
    <div class="responsive-table">
      <table class="dense-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Anterior</th>
            <th>Nuevo</th>
            <th>Diferencia</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          ${(simulation.sample || []).slice(0, 80).map((item) => `
            <tr>
              <td><strong>${escapeHtml(item.productName)}</strong><small>${escapeHtml(item.productCode || "Sin codigo")}</small></td>
              <td>${money.format(item.previousPrice)}</td>
              <td><strong>${money.format(item.price)}</strong></td>
              <td>${money.format(item.difference)}</td>
              <td>${Math.round(numeric(item.percentApplied, 0))}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPriceListOperationFields() {
  const form = byId("priceListForm");
  if (!form) return;
  const operation = form.elements.operation.value;
  document.querySelectorAll("[data-price-operation-field]").forEach((field) => {
    const modes = String(field.dataset.priceOperationField || "").split(",");
    field.hidden = !modes.includes(operation);
  });
}

function renderPriceLists() {
  if (!byId("priceListCards")) return;
  populatePriceListSelectors();
  renderPriceListOperationFields();
  renderPriceListCards();
  renderProductPortfolioPanel();
  renderPriceListDirectory();
  renderPriceListProductsTable();
  renderPriceListSimulation();
  const latestAudit = byId("priceListAuditList");
  if (latestAudit) {
    const rows = (state.priceListAudit || []).slice(0, 8);
    latestAudit.innerHTML = rows.length ? rows.map((entry) => `
      <article class="activity">
        <span class="tag">Precio</span>
        <strong>${escapeHtml(entry.productName || entry.listName || "Lista")}</strong>
        <p>${money.format(entry.previousPrice)} -> ${money.format(entry.newPrice)} por ${escapeHtml(entry.user || "Sistema")}. ${escapeHtml(entry.motive || "")}</p>
        <small>${escapeHtml(entry.date || "")} ${escapeHtml(entry.time || "")} - ${escapeHtml(entry.operation || "")}</small>
      </article>
    `).join("") : '<div class="empty-note">Todavia no hay movimientos de listas.</div>';
  }
}

async function simulatePriceListFromForm() {
  try {
    const input = priceListFormInput();
    validatePriceListInput(input);
    priceListLastSimulation = simulatePriceListChangeLocal(input);
    renderPriceListSimulation();
    if (!priceListLastSimulation.affected) showCompactNotice("La seleccion no afecta productos.", "warn");
  } catch (error) {
    window.alert(error.message || "No se pudo simular la lista.");
  }
}

async function applyPriceListFromForm() {
  try {
    const input = priceListFormInput();
    validatePriceListInput(input, { requireMotive: true });
    const simulation = priceListLastSimulation || simulatePriceListChangeLocal(input);
    if (!simulation.affected) {
      window.alert("La seleccion no afecta productos.");
      return;
    }
    const accepted = window.confirm([
      `Aplicar lista "${input.name}"?`,
      `Productos afectados: ${simulation.affected}`,
      `Diferencia total referencial: ${money.format(simulation.totals.difference)}`,
      `Vigencia: ${formatOrderTime(input.effectiveAt)}`,
      "Los pedidos ya confirmados conservaran su precio historico."
    ].join("\n"));
    if (!accepted) return;
    const payload = await postOperationalAction("api/price-lists/apply", {
      ...input,
      confirmed: true
    });
    priceListLastSimulation = payload.simulation || null;
    showCompactNotice(payload.appliedNow ? "Lista aplicada correctamente." : "Lista guardada/programada.", "ok");
    renderPriceLists();
  } catch (error) {
    window.alert(error.message || "No se pudo aplicar la lista de precios.");
  }
}

function clearPriceListFilters() {
  priceListSearchTerm = "";
  priceListListFilter = "all";
  priceListRubricFilter = "all";
  priceListBrandFilter = "all";
  priceListSupplierFilter = "all";
  priceListStatusFilter = "all";
  priceListEffectiveFilter = "";
  ["priceListSearch", "priceListEffectiveFilter"].forEach((id) => { if (byId(id)) byId(id).value = ""; });
  ["priceListFilterList", "priceListRubricFilter", "priceListBrandFilter", "priceListSupplierFilter", "priceListStatusFilter"].forEach((id) => { if (byId(id)) byId(id).value = "all"; });
  renderPriceLists();
}

async function assignSellerPriceListFromPanel() {
  if (!isAdminUser()) {
    window.alert("Solo Administracion puede asignar listas por vendedor.");
    return;
  }
  const username = String(byId("portfolioAssignUser")?.value || "").trim();
  const listNumber = Number(byId("portfolioAssignList")?.value || 4);
  const motive = String(byId("portfolioAssignMotive")?.value || "").trim();
  if (!username) {
    window.alert("Indicar usuario vendedor.");
    return;
  }
  if (!motive) {
    window.alert("Indicar motivo administrativo.");
    byId("portfolioAssignMotive")?.focus();
    return;
  }
  try {
    const payload = await postOperationalAction("api/product-portfolio/assign-price-list", {
      username,
      listNumber,
      locked: true,
      motive
    });
    showCompactNotice(`${payload.assignment.priceListName} asignada a ${username}.`, "ok");
    byId("portfolioAssignMotive").value = "";
    renderPriceLists();
  } catch (error) {
    window.alert(error.message || "No se pudo asignar la lista.");
  }
}

async function runMaintenanceCleanup(target) {
  if (!isAdminUser()) {
    window.alert("Solo Administracion puede ejecutar mantenimiento.");
    return;
  }
  const label = target === "orders" ? "pedidos" : "clientes";
  const motive = window.prompt(`Motivo para limpiar base de ${label}:`);
  if (!motive) return;
  const confirmText = window.prompt(`Operacion critica. Escribir CONFIRMAR para limpiar ${label}. Se generara backup previo.`);
  if (confirmText !== "CONFIRMAR") {
    window.alert("Limpieza cancelada.");
    return;
  }
  try {
    const payload = await postOperationalAction("api/admin/maintenance/cleanup", {
      target,
      motive,
      confirmText,
      confirmed: true
    });
    showCompactNotice(`Limpieza de ${label} ejecutada. Backup ${payload.backup.id}.`, "warn");
    renderForCurrentUser();
  } catch (error) {
    window.alert(error.message || "No se pudo ejecutar mantenimiento.");
  }
}

function commissionRoleLabel(role) {
  return role === "driver" ? "Repartidor" : "Vendedor";
}

function commissionRules() {
  return ensureLocalCommissionSettings().rules || [];
}

function commissionRuleText(rule) {
  return [rule.role, rule.userLabel, rule.username, rule.rubro, rule.productCode, rule.productName, rule.status].join(" ");
}

function filteredCommissionRules() {
  const terms = searchTerms(commissionSearchTerm);
  return commissionRules()
    .filter((rule) => commissionRoleFilter === "all" || rule.role === commissionRoleFilter)
    .filter((rule) => commissionStatusFilter === "all" || rule.status === commissionStatusFilter)
    .filter((rule) => !terms.length || matchesSearch(commissionRuleText(rule), terms))
    .sort((a, b) => numeric(b.priority, 0) - numeric(a.priority, 0) || a.role.localeCompare(b.role));
}

function renderCommissionOptions() {
  const users = byId("commissionUserOptions");
  const rubrics = byId("commissionRubricOptions");
  const products = byId("commissionProductOptions");
  if (users) {
    users.innerHTML = [
      ...(state.sellers || []).map((seller) => seller.name),
      ...(demoUsers || []).filter((user) => user.role === "driver").map((user) => user.name)
    ].filter(Boolean).map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  }
  if (rubrics) {
    const values = ["*", ...new Set((state.products || []).map((product) => product.rubro || product.category || product.familia || "").filter(Boolean)), "Cigarrillos"];
    rubrics.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
  }
  if (products) {
    products.innerHTML = (state.products || []).map((product) => `<option value="${escapeHtml(product.name)}">${escapeHtml(product.codigo_producto || product.code || product.rubro || "")}</option>`).join("");
  }
}

function renderCommissionCards() {
  const container = byId("commissionCards");
  if (!container) return;
  const rules = commissionRules();
  const summary = OrderEngine && typeof OrderEngine.summarizeCommissions === "function" ? OrderEngine.summarizeCommissions(state) : [];
  const sellerTotal = summary.filter((row) => row.role === "seller").reduce((sum, row) => sum + numeric(row.total, 0), 0);
  const driverTotal = summary.filter((row) => row.role === "driver").reduce((sum, row) => sum + numeric(row.total, 0), 0);
  container.innerHTML = [
    { label: "Reglas activas", value: rules.filter((rule) => rule.active !== false).length, text: "Configurables por rol y rubro", tone: "info" },
    { label: "Vendedores", value: money.format(sellerTotal), text: "Comision acumulada", tone: "ok" },
    { label: "Repartidores", value: money.format(driverTotal), text: "Devenga al entregar", tone: "warn" },
    { label: "Cambios auditados", value: (state.commissionAudit || []).length, text: "Historial no eliminable", tone: "info" }
  ].map((item) => `
    <article class="price-list-kpi ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.value))}</strong>
      <small>${escapeHtml(item.text)}</small>
    </article>
  `).join("");
}

function renderCommissionRulesTable() {
  const table = byId("commissionRulesTable");
  if (!table) return;
  const rows = filteredCommissionRules();
  table.innerHTML = rows.length ? rows.map((rule) => {
    const target = rule.productName || rule.productCode || rule.rubro || "General";
    const user = rule.userLabel || rule.username || "Todos";
    return `
    <tr>
      <td><strong>${escapeHtml(commissionRoleLabel(rule.role))}</strong></td>
      <td>${escapeHtml(user)}</td>
      <td>
        <div class="commission-rule-scope">
          <strong>${escapeHtml(target)}</strong>
          <small>Prioridad ${escapeHtml(rule.priority)}${rule.isDefault ? " - predeterminada" : ""}</small>
        </div>
      </td>
      <td><span class="commission-percent">${escapeHtml(rule.percent)}%</span></td>
      <td>
        <small>Desde ${escapeHtml((rule.startsAt || "").slice(0, 10))}</small>
        <small>${rule.endsAt ? `Hasta ${escapeHtml(rule.endsAt.slice(0, 10))}` : "Sin vencimiento"}</small>
      </td>
      <td><span class="tag ${rule.active === false ? "warn" : "ok"}">${escapeHtml(rule.status)}</span></td>
      <td>
        <button class="mini-btn" type="button" data-commission-edit="${escapeHtml(rule.id)}">Editar</button>
        <button class="mini-btn danger-btn" type="button" data-commission-deactivate="${escapeHtml(rule.id)}" ${rule.active === false ? "disabled" : ""}>Inactivar</button>
      </td>
    </tr>`;
  }).join("") : '<tr><td class="stock-empty" colspan="7">No hay reglas para los filtros seleccionados.</td></tr>';
}

function renderCommissionSummary() {
  const list = byId("commissionSummaryList");
  if (!list) return;
  const rows = OrderEngine && typeof OrderEngine.summarizeCommissions === "function" ? OrderEngine.summarizeCommissions(state) : [];
  list.innerHTML = rows.length ? rows.map((row) => `
    <article class="stock-item commission-summary-card">
      <span class="tag ${row.role === "driver" ? "warn" : "ok"}">${escapeHtml(commissionRoleLabel(row.role))}</span>
      <strong>${escapeHtml(row.user)}</strong>
      <div class="line"><small>Base computada</small><b>${money.format(row.baseAmount)}</b></div>
      <div class="line"><small>Cigarrillos</small><b>${money.format(row.cigarettes)}</b></div>
      <div class="line"><small>Resto mercaderia</small><b>${money.format(row.merchandise)}</b></div>
      <div class="line"><small>Devoluciones</small><b>${money.format(row.returns)}</b></div>
      <div class="line"><small>Total final</small><b>${money.format(row.total)}</b></div>
      <p class="commission-summary-meta">${row.orders} pedidos/entregas computadas.</p>
    </article>
  `).join("") : '<article class="stock-item"><span class="tag warn">Sin datos</span><strong>No hay comisiones computadas</strong><p>Se generaran al confirmar pedidos y entregar rutas.</p></article>';
}

function renderCommissionAudit() {
  const list = byId("commissionAuditList");
  if (!list) return;
  const rows = (state.commissionAudit || []).slice(0, 20);
  list.innerHTML = rows.length ? rows.map((entry) => `
    <article class="activity">
      <span class="tag">${escapeHtml(entry.action || "Comision")}</span>
      <strong>${escapeHtml(entry.user || "Administracion")} - ${escapeHtml(entry.ruleId || "")}</strong>
      <p>${escapeHtml(entry.motive || "")}</p>
      <small>${escapeHtml(entry.date || "")} ${escapeHtml(entry.time || "")}</small>
    </article>
  `).join("") : '<article class="activity"><span class="tag ok">Sin cambios</span><strong>No hay auditoria de comisiones</strong><p>Los cambios de porcentaje quedaran aqui.</p></article>';
}

function renderCommissionsModule() {
  if (!byId("commissionCards")) return;
  renderCommissionOptions();
  renderCommissionCards();
  renderCommissionRulesTable();
  renderCommissionSummary();
  renderCommissionAudit();
}

function resetCommissionRuleForm() {
  const form = byId("commissionRuleForm");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.role.value = "seller";
  form.elements.rubro.value = "";
  form.elements.percent.value = "";
  form.elements.priority.value = "10";
  form.elements.status.value = "Activa";
}

function fillCommissionRuleForm(ruleId) {
  const rule = commissionRules().find((item) => item.id === ruleId);
  const form = byId("commissionRuleForm");
  if (!rule || !form) return;
  form.elements.id.value = rule.id;
  form.elements.role.value = rule.role;
  form.elements.userName.value = rule.userLabel || rule.username || "";
  form.elements.rubro.value = rule.rubro || "";
  form.elements.productName.value = rule.productName || rule.productCode || "";
  form.elements.percent.value = rule.percent;
  form.elements.priority.value = rule.priority;
  form.elements.startsAt.value = (rule.startsAt || "").slice(0, 10);
  form.elements.endsAt.value = rule.endsAt ? rule.endsAt.slice(0, 10) : "";
  form.elements.status.value = rule.status || "Activa";
  form.elements.motive.value = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function commissionRulePayload(extra = {}) {
  const form = byId("commissionRuleForm");
  const data = new FormData(form);
  return {
    id: String(data.get("id") || "").trim(),
    role: String(data.get("role") || "seller").trim(),
    userName: String(data.get("userName") || "").trim(),
    rubro: String(data.get("rubro") || "").trim(),
    productName: String(data.get("productName") || "").trim(),
    percent: Number(data.get("percent") || 0),
    priority: Number(data.get("priority") || 0),
    startsAt: data.get("startsAt") ? `${data.get("startsAt")}T00:00:00.000Z` : "",
    endsAt: data.get("endsAt") ? `${data.get("endsAt")}T23:59:59.000Z` : "",
    status: String(data.get("status") || "Activa").trim(),
    motive: String(data.get("motive") || "").trim(),
    ...extra
  };
}

async function saveCommissionRule(extra = {}) {
  if (!isAdminUser()) return;
  try {
    const payload = commissionRulePayload(extra);
    if (!payload.percent && payload.action !== "deactivate") throw new Error("Indicar porcentaje de comision.");
    if (!payload.motive) throw new Error("Indicar motivo del cambio.");
    await postOperationalAction("api/commissions/rules", payload);
    resetCommissionRuleForm();
    renderCommissionsModule();
    showCompactNotice("Regla de comision guardada.", "ok");
  } catch (error) {
    window.alert(error.message || "No se pudo guardar la regla.");
  }
}

async function deactivateCommissionRule(ruleId) {
  const rule = commissionRules().find((item) => item.id === ruleId);
  if (!rule || !isAdminUser()) return;
  const motive = window.prompt(`Motivo para inactivar ${rule.id}`);
  if (!motive) return;
  try {
    await postOperationalAction("api/commissions/rules", {
      ...rule,
      action: "deactivate",
      active: false,
      status: "Inactiva",
      motive
    });
    renderCommissionsModule();
    showCompactNotice("Regla de comision inactivada.", "ok");
  } catch (error) {
    window.alert(error.message || "No se pudo inactivar la regla.");
  }
}

function exportCommissionsCsv() {
  const rows = OrderEngine && typeof OrderEngine.summarizeCommissions === "function" ? OrderEngine.summarizeCommissions(state) : [];
  const header = ["rol", "usuario", "pedidos_entregas", "base_computada", "comision_cigarrillos", "comision_resto", "devoluciones", "total_final"];
  const csvRows = rows.map((row) => [
    commissionRoleLabel(row.role),
    row.user,
    row.orders,
    row.baseAmount,
    row.cigarettes,
    row.merchandise,
    row.returns,
    row.total
  ]);
  const csv = [header, ...csvRows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadBlob(`comisiones-distribuidora-lopez-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function renderSupplyPlanner(shortages = OrderEngine.buildShortageList(state)) {
  const summary = byId("supplyPlannerSummary");
  const table = byId("supplyPlannerTable");
  if (!summary || !table) return;
  const totalMissing = shortages.reduce((sum, item) => sum + numeric(item.missingQty, 0), 0);
  const totalTransit = shortages.reduce((sum, item) => sum + numeric(item.inTransit, 0), 0);
  const totalPurchase = shortages.reduce((sum, item) => sum + numeric(item.purchaseQty, 0), 0);
  summary.innerHTML = `
    <article class="supply-planner-kpi">
      <span>Productos afectados</span>
      <strong>${shortages.length}</strong>
    </article>
    <article class="supply-planner-kpi">
      <span>Unidades faltantes</span>
      <strong>${totalMissing}</strong>
    </article>
    <article class="supply-planner-kpi">
      <span>Compra necesaria</span>
      <strong>${totalPurchase}</strong>
      <small>Transito informado ${totalTransit}</small>
    </article>
  `;
  table.innerHTML = shortages.length ? shortages.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.purchaseQty > 0 ? "Compra pendiente" : "Cubierto por transito"}</small>
      </td>
      <td><strong>${numeric(item.missingQty, 0)}</strong></td>
      <td>${numeric(item.inTransit, 0)}</td>
      <td><span class="tag ${item.purchaseQty > 0 ? "danger" : "warn"}">${numeric(item.purchaseQty, 0)}</span></td>
      <td>
        <div class="supply-order-list">
          ${item.orders.map((order) => `<small>${escapeHtml(`${order.code} - ${order.client} - ${order.qty} u.`)}</small>`).join("")}
        </div>
      </td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="5">No hay compras pendientes por pedidos en abastecimiento.</td></tr>';
}

function openSupplyPlannerDialog() {
  renderSupplyPlanner();
  const dialog = byId("supplyPlannerDialog");
  if (dialog && !dialog.open) dialog.showModal();
}

function openSupplyPlannerIfPending() {
  if (!isAdminUser()) return;
  const shortages = OrderEngine.buildShortageList(state);
  if (!shortages.length) return;
  renderSupplyPlanner(shortages);
  window.setTimeout(() => {
    const dialog = byId("supplyPlannerDialog");
    if (dialog && !dialog.open) dialog.showModal();
  }, 120);
}

function stockStatus(product) {
  const stock = OrderEngine.inventory(product).available;
  const min = numeric(product.min, 0);
  if (stock <= 0) return { key: "empty", label: "Sin stock", tone: "danger" };
  if (stock < min) return { key: "critical", label: "Reponer", tone: "warn" };
  return { key: "ok", label: "OK", tone: "ok" };
}

function productSearchText(product) {
  return [
    product.codigo_producto,
    product.codigo_barras,
    product.name,
    product.rubro,
    product.marca,
    product.familia,
    product.segmento,
    product.bultos
  ].join(" ");
}

function getFilteredStockProducts() {
  const terms = normalizeSearchText(stockSearchTerm).split(/\s+/).filter(Boolean);
  return state.products.filter((product) => {
    const matchesText = !terms.length || matchesSearch(productSearchText(product), terms);
    const status = stockStatus(product);
    const matchesStatus = stockStatusFilter === "all" || status.key === stockStatusFilter;
    const matchesRubric = stockRubricFilter === "all" || product.rubro === stockRubricFilter;
    const matchesBrand = stockBrandFilter === "all" || product.marca === stockBrandFilter;
    return matchesText && matchesStatus && matchesRubric && matchesBrand;
  });
}

function renderStockProductOptions() {
  const list = byId("stockProductOptions");
  if (!list) return;
  const terms = normalizeSearchText(stockSearchTerm).split(/\s+/).filter(Boolean);
  const products = state.products
    .filter((product) => !terms.length || matchesSearch(productSearchText(product), terms))
    .slice(0, 80);
  list.innerHTML = products.map((product) => `
    <option value="${escapeHtml(product.name)}">${escapeHtml(`${product.codigo_producto || "S/C"} - ${product.rubro || "S/R"} - disponible ${OrderEngine.inventory(product).available}`)}</option>
  `).join("");
}

function buildStockOverview() {
  const products = state.products || [];
  const total = products.length;
  const empty = products.filter((product) => stockStatus(product).key === "empty").length;
  const critical = products.filter((product) => stockStatus(product).key === "critical").length;
  const ok = Math.max(0, total - empty - critical);
  const stockUnits = products.reduce((sum, product) => sum + OrderEngine.inventory(product).physical, 0);
  const reservedUnits = products.reduce((sum, product) => sum + OrderEngine.inventory(product).reserved, 0);
  const availableUnits = products.reduce((sum, product) => sum + OrderEngine.inventory(product).available, 0);
  const transitUnits = products.reduce((sum, product) => sum + OrderEngine.inventory(product).inTransit, 0);
  const stockValue = products.reduce((sum, product) => sum + OrderEngine.inventory(product).physical * numeric(product.cost, 0), 0);
  const priority = products.map((product) => {
    const shortage = Math.max(0, numeric(product.min, 0) - OrderEngine.inventory(product).available);
    return { product, shortage };
  }).filter((item) => item.shortage > 0)
    .sort((a, b) => b.shortage - a.shortage)
    .slice(0, 7);
  const valueByRubric = new Map();
  products.forEach((product) => {
    const rubric = product.rubro || "S/D";
    const value = OrderEngine.inventory(product).physical * numeric(product.cost, 0);
    valueByRubric.set(rubric, (valueByRubric.get(rubric) || 0) + value);
  });
  const rubricValues = [...valueByRubric.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  return { total, empty, critical, ok, stockUnits, reservedUnits, availableUnits, transitUnits, stockValue, priority, rubricValues };
}

function renderStockCharts() {
  const metrics = buildStockOverview();
  const kpis = byId("stockKpis");
  if (kpis) {
    kpis.innerHTML = [
      { label: "Fisico", value: metrics.stockUnits, hint: "Unidades en deposito" },
      { label: "Reservado", value: metrics.reservedUnits, hint: "Comprometido a pedidos" },
      { label: "Disponible", value: metrics.availableUnits, hint: "Vendible sin faltantes" },
      { label: "En transito", value: metrics.transitUnits, hint: "Comprado, aun no recibido" }
    ].map((item) => `
      <article class="stock-kpi">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
        <small>${escapeHtml(item.hint)}</small>
      </article>
    `).join("");
  }

  const donut = byId("stockStatusDonut");
  if (donut) {
    const total = Math.max(1, metrics.total);
    const okEnd = (metrics.ok / total) * 100;
    const criticalEnd = okEnd + (metrics.critical / total) * 100;
    donut.style.background = `conic-gradient(var(--ok) 0 ${okEnd}%, var(--warn) ${okEnd}% ${criticalEnd}%, var(--danger) ${criticalEnd}% 100%)`;
  }

  const legend = byId("stockStatusLegend");
  if (legend) {
    legend.innerHTML = [
      ["OK", metrics.ok, "ok"],
      ["Reponer", metrics.critical, "warn"],
      ["Sin stock", metrics.empty, "danger"]
    ].map(([label, value, tone]) => `
      <span><i class="tag ${tone}">${escapeHtml(label)}</i><strong>${value}</strong></span>
    `).join("");
  }

  renderStockBarChart("stockPriorityChart", metrics.priority.map((item) => [
    productDisplayName(item.product),
    item.shortage,
    `${item.shortage} u.`
  ]));
  renderStockBarChart("stockValueChart", metrics.rubricValues.map(([rubric, value]) => [
    rubric,
    value,
    money.format(value)
  ]));
}

function renderStockBarChart(elementId, rows) {
  const element = byId(elementId);
  if (!element) return;
  if (!rows.length) {
    element.innerHTML = '<p class="empty-note">Sin datos para graficar.</p>';
    return;
  }
  const max = Math.max(1, ...rows.map((row) => numeric(row[1], 0)));
  element.innerHTML = rows.map(([label, value, display]) => `
    <div class="stock-bar-row">
      <span title="${escapeHtml(label)}">${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar" style="width:${Math.max(4, Math.round((numeric(value, 0) / max) * 100))}%"></div></div>
      <strong>${escapeHtml(display)}</strong>
    </div>
  `).join("");
}

const PHYSICAL_STOCK_PRE_DISPATCH_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.READY,
  ORDER_STATUS.ASSEMBLY,
  ORDER_STATUS.LABELED,
  ORDER_STATUS.READY_DISPATCH
]);

const PHYSICAL_STOCK_BUCKETS = [
  { key: "committed", label: "Comprometida", statuses: [ORDER_STATUS.PENDING] },
  { key: "preparing", label: "Preparandose", statuses: [ORDER_STATUS.READY] },
  { key: "assembled", label: "Armada", statuses: [ORDER_STATUS.ASSEMBLY] },
  { key: "labeled", label: "Etiquetada", statuses: [ORDER_STATUS.LABELED] },
  { key: "readyDispatch", label: "Pte. Despacho", statuses: [ORDER_STATUS.READY_DISPATCH] }
];

function productInventoryKey(product) {
  return String(product && (product.codigo_producto || product.name || product.descripcion) || "").trim();
}

function productSupplierName(product) {
  return String(product && (product.proveedor || product.supplier || product.proveedor_principal || product.supplierName || "Sin proveedor") || "Sin proveedor").trim() || "Sin proveedor";
}

function productWarehouseName(product) {
  return String(product && (product.deposito || product.warehouse || product.almacen || "Deposito central") || "Deposito central").trim() || "Deposito central";
}

function orderItemMatchesProduct(item, product) {
  const productCode = productInventoryKey(product);
  const itemCode = String(item && (item.productCode || item.codigo_producto || item.code) || "").trim();
  if (productCode && itemCode && productCode === itemCode) return true;
  return normalizeSearchText(item && item.name) === normalizeSearchText(product && product.name);
}

function itemReservedForPhysicalStock(item) {
  const reserved = numeric(item && item.reservedQty, NaN);
  if (Number.isFinite(reserved) && reserved > 0) return reserved;
  return Math.max(0, numeric(item && (item.qty ?? item.requestedQty), 0) - numeric(item && item.missingQty, 0));
}

function physicalStockTraceForProduct(product) {
  return (state.orders || [])
    .filter((order) => order.inventoryMode === "reservation" && PHYSICAL_STOCK_PRE_DISPATCH_STATUSES.has(order.status))
    .flatMap((order) => (order.items || []).filter((item) => orderItemMatchesProduct(item, product)).map((item) => ({
      orderCode: order.code,
      client: order.client,
      status: order.status,
      seller: order.seller,
      date: formatOrderTime(order.createdAt || order.receivedAt || order.updatedAt),
      user: order.seller || order.source || "Preventa",
      qty: itemReservedForPhysicalStock(item),
      requestedQty: numeric(item.requestedQty ?? item.qty, 0)
    })))
    .filter((entry) => entry.qty > 0);
}

function physicalStockBreakdown(product) {
  const buckets = {
    committed: 0,
    preparing: 0,
    assembled: 0,
    labeled: 0,
    readyDispatch: 0
  };
  const traces = physicalStockTraceForProduct(product);
  traces.forEach((trace) => {
    const bucket = PHYSICAL_STOCK_BUCKETS.find((item) => item.statuses.includes(trace.status));
    if (bucket) buckets[bucket.key] += trace.qty;
  });
  return {
    ...buckets,
    totalPreDispatch: Object.values(buckets).reduce((sum, value) => sum + value, 0),
    traces
  };
}

function physicalStockCountDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function lastPhysicalStockCount(product) {
  const key = productInventoryKey(product);
  return (state.physicalStockCounts || [])
    .filter((entry) => String(entry.productCode || entry.product || "") === key || normalizeSearchText(entry.productName) === normalizeSearchText(product.name))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))[0] || null;
}

function physicalStockRow(product) {
  const inventory = OrderEngine.inventory(product);
  const breakdown = physicalStockBreakdown(product);
  const expected = inventory.available + breakdown.totalPreDispatch;
  const count = lastPhysicalStockCount(product);
  const counted = count ? numeric(count.countedQty, 0) : null;
  const difference = count ? counted - expected : null;
  const differencePercent = count && expected ? (difference / expected) * 100 : 0;
  return {
    product,
    code: productInventoryKey(product),
    name: product.name || product.descripcion || "",
    rubric: product.rubro || "S/D",
    brand: product.marca || "S/D",
    supplier: productSupplierName(product),
    warehouse: productWarehouseName(product),
    available: inventory.available,
    physical: inventory.physical,
    reserved: inventory.reserved,
    expected,
    difference,
    differencePercent,
    counted,
    count,
    ...breakdown
  };
}

function physicalStockRows(allProducts = state.products || []) {
  return allProducts.map(physicalStockRow);
}

function physicalStockSearchText(row) {
  return [
    row.code,
    row.name,
    row.rubric,
    row.brand,
    row.supplier,
    row.warehouse,
    row.product.codigo_barras,
    row.product.familia,
    row.product.segmento
  ].join(" ");
}

function filteredPhysicalStockRows() {
  const globalTerms = [];
  const localTerms = searchTerms(physicalStockSearchTerm);
  return physicalStockRows()
    .filter((row) => !globalTerms.length || matchesSearch(physicalStockSearchText(row), globalTerms))
    .filter((row) => !localTerms.length || matchesSearch(physicalStockSearchText(row), localTerms))
    .filter((row) => physicalStockRubricFilter === "all" || row.rubric === physicalStockRubricFilter)
    .filter((row) => physicalStockBrandFilter === "all" || row.brand === physicalStockBrandFilter)
    .filter((row) => physicalStockSupplierFilter === "all" || row.supplier === physicalStockSupplierFilter)
    .filter((row) => physicalStockWarehouseFilter === "all" || row.warehouse === physicalStockWarehouseFilter)
    .filter((row) => physicalStockUserFilter === "all" || (row.count && row.count.user === physicalStockUserFilter))
    .filter((row) => !physicalStockDateFilter || (row.count && physicalStockCountDate(row.count.at) === physicalStockDateFilter))
    .filter((row) => {
      if (physicalStockMode === "counted") return Boolean(row.count);
      if (physicalStockMode === "differences") return row.count && row.difference !== 0;
      if (physicalStockMode === "below-min") return row.available < numeric(row.product.min, 0);
      return true;
    });
}

function formatPhysicalDifference(row) {
  if (!row.count) return '<span class="muted">Sin conteo</span>';
  const tone = row.difference === 0 ? "ok" : "danger";
  const prefix = row.difference > 0 ? "+" : "";
  return `
    <span class="tag ${tone}">${prefix}${row.difference}</span>
    <small>Sistema ${row.expected} / Conteo ${row.counted} / ${row.differencePercent.toFixed(1)}%</small>
  `;
}

function renderPhysicalStockControl() {
  const kpis = byId("physicalStockKpis");
  const table = byId("physicalStockTable");
  if (!kpis || !table) return;
  const allRows = physicalStockRows();
  const rows = filteredPhysicalStockRows();
  physicalStockRubricFilter = updateDynamicFilter("physicalStockRubricFilter", allRows.map((row) => row.rubric), physicalStockRubricFilter, "Todos los rubros");
  physicalStockBrandFilter = updateDynamicFilter("physicalStockBrandFilter", allRows.map((row) => row.brand), physicalStockBrandFilter, "Todas las marcas");
  physicalStockSupplierFilter = updateDynamicFilter("physicalStockSupplierFilter", allRows.map((row) => row.supplier), physicalStockSupplierFilter, "Todos los proveedores");
  physicalStockWarehouseFilter = updateDynamicFilter("physicalStockWarehouseFilter", allRows.map((row) => row.warehouse), physicalStockWarehouseFilter, "Todos los depositos");
  physicalStockUserFilter = updateDynamicFilter("physicalStockUserFilter", (state.physicalStockCounts || []).map((entry) => entry.user), physicalStockUserFilter, "Todos los usuarios");

  const totals = allRows.reduce((acc, row) => {
    acc.available += row.available;
    acc.physical += row.expected;
    acc.reserved += row.totalPreDispatch;
    acc.preparing += row.preparing;
    acc.assembled += row.assembled;
    acc.readyDispatch += row.readyDispatch;
    if (row.count) {
      acc.counted += 1;
      if (row.difference !== 0) acc.differences += 1;
    }
    return acc;
  }, { available: 0, physical: 0, reserved: 0, preparing: 0, assembled: 0, readyDispatch: 0, counted: 0, differences: 0 });

  kpis.innerHTML = [
    { label: "Stock disponible", value: totals.available, hint: "Vendible hoy sin sobreventa" },
    { label: "Stock fisico", value: totals.physical, hint: "Disponible + no despachado" },
    { label: "Mercaderia comprometida", value: totals.reserved, hint: "Pedidos antes de despacho" },
    { label: "En preparacion", value: totals.preparing, hint: "Listos para deposito" },
    { label: "Armados", value: totals.assembled, hint: "Preparados fisicamente" },
    { label: "Listos despacho", value: totals.readyDispatch, hint: "Aun dentro del deposito" },
    { label: "Diferencias", value: totals.differences, hint: `${totals.counted} productos contados` }
  ].map((item) => `
    <article class="analytics-kpi">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.hint)}</small>
    </article>
  `).join("");

  table.innerHTML = rows.length ? rows.map((row) => `
    <tr data-physical-product="${escapeHtml(row.code)}">
      <td><strong>${escapeHtml(row.code || "S/C")}</strong><small>${escapeHtml(row.product.codigo_barras || "")}</small></td>
      <td><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(`${row.rubric} - ${row.brand} - ${row.supplier}`)}</small></td>
      <td><strong>${row.available}</strong></td>
      <td>${row.committed}</td>
      <td>${row.preparing}</td>
      <td>${row.assembled}</td>
      <td>${row.labeled}</td>
      <td>${row.readyDispatch}</td>
      <td><strong>${row.expected}</strong><small>Fisico motor ${row.physical}</small></td>
      <td>
        ${physicalStockCountMode ? `
          <div class="count-inline">
            <input type="number" min="0" step="1" value="${row.counted ?? ""}" placeholder="Conteo" data-physical-count="${escapeHtml(row.code)}">
            <input type="text" value="${escapeHtml(row.count?.observation || "")}" placeholder="Observacion" data-physical-note="${escapeHtml(row.code)}">
            <button class="mini-btn" type="button" data-save-physical-count="${escapeHtml(row.code)}">Guardar</button>
          </div>
        ` : formatPhysicalDifference(row)}
      </td>
      <td>
        <button class="mini-btn" type="button" data-view-physical-trace="${escapeHtml(row.code)}">Trazar</button>
        ${row.count && row.difference !== 0 ? `<button class="mini-btn danger-btn" type="button" data-adjust-physical-stock="${escapeHtml(row.code)}">Ajustar</button>` : ""}
      </td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="11">No hay productos para los filtros seleccionados.</td></tr>';

  renderPhysicalStockTrace(rows[0] || null);
  renderPhysicalStockHistory();
}

function renderPhysicalStockTrace(row) {
  const list = byId("physicalStockTraceList");
  if (!list) return;
  const selectedRow = row || filteredPhysicalStockRows()[0] || null;
  if (!selectedRow) {
    list.innerHTML = '<article class="activity"><span class="tag warn">Sin seleccion</span><strong>Elegir producto</strong><p>Seleccionar Trazar para ver pedidos asociados.</p></article>';
    return;
  }
  list.innerHTML = selectedRow.traces.length ? selectedRow.traces.map((trace) => `
    <article class="activity">
      <span class="tag ${orderStatusClass(trace.status)}">${escapeHtml(trace.status)}</span>
      <strong>${escapeHtml(`${trace.orderCode} - ${trace.client}`)}</strong>
      <p>${trace.qty} unidades reservadas. Vendedor/usuario: ${escapeHtml(trace.user)}.</p>
      <small>${escapeHtml(trace.date)}</small>
    </article>
  `).join("") : `
    <article class="activity">
      <span class="tag ok">Libre</span>
      <strong>${escapeHtml(selectedRow.name)}</strong>
      <p>No tiene mercaderia reservada antes de despacho.</p>
    </article>
  `;
}

function renderPhysicalStockHistory() {
  const list = byId("physicalStockHistoryList");
  if (!list) return;
  const history = [
    ...(state.physicalStockAdjustments || []).map((entry) => ({ ...entry, kind: "Ajuste" })),
    ...(state.physicalStockCounts || []).map((entry) => ({ ...entry, kind: "Conteo" }))
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 30);
  list.innerHTML = history.length ? history.map((entry) => `
    <article class="activity">
      <span class="tag ${entry.kind === "Ajuste" ? "warn" : (numeric(entry.difference, 0) ? "danger" : "ok")}">${escapeHtml(entry.kind)}</span>
      <strong>${escapeHtml(entry.productName || entry.productCode || "Producto")}</strong>
      <p>${entry.kind === "Ajuste"
        ? `Stock ${entry.previousStock} -> ${entry.newStock}. Motivo: ${entry.reason || "Sin motivo"}`
        : `Sistema ${entry.expectedQty}, conteo ${entry.countedQty}, diferencia ${entry.difference}. ${entry.observation || ""}`}</p>
      <small>${escapeHtml(`${formatOrderTime(entry.at)} - ${entry.user || "Sistema"}`)}</small>
    </article>
  `).join("") : '<article class="activity"><span class="tag warn">Sin historial</span><strong>No hay cortes registrados</strong><p>Iniciar un corte de stock para comenzar a auditar diferencias.</p></article>';
}

function physicalStockReportRows() {
  let rows = physicalStockReportType === "complete" ? physicalStockRows() : filteredPhysicalStockRows();
  if (physicalStockReportType === "differences") rows = rows.filter((row) => row.count && row.difference !== 0);
  if (physicalStockReportType === "top-differences") rows = rows.filter((row) => row.count).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)).slice(0, 50);
  if (physicalStockReportType === "rubric") rows = rows.sort((a, b) => `${a.rubric}${a.name}`.localeCompare(`${b.rubric}${b.name}`));
  return rows;
}

function exportPhysicalStockCsv() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar inventario fisico.");
    return;
  }
  const headers = ["codigo", "producto", "rubro", "marca", "proveedor", "deposito", "disponible", "comprometida", "preparandose", "armada", "etiquetada", "pendiente_despacho", "fisico_esperado", "conteo", "diferencia", "porcentaje", "usuario_conteo", "fecha_conteo"];
  const rows = physicalStockReportRows().map((row) => ({
    codigo: row.code,
    producto: row.name,
    rubro: row.rubric,
    marca: row.brand,
    proveedor: row.supplier,
    deposito: row.warehouse,
    disponible: row.available,
    comprometida: row.committed,
    preparandose: row.preparing,
    armada: row.assembled,
    etiquetada: row.labeled,
    pendiente_despacho: row.readyDispatch,
    fisico_esperado: row.expected,
    conteo: row.counted ?? "",
    diferencia: row.count ? row.difference : "",
    porcentaje: row.count ? row.differencePercent.toFixed(2) : "",
    usuario_conteo: row.count?.user || "",
    fecha_conteo: row.count ? formatOrderTime(row.count.at) : ""
  }));
  if (physicalStockReportType === "adjustments") {
    const adjustmentHeaders = ["producto", "stock_anterior", "stock_nuevo", "motivo", "usuario", "fecha"];
    const csv = [
      adjustmentHeaders.join(","),
      ...(state.physicalStockAdjustments || []).map((entry) => adjustmentHeaders.map((key) => csvCell({
        producto: entry.productName,
        stock_anterior: entry.previousStock,
        stock_nuevo: entry.newStock,
        motivo: entry.reason,
        usuario: entry.user,
        fecha: formatOrderTime(entry.at)
      }[key])).join(","))
    ].join("\r\n");
    downloadBlob(`ajustes-stock-fisico-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
    return;
  }
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))
  ].join("\r\n");
  downloadBlob(`control-stock-fisico-${safeFilePart(physicalStockReportType)}-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function exportPhysicalStockPdf() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar inventario fisico.");
    return;
  }
  const lines = physicalStockReportType === "adjustments"
    ? (state.physicalStockAdjustments || []).map((entry) => `${entry.productName} | ${entry.previousStock} -> ${entry.newStock} | ${entry.user} | ${formatOrderTime(entry.at)} | ${entry.reason || ""}`)
    : physicalStockReportRows().map((row) => `${row.code || "S/C"} | ${row.name} | Disp ${row.available} | Comp ${row.totalPreDispatch} | Fisico ${row.expected} | Conteo ${row.counted ?? "-"} | Dif ${row.count ? row.difference : "-"}`);
  downloadBlob(`control-stock-fisico-${safeFilePart(physicalStockReportType)}-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Control de Stock Fisico", lines));
}

function findPhysicalStockInput(attributeName, productCode) {
  return Array.from(document.querySelectorAll(`[${attributeName}]`))
    .find((input) => String(input.getAttribute(attributeName) || "") === String(productCode || "")) || null;
}

function recordPhysicalStockCount(productCode) {
  const row = physicalStockRows().find((item) => item.code === productCode);
  if (!row) return;
  const qtyInput = findPhysicalStockInput("data-physical-count", productCode);
  const noteInput = findPhysicalStockInput("data-physical-note", productCode);
  const rawCount = String(qtyInput && qtyInput.value || "").trim();
  if (!rawCount) {
    window.alert("Ingresar cantidad fisica encontrada.");
    return;
  }
  const countedQty = Math.max(0, Math.floor(numeric(rawCount, NaN)));
  if (!Number.isFinite(countedQty)) {
    window.alert("Ingresar cantidad fisica encontrada.");
    return;
  }
  const at = new Date().toISOString();
  const entry = {
    id: `CNT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at,
    productCode: row.code,
    productName: row.name,
    expectedQty: row.expected,
    countedQty,
    difference: countedQty - row.expected,
    differencePercent: row.expected ? ((countedQty - row.expected) / row.expected) * 100 : 0,
    availableQty: row.available,
    reservedQty: row.totalPreDispatch,
    observation: String(noteInput && noteInput.value || "").trim(),
    user: currentUser ? currentUser.name : "Administracion",
    username: currentUser ? currentUser.username : ""
  };
  state.physicalStockCounts = Array.isArray(state.physicalStockCounts) ? state.physicalStockCounts : [];
  state.physicalStockCounts.unshift(entry);
  state.globalAudit = Array.isArray(state.globalAudit) ? state.globalAudit : [];
  state.globalAudit.unshift({
    id: `AUDG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    date: localTraceParts(at).date,
    time: localTraceParts(at).time,
    user: entry.user,
    username: entry.username,
    role: currentUser ? currentUser.role : "admin",
    ip: "",
    device: sessionDevicePayload ? sessionDevicePayload() : null,
    gps: null,
    action: "STOCK_FISICO_CONTEO",
    entityType: "producto",
    entityId: row.code,
    entityLabel: row.name,
    previousValue: { expectedQty: row.expected },
    newValue: entry,
    note: "Conteo fisico registrado sin modificar stock"
  });
  state.activity.unshift({ type: "Inventario", title: `${row.name} contado`, text: `Sistema ${row.expected}, conteo ${countedQty}, diferencia ${entry.difference}.` });
  saveState();
  renderForCurrentUser();
}

function openPhysicalStockAdjustDialog(productCode) {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede autorizar ajustes de stock fisico.");
    return;
  }
  const row = physicalStockRows().find((item) => item.code === productCode);
  if (!row || !row.count) {
    window.alert("Primero se debe guardar un conteo fisico con diferencia.");
    return;
  }
  physicalStockAdjustTargetCode = productCode;
  const safeNextStock = Math.max(row.totalPreDispatch, row.counted);
  byId("physicalStockAdjustTitle").textContent = `Autorizar ajuste - ${row.name}`;
  byId("physicalStockAdjustCode").value = productCode;
  byId("physicalStockAdjustPrevious").value = row.expected;
  byId("physicalStockAdjustNext").value = safeNextStock;
  byId("physicalStockAdjustReason").value = row.count.observation || "";
  byId("physicalStockAdjustPassword").value = "";
  byId("physicalStockAdjustMessage").textContent = row.counted < row.totalPreDispatch
    ? `El conteo (${row.counted}) es menor a lo reservado no despachado (${row.totalPreDispatch}). El ajuste no puede bajar de ${safeNextStock} sin resolver pedidos.`
    : "";
  byId("physicalStockAdjustDialog").showModal();
}

async function submitPhysicalStockAdjust(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const productCode = String(formData.get("product_code") || physicalStockAdjustTargetCode);
  const row = physicalStockRows().find((item) => item.code === productCode);
  if (!row || !row.count) return;
  const reason = String(formData.get("reason") || "").trim();
  const password = String(formData.get("admin_password") || "").trim();
  const message = byId("physicalStockAdjustMessage");
  if (!reason) {
    message.textContent = "Indicar motivo del ajuste.";
    return;
  }
  try {
    await reauthAdminPassword(password);
    const productIndex = state.products.findIndex((product) => productInventoryKey(product) === productCode);
    if (productIndex < 0) throw new Error("Producto no encontrado.");
    const previousProduct = structuredClone(state.products[productIndex]);
    const currentInventory = OrderEngine.inventory(state.products[productIndex]);
    const nextPhysical = Math.max(row.totalPreDispatch, row.counted);
    state.products[productIndex].stock_fisico = nextPhysical;
    state.products[productIndex].stock_actual = nextPhysical;
    state.products[productIndex].stock = nextPhysical;
    state.products[productIndex].stock_reservado = row.totalPreDispatch;
    state.products[productIndex] = normalizeProductRecord(state.products[productIndex]);
    const after = OrderEngine.inventory(state.products[productIndex]);
    const at = new Date().toISOString();
    const adjustment = {
      id: `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at,
      productCode,
      productName: row.name,
      previousStock: currentInventory.physical,
      newStock: after.physical,
      reason,
      user: currentUser ? currentUser.name : "Administracion",
      username: currentUser ? currentUser.username : "",
      countId: row.count.id || ""
    };
    state.physicalStockAdjustments = Array.isArray(state.physicalStockAdjustments) ? state.physicalStockAdjustments : [];
    state.physicalStockAdjustments.unshift(adjustment);
    state.stockMovements.unshift({
      type: "Ajuste fisico",
      title: row.name,
      text: `Stock fisico ${adjustment.previousStock} -> ${adjustment.newStock}. Motivo: ${reason}.`
    });
    state.globalAudit = Array.isArray(state.globalAudit) ? state.globalAudit : [];
    state.globalAudit.unshift({
      id: `AUDG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at,
      date: localTraceParts(at).date,
      time: localTraceParts(at).time,
      user: adjustment.user,
      username: adjustment.username,
      role: currentUser ? currentUser.role : "admin",
      ip: "",
      device: sessionDevicePayload ? sessionDevicePayload() : null,
      gps: null,
      action: "STOCK_FISICO_AJUSTE_AUTORIZADO",
      entityType: "producto",
      entityId: productCode,
      entityLabel: row.name,
      previousValue: previousProduct,
      newValue: state.products[productIndex],
      note: reason
    });
    state.activity.unshift({ type: "Inventario", title: `Ajuste fisico ${row.name}`, text: `${adjustment.user} autorizo stock ${adjustment.previousStock} -> ${adjustment.newStock}.` });
    saveState();
    renderForCurrentUser();
    byId("physicalStockAdjustDialog").close("default");
    showCompactNotice("Ajuste fisico autorizado y auditado.", "ok");
  } catch (error) {
    message.textContent = error.message || "No se pudo autorizar el ajuste.";
  }
}

function stockReportRows(products = getFilteredStockProducts()) {
  return products.map((product) => {
    const status = stockStatus(product);
    const inventory = OrderEngine.inventory(product);
    return {
      codigo: product.codigo_producto || "",
      barras: product.codigo_barras || "",
      producto: product.name || "",
      rubro: product.rubro || "",
      marca: product.marca || "",
      familia: product.familia || "",
      fisico: inventory.physical,
      reservado: inventory.reserved,
      disponible: inventory.available,
      transito: inventory.inTransit,
      minimo: numeric(product.min, 0),
      costo: numeric(product.cost, 0),
      precio: numeric(product.precio_lista_2 || product.price, 0),
      estado: status.label
    };
  });
}

function reportDateStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function safeFilePart(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "corte";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadBlob(filename, blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportStockCsv() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar stock.");
    return;
  }
  const rows = stockReportRows();
  const headers = ["codigo", "barras", "producto", "rubro", "marca", "familia", "fisico", "reservado", "disponible", "transito", "minimo", "costo", "precio", "estado"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))
  ].join("\r\n");
  downloadBlob(`stock-distribuidora-lopez-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function pdfEscape(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function utf8Length(value) {
  return new TextEncoder().encode(String(value)).length;
}

function makeSimplePdf(title, lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const lineHeight = 13;
  const maxLines = 54;
  const brandedLines = [
    `Cliente: Distribuidora Lopez`,
    `Desarrollado por: ${DEVELOPER_BRAND.name}`,
    "",
    ...(Array.isArray(lines) ? lines : []),
    "",
    `Documento generado automaticamente por el Sistema de Gestion desarrollado por ${DEVELOPER_BRAND.name}.`
  ];
  const pages = [];
  for (let i = 0; i < brandedLines.length; i += maxLines) {
    pages.push(brandedLines.slice(i, i + maxLines));
  }
  if (!pages.length) pages.push(["Sin productos para el filtro seleccionado."]);

  const objects = ["", "", ""];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const pageRefs = [];
  pages.forEach((pageLines, pageIndex) => {
    const content = [
      "BT",
      "/F1 15 Tf",
      `${margin} ${pageHeight - margin} Td`,
      `(${pdfEscape(title)}) Tj`,
      "0 -18 Td",
      "/F1 9 Tf",
      `(${pdfEscape(`Fecha ${new Date().toLocaleString("es-AR")} - Pagina ${pageIndex + 1}/${pages.length} - Version ${APP_VERSION}`)}) Tj`,
      "0 -18 Td",
      "/F1 8 Tf",
      ...pageLines.flatMap((line) => [`(${pdfEscape(line).slice(0, 128)}) Tj`, `0 -${lineHeight} Td`]),
      "ET"
    ].join("\n");
    const contentRef = addObject(`<< /Length ${utf8Length(content)} >>\nstream\n${content}\nendstream`);
    const pageRef = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentRef} 0 R >>`);
    pageRefs.push(pageRef);
  });

  const catalogRef = 1;
  const pagesRef = 2;
  objects[0] = `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(utf8Length(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = utf8Length(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function exportStockPdf() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar stock.");
    return;
  }
  const lines = stockReportRows().map((row) => (
    `${row.codigo || "S/C"} | ${row.producto} | Fisico ${row.fisico} | Reservado ${row.reservado} | Disponible ${row.disponible} | Transito ${row.transito} | Min ${row.minimo} | ${row.estado}`
  ));
  downloadBlob(`stock-distribuidora-lopez-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Reporte de stock", lines));
}

function orderStageByKey(stageKey) {
  return ORDER_DASHBOARD_STAGES.find((stage) => stage.key === stageKey)
    || ORDER_PIPELINE_STAGES.find((stage) => stage.key === stageKey)
    || null;
}

function orderStageOrders(stage) {
  if (!stage) return [];
  return state.orders
    .filter((order) => stage.statuses.includes(order.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function exportOrderStagePdf(stageKey) {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede emitir cortes de pedidos.");
    return;
  }
  const stage = orderStageByKey(stageKey);
  if (!stage) return;
  const orders = orderStageOrders(stage);
  const totalAmount = orders.reduce((total, order) => total + numeric(order.amount, 0), 0);
  const generatedAt = new Date().toLocaleString("es-AR");
  const lines = [
    `Corte: ${stage.label}`,
    `Fecha de emision: ${generatedAt}`,
    `Estados incluidos: ${stage.statuses.join(", ")}`,
    `Cantidad de pedidos: ${orders.length}`,
    `Importe total: ${money.format(totalAmount)}`,
    "",
    "Codigo | Cliente | Vendedor | Importe | Estado | Demora | Prioridad",
    "-".repeat(118),
    ...orders.map((order) => {
      const delay = orderDelayInfo(order);
      const priority = orderPriorityInfo(order);
      return `${order.code} | ${order.client} | ${order.seller} | ${money.format(order.amount)} | ${order.status} | ${delay.label} | ${priority.label}`;
    }),
    "",
    "Detalle de productos",
    "-".repeat(118),
    ...orders.map((order) => `${order.code} | ${order.products || "Sin detalle de productos"}`)
  ];
  if (!orders.length) {
    lines.push("", `Sin pedidos en estado ${stage.label} al momento del corte.`);
  }
  downloadBlob(
    `corte-pedidos-${safeFilePart(stage.label)}-${reportDateStamp()}.pdf`,
    makeSimplePdf(`Distribuidora Lopez - Corte ${stage.label}`, lines)
  );
}

async function printStockReport() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede imprimir stock.");
    return;
  }
  const button = byId("printStockBtn");
  const previousText = button ? button.textContent : "";
  if (button) {
    button.disabled = true;
    button.textContent = "Enviando...";
  }
  try {
    const response = await fetchWithTimeout(apiUrl("api/admin/print-stock"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        searchTerm: stockSearchTerm,
        statusFilter: stockStatusFilter,
        rubricFilter: stockRubricFilter,
        brandFilter: stockBrandFilter
      })
    }, 30000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(payload.error || "No se pudo imprimir el reporte de stock.");
      return;
    }
    window.alert(payload.message || "Reporte enviado a la impresora.");
  } catch {
    window.alert("No se pudo conectar con el servidor para imprimir.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText || "Imprimir";
    }
  }
}

function setStockEditMessage(text, tone = "danger") {
  const message = byId("stockEditMessage");
  if (!message) return;
  message.textContent = text || "";
  if (text) {
    message.dataset.tone = tone;
  } else {
    delete message.dataset.tone;
  }
}

function setStockEditBusy(isBusy) {
  const button = byId("stockEditSaveBtn");
  if (!button) return;
  button.disabled = Boolean(isBusy);
  button.textContent = isBusy ? "Validando..." : "Validar y guardar";
}

function openStockEditDialog(productName) {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede modificar productos.");
    return;
  }
  const product = state.products.find((item) => item.name === productName);
  if (!product) return;
  stockEditTargetName = product.name;
  const dialog = byId("stockEditDialog");
  const form = byId("stockEditForm");
  form.reset();
  byId("stockEditAdminName").value = currentUser ? `${currentUser.name} (${currentUser.username})` : "Administrador";
  form.elements.original_name.value = product.name;
  form.elements.codigo_producto.value = product.codigo_producto || "";
  form.elements.codigo_barras.value = product.codigo_barras || "";
  form.elements.descripcion.value = product.name || "";
  form.elements.rubro.value = product.rubro || "";
  form.elements.marca.value = product.marca || "";
  form.elements.familia.value = product.familia || "";
  form.elements.segmento.value = product.segmento || "";
  form.elements.stock_actual.value = numeric(product.stock, 0);
  form.elements.stock_minimo.value = numeric(product.min, 0);
  form.elements.bultos.value = product.bultos || "";
  form.elements.costo.value = numeric(product.cost, 0);
  hydratePriceListEditor(form, product);
  form.elements.iva.value = numeric(product.iva, 0);
  form.elements.bonificacion.value = product.bonificacion || "";
  form.elements.activo.value = product.activo || "SI";
  setStockEditMessage("");
  dialog.showModal();
}

async function reauthAdminPassword(password) {
  const response = await fetchWithTimeout(apiUrl("api/admin/reauth"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "No se pudo validar la clave de administrador.");
  }
  return payload;
}

async function submitStockEdit(event) {
  event.preventDefault();
  if (!isAdminUser()) {
    setStockEditMessage("Operacion permitida solo para administradores.");
    return;
  }
  const form = event.currentTarget;
  const formData = new FormData(form);
  const originalName = String(formData.get("original_name") || stockEditTargetName);
  const index = state.products.findIndex((product) => product.name === originalName);
  if (index < 0) {
    setStockEditMessage("No se encontro el producto original.");
    return;
  }
  const nextName = String(formData.get("descripcion") || "").trim();
  const nextCode = String(formData.get("codigo_producto") || "").trim();
  if (!nextName || !nextCode) {
    setStockEditMessage("Codigo y descripcion son obligatorios.");
    return;
  }
  if (state.products.some((product, productIndex) => productIndex !== index && product.name.toLowerCase() === nextName.toLowerCase())) {
    setStockEditMessage("Ya existe otro producto con esa descripcion.");
    return;
  }
  if (state.products.some((product, productIndex) => productIndex !== index && String(product.codigo_producto || "") === nextCode)) {
    setStockEditMessage("Ya existe otro producto con ese codigo.");
    return;
  }
  const requestedPhysical = Math.max(0, Number(formData.get("stock_actual") || 0));
  const currentInventory = OrderEngine.inventory(state.products[index]);
  if (requestedPhysical < currentInventory.reserved) {
    setStockEditMessage(`El stock fisico no puede quedar debajo de las ${currentInventory.reserved} unidades reservadas.`);
    return;
  }

  setStockEditBusy(true);
  setStockEditMessage("Validando clave de administrador...", "info");
  try {
    await reauthAdminPassword(formData.get("admin_password"));
    const previous = state.products[index];
    const next = normalizeProductRecord({
      codigo_producto: nextCode,
      codigo_barras: String(formData.get("codigo_barras") || "").trim(),
      descripcion: nextName,
      rubro: String(formData.get("rubro") || "").trim(),
      marca: String(formData.get("marca") || "").trim(),
      familia: String(formData.get("familia") || "").trim(),
      segmento: String(formData.get("segmento") || "").trim(),
      stock_fisico: requestedPhysical,
      stock_actual: requestedPhysical,
      stock_reservado: currentInventory.reserved,
      stock_en_transito: currentInventory.inTransit,
      stock_minimo: Math.max(0, Number(formData.get("stock_minimo") || 0)),
      bultos: String(formData.get("bultos") || "").trim(),
      costo: Math.max(0, Number(formData.get("costo") || 0)),
      precio_lista_1: Math.max(0, Number(formData.get("precio_lista_1") || 0)),
      precio_lista_2: Math.max(0, Number(formData.get("precio_lista_2") || 0)),
      precio_lista_3: Math.max(0, Number(formData.get("precio_lista_3") || 0)),
      precio_lista_4: Math.max(0, Number(formData.get("precio_lista_4") || 0)),
      precio_lista_5: Math.max(0, Number(formData.get("precio_lista_5") || 0)),
      iva: Math.max(0, Number(formData.get("iva") || 0)),
      bonificacion: String(formData.get("bonificacion") || "").trim(),
      activo: String(formData.get("activo") || "SI"),
      origen: previous.origen || "manual"
    });
    next.updated_by = currentUser.username;
    next.updated_at = new Date().toISOString();
    state.products[index] = next;
    const auditRows = priceListAuditEntries(previous, next, String(formData.get("motive") || "Edicion administrativa de producto"));
    if (auditRows.length) {
      state.priceListAudit = Array.isArray(state.priceListAudit) ? state.priceListAudit : [];
      state.priceListAudit.unshift(...auditRows);
      state.priceListAudit = state.priceListAudit.slice(0, 10000);
    }
    state.orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.productCode === previous.codigo_producto || item.name === previous.name) {
          item.productCode = next.codigo_producto;
          item.name = next.name;
        }
      });
      if (order.items && order.items.length) order.products = OrderEngine.formatItems(order.items);
    });
    if (mobileProduct === previous.name) mobileProduct = next.name;
    const completedOrders = OrderEngine.allocatePendingOrders(state, currentUser ? currentUser.name : "Stock");
    const afterInventory = OrderEngine.inventory(state.products[index]);
    state.stockMovements.unshift({
      type: "Edicion",
      title: next.name,
      text: `${currentUser.name} modifico ficha del producto. Stock ${previous.stock} -> ${afterInventory.physical}. Reservado ${afterInventory.reserved}.`
    });
    state.activity.unshift({
      type: "Stock",
      title: "Producto modificado con revalidacion admin",
      text: completedOrders.length
        ? `${currentUser.name} actualizo ${next.name}. Pedidos completos para armado: ${completedOrders.join(", ")}.`
        : `${currentUser.name} actualizo ${next.name}.`
    });
    saveState();
    renderForCurrentUser();
    byId("stockEditDialog").close("default");
    if (completedOrders.length) {
      showCompactNotice(`Stock actualizado. Completos: ${completedOrders.join(", ")}.`, "ok");
    }
    openSupplyPlannerIfPending();
  } catch (error) {
    setStockEditMessage(error && error.message ? error.message : "No se pudo guardar el producto.");
  } finally {
    setStockEditBusy(false);
  }
}

function sameSupplierName(left, right) {
  return normalizeSearchText(left) === normalizeSearchText(right);
}

function supplierMovementStatusLabel(movement) {
  if (!movement) return "Movimiento";
  if (movement.paymentStatus || movement.status && String(movement.type || "") === "Pago proveedor") {
    return movement.paymentStatus || movement.status;
  }
  if (movement.adminValidationStatus) return movement.adminValidationStatus;
  if (movement.type === "Remito") return movement.economicValidated ? "Validado por administracion" : "Pendiente de Validacion";
  return movement.type || "Movimiento";
}

function supplierMovementStatusClass(movement) {
  const status = normalizeSearchText(supplierMovementStatusLabel(movement));
  if (status.includes("pendiente")) return "warn";
  if (status.includes("observ")) return "danger";
  if (status.includes("validado") || status.includes("conciliado") || status.includes("ingresado")) return "ok";
  return movement && movement.type === "Pago proveedor" ? "info" : "warn";
}

function supplierMovementDescription(movement) {
  if (!movement) return "";
  const base = movement.text || movement.note || movement.remitNumber || movement.id || "";
  const detail = [];
  if (movement.invoiceNumber) detail.push(`Factura ${movement.invoiceNumber}`);
  if (movement.stockStatus) detail.push(`Stock: ${movement.stockStatus}`);
  if (movement.differences) detail.push(`Diferencias: ${movement.differences}`);
  if (movement.adminObservations) detail.push(`Obs. admin: ${movement.adminObservations}`);
  if (movement.method) detail.push(`Medio: ${movement.method}`);
  if (movement.bank) detail.push(`Banco: ${movement.bank}`);
  if (movement.operationNumber) detail.push(`Operacion: ${movement.operationNumber}`);
  return [base, ...detail].filter(Boolean).join(" | ");
}

function supplierAccountEntries(supplierName) {
  return (state.accounts || [])
    .filter((entry) => sameSupplierName(entry.account, supplierName))
    .filter((entry) => /proveedor|remito/i.test(`${entry.type || ""} ${entry.method || ""}`))
    .sort((a, b) => new Date(b.at || b.date || 0) - new Date(a.at || a.date || 0));
}

function renderSupplierAccountPanel() {
  const select = byId("supplierAccountSelect");
  if (!select) return;
  const suppliers = state.suppliers || [];
  if (!suppliers.length) {
    select.innerHTML = '<option value="">Sin proveedores</option>';
    byId("supplierAccountSummary").innerHTML = "";
    byId("supplierAccountTable").innerHTML = '<tr><td class="stock-empty" colspan="6">No hay proveedores cargados.</td></tr>';
    return;
  }
  if (!selectedSupplierAccountName || !suppliers.some((supplier) => sameSupplierName(supplier.name, selectedSupplierAccountName))) {
    selectedSupplierAccountName = suppliers[0].name;
  }
  select.innerHTML = suppliers.map((supplier) => `
    <option value="${escapeHtml(supplier.name)}" ${sameSupplierName(supplier.name, selectedSupplierAccountName) ? "selected" : ""}>${escapeHtml(supplier.name)}</option>
  `).join("");
  const supplier = suppliers.find((item) => sameSupplierName(item.name, selectedSupplierAccountName)) || suppliers[0];
  const entries = supplierAccountEntries(supplier.name);
  byId("supplierAccountSummary").innerHTML = [
    { label: "Saldo actual", value: money.format(supplier.balance), hint: supplier.status || "Cuenta proveedor" },
    { label: "Comprado", value: money.format(supplier.totalPurchased), hint: "Remitos validados" },
    { label: "Pagado", value: money.format(supplier.totalPaid), hint: "Pagos conciliados" },
    { label: "Movimientos", value: entries.length, hint: "Historial proveedor" }
  ].map((item) => `
    <article class="analytics-kpi">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.value))}</strong>
      <small>${escapeHtml(item.hint)}</small>
    </article>
  `).join("");
  byId("supplierAccountTable").innerHTML = entries.length ? entries.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.date || formatOrderTime(entry.at))}</td>
      <td><strong>${escapeHtml(entry.type || "")}</strong></td>
      <td>${escapeHtml(entry.method || "")}</td>
      <td>${money.format(entry.debit || 0)}</td>
      <td>${money.format(entry.credit || 0)}</td>
      <td>${money.format(entry.balance || 0)}</td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="6">Sin movimientos conciliados para este proveedor.</td></tr>';
}

function renderSuppliers() {
  const globalTerms = [];
  const localTerms = searchTerms(supplierSearchTerm);
  supplierStatusFilter = updateDynamicFilter("suppliersStatusFilter", state.suppliers.map((supplier) => supplier.status), supplierStatusFilter, "Todos los estados");
  supplierSectorFilter = updateDynamicFilter("suppliersSectorFilter", state.suppliers.map((supplier) => supplier.sector), supplierSectorFilter, "Todos los rubros");
  const suppliers = state.suppliers.filter((supplier) => {
    const text = [
      supplier.name,
      supplier.cuit,
      supplier.contact,
      supplier.email,
      supplier.telefono,
      supplier.condicion_pago,
      supplier.sector,
      supplier.balance,
      supplier.due,
      supplier.status
    ].join(" ");
    const matchesGlobal = !globalTerms.length || matchesSearch(text, globalTerms);
    const matchesLocal = !localTerms.length || matchesSearch(text, localTerms);
    const matchesStatus = supplierStatusFilter === "all" || supplier.status === supplierStatusFilter;
    const matchesSector = supplierSectorFilter === "all" || supplier.sector === supplierSectorFilter;
    return matchesGlobal && matchesLocal && matchesStatus && matchesSector;
  });

  const summary = byId("suppliersSummary");
  if (summary) {
    const totalPurchased = state.suppliers.reduce((sum, supplier) => sum + numeric(supplier.totalPurchased, 0), 0);
    const totalPaid = state.suppliers.reduce((sum, supplier) => sum + numeric(supplier.totalPaid, 0), 0);
    const pending = state.suppliers.reduce((sum, supplier) => sum + numeric(supplier.balance, 0), 0);
    const overdue = state.suppliers.reduce((sum, supplier) => sum + numeric(supplier.overdueDebt, 0), 0);
    const mixedCount = buildMixedEntities().length;
    summary.innerHTML = [
      { label: "Total comprado", value: money.format(totalPurchased), hint: "Remitos/facturas cargadas" },
      { label: "Total pagado", value: money.format(totalPaid), hint: "Pagos registrados" },
      { label: "Saldo pendiente", value: money.format(pending), hint: "Cuenta proveedor" },
      { label: "Deuda vencida", value: money.format(overdue), hint: "Vencimientos a revisar" },
      { label: "Entidades mixtas", value: String(mixedCount), hint: "Cliente y proveedor unidos por CUIT/nombre" }
    ].map((item) => `
      <article class="analytics-kpi">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
        <small>${escapeHtml(item.hint)}</small>
      </article>
    `).join("");
  }

  byId("suppliersTable").innerHTML = suppliers.length ? suppliers.map((supplier) => {
    const mixedEntity = mixedEntityForSupplier(supplier);
    return `
    <tr>
      <td><strong>${escapeHtml(supplier.name)}</strong>${mixedEntity ? '<small><span class="tag info">Tambien cliente</span></small>' : ""}</td>
      <td><strong>${escapeHtml(supplier.cuit || "Sin CUIT")}</strong><small>${escapeHtml(supplier.condicion_pago || "Sin condicion")}</small></td>
      <td>${escapeHtml(supplier.contact)}</td>
      <td>${escapeHtml(supplier.sector)}</td>
      <td>${money.format(supplier.balance)}</td>
      <td><strong>${money.format(supplier.totalPurchased)}</strong><small>Pagado ${money.format(supplier.totalPaid)}</small></td>
      <td>${escapeHtml(supplier.due)}</td>
      <td><span class="tag ${supplierStatusClass(supplier.status)}">${escapeHtml(supplier.status)}</span></td>
      <td>
        <button class="mini-btn" type="button" data-supplier-account="${escapeHtml(supplier.name)}">Cuenta</button>
        <button class="mini-btn primary-mini" type="button" data-supplier-payment="${escapeHtml(supplier.name)}">Pago</button>
        ${mixedEntity ? `<button class="mini-btn" type="button" data-mixed-entity="${escapeHtml(mixedEntity.key)}">Ficha mixta</button>` : ""}
      </td>
    </tr>
  `;
  }).join("") : '<tr><td class="stock-empty" colspan="9">No hay proveedores para los filtros seleccionados.</td></tr>';

  renderSupplierAccountPanel();

  const rawMovements = [
    ...(state.supplierMovements || []),
    ...state.suppliers.flatMap((supplier) => (supplier.movements || []).map((movement) => ({ supplier: supplier.name, ...movement })))
  ];
  const movementMap = new Map();
  rawMovements.forEach((movement, index) => {
    const key = movement.id || `${movement.type || "mov"}-${movement.supplier || ""}-${movement.remitNumber || ""}-${movement.date || ""}-${index}`;
    if (!movementMap.has(key)) movementMap.set(key, movement);
  });
  const movements = Array.from(movementMap.values())
    .sort((a, b) => new Date(b.at || b.date || 0) - new Date(a.at || a.date || 0))
    .slice(0, 40);
  const movementList = byId("supplierMovementsList");
  if (movementList) {
    movementList.innerHTML = movements.length ? movements.map((movement) => `
      <article class="activity">
        <span class="tag ${supplierMovementStatusClass(movement)}">${escapeHtml(supplierMovementStatusLabel(movement))}</span>
        <strong>${escapeHtml(movement.supplier || movement.proveedor || "Proveedor")}</strong>
        <p>${escapeHtml(supplierMovementDescription(movement))}</p>
        ${movement.upload && movement.upload.url ? `<a href="${escapeHtml(movement.upload.url)}" target="_blank" rel="noopener">Ver adjunto</a>` : ""}
        ${movement.invoiceUpload && movement.invoiceUpload.url ? `<a href="${escapeHtml(movement.invoiceUpload.url)}" target="_blank" rel="noopener">Ver factura</a>` : ""}
        ${isAdminUser() && movement.type === "Remito" && normalizeSearchText(supplierMovementStatusLabel(movement)).includes("pendiente") ? `<button class="mini-btn primary-mini" type="button" data-supplier-remit-validate="${escapeHtml(movement.id)}">Conciliar remito</button>` : ""}
        ${isAdminUser() && movement.type === "Pago proveedor" && normalizeSearchText(supplierMovementStatusLabel(movement)).includes("pendiente") ? `<button class="mini-btn primary-mini" type="button" data-supplier-payment-reconcile="${escapeHtml(movement.id)}">Conciliar pago</button>` : ""}
        <small>${escapeHtml(movement.date || formatOrderTime(movement.at))} - ${money.format(movement.amount || movement.declaredAmount || 0)}</small>
      </article>
    `).join("") : '<article class="activity"><span class="tag ok">Sin movimientos</span><strong>Cuenta proveedores limpia</strong><p>No hay remitos o pagos cargados todavia.</p></article>';
  }
}

function setSupplierRemitMessage(text, tone = "danger") {
  const message = byId("supplierRemitMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

function setSupplierRemitValidationMessage(text, tone = "danger") {
  const message = byId("supplierRemitValidationMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

function setSupplierPaymentMessage(text, tone = "danger") {
  const message = byId("supplierPaymentMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

function supplierRemitSearchText(product) {
  return normalizeSearchText([
    product.name,
    product.descripcion,
    product.codigo_producto,
    product.codigo_barras,
    product.rubro,
    product.marca,
    product.familia,
    product.segmento,
    product.proveedor,
    product.supplier,
    product.nomenclador,
    product.codigo_interno
  ].filter(Boolean).join(" "));
}

function populateSupplierRemitProductOptions() {
  const select = byId("supplierRemitProductSearch");
  if (!select) return;
  select.innerHTML = [
    '<option value="">Seleccionar producto del inventario</option>',
    ...state.products.map((product) => {
    const code = product.codigo_producto || product.codigo_barras || "";
    const label = `${product.name}${code ? ` - ${code}` : ""}${product.rubro ? ` - ${product.rubro}` : ""}`;
      const value = product.codigo_producto || product.codigo_barras || product.name;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    })
  ].join("");
}

function resolveSupplierRemitProduct(query) {
  const text = normalizeSearchText(query);
  if (!text) return null;
  return state.products.find((product) => normalizeSearchText(product.codigo_producto) === text)
    || state.products.find((product) => normalizeSearchText(product.codigo_barras) === text)
    || state.products.find((product) => normalizeSearchText(product.name) === text)
    || state.products.find((product) => supplierRemitSearchText(product).includes(text))
    || null;
}

function updateSupplierRemitSubtotal() {
  const qty = Math.max(0, numeric(byId("supplierRemitQty").value, 0));
  const unitPrice = Math.max(0, numeric(byId("supplierRemitUnitPrice").value, 0));
  const subtotal = Math.round(qty * unitPrice * 100) / 100;
  byId("supplierRemitSubtotal").textContent = money.format(subtotal);
}

function updateSupplierRemitAmountFromItems() {
  const total = supplierRemitItems.reduce((sum, item) => sum + numeric(item.subtotal, 0), 0);
  byId("supplierRemitAmount").value = String(Math.round(total * 100) / 100);
}

function isSupplierReceiverMode() {
  const dialog = byId("supplierRemitDialog");
  return Boolean(dialog && dialog.dataset.receiverMode === "true");
}

function configureSupplierRemitDialogForRole() {
  const receiverMode = isReceiverUser();
  const dialog = byId("supplierRemitDialog");
  if (dialog) dialog.dataset.receiverMode = receiverMode ? "true" : "false";
  ["supplierRemitAmountField", "supplierRemitUnitField", "supplierRemitUnitPriceField", "supplierRemitMultiplierField", "supplierRemitSubtotalLabel", "supplierRemitSubtotal"].forEach((id) => {
    const node = byId(id);
    if (node) node.hidden = receiverMode;
  });
  const title = byId("supplierRemitDialog")?.querySelector("h2");
  if (title) title.textContent = receiverMode ? "Recepcionar remito" : "Cargar remito";
  const submit = byId("supplierRemitSubmitBtn");
  if (submit) submit.textContent = receiverMode ? "Registrar recepcion" : "Guardar remito";
}

function renderSupplierRemitItems() {
  const container = byId("supplierRemitItemsList");
  if (!container) return;
  if (!supplierRemitItems.length) {
    container.innerHTML = '<p class="empty-note">Todavia no hay productos agregados al remito.</p>';
  } else {
    container.innerHTML = supplierRemitItems.map((item, index) => `
      <article class="remit-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.productCode || "Sin codigo")} - ${escapeHtml(item.unit)} - stock +${item.stockQty}</small>
        </div>
        <span>${isSupplierReceiverMode() ? `${item.qty} ${escapeHtml(item.unit)} - stock +${item.stockQty}` : `${item.qty} x ${money.format(item.unitPrice)} = ${money.format(item.subtotal)}`}</span>
        <button class="mini-btn danger-btn" type="button" data-remove-remit-item="${index}">Quitar</button>
      </article>
    `).join("");
  }
  byId("supplierRemitProducts").value = supplierRemitItems.map((item) => `${item.name} x ${item.stockQty}`).join("\n");
  updateSupplierRemitAmountFromItems();
}

function addSupplierRemitItem() {
  const product = resolveSupplierRemitProduct(byId("supplierRemitProductSearch").value);
  if (!product) {
    setSupplierRemitMessage("Seleccionar un producto valido del nomenclador.");
    return;
  }
  const qty = Math.max(0, numeric(byId("supplierRemitQty").value, 0));
  const receiverMode = isSupplierReceiverMode();
  const multiplier = receiverMode ? 1 : Math.max(0.01, numeric(byId("supplierRemitMultiplier").value, 1));
  const unitPrice = receiverMode ? 0 : Math.max(0, numeric(byId("supplierRemitUnitPrice").value, 0));
  if (qty <= 0) {
    setSupplierRemitMessage("Indicar cantidad recibida.");
    return;
  }
  const subtotal = Math.round(qty * unitPrice * 100) / 100;
  const stockQty = Math.round(qty * multiplier * 100) / 100;
  supplierRemitItems.push({
    productCode: product.codigo_producto || "",
    barcode: product.codigo_barras || "",
    name: product.name,
    category: product.rubro || "",
    supplier: byId("supplierRemitSupplier").value || "",
    nomenclator: product.nomenclador || product.codigo_interno || product.codigo_producto || "",
    qty,
    unit: receiverMode ? "unidad" : String(byId("supplierRemitUnit").value || "unidad").trim() || "unidad",
    unitPrice,
    multiplier,
    stockQty,
    subtotal
  });
  byId("supplierRemitProductSearch").value = "";
  byId("supplierRemitQty").value = "1";
  byId("supplierRemitUnit").value = "unidad";
  byId("supplierRemitUnitPrice").value = "0";
  byId("supplierRemitMultiplier").value = "1";
  updateSupplierRemitSubtotal();
  setSupplierRemitMessage("");
  renderSupplierRemitItems();
}

function supplierRemitAttachmentFile() {
  return byId("supplierRemitCamera").files[0]
    || byId("supplierRemitGallery").files[0]
    || byId("supplierRemitFile").files[0]
    || null;
}

function updateSupplierRemitFileStatus() {
  const file = supplierRemitAttachmentFile();
  const status = byId("supplierRemitFileStatus");
  if (status) status.textContent = file ? `Adjunto listo: ${file.name}` : "Sin adjunto seleccionado.";
}

function supplierInvoiceAttachmentFile() {
  return byId("supplierInvoiceCamera").files[0]
    || byId("supplierInvoiceGallery").files[0]
    || byId("supplierInvoiceFile").files[0]
    || null;
}

function updateSupplierInvoiceFileStatus() {
  const file = supplierInvoiceAttachmentFile();
  const status = byId("supplierInvoiceFileStatus");
  if (status) status.textContent = file ? `Factura lista: ${file.name}` : "Sin factura adjunta.";
}

function supplierPaymentAttachmentFile() {
  return byId("supplierPaymentCamera").files[0]
    || byId("supplierPaymentGallery").files[0]
    || byId("supplierPaymentFile").files[0]
    || null;
}

function updateSupplierPaymentFileStatus() {
  const file = supplierPaymentAttachmentFile();
  const status = byId("supplierPaymentFileStatus");
  if (status) status.textContent = file ? `Respaldo listo: ${file.name}` : "Sin respaldo seleccionado.";
}

function populateSupplierRemitOptions() {
  const select = byId("supplierRemitSupplier");
  if (!select) return;
  select.innerHTML = state.suppliers.map((supplier) => `
    <option value="${escapeHtml(supplier.name)}">${escapeHtml(supplier.name)}</option>
  `).join("");
}

function populateSupplierPaymentOptions(selectedName = "") {
  const select = byId("supplierPaymentSupplier");
  if (!select) return;
  const options = (state.suppliers || []).map((supplier) => `
    <option value="${escapeHtml(supplier.name)}" ${sameSupplierName(supplier.name, selectedName) ? "selected" : ""}>${escapeHtml(supplier.name)}</option>
  `).join("");
  select.innerHTML = options || '<option value="">Sin proveedores</option>';
}

function openSupplierRemitDialog() {
  if (!canReceiveSupplierRemits()) {
    window.alert("Usuario sin permiso para recepcionar remitos.");
    return;
  }
  configureSupplierRemitDialogForRole();
  populateSupplierRemitOptions();
  populateSupplierRemitProductOptions();
  supplierRemitItems = [];
  const form = byId("supplierRemitForm");
  form.reset();
  byId("supplierRemitDate").value = localDateInputValue(new Date().toISOString());
  if (isSupplierReceiverMode()) {
    byId("supplierRemitAmount").value = "0";
    byId("supplierRemitUnit").value = "unidad";
    byId("supplierRemitUnitPrice").value = "0";
    byId("supplierRemitMultiplier").value = "1";
  }
  updateSupplierRemitSubtotal();
  renderSupplierRemitItems();
  updateSupplierRemitFileStatus();
  setSupplierRemitMessage("");
  byId("supplierRemitDialog").showModal();
}

async function submitSupplierRemit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const submit = byId("supplierRemitSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Guardando...";
  setSupplierRemitMessage("Registrando remito pendiente de validacion administrativa...", "info");
  try {
    if (!supplierRemitItems.length) {
      throw new Error("Agregar al menos un producto del nomenclador.");
    }
    const attachment = supplierRemitAttachmentFile();
    if (!attachment) {
      throw new Error("Adjuntar foto, imagen o PDF del remito.");
    }
    const fileData = await fileToEvidenceDataUrl(attachment);
    const payload = await postOperationalAction("api/suppliers/remits", {
      supplier: form.get("supplier"),
      remitNumber: form.get("remitNumber"),
      date: form.get("date"),
      amount: isSupplierReceiverMode() ? 0 : numeric(form.get("amount"), 0),
      productsText: form.get("productsText"),
      items: supplierRemitItems,
      observations: form.get("observations"),
      fileDataUrl: fileData,
      receiverMode: isSupplierReceiverMode()
    });
    cleanupOperationalLocalData("remito proveedor");
    byId("supplierRemitDialog").close("default");
    const completed = payload.completedOrders && payload.completedOrders.length
      ? ` Pedidos completos: ${payload.completedOrders.join(", ")}.`
      : "";
    showCompactNotice(`Remito ${payload.remit && payload.remit.remitNumber || ""} cargado pendiente de validacion.${completed}`, "ok");
  } catch (error) {
    setSupplierRemitMessage(error.message || "No se pudo guardar el remito.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Guardar remito";
  }
}

function openSupplierRemitValidationDialog(remitId) {
  const remit = (state.supplierMovements || []).find((item) => item.id === remitId);
  if (!remit) return;
  byId("supplierRemitValidationId").value = remit.id;
  byId("supplierRemitValidationTitle").textContent = `Validar remito ${remit.remitNumber || remit.id}`;
  byId("supplierRemitValidationAmount").value = String(remit.declaredAmount || remit.amount || 0);
  byId("supplierRemitValidationInvoice").value = remit.invoiceNumber || "";
  byId("supplierRemitValidationInvoiceDate").value = localDateInputValue(remit.invoiceDate || new Date().toISOString());
  byId("supplierRemitValidationDifferenceAmount").value = String(remit.differenceAmount || 0);
  byId("supplierRemitValidationCosts").checked = true;
  byId("supplierRemitValidationDifferences").value = remit.differences || "";
  byId("supplierRemitValidationObservations").value = remit.adminObservations || "";
  ["supplierInvoiceCamera", "supplierInvoiceGallery", "supplierInvoiceFile"].forEach((id) => { byId(id).value = ""; });
  updateSupplierInvoiceFileStatus();
  setSupplierRemitValidationMessage("");
  byId("supplierRemitValidationDialog").showModal();
}

async function submitSupplierRemitValidation(event) {
  event.preventDefault();
  const remitId = byId("supplierRemitValidationId").value;
  const submit = byId("supplierRemitValidationSubmitBtn");
  const invoiceNumber = byId("supplierRemitValidationInvoice").value.trim();
  if (!invoiceNumber) {
    setSupplierRemitValidationMessage("Indicar numero de factura.");
    return;
  }
  submit.disabled = true;
  submit.textContent = "Validando...";
  setSupplierRemitValidationMessage("Validando remito, factura, costos y diferencias...", "info");
  try {
    const invoiceFile = supplierInvoiceAttachmentFile();
    const invoiceFileDataUrl = invoiceFile ? await fileToEvidenceDataUrl(invoiceFile) : "";
    await postOperationalAction(`api/suppliers/remits/${encodeURIComponent(remitId)}/validate`, {
      amount: numeric(byId("supplierRemitValidationAmount").value, 0),
      invoiceNumber,
      invoiceDate: byId("supplierRemitValidationInvoiceDate").value,
      invoiceFileDataUrl,
      costsValidated: byId("supplierRemitValidationCosts").checked,
      differences: byId("supplierRemitValidationDifferences").value,
      differenceAmount: numeric(byId("supplierRemitValidationDifferenceAmount").value, 0),
      observations: byId("supplierRemitValidationObservations").value
    });
    byId("supplierRemitValidationDialog").close("default");
    showCompactNotice("Remito conciliado. Stock y cuenta proveedor actualizados.", "ok");
  } catch (error) {
    setSupplierRemitValidationMessage(error.message || "No se pudo validar el remito.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Validar e ingresar stock";
  }
}

function openSupplierPaymentDialog(supplierName = "") {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede registrar pagos de proveedores.");
    return;
  }
  populateSupplierPaymentOptions(supplierName || selectedSupplierAccountName);
  const form = byId("supplierPaymentForm");
  form.reset();
  if (supplierName) byId("supplierPaymentSupplier").value = supplierName;
  byId("supplierPaymentDate").value = localDateInputValue(new Date().toISOString());
  ["supplierPaymentCamera", "supplierPaymentGallery", "supplierPaymentFile"].forEach((id) => { byId(id).value = ""; });
  updateSupplierPaymentFileStatus();
  setSupplierPaymentMessage("");
  byId("supplierPaymentDialog").showModal();
}

async function submitSupplierPayment(event) {
  event.preventDefault();
  const submit = byId("supplierPaymentSubmitBtn");
  const attachment = supplierPaymentAttachmentFile();
  if (!attachment) {
    setSupplierPaymentMessage("Adjuntar documentacion de respaldo.");
    return;
  }
  submit.disabled = true;
  submit.textContent = "Registrando...";
  setSupplierPaymentMessage("Registrando pago pendiente de conciliacion...", "info");
  try {
    const fileDataUrl = await fileToEvidenceDataUrl(attachment);
    await postOperationalAction("api/suppliers/payments", {
      supplier: byId("supplierPaymentSupplier").value,
      method: byId("supplierPaymentMethod").value,
      amount: numeric(byId("supplierPaymentAmount").value, 0),
      date: byId("supplierPaymentDate").value,
      bank: byId("supplierPaymentBank").value,
      operationNumber: byId("supplierPaymentOperation").value,
      merchandiseDetail: byId("supplierPaymentMerchandise").value,
      observations: byId("supplierPaymentObservations").value,
      fileDataUrl
    });
    byId("supplierPaymentDialog").close("default");
    showCompactNotice("Pago registrado pendiente de conciliacion.", "ok");
  } catch (error) {
    setSupplierPaymentMessage(error.message || "No se pudo registrar el pago.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Registrar pago pendiente";
  }
}

function productDisplayName(product) {
  return product.name || product.descripcion || "";
}

function parseOrderProductLines(order) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.map((item) => ({ name: item.name, qty: numeric(item.requestedQty, 0) }));
  }
  return String(order.products || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/(.+?)\s+x\s*(\d+(?:[.,]\d+)?)/i);
      if (!match) return { name: part, qty: 1 };
      return {
        name: match[1].trim(),
        qty: Number(String(match[2]).replace(",", ".")) || 1
      };
    });
}

function findProductForLine(lineName) {
  const normalized = String(lineName || "").toLowerCase();
  return state.products.find((product) => {
    const name = productDisplayName(product).toLowerCase();
    return name === normalized || name.includes(normalized) || normalized.includes(name);
  });
}

function buildAnalytics() {
  const orders = state.orders || [];
  const operationalOrders = orders.filter((order) => order.status !== ORDER_STATUS.CANCELLED);
  const accounts = state.accounts || [];
  const products = state.products || [];
  const clients = state.clients || [];
  const totalSales = operationalOrders.reduce((total, order) => total + numeric(order.amount, 0), 0);
  const receivedOrders = operationalOrders.filter((order) => [ORDER_STATUS.PENDING, ORDER_STATUS.READY].includes(order.status)).length;
  const printedOrders = orders.filter((order) => order.print).length;
  const receivables = clients.reduce((total, client) => total + numeric(client.balance, 0), 0);
  const payables = (state.suppliers || []).reduce((total, supplier) => total + numeric(supplier.balance, 0), 0);
  const income = accounts.reduce((total, item) => total + numeric(item.credit, 0), 0);
  const expense = accounts.reduce((total, item) => total + numeric(item.debit, 0), 0);
  const lowStock = products.filter((product) => OrderEngine.inventory(product).available <= numeric(product.min, 0));
  const noPurchaseVisits = Array.isArray(state.noPurchaseVisits) ? state.noPurchaseVisits : [];
  const noPurchaseToday = noPurchaseVisits.filter((visit) => dashboardDateIsToday(visit.at || visit.date));
  const noPurchaseReasons = new Map();
  noPurchaseVisits.forEach((visit) => {
    const reason = visit.reason || "Sin motivo";
    noPurchaseReasons.set(reason, (noPurchaseReasons.get(reason) || 0) + 1);
  });

  const sellerSales = new Map();
  operationalOrders.forEach((order) => {
    const seller = order.seller || "Sin vendedor";
    sellerSales.set(seller, (sellerSales.get(seller) || 0) + numeric(order.amount, 0));
  });

  const productConsumption = new Map();
  operationalOrders.forEach((order) => {
    parseOrderProductLines(order).forEach((line) => {
      const product = findProductForLine(line.name);
      const name = product ? productDisplayName(product) : line.name;
      productConsumption.set(name, (productConsumption.get(name) || 0) + line.qty);
    });
  });

  const restock = products.map((product) => {
    const stock = OrderEngine.inventory(product).available;
    const min = numeric(product.min, 0);
    const consumed = productConsumption.get(productDisplayName(product)) || 0;
    const shortage = Math.max(0, min - stock);
    const coverage = consumed > 0 ? stock / consumed : (stock > min ? 99 : 0);
    const score = shortage * 3 + consumed * 2 + (stock <= 0 ? 100 : 0);
    let priority = "Normal";
    if (stock <= 0 || score >= 120) priority = "Urgente";
    else if (stock < min || score >= 40) priority = "Alta";
    else if (consumed > 0) priority = "Media";
    return { product, stock, min, consumed, coverage, priority, score };
  }).sort((a, b) => b.score - a.score).slice(0, 10);

  return {
    totalSales,
    receivedOrders,
    printedOrders,
    receivables,
    payables,
    income,
    expense,
    lowStock,
    noPurchaseVisits,
    noPurchaseToday,
    noPurchaseReasons: [...noPurchaseReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    sellerSales: [...sellerSales.entries()].sort((a, b) => b[1] - a[1]),
    productConsumption: [...productConsumption.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    restock
  };
}

function barRows(items, formatter) {
  const max = Math.max(1, ...items.map((item) => item[1]));
  return items.map(([label, value]) => {
    const width = Math.max(4, Math.round((value / max) * 100));
    return `
      <div class="analytics-bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar" style="width:${width}%"></div></div>
        <strong>${escapeHtml(formatter(value))}</strong>
      </div>
    `;
  }).join("");
}

function localDateInputValue(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function localTimeInputValue(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shortageDetailRows() {
  return (state.orders || []).flatMap((order) => {
    const client = state.clients.find((item) => item.name === order.client) || {};
    const date = localDateInputValue(order.createdAt || order.receivedAt);
    const time = localTimeInputValue(order.createdAt || order.receivedAt);
    return (order.items || []).map((item) => {
      const requested = numeric(item.requestedQty, 0);
      const deliveredReal = numeric(item.deliveredQty, 0);
      const returned = numeric(item.returnedQty, 0);
      const reserved = numeric(item.reservedQty, 0);
      const missingSupply = numeric(item.missingQty, 0);
      const pendingDelivery = numeric(item.pendingDeliveryQty, 0);
      const delivered = deliveredReal > 0 || returned > 0 ? deliveredReal : reserved;
      const difference = Math.max(0, missingSupply || pendingDelivery || (requested - delivered - returned));
      return {
        orderCode: order.code,
        product: item.name || "",
        requested,
        delivered,
        difference,
        client: order.client || "",
        seller: order.seller || "",
        zone: client.ruta || client.zona || client.zone || "Sin zona",
        status: order.status || "",
        date,
        time,
        priority: order.priority || "Normal"
      };
    }).filter((row) => row.difference > 0);
  }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function filteredShortageRows() {
  const productTerms = searchTerms(shortageProductTerm);
  const clientTerms = searchTerms(shortageClientTerm);
  return shortageDetailRows()
    .filter((row) => !shortageDateFrom || row.date >= shortageDateFrom)
    .filter((row) => !shortageDateTo || row.date <= shortageDateTo)
    .filter((row) => !shortageTimeFrom || row.time >= shortageTimeFrom)
    .filter((row) => !shortageTimeTo || row.time <= shortageTimeTo)
    .filter((row) => !productTerms.length || matchesSearch(row.product, productTerms))
    .filter((row) => !clientTerms.length || matchesSearch(row.client, clientTerms))
    .filter((row) => shortageSellerFilter === "all" || row.seller === shortageSellerFilter)
    .filter((row) => shortageZoneFilter === "all" || row.zone === shortageZoneFilter)
    .filter((row) => shortageStatusFilter === "all" || row.status === shortageStatusFilter);
}

function renderShortageStats() {
  const table = byId("shortageStatsTable");
  if (!table) return;
  const rows = shortageDetailRows();
  shortageSellerFilter = updateDynamicFilter("shortageSellerFilter", rows.map((row) => row.seller), shortageSellerFilter, "Todos los vendedores");
  shortageZoneFilter = updateDynamicFilter("shortageZoneFilter", rows.map((row) => row.zone), shortageZoneFilter, "Todas las zonas");
  shortageStatusFilter = updateDynamicFilter("shortageStatusFilter", rows.map((row) => row.status), shortageStatusFilter, "Todos los estados");
  const filtered = filteredShortageRows();
  const summary = byId("shortageStatsSummary");
  if (summary) {
    const requested = filtered.reduce((sum, row) => sum + row.requested, 0);
    const delivered = filtered.reduce((sum, row) => sum + row.delivered, 0);
    const difference = filtered.reduce((sum, row) => sum + row.difference, 0);
    summary.innerHTML = `
      <span>${filtered.length} lineas filtradas</span>
      <span>Solicitado ${requested}</span>
      <span>Reservado/entregado ${delivered}</span>
      <span>Diferencia ${difference}</span>
    `;
  }
  table.innerHTML = filtered.length ? filtered.slice(0, 120).map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.product)}</strong><small>${escapeHtml(row.orderCode)}</small></td>
      <td>${row.requested}</td>
      <td>${row.delivered}</td>
      <td><span class="tag danger">${row.difference}</span></td>
      <td><strong>${escapeHtml(row.client)}</strong><small>${escapeHtml(row.zone)}</small></td>
      <td>${escapeHtml(row.seller)}</td>
      <td><small>${escapeHtml(`${row.date} ${row.time}`)}</small><span class="tag ${orderStatusClass(row.status)}">${escapeHtml(row.status)}</span></td>
    </tr>
  `).join("") : '<tr><td class="stock-empty" colspan="7">No hay faltantes para los filtros seleccionados.</td></tr>';
}

function exportShortagesCsv() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar faltantes.");
    return;
  }
  const rows = filteredShortageRows();
  const headers = ["pedido", "producto", "solicitado", "entregado_reservado", "diferencia", "cliente", "vendedor", "zona", "estado", "fecha", "hora"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => [
      row.orderCode,
      row.product,
      row.requested,
      row.delivered,
      row.difference,
      row.client,
      row.seller,
      row.zone,
      row.status,
      row.date,
      row.time
    ].map(csvCell).join(","))
  ].join("\r\n");
  downloadBlob(`faltantes-distribuidora-lopez-${reportDateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function exportShortagesPdf() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede exportar faltantes.");
    return;
  }
  const rows = filteredShortageRows();
  const lines = [
    `Fecha de emision: ${new Date().toLocaleString("es-AR")}`,
    `Registros: ${rows.length}`,
    `Filtros: producto=${shortageProductTerm || "todos"} cliente=${shortageClientTerm || "todos"} vendedor=${shortageSellerFilter} zona=${shortageZoneFilter} estado=${shortageStatusFilter}`,
    "",
    "Pedido | Producto | Solicitado | Entregado/Reservado | Diferencia | Cliente | Vendedor | Fecha",
    "-".repeat(118),
    ...rows.map((row) => `${row.orderCode} | ${row.product} | ${row.requested} | ${row.delivered} | ${row.difference} | ${row.client} | ${row.seller} | ${row.date} ${row.time}`)
  ];
  downloadBlob(`faltantes-distribuidora-lopez-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Faltantes", lines));
}

function renderAnalytics() {
  const analytics = buildAnalytics();
  byId("analyticsKpis").innerHTML = [
    { label: "Ventas registradas", value: money.format(analytics.totalSales), hint: `${state.orders.length} pedidos` },
    { label: "Pedidos pendientes", value: analytics.receivedOrders, hint: "Abastecimiento o listos para armado" },
    { label: "Stock critico", value: analytics.lowStock.length, hint: "Productos bajo minimo" },
    { label: "Ctas. a cobrar", value: money.format(analytics.receivables), hint: "Capital en calle" },
    { label: "Sin compra hoy", value: analytics.noPurchaseToday.length, hint: "Visitas registradas con motivo" },
    { label: "Motivo principal", value: analytics.noPurchaseReasons[0] ? analytics.noPurchaseReasons[0][0] : "Sin datos", hint: analytics.noPurchaseReasons[0] ? `${analytics.noPurchaseReasons[0][1]} registros` : "Sin visitas sin compra" }
  ].map((item) => `
    <article class="analytics-kpi">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.hint)}</small>
    </article>
  `).join("");

  byId("sellerSalesChart").innerHTML = barRows(analytics.sellerSales, (value) => money.format(value)) || '<p class="empty-note">Sin ventas registradas.</p>';
  byId("productConsumptionChart").innerHTML = barRows(analytics.productConsumption, (value) => `${value} u.`) || '<p class="empty-note">Sin consumo registrado.</p>';

  const financeMax = Math.max(1, analytics.income, analytics.expense, analytics.payables);
  byId("incomeExpenseChart").innerHTML = [
    ["Ingresos/cobros", analytics.income, "ok"],
    ["Egresos/ventas cta.", analytics.expense, "warn"],
    ["Deuda proveedores", analytics.payables, "danger"]
  ].map(([label, value, tone]) => `
    <article class="finance-row" data-tone="${tone}">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar" style="width:${Math.max(4, Math.round((value / financeMax) * 100))}%"></div></div>
      <strong>${money.format(value)}</strong>
    </article>
  `).join("");

  byId("cashflowSignals").innerHTML = [
    { title: "Balance operativo", text: `${money.format(analytics.income - analytics.expense)} entre cobros y debitos registrados.`, tone: analytics.income >= analytics.expense ? "ok" : "warn" },
    { title: "Pedidos impresos", text: `${analytics.printedOrders} pedidos pasaron por deposito.`, tone: analytics.printedOrders ? "ok" : "warn" },
    { title: "Cuentas a cobrar", text: `${money.format(analytics.receivables)} pendientes en clientes.`, tone: analytics.receivables > 0 ? "warn" : "ok" },
    { title: "No compra", text: analytics.noPurchaseReasons.length ? analytics.noPurchaseReasons.map(([reason, count]) => `${reason}: ${count}`).join(" / ") : "Sin motivos registrados.", tone: analytics.noPurchaseToday.length ? "warn" : "ok" }
  ].map(renderSignal).join("");

  byId("restockTable").innerHTML = analytics.restock.map((item) => `
    <tr>
      <td><strong>${escapeHtml(productDisplayName(item.product))}</strong><small>${escapeHtml(item.product.rubro || "S/D")}</small></td>
      <td>${item.stock}</td>
      <td>${item.min}</td>
      <td>${item.consumed}</td>
      <td>${item.consumed ? `${item.coverage.toFixed(1)} pedidos` : "Sin consumo"}</td>
      <td><span class="tag ${item.priority === "Urgente" ? "danger" : item.priority === "Alta" ? "warn" : "ok"}">${escapeHtml(item.priority)}</span></td>
    </tr>
  `).join("");

  const immobilized = state.products.reduce((total, product) => total + OrderEngine.inventory(product).physical * numeric(product.cost, 0), 0);
  const overLimit = state.clients.filter((client) => numeric(client.balance, 0) > numeric(client.limit, 0));
  byId("assetSignals").innerHTML = [
    { title: "Capital en stock", text: `${money.format(immobilized)} valorizado a costo cargado.`, tone: immobilized > 0 ? "ok" : "warn" },
    { title: "Clientes sobre limite", text: `${overLimit.length} clientes superan limite de cuenta.`, tone: overLimit.length ? "danger" : "ok" },
    { title: "Reposicion urgente", text: `${analytics.restock.filter((item) => item.priority === "Urgente").length} productos sin cobertura.`, tone: analytics.restock.some((item) => item.priority === "Urgente") ? "danger" : "ok" },
    { title: "Base estadistica futura", text: "Cuando haya historial diario, el modulo calculara rotacion y compra sugerida por semana.", tone: "ok" }
  ].map(renderSignal).join("");
  renderShortageStats();
}

function renderSignal(item) {
  return `
    <article class="analytics-signal">
      <span class="tag ${item.tone}">${item.tone === "danger" ? "Critico" : item.tone === "warn" ? "Atencion" : "OK"}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `;
}

function auditActionTone(action) {
  const normalized = normalizeSearchText(action);
  if (normalized.includes("fallido") || normalized.includes("rechaz") || normalized.includes("cancel") || normalized.includes("quitado") || normalized.includes("forzada")) return "danger";
  if (normalized.includes("edit") || normalized.includes("modific") || normalized.includes("config") || normalized.includes("reorden") || normalized.includes("prioridad") || normalized.includes("stock")) return "warn";
  return "ok";
}

function auditJson(value) {
  if (value === null || value === undefined) return "Sin valor";
  let text = "";
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return text.length > 2200 ? `${text.slice(0, 2200)}\n... contenido resumido` : text;
}

function auditGpsText(gps) {
  if (!gps) return "GPS sin dato";
  const lat = Number(gps.lat);
  const lng = Number(gps.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "GPS sin dato";
  return `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function auditDeviceText(device) {
  if (!device) return "Dispositivo sin dato";
  return [device.label, device.model, device.os, device.appVersion].filter(Boolean).join(" - ") || device.id || "Dispositivo sin dato";
}

function auditSearchText(entry) {
  return [
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.entityLabel,
    entry.user,
    entry.username,
    entry.role,
    entry.ip,
    entry.note,
    auditDeviceText(entry.device),
    auditGpsText(entry.gps)
  ].join(" ");
}

function renderGlobalAudit() {
  const list = byId("auditList");
  if (!list) return;
  const audits = Array.isArray(state.globalAudit) ? state.globalAudit.slice() : [];
  auditEntityFilter = updateDynamicFilter("auditEntityFilter", audits.map((entry) => entry.entityType), auditEntityFilter, "Todas las entidades");
  auditActionFilter = updateDynamicFilter("auditActionFilter", audits.map((entry) => entry.action), auditActionFilter, "Todas las acciones");

  const globalTerms = [];
  const localTerms = searchTerms(auditSearchTerm);
  const terms = [...globalTerms, ...localTerms];
  const filtered = audits
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .filter((entry) => auditEntityFilter === "all" || entry.entityType === auditEntityFilter)
    .filter((entry) => auditActionFilter === "all" || entry.action === auditActionFilter)
    .filter((entry) => !terms.length || matchesSearch(auditSearchText(entry), terms));
  const visible = filtered.slice(0, 120);

  if (!visible.length) {
    list.innerHTML = `<p class="empty-note">Sin auditoria para los filtros seleccionados. Registros totales: ${audits.length}.</p>`;
    return;
  }

  const hiddenCount = Math.max(0, filtered.length - visible.length);
  list.innerHTML = [
    `<p class="empty-note">Mostrando ${visible.length} de ${filtered.length} registros filtrados${hiddenCount ? " (hay mas en historial)" : ""}.</p>`,
    ...visible.map((entry) => {
      const tone = auditActionTone(entry.action);
      const label = entry.entityLabel || entry.entityId || entry.entityType || "Sistema";
      const entity = [entry.entityType, entry.entityId].filter(Boolean).join(" ");
      const user = entry.user || entry.username || "Sistema";
      const device = auditDeviceText(entry.device);
      const atText = `${entry.date || ""} ${entry.time || ""}`.trim() || formatOrderTime(entry.at);
      return `
        <article class="audit-card">
          <div class="audit-card-head">
            <div>
              <span class="tag ${tone}">${escapeHtml(entry.action || "ACCION")}</span>
              <strong>${escapeHtml(label)}</strong>
              <small>${escapeHtml(entity || "Sin entidad")}</small>
            </div>
            <div class="audit-time">
              <strong>${escapeHtml(atText)}</strong>
              <span>${escapeHtml(formatOrderTime(entry.at))}</span>
            </div>
          </div>
          <div class="audit-meta">
            <span>Usuario: ${escapeHtml(user)}</span>
            <span>IP: ${escapeHtml(entry.ip || "sin dato")}</span>
            <span>${escapeHtml(device)}</span>
            <span>${escapeHtml(auditGpsText(entry.gps))}</span>
          </div>
          ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
          <details class="audit-details">
            <summary>Ver valor anterior y nuevo</summary>
            <div class="audit-diff">
              <div>
                <strong>Anterior</strong>
                <pre>${escapeHtml(auditJson(entry.previousValue))}</pre>
              </div>
              <div>
                <strong>Nuevo</strong>
                <pre>${escapeHtml(auditJson(entry.newValue))}</pre>
              </div>
            </div>
          </details>
        </article>
      `;
    })
  ].join("");
}

function filteredAuditEntries() {
  const audits = Array.isArray(state.globalAudit) ? state.globalAudit.slice() : [];
  const globalTerms = [];
  const localTerms = searchTerms(auditSearchTerm);
  const terms = [...globalTerms, ...localTerms];
  return audits
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .filter((entry) => auditEntityFilter === "all" || entry.entityType === auditEntityFilter)
    .filter((entry) => auditActionFilter === "all" || entry.action === auditActionFilter)
    .filter((entry) => !terms.length || matchesSearch(auditSearchText(entry), terms));
}

function printAuditReport() {
  if (!isAdminUser()) {
    window.alert("Solo administracion puede imprimir auditorias.");
    return;
  }
  const entries = filteredAuditEntries().slice(0, 300);
  const lines = [
    `Fecha: ${new Date().toLocaleString("es-AR")}`,
    `Filtro texto: ${auditSearchTerm || "Todos"}`,
    `Entidad: ${auditEntityFilter}`,
    `Accion: ${auditActionFilter}`,
    `Registros impresos: ${entries.length}`,
    "",
    "Fecha | Usuario | Accion | Entidad | IP | Nota",
    "-".repeat(118),
    ...entries.map((entry) => `${entry.date || ""} ${entry.time || ""} | ${entry.user || entry.username || "Sistema"} | ${entry.action || ""} | ${entry.entityType || ""} ${entry.entityId || ""} | ${entry.ip || ""} | ${entry.note || ""}`)
  ];
  downloadBlob(`auditoria-distribuidora-lopez-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Auditoria global", lines));
}

function renderRejectedGps() {
  const list = byId("rejectedGpsList");
  if (!list) return;
  const entries = Array.isArray(state.rejectedGps) ? state.rejectedGps.slice(0, 80) : [];
  list.innerHTML = entries.length ? entries.map((entry) => {
    const device = entry.device || {};
    const gps = entry.gps || {};
    return `
      <article class="audit-card rejected-gps-card">
        <div class="audit-card-head">
          <div>
            <span class="tag danger">Rechazado</span>
            <strong>${escapeHtml(entry.user || entry.username || "Dispositivo")}</strong>
            <small>${escapeHtml(entry.reason || "Ubicacion no confiable")}</small>
          </div>
          <div class="audit-time">
            <strong>${escapeHtml(`${entry.date || ""} ${entry.time || ""}`.trim())}</strong>
            <span>${escapeHtml(formatOrderTime(entry.at))}</span>
          </div>
        </div>
        <div class="audit-meta">
          <span>${escapeHtml(device.label || device.id || "Dispositivo sin dato")}</span>
          <span>IP: ${escapeHtml(entry.ip || "sin dato")}</span>
          <span>${Number.isFinite(Number(gps.lat)) ? `${Number(gps.lat).toFixed(5)}, ${Number(gps.lng).toFixed(5)}` : "coordenada invalida"}</span>
          <span>${escapeHtml(gps.source || entry.source || "sin fuente")} ${gps.provider ? `- ${escapeHtml(gps.provider)}` : ""}</span>
        </div>
      </article>
    `;
  }).join("") : '<p class="empty-note">Sin ubicaciones rechazadas registradas.</p>';
}

function sessionDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(Number(ms || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function sessionStatusTone(status) {
  const normalized = normalizeSearchText(status);
  if (normalized.includes("sin conexion")) return "danger";
  if (normalized.includes("reparto")) return "warn";
  return "ok";
}

function sessionGpsText(session) {
  if (!session || !session.location) return "GPS sin dato";
  const lat = Number(session.location.lat);
  const lng = Number(session.location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "GPS sin dato";
  const at = session.lastGpsAt || session.location.updatedAt || session.lastSeenAt;
  const accuracy = Number(session.location.accuracy || 0);
  const warning = session.gpsWarning || gpsAccuracyWarning(session.location);
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${accuracy ? ` - ${Math.round(accuracy)} m` : ""} - ${formatOrderTime(at)}${warning ? ` - ${warning}` : ""}`;
}

function renderSessionMonitor() {
  const table = byId("activeSessionsTable");
  if (!table || !isAdminUser()) return;
  const sessions = uniquePresenceSessions(presenceSessions);
  const recent = Array.isArray(presenceHistory) ? presenceHistory.slice(0, 6) : [];
  const online = sessions.filter((session) => normalizeSearchText(session.status) !== "sin conexion");
  const withGps = sessions.filter((session) => session.location);
  const summary = byId("sessionSummary");
  if (summary) {
    summary.innerHTML = [
      { label: "Activas", value: sessions.length, tone: sessions.length ? "ok" : "warn" },
      { label: "Online", value: online.length, tone: online.length === sessions.length ? "ok" : "warn" },
      { label: "Con GPS", value: withGps.length, tone: withGps.length === sessions.length ? "ok" : "warn" },
      { label: "Politica", value: sessionSettings.duplicatePolicy === "reject" ? "Rechazar" : "Reemplazar", tone: "ok" }
    ].map((item) => `
      <article class="session-kpi ${item.tone}">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `).join("");
  }

  const policy = byId("sessionDuplicatePolicy");
  const offline = byId("sessionOfflineAfterMs");
  const heartbeat = byId("sessionHeartbeatMs");
  const distance = byId("sessionGpsMinDistance");
  const moving = byId("sessionMovingMs");
  const stationary = byId("sessionStationaryMs");
  const maxAge = byId("sessionGpsMaxAgeMs");
  const ttl = byId("sessionTtlMs");
  const startHour = byId("sessionWorkdayStartHour");
  const endHour = byId("sessionWorkdayEndHour");
  if (policy && document.activeElement !== policy) policy.value = sessionSettings.duplicatePolicy || "replace";
  if (offline && document.activeElement !== offline) offline.value = String(sessionSettings.offlineAfterMs || 45000);
  if (heartbeat && document.activeElement !== heartbeat) heartbeat.value = String(sessionSettings.heartbeatIntervalMs || 10000);
  if (distance && document.activeElement !== distance) distance.value = String(sessionSettings.locationUpdateMinDistanceMeters || 5);
  if (moving && document.activeElement !== moving) moving.value = String(sessionSettings.locationMovingIntervalMs || 10000);
  if (stationary && document.activeElement !== stationary) stationary.value = String(sessionSettings.locationStationaryIntervalMs || 10000);
  if (maxAge && document.activeElement !== maxAge) maxAge.value = String(sessionSettings.locationMaxAgeMs || 300000);
  if (ttl && document.activeElement !== ttl) ttl.value = String(sessionSettings.sessionTtlMs || 20 * 60 * 60 * 1000);
  if (startHour && document.activeElement !== startHour) startHour.value = String(sessionSettings.workdayStartHour || 7);
  if (endHour && document.activeElement !== endHour) endHour.value = String(sessionSettings.workdayEndHour || 22);

  table.innerHTML = sessions.length ? sessions.map((session) => {
    const tone = sessionStatusTone(session.status);
    const device = session.device || {};
    const isCurrent = currentSession && currentSession.sessionId === session.sessionId;
    return `
      <tr>
        <td>
          <strong>${escapeHtml(session.name || session.username)}</strong>
          <small>${escapeHtml(session.username)} - ${escapeHtml(roleLabel(session.role))}${isCurrent ? " - sesion actual" : ""}</small>
        </td>
        <td>
          <strong>${escapeHtml(device.label || device.id || "Sin etiqueta")}</strong>
          <small>${escapeHtml(device.os || "Sistema")} - ${escapeHtml(device.appVersion || "App")}</small>
          <small>${escapeHtml(device.model || "Modelo sin informar")}</small>
        </td>
        <td>
          <span class="tag ${tone}">${escapeHtml(session.status || "Disponible")}</span>
          <small>${escapeHtml(session.sellerName || "Sin vendedor asociado")}</small>
        </td>
        <td>
          <strong>${escapeHtml(session.ip || "IP sin dato")}</strong>
          <small>${escapeHtml(sessionGpsText(session))}</small>
        </td>
        <td>
          <strong>${escapeHtml(sessionDuration(session.connectedMs))}</strong>
          <small>Inicio ${escapeHtml(formatOrderTime(session.startedAt))}</small>
          <small>Ultima ${escapeHtml(formatOrderTime(session.lastSeenAt))}</small>
        </td>
        <td>
          <button class="mini-btn danger-btn" type="button" data-force-session-close="${escapeHtml(session.sessionId)}"${isCurrent ? " disabled" : ""}>Cerrar</button>
        </td>
      </tr>
    `;
  }).join("") : '<tr><td class="stock-empty" colspan="6">No hay sesiones activas registradas.</td></tr>';

  const recentList = byId("sessionRecentList");
  if (recentList) {
    recentList.innerHTML = recent.length ? `
      <h3>Ultimas desconexiones / historial</h3>
      <div class="presence-history-grid">
        ${recent.map((session) => `
          <article class="presence-history-item">
            <strong>${escapeHtml(session.name || session.username || "Usuario")}</strong>
            <span>${escapeHtml(session.historyAction || session.status || "Sin conexion")}</span>
            <small>${escapeHtml(session.historyAt || session.lastPresenceAt || session.lastSeenAt ? formatOrderTime(session.historyAt || session.lastPresenceAt || session.lastSeenAt) : "Sin hora")}</small>
          </article>
        `).join("")}
      </div>
    ` : "";
  }
}

async function refreshSessionMonitor() {
  if (!isAdminUser()) return;
  try {
    const response = await fetchWithTimeout(apiUrl("api/admin/sessions"), { cache: "no-store" }, 8000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo actualizar sesiones.");
    applyPresencePayload(payload);
    applyPresenceToState();
    renderSessionMonitor();
    renderRoutes();
  } catch (error) {
    window.alert(error.message || "No se pudo actualizar el monitor de sesiones.");
  }
}

async function submitSessionSettings(event) {
  event.preventDefault();
  if (!isAdminUser()) return;
  const form = new FormData(event.currentTarget);
  try {
    const response = await fetchWithTimeout(apiUrl("api/admin/session-settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        duplicatePolicy: form.get("duplicatePolicy"),
        offlineAfterMs: Number(form.get("offlineAfterMs") || 45000),
        heartbeatIntervalMs: Number(form.get("heartbeatIntervalMs") || 10000),
        locationUpdateMinDistanceMeters: Number(form.get("locationUpdateMinDistanceMeters") || 5),
        locationMovingIntervalMs: Number(form.get("locationMovingIntervalMs") || 10000),
        locationStationaryIntervalMs: Number(form.get("locationStationaryIntervalMs") || 10000),
        locationMaxAgeMs: Number(form.get("locationMaxAgeMs") || 300000),
        sessionTtlMs: Number(form.get("sessionTtlMs") || 20 * 60 * 60 * 1000),
        workdayStartHour: Number(form.get("workdayStartHour") || 7),
        workdayEndHour: Number(form.get("workdayEndHour") || 22)
      })
    }, 8000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo guardar la politica.");
    applyPresencePayload(payload);
    if (currentUser) {
      startPresenceHeartbeat();
      startPresenceLocationService();
    }
    renderSessionMonitor();
    window.alert("Politica de sesiones actualizada.");
    pullStateFromServer();
  } catch (error) {
    window.alert(error.message || "No se pudo guardar la politica de sesiones.");
  }
}

async function forceCloseSession(sessionId) {
  if (!isAdminUser() || !sessionId) return;
  const session = presenceSessions.find((item) => item.sessionId === sessionId);
  const label = session ? `${session.name || session.username} en ${session.device && (session.device.label || session.device.id) || "dispositivo"}` : sessionId;
  if (!window.confirm(`Cerrar sesion de ${label}?`)) return;
  try {
    const response = await fetchWithTimeout(apiUrl(`api/admin/sessions/${encodeURIComponent(sessionId)}/close`), {
      method: "POST",
      cache: "no-store"
    }, 8000);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo cerrar la sesion.");
    applyPresencePayload(payload);
    applyPresenceToState();
    renderSessionMonitor();
    renderRoutes();
    pullStateFromServer();
  } catch (error) {
    window.alert(error.message || "No se pudo cerrar la sesion.");
  }
}

function currentLegalSettings() {
  if (LegalEngine && typeof LegalEngine.migrateState === "function") LegalEngine.migrateState(state);
  return state.legalSettings || legalPacketFromState();
}

function renderLegalModule() {
  const settings = currentLegalSettings();
  const packet = legalPacketFromState();
  const cards = byId("legalCards");
  if (cards) {
    const acceptances = Array.isArray(state.legalAcceptances) ? state.legalAcceptances : [];
    cards.innerHTML = [
      { label: "Version vigente", value: settings.currentVersion || "-", tone: "ok" },
      { label: "Hash documento", value: settings.hash ? `${settings.hash.slice(0, 12)}...` : "-", tone: "info" },
      { label: "Aceptaciones", value: String(acceptances.length), tone: acceptances.length ? "ok" : "warn" },
      { label: "Historial", value: String((settings.history || []).length), tone: "info" }
    ].map((item) => `
      <article class="legal-card ${item.tone}">
        <small>${escapeHtml(item.label)}</small>
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `).join("");
  }
  const documents = byId("legalDocumentsList");
  if (documents) documents.innerHTML = legalDocumentHtml(packet);
  const history = byId("legalHistoryList");
  if (history) {
    const rows = Array.isArray(settings.history) ? settings.history : [];
    history.innerHTML = rows.length ? rows.map((item) => `
      <article class="activity">
        <span class="tag info">${escapeHtml(item.version || "-")}</span>
        <strong>${escapeHtml(item.title || "Version legal")}</strong>
        <p>${escapeHtml(item.summary || "")}</p>
        <small>${escapeHtml(formatOrderTime(item.publishedAt) || "")} - ${escapeHtml(item.publishedBy || "")}</small>
      </article>
    `).join("") : '<p class="empty-note">Sin historial de versiones.</p>';
  }
  const acceptances = byId("legalAcceptancesList");
  if (acceptances) {
    const rows = isAdminUser() ? (state.legalAcceptances || []).slice(0, 80) : [];
    acceptances.innerHTML = rows.length ? rows.map((item) => `
      <article class="activity">
        <span class="tag ok">Aceptado</span>
        <strong>${escapeHtml(item.user || item.username)} - ${escapeHtml(item.version || "")}</strong>
        <p>IP ${escapeHtml(item.ip || "-")} - Dispositivo ${escapeHtml(item.device && (item.device.label || item.device.id) || "-")}</p>
        <small>${escapeHtml(formatOrderTime(item.at) || "")} - Hash ${escapeHtml(item.hash || "")}</small>
      </article>
    `).join("") : '<p class="empty-note">Las evidencias de aceptacion son visibles para administradores.</p>';
  }
  fillLegalPublishForm(settings);
}

function fillLegalPublishForm(settings) {
  const form = byId("legalPublishForm");
  if (!form || !isAdminUser()) return;
  if (form.dataset.loadedVersion === settings.currentVersion) return;
  form.dataset.loadedVersion = settings.currentVersion || "";
  form.elements.version.value = `${settings.currentVersion || "LEGAL"}-REV-${new Date().toISOString().slice(0, 10)}`;
  form.elements.title.value = settings.title || "Terminos, Licencia y Privacidad";
  form.elements.summary.value = "";
  form.elements.motive.value = "";
  (settings.documents || []).forEach((document) => {
    const textarea = form.querySelector(`[data-legal-document="${document.id}"]`);
    if (textarea) textarea.value = (Array.isArray(document.body) ? document.body : []).join("\n");
  });
}

function legalPublishPayload() {
  const form = byId("legalPublishForm");
  const currentDocs = (currentLegalSettings().documents || []);
  const documents = currentDocs.map((document) => {
    const textarea = form.querySelector(`[data-legal-document="${document.id}"]`);
    return {
      id: document.id,
      title: document.title,
      summary: document.summary,
      body: textarea ? textarea.value.split(/\n+/).map((line) => line.trim()).filter(Boolean) : document.body
    };
  });
  return {
    version: form.elements.version.value.trim(),
    title: form.elements.title.value.trim(),
    summary: form.elements.summary.value.trim(),
    motive: form.elements.motive.value.trim(),
    documents
  };
}

async function submitLegalPublish(event) {
  event.preventDefault();
  if (!isAdminUser()) return;
  const payload = legalPublishPayload();
  if (!payload.version || !payload.motive) {
    showCompactNotice("Completar version y motivo legal.", "warn");
    return;
  }
  if (!window.confirm("Publicar nueva version legal obliga a todos los usuarios a aceptar nuevamente. Continuar?")) return;
  try {
    await postOperationalAction("api/legal/publish", payload);
    showCompactNotice("Nueva version legal publicada.", "ok");
    renderLegalModule();
  } catch (error) {
    showCompactNotice(error.message || "No se pudo publicar la version legal.", "danger");
  }
}

function allHelpTopics() {
  if (LegalEngine && typeof LegalEngine.migrateState === "function") LegalEngine.migrateState(state);
  return state.helpCenter && Array.isArray(state.helpCenter.topics) ? state.helpCenter.topics : [];
}

function filteredHelpTopics() {
  const terms = searchTerms(helpSearchTerm);
  return allHelpTopics()
    .filter((topic) => helpRoleFilter === "all" || (topic.roles || []).includes(helpRoleFilter))
    .filter((topic) => helpModuleFilter === "all" || topic.id === helpModuleFilter)
    .filter((topic) => !terms.length || matchesSearch([
      topic.title,
      topic.module,
      (topic.keywords || []).join(" "),
      (topic.steps || []).join(" ")
    ].join(" "), terms));
}

function renderHelpFilters(topics) {
  const role = byId("helpRoleFilter");
  const module = byId("helpModuleFilter");
  if (role && role.options.length <= 1) {
    ["admin", "seller", "driver", "receiver", "depot"].forEach((value) => {
      role.insertAdjacentHTML("beforeend", `<option value="${value}">${escapeHtml(roleLabel(value))}</option>`);
    });
  }
  if (module) {
    const previous = module.value || "all";
    module.innerHTML = '<option value="all">Todos los modulos</option>' + topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.module)}</option>`).join("");
    module.value = Array.from(module.options).some((option) => option.value === previous) ? previous : "all";
  }
}

function renderHelpCenter() {
  const topics = allHelpTopics();
  renderHelpFilters(topics);
  const rows = filteredHelpTopics();
  if (!activeHelpTopicId || !topics.some((topic) => topic.id === activeHelpTopicId)) {
    activeHelpTopicId = rows[0] && rows[0].id || "";
  }
  const list = byId("helpTopicList");
  if (list) {
    list.innerHTML = rows.length ? rows.map((topic) => `
      <button class="help-topic ${topic.id === activeHelpTopicId ? "active" : ""}" type="button" data-help-topic="${escapeHtml(topic.id)}">
        <span>${escapeHtml(topic.module)}</span>
        <strong>${escapeHtml(topic.title)}</strong>
        <small>${escapeHtml((topic.roles || []).map(roleLabel).join(", "))}</small>
      </button>
    `).join("") : '<p class="empty-note">No hay resultados para la busqueda.</p>';
  }
  const supportPanel = byId("helpSupportPanel");
  if (supportPanel) {
    supportPanel.innerHTML = `
      <article class="support-card">
        ${developerMarkHtml("medium")}
        <div>
          <span>Centro de Soporte ${escapeHtml(DEVELOPER_BRAND.name)}</span>
          <strong>${escapeHtml(DEVELOPER_BRAND.supportLabel)}</strong>
          <p>Manuales, preguntas frecuentes, novedades y solicitud de asistencia tecnica.</p>
        </div>
      </article>
      <div class="support-grid">
        <span><b>WhatsApp</b>${escapeHtml(DEVELOPER_BRAND.phone)}</span>
        <span><b>Email</b>${escapeHtml(DEVELOPER_BRAND.email)}</span>
        <span><b>Horario</b>${escapeHtml(DEVELOPER_BRAND.hours)}</span>
        <span><b>Version</b>${escapeHtml(APP_VERSION)}</span>
      </div>
    `;
  }
  renderActiveHelpTopic();
}

function renderActiveHelpTopic() {
  const topic = allHelpTopics().find((item) => item.id === activeHelpTopicId) || allHelpTopics()[0];
  const detail = byId("helpTopicDetail");
  if (!detail) return;
  if (!topic) {
    detail.innerHTML = '<p class="empty-note">Seleccionar un modulo para ver la ayuda.</p>';
    return;
  }
  detail.innerHTML = `
    <article class="help-detail">
      <span class="tag info">${escapeHtml(topic.module)}</span>
      <h2>${escapeHtml(topic.title)}</h2>
      <ol>
        ${(topic.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <div class="help-actions">
        <button class="primary-btn" type="button" id="completeHelpTourBtn">Marcar recorrido completado</button>
        <button class="secondary-btn" type="button" id="printHelpTopicBtn">Imprimir instructivo</button>
        <button class="secondary-btn" type="button" id="downloadHelpManualBtn">Descargar manual PDF</button>
        <button class="ghost-btn" type="button" id="reportHelpProblemBtn">Reportar problema</button>
      </div>
    </article>
  `;
  byId("completeHelpTourBtn").addEventListener("click", () => completeHelpTour(topic.id));
  byId("printHelpTopicBtn").addEventListener("click", () => printHelpTopic(topic));
  byId("downloadHelpManualBtn").addEventListener("click", downloadHelpManual);
  byId("reportHelpProblemBtn").addEventListener("click", () => openExternalUrl(`https://wa.me/${SUPPORT_WHATSAPP_PHONE}?text=${encodeURIComponent(`Soporte DL - consulta sobre modulo ${topic.module}`)}`, "WhatsApp soporte"));
}

async function completeHelpTour(topicId) {
  try {
    await postOperationalAction("api/help/tour-complete", { topicId });
    showCompactNotice("Recorrido registrado.", "ok");
  } catch (error) {
    showCompactNotice(error.message || "No se pudo registrar el recorrido.", "warn");
  }
}

function printHelpTopic(topic) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) {
    showCompactNotice("El navegador bloqueo la impresion.", "warn");
    return;
  }
  win.document.write(`
    <html><head><title>${escapeHtml(topic.module)}</title></head><body>
    <h1>${escapeHtml(topic.module)} - ${escapeHtml(topic.title)}</h1>
    <ol>${(topic.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    <p>${escapeHtml(LegalEngine ? LegalEngine.COPYRIGHT_TEXT : "Grupo Rocha Solutions")}</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function downloadHelpManual() {
  const lines = ["Sistema de Gestion Distribuidora Lopez - Manual por modulos", ""];
  allHelpTopics().forEach((topic) => {
    lines.push(`${topic.module} - ${topic.title}`);
    (topic.steps || []).forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    lines.push("");
  });
  downloadBlob(`manual-ayuda-distribuidora-lopez-${reportDateStamp()}.pdf`, makeSimplePdf("Distribuidora Lopez - Manual de ayuda", lines));
}

function openContextHelp() {
  activeHelpTopicId = allHelpTopics().find((topic) => topic.id === activeViewId())?.id || "";
  switchView("ayuda");
}

function renderAboutSystem() {
  if (LegalEngine && typeof LegalEngine.migrateState === "function") LegalEngine.migrateState(state);
  const about = state.aboutSystem || {};
  const security = securityLicenseStatus || {};
  const license = security.license || {};
  const grid = byId("aboutSystemGrid");
  if (grid) {
    const items = [
      { label: "Sistema", value: about.name || "Sistema de Gestion Distribuidora Lopez", tone: "ok" },
      { label: "Desarrollado por", value: about.developer || "Grupo Rocha Solutions", tone: "ok" },
      { label: "Version", value: APP_VERSION, tone: "info" },
      { label: "Fecha compilacion", value: about.buildDate || "2026-07-27", tone: "info" },
      { label: "Ultima actualizacion", value: about.lastUpdate || "2026-07-27", tone: "info" },
      { label: "Servidor", value: connectionDiagnostics.server || CONNECTION_CONFIG.SERVER_NAME || "SERVIDOR_UNICO_8790", tone: "info" },
      { label: "URL API", value: getApiBaseUrl(), tone: "info" },
      { label: "Cliente", value: license.client || "Distribuidora Lopez", tone: "ok" },
      { label: "Licencia", value: license.ok ? (license.licenseId || "Activa") : "No verificada", tone: license.ok ? "ok" : "warn" },
      { label: "Estado", value: security.ok ? "Habilitado" : "Pendiente de verificacion", tone: security.ok ? "ok" : "warn" },
      { label: "Soporte", value: SUPPORT_WHATSAPP_PHONE ? `+${SUPPORT_WHATSAPP_PHONE}` : "Sin configurar", tone: SUPPORT_WHATSAPP_PHONE ? "ok" : "warn" }
    ];
    grid.innerHTML = items.map((item) => `
      <article class="about-card ${item.tone}">
        <small>${escapeHtml(item.label)}</small>
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `).join("");
  }
  const copyright = byId("aboutCopyright");
  if (copyright) {
    copyright.innerHTML = `
      <span>${developerMarkHtml("small")}</span>
      <strong>Desarrollado con tecnologia de ${escapeHtml(DEVELOPER_BRAND.name)}</strong>
      <span>${escapeHtml(DEVELOPER_BRAND.tagline)}</span>
      <small>${escapeHtml(DEVELOPER_BRAND.poweredBy)}&reg;</small>
    `;
  }
  const support = byId("aboutSupportPanel");
  if (support) {
    support.innerHTML = `
      <article class="support-card">
        ${developerMarkHtml("medium")}
        <div>
          <span>Empresa desarrolladora</span>
          <strong>${escapeHtml(DEVELOPER_BRAND.name)}</strong>
          <p>${escapeHtml(DEVELOPER_BRAND.tagline)}</p>
        </div>
      </article>
      <div class="support-grid">
        <span><b>Sitio web</b>${escapeHtml(DEVELOPER_BRAND.website)}</span>
        <span><b>Correo</b>${escapeHtml(DEVELOPER_BRAND.email)}</span>
        <span><b>Telefono</b>${escapeHtml(DEVELOPER_BRAND.phone)}</span>
        <span><b>Horario</b>${escapeHtml(DEVELOPER_BRAND.hours)}</span>
        <span><b>Version</b>${escapeHtml(APP_VERSION)}</span>
        <span><b>Licencia</b>${escapeHtml(licenseStatusText())}</span>
      </div>
    `;
  }
  const releases = byId("aboutReleaseNotes");
  if (releases) {
    const notes = Array.isArray(about.releaseNotes) ? about.releaseNotes : [];
    releases.innerHTML = notes.length ? notes.map((item) => `
      <article class="activity">
        <span class="tag info">${escapeHtml(item.version || "")}</span>
        <strong>${escapeHtml(item.title || "Actualizacion")}</strong>
        <p>${escapeHtml(item.text || "")}</p>
        <small>${escapeHtml(item.date || "")}</small>
      </article>
    `).join("") : '<p class="empty-note">Sin novedades registradas.</p>';
  }
}

function renderAdmin() {
  const dailySales = state.orders.reduce((total, order) => total + order.amount, 0);
  const receivables = state.clients.reduce((total, client) => total + client.balance, 0);
  const commissions = OrderEngine && typeof OrderEngine.summarizeCommissions === "function"
    ? OrderEngine.summarizeCommissions(state).reduce((total, row) => total + numeric(row.total, 0), 0)
    : state.sellers.reduce((total, seller) => total + seller.commission, 0);
  const adminItems = [
    { title: "Ventas facturables", value: money.format(dailySales), text: "Pedidos listos para administracion." },
    { title: "Cuentas a cobrar", value: money.format(receivables), text: "Saldo total de clientes." },
    { title: "Comisiones del dia", value: money.format(commissions), text: "Base para liquidacion a vendedores." },
    { title: "Stock semanal", value: "Lunes", text: "Cierre fisico contra sistema y registro de diferencias." },
    { title: "Reparto", value: "2-3 vehiculos", text: "Rutas, entregas, cobranzas, devoluciones y rendiciones." },
    { title: "Direccion", value: "Martin", text: "Autorizacion de compras, descuentos e indicadores gerenciales." }
  ];

  byId("adminList").innerHTML = adminItems.map((item) => `
    <article class="flow-card">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.value)}</span>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("");

  byId("requirementsList").innerHTML = state.requirements.map((item) => `
    <article class="stock-item">
      <span class="tag ok">Cubierto</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("");

  renderGlobalAudit();
  renderRejectedGps();
  renderSessionMonitor();
  renderLicensePanel();
  renderDiagnostics();
}

function securityTone(ok, warn = false) {
  if (ok) return warn ? "warn" : "ok";
  return "danger";
}

function renderLicensePanel() {
  const grid = byId("licenseStatusGrid");
  const events = byId("licenseEvents");
  if (!grid || !events) return;
  const security = securityLicenseStatus || {};
  const license = security.license || {};
  const integrity = security.integrity || {};
  const modules = Array.isArray(license.modules) ? license.modules : [];
  const cards = [
    { label: "Estado general", value: security.ok ? "Habilitado" : "Bloqueado", tone: securityTone(security.ok) },
    { label: "Cliente", value: license.client || "Sin licencia", tone: securityTone(license.ok) },
    { label: "Instalacion", value: license.installation || "-", tone: securityTone(license.ok) },
    { label: "Licencia", value: license.licenseId || license.code || "-", tone: securityTone(license.ok) },
    { label: "Version", value: license.version || security.version || APP_VERSION, tone: securityTone(license.ok) },
    { label: "Vencimiento", value: license.expiresAt ? formatOrderTime(license.expiresAt) : "Sin vencimiento", tone: securityTone(license.ok) },
    { label: "Integridad", value: integrity.ok ? `${integrity.checked || 0} archivos OK` : integrity.message || "Sin verificar", tone: securityTone(integrity.ok) },
    { label: "Modulos", value: modules.length ? modules.join(", ") : "-", tone: securityTone(license.ok, modules.length === 0) }
  ];
  grid.innerHTML = cards.map((item) => `
    <article class="license-card ${item.tone}">
      <small>${escapeHtml(item.label)}</small>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");
  const changed = Array.isArray(integrity.changed) ? integrity.changed : [];
  const missing = Array.isArray(integrity.missing) ? integrity.missing : [];
  const recentEvents = Array.isArray(security.events) ? security.events.slice(0, 6) : [];
  const integrityRows = [
    ...changed.map((item) => ({ level: "danger", action: "Archivo modificado", text: item.path || "" })),
    ...missing.map((item) => ({ level: "danger", action: "Archivo faltante", text: item }))
  ];
  const eventRows = integrityRows.length ? integrityRows : recentEvents.map((item) => ({
    level: item.level || "info",
    action: item.action || "Evento",
    text: `${item.at ? formatOrderTime(item.at) : ""} ${item.details && item.details.licenseId ? item.details.licenseId : ""}`.trim()
  }));
  events.innerHTML = (eventRows.length ? eventRows : [{ level: "info", action: "Sin eventos criticos", text: "La instalacion no registra alertas recientes." }]).map((item) => `
    <article class="license-event ${item.level === "danger" ? "danger" : ""}">
      <strong>${escapeHtml(item.action)}</strong>
      <p>${escapeHtml(item.text || "")}</p>
    </article>
  `).join("");
}

async function refreshLicenseStatus() {
  if (!isAdminUser()) return;
  const grid = byId("licenseStatusGrid");
  if (grid) {
    grid.innerHTML = `<article class="license-card warn"><small>Licencia</small><strong>Verificando...</strong></article>`;
  }
  try {
    const response = await fetchWithTimeout(apiUrl("api/admin/license"), { cache: "no-store" }, SERVER_TIMEOUT_MS);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${response.status}`);
    securityLicenseStatus = payload.security || null;
  } catch (error) {
    securityLicenseStatus = {
      ok: false,
      license: { ok: false, code: "LICENSE_PANEL_ERROR", message: error.message || "No se pudo consultar licencia." },
      integrity: { ok: false, message: "Sin verificacion" },
      events: [{ level: "danger", action: "Consulta de licencia fallida", at: new Date().toISOString(), details: { message: error.message || "" } }]
    };
  }
  renderLicensePanel();
}

function clientStatusClass(status) {
  if (status === "Activo") return "ok";
  if (status === "Bloqueado") return "danger";
  return "warn";
}

function orderStatusClass(status) {
  if ([ORDER_STATUS.READY, ORDER_STATUS.READY_DISPATCH, ORDER_STATUS.DISPATCHED, ORDER_STATUS.DELIVERED, ORDER_STATUS.COLLECTED, ORDER_STATUS.CLOSED].includes(status)) return "ok";
  if ([ORDER_STATUS.PENDING, ORDER_STATUS.COMMERCIAL_APPROVAL, ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.IN_ROUTE, ORDER_STATUS.CHECKED, ORDER_STATUS.PARTIAL_DELIVERED, ORDER_STATUS.POSTPONED].includes(status)) return "warn";
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.NOT_DELIVERED, ORDER_STATUS.REJECTED].includes(status)) return "danger";
  return "";
}

function supplierStatusClass(status) {
  if (status === "Al dia") return "ok";
  if (status === "Vence pronto") return "warn";
  return "danger";
}

function switchView(viewId, options = {}) {
  if (currentUser && !canUseView(viewId)) {
    viewId = appHomeView();
  }
  rememberViewTransition(viewId, options);
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  byId("viewTitle").textContent = titles[viewId];
  if (location.hash !== `#${viewId}`) {
    history.replaceState(null, "", `#${viewId}`);
  }
  renderAssistantGuide();
  if (viewId === "reparto") startDeliveryLocation();
  if (viewId === "diagnostico") runConnectionDiagnostics();
  if (viewId === "admin" && isAdminUser() && !securityLicenseStatus) refreshLicenseStatus();
  if (!options.skipRender && currentUser) renderActiveView(viewId);
  if (!options.skipBackGuard) armAppBackGuard();
  updateBackButtons();
}

async function addOrder(order) {
  const inputItems = Array.isArray(order.items) && order.items.length
    ? order.items
    : OrderEngine.parseProductText(order.products).map((item) => {
      const product = findProductForLine(item.name);
      return {
        productCode: product ? product.codigo_producto : "",
        name: product ? product.name : item.name,
        qty: item.qty
      };
    });
  const orderAmount = estimateOrderAmount({ ...order, items: inputItems });
  const authorization = authorizeCreditIfNeeded(order.client, orderAmount);
  return postOperationalAction("api/orders", {
    ...order,
    items: inputItems,
    creditOverride: authorization.creditOverride
  });
}

function orderEditBlockedReason(order) {
  if (!order) return "Pedido no encontrado.";
  if (!isAdminUser()) return "Solo administracion puede modificar pedidos.";
  if (![ORDER_STATUS.PENDING, ORDER_STATUS.COMMERCIAL_APPROVAL, ORDER_STATUS.READY, ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status)) {
    return "Solo se editan pedidos antes del despacho. Los pedidos despachados requieren devolucion o ajuste auditado.";
  }
  return "";
}

function canEditOrder(order) {
  return !orderEditBlockedReason(order);
}

function productOptionHtml(selectedCode, selectedName) {
  const selectedKey = String(selectedCode || selectedName || "");
  return state.products.map((product) => {
    const code = product.codigo_producto || "";
    const selected = selectedKey === code || normalizeSearchText(selectedName) === normalizeSearchText(product.name);
    return `<option value="${escapeHtml(code || product.name)}" ${selected ? "selected" : ""}>${escapeHtml(product.name)}${code ? ` (${escapeHtml(code)})` : ""}</option>`;
  }).join("");
}

function resolveOrderEditProduct(value) {
  return state.products.find((product) => product.codigo_producto === value)
    || state.products.find((product) => product.name === value)
    || state.products[0]
    || null;
}

function orderEditProductKey(item) {
  return String(item && (item.productCode || item.name) || "");
}

function orderEditCurrentProductPrice(item) {
  const product = resolveOrderEditProduct(orderEditProductKey(item));
  return product ? productPriceForUser(product) : numeric(item && item.unitPrice, 0);
}

function orderEditLineSubtotal(item) {
  const qty = Math.max(1, numeric(item && item.qty, 1));
  const unitPrice = Math.max(0, numeric(item && item.unitPrice, 0));
  const discountPct = Math.min(100, Math.max(0, numeric(item && item.discountPct, 0)));
  return Math.max(0, qty * unitPrice * (1 - discountPct / 100));
}

function renderOrderEditSummary() {
  const container = byId("orderEditSummary");
  if (!container) return;
  const qtyProducts = orderEditDraftItems.length;
  const qtyUnits = orderEditDraftItems.reduce((sum, item) => sum + Math.max(1, numeric(item.qty, 1)), 0);
  const subtotal = orderEditDraftItems.reduce((sum, item) => sum + Math.max(0, numeric(item.qty, 1) * numeric(item.unitPrice, 0)), 0);
  const total = orderEditDraftItems.reduce((sum, item) => sum + orderEditLineSubtotal(item), 0);
  const discount = Math.max(0, subtotal - total);
  const lists = [...new Set(orderEditDraftItems.map((item) => item.priceListName || "Lista vigente"))].join(" / ");
  const order = state.orders.find((item) => item.code === orderEditTargetCode);
  const client = order ? state.clients.find((item) => item.name === order.client) : null;
  const account = client ? clientAccountSummary(client.name, total) : null;
  container.innerHTML = [
    { label: "Productos", value: qtyProducts },
    { label: "Unidades", value: qtyUnits },
    { label: "Subtotal", value: money.format(subtotal) },
    { label: "Descuento", value: money.format(discount) },
    { label: "Total final", value: money.format(total) },
    { label: "Lista", value: lists || "S/D" },
    { label: "Condicion", value: order && order.paymentMethod || client && client.forma_pago || "S/D" },
    { label: "Saldo CC", value: account ? money.format(account.projectedBalance) : "S/D" }
  ].map((item) => `<article><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(String(item.value))}</strong></article>`).join("");
}

function renderOrderEditItems() {
  const container = byId("orderEditItemsList");
  if (!container) return;
  container.innerHTML = orderEditDraftItems.map((item, index) => `
    <div class="order-edit-row" data-order-edit-row="${index}">
      <label>
        Producto
        <select data-order-edit-product="${index}">${productOptionHtml(item.productCode, item.name)}</select>
      </label>
      <label>
        Cantidad
        <input data-order-edit-qty="${index}" type="number" min="1" step="1" value="${numeric(item.qty, 1)}">
      </label>
      <label>
        Precio unitario
        <input data-order-edit-price="${index}" type="number" min="0" step="0.01" value="${formatDecimalInput(item.unitPrice)}">
      </label>
      <label>
        Descuento %
        <input data-order-edit-discount="${index}" type="number" min="0" max="100" step="0.01" value="${formatDecimalInput(item.discountPct || 0)}">
      </label>
      <div class="order-edit-money">
        <span>Subtotal</span>
        <strong>${money.format(orderEditLineSubtotal(item))}</strong>
        ${Math.round(orderEditCurrentProductPrice(item)) !== Math.round(numeric(item.unitPrice, 0)) ? "<small>Precio historico</small>" : ""}
      </div>
      <button class="mini-btn danger-btn" type="button" data-order-edit-remove="${index}" ${orderEditDraftItems.length <= 1 ? "disabled" : ""}>Quitar</button>
    </div>
  `).join("");
  renderOrderEditSummary();
}

function syncOrderEditDraftFromDom() {
  orderEditDraftItems = orderEditDraftItems.map((item, index) => {
    const productField = document.querySelector(`[data-order-edit-product="${index}"]`);
    const qtyField = document.querySelector(`[data-order-edit-qty="${index}"]`);
    const priceField = document.querySelector(`[data-order-edit-price="${index}"]`);
    const discountField = document.querySelector(`[data-order-edit-discount="${index}"]`);
    const product = resolveOrderEditProduct(productField ? productField.value : item.productCode || item.name);
    const changedProduct = product && item.productCode && product.codigo_producto !== item.productCode;
    const unitPrice = changedProduct ? productPriceForUser(product) : Math.max(0, numeric(priceField ? priceField.value : item.unitPrice, item.unitPrice || 0));
    const discountPct = Math.min(100, Math.max(0, numeric(discountField ? discountField.value : item.discountPct, 0)));
    return {
      productCode: product ? product.codigo_producto : item.productCode,
      name: product ? product.name : item.name,
      qty: Math.max(1, numeric(qtyField ? qtyField.value : item.qty, 1)),
      unitPrice,
      originalUnitPrice: item.originalUnitPrice || item.unitPrice || unitPrice,
      discountPct,
      lineTotal: Math.max(0, Math.max(1, numeric(qtyField ? qtyField.value : item.qty, 1)) * unitPrice * (1 - discountPct / 100)),
      priceListId: changedProduct && product ? product.priceListId : item.priceListId,
      priceListName: changedProduct && product ? product.priceListName : item.priceListName
    };
  });
  renderOrderEditSummary();
}

function openOrderEditDialog(code) {
  const order = state.orders.find((item) => item.code === code);
  const blockedReason = orderEditBlockedReason(order);
  if (blockedReason) {
    window.alert(blockedReason);
    return;
  }
  orderEditTargetCode = order.code;
  orderEditDraftItems = (order.items || []).map((item) => ({
    productCode: item.productCode || "",
    name: item.name || "",
    qty: item.requestedQty || item.qty || 1,
    unitPrice: Math.max(0, numeric(item.unitPrice ?? item.price, 0)),
    originalUnitPrice: Math.max(0, numeric(item.originalUnitPrice ?? item.unitPrice ?? item.price, 0)),
    discountPct: Math.min(100, Math.max(0, numeric(item.discountPct ?? item.discount ?? item.descuento, 0))),
    lineTotal: Math.max(0, numeric(item.lineTotal ?? item.total, 0)),
    priceListId: item.priceListId || "",
    priceListName: item.priceListName || "Lista vigente"
  }));
  if (!orderEditDraftItems.length && state.products[0]) {
    orderEditDraftItems = [{ productCode: state.products[0].codigo_producto, name: state.products[0].name, qty: 1, unitPrice: productPriceForUser(state.products[0]), discountPct: 0, priceListId: state.products[0].priceListId, priceListName: state.products[0].priceListName }];
  }
  byId("orderEditTitle").textContent = `${order.code} - ${order.client}`;
  byId("orderEditObservation").value = order.observations || order.observaciones || "";
  byId("orderEditMotive").value = "";
  byId("orderEditMessage").textContent = "";
  renderOrderEditItems();
  byId("orderEditDialog").showModal();
}

async function submitOrderEdit(event) {
  event.preventDefault();
  syncOrderEditDraftFromDom();
  const motive = byId("orderEditMotive").value.trim();
  if (!motive) {
    byId("orderEditMessage").textContent = "El motivo es obligatorio.";
    return;
  }
  const submit = byId("orderEditSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Guardando...";
  try {
    await postOperationalAction(`api/orders/${encodeURIComponent(orderEditTargetCode)}/edit`, {
      items: orderEditDraftItems,
      observations: byId("orderEditObservation").value,
      motive
    });
    byId("orderEditDialog").close("default");
  } catch (error) {
    byId("orderEditMessage").textContent = error.message || "No se pudo editar el pedido.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Guardar modificacion";
  }
}

function openOrderLabelDialog(code) {
  const order = state.orders.find((item) => item.code === code);
  if (!canOpenLabelDialog(order)) {
    window.alert("La etiqueta se genera con el pedido en En Armado, Etiquetado o Listo para Despacho.");
    return;
  }
  const label = orderLabelFields(order);
  orderLabelTargetCode = order.code;
  byId("orderLabelCode").value = order.code;
  byId("orderLabelTitle").textContent = `Pedido ${formatAssemblyPedidoNumber(order.code)} - ${order.client}`;
  byId("orderLabelAssemblyOrder").value = label.assemblyOrderNumber > 0 ? label.assemblyOrderNumber : "";
  byId("orderLabelPackages").value = label.packages > 0 ? label.packages : 1;
  byId("orderLabelPrinter").value = label.printer || localStorage.getItem("dlLabelPrinter") || "";
  byId("orderLabelObservations").value = label.observations || "";
  byId("orderLabelMessage").textContent = "";
  const packageLabels = orderPackageLabels(order);
  const firstPackageLabel = packageLabels[0] || { packageNumber: 1, totalPackages: label.packages || 1 };
  byId("orderLabelPreview").innerHTML = `
    <div class="label-preview-head">
      <strong>Pedido ${escapeHtml(label.displayOrderCode)}</strong>
      <div class="label-preview-metrics" aria-label="Orden de armado y cantidad de bultos">
        <span><small>Orden de Armado</small><b>${escapeHtml(formatAssemblyOrderNumber(label))}</b></span>
        <i aria-hidden="true"></i>
        <span><small>Bultos</small><b>${escapeHtml(String(firstPackageLabel.packageNumber))}/${escapeHtml(String(firstPackageLabel.totalPackages))}</b></span>
      </div>
    </div>
    <p><span class="tag ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span></p>
    <p>${escapeHtml(order.client)} - ${escapeHtml(label.address || "Sin direccion")}</p>
    <p>Telefono: ${escapeHtml(label.phone || "S/D")} - Zona/Ruta: ${escapeHtml(label.zone)}</p>
    <div class="smart-label-preview-grid">
      ${packageLabels.map((packageLabel) => `
        <article>
          <strong>BULTO ${escapeHtml(String(packageLabel.packageNumber))}/${escapeHtml(String(packageLabel.totalPackages))}</strong>
          <small>${escapeHtml(formatLabelHumanCode(packageLabel.scanCode))}</small>
        </article>
      `).join("")}
    </div>
    ${code39Svg(packageLabels[0]?.scanCode || label.scanCode || order.code, { height: 64, narrow: 2, wide: 5, quiet: 12, caption: formatLabelHumanCode(packageLabels[0]?.scanCode || label.scanCode || order.code) })}
  `;
  byId("orderLabelDialog").showModal();
  window.setTimeout(() => byId("orderLabelPackages").focus(), 50);
}

async function submitOrderLabel(event) {
  event.preventDefault();
  const submitter = event.submitter;
  const print = submitter && submitter.dataset.labelAction === "print";
  const packages = Math.floor(numeric(byId("orderLabelPackages").value, 0));
  const assemblyOrderNumber = Math.floor(numeric(byId("orderLabelAssemblyOrder").value, 0));
  if (assemblyOrderNumber <= 0) {
    byId("orderLabelMessage").textContent = "Confirmar numero de orden de armado mayor a cero.";
    return;
  }
  if (packages <= 0) {
    byId("orderLabelMessage").textContent = "Confirmar cantidad de bultos mayor a cero.";
    return;
  }
  const printer = byId("orderLabelPrinter").value.trim();
  if (printer) safeLocalStorageSet("dlLabelPrinter", printer, 4000);
  const buttons = byId("orderLabelForm").querySelectorAll("button");
  buttons.forEach((button) => { button.disabled = true; });
  byId("orderLabelMessage").textContent = print ? "Generando etiqueta e imprimiendo..." : "Marcando etiqueta generada...";
  try {
    const payload = await postOperationalAction(`api/orders/${encodeURIComponent(orderLabelTargetCode)}/label`, {
      assemblyOrderNumber,
      packages,
      printer,
      observations: byId("orderLabelObservations").value.trim(),
      printed: print
    });
    if (print) printOrderLabel(payload.order);
    byId("orderLabelDialog").close("default");
  } catch (error) {
    byId("orderLabelMessage").textContent = error.message || "No se pudo generar la etiqueta.";
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function openOrderScanDialog(code) {
  const order = state.orders.find((item) => item.code === code);
  if (!canOpenScanDialog(order)) {
    window.alert("Primero generar etiqueta y confirmar bultos.");
    return;
  }
  const label = orderLabelFields(order);
  const packageLabels = orderPackageLabels(order);
  const pending = packageLabels.filter((packageLabel) => !packageLabel.scanned);
  orderScanTargetCode = order.code;
  byId("orderScanCode").value = order.code;
  byId("orderScanTitle").textContent = `Pedido ${formatAssemblyPedidoNumber(order.code)} - ${order.client}`;
  byId("orderScanValue").value = "";
  byId("orderScanMessage").textContent = "";
  byId("orderScanTarget").innerHTML = `
    <strong>Escanear bultos pendientes: ${escapeHtml(String(pending.length || packageLabels.length))}/${escapeHtml(String(packageLabels.length))}</strong>
    <span>${escapeHtml(label.client)} - tambien acepta ${escapeHtml(label.scanCode || order.code)} para validar todos los bultos.</span>
    <div class="smart-label-preview-grid">
      ${packageLabels.map((packageLabel) => `
        <article class="${packageLabel.scanned ? "ok" : ""}">
          <strong>BULTO ${escapeHtml(String(packageLabel.packageNumber))}/${escapeHtml(String(packageLabel.totalPackages))}</strong>
          <small>${escapeHtml(packageLabel.scanned ? "Escaneado" : formatLabelHumanCode(packageLabel.scanCode))}</small>
        </article>
      `).join("")}
    </div>
    ${code39Svg((pending[0] || packageLabels[0])?.scanCode || label.scanCode || order.code, { height: 64, narrow: 2, wide: 5, quiet: 12, caption: formatLabelHumanCode((pending[0] || packageLabels[0])?.scanCode || label.scanCode || order.code) })}
  `;
  const dialog = byId("orderScanDialog");
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => byId("orderScanValue").focus(), 80);
}

async function submitOrderScan(event) {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  byId("orderScanMessage").textContent = "Validando scanner...";
  try {
    const payload = await postOperationalAction(`api/orders/${encodeURIComponent(orderScanTargetCode)}/scan`, {
      scanValue: byId("orderScanValue").value.trim()
    });
    if (payload.pendingPackages > 0) {
      byId("orderScanMessage").textContent = `Bulto registrado. Faltan ${payload.pendingPackages} por escanear.`;
      const refreshed = state.orders.find((item) => item.code === orderScanTargetCode);
      if (refreshed) openOrderScanDialog(refreshed.code);
    } else {
      byId("orderScanDialog").close("default");
      window.alert("Etiquetas validadas. Pedido listo para despacho.");
    }
  } catch (error) {
    byId("orderScanMessage").textContent = error.message || "No se pudo validar el scanner.";
    byId("orderScanValue").select();
  } finally {
    submit.disabled = false;
  }
}

function populateSellerOptions(selectId) {
  const select = byId(selectId);
  if (!select) return;
  select.innerHTML = state.sellers.map((seller) => `
    <option value="${escapeHtml(seller.name)}">${escapeHtml(seller.name)}</option>
  `).join("");
}

function populateStockEntryOptions() {
  const productSelect = byId("stockEntryProductSelect");
  const supplierSelect = byId("stockEntrySupplierSelect");
  if (productSelect) {
    productSelect.innerHTML = state.products.map((product) => `
      <option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</option>
    `).join("");
  }
  if (supplierSelect) {
    supplierSelect.innerHTML = [
      '<option value="Sin proveedor">Sin proveedor / ajuste</option>',
      ...state.suppliers.map((supplier) => `
        <option value="${escapeHtml(supplier.name)}">${escapeHtml(supplier.name)}</option>
      `)
    ].join("");
  }
}

function clientIdentity(client) {
  return String(client && (client.codigo_cliente || client.name || client.nombre_comercial) || "");
}

function findClientForEdit(id) {
  const normalized = normalizeSearchText(id);
  return state.clients.find((client) => (
    normalizeSearchText(client.codigo_cliente) === normalized
    || normalizeSearchText(client.name) === normalized
    || normalizeSearchText(client.nombre_comercial) === normalized
  )) || null;
}

function setClientDialogMode(mode, client) {
  const isEdit = mode === "edit";
  clientEditTargetId = isEdit && client ? clientIdentity(client) : "";
  byId("clientDialogTitle").textContent = isEdit ? `Editar cliente - ${client.name}` : "Nuevo cliente";
  byId("clientSubmitBtn").textContent = isEdit ? "Guardar modificacion" : "Guardar cliente";
  const motive = byId("clientChangeMotive");
  if (motive) {
    motive.required = isEdit;
    motive.value = "";
  }
  const passwordField = byId("clientAdminPasswordField");
  const password = byId("clientAdminPassword");
  if (passwordField) passwordField.hidden = !isEdit;
  if (password) {
    password.required = isEdit;
    password.value = "";
  }
  const limit = byId("clientCreditLimitInput");
  if (limit) {
    limit.disabled = isEdit && !isAdminUser();
    limit.title = limit.disabled ? "Solo Administracion puede editar el limite de credito." : "";
  }
}

function setFormValue(form, name, value) {
  const field = form.elements[name];
  if (!field) return;
  field.value = value ?? "";
}

function openNewClientDialog() {
  populateSellerOptions("clientSellerSelect");
  const form = byId("clientForm");
  form.reset();
  setClientDialogMode("new", null);
  byId("clientDialog").showModal();
}

function openClientEditDialog(id) {
  const client = findClientForEdit(id);
  if (!client) {
    window.alert("Cliente no encontrado para editar.");
    return;
  }
  populateSellerOptions("clientSellerSelect");
  const form = byId("clientForm");
  form.reset();
  setFormValue(form, "codigo_cliente", client.codigo_cliente);
  setFormValue(form, "nombre_comercial", client.name);
  setFormValue(form, "razon_social", client.razon_social);
  setFormValue(form, "cuit", client.cuit);
  setFormValue(form, "condicion_fiscal", client.condicion_fiscal);
  setFormValue(form, "domicilio", client.domicilio);
  setFormValue(form, "localidad", client.localidad);
  setFormValue(form, "telefono", client.telefono);
  setFormValue(form, "email", client.email);
  setFormValue(form, "horario_atencion", client.horario_atencion);
  setFormValue(form, "latitud", client.latitud ?? "");
  setFormValue(form, "longitud", client.longitud ?? "");
  setFormValue(form, "tipo_cliente", client.tipo_cliente);
  setFormValue(form, "zona", client.zone || client.zona);
  setFormValue(form, "condicion_comercial", client.condicion_comercial);
  setFormValue(form, "ruta", client.ruta);
  setFormValue(form, "vendedor_asignado", client.seller || client.vendedor_asignado);
  setFormValue(form, "forma_pago", client.forma_pago);
  setFormValue(form, "dias_credito", client.dias_credito);
  setFormValue(form, "limite_credito", client.limit);
  setFormValue(form, "saldo_inicial", client.balance);
  setFormValue(form, "dia_visita", client.dia_visita);
  setFormValue(form, "frecuencia_visita", client.frecuencia_visita);
  setFormValue(form, "estado", client.status);
  setFormValue(form, "observaciones", client.observaciones);
  setClientDialogMode("edit", client);
  byId("clientDialog").showModal();
}

function clientFormPayload(form) {
  return {
    codigo_cliente: String(form.get("codigo_cliente") || "").trim(),
    nombre_comercial: String(form.get("nombre_comercial") || "").trim(),
    razon_social: String(form.get("razon_social") || "").trim(),
    cuit: String(form.get("cuit") || "").trim(),
    condicion_fiscal: String(form.get("condicion_fiscal") || "Cons.Final").trim(),
    domicilio: String(form.get("domicilio") || "").trim(),
    localidad: String(form.get("localidad") || "").trim(),
    telefono: String(form.get("telefono") || "").trim(),
    email: String(form.get("email") || "").trim(),
    horario_atencion: String(form.get("horario_atencion") || "").trim(),
    latitud: form.get("latitud") === "" ? null : Number(form.get("latitud")),
    longitud: form.get("longitud") === "" ? null : Number(form.get("longitud")),
    tipo_cliente: String(form.get("tipo_cliente") || "OTROS").trim(),
    zona: String(form.get("zona") || "Sin zona").trim(),
    ruta: String(form.get("ruta") || "").trim(),
    vendedor_asignado: String(form.get("vendedor_asignado") || ""),
    forma_pago: String(form.get("forma_pago") || "Contado"),
    condicion_comercial: String(form.get("condicion_comercial") || "").trim(),
    dias_credito: Math.max(0, Number(form.get("dias_credito") || 0)),
    limite_credito: Math.max(0, Number(form.get("limite_credito") || 0)),
    saldo_inicial: Math.max(0, Number(form.get("saldo_inicial") || 0)),
    dia_visita: String(form.get("dia_visita") || "").trim(),
    frecuencia_visita: String(form.get("frecuencia_visita") || "").trim(),
    estado: String(form.get("estado") || "Activo"),
    observaciones: String(form.get("observaciones") || "").trim(),
    motivo: String(form.get("motivo_cambio") || "").trim()
  };
}

async function submitClientEdit(formElement, formData) {
  const payload = clientFormPayload(formData);
  if (!payload.nombre_comercial) {
    window.alert("Completar nombre comercial.");
    return false;
  }
  if (!payload.motivo) {
    window.alert("Para editar un cliente se debe indicar motivo del cambio.");
    byId("clientChangeMotive").focus();
    return false;
  }
  const adminPassword = String(formData.get("admin_password") || "").trim();
  if (!adminPassword) {
    window.alert("Para editar un cliente se debe reingresar la clave de administrador.");
    byId("clientAdminPassword").focus();
    return false;
  }
  payload.admin_password = adminPassword;
  try {
    await postOperationalAction(`api/clients/${encodeURIComponent(clientEditTargetId)}/edit`, payload);
    clientEditTargetId = "";
    formElement.reset();
    byId("clientDialog").close("default");
    return true;
  } catch (error) {
    window.alert(error.message || "No se pudo editar el cliente.");
    return false;
  }
}

function addClientFromForm(form) {
  const name = String(form.get("nombre_comercial") || "").trim();
  if (!name) return false;
  const code = String(form.get("codigo_cliente") || "").trim();
  if (code && state.clients.some((client) => client.codigo_cliente === code)) {
    window.alert("Ese codigo de cliente ya existe.");
    return false;
  }
  if (state.clients.some((client) => client.name.toLowerCase() === name.toLowerCase())) {
    window.alert("Ese nombre comercial ya existe.");
    return false;
  }
  const client = normalizeClientRecord({
    codigo_cliente: code,
    nombre_comercial: name,
    razon_social: String(form.get("razon_social") || name).trim(),
    cuit: String(form.get("cuit") || "").trim(),
    condicion_fiscal: String(form.get("condicion_fiscal") || "Cons.Final"),
    domicilio: String(form.get("domicilio") || "").trim(),
    localidad: String(form.get("localidad") || "").trim(),
    telefono: String(form.get("telefono") || "").trim(),
    email: String(form.get("email") || "").trim(),
    forma_pago: String(form.get("forma_pago") || "Contado"),
    condicion_comercial: String(form.get("condicion_comercial") || "").trim(),
    dias_credito: Math.max(0, Number(form.get("dias_credito") || 0)),
    limite_credito: Math.max(0, Number(form.get("limite_credito") || 0)),
    saldo_inicial: Math.max(0, Number(form.get("saldo_inicial") || 0)),
    tipo_cliente: String(form.get("tipo_cliente") || "OTROS").trim(),
    zona: String(form.get("zona") || "Sin zona").trim() || "Sin zona",
    ruta: String(form.get("ruta") || "").trim(),
    vendedor_asignado: String(form.get("vendedor_asignado") || ""),
    dia_visita: String(form.get("dia_visita") || "").trim(),
    frecuencia_visita: String(form.get("frecuencia_visita") || "").trim(),
    estado: String(form.get("estado") || "Activo"),
    horario_atencion: String(form.get("horario_atencion") || "").trim(),
    latitud: form.get("latitud") === "" ? null : Number(form.get("latitud")),
    longitud: form.get("longitud") === "" ? null : Number(form.get("longitud")),
    observaciones: String(form.get("observaciones") || "").trim(),
    origen: "manual"
  });
  state.clients.unshift(client);
  if (client.balance > 0) {
    state.accounts.unshift({
      date: "03/06",
      type: "Saldo inicial",
      account: client.name,
      method: "Cuenta corriente",
      debit: client.balance,
      credit: 0,
      balance: client.balance
    });
  }
  state.activity.unshift({ type: "Clientes", title: `${client.name} cargado`, text: `Alta manual asignada a ${client.seller || "sin vendedor"}.` });
  mobileClient = client.name;
  if (client.seller) mobileSeller = client.seller;
  saveState();
  renderForCurrentUser();
  return true;
}

function addProductFromForm(form) {
  const name = String(form.get("descripcion") || "").trim();
  if (!name) return false;
  const code = String(form.get("codigo_producto") || "").trim();
  if (code && state.products.some((product) => product.codigo_producto === code)) {
    window.alert("Ese codigo de producto ya existe.");
    return false;
  }
  if (state.products.some((product) => product.name.toLowerCase() === name.toLowerCase())) {
    window.alert("Ese producto ya existe.");
    return false;
  }
  const activeList = activePriceList();
  const product = normalizeProductRecord({
    codigo_producto: code,
    codigo_barras: String(form.get("codigo_barras") || "").trim(),
    descripcion: name,
    rubro: String(form.get("rubro") || "S/D").trim(),
    marca: String(form.get("marca") || "S/D").trim(),
    familia: String(form.get("familia") || "S/D").trim(),
    segmento: String(form.get("segmento") || "S/D").trim(),
    stock_actual: Math.max(0, Number(form.get("stock_actual") || 0)),
    stock_minimo: Math.max(0, Number(form.get("stock_minimo") || 0)),
    bultos: String(form.get("bultos") || "").trim(),
    costo: Math.max(0, Number(form.get("costo") || 0)),
    precio_lista_1: Math.max(0, Number(form.get("precio_lista_1") || 0)),
    precio_lista_2: Math.max(0, Number(form.get("precio_lista_2") || 0)),
    precio_lista_3: Math.max(0, Number(form.get("precio_lista_3") || 0)),
    precio_lista_4: Math.max(0, Number(form.get("precio_lista_4") || 0)),
    precio_lista_5: Math.max(0, Number(form.get("precio_lista_5") || 0)),
    priceListId: activeList && activeList.id || "",
    priceListName: activeList && activeList.name || "Lista vigente",
    priceUpdatedAt: new Date().toISOString(),
    priceUpdatedBy: currentUser && currentUser.name || "Administracion",
    iva: Math.max(0, Number(form.get("iva") || 0)),
    bonificacion: String(form.get("bonificacion") || "").trim(),
    activo: String(form.get("activo") || "SI"),
    origen: "manual"
  });
  state.products.unshift(product);
  const auditRows = priceListAuditEntries({}, product, "Alta de producto");
  if (auditRows.length) {
    state.priceListAudit = Array.isArray(state.priceListAudit) ? state.priceListAudit : [];
    state.priceListAudit.unshift(...auditRows);
    state.priceListAudit = state.priceListAudit.slice(0, 10000);
  }
  if (activeList) {
    activeList.items = Array.isArray(activeList.items) ? activeList.items : [];
    activeList.items.unshift(priceListItemFromProduct(product));
    activeList.productCount = activeList.items.length;
    activeList.updatedAt = new Date().toISOString();
    activeList.updatedBy = currentUser && currentUser.name || "Administracion";
  }
  state.stockMovements.unshift({ type: "Alta", title: product.name, text: `Producto nuevo cargado con stock inicial ${product.stock}.` });
  state.activity.unshift({ type: "Stock", title: "Producto nuevo", text: `${product.name} ya esta disponible para preventa.` });
  saveState();
  renderForCurrentUser();
  return true;
}

async function addManualStockEntry(form) {
  const productName = String(form.get("product") || "");
  const product = state.products.find((item) => item.name === productName);
  if (!product) return false;
  const qty = Math.max(1, Number(form.get("qty") || 0));
  const supplier = String(form.get("supplier") || "Sin proveedor");
  const movementType = String(form.get("movement_type") || "Ingreso");
  const note = String(form.get("note") || "").trim();
  return postOperationalAction("api/stock/entry", {
    productCode: product.codigo_producto,
    product: product.name,
    qty,
    supplier,
    movementType,
    note
  });
}

function setMobileClientFormOpen(open) {
  const form = byId("mobileClientForm");
  const button = byId("toggleMobileClientFormBtn");
  if (!form || !button) return;
  mobilePreventaTab = open ? "client" : "order";
  renderMobilePreventaTabs();
  button.textContent = "Cliente nuevo";
  renderMobileNewClientGpsStatus();
  if (open) byId("mobileNewClientName").focus();
}

function clearMobileClientForm() {
  ["mobileNewClientName", "mobileNewClientBusinessName", "mobileNewClientTaxId", "mobileNewClientAddress", "mobileNewClientCity", "mobileNewClientPhone", "mobileNewClientRoute", "mobileNewClientSellerPassword"].forEach((id) => {
    const field = byId(id);
    if (field) field.value = "";
  });
  const consumerFinal = byId("mobileNewClientConsumerFinal");
  if (consumerFinal) consumerFinal.checked = false;
  const taxField = byId("mobileNewClientTaxId");
  if (taxField) taxField.disabled = false;
  const zone = byId("mobileNewClientZone");
  if (zone) zone.value = "";
  const visitDay = byId("mobileNewClientVisitDay");
  if (visitDay) visitDay.value = "";
  byId("mobileNewClientPayment").value = "Contado";
  byId("mobileNewClientLimit").value = "0";
  mobileNewClientLocation = null;
  renderMobileNewClientGpsStatus();
}

function renderMobileNewClientGpsStatus() {
  const title = byId("mobileNewClientGpsTitle");
  const status = byId("mobileNewClientGpsStatus");
  if (!title || !status) return;
  if (!mobileNewClientLocation) {
    title.textContent = "GPS pendiente";
    status.textContent = "Registrar la ubicacion actual del cliente antes de guardar.";
    return;
  }
  title.textContent = "GPS registrado";
  status.textContent = `${mobileNewClientLocation.lat.toFixed(5)}, ${mobileNewClientLocation.lng.toFixed(5)} - precision ${Math.round(Number(mobileNewClientLocation.accuracy || 0))} m`;
}

function waitForNativeSellerLocation(previousAt = "", timeoutMs = 4500) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const location = lastOwnLocation && lastOwnLocation.seller === mobileSeller ? lastOwnLocation.location : null;
      if (location && (!previousAt || location.at !== previousAt)) {
        clearInterval(timer);
        resolve(location);
      } else if (Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve(location || null);
      }
    }, 250);
  });
}

async function captureCurrentSellerGpsForClient() {
  const previousAt = lastOwnLocation && lastOwnLocation.seller === mobileSeller && lastOwnLocation.location ? lastOwnLocation.location.at : "";
  if (window.AndroidLocation && typeof window.AndroidLocation.start === "function") {
    window.AndroidLocation.start(`CLIENTE:${mobileSeller}`);
    const nativeLocation = await waitForNativeSellerLocation(previousAt);
    if (nativeLocation && !gpsClientRejectReason(nativeLocation)) return nativeLocation;
  }
  if (canUseBrowserGeolocation() && "geolocation" in navigator) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = makeLocationPayload(position.coords.latitude, position.coords.longitude, position.coords.accuracy, "gps", {
          speed: position.coords.speed,
          heading: position.coords.heading
        });
        const rejectReason = gpsClientRejectReason(location);
        if (rejectReason) reject(new Error(rejectReason));
        else resolve(location);
      }, (error) => reject(new Error(error.message || "No se pudo obtener GPS del dispositivo.")), {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      });
    });
  }
  const fallback = lastOwnLocation && lastOwnLocation.seller === mobileSeller ? lastOwnLocation.location : null;
  if (fallback && !gpsClientRejectReason(fallback)) return fallback;
  throw new Error("GPS no disponible. Usar APK o HTTPS y otorgar permiso de ubicacion precisa.");
}

async function registerMobileClientLocation() {
  const button = byId("registerMobileClientLocationBtn");
  const previousText = button ? button.textContent : "";
  if (button) {
    button.disabled = true;
    button.textContent = "Tomando GPS...";
  }
  try {
    mobileNewClientLocation = await captureCurrentSellerGpsForClient();
    renderMobileNewClientGpsStatus();
    showCompactNotice("Ubicacion del cliente registrada.", "ok");
  } catch (error) {
    mobileNewClientLocation = null;
    renderMobileNewClientGpsStatus();
    window.alert(error.message || "No se pudo registrar la ubicacion del cliente.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText || "Registrar ubicacion actual";
    }
  }
}

async function addMobileClientFromQuickForm() {
  const name = byId("mobileNewClientName").value.trim();
  if (!name) {
    window.alert("Completar el nombre comercial del cliente.");
    byId("mobileNewClientName").focus();
    return;
  }
  const businessName = byId("mobileNewClientBusinessName").value.trim();
  const taxId = byId("mobileNewClientTaxId").value.trim();
  const consumerFinal = byId("mobileNewClientConsumerFinal").checked;
  if (!consumerFinal && !taxId) {
    window.alert("Completar CUIT/CUIL o marcar Consumidor Final.");
    byId("mobileNewClientTaxId").focus();
    return;
  }
  const address = byId("mobileNewClientAddress").value.trim();
  const city = byId("mobileNewClientCity").value.trim();
  const phone = byId("mobileNewClientPhone").value.trim();
  if (!phone) {
    window.alert("El telefono es obligatorio para dar de alta un cliente desde preventa.");
    byId("mobileNewClientPhone").focus();
    return;
  }
  if (!address) {
    window.alert("La direccion es obligatoria para dar de alta un cliente desde preventa.");
    byId("mobileNewClientAddress").focus();
    return;
  }
  if (!city) {
    window.alert("La localidad es obligatoria para dar de alta un cliente.");
    byId("mobileNewClientCity").focus();
    return;
  }
  const zone = byId("mobileNewClientZone").value.trim();
  if (!zone) {
    window.alert("Seleccionar zona comercial del cliente.");
    byId("mobileNewClientZone").focus();
    return;
  }
  const visitDay = byId("mobileNewClientVisitDay").value.trim();
  if (!visitDay) {
    window.alert("Seleccionar dia de visita del cliente.");
    byId("mobileNewClientVisitDay").focus();
    return;
  }
  const route = byId("mobileNewClientRoute").value.trim();
  if (!route) {
    window.alert("Completar la ruta del cliente.");
    byId("mobileNewClientRoute").focus();
    return;
  }
  const payment = byId("mobileNewClientPayment").value.trim();
  if (!payment) {
    window.alert("Seleccionar condicion de pago.");
    byId("mobileNewClientPayment").focus();
    return;
  }
  const limitField = byId("mobileNewClientLimit");
  if (limitField.value === "") {
    window.alert("Completar limite de credito. Puede ser 0 si corresponde.");
    limitField.focus();
    return;
  }
  const sellerPassword = byId("mobileNewClientSellerPassword").value;
  if (!sellerPassword) {
    window.alert("Reingresar la clave del preventista para guardar el cliente.");
    byId("mobileNewClientSellerPassword").focus();
    return;
  }
  if (!mobileNewClientLocation) {
    window.alert("Registrar la ubicacion GPS actual del cliente antes de guardar.");
    return;
  }
  if (state.clients.some((client) => client.name.toLowerCase() === name.toLowerCase())) {
    window.alert("Ese cliente ya esta cargado. Seleccionalo desde el desplegable.");
    return;
  }
  const button = byId("saveMobileClientBtn");
  const previousText = button ? button.textContent : "";
  if (button) {
    button.disabled = true;
    button.textContent = "Registrando...";
  }
  try {
    const payload = await postOperationalAction("api/clients/mobile", {
    codigo_cliente: `PEND-${Date.now()}`,
    nombre_comercial: name,
    razon_social: businessName || name,
    cuit: taxId,
    consumidor_final: consumerFinal,
    condicion_fiscal: consumerFinal ? "Cons.Final" : "Responsable Inscripto",
      domicilio: address,
      localidad: city,
      telefono: phone,
    forma_pago: payment,
    condicion_comercial: payment,
    dias_credito: 0,
    limite_credito: Math.max(0, Number(limitField.value || 0)),
    saldo_inicial: 0,
    tipo_cliente: "Preventa",
    zona: zone,
    ruta: route,
    vendedor_asignado: mobileSeller,
      dia_visita: visitDay,
      frecuencia_visita: "Semanal",
      estado: "Activo",
    observaciones: "Alta rapida desde celular",
      latitud: mobileNewClientLocation.lat,
      longitud: mobileNewClientLocation.lng,
      gpsAccuracy: mobileNewClientLocation.accuracy,
      gps: mobileNewClientLocation,
    horario_atencion: "",
    origen: "preventa",
    preventistaPassword: sellerPassword,
    device: sessionDevice
    });
    const client = payload.client || state.clients.find((item) => item.name === name);
    mobileClient = client ? client.name : name;
    clearMobileClientForm();
    setMobileClientFormOpen(false);
    renderForCurrentUser();
    showCompactNotice(`${mobileClient} ya esta disponible para vender.`, "ok");
  } catch (error) {
    window.alert(error.message || "No se pudo guardar el cliente en el servidor.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText || "Guardar cliente";
    }
  }
}

function addSelectedMobileProduct() {
  const product = state.products.find((item) => item.name === mobileProduct);
  if (!product) return;
  const qtyInput = byId("mobileProductQty");
  const qty = Math.max(1, Number(qtyInput.value || 1));
  mobileCart[product.name] = Math.max(0, Number(mobileCart[product.name] || 0)) + qty;
  qtyInput.value = "1";
  renderMobileCart();
  renderMobileSummary();
  renderMobileProductInfo();
}

function resetMobileOrderForm(previousClientName = "") {
  mobileCart = {};
  const seller = state.sellers.find((item) => item.name === mobileSeller) || state.sellers[0];
  const nextClient = getMobileClientOptions(seller || {}).find((client) => client.name !== previousClientName)
    || getMobileClientOptions(seller || {})[0]
    || state.clients[0]
    || null;
  mobileClient = nextClient ? nextClient.name : "";
  mobileProduct = state.products[0] ? state.products[0].name : "";
  ["mobileProductSearch", "mobileClientSearch"].forEach((id) => {
    const field = byId(id);
    if (field) field.value = "";
  });
  const qtyInput = byId("mobileProductQty");
  if (qtyInput) qtyInput.value = "1";
  clearMobileCommercialRequest();
  setMobilePickerOpen("client", false);
  setMobilePickerOpen("product", false);
  cleanupOperationalLocalData("pedido movil confirmado");
}

async function addMobileOrder() {
  const summary = getCartSummary();
  if (summary.total <= 0) return;
  const client = state.clients.find((item) => item.name === mobileClient);
  if (!client) {
    window.alert("Seleccionar un cliente cargado o usar Cargar cliente.");
    return;
  }
  let authorization = { creditOverride: false };
  try {
    authorization = authorizeCreditIfNeeded(client.name, summary.total);
  } catch (error) {
    window.alert(error.message || "La cuenta corriente requiere autorizacion.");
    return;
  }
  const button = byId("sendMobileOrderBtn");
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = "Registrando...";
  try {
    const commercialRequest = mobileCommercialRequestPayload();
    const observations = byId("mobileOrderObservations") ? byId("mobileOrderObservations").value.trim() : "";
    const payload = await postOperationalAction("api/orders", {
      client: client.name,
      seller: mobileSeller,
      items: summary.lines.map((line) => ({
        productCode: line.product.codigo_producto,
        name: line.product.name,
        qty: line.qty,
        unitPrice: line.product.price,
        price: line.product.price,
        priceListId: line.product.priceListId,
        priceListName: line.product.priceListName
      })),
      paymentMethod: client.forma_pago || "Cuenta corriente",
      observations,
      commercialRequest,
      source: "mobile",
      origin: "preventa",
      priority: "Normal",
      creditOverride: authorization.creditOverride
    });
    resetMobileOrderForm(client.name);
    const order = payload.order;
    window.alert(order.status === ORDER_STATUS.COMMERCIAL_APPROVAL
      ? `${order.code} registrado. Quedo pendiente de aprobacion comercial.`
      : order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0
      ? `${order.code} registrado. Quedo pendiente por faltantes de abastecimiento.`
      : `${order.code} registrado. Quedo en preparacion.`);
    renderForCurrentUser();
  } catch (error) {
    window.alert(error.message || "No se pudo registrar el pedido.");
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

function setNoPurchasePanelOpen(open) {
  const panel = byId("noPurchasePanel");
  const button = byId("openNoPurchaseBtn");
  if (!panel || !button) return;
  panel.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
  button.textContent = open ? "Cerrar sin compra" : "Sin compra";
  if (open) byId("noPurchaseReasonSelect").focus();
}

function renderNoPurchaseObservationRequirement() {
  const reason = byId("noPurchaseReasonSelect")?.value || "";
  const field = byId("noPurchaseObservationField");
  const observation = byId("noPurchaseObservation");
  if (!field || !observation) return;
  const required = reason === "Otros";
  field.hidden = !required;
  observation.required = required;
  if (!required) observation.value = "";
}

function setNoPurchaseMessage(text, tone = "danger") {
  const message = byId("noPurchaseMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

async function submitNoPurchaseVisit() {
  const client = getSelectedMobileClient();
  if (!client) {
    window.alert("Seleccionar un cliente para registrar la visita sin compra.");
    return;
  }
  const reason = byId("noPurchaseReasonSelect").value;
  const observation = byId("noPurchaseObservation").value.trim();
  if (!reason) {
    setNoPurchaseMessage("Seleccionar motivo de no compra.");
    byId("noPurchaseReasonSelect").focus();
    return;
  }
  if (reason === "Otros" && !observation) {
    setNoPurchaseMessage("Para Otros se debe completar observaciones.");
    byId("noPurchaseObservation").focus();
    return;
  }
  const button = byId("submitNoPurchaseBtn");
  const previousText = button ? button.textContent : "";
  if (button) {
    button.disabled = true;
    button.textContent = "Guardando...";
  }
  setNoPurchaseMessage("Tomando GPS y sincronizando...", "info");
  try {
    const gps = await captureCurrentSellerGpsForClient();
    await postOperationalAction("api/preventa/no-purchase", {
      client: client.name,
      seller: mobileSeller,
      workday: mobileWorkday,
      reason,
      observation,
      gps
    });
    byId("noPurchaseReasonSelect").value = "";
    byId("noPurchaseObservation").value = "";
    renderNoPurchaseObservationRequirement();
    setNoPurchasePanelOpen(false);
    setNoPurchaseMessage("");
    showCompactNotice(`Sin compra registrado para ${client.name}.`, "ok");
  } catch (error) {
    setNoPurchaseMessage(error.message || "No se pudo registrar la visita sin compra.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText || "Guardar sin compra";
    }
  }
}

function setDeliveryGpsBadge(text, tone) {
  const badge = byId("deliveryGpsBadge");
  if (!badge) return;
  badge.dataset.tone = tone || "warn";
  badge.innerHTML = `<i></i>${escapeHtml(text)}`;
}

function applyDeliveryLocation(lat, lng, accuracy, source, extra = {}) {
  deliveryLocation = makeLocationPayload(lat, lng, accuracy, source, extra);
  const rejectReason = gpsClientRejectReason(deliveryLocation);
  if (rejectReason) {
    setDeliveryGpsBadge(rejectReason, "danger");
  } else if (deliveryLocation.accuracy > 100) {
    setDeliveryGpsBadge(`GPS baja precision ${deliveryLocation.accuracy} m`, "warn");
  } else {
    setDeliveryGpsBadge(`GPS ${deliveryLocation.accuracy ? `${deliveryLocation.accuracy} m` : "activo"}`, "ok");
  }
  sendPresenceLocation(deliveryLocation).catch(() => {});
}

function startDeliveryLocation(force = false) {
  const now = Date.now();
  if (!force && now - deliveryGpsStartRequestedAt < 5000) return;
  deliveryGpsStartRequestedAt = now;
  setDeliveryGpsBadge("Buscando GPS", "warn");
  if (window.AndroidLocation && typeof window.AndroidLocation.start === "function") {
    if (typeof window.AndroidLocation.startContinuous === "function") {
      window.AndroidLocation.startContinuous(`REPARTO:${deliveryDevice.id}`);
    } else {
      window.AndroidLocation.start(`REPARTO:${deliveryDevice.id}`);
    }
    return;
  }
  if (!canUseBrowserGeolocation() || !("geolocation" in navigator)) {
    setDeliveryGpsBadge("GPS bloqueado", "danger");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    applyDeliveryLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy, "gps", {
      speed: position.coords.speed,
      heading: position.coords.heading
    });
  }, () => {
    setDeliveryGpsBadge("GPS sin permiso", "danger");
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}

function startDeliveryLocationAutoRefresh() {
  const hasNativeContinuous = Boolean(
    window.AndroidLocation
      && typeof window.AndroidLocation.start === "function"
      && typeof window.AndroidLocation.startContinuous === "function"
  );
  startDeliveryLocation(true);
  clearInterval(deliveryGpsRefreshTimer);
  deliveryGpsRefreshTimer = setInterval(() => {
    if (!currentUser || currentUser.role !== "driver") return;
    if (hasNativeContinuous) requestNativeContinuousLocation("delivery-refresh");
    else startDeliveryLocation();
    if (deliveryLocation) sendPresenceLocation(deliveryLocation, true).catch(() => {});
  }, Number(sessionSettings.locationMovingIntervalMs || 10000));
}

function requestActiveRoleGps(reason = "") {
  if (!currentUser) return;
  if (currentUser.role === "driver") {
    startDeliveryLocation();
    if (deliveryLocation) sendPresenceLocation(deliveryLocation, true).catch(() => {});
    return;
  }
  if (currentUser.role === "seller" || document.querySelector("#preventa.view.active")) {
    ensureMandatoryGps(true);
    if (lastOwnLocation && lastOwnLocation.location) sendPresenceLocation(lastOwnLocation.location, true).catch(() => {});
  }
}

async function requireDeliveryLocation() {
  if (deliveryLocation && Date.now() - new Date(deliveryLocation.at).getTime() < 120000) return deliveryLocation;
  startDeliveryLocation(true);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(500);
    if (deliveryLocation) return deliveryLocation;
  }
  throw new Error("No se obtuvo GPS. Revisar permiso de ubicacion del dispositivo.");
}

function deliveryActionBody(gps, extra = {}) {
  return {
    deviceId: deliveryDevice.id,
    deviceLabel: deliveryDevice.label,
    gps,
    ...extra
  };
}

async function uploadDeliveryImage(orderCode, kind, dataUrl) {
  if (!dataUrl) return null;
  const response = await fetchWithTimeout(apiUrl("api/delivery/upload"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ orderCode, kind, dataUrl })
  }, 30000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo guardar una evidencia.");
  return payload.upload;
}

function fileToCompressedDataUrl(file) {
  if (!file) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("La imagen seleccionada no es valida."));
      image.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function fileToEvidenceDataUrl(file) {
  if (!file) return Promise.resolve("");
  const type = String(file.type || "").toLowerCase();
  const isPdf = type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (isPdf) {
    if (file.size > 8 * 1024 * 1024) {
      return Promise.reject(new Error("El PDF del comprobante debe pesar menos de 8 MB."));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer el PDF del comprobante."));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name || "")) {
    return fileToCompressedDataUrl(file);
  }
  return Promise.reject(new Error("El comprobante debe ser una foto, captura PNG/JPG/WEBP o PDF."));
}

function startSellerLocation() {
  if (window.AndroidLocation && typeof window.AndroidLocation.start === "function") {
    const status = byId("locationStatus");
    if (status) status.textContent = "Activando GPS nativo...";
    setGpsBadge("Buscando", "warn");
    if (typeof window.AndroidLocation.startContinuous === "function") {
      window.AndroidLocation.startContinuous(mobileSeller);
    } else {
      window.AndroidLocation.start(mobileSeller);
    }
    return;
  }

  if (!canUseBrowserGeolocation()) {
    const status = byId("locationStatus");
    if (status) {
      status.textContent = "GPS bloqueado por navegador: abrir por HTTPS o usar la APK. Chrome no permite GPS en HTTP.";
    }
    setGpsBadge("Bloqueado", "danger");
    return;
  }

  if (!("geolocation" in navigator)) {
    const status = byId("locationStatus");
    if (status) status.textContent = "Este celular no informa ubicacion.";
    setGpsBadge("Sin GPS", "danger");
    return;
  }
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
  }
  geoWatchId = navigator.geolocation.watchPosition((position) => {
    applyLocationUpdate(position.coords.latitude, position.coords.longitude, position.coords.accuracy, "gps", {
      speed: position.coords.speed,
      heading: position.coords.heading
    });
  }, (error) => {
    const status = byId("locationStatus");
    if (!status) return;
    if (String(error.message || "").includes("Only secure origins")) {
      status.textContent = "GPS bloqueado: esta URL es HTTP. Usar HTTPS por Tailscale Serve o la APK.";
    } else {
      status.textContent = `GPS sin permiso: ${error.message}`;
    }
    setGpsBadge("Revisar", "danger");
  }, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000
  });
}

function ensureMandatoryGps(force = false) {
  const now = Date.now();
  if (!force && now - gpsStartRequestedAt < 5000) return;
  gpsStartRequestedAt = now;
  startSellerLocation();
}

function canUseBrowserGeolocation() {
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  return location.protocol === "https:" || localHosts.has(location.hostname);
}

function applyLocationUpdate(lat, lng, accuracy, source, extra = {}) {
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  if (!seller) return;
  const location = makeLocationPayload(lat, lng, accuracy, source, extra);
  location.updatedAt = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const rejectReason = gpsClientRejectReason(location);
  if (rejectReason) {
    seller.gps = rejectReason;
    showGpsWarning(rejectReason);
    sendPresenceLocation(location, true).catch(() => {});
    return;
  }
  seller.location = location;
  seller.gps = gpsAccuracyWarning(location) || (source === "native" ? "GPS nativo" : "GPS real");
  lastOwnLocation = { seller: mobileSeller, location, gps: seller.gps };
  saveLastOwnLocation();
  if (!isOperationalMobileUser()) renderRoutes();
  renderSellerStatsPanel();
  renderLocationStatus();
  renderDailyRoutePanel();
  renderAssistantGuide();
  sendPresenceLocation(location).catch(() => {});
}

function startSellerLocationAutoRefresh() {
  ensureMandatoryGps(true);
  if (!window.AndroidLocation || typeof window.AndroidLocation.start !== "function") return;
  const hasNativeContinuous = typeof window.AndroidLocation.startContinuous === "function";
  clearInterval(nativeGpsRefreshTimer);
  nativeGpsRefreshTimer = setInterval(() => {
    if (!currentUser || currentUser.role !== "seller") return;
    if (hasNativeContinuous) {
      requestNativeContinuousLocation("seller-refresh");
      if (lastOwnLocation && lastOwnLocation.location) sendPresenceLocation(lastOwnLocation.location, true).catch(() => {});
      return;
    }
    window.AndroidLocation.start(mobileSeller);
  }, Number(sessionSettings.locationMovingIntervalMs || 10000));
}

function preserveSellerLocations(nextState, previousState) {
  const previousByName = new Map((previousState.sellers || []).map((seller) => [seller.name, seller]));
  nextState.sellers = nextState.sellers.map((seller) => {
    const previous = previousByName.get(seller.name);
    if (!previous || !previous.location) return seller;
    if (previous.location.source === "simulada" || previous.location.source === "demo") return seller;
    return {
      ...seller,
      gps: previous.gps || seller.gps,
      location: previous.location
    };
  });
  return nextState;
}

function mergeOwnLocationIntoState() {
  if (!lastOwnLocation || lastOwnLocation.seller !== mobileSeller) return false;
  const seller = state.sellers.find((item) => item.name === mobileSeller);
  if (!seller) return false;
  seller.location = lastOwnLocation.location;
  seller.gps = lastOwnLocation.gps;
  return true;
}

window.receiveNativeLocation = (latOrPayload, lng, accuracy) => {
  const payload = typeof latOrPayload === "object" && latOrPayload !== null
    ? latOrPayload
    : { lat: latOrPayload, lng, accuracy };
  const lat = Number(payload.lat ?? payload.latitude);
  const lon = Number(payload.lng ?? payload.longitude);
  const acc = Number(payload.accuracy || 0);
  const extra = {
    provider: payload.provider || "",
    mock: payload.mock === true || payload.isMock === true || payload.mocked === true,
    battery: payload.battery ?? payload.batteryPct ?? null,
    online: payload.online !== false,
    deviceAt: payload.deviceAt || payload.time || payload.at || new Date().toISOString()
  };
  const loginLocation = makeLocationPayload(lat, lon, acc, "native", extra);
  if (!currentUser) {
    pendingLoginLocation = loginLocation;
    if (pendingLoginLocationResolver) pendingLoginLocationResolver(loginLocation);
    return;
  }
  if (currentUser && currentUser.role === "driver") {
    applyDeliveryLocation(lat, lon, acc, "native", extra);
  } else {
    applyLocationUpdate(lat, lon, acc, "native", extra);
    if (document.querySelector("#reparto.view.active")) applyDeliveryLocation(lat, lon, acc, "native", extra);
  }
};

window.receiveNativeLocationError = (message) => {
  if (!currentUser && pendingLoginLocationResolver) {
    pendingLoginLocationResolver(null);
    return;
  }
  if (currentUser && currentUser.role === "driver") {
    setDeliveryGpsBadge("GPS sin datos", "danger");
    return;
  }
  const status = byId("locationStatus");
  if (status) status.textContent = `GPS nativo sin datos: ${message}`;
  setGpsBadge("Revisar", "danger");
};

byId("loginForm").addEventListener("submit", submitLogin);
byId("toggleLoginPasswordBtn").addEventListener("click", toggleLoginPasswordVisibility);
byId("passwordRecoveryBtn").addEventListener("click", openPasswordRecoveryDialog);
byId("passwordRecoveryForm").addEventListener("submit", submitPasswordRecovery);
byId("loginSupportBtn").addEventListener("click", openSupportWhatsApp);
byId("viewLegalBeforeLoginBtn").addEventListener("click", () => openLegalAcceptanceDialog());
byId("legalAcceptCheckbox").addEventListener("change", (event) => {
  byId("legalAcceptSubmitBtn").disabled = !event.target.checked;
});
byId("legalAcceptanceForm").addEventListener("submit", acceptLegalAndContinue);
byId("logoutBtn").addEventListener("click", logout);
byId("mobileLogoutBtn").addEventListener("click", logout);
byId("appBackBtn").addEventListener("click", navigateBackInApp);
byId("mobileBackBtn").addEventListener("click", navigateBackInApp);
byId("openContextHelpBtn").addEventListener("click", openContextHelp);
byId("mobileContextHelpBtn").addEventListener("click", openContextHelp);
document.querySelectorAll("[data-support-whatsapp]").forEach((button) => {
  button.addEventListener("click", openSupportWhatsApp);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    requestActiveRoleGps("visible");
    pullStateFromServer();
  } else {
    requestNativeContinuousLocation("background");
  }
});
window.addEventListener("focus", () => requestActiveRoleGps("focus"));
window.addEventListener("pagehide", () => requestNativeContinuousLocation("pagehide"));
window.addEventListener("online", () => {
  requestActiveRoleGps("online");
  pullStateFromServer();
});
byId("runDiagnosticsBtn").addEventListener("click", runConnectionDiagnostics);
byId("configureAndroidServerBtn").addEventListener("click", () => {
  if (window.AndroidConnection && typeof window.AndroidConnection.openSettings === "function") {
    window.AndroidConnection.openSettings();
    return;
  }
  window.alert(`La URL de conexion se edita en config.js. Actual: ${getApiBaseUrl()}`);
});
byId("openMapsBtn").addEventListener("click", () => {
  const client = getSelectedMobileClient();
  const destination = getClientMapsQuery(client);
  if (!destination) {
    window.alert("El cliente seleccionado no tiene domicilio para abrir Maps.");
    return;
  }
  const seller = getSelectedMobileSeller();
  const origin = seller && seller.location ? `${seller.location.lat},${seller.location.lng}` : "";
  const url = `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${encodeURIComponent(origin)}` : ""}&destination=${encodeURIComponent(destination)}`;
  if (!openExternalUrl(url, "Google Maps")) {
    window.alert("No se pudo abrir Google Maps desde este dispositivo.");
  }
});
byId("viewRouteFileBtn").addEventListener("click", () => {
  window.alert("Hoja de ruta de administracion pendiente de carga. Ya queda reservado este modulo para adjuntar archivo y tareas diarias.");
});
if (byId("assistantToggleBtn")) {
  byId("assistantToggleBtn").addEventListener("click", () => {
    const card = byId("assistantCard");
    const button = byId("assistantToggleBtn");
    if (!card || !button) return;
    const collapsed = card.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
  });
}
byId("stockProductSearch").addEventListener("input", (event) => {
  stockSearchTerm = event.target.value;
  debouncedRenderStock();
});
byId("stockStatusFilter").addEventListener("change", (event) => {
  stockStatusFilter = event.target.value;
  renderStock();
});
byId("stockRubricFilter").addEventListener("change", (event) => {
  stockRubricFilter = event.target.value;
  renderStock();
});
byId("stockBrandFilter").addEventListener("change", (event) => {
  stockBrandFilter = event.target.value;
  renderStock();
});
byId("clearStockSearchBtn").addEventListener("click", () => {
  stockSearchTerm = "";
  stockStatusFilter = "all";
  stockRubricFilter = "all";
  stockBrandFilter = "all";
  byId("stockProductSearch").value = "";
  byId("stockStatusFilter").value = "all";
  byId("stockRubricFilter").value = "all";
  byId("stockBrandFilter").value = "all";
  renderStock();
});
byId("exportStockCsvBtn").addEventListener("click", exportStockCsv);
byId("exportStockPdfBtn").addEventListener("click", exportStockPdf);
byId("printStockBtn").addEventListener("click", printStockReport);
byId("initialStockBtn").addEventListener("click", openInitialStockDialog);
byId("initialStockFile").addEventListener("change", readInitialStockFile);
byId("previewInitialStockBtn").addEventListener("click", previewInitialStockImport);
byId("clearInitialStockBtn").addEventListener("click", () => {
  initialStockPreviewRows = [];
  byId("initialStockForm").reset();
  byId("initialStockMessage").textContent = "";
  renderInitialStockPreview();
});
byId("initialStockForm").addEventListener("submit", applyInitialStockImport);
byId("stockLedgerSearch").addEventListener("input", (event) => {
  stockLedgerSearchTerm = event.target.value;
  debouncedRenderStock();
});
byId("stockLedgerTypeFilter").addEventListener("change", (event) => {
  stockLedgerTypeFilter = event.target.value;
  renderStockLedger();
});
byId("stockLedgerUserFilter").addEventListener("change", (event) => {
  stockLedgerUserFilter = event.target.value;
  renderStockLedger();
});
byId("stockLedgerDateFilter").addEventListener("change", (event) => {
  stockLedgerDateFilter = event.target.value;
  renderStockLedger();
});
byId("clearStockLedgerFiltersBtn").addEventListener("click", () => {
  stockLedgerSearchTerm = "";
  stockLedgerTypeFilter = "all";
  stockLedgerUserFilter = "all";
  stockLedgerDateFilter = "";
  byId("stockLedgerSearch").value = "";
  byId("stockLedgerTypeFilter").value = "all";
  byId("stockLedgerUserFilter").value = "all";
  byId("stockLedgerDateFilter").value = "";
  renderStockLedger();
});
byId("stockTable").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    openStockEditDialog(editButton.dataset.editProduct);
    return;
  }
  const ledgerButton = event.target.closest("[data-stock-ledger-product]");
  if (ledgerButton) focusStockLedgerProduct(ledgerButton.dataset.stockLedgerProduct);
});
byId("stockEditForm").addEventListener("submit", submitStockEdit);
byId("priceListSearch").addEventListener("input", (event) => {
  priceListSearchTerm = event.target.value;
  debouncedRenderPriceLists();
});
byId("priceListFilterList").addEventListener("change", (event) => {
  priceListListFilter = event.target.value;
  renderPriceLists();
});
byId("priceListRubricFilter").addEventListener("change", (event) => {
  priceListRubricFilter = event.target.value;
  renderPriceLists();
});
byId("priceListBrandFilter").addEventListener("change", (event) => {
  priceListBrandFilter = event.target.value;
  renderPriceLists();
});
byId("priceListSupplierFilter").addEventListener("change", (event) => {
  priceListSupplierFilter = event.target.value;
  renderPriceLists();
});
byId("priceListStatusFilter").addEventListener("change", (event) => {
  priceListStatusFilter = event.target.value;
  renderPriceLists();
});
byId("priceListEffectiveFilter").addEventListener("change", (event) => {
  priceListEffectiveFilter = event.target.value;
  renderPriceLists();
});
byId("clearPriceListFiltersBtn").addEventListener("click", clearPriceListFilters);
byId("priceListOperation").addEventListener("change", () => {
  priceListLastSimulation = null;
  renderPriceListOperationFields();
  renderPriceListSimulation();
});
byId("simulatePriceListBtn").addEventListener("click", simulatePriceListFromForm);
byId("applyPriceListBtn").addEventListener("click", applyPriceListFromForm);
byId("assignSellerPriceListBtn").addEventListener("click", assignSellerPriceListFromPanel);
document.querySelectorAll("[data-maintenance-cleanup]").forEach((button) => {
  button.addEventListener("click", () => runMaintenanceCleanup(button.dataset.maintenanceCleanup));
});
byId("priceListProductsTable").addEventListener("click", (event) => {
  const button = event.target.closest("[data-price-product]");
  if (!button) return;
  const form = byId("priceListForm");
  form.elements.operation.value = "individual";
  form.elements.productKey.value = button.dataset.priceProduct;
  form.elements.fixedPrice.value = "";
  form.elements.increasePct.value = "0";
  form.elements.marginPct.value = "0";
  priceListLastSimulation = null;
  renderPriceListOperationFields();
  byId("priceListForm").scrollIntoView({ behavior: "smooth", block: "start" });
});
byId("commissionRulesSearch").addEventListener("input", (event) => {
  commissionSearchTerm = event.target.value;
  renderCommissionsModule();
});
byId("commissionRoleFilter").addEventListener("change", (event) => {
  commissionRoleFilter = event.target.value;
  renderCommissionsModule();
});
byId("commissionStatusFilter").addEventListener("change", (event) => {
  commissionStatusFilter = event.target.value;
  renderCommissionsModule();
});
byId("commissionRulesTable").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-commission-edit]");
  if (edit) {
    fillCommissionRuleForm(edit.dataset.commissionEdit);
    return;
  }
  const deactivate = event.target.closest("[data-commission-deactivate]");
  if (deactivate) deactivateCommissionRule(deactivate.dataset.commissionDeactivate);
});
byId("saveCommissionRuleBtn").addEventListener("click", () => saveCommissionRule());
byId("resetCommissionFormBtn").addEventListener("click", resetCommissionRuleForm);
byId("exportCommissionsCsvBtn").addEventListener("click", exportCommissionsCsv);
byId("legalPublishForm").addEventListener("submit", submitLegalPublish);
byId("helpSearch").addEventListener("input", (event) => {
  helpSearchTerm = event.target.value;
  renderHelpCenter();
});
byId("helpRoleFilter").addEventListener("change", (event) => {
  helpRoleFilter = event.target.value;
  renderHelpCenter();
});
byId("helpModuleFilter").addEventListener("change", (event) => {
  helpModuleFilter = event.target.value;
  activeHelpTopicId = event.target.value === "all" ? "" : event.target.value;
  renderHelpCenter();
});
byId("helpTopicList").addEventListener("click", (event) => {
  const topic = event.target.closest("[data-help-topic]");
  if (!topic) return;
  activeHelpTopicId = topic.dataset.helpTopic;
  renderHelpCenter();
});
byId("downloadFullHelpManualBtn").addEventListener("click", downloadHelpManual);
byId("physicalStockSearch").addEventListener("input", (event) => {
  physicalStockSearchTerm = event.target.value;
  debouncedRenderPhysicalStockControl();
});
[
  ["physicalStockRubricFilter", "rubric"],
  ["physicalStockBrandFilter", "brand"],
  ["physicalStockSupplierFilter", "supplier"],
  ["physicalStockWarehouseFilter", "warehouse"],
  ["physicalStockUserFilter", "user"],
  ["physicalStockModeFilter", "mode"]
].forEach(([id, key]) => {
  byId(id).addEventListener("change", (event) => {
    if (key === "rubric") physicalStockRubricFilter = event.target.value;
    if (key === "brand") physicalStockBrandFilter = event.target.value;
    if (key === "supplier") physicalStockSupplierFilter = event.target.value;
    if (key === "warehouse") physicalStockWarehouseFilter = event.target.value;
    if (key === "user") physicalStockUserFilter = event.target.value;
    if (key === "mode") physicalStockMode = event.target.value;
    renderPhysicalStockControl();
  });
});
byId("physicalStockDateFilter").addEventListener("change", (event) => {
  physicalStockDateFilter = event.target.value;
  renderPhysicalStockControl();
});
byId("physicalStockReportType").addEventListener("change", (event) => {
  physicalStockReportType = event.target.value;
});
byId("clearPhysicalStockFiltersBtn").addEventListener("click", () => {
  physicalStockSearchTerm = "";
  physicalStockRubricFilter = "all";
  physicalStockBrandFilter = "all";
  physicalStockSupplierFilter = "all";
  physicalStockWarehouseFilter = "all";
  physicalStockDateFilter = "";
  physicalStockUserFilter = "all";
  physicalStockMode = "all";
  byId("physicalStockSearch").value = "";
  byId("physicalStockRubricFilter").value = "all";
  byId("physicalStockBrandFilter").value = "all";
  byId("physicalStockSupplierFilter").value = "all";
  byId("physicalStockWarehouseFilter").value = "all";
  byId("physicalStockDateFilter").value = "";
  byId("physicalStockUserFilter").value = "all";
  byId("physicalStockModeFilter").value = "all";
  renderPhysicalStockControl();
});
byId("startPhysicalStockCountBtn").addEventListener("click", () => {
  physicalStockCountMode = !physicalStockCountMode;
  byId("startPhysicalStockCountBtn").textContent = physicalStockCountMode ? "Cerrar corte" : "Iniciar corte de stock";
  renderPhysicalStockControl();
});
byId("exportPhysicalStockCsvBtn").addEventListener("click", exportPhysicalStockCsv);
byId("exportPhysicalStockPdfBtn").addEventListener("click", exportPhysicalStockPdf);
byId("physicalStockTable").addEventListener("click", (event) => {
  const trace = event.target.closest("[data-view-physical-trace]");
  if (trace) {
    const row = physicalStockRows().find((item) => item.code === trace.dataset.viewPhysicalTrace);
    renderPhysicalStockTrace(row || null);
    return;
  }
  const count = event.target.closest("[data-save-physical-count]");
  if (count) {
    recordPhysicalStockCount(count.dataset.savePhysicalCount);
    return;
  }
  const adjust = event.target.closest("[data-adjust-physical-stock]");
  if (adjust) openPhysicalStockAdjustDialog(adjust.dataset.adjustPhysicalStock);
});
byId("physicalStockAdjustForm").addEventListener("submit", submitPhysicalStockAdjust);

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});
document.querySelectorAll("[data-open-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.openView));
});

const debouncedRenderAll = debounce(renderAll, 180);
const debouncedRenderOrders = debounce(renderOrders, 180);
const debouncedRenderAssemblyDepot = debounce(() => {
  renderAssemblyDepot();
  const search = byId("assemblyDepotSearch");
  if (activeViewId() === "armado" && search) {
    search.focus();
    const end = search.value.length;
    search.setSelectionRange(end, end);
  }
}, 180);
const debouncedRenderClients = debounce(renderClients, 180);
const debouncedRenderAccounts = debounce(renderAccounts, 180);
const debouncedRenderStock = debounce(renderStock, 180);
const debouncedRenderPriceLists = debounce(renderPriceLists, 180);
const debouncedRenderPhysicalStockControl = debounce(renderPhysicalStockControl, 180);
const debouncedRenderSuppliers = debounce(renderSuppliers, 180);
const debouncedRenderAdmin = debounce(renderAdmin, 180);
const debouncedRenderNotificationCenter = debounce(renderNotificationCenter, 180);
const debouncedRenderShortageStats = debounce(renderShortageStats, 180);

document.querySelectorAll("[data-open-notifications]").forEach((button) => {
  button.addEventListener("click", () => setNotificationCenterOpen(byId("notificationCenter").hidden));
});
byId("closeNotificationCenterBtn").addEventListener("click", () => setNotificationCenterOpen(false));
byId("notificationSearch").addEventListener("input", (event) => {
  notificationSearchTerm = event.target.value;
  debouncedRenderNotificationCenter();
});
byId("notificationToneFilter").addEventListener("change", (event) => {
  notificationToneFilter = event.target.value;
  renderNotificationCenter();
});
byId("notificationCategoryFilter").addEventListener("change", (event) => {
  notificationCategoryFilter = event.target.value;
  renderNotificationCenter();
});
byId("markNotificationsReadBtn").addEventListener("click", markVisibleNotificationsRead);
byId("clearNotificationFiltersBtn").addEventListener("click", () => {
  notificationSearchTerm = "";
  notificationToneFilter = "all";
  notificationCategoryFilter = "all";
  byId("notificationSearch").value = "";
  byId("notificationToneFilter").value = "all";
  byId("notificationCategoryFilter").value = "all";
  renderNotificationCenter();
});
byId("ordersSearch").addEventListener("input", (event) => {
  orderSearchTerm = event.target.value;
  orderPage = 1;
  debouncedRenderOrders();
});
byId("ordersQuickFilter").addEventListener("change", (event) => {
  orderQuickFilter = event.target.value;
  orderPage = 1;
  renderOrders();
});
byId("ordersStatusFilter").addEventListener("change", (event) => {
  orderStatusFilter = event.target.value;
  orderPage = 1;
  renderOrders();
});
byId("ordersSellerFilter").addEventListener("change", (event) => {
  orderSellerFilter = event.target.value;
  orderPage = 1;
  renderOrders();
});
byId("ordersUrgencyFilter").addEventListener("change", (event) => {
  orderUrgencyFilter = event.target.value;
  orderPage = 1;
  renderOrders();
});
byId("ordersSort").addEventListener("change", (event) => {
  orderSortKey = event.target.value;
  orderPage = 1;
  renderOrders();
});
byId("clearOrdersFilters").addEventListener("click", () => {
  orderSearchTerm = "";
  orderStatusFilter = "all";
  orderSellerFilter = "all";
  orderUrgencyFilter = "all";
  orderQuickFilter = "all";
  orderSortKey = "created_desc";
  orderPage = 1;
  byId("ordersSearch").value = "";
  byId("ordersQuickFilter").value = "all";
  byId("ordersStatusFilter").value = "all";
  byId("ordersSellerFilter").value = "all";
  byId("ordersUrgencyFilter").value = "all";
  byId("ordersSort").value = "created_desc";
  renderOrders();
});
byId("ordersPager").addEventListener("click", (event) => {
  const button = event.target.closest("[data-orders-page]");
  if (!button || button.disabled) return;
  orderPage = Number(button.dataset.ordersPage || 1);
  renderOrders();
});
byId("ordersSelectPageCheckbox").addEventListener("change", (event) => {
  selectOrders(currentPageOrders, event.target.checked);
});
byId("ordersSelectVisibleBtn").addEventListener("click", () => selectOrders(currentPageOrders, true));
byId("ordersSelectFilteredBtn").addEventListener("click", () => selectOrders(currentFilteredOrders, true));
byId("ordersInvertSelectionBtn").addEventListener("click", invertVisibleOrderSelection);
byId("ordersClearSelectionBtn").addEventListener("click", () => {
  selectedOrderCodes.clear();
  renderOrders();
});
byId("ordersTable").addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-order-select]");
  if (!checkbox) return;
  if (checkbox.checked) selectedOrderCodes.add(checkbox.dataset.orderSelect);
  else selectedOrderCodes.delete(checkbox.dataset.orderSelect);
  renderOrdersBulkPanel();
});
byId("ordersBulkActions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-orders-bulk-action]");
  if (!button || selectedOrderCodes.size <= 0) return;
  button.disabled = true;
  runBulkOrderAction(button.dataset.ordersBulkAction)
    .catch((error) => setOrdersBulkStatus(error.message || "No se pudo completar la operacion masiva.", "danger"))
    .finally(() => { button.disabled = false; });
});
byId("assemblyDepotWorkspace").addEventListener("input", (event) => {
  if (event.target.id !== "assemblyDepotSearch") return;
  assemblyDepotSearchTerm = event.target.value;
  debouncedRenderAssemblyDepot();
});
byId("assemblyDepotWorkspace").addEventListener("change", (event) => {
  if (event.target.id === "assemblyControlSort") {
    assemblyControlSortKey = event.target.value;
    renderAssemblyDepot();
    return;
  }
  if (event.target.id === "assemblyDepotStatusFilter") {
    assemblyDepotStatusFilter = event.target.value;
    renderAssemblyDepot();
    return;
  }
  if (event.target.id === "assemblyDepotUrgencyFilter") {
    assemblyDepotUrgencyFilter = event.target.value;
    renderAssemblyDepot();
    return;
  }
  if (event.target.id === "assemblyDepotOnlyShortages") {
    assemblyDepotOnlyShortages = event.target.checked;
    renderAssemblyDepot();
    return;
  }
  const checkbox = event.target.closest("[data-assembly-select]");
  if (!checkbox) return;
  if (checkbox.checked) selectedOrderCodes.add(checkbox.dataset.assemblySelect);
  else selectedOrderCodes.delete(checkbox.dataset.assemblySelect);
  renderAssemblyDepot();
});
byId("assemblyDepotWorkspace").addEventListener("click", (event) => {
  if (event.target.closest("[data-assembly-clear-filters]")) {
    assemblyDepotSearchTerm = "";
    assemblyDepotStatusFilter = "all";
    assemblyDepotUrgencyFilter = "all";
    assemblyDepotOnlyShortages = false;
    renderAssemblyDepot();
    return;
  }
  if (event.target.closest("[data-assembly-select-visible]")) {
    currentAssemblyDepotOrders.forEach((order) => selectedOrderCodes.add(order.code));
    renderAssemblyDepot();
    return;
  }
  if (event.target.closest("[data-assembly-invert-visible]")) {
    currentAssemblyDepotOrders.forEach((order) => {
      if (selectedOrderCodes.has(order.code)) selectedOrderCodes.delete(order.code);
      else selectedOrderCodes.add(order.code);
    });
    renderAssemblyDepot();
    return;
  }
  if (event.target.closest("[data-assembly-clear-selection]")) {
    currentAssemblyDepotOrders.forEach((order) => selectedOrderCodes.delete(order.code));
    renderAssemblyDepot();
    return;
  }
  const bulkButton = event.target.closest("[data-assembly-bulk-action]");
  if (!bulkButton) return;
  bulkButton.disabled = true;
  runAssemblyDepotBulkAction(bulkButton.dataset.assemblyBulkAction)
    .catch((error) => setOrdersBulkStatus(error.message || "No se pudo completar la operacion de deposito.", "danger"))
    .finally(() => { bulkButton.disabled = false; });
});
byId("assemblyPrintSettingsForm").addEventListener("submit", saveAssemblyPrintSettings);
byId("clientsSearch").addEventListener("input", (event) => {
  clientSearchTerm = event.target.value;
  debouncedRenderClients();
});
byId("clientFilter").addEventListener("change", (event) => {
  clientStatusFilter = event.target.value;
  renderClients();
});
byId("clientSellerFilter").addEventListener("change", (event) => {
  clientSellerFilter = event.target.value;
  renderClients();
});
byId("clientZoneFilter").addEventListener("change", (event) => {
  clientZoneFilter = event.target.value;
  renderClients();
});
byId("clientAccountFilter").addEventListener("change", (event) => {
  clientAccountFilter = event.target.value;
  renderClients();
});
byId("clearClientFilters").addEventListener("click", () => {
  clientSearchTerm = "";
  clientStatusFilter = "all";
  clientSellerFilter = "all";
  clientZoneFilter = "all";
  clientAccountFilter = "all";
  byId("clientsSearch").value = "";
  byId("clientFilter").value = "all";
  byId("clientSellerFilter").value = "all";
  byId("clientZoneFilter").value = "all";
  byId("clientAccountFilter").value = "all";
  renderClients();
});
byId("accountsSearch").addEventListener("input", (event) => {
  accountSearchTerm = event.target.value;
  debouncedRenderAccounts();
});
byId("accountsTypeFilter").addEventListener("change", (event) => {
  accountTypeFilter = event.target.value;
  renderAccounts();
});
byId("accountsMethodFilter").addEventListener("change", (event) => {
  accountMethodFilter = event.target.value;
  renderAccounts();
});
byId("accountsStatusFilter").addEventListener("change", (event) => {
  accountStatusFilter = event.target.value;
  renderAccounts();
});
byId("clearAccountsFilters").addEventListener("click", () => {
  accountSearchTerm = "";
  accountTypeFilter = "all";
  accountMethodFilter = "all";
  accountStatusFilter = "all";
  bankStatusFilter = "all";
  bankClientFilter = "";
  bankDateFilter = "";
  bankBankFilter = "";
  bankAmountFilter = "";
  bankPendingClientsFilter = "all";
  byId("accountsSearch").value = "";
  byId("accountsTypeFilter").value = "all";
  byId("accountsMethodFilter").value = "all";
  byId("accountsStatusFilter").value = "all";
  byId("bankStatusFilter").value = "all";
  byId("bankClientFilter").value = "";
  byId("bankDateFilter").value = "";
  byId("bankBankFilter").value = "";
  byId("bankAmountFilter").value = "";
  byId("bankPendingClientsFilter").value = "all";
  renderAccounts();
});
byId("bankStatusFilter").addEventListener("change", (event) => {
  bankStatusFilter = event.target.value;
  renderAccounts();
});
byId("bankClientFilter").addEventListener("input", (event) => {
  bankClientFilter = event.target.value;
  debouncedRenderAccounts();
});
byId("bankDateFilter").addEventListener("change", (event) => {
  bankDateFilter = event.target.value;
  renderAccounts();
});
byId("bankBankFilter").addEventListener("input", (event) => {
  bankBankFilter = event.target.value;
  debouncedRenderAccounts();
});
byId("bankAmountFilter").addEventListener("input", (event) => {
  bankAmountFilter = event.target.value;
  debouncedRenderAccounts();
});
byId("bankPendingClientsFilter").addEventListener("change", (event) => {
  bankPendingClientsFilter = event.target.value;
  renderAccounts();
});
byId("clearBankFilters").addEventListener("click", () => {
  bankStatusFilter = "all";
  bankClientFilter = "";
  bankDateFilter = "";
  bankBankFilter = "";
  bankAmountFilter = "";
  bankPendingClientsFilter = "all";
  byId("bankStatusFilter").value = "all";
  byId("bankClientFilter").value = "";
  byId("bankDateFilter").value = "";
  byId("bankBankFilter").value = "";
  byId("bankAmountFilter").value = "";
  byId("bankPendingClientsFilter").value = "all";
  renderAccounts();
});
byId("suppliersSearch").addEventListener("input", (event) => {
  supplierSearchTerm = event.target.value;
  debouncedRenderSuppliers();
});
byId("suppliersStatusFilter").addEventListener("change", (event) => {
  supplierStatusFilter = event.target.value;
  renderSuppliers();
});
byId("suppliersSectorFilter").addEventListener("change", (event) => {
  supplierSectorFilter = event.target.value;
  renderSuppliers();
});
byId("clearSuppliersFilters").addEventListener("click", () => {
  supplierSearchTerm = "";
  supplierStatusFilter = "all";
  supplierSectorFilter = "all";
  byId("suppliersSearch").value = "";
  byId("suppliersStatusFilter").value = "all";
  byId("suppliersSectorFilter").value = "all";
  renderSuppliers();
});
byId("newSupplierRemitBtn").addEventListener("click", openSupplierRemitDialog);
byId("openSupplierReceiverRemitBtn").addEventListener("click", openSupplierRemitDialog);
byId("newSupplierPaymentBtn").addEventListener("click", () => openSupplierPaymentDialog());
byId("supplierAccountSelect").addEventListener("change", (event) => {
  selectedSupplierAccountName = event.target.value;
  renderSupplierAccountPanel();
});
byId("supplierRemitForm").addEventListener("submit", submitSupplierRemit);
byId("supplierRemitValidationForm").addEventListener("submit", submitSupplierRemitValidation);
byId("supplierPaymentForm").addEventListener("submit", submitSupplierPayment);
byId("supplierRemitAddProductBtn").addEventListener("click", addSupplierRemitItem);
byId("supplierRemitProductSearch").addEventListener("change", () => {
  const product = resolveSupplierRemitProduct(byId("supplierRemitProductSearch").value);
  if (product && !isSupplierReceiverMode() && numeric(byId("supplierRemitUnitPrice").value, 0) <= 0) {
    byId("supplierRemitUnitPrice").value = String(product.costo || product.cost || product.precio_lista_2 || product.price || 0);
  }
  updateSupplierRemitSubtotal();
});
["supplierRemitQty", "supplierRemitUnitPrice", "supplierRemitMultiplier"].forEach((id) => {
  byId(id).addEventListener("input", updateSupplierRemitSubtotal);
});
byId("supplierRemitItemsList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-remit-item]");
  if (!button) return;
  supplierRemitItems.splice(Number(button.dataset.removeRemitItem), 1);
  renderSupplierRemitItems();
});
["supplierRemitCamera", "supplierRemitGallery", "supplierRemitFile"].forEach((id) => {
  byId(id).addEventListener("change", () => {
    keepOnlySelectedFileInput(id, ["supplierRemitCamera", "supplierRemitGallery", "supplierRemitFile"]);
    updateSupplierRemitFileStatus();
  });
});
["supplierInvoiceCamera", "supplierInvoiceGallery", "supplierInvoiceFile"].forEach((id) => {
  byId(id).addEventListener("change", () => {
    keepOnlySelectedFileInput(id, ["supplierInvoiceCamera", "supplierInvoiceGallery", "supplierInvoiceFile"]);
    updateSupplierInvoiceFileStatus();
  });
});
["supplierPaymentCamera", "supplierPaymentGallery", "supplierPaymentFile"].forEach((id) => {
  byId(id).addEventListener("change", () => {
    keepOnlySelectedFileInput(id, ["supplierPaymentCamera", "supplierPaymentGallery", "supplierPaymentFile"]);
    updateSupplierPaymentFileStatus();
  });
});
["shortageDateFrom", "shortageDateTo", "shortageTimeFrom", "shortageTimeTo"].forEach((id) => {
  byId(id).addEventListener("change", (event) => {
    if (id === "shortageDateFrom") shortageDateFrom = event.target.value;
    if (id === "shortageDateTo") shortageDateTo = event.target.value;
    if (id === "shortageTimeFrom") shortageTimeFrom = event.target.value;
    if (id === "shortageTimeTo") shortageTimeTo = event.target.value;
    renderShortageStats();
  });
});
byId("shortageProductSearch").addEventListener("input", (event) => {
  shortageProductTerm = event.target.value;
  debouncedRenderShortageStats();
});
byId("shortageClientSearch").addEventListener("input", (event) => {
  shortageClientTerm = event.target.value;
  debouncedRenderShortageStats();
});
byId("shortageSellerFilter").addEventListener("change", (event) => {
  shortageSellerFilter = event.target.value;
  renderShortageStats();
});
byId("shortageZoneFilter").addEventListener("change", (event) => {
  shortageZoneFilter = event.target.value;
  renderShortageStats();
});
byId("shortageStatusFilter").addEventListener("change", (event) => {
  shortageStatusFilter = event.target.value;
  renderShortageStats();
});
byId("clearShortageFiltersBtn").addEventListener("click", () => {
  shortageDateFrom = "";
  shortageDateTo = "";
  shortageTimeFrom = "";
  shortageTimeTo = "";
  shortageProductTerm = "";
  shortageClientTerm = "";
  shortageSellerFilter = "all";
  shortageZoneFilter = "all";
  shortageStatusFilter = "all";
  ["shortageDateFrom", "shortageDateTo", "shortageTimeFrom", "shortageTimeTo", "shortageProductSearch", "shortageClientSearch"].forEach((id) => {
    byId(id).value = "";
  });
  byId("shortageSellerFilter").value = "all";
  byId("shortageZoneFilter").value = "all";
  byId("shortageStatusFilter").value = "all";
  renderShortageStats();
});
byId("exportShortagesCsvBtn").addEventListener("click", exportShortagesCsv);
byId("exportShortagesPdfBtn").addEventListener("click", exportShortagesPdf);
byId("auditSearch").addEventListener("input", (event) => {
  auditSearchTerm = event.target.value;
  debouncedRenderAdmin();
});
byId("auditEntityFilter").addEventListener("change", (event) => {
  auditEntityFilter = event.target.value;
  renderAdmin();
});
byId("auditActionFilter").addEventListener("change", (event) => {
  auditActionFilter = event.target.value;
  renderAdmin();
});
byId("clearAuditFilters").addEventListener("click", () => {
  auditSearchTerm = "";
  auditEntityFilter = "all";
  auditActionFilter = "all";
  byId("auditSearch").value = "";
  byId("auditEntityFilter").value = "all";
  byId("auditActionFilter").value = "all";
  renderAdmin();
});
if (byId("printAuditBtn")) {
  byId("printAuditBtn").addEventListener("click", printAuditReport);
}
if (byId("cleanLocalDataBtn")) {
  byId("cleanLocalDataBtn").addEventListener("click", cleanLocalDataFromAdmin);
}
if (byId("refreshSessionsBtn")) {
  byId("refreshSessionsBtn").addEventListener("click", refreshSessionMonitor);
}
if (byId("refreshLicenseBtn")) {
  byId("refreshLicenseBtn").addEventListener("click", refreshLicenseStatus);
}
if (byId("sessionSettingsForm")) {
  byId("sessionSettingsForm").addEventListener("submit", submitSessionSettings);
}
["gpsRouteReportDate", "gpsRouteRoleFilter", "gpsRouteStartHour", "gpsRouteEndHour"].forEach((id) => {
  const field = byId(id);
  if (!field) return;
  field.addEventListener("change", () => {
    gpsDailyRoutesPayload = null;
    renderDashboardDailyRoutes();
  });
});
if (byId("refreshGpsDailyRoutesBtn")) {
  byId("refreshGpsDailyRoutesBtn").addEventListener("click", () => refreshDashboardDailyRoutes(false));
}
if (byId("exportGpsDailyRoutesCsvBtn")) {
  byId("exportGpsDailyRoutesCsvBtn").addEventListener("click", exportDashboardDailyRoutesCsv);
}
if (byId("printGpsDailyRoutesBtn")) {
  byId("printGpsDailyRoutesBtn").addEventListener("click", () => printDashboardDailyRoutes());
}
byId("sellerSelect").addEventListener("change", (event) => {
  if (currentUser && currentUser.role === "seller" && currentUser.sellerName) mobileSeller = currentUser.sellerName;
  else mobileSeller = event.target.value || mobileSeller;
  const firstClient = getMobileClientOptions(state.sellers.find((seller) => seller.name === mobileSeller) || {}).find(Boolean);
  if (firstClient) mobileClient = firstClient.name;
  mobileCart = {};
  renderMobileSeller();
  startSellerLocationAutoRefresh();
});
byId("sellerWorkdaySelect").addEventListener("change", (event) => {
  mobileWorkday = event.target.value === "Fuera de Ruta" ? "Fuera de Ruta" : defaultMobileWorkday();
  const firstClient = getMobileClientOptions(state.sellers.find((seller) => seller.name === mobileSeller) || {}).find(Boolean);
  mobileClient = firstClient ? firstClient.name : "";
  mobileCart = {};
  renderMobileSeller();
});
byId("outsideRouteToggle").addEventListener("change", (event) => {
  mobileWorkday = event.target.checked ? "Fuera de Ruta" : defaultMobileWorkday();
  const firstClient = getMobileClientOptions(state.sellers.find((seller) => seller.name === mobileSeller) || {}).find(Boolean);
  mobileClient = firstClient ? firstClient.name : "";
  mobileCart = {};
  renderMobileSeller();
});
byId("mobileClientSelect").addEventListener("change", (event) => {
  mobileClient = event.target.value;
  renderMobileSeller();
});
byId("mobileClientPickerBtn").addEventListener("click", () => {
  const panel = byId("mobileClientPickerPanel");
  renderMobileClientOptions();
  setMobilePickerOpen("client", panel ? panel.hidden : true);
});
byId("mobileClientSearch").addEventListener("input", () => renderMobileClientOptions());
byId("mobileClientOptions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-client-option]");
  if (!button) return;
  mobileClient = button.dataset.mobileClientOption;
  byId("mobileClientSelect").value = mobileClient;
  byId("mobileClientSearch").value = "";
  setMobilePickerOpen("client", false);
  mobileClientHistoryOpen = false;
  renderMobileSeller();
});
document.querySelectorAll("[data-mobile-preventa-tab]").forEach((button) => {
  button.addEventListener("click", () => setMobilePreventaTab(button.dataset.mobilePreventaTab));
});
byId("toggleMobileClientFormBtn").addEventListener("click", () => {
  setMobileClientFormOpen(true);
});
byId("mobileNewClientConsumerFinal").addEventListener("change", (event) => {
  const field = byId("mobileNewClientTaxId");
  if (!field) return;
  field.disabled = event.target.checked;
  if (event.target.checked) field.value = "";
});
byId("registerMobileClientLocationBtn").addEventListener("click", registerMobileClientLocation);
byId("saveMobileClientBtn").addEventListener("click", addMobileClientFromQuickForm);
byId("mobileClientHistoryBtn").addEventListener("click", () => {
  mobileClientHistoryOpen = !mobileClientHistoryOpen;
  renderMobileClientHistory();
  if (mobileClientHistoryOpen) logMobileConsultation("CLIENTE_HISTORIAL_CONSULTA", mobileClient);
});
byId("mobileClientWhatsAppBtn").addEventListener("click", openSelectedClientWhatsApp);
byId("mobileSalesSearch").addEventListener("input", (event) => {
  mobileSalesSearchTerm = event.target.value;
  renderMobileSalesPanel();
});
byId("mobileSalesList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-sale]");
  if (!button) return;
  mobileSalesSelectedOrderCode = button.dataset.mobileSale;
  renderMobileSalesPanel();
  logMobileConsultation("MIS_VENTAS_DETALLE", mobileSalesSelectedOrderCode);
});
byId("exportMobileSalesPdfBtn").addEventListener("click", exportMobileSalesPdf);
byId("exportMobileSalesExcelBtn").addEventListener("click", exportMobileSalesCsv);
byId("openBatterySettingsBtn").addEventListener("click", openBatteryOptimizationSettings);
["mobileCommercialChangeType", "mobileCommercialProduct", "mobileCommercialValue", "mobileCommercialMotive"].forEach((id) => {
  const field = byId(id);
  if (!field) return;
  field.addEventListener("input", updateMobileCommercialRequestVisibility);
  field.addEventListener("change", updateMobileCommercialRequestVisibility);
});
["mobileNewClientZone", "mobileNewClientVisitDay"].forEach((id) => {
  const field = byId(id);
  if (!field) return;
  field.addEventListener("change", () => {
    const routeField = byId("mobileNewClientRoute");
    if (!routeField || routeField.value.trim()) return;
    const day = byId("mobileNewClientVisitDay").value.trim();
    const zone = byId("mobileNewClientZone").value.trim();
    routeField.value = [day, zone].filter(Boolean).join(" / ");
  });
});
byId("openNoPurchaseBtn").addEventListener("click", () => {
  setNoPurchasePanelOpen(byId("noPurchasePanel").hidden);
});
byId("noPurchaseReasonSelect").addEventListener("change", renderNoPurchaseObservationRequirement);
byId("submitNoPurchaseBtn").addEventListener("click", submitNoPurchaseVisit);
byId("mobileProductSelect").addEventListener("change", (event) => {
  mobileProduct = event.target.value;
  renderMobileProductInfo();
});
byId("mobileProductPickerBtn").addEventListener("click", () => {
  const panel = byId("mobileProductPickerPanel");
  renderMobileProductOptions();
  setMobilePickerOpen("product", panel ? panel.hidden : true);
});
byId("mobileProductSearch").addEventListener("input", () => renderMobileProductOptions());
byId("mobileProductOptions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-product-option]");
  if (!button) return;
  mobileProduct = button.dataset.mobileProductOption;
  byId("mobileProductSelect").value = mobileProduct;
  byId("mobileProductSearch").value = "";
  setMobilePickerOpen("product", false);
  renderMobileProductPicker();
  renderMobileProductInfo();
});
byId("mobileProductQty").addEventListener("input", renderMobileProductInfo);
byId("addMobileProductBtn").addEventListener("click", addSelectedMobileProduct);
byId("phoneProducts").addEventListener("input", (event) => {
  const input = event.target.closest("[data-cart-product]");
  if (!input) return;
  mobileCart[input.dataset.cartProduct] = Math.max(0, Number(input.value || 0));
  renderMobileCart();
  renderMobileSummary();
});
byId("phoneProducts").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-cart]");
  if (!button) return;
  delete mobileCart[button.dataset.removeCart];
  renderMobileCart();
  renderMobileSummary();
});

byId("newOrderBtn").addEventListener("click", () => {
  byId("orderForm").reset();
  renderOrderAccountPreview();
  byId("orderDialog").showModal();
});

byId("newClientBtn").addEventListener("click", openNewClientDialog);

byId("newProductBtn").addEventListener("click", () => {
  const form = byId("productForm");
  form.reset();
  hydratePriceListEditor(form, {});
  byId("productDialog").showModal();
});

byId("manualStockBtn").addEventListener("click", () => {
  populateStockEntryOptions();
  byId("stockEntryForm").reset();
  byId("stockEntryDialog").showModal();
});
byId("openSupplyPlannerBtn").addEventListener("click", openSupplyPlannerDialog);

byId("orderForm").addEventListener("input", renderOrderAccountPreview);

byId("orderForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await addOrder({
      client: form.get("client"),
      seller: form.get("seller"),
      products: form.get("products"),
      source: "dashboard",
      origin: "dashboard",
      priority: "Normal"
    });
    event.currentTarget.reset();
    renderOrderAccountPreview();
    byId("orderDialog").close("default");
  } catch (error) {
    window.alert(error.message || "No se pudo registrar el pedido.");
  }
});

byId("clientForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  const form = new FormData(event.currentTarget);
  if (clientEditTargetId) {
    event.preventDefault();
    await submitClientEdit(event.currentTarget, form);
    return;
  }
  if (!addClientFromForm(form)) {
    event.preventDefault();
    return;
  }
  event.currentTarget.reset();
});
byId("clientDialog").addEventListener("close", () => {
  if (byId("clientDialog").returnValue === "cancel") clientEditTargetId = "";
});

byId("productForm").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  const form = new FormData(event.currentTarget);
  if (!addProductFromForm(form)) {
    event.preventDefault();
    return;
  }
  event.currentTarget.reset();
});

["productForm", "stockEditForm"].forEach((formId) => {
  const form = byId(formId);
  if (!form) return;
  form.addEventListener("input", (event) => {
    const name = event.target && event.target.name || "";
    if (name === "costo" || /^precio_lista_[1-5](_pct)?$/.test(name)) {
      syncPriceListEditor(form, name);
    }
  });
});

byId("stockEntryForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const payload = await addManualStockEntry(form);
    event.currentTarget.reset();
    byId("stockEntryDialog").close("default");
    if (payload.completedOrders && payload.completedOrders.length) {
      window.alert(`Ingreso aplicado. Pedidos completos para armado: ${payload.completedOrders.join(", ")}.`);
    }
    openSupplyPlannerIfPending();
  } catch (error) {
    window.alert(error.message || "No se pudo cargar el ingreso.");
  }
});

byId("sendMobileOrderBtn").addEventListener("click", () => {
  addMobileOrder();
});
byId("printOrdersBtn").addEventListener("click", () => {
  const printable = state.orders.filter((order) => [ORDER_STATUS.READY, ORDER_STATUS.ASSEMBLY, ORDER_STATUS.LABELED, ORDER_STATUS.READY_DISPATCH].includes(order.status));
  if (printable.length && !printOrderInvoice(printable)) return;
  state.activity.unshift({ type: "Deposito", title: "Facturas de armado impresas", text: `Se emitieron ${printable.length} facturas/guia sin cambiar estado.` });
  saveState();
  renderForCurrentUser();
});

byId("loadPurchaseBtn").addEventListener("click", async () => {
  const product = state.products.find((item) => item.name === "Aceite girasol 900ml");
  if (!product) return;
  try {
    await postOperationalAction("api/stock/entry", {
      productCode: product.codigo_producto,
      product: product.name,
      qty: 96,
      supplier: "Alimentos Pampeanos SA",
      movementType: "Ingreso",
      note: "Compra demo"
    });
  } catch (error) {
    window.alert(error.message || "No se pudo cargar la compra demo.");
  }
});

byId("registerPaymentBtn").addEventListener("click", () => {
  const client = state.clients.find((item) => item.name === "Autoservicio La Esquina");
  if (!client) return;
  client.balance = Math.max(0, client.balance - 85000);
  state.accounts.unshift({ date: "03/06", type: "Cobro", account: client.name, method: "Transferencia", debit: 0, credit: 85000, balance: client.balance });
  state.bankTransfers = state.bankTransfers.filter((item) => item.title !== "Transferencia sin aplicar");
  state.activity.unshift({ type: "Cobranza", title: "Cobro aplicado", text: "Transferencia asociada a Autoservicio La Esquina." });
  saveState();
  renderForCurrentUser();
});

document.addEventListener("click", (event) => {
  const fileTrigger = event.target.closest("[data-file-trigger]");
  const fileLabel = event.target.closest(".file-action-btn[for]");
  if (!fileTrigger && !fileLabel) return;
  event.preventDefault();
  triggerFileInput(fileTrigger ? fileTrigger.dataset.fileTrigger : fileLabel.getAttribute("for"));
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-dialog]");
  if (!closeButton) return;
  const dialog = closeButton.closest("dialog");
  if (dialog) dialog.close("cancel");
});

document.addEventListener("click", (event) => {
  const stageCard = event.target.closest("[data-order-stage]");
  if (!stageCard) return;
  exportOrderStagePdf(stageCard.dataset.orderStage);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-force-session-close]");
  if (!button) return;
  forceCloseSession(button.dataset.forceSessionClose);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gps-route-print]");
  if (!button) return;
  printDashboardDailyRoutes(button.dataset.gpsRoutePrint);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const stageCard = event.target.closest("[data-order-stage]");
  if (!stageCard) return;
  event.preventDefault();
  exportOrderStagePdf(stageCard.dataset.orderStage);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-print]");
  if (!button) return;
  const order = state.orders.find((item) => item.code === button.dataset.print);
  if (!order) return;
  if (order.status === ORDER_STATUS.PENDING && orderSupplySummary(order).missing > 0) {
    showCompactNotice("Este pedido todavia tiene faltantes. La factura se habilita cuando este completo.", "warn");
    return;
  }
  order.print = true;
  order.updatedAt = new Date().toISOString();
  if (!printOrderInvoice(order)) return;
  state.activity.unshift({ type: "Deposito", title: `${order.code} impreso`, text: `Factura/guia de armado generada para ${order.client}.` });
  saveState();
  renderForCurrentUser();
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-order-edit]");
  if (!editButton) return;
  openOrderEditDialog(editButton.dataset.orderEdit);
});

document.addEventListener("click", (event) => {
  const labelButton = event.target.closest("[data-order-label]");
  if (!labelButton) return;
  openOrderLabelDialog(labelButton.dataset.orderLabel);
});

document.addEventListener("click", (event) => {
  const scanButton = event.target.closest("[data-order-scan]");
  if (!scanButton) return;
  openOrderScanDialog(scanButton.dataset.orderScan);
});

document.addEventListener("click", (event) => {
  const traceButton = event.target.closest("[data-order-trace]");
  if (!traceButton) return;
  openOrderTimeline(traceButton.dataset.orderTrace);
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-commercial-approval]");
  if (!button) return;
  if (!isAdminUser()) {
    window.alert("Solo administracion puede resolver solicitudes comerciales.");
    return;
  }
  const code = button.dataset.commercialApproval;
  const order = state.orders.find((item) => item.code === code);
  if (!order || !pendingCommercialApproval(order)) return;
  const approve = button.dataset.commercialDecision === "approve";
  const motive = window.prompt(`${approve ? "Aprobar" : "Rechazar"} solicitud comercial de ${order.client}.\n${commercialApprovalSummary(order)}\n\nMotivo administrativo:`, approve ? "Autorizado por administracion" : "No autorizado por margen/precio");
  if (!motive || !motive.trim()) return;
  button.disabled = true;
  try {
    await postOperationalAction(`api/orders/${encodeURIComponent(code)}/commercial-approval`, {
      decision: approve ? "approve" : "reject",
      motive: motive.trim()
    });
    showCompactNotice(`Solicitud comercial ${approve ? "aprobada" : "rechazada"}.`, approve ? "ok" : "warn");
  } catch (error) {
    window.alert(error.message || "No se pudo resolver la solicitud comercial.");
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-client-edit]");
  if (!editButton) return;
  openClientEditDialog(editButton.dataset.clientEdit);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mixed-entity]");
  if (!button) return;
  openMixedEntityDialog(button.dataset.mixedEntity);
});

document.addEventListener("dblclick", (event) => {
  if (event.target.closest("button, a, input, select, textarea, label")) return;
  const row = event.target.closest("[data-order-row]");
  if (!row) return;
  const order = state.orders.find((item) => item.code === row.dataset.orderRow);
  if (canEditOrder(order)) openOrderEditDialog(row.dataset.orderRow);
  else if (isAdminUser()) window.alert(orderEditBlockedReason(order));
});

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-order-edit-remove]");
  if (!removeButton) return;
  syncOrderEditDraftFromDom();
  orderEditDraftItems.splice(Number(removeButton.dataset.orderEditRemove), 1);
  renderOrderEditItems();
});

byId("orderEditAddItemBtn").addEventListener("click", () => {
  syncOrderEditDraftFromDom();
  const product = state.products[0];
  if (!product) return;
  orderEditDraftItems.push({ productCode: product.codigo_producto || "", name: product.name, qty: 1, unitPrice: productPriceForUser(product), originalUnitPrice: productPriceForUser(product), discountPct: 0, priceListId: product.priceListId, priceListName: product.priceListName || "Lista vigente" });
  renderOrderEditItems();
});

byId("orderEditItemsList").addEventListener("change", () => {
  syncOrderEditDraftFromDom();
  renderOrderEditItems();
});

byId("orderEditItemsList").addEventListener("input", () => {
  syncOrderEditDraftFromDom();
  renderOrderEditSummary();
});
byId("orderEditForm").addEventListener("submit", submitOrderEdit);
byId("orderLabelForm").addEventListener("submit", submitOrderLabel);
byId("orderScanForm").addEventListener("submit", submitOrderScan);
byId("transferProofForm").addEventListener("submit", submitTransferProof);
["transferProofCamera", "transferProofGallery", "transferProofFile"].forEach((id) => {
  byId(id).addEventListener("change", () => {
    keepOnlySelectedFileInput(id, ["transferProofCamera", "transferProofGallery", "transferProofFile"]);
    setTransferProofFile(byId(id).files[0] || null);
  });
});
byId("transferProofDropzone").addEventListener("dragover", (event) => {
  event.preventDefault();
  byId("transferProofDropzone").classList.add("drag-active");
});
byId("transferProofDropzone").addEventListener("dragleave", () => {
  byId("transferProofDropzone").classList.remove("drag-active");
});
byId("transferProofDropzone").addEventListener("drop", (event) => {
  event.preventDefault();
  byId("transferProofDropzone").classList.remove("drag-active");
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) setTransferProofFile(file);
});
byId("transferProofDialog").addEventListener("paste", (event) => {
  const items = Array.from(event.clipboardData && event.clipboardData.items || []);
  const imageItem = items.find((item) => item.kind === "file" && String(item.type || "").startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (file) {
    event.preventDefault();
    setTransferProofFile(new File([file], `comprobante-${Date.now()}.png`, { type: file.type || "image/png" }));
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-order-next]");
  if (!button) return;
  const order = state.orders.find((item) => item.code === button.dataset.orderNext);
  if (!order) return;
  const nextStatus = nextOrderStatus(order.status);
  if (!nextStatus) return;
  button.disabled = true;
  try {
    await postOperationalAction(`api/orders/${encodeURIComponent(order.code)}/advance`, {});
  } catch (error) {
    window.alert(error.message || "No se pudo avanzar el pedido.");
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const supplierAccountButton = event.target.closest("[data-supplier-account]");
  if (supplierAccountButton) {
    selectedSupplierAccountName = supplierAccountButton.dataset.supplierAccount;
    renderSupplierAccountPanel();
    byId("supplierAccountSelect").focus();
    return;
  }

  const supplierPaymentButton = event.target.closest("[data-supplier-payment]");
  if (supplierPaymentButton) {
    openSupplierPaymentDialog(supplierPaymentButton.dataset.supplierPayment);
    return;
  }

  const remitValidate = event.target.closest("[data-supplier-remit-validate]");
  if (remitValidate) {
    if (!isAdminUser()) {
      window.alert("Solo administracion puede conciliar remitos.");
      return;
    }
    openSupplierRemitValidationDialog(remitValidate.dataset.supplierRemitValidate);
    return;
  }

  const paymentReconcile = event.target.closest("[data-supplier-payment-reconcile]");
  if (paymentReconcile) {
    if (!isAdminUser()) {
      window.alert("Solo administracion puede conciliar pagos.");
      return;
    }
    const payment = (state.supplierMovements || []).find((item) => item.id === paymentReconcile.dataset.supplierPaymentReconcile);
    if (!payment) return;
    if (!window.confirm(`Conciliar pago ${payment.id} por ${money.format(payment.amount || 0)}?`)) return;
    const observations = window.prompt("Observaciones de conciliacion:", payment.adminObservations || "") || "";
    paymentReconcile.disabled = true;
    try {
      await postOperationalAction(`api/suppliers/payments/${encodeURIComponent(payment.id)}/reconcile`, {
        observations
      });
      showCompactNotice("Pago proveedor conciliado.", "ok");
    } catch (error) {
      window.alert(error.message || "No se pudo conciliar el pago.");
    } finally {
      paymentReconcile.disabled = false;
    }
    return;
  }

  const selectTransfer = event.target.closest("[data-bank-select]");
  if (selectTransfer) {
    const globalTerms = [];
    const localTerms = searchTerms(accountSearchTerm);
    const visibleRecords = (state.bankReconciliation || []).filter((record) => transferMatchesFilters(record, globalTerms, localTerms)).slice(0, 80);
    if (selectTransfer.dataset.bankSelect === "none") {
      selectedTransferIds.clear();
    } else if (selectTransfer.dataset.bankSelect === "filtered") {
      visibleRecords.forEach((record) => selectedTransferIds.add(record.id));
    } else if (selectTransfer.dataset.bankSelect === "invert") {
      visibleRecords.forEach((record) => {
        if (selectedTransferIds.has(record.id)) selectedTransferIds.delete(record.id);
        else selectedTransferIds.add(record.id);
      });
    }
    renderAccounts();
    return;
  }

  const bankBulkButton = event.target.closest("[data-bank-bulk-action]");
  if (bankBulkButton) {
    if (!isAdminUser()) {
      window.alert("Solo administracion puede operar comprobantes en lote.");
      return;
    }
    bankBulkButton.disabled = true;
    try {
      await runBankBulkAction(bankBulkButton.dataset.bankBulkAction);
    } catch (error) {
      setBankBulkStatus(error.message || "No se pudo completar la operacion masiva.", "danger");
    } finally {
      bankBulkButton.disabled = false;
    }
    return;
  }

  const transferSelect = event.target.closest("[data-transfer-select]");
  if (transferSelect) {
    if (transferSelect.checked) selectedTransferIds.add(transferSelect.dataset.transferSelect);
    else selectedTransferIds.delete(transferSelect.dataset.transferSelect);
    renderBankBulkPanel((state.bankReconciliation || []).filter((record) => transferMatchesFilters(record, [], searchTerms(accountSearchTerm))));
    return;
  }

  const proofButton = event.target.closest("[data-transfer-proof]");
  if (proofButton) {
    if (!isAdminUser()) {
      window.alert("Solo administracion puede cargar comprobantes.");
      return;
    }
    openTransferProofDialog(proofButton.dataset.transferProof);
    return;
  }

  const historyButton = event.target.closest("[data-transfer-history]");
  if (historyButton) {
    const transfer = (state.bankReconciliation || []).find((item) => item.id === historyButton.dataset.transferHistory);
    if (!transfer) return;
    const history = Array.isArray(transfer.history) && transfer.history.length
      ? transfer.history.map((item) => `${item.date || ""} ${item.time || ""} - ${item.user || "Sistema"} - ${item.action || "Evento"}`).join("\n")
      : "Sin historial detallado para esta transferencia.";
    window.alert(`${transfer.orderCode || transfer.id} - ${transfer.client || "Sin cliente"}\n\n${history}`);
    return;
  }

  const summaryFilter = event.target.closest("[data-bank-summary-filter]");
  if (summaryFilter) {
    bankStatusFilter = summaryFilter.dataset.bankSummaryFilter || "all";
    const select = byId("bankStatusFilter");
    if (select) select.value = bankStatusFilter;
    if (window.location.hash !== "#cuentas") window.location.hash = "#cuentas";
    renderForCurrentUser();
    return;
  }

  const button = event.target.closest("[data-transfer-status]");
  if (!button) return;
  if (!isAdminUser()) {
    window.alert("Solo administracion puede conciliar transferencias.");
    return;
  }
  const transfer = (state.bankReconciliation || []).find((item) => item.id === button.dataset.transferStatus);
  if (!transfer) return;
  const nextStatus = button.dataset.status;
  let reason = "";
  let bank = transfer.validationBank || transfer.bank || "";
  let operationNumber = transfer.operationNumber || "";
  if (nextStatus === TRANSFER_STATUS.OBSERVED || nextStatus === "Rechazada") {
    reason = window.prompt("Motivo de observacion/rechazo del comprobante:", transfer.statusReason || "") || "";
    if (!reason.trim()) {
      window.alert("Para observar una transferencia se debe indicar motivo.");
      return;
    }
  } else if (nextStatus === TRANSFER_STATUS.PENDING || nextStatus === "Pendiente") {
    reason = window.prompt("Motivo para volver a Pendiente:", transfer.statusReason || "") || "";
  }
  if (TRANSFER_FINAL_STATUSES.has(normalizeTransferStatus(nextStatus))) {
    if (!transfer.attachment) {
      window.alert("No se puede validar sin comprobante cargado.");
      return;
    }
    bank = window.prompt("Banco donde impacto la transferencia:", bank || "") || "";
    operationNumber = window.prompt("Numero de operacion o referencia bancaria:", operationNumber || "") || "";
    if (!window.confirm(`Validar transferencia ${transfer.orderCode || transfer.id} por ${money.format(transfer.amount || 0)}?\n\nEsto descontara la deuda de la cuenta corriente.`)) return;
  }
  button.disabled = true;
  try {
    await postOperationalAction(`api/bank-reconciliation/transfers/${encodeURIComponent(transfer.id)}/status`, {
      status: nextStatus,
      reason,
      bank,
      operationNumber
    });
  } catch (error) {
    window.alert(error.message || "No se pudo actualizar la transferencia.");
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-order-urgent]");
  if (!button) return;
  const order = state.orders.find((item) => item.code === button.dataset.orderUrgent);
  if (!order) return;
  try {
    await postOperationalAction(`api/orders/${encodeURIComponent(order.code)}/priority`, {
      priority: order.priority === "Urgente" ? "Normal" : "Urgente"
    });
  } catch (error) {
    window.alert(error.message || "No se pudo cambiar la prioridad.");
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-order-cancel]");
  if (!button) return;
  const order = state.orders.find((item) => item.code === button.dataset.orderCancel);
  if (!order || !window.confirm(`Cancelar ${order.code} y liberar todas sus reservas?`)) return;
  try {
    await postOperationalAction(`api/orders/${encodeURIComponent(order.code)}/cancel`, {});
  } catch (error) {
    window.alert(error.message || "No se pudo cancelar el pedido.");
  }
});

document.addEventListener("click", (event) => {
  const notificationButton = event.target.closest("[data-focus-notification]");
  if (notificationButton) {
    focusNotification(notificationButton.dataset.focusNotification);
    const toast = notificationButton.closest("[data-toast-notification]");
    if (toast) toast.remove();
    return;
  }
  const notificationReadButton = event.target.closest("[data-read-notification]");
  if (notificationReadButton) {
    markNotificationRead(notificationReadButton.dataset.readNotification);
    return;
  }
  const dismissNotificationButton = event.target.closest("[data-dismiss-notification]");
  if (dismissNotificationButton) {
    markNotificationRead(dismissNotificationButton.dataset.dismissNotification);
    const toast = dismissNotificationButton.closest("[data-toast-notification]");
    if (toast) toast.remove();
    return;
  }
  const openButton = event.target.closest("[data-open-order]");
  if (openButton) {
    focusOrder(openButton.dataset.openOrder);
    const toast = openButton.closest("[data-toast-order]");
    if (toast) toast.remove();
    return;
  }
  const dismissButton = event.target.closest("[data-dismiss-toast]");
  if (dismissButton) {
    const toast = dismissButton.closest("[data-toast-order]");
    if (toast) toast.remove();
  }
});

function setDeliveryCollectionMessage(text, tone = "danger") {
  const message = byId("deliveryCollectionMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

function setDeliveryExceptionMessage(text, tone = "danger") {
  const message = byId("deliveryExceptionMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

function setDeliveryClosureMessage(text, tone = "danger") {
  const message = byId("deliveryClosureMessage");
  if (!message) return;
  message.textContent = text || "";
  message.dataset.tone = tone;
}

let deliveryRecoveryRetry = null;

function showDeliveryRecovery({ title, message, error, retry, url, action }) {
  const dialog = byId("deliveryRecoveryDialog");
  if (!dialog) {
    showCompactNotice(message || "No se pudo completar la accion de reparto.", "warn");
    return;
  }
  deliveryRecoveryRetry = typeof retry === "function" ? retry : null;
  byId("deliveryRecoveryTitle").textContent = title || "No se pudo completar la accion";
  byId("deliveryRecoveryMessage").textContent = message || "Podes reintentar o volver al reparto.";
  const technical = byId("deliveryRecoveryTechnical");
  const detail = {
    at: new Date().toISOString(),
    module: "Reparto",
    action: action || "",
    user: currentUser && currentUser.username,
    device: deliveryDevice,
    url: url || "",
    online: navigator.onLine,
    message: error && (error.message || String(error))
  };
  technical.value = JSON.stringify(detail, null, 2);
  technical.hidden = false;
  byId("deliveryRecoveryRetryBtn").hidden = !deliveryRecoveryRetry;
  if (!dialog.open) dialog.showModal();
}

function setMoneyPreview(inputId, previewId) {
  const input = byId(inputId);
  const preview = byId(previewId);
  if (!input || !preview) return;
  preview.textContent = money.format(numeric(input.value, 0));
}

function cashBreakdownFromForm() {
  const items = Array.from(document.querySelectorAll("[data-cash-denomination]")).map((input) => {
    const denomination = Number(input.dataset.cashDenomination || 0);
    const qty = Math.max(0, Math.floor(numeric(input.value, 0)));
    return {
      denomination,
      qty,
      subtotal: denomination * qty
    };
  }).filter((item) => item.denomination > 0);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, total };
}

function renderDeliveryCashBreakdown() {
  const grid = byId("deliveryCashBreakdownGrid");
  if (!grid) return;
  grid.innerHTML = DELIVERY_CASH_DENOMINATIONS.map((denomination) => `
    <label class="cash-denomination-row">
      <span>${escapeHtml(money.format(denomination))}</span>
      <input data-cash-denomination="${denomination}" type="number" min="0" step="1" inputmode="numeric" value="0" aria-label="Cantidad de billetes de ${denomination}">
      <strong data-cash-subtotal="${denomination}">${escapeHtml(money.format(0))}</strong>
    </label>
  `).join("");
}

function updateDeliveryCashBreakdownPreview() {
  const breakdown = cashBreakdownFromForm();
  breakdown.items.forEach((item) => {
    const subtotal = document.querySelector(`[data-cash-subtotal="${item.denomination}"]`);
    if (subtotal) subtotal.textContent = money.format(item.subtotal);
  });
  const cashReported = byId("deliveryClosureCashReported");
  if (cashReported) cashReported.value = String(breakdown.total);
  const counted = byId("deliveryClosureCashCounted");
  if (counted) counted.textContent = money.format(breakdown.total);
  setMoneyPreview("deliveryClosureCashReported", "deliveryClosureCashReportedPreview");
}

function activeDeliveryClosureRoute() {
  const routeId = byId("deliveryClosureRouteId")?.value || "";
  return (state.deliveryRoutes || []).find((route) => route.id === routeId) || null;
}

function updateDeliveryClosurePreview() {
  const route = activeDeliveryClosureRoute();
  if (!route) return;
  updateDeliveryCashBreakdownPreview();
  setMoneyPreview("deliveryClosureTransferReported", "deliveryClosureTransferReportedPreview");
  const summary = deliveryClosureSummary(route, {
    reportedCash: numeric(byId("deliveryClosureCashReported").value, 0),
    reportedTransfer: numeric(byId("deliveryClosureTransferReported").value, 0)
  });
  const expected = byId("deliveryClosureExpectedSummary");
  if (expected) {
    expected.innerHTML = `
      <strong>${escapeHtml(route.id)} - ${escapeHtml(route.zone || "")}</strong>
      ${deliveryClosureMetricsHtml(summary)}
    `;
  }
  const diffBox = byId("deliveryClosureDifferenceBox");
  if (diffBox) {
    const tone = deliveryDifferenceTone(summary.totalDifference);
    diffBox.dataset.tone = tone;
    diffBox.innerHTML = `
      <strong>Diferencia total: ${escapeHtml(money.format(summary.totalDifference))}</strong>
      <span>Efectivo: ${escapeHtml(money.format(summary.cashDifference))} - Transferencias: ${escapeHtml(money.format(summary.transferDifference))}</span>
      <small>Pedidos pendientes: ${summary.pendingOrders}. Pedidos con devolucion: ${summary.returnedOrders}. Importe devuelto: ${escapeHtml(money.format(summary.returnedAmount))}.</small>
    `;
  }
  const reasonField = byId("deliveryClosureReasonField");
  const reasonSelect = byId("deliveryClosureDifferenceReason");
  const hasDifference = Math.abs(summary.cashDifference) > 0.01 || Math.abs(summary.transferDifference) > 0.01;
  if (reasonField) reasonField.hidden = !hasDifference;
  if (reasonSelect) reasonSelect.required = hasDifference;
}

function openDeliveryRouteClosure(routeId) {
  const route = (state.deliveryRoutes || []).find((item) => item.id === routeId);
  if (!route) return;
  if (route.closure) {
    window.alert("La ruta ya tiene cierre diario registrado.");
    return;
  }
  byId("deliveryClosureRouteId").value = route.id;
  byId("deliveryRouteClosureTitle").textContent = `Cerrar ${route.id}`;
  renderDeliveryCashBreakdown();
  byId("deliveryClosureCashReported").value = "0";
  byId("deliveryClosureTransferReported").value = String(numeric(route.transferTotal, 0));
  byId("deliveryClosureDifferenceReason").value = "";
  byId("deliveryClosureObservations").value = "";
  setDeliveryClosureMessage("");
  updateDeliveryClosurePreview();
  byId("deliveryRouteClosureDialog").showModal();
}

async function submitDeliveryRouteClosure(event) {
  event.preventDefault();
  const route = activeDeliveryClosureRoute();
  if (!route) return;
  const submit = byId("deliveryClosureSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Cerrando...";
  setDeliveryClosureMessage("Tomando GPS y guardando cierre...", "info");
  try {
    updateDeliveryClosurePreview();
    const summary = deliveryClosureSummary(route, {
      reportedCash: numeric(byId("deliveryClosureCashReported").value, 0),
      reportedTransfer: numeric(byId("deliveryClosureTransferReported").value, 0)
    });
    const hasDifference = Math.abs(summary.cashDifference) > 0.01 || Math.abs(summary.transferDifference) > 0.01;
    const differenceReason = byId("deliveryClosureDifferenceReason").value.trim();
    const observations = byId("deliveryClosureObservations").value.trim();
    if (hasDifference && !differenceReason) {
      setDeliveryClosureMessage("Seleccionar motivo de diferencia antes de cerrar.");
      return;
    }
    if (hasDifference && (!observations || differenceReason === "Otro" && observations.length < 4)) {
      setDeliveryClosureMessage("Con diferencia de caja, agregar una observacion clara.");
      return;
    }
    const gps = await requireDeliveryLocation();
    const payload = await postOperationalAction(`api/delivery/routes/${encodeURIComponent(route.id)}/close`, deliveryActionBody(gps, {
      reportedCash: numeric(byId("deliveryClosureCashReported").value, 0),
      reportedTransfer: numeric(byId("deliveryClosureTransferReported").value, 0),
      cashBreakdown: cashBreakdownFromForm().items,
      differenceReason,
      observations
    }));
    byId("deliveryRouteClosureDialog").close("default");
    window.alert(`Cierre registrado. Diferencia total: ${money.format(payload.closure.totalDifference || 0)}.`);
  } catch (error) {
    setDeliveryClosureMessage("No se pudo cerrar la ruta. Reintentar o volver al reparto.");
    showDeliveryRecovery({
      title: "No se pudo cerrar la ruta",
      message: "El cierre no se guardo. Podes reintentar sin perder lo cargado.",
      error,
      action: "cierre_ruta",
      retry: () => byId("deliveryRouteClosureForm").requestSubmit()
    });
  } finally {
    submit.disabled = false;
    submit.textContent = "Cerrar ruta diaria";
  }
}

function clearDeliverySignature() {
  const canvas = byId("deliverySignatureCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  deliverySignatureDirty = false;
}

function initializeDeliverySignature() {
  const canvas = byId("deliverySignatureCanvas");
  if (!canvas) return;
  clearDeliverySignature();
  const context = canvas.getContext("2d");
  context.strokeStyle = "#10262c";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  };
  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
    deliverySignatureDirty = true;
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
}

function clearDeliveryExceptionSignature() {
  const canvas = byId("deliveryExceptionSignatureCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  deliveryExceptionSignatureDirty = false;
}

function initializeDeliveryExceptionSignature() {
  const canvas = byId("deliveryExceptionSignatureCanvas");
  if (!canvas) return;
  clearDeliveryExceptionSignature();
  const context = canvas.getContext("2d");
  context.strokeStyle = "#10262c";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  };
  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
    deliveryExceptionSignatureDirty = true;
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
}

function updateDeliveryPaymentDefaults() {
  const method = byId("deliveryPaymentMethod").value;
  const order = state.orders.find((item) => item.code === byId("deliveryCollectionOrderCode").value);
  if (!order) return;
  const total = deliveryCollectionTotals(order).netAmount;
  const previousCash = numeric(byId("deliveryCashAmount").value, 0);
  const previousTransfer = numeric(byId("deliveryTransferAmount").value, 0);
  const settings = state.deliverySettings || {};
  if (method === "Efectivo") {
    byId("deliveryCashAmount").value = String(total);
    byId("deliveryTransferAmount").value = "0";
  } else if (method === "Transferencia") {
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = String(total);
  } else if (method === "Transferencia Pendiente") {
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  } else if (method === "Cuenta corriente") {
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  } else if (method === "Mixto" && previousCash + previousTransfer <= 0) {
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  }
  byId("deliveryCollectibleAmount").value = String(total);
  updateDeliveryPendingAmount();
  const transferAmount = numeric(byId("deliveryTransferAmount").value, 0);
  const hasTransfer = transferAmount > 0;
  const showTransferBox = method === "Mixto" || hasTransfer;
  byId("deliveryBankAliasBox").hidden = !hasTransfer;
  byId("deliveryTransferProofBox").hidden = !showTransferBox;
  byId("deliveryTransferPhoto").required = false;
  byId("deliveryTransferGallery").required = false;
  byId("deliveryTransferFile").required = false;
  byId("deliveryTransferBank").required = hasTransfer;
  byId("deliveryTransferAlias").required = false;
  byId("deliveryTransferCbu").required = false;
  if (hasTransfer) {
    if (!byId("deliveryTransferAlias").value) byId("deliveryTransferAlias").value = settings.bankAlias || "";
    if (!byId("deliveryTransferCbu").value) byId("deliveryTransferCbu").value = settings.bankCbu || "";
  }
}

function applyDeliveryPaymentPreset(preset) {
  const order = state.orders.find((item) => item.code === byId("deliveryCollectionOrderCode").value);
  if (!order) return;
  const total = deliveryCollectionTotals(order).netAmount;
  if (preset === "cash") {
    byId("deliveryPaymentMethod").value = "Efectivo";
    byId("deliveryCashAmount").value = String(total);
    byId("deliveryTransferAmount").value = "0";
  } else if (preset === "transfer") {
    byId("deliveryPaymentMethod").value = "Transferencia";
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = String(total);
  } else if (preset === "pending-transfer") {
    byId("deliveryPaymentMethod").value = "Transferencia Pendiente";
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  } else if (preset === "credit") {
    byId("deliveryPaymentMethod").value = "Cuenta corriente";
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  } else {
    byId("deliveryPaymentMethod").value = "Mixto";
    byId("deliveryCashAmount").value = "0";
    byId("deliveryTransferAmount").value = "0";
  }
  updateDeliveryPaymentDefaults();
}

function updateDeliveryPendingAmount() {
  const order = state.orders.find((item) => item.code === byId("deliveryCollectionOrderCode").value);
  if (!order) return;
  const total = deliveryCollectionTotals(order).netAmount;
  const cash = Math.max(0, numeric(byId("deliveryCashAmount").value, 0));
  const transfer = Math.max(0, numeric(byId("deliveryTransferAmount").value, 0));
  const credit = Math.max(0, Math.round((total - cash - transfer) * 100) / 100);
  byId("deliveryCollectibleAmount").value = String(total);
  byId("deliveryCreditAmount").value = String(credit);
  byId("deliveryAmountPaid").value = String(Math.round((cash + transfer) * 100) / 100);
  byId("deliveryPendingAmount").value = String(credit);
  setMoneyPreview("deliveryCollectibleAmount", "deliveryCollectibleAmountPreview");
  setMoneyPreview("deliveryCashAmount", "deliveryCashAmountPreview");
  setMoneyPreview("deliveryTransferAmount", "deliveryTransferAmountPreview");
  setMoneyPreview("deliveryCreditAmount", "deliveryCreditAmountPreview");
  const balance = byId("deliveryMixedBalance");
  if (balance) {
    const diff = Math.round((cash + transfer + credit - total) * 100) / 100;
    balance.textContent = diff === 0
      ? `Saldo pendiente calculado: ${money.format(credit)}`
      : `Diferencia a corregir: ${money.format(diff)}`;
    balance.dataset.tone = diff === 0 ? "ok" : "danger";
  }
  const hasTransfer = transfer > 0;
  const showTransferBox = byId("deliveryPaymentMethod").value === "Mixto" || hasTransfer;
  byId("deliveryBankAliasBox").hidden = !hasTransfer;
  byId("deliveryTransferProofBox").hidden = !showTransferBox;
  byId("deliveryTransferPhoto").required = false;
  byId("deliveryTransferGallery").required = false;
  byId("deliveryTransferFile").required = false;
  byId("deliveryTransferBank").required = hasTransfer;
  byId("deliveryTransferAlias").required = false;
  byId("deliveryTransferCbu").required = false;
}

function deliveryTransferAttachmentFile() {
  return byId("deliveryTransferPhoto").files[0]
    || byId("deliveryTransferGallery").files[0]
    || byId("deliveryTransferFile").files[0]
    || null;
}

function updateDeliveryTransferFileStatus() {
  const file = deliveryTransferAttachmentFile();
  const status = byId("deliveryTransferFileStatus");
  if (status) status.textContent = file ? `Comprobante listo: ${file.name}` : "Sin comprobante seleccionado.";
}

function deliveryItemRows(order) {
  return (order.items || []).map((item) => {
    const requested = numeric(item.requestedQty, 0);
    const delivered = numeric(item.deliveredQty, 0);
    const remaining = Math.max(0, requested - delivered);
    return {
      productCode: item.productCode || "",
      name: item.name || "",
      requested,
      delivered,
      remaining,
      returned: numeric(item.returnedQty, 0),
      unitPrice: numeric(item.unitPrice, 0)
    };
  }).filter((item) => item.requested > 0);
}

function renderDeliveryItems(order) {
  const container = byId("deliveryItemsList");
  if (!container) return;
  const rows = deliveryItemRows(order);
  if (!rows.length) {
    container.innerHTML = '<p class="empty-note">Este pedido no tiene detalle de productos.</p>';
    return;
  }
  container.innerHTML = rows.map((item, index) => `
    <div class="delivery-item-row">
      <span>
        <strong>${escapeHtml(item.name)}</strong>
        <small>Pedido ${item.requested} - Entregado ${item.delivered} - Devuelto ${item.returned} - Pendiente ${item.remaining}</small>
      </span>
      <label>
        Entrega
        <input data-delivery-item-qty="${index}" data-product-code="${escapeHtml(item.productCode)}" data-product-name="${escapeHtml(item.name)}" data-unit-price="${item.unitPrice}" type="number" min="0" max="${item.remaining}" step="1" value="${item.remaining}" inputmode="numeric" ${item.remaining <= 0 ? "disabled" : ""}>
      </label>
      <label>
        Devuelve
        <input data-delivery-return-qty="${index}" data-product-code="${escapeHtml(item.productCode)}" data-product-name="${escapeHtml(item.name)}" data-unit-price="${item.unitPrice}" type="number" min="0" max="${item.remaining}" step="1" value="0" inputmode="numeric" ${item.remaining <= 0 ? "disabled" : ""}>
      </label>
    </div>
  `).join("");
  updateDeliveryReturnSummary();
}

function selectedDeliveryItems() {
  return Array.from(document.querySelectorAll("[data-delivery-item-qty]")).map((input) => {
    const index = input.dataset.deliveryItemQty;
    const returnedInput = document.querySelector(`[data-delivery-return-qty="${index}"]`);
    return {
      productCode: input.dataset.productCode || "",
      name: input.dataset.productName || "",
      deliveredQty: Math.max(0, numeric(input.value, 0)),
      returnedQty: Math.max(0, numeric(returnedInput ? returnedInput.value : 0, 0)),
      unitPrice: numeric(input.dataset.unitPrice, 0)
    };
  });
}

function deliveryCollectionTotals(order) {
  const baseAmount = numeric(order && order.amount, 0);
  const returnedAmount = selectedDeliveryItems().reduce((sum, item) => sum + numeric(item.returnedQty, 0) * numeric(item.unitPrice, 0), 0);
  return {
    baseAmount,
    returnedAmount: Math.max(0, Math.round(returnedAmount * 100) / 100),
    netAmount: Math.max(0, Math.round((baseAmount - returnedAmount) * 100) / 100),
    returnedQty: selectedDeliveryItems().reduce((sum, item) => sum + numeric(item.returnedQty, 0), 0)
  };
}

function validateDeliveryItemQuantities() {
  const errors = [];
  document.querySelectorAll("[data-delivery-item-qty]").forEach((input) => {
    const index = input.dataset.deliveryItemQty;
    const returnedInput = document.querySelector(`[data-delivery-return-qty="${index}"]`);
    const max = numeric(input.max, 0);
    const delivered = Math.max(0, numeric(input.value, 0));
    const returned = Math.max(0, numeric(returnedInput ? returnedInput.value : 0, 0));
    if (delivered + returned > max) {
      errors.push(`${input.dataset.productName || "Producto"} supera la cantidad pendiente.`);
    }
  });
  return errors;
}

function updateDeliveryReturnSummary() {
  const order = state.orders.find((item) => item.code === byId("deliveryCollectionOrderCode").value);
  if (!order) return;
  const totals = deliveryCollectionTotals(order);
  const totalNode = byId("deliveryReturnTotal");
  const summaryNode = byId("deliveryReturnSummary");
  if (totalNode) totalNode.textContent = money.format(totals.returnedAmount);
  if (summaryNode) {
    summaryNode.textContent = totals.returnedQty > 0
      ? `${totals.returnedQty} unidades devueltas. Total cobrable: ${money.format(totals.netAmount)}.`
      : `Sin mercaderia devuelta. Total cobrable: ${money.format(totals.netAmount)}.`;
  }
}

function deliverySummaryText(collection) {
  if (!collection || !collection.deliverySummary) return "";
  const summary = collection.deliverySummary;
  return `Productos ${summary.deliveredQty}/${summary.requestedQty} - Devueltos ${summary.returnedQty || 0} - Pendientes ${summary.pendingQty}`;
}

function openDeliveryCollection(orderCode) {
  const order = state.orders.find((item) => item.code === orderCode);
  if (!order) return;
  byId("deliveryCollectionOrderCode").value = order.code;
  byId("deliveryCollectionTitle").textContent = `${order.code} - ${order.client}`;
  byId("deliveryCollectionTotal").textContent = money.format(order.amount);
  renderDeliveryItems(order);
  byId("deliveryCollectionAlias").textContent = state.deliverySettings?.bankAlias || "Sin configurar";
  byId("deliveryPaymentMethod").value = "Efectivo";
  byId("deliveryCashAmount").value = "0";
  byId("deliveryTransferAmount").value = "0";
  byId("deliveryCreditAmount").value = "0";
  byId("deliveryCollectibleAmount").value = "0";
  byId("deliveryTransferPhoto").value = "";
  byId("deliveryTransferGallery").value = "";
  byId("deliveryTransferFile").value = "";
  byId("deliveryTransferBank").value = "";
  byId("deliveryTransferAlias").value = state.deliverySettings?.bankAlias || "";
  byId("deliveryTransferCbu").value = state.deliverySettings?.bankCbu || "";
  byId("deliveryTransferObservations").value = "";
  byId("deliveryProofPhoto").value = "";
  byId("deliveryReturnReason").value = "";
  byId("deliveryCollectionObservations").value = "";
  updateDeliveryTransferFileStatus();
  setDeliveryCollectionMessage("");
  clearDeliverySignature();
  updateDeliveryPaymentDefaults();
  byId("deliveryCollectionDialog").showModal();
}

async function submitDeliveryCollection(event) {
  event.preventDefault();
  const orderCode = byId("deliveryCollectionOrderCode").value;
  const order = state.orders.find((item) => item.code === orderCode);
  if (!order) return;
  if (!deliverySignatureDirty) {
    setDeliveryCollectionMessage("La firma del cliente es obligatoria.");
    return;
  }
  const method = byId("deliveryPaymentMethod").value;
  updateDeliveryPendingAmount();
  const cashAmount = Math.max(0, numeric(byId("deliveryCashAmount").value, 0));
  const transferAmount = Math.max(0, numeric(byId("deliveryTransferAmount").value, 0));
  const pendingAmount = Math.max(0, numeric(byId("deliveryPendingAmount").value, 0));
  const amountPaid = Math.round((cashAmount + transferAmount) * 100) / 100;
  const activePaymentParts = [cashAmount > 0, transferAmount > 0, pendingAmount > 0].filter(Boolean).length;
  const submittedMethod = method === "Transferencia Pendiente"
    ? "Transferencia Pendiente"
    : activePaymentParts > 1
    ? "Mixto"
    : transferAmount > 0
      ? "Transferencia"
      : pendingAmount > 0
        ? (method === "Transferencia Pendiente" ? "Transferencia Pendiente" : "Cuenta corriente")
        : "Efectivo";
  const deliveredItems = selectedDeliveryItems();
  const quantityErrors = validateDeliveryItemQuantities();
  if (quantityErrors.length) {
    setDeliveryCollectionMessage(quantityErrors[0]);
    return;
  }
  if (!deliveredItems.some((item) => item.deliveredQty > 0 || item.returnedQty > 0)) {
    setDeliveryCollectionMessage("Registrar al menos un producto entregado o devuelto.");
    return;
  }
  const totals = deliveryCollectionTotals(order);
  if (Math.abs(cashAmount + transferAmount + pendingAmount - totals.netAmount) > 0.01) {
    setDeliveryCollectionMessage("Efectivo + transferencia + cuenta corriente debe coincidir con el total cobrable.");
    return;
  }
  if (cashAmount + transferAmount > totals.netAmount) {
    setDeliveryCollectionMessage("El efectivo y la transferencia no pueden superar el total cobrable.");
    return;
  }
  if (totals.returnedQty > 0 && !byId("deliveryReturnReason").value.trim()) {
    setDeliveryCollectionMessage("Indicar el motivo de la devolucion.");
    return;
  }
  const transferReceipt = transferAmount > 0 ? {
    amount: transferAmount,
    bank: byId("deliveryTransferBank").value.trim(),
    alias: byId("deliveryTransferAlias").value.trim(),
    cbu: byId("deliveryTransferCbu").value.trim(),
    observations: byId("deliveryTransferObservations").value.trim()
  } : null;
  if (transferAmount > 0) {
    if (transferAmount <= 0) {
      setDeliveryCollectionMessage("La transferencia debe registrar un importe cobrado mayor a cero.");
      return;
    }
    if (!transferReceipt.bank) {
      setDeliveryCollectionMessage("Seleccionar el banco del comprobante de transferencia.");
      return;
    }
    if (!deliveryTransferAttachmentFile()) {
      setDeliveryCollectionMessage("Adjuntar foto, captura o PDF del comprobante de transferencia.");
      return;
    }
  }
  const submit = byId("deliveryCollectionSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Registrando...";
  setDeliveryCollectionMessage("Guardando GPS y evidencias...", "info");
  try {
    const gps = await requireDeliveryLocation();
    const signatureData = byId("deliverySignatureCanvas").toDataURL("image/png");
    const transferData = await fileToEvidenceDataUrl(deliveryTransferAttachmentFile());
    const proofData = await fileToCompressedDataUrl(byId("deliveryProofPhoto").files[0]);
    const uploads = await Promise.all([
      uploadDeliveryImage(orderCode, "signature", signatureData),
      uploadDeliveryImage(orderCode, "transfer", transferData),
      uploadDeliveryImage(orderCode, "delivery", proofData)
    ]);
    const attachments = {};
    uploads.filter(Boolean).forEach((upload) => { attachments[upload.kind] = upload; });
    if (transferReceipt) transferReceipt.attachment = attachments.transfer || null;
    const payload = await postOperationalAction(`api/delivery/orders/${encodeURIComponent(orderCode)}/collect`, deliveryActionBody(gps, {
      method: submittedMethod || method,
      amountPaid,
      pendingAmount,
      paymentSplit: {
        cashAmount,
        transferAmount,
        creditAmount: pendingAmount,
        total: totals.netAmount
      },
      deliveredItems,
      attachments,
      transferReceipt,
      returnReason: byId("deliveryReturnReason").value.trim(),
      observations: byId("deliveryCollectionObservations").value.trim()
    }));
    byId("deliveryCollectionDialog").close("default");
    showCompactNotice(payload.nextStop ? `Entrega registrada. Sigue: ${payload.nextStop.client}.` : "Ruta completada.", "ok");
  } catch (error) {
    setDeliveryCollectionMessage("No se pudo registrar la entrega. Reintentar o volver al reparto.");
    showDeliveryRecovery({
      title: "No se pudo registrar la entrega",
      message: "La entrega no se guardo. Podes reintentar cuando vuelva la conexion.",
      error,
      action: "registrar_entrega",
      retry: () => byId("deliveryCollectionForm").requestSubmit()
    });
  } finally {
    submit.disabled = false;
    submit.textContent = "Confirmar entrega";
  }
}

function updateDeliveryExceptionMode() {
  const status = byId("deliveryExceptionStatus").value;
  const signatureBox = byId("deliveryExceptionSignatureBox");
  if (signatureBox) signatureBox.hidden = status !== ORDER_STATUS.REJECTED;
  if (status === ORDER_STATUS.REJECTED && !byId("deliveryExceptionReason").value) {
    byId("deliveryExceptionReason").value = "Pedido rechazado";
  }
  byId("deliveryExceptionTitle").textContent = status;
}

function openDeliveryException(orderCode, status) {
  const order = state.orders.find((item) => item.code === orderCode);
  if (!order) return;
  byId("deliveryExceptionOrderCode").value = order.code;
  byId("deliveryExceptionStatus").value = status || ORDER_STATUS.NOT_DELIVERED;
  byId("deliveryExceptionReason").value = "";
  byId("deliveryExceptionObservations").value = "";
  byId("deliveryExceptionPhoto").value = "";
  setDeliveryExceptionMessage("");
  clearDeliveryExceptionSignature();
  updateDeliveryExceptionMode();
  byId("deliveryExceptionDialog").showModal();
}

async function submitDeliveryException(event) {
  event.preventDefault();
  const orderCode = byId("deliveryExceptionOrderCode").value;
  const status = byId("deliveryExceptionStatus").value;
  const reason = byId("deliveryExceptionReason").value.trim();
  const observations = byId("deliveryExceptionObservations").value.trim();
  if (!reason) {
    setDeliveryExceptionMessage("Seleccionar motivo.");
    return;
  }
  if (!observations) {
    setDeliveryExceptionMessage("Completar observacion para administracion.");
    return;
  }
  if (status === ORDER_STATUS.REJECTED && !deliveryExceptionSignatureDirty) {
    setDeliveryExceptionMessage("El rechazo requiere firma digital del cliente.");
    return;
  }
  const submit = byId("deliveryExceptionSubmitBtn");
  submit.disabled = true;
  submit.textContent = "Registrando...";
  setDeliveryExceptionMessage("Tomando GPS y guardando incidencia...", "info");
  try {
    const gps = await requireDeliveryLocation();
    const signatureData = status === ORDER_STATUS.REJECTED
      ? byId("deliveryExceptionSignatureCanvas").toDataURL("image/png")
      : "";
    const photoData = await fileToCompressedDataUrl(byId("deliveryExceptionPhoto").files[0]);
    const uploads = await Promise.all([
      uploadDeliveryImage(orderCode, "signature", signatureData),
      uploadDeliveryImage(orderCode, "exception-photo", photoData)
    ]);
    const attachments = {};
    uploads.filter(Boolean).forEach((upload) => { attachments[upload.kind] = upload; });
    const payload = await postOperationalAction(`api/delivery/orders/${encodeURIComponent(orderCode)}/exception`, deliveryActionBody(gps, {
      status,
      reason,
      observations,
      attachments
    }));
    cleanupOperationalLocalData("incidencia reparto");
    byId("deliveryExceptionDialog").close("default");
    showCompactNotice(payload.nextStop ? `Incidencia registrada. Sigue: ${payload.nextStop.client}.` : "Incidencia registrada. Ruta sin mas paradas.", "warn");
  } catch (error) {
    setDeliveryExceptionMessage(error.message || "No se pudo registrar la incidencia.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Registrar incidencia";
  }
}

byId("deliveryDeviceLabel").addEventListener("change", (event) => {
  saveDeliveryDevice(event.target.value);
  renderDelivery();
});

byId("clearDeliveryPlannerBtn").addEventListener("click", () => {
  deliveryPlannerSelection.clear();
  renderDelivery();
});

byId("deliveryPlannerSort").addEventListener("change", (event) => {
  deliveryPlannerSortKey = event.target.value;
  renderDeliveryPlanner();
});

byId("deliveryPlannerGroupRoute").addEventListener("change", (event) => {
  deliveryPlannerGroupByRoute = event.target.checked;
  renderDeliveryPlanner();
});

byId("deliveryPlannerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const orderCodes = Array.from(deliveryPlannerSelection);
  if (!orderCodes.length) {
    window.alert("Seleccionar pedidos Listos para Despacho con domicilio o GPS valido.");
    return;
  }
  try {
    const payload = await postOperationalAction("api/delivery/routes/plan", {
      orderCodes,
      day: form.get("day"),
      zone: form.get("zone"),
      driverUser: form.get("driverUser"),
      driverLabel: form.get("driverLabel")
    });
    deliveryPlannerSelection.clear();
    activeDeliveryRouteId = payload.route.id;
    window.alert(`Hoja ${payload.route.id} planificada. Revisar el orden y publicar despacho cuando salga a reparto.`);
  } catch (error) {
    window.alert(error.message || "No se pudo crear la hoja de ruta.");
  }
});

byId("deliverySettingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await postOperationalAction("api/delivery/settings", deliveryActionBody(deliveryLocation, {
      bankAlias: form.get("bankAlias"),
      bankAccountName: form.get("bankAccountName"),
      bankCbu: form.get("bankCbu"),
      depotLat: form.get("depotLat"),
      depotLng: form.get("depotLng")
    }));
    window.alert("Configuracion de cobranza guardada.");
  } catch (error) {
    window.alert(error.message || "No se pudo guardar la configuracion.");
  }
});

document.addEventListener("change", (event) => {
  const plannerOrder = event.target.closest("[data-planner-order]");
  if (!plannerOrder) return;
  if (plannerOrder.checked) deliveryPlannerSelection.add(plannerOrder.dataset.plannerOrder);
  else deliveryPlannerSelection.delete(plannerOrder.dataset.plannerOrder);
  renderDeliveryPlanner();
});

document.addEventListener("change", (event) => {
  const sequence = event.target.closest("[data-route-sequence]");
  if (sequence) applyDeliverySequenceChange(sequence, false);
});

document.addEventListener("keydown", (event) => {
  const sequence = event.target.closest("[data-route-sequence]");
  if (!sequence || !["Enter", "Tab"].includes(event.key)) return;
  event.preventDefault();
  applyDeliverySequenceChange(sequence, true);
});

document.addEventListener("click", async (event) => {
  const presenceMapsButton = event.target.closest("[data-presence-open-maps]");
  if (presenceMapsButton) {
    event.preventDefault();
    const point = presenceLocationActions.get(presenceMapsButton.dataset.presenceOpenMaps || "");
    const url = presenceMapsUrl(point);
    if (!url || !openExternalUrl(url, "Google Maps")) {
      window.alert("No se pudo abrir Maps para esta ubicacion.");
    }
    return;
  }
  const presenceCopyGps = event.target.closest("[data-presence-copy-gps]");
  if (presenceCopyGps) {
    event.preventDefault();
    const point = presenceLocationActions.get(presenceCopyGps.dataset.presenceCopyGps || "");
    if (!point || !point.location) {
      window.alert("No hay GPS activo para copiar.");
      return;
    }
    await copyTextToClipboard(
      `${Number(point.location.lat).toFixed(6)}, ${Number(point.location.lng).toFixed(6)}`,
      "Coordenadas copiadas."
    );
    return;
  }
  const presenceCopyCard = event.target.closest("[data-presence-copy-card]");
  if (presenceCopyCard) {
    event.preventDefault();
    const point = presenceLocationActions.get(presenceCopyCard.dataset.presenceCopyCard || "");
    const text = presenceLocationText(point);
    if (!text) {
      window.alert("No hay ficha de ubicacion para copiar.");
      return;
    }
    await copyTextToClipboard(text, "Ficha de ubicacion copiada.");
    return;
  }
  const presenceFilter = event.target.closest("[data-presence-map-filter]");
  if (presenceFilter) {
    presenceMapFilter = presenceFilter.dataset.presenceMapFilter || "all";
    dashboardPresenceLastRenderAt = 0;
    dashboardPresenceGoogleSignature = "";
    renderDashboardPresence();
    renderRoutes();
    return;
  }
  const selectRoute = event.target.closest("[data-delivery-route]");
  if (selectRoute) {
    activeDeliveryRouteId = selectRoute.dataset.deliveryRoute;
    renderDelivery();
    return;
  }
  const publish = event.target.closest("[data-publish-route]");
  if (publish) {
    const route = state.deliveryRoutes.find((item) => item.id === publish.dataset.publishRoute);
    const label = route ? `${route.id} para ${route.deviceLabel || route.driverUser}` : publish.dataset.publishRoute;
    if (!window.confirm(`Publicar ${label} y pasar sus pedidos a Despachado?`)) return;
    publish.disabled = true;
    try {
      await postOperationalAction(`api/delivery/routes/${encodeURIComponent(publish.dataset.publishRoute)}/publish`, deliveryActionBody(null));
      activeDeliveryRouteId = publish.dataset.publishRoute;
      window.alert("Ruta publicada. El repartidor ya puede tomarla desde su telefono.");
    } catch (error) {
      window.alert(error.message || "No se pudo publicar la ruta.");
    } finally {
      publish.disabled = false;
    }
    return;
  }
  const move = event.target.closest("[data-route-move]");
  if (move) {
    const route = state.deliveryRoutes.find((item) => item.id === move.dataset.routeMove);
    if (!route) return;
    const direction = Number(move.dataset.direction);
    const codes = route.stops.map((stop) => stop.orderCode);
    const index = codes.indexOf(move.dataset.orderCode);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= codes.length) return;
    [codes[index], codes[nextIndex]] = [codes[nextIndex], codes[index]];
    move.disabled = true;
    try {
      await postOperationalAction(`api/delivery/routes/${encodeURIComponent(route.id)}/reorder`, {
        orderCodes: codes
      });
      activeDeliveryRouteId = route.id;
    } catch (error) {
      window.alert(error.message || "No se pudo reordenar la ruta.");
    } finally {
      move.disabled = false;
    }
    return;
  }
  const claim = event.target.closest("[data-claim-route]");
  if (claim) {
    try {
      await postOperationalAction(`api/delivery/routes/${encodeURIComponent(claim.dataset.claimRoute)}/claim`, deliveryActionBody(deliveryLocation));
      activeDeliveryRouteId = claim.dataset.claimRoute;
    } catch (error) {
      window.alert(error.message || "No se pudo tomar la ruta.");
    }
    return;
  }
  const closeRoute = event.target.closest("[data-close-route]");
  if (closeRoute) {
    openDeliveryRouteClosure(closeRoute.dataset.closeRoute);
    return;
  }
  const routeMapOpen = event.target.closest("[data-delivery-route-map-open]");
  if (routeMapOpen) {
    const route = state.deliveryRoutes.find((item) => item.id === routeMapOpen.dataset.deliveryRouteMapOpen);
    const url = deliveryRouteDirectionsUrl(route);
    if (!url) {
      showDeliveryRecovery({
        title: "Recorrido sin destinos",
        message: "La hoja de ruta no tiene paradas pendientes con domicilio o coordenadas.",
        action: "abrir_recorrido",
        retry: () => renderDelivery()
      });
      return;
    }
    try {
      const opened = openExternalUrl(url, "recorrido de Google Maps");
      if (!opened) throw new Error("El dispositivo bloqueo la apertura de Google Maps.");
    } catch (error) {
      showDeliveryRecovery({
        title: "No se pudo abrir el recorrido",
        message: "Podes usar IR AL CLIENTE en cada parada.",
        error,
        url,
        action: "abrir_recorrido",
        retry: () => openExternalUrl(url, "recorrido de Google Maps")
      });
    }
    return;
  }
  const map = event.target.closest("[data-delivery-map]");
  if (map) {
    const url = DeliveryEngine.navigationUrl(state, map.dataset.deliveryMap);
    if (!url) {
      showDeliveryRecovery({
        title: "Mapa sin destino",
        message: "El cliente no tiene domicilio ni coordenadas cargadas.",
        action: "abrir_mapa",
        retry: () => renderDelivery()
      });
      return;
    }
    try {
      const opened = openExternalUrl(url, "Google Maps");
      if (!opened) throw new Error("El dispositivo bloqueo la apertura de Google Maps.");
    } catch (error) {
      showDeliveryRecovery({
        title: "No se pudo abrir el mapa",
        message: "Podes reintentar o copiar el detalle para soporte.",
        error,
        url,
        action: "abrir_mapa",
        retry: () => openExternalUrl(url, "Google Maps")
      });
    }
    return;
  }
  const statusButton = event.target.closest("[data-delivery-status]");
  if (statusButton) {
    statusButton.disabled = true;
    try {
      const gps = await requireDeliveryLocation();
      await postOperationalAction(`api/delivery/orders/${encodeURIComponent(statusButton.dataset.deliveryStatus)}/status`, deliveryActionBody(gps, {
        status: statusButton.dataset.status
      }));
    } catch (error) {
      showDeliveryRecovery({
        title: "No se pudo actualizar la parada",
        message: "Podes reintentar cuando vuelva la conexion o volver al reparto.",
        error,
        action: "cambiar_estado",
        retry: () => statusButton.click()
      });
    } finally {
      statusButton.disabled = false;
    }
    return;
  }
  const collect = event.target.closest("[data-delivery-collect]");
  if (collect) openDeliveryCollection(collect.dataset.deliveryCollect);
  const exception = event.target.closest("[data-delivery-exception]");
  if (exception) openDeliveryException(exception.dataset.deliveryException, exception.dataset.exceptionStatus);
});

byId("deliveryPaymentMethod").addEventListener("change", updateDeliveryPaymentDefaults);
byId("deliveryCashAmount").addEventListener("input", updateDeliveryPendingAmount);
byId("deliveryTransferAmount").addEventListener("input", updateDeliveryPendingAmount);
document.querySelectorAll("[data-delivery-payment-preset]").forEach((button) => {
  button.addEventListener("click", () => applyDeliveryPaymentPreset(button.dataset.deliveryPaymentPreset));
});
["deliveryTransferPhoto", "deliveryTransferGallery", "deliveryTransferFile"].forEach((id) => {
  byId(id).addEventListener("change", () => {
    keepOnlySelectedFileInput(id, ["deliveryTransferPhoto", "deliveryTransferGallery", "deliveryTransferFile"]);
    updateDeliveryTransferFileStatus();
  });
});
byId("deliveryItemsList").addEventListener("input", () => {
  updateDeliveryReturnSummary();
  updateDeliveryPaymentDefaults();
});
byId("deliveryItemsList").addEventListener("change", () => {
  updateDeliveryReturnSummary();
  updateDeliveryPaymentDefaults();
});
byId("clearDeliverySignatureBtn").addEventListener("click", clearDeliverySignature);
byId("clearDeliveryExceptionSignatureBtn").addEventListener("click", clearDeliveryExceptionSignature);
byId("deliveryExceptionStatus").addEventListener("change", updateDeliveryExceptionMode);
byId("deliveryExceptionForm").addEventListener("submit", submitDeliveryException);
byId("deliveryCollectionForm").addEventListener("submit", submitDeliveryCollection);
byId("deliveryClosureCashReported").addEventListener("input", updateDeliveryClosurePreview);
byId("deliveryClosureTransferReported").addEventListener("input", updateDeliveryClosurePreview);
byId("deliveryCashBreakdownGrid").addEventListener("input", updateDeliveryClosurePreview);
byId("deliveryClosureDifferenceReason").addEventListener("change", updateDeliveryClosurePreview);
byId("deliveryRouteClosureForm").addEventListener("submit", submitDeliveryRouteClosure);
byId("deliveryRecoveryBackBtn").addEventListener("click", () => {
  const dialog = byId("deliveryRecoveryDialog");
  if (dialog.open) dialog.close("back");
  switchView("reparto");
  renderDelivery();
});
byId("deliveryRecoveryRetryBtn").addEventListener("click", () => {
  const retry = deliveryRecoveryRetry;
  const dialog = byId("deliveryRecoveryDialog");
  if (dialog.open) dialog.close("retry");
  if (retry) retry();
});
byId("deliveryRecoveryCopyBtn").addEventListener("click", async () => {
  const text = byId("deliveryRecoveryTechnical").value || "";
  try {
    await navigator.clipboard.writeText(text);
    showCompactNotice("Detalle tecnico copiado.", "ok");
  } catch {
    byId("deliveryRecoveryTechnical").hidden = false;
    byId("deliveryRecoveryTechnical").select();
  }
});
byId("deliveryRecoveryReturnBtn").addEventListener("click", () => {
  const dialog = byId("deliveryRecoveryDialog");
  if (dialog.open) dialog.close("return");
  switchView("reparto");
  renderDelivery();
});
initializeDeliverySignature();
initializeDeliveryExceptionSignature();

const resetDemoButton = byId("resetDemoBtn");
if (resetDemoButton) {
  resetDemoButton.addEventListener("click", () => {
    alert("Reinicio demo deshabilitado para proteger clientes, stock y pedidos cargados.");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

async function pullStateFromServer() {
  if (syncPullInFlight || syncPushInFlight) {
    pendingPullAfterPush = true;
    return;
  }
  syncPullInFlight = true;
  try {
    const response = await fetchWithTimeout(apiUrl(`api/state?version=${encodeURIComponent(syncVersion || 0)}`), { cache: "no-store" }, SERVER_TIMEOUT_MS);
    if (response.status === 401) {
      stopRealtimeChannels();
      currentUser = null;
      showLogin("Sesion vencida. Ingresar nuevamente.");
      return;
    }
    if (!response.ok) {
      syncReady = false;
      setSyncStatus("Servidor sin respuesta para sincronizar.", "danger");
      return;
    }
    const payload = await response.json();
    const previousSyncVersion = syncVersion || 0;
    applyPresencePayload(payload);
    syncReady = true;
    setSyncStatus(`Conectado con distribuidora - ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`, "ok");
    updateConnectionDiagnostics({
      status: "OK",
      apiStatus: "OK",
      syncStatus: "Online",
      lastSuccess: new Date().toISOString(),
      lastError: ""
    });
    if (payload.unchanged && !payload.state) {
      if (payload.version) syncVersion = Math.max(previousSyncVersion, Number(payload.version) || 0);
      const now = Date.now();
      if (now - lastPresenceRenderAt > 5000) {
        applyPresenceToState();
        lastPresenceRenderAt = now;
        if (isOperationalMobileUser()) renderOperationalRole();
        else if (activeViewId() === "admin") renderSessionMonitor();
        else if (activeViewId() === "estadisticas") renderRoutes();
      }
      return;
    }
    if (payload.state && payload.version > previousSyncVersion) {
      const hadMissingLocations = (payload.state.sellers || []).some((seller) => !seller.location);
      const nextState = normalizeState(payload.state);
      trackIncomingNotifications(nextState);
      state = nextState;
      applyPresenceToState();
      const restoredOwnLocation = mergeOwnLocationIntoState();
      syncVersion = payload.version;
      persistLocalMeta("pullStateFromServer");
      scheduleRenderForCurrentUser();
      if (!isOperationalMobileUser() && (hadMissingLocations || restoredOwnLocation)) pushStateToServer();
    } else if (payload.state) {
      applyPresenceToState();
      if (!renderOperationalRole()) {
        renderSessionMonitor();
        renderRoutes();
      }
    } else if (!payload.state && syncVersion === 0) {
      await pushStateToServer();
    }
  } catch {
    syncReady = false;
    setSyncStatus("Sin conexion con el servidor local.", "danger");
    updateConnectionDiagnostics({
      status: "Error",
      apiStatus: "Sin respuesta",
      syncStatus: "Offline",
      lastError: `No se pudo sincronizar ${apiUrl("api/state")}`
    });
  } finally {
    syncPullInFlight = false;
  }
}

async function pushStateToServer() {
  if (syncPushInFlight) return;
  syncPushInFlight = true;
  try {
    const response = await fetchWithTimeout(apiUrl("api/state"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ state: getStateForServer(), baseVersion: syncVersion || 0 })
    }, SERVER_TIMEOUT_MS);
    if (response.status === 401) {
      stopRealtimeChannels();
      currentUser = null;
      showLogin("Sesion vencida. Ingresar nuevamente.");
      return;
    }
    if (response.status === 409) {
      syncReady = false;
      setSyncStatus("Actualizando cambios mas nuevos del servidor...", "warn");
      window.setTimeout(pullStateFromServer, 100);
      return;
    }
    if (!response.ok) {
      syncReady = false;
      setSyncStatus("No se pudo enviar al dashboard.", "danger");
      return;
    }
    const payload = await response.json();
    syncReady = true;
    syncVersion = payload.version || syncVersion;
    setSyncStatus(`Sincronizado con dashboard - ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`, "ok");
  } catch {
    syncReady = false;
    setSyncStatus("No se pudo conectar con el dashboard.", "danger");
  } finally {
    syncPushInFlight = false;
    if (pendingPullAfterPush) {
      pendingPullAfterPush = false;
      window.setTimeout(pullStateFromServer, 80);
    }
  }
}

function startAuthenticatedApp() {
  readNotificationIds = loadReadNotificationIds();
  knownNotificationIds = new Set();
  notificationTrackerReady = false;
  showApp();
  applyCurrentUserRole();
  startPresenceHeartbeat();
  const initialView = location.hash.replace("#", "");
  if (currentUser && currentUser.role === "seller") {
    switchView("preventa");
    startSellerLocationAutoRefresh();
    startPresenceLocationService();
  } else if (currentUser && currentUser.role === "driver") {
    switchView("reparto");
    startDeliveryLocationAutoRefresh();
    startPresenceLocationService();
  } else if (currentUser && currentUser.role === "receiver") {
    switchView("proveedores");
  } else if (currentUser && currentUser.role === "depot") {
    switchView("armado");
  } else if (window.matchMedia("(max-width: 720px)").matches) {
    switchView("preventa");
    startSellerLocationAutoRefresh();
    startPresenceLocationService();
  } else if (titles[initialView]) {
    switchView(initialView);
  }
  installAppBackGuard();
  renderForCurrentUser();
  pullStateFromServer();
  if (!syncIntervalId) syncIntervalId = setInterval(pullStateFromServer, currentSyncIntervalMs());
}

function bootApp() {
  showLogin("Verificando sesion...");
  checkSession();
}

bootApp();





