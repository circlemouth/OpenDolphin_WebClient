# SOAP 入力の保存/再表示（server-modernized 連携確認）

- RUN_ID: 20260204T212600Z-soap-ui-restart-fixed
- 実施日時: 2026-02-04T21:25:25.095Z
- Base URL: http://localhost:5176
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- SOAP テキスト: SOAPテスト 20260204T212600Z-soap-ui-restart-fixed
- 再表示結果: NG
- 再表示方法: DocumentTimeline の SOAP履歴
- リロード: 未実施（履歴表示で確認）
- 保存ボタン disabled: false
- Subjective editable: true
- Subjective readonly attr: none
- 入力後Subjective値: SOAPテスト 20260204T212600Z-soap-ui-restart-fixed
- SOAP guard: none
- SOAP feedback: SOAP server 保存 OK（1 件）
- sessionStorage key: opendolphin:web-client:soap-history:v2:1.3.6.1.4.1.9414.72.103:doctor1
- sessionStorage length: 398
- encounter context key: opendolphin:web-client:charts:encounter-context:v2:1.3.6.1.4.1.9414.72.103:doctor1
- encounter context length: 77
- SOAP history count: 0
- SOAP endpoint requests: 1
- SOAP endpoint responses: 1
- SOAP request failures: 0
- console error count: 3351
- console warning count: 0
- page error count: 0

## Screenshots

- screenshots/01-soap-saved.png
- screenshots/02-soap-history.png

## SOAP Endpoint Requests

- POST http://localhost:5176/orca/chart/subjectives

## SOAP Endpoint Responses

- 200 http://localhost:5176/orca/chart/subjectives

## SOAP Endpoint Failures

- なし
