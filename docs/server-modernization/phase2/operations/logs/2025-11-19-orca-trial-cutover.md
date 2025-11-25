# 2025-11-19 WebORCA Trial Cutover ログ

## ゴール
- 旧 `weborca.cloud.orcamo.jp` や `ORCAcertification/` 由来の参照専用ルールを廃止し、WebORCA トライアルサーバー（`https://weborca-trial.orca.med.or.jp`, `trial/weborcatrial`）＋ CRUD 許可ポリシーへ統一する。
- Runbook / README / マネージャーチェックリストに同一文言で「新規登録／更新／削除 OK（トライアル環境でのみ）」、`curl -u trial:weborcatrial`、`RUN_ID=TorcaTrialCrudZ#` を掲載し、Evidence 動線を `artifacts/orca-connectivity/TRIAL_SWITCH/` に揃える。

## 変更サマリ（2025-11-19T15:00 JST）
1. `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` 冒頭へ `Snapshot Summary` を追加し、接続情報・CRUD 許可根拠・利用不可機能・初期データを 5 行で要約。引用先を Runbook から直接参照できるようにした。
2. `docs/server-modernization/phase2/operations/assets/orca-trialsite/README.md` に `Runbook/ログ向け引用テンプレ` を追加。`curl -u trial:weborcatrial` 統一、`artifacts/orca-connectivity/TRIAL_SWITCH/` へのログ保存、seed/PRF ファイルを「参考アーカイブ（Trial CRUD で再登録）」と明記。
3. `docs/web-client/README.md` ORCA セクションを更新し、Trial/CURD 方針・`artifacts/orca-connectivity/TRIAL_SWITCH/`・`2025-11-19-orca-trial-cutover.md` 参照を追記。ORCA ハブから `assets/orca-trialsite/README.md` へ導線を追加。
4. `artifacts/orca-connectivity/TRIAL_SWITCH/README.md` を新設し、Evidence 保存方法と seed 取り扱い（参考アーカイブ扱い）を定義。
5. `docs/web-client/planning/phase2/DOC_STATUS.md` の「モダナイズ/外部連携（ORCA）」行を Trial 切替完了版へ更新し、Runbook/README/マネージャーチェックリスト更新済みであることを明示（別途コミット差分参照）。

## Evidence & 参照
- `artifacts/orca-connectivity/TRIAL_SWITCH/README.md` : Trial 切替証跡ハブ（RUN_ID=`20251119TorcaTrialCutoverZ1`）。
- `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` : CRUD 実測テンプレ。以降の CRUD 実測はここに追記し、`TRIAL_SWITCH` 配下へ保存する。
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` : Runbook 本体。`Snapshot Summary` の節番号と CRUD ログ/Artifacts を参照すること。
- `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` : Task-D（Trial 切替）を完了扱いにし、`artifacts/orca-connectivity/TRIAL_SWITCH/` を証跡列へ追記済み（Task1〜3 で更新されているため今回差分なし）。

## 作業メモ
- すべての curl 例は `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/<api>` 形式に差し替え済み。`curl --cert-type P12` や `ORCA_PROD_*` 名残が残っていないかは `rg -n "ORCA_PROD" docs -g"*.md"` で確認する。
- PRF/seed 資料（例: `server-modernized/db/api21_medical_seed.sql`）は参照アーカイブ扱い。必要情報は Trial CRUD で上書きできるため、本番ライクなデータ移送は禁止。
- CRUD 実測のたびに `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` へ RUN_ID・操作内容・削除結果・Evidence パスを必ず追記する。操作後の削除ログも撮り、`TRIAL_SWITCH` 配下に格納する。

## 次アクション
- [ ] Trial CRUD テンプレの初回 RUN（`RUN_ID=20251119TorcaTrialCrudZ1`）を実施し、`artifacts/orca-connectivity/TRIAL_SWITCH/` 配下へサンプル Evidence を保存する。
- [ ] `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` テンプレへ実データを追記し、`DOC_STATUS.md` W22 表に CRUD 証跡のリンクを記載する。
- [ ] `docs/web-client/operations/mac-dev-login.local.md` や Runbook で旧 URL/資格情報が残っていないか `rg -n 'weborca' docs/web-client -g"*.md"` で再確認する。
