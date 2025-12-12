# Charts 本番外来カバレッジ定義ログ（RUN_ID=20251212T131901Z）

## 1. 目的
- ガント「[webclient charts production outpatient plan] 01_外来機能の完全カバレッジ定義」の成果物として、Charts 観点で外来フロー（受付→診療→会計）を完走するための UI カバレッジ（予約/請求/外来医療記録/患者更新/設定配信/キュー）を “漏れなく” 一覧化する。
- “市販カルテ相当” の DoD（監査/アクセシビリティ/運用）を Charts の完了条件として固定する。

## 2. 生成物
- カバレッジ定義: `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md`

## 3. 更新したハブ/台帳（RUN_ID 同期）
- `docs/web-client/README.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`

## 4. 補足（制約順守）
- Legacy 資産（`client/`, `common/`, `ext_lib/`）は参照のみ。更新なし。
- 旧サーバー（`server/`）は変更しない。
- ORCA 実接続/証明書を扱う操作は行っていない（ログ作成のみ）。

