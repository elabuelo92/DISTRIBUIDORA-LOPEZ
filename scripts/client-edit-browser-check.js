"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
module.exports = async function ({ base, password, admin, read }) {
  const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const checks = [];
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 },
        isMobile: mobile, hasTouch: mobile });
      await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      const [name, value] = admin.split("=");
      await context.addCookies([{ name, value, url: base }]);
      const page = await context.newPage();
      const errors = []; page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400 && !(r.status() === 401 && r.url().endsWith("/clients/C0/edit"))) errors.push(`HTTP ${r.status()} ${r.url()}`); });
      const requests = []; page.on("request", r => { if (r.url().includes("/api/")) requests.push({ url: r.url(), method: r.method(), body: r.postDataJSON() }); });
      page.on("dialog", d => d.accept());
      await page.goto(`${base}/#clientes`);
      await page.locator('#appShell').waitFor({ state: "visible", timeout: 20000 }).catch(async error => {
        await page.screenshot({ path: path.join(__dirname, "../docs/P143-browser-failure.png") });
        throw new Error(`${error.message}\n${errors.join("\n")}\n${(await page.locator("body").innerText()).slice(0, 3000)}`);
      });
      await page.locator('[data-client-edit="C0"]').waitFor({ timeout: 30000 }).catch(async error => {
        await page.screenshot({ path: path.join(__dirname, "../docs/P143-browser-failure.png") });
        throw new Error(`${error.message}\n${errors.join("\n")}\n${(await page.locator("body").innerText()).slice(0, 2200)}`);
      });
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-client-edit="C0"]').click();
      assert.equal(await page.locator('#clientForm input[type="password"]').count(), 0);
      assert.equal(await page.locator('#clientContactEmail').getAttribute("autocomplete"), "section-customer email");
      const original = read().clients.find(c => c.codigo_cliente === "C0");
      await page.locator('#clientForm [name="telefono"]').fill(mobile ? "351123456" : "351654321");
      await page.locator('#clientChangeMotive').fill("Prueba visual aislada");
      // Autofill-equivalent corruption is refused before reaching the API.
      await page.locator('#clientContactEmail').fill("Admin2");
      await page.locator('#clientSubmitBtn').click();
      assert.equal(await page.locator('#clientAuthorizationDialog').isVisible(), false);
      await page.locator('#clientContactEmail').fill(original.email || "");
      await page.locator('#clientSubmitBtn').click();
      await page.locator('#clientAdminPassword').fill("wrong");
      await page.locator('#clientAuthorizeSubmit').click();
      await page.locator('#clientAuthorizationError').filter({ hasText: "incorrecta" }).waitFor();
      assert.equal(await page.locator('#clientDialog').isVisible(), true);
      await page.locator('#clientAdminPassword').fill(password);
      requests.length = 0;
      const start = Date.now();
      const response = page.waitForResponse(r => r.url().includes("/clients/C0/edit") && r.status() === 200);
      await page.locator('#clientAuthorizeSubmit').click();
      await response;
      await page.locator('#clientDialog').waitFor({ state: "hidden" });
      const elapsedMs = Date.now() - start;
      await page.waitForTimeout(350);
      const edits = requests.filter(r => r.url.includes("/clients/C0/edit"));
      assert.equal(edits.length, 1);
      assert.deepEqual(Object.keys(edits[0].body.patch), ["telefono"]);
      assert.equal(requests.filter(r => r.url.includes("/api/clients?")).length, 0, "no forced list request after save");
      const after = read().clients.find(c => c.codigo_cliente === "C0");
      assert.deepEqual(after.gps, original.gps);
      assert.equal(after.email, original.email);
      assert.equal(after.balance, original.balance);
      assert.equal(await page.locator('#clientAdminPassword').inputValue(), "");
      assert.ok(await page.locator('[data-client-edit="C0"]').locator("xpath=../..").textContent().then(t => t.includes(after.telefono)));
      await page.locator('[data-client-edit="C0"]').click();
      await page.screenshot({ path: path.join(__dirname, `../docs/P143-cliente-${mobile ? "movil" : "desktop"}.png`) });
      await page.locator('#clientForm [name="telefono"]').fill("351999999");
      await page.locator('#clientChangeMotive').fill("Vista de autorizacion");
      await page.locator('#clientSubmitBtn').click();
      await page.screenshot({ path: path.join(__dirname, `../docs/P143-autorizacion-${mobile ? "movil" : "desktop"}.png`) });
      assert.equal(errors.length, 0, errors.join("\n"));
      checks.push(`${mobile ? "Android viewport emulation" : "Desktop Chromium"}: isolated auth form, invalid autofill rejected, retry preserves data, phone-only PATCH, no list reload, ${elapsedMs}ms UI save`);
      await context.close();
    }
  } finally { await browser.close(); }
  return checks;
};
