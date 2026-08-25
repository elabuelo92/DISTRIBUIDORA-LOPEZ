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

  function belongsToSeller(client, identities) {
    const assigned = normalize(assignedSeller(client));
    if (!assigned) return false;
    return (identities || []).map(normalize).filter(Boolean).includes(assigned);
  }

  function matchesWorkday(client, workday) {
    const text = normalize(client && (client.dia_visita || client.day || "")).replace(/[^a-z]/g, "");
    const aliases = {
      lunes: ["lunes", "lu"],
      martes: ["martes", "ma"],
      miercoles: ["miercoles", "mi"],
      jueves: ["jueves", "ju"],
      viernes: ["viernes", "vi"],
      sabado: ["sabado", "sa"]
    };
    return (aliases[normalize(workday)] || []).some((alias) => text.includes(alias));
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
      const distanceDifference = Number(distanceFor(a)) - Number(distanceFor(b));
      if (Number.isFinite(distanceDifference) && distanceDifference) return distanceDifference;
      return String(a.name || a.nombre_comercial || "").localeCompare(String(b.name || b.nombre_comercial || ""), "es", { sensitivity: "base" });
    });
  }

  return { normalize, assignedSeller, belongsToSeller, matchesWorkday, searchText, filterClients };
});
