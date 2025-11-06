# Common DTO Diff A〜M (2026-06-05 調査)

- 比較対象: `common/src/main/java/open/dolphin/infomodel`（Jakarta 対応版, HEAD）と Legacy 実装（Git コミット `e17c06d8 Version 2.5.12` 時点）。
- 調査観点: フィールド追加・削除、型変更、`jakarta.persistence` 置換状況、Jakarta 移行漏れ、Legacy 未移行項目。
- 備考: 差分のないクラスでも Legacy 互換性確認のため列挙。新規 DTO / Legacy にのみ存在する DTO は別表で整理。

## Legacy と実質同等（コード差分なし）

| クラス | 差分概要 | コメント / 対応メモ |
| --- | --- | --- |
| AccessLicenseeModel | Legacy と完全一致。 | 対応不要。 |
| AccessRightModel | Legacy と完全一致。 | 対応不要。 |
| ActivityModel | Legacy と完全一致。 | 対応不要。 |
| AddressModel | Legacy と完全一致。 | 対応不要。 |
| AllergyModel | Legacy と完全一致。 | 対応不要。 |
| Appoint | Legacy と完全一致。 | 対応不要。 |
| AppoList | Legacy と完全一致。 | 対応不要。 |
| AppoListList | Legacy と完全一致。 | 対応不要。 |
| BundleDolphin | Legacy と完全一致。 | 対応不要。 |
| BundleMed | Legacy と完全一致。 | 対応不要。 |
| ChartEventModel | Legacy と完全一致。 | 対応不要。 |
| ClaimBundle | Legacy と完全一致。 | 対応不要。 |
| ClaimConst | Legacy と完全一致。 | 対応不要。 |
| ClinicalDocumentModel | Legacy と完全一致。 | 対応不要。 |
| CodeNamePack | Legacy と完全一致。 | 対応不要。 |
| DiagnosisDocumentModel | Legacy と完全一致。 | 対応不要。 |
| DiagnosisSendWrapper | Legacy と完全一致。 | 対応不要。 |
| DiseaseEntry | Legacy と完全一致。 | 対応不要。 |
| DiseaseList | Legacy と完全一致。 | 対応不要。 |
| DocInfoList | Legacy と完全一致。 | 対応不要。 |
| DocumentList | Legacy と完全一致。 | 対応不要。 |
| DrugInteractionList | Legacy と完全一致。 | 対応不要。 |
| DrugInteractionModel | Legacy と完全一致。 | 対応不要。 |
| ID | Legacy と完全一致。 | 対応不要。 |
| InfoModel | Legacy と完全一致。 | 対応不要。 |
| InfoModelTransferable | Legacy と完全一致。 | 対応不要。 |
| InteractionCodeList | Legacy と完全一致。 | 対応不要。 |
| IStampTreeList | Legacy と完全一致。 | 対応不要。 |
| IStampTreeModel | Legacy と完全一致。 | 対応不要。 |
| KarteNumber | Legacy と完全一致。 | 対応不要。 |
| LaboImportReply | Legacy と完全一致。 | 対応不要。 |
| LaboImportSummary | Legacy と完全一致。 | 対応不要。 |
| LabTestRowObject | Legacy と完全一致。 | 対応不要。 |
| LabTestValueObject | Legacy と完全一致。 | 対応不要。 |
| LastDateCount | Legacy と完全一致。 | 対応不要。 |
| LetterModuleList | Legacy と完全一致。 | 対応不要。 |
| MasterEntry | Legacy と完全一致。 | 対応不要。 |
| ModuleList | Legacy と完全一致。 | 対応不要。 |
| ModuleListList | Legacy と完全一致。 | 対応不要。 |

## Jakarta 移行のみ（`javax.persistence` → `jakarta.persistence` 等）

