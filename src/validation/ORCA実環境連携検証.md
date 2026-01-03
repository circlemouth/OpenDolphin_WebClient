# ORCA実環境連携検証

## 目的
モダナイズ版 Web クライアントの非カルテ領域が、実環境 ORCA と監査ログまで含めて正しく連携できることを確認する。

## 手順
- `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従い、実環境の手順とログ取得を実施
- Reception/Charts/Patients/Administration の主要操作を実行し、runId と auditEvent が一致することを確認
- ORCA 反映状態/キュー状態/印刷結果が UI とログで整合するかを記録

## 成果物
- 実環境検証ログ（runId, 操作, 結果）
- 監査ログ到達の確認記録
- ブロッカー/差分の一覧

## 実行ログの保存先
- `artifacts/validation/orca/logs/`
- `artifacts/validation/orca/screenshots/`
- `artifacts/validation/orca/README.md`（サマリとrunId一覧）

## 証跡最低要件
- runId/操作/結果が揃った実行ログ
- 監査イベント到達の確認メモ（runId/endpoint）
- 主要画面（Reception/Charts/Patients/Administration）のスクリーンショット
