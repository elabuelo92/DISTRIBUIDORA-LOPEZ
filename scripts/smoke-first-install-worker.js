"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const start = source.indexOf('if ("serviceWorker" in navigator) {');
const end = source.indexOf("async function pullStateFromServer", start);
async function verify(initialController) {
  const events = {}, workerEvents = {};
  let reloads = 0;
  const worker = {
    controller: initialController,
    addEventListener: (event, handler) => { workerEvents[event] = handler; },
    register: async () => ({ update: async () => {}, addEventListener() {}, waiting: null })
  };
  vm.runInNewContext(source.slice(start, end), {
    APP_VERSION: "8790-186", navigator: { serviceWorker: worker },
    window: { addEventListener: (event, handler) => { events[event] = handler; }, location: { reload: () => reloads++ } }
  });
  events.load();
  worker.controller = {};
  workerEvents.controllerchange();
  assert.equal(reloads, initialController ? 1 : 0);
  workerEvents.controllerchange();
  workerEvents.controllerchange();
  assert.equal(reloads, 1, "real controller replacement reloads at most once");
  await Promise.resolve();
}
(async () => {
  await verify(null);
  await verify({});
  console.log("PASS first install preserves bootstrap; existing worker updates reload once");
})().catch(error => { console.error(error); process.exitCode = 1; });
