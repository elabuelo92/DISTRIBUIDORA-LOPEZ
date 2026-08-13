param(
  [string]$Version = "v89",
  [string]$PackageName = "DLPreventaServer-UNICO-8790-2026-08-13-v89-PROVEEDORES-CACHE"
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$ReleaseDir = Join-Path $ProjectDir "release"
$StageDir = Join-Path $ReleaseDir $PackageName
$ZipFile = Join-Path $ReleaseDir "$PackageName.zip"

$projectFull = [System.IO.Path]::GetFullPath($ProjectDir)
$releaseFull = [System.IO.Path]::GetFullPath($ReleaseDir)
$stageFull = [System.IO.Path]::GetFullPath($StageDir)

if (-not $releaseFull.StartsWith($projectFull, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "ReleaseDir fuera del proyecto: $releaseFull"
}

if (-not $stageFull.StartsWith($releaseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "StageDir fuera de release: $stageFull"
}

New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null
if (Test-Path -LiteralPath $StageDir) {
  Remove-Item -LiteralPath $StageDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

$files = @(
  "ABRIR-DASHBOARD-LOCAL.cmd",
  "ABRIR-DASHBOARD-MAC.command",
  "ADMINISTRAR-USUARIOS.cmd",
  "DETENER-SERVIDORES-8789-8790.cmd",
  "INICIAR-SERVIDOR-UNICO-8790.cmd",
  "REINICIAR-SERVIDOR-8790-V88-ADMIN.cmd",
  "SOPORTE-MANTENIMIENTO.cmd",
  "VERIFICAR-SERVIDOR-8790.cmd",
  "account-engine.js",
  "app.js",
  "config.js",
  "delivery-engine.js",
  "erpnext-engine.js",
  "event-engine.js",
  "index.html",
  "legal-engine.js",
  "license-engine.js",
  "manifest.json",
  "maps-config.js",
  "order-engine.js",
  "package.json",
  "production.env.example",
  "README.md",
  "server.js",
  "styles.css",
  "sw.js"
)

foreach ($file in $files) {
  $source = Join-Path $ProjectDir $file
  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Omitido, no existe: $file"
    continue
  }
  Copy-Item -LiteralPath $source -Destination (Join-Path $StageDir $file) -Force
}

foreach ($dir in @("config", "database", "docs", "icons", "scripts", "importaciones")) {
  $source = Join-Path $ProjectDir $dir
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $StageDir $dir) -Recurse -Force
  }
}

$dataOut = Join-Path $StageDir "data"
New-Item -ItemType Directory -Force -Path $dataOut | Out-Null
foreach ($dataFile in @("demo-state.json", "users.json", "license.json", "install-id.json", "integrity-manifest.json", "session-config.json")) {
  $source = Join-Path (Join-Path $ProjectDir "data") $dataFile
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $dataOut $dataFile) -Force
  }
}

$apkOut = Join-Path $StageDir "android-apk\out"
New-Item -ItemType Directory -Force -Path $apkOut | Out-Null
foreach ($apk in @("DL-Preventa.apk", "DL-Preventa-GPS-NATIVO-8790.apk", "DL-Preventa-GPS-NATIVO-8790-$Version.apk")) {
  $source = Join-Path $ProjectDir "android-apk\out\$apk"
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $apkOut $apk) -Force
  }
}

if (Test-Path -LiteralPath $ZipFile) {
  Remove-Item -LiteralPath $ZipFile -Force
}

Compress-Archive -Path (Join-Path $StageDir "*") -DestinationPath $ZipFile -Force

$hash = Get-FileHash -LiteralPath $ZipFile -Algorithm SHA256
[pscustomobject]@{
  Package = $ZipFile
  Size = (Get-Item -LiteralPath $ZipFile).Length
  SHA256 = $hash.Hash
}
