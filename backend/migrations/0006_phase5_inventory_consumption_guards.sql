BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_txn_type') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'stock_txn_type' AND e.enumlabel = 'RESERVE'
    ) THEN
      ALTER TYPE stock_txn_type ADD VALUE 'RESERVE';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'stock_txn_type' AND e.enumlabel = 'RELEASE'
    ) THEN
      ALTER TYPE stock_txn_type ADD VALUE 'RELEASE';
    END IF;
  END IF;
END $$;

ALTER TABLE case_spare_consumption
  ADD COLUMN IF NOT EXISTS case_id UUID;

UPDATE case_spare_consumption c
SET case_id = ci.case_id
FROM case_items ci
WHERE c.case_id IS NULL
  AND ci.id = c.case_item_id;

ALTER TABLE case_spare_consumption
  ALTER COLUMN case_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_case_spare_consumption_case_id'
  ) THEN
    ALTER TABLE case_spare_consumption
      ADD CONSTRAINT fk_case_spare_consumption_case_id
      FOREIGN KEY (case_id)
      REFERENCES cases(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_case_spare_consumption_tenant_case_consumed_at
  ON case_spare_consumption (tenant_id, case_id, consumed_at_utc DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_tenant_sku
  ON inventory_items (tenant_id, sku)
  WHERE sku IS NOT NULL;

INSERT INTO settings (tenant_id, key, value_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'inventory_negative_stock_mode', '"block"'),
  ('00000000-0000-0000-0000-000000000001', 'inventory_consumption_allowed_statuses', '["ApprovedForRepair", "InRepair"]')
ON CONFLICT (tenant_id, key) DO NOTHING;

CREATE OR REPLACE FUNCTION fn_ws_validate_case_spare_consumption()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_case_item case_items%ROWTYPE;
  v_inventory inventory_items%ROWTYPE;
BEGIN
  SELECT *
  INTO v_case_item
  FROM case_items
  WHERE id = NEW.case_item_id
    AND tenant_id = NEW.tenant_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid case_item_id % for tenant %', NEW.case_item_id, NEW.tenant_id;
  END IF;

  IF NEW.case_id IS NULL THEN
    NEW.case_id := v_case_item.case_id;
  END IF;

  IF NEW.case_id <> v_case_item.case_id THEN
    RAISE EXCEPTION 'case_id % does not match case_item_id %', NEW.case_id, NEW.case_item_id;
  END IF;

  IF v_case_item.item_status NOT IN ('ApprovedForRepair', 'InRepair') THEN
    RAISE EXCEPTION 'Consumption is not allowed for item status %', v_case_item.item_status;
  END IF;

  SELECT *
  INTO v_inventory
  FROM inventory_items
  WHERE id = NEW.inventory_item_id
    AND tenant_id = NEW.tenant_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid inventory_item_id % for tenant %', NEW.inventory_item_id, NEW.tenant_id;
  END IF;

  IF COALESCE(NEW.uom, '') = '' THEN
    NEW.uom := v_inventory.uom;
  END IF;

  IF NEW.unit_cost_paise_snapshot IS NULL OR NEW.unit_cost_paise_snapshot < 0 THEN
    NEW.unit_cost_paise_snapshot := v_inventory.default_unit_cost_paise;
  END IF;

  IF NEW.line_cost_paise IS NULL OR NEW.line_cost_paise = 0 THEN
    NEW.line_cost_paise := ROUND(NEW.qty * NEW.unit_cost_paise_snapshot)::BIGINT;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_ws_apply_consumption_stock_effect()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_inventory inventory_items%ROWTYPE;
  v_next_stock NUMERIC(14,3);
  v_mode TEXT;
BEGIN
  SELECT *
  INTO v_inventory
  FROM inventory_items
  WHERE id = NEW.inventory_item_id
    AND tenant_id = NEW.tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory row not found for stock apply %', NEW.inventory_item_id;
  END IF;

  SELECT TRIM(BOTH '"' FROM value_json::TEXT)
  INTO v_mode
  FROM settings
  WHERE tenant_id = NEW.tenant_id
    AND key = 'inventory_negative_stock_mode'
    AND is_active = TRUE
  ORDER BY updated_at DESC
  LIMIT 1;

  v_mode := COALESCE(v_mode, 'block');
  v_next_stock := v_inventory.current_stock_qty - NEW.qty;

  IF v_next_stock < 0 AND LOWER(v_mode) <> 'allow' THEN
    RAISE EXCEPTION 'Negative stock blocked for inventory_item_id % (available %, requested %)',
      NEW.inventory_item_id,
      v_inventory.current_stock_qty,
      NEW.qty;
  END IF;

  UPDATE inventory_items
  SET current_stock_qty = v_next_stock,
      updated_at = now(),
      updated_by = COALESCE(NEW.created_by, NEW.consumed_by, updated_by)
  WHERE id = v_inventory.id;

  INSERT INTO stock_ledger (
    tenant_id,
    inventory_item_id,
    txn_type,
    ref_entity,
    ref_id,
    qty,
    unit_cost_paise,
    total_cost_paise,
    balance_after_qty,
    txn_at_utc,
    created_at,
    created_by
  ) VALUES (
    NEW.tenant_id,
    NEW.inventory_item_id,
    'OUT',
    'case_consumption',
    NEW.id,
    NEW.qty,
    NEW.unit_cost_paise_snapshot,
    NEW.line_cost_paise,
    v_next_stock,
    NEW.consumed_at_utc,
    now(),
    COALESCE(NEW.created_by, NEW.consumed_by)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_ws_guard_case_spare_consumption_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.case_id <> NEW.case_id
    OR OLD.case_item_id <> NEW.case_item_id
    OR OLD.inventory_item_id <> NEW.inventory_item_id
    OR OLD.qty <> NEW.qty
    OR OLD.unit_cost_paise_snapshot <> NEW.unit_cost_paise_snapshot
    OR OLD.line_cost_paise <> NEW.line_cost_paise
  THEN
    RAISE EXCEPTION 'Core consumption fields are immutable. Use reversal flow instead.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ws_validate_case_spare_consumption ON case_spare_consumption;
CREATE TRIGGER trg_ws_validate_case_spare_consumption
BEFORE INSERT OR UPDATE ON case_spare_consumption
FOR EACH ROW
EXECUTE FUNCTION fn_ws_validate_case_spare_consumption();

DROP TRIGGER IF EXISTS trg_ws_apply_consumption_stock_effect ON case_spare_consumption;
CREATE TRIGGER trg_ws_apply_consumption_stock_effect
AFTER INSERT ON case_spare_consumption
FOR EACH ROW
EXECUTE FUNCTION fn_ws_apply_consumption_stock_effect();

DROP TRIGGER IF EXISTS trg_ws_guard_case_spare_consumption_update ON case_spare_consumption;
CREATE TRIGGER trg_ws_guard_case_spare_consumption_update
BEFORE UPDATE ON case_spare_consumption
FOR EACH ROW
EXECUTE FUNCTION fn_ws_guard_case_spare_consumption_update();

COMMIT;
