"use strict";
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const crypto = require("node:crypto"), vm = require("node:vm"), zlib = require("node:zlib");
const { promisify } = require("node:util");
const { spawnSync } = require("node:child_process");
const { draftCountState, writeCountState } = require("../stock-count-storage");
const Engine = require("../order-engine");
const snapshot = process.argv[2];
if (!snapshot) throw new Error("Local snapshot required");
const hashFile = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
if (!process.argv.includes("--worker")) {
  const hash = hashFile(snapshot);
  for (const mode of ["before", "after"]) {
    const run = spawnSync(process.execPath, ["--max-old-space-size=512", __filename, snapshot, "--worker", mode], {
      encoding: "utf8", timeout: 120000, maxBuffer: 1000000 });
    console.log(JSON.stringify({ mode, status: run.status, result: run.stdout.trim(),
      fatal: run.stderr.split(/\r?\n/).find(line => line.includes("FATAL ERROR")) || "",
      error: run.stderr.slice(-600) }));
    if (mode === "after" && run.status !== 0) process.exitCode = 1;
  }
  if (hashFile(snapshot) !== hash) throw new Error("Snapshot changed");
  console.log("Snapshot unchanged. Isolated serialization/storage + two sync gzip responses, not full HTTP load.");
} else {
  const mode = process.argv.at(-1);
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "dl-count-bench-"));
  const payload = JSON.parse(fs.readFileSync(snapshot, "utf8"));
  const source = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  const context = vm.createContext({ Buffer, crypto, stateForUser: state => state });
  vm.runInContext(source.slice(source.indexOf("function stateSectionsResponse("), source.indexOf("function sendProjectedStateResponse(")), context);
  const start = performance.now();
  let peakHeap = 0, responseBytes = 0;
  const sample = () => { peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed); };
  const timer = setInterval(sample, 10);
  async function run() {
    const pending = Array.from({ length: 2 }, () => {
      const buffer = context.stateSectionsResponse(payload, { role: "admin" }, null, 0);
      sample(); return promisify(zlib.gzip)(buffer);
    });
    for (let i = 0; i < 3; i++) {
      const draft = mode === "before" ? JSON.parse(JSON.stringify(payload.state)) : draftCountState(payload.state);
      sample();
      const product = draft.products.find(p => p.codigo_producto && Number.isSafeInteger(p.stock_fisico) && p.stock_fisico >= p.stock_reservado);
      const input = { productCode: product.codigo_producto, countId: `CNT-BENCH-00000${i}`, expectedQty: product.stock_fisico, countedQty: product.stock_fisico + 1, reason: "Local only" };
      Engine.recordPhysicalCount(draft, input, "Test");
      let orders;
      if (mode === "before") orders = new Map(draft.orders.map(o => [o.code, JSON.parse(JSON.stringify(o))]));
      const result = Engine.reconcilePhysicalCount(draft, input, "Test"); sample();
      const saved = { version: i + 1, state: draft };
      if (mode === "before") {
        fs.writeFileSync(path.join(folder, "state.json"), JSON.stringify(saved)); sample();
        const response = Buffer.from(JSON.stringify({ ok: true, state: JSON.parse(JSON.stringify(draft)), product: result.product }));
        responseBytes = response.length; sample();
        if (orders.size !== draft.orders.length) throw new Error("Order fixture keys not unique");
      } else {
        writeCountState(path.join(folder, "state.json"), saved); sample();
        responseBytes = Buffer.byteLength(JSON.stringify({ ok: true, products: [result.product], adjustment: result.adjustment }));
      }
      payload.state = draft;
    }
    await Promise.all(pending); sample();
    console.log(JSON.stringify({ mode, iterations: 3, elapsedMs: Math.round(performance.now() - start),
      peakRssKiB: process.resourceUsage().maxRSS, peakHeap, responseBytes, heapLimitMiB: 512 }));
  }
  run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    clearInterval(timer);
    for (const file of fs.readdirSync(folder)) fs.unlinkSync(path.join(folder, file));
    fs.rmdirSync(folder);
  });
}
