# StampTree 公開系 GET 実装案（/stamp/tree/{facility}/{public|shared|published}）

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
