@echo off
rem Double-click to open the game in its own window (see play.mjs). Installs packages the first time.
cd /d "%~dp0..\.."
where node >nul 2>nul || (echo Node.js is not installed: get it from nodejs.org, then run this again. & pause & exit /b 1)
if not exist node_modules\vite call npm install
echo Starting the game window (output also in tools\desktop\play.log)...
node tools\desktop\play.mjs > tools\desktop\play.log 2>&1
type tools\desktop\play.log
pause
