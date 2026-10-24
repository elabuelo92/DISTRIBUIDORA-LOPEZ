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
      window.supplyProbe = { opens: 0, builds: 0 };
      const modal = document.querySelector("#supplyPlannerDialog");
      const show = modal.showModal.bind(modal);
      modal.showModal = () => { window.supplyProbe.opens++; return show(); };
      const build = OrderEngine.buildShortageList;
      OrderEngine.buildShortageList = (...args) => { window.supplyProbe.builds++; return build(...args); };
    });
    const inventory = data => data.products.map(p => [p.codigo_producto, Number(p.stock_fisico || 0), Number(p.stock_reservado || 0), Number(p.stock_en_transito || 0)]);
    const before = read();
    const protectedFields = ["accounts", "supplierAccounts", "physicalStockCounts", "physicalStockAdjustments", "deliveryRoutes"];
    async function stillClosed() {
      await page.waitForTimeout(350); // Beyond the removed 120 ms auto-open delay.
      assert.equal(await page.locator("#supplyPlannerDialog").evaluate(element => element.open), false);
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
    assert.ok(expectedShortages.some(item => item.productCode === "C" && item.purchaseQty === 5));
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("supply");
    await page.locator("#openSupplyPlannerBtn").waitFor();
    await stillClosed();
    const callsBefore = requests.length;
    const snapshot = JSON.stringify(read());
    await page.locator("#openSupplyPlannerBtn").click();
    await page.locator("#supplyPlannerDialog[open]").waitFor();
    assert.match(await page.locator("#supplyPlannerTable").innerText(), /Pending product/);
    assert.equal(await page.evaluate(() => window.supplyProbe.opens), 1);
    await page.screenshot({ path: path.join(__dirname, "../docs/P142-abastecimiento-manual.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(__dirname, "../docs/P142-abastecimiento-movil.png") });
    await page.locator('#supplyPlannerDialog button[aria-label="Cerrar"]').click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator("#supplyPlannerDialog").evaluate(element => element.open), false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("#openSupplyPlannerBtn").click();
    await page.locator("#supplyPlannerDialog[open]").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#supplyPlannerDialog").evaluate(element => element.open), false);
    assert.equal(await page.evaluate(() => window.supplyProbe.opens), 2, "one opening per manual action");
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("products");
    await page.locator('#stock select[aria-label="Cambiar herramienta"]').selectOption("supply");
    await page.waitForTimeout(350);
    assert.equal(await page.locator("#supplyPlannerDialog").evaluate(element => element.open), false, "tool changes do not reopen");
    assert.deepEqual(requests.slice(callsBefore).filter(item => item.method !== "GET" || !["/api/state", "/api/presence", "/api/health", "/api/session"].includes(item.path)), [], "consultation adds no API requests beyond normal read synchronization");
    assert.equal(JSON.stringify(read()), snapshot, "consult/close report is read-only");
    assert.equal(requests.filter(item => item.path === "/api/admin/reauth" && item.method === "POST").length, 1);
    assert.equal(requests.filter(item => item.path === "/api/state" && item.method === "POST").length, 1, "saving has no duplicated listener/request");
    assert.deepEqual(errors, []);
    const report = { at: new Date().toISOString(), passed: true, environment: "local-isolated", productionAccess: false,
      apiRequests: requests, supply: await page.evaluate(() => window.supplyProbe), errors,
      checks: ["stock-entry", "search", "edit-save", "module-navigation", "stock-api-refresh", "tool-navigation",
        "manual-open-once", "close-button", "reopen-fresh", "escape", "desktop-mobile", "unchanged-consultation-state",
        "stock-reservations-preserved-on-edit", "one-isolated-receipt", "financial-records-preserved", "no-report-api", "no-duplicate-save"] };
    fs.writeFileSync(path.join(__dirname, "../docs/P142-abastecimiento-results.json"), JSON.stringify(report, null, 2));
    console.log("PASS P142 browser: Stock/search/edit/save/navigation/stock API refresh do not open report; click opens once; close/reopen/Escape; desktop/mobile; backend shortages intact; no report API or data mutation");
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
}
module.exports = { check };
