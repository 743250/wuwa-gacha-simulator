@echo off
chcp 65001 >nul
title 鸣潮唤取模拟器
cd /d "%~dp0"

echo.
echo ====================================
echo    鸣 潮 · 唤 取 模 拟 器
echo ====================================
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules\vite" (
    echo [首次启动] 正在安装依赖，请稍候...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败，请检查网络或手动运行 npm install
        pause
        exit /b 1
    )
    echo.
)

echo 正在启动开发服务器...
echo 浏览器会自动打开 http://localhost:5173
echo.
echo 关闭此窗口即可停止游戏
echo ====================================
echo.

call npx vite --open
pause
