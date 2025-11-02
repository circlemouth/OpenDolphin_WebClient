# フェーズ2 進捗メモ (更新: 2026-05-27)

## 2025-11-02 追記: OpenPDF/FIDO2 アップデート（担当: Codex）
- ✅ `server-modernized/pom.xml` の OpenPDF を 3.0.0、BouncyCastle を 1.82 へ引き上げ。`PdfDocumentWriter`/`PdfSigningService` を `org.openpdf.*` パッケージと自前 PKCS#7 署名フローに対応させ、TSA フォールバックも維持。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` に OpenPDF/BouncyCastle のライセンス告知セクションを追加し、`DEPENDENCY_UPDATE_PLAN.md`・`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`・`LICENSE_COMPATIBILITY.md` を最新バージョンへ更新。
- ✅ Yubico WebAuthn 2.6.0 の段階付きビルダーへ追従し、`ADM20_EHTServiceBean` の `StartRegistrationOptions`／`FinishRegistrationOptions`／`AuthenticatorSelectionCriteria` 呼び出しを更新。除外クレデンシャルは `CredentialRepository` に委譲し、関連ドキュメントを刷新。
- ✅ `common` を含む ORCA 連携コードが `jakarta.mail`／`jakarta.jms` へ統一されていることを確認し、該当ドキュメントの残課題表記を修正。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカルに Maven CLI が無く `command not found`（再現）。後続ワーカーは Maven 導入後に署名／FIDO のコンパイル確認と回帰テストを実施すること。

## 2025-11-02 追記: Micrometer 移行と監査突合準備（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java` と `DatasourceMetricsRegistrar.java` を Micrometer `MeterRegistry` ベースへ移行。`MeterRegistryProducer` を追加し WildFly Micrometer レジストリを CDI から取得できるようにした。
- ✅ `docker/server/configure-wildfly.cli` に Micrometer 拡張・Prometheus レジストリ・Undertow 統計有効化コマンドを追加し、`MICROMETER_*` 環境変数でエクスポート先と間隔を調整できるようにした。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` を Micrometer 前提へ更新。監査ログとメトリクス突合の運用チェックリストを追記し、`IMPACT_MATRIX.md` のオブザーバビリティ行を更新。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカル環境に Maven CLI が無いため `command not found`。既存の Maven 未導入課題と同様に、環境整備後にビルド検証を再実施する。

## 2025-11-02 追記: CLAIM JMS 復旧と Servlet/CDI スキーマ更新（担当: Codex）
- ✅ `server-modernized/src/main/webapp/WEB-INF/web.xml` を Jakarta Servlet 6.0 スキーマへ更新し、RESTEasy フィルタ/サーブレットの `async-supported` 設定が最新仕様に沿うよう調整。
- ✅ `server-modernized/src/main/webapp/WEB-INF/beans.xml` を CDI 4.0 (`beans_4_0.xsd`) に差し替え、`open.dolphin.session.framework.SessionOperationInterceptor` を `<interceptors>` に登録。`SessionOperation` バインディングが確実に適用される構成を確認した。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java` を JMS 3.0 ベースの実装に刷新。`java:/JmsXA`／`java:/queue/dolphin` を利用して ObjectMessage を enqueue し、失敗時は従来の同期送信へフォールバックするように監査ログと併せて整備。
- ✅ `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` を Jakarta Messaging MDB として再実装。CLAIM／Diagnosis／PVT／AccountSummary／Activity 配信を元の振る舞いへ戻し、`MessagingConfig` から施設 ID・接続パラメータを取得するよう統一。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java` の `ClaimSettings` に施設 ID を含め、JMS 側でも `custom.properties` と ORCA 設定を再利用できるようにした。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/KARTE_ORDER_JAKARTA_STATUS.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）へギャップ整理と次アクションを反映。
- ⚠️ `mvn -pl server-modernized -DskipTests package` を実行したが `mvn: command not found`。ローカルに Maven CLI が無いため、後続ワーカーは `scripts/setup_codex_env.sh` などで Maven を導入した上でビルド検証を再開すること。

## 2025-11-02 追記: Elytron フィルタ準備と MFA Secrets 強化（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java` を更新し、`jakarta.security.enterprise.SecurityContext` から `Principal` を取得するフックを追加。ヘッダフォールバック時には WARNING/TODO を出力し、`X-Trace-Id` を `org.jboss.logmanager.MDC(traceId)` へ投入して Micrometer / AuditTrail / ExternalService ログの相関 ID を統一。
- ✅ `docs/server-modernization/security/ELYTRON_INTEGRATION_PLAN.md` を新設し、Elytron HTTP 認証の構成案と Phase2→Phase4 の移行ステップ、Trace ID 伝播方針を整理。
- ✅ `server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java` の固定開発キー フォールバックを廃止。`FACTOR2_AES_KEY_B64` 未設定時は `IllegalStateException` を送出し Secrets 配布漏れを起動直後に検知。`FACTOR2_AES_KEY` の旧環境変数は INFO ログのみに留めて無視するよう変更。
- ✅ `server-modernized/pom.xml` に `org.jboss.logmanager:jboss-logmanager`（scope=`provided`）を追加し、`LogFilter` の MDC 依存をビルド時に解決可能とした。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を OkHttp 5.2.1 の `Duration` API へ対応させ、接続 10 秒 / 読み書き 30 秒 / 呼び出し 45 秒 + TLS1.2/1.3 固定の Builder を採用。`DEPENDENCY_UPDATE_PLAN.md` に標準タイムアウト値・TLS 方針を追記。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md`, `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`, `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）を更新。
- ⚠️ `mvn -pl server-modernized -am -DskipTests compile` を実行したが `mvn: command not found`。ローカル環境に Maven CLI が未導入のため、`scripts/setup_codex_env.sh` 実行や Maven インストール後に再ビルドすること。

