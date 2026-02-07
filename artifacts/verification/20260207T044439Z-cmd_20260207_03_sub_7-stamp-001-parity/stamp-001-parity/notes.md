# STAMP-001 Parity Notes（スタンプ閲覧）

- RUN_ID: 20260207T044439Z-cmd_20260207_03_sub_7-stamp-001-parity
- Parity ID: `STAMP-001`（スタンプ閲覧）

## 結論（Status確定）

- `legacy-vs-web-feature-parity.md` の `STAMP-001` は **「一部」** が妥当。
- Web 側には「スタンプ閲覧（= 既存スタンプの選択 + 内容取り込み）」相当が **存在する**。
  - ただし現状は **OrderBundle（RP/オーダー束）編集パネル内に限定**され、**ツリーUI/検索UI/横断導線（SOAP等）**は未整備。

## Legacy（旧来版）根拠

- 旧来版のスタンプ箱（StampBox）
  - `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampBoxPlugin.java`
  - ツリー構造の閲覧/選択を前提とした入力支援（スタンプ箱）

## Web（現状）根拠: 「スタンプ閲覧」相当の所在

### 1) サーバースタンプ: ツリー/詳細取得（API）

- stamp tree 取得: `GET /touch/stampTree/:userPk`
  - 実装: `web-client/src/features/charts/stampApi.ts`（`fetchStampTree(userPk)`）
- stamp detail 取得: `GET /touch/stamp/:stampId`
  - 実装: `web-client/src/features/charts/stampApi.ts`（`fetchStampDetail(stampId)`）

### 2) スタンプ閲覧/選択/取り込み（UI）

- OrderBundle 編集（ドック/ユーティリティ）に「スタンプ保存/取り込み」セクションが存在
  - `web-client/src/features/charts/OrderBundleEditPanel.tsx`
  - 既存スタンプ UI:
    - `既存スタンプ` の `<select>` に、`ローカル` と `サーバー` の optgroup を表示
    - 選択したスタンプを `取り込み` してフォームへ反映（サーバーは `fetchStampDetail`）
  - 付随機能（入力支援の一部）:
    - ローカル保存（localStorage）: `web-client/src/features/charts/stampStorage.ts`（`saveLocalStamp/loadLocalStamps`）
    - コピー/ペースト（sessionStorage fallback）: `web-client/src/features/charts/stampStorage.ts`（`saveStampClipboard/loadStampClipboard`）
  - フォールバック設計:
    - プロファイル/スタンプ取得失敗時は「ローカルスタンプのみ利用できます」へ落とす（UIメッセージあり）

### 3) 開発用MSW（存在の補強証跡）

- `web-client/src/mocks/handlers/stampTree.ts`
  - `/touch/stampTree/:userPk` と `/touch/stamp/:stampId` をハンドリング

## ギャップ（Legacy StampBox と比較して欠落しているもの）

- ツリーUI（階層表示）
  - 現状: `treeName` を category 表示に流用しているが、ツリーのノード操作はない（drop-down でフラットに列挙）
- 検索UI（キーワード検索/絞り込み）
  - 現状: `<select>` のため大量スタンプ時の実用性が不明
- 横断導線
  - 現状: `OrderBundleEditPanel` 内の機能として存在（SOAP/文書作成など他の入力面では未確認/未整備）

## 方針提示（恒久実装 / 対象外 / 代替運用）

- Phase（短期）: **現状の Web 標準導線は「OrderBundleEditPanel のスタンプ取り込み」で暫定確定**
  - 代替運用:
    - スタンプ頻用は「ローカル保存」＋「コピー/ペースト」で回す
    - サーバースタンプが取れない環境でもローカルに退避して継続可能

- Phase（恒久・最小MVP案）: **「スタンプ閲覧」専用の UI を分離して提供**
  - 目的: ツリー/検索/選択を提供し、OrderBundle 以外からも適用できる導線を作る
  - 最小要件（提案）:
    - エンティティ切替（処方/注射/検査…）: 既存の `stampTargets` を再利用
    - キーワード検索（前方一致/部分一致）
    - treeName（分類）でのフィルタ/折りたたみ
    - 選択→「取り込み」時のクリップボード連携（現行 `stampStorage.ts` を再利用）

## Parity 更新内容（本RUNで実施したこと）

- `docs/web-client/legacy-vs-web-feature-parity.md` の `STAMP-001`:
  - Web列/Impact/Evidence を更新（OrderBundleEditPanel に UI が存在することを明記）
  - Backlog の `STAMP-001` も「確認済みの現状」と「残ギャップ」を明記

