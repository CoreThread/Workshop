# Workshop Project Handoff Status (for Private-System Continuation)

## 1) Current Snapshot
- Date: 2026-03-08
- Workspace root: `c:\Users\utkjaiswal\Desktop\Workshop\Workshop`
- GitHub repo: `https://github.com/CoreThread/Workshop`
- Cloudflare Worker deployed and live: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Cloudflare Pages frontend deployed and live: `https://workshop-frontend.pages.dev`
- Cloudflare CLI auth working on work laptop (`wrangler whoami` verified)

---

## 2) What Is Completed

### Cloudflare Deployment (Work Laptop) — Completed (2026-03-06)
- Upgraded Wrangler to `4.71.0` in backend project.
- Authenticated Wrangler CLI successfully with OAuth.
- Uploaded required Worker secrets from local `backend/.env`:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `SUPABASE_DB_URL`
  - `JWT_ISSUER`
  - `JWT_AUDIENCE`
- Deployed Worker successfully:
  - URL: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
  - Version ID: `0098116a-0082-4623-9f0f-e2c5b4049f8f`
- Live deployment checks passed:
  - `GET /health` -> `ok: true` with all config readiness flags `true`
  - `GET /v1/system/config-status` -> all required config flags `true`
- Live authenticated write check passed:
  - `POST /v1/auth/login` -> `OK`
  - `POST /v1/cases` -> `OK`
  - Case created: `LIVECHK-20260306162350`

### Cloudflare Deployment (Phase 5 Refresh) — Completed (2026-03-08)
- Deployed latest backend to Worker using `npm run deploy`.
- Deployed Worker URL unchanged:
  - `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- New Version ID:
  - `1267b7cb-cd5b-47c8-b523-7fd1ae3a226e`

### Cloudflare Deployment (Phase 6 Route Sync) — Completed (2026-03-08)
- Re-deployed backend to fix production route/version mismatch observed during Phase 6 smoke.
- Deployed Worker URL unchanged:
  - `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- New Version ID:
  - `be1d0e59-8045-40b2-823b-6c3f55d7e66d`

### Cloudflare Pages Frontend Deployment — Completed (2026-03-08)
- Created Pages project:
  - `workshop-frontend`
- Deployed frontend static bundle from `frontend/`.
- Stable website URL:
  - `https://workshop-frontend.pages.dev`
- Preview deployment URL:
  - `https://b10f8ed7.workshop-frontend.pages.dev`
- Note: if deploy appears stuck in terminal, run non-interactive command with CI mode:
  - `cd <workspace-root>`
  - `$env:CI="1"; npx --prefix backend wrangler pages deploy frontend --project-name workshop-frontend --branch main --commit-dirty=true`