| クラス | 差分概要 | コメント / 対応メモ |
| --- | --- | --- |
| AppointmentModel | `javax.persistence.*` → `jakarta.persistence.*`。 | レガシー互換は `legacy` classifier のリロケーションで吸収。 |
| AttachmentModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 同上。 |
| ByteModule | `javax.persistence.*` → `jakarta.persistence.*`。 | 同上。 |
| CompositeImageModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 同上。 |
| DemoDisease | `javax.persistence.*` → `jakarta.persistence.*`。 | Demo 系のみで Legacy 依存なし。 |
| DemoPatient | `javax.persistence.*` → `jakarta.persistence.*`。 | Demo 系のみで Legacy 依存なし。 |
| DemoRp | `javax.persistence.*` → `jakarta.persistence.*`。 | Demo 系のみで Legacy 依存なし。 |
| DepartmentModel | `javax.persistence.*` → `jakarta.persistence.*`。 | Legacy 動作問題なし。 |
| DgOid | `javax.persistence.*` → `jakarta.persistence.*`。 | Legacy 動作問題なし。 |
| DiagnosisCategoryModel | `javax.persistence.*` → `jakarta.persistence.*`。 | Legacy 動作問題なし。 |
| DiagnosisOutcomeModel | `javax.persistence.*` → `jakarta.persistence.*`。 | Legacy 動作問題なし。 |
| DocumentModel | `javax.persistence.*` → `jakarta.persistence.*`。 | Legacy 向け shaded jar で javax 化される想定。 |
| ExtRefModel | `javax.persistence` → `jakarta.persistence`。 | 追加対応不要。 |
| FacilityModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| FirstEncounterModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 本体クラスは存続。サブクラス削除は別表参照。 |
| HealthInsuranceModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| KarteBean | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| KarteEntryBean | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LaboItemValue | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LaboModuleValue | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LaboSpecimenValue | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LetterDate | `@Temporal(javax.persistence...)` を `jakarta.persistence` に更新。 | Jakarta API への置換のみ。 |
| LetterItem | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LetterModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LetterModule | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |
| LicenseModel | `javax.persistence.Embeddable` → `jakarta.persistence.Embeddable`。 | 追加対応不要。 |
| ModuleModel | `javax.persistence.*` → `jakarta.persistence.*`。 | 追加対応不要。 |

## フィールド / アノテーション差分あり

| クラス | Legacy との差分 | コメント / 対応メモ |
| --- | --- | --- |
| ClaimItem | `numberCodeName` / `santeiCode` / `dose` / `doseUnit` を追加。コピー時に新フィールドも複製。 | PHR 連携 (`PhrDataAssembler`) が新フィールドを参照。Legacy DB との互換検証と Flyway での列追加が必要。 |
| DocInfoModel | `admFlag`（外来/入院/在宅区分）フィールドを追加。 | `IDocInfo` コンバータ（adm20）が使用。Legacy DB に `adm_flag` が存在するか確認し、Flyway 適用状況を要確認。 |
| ModuleInfoBean | `performFlag`（実施/中止）の 1 文字項目を追加。 | adm20 側で双方向に利用中。Legacy DB のカラム追加・初期値定義が未確認。 |
| LetterText | Hibernate 6 対応で `@Type` → `@JdbcTypeCode(SqlTypes.CLOB)` に変更。 | Legacy（Hibernate 5）向け shaded jar では互換クラス `StringClobType` を同梱済み。旧サーバーが jakarta 版を誤用しないよう依存関係の切り替えを再確認。 |
| ModelUtils | 年齢文字列から「 歳」表示を削除（`AGE` 定数参照をコメントアウト）。 | Web UI 表示仕様の見直し。既存クライアントで日本語表記が必要な場合は i18n リソース経由に移行済みか確認。 |
| IInfoModel | 日付フォーマット/権限制御/スタンプタブ名などの定数を大幅削除し、性別表示値を `"男"`→`"M"`、`"女"`→`"F"` に変更。 | 旧クライアント・サーバー双方で該当定数の参照有無を精査。未移行コードがあれば代替実装または i18n 共通化が必要。 |

## 新規追加（Jakarta 版のみ）

