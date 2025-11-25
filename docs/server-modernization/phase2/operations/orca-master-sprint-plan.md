# ORCA-05/06/08 最小スプリント計画（RUN_ID=20251124T213000Z, 親=20251124T000000Z）

- 期間: 2025-11-25 00:00 JST 〜 2025-12-06 23:59 JST（1.5 週間想定）
- 対象: ORCA マスタ補完ブリッジ（ORCA-05 薬剤/用法/特材/検査分類・ORCA-06 保険/住所・ORCA-08 電子点数表）
- 目的: 旧 API 依存を排し、モダナイズ版サーバーと Web クライアント間で P1 マスタを安定取得できる最小実装を完了させる。
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md → 本計画
- 依存資料: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`、`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` ORCA セクション、`docs/server-modernization/phase2/operations/assets/orca-db-schema/field-mapping/orca-master-field-matrix.md`

## スプリントゴール
1. P1 エンドポイントの OpenAPI → 実装 → クライアント接続を一本化し、schema diff 0（`orca-master-orca05-06-08.yaml` 準拠）を達成する。
2. 監査メタ（`runId,dataSource,snapshotVersion,cacheHit,missingMaster,fallbackUsed,dataSourceTransition,fetchedAt`）を全レスポンスと UI 監査イベントに透過し、E2E 主要 6 シナリオを PASS させる。
3. MSW / snapshot / server 切替で UI/監査が破綻しないことを MSW + E2E + contract test で証跡化する。

## スコープ（P1 範囲）
- エンドポイント（サーバー）
  - ORCA-05: `GET /orca/master/generic-class`, `GET /orca/master/generic-price`, `GET /orca/master/youhou`, `GET /orca/master/material`, `GET /orca/master/kensa-sort`
  - ORCA-06: `GET /orca/master/hokenja`, `GET /orca/master/address?zip|pref`
  - ORCA-08: `GET /orca/tensu/ten?min&max&date`, `GET /orca/master/etensu/{srycd}`（一覧/詳細のいずれかを P1 に含める）
- DTO 必須フィールド
  - 共通: `code/name` or `tensuCode/name`, `validFrom/validTo` or `startDate/endDate`, `version`, `dataSource`, `runId`, `snapshotVersion`, `cacheHit`, `missingMaster`, `fallbackUsed`, `fetchedAt`
  - ORCA-05 特有: `minPrice`, `youhouCode`, `materialCategory`, `kensaSort`
  - ORCA-06 特有: `payerCode/payerName/payerType/payerRatio`, `prefCode/cityCode/zip/addressLine`
  - ORCA-08 特有: `tensuVersion`, `kubun`, `tanka`, `category`, `unit`
- 監査メタ
  - API レスポンス: 上記共通フィールド + `dataSourceTransition?`（切替時のみ）
  - UI 監査: `apiRoute`, `dataSource`, `runId`, `snapshotVersion`, `cacheHit`, `missingMaster`, `fallbackUsed`, `dataSourceTransition`, `tensuVersion`(08)

## 完了条件（Definition of Done）
- API 疎通: 上記 P1 エンドポイントが dev 環境で 200/JSON を返し、OpenAPI に対する schema diff が 0。
- 監査: API/クライアント双方で監査メタが欠落なく送出され、`dataSourceTransition` が MSW↔snapshot↔server 切替で記録される。
- テスト: MSW 契約テスト（Zod/型整合）、サーバー向け contract test、E2E 主要 6 シナリオ（Charts オーダ検索、保険選択、住所補完、点数帯検索、MSW↔server 切替、再計算）が緑。
- シード/データ: ORCA seed plan (`seed-plan/orca-master-seed-plan.md`) の P1 行が適用済み or 代替データで PASS 実証。
- 監視: Grafana ダッシュボード draft `orca-master-dashboard.json` が API メトリクス（P99/エラー率/missingMaster率/cacheHit率）を可視化し、Alert しきい値が設定済み。
- CI: `openapi:orca-master` 生成＋typecheck＋MSW/contract/E2E を含む CI ワークフローが `main` への PR で実行される。

## 依存・前提
- データ: `artifacts/api-stability/20251124T130000Z/seed/templates/` の seed 適用、ORCA DB 定義書（2024-04-26 正式版）準拠。
- 環境: mac-dev ORCA（`mac-dev-login.local.md`）、MSW 有効がデフォルト。WebORCA Trial / 本番経路は禁止。
- 監視: `docs/server-modernization/phase2/operations/orca-master-dashboard.json` + Alert rules draft を CI/Stage に導入。
- CI: Node/Vitest のみ（Python 禁止）。contract test は Node 製。

## WBS（担当候補・ETA は JST）
| No | タスク | 担当候補 | ETA | 成果物/完了条件 |
| --- | --- | --- | --- | --- |
| S1 | OpenAPI & DTO 確定（P1フィールドと監査メタ固定） | Worker-B | 11/27 | OpenAPI 更新、型生成 `src/generated/orca-master.ts`、schema diff 0。 |
| S2 | サーバー実装: クエリ/DTO 変換/監査/テスト（Unit+IT） | Worker-B | 12/02 | P1 エンドポイント実装、IT で seed データを返却、監査メタ付与、性能計測ログ。 |
| S3 | クライアント配線: 型接続・fetch フック・UI ハンドラ | Worker-A | 12/03 | `resolveMasterSource` 経由で dataSource 透過、警告バナー/バリデーション実装、型エラー 0。 |
| S4 | クライアントテスト: MSW/contract/E2E | QA (Worker-Q) | 12/04 | MSW フィクスチャ更新、contract test 緑、E2E 主要 6 シナリオ PASS。 |
| S5 | DevOps/監視: CI ワークフロー、Grafana/Alert import | DevOps (Worker-D) | 12/05 | GitHub Actions で openapi/typecheck/MSW/E2E 実行、dashboard+alerts を Stage へ import。 |
| S6 | 性能計測: P99/エラー率 ベースライン | Worker-D + Worker-B | 12/05 | `artifacts/api-stability/20251124T111500Z/benchmarks/` 更新、P99 < 3s, error rate <1% を報告。 |
| S7 | スプリントクロージャ: リリースノート/ログ/DOC_STATUS 反映 | Worker-A | 12/06 | 本計画更新、`logs/20251123T135709Z-webclient-master-bridge.md` 追記、DOC_STATUS 備考更新、ワーカー報告提出。 |

## リスクと緩和
- seed 不備で 404/空レスとなる場合: seed-plan の最小データ（doctor/patient/insurer/address/tensu）を優先投入、未整備は MSW で代替し `missingMaster=true` を監査に必須化。
- スキーマドリフト: `orca-master-schema-drift-plan.md` のハッシュ比較を nightly に組込み、diff で CI FAIL。
- 監査欠落: fetch ミドルで強制付与し、契約テストで欠落検知。

## 成果物とリンク
- 本計画: `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`
- 参照元への追記: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` 参考資料節にリンク追加。
- ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` へ RUN セクション追加予定。
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID と備考を反映。
