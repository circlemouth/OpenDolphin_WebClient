# 開発状況（単一参照, 更新日: 2026-01-28）

## 現行ステータス
- Phase2 開発ドキュメントは **Legacy/Archive（参照専用）**。Phase2 を現行フェーズとして扱わない。
- 現行のドキュメント入口は `docs/web-client/CURRENT.md` / `docs/server-modernization/README.md`。
- ORCA 接続情報の正本は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md`（Phase2 版は Legacy）。
- 現行の作業内容はフェーズ名では判断せず、最新のタスク指示/チケット/マネージャー指示に従う。

## 参照の優先順
1. `docs/DEVELOPMENT_STATUS.md`（本ファイル）
2. `AGENTS.md` / `GEMINI.md`（共通ルールと制約）
3. 現行ハブ: `docs/web-client/CURRENT.md` / `docs/server-modernization/README.md`
4. 環境手順: `web-client/README.md` と `setup-modernized-env.sh`
5. Web クライアント設計: `docs/web-client/`（`planning/phase2/` と `docs/web-client/README.md` は Legacy）
6. サーバーモダナイズ: `docs/server-modernization/`（`phase2/` と `docs/server-modernized/phase2/` は Legacy）

## Legacy 参照（Phase2）
- ロールオフ方針: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md`
- Phase2 ドキュメント: `docs/web-client/planning/phase2/`, `docs/web-client/README.md`, `docs/server-modernization/phase2/`, `docs/server-modernized/phase2/`, `docs/managerdocs/PHASE2_*`
- Archive 保管: `docs/archive/` 配下

