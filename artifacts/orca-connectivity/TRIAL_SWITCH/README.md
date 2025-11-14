# WebORCA Trial Switch Evidence Hub

## 目的
- 2025-11-19 Trial 切替タスクで策定した「WebORCA トライアルサーバー＋CRUD 許可」方針に関する証跡を 1 か所に集約する。
- Runbook (`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`)、README (`docs/web-client/README.md`)、マネージャーチェックリスト（`docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` ほか）で参照する Evidence を保存する。

## ディレクトリ構成
- `RUN_ID=TorcaTrialCrudZ#/trial/` : CRUD 実測ログ（`curl -u trial:weborcatrial` コマンド／UI 操作キャプチャ）を API 単位で保存する。
- `RUN_ID=20251119TorcaTrialCutoverZ1/notes/` : 切替判断資料、差分スクリーンショット、`assets/orca-trialsite` 引用ログ。
- `seed-reference/` : `api21_medical_seed.sql` などの参考アーカイブを格納。直接投入禁止のため、各ファイル先頭に「参考アーカイブ、Trial CRUD で再登録すること」と追記する。

## 記録方法
1. 操作前に `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-cutover.md` に RUN_ID・想定成果物・保存先を記載。
2. CRUD 実測は `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` に追記し、本ディレクトリの `trial/` 配下へ Evidence を保存。
3. 週次共有 (`DOC_STATUS.md` / `PHASE2_PROGRESS.md`) の更新完了後、ここに差分スクリーンショットと `git log -1` 結果を置く。

## 登録済み RUN_ID
- `20251119TorcaTrialCrudZ1`: `/api01rv2/system01dailyv2` 取得。Evidence → `artifacts/orca-connectivity/20251119TorcaTrialCrudZ1/trial/system01dailyv2/`（request/response/trace/README）。

## 備考
- 認証情報は公開アカウント `trial/weborcatrial` のみ使用し、`ORCAcertification/` や `ORCA_PROD_*` 配布物は参照アーカイブ扱いにする。
- CRUD 操作で作成したデータは基本的に同 RUN_ID 内で削除し、削除に必要な UI 操作も Evidence 化する。
