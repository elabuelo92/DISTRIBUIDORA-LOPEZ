"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
assert.match(app, /byId\("clientDialog"\)\.addEventListener\("cancel", event => \{\s*if \(byId\("clientForm"\)\.dataset\.saving === "true"\) event\.preventDefault\(\);/);
function extract(source, name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
const normalizeSearchText = value => String(value || "").trim().toLowerCase();
const selected = { codigo_cliente: "123", id: "internal-123", name: "Cliente paginado" };
const records = [{ codigo_cliente: "OTHER", name: "123" }, selected,
  { codigo_cliente: "A", name: "Duplicado" }, { codigo_cliente: "B", name: "Duplicado" }];
const ctx = vm.createContext({ normalizeSearchText, state: { clients: [records[0]] },
  currentClientPageRecords: [selected], portfolioDiagnosticData: null });
vm.runInContext(extract(app, "clientIdentity") + extract(app, "findClientForEdit") + extract(server, "findClientIndex"), ctx);
assert.equal(ctx.findClientForEdit("123"), selected);
assert.equal(ctx.findClientForEdit("internal-123"), selected);
assert.equal(ctx.findClientForEdit(""), null);
ctx.state.clients = records;
assert.equal(ctx.findClientForEdit("Duplicado"), null);
assert.equal(ctx.findClientIndex({ clients: records }, "123"), 1);
assert.equal(ctx.findClientIndex({ clients: records }, "internal-123"), 1);
assert.equal(ctx.findClientIndex({ clients: records }, "Duplicado"), -1);
assert.equal(ctx.findClientIndex({ clients: records }, ""), -1);
assert.equal(ctx.findClientIndex({ clients: [selected, { ...selected }] }, "123"), -1);

const events = [];
const button = { disabled: false };
const form = { dataset: {}, reset: () => events.push("reset") };
const fields = { clientAdminPassword: { value: "test" }, clientAuthorizationForm: { dataset: {} },
  clientAuthorizeSubmit: {}, clientAuthorizationError: {}, clientAuthorizationDialog: { close: () => events.push("auth-close") } };
let finish;
const ui = vm.createContext({
  clientEditTargetId: "123", clientPageCache: { clear: () => events.push("cache") }, portfolioDiagnosticData: {},
  clientEditBaseline: { nombre_comercial: "Cliente" }, clientEditExpected: { telefono: null }, clientEditOperation: null,
  ClientEdit: require("../client-edit"), crypto: require("node:crypto"),
  activeViewId: () => "clientes", loadClientsPage: async options => { assert.equal(options.force, true); events.push("refresh"); },
  clientFormPayload: () => ({ nombre_comercial: "Cliente", telefono: "123", motivo: "Horarios" }),
  byId: id => id === "clientSubmitBtn" ? button : fields[id] || { close: () => events.push("close"), focus() {} },
  window: { scrollX: 0, scrollY: 850, alert: msg => events.push(msg),
    requestAnimationFrame: fn => fn(), scrollTo: pos => events.push(`scroll:${pos.top}`) },
  showCompactNotice: msg => events.push(msg),
  postOperationalAction: (url, payload) => { events.push(url); assert.equal(payload.admin_password, "test"); return new Promise(resolve => { finish = resolve; }); }
});
vm.runInContext("async " + extract(app, "submitClientEdit"), ui);
async function main() {
  const data = { get: () => "test" };
  const saving = ui.submitClientEdit(form, data, true);
  assert.equal(button.disabled, true);
  assert.equal(await ui.submitClientEdit(form, data), false);
  finish({ ok: true });
  assert.equal(await saving, true);
  assert.equal(button.disabled, false);
  assert.equal(form.dataset.saving, undefined);
  assert.ok(events.includes("close"));
  assert.ok(!events.includes("refresh"));
  assert.ok(events.includes("scroll:850"));
  assert.ok(events.includes("Cliente actualizado correctamente."));
  assert.equal(events.filter(e => e.startsWith("api/")).length, 1);
  events.length = 0;
  ui.clientEditTargetId = "123";
  fields.clientAdminPassword.value = "test";
  ui.postOperationalAction = async () => { throw new Error("Clave incorrecta"); };
  assert.equal(await ui.submitClientEdit(form, data, true), false);
  assert.equal(button.disabled, false);
  assert.equal(ui.clientEditTargetId, "123");
  assert.ok(!events.includes("reset") && !events.includes("close"));
  ui.clientFormPayload = () => { throw new Error("Horario incompleto"); };
  assert.equal(await ui.submitClientEdit(form, data), false);
  assert.ok(events.includes("Horario incompleto"));
  console.log("PASS P7: paginated client, exact code/ID, ambiguous names rejected, single submit, success/close/scroll, errors preserve form.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
