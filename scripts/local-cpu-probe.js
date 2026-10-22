"use strict";
const inspector = require("node:inspector");
const fs = require("node:fs");
if (process.env.LOCAL_TEST_CPU_FILE) {
  const session = new inspector.Session();
  session.connect();
  session.post("Profiler.enable", () => session.post("Profiler.start"));
  setTimeout(() => session.post("Profiler.stop", (error, result) => {
    if (!error) fs.writeFileSync(process.env.LOCAL_TEST_CPU_FILE, JSON.stringify(result.profile));
    session.disconnect();
  }), 60000).unref();
}
