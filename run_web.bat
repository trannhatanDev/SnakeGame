@echo off
title Snake Cyber Game - HTML5 Server
cd /d "%~dp0"
echo =======================================================
echo   DANG KHOI CHAY LOCAL SERVER CHO SNAKE CYBER GAME...
echo =======================================================
echo.
echo Mo trinh duyet tai: http://localhost:8080
echo Nhan Ctrl + C de dung server.
echo.

:: Thu dung Node.js npx serve neu co
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start http://localhost:8080
    npx -y serve -p 8080 .
    exit /b
)

:: Thu dung Python neu co
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start http://localhost:8080
    python -m http.server 8080
    exit /b
)

:: Neu khong co thi mo truc tiep index.html
start index.html
