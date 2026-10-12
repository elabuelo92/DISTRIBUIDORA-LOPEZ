"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
function fn(name) {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, "m"));
  assert.ok(start >= 0, name);
  const next = source.slice(start + 1).search(/^(?:async )?function /m);
  return source.slice(start, next < 0 ? undefined : start + 1 + next);
}
const files = [];
const ctx = vm.createContext({ Blob, TextEncoder, numeric: (v,d) => Number(v) || d,
  downloadBlob: (name, blob) => files.push({name,blob}) });
vm.runInContext(["pdfEscape", "utf8Length", "pdfCellText", "makeReadableReportPdf", "makeTablePdf", "csvCell", "downloadCsvReport"].map(fn).join("\n"), ctx);
async function main() {
  for (const width of [3,8,14,17]) {
    const headers = Array.from({length:width},(_,i)=>`Campo${i}`);
    const rows = Array.from({length:100},(_,i)=>headers.map((_,j)=>j===0?`PED-${i}`:`Valor ${i} ${j} con texto largo y completo FIN${i}X${j}`));
    const before = JSON.stringify({headers,rows});
    const blob = ctx.makeReadableReportPdf("Reporte de prueba",headers,rows,{subtitle:"Filtros de prueba"});
    const text = await blob.text();
    const drawn = [...text.matchAll(/\(([^\n]*)\) Tj/g)].map(m=>m[1]).join("").replace(/\s/g, "");
    for(let i=0;i<100;i++) for(let j=1;j<width;j++) assert.ok(drawn.includes(`FIN${i}X${j}`),`${i}/${j}`);
    assert.equal(JSON.stringify({headers,rows}),before);
    assert.ok(drawn.includes("PED-99"));
    assert.ok(text.includes("/F1 9 Tf"));
    if(process.argv[2]) {
      fs.mkdirSync(process.argv[2],{recursive:true});
      fs.writeFileSync(path.join(process.argv[2],`reporte-${width}.pdf`),Buffer.from(await blob.arrayBuffer()));
    }
    const empty = await ctx.makeReadableReportPdf("Vacio",headers,[],{subtitle:"Sin coincidencias"}).text();
    assert.ok(empty.includes("Sin registros"));
  }
  const rows = [['00170','Cliente; "Lopez"\nDireccion',0,-12.5]];
  const before = JSON.stringify(rows);
  ctx.downloadCsvReport("prueba.csv",["Codigo","Cliente","Cantidad","Saldo"],rows);
  const bytes = new Uint8Array(await files[0].blob.arrayBuffer());
  assert.deepEqual(Array.from(bytes.slice(0,3)),[239,187,191]);
  const csv = await files.pop().blob.text();
  assert.ok(csv.startsWith('sep=;\r\n"Codigo";"Cliente";"Cantidad";"Saldo"'));
  assert.ok(csv.includes('"00170";"Cliente; ""Lopez""\nDireccion";"0";"-12.5"'));
  assert.equal(JSON.stringify(rows),before);
  const order = {code:"PED-TEST",client:"Cliente",seller:"Vendedor",amount:100,status:"Listo",paymentMethod:"Contado",priority:"Normal",products:"Producto"};
  Object.assign(ctx, {
    mobileSalesOrders:()=>[order], mobileSaleDate:()=>({date:"12/10/2026",time:"08:00"}),
    orderCommission:()=>({seller:{total:5}}), mobileSeller:"Vendedor", safeFilePart:String,
    reportDateStamp:()=>"20261012", logMobileConsultation:()=>{}, selectedOrders:()=>[order],
    orderZoneText:()=>"Zona", orderRouteText:()=>"Ruta", money:{format:String},
    mobileSalesSummary:()=>({count:1,avg:100,total:100,commission:5}),
    ORDER_STATUS:{READY:"Listo",ASSEMBLY:"Armado",LABELED:"Etiquetado",READY_DISPATCH:"Despacho"},
    assemblyOrderRows:()=>[{pedido:"PED-TEST",cliente:"Cliente",direccion:"Calle",zona:"Zona",ruta:"Ruta",estado:"Listo",producto:"Producto",cantidad:1,bultos:1,observaciones:"Nota"}],
    setOrdersBulkStatus:()=>{}, state:{}, commissionRoleLabel:String,
    OrderEngine:{summarizeCommissions:()=>[{role:"seller",user:"Vendedor",orders:1,baseAmount:100,cigarettes:0,merchandise:5,returns:0,total:5}]}
  });
  vm.runInContext(["exportMobileSalesCsv","exportMobileSalesPdf","exportSelectedOrdersCsv","exportAssemblyList","exportCommissionsCsv"].map(fn).join("\n"),ctx);
  const orderBefore = JSON.stringify(order);
  ctx.exportMobileSalesCsv();
  ctx.exportMobileSalesPdf();
  ctx.exportSelectedOrdersCsv();
  ctx.exportAssemblyList([order]);
  ctx.exportCommissionsCsv();
  assert.equal(files.length,6);
  assert.equal(files.filter(file=>file.name.endsWith(".csv")).length,4);
  assert.equal(JSON.stringify(order),orderBefore);
  assert.ok((await files[0].blob.text()).includes("PED-TEST"));
  for(const name of ["exportMobileSalesCsv","exportSelectedOrdersCsv","exportAssemblyList","exportCommissionsCsv"]) {
    assert.ok(fn(name).includes("downloadCsvReport("),name);
    assert.ok(!fn(name).includes("downloadTabularExcel("),`${name}: preserve local role access`);
  }
  for(const name of ["exportMobileSalesPdf","exportAssemblyList","exportCommercialRoute","exportShortagesPdf","exportRouteSalesPdf","printAuditReport","printDashboardDailyRoutes","exportOrderStagePdf","exportFullClientPortfolioPdf","exportFullProductPortfolioPdf","exportSuppliersPdf","exportSalesCommissionPdf"]) assert.ok(fn(name).includes("makeReadableReportPdf("),name);
  console.log("PASS readable exports: 400 rows, 42 columns across four layouts, all field endings, no data mutation, empty reports, CSV quoting/BOM/separator, local role access preserved.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
