$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir
$LogDir = Join-Path $ProjectDir "logs"
$LogFile = Join-Path $LogDir "server.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$env:PORT = "8790"
$env:DL_PORT = "8790"
$env:DL_HOST = "127.0.0.1"
$env:DATA_DIR = Join-Path $ProjectDir "data"
$env:STATE_FILE = Join-Path $env:DATA_DIR "demo-state.json"
$env:USERS_FILE = Join-Path $env:DATA_DIR "users.json"
$env:DL_VERSION = "8790-95"
$env:DL_INSTALLATION_NAME = "SERVIDOR_UNICO_8790"
$env:DL_LICENSE_FILE = Join-Path $env:DATA_DIR "license.json"
$env:DL_LICENSE_PUBLIC_KEY_FILE = Join-Path $ProjectDir "config\license-public-key.pem"
$env:DL_INTEGRITY_FILE = Join-Path $env:DATA_DIR "integrity-manifest.json"
$env:DL_SECURITY_AUDIT_FILE = Join-Path $env:DATA_DIR "security-audit.log"
$env:DL_LICENSE_ENFORCEMENT = "strict"
$env:DL_INTEGRITY_ENFORCE = "block"
$env:DL_SUPPORT_WHATSAPP_PHONE = "5493512410535"
$env:DL_MAGIC_DNS_HOST = "desktop-c2c0q4v.tail6f19de.ts.net"
$env:DL_SERVER_NAME = "desktop-c2c0q4v"
$env:DL_STOCK_PRINTER_NAME = ""

New-Item -ItemType Directory -Force -Path $env:DATA_DIR | Out-Null
"$(Get-Date -Format s) - Starting Distribuidora Lopez CRM on $env:DL_HOST`:$env:PORT" | Out-File -FilePath $LogFile -Append -Encoding utf8
& "C:\Program Files\nodejs\node.exe" server.js *>> $LogFile