### Phase 0 (Foundation & Contracts) — Completed
- Backend scaffold created using Cloudflare Worker runtime.
- Environment templates created and aligned to modern Supabase keys:
  - `SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - legacy fallback envs retained for compatibility.
- V1 Lean DB migration created and applied:
  - `backend/migrations/0001_phase0_v1_lean.sql`
- Local health endpoint validated:
  - `/health` returns config readiness flags.

### Phase 1 (Auth/Roles/Offboarding) — Implemented + Locally Validated
- Implemented in `backend/src/index.js`:
  - `POST /v1/auth/login`
  - `GET /v1/auth/me`
  - `POST /v1/admin/users/{id}/deactivate`
- Added login abuse protection (attempt window + temporary lock).
- Added role guard (Admin-only deactivation).
- Added token revocation check path (`user_token_revocations` lookup).
- Added audit logging insert on deactivation (`audit_log`).
- Phase 1 migration created and applied:
  - `backend/migrations/0002_phase1_auth_security.sql`
- End-to-end API test passed locally:
  - Admin login OK
  - IT login OK
  - `/auth/me` role checks OK
  - Admin deactivate IT OK

### Phase 2 (Case Core with Offline Master Key) — Backend Implemented
- Implemented in `backend/src/index.js`:
  - `POST /v1/cases` (create case + customer resolution + first case item)
  - `GET /v1/cases?case_no=...&phone=...` (search)
  - `GET /v1/cases/{case_id}` (single case)
  - `PATCH /v1/cases/{case_id}` (case metadata update)
  - `GET /v1/cases/{case_id}/items` (list items)
  - `POST /v1/cases/{case_id}/items/{item_id}/status` (validated status transition)
  - `GET /v1/cases/{case_id}/status-history` (status timeline)
- Added case/item status transition guard at API layer.
- Added header status derivation from active item statuses.
- Added pagination handling on list endpoints (`limit`/`offset`).
- Added dedicated Phase 2 migration file:
  - `backend/migrations/0003_phase2_case_status_history.sql`
- Code-level validation passed (`npm run check` / `wrangler types`).
- Local Phase 2 smoke test executed successfully (2026-03-03):
  - Admin login: `OK`
  - Case create: `OK`
  - Search by `case_no`: `1` match
  - Search by phone: returns matching records for that customer phone
  - Status transition `Received -> Diagnosis`: `OK`
  - Status transition `Diagnosis -> WaitingApproval`: `OK`
  - Status history retrieval: entries present

### Phase 2 UI (Minimal) — Implemented
- Added lightweight mobile-first frontend files:
  - `frontend/index.html`
  - `frontend/styles.css`
  - `frontend/app.js`
- UI covers:
  - API base configuration
  - Login / logout
  - Create case
  - Search by case number / phone
  - Update item status
  - Load status history
- Backend updated with CORS + OPTIONS handling so browser frontend can call API routes.
- Search UX/data fix applied:
  - phone search now filters correctly at API layer (customer-id prefilter)
  - frontend now handles `customers` relation as object or array safely

### Phase 3 UI (Minimal) — Implemented
- Extended frontend cards in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added Follow-up Queue UI:
  - load queue (`queue` + optional `item_status`)
  - save follow-up note/reminder on selected case
- Added Daily Close Summary UI:
  - run daily close snapshot
  - load latest daily close snapshot

### Phase 3 (Follow-up, Daily Close, Backup Visibility) — Backend Implemented
- Added dedicated Phase 3 migration file:
  - `backend/migrations/0004_phase3_followups_daily_close_ops.sql`
- Implemented follow-up APIs in `backend/src/index.js`:
  - `GET /v1/followups` (supports `queue` and `item_status` filters)
  - `POST /v1/followups/cases/{case_id}/note` (notes, due date, reminder/contact fields)
- Implemented daily close APIs:
  - `POST /v1/daily-close` (stores snapshot: cash summary, pending deliveries/approvals, overdue bills block)
  - `GET /v1/daily-close/latest`
- Implemented admin ops status APIs for backup/archive visibility:
  - `GET /v1/admin/ops-status`
  - `POST /v1/admin/ops-status/{job_name}`
- Code-level validation passed (`npm run check` / `wrangler types`).
- Runtime validation completed locally after applying migration `0004`:
  - `GET /v1/followups?item_status=WaitingApproval` -> `OK`
  - `POST /v1/followups/cases/{case_id}/note` -> `OK`
  - `POST /v1/daily-close` -> `OK`
  - `GET /v1/daily-close/latest` -> `OK`
  - `POST /v1/admin/ops-status/backup_export` -> `OK`
  - `GET /v1/admin/ops-status` -> `OK`

### Phase 4 (Estimate, Billing, Financial Locks) — Backend Implemented
- Added dedicated Phase 4 migration file:
  - `backend/migrations/0005_phase4_estimate_billing_lock.sql`
- Implemented estimate APIs in `backend/src/index.js`:
  - `POST /v1/estimates` (paise-safe estimate create with GST calc)
  - `GET /v1/estimates/{estimate_id}`
  - `GET /v1/cases/{case_id}/estimates`
  - `POST /v1/estimates/{estimate_id}/decision` (Approved/Rejected/Pending + consent snapshot fields)
- Implemented billing + lock APIs:
  - `POST /v1/billing/estimates/{estimate_id}/finalize` (locks finalized financial fields)
  - `PATCH /v1/billing/estimates/{estimate_id}` (requires `override_reason` if finalized)
  - `POST /v1/billing/estimates/{estimate_id}/credit-note` (non-destructive correction path)
- Added audit-log writes for financial critical actions:
  - `INVOICE_FINALIZED`
  - `FINANCIAL_OVERRIDE`
  - `CREDIT_NOTE_CREATED`
- Added financial lock and reversal support fields on `item_estimates` plus new `financial_credit_notes` table.
- Code-level validation passed (`npm run check` / `wrangler types`).
- Live smoke test completed locally (create -> approve -> finalize -> override -> credit-note):
  - Result: `PHASE4_OK`
  - Case: `P4-20260303193537`
  - `case_id`: `cadcc802-a24c-45ce-b174-7f7fb258cc6d`
  - `case_item_id`: `144c9c7f-b457-44d0-b21a-3ac619531fd3`
  - `estimate_id`: `9af73e52-8227-478e-9fa5-c3ef0fc0966d`
  - Finalized state: `FINALIZED`, lock: `true`, override count: `1`
  - Credit note: `CN-2026-0303140543`
- Live smoke test completed on deployed Cloudflare Worker (non-interrupted) (2026-03-06):
  - Result: `PHASE4_LIVE_OK`
  - Worker URL: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
  - Case: `P4-LIVE-20260306162745`
  - `case_id`: `e0f62cb4-68a3-41aa-b0aa-6d9b7f7c0f91`
  - `case_item_id`: `bd88f68d-2bf5-460a-b89e-983543374938`
  - `estimate_id`: `0877f581-e6d5-440c-8cf3-aeb3af634760`
  - Finalized state: `FINALIZED`, lock: `true`, override count: `1`
  - Credit note: `CN-2026-0306105755`
- Added helper scripts:
  - `backend/scripts/apply_migration_0005.mjs`
  - `backend/scripts/smoke_phase4_live.ps1`

### Phase 4 UI (Minimal Operational Controls) — Implemented + Validated (2026-03-06)
- Extended frontend in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added minimal Phase 4 operations UI (no design bloat):
  - create estimate
  - set estimate decision with consent snapshot fields
  - finalize estimate
  - override finalized estimate (with mandatory reason)
  - create credit note
  - fetch single estimate / list case estimates
- Validation completed from UI against live Worker:
  - `GET /v1/estimates/{estimate_id}` returned `code: OK`
  - Verified fields:
    - `invoice_state: FINALIZED`
    - `is_financial_locked: true`
    - `override_count: 1`
    - `last_override_reason: UI override after finalize`
    - consent snapshot persisted (`consent_template_version_id`, `consent_text_snapshot`)

### Phase 5 (Inventory + Case-linked Consumption) — DB Foundation Added (2026-03-06)
- Added dedicated Phase 5 migration file:
  - `backend/migrations/0006_phase5_inventory_consumption_guards.sql`
- Migration adds strict DB-level controls for inventory + consumption:
  - adds mandatory `case_id` to `case_spare_consumption` and backfills from `case_items`
  - enforces case linkage integrity (`case_spare_consumption.case_id` must match linked `case_items.case_id`)
  - adds unique SKU guard (`inventory_items` tenant+sku, partial index for non-null sku)
  - adds negative-stock behavior setting defaults (`inventory_negative_stock_mode = block`)
  - adds allowed-consumption-statuses setting defaults (`ApprovedForRepair`, `InRepair`)
  - validates consumption rows against allowed case-item statuses and active tenant inventory
  - auto-applies stock deduction + immutable `stock_ledger` OUT entry on consumption insert
  - blocks mutable edits to core consumption fields (forces reversal-style correction flow)

### Phase 5 (Inventory + Case-linked Consumption) — Backend APIs Implemented (2026-03-08)
- Implemented Phase 5 backend endpoints in `backend/src/index.js`:
  - `GET /v1/inventory/items` (search + low-stock filter + pagination)
  - `POST /v1/inventory/items` (inventory master create)
  - `PATCH /v1/inventory/items/{inventory_item_id}` (inventory master update)
  - `GET /v1/inventory/ledger` (stock movement listing with filters)
  - `POST /v1/cases/{case_id}/consumption` (strict case-linked spare consumption write)
  - `GET /v1/cases/{case_id}/consumption` (case consumption listing)
- Role model applied:
  - Admin/IT for inventory create/update
  - Admin/IT/Staff for inventory read + case consumption flows
- DB-trigger aware write behavior:
  - API writes to `case_spare_consumption`; migration `0006` trigger handles stock deduction + `stock_ledger` OUT insert
  - rule-violation errors from DB trigger are mapped to conflict responses for operator clarity
- Code-level validation passed after endpoint implementation:
  - `cd backend && npm run check` -> `OK`
- Runtime smoke validation completed locally against `http://127.0.0.1:8788` (2026-03-08):
  - Result: `PHASE5_OK`
  - Case: `P5-20260308110926`
  - `case_id`: `1feb6277-99b7-4056-ada0-df1eac582da7`
  - `case_item_id`: `30363266-2953-4e36-af27-f368a18a0e52`
  - Inventory SKU: `P5SKU-110926`
  - `inventory_item_id`: `43128367-6682-43f4-b8f5-bd2e255c3e24`
  - Consumption row created: `fba865db-da85-4bb8-b740-c60732928dd8`
  - Quantity consumed: `2`
  - Stock check: `25 -> 23` (expected `23`, delta `2`)
  - Ledger check: `ledger_entry_found = true`, `txn_type = OUT`, `balance_after = 23`
  - Case consumption listing returns rows: `1`

