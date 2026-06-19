@echo off
title InventoPC Server v8
echo.
echo  Instalando dependencias...
pip install flask flask-cors websockify supabase twilio python-dotenv -q
echo.
echo  Iniciando servidor...
echo  Acesse: http://localhost:5000
echo.
python server.py
pause
