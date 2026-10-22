"use strict";
const assert = require("node:assert/strict");
const { createDurableWriteBatch } = require("../durable-write-batch");

async function main() {
  let disk = null;
  let writes = 0;
  let invalidations = 0;
  let fail = false;
  const responses = [];
  const batch = createDurableWriteBatch({
    delayMs: 10,
    persist: (state) => {
      if (fail) throw new Error("ENOSPC");
      disk = JSON.parse(JSON.stringify(state));
      return ++writes;
    },
    invalidate: () => { invalidations += 1; }
  });
  const state = { sales: [], payments: [], reserved: 10, balance: 1000 };
  const callback = (error, version) => {
    if (!error) assert.ok(disk, "never acknowledge before persistence");
    responses.push({ error: error && error.message, version });
  };
  state.sales.push("sale-1");
  batch.enqueue(state, callback);
  state.payments.push("payment-1");
  batch.enqueue(state, callback);
  assert.equal(responses.length, 0);
  assert.equal(disk, null);
  assert.equal(batch.flush(), 1, "read barrier commits pending changes");
  assert.deepEqual(disk, state);
  assert.equal(responses.length, 2);
  assert.equal(writes, 1);
  assert.equal(batch.metrics.savedWrites, 1);
  batch.flush();
  assert.equal(writes, 1, "repeated flush never writes twice");

  const before = JSON.stringify(disk);
  fail = true;
  state.sales.push("sale-retry");
  batch.enqueue(state, callback);
  batch.enqueue(state, callback);
  assert.throws(() => batch.flush(), /ENOSPC/);
  assert.equal(JSON.stringify(disk), before);
  assert.equal(invalidations, 1);
  assert.ok(responses.slice(-2).every((r) => r.error === "ENOSPC" && r.version === undefined));
  assert.equal(batch.pending, false);
  fail = false;
  const recovered = JSON.parse(before);
  recovered.sales.push("sale-retry");
  batch.enqueue(recovered, callback);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(disk.sales.filter((id) => id === "sale-retry").length, 1);
  assert.equal(disk.reserved, 10);
  assert.equal(disk.balance, 1000);

  const other = { sales: ["different-state"] };
  batch.enqueue(recovered, callback);
  batch.enqueue(other, callback);
  assert.deepEqual(disk, recovered, "different state flushes the prior batch");
  batch.flush();
  assert.deepEqual(disk, other);
  const bounded = createDurableWriteBatch({ persist: () => 42, invalidate: () => {}, maxSize: 2 });
  let acks = 0;
  bounded.enqueue(state, () => { acks += 1; });
  bounded.enqueue(state, () => { acks += 1; });
  assert.equal(acks, 2);
  assert.equal(bounded.pending, false);
  console.log("PASS durable batch: shared commit, no early acknowledgement, read barrier, disk failure, retry, unchanged balances/reserves, bounded queue");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
