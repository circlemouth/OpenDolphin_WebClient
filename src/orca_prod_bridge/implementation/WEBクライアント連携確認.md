# WEB クライアント連携確認（RUN_ID=20251211T032447Z / 現行作業 RUN_ID=20251211T150000Z）
- 期間: 2025-12-16 09:00 - 2025-12-17 09:00 JST（本稿は事前準備）
- YAML ID: `src/orca_prod_bridge/implementation/WEBクライアント連携確認.md`
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md（ORCA 接続ポリシー: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`）
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251211T032447Z-webclient-orca-linkage.md`

## 最新ステータス（2025-12-11 時点）
- 実施 RUN_ID: 20251211T150000Z（attempt4/5）。VITE_DEV_PROXY_TARGET を `http://localhost:9080/openDolphin/resources` に戻し、MSW 無効・headful Playwright でログイン → 受付/カルテ/Outpatient Mock を表示。`dataSourceTransition=snapshot` で UI 描画成功、HAR/スクショ/ログは `artifacts/webclient/debug/20251211T150000Z-bugs/` に保存。  
- 予約導線: AppRouter NAV_LINKS は `/reception` `/charts` `/outpatient-mock` のみで、予約/appointment 系ルートは未実装。未知ルートは `/reception` リダイレクト。予約シナリオは「導線なしで未実施」とし、証跡（reservation-session.har / reservation-missing.png ほか）を保存済み。  
- 本番 ORCA 再接続: 直近の mTLS ハンドシェイク失敗は dev proxy→本番経路で発生。必要なら Vite dev proxy に https.Agent を差し込む案2（下記メモ）を実装検討。現時点では未実装。  
- DOC_STATUS 備考: 20251211T150000Z attempt4/5 反映済み（受付/カルテ/Outpatient=表示確認、予約=未実装）。  
- 次の一手: 予約機能を追加する場合は AppRouter にルートを実装 → Playwright スクリプト（`tmp/playwright-reservation.js` の RESERVATION_PATH コメント）を有効化して再取得。mTLS 再検証が必要なら案2を適用して同 RUN_ID で再試行。

## 目的（準備完了・承認待ち）
Web クライアント（MSW 無効・dev proxy 有効）から ORCA 経由のデータが受け口画面に表示されることを確認し、画面スクリーンショットとネットワーク証跡を RUN_ID 付きで保存する。必要な環境変数やプロキシ差分を明示し、MSW 無効化条件を再確認する。

## スコープ
- ORCAcertification 経路で Reception/Outpatient 画面に表示される ORCA 応答の UI・トーン・監査メタ (`runId`/`dataSourceTransition`/`cacheHit`/`missingMaster`) を確認すること。
- HAR・スクリーンショット・環境変数セットを RUN_ID=`20251211T032447Z` で収集し、証跡ログと DOC_STATUS に同一 RUN_ID でひも付けること。
- Stage/Preview など ORCAcertification 以外の実環境接続は本タスクのスコープ外（別途許可と RUN_ID で扱う）。

## 前提/準備
- 接続ポリシー: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`
- API マッピング/監査メタ: `docs/web-client/architecture/web-client-api-mapping.md`
- 受付 UX ポリシー: `docs/web-client/ux/reception-schedule-ui-policy.md`
- カルテ/請求 UX ポリシー: `docs/web-client/ux/charts-claim-ui-policy.md`
- 患者/管理 UX ポリシー: `docs/web-client/ux/patients-admin-ui-policy.md`
- dev proxy / Vite 前提: `docs/web-client/README.md`（Phase2 ガバナンスチェーンを含む）

## 環境準備（ローカル疎通／ORCA 本番経路は未使用）
RUN_ID=`20251211T150000Z`。`WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を共通前提とし、VITE_DEV_PROXY_TARGET を空文字のまま ORCA 本番・Stage/Preview へ到達しないことを確認するチェックリスト。ログ/HAR/スクショ保存先は `docs/web-client/operations/debugging-outpatient-bugs.md` と同じフォーマット（`artifacts/webclient/debug/<RUN_ID>-bugs/{logs,har,screenshots}/`）で統一。

