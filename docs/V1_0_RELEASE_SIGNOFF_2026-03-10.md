# v1.0 Release Sign-Off

## Release Metadata
- Version: `v1.0`
- Date: `2026-03-10`
- Owner: `Utkarsh Jaiswal (Admin/IT Release Owner)`
- Scope: Phase 0 to Phase 10 release-readiness checkpoint

## Sign-Off Preconditions
- Production release gate in CI/release flow is mandatory (`RELEASE_PROD_GATE_OK`).
- Phase 10 burn-in complete: 3 consecutive green gate runs.
- Final acceptance evidence pack attached.

## Evidence Links
- Burn-in report: `docs/evidence/phase10/PHASE10_BURNIN_REPORT_2026-03-10.md`
- Acceptance pack: `docs/evidence/phase10/FINAL_ACCEPTANCE_EVIDENCE_PACK_2026-03-10.md`
- Burn-in run outputs:
  - `docs/evidence/phase10/burn-in/run_01.txt`
  - `docs/evidence/phase10/burn-in/run_02.txt`
  - `docs/evidence/phase10/burn-in/run_03.txt`

## Rollback Policy
1. Trigger rollback immediately if release gate fails after deployment or if critical `/v1` regressions are detected.
2. Revert to last known good backend deployment version in Cloudflare Worker deployments.
3. Re-run production gate (`./smoke_release_prod_gate.ps1`) against rollback candidate.
4. Confirm all mandatory markers:
- `PHASE6_ARCHIVE_PROD_OK`
- `PHASE8_PROD_OK`
- `PHASE8_ROLE_PROD_OK`
- `PHASE8_HARDENING_PROD_OK`
- `PHASE9_PROD_OK`
- `RELEASE_PROD_GATE_OK`
5. Update handoff docs with rollback event details and owner acknowledgement.

## Approval
- Release Owner Decision: APPROVED
- Release Gate Status at Sign-Off: `RELEASE_PROD_GATE_OK`
- Notes: Proceed to controlled release and monitoring.
