# 08 Patients と Administration UI構成方針

- RUN_ID: `20251127T133000Z`
- 期間: 2025-11-29 09:00 〜 2025-12-02 09:00 (JST)
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- スコープ: PatientsPage/PatientEditorPanel と UserAdministration 系画面の UI 要件・データ権限・ORCA マスター/PHR 連携を並列に整理し、`docs/web-client/ux/management-ui-guide.md`（バッジ/バナー/トーストの tone）との整合と記録を残す。並列比較表を本稿で追加し、証跡に `docs/web-client/ux/patients-admin-ui-policy.md` を明記。

## 1. UI 担当領域と API 架構のパラレル比較
以下の表は Patients 系ページと管理系ページで共通して必要になる観点を横並びに整理したものです。各行とも `docs/web-client/architecture/ui-api-mapping.md` に記載された `StatusBadge`/`SurfaceCard` の汎用パターンと、`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の ORCA master ブリッジ設計を参照しています。

| 観点 | PatientsPage / PatientEditorPanel | UserAdministrationPage + 系統管理 |
| --- | --- | --- |
| 画面・コンポーネント | `PatientsPage` で `SurfaceCard` を段組みし、`PatientEditorPanel` で検索結果と詳細カードを同列表示。`Stack` と `StatusBadge` で状態を収束し、`PatientEditorPanel` に `SurfaceCard` と `Stack` のマージンを揃える。画面遷移は `web-client/src/app/router.tsx` で `<RequireAuth>` 内に収め、`/patients` を Suspense 経由で描画。 | `UserAdministrationPage`・`SystemPreferencesPage`・`PatientDataExportPage` は `RequireRole(['admin'])` でガードされた `/administration/*` 下に収まる。`SurfaceCard`＋`Stack` でフォーム/テーブルを整形し、管理系サイドバーや System Preferences のステータスバナーへ `StatusBadge` を連携する。 |
| 検索・詳細・編集 | `patient-api.ts` の `searchPatients`（`/patient/{name|kana|id|digit}`）で複数モード検索を切り替え、結果は `PatientEditorPanel` へ流し込む。`transformPatient` → `PatientDetail` → `buildUpsertRequestPayload` で `PUT /patient` へ整形し、`memo`・`healthInsurance` などのブロックを `SurfaceCard` セクションに分ける。 | `user-api` の CRUD と `phr-api.ts` の PHR データ取得 (`/20/adm/phr/*`) を組み合わせて、ユーザー一覧・ロール変更・PHR キー登録・テキスト取得を実装。`SystemPreferencesPage` では `phr-text` をバナー/タブへ注入し、`PatientDataExportPage` では `/patient/all` 等によるエクスポートを `SurfaceCard` と `StatusBadge` で制御。 |
| ユーザー/PHR 管理 | 患者詳細カードで保険・住所・メモを表示し、`PatientEditorPanel` 内に `healthInsurances` の `beanBytes` を列挙。`PatientEditorPanel` から `recordOperationEvent` を呼び `patient` ドメインの監査を残す。 | `phr-api` は `fetchPhrKeyByPatientId`/`fetchPhrContainer`/`fetchPhrText` で ORCA PHR (PHR-01~11) を取得・更新し、`upsertPhrKey` で `recordOperationEvent('administration', 'info', 'phr_key_upsert', …)` を実行。ユーザー一覧では `user-api` の `Facility` 情報と `StatusBadge` でロールを可視化。 |
| ORCA master / PHR ブリッジ | 患者詳細/カルテ更新では `resolveMasterSource` → `fetchOrcaMaster`（ORCA-05/06/08）を組み込んで `dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed` を付与。`PatientEditorPanel` は保存前に `missingMaster`/`masterRequiredFields` をチェックし、欠落時に `warning` 或いは `danger` のバナーを出す。 | 管理コンソールの `phr-api` や `patient-api` は同様のブリッジ層で ORCA master ソース（ステータス付き）を参照し、`PHR` キーやテキスト取得が `missingMaster=true` になる場合にログ `audit.logValidationError` をトリガ。ブリッジ設計は `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の fetch adapter / cache & versioning を踏襲。 |
| データ権限・ロール | `RequireAuth` ⇔ `session` ベース。患者情報は `auth` セッションを持つ診療/受付スタッフが利用し、`PatientEditorPanel` は `fullName`/`gender` などの必須項目を取得して UI へ注入。 | `RequireRole(['admin'])` をおり、管理者のみ `user-api`/`phr-api` を呼べる。`UserAdministrationPage` では `Role Badge` を `StatusBadge` で表示し、権限の振り分け・施設設定・PHR キー更新の audit を明示。 |
| ステータスバッジ・バナー・トーストのトーン | `StatusBadge` は `danger` を安全警告、`warning` を注意、`info` を通常に使う（`docs/web-client/architecture/ui-api-mapping.md` の tone ガイド参照）。`PatientEditorPanel` の状態（入力中/保存済/警告）に応じて `SurfaceCard` ヘッダーに `StatusBadge` を置き、`Toast` も `danger`/`warning` を採用。 | 管理画面ではステータスバナー/Toast も同じ palette を共有し、ライセンス送信成功 `info`、失敗 `danger`、PHR 検索で一致数ゼロは `warning`。`docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` で示される palette と `docs/web-client/ux/management-ui-guide.md` の tone 規約（バナー＝注意系 `warning`・トースト＝成功/失敗）と一致させる。 |
| 保存前チェック・警告 | `PatientEditorPanel` で `healthInsurances` の `beanBytes` や `address` フィールドをトリム検証し、`missingMaster`/`tensuCodeMissing` が `true` なら保存ブロック。`phr-api` 連携前に `PatientDetail.raw` の `reserve` 系フィールドを整形し、`recordOperationEvent('patient', 'warning', …)` でログを残す。 | `phr-api` で `normalizeDateTime` 後の `registeredString` のバリデーション、`PatientDataExport` の `GET /patient/count/{prefix}` による行数警告、`SystemPreferences` の ORCA 接続ステータス `StatusBadge` を事前チェック。`missingMaster`/`fallbackUsed` を検知した場合は `warning` バナーで `masterSource` の遷移を通知（Bridge risk table 参照）。 |

## 2. ORCA master / PHR ブリッジ設計の共通パターン
- `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` に定義された `resolveMasterSource` → `fetchOrcaMaster` → `React Query TTL=5分` のチェーンを, Patients-/Administration 系の `patient-api.ts`/`phr-api.ts` に共通で採用。`dataSourceTransition`/`fallbackUsed`/`missingMaster` を必須フィールドとし、UI は `runId`/`version` を `StatusBadge` の補助テキストまたは `Toast` に含めて監査メタを可視化。
- `phr-api` は `GET /20/adm/phr/*` のレスポンスを `normalizeDateTime` で整形し、`recordOperationEvent('administration', 'info', 'phr_container_fetch', …)` を呼んで監査ログを残す。`fetchPhrText`/`fetchPhrContainer` の結果は `StatusBadge` の `tone='warning'` を使って PHR の欠損を知らせると同時に `missingMaster=true` を audit 送信。
- `patient-api` では `transformPatient`→`transformPatientDetail` で ORCA master 由来のコード（保険者コード/住所/tensuCode）を抽出し、保存前に `masterRequiredFields` チェック（例: `tensuCode` が空なら `tensuCodeMissing=true`）を走らせる。失敗時は `warning` トースト + `StatusBadge tone='danger'` を表示してユーザーに修正を促し、保存 API 呼び出しをキャンセル。
- `PatientDataExportPage` / `SystemPreferencesPage` では `bridge-sync` (`node scripts/bridge-sync.mjs`) を実行した最新ハッシュ・diff を `docs/web-client/planning/phase2/DOC_STATUS.md` に記録し、UI は `runId`/`version` を `InfoBanner` に掲載して "どの master ソースを使ったか" を明示。

## 3. 保存前チェックリストと警告 UI のトリガ
- ORCA-05/06/08の `missingMaster`/`fallbackUsed` を React Query ミドルで常に確認し、`warning` バナーを先行表示。保存ボタンは `masterRequiredFields` が揃っていることを前提に有効化し、欠落時は `Toast` で「ORCA マスターが未提供のため保存できません」として `audit.logValidationError` の `valueBefore` を添える。
- `healthInsurances.beanBytes` の有無、住所の `zipCode`/`address` の `trim`、`kanaName` の `normalization` を `patient-api` 内で単一の変換関数にまとめ、`SurfaceCard` の `Health Insurance` セクションに `StatusBadge tone='warning'` で欠落を示す。
- `phr-api` 側では `PhrKeyUpsertPayload` の `facilityId`/`patientId`/`accessKey` が必須かつ `registeredString` が ISO 19 文字であるかを検証し、不正な値は `warning` toast + `StatusBadge tone='danger'` で `UserAdministrationPage` へ返す。
- ORCA master を使う `PatientEditorPanel` では `fetchOrcaMaster` の `dataSource` 変化（MSW→snapshot→server）を `StatusBadge` で表示し、`dataSourceTransition` が server 以外に巻き戻った場合は `warning` バナー/トーストで「最新 master 取得にリトライ中」と通知し、`docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md` の `warning banner tone` 管理と一致させる。

- 20251127T170500Z: `PatientEditorPanel` は `SurfaceCard` + `StatusBadge` で ORCA master readiness を可視化し、住所・保険情報（保険者番号/記号/番号/区分コード）が揃うまでは保存ボタンを無効化して `warning` バナーを表示することで masterRequiredFields の整備を強制します。実装証跡: `web-client/src/features/patients/components/PatientEditorPanel.tsx`。DOC_STATUS（Phase2 Planning/UX 行）と README の RUN_ID セクションにも本 RUN を追記してください。

## 4. 管理性向上のトーンとメッセージ整合
- `StatusBadge` の tone（`danger`=即時注意 / `warning`=注意 / `info`=正常）は `docs/web-client/architecture/ui-api-mapping.md` で定義されたコンポーネント標準と同様。`PatientEditorPanel` でも `StatusBadge` を `SurfaceCard` ヘッダーに置くことで患者ステータスを色相で伝える。
- トースト/バナーは `docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` にあるカテゴリ分け `neutral/info/warning/danger` を踏襲し、`management-ui-guide` に従って `warning` バナーは ORCA master fallback ・ `danger` toast は保存エラーと紐づける。Badge/Toast/Banner は同じ `tone` を共有することで監査ログとの整合性を保つ。
- 管理者 UI では `StatusBadge` に `roles`/`license/state` を紐づけ、`Toast` では `phr-api` の `recordOperationEvent` メッセージを再利用。ORCA master 取得の `missingMaster` が `true` の場合、`SystemPreferencesPage` の `StatusBadge` を `tone='warning'` に切り替え、`docs/web-client/ux/management-ui-guide.md` のトーンガイドへも追記する（必要に応じて `management-ui-guide` を新規作成・参照確定）。

## 5. 次の調整
- 本ドキュメントを `docs/web-client/README.md` の UX セクションへ追記し、`docs/web-client/planning/phase2/DOC_STATUS.md` で Active 行を更新（RUN_ID=`20251127T133000Z`）。`docs/web-client/ux/management-ui-guide.md` が整備されたら、バッジ/トースト/バナーの tone セクションをリンクし、必要なら `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` へも記録する。
