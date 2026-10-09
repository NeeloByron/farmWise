// Explicit user/adviser inputs. These calculations never prescribe agronomic rates.
export function positive(value, name, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new Error(`${name} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`);
  return value;
}
export function fertiliserNeed(areaHa, rateKgHa, bagKg, stockKg = 0) {
  positive(areaHa, 'Field area'); positive(rateKgHa, 'Application rate', true); positive(bagKg, 'Bag size'); positive(stockKg, 'Stock', true);
  const kg = areaHa * rateKgHa;
  return { kg, bags: Math.ceil(kg / bagKg), buyKg: Math.max(0, kg - stockKg), buyBags: Math.ceil(Math.max(0, kg - stockKg) / bagKg) };
}
export function irrigationNeed(areaHa, et0, coefficient, effectiveRain, efficiency) {
  positive(areaHa, 'Field area'); positive(et0, 'Reference water demand', true); positive(coefficient, 'Crop coefficient', true); positive(effectiveRain, 'Effective rainfall', true); positive(efficiency, 'Efficiency');
  if (efficiency > 100) throw new Error('Efficiency cannot exceed 100%.');
  const netMm = Math.max(0, et0 * coefficient - effectiveRain);
  return { netMm, litres: Math.round(netMm * areaHa * 10000 / (efficiency / 100)) };
}
export function budgetTotals(budget, costs) {
  const planned = costs.reduce((sum, item) => sum + item.planned, 0);
  const spent = costs.reduce((sum, item) => sum + item.actual, 0);
  return { planned, spent, remaining: budget - spent, unallocated: budget - planned };
}
export function serviceState(item, today) {
  const hoursLeft = item.nextHours == null ? null : item.nextHours - item.hours;
  const due = (hoursLeft != null && hoursLeft <= 0) || (!!item.dueDate && item.dueDate <= today);
  const soonDate = new Date(today + 'T12:00:00Z'); soonDate.setUTCDate(soonDate.getUTCDate() + 7);
  const soon = !due && ((hoursLeft != null && hoursLeft <= 10) || (!!item.dueDate && item.dueDate <= soonDate.toISOString().slice(0, 10)));
  return { status: due ? 'Due now' : soon ? 'Due soon' : 'Up to date', hoursLeft };
}
export function deliveredCost(price, quantity, delivery) {
  positive(price, 'Price', true); positive(quantity, 'Quantity'); positive(delivery, 'Delivery', true);
  return price * quantity + delivery;
}
export function germination(sprouted, tested) {
  positive(tested, 'Seeds tested'); positive(sprouted, 'Seeds sprouted', true);
  if (!Number.isInteger(tested) || !Number.isInteger(sprouted) || sprouted > tested) throw new Error('Enter whole seed counts, with sprouts no greater than seeds tested.');
  return Math.round(sprouted / tested * 100);
}
export function seasonalSummary(data, start, end) {
  const daily = data?.daily;
  if (!daily || !Array.isArray(daily.time)) throw new Error('Seasonal provider returned no usable data.');
  const temp = daily.temperature_2m_mean;
  const rain = daily.precipitation_sum;
  if (!Array.isArray(temp) || !Array.isArray(rain)) throw new Error('Seasonal provider returned incomplete variables.');
  const rows = daily.time.map((date, i) => ({ date, t: temp[i], r: rain[i] })).filter(x => x.date >= start && x.date <= end && Number.isFinite(x.t) && Number.isFinite(x.r));
  if (rows.length < 28) throw new Error('At least 28 days of this season must be within the provider forecast range. Choose dates nearer to today.');
  return { from: rows[0].date, to: rows.at(-1).date, days: rows.length, temperature: Math.round(rows.reduce((s, x) => s + x.t, 0) / rows.length * 10) / 10, rainfall: Math.round(rows.reduce((s, x) => s + x.r, 0)), partial: rows[0].date > start || rows.at(-1).date < end };
}
