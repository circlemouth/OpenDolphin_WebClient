# ORCA ↔ Web クライアント API 関係マッピング（Modernized）  
RUN_ID=`20251116T210500Z-B`（親 RUN_ID=`20251116T193200Z`）

## 0. 参照チェーン / 前提
- 本調査は Phase2 ガバナンス必読チェーン（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各 ORCA マネージャーチェックリスト）に従い、**モダナイズ版サーバー実装**（`server-modernized/src/main/java`）を対象に実施した。
- ORCA 連携環境は開発用 ORCA サーバー（`mac-dev-login.local.md` 参照）のみを想定。`custom.properties` で `claim.conn=server` かつ `claim.host/claim.send.port` が設定されていることを前提に記載している。
- Legacy 調査メモ（`ORCA_WEB_CLIENT_API_RELATIONSHIP.md`）とは別ドキュメントとして保存し、モダナイズ固有の JMS/Messaging 差分を中心に整理した。
- 医師コード・患者番号など ID 体系は **ORCA 仕様に従う**。8 桁患者番号を要求する場合は ORCA 側の管理連番設定変更が前提であり、モダナイズ側は ORCA 付与値に順応する。

## 1. Web クライアントが叩く REST エンドポイント
| HTTP API | 実装箇所 | 役割 / 改訂点 |
| --- | --- | --- |
| `POST /karte/diagnosis/claim` | `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java:368` | Web クライアントが `DiagnosisSendWrapper` を送信。Jackson (FasterXML) へ移行しつつ `populateDiagnosisAuditMetadata` でトレース情報を付与。レスポンスは新規 `RegisteredDiagnosis` の PK 群。 |
| `POST /karte/diagnosis` / `PUT /karte/diagnosis` | 同上 | DB 保存のみ（CLAIM 送信なし）。Modernized でも JSON 形式は不変だが Jackson の `DeserializationFeature` へ移行済み。 |
| `GET /orca/*` | `server-modernized/src/main/java/open/orca/rest/OrcaResource.java` | Jakarta EE へアップグレード。`@Singleton`/`jakarta.ws.rs.*` を採用しつつ、ORCA DB 参照 SQL は Legacy と同等。 |

## 2. サーバー内部の保存処理
1. `KarteServiceBean#postPutSendDiagnosis`（`server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java:903`）が `EntityManager` 経由で `RegisteredDiagnosisModel` を削除→更新→追加し、`diagnosisAuditRecorder` に作成/更新を記録。
2. `sendClaim=true` かつ `confirmDate` ありの場合、Legacy 直送ロジックを廃止して **`MessagingGateway`** へディスパッチ：`messagingGateway.dispatchDiagnosis(wrapper)`（同ファイル:937）。
3. DB へ保存されるのは従来通り `registered_diagnosis` テーブル。CLAIM 送信有無に関わらずローカル診療録へ即時反映される。

## 3. MessagingGateway と JMS キュー（java:/queue/dolphin）
| コンポーネント | 実装 | 概要 |
| --- | --- | --- |
| `MessagingGateway` | `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java` | `claim.conn=server` かつ `claim.host/port` が揃っているときだけ JMS enqueue。`SessionTraceManager` から Trace-ID を取得し、`ExternalServiceAuditLogger` に送信要求を記録。キュー投入失敗時は `DiagnosisSender`/`ClaimSender` を**同期フォールバック**で呼び出す。 |
| `MessagingConfig` | `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java` | `custom.properties` または `ORCAConnection` から `claim.*` と `dolphin.facilityId` を読み、`ClaimSettings` としてキャッシュ。 |
| JMS Payload | `MessagingHeaders` | JMS メッセージに `openDolphinTraceId` (`MessagingHeaders.TRACE_ID`) と `openDolphinPayloadType` を付加。`payloadType=DIAGNOSIS` で区別。 |

### MessageSender（JMS MDB）
- `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` が `java:/queue/dolphin` を購読し、`ObjectMessage` の型で処理を振り分ける。
- `DiagnosisSendWrapper` 受信時は `MessagingConfig` から最新の `ClaimSettings` を読み、`DiagnosisSender` により ORCA へ CLAÏM 送信。`ExternalServiceAuditLogger` で成功/失敗ログも記録。
- JMS に投入できない（JMS Resource unavailable）場合は `MessagingGateway` 側のフォールバック経路が `DiagnosisSender` を直接叩き、同じ監査ログを残すため、データロストしない構成になっている。

