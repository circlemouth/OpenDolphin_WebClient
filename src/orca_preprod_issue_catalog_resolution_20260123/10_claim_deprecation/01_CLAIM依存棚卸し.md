# 01 CLAIM 依存棚卸し

## RUN_ID
- 20260125T112721Z

## 目的
- server-modernized に残る CLAIM 送信/設定/レスポンス関連コードを最新化し、撤去対象と影響範囲を明確にする。

## 前提
- CLAIM 廃止方針は `docs/server-modernization/ORCA_CLAIM_DEPRECATION.md` を正とする。
- Phase2 文書は Legacy/Archive であり、現行運用は `docs/DEVELOPMENT_STATUS.md` を優先する。

---

## 棚卸し結果（server-modernized + 依存モデル）

### 1) REST/エンドポイント（CLAIM を直接名乗るもの）
- `/orca/claim/outpatient`（`server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java`）
  - 予約/受付/カルテのローカルデータから ClaimBundle を組み立てて返す互換 API。
  - 監査ログ action=`ORCA_CLAIM_OUTPATIENT`、operation=`claim_outpatient` を記録。
  - `ClaimOutpatientResponse`（`server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/ClaimOutpatientResponse.java`）に依存。

### 2) 送受信/フロー（CLAIM/MML 生成・PVT受信）
- **MML/CLAIM XML 生成**
  - `server-modernized/src/main/java/open/dolphin/msg/MMLSender.java`
  - `server-modernized/src/main/java/open/dolphin/session/MmlServiceBean.java`
  - `server-modernized/src/main/java/open/dolphin/msg/MMLHelper.java`
  - `server-modernized/src/main/resources/mml2.3Helper.vm`
  - CLAIM モジュール付き MML を生成するテンプレート依存が残存。
- **PVT 受信時の CLAIM 解析**
  - `server-modernized/src/main/java/open/dolphin/mbean/PVTBuilder.java`
  - `common/src/main/java/open/dolphin/infomodel/PVTClaim.java`
  - JMS で受け取る PVT XML の claim モジュールを解析して PVTClaim に反映。

### 3) 設定/接続（custom.properties 由来の CLAIM 設定）
- `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java`
  - `claim.jdbc.*` / `claim.user` / `claim.password` を **レガシー設定としてブロック**（JNDI を優先）。
