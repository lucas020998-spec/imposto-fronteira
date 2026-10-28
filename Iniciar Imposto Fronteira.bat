@echo off
rem Liga o Imposto Fronteira PB e abre o navegador. Feche esta janela para desligar.
cd /d "%~dp0"
title Imposto Fronteira PB

if not exist "package.json" (
  echo Este arquivo precisa ficar dentro da pasta do projeto, ja descompactada.
  echo Pasta atual: %CD%
  echo Descompacte o ZIP com "Extrair tudo" e rode o arquivo de dentro da pasta extraida.
  pause & exit /b 1
)
where node >nul 2>nul || (
  echo O Node.js nao esta instalado neste computador.
  echo Vou abrir o site: baixe a versao LTS, instale com as opcoes padrao e rode este arquivo de novo.
  start "" https://nodejs.org
  pause & exit /b 1
)
if not exist ".env.local" (
  echo Falta o arquivo .env.local com a linha APP_PASSWORD. Veja o README.
  pause & exit /b 1
)

rem Usa o pnpm instalado; se nao houver, roda a versao do projeto pelo npx, sem instalar nada.
set "PNPM=pnpm"
where pnpm >nul 2>nul || set "PNPM=npx --yes pnpm@10.28.0"

rem Primeira vez, ou depois de baixar uma versao nova: instala e prepara o app.
if not exist "node_modules" (call %PNPM% install || goto erro)
if not exist ".next\BUILD_ID" (call %PNPM% build || goto erro)

rem Abre o navegador alguns segundos depois, quando o app ja estiver no ar.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"
echo.
echo Imposto Fronteira PB ligado em http://localhost:3000
echo Para desligar, feche esta janela.
echo.
call %PNPM% start
goto :eof

:erro
echo.
echo Algo deu errado. Copie as mensagens acima e envie para quem cuida do app.
pause
