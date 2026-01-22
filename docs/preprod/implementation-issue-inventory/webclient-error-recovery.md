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

## 失敗パターン別・画面別の具体例（Reception / Charts / Patients）

### ER-01 ORCA 502/5xx
- Reception: `ApiFailureBanner` で HTTP 5xx を表示できるが、「復旧しない場合は管理者へ」の文言や再送/破棄の判断導線が不足。
- Charts: `DocumentTimeline` の `ApiFailureBanner` で「再取得」ボタンは出せるが、5xx 専用の復旧導線（管理者連絡/ログ共有）が未統一。
- Patients: `ApiFailureBanner` による汎用表示は可能だが、5xx 時の空状態/戻る導線は未整備。

### ER-02 401/403
- Reception: 401/403 は `httpFetch` でセッション失効 → ログアウトに遷移。画面内の「再ログイン」導線や失敗理由の明示がない。
- Charts: 送信/印刷は `permissionDenied` でブロックされるが、画面内の再ログイン導線（リンク/CTA）が不足。
- Patients: 401/403 はログアウトへ飛ぶため、パネル単位で「再ログイン」誘導や原因提示が出ない。

### ER-03 404（対象なし）
- Reception: `ApiFailureBanner` で HTTP 404 表示のみで、空状態/戻る/別患者導線は画面依存。
- Charts: `DocumentTimeline` の 404 は HTTP 表示に留まり、規約の「戻る/再取得/別患者を開く」を統一できていない。
- Patients: 404（患者未取得）時の明示的な空状態/次導線が不足。

### ER-04 network failure（timeout / offline）
- Reception: network 判定は可能だが、再取得ボタンの共通導線・再試行回数/クールダウンの表示が不足。
- Charts: `ChartsActionBar` は offline/不安定をガードするが、各パネルの再取得導線や統一メッセージが未整備。
- Patients: ネットワーク障害時の再取得/復旧 CTA が画面単位でばらつく。

### ER-05 missingMaster / fallbackUsed
- Reception: ToneBanner/StatusPill に表示されるが、「再取得/Reception へ戻る/管理者へ共有」3導線の統一がない。
- Charts: `ChartsActionBar` が送信/印刷をブロックする一方、ヘッダー直下の常時バナーと 3導線が未整備。
- Patients: `PatientsTab` に warning 表示はあるが、復旧導線（再取得/戻る/共有）が明示されない。

### ER-06 runId / traceId の可視化・ログ共有導線
- Reception: 画面内には `runId` 表示があるが、`traceId` は監査パネル内のみでエラーバナーには出ない。
- Charts: `ChartsActionBar` の StatusPill に `traceId` 表示はあるが、エラーバナーと紐付く導線がない。
- Patients: 監査イベント一覧には `traceId` があるが、エラー通知と連動せずコピー/共有導線がない。

## runId / traceId 可視化の現行位置と不足点

### 現行の表示位置（確認済み）
- RUN_ID: AppShell 上部（施設/ユーザー行）とナビゲーションの `RunIdNavBadge` で常時表示・コピー可能。
- RUN_ID: Charts の `DocumentTimeline` メタバー、印刷プレビュー文書にも表示。
- traceId: Charts の `ChartsActionBar` の StatusPill、Reception の監査パネル、Patients の監査イベント一覧、Debug/Administration 画面の一部で表示。

### 不足点
- `ToneBanner` / `ApiFailureBanner` で runId/traceId を画面上に明示しないため、障害時の一次報告に必要なキーが取得しづらい。
- 「ログをダウンロード」や「証跡共有」ボタンが共通化されておらず、HAR/生 JSON/レスポンスヘッダの保存導線が UI に存在しない。
- 401/403/5xx/timeout などの致命的エラーで、runId/traceId のコピー動線がエラーバナーと同一コンテキストにない。

### 改善指針（明文化）
- 失敗バナー内に `runId/traceId` を表示し、コピー CTA（ボタン）を追加する。
- 失敗タイプ別に「再取得」「戻る」「管理者へ共有（ログ保存）」の3導線を標準化し、`ApiFailureBanner` の拡張で統一する。
- 監査パネルでのみ見える `traceId` を、エラー発生時はメイン導線に昇格させる（画面上部/バナー内の優先表示）。

## 証跡（UI スクリーンショット / HAR）
### UI スクリーンショット
- Charts トーン/エラーバナー例: `artifacts/webclient/e2e/20251207T094118Z-charts/99-error.png`
- Charts missingMaster/fallback 表示例: `artifacts/webclient/e2e/20251207T114629Z-charts-patients/03-charts-fallback-missingMaster.png`
- Charts トーン表示: `artifacts/webclient/e2e/20251208T153500Z-integration/charts-tone.png`
- Reception トーン表示: `artifacts/webclient/e2e/20251208T153500Z-integration/reception-tone.png`
- Patients トーン表示: `artifacts/webclient/e2e/20251208T153500Z-integration/patients-tone.png`

### HAR（通信ログ）
- network/tone 記録: `artifacts/webclient/e2e/20251208T153500Z-integration/network.har`
- network（MSW on/off 比較）: `artifacts/webclient/e2e/20251207T130434Z-integration/network.har`, `artifacts/webclient/e2e/20251207T130434Z-integration/network-msw-on.har`, `artifacts/webclient/e2e/20251207T130434Z-integration/network-msw-off.har`
- 401 記録（API 利用ログ）: `artifacts/webclient/api-usage/20251210T222542Z/webclient-api-usage-401.har`

> 注記: 401/403/404/502 の画面専用スクリーンショットは本作業ディレクトリ内に見当たらず、追加実測は未実施。

## 追加メモ（観測）
- ChartsActionBar の送信/印刷は `missingMaster/fallbackUsed` を明示的にブロックしているが、復旧導線は「Reception で再取得」中心で、管理者連絡/ログ共有の導線が不足。
- `ApiFailureBanner` は汎用の HTTP/ネットワーク分類のみで、ステータス別（401/404/502 など）の UI 一貫性が弱い。
