# Reception ギャップ実装計画

- RUN_ID: `20260103T093344Z`
- 対象: BKL-006/010/011/013/05（例外一覧/右ペイン/列拡張/監査履歴/新規タブ導線）
- 優先度: P0/P1

## 実装箇所（web-client）
- `web-client/src/features/reception/pages/ReceptionPage.tsx`
- `web-client/src/features/reception/api.ts`
- `web-client/src/features/reception/components/*`

## server-modernized 連携
- `/api01rv2/appointment/outpatient/*`
- `/api01rv2/claim/outpatient`
- 例外一覧用の監査イベント/キュー状態

## 進め方（ワーカー向け）
1. 例外一覧の定義（未承認/送信エラー/遅延）を確定。
2. 右ペイン表示（患者概要/直近診療/オーダー概要）を設計。
3. 受付一覧の列定義（保険/自費/ORCA キュー）を追加。
4. 新規タブ導線（カルテ別タブ）を実装。
5. 監査履歴検索 UI を追加。

## 完了条件（DoD）
- 例外一覧が UI で可視化され、監査ログに runId/queue 状態が残る。
- 右ペインと列拡張が整備され、運用判断が可能。

## テスト/証跡
- 例外一覧の表示/非表示
- 列拡張のスクリーンショット
- auditEvent 出力ログ

## 参照
- `web-client/src/features/reception/api.ts`
