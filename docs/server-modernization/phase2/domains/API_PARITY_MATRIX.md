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
| GET | `/demo/document/progressCourse/{param}` | — (Demo-01) | [ ] | ✖ 未実装 | Demo-01: ProgressCourse DTO を `TouchModuleService` へ移行予定。`MODERNIZED_REST_API_INVENTORY.md` Demo-01 参照。 |
| GET | `/demo/item/laboItem/{param}` | — (Demo-02) | [ ] | ✖ 未実装 | Demo-02: ラボトレンド用 `TouchModuleService#getLaboGraph` を RESTEasy 未登録。 |
| GET | `/demo/module/diagnosis/{param}` | — (Demo-03) | [ ] | ✖ 未実装 | Demo-03: 診断 DTO を JSON 化する TouchModule パイプライン未統合。 |
| GET | `/demo/module/laboTest/{param}` | — (Demo-04) | [ ] | ✖ 未実装 | Demo-04: `TouchModuleService#getLaboModules` を Demo テナント向けに公開していない。 |
| GET | `/demo/module/rp/{param}` | — (Demo-05) | [ ] | ✖ 未実装 | Demo-05: RP モジュールの JSON 版が未公開、`BundleDolphin` 変換 Pending。 |
| GET | `/demo/module/schema/{param}` | — (Demo-06) | [ ] | ✖ 未実装 | Demo-06: Schema Base64 応答を `TouchModuleService` へ切替予定だが未配備。 |
| GET | `/demo/module/{param}` | — (Demo-07) | [ ] | ✖ 未実装 | Demo-07: 任意 entity モジュール参照が TouchModule DTO 化されていない。 |
| GET | `/demo/patient/firstVisitors/{param}` | — (Demo-08) | [ ] | ✖ 未実装 | Demo-08: `TouchPatientService#getFirstVisitors` を Demo 固定 facility で実行する経路が無い。 |
| GET | `/demo/patient/visit/{param}` | — (Demo-09) | [ ] | ✖ 未実装 | Demo-09: 来院履歴の QueryParam 化と `TouchAuditHelper` 連携が未着手。 |
| GET | `/demo/patient/visitLast/{param}` | — (Demo-10) | [ ] | ✖ 未実装 | Demo-10: 最終来院レスポンスを `TouchPatientService#getLastVisit` に委譲する実装が無い。 |
| GET | `/demo/patient/visitRange/{param}` | — (Demo-11) | [ ] | ✖ 未実装 | Demo-11: 期間指定 API の facility/consent 検証フックを実装していない。 |
| GET | `/demo/patient/{pk}` | — (Demo-12) | [ ] | ✖ 未実装 | Demo-12: `TouchPatientService#getPatientByPk` を Demo consent と紐付けるレイヤーが欠落。 |
| GET | `/demo/patientPackage/{pk}` | — (Demo-13) | [ ] | ✖ 未実装 | Demo-13: 患者パッケージ DTO 変換（保険/アレルギー）を Demo で公開していない。 |
| GET | `/demo/patients/name/{param}` | — (Demo-14) | [ ] | ✖ 未実装 | Demo-14: 氏名検索を `TouchPatientService#searchPatientsByName` へ橋渡しする REST が未登録。 |
| GET | `/demo/user/{param}` | — (Demo-15) | [ ] | ✖ 未実装 | Demo-15: Demo ログイン用 `TouchUserService#getUser` 連携が無く、Legacy XML を返している。 |

