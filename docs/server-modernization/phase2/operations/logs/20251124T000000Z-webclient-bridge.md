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
- 2025-11-24T21:30:00Z / actor: codex / progress: SP1 設計レビュー用サマリ草案（RUN_ID=20251124T073245Z, 親=20251124T000000Z）を作成。source resolver / fetch adapter の API 境界と監査フィールド最小セット（runId/dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/version/tensuVersion）を 1 枚に集約し、TTL（fetch=5m, snapshot=24h, address=7d）と UI 側の warning ブロック条件（必須欠損時は `audit.logValidationError` + 保存停止）を整理。レビュー観点として flag 切替/フォールバック/ハッシュ手順との整合を明記。
- 2025-11-24T21:35:00Z / actor: codex / progress: bridge-sync 雛形メモ（Node/tsx 前提・Python 禁止）を #SP1 に追記。入力: `artifacts/api-stability/20251124T000000Z/master-snapshots/` の ORCA-05/06/08 JSON。処理: masterType ごとにソートキー固定→必須フィールド抽出→スペースなし JSON 文字列化→`sha256`。出力: `artifacts/api-stability/20251124T000000Z/master-sync/<YYYYMMDD>/hashes/{orca05,orca06,orca08}.hash` と `README.md`（runId/parentRunId/snapshotVersion/inputs/コマンド例 `node scripts/bridge-sync --runId 20251124T073245Z --date <YYYYMMDD> --source snapshots`、ログ追記先=#SP1）。副作用: server/legacy 書込みなし・ネットワーク不要を明記し、落穂拾いとして失敗時にリネームでロールバックする旨を記載。

<a id="SP2"></a>
## SP2
完了条件: React Query TTL=5分設定・fallback 定数組み込み・`dataSource`/`dataSourceTransition` 送出実装を終え、`/orca/master/address` スモークで `dataSource=server` を確認。

<a id="SP3"></a>
## SP3
完了条件: MSW ↔ 実サーバーのスキーマ差分/件数差分契約テストが緑となり、`dataSource`/`fallbackUsed`/`missingMaster` 監査メタ検証が完了。
- 2025-11-25 08:50 JST / actor: codex / runId=`20251124T073245Z`: MSW 基準ハッシュを `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/msw/` に配置済みであることを確認し、本アンカーへリンク。server 版ハッシュは未取得（提供待ち）。UI スモーク証跡プレースホルダ `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-msw-smoke.json` を作成し、MSW 契約テスト用ケース `web-client/src/mocks/__tests__/orca-master-fixture.contract.test.ts` を追加。`npm run test -- src/mocks/__tests__/orca-master-fixture.contract.test.ts` は jsdom が `ArrayBuffer.prototype.resizable` を要求するため Node v18.19.1 では失敗（次回 Node20+ 環境で再実行）。

### ハッシュ取得状況（RUN_ID=20251124T073245Z, parent=20251124T000000Z）
- MSW 基準: `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/{orca05,orca06,orca08}.hash` と `.../hashes/msw/` に同値を保持（環境=MSW, dataSourceTransition=なし, cacheHit=false, missingMaster=true:05/06・false:08, fallbackUsed=false:05/06/08）。ハッシュ: orca05=`13832d8f5e091145073ff1c26ac2cef085f766ad50d4bebef665c514692e40a2`, orca06=`a33be23a1cd8c4d9bb7b2030d6fdb4e3f76b6dd68c8702be70d442dcb1abfc36`, orca08=`1a2974d25b204ba414caee1d150e105e3938e9e2897ecefa00dc718d59467c85`。
- server 版: `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05,orca06,orca08}.hash`（環境=snapshot, dataSourceTransition=なし, cacheHit=false, missingMaster=false, fallbackUsed=false / 2025-11-25 取得済み、diff=`master-sync/20251124/diffs/server-vs-msw-orca*.json`）。

