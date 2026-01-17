# ルーティング設定と API 仕様調査ログ（RUN_ID=20251210T145333Z）
- 期間: 2025-12-13 09:00 - 2025-12-14 09:00 JST（本稿は 2025-12-10 の事前調査）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`
- 関連 YAML ID: `src/orca_prod_bridge/implementation/ルーティング設定とAPI仕様調査.md`
- 目的: server-modernized のルーティング定義／OpenAPI（ORCA API マトリクス）／開発プロキシ設定を突き合わせ、`/api01rv2/acceptlstv2` 404 の構造原因とベースパス食い違いを整理する。

## 調査メモ
- **コンテキスト/ベースパス**: `server-modernized/src/main/webapp/WEB-INF/jboss-web.xml` で context-root=`/openDolphin`。`web.xml` で `resteasy.servlet.mapping.prefix=/resources` を指定し、REST エンドポイントは `/openDolphin/resources/<@Path>` で公開。
- **登録済みリソース**: `web.xml` の `resteasy.resources` に `OrcaClaimOutpatientResource`（`/orca/claim/outpatient/mock`）、`OrcaMedicalModV2Resource`（`/orca21/medicalmodv2/outpatient`）、`OrcaAppointmentResource` / `OrcaVisitResource` など ORCA ラッパーが列挙されているが、`/api01rv2/acceptlstv2` / `/api01rv2/appointlstv2` / `/api21/...` を直接受けるリソースは存在しない。
- **ORCA ラッパーの公開パス**: ラッパー群は `/orca/...` 配下（例: 予約一覧 `/orca/appointments/list`、受付登録 `/orca/visits/mutation`）に JSON で公開され、内部で ORCA XML API（`OrcaEndpoint` 列挙）へ転送する設計。ORCA 生 API と同じパスは `/orca/claim/outpatient/mock` のみ。
- **プロキシ経路**: `web-client/vite.config.ts` は `/api` を `/` へ書き換え、`/api01rv2`/`/orca21`/`/orca12` を `VITE_DEV_PROXY_TARGET`（既定 `http://localhost:8080/openDolphin/resources`）へ素通し。`docker-compose.modernized.dev.yml` もヘルスチェックを `/openDolphin/resources/dolphin` で実施し、コンテナ外公開ポートは `9080→8080`。
- **ORCA 本番ブリッジスクリプトとのズレ**: `scripts/orca_prod_bridge.sh` のデフォルト API パスは `/api/api01rv2/acceptlstv2?class=01` と `/api` を重ねているため、モダナイズ版サーバーに対して流用すると必ず 404 になる。モダナイズ側で試験する場合は `/api01rv2/...` へ上書きが必要。
- **API 仕様との差分**: `docs/server-modernization/phase2/operations/assets/orca-api-matrix.csv` では P0 API として `/api01rv2/acceptlstv2` `/api01rv2/appointlstv2` `/api21/medicalmodv2` を定義しているが、実装済みなのは `/orca/claim/outpatient/mock`（スタブ）と `/orca21/medicalmodv2/outpatient`（プレフィックス相違）に留まる。
- **git 変更履歴**: 2025-12-08 の `9fd77452` と `818d0247` で外来スタブ（claim/outpatient mock, medicalmodv2 outpatient）とテストが追加されたが、`acceptlstv2` 系のエンドポイントはどのコミットでも追加されていない。`OrcaEndpoint` 列挙にも未収載のためラッパー転送経路自体が存在しない。

## 暫定結論
- `/api01rv2/acceptlstv2` 404 は **リソース未実装** が直接原因。web.xml 登録にもソースコードにも該当パスが無く、ORCA ラッパーの公開パス設計とも一致していない。
- ベースパスは `/openDolphin/resources` 固定で、Vite/Compose も同値を前提にしているため、404 はリバースプロキシ設定の不備ではなく API 実装ギャップによるものと判断。
- ORCA 生 API パスで受けたい場合は (a) `resteasy.resources` に pass-through リソースを新設する、または (b) 既存ラッパー `/orca/...` をクライアント側で利用する方針に整理する必要がある。

## 次アクション（12/13-12/14 窓内候補）
- `/api01rv2/acceptlstv2` pass-through の是非を決定し、実装する場合は web.xml 登録・監査ロギング方針を合わせて設計する。
- `ORCA_API_STATUS.md` へ本調査 RUN_ID と 404 根因（未実装）を追記し、同 RUN_ID で ORCA 本番リトライを行うか判断する。
- `scripts/orca_prod_bridge.sh` をモダナイズ検証で再利用する際は `--api-path /api01rv2/...` を明示し、ベースパス二重付与による 404 を回避する。
