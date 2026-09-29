"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const inspector = require("node:inspector");
const dataDir = path.resolve(process.env.DATA_DIR || ".");
if (path.dirname(dataDir) !== path.resolve(os.tmpdir()) || !path.basename(dataDir).startsWith("dl-operational-sim-")) {
  throw new Error("CPU profiling is restricted to the isolated operational fixture");
}
const session = new inspector.Session();
session.connect();
session.post("Profiler.enable", () => session.post("Profiler.start"));
process.on("message", message => {
  if (message !== "finish-profile") return;
  session.post("Profiler.stop", (error, result) => {
    if (!error) {
      const target = path.join(__dirname, "..", ".tmp-sync-profile", "cpu.cpuprofile");
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(result.profile));
    }
    session.disconnect();
    if (process.send) process.send({ profileDone: true, error: error ? String(error) : "" });
  });
});
