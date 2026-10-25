"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function check(page, read, requests) {
  const before = JSON.stringify(read());
  const requestStart = requests.length;
  const output = path.join(__dirname, "../docs");
  const stockButton = id => page.locator(`#stock [data-stock-section="${id}"]`);
  const physicalButton = id => page.locator(`#control-stock [data-stock-section="${id}"]`);
  await page.evaluate(() => {
    window.stockNavigationProbe = { builds: 0, original: OrderEngine.buildShortageList };
    OrderEngine.buildShortageList = (...args) => {
      window.stockNavigationProbe.builds++;
      return window.stockNavigationProbe.original(...args);
    };
  });
  try {
    assert.deepEqual(await page.locator("#stock .stock-section-button:visible strong").allTextContents(),
      ["Existencias", "Control fisico", "Abastecimiento"]);
    assert.equal(await page.locator("#stock .ops-home").isVisible(), false, "old menu is not duplicated");
    assert.equal(await page.locator("#supplyPlannerTable").innerHTML(), "");
    await page.screenshot({ path: path.join(output, "STOCK-NAVEGACION-inicio.png"), fullPage: true });
    await stockButton("products").click();
    await page.locator("#stockTable").waitFor();
    await page.locator("#stockProductSearch").fill("Test B");
    await stockButton("physical").focus();
    await page.keyboard.press("Enter");
    await page.locator("#control-stock.active #physicalStockTable").waitFor();
    assert.equal(await physicalButton("physical").getAttribute("aria-pressed"), "true");
    await page.evaluate(() => { window.physicalTableIdentity = document.getElementById("physicalStockTable"); });
    await physicalButton("products").click();
    assert.equal(await page.locator("#stockProductSearch").inputValue(), "Test B", "existing filters survive");
    const stockSelect = page.locator('#stock select[aria-label="Cambiar herramienta"]');
    for (const tool of ["overview", "ledger"]) {
      await stockSelect.selectOption(tool);
      assert.equal(await page.locator(`#ops-stock-${tool}`).isVisible(), true);
      assert.equal(await stockButton("products").getAttribute("aria-pressed"), "true");
    }
    assert.equal(await page.evaluate(() => stockNavigationProbe.builds), 0, "inventory/control do not calculate supply");
    await stockButton("supply").click();
    assert.equal(await page.evaluate(() => stockNavigationProbe.builds), 1);
    await stockButton("products").click();
    await page.locator("#stockProductSearch").fill("Test");
    await stockButton("supply").click();
    const afterQuickSwitch = await page.evaluate(() => stockNavigationProbe.builds);
    await page.waitForTimeout(750);
    assert.equal(await page.evaluate(() => stockNavigationProbe.builds), afterQuickSwitch, "pending search cannot render a different tool");
    await page.locator("#supplyProductFilter").fill("Pending");
    for (let round = 0; round < 3; round++) {
      const builds = await page.evaluate(() => stockNavigationProbe.builds);
      await stockButton("physical").click();
      assert.equal(await page.evaluate(() => document.getElementById("physicalStockTable") === physicalTableIdentity), true,
        "same physical-control module and listeners");
      await physicalButton("products").click();
      assert.equal(await page.evaluate(() => stockNavigationProbe.builds), builds, "no hidden or stale supply render");
      await stockButton("supply").click();
      assert.equal(await page.evaluate(() => stockNavigationProbe.builds), builds + 1, "one render per explicit entry");
      assert.equal(await page.locator("#supplyProductFilter").inputValue(), "Pending");
    }
    await page.locator("#clearSupplyFiltersBtn").click();
    assert.equal(await page.locator("#stock .stock-section-navigation").count(), 1);
    assert.equal(await page.locator("#control-stock .stock-section-navigation").count(), 1);
    const widths = [1440, 768, 390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
      await page.waitForTimeout(80);
      const layout = await page.locator("#stock .stock-section-button:visible").evaluateAll(buttons => buttons.map(button => {
        const r = button.getBoundingClientRect(), text = button.querySelector("strong").getBoundingClientRect();
        const icon = button.querySelector("img");
        return { fits: text.left >= r.left && text.right <= r.right, icon: icon.complete && icon.naturalWidth > 0, width: r.width };
      }));
      assert.equal(layout.length, 3);
      assert.ok(layout.every(item => item.fits && item.icon), `labels and icons at ${width}: ${JSON.stringify(layout)}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `page overflow ${width}`);
      await page.screenshot({ path: path.join(output, `STOCK-NAVEGACION-abastecimiento-${width}.png`), fullPage: true });
    }
    await page.locator("#mobileThemeToggleBtn").click();
    await page.screenshot({ path: path.join(output, "STOCK-NAVEGACION-oscuro.png"), fullPage: true });
    await page.locator("#mobileThemeToggleBtn").click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await stockButton("physical").click();
    await page.screenshot({ path: path.join(output, "STOCK-NAVEGACION-control-fisico.png"), fullPage: true });
    await physicalButton("products").click();
    await page.locator("#stockProductSearch").fill("");
    await page.locator('[data-view="dashboard"]').first().click();
    assert.equal(await page.locator("#dashboard .stock-section-navigation").count(), 0);
    assert.equal(await page.locator("#dashboard .ops-home").isVisible(), true);
    await page.locator('[data-view="stock"]').first().click();
    await page.evaluate(() => {
      const allowed = canUseView;
      window.stockNavigationPermissionOriginal = allowed;
      canUseView = id => id !== "control-stock" && allowed(id);
      renderStockSectionNavigation("stock", operationalWorkspaces.get("stock"));
    });
    assert.equal(await stockButton("physical").isVisible(), false, "unauthorized view hidden");
    await stockButton("physical").evaluate(button => button.click());
    assert.equal(await page.locator("#stock.active").count(), 1, "handler also enforces permission");
    await page.evaluate(() => {
      canUseView = window.stockNavigationPermissionOriginal;
      renderStockSectionNavigation("stock", operationalWorkspaces.get("stock"));
      document.getElementById("supplyPlannerTable").innerHTML = "";
    });
    assert.equal(JSON.stringify(read()), before, "navigation preserves complete stored state");
    assert.deepEqual(requests.slice(requestStart).filter(r => r.method !== "GET" && r.path !== "/api/presence/heartbeat"), [],
      "navigation never writes business data");
    const report = { at: new Date().toISOString(), passed: true, productionAccess: false, widths,
      checks: ["three-accesses", "same-physical-module", "keyboard", "preserved-filters", "secondary-reports", "permissions",
        "single-render", "lazy-supply", "unchanged-data", "no-business-posts", "desktop-mobile-icons-labels", "dark-mode", "other-module-unchanged"] };
    fs.writeFileSync(path.join(output, "STOCK-NAVEGACION-results.json"), JSON.stringify(report, null, 2));
    console.log("PASS stock navigation: " + JSON.stringify(report));
  } finally {
    await page.evaluate(() => {
      OrderEngine.buildShortageList = window.stockNavigationProbe.original;
      if (window.stockNavigationPermissionOriginal) canUseView = window.stockNavigationPermissionOriginal;
    });
  }
}
module.exports = { check };
