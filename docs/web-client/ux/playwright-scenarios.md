# Playwright シナリオ叩き台（RUN_ID=20251202T090000Z）

- 参照元: [reception-schedule-ui-policy.md](reception-schedule-ui-policy.md)、[charts-claim-ui-policy.md](charts-claim-ui-policy.md)、[patients-admin-ui-policy.md](patients-admin-ui-policy.md)
- 証跡ログ: [docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md](../../server-modernization/phase2/operations/logs/20251202T090000Z-screens.md)

## Reception

### ケース0: ORCA/未紐付/遅延バナー tone + aria-live 共通検証
- 前提データ/モック/フィクスチャ: ORCA 送信完了/エラー/遅延レスポンスを切替できる MSW と実 API。診療終了済み受付1件（診療終了解除可）と role=受付・医師ユーザー。環境フラグは `VITE_USE_MOCK_ORCA_QUEUE=1/0`、`VITE_VERIFY_ADMIN_DELIVERY=1` の両方を走らせ、ヘッダー `x-use-mock-orca-queue`/`x-verify-admin-delivery` を確認。
- ステップ: `ensureRoleAccess(page, 'reception')` → 診察終了タブでエラー/遅延レスポンスを受ける → 再送 → 診療終了解除（Charts で実施）→ Reception に戻る → もう一度送信し完了を確認。
- 期待結果: Reception/Charts 双方で同文言・tone（Error=赤/assertive、Warning=琥珀/assertive、Info=青/polite）が `aria-live` で読まれ、`data-run-id=20251202T090000Z` が付与される。再送・診療終了解除後のバナー更新が `measureBannerDelay` で計測でき、モック ON は 2 秒以内、OFF は 10 秒以内を許容。`fetchAuditLog` で `ariaLive`/`tone`/`queueStatus` が記録される。

### ケース1: ステータス変更と ORCA 送信バナー（aria-live/遅延）
- 前提データ/モック/フィクスチャ: 診療中ステータスの受付1件（ローカル DB or fixture）、受付ロールユーザー。ORCA 送信キューは実 API とモックレスポンス（遅延/エラー含む）を切替可能にする。
- ステップ: `ensureRoleAccess(page, 'reception')` → 診察終了タブへ遷移→対象行で「診療終了」→ORCA 送信完了/エラーを確認→再送ボタン押下→`measureBannerDelay` で遅延計測。
- ステップ内差し込み: 再送後に実装済みの `fetchAuditLog(runId, criteria)` を呼び監査ログ API を確認（tests/playwright/utils/fixtures/ or helpers 内でラップ）。
- 期待結果: 完了/エラーバナーが `aria-live=polite/assertive` で読み上げられ tone 一貫（helper: `assertAriaLiveBanner` from `tests/playwright/utils/ui-helpers.ts`）; 再送後のバナー更新までの遅延が期待秒数内（`measureBannerDelay`）; 監査ログが更新される。

### ケース2: フィルタ保持と戻り導線
- 前提データ/モック/フィクスチャ: 受付一覧に複数件（診療科/時間帯で差別化）、受付ロールユーザー。設定配信のモックレスポンス（フィルタ保持用）を用意。
- ステップ: `ensureRoleAccess(page, 'reception')` → 診療科＋自費フラグで絞込→Patients（基本情報編集）へディープリンク→保存/キャンセル→Reception に戻る→`restoreFilters` と `resetFiltersAndReturnFocus` で保持確認。
- ステップ内差し込み: Patients 保存後に実装済みの `fetchAuditLog` を呼び、遷移/編集が記録されたか確認。
- 期待結果: 戻った際にタブ/フィルタ/ソートが保持（実装済み `restoreFilters` or `resetFiltersAndReturnFocus`）; バナー/トーストが `aria-live` で読まれる; 役割ガードにより許可された操作のみ活性; 監査ログに遷移と編集が記録される。

## Charts/Claim

