"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function fn(name){const a=source.search(new RegExp('^function '+name+'\\(','m'));assert.ok(a>=0);const b=source.slice(a+1).search(/^function |^async function /m);return source.slice(a,a+1+b);}
const fields=Object.fromEntries(["mobileProductQty","mobileProductDiscount","mobileProductDiscountMotive","mobileCommercialChangeType","mobileProductSearch","mobileClientSearch"].map(id=>[id,{value:""}]));
const alerts=[];
const ctx=vm.createContext({state:{products:[{name:"Aceite",codigo_producto:"A",price:2000},{name:"Arroz",codigo_producto:"R",price:1000}]},byId:id=>fields[id],window:{alert:s=>alerts.push(s)},Number,Math,
 productWithUserPrice:p=>p,OrderEngine:{authorizedOfferForLine:()=>null,inventory:()=>({available:100})},renderMobileCart:()=>{},renderMobileSummary:()=>{},renderMobileProductInfo:()=>{},clearMobileCommercialRequest:()=>{}});
vm.runInContext('let mobileCart={},mobileLineDiscounts={},mobileProduct="Aceite";'+["getCartSummary","addSelectedMobileProduct","mobileCommercialRequestPayload","clearMobileOrderDraft"].map(fn).join('\n'),ctx);
fields.mobileProductQty.value="2";fields.mobileProductDiscount.value="5";fields.mobileProductDiscountMotive.value="Volumen";
ctx.addSelectedMobileProduct();
assert.equal(ctx.getCartSummary().total,4000,"Pending discount cannot change vigente total");
let req=ctx.mobileCommercialRequestPayload();assert.equal(req.lineDiscounts[0].discountPct,5);assert.equal(req.lineDiscounts[0].productCode,"A");
vm.runInContext('mobileProduct="Arroz"',ctx);
fields.mobileProductQty.value="3";fields.mobileProductDiscount.value="8";fields.mobileProductDiscountMotive.value="Comercial";ctx.addSelectedMobileProduct();
req=ctx.mobileCommercialRequestPayload();assert.equal(req.lineDiscounts.length,2);assert.equal(req.lineDiscounts[1].discountPct,8);assert.equal(ctx.getCartSummary().total,7000);
fields.mobileCommercialChangeType.value="general_discount";assert.throws(()=>ctx.mobileCommercialRequestPayload(),/otra solicitud/);fields.mobileCommercialChangeType.value="";
fields.mobileProductDiscount.value="101";ctx.addSelectedMobileProduct();assert.equal(alerts.length,1);assert.equal(ctx.getCartSummary().total,7000);
ctx.clearMobileOrderDraft();assert.equal(ctx.getCartSummary().total,0);assert.equal(ctx.mobileCommercialRequestPayload(),null);
console.log("PASS UI: independent product percentages, original total, invalid input, no conflicting legacy request, clean client draft.");
