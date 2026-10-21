"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const Engine = require("../order-engine");
const { draftCountState, stateJsonParts, writeCountState } = require("../stock-count-storage");
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "dl-count-memory-"));
const file = path.join(folder, "state.json");
try {
  const state = { products: [{ codigo_producto: "A", name: "A", stock_fisico: 100, stock_reservado: 10 },
    { codigo_producto: "B", name: "B", stock_fisico: 50, stock_reservado: 5 }],
    orders: [{ code: "P-1", status: "Entregado", amount: 25, items: [] }], accounts: [{ balance: 123.45 }],
    physicalStockCounts: [], physicalStockAdjustments: [], stockMovements: [], globalAudit: [] };
  const original = JSON.stringify(state);
  const input = { productCode: "A", countId: "CNT-MEMORY-TEST-001", expectedQty: 100, countedQty: 80 };
  const draft = draftCountState(state);
  assert.equal(draft.orders, state.orders, "orders not cloned");
  Engine.recordPhysicalCount(draft, input, "Test");
  Engine.reconcilePhysicalCount(draft, { ...input, reason: "Conteo" }, "Test");
  assert.equal(JSON.stringify(state), original, "draft cannot mutate cached state");
  assert.equal(draft.products[0].stock_reservado, 10);
  assert.deepEqual(draft.accounts, state.accounts);
  assert.deepEqual(draft.orders, state.orders);
  assert.deepEqual(draft.products[1], state.products[1]);
  const once = JSON.stringify(draft);
  assert.equal(Engine.reconcilePhysicalCount(draft, { ...input, reason: "Conteo" }, "Test").replayed, true);
  assert.equal(JSON.stringify(draft), once);
  const payload = { version: 1, state: { ...draft, text: "Espa\u00f1ol \ud83d\ude80", nullable: null, sparse: [undefined, null], skip: undefined } };
  assert.equal([...stateJsonParts(payload)].join(""), JSON.stringify(payload));
  const stats = writeCountState(file, payload);
  assert.equal(fs.readFileSync(file, "utf8"), JSON.stringify(payload));
  assert.equal(stats.bytes, Buffer.byteLength(JSON.stringify(payload)));
  const saved = fs.readFileSync(file, "utf8");
  for (const failure of ["writeSync", "fsyncSync", "renameSync"]) {
    const io = { ...fs, [failure]: () => { throw new Error("Injected failure"); } };
    assert.throws(() => writeCountState(file, { ...payload, version: 2 }, io), /Injected/);
    assert.equal(fs.readFileSync(file, "utf8"), saved);
    assert.deepEqual(fs.readdirSync(folder), ["state.json"]);
  }
  const partial = { ...fs, writeSync: (fd, buffer, offset, length) => fs.writeSync(fd, buffer, offset, Math.min(17, length)) };
  writeCountState(file, payload, partial);
  assert.equal(fs.readFileSync(file, "utf8"), saved);
  const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  const ctx = vm.createContext({ state: { products: state.products }, syncVersion: 1,
    persistLocalMeta() {}, scheduleRenderForCurrentUser() {} });
  vm.runInContext(source.slice(source.indexOf("function applyOperationalPatches("), source.indexOf("async function postOperationalAction(")), ctx);
  const patch = { stockCountPatch: true, refreshRequired: true, version: 2,
    count: draft.physicalStockCounts[0], adjustment: draft.physicalStockAdjustments[0],
    stockMovement: draft.stockMovements[0], products: [draft.products[0]] };
  ctx.applyOperationalPatches(patch); ctx.applyOperationalPatches(patch);
  assert.equal(ctx.state.physicalStockCounts.length, 1);
  assert.equal(ctx.state.physicalStockAdjustments.length, 1);
  assert.equal(ctx.state.stockMovements.length, 1);
  assert.equal(ctx.state.products[0].stock_fisico, 80);
  assert.equal(ctx.syncVersion, 1, "partial response must not advance full-sync cursor");
  console.log("PASS isolated drafts, reserves/accounts/orders, retry, byte-identical JSON, partial writes, disk failures and UI patch replay");
} finally {
  for (const entry of fs.readdirSync(folder)) fs.unlinkSync(path.join(folder, entry));
  fs.rmdirSync(folder);
}
