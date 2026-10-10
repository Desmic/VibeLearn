@echo off
rem The idle-flicker test (11 Oct): a PC-sized window, the page's diagnostics on, and a burst of
rem 30 frames every 45 s into tools\desktop\shots. Leave it on screen untouched; close the window to stop.
cd /d "%~dp0..\.."
where node >nul 2>nul || (echo Node.js is not installed: get it from nodejs.org, then run this again. & pause & exit /b 1)
if not exist node_modules\vite call npm install
echo Starting the flicker test (output in tools\desktop\flick.log)...
node tools\desktop\play.mjs --size 1280x720 --shots 45 --extra "&flicklog=1" > tools\desktop\flick.log 2>&1
