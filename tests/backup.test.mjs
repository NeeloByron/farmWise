import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBackup} from '../frontend/src/backup.mjs';
const valid=()=>({version:1,demo:false,profile:{name:'Test farmer',farm:'Test farm',location:'Limpopo',latitude:-23,longitude:30,land:1,season:'Summer',seasonStart:'2026-10-01',seasonEnd:'2027-01-01',budget:8000},fields:[],tasks:[],costs:[],stock:[],equipment:[],services:[],soil:[],seedTests:[],quotes:[],groups:[],outlooks:[],readAlerts:[]});
test('valid empty-farm backup round trips',()=>assert.equal(validateBackup(JSON.parse(JSON.stringify(valid()))),true));
test('reject invalid records instead of crashing or silently accepting them',()=>{
  const x=valid();x.costs=[{id:'1',name:'Seed',category:'Seeds',fieldId:'',planned:10,actual:-1,date:'2026-10-01'}];assert.equal(validateBackup(x),false);
  assert.equal(validateBackup({...valid(),fields:[null]}),false);assert.equal(validateBackup({...valid(),profile:{}}),false);
});
test('reject duplicate IDs and non-image photo URLs',()=>{
  const x=valid();const stock={id:'1',name:'Seed',category:'Seeds',quantity:1,unit:'kg',reorder:0};x.stock=[stock,stock];assert.equal(validateBackup(x),false);
  const y=valid();y.soil=[{id:'1',fieldId:'a',date:'2026-10-01',notes:'Dry',photo:'https://example.com/tracker',ph:'',lab:'',analysis:''}];assert.equal(validateBackup(y),false);
});
