# Web クライアント UX ドキュメント再編計画（RUN_ID=20251127T150000Z）

## 目的
3 つの UX ポリシードキュメント（`reception-schedule-ui-policy.md`, `patients-admin-ui-policy.md`, `charts-claim-ui-policy.md`）を Web クライアントに関する設計・監査・運用の中心に据え、残る UX 関連資料の役割と更新ルールを整理して「最高の WEB クライアント」を実装するためのドキュメントセットを再編します。必須の情報はこの 3 文書でカバーし、他資料は背景説明・履歴として `ux/legacy/` 以下へ移して参照管理を簡潔化します。

## 1. 三大ポリシー文書とその役割
### 1.1 Reception + Schedule
- 受付・施設スケジュール画面のコンポーネント構成、API/ORCA 依存、管理側の入力制御・バナー・再取得・監査ログを `docs/web-client/ux/reception-schedule-ui-policy.md` で定義。`TooltipFields` による `progress/status` の統一、`dataSourceTransition` ベースの再取得/バナー、`runId` を含む `audit.log*` の整合をこの文書が担います。
- Reception 系の実装ではこの文書を起点とし、`docs/web-client/architecture/ui-api-mapping.md` と `planning/phase2/DOC_STATUS.md` 上の対応行を同一 RUN_ID で更新してください。

### 1.2 Patients + Administration
- 患者一覧・編集と管理者コンソールの UI 要件、ORCA/PHR ブリッジ、権限・監査・トーンの共通運用を `docs/web-client/ux/patients-admin-ui-policy.md` に集約。保存前チェック・ステータスバナー・Warning/Danger の `StatusBadge` や `Toast` の統一的運用もここで指示します。
- 管理系の変更ではこの文書と `docs/web-client/architecture/ui-api-mapping.md` の該当ルーティング節・`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` で定義されたブリッジ層を照合し、新たな RUN_ID を DOC_STATUS/manager checklist へ追記してください。

### 1.3 Charts + Claim
- カルテページ・Claim フォームのデータ依存、障害/空状態・`dataSourceTransition`/`cacheHit` の可視化、React Query ポリシー、API パスと証跡マッピングを `docs/web-client/ux/charts-claim-ui-policy.md` で整理。この文書が Charts 系 UI の最初の参照先です。
- 監査メタ・StatusBar トーン・Claim 再送の guard、React Query の `staleTime`/`onError` による read-only 体験まで、カルテ担当はこの文書に従って UI 側の `RecordOperationEvent` や `audit.log` を確認してください。

## 2. 旧来 UX ドキュメントの整理
以下の資料は `ux/legacy/` に移動し、背景・経緯資料としてのみ参照します。今後のアクションやレビューではこの再編計画と 3 大ポリシーを優先し、legacy 資料を補足として扱ってください。
| ファイル | 説明 |
| --- | --- |
| `legacy/CHART_UI_GUIDE_INDEX.md` | カルテ UI リファレンスの索引。インデックスが必要な場合はこのファイルを参照しつつ、最新の設計は `charts-claim-ui-policy.md` を起点に確認してください。 |
| `legacy/API_SURFACE_AND_AUDIT_GUIDE.md` | API/監査フックのページ別マッピング。新規の API/UX 変更では本計画の 3 つのポリシーと `architecture/REST_API_INVENTORY.md` を参照し、legacy ファイルは背景説明と位置づけです。 |
| `legacy/KARTE_SCREEN_IMPLEMENTATION.md` | カルテ画面の詳細構造。必要な寸法や以前の history はこのファイルに残しましたが、実装指針は `charts-claim-ui-policy.md` に含まれる最新のルールで確認してください。 |
| `legacy/ONE_SCREEN_LAYOUT_GUIDE.md` | 1 画面完結レイアウトの比率。過去の測定値・レイアウト図をこの資料で追い、現行の UI 調整は `charts-claim-ui-policy.md` で管理します。 |

## 3. ドキュメント更新ルール
1. 対象領域を変更する場合は必ずこの再編計画 → 該当ポリシー（Reception/Patients/Charts） → `architecture/ui-api-mapping` の順で参照し、`planning/phase2/DOC_STATUS.md` 上の該当行に RUN_ID・証跡リンクを記載。2. RUN_ID は `YYYYMMDDThhmmssZ` 形式で統一（派生 ID も親 ID を記載）。3. 監査ログ・テスト証跡は `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に保存し、当該ポリシーの「証跡 / Notes」節でリンクさせる。4. legacy ファイルへ新たな情報を追加することは避け、必要なら新しい RUN_ID 付きで別資料（この再編計画または各ポリシー）を作成してください。

## 4. 次の整備候補
- 各ポリシーに `TL;DR` セクションを設け、特に監査メタ・ステータスバナー・runId 表示ルールを 1 ページで示す。\
- `legacy` フォルダの内容を要約したスライドまたは Notion 用のショートノートを別途準備し、新メンバーには再編計画 + base doc を必ず読ませる。\
- 新規 UI 変更はこの再編計画を参照するよう README や `managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` を更新済み。この状態を維持してください。
