"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function sourceBetween(start, end) {
  const from = app.indexOf(start);
  const to = app.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Missing code block: ${start}`);
  return app.slice(from, to);
}

const fields = new Map([
  "mobileProductSearch", "mobileClientSearch", "mobileProductQty"
].map((id) => [id, { value: "stale" }]));
const mobile = {
  mobileCart: { Papas: 3 },
  mobileClient: "Cliente anterior",
  mobileProduct: "Papas",
  mobileClientHistoryOpen: true,
  mobileOrderPendingOperation: null,
  byId: (id) => fields.get(id),
  clearMobileCommercialRequest() { mobile.commercialCleared = true; },
  setMobilePickerOpen() {},
  cleanupOperationalLocalData() {},
  resetMobileClientHistoryState() { mobile.historyReset = true; },
  renderMobileSeller() { mobile.rendered = true; }
};
vm.createContext(mobile);
vm.runInContext(`${sourceBetween("function clearMobileOrderDraft()", "function newMobileOrderOperationId()")}
  this.changeClient = selectMobileClient;
  this.resetOrder = resetMobileOrderForm;`, mobile);
mobile.changeClient("Cliente nuevo");
assert.equal(mobile.mobileClient, "Cliente nuevo");
assert.equal(Object.keys(mobile.mobileCart).length, 0);
assert.equal(fields.get("mobileProductQty").value, "1");
assert.equal(mobile.historyReset, true);
mobile.mobileCart.Papas = 2;
mobile.resetOrder();
assert.equal(mobile.mobileClient, "");
assert.equal(Object.keys(mobile.mobileCart).length, 0);
assert.match(sourceBetween("function renderMobileSeller()", "function getSelectedMobileClient()"), /find\(\(client\) => client\.name === mobileClient\) \|\| null/);
assert.doesNotMatch(sourceBetween("function renderMobileSeller()", "function getSelectedMobileClient()"), /mobileProduct = state\.products\[0\]/);
assert.match(app, /Domicilio: \$\{escapeHtml\(selectedClient\.domicilio/);

const list = {
  innerHTML: "",
  old: { scrollTop: 280, scrollLeft: 65 },
  next: { scrollTop: 0, scrollLeft: 0 },
  querySelector() { return this.innerHTML ? this.next : this.old; }
};
const nodes = new Map([
  ["deliveryActiveRouteTitle", {}], ["deliveryActiveRouteMeta", {}],
  ["deliveryStopList", list], ["deliveryStopToolbar", {}]
]);
const route = {
  id: "R1", zone: "Centro", status: "Planificada",
  stops: [{ orderCode: "PED-1", client: "Cliente", status: "Despachado", sequence: 1, address: "Calle 1", packages: 1, amount: 100 }]
};
const delivery = {
  byId: (id) => nodes.get(id),
  currentUser: { role: "admin" },
  deliveryDevice: {},
  state: { orders: [{ code: "PED-1", client: "Cliente", status: "Despachado" }] },
  DeliveryEngine: { nextStop: () => null, navigationUrl: () => "" },
  isAdminUser: () => true,
  isDeliveryStopDelivered: () => false,
  isDeliveryStopClosed: () => false,
  isDeliveryRouteClosed: () => false,
  canPlanDeliveryRoutes: () => false,
  orderAssemblyInfo: () => ({ bultos: 1 }),
  orderClient: () => null,
  routeClientByName: () => null,
  formatAssemblyPedidoNumber: (value) => value,
  formatAssemblyOrderNumber: () => "1",
  deliveryTone: () => "",
  escapeHtml: (value) => String(value ?? ""),
  money: { format: (value) => `$ ${value}` },
  ORDER_STATUS: { DISPATCHED: "Despachado", IN_ROUTE: "En reparto" }
};
vm.createContext(delivery);
vm.runInContext(`${sourceBetween("function renderDeliveryStops(route)", "function renderDeliveryDriverStops(")}
  this.renderStops = renderDeliveryStops;`, delivery);
delivery.renderStops(route);
assert.match(list.innerHTML, /<th>Acciones<\/th><th>Mover<\/th>/);
assert.equal(list.next.scrollTop, 280);
assert.equal(list.next.scrollLeft, 65);

assert.match(html, /id="stockPriceSimulation"/);
assert.match(html, /id="accountPaymentChooserDialog"/);
assert.match(styles, /\.account-payment-choice/);
assert.match(app, /data-edit-product-list=/);
assert.match(app, /function renderStockPriceSimulation\(/);
assert.doesNotMatch(sourceBetween("function openAccountPaymentChooser()", "function renderAccounts()"), /window\.prompt/);

const priceNodes = new Map([
  ["stockPriceSimulation", { innerHTML: "" }],
  ["stockEditForm", { elements: { costo: { value: "100" }, ...Object.fromEntries([1, 2, 3, 4, 5].map((number) => [`precio_lista_${number}`, { value: number === 2 ? "150" : "120" }])) } }]
]);
const price = {
  byId: (id) => priceNodes.get(id),
  stockEditTargetName: "Papas",
  state: { products: [{ name: "Papas", cost: 100, price: 120, precio_lista_2: 120 }] },
  SYSTEM_PRICE_LISTS: [1, 2, 3, 4, 5],
  productPriceForListNumber: () => 120,
  numeric: (value) => Number(value),
  priceMarginFromCost: (value, cost) => (value / cost - 1) * 100,
  formatDecimalInput: (value) => String(value),
  money: { format: (value) => `$ ${value}` }
};
vm.createContext(price);
vm.runInContext(`${sourceBetween("function renderStockPriceSimulation()", "async function reauthAdminPassword(")}
  this.renderPrice = renderStockPriceSimulation;`, price);
price.renderPrice();
assert.match(priceNodes.get("stockPriceSimulation").innerHTML, /L2: \$ 120 → <strong>\$ 150<\/strong>/);
assert.equal((priceNodes.get("stockPriceSimulation").innerHTML.match(/stock-price-preview-item/g) || []).length, 5);

console.log(JSON.stringify({ ok: true, mobileDraft: true, deliveryScroll: true, priceLists: 5, searchablePayment: true }));
