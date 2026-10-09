import test from 'node:test';
import assert from 'node:assert/strict';
import {fertiliserNeed,irrigationNeed,budgetTotals,serviceState,deliveredCost,germination,seasonalSummary} from '../frontend/src/domain.mjs';
test('fertiliser rounds purchases to whole bags after allocated stock',()=>{
  assert.deepEqual(fertiliserNeed(.5,210,50,20),{kg:105,bags:3,buyKg:85,buyBags:2});
  assert.equal(fertiliserNeed(1,100,50,200).buyBags,0);
  assert.throws(()=>fertiliserNeed(-1,100,50));
});
test('irrigation accounts for rainfall, hectares and efficiency',()=>{
  assert.deepEqual(irrigationNeed(.5,5,1,1,80),{netMm:4,litres:25000});
  assert.equal(irrigationNeed(.5,5,1,10,80).litres,0);
  assert.throws(()=>irrigationNeed(1,5,1,0,0));assert.throws(()=>irrigationNeed(1,5,1,0,101));
});
test('budget preserves overspending instead of hiding it',()=>{
  assert.deepEqual(budgetTotals(100,[{planned:80,actual:120}]),{planned:80,spent:120,remaining:-20,unallocated:20});
});
test('maintenance becomes due from either hours or calendar date',()=>{
  assert.equal(serviceState({hours:245,nextHours:250,dueDate:''},'2026-10-09').status,'Due soon');
  assert.equal(serviceState({hours:251,nextHours:250,dueDate:''},'2026-10-09').status,'Due now');
  assert.equal(serviceState({hours:0,nextHours:null,dueDate:'2026-10-09'},'2026-10-09').status,'Due now');
  assert.equal(serviceState({hours:0,nextHours:null,dueDate:'2026-11-01'},'2026-10-09').status,'Up to date');
});
test('quotes include delivery and seed checks reject impossible counts',()=>{
  assert.equal(deliveredCost(400,2,150),950); assert.equal(germination(18,20),90);
  assert.throws(()=>germination(21,20));assert.throws(()=>germination(0,0));
});
test('season summary needs meaningful coverage and labels partial periods',()=>{
  const time=Array.from({length:40},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));
  const daily={time,temperature_2m_mean:time.map(()=>25),precipitation_sum:time.map(()=>2)};
  const result=seasonalSummary({daily},'2026-10-05','2026-12-01');
  assert.equal(result.days,36);assert.equal(result.rainfall,72);assert.equal(result.temperature,25);assert.equal(result.partial,true);
  assert.throws(()=>seasonalSummary({daily},'2027-01-01','2027-02-01'));
});
