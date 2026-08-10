const MAX_EVENTS = 3000;
const MAX_OUTBOX = 3000;

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value === null ? null : String(value);
  }
}

function eventId(prefix = "EVT") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function ensureState(state) {
  if (!state || typeof state !== "object") return state;
  state.domainEvents = Array.isArray(state.domainEvents) ? state.domainEvents : [];
  state.integrationOutbox = Array.isArray(state.integrationOutbox) ? state.integrationOutbox : [];
  return state;
}

const ACTION_EVENT_TYPES = {
  PEDIDO_CREADO: "order.created",
  PEDIDO_EDITADO: "order.updated",
  PEDIDO_MODIFICADO: "order.updated",
  PEDIDO_AVANZADO: "order.status.changed",
  PEDIDO_ESTADO: "order.status.changed",
  PEDIDO_DESPACHADO: "order.dispatched",
  PEDIDO_ENTREGADO: "order.delivered",
  PEDIDO_CANCELADO: "order.cancelled",
  PEDIDO_PRIORIDAD: "order.priority.changed",
  PEDIDO_ETIQUETA_GENERADA: "order.label.generated",
  PEDIDO_ETIQUETA_ESCANEADA: "order.label.scanned",
  PEDIDO_ETIQUETA_INVALIDADA: "order.label.invalidated",
  STOCK_MOVIMIENTO: "stock.changed",
  STOCK_IMPRESION: "stock.report.printed",
  CLIENTE_EDITADO: "client.updated",
  CLIENTE_CAMBIO_SENSIBLE: "client.sensitive.changed",
  RUTA_PLANIFICADA: "route.planned",
  RUTA_REORDENADA: "route.reordered",
  RUTA_PUBLICADA: "route.published",
  RUTA_PUBLICADA_DESPACHO: "route.published",
  RUTA_TOMADA: "route.started",
  RUTA_INICIADA: "route.started",
  RUTA_CIERRE_DIARIO: "route.closed",
  RUTA_CERRADA: "route.closed",
  REPARTO_ESTADO: "delivery.status.changed",
  REPARTO_ENTREGA_COBRANZA: "delivery.completed",
  EVIDENCIA_REPARTO_CARGADA: "delivery.evidence.uploaded",
  COMPROBANTE_SUBIDO: "payment.receipt.uploaded",
  COMPROBANTE_VALIDADO: "payment.receipt.validated",
  COMPROBANTE_RECHAZADO: "payment.receipt.rejected",
  TRANSFERENCIA_ESTADO: "payment.transfer.status.changed",
  REPARTO_CONFIGURACION: "config.delivery.updated",
  SYNC_PEDIDO: "sync.order.changed",
  SYNC_CLIENTE: "sync.client.changed",
  SYNC_PRODUCTO: "sync.product.changed",
  SYNC_CUENTA: "sync.account.changed",
  SYNC_TRANSFERENCIA: "sync.transfer.changed",
  SYNC_RUTA: "sync.route.changed"
};

function actionToEventType(action) {
  const key = String(action || "").trim().toUpperCase();
  return ACTION_EVENT_TYPES[key] || `system.${key.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "event"}`;
}

function moduleForEventType(type) {
  const root = String(type || "").split(".")[0];
  const modules = {
    order: "Pedidos",
    stock: "Stock",
    client: "Clientes",
    route: "Reparto",
    delivery: "Reparto",
    payment: "Cobranza",
    config: "Configuracion",
    sync: "Sincronizacion",
    notification: "Notificaciones"
  };
  return modules[root] || "Sistema";
}

function integrationTargetsForEvent(event) {
  const type = String(event && event.type || "");
  const targets = new Set();

  if (type.startsWith("order.")) {
    targets.add("portal_cliente");
    if (["order.created", "order.status.changed", "order.dispatched", "order.delivered", "order.cancelled"].includes(type)) {
      targets.add("whatsapp");
      targets.add("email");
    }
    if (["order.delivered", "order.closed", "order.collected"].includes(type)) {
      targets.add("arca_facturacion");
    }
  }

  if (type.startsWith("payment.")) {
    targets.add("conciliacion_bancaria");
    if (type.includes("receipt")) {
      targets.add("ocr_comprobantes");
      targets.add("ia_validacion");
    }
  }

  if (type.startsWith("delivery.") || type.startsWith("route.")) {
    targets.add("geolocalizacion_tiempo_real");
    targets.add("portal_cliente");
    if (type === "delivery.completed") targets.add("arca_facturacion");
  }

  if (type.startsWith("client.")) {
    targets.add("portal_cliente");
  }

  if (type.startsWith("stock.")) {
    targets.add("ia_reposicion_stock");
  }

  return Array.from(targets);
}

