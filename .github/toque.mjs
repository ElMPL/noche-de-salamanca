// Prueba del control táctil dentro de la app, en el emulador.
// Lee el estado del juego por DevTools (la versión de prueba es "debuggable") y toca la pantalla de verdad con adb,
// así el toque pasa por Android y el WebView igual que con un dedo.
// Uso: node .github/toque.mjs <paquete>
import {execSync, spawn} from 'child_process';

const PKG = process.argv[2];
const sh = c => execSync(c, {encoding: 'utf8'}).trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = n => { try { execSync(`adb exec-out screencap -p > shots/${n}.png`); } catch (e) { } };
const fail = m => { console.log('FALLÓ: ' + m); process.exit(1); };

// Simula un celular que además dice tener un puntero fino (lo que reportan algunos Samsung y Xiaomi)
const FINO = `(()=>{const o=matchMedia.bind(window),f=(q,m)=>({matches:m,media:q,onchange:null,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
window.matchMedia=q=>{const s=q.split(' ').join('');if(s==='(any-pointer:fine)')return f(q,true);return o(q);};})();`;

// ---- conectar con el WebView ----
const pid = sh(`adb shell pidof ${PKG}`);
sh(`adb forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
let pages = [];
for (let i = 0; i < 30 && !pages.length; i++) {
  try { pages = (await (await fetch('http://127.0.0.1:9222/json')).json()).filter(p => p.type === 'page'); } catch (e) { }
  if (!pages.length) await sleep(1000);
}
if (!pages.length) fail('no se pudo conectar con el WebView');
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0; const wait = {};
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
const cdp = (method, params = {}) => new Promise(r => { const id = ++n; wait[id] = r; ws.send(JSON.stringify({id, method, params})); });
const ev = async expr => {
  const r = await cdp('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true});
  if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
  return r.result && r.result.result && r.result.result.value;
};
const until = async (expr, s) => { for (let i = 0; i < s; i++) { if (await ev(expr).catch(() => false)) return true; await sleep(1000); } return false; };

// ---- abrir el juego como en un celular "con puntero fino" ----
await cdp('Page.enable');
await cdp('Page.addScriptToEvaluateOnNewDocument', {source: FINO});
await cdp('Page.reload', {});
if (!await until(`typeof __S!=='undefined'&&!!document.querySelector('#title')`, 90)) fail('el juego no llegó a la pantalla de inicio');
console.log('Pantalla:', JSON.stringify(await ev(`({url:location.href,v:(document.querySelector('script[src*="game.js"]')||{}).src,ua:navigator.userAgent.slice(0,70),toques:navigator.maxTouchPoints,
  grueso:matchMedia('(pointer: coarse)').matches,fino:matchMedia('(any-pointer: fine)').matches,tactil:__S.ui.isTouch,ancho:innerWidth,alto:innerHeight,dpr:devicePixelRatio})`)));

// ---- ir a una partida (los menús se tocan desde DevTools; el movimiento se prueba con el dedo) ----
const click = txt => ev(`(()=>{const b=[...document.querySelectorAll('#ui button')].find(b=>b.textContent.includes(${JSON.stringify(txt)}));if(b)b.click();return !!b;})()`);
if (!await click('Jugar')) fail('no encontré "Jugar"');
await sleep(1500);
if (!await click('Elegir jugadores')) fail('no encontré "Elegir jugadores"');
await sleep(1500);
console.log('Sala:', await ev(`[...document.querySelectorAll('.slot .dev span')].map(e=>e.textContent).join(' | ')`));
await ev(`document.querySelector('#go').click()`);
if (!await until(`__S.game.state==='play'&&document.querySelector('#load').hidden`, 90)) fail('la partida no empezó');
await sleep(2500);

const estado = () => ev(`(()=>{const g=__S.game,p=g.players[0];return{estado:g.state,control:p.dev,x:+p.x.toFixed(2),z:+p.z.toFixed(2),
  joystickOculto:document.querySelector('#touch').hidden,stick:getComputedStyle(document.querySelector('#stick')).display}})()`);
console.log('Partida:', JSON.stringify(await estado()));
shot('2-partida');

// ---- arrastrar el dedo de verdad ----
const [W, H] = sh('adb shell wm size').match(/(\d+)x(\d+)/).slice(1).map(Number);
const swipe = async (x1, y1, x2, y2, nombre) => {
  sh('adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS');
  // si subió de nivel, elige la primera carta para volver a jugar
  for (let i = 0; i < 8 && await ev(`__S.game.state==='levelup'`); i++) {
    await ev(`(()=>{const c=document.querySelector('#lu .cards > *');if(c)c.click();})()`).catch(() => { });
    await sleep(1200);
  }
  const a = await estado();
  const p = spawn('adb', ['shell', 'input', 'swipe', x1, y1, x2, y2, '3500'].map(String));
  await sleep(1800);
  const medio = await estado();
  shot(nombre);
  await new Promise(r => p.on('exit', r));
  await sleep(300);
  const b = await estado();
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  console.log(`${nombre}: antes ${JSON.stringify(a)}\n  durante ${JSON.stringify(medio)}\n  después ${JSON.stringify(b)}\n  se movió ${d.toFixed(2)} (x ${(b.x - a.x).toFixed(2)}, z ${(b.z - a.z).toFixed(2)})`);
  return {a, medio, b, d, dx: b.x - a.x, dz: b.z - a.z};
};
const cx = Math.round(W * .35), cy = Math.round(H * .62);
const der = await swipe(cx, cy, cx + Math.round(W * .2), cy, '3-dedo-derecha');
const arr = await swipe(cx, cy, cx, cy - Math.round(H * .1), '4-dedo-arriba');

let ok = true;
const check = (c, m) => { console.log((c ? 'OK   ' : 'MAL  ') + m); if (!c) ok = false; };
check(der.medio.control === 'touch', 'el jugador usa el control táctil');
check(!der.medio.joystickOculto && der.medio.stick === 'block', 'se ven el joystick y los botones mientras se arrastra');
check(der.d > 2 && der.dx > Math.abs(der.dz), 'arrastrar a la derecha mueve al personaje a la derecha');
check(arr.d > 2 && -arr.dz > Math.abs(arr.dx), 'arrastrar hacia arriba lo mueve hacia arriba');
ws.close();
process.exit(ok ? 0 : 1);
