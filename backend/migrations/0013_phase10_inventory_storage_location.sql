BEGIN;

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS storage_location TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_storage_location
  ON inventory_items (tenant_id, storage_location)
  WHERE storage_location IS NOT NULL;

COMMIT;