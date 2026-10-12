"use strict";
const assert=require("node:assert/strict");
const Delivery=require("../delivery-engine");
const Account=require("../account-engine");
const Order=require("../order-engine");
function fixture() {
 const state={clients:[{codigo_cliente:"C1",name:"Cliente",balance:0,status:"Activo",latitud:-31.4,longitud:-64.2}],
 orders:[{code:"PED-MULTI",client:"Cliente",amount:1000,status:Order.STATUS.READY_DISPATCH,inventoryMode:"direct",
 items:[{productCode:"P1",name:"Producto",requestedQty:1,unitPrice:1000,lineTotal:1000}],assembly:{orderNumber:1,bultosConfirmed:1,label:{generated:true,scannerOptional:true}},trace:[]}],
 products:[],sellers:[],activity:[],accounts:[],deliveryRoutes:[],deliveryAudit:[],deliveryClosures:[],stockMovements:[],shortages:[],notifications:[]};
 const driver={user:"Repartidor",username:"reparto1",role:"driver",deviceId:"DEVICE1",deviceLabel:"Repartidor",gps:{lat:-31.4,lng:-64.2,accuracy:10}};
 const route=Delivery.createPlannedRoute(state,{orderCodes:["PED-MULTI"],day:"2026-10-12",zone:"Centro",driverUser:"reparto1",driverLabel:"Repartidor"},driver);
 Delivery.publishRoute(state,route.id,driver);Delivery.claimRoute(state,route.id,driver);
 return {state,driver,route};
}
const proof=(amount,id)=>({amount,bank:"Mercado Pago",attachment:{url:`/test/${id}.pdf`,filename:`${id}.pdf`}});
const input={requestId:"driver-multi-test-001",method:"Mixto",paymentSplit:{cashAmount:400,transferAmount:500,creditAmount:100},
 deliveredItems:[{productCode:"P1",deliveredQty:1,returnedQty:0}],transferReceipts:[proof(200,"a"),proof(300,"b")]};
const data=fixture();
for(const transferReceipts of [[proof(100,"a"),proof(300,"b")],[proof(200,"a"),proof(300,"a")],[proof(-1,"a"),proof(501,"b")],[]]) {
 assert.throws(()=>Delivery.collectAndDeliver(data.state,"PED-MULTI",{...input,transferReceipts},data.driver));
 assert.equal(data.state.clients[0].balance,0);assert.equal(data.state.orders[0].collections?.length||0,0);
}
const result=Delivery.collectAndDeliver(data.state,"PED-MULTI",input,data.driver);
assert.equal(result.order.collections.length,1);
assert.equal(result.order.transferReceipts.length,2);
assert.equal(data.state.bankReconciliation.length,2);
assert.equal(data.state.clients[0].balance,600);
assert.equal(data.route.cashTotal,400);assert.equal(data.route.transferTotal,500);
const unchanged=JSON.stringify({accounts:data.state.accounts,receipts:data.state.bankReconciliation,collections:result.order.collections});
assert.equal(Delivery.collectAndDeliver(data.state,"PED-MULTI",input,data.driver).repeated,true);
assert.equal(JSON.stringify({accounts:data.state.accounts,receipts:data.state.bankReconciliation,collections:result.order.collections}),unchanged);
assert.throws(()=>Delivery.collectAndDeliver(data.state,"PED-MULTI",{...input,observations:"cambio"},data.driver),/reintento/);
assert.throws(()=>Delivery.collectAndDeliver(data.state,"PED-MULTI",input,{...data.driver,deviceId:"OTRO"}));
const restored=JSON.parse(JSON.stringify(data.state));
assert.equal(Delivery.collectAndDeliver(restored,"PED-MULTI",input,data.driver).repeated,true);
for(const receipt of [...restored.bankReconciliation]) {
 Account.validateTransfer(restored,receipt.id,{bank:"Mercado Pago",operationNumber:receipt.id},{role:"admin",user:"Admin"});
 Account.validateTransfer(restored,receipt.id,{bank:"Mercado Pago",operationNumber:receipt.id},{role:"admin",user:"Admin"});
}
assert.equal(restored.clients[0].balance,100);
assert.equal(restored.accounts.filter(a=>a.credit>0).reduce((s,a)=>s+a.credit,0),900,"Cash 400 plus validated transfers 500, once each");
assert.equal(restored.orders[0].amount,1000);
console.log("PASS driver multiple proofs: totals, balance, independent validation, retry, persistence, changed retry, wrong device and invalid splits");
module.exports={fixture,input};
