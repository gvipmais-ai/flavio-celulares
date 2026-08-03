@echo off
echo ==========================================
echo Instalando Sistema Flavio Celulares (Offline)
echo ==========================================
echo.
echo 1. Criando configuracao do banco de dados...
echo DATABASE_URL="file:./dev.db" > .env
echo.
echo 2. Instalando dependencias (isso pode demorar alguns minutos)...
call npm install
echo.
echo 3. Construindo o sistema e preparando o Banco de Dados...
call npm run build
echo.
echo ==========================================
echo Instalacao Concluida com Sucesso!
echo Agora voce pode dar um duplo clique no arquivo "iniciar.bat"
echo ==========================================
pause