- **A: MSW 有効（スタブ疎通確認）**
  - `RUN_ID=20251211T150000Z VITE_DISABLE_MSW=0 VITE_DEV_PROXY_TARGET="" WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - ブラウザ起動後、Reception→Outpatient へ遷移し、MSW スタブ応答で UI が描画されることを確認（`dataSourceTransition=msw`/`runId` が表示される想定）。
  - DevTools Network で外向きリクエストが `localhost:<vite-port>` 以外へ出ていないことを確認。MSW ハンドラ命中ログをコンソールで確認し、`artifacts/webclient/debug/20251211T150000Z-bugs/logs/` に保存。
  - HAR (`.../har/msw-enabled.har`) とスクリーンショット (`.../screenshots/msw-enabled.png`) を取得し、traceId/runId をファイル名または併設 README に記載。

- **B: MSW 無効（dev proxy 空で外部到達しないことの確認）**
  - `RUN_ID=20251211T150000Z VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET="" WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - Service Worker が未登録であることを確認後、Reception→Outpatient を開く。API コールは同一オリジンに向かい 404/502 いずれかで失敗する想定。レスポンスが ORCA 本番/Stage ホストへ向かわないことを DevTools Network で確認しスクリーンショットを保存（`.../screenshots/msw-disabled-no-proxy.png`）。
  - 失敗レスポンスとコンソールエラーを HAR (`.../har/msw-disabled-no-proxy.har`) とログ (`.../logs/msw-disabled-no-proxy.log`) に保存し、`traceId`/`runId=20251211T150000Z` をメモ。アプリが期待どおりフェイルクローズしているかをメモに追記。

- **C: 証跡ログひも付け**
  - 取得した HAR/スクショ/ログのパスを `docs/server-modernization/phase2/operations/logs/20251211T150000Z-webclient-local-outpatient.md` に追記（新規作成可）。
  - DOC_STATUS 備考欄に `RUN_ID=20251211T150000Z / artifacts/webclient/debug/20251211T150000Z-bugs/` を記載し、デバッグ記録との整合を取る。

- **承認待ち（実行前）: ORCA 本番/Stage 接続**
  - 実行コマンド（承認後に使用）: `RUN_ID=20251211T150000Z VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<本番またはStageのプロキシURL> WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
  - ORCA_CERTIFICATION_ONLY.md の手順で dev proxy 認証ヘッダを設定し、証跡は `docs/server-modernization/phase2/operations/logs/20251211T150000Z-orcacertification-only.md` に記録する。承認取得までは実行しない。

### 接続設定（RUN_ID=20251211T150000Z）
- dev proxy 先: `VITE_DEV_PROXY_TARGET=https://weborca.cloud.orcamo.jp:443/openDolphin/resources`（`ORCA_CERTIFICATION_ONLY.md` §1 を正とし、ホスト/ポート/パスは変更不可）。
- Preview/ビルドを合わせる場合: `VITE_API_BASE_URL` も同値に揃える。HTTPS 必須。`VITE_DEV_USE_HTTPS=0` はローカル TLS 障害時のみ一時利用。
- 認証（ORCA 本番経路）: mTLS + Basic。証跡に値は残さず、環境変数へのみ展開する。
  - `ORCA_PROD_CERT=ORCAcertification/103867__JP_u00001294_client3948.p12`
  - `ORCA_PROD_CERT_PASS=<マネージャー承認後設定>`
  - `ORCA_PROD_BASIC_USER=<マネージャー承認後設定>`（施設ログイン ID）
  - `ORCA_PROD_BASIC_KEY=<マネージャー承認後設定>`（API キー）
