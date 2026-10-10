import { budgetTotals, positive } from './domain.mjs';

const money=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:2}).format(n);
export function budgetAlerts(state) {
  const budget=state.profile.budget, t=budgetTotals(budget,state.costs), alerts=[];
  if(t.spent>budget) alerts.push({id:`budget:over:${budget}:${t.spent}`,title:`You are ${money(t.spent-budget)} over budget`,body:`Spent ${money(t.spent)} against ${money(budget)}. Review expenses before buying more.`});
  else if(budget>0&&t.spent>=budget*.8) alerts.push({id:`budget:near:${budget}:${t.spent}`,title:`You have used ${Math.round(t.spent/budget*100)}% of your budget`,body:`${money(t.remaining)} remains. Review upcoming purchases.`});
  if(t.planned>budget) alerts.push({id:`budget:plan:${budget}:${t.planned}`,title:`Your plan exceeds the budget by ${money(t.planned-budget)}`,body:'Review planned quantities and costs before purchasing.'});
  return alerts;
}

export function stockBalance(state,stockId) {
  const item=state.stock.find(x=>x.id===stockId);
  const reserved=(state.allocations||[]).filter(x=>x.stockId===stockId).reduce((s,x)=>s+x.quantity,0);
  return {onHand:item?.quantity||0,reserved,available:(item?.quantity||0)-reserved};
}
export function planBalance(state,plan) {
  const reserved=(state.allocations||[]).find(x=>x.fieldId===plan.fieldId&&x.stockId===plan.stockId)?.quantity||0;
  const used=(state.movements||[]).filter(x=>x.kind==='use'&&x.fieldId===plan.fieldId&&x.stockId===plan.stockId).reduce((s,x)=>s+x.quantity,0);
  return {reserved,used,shortage:Math.max(0,plan.required-reserved-used)};
}
export function reserveStock(state,{fieldId,stockId,quantity}) {
  positive(quantity,'Reservation',true);
  if(!state.fields.some(x=>x.id===fieldId)||!state.stock.some(x=>x.id===stockId))throw Error('Choose an existing field and resource.');
  const other=(state.allocations||[]).filter(x=>x.fieldId!==fieldId||x.stockId!==stockId);
  const reservedElsewhere=other.filter(x=>x.stockId===stockId).reduce((s,x)=>s+x.quantity,0);
  if(quantity+reservedElsewhere>state.stock.find(x=>x.id===stockId).quantity+1e-8)throw Error('Not enough unreserved stock. Reduce this reservation or receive more stock.');
  return {...state,allocations:quantity>0?[...other,{fieldId,stockId,quantity}]:other};
}
export function moveStock(state,movement) {
  const {id,stockId,fieldId,quantity,kind,cost,date}=movement;
  positive(quantity,'Quantity');positive(cost,'Cost',true);
  if(!['receive','use'].includes(kind))throw Error('Choose receive or use.');
  if((state.movements||[]).some(x=>x.id===id))return state;
  const item=state.stock.find(x=>x.id===stockId);if(!item)throw Error('Choose an existing resource.');
  if(fieldId&&!state.fields.some(x=>x.id===fieldId))throw Error('Choose an existing field.');
  const allocations=structuredClone(state.allocations||[]);
  if(kind==='use') {
    const own=allocations.find(x=>x.fieldId===fieldId&&x.stockId===stockId);
    if(quantity>stockBalance(state,stockId).available+(own?.quantity||0)+1e-8)throw Error('This quantity would use stock reserved for another field or exceed stock on hand.');
    if(own)own.quantity=Math.max(0,own.quantity-quantity);
  }
  if(kind==='receive'&&fieldId) {
    const plan=(state.inputPlans||[]).find(x=>x.fieldId===fieldId&&x.stockId===stockId);
    const reserve=plan?Math.min(quantity,planBalance(state,plan).shortage):0;
    const own=allocations.find(x=>x.fieldId===fieldId&&x.stockId===stockId);
    if(own)own.quantity+=reserve;else if(reserve>0)allocations.push({fieldId,stockId,quantity:reserve});
  }
  return {...state,stock:state.stock.map(x=>x.id===stockId?{...x,quantity:x.quantity+(kind==='receive'?quantity:-quantity)}:x),allocations:allocations.filter(x=>x.quantity>0),movements:[{...movement,name:item.name,unit:item.unit},...(state.movements||[])],costs:kind==='receive'&&cost>0?[...state.costs,{id:`receipt:${id}`,name:`Purchase: ${item.name}`,category:item.category,fieldId,planned:cost,actual:cost,date,movementId:id}]:state.costs};
}
export function setInputPlan(state,plan) {
  positive(plan.required,'Required quantity',true);positive(plan.unitPrice,'Unit price',true);
  if(!state.fields.some(x=>x.id===plan.fieldId)||!state.stock.some(x=>x.id===plan.stockId))throw Error('Choose a field and resource.');
  if(!plan.source.trim())throw Error('Record where the requirement came from.');
  return {...state,inputPlans:[...(state.inputPlans||[]).filter(x=>x.fieldId!==plan.fieldId||x.stockId!==plan.stockId),plan]};
}
export function syncInputCosts(state) {
  const costs=state.costs.filter(x=>!x.inputPlan);
  for(const plan of state.inputPlans||[]) {
    const stock=state.stock.find(x=>x.id===plan.stockId);
    if(!stock)continue;
    costs.push({id:`input:${plan.fieldId}:${plan.stockId}`,inputPlan:true,name:`Still to buy: ${stock.name}`,category:stock.category,fieldId:plan.fieldId,planned:Math.round(planBalance(state,plan).shortage*plan.unitPrice*100)/100,actual:0,date:state.profile.seasonStart});
  }
  return {...state,costs};
}
