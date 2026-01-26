# ORCA データ準備 実行メモ

- RUN_ID: 20260126T214708Z
- 実施日: 2026-01-26
- 環境: Local WebORCA (docker/orca/jma-receipt-docker)
- ORCA 接続:
  - 直接呼び出し: http://localhost:8000 (API prefix=/api)
  - server-modernized からの接続: http://host.docker.internal:8000 (ORCA_API_SCHEME=http, ORCA_MODE=weborca)
- 認証: Basic ormaster / change_me

## 実施内容
1. 患者登録 (patientmodv2 class=01)
   - request: patientmodv2_auto_full3_1..4.xml
   - Api_Result: K0 (登録終了)
   - 採番: 00005/00006/00007/00008
2. 受付登録 (/orca/visits/mutation)
   - patientId: 00005/00006/00007/00008
   - Api_Result: 00 (受付登録終了)
3. 受付一覧 (/orca/visits/list)
   - Api_Result: 13 (対象がありません)
   - recordsReturned: 0

## 証跡
- requests/
  - patientmodv2_auto_full3_*.xml
  - visit_mutation_00005..00008.json
  - visit_list_2026-01-27.json
- responses/
  - patientmodv2_auto_full3_*.xml
  - visit_mutation_00005..00008.json
  - visit_list_2026-01-27.json
- logs/
  - patientmodv2_auto_full3.log
  - patientmodv2_auto_full3_ids.log
  - visit_mutation.log
  - visit_list.log

## 補足
- visitptlstv2 (受付一覧) が Api_Result=13 のため、Reception UI は空表示のまま。
  ORCA 側の来院一覧生成条件（tbl_jyurrk/view_q004 反映）を別途確認する。
