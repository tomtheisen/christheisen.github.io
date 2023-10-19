// export interface Amount {
// Da: number,
// ng?: number,
// Kg?: number,
// Eg?: number,
// MO?: number
// }
export {};
// export function AddAmounts(a: Amount, b: Amount): Amount{
// const o  = DefaultAmount();
// o.Da = a.Da + b.Da;
// if(o.Da > MassUnitInfo.Da.c){
// o.ng = Math.floor(o.Da/MassUnitInfo.Da.c);
// o.Da %= MassUnitInfo.Da.c;
// }
// if(!!a?.ng || !!b?.ng){
// o.ng = o.ng??0 + a?.ng??0 + b?.ng??0;
// if(o.ng > MassUnitInfo.ng.c){
// o.Kg = Math.floor(o.ng??0/MassUnitInfo.ng.c);
// o.ng %= MassUnitInfo.ng.c;
// }
// }
// if(!!a?.Kg || !!b?.Kg){
// o.Kg = o.Kg??0 + a?.Kg??0 + b?.Kg??0;
// if(o.Kg > MassUnitInfo.Kg.c){
// o.Eg = Math.floor(o.Kg??0/MassUnitInfo.Kg.c);
// o.Kg %= MassUnitInfo.Kg.c;
// }
// }
// if(!!a?.Eg || !!b?.Eg){
// o.Eg = o.Eg??0 + a?.Eg??0 + b?.Eg??0;
// if(o.Eg > MassUnitInfo.Eg.c){
// o.MO = Math.floor(o.Eg??0/MassUnitInfo.Eg.c);
// o.Eg %= MassUnitInfo.Eg.c;
// }
// }
// o.MO = o?.MO??0 + a?.MO??0 + b?.MO??0;
// //if MO gets too big then idk; maybe I'll invent a new unit.
// return o;
// }
// export function BuildAmount(qty: number, u: MassUnits): Amount{
// const output = DefaultAmount();
// type MassKey = keyof typeof Amount;
// const o = DefaultAmount();
// const key = MassUnits[u];
// o[key as MassKey] = qty;
// return o;
// }
// export function DefaultAmount():Amount{
// return {Da:0} as Amount;
// }
