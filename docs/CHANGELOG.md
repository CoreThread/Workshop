# Changelog

## 2026-03-11 - Removed workspace-switcher section

### Changed
- Removed `workspace-switcher` section from `frontend/index.html` to reduce top-level UI clutter.
- Removed workspace tab behavior from `frontend/app.js` (lane tab references and tab state handling).
- Removed related CSS from `frontend/styles.css` (`.workspace-switcher`, `.workspace-tabs`, `.lane-tab`).
- Lane navigation now runs through `Quick Navigator` and quick actions only.

### Validation
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`.

## 2026-03-11 - Lane 1 guided-step UX reorganization

### Changed
- Reorganized Core Ops quick entry points in `frontend/index.html`:
  - added `Search Case` quick action button for direct case retrieval flow
  - restructured `Quick Navigator` into logical task sequence (create/search/status/follow-up/daily close/estimate/finalize/archive restore)
- Converted Lane 1 modules into guided substep flows (one substep visible at a time):
  - `Follow-up + Daily Close` split into `Queue`, `Note Update`, `Daily Close`
  - `Backup + Archive Admin` split into `DB Usage`, `Trigger Check`, `Index + Restore`
  - `Estimate + Billing Lock` split into `Estimate`, `Decision`, `Finalize`, `Override`, `Credit Note`, `Snapshot`
- Added reusable step-panel interaction logic in `frontend/app.js`:
  - generic `data-step-group` + `data-step-target` routing
  - jump-links now open the correct lane/module/substep before scroll
  - quick actions route users to correct operational substep directly

### Validation
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`.

## 2026-03-11 - Lane 1 UX declutter (focused Core Ops flow)

### Changed
- Simplified Phase 2 `Case Intake + Status` in `frontend/index.html` into step-wise internal panels:
  - `1. Create New Case`
  - `2. Search Existing Cases`
  - `3. Case Status Update`
- Added panel switching behavior in `frontend/app.js`:
  - case workflow tabs now show one panel at a time to reduce cognitive load
  - selecting a case from search auto-switches to status panel
  - successful case creation auto-switches to status panel
- Reduced Core Ops visual overload by making Lane 1 modules act as a focused accordion in `frontend/app.js`:
  - only one of `Case`, `Follow-up`, `Archive`, `Billing` stays open at a time
  - jump links and quick actions now open and focus the relevant module first
- Added supporting styles in `frontend/styles.css` for case workflow switcher tabs and single-panel display.

### Validation
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`.

## 2026-03-11 - Multi-item case intake + split create/search UI

### Changed
- Reworked `Case Intake + Status` in `frontend/index.html` into three clearer blocks:
  - `Create New Case`
  - `Search Existing Cases`
  - `Case Status Update`
- Added dynamic multi-item case intake UI in `frontend/app.js` + `frontend/styles.css`:
  - `Add Item` / `Reset Items`
  - per-item labeling (`Item A`, `Item B`, `Item C`, ...)
  - per-item category dropdown options: `fan`, `exhaust`, `motor`, `submersable`
  - per-item reported issue input
- Upgraded backend case creation route in `backend/src/index.js`:
  - `POST /v1/cases` now accepts both legacy `item` and new `items[]`
  - creates all case items in one case-create request with sequential `line_no`
  - sets `cases.total_units_received` to `items.length`
  - writes status-history rows for each created item
  - response now includes `data.case_items[]` and `data.total_units_received`
- Updated frontend create flow to submit full `items[]` payload and show created item count.

### Validation
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`.
- Backend diagnostics: no errors in `backend/src/index.js`.

## 2026-03-10 - App-style workspace lanes (non-long-page UX)

### Changed
- Converted frontend interaction from long scrolling sections to a workspace-driven lane model:
  - Added `Workspace` switcher tabs (`Core Ops`, `Inventory`, `Analytics`, `HR`) in `frontend/index.html`.
  - Updated lane rendering in `frontend/styles.css` so only one lane is visible at a time (`.lane-active`).
  - Added lane activation/navigation logic in `frontend/app.js`.
- Updated side navigator links to be lane-aware (`data-lane-target`) so module jumps first activate the correct lane.
- Quick actions now force-open primary lane before executing actions for predictable operator flow.

