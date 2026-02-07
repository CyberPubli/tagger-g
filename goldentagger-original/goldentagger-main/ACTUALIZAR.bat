@echo off
chcp 65001 >nul
color 0A
title Actualizador - Tageador Clientify

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        🔄 ACTUALIZADOR AUTOMÁTICO - TAGEADOR CLIENTIFY    ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.

REM Verificar si Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ ERROR: Git no está instalado en este equipo
    echo.
    echo 📥 Por favor, descarga e instala Git desde:
    echo    https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✓ Git encontrado
echo.
echo 📡 Conectando con el servidor de GitHub...
echo.

REM Guardar cambios locales si existen
git stash >nul 2>&1

REM Descargar últimos cambios
git pull origin main

if errorlevel 1 (
    color 0C
    echo.
    echo ❌ ERROR: No se pudo descargar la actualización
    echo.
    echo Posibles causas:
    echo   - No hay conexión a internet
    echo   - El repositorio no está accesible
    echo.
    pause
    exit /b 1
)

color 0A
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ ¡ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!
echo.
echo 📋 Próximos pasos:
echo    1. Abre Chrome
echo    2. Ve a chrome://extensions/
echo    3. Click en el ícono de recarga (🔄) de la extensión
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
