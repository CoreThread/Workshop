$ErrorActionPreference = "Stop"

# Wrapper helper: runs existing authoritative archive smoke scripts in sequence.
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$preflightScript = Join-Path $scriptRoot "preflight_local_smoke.ps1"
$localScript = Join-Path $scriptRoot "smoke_phase6_archive_local.ps1"
$prodScript = Join-Path $scriptRoot "smoke_phase6_archive_prod.ps1"

if (-not (Test-Path $preflightScript)) { throw "PREFLIGHT_SCRIPT_NOT_FOUND: $preflightScript" }
if (-not (Test-Path $localScript)) { throw "LOCAL_SCRIPT_NOT_FOUND: $localScript" }
if (-not (Test-Path $prodScript)) { throw "PROD_SCRIPT_NOT_FOUND: $prodScript" }

Write-Host "Running local smoke preflight (health + auth ping)..."
$preflightOutput = & $preflightScript | Out-String
Write-Host $preflightOutput
if ($preflightOutput -notmatch "LOCAL_SMOKE_PREFLIGHT_OK") {
  throw "LOCAL_PREFLIGHT_MARKER_MISSING: expected LOCAL_SMOKE_PREFLIGHT_OK"
}

Write-Host "Running local archive smoke..."
$localOutput = & $localScript | Out-String
Write-Host $localOutput
if ($localOutput -notmatch "PHASE6_ARCHIVE_LOCAL_OK") {
  throw "LOCAL_MARKER_MISSING: expected PHASE6_ARCHIVE_LOCAL_OK"
}

Write-Host "Running prod archive smoke..."
$prodOutput = & $prodScript | Out-String
Write-Host $prodOutput
if ($prodOutput -notmatch "PHASE6_ARCHIVE_PROD_OK") {
  throw "PROD_MARKER_MISSING: expected PHASE6_ARCHIVE_PROD_OK"
}

[ordered]@{
  smoke = "PHASE6_ARCHIVE_ALL_OK"
  local_marker = "PHASE6_ARCHIVE_LOCAL_OK"
  prod_marker = "PHASE6_ARCHIVE_PROD_OK"
} | ConvertTo-Json -Depth 5
