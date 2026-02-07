# Flow Parity Notes (Reception -> Charts -> Finish -> Billing)

RUN_ID=`20260207T051441Z-cmd_20260207_06_sub_1-flow-parity`

Scope:
- Business flow: 受付 -> カルテ(Charts) -> 診察完了(診療終了/送信) -> 会計
- Goal: "legacy (Swing) vs Web" gaps are expressed as step-level deltas, with evidence pointers.

Important modernization policy:
- Web client must not depend on CLAIM `/orca/claim/outpatient` (see `docs/verification-plan.md`).
- Legacy had CLAIM-centric status + background services; Web replaces this with ORCA routes + queue visibility + admin retry/discard.

## Step-level Mapping (Legacy vs Web)

Legend (Delta):
- `OK`: parity covers legacy intent
- `MISSING`: missing in Web
- `DIFF`: intentional spec difference
- `EDGE`: edge-case handling differs / needs explicit policy

| Step | Legacy (Swing) | Web (Modernized) | Delta | Evidence |
| --- | --- | --- | --- | --- |
| 1. 受付一覧を開く | 受付リスト(待ちリスト)を表示、受付受信サーバ/リレー等に依存し得る | Reception page が `/orca/appointments/list`・`/orca/visits/list` と `/api/orca/queue` を表示 | DIFF | `client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java`, `client/src/main/java/open/dolphin/impl/server/PVTClientServer.java`, `web-client/src/features/reception/pages/ReceptionPage.tsx`, `docs/weborca-reception-checklist.md` |
| 2. 受付登録(予約外当日) | 受付登録/取消（PVT/relay/サイト依存） | 受付送信フォーム -> `/orca/visits/mutation`（acceptmodv2） | OK | `docs/verification-plan.md`（REC-030）, `docs/weborca-reception-checklist.md`, `docs/web-client/operations/reception-billing-flow-status-20260120.md` |
| 3. 受付行からカルテ起動 | 受付行ダブルクリック等で Chart を開く | Reception 行ダブルクリックで `buildChartsUrl` へ遷移（encounter context を付与） | OK | `web-client/src/features/reception/pages/ReceptionPage.tsx`（handleRowDoubleClick）, `web-client/src/features/charts/encounterContext.ts` |
| 4. SOAP入力/ドラフト保存 | SOAP/文書/オーダー等の編集 | Charts: SOAP editor + draft action（compact flagsでも可視性を回帰しない） | OK | `web-client/src/features/charts/pages/ChartsPage.tsx`, `docs/web-client/legacy-vs-web-feature-parity.md`（CHART-010/020） |
| 5. 診療行為送信（診察完了の実務） | CLAIM送信 + ACK/NAK + 再送/保留（サイト依存） | Charts ActionBar: `ORCA送信` = `/api21/medicalmodv2`（XML） + best-effort `/api21/medicalmodv23` | DIFF | `client/src/main/java/open/dolphin/impl/claim/SendClaimImpl.java`, `web-client/src/features/charts/ChartsActionBar.tsx`, `docs/verification-plan.md` |
| 6. 診療終了操作（明示） | UI上の「診療終了」やカルテクローズ/状態遷移（サイト差） | Charts ActionBar: `診療終了`（finish）= outpatient endpoint or medicalmodv23（guardあり） | EDGE | `web-client/src/features/charts/ChartsActionBar.tsx`（action=finish, medicalmodv23）, `docs/web-client/operations/reception-billing-flow-status-20260120.md` |
| 7. 受付へ戻る | 受付リストへ戻り次の患者を処理 | OrcaSummary/Charts から Reception へ遷移（from/runId/transition を保持） | OK | `web-client/src/features/charts/OrcaSummary.tsx`（handleNavigate/handleOpenReception）, `web-client/src/AppRouter.tsx` |
| 8. 会計状態の可視化 | CLAIM状態や会計ステータス（サイト依存） | Reception/OrcaSummary で invoiceNumber + 会計待ち/会計済み を表示（incomeinfv2 参照） | EDGE | `web-client/src/features/charts/OrcaSummary.tsx`, `web-client/src/features/reception/pages/ReceptionPage.tsx`, `docs/web-client/operations/reception-billing-flow-status-20260120.md` |
| 9. 例外時（送信失敗/滞留） | CLAIM 再送/保留/破棄など（運用/バックグラウンド連携） | Web: `/api/orca/queue` を根拠に例外を提示。Reception/Administration で retry/discard、ChartsActionBar でも warning/error 時に `retry=1` を叩く | EDGE | `web-client/src/features/reception/pages/ReceptionPage.tsx`（handleRetryQueue）, `web-client/src/features/administration/AdministrationPage.tsx`（retry/discard）, `web-client/src/features/charts/ChartsActionBar.tsx`（warning/error時 queue retry）, `docs/weborca-reception-checklist.md` |

## Observed Gaps / Backlog Candidates (step-granular)

- 会計確定の "業務合格" 定義（invoiceNumber と incomeinfv2 の突合せ、領収書/明細の確認範囲）を P0 として明文化し、実 ORCA で RUN 証跡を追加する。
- 例外時の導線（Reception から「再送/破棄」へ誘導、権限不足時の次の一手）を P0 として UI/ops で収束させる。
- 「診療終了（finish）」の運用上の意味（どの状態をどう変えるか）を FLOW として定義し、Reception の会計待ち/診療中 への影響を検証して Parity に証跡を追加する。

