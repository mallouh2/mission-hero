$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repoDir = 'C:\Users\Temp\Documents\GitHub\mission-hero'
$helper = Join-Path $repoDir 'deploy\gh-cred.ps1'
$owner = 'mallouh2'
$repo = 'mission-hero'

# 1) اقرأ التوكن
$credOut = powershell -NoProfile -ExecutionPolicy Bypass -File $helper
$username = ($credOut | Where-Object { $_ -like 'username=*' }) -replace '^username=', ''
$token = ($credOut | Where-Object { $_ -like 'password=*' }) -replace '^password=', ''
if (-not $token) { throw 'token missing' }
$headers = @{ Authorization = "token $token"; 'User-Agent' = 'mission-hero-deploy'; Accept = 'application/vnd.github+json' }

# 2) تحقق من الهوية
$me = Invoke-RestMethod -Headers $headers -Uri 'https://api.github.com/user'
Write-Host ("AUTH OK as " + $me.login)

# 3) أنشئ الريبو إذا غير موجود
try {
  Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$owner/$repo" | Out-Null
  Write-Host 'REPO exists'
} catch {
  Invoke-RestMethod -Headers $headers -Method Post -Uri 'https://api.github.com/user/repos' -ContentType 'application/json' -Body (@{ name = $repo; private = $false; description = 'Mission Hero - Arabic educational games for kids' } | ConvertTo-Json) | Out-Null
  Write-Host 'REPO created'
}

# 4) ابحث عن git (GitHub Desktop)
$git = $null
Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Directory -Filter 'app-*' | ForEach-Object {
  $p = Join-Path $_.FullName 'resources\app\git\cmd\git.exe'
  if (Test-Path $p) { $git = $p }
}
if (-not $git) { throw 'git.exe not found (GitHub Desktop)' }
Write-Host ("GIT: " + $git)

# 5) init/commit
Set-Location $repoDir
if (-not (Test-Path (Join-Path $repoDir '.git'))) { & $git init | Out-Null }
& $git config user.name 'mallouh2'
& $git config user.email 'mallouh2@users.noreply.github.com'
& $git add -A
$commitMsg = 'Mission Hero - first online deploy'
$committed = $false
try { & $git commit -m $commitMsg 2>$null | Out-Null; $committed = $true } catch { }
& $git branch -M main 2>$null
& $git remote remove origin 2>$null
& $git remote add origin "https://github.com/$owner/$repo.git"
Write-Host 'GIT prepared'

# 6) push عبر مساعد الاعتماد (بدون credential.manager حتى لا يتجمد)
& $git -c 'credential.helper=' -c "credential.helper=!powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/Temp/Documents/GitHub/mission-hero/deploy/gh-cred.ps1" push -u origin main 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host 'PUSH done'

# 7) فعّل GitHub Pages
try {
  Invoke-RestMethod -Headers $headers -Method Post -Uri "https://api.github.com/repos/$owner/$repo/pages" -ContentType 'application/json' -Body (@{ source = @{ branch = 'main'; path = '/' } } | ConvertTo-Json -Depth 5) | Out-Null
  Write-Host 'PAGES enabled'
} catch {
  Write-Host ('PAGES: ' + $_.Exception.Message)
}

# 8) انتظر حتى يصبح الموقع حياً
$siteUrl = "https://$owner.github.io/$repo/"
$up = $false
for ($i = 0; $i -lt 18; $i++) {
  Start-Sleep -Seconds 10
  try {
    $code = (Invoke-WebRequest -UseBasicParsing $siteUrl -TimeoutSec 15).StatusCode
    if ($code -eq 200) { $up = $true; break }
  } catch { }
}
if ($up) { Write-Host ("SITE LIVE: " + $siteUrl) } else { Write-Host ("SITE not up yet (build takes a few minutes): " + $siteUrl) }
