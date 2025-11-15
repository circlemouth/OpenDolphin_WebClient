# Common DTO 差分調査（N〜Z）

## 調査概要
- 対象: `common/src/main/java/open/dolphin/infomodel/` の先頭 N〜Z クラス、ならびに同クラスに依存する `open.dolphin.converter` / `open.dolphin.common` / `open.dolphin.util` の Jakarta 化済みファイル。
- Legacy 基準: `upstream/master`（dolphin-dev/OpenDolphin）。`git diff upstream/master -- <path>` で比較。
- 本調査では Jakarta 置換状況、フィールド/シリアライズ仕様の差分、周辺コンバータ・ユーティリティへの波及を洗い出した。

## 差分サマリー
| 区分 | 対象 | Legacy との差分 | 影響/リスク | 推奨フォローアップ |
| --- | --- | --- | --- | --- |
| Jakarta 置換のみ | `NLabo*` / `Observation*` / `OndobanModel` / `OrcaInput*` / `OtherIdModel` / `ParentIdModel` / `Patient*`（`FreeDocument/Memo` を除く）/ `PVT*` / `PhysicalModel` / `PostSchedule` / `PriscriptionModel` / `ProgressCourse` / `PublicInsuranceItemModel` / `PublishedTree*` / `RadiologyMethodValue` / `RegisteredDiagnosis*` / `RoleModel` / `SchemaModel`（※UI 由来で `javax.swing` 維持）/ `Simple*` / `Stamp*` / `StringList` / `SubscribedTree*` / `TelephoneModel` / `Tensu*` / `TextStampModel` / `User*` / `VersionModel` / `VisitPackage` / `VitalList` / `VitalModel` | `javax.persistence` などを `jakarta` に置換。ロジック・フィールド差分なし。`VitalModel`/`VitalList` は改行コード統一のみ。 | 低: API/シリアライズ互換性に影響無し。 | 継続監視のみ。 |
| CLOB マッピング刷新 | `NurseProgressCourseModel` / `PatientFreeDocumentModel` / `PatientMemoModel` | Hibernate 6 遷移に伴い `@Type(StringClobType)` → `@JdbcTypeCode(SqlTypes.CLOB)` に変更。 | 低: JDBC 方言が `SqlTypes.CLOB` をサポートしていることを確認済み（Payara/Hibernate6 前提）。 | Flyway/本番 DB の CLOB 型互換性を運用手順に明記。 |
| PHR バンドル拡張 | `PHRBundle` | `facilityNumber` フィールド追加（医療機関番号）。 | 中: JSON/CSV 出力項目が増えるため、下流連携の項目受け取り確認が必要。 | `PhrDataAssembler`・外部連携仕様書の項目一覧を更新し、受領側テストを追加。 |
| PHR 投薬項目拡張 | `PHRClaimItem` | 用法情報（`frequency`/`frequencyName`/`administration`）と投与期間・投与量（`startDate`/`endDate`/`dose`/`doseUnit`）を追加。 | 中: JSON（REST `/20/adm/phr/container` 等）で新フィールドが出力される。Legacy クライアントが未対応の場合の Graceful Degradation を要確認。 | 1) 既存 CSV/JSON のスキーマ版管理、2) 旧クライアントでの無視可否を検証。 |
| 新規 Async ジョブ DTO | `PHRAsyncJob` | 新規エンティティ。UUID 主キー、`patientScope` jsonb、`OffsetDateTime` タイムスタンプ、`@PrePersist` で `jobId`/`queuedAt` 自動採番。 | 中: DB 側 `phr_async_job`（Flyway V0220）と整合必須。ジョブ状態遷移/再試行制御の仕様レビューが未完。 | 1) `SERVER_MODERNIZED` Runbook の Flyway 適用チェックを運用ガイドへ転記、2) `/20/adm/phr/export` 系 API の結合テスト整備。 |
| 第三者提供記録 | `ThirdPartyDisclosureRecord` | 新規エンティティ。`d_third_party_disclosure` テーブル対応、`Instant` を採用。 | 中: 現状 API 実装未着手。記録作成フローが不在のままデータモデルのみ先行。 | 1) 監査要件ドキュメントに入力トリガー案を記載、2) 運用部門ヒアリング→実装計画化。 |
| Jakarta Mail 化 | `converter/PlistConverter` / `converter/PlistParser` | `javax.mail` → `jakarta.mail`。 | 低: Payara 6 では Jakarta Mail を標準同梱。Legacy クライアントが Java EE 依存の場合の再ビルド要。 | 共通依存ライブラリ（client module）を Jakarta Mail 対応版へ更新済みか確認。 |
| XML 解析刷新 | `common/OrcaAnalyze` | Xalan（`XPathAPI`）依存を廃止し `javax.xml.xpath` へ移行。`OrcaPatientInfo` DTO を追加、`parsePatientInformation` を新設。 | 中: 旧コードが `XPathAPI` の静的 API に依存していた場合に挙動差異が出る恐れ。`analisisSampleXml` の戻り値未利用問題が残存。 | 1) `OrcaAnalyze` 利用箇所を洗い出し（現状参照無し）、2) API 化するなら戻り DTO を返す設計へ整理。 |
| 共通ユーティリティ追加 | `common/cache/CacheUtil` / `util/LegacyBase64` | TTL 付きメモリキャッシュユーティリティ／Base64 ラッパー（`java.util.Base64` を共通化）。 | 中: `TouchModuleService`・`Base64Utils` が新ユーティリティを前提に実装済み。キャッシュ TTL 設定の監視が未整備。 | 1) キャッシュヒット率/TTL 監視項目を Ops Runbook に追記、2) Legacy Base64 の互換試験を旧 API レスポンスで実施。 |
| その他フォーマット調整 | `VitalModel` / `VitalList` / `VitalModelConverter` 等 | 改行コードとファイルモード（755→644）を正規化。 | 低: 機能影響無し。 | 追加作業不要。 |

