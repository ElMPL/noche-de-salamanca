// Online por el SDK de ClaudeArcade. El anfitrión ordena los controles de todos en paquetes numerados y cada pantalla
// simula exactamente lo mismo con ellos (misma semilla, mismo paso fijo). Por la red no viajan enemigos: solo controles.
import {input} from './input.js';
import {audio} from './audio.js';
import {FX} from './gfx.js';
import {CHARS,SHOP} from './data.js';
import {SKILLS,AMULETS,PROMESAS} from './data2.js';
import {RG} from './regions.js';
import {seed,sim,nat,cosm,SIM} from './sim.js';
export const BT=2,HZ=60,DT=1/HZ; // cada paquete trae 2 pasos de 1/60 s
const now=()=>performance.now();
const txt=s=>String(s==null?'':s).replace(/[<>&"'`]/g,'').slice(0,16);
// nada de lo que llega por la red se usa sin revisar
const okSlot=s=>s&&{...s,name:txt(s.name),ch:CHARS[s.ch]?s.ch:'gaucho',sk:SKILLS[s.sk]?s.sk:'pialada',am:AMULETS[s.am]?s.am:'nada',rdy:!!s.rdy,cpu:!!s.cpu,hl:Math.min(20,s.hl|0),...(s.meta?{meta:okMeta(s.meta)}:{})};
const okMeta=m=>{const shop={};for(const k in SHOP)shop[k]=Math.max(0,Math.min(SHOP[k].m,(m.shop||{})[k]|0));return{shop,hl:Math.max(0,Math.min(20,m.hl|0)),un:Array.isArray(m.un)?m.un.filter(k=>typeof k==='string').slice(0,60):[]};};
const okMap=m=>({reg:RG[m.reg]?m.reg:'pampa',tier:Math.max(0,Math.min(3,m.tier|0)),mode:m.mode==='travesia'?'travesia':'mapa',prom:Array.isArray(m.prom)?m.prom.filter(k=>PROMESAS[k]):[]});
export class Net{
  constructor(o){Object.assign(this,o);this.on=false;this.phase='';this.reset();}
  reset(){this.log=[];this.tick=0;this.acc=0;this.inAcc=0;this.seq=0;this.hist=[];this.q=[[],[],[],[]];this.cur=[];this.last=[];this.st=[];this.cmds=[];this.imm=[];this.buf=4;this.pend=new Map();this.E={x:0,z:0};this.real=null;this.pred=null;this.cd=0;this.cu=0;this.ck=0;this.hs=new Map();this.needT=0;this.seen=[0,0,0,0];this.lastB=now();this.stall=0;this.desync=0;this.ff=false;this.minA=99;this.minT=0;this.lagMs=0;this.frozen=false;this.loadOk=new Set();}
  get A(){return window.Arcade;}
  get isHost(){return this.A.isHost();}
  send(t,d,o){try{this.A.send(t,d,o);}catch(e){console.warn(e);}}
  me(){return this.game.players.find(p=>p.id===this.A.me.id);}
  // ---------- entrada a la sala ----------
  begin(ctx){this.on=true;this.ctx=ctx;this.game.net=this;this.ui.net=this;this.wrap();
    this.lob={map:{reg:this.cfg.reg,tier:Math.min(1,this.cfg.tier??0),mode:'mapa',prom:[]},slots:[null,null,null,null]};
    ctx.players.slice().sort((a,b)=>a.slot-b.slot).slice(0,4).forEach((p,i)=>{this.lob.slots[i]=this.newSlot(p);});
    const A=this.A;
    A.on('hi',(d,f)=>this.onHi(d,f));A.on('lob',(d,f)=>{if(f===this.A.ctx.hostId&&!this.isHost){this.gotLob=true;this.setLob(d);}});A.on('set',(d,f)=>{if(this.isHost)this.applySet(d,f);});
    A.on('go',(d,f)=>{if(f===this.A.ctx.hostId)this.load(d);});A.on('ok',(d,f)=>{this.loadOk.add(f);});A.on('run',()=>{});
    A.on('b',(b,f)=>this.onBundle(b,f));A.on('i',(d,f)=>this.onInput(d,f));A.on('cmd',(c,f)=>{if(this.isHost)this.queueCmd(f,c);});
    A.on('need',(d,f)=>this.onNeed(d,f));A.on('log',(d,f)=>{for(const b of d.b)this.onBundle(b,f,true);});A.on('tail',(d,f)=>{for(const b of d.b)this.onBundle(b,f,true);});A.on('back',(d,f)=>{if(this.phase==='lobby'&&!this.isHost)this.load(d.go,true);});
    A.onPlayerLeft(id=>this.onLeft(id));A.onHostChanged(id=>this.onHost(id));
    this.wasHost=this.isHost;this.phase='lobby';this.my=this.mine();this.send('hi',this.hello());if(this.isHost)this.gotLob=true;this.ui.netLobby();this.worker();}
  newSlot(p){return{id:p.id,name:txt(p.name||'Jugador'),ch:'gaucho',sk:'pialada',am:'nada',rdy:false,on:p.id===this.A.me.id};}
  mine(){const s=this.ui.slots[0]||{};const ok=s.ch&&this.ui.unlocked(s.ch);return{ch:ok?s.ch:this.cfg.ch0&&this.ui.unlocked(this.cfg.ch0)?this.cfg.ch0:'gaucho',sk:this.ui.unSk(this.cfg.sk0||'pialada')?this.cfg.sk0||'pialada':'pialada',am:this.ui.unAm(this.cfg.am0||'nada')?this.cfg.am0||'nada':'nada',rdy:false};}
  meta(){const s=this.save;return{shop:{...s.shop},hl:this.game.hlv(this.my?this.my.ch:'gaucho'),un:Object.keys(s.un).filter(k=>k.startsWith('w_')||k.startsWith('p_'))};}
  hello(){return{...this.my,meta:this.meta()};}
  slotOf(id){return this.lob.slots.findIndex(s=>s&&s.id===id);}
  // anfitrión
  onHi(d,f){if(!this.isHost)return;const go=this.go;if(go&&(this.phase==='play'||this.phase==='load')&&go.pl.some(p=>p.id===f)){const p=this.game.players.find(p=>p.id===f);if(p){this.q[p.i]=[];this.cur[p.i]={x:0,z:0,s:0};this.last[p.i]={cd:-1,cu:-1,ck:-1};}this.send('back',{go},{to:f});return;}if(this.phase!=='lobby')return;let i=this.slotOf(f);if(i<0){const p=this.A.players.find(p=>p.id===f);i=this.lob.slots.findIndex(s=>!s);if(i<0)i=this.lob.slots.findIndex(s=>s&&s.cpu);if(i<0||!p)return;this.lob.slots[i]=this.newSlot(p);}const s=this.lob.slots[i];s.on=true;this.applySet(d,f);}
  applySet(d,f){const i=this.slotOf(f);if(i<0)return;const s=this.lob.slots[i];const c=okSlot({...s,ch:d.ch||s.ch,sk:d.sk||s.sk,am:d.am||s.am});s.ch=c.ch;s.sk=c.sk;s.am=c.am;s.on=true;s.rdy=!!d.rdy;if(d.meta)s.meta=okMeta(d.meta);s.hl=s.meta?s.meta.hl:0;this.pub();}
  pub(){if(!this.isHost)return;this.send('lob',{map:this.lob.map,at:this.lob.at||0,slots:this.lob.slots.map(s=>s&&{id:s.id,name:s.name,ch:s.ch,sk:s.sk,am:s.am,rdy:s.rdy,on:s.on,cpu:s.cpu,hl:s.hl||0})});this.ui.netDraw();}
  setLob(d){const old=this.lob;this.lob={map:okMap(d.map||{}),at:d.at|0,slots:[0,1,2,3].map(i=>okSlot((d.slots||[])[i])||null)};d=this.lob;for(const s of this.lob.slots)if(s&&s.id===this.A.me.id)Object.assign(s,this.my);if(old.map.reg!==d.map.reg||old.map.tier!==d.map.tier)this.ui.worldTo(d.map.mode==='travesia'?'pampa':d.map.reg,d.map.tier);this.ui.netDraw();}
  // mi elección
  change(o){Object.assign(this.my,o);if(o.ch)this.cfg.ch0=o.ch;if(o.sk)this.cfg.sk0=o.sk;if(o.am)this.cfg.am0=o.am;this.ui.store();const d=this.hello(),i=this.slotOf(this.A.me.id);if(i>=0)Object.assign(this.lob.slots[i],this.my);if(this.isHost)this.applySet(d,this.A.me.id);else{this.send('set',d);this.ui.netDraw();}}
  setMap(m){if(!this.isHost)return;Object.assign(this.lob.map,m);this.pub();}
  addCpu(i){if(!this.isHost)return;const used=this.lob.slots.filter(Boolean).map(s=>s.ch);const l=Object.keys(CHARS).filter(k=>this.ui.unlocked(k)&&!used.includes(k));const ch=l[Math.random()*l.length|0]||'gaucho';this.lob.slots[i]={id:'cpu'+i,cpu:true,name:'Bot',ch,sk:['pialada','poncho','cebar'][Math.random()*3|0],am:'nada',rdy:true,on:true};this.pub();}
  cycCpu(i,k){const s=this.lob.slots[i],l=Object.keys(CHARS).filter(q=>this.ui.unlocked(q));s.ch=l[(l.indexOf(s.ch)+k+l.length)%l.length];s.spin=now();this.pub();}
  delCpu(i){this.lob.slots[i]=null;this.pub();}
  humans(){return this.lob.slots.filter(s=>s&&!s.cpu);}
  lobbyTick(){if(!this.isHost||this.phase!=='lobby')return;const h=this.humans(),me=h.find(s=>s.id===this.A.me.id),all=h.every(s=>s.rdy);if(me&&me.rdy&&!this.lob.at){this.lob.at=now()+25000;this.atN=0;}if(me&&!me.rdy&&this.lob.at){this.lob.at=0;this.pub();}
    const left=this.lob.at?Math.ceil((this.lob.at-now())/1000):0;if(this.lob.at&&left!==this.atN){this.atN=left;this.send('lob',{map:this.lob.map,at:left,slots:this.lob.slots.map(s=>s&&{id:s.id,name:s.name,ch:s.ch,sk:s.sk,am:s.am,rdy:s.rdy,on:s.on,cpu:s.cpu,hl:s.hl||0})});this.ui.netDraw();}
    if(this.lob.at&&(all||left<=0))this.launch();}
  launch(){this.phase='launch';const m=this.lob.map,hm=this.meta();const pl=this.lob.slots.filter(Boolean).map(s=>({id:s.id,name:s.cpu?'':s.name,cpu:!!s.cpu,ch:s.ch,sk:s.sk,am:s.am,meta:s.meta||hm}));const go={seed:(Math.random()*4294967296)>>>0,map:{...m,prom:(m.prom||[]).slice()},pl};this.send('go',go);this.load(go);}
  // ---------- carga ----------
  load(go,late){if(this.phase==='load'||this.phase==='play')return;this.reset();go={seed:go.seed>>>0,map:okMap(go.map||{}),pl:(go.pl||[]).slice(0,4).map(okSlot)};this.go=go;this.phase='load';this.late=!!late;this.ui.netLoad(go);
    setTimeout(()=>{const g=this.game,id=this.A.me.id;g.reset();input.solo=true;g.net=this;seed(go.seed);
      const slots=go.pl.map(p=>({dev:p.cpu?'cpu':p.id===id?(this.ui.isTouch?'touch':'k1'):'net',id:p.id,net:!p.cpu&&p.id!==id,ch:p.ch,sk:p.sk,am:p.am,nick:p.name,meta:p.meta}));
      g.t=0;g.tickN=0;g.luId=0;sim(()=>g.start(slots,{region:go.map.reg,tier:go.map.tier,mode:go.map.mode,prom:go.map.prom}));g.hold=0;
      this.st=g.players.map(()=>({x:0,z:0,lag:0,s:0}));this.cur=g.players.map(()=>({x:0,z:0}));this.last=g.players.map(()=>({cd:0,cu:0,ck:0}));this.q=g.players.map(()=>[]);this.seen=g.players.map(()=>now());
      this.phase='play';this.started=false;this.waitT=now();this.lastB=now();this.send('ok',1);
      if(this.late)this.send('need',{n:0},{to:this.A.ctx.hostId});},60);}
  // ---------- paquetes ----------
  queueCmd(id,c){const p=this.game.players.find(p=>p.id===id);if(p&&Array.isArray(c)&&c.length<8)this.cmds.push([p.i,...c]);}
  cmd(c){if(this.isHost)this.queueCmd(this.A.me.id,c);else this.send('cmd',c);}
  onInput(d,f){if(!this.isHost||this.phase!=='play')return;const p=this.game.players.find(p=>p.id===f);if(!p||!Array.isArray(d))return;this.seen[p.i]=now();const Q=this.q[p.i],k=Q.length?Q[Q.length-1].s:this.cur[p.i].s||0;if(d[0]<=k&&k-d[0]<2000)return;const lim=v=>Math.max(-100,Math.min(100,v|0));Q.push({s:d[0]|0,x:lim(d[1]),z:lim(d[2]),cd:d[3]|0,cu:d[4]|0,ck:d[5]|0,ack:d[6]|0});if(Q.length>6)Q.splice(0,Q.length-3);}
  makeBundle(){const g=this.game,n=this.log.length,t=n*BT,out=[];
    for(const p of g.players){const i=p.i,S=this.st[i];if(p.cpu&&!p.id){out.push(0);continue;}if(String(p.id).startsWith('cpu')){out.push(0);continue;}
      let b=null;if(p.id===this.A.me.id){b=this.batch();b.ack=t;}else{const Q=this.q[i];if(Q.length>4)Q.splice(0,Q.length-2);b=Q.shift()||null;const idle=now()-this.seen[i];if(idle>2500)this.cur[i]={...this.cur[i],x:0,z:0};if(idle>9000&&!p.cpu)this.cmds.push([i,'cpu',1]);else if(idle<1500&&p.cpu)this.cmds.push([i,'cpu',0]);}
      if(!b){out.push(this.cur[i].x===S.x&&this.cur[i].z===S.z?1:[this.cur[i].x,this.cur[i].z,0,S.lag,S.s]);continue;}
      const L0=this.last[i],L=L0.cd<0?b:L0,btn=(((b.cd-L.cd)&255)?1:0)|(((b.cu-L.cu)&255)?2:0)|(((b.ck-L.ck)&255)?4:0);this.last[i]=b;this.cur[i]={x:b.x,z:b.z,s:b.s};let lag=p.id===this.A.me.id?0:Math.max(0,Math.min(44,t-b.ack));if(lag<3)lag=0;if(Math.abs(lag-S.lag)<3&&S.lag)lag=S.lag;
      out.push(b.x===S.x&&b.z===S.z&&!btn&&lag===S.lag&&b.s===S.s+1?0:[b.x,b.z,btn,lag,b.s]);}
    const b={n,i:out};if(this.cmds.length){b.c=this.cmds;this.cmds=[];}if(this.hash){b.h=this.hash;this.hash=null;}
    this.log.push(b);this.send('b',b);}
  // (los controles viajan como enteros: -0 se volvería 0 al mandarlo y separaría las pantallas)
  onBundle(b,f,old){if(this.phase!=='play'&&this.phase!=='load')return;if(!old&&f!==this.A.ctx.hostId)return;if(!b||typeof b.n!=='number')return;if(this.isHost&&!this.mig)return;this.lastB=now();if(old)this.logT=now();const n=this.log.length;if(b.n<n)return;if(b.n>n){this.pend.set(b.n,b);if(this.pend.size>3000)this.pend.clear();if(now()-this.needT>700&&now()-(this.logT||0)>1500){this.needT=now();this.send('need',{n},{to:this.A.ctx.hostId});}return;}this.log.push(b);let k;while((k=this.pend.get(this.log.length))){this.pend.delete(k.n);this.log.push(k);}for(const q of this.pend.keys())if(q<this.log.length)this.pend.delete(q);}
  onNeed(d,f){if(this.phase!=='play')return;const from=d.n|0;let i=from,k=0;const push=()=>{if(i>=this.log.length||this.phase!=='play')return;const l=[];let sz=0;while(i<this.log.length&&sz<36000){const b=this.log[i++];l.push(b);sz+=JSON.stringify(b).length+1;}this.send('log',{b:l},{to:f});if(++k<400)setTimeout(push,90);};push();}
  // un paso de simulación
  step1(){const g=this.game,k=this.tick%BT,B=this.log[(this.tick/BT)|0];this.imm.length=0;
    sim(()=>{if(k===0){if(B.c)for(const c of B.c)this.runCmd(c);for(const p of g.players){const e=B.i[p.i],S=this.st[p.i];if(p.cpu)continue;let btn=0;if(e===0)S.s++;else if(e!==1&&e){S.x=e[0];S.z=e[1];btn=e[2];S.lag=e[3];S.s=e[4];}p.lagT=S.lag;p.inp={x:S.x/100,z:S.z/100,pd:!!(btn&1),pu:!!(btn&2),ps2:!!(btn&4)};}}
      else for(const p of g.players)if(!p.cpu&&(p.inp.pd||p.inp.pu||p.inp.ps2))p.inp={x:p.inp.x,z:p.inp.z,pd:false,pu:false,ps2:false};
      g.update(DT);});
    this.tick++;if(B.h&&k===0)this.hostHash=B.h;if(this.tick%120===0){const h=this.sum();this.hs.set(this.tick,h);if(this.hs.size>40)this.hs.delete(this.hs.keys().next().value);if(this.isHost)this.hash=[this.tick,h];}
    if(this.hostHash&&this.hs.has(this.hostHash[0])){if(this.hs.get(this.hostHash[0])!==this.hostHash[1]&&!this.desync){this.desync=this.hostHash[0];console.warn('[red] desfasaje en el paso',this.desync);setTimeout(()=>{if(!this.isHost&&!this.ended)this.reenter('desfasaje');},50);}this.hostHash=null;}}
  runCmd(c){const g=this.game,p=g.players[c[0]];if(!p)return;if(c[1]==='cpu'){if(p.cpu!==!!c[2])g.setCpu(p,!!c[2]);}else if(c[1]==='pick'||c[1]==='rer'||c[1]==='ban')g.luCmd(p,c.slice(1));}
  sum(){const g=this.game;let h=SIM.st[0]^SIM.st[2];const m=v=>{h=(Math.imul(h,31)+(v*1000|0))|0;};for(const p of g.players){m(p.x);m(p.z);m(p.hp);m(p.kills);}m(g.gold);m(g.xp);m(g.level);m(g.wave);m(g.en.length);for(const e of g.en){m(e.x);m(e.z);m(e.hp);}m(g.bul.length);m(g.gems.length);m(g.proj.length);m(g.rt);return h;}
  // ---------- mis controles ----------
  sample(){let x=0,z=0;const I=input.st,g=this.game,ok=g.state==='play'&&!this.ui.scr;for(const d of['k1','touch',...input.pads()]){const s=I[d];if(!s)continue;if(Math.hypot(s.x,s.z)>Math.hypot(x,z)){x=s.x;z=s.z;}if(ok){if(s.pd){this.cd++;this.pDash=true;}if(s.pu)this.cu++;if(s.ps2)this.ck++;}}if(!ok)x=z=0;const l=Math.hypot(x,z);if(l>1){x/=l;z/=l;}this.ix=Math.round(x*100);this.iz=Math.round(z*100);}
  batch(){const b={s:++this.seq,x:this.ix|0,z:this.iz|0,cd:this.cd&255,cu:this.cu&255,ck:this.ck&255,pd:!!this.pDash};this.pDash=false;this.hist.push(b);if(this.hist.length>150)this.hist.shift();return b;}
  // ---------- predicción ----------
  predict(){const g=this.game,p=this.me();if(!p||p.dead||p.cpu||this.isHost||g.state!=='play'||g.cine||!this.st[p.i])return null;const S=this.st[p.i],dt=DT*(g.slow>0?.3:1);const q={x:p.x,z:p.z,vx:p.vx,vz:p.vz,ry:p.ry,mv:p.mv,ph:p.ph,dash:p.dash,dx:p.dx||0,dz:p.dz||0,dcd:p.dcd,slowT:p.slowT,rootT:p.rootT,pullT:p.pullT||0,px:p.px||0,pz:p.pz||0};
    for(let k=this.tick%BT;k>0&&k<BT;k++)g.pmove(q,p,{x:S.x/100,z:S.z/100},dt);
    let n=0;for(const b of this.hist){if(b.s<=S.s)continue;if(++n>34)break;const o={x:b.x/100,z:b.z/100,pd:b.pd};for(let k=0;k<BT;k++){g.pmove(q,p,o,dt);o.pd=false;}}
    if(this.inAcc>0)g.pmove(q,p,{x:this.ix/100,z:this.iz/100,pd:this.pDash},Math.min(this.inAcc,BT*DT)*(g.slow>0?.3:1));return q;}
  swapOut(){const r=this.real;if(r){Object.assign(r.p,r.v);this.real=null;}}
  swapIn(dt,A){const g=this.game,q=this.predict();const E=this.E;if(!q){E.x=E.z=0;g.vis=null;this.pred=null;return;}if(A){E.x+=A.x-q.x;E.z+=A.z-q.z;}if(Math.hypot(E.x,E.z)>5)E.x=E.z=0;const f=Math.exp(-dt*9);E.x*=f;E.z*=f;const p=this.me();this.real={p,v:{x:p.x,z:p.z,ry:p.ry,mv:p.mv,ph:p.ph,dash:p.dash}};g.vis={p,ox:q.x+E.x-p.x,oz:q.z+E.z-p.z};p.x=q.x+E.x;p.z=q.z+E.z;p.ry=q.ry;p.mv=q.mv;p.ph=q.ph;p.dash=q.dash;this.pred=q;g.world.u.pp.value[p.i].set(p.x,0,p.z);}
  // ---------- por cuadro ----------
  frame(dt){const g=this.game;this.swapOut();this.sample();if(this.phase!=='play'){return;}
    // barrera: arrancar cuando cargaron todos
    if(!this.started){if(this.isHost){const ids=this.go.pl.filter(p=>!p.cpu&&p.id!==this.A.me.id&&this.A.players.some(q=>q.id===p.id)).map(p=>p.id);if(ids.every(id=>this.loadOk.has(id))||now()-this.waitT>20000)this.started=true;}else if(this.log.length>3)this.started=true;if(this.started){this.ui.netGo();this.acc=0;}else{this.lastB=now();return;}}
    if(this.isHost&&!this.mig){this.ui.netStatus('');if(this.frozen){if(this.A.players.length>1)this.frozen=false;else{this.after(dt,null);return;}}this.acc+=Math.min(.25,dt)*HZ;let n=0;while(this.acc>=1&&n++<20){if(this.tick>=this.log.length*BT){if(this.ended)break;this.makeBundle();}this.step1();this.acc--;}if(this.tick<this.log.length*BT-BT*2){const t0=now();while(this.tick<this.log.length*BT&&now()-t0<9)this.step1();}this.after(dt,null);return;}
    if(this.mig){this.after(dt,null);return;}
    this.inAcc+=Math.min(.25,dt);while(this.inAcc>=BT*DT){this.inAcc-=BT*DT;const dashed=this.pDash&&this.pred&&this.pred.dcd<=0;const b=this.batch();if(b.pd&&this.pred&&this.pred.dcd<=.02||dashed)audio.play('dash');this.send('i',[b.s,b.x,b.z,b.cd,b.cu,b.ck,this.tick],{volatile:true});}
    const A=this.predict();let av=this.log.length*BT-this.tick;
    if(av>100||this.ff){const t0=now();this.ff=av>40;while(this.tick<this.log.length*BT&&now()-t0<(av>600?24:11))this.step1();this.ui.netStatus(av>600?`Poniéndote al día… ${Math.round(this.tick/(this.log.length*BT)*100)}%`:'');this.acc=0;this.E.x=this.E.z=0;this.after(dt,null);return;}
    const rate=1+Math.max(-.2,Math.min(.3,(av-this.buf)*.025));this.acc+=dt*HZ*rate;let n=Math.floor(this.acc);if(n>av){n=av;if(this.log.length&&!this.ended)this.buf=Math.min(14,this.buf+.5);this.acc=0;}else this.acc-=n;
    this.minA=Math.min(this.minA,av-n);this.minT+=dt;if(this.minT>3){if(this.minA>2&&this.buf>3)this.buf-=.5;this.minA=99;this.minT=0;}
    for(let i=0;i<n;i++)this.step1();const st=now()-this.lastB;this.ui.netStatus(st>1600&&!this.ended?'Esperando al anfitrión…':'');this.after(dt,A);}
  after(dt,A){this.swapIn(dt,A);const p=this.me();if(p&&!this.isHost)this.lagMs=Math.round((this.st[p.i]?this.st[p.i].lag:0)*DT*1000);const d=this.fxDraw;for(const a of this.imm)d.apply(this.game.fx,a);}
  // pestaña en segundo plano: seguir simulando para no frenar a los demás
  worker(){if(this.wk)return;try{const u=URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),33)'],{type:'text/javascript'}));this.wk=new Worker(u);let lt=now();this.wk.onmessage=()=>{const t=now();if(this.on&&t-(this.lastF||0)>220&&this.back)this.back(Math.min(.25,(t-lt)/1000));lt=t;this.poll();};}catch(e){this.wk=setInterval(()=>this.poll(),250);}}
  poll(){if(this.phase==='lobby')this.lobbyTick();if(this.phase==='lobby'&&!this.isHost&&!this.gotLob&&now()-(this.hiT||0)>1500){this.hiT=now();this.send('hi',this.hello());}}
  // ---------- idas y vueltas ----------
  onLeft(id){if(this.phase==='lobby'){const i=this.slotOf(id);if(i>=0){this.lob.slots[i]=null;if(this.isHost)this.pub();else this.ui.netDraw();}return;}if(this.isHost&&this.phase==='play'){const p=this.game.players.find(p=>p.id===id);if(p){this.seen[p.i]=-1e9;if(!p.cpu)this.cmds.push([p.i,'cpu',1]);}}}
  // volver a entrar: se recarga el juego y se recupera la partida desde el registro de otro jugador
  reenter(why){let n=0;try{n=+(sessionStorage.getItem('ndsRe')||0);if(n>3)return;sessionStorage.setItem('ndsRe',n+1);}catch(e){return;}console.warn('[red] reingreso:',why);location.reload();}
  onHost(id){const was=this.wasHost;this.wasHost=id===this.A.me.id;if(was&&!this.wasHost&&this.phase==='play'&&!this.ended){this.reenter('otro quedó de anfitrión');return;}if(this.phase==='lobby'){if(id===this.A.me.id)this.pub();else this.send('set',this.hello(),{to:id});this.ui.netDraw();return;}if(this.phase!=='play')return;this.ui.toast(id===this.A.me.id?'Ahora sos el anfitrión':'Cambió el anfitrión','estampita');
    if(id===this.A.me.id){this.swapOut();this.mig=true;this.pend.clear();setTimeout(()=>{this.mig=false;this.started=true;const here=new Set(this.A.players.map(p=>p.id));this.seen=this.game.players.map(p=>here.has(p.id)?now():-1e9);const S=this.st;this.game.players.forEach((p,i)=>{this.q[i]=[];this.last[i]={cd:-1,cu:-1,ck:-1};this.cur[i]={x:0,z:0,s:S[i]?S[i].s:0};});const p=this.me();if(p){this.last[p.i]={cd:this.cd&255,cu:this.cu&255,ck:this.ck&255};}this.resync=true;this.E.x=this.E.z=0;},900);}
    else setTimeout(()=>{const from=Math.max(0,this.log.length-240);this.send('tail',{b:this.log.slice(from).slice(-240)},{to:id});},60);}
  finish(win){try{sessionStorage.removeItem('ndsRe');}catch(e){}if(this.ended)return;this.ended=true;const here=new Set(this.A.players.map(p=>p.id));this.res={winners:win?this.game.players.filter(p=>p.id&&here.has(p.id)&&!String(p.id).startsWith('cpu')).map(p=>p.id):[],win};}
  quit(text){if(!this.isHost)return;const r=this.res||{winners:[]};this.A.end({winners:r.winners,text});}
  // envoltorios: lo cosmético no toca el azar compartido
  wrap(){const g=this.game,w=(o,k)=>{if(typeof o[k]==='function'){const f=o[k];o[k]=cosm(function(...a){return f.apply(o,a);});}};
    const off=(o,k)=>{const f=o[k];o[k]=function(a0,a1,a2,a3,...r){if(!SIM.on)return f.call(o,a0,a1,a2,a3,...r);if(this.ff)return;const v=g.vis;if(v&&g.cur===v.p){if(k==='spawn'){a1+=v.ox;a2+=v.oz;}else{a0+=v.ox;a2+=v.oz;}}return nat(()=>f.call(o,a0,a1,a2,a3,...r));};};
    off(g.fx,'spawn');off(g.parts,'emit');off(g.parts,'burst');
    const d=g.fx.draw;this.fxDraw=d;g.fx.draw=(...a)=>{if(SIM.on){const v=g.vis;if(v&&g.cur===v.p){a[1]+=v.ox;a[3]+=v.oz;}if(this.imm.length<200)this.imm.push(a);}else d.apply(g.fx,a);};
    for(const k of['play','track','intensity'])w(audio,k);for(const k of['hide','lightAt'])w(g.world,k);
    for(const k of['toast','banner','loot','taba','quiniela','sapucay','bossIntro','endScreen','missions','store','icon','fade','enterGame'])w(this.ui,k);}
}
