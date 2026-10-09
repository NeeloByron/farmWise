import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler } from '../backend/server.mjs';
import statusHandler from '../api/status.js';

function request(handler, path, body, origin='https://farmwise.vercel.app') {
  return new Promise((resolve,reject)=>{
    let status;
    const req={url:path,method:body===undefined?'GET':'POST',body,headers:{host:'farmwise.vercel.app',origin,'content-type':'application/json','x-farmwise-client':'web','x-forwarded-for':'192.0.2.1'}};
    Promise.resolve(handler(req,{writeHead(value){status=value;},end(value){resolve({status,body:JSON.parse(value)});}})).catch(reject);
  });
}

test('Vercel entry point serves status without starting a listener',async()=>{
  const response=await request(statusHandler,'/api/status');
  assert.equal(response.status,200);
  assert.equal(response.body.mode,'hosted-pilot');
});

test('hosted seasonal handler accepts Vercel parsed bodies and aggregates provider data',async()=>{
  const time=Array.from({length:30},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));
  const handler=makeHandler({hosted:true,env:{},fetcher:async()=>({ok:true,json:async()=>({daily:{time,temperature_2m_mean:time.map(()=>24),precipitation_sum:time.map(()=>2)}})})});
  const response=await request(handler,'/api/seasonal',{latitude:-23,longitude:30,start:'2026-10-01',end:'2026-10-30'});
  assert.equal(response.status,200);
  assert.equal(response.body.rainfall,60);
});

test('hosted handler rejects foreign origins and oversized parsed bodies before provider calls',async()=>{
  const handler=makeHandler({hosted:true,env:{},fetcher:()=>assert.fail('Provider must not be called')});
  assert.equal((await request(handler,'/api/seasonal',{},'https://other.example')).status,403);
  assert.equal((await request(handler,'/api/soil-assessment',{image:'x'.repeat(2_000_001)})).status,413);
  assert.equal((await request(handler,'/api/seasonal','{broken')).status,400);
});

test('hosted soil endpoint preserves configured AI response contract',async()=>{
  const handler=makeHandler({hosted:true,env:{ANTHROPIC_API_KEY:'test',ANTHROPIC_MODEL:'test-model'},fetcher:async()=>({ok:true,json:async()=>({content:[{type:'text',text:'Surface residue is visible.'}]})})});
  const response=await request(handler,'/api/soil-assessment',{image:'data:image/jpeg;base64,YWJj'});
  assert.equal(response.status,200);
  assert.equal(response.body.analysis,'Surface residue is visible.');
});