- dev proxy で明示ヘッダが必要な場合: `Authorization: Basic base64(${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY})`
- Web クライアント送出ヘッダは ORCA_CERTIFICATION_ONLY.md の施設情報に合わせて更新する（未確定値は「マネージャー承認後設定」と明記）。
  - 例: `userName=<施設 ID>` / `password=<MD5(施設 PW)>` / `clientUUID=devclient` / `X-Facility-Id=<施設 ID>`
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251211T032447Z-webclient-orca-linkage.md`（実施ログ予定） / `docs/server-modernization/phase2/operations/logs/20251211T150000Z-orcacertification-only.md`（承認待ち準備ログ）を相互参照し、同じ設定を引用する。

### リハーサルメモ（机上確認, 実行なし）
- 時間窓: 2025-12-16 09:00 - 2025-12-17 09:00 JST（想定所要 60-90 分/1 名）。役割: Web クライアント検証担当（本書ワーカー）が実施、マネージャーは Stage/Preview 実行可否を承認。  
- 環境変数の取得先: `setup-modernized-env.sh` に記載の dev ユーザー値を流用（ORCA 本番/Stage の証跡値は ORCA_CERTIFICATION_ONLY.md を参照し、マネージャー承認後に設定）。  
- MSW ON/OFF 手順:  
  - ON: `VITE_DISABLE_MSW=0` で `./setup-modernized-env.sh` を再実行、ブラウザの Service Worker 登録が `msw` になっていることを確認。  
  - OFF: `VITE_DISABLE_MSW=1` で再実行し、Chrome DevTools > Application > Service Workers で登録なしを確認（残存時は Clear site data）。  
- 証跡ディレクトリ: `artifacts/webclient/debug/20251211T150000Z-bugs/{logs,har,screenshots}/` は現状未作成（2025-12-11 時点）。作成する場合のコマンドだけ記載（実行しない）：  
  - `mkdir -p artifacts/webclient/debug/20251211T150000Z-bugs/{logs,har,screenshots}`  
- VITE_DEV_PROXY_TARGET: ローカル疎通は空文字/localhost。Stage/Preview を使うシナリオは「要権限確認・未実施」と明示し、承認後に値を置換してから実行。

## 確認手順（シナリオ別チェックリスト）
- [ ] 受付（claim/outpatient, appointment/outpatient）  
  - 事前データ: ORCAcertification の受付データ、`runId=20251208T124645Z` フィクスチャ参照。MSW 無効 (`VITE_DISABLE_MSW=1`)、VITE_DEV_PROXY_TARGET は dev/stage のいずれかに設定するが、本書では dev=空文字または localhost のみ実施。Stage/Preview は「要権限確認・未実施」。  
  - 操作手順: Reception 画面で患者検索→受付一覧表示→「請求バナー」を開き最新受付を選択。必要に応じて来院/予約タブを切替。  
  - 期待レスポンス/画面: `/orca/claim/outpatient/*` が 200、`dataSourceTransition=server`、`cacheHit` はリロード時 true→false の遷移が記録される。`missingMaster=false` で警告なし、受付バナーに runId と traceId が表示。  
  - 取得証跡: HAR とスクショを `artifacts/webclient/debug/20251211T150000Z-bugs/{har,screenshots}/reception-*`、ブラウザコンソールログを `.../logs/reception.log` に保存。DOC_STATUS 備考へ追記。  
  - 実施結果 (2025-12-11 attempt4, localhost:9080): ログイン後に Reception 画面遷移は成功し UI 表示。レスポンスは `dataSourceTransition=snapshot`（モダナイズ dev DB 由来、ORCA 本線未到達）。HAR/スクショ: `artifacts/webclient/debug/20251211T150000Z-bugs/har/headed-session.har`, `.../screenshots/reception.png`, コンソール: `.../logs/headed-session.log`。  

- [ ] 外来（medicalmodv2/outpatient）  
  - 事前データ: ORCAcertification の外来記録（medicalrecord）を用意。MSW 無効、VITE_DEV_PROXY_TARGET は dev=空または localhost で実施。Stage/Preview は「要権限確認・未実施」。  
  - 操作手順: Outpatient 画面を開き患者を選択→カルテタイムラインを展開し該当日の外来記録を閲覧。  
  - 期待レスポンス/画面: `/orca21/medicalmodv2/outpatient` が 200、`recordsReturned>0`、`dataSourceTransition=server`。トーンは server、traceId/runId が UI（AuditSummary もしくは ToneBanner）に表示。  
  - 取得証跡: HAR を `.../har/outpatient-medicalmodv2.har`、スクショを `.../screenshots/outpatient-medicalmodv2.png`、コンソールを `.../logs/outpatient-medicalmodv2.log`。  
  - 実施結果 (2025-12-11 attempt4): Outpatient Mock まで遷移し UI 描画確認。Telemetry は `dataSourceTransition=snapshot cacheHit=false missingMaster=true` を記録。スクショ: `.../screenshots/outpatient-mock.png`（mock 画面表示のみ）。実データ未取得のためチェックは未完。  

- [ ] カルテ（patientmodv2/outpatient 変更系）  
  - 事前データ: 編集可能な患者と保険情報。MSW 無効、VITE_DEV_PROXY_TARGET=空または localhost でローカルのみ実施。Stage/Preview での実 API 変更は「要権限確認・未実施」。  
  - 操作手順: Patients/Administration で対象患者を開き、保険情報を更新→保存。必要に応じて削除/追加も 1 件実施。  
  - 期待レスポンス/画面: `/orca12/patientmodv2/outpatient` が 200、`operation=update|create|delete` が auditEvent.details に反映、UI に成功トースト。`missingMaster=false`、`fallbackUsed=false` がログに記録。  
  - 取得証跡: HAR `.../har/patientmodv2-update.har`、スクショ `.../screenshots/patientmodv2-update.png`、保存後のトーストと auditEvent を含むコンソール `.../logs/patientmodv2-update.log`。  
  - 実施結果 (2025-12-11 attempt4): Charts 画面表示のみ確認 (`.../screenshots/charts.png`)。編集系操作は未実施。  

- [ ] （オプション）予約・試算（appointment/outpatient）  
  - 事前データ: 予約データが存在する患者。MSW 無効、VITE_DEV_PROXY_TARGET=空または localhost。Stage/Preview は「要権限確認・未実施」。  
  - 操作手順: Reception で予約タブを開き一覧を表示、必要に応じて試算ボタンを実行。  
  - 期待レスポンス/画面: `/orca/appointments/list/*` が 200、`dataSourceTransition=server`、予約一覧が UI に表示。  
  - 取得証跡: HAR `.../har/appointment-outpatient.har`、スクショ `.../screenshots/appointment-outpatient.png`、コンソール `.../logs/appointment-outpatient.log`。  
  - 実施結果 (2025-12-11 attempt5 headful, 05:25:02Z〜05:25:05Z): UI メニュー/ボタン「予約/予約管理/Appointment/予約一覧」を探索したが導線なし。ログイン後のナビゲーションは `AppRouter` NAV_LINKS の 3 項目のみ（`/reception`「受付 / トーン連携」、`/charts`「カルテ / Charts」、`/outpatient-mock`「Outpatient Mock」）で、予約系ルートは未実装。HAR: `artifacts/webclient/debug/20251211T150000Z-bugs/har/reservation-session.har`、スクショ: `.../screenshots/{reservation-login.png,reservation-after-login.png,reservation-missing.png}`、ログ: `.../logs/reservation-session.log`。導線未実装のためシナリオ未実施。  
  - 導線調査 (2025-12-11 code-only): `web-client/src/AppRouter.tsx` の NAV_LINKS は `/reception`・`/charts`・`/outpatient-mock` のみ。予約系コンポーネント・ルート定義・feature flag は web-client/src/features 配下に存在せず、未ログイン時は `/login` へ、未知ルートは `/reception` へリダイレクトされるため `/appointment` 等に直接アクセスしても描画されない。  
  - 直接 URL 案（未実装のため備忘）: 予約ルートが追加された場合に備え、`/appointment` や `/appointments` など候補をブラウザで直打ちし、リダイレクト先とネットワーク発火を HAR 取得する。現状は全て `/reception` へリダイレクトする見込み。  

※ 各シナリオで Stage/Preview を実行する場合はマネージャー承認後、VITE_DEV_PROXY_TARGET を当該環境のエンドポイントに置換し、DOC_STATUS と証跡ログへ「要権限確認→実施済み」を更新すること。MSW は必ず無効化する（`VITE_DISABLE_MSW=1`）。\n

## 実施手順（12/16-12/17 窓）
1. **環境起動**: `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=https://weborca.cloud.orcamo.jp:443/openDolphin/resources` を指定して `./setup-modernized-env.sh` を実行。HTTPS が不要な場合は `VITE_DEV_USE_HTTPS=0` を併用。認証情報は同スクリプト記載の dev ユーザーを使用し、PKCS#12 等の秘匿情報は ORCA_CERTIFICATION_ONLY.md に従う。  
2. **MSW 無効化確認**: Vite 起動ログで `MSW disabled` が出力されること、ブラウザの Service Worker 一覧に登録がないことを確認（登録が残る場合は `Clear site data` 後に再読込）。  
3. **接続確認**: ログイン後、ナビゲーションから Reception/Outpatient いずれかの受け口画面へ遷移し、ORCA 経由レスポンスが描画されることを目視確認。`dataSourceTransition=server` や `runId` 等のトーン表示が ORCA 側の値を反映しているかを確認。  
4. **ネットワーク証跡**: DevTools で HAR を取得し、以下のパスで保存する。  
   - `artifacts/webclient/e2e/20251211T032447Z-webclient-orca/har/`（例: `reception-orca.har`）  
   - `artifacts/webclient/e2e/20251211T032447Z-webclient-orca/screenshots/` に UI スクリーンショット（トーン/患者一覧/traceId 表示が写るよう撮影）を保存。  
5. **ログ反映**: 結果を `docs/server-modernization/phase2/operations/logs/20251211T032447Z-webclient-orca-linkage.md` に追記し、DOC_STATUS 備考へ RUN_ID と証跡パスを併記。問題が出た場合は HTTP ステータス・traceId・環境変数差分を明記してエスカレーション。

## 設定メモ（差分・前提）
- dev proxy ベースパス: `/openDolphin/resources`（Vite の `/api` リライトあり、`/api01rv2`/`/orca21` は無変換で `VITE_DEV_PROXY_TARGET` へ転送）。  
- 認証ヘッダ例（ORCA 本番用に置換すること）: `userName=<施設 ID>` / `password=<MD5(施設 PW)>` / `clientUUID=devclient` / `X-Facility-Id=<施設 ID>`。値は ORCA_CERTIFICATION_ONLY.md の施設情報を参照し、未確定時は「マネージャー承認後設定」とする。  
- Stage/Preview 実測が許可される場合のみ `VITE_DEV_PROXY_TARGET` を該当エンドポイントへ置換し、MSW 無効のまま実データを取得する。許可がなければローカル ORCAcertification 経路のみ。
- 案2メモ（未実装）: Vite dev proxy で mTLS を終端する場合は `server.proxy['/api']` に https.Agent を差し込み、`pfx: fs.readFileSync(process.env.ORCA_PROD_CERT), passphrase: process.env.ORCA_PROD_CERT_PASS` を指定する最小差分パッチを検討。適用時は RUN_ID=20251211T150000Z で再試行する。

### 案2（Vite dev proxy に https.Agent を挿入し client cert/pfx を渡す）最小差分パッチ案（未実装）
- 目的: dev proxy が ORCA 本番の mTLS で `ssl alert handshake failure` を返す場合に、Vite 側でクライアント証明書を添付できるようにする。今はドキュメントのみで実装しない。
- 参考 diff（適用禁止。方針共有用サンプル）
```diff
+import https from 'node:https';
 const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080/openDolphin/resources';
+const clientCertAgent =
+  process.env.ORCA_PROD_CERT && process.env.ORCA_PROD_CERT_PASS
+    ? new https.Agent({
+        pfx: fs.readFileSync(process.env.ORCA_PROD_CERT),
+        passphrase: process.env.ORCA_PROD_CERT_PASS,
+        rejectUnauthorized: false,
+      })
+    : undefined;
 const apiProxy = {
   '/api': {
     target: apiProxyTarget,
     changeOrigin: true,
     secure: false,
+    agent: clientCertAgent,
+    headers: process.env.ORCA_PROD_BASIC_USER
+      ? {
+          Authorization: `Basic ${Buffer.from(`${process.env.ORCA_PROD_BASIC_USER}:${process.env.ORCA_PROD_BASIC_KEY ?? ''}`).toString('base64')}`,
+        }
+      : undefined,
     // /api/ にのみマッチさせ、/api01rv2 などは書き換えない。
     rewrite: (path: string) => path.replace(/^\/api(?=\/|$)/, ''),
   },
   '/api01rv2': {
     target: apiProxyTarget,
     changeOrigin: true,
     secure: false,
+    agent: clientCertAgent,
   },
   '/orca21': {
     target: apiProxyTarget,
     changeOrigin: true,
     secure: false,
+    agent: clientCertAgent,
   },
   '/orca12': {
     target: apiProxyTarget,
     changeOrigin: true,
     secure: false,
+    agent: clientCertAgent,
   },
 };
```
- 実装要否の判断（未チェック＝実装不要）
  - [ ] ORCA 本番/Stage dev proxy で mTLS ハンドシェイク失敗が再現し、ネットワーク遮断ではないことを確認済み。
  - [ ] `ORCA_CERTIFICATION_ONLY.md` に従い `ORCA_PROD_CERT` / `ORCA_PROD_CERT_PASS` / `ORCA_PROD_BASIC_USER` / `ORCA_PROD_BASIC_KEY` を RUN_ID=20251211T150000Z で管理し、マネージャー承認が取れている。
  - [ ] curl（証明書付き）は成功するが Vite dev proxy 経由のみ失敗している（プロキシ層の課題に限定できている）。
- 実施ステップ（実装時のみチェック）
  - [ ] 上記 diff を `web-client/vite.config.ts` に適用し、`clientCertAgent` を `/api` `/api01rv2` `/orca21` `/orca12` に付与する。
  - [ ] 再起動: `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_USE_HTTPS=1 VITE_DEV_PROXY_TARGET=https://weborca.cloud.orcamo.jp:443/openDolphin/resources ORCA_PROD_CERT=<P12パス> ORCA_PROD_CERT_PASS=<PW> ORCA_PROD_BASIC_USER=<ID> ORCA_PROD_BASIC_KEY=<KEY> ./setup-modernized-env.sh`
  - [ ] 再検証: Playwright (`tmp/playwright-reservation.js` など) で `/login` → Reception/予約導線を踏み、HAR で TLS 交渉成功を確認する。
- 証跡・DOC_STATUS 反映（実装時のみ）
  - [ ] HAR/ログ/スクショを `artifacts/webclient/debug/20251211T150000Z-bugs/{har,logs,screenshots}/` もしくは派生 RUN_ID 配下へ保存し、ファイル名に `agent-pfx` を付ける。
  - [ ] `docs/server-modernization/phase2/operations/logs/20251211T150000Z-orcacertification-only.md` に attempt 番号と開始/終了時刻・設定値・traceId を追記。
  - [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` 備考へ RUN_ID と証跡パスを更新し、マネージャーチェックリストから逆参照できるようにする。


## リスク・留意点
- ORCA 本番/Trial への直接アクセスは禁止。ORCA_CERTIFICATION_ONLY.md の手順とログ保存先を必ず遵守する。  
- Python スクリプトの実行は禁止。shell/Node/npm のみ使用可。  
- スクリーンショットは患者情報が映る場合があるため、保存先と RUN_ID を一致させ、外部共有禁止。  
- MSW を誤って有効にしたままではスタブが表示され、ORCA 経由確認にならない点に注意。
