# 2025-11-16 ORCA 点数マスタ／スタンプ展開調査ログ

- RUN_ID: `20251116T193200Z`
- 担当: Codex (Web クライアント × モダナイズ連携)
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md`
- 対象: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`, `server/src/main/java/open/orca/rest/OrcaResource.java`, `docs/web-client/features/ORDER_ENTRY_DATA_GUIDE.md`, `docs/web-client/features/PHASE3_STAMP_AND_ORCA.md`, `docs/web-client/guides/CLINICAL_MODULES.md`, `web-client/src/features/charts/api/orca-api.ts`, `web-client/src/features/charts/pages/ChartsPage.tsx`
- 成果物: 本ログ、`docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` 7章追記、`docs/web-client/planning/phase2/DOC_STATUS.md` 行45更新

## 1. 調査サマリ

1. Legacy `server/` と Modernized `server-modernized/` の `OrcaResource` を `diff -u` で比較し、Jakarta/Jackson への移行（`jakarta.*`, `com.fasterxml`）以外の実装差分が無いことを確認。`/tensu/*`, `/inputset`, `/stamp/{setCd,stampName}` は SQL・DTO ふくめ Legacy と同一実装で稼働している。
2. Web クライアント側では `web-client/src/features/charts/api/orca-api.ts` の `searchTensuByName`／`fetchOrcaOrderModules` を中心に `/orca/tensu/name` と `/orca/stamp/{code,name}` を利用し、`ChartsPage` (`handleCreateOrderFromOrca`) で `ModuleModel` をカルテドラフトへ挿入している。仕様面は `docs/web-client/features/ORDER_ENTRY_DATA_GUIDE.md` §4 および `PHASE3_STAMP_AND_ORCA.md` §2 と一致。
3. 既知制約の再確認:
   - `getOrcaInputSet` の WHERE 句は `hospnum=<n> and inputcd like 'P%' or inputcd like 'S%'` で括弧が無く、`S%` 系セットが施設番号フィルタを素通りする。（Legacy から継続する仕様）
   - `/stamp/{param}` は ORCA セットの有効期間を「サーバー当日 (`new Date()`)」のみで判定し、過去/未来日付でのプレビューや UI 側の診療日指定に対応していない。
   - `/tensu/shinku` 応答は `taniname` や `ykzkbn` を返しておらず、UI では `/tensu/name` の結果だけで単位や薬剤区分を解決している。

## 2. Legacy 差分確認メモ

- `diff -u server/src/main/java/open/orca/rest/OrcaResource.java server-modernized/src/main/java/open/orca/rest/OrcaResource.java`（手元実行）で import と `ObjectMapper` のみが差分。`@GET /tensu/*` 系、`@GET /inputset`, `@GET /stamp/{param}` の実体は完全一致した。
- JMS や REST ラッパー (`open.dolphin.rest.orca.*`) とは独立したモジュールであり、Modernized 側でも ORCA DB 直読みロジックを維持する判断になっていることを `ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` に追記した。

## 3. セット展開／点数マスタ現状

| 観点 | Modernized 実装確認 | Web クライアント依存 |
| --- | --- | --- |
| `/orca/tensu/name` | `OrcaResource#getTensuMasterByName` (`server-modernized/.../OrcaResource.java:338-414`) で `tbl_tensu` を正規表現検索し、`TensuMaster` 全列を返却。 | `searchTensuByName` (`web-client/.../orca-api.ts:134-159`) が endpoint を生成し、`OrcaOrderPanel` (`.../OrcaOrderPanel.tsx:94-208`) で検索・選択 UI を提供。 |
| `/orca/stamp/{code,name}` | `getStamp` (`server-modernized/.../OrcaResource.java:948-1306`) が `tbl_inputset` と `tbl_tensu` から `ModuleModel` を構築。手技・薬剤・材料の区分ロジックは Legacy と同一。 | `fetchOrcaOrderModules` (`orca-api.ts:251-264`) で JSON を取得し、`ChartsPage` の `handleCreateOrderFromOrca` (`ChartsPage.tsx:3769-3794`) が `OrderModuleDraft` へ変換。 |
| `/orca/inputset` | `getOrcaInputSet` (`server-modernized/.../OrcaResource.java:820-910`) が `P%/S%` の入力セットを返却。ただし WHERE 句の OR 優先で `S%` 系は `hospnum` を無視。 | `docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md` §13.6 に従って `StampManagementPage` で一覧表示予定だが、現状は管理 UI での参照に留まる。 |

