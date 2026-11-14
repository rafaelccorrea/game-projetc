@echo off
rem EONBOUND NO CELULAR COM RECARGA AO VIVO (um comando so).
rem 1) Ligue o celular no cabo USB, com a depuracao USB aceita.
rem 2) De dois cliques neste arquivo (ou rode tools\dev-celular.cmd).
rem 3) Abra o app "Eonbound DEV" no celular. Toda mudanca em js\, assets\ ou index.html recarrega a tela sozinha.
rem O app "Eonbound DEV" e outro app: nao mexe no jogo instalado nem no save dele.
setlocal
cd /d "%~dp0.."
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" set "ADB=adb"

echo.
echo [1/3] Ligando o celular ao PC pelo cabo (porta 8080)...
"%ADB%" reverse tcp:8080 tcp:8080 >nul 2>&1
if errorlevel 1 (
  echo       ATENCAO: nao achei o celular. Confira o cabo e aceite a depuracao USB na tela dele.
  echo       O servidor sobe do mesmo jeito; rode este arquivo de novo depois de ligar o cabo.
) else (
  echo       ok
)

echo [2/3] Conferindo o servidor do jogo...
set "PING="
for /f "delims=" %%a in ('curl -s -m 2 http://localhost:8080/__dev/ping 2^>nul') do set "PING=%%a"
if defined PING (
  echo       o servidor de desenvolvimento ja esta no ar.
  goto abrir
)
curl -s -m 2 -o nul http://localhost:8080/index.html
if not errorlevel 1 (
  echo       ATENCAO: outro programa ja usa a porta 8080 e nao e o servidor de desenvolvimento.
  echo       Feche esse programa e rode este arquivo de novo.
  goto fim
)
echo       subindo o servidor numa janela propria (deixe essa janela aberta; fechar a janela para o servidor).
start "Eonbound DEV - servidor (deixe aberto)" cmd /k node tools\dev-server.js . 8080
timeout /t 2 /nobreak >nul

:abrir
echo [3/3] Abrindo o Eonbound DEV no celular...
"%ADB%" shell am start -n br.com.intellisys.eonbound.dev/br.com.intellisys.eonbound.MainActivity >nul 2>&1
if errorlevel 1 echo       (abra o app "Eonbound DEV" pelo icone; se ele nao existe, falta instalar o APK dev)
echo.
echo PRONTO. Mexeu num arquivo do jogo, a tela do celular recarrega sozinha.

:fim
echo.
pause
endlocal
