"use strict";
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const version = process.argv[2], reportName = process.argv[3];
assert.match(version || "", /^8790-\d+$/);
assert.match(reportName || "", /^[A-Za-z0-9-]+\.json$/);
const root = path.resolve(__dirname, ".."), base = "https://lopez.gruporochaapp.com";
const hash = text => crypto.createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
async function main() {
  const get = url => fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30000) });
  const response = await get(`${base}/api/health`);
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.version, version);
  assert.equal(health.ok, true);
  assert.equal(health.maintenance.active, false);
  assert.equal(health.security.integrity.ok, true);
  assert.equal(health.security.license.ok, true);
  const report = { at: new Date().toISOString(), version, maintenance: false, integrity: health.security.integrity,
    orders: health.orders, products: health.productsCount, routes: health.deliveryRoutes,
    stateVersion: health.stateVersion, activeSessions: health.activeSessions, assets: [] };
  for (const file of ["index.html", "app.js", "styles.css", "sw.js", "client-edit.js", "collection-corrections-ui.js"]) {
    const response = await get(`${base}/${file}?v=${version}`);
    assert.equal(response.status, 200, file);
    const content = Buffer.from(await response.arrayBuffer()).toString("utf8");
    assert.equal(hash(content), hash(fs.readFileSync(path.join(root, file), "utf8")), file);
    report.assets.push({ file, matchesTestedSource: true, sha256: hash(content) });
  }
  const configResponse = await get(`${base}/config.js?v=${version}`);
  assert.equal(configResponse.status, 200);
  const line = (await configResponse.text()).split("\n")[0].trim(), prefix = "window.DL_CONNECTION_CONFIG = ";
  assert.ok(line.startsWith(prefix) && line.endsWith(";"));
  const config = JSON.parse(line.slice(prefix.length, -1));
  assert.equal(config.VERSION, version);
  assert.equal(config.API_BASE_URL, health.connection.apiBaseUrl);
  report.runtimeConfigMatches = true;
  report.ok = true;
  report.scope = "Read-only health/assets. No login, customer or financial operations.";
  fs.writeFileSync(path.join(root, "docs", reportName), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
