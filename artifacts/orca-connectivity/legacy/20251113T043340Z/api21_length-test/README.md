# /api/api21 medicalmodv2 患者番号桁数テスト (RUN_ID=20251113TorcaApi21LenW52)

- 実行UTC: 2025-11-13T04:33:40Z
- コンテナ: jma-receipt-docker-for-ubuntu-2204-orca-1 (image: jma-receipt-weborca:22.04)
- リクエストテンプレート: `tmp/orca-api-payloads/*.json` を `/tmp/orca-api-payloads/` へコピーして使用。
- 共通条件: `curl -s -u ormaster:change_me -H 'Content-Type: application/json; charset=UTF-8' --data-binary @<payload> http://localhost:8000/api/api21/medicalmodv2?class=01`

| ケース | Patient_ID | ペイロード | HTTP | Api_Result | Api_Result_Message |
| --- | --- | --- | --- | --- | --- |
| pid6 | `000001` (6桁) | `medicalmodv2_payload.json` | 200 | 10 | 患者番号に該当する患者が存在しません |
| pid7 | `0000001` (7桁) | `medicalmodv2_payload_7d.json` | 200 | 10 | 患者番号に該当する患者が存在しません |
| ptid | `1` (ORCA `tbl_ptinf.ptid`) | `medicalmodv2_payload_ptid.json` | 200 | 10 | 患者番号に該当する患者が存在しません |
| ptid10 | `0000000001` (内部IDゼロ埋め10桁) | `medicalmodv2_payload_ptid10.json` | 200 | 10 | 患者番号に該当する患者が存在しません |

- DB 設定: `docker exec jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca -c "select * from tbl_syskanri where kanricd in ('0044','1065');"` で `kbncd=1065 (ORCBPTNUMCHG)` の「追加桁数=1」が有効なことを確認。Evidence: `tbl_syskanri_0044_1065.txt`。
- 所見: `/api/api21` ルートは HTTP 200 で到達し `X-Hybridmode: normal` を返却するが、患者 ID の桁数や内部 ID を変えても全て `Api_Result=10`。患者番号桁数設定（7桁化）と実在患者レコードの不整合、もしくは `ptid` とのマッピング不足が原因とみられる。
