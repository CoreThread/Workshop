$ErrorActionPreference = 'Stop'

$adminEmail = "admin@rajeshelec.local"
$adminPassword = "Admin@12345!"
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$caseNo = "P4-$stamp"

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

$login = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (@{
  email = $adminEmail
  password = $adminPassword
} | ConvertTo-Json)

if (-not $login.data.access_token) {
  throw "No admin token returned"
}

$token = $login.data.access_token
$headers = @{ Authorization = "Bearer $token" }

$caseBody = @{
  case_no = $caseNo
  customer = @{
    name = "Phase4 Smoke"
    phone = "9899$($stamp.Substring($stamp.Length - 6))"
  }
  item = @{
    item_category = "fan"
    reported_issue = "smoke-test issue"
  }
} | ConvertTo-Json -Depth 8

$caseRes = Invoke-RestMethod -Method Post -Uri "$base/v1/cases" -Headers $headers -ContentType "application/json" -Body $caseBody
$caseId = $caseRes.data.case_id
$itemId = $caseRes.data.case_item_id

if (-not $caseId -or -not $itemId) {
  throw "Case create did not return case_id/case_item_id"
}

Invoke-RestMethod -Method Post -Uri "$base/v1/cases/$caseId/items/$itemId/status" -Headers $headers -ContentType "application/json" -Body (@{ to_status = "Diagnosis"; note = "phase4 smoke" } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/v1/cases/$caseId/items/$itemId/status" -Headers $headers -ContentType "application/json" -Body (@{ to_status = "WaitingApproval"; note = "phase4 smoke" } | ConvertTo-Json) | Out-Null

$estBody = @{
  case_id = $caseId
  case_item_id = $itemId
  labor_amount_paise = 12000
  spare_amount_paise = 8000
  other_amount_paise = 1000
  discount_amount_paise = 500
  gst_required = $true
  send_for_decision = $true
} | ConvertTo-Json -Depth 8

$estRes = Invoke-RestMethod -Method Post -Uri "$base/v1/estimates" -Headers $headers -ContentType "application/json" -Body $estBody
$estimateId = $estRes.data.id

if (-not $estimateId) {
  throw "Estimate create did not return estimate id"
}

$approveRes = Invoke-RestMethod -Method Post -Uri "$base/v1/estimates/$estimateId/decision" -Headers $headers -ContentType "application/json" -Body (@{
  decision = "Approved"
  decision_by_name = "Ramesh"
  decision_by_phone = "9876500011"
  decision_channel = "call"
  consent_template_version_id = "estimate-v1"
  consent_text_snapshot = "Approved on call"
} | ConvertTo-Json -Depth 8)

$finalizeRes = Invoke-RestMethod -Method Post -Uri "$base/v1/billing/estimates/$estimateId/finalize" -Headers $headers -ContentType "application/json" -Body (@{
  reason = "Phase 4 smoke finalize"
} | ConvertTo-Json)

$overrideRes = Invoke-RestMethod -Method Patch -Uri "$base/v1/billing/estimates/$estimateId" -Headers $headers -ContentType "application/json" -Body (@{
  labor_amount_paise = 13000
  spare_amount_paise = 8000
  other_amount_paise = 1000
  discount_amount_paise = 500
  gst_required = $true
  override_reason = "Customer final labor adjustment after finalize"
} | ConvertTo-Json -Depth 8)

$creditRes = Invoke-RestMethod -Method Post -Uri "$base/v1/billing/estimates/$estimateId/credit-note" -Headers $headers -ContentType "application/json" -Body (@{
  credit_amount_paise = 3000
  reason = "Minor billing correction"
  metadata_json = @{
    source = "phase4-smoke"
    case_no = $caseNo
  }
} | ConvertTo-Json -Depth 10)

$estimateGet = Invoke-RestMethod -Method Get -Uri "$base/v1/estimates/$estimateId" -Headers $headers

$summary = [ordered]@{
  smoke = "PHASE4_OK"
  case_no = $caseNo
  case_id = $caseId
  case_item_id = $itemId
  estimate_id = $estimateId
  approve_decision = $approveRes.data.decision
  finalize_state = $finalizeRes.data.invoice_state
  lock_flag = $finalizeRes.data.is_financial_locked
  override_count = $overrideRes.data.override_count
  overridden_invoice_total_paise = $overrideRes.data.invoice_total_paise
  credit_note_no = $creditRes.data.credit_note_no
  estimate_invoice_state_after_credit = $estimateGet.data.invoice_state
  last_override_reason = $estimateGet.data.last_override_reason
}

$summary | ConvertTo-Json -Depth 8
