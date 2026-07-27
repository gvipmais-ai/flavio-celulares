@echo off
title Flavio Celulares - PDV
echo =========================================
echo    INICIANDO SISTEMA FLAVIO CELULARES
echo =========================================
echo.
echo Iniciando o servidor local em modo desenvolvedor...
start cmd /k "npm run dev"

echo.
echo Aguardando o servidor ligar (5 segundos)...
timeout /t 5 /nobreak >nul

echo.
echo Abrindo o navegador...
start http://localhost:3000

exit
