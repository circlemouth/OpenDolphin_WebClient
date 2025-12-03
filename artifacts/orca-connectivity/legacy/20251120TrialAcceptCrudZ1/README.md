# RUN_ID=20251120TrialAcceptCrudZ1 受付一覧（参照）

- 参照: `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 (API #3) / `trialsite.md` Snapshot Summary（2025-11-15 08:24 JST）。
- 目的: Task-A/B で登録済みの受付と UI を突合するため `/api01rv2/acceptlstv2?class=01` のレスポンスを取得する。
- payload: `payloads/acceptlst.json`（`Acceptance_Date=2025-11-20`, `Department_Code=01`, `Physician_Code=0001`）。

## curl
- 13:19:39 JST `crud/acceptlstv2/curl_class01_2025-11-15T131937+0900.log`
  - HTTP 200 / `Api_Result=13 (ドクターが存在しません)`。
  - レスポンス body には `Acceptlst_Information` が空で、`Physician_Code=0001` のみが echo されている。

`trialsite` では医師 0001 が掲載されているが、API 側で doctor seed が欠落しているため Task-A/B の UI 受付／予約とも突合不可。`PHASE2_PROGRESS.md#W60` と同 Blocker として `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` および `PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` に記載した。

## 次アクション
- doctor seed 復旧後に再実行し、`Api_Result=00`（受付あり）または `21`（受付なし）を目標とする。
- UI before/after（Department=01 / Physician=0001）を GUI 端末で撮影し `artifacts/orca-connectivity/20251120TrialAcceptCrudZ1/ui/` に保存する（現状ディレクトリ未作成）。
- CRUD 手順では常に `trialsite` の注意喚起（実データ禁止／定期リセット）を README とログへ引用する。
