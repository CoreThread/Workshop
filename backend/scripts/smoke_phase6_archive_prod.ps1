$ErrorActionPreference = "Stop"

$base = "https://workshop-api.jaiswal-utkarshuj.workers.dev"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE6_ARCHIVE_PROD_OK"

function To-JsonBody([object]$obj) {
  return ($obj | ConvertTo-Json -Depth 30 -Compress)
}

function Ensure-OkResponse([object]$response, [string]$errorCode) {
  if (-not $response -or $response.code -ne "OK") {
    throw $errorCode
  }
}

function Get-Sha256Hex([string]$text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha.ComputeHash($bytes)
  } finally {
    $sha.Dispose()
  }
  return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$caseNo = "P6A-PROD-$stamp"
$phone = "98$(Get-Random -Minimum 100000000 -Maximum 999999999)"

$loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
Ensure-OkResponse $loginRes "LOGIN_FAILED"
if (-not $loginRes.data.access_token) { throw "LOGIN_TOKEN_MISSING" }

$headers = @{ Authorization = "Bearer $($loginRes.data.access_token)" }

$dbUsageRes = Invoke-RestMethod -Method Post -Uri "$base/v1/admin/db-usage" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  usage_mb = 475
  quota_mb = 500
  threshold_pct = 90
  source = "phase6-archive-prod-smoke"
  details_json = @{ marker = "prod"; stamp = $stamp }
})
Ensure-OkResponse $dbUsageRes "DB_USAGE_SAVE_FAILED"

$dbUsageGetRes = Invoke-RestMethod -Method Get -Uri "$base/v1/admin/db-usage" -Headers $headers
Ensure-OkResponse $dbUsageGetRes "DB_USAGE_FETCH_FAILED"

$triggerRes = Invoke-RestMethod -Method Post -Uri "$base/v1/admin/archive/trigger-check" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  force = $false
  limit = 10
})
Ensure-OkResponse $triggerRes "ARCHIVE_TRIGGER_CHECK_FAILED"
if (-not $triggerRes.data.trigger_ready) { throw "ARCHIVE_TRIGGER_NOT_READY" }

$caseRes = Invoke-RestMethod -Method Post -Uri "$base/v1/cases" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  case_no = $caseNo
  customer = @{ name = "Phase6 Archive Prod"; phone = $phone }
  item = @{ item_category = "fan"; reported_issue = "archive smoke" }
})
Ensure-OkResponse $caseRes "CASE_CREATE_FAILED"
$caseId = $caseRes.data.case_id
if (-not $caseId) { throw "CASE_ID_MISSING" }

$backupBundle = @{}
$backupStableJson = "{}"
$backupChecksum = Get-Sha256Hex $backupStableJson

$archiveRes = Invoke-RestMethod -Method Post -Uri "$base/v1/admin/archive/cases/$caseId" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  allow_open_case = $true
  archive_location_ref = "gsheet://archive/prod/$stamp"
  backup_bundle_json = $backupBundle
  backup_checksum_sha256 = $backupChecksum
  notes = "phase6 archive prod smoke"
})
Ensure-OkResponse $archiveRes "ARCHIVE_CASE_FAILED"
$archiveId = $archiveRes.data.archive.id
if (-not $archiveId) { throw "ARCHIVE_ID_MISSING" }

$indexRes = Invoke-RestMethod -Method Get -Uri "$base/v1/admin/archive-index?case_no=$caseNo&limit=10" -Headers $headers
Ensure-OkResponse $indexRes "ARCHIVE_INDEX_FETCH_FAILED"
$indexRows = @($indexRes.data)
if ($indexRows.Count -lt 1) { throw "ARCHIVE_INDEX_EMPTY" }

$restoreRes = Invoke-RestMethod -Method Post -Uri "$base/v1/admin/archive/restore/$archiveId" -Headers $headers -ContentType "application/json" -Body "{}"
Ensure-OkResponse $restoreRes "ARCHIVE_RESTORE_FAILED"

$restoredIndexRes = Invoke-RestMethod -Method Get -Uri "$base/v1/admin/archive-index?case_no=$caseNo&restore_status=RESTORED&limit=10" -Headers $headers
Ensure-OkResponse $restoredIndexRes "ARCHIVE_INDEX_RESTORED_FETCH_FAILED"
$restoredRows = @($restoredIndexRes.data)
if ($restoredRows.Count -lt 1) { throw "ARCHIVE_RESTORE_STATUS_NOT_FOUND" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  db_usage_snapshot_id = $dbUsageRes.data.id
  utilization_pct = $dbUsageRes.data.utilization_pct
  threshold_pct = $dbUsageRes.data.threshold_pct
  trigger_ready = $triggerRes.data.trigger_ready
  case_no = $caseNo
  case_id = $caseId
  archive_id = $archiveId
  archive_checksum_verified = $archiveRes.data.archive.checksum_verified
  archive_restore_status = $restoreRes.data.restore_status
  archive_index_rows = $indexRows.Count
  restored_index_rows = $restoredRows.Count
}

$summary | ConvertTo-Json -Depth 20
