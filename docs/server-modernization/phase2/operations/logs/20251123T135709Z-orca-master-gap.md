# 2025-11-23 ORCA マスターデータ重大ギャップ精査ログ

- RUN_ID: `20251123T135709Z`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `src/webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md`
- 対象期間: 2025-11-24 09:00 〜 2025-11-25 09:00 (JST 想定)
- ソース確認:  
  - `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（RUN_ID=`20251123T130134Z`）  
  - `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7  
  - `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`

## ギャップ精査結果

| ID | 内容 | UI/Sync 影響 | API 不足フィールド／コード体系 | 優先度 | 現状 |
| --- | --- | --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の WHERE 句に括弧が無く、`S%` セットで `hospnum` フィルタが効かず他施設セットが混入するリスク。 | スタンプ管理/選択 UI に他施設データが混ざる恐れ。施設切替やマルチテナント時のスタンプ同期が不正確になる。 | 施設コードの強制適用が不足（SQL 条件誤り）。 | High | `20251116T210500Z-B` で `hospnum=<n> AND (P% OR S%)` に修正済み。 |
| ORCA-02 | `/orca/stamp/{setCd,name}` が診療日を受け取らず、当日基準でのみ有効期間判定。過去/未来カルテで正しくセット展開できない。 | カルテ再編集や予約診療日のプレビューでスタンプが取得できず、UI で「無効」扱いになる可能性。 | `visitDate` パラメータ欠落。日付を有効期間チェックへ反映するコードパスが無い。 | High | `20251116T210500Z-B` で `setCd, stampName, visitDate` に拡張し、`tbl_inputset/tbl_tensu` の有効期間チェックへ反映済み。 |
| ORCA-03 | `/orca/tensu/shinku` が `taniname`（単位名）、`ykzkbn`（薬剤区分）、`yakkakjncd`（薬価コード）を返さないため、診療区分検索モードでは単位/区分が欠落。 | OrcaOrderPanel で `/shinku` 検索時に単位や薬剤区分が表示されず、オーダー作成時に誤選択・再検索が発生する。 | 上記 3 列が SELECT/DTO に欠落。コード体系は点数マスタと同一だが返却されない。 | High | `20251116T210500Z-B` で列を追加し `/tensu/name` と同水準に合わせ済み。 |
| ORCA-04 | `/orca/tensu/ten` は API ありだが Web クライアント UI で点数帯フィルタが未実装。 | 点数帯別の検索/フィルタを提供できず、オーダー候補の絞り込みに時間が掛かる。 | API 側の列は揃っているが UI 連携が未着手。 | Medium | Phase5 backlog（UI 実装 pending）。 |
| ORCA-05 | 薬剤分類・最低薬価・用法・特定器材・検査分類が未提供（`TBL_GENERIC_CLASS`, `TBL_GENERIC_PRICE`, `TBL_YOUHOU`, `TBL_MATERIAL_*`, `TBL_KENSASORT` など）。 | 薬剤/材料/検査オーダーで禁忌・区分フィルタ不可。UI が代替検索できず業務停止リスク。 | 上記テーブルのフィールドを返す REST が不存在。薬効分類コード・用法コード等を DTO/Schema に追加する必要。 | Critical | 新規 REST 追加要（DB 直読 or ORCA 公式 API ラップ）。 |
| ORCA-06 | 保険者・住所マスタ（`TBL_HKNJAINF`, `TBL_ADRS`）未提供。 | 資格確認・住所補完・保険者選択が手入力に依存。 | 保険者コード・住所コード体系の REST/型定義が欠落。 | High | 新規 REST 追加要。 |
| ORCA-07 | ORCA DB 接続が `custom.properties` 直指定で DataSource/Secrets 化されていない。 | 環境切替や資格情報ローテ時に手作業／監査不足。 | 接続設定の標準化・Secret 管理・プール化が未整備。 | Medium | `ORCAConnection` を DataSource 化し Secrets 管理へ移行推奨。 |

## メモ / 次アクション
- `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md` を反映して ORCA-05〜07 を追加。UI 影響と必要フィールドを Web クライアント仕様へ反映するため、`process/API_UI_GAP_ANALYSIS.md` への追記を別途チケット化する。
- ORCA-05/06 はサーバー側 backlog として `notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` に転記し、実装経路（DB 直読 REST or ORCA 公式 API ラップ）とオーナー/ETA を設定する。
- ORCA-04 は UI 実装タスクを Phase5 backlog として継続。点数帯フィルタを追加する場合、MSW/fixture を `artifacts/api-stability/20251123T130134Z/` に合わせて用意する。
