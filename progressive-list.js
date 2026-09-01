(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ProgressiveList = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const INITIAL_COUNT = 6;
  const BLOCK_SIZE = 10;

  function collapsedVisible(total, initial = INITIAL_COUNT) {
    return Math.min(Math.max(0, Number(total) || 0), Math.max(1, Number(initial) || INITIAL_COUNT));
  }

  function nextVisible(current, total, blockSize = BLOCK_SIZE) {
    const safeTotal = Math.max(0, Number(total) || 0);
    const safeCurrent = Math.max(0, Number(current) || 0);
    const safeBlock = Math.max(1, Number(blockSize) || BLOCK_SIZE);
    return Math.min(safeTotal, safeCurrent + safeBlock);
  }

  return { INITIAL_COUNT, BLOCK_SIZE, collapsedVisible, nextVisible };
});
