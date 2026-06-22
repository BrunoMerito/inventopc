@echo off
title System Merito - Gerando .exe

echo.
echo  ============================================
echo    System Merito - Compilador do Agente
echo  ============================================
echo.

:: Instalar dependencias
echo  Instalando dependencias...
pip install pyinstaller pillow pystray websockets --quiet

echo.
echo  Compilando agente.exe...
pyinstaller ^
  --onefile ^
  --noconsole ^
  --name "SistemaMerito-Agente" ^
  --hidden-import pystray ^
  --hidden-import PIL ^
  --hidden-import PIL.ImageGrab ^
  --hidden-import websockets ^
  --hidden-import asyncio ^
  --hidden-import winreg ^
  agent.py

echo.
if exist "dist\SistemaMerito-Agente.exe" (
    echo  .exe gerado com sucesso!
    echo  Arquivo: dist\SistemaMerito-Agente.exe
    echo.
    echo  Copie o .exe para cada PC e execute como Administrador.
    explorer dist
) else (
    echo  ERRO ao gerar .exe. Verifique os logs acima.
)

pause
