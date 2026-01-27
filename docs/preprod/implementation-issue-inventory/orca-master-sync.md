# ORCA マスタ同期/キャッシュ戦略 棚卸し

- RUN_ID: 20260122T200942Z
- 実施日: 2026-01-22
- 対象: ORCA Master 同期・キャッシュ・フォールバック（Web クライアント + server-modernized）
- 目的: マスタ同期/キャッシュ更新/フォールバックの問題点を整理し、UI 影響と未整備事項を明文化する。
- 参照: `docs/DEVELOPMENT_STATUS.md`, `docs/web-client/architecture/web-client-api-mapping.md`, `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照ドキュメント
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`
- `src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md`
- `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（Legacy/参照）
- `src/validation/readOnly_状態遷移確認.md`

## 1. 現状の対応範囲（確認済み）

### 1-1. Web クライアント側の同期/フォールバック設計
- `resolveMasterSource` により `mock → snapshot → server → fallback` の遷移を設計し、`runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を監査メタへ透過する方針が整理済み。(`docs/web-client/architecture/web-client-api-mapping.md`)
- Patients/Charts では `missingMaster`/`fallbackUsed`/`dataSourceTransition` に応じて readOnly と反映停止を行う UX が定義済み。(`src/validation/readOnly_状態遷移確認.md`)

### 1-2. server-modernized 側の ORCA-08 キャッシュ実装
- `OrcaMasterResource` で ETag + Cache-Control + stale-while-revalidate を実装し、`cacheHit` と監査メタを返却する。TTL は `address/hokenja=7日`、その他 `5分` として実装済み。(`src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`)
- `/orca/tensu/etensu` は Modernized REST 正規経路として維持し、`/api/orca/master/etensu` は 404 を許容する方針が確定。(`src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`)

### 1-3. 監査メタの標準化
- ORCA Master の監査メタには `runId/dataSource/cacheHit/missingMaster/fallbackUsed` を必須キーとして保持する方針が定義済み。(`src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md`)

## 2. マスタ同期/キャッシュの問題点一覧

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 区分 | 現状 | 差分/課題 | UI 影響 | 根拠 | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| MS-01 | マスタ提供範囲 | 点数/病名/一般名/相互作用/入力セット等は提供済みだが、薬剤分類/最低薬価/用法/特定器材/保険者/住所など多くのマスタが未提供。 | マスタ同期の範囲が不足し、薬剤・材料・保険系の入力/検索に必要なマスタが欠落。 | missingMaster/fallbackUsed が発火し編集ブロックに直結する可能性。 | `docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md` | P1 |
| MS-02 | キャッシュ検証 | ORCA Master E2E は ORCA DB 未接続で 503 応答により cacheHit/ETag 検証が未達。 | キャッシュ有効性（ETag/304、cacheHit_ratio 監視）を実データで確認できていない。 | cacheHit 未検証のため UI トーン/再取得ボタンの挙動が本番で不一致の可能性。 | `src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md` | P1 |
| MS-03 | キャッシュ更新遅延 | TTL は `address/hokenja=7日` / その他 `5分` のみで更新トリガー（更新通知・強制リフレッシュ）の設計が未記載。 | マスタ更新の即時反映が保証されず、更新遅延の影響範囲が不明。 | 受付/診療のマスタ参照が旧データで継続し、誤入力や警告表示が遅延する可能性。 | `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md` | P2 |
| MS-04 | 空結果/404 の扱い | `items` 空時の 404 と `missingMaster=true` の扱いは検証観点として残っているが、実データで未確認。 | 空結果が「マスタ欠落」扱いになるか未確定で、`missingMaster` と UI ブロック条件が不整合になる恐れ。 | Patients/Charts の readOnly 判定が誤って発火し、操作停止が起きる可能性。 | `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`, `src/validation/readOnly_状態遷移確認.md` | P2 |
| MS-05 | ルーティング不一致 | `/api/orca/master/etensu` は 404 許容だが、クライアント/テストが誤経路を参照する余地がある。 | `/orca/tensu/etensu` への統一が担保されないと、同期漏れ・キャッシュ検証不能に陥る。 | 404 により missingMaster/ fallback 扱いになると UI が警告/ブロック状態になる。 | `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md` | P2 |
| MS-06 | フォールバック表示の実環境検証不足 | missingMaster/fallbackUsed の UI 反映は MSW 前提で確認済みだが、実 ORCA 接続での再現が未実施。 | 本番データでのフォールバック表示（tone/バナー/反映停止）を検証できていない。 | UI の安全ガードが実環境で誤作動/不足する可能性。 | `src/validation/readOnly_状態遷移確認.md`, `src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md` | P2 |

