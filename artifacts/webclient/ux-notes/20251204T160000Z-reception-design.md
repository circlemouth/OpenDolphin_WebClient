# RUN_ID=20251204T160000Z  Reception＋OrderConsole UXメモ

- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 (優先度: high / 緊急度: medium)
- 目的: `docs/web-client/ux/reception-schedule-ui-policy.md` で整理された tone/ARIA/監査要件を Reception と OrderConsole で共通トーンに再整理し、スクリーンショット／コード片をまとめて次の設計/検証フェーズへつなぐ。

## 1. 発見した共通トーン
- Reception バナーは Error=赤・Warning=琥珀・Info=青、`role=alert` + `aria-live=assertive` /`polite` を維持しつつ、Chart Entry や OrderConsole のトリガーから届く `tone=server` のエラー結果でも同じ色と文言構造 (`[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]`) を再利用。
- `dataSourceTransition` を `audit.logUiState`/`logOrcaQuery` で送る仕組みを OrderConsole 側にも再現し、バナー発火と `tone=server` フローが Reception と同じ `runId`/tone/`aria-live` で表現されるようにする。

## 2. コード/監査の参照
- `src/LEGACY/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` では `resolveMasterSource(masterType)` helper が `WEB_ORCA_MASTER_SOURCE`/フラグ/ヘルスチェックの結果で `dataSource`/`dataSourceTransition` を付与しており、Reception と OrderConsole でも同 helper を使った `audit` 発行が前提になる。
- `dataSourceTransition` が mock→snapshot→server の変化を記録する監査メタなので、OrderConsole の `warning banner tone=server` ルートに対応するステータス遷移コードにも該当フィールドを透過的に追加して `audit.logUiState` へ送り出す。

## 3. スクリーンショット + コード片予定
- Reception ヘッダー直下のバナー領域（`tone=server` が経路に一致するケース、`aria-live=assertive` + `bannerVisible` true）
- OrderConsole の ORCA 送信結果/再送 UI（`tone=server` かつ `dataSourceTransition=server` を含む監査メタ付きの状態）
- API/監査観点: `order-console/api/orca-send.ts`（仮称）で `runId`, `dataSource`, `dataSourceTransition`, `missingMaster`, `fallbackUsed`, `cacheHit` を `AuditEvent` details に渡す箇所
- これらは Stage Preview + Playwright で `VITE_DISABLE_MSW=1` 環境を用意した上で実際の画面をキャプチャし、`artifacts/webclient/ux-notes/20251204T160000Z-reception-design.md` にリンク/ファイル名で追記する。

## 4. 次ステップ
- 受信バナーのトーン/ARIA を OrderConsole に carry over する設計レビューを 12/12 09:00 までに完了し、Playwright シナリオに `tone=server` + `aria-live` パスを追加。
- `docs/server-modernization/phase2/operations/logs/20251204T160000Z-reception-design.md` を通じて API 依存を整理し、DOC_STATUS の Web クライアント UX/Features 行へ RUN_ID + ログパスを追記。
