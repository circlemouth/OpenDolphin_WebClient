# Webクライアント エラーハンドリングと復旧導線（preprod 実装課題インベントリ）

- RUN_ID: 20260122T200421Z
- 作業日: 2026-01-22
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/04_エラーハンドリングと復旧導線.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769112171188-c7c3a7
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
- `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
- `docs/web-client/planning/phase2/logs/20251217T125828Z-charts-error-handling.md`（Legacy/Archive）

## 確認スコープ
- ORCA 502/401/404
- network failure（timeout / offline / failed to fetch）
- missingMaster / fallbackUsed 表示と復旧導線

## 現状の対応範囲（確認済み）
- 共通バナー: `ToneBanner` と `ApiFailureBanner` があり、API 失敗を UI で通知できる。`ApiFailureBanner` は状況に応じて再取得ボタンを追加可能。
  - 根拠: `web-client/src/features/reception/components/ToneBanner.tsx`, `web-client/src/features/shared/ApiFailureBanner.tsx`, `web-client/src/features/shared/apiError.ts`
- セッション失効: `httpFetch` が 401/403/419/440 を検知すると `notifySessionExpired` を発火し、`AppRouter` がログアウト→ログイン画面でメッセージ表示を行う。
  - 根拠: `web-client/src/libs/http/httpClient.ts`, `web-client/src/libs/session/sessionExpiry.ts`, `web-client/src/AppRouter.tsx`, `web-client/src/LoginScreen.tsx`
- missingMaster / fallbackUsed: Charts の送信・印刷・患者編集はガードされており、ToneBanner/StatusPill で状態は可視化されている。
  - 根拠: `web-client/src/features/charts/ChartsActionBar.tsx`, `web-client/src/features/charts/PatientsTab.tsx`, `web-client/src/features/charts/DocumentTimeline.tsx`

## 未整備/差分（失敗パターン別）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 失敗パターン | 現状 | 差分/課題 | 影響 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ER-01 | ORCA 502/5xx | `ApiFailureBanner` が汎用メッセージのみ。5xx 専用の復旧導線（管理者連絡/復旧しない場合の文言）が統一されていない。 | 規約で求める「復旧しない場合は管理者へ」文言、retry cooldown/回数の表示、5xx 専用トーンの統一が未実装。 | 5xx の再試行/判断がユーザー任せになり、運用時の切り分けが遅れる。 | `web-client/src/features/shared/apiError.ts`, `web-client/src/features/shared/ApiFailureBanner.tsx` | P2 |
| ER-02 | 401/403 | 401/403 はセッション失効イベントでログアウトするが、画面内の「再ログイン」導線や失敗原因の表示は不足。ChartsActionBar の送信/印刷のみガードで通知。 | ページ単位・パネル単位の 401/403 に対して「再ログイン」リンクや `runId/traceId` を含む説明バナーが未整備。 | どの API で失敗したかが分からず、ユーザーは理由を把握できない。 | `web-client/src/libs/http/httpClient.ts`, `web-client/src/AppRouter.tsx`, `web-client/src/features/charts/ChartsActionBar.tsx`, `web-client/src/features/shared/ApiFailureBanner.tsx` | P1 |
| ER-03 | 404（対象なし） | 404 は `ApiFailureBanner` で HTTP 表示のみ。空状態/戻る/別患者の導線は画面ごとに統一されていない。 | 規約の「戻る/再取得/別患者を開く」導線と空状態 UI が未整備。 | 「データなし」と「API 失敗」の区別が曖昧で、誤った再試行や問い合わせが発生。 | `web-client/src/features/shared/apiError.ts`, `web-client/src/features/shared/ApiFailureBanner.tsx`, `web-client/src/features/charts/DocumentTimeline.tsx` | P2 |
| ER-04 | network failure（timeout/offline） | `classifyApiError` で network 判定は可能。ChartsActionBar では offline をガードするが、全画面・全パネルで「再取得」導線と retry ルールは統一されていない。 | timeout/failed to fetch 時の共通メッセージ、再取得ボタン、連続失敗回数の表示/抑止（cooldown）の実装が不足。 | 回線復旧後の再取得導線がばらつき、再試行が過剰/不足になりやすい。 | `web-client/src/features/shared/apiError.ts`, `web-client/src/features/charts/ChartsActionBar.tsx`, `web-client/src/features/shared/ApiFailureBanner.tsx` | P2 |
| ER-05 | missingMaster / fallbackUsed | Panels では ToneBanner/StatusPill 表示があるが、Charts ヘッダー直下の常時バナーと「再取得/Receptionへ戻る/管理者へ共有」導線が統一されていない。 | 規約で求める“ヘッダー直下の常時バナー + 3導線（再取得/Reception/管理者共有）”の実装が未整備。 | 欠損発生時に復旧手順が画面間で異なり、運用フローが定着しない。 | `web-client/src/ux/charts/tones.ts`, `web-client/src/features/charts/DocumentTimeline.tsx`, `web-client/src/features/charts/PatientsTab.tsx` | P2 |
| ER-06 | traceId の可視化 | `ToneBanner` / `ApiFailureBanner` は `runId` を data 属性で保持するが、traceId 表示や「ログをダウンロード」導線が共通化されていない。 | 規約の runId/traceId 表示、ログ保存導線（HAR/生 JSON 取得）を UI 側に統一実装できていない。 | 障害報告時の証跡不足・再現性低下。 | `web-client/src/features/reception/components/ToneBanner.tsx`, `web-client/src/features/shared/ApiFailureBanner.tsx` | P2 |

## 追加メモ（観測）
- ChartsActionBar の送信/印刷は `missingMaster/fallbackUsed` を明示的にブロックしているが、復旧導線は「Reception で再取得」中心で、管理者連絡/ログ共有の導線が不足。
- `ApiFailureBanner` は汎用の HTTP/ネットワーク分類のみで、ステータス別（401/404/502 など）の UI 一貫性が弱い。

