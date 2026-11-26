import {THREE,U,Batch,GroundFX,Particles,makeComposer,FX,TAU,clamp,lerp,rnd} from './gfx.js';
import {HEROES,FOES,OBJ,model} from './models.js';
import {World} from './world.js';
import {Game} from './game.js';
import {UI} from './ui.js';
import {input} from './input.js';
import {audio} from './audio.js';
import {CHARS,BOSSES,ENEMIES,PCOLF} from './data.js';
import './data2.js';import './models2.js';import {MISC} from './models.js';import {RG} from './regions.js';import {AFIX,ALLB} from './data2.js';import {WEAPONS} from './data.js';import {ULTS,EVENTS} from './combat.js';import {SK,CHANGAS,POI} from './game2.js';import {check} from './missions.js';import {Net} from './net.js';import {installNetUI} from './ui3.js';
const $=s=>document.querySelector(s);
const save={gold:0,un:{},shop:{},bosses:{},evos:{},best:0,kills:0,wins:0,jack:0,st:{},mis:{},seen:{},hx:{}},cfg={mus:.6,sfx:.8,shake:.8,nums:1,q:'media',reg:'pampa',tier:1,prom:[],mode:'mapa'};
try{const s=JSON.parse(localStorage.getItem('salamanca')||'{}');Object.assign(save,s.save||{});Object.assign(cfg,s.cfg||{});}catch(e){}
// partidas de la versión anterior
if(!save.v2){save.v2=1;const b={almamula:1,lobizon:1,teyu:1,futre:1,mandinga:1};for(const k in b)if(save.bosses[k]){save.st['b_'+k]=1;save.seen['b_'+k]=1;}if(save.jack)save.st.jackpot=save.jack;if(save.kills)save.st.bajas=save.kills;check(save);}
audio.vol.m=cfg.mus;audio.vol.s=cfg.sfx;
// ---- iconos renderizados desde los modelos 3D ----
function makeIcons(){const S=144,r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(S,S);r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.25;const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(28,1,.1,100);sc.add(new THREE.HemisphereLight(0xfff2e0,0x6a5070,1.6));const d=new THREE.DirectionalLight(0xffffff,2.6);d.position.set(2,4,5);sc.add(d);const d2=new THREE.DirectionalLight(0x9ac0ff,1.6);d2.position.set(-4,2,-3);sc.add(d2);
  const shot=(geo,ry=0,view)=>{const or=U.uRim.value.clone();U.uRim.value.setRGB(.8,.8,1);const b=new Batch(sc,geo,1,{shadow:false,recv:false});b.begin();b.push(0,0,0,ry,1,.4,0,0);b.end();const bb=geo.boundingBox,c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());let R=sz.length()/2;if(view==='head'){c.set(0,bb.max.y-sz.y*.2,0);R=sz.y*.3;}else if(view==='foe'){c.y=bb.min.y+sz.y*.56;R=Math.max(sz.y,Math.min(sz.x,sz.y*1.3))*.56;}
    if(ry&&view!=='head'){const cs=Math.cos(ry),sn=Math.sin(ry),x=c.x*cs+c.z*sn,z=-c.x*sn+c.z*cs;c.x=x;c.z=z;}const D=R/Math.sin(14*Math.PI/180)*(view?1.02:.86);cam.position.set(c.x+D*.18,c.y+D*(view?.16:.34),c.z+D*.93);cam.lookAt(c);r.render(sc,cam);const u=r.domElement.toDataURL('image/png');sc.remove(b.m);b.m.geometry.dispose();b.m.dispose();U.uRim.value.copy(or);return u;};
  const AL={cofre:'taba',brasas:'brasa',zapateo:'bota',tormenta:'rayo'},HQ=new Set(['hipnosis']);const out={};
  const mk=k=>{try{if(AL[k])return get(AL[k]);if(k.startsWith('h_'))return HEROES[k.slice(2)]&&shot(model(HEROES[k.slice(2)]),.25,'head');if(k.startsWith('f_'))return FOES[k.slice(2)]&&shot(model(FOES[k.slice(2)],.8),.4,'foe');if(k.startsWith('m_'))return MISC[k.slice(2)]&&shot(model(MISC[k.slice(2)],.8),.5,'foe');return OBJ[k]?shot(model(OBJ[k]),.35):'';}catch(e){console.warn(k,e);return '';}};
  const get=k=>k in out?out[k]:(out[k]=mk(k)||'');return new Proxy(out,{get:(t,k)=>typeof k==='string'?get(k):undefined});}