| クラス | 概要 | コメント / 対応メモ |
| --- | --- | --- |
| AuditEvent | 改ざん耐性付き監査ログ（チェーン化ハッシュを保持）。 | `d_audit_event` テーブルの DDL/Flyway 適用が前提。Legacy へのロールバックは未定義。 |
| CarePlanItem | ケアプラン明細 DTO（`CarePlanModel` と双方向関連、`toClaimItem` あり）。 | adm20 API が利用。Legacy DB に対応テーブルがあるか確認。 |
| CarePlanModel | ケアプラン本体 DTO（`CarePlanItem` セットを `Bundle` へ変換）。 | Legacy には存在しないため、新テーブル／API の互換検証が必要。 |
| Factor2BackupKey | 2FA リカバリ鍵。 | Secrets 管理・暗号化運用を要整理。 |
| Factor2Challenge | 2FA ワンタイムチャレンジ。 | TOTP/FIDO2 両対応。テーブル作成と TTL/クリーンアップ要件を確認。 |
| Factor2ChallengeType | チャレンジ種別 Enum。 | `Factor2Challenge` の付帯定義。 |
| Factor2Code | SMS/音声コードなど二要素コード。 | Legacy 側には存在せず。API 互換リストと整合要確認。 |
| Factor2Credential | 信頼済み認証器のメタ情報（FIDO/TOTP 共用, LOB 保持）。 | Flyway でのテーブル追加と暗号鍵管理方針を明確化。 |
| Factor2CredentialType | 認証器種別 Enum。 | `Factor2Credential` 連動。 |
| Factor2Device | 端末情報（OS/UA 等）と紐付く 2FA デバイス。 | 新規テーブル。既存 REST 実装との整合を確認。 |
| Factor2Spec | 2FA 全体設定値（有効期限/許容失敗回数など）。 | 運用パラメータを WildFly 設定と同期する必要あり。 |
| LastDateCount30 | 過去 30 日統計 DTO（`allergyCount` 追加済み）。 | Legacy には未導入。統計用途の API 対応状況を確認。 |

## Legacy のみに存在（Jakarta 版では削除済み）

| Legacy クラス | 状況・影響 | コメント / 対応メモ |
| --- | --- | --- |
| FirstEncounter0Model | Legacy では `IPhoneServiceBean`（Touch）から参照。Jakarta 版では削除済み。 | 2026-06-06 時点で Touch サービスは `FirstEncounterModel` へのクエリ統一を完了。`docType` 列を用いたフィルタリングに移行済み。 |
| FirstEncounter1Model | 同上。 | 上記と同じ対応で参照排除。必要に応じ `docType`=`FirstEncounter1Model` を指定して取得可能。 |
| FirstEncounter2Model | 同上。 | 直接参照は存在しないが、`FirstEncounterModel` の `docType` で判別できるため再導入不要。 |

## フォローアップ課題メモ

- `ClaimItem` / `DocInfoModel` / `ModuleInfoBean` の新フィールドは DB スキーマ／Flyway マイグレーションを追跡し、旧サーバーでも互換を保てるか検証が必要。
- `IInfoModel` から削除した定数の利用箇所を server / client 双方で洗い直し、代替手段が無い場合は共通ユーティリティへ移行。
- ✅ Touch 系 `IPhoneServiceBean` で `FirstEncounterModel` ベースの取得が実装済み。`docType` 列による互換性を確認し、BeanBytes のデコード手順を Touch サービス側で追補する。
- 2FA / 監査ログ / CarePlan 新規 DTO については DB DDL と Legacy サーバーとの互換性ポリシーを `phase2/operations` 側で明文化する。

### 2026-06-07 Touch FirstEncounter docType 棚卸し進捗（担当: Codex）

- 📝 Ops へ本番 / 検証 DB での `d_first_encounter` 集計を依頼済み。作業環境から DB へ直接アクセスできないため、結果共有待ち。
- 📊 実行してもらう SQL（PostgreSQL 想定）:

```sql
SELECT docType, COUNT(*) AS total
FROM d_first_encounter
GROUP BY docType
ORDER BY total DESC;
```

| docType | COUNT(*) | 備考 |
| --- | --- | --- |
| FirstEncounter0Model | _(Ops 集計結果待ち)_ | Legacy Touch 初診フォーム v0。標準テンプレート。 |
| FirstEncounter1Model | _(Ops 集計結果待ち)_ | Legacy Touch 初診フォーム v1。テンプレート用途の確認が必要。 |
| FirstEncounter2Model | _(Ops 集計結果待ち)_ | Legacy Touch 初診フォーム v2。稼働実績が少ない想定。 |
| *(その他)* | _(Ops 集計結果待ち)_ | 想定外の値があれば移行影響をレビューする。 |

