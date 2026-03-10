$ErrorActionPreference = "Stop"

$itEmail = if ($env:WORKSHOP_IT_EMAIL) { $env:WORKSHOP_IT_EMAIL } else { "it@rajeshelec.local" }
$itPassword = if ($env:WORKSHOP_IT_PASSWORD) { $env:WORKSHOP_IT_PASSWORD } else { "Admin@12345!" }
$staffEmail = if ($env:WORKSHOP_STAFF_EMAIL) { $env:WORKSHOP_STAFF_EMAIL } else { "staff@rajeshelec.local" }
$staffPassword = if ($env:WORKSHOP_STAFF_PASSWORD) { $env:WORKSHOP_STAFF_PASSWORD } else { "Admin@12345!" }
$smokeTag = "PHASE8_ROLE_LOCAL_OK"

function To-JsonBody([object]$obj) {
  return ($obj | ConvertTo-Json -Depth 20 -Compress)
}

function Ensure-OkResponse([object]$response, [string]$errorCode) {
  if (-not $response -or $response.code -ne "OK") {
    throw $errorCode
  }
}

function Resolve-BaseUrl() {
  if ($env:WORKSHOP_LOCAL_API_BASE) {
    return $env:WORKSHOP_LOCAL_API_BASE.TrimEnd("/")
  }

  $candidates = @(
    "http://127.0.0.1:8788",
    "http://127.0.0.1:8787"
  )

  foreach ($candidate in $candidates) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri "$candidate/health" -TimeoutSec 3
      if ($health.ok -eq $true) {
        return $candidate
      }
    } catch {
      # try next candidate
    }
  }

  throw "LOCAL_API_NOT_REACHABLE"
}

$base = Resolve-BaseUrl

function Login-And-LoadAnalytics([string]$email, [string]$password) {
  $loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
  Ensure-OkResponse $loginRes "LOGIN_FAILED_$email"
  if (-not $loginRes.data.access_token) { throw "LOGIN_TOKEN_MISSING_$email" }

  $headers = @{ Authorization = "Bearer $($loginRes.data.access_token)" }
  $analyticsRes = Invoke-RestMethod -Method Get -Uri "$base/v1/analytics/overview?days=30&query_timeout_ms=9000" -Headers $headers
  Ensure-OkResponse $analyticsRes "ANALYTICS_OVERVIEW_FAILED_$email"
  return $analyticsRes
}

$itRes = Login-And-LoadAnalytics -email $itEmail -password $itPassword
if ($itRes.data.role -ne "IT") { throw "IT_ROLE_MISMATCH" }
if ($itRes.data.finance.visibility -ne "restricted") { throw "IT_FINANCE_VISIBILITY_INVALID" }
if ($null -ne $itRes.data.finance.recognized_revenue_paise) { throw "IT_REVENUE_FIELD_LEAK" }
if ($null -eq $itRes.data.finance.expenses_paise) { throw "IT_EXPENSES_FIELD_MISSING" }
if ($null -eq $itRes.data.finance.daily_expense_paise) { throw "IT_DAILY_EXPENSE_FIELD_MISSING" }

$staffRes = Login-And-LoadAnalytics -email $staffEmail -password $staffPassword
if ($staffRes.data.role -ne "Staff") { throw "STAFF_ROLE_MISMATCH" }
if ($staffRes.data.finance.visibility -ne "restricted") { throw "STAFF_FINANCE_VISIBILITY_INVALID" }
if ($null -ne $staffRes.data.finance.recognized_revenue_paise) { throw "STAFF_REVENUE_FIELD_LEAK" }
if ($null -ne $staffRes.data.finance.expenses_paise) { throw "STAFF_EXPENSES_FIELD_LEAK" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  it_role = $itRes.data.role
  it_finance_visibility = $itRes.data.finance.visibility
  it_expenses_paise = $itRes.data.finance.expenses_paise
  it_daily_expense_points = @($itRes.data.finance.daily_expense_paise).Count
  it_has_recognized_revenue = ($null -ne $itRes.data.finance.recognized_revenue_paise)
  staff_role = $staffRes.data.role
  staff_finance_visibility = $staffRes.data.finance.visibility
  staff_has_expenses_field = ($null -ne $staffRes.data.finance.expenses_paise)
  staff_has_recognized_revenue = ($null -ne $staffRes.data.finance.recognized_revenue_paise)
}

$summary | ConvertTo-Json -Depth 20