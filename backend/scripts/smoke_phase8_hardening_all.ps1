$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$preflightScript = Join-Path $scriptRoot "preflight_local_smoke.ps1"
$localScript = Join-Path $scriptRoot "smoke_phase8_hardening_local.ps1"
$prodScript = Join-Path $scriptRoot "smoke_phase8_hardening_prod.ps1"

if (-not (Test-Path $preflightScript)) { throw "PREFLIGHT_SCRIPT_NOT_FOUND: $preflightScript" }
if (-not (Test-Path $localScript)) { throw "LOCAL_SCRIPT_NOT_FOUND: $localScript" }
if (-not (Test-Path $prodScript)) { throw "PROD_SCRIPT_NOT_FOUND: $prodScript" }

Write-Host "Running local smoke preflight (health + auth ping)..."
$preflightOutput = & $preflightScript | Out-String
Write-Host $preflightOutput
if ($preflightOutput -notmatch "LOCAL_SMOKE_PREFLIGHT_OK") {
  throw "LOCAL_PREFLIGHT_MARKER_MISSING: expected LOCAL_SMOKE_PREFLIGHT_OK"
}

Write-Host "Running local Phase 8 hardening smoke..."
$localOutput = & $localScript | Out-String
Write-Host $localOutput
if ($localOutput -notmatch "PHASE8_HARDENING_LOCAL_OK") {
  throw "LOCAL_MARKER_MISSING: expected PHASE8_HARDENING_LOCAL_OK"
}

Write-Host "Running prod Phase 8 hardening smoke..."
$prodOutput = & $prodScript | Out-String
Write-Host $prodOutput
if ($prodOutput -notmatch "PHASE8_HARDENING_PROD_OK") {
  throw "PROD_MARKER_MISSING: expected PHASE8_HARDENING_PROD_OK"
}

[ordered]@{
  smoke = "PHASE8_HARDENING_ALL_OK"
  local_marker = "PHASE8_HARDENING_LOCAL_OK"
  prod_marker = "PHASE8_HARDENING_PROD_OK"
} | ConvertTo-Json -Depth 5