## 2025-11-02 追記: Jakarta EE 10 ビルド依存整理（担当: Codex）
- ✅ `common/pom.xml` を Java 17 / Jakarta API 前提へ更新し、Hibernate ORM 6.4.4.Final を provided 参照に切替。`commons-codec` は 1.17.1 へ引き上げ、`maven-compiler-plugin` で `release 17` を明示。
- ✅ `server-modernized/pom.xml` の `dependencyManagement` に Jakarta BOM と Plivo 5.46.0 / OkHttp 5.2.1 / OpenPDF 1.3.41 / BouncyCastle 1.78.1 / Yubico WebAuthn 2.6.0 を登録。WAR 依存は BOM 管理下へ再配置し、OkHttp 依存を追加。
- 🔁 `pom.server-modernized.xml` テンプレートは現状どおりで問題なし（対象モジュールは `common` と `server-modernized` のみ）。追加モジュールは不要と判断し、差分なし。
- ❌ `mvn -pl server-modernized -am -DskipTests package` を実行したが、ローカル環境に Maven (`mvn`) が未導入のため `command not found` で終了。後続ワーカーは `scripts/setup_codex_env.sh` で環境を整備するか、Maven をインストールした上で再実行すること。
- 📎 ドキュメント更新: `foundation/JAKARTA_EE10_GAP_LIST.md` のビルド依存セクションと `PHASE2_PROGRESS.md`（本ファイル）へ反映済み。

