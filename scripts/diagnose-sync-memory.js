"use strict";
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const snapshot = process.argv[2];
if (!snapshot) throw new Error('Read-only snapshot path required');
if (!process.argv.includes('--worker')) {
  for (const cap of [4, 2]) {
    const result = spawnSync(process.execPath, ['--max-old-space-size=768', __filename, snapshot, '--worker', String(cap)], { encoding:'utf8', timeout:120000, maxBuffer:1000000 });
    console.log(JSON.stringify({cap, exitCode:result.status, signal:result.signal, output:result.stdout.trim(), error:result.stderr.slice(-800)}));
  }
} else {
  const cap = Number(process.argv.at(-1));
  const raw = fs.readFileSync(snapshot);
  const originalHash = crypto.createHash('sha256').update(raw).digest('hex');
  const payload = JSON.parse(raw);
  const ctx = vm.createContext({Buffer, crypto, stateForUser:state=>state});
  vm.runInContext(source.slice(source.indexOf('function stateSectionsResponse('), source.indexOf('function sendProjectedStateResponse(')),ctx);
  const gzip = promisify(zlib.gzip);
  const start = performance.now();
  let peakRss=0,peakHeap=0,peakExternal=0;
  const sample=()=>{const m=process.memoryUsage();peakRss=Math.max(peakRss,m.rss);peakHeap=Math.max(peakHeap,m.heapUsed);peakExternal=Math.max(peakExternal,m.external);};
  const timer=setInterval(sample,20);
  let next=0;
  const hashes=[];
  async function worker(){
    while(next++ < 4){
      const response=ctx.stateSectionsResponse(payload,{role:'admin'},null,0);
      sample();
      hashes.push(crypto.createHash('sha256').update(response).digest('hex'));
      const compressed=await gzip(response,{chunkSize:262144});
      if(!compressed.length)throw new Error('Empty gzip');
      sample();
    }
  }
  Promise.all(Array.from({length:cap},worker)).then(()=>{
    clearInterval(timer);
    if(new Set(hashes).size!==1 || hashes.length!==4)throw new Error('Responses differ');
    if(crypto.createHash('sha256').update(fs.readFileSync(snapshot)).digest('hex')!==originalHash)throw new Error('Snapshot changed');
    console.log(JSON.stringify({cap,requests:hashes.length,responseHash:hashes[0],snapshotUnchanged:true,elapsedMs:Math.round(performance.now()-start),peakRss,peakHeap,peakExternal,scope:'isolated admin serialization+gzip; not full HTTP workload'}));
  }).catch(e=>{clearInterval(timer);console.error(e);process.exitCode=1;});
}
