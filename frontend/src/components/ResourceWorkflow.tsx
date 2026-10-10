import { useState, type FormEvent } from 'react';
import { PackagePlus, Minus, LockKeyhole, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Empty, Input, Modal, Note, Select, money, number, dateLabel } from './UI';
import { moveStock, reserveStock, setInputPlan, planBalance, stockBalance } from '../workflows.mjs';
import { today, uid } from '../store';
import type { FarmState, InputPlan } from '../types';

export function ResourceWorkflow({state,fieldId,save}:{state:FarmState;fieldId:string;save:(s:FarmState)=>boolean}) {
  const [form,setForm]=useState<{kind:'plan'|'reserve'|'receive'|'use';stockId:string;id:string;plan?:InputPlan}|null>(null);
  const [error,setError]=useState('');
  const selected=state.stock.find(x=>x.id===form?.stockId);
  const field=state.fields.find(x=>x.id===fieldId);
  const plans=(state.inputPlans||[]).filter(x=>x.fieldId===fieldId);
  const open=(kind:NonNullable<typeof form>['kind'],stockId='',plan?:InputPlan)=>{setError('');setForm({kind,stockId,id:uid(),plan});};
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!form)return;setError('');
    const f=new FormData(e.currentTarget),s=(key:string)=>String(f.get(key)||'').trim(),n=(key:string)=>Number(s(key));
    try {
      let next=state;
      if(form.kind==='plan')next=setInputPlan(state,{fieldId,stockId:s('stockId'),required:n('required'),unitPrice:n('unitPrice'),source:s('source')});
      else if(form.kind==='reserve')next=reserveStock(state,{fieldId,stockId:form.stockId,quantity:n('quantity')});
      else next=moveStock(state,{id:form.id,stockId:form.stockId,fieldId:s('fieldId'),kind:form.kind,quantity:n('quantity'),cost:form.kind==='receive'?n('cost'):0,date:s('date'),notes:s('notes')});
      if(save(next))setForm(null);
    }catch(e){setError((e as Error).message);}
  }
  return <div className="stack">
    <Card title={field?`Input plan - ${field.name}`:'Field input plan'} action={<Button disabled={!field||!state.stock.length} onClick={()=>open('plan')}>Add requirement</Button>}>
      <p className="caption">Enter the total quantity from your crop plan or adviser. Reserve matching stock, then record purchases and usage. Remaining purchase estimates update Financial Plan automatically.</p>
      {plans.map(plan=>{const stock=state.stock.find(x=>x.id===plan.stockId)!;const balance=planBalance(state,plan);return <section className="workflow-plan" key={plan.stockId}>
        <div className="section-heading"><h3>{stock.name}</h3><div className="row-tools"><Button variant="ghost" size="icon-sm" aria-label={`Edit requirement for ${stock.name}`} onClick={()=>open('plan',stock.id,plan)}><Pencil size={16}/></Button><Button variant="ghost" size="icon-sm" aria-label={`Remove requirement for ${stock.name}`} onClick={()=>{if(window.confirm('Remove this requirement and release its reserved stock? Usage and expenses will be kept.'))save({...state,inputPlans:state.inputPlans?.filter(x=>x!==plan),allocations:state.allocations?.filter(x=>x.fieldId!==fieldId||x.stockId!==plan.stockId)});}}><Trash2 size={16}/></Button></div></div>
        <dl className="details"><div><dt>Required</dt><dd>{number(plan.required)} {stock.unit}</dd></div><div><dt>Already used</dt><dd>{number(balance.used)} {stock.unit}</dd></div><div><dt>Reserved for this field</dt><dd>{number(balance.reserved)} {stock.unit}</dd></div><div><dt>Still to buy</dt><dd>{number(balance.shortage)} {stock.unit} / {money(balance.shortage*plan.unitPrice)}</dd></div></dl>
        <p className="caption">Requirement source: {plan.source}. Price estimate: {money(plan.unitPrice)} per {stock.unit}.</p>
        <Button secondary onClick={()=>open('reserve',stock.id)}><LockKeyhole size={16}/>Reserve stock</Button>
      </section>;})}
      {!plans.length&&<Empty title="Plan before you buy" body={field?'Add a resource first, then record this field’s requirement.':'Select a field to see its input requirements.'}/>}
    </Card>
    <Card title="Receive and use supplies">
      {state.stock.map(stock=>{const b=stockBalance(state,stock.id);return <section key={stock.id} className="workflow-plan"><h3>{stock.name}</h3><p>{number(b.onHand)} {stock.unit} on hand · {number(b.reserved)} reserved · <strong>{number(b.available)} available</strong></p><div className="workflow-actions"><Button secondary onClick={()=>open('receive',stock.id)}><PackagePlus size={16}/>Receive stock</Button><Button secondary disabled={b.onHand===0} onClick={()=>open('use',stock.id)}><Minus size={16}/>Record usage</Button></div></section>;})}
      {!state.stock.length&&<p>Add your first resource to record stock movements.</p>}
    </Card>
    <Card title="Stock movement history">
      {(state.movements||[]).slice(0,30).map(m=><div className="action-row" key={m.id}><span><strong>{m.kind==='receive'?'Received':'Used'} {number(m.quantity)} {m.unit} - {m.name}</strong><small>{dateLabel(m.date)} · {state.fields.find(f=>f.id===m.fieldId)?.name||(m.fieldId?'Archived field':'Whole farm')} · {m.notes}</small></span>{m.kind==='receive'&&<strong>{money(m.cost)}</strong>}</div>)}
      {!state.movements?.length&&<p className="caption">Receipts and usage will appear here. Opening stock is the quantity entered when a resource was created.</p>}
    </Card>
    {form&&<Modal title={{plan:'Field input requirement',reserve:'Reserve stock for this field',receive:'Receive stock',use:'Record usage'}[form.kind]} onClose={()=>setForm(null)} onSubmit={submit}>
      {error&&<p role="alert" className="form-error">{error}</p>}
      {form.kind==='plan'?<>
        {form.plan?<><input type="hidden" name="stockId" value={form.plan.stockId}/><p>{selected?.name} ({selected?.unit})</p></>:<Select label="Resource (use the unit shown)" name="stockId" options={state.stock.map(s=>({value:s.id,label:`${s.name} (${s.unit})`}))}/>}
        <Input label="Total quantity required for this field" name="required" type="number" min="0" step="any" value={form.plan?.required}/>
        <Input label="Estimated price per stock unit (R)" name="unitPrice" type="number" min="0" step="0.01" value={form.plan?.unitPrice}/>
        <Input label="Requirement source / calculation" name="source" placeholder="e.g. Adviser rate 200 kg/ha x 0.5 ha" value={form.plan?.source}/>
        <Note>Use the matching formulation and unit. FarmWise does not prescribe an application rate. This adds the remaining purchase estimate to your budget.</Note>
      </>:form.kind==='reserve'?<><p>{selected?.name} · {field?.name}</p><Input label={`Total quantity to reserve (${selected?.unit})`} name="quantity" type="number" min="0" step="any" value={state.allocations?.find(x=>x.fieldId===fieldId&&x.stockId===form.stockId)?.quantity||0}/><Note>Set the total reservation, not an additional amount. Enter zero to release it. Stock reserved for another field cannot be used here.</Note></>:<>
        <p>{selected?.name}</p><Select label="Field" name="fieldId" value={fieldId} options={[{value:'',label:'Whole farm / unassigned'},...state.fields.map(f=>({value:f.id,label:f.name}))]}/>
        <Input label={`Quantity (${selected?.unit})`} name="quantity" type="number" min="0.001" step="any"/>
        {form.kind==='receive'&&<Input label="Total paid for this receipt (R)" name="cost" type="number" min="0" step="0.01" value={0}/>}
        <Input label="Date" name="date" type="date" value={today()} max={today()}/><Input label="Reference / notes" name="notes" required={false}/>
        <Note>{form.kind==='receive'?'The receipt adds stock and records its cost once. Stock is reserved for the selected field up to its planned shortage.':'Usage reduces stock and uses this field’s reservation first. It does not charge the purchase cost again.'}</Note>
      </>}
    </Modal>}
  </div>;
}
