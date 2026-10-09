import { useEffect, useRef, useId, type ReactNode, type FormEvent } from 'react';
import { X, Plus, ArrowUpRight, Info, Sprout } from 'lucide-react';
export const money = (n:number) => new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
export const number = (n:number) => new Intl.NumberFormat('en-ZA',{maximumFractionDigits:1}).format(n);
export const dateLabel = (s:string) => s ? new Date(s+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}) : 'Not set';
export function Button({children,onClick,secondary=false,type='button',disabled=false}: {children:ReactNode;onClick?:()=>void;secondary?:boolean;type?:'button'|'submit';disabled?:boolean}) {return <button type={type} disabled={disabled} onClick={onClick} className={secondary?'button secondary':'button'}>{children}</button>;}
export function AddButton({children,onClick}:{children:ReactNode;onClick:()=>void}) {return <Button onClick={onClick}><Plus size={17}/>{children}</Button>;}
export function Heading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}) {return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{description}</p></div>{action}</div>;}
export function Card({title,action,children,className=''}:{title?:string;action?:ReactNode;children:ReactNode;className?:string}) {return <section className={'card '+className}>{title&&<div className="section-heading"><h2>{title}</h2>{action}</div>}{children}</section>;}
export function Note({children}:{children:ReactNode}) {return <div className="note"><Info size={17}/><div>{children}</div></div>;}
export function Empty({title,body,action}:{title:string;body:string;action?:ReactNode}) {return <div className="empty"><span className="icon-tile"><Sprout size={26}/></span><h3>{title}</h3><p>{body}</p>{action}</div>;}
export function Stat({label,value,detail}:{label:string;value:ReactNode;detail:string}) {return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
export function LinkButton({children,onClick}:{children:ReactNode;onClick:()=>void}) {return <button className="text-button" onClick={onClick}>{children}<ArrowUpRight size={15}/></button>;}
export function Modal({title,children,onClose,onSubmit,submit='Save'}:{title:string;children:ReactNode;onClose:()=>void;onSubmit?:(e:FormEvent<HTMLFormElement>)=>void;submit?:string}) {
  const ref=useRef<HTMLDialogElement>(null);const titleId=useId();
  useEffect(()=>{const d=ref.current;const previous=document.activeElement as HTMLElement;d?.showModal();return()=>{d?.close();previous?.focus();};},[]);
  return <dialog ref={ref} aria-labelledby={titleId} className="modal" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-top"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X/></button></div>{onSubmit?<form onSubmit={onSubmit}>{children}<div className="modal-actions"><Button secondary onClick={onClose}>Cancel</Button><Button type="submit">{submit}</Button></div></form>:children}</dialog>;
}
export function Input({label,name,type='text',value,required=true,min,max,step,placeholder}:{label:string;name:string;type?:string;value?:string|number;required?:boolean;min?:number|string;max?:number|string;step?:number|string;placeholder?:string}) {return <label className="form-field">{label}<input name={name} type={type} defaultValue={value} required={required} min={min} max={max} step={step} placeholder={placeholder} maxLength={type==='text'?200:undefined}/></label>;}
export function Select({label,name,value,options}:{label:string;name:string;value?:string;options:{value:string;label:string}[]}) {return <label className="form-field">{label}<select name={name} defaultValue={value}>{options.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>;}
export function Textarea({label,name,value,required=false}:{label:string;name:string;value?:string;required?:boolean}) {return <label className="form-field">{label}<textarea name={name} defaultValue={value} rows={3} maxLength={2000} required={required}/></label>;}