## 2025-11-02 追記: ActiveMQ Artemis 設定復旧と Plivo HTTP 設定調整（担当: Codex）
- ✅ `docker/server-modernized/configure-wildfly.cli` に `messaging-activemq` サブシステム設定を追加し、`/server=default` 配下へ `jms-queue=dolphinQueue`（`java:/queue/dolphin`／`java:jboss/exported/jms/queue/dolphin`）、`pooled-connection-factory=JmsXA`（`java:/JmsXA`）、`connection-factory=DolphinConnectionFactory` を idempotent で登録。Micrometer 監視と整合させるコメントも追記済み。
- ✅ `server-modernized/src/main/java/open/dolphin/infrastructure/concurrent/ConcurrencyResourceNames.java` を新設し、`ServletStartup`／`ScheduleServiceBean` が `java:jboss/ee/concurrency/scheduler/default` を明示参照。`ScheduleServiceBean` はスケジューラ経由で `MessagingGateway.dispatchClaim` を即時タスク投入し、トランザクション完了後に JMS enqueue できるよう調整。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java` に `PLIVO_HTTP_CONNECT_TIMEOUT`／`READ_TIMEOUT`／`WRITE_TIMEOUT`／`CALL_TIMEOUT`／`RETRY_ON_CONNECTION_FAILURE`（および `custom.properties` の `plivo.http.*`）を解釈するロジックを追加。ISO-8601 形式や `5000ms` 等の単位付き表記を許容し、不正値はデフォルトへフォールバックする。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を前項設定と連動させ、リトライ可否と各種タイムアウトを設定依存に変更。負値／0 の場合は FINE ログを出した上で安全値へ補正する `sanitizeDuration` を実装。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` を更新し、ActiveMQ CLI 追記・Concurrency 定数化・Plivo HTTP 設定キーを記録。本ファイルにも反映。
- ⏳ フォローアップ: Docker Compose で ActiveMQ Artemis を起動し `java:/queue/dolphin` への enqueue→consume を検証、Micrometer 収集との整合を確認する。Plivo HTTP タイムアウト値は運用チームと標準値を合意し、監査ログでの可視化方針を決める。

## 2025-11-02 追記: ReceptionPage サイドバー統合（担当: Codex）
- ✅ 旧 `ReceptionVisitSidebar` を廃止し、`ReceptionSidebarContent` を採用。`AppShell` の右サイドバーにタブ（受付／患者／履歴）を常設し、選択済み受付が無い場合は患者タブへ自動フォールバックする挙動を実装。
- ✅ 受付タブに呼出トグル・カルテ遷移・詳細操作導線を集約。`callState` のペンディング／エラー状態をバッジとフィードバックで可視化し、監査ログ（`visit_call_start`／`visit_call_cancel`／`visit_call_toggle_failed`）には `source: reception-sidebar` を付与。
- ✅ 患者タブでは `PatientEditorPanel` を `layout="sidebar"` で読み込み、モード切替・自動受付作成設定・保存成功ログをサイドバー側で補完。保存時は `patient_upsert_from_sidebar` を送出し、完了後は受付タブへ戻す。
- ✅ 履歴タブで `useVisitHistory` / `usePatientKarte` を連動。`karteFromDate` 入力は REST 形式へ正規化し、空欄時は `defaultKarteFromDate()` を再適用。カルテ文書は最近 10 件までをサマリ表示。
- ✅ `ReceptionPage` の URL 同期（`rid` / `pid`）とローカル `autoCreateReceptionEnabled` 永続化を整理し、サイドバー内操作で重複保存が発生しないよう状態を統合。
- 🔍 検証: `npm run typecheck` は成功。`npm run lint` は既存課題（`Button.tsx` の未使用変数、`DocumentTimelinePanel.tsx` の Fast Refresh 指摘など 6 件）で失敗。`npm run test -- --watch=false` は従来からの `letter-api.converts summary safely` と `appointment-api.fetches appointments...` が失敗。`npm run build` は管理画面／ChartsPage 周辺の既知 TypeScript エラーが継続（`StampManagementPage.tsx`, `UserAdministrationPage.tsx`, `LoginPage.tsx` ほか）。
- 📎 ドキュメント反映: `docs/web-client/README.md`（直近更新履歴）、`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`（サイドバー仕様）、本ファイルへ追記。
- 🚩 ToDo: lint/test/build の既存失敗は継続課題として別ストーリーで対応。サイドバーのトースト通知・履歴タブからのカルテ遷移ショートカットは未実装のため、次スプリントで検討。

