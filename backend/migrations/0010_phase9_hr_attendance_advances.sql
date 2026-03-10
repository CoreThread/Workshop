BEGIN;

CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  business_date_local DATE NOT NULL,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('Present', 'HalfDay', 'Leave')),
  hours_worked NUMERIC(5,2) CHECK (hours_worked IS NULL OR hours_worked >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, employee_code, business_date_local)
);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_tenant_date
  ON employee_attendance (tenant_id, business_date_local DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_tenant_employee_date
  ON employee_attendance (tenant_id, employee_code, business_date_local DESC);

CREATE TABLE IF NOT EXISTS employee_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  advance_date_local DATE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  settled_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (settled_amount_paise >= 0),
  repayment_due_date_local DATE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'SETTLED', 'WAIVED')),
  reason TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_employee_advances_tenant_date
  ON employee_advances (tenant_id, advance_date_local DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_advances_tenant_employee
  ON employee_advances (tenant_id, employee_code, advance_date_local DESC);

COMMIT;
