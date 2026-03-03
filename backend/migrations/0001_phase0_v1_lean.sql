BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Admin', 'IT', 'Staff');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_header_status') THEN
    CREATE TYPE case_header_status AS ENUM ('Received', 'InProgress', 'PartiallyReady', 'ReadyAll', 'DeliveredAll', 'Closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_item_status') THEN
    CREATE TYPE case_item_status AS ENUM ('Received', 'Diagnosis', 'WaitingApproval', 'ApprovedForRepair', 'RejectedByCustomer', 'InRepair', 'Ready', 'Delivered', 'Cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estimate_status') THEN
    CREATE TYPE estimate_status AS ENUM ('Draft', 'Sent', 'Approved', 'Rejected', 'Expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estimate_decision') THEN
    CREATE TYPE estimate_decision AS ENUM ('Approved', 'Rejected', 'Pending');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decision_channel') THEN
    CREATE TYPE decision_channel AS ENUM ('in_person', 'call', 'whatsapp', 'sms');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
    CREATE TYPE payment_type AS ENUM ('advance', 'final', 'refund', 'adjustment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_txn_type') THEN
    CREATE TYPE stock_txn_type AS ENUM ('IN', 'OUT', 'ADJUST_IN', 'ADJUST_OUT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valuation_method') THEN
    CREATE TYPE valuation_method AS ENUM ('FIFO', 'WEIGHTED_AVERAGE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  auth_user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT,
  contact_preference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_no TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  received_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_business_date_local DATE NOT NULL,
  intake_mode TEXT NOT NULL DEFAULT 'walk_in',
  total_units_received INTEGER NOT NULL CHECK (total_units_received >= 1),
  priority TEXT NOT NULL DEFAULT 'normal',
  header_status case_header_status NOT NULL DEFAULT 'Received',
  followup_due_at_utc TIMESTAMPTZ,
  followup_notes TEXT,
  summary_labor_paise BIGINT NOT NULL DEFAULT 0 CHECK (summary_labor_paise >= 0),
  summary_spare_paise BIGINT NOT NULL DEFAULT 0 CHECK (summary_spare_paise >= 0),
  summary_invoice_total_paise BIGINT NOT NULL DEFAULT 0 CHECK (summary_invoice_total_paise >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, case_no)
);

CREATE TABLE IF NOT EXISTS case_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_id UUID NOT NULL REFERENCES cases(id),
  line_no INTEGER NOT NULL,
  item_category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_no TEXT,
  color TEXT,
  condition_in TEXT,
  reported_issue TEXT NOT NULL,
  diagnosis_notes TEXT,
  repairability TEXT,
  item_status case_item_status NOT NULL DEFAULT 'Received',
  promised_date_local DATE,
  ready_at_utc TIMESTAMPTZ,
  delivered_at_utc TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, case_id, line_no)
);

CREATE TABLE IF NOT EXISTS item_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_item_id UUID NOT NULL REFERENCES case_items(id),
  estimate_version_no INTEGER NOT NULL DEFAULT 1,
  labor_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (labor_amount_paise >= 0),
  spare_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (spare_amount_paise >= 0),
  other_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (other_amount_paise >= 0),
  discount_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount_paise >= 0),
  base_bill_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (base_bill_amount_paise >= 0),
  gst_rate_bps INTEGER NOT NULL DEFAULT 1800 CHECK (gst_rate_bps >= 0),
  gst_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (gst_amount_paise >= 0),
  invoice_total_paise BIGINT NOT NULL DEFAULT 0 CHECK (invoice_total_paise >= 0),
  rounding_mode_snapshot TEXT NOT NULL DEFAULT 'invoice_level',
  estimate_status estimate_status NOT NULL DEFAULT 'Draft',
  decision estimate_decision NOT NULL DEFAULT 'Pending',
  decision_at_utc TIMESTAMPTZ,
  decision_by_name TEXT,
  decision_by_phone TEXT,
  consent_template_version_id TEXT,
  consent_text_snapshot TEXT,
  decision_channel decision_channel,
  sent_at_utc TIMESTAMPTZ,
  decision_due_at_utc TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, case_item_id, estimate_version_no)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_id UUID NOT NULL REFERENCES cases(id),
  payment_type payment_type NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  payment_mode TEXT NOT NULL,
  allocation_json JSONB,
  note TEXT,
  paid_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sku TEXT,
  item_name TEXT NOT NULL,
  uom TEXT NOT NULL DEFAULT 'pcs',
  current_stock_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (current_stock_qty >= 0),
  reorder_level_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reorder_level_qty >= 0),
  default_unit_cost_paise BIGINT NOT NULL DEFAULT 0 CHECK (default_unit_cost_paise >= 0),
  valuation_method valuation_method NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS case_spare_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  case_item_id UUID NOT NULL REFERENCES case_items(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  qty NUMERIC(14,3) NOT NULL CHECK (qty > 0),
  uom TEXT NOT NULL,
  unit_cost_paise_snapshot BIGINT NOT NULL CHECK (unit_cost_paise_snapshot >= 0),
  line_cost_paise BIGINT NOT NULL CHECK (line_cost_paise >= 0),
  consumed_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_by UUID,
  reversal_of_consumption_id UUID,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  txn_type stock_txn_type NOT NULL,
  ref_entity TEXT NOT NULL,
  ref_id UUID,
  qty NUMERIC(14,3) NOT NULL,
  unit_cost_paise BIGINT CHECK (unit_cost_paise >= 0),
  total_cost_paise BIGINT CHECK (total_cost_paise >= 0),
  balance_after_qty NUMERIC(14,3) NOT NULL,
  txn_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone
  ON customers (tenant_id, phone);

CREATE INDEX IF NOT EXISTS idx_cases_tenant_case_no
  ON cases (tenant_id, case_no);

CREATE INDEX IF NOT EXISTS idx_cases_tenant_created_at
  ON cases (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_case_items_tenant_case_status
  ON case_items (tenant_id, case_id, item_status);

CREATE INDEX IF NOT EXISTS idx_case_spare_consumption_tenant_item_consumed_at
  ON case_spare_consumption (tenant_id, case_item_id, consumed_at_utc);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_tenant_inventory_txn_at
  ON stock_ledger (tenant_id, inventory_item_id, txn_at_utc);

INSERT INTO settings (tenant_id, key, value_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'timezone', '"Asia/Kolkata"'),
  ('00000000-0000-0000-0000-000000000001', 'business_day_close', '"23:59"'),
  ('00000000-0000-0000-0000-000000000001', 'gst_rate_bps', '1800'),
  ('00000000-0000-0000-0000-000000000001', 'valuation_method', '"WEIGHTED_AVERAGE"')
ON CONFLICT (tenant_id, key) DO NOTHING;

COMMIT;