## Jakarta 置換状況
- 対象範囲の DTO はすべて `jakarta.persistence` / `jakarta.mail` へ移行済み。Legacy 側と共通利用する UI クラス（`SchemaModel` の `javax.swing.ImageIcon` など）は例外として `javax.*` を維持。
- `@Temporal`/`@Enumerated` などのアノテーション指定は Legacy と同一で、シリアライズ形式に変化無し。
- Jakarta 化未完了のクラスは本範囲では確認されず。

## DTO/エンティティ差分詳細
### 1. PHR 系
- `PHRBundle`: `facilityNumber` 追加。`PHRCatch`/`PHRLabModule` に合わせて医療機関番号を保持。REST 出力・CSV へ項目追加済みか要確認。
- `PHRClaimItem`: 新規フィールドを 8 件追加（`frequency`, `frequencyName`, `startDate`, `endDate`, `administration`, `dose`, `doseUnit`）。`PhrDataAssembler` が新 setter を利用しており、JSON には既に展開される設計。Legacy スキーマとの差異が生じるため、互換モード（未対応クライアント向け）有無を検証すること。
- `PHRAsyncJob`: 非同期エクスポートの進捗管理 DTO。デフォルト値（`state=PENDING`, `progress=0`, `retryCount=0`）と `@PrePersist` による `jobId`/`queuedAt` 自動設定が Legacy との差分。`patientScope` に `jsonb` を採用するため、PostgreSQL 以外では互換不可。

### 2. 監査/法令対応
- `ThirdPartyDisclosureRecord`: 新規追加。`patientId`, `actorId`, `actorRole`, `recipient`, `purpose`, `legalBasis`, `disclosedAt`, `referenceId` を保持。監査ワークフローは未実装で、ドキュメントに計画のみ記載（`docs/server-modernization/security/3_7-security-compliance.md`）。

### 3. CLOB ハンドリング
- `NurseProgressCourseModel`, `PatientFreeDocumentModel`, `PatientMemoModel`: Hibernate 6 の `@JdbcTypeCode(SqlTypes.CLOB)` に差し替え。`PersistenceUnitUtil` を利用する既存コードからは透過的だが、`SqlTypes.CLOB` 非対応 DB では読み書き不可となるため、導入環境を限定する必要がある。

