// Matemática idéntica en todos los navegadores (solo operaciones IEEE básicas).
// El online simula lo mismo en cada pantalla: un seno distinto en el último decimal alcanza para separarlas.
(function(){
var M=Math,rd=M.round,sq=M.sqrt,ab=M.abs,fl=M.floor;
var IP=0.6366197723675814,A1=1.5707963267341256,A2=6.077100506506192e-11,PI=M.PI,H=PI/2;
function ks(x){var z=x*x;return x+x*z*(-1.66666666666666324348e-01+z*(8.33333333332248946124e-03+z*(-1.98412698298579493134e-04+z*(2.75573137070700676789e-06+z*(-2.50507602534068634195e-08+z*1.58969099521155010221e-10)))));}
function kc(x){var z=x*x;return 1-z*.5+z*z*(4.16666666666666019037e-02+z*(-1.38888888888741095749e-03+z*(2.48015872894767294178e-05+z*(-2.75573143513906633035e-07+z*(2.08757232129817482790e-09+z*-1.13596475577881948265e-11)))));}
function sin(x){if(x!==x||x-x!==0)return NaN;if(x<.785&&x>-.785)return ks(x);var n=rd(x*IP),r=x-n*A1-n*A2,q=n&3;if(n>2147483647||n<-2147483648)q=((n%4)+4)%4;return q===0?ks(r):q===1?kc(r):q===2?-ks(r):-kc(r);}
function cos(x){if(x!==x||x-x!==0)return NaN;if(x<.785&&x>-.785)return kc(x);var n=rd(x*IP),r=x-n*A1-n*A2,q=n&3;if(n>2147483647||n<-2147483648)q=((n%4)+4)%4;return q===0?kc(r):q===1?-ks(r):q===2?-kc(r):ks(r);}
var T=[3.33333333333329318027e-01,-1.99999999998764832476e-01,1.42857142725034663711e-01,-1.11111104054623557880e-01,9.09088713343650656196e-02,-7.69187620504482999495e-02,6.66107313738753120669e-02,-5.83357013379057348645e-02,4.97687799461593236017e-02,-3.65315727442169155270e-02,1.62858201153657823623e-02];
var HI=[4.63647609000806093515e-01,7.85398163397448278999e-01,9.82793723247329054082e-01,1.57079632679489655800e+00],LO=[2.26987774529616870924e-17,3.06161699786838301793e-17,1.39033110312309984516e-17,6.12323399573676603587e-17];
function atan(x){if(x!==x)return x;var s=x<0,a=s?-x:x,id=-1;if(a>1e17)return s?-H:H;
 if(a>=.4375){if(a<1.1875){if(a<.6875){id=0;a=(2*a-1)/(2+a);}else{id=1;a=(a-1)/(a+1);}}else if(a<2.4375){id=2;a=(a-1.5)/(1+1.5*a);}else{id=3;a=-1/a;}}
 var z=a*a,w=z*z,s1=z*(T[0]+w*(T[2]+w*(T[4]+w*(T[6]+w*(T[8]+w*T[10]))))),s2=w*(T[1]+w*(T[3]+w*(T[5]+w*(T[7]+w*T[9])))),r=id<0?a-a*(s1+s2):HI[id]-((a*(s1+s2)-LO[id])-a);return s?-r:r;}
function atan2(y,x){if(x!==x||y!==y)return NaN;if(x>0)return atan(y/x);if(x<0)return y>=0?(y===0&&1/y<0?-PI:atan(y/x)+PI):atan(y/x)-PI;if(y>0)return H;if(y<0)return -H;var nx=1/x<0,ny=1/y<0;return nx?(ny?-PI:PI):(ny?-0:0);}
var fb=new Float64Array(1),ub=new Uint32Array(fb.buffer);fb[0]=1;var hi=ub[1]?1:0;
function log(x){if(x!==x||x<0)return NaN;if(x===0)return -Infinity;if(x===Infinity)return x;var k=0;if(x<2.2250738585072014e-308){x*=18014398509481984;k=-54;}fb[0]=x;var h=ub[hi];k+=(h>>>20)-1023;h&=0xfffff;var i=(h+0x95f64)&0x100000;ub[hi]=h|(i^0x3ff00000);k+=i>>>20;var f=fb[0]-1,s=f/(2+f),z=s*s,w=z*z,R=w*(3.999999999940941908e-01+w*(2.222219843214978396e-01+w*1.531383769920937332e-01))+z*(6.666666666666735130e-01+w*(2.857142874366239149e-01+w*(1.818357216161805012e-01+w*1.479819860511658591e-01))),hf=.5*f*f;return k*6.93147180369123816490e-01-((hf-(s*(hf+R)+k*1.90821492927058770002e-10))-f);}
function exp(x){if(x!==x)return x;if(x>709.78)return Infinity;if(x<-745.2)return 0;var k=rd(x*1.44269504088896338700),h=x-k*6.93147180369123816490e-01,l=k*1.90821492927058770002e-10;x=h-l;var t=x*x,c=x-t*(1.66666666666666019037e-01+t*(-2.77777777770155933842e-03+t*(6.61375632143793436117e-05+t*(-1.65339022054652515390e-06+t*4.13813679705723846039e-08)))),y=1-((l-(x*c)/(2-c))-h);if(k<-1021){for(;k<-1021;k++)y*=.5;k=0;while(0);}
 if(k>1023){y*=2;k--;}fb[0]=1;ub[hi]=(k+1023)<<20;ub[1-hi]=0;return y*fb[0];}
function pow(x,y){if(y===2)return x*x;if(y===1)return x;if(y===0)return 1;if(y===.5)return sq(x);if(y===3)return x*x*x;if(y!==y||x!==x)return NaN;if(fl(y)===y&&y>-64&&y<64){var n=ab(y),r=1,b=x;while(n){if(n&1)r*=b;b*=b;n>>=1;}return y<0?1/r:r;}if(x===0)return y>0?0:Infinity;if(x===1)return 1;if(x<0)return NaN;return exp(y*log(x));}
M.sin=sin;M.cos=cos;M.tan=function(x){return sin(x)/cos(x);};M.atan=atan;M.atan2=atan2;M.log=log;M.exp=exp;M.pow=pow;
M.hypot=function(a,b,c){if(c===undefined)return b===undefined?ab(a||0):sq(a*a+b*b);var s=0;for(var i=0;i<arguments.length;i++)s+=arguments[i]*arguments[i];return sq(s);};
})();