### Phase 5 UI (Inventory + Case-linked Consumption) — Implemented + Locally Validated (2026-03-08)
- Extended frontend in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added minimal Phase 5 operations UI card:
  - inventory create (`POST /v1/inventory/items`)
  - inventory list/search (`GET /v1/inventory/items`, including `low_stock_only`)
  - case-linked consumption write (`POST /v1/cases/{case_id}/consumption`)
  - case consumption list (`GET /v1/cases/{case_id}/consumption`)
  - quick ledger verify (`GET /v1/inventory/ledger?ref_entity=case_consumption`)
- Added operator helpers in Phase 5 UI:
  - sync case context from Phase 2 status panel
  - select inventory row -> auto-fill `inventory_item_id` and `uom`
  - result panes for API payload visibility (`phase5Result`, `phase5LedgerResult`)
- Local UI-equivalent smoke validation completed against `http://127.0.0.1:8788` (2026-03-08):
  - Result: `PHASE5_UI_LIVE_OK`
  - Case: `P5UI-20260308111703`
  - `case_id`: `e838a973-4a64-4aa6-b7e6-80f8f69a3827`
  - `case_item_id`: `6c3ec35f-fbaa-4df1-a38f-2029b1db8db7`
  - Inventory SKU: `P5UI-SKU-20260308111703`
  - `inventory_item_id`: `24f26845-ae9b-4815-bed0-28e50036392f`
  - Consumption row: `0c0fd92e-29e2-4305-874e-14b3c4c6efc9`
  - Quantity consumed: `3`
  - Stock check: `30 -> 27` (expected `27`, delta `3`)
  - Ledger check: `ledger_entry_found = true`, `txn_type = OUT`, `ref_entity = case_consumption`, `balance_after = 27`
  - Case consumption listing rows: `1`

