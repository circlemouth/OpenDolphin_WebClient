# RUN_ID=20260103T224421Z ORCA実環境連携検証（Webクライアント）
- 参照: AGENTS.md → docs/DEVELOPMENT_STATUS.md → docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md
- 接続先: https://weborca.cloud.orcamo.jp:443
- 対象: Web クライアント（Reception/Charts/Patients/Administration）
- 証跡: artifacts/webclient/e2e/20260103T224421Z/{screenshots,har,logs}
- 監査/到達確認: src/validation/ORCA実環境連携検証.md
> **注記**: 現行の標準接続先は WebORCA Trial（XML/UTF-8 + Basic）。本ログは旧方針の実測記録。

## Summary
- 実行結果: Web クライアントのログイン〜主要画面到達に成功。Reception/Charts/Patients/Administration で監査イベントが発火し RUN_ID 一致を確認。
- runId / auditEvent 突合: runIdBadge=20260103T235301Z と auditEvent.runId が全画面で一致（logs/summary.json）。
- ORCA 反映状態/キュー/印刷:
  - ORCA キュー状態: Charts の ORCA_QUEUE_STATUS イベントを確認（audit-charts.json）。
  - 反映/印刷: 実 ORCA 接続が確立できず未確認（下記ブロッカー）。
- ブロッカー:
  - ORCAcertification 直下に .p12 が無く、mTLS で実 ORCA へ接続できない（ORCA_CERTIFICATION_ONLY 手順の前提不足）。
  - /api01rv2/claim/outpatient など一部 API が 500 を返し、mock/fallback へ遷移（audit-*.json 参照）。

## Evidence
- スクリーンショット: artifacts/webclient/e2e/20260103T224421Z/screenshots/
  - reception.png / charts.png / patients.png / administration.png
- HAR: artifacts/webclient/e2e/20260103T224421Z/har/
- ログ: artifacts/webclient/e2e/20260103T224421Z/logs/
  - summary.json / audit-*.json / session.json / login-status.json / browser.log
