// Teclado (2 jugadores), hasta 4 joysticks y pantalla táctil
const keys={},down={};
const MAP={k1:{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],dash:['Space'],ult:['KeyE'],sk:['KeyQ']},k2:{l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],dash:['Enter','Numpad0'],ult:['Backspace','NumpadDecimal','Minus'],sk:['ShiftRight','ControlRight','Numpad1','Slash']}};
const NAV=new Set(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Backspace','Tab']);
export const input={solo:true,touch:{on:false,x:0,z:0,dash:false,ult:false,sk:false},st:{},any:null};
addEventListener('keydown',e=>{const tg=e.target;if(tg&&(tg.tagName==='INPUT'&&tg.type==='range')&&e.code.startsWith('Arrow'))return;if(NAV.has(e.code))e.preventDefault();if(!e.repeat){keys[e.code]=1;down[e.code]=1;}});
addEventListener('keyup',e=>{keys[e.code]=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});
const any=(a,o)=>a.some(k=>o[k]);
function raw(dev){
  if(dev==='k1'||dev==='k2'){const ms=input.solo&&dev==='k1'?[MAP.k1,{...MAP.k2,ult:['Backspace','KeyR'],sk:['ControlRight','ShiftRight','KeyF'],dash:['Enter','ShiftLeft']}]:[MAP[dev]];const g=(k,o)=>ms.some(m=>any(m[k],o));
    const h=k=>g(k,keys)||g(k,down)?1:0,x=h('r')-h('l'),z=h('d')-h('u'),n=x&&z?.7071:1;return{x:x*n,z:z*n,dash:g('dash',keys)||g('dash',down),ult:g('ult',keys)||g('ult',down),sk:g('sk',keys)||g('sk',down),start:false,back:false};}
  if(dev==='touch')return{x:input.touch.x,z:input.touch.z,dash:input.touch.dash,ult:input.touch.ult,sk:input.touch.sk};
  if(dev&&dev.startsWith('gp')){let p=null;try{p=navigator.getGamepads?.()[+dev[2]];}catch(e){}if(!p)return{x:0,z:0};const b=i=>!!p.buttons[i]?.pressed;let x=p.axes[0]||0,z=p.axes[1]||0;if(Math.hypot(x,z)<.22){x=0;z=0;}if(b(14))x=-1;if(b(15))x=1;if(b(12))z=-1;if(b(13))z=1;const l=Math.hypot(x,z);if(l>1){x/=l;z/=l;}return{x,z,dash:b(0)||b(5),ult:b(2)||b(7),sk:b(3)||b(6)||b(4),start:b(9),back:b(1)};}
  return{x:0,z:0};}
// estado con flancos; llamar una vez por frame
input.poll=function(devs){const now=performance.now();for(const d of devs){const r=raw(d),p=input.st[d]||{};const L=r.x<-.5,R=r.x>.5,Up=r.z<-.5,Dn=r.z>.5;const s={x:r.x||0,z:r.z||0,dash:!!r.dash,ult:!!r.ult,sk:!!r.sk,L,R,Up,Dn,start:!!r.start,back:!!r.back,pd:!!r.dash&&!p.dash,pu:!!r.ult&&!p.ult,ps2:!!r.sk&&!p.sk,pL:L&&!p.L,pR:R&&!p.R,pU:Up&&!p.Up,pD:Dn&&!p.Dn,ps:!!r.start&&!p.start,pb:!!r.back&&!p.back};input.st[d]=s;}
  input.esc=!!(down.Escape||down.KeyP);for(const k in down)delete down[k];};
input.pads=()=>{try{return[...(navigator.getGamepads?.()||[])].map((p,i)=>p?'gp'+i:null).filter(Boolean);}catch(e){return[];}};
input.rumble=(dev,m,ms)=>{if(!dev||!dev.startsWith('gp'))return;try{navigator.getGamepads()[+dev[2]]?.vibrationActuator?.playEffect('dual-rumble',{duration:ms,strongMagnitude:m,weakMagnitude:m*.6});}catch(e){}};
export const DEVN={k1:'Teclado WASD',k2:'Teclado flechas',gp0:'Joystick 1',gp1:'Joystick 2',gp2:'Joystick 3',gp3:'Joystick 4',touch:'Táctil',cpu:'Compadre CPU'};
