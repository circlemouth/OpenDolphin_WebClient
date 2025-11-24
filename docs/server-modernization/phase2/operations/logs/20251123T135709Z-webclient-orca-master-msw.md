# 20251123T135709Z Web クライアント ORCA マスタ MSW 実装ログ

- 対応範囲: ORCA マスタ系 API（address/etensu/generic-class/generic-price/hokenja/kensa-sort/material/youhou）の MSW フィクスチャとハンドラ追加。
- RUN_ID: `20251123T135709Z`
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → 本タスク指示（MSW ハンドラ実装）。

## 作業メモ
- artifacts ソース: `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json` の body 部分をそのままフィクスチャ化。
- 追加ファイル:
  - `web-client/src/mocks/fixtures/orcaMaster.ts`
  - `web-client/src/mocks/handlers/orcaMasterHandlers.ts`
- 変更ファイル:
  - `web-client/src/mocks/handlers/index.ts`（orcaMasterHandlers を登録）
  - `web-client/src/mocks/handlers/chartHandlers.ts`（lint エラー回避のため catch 句引数削除）

## チェック結果
- `cd web-client && npm run lint -- --max-warnings=0`
  - 結果: **失敗**（既存コードの lint エラー）
  - 内容: `src/features/replay-gap/ReplayGapContext.tsx` に未使用変数/unused eslint-disable/missing deps/Fast refresh ルール違反が計 3 エラー・2 警告として残存。
  - 対応: 本タスクのスコープ外のため未修正。要対応なら別タスクで調整。
- テスト: 指示任意の `npm test -- --watch=false` は未実施。

## 次アクション
- リントエラー解消が必要な場合は `ReplayGapContext.tsx` の未使用 import と依存配列、Fast refresh ルールを別途修正する。
- MSW で追加した ORCA マスタ API を実利用する際は `VITE_DISABLE_MSW` を 0/未設定としてブラウザ再読み込みする。

## 追記（2025-11-23 / RUN_ID=20251123T135709Z）
- 対応: `web-client/src/features/replay-gap/ReplayGapContext.tsx` の lint エラー/警告を解消。
  - 未使用 import (`replayGapInitialState`, `ReplayGapPhase`) を削除。
  - `session?.credentials?.clientUuid` を `clientUuid` としてメモ化し、`sendAudit`/`runReload` の依存配列と API 呼び出しに使用。
  - 不要になった `no-constant-condition` 無効化コメントを削除。
  - Fast Refresh ルールはフック export 直前で限定的に無効化（ファイル分割せず現状維持）。
- チェック: `cd web-client && npm run lint -- --max-warnings=0`
  - 結果: **成功**（エラー/警告 0）。

## ワーカーD (MSWフィクスチャ妥当性テスト) 着手前確認
- RUN_ID: `20251123T135709Z`
- 実施日時: 2025-11-23
- コマンド: `cd web-client && npm run lint -- --max-warnings=0`
- 結果: **失敗**。`src/features/replay-gap/ReplayGapContext.tsx` に未使用変数2件、unused eslint-disable 1件、依存配列不足1件、Fast refresh ルール違反1件が残存。
- 影響: 開始条件「lint 解消後」に未到達のため `npm test -- --watch=false` は未実施。lint 解消完了の連絡後に再着手する。

## ワーカーD テスト実行結果
- RUN_ID: `20251123T135709Z`
- 実施日時: 2025-11-23
- コマンド: `cd web-client && npm test -- --watch=false`
- 結果: **失敗 (1/32 ファイル)**。`src/app/__tests__/AppShell.a11y.test.tsx` が `useReplayGapContext は ReplayGapProvider 配下でのみ利用できます` エラーで落ち、AppShell マウント時に ReplayGapProvider が未提供である既存課題が原因と判断。MSW 追加による副作用は検知されず。
- その他ログ: `auth-service` 系テストで Web Crypto MD5 非対応の警告が出るがテストは通過。`health-insurance` テストで decode 失敗の stderr を出力しつつ PASS。
- 対応: テスト修正はスコープ外のため未実施。ReplayGapProvider を AppShell a11y テストに組み込む/モックする別タスクが必要。

## 追加メモ（2025-11-23 22:15 JST）
- 上記失敗は eslint キャッシュ由来で、`npm run lint -- --max-warnings=0 --no-cache` を再実行しエラー/警告 0 を確認。ソースコードへの追加変更は無し。
- 本 RUN_ID に紐づくドキュメント更新（API_UI_GAP_ANALYSIS の「MSW実装済み」化、bridge 02_ORCA マスタ精査の進捗追記）を完了。DOC_STATUS 備考へ本ログパスを追記済み。

