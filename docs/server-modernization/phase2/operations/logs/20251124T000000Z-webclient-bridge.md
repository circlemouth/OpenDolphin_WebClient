# 20251124T000000Z Webクライアント モダナイズブリッジ方針更新ログ

- 対象: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md`
- RUN_ID: `20251124T000000Z`
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → 本ログ
- 根拠資料: `src/webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md`（RUN_ID=`20251123T135709Z`）、`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`（2025-11-22 mac-dev 実測）、`docs/web-client/process/API_UI_GAP_ANALYSIS.md`

## 1. 変更サマリ
- RUN_ID を `20251124T000000Z` へ更新し、完了・未完・リスク表を追加（ORCA-01〜08 の現状・UI 影響・次アクションを明示）。
- UI 影響表を画面単位（Charts オーダ/病名、受付・予約、住所補完、Claim 再計算）に再構成し、「症状/UXリスク」「解消方針」「テスト観点」を追加。警告トーンと監査メタの送出条件を整理。
- 監査要件セクションの必須メタを RUN_ID 付きで更新し、`audit.log*` の欠落フィールドをチェックする箇所を明示。
- 監査メタ必須項目に `actorRole`/`clientUUID`/`apiRoute`/`valueBefore`/`valueAfter`/`evidencePath` を追加し、Charts（オーダ/病名・点数算定/点数帯検索/スタンプ）、Reception/FacilitySchedule（保険・予約）、Claim、接続先ガード・環境切替の各行へ「監査ログ出力確認（項目: …）」を追記してテスト観点を拡張。
- エビデンス計画を `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md` / `artifacts/api-stability/20251124T000000Z/master-snapshots/`（2025-11-24 mac-dev 実測 404/000 を保存済み）で運用する方針に更新。
- 画面別 UI 影響表に ORCA-04（点数帯フィルタ）、接続先未設定ガード/TraceId（接続基盤 02）、接続設定ハードニング（ORCA-07）、ORCA-01〜03 回帰監視の行を追加し、02 系ドキュメントのギャップを全て網羅。
- 完了/未完/リスク表（0-1 節）に「解消オーナー」「ターゲット日」「次アクション（誰が・何を・いつまでに）」列を追加。未完/暫定行へ以下を追記: ORCA-04=2025-11-25（SP3）、ORCA-05/06/08=暫定 2025-12-06（サーバー REST 追加 ETA 未確定）、ORCA-07=暫定 2025-12-02（設計レビュー未完）、監査メタ整備=2025-11-25（SP4）。

## 2. ORCA API 状況の引用ポイント（整合確認）
- `ORCA_API_STATUS.md` 2025-11-22 実測で受付/予約系（`acceptlstv2`/`appointmodv2`/`medicalmodv2`）が HTTP200/Api_Result=00 まで前進。一方、マスタ系（ORCA-05/06/08）は REST 未提供のまま。
- 本ドキュメントでは上記を前提に、マスタ欠落箇所を暫定データ + 警告表示で継続する方針とし、接続切替後の契約テストを SP3 以降に位置付け。

## 3. 追加の確認事項/宿題
- 監査メタ `missingMaster` と `fallbackUsed` の送出可否を Charts/Reception/Claim の各保存系でレビューすること。
- `artifacts/api-stability/20251124T000000Z/master-snapshots/` に 2025-11-24 mac-dev 実測（/orca/master/address・/orca/tensu/ten=404+JSON、/api/orca/*=000 empty）を保存済み。20251123 基点不在のため有効差分はなし。

## 4. DOC_STATUS 整合性確認
- `docs/web-client/planning/phase2/DOC_STATUS.md` の Webクライアント/連携 行を再確認し、最終レビュー日=2025-11-24、RUN_ID=`20251124T000000Z`、証跡ログ=`docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md` で整合していることを確認（修正なし）。

## 5. API master スナップショット差分取得（RUN_ID=20251124T000000Z）
- 基点: `artifacts/api-stability/20251123T130134Z/master-snapshots/`（リポジトリ内に実体なしのため比較不能）。
- 実施日時: 2025-11-24 10:47 JST。接続先: `http://100.102.17.40:8000`（Basic: ormaster/<redacted>）。Python 不使用で curl のみ。
- 取得結果: `/orca/master/address?zip=1000001` と `/orca/tensu/ten?min=110000000&max=110000099` は 404 + JSON エラーボディを保存。`/api/orca/master/address` と `/api/orca/tensu/ten` は空応答（status=000）で body/headers 取得不可、curl ログを `*_error.txt` に保存。
- 保存先: `artifacts/api-stability/20251124T000000Z/master-snapshots/`（README 追記済み）。基点不在かつ全リクエスト非200のため有効スナップショット差分は「なし」。