### Phase 5 UX Hardening (Low-stock + Correction Path) — Implemented (2026-03-08)
- Extended frontend in:
  - `frontend/index.html`
  - `frontend/app.js`
  - `frontend/styles.css`
- Added low-stock guard UX in Phase 5 flow:
  - live projected-stock warning based on selected inventory and consume qty
  - warning states for negative projection and low-stock threshold hit
  - safe-state indicator for normal projected stock
- Added correction/reversal operator helper path (non-destructive, API-compatible):
  - structured correction note builder linked to original `consumption_id`
  - correction type + qty + reason capture
  - ledger reference verifier for original consumption row (`ref_entity=case_consumption`, `ref_id`)
  - explicit guidance that core consumption reversal/correction still requires approved backend/admin path

### Phase 5 UI Smoke on Deployed Worker — Completed (2026-03-08)
- Target Worker: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Result: `PHASE5_UI_PROD_OK`
- Case: `P5UI-PROD-20260308112819`
- `case_id`: `4b6915ed-d4fb-44fd-88ff-a396bf1c7d2e`
- `case_item_id`: `a767fa09-949c-4d34-aad7-c76ad907e5f9`
- Item status at consume time: `ApprovedForRepair`
- Inventory SKU: `P5UI-PROD-SKU-20260308112819`
- `inventory_item_id`: `e24a40f9-3364-4525-a2e5-15b9c5621089`
- Consumption row: `88c3bdcc-b566-4467-952f-c50f33f37cc7`
- Quantity consumed: `4`
- Stock check: `40 -> 36` (expected `36`, delta `4`)
- Ledger check: `ledger_entry_found = true`, `txn_type = OUT`, `ref_entity = case_consumption`, `ref_id` matched, `balance_after = 36`
- Case consumption listing rows: `1`

