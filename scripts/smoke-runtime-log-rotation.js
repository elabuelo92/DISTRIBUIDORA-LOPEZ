"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-log-rotation-"));
const script = path.join(__dirname, "rotate-runtime-logs.js");

try {
  fs.writeFileSync(path.join(tempDir, "session-audit.log"), "a".repeat(2 * 1024 * 1024));
  fs.writeFileSync(path.join(tempDir, "gps-history.log"), "b".repeat(2 * 1024 * 1024));
  fs.writeFileSync(path.join(tempDir, "global-audit.log"), "c".repeat(2 * 1024 * 1024));
  const dry = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, DATA_DIR: tempDir, DL_LOG_ROTATE_BYTES: "1024" }
  });
  assert.equal(dry.status, 0, dry.stderr);
  const dryResult = JSON.parse(dry.stdout);
  assert.deepEqual(dryResult.results.map((entry) => entry.action), ["would-rotate", "would-rotate", "would-rotate"]);
  assert.equal(fs.readdirSync(tempDir).length, 3);

  const applied = spawnSync(process.execPath, [script, "--apply"], {
    encoding: "utf8",
    env: { ...process.env, DATA_DIR: tempDir, DL_LOG_ROTATE_BYTES: "1024" }
  });
  assert.equal(applied.status, 0, applied.stderr);
  const result = JSON.parse(applied.stdout);
  assert.deepEqual(result.results.map((entry) => entry.action), ["rotated", "rotated", "rotated"]);
  assert.equal(fs.statSync(path.join(tempDir, "session-audit.log")).size, 0);
  assert.equal(fs.statSync(path.join(tempDir, "gps-history.log")).size, 0);
  assert.equal(fs.statSync(path.join(tempDir, "global-audit.log")).size, 0);
  assert.equal(fs.readdirSync(tempDir).filter((name) => name.startsWith("session-audit.log.")).length, 1);
  assert.equal(fs.readdirSync(tempDir).filter((name) => name.startsWith("gps-history.log.")).length, 1);
  assert.equal(fs.readdirSync(tempDir).filter((name) => name.startsWith("global-audit.log.")).length, 1);
  console.log(JSON.stringify({ ok: true, historicalFilesPreserved: true, activeLogsRecreated: true }));
} finally {
  if (path.dirname(tempDir) !== tempRoot || !path.basename(tempDir).startsWith("dl-log-rotation-")) {
    throw new Error(`Ruta temporal inesperada: ${tempDir}`);
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
}
