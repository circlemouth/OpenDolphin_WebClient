# ORCA API STATUS 更新
- 期間: 2026-01-15 09:00 - 2026-01-16 09:00 / 優先度: medium / 緊急度: low
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_API_STATUS_更新.md`

## 目的
- 最終段階で取得した実測証跡を反映し、ORCA API の公開状況を最新化する。
- 監査/証跡リンクを整理する。

## スコープ
- ORCA-05/06/08 および Wrapper API の実測状況・公開状況の更新（最終段階の実測結果を反映）。
- 証跡リンク（ログ/検証結果）の付与。

## 実装状況
- 更新済み（RUN_ID=20251226T061010Z / 20251226T062842Z）。
- 実測結果に基づき ORCA-05/06/08 と Wrapper API の公開状況/ブロッカーを反映。

## 最新実測サマリ（2025-12-26 JST）
### ORCA Master API（ORCA-05/06/08）
- RUN_ID: 20251226T061010Z
- 実測結果: **ORCA DB 未接続のため全て 503**
  - ORCA-05:
    - `/api/orca/master/generic-class`: 503
    - `/api/orca/master/generic-price`: 503
    - `/api/orca/master/youhou`: 503
    - `/api/orca/master/material`: 503
    - `/api/orca/master/kensa-sort`: 503
  - ORCA-06:
    - `/api/orca/master/hokenja`: 503
    - `/api/orca/master/address`: 503
  - ORCA-08:
    - `/orca/tensu/etensu` (tensuVersion=202404): 503
- 公開状況: **server-modernized 経由は ORCA DB 不達により利用不可（503）**
- 監査ログ: `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db_master_only.txt` / `artifacts/orca-connectivity/20251226T061010Z/audit_orca_master_db.txt`
- 証跡: `artifacts/orca-connectivity/20251226T061010Z/master/*.json` / `*.status` / `p99_*.times.p99`

### ORCA-08 certification 直叩き
- RUN_ID: 20251226T062842Z
- 実測結果: **HTTP 404（Not Found）**
  - `GET /orca/tensu/etensu?keyword=110000001&category=11&asOf=20240401&tensuVersion=202404&page=1&pageSize=20`
- 公開状況: **certification 環境でエンドポイントが未公開の可能性あり（要確認）**
- 証跡:
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/headers.txt`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/body.json`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/httpcode.txt`

### ORCA Wrapper API（POST）
- RUN_ID: 20251226T061010Z
- 実測結果: **Stub/Local 混在**
  - Stub 応答 (`Api_Result=79`): `/orca/chart/subjectives` / `/orca/medical-sets` / `/orca/tensu/sync` / `/orca/birth-delivery`
  - Local DB 応答 (`Api_Result=00`): `/orca/medical/records` / `/orca/disease` / `/orca/patient/mutation`
- 公開状況: **Trial 未開放 API は stub、local 実装は 200 を確認**
- 監査ログ: `artifacts/orca-connectivity/20251226T061010Z/audit_orca_wrapper_db.txt`
- 証跡: `artifacts/orca-connectivity/20251226T061010Z/wrapper/*.request.json` / `*.json` / `*.status`

## 監査/証跡リンク（一次情報）
- ORCA Master E2E 証跡: `src/server_modernized_gap_20251221/08_evidence_package/ORCA_master_E2E_証跡.md`
- ORCA Wrapper E2E 証跡: `src/server_modernized_gap_20251221/08_evidence_package/ORCA_wrapper_E2E.md`
- ORCA-08 E2E 実測ログ: `docs/server-modernization/phase2/operations/logs/20251226T062842Z-orca08-e2e.md`

## ブロッカー/警告
- ORCA DB（ORCADS）不達のため ORCA Master API が 503（ETENSU_UNAVAILABLE を含む）。
- ORCA certification 環境の `/orca/tensu/etensu` が 404（公開状況要確認）。
- Wrapper API の Trial 未開放系は `Api_Result=79`（stub 応答）。

## 次アクション
1. ORCA DB（ORCADS）接続復旧後に HTTP 200 の実測を再実施。
2. ORCA certification の `/orca/tensu/etensu` 公開状況を確認し、公開後に再計測。
3. ETag/304 を伴うキャッシュ判定を再実施し、P99/キャッシュ基準の合否を追記。

## 参照
- `docs/DEVELOPMENT_STATUS.md`
