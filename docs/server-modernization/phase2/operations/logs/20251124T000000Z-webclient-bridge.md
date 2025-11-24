# 20251124T000000Z webclient bridge evidence
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「契約テスト観点（SP3ドラフト）」新設
- runId: 20251124T000000Z
- actorRole: worker
- change: MSW↔実サーバー比較で検証すべきスキーマ差分・件数/単価差分・監査メタ送出（dataSourceTransition/cacheHit/missingMaster/fallbackUsed）・警告表示・証跡保存先を箇条書きで整理。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: API_SURFACE_AND_AUDIT_GUIDE と CHART_UI_GUIDE のトーンに準拠し、ORCA_API_STATUS で提供有無を判定する前提を明記。テスト結果と差分ハッシュを #SP3 アンカーへ記録予定。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「契約テスト手順（ORCA-05/06/08 ケース・ハッシュ算出）」追加
- runId: 20251124T000000Z
- actorRole: worker
- change: ORCA-05/06/08 ごとに具体的入力ケース、期待レスポンス、フィールド順を固定した `sha256` ハッシュ算出手順、証跡保存パス（`artifacts/.../hashes/`）を追記。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: 境界値（最小/最大コード）、欠損・空ヒット時の監査フィールド期待値、ハッシュ生成時のソート順（code/payerCode/tensuCode 昇順）とフィールド順を明文化し、再現性を担保。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「ハッシュファイル配置手順（実行フロー）」追記
- runId: 20251124T000000Z
- actorRole: worker
- change: 入力データ取得→整形→フィールド順固定→`sha256` 計算→`artifacts/.../hashes/orca05|06|08.hash` への保存→#SP3 への記録までの手順を箇条書きで明文化。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: 保存ファイル拡張子を `.hash` に統一し、MSW/実サーバーの別計測をログで区別する運用を追記。
- scope: SP3 実データ契約テスト（MSW 基準ハッシュ添付）
- runId: 20251124T000000Z
- actorRole: worker
- change: ORCA-05/06/08 を MSW レスポンスで取得し、手順節どおりソート・フィールド固定後 `sha256` を算出して `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/orca05.hash|orca06.hash|orca08.hash` に保存。ハッシュ値を #SP3 に記録。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: 環境=MSW、dataSourceTransition=なし（初期から mock）、cacheHit=false、ORCA-05/06 は必須欠損のため missingMaster=true/fallbackUsed=false、ORCA-08 は欠損なし。ハッシュ: orca05=98fbad636ee1df23df343ff5beb31f79c8318f7fa36be95fa98e665ae3549591、orca06=92ce399599ecf93f96130ae97c385799ca6bc6a040b8c3782d464c20f3e6ab3f、orca08=197ff1ec423c07b9dcf121958650a69e1a2bca4021e5f3db08425c243d3af3ec。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「実サーバー提供後の差分比較フロー」追記
- runId: 20251124T000000Z
- actorRole: worker
- change: server 版ハッシュ生成・保存先（`hashes/server/`）、msw 基準ハッシュとの比較手順、許容差分（件数±1%、単価差1円以内）、#SP3 への記録項目を明文化し、diff 保存パス例を追加。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: mock→server の `dataSourceTransition`、`cacheHit`、`missingMaster`/`fallbackUsed` の監査ログ確認を比較記録に含める運用を追記。
- scope: DOC_STATUS 備考リマインダー追記（04 行）
- runId: 20251124T000000Z
- actorRole: worker
- change: DOC_STATUS 04 行 備考に「server 版ハッシュ・監査ログを #SP3 に貼付後、備考を『server版添付済』へ更新する」リマインダーを 1 行で追加。
- evidencePath: docs/web-client/planning/phase2/DOC_STATUS.md
- timestamp: 2025-11-24T00:00:00Z
- note: server 版計測完了時の更新漏れ防止用メモ（本行更新で完了扱い）。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「リスクと監査計画」節更新
- runId: 20251124T000000Z
- actorRole: worker
- change: リスク列挙を監査メタ必須項目・検知/回避策・テスト観点付きで追記
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: 要件節を追加し、ORCA-05/06/08 の不足フィールドと依存 UI、ブリッジ入力/出力仕様、TTL/更新頻度を表形式で整理（RUN_ID=20251124T000000Z）。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「リスクと監査計画」節更新
- runId: 20251124T000000Z
- actorRole: worker
- change: リスク一覧を表形式に再構成し「完了条件」列を追加、各リスクのクローズ基準を明文化
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: リスク完了条件追記（RUN_ID=20251124T000000Z、契約テスト/E2E での送出確認基準を明示）
- scope: docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md
- runId: 20251124T000000Z
- actorRole: worker
- change: マネージャーチェックリストに「契約テスト結果を #SP3 に添付」「監査メタ完了条件確認」のチェック項目を追記
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: 04 計画リスク完了条件をマネージャー側タスクに接続（RUN_ID=20251124T000000Z）
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「契約テスト観点（SP3ドラフト）」更新
- runId: 20251124T000000Z
- actorRole: worker
- change: cacheHit 遷移と snapshot→server 切替時の `dataSourceTransition`/`missingMaster`/`fallbackUsed` 監査確認ステップを箇条書きで追記
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: SP3 契約テストで監査メタを確実に検証できるよう、cacheHit true→false→強制 refetch と切替時の監査項目を明文化（RUN_ID=20251124T000000Z）
- scope: docs/web-client/planning/phase2/DOC_STATUS.md（04 行）
- runId: 20251124T000000Z
- actorRole: worker
- change: 備考に「SP3 契約テスト結果（ハッシュ + 監査ログ） #SP3 添付済み」を完了時に追記する運用メモを追加（現状未添付であることを明記）
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: SP3 実データ契約テストの証跡（ハッシュ + 監査ログ）を #SP3 に添付した際に DOC_STATUS 備考へ反映するためのリマインダー
- scope: docs/web-client/planning/phase2/DOC_STATUS.md（04 行）
- runId: 20251124T000000Z
- actorRole: worker
- change: 備考を更新し「SP3 契約テスト結果（MSW版ハッシュ + 監査ログ）#SP3 添付済み。server 版は提供後に追記予定」と記載
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: DOC_STATUS 備考更新（SP3 添付済）を反映、RUN_ID=20251124T000000Z
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「契約テスト手順（SP3）」更新
- runId: 20251124T000000Z
- actorRole: worker
- change: server 提供開始後に実行するハッシュ生成・比較チェックリストを追加し、MSW 基準との突き合わせ手順と待ち状態を明示
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: DOC_STATUS 備考と連動する SP3 待ちタスク（server ハッシュ計算→保存→比較→監査確認→#SP3 記録）を整理
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「データソース設計」節新設
- runId: 20251124T000000Z
- actorRole: worker
- change: MSW→snapshot→固定コードの優先度表を追加し、フォールバック条件と `dataSourceTransition` 監査送出トリガを明文化。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: API_UI_GAP_ANALYSIS 方針と RUN_ID=20251124T000000Z に揃え、スナップショット更新やバナー表示変化時の監査メタ送出条件を記載。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「実装ロードマップ」節追記
- runId: 20251124T000000Z
- actorRole: worker
- change: SP1〜SP4 の担当・締切・完了条件・証跡パスを表形式で追加。`03_ギャップ解消方針とUI影響分析.md` と整合させ、SP1=型/フィクスチャ整理、SP2=ブリッジ実装、SP3=契約テスト、SP4=切替準備とした。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: 各行に RUN_ID を明示し、JST 締切（SP1=11/26 12:00、SP2=11/26 18:00、SP3=11/26 22:00、SP4=11/27 06:00）と確認項目（監査メタ送出/E2E/契約テスト）をログアンカー #SP1〜#SP4 で参照できるようにした。

- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「データソース設計/要件/実装ロードマップ/リスクと監査計画」参照リンク補完
- runId: 20251124T000000Z
- actorRole: worker
- change: 各節に API/UI ギャップ分析・API サーフェスガイド・ORCA API ステータスへの参照を明記し、ロードマップ表の証跡パスを #SP1〜#SP4 アンカーに更新。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: RUN_ID=20251124T000000Z で脚注を統一し、参照先を追跡可能にした。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「SP1具体タスクリスト」節追加
- runId: 20251124T000000Z
- actorRole: worker
- change: SP1 行直下に小節を追加し、型生成対象（ORCA-05/06/08 必須列）、MSW フィクスチャ差し替え対象、必須列バリデーションのチェックポイントを箇条書きで整理。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T07:15:00Z
- note: 生成スクリプト禁止を再確認した上で手動型確定を明示し、監査メタ送出条件（dataSource/fallbackUsed/missingMaster）の検証観点を合わせて記載。
- scope: リスク/SP整合性確認
- runId: 20251124T000000Z
- actorRole: worker
- change: リスク表の完了条件を SP1〜SP4 の完了条件に合わせて更新（スナップショット陳腐化/キャッシュ TTL/ロールバック手順を契約テスト・E2E 完了基準へ整理）。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T07:25:00Z
- note: 長期メトリクス前提を削り、SP3 契約テストおよび SP4 E2E で検証可能な完了条件に統一。
- scope: DOC_STATUS備考調整（04）
- runId: 20251124T000000Z
- actorRole: worker
- change: DOC_STATUS 04 行の備考に「マネージャーチェックリスト更新（タスクC・契約テスト結果 #SP3 添付必須）」を追記し、manager checklist 連携済みであることを明示。
- evidencePath: docs/web-client/planning/phase2/DOC_STATUS.md
- timestamp: 2025-11-24T07:35:00Z
- note: `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` 更新済み（タスクC/契約テスト添付）との整合を備考に反映。
- scope: SP4 チェックリスト下書き追加
- runId: 20251124T000000Z
- actorRole: worker
- change: SP4 行直下にチェックリスト小節を追加し、runtime flag 切替、ロールバック条件、監査メタ最終確認、E2E ログリンク、Slack 通知テンプレを列挙（完了条件を SP4 行と一致させた）。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4
- timestamp: 2025-11-24T07:50:00Z
- note: MSW↔server 切替 E2E で監査メタ送出と再取得誘導を確認する前提のチェックリストを明文化。
- scope: SP4 チェックリスト追補（server版ハッシュ比較）
- runId: 20251124T000000Z
- actorRole: worker
- change: SP4 チェックリストに server 提供開始後のハッシュ比較項目を追加し、差分許容外時は runtime flag を msw へ戻すロールバック条件を明記。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4
- timestamp: 2025-11-24T08:05:00Z
- note: ハッシュ比較結果は #SP3 へ貼付し、SP4 完了条件に「差分許容内」を組み込むことで切替準備の判断材料を明確化。
- scope: SP4 チェックリスト具体化（実行手順・ログパス追加）
- runId: 20251124T000000Z
- actorRole: worker
- change: SP4 各項目に runtime flag 切替手順、ロールバック時のログ確認、ハッシュ比較の証跡パス、主要6シナリオ E2E ログパス、Slack 通知テンプレを1行ずつ追記し完了条件へチェックボックスを付与。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4
- timestamp: 2025-11-24T09:30:00Z
- note: E2E 主要6シナリオログを `artifacts/e2e/20251124T000000Z/sp4-main-scenarios.log`、flag 切替ログを `artifacts/e2e/20251124T000000Z/sp4-runtime-flag.log` に集約する運用を明文化。
- scope: マネージャーチェックリスト追記（タスクC）
- runId: 20251124T000000Z
- actorRole: worker
- change: タスクCに SP3 ハッシュ・監査ログ添付と SP4 ハッシュ比較/E2E ログ添付の完了条件枠（完了日/証跡）を追加。
- evidencePath: docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md
- timestamp: 2025-11-24T08:15:00Z
- note: manager 側で SP3/SP4 証跡貼付を明示し、完了日と証跡パスを記録できるように枠を用意。
- scope: DOC_STATUS整合（04）
- runId: 20251124T000000Z
- actorRole: worker
- change: DOC_STATUS 04 行の備考に最新ログ `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-master-bridge-plan.md` と最新スナップショット `artifacts/api-stability/20251124T000000Z/master-snapshots/`（404/000 のみ差分なし）を追記し、RUN_ID を 20251124T000000Z に統一。
- evidencePath: docs/web-client/planning/phase2/DOC_STATUS.md
- timestamp: 2025-11-24T00:00:00Z
- note: 旧計画ログ（20251124T021734Z）と同期ジョブ成果物予定（master-sync）を併記して参照を維持。
- scope: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md 「server版 ↔ MSW 差分記録テンプレ」追加
- runId: 20251124T000000Z
- actorRole: worker
- change: SP3 節末尾に server 版と MSW 版の差分記録用テンプレート表を追加し、実行日時/環境/ハッシュ値/件数差/単価差/許容判定/diff ファイルパス/監査メタ送出確認を空欄で並べた。
- evidencePath: src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md#SP3
- timestamp: 2025-11-24T00:00:00Z
- note: RUN_ID=20251124T000000Z の比較ログ待ちタスク用。server 提供開始後に記入し #SP3 に追記する運用。
- scope: .kamui/model-versions-cache.json（ツールモデルキャッシュ）
- runId: 20251124T000000Z
- actorRole: worker
- change: timestamp 自動更新のみ（codex/claude/gemini の version/availability 変更なし）を確認。src/webclient_modernized_bridge/04_* 計画タスクへの影響なしと判断し、今回作業範囲外・既存変更尊重で扱う。
- evidencePath: docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md
- timestamp: 2025-11-24T00:00:00Z
- note: `git diff -- .kamui/model-versions-cache.json` で timestamp のみ差分を確認し、04 計画（リスク/データソース/ロードマップ）に波及しないことを明示。

