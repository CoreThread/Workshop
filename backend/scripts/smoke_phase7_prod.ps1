$ErrorActionPreference = "Stop"

$base = "https://workshop-api.jaiswal-utkarshuj.workers.dev"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE7_PROD_OK"

function To-JsonBody([object]$obj) {
  return ($obj | ConvertTo-Json -Depth 20 -Compress)
}

function Ensure-OkResponse([object]$response, [string]$errorCode) {
  if (-not $response -or $response.code -ne "OK") {
    throw $errorCode
  }
}

$loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
Ensure-OkResponse $loginRes "LOGIN_FAILED"
if (-not $loginRes.data.access_token) { throw "LOGIN_TOKEN_MISSING" }

$headers = @{ Authorization = "Bearer $($loginRes.data.access_token)" }

$opsStatusRes = Invoke-RestMethod -Method Get -Uri "$base/v1/admin/ops-status" -Headers $headers
Ensure-OkResponse $opsStatusRes "OPS_STATUS_FETCH_FAILED"

$followupRes = Invoke-RestMethod -Method Get -Uri "$base/v1/followups?queue=pending_approvals&limit=10" -Headers $headers
Ensure-OkResponse $followupRes "FOLLOWUPS_FETCH_FAILED"

$metricsRes = Invoke-RestMethod -Method Get -Uri "$base/v1/admin/metrics/summary?hours=24&logs_limit=500&trend_limit=20&query_timeout_ms=9000" -Headers $headers
Ensure-OkResponse $metricsRes "METRICS_SUMMARY_FAILED"

if ($null -eq $metricsRes.data.request_volume.error_rate_pct) { throw "METRICS_ERROR_RATE_MISSING" }
if ($null -eq $metricsRes.data.latency_ms.p50) { throw "METRICS_P50_MISSING" }
if ($null -eq $metricsRes.data.latency_ms.p95) { throw "METRICS_P95_MISSING" }
if ($null -eq $metricsRes.data.failed_jobs.total_failed_backup_archive_jobs) { throw "METRICS_FAILED_JOBS_MISSING" }
if ($null -eq $metricsRes.data.db_usage_trend) { throw "METRICS_DB_USAGE_TREND_MISSING" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  ops_status_rows = @($opsStatusRes.data).Count
  followup_rows = @($followupRes.data).Count
  metrics_window_hours = $metricsRes.data.window_hours
  error_rate_pct = $metricsRes.data.request_volume.error_rate_pct
  latency_p50_ms = $metricsRes.data.latency_ms.p50
  latency_p95_ms = $metricsRes.data.latency_ms.p95
  failed_backup_archive_jobs = $metricsRes.data.failed_jobs.total_failed_backup_archive_jobs
  db_usage_trend_rows = @($metricsRes.data.db_usage_trend).Count
}

$summary | ConvertTo-Json -Depth 20
