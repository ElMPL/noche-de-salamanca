#!/usr/bin/env bash
# Prueba en un emulador: instala una versión vieja (1), abre la app, revisa que cargue,
# acepta la actualización que ofrece y confirma que quedó instalada la última versión publicada.
set -u
PKG="$1"; OLD="$2"; WAIT="${3:-25}"
mkdir -p shots
shot() { adb exec-out screencap -p > "shots/$1.png"; adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml "shots/$1.xml" >/dev/null 2>&1; }
# toca el botón cuyo texto coincide (sin importar mayúsculas)
tap() {
  local b
  b=$(tr '>' '\n' < "shots/$2.xml" | grep -i -E "text=\"($1)\"" | grep -o 'bounds="[^"]*"' | head -1 | grep -o '[0-9]\+' | tr '\n' ' ')
  [ -z "$b" ] && { echo "No encontré el botón: $1"; return 1; }
  set -- $b; adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 )); echo "Toqué en $(( ($1 + $3) / 2 )),$(( ($2 + $4) / 2 ))"
}
ver() { adb shell dumpsys package "$PKG" | grep -m1 -o 'versionCode=[0-9]*'; }

adb logcat -c
adb install -r "$OLD" && echo "Instalada: $(ver)"
adb shell appops set "$PKG" REQUEST_INSTALL_PACKAGES allow
adb shell am start -W -n "$PKG/.MainActivity"
sleep "$WAIT"
shot 1-abierta
grep -o 'text="[^"]\+"' shots/1-abierta.xml | head -20

echo "--- Atrás en la pantalla de inicio"
adb shell input keyevent KEYCODE_BACK; sleep 1; shot 2-atras
adb shell pidof "$PKG" >/dev/null && echo "La app sigue abierta después de un toque de atrás"

echo "--- Actualización"
tap 'Actualizar' 1-abierta || true
sleep 15
shot 3-instalador
grep -o 'text="[^"]\+"' shots/3-instalador.xml | head -12
tap 'Update|Install|Actualizar|Instalar' 3-instalador || true
sleep 20
shot 4-final
echo "Versión final: $(ver)"
adb logcat -d > shots/logcat.txt
grep -E "FATAL|AndroidRuntime|$PKG" shots/logcat.txt | grep -v -i "chromium.*Uncaught\|cr_" | tail -40
