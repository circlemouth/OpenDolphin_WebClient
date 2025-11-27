# 06 Charts と Claim UI構成方針
最終更新日: 2025-11-27（RUN_ID=20251127T124500Z）

## 1. 目的
`ChartsPage` 上のタイムライン、補助パネル、Claim フォーム、ORCA 検索・警告バナー / ステータスバーの統制を通じて
- docinfo / labo / orca / letter の必須データを取りこぼさず表示すること
- MSW・snapshot・server の切り替えを `dataSourceTransition` / `cacheHit` で可視化し、監査メタと UI 表示を連動させること
- React Query の `staleTime` / `onError` を共通化して、バナー・モーダル・カードの状態管理と toast / placeholder / read-only のハンドリングを一定化すること
を目的とします。

## 2. 必須データと監査メタ
| データセット | 依存箇所 | 表示・監査要件 |
| --- | --- | --- |
| `docinfo` / `documents` | DocumentTimeline / DocumentDetail / ClaimAdjustmentPanel の文書選択 | `useDocInfos`（staleTime=30s・`docInfosQueryKey`）で一覧を取得。選択なしは「カルテ対象を選択」で placeholder、取得失敗は `InlineFeedback`（tone=`danger`）でメッセージ投入。タイトル編集や Claim 再送時は `resolveErrorMessage` でエラー文言をバナー化し、`claim` の read-only フローに影響を与えない。`dataSourceTransition` / `cacheHit` は監査ログに含め、UI で `StatusBadge`/`FilterBadge` を経由して `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4` や `artifacts/api-stability/20251124T073245Z/...` に記録された snapshot→server の変化を追跡。 |
| `lab` / 検査モジュール | LabResultsPanel + trend overlay | `useLaboModules` / `useLaboItemTrend`（staleTime=60s）でモジュール・推移を表示。`InlineMessage` で「カルテ対象未選択」「読み込み中」「取得失敗」「項目なし」を切り替え、Trend 右側は `TextField` + `SelectField` を read-only にして操作を限定。`artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/` や `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md` を証跡としつつ、`dataSourceTransition` を監査ログに含めて異常時 warning バナーへ転記する。 |
| ORCA Master (05/06/08) | OrcaOrderPanel / ClaimAdjustmentPanel / StatusBar / ReplayGap | `resolveMasterSource`（`WEB_ORCA_MASTER_SOURCE`・runtime flag）で `dataSource` を決定し、`fetchWithResolver` が `dataSourceTransition`・`fallbackUsed`・`missingMaster`・`cacheHit` を付与。`DataSourceBadgeRow`・`DataSourceBanner` で `missingMaster`/`fallbackUsed` を警告表示し、`recordOperationEvent` に `dataSource`/`runId`/`cacheHit` を渡して `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md` に対応する監査を確保。常に `FeedbackBox` や `InlineNotice` で `toast` 風の経路評価を表示し、`StatusBar` の Claim / Signature / Save 状態にも `claimError`/`signatureError` として引き継ぐ。 |
| letter / medical certificates | MedicalCertificatesPanel（一覧・詳細・保存/削除） | `fetchLetterSummaries` / `fetchMedicalCertificate`（`LETTER_QUERY_KEY`）は `useQuery` の `error` 情報を `InlineError` へ流し、保存/削除の `onError` で `setError`→トースト的メッセージを表示。`docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md` と `artifacts/external-interface/mml/20251116T210500Z-E3/README.md` を参照して差分確認を補強。 |

共通ルール: timeline・補助パネル・Claim フォームでは常に `dataSourceTransition` と `cacheHit` を表示／ログ出力し、MSW→snapshot→server の遷移や `missingMaster` の発生を `DataSourceBanner` / `FilterBadge` / `StatusBadge` で可視化する。ログは `artifacts/api-stability/20251124T000000Z/master-sync/20251124/` と `artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` を参照。 |

## 3. コンポーネント別ガードルール
### タイムライン & Document パネル
- `DocumentTimelinePanel` は `events`, `isLoading`, `isFetching`, `error` を使って `InlineFeedback`（tone=`info`/`warning`/`danger`/`neutral`）を切り替え、`filteredEvents` が空なら `selectedEventId` を null にして placeholder `カルテ対象を選択すると表示` を維持。`onDocumentSelected` との連携で document detail 取得後に `DetailCard` を更新し、rename 成功なら `tone=info` で「タイトルを更新しました」、失敗なら `tone=danger` で `mutationError.message` を表示する。`useDocumentDetail` が `fetchDocumentsByIds` から `DocInfoSummary` を取得するため、失敗時は DocumentTimeline を `read-only` にしつつ `FeedbackBox` で `placeholder` / `toast` 表示を兼ねる。
- `ReplayGapBanner` / `ReplayGapToast`（`useChartsReplayGap` → `lockEditing` / `ariaBusy`）が表示されている間、編集可能な SurfaceCard の Button を disable し、バナーが `role=status`・`aria-live` で状態を伝搬。 `ReplayGapToast` は `phase` を元にメッセージを切り替え、runbook へのリンクを付与して障害対応を誘導。

### 検査（Lab）パネル
- `LabResultsPanel` は `modulesQuery` の `isLoading`／`error`／`data` に応じて `InlineMessage` を表示。`patientId` 未設定時は placeholder、データがない場合は「検査結果が登録されていません」、エラー時は「再読み込みしてください」と表示し、`Button` や `SelectField` を `disabled` して read-only に保つ。trend 用 `useLaboItemTrend` も同様に `InlineMessage` へエラーメッセージを流し、値が数値化できないときは「数値化できるデータがありません」を表示。PDF 出力や `SelectField` 操作は `selectedModule` / `itemOptions` が揃うまで `disabled` する。

