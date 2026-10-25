"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const base = "https://lopez.gruporochaapp.com";
const hash = text => crypto.createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
async function main() {
  const healthStart = performance.now();
  const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.version, "8790-190");
  assert.equal(health.ok, true);
  assert.equal(health.maintenance.active, false);
  assert.equal(health.security.integrity.ok, true);
  assert.equal(health.security.license.ok, true);
  const report = { at: new Date().toISOString(), version: health.version, healthMs: Math.round(performance.now() - healthStart),
    maintenance: health.maintenance.active, integrity: health.security.integrity, licenseOk: health.security.license.ok,
    orders: health.orders, products: health.productsCount, routes: health.deliveryRoutes, latestOrder: health.latestOrder,
    stateVersion: health.stateVersion, activeSessions: health.activeSessions, assets: [] };
  for (const file of ["index.html", "app.js", "styles.css", "sw.js", "client-edit.js"]) {
    const result = await fetch(`${base}/${file}?v=8790-190`, { signal: AbortSignal.timeout(30000), cache: "no-store" });
    assert.equal(result.status, 200, file);
    const text = Buffer.from(await result.arrayBuffer()).toString("utf8");
    assert.equal(hash(text), hash(fs.readFileSync(path.join(root, file), "utf8")), file);
    report.assets.push({ file, matchesTestedSource: true, sha256: hash(text) });
  }
  const configResponse = await fetch(`${base}/config.js?v=8790-190`, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  assert.equal(configResponse.status, 200);
  const configText = await configResponse.text();
  const configPrefix = "window.DL_CONNECTION_CONFIG = ";
  const configLine = configText.split("\n")[0].trim();
  assert.ok(configLine.startsWith(configPrefix) && configLine.endsWith(";"));
  const config = JSON.parse(configLine.slice(configPrefix.length, -1));
  assert.equal(config.VERSION, health.version);
  assert.equal(config.API_BASE_URL, health.connection.apiBaseUrl);
  assert.equal(config.API_PORT, health.port);
  assert.equal(config.MAGIC_DNS_HOST, health.connection.magicDnsHost);
  report.runtimeConfig = { matchesHealth: true, version: config.VERSION, apiBaseUrl: config.API_BASE_URL, port: config.API_PORT };
  report.ok = true;
  report.scope = "Read-only health and published assets. No customer saves or session changes.";
  fs.writeFileSync(path.join(root, "docs/P143-production-validation.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
