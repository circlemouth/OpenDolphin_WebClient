# ORCA 接続ログ: insuranceinf1v2

- RUN_ID: 20260113T102157Z
- 対象: insuranceinf1v2 / WebORCA Trial
- 認証: Basic (trial / <MASKED>)

## 試行 1: WebORCA Trial 直叩き（/api/api01rv2, insuranceinfreq）
- URL: https://weborca-trial.orca.med.or.jp/api/api01rv2/insuranceinf1v2
- Request: artifacts/orca-connectivity/20260113T102157Z/insuranceinfreq.xml
- Response headers: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_api_headers.txt
- Response body: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_api_body.xml
- 結果: HTTP 200 / Api_Result=00

## 試行 2: WebORCA Trial 直叩き（/api01rv2, insuranceinfreq）
- URL: https://weborca-trial.orca.med.or.jp/api01rv2/insuranceinf1v2
- Request: artifacts/orca-connectivity/20260113T102157Z/insuranceinfreq.xml
- Response headers: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_noapi_headers.txt
- Response body: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_noapi_body.xml
- 結果: HTTP 200 / Api_Result=00

## 試行 3: WebORCA Trial 直叩き（/api/api01rv2, insuranceinf1v2req）
- URL: https://weborca-trial.orca.med.or.jp/api/api01rv2/insuranceinf1v2
- Request: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2req.xml
- Response headers: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_api_v2req_headers.txt
- Response body: artifacts/orca-connectivity/20260113T102157Z/insuranceinf1v2_api_v2req_body.xml
- 結果: HTTP 200 / Api_Result=91 (処理区分未設定)

## 試行 4: server-modernized 経由（/api/api01rv2, insuranceinfreq）
- URL: http://localhost:19092/openDolphin/resources/api/api01rv2/insuranceinf1v2
- Request: artifacts/orca-connectivity/20260113T102157Z/insuranceinfreq.xml
- Response headers: artifacts/orca-connectivity/20260113T102157Z/local_insuranceinf1v2_headers.txt
- Response body: artifacts/orca-connectivity/20260113T102157Z/local_insuranceinf1v2_body.xml
- 結果: HTTP 404

## 試行 5: server-modernized 経由（/api01rv2, insuranceinfreq）
- URL: http://localhost:19092/openDolphin/resources/api01rv2/insuranceinf1v2
- Request: artifacts/orca-connectivity/20260113T102157Z/insuranceinfreq.xml
- Response headers: artifacts/orca-connectivity/20260113T102157Z/local_insuranceinf1v2_noapi_headers.txt
- Response body: artifacts/orca-connectivity/20260113T102157Z/local_insuranceinf1v2_noapi_body.xml
- 結果: HTTP 404

## 補足
- Trial 直叩きは insuranceinfreq で Api_Result=00 を確認。
- server-modernized 側で insuranceinf1v2 が 404 のため、経路の再確認が必要。