### Phase 4 UI (Focused Operator Polish) — Completed (2026-03-08)
- Extended Phase 4 flow in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added speed/clarity improvements:
  - one-click `Use Latest Estimate From Case` helper
  - automatic post-action snapshot refresh after create/decision/finalize/override/credit-note
  - improved fast verification through updated chips/highlights without extra manual fetch

### Phase 6 (Expenses + Recurring Bills) — Minimal Backend Vertical Slice Implemented (2026-03-08)
- Added dedicated Phase 6 migration file:
  - `backend/migrations/0007_phase6_expenses_recurring_bills.sql`
- Migration adds Phase 6 base entities:
  - `expenses`
  - `recurring_bills`
  - `bill_payments`
- Implemented Phase 6 backend endpoints in `backend/src/index.js`:
  - `GET /v1/expenses`
  - `POST /v1/expenses`
  - `GET /v1/recurring-bills`
  - `POST /v1/recurring-bills`
  - `PATCH /v1/recurring-bills/{bill_id}`
  - `POST /v1/recurring-bills/{bill_id}/pay`
- Added recurring due-reminder state derivation in API response:
  - `overdue`, `due_today`, `due_in_3_days`, `due_in_7_days`, `upcoming`
- Payment log behavior:
  - writes immutable `bill_payments` row
  - advances `recurring_bills.due_date` by `frequency_days`

### Phase 6 UI (Minimal Operational Card) — Implemented (2026-03-08)
- Extended frontend in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added minimal Phase 6 operations UI card:
  - create expense
  - list expenses
  - create recurring bill
  - list recurring bills (with reminder state)
  - log recurring bill payment (auto due-date roll)

### Phase 5 UI Helper — One-click Smoke Payload Generator Added (2026-03-08)
- Extended frontend in:
  - `frontend/index.html`
  - `frontend/app.js`
- Added one-click helper button:
  - `Run Phase5 Smoke Payload Generator`
- Behavior:
  - generates full Phase 5 smoke payload bundle (case + status progression + inventory + consumption)
  - auto-fills key form fields for faster operator regression checks
  - renders generated payload JSON in dedicated result pane

### Phase 6 Quick UI-equivalent Smoke — Completed (2026-03-08)
- Target local API: `http://127.0.0.1:8788`
- Result: `PHASE6_UI_LIVE_OK`
- `expense_id`: `0be8d810-503c-4fc9-8af1-77a7abd89bfa`
- Expense list check (`category=tea`) rows: `1`
- `recurring_bill_id`: `c4b3e034-d5c4-41dd-81b5-b1ada3370b14`
- Due date before payment: `2026-03-10`
- Reminder state before payment: `due_in_3_days`
- `payment_id`: `87b2193d-b610-41e8-aac8-af3c1c6a8381`
- Paid amount: `350000` paise
- Due date after payment: `2026-04-09`
- Reminder state after payment: `upcoming`
- Next due date from pay API response: `2026-04-09`

### Phase 6 Regression Scripts (Local + Prod) — Added (2026-03-08)
- Added dedicated Phase 6 smoke scripts in:
  - `backend/scripts/smoke_phase6_local.ps1`
  - `backend/scripts/smoke_phase6_prod.ps1`
