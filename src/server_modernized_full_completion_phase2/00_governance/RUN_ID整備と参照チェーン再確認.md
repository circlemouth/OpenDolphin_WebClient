# RUN_ID整備と参照チェーン再確認（RUN_ID=20251219T062549Z）

- YAML ID: src/server_modernized_full_completion_phase2/00_governance/RUN_ID整備と参照チェーン再確認.md
- 期間: 2025-12-19 09:00 JST 〜 2025-12-20 09:00 JST
- 目的: Web クライアントとモダナイズ版サーバーのガバナンス整合（RUN_ID 統一・参照チェーン再確認）。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/planning/phase2/DOC_STATUS.md`。
- スコープ: `server-modernized/` を対象にした接続/運用確認のみ。`server/`, `client/`, `common/`, `ext_lib/` は参照専用で変更不可。
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251219T062549Z-runid-governance.md`（参照チェーン再確認、ORCA 接続なし）。

## 作業メモ
- RUN_ID を上記チェーンの全ハブ文書で統一すること。差分がある場合は最優先で更新する。
- ORCA 実環境接続を行う場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従い、別途 RUN_ID ログを追加する。
- Stage/Preview 検証は本ガントの対象外。必要に応じて別 RUN_ID で計画を立てる。
