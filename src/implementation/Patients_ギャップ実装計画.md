# Patients ギャップ実装計画

- RUN_ID: `20260103T093344Z`
- 対象: BKL-007/014/015（ORCA 反映状態/監査履歴/未紐付警告）
- 優先度: P0/P2

## 実装箇所（web-client）
- `web-client/src/features/patients/PatientsPage.tsx`
- `web-client/src/features/patients/api.ts`

## server-modernized 連携
- `/orca12/patientmodv2/outpatient`
- 反映状態/警告の取得と監査イベント連携

## 進め方（ワーカー向け）
1. ORCA 反映状態の表示仕様を決める（反映済/未反映/エラー）。
2. 監査履歴ビュー（詳細/検索/時系列）を追加。
3. 未紐付/警告の強調表示と通知を追加。

## 完了条件（DoD）
- 編集結果の反映状態が UI と監査で確認できる。
- 未紐付警告が画面上で明示される。

## テスト/証跡
- ORCA 反映状態の画面表示
- auditEvent 出力ログ

## 参照
- `web-client/src/features/patients/PatientsPage.tsx`