- Script coverage now mirrors Phase 4/5 regression discipline:
  - admin login
  - expense create + category-scoped list verify
  - recurring bill create + list verify
  - recurring bill patch verify
  - recurring bill payment verify + due-date roll by `frequency_days`
- Script output contract includes terminal summary markers:
  - local smoke: `PHASE6_LOCAL_OK`
  - prod smoke: `PHASE6_PROD_OK`

### Phase 6 Production Smoke (Scripted) — Completed (2026-03-08)
- Target Worker: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Script: `backend/scripts/smoke_phase6_prod.ps1`
- Result: `PHASE6_PROD_OK`
- `expense_id`: `f415c5c9-9914-40fd-8103-84a4fae09af7`
- Expense list check (`category=phase6-prod-20260308115410`) rows: `1`
- `recurring_bill_id`: `28c2f0cf-a9ce-43f8-8a8e-629a55e3633d`
- Due date before payment: `2026-03-10`
- Reminder state before payment: `due_in_3_days`
- `payment_id`: `d6256d0e-0dda-43dd-a1a6-d118a38831e1`
- Paid amount: `351000` paise
- Due date after payment: `2026-04-09`
- Reminder state after payment: `upcoming`
- Next due date from pay API response: `2026-04-09`

### Baseline Snapshot Locked (Step 1) — Completed (2026-03-08)
- Added baseline release reference file:
  - `docs/BASELINE_SNAPSHOT_2026-03-08.md`
- Snapshot captures deployed API + frontend URLs and Phase 5/6 production smoke baseline state.

### Phase 6 Archive Lifecycle Backend Vertical Slice (Step 2) — Implemented (2026-03-08)
- Added dedicated Phase 6 archive migration file:
  - `backend/migrations/0008_phase6_archive_lifecycle_ops.sql`
- Migration adds:
  - `db_usage_snapshots` (DB utilization monitor snapshots)
  - `archive_index` (archived case discoverability + restore metadata + checksum trace)
  - default settings: `db_quota_mb`, `db_archive_threshold_pct`, `archive_hot_retention_days`
- Implemented archive lifecycle/admin APIs in `backend/src/index.js`:
  - `GET /v1/admin/db-usage`
  - `POST /v1/admin/db-usage`
  - `POST /v1/admin/archive/trigger-check`
  - `GET /v1/admin/archive-index`
  - `POST /v1/admin/archive/cases/{case_id}`
  - `POST /v1/admin/archive/restore/{archive_id}`
- Safety controls implemented:
  - archive blocked without `backup_bundle_json`
  - archive blocked without `backup_checksum_sha256`
  - SHA-256 checksum recomputation + strict match required before case archive
  - archive flow writes audit entries (`ARCHIVE_CASE`, `RESTORE_ARCHIVED_CASE`)
  - archive uses hot-DB soft-archive (`cases` + `case_items` set `is_active=false`) after checksum verification
- Code-level validation passed after implementation:
  - `cd backend && npm run check` -> `OK`

### Phase 6 Archive Smoke (Local) — Completed (2026-03-08)
- Target local API: `http://127.0.0.1:8788`
- Script: `backend/scripts/smoke_phase6_archive_local.ps1`
- Result: `PHASE6_ARCHIVE_LOCAL_OK`
- `db_usage_snapshot_id`: `1b88365c-aa0a-4722-927f-6d5a08bca59c`
- `case_no`: `P6A-LOCAL-20260308122055`
- `case_id`: `af9e0166-1b33-42c5-b27c-33668477c136`
- `archive_id`: `a735b80d-d9ce-45fe-9f02-0999900cc7c9`
- Checksum verified: `true`
- Restore status after flow: `RESTORED`
- Archive index rows: `1`, restored rows: `1`

