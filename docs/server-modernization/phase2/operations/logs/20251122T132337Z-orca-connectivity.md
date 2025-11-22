# ORCA connectivity log (RUN_ID=20251122T132337Z)

- 接続先: `http://100.102.17.40:8000`（mac-dev-login.local.md 記載の開発用 ORCA、Basic=`ormaster/change_me`、平文HTTP）
- コマンド例: `curl -sS -u ... -H 'Accept: application/xml' -H 'Content-Type: application/xml' --retry 2 --retry-all-errors --max-time 20 --data-binary @<request.xml> <BASE>/<path>?class=01`（POST 系は `/api/orca11|14|12/...` を使用）
- 証跡: `artifacts/orca-connectivity/20251122T132337Z/{crud,blocked,trace,dns,tls}`（dns/tls は trial 参照のまま／HTTP接続のため TLS 未使用）
- 方針: 医師コード・患者番号の桁数/体系は **ORCA 仕様を優先** し、モダナイズ側は ORCA 設定に従属する（8桁要求は ORCA 管理番号設定変更が前提）

## 実行結果（mac-dev 再測）
- `/api01rv2/system01lstv2?class=02`（POST, Base_Date=2025-11-22）: HTTP200 / `Api_Result=00`、Dr `10000/10001` を取得  
  - `crud/system01lstv2/request_class02_20251122T045446Z.xml`, `response_20251122T045513Z.{headers,xml}`, `trace_20251122T045513Z.log`
- `/api01rv2/system01lstv2?class=06`（診療内容一覧）: HTTP200 / `Api_Result=00`、`Medical_Information=01/02/03/04/05/06/07/99`  
  - `crud/system01lstv2/request_class06_20251122T051620Z.xml`, `response_class06_20251122T051620Z.{headers,xml}`, `trace_class06_20251122T051620Z.log`
- `/api/orca12/patientmodv2` auto ナンバリング（Mod_Key=2, Patient_ID=`*`）: HTTP200 / `Api_Result=K0`、`Patient_ID=00005`（同一患者警告付き）  
  - `crud/patientmodv2/request_20251122T045544Z.xml`, `response_20251122T045544Z.{headers,xml}`, `trace_20251122T045544Z.log`
- `/api/orca12/patientmodv2`（Patient_ID=`00000001` 指定）: HTTP200 / `Api_Result=P1`「患者番号の桁数が違います。」→ 8桁登録不可  
  - `blocked/patientmodv2-8digit/request_20251122T045621Z.xml`, `response_20251122T045621Z.{headers,xml}`, `trace_20251122T045621Z.log`
- `/api/orca11/acceptmodv2?class=01`（Patient_ID=`00005`, Physician_Code=`10000`）: HTTP200 / `Api_Result=00`、`Acceptance_Id=00002`  
  - `crud/acceptmodv2/request_20251122T045705Z.xml`, `response_20251122T045705Z.{headers,xml}`, `trace_20251122T045705Z.log`
- `/api/orca14/appointmodv2?class=01`（Patient_ID=`00005`, Physician_Code=`10000`）: HTTP200 / `Api_Result=00`、`Appointment_Id=00001`  
  - `crud/appointmodv2/request_20251122T045741Z.xml`, `response_20251122T045741Z.{headers,xml}`, `trace_20251122T045741Z.log`
- `/api01rv2/acceptlstv2?class=01`（Physician_Code=`10000`, Acceptance_Date=2025-11-22）: HTTP200 / `Api_Result=00`、`Acceptance_Id=00001/00002`（患者 `00001` / `00005`）  
  - `crud/acceptlstv2/request_20251122T045806Z.xml`, `response_20251122T045806Z.{headers,xml}`, `trace_20251122T045806Z.log`
- `/api01rv2/appointlstv2?class=01`（Physician_Code=`10000`, Appointment_Date=2025-11-22）: HTTP200 / `Api_Result=00`、`Appointment_Id=01`（患者 `00005`）  
  - `crud/appointlstv2/request_20251122T045828Z.xml`, `response_20251122T045828Z.{headers,xml}`, `trace_20251122T045828Z.log`
- `/api/api21/medicalmodv2?class=01`（Patient_ID=`00005`, Physician_Code=`10000`）: HTTP200 / `Api_Result=00`、警告=W02/M05/M01（保険組合せ0・診療種別未設定・点数マスタ未登録）  
  - `crud/medicalmodv2/request_20251122T045858Z.xml`, `response_20251122T045858Z.{headers,xml}`, `trace_20251122T045858Z.log`
- `/api/api21/medicalmodv2?class=01`（保険組合せ=0001、Medical_Class=01、Medication_Code=620001402）: HTTP200 / `Api_Result=00`、警告=M05 のみ  
  - `crud/medicalmodv2/request_20251122T051732Z.xml`, `response_20251122T051732Z.{headers,xml}`, `trace_20251122T051732Z.log`
- `/api/api21/medicalmodv2?class=01`（Medical_Class=210 同日登録）: HTTP200 / `Api_Result=20`「中途データが登録できませんでした」※同日重複  
  - `crud/medicalmodv2/request_20251122T051800Z.xml`, `response_20251122T051800Z.{headers,xml}`, `trace_20251122T051800Z.log`
- `/api/api21/medicalmodv2?class=01`（Medical_Class=210, Perform_Date=2025-11-23）: HTTP200 / `Api_Result=00`（警告なし）  
  - `crud/medicalmodv2/request_20251122T051828Z.xml`, `response_20251122T051828Z.{headers,xml}`, `trace_20251122T051828Z.log`
- 補足: 再測前（04:34Z 台）は Dr/Pt seed 不足で `acceptlstv2=13` / `appointlstv2=12` / `medicalmodv2=10`、`acceptmodv2`/`appointmodv2`/`patientmodv2` は POST 405（証跡: `crud/*/response_20251122T0434*.xml`）。最新版は上記のとおり全件 POST 200 を取得。

## 判定 / Blocker（最終）
- 8桁患者番号: `Patient_ID=00000001` は `Api_Result=P1`（桁数不一致）のまま。`tbl_syskanri` 管理番号（kanricd=1009/kbncd=1065=ORCBPTNUMCHG）の8桁化は本環境で適用不可と判断し、6桁運用でクローズ。証跡: `blocked/patientmodv2-8digit/response_20251122T045621Z.xml`、設定例: `artifacts/orca-connectivity/20251113T084607Z/patient_id_rules/kanritbl_update.sql`（参照のみ）。
- medicalmodv2: 保険組合せ`0001` + `Medical_Class=210` + `Medication_Code=620001402`（診療日をずらす or `Medical_Uid` 持ち回し）で `Api_Result=00` / 警告なしを確認済み。医師コードは ORCA 付与値 `10000/10001` を採用。
- Dr/患者 seed・POST 開放は解消済み（Dr=`10000/10001`, Patient=`00005`, POST=HTTP200）。

## 次アクション（残課題のみ）
- 8桁患者番号が必須となる場合は ORCA 側設定変更（ORCBPTNUMCHG 8桁化）が前提だが、本環境では不可のため記録のみ。
- medicalmodv2 は本番接続時に同パラメータで再確認し、差分があれば Runbook/ステータスに追記。
