import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, CloudSun, Droplets, Home, Leaf, Map, MapPin, Menu, Package, Pencil, Plus, Settings, Sprout, Tractor, Trash2, Wallet, Wrench } from 'lucide-react';
import { AddButton, Button, Card, Empty, Heading, LinkButton, Modal, Note, dateLabel, money, number } from './components/UI';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from './components/ui/sheet';
import { RecordForm, type EditRecord, type FormKind } from './components/RecordForm';
import { FarmPhoto } from './components/FarmPhoto';
import { today, uid, useFarm } from './store';
import { budgetTotals, serviceState } from './domain.mjs';
import { budgetAlerts, stockBalance, planBalance, syncInputCosts } from './workflows.mjs';
import type { FarmState, Page } from './types';
import { SoilPage } from './pages/SoilPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResourcesPage } from './pages/ResourcesPage';

const pages = [
  {id:'home',label:'Home',icon:Home,description:'Your farm at a glance'},
  {id:'planning',label:'Planning',icon:CalendarDays,description:'Seasonal crop plans & schedules'},
  {id:'finance',label:'Financial Plan',icon:Wallet,description:'Budgets & expenses'},
  {id:'resources',label:'Resources',icon:Map,description:'Land, fertiliser, feed & water'},
  {id:'soil',label:'Soil Check',icon:Leaf,description:'Photos & soil test results'},
  {id:'equipment',label:'Equipment Care',icon:Tractor,description:'Maintenance & reminders'},
] as const;
function fromHash():Page {
  const value=location.hash.slice(1);
  return [...pages.map(p=>p.id),'alerts','settings'].includes(value)?value as Page:'home';
}
function Brand(){return <span className="brand"><Sprout aria-hidden="true" size={31} strokeWidth={1.8}/><span>FarmWise</span></span>;}
function BudgetRing({spent,budget}:{spent:number;budget:number}) {
  const percent=budget>0?Math.round(spent/budget*100):0;
  return <div className="budget-ring" role="img" aria-label={`${percent}% of budget spent`}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" className="ring-track"/><circle cx="60" cy="60" r="50" className="ring-fill" strokeDasharray={`${Math.min(100,Math.max(0,percent))*3.14159} 314.159`}/></svg><div><strong>{percent}%</strong><span>spent</span></div></div>;
}

