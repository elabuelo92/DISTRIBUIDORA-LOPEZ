"use strict";

// Only synchronous mutations of the same in-memory state may share a commit.
function createDurableWriteBatch({ persist, invalidate, delayMs = 8, maxSize = 16 }) {
  let pending = null;
  let timer = null;
  let flushing = false;
  const metrics = { operations: 0, commits: 0, savedWrites: 0, failures: 0, maxBatch: 0 };

  function flush() {
    if (!pending || flushing) return;
    const batch = pending;
    pending = null;
    clearTimeout(timer);
    timer = null;
    flushing = true;
    let version;
    let failure;
    try {
      version = persist(batch.state);
      metrics.commits += 1;
      metrics.savedWrites += batch.callbacks.length - 1;
      metrics.maxBatch = Math.max(metrics.maxBatch, batch.callbacks.length);
    } catch (error) {
      failure = error;
      metrics.failures += 1;
      invalidate();
    } finally {
      flushing = false;
    }
    for (const callback of batch.callbacks) callback(failure, version);
    if (failure) throw failure;
    return version;
  }

  function enqueue(state, callback) {
    if (pending && pending.state !== state) flush();
    if (!pending) {
      pending = { state, callbacks: [] };
      timer = setTimeout(() => { try { flush(); } catch {} }, delayMs);
    }
    pending.callbacks.push(callback);
    metrics.operations += 1;
    if (pending.callbacks.length >= maxSize) {
      // Failure was already delivered to every queued request.
      try { flush(); } catch {}
    }
  }

  return { enqueue, flush, get pending() { return Boolean(pending); }, metrics };
}

module.exports = { createDurableWriteBatch };
