"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

async function check(base, users, expectedOrders) {
  assert.ok(base.startsWith("http://127.0.0.1:"), "Isolated local server only");
  const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(fs.existsSync);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    return await Promise.all(users.map(async user => {
      const context = await browser.newContext({ viewport: user.role === "admin" ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });
      await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      const separator = user.cookie.indexOf("=");
      await context.addCookies([{ name: user.cookie.slice(0, separator), value: user.cookie.slice(separator + 1), url: base }]);
      const page = await context.newPage();
      const errors = [];
      const syncResponses = [];
      let navigations = 0;
      page.on("request", request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations++; });
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", async response => {
        if (!response.url().includes("/api/state?")) return;
        try {
          const data = await response.json();
          syncResponses.push({ status: response.status(), partial: data.partial, unchanged: data.unchanged,
            version: data.version, cursorPresent: Boolean(data.cursor || response.headers()["x-state-cursor"]) });
        } catch {}
      });
      const start = Date.now();
      const view = user.role === "admin" ? "dashboard" : user.role === "seller" ? "preventa" : "reparto";
      await page.goto(`${base}/#${view}`);
      await page.waitForFunction(() => typeof syncReady !== "undefined" && syncReady && syncVersion > 0, null, { timeout: 60000 });
      try {
        await page.waitForFunction(() => syncRecordCursor && syncRecordVersion > 0 && !syncPullInFlight, null, { timeout: 60000 });
      } catch (error) {
        console.error(JSON.stringify({ role: user.role, syncResponses, diagnostics: await page.evaluate(() => ({ syncReady, syncVersion, syncRecordVersion, sellerCatalogVersion, syncPullInFlight, orders: state.orders.length })) }));
        throw error;
      }
      await page.locator(`#${view}.active`).waitFor();
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      const loadedMs = Date.now() - start;
      const observed = await page.evaluate(() => ({
        username: currentUser.username, orders: state.orders.length, accounts: state.accounts.length,
        ownOrdersOnly: state.orders.every(order => order.sellerUsername === currentUser.username || order.seller === currentUser.name),
        ownRoutesOnly: (state.deliveryRoutes || []).every(route => route.driverUser === currentUser.username),
        cursor: Boolean(syncRecordCursor), version: syncVersion
      }));
      assert.equal(observed.username, user.username);
      assert.ok(observed.cursor, "Initial cursor installed in actual browser");
      if (user.role === "admin") assert.equal(observed.orders, expectedOrders);
      if (user.role === "seller") { assert.ok(observed.ownOrdersOnly); assert.equal(observed.accounts, 0); }
      if (user.role === "driver") assert.ok(observed.ownRoutesOnly);
      if (process.env.DL_TEST_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.DL_TEST_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.DL_TEST_SCREENSHOT_DIR, `first-load-${user.role}.png`) });
      }
      assert.deepEqual(errors, []);
      assert.equal(navigations, 1, "new service worker must not reload the first page");
      await context.close();
      return { role: user.role, loadedMs, orders: observed.orders, navigations, noPageErrors: true, cursorInstalled: true };
    }));
  } finally { await browser.close(); }
}
module.exports = { check };
