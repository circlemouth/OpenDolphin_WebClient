# 確認作業計画 統合作業プレイブック（最終版）

> 目的: `docs/verification-plan.md` の最終差し込み作業を、順序・依存関係・差し込み手順・最終確認まで一つに統合する。

## 1. 参照する資料

- 差し込み先: `docs/verification-plan.md`
- 差し込み順序/依存: `docs/verification-plan-integration-order.md`
- IDベース差し込み手順: `docs/verification-plan-integration-guide.md`
- プレースホルダ対応: `docs/verification-plan-placeholder-map.md`
- 補助文案: `docs/verification-plan-insert-snippets.md`
- セクション案/リスク表: `docs/verification-plan-section-proposal.md`
- チェックリスト: `docs/verification-plan-checklist.md`
- 外部差し込み元: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/server-modernization/server-modernized-api-traceability-insert-20260202.md`

## 2. 差し込み順序（優先度）

1. 画面一覧（`## 4` / `### 4.1`）
2. サーバー機能一覧（`## 5` / `### 5.1`）
3. トレーサビリティ表（`## 6` / `### 6.1`）
4. 画面レビュー本文案（`## 4` / `### 4.2` 以降）
5. 要確認事項の追記（`## 10`）
6. チェックリストの更新（`## 8` / `### 8.1`）

## 3. 依存関係

- トレーサビリティ表は「画面一覧」「サーバー機能一覧」の確定が前提。
- 画面レビュー本文案は「画面一覧」のID/名称に依存。
- 要確認事項・チェックリストは独立だが、一覧確定後に最終調整する。

## 4. 差し込み手順（章別）

### 4.1 画面一覧（`## 4` / `### 4.1`）

- [PLACEHOLDER] 画面一覧表を `### 4.1 画面一覧` の表に置換。
- 画面IDは `SCR-###`（3桁ゼロ埋め）で統一。

### 4.2 サーバー機能一覧（`## 5` / `### 5.1`）

- `docs/verification-plan.md` の §5 を開く。
- 外部差し込み元ファイルの **「サーバー機能一覧（差し込み本文案・ID版）」** を、§5 の [PLACEHOLDER] と置換。
- 表フォーマットは以下で固定:

| 機能ID | 機能名 | API / バッチ | 役割概要 | 依存先 | 備考 |
| --- | --- | --- | --- | --- | --- |

### 4.3 トレーサビリティ表（`## 6` / `### 6.1`）

- 外部差し込み元ファイルの **「トレーサビリティ表（画面 x サーバー機能）（差し込み本文案・ID版）」** を、§6 の [PLACEHOLDER] と置換。
- 表フォーマットは以下で固定:

| 画面ID | 画面名 | 機能ID | 機能名 | 依存区分 | 備考 |
| --- | --- | --- | --- | --- | --- |

- 依存区分は `主要/補助/参照` のいずれかを明示。

### 4.4 画面レビュー本文案（`## 4` / `### 4.2`）

- 画面ごとの確認観点フォーマットを維持し、画面レビュー本文案を追記。
- 画面名は `Reception / Charts / Patients / Administration` 表記で統一（既存指示に準拠）。

### 4.5 要確認事項（`## 10`）

- `docs/verification-plan-section-proposal.md` の「2.1 要確認事項」を転記。
- `docs/verification-plan-insert-snippets.md` の「2. 要確認事項」を補完。
- 重複項目は統合し、語尾/表記を統一する。

### 4.6 チェックリスト（`## 8` / `### 8.1`）

- `docs/verification-plan-checklist.md` の表を `### 8.1` に差し替え。
- 複数表を置く場合は `8.1.x` の小見出しを使用。

## 5. ID起番ルール

- 機能IDは `SVR-###`（3桁ゼロ埋め）。
- 画面IDは `SCR-###`（3桁ゼロ埋め）。
- 追加時は既存最大番号 +1 を継続（欠番を作らない）。
- トレーサビリティ表の機能IDは §5 と同一IDを使用。

## 6. 最終確認（必須チェック）

- すべての [PLACEHOLDER] が解消されている（待ちがある場合は理由を明記）。
- 見出し構成と章番号が崩れていない。
- 要確認事項に重複がない（表記揺れも整理済み）。
- 画面ID/機能IDの形式が統一されている。
- 変更履歴に反映日・差し込み内容を記載済み。
