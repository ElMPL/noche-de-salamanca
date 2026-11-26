import {THREE,B,DET,U,TAU,rnd,lerp,clamp,charMaterial,Batch} from './gfx.js';
import {KIT} from './deco.js';
import {RG,buildLayout,palette} from './regions.js';
const C=h=>new THREE.Color(h);
const MAXP=40;
const NOISE=`float h21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*ns(p);p=p*2.03+7.1;a*=.5;}return s;}`;
export class World{
  constructor(scene,q){this.scene=scene;this.q=q;this.bts=[];this.map=null;
    this.u={uN:{value:2},uH:{value:new THREE.Vector2(36,36)},uOut:{value:0},uHex:{value:0},uPa:{value:Array.from({length:MAXP},()=>new THREE.Vector4(0,0,-1,0))},uNP:{value:0},pv:{value:[0,1,2,3].map(()=>new THREE.Vector3(0,0,99))},top:{value:C(0)},mid:{value:C(0)},hor:{value:C(0)},sunC:{value:C(0)},sunD:{value:new THREE.Vector3()},star:{value:0},moon:{value:0},gA:{value:C(0)},gB:{value:C(0)},gC:{value:C(0)},m0:{value:C(0)},m1:{value:C(0)},m2:{value:C(0)},band:{value:0},fogC:{value:C(0)},gr:{value:C(0)},gr2:{value:C(0)},flash:{value:0},wind:{value:1},red:{value:0},pp:{value:[0,1,2,3].map(()=>new THREE.Vector3(0,-99,0))},storm:{value:0}};
    scene.fog=new THREE.Fog(0,40,140);
    this.hemi=new THREE.HemisphereLight(0xffffff,0x444444,1);scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffffff,2);this.sun.castShadow=true;const s=this.sun.shadow;s.mapSize.set(2048,2048);s.camera.left=s.camera.bottom=-40;s.camera.right=s.camera.top=40;s.camera.near=1;s.camera.far=160;s.bias=-.0006;s.normalBias=.05;scene.add(this.sun,this.sun.target);
    this.fill=new THREE.DirectionalLight(0xfff0e2,.9);this.fill.position.set(.35,.75,1);scene.add(this.fill);
    this.fire=new THREE.PointLight(0xff8a3a,45,17,1.7);this.fire.position.set(0,1.7,0);scene.add(this.fire);
    this.fxL=new THREE.PointLight(0xffffff,0,30,1.6);this.fxL.position.y=4;scene.add(this.fxL);
    this.mat=charMaterial({rough:.9,fade:this.u.pv});this.sky();this.ground();this.mountains();this.grass();this.ambient();this.rain();this.load('pampa',0);
  }
  sky(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{...this.u,uTime:U.uTime},
    vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*mat4(mat3(modelViewMatrix))*vec4(position,1.);gl_Position=p.xyww;}`,
    fragmentShader:`varying vec3 vD;uniform vec3 top,mid,hor,sunC,sunD;uniform float star,moon,uTime,flash,red,storm;${NOISE}
     float st(vec2 p,float sz){float d=length(p);return smoothstep(sz,0.,d)+smoothstep(sz*.35,0.,d)*2.;}
     void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(hor,mid,smoothstep(0.,.22,y));c=mix(c,top,smoothstep(.16,.75,y));
      vec2 sp=vec2(atan(d.x,d.z),asin(clamp(d.y,-1.,1.)));
      vec2 g=sp*vec2(70.,70.);vec2 id=floor(g);float h=h21(id);vec2 o=vec2(h21(id+3.),h21(id+7.))-.5;float tw=.6+.4*sin(uTime*(1.+h*4.)+h*40.);c+=star*step(.86,h)*smoothstep(.12,0.,length(fract(g)-.5-o*.7))*tw*vec3(.9,.95,1.1)*smoothstep(.02,.2,y);
      float mw=fbm(sp*vec2(3.,4.)+vec2(0.,sp.x*.8));c+=star*smoothstep(.5,.95,mw)*vec3(.16,.16,.3)*smoothstep(.35,.0,abs(sp.y-.55-.25*sin(sp.x*1.3)));
      vec2 cs=sp-vec2(2.75,.42);float cru=st(cs-vec2(0.,.11),.016)+st(cs+vec2(0.,.11),.018)+st(cs-vec2(.07,.02),.015)+st(cs+vec2(.075,-.025),.015)+st(cs+vec2(.02,-.0)-vec2(.05,-.04),.007);c+=cru*star*vec3(1.1,1.2,1.5);
      float cl=fbm(sp*vec2(2.2,9.)+vec2(uTime*.012,0.));c=mix(c,mix(hor,sunC,.35)*1.05,smoothstep(.5,.85,cl)*.5*smoothstep(0.,.08,y)*smoothstep(.6,.15,y));
      vec3 sd=normalize(sunD);float sa=max(dot(d,sd),0.);
      vec3 sd2=normalize(vec3(sd.x,.16,sd.z));float s2=max(dot(d,sd2),0.);
      if(moon<.5){c+=sunC*(pow(s2,24.)*.35+pow(s2,260.)*.7)+vec3(1.6,1.3,.8)*smoothstep(.9972,.9978,s2)*1.4;}
      else{vec3 mcol=mix(vec3(1.2,1.25,1.35),vec3(1.7,.35,.15),max(step(1.5,moon),red));float md=dot(d,normalize(vec3(sd.x,.3,sd.z)));float disc=smoothstep(.9968,.9974,md);float cr=fbm(sp*26.);c=mix(c,mcol*(.75+.35*cr),disc);c+=mcol*pow(max(md,0.),60.)*.22;}
      c=mix(c,c*.35+vec3(.04,.05,.07),storm*.7);c+=flash*vec3(.6,.7,.9)*smoothstep(-.1,.7,y+cl*.4);c=mix(c,c*vec3(1.4,.45,.4),red*.6);
      if(d.y<0.)c=mix(hor,hor*.5,smoothstep(0.,-.3,d.y));gl_FragColor=vec4(c,1.);}`});
    const s=new THREE.Mesh(new THREE.SphereGeometry(300,40,24),m);s.frustumCulled=false;s.renderOrder=-10;this.scene.add(s);}
  ground(){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95});const u=this.u;
    m.onBeforeCompile=s=>{Object.assign(s.uniforms,{gA:u.gA,gB:u.gB,gC:u.gC,uTime:U.uTime,flash:u.flash,uN:u.uN,uH:u.uH,uOut:u.uOut,uHex:u.uHex,uPa:u.uPa,uNP:u.uNP});s.vertexShader='varying vec3 vW;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader=`varying vec3 vW;uniform vec3 gA,gB,gC;uniform float uTime,flash,uN,uOut,uHex;uniform vec2 uH;uniform vec4 uPa[40];uniform int uNP;${NOISE}
       float Pk(float k,float e){return k>0.?k+e-.05:-1.;}
       vec2 vor(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 o=vec2(h21(i+g),h21(i+g+9.));float d=length(g+o-f);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return vec2(d1,d2);}\n`+s.fragmentShader
       .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 w=vW.xz;float r=length(w);float n=fbm(w*.12),n2=fbm(w*.6+4.),n3=ns(w*3.2);
        float dirt=smoothstep(.42,.62,n+.22*smoothstep(26.,6.,r)-.1+.25*(n2-.5));dirt=max(dirt,smoothstep(9.5,6.,r+n2*4.));
        float bk=pow(pow(abs(w.x)/uH.x,uN)+pow(abs(w.y)/uH.y,uN),1./uN);dirt=max(dirt,smoothstep(.075,.02,abs(bk-.94+n2*.03)));
        float K[8];for(int i=0;i<8;i++)K[i]=0.;for(int i=0;i<40;i++){if(i>=uNP)break;vec4 q=uPa[i];float f=1.-length(w-q.xy)/q.z;f=max(0.,f+.001);int kk=int(q.w+.5);if(kk==1)K[1]+=f*f+f*.35;else if(kk==2)K[2]+=f*f+f*.35;else if(kk==3)K[3]+=f*f+f*.35;else if(kk==4)K[4]+=f*f+f*.35;else if(kk==5)K[5]+=f*f+f*.35;else if(kk==6)K[6]+=f;else K[7]+=f;}
        float ed=(n2-.5)*.14+(n3-.5)*.05;dirt=max(dirt,smoothstep(.05,.3,Pk(K[6],ed)));
        vec3 g=mix(gA*(.72+.5*n2),gB*(.74+.46*n2),dirt);g*=.86+.26*n3;g=mix(g,g*.62,smoothstep(.62,.75,ns(w*1.3+20.))*.5*dirt);
        float peb=smoothstep(.78,.85,ns(w*5.+60.));g=mix(g,g*1.35,peb*dirt*.6);
        float seed=ns(w*8.);g+=step(.93,seed)*(1.-dirt)*gA*.8;
        vec2 vh=vor(w*.42);float hx=smoothstep(.08,.0,vh.y-vh.x);g=mix(g,g*.8,hx*uHex);g=mix(g,vec3(.82,.85,.92)*(.9+.14*n3),smoothstep(.1,.35,Pk(K[7],ed*2.)));
        diffuseColor.rgb=g;
        vec2 v=vor(w*.34+n*1.2);float crack=smoothstep(.06,.0,v.y-v.x)*smoothstep(.5,.78,n+n2*.3);
        vec3 lav=vec3(0.);float lk=step(.05,gC.r)*step(gC.g*1.5,gC.r);lav=lk*crack*gC*(.8+.4*sin(uTime*1.6+n*20.));
        vec3 wc=lk>.5||gC.b<.01?vec3(.06,.22,.3):gC;float wat=max(uOut*smoothstep(1.05,1.14,bk+n2*.07),smoothstep(.0,.06,Pk(K[1],ed)));float shore=smoothstep(.0,.035,Pk(K[1],ed))*(1.-smoothstep(.05,.16,Pk(K[1],ed)));
        float dp=smoothstep(.05,.55,K[1]);diffuseColor.rgb=mix(diffuseColor.rgb,wc*(.75-.35*dp+.5*ns(w*.8+uTime*.3)),wat*.92);float gl=smoothstep(.7,.86,ns(w*vec2(.55,1.7)+uTime*.55));lav+=wat*(wc*1.3+.04)*gl*1.1+shore*vec3(.35,.45,.5)*(.4+.6*ns(w*2.2+uTime*.8))*.6;
        float mud=smoothstep(.0,.08,Pk(K[2],ed));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.1,.055,.025)*(.7+.6*ns(w*1.6+uTime*.12)),mud*.9);lav+=mud*vec3(.22,.13,.05)*smoothstep(.72,.84,ns(w*1.3+uTime*.2));
        float lv=smoothstep(.0,.07,Pk(K[3],ed));float lf=fbm(w*.7+vec2(uTime*.12,uTime*.08));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.01,.005),lv);lav+=lv*mix(vec3(.9,.12,.01),vec3(1.9,.85,.18),smoothstep(.45,.75,lf))*(.75+.25*sin(uTime*1.3+lf*9.))*1.25+smoothstep(.0,.03,Pk(K[3],ed))*(1.-smoothstep(.03,.1,Pk(K[3],ed)))*vec3(1.5,.5,.08);
        float ic=smoothstep(.0,.06,Pk(K[4],ed));vec2 vi=vor(w*.3+3.);diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.42,.68,.84),vec3(.78,.9,.97),fbm(w*.35))*(.95+.1*n3),ic);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.97,1.),ic*smoothstep(.04,.0,vi.y-vi.x)*.7);lav+=ic*vec3(.02,.05,.07);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.91,.95)*(.92+.1*n3),smoothstep(.0,.08,Pk(K[5],ed)));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.02),lk*crack*.5);`)
       .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=lav+flash*vec3(.05,.06,.08);');};
    const g=new THREE.Mesh(new THREE.CircleGeometry(210,64),m);g.rotation.x=-Math.PI/2;g.receiveShadow=true;this.scene.add(g);}
  mountains(){for(let k=0;k<3;k++){const R=150+k*-18,n=240,H=[34,24,13][k];const p=[],ix=[];for(let i=0;i<=n;i++){const a=i/n*TAU,x=Math.sin(a)*R,z=Math.cos(a)*R;const f=t=>Math.abs(Math.sin(t*3.1+k*2)+.5*Math.sin(t*7.3+k)+.28*Math.sin(t*17.7+k*5)+.12*Math.sin(t*41));const h=H*(.25+.42*f(a));p.push(x,-2,z,x,h,z);if(i<n){const o=i*2;ix.push(o,o+2,o+1,o+1,o+2,o+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);
    const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,fog:false,uniforms:{...this.u,mc:this.u['m'+k],uK:{value:k}},vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
     fragmentShader:`varying vec3 vP;uniform vec3 mc,hor,fogC;uniform float band,uK,flash,storm;${NOISE}void main(){vec3 c=mc;float a=atan(vP.x,vP.z);float y=vP.y+6.*sin(a*9.+uK)+3.*sin(a*23.);float b=y*.34;vec3 cols=.5+.5*cos(6.28*(floor(b)/7.)+vec3(0.,1.9,3.9));cols=mix(vec3(dot(cols,vec3(.33))),cols,.6)*vec3(1.,.72,.7);float ed=smoothstep(0.,.15,fract(b));c=mix(c,cols*.75*(.8+.2*ed)+mc*.15,band*(.8-.15*uK));c*=.85+.3*ns(vec2(a*60.,vP.y*.6));c=mix(fogC,c,smoothstep(-4.,15.-4.*uK,vP.y)*.85+.05);c+=flash*.15;c*=1.-.5*storm;gl_FragColor=vec4(c,1.);}`});
    const me=new THREE.Mesh(g,m);me.renderOrder=-9+k;this.scene.add(me);}}
  grass(){const n=this.gn={alta:20000,media:11000,baja:3000}[this.q]||11000;const blade=new THREE.BufferGeometry();const bp=[];for(const a of[0,1.57]){const c=Math.cos(a)*.065,s=Math.sin(a)*.065;bp.push(-c,0,-s,c,0,s,c*.5,.5,s*.5,-c,0,-s,c*.5,.5,s*.5,-c*.5,.5,-s*.5,-c*.5,.5,-s*.5,c*.5,.5,s*.5,0,1,0);}blade.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));
    const g=this.gg=new THREE.InstancedBufferGeometry();g.setAttribute('position',blade.attributes.position);const o=new Float32Array(n*4),v=new Float32Array(n*2);
    g.setAttribute('iO',new THREE.InstancedBufferAttribute(o,4));g.setAttribute('iV',new THREE.InstancedBufferAttribute(v,2));g.instanceCount=0;
    const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{}]),vertexShader:`attribute vec4 iO;attribute vec2 iV;uniform float uTime,wind;uniform vec3 pp[4];varying float vH;varying float vR;varying float vL;
     #include <fog_pars_vertex>
     void main(){float h=position.y;vH=h;vR=iV.x;float c=cos(iO.w),s=sin(iO.w);vec3 p=vec3(position.x*c-position.z*s,h*iO.z,position.x*s+position.z*c);p.xz*=iV.y*(.8+iO.z*.6);vec3 w=vec3(iO.x,0.,iO.y)+p;float wv=sin(uTime*1.6*wind+w.x*.35+w.z*.28)+.5*sin(uTime*3.1*wind+w.x*.9);w.xz+=h*h*iO.z*(vec2(.16,.1)*wind*wv+vec2(.14,.06)*(wind-1.));
      for(int i=0;i<4;i++){vec2 d=w.xz-pp[i].xz;float l=length(d);w.xz+=normalize(d+.001)*smoothstep(1.5,.2,l)*h*.8*step(-50.,pp[i].y);w.y-=smoothstep(1.4,.2,l)*h*.4*iO.z*step(-50.,pp[i].y);}
      vL=.7+.3*sin(iO.x*.4)*cos(iO.y*.4);vec4 mvPosition=viewMatrix*vec4(w,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
     }`,fragmentShader:`varying float vH,vR,vL;uniform vec3 gr,gr2,lite;
     #include <fog_pars_fragment>
     void main(){vec3 c=mix(gr*.35,mix(gr,gr2,vR*.6+vH*.4),vH);c*=lite*vL*1.45;gl_FragColor=vec4(c,1.);
      #include <fog_fragment>
     }`});Object.assign(m.uniforms,{uTime:U.uTime,wind:this.u.wind,pp:this.u.pp,gr:this.u.gr,gr2:this.u.gr2,lite:this.lite={value:C(0xffffff)}});
    const me=new THREE.Mesh(g,m);me.frustumCulled=false;this.scene.add(me);}
  // ---------- carga de un mapa ----------
  perim(sp){const M=this.map,pts=[];let px,pz;const N=900;const P=t=>{const c=Math.cos(t),s=Math.sin(t),e=2/M.n;return[Math.sign(s)*Math.abs(s)**e*M.hx,Math.sign(c)*Math.abs(c)**e*M.hz];};const raw=[];let L=0;for(let i=0;i<=N;i++){const p=P(i/N*TAU);if(i)L+=Math.hypot(p[0]-px,p[1]-pz);raw.push([p[0],p[1],L]);px=p[0];pz=p[1];}const k=Math.max(8,Math.round(L/sp));let j=0;for(let i=0;i<k;i++){const t=i/k*L;while(j<N&&raw[j+1][2]<t)j++;const a=raw[j],b=raw[j+1],f=(t-a[2])/Math.max(.0001,b[2]-a[2]);const dx=b[0]-a[0],dz=b[1]-a[1];pts.push([a[0]+dx*f,a[1]+dz*f,Math.atan2(-dz,dx)]);}return pts;}
  load(r,t){const key=r+t;if(this.key===key)return this.map;this.key=key;for(const b of this.bts){this.scene.remove(b.m);b.m.geometry.dispose();b.m.dispose();}this.bts=[];
    const R=RG[r],L=buildLayout(r,t),def=R.maps[Math.min(2,t)],pal=palette(r,t);this.rain0=def.rain?1:0;
    const M=this.map={r,t,R,def,hx:L.hx,hz:L.hz,n:L.n,pat:L.pat,obs:[],pal,name:def.n};
    const u=this.u;u.uN.value=L.n;u.uH.value.set(L.hx,L.hz);u.uOut.value=pal.out?1:0;u.uHex.value=pal.hex||0;u.uNP.value=L.pat.length;L.pat.forEach((p,i)=>u.uPa.value[i].set(p.x,p.z,p.r,p.kind));
    const inst={};const add=(t,x,z,ry,s,ob)=>{(inst[t]||(inst[t]=[])).push([x,z,ry,s,ob]);};
    for(const o of L.obs){const d=KIT[o.t];let ob=null;if(d.r){ob={t:o.t,x:o.x,z:o.z,r:o.r,len:o.len,cx:Math.cos(o.ry),cz:-Math.sin(o.ry),low:d.low,tall:d.tall,brk:d.brk||0,hp:d.brk||0,hurt:d.hurt||0,loot:d.loot||0};M.obs.push(ob);}add(o.t,o.x,o.z,o.ry,o.s,ob);}
    add('llama',0,0,0,1);
    for(const b of R.border){const pts=this.perim(b.sp);pts.forEach(([x,z,a],i)=>{let px=x,pz=z;if(b.half){const q=pts[(i+1)%pts.length];px=(x+q[0])/2;pz=(z+q[1])/2;a=Math.atan2(-(q[1]-z),q[0]-x);}if(b.off||b.jit){const l=Math.hypot(px,pz)||1,o=(b.off||0)+rnd(-(b.jit||0),b.jit||0);px+=px/l*o;pz+=pz/l*o;}const s=b.s?rnd(b.s[0],b.s[1]):1;add(b.t,px,pz,b.face||b.half?a:rnd(TAU),s);});}
    for(const[t,n,k0,k1]of R.far)for(let i=0;i<n;i++){const a=rnd(TAU),k=rnd(k0,k1),e=2/L.n,x=Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**e*L.hx*k,z=Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**e*L.hz*k;if(KIT[t].r>2.4&&z>0&&Math.abs(x)<30)continue;add(t,x,z,rnd(TAU),rnd(.85,1.25));}
    for(const t in inst){const l=inst[t],d=KIT[t];DET.v=d.det||.85;const b=new B();d.f(b);DET.v=1;const bt=new Batch(this.scene,b.build(),l.length,{mat:this.mat,shadow:!d.noSh});bt.begin();for(const[x,z,ry,s,ob]of l){if(ob){ob.bt=bt;ob.i=bt.n;}bt.push(x,0,z,ry,s,rnd(9));}bt.end();bt.m.matrixAutoUpdate=false;this.bts.push(bt);if(t==='llama')this.flame=bt;}
    // grilla de choques
    const cs=M.cs=4,W=M.gw=Math.ceil(L.hx*2/cs)+4,H=M.gh=Math.ceil(L.hz*2/cs)+4;M.cells=new Array(W*H);for(const o of M.obs){const R=o.r+o.len+3.2,a=Math.floor((o.x-R)/cs+W/2),c=Math.floor((o.x+R)/cs+W/2),e=Math.floor((o.z-R)/cs+H/2),f=Math.floor((o.z+R)/cs+H/2);for(let j=Math.max(0,e);j<=Math.min(H-1,f);j++)for(let i=Math.max(0,a);i<=Math.min(W-1,c);i++)(M.cells[j*W+i]||(M.cells[j*W+i]=[])).push(o);}
    this.growGrass(pal.grass??1);this.apply(pal,pal,1);return M;}
  cell(x,z){const M=this.map,i=Math.floor(x/M.cs+M.gw/2),j=Math.floor(z/M.cs+M.gh/2);return i<0||j<0||i>=M.gw||j>=M.gh?null:M.cells[j*M.gw+i];}
  patch(x,z){const M=this.map;let b=null,bf=.04;for(const p of M.pat){const dx=x-p.x,dz=z-p.z;if(dx>p.r||dx<-p.r||dz>p.r||dz<-p.r)continue;const f=1-Math.hypot(dx,dz)/p.r;if(f>bf){bf=f;b=p;}}return b;}
  hide(o){o.dead=true;const A=o.bt.m.instanceMatrix.array,k=o.i*16;for(const j of[0,1,2,4,5,6,8,9,10])A[k+j]=0;A[k+13]=-50;o.bt.m.instanceMatrix.needsUpdate=true;}
  restore(){if(!this.map)return;for(const o of this.map.obs)if(o.dead){this.key=null;break;}}
  growGrass(d){const M=this.map,g=this.gg,n=this.gn,o=g.attributes.iO.array,v=g.attributes.iV.array;let i=0,t=0;const lim=Math.round(n*Math.min(1,d)*Math.min(1,.55+M.hx*M.hz/5000));const noise=(x,z)=>Math.sin(x*.21+1)*Math.cos(z*.19+2)+.6*Math.sin(x*.47+z*.33)+.4*Math.cos(x*.9-z*.7);
    while(i<lim&&t++<n*14){const out=i%4===0;const k=out?1.02+Math.random()*.9:Math.sqrt(Math.random()),a=rnd(TAU),e=2/M.n;const x=Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**e*M.hx*k,z=Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**e*M.hz*k;if(x*x+z*z<64||(!out&&noise(x,z)<.35))continue;if(M.pat.length&&M.pat.some(p=>p.kind!==6&&(p.x-x)**2+(p.z-z)**2<p.r*p.r*.95))continue;const s=out?rnd(.6,1.6):rnd(.28,.62);o[i*4]=x;o[i*4+1]=z;o[i*4+2]=s;o[i*4+3]=rnd(TAU);v[i*2]=rnd();v[i*2+1]=rnd(.7,1.4);i++;}
    g.instanceCount=i;g.attributes.iO.needsUpdate=true;g.attributes.iV.needsUpdate=true;}
  ambient(){const n=420,g=new THREE.BufferGeometry(),p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=rnd(-40,40);p[i*3+1]=rnd(0,14);p[i*3+2]=rnd(-40,40);s[i]=rnd();}g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aS',new THREE.BufferAttribute(s,1));
    this.aU={uTime:U.uTime,col:{value:C(0xffffff)},vel:{value:new THREE.Vector3(1,.2,.3)},kind:{value:0},ctr:{value:new THREE.Vector3()},px:{value:700}};
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:this.aU,vertexShader:`attribute float aS;uniform float uTime,kind,px;uniform vec3 vel,ctr;varying float vA;void main(){vec3 p=position+vel*uTime*(.5+aS);p.x+=sin(uTime*(.5+aS)+aS*40.)*1.2;p.z+=cos(uTime*(.6+aS)+aS*30.)*1.2;p.x=mod(p.x-ctr.x+40.,80.)-40.+ctr.x;p.z=mod(p.z-ctr.z+40.,80.)-40.+ctr.z;p.y=mod(p.y,14.);vA=kind>.5&&kind<1.5?pow(max(0.,sin(uTime*(1.+aS*2.)+aS*60.)),2.):.7;vA*=smoothstep(0.,1.5,p.y)*smoothstep(14.,10.,p.y);vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(22.,(kind>1.5&&kind<2.5?.16:.13)*(.5+aS)*px/-mv.z);}`,fragmentShader:`varying float vA;uniform vec3 col;void main(){float r=length(gl_PointCoord*2.-1.);gl_FragColor=vec4(col*pow(max(0.,1.-r),1.5)*1.6*vA,1.);}`});
    const pt=new THREE.Points(g,m);pt.frustumCulled=false;pt.renderOrder=3;this.scene.add(pt);}
  rain(){const n=900,p=new Float32Array(n*6),e=new Float32Array(n*2);for(let i=0;i<n;i++){const x=rnd(-35,35),y=rnd(0,26),z=rnd(-35,35);p.set([x,y,z,x,y,z],i*6);e[i*2+1]=1;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('e',new THREE.BufferAttribute(e,1));this.rU={uTime:U.uTime,a:{value:0},ctr:this.aU.ctr};const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:this.rU,vertexShader:`attribute float e;uniform float uTime;uniform vec3 ctr;void main(){vec3 p=position;p.y=mod(p.y-uTime*30.,26.)+e*1.1;p.x+=ctr.x+e*.16+p.y*.12;p.z+=ctr.z;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float a;void main(){gl_FragColor=vec4(.7,.8,1.,a*.35);}`});this.rainM=new THREE.LineSegments(g,m);this.rainM.frustumCulled=false;this.rainM.visible=false;this.scene.add(this.rainM);}
  apply(a,b,k){const u=this.u,m=(n,x,y)=>u[n].value.copy(C(x)).lerp(C(y),k);m('top',a.top,b.top);m('mid',a.mid,b.mid);m('hor',a.hor,b.hor);m('sunC',a.sun,b.sun);m('gA',a.gA,b.gA);m('gB',a.gB,b.gB);m('gC',a.gC,b.gC);m('gr',a.gr,b.gr);m('gr2',a.gr2,b.gr2);m('fogC',a.fog,b.fog);for(let i=0;i<3;i++)m('m'+i,a.m[i],b.m[i]);
    u.star.value=lerp(a.star,b.star,k);u.moon.value=k>.5?b.moon:a.moon;u.band.value=lerp(a.band,b.band,k);const sd=new THREE.Vector3(...a.sd).lerp(new THREE.Vector3(...b.sd),k).normalize();u.sunD.value.copy(sd);this.sd=sd.clone();
    this.sun.color.copy(u.sunC.value);this.sunI=lerp(a.sunI,b.sunI,k);this.hemi.color.copy(C(a.hs)).lerp(C(b.hs),k);this.hemi.groundColor.copy(C(a.hg)).lerp(C(b.hg),k);this.hi=lerp(a.hi,b.hi,k);
    this.scene.fog.color.copy(u.fogC.value);this.scene.fog.near=lerp(a.fn,b.fn,k);this.scene.fog.far=lerp(a.ff,b.ff,k);U.uRim.value.copy(C(a.rim)).lerp(C(b.rim),k);U.uRimK.value=lerp(a.rk,b.rk,k);
    const p=k>.5?b:a;this.aU.col.value.setRGB(p.part[0],p.part[1],p.part[2]);this.aU.kind.value=p.part[3];this.aU.vel.value.set(...p.pv);this.tint=C(a.tint).lerp(C(b.tint),k);}
  update(dt,t,ctr,ev={}){const pl=this.map.pal;this.apply(pl,pl,1);
    const u=this.u,ap=(o,k,v,s)=>o[k]+=(v-o[k])*Math.min(1,dt*s);
    ap(u.storm,'value',(ev.rain||this.rain0)?1:0,1.2);ap(u.red,'value',ev.red?1:0,1.2);ap(u.wind,'value',ev.wind?3.2:(ev.rain||this.rain0)?2:1,1);ap(this.rU.a,'value',(ev.rain||this.rain0)?1:0,1.5);this.rainM.visible=this.rU.a.value>.02;u.flash.value=Math.max(0,u.flash.value-dt*2.6);
    this.sun.intensity=this.sunI*(1-.55*u.storm.value)+u.flash.value*3;this.fill.intensity=ev.menu?1.9:.85;this.hemi.intensity=this.hi*(1-.25*u.storm.value)+u.flash.value*1.2;if(u.red.value>.01){this.sun.color.lerp(C(0xff3a2a),u.red.value*.6);this.scene.fog.color.lerp(C(0x5a1018),u.red.value*.5);}
    const sx=Math.round(ctr.x/2)*2,sz=Math.round(ctr.z/2)*2;this.sun.target.position.set(sx,0,sz);this.sun.position.copy(this.sd).multiplyScalar(80);this.sun.position.x+=sx;this.sun.position.z+=sz;
    this.fire.intensity=46+Math.sin(t*11)*7+Math.sin(t*17.3)*6;this.fire.position.set(Math.sin(t*9)*.1,1.8+Math.sin(t*13)*.1,Math.cos(t*8)*.1);this.fxL.intensity*=Math.max(0,1-dt*5);
    this.aU.ctr.value.set(ctr.x,0,ctr.z);this.lite.value.copy(this.sun.color).multiplyScalar(this.sun.intensity*.2).add(C(0xffffff).lerp(this.hemi.color,.6).multiplyScalar(this.hemi.intensity*.42));}
  lightAt(x,z,col,i){this.fxL.position.set(x,3.5,z);this.fxL.color.setRGB(col[0],col[1],col[2]);this.fxL.intensity=Math.max(this.fxL.intensity,i);}
}
