param(
  [Parameter(Mandatory=$true)]
  [string]$ExcelPath,
  [string]$PythonExe = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$StatePath = Join-Path $Root "data\demo-state.json"
$ScriptPath = Join-Path $PSScriptRoot "import-product-portfolio.py"

if (-not (Test-Path -LiteralPath $ExcelPath)) {
  throw "No existe el Excel indicado: $ExcelPath"
}

if (-not $PythonExe) {
  $PythonExe = $env:DL_PYTHON_EXE
}
if (-not $PythonExe) {
  $PythonExe = "python"
}

& $PythonExe $ScriptPath --excel $ExcelPath --state $StatePath
