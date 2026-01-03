# ORCA実環境連携検証

- RUN_ID（作業）: 20260103T224421Z
- 実行日時: 2026-01-03
- 検証対象: Web クライアント（Reception / Charts / Patients / Administration）
- 実行環境: localhost 開発環境（server-modernized + web-client）
- 証跡: artifacts/webclient/e2e/20260103T224421Z/

## 実行ログ（runId / auditEvent 突合）
- ログイン: 施設ID=1.3.6.1.4.1.9414.72.103 / ユーザー=doctor1
  - session.runId: 20260103T235301Z（logs/session.json）
  - 監査: auth login attempt/success を確認（logs/audit-*.json）
- Reception
  - 画面: /f/1.3.6.1.4.1.9414.72.103/reception
  - 操作: 再取得ボタン押下
  - runIdBadge: 20260103T235301Z / auditEvent.runId: 20260103T235301Z（runIdMatches=true）
  - 証跡: screenshots/reception.png / logs/audit-reception.json
- Charts
  - 画面: /f/1.3.6.1.4.1.9414.72.103/charts
  - 操作: 再取得（可能範囲で実施）、ORCA_QUEUE_STATUS イベント確認
  - runIdBadge: 20260103T235301Z / auditEvent.runId: 20260103T235301Z（runIdMatches=true）
  - 証跡: screenshots/charts.png / logs/audit-charts.json
- Patients
  - 画面: /f/1.3.6.1.4.1.9414.72.103/patients
  - 操作: 検索を更新 / 再取得 / 履歴を更新
  - runIdBadge: 20260103T235301Z / auditEvent.runId: 20260103T235301Z（runIdMatches=true）
  - 証跡: screenshots/patients.png / logs/audit-patients.json
- Administration
  - 画面: /f/1.3.6.1.4.1.9414.72.103/administration
  - 操作: 保存して配信（監査イベント: admin/delivery saved）
  - runIdBadge: 20260103T235301Z / auditEvent.runId: 20260103T235301Z（runIdMatches=true）
  - 証跡: screenshots/administration.png / logs/audit-administration.json

## 監査ログ到達確認
- auditEvent の runId と UI 表示 runId が一致（logs/summary.json）
- admin/delivery saved, ORCA_QUEUE_STATUS など監査イベントを確認（logs/audit-administration.json / logs/audit-charts.json）

## ORCA 反映状態 / キュー状態 / 印刷結果
- ORCA キュー状態: ORCA_QUEUE_STATUS が success（logs/audit-charts.json）
- ORCA 反映/印刷: 実 ORCA 接続の mTLS 証明書欠如により未確認

## ブロッカー / 差分
- ORCAcertification に .p12 が無く、実 ORCA（mTLS）に接続できない
- /api01rv2/claim/outpatient, /api01rv2/patient/outpatient/mock が 500 を返却（audit-*.json）

## 証跡
- スクリーンショット: artifacts/webclient/e2e/20260103T224421Z/screenshots/
  - reception.png / charts.png / patients.png / administration.png / after-login.png
- HAR: artifacts/webclient/e2e/20260103T224421Z/har/
- ログ: artifacts/webclient/e2e/20260103T224421Z/logs/
  - summary.json / audit-*.json / session.json / login-status.json / browser.log