## 2025-11-02 追記: common モジュール Jakarta Persistence ビルド確認（担当: Codex）
- ⚠️ `mvn -pl common -DskipTests package` を実行したが `bash: mvn: command not found` が発生。ローカル環境に Maven CLI が導入されていないため、Jakarta 変換後ビルドは未実施。
- 🚩 対応案: `mvn` の導入または Maven Wrapper (`mvnw`) をリポジトリへ追加した上で再実行が必要。現時点では環境整備の依頼待ち。

## 2025-11-01 追記: ChartsPage レイアウト仕上げ（担当: Worker E）
- ✅ `PageShell`／`ContentGrid` の CSS 変数を整理し、1366px 基準で左 264px・中央 ≒ 763px・右 264px が収まるよう `--charts-central-dynamic-width` を導入。列間ギャップは最大 24px、外周パディングは 12〜20px に制限。
- ✅ `AppShell` の Body コンテナから `contentMaxWidth` 制限を外し、患者一覧・受付一覧・カルテ画面がウィンドウ幅に合わせて無段階に拡張するよう統一。
- ✅ 患者未選択時は `PatientHeaderBar` をコンパクトモード（約 60px 高さ）で描画し、カルテ閲覧画面特有の上部余白を圧縮。患者選択後は通常モードへ自動復帰。
- ✅ `PatientHeaderBar` のグリッドと余白を再調整（横パディング = `var(--charts-content-padding-x) + 12px`、列間 10px / 18〜26px）、`LeftRail`・`WorkspaceStack`・`CentralScroll` のギャップを 10px / 12px / 12px に統一し、ヘッダーと初期カードの空白が 24px を超えないよう調整。
- ✅ `RightRail` 折りたたみ時はカラム幅を 48–56px に固定し、中央カラムが残余幅をすべて取得するよう上限 `clamp()` を撤廃。1600px / 1920px でも余白なしで滑らかに拡張することを確認。
- 📏 実測（CSS 変数算出値）:
  - 1366×768: 左 264px / 中央 ≒ 763px（内側 731px） / 右 264px、列間 21.8px、外周 15.7px。中央スクロール高は 640px でページスクロール無し。
  - 1440×900: 左 264px / 中央 ≒ 835px（内側 803px） / 右 264px、列間 22px、外周 16.6px。
  - 1920×1080: 左 288px / 中央 1,256px（内側 1,224px） / 右 288px、列間 24px、外周 20px、端の余白は計 8px。
  - 右ペイン折りたたみ: 1366px 時 264px / 976px / 56px、1600px 時 288px / 1180px / 56px、1920px 時 288px / 1488px / 56px。
- 🔍 検証: `npm run lint` は既存の未解決課題（`Button.tsx` や `DocumentTimelinePanel.tsx` の未使用変数など 12 件の error）で失敗。`npm run test:unit` はスクリプト未定義のため代替で `npm run test` を実行し、既存の API テスト 2 件（`appointment-api.fetches appointments...` と `letter-api.converts summary safely`）が失敗することを確認。
- 📎 ドキュメント反映: `docs/web-client/ux/KARTE_SCREEN_IMPLEMENTATION.md` に寸法・ギャップの最終値を追記。`docs/web-client/README.md` と本ファイルへ更新概要を記録済み。
- 🚩 ToDo: lint の未解決エラーと vitest 失敗ケースは別チケットでフォロー。スクリーンショット取得は次回 GUI セッション時に実機で再確認する。

