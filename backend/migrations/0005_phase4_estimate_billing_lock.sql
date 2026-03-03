BEGIN;

ALTER TABLE item_estimates
  ADD COLUMN IF NOT EXISTS invoice_state TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS is_financial_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS finalized_at_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_by UUID,
  ADD COLUMN IF NOT EXISTS finalized_reason TEXT,
  ADD COLUMN IF NOT EXISTS override_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_override_at_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_override_by UUID,
  ADD COLUMN IF NOT EXISTS last_override_reason TEXT;

CREATE TABLE IF NOT EXISTS financial_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  item_estimate_id UUID NOT NULL REFERENCES item_estimates(id),
  credit_note_no TEXT NOT NULL,
  credit_amount_paise BIGINT NOT NULL CHECK (credit_amount_paise >= 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted',
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (tenant_id, credit_note_no)
);

CREATE INDEX IF NOT EXISTS idx_financial_credit_notes_tenant_estimate
  ON financial_credit_notes (tenant_id, item_estimate_id, created_at DESC);

INSERT INTO settings (tenant_id, key, value_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'gst_rounding_mode', '"invoice_level"')
ON CONFLICT (tenant_id, key) DO NOTHING;

COMMIT;