# 00_RUN_IDと参照チェーン確定 (RUN_ID=20251123T213145Z)

期間: 2025-11-24 09:00 〜 2025-11-25 09:00 (JST)

## ゴール
- RUN_ID を `20251123T213145Z` で統一し、指示・README・DOC_STATUS・証跡ドラフトで同一値を採番。
- Phase2 ガバナンス必読チェーンを再確認し、更新が必要な箇所がないか即応できる状態にする。
- DOC_STATUS 備考に追記する文案と証跡パスのドラフトを整備。

## 参照チェーン確認メモ
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 各 `PHASE2_*_MANAGER_CHECKLIST.md`

※ 2025-11-23 時点で各リンクは有効。差分検知が必要な場合は DOC_STATUS および該当ハブから同期する。

## 証跡パス（ドラフト）
- `docs/server-modernization/phase2/operations/logs/20251123T213145Z-run-id-chain.md`

## DOC_STATUS 備考 追記案
- `docs/web-client/README.md` 行の備考末尾へ以下を追記:「RUN_ID=`20251123T213145Z` でガバナンス参照チェーン再確認・証跡ドラフト（`docs/server-modernization/phase2/operations/logs/20251123T213145Z-run-id-chain.md`）を準備中。」

## 禁止事項リマインダー
- Python スクリプト実行禁止（明示指示時のみ例外）。
- `server/` 配下および Legacy 資産（`client/`、`common/`、`ext_lib/`）は非改変・保守不可。参照のみ。
- ORCA 本番/Trial 経路へのアクセスや `curl --cert-type P12` は禁止。開発用接続は `docs/web-client/operations/mac-dev-login.local.md` 記載の経路に限定。

## 次アクション
- DOC_STATUS に上記追記案を反映し、証跡ドラフトをハブドキュメントから辿れるようにする。
