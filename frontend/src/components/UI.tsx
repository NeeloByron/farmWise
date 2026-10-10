import { type ReactNode, type FormEvent, type ComponentProps } from 'react';
import { Plus, ArrowUpRight, Info, Leaf } from 'lucide-react';
import { Button as PrimitiveButton } from './ui/button';
import { Card as PrimitiveCard, CardHeader, CardTitle, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input as PrimitiveInput } from './ui/input';

export const money = (n:number) => new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
export const number = (n:number) => new Intl.NumberFormat('en-ZA',{maximumFractionDigits:1}).format(n);
export const dateLabel = (s:string) => s ? new Date(s+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}) : 'Not set';
export function Button({secondary=false,...props}:ComponentProps<typeof PrimitiveButton>&{secondary?:boolean}) {
  return <PrimitiveButton type="button" variant={secondary?'outline':'default'} {...props}/>;
}
export function AddButton({children,onClick}:{children:ReactNode;onClick:()=>void}) {return <Button onClick={onClick}><Plus size={17}/>{children}</Button>;}
export function Heading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description:string;action?:ReactNode}) {
  return <div className="page-heading"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="subtitle">{description}</p></div>{action}</div>;
}
export function Card({title,action,children,className=''}:{title?:string;action?:ReactNode;children:ReactNode;className?:string}) {
  return <PrimitiveCard className={className}>{title&&<CardHeader><CardTitle><h2>{title}</h2></CardTitle>{action&&<div className="card-action">{action}</div>}</CardHeader>}<CardContent>{children}</CardContent></PrimitiveCard>;
}
export function Note({children}:{children:ReactNode}) {return <div className="note"><Info size={16}/><div>{children}</div></div>;}
export function Empty({title,body,action}:{title:string;body:string;action?:ReactNode}) {return <div className="empty"><Leaf size={24} strokeWidth={1.5}/><h3>{title}</h3><p>{body}</p>{action}</div>;}
export function Stat({label,value,detail}:{label:string;value:ReactNode;detail:string}) {return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
export function LinkButton({children,onClick}:{children:ReactNode;onClick:()=>void}) {return <PrimitiveButton variant="ghost" size="sm" onClick={onClick}>{children}<ArrowUpRight size={15}/></PrimitiveButton>;}
export function Modal({title,children,onClose,onSubmit,submit='Save'}:{title:string;children:ReactNode;onClose:()=>void;onSubmit?:(e:FormEvent<HTMLFormElement>)=>void;submit?:string}) {
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>{onSubmit?<form onSubmit={onSubmit}>{children}<div className="modal-actions"><Button secondary onClick={onClose}>Cancel</Button><Button type="submit">{submit}</Button></div></form>:children}</DialogContent></Dialog>;
}
export function Input({label,name,type='text',value,required=true,min,max,step,placeholder}:{label:string;name:string;type?:string;value?:string|number;required?:boolean;min?:number|string;max?:number|string;step?:number|string;placeholder?:string}) {
  return <label className="form-field">{label}<PrimitiveInput name={name} type={type} defaultValue={value} required={required} min={min} max={max} step={step} placeholder={placeholder} maxLength={type==='text'?200:undefined}/></label>;
}
export function Select({label,name,value,options}:{label:string;name:string;value?:string;options:{value:string;label:string}[]}) {return <label className="form-field">{label}<select name={name} defaultValue={value}>{options.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>;}
export function Textarea({label,name,value,required=false}:{label:string;name:string;value?:string;required?:boolean}) {return <label className="form-field">{label}<textarea name={name} defaultValue={value} rows={3} maxLength={2000} required={required}/></label>;}
