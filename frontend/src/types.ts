export type Field = { id:string; name:string; area:number; crop:string; variety:string; planted:string; harvest:string; status:'Planned'|'Growing'|'Harvested'; seedRate:number; seedUnit:'kg/ha'|'seeds/ha' };
export type Task = {id:string;fieldId:string;name:string;date:string;done:boolean};
export type Cost = {id:string;name:string;category:string;fieldId:string;planned:number;actual:number;date:string};
export type Stock = {id:string;name:string;category:string;quantity:number;unit:string;reorder:number};
export type Equipment = {id:string;name:string;hours:number;nextHours:number|null;interval:number;dueDate:string;notes:string};
export type Service = {id:string;equipmentId:string;name:string;date:string;hours:number;cost:number;notes:string};
export type Soil = {id:string;fieldId:string;date:string;notes:string;photo:string;ph:string;lab:string;analysis:string};
export type SeedTest = {id:string;fieldId:string;batch:string;tested:number;sprouted:number;date:string};
export type Quote = {id:string;supplier:string;product:string;spec:string;unit:string;price:number;delivery:number;quantity:number;expires:string};
export type Group = {id:string;name:string;product:string;target:number;pledged:number;mine:number;unit:string;deadline:string;status:string};
export type Outlook = {id:string;created:string;from:string;to:string;days:number;temperature:number;rainfall:number;partial:boolean;source:string;location:string};
export type FarmState = {version:1;demo:boolean;seasonalAuto?:boolean;seasonalCheck?:{key:string;at:number};profile:{name:string;farm:string;location:string;latitude:number;longitude:number;land:number;season:string;seasonStart:string;seasonEnd:string;budget:number};fields:Field[];tasks:Task[];costs:Cost[];stock:Stock[];equipment:Equipment[];services:Service[];soil:Soil[];seedTests:SeedTest[];quotes:Quote[];groups:Group[];outlooks:Outlook[];readAlerts:string[]};
export type Page = 'home'|'planning'|'finance'|'resources'|'soil'|'equipment'|'buying'|'alerts'|'settings';

