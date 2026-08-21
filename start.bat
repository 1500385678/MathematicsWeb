@echo off
REM MathematicsWeb · 启动脚本 (Windows CMD)
REM v0.6.0: 用 server.py 启一体化服务器
chcp 65001 >nul
cd /d "%~dp0"
echo 🚀 MathematicsWeb v0.6.0 启动中...
echo 📂 工作目录: %cd%

where python >nul 2>nul
if %errorlevel% == 0 (
    echo ✅ 使用 Python
    echo 🌐 浏览器打开: http://localhost:8765
    echo 🛑 Ctrl+C 停止
    echo.
    echo 接入 M3: set M3_API_KEY=sk-cp-... 然后重跑这个脚本
    python server.py
) else (
    where node >nul 2>nul
    if %errorlevel% == 0 (
        echo ⚠️  Python 没装,改用 Node.js(无 M3 代理)
        echo 🌐 浏览器打开: http://localhost:8765
        npx --yes http-server -p 8765 -c-1
    ) else (
        echo ❌ Python / Node.js 都没装
        pause
    )
)
