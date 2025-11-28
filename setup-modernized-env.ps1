<#
.SYNOPSIS
    モダナイズ版サーバーとWebクライアントの開発環境を一括セットアップするスクリプト

.DESCRIPTION
    1. docs/web-client/operations/mac-dev-login.local.md からORCA接続情報を取得
    2. custom.properties を生成してORCA接続情報を設定
    3. docker-compose.modernized.dev.yml を起動 (custom.propertiesをマウント)
    4. サーバー起動待機
    5. 初期ユーザー (dolphindev) を登録
    6. docker-compose.web-client.yml を起動

.NOTES
    実行には Docker Desktop が必要です。
#>

$ErrorActionPreference = "Stop"

# --- 設定 ---
$OrcaInfoFile = "docs/web-client/operations/mac-dev-login.local.md"
$CustomPropTemplate = "ops/shared/docker/custom.properties"
$CustomPropOutput = "custom.properties.dev"
$ComposeOverrideFile = "docker-compose.override.dev.yml"
$ServerHealthUrl = "http://localhost:9080/openDolphin/resources/dolphin"
$UserRegisterUrl = "http://localhost:9080/openDolphin/resources/user"

# 管理者認証 (デフォルト)
$AdminUser = "1.3.6.1.4.1.9414.10.1:dolphin"
$AdminPass = "36cdf8b887a5cffc78dcd5c08991b993" # dolphin (MD5)

# 作成するユーザー
$NewUserId = "dolphindev"
$NewUserPass = "dolphindev" # 平文 (送信時にMD5化)
$NewUserName = "Dolphin Dev"
$FacilityId = "1.3.6.1.4.1.9414.10.1"

# --- 関数: MD5ハッシュ生成 ---
function Get-MD5Hash {
    param ([string]$InputString)
    $md5 = [System.Security.Cryptography.MD5]::Create()
    $hash = [BitConverter]::ToString($md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($InputString)))
    return $hash.Replace("-", "").ToLower()
}

# --- 1. ORCA接続情報の取得 ---
Write-Host "Reading ORCA connection info from $OrcaInfoFile..." -ForegroundColor Cyan

if (-not (Test-Path $OrcaInfoFile)) {
    Write-Error "File not found: $OrcaInfoFile"
}

$Content = Get-Content $OrcaInfoFile -Raw
$OrcaHost = ""
$OrcaPort = ""
$OrcaUser = ""
$OrcaPass = ""

if ($Content -match "Base URL: ``http://([^:]+):(\d+)``") {
    $OrcaHost = $matches[1]
    $OrcaPort = $matches[2]
}
if ($Content -match "Basic auth: ``([^``]+)`` / ``([^``]+)``") {
    $OrcaUser = $matches[1]
    $OrcaPass = $matches[2]
}

if (-not $OrcaHost -or -not $OrcaPort) {
    Write-Error "Failed to parse ORCA URL from $OrcaInfoFile"
}

Write-Host "  Host: $OrcaHost"
Write-Host "  Port: $OrcaPort"
Write-Host "  User: $OrcaUser"

# --- 2. custom.properties の生成 ---
Write-Host "Generating $CustomPropOutput..." -ForegroundColor Cyan

$PropContent = Get-Content $CustomPropTemplate -Raw
# 正規表現で置換
$PropContent = $PropContent -replace "claim.host=.*", "claim.host=$OrcaHost"
$PropContent = $PropContent -replace "claim.send.port=.*", "claim.send.port=$OrcaPort"
if ($OrcaUser) { $PropContent = $PropContent -replace "claim.user=.*", "claim.user=$OrcaUser" }
if ($OrcaPass) { $PropContent = $PropContent -replace "claim.password=.*", "claim.password=$OrcaPass" }

Set-Content -Path $CustomPropOutput -Value $PropContent -Encoding UTF8
Write-Host "  Done."

# --- 3. docker-compose.override.dev.yml の生成 ---
Write-Host "Generating $ComposeOverrideFile..." -ForegroundColor Cyan

