// Compila el juego en dos versiones a partir de src/:
//  - docs/   : la versión web que publica GitHub Pages y que abre la app de Android.
//  - arcade/ : la carpeta lista para copiar en games/noche-de-salamanca de ClaudeArcade.
import {buildSync} from 'esbuild';
import fs from 'fs';
import crypto from 'crypto';

const bundle = o => buildSync({entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none', ...o})
  .outputFiles[0].text.split('</scr' + 'ipt').join('<\\/scr' + 'ipt');
const body = fs.readFileSync('src/body.html', 'utf8');
const head = '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
const base = '<style>[hidden]{display:none!important}html,body{margin:0;width:100%;height:100%;overflow:hidden}</style>';

// 1) Versión web / app
const js = bundle({});
const app = fs.readFileSync('web/app.js', 'utf8');
const v = crypto.createHash('sha1').update(body + js + app + fs.readFileSync('web/sw.js', 'utf8')).digest('hex').slice(0, 10);
fs.rmSync('docs', {recursive: true, force: true});
fs.mkdirSync('docs');
fs.writeFileSync('docs/game.js', js);
fs.writeFileSync('docs/app.js', app);
fs.writeFileSync('docs/sw.js', fs.readFileSync('web/sw.js', 'utf8').split('__V__').join(v));
fs.writeFileSync('docs/index.html', head + '<title>Noche de Salamanca</title><meta name="theme-color" content="#1a0f24">' + base
  + '<style>html,body{background:#1a0f24}</style></head><body>\n' + body
  + '\n<script src="game.js?v=' + v + '"></script>\n<script src="app.js?v=' + v + '"></script>\n</body></html>\n');
fs.writeFileSync('docs/version.json', JSON.stringify({v, fecha: new Date().toISOString()}) + '\n');
fs.writeFileSync('docs/.nojekyll', '');

// 2) Carpeta para ClaudeArcade (misma matemática en todos los navegadores y sin el operador de potencia)
const out = 'arcade/noche-de-salamanca';
fs.rmSync('arcade', {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(out + '/game.js', bundle({supported: {'exponent-operator': false}}));
fs.copyFileSync('src/det.js', out + '/det.js');
fs.writeFileSync(out + '/index.html', head + '<title>Noche de Salamanca</title>' + base
  + '\n<script src="/sdk/arcade-sdk.js"></script></head><body>\n' + body
  + '\n<script src="./det.js"></script>\n<script src="./game.js"></script>\n</body></html>\n');
fs.cpSync('src', out + '/src', {recursive: true});
for (const f of ['README.md', 'game.json', 'thumb.jpg']) fs.copyFileSync('plataforma/' + f, out + '/' + f);

console.log('docs/ versión ' + v + ' · ' + (js.length / 1024 | 0) + ' KB · arcade/ listo');
