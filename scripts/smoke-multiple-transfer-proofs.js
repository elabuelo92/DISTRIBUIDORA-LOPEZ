"use strict";
const assert = require("node:assert/strict");
const Engine = require("../account-engine");
const admin = {role:"admin",user:"Test",username:"admin"};
const receipt = {id:"TRF-1",amount:250000,bank:"Mercado Pago",status:Engine.TRANSFER_STATUS.PENDING};
const state = {clients:[{name:"Cliente",codigo_cliente:"C1",balance:250000,saldo_actual:250000,saldo_inicial:250000}],orders:[{code:"PED-TEST",client:"Cliente",amount:250000,transferReceipts:[receipt]}],accounts:[],products:[],suppliers:[]};
Engine.ensureTransferReconciliation(state);
const proof = (amount,expectedAmount,requestId)=>({amount,expectedAmount,requestId,attachment:{url:`/test/${requestId}.pdf`,filename:`${requestId}.pdf`}});
const first = proof(100000,250000,"request-first-001");
Engine.attachTransferProof(state,"TRF-1",first,admin);
assert.equal(state.clients[0].balance,250000);
assert.equal(state.bankReconciliation.length,2);
assert.equal(state.orders[0].transferReceipts.reduce((n,r)=>n+r.amount,0),250000);
Engine.attachTransferProof(state,"TRF-1",first,admin);
assert.equal(state.bankReconciliation.length,2,"Retry cannot split twice");
assert.throws(()=>Engine.attachTransferProof(state,"TRF-1",proof(90000,100000,"request-other-001"),admin),/comprobante/);
let remainder=state.bankReconciliation.find(r=>r.id!=="TRF-1");
assert.equal(remainder.amount,150000);
assert.throws(()=>Engine.attachTransferProof(state,remainder.id,proof(160000,150000,"request-over-001"),admin),/importe/);
assert.throws(()=>Engine.attachTransferProof(state,remainder.id,proof(50000,250000,"request-stale-001"),admin),/cambio/);
Engine.attachTransferProof(state,remainder.id,proof(50000,150000,"request-second-001"),admin);
const last=state.bankReconciliation.find(r=>!r.attachment);
assert.equal(last.amount,100000);
Engine.attachTransferProof(state,last.id,proof(100000,100000,"request-third-001"),admin);
assert.equal(state.bankReconciliation.length,3);
assert.equal(state.bankReconciliation.reduce((n,r)=>n+r.amount,0),250000);
const restored=JSON.parse(JSON.stringify(state));
Engine.ensureTransferReconciliation(restored);
for(const r of [...restored.bankReconciliation]) {
  Engine.validateTransfer(restored,r.id,{bank:"Mercado Pago",operationNumber:r.id},admin);
  Engine.validateTransfer(restored,r.id,{bank:"Mercado Pago",operationNumber:r.id},admin);
}
assert.equal(restored.clients[0].balance,0);
assert.equal(restored.accounts.length,3);
assert.equal(restored.accounts.reduce((n,a)=>n+a.credit,0),250000);
assert.equal(restored.orders[0].code,"PED-TEST");
assert.equal(restored.orders[0].amount,250000);
console.log("PASS 3 partial proofs, conserved total/debt, independent validation, retry idempotency, stale/overamount rejected, serialization round trip");
const rejected = JSON.parse(JSON.stringify(state));
const rejectedId = rejected.bankReconciliation[0].id;
Engine.rejectTransferProof(rejected,rejectedId,{reason:"Comprobante ilegible"},admin);
assert.equal(rejected.clients[0].balance,250000,"Rejection does not pay debt");
assert.equal(rejected.bankReconciliation.length,3);
for (const r of rejected.bankReconciliation.filter(r=>r.id!==rejectedId)) {
  Engine.validateTransfer(rejected,r.id,{bank:"Mercado Pago",operationNumber:r.id},admin);
}
assert.equal(rejected.clients[0].balance,rejected.bankReconciliation.find(r=>r.id===rejectedId).amount);
const legacy={orders:[],clients:[],accounts:[],bankReconciliation:[{id:"LEGACY",amount:10,status:Engine.TRANSFER_STATUS.PENDING}]};
Engine.attachTransferProof(legacy,"LEGACY",{attachment:{url:"/test/legacy.pdf",filename:"legacy.pdf"}},admin);
assert.equal(legacy.bankReconciliation[0].amount,10,"Old clients can still attach a full proof");
for(const amount of [0,-1,NaN,Infinity,1.001]) {
  assert.throws(()=>Engine.checkTransferProof({amount:10,status:Engine.TRANSFER_STATUS.PENDING},{amount}));
}
console.log("PASS rejection leaves only its debt pending, old clients compatible, invalid precision rejected");
const triangular=JSON.parse(JSON.stringify(state));
triangular.suppliers=[{name:"Proveedor",balance:250000}];
for(const r of [...triangular.bankReconciliation]) {
  Engine.validateTransfer(triangular,r.id,{targetSupplier:"Proveedor",operationNumber:r.id},admin);
  Engine.validateTransfer(triangular,r.id,{targetSupplier:"Proveedor",operationNumber:r.id},admin);
}
assert.equal(triangular.supplierMovements.length,3);
assert.equal(triangular.supplierMovements.reduce((n,p)=>n+p.amount,0),250000);
assert.equal(triangular.suppliers[0].balance,250000,"Supplier reconciliation remains a separate action");
console.log("PASS three independent triangulated proofs, no duplicate supplier movements");
