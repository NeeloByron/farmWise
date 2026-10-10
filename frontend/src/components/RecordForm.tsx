import { useState, type FormEvent } from 'react';
import { Input, Modal, Note, Select, Textarea } from './UI';
import { today, uid } from '../store';
import type { FarmState, Field, Equipment, Cost, Stock, Quote, Group, Task } from '../types';
export type FormKind='field'|'task'|'cost'|'stock'|'equipment'|'service'|'seed'|'quote'|'group';
export type EditRecord = Field|Equipment|Cost|Stock|Quote|Group|Task;
export function RecordForm({kind,state,record,onSave,onClose}:{kind:FormKind;state:FarmState;record?:EditRecord;onSave:(value:FarmState)=>boolean;onClose:()=>void}) {
  const [error,setError]=useState('');
  const [operationId]=useState(uid);
  const task=record as Task|undefined;
  const fieldOptions=[{value:'',label:'Whole farm'},...state.fields.map(x=>({value:x.id,label:`${x.name} · ${x.crop}`}))];
  const fields=fieldOptions.slice(1);
  const field=record as Field|undefined, cost=record as Cost|undefined, stock=record as Stock|undefined, equipment=record as Equipment|undefined, quote=record as Quote|undefined, group=record as Group|undefined;
  const names={field:'crop plan',task:'planting task',cost:'budget item',stock:'resource',equipment:'equipment',service:'maintenance',seed:'seed test',quote:'supplier quote',group:'group purchase'};
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError(''); const data=new FormData(e.currentTarget);
    const s=(k:string)=>String(data.get(k)||'').trim();
    const n=(k:string)=>{const v=Number(s(k));if(!Number.isFinite(v)||v<0)throw new Error('Enter valid positive amounts.');return v;};
    const next=structuredClone(state);
    const replace=(list:any[],item:any)=>{const i=list.findIndex(x=>x.id===item.id);if(i<0)list.push(item);else list[i]=item;};
    try {
      if(['field','task','cost','stock','equipment'].includes(kind)&&!s('name'))throw new Error('Enter a name, not just spaces.');
      const id=(kind==="service"?undefined:record?.id)||operationId;
      if(kind==='field') {
        const area=n('area');const used=state.fields.filter(x=>x.id!==id).reduce((v,x)=>v+x.area,0);
        if(area<=0||used+area>state.profile.land)throw new Error(`Your fields cannot exceed ${state.profile.land} ha. Update farm size in Settings first.`);
        if(s('harvest')&&s('harvest')<s('planted'))throw new Error('Harvest date must be after planting.');
        replace(next.fields,{id,name:s('name'),area,crop:s('crop'),variety:s('variety'),planted:s('planted'),harvest:s('harvest'),status:s('status'),seedRate:n('seedRate'),seedUnit:s('seedUnit')});
      }
      if(kind==='task'){if(!fields.length)throw new Error('Add a field first.');replace(next.tasks,{id,fieldId:s('fieldId'),name:s('name'),date:s('date'),done:task?.done||false});}
      if(kind==='cost') {
        replace(next.costs,{...cost,id,name:s('name'),category:s('category'),fieldId:s('fieldId'),planned:n('planned'),actual:n('actual'),date:s('date')});
        if(cost?.serviceId)next.services=next.services.map(x=>x.id===cost.serviceId?{...x,cost:n('actual')}:x);
        if(cost?.movementId)next.movements=next.movements?.map(x=>x.id===cost.movementId?{...x,cost:n('actual')}:x);
      }
      if(kind==='stock') {
        if(stock&&n('quantity')!==stock.quantity)throw new Error('Use Receive stock or Record usage to change quantities and keep the history accurate.');
        if(stock&&s('unit')!==stock.unit&&((state.movements||[]).some(x=>x.stockId===id)||(state.inputPlans||[]).some(x=>x.stockId===id)||(state.allocations||[]).some(x=>x.stockId===id)))throw new Error('This resource already has records. Add a separate resource for a different unit.');
        replace(next.stock,{id,name:s('name'),category:s('category'),quantity:n('quantity'),unit:s('unit'),reorder:n('reorder')});
      }
      if(kind==='equipment') {
        const hours=n('hours');if(equipment&&hours<equipment.hours)throw new Error('Operating hours cannot decrease.');const nextHours=s('nextHours')?n('nextHours'):null;
        if(nextHours===null&&!s('dueDate'))throw new Error('Set a service date or operating-hour threshold.');
        replace(next.equipment,{id,name:s('name'),hours,nextHours,interval:n('interval'),dueDate:s('dueDate'),notes:s('notes')});
      }
      if(kind==='service') {
        const item=next.equipment.find(x=>x.id===s('equipmentId'));if(!item)throw new Error('Select equipment.');
        const hours=n('hours');if(hours<item.hours)throw new Error('The hour reading cannot decrease.');
        if(!s('dueDate')&&item.interval<=0)throw new Error('Enter the next inspection date for date-based maintenance.');
        item.hours=hours;item.nextHours=item.interval>0?hours+item.interval:null;item.dueDate=s('dueDate');
        if(next.services.some(x=>x.id===id))return;
        next.services.unshift({id,equipmentId:item.id,name:item.name,date:s('date'),hours,cost:n('cost'),notes:s('notes')});
        next.costs.push({id:`service:${id}`,serviceId:id,name:`Service: ${item.name}`,category:'Equipment',fieldId:'',planned:0,actual:n('cost'),date:s('date')});
      }
      if(kind==='seed') {
        const tested=n('tested'),sprouted=n('sprouted');if(!fields.length||tested<1||sprouted>tested||!Number.isInteger(tested)||!Number.isInteger(sprouted))throw new Error('Select a field and enter whole seed counts. Sprouts cannot exceed seeds tested.');
        next.seedTests.unshift({id,fieldId:s('fieldId'),batch:s('batch'),tested,sprouted,date:s('date')});
      }
      if(kind==='quote') {if(n('quantity')<=0)throw new Error('Quantity must be greater than zero.');replace(next.quotes,{id,supplier:s('supplier'),product:s('product'),spec:s('spec'),unit:s('unit'),price:n('price'),delivery:n('delivery'),quantity:n('quantity'),expires:s('expires')});}
      if(kind==='group') {const target=n('target'),mine=n('mine'),pledged=n('pledged');if(target<=0||mine>pledged)throw new Error('The target must be positive and total pledges must include your quantity.');replace(next.groups,{id,name:s('name'),product:s('product'),target,mine,pledged,unit:s('unit'),deadline:s('deadline'),status:s('status')});}
      if(onSave(next))onClose();
    }catch(err){setError((err as Error).message);}
  }
  return <Modal title={`${record&&kind!=='service'?'Edit':'Add'} ${names[kind]}`} onClose={onClose} onSubmit={submit}>{error&&<p role="alert" className="form-error">{error}</p>}
    {kind==='field'&&<><div className="form-grid"><Input label="Field name" name="name" value={field?.name}/><Input label="Area (ha)" name="area" type="number" min="0.01" step="0.01" value={field?.area}/><Input label="Crop" name="crop" value={field?.crop}/><Input label="Variety" name="variety" required={false} value={field?.variety}/><Input label="Planting date" name="planted" type="date" value={field?.planted}/><Input label="Expected harvest" name="harvest" type="date" value={field?.harvest} required={false}/><Select label="Status" name="status" value={field?.status} options={['Planned','Growing','Harvested'].map(x=>({value:x,label:x}))}/><Input label="Seed rate per hectare" name="seedRate" type="number" min="0" step="any" value={field?.seedRate||0}/><Select label="Seed rate unit" name="seedUnit" value={field?.seedUnit} options={['kg/ha','seeds/ha'].map(x=>({value:x,label:x}))}/></div><Note>Enter a rate from your seed supplier or adviser. FarmWise calculates quantity; it does not prescribe a seed rate.</Note></>}
    {kind==='task'&&<><Input label="Task" name="name" value={task?.name} placeholder="e.g. Check emergence"/><Select label="Field" name="fieldId" value={task?.fieldId} options={fields}/><Input label="Due date" name="date" type="date" value={task?.date||today()}/></>}
    {kind==='cost'&&<><Input label="Item" name="name" value={cost?.name}/><div className="form-grid"><Select label="Category" name="category" value={cost?.category} options={['Seeds','Fertiliser','Water','Feed','Equipment','Labour','Other'].map(x=>({value:x,label:x}))}/><Select label="Field" name="fieldId" value={cost?.fieldId} options={fieldOptions}/><Input label="Planned cost (R)" name="planned" type="number" min="0" step="0.01" value={cost?.planned||0}/><Input label="Actual spent (R)" name="actual" type="number" min="0" step="0.01" value={cost?.actual||0}/><Input label="Date" name="date" type="date" value={cost?.date||today()}/></div></>}
    {kind==='stock'&&<><Input label="Resource / formulation" name="name" value={stock?.name}/><div className="form-grid"><Select label="Category" name="category" value={stock?.category} options={['Seeds','Fertiliser','Feed','Other'].map(x=>({value:x,label:x}))}/><Select label="Unit" name="unit" value={stock?.unit} options={['kg','L','units'].map(x=>({value:x,label:x}))}/><Input label="Quantity in stock" name="quantity" type="number" min="0" step="any" value={stock?.quantity||0}/><Input label="Low-stock threshold" name="reorder" type="number" min="0" step="any" value={stock?.reorder||0}/></div></>}
    {kind==='equipment'&&<><Input label="Equipment name" name="name" value={equipment?.name}/><div className="form-grid"><Input label="Current operating hours" name="hours" type="number" min="0" step="any" value={equipment?.hours||0}/><Input label="Next service at (hours)" name="nextHours" type="number" min="0" step="any" required={false} value={equipment?.nextHours??''}/><Input label="Service interval (hours)" name="interval" type="number" min="0" step="any" value={equipment?.interval||0}/><Input label="Next inspection date" name="dueDate" type="date" required={false} value={equipment?.dueDate}/></div><Textarea label="Service guidance / notes" name="notes" value={equipment?.notes}/><Note>Use the service interval and checks from the equipment manual.</Note></>}
    {kind==='service'&&<><Select label="Equipment" name="equipmentId" options={(equipment?[equipment]:state.equipment).map(x=>({value:x.id,label:x.name}))}/><div className="form-grid"><Input label="Service date" name="date" type="date" value={today()} max={today()}/><Input label="Hour reading" name="hours" type="number" min="0" step="any" value={equipment?.hours}/><Input label="Service cost (R)" name="cost" type="number" min="0" step="0.01" value={0}/><Input label="Next inspection date" name="dueDate" type="date" required={false} min={today()}/></div><Textarea label="Work completed" name="notes" required/><Note>Costs are also recorded in Financial Plan. Hour-based reminders use the saved service interval.</Note></>}
    {kind==='seed'&&<><Select label="Field" name="fieldId" options={fields}/><Input label="Seed batch / variety" name="batch"/><div className="form-grid"><Input label="Seeds tested" name="tested" type="number" min="1" step="1"/><Input label="Seeds sprouted" name="sprouted" type="number" min="0" step="1"/><Input label="Test date" name="date" type="date" value={today()} max={today()}/></div><Note>This records your sample result. It does not certify seed quality or recommend planting extra seed.</Note></>}
    {kind==='quote'&&<><Input label="Supplier" name="supplier" value={quote?.supplier}/><Input label="Product" name="product" value={quote?.product}/><Input label="Variety / formulation / pack size" name="spec" value={quote?.spec}/><div className="form-grid"><Input label="Quoted unit (e.g. 50 kg bag)" name="unit" value={quote?.unit}/><Input label="Price per unit (R)" name="price" type="number" min="0" step="0.01" value={quote?.price}/><Input label="Quantity" name="quantity" type="number" min="0.01" step="any" value={quote?.quantity||1}/><Input label="Total delivery charge (R)" name="delivery" type="number" min="0" step="0.01" value={quote?.delivery||0}/><Input label="Quote expiry" name="expires" type="date" value={quote?.expires}/></div></>}
    {kind==='group'&&<><Input label="Group / collection location" name="name" value={group?.name}/><Input label="Product and exact specification" name="product" value={group?.product}/><div className="form-grid"><Input label="Unit" name="unit" value={group?.unit||'bags'}/><Input label="Target quantity" name="target" type="number" min="1" step="1" value={group?.target}/><Input label="Total pledged (including yours)" name="pledged" type="number" min="0" step="1" value={group?.pledged||0}/><Input label="Your quantity" name="mine" type="number" min="0" step="1" value={group?.mine||0}/><Input label="Deadline" name="deadline" type="date" value={group?.deadline}/><Select label="Coordinator status" name="status" value={group?.status} options={['Collecting interest','Awaiting supplier','Confirmed by coordinator','Collected','Cancelled'].map(x=>({value:x,label:x}))}/></div><Note>A private coordination record. Saving here does not contact a supplier, take payment, or place an order.</Note></>}
  </Modal>;
}