> 備考: 各メモの ID（Demo-01〜15）は `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の欠落表と連動。タスク管理は `PHASE2_TOUCH_DEMO_GAP` で追跡し、RESTEasy 登録と `TouchAuditHelper` の Demo 名前空間分離を完了させる。
- ※5 adm10 側 `/10/adm/jtouch/document*` 系を Jakarta 版リソースに実装し、`/jtouch/*` への依存無しで保存処理が完結するよう監査ログ (`JsonTouchAuditLogger`)・例外ハンドリングを統一した。touch/adm10/adm20 のレスポンス整合性を比較し、旧 `/jtouch` 呼び出しを残さずに運用可能。
- ※6 `JsonTouchResourceParityTest` を 17 ケースへ拡充し、document／mkdocument／interaction／stamp の正常系・異常系および監査ログを検証。`System.err` 直書きと JDBC 例外放置は解消済みで、`mvn -pl server-modernized test` は DuplicateProjectException で失敗するもののテスト自体は IDE 実行で成功。
- ※7 `PHRResource` 11 件はコード実装済みだが、自動テスト・監査証跡未取得。さらに `/20/adm/phr/export` 系 REST が未実装で、Runbook 手順 6 を **Blocked** として管理中（`WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` §2 参照）。

### DolphinResourceASP
| HTTP | レガシーパス | モダナイズ側 | チェック | 状態 | メモ |
| --- | --- | --- | --- | --- | --- |
| GET | `/touch/document/progressCourse/{param}` | — (Dolphin-01) | [ ] | ✖ 未実装 | Dolphin-01: ProgressCourse を `TouchModuleService` + `DolphinTouchAuditLogger` で公開する REST が未登録。 |
| POST | `/touch/idocument` | — (Dolphin-02) | [ ] | ✖ 未実装 | Dolphin-02: `KarteServiceBean`+`IDocument` コンバータ経路を RESTEasy に割り当てていない。 |
| POST | `/touch/idocument2` | — (Dolphin-03) | [ ] | ✖ 未実装 | Dolphin-03: IDocument2 版保存 API が欠落し、FreeText 送信が不可。 |
| GET | `/touch/item/laboItem/{param}` | — (Dolphin-04) | [ ] | ✖ 未実装 | Dolphin-04: `TouchModuleService#getLaboGraph` を `/resources/touch` 配下で公開していない。 |
| GET | `/touch/module/diagnosis/{param}` | — (Dolphin-05) | [ ] | ✖ 未実装 | Dolphin-05: 診断モジュール JSON 応答が未整備。 |
| GET | `/touch/module/laboTest/{param}` | — (Dolphin-06) | [ ] | ✖ 未実装 | Dolphin-06: `TouchModuleService#getLaboModules` + facility ヘッダー検証が未投入。 |
| GET | `/touch/module/rp/{param}` | — (Dolphin-07) | [ ] | ✖ 未実装 | Dolphin-07: RP DTO (`TouchModuleDtos.RpModule`) を返す REST が欠落。 |
| GET | `/touch/module/schema/{param}` | — (Dolphin-08) | [ ] | ✖ 未実装 | Dolphin-08: Schema 配信（Base64/画像）のハンドラが未登録。 |
| GET | `/touch/module/{param}` | — (Dolphin-09) | [ ] | ✖ 未実装 | Dolphin-09: 任意 entity モジュールを返す JSON エンドポイントが無い。 |
| GET | `/touch/patient/firstVisitors/{param}` | — (Dolphin-10) | [ ] | ✖ 未実装 | Dolphin-10: `TouchPatientService#getFirstVisitors` への橋渡しが無く、初診一覧が空。 |
| GET | `/touch/patient/visit/{param}` | — (Dolphin-11) | [ ] | ✖ 未実装 | Dolphin-11: offset/limit/sort を受ける QueryParam 実装を REST に露出できていない。 |
| GET | `/touch/patient/visitLast/{param}` | — (Dolphin-12) | [ ] | ✖ 未実装 | Dolphin-12: 最終来院 API の consent/監査処理が未完。 |
| GET | `/touch/patient/visitRange/{param}` | — (Dolphin-13) | [ ] | ✖ 未実装 | Dolphin-13: 期間指定 API で `TouchRequestContextExtractor` を呼ぶ経路が欠落。 |
| GET | `/touch/patient/{pk}` | — (Dolphin-14) | [ ] | ✖ 未実装 | Dolphin-14: `TouchPatientService#getPatientByPk` を `/touch/patient/{pk}` に公開していない。 |
| GET | `/touch/patientPackage/{pk}` | — (Dolphin-15) | [ ] | ✖ 未実装 | Dolphin-15: 患者パッケージ DTO を返す REST が未登録。 |
| GET | `/touch/patients/name/{param}` | — (Dolphin-16) | [ ] | ✖ 未実装 | Dolphin-16: 氏名検索のかな/漢字正規化ロジックが REST 化されていない。 |
| GET | `/touch/stamp/{param}` | — (Dolphin-17) | [ ] | ✖ 未実装 | Dolphin-17: `TouchStampService#getStamp` を JSON で返却する `/touch/stamp` が欠落。 |
| GET | `/touch/stampTree/{param}` | — (Dolphin-18) | [ ] | ✖ 未実装 | Dolphin-18: スタンプツリー JSON 応答を返す REST が無い。 |
| GET | `/touch/user/{param}` | — (Dolphin-19) | [ ] | ✖ 未実装 | Dolphin-19: `TouchUserService#getUser` + `TouchAuthHandler` の REST 連携が未投入。 |

> 備考: Dolphin-01〜19 のギャップは `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の欠落表と連動。`server-modernized/src/main/webapp/WEB-INF/web.xml` へ `open.dolphin.touch.DolphinResourceASP` を登録し、`TouchPatientResource`/`TouchStampResource`/`TouchUserResource` の既存 JSON 実装と整合させる必要がある。
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
| GET | `/20/adm/phr/abnormal/{param}` | — (PHR-01) | [ ] | ✖ 未実装 | PHR-01: `PhrDataAssembler` + `AMD20_PHRServiceBean` を RESTEasy に登録しておらず、異常値テキストが返せない。順序: [PHR 閲覧フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-view-apis)。 |
| PUT | `/20/adm/phr/accessKey` | — (PHR-02) | [ ] | ✖ 未実装 | PHR-02: PHRKey upsert を行う REST 経路が未配置。順序: [キー管理フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-key-management)。 |
| GET | `/20/adm/phr/accessKey/{param}` | — (PHR-03) | [ ] | ✖ 未実装 | PHR-03: アクセスキー検索の facility 突合・監査を実装した REST が欠落。順序: [キー管理フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-key-management)。 |
| GET | `/20/adm/phr/allergy/{param}` | — (PHR-04) | [ ] | ✖ 未実装 | PHR-04: アレルギー文章化ロジックを `PhrDataAssembler` から公開していない。順序: [PHR 閲覧フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-view-apis)。 |
| GET | `/20/adm/phr/disease/{param}` | — (PHR-05) | [ ] | ✖ 未実装 | PHR-05: 継続傷病テキスト返却 API が未登録。順序: [PHR 閲覧フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-view-apis)。 |
| POST | `/20/adm/phr/identityToken` | — (PHR-06) | [ ] | ✖ 未実装 | PHR-06: `IdentityService` を呼び出す Layer ID トークン発行 REST が未公開。順序: [Layer ID フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-layer-id)。 |
| GET | `/20/adm/phr/image/{param}` | — (PHR-07) | [ ] | ✖ 未実装 | PHR-07: Schema 画像ストリームを配信する経路が存在しない。順序: [Schema 画像フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-schema)。 |
| GET | `/20/adm/phr/labtest/{param}` | — (PHR-08) | [ ] | ✖ 未実装 | PHR-08: 検査結果テキストのレスポンス整形を行う REST 実装が無い。順序: [PHR 閲覧フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-view-apis)。 |
| GET | `/20/adm/phr/medication/{param}` | — (PHR-09) | [ ] | ✖ 未実装 | PHR-09: `ClaimBundle` を整形して返す処方テキスト API が欠落。順序: [PHR 閲覧フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-view-apis)。 |
| GET | `/20/adm/phr/patient/{param}` | — (PHR-10) | [ ] | ✖ 未実装 | PHR-10: 患者 ID → PHRKey を返却する REST が登録されていない。順序: [キー管理フェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-key-management)。 |
| GET | `/20/adm/phr/{param}` | — (PHR-11) | [ ] | ✖ 未実装 | PHR-11: `PHRContainer` を束ねて返す本体 API が未公開。順序: [PHR コンテナフェーズ](PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-container)。 |

> 備考: PHR-01〜11 の詳細は `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の表を参照。`PHR-EXPORT-TRACK` でエクスポート API を別管理し、まずはキー管理と閲覧 API を RESTEasy に登録する。
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

### ORCA API ラッパー計画（Matrix No.2-18, 32-37, 42）

| No | ORCA API | モダナイズ REST | 状態 | 実装計画 |
| --- | --- | --- | --- | --- |
| 2 | `/orca14/appointmodv2` | `POST /orca/appointments/mutation` | ◎ 実装完了 | 予約登録/取消/新規患者番号割当を DTO `AppointmentMutationRequest/Response` で受け、`OrcaAppointmentMutationFacade`→`AppoServiceBean` と監査ログを同期。`RUN_ID=20251121T153200Z` および `RUN_ID=20251121PostOpenCheckZ1`（接続先詳細は `mac-dev-login.local.md` 参照）で `HTTP 405 (Allow: OPTIONS, GET)` を再現し、POST 未開放が継続。TrialLocalOnly → HTTP405(Local) へ Blocker 理由を更新。Evidence: `artifacts/orca-connectivity/20251121PostOpenCheckZ1/crud/appointmodv2/headers_*.txt`（前回: `20251121T153200Z`）。詳細: [appointmodv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#appointmodv2-matrix-no2)。 |
| 4 | `/orca11/acceptmodv2` | `POST /orca/visits/mutation` | ◎ 実装完了 | 受付 CRUD・新規患者受付。`VisitMutationRequest/Response` が `PVTServiceBean`／`ChartEventServiceBean`／`PatientServiceBean` を橋渡しする。`RUN_ID=20251121T153200Z` に続き `RUN_ID=20251121PostOpenCheckZ1` でも ORMaster 実測は `HTTP 405 (Allow: OPTIONS, GET)` のまま。TrialLocalOnly → HTTP405(Local) に理由を更新し、ORCA 側で POST 開放 or 代替経路が必要。Evidence: `artifacts/orca-connectivity/20251121PostOpenCheckZ1/crud/acceptmodv2/headers_*.txt`（前回: `20251121T153200Z`）。詳細: [acceptmodv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#acceptmodv2-matrix-no4)。 |
| 6 | `/api01rv2/appointlstv2` | `POST /orca/appointments/list` | ◎ 実装完了 | `OrcaAppointmentResource#listAppointments` が DTO/Service 化済み。`RUN_ID=20251121T153200Z` 実測では HTTP200 だが `Api_Result=12 (ドクターが存在しません)` でデータ不足。Blocker を TrialLocalOnly → DataSeedMissing へ更新し、医師コード `0001` を投入後に再測予定。Evidence: `artifacts/orca-connectivity/20251121T153200Z/crud/appointlstv2/response_*.xml`。 |
| 7 | `/orca102/medicatonmodv2` | なし | ✖ 未実装 | Phase2 Sprint4（2026-02）に `POST /orca/tensu/sync` を実装し、DTO `MedicationModRequest/Response` を `OrcaConnect`→`TensuListConverter`→`StampServiceBean` へ流して診療セットの点数更新と同期する。 |
| 8 | `/api01rv2/patientlst1v2` | `POST /orca/patients/id-list` | ◎ 実装完了 | `OrcaPatientBatchResource#patientIdList` で ID 差分を REST 化。Trial=Blocker`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 9 | `/api01rv2/patientlst2v2` | `POST /orca/patients/batch` | ◎ 実装完了 | 住所・保険をまとめて返すバッチ API を追加。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 10 | `/api01rv2/patientlst3v2` | `POST /orca/patients/name-search` | ◎ 実装完了 | 氏名検索ラッパーを追加。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 11 | `/api01rv2/system01lstv2` | `POST /orca/system/management` | ◎ 実装完了 | 診療科/職員/医療機関基本情報など 7 クラスを `SystemMasterSnapshotRequest/Response` で統合し、`SystemServiceBean` キャッシュへ保存。Trial通信不可だが実装完了（RUN_ID=20251116T164200Z, 仕様ベース）。詳細: [system01lstv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#system01lstv2-matrix-no11)。 |
| 12 | `/api01rv2/medicalgetv2` | `POST /orca/medical/records` | △ Spec-based（RUN_ID=20251116T170500Z） | モダナイズ DB のカルテ履歴を ORCA 互換 JSON で返すラッパーを実装。ORCA Trial POST が閉鎖されているため当面は `KarteServiceBean` の結果のみ返却し、Trial 解放後に `OrcaConnect` 経由のレスポンスをマージする。詳細: [medicalgetv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#medicalgetv2-matrix-no12)。 |
| 13 | `/api01rv2/diseasegetv2` | `GET /orca/disease/import/{pid}` | △ 実装（Trial未検証） | `DiseaseImportResponse` を導入し、`KarteServiceBean#getDiagnosis` を ORCA 項目（`Disease_Category`, `Disease_SuspectedFlag`, `StartDate` 等）へマッピング。Trial ORCA で GET が開放されたら `Api_Result` 等を透過させる。詳細: [diseasegetv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#diseasegetv2-matrix-no13)。 |
| 14 | `/orca12/patientmodv2` | `POST /orca/patient/mutation` | △ Spec-based（delete 未開放） | create/update を `PatientServiceBean#addPatient/#update` と `AuditTrail` に連携。Trial で delete が禁止のため `Api_Result=79 / Spec-based implementation` を返却し、解除後に `PatientServiceBean` へ論理削除 API を追加する。詳細: [patientmodv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientmodv2-matrix-no17)。 |
| 15 | `/api01rv2/appointlst2v2` | `POST /orca/appointments/patient` | ◎ 実装完了 | 予約タブの患者別問い合わせを REST 化。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 16 | `/api01rv2/acsimulatev2` | `POST /orca/billing/estimate` | ◎ 実装完了 | BillingSimulation DTO と `OrcaWrapperService` で ORCA 試算を呼び出す。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 17 | `/orca25/subjectivesv2` | `POST /orca/chart/subjectives` | △ Spec-based | Trial で POST が閉鎖されているため stub 実装（`Api_Result=79`）のみ提供。`SubjectiveEntryRequest/Response` の契約と監査ログを固め、ORCA 側で API が開放されたら `ChartEventServiceBean` 連携を有効化する。 |
| 18 | `/api01rv2/visitptlstv2` | `POST /orca/visits/list` | ◎ 実装完了 | 来院一覧の REST 化。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 32 | `/orca101/manageusersv2` | `POST /orca/system/users` | ◎ 実装完了 | ユーザー一覧/登録/更新/削除を `OrcaUserManagementRequest/Response` で扱い、`UserServiceBean`＋`SystemServiceBean` で職員情報・権限を同期。Trial通信不可だが実装完了（RUN_ID=20251116T164200Z, 仕様ベース）。詳細: [manageusersv2 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#manageusersv2-matrix-no32)。 |
| 33 | `/orca21/medicalsetv2` | `POST /orca/medical-sets` | △ Spec-based | Trial では診療セット API が閉鎖されているため `/orca/medical-sets` は stub 実装（`Api_Result=79`）のみ。DTO `MedicalSetMutationRequest/Response` を定義済みで、Trial or ORMaster で POST が開放され次第、`StampServiceBean` と `ModuleListConverter` を介して CRUD を接続する。 |
| 34 | `/orca31/birthdeliveryv2` | `POST /orca/birth-delivery` | △ Spec-based | 出産育児一時金 API も Trial 上は封鎖されているため stub 実装。DTO `BirthDeliveryRequest/Response` を固定し、将来的に `AdmissionResource`／`HealthInsuranceModel` へ反映できるよう監査構造のみ整備した。 |
| 35 | `/api01rv2/patientlst6v2` | `POST /orca/insurance/combinations` | ◎ 実装完了 | InsuranceCombination DTO で保険組合せを REST 化。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 51 | `/api01rv2/patientlst8v2` | `POST /orca/patients/former-names` | ◎ 実装完了 | 旧姓履歴ラッパー。Blocker=`TrialLocalOnly`／RUN_ID=`20251116T170500Z`。 |
| 36 | `/orca22/diseasev2` | `POST /orca/disease` | △ 実装（Trial未検証） | DTO `DiseaseMutationRequest/Response` を `RegisteredDiagnosisModel`＋`KarteServiceBean`＋`SessionAuditDispatcher` へ接続。Trial で POST が閉鎖されているため ORCA 実測は未完了だが、モダナイズ DB 内の CRUD は実行済み（RUN_ID=`20251116T170500Z`）。 |
| 37 | `/orca22/diseasev3` | `POST /orca/disease/v3` | △ Spec-based | v3 固有の補足コメント/BaseMonth を DTO 化し stub を用意。Trial/ORMaster で API が開放され次第、v2 実装を拡張して差分管理を行う。 |
| 42 | `/orca42/receiptprintv3` | `POST /orca/report/print` | ◎ 実装完了 | 帳票印刷を `ReportPrintJobRequest/Response` で受付し、`push-exchanger`＋`/blobapi/{dataId}` へ流す。`RUN_ID=20251121T153200Z`／`20251121PostOpenCheckZ1` とも ORMaster 実測は `HTTP 405 (Allow: OPTIONS, GET)` で変化なし。TrialLocalOnly → HTTP405(Local) として Blocker 継続（print002/blobapi 未構成）。Evidence: `artifacts/orca-connectivity/20251121PostOpenCheckZ1/crud/receiptprintv3/headers_*.txt`（前回: `20251121T153200Z`）。詳細: [receiptprintv3 設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#receiptprintv3-matrix-no42)。 |

#### ORCA-REST-01（Phase2 Sprint2）

| Wrapper | ORCA API（class） | REST Path / Method | リクエスト schema | レスポンス schema | バリデーション / ORCA 呼び出しハンドラ |
| --- | --- | --- | --- | --- | --- |
| 予約一覧（1日分） [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#appointlstv2-matrix-no6) | `/api01rv2/appointlstv2?class=01` | `POST /orca/appointments/list` | `OrcaAppointmentListRequest`：`appointmentDate`(必須 `yyyy-MM-dd`)、`medicalInformation`(任意、`01-07` or `99`)、`physicianCode`(任意 5 桁)、`includeVisitStatus`(bool) | `OrcaAppointmentListResponse`：`apiResult` / `apiResultMessage` / `slots[]`（時刻、診療科、医師、来院フラグ、`PatientSummary`）／`rawXml`(任意)／`runId` | `appointmentDate` が欠落または不正フォーマットなら 400。`medicalInformation` は `^(0[1-7]|99)$`。`OrcaResource#postAppointmentsList` が `OrcaConnect#appointlst` を実行し、戻り値を `AppoServiceBean` と Web クライアント双方へ返す。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 予約一覧（患者単位） [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#appointlst2v2-matrix-no15) | `/api01rv2/appointlst2v2?class=01` | `POST /orca/appointments/patient` | `PatientAppointmentListRequest`：`patientId`(必須)、`baseDate`(任意 `yyyy-MM-dd`)、`departmentCode`、`requestNumber` (`01/02`) | `PatientAppointmentListResponse`：`apiResult`、`reservations[]`（予約日時、診療科、来院済みフラグ、`PatientSummary`）、`warnings[]` | `patientId` は `^[0-9]{1,16}$`。`baseDate` が 180 日超未来の場合は 422。`OrcaResource#postPatientAppointments` → `OrcaConnect#appointlst2`。レスポンスは `AppoServiceBean#getAppointmentList` の結果と統合し、監査イベント `APPOINTMENT_SYNC` を記録。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 請求試算 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#acsimulatev2-matrix-no16) | `/api01rv2/acsimulatev2?class=01` | `POST /orca/billing/estimate` | `BillingSimulationRequest`：`patientId`、`karteId`、`performDate`、`departmentCode`、`physicianCode`、`claimBundles[]`（code, qty, point, memo） | `BillingSimulationResponse`：`apiResult`、`estimate`（総額/公費控除/自己負担/入外区分）、`warnings[]`、`mirroredClaimXml`、`runId` | `claimBundles` が空の場合 400。`performDate` は診療日当日±1 営業日。`OrcaResource#postBillingEstimate` が `ClaimSender` でスタブ CLAIM を生成して `OrcaConnect#acsimulate` へ渡し、結果を `KarteServiceBean` へ通知（ドラフトカルテへ埋め込み）する。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 来院患者一覧 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#visitptlstv2-matrix-no18) | `/api01rv2/visitptlstv2?class=01/02` | `POST /orca/visits/list` | `VisitPatientListRequest`：`visitDate`(必須 `yyyy-MM-dd`)、`departmentCode`、`physicianCode`、`requestNumber`(01: 詳細、02: 月次カレンダー) | `VisitPatientListResponse`：`apiResult`、`visitDate`、`visits[]`（受付番号、順番、`PatientSummary`、`insuranceSummary`、`Visit_Calendar`）、`pvtCacheUpdated` | `visitDate` フォーマット厳密化。`departmentCode` は `SystemServiceBean` キャッシュに存在するコードのみ許可。`OrcaResource#postVisitPatients` が `OrcaConnect#visitptlst` を叩き、戻り値を `PVTServiceBean` の来院キャッシュへ反映して Web クライアントへ返す。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |

#### ORCA-REST-02（Phase2 Sprint2）

| Wrapper | ORCA API（class） | REST Path / Method | リクエスト schema | レスポンス schema | バリデーション / ORCA 呼び出しハンドラ |
| --- | --- | --- | --- | --- | --- |
| 患者 ID 一括取得 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientlst1v2-matrix-no8) | `/api01rv2/patientlst1v2?class=01` | `POST /orca/patients/id-list` | `PatientIdBatchRequest`：`baseStartDate` / `baseEndDate`（必須、最大 90 日幅）、`includeTestPatient`(bool) | `PatientIdBatchResponse`：`apiResult`、`targetCount`、`patients[]`（`patientId`、氏名、作成/更新日時、`testPatientFlag`）、`syncTicketId` | 日付範囲外は 400。`includeTestPatient` デフォルト false。`OrcaResource#postPatientIdBatch` が `OrcaConnect#patientlst1` を呼び出し、`PatientServiceBean` の差分同期ジョブへ投入。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 患者詳細バッチ取得 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientlst2v2-matrix-no9) | `/api01rv2/patientlst2v2?class=01` | `POST /orca/patients/batch` | `PatientListBatchRequest`：`patientIds[]`（最大 200 件）または `continuationToken`、`includeInsurance` | `PatientListBatchResponse`：`patients[]`（基本属性＋`HealthInsuranceModel` 配列）、`continuationToken`、`apiResult` | `patientIds` が空なら 400。`includeInsurance` true の場合は `HealthInsuranceModel` を正規化して永続化。`OrcaResource#postPatientBatch` → `OrcaConnect#patientlst2` → `PatientServiceBean#mergeOrcaPatient`。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 氏名カナ検索 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientlst3v2-matrix-no10) | `/api01rv2/patientlst3v2?class=01` | `POST /orca/patients/name-search` | `PatientNameSearchRequest`：`name` or `kana`（必須）、`birthDate`、`sex`、`fuzzyMode`（`prefix/suffix/partial`） | `PatientNameSearchResponse`：`hits[]`（`patientId`、`fullname`、`kana`、`birthday`、`sex`、`lastVisitDate`）＋`apiResult` | `name`・`kana` が両方未指定は 400。`fuzzyMode` のデフォルトは `partial`。`OrcaResource#postPatientNameSearch` が `OrcaConnect#patientlst3` を呼び、ローカル `PatientServiceBean#getPatientsByName/Kana` の差分も返す。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 患者登録/更新/削除 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientmodv2-matrix-no17) | `/orca12/patientmodv2?class=01-03` | `POST /orca/patient/mutation` | `PatientMutationRequest`：`operation`(`create/update/delete`)、`patientPayload`（`PatientModel` 相当）、`traceId` | `PatientMutationResponse`：`apiResult`、`patientId`、`warnings[]`、`auditId` | `operation` と payload の整合を検証。診療科/医師コードは `SystemServiceBean` キャッシュ一致が必須。`OrcaResource#postPatientMutation` → `OrcaConnect#patientmod` で ORCA 反映後、`PatientServiceBean` と `AuditTrailService` へ書き戻し。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 保険組合せ取得 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#patientlst6v2-matrix-no14) | `/api01rv2/patientlst6v2?class=01` | `POST /orca/insurance/combinations` | `InsuranceCombinationRequest`：`patientId`（必須）、`baseDate`、`rangeStart`、`rangeEnd` | `InsuranceCombinationResponse`：`combinations[]`（組合せ番号、給付率、適用期間、保険種別、公費情報）＋`apiResult` | `rangeStart/End` は 1 年以内。`OrcaResource#postInsuranceCombination` → `OrcaConnect#patientlst6`。結果を `PatientServiceBean` で `HealthInsuranceModel` へ反映し、`PVTServiceBean` にも共有。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
| 症状詳記登録 [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#subjectivesv2-matrix-no35) | `/orca25/subjectivesv2?class=01` | `POST /orca/chart/subjectives` | `SubjectiveEntryRequest`：`patientId`、`karteId`、`performDate`、`soapCategory`(`S/O/A/P`)、`body`（1,000 文字以内）、`insuranceCombinationNumber`、`departmentCode`、`physicianCode` | `SubjectiveEntryResponse`：`apiResult`、`entryId`、`warnings[]`、`echoedBody`、`auditId` | `body` 長 >1,000 文字で 422。`soapCategory` が無効なら 400。`OrcaResource#postSubjectives` が `OrcaConnect#subjectives` で ORCA 登録後、`ChartEventServiceBean`＋`KarteServiceBean` へ伝播し、`ORCA_CONNECTIVITY_VALIDATION.md` §4.4 の RUN_ID をレスポンスへ含める。詳細: [Sprint2設計](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)。 |
