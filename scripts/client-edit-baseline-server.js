"use strict";
// Execute the committed server with the same dependencies and isolated DATA_DIR.
const path = require("node:path");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
if (process.env.DL_HOST !== "127.0.0.1" || !process.env.P143_PROBE_FILE) throw new Error("Isolated baseline only");
const root = path.resolve(__dirname, "..");
const filename = path.join(root, "server.js");
const source = execFileSync("git", ["show", "b19b5c1:server.js"], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const baseline = new Module(filename, module);
baseline.filename = filename;
baseline.paths = Module._nodeModulePaths(root);
baseline._compile(source, filename);
