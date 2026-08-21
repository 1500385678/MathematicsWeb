# MathematicsWeb · 启动脚本 (Windows PowerShell)
# v0.1.0: 起本地 http server(原生 ES Modules 必须,不能 file://)
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "🚀 MathematicsWeb v0.1.0 启动中..." -ForegroundColor Cyan
Write-Host "📂 工作目录: $ScriptDir" -ForegroundColor Gray

# 优先 Python 3(Python 内置 http.server,零依赖)
$python = $null
try { $python = (Get-Command python -ErrorAction Stop).Source } catch {}
if (-not $python) {
    try { $python = (Get-Command py -ErrorAction Stop).Source } catch {}
}
if ($python) {
    Write-Host "✅ 使用 Python: $python" -ForegroundColor Green
    Write-Host "🌐 浏览器打开: http://localhost:8765" -ForegroundColor Green
    Write-Host "🛑 Ctrl+C 停止" -ForegroundColor Yellow
    & $python -m http.server 8765
} else {
    # fallback: Node.js
    try {
        $node = (Get-Command node -ErrorAction Stop).Source
        Write-Host "⚠️  Python 没装,改用 Node.js: $node" -ForegroundColor Yellow
        Write-Host "🌐 浏览器打开: http://localhost:8765" -ForegroundColor Green
        Write-Host "🛑 Ctrl+C 停止" -ForegroundColor Yellow
        & npx --yes http-server -p 8765 -c-1
    } catch {
        Write-Host "❌ Python / Node.js 都没装。请先装一个再启动。" -ForegroundColor Red
        exit 1
    }
}
