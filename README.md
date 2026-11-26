# Noche de Salamanca

Arena cooperativa en 3D de folklore argentino: 9 regiones, 36 mapas, 12 jefes y 204 misiones. Se juega solo, con bots o, en [ClaudeArcade](https://claude-arcade.onrender.com), hasta 4 personas online.

- **Jugar en el navegador:** https://elmpl.github.io/noche-de-salamanca/
- **App de Android:** [bajar el APK](https://github.com/ElMPL/noche-de-salamanca/releases/latest/download/noche-de-salamanca.apk)

## Instalar en el celular
1. Abrí el enlace del APK desde el celular y bajalo.
2. Abrilo. Android pide permiso para instalar apps de esa fuente (el navegador o la app de archivos): aceptalo.
3. La primera vez hace falta internet para bajar el juego. Después anda sin conexión.

Se juega con el celular parado. Las partidas y el progreso quedan guardados en el teléfono.

## Actualizaciones
- **El juego:** lo que se publica en `docs/` lo sirve GitHub Pages. La app baja la versión nueva sola y la aplica cuando volvés a la pantalla de inicio, nunca en medio de una partida.
- **La app:** cada cambio en `android/` compila un APK nuevo (pestaña *Actions* → *APK*) y lo publica en *Releases*. La app lo detecta al abrirse y ofrece instalarlo sin perder nada.

## Cómo está armado
- `src/`: código del juego (three.js 0.160).
- `build.mjs`: `npm install` y después `npm run build`. Genera `docs/` (versión web y de la app) y `arcade/` (la carpeta lista para `games/noche-de-salamanca` de ClaudeArcade).
- `web/`: lo que la versión web agrega para la app: guardado sin conexión (`sw.js`) y el botón "atrás" (`app.js`).
- `plataforma/`: `game.json`, la foto y el README para ClaudeArcade.
- `android/`: la app. Se compila con `android/build.sh` en GitHub Actions y se firma con los secretos `KS_B64` y `KS_PASS`, que tienen que ser siempre los mismos para que las actualizaciones se instalen encima.
