"use strict";
// Render the actual print template with synthetic data; no ERP connection or writes.
const fs = require("node:fs"), vm = require("node:vm"), http = require("node:http"), path = require("node:path");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
let html = "";
const context = vm.createContext({ Intl, numeric: (v,d) => v == null ? d : Number(v), escapeHtml: v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
  state: {clients:[]}, normalizeText: v => String(v || ""), money: new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}),
  assemblyPrintSettings: () => ({showPrices:true,showAmounts:true,showInternalCode:true,showClientLogo:true,fontSize:11}),
  orderLabelFields: () => ({address:"Domicilio ficticio",zone:"Centro",packages:1}), orderAssemblyInfo: () => ({bultos:1}),
  orderCreatedDateParts: () => ({date:"20/10/2026"}), printOrderNumber: o => o.code,
  ClientHours: null, DEVELOPER_BRAND:{name:"Grupo Rocha Solutions"},
  reprintMotiveForOrders: () => "", recordAssemblyPrintAudit() {},
  window:{open:()=>({document:{open(){},write(value){html=value;},close(){}}})}
});
for (const name of ["assemblyOrderItems","orderItemShortageInfo","orderInvoiceRows","findClientByName","orderInvoiceHtml","printOrderInvoice"]) {
  const start=source.indexOf(`function ${name}(`),end=source.indexOf("\n}",start)+2;
  vm.runInContext(source.slice(start,end),context);
}
context.printOrderInvoice({code:"PRUEBA-P11",client:"Cliente ficticio",seller:"Prueba",amount:2450,items:[
  {name:"Aceite girasol - descuento aprobado",productCode:"TEST1",requestedQty:10,unitPrice:100,lineTotal:950},
  {name:"Producto sin descuento aplicado",productCode:"TEST2",requestedQty:10,unitPrice:100,lineTotal:1000,requestedDiscountPct:5},
  {name:"Producto con descuento general",productCode:"TEST3",requestedQty:5,unitPrice:125,lineTotal:500}
]});
html=html.replace(/<script>[\s\S]*?<\/script>/g,"");
const server=http.createServer((req,res)=>{
 if(req.url==="/icons/logo-distribuidora-lopez-192.png") {res.setHeader("Content-Type","image/png");res.end(fs.readFileSync(path.join(__dirname,"../icons/logo-distribuidora-lopez-192.png")));return;}
 res.setHeader("Content-Type","text/html; charset=utf-8");res.end(html);
});
server.listen(28211,"127.0.0.1",()=>console.log("P11 synthetic invoice: http://127.0.0.1:28211/ - ENTER stops"));
process.stdin.resume();process.stdin.once("data",()=>{process.stdin.pause();server.close();});
