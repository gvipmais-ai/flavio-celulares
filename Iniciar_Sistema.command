#!/bin/bash
cd "$(dirname "$0")"
echo "========================================="
echo "   INICIANDO SISTEMA FLAVIO CELULARES"
echo "========================================="
echo ""
echo "Ligando o servidor local (Isso pode levar alguns segundos)..."

# Start in background
npm run dev &

echo "Aguardando..."
sleep 5

echo "Abrindo navegador..."
open http://localhost:3000
