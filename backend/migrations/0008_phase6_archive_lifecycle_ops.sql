BEGIN;

CREATE TABLE IF NOT EXISTS db_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  observed_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  usage_mb NUMERIC(12,3) NOT NULL CHECK (usage_mb >= 0),
  quota_mb NUMERIC(12,3) NOT NULL CHECK (quota_mb > 0),
  utilization_pct NUMERIC(6,2) NOT NULL CHECK (utilization_pct >= 0),
  threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 90 CHECK (threshold_pct > 0 AND threshold_pct <= 100),
  is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_db_usage_snapshots_tenant_observed
  ON db_usage_snapshots (tenant_id, observed_at_utc DESC);

CREATE TABLE IF NOT EXISTS archive_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_case_id UUID NOT NULL,
  case_no TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  final_status TEXT,
  archived_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  archive_location_ref TEXT,
  backup_bundle_json JSONB NOT NULL,
  backup_checksum_sha256 TEXT NOT NULL,
  computed_checksum_sha256 TEXT NOT NULL,
  checksum_verified BOOLEAN NOT NULL DEFAULT FALSE,
  restore_status TEXT NOT NULL DEFAULT 'ARCHIVED',
  restored_at_utc TIMESTAMPTZ,
  restored_by UUID,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT uq_archive_index_tenant_source_case UNIQUE (tenant_id, source_case_id)
);

CREATE INDEX IF NOT EXISTS idx_archive_index_tenant_archived_at
  ON archive_index (tenant_id, archived_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_archive_index_tenant_case_no
  ON archive_index (tenant_id, case_no);

CREATE INDEX IF NOT EXISTS idx_archive_index_tenant_phone
  ON archive_index (tenant_id, customer_phone);

CREATE INDEX IF NOT EXISTS idx_archive_index_tenant_restore_status
  ON archive_index (tenant_id, restore_status, archived_at_utc DESC);

INSERT INTO settings (tenant_id, key, value_json)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'db_quota_mb', '500'),
  ('00000000-0000-0000-0000-000000000001', 'db_archive_threshold_pct', '90'),
  ('00000000-0000-0000-0000-000000000001', 'archive_hot_retention_days', '60')
ON CONFLICT (tenant_id, key) DO NOTHING;

COMMIT;
