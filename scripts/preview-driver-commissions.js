"use strict";
// Isolated component preview: real markup/render functions, fictitious saved commissions, no ERP API.
const fs = require("node:fs"), http = require("node:http"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = index.indexOf('<section class="table-panel wide" id="driverCommissionPanel">');
const panel = index.slice(start, index.indexOf("</section>", start) + 10);
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const functions = app.slice(app.indexOf("let driverCommissionLimit = 50;"), app.indexOf("function renderCommissionsModule()"));
const fixtures = ["Reparto Demo 1", "Reparto Demo 2"].map((user,i) => ({ code: `FICTICIO-${i+1}`, client: "Cliente ficticio", status: "Cobrado",
  commissions: { calculatedAt: "2026-10-18T12:00:00Z", driver: { user, baseAmount: 10000, cigarettes: 100, merchandise: 200+i*100, total: 300+i*100 } } }));
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>P3 - Prueba ficticia</title><body><main style="padding:24px;max-width:1200px;margin:auto"><h1>Prueba aislada P3</h1>${panel}</main><script src="/sales-commission-report.js"></script><script>
const state={orders:${JSON.stringify(fixtures)},archivedOrders:[]};
const byId=id=>document.getElementById(id);
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const money=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'});
${functions}
['driverCommissionUser','driverCommissionFrom','driverCommissionTo'].forEach(id=>byId(id).addEventListener('change',renderDriverCommissionReport));
byId('driverCommissionDetails').addEventListener('toggle',renderDriverCommissionReport);
byId('driverCommissionExcel').disabled=true;
renderDriverCommissionReport();
</script></body></html>`;
http.createServer((req,res) => {
  if (["/styles.css", "/sales-commission-report.js"].includes(req.url)) {
    res.setHeader("Content-Type", req.url.endsWith("css") ? "text/css" : "application/javascript");
    return res.end(fs.readFileSync(path.join(root,req.url.slice(1))));
  }
  res.setHeader("Content-Type","text/html; charset=utf-8"); res.end(html);
}).listen(21915,"127.0.0.1",()=>console.log("P3 component preview http://127.0.0.1:21915 (fictitious, no production API)"));
