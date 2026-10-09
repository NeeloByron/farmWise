import { useState, type ReactNode } from 'react';
import { Droplets, Package, Map, SlidersHorizontal } from 'lucide-react';
import { Card, Empty, Heading, Note, number, AddButton } from '../components/UI';
import { fertiliserNeed, irrigationNeed } from '../domain.mjs';
import type { FarmState, Stock } from '../types';

export function ResourcesPage({state,onAdd,tools}:{state:FarmState;onAdd:()=>void;tools:(s:Stock)=>ReactNode}) {
  const [fieldId,setFieldId]=useState(state.fields[0]?.id||'');
  const [rate,setRate]=useState(''),[bag,setBag]=useState('50'),[stock,setStock]=useState('0');
  const [et0,setEt0]=useState(''),[kc,setKc]=useState(''),[rain,setRain]=useState('0'),[efficiency,setEfficiency]=useState('');
  const field=state.fields.find(x=>x.id===fieldId);const area=field?.area||0;
  const allocated=state.fields.reduce((sum,f)=>sum+f.area,0);
  let fertiliser:ReturnType<typeof fertiliserNeed>|null=null,water:ReturnType<typeof irrigationNeed>|null=null,error='',waterError='';
  if(area&&rate!==''&&bag!==''&&stock!=='')try{fertiliser=fertiliserNeed(area,Number(rate),Number(bag),Number(stock));}catch(e){error=(e as Error).message;}
  if(area&&et0!==''&&kc!==''&&rain!==''&&efficiency!=='')try{water=irrigationNeed(area,Number(et0),Number(kc),Number(rain),Number(efficiency));}catch(e){waterError=(e as Error).message;}
  const numeric=(label:string,value:string,set:(v:string)=>void,unit:string)=><label className="form-field">{label}<div className="input-unit"><input type="number" min="0" step="any" value={value} onChange={e=>set(e.target.value)} placeholder="Enter value"/><span>{unit}</span></div></label>;
  return <>
    <Heading title="Resources" description="Manage your land, supplies, and what each field needs." action={<AddButton onClick={onAdd}>Add resource</AddButton>}/>
    <div className="resource-heading"><label className="field-select"><span>View field</span><select value={fieldId} onChange={e=>setFieldId(e.target.value)}><option value="">Select a field</option>{state.fields.map(f=><option key={f.id} value={f.id}>{f.name} · {f.crop} · {f.area} ha</option>)}</select></label><span className="caption">Estimates use the selected field’s area.</span></div>
    <div className="resource-grid">
      <Card className="land-card"><span className="resource-symbol"><Map size={25}/></span><h2>Land</h2><div className="resource-number">{number(allocated)} <small>ha allocated</small></div><p className="muted small">of {number(state.profile.land)} ha total</p><progress aria-label="Land allocated" max={state.profile.land} value={allocated}/><div className="budget-meter"><span>{Math.round(allocated/state.profile.land*100)}% allocated</span><span>{number(Math.max(0,state.profile.land-allocated))} ha available</span></div></Card>
      <Card className="estimate-card"><span className="resource-symbol"><Package size={25}/></span><h2>Fertiliser estimate</h2><div className="resource-number">{fertiliser?`${number(fertiliser.kg)} kg`:'—'}<small>{fertiliser?`${fertiliser.bags} × ${number(Number(bag))} kg bags`:'Add an application rate'}</small></div><p className="muted small">{fertiliser?`Buy ${fertiliser.buyBags} bags after allocated stock`:'Calculated for your selected field'}</p>
        <details className="calculator-details"><summary><SlidersHorizontal size={15}/>Set field values</summary><div className="calculator-inputs">{numeric('Adviser’s application rate',rate,setRate,'kg/ha')}{numeric('Bag size',bag,setBag,'kg')}{numeric('Matching stock allocated here',stock,setStock,'kg')}{error&&<p role="alert" className="form-error">{error}</p>}<p className="caption">Use a soil-test or adviser rate for the same fertiliser formulation. These values do not reserve stock.</p></div></details>
      </Card>
      <Card className="estimate-card"><span className="resource-symbol"><Droplets size={25}/></span><h2>Daily irrigation estimate</h2><div className="resource-number">{water?number(water.litres):'—'}<small>{water?'litres per day':'Add field conditions'}</small></div><p className="muted small">{water?`${number(water.netMm)} mm net water requirement`:'Adjusted for effective rain and efficiency'}</p>
        <details className="calculator-details"><summary><SlidersHorizontal size={15}/>Set field values</summary><div className="calculator-inputs">{numeric('Reference evapotranspiration',et0,setEt0,'mm/day')}{numeric('Crop coefficient',kc,setKc,'Kc')}{numeric('Effective rainfall',rain,setRain,'mm/day')}{numeric('Irrigation efficiency',efficiency,setEfficiency,'%')}{waterError&&<p role="alert" className="form-error">{waterError}</p>}<p className="caption">Use local field values. Check soil moisture before irrigating.</p></div></details>
      </Card>
    </div>
    {!state.fields.length&&<Note>Add a crop plan to calculate resources for a field.</Note>}
    <Card title="Resource stock" action={<span className="record-count">{state.stock.length} resources</span>}>
      {state.stock.length?<div className="stock-list">{state.stock.map(s=><div className="stock-row" key={s.id}><span className="icon-tile soft"><Package size={21}/></span><div className="stock-name"><strong>{s.name}</strong><small>{s.category}</small></div><div className="stock-quantity"><strong>{number(s.quantity)} <small>{s.unit}</small></strong><span className={'pill '+(s.quantity<=s.reorder?'amber':'')}>{s.quantity<=s.reorder?'Running low':'In stock'}</span></div>{tools(s)}</div>)}</div>:<Empty title="Keep your stock in view" body="Add fertiliser, seeds, feed, and other supplies. Update quantities as you use them."/>}
    </Card>
    <p className="caption">Field estimates help plan quantities. Confirm application rates with your adviser and update stock after use.</p>
  </>;
}
