# _test_one.ps1 - 单场景 Edge headless 验证
param(
  [string]$Scene = 'catenary-arch',
  [string]$Url = 'http://localhost:8765',
  [int]$WaitMs = 4000
)

$ErrorActionPreference = 'Stop'

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
if (-not (Test-Path $edge)) { Write-Error 'Edge not found'; exit 1 }

$tmpdir = Join-Path $env:TEMP ('edge_' + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $tmpdir -Force | Out-Null
$errLog = Join-Path $tmpdir 'err.log'

$targetUrl = "$Url/?scene=$Scene&v=0.6.3&noai=1"
Write-Host "[Test] $Scene"

# 拼接参数(单串,空格分隔)
$argStr = '--headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage ' +
          "--user-data-dir=""$tmpdir"" " +
          '--enable-logging=stderr --v=1 ' +
          '--virtual-time-budget=5000 ' +
          "--screenshot=""$tmpdir\shot.png"" " +
          '--window-size=1280,800 ' +
          $targetUrl

# 用 cmd 跑,避免 array quoting 麻烦
$proc = Start-Process -FilePath $edge -ArgumentList $argStr -PassThru -NoNewWindow -Wait -RedirectStandardError $errLog

# 读错误
$errs = @()
if (Test-Path $errLog) {
  $lines = Get-Content $errLog -ErrorAction SilentlyContinue
  foreach ($line in $lines) {
    if ($line -match 'CONSOLE.*error|Uncaught|TypeError|ReferenceError|SyntaxError') {
      $errs += $line.Substring(0, [Math]::Min(220, $line.Length))
    }
  }
}

$shot = Join-Path $tmpdir 'shot.png'
$shotOK = Test-Path $shot
$shotSize = if ($shotOK) { (Get-Item $shot).Length } else { 0 }

Remove-Item $tmpdir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "  shot: $shotOK ($shotSize bytes)"
Write-Host "  consoleErrors: $($errs.Count)"
foreach ($e in $errs | Select-Object -First 5) { Write-Host "    $e" }

if ($shotOK -and $shotSize -gt 1000 -and $errs.Count -eq 0) {
  Write-Host "  [OK] $Scene"
  exit 0
} else {
  Write-Host "  [FAIL] $Scene"
  exit 1
}
