import { useState, type FormEvent } from 'react';
import { Download, Sprout, Bell, HardDrive } from 'lucide-react';
import { Button, Card, Heading, Input } from '../components/UI';
import { initialState } from '../store';
import { validateBackup } from '../backup.mjs';
import type { FarmState } from '../types';

export function SettingsPage({state,save,online,ai,confirm}:{state:FarmState;save:(s:FarmState)=>boolean;online:boolean;ai:boolean;confirm:(s:string,fn:()=>void)=>void}) {
  const [error,setError]=useState('');
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');const f=new FormData(e.currentTarget);
    const text=(k:string)=>String(f.get(k)||'').trim();const amount=(k:string)=>Number(text(k));
    if(amount('land')<state.fields.reduce((a,x)=>a+x.area,0)){setError('Farm size cannot be smaller than your recorded fields.');return;}
    if(text('seasonEnd')<=text('seasonStart')){setError('Season end must be after its start.');return;}
    save({...state,profile:{name:text('name'),farm:text('farm'),location:text('location'),latitude:amount('latitude'),longitude:amount('longitude'),land:amount('land'),season:text('season'),seasonStart:text('seasonStart'),seasonEnd:text('seasonEnd'),budget:amount('budget')}});
  }
  function download(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`farmwise-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <>
    <Heading title="Farm settings" description="Your farm details, growing season, and preferences."/>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="two-columns">
      <Card title="Farm details"><form key={JSON.stringify(state.profile)} onSubmit={submit}>
        <div className="form-grid"><Input label="Your name" name="name" value={state.profile.name}/><Input label="Farm name" name="farm" value={state.profile.farm}/><Input label="Village / region" name="location" value={state.profile.location}/><Input label="Total land (ha)" name="land" type="number" min="0.01" step="0.01" value={state.profile.land}/></div>
        <div className="divider"/><h3 className="mb-5">Growing season</h3>
        <div className="form-grid"><Input label="Season name" name="season" value={state.profile.season}/><Input label="Budget (R)" name="budget" type="number" min="0" step="0.01" value={state.profile.budget}/><Input label="Season starts" name="seasonStart" type="date" value={state.profile.seasonStart}/><Input label="Season ends" name="seasonEnd" type="date" value={state.profile.seasonEnd}/></div>
        <details className="test-details mb-5"><summary>Location for seasonal updates</summary><div className="test-content"><div className="form-grid"><Input label="Latitude" name="latitude" type="number" min="-90" max="90" step="any" value={state.profile.latitude}/><Input label="Longitude" name="longitude" type="number" min="-180" max="180" step="any" value={state.profile.longitude}/></div></div></details>
        <Button type="submit">Save farm details</Button>
      </form></Card>
      <div className="stack"><Card title="Seasonal notifications" action={<Bell size={18} className="muted"/>}>
        <label className="auto-season"><input type="checkbox" checked={state.seasonalAuto||false} onChange={e=>save({...state,seasonalAuto:e.target.checked})}/>Check my growing season automatically</label>
        <p className="caption">Checks once a day while the app is open. Your coordinates are shared with Open-Meteo to retrieve the regional outlook.</p>
        <dl className="details mt-4"><div><dt>Seasonal service</dt><dd><span className="pill">{online?'Available':'Unavailable'}</span></dd></div><div><dt>Soil photo guidance</dt><dd>{ai?'Available':'Not connected'}</dd></div></dl>
      </Card><Card title="Your records" action={<HardDrive size={18} className="muted"/>}>
        <p className="muted small mb-5">Records are saved in this browser. Keep a backup before clearing browser data or moving to another device.</p>
        <Button secondary onClick={download}><Download size={16}/>Download backup</Button>
        <details className="test-details mt-5"><summary>Restore a backup</summary><div className="test-content"><label className="form-field">Choose a FarmWise backup<input type="file" accept="application/json,.json" onChange={async e=>{
          const file=e.target.files?.[0];e.target.value='';if(!file)return;
          try{if(file.size>5_000_000)throw new Error('Backup must be smaller than 5 MB.');const data:unknown=JSON.parse(await file.text());if(!validateBackup(data))throw new Error('This backup has missing or invalid farm records.');confirm('Replace the current farm with this backup? Export your current records first.',()=>save(data));setError('');}catch(err){setError((err as Error).message);}
        }}/></label></div></details>
        <div className="divider"/><h3 className="mb-2">{state.demo?'Ready to set up your farm?':'Start a new workspace'}</h3><p className="caption mb-4">Clear the current records and keep your farm details. Download a backup first.</p>
        <Button secondary onClick={()=>confirm('Clear all farm records on this device? Your farm details will be kept. Download a backup first.',()=>save({...initialState(false),profile:state.profile}))}><Sprout size={16}/>Start an empty farm</Button>
      </Card></div>
    </div>
  </>;
}
