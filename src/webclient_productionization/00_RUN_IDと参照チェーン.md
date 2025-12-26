# 00 RUN_ID と参照チェーン

- RUN_ID: `20251226T232335Z`
- 期間: 2025-12-27 08:23 〜 2025-12-28 08:23 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_productionization/00_RUN_IDと参照チェーン.md`

## 目的
- webclient productionization plan 20251226 の開始 RUN_ID を明文化し、以降の証跡・ログで同一値を使用する。
- 参照チェーンを明記し、外来スコープ（Reception / Charts / Patients / Administration / Outpatient Mock）に限定する。

## RUN_ID ルール
- RUN_ID は `YYYYMMDDThhmmssZ`（UTC）で採番する。
- 同一ガント期間に派生 RUN（A/B/C 等）を作る場合は、親 RUN_ID（本ファイル）を備考とログ先頭に明記する。

## 参照チェーン（必読）
1. `docs/DEVELOPMENT_STATUS.md`
2. `docs/web-client/architecture/future-web-client-design.md`
3. `web-client/src/*`
4. 本ガント（本ファイル）

## 対象スコープ
- 外来（Reception / Charts / Patients / Administration / Outpatient Mock）のみ。
- 入院系は対象外。

## ローカル検証（前提）
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- ログイン情報: `setup-modernized-env.sh` 記載のものを使用する。
