# StampTree 公開系 GET 実装案（/stamp/tree/{facility}/{public|shared|published}）

## 前提条件 / 参照リスト
- **Seed SQL**: `facility=9001/9002` の PublishedTree/SubscribedTree を事前投入するため、[`ops/db/local-baseline/stamp_public_seed.sql`](../ops/db/local-baseline/stamp_public_seed.sql) を Legacy/Modern Postgres へ適用しておく（`domain-transaction-parity.md` Appendix A.5 参照）。
- **AuditTrailService 連携**: `STAMP_TREE_*_GET` の監査/AuditTrailService 実装は [`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`](../docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md) と [`TRACEID_JMS_RUNBOOK.md`](../docs/server-modernization/phase2/operations/TRACEID_JMS_RUNBOOK.md) Appendix A の手順を満たす必要がある。`SessionAuditDispatcher` 設計メモと Runbook を同時に更新し、200 応答でも `d_audit_event` が空にならないよう検証する。
- **UI 仕様**: 公開/共有タブの UX・ADMIN 権限・購読状態のマッピングは [`docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md`](../docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md#54-スタンプ管理センター) と `docs/web-client/ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md` の Stamp セクションに従う。REST 実装を選択した場合でも UI 側で facility セレクタや状態バッジを正しく表示する前提でテストケースを定義する。

## 背景整理
- RUN_ID=`20251111TstampfixZ4`〜`Z6`（`artifacts/parity-manual/stamp/20251111TstampfixZ{4,5,6}/`）で `/stamp/tree/9001/{public,shared,published}` を叩いた結果、Legacy / Modernized ともに `HTTP/1.1 404`（Content-Length 0, `X-Trace-Id` のみ返却）となり、アプリ層まで処理が届いていないことを確認済み。
- `server/src/main/java/open/dolphin/rest/StampResource.java` / `server-modernized/src/main/java/open/dolphin/rest/StampResource.java` には `/stamp/tree/{facility}/...` に対応する `@GET` メソッドが存在せず、実装済みの GET は `/stamp/tree/{userPK}`（個人ツリー）と `/stamp/published/tree`（`getRemoteFacility(remoteUser)` で facility を推測）に限られている。
- `StampServiceBean#getPublishedTrees(String fid)` は facility ID を受け取って Local（publishType=fid）+ Global（publishType='global'）の `PublishedTreeModel` を返却できるため、REST 層さえ揃えれば DAO 側は再利用できる見込み。差分は facility をパスパラメータから受け取り、ユーザーの facility と突合するガードロジック。

## 実装方針
1. **Resource 層エンドポイント追加**
   - Legacy/Modernized 双方の `StampResource` に `@GET @Path("/tree/{facility}/{visibility}")` を追加。`@PathParam("visibility")` を `public/shared/published` でバリデーションし、不正値は 404 ではなく 400（`Bad visibility`）を返す。
   - 応答は既存の `PublishedTreeListConverter` を使い、`List<PublishedTreeModel>` を JSON 化する。UI 側は公開カタログを閲覧するだけなので追加 DTO は不要。
   - Modernized 版は `SessionTraceManager` → `executeWithStampAuditContext` 相当のヘルパーで TraceId/AuditContext をセットし、Legacy 版も既存の `executeWithStampAuditContext` を再利用して監査ログと例外ハンドリングを共通化する。

2. **Service / DAO 呼び出し**
   - `StampServiceBean` に公開系専用の読み取りメソッドを追加: `getFacilityPublishedTrees(String facilityId)`（既存 `getPublishedTrees` のラッパー）、`getPublicTrees()`（`publishType='global'` のみ）、`getSharedTrees(String facilityId)`（`publishType=fid`）。既存 JPQL 定数 `QUERY_LOCAL_PUBLISHED_TREE` / `QUERY_PUBLIC_TREE` を再利用し、重複クエリを避ける。
   - `/stamp/tree/{facility}/published` → `getFacilityPublishedTrees`。`public` → `getPublicTrees`。`shared` → `getSharedTrees`。
   - facility パラメータは URL から受け取り、`remoteUser` が `facility@user` 形式であれば facility 一致を必須にする。管理者ロール（ADMIN）のみ他施設を参照可能にし、権限が無い場合は 403 を返却。

3. **Audit / JMS 取り扱い**
   - 書き込みを伴わないため JMS 送信は無し。代わりに `AuditTrailService` へ `STAMP_TREE_PUBLIC_GET` / `STAMP_TREE_SHARED_GET` / `STAMP_TREE_PUBLISHED_GET` のような read イベントを記録し、`details` に `facilityId`, `visibility`, `resultCount` を格納する。
   - `executeWithStampAuditContext`（Legacy）と `SessionTraceManager`（Modernized）で TraceId / RequestId / remoteUser を `StampAuditContextHolder` に紐付ける。Audit Trail が null の場合でも機能するよう try-catch を追加。
   - 404/403/400 などの例外ケースでも WARN ログへ `traceId`, `facility`, `visibility`, `outcome` を残し、`TRACEID_JMS_RUNBOOK.md` で定義された証跡フォーマットに揃える。

4. **エラー処理 / レスポンス**
   - facility が空の場合は 400。
   - facility が remoteUser と異なる場合: `httpServletRequest.isUserInRole("ADMIN")` のみ許可し、それ以外は 403。
   - DAO から結果ゼロ件の場合でも 200 + 空リストを返して既存 `/stamp/published/tree` と同等にする。

## テスト計画（helper コンテナ + RUN_ID 管理）
1. **環境**: `docker compose up -d` 済みの `legacy-vs-modern` ネットワーク上で `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash` を起動し、`ops/tools/send_parallel_request.sh --profile compose` を実行する。
2. **テストケース & RUN_ID**
   - `GET /stamp/tree/9001/public` → RUN_ID=`20251113TstampPublicPlanZ1`
   - `GET /stamp/tree/9001/shared` → RUN_ID=`20251113TstampSharedPlanZ1`
   - `GET /stamp/tree/9001/published` → RUN_ID=`20251113TstampPublishedPlanZ1`
   各ケースで `tmp/parity-headers/stamp_tree_<visibility>_<RUN_ID>.headers` を用意し、`X-Trace-Id: parity-stamp-tree-<visibility>-<RUN_ID>` を付与する。
3. **期待結果**
   - HTTP: Legacy/Modernized とも 200 + JSON (`PublishedTreeListConverter` フォーマット)。`Content-Type: application/json`、`Content-Length > 0`。
   - Audit: `docker exec opendolphin-postgres[-modernized] psql -c "COPY (SELECT * FROM d_audit_event WHERE action LIKE 'STAMP_TREE_%_GET' AND trace_id='parity-stamp-tree-<visibility>-<RUN_ID>') TO STDOUT WITH CSV HEADER"` で 1 行以上出力される。
   - JMS: read-only のため `messages-added` は増えず 0 のままで OK だが、`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt` を保存して「enqueue なし」を証跡化する。
   - セキュリティ: facility を `9002` など別施設に変えた負荷試験を追加で実行し、非 ADMIN ユーザーでは 403、`X-Trace-Id` と WARN ログが `artifacts/parity-manual/stamp/<RUN_ID>/logs/` に残ることを確認。
4. **証跡保存**: 各 RUN_ID ごとに `artifacts/parity-manual/stamp/<RUN_ID>/stamp_tree_<visibility>/{legacy,modern}/` へ HTTP/headers/meta を保存し、`logs/` 配下に `d_audit_event_*.tsv`, `jms_dolphinQueue_read-resource*.txt`, `send_parallel_request.log` を集約。`DOC_STATUS.md` と `TRACEID_JMS_RUNBOOK.md` Appendix に RUN_ID を追記する。

## 実施結果（2025-11-12 / RUN_ID=`20251113TstampPublicPlanZ{1,4}`）

- **実装**: Legacy/Modernized ともに `StampResource` と `StampServiceBean` へ `/stamp/tree/{facility}/{visibility}` ルート／`getFacilityPublishedTrees`・`getPublicTrees`・`getSharedTrees` を追加し、`AuditTrailService` に `STAMP_TREE_PUBLIC_GET` / `STAMP_TREE_SHARED_GET` / `STAMP_TREE_PUBLISHED_GET` を記録するよう更新。Modernized 側は `SessionTraceManager` のトレースを `details.traceId` へコピーし、Legacy 側は `executeWithStampAuditContext` で `StampAuditContextHolder` を構築することで Audit → JMS 連携を維持した。facility バリデーションは `remoteUser` の facility と URL パラメータが一致しない場合に 403 を返し、WARN ログへ `reason=facility_mismatch` を出力する。
- **Seed / ユーザー整備**: `ops/db/local-baseline/stamp_public_seed.sql` に facility=`9001` / user=`9001:doctor1` / `d_roles` の挿入処理（`NOT EXISTS` 付）を追加し、seed 再適用で公開ツリー利用者の `remoteUser` が `9001:doctor1` へ揃うようにした。Legacy/Modern DB への再適用ログは `artifacts/parity-manual/stamp/20251113TstampPublicPlanZ1/logs/seed_stamp_public_{legacy,modern}.log` に保存。
- **GET 実行**: helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy` + `--network legacy-vs-modern_default`）で `PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers` を指定し、`--profile modernized-dev` から `GET /stamp/tree/9001/<variation>` を実行。結果は以下のとおり。
| Variation | RUN_ID | HTTP Legacy / Modern | Audit / JMS 所見 | Evidence |
| --- | --- | --- | --- | --- |
| `public` | `20251113TstampPublicPlanZ1` | `200 / 200`（`response.json` には `PublishedTreeList` で facility=9001 + global=1 件ずつ。Modern=144 バイト、Legacy=144 バイト） | `logs/d_audit_event_stamp_public_{legacy,modern}.tsv` に `action=STAMP_TREE_PUBLIC_GET`, `facilityId=9001`, `resultCount=2`, `traceId=parity-stamp-tree-public-20251113TstampPublicPlanZ1` を確認。`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt` は `messages-added` が Legacy=0L ／ Modern=5L のまま（read-only）。 | `artifacts/parity-manual/stamp/20251113TstampPublicPlanZ1/`（HTTP/headers/meta + logs）。 |
| `shared` | `20251113TstampSharedPlanZ1` | `200 / 200`（Legacy/Modern とも `response.json.list` に facility=9001 の共有スタンプが 1 件） | `d_audit_event_stamp_shared_{legacy,modern}.tsv` に `resultCount=1` が追加。JMS は before/after で差分なし。 | `artifacts/parity-manual/stamp/20251113TstampSharedPlanZ1/` |
| `published` | `20251113TstampPublishedPlanZ1` | `200 / 200`（ローカル + global 含む 3 件） | `d_audit_event_stamp_published_{legacy,modern}.tsv` に `STAMP_TREE_PUBLISHED_GET`（TraceId=`parity-stamp-tree-published-20251113TstampPublishedPlanZ1`）を記録。JMS は read-only。 | `artifacts/parity-manual/stamp/20251113TstampPublishedPlanZ1/` |
- **施設ミスマッチ検証**: `RUN_ID=20251113TstampPublicPlanZ4` で `GET /stamp/tree/9002/public` を送出し、Legacy/Modern とも `403 Forbidden`。WARN ログ（`artifacts/parity-manual/stamp/20251113TstampPublicPlanZ4/logs/{legacy,modern}_warn.log`）には `reason=facility_mismatch`, `remoteUser=9001:doctor1`, `facilityId=9002` が出力され、HTTP 証跡は `stamp_tree_public_mismatch/{legacy,modern}/` に保存した。
- **ヘッダー更新**: `tmp/parity-headers/stamp_tree_{public,shared,published}_TEMPLATE.headers` および RUN_ID 個別ヘッダーを `userName: 9001:doctor1` / `facilityId: 9001` / `X-Trace-Id: parity-stamp-tree-<variation>-<RUN_ID>` へ差し替え。`TRACEID_JMS_RUNBOOK.md` Appendix A.4 と `DOC_STATUS.md` から参照するテンプレも同日付で更新済み。

## 選択肢 A/B の利点・欠点

### 選択肢A: UI差し替え（既存 `/stamp/published/tree` 再利用）
- **利点**: 既存 REST を流用できるため API 実装コストとトレーサビリティ差分が最小。UI 内で facility セレクタと `subscriptionState` 合成ロジックを追加するだけで公開/共有タブが機能し、短期間でカルテ UI へ組み込める。
- **利点**: Legacy/Modern 双方で 200 応答実績があるため、`ops/tools/send_parallel_request.sh --profile compose GET /stamp/published/tree` の証跡を転用できる。Audit/JMS 挙動も既に `STAMP_TREE_PUT` で検証済み。
- **欠点**: facility ごとのフィルタリングや購読状態の突合せを UI 側で維持する必要があり、`PublishedTreeList` の payload が大きい場合はブラウザ側メモリとダウンロード負荷が増大する。`pending` 状態も UI 独自管理となり、監査ログに残らない。
- **欠点**: ADMIN ロールによる権限制御を UI だけで実装するため、誤設定や直リンクでバイパスされるリスクが残る。アクセス拒否をサーバーで強制できず、Audit イベントも `STAMP_TREE_*_GET` に記録されない。

### 選択肢B: REST追加（`/stamp/tree/{facility}/{visibility}` 新設）
- **利点**: facility/visibility をサーバーで評価するため、認可・監査・TraceId を一元管理できる。`STAMP_TREE_PUBLIC_GET` など読み取り監査を実装すれば、Appendix A.5 が求める 200 + Audit 証跡を自動取得可能。
- **利点**: UI は facilityId を URL パラメータに差し込むだけで済み、購読状態も `SubscribedTreeModel` 応答を表示するだけで実現できる。payload も施設別に分割され、クライアント負荷が軽減される。
- **欠点**: Legacy/Modern 双方の `StampResource` と `StampServiceBean` へ GET ルート・DAO を追加する必要があり、トランザクション/Audit 差分の検証と RUN_ID 取得に時間を要する。`d_subscribed_tree` の読み取り最適化や N+1 抑制も追加で検討が必要。
- **欠点**: 新規 API に対する QA・セキュリティレビュー、`TRACEID_JMS_RUNBOOK` や `domain-transaction-parity.md` の更新、Jira チケット発行など周辺タスクが増える。短期リリースには向かず、UI 実装と並行でサーバー改修を進める必要がある。
