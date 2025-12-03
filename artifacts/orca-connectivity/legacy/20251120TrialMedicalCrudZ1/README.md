# RUN_ID=20251120TrialMedicalCrudZ1 診療行為 CRUD

- 参照資料: `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 (API #5)、`trialsite.md` Snapshot Summary（2025-11-15 08:24 JST）、`trialsite`「登録されている初期データ」（患者 00001〜、医師 0001 等）。
- 目的: `/api/api21/medicalmodv2?class=01` で外来患者の行為登録を実施し `Api_Result=00` を得る。
- payload: `payloads/medical_update.json`（患者=00001、医師=0001、Department=01）。`crud/medicalmodv2/payload.medical_update.json` に保存。

## 実行ログ
| JST | ファイル | 応答 | コメント |
| --- | --- | --- | --- |
| 13:16:50 | `curl_class01_2025-11-15T131650+0900.log` | HTTP 200 / `Api_Result=10`（患者番号該当なし） | trialsite 記載に合わせ患者桁数を 5 へ変更する必要が判明。 |
| 13:17:08 | `curl_class01_retry_2025-11-15T131707+0900.log` | HTTP 200 / `Api_Result=14`（ドクターが存在しません） | `Patient_ID` を 00001 に更新後も doctor seed が欠落。 |
| 13:17:41 | `curl_class01_retry2_2025-11-15T131740+0900.log` | HTTP 200 / `Api_Result=14`（ドクターが存在しません） | `Physician_Code=0001` でも 14 継続。 |

`docs/server-modernization/phase2/PHASE2_PROGRESS.md#W60` で報告済みのとおり、Trial で doctor master（`system01lstv2 class=02`）が空のため診療行為登録は成功しない。`trialsite` の職員情報（医師 `0001/0003/...`）と API 応答が食い違っている点を Blocker として `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` に記録した。

## 証跡
- `crud/medicalmodv2/*.log`: `curl -vv --data-binary` の stderr/stdout を tee で保存。
- `payload.medical_update.json`: 実行 payload。
- 追加予定: UI before/after（診療行為一覧）および `trace/`（必要時）。

## 注意
- trialsite の Snapshot Summary に基づき「新規登録／更新／削除 OK（トライアルのみ）」「登録なさった情報は誰でも参照でき定期的に消去」を README とログへ明示。
- 行為削除 (`Medical_Mode=Delete`) を実施すると `Api_Result=K1` になる可能性があるため、実施時は `trialsite.md#limit` を引用して Blocker として扱う。現時点では登録自体が doctor seed 欠落で停止している。
