# WebORCA Trial systeminfv2 取得 (RUN_ID=20260112T135435Z)

## 実施目的
- patientmemomodv2 の 502 要因切り分けのため、Trial のバージョン情報（Local_Version 等）を取得する。

## 実行コマンド
```bash
curl --http1.1 -sS -u trial:weborcatrial \
  -H 'Content-Type: application/xml; charset=UTF-8' \
  -H 'Accept: application/xml' \
  --data-binary @artifacts/orca-connectivity/20260112T135435Z/requests/systeminfv2_request.xml \
  'https://weborca-trial.orca.med.or.jp/api/api01rv2/systeminfv2'
```

## 結果サマリ
- Api_Result=0006（リクエスト時間と受付時間に30分以上のずれ）
- Jma_Receipt_Version: 050200-1
- Local_Version: S-050200-1-20250327-1
- New_Version: S-050200-1-20250327-1

## 判定
- patientmemomodv2 の公式追加日（2025-08-26）より前の Local_Version と推定されるため、WebORCA Trial 側で API 未搭載/未公開の可能性が高い。

## 証跡
- request: `artifacts/orca-connectivity/20260112T135435Z/requests/systeminfv2_request.xml`
- response: `artifacts/orca-connectivity/20260112T135435Z/responses/systeminfv2_response.xml`
