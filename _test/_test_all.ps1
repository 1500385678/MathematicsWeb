# _test_all.ps1 - 批量跑 20 场景 CDP 验证
$ErrorActionPreference = 'Stop'

$scenes = @(
  'catenary-arch',
  'planetary-orbits',
  'fourier-synth',
  'population-dynamics',
  'mandelbrot',
  'simple-harmonic',
  'golden-spiral',
  'monte-carlo',
  'double-pendulum',
  'gradient-descent',
  'lissajous',
  'clt',
  'riemann-sum',
  'bayesian',
  'lsystem',
  'wave-interference',
  'julia',
  'lagrange',
  'electric-field',
  'neural-net'
)

$pass = 0
$fail = 0
$failScenes = @()
$startTime = Get-Date

foreach ($s in $scenes) {
  Write-Host ''
  $r = node .\_cdp_test.js $s 2>&1
  $last = $r | Select-Object -Last 1
  $isPass = $last -match '\[OK\]'
  $isFail = $last -match '\[FAIL\]'
  if ($isPass) { $pass++ } else { $fail++; $failScenes += $s }
  # 输出摘要
  $r | Select-Object -Last 8 | ForEach-Object { Write-Host "  $_" }
}

$elapsed = (Get-Date) - $startTime
Write-Host ''
Write-Host '==============================================='
Write-Host "Total: $($scenes.Count)  Pass: $pass  Fail: $fail  Time: $($elapsed.TotalSeconds.ToString('F1'))s"
if ($fail -gt 0) {
  Write-Host 'Failed:'
  $failScenes | ForEach-Object { Write-Host "  $_" }
  exit 1
}
exit 0
