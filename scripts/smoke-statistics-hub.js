"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
let tools;
const nodes = new Map();
const context = vm.createContext({
  byId: (id) => {
    assert.ok(html.includes(`id="${id}"`), `Existing content: ${id}`);
    if (!nodes.has(id)) nodes.set(id, { closest: () => ({}), querySelector: () => ({}) });
    return nodes.get(id);
  },
  renderOperationalWorkspace: (id, element, title, entries) => { assert.equal(id, "estadisticas"); tools = entries; }
});
const start = source.indexOf("function markWorkspacePanel(");
const end = source.indexOf("function renderDashboardWorkspace(", start);
vm.runInContext(source.slice(start, end), context);
context.renderStatisticsWorkspace();
assert.equal(tools.length, 6);
assert.equal(new Set(tools.map((t) => t.id)).size, 6);
for (const tool of tools) {
  assert.ok(fs.existsSync(path.join(root, "icons/tools", `${tool.icon}.svg`)));
  assert.equal(tool.selectors.length, 1);
}
assert.match(source, /if \(!selected\) return;\s*if \(selected === "routes"\)/);
assert.match(source, /operationalWorkspaces.get\("dashboard"\)\?\.selected !== "map"\) return/);
assert.match(source, /if \(button && canUseView\(button.dataset.hubView\)\)/);
console.log("OK: six tools preserve existing panel IDs, local icons, lazy home and permission-aware module links.");
