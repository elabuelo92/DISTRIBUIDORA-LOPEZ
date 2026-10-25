"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
async function check(base, adminCookie, driverCookie, readState, clientId, orderCode) {
  assert.ok(base.startsWith("http://127.0.0.1:"));
  const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const errors = [];
  try {
    async function pageFor(cookie, mobile) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
        permissions: ["geolocation"], geolocation: { latitude: -31.456789, longitude: -64.234567, accuracy: 7 } });
      await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      const split = cookie.indexOf("=");
      await context.addCookies([{ name: cookie.slice(0, split), value: cookie.slice(split + 1), url: base }]);
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      page.on("dialog", dialog => dialog.accept(dialog.type() === "prompt" ? "Prueba GPS" : undefined));
      await page.goto(`${base}/#reparto`);
      const tool = page.locator('#reparto [data-tool-id="gps-corrections"]');
      await tool.waitFor({ timeout: 30000 });
      assert.match(await tool.innerText(), /09/);
      await tool.click();
      return page;
    }
    const admin = await pageFor(adminCookie, false);
    await admin.locator("#deliveryGpsSearch").fill(orderCode);
    await admin.locator("#deliveryGpsClientSelect").selectOption(clientId);
    await admin.locator('[data-delivery-gps-review="mark"]').click();
    await admin.locator("#deliveryGpsCorrections").getByText("Correccion solicitada por Administracion", { exact: true }).waitFor();
    const before = readState();
    const driver = await pageFor(driverCookie, true);
    await driver.locator("#deliveryGpsSearch").fill(clientId);
    await driver.locator("#deliveryGpsClientSelect").selectOption(clientId);
    await driver.locator("[data-delivery-gps-client]").click();
    await driver.locator("[data-delivery-gps-send]").waitFor();
    assert.equal(readState().clients[0].gpsReview.status, "needs_correction", "capture does not persist proposal");
    assert.match(await driver.locator(".delivery-gps-comparison").innerText(), /-31.456789/);
    assert.match(await driver.locator(".delivery-gps-comparison").innerText(), /Precision: 7 m/);
    assert.equal(await driver.locator('.delivery-gps-comparison a[href*="google.com/maps"]').count(), 2);
    await driver.screenshot({ path: path.join(__dirname, "../docs/P144-gps-movil.png") });
    await driver.locator("[data-delivery-gps-send]").click();
    await driver.locator("#deliveryGpsCorrections").getByText("Pendiente de validacion administrativa", { exact: true }).waitFor();
    assert.equal(readState().clients[0].latitud, before.clients[0].latitud);
    await admin.reload();
    await admin.locator('#reparto [data-tool-id="gps-corrections"]').click();
    await admin.locator("#deliveryGpsClientSelect").selectOption(clientId);
    await admin.screenshot({ path: path.join(__dirname, "../docs/P144-gps-validacion.png") });
    await admin.locator('[data-delivery-gps-review="approve"]').click();
    await admin.locator("#deliveryGpsCorrections").getByText("Ubicacion aprobada", { exact: true }).waitFor();
    const after = readState(), client = after.clients[0];
    assert.equal(client.latitud, -31.456789);
    assert.equal(client.longitud, -64.234567);
    assert.equal(client.gpsReview.proposal.username, "reparto1");
    assert.equal(client.gpsReview.resolvedByUsername, "admin1");
    for (const key of ["orders", "archivedOrders", "archivedDeliveryRoutes", "accounts", "products"]) assert.deepEqual(after[key], before[key], key);
    assert.equal(await driver.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "no mobile overflow");
    assert.deepEqual(errors, []);
    console.log("PASS P144 GPS browser: admin and driver access 09, search by order/code, one capture, compare/map, explicit submit, admin approval, historical data intact, mobile screenshot.");
  } finally { await browser.close(); }
}
module.exports = { check };
