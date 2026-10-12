"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const extract = (a,b) => source.slice(source.indexOf(a), source.indexOf(b,source.indexOf(a)));
const reports = [];
const row = {code:"00170",name:"Producto de nombre extenso con comas, parentesis (prueba) y descripcion completa FINALNOMBRE",rubric:"Limpieza",brand:"Marca",supplier:"Proveedor de prueba",warehouse:"Central",available:10,committed:2,preparing:1,assembled:0,labeled:0,readyDispatch:1,expected:14,counted:0,difference:-14,differencePercent:-100,count:{user:"Test",at:"2026-10-12"}};
const ctx = vm.createContext({Blob, TextEncoder, numeric:(v,d)=>Number(v)||d, utf8Length:(s)=>Buffer.byteLength(s), isAdminUser:()=>true,
  window:{alert(){}}, physicalStockReportType:"all", physicalStockReportRows:()=>Array.from({length:100},(_,i)=>({...row,code:`TEST-${i}`})),
  state:{physicalStockAdjustments:[]}, formatOrderTime:String, safeFilePart:String, reportDateStamp:()=>"20261012",
  downloadBlob:(name,blob)=>reports.push({name,blob}), stockReportRows:()=>[{codigo:"00170",producto:row.name,barras:"000123",rubro:"Limpieza",marca:"Marca",familia:"Test",fisico:14,reservado:2,disponible:12,transito:0,minimo:1,costo:100,precio:150,estado:"Activo"}]
});
vm.runInContext(extract("function pdfEscape(","function makeSimplePdf(") + extract("function pdfCellText(","function downloadCsvReport(") + extract("function exportPhysicalStockPdf(","function findPhysicalStockInput(") + extract("function exportStockPdf(","function exportOrderStagePdf("),ctx);
(async()=>{
  const before=JSON.stringify(row);
  ctx.exportPhysicalStockPdf(); ctx.exportStockPdf();
  for(const report of reports){
    const text=await report.blob.text();
    assert.ok(text.startsWith("%PDF"));
    assert.ok(text.includes("FINALNOMBRE"));
    assert.ok(!text.includes("..."));
    if(report.name.includes("fisico")) {
      assert.ok(text.includes("TEST-99"));
      assert.ok(text.includes("Conteo: 0"));
      assert.ok(text.includes("Diferencia: -14"));
      assert.ok(text.includes("Pendiente despacho:"));
    }
    if(process.argv[2]) {
      fs.mkdirSync(process.argv[2],{recursive:true});
      fs.writeFileSync(path.join(process.argv[2],report.name),Buffer.from(await report.blob.arrayBuffer()));
    }
  }
  assert.equal(JSON.stringify(row),before);
  const huge=await ctx.makeTablePdf("Test",["Codigo","Detalle"],[["TEST-LARGO","texto ".repeat(3000)+"FINALDETALLE"]],{wrapText:true,fontSize:10}).text();
  assert.ok(huge.includes("FINALDETALLE"));
  console.log("PASS PDF: 100 products, long text, full fields, zero count, multi-page oversized record, no business mutations");
})().catch(e=>{console.error(e);process.exitCode=1;});
