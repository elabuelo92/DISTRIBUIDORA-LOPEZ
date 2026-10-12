"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "dl-proofs-test-"));
const port = 25000 + crypto.randomInt(1000);
const base = `http://127.0.0.1:${port}`;
const password = crypto.randomBytes(18).toString("hex");
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
const stateFile = path.join(temp, "demo-state.json");
fs.writeFileSync(path.join(temp, "users.json"), JSON.stringify({users:["admin", "seller"].map(role => ({username:role, name:role, role, active:true, salt, passwordHash}))}));
fs.writeFileSync(stateFile, JSON.stringify({version:1,state:{
  clients:[{codigo_cliente:"C1",name:"Cliente",balance:250000,saldo_actual:250000,saldo_inicial:250000}],
  orders:[{code:"PED-PROOFS",client:"Cliente",status:"Entregado",amount:250000,items:[],transferReceipts:[{id:"TRF-TEST",amount:250000,bank:"Mercado Pago",status:"Pendiente de Transferencia"}]}],
  accounts:[],products:[],suppliers:[],deliveryRoutes:[]
}}));
const child = spawn(process.execPath,[path.join(root,"server.js")],{cwd:root,env:{...process.env,
  DL_HOST:"127.0.0.1",DL_PORT:String(port),PORT:String(port),DATA_DIR:temp,STATE_FILE:stateFile,
  USERS_FILE:path.join(temp,"users.json"),DL_VERSION:"8790-168-test",DL_LICENSE_ENFORCEMENT:"disabled",DL_INTEGRITY_ENFORCE:"warn"
},stdio:["ignore","pipe","pipe"]});
let logs="";
child.stdout.on("data",c=>{logs+=c;}); child.stderr.on("data",c=>{logs+=c;});
const read=()=>JSON.parse(fs.readFileSync(stateFile,"utf8")).state;
const uploads=()=>fs.existsSync(path.join(temp,"delivery-uploads"))?fs.readdirSync(path.join(temp,"delivery-uploads")).length:0;
async function request(url, body, cookie="") {
  const response=await fetch(base+url,{method:"POST",headers:{"Content-Type":"application/json",Cookie:cookie},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  return {status:response.status,body:await response.json(),cookie:String(response.headers.get("set-cookie")||"").split(";")[0]};
}
async function login(username) {
  const input={username,password,device:{id:`PROOF-${username}`,label:"Synthetic proof test",model:"Node",os:process.platform,appVersion:"8790-168"}};
  let r=await request("/api/login",input);
  if(r.status===428){input.legalAcceptance={accepted:true,version:r.body.legal.currentVersion,hash:r.body.legal.hash};r=await request("/api/login",input);}
  assert.equal(r.status,200,r.body.error);return r.cookie;
}
(async()=>{
  try {
    let healthy=false;
    for(let i=0;i<120;i++) {
      try {healthy=(await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)})).ok;}catch{}
      if(healthy)break;await new Promise(r=>setTimeout(r,100));
    }
    assert.ok(healthy,logs.slice(-1500));
    const admin=await login("admin"),seller=await login("seller");
    const url="/api/bank-reconciliation/transfers/TRF-TEST/proof";
    const proof={amount:100000,expectedAmount:250000,proofRequestId:crypto.randomUUID(),dataUrl:"data:application/pdf;base64,"+Buffer.from("%PDF-1.4\nsynthetic proof").toString("base64")};
    assert.equal((await request(url,proof)).status,401);
    assert.equal((await request(url,proof,seller)).status,403);
    assert.equal(uploads(),0);
    const before=read();
    assert.equal((await request(url,{...proof,amount:250001},admin)).status,400);
    assert.equal(uploads(),0);
    assert.deepEqual(read(),before,"Invalid amount cannot persist changes");
    const r=await request(url,proof,admin);assert.equal(r.status,200,r.body.error);
    const after=read();
    assert.equal(uploads(),1);
    assert.equal(after.bankReconciliation.length,2);
    assert.equal(after.clients[0].balance,250000);
    assert.equal(after.orders[0].transferReceipts.reduce((n,t)=>n+t.amount,0),250000);
    const retry=await request(url,proof,admin);assert.equal(retry.status,200,retry.body.error);
    assert.equal(retry.body.repeated,true);
    assert.deepEqual(read(),after,"Retry cannot persist duplicate audit or financial records");
    assert.equal(uploads(),1,"Retry cannot leave duplicate files");
    assert.equal((await request(url,{...proof,dataUrl:proof.dataUrl+"AAAA"},admin)).status,400);
    const rest=after.bankReconciliation.find(t=>t.id!=="TRF-TEST");
    const restUrl=`/api/bank-reconciliation/transfers/${rest.id}/proof`;
    const second={...proof,amount:50000,expectedAmount:150000,proofRequestId:crypto.randomUUID()};
    const attempts=await Promise.all([request(restUrl,second,admin),request(restUrl,second,admin)]);
    attempts.forEach(a=>assert.equal(a.status,200,a.body.error));
    assert.equal(uploads(),2);
    assert.equal(read().bankReconciliation.length,3);
    assert.equal(read().bankReconciliation.reduce((n,t)=>n+t.amount,0),250000);
    assert.equal(read().accounts.length,0,"Uploading is not a payment validation");
    assert.equal(read().orders[0].amount,250000);
    console.log("PASS HTTP: role restrictions, partial proofs, concurrent retries, no duplicate files/audit, total and debt conserved");
  } finally {
    if(child.exitCode===null){const closed=once(child,"exit");child.kill();await closed;}
    const resolved=fs.realpathSync(temp);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir())+path.sep+"dl-proofs-test-"));
    fs.rmSync(resolved,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
