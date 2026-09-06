"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../portfolio-export-engine");

const root = path.join(__dirname, "..");
const clients = [{ codigo_cliente: "C-137", name: "Cliente PDF", cuit: "20-137", telefono: "351000", domicilio: "Calle PDF 137", localidad: "Cordoba", zona: "Centro", ruta: "Martes Centro", seller: "Axel", dias_visita: ["Martes", "Jueves"], horario_atencion: "08:00-12:00", forma_pago: "Cuenta corriente", balance: 1500, latitud: -31.4, longitud: -64.1, status: "Activo" }];
const products = [
  { codigo_producto: "P-137", codigo_barras: "7790000137", name: "Producto PDF", rubro: "General", marca: "Marca", proveedor: "Proveedor", costo: 100, precio_lista_1: 110, precio_lista_2: 120, precio_lista_3: 130, precio_lista_4: 140, precio_lista_5: 150, stock_disponible: 20, activo: "SI" },
  { codigo_producto: "P-137-I", name: "Producto inactivo", active: false }
];

const clientLines = engine.clientPdfLines(clients);
const productLines = engine.productPdfLines(products);
assert.equal(clientLines.length, 4);
assert.match(clientLines.join("\n"), /Cliente PDF/);
assert.match(clientLines.join("\n"), /Martes\/Jueves/);
assert.match(clientLines.join("\n"), /GPS -31\.4,-64\.1/);
assert.equal(productLines.length, 8);
assert.match(productLines.join("\n"), /L1 \$ 110/);
assert.match(productLines.join("\n"), /L2 \$ 120/);
assert.match(productLines.join("\n"), /L5 \$ 150/);
assert.match(productLines.join("\n"), /Producto inactivo[\s\S]*Inactivo/);

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(app, /function exportFullClientPortfolioPdf/);
assert.match(app, /function exportFullProductPortfolioPdf/);
assert.match(html, /id="exportClientPortfolioPdfBtn"/);
assert.match(html, /id="exportProductPortfolioPdfBtn"/);
assert.match(html, /portfolio-export-engine\.js/);

console.log(JSON.stringify({ ok: true, prompt: 137, clients: clients.length, products: products.length, priceLists: [1, 2, 3, 4, 5], activeAndInactive: true, fullPortfolio: true }, null, 2));
