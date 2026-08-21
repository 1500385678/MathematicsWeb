# MathematicsWeb · 一步 commit + push + release 包装脚本
# 沿用 canvasweb 范式(去掉 gen-structure / gen-status 自动化,本项目纯前端无需)
# 用法:
#   .\_commit_push.ps1 -Message "fix: 修了 xxx"            # 默认 add -A
#   .\_commit_push.ps1 -Message "..." -DryRun              # 只 commit 不 push
#   .\_commit_push.ps1 -Message "..." -NoBump              # 跳过自动 bump
#   .\_commit_push.ps1 -Message "..." -BumpMajor / -BumpMinor
# 前置:
#   .git/config 里 remote.origin.url 已嵌 x-access-token(绕过未配的 gh CLI)
#   GH_TOKEN 在 User-scope env(从 [Environment]::GetEnvironmentVariable('GH_TOKEN','User') 读)
# 流程(5 步):
#   1) git fetch + pull --rebase --autostash
#   2) git add -A(.gitignore 挡 Output/ .db / 日志 / api_key)
#   3) git commit -F <tmp>
#   4) git push origin main
#   5) 自动 bump window.MATHW_V + index.html + 同步 main,打 tag
#   6) 自动发 GitHub Release(POST /releases)

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [switch]$DryRun,
    [switch]$NoPull,
    [switch]$NoBump,
    [switch]$BumpMajor,
    [switch]$BumpMinor,

    [string]$Remote = 'origin',
    [string]$Branch = 'main',

    # 仓库元数据(写死在本项目,推 GitHub + Gitee 镜像)
    [string]$GitHubUser = '1500385678',
    [string]$GitHubRepo = 'MathematicsWeb',
    [string]$GiteeUser  = 'architectzy'
)

$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

# 0) git 在不在
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ git 不在 PATH" -ForegroundColor Red; exit 1
}

# 通用 git 参数:HTTP/1.1 强约束(本机默认 HTTP/2 推 GitHub 不通)
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments)][string[]]$GitArgs)
    $cmdline = 'git -c http.version=HTTP/1.1 ' + ($GitArgs -join ' ')
    cmd /c $cmdline *> $null
    return $LASTEXITCODE
}