## 4. ORCA 側 API（READ系）とデータ扱い
- **マスタ/セット取得**: `GET /orca/tensu/*`, `/orca/inputset`, `/orca/stamp/{setCd}` などは ORCA DB から `TensuMaster` や `ModuleModel` を返すだけで、Modernized でもサーバー DB には保存しない。Web クライアントは受け取った JSON を元にスタンプツリーへ変換する。
- **病名インポート**: `GET /orca/disease/{import,active}` で `tbl_ptnum`→`tbl_ptbyomei` を参照し、`RegisteredDiagnosisModel` の JSON を返す。クライアントが再登録しない限りローカル DB へは書き込まない。
- **診療科/相互作用**: `GET /orca/deptinfo` は `OrcaConnect` (HTTP API) を呼び、`PUT /orca/interaction` は ORCA DB の `tbl_interact` を参照。いずれもレスポンスのみで永続化なし。

## 5. データ取り扱いサマリ
| Direction | Web クライアント API | Modernized サーバー処理 | 保存/証跡 |
| --- | --- | --- | --- |
| Web → Server → ORCA | `POST /karte/diagnosis/claim` | DB CRUD 後 `MessagingGateway` → `java:/queue/dolphin`。JMS 不可時はフォールバック同期送信。 | `registered_diagnosis`（DB）、`ExternalServiceAuditLogger`、JMS トレース（Trace-ID 付与）。 |
| ORCA → Server → Web | `GET /orca/disease/*` | ORCA DB SELECT、JSON 変換のみ。 | レスポンスのみ（ユーザー操作次第で DB 化）。 |
| ORCA Master 提供 | `/orca/tensu/*`, `/orca/inputset`, `/orca/stamp/{cd}` | マスタ参照して JSON/ModuleModel を返却。 | 保存なし（Web クライアント側でスタンプとして保持）。 |
| Server → ORCA HTTP | JMS 消費時（Claim/Diagnosis） | `MessageSender` が `DiagnosisSender`/`ClaimSender` を使い ORCA の CLAIM ソケットへ送信。 | `ExternalServiceAuditLogger` に結果を残し、RUN_ID ログと突合可能。 |

## 6. 今後の更新フロー
1. ORCA 連携 RUN を実施する際は、このメモの RUN_ID を引用しつつ `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` で JMS エビデンス（Trace-ID / ACK / NAK）を記録する。
2. `MessagingGateway` の設定変更（`custom.properties` や JMS リソース切替）が発生した場合は、本メモと `DOC_STATUS` を同時に更新し、マネージャーチェックリスト（Sprint2 / Connectivity）にもリンクを追加する。

## 7. 処方／スタンプ／点数マスタ照査（RUN_ID=`20251116T193200Z`）

