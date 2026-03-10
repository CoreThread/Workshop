$ErrorActionPreference = "Stop"

$adminEmail = if ($env:WORKSHOP_ADMIN_EMAIL) { $env:WORKSHOP_ADMIN_EMAIL } else { "admin@rajeshelec.local" }
$adminPassword = if ($env:WORKSHOP_ADMIN_PASSWORD) { $env:WORKSHOP_ADMIN_PASSWORD } else { "Admin@12345!" }

function Resolve-BaseUrl() {
  if ($env:WORKSHOP_LOCAL_API_BASE) {
    return $env:WORKSHOP_LOCAL_API_BASE.TrimEnd("/")
  }

  $candidates = @(
    "http://127.0.0.1:8788",
    "http://127.0.0.1:8787"
  )

  foreach ($candidate in $candidates) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri "$candidate/health" -TimeoutSec 3
      if ($health.ok -eq $true) {
        return $candidate
      }
    } catch {
      # try next candidate
    }
  }

  throw "LOCAL_PREFLIGHT_FAILED: Local API not reachable on 8788/8787. Start backend with 'cd backend; npm run dev' or set WORKSHOP_LOCAL_API_BASE."
}

function Ensure-OkResponse([object]$response, [string]$errorCode) {
  if (-not $response -or $response.code -ne "OK") {
    throw $errorCode
  }
}

function To-JsonBody([object]$obj) {
  return ($obj | ConvertTo-Json -Depth 20 -Compress)
}

$base = Resolve-BaseUrl

try {
  $healthRes = Invoke-RestMethod -Method Get -Uri "$base/health" -TimeoutSec 5
  if ($healthRes.ok -ne $true) {
    throw "LOCAL_PREFLIGHT_HEALTH_NOT_OK"
  }
} catch {
  throw "LOCAL_PREFLIGHT_FAILED: Health check failed at $base/health. Ensure wrangler dev is running and responsive."
}

try {
  $loginRes = Invoke-RestMethod -Method Post -Uri "$base/v1/auth/login" -ContentType "application/json" -Body (To-JsonBody @{ email = $adminEmail; password = $adminPassword }) -TimeoutSec 10
  Ensure-OkResponse $loginRes "LOCAL_PREFLIGHT_AUTH_CODE_INVALID"
  if (-not $loginRes.data.access_token) {
    throw "LOCAL_PREFLIGHT_AUTH_TOKEN_MISSING"
  }
} catch {
  throw "LOCAL_PREFLIGHT_FAILED: Auth ping failed for $adminEmail at $base/v1/auth/login. Check local auth seed/user credentials or WORKSHOP_ADMIN_EMAIL/WORKSHOP_ADMIN_PASSWORD."
}

[ordered]@{
  preflight = "LOCAL_SMOKE_PREFLIGHT_OK"
  base_url = $base
  auth_user = $adminEmail
} | ConvertTo-Json -Depth 5