## 付録: CI/同期ジョブ設計
- 日次スナップショット生成 (MSW・点数表): 18:00 UTC / 03:00 JST。出力 `artifacts/api-stability/20251124T000000Z/master-sync/<YYYYMMDD>/msw-etensu/`。保持 7 世代ローテーション。失敗時は Phase2 Ops Slack `#modernized-webclient` BOT 通知＋managerdocs 連絡網メール。
- 週次住所コード同期: 18:10 UTC / 03:10 JST（毎週月曜）。出力 `.../master-sync/<YYYYMMDD>/address/`。保持 4 世代。失敗時は同 Slack に WARN、CI サマリをマネージャーへメール。
- 手動リラン（障害復旧用）: 随時。出力同階層に `<YYYYMMDDHHmm>-rerun/` を追加し自動削除しない。実行者は本ログへ RUN_ID と理由を追記し、Slack で共有。

## 監査メタ実装メモ
- `dataSourceTransition`: 層=source resolver。cold start と `from/to/reason` が変化した瞬間だけ送出し、UI フラグ切替も同 resolver を経由させて一元化。
- `dataSource` / `apiRoute`: 層=fetch adapter。HTTP 成功時に必ず送出し、cache hit 時も `cacheHit=true` を付けて監査へ透過。
- `cacheHit`: 層=fetch adapter。React Query のキャッシュ判定後にセット。TTL 内の返却は `cacheHit=true`、強制 refetch/TTL 超過時は `cacheHit=false` を送出。
- `fallbackUsed`: 層=source resolver（降格時）、merge 層（空レスを fallback で埋めた場合）で true。フォールバック選択時と保存前検証時に送出。
- `missingMaster`: 層=merge（スキーマ検証）と UI（保存前チェック）。必須欠落検知時に true、欠落解消時は false で再送出。
- 送出期待タイミング: fetch 成功= `dataSource`/`apiRoute`/`cacheHit`/`missingMaster`、フォールバック= これに `dataSourceTransition`/`fallbackUsed` を追加、キャッシュ返却= `cacheHit=true` を強制し再送出。

