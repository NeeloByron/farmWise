import test from 'node:test';
import assert from 'node:assert/strict';
import {budgetAlerts,stockBalance,planBalance,reserveStock,moveStock,setInputPlan,syncInputCosts} from '../frontend/src/workflows.mjs';
import {validateBackup} from '../frontend/src/backup.mjs';
const farm=()=>({version:1,demo:false,profile:{name:'Farmer',farm:'Farm',location:'Limpopo',latitude:-23,longitude:30,land:2,season:'Summer',seasonStart:'2026-10-01',seasonEnd:'2027-01-01',budget:8000},fields:['a','b'].map(id=>({id,name:id,area:.5,crop:'Maize',variety:'',planted:'2026-10-01',harvest:'',status:'Planned',seedRate:20,seedUnit:'kg/ha'})),stock:[{id:'fert',name:'Fertiliser',category:'Fertiliser',quantity:50,unit:'kg',reorder:10}],tasks:[],costs:[],equipment:[],services:[],soil:[],seedTests:[],quotes:[],groups:[],outlooks:[],readAlerts:[]});
test('budget alerts cover 80%, over budget, zero budget, planned overspend and correction',()=>{
  let s=farm();s.costs=[{actual:6399,planned:0}];assert.equal(budgetAlerts(s).length,0);
  s.costs[0].actual=6400;assert.match(budgetAlerts(s)[0].title,/80%/);
  s.costs[0].actual=8300;assert.match(budgetAlerts(s)[0].title,/300.*over budget/);
  s.costs=[];assert.equal(budgetAlerts(s).length,0);
  s.profile.budget=0;s.costs=[{actual:1,planned:2}];assert.equal(budgetAlerts(s).length,2);
});
test('two fields cannot reserve or use the same stock',()=>{
  let s=reserveStock(farm(),{fieldId:'a',stockId:'fert',quantity:40});
  assert.equal(stockBalance(s,'fert').available,10);
  assert.throws(()=>reserveStock(s,{fieldId:'b',stockId:'fert',quantity:11}),/Not enough/);
  const use={id:'u',kind:'use',fieldId:'b',stockId:'fert',quantity:20,cost:0,date:'2026-10-10',notes:''};
  assert.throws(()=>moveStock(s,use),/reserved/);
  s=moveStock(s,{...use,fieldId:'a',quantity:30});
  assert.equal(s.stock[0].quantity,20);assert.equal(stockBalance(s,'fert').reserved,10);assert.equal(s.costs.length,0);
});
test('plan, reserve, purchase and use keep quantities and costs consistent',()=>{
  let s=setInputPlan(farm(),{fieldId:'a',stockId:'fert',required:100,unitPrice:12,source:'Adviser'});
  s=reserveStock(s,{fieldId:'a',stockId:'fert',quantity:50});s=syncInputCosts(s);
  assert.equal(s.costs[0].planned,600);
  const receipt={id:'purchase',kind:'receive',fieldId:'a',stockId:'fert',quantity:50,cost:600,date:'2026-10-10',notes:'Supplier'};
  s=syncInputCosts(moveStock(s,receipt));assert.equal(planBalance(s,s.inputPlans[0]).shortage,0);
  assert.equal(s.costs.reduce((a,c)=>a+c.actual,0),600);assert.equal(s.costs.reduce((a,c)=>a+c.planned,0),600);
  assert.deepEqual(moveStock(s,receipt),s);
  s=syncInputCosts(moveStock(s,{...receipt,id:'usage',kind:'use',quantity:100,cost:0}));
  assert.equal(s.stock[0].quantity,0);assert.equal(planBalance(s,s.inputPlans[0]).shortage,0);
  assert.equal(s.costs.reduce((a,c)=>a+c.actual,0),600);
  assert.equal(validateBackup(JSON.parse(JSON.stringify(s))),true);
});
test('restores reject over-allocation, duplicate plans and invalid movement data',()=>{
  const s=farm();s.allocations=[{stockId:'fert',fieldId:'a',quantity:51}];assert.equal(validateBackup(s),false);
  s.allocations=[];s.inputPlans=[{stockId:'fert',fieldId:'a',required:1,unitPrice:1,source:'test'}];s.inputPlans.push({...s.inputPlans[0]});assert.equal(validateBackup(s),false);
  s.inputPlans=[];s.movements=[null];assert.equal(validateBackup(s),false);
});
