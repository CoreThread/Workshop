# Workshop Project Handoff Status (for Private-System Continuation)

## 1) Current Snapshot
- Date: 2026-03-03
- Workspace root: `c:\Users\utkjaiswal\Desktop\Workshop\Workshop`
- GitHub repo: `https://github.com/CoreThread/Workshop`
- Cloudflare dashboard Worker created: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Work laptop constraint: Cloudflare CLI login/deploy intentionally skipped due corporate block/risk.

---

## 2) What Is Completed

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
- Added helper scripts:
  - `backend/scripts/apply_migration_0005.mjs`
  - `backend/scripts/smoke_phase4_live.ps1`

---

## 3) Files That Matter Now

### Core backend
- `backend/src/index.js`
- `backend/package.json`
- `backend/wrangler.toml`
- `backend/worker-configuration.d.ts` (generated)
- `backend/scripts/apply_migration_0005.mjs`
- `backend/scripts/smoke_phase4_live.ps1`

### Migrations
- `backend/migrations/0001_phase0_v1_lean.sql`
- `backend/migrations/0002_phase1_auth_security.sql`
- `backend/migrations/0003_phase2_case_status_history.sql`
- `backend/migrations/0004_phase3_followups_daily_close_ops.sql`
- `backend/migrations/0005_phase4_estimate_billing_lock.sql`

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

### A) Private PC: Complete Cloudflare CLI deployment
1. `cd backend`
2. `npx wrangler login`
3. Set secrets:
   - `npx wrangler secret put SUPABASE_URL`
   - `npx wrangler secret put SUPABASE_PUBLISHABLE_KEY`
   - `npx wrangler secret put SUPABASE_SECRET_KEY`
   - `npx wrangler secret put SUPABASE_DB_URL`
   - `npx wrangler secret put JWT_ISSUER`
   - `npx wrangler secret put JWT_AUDIENCE`
4. Deploy:
   - `npx wrangler deploy`
5. Verify:
   - `https://<worker-subdomain>.workers.dev/health`

### B) Phase 4 verification (already completed; rerun anytime)
1. Ensure migration `0005` is present on DB (one-time):
  - Option 1 (script): `cd backend && node scripts/apply_migration_0005.mjs`
  - Option 2 (manual): run `backend/migrations/0005_phase4_estimate_billing_lock.sql` in Supabase SQL Editor
2. Start local API:
  - `cd backend && npm run dev`
3. Run live smoke script:
  - `cd backend && ./scripts/smoke_phase4_live.ps1`
4. Expected terminal summary:
  - `smoke = PHASE4_OK`
  - `finalize_state = FINALIZED`
  - `lock_flag = true`
  - `override_count >= 1`
  - non-empty `credit_note_no`

### C) Next build milestone after Phase 4 backend validation
- Continue Phase 5 (inventory + strict case-linked spare consumption controls).

### D) Exact Runbook: Phase 4 live smoke (create -> approve -> finalize -> override -> credit-note)
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
2. Verify `.env` and `backend/.env` values are current after secret rotation.
3. Run local API: `cd backend && npm run dev`.
4. Hit `http://127.0.0.1:8788/health`.
5. Ensure migration `0005` is active (`cd backend && node scripts/apply_migration_0005.mjs`).
6. Run `cd backend && ./scripts/smoke_phase4_live.ps1` and confirm `PHASE4_OK`.
7. Continue with Phase 5 backend (inventory + case-linked consumption).

