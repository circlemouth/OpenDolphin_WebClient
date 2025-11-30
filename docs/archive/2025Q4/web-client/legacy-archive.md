# Web クライアント Legacy Documentation Archive

**RUN_ID:** `20251130T120000Z`

## 概要
Web クライアント領域はこの RUN_ID で「ログイン画面のみ」の構成へ再編され、`docs/web-client` 以下にあった豊富な機能・UX・プロセス文書はすべて削除またはアーカイブ対象としました。本ファイルは当時の資料群とその配置を記録し、将来的な再開時に参照すべき legacy 資産一覧を示します。

## 削除済みディレクトリ（代表的なファイル例）
| ディレクトリ | 代表的なドキュメント | 内容 | 備考 |
| --- | --- | --- | --- |
| `docs/web-client/architecture/` | `WEB_CLIENT_REQUIREMENTS.md`, `ui-api-mapping.md` | 機能/非機能要件、API-画面対応マッピング | Phase2 で未使用のため削除。構想内容は Git 履歴で参照可。 |
| `docs/web-client/features/` | `RECEPTION_SCHEDULE_AND_SUMMARY.md`, `CHARTS_*` 系 | 現行 Web クライアントの各画面ごとの詳細仕様 | 本再構成後は扱わないため Archive へ集約。 |
| `docs/web-client/guides/CLINICAL_MODULES.md` | 受付/カルテ/ORCA 連携ガイド | 統合的な操作ガイドと API 構成案 | 同上。 |
| `docs/web-client/operations/` | `LOCAL_BACKEND_DOCKER.md`, `RECEPTION_WEB_CLIENT_MANUAL.md` | 運用/デプロイ手順 | 現行ログイン-only に不要。Legacy ops は `docs/operations/` へ移行可。 |
| `docs/web-client/ux/` | `ux-documentation-plan.md`, `charts-claim-ui-policy.md` | UX ポリシー/モック/アクセシビリティ計画 | 既存の UI が消えたため実装対象外。 |
| `docs/web-client/process/` | `API_UI_GAP_ANALYSIS.md`, `ROADMAP.md` | API と UI のギャップ/計画 | 新構成では対象外。 |
| `docs/web-client/planning/phase0/` | `PHASE0_DELIVERABLES.md` | ゲームフェースの初期計画 | 本フェーズに再度戻す場合は `docs/archive/2025Q4/` から復刻。 |
| `docs/web-client/planning/phase1/` | `PHASE1_FOUNDATION.md`, `PHASE1_SECURITY_REVIEW.md` | フェーズ1 成果 | 同上。 |

各ドキュメントの詳細は Git の変更履歴（`git log -- docs/web-client/...` や `git show <commit>`）をご確認ください。必要であればこのアーカイブに追加の要約を追記し、`docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` からリンクしてください。

## 証跡・参照先
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`: 削除操作とビルド検証のコマンド履歴。
- 本ファイルを起点に README/DOC_STATUS/PLAN を更新して RUN_ID を共有してください。

## 今後の対応
1. 旧ドキュメントを再開する場合、まず `docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` を更新し、対象ファイルと RUN_ID を明記。
2. README → DOC_STATUS → 計画 → このアーカイブのチェーンを切らさず、RUN_ID を `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` で照合。
3. 必要な Legacy 資料は Git から復元し、復活後は README に新規 RUN_ID を併記して運用してください。
