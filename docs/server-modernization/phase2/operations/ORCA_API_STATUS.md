# ORCA ↔ モダナイズ版サーバー API 差異サマリ（2025-11-19 Trial 切替）

> 接続手順・RUN_ID 発行・CRUD ログ運用は `ORCA_CONNECTIVITY_VALIDATION.md` §0 を参照。`tmp/orca-weekly-summary.*` の貼り付け位置や curl 雛形も同 Playbook のみを一次情報とする。

## API 状況とトライアル再検証方針

### 2.1 コア外来 API（Matrix No.1-18）
| No | ORCA API (class) | 直近期の実測 / RUN_ID | トライアル再検証＆CRUD 可否 |
| --- | --- | --- | --- |
| 1 | `/api01rv2/patientgetv2` (`class=id`) | 2025-11-13 WebORCA 本番で `HTTP 404`（`RUN_ID=20251113TorcaP0OpsZ1/Z2`）。 | Trial では GET が開放されているため `curl -u trial:weborcatrial -H 'Accept: application/json' 'https://weborca-trial.orca.med.or.jp/api/api01rv2/patientgetv2?class=00&patientid=000001'` を実行し、レスポンス JSON と `Api_Result` を `artifacts/.../api01rv2_patientgetv2/` に保存する。参照系のみ（CRUD なし）。 |
| 2 | `/orca14/appointmodv2` (`class=01/02`) | 2025-11-13 WebORCA 本番で `HTTP 405`（`RUN_ID=20251113TorcaP0OpsZ1/Z2`）。 | Trial では予約の新規登録／更新／削除が許可されている。`curl -u trial:weborcatrial -H 'Content-Type: application/json; charset=Shift_JIS' --data-binary '@assets/orca-api-requests/02_appointmodv2_request.json' 'https://weborca-trial.orca.med.or.jp/orca14/appointmodv2?class=01'` を送信し、作成した予約を UI で確認 → `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` に操作概要と削除手順を記録する。 |
| 3 | `/api21/medicalmodv2` (`class=01-03`) | 2025-11-13 WebORCA 本番で `HTTP 405`／`Api_Result=14`（`RUN_ID=20251113TorcaP0OpsZ1`, `20251113TorcaDoctorManualW60`）。 | Trial で診療行為を登録し、`curl -u trial:weborcatrial -H 'Content-Type: application/json; charset=Shift_JIS' --data-binary '@assets/orca-api-requests/03_medicalmodv2_request.json' 'https://weborca-trial.orca.med.or.jp/api21/medicalmodv2?class=01'` を実行。`trace/medicalmodv2_{request,response}.json` と ORCA UI の証跡を保存し、実際に登録された行為を API/画面で削除するまで記録する。CRUD OK（Trial のみ）。 |
| 4 | `/orca11/acceptmodv2` (`class=01/02`) | 2025-11-13 WebORCA 本番で `HTTP 405`（`RUN_ID=20251113TorcaP0OpsZ1/Z2`）。 | Trial 受付は書き込み可。`curl -u trial:weborcatrial -H 'Content-Type: application/json; charset=Shift_JIS' --data-binary '@assets/orca-api-requests/04_acceptmodv2_request.json' 'https://weborca-trial.orca.med.or.jp/orca11/acceptmodv2?class=01'` を POST し、受付番号や患者情報を記録 → 作業ログに受付取得/取消手順を残す。 |
| 5 | `/api01rv2/acceptlstv2` (`class=01-03`) | 2025-11-13 WebORCA 本番で `Api_Result=00`（`RUN_ID=20251113TorcaP0OpsZ1/Z2/Z3`）。 | Trial でも同様の JSON を `curl -u trial:weborcatrial -H 'Content-Type: application/json; charset=Shift_JIS' --data-binary '@assets/orca-api-requests/05_acceptlstv2_request.json' 'https://weborca-trial.orca.med.or.jp/api01rv2/acceptlstv2?class=01'` で取得。取得結果は参照のみだが、Trial 側で受付 CRUD を行った後の差分を必ず記録する。 |
| 6 | `/api01rv2/appointlstv2` (`class=01`) | 2025-11-13 は測定対象外。 | Trial で予約一覧が取得できることを確認し、`RUN_ID=20251119TorcaTrialCrudZ1` 以降で `curl -u trial:weborcatrial .../api01rv2/appointlstv2?class=01` を取得。予約 CRUD 後の反映タイムラグを `artifacts/.../appointlstv2/Δtimestamp.md` へまとめる。 |

