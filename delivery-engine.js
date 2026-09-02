(function initDeliveryEngine(root, factory) {
  const orderEngine = typeof module === "object" && module.exports
    ? require("./order-engine")
    : root.DLOrderEngine;
  const accountEngine = typeof module === "object" && module.exports
    ? require("./account-engine")
    : root.DLAccountEngine;
  const engine = factory(orderEngine, accountEngine);
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DLDeliveryEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildDeliveryEngine(orderEngine, accountEngine) {
  "use strict";

  const STATUS = orderEngine.STATUS;
  const PAYMENT_METHODS = new Set(["Efectivo", "Transferencia", "Transferencia Pendiente", "Cuenta corriente", "Mixto"]);
  const ROUTE_STATUS = {
    PLANNED: "Planificada",
    READY: "Despachada",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completada",
    LEGACY_PENDING: "Pendiente"
  };
  const DELIVERY_FINAL_STATUSES = new Set([STATUS.PARTIAL_DELIVERED, STATUS.DELIVERED, STATUS.COLLECTED, STATUS.CLOSED]);
  const DELIVERY_EXCEPTION_STATUSES = new Set([STATUS.NOT_DELIVERED, STATUS.POSTPONED, STATUS.REJECTED]);
  const FINAL_STOP_STATUSES = new Set([...DELIVERY_FINAL_STATUSES, ...DELIVERY_EXCEPTION_STATUSES]);
  const REPLANNABLE_STATUSES = new Set([STATUS.READY_DISPATCH, STATUS.NOT_DELIVERED, STATUS.POSTPONED]);

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function moneyValue(value) {
    return Math.max(0, Math.round(numeric(value, 0) * 100) / 100);
  }

  function signedMoneyValue(value) {
    return Math.round(numeric(value, 0) * 100) / 100;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function routeDay(value) {
    return new Date(value || Date.now()).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function slug(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sin-zona";
  }

  function ensureState(state) {
    state.deliverySettings = {
      bankAlias: "DISTRIBUIDORA.LOPEZ",
      bankAccountName: "Distribuidora Lopez",
      bankCbu: "",
      depotLat: -31.4167,
      depotLng: -64.1833,
      ...state.deliverySettings
    };
    state.deliveryRoutes = Array.isArray(state.deliveryRoutes) ? state.deliveryRoutes : [];
    state.deliveryAudit = Array.isArray(state.deliveryAudit) ? state.deliveryAudit : [];
    state.deliveryClosures = Array.isArray(state.deliveryClosures) ? state.deliveryClosures : [];
    state.routeLearning = state.routeLearning && typeof state.routeLearning === "object" ? state.routeLearning : {};
    state.routeLearning.visits = Array.isArray(state.routeLearning.visits) ? state.routeLearning.visits : [];
    state.routeLearning.clientStats = Array.isArray(state.routeLearning.clientStats) ? state.routeLearning.clientStats : [];
    state.routeLearning.recommendations = Array.isArray(state.routeLearning.recommendations) ? state.routeLearning.recommendations : [];
    state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    return state;
  }

  function findOrder(state, code) {
    return (state.orders || []).find((order) => order.code === code) || null;
  }

  function findClient(state, name) {
    const clients = state.clients || [];
    const exact = clients.find((client) => client.name === name);
    if (exact) return exact;
    const normalized = normalizeText(name);
    return clients.find((client) => normalizeText(client.name) === normalized || normalizeText(client.nombre_comercial) === normalized) || null;
  }

  function clientCoordinates(client) {
    if (!client) return null;
    const source = client.location || client.geolocation || client.gps || client;
    const lat = numeric(source.lat ?? source.latitude ?? client.latitud, NaN);
    const lng = numeric(source.lng ?? source.longitude ?? client.longitud, NaN);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  function clientAddress(client) {
    if (!client || (!client.domicilio && !client.localidad)) return "";
    return [client.domicilio, client.localidad || "Cordoba", "Argentina"].filter(Boolean).join(", ");
  }

  function clientHours(client) {
    return String(client && (client.horario_atencion || client.horario || client.observaciones) || "Sin horario informado");
  }

  function haversineKm(a, b) {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    const rad = (degree) => degree * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const lat1 = rad(a.lat);
    const lat2 = rad(b.lat);
    const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function routeLearningKey(clientName) {
    return normalizeText(clientName) || "sin-cliente";
  }

  function updateRouteLearningStats(state, visit) {
    const learning = ensureState(state).routeLearning;
    const key = routeLearningKey(visit.client);
    let stat = learning.clientStats.find((item) => item.key === key);
    if (!stat) {
      stat = {
        key,
        client: visit.client,
        visits: 0,
        completed: 0,
        exceptions: 0,
        averageDurationMinutes: 0,
        averageSequence: 0,
        commonHours: {},
        lastVisitAt: ""
      };
      learning.clientStats.push(stat);
    }
    stat.visits += 1;
    if (visit.finalStatus === STATUS.DELIVERED || visit.finalStatus === STATUS.COLLECTED || visit.finalStatus === STATUS.CLOSED) {
      stat.completed += 1;
    }
    if (DELIVERY_EXCEPTION_STATUSES.has(visit.finalStatus)) {
      stat.exceptions += 1;
    }
    stat.averageDurationMinutes = Math.round(((stat.averageDurationMinutes * (stat.visits - 1)) + visit.durationMinutes) / stat.visits);
    stat.averageSequence = Math.round((((stat.averageSequence || 0) * (stat.visits - 1)) + numeric(visit.sequence, stat.visits)) / stat.visits);
    const hour = new Date(visit.endAt || Date.now()).toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      hour12: false
    });
    stat.commonHours[hour] = (stat.commonHours[hour] || 0) + 1;
    stat.lastVisitAt = visit.endAt;
    stat.successRate = stat.visits ? Math.round((stat.completed / stat.visits) * 100) : 0;
    learning.clientStats = learning.clientStats
      .sort((a, b) => new Date(b.lastVisitAt || 0) - new Date(a.lastVisitAt || 0))
      .slice(0, 500);
  }

  function recordRouteLearningVisit(state, order, route, stop, context, outcome) {
    const learning = ensureState(state).routeLearning;
    const endAt = nowIso();
    const startAt = stop.visitStartedAt || stop.startedAt || stop.updatedAt || endAt;
    const durationMinutes = Math.max(0, Math.round((new Date(endAt) - new Date(startAt)) / 60000));
    const parts = localTraceParts(endAt);
    const visit = {
      id: `VIS-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      orderCode: order && order.code || "",
      client: order && order.client || stop.client || "",
      routeId: route && route.id || "",
      deviceId: context.deviceId || "",
      deviceLabel: context.deviceLabel || "",
      user: context.user || context.username || "",
      sequence: numeric(stop.sequence, 0),
      startAt,
      endAt,
      date: parts.date,
      time: parts.time,
      durationMinutes,
      gps: context.gps || null,
      finalStatus: outcome && outcome.status || stop.status,
      result: outcome && outcome.result || "",
      observations: outcome && outcome.observations || ""
    };
    learning.visits.unshift(visit);
    learning.visits = learning.visits.slice(0, 1500);
    updateRouteLearningStats(state, visit);
    return visit;
  }

  function stopFromOrder(state, order) {
    const client = findClient(state, order.client) || {};
    const coordinates = clientCoordinates(client);
    return {
      orderCode: order.code,
      client: order.client,
      address: clientAddress(client),
      hours: clientHours(client),
      priority: order.priority || "Normal",
      amount: moneyValue(order.amount),
      status: order.status,
      coordinates,
      sequence: 0,
      createdAt: order.createdAt || nowIso(),
      updatedAt: order.updatedAt || nowIso(),
      collection: order.collection || null,
      deliveredAt: DELIVERY_FINAL_STATUSES.has(order.status) ? order.updatedAt : null,
      deliveryGps: order.deliveryGps || null,
      attachments: order.deliveryAttachments || {},
      assembly: order.assembly || null,
      assemblyOrderNumber: order.assembly && (order.assembly.orderNumber || order.assembly.assemblyOrderNumber) || 0,
      packages: order.assembly && order.assembly.bultosConfirmed || 0,
      labelId: order.assembly && order.assembly.label && order.assembly.label.id || ""
    };
  }

  function stopPriority(stop) {
    if ([STATUS.IN_ROUTE, STATUS.CHECKED].includes(stop.status)) return -2;
    return stop.priority === "Urgente" ? 0 : stop.priority === "Alta" ? 1 : 2;
  }

  function openingMinutes(hours) {
    const match = String(hours || "").match(/\b(\d{1,2})[:.]?(\d{2})?\b/);
    if (!match) return 24 * 60;
    return Math.min(23, Number(match[1])) * 60 + Math.min(59, Number(match[2] || 0));
  }

  function reorderPendingStops(route, settings) {
    const completed = route.stops.filter((stop) => FINAL_STOP_STATUSES.has(stop.status))
      .sort((a, b) => a.sequence - b.sequence);
    const pending = route.stops.filter((stop) => !FINAL_STOP_STATUSES.has(stop.status));
    const ordered = [];
    let cursor = completed.length && completed[completed.length - 1].deliveryGps
      ? completed[completed.length - 1].deliveryGps
      : { lat: numeric(settings.depotLat), lng: numeric(settings.depotLng) };

    while (pending.length) {
      pending.sort((a, b) => {
        const priority = stopPriority(a) - stopPriority(b);
        if (priority) return priority;
        const hours = openingMinutes(a.hours) - openingMinutes(b.hours);
        if (hours) return hours;
        const distance = haversineKm(cursor, a.coordinates) - haversineKm(cursor, b.coordinates);
        if (Number.isFinite(distance) && Math.abs(distance) > 0.01) return distance;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      const next = pending.shift();
      ordered.push(next);
      if (next.coordinates) cursor = next.coordinates;
    }

    route.stops = [...completed, ...ordered];
    route.stops.forEach((stop, index) => { stop.sequence = index + 1; });
    route.updatedAt = nowIso();
    return route;
  }

  function routeZone(state, order) {
    const client = findClient(state, order.client);
    return String(client && (client.ruta || client.zona || client.zone) || "Sin zona");
  }

  function routeId(day, zone) {
    return `RUTA-${day.replaceAll("-", "")}-${slug(zone).toUpperCase()}`;
  }

  function uniqueRouteId(state, day, zone) {
    const base = routeId(day, zone);
    if (!(state.deliveryRoutes || []).some((route) => route.id === base)) return base;
    let index = 2;
    while ((state.deliveryRoutes || []).some((route) => route.id === `${base}-${index}`)) index += 1;
    return `${base}-${index}`;
  }

  function hasDestination(state, order) {
    if (!order) return false;
    const client = findClient(state, order.client);
    return Boolean(clientCoordinates(client) || clientAddress(client));
  }

  function appendAudit(state, action, order, route, context) {
    const at = nowIso();
    const parts = localTraceParts(at);
    const entry = {
      id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      action,
      orderCode: order ? order.code : "",
      client: order ? order.client : "",
      routeId: route ? route.id : "",
      deviceId: String(context && context.deviceId || route && route.deviceId || ""),
      deviceLabel: String(context && context.deviceLabel || route && route.deviceLabel || ""),
      user: String(context && context.user || "Sistema"),
      role: String(context && context.role || ""),
      at,
      date: parts.date,
      time: parts.time,
      gps: context && context.gps || null,
      paymentMethod: context && context.paymentMethod || "",
      amountPaid: moneyValue(context && context.amountPaid),
      pendingAmount: moneyValue(context && context.pendingAmount),
      returnAmount: moneyValue(context && context.returnAmount),
      note: String(context && context.note || "")
    };
    state.deliveryAudit.unshift(entry);
    return entry;
  }

  function ensureRouteForOrder(state, order, actor) {
    ensureState(state);
    if (!order || ![STATUS.DISPATCHED, STATUS.IN_ROUTE, STATUS.CHECKED].includes(order.status)) return null;
    const existing = state.deliveryRoutes.find((route) => route.stops.some((stop) => stop.orderCode === order.code));
    if (existing) return existing;
    const day = routeDay(order.updatedAt || order.createdAt);
    const zone = routeZone(state, order);
    const id = routeId(day, zone);
    let route = state.deliveryRoutes.find((item) => item.id === id);
    if (!route) {
      route = {
        id,
        day,
        zone,
        status: "Pendiente",
        deviceId: "",
        deviceLabel: "",
        driverUser: "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        startedAt: null,
        completedAt: null,
        cashTotal: 0,
        transferTotal: 0,
        pendingTotal: 0,
        returnTotal: 0,
        closure: null,
        stops: []
      };
      state.deliveryRoutes.unshift(route);
    }
    route.stops.push(stopFromOrder(state, order));
    reorderPendingStops(route, state.deliverySettings);
    appendAudit(state, "HOJA_RUTA_GENERADA", order, route, { user: actor || "Sistema" });
    state.activity.unshift({ type: "Reparto", title: `${order.code} agregado a ${route.id}`, text: `${order.client} - ${zone}.` });
    return route;
  }

  function migrateState(state) {
    ensureState(state);
    (state.orders || []).forEach((order) => {
      if ([STATUS.DISPATCHED, STATUS.IN_ROUTE, STATUS.CHECKED].includes(order.status)) ensureRouteForOrder(state, order, "Migracion");
    });
    state.deliveryRoutes.forEach((route) => {
      route.stops = Array.isArray(route.stops) ? route.stops : [];
      route.stops.forEach((stop) => {
        const order = findOrder(state, stop.orderCode);
        if (!order) return;
        const refreshed = stopFromOrder(state, order);
        Object.assign(stop, {
          client: refreshed.client,
          address: refreshed.address,
          hours: refreshed.hours,
          priority: refreshed.priority,
          amount: refreshed.amount,
          coordinates: refreshed.coordinates,
          assembly: refreshed.assembly,
          assemblyOrderNumber: refreshed.assemblyOrderNumber,
          packages: refreshed.packages,
          labelId: refreshed.labelId
        });
      });
      route.status = String(route.status || ROUTE_STATUS.LEGACY_PENDING);
      route.manualOrder = Boolean(route.manualOrder);
      route.driverUser = String(route.driverUser || route.driverUsername || "").trim().toLowerCase();
      route.cashTotal = moneyValue(route.cashTotal);
      route.transferTotal = moneyValue(route.transferTotal);
      route.pendingTotal = moneyValue(route.pendingTotal);
      route.returnTotal = moneyValue(route.returnTotal);
      route.closure = route.closure && typeof route.closure === "object" ? route.closure : null;
      if (!route.manualOrder) reorderPendingStops(route, state.deliverySettings);
    });
    return state;
  }

  function routeAlreadyContainsOrder(state, orderCode) {
    return (state.deliveryRoutes || []).find((route) => (
      route.status !== ROUTE_STATUS.COMPLETED
      && (route.stops || []).some((stop) => stop.orderCode === orderCode && !DELIVERY_EXCEPTION_STATUSES.has(stop.status))
    )) || null;
  }

  function createPlannedRoute(state, input, context) {
    migrateState(state);
    const orderCodes = Array.from(new Set((input.orderCodes || []).map((code) => String(code || "").trim()).filter(Boolean)));
    if (!orderCodes.length) throw new Error("Seleccionar al menos un pedido en Armado.");
    const orders = orderCodes.map((code) => {
      const order = findOrder(state, code);
      if (!order) throw new Error(`Pedido no encontrado: ${code}.`);
      if (!REPLANNABLE_STATUSES.has(order.status)) throw new Error(`${code} debe estar Listo para Despacho o pendiente de reprogramacion para planificar ruta.`);
      const existing = routeAlreadyContainsOrder(state, code);
      if (existing) throw new Error(`${code} ya esta incluido en ${existing.id}.`);
      if (!hasDestination(state, order)) throw new Error(`${code} - ${order.client} no tiene domicilio ni GPS cargado.`);
      return order;
    });
    const day = String(input.day || routeDay()).trim() || routeDay();
    const zone = String(input.zone || routeZone(state, orders[0])).trim() || "Sin zona";
    const driverUser = String(input.driverUser || input.driverUsername || "").trim().toLowerCase();
    const deviceLabel = String(input.deviceLabel || input.driverLabel || driverUser || "Sin repartidor asignado").trim();
    if (!driverUser) throw new Error("Asignar un usuario de repartidor antes de crear la ruta.");
    const route = {
      id: uniqueRouteId(state, day, zone),
      day,
      zone,
      status: ROUTE_STATUS.PLANNED,
      manualOrder: false,
      deviceId: "",
      deviceLabel,
      driverUser,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      plannedAt: nowIso(),
      publishedAt: null,
      startedAt: null,
      completedAt: null,
      cashTotal: 0,
      transferTotal: 0,
      pendingTotal: 0,
      returnTotal: 0,
      closure: null,
      stops: orders.map((order) => stopFromOrder(state, order))
    };
    reorderPendingStops(route, state.deliverySettings);
    route.stops.forEach((stop) => { stop.status = STATUS.READY_DISPATCH; });
    state.deliveryRoutes.unshift(route);
    appendAudit(state, "RUTA_PLANIFICADA", null, route, {
      ...context,
      note: `${orders.length} pedidos listos para despacho asignados a ${deviceLabel}`
    });
    state.activity.unshift({ type: "Reparto", title: `${route.id} planificada`, text: `${orders.length} pedidos listos asignados a ${deviceLabel}.` });
    return route;
  }

  function reorderRoute(state, routeIdValue, orderCodes, context) {
    migrateState(state);
    const route = findRoute(state, routeIdValue);
    if (!route) throw new Error("Hoja de ruta no encontrada.");
    if (route.closure || route.status === ROUTE_STATUS.COMPLETED) throw new Error("No se puede reordenar una ruta cerrada.");
    const nextCodes = Array.from(new Set((orderCodes || []).map((code) => String(code || "").trim()).filter(Boolean)));
    const currentCodes = route.stops.map((stop) => stop.orderCode);
    if (nextCodes.length !== currentCodes.length || currentCodes.some((code) => !nextCodes.includes(code))) {
      throw new Error("El nuevo orden debe contener exactamente los mismos pedidos.");
    }
    const byCode = new Map(route.stops.map((stop) => [stop.orderCode, stop]));
    route.stops = nextCodes.map((code, index) => {
      const stop = byCode.get(code);
      stop.sequence = index + 1;
      return stop;
    });
    route.manualOrder = true;
    route.updatedAt = nowIso();
    appendAudit(state, "RUTA_REORDENADA", null, route, context || {});
    return route;
  }

  function publishRoute(state, routeIdValue, context) {
    migrateState(state);
    const route = findRoute(state, routeIdValue);
    if (!route) throw new Error("Hoja de ruta no encontrada.");
    if (route.status !== ROUTE_STATUS.PLANNED) throw new Error("Solo se puede publicar una ruta planificada.");
    if (!route.driverUser) throw new Error("La ruta debe estar asignada a un usuario de reparto.");
    route.stops.forEach((stop) => {
      const order = findOrder(state, stop.orderCode);
      if (!order) throw new Error(`Pedido no encontrado: ${stop.orderCode}.`);
      if (!hasDestination(state, order)) throw new Error(`${order.code} - ${order.client} no tiene domicilio ni GPS cargado.`);
      orderEngine.assertDispatchChecklist(order);
      if (!REPLANNABLE_STATUSES.has(order.status)) throw new Error(`${order.code} debe seguir listo o pendiente de reprogramacion para publicar la ruta.`);
      if (order.status !== STATUS.READY_DISPATCH) {
        updateOrderTrace(order, STATUS.READY_DISPATCH, context || {}, "Pedido reprogramado para nueva hoja de ruta");
      }
    });
    route.stops.forEach((stop) => {
      const order = orderEngine.advanceOrder(state, stop.orderCode, context && context.user || "Administracion", {
        skipMigration: true,
        skipShortageRebuild: true
      });
      if (order.status !== STATUS.DISPATCHED) throw new Error(`${order.code} no pudo pasar a Despachado.`);
      const refreshed = stopFromOrder(state, order);
      Object.assign(stop, refreshed, { status: STATUS.DISPATCHED, sequence: stop.sequence });
    });
    route.status = ROUTE_STATUS.READY;
    route.publishedAt = nowIso();
    route.updatedAt = route.publishedAt;
    appendAudit(state, "RUTA_PUBLICADA_DESPACHO", null, route, context || {});
    state.shortages = orderEngine.buildShortageList(state);
    state.activity.unshift({ type: "Reparto", title: `${route.id} publicada`, text: `Ruta despachada para ${route.deviceLabel}.` });
    return route;
  }

  function findRoute(state, routeIdValue) {
    return (state.deliveryRoutes || []).find((route) => route.id === routeIdValue) || null;
  }

  function assertGps(gps) {
    if (!gps || !Number.isFinite(Number(gps.lat)) || !Number.isFinite(Number(gps.lng))) {
      throw new Error("La operacion requiere ubicacion GPS valida.");
    }
    return {
      lat: Number(gps.lat),
      lng: Number(gps.lng),
      accuracy: Math.max(0, numeric(gps.accuracy, 0)),
      source: String(gps.source || "gps")
    };
  }

  function assertDevice(route, context) {
    const deviceId = String(context.deviceId || "");
    if (!deviceId) throw new Error("El dispositivo no esta identificado.");
    if (route.driverUser && route.driverUser !== context.username && context.role !== "admin") {
      throw new Error(`La ruta esta asignada a ${route.driverUser}.`);
    }
    if (route.deviceId && route.deviceId !== deviceId && context.role !== "admin") {
      throw new Error(`La ruta esta asignada a ${route.deviceLabel || route.deviceId}.`);
    }
  }

  function claimRoute(state, routeIdValue, context) {
    migrateState(state);
    const route = findRoute(state, routeIdValue);
    if (!route) throw new Error("Hoja de ruta no encontrada.");
    if (route.status === ROUTE_STATUS.PLANNED) throw new Error("La ruta todavia no fue publicada por administracion.");
    assertDevice(route, context);
    route.deviceId = String(context.deviceId);
    route.deviceLabel = String(context.deviceLabel || context.deviceId);
    route.driverUser = String(route.driverUser || context.username || "").trim().toLowerCase();
    route.status = route.status === ROUTE_STATUS.COMPLETED ? route.status : ROUTE_STATUS.IN_PROGRESS;
    route.startedAt = route.startedAt || nowIso();
    route.updatedAt = nowIso();
    appendAudit(state, "RUTA_ASIGNADA", null, route, context);
    return route;
  }

  function nextStop(route) {
    return route.stops.find((stop) => !FINAL_STOP_STATUSES.has(stop.status)) || null;
  }

  function stopReturnSummary(stop) {
    const summary = stop && (stop.returnSummary || (stop.collection && stop.collection.returnSummary)) || {};
    return {
      returnedQty: moneyValue(summary.returnedQty),
      returnedAmount: moneyValue(summary.returnedAmount)
    };
  }

  function routeClosureSummary(route, input) {
    const stops = Array.isArray(route && route.stops) ? route.stops : [];
    const deliveredOrders = stops.filter((stop) => DELIVERY_FINAL_STATUSES.has(stop.status)).length;
    const exceptionOrders = stops.filter((stop) => DELIVERY_EXCEPTION_STATUSES.has(stop.status)).length;
    const pendingOrders = stops.length - deliveredOrders;
    const returnedOrders = stops.filter((stop) => stopReturnSummary(stop).returnedQty > 0 || stop.status === STATUS.REJECTED).length;
    const returnedAmountFromStops = stops.reduce((sum, stop) => sum + stopReturnSummary(stop).returnedAmount, 0);
    const expectedCash = moneyValue(route && route.cashTotal);
    const expectedTransfer = moneyValue(route && route.transferTotal);
    const pendingAmount = moneyValue(route && route.pendingTotal);
    const returnedAmount = moneyValue(returnedAmountFromStops || route && route.returnTotal);
    const reportedCash = moneyValue(input && (input.reportedCash ?? input.totalCash ?? input.cash));
    const reportedTransfer = moneyValue(input && (input.reportedTransfer ?? input.totalTransfer ?? input.transfers));
    const cashDifference = signedMoneyValue(reportedCash - expectedCash);
    const transferDifference = signedMoneyValue(reportedTransfer - expectedTransfer);
    return {
      totalOrders: stops.length,
      deliveredOrders,
      exceptionOrders,
      pendingOrders,
      returnedOrders,
      pendingAmount,
      returnedAmount,
      expectedCash,
      expectedTransfer,
      expectedTotal: moneyValue(expectedCash + expectedTransfer),
      reportedCash,
      reportedTransfer,
      reportedTotal: moneyValue(reportedCash + reportedTransfer),
      cashDifference,
      transferDifference,
      totalDifference: signedMoneyValue(cashDifference + transferDifference)
    };
  }

  function findRouteForOrder(state, orderCode) {
    return (state.deliveryRoutes || []).find((route) => route.stops.some((stop) => stop.orderCode === orderCode)) || null;
  }

  function localTraceParts(value) {
    const date = new Date(value || nowIso());
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

  function updateOrderTrace(order, status, context, note) {
    order.status = status;
    order.updatedAt = nowIso();
    order.trace = Array.isArray(order.trace) ? order.trace : [];
    const actor = context.deviceLabel || context.user || "Reparto";
    const parts = localTraceParts(order.updatedAt);
    order.trace.push({
      status,
      at: order.updatedAt,
      date: parts.date,
      time: parts.time,
      actor,
      user: actor,
      note,
      gps: context.gps || null
    });
  }

  function updateStopStatus(state, orderCode, targetStatus, context) {
    migrateState(state);
    if (targetStatus !== STATUS.IN_ROUTE) throw new Error("Estado de reparto invalido.");
    const order = findOrder(state, orderCode);
    const route = findRouteForOrder(state, orderCode);
    if (!order || !route) throw new Error("Pedido o ruta no encontrados.");
    assertDevice(route, context);
    const gps = assertGps(context.gps);
    const active = nextStop(route);
    if (!active || active.orderCode !== orderCode) throw new Error("Primero debe finalizarse la parada anterior.");
    if (order.status !== STATUS.DISPATCHED) throw new Error(`Para pasar a ${targetStatus}, el pedido debe estar en ${STATUS.DISPATCHED}.`);
    const stop = route.stops.find((item) => item.orderCode === orderCode);
    stop.status = targetStatus;
    stop.updatedAt = nowIso();
    stop.visitStartedAt = stop.visitStartedAt || stop.updatedAt;
    stop.lastGps = gps;
    updateOrderTrace(order, targetStatus, { ...context, gps }, "Pedido en reparto con GPS confirmado");
    appendAudit(state, "EN_REPARTO", order, route, { ...context, gps });
    state.activity.unshift({ type: "Reparto", title: `${order.code} - ${targetStatus}`, text: `${order.client} desde ${route.deviceLabel}.` });
    return { order, route, stop };
  }

  function normalizeExceptionStatus(value) {
    const text = String(value || "").trim();
    if (text === STATUS.REJECTED || normalizeText(text).includes("rechaz")) return STATUS.REJECTED;
    if (text === STATUS.POSTPONED || normalizeText(text).includes("posterg")) return STATUS.POSTPONED;
    return STATUS.NOT_DELIVERED;
  }

  function markStopException(state, orderCode, input, context) {
    migrateState(state);
    const order = findOrder(state, orderCode);
    const route = findRouteForOrder(state, orderCode);
    if (!order || !route) throw new Error("Pedido o ruta no encontrados.");
    assertDevice(route, context);
    const gps = assertGps(context.gps);
    const active = nextStop(route);
    if (!active || active.orderCode !== orderCode) throw new Error("Primero debe finalizarse la parada anterior.");
    if (![STATUS.IN_ROUTE, STATUS.CHECKED].includes(order.status)) throw new Error("El pedido debe estar EN REPARTO antes de registrar la incidencia.");

    const targetStatus = normalizeExceptionStatus(input.status || input.type);
    const reason = String(input.reason || input.motivo || "").trim();
    const observations = String(input.observations || input.observacion || input.note || "").trim();
    if (!reason) throw new Error("Indicar motivo de la incidencia.");
    if (!observations) throw new Error("Registrar una observacion para la incidencia.");
    if (targetStatus === STATUS.REJECTED && !validAttachment(input.attachments && input.attachments.signature)) {
      throw new Error("El rechazo requiere firma digital del cliente.");
    }

    const at = nowIso();
    const parts = localTraceParts(at);
    const exception = {
      status: targetStatus,
      reason,
      observations,
      at,
      date: parts.date,
      time: parts.time,
      user: context.user || "Reparto",
      username: context.username || "",
      deviceId: context.deviceId || "",
      deviceLabel: context.deviceLabel || "",
      gps,
      attachments: input.attachments || {}
    };

    order.deliveryException = exception;
    order.deliveryGps = gps;
    order.deliveryAttachments = { ...(order.deliveryAttachments || {}), ...(input.attachments || {}) };
    order.reprogrammingPending = targetStatus !== STATUS.REJECTED;
    updateOrderTrace(order, targetStatus, { ...context, gps }, `${targetStatus}: ${reason}. ${observations}`);

    const stop = route.stops.find((item) => item.orderCode === orderCode);
    stop.status = targetStatus;
    stop.updatedAt = order.updatedAt;
    stop.deliveredAt = null;
    stop.deliveryGps = gps;
    stop.exception = exception;
    stop.attachments = input.attachments || {};
    stop.observations = observations;
    if (targetStatus === STATUS.REJECTED) {
      route.returnTotal = moneyValue((route.returnTotal || 0) + moneyValue(order.amount));
    }
    if (!nextStop(route)) {
      route.status = ROUTE_STATUS.COMPLETED;
      route.completedAt = nowIso();
    }
    route.updatedAt = nowIso();
    recordRouteLearningVisit(state, order, route, stop, { ...context, gps }, {
      status: targetStatus,
      result: targetStatus === STATUS.REJECTED ? "Rechazado" : "No entregado",
      observations
    });

    appendAudit(state, targetStatus === STATUS.REJECTED ? "PEDIDO_RECHAZADO" : "PEDIDO_NO_ENTREGADO", order, route, {
      ...context,
      gps,
      returnAmount: targetStatus === STATUS.REJECTED ? moneyValue(order.amount) : 0,
      note: `${targetStatus}: ${reason}. ${observations}`
    });
    state.activity.unshift({
      type: "Reparto",
      title: `${order.code} - ${targetStatus}`,
      text: `${order.client}: ${reason}. ${targetStatus === STATUS.REJECTED ? "Informado a administracion." : "Pendiente de reprogramacion."}`
    });
    return { order, route, stop, exception, nextStop: nextStop(route) };
  }

  function applyCollectionToAccount(state, order, collection) {
    const client = findClient(state, order.client);
    if (!client) throw new Error("Cliente no encontrado para actualizar cuenta corriente.");
    const previousBalance = moneyValue(client.balance);
    let nextBalance = previousBalance;

    const pendingTransferAmount = moneyValue(collection.transferPendingAmount);
    const accountCreditAmount = moneyValue(collection.creditAmount);
    const accountDebitAmount = moneyValue(collection.pendingAmount);

    if (order.accountPosted) {
      nextBalance = Math.max(0, previousBalance - collection.amountPaid);
    } else {
      nextBalance = previousBalance + accountDebitAmount;
      order.accountPosted = accountDebitAmount > 0;
    }
    client.balance = nextBalance;
    client.saldo_inicial = nextBalance;

    if (collection.amountPaid > 0) {
      state.accounts.unshift({
        date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        type: "Cobro reparto",
        account: order.client,
        method: collection.method,
        debit: 0,
        credit: collection.amountPaid,
        balance: nextBalance,
        orderCode: order.code
      });
    }
    if (!order.accountPosted && accountDebitAmount <= 0) {
      order.accountPosted = false;
    } else if (accountDebitAmount > 0 && previousBalance !== nextBalance) {
      if (pendingTransferAmount > 0) {
        state.accounts.unshift({
          date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
          type: "Transferencia pendiente",
          account: order.client,
          method: "Transferencia Pendiente",
          debit: pendingTransferAmount,
          credit: 0,
          balance: nextBalance,
          orderCode: order.code
        });
      }
      if (accountCreditAmount > 0) {
        state.accounts.unshift({
          date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
          type: "Saldo pendiente entrega",
          account: order.client,
          method: "Cuenta corriente",
          debit: accountCreditAmount,
          credit: 0,
          balance: nextBalance,
          orderCode: order.code
        });
      }
      if (pendingTransferAmount <= 0 && accountCreditAmount <= 0) {
        state.accounts.unshift({
          date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
          type: "Saldo pendiente entrega",
          account: order.client,
          method: "Cuenta corriente",
          debit: accountDebitAmount,
          credit: 0,
          balance: nextBalance,
          orderCode: order.code
        });
      }
    }
    return { previousBalance, nextBalance };
  }

  function validAttachment(attachment) {
    return attachment && typeof attachment === "object" && attachment.url && attachment.filename;
  }

  function normalizeTransferReceipt(input, amountPaid, settings) {
    const receiptInput = input && input.transferReceipt && typeof input.transferReceipt === "object"
      ? input.transferReceipt
      : {};
    const attachment = validAttachment(receiptInput.attachment)
      ? receiptInput.attachment
      : (input.attachments && validAttachment(input.attachments.transfer) ? input.attachments.transfer : null);
    const bank = String(receiptInput.bank || "").trim();
    const alias = String(receiptInput.alias || settings.bankAlias || "").trim();
    const cbu = String(receiptInput.cbu || settings.bankCbu || "").trim();
    if (amountPaid <= 0) throw new Error("La transferencia debe registrar un importe cobrado mayor a cero.");
    if (!bank) throw new Error("Indicar banco del comprobante de transferencia.");
    if (!attachment) throw new Error("Adjuntar comprobante de transferencia para finalizar el pedido.");
    return {
      date: routeDay(),
      time: localTraceParts(nowIso()).time,
      at: nowIso(),
      amount: moneyValue(receiptInput.amount || amountPaid),
      bank,
      alias,
      cbu,
      status: accountEngine && accountEngine.TRANSFER_STATUS ? accountEngine.TRANSFER_STATUS.RECEIVED : "Comprobante Recibido",
      observations: String(receiptInput.observations || "").trim(),
      attachment
    };
  }

  function itemKey(item) {
    return normalizeText(item.productCode || item.codigo_producto || item.name || item.descripcion);
  }

  function orderDeliveryLines(order, inputLines) {
    const submitted = new Map();
    (Array.isArray(inputLines) ? inputLines : []).forEach((line) => {
      const key = itemKey(line);
      if (!key) return;
      submitted.set(key, {
        deliveredQty: moneyValue(line.deliveredQty ?? line.qty ?? line.quantity),
        returnedQty: moneyValue(line.returnedQty ?? line.devolucionQty ?? line.returnQty)
      });
    });
    return (order.items || []).map((item) => {
      const requestedQty = moneyValue(item.requestedQty ?? item.qty ?? item.quantity);
      const alreadyDelivered = moneyValue(item.deliveredQty);
      const alreadyReturned = moneyValue(item.returnedQty);
      const remainingQty = Math.max(0, requestedQty - alreadyDelivered - alreadyReturned);
      const explicit = submitted.has(itemKey(item));
      const submittedLine = explicit ? submitted.get(itemKey(item)) : { deliveredQty: remainingQty, returnedQty: 0 };
      const deliveredQty = Math.min(remainingQty, moneyValue(submittedLine.deliveredQty));
      const returnedQty = Math.min(Math.max(0, remainingQty - deliveredQty), moneyValue(submittedLine.returnedQty));
      const unitPrice = moneyValue(item.unitPrice || (requestedQty ? item.lineTotal / requestedQty : 0));
      return {
        productCode: item.productCode || "",
        name: item.name || "",
        requestedQty,
        previousDeliveredQty: alreadyDelivered,
        previousReturnedQty: alreadyReturned,
        deliveredQty,
        returnedQty,
        cumulativeDeliveredQty: alreadyDelivered + deliveredQty,
        cumulativeReturnedQty: alreadyReturned + returnedQty,
        pendingQty: Math.max(0, requestedQty - alreadyDelivered - alreadyReturned - deliveredQty - returnedQty),
        unitPrice,
        deliveredAmount: moneyValue(deliveredQty * unitPrice),
        returnedAmount: moneyValue(returnedQty * unitPrice)
      };
    });
  }

  function applyDeliveredItems(order, deliveredLines, collection) {
    const deliveredByKey = new Map(deliveredLines.map((line) => [itemKey(line), line]));
    order.items = (order.items || []).map((item) => {
      const line = deliveredByKey.get(itemKey(item));
      if (!line) return item;
      const deliveredQty = moneyValue(line.cumulativeDeliveredQty);
      const returnedQty = moneyValue(line.cumulativeReturnedQty);
      const requestedQty = moneyValue(item.requestedQty ?? line.requestedQty);
      const pendingQty = Math.max(0, requestedQty - deliveredQty - returnedQty);
      const history = Array.isArray(item.deliveryHistory) ? item.deliveryHistory : [];
      if (line.deliveredQty > 0 || line.returnedQty > 0) {
        history.push({
          at: collection.at,
          qty: line.deliveredQty,
          returnedQty: line.returnedQty,
          method: collection.method,
          amountPaid: collection.amountPaid,
          pendingAmount: collection.pendingAmount,
          returnReason: collection.returnReason || "",
          observations: collection.observations || ""
        });
      }
      return {
        ...item,
        deliveredQty,
        returnedQty,
        pendingDeliveryQty: pendingQty,
        deliveryHistory: history
      };
    });
    const requestedTotal = order.items.reduce((sum, item) => sum + moneyValue(item.requestedQty), 0);
    const deliveredTotal = order.items.reduce((sum, item) => sum + moneyValue(item.deliveredQty), 0);
    const returnedTotal = order.items.reduce((sum, item) => sum + moneyValue(item.returnedQty), 0);
    const pendingTotal = Math.max(0, requestedTotal - deliveredTotal - returnedTotal);
    const returnedAmount = moneyValue(deliveredLines.reduce((sum, line) => sum + line.returnedAmount, 0));
    order.deliverySummary = {
      requestedQty: requestedTotal,
      deliveredQty: deliveredTotal,
      returnedQty: returnedTotal,
      pendingQty: pendingTotal,
      deliveredAmount: moneyValue(deliveredLines.reduce((sum, line) => sum + line.deliveredAmount, 0)),
      returnedAmount,
      collectibleAmount: moneyValue(moneyValue(order.amount) - returnedAmount)
    };
    return order.deliverySummary;
  }

  function collectAndDeliver(state, orderCode, input, context) {
    migrateState(state);
    const order = findOrder(state, orderCode);
    const route = findRouteForOrder(state, orderCode);
    if (!order || !route) throw new Error("Pedido o ruta no encontrados.");
    assertDevice(route, context);
    const gps = assertGps(context.gps);
    const active = nextStop(route);
    if (!active || active.orderCode !== orderCode) throw new Error("Primero debe finalizarse la parada anterior.");
    if (![STATUS.IN_ROUTE, STATUS.CHECKED].includes(order.status)) throw new Error("El pedido debe estar EN REPARTO antes de cobrar.");
    let method = String(input.method || "");
    if (!PAYMENT_METHODS.has(method)) throw new Error("Forma de cobro invalida.");
    const split = input && input.paymentSplit && typeof input.paymentSplit === "object" ? input.paymentSplit : null;
    let cashAmount = moneyValue(split ? split.cashAmount ?? split.efectivo : (method === "Efectivo" ? input.amountPaid : 0));
    let transferAmount = moneyValue(split ? split.transferAmount ?? split.transferencia : (method === "Transferencia" ? input.amountPaid : 0));
    let pendingAmount = moneyValue(split ? split.creditAmount ?? split.accountAmount ?? split.cuentaCorriente : input.pendingAmount);
    if (!split && method === "Cuenta corriente") {
      cashAmount = 0;
      transferAmount = 0;
      pendingAmount = moneyValue(input.pendingAmount || input.amountPaid);
    } else if (!split && method === "Transferencia Pendiente") {
      cashAmount = 0;
      transferAmount = 0;
      pendingAmount = moneyValue(input.pendingAmount || input.amountPaid);
    }
    const requestedPendingTransfer = method === "Transferencia Pendiente";
    const activePaymentParts = [cashAmount > 0, transferAmount > 0, pendingAmount > 0].filter(Boolean).length;
    if (activePaymentParts > 1) method = "Mixto";
    else if (transferAmount > 0) method = "Transferencia";
    else if (pendingAmount > 0) method = requestedPendingTransfer ? "Transferencia Pendiente" : "Cuenta corriente";
    else method = "Efectivo";
    const pendingTransferAmount = moneyValue(transferAmount + (requestedPendingTransfer ? pendingAmount : 0));
    const creditAccountAmount = requestedPendingTransfer ? 0 : pendingAmount;
    const accountPendingAmount = moneyValue(pendingTransferAmount + creditAccountAmount);
    const amountPaid = moneyValue(cashAmount);
    const deliveredItems = orderDeliveryLines(order, input.deliveredItems);
    if (!deliveredItems.some((line) => line.deliveredQty > 0 || line.returnedQty > 0)) {
      throw new Error("Registrar al menos un producto entregado o devuelto.");
    }
    const returnSummary = {
      returnedQty: moneyValue(deliveredItems.reduce((sum, line) => sum + line.returnedQty, 0)),
      returnedAmount: moneyValue(deliveredItems.reduce((sum, line) => sum + line.returnedAmount, 0)),
      items: deliveredItems
        .filter((line) => line.returnedQty > 0)
        .map((line) => ({
          productCode: line.productCode,
          name: line.name,
          returnedQty: line.returnedQty,
          unitPrice: line.unitPrice,
          returnedAmount: line.returnedAmount
        }))
    };
    const collectibleAmount = moneyValue(moneyValue(order.amount) - returnSummary.returnedAmount);
    if (Math.abs(cashAmount + transferAmount + pendingAmount - collectibleAmount) > 0.01) {
      throw new Error("Efectivo + transferencia + cuenta corriente debe coincidir con el total cobrable luego de devoluciones.");
    }
    if (cashAmount + transferAmount > collectibleAmount) throw new Error("El importe cobrado no puede superar el total cobrable.");
    if (returnSummary.returnedQty > 0 && !String(input.returnReason || input.returnReasonText || "").trim()) {
      throw new Error("Indicar motivo de devolucion.");
    }
    const transferReceipt = transferAmount > 0
      ? normalizeTransferReceipt(input, transferAmount, state.deliverySettings)
      : null;
    const partialDelivery = deliveredItems.some((line) => line.pendingQty > 0);
    const collection = {
      method,
      amountPaid,
      pendingAmount: accountPendingAmount,
      cashAmount,
      transferAmount,
      transferPendingAmount: pendingTransferAmount,
      creditAmount: creditAccountAmount,
      collectibleAmount,
      at: nowIso(),
      user: context.user || "",
      deviceId: context.deviceId,
      deviceLabel: context.deviceLabel,
      bankAlias: transferAmount > 0 ? state.deliverySettings.bankAlias : "",
      gps,
      attachments: input.attachments || {},
      transferReceipt,
      returnReason: String(input.returnReason || input.returnReasonText || "").trim(),
      observations: String(input.observations || input.note || "").trim(),
      returnSummary,
      deliveredItems
    };
    const account = applyCollectionToAccount(state, order, collection);
    collection.previousBalance = account.previousBalance;
    collection.newBalance = account.nextBalance;
    const deliverySummary = applyDeliveredItems(order, deliveredItems, collection);
    collection.deliverySummary = deliverySummary;
    order.collections = Array.isArray(order.collections) ? order.collections : [];
    order.collections.push(collection);
    order.collection = collection;
    order.collectionStatus = accountPendingAmount > 0 ? (amountPaid > 0 ? "Parcial" : "Pendiente") : "Cobrado";
    order.paymentMethod = method;
    order.deliveryGps = gps;
    order.deliveryAttachments = collection.attachments;
    order.returnSummary = collection.returnSummary;
    order.deliveryObservations = collection.observations;
    if (transferReceipt) {
      transferReceipt.routeId = route.id;
      order.transferReceipts = Array.isArray(order.transferReceipts) ? order.transferReceipts : [];
      order.transferReceipts.push(transferReceipt);
      if (accountEngine && typeof accountEngine.registerTransferReceipt === "function") {
        accountEngine.registerTransferReceipt(state, order, transferReceipt, context);
      }
    } else if (requestedPendingTransfer && pendingTransferAmount > 0 && accountEngine && typeof accountEngine.registerPendingTransfer === "function") {
      const pendingTransfer = accountEngine.registerPendingTransfer(state, order, {
        routeId: route.id,
        amount: pendingTransferAmount,
        status: accountEngine.TRANSFER_STATUS ? accountEngine.TRANSFER_STATUS.PENDING : "Pendiente de Transferencia",
        observations: collection.observations,
        driver: context.user || context.username || ""
      }, context);
      if (pendingTransfer) {
        order.transferReceipts = Array.isArray(order.transferReceipts) ? order.transferReceipts : [];
        order.transferReceipts.push({ ...pendingTransfer });
      }
    }
    const targetStatus = partialDelivery
      ? STATUS.PARTIAL_DELIVERED
      : (accountPendingAmount > 0 ? STATUS.DELIVERED : STATUS.COLLECTED);
    if (partialDelivery) {
      updateOrderTrace(order, targetStatus, { ...context, gps }, `${method}: entrega parcial. Cobrado ${amountPaid}, pendiente ${accountPendingAmount}. Entregados ${deliverySummary.deliveredQty}/${deliverySummary.requestedQty}. Devueltos ${returnSummary.returnedQty}.`);
    } else {
      updateOrderTrace(order, STATUS.DELIVERED, { ...context, gps }, `Entrega confirmada. Entregados ${deliverySummary.deliveredQty}/${deliverySummary.requestedQty}. Devueltos ${returnSummary.returnedQty}.`);
      if (targetStatus === STATUS.COLLECTED) {
        updateOrderTrace(order, STATUS.COLLECTED, { ...context, gps }, `${method}: cobrado ${amountPaid}, pendiente ${accountPendingAmount}.`);
      }
    }
    if (orderEngine && typeof orderEngine.refreshOrderCommissions === "function") {
      orderEngine.refreshOrderCommissions(state, order, {
        includeDriver: true,
        driverUser: context.user || context.username || context.deviceLabel || ""
      });
      if (typeof orderEngine.refreshSellerMetrics === "function") orderEngine.refreshSellerMetrics(state);
    }

    const stop = route.stops.find((item) => item.orderCode === orderCode);
    stop.status = targetStatus;
    stop.updatedAt = order.updatedAt;
    stop.deliveredAt = order.updatedAt;
    stop.deliveryGps = gps;
    stop.collection = collection;
    stop.attachments = collection.attachments;
    stop.transferReceipt = transferReceipt;
    stop.returnSummary = returnSummary;
    stop.observations = collection.observations;
    route.cashTotal = moneyValue(route.cashTotal + cashAmount);
    route.transferTotal = moneyValue(route.transferTotal + pendingTransferAmount);
    route.pendingTotal = moneyValue(route.pendingTotal + accountPendingAmount);
    route.returnTotal = moneyValue((route.returnTotal || 0) + returnSummary.returnedAmount);
    if (!nextStop(route)) {
      route.status = ROUTE_STATUS.COMPLETED;
      route.completedAt = nowIso();
    }
    route.updatedAt = nowIso();
    recordRouteLearningVisit(state, order, route, stop, { ...context, gps }, {
      status: targetStatus,
      result: partialDelivery ? "Parcial" : "Entregado",
      observations: collection.observations || ""
    });
    appendAudit(state, partialDelivery ? "PARCIAL_ENTREGADO_Y_COBRADO" : "ENTREGADO_Y_COBRADO", order, route, {
      ...context,
      gps,
      paymentMethod: method,
      amountPaid,
      pendingAmount,
      cashAmount,
      transferAmount,
      returnAmount: returnSummary.returnedAmount,
      note: [
        `Efectivo ${cashAmount}. Transferencia pendiente ${pendingTransferAmount}. Cuenta corriente ${creditAccountAmount}.`,
        transferReceipt ? `Comprobante recibido ${transferReceipt.bank} ${transferReceipt.alias}` : "",
        returnSummary.returnedQty > 0 ? `Devolucion ${returnSummary.returnedQty} unidades por ${collection.returnReason}` : "",
        collection.observations ? `Obs: ${collection.observations}` : ""
      ].filter(Boolean).join(" | ")
    });
    state.activity.unshift({
      type: "Entrega",
      title: `${order.code} ${partialDelivery ? "parcial" : "entregado"}`,
      text: `${order.client}: ${method}, efectivo ${cashAmount}, transferencia pendiente ${pendingTransferAmount}, pendiente total ${accountPendingAmount}, devolucion ${returnSummary.returnedAmount}.`
    });
    return { order, route, stop, nextStop: nextStop(route) };
  }

  function closeRoute(state, routeIdValue, input, context) {
    migrateState(state);
    const route = findRoute(state, routeIdValue);
    if (!route) throw new Error("Hoja de ruta no encontrada.");
    if (route.status === ROUTE_STATUS.PLANNED) throw new Error("La ruta planificada debe publicarse antes de rendir cierre.");
    if (route.closure) throw new Error("La ruta ya tiene cierre diario registrado.");
    assertDevice(route, context);
    const gps = assertGps(context.gps);
    const summary = routeClosureSummary(route, input || {});
    const differenceReason = String(input && (input.differenceReason || input.cashDifferenceReason || "") || "").trim();
    const observations = String(input && (input.observations || input.note) || "").trim();
    const hasDifference = Math.abs(summary.cashDifference) > 0.01 || Math.abs(summary.transferDifference) > 0.01;
    if (hasDifference && !differenceReason) throw new Error("Indicar motivo de diferencia de caja.");
    if (hasDifference && !observations) throw new Error("Indicar observaciones para cerrar con diferencia.");
    const at = nowIso();
    const parts = localTraceParts(at);
    const closure = {
      id: `CIERRE-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      routeId: route.id,
      day: route.day || routeDay(at),
      zone: route.zone || "",
      driverUser: route.driverUser || context.username || "",
      deviceId: route.deviceId || context.deviceId || "",
      deviceLabel: route.deviceLabel || context.deviceLabel || "",
      at,
      date: parts.date,
      time: parts.time,
      user: context.user || "Reparto",
      role: context.role || "",
      gps,
      observations,
      differenceReason,
      cashBreakdown: Array.isArray(input && input.cashBreakdown)
        ? input.cashBreakdown.map((item) => ({
          denomination: moneyValue(item.denomination),
          qty: moneyValue(item.qty),
          subtotal: moneyValue(item.subtotal || moneyValue(item.denomination) * moneyValue(item.qty))
        })).filter((item) => item.denomination > 0)
        : [],
      ...summary
    };
    route.closure = closure;
    route.closedAt = at;
    route.completedAt = route.completedAt || at;
    route.status = ROUTE_STATUS.COMPLETED;
    route.updatedAt = at;
    state.deliveryClosures.unshift(closure);
    state.deliveryClosures = state.deliveryClosures.slice(0, 300);
    appendAudit(state, "CIERRE_DIARIO_REPARTO", null, route, {
      ...context,
      gps,
      amountPaid: closure.reportedCash,
      pendingAmount: closure.pendingAmount,
      returnAmount: closure.returnedAmount,
      note: `Efectivo ${closure.reportedCash}/${closure.expectedCash}. Transferencias ${closure.reportedTransfer}/${closure.expectedTransfer}. Diferencia ${closure.totalDifference}. Pendientes ${closure.pendingOrders}.`
    });
    state.activity.unshift({
      type: "Reparto",
      title: `${route.id} cierre diario`,
      text: `Entregados ${closure.deliveredOrders}, pendientes ${closure.pendingOrders}, devueltos ${closure.returnedOrders}, diferencia ${closure.totalDifference}.`
    });
    return { route, closure, summary };
  }

  function updateSettings(state, input, context) {
    ensureState(state);
    const bankAlias = String(input.bankAlias || "").trim();
    if (!bankAlias) throw new Error("El alias bancario es obligatorio.");
    state.deliverySettings.bankAlias = bankAlias;
    state.deliverySettings.bankAccountName = String(input.bankAccountName || state.deliverySettings.bankAccountName).trim();
    state.deliverySettings.bankCbu = String(input.bankCbu || "").trim();
    state.deliverySettings.depotLat = numeric(input.depotLat, state.deliverySettings.depotLat);
    state.deliverySettings.depotLng = numeric(input.depotLng, state.deliverySettings.depotLng);
    appendAudit(state, "CONFIGURACION_COBRANZA", null, null, context);
    return state.deliverySettings;
  }

  function navigationUrl(state, orderCode) {
    const order = findOrder(state, orderCode);
    const client = order && findClient(state, order.client);
    if (!order || !client) return "";
    const coordinates = clientCoordinates(client);
    const destination = coordinates ? `${coordinates.lat},${coordinates.lng}` : clientAddress(client);
    if (!destination) return "";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }

  return {
    ensureState,
    ROUTE_STATUS,
    migrateState,
    ensureRouteForOrder,
    createPlannedRoute,
    reorderRoute,
    publishRoute,
    claimRoute,
    updateStopStatus,
    markStopException,
    collectAndDeliver,
    closeRoute,
    routeClosureSummary,
    updateSettings,
    navigationUrl,
    nextStop,
    findRouteForOrder,
    clientCoordinates,
    clientAddress,
    haversineKm
  };
});
