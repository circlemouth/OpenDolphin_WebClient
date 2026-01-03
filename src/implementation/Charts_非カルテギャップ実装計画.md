# Charts（非カルテ領域）ギャップ実装計画

- RUN_ID: `20260103T093344Z`
- 対象: BKL-005/008/017/018（診療終了/送信、印刷、患者安全ヘッダ、ドキュメント履歴）
- 優先度: P0/P1/P2

## 実装箇所（web-client）
- `web-client/src/features/charts/ChartsActionBar.tsx`
- `web-client/src/features/charts/print/*`
- `web-client/src/features/charts/DocumentTimeline.tsx`
- `web-client/src/features/charts/*`

## server-modernized 連携
- `/orca21/medicalmodv2/outpatient`
- `/api01rv2/claim/outpatient`
- 送信/印刷結果の監査イベント

## 進め方（ワーカー向け）
1. 診療終了/送信の実処理連携を実装。
2. 印刷の実 PDF 生成/プレビュー/復旧導線を整備。
3. 患者安全ヘッダ（氏名強調/年齢/和暦）を追加。
4. ドキュメント履歴の検索/フィルタ/ガードを実装。

## 完了条件（DoD）
- 送信/印刷結果が UI と監査に反映され、失敗時に復旧導線がある。
- 患者安全ヘッダが表示され、誤認防止に資する。

## テスト/証跡
- 送信/印刷フローの画面キャプチャ
- auditEvent 出力ログ

## 参照
- `web-client/src/features/charts/print`
