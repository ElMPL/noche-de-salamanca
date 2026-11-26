#!/usr/bin/env bash
# Prueba el control táctil dentro de la app en un emulador: instala la versión de prueba, abre una partida
# y arrastra el dedo de verdad (adb) para ver si el personaje se mueve. Los detalles están en toque.mjs.
set -u
PKG="$1"; APK="$2"
mkdir -p shots

echo "--- Esperando la red del emulador"
for i in $(seq 1 40); do adb shell dumpsys connectivity | grep -q 'VALIDATED' && { echo "Red lista"; break; }; sleep 3; done
sleep 20
adb shell settings put secure immersive_mode_confirmations confirmed
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1
adb shell input keyevent KEYCODE_HOME
sleep 3
adb logcat -c

echo "--- Instalar y abrir"
adb install -r "$APK" && adb shell dumpsys package "$PKG" | grep -m1 -o 'versionCode=[0-9]*'
adb shell am start -W -n "$PKG/.MainActivity" | grep -E 'Status|TotalTime'
sleep 30
adb exec-out screencap -p > shots/1-inicio.png
adb shell cat /proc/net/unix | grep -o 'webview_devtools_remote_[0-9]*' | sort -u

echo "--- Partida"
node .github/toque.mjs "$PKG"; R=$?

adb logcat -d > shots/logcat.txt
echo "--- Errores de la app"
grep -E "FATAL EXCEPTION|AndroidRuntime: " shots/logcat.txt | head -20
grep -E "chromium.*(Uncaught)" shots/logcat.txt | head -10
exit $R