- 2025-11-25T03:42:54Z / actor: codex / runId=`20251124T073245Z`: MSW ハッシュを現行整形ロジックで再計算し `.../hashes/{orca05,06,08}.hash` および `.../hashes/msw/` を置換。server レスポンスは `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/` を入力として再比較。結果: orca05=`13832d8f5e091145073ff1c26ac2cef085f766ad50d4bebef665c514692e40a2`（server 側=`5c38f4029ee950fbc825b8d8d602188097c8f7ca27278026ba01bec38f294922` で件数差 -1: generic-class 未収集、minPrice 合計は双方 970 で一致）、orca06=`a33be23a1cd8c4d9bb7b2030d6fdb4e3f76b6dd68c8702be70d442dcb1abfc36`（件数差0、hash 完全一致）、orca08=`1a2974d25b204ba414caee1d150e105e3938e9e2897ecefa00dc718d59467c85`（件数差0、tanka 合計 1011 で一致）。監査メタ確認: server 応答は dataSource=snapshot/cacheHit=false/missingMaster=false/fallbackUsed=false で dataSourceTransition 未送出。証跡: `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca*.json`。

### server 版取得テンプレ（下書き）
- 入力セット: ORCA-05/06/08 API 応答（MSW と同一コードセット、code/payerCode/tensuCode 昇順ソート、フィールド順固定）、監査ログ（`dataSource`/`apiRoute`/`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed`）。
- 保存パス: `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05,orca06,orca08}.hash`（sha256、改行なし）＋比較ログ `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca{05,06,08}.json`。
- 比較観点: ハッシュ完全一致を第一判定。件数差±1%/単価差±1円を閾値に差分を `diffs/` へ保存し #SP3 へ貼付。監査メタが server でも送出されていることをログで確認し、`dataSourceTransition`/`cacheHit` 遷移・`missingMaster`/`fallbackUsed` 状態を明記する。

<a id="SP4"></a>
## SP4
完了条件: [ ] Feature flag で MSW↔server を往復し主要6シナリオ E2E PASS、警告バナー/監査メタが UI で表示・送出されること。
- 2025-11-25 08:50 JST 下書き（runId=`20251124T073245Z`）: 主要シナリオ予定
  - [ ] ORCA-05: `WEB_ORCA_MASTER_SOURCE=msw` で最低薬価欠落→警告バナー＋保存ブロック＋`missingMaster=true` 送出
  - [ ] ORCA-06: MSW 空レス→`fallbackUsed=true` を UI/監査で確認、`WEB_ORCA_MASTER_SOURCE` を server に一時切替して dataSourceTransition を取得
  - [ ] ORCA-08: `/orca/tensu/ten` 経路で `tensuVersion` 透過と空ヒット時 `missingMaster=true` を確認
  - [ ] 切替テレメトリ: `msw→server→msw` の往復で dataSourceTransition を 2 回送出し、log パスを `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#ui-smoke` に追記
  - 実施予定: GUI 環境入手後に実行（flag=msw baseline → server → msw）、証跡は `artifacts/api-stability/20251124T000000Z/ui-smoke/` へ保存。
