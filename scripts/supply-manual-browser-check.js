"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
async function check(base, cookie, password, read) {
  assert.match(base, /^http:\/\/127\.0\.0\.1:\d+$/, "isolated local server only");
  const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(file => fs.existsSync(file));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const separator = cookie.indexOf("=");
    await context.addCookies([{ name: cookie.slice(0, separator), value: cookie.slice(separator + 1), url: base }]);
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.url().includes("/api/")) requests.push({ method: request.method(), path: new URL(request.url()).pathname }); });
    page.on("dialog", dialog => { console.log(`BROWSER DIALOG: ${dialog.message()}`); return dialog.accept(); });
    await page.goto(`${base}/#stock`);
    await page.locator("#stock.active").waitFor({ timeout: 30000 });
    await page.locator('#stock [data-tool-id="products"]').click();
    await page.locator('[data-edit-product="Test B"]').waitFor();
    await page.evaluate(() => {
      window.supplyProbe = { builds: 0 };
      const build = OrderEngine.buildShortageList;
      OrderEngine.buildShortageList = (...args) => { window.supplyProbe.builds++; return build(...args); };
    });
    const inventory = data => data.products.map(p => [p.codigo_producto, Number(p.stock_fisico || 0), Number(p.stock_reservado || 0), Number(p.stock_en_transito || 0)]);
    const before = read();
    const protectedFields = ["accounts", "supplierAccounts", "physicalStockCounts", "physicalStockAdjustments", "deliveryRoutes"];
    async function stillClosed() {
      await page.waitForTimeout(350); // Beyond the removed 120 ms auto-open delay.
      assert.equal(await page.locator("#supplyPlannerDialog").count(), 0);
      assert.equal(await page.locator("#supplyPlannerTable").innerHTML(), "", "no hidden report generation");
    }
    await stillClosed();
    await page.locator("#stockProductSearch").fill("Test B");
    await page.waitForFunction(() => document.querySelectorAll("#stockTable tr").length === 1);
    assert.equal(await page.evaluate(() => window.supplyProbe.builds), 0, "search does not calculate supply");
    await page.locator('[data-edit-product="Test B"]').click();
    await page.locator('#stockEditForm [name="marca"]').fill("P142 isolated test");
    await page.locator('#stockEditForm [name="rubro"]').fill("Test");
    await page.locator('#stockEditForm [name="admin_password"]').fill(password);
    const saved = page.waitForResponse(response => new URL(response.url()).pathname === "/api/state" && response.request().method() === "POST");
    await page.locator("#stockEditSaveBtn").click();
    await page.locator("#stockEditDialog").waitFor({ state: "hidden" });
    assert.equal((await saved).status(), 200);
    await page.waitForFunction(() => !syncPushInFlight);
    assert.equal(read().products.find(p => p.codigo_producto === "B").marca, "P142 isolated test", "real isolated save persisted");
    assert.deepEqual(inventory(read()), inventory(before), "editing metadata preserves stock and reservations");
    await stillClosed();
    await page.locator('[data-view="dashboard"]').first().click();
    await page.locator('[data-view="stock"]').first().click();
    await stillClosed();
    // Today's UI hides the legacy manual-entry button. Exercise a server stock
    // update and its normal client refresh without enabling that old control.
    assert.equal(await page.locator("#manualStockBtn").isVisible(), false);
    const beforeReceipt = read();
    const receipt = await context.request.post(`${base}/api/stock/entry`, { data: {
      productCode: "B", product: "Test B", qty: 1, movementType: "Ingreso", note: "P142 isolated receipt"
    } });
    assert.equal(receipt.status(), 200);
    await page.evaluate(() => pullStateFromServer());
    await stillClosed();
    const afterReceipt = read();
    assert.equal(afterReceipt.products.find(p => p.codigo_producto === "B").stock_fisico, beforeReceipt.products.find(p => p.codigo_producto === "B").stock_fisico + 1);
    assert.equal(afterReceipt.stockMovements.length, beforeReceipt.stockMovements.length + 1, "one intended isolated receipt only");
    for (const key of protectedFields) assert.deepEqual(afterReceipt[key], before[key], key);
    const expectedShortages = require("../order-engine").buildShortageList(afterReceipt);
    assert.ok(expectedShortages.some(item => item.productCode === "C" && item.purchaseQty === 12));
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("supply");
    await page.locator("#supplyPlannerTable").waitFor();
    assert.equal(await page.locator("dialog[open]").count(), 0);
    assert.equal(await page.locator("#supplyPlannerTable tr").count(), 2);
    const callsBefore = requests.length;
    const snapshot = JSON.stringify(read());
    assert.match(await page.locator("#supplyPlannerTable").innerText(), /Pending product/);
    const observed = await page.evaluate(() => filteredSupplyPlannerRows().map(r => [r.productCode, r.missingQty, r.inTransit, r.purchaseQty]));
    assert.deepEqual(observed, expectedShortages.map(r => [r.productCode, r.missingQty, r.inTransit, r.purchaseQty]));
    const initialBuilds = await page.evaluate(() => window.supplyProbe.builds);
    await page.locator("#supplyProductFilter").fill("Pending");
    assert.equal(await page.locator("#supplyPlannerTable tr").count(), 1);
    await page.locator("#supplySupplierFilter").selectOption("Supplier Two");
    assert.match(await page.locator("#supplyPlannerTable").innerText(), /No hay faltantes/);
    await page.locator("#clearSupplyFiltersBtn").click();
    await page.locator("#supplyRubricFilter").selectOption("Food");
    assert.match(await page.locator("#supplyPlannerTable").innerText(), /Transit product/);
    await page.locator("#clearSupplyFiltersBtn").click();
    await page.locator("#supplyStatusFilter").selectOption("transit");
    assert.equal(await page.locator("#supplyPlannerTable tr").count(), 1);
    assert.equal(await page.evaluate(() => window.supplyProbe.builds), initialBuilds, "filters reuse one calculation");
    await page.locator("#clearSupplyFiltersBtn").click();
    await page.locator("#supplyDateFrom").fill("2026-10-23");
    await page.locator("#supplyDateTo").fill("2026-10-23");
    assert.equal(await page.locator("#supplyPlannerTable tr").count(), 1);
    assert.equal(await page.locator("#supplyPlannerTable tr td").nth(3).innerText(), "5");
    await page.locator("#supplyDateFrom").fill("2026-10-24");
    assert.equal(await page.locator("#supplyPlannerError").isVisible(), true);
    assert.equal(await page.locator("#exportSupplyPlannerExcelBtn").isDisabled(), true);
    await page.locator("#supplyDateTo").fill("2026-10-24");
    await page.locator("#supplyProductFilter").fill("Pending");
    assert.equal(await page.locator("#supplyPlannerTable tr td").nth(3).innerText(), "7");
    const outputDir = path.join(__dirname, "../docs/P141-exports");
    fs.mkdirSync(outputDir, { recursive: true });
    async function download(button, fileName) {
      const ready = page.waitForEvent("download");
      await page.locator(button).click();
      const file = await ready;
      assert.equal(await file.failure(), null);
      await file.saveAs(path.join(outputDir, fileName));
      return path.join(outputDir, fileName);
    }
    const filteredExcel = await download("#exportSupplyPlannerExcelBtn", "compras-filtradas.xlsx");
    await download("#exportSupplyPlannerPdfBtn", "compras-filtradas.pdf");
    const ExcelJS = require("exceljs");
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(filteredExcel);
    const sheet = book.getWorksheet(1);
    assert.equal(sheet.rowCount, 4);
    assert.equal(sheet.getCell("E4").value, 7);
    assert.equal(sheet.getCell("G4").value, 7);
    assert.equal(sheet.getCell("J4").value, 12.5);
    assert.match(sheet.getCell("I4").value, /PED-PENDING-141/);
    assert.ok(!sheet.getCell("I4").value.includes("PED-PENDING-142"));
    await context.addInitScript(() => { window.print = () => {}; });
    const popupReady = page.waitForEvent("popup");
    await page.locator("#printSupplyPlannerBtn").click();
    const popup = await popupReady;
    await popup.waitForLoadState();
    assert.equal(await popup.locator("tbody tr").count(), 1);
    assert.match(await popup.locator("tbody").innerText(), /PED-PENDING-141/);
    assert.ok(!(await popup.locator("tbody").innerText()).includes("PED-PENDING-142"));
    await popup.pdf({ path: path.join(outputDir, "impresion-filtrada.pdf"), preferCSSPageSize: true });
    await popup.close();
    await page.locator("#clearSupplyFiltersBtn").click();
    const allExcel = await download("#exportSupplyPlannerExcelBtn", "compras-todas.xlsx");
    await download("#exportSupplyPlannerPdfBtn", "compras-todas.pdf");
    await book.xlsx.readFile(allExcel);
    assert.equal(book.getWorksheet(1).getCell("A5").value, "00170", "leading zeros retained as text");
    assert.equal(book.getWorksheet(1).getCell("G5").value, 0);
    await page.screenshot({ path: path.join(__dirname, "../docs/P141-abastecimiento-desktop.png"), fullPage: true });
    await page.locator("#themeToggleBtn").click();
    await page.screenshot({ path: path.join(__dirname, "../docs/P141-abastecimiento-oscuro.png"), fullPage: true });
    const colors = await page.locator("#supplyProductFilter").evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    assert.notEqual(colors.color, colors.background);
    assert.notEqual(colors.background, "rgb(255, 255, 255)");
    await page.locator("#themeToggleBtn").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(__dirname, "../docs/P141-abastecimiento-movil.png"), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, "mobile page does not overflow; table scrolls within its container");
    await page.setViewportSize({ width: 1440, height: 1000 });
    const beforeRefresh = requests.filter(item => item.path === "/api/state" && item.method === "GET").length;
    await page.locator("#refreshSupplyPlannerBtn").click();
    await page.waitForFunction(() => !supplyPlannerRefreshing);
    assert.match(await page.locator("#supplyPlannerUpdated").innerText(), /Actualizado/);
    assert.equal(requests.filter(item => item.path === "/api/state" && item.method === "GET").length, beforeRefresh + 1);
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("products");
    const beforeHidden = await page.evaluate(() => window.supplyProbe.builds);
    await page.locator("#stockProductSearch").fill("Test");
    assert.equal(await page.evaluate(() => window.supplyProbe.builds), beforeHidden);
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("supply");
    assert.equal(await page.locator("dialog[open]").count(), 0, "tool changes do not open any popup");
    assert.deepEqual(requests.slice(callsBefore).filter(item => item.method === "POST" && item.path !== "/api/reports/xlsx" && item.path !== "/api/presence/heartbeat"), [], "consultation/export never writes business data");
    assert.equal(JSON.stringify(read()), snapshot, "consult/close report is read-only");
    assert.equal(requests.filter(item => item.path === "/api/admin/reauth" && item.method === "POST").length, 1);
    assert.equal(requests.filter(item => item.path === "/api/state" && item.method === "POST").length, 1, "saving has no duplicated listener/request");
    assert.deepEqual(errors, []);
    const report = { at: new Date().toISOString(), passed: true, environment: "local-isolated", productionAccess: false,
      apiRequests: requests, supply: await page.evaluate(() => window.supplyProbe), errors,
      checks: ["stock-entry", "search", "edit-save", "module-navigation", "stock-api-refresh", "tool-navigation",
        "manual-open-once", "close-button", "reopen-fresh", "escape", "desktop-mobile", "unchanged-consultation-state",
        "stock-reservations-preserved-on-edit", "one-isolated-receipt", "financial-records-preserved", "no-report-api", "no-duplicate-save"] };
    report.checks = ["stock-entry", "search", "edit-save", "module-navigation", "stock-api-refresh", "manual-section", "no-modal",
      "all-filters", "date-range", "invalid-date-range", "xlsx-numeric-and-identifiers", "pdf-download", "print-filtered",
      "single-refresh", "desktop-mobile", "read-only-report", "protected-data", "lazy-hidden-section"];
    fs.writeFileSync(path.join(__dirname, "../docs/P141-abastecimiento-results.json"), JSON.stringify(report, null, 2));
    console.log("PASS P141 browser: permanent manual section, all filters, real XLSX/PDF/print, one refresh, no automatic dialogs, desktop/mobile, unchanged data");
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
}
module.exports = { check };
