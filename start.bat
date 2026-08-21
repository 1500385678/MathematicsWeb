@echo off
REM MathematicsWeb · 启动脚本 (Windows CMD)
chcp 65001 >nul
cd /d "%~dp0"
echo 🚀 MathematicsWeb v0.1.0 启动中...
echo 📂 工作目录: %cd%

where python >nul 2>nul
if %errorlevel% == 0 (
    echo ✅ 使用 Python
    echo 🌐 浏览器打开: http://localhost:8765
    echo 🛑 Ctrl+C 停止
    python -m http.server 8765
) else (
    where node >nul 2>nul
    if %errorlevel% == 0 (
        echo ⚠️  Python 没装,改用 Node.js
        echo 🌐 浏览器打开: http://localhost:8765
        npx --yes http-server -p 8765 -c-1
    ) else (
        echo ❌ Python / Node.js 都没装
        pause
    )
}
