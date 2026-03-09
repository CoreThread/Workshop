# Backend Smoke Script Quick Runbook

## Archive smoke one-command helper
- Wrapper script (runs local then prod):
  - `cd backend/scripts`
  - `./smoke_phase6_archive_all.ps1`

## Archive smoke direct scripts
- Local:
  - `cd backend`
  - `./scripts/smoke_phase6_archive_local.ps1`
- Prod:
  - `cd backend`
  - `./scripts/smoke_phase6_archive_prod.ps1`

## Expected result markers
- Local success marker: `PHASE6_ARCHIVE_LOCAL_OK`
- Prod success marker: `PHASE6_ARCHIVE_PROD_OK`
- Wrapper success marker: `PHASE6_ARCHIVE_ALL_OK`

## Phase 7 index verification
- Verify required search/observability indexes:
  - `cd backend`
  - `node ./scripts/verify_phase7_indexes.mjs`
- Expected success marker:
  - `PHASE7_INDEXES_OK`

## Phase 7 smoke scripts
- Local:
  - `cd backend`
  - `./scripts/smoke_phase7_local.ps1`
- Prod:
  - `cd backend`
  - `./scripts/smoke_phase7_prod.ps1`
- Wrapper (local then prod):
  - `cd backend/scripts`
  - `./smoke_phase7_all.ps1`

## Expected Phase 7 markers
- Local success marker: `PHASE7_LOCAL_OK`
- Prod success marker: `PHASE7_PROD_OK`
- Wrapper success marker: `PHASE7_ALL_OK`

## Phase 8 smoke scripts
- Local:
  - `cd backend`
  - `./scripts/smoke_phase8_local.ps1`
- Prod:
  - `cd backend`
  - `./scripts/smoke_phase8_prod.ps1`
- Wrapper (local then prod):
  - `cd backend/scripts`
  - `./smoke_phase8_all.ps1`

## Expected Phase 8 markers
- Local success marker: `PHASE8_LOCAL_OK`
- Prod success marker: `PHASE8_PROD_OK`
- Wrapper success marker: `PHASE8_ALL_OK`

## Phase 8 role-validation smoke scripts (IT + Staff)
- Local:
  - `cd backend`
  - `./scripts/smoke_phase8_roles_local.ps1`
- Prod:
  - `cd backend`
  - `./scripts/smoke_phase8_roles_prod.ps1`
- Wrapper (local then prod):
  - `cd backend/scripts`
  - `./smoke_phase8_roles_all.ps1`

### Optional env vars for role script credentials
- `WORKSHOP_IT_EMAIL`
- `WORKSHOP_IT_PASSWORD`
- `WORKSHOP_STAFF_EMAIL`
- `WORKSHOP_STAFF_PASSWORD`

### Role test-user helper (if IT/Staff auth users are missing or inactive)
- `cd backend`
- `node ./scripts/ensure_phase8_role_test_users.mjs`
- Expected setup marker: `PHASE8_ROLE_TEST_USERS_READY`

## Expected Phase 8 role markers
- Local success marker: `PHASE8_ROLE_LOCAL_OK`
- Prod success marker: `PHASE8_ROLE_PROD_OK`
- Wrapper success marker: `PHASE8_ROLE_ALL_OK`

## Phase 8 hardening smoke scripts
- Local:
  - `cd backend`
  - `./scripts/smoke_phase8_hardening_local.ps1`
- Prod:
  - `cd backend`
  - `./scripts/smoke_phase8_hardening_prod.ps1`
- Wrapper (local then prod):
  - `cd backend/scripts`
  - `./smoke_phase8_hardening_all.ps1`

## Expected Phase 8 hardening markers
- Local success marker: `PHASE8_HARDENING_LOCAL_OK`
- Prod success marker: `PHASE8_HARDENING_PROD_OK`
- Wrapper success marker: `PHASE8_HARDENING_ALL_OK`
