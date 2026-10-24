"use strict";
const zlib = require("node:zlib");
const { promisify } = require("node:util");
const compress = promisify(zlib.gzip);
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

// Capture the exact JSON used for fingerprints, before any asynchronous write.
// Raw chunks live only until compression finishes, never in the cache.
function createEncoder() {
  const sections = new Map();
  function capture(key, index, raw) {
    if (index < 0) sections.set(key, Buffer.from(raw));
    else {
      if (!sections.has(key)) sections.set(key, []);
      sections.get(key).push(Buffer.from(raw));
    }
  }
  function encode(message) {
    const { state, ...metadata } = message;
    const chunks = [Buffer.from(JSON.stringify(metadata).slice(0, -1) + ',"state":{')];
    let separator = "";
    for (const [key, value] of Object.entries(state)) {
      if (value === undefined) continue;
      chunks.push(Buffer.from(separator + JSON.stringify(key) + ":"));
      separator = ",";
      const captured = sections.get(key);
      if (Array.isArray(captured)) {
        chunks.push(Buffer.from("["));
        captured.forEach((row, i) => { if (i) chunks.push(Buffer.from(",")); chunks.push(row); });
        chunks.push(Buffer.from("]"));
      } else chunks.push(captured || Buffer.from(JSON.stringify(value)));
    }
    chunks.push(Buffer.from("}}"));
    sections.clear();
    return chunks;
  }
  return { capture, encode };
}

async function compressChunks(raw, options) {
  if (!Array.isArray(raw)) return compress(raw, options);
  function* batches() {
    let parts = [], size = 0;
    for (let i = 0; i < raw.length; i++) {
      const chunk = raw[i];
      raw[i] = null;
      parts.push(chunk); size += chunk.length;
      if (size >= 262144) { yield Buffer.concat(parts, size); parts = []; size = 0; }
    }
    if (size) yield Buffer.concat(parts, size);
  }
  const output = [];
  await pipeline(Readable.from(batches()), zlib.createGzip(options), async source => {
    for await (const chunk of source) output.push(chunk);
  });
  return Buffer.concat(output);
}

function createCache({ maxBytes = 16 * 1024 * 1024, maxEntries = 3, ttlMs = 60000, now = Date.now, gzip = compressChunks } = {}) {
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
        const payload = createPayload();
        const raw = Array.isArray(payload) ? payload : Buffer.from(JSON.stringify(payload), "utf8");
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
  return { get, has: (currentVersion, key) => version === currentVersion && entries.has(key) && now() - entries.get(key).at <= ttlMs,
    metrics: () => ({ entries: entries.size, bytes, maxBytes, hits, misses }) };
}
module.exports = { createCache, createEncoder };