$OverrideContent = @"
services:
  server-modernized-dev:
    volumes:
      - ./$CustomPropOutput`:/opt/jboss/wildfly/custom.properties
"@

Set-Content -Path $ComposeOverrideFile -Value $OverrideContent -Encoding UTF8
Write-Host "  Done."

# --- 4. モダナイズ版サーバー起動 ---
Write-Host "Starting Modernized Server..." -ForegroundColor Cyan
docker-compose -f docker-compose.modernized.dev.yml -f $ComposeOverrideFile up -d

# --- 5. サーバー起動待機 ---
Write-Host "Waiting for server to be healthy..." -ForegroundColor Cyan
$RetryCount = 0
$MaxRetries = 60 # 30秒 * 60 = 30分 (長めにとる)
$Succeeded = $false

while ($RetryCount -lt $MaxRetries) {
    try {
        $Response = Invoke-WebRequest -Uri $ServerHealthUrl -Headers @{ "userName" = $AdminUser; "password" = $AdminPass } -Method Get -ErrorAction SilentlyContinue
        if ($Response.StatusCode -eq 200) {
            $Succeeded = $true
            break
        }
    } catch {
        # Ignore errors
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

# --- 6. 初期ユーザー登録 (DB直接操作) ---
Write-Host "Registering initial user ($NewUserId) via SQL..." -ForegroundColor Cyan

$NewUserPassHash = Get-MD5Hash $NewUserPass

# SQL: 施設確認・作成とユーザー・ロール作成
# テーブル名・カラム名の修正:
# - d_facilities -> d_facility
# - d_roles.roleName -> d_roles.c_role
# - d_roles.userid -> d_roles.user_id (String ID)
# - d_roles.user_id -> d_roles.c_user (FK Long ID)
# - d_facility の必須カラム (zipcode, address, telephone) を追加

$SqlScript = @"
-- 施設作成 (存在しない場合のみ)
INSERT INTO d_facility (id, facilityid, facilityname, membertype, registereddate, zipcode, address, telephone)
SELECT nextval('hibernate_sequence'), '$FacilityId', 'OpenDolphin Clinic', 'PROCESS', now(), '000-0000', 'Tokyo', '03-0000-0000'
WHERE NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '$FacilityId');

-- ユーザー作成 (存在しない場合のみ)
INSERT INTO d_users (
    id, userid, password, commonname, facility_id, membertype, registereddate,
    sirname, givenname, email
)
SELECT
    nextval('d_users_seq'),
    '$NewUserId',
    '$NewUserPassHash',
    '$NewUserName',
    (SELECT id FROM d_facility WHERE facilityid = '$FacilityId'),
    'PROCESS',
    now(),
    'Dolphin', 'Dev', 'dev@example.com'
WHERE NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '$NewUserId');

-- ロール作成 (存在しない場合のみ)
-- c_role: ロール名
-- user_id: ユーザーID (String)
-- c_user: ユーザーテーブルの主キー (Long)

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'admin', '$NewUserId', id
FROM d_users WHERE userid = '$NewUserId'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NewUserId' AND c_role = 'admin');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'user', '$NewUserId', id
FROM d_users WHERE userid = '$NewUserId'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NewUserId' AND c_role = 'user');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'doctor', '$NewUserId', id
FROM d_users WHERE userid = '$NewUserId'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '$NewUserId' AND c_role = 'doctor');
"@

try {
    $SqlScript | docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  User registration SQL executed successfully." -ForegroundColor Green
    } else {
        Write-Error "  Failed to execute SQL. Exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error "Failed to execute docker command: $_"
}

# --- 7. Webクライアント起動 ---
Write-Host "Starting Web Client..." -ForegroundColor Cyan
docker-compose -f docker-compose.web-client.yml up -d

Write-Host "All set! Web Client is running at http://localhost:5173" -ForegroundColor Green
Write-Host "Login with User: $NewUserId / Pass: $NewUserPass" -ForegroundColor Green
