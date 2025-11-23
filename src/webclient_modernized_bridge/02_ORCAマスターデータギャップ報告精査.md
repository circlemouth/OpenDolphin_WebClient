# 02_ORCAマスターデータギャップ報告精査

- RUN_ID: `20251123T135709Z`（元レポート RUN_ID=`20251123T130134Z` を参照）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 本ファイル
- 期間: 2025-11-24 09:00 〜 2025-11-25 09:00 JST
- 根拠資料:  
  - `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`  
  - `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7  
  - `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`

## 1. サマリ
- 現状、点数・病名・一般名・相互作用・入力セット/スタンプは REST 提供済み（DB 直読）。  
- 一方で薬剤分類・最低薬価・用法・特定器材・検査分類・保険者・住所など多数のマスタが未提供で、薬剤/材料オーダーや資格確認 UI の要件を満たさない。  
- 既存の重大ギャップ（ORCA-01〜03）は 2025-11-16 対応で解消済みだが、未提供マスタ（ORCA-05/06）と接続設定のハードニング（ORCA-07）が残る。  
- Web クライアント側では点数帯フィルタ未実装（ORCA-04）のため、UI backlog として残置。

## 2. ギャップ一覧（UI/Sync 観点）
| ID | 内容 | Web クライアント影響 | 必要対応 |
| --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の括弧漏れで `S%` に施設フィルタが効かない（済） | 他施設セット混入リスク（過去版）。修正済みのため影響解消。 | 済（RUN_ID=`20251116T210500Z-B`）。 |
| ORCA-02 | `/orca/stamp/{setCd,name}` 診療日未指定（済） | 過去/未来カルテでスタンプ取得不可 → 修正済み。 | 済（visitDate 追加）。 |
| ORCA-03 | `/orca/tensu/shinku` が単位/薬剤区分未返却（済） | `/shinku` 検索時に単位・薬剤区分欠落 → 修正済み。 | 済（列追加）。 |
| ORCA-04 | `/orca/tensu/ten` UI 連携なし | 点数帯フィルタが提供されず検索効率低下。 | UI 実装（Phase5 backlog）。 |
| ORCA-05 | 薬剤分類・最低薬価・用法・特定器材・検査分類 未提供 | 薬剤・材料・検査オーダーで禁忌/区分フィルタ不可。 | サーバー REST 追加（DB 直読 or ORCA API ラップ）、DTO/Schema 追加。 |
| ORCA-06 | 保険者・住所マスタ 未提供 | 資格確認・住所補完・保険者選択が手入力に依存。 | サーバー REST 追加 + Web クライアント型定義/UI 連携。 |
| ORCA-07 | ORCA DB 接続が `custom.properties` 直指定 | 環境切替や資格情報ローテ時に手作業／監査不足。 | DataSource + Secrets 管理へ移行、接続プール/監査整備。 |

## 3. 推奨タスク（優先順）
1. **サーバー実装バックログ化**: ORCA-05/06/07 を `notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` へ登録し、実装オーナーと ETA を設定。  
2. **UI backlog 明記**: ORCA-04 を `process/API_UI_GAP_ANALYSIS.md` の Web クライアント差分欄へ追記。点数帯フィルタ追加時の MSW 期待値は `artifacts/api-stability/20251123T130134Z/` をベースに作成。  
3. **フィールド定義整合**: 新規マスタ追加に合わせ `web-client/src/types/orca.ts` への型拡張と `/features/charts/api/orca-api.ts` のクライアント関数を準備（データ提供時にすぐ UI 実装へ移れるようにスケルトンだけ先行用意）。  
4. **接続設定ハードニング**: ORCAConnection を DataSource/Secret 連携へ移行する設計メモを ops に共有し、資格情報ローテ手順を `docs/web-client/operations/mac-dev-login.local.md` にリンク。  
5. **監査/テスト**: 追加マスタ用の MSW/fixture を `artifacts/api-stability/20251123T130134Z/` に揃え、API 安定性の自動チェックに組み込む。

## 4. 証跡
- 精査ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md`
- 元レポート: `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（RUN_ID=`20251123T130134Z`）
