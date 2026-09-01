"use strict";

const assert = require("node:assert/strict");
const progressive = require("../progressive-list");

assert.equal(progressive.collapsedVisible(3), 3);
assert.equal(progressive.collapsedVisible(60), 6);
assert.equal(progressive.nextVisible(6, 60), 16);
assert.equal(progressive.nextVisible(16, 60), 26);
assert.equal(progressive.nextVisible(56, 60), 60);
assert.equal(progressive.nextVisible(6, 8), 8);

console.log(JSON.stringify({
  ok: true,
  version: "8790-124",
  initial: progressive.INITIAL_COUNT,
  blockSize: progressive.BLOCK_SIZE,
  sequence: [6, 16, 26, 36, 46, 56, 60]
}, null, 2));