### 4. フォーマット・その他
- `VitalModel`/`VitalList`/`VitalModelConverter`: 差分は CRLF→LF と実行権限ビットの清掃のみ。Legacy とのバイナリ互換性は維持。
- `SchemaModel`: `jakarta.persistence.*` へ移行済み。Swing `ImageIcon` 依存を継承。

## Converter / Util 差分
- `PlistConverter` / `PlistParser`: Jakarta Mail API (`jakarta.mail.*`) へ移行。依存ライブラリが Payara 6+ で解決される前提。メール MIME のエンコード/デコード実装は不変。
- `OrcaAnalyze`: Xalan 依存を排除し標準 XPath 実装を採用。`parsePatientInformation` が `OrcaPatientInfo` を返却するよう整理済みだが、外部公開されておらず利用箇所無し。戻り値の活用や例外ハンドリングをどうするか要検討。
- `CacheUtil`: TTL 付きキャッシュ（`ConcurrentHashMap` + `Instant`）を提供。`TouchModuleService` が `Duration TTL = 10s` で利用。エントリアップデート時に TTL 無効 (`null/0/negative`) の場合 remove する設計。監視や統計 API は未実装。
- `LegacyBase64`: `java.util.Base64` をラップし Legacy API と同じ結果を返すユーティリティ。`touch/Base64Utils` が利用。Base64 行区切りや MIME フラグが Legacy と一致するか互換テストが必要。

## 互換性リスクと対応優先度
1. **PHR 出力とのスキーマ差異（中）**: 新規フィールド追加に伴い旧クライアントが予期しないキーを受け取る可能性。→ 旧クライアントの JSON パーサ動作確認と、必要なら互換モード（旧スキーマ限定レスポンス）の追加を検討。
2. **PHR 非同期ジョブの DB マイグレーション（中）**: `phr_async_job` テーブルが未適用の場合 API エラーとなる。→ Flyway 適用チェックをビルド/デプロイパイプラインへ組み込み、Runbook へテストクエリを追記。
3. **第三者提供記録の未実装（中）**: エンティティのみ存在し運用フローが未整備。→ UX/監査チームとのレビューを経て API 実装スケジュールを定義。暫定的にテーブルへの直接入力手順を策定。
4. **Jakarta Mail 依存（低）**: クライアントビルドが旧 javax.mail に固定されている場合のコンパイルエラー。→ `client` モジュールの依存調査と Jakarta Mail 版への更新計画を確認。
5. **CLOB マッピングの DB 方言依存（低）**: Hibernate 6 + PostgreSQL では問題無いが、移行初期の Oracle/MySQL 環境ではテストが必要。→ サポート DB の互換試験項目に追加。
6. **CacheUtil 運用監視（低）**: TTL 固定 10 秒で問題無いか、ヒット率/メモリ使用量の可視化が未整備。→ `TouchModuleService` 用のメトリクスを監視設計へ追加。

## フォローアップタスクリスト
1. PHR 出力のスキーマ差分検証（Legacy クライアント/外部連携）とドキュメント更新。
2. `phr_async_job` テーブル適用状況の自動チェック（CI またはデプロイ後ヘルスチェック）。
3. 第三者提供記録ワークフローの要件定義→実装ロードマップ策定。
4. Jakarta Mail 依存ライブラリの整合確認（client モジュール側ビルドの再確認）。
5. CLOB 型の動作検証を含む DB 方言テストケースの更新。
6. CacheUtil/LegacyBase64 の互換試験（旧サーバーレスポンスとの比較）を `WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` に追記。

## PHR / 監査 / 2FA 実装計画（2026-06-05 更新）

