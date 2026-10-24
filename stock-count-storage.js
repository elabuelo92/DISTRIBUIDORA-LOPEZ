"use strict";
const fs = require("node:fs");
const { performance } = require("node:perf_hooks");
const crypto = require("node:crypto");

function countFingerprint(state, productCode) {
  const product = (state.products || []).find(p => String(p.codigo_producto || p.code || "") === productCode);
  if (!product) throw new Error("Producto no encontrado.");
  const movement = (state.stockMovements || []).find(m => String(m.productCode || m.codigo_producto || "") === productCode);
  const count = (state.physicalStockCounts || []).find(c => c.productCode === productCode);
  return JSON.stringify([product.stock_fisico ?? product.stock_actual ?? product.stock,
    product.stock_reservado, movement || null, count?.id || ""]);
}

function createCountReferences({ now = Date.now, ttl = 15 * 60 * 1000 } = {}) {
  const entries = new Map();
  return {
    prepare(state, input, username) {
      const cut = (state.physicalStockCuts || []).find(c => c.id === input.cutId && c.status === "Abierto");
      const productCode = String(input.productCode || "");
      if (!cut?.products.some(p => p.productCode === productCode)) throw new Error("Producto fuera del corte abierto.");
      if ((state.physicalStockAdjustments || []).some(a => a.cutId === cut.id && a.productCode === productCode)) throw new Error("Producto ya ajustado en este corte.");
      for (const [key, value] of entries) if (value.expires <= now()) entries.delete(key);
      if (entries.size >= 1000) entries.delete(entries.keys().next().value);
      const fingerprint = countFingerprint(state, productCode);
      const reference = { id: crypto.randomBytes(24).toString("hex"), cutId: cut.id, productCode,
        expectedQty: Number(JSON.parse(fingerprint)[0]), startedAt: new Date(now()).toISOString() };
      if (!Number.isSafeInteger(reference.expectedQty) || reference.expectedQty < 0) throw new Error("Stock actual invalido.");
      entries.set(reference.id, { reference, fingerprint, username, expires: now() + ttl });
      return reference;
    },
    verify(state, input, username) {
      const entry = entries.get(input.referenceId);
      if (!entry || entry.username !== username || entry.expires <= now()) throw new Error("Referencia de conteo vencida. Volver a comenzar el conteo del producto.");
      if (entry.reference.cutId !== input.cutId || entry.reference.productCode !== input.productCode
        || entry.fingerprint !== countFingerprint(state, input.productCode)) {
        throw new Error("El producto tuvo movimientos durante el conteo. Volver a comenzar y contar nuevamente.");
      }
      return entry.reference;
    }
  };
}

// Counts never edit orders/accounts. Isolate writable collections until commit.
function draftCountState(state) {
  const draft = { ...state, products: (state.products || []).map(product => ({ ...product })) };
  for (const key of ["physicalStockCuts", "physicalStockCounts", "physicalStockAdjustments", "stockMovements", "globalAudit"]) {
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

module.exports = { draftCountState, stateJsonParts, writeCountState, createCountReferences };
