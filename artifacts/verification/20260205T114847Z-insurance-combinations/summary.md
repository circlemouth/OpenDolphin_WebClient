# ORCA Trial insuranceCombinationNumber 取得

- RUN_ID: 20260205T114847Z-insurance-combinations
- API: POST https://weborca-trial.orca.med.or.jp/api/api01rv2/patientlst6v2
- 認証: ORCA Trial Basic (公開情報 / 値は記録しない)
- Request: JSON / Reqest_Number=01 / Patient_ID=00001〜00011
- 出力: insurance-combination.tsv（患者ID / Insurance_Combination_Number / InsuranceProvider_Class / InsuranceProvider_WholeName / PublicInsurance）

NOTE:
- Reqest_Number は処理区分であり、任意文字列にすると Api_Result=E91（処理区分未設定）。