## 3. 同期漏れ・更新遅延・UI 影響の整理
- **同期漏れ**: ORCA マスタの提供範囲不足（薬剤分類/用法/保険者/住所等）により、必要マスタの同期が欠落する可能性が高い（MS-01）。
- **更新遅延**: TTL ベースのみで更新トリガー未整備のため、改定直後のマスタ反映が遅延する懸念（MS-03）。
- **UI 影響**: missingMaster/fallbackUsed は Patients/Charts で編集ブロックに直結するため、空結果や 404 が誤判定になると業務停止リスクがある（MS-04/05/06）。

## 4. 責任分界（Web クライアント / server-modernized / ORCA）
| レイヤ | 役割 | 検知ポイント | 対処/フォールバック | 影響する課題 |
| --- | --- | --- | --- | --- |
| Web クライアント | UI ガード・操作ブロック・バナー表示。`missingMaster/fallbackUsed/dataSourceTransition` を UX に反映。 | 監査/telemetry メタ、レスポンス header（`X-Fallback-Used` 等）と body の flags。 | 編集ブロック、警告バナー、再取得導線（retry）。`dataSourceTransition` でバナーの tone を決定。 | MS-04/05/06 |
| server-modernized | ORCA マスタ取得・ETag/TTL 付与・監査メタ記録。 | 監査ログ（`runId/cacheHit/missingMaster/fallbackUsed/httpStatus/apiRoute`）、ETag/304、`X-Orca-Cache-Hit`。 | `missingMaster` の正規化、404/空結果の扱い、キャッシュ TTL/ETag の運用。 | MS-02/03/04/05 |
| ORCA 実環境 | マスタの実データ提供・改定反映・DB/公式 API 可用性。 | 公式 API 応答、DB 接続可用性、改定日時の反映。 | 直接対処不可。可用性低下時は server-modernized 側で 503 を記録し、Web 側は fallback/ブロックで安全側に倒す。 | MS-01/02/03 |

## 5. 実環境検証手順（最低限）
> ORCA 実環境接続は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` を厳守する（Phase2 版は Legacy）。

1. `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、ORCA Master Basic 認証が有効な状態を作る。  
2. `/api/orca/master/*`（ORCA-05/06）と `/orca/tensu/etensu`（ORCA-08）を 200 応答で取得し、`ETag/Cache-Control` と `X-Orca-Cache-Hit` を採取する。  
3. 304 応答（If-None-Match）を確認し、`cacheHit` が UI と監査ログで一致するかを確認する。  
4. 空結果/404 条件を再現し、`missingMaster/fallbackUsed` の値と UI ブロックの発火条件を突合する。  
5. 監査ログ（DB/JMS）から `runId/dataSource/cacheHit/missingMaster/fallbackUsed/httpStatus/apiRoute` を抽出し、UI の runId と一致するかを確認する。  

**最低限の観測ログ項目**  
- HTTP: `status`, `ETag`, `Cache-Control`, `X-Orca-Cache-Hit`, `X-Orca-Db-Time`, `X-Orca-Row-Count`  
- 監査: `runId`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `httpStatus`, `apiRoute`, `traceId`  
- UI: `runId`, `missingMaster`, `fallbackUsed`, `dataSourceTransition`（バナー/ガード表示）  

## 6. 追加で必要な確認・証跡
- ORCA 実環境（Certification）で `200` 応答時の ETag/304 と cacheHit 判定を再測定し、`cacheHit_ratio` の運用基準を満たすか記録する。
- ORCA-05/06/08 の空結果・404 時に `missingMaster`/`fallbackUsed` がどの値で返るかを実環境で確認する。
- `/orca/tensu/etensu` 経路の統一確認（クライアント/テスト/監査ログがすべて同経路に寄っているか）を実測ログで証跡化する。

## 7. 更新が必要なドキュメント（候補）
- `docs/preprod/implementation-issue-inventory/orca-master-sync.md`（本ドキュメント）
- `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_API_STATUS_更新.md`（再測定結果の反映先）