- 2025-11-25 09:40 JST / actor: codex / runId=`20251124T073245Z`: `WEB_ORCA_MASTER_SOURCE` / `VITE_ORCA_MASTER_BRIDGE` の参照実装が web-client コードに存在せず、`fetchOrca05|06|08BridgeMasters` は dataSource=mock/fallbackUsed=true/missingMaster=true を返すスケルトンのため server 経路での主要6シナリオ E2E を開始できず。実行を見送り、block 理由と再実施条件を `artifacts/e2e/20251124T000000Z/sp4-main-scenarios.log` に記録（再実施条件: ブリッジが server 実装に接続され runtime flag が fetch 層で有効、HTTPS dev/preview へ Playwright 到達可）。
- 2025-11-25 12:30 JST / actor: codex / runId=`20251124T073245Z`: SP4 blocker 追加整理。`fetchOrca05|06|08BridgeMasters` は dataSource=(options?.sourceHint ?? 'mock') 固定＋fallbackUsed/missingMaster=true で HTTP 未実装、web-client/src からの呼び出しも無し。`WEB_ORCA_MASTER_SOURCE` / `VITE_ORCA_MASTER_BRIDGE` は web-client/src に参照ゼロ（`.env.sample` も未定義）で runtime flag が存在せず、MSW 有効時は orcaMasterHandlers が snapshot レスポンスのみ返却する。MSW を無効化しても source resolver 不在のため server/snapshot 切替・`dataSourceTransition`/`cacheHit` 送出ができず、server 経路 E2E を開始できない。既知の UI スモーク不足（MSW 件数最小・セレクタ未描画）は server 経路でも同じ欠損が発生するため、flag 配線と fetch 実装が揃うまで主要シナリオは FAIL 想定。
- 2025-11-26 13:15 JST / actor: codex / runId=`20251124T073245Z`: HTTP 実装＋監査メタ透過の差分リスト（実装なし、必要変更の洗い出し）。
  - httpClient 呼び出し: `fetchOrca05|06|08BridgeMasters` を `/orca/master/{generic-class|generic-price|youhou|material|kensa-sort}`（ORCA-05）、`/orca/master/{hokenja|address}`（ORCA-06）、`/orca/tensu/etensu`（ORCA-08）へ接続し、共通 Query（keyword/pref/asOf/tensuVersion/page/pageSize/effectiveDate）を OpenAPI に合わせて渡す。MSW/snapshot と同一 DTO（`OrcaMasterListResponse<T>`）で統一。
  - 監査メタ透過: server 応答の `runId`/`snapshotVersion`/`version` をそのまま返却し、`dataSource` は runtime resolver で `server|snapshot|mock|fallback` を判定。HTTP→snapshot/fallback へ切替時は `dataSourceTransition.from/to/reason` を付与し、cache hit は server 側ヘッダ/レスポンスを優先（無ければ false）。
  - fallback 統一: 404/空配列は `missingMaster=true`、スナップショットで値が取れた場合は `fallbackUsed=true` で dataSourceTransition(from=server,to=snapshot,reason=not_found)。503/ネットワーク例外も同様に snapshot→mock の二段 fallback を許可し、`validationError=true` は 422 のみで付与。
  - エラーハンドリング: 422 は入力バリデーション結果を ErrorResponse から抽出し UI へ表示、404（address not found など）は missingMaster フラグのみで retry 不要扱い、5xx/タイムアウトは snackbar＋fallbackUsed。共通エラー整形を orca-api.ts 内でまとめ、fetch 呼び出し元の try/catch を廃止。
  - env 参照: `.env.sample` に `VITE_ORCA_MASTER_BRIDGE`（msw|snapshot|server|mock auto）と `VITE_ORCA_MASTER_SOURCE`（Session/診療録での一時切替想定）を追加し、bridge resolver で httpClient/sourceHint に渡す。`.env.stage`/`.env.production` に server をデフォルト設定し、`server-modernized` の flag `ORCA_MASTER_BRIDGE_ENABLED` と整合させる。
  - REST 期待ペイロード/挙動メモ: ORCA-05=統合 DTO（Drug/SpecialEquipment/Dosage/Kensa）を `items[]` + meta(runId/snapshotVersion/dataSource/cacheHit/missingMaster/fallbackUsed) 付きで返却、generic-price は price=null 時 missingMaster/fallbackUsed=true。ORCA-06=`/hokenja` は totalCount+items、`/address` はヒットなし `{}`（missingMaster=true）/404=not found。ORCA-08 `/orca/tensu/etensu` は totalCount+items、空=404 or totalCount=0（missingMaster=true）、422 は tensuVersion/kubun 不整合で validationError=true。
