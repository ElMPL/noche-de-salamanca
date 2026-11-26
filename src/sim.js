// Azar de la simulación. En el online todas las pantallas comparten la misma semilla y consumen los mismos números;
// lo que es solo adorno (partículas, sonidos, interfaz) usa el azar común para no desfasarlas.
export const SIM={on:false,nat:Math.random,st:new Uint32Array(4),depth:0};
function sfc(){const s=SIM.st;const t=(s[0]+s[1]+s[3])|0;s[3]=s[3]+1;s[0]=s[1]^(s[1]>>>9);s[1]=(s[2]+(s[2]<<3))|0;s[2]=((s[2]<<21)|(s[2]>>>11));s[2]=(s[2]+t)|0;return (t>>>0)/4294967296;}
export function seed(n){SIM.st[0]=n>>>0;SIM.st[1]=(n*2654435761)>>>0;SIM.st[2]=(n^0x9e3779b9)>>>0;SIM.st[3]=1;for(let i=0;i<16;i++)sfc();}
// corre fn con el azar compartido
export function sim(fn){SIM.on=true;Math.random=sfc;try{return fn();}finally{SIM.on=false;Math.random=SIM.nat;}}
// corre fn con el azar común aunque estemos dentro de la simulación
export function nat(fn){if(!SIM.on)return fn();SIM.on=false;Math.random=SIM.nat;try{return fn();}finally{SIM.on=true;Math.random=sfc;}}
export const cosm=fn=>function(...a){if(!SIM.on)return fn.apply(this,a);SIM.on=false;Math.random=SIM.nat;try{return fn.apply(this,a);}finally{SIM.on=true;Math.random=sfc;}};
