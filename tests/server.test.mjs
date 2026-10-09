import test from 'node:test';
import assert from 'node:assert/strict';
import {makeServer} from '../backend/server.mjs';
import {Readable} from 'node:stream';
// Exercise the real HTTP handler without binding sockets (also works in restricted CI).
const apps=new Map();
async function server(t,options={}) {const id='http://127.0.0.1:'+apps.size;apps.set(id,makeServer({env:{},...options}));t.after(()=>apps.delete(id));return id;}
function fetch(url,options={}) {const parsed=new URL(url);const app=apps.get(parsed.origin);return new Promise((resolve,reject)=>{
  const req=Readable.from(options.body?[Buffer.from(options.body)]:[]);
  Object.assign(req,{url:parsed.pathname,method:options.method||'GET',headers:{host:parsed.host,...Object.fromEntries(Object.entries(options.headers||{}).map(([k,v])=>[k.toLowerCase(),v]))},socket:{remoteAddress:'127.0.0.1'}});
  let status;const res={writeHead(value){status=value;},end(body){resolve({status,json:async()=>JSON.parse(body)});}};
  try{app.emit('request',req,res);}catch(e){reject(e);}
});}
const post=(body,extra={})=>({method:'POST',headers:{'Content-Type':'application/json','x-farmwise-client':'web',...extra},body:JSON.stringify(body)});
test('status describes unconfigured AI without exposing secrets',async t=>{
  const url=await server(t);assert.deepEqual(await (await fetch(url+'/api/status')).json(),{soilAI:false,seasonal:true,mode:'local-pilot'});
});
test('cross-origin and malformed client requests are rejected',async t=>{
  const url=await server(t);assert.equal((await fetch(url+'/api/seasonal',post({}, {origin:'https://example.com'}))).status,403);
  assert.equal((await fetch(url+'/api/seasonal',{method:'POST',body:'{}'})).status,403);
});
test('unconfigured soil analysis reports unavailable',async t=>{
  const url=await server(t);assert.equal((await fetch(url+'/api/soil-assessment',post({image:'fake'}))).status,503);
});
test('invalid coordinates never reach weather provider',async t=>{
  const url=await server(t,{fetcher:()=>assert.fail('Provider must not be called')});
  assert.equal((await fetch(url+'/api/seasonal',post({latitude:100,longitude:30,start:'2026-10-01',end:'2026-11-01'}))).status,400);
});
test('seasonal endpoint returns aggregated values and caches requests',async t=>{
  let calls=0;const time=Array.from({length:30},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));
  const url=await server(t,{fetcher:async()=>{calls++;return {ok:true,json:async()=>({daily:{time,temperature_2m_mean:time.map(()=>24),precipitation_sum:time.map(()=>2)}})};}});
  const body={latitude:-23,longitude:30,start:'2026-10-01',end:'2026-10-30'};
  const r=await fetch(url+'/api/seasonal',post(body));assert.equal(r.status,200);const data=await r.json();assert.equal(data.rainfall,60);assert.equal(data.partial,false);
  await fetch(url+'/api/seasonal',post(body));assert.equal(calls,1);
});
test('configured photo analysis returns the frontend contract and keeps keys server-side',async t=>{
  const url=await server(t,{env:{ANTHROPIC_API_KEY:'test-only',ANTHROPIC_MODEL:'test-vision'},fetcher:async(endpoint,options)=>{
    assert.equal(endpoint,'https://api.anthropic.com/v1/messages');
    assert.equal(options.headers['x-api-key'],'test-only');
    assert.equal(JSON.parse(options.body).messages[0].content[0].source.media_type,'image/jpeg');
    return {ok:true,json:async()=>({content:[{type:'text',text:'Some surface cracks are visible. Confirm in the field.'}]})};
  }});
  const response=await fetch(url+'/api/soil-assessment',post({image:'data:image/jpeg;base64,YWJj'}));
  assert.deepEqual(await response.json(),{analysis:'Some surface cracks are visible. Confirm in the field.'});
});
test('provider failures return a useful error without credentials',async t=>{
  const url=await server(t,{fetcher:async()=>({ok:false})});
  const response=await fetch(url+'/api/seasonal',post({latitude:-23,longitude:30,start:'2026-10-01',end:'2026-11-01'}));
  assert.equal(response.status,502);assert.match((await response.json()).error,/unavailable/);
});
