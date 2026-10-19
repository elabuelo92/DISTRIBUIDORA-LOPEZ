"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {spawn}=require('node:child_process');
const Delivery=require('../delivery-engine'),Order=require('../order-engine');
const fixtureSource=fs.readFileSync(require.resolve('./smoke-collections-v136'),'utf8');
const ctx=vm.createContext({Delivery,Order});
vm.runInContext(fixtureSource.slice(fixtureSource.indexOf('function fixture('),fixtureSource.indexOf('function collect(')),ctx);
const {state,route,driver}=ctx.fixture(1);
Delivery.collectAndDeliver(state,state.orders[0].code,{method:'Transferencia Pendiente',amountPaid:1000,
  requestId:'P5-HTTP-000001',deliveredItems:[{productCode:'P-1',deliveredQty:1,returnedQty:0}]},driver);
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'dl-p5-http-'));
const file=path.join(dir,'demo-state.json');
fs.writeFileSync(file,JSON.stringify({version:Date.now(),state}));
const port=23000+Math.floor(Math.random()*1000),base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,[path.join(root,'server.js')],{cwd:root,env:{...process.env,
 DL_HOST:'127.0.0.1',DL_PORT:String(port),PORT:String(port),DATA_DIR:dir,STATE_FILE:file,
 USERS_FILE:path.join(dir,'users.json'),DL_MAINTENANCE_FILE:path.join(dir,'maintenance-mode.json'),
 DL_VERSION:'8790-173-p5-test',DL_LICENSE_ENFORCEMENT:'disabled',DL_INTEGRITY_ENFORCE:'warn',DL_DEFAULT_PASSWORD:'SmokeTest2026!'},stdio:['ignore','pipe','pipe']});
let log='';child.stdout.on('data',x=>{log=(log+x).slice(-1500)});child.stderr.on('data',x=>{log=(log+x).slice(-1500)});
async function post(endpoint,input,cookie=''){
 const r=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(input)});
 return {status:r.status,body:await r.json(),cookie:String(r.headers.get('set-cookie')||'').split(';')[0]};
}
(async()=>{try{
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,log);
 const input={username:'admin1',password:'SmokeTest2026!',device:{id:'P5-TEST-ADMIN',label:'Prueba aislada',os:'Node',model:'Test'}};
 let login=await post('/api/login',input);
 if(login.status===428){input.legalAcceptance={accepted:true,version:login.body.legal.currentVersion,hash:login.body.legal.hash};login=await post('/api/login',input);}
 assert.equal(login.status,200,JSON.stringify(login.body));
 const before=JSON.parse(fs.readFileSync(file,'utf8')).state;
 const endpoint='/api/delivery/routes/'+encodeURIComponent(route.id)+'/close';
 const data={deviceId:'P5-TEST-ADMIN',reportedCash:0,reportedTransfer:0,gps:{lat:-31.4,lng:-64.2,accuracy:10}};
 const results=await Promise.all([post(endpoint,data,login.cookie),post(endpoint,data,login.cookie)]);
 assert.equal(results.filter(x=>x.status===200).length,1,JSON.stringify(results));
 const ok=results.find(x=>x.status===200).body;
 assert.equal(ok.closure.expectedTransfer,0);assert.equal(ok.closure.totalDifference,0);
 assert.equal(ok.closure.promisedTransfer,1000);
 const after=JSON.parse(fs.readFileSync(file,'utf8')).state;
 assert.equal(after.deliveryClosures.filter(c=>c.routeId===route.id).length,1);
 for(const key of ['accounts','orders','stockMovements','clients']) assert.deepEqual(after[key],before[key],key);
 console.log('PASS P5 HTTP: one persisted closure for two concurrent requests, promise is not cash difference, orders/accounts/stock/clients unchanged. Temporary synthetic data only.');
}finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve)});}})().catch(e=>{console.error(e);process.exitCode=1});
