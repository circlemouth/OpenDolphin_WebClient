# 00_運用ガバナンスと RUN_ID 確定

- RUN_ID: `20251120T131731Z`
- 期間: 2025-11-20 09:00 〜 2025-11-21 09:00 (JST)
- エージェント: Codex

## 1. 参照チェーン（最新版確認済み）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## 2. 守るべき禁止事項
- `server/` 配下およびサーバースクリプトの変更は禁止。
- Legacy 資産（`client/`, `common/`, `ext_lib/`）は参照のみ。更新不可。
- Python スクリプトの実行は禁止（明示指示がある場合のみ例外）。
- ORCA 接続先は WebORCA トライアル `https://weborca-trial.orca.med.or.jp/`（BASIC 認証 `trial` / `weborcatrial`）のみ。`curl --cert-type P12` や本番証明書の使用禁止。

## 3. DOC_STATUS 棚卸し計画
- 実施予定: 2025-11-20T15:00Z（JST=11/21 00:00）／リカバリー枠: 2025-11-20T23:00Z。
- 対象: `docs/web-client/planning/phase2/DOC_STATUS.md` の「モダナイズ/運用」「モダナイズ/基盤」行。結果は備考へ RUN_ID と証跡パスを追記。
- 反映先: 同日中に `docs/web-client/README.md` および `docs/server-modernization/phase2/INDEX.md` へ更新内容を同期。
- 証跡: `docs/server-modernization/phase2/operations/logs/20251120T131731Z-governance.md`（本タスク総括ログ）、棚卸し結果は `docs/server-modernization/phase2/operations/logs/20251120T131731Z-doc-status.md` へ追記予定。

## 4. 即時アクション
- 追加のワーカー指示や検証が発生する場合も RUN_ID を `20251120T131731Z` で統一し、証跡を上記ログ配下に集約する。
- サーバー資産変更や非トライアル ORCA 接続は行わない。必要な検証は WebORCA トライアルのみで実施。

## 5. 更新履歴
- 2025-11-20: 初版作成（Codex）。
