# 02_ORCAマスターデータギャップ報告精査

- RUN_ID: `20251123T135709Z`（元レポート RUN_ID=`20251123T130134Z` を参照）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 本ファイル
- 期間: 2025-11-23 09:00 〜 2025-11-24 09:00 JST
- 根拠資料:  
  - `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`  
  - `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7  
  - `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`
  - ORCA DB テーブル定義書アーカイブ（firecrawl）: `docs/server-modernization/phase2/operations/assets/orca-db-schema/README.md`（正式版優先／長期収載品選定療養のみ速報版併用）。

## 1. サマリ
- 点数・病名・一般名・相互作用・入力セット/スタンプは REST 提供済み（DB 直読）。  
- 点数帯フィルタ（ORCA-04）は Web クライアントで UI/MSW/型まで実装済み。実 ORCA API との接続切替が残課題。  
- 薬剤分類・最低薬価・用法・特定器材・検査分類・保険者・住所・電子点数表などのマスタはサーバー REST 未提供（ORCA-05/06/08）。接続設定のハードニング（ORCA-07）も未着手。  
- 既存の重大ギャップ（ORCA-01〜03）は 2025-11-16 対応で解消済み。

## 2. ギャップ一覧（UI/Sync 観点）
| ID | 内容 | Web クライアント影響 | 必要対応 | 対応状況 |
| --- | --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の括弧漏れで `S%` に施設フィルタが効かない（済） | 他施設セット混入リスク（過去版）。修正済みのため影響解消。 | 済（RUN_ID=`20251116T210500Z-B`）。 | 済 |
| ORCA-02 | `/orca/stamp/{setCd,name}` 診療日未指定（済） | 過去/未来カルテでスタンプ取得不可 → 修正済み。 | 済（visitDate 追加）。 | 済 |
| ORCA-03 | `/orca/tensu/shinku` が単位/薬剤区分未返却（済） | `/shinku` 検索時に単位・薬剤区分欠落 → 修正済み。 | 済（列追加）。 | 済 |
| ORCA-04 | `/orca/tensu/ten` UI 連携なし | 点数帯フィルタが提供されず検索効率低下。 | UI 実装（Phase5 backlog）。 | MSW/型/UI 実装済み（実API切替待ち、RUN_ID=`20251123T135709Z`）。 |
| ORCA-05 | 薬剤分類・最低薬価・用法・特定器材・検査分類 未提供 | 薬剤・材料・検査オーダーで禁忌/区分フィルタ不可。 | サーバー REST 追加（DB 直読 or ORCA API ラップ）、DTO/Schema 追加。 | 未着手（サーバー REST 追加待ち）。 |
| ORCA-06 | 保険者・住所マスタ 未提供 | 資格確認・住所補完・保険者選択が手入力に依存。 | サーバー REST 追加 + Web クライアント型定義/UI 連携。 | 未着手（サーバー REST 追加待ち）。 |
| ORCA-07 | ORCA DB 接続が `custom.properties` 直指定 | 環境切替や資格情報ローテ時に手作業／監査不足。 | DataSource + Secrets 管理へ移行、接続プール/監査整備。 | 未着手（設計メモのみ）。 |
| ORCA-08 | 電子点数表 (`TBL_ETENSU_1~5`) REST 不在 | 電子点数表に依存する加算・区分計算ができず、改定時に誤計算リスク。 | 電子点数表の REST/DTO 追加（点数マスタとは別テーブル）。 | MSW 実装済み（web-client）、サーバー未実装。 |

## 3. 推奨タスク（優先順）
1. **サーバー実装**: ORCA-05/06/07/08 の REST を実装し、`notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` に ETA/オーナーを更新。  
2. **実API切替**: ORCA-04 点数帯フィルタと ORCA-08 電子点数表を実 ORCA API に接続し、MSW→実測レスポンスへの切替検証を実施。  
3. **テスト強化**: 点数帯フィルタ UI のコンポーネントテスト追加、および MSW/実API 両系統での回帰テストを整備。  
4. **接続設定ハードニング**: ORCAConnection の DataSource/Secret 化を進め、ローテ手順を `docs/web-client/operations/mac-dev-login.local.md` と連携。  
5. **フィクスチャ更新**: サーバー実装後に `artifacts/api-stability/20251123T130134Z/` の MSW スキーマを実測値で差し替え、型整合を再確認。

## 4. 追加進捗（2025-11-24 07:35 JST）
- **MSW/型/テスト**: `/orca/master/{address,etensu,generic-class,generic-price,hokenja,kensa-sort,material,youhou}` をフィクスチャ/ハンドラ化（`web-client/src/mocks/fixtures/orcaMaster.ts`, `src/mocks/handlers/orcaMasterHandlers.ts`）。型は `web-client/src/types/orca.ts` でラッパー付きに整合。`npm run lint -- --max-warnings=0 --no-cache` / `npm run typecheck -- --pretty false` / `npm test -- --watch=false` を実行し PASS（AppShell a11y テストはコンテキストモックで解消）。
- **UI 実装**: `web-client/src/features/charts/components/OrcaOrderPanel.tsx` に点数帯フィルタ（下限/上限・評価日・プリセット）を追加し、`/orca/tensu/ten` を `min-max[,yyyymmdd]` 形式で呼び出し。React Query フック `useTensuPointSearch` で API と接続。MSW 側にも点数帯フィルタリングハンドラを追加。
- **ドキュメント反映**: API インベントリ・API_UI_GAP_ANALYSIS・本ギャップ表の対応状況を「MSW/型/UI 実装済み、実API切替待ち」に更新。DOC_STATUS に lint/test PASS を RUN_ID 付きで記録。

## 5. 証跡
- 精査ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md`
- MSW 実装ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-orca-master-msw.md`
- 元レポート: `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（RUN_ID=`20251123T130134Z`）
