"use strict";

const { chromium } = require("playwright");
const fs = require("node:fs");

const baseUrl = process.env.DL_TEST_BASE_URL || "http://127.0.0.1:8790";
const username = process.env.DL_TEST_USER || "";
const password = process.env.DL_TEST_PASSWORD || "";

if (!username || !password) {
  throw new Error("Definir DL_TEST_USER y DL_TEST_PASSWORD para medir Clientes.");
}

(async () => {
  const executablePath = [
    process.env.DL_TEST_BROWSER,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const clientLogs = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) requests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.text().includes("[Performance] Clientes.")) clientLogs.push(message.text());
  });
  await page.addInitScript(() => {
    window.__clientLongTasks = [];
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const observer = new PerformanceObserver((list) => {
          window.__clientLongTasks.push(...list.getEntries().map((entry) => ({
            startTime: entry.startTime,
            duration: entry.duration
          })));
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {}
    }
  });

  await page.goto(`${baseUrl}/index.html#dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator('#loginForm input[name="username"]').fill(username);
  await page.locator("#loginPassword").fill(password);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.locator("#appShell").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(500);
  requests.length = 0;

  const navigationStartedAt = Date.now();
  await page.locator('.nav-item[data-view="clientes"]').click();
  await page.locator("#clientes.active").waitFor({ state: "visible", timeout: 10000 });
  const viewVisibleMs = Date.now() - navigationStartedAt;
  await page.locator("#clientsTable tr").first().waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => {
    const row = document.querySelector("#clientsTable tr");
    return row && !row.classList.contains("clients-loading-row");
  }, null, { timeout: 15000 });
  const firstDataMs = Date.now() - navigationStartedAt;
  const rowCount = await page.locator("#clientsTable tr").count();
  const longTasks = await page.evaluate(() => window.__clientLongTasks || []);
  const clientRequests = requests.filter((url) => url.includes("/api/clients"));
  const stateRequests = requests.filter((url) => url.includes("/api/state"));

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    viewVisibleMs,
    firstDataMs,
    renderedRows: rowCount,
    clientRequests: clientRequests.length,
    stateRequests: stateRequests.length,
    apiRequests: requests.length,
    longTasks: longTasks.filter((entry) => entry.startTime >= 0).slice(-10),
    clientLogs
  }, null, 2));

  await context.close();
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