### Validation
- DOM ID coverage check: `ID_CHECK_OK`.
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`.

## 2026-03-10 - Workflow quick actions + role-aware UI visibility

### Changed
- Added top quick action strip in `frontend/index.html`:
  - `Create Case`
  - `Load Follow-ups`
  - `Run Daily Close`
  - `Load Archive Index`
- Added role-aware lane/module visibility in `frontend/app.js` right after login/session load:
  - `Admin`: all lanes enabled.
  - `IT`: HR lane hidden.
  - `Staff`: analytics + HR lanes hidden, and billing/archive modules hidden in primary lane.
- Added compact mobile mode in `frontend/app.js` + `frontend/styles.css`:
  - auto-collapses secondary/tertiary/final lane `details` blocks on first mobile render (`<= 820px`).

### Validation
- DOM ID coverage check: `ID_CHECK_OK`.
- Frontend diagnostics: no errors in `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`.

## 2026-03-10 - Frontend workflow layout reorganization

### Changed
- Reorganized `frontend/index.html` from a flat phase-heavy page into a workflow-first layout:
  - Sticky `Quick Navigator` with direct anchors to operational lanes.
  - `Lane 1` for primary daily flow: case, follow-up/daily close, backup/archive, estimate/billing.
  - `Lane 2` for inventory + expenses/bills operations.
  - `Lane 3` for analytics.
  - `Lane 4` for HR.
- Kept all existing form/control element IDs unchanged so existing JS API actions continue to work without endpoint contract changes.
- Refined `frontend/styles.css` for lane readability and mobile-friendly navigation behavior.

### Validation
- DOM wiring check: `ID_CHECK_OK` (all `app.js` `getElementById(...)` references present in `index.html`).
- Duplicate ID check: `DUPLICATE_ID_CHECK_OK`.

## 2026-03-10 - Phase 10 release gate artifact hardening

### Changed
- Enhanced `backend/scripts/smoke_release_prod_gate.ps1`:
  - Added optional `-ResultPath` parameter for machine-readable output persistence.
  - Added release gate metadata fields in JSON output: `gate_timestamp_utc`, `total_duration_ms`.
  - Added per-check execution metadata in `checks[]`: `script`, `marker`, `passed`, `duration_ms`.
  - Kept existing success marker contract unchanged: `RELEASE_PROD_GATE_OK`.
- Enhanced `.github/workflows/release-prod-gate.yml`:
  - CI now writes and uploads both artifacts:
    - `artifacts/release_prod_gate_output.txt`
    - `artifacts/release_prod_gate_result.json`

### Validation Markers
- `RELEASE_PROD_GATE_OK`

## 2026-03-10 - Phase 9 closure checkpoint locked

### Added
- `backend/scripts/preflight_local_smoke.ps1`:
  - Runs local preflight checks (`/health` + `/v1/auth/login`) before local wrapper execution.
  - Emits marker: `LOCAL_SMOKE_PREFLIGHT_OK`.
  - Supports overrides: `WORKSHOP_LOCAL_API_BASE`, `WORKSHOP_ADMIN_EMAIL`, `WORKSHOP_ADMIN_PASSWORD`.
- `backend/scripts/smoke_release_prod_gate.ps1`:
  - Production-only release confidence wrapper for CI/release use.
  - Runs: `smoke_phase6_archive_prod.ps1`, `smoke_phase8_prod.ps1`, `smoke_phase8_roles_prod.ps1`, `smoke_phase8_hardening_prod.ps1`, `smoke_phase9_prod.ps1`.
  - Emits marker: `RELEASE_PROD_GATE_OK`.
- `.github/workflows/release-prod-gate.yml`:
  - Mandatory release CI job for production gate execution.
- `docs/evidence/phase10/PHASE10_BURNIN_REPORT_2026-03-10.md`:
  - Formal burn-in record for 3 consecutive green prod gates.
- `docs/evidence/phase10/FINAL_ACCEPTANCE_EVIDENCE_PACK_2026-03-10.md`:
  - Final acceptance checklist and linked output artifacts.
- `docs/V1_0_RELEASE_SIGNOFF_2026-03-10.md`:
  - Frozen v1.0 sign-off with owner/date/rollback policy.

### Changed
- Updated local wrapper scripts to run preflight before local smoke:
  - `backend/scripts/smoke_phase6_archive_all.ps1`
  - `backend/scripts/smoke_phase7_all.ps1`
  - `backend/scripts/smoke_phase8_all.ps1`
  - `backend/scripts/smoke_phase8_roles_all.ps1`
  - `backend/scripts/smoke_phase8_hardening_all.ps1`
  - `backend/scripts/smoke_phase9_all.ps1`
- Updated local smoke scripts to use resilient local base URL resolution (`8788 -> 8787` + env override):
  - `backend/scripts/smoke_phase4_live.ps1`
  - `backend/scripts/smoke_phase6_local.ps1`
  - `backend/scripts/smoke_phase6_archive_local.ps1`
  - `backend/scripts/smoke_phase7_local.ps1`
  - `backend/scripts/smoke_phase8_local.ps1`
  - `backend/scripts/smoke_phase8_roles_local.ps1`
  - `backend/scripts/smoke_phase8_hardening_local.ps1`

### Validation Markers
- `PHASE8_ALL_OK`
- `PHASE8_ROLE_ALL_OK`
- `PHASE8_HARDENING_ALL_OK`
- `PHASE9_ALL_OK`
- `RELEASE_PROD_GATE_OK`

### Release Policy
- Start Phase 10 only when production-only release gate is green (`RELEASE_PROD_GATE_OK`) in release flow.
