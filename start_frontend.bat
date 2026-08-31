@echo off
echo ==============================================
echo   Starting INFRAWATCH React Frontend Server
echo ==============================================
cd /d "%~dp0frontend"
npm run dev -- --host 0.0.0.0 --port 5173
pause