## ワーカー指示1: AppShell a11y テスト修正（2025-11-23 / RUN_ID=20251123T135709Z）
- 対応内容: `web-client/src/app/__tests__/AppShell.a11y.test.tsx` で `useReplayGapContext` をモックし、`replayGapInitialState` を供給することで ReplayGapProvider 未提供エラーを解消（アプリ挙動は未変更）。
- コマンド: `cd web-client && npm test -- --watch=false`
- 結果: **成功**（32/32 ファイル PASS）。実行中に既知の stderr（Web Crypto MD5 非対応によるフォールバック、health-insurance decode 失敗ログ、SSE 接続失敗リトライ）が出力されたが、いずれも既知の情報で結果には影響なし。
- 証跡: RUN_ID=`20251123T135709Z`（本ログ）。

## DOC_STATUS 更新メモ
- DOC_STATUS更新開始時刻: 2025-11-24 07:22 JST（RUN_ID=20251123T135709Z）。
- DOC_STATUS更新完了時刻: 2025-11-24 07:23 JST。内容: DOC_STATUS 備考へ AppShell a11y テスト PASS / 証跡ログパスを追記。
- テスト結果追記: `cd web-client && npm test -- --watch=false` を実行し 32/32 PASS（AppShell a11y で ReplayGapProvider をモック）。修正コミット: `00dac581`（web-client/src/app/__tests__/AppShell.a11y.test.tsx）。

## DOC_STATUS 再更新メモ（ワーカー1/2 完了後の集約）
- 開始: 2025-11-24 07:33 JST（RUN_ID=20251123T135709Z）。
- 完了: 2025-11-24 07:34 JST。内容: ORCA-04 点数帯フィルタ UI 実装完了・MSW 8 本追加・lint/test PASS を DOC_STATUS 該当行へ反映（docs/web-client/planning/phase2/DOC_STATUS.md）。
- 備考: 証跡ログは本ファイルおよび `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md` を参照。テストコマンドは `cd web-client && npm run lint -- --max-warnings=0 --no-cache` / `npm test -- --watch=false`。UI 変更は OrcaOrderPanel の点数帯フィルタ実装（Phase5 完了扱い）。

## WebCrypto MD5 警告調査メモ（2025-11-24 / RUN_ID=20251123T135709Z）
- 発生箇所: `web-client/src/libs/auth/auth-headers.ts` で `globalThis.crypto.subtle.digest('MD5', ...)` を呼び出しており、テスト環境の Web Crypto 実装が MD5 を非サポートのため警告を出力（フォールバックとして CryptoJS.MD5 を使用）。
- 影響: テストは PASS（auth-service 系で stderr に警告が残るのみ）。アプリ実挙動に変化なし。
- 今後の対応案（任意）：
  - 1) テスト環境で MD5 をサポートする polyfill を読み込む、または digest アルゴリズムを SHA-256 に統一する検討。
  - 2) 警告を許容する場合はログを抑制するガード（MD5 非対応時に一度だけ warn する）を追加してノイズを削減。

## 追加メモ（2025-11-23 / RUN_ID=20251123T135709Z）
- 対応: OrcaOrderPanel に点数帯フィルタ UI を追加し、`/orca/tensu/ten` へのクエリ（`min-max[,yyyymmdd]`）を組み立てて ORCA マスター検索に連携。デフォルト 0–300 点、プリセット 4 種（50 以下 / 50–100 / 100–300 / 300 以上）、任意の評価日指定を実装。結果リストは既存の診療行為検索と同一 UI で表示。
- API: `searchTensuByPointRange` を新設し、ポイント範囲 + 任意日付を ORCA 日付形式に変換して呼び出す。React Query 用フック `useTensuPointSearch` を追加。
- MSW: `/orca/tensu/ten/:param/` ハンドラを追加。`tensuMasterFixtureList`（4 件）を点数でフィルタしてレスポンスを生成し、UI デバッグに利用可能。
- テスト/静的解析: `cd web-client && npm run typecheck -- --pretty false`、`cd web-client && npm run lint -- --max-warnings=0 --no-cache` ともに成功（エラー/警告 0）。

## 追加メモ（2025-11-23 23:45 JST / RUN_ID=20251123T135709Z）
- 対応: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md` に暫定データ利用時の監査・ログ要件（画面別 audit/logValidationError フィールド）を追加。対象イベント: Charts 検索/保存、Reception 予約 CRUD/保険資格確認、Claim 再計算・再送、トーン表示切替。共通フィールドに `runId`, `dataSource`, `cacheHit`, `masterType`, `screenId`, `patientId`, `staffId`, `timestamp` を明記。
- テレメトリ指針: MSW→実サーバー切替時に `dataSourceTransition (msw→server)` を記録し、Feature flag ロールバックでも同メタを送出するよう明文化。
- 影響範囲: Web クライアント UI のログ送出のみでサーバー変更なし。DOC_STATUS は未更新。
