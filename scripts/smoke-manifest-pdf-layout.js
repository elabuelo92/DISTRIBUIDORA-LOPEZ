"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const extract = (a,b) => source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const ctx = vm.createContext({Blob,TextEncoder,numeric:(v,d)=>Number(v)||d});
vm.runInContext(extract("function pdfEscape(","function makeSimplePdf(")+extract("function pdfCellText(","function downloadCsvReport("),ctx);
(async()=>{
  for(const [name,constant,call] of [
    ["planificacion","DELIVERY_PLANNER_PDF_HEADERS","async function exportDeliveryPlannerManifest("],
    ["ruta","DELIVERY_MANIFEST_HEADERS","function exportDeliveryRouteManifest("],
    ["cobros","DELIVERY_COLLECTION_HEADERS","async function exportDeliveryCollectionsManifest("]
  ]) {
    const literal=source.match(new RegExp('const '+constant+' = (\\[[\\s\\S]*?\\]);'));
    assert.ok(literal);
    const headers=vm.runInContext(literal[1],ctx);
    const start=source.indexOf(call), next=source.slice(start+1).search(/^(?:async )?function /m);
    const body = source.slice(start,start+1+next);
    assert.match(body,/wrapText: true/);
    const weightLiteral = body.match(/weights: (\[[^\]]+\])/);
    const rows=Array.from({length:100},(_,i)=>headers.map((header,j)=>j===0?`PED-${i}`:/Cliente|Direccion|Referencia|Banco/.test(header)?`Texto extenso de ${header} con detalle completo FINALCAMPO`:String(1000+i)));
    const before=JSON.stringify(rows);
    const blob=ctx.makeTablePdf(`Manifiesto ${name}`,headers,rows,{wrapText:true,fontSize:8, weights:weightLiteral ? vm.runInContext(weightLiteral[1],ctx) : undefined});
    const text=await blob.text();
    const drawn = [...text.matchAll(/\(([^\n]*)\) Tj/g)].map((match)=>match[1]).join("");
    assert.ok(drawn.includes("PED-99"));
    assert.ok(drawn.includes("FINALCAMPO"));
    assert.ok(!text.includes("..."));
    assert.equal(JSON.stringify(rows),before);
    if(process.argv[2]){ fs.mkdirSync(process.argv[2],{recursive:true}); fs.writeFileSync(path.join(process.argv[2],name+'.pdf'),Buffer.from(await blob.arrayBuffer())); }
  }
  console.log("PASS three manifests, 100 rows each, complete wrapped fields and headers, no data changes");
})().catch(e=>{console.error(e);process.exitCode=1;});