export default function App() {
  const {state,update,problem}=useFarm();
  const [page,setPage]=useState<Page>(fromHash);
  const [menu,setMenu]=useState(false);
  const [form,setForm]=useState<{kind:FormKind;record?:EditRecord}|null>(null);
  const [toast,setToast]=useState('');
  const [confirm,setConfirm]=useState<{text:string;action:()=>void}|null>(null);
  const [capabilities,setCapabilities]=useState({online:false,soilAI:false});
  const [loadingWeather,setLoadingWeather]=useState(false);
  const [weatherError,setWeatherError]=useState('');
  const weatherRequest=useRef(false);
  const [clockTick,setClockTick]=useState(0);
  const seasonKey=JSON.stringify([state.profile.latitude,state.profile.longitude,state.profile.seasonStart,state.profile.seasonEnd]);

  useEffect(()=>{const handler=()=>setPage(fromHash());window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
  useEffect(()=>{fetch('/api/status').then(r=>r.ok?r.json():Promise.reject()).then(x=>setCapabilities({online:true,soilAI:x.soilAI})).catch(()=>setCapabilities({online:false,soilAI:false}));},[]);
  useEffect(()=>{const timer=setInterval(()=>setClockTick(t=>t+1),60000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    if(capabilities.online&&state.seasonalAuto&&!weatherRequest.current&&(state.seasonalCheck?.key!==seasonKey||Date.now()-(state.seasonalCheck?.at||0)>86400000))void refreshOutlook();
  },[capabilities.online,state.seasonalAuto,seasonKey,clockTick]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),8000);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const query=matchMedia('(min-width: 1024px)');const close=()=>{if(query.matches)setMenu(false);};query.addEventListener('change',close);return()=>query.removeEventListener('change',close);},[]);

  function navigate(next:Page){location.hash=next;setPage(next);setMenu(false);window.scrollTo({top:0});}
  function save(next:FarmState){const synced=syncInputCosts(next);const ok=update(synced);if(ok){const fresh=budgetAlerts(synced).filter(a=>!budgetAlerts(state).some(x=>x.id===a.id));setToast(fresh.length?fresh.map(a=>a.title+'. '+a.body).join(' '):'Changes saved');}return ok;}
  const open=(kind:FormKind,record?:EditRecord)=>setForm({kind,record});
  function remove(collection:'fields'|'costs'|'stock'|'equipment',id:string) {
    setConfirm({text:'Remove this record? Existing expenses, soil observations, and maintenance history will be kept.',action:()=>{
      const next=structuredClone(state);
      (next[collection] as {id:string}[])=(next[collection] as {id:string}[]).filter(x=>x.id!==id);
      if(collection==='fields') {next.tasks=next.tasks.filter(x=>x.fieldId!==id);next.allocations=next.allocations?.filter(x=>x.fieldId!==id);next.inputPlans=next.inputPlans?.filter(x=>x.fieldId!==id);}
      if(collection==='stock'){next.allocations=next.allocations?.filter(x=>x.stockId!==id);next.inputPlans=next.inputPlans?.filter(x=>x.stockId!==id);}
      if(collection==='costs'){const cost=state.costs.find(x=>x.id===id);next.services=next.services.map(x=>x.id===cost?.serviceId?{...x,cost:0}:x);next.movements=next.movements?.map(x=>x.id===cost?.movementId?{...x,cost:0}:x);}
      save(next);
    }});
  }
  const totals=budgetTotals(state.profile.budget,state.costs);
  const upcoming=state.tasks.filter(t=>!t.done).sort((a,b)=>a.date.localeCompare(b.date));
  const area=state.fields.reduce((s,f)=>s+f.area,0);
  const spendingAlerts=budgetAlerts(state);
  const farmAlerts=[
    ...spendingAlerts.map(a=>({...a,page:'finance' as Page,kind:'Budget',icon:Wallet})),
    ...(state.inputPlans||[]).filter(p=>planBalance(state,p).shortage>0).map(p=>({id:`shortage:${p.fieldId}:${p.stockId}:${planBalance(state,p).shortage}`,title:`${state.fields.find(f=>f.id===p.fieldId)?.name}: supplies needed`,body:`${number(planBalance(state,p).shortage)} ${state.stock.find(s=>s.id===p.stockId)?.unit} of ${state.stock.find(s=>s.id===p.stockId)?.name} still needed.`,page:'resources' as Page,kind:'Shortage',icon:Package})),
    ...upcoming.filter(t=>t.date<=new Date(Date.now()+7*86400000).toLocaleDateString('en-CA',{timeZone:'Africa/Johannesburg'})).map(t=>({id:`task:${t.id}:${t.date}`,title:t.name,body:`${state.fields.find(f=>f.id===t.fieldId)?.name||'Field'} · ${dateLabel(t.date)}`,page:'planning' as Page,kind:'Planting',icon:CalendarDays})),
    ...state.equipment.filter(e=>serviceState(e,today()).status!=='Up to date').map(e=>({id:`service:${e.id}:${e.nextHours}:${e.dueDate}`,title:`${e.name} · ${serviceState(e,today()).status}`,body:'Review your equipment service schedule.',page:'equipment' as Page,kind:'Maintenance',icon:Wrench})),
    ...state.stock.filter(s=>stockBalance(state,s.id).available<=s.reorder).map(s=>({id:`stock:${s.id}:${s.quantity}`,title:`${s.name} is running low`,body:`${number(stockBalance(state,s.id).available)} ${s.unit} unreserved`,page:'resources' as Page,kind:'Resources',icon:Package})),
    ...state.outlooks.map(o=>({id:o.id,title:'Your seasonal outlook is ready',body:`${dateLabel(o.from)} – ${dateLabel(o.to)} · ${o.location}`,page:'alerts' as Page,kind:'Seasonal',icon:CloudSun})),
  ];
  const unread=farmAlerts.filter(a=>!state.readAlerts.includes(a.id)).length;
  const rowTools=(kind:FormKind,record:EditRecord,collection:Parameters<typeof remove>[0])=><div className="row-tools"><Button variant="ghost" size="icon-sm" aria-label={`Edit ${'name' in record?record.name:'record'}`} onClick={()=>open(kind,record)}><Pencil size={16}/></Button><Button variant="ghost" size="icon-sm" aria-label={`Remove ${'name' in record?record.name:'record'}`} onClick={()=>remove(collection,record.id)}><Trash2 size={16}/></Button></div>;
  async function refreshOutlook(){
    if(weatherRequest.current)return;
    weatherRequest.current=true;update(current=>({...current,seasonalCheck:{key:seasonKey,at:Date.now()}}));setLoadingWeather(true);setWeatherError('');
    try {
      const p=state.profile;
      const response=await fetch('/api/seasonal',{method:'POST',headers:{'Content-Type':'application/json','X-FarmWise-Client':'web'},body:JSON.stringify({latitude:p.latitude,longitude:p.longitude,start:p.seasonStart,end:p.seasonEnd})});
      const body=await response.json();if(!response.ok)throw new Error(body.error||'Could not load the seasonal outlook.');
      const outlook={...body,id:uid(),created:new Date().toISOString(),location:p.location};
      update(current=>({...current,outlooks:[outlook,...current.outlooks].slice(0,6)}));setToast('Seasonal outlook updated');
    }catch(e){setWeatherError((e as Error).message||'Please try again when you are connected.');}
    finally{weatherRequest.current=false;setLoadingWeather(false);}
  }
  const navigation=(mobile=false)=><nav aria-label={mobile?'Mobile navigation':'Main navigation'} className={mobile?'mobile-navigation':'desktop-navigation'}>{pages.map(p=><a key={p.id} href={'#'+p.id} aria-current={page===p.id?'page':undefined} onClick={e=>{e.preventDefault();navigate(p.id);}}><p.icon size={19} strokeWidth={1.7}/><span><strong>{p.label}</strong>{mobile&&<small>{p.description}</small>}</span>{mobile&&<ChevronRight size={17}/>}</a>)}</nav>;
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';

  return <div className="app-shell">
    <a href="#main-content" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Skip to content</a>
    <header className="app-header"><div className="header-inner">
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="menu-toggle" aria-label="Open farm menu"/>}><Menu size={23}/></SheetTrigger>
        <SheetContent side="left" className="farm-menu">
          <Brand/><SheetTitle>Farm menu</SheetTitle><SheetDescription className="sr-only">Choose a section of your farm.</SheetDescription>
          {navigation(true)}
          <button className="menu-profile" onClick={()=>navigate('settings')}><span className="avatar">{state.profile.name.slice(0,1)}</span><span><strong>{state.profile.name}</strong><small><MapPin size={12}/>{state.profile.location}</small></span><Settings size={19}/></button>
        </SheetContent>
      </Sheet>
      <a href="#home" className="brand-link" aria-label="FarmWise home" onClick={()=>navigate('home')}><Brand/></a>
      <span className="header-divider"/><span className="farm-name">{state.profile.farm}</span>
      <div className="header-actions"><span className="language-label">English</span><Button variant="ghost" size="icon" className="bell-button" aria-label={`Notifications, ${unread} unread`} onClick={()=>navigate('alerts')}><Bell size={21}/>{unread>0&&<span className="notification-dot"/>}</Button><Button variant="ghost" size="icon" className="profile-button" aria-label="Farm settings" onClick={()=>navigate('settings')}><span className="avatar">{state.profile.name.slice(0,1)}</span></Button></div>
    </div><div className="navigation-wrap">{navigation()}</div></header>

    <main id="main-content" tabIndex={-1} className="main-content">
      {state.demo&&<div className="demo-banner"><span><span className="sample-dot"/>Sample farm <span className="sample-explanation">· Explore the screens with example data</span></span><button onClick={()=>navigate('settings')}>Set up your farm <ArrowRight size={13}/></button></div>}
      {problem&&<p role="alert" className="form-error">{problem}</p>}
      {(page==='home'||page==='finance')&&spendingAlerts.map(a=><div className="budget-warning" role="alert" key={a.id}><Wallet size={22}/><div><strong>{a.title}</strong><p>{a.body}</p></div>{page==='home'&&<Button secondary onClick={()=>navigate('finance')}>Review budget</Button>}</div>)}

      {page==='home'&&<>
        <Heading title={`${greeting}, ${state.profile.name}.`} description="Here’s what’s happening on your farm." action={<span className="location-label"><MapPin size={15}/>{state.profile.location}</span>}/>
        <div className="home-top-grid">
          <section className="farm-cover"><FarmPhoto/><div className="cover-caption"><span className="cover-tag">YOUR FARM</span><h2>{state.profile.farm}</h2><p>{number(state.profile.land)} ha of land <span>·</span> {state.fields.length} crop {state.fields.length===1?'plan':'plans'}</p></div><span className="photo-credit">Photo: Guangxi Liu / Unsplash</span></section>
          <Card title="Season budget" action={<Wallet size={19} className="muted"/>} className="home-budget">
            <div className="budget-summary"><BudgetRing spent={totals.spent} budget={state.profile.budget}/><div><span className="muted small">Available</span><strong className="budget-available">{money(totals.remaining)}</strong><span className="muted small">of {money(state.profile.budget)}</span></div></div>
            <div className="budget-mini"><span><i className="legend-dot"/>Spent<strong>{money(totals.spent)}</strong></span><span><i className="legend-dot light"/>Planned<strong>{money(totals.planned)}</strong></span></div>
            <Button variant="outline" className="w-full" onClick={()=>navigate('finance')}>View financial plan <ArrowRight size={16}/></Button>
          </Card>
        </div>
        <div className="quick-actions">{[
          {icon:CalendarDays,title:'Plan your season',copy:'Crops and planting schedules',target:'planning' as Page},
          {icon:Package,title:'Manage resources',copy:'Land, fertiliser, feed and water',target:'resources' as Page},
          {icon:Tractor,title:'Keep equipment ready',copy:'Service dates and reminders',target:'equipment' as Page},
        ].map(x=><button key={x.target} onClick={()=>navigate(x.target)}><span className="icon-tile"><x.icon size={22}/></span><span><strong>{x.title}</strong><small>{x.copy}</small></span><ChevronRight size={18}/></button>)}</div>
        <div className="two-columns home-bottom-grid">
          <Card title="Your next steps" action={<LinkButton onClick={()=>navigate('alerts')}>View all</LinkButton>}>
            {farmAlerts.length?farmAlerts.slice(0,3).map(a=><button className="action-row" key={a.id} onClick={()=>navigate(a.page)}><span className="icon-tile soft"><a.icon size={20}/></span><span><strong>{a.title}</strong><small>{a.body}</small></span><ChevronRight size={17}/></button>):<Empty title="Everything is up to date" body="Your next tasks and service reminders will appear here."/>}
          </Card>
          <Card title="This season" action={<LinkButton onClick={()=>navigate('planning')}>View plan</LinkButton>}>
            {state.fields.length?state.fields.map(f=><button className="field-row" key={f.id} onClick={()=>navigate('planning')}><span className="icon-tile soft"><Sprout size={23}/></span><span><strong>{f.crop}</strong><small>{f.name} · {number(f.area)} ha</small></span><span className="pill">{f.status}</span></button>):<Empty title="Add your first crop plan" body="Start with your field, crop, and planting date." action={<Button onClick={()=>open('field')}>Add crop plan</Button>}/>}
            <Button className="w-full mt-5" onClick={()=>open('field')}><Plus size={17}/>Add crop plan</Button>
          </Card>
        </div>
      </>}

      {page==='planning'&&<>
        <Heading title="Planning" description="Your seasonal crop plans and planting schedules." action={<AddButton onClick={()=>open('field')}>Add crop plan</AddButton>}/>
        <div className="season-strip"><CalendarDays size={18}/><strong>{state.profile.season}</strong><span>{dateLabel(state.profile.seasonStart)} – {dateLabel(state.profile.seasonEnd)}</span><Button variant="ghost" size="sm" onClick={()=>navigate('settings')}>Edit season <Pencil size={13}/></Button></div>
        <div className="planning-grid"><div className="stack">
          {state.fields.map(f=><Card className="crop-card" key={f.id}><div className="crop-photo"><FarmPhoto/><span className="pill photo-pill">{f.status}</span></div><div className="crop-card-body"><div className="section-heading"><div><span className="eyebrow">SEASONAL CROP PLAN</span><h2>{f.crop}</h2><p className="muted small">{f.name} · {number(f.area)} ha</p></div>{rowTools('field',f,'fields')}</div><dl className="details"><div><dt>Variety</dt><dd>{f.variety||'Not set'}</dd></div><div><dt>Planting</dt><dd>{dateLabel(f.planted)}</dd></div><div><dt>Expected harvest</dt><dd>{dateLabel(f.harvest)}</dd></div><div><dt>Seed quantity</dt><dd>{number(f.area*f.seedRate)} {f.seedUnit==='kg/ha'?'kg':'seeds'}</dd></div></dl><p className="caption">Calculated from your entered seed rate.</p></div></Card>)}
          {!state.fields.length&&<Card><Empty title="Plan your first field" body="Add a crop, field area, and planting date." action={<Button onClick={()=>open('field')}>Add crop plan</Button>}/></Card>}
        </div><Card title="Planting schedule" action={<Button variant="ghost" size="sm" disabled={!state.fields.length} onClick={()=>open('task')}><Plus size={16}/>Add task</Button>}>
          {state.tasks.length?state.tasks.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=><div className={'schedule-row '+(t.done?'done':'')} key={t.id}><label className="task-check"><input type="checkbox" checked={t.done} aria-label={`Complete ${t.name}`} onChange={()=>save({...state,tasks:state.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)})}/><span><Check size={13}/></span></label><div><span className={'schedule-date '+(t.date<today()&&!t.done?'overdue':'')}>{dateLabel(t.date)}</span><strong>{t.name}</strong><small>{state.fields.find(f=>f.id===t.fieldId)?.name}</small></div><Button variant="ghost" size="icon-sm" aria-label={`Edit task ${t.name}`} onClick={()=>open('task',t)}><Pencil size={14}/></Button><Button variant="ghost" size="icon-sm" aria-label={`Delete task ${t.name}`} onClick={()=>setConfirm({text:'Remove this planting task?',action:()=>{save({...state,tasks:state.tasks.filter(x=>x.id!==t.id)});}})}><Trash2 size={14}/></Button></div>):<Empty title="Give your season a schedule" body="Add tasks for preparing your soil, planting, and crop checks."/>}
        </Card></div>
      </>}

      {page==='finance'&&<>
        <Heading title="Financial Plan" description="Plan your spending and keep track of farm expenses." action={<AddButton onClick={()=>open('cost')}>Add expense</AddButton>}/>
        <Card title={`${state.profile.season} budget`} action={<LinkButton onClick={()=>navigate('settings')}>Edit budget</LinkButton>} className="finance-summary"><div className="finance-values"><div><span>Season budget</span><strong>{money(state.profile.budget)}</strong></div><div><span>Planned costs</span><strong>{money(totals.planned)}</strong></div><div><span>Actually spent</span><strong>{money(totals.spent)}</strong></div><div><span>Available</span><strong className={totals.remaining<0?'overdue':'olive'}>{money(totals.remaining)}</strong></div></div><progress aria-label="Budget spent" max={Math.max(state.profile.budget,1)} value={Math.min(totals.spent,state.profile.budget)}/><div className="budget-meter"><span>{state.profile.budget?Math.round(totals.spent/state.profile.budget*100):0}% of budget spent</span><span>{totals.unallocated<0?`${money(-totals.unallocated)} over planned budget`:`${money(totals.unallocated)} still to allocate`}</span></div></Card>
        <div className="two-columns finance-grid"><Card title="Planned costs">{state.costs.length?state.costs.map(c=>{const Icon=c.category==='Water'?Droplets:c.category==='Seeds'?Sprout:c.category==='Equipment'?Tractor:Package;return <div className="cost-row" key={c.id}><span className="icon-tile soft"><Icon size={20}/></span><div><strong>{c.name}</strong><small>{c.category} · {state.fields.find(f=>f.id===c.fieldId)?.name||(c.fieldId?'Archived field':'Whole farm')}</small></div><span className="cost-value">{money(c.planned)}<small>planned</small></span>{c.inputPlan?<Button secondary size="sm" onClick={()=>navigate('resources')}>Edit requirement</Button>:rowTools('cost',c,'costs')}</div>;}):<Empty title="Start with your expected costs" body="Add seeds, fertiliser, water, and other farm expenses."/>}</Card><Card title="Recent expenses">{state.costs.filter(c=>c.actual>0).sort((a,b)=>b.date.localeCompare(a.date)).map(c=><div className="expense-row" key={c.id}><span className="expense-mark"><Wallet size={17}/></span><div><strong>{c.name}</strong><small>{dateLabel(c.date)}</small></div><strong>{money(c.actual)}</strong></div>)}{!state.costs.some(c=>c.actual>0)&&<Empty title="No expenses recorded" body="Update actual spending as you purchase your inputs."/>}<div className="expense-total"><span>Total spent</span><strong>{money(totals.spent)}</strong></div></Card></div>
      </>}

      {page==='resources'&&<ResourcesPage state={state} save={save} onAdd={()=>open('stock')} tools={s=>rowTools('stock',s,'stock')}/>}
      {page==='soil'&&<SoilPage state={state} save={save} aiEnabled={capabilities.soilAI}/>}

      {page==='equipment'&&<>
        <Heading title="Equipment Care" description="Keep your equipment ready for the next job." action={<AddButton onClick={()=>open('equipment')}>Add equipment</AddButton>}/>
        {state.outlooks[0]&&<button className="season-alert" onClick={()=>navigate('alerts')}><span className="season-alert-icon"><CloudSun size={23}/></span><span><small>SEASONAL UPDATE</small><strong>Your seasonal outlook is ready</strong><p>Review conditions alongside your planting and equipment plans.</p></span><ChevronRight size={20}/></button>}
        <div className="section-heading"><h2>Maintenance reminders</h2><span className="muted small">{state.equipment.length} pieces of equipment</span></div>
        <div className="equipment-grid">{state.equipment.map(e=>{const service=serviceState(e,today());return <Card key={e.id}><div className="equipment-heading"><span className="equipment-icon">{e.name.toLowerCase().includes('pump')?<Droplets size={27}/>:<Tractor size={29}/>}</span><div><h2>{e.name}</h2><span className={'pill '+(service.status==='Due now'?'clay':service.status==='Due soon'?'amber':'')}>{service.status==='Due soon'?'Service due soon':service.status}</span></div>{rowTools('equipment',e,'equipment')}</div><dl className="details"><div><dt>Current hours</dt><dd>{number(e.hours)} h</dd></div><div><dt>Next service</dt><dd>{e.nextHours===null?'Date based':`${number(e.nextHours)} h`}</dd></div>{e.dueDate&&<div><dt>Inspection due</dt><dd>{dateLabel(e.dueDate)}</dd></div>}</dl>{service.hoursLeft!==null&&<div className="hours-remaining"><Wrench size={15}/>{service.hoursLeft<=0?'Service threshold reached':`${number(service.hoursLeft)} operating hours remaining`}</div>}<p className="caption equipment-notes">{e.notes||'Use the maintenance schedule in your equipment manual.'}</p><Button className="w-full" onClick={()=>open('service',e)}><Wrench size={16}/>Log maintenance</Button></Card>;})}</div>
        {!state.equipment.length&&<Card><Empty title="Add your farm equipment" body="Set a service date or operating-hour threshold to receive reminders."/></Card>}
        {state.services.length>0&&<Card title="Maintenance history">{state.services.map(s=><div className="action-row" key={s.id}><span className="icon-tile soft"><CheckCheck size={19}/></span><span><strong>{s.name}</strong><small>{dateLabel(s.date)} · {number(s.hours)} h · {s.notes}</small></span><strong>{money(s.cost)}</strong></div>)}</Card>}
      </>}

      {page==='alerts'&&<>
        <Heading title="Notifications" description="Seasonal updates and the reminders that matter to your farm." action={<Button secondary onClick={()=>save({...state,readAlerts:farmAlerts.map(a=>a.id)})}><CheckCheck size={17}/>Mark all read</Button>}/>
        <div className="two-columns alerts-grid"><Card title="Farm reminders"><div className="reminder-list">{farmAlerts.length?farmAlerts.map(a=><button className={'action-row '+(!state.readAlerts.includes(a.id)?'unread':'')} key={a.id} onClick={()=>{save({...state,readAlerts:[...new Set([...state.readAlerts,a.id])]});navigate(a.page);}}><span className="icon-tile soft"><a.icon size={20}/></span><span><small className="reminder-kind">{a.kind}</small><strong>{a.title}</strong><small>{a.body}</small></span><ChevronRight size={17}/></button>):<Empty title="You’re all caught up" body="Your next farm reminders will appear here."/>}</div></Card><Card title="Seasonal outlook"><span className="season-icon"><CloudSun size={29} strokeWidth={1.5}/></span><h3>{state.profile.season}</h3><p className="muted small">{state.profile.location}</p><p className="caption mt-2">{dateLabel(state.profile.seasonStart)} – {dateLabel(state.profile.seasonEnd)}</p>
          {state.outlooks.slice(0,1).map(o=><div className="seasonal-result" key={o.id}><div><span>Average temperature</span><strong>{o.temperature}°C</strong></div><div><span>Total modelled rainfall</span><strong>{number(o.rainfall)} mm</strong></div><p>{o.days} days covered{o.partial?' · Partial season':''}<br/>{dateLabel(o.from)} – {dateLabel(o.to)}</p><a href="https://open-meteo.com/en/docs/seasonal-forecast-api" target="_blank" rel="noreferrer">Open-Meteo / ECMWF</a></div>)}
          {!state.outlooks.length&&<p className="season-copy">Check the outlook for your growing season to help you review your water and planting plans.</p>}
          {weatherError&&<p role="alert" className="form-error">{weatherError}</p>}
          <Button className="w-full mt-4" onClick={refreshOutlook} disabled={loadingWeather||!capabilities.online}>{loadingWeather?'Checking your season…':'Check my season'}<ArrowRight size={16}/></Button>
          {!capabilities.online&&<p className="caption mt-2">The seasonal service is currently unavailable.</p>}
          <p className="caption mt-4">A regional outlook, with uncertain local conditions. Confirm decisions with field observations and local advice.</p>
        </Card></div><p className="caption">Reminders update while FarmWise is open. Manage automatic seasonal checks in <button className="inline-link" onClick={()=>navigate('settings')}>Farm settings</button>.</p>
      </>}

      {page==='settings'&&<SettingsPage state={state} save={save} online={capabilities.online} ai={capabilities.soilAI} confirm={(text,action)=>setConfirm({text,action})}/>}
      <footer className="page-footer"><span>FarmWise</span><span>Plan your season. Manage your farm.</span><button onClick={()=>navigate('settings')}><Settings size={14}/>Farm settings</button></footer>
    </main>
    {toast&&<div role="status" className="toast"><Check size={16}/>{toast}</div>}
    {form&&<RecordForm kind={form.kind} record={form.record} state={state} onSave={save} onClose={()=>setForm(null)}/>}
    {confirm&&<Modal title="Confirm change" onClose={()=>setConfirm(null)}><p>{confirm.text}</p><div className="modal-actions"><Button secondary onClick={()=>setConfirm(null)}>Cancel</Button><Button onClick={()=>{confirm.action();setConfirm(null);}}>Confirm</Button></div></Modal>}
  </div>;
}
