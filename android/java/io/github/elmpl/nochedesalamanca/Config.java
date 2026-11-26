package io.github.elmpl.nochedesalamanca;

/** Lo único que cambia entre la app del juego y la de ClaudeArcade. */
final class Config {
    /** Página que abre la app (la versión web del juego, publicada con GitHub Pages). */
    static final String START = "https://elmpl.github.io/noche-de-salamanca/";
    /** Enlaces de este sitio y carpeta se quedan en la app; el resto se abre en el navegador. */
    static final String HOST = "elmpl.github.io";
    static final String PATH = "/noche-de-salamanca";
    /** Repo donde se publican las versiones nuevas del APK. */
    static final String REPO = "ElMPL/noche-de-salamanca";
    /** Nombre del APK en cada versión publicada. */
    static final String APK = "noche-de-salamanca.apk";
    static final String UA = "NocheDeSalamancaApp";
    static final String NAME = "Noche de Salamanca";
    static final int BG = 0xFF1A0F24;
    static final int ACCENT = 0xFFF2B33D;
    /** Pantalla completa, sin barras del sistema. */
    static final boolean IMMERSIVE = true;
    /** "Atrás" lo maneja el juego (vuelve en menús, pausa en partida). */
    static final boolean GAME_BACK = true;
    /** Frenar el juego cuando la app queda en segundo plano. */
    static final boolean PAUSE_IN_BACKGROUND = true;
    /** Reintentar solo si el servidor tarda (no hace falta: GitHub Pages siempre está despierto). */
    static final boolean AUTO_RETRY = false;
    static final String SLOW = "Cargando el juego…";
    static final String OFFLINE = "No se pudo abrir el juego. La primera vez hace falta internet para bajarlo; después anda sin conexión.";

    private Config() { }
}
