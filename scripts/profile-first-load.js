"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const inspector = require("node:inspector");
const { performance } = require("node:perf_hooks");
const session = new inspector.Session();
session.connect();
const post = (method) => new Promise((resolve, reject) => session.post(method, (error, value) => error ? reject(error) : resolve(value)));

(async () => {
  const source = fs.readFileSync(process.argv[2]);
  const digest = crypto.createHash("sha256").update(source).digest("hex");
  const state = JSON.parse(source).state;
  const times = {};
  await post("Profiler.enable");
  await post("Profiler.start");
  for (const name of ["order", "delivery", "account", "event", "legal"]) {
    const engine = require(`../${name}-engine`);
    const start = performance.now();
    engine.migrateState(state);
    times[name] = Math.round(performance.now() - start);
  }
  const store = require("../state-record-sync").createStore({
    hash: value => crypto.createHash("sha256").update(value).digest("hex"),
    token: () => crypto.randomBytes(24).toString("hex")
  });
  const start = performance.now();
  const response = store.response(state, 1, "admin");
  times.fingerprints = Math.round(performance.now() - start);
  const serializedAt = performance.now();
  const wire = Buffer.from(JSON.stringify(response));
  times.serialize = Math.round(performance.now() - serializedAt);
  const { profile } = await post("Profiler.stop");
  session.disconnect();
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const totals = new Map();
  profile.samples.forEach((id, index) => totals.set(id, (totals.get(id) || 0) + profile.timeDeltas[index]));
  const top = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([id, time]) => ({
    function: nodes.get(id).callFrame.functionName,
    file: nodes.get(id).callFrame.url.split("/").pop(),
    line: nodes.get(id).callFrame.lineNumber + 1,
    ms: Math.round(time / 1000)
  }));
  if (digest !== crypto.createHash("sha256").update(fs.readFileSync(process.argv[2])).digest("hex")) throw new Error("Source changed");
  console.log(JSON.stringify({ times, bytes: wire.length, sourceUnchanged: true, top }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
