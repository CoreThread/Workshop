$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:8788"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE8_LOCAL_OK"

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

$analyticsRes = Invoke-RestMethod -Method Get -Uri "$base/v1/analytics/overview?days=30&query_timeout_ms=9000" -Headers $headers
Ensure-OkResponse $analyticsRes "ANALYTICS_OVERVIEW_FAILED"

if ($null -eq $analyticsRes.data.case_followup_kpis.received_cases) { throw "ANALYTICS_CASE_KPI_MISSING" }
if ($null -eq $analyticsRes.data.inventory_trend.consumption_events) { throw "ANALYTICS_INVENTORY_KPI_MISSING" }
if ($null -eq $analyticsRes.data.inventory_trend.daily_consumption) { throw "ANALYTICS_INVENTORY_DAILY_MISSING" }
if ($analyticsRes.data.finance.visibility -ne "full") { throw "ANALYTICS_ADMIN_FINANCE_VISIBILITY_INVALID" }
if ($null -eq $analyticsRes.data.finance.recognized_revenue_paise) { throw "ANALYTICS_ADMIN_REVENUE_MISSING" }
if ($null -eq $analyticsRes.data.finance.revenue_daily_paise) { throw "ANALYTICS_ADMIN_REVENUE_DAILY_MISSING" }
if ($null -eq $analyticsRes.data.finance.expense_categories_top) { throw "ANALYTICS_ADMIN_EXPENSE_TOP_MISSING" }
if ($null -eq $analyticsRes.data.expense_trend.daily_expense_paise) { throw "ANALYTICS_EXPENSE_DAILY_MISSING" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  role = $analyticsRes.data.role
  window_days = $analyticsRes.data.window_days
  received_cases = $analyticsRes.data.case_followup_kpis.received_cases
  pending_approvals = $analyticsRes.data.case_followup_kpis.pending_approvals
  pending_pickups = $analyticsRes.data.case_followup_kpis.pending_pickups
  consumption_events = $analyticsRes.data.inventory_trend.consumption_events
  inventory_daily_points = @($analyticsRes.data.inventory_trend.daily_consumption).Count
  expenses_total_paise = $analyticsRes.data.expense_trend.expenses_total_paise
  expense_daily_points = @($analyticsRes.data.expense_trend.daily_expense_paise).Count
  finance_visibility = $analyticsRes.data.finance.visibility
  revenue_daily_points = @($analyticsRes.data.finance.revenue_daily_paise).Count
}

$summary | ConvertTo-Json -Depth 20