<a id="SP1"></a>
## SP1
完了条件: `resolveMasterSource`/`fetch adapter` の API 面と監査フィールドを `03_ギャップ解消方針…` に一致させ、本ファイルへ反映し型/フィクスチャ diff をログに残す。

- 2025-11-24T06:12:00Z / actor: codex / progress: 型生成は 2025-11-22 時点のモダナイズ OpenAPI（`/orca/master/address|insurer|generic-price|use-class`）を基に ts 型を固定開始。MSW 差し替え対象を `msw/handlers/master/*` とし、`artifacts/api-stability/20251124T000000Z/master-snapshots/` に揃えて `dataSource=snapshot|mock` を返す方針。必須列 code/name/category/validFrom/validTo(+warningFlag) を Zod 検証し欠損時は `audit.logValidationError` + 再取得誘導で統一。
- 2025-11-24T06:35:00Z / actor: codex / progress: DOC_STATUS 04 行の備考に最新ログ `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-master-bridge-plan.md` と最新スナップショット `artifacts/api-stability/20251124T000000Z/master-snapshots/` が記載済みであることを確認のみ。追記なし。
- 2025-11-24T07:15:00Z / actor: codex / progress: SP1具体タスクリストを追加し、型生成対象（ORCA-05/06/08 必須列）・MSW フィクスチャ差し替え対象・必須列バリデーションのチェックポイントを整理。生成スクリプト禁止を明示し、監査メタ送出条件を検証観点に含めた。

<a id="SP2"></a>
## SP2
完了条件: React Query TTL=5分設定・fallback 定数組み込み・`dataSource`/`dataSourceTransition` 送出実装を終え、`/orca/master/address` スモークで `dataSource=server` を確認。

<a id="SP3"></a>
## SP3
完了条件: MSW ↔ 実サーバーのスキーマ差分/件数差分契約テストが緑となり、`dataSource`/`fallbackUsed`/`missingMaster` 監査メタ検証が完了。

<a id="SP4"></a>
## SP4
完了条件: [ ] Feature flag で MSW↔server を往復し主要6シナリオ E2E PASS、警告バナー/監査メタが UI で表示・送出されること。

## スコープ確認メモ（2025-11-24T08:20:00Z, actor=codex）
- `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` に、ORCA-05/06/08 の REST 提供などサーバー API 新規実装はスコープ外であり、依存事項として別タスクで管理する旨を明記。
- 本計画はクライアント側ブリッジ設計・運用に限定し、サーバー提供開始後は SP3 手順（server 版ハッシュ比較・監査確認）で検証する方針。
