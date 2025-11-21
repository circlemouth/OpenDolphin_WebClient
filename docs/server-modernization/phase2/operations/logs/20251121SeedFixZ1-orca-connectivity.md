# ORCA connectivity log (RUN_ID=20251121SeedFixZ1)

- 対象: `http://100.102.17.40:8000`（Basic `ormaster/change_me`）。平文 HTTP、TLS なし。
- 目的: ドクターコード `0001` と患者 `00000001` 登録後に `acceptlstv2` / `appointlstv2` / `medicalmodv2` を `Api_Result=00` で再取得する。
- 証跡: `artifacts/orca-connectivity/20251121SeedFixZ1/{crud,trace,blocked,README.md}`（Basic 認証は curl ログに出力せず）。

## 実施内容
1. ドクター存在確認: `/api01rv2/system01lstv2?class=02` を Base_Date=`2025-11-21` と `2024-01-01` で実行 → いずれも `Api_Result=11`（「対象がありません」）。(trace/system01lstv2*, headers/response 保存)
2. 患者登録: `/api/orca12/patientmodv2?class=01` を auto ナンバリング（`Patient_ID=*`, `Mod_Key=2`）で実行。氏名を全角に変更・Payment_Information を省略したところ `Api_Result=00` で `Patient_ID=00001` が採番された。(crud/patientmodv2/response.xml)
   - 明示的に `Patient_ID=00000001`（8桁）、7桁/6桁/5桁指定は `P1`（桁数不一致や「管理連番以下にして下さい」）で失敗。(blocked/patientmodv2-api/response.xml ほか)
3. 受付登録: `/api/orca11/acceptmodv2?class=01` を患者 `00001` で実行 → `Api_Result=14`「ドクターが存在しません」。Physician_Code を空/10001 にしても同様。(crud/acceptmodv2/response.xml)
4. 受付一覧: `/api01rv2/acceptlstv2?class=01` を Physician_Code 空で実行 → `Api_Result=21`「対象の受付はありませんでした」。医師指定ありの取得は未実施（医師未登録のため）。(crud/acceptlstv2/response.xml)
5. 予約一覧: `/api01rv2/appointlstv2?class=01` を Physician_Code=`0001` で実行 → `Api_Result=12`「ドクターが存在しません」。(crud/appointlstv2/response.xml)
6. 診療行為登録: `/api/api21/medicalmodv2?class=01` を患者 `00001` で実行 → `Api_Result=14`「ドクターが存在しません」。(crud/medicalmodv2/response.xml)

## ブロッカー / 次アクション
- ドクターマスタ作成 API/GUI が不明で、`Physician_Code=0001/10001` いずれも未登録のまま。`system01lstv2` で doctor list が空のため、受診・予約・診療行為はいずれも「ドクターが存在しません」で止まる。
- 患者番号は auto 採番で `00001` まで登録できたが、8桁指定（`00000001`）は桁数/管理連番チェックで拒否される設定。8桁での登録を行うには管理連番設定の変更、または該当 UI/マスタ操作手順の確認が必要。
- 次の再測定では以下を実施する:
  - ドクター登録手順（API 名称/GUI メニュー）を確認し、`Physician_Code=0001` を登録。
  - 可能であれば患者番号体系を 8 桁に変更の上で `00000001` を再登録。
  - 受付登録→受付一覧→予約一覧→medicalmodv2 を再測し、`Api_Result=00` を取得。
