import { useState, type FormEvent } from 'react';
import { Camera, Leaf, Save, FlaskConical, Trash2, ImagePlus, ChevronRight, RotateCcw } from 'lucide-react';
import { Button, Card, Empty, Heading, Note, dateLabel, Input, Select, Textarea, Modal } from '../components/UI';
import type { FarmState, Soil } from '../types';
import { today, uid } from '../store';

async function photoData(file:File):Promise<string> {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG, or WebP photo.');
  if(file.size>10*1024*1024)throw new Error('Choose a photo smaller than 10 MB.');
  const source=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=source;await img.decode();
    const scale=Math.min(1,1000/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas');canvas.width=img.width*scale;canvas.height=img.height*scale;
    canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',0.75);
  }finally{URL.revokeObjectURL(source);}
}

export function SoilPage({state,save,aiEnabled}:{state:FarmState;save:(s:FarmState)=>boolean;aiEnabled:boolean}) {
  const [photo,setPhoto]=useState('');
  const [analysis,setAnalysis]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [view,setView]=useState<Soil|null>(null);
  const [remove,setRemove]=useState<string|null>(null);
  async function analyse(){
    if(!photo)return;setBusy(true);setError('');
    try {
      const r=await fetch('/api/soil-assessment',{method:'POST',headers:{'Content-Type':'application/json','X-FarmWise-Client':'web'},body:JSON.stringify({image:photo})});
      const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not review this photo.');setAnalysis(data.analysis);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const f=new FormData(e.currentTarget);const value=(name:string)=>String(f.get(name)||'').trim();
    if(!value('fieldId')){setError('Add a field in Planning first.');return;}
    const record:Soil={id:uid(),fieldId:value('fieldId'),date:today(),notes:value('notes'),photo,ph:value('ph'),lab:value('lab'),analysis};
    if(save({...state,soil:[record,...state.soil]})){e.currentTarget.reset();setPhoto('');setAnalysis('');setError('');}
  }
  return <>
    <Heading title="Soil Check" description="Capture your soil, record observations, and add test results."/>
    <div className="two-columns soil-grid">
      <Card title="New soil check"><form onSubmit={submit}>
        <Select label="Choose a field" name="fieldId" options={state.fields.map(f=>({value:f.id,label:`${f.name} · ${f.crop} · ${f.area} ha`}))}/>
        <div className={'capture '+(photo?'has-photo':'')}>
          {photo?<><img src={photo} alt="Selected soil surface"/><span className="capture-label">Photo captured</span></>:<div className="capture-empty"><span><Camera size={32} strokeWidth={1.4}/></span><h3>Take a closer look</h3><p>Capture the soil surface in natural light.</p><small>JPG, PNG or WebP · Up to 10 MB</small></div>}
          <input id="soil-photo" className="sr-only photo-file-input" type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="Take or upload soil photo" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{setPhoto(await photoData(file));setAnalysis('');setError('');}catch(err){setError((err as Error).message);}e.target.value='';}}/>
          <label htmlFor="soil-photo" className={'photo-upload '+(busy?'disabled':'')}>{photo?<RotateCcw size={16}/>:<ImagePlus size={17}/>} {photo?'Retake or replace photo':'Take or upload photo'}</label>
        </div>
        <Textarea name="notes" label="Your observations" required/>
        <details className="test-details"><summary><FlaskConical size={18}/><span>Add soil test results</span><PlusIcon/></summary><div className="test-content"><Input label="Laboratory pH (optional)" name="ph" type="number" min="0" max="14" step="0.1" required={false}/><Textarea label="Test date, laboratory, nutrients, units and advice" name="lab"/></div></details>
        {error&&<p role="alert" className="form-error">{error}</p>}
        <Button type="submit" className="w-full mt-4" disabled={!state.fields.length||busy}><Save size={17}/>Save observation</Button>
        {!state.fields.length&&<p className="caption mt-2">Add your first field in Planning to save a soil check.</p>}
      </form></Card>
      <div className="stack"><Card title="Visible soil observations"><div className="observation-intro"><span className="icon-tile"><Leaf size={23}/></span><div><h3>What can you see?</h3><p className="muted small">A photo helps you record changes over time.</p></div></div>
        <div className="observation-prompts"><div><span>01</span><div><strong>Surface condition</strong><p>Look for cracking, crusting, or standing water.</p></div></div><div><span>02</span><div><strong>Crop residue</strong><p>Note plant material covering the soil.</p></div></div><div><span>03</span><div><strong>Changes in the field</strong><p>Compare the same spot after rain or cultivation.</p></div></div></div>
        {aiEnabled&&<><Button secondary className="w-full" onClick={analyse} disabled={!photo||busy}>{busy?'Reviewing photo…':'Review visible soil features'}</Button><p className="caption mt-2">Uses AI-assisted observations. Your selected photo is sent to Anthropic; confirm findings in the field.</p></>}
        {analysis&&<div className="analysis-result"><span className="pill">AI-assisted observation</span><p>{analysis}</p></div>}
      </Card><div className="soil-note"><FlaskConical size={21}/><div><h3>For a fuller picture, add a soil test</h3><p>A photo cannot measure pH, nutrients, or overall soil health. Use laboratory results for fertiliser decisions.</p></div></div></div>
    </div>
    <Card title="Saved soil checks" action={<span className="record-count">{state.soil.length} records</span>}>
      {state.soil.length?state.soil.map(s=><div className="action-row" key={s.id}>{s.photo?<img className="soil-thumbnail" src={s.photo} alt="Soil observation thumbnail"/>:<span className="icon-tile soft"><Leaf size={21}/></span>}<button className="record-link" onClick={()=>setView(s)}><strong>{state.fields.find(f=>f.id===s.fieldId)?.name||'Archived field'}</strong><small>{dateLabel(s.date)} · {s.notes.slice(0,80)}</small></button><Button variant="ghost" size="icon-sm" aria-label="View soil observation" onClick={()=>setView(s)}><ChevronRight size={16}/></Button><Button variant="ghost" size="icon-sm" aria-label="Remove soil observation" onClick={()=>setRemove(s.id)}><Trash2 size={16}/></Button></div>):<Empty title="Your field history starts here" body="Saved photos, notes, and soil test results will appear here."/>}
    </Card>
    {view&&<Modal title="Soil observation" onClose={()=>setView(null)}>{view.photo&&<img className="record-photo" src={view.photo} alt="Saved soil surface"/>}<p>{view.notes}</p>{view.ph&&<p className="mt-4">Laboratory pH: {view.ph}</p>}{view.lab&&<p className="preserve-lines mt-4">{view.lab}</p>}{view.analysis&&<><h3 className="mt-4">AI-assisted observations</h3><p className="preserve-lines">{view.analysis}</p></>}</Modal>}
    {remove&&<Modal title="Remove soil check" onClose={()=>setRemove(null)}><p>Remove this saved photo and its notes from this device?</p><div className="modal-actions"><Button secondary onClick={()=>setRemove(null)}>Cancel</Button><Button variant="destructive" onClick={()=>{save({...state,soil:state.soil.filter(s=>s.id!==remove)});setRemove(null);}}>Remove</Button></div></Modal>}
  </>;
}
function PlusIcon(){return <span className="details-plus" aria-hidden="true">+</span>;}
