"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
async function open(base, cookie) {
  if (!base.startsWith("http://127.0.0.1:")) throw new Error("Visual test requires isolated loopback server");
  const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(file => fs.existsSync(file));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const separator = cookie.indexOf("=");
  await context.addCookies([{ name: cookie.slice(0, separator), value: cookie.slice(separator + 1), url: base }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  async function check(stage, baseline, current, adjusted = false) {
    await page.goto(`${base}/#control-stock`);
    if (stage !== "inicio") await page.reload();
    const tool = page.locator('#control-stock [data-tool-id="count"]');
    await page.locator("#control-stock.active").waitFor({ timeout: 20000 });
    if (await tool.isVisible()) await tool.click();
    const row = page.locator('[data-physical-product="A"]');
    await row.waitFor();
    await page.waitForFunction(({ baseline, current, adjusted }) => {
      const row = document.querySelector('[data-physical-product="A"]');
      return row?.children[8]?.querySelector("strong")?.textContent === String(baseline)
        && row?.children[9]?.querySelector("strong")?.textContent === String(current)
        && (!adjusted || row.textContent.includes("Ajustado"));
    }, { baseline, current, adjusted }, { timeout: 30000 });
    assert.match(await page.locator("#physicalStockCutStatus").innerText(), /CUT-HTTP-TEST-001/);
    assert.equal(await row.locator("td").nth(8).locator("strong").innerText(), String(baseline));
    assert.equal(await row.locator("td").nth(9).locator("strong").innerText(), String(current));
    if (adjusted) {
      assert.match(await row.innerText(), /Ajustado/);
      assert.equal(await row.locator("[data-adjust-physical-stock]").count(), 0);
    }
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(__dirname, `../docs/STOCK-CORTE-${stage}-20261022.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    const fits = await page.locator("#physicalStockCutStatus").evaluate(element => element.scrollWidth <= element.clientWidth + 1);
    assert.ok(fits, "cut identification fits on mobile");
    await page.screenshot({ path: path.join(__dirname, `../docs/STOCK-CORTE-${stage}-movil-20261022.png`) });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.deepEqual(errors, [], "no uncaught UI errors");
  }
  async function exerciseUiLifecycle(password, nextQty) {
    page.on("dialog", dialog => dialog.accept());
    await page.reload();
    await page.locator("#control-stock.active").waitFor();
    const tool = page.locator('#control-stock [data-tool-id="count"]');
    if (await tool.isVisible()) await tool.click();
    await page.waitForFunction(() => document.querySelector("#startPhysicalStockCountBtn")?.textContent === "Iniciar corte de stock");
    await page.locator("#startPhysicalStockCountBtn").click();
    const input = page.locator('[data-physical-count="B"]');
    await input.waitFor();
    await input.fill(String(nextQty));
    // Another administrator closes an unrecorded cut while this browser has a draft.
    const oldCutId = await page.evaluate(() => OrderEngine.activePhysicalStockCut(state).id);
    const closed = await context.request.post(`${base}/api/stock/entry`, { data: { action: "closeCut", cutId: oldCutId } });
    assert.equal(closed.status(), 200);
    const started = await context.request.post(`${base}/api/stock/entry`, { data: { action: "startCut", cutId: "CUT-UI-OTHER-ADMIN" } });
    assert.equal(started.status(), 200);
    await page.evaluate(() => pullStateFromServer());
    await page.locator("#discardPhysicalStockDraftsBtn").waitFor({ state: "visible" });
    assert.match(await page.locator('[data-physical-product="B"]').innerText(), /Borrador de otro corte/);
    assert.equal(await input.count(), 0, "old quantity cannot be submitted to the new cut");
    await page.locator("#discardPhysicalStockDraftsBtn").click();
    await input.waitFor();
    assert.equal(await input.inputValue(), "", "discarding does not copy the old count");
    await input.fill(String(nextQty));
    await page.locator('[data-physical-note="B"]').fill("Prueba visual aislada");
    await page.locator('[data-save-physical-count="B"]').click();
    const adjust = page.locator('[data-adjust-physical-stock="B"]');
    await adjust.waitFor();
    await adjust.click();
    assert.equal(await page.locator("#physicalStockAdjustNext").inputValue(), String(nextQty));
    await page.locator("#physicalStockAdjustPassword").fill(password);
    await page.locator('#physicalStockAdjustForm [type="submit"]').click();
    await page.locator("#physicalStockAdjustDialog").waitFor({ state: "hidden" });
    await page.locator("#startPhysicalStockCountBtn").click();
    await page.waitForFunction(() => document.querySelector("#startPhysicalStockCountBtn")?.textContent === "Iniciar corte de stock");
    assert.deepEqual(errors, []);
  }
  return { check, exerciseUiLifecycle, close: () => browser.close() };
}
module.exports = { open };
