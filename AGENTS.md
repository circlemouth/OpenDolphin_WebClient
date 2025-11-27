# AGENTS README
- Python スクリプトの実行は禁止（明示指示がある場合のみ例外）。
- 本プロジェクトの目的は「Web クライアント × モダナイズ版サーバー」を本番品質で連携させること。Legacy 資産は参照専用。
- 最終返答は必ず日本語で行うこと。
- worktreeへの移動を指示されたとき、同名のworktreeが存在しない場合は作成して移動する。
- mainブランチへのマージを指示されたときは、今の作業ディレクトリの内容をマージする。プロンプト中で示されているのはあくまで例であることに注意すること。
- 文字化け防止: 日本語ドキュメントは UTF-8(BOMなし)で保存する。PowerShell での書き込みは `-Encoding UTF8`/`UTF8NoBOM` を用い、既存エンコーディングを壊さないこと。

## 1. 守るべき制約（高速開発でも削れないもの）
- `server/` 配下にある旧来のサーバースクリプトを変更しない。触れるのは Web クライアント資産と関連ドキュメントのみ。
- Legacy サーバー/クライアントは差分検証目的で一時起動してもよいが、保守や運用作業は禁止。
- ORCA 連携の接続先・認証情報は機微扱いとし、開発用設定は `docs/web-client/operations/mac-dev-login.local.md` を参照する。WebORCA トライアルや本番経路、`curl --cert-type P12` の利用は禁止。ログは公開アカウント操作で取得する。
- 参照専用: `client/`, `common/`, `ext_lib/` の Legacy 資産。更新はしない。

## 2. Phase2 オペレーション最小セット
1. **参照チェーン**: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各 manager checklist。新タスクはこの順で確認する。
2. **RUN_ID**: `YYYYMMDDThhmmssZ` を必ず採番し、指示・README・DOC_STATUS・ログ・証跡ディレクトリで同じ値を使う。派生 RUN_ID を作る場合は親 RUN_ID を明示する。
3. **DOC_STATUS**: `docs/web-client/planning/phase2/DOC_STATUS.md` の棚卸し手順に従って更新し、備考に RUN_ID / 証跡パスを追記したら同日付でハブ文書へ反映する。
4. **証跡**: ORCA やサーバー操作ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へ。Web クライアント側の手順書からリンクできるようにする。

## 3. 役割別ハブ（参照時間を短縮）
- Web クライアント設計・UX: `docs/web-client/README.md` を入口に `architecture/`, `features/`, `ux/`, `operations/` へ遷移。
- サーバーモダナイズと ORCA 連携: `docs/server-modernization/phase2/INDEX.md` から `foundation/`, `domains/`, `operations/`, `notes/` を辿る。
- 領域別マネージャー/ワーカー指示テンプレ: `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と各 `PHASE2_*_MANAGER_CHECKLIST.md`。

## 4. タスク着手チェックリスト
1. `docs/web-client/planning/phase*/` の該当計画でゴールと依存を確認。フェーズゲートは維持するが、実作業は領域別チェックリスト単位で進めてよい。
2. UI/UX を触る場合は `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` から関連ガイドを必読。カルテ画面 (`ChartsPage` など) 変更時は監査・レイアウト要件を反映する。
3. ORCA 接続や API を扱う場合は `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` / `ORCA_API_STATUS.md` / `MODERNIZED_API_DOCUMENTATION_GUIDE.md` を参照し、RUN_ID ログを残す。
4. Stage/Preview 環境での再検証（`VITE_DISABLE_MSW=1`＋`VITE_DEV_PROXY_TARGET`＋Playwright/curl）の実行は、マネージャーが環境権限を確認したうえで許可し、実施・未実施の状態と理由を証跡ログ・DOC_STATUSの RUN_ID 行に明記する。

## 5. 連絡ルール
- マネージャー → ワーカー指示: `【ワーカー指示】` を接頭にし、担当領域・参照チェーン・更新必須ドキュメント・RUN_ID を明記。
- ワーカー → マネージャー報告: `【ワーカー報告】` を接頭にし、実施内容・証跡パス・DOC_STATUS 更新行・RUN_ID をセットで報告。明示的に指示されない限りdockerコンテナの削除や再構築、起動は行なわず、その手前で作業を止めてワーカー報告をすること。

この 5 セクションで高速開発に必要な最小ルールを完結させ、詳細や履歴は各ハブドキュメントでメンテナンスする。
