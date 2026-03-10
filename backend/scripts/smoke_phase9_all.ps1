$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$preflightScript = Join-Path $scriptRoot "preflight_local_smoke.ps1"
$localScript = Join-Path $scriptRoot "smoke_phase9_local.ps1"
$prodScript = Join-Path $scriptRoot "smoke_phase9_prod.ps1"

if (-not (Test-Path $preflightScript)) { throw "PREFLIGHT_SCRIPT_NOT_FOUND: $preflightScript" }
if (-not (Test-Path $localScript)) { throw "LOCAL_SCRIPT_NOT_FOUND: $localScript" }
if (-not (Test-Path $prodScript)) { throw "PROD_SCRIPT_NOT_FOUND: $prodScript" }

Write-Host "Running local smoke preflight (health + auth ping)..."
$preflightOutput = & $preflightScript | Out-String
Write-Host $preflightOutput
if ($preflightOutput -notmatch "LOCAL_SMOKE_PREFLIGHT_OK") {
  throw "LOCAL_PREFLIGHT_MARKER_MISSING: expected LOCAL_SMOKE_PREFLIGHT_OK"
}

Write-Host "Running local Phase 9 smoke..."
$localOutput = & $localScript | Out-String
Write-Host $localOutput
if ($localOutput -notmatch "PHASE9_LOCAL_OK") {
  throw "LOCAL_MARKER_MISSING: expected PHASE9_LOCAL_OK"
}

Write-Host "Running prod Phase 9 smoke..."
$prodOutput = & $prodScript | Out-String
Write-Host $prodOutput
if ($prodOutput -notmatch "PHASE9_PROD_OK") {
  throw "PROD_MARKER_MISSING: expected PHASE9_PROD_OK"
}

[ordered]@{
  smoke = "PHASE9_ALL_OK"
  local_marker = "PHASE9_LOCAL_OK"
  prod_marker = "PHASE9_PROD_OK"
} | ConvertTo-Json -Depth 5
