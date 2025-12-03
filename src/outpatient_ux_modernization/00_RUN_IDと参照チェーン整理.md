# 00 RUN_ID と参照チェーン整理

- RUN_ID: `20251203T222026Z`
- 期間: 2025-12-04 07:20 〜 2025-12-05 07:20 (JST)
- 対象: Web クライアント UX/Features（`docs/web-client/ux/ux-documentation-plan.md` など）

## 参照チェーン
1. `AGENTS.md`（Python 禁止、Legacy 資産参照専用、`server/` 改修禁止、ORCA 接続情報の扱いと RUN_ID ルール）
2. `docs/web-client/README.md`（ログイン画面のみの現行構成、RUN_ID／DOC_STATUS／証跡の同期ルール）
3. `docs/server-modernization/phase2/INDEX.md`（Phase2 のガバナンスチェーン、RUN_ID 備考、`docs/web-client/operations/mac-dev-login.local.md` を起点とした ORCA 接続制限）
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`（各ドキュメントとの整合チェックと環境／ORCA 手順のチェックボックス）

## Web クライアント開発ルール（チーム共有）
- Python スクリプトの実行は禁止。npm/yarn など Node ベースの手順で完結できないものは指示待ちとし、Automation に依存する場合は都度確認。
- `server/` 以下の旧サーバースクリプトや Legacy の `client/`、`common/`、`ext_lib/` には変更を加えず、差分検証用途以外で起動や保守作業をしない。
- AGENTS に示された Phase2 参照チェーン順（AGENTS → README → INDEX → マネージャーチェックリスト）を遵守し、追加ドキュメント作成時は README・DOC_STATUS・マネージャーチェックリストへのリンクと RUN_ID を残す。

## ORCA 接続制約（チーム共有）
- 接続先と認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を唯一の現行設定として参照する。mac-dev 手順は Archive 扱いとし、Git 管理下にある場合でも証跡には `<MASKED>` を使う。実際の内容は関係者へ直接共有し、`docs/server-modernization/phase2/operations/logs/20251203T134014Z-orcacertification-only.md` を親 RUN_ID として記録する。
- ORCA 接続は ORCAcertification の環境に限定し、WebORCA トライアル・本番経路・`curl --cert-type P12`（無断使用）・ローカル ORCA コンテナは利用禁止。`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`・`ORCA_API_STATUS.md` で CRUD 証跡と RUN_ID を管理し、ログは `docs/server-modernization/phase2/operations/logs/` へ保存する。
- ORCA 関連の検証では `VITE_DISABLE_MSW=1` など MSW 無効化指示に従い、管理者/医師アカウント（`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）でのみログインを試行し、`ORCA_API_STATUS.md` の Blocker 指摘内容と `ORCA_CONNECTIVITY_VALIDATION.md` §0 で示したチェックリストを起点として再実測する。

## 証跡と同期
- `docs/server-modernization/phase2/operations/logs/20251203T222026Z-run-id-chain.md` に本 RUN を記録し、DOC_STATUS の Web クライアント UX/Features 行と README/INDEX/マネージャーチェックリストにリンクを張った。
- この RUN ではチーム共有用メモとして本ファイルと DOC_STATUS を整備し、以降の RUN では本 RUN_ID を親として備考へ記載する。

## チームへの共有予定
- このメモと `docs/server-modernization/phase2/operations/logs/20251203T222026Z-run-id-chain.md` をリンク付きで共有し、Web クライアント担当者が参照チェーンを辿ったことを確認できるようにする。
- Web クライアント開発ルールと ORCA 接続制約の要点を含む共有テンプレートとして活用し、次の RUN で環境構成や ORCA 実録を更新する際は本ファイルを起点にレビューする。
