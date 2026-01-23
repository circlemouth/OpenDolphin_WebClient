# Webクライアント 同期・キャッシュとリアルタイム更新（preprod 実装課題インベントリ）

- RUN_ID: 20260123T044558Z
- 作業日: 2026-01-23
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/05_同期キャッシュとリアルタイム更新.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769143472859-d11e08
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/web-client/architecture/doctor-workflow-status-20260120.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/architecture/future-web-client-design.md`

## 確認スコープ
- queueStatus（/api/orca/queue と /orca/claim/outpatient の差分、画面間の同期）
- 配信バナー（AdminBroadcast の同期・永続化）
- 患者/受付の再取得戦略（polling/手動更新/ブロードキャスト）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 対象 | 現状 | 差分/課題 | 影響 | 再現条件 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SC-01 | 配信バナー（AdminBroadcast） | AdminBroadcast は localStorage に永続化され、初回レンダリングでそのまま表示される。TTL/施設・ユーザーの整合チェックがない。 | 前回セッションの古い配信情報が残り、別施設/別ユーザーでも古いバナーが表示される可能性。`updatedAt` はあるが UI で期限判定せず、破棄条件が未定義。 | stale 表示による誤認（送信停止・masterSource の誤解釈）、再取得が不要なタイミングで走る（影響: 受付/医師/管理者）。 | Admin で配信後にログアウト→別ユーザー/別施設でログインし、Reception/Charts/Patients を開くと旧バナーが表示される。 | `web-client/src/libs/admin/broadcast.ts`, `web-client/src/libs/admin/useAdminBroadcast.ts`, `web-client/src/features/shared/AdminBroadcastBanner.tsx` | P2 |
| SC-02 | Reception の受付一覧（appointments） | 受付一覧は `useQuery` だが `refetchInterval` がなく、検索条件変更/ブロードキャスト以外で自動更新されない。 | 受付情報が変化しても（受付登録/キャンセル/来院）画面に反映されない時間が発生。`queueStatus` が claim 側更新に引きずられて古くなる。 | 受付/来院のリアルタイム性が不足し、受付表の状態が stale になる（影響: 受付）。 | Reception を開いたまま別端末で受付登録/キャンセル後、90秒以上待っても一覧が更新されない。 | `web-client/src/features/reception/pages/ReceptionPage.tsx` | P2 |
| SC-03 | Patients の患者一覧 | Patients 一覧は `staleTime=60s` のみで `refetchInterval` がなく、AdminBroadcast 更新時のみ再取得。 | 患者検索結果の更新が他端末や別画面の更新に追従しない。リアルタイム更新の設計（`AuthService`/broadcast carry-over）と乖離。 | 患者情報の更新漏れ、再描画条件不足（影響: 受付/医師）。 | Patients を開いたまま別画面で患者情報更新→60秒以上待っても一覧/詳細が更新されない。 | `web-client/src/features/patients/PatientsPage.tsx` | P2 |
| SC-04 | Charts の masterSource 切替とキャッシュ | `chartsMasterSourcePolicy` が変わっても queryKey が同一のため、`preferredSourceOverride` の変更が即時反映されない。appointment/summary/claim が旧キャッシュのまま残る。 | `dataSourceTransition` の切替時に再取得が遅延または発生せず、`cacheHit`/`missingMaster` 表示が不整合になりうる。 | 配信バナーで masterSource を切替えても実データが更新されず、運用時の切替検証に失敗する（影響: 医師/管理者）。 | Administration で masterSource を mock→server に切替後、Charts を開いても claim/appointment/summary が旧データのまま。 | `web-client/src/features/charts/pages/ChartsPage.tsx`, `docs/web-client/architecture/web-client-api-mapping.md` | P1 |
| SC-05 | queueStatus の画面間不整合 | Reception は `/orca/claim/outpatient` の `queueEntries` を利用し、Charts/Administration は `/api/orca/queue` を30/60秒でポーリング。AdminBroadcast にはポーリング結果が配信されない。 | 画面によって queueStatus が異なる（更新頻度・取得元が違う）。Administration 側の更新が他画面に反映されず、queueStatus が stale のまま。 | 診療送信の遅延/失敗判定が画面によってズレ、運用判断が困難（影響: 受付/医師/管理者）。 | Charts でキューが success に更新後、Reception の queue 表示が古いまま残る。 | `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/administration/AdministrationPage.tsx`, `docs/web-client/architecture/future-web-client-design.md` | P1 |
| SC-06 | Broadcast による再描画条件 | Reception/Patients は broadcast 更新で refetch するが、Charts は adminConfig 以外の data 再取得が発火しない。 | 配信変更（masterSource/送信可否）後に、Charts の claim/appointment/summary が即時再描画されない。 | 配信バナーと実データのタイミングがズレ、UI の整合性が崩れる（影響: 医師/管理者）。 | Administration で配信変更→Charts を開き直しても claim/summary が再取得されない（adminConfig のみ更新）。 | `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/patients/PatientsPage.tsx` | P2 |

## 補足メモ（観測）
- `AuthServiceProvider` のフラグ carry-over 方針（`future-web-client-design.md`）に対し、実装側は「broadcast で refetch」中心で、画面間の再描画条件が不統一。
- `web-client-api-mapping.md` は `cacheHit` を React Query の `isCached/isStale` で判定する設計だが、画面ごとに `refetchInterval` が不均一なため、`cacheHit`/`missingMaster` 表示の意味が画面間でズレる可能性がある。

## queueStatus 取得経路の整理
- Reception: `/orca/claim/outpatient` の `queueEntries` を使用（claim 取得と同タイミング、polling 90s）。
- Charts: `/api/orca/queue` を 30s 間隔でポーリング（専用 queryKey `['orca-queue']`）。
- Administration: `/api/orca/queue` を 60s 間隔でポーリング（`queueQuery`）。
- ブロードキャスト: AdminBroadcast には queueStatus を配信しないため、Reception/Charts/Administration の同期経路は存在しない。

## AdminBroadcast 永続化の現状と改善方向
- localStorage キー: `admin:broadcast`（`web-client/src/libs/admin/broadcast.ts`）
- 期限判定: なし（`updatedAt` を保存するが UI/読み取り側で TTL 判定は実施していない）
- 破棄条件: 明示なし（ログアウト/ユーザー切替で削除されず、次回起動時にそのまま復元）
- 改善方向（案）: TTL を導入し、`facilityId`/`userId` を payload に含めて一致しない場合は破棄。`updatedAt` を用いて期限切れを自動削除する。

## Charts masterSource 切替の最小修正案
- 現行 queryKey に含まれていない要素: `preferredSourceOverride`（= `chartsMasterSourcePolicy` の結果）、`chartsDisplayEnabled`/`chartsSendEnabled` の配信変更に伴う再取得トリガ。
- 最小修正案: `['charts-claim-flags', preferredSourceOverride]` など queryKey に `preferredSourceOverride` を追加、または配信変更時に `queryClient.invalidateQueries` で claim/appointment/summary を再取得。

## 証跡（参照コード）
- AdminBroadcast 永続化: `web-client/src/libs/admin/broadcast.ts`
- Reception 受付一覧/queueStatus: `web-client/src/features/reception/pages/ReceptionPage.tsx`
- Charts queueStatus/polling: `web-client/src/features/charts/pages/ChartsPage.tsx`
- Administration queue polling/broadcast: `web-client/src/features/administration/AdministrationPage.tsx`

## 暫定対応/運用回避策
- 配信変更後は Reception/Charts/Patients を一度リロードしてキャッシュを捨てる（ブラウザ更新）。
- masterSource 切替検証時は Charts で手動再取得（claim/appointment/summary の更新ボタンがあれば使用）を必ず実施。
- queueStatus の運用判断は Administration の `/api/orca/queue` を正とし、Reception の表示は参考扱いとする。
