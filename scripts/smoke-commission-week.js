"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(require("node:path").join(__dirname, "../app.js"), "utf8");
const start = source.indexOf("function commissionWeekRange(");
const end = source.indexOf("function setCommissionWeek(", start);
const context = vm.createContext({});
vm.runInContext(source.slice(start, end), context);
for (const [day, offset, from, to] of [
  ["2026-09-28", 0, "2026-09-28", "2026-10-04"],
  ["2026-09-28", -1, "2026-09-21", "2026-09-27"],
  ["2026-10-04", 0, "2026-09-28", "2026-10-04"],
  ["2027-01-01", 0, "2026-12-28", "2027-01-03"]
]) {
  const result = context.commissionWeekRange(offset, day);
  assert.equal(result.from, from); assert.equal(result.to, to);
}
console.log("OK: Monday-Sunday commission ranges, previous week, month/year boundaries.");
