const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const OrderEngine = require("../order-engine");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const start = app.indexOf("function renderDeliveryDriverStops(");
const end = app.indexOf("\nasync function applyDeliverySequenceChange(", start);
assert.ok(start >= 0 && end > start, "Driver stop renderer exists");

const nodes = new Map(["deliveryStopList", "deliveryStopCount", "deliveryStopSearch"].map((id) => [id, { value: "", textContent: "", innerHTML: "" }]));
const buttons = ["pending", "issues", "all"].map((filter) => ({
  dataset: { deliveryStopFilter: filter },
  classList: { toggle() {} },
  setAttribute() {},
  textContent: ""
}));
const stops = Array.from({ length: 100 }, (_, index) => ({
  orderCode: `PED-${index + 1}`,
  client: index === 0 ? "Cliente <Centro>" : `Cliente ${index + 1}`,
  address: `Calle ${index + 1}`,
  hours: "08:00-12:00",
  packages: 2,
  amount: 5000,
  status: OrderEngine.STATUS.DISPATCHED,
  sequence: index + 1
}));
const orders = stops.map((stop) => ({ code: stop.orderCode, status: stop.status, client: stop.client }));
const context = {
  state: { orders },
  ORDER_STATUS: OrderEngine.STATUS,
  deliveryStopFilter: "pending",
  deliveryStopSearchTerm: "",
  deliveryStopPageSize: 15,
  deliverySelectedStopCode: "",
  deliveryDevice: { id: "TEST-DRIVER" },
  byId: (id) => nodes.get(id),
  document: { querySelectorAll: () => buttons },
  numeric: (value, fallback) => Number(value) || fallback,
  normalizeSearchText: (value) => String(value || "").toLowerCase(),
  isDeliveryStopClosed: (status) => [OrderEngine.STATUS.COLLECTED, OrderEngine.STATUS.NOT_DELIVERED].includes(status),
  isDeliveryRouteClosed: () => false,
  orderClient: () => null,
  routeClientByName: () => null,
  orderAssemblyInfo: () => ({ bultos: 2 }),
  formatAssemblyPedidoNumber: (value) => value,
  deliveryTone: () => "",
  escapeHtml: (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"),
  money: { format: (value) => `$ ${value}` }
};
vm.createContext(context);
vm.runInContext(`${app.slice(start, end)}\nthis.renderDeliveryDriverStops = renderDeliveryDriverStops;`, context);
const render = () => context.renderDeliveryDriverStops({ stops, status: "En curso", deviceId: "TEST-DRIVER" }, stops[0], true);

render();
assert.equal((nodes.get("deliveryStopList").innerHTML.match(/class="delivery-driver-stop /g) || []).length, 15);
assert.match(nodes.get("deliveryStopList").innerHTML, /data-delivery-status="PED-1"/);
assert.match(nodes.get("deliveryStopList").innerHTML, /Mostrar 15 mas/);
assert.match(nodes.get("deliveryStopList").innerHTML, /Cliente &lt;Centro&gt;/);
assert.doesNotMatch(nodes.get("deliveryStopList").innerHTML, /<table/);
assert.equal(nodes.get("deliveryStopCount").textContent, "100 de 100 paradas");
assert.match(nodes.get("deliveryStopList").innerHTML, /data-delivery-select-stop="PED-10"/);

context.deliverySelectedStopCode = "PED-10";
render();
assert.match(nodes.get("deliveryStopList").innerHTML, /data-delivery-collect="PED-10"/);
assert.doesNotMatch(nodes.get("deliveryStopList").innerHTML, /data-delivery-collect="PED-1"/);
context.deliverySelectedStopCode = "";

orders[0].status = OrderEngine.STATUS.IN_ROUTE;
render();
assert.match(nodes.get("deliveryStopList").innerHTML, /data-delivery-collect="PED-1"/);
assert.match(nodes.get("deliveryStopList").innerHTML, /data-delivery-exception="PED-1"/);

context.deliveryStopPageSize = 30;
render();
assert.equal((nodes.get("deliveryStopList").innerHTML.match(/class="delivery-driver-stop /g) || []).length, 30);

stops[0].status = OrderEngine.STATUS.COLLECTED;
context.deliveryStopPageSize = 15;
render();
assert.equal(nodes.get("deliveryStopCount").textContent, "99 de 100 paradas");
assert.doesNotMatch(nodes.get("deliveryStopList").innerHTML, /data-delivery-status="PED-1"/);

stops[1].status = OrderEngine.STATUS.NOT_DELIVERED;
context.deliveryStopFilter = "issues";
render();
assert.equal(nodes.get("deliveryStopCount").textContent, "1 de 100 paradas");

context.deliveryStopFilter = "all";
context.deliveryStopSearchTerm = "calle 99";
render();
assert.equal(nodes.get("deliveryStopCount").textContent, "1 de 100 paradas");
assert.match(nodes.get("deliveryStopList").innerHTML, /PED-99/);

assert.match(html, /id="deliveryStopSearch"/);
assert.match(styles, /\.delivery-driver-stop-actions/);
assert.match(app, /const showMap = deliveryMapVisible;/);
const unchangedStart = app.indexOf("if (payload.unchanged && !payload.state)");
const unchangedEnd = app.indexOf("if (payload.state && payload.version > previousSyncVersion)", unchangedStart);
assert.ok(unchangedStart >= 0 && unchangedEnd > unchangedStart);
const unchangedBranch = app.slice(unchangedStart, unchangedEnd);
assert.match(unchangedBranch, /currentUser\?\.role === "seller"\) refreshMobilePresence\(\)/);
assert.doesNotMatch(unchangedBranch, /renderOperationalRole\(\)/);

const presenceStart = app.indexOf("function refreshMobilePresence()");
const presenceEnd = app.indexOf("\nfunction setGpsBadge(", presenceStart);
assert.ok(presenceStart >= 0 && presenceEnd > presenceStart);
const gpsNode = { textContent: "" };
const presenceCalls = [];
const presenceContext = {
  renderLocationStatus: () => presenceCalls.push("location"),
  byId: () => gpsNode,
  getSelectedMobileSeller: () => ({ location: { lat: -31.4, lng: -64.2 } }),
  renderDailyRoutePanel: () => presenceCalls.push("route"),
  renderAssistantGuide: () => presenceCalls.push("guide")
};
vm.createContext(presenceContext);
vm.runInContext(`${app.slice(presenceStart, presenceEnd)}\nthis.refreshMobilePresence = refreshMobilePresence;`, presenceContext);
presenceContext.refreshMobilePresence();
assert.equal(gpsNode.textContent, "Activo");
assert.deepEqual(presenceCalls, ["location", "route", "guide"]);
assert.match(app, /id="mobileProgressGpsStatus"/);

const paymentStart = app.indexOf("function updateDeliveryPaymentPresetSelection(");
const paymentEnd = app.indexOf("\nfunction updateDeliveryPaymentDefaults(", paymentStart);
assert.ok(paymentStart >= 0 && paymentEnd > paymentStart);
const paymentButtons = ["cash", "transfer", "pending-transfer", "credit", "mixed"].map((preset) => ({
  dataset: { deliveryPaymentPreset: preset },
  selected: false,
  pressed: "false",
  classList: { toggle(_name, active) { this.owner.selected = active; } },
  setAttribute(_name, value) { this.pressed = value; }
}));
paymentButtons.forEach((button) => { button.classList.owner = button; });
const paymentMethod = { value: "Efectivo" };
const paymentContext = {
  byId: () => paymentMethod,
  document: { querySelectorAll: () => paymentButtons }
};
vm.createContext(paymentContext);
vm.runInContext(`${app.slice(paymentStart, paymentEnd)}\nthis.updatePaymentSelection = updateDeliveryPaymentPresetSelection;`, paymentContext);
for (const [method, preset] of Object.entries({
  Efectivo: "cash",
  Transferencia: "transfer",
  "Transferencia Pendiente": "pending-transfer",
  "Cuenta corriente": "credit",
  Mixto: "mixed"
})) {
  paymentMethod.value = method;
  paymentContext.updatePaymentSelection();
  assert.deepEqual(paymentButtons.filter((button) => button.selected).map((button) => button.dataset.deliveryPaymentPreset), [preset]);
  assert.equal(paymentButtons.find((button) => button.selected).pressed, "true");
}
assert.match(styles, /\.payment-preset-grid \.mini-btn\.is-selected/);
assert.doesNotMatch(html, /class="mini-btn primary-mini"[^>]+data-delivery-payment-preset="mixed"/);

const metricsState = {
  sellers: [{ name: "Axel", orders: 0 }, { name: "Ruggero", orders: 777 }],
  orders: [{ code: "A-1", seller: "Axel", amount: 100, status: OrderEngine.STATUS.COLLECTED }],
  archivedOrders: []
};
OrderEngine.refreshSellerMetrics(metricsState, "Axel");
assert.equal(metricsState.sellers[0].orders, 1);
assert.equal(metricsState.sellers[1].orders, 777);

console.log(JSON.stringify({ ok: true, stops: 100, initialRows: 15, loadMoreRows: 30, mobileLayout: true, paymentPresets: 5, targetedSellerMetrics: true }));

if (process.argv.includes("--visual")) {
  (async () => {
    const moduleName = process.argv[process.argv.indexOf("--visual") + 1] || "playwright";
    const { chromium } = require(moduleName);
    context.deliveryStopFilter = "pending";
    context.deliveryStopSearchTerm = "";
    stops[0].status = OrderEngine.STATUS.IN_ROUTE;
    orders[0].status = OrderEngine.STATUS.IN_ROUTE;
    render();
    const executablePath = process.argv[process.argv.indexOf("--visual") + 2] || chromium.executablePath();
    const browser = await chromium.launch({ headless: true, executablePath });
    try {
      for (const width of [360, 390, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
        await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style></head><body><section id="reparto" class="view active delivery-driver-mode"><section class="panel delivery-active-panel"><div class="panel-header"><h2>Hoja de ruta activa</h2></div><div class="delivery-active-grid map-hidden"><div class="delivery-active-summary"><div class="delivery-progress-hero"><strong>1/100</strong></div></div></div></section><div class="delivery-layout"><section class="panel delivery-stops-panel"><div class="panel-header"><h2>Paradas</h2></div><div class="delivery-stop-toolbar"><input type="search" placeholder="Buscar cliente, pedido o direccion"><div class="delivery-stop-filters"><button class="active">Pendientes 100</button><button>Incidencias 0</button><button>Todas 100</button></div><span>100 de 100 paradas</span></div><div class="delivery-stop-list">${nodes.get("deliveryStopList").innerHTML}</div></section></div></section></body></html>`);
        const measurements = await page.evaluate(() => {
          const button = document.querySelector("[data-delivery-collect]");
          const bounds = button.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            buttonLeft: bounds.left,
            buttonRight: bounds.right,
            buttonWidth: bounds.width
          };
        });
        assert.ok(measurements.overflow <= 1, `${width}px layout overflows by ${measurements.overflow}px`);
        assert.ok(measurements.buttonLeft >= 0 && measurements.buttonRight <= width, `${width}px collect button is outside viewport`);
        assert.ok(measurements.buttonWidth >= 120, `${width}px collect button is too narrow`);
        if (width === 390) {
          const screenshot = path.join(os.tmpdir(), "dl-delivery-driver-390.png");
          await page.screenshot({ path: screenshot, fullPage: true });
          console.log(JSON.stringify({ screenshot }));
        }
        await page.close();
      }
      const paymentPage = await browser.newPage({ viewport: { width: 390, height: 800 } });
      await paymentPage.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style></head><body><div class="payment-preset-grid"><button class="mini-btn is-selected">Todo efectivo</button><button class="mini-btn">Todo transferencia</button></div></body></html>`);
      const paymentColors = await paymentPage.evaluate(() => [...document.querySelectorAll(".payment-preset-grid button")].map((button) => ({
        background: getComputedStyle(button).backgroundColor,
        color: getComputedStyle(button).color
      })));
      assert.notEqual(paymentColors[0].background, paymentColors[1].background);
      assert.equal(paymentColors[0].color, "rgb(255, 255, 255)");
      await paymentPage.close();
    } finally {
      await browser.close();
    }
  })().catch((error) => { console.error(error); process.exitCode = 1; });
}
