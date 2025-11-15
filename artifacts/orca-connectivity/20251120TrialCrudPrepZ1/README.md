# RUN_ID=20251120TrialCrudPrepZ1 フィールドメモ

## 1. 事前確認（2025-11-20 13:00 JST）
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3（最終更新 2025-11-19）を再確認し、P0 + CRUD API セットは **WebORCA トライアル** (`https://weborca-trial.orca.med.or.jp/`) かつ Basic 認証 `trial/weborcatrial` を唯一の接続形態とする方針を明文化。書込み操作は「トライアル環境限定で新規登録／更新／削除 OK」と Runbook/ログ/証跡で統一する必要がある。
- `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` の Snapshot Summary（2025-11-19 付け）を参照し、最新の公開案内・利用不可機能を確認。UI 操作や curl 証跡へ引用する際は本日時点の更新日（2025-11-19）を明示する。

## 2. トライアル環境での CRUD 方針
- **ポリシー**: 「新規登録／更新／削除 OK（トライアル環境でのみ）」をすべてのログに記載し、書込み結果は `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と本 RUN_ID 配下 (`artifacts/orca-connectivity/20251120TrialCrudPrepZ1/{data-check,crud,ui}`) へ保存する。
- **コマンド統一**: HTTP 実行例は `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/<endpoint> -H 'Content-Type: application/json' -d @payloads/<file>.json` 形式へ揃え、`Api_Result` と入力 ID を併記したログ (`crud/<endpoint>/request.json`, `response.json`, `curl.log`) を残す。
- **禁則引用**: `trialsite.md#limit`（「お使いいただけない機能等」）に列挙されたプログラム更新・レセプト一括作成などは実行禁止。該当する操作要求が出た場合は節名と URL（2025-11-19 snapshot）を Blocker として `logs/2025-11-20-orca-trial-crud.md` に貼り付ける。

## 3. 環境制約（2025-11-20 13:05 JST）
- 本 CLI サンドボックスは外部ネットワーク（`weborca-trial.orca.med.or.jp:443`）および GUI へのアクセスが制限されているため、現時点で WebORCA トライアル UI へログインしたり `curl` で CRUD を実行することができない。
- 以降の作業者はネットワーク制限のない端末（例: WSL2 / macOS）から再実行し、`dns/` と `tls/` で疎通テストを取得した後に CRUD/画面証跡を採取する。

## 4. ディレクトリ構成とリンク
- `dns/`, `tls/`: 事前確認 (`nslookup`, `dig`, `openssl s_client`) を保存するスペース。未実施のため空。
- `data-check/`: 患者 00000001 / 医師 00001 / 保険 06123456 の受付・予約・診療行為の有無を記録するメモを配置。現在は環境制約のためステータス未取得。
- `crud/`: `acceptmodv2`, `appointmodv2`, `medicalmodv2` などエンドポイント単位でサブフォルダを作り、リクエスト・レスポンス・スクリーンショットを格納予定。
- `ui/`: Department=01 / Physician=00001 の一覧画面キャプチャを配置（操作日時と「trial/weborcatrial 利用」をキャプションへ記す）。

## 5. Next Actions
1. ネットワーク許可済み端末から `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/acceptlstv2 -H 'Content-Type: application/json' -d @payloads/acceptlst_patient00000001.json` 等を再実行し、`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` にタイムスタンプ + `Api_Result` を追記。
2. UI（スターメニュー → 01 医事業務）で患者 00000001 の受付・予約・診療行為を確認し、before/after のスクリーンショットを `ui/` へ保存。
3. 欠落データを補完する際は `trialsite.md#limit` を確認し、禁止事項に該当しないことを確認した上で CRUD を実施。Blocker 発生時は引用節と今後の案（例: UI による代替）を記載する。