## 補足
- Phase2 の文書は履歴・差分確認のために保持しているが、更新は原則行わない。
- 例外的に Phase2 文書を更新する場合は、事前にマネージャー指示を明記すること。
- ORCA 公式仕様の firecrawl 取得物は `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md` を入口に参照する（非Legacy 側の索引）。
- ORCA 接続情報は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` を正本として運用する（Phase2 版は Legacy）。

## 保留（現時点で削除しない）
- `docs/server-modernized_60117/` 配下は作業履歴の可能性があるため、現時点では **保全** する（判断保留）。

## 実施記録（最新）
- 2026-01-30: 画面横断のUIレビュー結果を統合/画面別設計に反映し、文言・導線の統一と回帰確認の根拠を記録（RUN_ID=20260130T121758Z）。成果物: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` / `docs/web-client/architecture/web-client-emr-reception-design-20260128.md` / `docs/web-client/architecture/web-client-emr-charts-design-20260128.md` / `docs/web-client/architecture/web-client-emr-patients-design-20260128.md` / `docs/web-client/CURRENT.md`。回帰確認: `tests/e2e/outpatient-auto-refresh-banner.spec.ts`, `tests/e2e/outpatient-generic-error-recovery.msw.spec.ts`, `tests/e2e/charts/e2e-orca-claim-send.spec.ts`（grep「再送キュー」）PASS。証跡はローカル `artifacts/webclient/e2e/<RUN_ID>/` などに生成（リポジトリ肥大化防止のため非コミット）。
- 2026-01-28: Reception/Charts/Patients 詳細設計の追記（自動更新/キュー取得元/ショートカット/患者バリデーション）を反映（RUN_ID=20260128T131248Z）。成果物: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md` / `docs/web-client/architecture/web-client-emr-charts-design-20260128.md` / `docs/web-client/architecture/web-client-emr-patients-design-20260128.md` / `docs/web-client/CURRENT.md`。
- 2026-01-28: Reception/Charts/Patients の画面別詳細設計ドキュメントを新設し、統合設計ドキュメントとハブへ参照を追加（RUN_ID=20260128T123423Z）。成果物: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md` / `docs/web-client/architecture/web-client-emr-charts-design-20260128.md` / `docs/web-client/architecture/web-client-emr-patients-design-20260128.md` / `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` / `docs/web-client/CURRENT.md`。
- 2026-01-28: Webクライアントの統合設計ドキュメントを server-modernized 実装に合わせて精査し、実装可能範囲へブラッシュアップ（RUN_ID=20260128T060007Z）。成果物: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` / `docs/web-client/CURRENT.md`。
- 2026-01-28: Webクライアントの画面構成/電子カルテ設計を統合し、単一参照ドキュメントを作成。ハブに追加（RUN_ID=20260128T055052Z）。成果物: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` / `docs/web-client/CURRENT.md`。
- 2026-01-27: 開発ドキュメントの現行/Legacy 区分を整理し、ハブ文書 (`docs/web-client/CURRENT.md`, `docs/server-modernization/README.md`) を新設。主要文書の参照先を更新し、Phase2 の ORCA 接続情報を Legacy 化（RUN_ID=20260127T232450Z）。不要なキャッシュ（`.npm-cache`, `.DS_Store`）を削除。
- 2026-01-27: IC-57（JSON/内製ラッパー実環境テスト）の localhost 実測を実施し、Trial未確認/異常系の証跡と差分一覧を整理（RUN_ID=20260127T113046Z、環境: Modernized=`http://localhost:19282/openDolphin/resources` / Local WebORCA=`http://localhost:18000/`、ルーティング修正: `/orca/tensu/sync` の 404 を alias 側委譲で解消、変更: `server-modernized/src/main/java/open/orca/rest/OrcaTensuAliasResource.java`、差分要点: `/orca/medical/records` は Trial 500→localhost 200、`/orca/chart/subjectives` は Trial stub(79)→localhost 実登録(00)、証跡: `artifacts/orca-preprod/20260127T113046Z/10-json-internal-wrapper-live/`）。
- 2026-01-27: `/orca/master/etensu` の404/503原因を特定し、localhost実測で200ヒットを証跡化（RUN_ID=20260127T082046Z）。
  - 原因1（404）: `OrcaResource` の `@Path("/orca")` が `OrcaMasterResource` の `@Path("/")` を食い、`/orca/master/*` が未マッチになっていた。
  - 対応1: `OrcaMasterResource` の基底@Pathを `/orca/master` に変更し、`/api/orca/master/*` と `/orca/tensu/etensu` は alias リソースに分離。
  - 原因2（503）: `TBL_ETENSU_2_SAMPLE` の列名が `RENNUM` なのに `RENUM` を参照してSQLエラーになっていた。
  - 対応2: `EtensuDao.loadSpecimens` の列参照を `RENNUM` に修正。
  - 結果: `http://localhost:8080/openDolphin/resources/orca/master/etensu?keyword=113006810&asOf=20110401&page=1&size=1` が HTTP 200 / totalCount=1。
  - 証跡: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/`
- 2026-01-27: スリープ復帰後に `localhost:19082` への到達性が不安定となったため `server-modernized-dev` を再起動し、Trial未確認APIの localhost 実測を追加。`docker-compose.override.dev.yml` に ORCA DB 接続（`ORCA_DB_*`）を付与し、`systeminfv2`(Api_Result=0000)・`masterlastupdatev3`(Api_Result=000)・`insuranceinf1v2`(Api_Result=00) を HTTP 200 で証跡化（RUN_ID=20260127T075253Z、証跡: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/`）。
- 2026-01-27: `OrcaAdditionalApiResource` 未登録により `/api01rv2/medicationgetv2` が 404 だったため、`server-modernized/src/main/webapp/WEB-INF/web.xml` の `resteasy.resources` に登録を追加し、`http://localhost:19082/openDolphin/resources/api/api01rv2/medicationgetv2` が HTTP 200 / Api_Result=000 となることを curl で実測（RUN_ID=20260127T063205Z、証跡: `artifacts/orca-preprod/20260127T063205Z/medicationgetv2/`）。
- 2026-01-27: Flyway の重複バージョン（V0232）が環境起動を阻害していたため、`drop_document_claimdate` を V0233 へ改番して重複を解消（RUN_ID=20260127T052033Z）。成果物: `server-modernized/src/main/resources/db/migration/V0233__drop_document_claimdate.sql` / `server-modernized/tools/flyway/sql/V0233__drop_document_claimdate.sql`。
- 2026-01-27: api-smoke-test の CI 設定陳腐化を解消し、`serverinforesource_1` を削除（RUN_ID=20260127T041849Z）。検証: `rg -n \"serverinforesource_1\" ops/tests/api-smoke-test` ヒット0、`mvn -pl server-modernized -am -DskipTests compile` 成功。
- 2026-01-27: CLAIM 設定/テンプレ/DB 依存を整理し、`claim.*` 設定参照の撤去・`claimDate` の `@Transient` 化と Flyway drop（V0232→V0233へ改番済み）・CLAIM/JMS 手順の廃止告知を反映（RUN_ID=20260127T033859Z）。成果物: `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java` / `server-modernized/src/main/resources/db/migration/V0233__drop_document_claimdate.sql` / `server-modernized/tools/flyway/sql/V0233__drop_document_claimdate.sql` / `ops/tests/api-smoke-test/api_inventory.yaml` / `ops/tools/jms-probe.sh` / `common/src/main/java/open/dolphin/infomodel/DocInfoModel.java` / `src/orca_preprod_issue_catalog_resolution_20260123/10_claim_deprecation/04_CLAIM設定テンプレDB整理.md` / `artifacts/claim-deprecation/20260127T033859Z/rg-claim-settings.txt`。
- 2026-01-26: CLAIM 廃止/未登録のドキュメント整合を反映（RUN_ID=20260126T135500Z）。成果物: `docs/server-modernization/server-api-inventory.md` / `docs/server-modernization/orca-claim-deprecation/00_方針確認と影響範囲整理.md`。
- 2026-01-26: CLAIM 送信フロー撤去に伴い web.xml から MmlResource 参照を削除し、/mml 残存参照ゼロを確認、`mvn -pl server-modernized -DskipTests compile` でビルド確認（RUN_ID=20260126T131154Z）。成果物: `server-modernized/src/main/webapp/WEB-INF/web.xml` / `server-modernized/src/main/java/open/dolphin/adm20/rest/AbstractResource.java` / `server-modernized/src/main/java/open/dolphin/adm10/rest/AbstractResource.java` / `server-modernized/src/main/java/open/dolphin/touch/AbstractResource.java` / `server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java` / `src/orca_preprod_issue_catalog_resolution_20260123/10_claim_deprecation/03_CLAIM送信フロー撤去.md` / `artifacts/claim-deprecation/20260126T131154Z/rg-mml-cleanup.txt`。
- 2026-01-26: CLAIM 送信フロー（MML/CLAIM 生成・/mml 送信エンドポイント）を撤去し、API-only 代替メモを追加（RUN_ID=20260126T124443Z）。成果物: `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java` / `server-modernized/src/main/java/open/dolphin/session/MmlSenderBean.java` / `server-modernized/src/main/java/open/dolphin/session/MmlServiceBean.java` / `server-modernized/src/main/java/open/dolphin/msg/MMLSender.java` / `server-modernized/src/main/java/open/dolphin/msg/MMLHelper.java` / `server-modernized/src/main/java/open/dolphin/msg/DiagnosisModuleItem.java` / `server-modernized/src/main/java/open/dolphin/msg/PatientHelper.java` / `server-modernized/src/main/java/open/dolphin/msg/dto/MmlDispatchResult.java` / `server-modernized/src/main/resources/mml2.3Helper.vm` / `server-modernized/src/test/java/open/dolphin/session/MmlSenderBeanSmokeTest.java` / `server-modernized/src/test/java/open/dolphin/msg/MessagingDefensiveCopyTest.java` / `src/orca_preprod_issue_catalog_resolution_20260123/10_claim_deprecation/03_CLAIM送信フロー撤去.md`。
- 2026-01-26: missingMaster/fallbackUsed の復旧導線を「再取得/Reception/管理者共有」に統一し、共通ガイド UI を Charts/Patients に適用、トーン/出力ガードの nextAction を標準化（RUN_ID=20260126T100939Z）。成果物: `web-client/src/features/shared/missingMasterRecovery.ts` / `web-client/src/features/shared/MissingMasterRecoveryGuide.tsx` / `web-client/src/features/charts/DocumentTimeline.tsx` / `web-client/src/features/charts/OrcaSummary.tsx` / `web-client/src/features/patients/PatientsPage.tsx` / `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/03_missingMaster復旧導線.md`。
- 2026-01-26: 汎用エラー復旧導線の実画面検証（401/403/404/5xx/network）と MSW 障害注入 E2E を追加し、Charts 医療記録パネルを ApiFailureBanner 統一（RUN_ID=20260126T074551Z）。成果物: `web-client/src/features/charts/MedicalOutpatientRecordPanel.tsx` / `web-client/src/mocks/handlers/outpatient.ts` / `tests/e2e/outpatient-generic-error-recovery.msw.spec.ts` / `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/02_汎用エラー復旧導線.md`。
- 2026-01-26: 汎用エラー復旧導線（5xx/401/403/404/network）を共通化し、再ログインCTA・空状態文言・5秒クールダウン付き再取得を ApiFailureBanner に統合（RUN_ID=20260126T063842Z）。成果物: `web-client/src/features/shared/apiError.ts` / `web-client/src/features/shared/ApiFailureBanner.tsx` / `web-client/src/features/shared/apiError.test.ts` / `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/02_汎用エラー復旧導線.md`。
- 2026-01-26: ORCA マスタの実環境フォールバック検証を実施し、`missingMaster/fallbackUsed` が正常系/フォールバック系で応答に反映されることを確認（RUN_ID=20260126T000218Z）。成果物: `artifacts/orca-preprod/20260126T000218Z/generic_class_basic_md5_http.txt` / `artifacts/orca-preprod/20260126T000218Z/generic_price_missing_md5_http.txt` / `src/orca_preprod_issue_catalog_resolution_20260123/03_orca_master/03_実環境フォールバック検証.md`。
- 2026-01-25: 患者冪等性テスト（OrcaPatientResourceIdempotencyTest/PatientModV2OutpatientResourceIdempotencyTest）を実行し、ログを保存（RUN_ID=20260125T132701Z）。成果物: `artifacts/test-logs/20260125T132701Z-patient-idempotency.log` / `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/05_患者冪等性と複合更新.md`。
- 2026-01-25: 患者作成の冪等性（既存一致は200、差分は409）と複合更新の補正/再試行ルールを確定し、/orca/patient/mutation と /orca12/patientmodv2/outpatient に idempotent 判定と競合検知を実装、単体テストを追加（RUN_ID=20260125T112249Z）。成果物: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java` / `server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java` / `server-modernized/src/main/java/open/dolphin/rest/dto/orca/PatientMutationResponse.java` / `server-modernized/src/test/java/open/dolphin/rest/orca/OrcaPatientResourceIdempotencyTest.java` / `server-modernized/src/test/java/open/dolphin/rest/PatientModV2OutpatientResourceIdempotencyTest.java` / `src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/05_患者冪等性と複合更新.md`。
- 2026-01-25: エラーバナーに runId/traceId 表示とログ共有CTAを追加し、ToneBanner の data-trace-id 付与とクリップボード共有を共通化（RUN_ID=20260125T084729Z）。成果物: `web-client/src/features/shared/ApiFailureBanner.tsx` / `web-client/src/features/reception/components/ToneBanner.tsx` / `web-client/src/libs/observability/observability.ts` / `web-client/src/libs/observability/runIdCopy.ts` / `src/orca_preprod_issue_catalog_resolution_20260123/06_error_handling/01_runId_traceId可視化.md`。
- 2026-01-24: Reception/Patients の自動更新を統一（refetchInterval/通知ルール）し、stale 警告バナーと E2E 確認を追加（RUN_ID=20260124T231620Z）。成果物: `web-client/src/features/shared/autoRefreshNotice.ts` / `web-client/src/features/reception/pages/ReceptionPage.tsx` / `web-client/src/features/patients/PatientsPage.tsx` / `tests/e2e/outpatient-auto-refresh-banner.spec.ts` / `src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/02_Reception_Patients自動更新.md`。
- 2026-01-21: Charts 部位検索の Trial 失敗要因（認証経路と etensu 503）を整理し、ORCA master 認証ヘッダを常時送信する修正を反映（RUN_ID=20260121T062542Z）。成果物: `web-client/src/features/charts/orderMasterSearchApi.ts` / `setup-modernized-env.sh` / `docs/web-client/operations/orca-master-bodypart-trial-issue-20260121.md` / 証跡 `artifacts/webclient/orca-e2e/20260120/bodypart/trial-bodypart-20260121T062542Z.png`。
- 2026-01-15: Webクライアント/サーバー間のAPI接続状況を調査し、ORCA互換API（旧）と新APIの統合計画を策定（RUN_ID=20260115T195100Z）。成果物: `docs/server-modernization/phase2/notes/api-architecture-consolidation-plan.md`（※API移行の正本ドキュメント）。
- 2026-01-14: Touch/ADM/PHR API の Administration 導線を追加し、主要 endpoint の疎通確認・stub 表示・監査ログを整備（RUN_ID=20260114T145507Z）。成果物: `web-client/src/features/administration/touchAdmPhrApi.ts` / `web-client/src/features/administration/TouchAdmPhrPanel.tsx` / `web-client/src/features/administration/AdministrationPage.tsx` / `web-client/src/features/administration/administration.css` / `web-client/src/features/administration/__tests__/TouchAdmPhrPanel.test.tsx` / `docs/web-client-unused-features.md` / `docs/web-client/ux/ux-documentation-plan.md` / `src/touch_adm_phr/06_Touch_ADM_PHR_API整備.md`。
- 2026-01-14: Administration 画面に Legacy REST 互換 API の通常導線を追加し、system_admin 向けの 2xx/4xx 判定 UI と監査ログ（legacy=true, endpoint 明示）を実装。UI テストと実疎通証跡を追加（RUN_ID=20260114T135802Z）。成果物: `web-client/src/features/administration/LegacyRestPanel.tsx` / `web-client/src/features/administration/__tests__/LegacyRestPanel.test.tsx` / `web-client/src/features/administration/AdministrationPage.tsx` / `artifacts/webclient/legacy-rest/20260114T135802Z/legacy-rest-admin-check.md`。
- 2026-01-14: Legacy REST 互換 API の debug 導線（/debug/legacy-rest）を追加し、2xx/4xx 判定 UI・content-type 切替（テキスト/JSON/バイナリ）・監査ログ legacy タグを実装。Legacy REST API モジュール/画面/テスト/ドキュメントを更新（RUN_ID=20260114T134736Z）。成果物: `web-client/src/features/debug/legacyRestApi.ts` / `web-client/src/features/debug/LegacyRestConsolePage.tsx` / `web-client/src/features/debug/__tests__/LegacyRestConsolePage.test.tsx` / `docs/web-client-unused-features.md` / `docs/web-client/architecture/web-client-api-mapping.md` / `docs/web-client/ux/ux-documentation-plan.md` / 証跡 `artifacts/webclient/legacy-rest/20260114T134736Z/legacy-rest-ui-check.md`。
- 2026-01-14: ORCA内製ラッパー（stub混在）の判定強化・UIガイダンス補強・テスト拡充と UX 文書追記を実施（RUN_ID=20260114T131947Z）。成果物: `web-client/src/features/administration/orcaInternalWrapperApi.ts` / `web-client/src/features/administration/orcaInternalWrapperApi.test.ts` / `web-client/src/features/administration/AdministrationPage.tsx` / `docs/web-client/ux/ux-documentation-plan.md`。
- 2026-01-14: ORCA内製ラッパー（stub混在）向けに Webクライアントの API モジュールと Administration 導線を追加し、stub/実データ表示・runId/traceId/missingMaster/fallbackUsed 透過・例外メッセージ表示を整備（RUN_ID=20260114T124623Z）。成果物: `web-client/src/features/administration/orcaInternalWrapperApi.ts` / `web-client/src/features/administration/orcaInternalWrapperApi.test.ts` / `web-client/src/features/administration/AdministrationPage.tsx`。
- 2026-01-14: ORCA公式XMLプロキシのエラー詳細（HTTP/パース失敗）補強とテスト追加、.npm-cache汚染の除去を実施（RUN_ID=20260114T110700Z）。成果物: `web-client/src/features/administration/orcaXmlProxyApi.ts` / `web-client/src/features/administration/orcaXmlProxyApi.test.ts` / `web-client/src/features/administration/AdministrationPage.tsx` / `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`。
- 2026-01-14: ORCA公式XMLプロキシ（acceptlstv2/system01lstv2/manageusersv2/insprogetv2）のWebクライアント連携を追加し、XML2送信・HTTPステータス/Api_Result表示・エラー詳細/再送導線・runId/traceId透過を整備（RUN_ID=20260114T070545Z）。成果物: `web-client/src/features/administration/orcaXmlProxyApi.ts` / `web-client/src/features/administration/AdministrationPage.tsx` / `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`。
- 2026-01-14: 予約・受付・請求試算 JSON ラッパーの RUN_ID 更新と traceId 監査補強・テスト強化を実施（RUN_ID=20260114T035009Z）。成果物: `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java` / `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaAppointmentResourceTest.java` / `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaVisitResourceTest.java` / `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`。
- 2026-01-14: 予約・受付・請求試算 JSON ラッパーの予約日レンジ許容とテスト整備を実施（RUN_ID=20260114T020321Z）。成果物: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaAppointmentResource.java` / `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java` / `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaAppointmentResourceTest.java` / `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaVisitResourceTest.java` / `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`。
- 2026-01-13: Webクライアント未活用機能一覧（参照経路付き）をドキュメント化（RUN_ID=20260113T225321Z）。成果物: `docs/web-client-unused-features.md`。
- 2026-01-13: ORCA 追加 API の Web クライアント接続タスク前提ドキュメントを整理（RUN_ID=20260113T072212Z）。成果物: `docs/web-client-orca-additional-api-task-prerequisites.md`。
- 2026-01-13: ORCA 追加 API の Web クライアント接続計画を整理し、ドキュメント化（RUN_ID=20260113T064654Z）。成果物: `docs/web-client-orca-additional-api-plan.md`。
- 2026-01-13: ORCA 追加 API リストのドキュメント反映（patientgetv2 の class/format 仕様追記）を実施（RUN_ID=20260113T051333Z）。
- 2026-01-13: ORCA 追加 API の残件対応（patientgetv2 class クエリ対応、pusheventgetv2 冪等化、必須フィールド検証拡充、Api_Warning_Message 伝達）を反映（RUN_ID=20260113T045402Z）。
- 2026-01-13: ORCA 追加 API 実装の評価指摘対応（Basic認証必須化、/api付与OFFスイッチ、必須フィールド検証拡充、Api_Result 正規化/Warningヘッダ、結合テスト強化）を反映（RUN_ID=20260113T044027Z）。
- 2026-01-12: ORCA 追加 API（tmedicalgetv2/medicalmodv23/incomeinfv2/subjectives*/contraindicationcheckv2/medicationgetv2/medicatonmodv2/masterlastupdatev3/systeminfv2/system01dailyv2/insuranceinf1v2/medicalsetv2/pusheventgetv2 と帳票群）を modernized server に追加し、OrcaHttpClient と帳票 blobapi(PDF抽出) を実装（RUN_ID=20260112T231511Z）。
  - 追加ドキュメント: `docs/server-modernization/orca-additional-api-implementation-notes.md`
