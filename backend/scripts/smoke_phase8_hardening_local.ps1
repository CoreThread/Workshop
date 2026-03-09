$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:8788"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE8_HARDENING_LOCAL_OK"

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

$upperUrl = "$base/v1/analytics/overview?days=30&row_limit=999999&query_timeout_ms=6500&case_slice_timeout_ms=4100&inventory_slice_timeout_ms=4200&expense_slice_timeout_ms=4300&finance_slice_timeout_ms=4400"
$upperRes = Invoke-RestMethod -Method Get -Uri $upperUrl -Headers $headers
Ensure-OkResponse $upperRes "ANALYTICS_HARDENING_UPPER_CALL_FAILED"

if ($null -eq $upperRes.data.query_guardrails) { throw "ANALYTICS_GUARDRAILS_MISSING" }
if ($upperRes.data.query_guardrails.row_limit_effective -gt 1500) { throw "ANALYTICS_ROW_LIMIT_MAX_GUARD_FAILED" }
if ($upperRes.data.query_guardrails.row_limit_effective -ne 1500) { throw "ANALYTICS_ROW_LIMIT_UPPER_CLAMP_UNEXPECTED" }
if ($upperRes.data.query_guardrails.timeouts_ms.case_slice_timeout_ms -ne 4100) { throw "ANALYTICS_CASE_TIMEOUT_TUNING_FAILED" }
if ($upperRes.data.query_guardrails.timeouts_ms.inventory_slice_timeout_ms -ne 4200) { throw "ANALYTICS_INVENTORY_TIMEOUT_TUNING_FAILED" }
if ($upperRes.data.query_guardrails.timeouts_ms.expense_slice_timeout_ms -ne 4300) { throw "ANALYTICS_EXPENSE_TIMEOUT_TUNING_FAILED" }
if ($upperRes.data.query_guardrails.timeouts_ms.finance_slice_timeout_ms -ne 4400) { throw "ANALYTICS_FINANCE_TIMEOUT_TUNING_FAILED" }

$lowerUrl = "$base/v1/analytics/overview?days=30&row_limit=1&query_timeout_ms=100&case_slice_timeout_ms=1&inventory_slice_timeout_ms=1&expense_slice_timeout_ms=1&finance_slice_timeout_ms=1"
$lowerRes = Invoke-RestMethod -Method Get -Uri $lowerUrl -Headers $headers
Ensure-OkResponse $lowerRes "ANALYTICS_HARDENING_LOWER_CALL_FAILED"

if ($lowerRes.data.query_guardrails.row_limit_effective -lt 50) { throw "ANALYTICS_ROW_LIMIT_MIN_GUARD_FAILED" }
if ($lowerRes.data.query_guardrails.row_limit_effective -ne 50) { throw "ANALYTICS_ROW_LIMIT_LOWER_CLAMP_UNEXPECTED" }
if ($lowerRes.data.query_guardrails.timeouts_ms.base_query_timeout_ms -lt 1200) { throw "ANALYTICS_BASE_TIMEOUT_MIN_GUARD_FAILED" }
if ($lowerRes.data.query_guardrails.timeouts_ms.case_slice_timeout_ms -lt 800) { throw "ANALYTICS_CASE_TIMEOUT_MIN_GUARD_FAILED" }
if ($lowerRes.data.query_guardrails.timeouts_ms.inventory_slice_timeout_ms -lt 800) { throw "ANALYTICS_INVENTORY_TIMEOUT_MIN_GUARD_FAILED" }
if ($lowerRes.data.query_guardrails.timeouts_ms.expense_slice_timeout_ms -lt 800) { throw "ANALYTICS_EXPENSE_TIMEOUT_MIN_GUARD_FAILED" }
if ($lowerRes.data.query_guardrails.timeouts_ms.finance_slice_timeout_ms -lt 800) { throw "ANALYTICS_FINANCE_TIMEOUT_MIN_GUARD_FAILED" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  upper_row_limit_requested = $upperRes.data.query_guardrails.row_limit_requested
  upper_row_limit_effective = $upperRes.data.query_guardrails.row_limit_effective
  lower_row_limit_requested = $lowerRes.data.query_guardrails.row_limit_requested
  lower_row_limit_effective = $lowerRes.data.query_guardrails.row_limit_effective
  base_timeout_effective_ms = $lowerRes.data.query_guardrails.timeouts_ms.base_query_timeout_ms
  case_slice_timeout_effective_ms = $upperRes.data.query_guardrails.timeouts_ms.case_slice_timeout_ms
  inventory_slice_timeout_effective_ms = $upperRes.data.query_guardrails.timeouts_ms.inventory_slice_timeout_ms
  expense_slice_timeout_effective_ms = $upperRes.data.query_guardrails.timeouts_ms.expense_slice_timeout_ms
  finance_slice_timeout_effective_ms = $upperRes.data.query_guardrails.timeouts_ms.finance_slice_timeout_ms
}

$summary | ConvertTo-Json -Depth 20