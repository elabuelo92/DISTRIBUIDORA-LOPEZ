"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Delivery = require('../delivery-engine');
const Order = require('../order-engine');
const Account = require('../account-engine');
const fixtureSource = fs.readFileSync(require.resolve('./smoke-collections-v136'), 'utf8');
const fixtureScope = vm.createContext({Delivery, Order});
vm.runInContext(fixtureSource.slice(fixtureSource.indexOf('function fixture('), fixtureSource.indexOf('function collect(')), fixtureScope);
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
function manifest(state) {
  const ctx = vm.createContext({state, numeric:(n,f)=>Number(n)||f});
  vm.runInContext(app.slice(app.indexOf('function deliveryStopFinancialCells('), app.indexOf('async function exportDeliveryCollectionsManifest(')), ctx);
  return ctx.deliveryCollectionsManifestRows('', state.deliveryRoutes[0].id)[0];
}
for (const test of [
  {cash:0,transfer:0,promise:1000},
  {cash:400,transfer:0,promise:600},
  {cash:400,transfer:200,promise:400},
  {cash:400,transfer:600,promise:0}
]) {
  const {state,route,driver} = fixtureScope.fixture(1);
  const order=state.orders[0], client=state.clients[0];
  const input={requestId:'P5-TEST-000001',method:'Transferencia Pendiente',
    paymentSplit:{cashAmount:test.cash,transferAmount:test.transfer,creditAmount:test.promise},
    deliveredItems:[{productCode:'P-1',deliveredQty:1,returnedQty:0}]};
  if(test.transfer) input.transferReceipt={attachment:{url:'/test/p5.png',filename:'p5.png'}};
  Delivery.collectAndDeliver(state,order.code,input,driver);
  const accountBefore=JSON.stringify(state.accounts), stockBefore=JSON.stringify(state.stockMovements);
  Delivery.collectAndDeliver(state,order.code,input,driver);
  assert.equal(JSON.stringify(state.accounts),accountBefore,'Retry duplicates no payment');
  assert.equal(order.collections.length,1);
  assert.equal(client.balance,test.transfer+test.promise,'Only cash settles before bank validation');
  const row=manifest(state);
  assert.equal(row[3],test.cash);assert.equal(row[4],test.transfer);
  assert.equal(row[6],test.promise);assert.equal(row[8],0);
  const result=Delivery.closeRoute(state,route.id,{reportedCash:test.cash,reportedTransfer:test.transfer},driver);
  assert.equal(result.closure.totalDifference,0);
  assert.equal(result.closure.promisedTransfer,test.promise);
  assert.equal(result.closure.expectedTransfer,test.transfer);
  const savedClosure=JSON.stringify(result.closure);
  assert.throws(()=>Delivery.closeRoute(state,route.id,{reportedCash:0},driver),/cierre diario/);
  if(test.transfer) {
    const proof=order.collection.transferReceipt.id;
    Account.validateTransfer(state,proof,{bank:'Mercado Pago',operationNumber:'P5-BANK-001'},{user:'Admin',role:'admin'});
    Account.validateTransfer(state,proof,{bank:'Mercado Pago',operationNumber:'P5-BANK-001'},{user:'Admin',role:'admin'});
    assert.equal(client.balance,test.promise);
    assert.equal(state.accounts.filter(a=>a.transferId===proof).length,1);
  }
  assert.equal(JSON.stringify(route.closure),savedClosure,'Validation cannot rewrite the closed route');
  assert.equal(JSON.stringify(state.stockMovements),stockBefore);
  assert.equal(manifest(state)[8],0);
}
const caseState={orders:[{code:'PED-3785',client:'Caso P5',amount:107443.72}],deliveryRoutes:[{
  id:'P5-HISTORICAL',closure:{id:'CLOSED',expectedTransfer:2323599.59,reportedTransfer:2323599.59,totalDifference:614.58},
  stops:[{orderCode:'PED-3785',status:'Entregado',collection:{collectibleAmount:107443.72,cashAmount:0,transferAmount:0,
    transferPendingAmount:107443.72,creditAmount:0}}]}]};
const frozen=JSON.stringify(caseState);
assert.equal(manifest(caseState)[6],107443.72);assert.equal(manifest(caseState)[8],0);
assert.equal(JSON.stringify(caseState),frozen,'Historical report is read-only');
const legacy={transferTotal:125,stops:[{collection:{amountPaid:125,method:'Transferencia'}}]};
assert.equal(Delivery.routeTransferSummary(legacy).expectedTransfer,125,'Unknown legacy details are not invented');
assert.equal(Delivery.routeClosureSummary({cashTotal:100,transferTotal:0,stops:[]},{reportedCash:90}).cashDifference,-10);
assert.match(app,/deliveryClosureTransferReported"\)\.value = String\(DeliveryEngine.routeTransferSummary\(route\).expectedTransfer\)/);
console.log('PASS P5 workflow: promise/mixed/receipt, idempotent collection and bank validation, immutable closure/stock, PED-3785 snapshot, legacy fallback, true cash discrepancies.');