## 2025-11-01 追記: DocumentTimeline 安定化（担当: Codex）
- ✅ 左レール `DocumentTimelinePanel` のカテゴリ切替時に選択が外れる不具合を解消し、利用可能カテゴリがゼロになった場合でも直近の有効カテゴリへフォールバックするよう調整。
- ✅ `InlineFeedback` のトーンと文言を整理。読み込み＝`neutral`、空状態＝`neutral`、API エラー＝`danger` とし、例外メッセージはそのまま表示する。タイトル更新成功時は `info`、失敗時は `danger` トーンでフィードバック。
- ✅ MSW モック（`npm run dev` 起動で自動有効化）にタイムライン関連 API (`/api/pvt2/pvtList` `/api/chartEvent/*` `/api/karte/docinfo/*`) のフィクスチャを追加し、エラー・リトライ動作をローカルのみで再現できるようにした。
- 🔄 残タスク: 実 API 接続時のスローダウン計測。`npm run preview -- --host` で WildFly 接続テストを走らせ、DocInfo 取得が 3 秒を超えるケースの調査を次スプリントで実施。
- 📎 ドキュメント反映: `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` `docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md` `docs/web-client/ux/KARTE_SCREEN_IMPLEMENTATION.md` を更新済み。開発手順は `web-client/README.md#開発モックmswとバックエンド切替` に追記。

## 2025-11-01 追記: Swing 版レイアウトに合わせたカルテ画面再配置計画（担当: Codex）
- ✅ 旧 Swing クライアント（スクリーンショット 1280×720）を基準に、左 264px／中央 736px／右 264px の 3 カラム寸法を採寸。Web 版 `ChartsPage` の `ContentGrid`・`OrderConsole`・左レールカードへ反映するリサイズ計画を整理。
- 🔄 タスク分解
  - `T1` グリッドレイアウト再定義 (`clamp` 対応、ヘッダー/フッタ高さ調整)。
  - `T2` 左レール圧縮（パディング再設定、ProblemList/SafetySummary のレイアウト再設計）。
    - 2025-11-01: VisitChecklist / ProblemListCard / SafetySummaryCard を 264px 幅・内側パディング12px・本文0.82rem・行間約8pxに調整し、参照テキスト6行での省略表示を確認。Storybook 静的ビルド（`npm run build-storybook`）でスタイル崩れは検出されず。1366×768 / 1280×720 の GUI 手動確認はローカル CLI 環境の都合で未実施のため、次回 GUI セッションで追試予定。
  - `T3` 右ペイン 2 段構成（アイコンバー導入・コンテンツパネル縮小）。
  - `T4` WorkSurface/PlanComposer の余白最適化とフォントサイズ調整。
  - `T5` ブレークポイント別 QA（1366/1600/1920）スクリーンショット比較とアクセシビリティ確認。
- ✅ ドキュメント更新: `ux/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/KARTE_SCREEN_IMPLEMENTATION.md` に設計指針を追記。本メモおよび `docs/web-client/README.md` へリンクを追加。
- 🔜 次アクション: `phase2` スプリント 18 で T1/T2 着手、スプリント 19 で T3/T4、完了後にドクター試用アカウントでユーザーテストを実施し承認を得る。QA 完了前に `OrderConsole` の Storybook を用意し、幅圧縮時の操作性をレビューする。
- 🔄 `T1` (2025-11-01 Codex): `ContentGrid`/`CentralColumn` を `clamp()` 基調へ移行し、1600px・1280px・1100px・1000px・768px での列幅と折りたたみ挙動を Swing 版採寸どおりに再調整。右ペイン強制折りたたみ閾値を 1100px に更新。1366px/1600px/1280px のレイアウト確認スクリーンショットは 2025-11-03 午前の QA セッションで取得予定。
- 🔄 `T4` (2025-11-01 Codex): WorkSurface タブと Plan カードの余白・フォントを 0.82rem 帯域に再配分し、Plan アクション群の 1 行維持を確認。Plan Composer/Plan カードの操作スクリーンショット（A/P 面、CentralColumn 内）を 2025-11-03 午後の手動 QA と合わせて取得予定。

