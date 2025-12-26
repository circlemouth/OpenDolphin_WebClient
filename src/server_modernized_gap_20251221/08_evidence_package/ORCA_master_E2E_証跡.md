# ORCA Master E2E 証跡パッケージ
- 期間: 2026-01-10 09:00 - 2026-01-12 09:00 / 優先度: medium / 緊急度: low
- RUN_ID: 20251226T061010Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md`

## 目的
- ORCA-05/06/08 の実測レスポンスと監査ログを証跡化し、Web クライアント接続基準（P99/キャッシュ）を満たすことを確認する。
- 実環境依存のため、最終段階の実測時に証跡を一括収集できるテンプレートを用意する。

## 対象 API（ORCA Master）
- ORCA-05:
  - `/api/orca/master/generic-class`
  - `/api/orca/master/generic-price`
  - `/api/orca/master/youhou`
  - `/api/orca/master/material`
  - `/api/orca/master/kensa-sort`
- ORCA-06:
  - `/api/orca/master/hokenja`
  - `/api/orca/master/address`
- ORCA-08:
  - `/orca/tensu/etensu`

## 実測ステータス
- **実測完了（ただし ORCA DB 未接続のため 503 応答）**
  - ORCA-05/06/08 は ORCA DB 接続不備により `503` を返却。
  - ORCA-08 は `tensuVersion=202404` で再試行し、`503`（DB 不達）に収束。

## 接続基準（P99/キャッシュ）
- 監視しきい値は運用基準に合わせる（Legacy 参照だが現行運用の根拠）。
  - P99 レイテンシ: 3s 超が 10 分継続で要注意（ロールバック検討）。
  - cacheHit_ratio: 80% 未満が 15 分継続でキャッシュ異常扱い。
- **今回の実測は ORCA DB 未接続のため 503 応答**となり、キャッシュ/ETag の判定は未達。

## 必須証跡（取得済み）
- DNS/TLS 証跡:
  - `artifacts/orca-connectivity/20251226T061010Z/dns_weborca_cloud_orcamo_jp.txt`
  - `artifacts/orca-connectivity/20251226T061010Z/tls_weborca_cloud_orcamo_jp.txt`
- ORCA Master 実測レスポンス:
  - `artifacts/orca-connectivity/20251226T061010Z/master/*.json`
  - `artifacts/orca-connectivity/20251226T061010Z/master/*.status`
- 監査ログ（DB 抽出）:
  - `/orca/master/*`: `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db_master_only.txt`
  - `/orca/tensu/etensu`: `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db.txt`
- P99 計測:
  - `artifacts/orca-connectivity/20251226T061010Z/master/p99_orca05_generic_class.times.p99`
  - `artifacts/orca-connectivity/20251226T061010Z/master/p99_orca06_hokenja.times.p99`
  - `artifacts/orca-connectivity/20251226T061010Z/master/p99_orca08_etensu.times.p99`

## 実施手順（E2E 実測）
1. ORCA Master Basic 認証用のユーザー（`1.3.6.1.4.1.9414.70.1:admin`）を DB に追加。
2. `/api/orca/master/*` および `/orca/tensu/etensu` を実測。
3. 監査ログ（`opendolphin.d_audit_event`）を抽出。
4. P99 を 30 回の `curl` 実測で計測。

## Evidence 記録（実測結果）
- 実施日時: 2025-12-26 15:25–15:29 JST
- 実施者: worker-orca-master
- RUN_ID: 20251226T061010Z
- 接続先: `<MASKED_ORCA_CERT_URL>`
- 認証: `<MASKED_BASIC>`
- Feature Flag / Env:
  - ORCA Master Basic 認証は DB 追加で整備（`ORCA_MASTER_BASIC_*` は未変更）

### Request/Response（HTTP ステータス）
- ORCA-05 `/api/orca/master/generic-class`: 503
- ORCA-05 `/api/orca/master/generic-price`: 503
- ORCA-05 `/api/orca/master/youhou`: 503
- ORCA-05 `/api/orca/master/material`: 503
- ORCA-05 `/api/orca/master/kensa-sort`: 503
- ORCA-06 `/api/orca/master/hokenja`: 503
- ORCA-06 `/api/orca/master/address`: 503
- ORCA-08 `/orca/tensu/etensu` (tensuVersion=202404): 503

### 監査ログ（マスク済み）
- 抽出先:
  - `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db_master_only.txt`
  - `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db.txt`
- 必須キー: `runId`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `httpStatus`, `apiRoute`

### P99/キャッシュ判定
- P99（503 応答ベースの計測）:
  - generic-class: 22.960 ms
  - hokenja: 21.333 ms
  - etensu: 162.513 ms
- cacheHit 判定: **未達**（503 応答で ETag/304 が発生せず）

## 次アクション
1. ORCA DB 接続（ORCA certification 環境）確定後、`200` 応答で再計測する。
2. ETag/304 を伴うキャッシュ判定を再実施し、P99/キャッシュ基準の合否を記録する。
3. 実測結果を `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_API_STATUS_更新.md` に反映する。