### Phase 6 Archive Smoke (Prod) — Completed (2026-03-08)
- Target Worker: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Script: `backend/scripts/smoke_phase6_archive_prod.ps1`
- Result: `PHASE6_ARCHIVE_PROD_OK`
- `db_usage_snapshot_id`: `945ba2cb-ce0a-4f90-b74c-c1fa1bf3cbae`
- `case_no`: `P6A-PROD-20260308122117`
- `case_id`: `5e53b76c-e067-4950-b073-aa581db92c48`
- `archive_id`: `05d68b9e-3f04-4262-82ec-ff7777b65c50`
- Checksum verified: `true`
- Restore status after flow: `RESTORED`
- Archive index rows: `1`, restored rows: `1`

---

## 3) Files That Matter Now

### Core backend
- `backend/src/index.js`
- `backend/package.json`
- `backend/wrangler.toml`
- `backend/worker-configuration.d.ts` (generated)
- `backend/scripts/apply_migration_0005.mjs`
- `backend/scripts/smoke_phase4_live.ps1`
- `backend/scripts/smoke_phase5_prod.ps1`
- `backend/scripts/smoke_phase6_local.ps1`
- `backend/scripts/smoke_phase6_prod.ps1`
- `backend/scripts/smoke_phase6_archive_local.ps1`
- `backend/scripts/smoke_phase6_archive_prod.ps1`
- `docs/BASELINE_SNAPSHOT_2026-03-08.md`

### Migrations
- `backend/migrations/0001_phase0_v1_lean.sql`
- `backend/migrations/0002_phase1_auth_security.sql`
- `backend/migrations/0003_phase2_case_status_history.sql`
- `backend/migrations/0004_phase3_followups_daily_close_ops.sql`
- `backend/migrations/0005_phase4_estimate_billing_lock.sql`
- `backend/migrations/0006_phase5_inventory_consumption_guards.sql`
- `backend/migrations/0007_phase6_expenses_recurring_bills.sql`
- `backend/migrations/0008_phase6_archive_lifecycle_ops.sql`

### Env templates
- `.env.example`
- `backend/.env.example`

### Frontend
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`

### Local envs (already present, never commit)
- `.env`
- `backend/.env`

---

## 4) Security Actions Required Before Real Use
- Rotate any secrets/passwords exposed during setup/testing:
  - Supabase secret key (`sb_secret_...`)
  - Supabase DB password used in `SUPABASE_DB_URL`
  - test user passwords in Supabase Auth
- After rotation, update both local env files:
  - `.env`
  - `backend/.env`

---

## 5) What Is Left (Ordered)

### A) Phase 4 verification (backend + minimal UI completed; rerun anytime)
1. Ensure migration `0005` is present on DB (one-time):
  - Option 1 (script): `cd backend && node scripts/apply_migration_0005.mjs`
  - Option 2 (manual): run `backend/migrations/0005_phase4_estimate_billing_lock.sql` in Supabase SQL Editor
2. Run smoke script against local API:
  - `cd backend && ./scripts/smoke_phase4_live.ps1`
3. Run equivalent smoke against deployed Worker URL (manual/invoke-rest method):
  - `https://workshop-api.jaiswal-utkarshuj.workers.dev`
4. Expected terminal summary:
  - `smoke = PHASE4_OK`
  - `finalize_state = FINALIZED`
  - `lock_flag = true`
  - `override_count >= 1`
  - non-empty `credit_note_no`

### B) Next build milestone after Phase 4 backend validation
- Phase 5 backend + minimal UI are now complete and locally smoke-validated.
- Phase 5 UX hardening is now complete on local UI.
- Phase 5 deployed smoke is now green on Worker (`PHASE5_UI_PROD_OK`).
- Phase 6 minimal Expenses + Recurring Bills UI/API vertical slice is now implemented and smoke-validated locally (`PHASE6_UI_LIVE_OK`).
- Phase 6 archive lifecycle backend vertical slice is now implemented (migration + APIs + checksum guard).
- Next milestone: apply migration `0008`, validate archive APIs with smoke checks, then add minimal frontend admin archive card.

### C) Exact Runbook: Phase 4 live smoke (create -> approve -> finalize -> override -> credit-note)
1. Start local backend API:
  - `cd backend`
  - `npm run dev`
2. Ensure Phase 4 migration is applied:
  - `node scripts/apply_migration_0005.mjs`