### Claim UI / ORCA 検索 / ステータスバー
- `ClaimAdjustmentPanel` は `docInfos` を `SelectField` へ流し、選択されていない・ドキュメント読み込み失敗時に `FeedbackBox` で `tone=danger` の警告を出し、`Button` を `disabled` にして再送タスクを抑制。`TextArea` は read-only で保険情報の補足を伝え、`claimMutation` の `onSuccess` で「CLAIM 再送信を受け付けました」(tone=`info`)、`onError` で `extractErrorMessage` を toast 的に表示する。
- `OrcaOrderPanel` は `useTensuSearch`/`useDiseaseSearch`/`useGeneralNameLookup` の結果に対して `DataSourceBadgeRow` で `dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed`/`runId`/`snapshot` を出力。`renderDataSourceWarning` で `missingMaster`/`fallbackUsed` を caution-tone banner にし、`transition` を明示。`recordOperationEvent` へ `dataSource` 情報を渡す (lines 591, 607, 641) ことで監査ログを `orchestration` して `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md` に連携。
- `StatusBar` は `saveState`/`signatureState`/`claimState` に基づき `tone` を設定し、`claimError` / `signatureError` を tooltip / `InlineNotice` で表示。`claimDisabledReason` があるときは button を grayed-out にし、`claimState` が `error` なら `StatusIndicator` を `danger` にして再送を促す。

## 4. UI 状態と React Query ポリシー
- `useDocInfos` / `useDiagnoses`（active/all）/`useFreeDocument` / `useDocumentDetail` は `staleTime=1000*30` で timeline の安定を保証。
- `useLaboModules` / `useLaboItemTrend` は `staleTime=1000*60` で検査結果をキャッシュし、trend overlay も 1 分間再フェッチを抑制。
- `useDocumentAttachments` は `staleTime=1000*60`・`gcTime=1000*60*5` で添付シグナルを保持。`useStampLibrary` は 5 分（300000ms）を新規スタンプ検索 TTL に使い、`useObservation` なども 30s 前後で整合。
- React Query の `error`／`mutation.onError` は `InlineFeedback` / `FeedbackBox` / `InlineError` / `StatusBar` に集約し、「placeholder（空状態）→ toast（FeedbackBox）→ read-only（Button disable）」の順で UI を安定させる。`InlineFeedback` には `role=status`・`aria-live` を付与して通知の可視性を確保。

## 5. API 接続とエラーパス
### doc-info-api.ts
`measureApiPerformance` で `/karte/docinfo` を叩き、`fetchDocInfos` は `DocInfoSummary` の `list` を `DocumentTimelinePanel` に渡す。取得失敗時は `DocumentTimelinePanel` と `ClaimAdjustmentPanel` が `InlineFeedback`/`FeedbackBox` で `tone=danger` を表示し、renaming 失敗は `renameFeedback` を使って warning toast を出す。placeholder が出ている間はタイムラインを read-only にし、Claim 送信ボタンを `disabled` に保つ。`docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md` 値を証跡とする。

### labo-api.ts
`fetchLaboModules`/`fetchLaboItemTrend` は `lab` 専用 API で、`normalizeLaboItem` などで空/null を排し、取得後 `LabResultsPanel` で placeholder / error 表示を切り替える。失敗時は trend overlay を閉じ、`Button` を `disabled` にし、`InlineMessage` で `再読み込み` を促す。`docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md` と `artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/` を添えておく。

### orca-api.ts
`fetchWithResolver` 経由で `fetchOrca05BridgeMasters` / `fetchOrca06BridgeMasters` / `fetchOrca08BridgeMasters` に `resolveMasterSource` を注入し、`dataSourceTransition` / `fallbackUsed` / `missingMaster` / `cacheHit` をレスポンスに付与。`OrcaOrderPanel` は `DataSourceBadgeRow`・`DataSourceBanner` で全 metadata を表示し、`RecordOperationEvent` で `dataSource`/`runId` を `audit.log` に流す。`ClaimAdjustmentPanel` / `StatusBar` は `claimMutation` の `onError` で `FeedbackBox` を toast として使い、`Button` を `disabled` にして再送中の read-only 体験を作る。証跡は `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4` / `artifacts/api-stability/20251124T000000Z/master-sync/20251124/` / `artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log`。

### letter-api.ts
`fetchLetterSummaries` / `fetchMedicalCertificate` / `saveMedicalCertificate` / `deleteLetter` は `MedicalCertificatesPanel` と `feedback` を共有し、`onError` で `setError` をトリガーして `InlineError` を表示。保存・削除成功は `setInfo` で `tone=info` の toast を出し、失敗時には `error` を `Role=status` で伝搬する。`docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md` および `artifacts/external-interface/mml/20251116T210500Z-E3/README.md` を証跡とする。

## 6. API と証跡の並列表
| API | 証跡 / artifact |
| --- | --- |
| `web-client/src/features/charts/api/doc-info-api.ts` | `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md`（Charts docinfo SLA）<br>`artifacts/api-stability/20251120T191203Z/schemas/backward-compat-scenarios.md#charts-docinfo` |
| `web-client/src/features/charts/api/labo-api.ts` | `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md`（MML/検査サンプル）<br>`artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/` |
| `web-client/src/features/charts/api/orca-api.ts` | `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4`（dataSourceTransition / warning banner）<br>`artifacts/api-stability/20251124T000000Z/master-sync/20251124/` / `artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` |
| `web-client/src/features/charts/api/letter-api.ts` | `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md#4-証跡リンク`<br>`artifacts/external-interface/mml/20251116T210500Z-E3/README.md` |
