# 02 WebORCA判定とdev proxy

- RUN_ID: 20260125T012500Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/02_orca_connection/02_WebORCA判定とdev proxy.md
- 対象IC: IC-13 / IC-14
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/server-modernization/orca-additional-api-implementation-notes.md
  - docs/web-client/operations/debugging-outpatient-bugs.md

## 実施内容
- WebORCA 判定を `ORCA_MODE` / `ORCA_API_WEBORCA` の明示設定に統一し、ホスト名による暗黙判定を廃止した。
- `setup-modernized-env` で **非ローカルホストは ORCA_MODE 必須** とし、/api 付与漏れを防止した。
- Vite dev proxy で ORCA 系エンドポイントに `/api` を補完するルールを統一し、WebORCA 直結時の 404/405 を回避した。

## 判定ルール（ORCA_MODE 必須化）
- `ORCA_API_HOST` がローカル以外の場合は **`ORCA_MODE=weborca|onprem` を必須** とする。
- `ORCA_API_WEBORCA=1` は WebORCA の明示指定として扱い、`ORCA_MODE` と同等に優先する。
- `/api` プレフィックスの自動付与は `ORCA_API_PATH_PREFIX` に従う（off/none/false/disable で無効化）。

## dev proxy rewrite ルール
- `VITE_ORCA_MODE` / `VITE_ORCA_API_PATH_PREFIX` を参照し、`/api01rv2`・`/api21`・`/orca06|12|21|22|25|51|101|102` を WebORCA 向けに `/api` 補完する。
- `/api` 経路は ORCA エンドポイントのみ `ORCA_API_PATH_PREFIX` を維持し、アプリ API (`/api/user` など) は従来どおり `/api` を除去して中継する。
- `VITE_DEV_PROXY_TARGET` のベースパスに `/api` が含まれる場合は二重付与しない。

## 実測結果（WebORCA 直結）
- `POST https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2`
  - HTTP 200 / Api_Result=00
  - req: `artifacts/orca-connectivity/20260125T012500Z/44_system01dailyv2_request.xml`
  - res: `artifacts/orca-connectivity/20260125T012500Z/system01dailyv2_response.xml`
- `POST https://weborca-trial.orca.med.or.jp/api/orca101/manageusersv2`
  - HTTP 200 / Api_Result=0000（Request_Number=01）
  - req: `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_request.xml`
  - res: `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_response.xml`

## 実測結果（dev proxy）
- `WEB_CLIENT_MODE=npm` + `WEB_CLIENT_DEV_PROXY_TARGET=https://weborca-trial.orca.med.or.jp`
- `POST http://localhost:5173/api01rv2/system01dailyv2`
  - HTTP 200 / Api_Result=00
  - res: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_system01dailyv2_response.xml`
- `POST http://localhost:5173/orca101/manageusersv2`
  - HTTP 200 / Api_Result=0000
  - res: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_manageusersv2_response.xml`

## 変更ファイル
- setup-modernized-env.sh
- setup-modernized-env.ps1
- server-modernized/src/main/java/open/dolphin/orca/transport/OrcaTransportSettings.java
- web-client/vite.config.ts
- web-client/.env.sample
- docs/server-modernization/orca-additional-api-implementation-notes.md
- docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md
- docs/web-client/operations/debugging-outpatient-bugs.md

## 検証
- 実行コマンド:
  - bash -n setup-modernized-env.sh
  - npm --prefix web-client run typecheck
  - ORCA 直結: curl (system01dailyv2 / manageusersv2)
  - dev proxy: curl (system01dailyv2 / manageusersv2)
- 結果: WebORCA 直結・dev proxy ともに HTTP 200 を確認（404/405 なし）。

## 証跡
- `docs/server-modernization/phase2/operations/logs/20260125T012500Z-orca-weborca-direct.md`
- `artifacts/orca-connectivity/20260125T012500Z/`
- `artifacts/webclient/orca-e2e/20260125T012500Z/`
