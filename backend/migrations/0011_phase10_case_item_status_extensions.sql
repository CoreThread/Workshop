BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_item_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'case_item_status' AND e.enumlabel = 'WaitingPart'
    ) THEN
      ALTER TYPE case_item_status ADD VALUE 'WaitingPart' AFTER 'InRepair';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'case_item_status' AND e.enumlabel = 'OutForDelivery'
    ) THEN
      ALTER TYPE case_item_status ADD VALUE 'OutForDelivery' AFTER 'Ready';
    END IF;
  END IF;
END $$;

COMMIT;