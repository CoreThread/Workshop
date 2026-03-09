BEGIN;

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observed_at_utc TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INT NOT NULL CHECK (status_code >= 100 AND status_code <= 599),
  response_code TEXT,
  latency_ms INT NOT NULL CHECK (latency_ms >= 0),
  is_error BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_observed
  ON api_request_logs (observed_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_path_method
  ON api_request_logs (path, method, observed_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_error
  ON api_request_logs (is_error, observed_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_latency
  ON api_request_logs (latency_ms DESC, observed_at_utc DESC);

COMMIT;
