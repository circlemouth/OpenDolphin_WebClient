# 20251124T021734Z webclient master bridge plan log

- RUN_ID: `20251124T021734Z`（親なし）
- 対象: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- 目的: ORCA マスターデータ不足（ORCA-05/06/08）に対し、webclient_modernized_bridge での補完レイヤー設計・運用・スプリント分解を決定する。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 本ログ

## 今日の記録（2025-11-24 JST）
- 計画書を新規作成（YAML ID 同名）。メタデータ（期間 11/26 09:00-11/27 09:00 JST、優先度 Medium / 緊急度 High、エージェント gemini cli）を明示。
- マスターデータ補完案を masterType 別に整理（ORCA-05/06/08 重点）。`resolveMasterSource` → fetch adapter → cache/version → validation → audit の流れを bridge 層に定義。
- ORCA_CONNECTIVITY_VALIDATION.md に沿った運用手順を固定（mac-dev のみ、MSW 無効化、P12/Trial 禁止、監査 dataSourceTransition 必須）。
- スプリント分解（SP1〜SP5）と見積り（計 19h）を設定。同期ジョブ成果物パス `artifacts/api-stability/20251124T021734Z/master-sync/` を計画に記載。

## 次アクション（本 RUN 内で実施予定）
- SP1（11/26 AM）で source resolver / fetch adapter の詳細仕様をログへ追記。
- SP3 以降で `bridge-sync` npm script 試作。実装時も Python 禁止を明記。
- DOC_STATUS 備考に RUN_ID・本ログ・計画ファイルパスを反映済みかチェック（本日時点で反映済み）。

## 証跡・関連パス
- 計画書: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- 予定アーティファクト: `artifacts/api-stability/20251124T021734Z/master-sync/`（同期ジョブ結果を格納予定）
- DOC_STATUS 行: `docs/web-client/planning/phase2/DOC_STATUS.md`（Webクライアント/連携 セクションに追記）

## 禁止事項再掲
- Python スクリプト実行禁止。
- `server/` 配下および Legacy 資産（`client/` `common/` `ext_lib/`）の改変禁止。
- WebORCA Trial / 本番経路へのアクセス禁止、`curl --cert-type P12` 使用禁止。