| 対象 | 現状 | ギャップ | 次アクション | 優先度 |
| --- | --- | --- | --- | --- |
| `PHRAsyncJob` / `phr_async_job` / `PhrExport*` | REST (`PHRResource`) とワーカー (`PhrExportJobWorker`) は存在し、Flyway `V0220__phr_async_job` でテーブル作成済み。 | Flyway 適用確認が手作業。S3 ストレージ実装が未完 (`S3PhrExportStorage` は `UnsupportedOperationException`)。署名付き URL がエフェメラルな秘密鍵に依存。監査ログ/メトリクスがダッシュボード未反映。 | ① CI/CD で `flyway info` チェックと `\d phr_async_job` を自動化、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ反映。② S3 永続化の実装 or 本番での FILESYSTEM 運用許容可否を決定し、`PhrExportStorageFactory` の警告除去。③ `PHR_EXPORT_SIGNING_SECRET` を Secrets/Vault へ登録し、ローテーション手順を `security/DEPLOYMENT_WORKFLOW.md` に追記。④ Micrometer のジョブメトリクス（pending/failed 件数）を `OBSERVABILITY_AND_METRICS.md` へ追加し、PagerDuty 連携条件を定義。 | 高 |
| `ThirdPartyDisclosureRecord` / `d_third_party_disclosure` | DTO とテーブルは `V0003__security_phase3_stage7.sql` で作成済み。 | API/ビジネスロジック未実装。入力トリガー・承認フロー・監査記録が不明。データ閲覧 UI/エクスポートも未定義。 | ① 監査チームと合意し、記録イベント（外部提供要求・実績・訂正）ごとに API 設計 (`POST /audit/disclosure`, `GET /audit/disclosure`) をまとめる。② `AuditTrailService` と連携し `THIRD_PARTY_DISCLOSURE_*` 監査アクションを定義。③ `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に SQL/CSV 抽出手順と保管ポリシーを追加。④ UI 実装（閲覧・検索）とバックアップ運用の工数見積りを Phase3 計画へ反映。 | 高 |
| `Factor2Credential` / `Factor2Challenge` / `Factor2BackupKey` / `Factor2Code` | `/20/adm/factor2/*` 系 API 実装・単体テストは存在し、Flyway `V0003__security_phase3_stage7.sql` でテーブル拡張済み。 | `FACTOR2_AES_KEY_B64` など Secrets の投入確認が手動。Relying Party 設定の棚卸しと Origin チェックが定期化されていない。FIDO2/TOTP 監査ログのハッシュ確認が未自動化。 | ① デプロイ前チェックとして `ops/check-secrets.sh` に 2FA/PHR 用 Secrets を追加し、CI で未設定なら失敗させる。② `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に FIDO2/TOTP の手動検証（登録/認証成功・失敗、`d_audit_event` の `TOTP_*` / `FIDO2_*` 確認）と `SELECT` サンプルを追加。③ `security/DEPLOYMENT_WORKFLOW.md` に RP ID/Origin の棚卸しテンプレートとローテーション時の監査記録テンプレートを追記。④ `AdmissionResourceFactor2Test` を CI に組み込み、`mvn -f pom.server-modernized.xml test -Dtest=AdmissionResourceFactor2Test` を nightly で必ず実行。 | 中 |
| `AuditEvent` / `d_audit_event`（※ A〜M メモ参照） | 監査ログ DTO/テーブル・サービス (`AuditTrailService`) は実装済み。ハッシュチェーンで改ざん検知を実装。 | ハッシュチェーンの巡回確認がジョブ化されていない。監査データの保管ポリシー（保存期間・アーカイブ）が未確定。 | ① `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に `SELECT event_time,event_hash,previous_hash FROM d_audit_event ORDER BY event_time DESC LIMIT 20;` でのハッシュ連鎖検査手順と異常時エスカレーション窓口を追加。② 保管ポリシーと長期アーカイブ方式（WORM/S3 Glacier 等）をセキュリティ委員会で決定し、`security/3_7-security-compliance.md` と `operations/OBSERVABILITY_AND_METRICS.md` に反映。 | 中 |

### PHRAsyncJob / PHR エクスポート運用
- **Flyway & ヘルスチェック**: `V0220__phr_async_job` を CI で検査し、未適用時はデプロイを中断させる。`docker compose exec modernized-db \d phr_async_job` を自動化し、Runbook の手順 6-1 と整合させる。
- **ストレージ実装**: 本番で S3 を利用する場合は `S3PhrExportStorage#storeArtifact/loadArtifact` を実装し、IAM 設定・署名 URL 発行ポリシーを `phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` に追加する。暫定で FILESYSTEM を利用する場合はマウント先と容量監視を Ops に引き継ぐ。
- **署名鍵管理**: `PHR_EXPORT_SIGNING_SECRET` を Vault/Secrets Manager に登録し、ローテーション手順とテスト（署名済み URL の有効期限検証）を `security/DEPLOYMENT_WORKFLOW.md` の「2. 実装・適用手順」に追記する。
- **監査・メトリクス**: `AuditTrailService` の `PHR_EXPORT_*` イベントを `d_audit_event` で定期確認し、Micrometer に `phr_async_job_active_total` などのカウンタを追加。PagerDuty 連携条件（FAILED 連続数、遅延閾値）を Ops と合意する。

### 第三者提供記録のロードマップ
- **API 設計**: `ThirdPartyDisclosureRecord` を `AdmissionResource` とは分離し、将来的な権限分離を考慮して専用 Resource（仮: `AuditDisclosureResource`）を新設。REST モデル／入力 DTO を整理し、患者 ID + 事案 ID での検索・フィルタを設計する。
- **ワークフロー定義**: 医事課／外部連携部門とのヒアリングで「第三者提供が発生するシナリオ」「承認プロセス」「証跡添付要件」を整理し、登録・訂正・閲覧ステップを業務フロー図に落とす。
- **監査連携**: 記録作成・訂正・削除それぞれで `AuditTrailService` へ `THIRD_PARTY_DISCLOSURE_*` イベントを記録。要件次第で患者通知（メール/SMS）の可否も合わせて決定する。
- **データ保全**: `d_third_party_disclosure` のバックアップと暗号化要件を検討。必要なら行レベル暗号化または専用テーブルスペースを採用し、運用 Runbook に追加する。

### 2FA DTO / 監査テーブルの運用ポイント
- **Secrets チェックリスト**: `FACTOR2_AES_KEY_B64`, `FIDO2_RP_ID`, `FIDO2_ALLOWED_ORIGINS`, `PHR_EXPORT_SIGNING_SECRET` を `ops/check-secrets.sh` で検査し、欠落時は CI で失敗させる。値は Vault（`kv/modernized-server/*`）に集約する。
- **手動検証**: ステージ環境で TOTP/FIDO2 の登録・認証を実行し、`d_factor2_credential` と `d_factor2_challenge` を参照して状態遷移（`verified`, `expires_at`）を確認。失敗ケースでは `d_audit_event` に `_FAILED` が記録されることを SQL で確認する。
- **定期棚卸し**: 半期の鍵ローテーション時にバックアップコード再発行とハッシュチェーン検査（`previous_hash`）を同時に実施。結果は `PHASE2_PROGRESS.md` と `security/DEPLOYMENT_WORKFLOW.md` に追記する。
- **CI 組み込み**: `AdmissionResourceFactor2Test` / `TotpHelperTest` / `TotpSecretProtectorTest` を CI の nightly 実行に登録し、失敗時は Secrets 再設定や RP 設定の漏れを疑う運用に切り替える。

## 参考（Jakarta 置換のみの対象ファイル一覧）
NLaboItem / NLaboItemList / NLaboModule / NLaboModuleList / ObservationList / ObservationModel / OndobanModel / OrcaInputCd / OrcaInputCdList / OrcaInputSet / OtherIdModel / ParentIdModel / PatientFileModel / PatientList / PatientLiteList / PatientLiteModel / PatientModel / PatientPackage / PatientVisitList / PatientVisitModel / PhysicalModel / PostSchedule / PriscriptionModel / ProgressCourse / PublicInsuranceItemModel / PublishedTreeList / PublishedTreeModel / PVTClaim / PVTHealthInsuranceModel / PVTPatient / PVTPublicInsuranceItemModel / RadiologyMethodValue / RegisteredDiagnosisList / RegisteredDiagnosisModel / RoleModel / SampleDateComparator / SchemaModel / SimpleAddressModel / SimpleDate / Stamp / StampInfo / StampList / StampModel / StampTreeHolder / StampTreeList / StampTreeModel / StringList / SubscribedTreeList / SubscribedTreeModel / TelephoneModel / TensuList / TensuMaster / TextStampModel / UserList / UserLiteModel / UserModel / VersionModel / VisitPackage / VitalList / VitalModel。
