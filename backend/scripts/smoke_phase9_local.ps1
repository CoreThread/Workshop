$ErrorActionPreference = "Stop"

$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE9_LOCAL_OK"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$employeeCode = "EMP-P9-$stamp"

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

$loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
Ensure-OkResponse $loginRes "LOGIN_FAILED"
if (-not $loginRes.data.access_token) { throw "LOGIN_TOKEN_MISSING" }

$headers = @{ Authorization = "Bearer $($loginRes.data.access_token)" }

$attendanceSaveRes = Invoke-RestMethod -Method Post -Uri "$base/v1/hr/attendance" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  employee_code = $employeeCode
  employee_name = "Phase9 Local Employee"
  attendance_status = "Present"
  hours_worked = 8
  notes = "phase9 local smoke"
})
Ensure-OkResponse $attendanceSaveRes "HR_ATTENDANCE_SAVE_FAILED"

$attendanceListRes = Invoke-RestMethod -Method Get -Uri "$base/v1/hr/attendance?employee_code=$employeeCode&limit=10" -Headers $headers
Ensure-OkResponse $attendanceListRes "HR_ATTENDANCE_LIST_FAILED"
if (@($attendanceListRes.data).Count -lt 1) { throw "HR_ATTENDANCE_ROW_MISSING" }

$advanceCreateRes = Invoke-RestMethod -Method Post -Uri "$base/v1/hr/advances" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  employee_code = $employeeCode
  employee_name = "Phase9 Local Employee"
  amount_paise = 500000
  settled_amount_paise = 100000
  status = "PARTIAL"
  reason = "Phase 9 local smoke advance"
})
Ensure-OkResponse $advanceCreateRes "HR_ADVANCE_CREATE_FAILED"

$advanceListRes = Invoke-RestMethod -Method Get -Uri "$base/v1/hr/advances?employee_code=$employeeCode&limit=10" -Headers $headers
Ensure-OkResponse $advanceListRes "HR_ADVANCE_LIST_FAILED"
if (@($advanceListRes.data).Count -lt 1) { throw "HR_ADVANCE_ROW_MISSING" }

$summaryRes = Invoke-RestMethod -Method Get -Uri "$base/v1/hr/summary?days=30" -Headers $headers
Ensure-OkResponse $summaryRes "HR_SUMMARY_FAILED"
if ($null -eq $summaryRes.data.attendance.by_status.Present) { throw "HR_SUMMARY_ATTENDANCE_MISSING" }
if ($null -eq $summaryRes.data.advances.open_outstanding_paise) { throw "HR_SUMMARY_ADVANCE_MISSING" }

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  employee_code = $employeeCode
  attendance_id = $attendanceSaveRes.data.id
  attendance_rows = @($attendanceListRes.data).Count
  advance_id = $advanceCreateRes.data.id
  advance_rows = @($advanceListRes.data).Count
  summary_attendance_rows = $summaryRes.data.attendance.total_rows
  summary_open_outstanding_paise = $summaryRes.data.advances.open_outstanding_paise
}

$summary | ConvertTo-Json -Depth 20
