$ErrorActionPreference = "Stop"

$base = "https://workshop-api.jaiswal-utkarshuj.workers.dev"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE9_PROD_OK"
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$employeeCode = "EMP-P9-PROD-$stamp"

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

$attendanceSaveRes = Invoke-RestMethod -Method Post -Uri "$base/v1/hr/attendance" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  employee_code = $employeeCode
  employee_name = "Phase9 Prod Employee"
  attendance_status = "Present"
  hours_worked = 8
  notes = "phase9 prod smoke"
})
Ensure-OkResponse $attendanceSaveRes "HR_ATTENDANCE_SAVE_FAILED"

$attendanceListRes = Invoke-RestMethod -Method Get -Uri "$base/v1/hr/attendance?employee_code=$employeeCode&limit=10" -Headers $headers
Ensure-OkResponse $attendanceListRes "HR_ATTENDANCE_LIST_FAILED"
if (@($attendanceListRes.data).Count -lt 1) { throw "HR_ATTENDANCE_ROW_MISSING" }

$advanceCreateRes = Invoke-RestMethod -Method Post -Uri "$base/v1/hr/advances" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  employee_code = $employeeCode
  employee_name = "Phase9 Prod Employee"
  amount_paise = 550000
  settled_amount_paise = 100000
  status = "PARTIAL"
  reason = "Phase 9 prod smoke advance"
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
