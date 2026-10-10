import { useState, useRef } from 'react';
import type { FarmState } from './types';
import {validateBackup} from './backup.mjs';
import {syncInputCosts} from './workflows.mjs';
export const today = () => new Date().toLocaleDateString('en-CA', {timeZone:'Africa/Johannesburg'});
export const uid = () => crypto.randomUUID();
function day(offset:number) { const d = new Date(); d.setDate(d.getDate()+offset); return d.toLocaleDateString('en-CA',{timeZone:'Africa/Johannesburg'}); }
export function initialState(demo=true):FarmState {
  return {version:1,demo, profile:{name:'Lerato',farm:'Lerato’s farm',location:'Thohoyandou, Limpopo',latitude:-22.95,longitude:30.48,land:1,season:'My growing season',seasonStart:day(0),seasonEnd:day(90),budget:8000},
    fields:demo?[{id:'field-a',name:'Field A',area:0.5,crop:'Maize',variety:'To be confirmed',planted:day(7),harvest:day(120),status:'Planned',seedRate:20,seedUnit:'kg/ha'}]:[],
    tasks:demo?[{id:'task-1',fieldId:'field-a',name:'Prepare soil',date:day(2),done:false},{id:'task-2',fieldId:'field-a',name:'Plant maize',date:day(7),done:false},{id:'task-3',fieldId:'field-a',name:'Check emergence',date:day(14),done:false}]:[],
    costs:demo?[{id:'cost-1',name:'Maize seed',category:'Seeds',fieldId:'field-a',planned:1200,actual:600,date:day(0)},{id:'cost-2',name:'Fertiliser',category:'Fertiliser',fieldId:'field-a',planned:2500,actual:0,date:day(0)},{id:'cost-3',name:'Irrigation',category:'Water',fieldId:'field-a',planned:1000,actual:0,date:day(0)},{id:'cost-4',name:'Seasonal labour',category:'Labour',fieldId:'field-a',planned:1800,actual:0,date:day(0)}]:[],
    stock:demo?[{id:'stock-1',name:'Fertiliser — confirm formulation',category:'Fertiliser',quantity:200,unit:'kg',reorder:50},{id:'stock-2',name:'Animal feed',category:'Feed',quantity:150,unit:'kg',reorder:40},{id:'stock-3',name:'Maize seed',category:'Seeds',quantity:5,unit:'kg',reorder:10}]:[],
    equipment:demo?[{id:'tractor',name:'Tractor 01',hours:245,nextHours:250,interval:250,dueDate:'',notes:'Example interval. Follow the manufacturer’s service schedule.'},{id:'pump',name:'Irrigation pump',hours:0,nextHours:null,interval:0,dueDate:day(5),notes:'Inspect hoses and seals according to the equipment manual.'}]:[],
    services:[],soil:[],seedTests:[],quotes:[],groups:[],outlooks:[],readAlerts:[]};
}
const KEY='farmwise:v1';
export function useFarm() {
  const [problem,setProblem]=useState('');
  const [state,setState]=useState<FarmState>(()=> {try { const saved=localStorage.getItem(KEY); if(saved) {const data=JSON.parse(saved); if(validateBackup(data)) return data;} } catch { /* fall back to example data */ } return initialState();});
  const current=useRef(state);
  function update(next:FarmState | ((s:FarmState)=>FarmState)) {
    const value=syncInputCosts(typeof next==='function'?next(current.current):next);
    if(!validateBackup(value)){setProblem('Some records are invalid. Check required fields, quantities and dates. No changes were saved.');return false;}
    try {localStorage.setItem(KEY,JSON.stringify(value));current.current=value;setState(value);setProblem('');return true;} catch {setProblem('Your browser storage is full or unavailable. Export a backup and remove large photos before saving again.');return false;}
  }
  return {state,update,problem};
}