function buildEventFromAudit(audit) {
  if (!audit) return null;
  const type = actionToEventType(audit.action);
  return {
    id: `EVT-${audit.id || eventId("AUD")}`,
    type,
    module: moduleForEventType(type),
    action: String(audit.action || ""),
    source: "audit",
    sourceId: audit.id || "",
    at: audit.at || nowIso(),
    date: audit.date || "",
    time: audit.time || "",
    actor: {
      user: audit.user || "Sistema",
      username: audit.username || "",
      role: audit.role || ""
    },
    entity: {
      type: audit.entityType || "",
      id: audit.entityId || "",
      label: audit.entityLabel || ""
    },
    context: {
      ip: audit.ip || "",
      device: clone(audit.device),
      gps: clone(audit.gps),
      endpoint: audit.endpoint || ""
    },
    payload: {
      previousValue: clone(audit.previousValue),
      newValue: clone(audit.newValue),
      note: audit.note || ""
    },
    schemaVersion: 1
  };
}

function buildEventFromNotification(notification) {
  if (!notification) return null;
  const sourceAction = String(notification.action || "NOTIFICACION");
  const type = sourceAction === "LIMITE_CREDITO_SUPERADO"
    ? "credit.limit.exceeded"
    : `notification.${sourceAction.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "raised"}`;
  return {
    id: `EVT-${notification.id || eventId("NOTI")}`,
    type,
    module: moduleForEventType(type),
    action: sourceAction,
    source: "notification",
    sourceId: notification.id || "",
    at: notification.at || nowIso(),
    date: notification.date || "",
    time: notification.time || "",
    actor: {
      user: notification.user || "Sistema",
      username: notification.username || "",
      role: notification.role || ""
    },
    entity: {
      type: notification.entityType || "",
      id: notification.entityId || "",
      label: notification.entityLabel || ""
    },
    context: {
      ip: notification.ip || "",
      device: clone(notification.device),
      gps: clone(notification.gps),
      endpoint: notification.endpoint || ""
    },
    payload: {
      title: notification.title || "",
      text: notification.text || "",
      category: notification.category || "",
      tone: notification.tone || "",
      audience: clone(notification.audience)
    },
    schemaVersion: 1
  };
}

function appendEvent(state, event) {
  ensureState(state);
  if (!event || !event.id) return null;
  const exists = state.domainEvents.some((item) => item && item.id === event.id);
  if (!exists) {
    state.domainEvents.unshift(event);
    state.domainEvents = state.domainEvents.slice(0, MAX_EVENTS);
    queueIntegrationOutbox(state, event);
  }
  return event;
}

function queueIntegrationOutbox(state, event) {
  const targets = integrationTargetsForEvent(event);
  targets.forEach((target) => {
    const id = `OUT-${event.id}-${target}`;
    if (state.integrationOutbox.some((item) => item && item.id === id)) return;
    state.integrationOutbox.unshift({
      id,
      eventId: event.id,
      eventType: event.type,
      target,
      status: "queued-disabled",
      enabled: false,
      reason: "Connector pendiente de configuracion",
      attempts: 0,
      createdAt: nowIso(),
      lastAttemptAt: null
    });
  });
  state.integrationOutbox = state.integrationOutbox.slice(0, MAX_OUTBOX);
}

function emitFromAuditEntries(state, entries) {
  ensureState(state);
  (Array.isArray(entries) ? entries : [entries])
    .filter(Boolean)
    .map(buildEventFromAudit)
    .forEach((event) => appendEvent(state, event));
  return state;
}

function emitFromNotificationEntries(state, entries) {
  ensureState(state);
  (Array.isArray(entries) ? entries : [entries])
    .filter(Boolean)
    .map(buildEventFromNotification)
    .forEach((event) => appendEvent(state, event));
  return state;
}

function migrateState(state) {
  ensureState(state);
  state.domainEvents = state.domainEvents
    .filter((event, index, list) => event && event.id && list.findIndex((item) => item.id === event.id) === index)
    .slice(0, MAX_EVENTS);
  state.integrationOutbox = state.integrationOutbox
    .filter((item, index, list) => item && item.id && list.findIndex((entry) => entry.id === item.id) === index)
    .slice(0, MAX_OUTBOX);
  return state;
}

function queryEvents(state, filter = {}) {
  ensureState(state);
  const entityType = String(filter.entityType || "").trim();
  const entityId = String(filter.entityId || "").trim();
  const type = String(filter.type || "").trim();
  const moduleName = String(filter.module || "").trim();
  return state.domainEvents
    .filter((event) => !entityType || event.entity.type === entityType)
    .filter((event) => !entityId || event.entity.id === entityId)
    .filter((event) => !type || event.type === type)
    .filter((event) => !moduleName || event.module === moduleName)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}

module.exports = {
  ensureState,
  migrateState,
  actionToEventType,
  integrationTargetsForEvent,
  emitFromAuditEntries,
  emitFromNotificationEntries,
  queryEvents
};
