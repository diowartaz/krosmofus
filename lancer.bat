@echo off
rem Lance la version locale de Krosmofus et ouvre la page dans le navigateur.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js n'est pas installe. Installe la version LTS depuis https://nodejs.org puis relance ce fichier.
    pause
    exit /b 1
)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080/"
node --use-system-ca dev\serveur-local.js
pause
