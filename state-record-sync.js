(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StateRecordSync = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const fields = { orders: "code", archivedOrders: "code", deliveryRoutes: "id", archivedDeliveryRoutes: "id",
    stockMovements: "id", products: "codigo_producto", clients: "codigo_cliente" };
  const forbidden = new Set(["__proto__", "prototype", "constructor"]);
  function recordKey(value, index, field) {
    const id = value && value[field];
    return id === undefined || id === null || id === "" ? `index:${index}` : `id:${JSON.stringify(id)}`;
  }
  function records(value, field) {
    if (!Array.isArray(value) || !field) return null;
    const result = new Map();
    for (let i = 0; i < value.length; i++) {
      const key = recordKey(value[i], i, field);
      if (result.has(key)) return null;
      result.set(key, value[i]);
    }
    return result;
  }
  // Retain fingerprints only, never another copy of orders, proofs or histories.
  function build(state, previous, hash, known) {
    const snapshot = known || { sections: {}, bytes: 256 };
    const replacements = {}, patches = {};
    for (const [key, value] of Object.entries(state)) {
      if (value === undefined || forbidden.has(key)) continue;
      const rows = records(value, fields[key]);
      const before = previous?.sections[key];
      if (rows) {
        const fingerprints = known ? known.sections[key].records : new Map();
        const upserts = [];
        let changed = !before?.records || before.records.size !== rows.size;
        const oldOrder = before?.records ? [...before.records.keys()] : [];
        let index = 0;
        for (const [id, row] of rows) {
          const digest = known ? fingerprints.get(id) : hash(JSON.stringify(row) ?? "null");
          if (!known) {
            fingerprints.set(id, digest);
            snapshot.bytes += 256 + id.length * 2;
          }
          if (!before?.records || before.records.get(id) !== digest) upserts.push(row);
          if (oldOrder[index++] !== id) changed = true;
        }
        if (!known) snapshot.sections[key] = { records: fingerprints };
        if (!before?.records) replacements[key] = value;
        else if (changed || upserts.length) patches[key] = { field: fields[key], order: [...rows.keys()], upserts };
      } else {
        const digest = known ? known.sections[key].hash : hash(JSON.stringify(value));
        if (!known) {
          snapshot.sections[key] = { hash: digest };
          snapshot.bytes += 256 + key.length * 2;
        }
        if (!before || before.hash !== digest) replacements[key] = value;
      }
    }
    return { snapshot, state: replacements, records: patches,
      removed: previous ? Object.keys(previous.sections).filter(key => !Object.hasOwn(snapshot.sections, key)) : [] };
  }
  function apply(current, response) {
    if (!response.partial) return response.state;
    const next = { ...current, ...response.state };
    for (const [key, patch] of Object.entries(response.records || {})) {
      if (forbidden.has(key) || fields[key] !== patch.field || Object.hasOwn(response.state || {}, key)) throw new Error("Invalid sync section");
      const rows = records(current[key], patch.field);
      if (!rows || !Array.isArray(patch.order) || !Array.isArray(patch.upserts)) throw new Error("Missing sync baseline");
      const seen = new Set();
      // Anonymous records use the NEW array position, supplied with each upsert.
      for (const entry of patch.upserts) {
        const id = entry.key;
        if (typeof id !== "string" || seen.has(id)) throw new Error("Invalid sync upsert");
        seen.add(id);
        rows.set(id, entry.value);
      }
      if (new Set(patch.order).size !== patch.order.length || patch.order.some(id => !rows.has(id))) throw new Error("Incomplete sync baseline");
      next[key] = patch.order.map(id => rows.get(id));
    }
    for (const key of response.removed || []) {
      if (forbidden.has(key)) throw new Error("Invalid removed section");
      delete next[key];
    }
    return next;
  }
  function createStore({ hash, token, maxBytes = 48 * 1024 * 1024, maxEntries = 32, ttlMs = 300000, now = Date.now }) {
    const entries = new Map();
    const references = new Map();
    let bytes = 0;
    let reusedSnapshots = 0;
    function remove(id) {
      const snapshot = entries.get(id).snapshot;
      const count = references.get(snapshot) - 1;
      if (count) references.set(snapshot, count);
      else { references.delete(snapshot); bytes -= snapshot.bytes; }
      entries.delete(id);
    }
    function response(state, version, scope, cursor, baseVersion, projectionKey = "") {
      for (const [id, entry] of entries) if (now() - entry.at > ttlMs) remove(id);
      const candidate = entries.get(cursor);
      const previous = candidate?.scope === scope && candidate.version === baseVersion ? candidate : null;
      // Only the server may identify equivalent role projections. Cursors remain
      // user-scoped even when their immutable fingerprints share storage.
      const shared = projectionKey && [...entries.values()].find(entry => entry.version === version && entry.projectionKey === projectionKey);
      const built = build(state, previous?.snapshot, hash, shared?.snapshot);
      if (shared) reusedSnapshots++;
      // Key every upsert explicitly so legacy rows without IDs survive insertion/reorder.
      for (const [key, patch] of Object.entries(built.records)) {
        const changed = new Set(patch.upserts);
        patch.upserts = [...records(state[key], fields[key])].filter(([, row]) => changed.has(row)).map(([id, value]) => ({ key: id, value }));
      }
      const nextCursor = token();
      if (built.snapshot.bytes <= maxBytes) {
        for (const [id, entry] of entries) if (entry.scope === scope) remove(id);
        while (entries.size && (entries.size >= maxEntries || bytes + (references.has(built.snapshot) ? 0 : built.snapshot.bytes) > maxBytes)) remove(entries.keys().next().value);
        entries.set(nextCursor, { scope, version, projectionKey, snapshot: built.snapshot, at: now() });
        if (!references.has(built.snapshot)) bytes += built.snapshot.bytes;
        references.set(built.snapshot, (references.get(built.snapshot) || 0) + 1);
      }
      return { version, syncFormat: "records-v1", cursor: entries.has(nextCursor) ? nextCursor : null,
        partial: Boolean(previous), baseVersion, state: built.state, records: built.records, removed: built.removed };
    }
    return { response, metrics: () => ({ entries: entries.size, estimatedBytes: bytes, maxBytes, reusedSnapshots }) };
  }
  return { apply, createStore };
});
