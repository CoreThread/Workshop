$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$localScript = Join-Path $scriptRoot "smoke_phase8_roles_local.ps1"
$prodScript = Join-Path $scriptRoot "smoke_phase8_roles_prod.ps1"

if (-not (Test-Path $localScript)) { throw "LOCAL_SCRIPT_NOT_FOUND: $localScript" }
if (-not (Test-Path $prodScript)) { throw "PROD_SCRIPT_NOT_FOUND: $prodScript" }

Write-Host "Running local Phase 8 role smoke..."
$localOutput = & $localScript | Out-String
Write-Host $localOutput
if ($localOutput -notmatch "PHASE8_ROLE_LOCAL_OK") {
  throw "LOCAL_ROLE_MARKER_MISSING: expected PHASE8_ROLE_LOCAL_OK"
}

Write-Host "Running prod Phase 8 role smoke..."
$prodOutput = & $prodScript | Out-String
Write-Host $prodOutput
if ($prodOutput -notmatch "PHASE8_ROLE_PROD_OK") {
  throw "PROD_ROLE_MARKER_MISSING: expected PHASE8_ROLE_PROD_OK"
}

[ordered]@{
  smoke = "PHASE8_ROLE_ALL_OK"
  local_marker = "PHASE8_ROLE_LOCAL_OK"
  prod_marker = "PHASE8_ROLE_PROD_OK"
} | ConvertTo-Json -Depth 5