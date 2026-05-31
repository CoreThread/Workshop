BEGIN;

CREATE TABLE IF NOT EXISTS item_estimate_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  item_estimate_id UUID NOT NULL REFERENCES item_estimates(id),
  case_item_id UUID NOT NULL REFERENCES case_items(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  part_name TEXT NOT NULL,
  qty NUMERIC(14,3) NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_cost_paise BIGINT NOT NULL CHECK (unit_cost_paise >= 0),
  line_total_paise BIGINT NOT NULL CHECK (line_total_paise >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_item_estimate_parts_tenant_estimate_created
  ON item_estimate_parts (tenant_id, item_estimate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_item_estimate_parts_tenant_case_item_created
  ON item_estimate_parts (tenant_id, case_item_id, created_at DESC);

COMMIT;