### 7.1 Legacy パリティ確認
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java` は Legacy 版（`server/src/.../OrcaResource.java`）と SQL・DTO・レスポンス構造が同一で、差分は `jakarta.*` / `com.fasterxml.jackson.databind.ObjectMapper` への置換のみ。`/tensu/*`, `/inputset`, `/stamp/{code,name}`, `/orca/disease/*` はすべて Legacy 実装を引き継いでいる。

### 7.2 入力セット／スタンプ実装
- `/orca/inputset`：`getOrcaInputSet`（`server-modernized/src/main/java/open/orca/rest/OrcaResource.java:820-910`）が `tbl_inputcd` から `P%`/`S%` のセットを抽出。ただし WHERE 句が `hospnum=<n> and inputcd like 'P%' or inputcd like 'S%'` となっており、`S%` 系は施設番号フィルタを通過する Legacy 仕様が残る。
- `/orca/stamp/{setCd,stampName}`：`getStamp`（同:948-1306）が `tbl_inputset` → `tbl_tensu` を辿り `ModuleModel` を生成。セットの有効期間はサーバー当日 (`new Date()`) でのみ判定しているため、診療日を指定したプレビューや将来日のテンプレート検証には API 拡張が必要。
- `createStamp`（同:1312-1368）では `receiptCode` から `ModuleInfoBean.entity` と `BundleDolphin.orderName` を導出し、RP/注射/処置/検査/放射線などのカテゴリ分類を Legacy と同一ロジックで行う。

### 7.3 点数マスタ実装
- `/orca/tensu/name`・`/code`・`/ten`・`/shinku` は `TensuMaster` を返す `@GET` 群（同:261-587）。`/name` 系では `taniname`, `ykzkbn`, `yakkakjncd`, `yukostymd`/`yukoedymd` まで返却する一方、`/shinku` は 11 列のみ（単位・薬剤区分なし）。
- `/orca/general` と `/orca/interaction` も Legacy 実装のまま動作し、Web クライアントの一般名照会・禁忌チェック UI に直接利用されている。

### 7.4 Web クライアント側の利用状況
- `web-client/src/features/charts/api/orca-api.ts:134-264` で `/orca/tensu/name` と `/orca/stamp/{code,name}` のクライアント関数を定義し、`web-client/src/features/charts/pages/ChartsPage.tsx:3769-3794` の `handleCreateOrderFromOrca` が取得した `ModuleModel` をカルテの `OrderModuleDraft` に変換。
- `docs/web-client/features/ORDER_ENTRY_DATA_GUIDE.md:64-120`、`docs/web-client/guides/CLINICAL_MODULES.md:68-82`、`docs/web-client/features/PHASE3_STAMP_AND_ORCA.md:11-20` でも `/orca/tensu/*`／`/orca/inputset`／`/orca/stamp`／`/orca/interaction` を前提 API として明示し、現行 UI（OrcaOrderPanel + StampLibraryPanel）が Modernized API へ依存している。

### 7.5 観測したギャップ（2025-11-16T210500Z-B 更新）
1. **入力セットの facility フィルタ → 解消**: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java:832-839` の WHERE 句を `hospnum=<n> AND (inputcd like 'P%' OR inputcd like 'S%')` へ修正し、`S%` セットでも施設番号を必須にした。証跡: `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md` §6。
2. **診療日指定 → 解消**: `/orca/stamp/{param}` が `setCd,stampName,visitDate` を受け入れ、診療日（YYYYMMDD または ISO8601 から抽出）が `tbl_inputset` / `tbl_tensu` の有効期間チェックに使われる。Web クライアントの `fetchOrcaOrderModules` は `selectedVisit?.visitDate` を渡すよう変更。
3. **`/tensu/shinku` の列不足 → 解消**: `QUERY_TENSU_BY_SHINKU` に `taniname`, `ykzkbn`, `yakkakjncd` を追加し、診療区分検索モードでも `/tensu/name` と同じ付帯情報（単位・薬剤区分・薬価コード）を応答できるようになった。
4. **`/tensu/ten` の UI 連携（継続課題）**: API は実装済みだが Web クライアントでは点数帯フィルタ UI を Phase5 backlog として保留。公開時に絞り込みオプションや返却列を再確認する。

## 8. Messaging/JMS 設定レビュー（RUN_ID=`20251116T111332Z`）
- **送信トリガー**: `KarteServiceBean#postPutSendDiagnosis` は DB 反映後に `wrapper.getSendClaim()` と `confirmDate` を両方満たした場合のみ `messagingGateway.dispatchDiagnosis(wrapper)` を呼び、不要な JMS publish を避ける（`server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java:901-945`）。
- **Gateway／フォールバック**: `MessagingGateway` は `claim.conn=server` かつ `claim.host/claim.send.port` が揃っているときだけ JMS enqueue を行い、`java:/queue/dolphin` へ投入できなかった場合は同じ `DiagnosisSender` を同期で呼び出して送信しつつ監査ログを残す構成になっている（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:43-114`）。
- **MDB and Trace**: `MessageSender` MDB が `java:/queue/dolphin` を購読し、`DiagnosisSendWrapper` 受信時に `MessagingHeaders.TRACE_ID=openDolphinTraceId` を読んで `DiagnosisSender` へ委譲、成功/失敗を `ExternalServiceAuditLogger` へ記録するため、JMS 経路でもフォールバックでも同じ証跡が残る（`server-modernized/src/main/java/open/dolphin/session/MessageSender.java:34-196`）。
- **JMS リソース**: WildFly CLI では `dolphinQueue`（`java:/queue/dolphin`）と `InVmConnectionFactory`/`java:/JmsXA` を確保しており、Docker Compose から再適用できる（`ops/modernized-server/docker/configure-wildfly.cli:129-154`）。
- **設定チェーン**: `MessagingConfig` が `jboss.home.dir/custom.properties` を読み、未設定時は `ORCAConnection` の設定コピーを使う。`ops/shared/docker/custom.properties` サンプルにも `claim.conn=server`, `claim.host`, `claim.send.port`, `dolphin.facilityId` が入っているため、サーバー側設定と JMS 送信要件が同じ情報源にまとまっている（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java:35-110`, `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java:33-105`, `ops/shared/docker/custom.properties:5-21`）。
- **Trace 伝搬解消**: `MessagingHeaders` は `openDolphinTraceId/openDolphinPayloadType` のように Java 識別子準拠の名称へ統一されており、`messaging-parity-check` で報告された `open.dolphin.traceId` による AMQ139012 を解消済み。`TRACE_PROPAGATION_CHECK.md` と同じ Trace-ID を JMS/監査へ流せる（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingHeaders.java:3-23`, `docs/server-modernization/phase2/notes/messaging-parity-check.md:24-66`, `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md:1-26`）。
