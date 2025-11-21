# 20251121ErrorMatrixZ1 業務系エラー採取（親 RUN_ID=20251120T193040Z）

- 接続先: `http://100.102.17.40:8000`（Basic: ormaster/change_me、Authorization はすべて `<MASKED>`）。
- 目的: 業務系 API で不正入力時の HTTP/Api_Result を採取し、trace/httpdump に保存。
- 取得結果:
  - `POST /api01rv2/system01dailyv2?class=00`（Request_Number=99）→ HTTP200 / `Api_Result=91` / `Api_Result_Message=リクエスト番号がありません`（`trace_http/trace_http_system01dailyv2_invalid.txt`, `httpdump/system01dailyv2_invalid/`）。
  - `POST /api01rv2/acceptlstv2?class=01`（Acceptance_Date=2000-01-01, Physician_Code=99999）→ HTTP200 / `Api_Result=13` / `Api_Result_Message=ドクターが存在しません`（`trace_http/trace_http_acceptlstv2_invalid_doctor.txt`, `httpdump/acceptlstv2_invalid_doctor/`）。
  - `POST /api/api21/medicalmodv2?class=01`（Patient_ID=999999）→ HTTP200 / `Api_Result=10` / `Api_Result_Message=患者番号に該当する患者が存在しません`（`trace_http/trace_http_medicalmodv2_invalid_patient_alt.txt`, `httpdump/medicalmodv2_invalid_patient_alt/`）。
- 備考: `/api21/medicalmodv2`（ルート直下）へは HTTP405 (`Allow=OPTIONS, GET`) を返したため `httpdump/medicalmodv2_invalid_patient/` に併記。検証対象は `/api/api21/...` の 200/Api_Result=10 の方を採用。
