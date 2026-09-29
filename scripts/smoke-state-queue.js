const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
const start = source.indexOf("function activateFullStateResponse(");
const end = source.indexOf("function requestMetricPath(", start);
assert(start >= 0 && end > start);
const context = vm.createContext({ fullStateResponsesInFlight: 0, fullStateResponsesRejected: 0,
  pendingStateResponses: [], MAX_FULL_STATE_RESPONSES: 1, MAX_PENDING_STATE_RESPONSES: 2,
  STATE_RESPONSE_QUEUE_TIMEOUT_MS: 30, setTimeout, clearTimeout });
vm.runInContext(source.slice(start, end), context);
function response() { return Object.assign(new EventEmitter(), { destroyed: false, writableEnded: false }); }
async function main() {
  const first = response(), second = response(), third = response();
  assert.equal(await context.reserveFullStateResponse(first), true);
  const waiting = context.reserveFullStateResponse(second);
  const canceled = context.reserveFullStateResponse(third);
  assert.equal(await context.reserveFullStateResponse(response()), false, "Bounded queue");
  third.destroyed = true;
  third.emit("close");
  assert.equal(await canceled, false);
  first.emit("finish");
  assert.equal(await waiting, true);
  first.emit("close");
  assert.equal(context.fullStateResponsesInFlight, 1, "Release exactly once");
  assert.equal(await context.reserveFullStateResponse(response()), false, "Queue timeout");
  second.emit("close");
  assert.equal(context.fullStateResponsesInFlight, 0);
  assert.equal(context.pendingStateResponses.length, 0);
  assert.equal(context.fullStateResponsesRejected, 2);
  const closed = response(); closed.destroyed = true;
  assert.equal(await context.reserveFullStateResponse(closed), false);
  console.log("PASS: FIFO admission, bounded queue, disconnect, timeout, exact release and cleanup");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