## エビデンス整合
- `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md` §5 を、実在する `artifacts/api-stability/20251124T000000Z/master-snapshots/` と 404(JSON)/000(empty reply) 応答前提で更新。
- 同ドキュメント §8 に 2025-11-24 10:47 JST mac-dev 実測（`/orca/master/address`・`/orca/tensu/ten`=HTTP404+JSON、`/api/orca/*`=status=000 empty reply）を追記し、20251123 基点不在ゆえ差分なしと明記。
- エビデンス配置・ログパスは RUN_ID=`20251124T000000Z` に揃え、DOC_STATUS は 404/000 のみで有効差分なしである旨を備考追記する方針。

## §監査要確認クローズ計画（RUN_ID=20251124T000000Z）
- Charts: OrcaOrderPanel 検索/選択 — オーナー: フロント / 期限: 2025-11-25 18:00 JST（SP4 QA）。`missingMaster=null` の送出有無を MSW+実API トレースで比較し、`cacheHit`/`dataSource`/`valueBefore`/`valueAfter` を含む監査ログを契約テストに追加。証跡: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md §2-1-1`。
- Charts: Diagnosis/Document 保存 — オーナー: フロント / 期限: 2025-11-25 18:00 JST（SP4 QA）。保存ブロック時にも `fallbackUsed` を送るかを `audit.logValidationError` で確認し、必要ならロガーへフィールド追加。監査ログ項目: runId/actorRole/patientId/screenId/action/apiRoute/dataSource/selectedCode/selectedName/fallbackUsed/dangerConfirm/validationStage/errorCode/uiBlocked/valueBefore/valueAfter/evidencePath。
- Reception/FacilitySchedule（予約・保険） — オーナー: QA / 期限: 2025-11-25 18:00 JST（SP4 QA）。キャンセル時の `confirmationChecked`/`blocked` 必須を検証し、必要なら UI 側でチェック必須化。監査ログ項目: runId/actorRole/patientId/screenId/action/apiRoute/dataSource/departmentCode/visitReason/insuranceType/fallbackUsed/confirmationChecked/fieldId/inputValue/reason/blocked/valueBefore/valueAfter/evidencePath。
- Claim/Billing 再計算・再送 — オーナー: サーバー（型）+ QA / 期限: 2025-12-02 18:00 JST（サーバーRESTレビュー）。`tensuCodeMissing` 型（bool vs 配列）を REST スキーマで確定し OpenAPI/ts/ロガーを同期、MSW/実API 契約テストを追加。監査ログ項目: runId/actorRole/patientId/screenId/action/apiRoute/dataSource/tensuCodeMissing/payerCodeMissing/validationStage/warningShown/errorCode/payloadFragment/uiBlocked/valueBefore/valueAfter/evidencePath。
- 警告バナー表示状態 — オーナー: フロント / 期限: 2025-11-25 18:00 JST（SP4 QA）。再表示時の重複送信方針を決定し、バナーID+`interaction`+`timestamp` の組で監査ログを検証。監査ログ項目: runId/actorRole/screenId/action/apiRoute/dataSource/bannerVisible/affectedUi/interaction/timestamp/evidencePath。

## 6. 再現手順（curl, mac-dev, RUN_ID=20251124T000000Z）
- 前提: `http://100.102.17.40:8000`、Basic 認証 `ormaster:<password>`、ヘッダ `Accept: application/json`。Python 不使用。
- 404 JSON 確認:  
  `curl -v -u ormaster:<password> "http://100.102.17.40:8000/orca/master/address?zip=1000001" -H "Accept: application/json" -o artifacts/api-stability/20251124T000000Z/master-snapshots/address_404.json 2> artifacts/api-stability/20251124T000000Z/master-snapshots/address_404.log`
- 404 JSON (tensu/ten):  
  `curl -v -u ormaster:<password> "http://100.102.17.40:8000/orca/tensu/ten?min=110000000&max=110000099" -H "Accept: application/json" -o artifacts/api-stability/20251124T000000Z/master-snapshots/tensu_ten_404.json 2> artifacts/api-stability/20251124T000000Z/master-snapshots/tensu_ten_404.log`
- 000 empty reply 確認:  
  `curl -v -u ormaster:<password> "http://100.102.17.40:8000/api/orca/master/address?zip=1000001" -H "Accept: application/json" -o artifacts/api-stability/20251124T000000Z/master-snapshots/api_master_address_000.txt 2> artifacts/api-stability/20251124T000000Z/master-snapshots/api_master_address_000.log`
- 000 empty reply (tensu/ten):  
  `curl -v -u ormaster:<password> "http://100.102.17.40:8000/api/orca/tensu/ten?min=110000000&max=110000099" -H "Accept: application/json" -o artifacts/api-stability/20251124T000000Z/master-snapshots/api_tensu_ten_000.txt 2> artifacts/api-stability/20251124T000000Z/master-snapshots/api_tensu_ten_000.log`
- 期待結果: 上記4本とも HTTP200 以外。`/orca/master/*` `/orca/tensu/*` は 404 + JSON エラー、`/api/orca/*` は status=000(empty reply)。有効スナップショット差分なし。
