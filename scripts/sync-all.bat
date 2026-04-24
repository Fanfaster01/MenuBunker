@echo off
REM ===============================================================
REM  Sync automatico Xetux + Victoriana -> Supabase
REM  Uso: ejecutar desde Windows Task Scheduler cada 10 min.
REM
REM  Requisitos:
REM    - Node.js instalado (C:\Program Files\nodejs\node.exe)
REM    - .env del proyecto con todas las credenciales (DB_*, VICTORIANA_DB_*,
REM      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
REM    - Esta maquina debe estar en la red local del restaurante
REM      (192.168.88.x) para poder alcanzar los SQL Server.
REM ===============================================================

SETLOCAL
SET PROJECT_DIR=%~dp0..
SET LOGS_DIR=%PROJECT_DIR%\logs
SET LOG_FILE=%LOGS_DIR%\sync-%DATE:/=-%.log

REM Crear carpeta de logs si no existe
IF NOT EXIST "%LOGS_DIR%" MKDIR "%LOGS_DIR%"

REM Cambiar al directorio del proyecto (asi los scripts resuelven paths correctamente)
CD /D "%PROJECT_DIR%"

echo. >> "%LOG_FILE%"
echo ================ %DATE% %TIME% ================ >> "%LOG_FILE%"

echo [%TIME%] Iniciando sync Xetux... >> "%LOG_FILE%"
node scripts\sync-xetux.js >> "%LOG_FILE%" 2>&1
echo [%TIME%] Sync Xetux finalizado con exit code %ERRORLEVEL% >> "%LOG_FILE%"

echo. >> "%LOG_FILE%"
echo [%TIME%] Iniciando sync Victoriana... >> "%LOG_FILE%"
node scripts\sync-victoriana.js >> "%LOG_FILE%" 2>&1
echo [%TIME%] Sync Victoriana finalizado con exit code %ERRORLEVEL% >> "%LOG_FILE%"

echo ================ FIN ================ >> "%LOG_FILE%"

ENDLOCAL
EXIT /B 0
