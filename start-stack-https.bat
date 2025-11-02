@echo off
setlocal

echo ========================================
echo InterShip Start with HTTPS
echo ========================================
echo.

rem Start the stack with HTTPS mode
call start-stack.bat https

endlocal
exit /b 0


