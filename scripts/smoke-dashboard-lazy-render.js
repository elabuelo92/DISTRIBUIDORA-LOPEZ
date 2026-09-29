"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const start = source.indexOf("function renderDashboardView()");
const end = source.indexOf("function renderActiveView(", start);
let selected = "";
let calls = [];
let builds = 0;
const shared = {};
const context = {
  operationalWorkspaces: new Map([["dashboard", { get selected() { return selected; } }]]),
  renderDashboardWorkspace() {}, renderVersionStatus() {}, renderThemeControls() {},
  buildOperationalDashboard() { builds++; return shared; }
};
for (const name of ["renderMetrics", "renderDashboardInsights", "renderFlow", "renderAlerts", "renderActivity", "renderCommissions", "renderDashboardPresence", "renderDashboardDailyRoutes"]) {
  context[name] = (data) => {
    calls.push(name);
    if (selected === "operation") assert.equal(data, shared, "Reuse the same summary within this render only");
  };
}
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const cases = {
  "": ["renderMetrics"], operation: ["renderDashboardInsights", "renderFlow"],
  alerts: ["renderAlerts"], activity: ["renderActivity"], commissions: ["renderCommissions"],
  map: ["renderDashboardPresence"], journeys: ["renderDashboardDailyRoutes"]
};
for (const [tool, expected] of Object.entries(cases)) {
  selected = tool; calls = []; builds = 0;
  context.renderDashboardView();
  assert.deepEqual(calls, expected);
  assert.equal(builds, tool === "operation" ? 1 : 0);
  if (tool === "operation") {
    context.renderDashboardView();
    assert.equal(builds, 2, "Next render must recalculate; no stale cache");
  }
}
assert.match(source, /if \(focus && moduleId === "dashboard"\) \{[\s\S]*?renderDashboardView\(\);/);
console.log("OK: home and six tools render only visible content; operation shares one fresh summary; opening a tool renders it immediately.");
