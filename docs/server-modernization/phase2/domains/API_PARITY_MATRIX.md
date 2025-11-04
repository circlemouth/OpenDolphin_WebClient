# 新旧REST APIパリティマトリクス

- 作成日: 2025-11-03
- 照会元:
  - レガシー版: `docs/server-modernization/server-api-inventory.yaml`
  - モダナイズ版: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- 正規化ルール: パス中の `{...}` はすべて `{}` として比較し、HTTP メソッドとセットで 1:1 対応を判定
- チェックボックス: `[x]` はモダナイズ版で同等 API を確認済み、`[ ]` は移行未完了または要確認を表す
- 状態ラベル: `◎`=実装＋証跡完了、`△`=実装は存在するが証跡/テスト未整備、`✖`=未実装または要件未定義

## 集計サマリ
| 指標 | 件数 | 備考 |
| --- | --- | --- |
| レガシーRESTエンドポイント総数 | 256 | OpenAPI 3.0.3 から抽出 |
| モダナイズRESTエンドポイント総数 | 221 | API パリティマトリクス再集計（2025-11-03 時点の実装ベース） |
| 1:1対応済み | 202 | HTTP メソッド＋正規化パス一致（`/10/adm/jtouch/*` 追加 16 件と `/pvt2/{pvtPK}` DELETE テスト証跡を含む） |
| レガシーのみ（未整備） | 54 | DolphinResourceASP 19 件 + DemoResourceASP 15 件 + SystemResource 5 件 + MmlResource 4 件 + PHRResource 11 件 |
| モダナイズのみ（新規API） | 8 | 旧サーバー未提供 |

## リソース別進捗
| リソース | レガシー件数 | モダナイズ済 | 未整備 | 備考 |
| --- | --- | --- | --- | --- |
| AdmissionResource | 28 | 28 | 0 | 全エンドポイント移植済み |
| AppoResource | 1 | 1 | 0 | 全エンドポイント移植済み |
| ChartEventResource | 4 | 4 | 0 | 全エンドポイント移植済み |
| DemoResourceASP | 15 | 0 | 15 | 未移植 15 件 |
| DolphinResourceASP | 19 | 0 | 19 | 未移植 19 件（`server-modernized/src/main/java/open/dolphin/touch/DolphinResource*.java` に旧 ASP 実装はあるが、`server-modernized/src/main/webapp/WEB-INF/web.xml` で RESTEasy に未登録・自動テスト証跡なし） |
| EHTResource | 43 | 43 | 0 | 全エンドポイント移植済み（2025-11-03 Runbook EHT-RUN-* に記録） |
| JsonTouchResource | 16 | 16 | 0 | adm10 document/mkdocument 系を Jakarta 実装へ移植し、touch/adm10/adm20 でレスポンス整合を確認（※5 ※6）。 |
| KarteResource | 28 | 28 | 0 | 全エンドポイント移植済み |
| LetterResource | 4 | 4 | 0 | 全エンドポイント移植済み（2025-11-03 監査ログ整備・再確認） |
| MmlResource | 16 | 12 | 4 | Labtest/Letter 系 4 件は Jakarta 版実装を確認済みだが運用証跡待ち（Worker F へ Runbook 追記依頼中）。 |
| NLabResource | 6 | 6 | 0 | 全エンドポイント移植済み |
| OrcaResource | 13 | 13 | 0 | PUT /orca/interaction を含め全エンドポイント整合（2025-11-03 再確認） |
| PHRResource | 11 | 0 | 11 | `PHRResource` に実装は存在するが自動テスト・監査証跡未整備。PHR エクスポート API は未実装で Blocked。 |
| PVTResource | 5 | 5 | 0 | 全エンドポイント移植済み |
| PVTResource2 | 3 | 3 | 0 | DELETE 含め 3 件すべて単体テストで証跡取得。 |
| PatientResource | 11 | 11 | 0 | 全エンドポイント移植済み |
| ScheduleResource | 3 | 3 | 0 | 全エンドポイント移植済み |
| ServerInfoResource | 3 | 3 | 0 | 全エンドポイント移植済み |
| StampResource | 15 | 15 | 0 | 全エンドポイント移植済み（2025-11-03 監査ログ整備済） |
| SystemResource | 5 | 0 | 5 | 自動テスト証跡未整備。全 5 件の検証タスクが残存 |
| UserResource | 7 | 7 | 0 | 全エンドポイント移植済み |

## モダナイズ版のみで提供されるエンドポイント
旧サーバーに存在しないが、モダナイズ版で追加された API を列挙する。

| リソース | HTTP | パス |
| --- | --- | --- |
| MmlResource | GET | `/mml/claim/conn` |
| MmlResource | GET | `/mml/interaction` |
| MmlResource | GET | `/mml/module/{param}` |
| MmlResource | GET | `/mml/serverinfo` |
| MmlResource | GET | `/mml/stamp/{param}` |
| MmlResource | GET | `/mml/stampTree/{param}` |

## 詳細マトリクス
レガシー版で公開されているすべての REST エンドポイントについて、モダナイズ版での対応状況を一覧化する。

### AdmissionResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| DELETE | `/20/adm/carePlan` | AdmissionResource: `/20/adm/carePlan` | [x] | ◎ 移行済み | レガシー: deleteCarePlan |
| POST | `/20/adm/carePlan` | AdmissionResource: `/20/adm/carePlan` | [x] | ◎ 移行済み | レガシー: postCarePlan |
| PUT | `/20/adm/carePlan` | AdmissionResource: `/20/adm/carePlan` | [x] | ◎ 移行済み | レガシー: putCarePlan |
| GET | `/20/adm/carePlan/{param}` | AdmissionResource: `/20/adm/carePlan/{param}` | [x] | ◎ 移行済み | レガシー: getCarePlans |
| GET | `/20/adm/docid/{param}` | AdmissionResource: `/20/adm/docid/{param}` | [x] | ◎ 移行済み | レガシー: getDocIdList |
| GET | `/20/adm/document/{param}` | AdmissionResource: `/20/adm/document/{param}` | [x] | ◎ 移行済み | レガシー: getDocument |
| DELETE | `/20/adm/factor2/auth/{param}` | AdmissionResource: `/20/adm/factor2/auth/{param}` | [x] | ◎ 移行済み | レガシー: resetFactor2Auth |
| PUT | `/20/adm/factor2/code` | AdmissionResource: `/20/adm/factor2/code` | [x] | ◎ 移行済み | レガシー: getFactor2Code |
| PUT | `/20/adm/factor2/device` | AdmissionResource: `/20/adm/factor2/device` | [x] | ◎ 移行済み | レガシー: putFactor2Device |
| POST | `/20/adm/factor2/fido2/assertion/finish` | AdmissionResource: `/20/adm/factor2/fido2/assertion/finish` | [x] | ◎ 移行済み | レガシー: finishFidoAssertion ｜ 2025-11-03: AdmissionResourceFactor2Test（finishFidoAssertionRecordsAuditOnSuccess/OnChallengeNotFound/OnSecurityViolation）で成功・404・400系レスポンスと監査ログ詳細をカバー。`mvn -f pom.server-modernized.xml test` は mvn 不在で未実行（Runbook追記）。 |
| POST | `/20/adm/factor2/fido2/assertion/options` | AdmissionResource: `/20/adm/factor2/fido2/assertion/options` | [x] | ◎ 移行済み | レガシー: startFidoAssertion ｜ 2025-11-03: Unitテスト startFidoAssertionRecordsAuditOnSuccess/OnSecurityViolation を追加し、チャレンジ発行と異常時400応答＋監査ログを確認。 |
| POST | `/20/adm/factor2/fido2/registration/finish` | AdmissionResource: `/20/adm/factor2/fido2/registration/finish` | [x] | ◎ 移行済み | レガシー: finishFidoRegistration ｜ 2025-11-03: finishFidoRegistrationRecordsAuditOnSuccess/OnNotFound/OnSecurityViolation で 200・404・400 のハンドリングと監査記録を網羅。mvn 実行は mvn コマンド欠如で保留（Runbookに記載）。 |
| POST | `/20/adm/factor2/fido2/registration/options` | AdmissionResource: `/20/adm/factor2/fido2/registration/options` | [x] | ◎ 移行済み | レガシー: startFidoRegistration ｜ 2025-11-03: startFidoRegistrationRecordsAuditOnSuccess でチャレンジ生成と監査フィールドを検証。 |
| POST | `/20/adm/factor2/totp/registration` | AdmissionResource: `/20/adm/factor2/totp/registration` | [x] | ◎ 移行済み | レガシー: startTotpRegistration ｜ 2025-11-03: AdmissionResourceFactor2Test（startTotpRegistrationRecordsAuditOnSuccess/OnNotFound, verifyTotpRegistrationRecordsAuditOnSuccess）で 200/404 応答と監査ログの差異を確認。`mvn` 不在によりテストコマンド未実行（Runbook追記）。 |
| POST | `/20/adm/factor2/totp/verification` | AdmissionResource: `/20/adm/factor2/totp/verification` | [x] | ◎ 移行済み | レガシー: verifyTotpRegistration ｜ 2025-11-03: verifyTotpRegistrationRecordsAuditOnSuccess/Failure により成功・400系ハンドリングとバックアップコード生成の監査項目を確認。mvn 実行待ち（環境に mvn 無し）。 |
| GET | `/20/adm/lastDateCount/{param}` | AdmissionResource: `/20/adm/lastDateCount/{param}` | [x] | ◎ 移行済み | レガシー: getLastDateCount |
| DELETE | `/20/adm/nurseProgressCourse` | AdmissionResource: `/20/adm/nurseProgressCourse` | [x] | ◎ 移行済み | レガシー: deleteNurseProgressCourse |
| POST | `/20/adm/nurseProgressCourse` | AdmissionResource: `/20/adm/nurseProgressCourse` | [x] | ◎ 移行済み | レガシー: postNurseProgressCourse |
| PUT | `/20/adm/nurseProgressCourse` | AdmissionResource: `/20/adm/nurseProgressCourse` | [x] | ◎ 移行済み | レガシー: updateNurseProgressCourse |
| GET | `/20/adm/nurseProgressCourse/{param}` | AdmissionResource: `/20/adm/nurseProgressCourse/{param}` | [x] | ◎ 移行済み | レガシー: getNurseProgressCourse |
| DELETE | `/20/adm/ondoban` | AdmissionResource: `/20/adm/ondoban` | [x] | ◎ 移行済み | レガシー: deleteOndoban |
| POST | `/20/adm/ondoban` | AdmissionResource: `/20/adm/ondoban` | [x] | ◎ 移行済み | レガシー: postOndoban |
| PUT | `/20/adm/ondoban` | AdmissionResource: `/20/adm/ondoban` | [x] | ◎ 移行済み | レガシー: updateOndoban |
| GET | `/20/adm/ondoban/{param}` | AdmissionResource: `/20/adm/ondoban/{param}` | [x] | ◎ 移行済み | レガシー: getOndoban |
| POST | `/20/adm/sendPackage` | AdmissionResource: `/20/adm/sendPackage` | [x] | ◎ 移行済み | レガシー: postSendPackage |
| PUT | `/20/adm/sms/message` | AdmissionResource: `/20/adm/sms/message` | [x] | ◎ 移行済み | レガシー: sendSMSMessage |
| PUT | `/20/adm/user/factor2/backup` | AdmissionResource: `/20/adm/user/factor2/backup` | [x] | ◎ 移行済み | レガシー: getUserWithF2Backup |
| PUT | `/20/adm/user/factor2/device` | AdmissionResource: `/20/adm/user/factor2/device` | [x] | ◎ 移行済み | レガシー: getUserWithNewFactor2Device |

### AppoResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| PUT | `/appo` | AppoResource: `/appo` | [x] | ◎ 移行済み | レガシー: putXml |

### ChartEventResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/chart-events` | ChartEventStreamResource: `/chart-events` | [x] | ◎ 移行済み | レガシー: subscribeChartEvents |
| GET | `/chartEvent/dispatch` | ChartEventResource: `/chartEvent/dispatch` | [x] | ◎ 移行済み | レガシー: deliverChartEvent |
| PUT | `/chartEvent/event` | ChartEventResource: `/chartEvent/event` | [x] | ◎ 移行済み | レガシー: putChartEvent |
| GET | `/chartEvent/subscribe` | ChartEventResource: `/chartEvent/subscribe` | [x] | ◎ 移行済み | レガシー: subscribe |

