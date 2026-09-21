"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { performance } = require("node:perf_hooks");

const root = path.join(__dirname, "..");
const input = path.resolve(process.argv[2] || path.join(root, "data", "demo-state.json"));
const iterations = Number(process.argv[3] || 5);
assert.ok(Number.isInteger(iterations) && iterations >= 1 && iterations <= 10, "Use entre 1 y 10 iteraciones.");

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50Ms: Math.round(sorted[Math.ceil(sorted.length * 0.5) - 1] * 10) / 10,
    p95Ms: Math.round(sorted[Math.ceil(sorted.length * 0.95) - 1] * 10) / 10,
    maxMs: Math.round(sorted.at(-1) * 10) / 10
  };
}

async function main() {
  const original = fs.readFileSync(input);
  const originalHash = hash(original);
  const payload = JSON.parse(original.toString("utf8"));
  assert.ok(payload && payload.state && typeof payload.state === "object", "El archivo no contiene un estado valido.");
  const sections = Object.entries(payload.state)
    .map(([name, value]) => ({ name, bytes: Buffer.byteLength(JSON.stringify(value) || "null") }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 12);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dl-state-write-benchmark-"));
  const syncFile = path.join(directory, "sync.json");
  const asyncFile = path.join(directory, "async.json");
  const results = { sync: { serialization: [], disk: [] }, async: { serialization: [], disk: [] } };

  try {
    for (let index = 0; index < iterations; index += 1) {
      for (const mode of ["sync", "async"]) {
        const startedAt = performance.now();
        const serialized = JSON.stringify(payload);
        const serializedAt = performance.now();
        const destination = mode === "sync" ? syncFile : asyncFile;
        const temporary = `${destination}.tmp`;
        if (mode === "sync") {
          fs.writeFileSync(temporary, serialized, "utf8");
          fs.renameSync(temporary, destination);
        } else {
          await fs.promises.writeFile(temporary, serialized, "utf8");
          await fs.promises.rename(temporary, destination);
        }
        const persistedAt = performance.now();
        assert.equal(hash(fs.readFileSync(destination)), hash(serialized), "La copia temporal no coincide.");
        results[mode].serialization.push(serializedAt - startedAt);
        results[mode].disk.push(persistedAt - serializedAt);
      }
    }
    assert.equal(hash(fs.readFileSync(input)), originalHash, "El archivo original cambio durante la medicion.");
    console.log(JSON.stringify({
      input,
      originalBytes: original.length,
      originalSha256: originalHash,
      iterations,
      largestSections: sections,
      sync: {
        serialization: summary(results.sync.serialization),
        disk: summary(results.sync.disk)
      },
      async: {
        serialization: summary(results.async.serialization),
        disk: summary(results.async.disk)
      },
      note: "La escritura asincrona no confirma antes de persistir ni reduce por si sola la serializacion. Este script nunca escribe el archivo de entrada."
    }, null, 2));
  } finally {
    for (const file of [syncFile, asyncFile, `${syncFile}.tmp`, `${asyncFile}.tmp`]) {
      try { fs.unlinkSync(file); } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    fs.rmdirSync(directory);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
