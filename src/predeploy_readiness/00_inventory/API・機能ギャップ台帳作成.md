# API・機能ギャップ台帳（predeploy readiness）

- RUN_ID: `20251220T105123Z`
- 期間: 2025-12-21 09:00 - 2025-12-22 09:00 (JST)
- 優先度: high / 緊急度: high
- YAML ID: `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`

## 目的
- API/機能の未実装・部分実装・証跡未取得を台帳化し、実装順と優先度を確定する。
- 依存する周辺機能（認証・監査・マスター）を同時に棚卸しする。
- 台帳を実装フェーズの進捗管理単一ソースとして運用する。

## 参照ソース（現行タスクの根拠）
- `docs/DEVELOPMENT_STATUS.md`
- `src/server_modernized_full_completion_phase2/01_gap_inventory/実装状況ドキュメント棚卸し.md`
- `src/server_modernized_full_completion_phase2/01_gap_inventory/優先度と実装順確定.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
- `src/outpatient_ux_modernization/04C4_outpatient_api_gap_implementation.md`

## 優先度/実装順（適用ルール）
- 実装順は **ORCA Master → 監査・JMS → 外部 API → Jakarta 設定** を最優先とする。
- カルテ/添付と Ops/Security は Jakarta 設定完了後に着手する。
- Web クライアント側の UI/監査連携は、対象 API のサーバ実装完了 + 200 証跡取得後に着手する。

---

## 1. 未実装（実装着手が必要）

| ID | 領域 | API/機能 | 現状 | 依存（認証/監査/マスター） | 優先度/実装順 | 次アクション | 根拠 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ORCA-05 | ORCA Master | 薬剤/特材/検査分類など大型マスタ REST | 未実装 | Master | P0 / ORCA Master | REST + DTO + 監査 + 契約テスト | 実装状況棚卸し |
| ORCA-06 | ORCA Master | 保険者/住所マスタ REST | 未実装 | Master | P0 / ORCA Master | REST + DTO + 監査 + 契約テスト | 実装状況棚卸し |
| ORCA-08 | ORCA Master | 電子点数表 REST | 未実装 | Master | P0 / ORCA Master | REST + DTO + 監査 + 契約テスト | 実装状況棚卸し |
| ORCA-07 | ORCA Master | ORCA DB 接続の DataSource 化 | 未実装 | Master/認証 | P0 / ORCA Master | JNDI DataSource + Secrets 注入 | 実装状況棚卸し |
| AUD-02 | 監査 | 4xx/5xx で Trace-ID を AuditTrail へ伝播 | 未実装 | 監査 | P0 / 監査・JMS | LogFilter 改修 + 証跡取得 | 実装状況棚卸し |
| JKT-03 | 監査/JMS | JMS キュー/接続ファクトリの WildFly 33 CLI 定義 | 未実装 | 監査 | P0 / 監査・JMS | `messaging-activemq` へ定義追加 | 実装状況棚卸し |
| KRT-01 | カルテ | PUT `/karte/document` | 未実装 | 監査 | P1 / カルテ | `KarteResource/Service` へ更新 API | 実装状況棚卸し |
| KRT-02 | カルテ | `SafetySummary` 系 API | 未実装 | 監査 | P1 / カルテ | Legacy 実装の Jakarta 化 | 実装状況棚卸し |
| KRT-03 | カルテ | `GET /karte/image/{id}` の `@PathParam` 修正 | 未実装 | 監査 | P1 / カルテ | `@PathParam("id")` へ修正 | 実装状況棚卸し |
| KRT-04 | 添付 | 添付ストレージ二重アップロード解消 | 未実装 | 監査 | P1 / カルテ | `AttachmentStorageManager` 単一化 | 実装状況棚卸し |
| JKT-01 | Jakarta | `web.xml`/`beans.xml` の Jakarta EE 10 スキーマ化 | 未実装 | 認証/監査 | P2 / Jakarta | `jakarta.ee/xml/ns/jakartaee` へ更新 | 実装状況棚卸し |
| JKT-02 | Jakarta | Micrometer への移行（Metrics Subsystem） | 未実装 | 監査 | P2 / Jakarta | Micrometer 化 + CLI 更新 | 実装状況棚卸し |
| JKT-04 | 認証 | Elytron/Jakarta Security への認証移行 | 未実装 | 認証 | P2 / Jakarta | 認証方式再設計 | 実装状況棚卸し |
| JKT-05 | 認証 | 2FA 暗号キーの Secrets 管理 | 未実装 | 認証 | P2 / Jakarta | 環境変数必須化 + 秘匿管理 | 実装状況棚卸し |
| JKT-06 | 認証 | HTTPS 常時化/Forwarded ヘッダ検証 | 未実装 | 認証 | P2 / Jakarta | 証明書設定 + reverse proxy 設計 | 実装状況棚卸し |
| ORCA-01 | ORCA Master | `/orca/inputset` WHERE 句修正 | 未実装 | Master | P0 / ORCA Master | `hospnum` フィルタ括弧明示 | 実装状況棚卸し |
| ORCA-02 | ORCA Master | `/orca/stamp/{setCd,name}` に `date` 追加 | 未実装 | Master | P0 / ORCA Master | パラメータ拡張 + 期間チェック | 実装状況棚卸し |
| WEB-API-01 | Web/API | `/orca21/medicalmodv2/outpatient` 実データ実装 | stub のみ | 監査/Master | P1 / 外部 API | ORCA 実データ連携 + DTO 整合 | 外来 API ギャップ実装 |
| WEB-API-02 | Web/API | `/api01rv2/claim/outpatient/*` 実データ実装 | mock endpoint のみ | 監査/Master | P1 / 外部 API | 実データ返却 + audit 整合 | 外来 API ギャップ実装 |
| WEB-API-03 | Web/API | `documentRevision/updatedAt` 追加（外来記録保存/更新） | 契約未反映 | 監査 | P1 / 外部 API | API 応答契約の拡張 | 外来 API 契約テーブル |

---

## 2. 部分実装（追加対応が必要）

| ID | 領域 | API/機能 | 現状 | 追加対応 | 優先度/実装順 | 根拠 |
| --- | --- | --- | --- | --- | --- | --- |
| JKT-07 | Jakarta | Jakarta JSON-P/JSON-B 依存の明示 | 依存未確定 | 依存追加要否確認 + BOM 反映 | P2 / Jakarta | 実装状況棚卸し |
| JKT-08 | Jakarta | `ManagedExecutorService` の JNDI 名整合 | CLI 定義未確認 | `ee-concurrency` 定義確認 | P2 / Jakarta | 実装状況棚卸し |
| MSG-01 | 監査/JMS | JMS 実装（送信） | 実装完了 | WildFly 33 上の ACK 証跡取得 | P0 / 監査・JMS | 実装状況棚卸し |
| EXT-01 | 外部 API | PHR REST 実測 | 実装済 + Trial 未実測 | 200 証跡取得 | P1 / 外部 API | 実装状況棚卸し |
| EXT-02 | 外部 API | 予約/受付ラッパー Trial 実測 | 実装済 + Trial 未実測 | 200 証跡取得 + ORCA_API_STATUS 更新 | P1 / 外部 API | 実装状況棚卸し |
| EXT-03 | 外部 API | 紹介状/MML API 実測 | Runbook 整備済 | Legacy/Modernized diff 証跡取得 | P1 / 外部 API | 実装状況棚卸し |
| WEB-API-04 | Web/API | `missingMaster/cacheHit` の実データ反映 | 固定値返却 | 実データで可変化 + UI トーン検証 | P1 / 外部 API | 外来 API ギャップ実装 |
| WEB-API-05 | Web/API | `patientId` 抽出の入れ子構造対応 | 最小限パース | DTO 拡張 + schema 差分吸収 | P1 / 外部 API | 外来 API ギャップ実装 |

---

## 3. 証跡未取得（実装はあるが証跡不足）

| ID | 対象 | 未取得の証跡 | 優先度/実装順 | 根拠 |
| --- | --- | --- | --- | --- |
| ORCA-API-01 | `/api01rv2/acceptlstv2` 以外の ORCA API | `ORCA_API_STATUS.md` へ未記載 | P0 / ORCA Master | 実装状況棚卸し |
| ORCA-API-02 | `/orca21/medicalmodv2/outpatient` | 最新実測は別ログのみ | P1 / 外部 API | 実装状況棚卸し |
| ORCA-API-03 | `/orca12/patientmodv2/outpatient` | ステータス表未記載 | P1 / 外部 API | 実装状況棚卸し |
| ORCA-API-04 | PHR/予約/紹介状 API | Trial/ORMaster 実測 200 証跡未取得 | P1 / 外部 API | 実装状況棚卸し |
| JMS-ACK-01 | JMS 送信 ACK 受信 | `operations/logs/<RUN_ID>-jms-orca-ack.md` 未作成 | P0 / 監査・JMS | 実装状況棚卸し |

---

## 4. 依存機能（認証・監査・マスター）棚卸し

| 依存区分 | 必要機能 | 目的 | 状態 | 影響範囲 | 次アクション |
| --- | --- | --- | --- | --- | --- |
| 認証 | Elytron/Jakarta Security 移行 | API 認証統一 | 未実装 | 全 API | 方式決定と移行計画 |
| 認証 | 2FA Secrets 管理 | 本番鍵の秘匿化 | 未実装 | Login/管理系 | Secrets 移行 |
| 認証 | HTTPS 常時化 + Forwarded 検証 | 外部接続の安全性 | 未実装 | 全 API | 設定確定 + 接続試験 |
| 監査 | 4xx/5xx Trace-ID 伝播 | 監査の完全性 | 未実装 | 全 API | LogFilter 改修 |
| 監査 | auditEvent 詳細の統一 | UI/監査の整合 | 部分 | 外来 API | 契約/実装揃え |
| Master | ORCA Master REST（05/06/08） | UI マスタ参照 | 未実装 | Reception/Charts/Patients | Master 実装 |
| Master | DataSource 化 | ORCA DB 安定化 | 未実装 | Master/API | DataSource 移行 |

---

## 5. 進捗管理ルール（台帳運用）
- ステータスは `未実装 / 部分実装 / 証跡未取得 / 完了` の 4 段階で統一する。
- 進捗更新は「実装完了」と「証跡取得完了」を分離して記録する。
- 依存区分（認証/監査/マスター）は必須入力とし、優先度判断の根拠にする。
- 実装順は本書のルールに固定し、例外が必要な場合は本書に追記して合意を残す。

## 6. 未確定/追加調査が必要な項目
- `ORCA_API_STATUS.md` の対象 API を拡張し、未記載 API を洗い出す。
- 外来 API の「実データ」検証結果を Stage/Preview で再取得する（MSW OFF + dev proxy）。
- Web クライアント側の `audit.logUiState` / `auditEvent.details` のフィールド一致を再検証する。