### ケース3: 診療終了解除とバナー carry over
- 前提データ/モック/フィクスチャ: Reception から診療終了済み患者を開ける。ORCA 送信キューのモック/実 API 切替（`VITE_USE_MOCK_ORCA_QUEUE=1/0`）と配信検証 ON（`VITE_VERIFY_ADMIN_DELIVERY=1`）。role=医師ユーザー。
- ステップ: Charts で診療終了→ORCA 送信エラーを受信→「診療終了解除」を実行→再度診療終了→Reception へ戻り診察終了タブでバナー確認。
- 期待結果: Charts で発火したバナーが Reception 診察終了タブに同 tone/aria-live で carry over され、`data-run-id=20251202T090000Z` が維持される。診療終了解除後に tone が Warning→Info へ変化し、再送完了で Info/polite となる。`fetchAuditLog` に解除操作・queueStatus・manualRefresh が記録される。

### ケース4: 病名/オーダー登録エラーの aria-live とフォーカス戻り
- 前提データ/モック/フィクスチャ: Reception から保険モードで開ける患者。オーダー登録 API の一時エラー/成功レスポンスをモックで切替。
- ステップ: 病名タブで検索→登録→オーダータブで処方登録→エラー発生→タブを往復。
- ステップ内差し込み: エラー発生直後に実装済みの `fetchAuditLog` で失敗ログを確認、再試行後に再度確認。フォーカス戻りは `assertFocusReturn(page, selector)` で検証。
- 期待結果: エラーバナーが `aria-live` で即時読まれ tone 一貫（`assertAriaLiveBanner`）; タブ遷移後に最後のフィールドへフォーカス復帰し二重読み上げなし（実装済み `assertFocusReturn`）; 監査ログに登録失敗/再試行が残る。

### ケース5: 保険/自費モード引継ぎと診療終了バナー
- 前提データ/モック/フィクスチャ: Reception から保険モードで遷移できる患者。ORCA 送信キューのモックレスポンス（遅延/成功/エラー）と実 API を切替。role=医師ユーザー。
- ステップ: 診療録入力→署名→診療終了→再送（エラー想定→リトライ）。
- ステップ内差し込み: 診療終了後と再送後に `logOrcaQueueStatus` と実装済み `fetchAuditLog` を呼び、キュー状態と監査記録を確認。遅延計測は `measureBannerDelay` を使用。
- 期待結果: 保険/自費モードが診療終了まで変わらず反映; 診療終了後の ORCA 送信結果バナーが `aria-live` で読み上げ（`assertAriaLiveBanner`）; 再送後バナーが更新されるまでの遅延を計測（`measureBannerDelay`）; 受付側のステータスとキューが同期。

## Patients/Admin

### ケース6: 権限制御と結果バナー（Patients）
- 前提データ/モック/フィクスチャ: role=受付ユーザー、編集可否が分かれる患者データ。設定配信のモックレスポンス（閲覧専用/編集可の差分）を用意。
- ステップ: `seedRolesAndPermissions(request, 'reception')` → 患者検索→基本情報編集を試行→保存→不足権限の項目にアクセス。
- ステップ内差し込み: 保存/拒否後に実装済みの `fetchAuditLog` で権限エラーや成功が記録されたか確認。
- 期待結果: 許可フィールドのみ編集可能（実装済み `seedRolesAndPermissions` from `tests/playwright/utils/ui-helpers.ts`）; 保存成功/失敗バナーが `aria-live` で読まれる（`assertAriaLiveBanner`）; 権限不足は非活性/警告いずれかで明示; 監査ログに保存/拒否が残る。

### ケース7: 設定保存と配信タイミング（Administration）
- 前提データ/モック/フィクスチャ: role=system_admin ユーザー。設定配信 API のモックレスポンス（即時/遅延/失敗）と実 API を切替。ORCA 送信キューのモックも併用可。
- ステップ: `seedRolesAndPermissions(request, 'admin')` → ORCA エラー文言を変更→保存→Charts/Reception をリロード/再ログイン→バナー文言とルールを確認→必要に応じ `VITE_USE_MOCK_ORCA_QUEUE` を ON/OFF して配信差分を再観測。
- ステップ内差し込み: 保存直後とリロード後に実装済みの `fetchAuditLog` を呼び、設定変更と配信タイミングの記録を確認。
- 期待結果: 保存バナーが `aria-live` で読まれる（`assertAriaLiveBanner`）; 変更が即時 or 次回リロードで反映される挙動を記録; 反映前後のバナー tone と送信ルールが一致; 監査ログに設定変更と配信タイミングが記録される（`fetchAuditLog`）。

