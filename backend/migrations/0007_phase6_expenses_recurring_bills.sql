BEGIN;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  expense_date_local DATE NOT NULL,
  category TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  payment_mode TEXT,
  note TEXT,
  receipt_ref TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date
  ON expenses (tenant_id, expense_date_local DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_category_date
  ON expenses (tenant_id, category, expense_date_local DESC);

CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  bill_name TEXT NOT NULL,
  category TEXT,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  due_date DATE NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 30 CHECK (frequency_days >= 1),
  reminder_offsets_json JSONB NOT NULL DEFAULT '[7,3,0]'::jsonb,
  last_paid_at_utc TIMESTAMPTZ,
  last_paid_amount_paise BIGINT CHECK (last_paid_amount_paise >= 0),
  last_payment_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_recurring_bills_tenant_due_date
  ON recurring_bills (tenant_id, due_date ASC);

CREATE INDEX IF NOT EXISTS idx_recurring_bills_tenant_active_due
  ON recurring_bills (tenant_id, is_active, due_date ASC);

CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  recurring_bill_id UUID NOT NULL REFERENCES recurring_bills(id),
  paid_amount_paise BIGINT NOT NULL CHECK (paid_amount_paise >= 0),
  paid_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_mode TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bill_payments_tenant_bill_paid
  ON bill_payments (tenant_id, recurring_bill_id, paid_at_utc DESC);

INSERT INTO settings (tenant_id, key, value_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'bill_reminder_offsets_days', '[7,3,0]')
ON CONFLICT (tenant_id, key) DO NOTHING;

COMMIT;
