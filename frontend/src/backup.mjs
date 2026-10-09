// Validate persisted/imported data before allowing it into the UI.
const text=x=>typeof x==='string'&&x.length<=10000;
const amount=x=>Number.isFinite(x)&&x>=0;
const positive=x=>amount(x)&&x>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const optionalDate=x=>x===''||date(x);
const bool=x=>typeof x==='boolean';
const oneOf=(...values)=>x=>values.includes(x);
const object=(x,shape)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.entries(shape).every(([k,test])=>test(x[k]));
const record=(shape,extra=()=>true)=>x=>object(x,{id:x=>text(x)&&x.length>0,...shape})&&extra(x);
const photo=x=>text(x)&&x===''||typeof x==='string'&&x.length<=1500000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x);
const schemas={
  fields:record({name:text,area:positive,crop:text,variety:text,planted:date,harvest:optionalDate,status:oneOf('Planned','Growing','Harvested'),seedRate:amount,seedUnit:oneOf('kg/ha','seeds/ha')},x=>!x.harvest||x.harvest>=x.planted),
  tasks:record({fieldId:text,name:text,date,done:bool}),
  costs:record({name:text,category:text,fieldId:text,planned:amount,actual:amount,date}),
  stock:record({name:text,category:text,quantity:amount,unit:text,reorder:amount}),
  equipment:record({name:text,hours:amount,nextHours:x=>x===null||amount(x),interval:amount,dueDate:optionalDate,notes:text},x=>x.nextHours!==null||!!x.dueDate),
  services:record({equipmentId:text,name:text,date,hours:amount,cost:amount,notes:text}),
  soil:record({fieldId:text,date,notes:text,photo,ph:x=>x===''||text(x)&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=14,lab:text,analysis:text}),
  seedTests:record({fieldId:text,batch:text,tested:positive,sprouted:amount,date},x=>Number.isInteger(x.tested)&&Number.isInteger(x.sprouted)&&x.sprouted<=x.tested),
  quotes:record({supplier:text,product:text,spec:text,unit:text,price:amount,delivery:amount,quantity:positive,expires:date}),
  groups:record({name:text,product:text,target:positive,pledged:amount,mine:amount,unit:text,deadline:date,status:text},x=>x.mine<=x.pledged),
  outlooks:record({created:x=>text(x)&&!Number.isNaN(Date.parse(x)),from:date,to:date,days:positive,temperature:Number.isFinite,rainfall:amount,partial:bool,source:text,location:text}),
};
export function validateBackup(x){
  if(x?.seasonalAuto!==undefined&&!bool(x.seasonalAuto))return false;
  if(x?.seasonalCheck!==undefined&&!object(x.seasonalCheck,{key:text,at:amount}))return false;
  if(!object(x,{version:x=>x===1,demo:bool,profile:p=>object(p,{name:text,farm:text,location:text,latitude:n=>Number.isFinite(n)&&Math.abs(n)<=90,longitude:n=>Number.isFinite(n)&&Math.abs(n)<=180,land:positive,season:text,seasonStart:date,seasonEnd:date,budget:amount}),readAlerts:a=>Array.isArray(a)&&a.every(text)}))return false;
  if(x.profile.seasonEnd<=x.profile.seasonStart)return false;
  if(!Object.entries(schemas).every(([key,check])=>Array.isArray(x[key])&&x[key].length<=10000&&x[key].every(check)&&new Set(x[key].map(r=>r.id)).size===x[key].length))return false;
  return x.fields.reduce((s,f)=>s+f.area,0)<=x.profile.land+1e-8;
}
