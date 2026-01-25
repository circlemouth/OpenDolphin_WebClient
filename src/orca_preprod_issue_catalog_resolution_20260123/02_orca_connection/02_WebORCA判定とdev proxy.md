# 02 WebORCA判定とdev proxy

- RUN_ID: 20260125T005440Z
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
- 結果: パス
