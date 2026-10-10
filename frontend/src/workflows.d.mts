import type { FarmState, InputPlan, Movement } from './types';
export function budgetAlerts(state:FarmState):{id:string;title:string;body:string}[];
export function stockBalance(state:FarmState,id:string):{onHand:number;reserved:number;available:number};
export function planBalance(state:FarmState,plan:InputPlan):{reserved:number;used:number;shortage:number};
export function reserveStock(state:FarmState,input:{fieldId:string;stockId:string;quantity:number}):FarmState;
export function moveStock(state:FarmState,movement:Movement):FarmState;
export function setInputPlan(state:FarmState,plan:InputPlan):FarmState;
export function syncInputCosts(state:FarmState):FarmState;