function boot(){
  const cv=$('#c');let renderer;try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});}catch(e){$('#boot').textContent='Tu navegador no pudo iniciar WebGL. Activá la aceleración por hardware y recargá.';return;}
  let icons={};try{icons=makeIcons();}catch(e){console.warn(e);}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=cfg.q!=='baja';renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.5,420);
  const world=new World(scene,cfg.q);if(cfg.q==='media')world.sun.shadow.mapSize.set(1536,1536);
  const fx=new GroundFX(scene,560),parts=new Particles(scene,cfg.q==='baja'?1200:2600);parts.k=cfg.q==='baja'?.45:1;
  installNetUI(UI);const ui=new UI({save,cfg,icons,world});const game=new Game({scene,camera,world,fx,parts,cfg,save,ui});ui.game=game;const net=new Net({game,ui,world,save,cfg});
  let post=null,pr=1,maxPr=Math.min(devicePixelRatio||1,cfg.q==='alta'?2:cfg.q==='media'?1.4:.9);pr=maxPr;
  const ov=$('#ov'),cx=ov.getContext('2d');let W=0,H=0,odpr=1;
  function size(){W=innerWidth;H=innerHeight;renderer.setPixelRatio(pr);renderer.setSize(W,H,false);camera.aspect=W/H;camera.fov=W<H?52:40;camera.updateProjectionMatrix();if(post){post.comp.renderTarget1.dispose();post.comp.renderTarget2.dispose();}post=cfg.q==='baja'?null:makeComposer(renderer,scene,camera);const h=renderer.getDrawingBufferSize(new THREE.Vector2()).y;const px=h/(2*Math.tan(camera.fov*Math.PI/360));parts.mat.uniforms.uPx.value=px;world.aU.px.value=px;odpr=Math.min(2,devicePixelRatio||1);ov.width=W*odpr;ov.height=H*odpr;}
  size();let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(size,120);});
  // ---- escenas de menu ----
  let menuFoes=[],mfr='';let mt=0;const look=new THREE.Vector3(0,1,0),camP=new THREE.Vector3(0,6,20),tp=new THREE.Vector3(),tl=new THREE.Vector3();let rot=0;
  function menuScene(dt){mt+=dt;game.t+=dt;const B=game.b,hs=Object.keys(CHARS);const sc=ui.scr==='config'&&game.state!=='pause'||ui.scr==='shop'||ui.scr==='misiones'?'title':ui.scr;if(world.map.r!==mfr){mfr=world.map.r;const f=RG[mfr].foes;menuFoes=Array.from({length:10},(_,i)=>f[i%f.length]);}
    if(sc==='lobby'||sc==='best')world.fill.position.set(.35,.75,1);if(sc==='lobby'){const row=$('#slots');const z=7.2,cz=16.4,fov=camera.fov*Math.PI/360,ha=Math.tan(fov)*(cz-z)*camera.aspect;ui.slots.forEach((s,i)=>{const e=row&&row.children[i];if(!e)return;const r=e.getBoundingClientRect();const nx=(r.left+r.width/2)/W*2-1;const x=nx*ha;if(!s){fx.draw(FX.RUNE,x,.06,z,0,.9,.9,[.5,.45,.55],.35,0);return;}if(W<=760)return;const t=s.spin?Math.min(1,(performance.now()-s.spin)/320):1;const ry=Math.sin(mt*.6+i)*.3+(1-t)*5;game.drawHero(s.ch,x,(1-t)*.6,z,ry,1.18,mt*1.1+i,0,Math.max(0,Math.sin(mt*.9+i*1.9))**24,0,...(s.dev==='net'||s.dev==='cpu'||ui.unlocked(s.ch)?[0,0,0]:[-.9,-.9,-.9]),0);fx.draw(FX.RUNE,x,.06,z,0,1.2,1.2,PCOLF[i],.95,1);fx.draw(FX.GLOW,x,.05,z,0,2.4,2.4,PCOLF[i],.45);});tp.set(0,2.6,cz+.6);tl.set(0,-.2,z);}
    else if(sc==='best'){rot+=dt*.7;const k=ui.bsel,o=ENEMIES[k]||BOSSES[k],big=!!BOSSES[k],dk=ui.bhide?-2:0;if(!ui.bhide)B['f_'+k].push(0,o.fly?.25+Math.sin(mt*2)*.12:0,8,Math.sin(rot)*.9,(o.s||1)*(big?1:1.35),mt*3,.55,Math.max(0,Math.sin(mt*1.1))**14,0,dk,dk,dk);fx.draw(FX.RUNE,0,.06,8,0,big?3:1.6,big?3:1.6,[1,.4,.2],.9,1);const D=big?12.5:7.2;tp.set(0,big?3.4:1.9,8+D);tl.set(0,big?2.2:1.1,8);}
    else if(sc==='mapa'){const r=RG[cfg.reg],bz=-1;const big=true;B['f_'+r.boss].push(W>900?-7:0,0,W>900?4:-2,.1+Math.sin(mt*.4)*.15,1,mt*2,.2,Math.max(0,Math.sin(mt*.9))**16);menuFoes.forEach((f,i)=>{const a=i/10*TAU+mt*.04,rr=13+Math.sin(i*3)*4;B['f_'+f].push(Math.sin(a)*rr+3,ENEMIES[f].fly?.3:0,Math.cos(a)*rr-4,a+Math.PI,1,mt*3+i,.3,0);});const a=Math.sin(mt*.12)*.35;tp.set(Math.sin(a)*21-4,9.5,Math.cos(a)*21);tl.set(W>900?-4:0,1.2,0);world.fill.position.set(.3,.7,1);}
    else{hs.forEach((h,i)=>{const a=(i/hs.length)*TAU+.4;const x=Math.sin(a)*3.9,z=Math.cos(a)*3.9;game.drawHero(h,x,0,z,a+Math.PI,1,mt+i*2,0,Math.max(0,Math.sin(mt*.8+i*2.3))**20);});menuFoes.forEach((f,i)=>{const a=i/menuFoes.length*TAU+mt*.03,r=15+Math.sin(i*3)*4;const fly=ENEMIES[f].fly;B['f_'+f].push(Math.sin(a)*r,fly?.3:0,Math.cos(a)*r,a+Math.PI,1,mt*3+i,.25,0);});const a=mt*.07+.7;tp.set(Math.sin(a)*13.5,4.6,Math.cos(a)*13.5);const off=W>900?3.2:0;tl.set(-Math.cos(a)*off,1.5,Math.sin(a)*off);world.fill.position.set(Math.sin(a+.4),.6,Math.cos(a+.4));}
    if(Math.random()<dt*14)parts.emit(rnd(-.5,.5),1,rnd(-.5,.5),rnd(-.3,.3),rnd(1.5,3),rnd(-.3,.3),1,.5,.15,.16,1.8,1,.2,.2);
    const k=Math.min(1,dt*3.5);camP.lerp(tp,k);look.lerp(tl,k);camera.position.copy(camP);camera.lookAt(look);}
  // ---- overlay 2D ----
  const v=new THREE.Vector3();const proj=(x,y,z)=>{v.set(x,y,z).project(camera);return v.z<1?[(v.x+1)/2*W,(1-v.y)/2*H]:null;};
  function overlay(){cx.setTransform(odpr,0,0,odpr,0,0);cx.clearRect(0,0,W,H);if(!game.players.length||game.state==='menu')return;cx.textAlign='center';cx.lineJoin='round';
    for(const n of game.nums){const p=proj(n.x,n.y,n.z);if(!p)continue;const a=1-Math.max(0,n.t-.45)/.3,s=(n.t<.1?1+(.1-n.t)*6:1)*n.s;cx.globalAlpha=Math.max(0,a);cx.font=`800 ${18*s}px "Alegreya Sans",sans-serif`;cx.lineWidth=4;cx.strokeStyle='rgba(20,6,16,.85)';cx.strokeText(n.txt,p[0],p[1]);cx.fillStyle=n.col;cx.fillText(n.txt,p[0],p[1]);}cx.globalAlpha=1;
    const lab=(x,y,z,t,c,f=16)=>{const p=proj(x,y,z);if(!p)return;cx.font=`800 ${f}px "Alegreya Sans",sans-serif`;cx.lineWidth=4;cx.strokeStyle='rgba(20,6,16,.85)';cx.strokeText(t,p[0],p[1]);cx.fillStyle=c;cx.fillText(t,p[0],p[1]);};
    if(game.players.length>1)for(const p of game.players)lab(p.x,p.dead?2:2.5,p.z,p.dead?'¡Cebale un mate!':p.nick||'J'+(p.i+1),p.dead?'#9af0b8':p.css,15);
    for(const s of game.shops)if(!s.sold){lab(s.x,2.7,s.z,`${s.n}  $${s.c}`,game.gold>=s.c?'#ffd24a':'#ff8a7a',18);lab(s.x,2.2,s.z,s.d,'#f3e6c8',14);}
    for(const o of game.pois){if(o.used||o.cd>0)continue;const a=game.alive.some(p=>(p.x-o.x)**2+(p.z-o.z)**2<110);if(!a)continue;lab(o.x,2.9,o.z,o.def.n+(o.def.c?'  $'+o.def.c:''),!o.def.c||game.gold>=o.def.c?'#ffd24a':'#ff8a7a',16);lab(o.x,2.45,o.z,o.def.d,'#f3e6c8',13);}
    for(const p of game.players)if(!p.dead&&p.hp<p.s.hp){const q=proj(p.x,-.35,p.z);if(q){cx.fillStyle='rgba(20,6,16,.8)';cx.fillRect(q[0]-25,q[1],50,6);cx.fillStyle=p.hp<p.s.hp*.3?'#ff4a3a':'#5fd68a';cx.fillRect(q[0]-24,q[1]+1,48*p.hp/p.s.hp,4);}}
    for(const e of game.en)if(e.elite&&!e.gone){const q=proj(e.x,2.6*e.s,e.z);if(q){cx.fillStyle='rgba(20,6,16,.8)';cx.fillRect(q[0]-31,q[1],62,7);cx.fillStyle='#f2b33d';cx.fillRect(q[0]-30,q[1]+1,60*Math.max(0,e.hp/e.max),5);if(e.af){cx.font='800 13px "Alegreya Sans",sans-serif';cx.lineWidth=3;cx.strokeStyle='rgba(20,6,16,.9)';cx.strokeText(AFIX[e.af].n,q[0],q[1]-5);cx.fillStyle='#ffe9a0';cx.fillText(AFIX[e.af].n,q[0],q[1]-5);}}}
    // flechas a objetivos fuera de pantalla
    const ptr=(x,z,c,txt)=>{const p=proj(x,.8,z),m=34;if(p&&p[0]>m&&p[0]<W-m&&p[1]>m&&p[1]<H-m)return;const a=p?Math.atan2(p[1]-H/2,p[0]-W/2):Math.atan2(z-game.cam.z,x-game.cam.x);const X=clamp(p?p[0]:W/2+Math.cos(a)*W,m,W-m),Y=clamp(p?p[1]:H/2+Math.sin(a)*W,m+50,H-m-(game.players.length>1&&W>760?104:76));cx.save();cx.translate(X,Y);cx.rotate(a);cx.fillStyle=c;cx.strokeStyle='#1a0a14';cx.lineWidth=3;cx.beginPath();cx.moveTo(16,0);cx.lineTo(-9,-11);cx.lineTo(-4,0);cx.lineTo(-9,11);cx.closePath();cx.stroke();cx.fill();cx.restore();if(txt){const tx=X-Math.cos(a)*24,ty=Y-Math.sin(a)*24+5;cx.font='800 14px "Alegreya Sans",sans-serif';cx.lineWidth=4;cx.strokeStyle='rgba(20,6,16,.85)';cx.strokeText(txt,tx,ty);cx.fillStyle=c;cx.fillText(txt,tx,ty);}};
    if(game.players.length>1)for(const p of game.players)if(!game.isMine(p))ptr(p.x,p.z,p.dead&&Math.sin(game.t*9)>0?'#9af0b8':p.css,p.nick||'J'+(p.i+1));
    for(const k of game.pk)if(k.k!=='plata')ptr(k.x,k.z,k.k==='cofre'?'#ffd24a':'#9af0b8');for(const b of game.bosses)ptr(b.x,b.z,'#ff4a3a');for(const e of game.en)if(e.type==='carbunclo')ptr(e.x,e.z,'#ffb02a');if(game.changa&&game.changa.def.mk)for(const q of game.changa.def.mk(game.changa,game).slice(0,6))ptr(q.x,q.z,'#c8f08a');{let bp=null,bd=1e9;const c=game.center();for(const o of game.pois){if(o.used||o.cd>0)continue;const d=(o.x-c.x)**2+(o.z-c.z)**2;if(d<bd){bd=d;bp=o;}}if(bp&&!game.bosses.length)ptr(bp.x,bp.z,'rgba(243,230,200,.75)');}for(const o of game.evs)if(o.m)ptr(o.x,o.z,'#8ec5e8');if(game.shops.length)ptr(0,-10,'#f2b33d');}
  // ---- bucle ----
  let lt=performance.now(),slowN=0,goodN=0,avg=16,ready=0;
  const ctr={x:0,z:0};
  function step(dt){U.uTime.value+=dt;const devs=new Set(['k1','k2','touch',...input.pads()]);input.poll(devs);ui.tick();
    const playing=game.state!=='menu';game.drawBegin();const online=net.on&&net.phase==='play';if(game.hold){if(!online&&performance.now()<game.hold)dt=.0001;else game.hold=0;}
    if(playing){world.fill.position.set(.35,.75,1);const pd=game.state==='play'?dt:0;if(online)net.frame(dt);else game.update(dt);if(game.wob>0)game.wob-=pd;game.updCam(dt,camera);game.draw(pd);ctr.x=game.cam.x;ctr.z=game.cam.z;ui.hud();parts.update(game.state==='play'?(game.cine?dt*.5:dt):0);game.drawEnd(game.state==='play'?(game.cine&&game.cine.type==='boss'?0:dt):0);}
    else{for(const p of world.u.pp.value)p.y=-99;menuScene(dt);ctr.x=ctr.z=0;parts.update(dt);game.drawEnd(dt);if(game.players.length)game.players=[];}
    if(playing)game.players.forEach((p,i)=>{if(p.dead)world.u.pp.value[i].y=-99;});
    camera.updateMatrixWorld();for(let i=0;i<4;i++){const p=playing&&game.players[i],q=world.u.pv.value[i];if(p)q.set(p.x,1,p.z).applyMatrix4(camera.matrixWorldInverse);else q.set(0,0,99);}scene.fog.far=Math.min(scene.fog.far,playing&&game.prom.has('niebla')?46:999);
    if(playing&&Math.random()<dt*9&&game.state==='play')parts.emit(rnd(-.5,.5),1,rnd(-.5,.5),rnd(-.3,.3),rnd(1.5,3),rnd(-.3,.3),1,.5,.15,.16,1.8,1,.2,.2);
    world.flame&&(world.flame.m.visible=true);world.update(dt,U.uTime.value,ctr,playing?game.ev:{menu:1});}
  function render(){if(post){const u=post.grade.uniforms;u.uHurt.value=lerp(u.uHurt.value,game.state==='play'?game.hurtV:0,.2);u.uWob.value=lerp(u.uWob.value,game.wob>0?1:0,.04);u.uGold.value=lerp(u.uGold.value,Math.min(1,game.goldV||0),.15);u.uTint.value.copy(world.tint);post.bloom.strength=.42+.25*Math.min(1,game.goldV||0);post.comp.render();}else renderer.render(scene,camera);overlay();}
  function frame(now){requestAnimationFrame(frame);net.lastF=performance.now();let raw=(now-lt)/1000;lt=now;const dt=Math.min(.05,Math.max(.001,raw));step(dt);render();
    if(ready++===2)$('#boot').remove();
    // resolución dinámica
    if(raw<.25&&ready>60){avg=avg*.95+raw*1000*.05;if(avg>24){if(++slowN>70&&pr>.6){pr=Math.max(.6,pr*.82);slowN=0;avg=16;size();}}else slowN=0;if(avg<17.5&&pr<maxPr){if(++goodN>900){pr=Math.min(maxPr,pr*1.12);goodN=0;size();}}else goodN=0;}}
  ui.title();net.back=dt=>step(dt);if(window.Arcade)window.Arcade.ready().then(c=>{if(c.online)net.begin(c);}).catch(e=>console.warn(e));window.__S={net,ids:{REG:Object.keys(RG),RG,BOS:ALLB,AF:AFIX,WEP:Object.keys(WEAPONS),CHR:Object.keys(CHARS),ULT:ULTS,SKL:Object.keys(SK),SK,EVS:EVENTS.map(e=>e.id),CHG:CHANGAS.map(c=>c.id),POI},game,ui,world,step,render,camera,input,audio,renderer,scene,get pr(){return pr;}};
  requestAnimationFrame(frame);}
setTimeout(boot,30);
