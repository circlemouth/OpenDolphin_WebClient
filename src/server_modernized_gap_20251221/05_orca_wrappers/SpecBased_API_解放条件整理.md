# Spec-based API 解放条件整理（ORCA POST 未開放）

## 目的
- ORCA 側で POST が未開放の API について、**解放前提条件** と **切替条件**（Spec-based → 実 API）を明文化する。
- 解放後に必要な **検証フロー** と **証跡要件** を整理し、実測証跡は最終段階で一括取得する前提を揃える。

## 対象範囲
- ORCA POST が未開放のため **Spec-based stub** で応答している API。
- 本ドキュメントは **条件整理のみ**。実 API 呼び出しや環境変更は行わない。
- 実測証跡の取得は最終段階（品質/リリース）で実施する。

## 未開放 API（現状整理）
> 参照: `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` / `docs/server-modernization/phase2/operations/logs/*orca*` / `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`

| 区分 | API / 経路 | 現状 | 主な Blocker（要約） |
| --- | --- | --- | --- |
| 受付 | `/orca11/acceptmodv2` | HTTP 405（Allow: OPTIONS, GET） | Trial/ORMaster 側で POST 未開放。
| 予約 | `/orca14/appointmodv2` | HTTP 405（Allow: OPTIONS, GET） | Trial/ORMaster 側で POST 未開放。
| 患者メモ | `/orca06/patientmemomodv2` | HTTP 405（Allow: OPTIONS, GET） | Trial/ORMaster 側で POST 未開放。
| 帳票印刷 | `/orca42/receiptprintv3` | HTTP 405（Allow: OPTIONS, GET） | Trial 側で帳票/出力が禁止。ORCA 側の出力制限解除が必要。
| カルテ主訴 | `POST /orca/chart/subjectives`（`/orca25/subjectivesv2`） | Spec-based stub（`Api_Result=79`） | Trial で POST 未開放。ORMaster 実測が必要。
| 出産育児 | `POST /orca/birth-delivery`（`/orca31/birthdeliveryv2`） | Spec-based stub（`Api_Result=79`） | Trial で POST 未開放。ORMaster 実測が必要。
| 医療セット | `POST /orca/medical-sets` | Spec-based stub（`Api_Result=79`） | Trial で POST 未開放。ORMaster 実測が必要。
| 点数同期 | `POST /orca/tensu/sync` | Spec-based stub（`Api_Result=79`） | Trial で POST 未開放。ORMaster 実測が必要。

## 解放前提条件（ORCA 側）
1. **POST 受理の解禁**
   - 405（Allow: GET/OPTIONS）の状態が解消され、**POST が許可**されていること。
   - 405 以外の 200/201/403（仕様に依存）と **実 Api_Result** が確認できること。
2. **接続可能性**
   - DNS 解決が可能（`nslookup` が成功）。
   - TLS/Basic 認証が正常（`openssl s_client` と `curl -u` が成功）。
3. **データ出力/帳票制限の解除（該当 API のみ）**
   - 帳票/CSV/外部媒体の出力制限が解除され、**receipt print 系 API が利用可能**であること。
4. **実測環境の用意**
   - Trial/ORMaster のどちらかで **CRUD 可能なデータ**（患者・受付・予約等）が揃っていること。

## 切替条件（Spec-based → 実 API）
> 解除条件は **ORCA 側の開放確認** + **実測証跡（最終段階で取得）** + **サーバー切替準備完了** の 3 点で成立。

### 1) ORCA 側開放の確認
- 同一 API に対して **HTTP 200/201/403** を取得し、`Api_Result=79` 以外のレスポンスを確認する。
- 405（Allow: GET/OPTIONS）や 404 が続く場合は **解放未達**として扱い、切替しない。

### 2) 実測証跡の要件整理（取得は最終段階）
- `artifacts/orca-connectivity/<RUN_ID>/` に以下を保存する想定:
  - `httpdump/<api>/request.http` / `response.http`
  - `trace/<api>.log`（`curl --trace-ascii`）
  - `logs/http_extract_*.log`（HTTP/Allow/Api_Result 抜粋）
- **最低 1 つの成功応答**を証跡に含める。

### 3) サーバー切替準備
- Spec-based stub を外し、**実 ORCA 送信経路**（`OrcaTransport` 等）へ切り替える。
- 切替時に **監査 ID / traceId / runId** が必ず残ることを確認する。

## 解放後の検証フロー（標準）
1. **事前チェック**
   - `openssl s_client` と `curl -u` による TLS/Basic 認証の確認。
   - DNS 解決のログ保存。
2. **CRUD 実測（API ごと）**
   - `POST` → `GET`（必要なら `PUT/DELETE`）を実施し、**Api_Result/HTTP** を採取。
   - 予約/受付系は **UI で反映**を確認（可能な場合）。
3. **Web クライアント連携確認**
   - モダナイズ server から ORCA 経路へ到達し、**UI 上の状態更新**が行えることを確認。
   - エラー時は **HTTP/Api_Result/traceId** をセットで記録。
4. **切替完了の記録**
   - `Spec-based` 表記を解除し、**証跡パス**を残す（最終段階で実施）。

## 証跡の置き方（最低限セット）
- 実測証跡の取得は最終段階（品質/リリース）で実施する。
- ディレクトリ: `artifacts/orca-connectivity/<RUN_ID>/`
- 必須:
  - `httpdump/<api>/request.http`
  - `httpdump/<api>/response.http`
  - `logs/http_extract_<UTC>.log`
- 任意:
  - `trace/<api>.log`
  - `trial/<api>/README.md`（UI での確認ができた場合）

## 非スコープ
- ORCA 実環境への接続や設定変更。
- Phase2 ドキュメントの更新。

## 参照
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`
- `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/server-modernization/phase2/operations/logs/20251121T153200Z-api-contract.md`
- `docs/server-modernization/phase2/operations/logs/20251121T153100Z-orca-connectivity.md`
