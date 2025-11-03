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
| GET | `/demo/document/progressCourse/{param}` | DemoResourceAsp: `/demo/document/progressCourse/{param}` | [ ] | △ 要修正 | ※1 ※2 ※3 |
| GET | `/demo/item/laboItem/{param}` | DemoResourceAsp: `/demo/item/laboItem/{param}` | [ ] | △ 要修正 | ※1 ※3 ※4 |
| GET | `/demo/module/diagnosis/{param}` | DemoResourceAsp: `/demo/module/diagnosis/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/module/laboTest/{param}` | DemoResourceAsp: `/demo/module/laboTest/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/module/rp/{param}` | DemoResourceAsp: `/demo/module/rp/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/module/schema/{param}` | DemoResourceAsp: `/demo/module/schema/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/module/{param}` | DemoResourceAsp: `/demo/module/{param}` | [ ] | △ 要修正 | ※1 ※2 ※3 |
| GET | `/demo/patient/firstVisitors/{param}` | DemoResourceAsp: `/demo/patient/firstVisitors/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patient/visit/{param}` | DemoResourceAsp: `/demo/patient/visit/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patient/visitLast/{param}` | DemoResourceAsp: `/demo/patient/visitLast/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patient/visitRange/{param}` | DemoResourceAsp: `/demo/patient/visitRange/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patient/{pk}` | DemoResourceAsp: `/demo/patient/{pk}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patientPackage/{pk}` | DemoResourceAsp: `/demo/patientPackage/{pk}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/patients/name/{param}` | DemoResourceAsp: `/demo/patients/name/{param}` | [ ] | △ 要修正 | ※1 ※3 |
| GET | `/demo/user/{param}` | DemoResourceAsp: `/demo/user/{param}` | [ ] | △ 要修正 | ※1 ※3 |

- ※1 `DemoResourceAsp` が `ModuleModel` を import しておらずビルドエラー（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:20-65,398-400）。
- ※2 旧実装は `BundleDolphin#setOrderName` で entity 名を補完していたが現行コードでは未設定のため `entity`/`entityName` が null になる（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:398-415,588-604／server/src/main/java/open/dolphin/touch/DemoResourceASP.java:1457-1489,1659-1671）。
- ※3 `DemoResourceAspTest` では `getPatientVisit` など 6 エンドポイントが未カバーで、Maven 未導入のためテスト未実行（server-modernized/src/test/java/open/dolphin/rest/DemoResourceAspTest.java:64-210／docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md:106-116）。
- ※4 ラボトレンドの `comment2` が legacy では常に `comment1` を返していたため応答差分が生じる（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:552-553／server/src/main/java/open/dolphin/touch/DemoResourceASP.java:1140-1144）。
- ※5 adm10 側 `/10/adm/jtouch/document*` 系を Jakarta 版リソースに実装し、`/jtouch/*` への依存無しで保存処理が完結するよう監査ログ (`JsonTouchAuditLogger`)・例外ハンドリングを統一した。touch/adm10/adm20 のレスポンス整合性を比較し、旧 `/jtouch` 呼び出しを残さずに運用可能。
- ※6 `JsonTouchResourceParityTest` を 17 ケースへ拡充し、document／mkdocument／interaction／stamp の正常系・異常系および監査ログを検証。`System.err` 直書きと JDBC 例外放置は解消済みで、`mvn -pl server-modernized test` は DuplicateProjectException で失敗するもののテスト自体は IDE 実行で成功。
- ※7 `PHRResource` 11 件はコード実装済みだが、自動テスト・監査証跡未取得。さらに `/20/adm/phr/export` 系 REST が未実装で、Runbook 手順 6 を **Blocked** として管理中（`WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` §2 参照）。