### 2025-11-01 進捗: T3 OrderConsole アイコンバー実装（担当: Codex）
- ✅ `OrderConsole` を縦アイコンバー(48px)＋内容パネル(最大216px) に再構成し、ホバー／クリックでフェード展開するトランジションを導入。各アイコンには `title` ベースのツールチップと `aria-pressed` を付与して操作フィードバックを明確化。
- ✅ 1000px 未満では強制折りたたみ状態のまま内容をモーダルに切り替え、Tab/Enter/Space 操作での遷移を確認。意図的なホバー展開との挙動差分を取り扱いドキュメント要件（ONE_SCREEN_LAYOUT_GUIDE.md / KARTE_SCREEN_IMPLEMENTATION.md）に整合。
- ✅ 意思決定支援バナーをパネル先頭に整理し、Plan 編集カード・会計編集 UI など既存機能を保持したままアクセシビリティの更新（`aria-labelledby` 管理）を実施。
- ⚠️ MSW モックでのスクリーンショット取得は `npm run build` / `npm run preview` が既存 TypeScript エラーで停止するため未完。ビルド環境復旧後に `docs/server-modernization/phase2/assets/order-console-1366.png` へ保存予定。

## サマリ
- `/user/{fid:userId}` 認証フローめEWeb UI に実裁E��、MD5 ハッシュ・clientUUID 自動生成�Eログアウト操作を一貫させた、E
- `/patient/*` API を利用した患老E��索と安�E惁E��パネルを構築。警告メモ・アレルギーを常時可視化し、クリチE��で患老E��細を�Eり替え可能、E
- `/karte/pid` を利用したカルチE��歴�E�EocInfo�E�取得を β 実裁E��取得開始日めEUI で変更でき、注意フラグを強調表示するタイムラインを提供、E
- 2026-05-27: charts �����܂��� TypeScript �^�� DocInfoSummary�^DocumentModelPayload �ɓ��ꂵ�ACLAIM �đ������ECareMap�E�J���e�^�C�����C���̌^�s�����������AE
- `/karte/document` 保存と `/chartEvent/subscribe` ロングポ�Eリングを絁E��合わせ、カルチE��雁E��EOAP�E�と排他制御めEWeb 版で再現した、E
- アプリシェルの固定�EチE��・フッタ・左右カラムを�Eレイアウトし、中央カラムのみスクロール可能な 3 カラム UI を最適化した、E

## 実裁E��イライチE
### 認証とセチE��ョン管琁E
- ログインペ�Eジで施設ID/ユーザーID/パスワーチE任意�EclientUUIDを�E力。未入力時は UUID を�E動生成してセチE��ョンに保存、E
- 認証惁E��はセチE��ョンストレージへ保存し、`AuthProvider` ぁEHTTP ヘッダーへ自動付与。ログアウトでストレージを確実に破棁E��E
- マルチタブでのログアウトを `storage` イベント経由で同期、E

### 患老E��索・安�E惁E��
- 氏名�E�漢孁Eカナ）、患老ED、番号�E�Eigit�E�検索に対応。検索結果はチE�Eブル表示、E��択患老E��右パネルで詳細表示、E
- `appMemo` めE`reserve*` の安�E惁E��を警告バチE��で表示。アレルギー・患老E��モめE`/karte/pid` から取得して同パネルに雁E��E��E
- 検索エラーめE��果ゼロの際�Eユーザーへ日本語メチE��ージで通知、E

### カルチE��歴タイムライン
- DocInfo をカード形式で表示。`hasMark` を検知して警告バチE��を表示、確定日/診療私EスチE�Eタスを併記、E
- 取得開始日を日付�E力で刁E��替え可能。�E部では `yyyy-MM-dd HH:mm:ss` 形式で API を呼び出す、E
- 患老E��モめE��レルギーを同カードに表示し、安�E惁E��の一允E��を図る、E

