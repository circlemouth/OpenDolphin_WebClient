# Blocked items (RUN_ID=20251121T153200Z)

1. データギャップ: doctor/patient seed 不足
   - `/api01rv2/acceptlstv2` = `Api_Result=13 (ドクターが存在しません)`。
   - `/api01rv2/appointlstv2` = `Api_Result=12 (ドクターが存在しません)`。
   - `/api/api21/medicalmodv2` = `Api_Result=10 (該当患者なし)`。
   - Evidence: `crud/{acceptlstv2,appointlstv2,medicalmodv2}/response_2025-11-21T06-4*.xml`。
   - TODO: ORMaster 側に医師コード `0001` / 患者 `00000001` を投入し、再実測で `Api_Result=00` を確認。

2. POST API 未開放（HTTP 405）
   - `/orca11/acceptmodv2`, `/orca14/appointmodv2`, `/orca06/patientmemomodv2`, `/orca42/receiptprintv3` が `Allow: OPTIONS, GET` で拒否。
   - Evidence: `crud/<api>/headers_2025-11-21T06-5*.txt`。
   - TODO: 100.102.17.40:8000 の経路で POST を許可するか、開放不可の場合は `TrialLocalOnly→HTTP405 (Local)` として Runbook/Matrix の Blocker を更新。
