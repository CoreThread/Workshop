# Baseline Snapshot - 2026-03-08

## Deployment Baseline
- Backend API: `https://workshop-api.jaiswal-utkarshuj.workers.dev`
- Frontend Website: `https://workshop-frontend.pages.dev`
- Backend deployed version: `be1d0e59-8045-40b2-823b-6c3f55d7e66d`

## Regression Baseline
- Phase 5 prod smoke: `PHASE5_UI_PROD_OK`
- Phase 6 prod smoke: `PHASE6_PROD_OK`

## Scope Baseline
- Phase 0 to Phase 6 expenses/recurring bill vertical slice completed.
- Phase 6 archive lifecycle implementation started with:
  - migration `backend/migrations/0008_phase6_archive_lifecycle_ops.sql`
  - backend endpoints for DB usage monitor, archive trigger-check, archive index, archive case, and restore case.

## Operator Note
- Keep this file as release-level reference before proceeding to next hardening and archive smoke validation.
