# Workshop Master Document

## Document Policy
- This is the only workspace-owned markdown document to maintain going forward.
- Keep this file current for requirements, implementation state, deployment status, runbook notes, release references, and change history.
- Keep raw evidence outputs under `docs/evidence/phase10/` as immutable supporting artifacts.
- Do not create new standalone project markdown files unless explicitly required.

## Product Baseline

### Goal
- Build a lightweight workshop operations website for fan/pump repair workflows.
- Support old systems, mobile and desktop use, and code-only implementation.

### Core Business Outcomes
- Reliable case tracking.
- Inventory linked to case spare consumption.
- Follow-up control for pending approvals and pickups.
- Expense and recurring bill visibility.
- Accurate financial visibility for Admin only.

### Roles
- `Admin`: full access across operations, analytics, finance, HR, settings, backup, and user management.
- `IT`: full technical and operational access except profit/margin and HR-sensitive visibility.
- `Staff`: case operations and case-linked spare consumption only; no advanced finance, analytics, archive admin, or HR visibility.

### Hard Constraints
- Keep `/v1` API changes additive and backward-compatible.
- Money fields remain paise integers only.
- Role safety for `Admin` / `IT` / `Staff` must remain intact.
- No destructive data edits for financial or audit-sensitive flows.
- Do not alter CORS, auth, or session behavior unless explicitly requested.
- Production-safe increments only.

### UX Priorities
- Primary: `Case + Follow-up + Backup visibility`.
- Secondary: `Inventory operations`.
- Tertiary: `Analytics dashboards`.
- Final: `HR`.
- Mobile-critical actions should avoid horizontal scrolling and stay within low click count.

## Live Environment
- Workspace root: `c:\Users\utkjaiswal\Desktop\Workshop\Workshop`
- GitHub repo: `https://github.com/CoreThread/Workshop`
- Backend Worker: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Frontend Pages stable: `https://workshop-frontend.pages.dev`
- Latest frontend preview verified in this session: `https://00b65493.workshop-frontend.pages.dev`
- Cloudflare Pages deploy command:
  - `npx --prefix backend wrangler pages deploy frontend --project-name workshop-frontend --branch main --commit-dirty=true`

## Implementation Status

### Phase Coverage
- Phase 0 Foundation and contracts: complete.
- Phase 1 Auth, roles, offboarding, abuse protection: complete.
- Phase 2 Case core, search, item status, and status history: complete.
- Phase 3 Follow-up, daily close, and backup visibility: complete.
- Phase 4 Estimate, billing locks, override, and credit-note flow: complete.
- Phase 5 Inventory and case-linked consumption: complete.
- Phase 6 Expenses, recurring bills, and archive lifecycle: complete.
- Phase 7 Observability and performance hardening: complete.
- Phase 8 Analytics with role-aware visibility: complete.
- Phase 9 HR attendance and advances: complete with Admin-only access.
- Phase 10 release engineering and deterministic prod gate: complete.

### Current Frontend Direction
- Quick Actions is the primary navigation surface.
- Lane 1 uses focused single-module visibility to reduce clutter.
- Search is separate from create-step semantics.
- Status opens as a standalone workspace when reached directly.
- Search results and follow-up results now use simplified scan-first cards.
- Validation and success messages use stronger highlighted feedback states.
- Lightweight inline button loaders are enabled for core async Lane 1 actions.

## Operational Runbook

### Local Preflight
- Script: `backend/scripts/preflight_local_smoke.ps1`
- Success marker: `LOCAL_SMOKE_PREFLIGHT_OK`
- Optional env overrides:
  - `WORKSHOP_LOCAL_API_BASE`
  - `WORKSHOP_ADMIN_EMAIL`
  - `WORKSHOP_ADMIN_PASSWORD`

### Production Release Gate
- Script: `backend/scripts/smoke_release_prod_gate.ps1`
- Success marker: `RELEASE_PROD_GATE_OK`
- Optional JSON artifact output:
  - `./smoke_release_prod_gate.ps1 -ResultPath ../../artifacts/release_prod_gate_result.json`

