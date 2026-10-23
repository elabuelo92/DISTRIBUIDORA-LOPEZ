"use strict";
const zlib = require("node:zlib");
const { promisify } = require("node:util");
const compress = promisify(zlib.gzip);

function createCache({ maxBytes = 16 * 1024 * 1024, maxEntries = 3, ttlMs = 60000, now = Date.now, gzip = compress } = {}) {
  const entries = new Map();
  let version, bytes = 0, hits = 0, misses = 0;
  const remove = key => { bytes -= entries.get(key).bytes; entries.delete(key); };
  async function get(currentVersion, projectionKey, createPayload) {
    if (version !== currentVersion) { entries.clear(); bytes = 0; version = currentVersion; }
    for (const [key, entry] of entries) if (now() - entry.at > ttlMs) remove(key);
    const found = entries.get(projectionKey);
    if (found) { hits++; return found.body || found.pending; }
    misses++;
    while (entries.size >= maxEntries) remove(entries.keys().next().value);
    const entry = { bytes: 0, at: now(), body: null, pending: null };
    entries.set(projectionKey, entry);
    entry.pending = (async () => {
      try {
        const raw = Buffer.from(JSON.stringify(createPayload()), "utf8");
        const body = await gzip(raw, { level: zlib.constants.Z_BEST_SPEED, chunkSize: 262144 });
        if (entries.get(projectionKey) === entry && version === currentVersion) {
          if (body.length <= maxBytes) {
            entry.body = body;
            entry.bytes = body.length;
            bytes += body.length;
            while (bytes > maxBytes) remove(entries.keys().next().value);
          } else remove(projectionKey);
        }
        return body;
      } catch (error) {
        if (entries.get(projectionKey) === entry) remove(projectionKey);
        throw error;
      } finally { entry.pending = null; }
    })();
    return entry.pending;
  }
  return { get, metrics: () => ({ entries: entries.size, bytes, maxBytes, hits, misses }) };
}
module.exports = { createCache };