- `server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
  - `claim.user` / `claim.password` / `claim.jdbc.*` を **秘匿対象** として遮断。
- `server-modernized/src/main/java/open/dolphin/mbean/InitialAccountMaker.java`
  - `claim.conn` / `claim.host` の参照はコメントアウトのみ（コード依存なし）。

### 4) データモデル/スキーマ（CLAIM 送信フラグ・日時）
- `common/src/main/java/open/dolphin/infomodel/DocInfoModel.java`
  - `sendClaim` / `claimDate` を保持。
- `common/src/main/java/open/dolphin/infomodel/DocumentModel.java`
  - `claimClone()` が `claimDate` を引き継ぐ。
- `common/src/main/java/open/dolphin/infomodel/PatientVisitModel.java`
  - `BIT_SAVE_CLAIM` / `BIT_MODIFY_CLAIM` を定義。
- `server-modernized/src/main/java/open/dolphin/session/PVTServiceBean.java`
- `server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java`
  - PVT 状態判定で CLAIM ビットを利用。
- `server-modernized/src/main/resources/db/migration/V0224__document_module_tables.sql`
  - `claimDate` カラム。
- `common/src/main/java/open/dolphin/infomodel/PostSchedule.java`
  - `sendClaim` を持つが、`ScheduleResource` では未使用。

### 5) CLAIM 表現（ClaimItem/ClaimBundle）の流用
- `common/src/main/java/open/dolphin/infomodel/ClaimBundle.java`
- `common/src/main/java/open/dolphin/infomodel/ClaimItem.java`
- `common/src/main/java/open/dolphin/infomodel/BundleDolphin.java`
- `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaOrderBundleResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalModV2Resource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/module/TouchModuleService.java`
- `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/dto/DolphinDocumentResponses.java`
  - ORCA API/Touch/ADM 互換で ClaimItem を使ったバンドル表現が残存。

### 6) テンプレ/帳票
- `server-modernized/reporting/templates/receipt_export_en_US.vm`
  - claim payload を前提にした帳票コメント。

### 7) テスト/ツール
- `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaClaimOutpatientResourceTest.java`
- `server-modernized/src/test/java/open/dolphin/msg/MessagingDefensiveCopyTest.java`
- `server-modernized/src/test/java/open/dolphin/adm10/converter/IClaimItemXmlRoundTripTest.java`
- `server-modernized/src/test/java/open/dolphin/touch/TouchModuleResourceTest.java`
- `server-modernized/src/test/java/open/dolphin/rest/dto/DemoAspResponsesDefensiveCopyTest.java`
- `scripts/diff_d_audit_event_claim.sh`
  - `d_audit_event_claim.tsv` 比較用（CLAIM 監査関連）。

---

## 撤去対象候補（優先度順）

### A. CLAIM 専用エンドポイント
- `/orca/claim/outpatient` 一式
  - 対象: `OrcaClaimOutpatientResource`, `ClaimOutpatientResponse`, テスト。
  - 代替候補: ORCA API 取得系（例: `medicalmodv2/outpatient`, `acceptlstv2`, `appointments/list` 等）と監査ログの統合。

### B. CLAIM XML/MML 生成
- `MMLSender` / `MmlServiceBean` / `MMLHelper` / `mml2.3Helper.vm`
  - CLAIM 廃止後に MML/CLAIM の送信が不要であれば撤去候補。
  - 代替: API 取得・PushAPI 受信によるデータ同期。

### C. CLAIM 送信フラグ・DB カラム
- `DocInfoModel.sendClaim` / `DocInfoModel.claimDate`
- `DocumentModel.claimClone()` の `claimDate` 引き継ぎ
- `V0224__document_module_tables.sql` の `claimDate` カラム
  - 代替: API 送信結果は API 監査/ログで追跡する方針に統一。

### D. PVT CLAIM 解析
- `PVTBuilder` の claim モジュール解析 / `PVTClaim`
  - CLAIM 由来の PVT ペイロードを受けない運用に移行する場合に撤去候補。
  - 代替: PushAPI で受付/会計状態を同期する実装が必要。

### E. Legacy 設定 (`claim.jdbc.*` 等)
- `ORCAConnection` / `ServerInfoResource` / `EHTResource` の claim.* 対応
  - 完全廃止するなら削除候補。
  - 代替: JNDI/ENV ベースの ORCA DB 接続に集約。

---

## 影響範囲メモ（削除/置換判断の材料）

### 1) CLAIM 撤去で影響を受ける機能
- 外来請求バンドルの互換取得（`/orca/claim/outpatient`）
- CLAIM 形式の MML 出力（帳票・外部送信）
- PVT 受信時の CLAIM モジュール取り込み
- 旧設定プロパティ（`claim.jdbc.*` / `claim.user` / `claim.password`）を参照している運用

### 2) 代替 API / PushAPI の方向性（要確認）
| CLAIM 依存の用途 | 現行依存箇所 | 代替候補 | 備考 |
| --- | --- | --- | --- |
| 外来請求バンドル取得 | `/orca/claim/outpatient` | `medicalmodv2/outpatient` + `appointments/list` + 受付 API | バンドル形式の互換継続が必要か判断が必要。 |
| 病名/処方/オーダ送信 | MML/CLAIM XML 生成群 | `/orca/disease` / `/orca/order/bundles` / `/orca/medical-sets` | API-only へ一本化するなら MML/CLAIM を撤去。 |
| 受付/会計ステータス | PVT CLAIM モジュール | PushAPI（受付/会計通知） | PushAPI 受信実装が未整備。 |
| CLAIM 接続設定 | claim.* プロパティ | ORCA API / DB の ENV/JNDI 設定 | `claim.jdbc.*` は現状ブロック済み。 |

### 3) 既に存在しない（または未実装）の CLAIM 送信口
- server-modernized 内に `/karte/claim` / `/karte/diagnosis/claim` などの REST は存在しない。
  - `common/src/main/java/open/dolphin/infomodel/DiagnosisSendWrapper.java` に `/karte/diagnosis/claim` のコメントが残存。
  - **CLAIM 送信は既に API へ切替済み** と推定されるため、残存モデル/テンプレの整理が主な作業。

---

## 次アクション（提案）
1. `/orca/claim/outpatient` の利用状況を Web クライアント/外部連携で確認し、代替 API を確定。 
2. MML/CLAIM 生成（テンプレ/Helper/Sender）の実利用有無を確認し、撤去 or 保守対象を確定。
3. PVT CLAIM モジュールの受信を PushAPI で置換するかを決定。
4. `DocInfoModel.sendClaim/claimDate` と DB カラムの廃止可否を確認し、マイグレーション方針を策定。

---

## 成果物
- 撤去対象リスト
- 影響範囲メモ
- 代替 API/PushAPI の整理メモ
