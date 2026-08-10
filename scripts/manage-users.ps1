param(
  [string]$UsersFile = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $UsersFile) {
  $UsersFile = Join-Path $Root "data\users.json"
}
$UsersFile = [System.IO.Path]::GetFullPath($UsersFile)
$env:USERS_FILE = $UsersFile
$Manager = Join-Path $PSScriptRoot "manage-users.js"

Write-Host ""
Write-Host "ADMINISTRACION DE USUARIOS - DISTRIBUIDORA LOPEZ" -ForegroundColor Cyan
Write-Host "Archivo: $UsersFile"
$current = (& node $Manager list | ConvertFrom-Json)
$current.users | Format-Table username, name, role, sellerName, active -AutoSize

$target = (Read-Host "Usuario a modificar, o nombre del usuario nuevo").Trim().ToLowerInvariant()
if (-not $target) { throw "Debe indicar un usuario." }
$existing = $current.users | Where-Object { $_.username -eq $target } | Select-Object -First 1

$defaultUsername = if ($existing) { $existing.username } else { $target }
$defaultName = if ($existing) { $existing.name } else { "" }
$defaultRole = if ($existing) { $existing.role } else { "seller" }
$defaultSeller = if ($existing) { $existing.sellerName } else { "" }

$usernameInput = Read-Host "Nombre de ingreso [$defaultUsername]"
$username = if ($usernameInput.Trim()) { $usernameInput.Trim().ToLowerInvariant() } else { $defaultUsername }
$nameInput = Read-Host "Nombre visible [$defaultName]"
$name = if ($nameInput.Trim()) { $nameInput.Trim() } else { $defaultName }
$roleInput = Read-Host "Rol admin, seller o driver [$defaultRole]"
$role = if ($roleInput.Trim()) { $roleInput.Trim().ToLowerInvariant() } else { $defaultRole }
$sellerName = ""
if ($role -eq "seller") {
  $sellerInput = Read-Host "Vendedor asociado [$defaultSeller]"
  $sellerName = if ($sellerInput.Trim()) { $sellerInput.Trim() } elseif ($defaultSeller) { $defaultSeller } else { $name }
}

$securePassword = Read-Host "Nueva clave (Enter conserva la actual)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}

$payload = @{
  targetUsername = $target
  username = $username
  name = $name
  role = $role
  sellerName = $sellerName
  password = $password
  active = $true
} | ConvertTo-Json -Compress

try {
  $result = ($payload | & node $Manager upsert | ConvertFrom-Json)
  Write-Host ""
  Write-Host "Usuario guardado correctamente." -ForegroundColor Green
  Write-Host "Usuario: $($result.user.username)"
  Write-Host "Nombre: $($result.user.name)"
  Write-Host "Rol: $($result.user.role)"
  if ($result.backup) { Write-Host "Respaldo: $($result.backup)" }
  Write-Host "Cerrar las sesiones abiertas o reiniciar el servidor para invalidarlas." -ForegroundColor Yellow
} finally {
  $password = $null
  $payload = $null
  Remove-Item Env:USERS_FILE -ErrorAction SilentlyContinue
}