### 2.2 その他 API（Matrix No.19-53）
| API | 直近期の実測 / RUN_ID | トライアル再検証＆CRUD 可否 |
| --- | --- | --- |
| `/api21/medicalmodv23` | 2025-11-13 WebORCA 本番 `HTTP 405`（`RUN_ID=20251113T002806Z`）。 | Trial では初診算定日の XML POST を受け付ける。`curl -u trial:weborcatrial -H 'Content-Type: application/xml; charset=Shift_JIS' --data-binary '@operations/assets/orca-api-requests/xml/46_medicalmodv23_request.xml' 'https://weborca-trial.orca.med.or.jp/api21/medicalmodv23?class=01'` を実行し、登録→取消までを CRUD ログに記録。 |
| `/orca06/patientmemomodv2` | 2025-11-13 本番 `HTTP 405`（`RUN_ID=20251113T002806Z`）。 | Trial では患者メモの登録/更新/削除が可能。XML テンプレを送信後に `Memo_ID` を控え、削除までの一連を `artifacts/.../patientmemomodv2/README.md` にまとめる。 |
| `/orca31/hspmmv2` | 2025-11-13 本番 `HTTP 405`。 | Trial では `Perform_Month` を指定した XML を POST し、`Api_Result=00` を取得できる。`RUN_ID=20251119TorcaTrialCrudZ2` で `curl -u trial:weborcatrial --data-binary '@operations/assets/orca-api-requests/xml/39_hspmmv2_request.xml' 'https://weborca-trial.orca.med.or.jp/orca31/hspmmv2'` を取得し、帳票 UI と突合。参照のみ。 |
| `/orca31/hsptinfmodv2` | 未実測（本番 405 想定）。 | Trial で入退院登録の CRUD を実施し、`Request_Number=08/09` の XML とレスポンスを保存。病棟コードは Trial UI で確認した値を利用し、書き込みログへ必ず Runbook 参照を追記する。 |
| `/orca31/hsacctmodv2` | 未実測（本番 405 想定）。 | Trial で外泊/食事/会計の作成・取消を順に実行。各 Request_Number ごとに `curl` コマンドと ORCA UI キャプチャを保存し、差分計算は `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md#hsacctmodv2` に記録。 |
| `/orca32/hsptevalmodv2` | 未実測（本番 405 想定）。 | Trial で ADL/医療区分データを XML で送信。登録後に `hsptevalv2` で読み戻し、CRUD 可否を確認する。 |
| `/orca101/manageusersv2` | 未実測（本番 405 想定）。 | Trial の管理者アカウントを対象にユーザー CRUD の挙動を確認。POST 実行後は必ず `trial` アカウントでログイン確認を行い、追加したユーザーを削除するまで証跡化する。 |
| `/orca21/medicalsetv2` | 未実測（本番 405 想定）。 | 診療セットの POST/PUT/DELETE を Trial で実施し、`Medical_Info` 配列のシリアライズ形式を `artifacts/.../medicalsetv2/medicalset_{request,response}.xml` に保存。 |
| `/orca31/birthdeliveryv2` | 未実測（本番 405 想定）。 | 出産育児一時金登録を Trial で行い、`Request_Number=01/02` の双方を送信。公費区分や保険組み合わせの CRUD 手順とログ保存先を `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` に追記。 |

---

- 参考資料: [`assets/orca-api-spec/manifest.json`](assets/orca-api-spec/manifest.json)、[`logs/2025-11-13-orca-connectivity.md`](logs/2025-11-13-orca-connectivity.md)、[`notes/orca-api-field-validation.md`](../notes/orca-api-field-validation.md)、[`ORCA_HTTP_404405_HANDBOOK.md`](logs/ORCA_HTTP_404405_HANDBOOK.md)、[`MODERNIZED_REST_API_INVENTORY.md`](../../MODERNIZED_REST_API_INVENTORY.md)
