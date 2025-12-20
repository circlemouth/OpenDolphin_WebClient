# 監査・ログAPI要件（predeploy readiness）

- RUN_ID: `20251220T143111Z`
- 期間: 2025-12-23 09:00 - 2025-12-24 09:00 (JST)
- 優先度: high / 緊急度: high
- YAML ID: `src/predeploy_readiness/01_api_implementation/監査・ログAPI要件ドキュメント整備.md`

## 目的
- 監査・ログAPI補完の前提となる「必須監査イベント」「必須フィールド」「errorMessage 方針」「traceId/requestId 運用」を単一ドキュメントで固定し、後続実装タスクの共通要件とする。
- 監査（audit）と運用ログ（log）の責務分離・共通化ポイントを明確化し、API 契約と実装順のブレを防止する。

## 参照ソース（現行タスクの根拠）
- `docs/DEVELOPMENT_STATUS.md`

## 適用範囲
- 対象: server-modernized の監査・ログ API、および監査イベントの生成・伝播・保存。
- 対象外: Legacy server/client の運用・保守・改修。

## 用語
- **監査イベント (auditEvent)**: 誰が・何を・いつ・どの対象に・どの結果を発生させたかを残す記録。
- **運用ログ (log)**: 障害解析/運用監視を目的とする技術ログ。監査イベントとは用途が異なる。
- **traceId/requestId**: リクエスト/処理の相関 ID。監査とログの両方で共通の軸。

---

## 1. 必須監査イベント

### 1-1. 監査イベント種別（必須）
| 区分 | 監査イベント | 説明 | 代表アクション | 監査対象キー |
| --- | --- | --- | --- | --- |
| 認証 | AUTH_LOGIN / AUTH_LOGOUT | ログイン/ログアウト | `login`, `logout` | actorId, facilityId |
| 認可 | AUTHZ_DENY | 権限不足による拒否 | `access_denied` | actorId, facilityId, resource |
| 参照 | READ_* | 患者/カルテ/請求等の参照 | `read` | patientId, documentId, claimId |
| 更新 | CREATE_* / UPDATE_* / DELETE_* | 重要データの変更 | `create`, `update`, `delete` | patientId, documentId, claimId |
| 外部連携 | ORCA_PROXY_* | ORCA 連携の送受信 | `fetch`, `send`, `update` | facilityId, patientId, orcaRequestId |
| 監査自身 | AUDIT_EXPORT / AUDIT_QUERY | 監査ログ参照/出力 | `read`, `export` | actorId, timeRange |
| 設定変更 | CONFIG_UPDATE | 管理設定の変更 | `update` | actorId, configKey |
| 失敗/例外 | ERROR_* | 4xx/5xx を伴う失敗 | `error` | resource, errorCode |

### 1-2. 必須イベント条件
- 4xx/5xx を返すリクエストは **必ず** `ERROR_*` の監査イベントを送出する。
- 変更系（create/update/delete/送信）は **必ず** 成功/失敗の outcome を明示する。
- 外部連携（ORCA/外部 API）での失敗は、上位エンドポイントの `ERROR_*` に加え、**連携種別別の監査イベント**を送出する。
- 監査ログの参照/出力そのものも監査対象とする（監査の自己監査）。

---

## 2. 必須フィールド（監査イベント）

### 2-1. 監査イベント共通（全イベントで必須）
| フィールド | 目的 | ルール |
| --- | --- | --- |
| `eventId` | 一意識別 | UUID で生成する |
| `occurredAt` | 発生時刻 | ISO-8601（UTC） |
| `action` | 実行アクション | 例: `read`, `create`, `update`, `delete`, `send`, `export`, `error` |
| `outcome` | 結果 | `SUCCESS` / `FAILURE` / `PARTIAL` |
| `actorId` | 実行者 ID | 認証主体（ユーザ/システム） |
| `actorType` | 実行者種別 | `USER` / `SYSTEM` |
| `facilityId` | 施設識別 | 施設コンテキスト必須 |
| `traceId` | 相関 ID | 生成/伝播ルールは 4 章 |
| `requestId` | 相関 ID | 生成/伝播ルールは 4 章 |
| `sourceSystem` | 発生元 | `server-modernized` を固定 |
| `requestPath` | API パス | 監査対象 API のパス |
| `httpMethod` | HTTP メソッド | `GET/POST/...` |
| `httpStatus` | HTTP ステータス | 監査・運用ログ整合 |

