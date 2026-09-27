(function initRouteOptimizer(root, factory) {
  const optimizer = factory();
  if (typeof module === "object" && module.exports) module.exports = optimizer;
  if (root) root.DLRouteOptimizer = optimizer;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildRouteOptimizer() {
  "use strict";

  function distanceKm(a, b) {
    if (!a || !b) return 0;
    const rad = (value) => value * Math.PI / 180;
    const lat = rad(b.lat - a.lat);
    const lng = rad(b.lng - a.lng);
    const arc = Math.sin(lat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
  }

  function pathDistance(nodes, origin) {
    let cursor = origin;
    let total = 0;
    nodes.forEach((node) => {
      if (!node.coordinates) return;
      total += distanceKm(cursor, node.coordinates);
      cursor = node.coordinates;
    });
    return Math.round(total * 100) / 100;
  }

  function propose(nodes, origin) {
    const ordered = Array.isArray(nodes) ? nodes.slice() : [];
    const withGps = ordered.filter((node) => node.coordinates);
    const withoutGps = ordered.filter((node) => !node.coordinates);
    const remaining = withGps.slice();
    const suggestion = [];
    let cursor = origin || withGps[0]?.coordinates || null;
    while (remaining.length) {
      let best = 0;
      for (let index = 1; index < remaining.length; index += 1) {
        if (distanceKm(cursor, remaining[index].coordinates) < distanceKm(cursor, remaining[best].coordinates)) best = index;
      }
      const next = remaining.splice(best, 1)[0];
      suggestion.push(next);
      cursor = next.coordinates;
    }
    const beforeKm = pathDistance(ordered, origin || withGps[0]?.coordinates || null);
    const suggestedKm = pathDistance(suggestion, origin || withGps[0]?.coordinates || null);
    const selected = suggestedKm < beforeKm ? [...suggestion, ...withoutGps] : ordered;
    return {
      orderCodes: selected.map((node) => node.orderCode),
      missingGps: withoutGps.map((node) => node.orderCode),
      beforeKm,
      suggestedKm: Math.min(beforeKm, suggestedKm),
      method: "nearest-neighbor"
    };
  }

  return { propose, distanceKm, pathDistance };
});