- 2026-01-12: ORCA追加API（patientgetv2/patientmodv2/patientlst7v2/patientmemomodv2/diseasegetv2/diseasev3/medicalgetv2/medicalmodv2）の modernized server 経由疎通を実施（RUN_ID=20260112T115537Z）。
  - 起動: `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19082 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55440 MINIO_API_PORT=19102 MINIO_CONSOLE_PORT=19103 ./setup-modernized-env.sh`
  - 結果: patientmodv2 は Api_Result=00（登録終了）、patientmemomodv2 は ORCA 側 502 で 500。その他は患者未登録により Api_Result=10/E10/01 を確認。
  - 追試: patientId=00002 の再送でも patientmemomodv2 は 502 のまま、medicalmodv2 は Api_Result=01（患者番号未設定）。
  - 追試2: medicalmodv2 を公式仕様の medicalreq/Diagnosis_Information 構造で再送し Api_Result=00、patientmemomodv2 は WebORCA Trial 直送でも 502 を確認。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260112T115537Z-orca-additional-api-smoke.md` / `artifacts/orca-connectivity/20260112T115537Z/`
- 2026-01-12: WebORCA Trial の systeminfv2 を取得して patientmemomodv2 の未搭載可能性を確認（RUN_ID=20260112T135435Z）。
  - 結果: Local_Version は S-050200-1-20250327-1、Api_Result=0006（リクエスト時刻ずれ）を確認。2025-08-26 の患者メモ登録API追加時期より前と推定されるため、Trial 側未搭載の可能性が高い。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260112T135435Z-orca-systeminfv2-trial.md` / `artifacts/orca-connectivity/20260112T135435Z/`