- 2025-11-26 23:30 JST / actor: codex / runId=`20251124T073245Z`: runtime source resolver 実装と ORCA-05/06/08 bridge fetch を web-client に追加。`WEB_ORCA_MASTER_SOURCE` と `VITE_ORCA_MASTER_BRIDGE` を env に配線し、resolver で server→snapshot→mock→fallback 順にフェッチ、`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed` を統合返却。MSW/snapshot フィクスチャを再利用したフォールバック経路を実装。単体テストは vitest ワーカー異常終了のため未完（原因調査要）。
- 2025-11-25 15:10 JST / actor: codex / runId=`20251124T073245Z`: vitest ワーカー異常終了の原因は Vitest v4 未サポートの CLI フラグ（`--runInBand`/`--poolOptions`）指定。`npm run test -- --reporter=verbose src/features/charts/api/__tests__/orca-api.test.ts`（@vitest-environment node, setupFiles=`src/test/setupTests.ts` polyfill 読込）で 13/13 PASS を確認。`web-client/test-results/.last-run.json` を PASS 状態で更新。
- 2025-11-25 15:20 JST / actor: codex / runId=`20251124T073245Z`: Charts の ORCA-05/06/08 取得を resolver 経由に配線。`searchTensuByName|PointRange`/`searchDiseaseByName`/`lookupGeneralName`/`lookupAddressMaster` を `fetchOrca0{5,6,8}BridgeMasters` ベースの `OrcaMasterListResponse` 返却に統一し、`WEB_ORCA_MASTER_SOURCE`/`VITE_DISABLE_MSW`/`VITE_ORCA_MASTER_BRIDGE` を反映。MSW 有効時は既存フィクスチャ、無効時は snapshot→server→fallback の順に自動切替。422(zip) は OrcaValidationError を透過、`dataSource`/`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed`/`runId`/`snapshotVersion` を UI (`OrcaOrderPanel`/`useOrcaMasterSearch`) 表示と `recordOperationEvent` で送出。`fetchMinimumDrugPrices` など ORCA05/06 ラッパーも resolver 経由に更新。証跡: web-client/src/features/charts/api/orca-api.ts / hooks/useOrcaMasterSearch.ts / components/OrcaOrderPanel.tsx / __tests__/orca-api.test.ts。
- 再実施条件（優先順）: 1) runtime source resolver を追加し `WEB_ORCA_MASTER_SOURCE` または `VITE_ORCA_MASTER_BRIDGE`＋セッションフラグを読んで fetch/adapters へ渡し、`dataSource`/`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed` を監査へ透過させる; 2) `fetchOrca0{5,6,8}BridgeMasters` を httpClient 経由で ORCA-05/06/08 REST に接続し runId/version/snapshotVersion をレスポンスへ伝播（MSW/snapshot/fallback 経路も同一スキーマで統一）; 3) MSW 無効時に UI の検索候補・セレクタが空にならないよう server/snapshot で初期データが取得できる seed と HTTPS dev/preview への到達性を確保し、Playwright が `/charts` まで遷移できることを確認（必要に応じて MSW fixture を補強）。
- 2025-11-25 14:30 JST / actor: codex / runId=`20251124T073245Z`: runtime source resolver 設計メモ（実装なし）を整理。
  - 配置/責務案: `web-client/src/features/charts/api/orca-source-resolver.ts`（仮）で `resolveOrcaMasterSource(masterType, options)` を公開し、(1) env `WEB_ORCA_MASTER_SOURCE`/`VITE_ORCA_MASTER_BRIDGE` と `VITE_DISABLE_MSW` を読んで初期値決定、(2) セッション/ユーザー操作用の一時フラグ（例: `sessionStorage.orcaMasterSource`, dev toolbar での override）を優先、(3) `auditContext` へ `dataSourceTransition`/`runId`/`snapshotVersion`/`fallbackPolicy` を強制付与、(4) フォールバック順 `server→snapshot→msw→fallback` を一元化し cache ヒット有無と警告表示トリガを決定する役割を持たせる。
  - fetch adapter 再利用方針: server 経路は既存 `httpClient`（CSRF/traceparent/request-id/audit logger 付き）と `measureApiPerformance` をそのまま利用し、resolver が決めた `source`/`snapshotVersion`/`runId` をクエリ or ヘッダーで渡すだけの差分に留める。MSW/snapshot/fallback 経路は `OrcaMasterListResponse` 既存型（`dataSource/cacheHit/missingMaster/fallbackUsed/runId/version`）に揃え、`fetchOrca0{5,6,8}BridgeMasters` の `sourceHint`/`version` 引数を `resolveOrcaMasterSource` の出力（dataSourceTransition 付き）で上書きする実装方針。httpClient インタフェース変更は不要で、追加パラメータは call site の options 拡張で吸収する。

## スコープ確認メモ（2025-11-24T08:20:00Z, actor=codex）
- `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` に、ORCA-05/06/08 の REST 提供などサーバー API 新規実装はスコープ外であり、依存事項として別タスクで管理する旨を明記。
- 本計画はクライアント側ブリッジ設計・運用に限定し、サーバー提供開始後は SP3 手順（server 版ハッシュ比較・監査確認）で検証する方針。
