"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Engine = require("../order-engine");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
function extract(name) {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, "m"));
  assert.ok(start >= 0, name);
  const next = source.slice(start + 1).search(/\n(?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 1 + next);
}
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const nodes = {};
for (const id of ["supplyProductFilter", "supplyDateFrom", "supplyDateTo", "supplySupplierFilter", "supplyRubricFilter", "supplyStatusFilter",
  "supplyPlannerSummary", "supplyPlannerTable", "supplyPlannerError", "supplyPlannerUpdated", "refreshSupplyPlannerBtn",
  "exportSupplyPlannerExcelBtn", "exportSupplyPlannerPdfBtn", "printSupplyPlannerBtn"]) nodes[id] = { value: /Supplier|Rubric|Status/.test(id) ? "all" : "", innerHTML: "", disabled: false };
const pending = (code, date, productCode, name, qty) => ({ code, createdAt: date, client: 'Client <unsafe>', status: Engine.STATUS.PENDING,
  items: [{ productCode, name, requestedQty: qty, missingQty: qty }] });
const state = {
  products: [{ codigo_producto: "00170", name: 'Aceite <girasol>', proveedor: "La Imperial", rubro: "Alimentos", stock: 0, stock_en_transito: 2, costo: 12.5, precio_lista_2: 20 },
    { codigo_producto: "1701", name: "Trapo", proveedor: "Otra", rubro: "Limpieza", stock: 0, stock_en_transito: 10 }],
  orders: [pending("P1", "2026-10-23T03:00:00Z", "00170", 'Aceite <girasol>', 5),
    pending("P2", "2026-10-25T02:59:59Z", "00170", 'Aceite <girasol>', 7),
    pending("P3", "2026-10-24", "1701", "Trapo", 4),
    pending("P4", "", "MISSING", "Deleted product", 1),
    { ...pending("CLOSED", "2026-10-24", "00170", "Aceite", 99), status: "Entregado" }],
  accounts: [{ balance: 100 }], stockMovements: [{ qty: 1 }], physicalStockCounts: [{ counted: 20 }]
};
const snapshot = JSON.stringify(state);
let active = "stock", selected = "products", builds = 0, pulls = 0;
const files = [], reports = [], notices = [];
const ctx = vm.createContext({
  state, supplyPlannerCache: null, supplyPlannerRefreshing: false, supplyPlannerExporting: false,
  byId: id => nodes[id], activeViewId: () => active,
  operationalWorkspaces: { get: () => ({ selected }) },
  normalizeSearchText: norm, searchTerms: v => norm(v).split(/\s+/).filter(Boolean), matchesSearch: (value, terms) => terms.every(t => norm(value).includes(t)),
  numeric: (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d,
  escapeHtml: value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  updateDynamicFilter: (id, values, selected) => nodes[id].value = values.includes(selected) ? selected : "all",
  productPriceForListNumber: p => p.precio_lista_2 || 0,
  OrderEngine: { buildShortageList(value) { builds++; return Engine.buildShortageList(value); } },
  syncPullInFlight: false, syncPushInFlight: false, syncPullRetryAt: 0, syncVersion: 12, syncReady: true, currentUser: { role: "admin" },
  isAdminUser: () => ctx.currentUser?.role === "admin", pullStateFromServer: async () => { pulls++; },
  downloadXlsxReport: async report => reports.push(report), reportDateStamp: () => "20261024",
  makeReadableReportPdf: (title, headers, rows, options) => ({ title, headers, rows, options }), downloadBlob: (name, blob) => files.push({ name, blob }),
  showCompactNotice: (msg) => notices.push(msg), window: { open: () => assert.fail("no implicit popups"), setTimeout: () => assert.fail("no new timers") }
});
for (const name of ["stockMovementDateKey", "productSupplierName", "supplyPlannerVisible", "supplyPlannerFilters", "supplyPlannerOrderDate", "buildSupplyPlannerRows", "supplyPlannerRows", "filteredSupplyPlannerRows", "renderSupplyPlanner", "renderStockSupply", "refreshSupplyPlanner", "supplyPlannerReport", "exportSupplyPlannerExcel", "exportSupplyPlannerPdf", "printSupplyPlanner"]) vm.runInContext(extract(name), ctx);
async function main() {
  assert.ok(!source.includes("openSupplyPlannerIfPending"));
  assert.ok(!source.includes("openSupplyPlannerDialog"));
  assert.ok(!html.includes('id="supplyPlannerDialog"'));
  assert.equal((html.match(/id="supplyPlannerTable"/g) || []).length, 1);
  ctx.renderStockSupply(); ctx.renderSupplyPlanner();
  assert.equal(builds, 0, "lazy outside selected section");
  selected = "supply"; active = "dashboard"; ctx.renderStockSupply(); assert.equal(builds, 0);
  active = "stock"; ctx.renderStockSupply(); assert.equal(builds, 1);
  assert.ok(!nodes.supplyPlannerTable.innerHTML.includes("<unsafe>"));
  assert.ok(nodes.supplyPlannerTable.innerHTML.includes("&lt;unsafe&gt;"));
  const rows = ctx.supplyPlannerRows();
  const expected = Engine.buildShortageList(JSON.parse(snapshot));
  assert.equal(JSON.stringify(rows.map(r => [r.productCode, r.missingQty, r.inTransit, r.purchaseQty])), JSON.stringify(expected.map(r => [r.productCode, r.missingQty, r.inTransit, r.purchaseQty])));
  assert.equal(rows.find(r => r.productCode === "00170").purchaseQty, 10, "transit subtracted once per product");
  nodes.supplyProductFilter.value = "00170"; ctx.renderSupplyPlanner();
  assert.equal(ctx.filteredSupplyPlannerRows().length, 1); assert.equal(builds, 1, "text filter reuses calculation");
  nodes.supplySupplierFilter.value = "Otra"; ctx.renderSupplyPlanner(); assert.equal(ctx.filteredSupplyPlannerRows().length, 0);
  nodes.supplySupplierFilter.value = "all"; nodes.supplyProductFilter.value = "";
  nodes.supplyRubricFilter.value = "Limpieza"; ctx.renderSupplyPlanner(); assert.equal(ctx.filteredSupplyPlannerRows()[0].productCode, "1701");
  nodes.supplyRubricFilter.value = "all"; nodes.supplyStatusFilter.value = "transit"; ctx.renderSupplyPlanner();
  assert.equal(ctx.filteredSupplyPlannerRows().length, 1); assert.equal(ctx.filteredSupplyPlannerRows()[0].purchaseQty, 0);
  nodes.supplyStatusFilter.value = "purchase"; ctx.renderSupplyPlanner(); assert.equal(ctx.filteredSupplyPlannerRows().length, 2);
  nodes.supplyStatusFilter.value = "all"; nodes.supplyDateFrom.value = "2026-10-23"; nodes.supplyDateTo.value = "2026-10-23";
  ctx.renderSupplyPlanner(); assert.equal(ctx.filteredSupplyPlannerRows()[0].purchaseQty, 3); assert.equal(ctx.filteredSupplyPlannerRows()[0].orders[0].code, "P1");
  nodes.supplyDateFrom.value = "2026-10-24"; nodes.supplyDateTo.value = "2026-10-24"; ctx.renderSupplyPlanner();
  assert.equal(ctx.filteredSupplyPlannerRows().length, 2, "Argentina day boundary inclusive; undated excluded");
  assert.equal(ctx.filteredSupplyPlannerRows().find(r => r.productCode === "00170").purchaseQty, 5);
  const report = ctx.supplyPlannerReport();
  await ctx.exportSupplyPlannerExcel(); ctx.exportSupplyPlannerPdf();
  assert.equal(JSON.stringify(reports[0].rows), JSON.stringify(report.rows));
  assert.equal(JSON.stringify(files[0].blob.rows), JSON.stringify(report.rows));
  assert.equal(reports[0].rows[0][0], "00170"); assert.equal(typeof reports[0].rows[0][4], "number");
  assert.equal(reports[0].columnFormats[0], "@"); assert.equal(reports[0].rows[0][9], 12.5);
  let printed = "";
  ctx.window.open = () => ({ document: { open() {}, write(html) { printed = html; }, close() {} } });
  ctx.printSupplyPlanner();
  assert.match(printed, /&lt;girasol&gt;/); assert.match(printed, /P2/); assert.ok(!printed.includes("P1 -"));
  nodes.supplyDateFrom.value = "2026-10-25"; ctx.renderSupplyPlanner(); assert.equal(nodes.supplyPlannerError.hidden, false);
  await ctx.exportSupplyPlannerExcel(); ctx.exportSupplyPlannerPdf(); ctx.printSupplyPlanner(); assert.equal(reports.length, 1); assert.equal(files.length, 1);
  nodes.supplyDateFrom.value = ""; nodes.supplyDateTo.value = ""; ctx.renderStockSupply();
  const countBefore = builds;
  await Promise.all([ctx.refreshSupplyPlanner(), ctx.refreshSupplyPlanner()]); assert.equal(pulls, 1); assert.equal(builds, countBefore + 1);
  ctx.syncPullInFlight = true; await ctx.refreshSupplyPlanner(); assert.equal(pulls, 1); ctx.syncPullInFlight = false;
  ctx.pullStateFromServer = async () => { pulls++; ctx.syncReady = false; };
  await ctx.refreshSupplyPlanner(); assert.match(nodes.supplyPlannerUpdated.textContent, /No se pudo/); assert.equal(nodes.refreshSupplyPlannerBtn.disabled, false);
  ctx.currentUser.role = "seller"; await ctx.exportSupplyPlannerExcel(); ctx.exportSupplyPlannerPdf(); ctx.printSupplyPlanner();
  assert.equal(reports.length, 1); assert.equal(files.length, 1);
  assert.equal(JSON.stringify(state), snapshot, "no mutations even to legacy unnormalized products");
  selected = "products"; const hiddenBuilds = builds; ctx.renderStockSupply(); ctx.renderSupplyPlanner(); await ctx.refreshSupplyPlanner(); assert.equal(builds, hiddenBuilds);
  state.orders[0].items[0].missingQty = 3;
  selected = "supply"; ctx.renderStockSupply();
  assert.equal(ctx.filteredSupplyPlannerRows().find(r => r.productCode === "00170").purchaseQty, 8, "reentering sees latest in-place state changes");
  state.orders[0].items[0].missingQty = 5;
  assert.equal(JSON.stringify(state), snapshot);
  ctx.currentUser.role = "admin";
  let finishExport, exportCalls = 0;
  ctx.downloadXlsxReport = () => { exportCalls++; return new Promise(resolve => { finishExport = resolve; }); };
  const exporting = ctx.exportSupplyPlannerExcel();
  ctx.renderSupplyPlanner();
  assert.equal(nodes.exportSupplyPlannerExcelBtn.disabled, true);
  await ctx.exportSupplyPlannerExcel();
  assert.equal(exportCalls, 1, "filter rerender cannot reenable an in-flight export");
  finishExport(); await exporting;
  assert.equal(nodes.exportSupplyPlannerExcelBtn.disabled, false);
  console.log("PASS P141: engine equivalence; no data mutation; lazy section; all filters; inclusive dates; transit once; escaping; XLSX/PDF/print same rows; numeric types; admin guards; single refresh; failure status; no popups or timers.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
