# Webクライアント設計/実装 差分一覧（実装修正対象のみ）

- RUN_ID: 20260130T132305Z
- 作成日: 2026-01-30
- 対象ドキュメント:
  - `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`
  - `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`
  - `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`
  - `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`
- 実装参照: `web-client/src/**`

## 1. 差分サマリ（実装修正が必要）
- 統合設計の共通ルール（通知スタック/手動更新ログ/復旧ガイド配置）に未達があり、実装修正が必要。
- Reception/Patients は「理由の明示」「編集ブロック」の要件が未達。
- Charts は復旧ガイド配置が不足。

## 2. 統合設計（`web-client-emr-design-integrated-20260128.md`）との差分
- INT-01: 通知スタックの最大件数
  - 設計: 成功/警告/失敗トーストは最大3件。
  - 実装: 最大2件（`web-client/src/AppRouter.tsx` の `TOAST_MAX_STACK = 2`）。
  - 実装修正: `TOAST_MAX_STACK` を 3 に修正。
- INT-02: 手動更新の監査ログ
  - 設計: 手動更新は監査ログへ記録。
  - 実装: 再取得ボタン/手動再読込で監査ログが記録されない。
    - Reception: `web-client/src/features/reception/pages/ReceptionPage.tsx`
    - Patients: `web-client/src/features/patients/PatientsPage.tsx`
    - Charts: `web-client/src/features/charts/pages/ChartsPage.tsx`（`handleRefreshSummary`）
  - 実装修正: 手動更新操作ごとに `logAuditEvent` / `logUiState` を追加。
- INT-03: MissingMasterRecoveryGuide の配置ルール
  - 設計: 主要バナー直下・詳細コンテンツ直前に配置（Reception / DocumentTimeline / Patients）。
  - 実装:
    - Reception: `MissingMasterRecoveryGuide` 未配置。
    - Charts/DocumentTimeline: `MissingMasterRecoveryGuide` 未配置。
    - Patients: 編集ブロック領域内のみ（トップ直下ではない）。
  - 実装修正: 各画面でガイドを設計指定位置へ追加/移動。

## 3. Reception 詳細設計との差分（実装修正対象）
- REC-01: 選択行が消えた理由の提示
  - 設計: 検索条件/日付変更など「理由が分かるようにする」。
  - 実装: 選択喪失時のメッセージが汎用文のみ（`ReceptionPage.tsx` の `setSelectionNotice`）。
  - 実装修正: 「日付変更」「フィルタ変更」「検索再実行」などの理由を判定し、具体文言で表示。

## 4. Charts 詳細設計との差分（実装修正対象）
- CHR-01: DocumentTimeline の復旧導線
  - 設計: missingMaster 等は復旧ガイド導線を同じ場所に置く。
  - 実装: `DocumentTimeline.tsx` に `MissingMasterRecoveryGuide` が存在しない。
  - 実装修正: DocumentTimeline 内に復旧ガイドを追加（設計の配置ルールに合わせる）。

## 5. Patients 詳細設計との差分（実装修正対象）
- PAT-01: 未紐付患者の編集ブロック
  - 設計: 未紐付は重要度に応じて編集ブロック。
  - 実装: 編集ブロックは missingMaster/fallback/dataSourceTransition のみで判定し、未紐付は警告のみ。
    - `web-client/src/features/patients/PatientsPage.tsx`（`blockReasons`）
  - 実装修正: 未紐付（患者ID欠損/氏名欠損）をブロック条件へ追加し、保存操作を停止。
- PAT-02: MissingMasterRecoveryGuide の配置
  - 設計: 主要バナー直下に配置。
  - 実装: 編集ブロック領域内にのみ表示。
  - 実装修正: 主要バナー直下へ移動（編集ブロック領域内の重複は整理）。