- 2026-01-12: WebORCA Trial 公式 API への再疎通を実施し、/api/api01rv2/system01lstv2・/api/orca101/manageusersv2・/api/api01rv2/acceptlstv2 が HTTP 200 で応答することを確認（RUN_ID=20260112T060857Z）。
  - 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（server-modernized 再ビルド後に再起動）
  - 結果: system01lstv2 class=02 は Api_Result=00、manageusersv2 は Api_Result=0000、acceptlstv2 class=01 は Api_Result=21（受付なし）。
  - 帳票: prescriptionv2 は Trial 側の処方データ不足により Api_Result=0001（帳票データなし）。medicalmodv2 登録と medicalgetv2/visitptlstv2 の再確認を実施したが Data_Id 取得は未到達。
  - Vite dev proxy: `web-client/vite.config.ts` で `/api` を Trial へ転送する設定を維持（`/api` 経由が正）。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260112T060857Z-orca-trial-official-api.md` / `docs/server-modernization/phase2/operations/logs/20260112T060857Z-orca-trial-handover.md` / `artifacts/orca-connectivity/20260112T060857Z/`
- 2026-01-12: WebORCA Trial 公式 API の疎通を再検証し、/api/api01rv2/system01lstv2・/api/orca101/manageusersv2・/api/api01rv2/acceptlstv2 が HTTP 200 で応答することを確認（RUN_ID=20260112T004756Z）。
  - 起動: `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19182 MODERNIZED_APP_ADMIN_PORT=19998 MODERNIZED_POSTGRES_PORT=55440 MINIO_API_PORT=19102 MINIO_CONSOLE_PORT=19103 ./setup-modernized-env.sh`
  - 結果: system01lstv2 class=02 は Api_Result=00、manageusersv2 は Api_Result=0000、acceptlstv2 class=01 は Api_Result=21（受付なし）。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260112T004756Z-orca-trial-official-api.md` / `artifacts/orca-connectivity/20260112T004756Z/`
