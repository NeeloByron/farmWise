import { useState } from 'react';
import { ImageOff } from 'lucide-react';

// Photo: Guangxi Liu / Unsplash, https://unsplash.com/photos/g7aV_MPMMo0
const image='https://images.unsplash.com/photo-1763712852810-a05c11be36e6?auto=format&fit=crop&w=1400&q=85';
export function FarmPhoto({className=''}:{className?:string}) {
  const [failed,setFailed]=useState(false);
  return failed?<div className={'photo-fallback '+className}><ImageOff size={22}/><span>Farm photograph unavailable</span></div>:<img className={'farm-photo '+className} src={image} alt="Green maize plants across a field beneath a clear sky" onError={()=>setFailed(true)} fetchPriority="high"/>;
}