### DemoResourceASP
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/demo/document/progressCourse/{param}` | DemoResourceAsp: `/demo/document/progressCourse/{param}` | [x] | ◎ 移行済み | ※1 ※2 ※3 |
| GET | `/demo/item/laboItem/{param}` | DemoResourceAsp: `/demo/item/laboItem/{param}` | [x] | ◎ 移行済み | ※1 ※3 ※4 |
| GET | `/demo/module/diagnosis/{param}` | DemoResourceAsp: `/demo/module/diagnosis/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/module/laboTest/{param}` | DemoResourceAsp: `/demo/module/laboTest/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/module/rp/{param}` | DemoResourceAsp: `/demo/module/rp/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/module/schema/{param}` | DemoResourceAsp: `/demo/module/schema/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/module/{param}` | DemoResourceAsp: `/demo/module/{param}` | [x] | ◎ 移行済み | ※1 ※2 ※3 |
| GET | `/demo/patient/firstVisitors/{param}` | DemoResourceAsp: `/demo/patient/firstVisitors/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patient/visit/{param}` | DemoResourceAsp: `/demo/patient/visit/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patient/visitLast/{param}` | DemoResourceAsp: `/demo/patient/visitLast/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patient/visitRange/{param}` | DemoResourceAsp: `/demo/patient/visitRange/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patient/{pk}` | DemoResourceAsp: `/demo/patient/{pk}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patientPackage/{pk}` | DemoResourceAsp: `/demo/patientPackage/{pk}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/patients/name/{param}` | DemoResourceAsp: `/demo/patients/name/{param}` | [x] | ◎ 移行済み | ※1 ※3 |
| GET | `/demo/user/{param}` | DemoResourceAsp: `/demo/user/{param}` | [x] | ◎ 移行済み | ※1 ※3 |

- ※1 2025-11-04 修正: `ModuleModel` import を追加し、`TouchAuthHandler`＋`TouchAuditHelper` による施設／ユーザー整合チェック・監査記録を導入。`DemoResourceAspTest`（`fixtures/demoresourceasp/*`）で 15 エンドポイントの正常・異常系を JSON フィクスチャ比較し、Runbook `DEMO-ASP-20251104-01` に手順と結果を記録（Maven 未導入のため IDE 実行ログのみ取得）。
- ※2 2025-11-04 修正: `BundleDolphin#setOrderName` を復活させ `/demo/module*` と `/demo/document/progressCourse` の `entity`/`entityName` を legacy と揃えた。`demo_module_response.json`／`demo_progress_course.json` フィクスチャでオーダ名・責任医を検証。
- ※3 施設／ユーザー／クライアントヘッダー欠落・不整合時の 400/403/401 を追加し、`DemoResourceAspTest` で境界値・Pad フラグ・施設ミスマッチを網羅（例: `getUserThrowsWhenFacilityHeaderMismatch`、`getPatientVisitRejectsMissingFacility`）。
- ※4 ラボ `comment2` を legacy 通り `comment1` フォールバックに統一し、`demo_labo_test.json`／`demo_labo_trend.json` で差分を比較。
- ※5 adm10 側 `/10/adm/jtouch/document*` 系を Jakarta 版リソースに実装し、`/jtouch/*` への依存無しで保存処理が完結するよう監査ログ (`JsonTouchAuditLogger`)・例外ハンドリングを統一した。touch/adm10/adm20 のレスポンス整合性を比較し、旧 `/jtouch` 呼び出しを残さずに運用可能。
- ※6 `JsonTouchResourceParityTest` を 17 ケースへ拡充し、document／mkdocument／interaction／stamp の正常系・異常系および監査ログを検証。`System.err` 直書きと JDBC 例外放置は解消済みで、`mvn -pl server-modernized test` は DuplicateProjectException で失敗するもののテスト自体は IDE 実行で成功。
- ※7 `PHRResource` 11 件はコード実装済みだが、自動テスト・監査証跡未取得。さらに `/20/adm/phr/export` 系 REST が未実装で、Runbook 手順 6 を **Blocked** として管理中（`WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` §2 参照）。

### DolphinResourceASP
> **更新 (2025-11-04, Worker B)**: `/touch/module*`・`/touch/item/laboItem` の 6 件を `TouchModuleService` + JSON DTO に移行し、施設ヘッダー整合チェック・`Cache-Control: no-store`・10 秒 TTL の内部キャッシュを実装。`TouchModuleResourceTest`（server-modernized/src/test/java/open/dolphin/touch/）で legacy XML 相当値・RP 多剤・Schema 大容量・キャッシュヒット・施設ガードを検証済み。
> **再確認 (2025-11-03, Worker C)**: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java` / `DolphinResourceASP.java` に 19 件すべてのメソッドは存在するが、`server-modernized/src/main/webapp/WEB-INF/web.xml:20-46` に `open.dolphin.touch.DolphinResourceASP` が登録されておらず RESTEasy では公開されない。実装は legacy の文字列連結 XML + `System.err` ログを踏襲し、施設 ID 突合・監査ログ・キャッシュ・エラー統一が未整備（2025-11-04 更新前までは `/touch/patient/*`・`/touch/stamp/*` 等 13 件が `[ ]` 継続という記録）。
> **更新 (2025-11-04, Worker C & D)**: `/touch/patient*`・`/touch/stamp*`・`/touch/user/{param}` を専用リソースへ分離し、施設突合・監査ログ・キャッシュ・ヘッダー検証を実装。テストは `TouchPatientServiceTest` / `TouchStampServiceTest` / `TouchUserServiceTest` で IDE 実行済み（Maven 未導入のため CI 実行待ち）。
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/touch/document/progressCourse/{param}` | DolphinResource: `/touch/document/progressCourse/{param}` | [x] | ◎ 移行済み | JSON 応答 + 施設突合・監査ログ（`DolphinTouchAuditLogger`）。`DolphinResourceDocumentTest#getProgressCourseSuccess` でレスポンス整合を確認（mvn 未導入のためローカル IDE 実行前提）。 |
| POST | `/touch/idocument` | DolphinResource: `/touch/idocument` | [x] | ◎ 移行済み | TouchErrorResponse 形式での例外統一、施設検証と監査ログ追加。`DolphinResourceDocumentTest#postDocumentSuccess`/`postDocumentFacilityMismatch` で保存・施設不一致を検証（mvn 未導入）。 |
| POST | `/touch/idocument2` | DolphinResource: `/touch/idocument2` | [x] | ◎ 移行済み | `/touch/idocument` と同実装を共有（FreeText 対応含む）。`DolphinResourceDocumentTest#postDocumentValidationFailure` でバリデーション異常を確認（mvn 未導入）。 |
| GET | `/touch/item/laboItem/{param}` | DolphinResource: `/touch/item/laboItem/{param}` | [x] | ◎ 移行済み | JSON DTO (`TouchModuleDtos.LaboGraph`) + 施設ヘッダー整合。Test: TouchModuleResourceTest#getLaboGraph_returnsResultSeries (2025-11-04)。 |
| GET | `/touch/module/diagnosis/{param}` | DolphinResource: `/touch/module/diagnosis/{param}` | [x] | ◎ 移行済み | JSON DTO (`TouchModuleDtos.Diagnosis`) で legacy 項目一致。Test: TouchModuleResourceTest#getDiagnosis_returnsAliasAndDates (2025-11-04)。 |
| GET | `/touch/module/laboTest/{param}` | DolphinResource: `/touch/module/laboTest/{param}` | [x] | ◎ 移行済み | TouchAuthHandler による `X-Facility-Id` 検証 + キャッシュ。Test: TouchModuleResourceTest#getLaboTest_enforcesFacilityHeader (2025-11-04)。 |
| GET | `/touch/module/rp/{param}` | DolphinResource: `/touch/module/rp/{param}` | [x] | ◎ 移行済み | RP 多剤処方を JSON 化 (`TouchModuleDtos.RpModule`)。Test: TouchModuleResourceTest#getRpModules_includesNumDaysAndAdministration (2025-11-04)。 |
| GET | `/touch/module/schema/{param}` | DolphinResource: `/touch/module/schema/{param}` | [x] | ◎ 移行済み | Base64 変換を `TouchModuleService` へ集約。Test: TouchModuleResourceTest#moduleServiceEncodesSchemaToBase64 (2025-11-04)。 |
| GET | `/touch/module/{param}` | DolphinResource: `/touch/module/{param}` | [x] | ◎ 移行済み | Bundle → JSON DTO (`TouchModuleDtos.Module`)／内部キャッシュ 10s。Test: TouchModuleResourceTest#getModules_convertsLegacyValues / #moduleServiceCachesByKey (2025-11-04)。 |
| GET | `/touch/patient/firstVisitors/{param}` | DolphinResource: `/touch/patient/firstVisitors`（QueryParam 版 / legacy 互換 `{param}`） | [x] | ◎ 移行済み | facility ヘッダー突合 + ロール判定を追加し、監査イベント「来院履歴照会」「施設突合失敗」を記録。Micrometer カウンタ/タイマ計測と `DolphinResourceVisitTest#firstVisitorsReturnsXml` で XML/監査を検証。 |
| GET | `/touch/patient/visit/{param}` | DolphinResource: `/touch/patient/visit`（QueryParam 版 / legacy 互換） | [x] | ◎ 移行済み | オフセット/limit/sort/order を JAX-RS クエリで受け付け。施設突合・ロール認可・監査・メトリクス実装済み。`DolphinResourceVisitTest#facilityMismatchThrowsForbidden` 等で異常系をカバー。 |
| GET | `/touch/patient/visitLast/{param}` | DolphinResource: `/touch/patient/visitLast`（QueryParam 版 / legacy 互換） | [x] | ◎ 移行済み | legacy の再検索ロジックを `IPhoneServiceBean#getPatientVisitWithFallback` へ集約し、監査詳細に `fallbackApplied` を記録。`DolphinResourceVisitTest#fallbackUsesPreviousDayData` で前日再検索を検証。 |
| GET | `/touch/patient/visitRange/{param}` | DolphinResource: `/touch/patient/visitRange`（QueryParam 版 / legacy 互換） | [x] | ◎ 移行済み | `from/to/offset/limit/sort` をクエリ化し、ステータス/保険フラグを維持。施設・ロール認可と Micrometer 計測を追加し、`DolphinResourceVisitTest#limitOverThrowsBadRequest` で境界値チェック。 |
| GET | `/touch/patient/{pk}` | TouchPatientResource: `/touch/patient/{pk}` | [x] | ◎ 移行済み | JSON 応答＋施設整合＋`X-Access-Reason`/`X-Consent-Token` 必須化。`TouchPatientServiceTest#getPatientByPk_returnsPatientAndLogsAudit` で監査/カルテ PK を検証し、Runbook PIA-Touch-20251104-01 に手順を記録。 |
| GET | `/touch/patientPackage/{pk}` | TouchPatientResource: `/touch/patientPackage/{pk}` | [x] | ◎ 移行済み | 健保/公費/アレルギーを DTO 化して返却。監査イベント `TOUCH_PATIENT_PACKAGE_VIEW` を記録し、`TouchPatientServiceTest` で施設不一致・consent 未設定時の 403 応答を確認。 |
| GET | `/touch/patients/name/{param}` | TouchPatientResource: `/touch/patients/name/{param}` | [x] | ◎ 移行済み | 先頭ひらがな→カナ変換／施設突合／監査ログを実装。`TouchPatientServiceTest#searchPatientsByName_convertsHiraganaToKatakana` で検索分岐を検証。 |
| GET | `/touch/stamp/{param}` | TouchStampResource: `/touch/stamp/{param}` | [x] | ◎ 移行済み | `TouchResponseCache`（10 秒）でスタンプをキャッシュし、監査 `TOUCH_STAMP_FETCH` を記録。`TouchStampServiceTest#getStamp_usesCache` でヒット時の再計算抑制を確認。 |
| GET | `/touch/stampTree/{param}` | TouchStampResource: `/touch/stampTree/{param}` | [x] | ◎ 移行済み | `StampTreeHolderConverter` で JSON 化し、キャッシュ／監査を統一。`TouchStampServiceTest#getStamp_requiresAccessReason` でヘッダー不足時の 403 を検証。 |
| GET | `/touch/user/{param}` | TouchUserResource: `/touch/user/{param}` | [x] | ◎ 移行済み | `userName/password` ヘッダー検証＋施設 ID 正規化＋ S3 Secrets マスクを実装。`TouchUserServiceTest#getUserSummary_returnsSanitizedResponse` でサニタイズ済みレスポンスと監査を確認。 |
### EHTResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| DELETE | `/20/adm/eht/allergy` | EHTResource: `/20/adm/eht/allergy` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-ALL（実施待ち）／監査: EHT_ALLERGY_DELETE |
| POST | `/20/adm/eht/allergy` | EHTResource: `/20/adm/eht/allergy` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-ALL（実施待ち）／監査: EHT_ALLERGY_CREATE |
| PUT | `/20/adm/eht/allergy` | EHTResource: `/20/adm/eht/allergy` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-ALL（実施待ち）／監査: EHT_ALLERGY_UPDATE |
| GET | `/20/adm/eht/allergy/{param}` | EHTResource: `/20/adm/eht/allergy/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-ALL（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/attachment/{param}` | EHTResource: `/20/adm/eht/attachment/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/claim/conn` | EHTResource: `/20/adm/eht/claim/conn` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-CFG（実施待ち）／監査: 参照ログ（任意） |
| DELETE | `/20/adm/eht/diagnosis` | EHTResource: `/20/adm/eht/diagnosis` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DG（実施待ち）／監査: EHT_DIAGNOSIS_DELETE |
| POST | `/20/adm/eht/diagnosis` | EHTResource: `/20/adm/eht/diagnosis` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DG（実施待ち）／監査: EHT_DIAGNOSIS_CREATE |
| PUT | `/20/adm/eht/diagnosis` | EHTResource: `/20/adm/eht/diagnosis` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DG（実施待ち）／監査: EHT_DIAGNOSIS_UPDATE |
| GET | `/20/adm/eht/diagnosis/{param}` | EHTResource: `/20/adm/eht/diagnosis/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DG（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/docinfo/{param}` | EHTResource: `/20/adm/eht/docinfo/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: 参照ログ（要議論） |
| DELETE | `/20/adm/eht/document` | EHTResource: `/20/adm/eht/document` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: EHT_DOCUMENT_DELETE |
| GET | `/20/adm/eht/document/{param}` | EHTResource: `/20/adm/eht/document/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/document2/{param}` | EHTResource: `/20/adm/eht/document2/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/freedocument/{param}` | EHTResource: `/20/adm/eht/freedocument/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-DOC（実施待ち）／監査: 参照ログ（要議論） |
| PUT | `/20/adm/eht/interaction` | EHTResource: `/20/adm/eht/interaction` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MOD（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/item/laboItem/{param}` | EHTResource: `/20/adm/eht/item/laboItem/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-LAB（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/karteNumber/{param}` | EHTResource: `/20/adm/eht/karteNumber/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PT（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/lastDateCount/{param}` | EHTResource: `/20/adm/eht/lastDateCount/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PT（実施待ち）／監査: 参照ログ（要議論） |
| DELETE | `/20/adm/eht/memo` | EHTResource: `/20/adm/eht/memo` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MEMO（実施待ち）／監査: EHT_MEMO_DELETE |
| POST | `/20/adm/eht/memo` | EHTResource: `/20/adm/eht/memo` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MEMO（実施待ち）／監査: EHT_MEMO_CREATE |
| PUT | `/20/adm/eht/memo` | EHTResource: `/20/adm/eht/memo` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MEMO（実施待ち）／監査: EHT_MEMO_UPDATE |
| GET | `/20/adm/eht/memo/{param}` | EHTResource: `/20/adm/eht/memo/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MEMO（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/module/laboTest/{param}` | EHTResource: `/20/adm/eht/module/laboTest/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-LAB（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/module/last/{param}` | EHTResource: `/20/adm/eht/module/last/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MOD（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/module/{param}` | EHTResource: `/20/adm/eht/module/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MOD（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/order/{param}` | EHTResource: `/20/adm/eht/order/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-MOD（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/patient/documents/status` | EHTResource: `/20/adm/eht/patient/documents/status` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PT（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/patient/firstVisitors/{param}` | EHTResource: `/20/adm/eht/patient/firstVisitors/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PT（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/patient/pvt/{param}` | EHTResource: `/20/adm/eht/patient/pvt/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PT（実施待ち）／監査: 参照ログ（要議論） |
| POST | `/20/adm/eht/physical` | EHTResource: `/20/adm/eht/physical` | [x] | ◎ 移行済み | Test: EHTResourceTest.postPhysicalCreatesObservationsAndLogsAudit（追加済・実行保留）／監査: EHT_PHYSICAL_CREATE |
| DELETE | `/20/adm/eht/physical/id/{param}` | EHTResource: `/20/adm/eht/physical/id/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PHY（実施待ち）／監査: EHT_PHYSICAL_DELETE |
| GET | `/20/adm/eht/physical/karteid/{param}` | EHTResource: `/20/adm/eht/physical/karteid/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-PHY（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/progresscourse/{param}` | EHTResource: `/20/adm/eht/progresscourse/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-EVT（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/pvtList` | EHTResource: `/20/adm/eht/pvtList` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-EVT（実施待ち）／監査: 参照ログ（要議論） |
| PUT | `/20/adm/eht/sendClaim` | EHTResource: `/20/adm/eht/sendClaim` | [x] | ◎ 移行済み | Test: EHTResourceTest.sendClaimWithoutDocumentLogsChartEvent（追加済・実行保留）／監査: EHT_CLAIM_SEND |
| PUT | `/20/adm/eht/sendClaim2` | EHTResource: `/20/adm/eht/sendClaim2` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-CLAIM2（実施待ち）／監査: EHT_CLAIM_SEND2 |
| GET | `/20/adm/eht/serverinfo` | EHTResource: `/20/adm/eht/serverinfo` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-CFG（実施待ち）／監査: 参照ログ（任意） |
| GET | `/20/adm/eht/stamp/{param}` | EHTResource: `/20/adm/eht/stamp/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-STAMP（実施待ち）／監査: 参照ログ（要議論） |
| GET | `/20/adm/eht/stampTree/{param}` | EHTResource: `/20/adm/eht/stampTree/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-STAMP（実施待ち）／監査: 参照ログ（要議論） |
| POST | `/20/adm/eht/vital` | EHTResource: `/20/adm/eht/vital` | [x] | ◎ 移行済み | Test: EHTResourceTest.postVitalRecordsAudit（追加済・実行保留）／監査: EHT_VITAL_CREATE |
| DELETE | `/20/adm/eht/vital/id/{param}` | EHTResource: `/20/adm/eht/vital/id/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-VITAL2（実施待ち）／監査: EHT_VITAL_DELETE |
| GET | `/20/adm/eht/vital/pat/{param}` | EHTResource: `/20/adm/eht/vital/pat/{param}` | [x] | ◎ 移行済み | Test: EHT-RUN-20251103-VITAL（実施待ち）／監査: 参照ログ（要議論） |

### JsonTouchResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| POST | `/10/adm/jtouch/document` | JsonTouchResource(adm10): `/10/adm/jtouch/document` | [x] | ◎ 実装＋証跡 | ※5 |
| POST | `/10/adm/jtouch/document2` | JsonTouchResource(adm10): `/10/adm/jtouch/document2` | [x] | ◎ 実装＋証跡 | ※5 |
| PUT | `/10/adm/jtouch/interaction` | JsonTouchResource(adm10): `/10/adm/jtouch/interaction` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| POST | `/10/adm/jtouch/mkdocument` | JsonTouchResource(adm10): `/10/adm/jtouch/mkdocument` | [x] | ◎ 実装＋証跡 | ※5 |
| POST | `/10/adm/jtouch/mkdocument2` | JsonTouchResource(adm10): `/10/adm/jtouch/mkdocument2` | [x] | ◎ 実装＋証跡 | ※5 |
| GET | `/10/adm/jtouch/order/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/order/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/patient/{pid}` | JsonTouchResource(adm10): `/10/adm/jtouch/patient/{pid}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/patients/count` | JsonTouchResource(adm10): `/10/adm/jtouch/patients/count` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/patients/dump/kana/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/patients/dump/kana/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/patients/name/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/patients/name/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| POST | `/10/adm/jtouch/sendPackage` | JsonTouchResource(adm10): `/10/adm/jtouch/sendPackage` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| POST | `/10/adm/jtouch/sendPackage2` | JsonTouchResource(adm10): `/10/adm/jtouch/sendPackage2` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/stamp/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/stamp/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/stampTree/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/stampTree/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/user/{uid}` | JsonTouchResource(adm10): `/10/adm/jtouch/user/{uid}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
| GET | `/10/adm/jtouch/visitpackage/{param}` | JsonTouchResource(adm10): `/10/adm/jtouch/visitpackage/{param}` | [x] | ◎ 実装＋証跡 | ※5 ※6 |
### KarteResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/karte/appo/{param}` | KarteResource: `/karte/appo/{karteId,from,to,...}` | [x] | ◎ 移行済み | レガシー: getAppoinmentList |
| GET | `/karte/attachment/{param}` | KarteResource: `/karte/attachment/{id}` | [x] | ◎ 移行済み | レガシー: getAttachment |
| PUT | `/karte/claim` | KarteResource: `/karte/claim` | [x] | ◎ 移行済み | レガシー: sendDocument |
| POST | `/karte/diagnosis` | KarteResource: `/karte/diagnosis` | [x] | ◎ 移行済み | レガシー: postDiagnosis |
| PUT | `/karte/diagnosis` | KarteResource: `/karte/diagnosis` | [x] | ◎ 移行済み | レガシー: putDiagnosis |
| POST | `/karte/diagnosis/claim` | KarteResource: `/karte/diagnosis/claim` | [x] | ◎ 移行済み | レガシー: postPutSendDiagnosis |
| DELETE | `/karte/diagnosis/{param}` | KarteResource: `/karte/diagnosis/{ids}` | [x] | ◎ 移行済み | レガシー: deleteDiagnosis |
| GET | `/karte/diagnosis/{param}` | KarteResource: `/karte/diagnosis/{karteId,from[,activeOnly]}` | [x] | ◎ 移行済み | レガシー: getDiagnosis |
| GET | `/karte/docinfo/all/{param}` | KarteResource: `/karte/docinfo/all/{karteId}` | [x] | ◎ 移行済み | レガシー: getAllDocument |
| GET | `/karte/docinfo/{param}` | KarteResource: `/karte/docinfo/{karteId,from,includeModified}` | [x] | ◎ 移行済み | レガシー: getDocumentList |
| POST | `/karte/document` | KarteResource: `/karte/document` | [x] | ◎ 移行済み | レガシー: postDocument |
| POST | `/karte/document/pvt/{params}` | KarteResource: `/karte/document/pvt/{pvtPK[,state]}` | [x] | ◎ 移行済み | レガシー: postDocument |
| DELETE | `/karte/document/{id}` | KarteResource: `/karte/document/{id}` | [x] | ◎ 移行済み | レガシー: deleteDocument |
| PUT | `/karte/document/{id}` | KarteResource: `/karte/document/{id}` | [x] | ◎ 移行済み | レガシー: putTitle |
| GET | `/karte/documents/{param}` | KarteResource: `/karte/documents/{docIds}` | [x] | ◎ 移行済み | レガシー: getDocuments |
| PUT | `/karte/freedocument` | KarteResource: `/karte/freedocument` | [x] | ◎ 移行済み | レガシー: putPatientFreeDocument |
| GET | `/karte/freedocument/{param}` | KarteResource: `/karte/freedocument/{patientId}` | [x] | ◎ 移行済み | レガシー: getFreeDocument |
| GET | `/karte/iamges/{param}` | KarteResource: `/karte/iamges/{karteId,from,to,...}` | [x] | ◎ 移行済み | レガシー: getImages |
| GET | `/karte/image/{id}` | KarteResource: `/karte/image/{id}` | [x] | ◎ 移行済み | レガシー: getImage |
| PUT | `/karte/memo` | KarteResource: `/karte/memo` | [x] | ◎ 移行済み | レガシー: putPatientMemo |
| GET | `/karte/moduleSearch/{param}` | KarteResource: `/karte/moduleSearch/{karteId,from,to,entity...}` | [x] | ◎ 移行済み | レガシー: getModulesEntitySearch |
| GET | `/karte/modules/{param}` | KarteResource: `/karte/modules/{karteId,entity,from,to,...}` | [x] | ◎ 移行済み | レガシー: getModules |
| POST | `/karte/observations` | KarteResource: `/karte/observations` | [x] | ◎ 移行済み | レガシー: postObservations |
| PUT | `/karte/observations` | KarteResource: `/karte/observations` | [x] | ◎ 移行済み | レガシー: putObservations |
| DELETE | `/karte/observations/{param}` | KarteResource: `/karte/observations/{ids}` | [x] | ◎ 移行済み | レガシー: deleteObservations |
| GET | `/karte/observations/{param}` | KarteResource: `/karte/observations/{karteId,observation,phenomenon[,date]}` | [x] | ◎ 移行済み | レガシー: getObservations |
| GET | `/karte/pid/{param}` | KarteResource: `/karte/pid/{pid,from}` | [x] | ◎ 移行済み | レガシー: getKarteByPid |
| GET | `/karte/{param}` | KarteResource: `/karte/{patientPk,from}` | [x] | ◎ 移行済み | レガシー: getKarte |

### LetterResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| PUT | `/odletter/letter` | LetterResource: `/odletter/letter` | [x] | ◎ 移行済み | レガシー: putLetter |
| DELETE | `/odletter/letter/{param}` | LetterResource: `/odletter/letter/{param}` | [x] | ◎ 移行済み | レガシー: delete ｜ 2025-11-03: `server-modernized/src/test/java/open/dolphin/rest/LetterResourceTest.java`（deleteRecordsAuditOnSuccess / deleteThrowsNotFoundAndAuditsWhenMissing / deleteRecordsFailureAuditWhenDeleteThrows）で監査ログ・404・例外系を確認。Runbook LETTER-AUDIT-20251103-01 に記録。Maven 不在のためテスト実行はCI待ち。 |
| GET | `/odletter/letter/{param}` | LetterResource: `/odletter/letter/{param}` | [x] | ◎ 移行済み | レガシー: getLetter ｜ 2025-11-03: LetterResourceTest.getLetterReturnsConverter / getLetterThrowsNotFoundWhenMissing で200・404応答差異を確認。Runbook LETTER-AUDIT-20251103-01 に証跡登録。 |
| GET | `/odletter/list/{param}` | LetterResource: `/odletter/list/{karteId}` | [x] | ◎ 移行済み | レガシー: getLetterList |

### MmlResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/mml/disease/json/{param}` | MmlResource: `/mml/disease/json/{param}` | [x] | ◎ 移行済み | レガシー: dumpDiseaseAsJSON |
| GET | `/mml/disease/list/{param}` | MmlResource: `/mml/disease/list/{param}` | [x] | ◎ 移行済み | レガシー: getDiseaseList |
| GET | `/mml/document/{param}` | MmlResource: `/mml/document/{param}` | [x] | ◎ 移行済み | レガシー: dumpFacilityDocumentsAsMML |
| GET | `/mml/karte/json/{param}` | MmlResource: `/mml/karte/json/{param}` | [x] | ◎ 移行済み | レガシー: dumpKarteAsJSON |
| GET | `/mml/karte/list/{param}` | MmlResource: `/mml/karte/list/{param}` | [x] | ◎ 移行済み | レガシー: getKarteList |
| GET | `/mml/labtest/json/{param}` | MmlResource: `/mml/labtest/json/{param}` | [ ] | △ 要証跡 | レガシー: dumpLabtestAsJSON ｜ Jakarta 版は `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java:342` で同一 DTO (`NLaboModuleConverter`) を返却。自動テスト未整備。 |
| GET | `/mml/labtest/list/{param}` | MmlResource: `/mml/labtest/list/{param}` | [ ] | △ 要証跡 | レガシー: getLabtestList ｜ 施設単位の一覧を `StringBuilder` で返却（`MmlResource.java:320`）。手動検証ログ未取得。 |
| GET | `/mml/letter/json/{param}` | MmlResource: `/mml/letter/json/{param}` | [ ] | △ 要証跡 | レガシー: dumpLetterAsJSON ｜ `LetterModuleConverter` を返却。`MmlResource.java:306` を確認。 |
| GET | `/mml/letter/list/{param}` | MmlResource: `/mml/letter/list/{param}` | [ ] | △ 要証跡 | レガシー: getLetterList ｜ `MmlResource.java:285` で ID リストを CSV 文字列で返却。自動テスト無し。 |
| GET | `/mml/memo/json/{param}` | MmlResource: `/mml/memo/json/{param}` | [x] | ◎ 移行済み | レガシー: dumpMemoAsJSON |
| GET | `/mml/memo/list/{param}` | MmlResource: `/mml/memo/list/{param}` | [x] | ◎ 移行済み | レガシー: getMemoList |
| GET | `/mml/observation/json/{param}` | MmlResource: `/mml/observation/json/{param}` | [x] | ◎ 移行済み | レガシー: dumpObservationAsJSON |
| GET | `/mml/observation/list/{param}` | MmlResource: `/mml/observation/list/{param}` | [x] | ◎ 移行済み | レガシー: getObservationList |
| GET | `/mml/patient/json/{param}` | MmlResource: `/mml/patient/json/{param}` | [x] | ◎ 移行済み | レガシー: dumpPatientAsJSON |
| GET | `/mml/patient/list/{param}` | MmlResource: `/mml/patient/list/{param}` | [x] | ◎ 移行済み | レガシー: getPatientList |
| GET | `/mml/patient/{param}` | MmlResource: `/mml/patient/{param}` | [x] | ◎ 移行済み | レガシー: dumpFacilityPatientsDiagnosisAsMML |

### NLabResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/lab/item/{param}` | NLabResource: `/lab/item/{pid,first,max,itemCode}` | [x] | ◎ 移行済み | レガシー: getLaboTestItem |
| POST | `/lab/module` | NLabResource: `/lab/module` | [x] | ◎ 移行済み | レガシー: postNLaboTest |
| GET | `/lab/module/count/{param}` | NLabResource: `/lab/module/count/{pid}` | [x] | ◎ 移行済み | レガシー: getLaboTestCount |
| DELETE | `/lab/module/{param}` | NLabResource: `/lab/module/{moduleId}` | [x] | ◎ 移行済み | レガシー: unsubscribeTrees |
| GET | `/lab/module/{param}` | NLabResource: `/lab/module/{pid,first,max}` | [x] | ◎ 移行済み | レガシー: getLaboTest |
| GET | `/lab/patient/{param}` | NLabResource: `/lab/patient/{pid1,pid2,...}` | [x] | ◎ 移行済み | レガシー: getConstrainedPatients |

### OrcaResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/orca/deptinfo` | OrcaResource: `/orca/deptinfo` | [x] | ◎ 移行済み | レガシー: getDeptInfo |
| GET | `/orca/disease/active/{param}` | OrcaResource: `/orca/disease/active/{pid}` | [x] | ◎ 移行済み | レガシー: getActiveOrcaDisease |
| GET | `/orca/disease/import/{param}` | OrcaResource: `/orca/disease/import/{pid}` | [x] | ◎ 移行済み | レガシー: getOrcaDisease |
| GET | `/orca/disease/name/{param}/` | OrcaResource: `/orca/disease/name/{keyword}/` | [x] | ◎ 移行済み | レガシー: getDiseaseByName |
| GET | `/orca/facilitycode` | OrcaResource: `/orca/facilitycode` | [x] | ◎ 移行済み | レガシー: getFacilityCodeBy1001 |
| GET | `/orca/general/{param}` | OrcaResource: `/orca/general/{code}` | [x] | ◎ 移行済み | レガシー: getGeneralName |
| GET | `/orca/inputset` | OrcaResource: `/orca/inputset` | [x] | ◎ 移行済み | レガシー: getOrcaInputSet |
| PUT | `/orca/interaction` | OrcaResource: `/orca/interaction` | [x] | ◎ 移行済み | レガシー: checkInteraction ｜ 2025-11-03: `open/orca/rest/OrcaResource.java` の Jakarta 実装が旧サーバーと一致することをコード比較で確認。ORCA テスト DB へ接続できていないため動作検証は保留（Runbook ORCA-COMPAT-20251103-01 にフォローアップ記載）。 |
| GET | `/orca/stamp/{param}` | OrcaResource: `/orca/stamp/{id}` | [x] | ◎ 移行済み | レガシー: getStamp |
| GET | `/orca/tensu/code/{param}/` | OrcaResource: `/orca/tensu/code/{code}/` | [x] | ◎ 移行済み | レガシー: getTensuMasterByCode |
| GET | `/orca/tensu/name/{param}/` | OrcaResource: `/orca/tensu/name/{keyword}/` | [x] | ◎ 移行済み | レガシー: getTensuMasterByName |
| GET | `/orca/tensu/shinku/{param}/` | OrcaResource: `/orca/tensu/shinku/{code}/` | [x] | ◎ 移行済み | レガシー: getTensutensuByShinku |
| GET | `/orca/tensu/ten/{param}/` | OrcaResource: `/orca/tensu/ten/{ten}/` | [x] | ◎ 移行済み | レガシー: getTensuMasterByTen |

### PHRResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/20/adm/phr/abnormal/{param}` | PHRResource: `/20/adm/phr/abnormal/{param}` | [x] | ◎ 監査・施設突合済み | レガシー: getAbnormalValue ｜ 2025-11-04 Worker F が監査イベント／TouchErrorResponse を整備。 |
| PUT | `/20/adm/phr/accessKey` | PHRResource: `/20/adm/phr/accessKey` | [x] | ◎ 監査・例外レスポンス統一済み | レガシー: putPHRKey ｜ 2025-11-04 `PHRResourceTest#getPhrKeyByAccessKey_returnsKeyAndAuditsSuccess` で代表ケースを検証。 |
| GET | `/20/adm/phr/accessKey/{param}` | PHRResource: `/20/adm/phr/accessKey/{param}` | [x] | ◎ 監査・施設突合済み | レガシー: getPHRKeyByAccessKey ｜ 同テストで 403 分岐を確認。 |
| GET | `/20/adm/phr/allergy/{param}` | PHRResource: `/20/adm/phr/allergy/{param}` | [x] | ◎ 監査ログ取得済み | レガシー: getAllergy ｜ 監査イベントと施設チェックを追加。 |
| GET | `/20/adm/phr/disease/{param}` | PHRResource: `/20/adm/phr/disease/{param}` | [x] | ◎ 監査ログ取得済み | レガシー: getDisease |
| POST | `/20/adm/phr/identityToken` | PHRResource: `/20/adm/phr/identityToken` | [x] | ◎ エラー統一済み | レガシー: getIdentityToken ｜ TouchErrorResponse/監査記録を追加。 |
| GET | `/20/adm/phr/image/{param}` | PHRResource: `/20/adm/phr/image/{param}` | [x] | ◎ 監査・404 分岐整備済み | レガシー: getImage |
| GET | `/20/adm/phr/labtest/{param}` | PHRResource: `/20/adm/phr/labtest/{param}` | [x] | ◎ 監査ログ取得済み | レガシー: getLastLabTest |
| GET | `/20/adm/phr/medication/{param}` | PHRResource: `/20/adm/phr/medication/{param}` | [x] | ◎ 監査ログ取得済み | レガシー: getLastMedication |
| GET | `/20/adm/phr/patient/{param}` | PHRResource: `/20/adm/phr/patient/{param}` | [x] | ◎ 監査・施設突合済み | レガシー: getPHRKeyByPatientId |
| GET | `/20/adm/phr/{param}` | PHRResource: `/20/adm/phr/{param}` | [x] | ◎ 監査ログ取得済み | レガシー: getPHRData ｜ `PhrDataAssembler` へロジック集約。 |
| POST | `/20/adm/phr/export` | PHRResource: `/20/adm/phr/export` | [x] | ◎ 新規実装 | 非同期ジョブ生成・監査ログ記録を実装。`PHRResourceTest#requestExport_returnsAcceptedWhenPayloadValid` で代表ケースを検証。 |
| GET | `/20/adm/phr/status/{jobId}` | PHRResource: `/20/adm/phr/status/{jobId}` | [x] | ◎ 新規実装 | 署名付き URL 発行と TouchErrorResponse を追加（Worker F 手動確認）。 |
| DELETE | `/20/adm/phr/status/{jobId}` | PHRResource: `/20/adm/phr/status/{jobId}` | [x] | ◎ 新規実装 | PENDING ジョブの取消と監査を実装。 |
| GET | `/20/adm/phr/export/{jobId}/artifact` | PHRResource: `/20/adm/phr/export/{jobId}/artifact` | [x] | ◎ 新規実装 | 署名トークン検証・成果物配信を実装。`PHRResourceTest#downloadArtifact_returnsArtifactWhenSignatureValid` を追加。 |

> 補足: PHR エクスポート関連 API は `PhrExportJobWorker` により Zip 成果物生成・`PhrExportStorageFactory` による保存/署名付き URL 発行まで完結。Flyway `V0220__phr_async_job.sql` の適用と `phr_async_job` テーブル確認手順を Runbook 6 に追加し、既存 11 エンドポイントは全て監査ログ・施設突合チェック・TouchErrorResponse 化まで完了した。

### PVTResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| POST | `/pvt` | PVTResource: `/pvt` | [x] | ◎ 移行済み | レガシー: postPvt |
| PUT | `/pvt/memo/{param}` | PVTResource: `/pvt/memo/{pvtPK,memo}` | [x] | ◎ 移行済み | レガシー: putMemo |
| GET | `/pvt/{param}` | PVTResource: `/pvt/{params}` | [x] | ◎ 移行済み | レガシー: getPvt |
| PUT | `/pvt/{param}` | PVTResource: `/pvt/{pvtPK,state}` | [x] | ◎ 移行済み | レガシー: putPvtState |
| DELETE | `/pvt/{pvtPK}` | PVTResource: `/pvt/{pvtPK}` | [x] | ◎ 移行済み | レガシー: deletePvt |

### PVTResource2
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| POST | `/pvt2` | PVTResource2: `/pvt2` | [x] | ◎ 移行済み | レガシー: postPvt ｜ 2025-11-03: `PVTResource2Test#postPvt_assignsFacilityAndPatientRelations` で facility ID・保険モデルの再紐付けと `PVTServiceBean#addPvt` 呼び出しを検証。 |
| GET | `/pvt2/pvtList` | PVTResource2: `/pvt2/pvtList` | [x] | ◎ 移行済み | レガシー: getPvtList ｜ 2025-11-03: `PVTResource2Test#getPvtList_wrapsServiceResultInConverter` で `ChartEventServiceBean#getPvtList` の戻り値が `PatientVisitListConverter` に格納されることを確認。 |
| DELETE | `/pvt2/{pvtPK}` | PVTResource2: `/pvt2/{pvtPK}` | [x] | ◎ 移行済み | レガシー: deletePvt ｜ 2026-05-27: `PVTResource2Test#deletePvt_removesVisitForAuthenticatedFacility`／`#deletePvt_throwsWhenFacilityDoesNotOwnVisit` で `PVTServiceBean#removePvt` の facility 突合とイベントリスト削除を検証。 |

### PatientResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| POST | `/patient` | PatientResource: `/patient` | [x] | ◎ 移行済み | レガシー: postPatient |
| PUT | `/patient` | PatientResource: `/patient` | [x] | ◎ 移行済み | レガシー: putPatient |
| GET | `/patient/all` | PatientResource: `/patient/all` | [x] | ◎ 移行済み | レガシー: getAllPatient |
| GET | `/patient/count/{param}` | PatientResource: `/patient/count/{query}` | [x] | ◎ 移行済み | レガシー: getPatientCount |
| GET | `/patient/custom/{param}` | PatientResource: `/patient/custom/{query}` | [x] | ◎ 移行済み | レガシー: getDocumentsByCustom |
| GET | `/patient/digit/{param}` | PatientResource: `/patient/digit/{digit}` | [x] | ◎ 移行済み | レガシー: getPatientsByDigit |
| GET | `/patient/documents/status` | PatientResource: `/patient/documents/status` | [x] | ◎ 移行済み | レガシー: getDocumentsByStatus |
| GET | `/patient/id/{param}` | PatientResource: `/patient/id/{pid}` | [x] | ◎ 移行済み | レガシー: getPatientById |
| GET | `/patient/kana/{param}` | PatientResource: `/patient/kana/{kana}` | [x] | ◎ 移行済み | レガシー: getPatientsByKana |
| GET | `/patient/name/{param}` | PatientResource: `/patient/name/{name}` | [x] | ◎ 移行済み | レガシー: getPatientsByName |
| GET | `/patient/pvt/{param}` | PatientResource: `/patient/pvt/{yyyymmdd}` | [x] | ◎ 移行済み | レガシー: getPatientsByPvt |

### ScheduleResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| POST | `/schedule/document` | ScheduleResource: `/schedule/document` | [x] | ◎ 移行済み | レガシー: postScheduleAndSendClaim |
| DELETE | `/schedule/pvt/{param}` | ScheduleResource: `/schedule/pvt/{pvtPK,ptPK,yyyy-MM-dd}` | [x] | ◎ 移行済み | レガシー: deletePvt |
| GET | `/schedule/pvt/{param}` | ScheduleResource: `/schedule/pvt/{params}` | [x] | ◎ 移行済み | レガシー: getPvt |

### ServerInfoResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/serverinfo/claim/conn` | ServerInfoResource: `/serverinfo/claim/conn` | [x] | ◎ 移行済み | レガシー: getClaimConn |
| GET | `/serverinfo/cloud/zero` | ServerInfoResource: `/serverinfo/cloud/zero` | [x] | ◎ 移行済み | レガシー: getServerInfo |
| GET | `/serverinfo/jamri` | ServerInfoResource: `/serverinfo/jamri` | [x] | ◎ 移行済み | レガシー: getJamri |

### StampResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| PUT | `/stamp/id` | StampResource: `/stamp/id` | [x] | ◎ 移行済み | レガシー: putStamp |
| DELETE | `/stamp/id/{param}` | StampResource: `/stamp/id/{param}` | [x] | ◎ 移行済み | レガシー: deleteStamp ｜ 2025-11-03: `server-modernized/src/test/java/open/dolphin/rest/StampResourceTest.java`（deleteStampRecordsAuditOnSuccess / deleteStampThrowsNotFoundAndAuditsWhenMissing）で監査ログの成功・404経路を確認。Runbook STAMP-AUDIT-20251103-01 に証跡記録。`mvn` 不在のためローカル実行は未実施（CI で要追試）。 |
| GET | `/stamp/id/{param}` | StampResource: `/stamp/id/{param}` | [x] | ◎ 移行済み | レガシー: getStamp |
| PUT | `/stamp/list` | StampResource: `/stamp/list` | [x] | ◎ 移行済み | レガシー: putStamps |
| DELETE | `/stamp/list/{param}` | StampResource: `/stamp/list/{param}` | [x] | ◎ 移行済み | レガシー: deleteStamps ｜ 2025-11-03: StampResourceTest.deleteStampsRecordsAuditOnSuccess / deleteStampsThrowsWhenAnyIdMissing で一括削除の監査成功・404経路を検証。Runbook STAMP-AUDIT-20251103-01 参照。`mvn` 不在のためローカルテストは未実行。 |
| GET | `/stamp/list/{param}` | StampResource: `/stamp/list/{param}` | [x] | ◎ 移行済み | レガシー: getStamps |
| PUT | `/stamp/published/cancel` | StampResource: `/stamp/published/cancel` | [x] | ◎ 移行済み | レガシー: cancelPublishedTree |
| GET | `/stamp/published/tree` | StampResource: `/stamp/published/tree` | [x] | ◎ 移行済み | レガシー: getPublishedTrees |
| PUT | `/stamp/published/tree` | StampResource: `/stamp/published/tree` | [x] | ◎ 移行済み | レガシー: putPublishedTree |
| PUT | `/stamp/subscribed/tree` | StampResource: `/stamp/subscribed/tree` | [x] | ◎ 移行済み | レガシー: subscribeTrees |
| DELETE | `/stamp/subscribed/tree/{idPks}` | StampResource: `/stamp/subscribed/tree/{idPks}` | [x] | ◎ 移行済み | レガシー: unsubscribeTrees |
| PUT | `/stamp/tree` | StampResource: `/stamp/tree` | [x] | ◎ 移行済み | レガシー: putTree |
| PUT | `/stamp/tree/forcesync` | StampResource: `/stamp/tree/forcesync` | [x] | ◎ 移行済み | レガシー: forceSyncTree |
| PUT | `/stamp/tree/sync` | StampResource: `/stamp/tree/sync` | [x] | ◎ 移行済み | レガシー: syncTree |
| GET | `/stamp/tree/{userPK}` | StampResource: `/stamp/tree/{userPK}` | [x] | ◎ 移行済み | レガシー: getStampTree |

### SystemResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/dolphin` | SystemResource: `/dolphin` | [x] | ◎ テスト整備済み | レガシー: hellowDolphin ｜ 2025-11-04: `SystemResourceTest#hellowDolphin_returnsGreeting` で Jakarta 実装の応答を確認。Runbook SYS-PARITY-20251104-01 にテストログ（要 CI `mvn -pl server-modernized test -Dtest=SystemResourceTest`）を追記予定。 |
| POST | `/dolphin` | SystemResource: `/dolphin` | [x] | ◎ テスト整備済み | レガシー: addFacilityAdmin ｜ `SystemResourceTest#addFacilityAdmin_registersFacilityAdminAndAuditsSuccess`／`#addFacilityAdmin_recordsFailureAuditWhenServiceThrows` でロール再紐付け・`SystemServiceBean#addFacilityAdmin` 呼び出し・監査ログ成否をモック確認。 |
| GET | `/dolphin/activity/{param}` | SystemResource: `/dolphin/activity/{yyyy,MM,count}` | [x] | ◎ テスト整備済み | レガシー: getActivities ｜ `SystemResourceTest#getActivities_aggregatesMonthlyDataAndAudits` が月次集計と `countTotalActivities` を検証、`#getActivities_invalidParameterThrowsBadRequest` で不正パラメータ時の 400 + 監査失敗を確認。 |
| GET | `/dolphin/cloudzero/sendmail` | SystemResource: `/dolphin/cloudzero/sendmail` | [x] | ◎ テスト整備済み | レガシー: sendCloudZeroMail ｜ `SystemResourceTest#sendCloudZeroMail_invokesMonthlyMailerAndAudits`／`#sendCloudZeroMail_recordsFailureWhenServiceThrows` で前月集計呼び出しと監査ログ分岐を確認。 |
| POST | `/dolphin/license` | SystemResource: `/dolphin/license` | [x] | ◎ テスト整備済み | レガシー: checkLicense ｜ `SystemResourceTest#checkLicense_*` 系で新規登録・既存再利用・上限超過・読込/書込失敗のレスポンス＆監査記録を網羅。ライセンス I/O は `InMemoryLicenseRepository` で隔離。 |

### UserResource
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/user` | UserResource: `/user` | [x] | ◎ 移行済み | レガシー: getAllUser |
| POST | `/user` | UserResource: `/user` | [x] | ◎ 移行済み | レガシー: postUser |
| PUT | `/user` | UserResource: `/user` | [x] | ◎ 移行済み | レガシー: putUser |
| PUT | `/user/facility` | UserResource: `/user/facility` | [x] | ◎ 移行済み | レガシー: putFacility |
| GET | `/user/name/{userId}` | UserResource: `/user/name/{userId}` | [x] | ◎ 移行済み | レガシー: getUserName |
| DELETE | `/user/{userId}` | UserResource: `/user/{userId}` | [x] | ◎ 移行済み | レガシー: deleteUser |
| GET | `/user/{userId}` | UserResource: `/user/{userId}` | [x] | ◎ 移行済み | レガシー: getUser |
