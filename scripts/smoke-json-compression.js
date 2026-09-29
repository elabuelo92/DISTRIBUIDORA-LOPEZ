const fs = require("node:fs");
const vm = require("node:vm");
const zlib = require("node:zlib");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
const start = source.indexOf("function sendJsonBuffer(");
const end = source.indexOf("function sendJson(", start);
const ctx = vm.createContext({ zlib });
vm.runInContext(source.slice(start, end), ctx);
const payload = Buffer.from(JSON.stringify({ data: crypto.randomBytes(600000).toString("base64") }));
function send(encoding, prepared) {
  return new Promise(resolve => {
    let headers;
    ctx.sendJsonBuffer({ _acceptEncoding: encoding, writeHead(status, value) { headers = value; },
      end(body) { resolve({ body, headers }); } }, 200, payload, null, prepared);
  });
}
async function main() {
  const prepared = { gzip: null, gzipWaiters: null };
  const first = send("gzip", prepared);
  const second = send("gzip", prepared);
  for (const result of await Promise.all([first, second, send("deflate"), send("identity")])) {
    const encoding = result.headers["Content-Encoding"];
    const decoded = encoding === "gzip" ? zlib.gunzipSync(result.body) : encoding === "deflate" ? zlib.inflateSync(result.body) : result.body;
    assert.deepEqual(decoded, payload);
    assert.equal(result.headers["Content-Length"], result.body.length);
  }
  assert(prepared.gzip);
  assert.equal(prepared.gzipWaiters, null);
  assert.deepEqual((await send("gzip", prepared)).body, prepared.gzip);
  console.log("PASS: gzip/deflate/identity, shared compression, cache and exact decoded bytes");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
