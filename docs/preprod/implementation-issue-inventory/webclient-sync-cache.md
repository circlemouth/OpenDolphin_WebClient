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

| ID | 対象 | 現状 | 差分/課題 | 影響 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| SC-01 | 配信バナー（AdminBroadcast） | AdminBroadcast は localStorage に永続化され、初回レンダリングでそのまま表示される。TTL/施設・ユーザーの整合チェックがない。 | 前回セッションの古い配信情報が残り、別施設/別ユーザーでも古いバナーが表示される可能性。`updatedAt` はあるが UI で期限判定せず、破棄条件が未定義。 | stale 表示による誤認（送信停止・masterSource の誤解釈）、再取得が不要なタイミングで走る。 | `web-client/src/libs/admin/broadcast.ts`, `web-client/src/libs/admin/useAdminBroadcast.ts`, `web-client/src/features/shared/AdminBroadcastBanner.tsx` | P2 |
| SC-02 | Reception の受付一覧（appointments） | 受付一覧は `useQuery` だが `refetchInterval` がなく、検索条件変更/ブロードキャスト以外で自動更新されない。 | 受付情報が変化しても（受付登録/キャンセル/来院）画面に反映されない時間が発生。`queueStatus` が claim 側更新に引きずられて古くなる。 | 受付/来院のリアルタイム性が不足し、受付表の状態が stale になる。 | `web-client/src/features/reception/pages/ReceptionPage.tsx` | P2 |
| SC-03 | Patients の患者一覧 | Patients 一覧は `staleTime=60s` のみで `refetchInterval` がなく、AdminBroadcast 更新時のみ再取得。 | 患者検索結果の更新が他端末や別画面の更新に追従しない。リアルタイム更新の設計（`AuthService`/broadcast carry-over）と乖離。 | 患者情報の更新漏れ、再描画条件不足。 | `web-client/src/features/patients/PatientsPage.tsx` | P2 |
| SC-04 | Charts の masterSource 切替とキャッシュ | `chartsMasterSourcePolicy` が変わっても queryKey が同一のため、`preferredSourceOverride` の変更が即時反映されない。appointment/summary/claim が旧キャッシュのまま残る。 | `dataSourceTransition` の切替時に再取得が遅延または発生せず、`cacheHit`/`missingMaster` 表示が不整合になりうる。 | 配信バナーで masterSource を切替えても実データが更新されず、運用時の切替検証に失敗する。 | `web-client/src/features/charts/pages/ChartsPage.tsx`, `docs/web-client/architecture/web-client-api-mapping.md` | P1 |
| SC-05 | queueStatus の画面間不整合 | Reception は `/orca/claim/outpatient` の `queueEntries` を利用し、Charts/Administration は `/api/orca/queue` を30/60秒でポーリング。AdminBroadcast にはポーリング結果が配信されない。 | 画面によって queueStatus が異なる（更新頻度・取得元が違う）。Administration 側の更新が他画面に反映されず、queueStatus が stale のまま。 | 診療送信の遅延/失敗判定が画面によってズレ、運用判断が困難。 | `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/administration/AdministrationPage.tsx`, `docs/web-client/architecture/future-web-client-design.md` | P1 |
| SC-06 | Broadcast による再描画条件 | Reception/Patients は broadcast 更新で refetch するが、Charts は adminConfig 以外の data 再取得が発火しない。 | 配信変更（masterSource/送信可否）後に、Charts の claim/appointment/summary が即時再描画されない。 | 配信バナーと実データのタイミングがズレ、UI の整合性が崩れる。 | `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/patients/PatientsPage.tsx` | P2 |

## 補足メモ（観測）
- `AuthServiceProvider` のフラグ carry-over 方針（`future-web-client-design.md`）に対し、実装側は「broadcast で refetch」中心で、画面間の再描画条件が不統一。
- `web-client-api-mapping.md` は `cacheHit` を React Query の `isCached/isStale` で判定する設計だが、画面ごとに `refetchInterval` が不均一なため、`cacheHit`/`missingMaster` 表示の意味が画面間でズレる可能性がある。

## 証跡（参照コード）
- AdminBroadcast 永続化: `web-client/src/libs/admin/broadcast.ts`
- Reception 受付一覧/queueStatus: `web-client/src/features/reception/pages/ReceptionPage.tsx`
- Charts queueStatus/polling: `web-client/src/features/charts/pages/ChartsPage.tsx`
- Administration queue polling/broadcast: `web-client/src/features/administration/AdministrationPage.tsx`
