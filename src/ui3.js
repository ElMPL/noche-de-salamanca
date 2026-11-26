// Pantallas del online: sala, carga, cartas por red, pausa sin frenar a nadie y final con cuenta regresiva
import {WEAPONS,PASS,CHARS,PCOL} from './data.js';
import {SKILLS,AMULETS,PROMESAS} from './data2.js';
import {RG,TIERS} from './regions.js';
import {isUn} from './missions.js';
import {input} from './input.js';
import {audio} from './audio.js';
const $=s=>document.querySelector(s),pick=a=>a[Math.random()*a.length|0];
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild;};
const esc=s=>String(s==null?'':s).replace(/[<>&"'`]/g,'');
const ids=Object.keys(CHARS);
const TRUCO=['Ancho de espadas','Ancho de bastos','Siete de espadas','Siete de oro','Un tres','Un dos','Ancho falso','Un rey','Un caballo','Una sota','Siete falso','Un seis','Un cinco','Un cuatro'];
export function installNetUI(UI){
 const P=UI.prototype,old=k=>P[k];
 const o={title:old('title'),lobby:old('lobby'),drawSlots:old('drawSlots'),lobbyTick:old('lobbyTick'),go:old('go'),pause:old('pause'),resume:old('resume'),endScreen:old('endScreen'),tick:old('tick'),luTick:old('luTick'),luReroll:old('luReroll'),luBan:old('luBan'),luOk:old('luOk'),mGo:old('mGo'),quiniela:old('quiniela'),config:old('config')};
 const N=self=>self.net&&self.net.on?self.net:null;
 P.title=function(){return N(this)?(this.game.state==='menu'?this.netLobby():null):o.title.call(this);};
 P.lobby=function(){return N(this)?this.netLobby():o.lobby.call(this);};
 P.drawSlots=function(){return N(this)?this.netDraw():o.drawSlots.call(this);};
 P.go=function(){return N(this)?null:o.go.call(this);};
 P.mGo=function(){const n=N(this);if(!n)return o.mGo.call(this);const c=this.cfg;audio.play('ok');this.store();n.setMap({reg:c.reg,tier:c.tier,mode:c.mode,prom:isUn(this.save,'m','promesas')?c.prom.slice():[]});this.netLobby();};
 // ---------- sala ----------
 P.netLobby=function(){const n=N(this),g=this.game;g.state='menu';audio.track('menu');audio.intensity(0);for(const q of['#hud','#touch','#lu','#quini','#load'])$(q).hidden=true;input.solo=true;this.nrow=0;
  this.show('lobby',`<div class="scr" id="lobby"><header><h2>¿Quiénes pelean?</h2><div class="nbar"><button class="btn sec" data-a="shop">Pulpería</button><button class="btn sec" data-a="misiones">Misiones</button><button class="btn sec" data-a="best">Bestiario</button><button class="btn sec" data-a="config">Config</button></div></header><div><div id="slots"></div><footer><span class="mapn" id="nmap"></span><span class="tip" id="nhint"></span><button class="btn" id="go">¡Listo!</button></footer></div></div>`);
  document.querySelectorAll('.nbar button').forEach(b=>b.onclick=()=>{audio.play('ok');const i=n.slotOf(n.A.me.id);if(n.my.rdy)n.change({rdy:false});this[b.dataset.a]();});
  $('#go').onclick=()=>this.netReady();n.change({});this.netDraw();const m=n.lob.map;this.worldTo(m.mode==='travesia'?'pampa':m.reg,m.tier);};
 P.netReady=function(){const n=N(this);if(!this.unlocked(n.my.ch)){audio.play('back');return;}n.change({rdy:!n.my.rdy});audio.play(n.my.rdy?'ok':'back');};
 P.netDraw=function(){const n=N(this);if(!n||n.phase!=='lobby')return;const spin=this.slots.map(s=>s&&s.spin);this.slots=n.lob.slots.map((s,i)=>s?{...s,dev:s.cpu?'cpu':s.id===n.A.me.id?'k1':'net',spin:spin[i]}:null);if(this.scr!=='lobby')return;const R=$('#slots');if(!R)return;R.innerHTML='';const host=n.isHost,me=n.A.me.id;
  n.lob.slots.forEach((s,i)=>{if(!s){const d=el(`<div class="slot empty"><span>Lugar libre</span>${host?'<button class="btn sec" style="font-size:20px">Sumar CPU</button>':''}</div>`);if(host)d.querySelector('button').onclick=()=>{audio.play('ok');n.addCpu(i);};R.appendChild(d);return;}
   const mine=s.id===me,c=CHARS[s.ch],lk=mine&&!this.unlocked(s.ch),sk=SKILLS[s.sk],am=AMULETS[s.am],hl=mine?this.game.hlv(s.ch):s.hl||0,ed=mine||(s.cpu&&host);const ar=(k,b)=>ed&&(mine||k===0)?`<button aria-label="${b?'Siguiente':'Anterior'}">${b?'›':'‹'}</button>`:'<span></span>';
   const row=(k,ic,nm,ds)=>`<div class="lr ${mine&&this.nrow===k?'on':''}" data-k="${k}">${ar(k,0)}<img alt="" src="${this.icon(ic)}"><span><b>${nm}</b><small>${ds}</small></span>${ar(k,1)}</div>`;
   const st=s.cpu?'Bot':!s.on?'Conectando…':s.rdy?'<b class="rdy">¡Listo!</b>':'Eligiendo…';
   const d=el(`<div class="slot ${mine?'mine':''}" style="--pc:${PCOL[i]}"><div class="dev"><span>${s.cpu?'':esc(s.name)+(mine?' (vos)':'')+(s.id===n.A.ctx.hostId?' · anfitrión':'')+' · '}${st}</span>${s.cpu&&host?'<button class="x" aria-label="Sacar bot">✕</button>':''}</div><img class="port" alt="" src="${this.icon('h_'+s.ch)}"><div class="pick lr0 ${mine&&this.nrow===0?'on':''}">${ar(0,0)}<div><h3>${c.n}</h3><div class="sub">${c.t}${hl?` · maestría ${hl}`:''}</div></div>${ar(0,1)}</div>${lk?`<p class="lock">Bloqueado: ${c.lock}</p>`:`<div class="wpn"><img alt="" src="${this.icon(c.w)}"><span><b>${WEAPONS[c.w].n}</b><br>${c.d}</span></div>${mine?`<p class="ds"><b>Sapucay:</b> ${c.ult}. ${c.ud}</p>`:''}`}${row(1,sk.i,sk.n,mine?sk.d:'')}${row(2,am.i,am.n,mine?am.d:'')}</div>`);
   const x=d.querySelector('.x');if(x)x.onclick=()=>{audio.play('back');n.delCpu(i);};const pb=d.querySelectorAll('.pick button');if(pb.length){pb[0].onclick=()=>mine?this.netCyc(-1,0):n.cycCpu(i,-1);pb[1].onclick=()=>mine?this.netCyc(1,0):n.cycCpu(i,1);}
   if(mine)d.querySelectorAll('.lr').forEach(q=>{const k=+q.dataset.k,b=q.querySelectorAll('button');if(b.length){b[0].onclick=()=>this.netCyc(-1,k);b[1].onclick=()=>this.netCyc(1,k);}});R.appendChild(d);});
  const m=n.lob.map,r=RG[m.mode==='travesia'?'pampa':m.reg],nm=m.mode==='travesia'?'La Travesía':m.tier===3?r.n+': Noche de Mandinga':r.maps[m.tier].n;$('#nmap').innerHTML=`<b>${nm}</b> ${m.mode==='travesia'?'':r.n} · ${TIERS[m.tier].n}${m.prom.length?' · '+m.prom.length+' promesas':''}${host?' <button class="btn sec" id="nch">Cambiar mapa</button>':''}`;
  if(host)$('#nch').onclick=()=>{audio.play('ok');if(n.my.rdy)n.change({rdy:false});Object.assign(this.cfg,{reg:m.reg,tier:m.tier,mode:m.mode,prom:m.prom.slice()});this.mapa();};
  const h=n.humans(),wait=h.filter(s=>!s.rdy&&s.id!==me),at=host?(n.lob.at?Math.max(0,Math.ceil((n.lob.at-performance.now())/1000)):0):n.lob.at||0;$('#nhint').textContent=n.my.rdy?(wait.length?`Esperando a ${wait.map(s=>esc(s.name)).join(', ')}${at?` · arranca en ${at}`:''}`:'Arrancando…'):at?`Arranca en ${at}`:h.length>1?'Cada uno elige y marca ¡Listo!':'Sala '+esc(n.ctx.roomCode||'')+'. Podés sumar bots';
  const b=$('#go');b.textContent=n.my.rdy?'Esperá':'¡Listo!';b.classList.toggle('sec',n.my.rdy);b.disabled=!this.unlocked(n.my.ch);};
 P.netCyc=function(k,row){const n=N(this);this.nrow=row;const i=n.slotOf(n.A.me.id);if(row===0){const ch=ids[(ids.indexOf(n.my.ch)+k+ids.length)%ids.length];if(this.slots[i])this.slots[i].spin=performance.now();n.change({ch,rdy:false});if(this.slots[i])this.slots[i].spin=performance.now();}else{const D=row===1?SKILLS:AMULETS,l=Object.keys(D).filter(q=>row===1?this.unSk(q):this.unAm(q)),f=row===1?'sk':'am';n.change({[f]:l[(l.indexOf(n.my[f])+k+l.length)%l.length],rdy:false});}audio.play('move');this.netDraw();};
 P.lobbyTick=function(){const n=N(this);if(!n)return o.lobbyTick.call(this);for(const d of['k1',...input.pads()]){const s=input.st[d];if(!s)continue;if(s.pL)this.netCyc(-1,this.nrow);if(s.pR)this.netCyc(1,this.nrow);if(s.pU||s.pD){this.nrow=(this.nrow+(s.pD?1:2))%3;audio.play('move');this.netDraw();}if(s.pd||s.ps){this.netReady();return;}}};
 // ---------- carga ----------
 P.netLoad=function(go){const m=go.map,t=m.mode==='travesia',r=RG[t?'pampa':m.reg];this.show(null);const L=$('#load');L.hidden=false;L.className='';L.innerHTML=`<div><h2>${t?'La Travesía':m.tier===3?'Noche de Mandinga':r.maps[m.tier].n}</h2><p class="sub2">${r.n} · ${TIERS[m.tier].n}</p><p class="lore">${r.lore}</p><p class="dato">${r.dato}</p><p class="tip" id="nwait">Juntando a la paisanada…</p></div>`;};
 P.netGo=function(){const L=$('#load');L.className='out';setTimeout(()=>{L.hidden=true;},600);};
 P.netStatus=function(t){if(this.nst===t)return;this.nst=t;let e=$('#nstat');if(!e){e=el('<div id="nstat" hidden></div>');document.body.appendChild(e);}e.hidden=!t;e.textContent=t;const w=$('#nwait');if(w&&t)w.textContent=t;};
 // ---------- por cuadro ----------
 P.tick=function(){const n=N(this);if(n&&n.phase==='play'){this.netCards();if(this.scr==='pause'&&this.game.state!=='play')this.show(null);}return o.tick.call(this);};
 P.luTick=function(){if(N(this))return;return o.luTick.call(this);};
 P.pause=function(){const n=N(this);if(!n)return o.pause.call(this);const h=n.isHost,solo=n.A.players.length===1&&h;if(solo)n.frozen=true;const d=this.show('pause',`<div class="scr center"><div class="panel" style="width:min(460px,100%)"><h2>Descanso</h2><p class="tip">${solo?'Estás solo en la sala: la partida espera.':'Online la partida sigue: ¡no te quedes mucho!'}${h?'':` Demora con el anfitrión: ${n.lagMs} ms.`}</p><div class="menu"><button data-a="r">Seguir</button><button data-a="c">Configuración</button>${h?`<button data-a="q">${solo?'Abandonar':'Terminar para todos'}</button>`:''}</div></div></div>`);const[a,b,c]=d.querySelectorAll('.menu button');a.onclick=()=>this.resume();b.onclick=()=>this.config('pause');if(c)c.onclick=()=>{n.finish(false);n.quit('El anfitrión terminó la partida');};};
 P.resume=function(){const n=N(this);if(n){n.frozen=false;this.show(null);return;}return o.resume.call(this);};
 // ---------- cartas ----------
 P.netCards=function(){const n=N(this),g=this.game,L=g.lu,box=$('#lu');if(!L){if(this.nlu){this.nlu=null;this.nst1=null;box.hidden=true;}return;}const me=n.me();if(!me)return;
  if(this.nlu!==L.id){this.nlu=L.id;box.hidden=false;const R=$('#lup');R.innerHTML='';const cw=innerWidth<760?148:212;const st=this.nst1={net:true,p:me,offers:L.who[me.i].offers,sel:0,row:0,done:false,truco:false,ban:false,wait:false,lock:.3,v:0,el:el(`<div class="lp" style="--pc:${me.css};--cw:${cw}px"><div class="nm"></div><div class="cards"></div><div class="lb"></div></div>`)};R.appendChild(st.el);R.appendChild(el('<div id="nlw"><i></i><span></span></div>'));this.luDraw(st);audio.play('level');}
  const st=this.nst1,w=L.who[me.i];box.querySelector('h2').textContent='¡Nivel '+L.lv+'!';
  if(w.v!==st.v){st.v=w.v;st.wait=false;st.ban=false;st.offers=w.offers;if(w.done&&!st.done){st.done=true;st.sel=w.sel??st.sel;if(w.win!==null){st.win=w.win;st.res=w.win?`¡Quiero y gano!<small>${TRUCO[w.a]} mata ${TRUCO[w.b].toLowerCase()} de Mandinga. Vale doble</small>`:`Te mataron la carta<small>${TRUCO[w.a]} de Mandinga contra ${TRUCO[w.b].toLowerCase()}. Consuelo: 15 patacones</small>`;audio.play(w.win?'win':'lose');}else audio.play('pick');}else audio.play('throw');this.luDraw(st);}
  const left=Math.max(0,L.max-L.t),pend=L.who.filter(q=>!q.done&&q.p!==me&&!q.p.cpu).map(q=>esc(q.p.nick||q.p.name)),e=$('#nlw');if(e){e.firstChild.style.width=left/L.max*100+'%';e.hidden=L.max>100;const t=st.done?(pend.length?'Esperando a '+pend.join(', '):''):st.wait?'…':`${Math.ceil(left)} s para elegir`;if(e.lastChild.textContent!==t)e.lastChild.textContent=t;}
  if(st.done||st.wait)return;if(st.lock>0){st.lock-=.0166;return;}
  for(const d of['k1',...input.pads()]){const s=input.st[d];if(!s)continue;const k=st.row===0?st.offers.length:3;let ch=0;if(s.pL){st.sel=(st.sel+k-1)%k;ch=1;}if(s.pR){st.sel=(st.sel+1)%k;ch=1;}if(s.pD&&st.row===0){st.row=1;st.sel=1;ch=1;}if(s.pU&&st.row===1){st.row=0;st.sel=0;ch=1;}if(ch){audio.play('move');this.luDraw(st);}if(s.pd){this.luOk(st);return;}}};
 P.luReroll=function(st){if(!st.net)return o.luReroll.call(this,st);if(st.done||st.wait||st.p.rer<=0)return;st.wait=true;N(this).cmd(['rer',this.nlu]);};
 P.luBan=function(st){return o.luBan.call(this,st);};
 P.luOk=function(st){if(!st.net)return o.luOk.call(this,st);if(st.done||st.wait||st.lock>0)return;if(st.row===1){st.sel===0?this.luReroll(st):st.sel===1?this.luTruco(st):this.luBan(st);return;}const c=st.offers[st.sel];if(!c)return;
  if(st.ban&&(c.ty==='w'||c.ty==='p')){const own=c.ty==='w'?st.p.w.some(w=>w.id===c.id):st.p.pas[c.id];st.ban=false;if(own||st.p.ban<=0){audio.play('back');this.luDraw(st);return;}st.wait=true;N(this).cmd(['ban',this.nlu,st.sel]);return;}
  st.wait=true;audio.play('ok');st.el.querySelectorAll('.naipe').forEach((q,i)=>q.style.opacity=i===st.sel?1:.35);N(this).cmd(['pick',this.nlu,st.sel,st.truco?1:0]);};
 // ---------- final ----------
 P.endScreen=function(g,win){o.endScreen.call(this,g,win);const n=N(this);if(!n)return;n.finish(win);const B=$('#ui .btns');if(!B)return;let left=win?20:16;const r=g.reg,place=g.mode==='travesia'?'La Travesía':g.def.n,text=win?`👑 ¡Ganaron ${place} (${TIERS[g.tier].n})!`:`Cayeron en la ronda ${g.wave} de ${place}`;const dr=()=>{B.innerHTML=`<span class="ncd">Volviendo a la sala en ${left}…</span>${n.isHost?'<button class="btn" id="nend">Volver ya</button>':''}`;const b=$('#nend');if(b)b.onclick=()=>{left=0;n.quit(text);};};dr();const tk=()=>{if(--left<=0){n.quit(text);B.innerHTML='<span class="ncd">Volviendo a la sala…</span>';left=1;setTimeout(tk,3000);return;}dr();setTimeout(tk,1000);};setTimeout(tk,1000);};
}
