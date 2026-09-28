"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const base = process.env.DL_TOOLS_PREVIEW_URL || "http://127.0.0.1:21890";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Solo se prueba en una demo local");
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), "dl-tools-ui-"));

async function login(context, username) {
  const input = { username, password: "VistaPrevia150!", device: { id: `tools-${username}`, label: "Demo herramientas" } };
  let response = await context.request.post(`${base}/api/login`, { data: input });
  if (response.status() === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await context.request.post(`${base}/api/login`, { data: input });
  }
  assert.equal(response.status(), 200, `Login sintetico ${username}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--disable-gpu"] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await login(context, "admin1");
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/#reparto`);
    await page.locator("#reparto .ops-tool-card").first().waitFor();
    assert.equal(await page.locator("#reparto .ops-tool-card").count(), 6);
    assert.equal(await page.locator("#reparto .ops-tool-panel:visible").count(), 0);
    console.log(JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: document.documentElement.scrollHeight }))));
    await page.screenshot({ path: path.join(screenshots, "reparto-desktop.png") });
    for (const tool of ["planning", "deliveries", "routes", "collections", "audit", "settings"]) {
      await page.locator(`#reparto [data-tool-id="${tool}"]`).click();
      assert.equal(await page.locator("#reparto .ops-tool-panel:visible").count(), 1);
      assert.ok(await page.locator(`#ops-reparto-${tool}`).isVisible());
      await page.locator("#reparto .ops-home-button").click();
    }
    await page.locator('#reparto [data-tool-id="planning"]').click();
    await page.locator("#deliveryPlannerSearch").fill("conservar filtro");
    await page.locator("#reparto .ops-home-button").click();
    await page.locator('#reparto [data-tool-id="planning"]').click();
    assert.equal(await page.locator("#deliveryPlannerSearch").inputValue(), "conservar filtro");
    await page.evaluate(() => renderDelivery());
    assert.ok(await page.locator("#ops-reparto-planning").isVisible());
    await page.locator("#reparto .ops-home-button").click();
    await page.locator('#reparto [data-tool-id="routes"]').click();
    await page.locator("#deliveryRouteList [data-delivery-route]").first().click();
    assert.ok(await page.locator("#ops-reparto-deliveries").isVisible());
    await page.evaluate(() => navigateBackInApp());
    assert.ok(await page.locator("#reparto .ops-home").isVisible());
    await page.evaluate(() => switchView("armado"));
    assert.equal(await page.locator("#armado .ops-tool-card").count(), 3);
    await page.evaluate(() => {
      const order = structuredClone(state.orders[0]);
      order.code = "PED-UI-ONLY";
      order.status = ORDER_STATUS.PENDING;
      state.orders.push(order);
      renderAssemblyDepot();
    });
    await page.screenshot({ path: path.join(screenshots, "armado-desktop.png"), fullPage: true });
    await page.locator('#armado [data-tool-id="orders"]').click();
    await page.locator('[data-assembly-select="PED-UI-ONLY"]').check();
    assert.ok(await page.locator("#ops-armado-orders").isVisible());
    await page.locator("#armado .ops-home-button").click();
    await page.locator('#armado [data-tool-id="orders"]').click();
    assert.ok(await page.locator('[data-assembly-select="PED-UI-ONLY"]').isChecked());
    await page.locator("#armado .ops-home-button").click();
    await page.locator('#armado [data-tool-id="control"]').click();
    await page.evaluate(() => renderAssemblyDepot());
    assert.ok(await page.locator("#ops-armado-control").isVisible());
    assert.equal(await page.locator("#armado .ops-tool-panel:visible").count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => switchView("reparto"));
    await page.screenshot({ path: path.join(screenshots, "reparto-mobile.png"), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Inicio sin desborde horizontal");
    await page.locator('#reparto [data-tool-id="planning"]').click();
    await page.screenshot({ path: path.join(screenshots, "planning-mobile.png"), fullPage: true });
    assert.ok(await page.evaluate(() => document.querySelector("#reparto .ops-home-button").getBoundingClientRect().top >= document.querySelector(".mobile-session-bar").getBoundingClientRect().bottom), "Regreso visible debajo del encabezado movil");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Planificacion sin desborde de pagina");
    const driverContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await login(driverContext, "reparto1");
    const driver = await driverContext.newPage();
    driver.on("pageerror", (error) => errors.push(error.message));
    await driver.goto(`${base}/#reparto`);
    await driver.locator("#reparto .ops-tool-card").first().waitFor();
    assert.equal(await driver.locator("#reparto .ops-tool-card").count(), 3);
    assert.equal(await driver.locator('#reparto [data-tool-id="planning"]').count(), 0);
    await driver.locator('#reparto [data-tool-id="settings"]').click();
    assert.equal(await driver.locator(".delivery-settings-panel:visible").count(), 0);
    await driver.locator("#reparto .ops-home-button").click();
    await driver.screenshot({ path: path.join(screenshots, "driver-mobile.png"), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ok: true, adminTools: 6, driverTools: 3, assemblyTools: 3, preservedFilters: true, preservedSelectionOnRefresh: true, screenshots }));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
