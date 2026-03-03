BEGIN;

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS followup_reminder_state TEXT DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS followup_last_contact_at_utc TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS daily_close_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  business_date_local DATE NOT NULL,
  closed_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID NOT NULL,
  notes TEXT,
  cash_close_summary_json JSONB NOT NULL,
  pending_deliveries_json JSONB NOT NULL,
  pending_approvals_json JSONB NOT NULL,
  overdue_bills_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, business_date_local)
);

CREATE INDEX IF NOT EXISTS idx_daily_close_tenant_date
  ON daily_close_snapshots (tenant_id, business_date_local DESC);

CREATE TABLE IF NOT EXISTS ops_job_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_run_at_utc TIMESTAMPTZ,
  last_success_at_utc TIMESTAMPTZ,
  last_error_message TEXT,
  details_json JSONB,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, job_name)
);

CREATE INDEX IF NOT EXISTS idx_ops_job_status_tenant_updated
  ON ops_job_status (tenant_id, updated_at DESC);

COMMIT;
