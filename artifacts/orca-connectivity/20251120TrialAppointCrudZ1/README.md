# RUN_ID=20251120TrialAppointCrudZ1 予約一覧（参照）

- 参照ドキュメント: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3、`trialsite.md` Snapshot Summary（stat: 2025-11-15 08:24 JST）。公開注意事項「新規登録／更新／削除 OK（トライアルのみ）」「実在データ投入禁止」「お使いいただけない機能は #limit 参照」を README/log に明記。
- 実行環境: WSL2 Ubuntu 24.04.3 LTS（`nslookup`/`openssl` は RUN_ID=`20251120TrialConnectivityWSLZ1` を再利用）。
- API: `POST https://weborca-trial.orca.med.or.jp/api01rv2/appointlstv2?class=01`（`Content-Type: application/json`）。payload は `payloads/appointlst.json` をコピーした `crud/appointlstv2/payload.appointlst.json`。

## curl 結果
| タイムスタンプ (JST) | ログ | 主な応答 |
| --- | --- | --- |
| 13:11:26 | `crud/appointlstv2/curl_2025-11-15T131126+0900.log` | class パラメータ無し。HTTP 200 / `Api_Result=91`（処理区分未設定）。通信経路健全性のみ確認。 |
| 13:11:56 | `crud/appointlstv2/curl_class01_2025-11-15T131156+0900.log` | `class=01` へ切替＋`Physician_Code=00001` 指定で HTTP 200 / `Api_Result=13`（診療内容情報が存在しません）。 |
| 13:18:58 | `crud/appointlstv2/curl_class01_retry_2025-11-15T131858+0900.log` | `Physician_Code=0001`／`Medical_Information="内科"` に更新しても HTTP 200 / `Api_Result=12`（ドクターが存在しません）。 |

`trialsite` の「登録されている初期データ」には医師コード `0001`〜`0010` が掲載されているが、API 応答ではドクター未登録扱いとなる。`docs/server-modernization/phase2/PHASE2_PROGRESS.md#W60` にも記載の通り doctor seed 欠落が既知 Blocker のため、Task-A UI との突合は未完了としてログへ記録した。

## 証跡構成
- `crud/appointlstv2/`
  - `curl_*.log`: `-vv` 付き HTTP 証跡
  - `payload.appointlst.json`: 実行 payload
- `README.md`（本ファイル）

## Blocker / 次アクション
- Doctor seed が欠落しているため `Api_Result=00` を取得できない。`trialsite`（職員情報 1010 行）と API 結果が矛盾している点を `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と `PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` へ反映済み。
- UI での前後比較は未取得（CLI 環境のため）なので、GUI 端末で Department=01 / Physician=0001 の画面キャプチャを別途採取し `ui/` ディレクトリへ追加する。`trial/weborcatrial` で実施し、「公開環境につき実データ登録禁止」をキャプションへ記載する。
