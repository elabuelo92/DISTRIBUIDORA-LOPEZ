(function initClientPortfolioEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ClientPortfolioEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function clientPortfolioFactory() {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function assignedSeller(client) {
    return String(client && (
      client.vendedor_asignado
      || client.seller
      || client.vendedor
      || client.assignedSeller
      || ""
    ) || "").trim();
  }

  const WEEKDAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const DAY_ALIASES = {
    lunes: ["lunes", "lu"],
    martes: ["martes", "ma"],
    miercoles: ["miercoles", "mi"],
    jueves: ["jueves", "ju"],
    viernes: ["viernes", "vi"],
    sabado: ["sabado", "sa"],
    domingo: ["domingo", "do"]
  };

  function visitDays(client) {
    const source = client && (client.dias_visita || client.visitDays || client.dia_visita || client.day || "");
    const values = Array.isArray(source) ? source : [source];
    const found = new Set();
    values.forEach((value) => {
      const text = normalize(value);
      const tokens = text.split(/[^a-z]+/).filter(Boolean);
      WEEKDAYS.forEach((day) => {
        const key = normalize(day);
        const aliases = DAY_ALIASES[key] || [];
        if (aliases.some((alias) => alias.length > 2 && text.includes(alias))) found.add(day);
        tokens.forEach((token) => {
          if (aliases.includes(token)) found.add(day);
          if (token.length >= 4 && token.length % 2 === 0) {
            const pairs = token.match(/.{2}/g) || [];
            if (pairs.some((pair) => aliases.includes(pair))) found.add(day);
          }
        });
      });
    });
    return WEEKDAYS.filter((day) => found.has(day));
  }

  function isActiveClient(client) {
    if (!client) return false;
    if (client.activo === false) return false;
    if (["no", "false", "0", "inactivo"].includes(normalize(client.activo))) return false;
    return !["inactivo", "baja", "eliminado"].includes(normalize(client.estado || client.status || "Activo"));
  }

  function sellerIdentities(user) {
    return Array.from(new Set([
      user && user.username,
      user && user.name,
      user && user.sellerName,
      user && user.vendedor
    ].map((value) => String(value || "").trim()).filter(Boolean)));
  }

  function belongsToSeller(client, identities) {
    const assigned = normalize(assignedSeller(client));
    if (!assigned) return false;
    return (identities || []).map(normalize).filter(Boolean).includes(assigned);
  }

  function matchesWorkday(client, workday) {
    return visitDays(client).some((day) => normalize(day) === normalize(workday));
  }

  function visitOrderKey(route, day) {
    return `${normalize(route)}|${normalize(day)}`;
  }

  function visitOrder(client, workday, route) {
    const orders = client && client.ordenes_visita && typeof client.ordenes_visita === "object"
      ? client.ordenes_visita
      : {};
    const ownRoute = client && (client.ruta || client.route || client.zona || client.zone) || "";
    const wantedKeys = [visitOrderKey(route || ownRoute, workday), visitOrderKey(ownRoute, workday)];
    const matchingEntry = Object.entries(orders).find(([key]) => wantedKeys.includes(normalize(key)));
    const value = matchingEntry ? Number(matchingEntry[1]) : Number(client && client.orden_visita);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : Number.POSITIVE_INFINITY;
  }

  function searchText(client) {
    return normalize([
      client && (client.name || client.nombre_comercial),
      client && client.razon_social,
      client && client.codigo_cliente,
      client && (client.domicilio || client.address),
      client && (client.telefono || client.phone),
      client && (client.zona || client.zone),
      client && client.localidad,
      client && (client.ruta || client.route),
      assignedSeller(client)
    ].filter(Boolean).join(" "));
  }

  function filterClients(clients, options) {
    const settings = options || {};
    const scope = ["today", "portfolio", "outside"].includes(settings.scope) ? settings.scope : "today";
    const identities = Array.isArray(settings.sellerIdentities) ? settings.sellerIdentities : [];
    const workday = settings.workday || "";
    const terms = normalize(settings.search || "").split(/\s+/).filter(Boolean);
    const belongs = (client) => belongsToSeller(client, identities);
    const belongsToday = (client) => belongs(client) && matchesWorkday(client, workday);
    const distanceFor = typeof settings.distanceFor === "function" ? settings.distanceFor : () => Number.POSITIVE_INFINITY;
    const sellerRoute = normalize(settings.sellerRoute || "");

    return (Array.isArray(clients) ? clients : []).filter((client) => {
      if (!isActiveClient(client)) return false;
      const inScope = scope === "portfolio" ? belongs(client) : scope === "outside" ? !belongsToday(client) : belongsToday(client);
      return inScope && (!terms.length || terms.every((term) => searchText(client).includes(term)));
    }).sort((a, b) => {
      const score = (client) => {
        if (belongsToday(client)) return 0;
        if (belongs(client)) return 1;
        if (!assignedSeller(client)) return 2;
        const clientRoute = normalize(client && (client.ruta || client.route || client.zona || client.zone));
        if (sellerRoute && clientRoute && (clientRoute.includes(sellerRoute) || sellerRoute.includes(clientRoute))) return 3;
        return 4;
      };
      const scoreDifference = score(a) - score(b);
      if (scoreDifference) return scoreDifference;
      const leftOrder = visitOrder(a, workday, sellerRoute);
      const rightOrder = visitOrder(b, workday, sellerRoute);
      if (Number.isFinite(leftOrder) && !Number.isFinite(rightOrder)) return -1;
      if (!Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) return 1;
      if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) return leftOrder - rightOrder;
      const distanceDifference = Number(distanceFor(a)) - Number(distanceFor(b));
      if (Number.isFinite(distanceDifference) && distanceDifference) return distanceDifference;
      return String(a.name || a.nombre_comercial || "").localeCompare(String(b.name || b.nombre_comercial || ""), "es", { sensitivity: "base" });
    });
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function hasGps(client) {
    const latitude = Number(client && (client.latitud ?? client.latitude ?? client.lat));
    const longitude = Number(client && (client.longitud ?? client.longitude ?? client.lng));
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  }

  function clientId(client) {
    return String(client && (client.codigo_cliente || client.id || client.code || client.name || client.nombre_comercial) || "").trim();
  }

  function duplicateKeys(client) {
    const cuit = normalizePhone(client && client.cuit);
    const phone = normalizePhone(client && (client.telefono || client.phone));
    const name = normalize(client && (client.name || client.nombre_comercial || client.razon_social));
    const address = normalize(client && (client.domicilio || client.address));
    return [
      cuit.length >= 8 ? `cuit:${cuit}` : "",
      phone.length >= 7 ? `phone:${phone}` : "",
      name && address ? `name-address:${name}|${address}` : ""
    ].filter(Boolean);
  }

  function diagnose(clients, users) {
    const source = Array.isArray(clients) ? clients : [];
    const sellerUsers = (Array.isArray(users) ? users : []).filter((user) => user && user.role === "seller");
    const activeSellerAliases = new Set();
    const allSellerAliases = new Set();
    sellerUsers.forEach((user) => sellerIdentities(user).forEach((identity) => {
      const key = normalize(identity);
      if (!key) return;
      allSellerAliases.add(key);
      if (user.active !== false) activeSellerAliases.add(key);
    }));

    const duplicateMap = new Map();
    source.forEach((client) => duplicateKeys(client).forEach((key) => {
      const records = duplicateMap.get(key) || [];
      records.push(clientId(client));
      duplicateMap.set(key, records);
    }));
    const duplicateIds = new Set();
    duplicateMap.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id));
    });

    const records = source.map((client) => {
      const id = clientId(client);
      const issues = [];
      const seller = assignedSeller(client);
      const sellerKey = normalize(seller);
      const days = visitDays(client);
      const active = isActiveClient(client);
      const route = String(client.ruta || client.route || "").trim();
      const zone = String(client.zona || client.zone || "").trim();
      const address = String(client.domicilio || client.address || "").trim();
      const add = (code, severity, message) => issues.push({ code, severity, message });

      if (!seller) add("NO_SELLER", "error", "Sin vendedor titular");
      else if (!allSellerAliases.has(sellerKey)) add("ORPHAN_SELLER", "error", "Vendedor asignado sin usuario relacionado");
      else if (!activeSellerAliases.has(sellerKey)) add("INACTIVE_SELLER", "error", "Vendedor asignado inactivo");
      if (!days.length) add("NO_VISIT_DAY", "warning", "Sin dia de visita");
      if (!route) add("NO_ROUTE", "warning", "Sin ruta comercial");
      if (!zone) add("NO_ZONE", "warning", "Sin zona");
      if (!address) add("NO_ADDRESS", "warning", "Sin direccion");
      if (!hasGps(client)) add("NO_GPS", "warning", "Sin coordenadas GPS validas");
      if (!active && (seller || route || days.length)) add("INACTIVE_ASSIGNED", "warning", "Cliente inactivo conserva asignacion comercial");
      if (duplicateIds.has(id)) add("POSSIBLE_DUPLICATE", "warning", "Posible cliente duplicado");

      const severity = issues.some((issue) => issue.severity === "error")
        ? "error"
        : issues.length ? "warning" : "ok";
      return {
        id,
        name: String(client.name || client.nombre_comercial || client.razon_social || "Cliente"),
        seller,
        route,
        zone,
        days,
        active,
        gps: hasGps(client),
        severity,
        issues
      };
    });

    return {
      records,
      summary: {
        total: records.length,
        ok: records.filter((record) => record.severity === "ok").length,
        warnings: records.filter((record) => record.severity === "warning").length,
        errors: records.filter((record) => record.severity === "error").length,
        withoutSeller: records.filter((record) => record.issues.some((issue) => issue.code === "NO_SELLER")).length,
        withoutRoute: records.filter((record) => record.issues.some((issue) => issue.code === "NO_ROUTE")).length,
        withoutDay: records.filter((record) => record.issues.some((issue) => issue.code === "NO_VISIT_DAY")).length,
        withoutGps: records.filter((record) => record.issues.some((issue) => issue.code === "NO_GPS")).length,
        inactive: records.filter((record) => !record.active).length,
        possibleDuplicates: records.filter((record) => record.issues.some((issue) => issue.code === "POSSIBLE_DUPLICATE")).length
      }
    };
  }

  return {
    WEEKDAYS,
    normalize,
    assignedSeller,
    sellerIdentities,
    visitDays,
    isActiveClient,
    belongsToSeller,
    matchesWorkday,
    visitOrderKey,
    visitOrder,
    searchText,
    filterClients,
    hasGps,
    diagnose
  };
});