3. Run smoke script:
  - `./scripts/smoke_phase4_live.ps1`
4. Confirm output contains:
  - `"smoke": "PHASE4_OK"`
  - `"finalize_state": "FINALIZED"`
  - `"lock_flag": true`
  - `"override_count": 1` (or higher)
  - non-empty `"credit_note_no"`
5. If script fails at estimate creation with `ESTIMATE_CREATE_FAILED`:
  - migration `0005` is not active on DB; re-run step 2.
6. Optional manual endpoint sequence (without script):
  - `POST /v1/estimates`
  - `POST /v1/estimates/{estimate_id}/decision`
  - `POST /v1/billing/estimates/{estimate_id}/finalize`
  - `PATCH /v1/billing/estimates/{estimate_id}` with `override_reason`
  - `POST /v1/billing/estimates/{estimate_id}/credit-note`
  - `GET /v1/estimates/{estimate_id}`

---

## 6) Known Operational Notes
- Local Worker currently runs successfully (`npm run dev`) and typically binds to `http://127.0.0.1:8788`.
- Root `/` route returns 404 by design; this is expected.
- API routes are under `/v1`.
- `POST /v1/cases` requires `customer.name`, `customer.phone`, `case_no`, and `item.item_category` + `item.reported_issue`.
- IT test user may be inactive depending on prior offboarding test; reactivate in `users` table before IT login tests.
- `POST /v1/estimates` can fail with `ESTIMATE_CREATE_FAILED` if migration `0005` is not applied on current DB.
- Credit-note behavior in current Phase 4 implementation:
  - partial credit keeps `invoice_state = FINALIZED`
  - full credit (`credit_amount_paise == invoice_total_paise`) flips `invoice_state = REVERSED`

---

## 7) Quick Resume Checklist for Next Agent
1. Read this file first.
2. Verify deployed Worker health: `https://workshop-api.jaiswal-utkarshuj.workers.dev/health`.
3. Verify `.env` and `backend/.env` values are current after secret rotation.
4. Ensure migration `0005` is active (`cd backend && node scripts/apply_migration_0005.mjs`).
5. Re-run local smoke as needed: `cd backend && ./scripts/smoke_phase4_live.ps1`.
6. Apply Phase 5 migration `0006` in Supabase SQL Editor (or via existing migration process).
7. Validate Phase 5 APIs locally:
  - `POST /v1/inventory/items`
  - `POST /v1/cases/{case_id}/consumption`
  - `GET /v1/inventory/ledger?ref_entity=case_consumption`
8. Re-run Phase 5 UI smoke flow from frontend and confirm:
  - stock delta matches consumed qty
  - ledger row exists with `txn_type = OUT` and matching `ref_id`
9. Keep `backend/scripts/smoke_phase5_prod.ps1` as production regression check and re-run after major backend changes.
10. Ensure migration `0007` is active:
  - run `backend/migrations/0007_phase6_expenses_recurring_bills.sql` in Supabase SQL Editor (or standard migration process)
11. Re-run Phase 6 quick smoke and confirm:
  - expense create/list works
  - recurring bill create/list works with reminder state
  - bill payment logs and due date auto-advances by `frequency_days`
12. Run dedicated Phase 6 smoke scripts:
  - local: `cd backend && ./scripts/smoke_phase6_local.ps1`
  - prod: `cd backend && ./scripts/smoke_phase6_prod.ps1`
13. Confirm script summary markers:
  - local output contains `smoke = PHASE6_LOCAL_OK`
  - prod output contains `smoke = PHASE6_PROD_OK`
14. Apply Phase 6 archive migration `0008`:
  - run `backend/migrations/0008_phase6_archive_lifecycle_ops.sql` in Supabase SQL Editor (or standard migration process)
15. Validate new archive/admin APIs (Admin/IT):
  - `POST /v1/admin/db-usage`
  - `GET /v1/admin/db-usage`
  - `POST /v1/admin/archive/trigger-check`
  - `POST /v1/admin/archive/cases/{case_id}` (with verified backup checksum)
  - `GET /v1/admin/archive-index`
  - `POST /v1/admin/archive/restore/{archive_id}`

