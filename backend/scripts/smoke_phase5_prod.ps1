$ErrorActionPreference = "Stop"

$base = "https://workshop-api.jaiswal-utkarshuj.workers.dev"
$email = "admin@rajeshelec.local"
$password = "Admin@12345!"

function To-JsonBody([object]$obj) {
	return ($obj | ConvertTo-Json -Depth 20 -Compress)
}

$loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $email; password = $password })
if ($loginRes.code -ne "OK" -or -not $loginRes.data.access_token) {
	throw "LOGIN_FAILED"
}

$token = $loginRes.data.access_token
$headers = @{ Authorization = "Bearer $token" }

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$caseNo = "P5UI-PROD-$stamp"
$phone = "97$(Get-Random -Minimum 100000000 -Maximum 999999999)"

$caseRes = Invoke-RestMethod -Method Post -Uri "$base/v1/cases" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
	case_no = $caseNo
	customer = @{ name = "Phase5 UI Prod Smoke"; phone = $phone }
	item = @{ item_category = "fan"; reported_issue = "Prod smoke inventory flow" }
})

if ($caseRes.code -ne "OK") {
	throw "CASE_CREATE_FAILED"
}

$caseId = $caseRes.data.case_id
$itemId = $caseRes.data.case_item_id

foreach ($status in @("Diagnosis", "WaitingApproval", "ApprovedForRepair")) {
	try {
		$null = Invoke-RestMethod -Method Post -Uri "$base/v1/cases/$caseId/items/$itemId/status" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
			to_status = $status
			note = "prod smoke -> $status"
		})
	} catch {
		# Ignore if already at/after target due to retry behavior.
	}
}

$itemRows = Invoke-RestMethod -Method Get -Uri "$base/v1/cases/$caseId/items" -Headers $headers
$currentItem = $itemRows.data | Where-Object { $_.id -eq $itemId } | Select-Object -First 1
$currentStatus = $currentItem.item_status
if ($currentStatus -notin @("ApprovedForRepair", "InRepair")) {
	throw "ITEM_NOT_CONSUMABLE:$currentStatus"
}

$sku = "P5UI-PROD-SKU-$stamp"
$invRes = Invoke-RestMethod -Method Post -Uri "$base/v1/inventory/items" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
	sku = $sku
	item_name = "Fan Capacitor 2.5uF Prod Smoke"
	uom = "pcs"
	current_stock_qty = 40
	reorder_level_qty = 8
	default_unit_cost_paise = 1900
	valuation_method = "WEIGHTED_AVERAGE"
})

if ($invRes.code -ne "OK") {
	throw "INVENTORY_CREATE_FAILED"
}

$inventoryItemId = $invRes.data.id
$stockBefore = [double]$invRes.data.current_stock_qty
$consumeQty = 4

$consumeRes = Invoke-RestMethod -Method Post -Uri "$base/v1/cases/$caseId/consumption" -Headers $headers -ContentType "application/json" -Body (To-JsonBody @{
	case_item_id = $itemId
	inventory_item_id = $inventoryItemId
	qty = $consumeQty
	uom = "pcs"
	unit_cost_paise_snapshot = 1900
	notes = "phase5 ui prod smoke consumption"
})

if ($consumeRes.code -ne "OK") {
	throw "CONSUMPTION_CREATE_FAILED"
}

$consumptionId = $consumeRes.data.consumption.id
$stockAfter = [double]$consumeRes.data.inventory_after.current_stock_qty

$caseCons = Invoke-RestMethod -Method Get -Uri "$base/v1/cases/$caseId/consumption?case_item_id=$itemId&limit=10" -Headers $headers
$caseConsumptionRows = @($caseCons.data).Count

$ledgerRes = Invoke-RestMethod -Method Get -Uri "$base/v1/inventory/ledger?ref_entity=case_consumption&ref_id=$consumptionId&inventory_item_id=$inventoryItemId&limit=10" -Headers $headers
$ledgerRows = @($ledgerRes.data).Count
$ledgerEntry = $null
if ($ledgerRows -gt 0) { $ledgerEntry = $ledgerRes.data[0] }

$summary = [ordered]@{
	smoke = "PHASE5_UI_PROD_OK"
	worker_url = $base
	case_no = $caseNo
	case_id = $caseId
	case_item_id = $itemId
	case_item_status = $currentStatus
	inventory_sku = $sku
	inventory_item_id = $inventoryItemId
	consumption_id = $consumptionId
	consumed_qty = $consumeQty
	stock_before = $stockBefore
	stock_after = $stockAfter
	expected_stock_after = ($stockBefore - $consumeQty)
	stock_delta = ($stockBefore - $stockAfter)
	case_consumption_rows = $caseConsumptionRows
	ledger_rows = $ledgerRows
	ledger_entry_found = ($ledgerRows -gt 0)
	ledger_txn_type = $(if ($ledgerEntry) { $ledgerEntry.txn_type } else { $null })
	ledger_ref_entity = $(if ($ledgerEntry) { $ledgerEntry.ref_entity } else { $null })
	ledger_ref_id = $(if ($ledgerEntry) { $ledgerEntry.ref_id } else { $null })
	ledger_balance_after = $(if ($ledgerEntry) { $ledgerEntry.balance_after_qty } else { $null })
}

$summary | ConvertTo-Json -Depth 10
