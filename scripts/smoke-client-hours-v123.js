"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const hours = require("../client-hours");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const schedule = hours.normalize([
  { day: "Lunes", ranges: [{ from: "08:00", to: "12:30" }, { from: "15:30", to: "19:00" }] },
  { day: "Martes", ranges: [{ from: "08:00", to: "12:30" }] },
  { day: "Invalido", ranges: [{ from: "20:00", to: "10:00" }] }
]);

assert.equal(schedule.length, 2);
assert.equal(schedule[0].ranges.length, 2);
assert.equal(hours.summary(schedule), "Lun 08:00-12:30 / 15:30-19:00; Mar 08:00-12:30");
assert.equal(hours.summary([], "8-14 / 16-22"), "8-14 / 16-22", "conserva el texto historico");
assert.equal(hours.summary([], ""), "", "un cliente historico puede continuar sin horario");
assert.equal(hours.today(schedule, new Date("2026-08-31T12:00:00-03:00")), "08:00-12:30 / 15:30-19:00");
assert.throws(() => hours.assertValid([{ day: "Lunes", ranges: [{ from: "08:00", to: "" }] }]), /completar desde y hasta/);
assert.throws(() => hours.assertValid([{ day: "Martes", ranges: [{ from: "14:00", to: "12:00" }] }]), /hora desde debe ser anterior/);
assert.match(indexSource, /Franjas horarias para visitar/);
assert.match(indexSource, /id="mobileClientMorningFrom" type="time"/);
assert.match(indexSource, /id="mobileClientAfternoonTo" type="time"/);
assert.match(appSource, /function readMobileClientVisitHours\(visitDay\)/);
assert.match(appSource, /const hours = readMobileClientVisitHours\(visitDay\);/);
assert.doesNotMatch(indexSource, /id="mobileClientHoursGrid"/);

console.log(JSON.stringify({ ok: true, version: "8790-127", days: schedule.length, rangesMonday: schedule[0].ranges.length, summary: hours.summary(schedule), legacyCompatible: true, mobileCompactRanges: true }, null, 2));
