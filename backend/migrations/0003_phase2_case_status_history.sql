BEGIN;

CREATE TABLE IF NOT EXISTS case_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_id UUID NOT NULL REFERENCES cases(id),
  case_item_id UUID REFERENCES case_items(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_case_status_history_tenant_case_changed
  ON case_status_history (tenant_id, case_id, changed_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_case_status_history_tenant_item_changed
  ON case_status_history (tenant_id, case_item_id, changed_at_utc DESC);

COMMIT;