### Important Smoke Markers
- Phase 6 archive prod: `PHASE6_ARCHIVE_PROD_OK`
- Phase 7 local/prod/all: `PHASE7_LOCAL_OK`, `PHASE7_PROD_OK`, `PHASE7_ALL_OK`
- Phase 7 index verification: `PHASE7_INDEXES_OK`
- Phase 8 prod/all: `PHASE8_PROD_OK`, `PHASE8_ALL_OK`
- Phase 8 roles prod/all: `PHASE8_ROLE_PROD_OK`, `PHASE8_ROLE_ALL_OK`
- Phase 8 hardening prod/all: `PHASE8_HARDENING_PROD_OK`, `PHASE8_HARDENING_ALL_OK`
- Phase 9 prod/all: `PHASE9_PROD_OK`, `PHASE9_ALL_OK`

## Release and Evidence Record

### v1.0 Release State
- Version: `v1.0`
- Release owner: `Utkarsh Jaiswal`
- Release sign-off status: `APPROVED`
- Mandatory release gate state at sign-off: `RELEASE_PROD_GATE_OK`

### Burn-In Summary
- Production release gate passed 3 consecutive runs on `2026-03-10`.
- Burn-in verdict: `PASS`
- Raw evidence files:
  - `docs/evidence/phase10/burn-in/run_01.txt`
  - `docs/evidence/phase10/burn-in/run_02.txt`
  - `docs/evidence/phase10/burn-in/run_03.txt`

### Final Acceptance Summary
- 20-case Phase 4 financial lock workflow: `PASS`
- Archive lifecycle verification: `PASS`
- Analytics baseline, role safety, and hardening: `PASS`
- HR production validation: `PASS`
- Release gate inclusion: `PASS`
- Raw evidence files:
  - `docs/evidence/phase10/final-acceptance/phase4_20case_runs.txt`
  - `docs/evidence/phase10/final-acceptance/phase6_archive_prod.txt`
  - `docs/evidence/phase10/final-acceptance/phase8_prod.txt`
  - `docs/evidence/phase10/final-acceptance/phase8_roles_prod.txt`
  - `docs/evidence/phase10/final-acceptance/phase8_hardening_prod.txt`
  - `docs/evidence/phase10/final-acceptance/phase9_prod.txt`

### Rollback Rule
1. Trigger rollback immediately for critical `/v1` regression or failed post-release gate.
2. Revert backend to last known good Cloudflare Worker deployment.
3. Re-run the production release gate.
4. Confirm all required prod markers before accepting rollback.
5. Append rollback details to the change history section below.

## Change History

### 2026-03-12
- Replaced fragmented navigation with Quick Actions as the primary movement layer.
- Simplified Lane 1 so only one primary module is visible at a time.
- Removed search from step semantics and made status a standalone workspace when opened directly.
- Replaced raw timeline rendering with readable timeline cards.
- Added stronger validation and success feedback styling.
- Added lightweight inline button loaders for key async actions.
- Simplified search result cards for faster scanning.
- Polished follow-up queue cards and added direct case selection from queue results.
- Fixed malformed header/login shell and simplified the top bar to `Rajesh Electricals` plus role greeting and logout.
- Tightened Quick Actions labels for mobile scanning.

### 2026-03-11
- Reworked Lane 1 workflow structure across create, search, status, follow-up, archive, and billing flows.
- Reduced UI clutter by replacing older workspace switching patterns.
- Introduced guided step panels and focused operational navigation.

### 2026-03-10
- Closed Phase 10 release engineering baseline.
- Locked deterministic prod gate evidence and v1.0 sign-off.
- Finalized burn-in and acceptance evidence storage under `docs/evidence/phase10/`.

## Maintenance Notes
- Update this file after every meaningful product, deployment, or release change.
- Keep evidence as raw `.txt` outputs in place; reference them here instead of creating new markdown reports.
- If a future audit needs more detail, append sections here rather than creating parallel status files.