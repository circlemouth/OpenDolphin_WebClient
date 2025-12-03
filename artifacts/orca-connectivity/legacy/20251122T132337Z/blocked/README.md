# Blockers (RUN_ID=20251122T132337Z)

- PatientIdDigits: `patientmodv2` で `Patient_ID=00000001` を指定すると `Api_Result=P1`（桁数不一致）。`tbl_syskanri` 管理番号（kanricd=1009/kbncd=1065=ORCBPTNUMCHG）を8桁化する設定変更は本環境では適用不可と判断し、6桁運用でクローズ。証跡: `blocked/patientmodv2-8digit/response_20251122T045621Z.xml`（HTTP200/ヘッダー・trace 同梱）。設定例: `artifacts/orca-connectivity/20251113T084607Z/patient_id_rules/kanritbl_update.sql`（参照のみ、未適用）。
- Medicalmodv2: 保険組合せ `0001` + `Medical_Class=210` + `Medication_Code=620001402` で `Api_Result=00` / 警告なしを確認済み。再同日登録は `Api_Result=20` となるため、`Medical_Uid` 持ち回し or 診療日変更で回避。旧警告 W02/M05/M01 は解消済み（`crud/medicalmodv2/request_20251122T051828Z.xml` 応答一式参照）。
