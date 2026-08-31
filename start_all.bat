@echo off
echo ==============================================
echo   Starting Full INFRAWATCH System
echo ==============================================
start "INFRAWATCH Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "INFRAWATCH Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0 --port 5173"
echo.
echo Both servers are starting!
echo - Backend:  http://localhost:8000/docs
echo - Frontend: http://localhost:5173
echo.
