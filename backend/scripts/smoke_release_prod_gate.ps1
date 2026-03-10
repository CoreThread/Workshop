param(
  [string]$ResultPath = ""
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$checks = @(
  @{ script = "smoke_phase6_archive_prod.ps1"; marker = "PHASE6_ARCHIVE_PROD_OK" },
  @{ script = "smoke_phase8_prod.ps1"; marker = "PHASE8_PROD_OK" },
  @{ script = "smoke_phase8_roles_prod.ps1"; marker = "PHASE8_ROLE_PROD_OK" },
  @{ script = "smoke_phase8_hardening_prod.ps1"; marker = "PHASE8_HARDENING_PROD_OK" },
  @{ script = "smoke_phase9_prod.ps1"; marker = "PHASE9_PROD_OK" }
)

$gateStart = [System.Diagnostics.Stopwatch]::StartNew()
$checkResults = @()

foreach ($check in $checks) {
  $scriptPath = Join-Path $scriptRoot $check.script
  if (-not (Test-Path $scriptPath)) {
    throw "PROD_GATE_SCRIPT_NOT_FOUND: $scriptPath"
  }

  $checkTimer = [System.Diagnostics.Stopwatch]::StartNew()
  Write-Host "Running prod gate check: $($check.script)..."
  $output = & $scriptPath | Out-String
  Write-Host $output

  if ($output -notmatch $check.marker) {
    throw "PROD_GATE_MARKER_MISSING: expected $($check.marker) from $($check.script)"
  }

  $checkTimer.Stop()
  $checkResults += [ordered]@{
    script = $check.script
    marker = $check.marker
    passed = $true
    duration_ms = [int]$checkTimer.ElapsedMilliseconds
  }
}

$gateStart.Stop()

$result = [ordered]@{
  smoke = "RELEASE_PROD_GATE_OK"
  gate_timestamp_utc = (Get-Date).ToUniversalTime().ToString("o")
  total_duration_ms = [int]$gateStart.ElapsedMilliseconds
  checks = $checkResults
}

$resultJson = $result | ConvertTo-Json -Depth 10

if ($ResultPath -ne "") {
  $resultDir = Split-Path -Parent $ResultPath
  if ($resultDir -and -not (Test-Path $resultDir)) {
    New-Item -ItemType Directory -Path $resultDir -Force | Out-Null
  }
  Set-Content -Path $ResultPath -Value $resultJson -Encoding UTF8
}

$resultJson
