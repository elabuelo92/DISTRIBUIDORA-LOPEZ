"use strict";
// Loaded only by the isolated test child, never by the production entrypoint.
const fs = require("node:fs");
const output = process.env.LOCAL_TEST_MEMORY_FILE;
if (output) {
  const sample = () => fs.appendFileSync(output, JSON.stringify({ at: Date.now(), ...process.memoryUsage(), maxRSSKiB: process.resourceUsage().maxRSS }) + "\n");
  sample();
  setInterval(sample, 250).unref();
}