## 実装メモ/共通ヘルパー案
- `assertAriaLiveBanner(locator, tone)` : `aria-live` と tone 文言を検証し、スクリーンリーダー読み上げ有無を確認（polite/assertive の検証を共通化）。
- `measureBannerDelay(trigger, bannerLocator, timeoutMs)` : トリガーからバナー更新までの経過時間を計測し、期待秒数を満たすかアサート（ORCA 送信待ち/再送後更新に使用）。
- `seedRolesAndPermissions(request, rolePreset)` : テスト前に権限プリセットを投入し、受付/医師/管理者の可否を安定させる（API or fixture で実施、実装済み）。
- `fetchAuditLog(request, runId, criteria)` : 操作後に監査ログ API を参照し、対象操作（保存/再送/拒否など）が記録されているか確認（実装済み）。
- `restoreFilters(page, storageKey, expected)` : フィルタ/タブ状態を localStorage/URL から復元し、戻り導線後も一致するか確認。`resetFilters` と対で使う（実装済み）。
- `assertFocusReturn(page, selector)` : タブ往復後に直前のフィールドへフォーカスが戻り、ライブリージョンが二重読み上げしないことを検証（実装済み）。
- `ensureRoleAccess(page, rolePreset)` : ロール別ログイン/権限投入をまとめた前処理。`rolePreset` に応じて `seedRolesAndPermissions` を呼ぶラッパー。
- `resetFiltersAndReturnFocus(page, storageKey, focusSelector)` : 戻り導線前後でフィルタ初期化とフォーカス位置を揃える簡易ユーティリティ。
- `logOrcaQueueStatus(request, patientId)` : ORCA 送信キューのステータスを API から取得し、遅延計測時に併用。
- ORCA 送信キューや設定配信タイミングは環境依存のため、MSW（モック）/実 API を切替えるフラグを Playwright 設定に用意し、遅延計測・監査ログ検証への影響を明記する。
- 監査ログ API 呼び出しはステップ内で `fetchAuditLog` を明示的に挿入し、結果をスクリーンショット/ログに残す。

### 実装状況メモ（tests/playwright/utils/ui-helpers.ts, RUN_ID=20251202T090000Z）
- `assertAriaLiveBanner`/`measureBannerDelay`/`ensureRoleAccess`/`resetFiltersAndReturnFocus`/`logOrcaQueueStatus`/`seedRolesAndPermissions`/`fetchAuditLog`/`restoreFilters`/`assertFocusReturn`: 叩き台実装済（期待値チェックとログ出力を含む）。文言/URL/selector は TODO で調整余地あり。
- Playwright 設定: `playwright.config.ts` で `VITE_USE_MOCK_ORCA_QUEUE` / `VITE_VERIFY_ADMIN_DELIVERY` を環境変数から読み、`extraHTTPHeaders` に `x-use-mock-orca-queue` / `x-verify-admin-delivery` として渡す案を追記済み。MSW/実API 切替はこのヘッダーで判定する想定。

### 実行手順メモ（未実行）
- 例: `RUN_ID=20251202T090000Z VITE_USE_MOCK_ORCA_QUEUE=1 VITE_VERIFY_ADMIN_DELIVERY=1 npx playwright test --project=chromium --grep \"Administration 配信\" --reporter=line --timeout=600000`
- 実 API で配信タイミングのみ確認する場合は `VITE_USE_MOCK_ORCA_QUEUE=0` に切替。ネットワーク/監査ログを収集する場合は `--output=playwright-report/admin-delivery` など適宜指定。
- アプリ側切替案: `web-client/src/libs/http/header-flags.ts` で env/localStorage ベースのフラグ→ヘッダー変換を追加（TODO: `src/libs/http/httpClient.ts` や fetch ラッパーが見つかり次第、共通ヘッダーに組み込み）。Playwright からのヘッダーは MSW サービスワーカー/サーバー双方で利用できる前提。
- 開発/プレビューサーバーは `x-use-mock-orca-queue` / `x-verify-admin-delivery` ヘッダーを見て `/api/orca/queue` をモック応答に切替え、管理配信チェックは `/api/admin/config` 系で検証結果を返す（RUN_ID 付与）。例: `RUN_ID=20251202T090000Z VITE_USE_MOCK_ORCA_QUEUE=1 VITE_VERIFY_ADMIN_DELIVERY=1 PLAYWRIGHT_BASE_URL=https://localhost:4173 npx playwright test --project=chromium --grep \"ORCA 送信|Administration 配信\" --reporter=line --timeout=600000`

