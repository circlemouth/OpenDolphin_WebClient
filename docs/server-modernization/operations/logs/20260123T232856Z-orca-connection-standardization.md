# ORCA 接続先・認証設定統一 検証ログ

- RUN_ID: 20260123T232856Z
- 実施日: 2026-01-23
- 目的: preprod/prod ガードと dev proxy 認証ログの標準化確認
- 対象: setup-modernized-env.sh

## 1. preprod 切替ガード（明示 host/baseURL 未指定）

### 実行コマンド
```bash
env -i PATH="$PATH" ORCA_TARGET_ENV=preprod ORCA_CONFIG_ONLY=1 bash ./setup-modernized-env.sh
```

### 出力（抜粋）
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=preprod base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=unset
ORCA_TARGET_ENV=preprod requires explicit ORCA_BASE_URL or ORCA_API_HOST env.

終了コード: 1

## 2. prod 切替ガード（明示 host/baseURL 未指定）

### 実行コマンド
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=prod base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=unset

### 出力（抜粋）
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=prod base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=unset
ORCA_TARGET_ENV=prod requires explicit ORCA_BASE_URL or ORCA_API_HOST env.

終了コード: 1

## 3. dev proxy 認証ログ（none）

### 実行コマンド
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=unset
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

### 出力（抜粋）
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=unset
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

## 4. dev proxy 認証ログ（Basic）

### 実行コマンド
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=set web_proxy_cert=unset
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

### 出力（抜粋）
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=set web_proxy_cert=unset
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

## 5. dev proxy 認証ログ（mTLS）

### 実行コマンド
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=set
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

### 出力（抜粋）
[08:30:40] Reading ORCA connection info from docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md...
[08:30:40] Warning: ORCA credential file not found (docs/web-client/operations/mac-dev-login.local.md)
[08:30:40] ORCA_CONFIG target_env=unset base_url=http://localhost:18080 mode=onprem path_prefix=auto
[08:30:40] ORCA_CONFIG source host=default port=default:fallback scheme=default base_url=computed mode=computed
[08:30:40] ORCA_CONFIG port policy=block_8000 allow_8000=0 fallback=18080 replaced=false original_port=18080 original_source=default:fallback
[08:30:40] ORCA_CONFIG auth server_basic=unset web_proxy_basic=unset web_proxy_cert=set
[08:30:40] ORCA_CONFIG_ONLY=1: skipping docker startup.

## 6. スクリーンショット
- なし
