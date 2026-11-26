#!/usr/bin/env bash
# Prueba en un emulador: instala una versión vieja (1), abre la app, acepta la actualización que ofrece,
# confirma que quedó la última versión publicada y vuelve a abrirla para ver que cargue y que "atrás" funcione.
set -u
PKG="$1"; OLD="$2"; WAIT="${3:-25}"
mkdir -p shots
shot() { adb exec-out screencap -p > "shots/$1.png"; adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml "shots/$1.xml" >/dev/null 2>&1; grep -o 'text="[^"]\+"' "shots/$1.xml" | head -12; }
# toca el botón cuyo texto coincide (sin importar mayúsculas)
tap() {
  local b
  b=$(tr '>' '\n' < "shots/$2.xml" | grep -i -E "text=\"($1)\"" | grep -o 'bounds="[^"]*"' | head -1 | grep -o '[0-9]\+' | tr '\n' ' ')
  [ -z "$b" ] && { echo "No encontré el botón: $1"; return 1; }
  set -- $b; adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 )); echo "Toqué «$1»"
}
ver() { adb shell dumpsys package "$PKG" | grep -m1 -o 'versionCode=[0-9]*'; }
gotit() { if grep -q 'text="Got it"' "shots/$1.xml"; then tap 'Got it' "$1"; sleep 2; shot "$1"; fi; }

echo "--- Esperando la red del emulador"
for i in $(seq 1 40); do adb shell dumpsys connectivity | grep -q 'VALIDATED' && { echo "Red lista"; break; }; sleep 3; done
sleep 5
adb logcat -c

echo "--- Versión vieja"
adb install -r "$OLD" && echo "Instalada: $(ver)"
adb shell appops set "$PKG" REQUEST_INSTALL_PACKAGES allow
adb shell am start -W -n "$PKG/.MainActivity" | grep -E 'Status|TotalTime'
sleep "$WAIT"
shot 1-abierta
gotit 1-abierta

echo "--- Actualización"
tap 'Actualizar' 1-abierta || true
sleep 15
shot 2-instalador
tap 'Update|Install|Actualizar|Instalar' 2-instalador || true
sleep 20
shot 3-instalada
echo "Versión después de actualizar: $(ver)"

echo "--- Abrir la versión nueva"
adb shell am force-stop "$PKG"
adb shell am start -W -n "$PKG/.MainActivity" | grep -E 'Status|TotalTime'
sleep "$WAIT"
shot 4-nueva
gotit 4-nueva
echo "--- Atrás"
adb shell input keyevent KEYCODE_BACK; sleep 1
shot 5-atras
adb shell pidof "$PKG" >/dev/null && echo "Sigue abierta después de un toque de atrás"
adb shell input keyevent KEYCODE_BACK; sleep 2
adb shell dumpsys activity activities | grep -q "topResumedActivity.*$PKG" && echo "Sigue al frente después de dos toques" || echo "Se cerró con dos toques de atrás"

adb logcat -d > shots/logcat.txt
echo "--- Errores de la app"
grep -E "FATAL EXCEPTION|AndroidRuntime: |Process: $PKG" shots/logcat.txt | head -20
grep -E "chromium.*(ERR_|Uncaught)" shots/logcat.txt | head -10
echo "fin"
