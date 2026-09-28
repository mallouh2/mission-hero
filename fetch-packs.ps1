$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$outDir = 'C:\Users\Temp\Documents\GitHub\mission-hero\vendor-packs'
New-Item -ItemType Directory -Force $outDir | Out-Null

function Get-Pack($pageUrl, $outName) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing $pageUrl -TimeoutSec 40
    $zips = [regex]::Matches($r.Content, 'https?://[^"'' ]+\.zip') | ForEach-Object { $_.Value } | Select-Object -Unique
    $hrefs = $r.Links | ForEach-Object { $_.href } | Where-Object { $_ -match '\.zip' } | Select-Object -Unique
    $all = @($zips) + @($hrefs) | Where-Object { $_ } | Select-Object -Unique
    Write-Host "PAGE $pageUrl -> zips found: $($all -join ' | ')"
    if ($all.Count -gt 0) {
      $zipUrl = $all[0]
      if ($zipUrl.StartsWith('/')) { $zipUrl = 'https://quaternius.com' + $zipUrl }
      $dest = Join-Path $outDir $outName
      Invoke-WebRequest -UseBasicParsing $zipUrl -OutFile $dest -TimeoutSec 300
      Write-Host "DOWNLOADED $dest ($([math]::Round((Get-Item $dest).Length/1MB,1)) MB)"
    }
  } catch {
    Write-Host "FAILED $pageUrl : $($_.Exception.Message)"
  }
}

Get-Pack 'https://quaternius.com/packs/ultimateanimatedanimals.html' 'quaternius-animated-animals.zip'
Get-Pack 'https://quaternius.com/packs/farmanimal.html' 'quaternius-farm-animals.zip'
Get-Pack 'https://quaternius.com/packs/animatedfish.html' 'quaternius-fish.zip'

Get-ChildItem $outDir | ForEach-Object { Write-Host $_.Name }
