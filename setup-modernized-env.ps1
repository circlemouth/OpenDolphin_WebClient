<#
.SYNOPSIS
  繝｢繝繝翫う繧ｺ迚医し繝ｼ繝舌・縺ｨ Web 繧ｯ繝ｩ繧､繧｢繝ｳ繝磯幕逋ｺ迺ｰ蠅・・繧ｻ繝・ヨ繧｢繝・・繧ｹ繧ｯ繝ｪ繝励ヨ

.NOTES
  - Python 螳溯｡檎ｦ∵ｭ｢繝ｫ繝ｼ繝ｫ縺ｫ蠕薙＞縲￣owerShell + Docker Compose 縺ｮ縺ｿ繧剃ｽｿ逕ｨ
  - ORCA 騾｣謳ｺ繝昴・繝医・ 8000 逡ｪ繧剃ｽｿ逕ｨ縺励↑縺・ｼ育腸蠅・､画焚 ORCA_PORT 縺ｧ荳頑嶌縺榊庄・・  - DB 繧ｷ繝ｼ繝峨・ ops/db/local-baseline/local_synthetic_seed.sql 繧帝←逕ｨ
#>

$ErrorActionPreference = "Stop"

# --- 險ｭ螳・---
$OrcaInfoFile = "docs/web-client/operations/mac-dev-login.local.md"
$CustomPropTemplate = "ops/shared/docker/custom.properties"
$CustomPropOutput = "custom.properties.dev"
$ComposeOverrideFile = "docker-compose.override.dev.yml"
$LocalSeedFile = "ops/db/local-baseline/local_synthetic_seed.sql"
$ServerHealthUrl = "http://localhost:9080/openDolphin/resources/dolphin"
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

# 邂｡逅・・ｪ崎ｨｼ (繧ｷ繧ｹ繝・Β繧｢繧ｫ繧ｦ繝ｳ繝・
$AdminUser = "1.3.6.1.4.1.9414.10.1:dolphin"
$AdminPass = "36cdf8b887a5cffc78dcd5c08991b993" # dolphin (MD5)

# 菴懈・縺吶ｋ繝ｦ繝ｼ繧ｶ繝ｼ
$NewUserId = "dolphindev"
$NewUserPass = "dolphindev" # 蟷ｳ譁・(騾∽ｿ｡譎ゅ↓ MD5 蛹・
$NewUserName = "Dolphin Dev"
$FacilityId = "1.3.6.1.4.1.9414.10.1"

# --- 髢｢謨ｰ ---
function Get-MD5Hash {
    param ([string]$InputString)
    $md5 = [System.Security.Cryptography.MD5]::Create()
    $hash = [BitConverter]::ToString($md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($InputString)))
    return $hash.Replace("-", "").ToLower()
}

function WriteUtf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

# --- 1. ORCA 謗･邯壽ュ蝣ｱ縺ｮ蜿門ｾ・---
Write-Host "Reading ORCA connection info from $OrcaInfoFile..." -ForegroundColor Cyan

$OrcaHost = ""
$OrcaPort = ""
$OrcaUser = ""
$OrcaPass = ""

if (Test-Path $OrcaInfoFile) {
    $Content = Get-Content $OrcaInfoFile -Raw
    if ($Content -match "Base URL:\s*``http://([^:]+):(\d+)``") {
        $OrcaHost = $matches[1]
        $OrcaPort = $matches[2]
    }
    if ($Content -match "Basic auth:\s*``([^`]+)``\s*/\s*``([^`]+)``") {
        $OrcaUser = $matches[1]
        $OrcaPass = $matches[2]
    }
} else {
    Write-Warning "File not found: $OrcaInfoFile"
}

# 迺ｰ蠅・､画焚縺ｧ荳頑嶌縺搾ｼ・000 逡ｪ遖∵ｭ｢・・if ($env:ORCA_HOST) { $OrcaHost = $env:ORCA_HOST }
if ($env:ORCA_PORT) { $OrcaPort = $env:ORCA_PORT }
if ($env:ORCA_USER) { $OrcaUser = $env:ORCA_USER }
if ($env:ORCA_PASS) { $OrcaPass = $env:ORCA_PASS }

$OrcaPortFallback = if ($env:ORCA_PORT_FALLBACK) { $env:ORCA_PORT_FALLBACK } else { "18080" }

if (-not $OrcaHost) {
    Write-Warning "ORCA host is not set; defaulting to localhost."
    $OrcaHost = "localhost"
}

if (-not $OrcaPort) {
    Write-Warning "ORCA port is not set; defaulting to $OrcaPortFallback."
    $OrcaPort = $OrcaPortFallback
}

if ($OrcaPort -eq "8000") {
    Write-Warning "Port 8000 is disallowed; using $OrcaPortFallback instead. Override with ORCA_PORT if needed."
    $OrcaPort = $OrcaPortFallback
}

if ($OrcaPort -notmatch "^\d+$") {
    Write-Error "Invalid ORCA port: $OrcaPort"
}

Write-Host "  Host: $OrcaHost"
Write-Host "  Port: $OrcaPort"
Write-Host "  User: $OrcaUser"

# --- 2. custom.properties 縺ｮ逕滓・ ---
Write-Host "Generating $CustomPropOutput..." -ForegroundColor Cyan

$PropContent = Get-Content $CustomPropTemplate -Raw
$PropContent = $PropContent -replace "claim\.host=.*", "claim.host=$OrcaHost"
$PropContent = $PropContent -replace "claim\.send\.port=.*", "claim.send.port=$OrcaPort"
if ($OrcaUser) { $PropContent = $PropContent -replace "claim\.user=.*", "claim.user=$OrcaUser" }
if ($OrcaPass) { $PropContent = $PropContent -replace "claim\.password=.*", "claim.password=$OrcaPass" }

