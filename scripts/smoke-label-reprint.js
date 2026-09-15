const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "order-engine.js"), "utf8");

function sourceFunction(name) {
  const match = app.match(new RegExp(`function ${name}\\([^]*?\\n\\}`, "m"));
  assert.ok(match, `${name} existe`);
  return match[0];
}

const printed = [];
const alerts = [];
const context = {
  state: { orders: [] },
  canOperateAssembly: () => true,
  orderAssemblyInfo: (order) => ({
    generated: Boolean(order?.assembly?.label?.generated),
    printed: Boolean(order?.assembly?.label?.printed),
    bultos: Number(order?.assembly?.bultosConfirmed || 0),
    packageLabels: order?.assembly?.label?.packageLabels || []
  }),
  printOrderLabel: (order) => printed.push(order.code),
  window: { alert: (message) => alerts.push(message) }
};
vm.createContext(context);
vm.runInContext(`${sourceFunction("canReprintOrderLabel")}\n${sourceFunction("reprintOrderLabel")}`, context);

const order = {
  code: "PED-2363",
  assembly: {
    bultosConfirmed: 2,
    label: {
      generated: true,
      printed: true,
      packageLabels: [{ scanCode: "PED2363B1" }, { scanCode: "PED2363B2" }]
    }
  }
};
context.state.orders = [order];
assert.equal(context.canReprintOrderLabel(order), true);
context.reprintOrderLabel(order.code);
context.reprintOrderLabel(order.code);
context.reprintOrderLabel(order.code);
assert.deepEqual(printed, [order.code, order.code, order.code]);
assert.deepEqual(alerts, []);

order.assembly.label.printed = false;
assert.equal(context.canReprintOrderLabel(order), true);
context.reprintOrderLabel(order.code);
assert.deepEqual(printed, [order.code, order.code, order.code, order.code]);
assert.equal(alerts.length, 0);

order.assembly.label.printed = true;
order.assembly.label.packageLabels.pop();
context.reprintOrderLabel(order.code);
assert.deepEqual(printed, [order.code, order.code, order.code, order.code]);
assert.equal(alerts.length, 1);

order.assembly.label.packageLabels = [];
context.reprintOrderLabel(order.code);
assert.deepEqual(printed, [order.code, order.code, order.code, order.code, order.code]);
assert.equal(alerts.length, 1);

assert.match(html, /id="orderLabelReprintBtn" type="button" hidden>Reimprimir/);
assert.match(html, /id="orderLabelVerifyBtn" type="button" hidden>Verificar etiqueta/);
assert.match(app, /data-order-reprint=/);
assert.match(app, /orderLabelReprintBtn"\)\.hidden = !canReprintOrderLabel\(order\)/);
assert.match(app, /\.generated \? "Imprimir etiqueta" : "Generar e imprimir"/);
assert.doesNotMatch(sourceFunction("reprintOrderLabel"), /fetch|postOperationalAction|saveState|generateOrderLabel/);
assert.match(app, /postOperationalAction\(`api\/orders\/\$\{encodeURIComponent\(orderLabelTargetCode\)\}\/label`, input, \{ timeoutMs: 60000 \}\)/);
assert.match(app, /checkSavedOrderLabel\(orderLabelTargetCode, input\.operationId, 3\)/);
assert.match(server, /orderLabelStatusMatch && req\.method === "GET"/);
assert.match(server, /idempotentReplay: true, order: existingOrder/);
assert.match(server, /code: "LABEL_ALREADY_GENERATED"/);
assert.match(engine, /operationId: String\(input\.operationId \|\| ""\)\.trim\(\)/);

console.log("OK: reimpresion ilimitada sin API; generacion con verificacion e idempotencia.");
