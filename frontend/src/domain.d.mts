import type { Cost, Equipment } from './types';
export function fertiliserNeed(areaHa:number, rateKgHa:number, bagKg:number, stockKg?:number): {kg:number;bags:number;buyKg:number;buyBags:number};
export function irrigationNeed(areaHa:number, et0:number, coefficient:number, effectiveRain:number, efficiency:number): {netMm:number;litres:number};
export function budgetTotals(budget:number, costs:Cost[]): {planned:number;spent:number;remaining:number;unallocated:number};
export function serviceState(item:Equipment,today:string): {status:string;hoursLeft:number|null};
export function deliveredCost(price:number,quantity:number,delivery:number):number;
export function germination(sprouted:number,tested:number):number;
