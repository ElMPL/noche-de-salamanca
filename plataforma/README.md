# Noche de Salamanca

Supervivencia 3D de folklore argentino. De 1 a 4 jugadores online (los lugares libres se pueden llenar con bots).
Abierto sin sala funciona como juego suelto, con cooperativo en la misma computadora.

## Cómo se juega
WASD o flechas para moverse, Espacio esquivar, Q destreza, E sapucay, Esc menú. También joystick y táctil. Las armas atacan solas.

## Cómo sincroniza
- Todas las pantallas corren **la misma simulación**: misma semilla, pasos fijos de 1/60 s y matemática propia (`det.js`), para que dé igual en cualquier navegador.
- Los jugadores mandan sus controles al host (`i`, volatile, 30 por segundo). El host los ordena y manda un paquete cada 2 pasos (`b`, sin volatile): por la red no viajan enemigos ni balas.
- El movimiento propio se predice al instante y los golpes se evalúan donde cada uno estaba en su pantalla.
- Si el host se va, sigue otro con el mismo registro. Si alguien recarga, vuelve a simular el registro y se pone al día. Si alguien se va, su personaje pasa a bot.
- Al terminar, el host muestra una cuenta regresiva y llama `Arcade.end`: al ganar, corona para todas las personas que estén en la sala.

## Archivos
- `index.html`, `det.js`, `game.js`: el juego compilado (three.js 0.160 incluido).
- `src/`: código fuente. Se compila con esbuild: `src/main.js` como entrada, formato iife y `--supported:exponent-operator=false`.
