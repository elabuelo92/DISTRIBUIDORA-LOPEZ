"use strict";
const fs = require("node:fs");
const { performance } = require("node:perf_hooks");

// Counts never edit orders/accounts. Isolate writable collections until commit.
function draftCountState(state) {
  const draft = { ...state, products: (state.products || []).map(product => ({ ...product })) };
  for (const key of ["physicalStockCounts", "physicalStockAdjustments", "stockMovements", "globalAudit"]) {
    draft[key] = [...(state[key] || [])];
  }
  return draft;
}

function* stateJsonParts(payload) {
  yield `{"version":${JSON.stringify(payload.version)},"state":{`;
  let first = true;
  for (const [key, value] of Object.entries(payload.state)) {
    if (value === undefined) continue;
    yield `${first ? "" : ","}${JSON.stringify(key)}:`;
    first = false;
    if (Array.isArray(value)) {
      yield "[";
      for (let i = 0; i < value.length; i++) {
        yield `${i ? "," : ""}${JSON.stringify(value[i]) ?? "null"}`;
      }
      yield "]";
    } else {
      yield JSON.stringify(value);
    }
  }
  yield "}}";
}

function writeCountState(file, payload, io = fs) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  let fd;
  let created = false;
  let bytes = 0;
  let diskMs = 0;
  const startedAt = performance.now();
  const disk = action => {
    const start = performance.now();
    try { return action(); } finally { diskMs += performance.now() - start; }
  };
  try {
    fd = disk(() => io.openSync(temporary, "wx"));
    created = true;
    let pending = "";
    const flush = () => {
      if (!pending) return;
      const buffer = Buffer.from(pending, "utf8");
      disk(() => {
        let offset = 0;
        while (offset < buffer.length) {
          const written = io.writeSync(fd, buffer, offset, buffer.length - offset);
          if (!written) throw new Error("No se pudo completar el guardado del conteo.");
          offset += written;
        }
      });
      bytes += buffer.length;
      pending = "";
    };
    for (const part of stateJsonParts(payload)) {
      pending += part;
      if (pending.length >= 65536) flush();
    }
    flush();
    disk(() => io.fsyncSync(fd));
    disk(() => io.closeSync(fd));
    fd = undefined;
    disk(() => io.renameSync(temporary, file));
    return { bytes, diskMs, serializationMs: performance.now() - startedAt - diskMs };
  } catch (error) {
    if (fd !== undefined) { try { io.closeSync(fd); } catch {} }
    if (created) { try { io.unlinkSync(temporary); } catch {} }
    throw error;
  }
}

module.exports = { draftCountState, stateJsonParts, writeCountState };
