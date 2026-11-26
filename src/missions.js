// Misiones: qué hay que hacer, cuánto va y qué se gana
import {WEAPONS,PASS,CHARS,ENEMIES,BOSSES} from './data.js';
import {SKILLS,AMULETS,ALLB} from './data2.js';
import {REGIONS,RG,TIERS,OPEN} from './regions.js';
export const CATS=['Regiones','Cacería','Oficio','Timba','Personajes','Armas','Secretos'];
export const MIS=[];
const M=(id,cat,n,d,goal,val,...rw)=>MIS.push({id,cat,n,d,goal,val:typeof val==='string'?s=>s.st[val]||0:val,rw});
export const regWon=s=>REGIONS.filter(r=>r.id!=='salamanca'&&(s.st['w_'+r.id]||0)>0).length;
// ---- REGIONES ----
const RWREG={pampa:[['$',60],['c','domadora'],['s','pampero'],['$',700]],monte:[['s','fogon'],['p','cencerro'],['$',250],['$',700]],ibera:[['c','chamamecero'],['a','luna'],['$',280],['$',750]],ingenio:[['c','zafrera'],['w','machete'],['$',300],['$',750]],selva:[['$',120],['$',200],['$',320],['$',800]],puna:[['c','pujllay'],['p','piedrita'],['$',320],['$',800]],cuyo:[['p','pluma'],['a','difunta'],['$',340],['$',850]],sur:[['c','machi'],['a','botas'],['$',360],['$',900]],salamanca:[['a','rosario'],['$',350],['$',500],['$',1500]]};
for(const r of REGIONS)TIERS.forEach((t,i)=>M('w_'+r.id+i,'Regiones',`${r.n}: ${t.n}`,i===0?`Ganá en ${r.n}, en cualquier dificultad.`:`Ganá en ${r.n} en ${t.n} o más.`,i+1,s=>s.st['w_'+r.id]||0,RWREG[r.id][i]));
M('reg4','Regiones','Media patria','Ganá en 4 regiones distintas.',4,regWon,['m','travesia'],['$',150]);
M('reg8','Regiones','La patria entera','Ganá en las 8 regiones antes de la Salamanca.',8,regWon,['$',500]);
M('trav','Regiones','La Travesía','Cruzá las nueve regiones de un tirón.',1,'travesia',['$',1200]);
M('m4all','Regiones','Donde nadie volvió','Ganá 5 regiones en Noche de Mandinga.',5,s=>REGIONS.filter(r=>(s.st['w_'+r.id]||0)>3).length,['$',2500]);
// ---- JEFES ----
M('b_alma','Cacería','Le saqué el freno','Vencé a la Alma Mula.',1,'b_almamula',['c','malambista']);
M('b_lobi','Cacería','Séptimo hijo','Vencé al Lobizón.',1,'b_lobizon',['c','asador']);
M('b_lobi3','Cacería','Bala bendita','Vencé tres veces al Lobizón.',3,'b_lobizon',['w','garras']);
M('b_lobiT','Cacería','Hermano lobo','Vencé al Lobizón en Matrero o más.',3,'bt_lobizon',['c','septimo']);
M('b_toro','Cacería','Aspas de oro','Vencé al Toro Súpay.',1,'b_torosupay',['s','toreada']);
M('b_mand2','Cacería','Cuenta saldada','Vencé dos veces a Mandinga.',2,'b_mandinga',['a','gemelos']);
M('b_mini','Cacería','Jefes de paso','Vencé 8 jefes de ronda.',8,'mini',['p','colmillo']);
for(const b of ALLB)if(!['almamula','lobizon','torosupay'].includes(b))M('bb_'+b,'Cacería','Contra '+BOSSES[b].n,`Vencé a ${BOSSES[b].n}.`,1,'b_'+b,['$',90]);
M('ballm','Cacería','Los doce','Vencé a los doce grandes.',12,s=>ALLB.filter(b=>s.st['b_'+b]).length,['$',900]);
// ---- CACERÍA ----
const HUNT={jinete:[60,['w','lazo']],chonchon:[250,['w','kultrun']],diablito:[300,['w','talco']],huaca:[25,['w','honda']],remolino:[40,['w','zonda']],chancha:[80,['p','cabresto']],zafrero:[300,['p','azucar']],minero:[80,['p','polvora']],duende:[15,['s','trampera']],pombero:[60,['s','paso']],kakuy:[60,['a','kakuyp']],basilisco:[40,['a','ojob']]};
const HN={jinete:'Domador de ánimas',chonchon:'Tué, tué',diablito:'Entierro del carnaval',huaca:'Saqueador arrepentido',remolino:'Cuchillo en cruz',chancha:'Matanza',zafrero:'Fin de zafra',minero:'A cielo abierto',duende:'Sombrerudos',pombero:'Sin tabaco ni caña',kakuy:'¡Turay!',basilisco:'El espejo'};
for(const r of REGIONS)for(const f of r.foes){const e=ENEMIES[f];if(!e)continue;const h=HUNT[f],g=h?h[0]:e.hp<26?400:e.hp<90?120:40;M('k_'+f,'Cacería',HN[f]||e.n,`Bajá ${g} de ${e.n} (${r.n}).`,g,'k_'+f,h?h[1]:['$',e.hp<26?50:e.hp<90?70:100]);}
M('k_car','Cacería','Cazador de Carbunclo','Agarrá 3 Carbunclos.',3,'k_carbunclo',['$',200]);
for(const[n,g,w]of[[3000,['s','espanta']],[10000,['$',300]],[30000,['$',700]],[100000,['$',2000]]].map(([n,w])=>[n,n,w]))M('kt'+n,'Cacería',`${n.toLocaleString('es-AR')} bajas`,`Sumá ${n.toLocaleString('es-AR')} bajas entre todas las partidas.`,g,'bajas',w);
M('dor','Cacería','Buscador de oro','Bajá 25 enemigos dorados.',25,'dorados',['$',120]);
M('afi','Cacería','Contra la maña','Bajá 15 dorados con maña (veloz, vampiro, explosivo…).',15,'afijos',['$',180]);
// ---- OFICIO ----
M('roto1','Oficio','Cacharros','Rompé 25 cosas del mapa.',25,'roto',['p','barro']);
M('roto2','Oficio','Elefante en pulpería','Rompé 80 cosas del mapa.',80,'roto',['w','trabuco']);
M('roto3','Oficio','No quedó tinaja','Rompé 400 cosas del mapa.',400,'roto',['$',250]);
M('ch1','Oficio','Changarín','Cumplí 6 changas.',6,'changa',['w','acordeon']);
M('ch2','Oficio','Peón de confianza','Cumplí 25 changas.',25,'changa',['$',300]);
M('poi1','Oficio','Baqueano','Usá 25 puntos de interés.',25,'poi',['w','hornero']);
M('ent','Oficio','Plata yvyguy','Desenterrá 5 entierros.',5,'entierro',['a','plata']);
M('rev','Oficio','Buen cebador','Levantá compañeros 5 veces.',5,'revivir',['p','fuelle']);
M('sort','Oficio','La sortija','Ganá una carrera de sortija.',1,'sortija',['s','caballo']);
M('coq','Oficio','Amigo de Coquena','Salvale el rebaño a Coquena 2 veces.',2,'coquena',['$',250]);
M('pac','Oficio','Firmé con sangre','Sellá 3 pactos de la Salamanca.',3,'pacto',['a','yerbas']);
M('rac1','Oficio','Racha de 250','Llegá a 250 de racha.',250,'racha',['s','grito']);
M('rac2','Oficio','Racha de 1000','Llegá a 1000 de racha.',1000,'racha',['$',300]);
M('niv1','Oficio','Nivel 25','Llegá a nivel 25 en una partida.',25,'nivel',['$',120]);
M('niv2','Oficio','Nivel 40','Llegá a nivel 40 en una partida.',40,'nivel',['$',350]);
M('dest','Oficio','Mañoso','Usá destrezas 150 veces.',150,'destreza',['$',150]);
M('sap','Oficio','¡Sapucay!','Soltá 60 sapucays.',60,'sapucay',['$',150]);
M('lim','Oficio','Sin despeinarse','Vencé a un jefe grande sin que nadie reciba daño.',1,'limpio',['$',250]);
M('sinc','Oficio','De pie','Ganá sin que caiga nadie.',1,'sincaer',['$',120]);
M('rap','Oficio','Apurado','Ganá en Criollo o más en menos de 10 minutos.',1,'rapido',['$',250]);
M('solo','Oficio','Solo y mi alma','Ganá en Matrero con un solo jugador.',3,'soloT',['$',300]);
M('coop','Oficio','Compadres','Ganá 3 partidas con otro humano.',3,'coop',['$',250]);
M('crio','Oficio','Primera promesa','Ganá cualquier mapa en Criollo.',2,s=>Math.max(0,...REGIONS.map(r=>s.st['w_'+r.id]||0)),['m','promesas']);
M('pr3','Oficio','Penitente','Ganá con 3 promesas a la vez.',3,'promW',['$',400]);
M('pr6','Oficio','Mártir','Ganá con 6 promesas a la vez.',6,'promW',['$',1200]);
M('ev','Oficio','Cosas que pasan','Viví 12 eventos distintos.',12,'eventos',['$',150]);
M('ev2','Oficio','Lo vi todo','Viví 22 eventos distintos.',22,'eventos',['$',400]);
M('sf','Oficio','Sin fin','Llegá a la ronda 25 siguiendo sin fin.',25,'ronda',['$',500]);
// ---- TIMBA ----
M('jk1','Timba','¡Salió el número!','Sacá un JACKPOT.',1,'jackpot',['c','carpincho']);
M('jk3','Timba','Banca rota','Sacá 5 JACKPOTS.',5,'jackpot',['$',777]);
M('qui','Timba','Timbero','Jugá 6 quinielas.',6,'quiniela',['p','espejo']);
M('tab','Timba','Tabero','Tirá 15 tabas.',15,s=>['suerte','culo','lado','clavada'].reduce((a,k)=>a+(s.st['taba_'+k]||0),0),['s','tabita']);
M('clav','Timba','¡Clavada!','Clavá la taba 2 veces.',2,'taba_clavada',['a','plomo']);
M('culo','Timba','Mala yunta','Que te salga culo 10 veces.',10,'taba_culo',['$',110]);
M('tru','Timba','Siete bravo','Ganá 8 trucos contra Mandinga.',8,'truco_g',['a','siete']);
M('tru2','Timba','Quiero vale cuatro','Ganá 30 trucos.',30,'truco_g',['$',300]);
M('oro1','Timba','Tirador lleno','Juntá 2.000 patacones entre todas las partidas.',2000,'oro',['$',200]);
M('oro2','Timba','Estanciero','Juntá 12.000 patacones entre todas las partidas.',12000,'oro',['$',800]);
// ---- PERSONAJES ----
for(const c in CHARS){M('c1_'+c,'Personajes',CHARS[c].n,`Ganá con ${CHARS[c].n}.`,1,'wc_'+c,['$',80]);M('c3_'+c,'Personajes',CHARS[c].n+', matrero',`Ganá en Matrero con ${CHARS[c].n}.`,3,'wct_'+c,['$',180]);}
M('hx','Personajes','Maestría','Subí un personaje a maestría 10.',10,s=>Math.max(0,...Object.values(s.hx).map(x=>Math.min(20,Math.floor(Math.sqrt(x/60))))),['$',300]);
// ---- ARMAS ----
for(const w in WEAPONS)M('e_'+w,'Armas',WEAPONS[w].en,`Evolucioná ${WEAPONS[w].n} con ${PASS[WEAPONS[w].ev].n}.`,1,s=>s.evos[w]?1:0,['$',60]);
M('eall','Armas','Maestro armero','Descubrí 12 evoluciones.',12,s=>Object.keys(s.evos).length,['$',500]);
// ---- SECRETOS ----
M('s_mano','Secretos','De otro mundo','Agarrá La Mano.',1,'mano',['$',110]);
M('s_abd','Secretos','No estamos solos','Viví la noche del OVNI tres veces.',3,'ev_ovni',['$',200]);
M('s_mb','Secretos','Sin sombra','Vencé al Capataz dos veces.',2,'mb_capataz',['$',150]);
M('s_per','Secretos','Durmió la siesta','Vencé tres veces a la Pericana.',3,'mb_pericana',['$',150]);
M('s_t4','Secretos','Le gané al Zupay','Ganá La Salamanca en Noche de Mandinga.',4,'w_salamanca',['$',2000]);
export const RWN={c:id=>'Personaje: '+CHARS[id].n,w:id=>'Arma: '+WEAPONS[id].n,p:id=>'Reliquia: '+PASS[id].n,s:id=>'Destreza: '+SKILLS[id].n,a:id=>'Amuleto: '+AMULETS[id].n,m:id=>id==='travesia'?'Modo: La Travesía':'Se abren las promesas','$':v=>'$'+v};
export const RWI={c:id=>'h_'+id,w:id=>id,p:id=>id,s:id=>SKILLS[id].i,a:id=>AMULETS[id].i,m:()=>'libro','$':()=>'plata'};
export function check(save){const done=[];let again=true;while(again){again=false;for(const m of MIS){if(save.mis[m.id])continue;if(m.val(save)>=m.goal){save.mis[m.id]=1;done.push(m);for(const[t,v]of m.rw){if(t==='$')save.gold+=v;else save.un[t==='c'?v:t+'_'+v]=1;}}}}return done;}
export const regionOpen=(s,id)=>regWon(s)>=OPEN[id];
export const tierOpen=(s,id,t)=>t<2||(s.st['w_'+id]||0)>=t;
export const isUn=(s,t,id)=>!!s.un[t==='c'?id:t+'_'+id];
