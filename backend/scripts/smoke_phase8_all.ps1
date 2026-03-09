$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localScript = Join-Path $scriptRoot "smoke_phase8_local.ps1"
$prodScript = Join-Path $scriptRoot "smoke_phase8_prod.ps1"

if (-not (Test-Path $localScript)) { throw "LOCAL_SCRIPT_NOT_FOUND: $localScript" }
if (-not (Test-Path $prodScript)) { throw "PROD_SCRIPT_NOT_FOUND: $prodScript" }

Write-Host "Running local Phase 8 smoke..."
$localOutput = & $localScript | Out-String
Write-Host $localOutput
if ($localOutput -notmatch "PHASE8_LOCAL_OK") {
  throw "LOCAL_MARKER_MISSING: expected PHASE8_LOCAL_OK"
}

Write-Host "Running prod Phase 8 smoke..."
$prodOutput = & $prodScript | Out-String
Write-Host $prodOutput
if ($prodOutput -notmatch "PHASE8_PROD_OK") {
  throw "PROD_MARKER_MISSING: expected PHASE8_PROD_OK"
}

[ordered]@{
  smoke = "PHASE8_ALL_OK"
  local_marker = "PHASE8_LOCAL_OK"
  prod_marker = "PHASE8_PROD_OK"
} | ConvertTo-Json -Depth 5
