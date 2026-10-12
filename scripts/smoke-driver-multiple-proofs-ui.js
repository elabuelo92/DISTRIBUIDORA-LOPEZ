"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
const start=source.indexOf("let deliveryTransferProofs ="),end=source.indexOf("function deliveryItemRows(",start);
assert.ok(start>=0&&end>start);
const nodes=new Map();
const byId=id=>{if(!nodes.has(id))nodes.set(id,{value:"",files:[],disabled:false});return nodes.get(id);};
let uploads=0,message="";
const context=vm.createContext({byId,money:new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}),escapeHtml:String,
setDeliveryCollectionMessage:m=>{message=m;},fileToEvidenceDataUrl:async()=>"test",fileToCompressedDataUrl:async()=>"test",uploadDeliveryImage:async()=>({url:`/test/${++uploads}`})});
vm.runInContext(source.slice(start,end),context);
(async()=>{
const a={name:"a.pdf",size:10,lastModified:1},b={name:"b.pdf",size:20,lastModified:2};
byId("deliveryTransferBank").value="Mercado Pago";
byId("deliveryTransferFile").files=[a];byId("deliveryTransferProofAmount").value="200";
assert.equal(context.addDeliveryTransferProof(),true);
byId("deliveryTransferFile").files=[a];byId("deliveryTransferProofAmount").value="200";
assert.equal(context.addDeliveryTransferProof(),false);assert.match(message,/agregado/);
byId("deliveryTransferFile").files=[b];byId("deliveryTransferProofAmount").value="300";
assert.equal(context.addDeliveryTransferProof(),true);
assert.match(byId("deliveryTransferProofTotal").textContent,/2/);
assert.match(byId("deliveryTransferProofList").innerHTML,/a.pdf/);assert.match(byId("deliveryTransferProofList").innerHTML,/b.pdf/);
byId("deliveryCollectionSubmitBtn").disabled=true;
assert.equal(context.addDeliveryTransferProof(),false,"Cannot change queued proofs during submission");
await context.uploadDeliveryFileOnce("PED","transfer",a);await context.uploadDeliveryFileOnce("PED","transfer",a);
assert.equal(uploads,1,"Retry reuses uploaded attachment");
console.log("PASS driver UI: proof list, amounts, repeated file, in-flight guard and upload reuse");
})().catch(e=>{console.error(e);process.exitCode=1;});