### 2-2. 監査イベント拡張（条件付き必須）
| フィールド | 適用条件 | 目的 | ルール |
| --- | --- | --- | --- |
| `patientId` | 患者コンテキスト | 患者対象の行為 | 患者識別が可能な場合は必須 |
| `appointmentId` | 受付/予約 | 予約・受付対象 | 取得できる場合は必須 |
| `claimId` | 請求 | 請求・会計対象 | 取得できる場合は必須 |
| `documentId` | カルテ/文書 | カルテ文書操作 | 取得できる場合は必須 |
| `operation` | 変更系 | `create/update/delete` | 変更種別を明示 |
| `dataSource` | ORCA/DB | 実データ取得 | `orca|db|cache` 等 |
| `dataSourceTransition` | データ切替 | master source 切替 | `server|fallback|legacy` 等 |
| `cacheHit` | キャッシュ | 参照系 | `true/false` |
| `missingMaster` | マスタ欠落 | ORCA Master | `true/false` |
| `fallbackUsed` | フォールバック | 代替経路 | `true/false` |
| `recordsReturned` | 参照件数 | 参照系 | 整数 |
| `runId` | 実行単位 | UI/テレメトリ連携 | クライアントから受け取る場合は必須 |

---

## 3. errorMessage 方針（失敗時の扱い）

### 3-1. 基本方針
- `errorMessage` は **ユーザ/運用向けに短く明確**にする（機微情報を含めない）。
- 技術詳細は `errorCode` / `errorDetails` / `exceptionClass` に分離し、`errorMessage` へは含めない。
- 4xx/5xx いずれも `errorMessage` を監査イベントへ格納する。

### 3-2. エラーフィールド構成（必須）
| フィールド | 目的 | ルール |
| --- | --- | --- |
| `errorMessage` | 利用者向け | 1 行で要約。個人情報・資格情報は含めない |
| `errorCode` | 機械判定 | 事前定義のコード体系（例: `AUTH-401`, `ORCA-502`） |
| `errorDetails` | 運用分析 | 例外種別/原因を短文で記録（PII 含めない） |
| `exceptionClass` | 技術診断 | 例外クラス名 |
| `cause` | 原因 | 内部/外部/ネットワーク等の分類 |

### 3-3. ORCA 連携失敗時の追加ルール
- ORCA 由来のエラーは `errorCode` に ORCA コード/HTTP ステータスを含める。
- ORCA 応答をそのまま `errorMessage` に載せない（個人情報・診療情報の露出を防ぐ）。
- ORCA 失敗は、上位 API の `ERROR_*` と **ORCA 連携イベントの両方**に反映する。

---

## 4. traceId / requestId 運用

### 4-1. 生成・受け取り
- 入口（API 受信時）で `traceId` / `requestId` を必ず確定する。
- 受信ヘッダに `traceparent` / `x-request-id` が存在する場合は **優先採用**する。
- 受信ヘッダがない場合は **サーバ側で生成**し、以降の監査・ログ・外部連携へ伝播する。

### 4-2. 伝播ルール
- 監査イベントと運用ログの双方に同じ `traceId` / `requestId` を記録する。
- ORCA/外部 API へのリクエストに `traceId` / `requestId` を引き継ぐ。
- 非同期（JMS/キュー）では、**元リクエストの相関 ID**をメタデータとして残す。

### 4-3. 出力フォーマット
- 監査イベント: `traceId` / `requestId` を **トップレベルフィールド**として保持。
- 運用ログ: JSON 形式を前提とし、`traceId` / `requestId` を必須キーとする。

---

## 5. 実装前提（後続タスクのチェックポイント）
- 監査イベントの送出は API ごとにユースケース単位で実装する。
- 監査 API 実装前に、**イベント種別・必須フィールド・errorMessage 方針が一致していること**をレビューで確認する。
- 監査/ログ API の差分は Phase2 ドキュメントを参照専用で照合する（更新は禁止）。

## 6. 参考（Legacy/Archive の差分確認）
- Phase2 文書は Legacy/Archive として参照専用。差分確認のみで更新しない。
