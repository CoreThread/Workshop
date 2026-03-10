$ErrorActionPreference = "Stop"

$email = "admin@rajeshelec.local"
$password = "Admin@12345!"
$smokeTag = "PHASE6_LOCAL_OK"

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

function Get-DateLocal([datetime]$dateObj) {
  return $dateObj.ToString("yyyy-MM-dd")
}

function Add-DateLocalDays([string]$dateLocal, [int]$days) {
  $parsed = [datetime]::ParseExact($dateLocal, "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
  return Get-DateLocal ($parsed.AddDays($days))
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$category = "phase6-local-$stamp"
$billName = "Phase6 Local Bill $stamp"
$expenseAmount = 24500
$billAmount = 350000
$patchAmount = 351000
$frequencyDays = 30
$dueDate = Get-DateLocal ((Get-Date).AddDays(2))

$loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
Ensure-OkResponse $loginRes "LOGIN_FAILED"
if (-not $loginRes.data.access_token) { throw "LOGIN_TOKEN_MISSING" }

$token = $loginRes.data.access_token
$headers = @{ Authorization = "Bearer $token" }

$expenseRes = Invoke-RestMethod -Method Post -Uri "$base/v1/expenses" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  category = $category
  amount_paise = $expenseAmount
  payment_mode = "cash"
  note = "phase6 local smoke expense"
})
Ensure-OkResponse $expenseRes "EXPENSE_CREATE_FAILED"
$expenseId = $expenseRes.data.id
if (-not $expenseId) { throw "EXPENSE_ID_MISSING" }

$expenseListRes = Invoke-RestMethod -Method Get -Uri "$base/v1/expenses?category=$category&limit=20" -Headers $headers
Ensure-OkResponse $expenseListRes "EXPENSE_LIST_FAILED"
$expenseRows = @($expenseListRes.data)
$createdExpense = $expenseRows | Where-Object { $_.id -eq $expenseId } | Select-Object -First 1
if (-not $createdExpense) { throw "EXPENSE_NOT_FOUND_IN_LIST" }

$billRes = Invoke-RestMethod -Method Post -Uri "$base/v1/recurring-bills" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  bill_name = $billName
  category = "electricity"
  amount_paise = $billAmount
  due_date = $dueDate
  frequency_days = $frequencyDays
  reminder_offsets = @(7, 3, 0)
})
Ensure-OkResponse $billRes "RECURRING_BILL_CREATE_FAILED"
$billId = $billRes.data.id
if (-not $billId) { throw "RECURRING_BILL_ID_MISSING" }

$billsBeforePay = Invoke-RestMethod -Method Get -Uri "$base/v1/recurring-bills?limit=50" -Headers $headers
Ensure-OkResponse $billsBeforePay "RECURRING_BILL_LIST_BEFORE_PAY_FAILED"
$billBeforePay = @($billsBeforePay.data) | Where-Object { $_.id -eq $billId } | Select-Object -First 1
if (-not $billBeforePay) { throw "RECURRING_BILL_NOT_FOUND_BEFORE_PAY" }

$patchRes = Invoke-RestMethod -Method Patch -Uri "$base/v1/recurring-bills/$billId" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  amount_paise = $patchAmount
  category = "electricity-updated"
})
Ensure-OkResponse $patchRes "RECURRING_BILL_UPDATE_FAILED"
if ([int64]$patchRes.data.amount_paise -ne $patchAmount) { throw "RECURRING_BILL_PATCH_AMOUNT_MISMATCH" }

$payRes = Invoke-RestMethod -Method Post -Uri "$base/v1/recurring-bills/$billId/pay" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
  paid_amount_paise = $patchAmount
  payment_mode = "upi"
  note = "phase6 local smoke payment"
})
Ensure-OkResponse $payRes "RECURRING_BILL_PAY_FAILED"
$paymentId = $payRes.data.payment.id
if (-not $paymentId) { throw "BILL_PAYMENT_ID_MISSING" }

$billsAfterPay = Invoke-RestMethod -Method Get -Uri "$base/v1/recurring-bills?limit=50" -Headers $headers
Ensure-OkResponse $billsAfterPay "RECURRING_BILL_LIST_AFTER_PAY_FAILED"
$billAfterPay = @($billsAfterPay.data) | Where-Object { $_.id -eq $billId } | Select-Object -First 1
if (-not $billAfterPay) { throw "RECURRING_BILL_NOT_FOUND_AFTER_PAY" }

$dueDateBefore = [string]$billBeforePay.due_date
$dueDateAfter = [string]$billAfterPay.due_date
$expectedDueDateAfter = Add-DateLocalDays $dueDateBefore $frequencyDays
if ($dueDateAfter -ne $expectedDueDateAfter) {
  throw "DUE_DATE_ADVANCE_MISMATCH:$dueDateBefore->$dueDateAfter expected $expectedDueDateAfter"
}

$summary = [ordered]@{
  smoke = $smokeTag
  base_url = $base
  expense_id = $expenseId
  expense_category = $category
  expense_list_rows = @($expenseRows).Count
  recurring_bill_id = $billId
  due_date_before_payment = $dueDateBefore
  reminder_state_before_payment = $billBeforePay.reminder_state
  patch_amount_paise = $patchAmount
  payment_id = $paymentId
  paid_amount_paise = $payRes.data.payment.paid_amount_paise
  due_date_after_payment = $dueDateAfter
  expected_due_date_after_payment = $expectedDueDateAfter
  reminder_state_after_payment = $billAfterPay.reminder_state
  next_due_date_from_pay_api = $payRes.data.recurring_bill.due_date
}

$summary | ConvertTo-Json -Depth 10
