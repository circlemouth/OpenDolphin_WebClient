# 00 RUN_ID と参照チェーン

- RUN_ID: `20251212T130647Z`
- 期間: 2025-12-15 09:00 〜 2025-12-16 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## 目的
- 本ガント（charts production outpatient plan）開始時点の RUN_ID を採番し、以降の証跡・DOC_STATUS・ログに同一値を使用する。
- 参照チェーンを明文化し、更新が必要なハブ文書（README / DOC_STATUS）まで同期する。

## RUN_ID ルール
- RUN_ID は `YYYYMMDDThhmmssZ`（UTC）で採番する。
- 同一ガント期間に派生 RUN（A/B/C 等）を作る場合は、親 RUN_ID（本ファイル）を備考とログ先頭に明記する。

## 参照チェーン（必読）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. 本ガント（本ファイル）

## ローカル検証（前提）
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- ログイン情報: `setup-modernized-env.sh` 記載のものを使用する。

## 証跡・同期
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251212T130647Z-charts-production-outpatient-governance.md`
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID と証跡パスを追記する。
- Hub: `docs/web-client/README.md` に同日付（2025-12-12）で反映する。

## WSL メモ（必要時）
- `setup-modernized-env.sh` は `bash` で実行し、改行コード/実行権限（`chmod +x`）で詰まる場合は環境側の扱いを確認する。