# 1) pull --rebase
if (-not $NoPull) {
    $hasRemote = git remote get-url $Remote 2>$null
    if ($hasRemote) {
        Write-Host "[1/5] git fetch $Remote" -ForegroundColor Cyan
        $rc = Invoke-Git fetch $Remote
        if ($rc -ne 0) { Write-Host "❌ fetch 失败" -ForegroundColor Red; exit $rc }

        $behind = git rev-list --count HEAD..$Remote/$Branch 2>$null
        if ($behind -gt 0) {
            Write-Host "[1/5] git pull --rebase --autostash(接 $behind 个远端新提交)" -ForegroundColor Cyan
            $rc = Invoke-Git pull --rebase --autostash $Remote $Branch
            if ($rc -ne 0) {
                Write-Host "`n❌ pull --rebase 失败 · 手动处理冲突后重跑" -ForegroundColor Red; exit $rc
            }
        } else {
            Write-Host "[1/5] 远端无新提交,跳过 rebase" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "[1/5] 还没配 $Remote remote,跳过(下次 commit 完手动 add remote)" -ForegroundColor DarkGray
    }
}

# 2) 改动检查
$status = git status --porcelain
if (-not $status) {
    Write-Host "`n⚠️  无本地改动" -ForegroundColor Yellow; exit 0
}
Write-Host "=== 改动文件 ===" -ForegroundColor Cyan
$status | ForEach-Object { Write-Host "  $_" }

# 3) git add -A
Write-Host "`n[2/5] git add -A" -ForegroundColor Cyan
git add -A | Out-Null

# 4) git commit
$msgFile = Join-Path $env:TEMP ("commit_msg_" + [System.Guid]::NewGuid().ToString("N") + ".txt")
[System.IO.File]::WriteAllText($msgFile, $Message, [System.Text.UTF8Encoding]::new($false))
Write-Host "[3/5] git commit -F <tmp>" -ForegroundColor Cyan
$rc = Invoke-Git -c user.name=MathematicsWeb -c user.email=mathw@local.dev commit -F $msgFile
mavis-trash $msgFile 2>$null
if ($rc -ne 0) { Write-Host "❌ commit 失败" -ForegroundColor Red; exit $rc }

# 5) git push
Write-Host "[4/5] git push $Remote $Branch" -ForegroundColor Cyan
if ($DryRun) { Write-Host "⚠️  DryRun 模式 · 跳过 push + bump + release" -ForegroundColor Yellow; exit 0 }

$rc = Invoke-Git push $Remote $Branch
if ($rc -ne 0) { Write-Host "❌ push 失败(没配 remote? 跑 git remote add origin <url>)" -ForegroundColor Red; exit $rc }

# 镜像推 gitee(如果有)
$hasGitee = git remote get-url gitee 2>$null
if ($hasGitee) {
    Write-Host "[4/5] 镜像推 gitee" -ForegroundColor Cyan
    $rc2 = Invoke-Git push gitee $Branch
    if ($rc2 -ne 0) {
        Write-Host "  ⚠️  gitee push 失败(非阻塞)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ gitee main 同步" -ForegroundColor Green
    }
}

# 6) 自动 bump + release
if ($NoBump) {
    Write-Host "`n✅ 完成(已 -NoBump)" -ForegroundColor Green; exit 0
}

$indexFile = 'index.html'
if (-not (Test-Path $indexFile)) {
    Write-Host "`n⚠️  找不到 $indexFile,跳过 bump" -ForegroundColor Yellow
    Write-Host "✅ push 完成(无 bump)" -ForegroundColor Green; exit 0
}

# 读 + 改 window.MATHW_V
$content = [System.IO.File]::ReadAllText($indexFile, [System.Text.UTF8Encoding]::UTF8)
$re = [regex]'window\.MATHW_V\s*=\s*"(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\.\-]+))?"'
$m = $re.Match($content)
if (-not $m.Success) {
    Write-Host "`n⚠️  解析 window.MATHW_V 失败,跳过 bump" -ForegroundColor Yellow
    Write-Host "✅ push 完成(无 bump)" -ForegroundColor Green; exit 0
}
$major = [int]$m.Groups[1].Value
$minor = [int]$m.Groups[2].Value
$patch = [int]$m.Groups[3].Value
$suffix = $m.Groups[4].Value
$oldVer = "$major.$minor.$patch$(if ($suffix) { "-$suffix" } else { '' })"
if ($BumpMajor) { $major++; $minor = 0; $patch = 0 }
elseif ($BumpMinor) { $minor++; $patch = 0 }
else { $patch++ }
$newVer = "$major.$minor.$patch$(if ($suffix) { "-$suffix" } else { '' })"
$newContent = $re.Replace($content, "window.MATHW_V = `"$newVer`"", 1)
[System.IO.File]::WriteAllText($indexFile, $newContent, [System.Text.UTF8Encoding]::new($false))

# 同步 README / AGENTS / CHANGELOG 里的版本号(简单 sed)
foreach ($doc in @('README.md', 'AGENTS.md', 'CHANGELOG.md')) {
    if (Test-Path $doc) {
        $docContent = [System.IO.File]::ReadAllText($doc, [System.Text.UTF8Encoding]::UTF8)
        $docNew = [regex]::Replace($docContent, "v$([regex]::Escape($oldVer))", "v$newVer")
        if ($docNew -ne $docContent) {
            [System.IO.File]::WriteAllText($doc, $docNew, [System.Text.UTF8Encoding]::new($false))
            git add $doc | Out-Null
        }
    }
}

Write-Host "[5/5] 自动 bump:`t$oldVer → $newVer" -ForegroundColor Cyan

$bumpMsgFile = Join-Path $env:TEMP ("bump_msg_" + [System.Guid]::NewGuid().ToString("N") + ".txt")
$bumpMsg = "bump: $oldVer → $newVer"
[System.IO.File]::WriteAllText($bumpMsgFile, $bumpMsg, [System.Text.UTF8Encoding]::new($false))
$rc = Invoke-Git add $indexFile
if ($rc -ne 0) { mavis-trash $bumpMsgFile 2>$null; exit $rc }
$rc = Invoke-Git -c user.name=MathematicsWeb -c user.email=mathw@local.dev commit -F $bumpMsgFile
mavis-trash $bumpMsgFile 2>$null
if ($rc -ne 0) { Write-Host "❌ bump commit 失败" -ForegroundColor Red; exit $rc }
$rc = Invoke-Git push $Remote $Branch
if ($rc -ne 0) { Write-Host "❌ bump push 失败" -ForegroundColor Red; exit $rc }

# 镜像 gitee bump
if ($hasGitee) {
    $rc_g = Invoke-Git push gitee $Branch
    if ($rc_g -ne 0) { Write-Host "  ⚠️  gitee bump 推送失败(非阻塞)" -ForegroundColor Yellow }
    else { Write-Host "  ✓ gitee bump 同步" -ForegroundColor Green }
}

# 5.5) tag
Write-Host "[5/5] git tag v$newVer" -ForegroundColor Cyan
$rc = Invoke-Git tag "v$newVer"
if ($rc -ne 0) { Write-Host "  ⚠️  本地 tag 已存在 · 继续" -ForegroundColor Yellow }
else { Write-Host "  ✓ 本地 tag v$newVer" -ForegroundColor Green }
$rc = Invoke-Git push $Remote "v$newVer"
if ($rc -ne 0) { Write-Host "  ⚠️  push tag 失败 · 继续" -ForegroundColor Yellow }
else { Write-Host "  ✓ 远端 tag v$newVer" -ForegroundColor Green }
if ($hasGitee) {
    $rc3 = Invoke-Git push gitee "v$newVer"
    if ($rc3 -ne 0) { Write-Host "  ⚠️  gitee tag 推送失败(非阻塞)" -ForegroundColor Yellow }
    else { Write-Host "  ✓ gitee tag v$newVer" -ForegroundColor Green }
}

# 6) GitHub Release
$token = [Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')
if (-not $token) {
    Write-Host "⚠️  GH_TOKEN 未设,跳过 release" -ForegroundColor Yellow
    Write-Host "`n✅ 完成 · bump + tag 已推,release 需手动" -ForegroundColor Green
    exit 0
}

# 抓 commit 列表(本地 tag → HEAD~1)
$lastTag = git describe --tags --abbrev=0 2>$null
$commitList = @()
if ($lastTag) {
    $commitList = @(git log "$lastTag..HEAD~1" --pretty=format:"- %s" 2>$null | Select-Object -First 30)
}
$commitSection = if ($commitList.Count -gt 0) { $commitList -join "`n" } else { "_no commits since last tag_" }

$releaseBody = @"
## MathematicsWeb v$newVer

### 改动

$commitSection

### 配套

- bump: $oldVer → $newVer
- 详见 `index.html` 的 `window.MATHW_V` 与 `CHANGELOG.md`

### 跑起来

```
.\start.ps1
```

浏览器开 http://localhost:8765
"@

$headers = @{
    "Authorization" = "token $token"
    "User-Agent"    = "MathematicsWeb"
    "Accept"        = "application/vnd.github+json"
}
$payload = @{
    tag_name   = "v$newVer"
    name       = "MathematicsWeb v$newVer"
    body       = $releaseBody
    draft      = $false
    prerelease = $false
} | ConvertTo-Json -Depth 5

$bodyFile = Join-Path $env:TEMP ("release_body_" + [System.Guid]::NewGuid().ToString("N") + ".json")
[System.IO.File]::WriteAllText($bodyFile, $payload, [System.Text.UTF8Encoding]::new($false))
try {
    Invoke-RestMethod -Method Post `
        -Uri "https://api.github.com/repos/$GitHubUser/$GitHubRepo/releases" `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.IO.File]::ReadAllText($bodyFile, [System.Text.UTF8Encoding]::UTF8)) `
        -TimeoutSec 30 | Out-Null
    Write-Host "  ✓ GitHub Release v$newVer 已发 · https://github.com/$GitHubUser/$GitHubRepo/releases/tag/v$newVer" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $errBody = $_.ErrorDetails.Message
    if ($status -eq 422 -and $errBody -match "already_exists") {
        Write-Host "  ⚠️  GitHub Release v$newVer 已存在 · 跳过" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  GitHub Release 创建失败(网络/权限?)· $status · $errBody" -ForegroundColor Yellow
    }
} finally {
    mavis-trash $bodyFile 2>$null
}

# 7) Gitee 镜像 release(可选)
$geToken = [Environment]::GetEnvironmentVariable('GITEE_TOKEN', 'User')
if ($geToken -and $geToken.Length -gt 0) {
    Write-Host "[6/6] 镜像 Release 到 Gitee" -ForegroundColor Cyan
    $geBody = $releaseBody -replace "https://github\.com/$GitHubUser/$GitHubRepo/releases/tag/", "https://gitee.com/$GiteeUser/$GitHubRepo/releases/tag/"
    $gePayload = @{
        tag_name = "v$newVer"
        name = "MathematicsWeb v$newVer"
        body = $geBody
        target_commitish = "main"
        prerelease = $false
    } | ConvertTo-Json -Depth 3
    $geBodyFile = Join-Path $env:TEMP ("ge_release_body_" + [System.Guid]::NewGuid().ToString("N") + ".json")
    [System.IO.File]::WriteAllText($geBodyFile, $gePayload, [System.Text.UTF8Encoding]::new($false))
    try {
        Invoke-RestMethod -Method Post `
            -Uri "https://gitee.com/api/v5/repos/$GiteeUser/$GitHubRepo/releases" `
            -Headers @{ "Content-Type" = "application/json; charset=utf-8"; "Authorization" = "token $geToken"; "User-Agent" = "MathematicsWeb" } `
            -InFile $geBodyFile `
            -TimeoutSec 30 | Out-Null
        Write-Host "  ✓ Gitee Release v$newVer 已镜像" -ForegroundColor Green
    } catch {
        $geStatus = 0
        if ($_.Exception.Response) { $geStatus = $_.Exception.Response.StatusCode.value__ }
        $geErr = $_.Exception.Message
        if ($geStatus -eq 400 -and $geErr -match "already_exists|已经存在") {
            Write-Host "  ⚠️  Gitee Release 已存在 · 跳过" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Gitee Release 失败 · $geStatus · $geErr" -ForegroundColor Yellow
        }
    } finally {
        mavis-trash $geBodyFile 2>$null
    }
}

Write-Host "`n✅ 完成 · MathematicsWeb v$newVer" -ForegroundColor Green
