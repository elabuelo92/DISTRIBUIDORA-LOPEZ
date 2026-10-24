"use strict";
const assert = require("node:assert/strict");
const http = require("node:http");
const { fork } = require("node:child_process");
const { once } = require("node:events");
const { createPolicy } = require("../http-connection-policy");

if (process.argv.includes("--child")) {
  const policy = createPolicy({ DL_HTTP_KEEP_ALIVE_TIMEOUT_MS: 5000 });
  let writes = 0;
  const server = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      if (req.method === "POST") writes++;
      res.setHeader("Keep-Alive", policy.header);
      res.end(JSON.stringify({ writes }));
    });
  });
  server.keepAliveTimeout = process.argv.includes("--baseline") ? 5000 : policy.keepAliveTimeout;
  server.headersTimeout = policy.headersTimeout;
  server.listen(0, "127.0.0.1", () => process.send(server.address().port));
} else {
  (async () => {
    for (const baseline of [true, false]) {
      const child = fork(__filename, ["--child", ...(baseline ? ["--baseline"] : [])], {
        execPath: process.env.DL_TEST_SERVER_NODE || process.execPath, stdio: ["ignore", "ignore", "inherit", "ipc"]
      });
      const exited = once(child, "exit");
      const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
      try {
        const [port] = await once(child, "message");
        function request(method = "GET") {
          return new Promise((resolve, reject) => {
            const req = http.request({ hostname: "127.0.0.1", port, method, agent }, res => {
              let body = "";
              res.on("data", b => { body += b; });
              res.on("end", () => resolve({ ...JSON.parse(body), keepAlive: res.headers["keep-alive"] }));
            });
            req.on("error", reject);
            req.end();
          });
        }
        assert.equal((await request()).keepAlive, "timeout=5");
        // Reproduce a client occupied parsing/rendering while its idle socket expires.
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6200);
        if (baseline) {
          await assert.rejects(request("POST"), error => error.code === "ECONNRESET");
          console.log("PASS reproduced old idle expiry race: ECONNRESET, without a server crash");
        } else {
          assert.equal((await request("POST")).writes, 1);
          await new Promise(resolve => setTimeout(resolve, 10500));
          assert.equal((await request("POST")).writes, 2, "idle reconnect without resubmitting a write");
          console.log("PASS buffered idle expiry: both writes applied once, no retry, expired connection replaced");
        }
      } finally { agent.destroy(); child.kill(); await exited; }
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
