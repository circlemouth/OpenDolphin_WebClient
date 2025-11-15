# 2025-11-20 データ確認メモ（RUN_ID=20251120TrialCrudPrepZ1）

- 対象: 患者 `00000001` / 医師 `00001` / 保険 `06123456`。UI 上で直近日の **受付・予約・診療行為** が揃っているかを判定する。
- 参考ドキュメント:
  - `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3 P0 + CRUD API セット
  - `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`（Snapshot 2025-11-19）
- 期待証跡: `artifacts/orca-connectivity/20251120TrialCrudPrepZ1/ui/` に UI キャプチャ、`crud/<endpoint>/` に補完 CRUD のリクエスト/レスポンス、`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` へのログ追記。
- 現状: CLI サンドボックスから WebORCA トライアル UI / API へのアクセス権限が無く、ブラウザ画面や API 応答を取得できていない。
- 次アクション:
  1. ネットワーク許可済み端末で Basic 認証を通し、受付 (`acceptlstv2`)、予約 (`appointlstv2`)、診療行為 (`medicalgetv2` or `medicalmodv2`) を before/after で保存。
  2. データ欠落時は「トライアル環境のみ CRUD 可」とログへ明記の上、UI または `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/orca11/acceptmodv2 ...` 等で補完し、`Api_Result`/ID を残す。
  3. 禁止項目（`trialsite.md#limit`）に該当する操作が必要になった場合は Blocker として扱い、引用と対応案を `logs/2025-11-20-orca-trial-crud.md` へ記載する。