- 2026-01-11: Webクライアントの ORCA Trial プロキシ到達性を確認（RUN_ID=20260111T235603Z）。
  - 設定: `VITE_DEV_PROXY_TARGET=https://weborca-trial.orca.med.or.jp` + Basic `trial/<MASKED>`、`web-client/vite.config.ts` に `/orca` プロキシを追加。
  - 結果: Webクライアント dev server から ORCA Trial まで到達し、Trial 側の 404/405 を受領。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T235603Z-webclient-orca-trial-proxy.md` / `artifacts/orca-connectivity/20260111T235603Z/`
- 2026-01-11: WebORCA Trial へ未解放/認証不一致 API を再送（RUN_ID=20260111T235146Z）。
  - 送信先: `https://weborca-trial.orca.med.or.jp`（Basic `trial/<MASKED>`）
  - 結果: /api/orca/master/* は 502、/orca/master/* と /orca/tensu/etensu は 404、/orca/system/* と /orca/report/print は 405。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T235146Z-orca-unopened-auth-retest-trial.md` / `artifacts/orca-connectivity/20260111T235146Z/`
- 2026-01-11: 未解放/認証不一致とされていた API への再送を実施（RUN_ID=20260111T231621Z）。
  - 起動: 既存の modernized server 起動状態で実施（ベース `http://localhost:19082/openDolphin`）。
  - 結果: /api/orca/master/* は Basic 認証でも 404、/orca/tensu/etensu は 401、/orca/master/* /orca/system/* /orca/report/print は 404。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T231621Z-orca-unopened-auth-retest.md` / `artifacts/orca-connectivity/20260111T231621Z/`
- 2026-01-11: ORCA Trial Karte 自動生成の実装と実測を完了（RUN_ID=20260111T221350Z）。
  - 起動: `MODERNIZED_APP_HTTP_PORT=19082 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55436 MINIO_API_PORT=19002 MINIO_CONSOLE_PORT=19003 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 結果: /orca/patient/mutation の Karte 自動生成を追加し、/orca/disease /orca/disease/v3 /orca/medical/records が 200 で正常応答。d_karte_seq 不足により 500 が発生したため起動スクリプトでシーケンス作成を追加して再測。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md` / `artifacts/orca-connectivity/20260111T221350Z/`
- 2026-01-11: ORCA Trial 500 継続 API の原因解析と再実測を実施（RUN_ID=20260111T215124Z）。
  - 起動: `MODERNIZED_APP_HTTP_PORT=19082 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55434 MINIO_API_PORT=19002 MINIO_CONSOLE_PORT=19003 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 結果: /orca/disease* は Karte 未生成のため d_diagnosis の NOT NULL 制約違反、/orca/medical/records は karte null 参照で NPE。/orca/patients/batch と /orca/billing/estimate は ORCA Trial 側が 500（patientlst2v2 / acsimulatev2）。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md` / `artifacts/orca-connectivity/20260111T215124Z/`
- 2026-01-11: ORCA Trial 失敗系 API の再測を実施（RUN_ID=20260111T214707Z）。
  - 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 結果: /orca/patient/mutation で患者作成後も /orca/medical/records /orca/disease* /orca/billing/estimate /orca/patients/batch が 500 のまま。セッション/実装側例外の可能性が高い。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T214707Z-orca-trial-retest.md` / `artifacts/orca-connectivity/20260111T214707Z/`
- 2026-01-11: ORCA Trial 未確認 API の再実測と DB 初期化を実施（RUN_ID=20260111T213428Z）。
  - 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（起動スクリプトで Legacy schema dump を適用）
  - 結果: /orca/appointments/*, /orca/visits/*, /orca/patients/* の一部で 200 を確認。/api/orca/master/* と /orca/tensu/etensu は Basic 認証必須で 401、/orca/master/* と /orca/report/print /orca/system/* は 404。/orca/billing/estimate /orca/disease* /orca/medical/records /orca/patients/batch は facility/patient 紐付け不足で 500。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md` / `artifacts/orca-connectivity/20260111T213428Z/`
- 2026-01-11: ORCA Trial 未確認 API の実測を実施（RUN_ID=20260111T205439Z）。
  - 起動: `OPENDOLPHIN_SCHEMA_ACTION=create WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 結果: DB スキーマ未初期化（`d_audit_event` 不在）により全 API が HTTP 500。Trial 制約判定・Api_Result 確認は未到達。
  - 証跡: `docs/server-modernization/phase2/operations/logs/20260111T205439Z-orca-trial-coverage.md` / `artifacts/orca-connectivity/20260111T205439Z/`
- 2026-01-11: WebORCA Trial 向けサーバー起動と疎通確認を実施（RUN_ID=20260111T001750Z）。
  - 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - 疎通コマンド（Basic 認証は `<MASKED>`）:
    - `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/44_system01dailyv2_request.xml https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2`
    - `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @/tmp/orca-trial-20260111T001750Z/visitptlstv2_request.xml https://weborca-trial.orca.med.or.jp/api/api01rv2/visitptlstv2`
    - `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @/tmp/orca-trial-20260111T001750Z/acceptmodv2_request.xml https://weborca-trial.orca.med.or.jp/api/orca11/acceptmodv2`
  - 結果: すべて HTTP 200 かつ XML 応答を確認。
    - system01dailyv2: Api_Result=00
    - visitptlstv2: Api_Result=13（データなし）
    - acceptmodv2（Request_Number=00）: Api_Result=10（データなし）
- 2026-01-10: Charts 画面のコンパクトレイアウト/共通化提案をドキュメント化（RUN_ID=20260110T214118Z）。
- 2026-01-10: Webクライアント互換 API（/api/admin/*, /api/orca/queue, /orca/appointments/list, /orca12/patientmodv2/outpatient）のレスポンス整合と運用ヘッダを整備し、成功/失敗ケースを記録（RUN_ID=20260110T212643Z）。
- 2026-01-06: Webクライアント画面構成の決定事項をドキュメント化し、ナビ/ルーティングの反映先を整理（RUN_ID=20260106T120500Z）。
- 2026-01-06: Webクライアント画面構成の決定版作業計画を作成（RUN_ID=20260106T042520Z）。
- 2026-01-04: 病名の diagnosisName 空文字拒否の監査/レスポンス検証を拡張し、空文字を 400 + 監査拒否理由として記録（RUN_ID=20260104T204136Z）。
- 2025-12-28: セッション切れ通知の統一と監査ログマスキングを追加（RUN_ID=20251228T204651Z）。
- 2025-12-28: 配信バナーの即時反映を Reception/Charts/Patients へ拡張し、runId/aria-live を統一（RUN_ID=20251228T104911Z）。
- 2025-12-28: Administration 画面の system_admin ガード明示/監査ログ/不正操作メッセージ/導線を整備（RUN_ID=20251228T094553Z）。
- 2025-12-28: Charts→Patients の returnTo フォールバックと kw 優先度仕様化、誤操作防止バナー補強（RUN_ID=20251228T094336Z）。
- 2025-12-28: Charts→Patients の戻りURL保持と受付フィルタ同期、誤操作防止バナーを追加（RUN_ID=20251228T091828Z）。
- 2025-12-28: 配信キュー警告判定の共通化と queueStatus ブロードキャスト/監査ログ要約を拡充（RUN_ID=20251228T092829Z）。
- 2025-12-28: 配信キュー監視の遅延閾値/警告バナーと再送・破棄の監査ログ/Reception・Charts ブロードキャストを追加（RUN_ID=20251228T084546Z）。
- 2025-12-28: Patients 右ペイン編集フォームの監査ログビュー統合/ORCA反映状態可視化/missingMaster編集ブロック理由表示を実装（RUN_ID=20251228T084215Z）。
- 2025-12-28: 設定配信フォームのバナー凡例追加/ORCA queue 操作の admin/delivery 監査追記/バナーテスト更新（RUN_ID=20251228T081440Z）。
- 2025-12-28: 設定配信フォームの配信状態根拠明示/環境優先順/バナー短縮ラベル/監査 payload 補強とテスト追加（RUN_ID=20251228T053045Z）。
- 2025-12-28: Charts 承認ロック解除導線（二重確認）と解除監査ログを整備（RUN_ID=20251228T042200Z）。
- 2025-12-28: Charts 承認/ロック状態の可視化と解除監査ログを整備（RUN_ID=20251228T015915Z）。
- 2025-12-28: Charts 印刷導線のガード理由可視化と確認モーダルのテスト補強を追加（RUN_ID=20251228T014700Z）。
- 2025-12-28: Charts 印刷/エクスポートの確認モーダル/復旧導線/監査ログとガード条件を整備（RUN_ID=20251228T011746Z）。
  - 出力前確認と失敗時の復旧導線を追加し、印刷の approval/do/lock を auditEvent に記録。
  - ChartsActionBar の印刷ガードを送信条件から分離し、missingMaster/fallback/権限のみで制御。
- 2025-12-28: Charts の監査イベント重複防止/lockStatus 整合/URL切替ログ/blocked理由の補強を追加（RUN_ID=20251228T005005Z）。
- 2025-12-28: Charts の重要操作で auditEvent/UI ログの operationPhase(approval/lock/do) を統一（RUN_ID=20251228T001604Z）。
- 2025-12-28: Charts の Appointment 監査ログに screen=charts を反映し、appointment meta の最新選定を安定化（RUN_ID=20251228T000144Z）。
- 2025-12-27: Charts 病名/処方/オーダー編集の readOnly/監査/バリデーション整備（RUN_ID=20251227T213517Z）。
  - 右パネル編集は master未同期/フォールバック/タブロック時に編集ブロックし、理由を明示。
  - 病名/処方/オーダーの監査イベントに更新内容と runId 等の観測メタを統一して記録。
  - ORCA 疾患/オーダー束 API に入力バリデーションを追加し、レスポンス runId を揃えた。
- 2025-12-27: Charts 右固定メニューからの病名/処方/オーダー編集とAPI連携を追加（RUN_ID=20251227T154003Z）。
  - 病名編集パネルで主/疑い/開始/転帰を編集し、/orca/disease へ反映・監査イベント記録を実装。
  - 処方（RP）/オーダー束の編集パネルと /orca/order/bundles API を追加し、作成/更新/削除と監査ログを実装。
- 2025-12-27: SOAP記載ログ/テンプレ挿入/監査イベント/履歴永続化のブラッシュアップを実装（RUN_ID=20251227T144854Z）。
  - SOAP テンプレ挿入の監査イベント追加、保存/更新の監査詳細メタ強化、SOAP履歴の sessionStorage 永続化と容量管理を実装。
  - 患者切替時の未保存ドラフトブロックを強化し、SOAP履歴のタイムライン反映テストを追加。
- 2025-12-25: WebClient 前提 API 実装切替のローカル疎通を再検証（RUN_ID=20251225T105103Z）。
  - 期待条件（HTTP 200 / runId / dataSourceTransition / auditEvent）を満たすのは `dolphindev` の MD5 (`1cc2f4c06fd32d0a6e2fa33f6e1c9164`) を使った場合。
  - 手順のパスワード記載を `src/server_modernized_gap_20251221/06_server_ops_required/WebClient前提API_実装切替.md` へ反映済み。

## 懸念点（要確認）
- テスト未実施: 病名/処方/オーダーの CRUD と監査ログの実運用確認がない。E2E/統合テストの証跡がなく、本番運用レベルの保証に欠ける。
- 実機連携の未確認: ORCA 実環境での動作確認が未実施（認証・データ反映・監査ログ到達の確認が必要）。
- 入力バリデーションの妥当性: server-modernized 側は operation/entity 等のバリデーションを強化したが、病名の必須項目や空文字制御が API 側でどこまで保証されるかは要確認。
- readOnly の伝播確認: UI はブロックするが、sidePanelMeta が常に readOnly/missingMaster/fallback を正しく反映しているか、実運用での状態遷移確認が必要。
