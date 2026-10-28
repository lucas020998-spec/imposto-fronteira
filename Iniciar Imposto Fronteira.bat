@echo off
rem Liga o Imposto Fronteira PB e abre o navegador. Feche esta janela para desligar.
cd /d "%~dp0"
title Imposto Fronteira PB

where pnpm >/dev/null 2>/dev/null || (echo pnpm nao encontrado. Instale o Node.js e rode: npm install -g pnpm & pause & exit /b 1)
if not exist ".env.local" (echo Falta o arquivo .env.local com APP_PASSWORD. Veja o README. & pause & exit /b 1)

rem Primeira vez, ou depois de baixar uma versao nova: instala e prepara o app.
if not exist "node_modules" (call pnpm install || goto erro)
if not exist ".next\BUILD_ID" (call pnpm build || goto erro)

rem Abre o navegador alguns segundos depois, quando o app ja estiver no ar.
start "" cmd /c "timeout /t 4 /nobreak >/dev/null & start http://localhost:3000"
echo.
echo Imposto Fronteira PB ligado em http://localhost:3000
echo Para desligar, feche esta janela.
echo.
call pnpm start
goto :eof

:erro
echo.
echo Algo deu errado. Copie as mensagens acima e envie para quem cuida do app.
pause
