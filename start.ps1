# MathematicsWeb · 启动脚本 (Windows PowerShell)
# v0.6.0: 用 server.py 启一体化服务器(静态 + M3 代理)
# 用法:
#   $env:M3_API_KEY = "sk-cp-..."          # 配 M3 key(可选,没配走 mock)
#   .\start.ps1                            # 起 http://localhost:8765

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "🚀 MathematicsWeb v0.6.0 启动中..." -ForegroundColor Cyan
Write-Host "📂 工作目录: $ScriptDir" -ForegroundColor Gray

# 优先 Python
$python = $null
try { $python = (Get-Command python -ErrorAction Stop).Source } catch {}
if (-not $python) {
    try { $python = (Get-Command py -ErrorAction Stop).Source } catch {}
}
if ($python) {
    Write-Host "✅ 使用 Python: $python" -ForegroundColor Green

    # 探测 M3_API_KEY
    $m3Key = [Environment]::GetEnvironmentVariable('M3_API_KEY', 'User')
    if (-not $m3Key) {
        $m3Key = [Environment]::GetEnvironmentVariable('M3_API_KEY', 'Process')
    }
    if ($m3Key) {
        Write-Host "✅ M3_API_KEY 已配($($m3Key.Substring(0, [Math]::Min(8, $m3Key.Length)))...)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  M3_API_KEY 未配(AI 走 mock 模式)" -ForegroundColor Yellow
        Write-Host "   接入 M3: `$env:M3_API_KEY = 'sk-cp-...'  (PowerShell 当前会话)" -ForegroundColor Gray
        Write-Host "         [Environment]::SetEnvironmentVariable('M3_API_KEY', 'sk-cp-...', 'User')  (永久)" -ForegroundColor Gray
    }

    Write-Host "🌐 浏览器打开: http://localhost:8765" -ForegroundColor Green
    Write-Host "🛑 Ctrl+C 停止" -ForegroundColor Yellow
    & $python server.py
} else {
    # fallback: Node.js
    try {
        $node = (Get-Command node -ErrorAction Stop).Source
        Write-Host "⚠️  Python 没装,改用 Node.js" -ForegroundColor Yellow
        Write-Host "🌐 浏览器打开: http://localhost:8765" -ForegroundColor Green
        & npx --yes http-server -p 8765 -c-1
    } catch {
        Write-Host "❌ Python / Node.js 都没装" -ForegroundColor Red
        pause
    }
}