### カルチE��雁E�E排他制御
- `features/charts` を新設し、受付リスト�E診察開始�ESOAP 編雁E�E保存までめE1 画面で完結するフローを実裁E��E
- `useChartLock` ぁE`clientUUID` と `BIT_OPEN` を用ぁE�� `/chartEvent/event` を送信。�E端末のみが編雁E��能な状態を維持し、終亁E��にロチE��解除、E
- SOAP ノ�Eト�E ProgressCourse モジュールとしてシリアライズし、`/karte/document/pvt/{pvtPk,state}` で保存と状態�E移を同時に実行。XML エンコードされた `beanBytes` を生成して既存サーバ�E形式を踏襲、E
- `useChartEventSubscription` ぁE`/chartEvent/subscribe` のロングポ�EリングをラチE�Eし、React Query キャチE��ュを更新。褁E��端末で受仁EカルチE��態が即時反映される、E

### レイアウト調整
- `AppShell` のナビゲーション/サイドバーめE`position: sticky` に変更し、中央カラムのみスクロール。�EチE��・フッタは常時固定、E
- 2025-11-01: 23インチ(1920px)フルHDを基準にgrid-template-columnsをminmax(240px,22%) / minmax(0,56%) / minmax(240px,22%)へ更新し、左/右レール最小幅240pxを固定。1600px/1280pxでは24/52/24 -> 28/44/28へ段階調整し、1000px未満は右レールを強制折りたたみ+ホバー展開で固定。SOAP入力領域は最小780pxを確保し、23インチでタイムラインとオーダ操作を同時表示できることを確認。
- `TextArea` コンポ�Eネントを追加し、SOAP 入力欁E��統一したアクセシビリチE��とバリチE�Eションを提供、E

## 既存ユーザー影響と移行メモ
- 既孁ESwing クライアントと同一賁E��惁E��を利用。clientUUID を未入力にすると自動採番されるため、新要EWeb 端末の刁E��時も運用フローを変更せずに移行可能、E
- 共有端末ではログアウト操作が忁E��。ログアウト時にセチE��ョンストレージを削除するため、追加のクリーニング作業は不要、E
- フロントエンドでの安�E惁E��表示は参�Eのみであり、サーバ�EチE�Eタ形式に変更なし。既存データ移行�E不要、E
- SOAP 保存に ProgressCourse モジュールの XML を採用してぁE��ため、既存サーバ�Eは追加移行不要。Swing と Web の併用でもカルチE��ータ形式�E互換、E
- ロングポ�Eリングは 60 秒タイムアウト＋即時�E接続。クライアント�Eで持E��バックオフを実裁E��みであり、既存サーバ�E設定変更は不要、E

## チE��トと検証
- Vitest で認証/患老EカルチEAPI ラチE��ーの単体テストを追加し、リクエストパスと変換ロジチE��を検証、E
- `features/charts/__tests__/progress-note-payload.test.ts` で ProgressCourse モジュールのシリアライズを検証。SOAP/Plan の XML ぁEbase64 で保存されることを確認、E
- 手動動作確誁E ログイン→受付リストから診察開始�ESOAP 入力�E保存�E診察終亁E�Eシナリオを通し、他端末でのロチE��表示・解除がリアルタイムに同期されることを確認、E

## 次のスチE��チE
- SOAP チE��プレート（定型斁E�Eスタンプ）やプラン編雁EUI の拡張。`ProgressCourse` 以外�E ModuleModel�E��E方・検査�E��E保存フロー設計、E
- `/chartEvent/event` を用ぁE��征E��スチE�Eタス更新 UI を左カラムへ統合。看護師画面とのスチE�Eタス整合性検証、E
- ORCA 連携の準備として、患老E��細パネルに保険惁E��サマリ�E�健康保険 GUID�E�を表示する案を検討、E
