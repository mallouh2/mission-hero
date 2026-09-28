$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repoDir = 'C:\Users\Temp\Documents\GitHub\mission-hero'
$helper = Join-Path $repoDir 'deploy\gh-cred.ps1'
$owner = 'mallouh2'
$repo = 'mission-hero'

$credOut = powershell -NoProfile -ExecutionPolicy Bypass -File $helper
$username = ($credOut | Where-Object { $_ -like 'username=*' }) -replace '^username=', ''
$token = ($credOut | Where-Object { $_ -like 'password=*' }) -replace '^password=', ''
if (-not $token) { throw 'token missing' }
$headers = @{ Authorization = "token $token"; 'User-Agent' = 'mission-hero-deploy'; Accept = 'application/vnd.github+json' }

$git = $null
Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Directory -Filter 'app-*' | ForEach-Object {
  $p = Join-Path $_.FullName 'resources\app\git\cmd\git.exe'
  if (Test-Path $p) { $git = $p }
}
if (-not $git) { throw 'git.exe not found' }

Set-Location $repoDir
& $git remote add origin "https://github.com/$owner/$repo.git" 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host '--- pushing ---'
& $git -c 'credential.helper=' -c "credential.helper=!powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/Temp/Documents/GitHub/mission-hero/deploy/gh-cred.ps1" push -u origin main 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host '--- push finished ---'

try {
  Invoke-RestMethod -Headers $headers -Method Post -Uri "https://api.github.com/repos/$owner/$repo/pages" -ContentType 'application/json' -Body (@{ source = @{ branch = 'main'; path = '/' } } | ConvertTo-Json -Depth 5) | Out-Null
  Write-Host 'PAGES enabled'
} catch {
  Write-Host ('PAGES: ' + $_.Exception.Message)
}

$siteUrl = "https://$owner.github.io/$repo/"
$up = $false
for ($i = 0; $i -lt 18; $i++) {
  Start-Sleep -Seconds 10
  try {
    $code = (Invoke-WebRequest -UseBasicParsing $siteUrl -TimeoutSec 15).StatusCode
    if ($code -eq 200) { $up = $true; break }
  } catch { }
}
if ($up) { Write-Host ("SITE LIVE: " + $siteUrl) } else { Write-Host ("SITE not up yet: " + $siteUrl) }
