param(
  [Parameter(Mandatory = $true)]
  [string]$ReportFile,

  [string]$PrinterName = ""
)

trap {
  Write-Output $_.Exception.Message
  exit 1
}

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ReportFile)) {
  throw "No existe el archivo de reporte para imprimir: $ReportFile"
}

$selectedPrinter = $PrinterName
if ([string]::IsNullOrWhiteSpace($selectedPrinter)) {
  $defaultPrinter = Get-CimInstance -ClassName Win32_Printer |
    Where-Object { $_.Default -eq $true } |
    Select-Object -First 1

  if (-not $defaultPrinter) {
    throw "No hay impresora predeterminada configurada en Windows."
  }

  $selectedPrinter = $defaultPrinter.Name
}

$printer = Get-CimInstance -ClassName Win32_Printer |
  Where-Object { $_.Name -eq $selectedPrinter } |
  Select-Object -First 1

if (-not $printer) {
  throw "No se encontro la impresora configurada: $selectedPrinter"
}

$virtualPattern = "Microsoft Print to PDF|OneNote|XPS|Fax|AnyDesk"
if ($printer.Name -match $virtualPattern -or $printer.DriverName -match $virtualPattern -or $printer.PortName -match "^TS\d+") {
  throw "La impresora seleccionada es virtual o redireccionada: $($printer.Name). Instalar/configurar la impresora fisica de red como predeterminada o definir DL_STOCK_PRINTER_NAME."
}

Get-Content -LiteralPath $ReportFile | Out-Printer -Name $printer.Name

Write-Output "Trabajo enviado a $($printer.Name)"