WriteUtf8NoBom -Path $CustomPropOutput -Content $PropContent
Write-Host "  Done."

# --- 3. docker-compose.override.dev.yml 縺ｮ逕滓・ ---
Write-Host "Generating $ComposeOverrideFile..." -ForegroundColor Cyan

$OverrideContent = @"
services:
  server-modernized-dev:
    volumes:
      - ./$CustomPropOutput`:/opt/jboss/wildfly/custom.properties
"@

WriteUtf8NoBom -Path $ComposeOverrideFile -Content $OverrideContent
Write-Host "  Done."

# --- 4. 繝｢繝繝翫う繧ｺ迚医し繝ｼ繝舌・襍ｷ蜍・---
Write-Host "Starting Modernized Server..." -ForegroundColor Cyan
docker compose -f docker-compose.modernized.dev.yml -f $ComposeOverrideFile up -d

# --- 5. 繧ｵ繝ｼ繝舌・襍ｷ蜍募ｾ・■ ---
Write-Host "Waiting for server to be healthy..." -ForegroundColor Cyan
$RetryCount = 0
$MaxRetries = 60 # 5遘・* 60 = 5蛻・$Succeeded = $false

while ($RetryCount -lt $MaxRetries) {
    try {
        $Response = Invoke-WebRequest -Uri $ServerHealthUrl -Headers @{ "userName" = $AdminUser; "password" = $AdminPass } -Method Get -ErrorAction SilentlyContinue
        if ($Response.StatusCode -eq 200) {
            $Succeeded = $true
            break
        }
    } catch {
        # Ignore errors while waiting
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
    $RetryCount++
}
Write-Host ""

if (-not $Succeeded) {
    Write-Error "Server failed to start within timeout."
}
Write-Host "Server is UP!" -ForegroundColor Green

# --- 6. 繝ｭ繝ｼ繧ｫ繝ｫ蜷域・繝吶・繧ｹ繝ｩ繧､繝ｳ繧ｷ繝ｼ繝峨ｒ驕ｩ逕ｨ ---
Write-Host "Applying local baseline seed ($LocalSeedFile)..." -ForegroundColor Cyan

if (-not (Test-Path $LocalSeedFile)) {
    Write-Error "Seed file not found: $LocalSeedFile"
}

try {
    docker cp $LocalSeedFile opendolphin-postgres-modernized:/tmp/modern_seed.sql
    docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_seed.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Baseline seed applied." -ForegroundColor Green
    } else {
        Write-Error "  Failed to apply baseline seed. Exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error "Failed to execute baseline seed: $_"
}

# --- 7. 蛻晄悄繝ｦ繝ｼ繧ｶ繝ｼ逋ｻ骭ｲ (DB逶ｴ謗･謫堺ｽ・ ---
Write-Host "Registering initial user ($NewUserId) via SQL..." -ForegroundColor Cyan

$NewUserPassHash = Get-MD5Hash $NewUserPass

$SqlTemplate = @'
-- Ensure hibernate_sequence exists and is aligned
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'hibernate_sequence' AND relkind = 'S'
    ) THEN
        CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
    END IF;

    SELECT GREATEST(
        COALESCE((SELECT max(id) FROM d_facility), 0),
        COALESCE((SELECT max(id) FROM d_users), 0),
        COALESCE((SELECT max(id) FROM d_roles), 0),
        1
    ) INTO max_id;

    PERFORM setval('hibernate_sequence', max_id, true);
END$$;

-- Create facility if missing
INSERT INTO d_facility (id, facilityid, facilityname, membertype, registereddate, zipcode, address, telephone)
SELECT nextval('hibernate_sequence'), '{0}', 'OpenDolphin Clinic', 'PROCESS', now(), '000-0000', 'Tokyo', '03-0000-0000'
WHERE NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '{0}');

-- Create user if missing
INSERT INTO d_users (
    id, userid, password, commonname, facility_id, membertype, registereddate,
    sirname, givenname, email
)
SELECT
    nextval('hibernate_sequence'),
    '{1}',
    '{2}',
    '{3}',
    (SELECT id FROM d_facility WHERE facilityid = '{0}'),
    'PROCESS',
    now(),
    'Dolphin', 'Dev', 'dev@example.com'
WHERE NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '{1}');

-- Create roles if missing
INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'admin', '{1}', id
FROM d_users WHERE userid = '{1}'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '{1}' AND c_role = 'admin');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'user', '{1}', id
FROM d_users WHERE userid = '{1}'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '{1}' AND c_role = 'user');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'doctor', '{1}', id
FROM d_users WHERE userid = '{1}'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '{1}' AND c_role = 'doctor');
'@

$SqlScript = [string]::Format($SqlTemplate, $FacilityId, $NewUserId, $NewUserPassHash, $NewUserName)

$TempUserSeedPath = Join-Path $env:TEMP "modern_user_seed.sql"

try {
    WriteUtf8NoBom -Path $TempUserSeedPath -Content $SqlScript
    docker cp $TempUserSeedPath opendolphin-postgres-modernized:/tmp/modern_user_seed.sql
    docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /tmp/modern_user_seed.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  User registration SQL executed successfully." -ForegroundColor Green
    } else {
        Write-Error "  Failed to execute SQL. Exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error "Failed to execute docker command: $_"
}

# --- 8. Web 繧ｯ繝ｩ繧､繧｢繝ｳ繝郁ｵｷ蜍・---
Write-Host "Starting Web Client..." -ForegroundColor Cyan
docker compose -f docker-compose.web-client.yml up -d

Write-Host "All set! Web Client is running at http://localhost:5173" -ForegroundColor Green
Write-Host "Login with User: $NewUserId / Pass: $NewUserPass" -ForegroundColor Green
