"use strict";

function createPolicy(env = process.env) {
  const seconds = Math.max(5, Math.floor((Number(env.DL_HTTP_KEEP_ALIVE_TIMEOUT_MS) || 10000) / 1000));
  // Node 18 has no keepAliveTimeoutBuffer. Allow the peer to retire a socket
  // before the server closes it, even while either event loop is busy.
  const keepAliveTimeout = seconds * 1000 + 5000;
  return {
    header: `timeout=${seconds}`,
    keepAliveTimeout,
    headersTimeout: Math.max(keepAliveTimeout + 1000, Number(env.DL_HTTP_HEADERS_TIMEOUT_MS) || 15000)
  };
}
module.exports = { createPolicy };