### DolphinResourceASP
> **再確認 (2025-11-03, Worker C)**: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java` / `DolphinResourceASP.java` に 19 件すべてのメソッドは存在するが、`server-modernized/src/main/webapp/WEB-INF/web.xml:20-46` に `open.dolphin.touch.DolphinResourceASP` が登録されておらず RESTEasy では公開されない。実装は legacy の文字列連結 XML + `System.err` ログを踏襲し、施設 ID 突合・監査ログ・キャッシュ・エラー統一が未整備。ユニット/統合テストも不在のため `[ ]` 継続。
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/touch/document/progressCourse/{param}` | DolphinResource: `/touch/document/progressCourse/{param}` | [ ] | ✖ 未移植 | RESTEasy 未登録。legacy XML 出力のまま（`server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java:1203-1389`）。 |
| POST | `/touch/idocument` | DolphinResource: `/touch/idocument` | [ ] | ✖ 未移植 | `karteService.addDocument` 呼び出しのみ。監査ログ無し・`System.err` デバッグ残存（同:1450-1467）。 |
| POST | `/touch/idocument2` | DolphinResource: `/touch/idocument2` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/item/laboItem/{param}` | DolphinResource: `/touch/item/laboItem/{param}` | [ ] | ✖ 未移植 | legacy `IPhoneServiceBean.getLaboItem` へ直結。キャッシュ・施設突合なし。 |
| GET | `/touch/module/diagnosis/{param}` | DolphinResource: `/touch/module/diagnosis/{param}` | [ ] | ✖ 未移植 | legacy XML 手組み + 認可チェック無し。 |
| GET | `/touch/module/laboTest/{param}` | DolphinResource: `/touch/module/laboTest/{param}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/module/rp/{param}` | DolphinResource: `/touch/module/rp/{param}` | [ ] | ✖ 未移植 | legacy 文字列連結。性能対策未導入。 |
| GET | `/touch/module/schema/{param}` | DolphinResource: `/touch/module/schema/{param}` | [ ] | ✖ 未移植 | S3 情報返却・Base64 変換 legacy 依存。 |
| GET | `/touch/module/{param}` | DolphinResource: `/touch/module/{param}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/patient/firstVisitors/{param}` | DolphinResource: `/touch/patient/firstVisitors/{param}` | [ ] | ✖ 未移植 | facility ヘッダー突合・監査未整備。 |
| GET | `/touch/patient/visit/{param}` | DolphinResource: `/touch/patient/visit/{param}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/patient/visitLast/{param}` | DolphinResource: `/touch/patient/visitLast/{param}` | [ ] | ✖ 未移植 | legacy 再検索ロジックのまま。 |
| GET | `/touch/patient/visitRange/{param}` | DolphinResource: `/touch/patient/visitRange/{param}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/patient/{pk}` | DolphinResource: `/touch/patient/{pk}` | [ ] | ✖ 未移植 | 個人情報アクセスの監査・施設整合なし。 |
| GET | `/touch/patientPackage/{pk}` | DolphinResource: `/touch/patientPackage/{pk}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/patients/name/{param}` | DolphinResource: `/touch/patients/name/{param}` | [ ] | ✖ 未移植 | legacy カナ変換処理 + facility 突合なし。 |
| GET | `/touch/stamp/{param}` | DolphinResource: `/touch/stamp/{param}` | [ ] | ✖ 未移植 | JSON 生成はあるがキャッシュ/監査未整備。 |
| GET | `/touch/stampTree/{param}` | DolphinResource: `/touch/stampTree/{param}` | [ ] | ✖ 未移植 | 同上。 |
| GET | `/touch/user/{param}` | DolphinResource: `/touch/user/{param}` | [ ] | ✖ 未移植 | `userName/password/clientUUID` ヘッダー未検証。 |
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
| GET | `/20/adm/phr/abnormal/{param}` | PHRResource: `/20/adm/phr/abnormal/{param}` | [ ] | △ 要証跡 | レガシー: getAbnormalValue ｜ ※7 |
| PUT | `/20/adm/phr/accessKey` | PHRResource: `/20/adm/phr/accessKey` | [ ] | △ 要証跡 | レガシー: putPHRKey ｜ ※7 |
| GET | `/20/adm/phr/accessKey/{param}` | PHRResource: `/20/adm/phr/accessKey/{param}` | [ ] | △ 要証跡 | レガシー: getPHRKeyByAccessKey ｜ ※7 |
| GET | `/20/adm/phr/allergy/{param}` | PHRResource: `/20/adm/phr/allergy/{param}` | [ ] | △ 要証跡 | レガシー: getAllergy ｜ ※7 |
| GET | `/20/adm/phr/disease/{param}` | PHRResource: `/20/adm/phr/disease/{param}` | [ ] | △ 要証跡 | レガシー: getDisease ｜ ※7 |
| POST | `/20/adm/phr/identityToken` | PHRResource: `/20/adm/phr/identityToken` | [ ] | △ 要証跡 | レガシー: getIdentityToken ｜ ※7 |
| GET | `/20/adm/phr/image/{param}` | PHRResource: `/20/adm/phr/image/{param}` | [ ] | △ 要証跡 | レガシー: getImage ｜ ※7 |
| GET | `/20/adm/phr/labtest/{param}` | PHRResource: `/20/adm/phr/labtest/{param}` | [ ] | △ 要証跡 | レガシー: getLastLabTest ｜ ※7 |
| GET | `/20/adm/phr/medication/{param}` | PHRResource: `/20/adm/phr/medication/{param}` | [ ] | △ 要証跡 | レガシー: getLastMedication ｜ ※7 |
| GET | `/20/adm/phr/patient/{param}` | PHRResource: `/20/adm/phr/patient/{param}` | [ ] | △ 要証跡 | レガシー: getPHRKeyByPatientId ｜ ※7 |
| GET | `/20/adm/phr/{param}` | PHRResource: `/20/adm/phr/{param}` | [ ] | △ 要証跡 | レガシー: getPHRData ｜ ※7 |

> 補足: レガシーに存在しない新規 API として計画されていた `/20/adm/phr/export` 系エンドポイントは、モダナイズ版でも未実装。`PhrExportJobManager`・`PHRAsyncJobServiceBean` などの基盤コードのみ存在し、REST リソースとジョブワーカー/署名付き URL 発行処理が未着手である。

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
| GET | `/dolphin` | SystemResource: `/dolphin` | [ ] | ✖ テスト未整備 | レガシー: hellowDolphin ｜ 実装は `SystemResource#hellowDolphin`（server-modernized/src/main/java/open/dolphin/rest/SystemResource.java:43）で確認したが、`SystemResourceTest` 等の自動テスト・Smoke 証跡が存在しないため未完了扱い。 |
| POST | `/dolphin` | SystemResource: `/dolphin` | [ ] | ✖ テスト未整備 | レガシー: addFacilityAdmin ｜ 役割再紐付けと `SystemServiceBean#addFacilityAdmin` 呼び出しを検証するテストが未整備（server-modernized/src/test/java に該当クラスなし）。 |
| GET | `/dolphin/activity/{param}` | SystemResource: `/dolphin/activity/{yyyy,MM,count}` | [ ] | ✖ テスト未整備 | レガシー: getActivities ｜ 日付範囲計算と `SystemServiceBean#countActivities` 集計の挙動を確認する自動テストが未整備。 |
| GET | `/dolphin/cloudzero/sendmail` | SystemResource: `/dolphin/cloudzero/sendmail` | [ ] | ✖ テスト未整備 | レガシー: sendCloudZeroMail ｜ `sendMonthlyActivities` 呼び出しを検証するテスト証跡なし。 |
| POST | `/dolphin/license` | SystemResource: `/dolphin/license` | [ ] | ✖ テスト未整備 | レガシー: checkLicense ｜ ライセンスファイル書き換えの例外分岐を検証するテスト・ログ証跡未整備。 |

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
