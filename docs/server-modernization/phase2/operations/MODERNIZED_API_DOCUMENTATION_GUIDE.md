# モダナイズ版サーバー API ドキュメント集約ガイド（2025-11-14）

## 1. 目的とスコープ
- モダナイズ版サーバー（WildFly 27 / Jakarta EE ベース）の REST API および ORCA 連携 API に関する一次資料を一か所に集約し、担当者が最新状況へ即アクセスできるようにする。
- 本ガイドは既存ドキュメントの置き場と役割を「ナビゲーションレイヤー」として整理し、実装進捗や現状の課題を常に把握できるよう補助する。個別 API の詳細仕様・テスト手順は従来ドキュメントを参照する。

## 2. クイックリファレンス
| 区分 | ドキュメント | 主な内容/使いどころ | 更新メモ |
| --- | --- | --- | --- |
| 実装リスト | [`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`](../../MODERNIZED_REST_API_INVENTORY.md) | モダナイズ済み REST リソースの網羅表。HTTP メソッド/パス/主処理/該当ソースを掲載。 | 2026-XX-XX テンプレだが、行単位で毎スプリント更新。新規 API を追加したら最初にここへ反映する。
| 旧仕様参照 | [`docs/server-modernization/server-api-inventory.{md,yaml}`](../../server-api-inventory.md) | 旧サーバー REST API の一覧（Markdown + OpenAPI 3.0.3）。既存クライアント互換や後方互換性検討時に参照。 | `server-api-inventory.yaml` は `ops/tests/api-smoke-test/api_inventory.yaml` から自動生成。更新時は両方を同期させる。
| モダナイズ方針 | [`docs/server-modernization/rest-api-modernization.md`](../../rest-api-modernization.md) | OpenAPI 整備方針、Jakarta 置換ポリシー、SSE など新機能設計。 | 新しい設計決定（JWT/FIDO2 など）を行ったら §5 以降へ追記し、下記マトリクスへリンクする。
| パリティ管理 | [`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`](../domains/API_PARITY_MATRIX.md) | レガシー vs モダナイズの 1:1 対応状況。件数集計とリソース別進捗を保持。 | 2025-11-03 集計。証跡が揃い次第、◎/△/✖ を更新する。差分が多い場合は `MODERNIZED_REST_API_INVENTORY` もセットで更新。
| ORCA ラッパー設計 | [`docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md) | ORCA-REST-01/02 スプリントの API スコープ、DTO 追加、サービス側フック整理。 | Sprint2 用のソース・DTO 追加時はここでタスク番号（ORCA-REST-01/02）と Runbook 参照を更新。
| ORCA API 実測ステータス | [`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`](ORCA_API_STATUS.md) | WebORCA トライアル API の結果表。手順はすべて Single Playbook（下行）へ委譲。 | 差分 RUN_ID を追記し、各行から Playbook §0 への参照を付ける。
| 接続手順/Runbook | [`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`](ORCA_CONNECTIVITY_VALIDATION.md) | **Single Playbook**。RUN_ID 発行テンプレ（§0.1）、Evidence/ログ保存（§0.2）、`tmp/orca-weekly-summary.*` 貼り付け位置（§0.3）、curl 雛形（§0.4）を含む。 | 手順変更や RUN_ID 追加時はここを最優先で更新し、他ドキュメントはリンクのみ維持する。
| 実測ログ | `docs/server-modernization/phase2/operations/logs/<DATE>-orca-connectivity.md`（例: [`2025-11-13-orca-connectivity.md`](logs/2025-11-13-orca-connectivity.md)） | 各 RUN_ID ごとの証跡・所見・課題。 | Runbook §4 のタスク完了後に必ず新規ファイルを作成。証跡パス・Api_Result・フォローアップを明記する。
| 公式仕様アーカイブ | [`docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md`](assets/orca-api-spec/README.md) | firecrawl で取得した公式 ORCA API 仕様のローカルコピー。`manifest.json` と `orca-api-matrix` の紐付けを提供。 | `assets/orca-api-spec/raw/*.md` を更新したら manifest を再生成し、ORCA_API_STATUS.md の spec 列を最新化。|

## 3. 実装スナップショット（2025-11-14 時点）
### 3.1 API カバレッジ状況
- レガシー REST エンドポイント総数: 256 件、モダナイズ側: 221 件。1:1 対応済みは 202 件で、レガシーのみ 54 件、モダナイズのみ 8 件。→詳細は `API_PARITY_MATRIX.md` 集計表を参照。
- リソース別では Admission/EHT/Karte などは完全移行済み。DemoResourceASP (15 件) と DolphinResourceASP (19 件)、PHRResource (11 件) が未移植。SystemResource の 5 件は実装済みだが運用証跡待ち。
- `MODERNIZED_REST_API_INVENTORY.md` では 17 リソースカテゴリ（User/System/ServerInfo/Patient/...）を掲載。各リソース表の「備考」欄にソースファイル行番号を記載済みのため、実装調査は当該リンクから IDE でジャンプできる。

### 3.2 ORCA 連携／新機能の位置付け

> RUN_ID テンプレ（例: `RUN_ID=20251120TrialCrudPrepZ1`）、Evidence 保存フロー、`tmp/orca-weekly-summary.*` の貼り付け位置、curl 雛形は `ORCA_CONNECTIVITY_VALIDATION.md` §0.1-§0.4 を参照。以下の API 状況表では RUN_ID と差分のみを記載する。
> RUN_ID=`20251116T173000Z`: Trial サーバーで POST/PHR API が禁止されている間は Spec-based 実装として扱い、最終段階で ORMaster／本番サーバー接続に切り替えて通信検証を行う。検証完了後に DOC_STATUS／Runbook／API_STATUS を同日更新する。
- **Spec-based API 記録手順**: `[Spec-based]` ラベルを付けた API は `coverage/coverage_matrix.md`・`blocked/README.md`・`ORCA_API_STATUS.md` の 3 点セットを同日に更新し、`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` の該当節へ final validation（Production/ORMaster での `curl -vv -u ormaster:ormaster ...` 実測予定）を追記する。DNS/TLS 証跡フォルダと `operations/logs/<RUN_ID>-prod-validation.md` のリンクを備考に記録する。
- **最終確認 RUN_ID の登録先**: 本番/ORMaster 通信検証が完了したら、`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md`（雛形: `logs/<date>-orca-prod-validation.md`）を更新し、同じ RUN_ID を `DOC_STATUS`（W22 ORCA 行）、`ORCA_CONNECTIVITY_VALIDATION.md` Blocker 行、`ORCA_API_STATUS.md` Spec 列へ反映する。
- ORCA REST ラッパー Sprint2（ORCA-REST-01/02）は予約・請求試算・患者同期 API を Jakarta REST で提供する計画。対象 API は `appointlstv2`, `appointlst2v2`, `acsimulatev2`, `visitptlstv2`, `patientlst1/2/3/6v2`, `patientmodv2`, `subjectivesv2` などで、詳細設計（Resource/Service/DTO 責務・Shift_JIS/例外処理・Runbook 紐付け）は [`ORCA_REST_IMPLEMENTATION_NOTES.md` Sprint2 節](../domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-エンドポイント設計詳細) に集約した。DTO 群は `open.dolphin.rest.dto.orca` に追加し、`AppoServiceBean`, `PatientServiceBean`, `ChartEventServiceBean` との連携を定義済み。
- SSE 化/認証ガイドラインなどの横断要件は `rest-api-modernization.md` §2-§5 に記載。JWT/TOTP/FIDO2 の要件や SSE 再接続要件は Web クライアント実装前に参照する。

## 4. 現状ステータスと課題
### 4.1 ORCA API 実測のハイライト
| ORCA API | 現状 (2025-11-14) | RUN_ID / 証跡 | 次アクション |
| --- | --- | --- | --- |
| `/api01rv2/patientgetv2` | HTTP 404。WebORCA 本番では GET ルートが閉じており、再試行しても 404 を取得する方針。 | `20251113TorcaP0OpsZ1/Z2`（`logs/2025-11-13-orca-connectivity.md`） | 404 証跡を維持し `orca-api-matrix` に記録。代替として POST 版の公開可否をサポートへ確認する。 |
| `/orca14/appointmodv2` | HTTP 405 (Allow: OPTIONS, GET)。POST 受付不可。 | `20251113TorcaP0OpsZ1/Z2`, `20251114TorcaHttpLogZ1` | モダナイズ側の `/orca/appointments/*` ラッパーを先行実装し、Web クライアントは ORCA 直呼びを避ける。 |
| `/api21/medicalmodv2` | `/api/api21/...` では HTTP 200 / `Api_Result=14`（医師未登録）、ルート直打ちは 405。DNS 解決失敗も再現。 | `20251113TorcaP0OpsZ1`, `20251113TorcaDoctorManualW60`, `20251114TorcaHttpLogZ1` | 医師 seed を整備した上で `/api/api21/...` ルートで証跡を再取得。`ServerInfoResource` で `claim.conn=server` を確認。 |
| `/orca11/acceptmodv2` | HTTP 405。POST 禁止のまま。 | `20251113TorcaP0OpsZ1/Z2`, `20251114TorcaHttpLogZ1` | 405 証跡を継続取得しつつ、Sprint3 以降の来院登録ラッパーで置換。 |
| `/api01rv2/acceptlstv2` | HTTP 200 / `Api_Result=13/21 → 00` へ改善。 | `20251113TorcaP0OpsZ1/Z2/Z3`, `20251113TorcaProdCertZ1` | seed データを Runbook §4.3 に従って維持し、Web クライアントでの受付一覧へ連携。 |

### 4.2 接続検証ログと Runbook の紐付け
- 直近 RUN_ID `20251113TorcaProdCertZ1` では TLS 相互認証・`ServerInfoResource` (`claim.conn=server`) を確認。証跡は `artifacts/orca-connectivity/20251113TorcaProdCertZ1/` に保存済み。
- RUN_ID `20251114TorcaHttpLogZ1` は DNS 解決不可→HTTP 405/404 証跡再取得タスク。`ORCA_CONNECTIVITY_VALIDATION.md` §4.4 にも反映済み。
- 接続作業は `ORCA_CONNECTIVITY_VALIDATION.md` §1-§4 の順で進め、完了後は必ず `docs/server-modernization/phase2/operations/logs/<DATE>-orca-connectivity.md` へ RUN_ID・結果・課題を記録する。

### 4.3 ORCA マスター API (/api/orca/master/*) 進捗（RUN_ID=`20251124T073245Z`）
- 認証: Basic ヘッダー `userName: 1.3.6.1.4.1.9414.70.1:admin`、`password: 21232f297a57a5a743894a0e4a801fc3`。`ORCA_MASTER_BRIDGE_ENABLED=true` / `ORCA_MASTER_AUTH_MODE=basic` 前提。
- 現状: 2025-11-26 12:24 JST に `docker compose -f docker-compose.modernized.dev.yml build server-modernized-dev` → `MODERNIZED_APP_HTTP_PORT=8000 docker compose ... up -d server-modernized-dev` で再デプロイし、`/openDolphin/resources/api/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address}`（+ `/etensu`）が Basic 認証で HTTP200/JSON（`dataSource=server`、`runId=20251124T073245Z`、`version=20251124`）を返すことを確認。証跡: `docs/server-modernization/phase2/operations/logs/20251124T073245Z-orca-master-server.md`。
- 期待スキーマ: すべて JSON 200 応答で `version` と有効期間を含める。薬剤系は最低薬価・用法・特定器材・検査区分を、保険者は区分/負担率を、住所は都道府県・市区町村・郵便番号を返す。

| Path | 必須フィールド例 | 備考 |
| --- | --- | --- |
| `/api/orca/master/generic-class` | `code,name,category,validFrom,validTo,version` | 分類コード/名称と有効期間を最小セットとして返す。 |
| `/api/orca/master/generic-price` | `code,name,minPrice,unit,validFrom,validTo,version,youhouCode` | 最低薬価と単位、用法コードを必須とし、算定用の版管理に利用。 |
| `/api/orca/master/youhou` | `code,name,category,validFrom,validTo,version` | 用法コードと名称。 |
| `/api/orca/master/material` | `code,name,materialCategory,validFrom,validTo,version` | 特定器材の区分を `materialCategory` に含める。 |
| `/api/orca/master/kensa-sort` | `code,name,category,validFrom,validTo,version` | 検査区分コード。 |
| `/api/orca/master/hokenja` | `payerCode,payerName,payerType,payerRatio,validFrom,validTo,version` | 区分と負担率を明示し、空レス時も version を返す。 |
| `/api/orca/master/address` | `prefCode,cityCode,zip,addressLine,validFrom,validTo,version` | 都道府県・市区町村・郵便番号を必須とし、テキスト住所も返却。 |

## 5. 運用ルールと更新フロー
1. サーバー系資料を更新した場合は `docs/server-modernization/phase2/INDEX.md` と `docs/web-client/README.md` 双方へリンクを追加し、Web クライアント側影響を記載する（本ガイド追加も同様）。
2. `docs/web-client/planning/phase2/DOC_STATUS.md` の「モダナイズ/外部連携（ORCA）」行に本ガイドのステータスを記入し、Runbook やログとの整合を毎週確認する。
3. 新規 API 実装時は以下の順で文書を更新する:
   - `MODERNIZED_REST_API_INVENTORY.md` でエンドポイントとソース参照を追加。
   - `API_PARITY_MATRIX.md` でチェックボックスと状態ラベルを更新。
   - ORCA 連携の場合、`ORCA_REST_IMPLEMENTATION_NOTES.md` と `ORCA_API_STATUS.md` に設計と実測結果を追記し、本ガイド §4 を更新。
4. 実装/検証ログ (`logs/*.md`) を作成したら、Runbook §4 の成果物要件（curl 証跡・ServerInfoResource・Api_Result / RUN_ID）を満たしているか確認する。満たしていない場合はログへ TODO を追記し、解消後に本ガイドへ反映する。

- [x] 2025-11-14 ORCA doc refresh（#2: DOC_STATUS「モダナイズ/外部連携（ORCA）」行を Active/2025-11-14・担当=Hayato で更新し、README ORCA セクションへ §3.2 参照を追記、Runbook/ログのリンク整合を確認済み）

---
- 更新履歴: 2025-11-14（作成）。次回更新担当は Phase2 ORCA 連携オーナー（@Hayato）とし、週次棚卸しで状況をレビューする。

## 6. Demo/Dolphin/PHR ASP 再登録方針（Task-A）
2025-11-14 実施の Task-A で `open.dolphin.touch.DolphinResourceASP` / `open.dolphin.touch.DemoResourceASP` / `open.dolphin.adm20.rest.PHRResource` を `server-modernized/src/main/webapp/WEB-INF/web.xml` へ明示再登録した。API パリティ調査（`MODERNIZED_REST_API_INVENTORY.md` / `API_PARITY_MATRIX.md`）の差分をこの節に集約し、以降の設計タスクでは本節の設定値を前提にすること。

### 6.1 web.xml 依存リスト
| リソース | サーブレット登録 | 依存 context-param / 備考 |
| --- | --- | --- |
| `open.dolphin.touch.DolphinResourceASP` | `resteasy.resources` へクラス名を再追加。既存 `/resources/*` マッピング配下。 | 追加コンテキストは無しだが、`LogFilter` によるヘッダー認証を必須とし、web.xml 差分レビューを運用ルール化。 |
| `open.dolphin.touch.DemoResourceASP` | 同上。 | `touch.demo.fixedFacilityId=1.3.6.1.4.1.9414.2.100` を新設。Demo API はこの Facility を強制し、未来の JSON 化でも値を変更しない。 |
| `open.dolphin.adm20.rest.PHRResource` | 元々 RESTEasy 登録済。Task-A でヘッダー制約 context-param を追加。 | `touch.phr.requiredHeaders=X-Facility-Id,X-Touch-TraceId`。`MODERNIZED_REST_API_INVENTORY.md` §4 PHR 欠落リストの備考列に同値を追記済み。 |

### 6.2 認証ヘッダーと監査必須パラメータ
- **PHR**: すべての `/20/adm/phr/*` リクエストで `X-Facility-Id`（施設識別、`TouchAuthHandler` ガード対象）と `X-Touch-TraceId`（`LogFilter` → `TRACE_ID_ATTRIBUTE` → `PhrRequestContextExtractor`）を必須化する。`X-Touch-TraceId` は従来の `X-Trace-Id` と同一値を送る想定で、ログ集約・監査相関 ID を統一する。監査イベントは `PhrAuditHelper` を通じて既存名称（`PHR_*`）を利用する。
- **Demo**: `touch.demo.fixedFacilityId` を `TouchRequestContextExtractor` が解決した facility と突合する。DemoResource 側では Facility override を認めず、ヘッダー `X-Facility-Id` を送信した場合でも context-param 優先で固定値へ差し替える。監査は Demo 専用 `TouchAuditHelper` namespace を継続利用。
- **Dolphin**: Task-A ではヘッダー追加は行わないが、`TouchRequestContextExtractor`/`TouchAuditHelper` と `TouchAuthHandler` による `X-Facility-Id` 検証が必須前提。DolphinResourceASP の JSON 化タスクでは Demo/PHR と同じヘッダー一覧（`X-Facility-Id`, `X-Touch-TraceId`, `X-Access-Reason`, `X-Consent-Token`）を参照して設計する。

### 6.3 ドキュメントへの反映ルール
1. `MODERNIZED_REST_API_INVENTORY.md`：PHR 欠落表の備考列へ `touch.phr.requiredHeaders` を記載済み。今後も context-param を追加した場合は同表へ反映する。
2. `API_PARITY_MATRIX.md`：Demo/Dolphin/PHR 行で「RESTEasy 登録」「ヘッダー必須」のチェック欄を更新する際は本節の設定値を参照し、差分を W22 以降のレビュー議事録に残す。
3. `docs/web-client/planning/phase2/DOC_STATUS.md`：Task-A 完了後に「次回アクション」欄へ context-param 受け渡し状況を追記する（2025-11-14 更新済み）。

### 6.4 PHR テストヘッダーと監査ログ手順（Task-C 追記）
- ヘッダー必須: `touch.phr.requiredHeaders`（`X-Facility-Id`, `X-Touch-TraceId`）に加え、Touch 共通監査の推奨値として `X-Access-Reason`, `X-Consent-Token` を常時付与する。**現行の標準接続先は WebORCA Trial** であり、PHR は Trial で 404/405 となるため、**本番/証明書接続は明示指示時のみ**実施する（以下は Legacy 参照）。
  ```bash
  curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
       -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
       -H "Content-Type: application/json; charset=UTF-8" \
       -H "X-Facility-Id:${TOUCH_FACILITY_ID}" \
       -H "X-Touch-TraceId:${RUN_ID}" \
       -H "X-Access-Reason:care-plan-review" \
       -H "X-Consent-Token:${TOUCH_CONSENT_TOKEN:-na}" \
       --data-binary @payloads/phr_payload.json \
       "https://weborca.cloud.orcamo.jp/20/adm/phr/..."
  ```
- 証跡テンプレ: `artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md` を配布し、`phr-seq/` 配下に Phase-A〜F 向けフォルダ（10_key-management, 20_view-text, 30_layer-id, 40_image, 50_container, 60_export-track）と `audit/phr_audit_extract.sql` を配置する。RUN_ID 実績は `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` と `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.1 へリンクする。
- 監査ログ: `psql -f audit/phr_audit_extract.sql` で `event_id LIKE 'PHR_%' AND trace_id=:RUN_ID` を抽出し、`PHR_ACCESS_KEY_* / PHR_*_TEXT / PHR_LAYER_ID_* / PHR_SCHEMA_* / PHR_CONTAINER_* / PHR_SIGNED_URL_*` の有無を `phr-seq/logs/summary.md` へチェックボックス形式で記録する。欠落時は Pending として ORCA 週次（W22: 2025-11-14 Kickoff、次回承認 2025-11-18 09:30 JST）で承認を得る。
- レビュー導線: テンプレ作成とログ追加が完了したら `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行「次回アクション」に「PHR 証跡テンプレ準備済 / ORCA 週次で承認待ち」を記入し、Task-A/B/C のトレーサビリティを維持する。
