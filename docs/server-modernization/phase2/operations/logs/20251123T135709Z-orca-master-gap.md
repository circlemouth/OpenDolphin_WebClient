# 2025-11-23 ORCA マスターデータ重大ギャップ精査ログ

- RUN_ID: `20251123T135709Z`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `src/webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md`
- 対象期間: 2025-11-24 09:00 〜 2025-11-25 09:00 (JST 想定)
- ソース確認:  
  - `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7  
  - `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`  
  - ※指示にあった `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md` はリポジトリ内で未検出のため、上記2点で代替精査。パス違いの可能性があるため要確認。

## ギャップ精査結果

| ID | 内容 | UI/Sync 影響 | API 不足フィールド／コード体系 | 優先度 | 現状 |
| --- | --- | --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の WHERE 句に括弧が無く、`S%` セットで `hospnum` フィルタが効かず他施設セットが混入するリスク。 | スタンプ管理/選択 UI に他施設データが混ざる恐れ。施設切替やマルチテナント時のスタンプ同期が不正確になる。 | 施設コードの強制適用が不足（SQL 条件誤り）。 | High | `20251116T210500Z-B` で `hospnum=<n> AND (P% OR S%)` に修正済み。 |
| ORCA-02 | `/orca/stamp/{setCd,name}` が診療日を受け取らず、当日基準でのみ有効期間判定。過去/未来カルテで正しくセット展開できない。 | カルテ再編集や予約診療日のプレビューでスタンプが取得できず、UI で「無効」扱いになる可能性。 | `visitDate` パラメータ欠落。日付を有効期間チェックへ反映するコードパスが無い。 | High | `20251116T210500Z-B` で `setCd, stampName, visitDate` に拡張し、`tbl_inputset/tbl_tensu` の有効期間チェックへ反映済み。 |
| ORCA-03 | `/orca/tensu/shinku` が `taniname`（単位名）、`ykzkbn`（薬剤区分）、`yakkakjncd`（薬価コード）を返さないため、診療区分検索モードでは単位/区分が欠落。 | OrcaOrderPanel で `/shinku` 検索時に単位や薬剤区分が表示されず、オーダー作成時に誤選択・再検索が発生する。 | 上記 3 列が SELECT/DTO に欠落。コード体系は点数マスタと同一だが返却されない。 | High | `20251116T210500Z-B` で列を追加し `/tensu/name` と同水準に合わせ済み。 |
| ORCA-04 | `/orca/tensu/ten` は API ありだが Web クライアント UI で点数帯フィルタが未実装。 | 点数帯別の検索/フィルタを提供できず、オーダー候補の絞り込みに時間が掛かる。 | API 側の列は揃っているが UI 連携が未着手。 | Medium | Phase5 backlog（UI 実装 pending）。 |

## メモ / 次アクション
- 本タスク指示の元となるギャップ報告ファイルが見つからないため、所在確認またはパス修正を依頼したい。上記表は既存ログと関係ノートから再構成した暫定版。
- UI 影響が残る箇所（ORCA-04）は Web クライアント側の実装チケットを別途起票する必要あり。`process/API_UI_GAP_ANALYSIS.md` へ反映するか、`PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md` で扱いを確認する。