- 🧪 サンプル抽出フロー（Ops 実施想定）:
  1. `SELECT docType, beanBytes FROM d_first_encounter WHERE docType = 'FirstEncounter0Model' LIMIT 5;`
  2. 抽出した `beanBytes` を安全な手段で検証環境へ引き渡し、`IOSHelper.xmlDecode` で復元する。
- 🔍 `IOSHelper.xmlDecode` 利用例（`server-modernized` のクラスパスを利用する想定）:

```bash
# beanBytes を 1 行 Base64 として sample.b64 に保存済みとする
base64 -d sample.b64 > first-encounter.bin
jshell --class-path server-modernized/target/classes <<'EOF'
import open.dolphin.touch.converter.IOSHelper;
var bytes = java.nio.file.Files.readAllBytes(java.nio.file.Path.of("first-encounter.bin"));
var bean = IOSHelper.xmlDecode(bytes);
System.out.println(bean.getClass().getName());
EOF
```

- ✅ 復元された Bean が `FirstEncounter0Model`／`FirstEncounter1Model`／`FirstEncounter2Model` 等の Legacy クラス名で再現できることを確認したうえで、テンプレート差異を Touch API の docType フィルタ仕様へ反映する。
- ⏳ Ops から集計結果およびサンプルが届き次第、本ノートを更新し、API 検証ログと照合する。

### 2026-06-06 DB スキーマ検証ログ（担当: Codex）

- **ClaimItem**
  - スタンプ永続化は `ModuleModel.beanBytes`（`IOSHelper.toXMLBytes` 経由）に XML 直列化されるため、新フィールド用の DB カラム追加は不要。既存スタンプ XML にタグが存在しない場合は自動的に `null` として復元される。
  - ✅ モダナイズ側コンバータ `server-modernized/src/main/java/open/dolphin/{adm10,adm20,touch}/converter/IClaimItem.java` を更新し、`numberCodeName`／`santeiCode`／`dose`／`doseUnit` をラウンドトリップ可能にした。`server-modernized/src/test/java/open/dolphin/adm10/converter/IClaimItemXmlRoundTripTest.java` で `IOSHelper.toXMLBytes` → `xmlDecode` 復元時に値が保持されることを検証済み。
  - DB への直接移行は不要だが、既存スタンプへ後付けで値を埋め込む場合は XML 再生成ジョブを別途用意すること。
- **DocInfoModel**
  - `DocumentModel` の `@Embedded` により `d_document.admflag` 列が必須。Legacy サーバーでも `ADM20_AdmissionServiceBean` が `schedule.getDocInfoModel().setAdmFlag("A")` を実行している（`server/src/main/java/open/dolphin/adm20/session/ADM20_AdmissionServiceBean.java:380`）。列が存在しない環境では登録時にエラーとなる。
  - ✅ `server-modernized/tools/flyway/sql/V0221__doc_module_flag_columns.sql` で `d_document.admflag` を `VARCHAR(1)` として追加する Flyway マイグレーションを用意。Ops 定常手順では `information_schema.columns` で列存在を確認し、欠損環境へ適用する。
  - ✅ `DocInfoModel#clone()` が `admFlag` を複製するよう修正し、`server-modernized/src/test/java/open/dolphin/infomodel/InfoModelCloneTest.java` で複製結果を検証済み。
- **ModuleInfoBean**
  - ✅ `server-modernized/tools/flyway/sql/V0221__doc_module_flag_columns.sql` で `d_module.performflag` 列（`VARCHAR(1)`）を追加するマイグレーションを収録。Ops は `information_schema.columns` の結果とマイグレーション適用状況を日誌化する。
  - ✅ `ModuleInfoBean#clone()` で `performFlag` を複製するよう更新し、`server-modernized/src/test/java/open/dolphin/infomodel/InfoModelCloneTest.java` にユニットテストを追加した。
  - 既存レコードの初期値は施設ポリシーに依存するため、必要に応じて Ops と協議して `UPDATE` を別途実行する。