### モック/実 API 切替チェックリスト（RUN_ID=20251202T090000Z）
- 前提設定例: `VITE_USE_MOCK_ORCA_QUEUE=1`（モック）/`0`（実 API）、`VITE_VERIFY_ADMIN_DELIVERY=1`（配信検証 ON）をそれぞれ Playwright と Vite dev/preview に渡す。extraHTTPHeaders は `x-use-mock-orca-queue` / `x-verify-admin-delivery` を 1/0 で送る。
- ORCA 送信キュー: `/api/orca/queue?patientId=<ID>` へ GET。モック ON なら `source=mock` と `queue[]` を返し、`x-orca-queue-mode: mock` が付与。OFF なら upstream 実装にフォールスルーし、ヘッダーは `x-orca-queue-mode: live`。監査ログは `fetchAuditLog(request, RUN_ID, { endpoint: 'orca/queue' })` で取得を試み、404 は警告扱い。失敗時リトライ: 再送ボタン/`logOrcaQueueStatus` を再実行し、バナー遷移を測る。
- Admin 配信チェック: `/api/admin/config`（または `/api/admin/delivery`）へ GET。`VITE_VERIFY_ADMIN_DELIVERY=1` かつヘッダー ON の場合、`runId` と `verified:true` を含む JSON が返り、`x-admin-delivery-verification: enabled` が付く。OFF 時はヘッダー `disabled` でサーバー応答にフォールスルー。監査ログは `fetchAuditLog(request, RUN_ID, { endpoint: 'admin/config' })` で確認し、無ければレスポンスログを保存。失敗時リトライ: 保存後に再読み込み→同エンドポイントを再取得し、ヘッダー/本文の更新を確認する。
- 共通: 期待ヘッダーが欠落した場合は network log を保存し、`VITE_USE_MOCK_ORCA_QUEUE`/`VITE_VERIFY_ADMIN_DELIVERY` の設定値と extraHTTPHeaders の実送信値を照合する。RUN_ID をレスポンス/ログに残し、差分を明記。

### モックON/OFF差分・微調整案（RUN_ID=20251202T090000Z）
- flagged-mock-plugin の分岐漏れ: 既存のヘッダー判定は `/api/orca/queue` のみ。配信確認 `/api/admin/config`（`/delivery` を含む派生）も `x-verify-admin-delivery` を見るよう plugin 条件を追加する TODO を残す（ヘッダーが無視され実 API へ到達し、意図しない監査ログを書き込んでしまうケースあり）。
- モック OFF 時の遅延: ORCA キュー再送後のバナー更新が 5〜8 秒遅れることがあり、`measureBannerDelay` のタイムアウトを 10 秒へ暫定延長し、遅延が audit に残らない場合は WARN ログを残す。MSW ON 時は 2 秒以内を期待値とする差分をシナリオに明記。
- 監査ログの応答差異: モックは `[{ at, action, endpoint }]` の配列、実 API は `{ entries: [], nextCursor }`。`fetchAuditLog` 内で配列/オブジェクト両対応の正規化（`entries ?? body`）を追加する TODO をコメントで残す。現状は配列前提で `entries` が無い場合に空扱いとなり、欠損と誤認するため。
- 保存先の揺れ: 実 API では `/api/audit/logs`、モックでは `/api/audit/mock-logs` に記録されることを確認。`criteria` に `endpoint` と `storage: 'mock|live'` を受け付けるよう追記し、シナリオ内で storage を指定して再取得する案をメモ。
- 404/空配列時のハンドリング: モック OFF で監査ログが即時反映されない場合は 3 回（1s 間隔）のバックオフを `fetchAuditLog` で実施する TODO を記載。最終的に空ならスクリーンショット＋network log を保存して WARN とする運用を追記。
