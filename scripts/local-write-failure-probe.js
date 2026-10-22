"use strict";
const fs = require("node:fs");
const control = process.env.LOCAL_TEST_WRITE_FAILURE;
if (control) {
  const fail = (stage) => {
    if (fs.existsSync(control) && fs.readFileSync(control, "utf8") === stage) {
      throw Object.assign(new Error(`Isolated test: ${stage} failed`), { code: "ENOSPC" });
    }
  };
  const rename = fs.renameSync;
  fs.renameSync = function (from, to) {
    if (to === process.env.STATE_FILE) fail("rename");
    return rename.apply(this, arguments);
  };
  const fsync = fs.fsyncSync;
  fs.fsyncSync = function () { fail("fsync"); return fsync.apply(this, arguments); };
}