## 4. 気付き・改善アイデア

1. **入力セット WHERE 句の括弧不足**: `hospnum=<n> and inputcd like 'P%' or inputcd like 'S%'`（`server-modernized/.../OrcaResource.java:832-839`）は `S%` について facility フィルタが効かない。Legacy と同症状のため緊急度は低いが、モダナイズ版でマルチ施設展開する際は `AND (inputcd like 'P%' OR inputcd like 'S%')` へ修正しても互換性影響はない見込み。
2. **セット有効日付指定**: `/stamp/{param}` は `new Date()` でのみ有効期限を判定し、診療日を指定できない。`OrcaOrderPanel` から診療日（カルテの `DocInfoModel.started`）を渡せるよう API パラメータ拡張を検討する。
3. **`/tensu/shinku` の列不足**: `taniname` や `ykzkbn` がレスポンスに含まれず、UI が `/tensu/name` へフォールバックしている。`QUERY_TENSU_BY_SHINKU` の SELECT 列に単位/薬剤区分を追加すると診療区分検索モードでも同じ情報を表示できる。

## 5. 次アクション

- [ ] 上記 3 点を `ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7 に記録済み。次回サーバーリファクタリングで SQL 改修するか判断。
- [ ] `PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md` タスクに「Legacy パリティ維持 / 改修候補 3 件」をメモ追加要否をマネージャーへ確認。
- [ ] `/orca/tensu/ten` と `/orca/tensu/shinku` を Web クライアントの詳細フィルタへ露出させる場合は UI/UX チーム（`docs/web-client/features/PHASE3_STAMP_AND_ORCA.md` §2）と調整し、追加項目（単位・薬剤区分）を返せるようサーバーを補強する。

## 6. RUN_ID=`20251116T210500Z-B` 改修・検証（Worker-B）
- 参照チェーンは初回調査と同一（`AGENTS` → `docs/web-client/README` → `docs/server-modernization/phase2/INDEX` → `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW` → `PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST`）。親 RUN_ID=`20251116T193200Z` のフォローアップとして、指示に従いサーバー実装と Web クライアント両方を更新。
- **`/orca/inputset` の facility フィルタ修正**: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java:832-839` の SQL を `hospnum=<n> AND (inputcd like 'P%' OR inputcd like 'S%')` へ変更し、`S%` 系でも `hospnum` を必須にした。Legacy 実装と互換性を保ちながら Multi-Hosp 想定の WHERE 句を明示。
- **`/orca/stamp/{param}` の診療日指定**: 同ファイル 950 行付近で `param` に第3要素（診療日、例: `20251116`）を追加。`resolveEffectiveDate()` で `YYYYMMDD` 以外の入力も数字抽出し、未指定時は当日。`tbl_inputset` の有効期間判定は `today` → `effectiveDate` へ置換し、`tbl_tensu` 側クエリにも `yukostymd<=? AND yukoedymd>=?` を追加。Web クライアント `/orca/stamp` 呼び出しは `web-client/src/features/charts/api/orca-api.ts` の `fetchOrcaOrderModules` へ `visitDate` オプションを増設し、`ChartsPage.handleCreateOrderFromOrca` から `selectedVisit?.visitDate` を引き渡すよう更新。
- **`/orca/tensu/shinku` の列拡張**: `QUERY_TENSU_BY_SHINKU` に `taniname`, `ykzkbn`, `yakkakjncd` を追加し、`TensuMasterConverter` 経由で UI へ単位・薬剤区分・薬価コードを返せるようにした（`OrcaResource.java:261-310`）。`searchTensuByName` 側との列差異がなくなったため UI は `/shinku` モードでも単位表示が可能。
- **検証**: `mvn -pl server-modernized -am -DskipTests compile` を実行し、共通モジュール→モダナイズ版 WAR までビルド成功を確認（DB 接続が不要な範囲）。Docker / WebORCA 実機操作は禁止のため未実施。
- **その他**: Python スクリプトや Docker 操作は実行せず、既存ユニットテスト／ビルドのみで確認。`docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md` §7 のギャップ表と `docs/web-client/planning/phase2/DOC_STATUS.md` 行48に本 RUN_ID / 証跡パスを追記済み。
