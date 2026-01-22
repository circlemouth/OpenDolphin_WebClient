# テストカバレッジと未実施一覧

- 作成日: 2026-01-22
- RUN_ID: 20260122T190527Z
- 対象: ORCA preprod 実装棚卸し（テストレビュー）
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`

---

## 実施済みカバレッジ（証跡あり）

### 1. E2E / 統合テスト（非カルテ主要フロー）
- 実行 RUN_ID: `20260103T235314Z`
- 実行日: 2026-01-04 (UTC/JST)
- 実行範囲:
  - Reception: 例外一覧 / キュー状態 / 監査検索
  - Patients: 反映状態（未紐付警告）/ 監査検索
  - Charts: 送信 / 印刷ガード表示 / 復旧導線（再取得）
  - Administration: 配信状態 / ガード / 監査イベント（admin セッション）
- 証跡:
  - `artifacts/validation/e2e/logs/`
  - `artifacts/validation/e2e/screenshots/`
  - `artifacts/validation/e2e/README.md`
- 備考: WebClient は MSW ON で実行。

### 2. ナビゲーション/セッション共有の回帰テスト（2026-01-20）
- 単体/結合:
  - `httpClient.test.ts` / `sessionExpiry.test.ts` で 401/419/403 失効判定と BroadcastChannel 連携テストを追加済み
- E2E:
  - Playwright: `tests/e2e/navigation-broadcast.spec.ts`
  - 実行: `RUN_ID=20260120T061247Z npx playwright test tests/e2e/navigation-broadcast.spec.ts --reporter=list`
  - 成果物: `test-results/tests-e2e-navigation-broad-*/trace.zip`
- サブパス配信確認:
  - `web-client/scripts/verify-subpath-preview.mjs`
  - `VITE_BASE_PATH=/foo npm run test:subpath-preview` で `/foo/` と `/foo/f/0001/reception` の 200 を確認

---

## 未実施・不足しているテスト（API単位）

### ORCA 追加API（server-modernized 経由 / xml2・JSON）
- patientgetv2
  - 未実施理由: ORCA Trial/本番相当の実 API 結合テスト未実施（MSW 前提）
  - 次回前提: ORCA Trial 接続 + 患者IDの準備 + 監査ログ保存先
- patientmodv2
  - 未実施理由: 実 API での更新系テスト未実施（検証用患者データ未確保）
  - 次回前提: 変更可能な検証患者 + ロール権限確認
- medicalmodv2
  - 未実施理由: 実 API 連携の再現手順未整備
  - 次回前提: 診療データを持つ患者 + 監査ログ保存
- tmedicalgetv2
  - 未実施理由: ORCA 実応答の検証証跡なし
  - 次回前提: ORCA Trial 接続 + 取得対象の診療データ
- medicalgetv2
  - 未実施理由: ORCA 実 API 取得テスト未実施
  - 次回前提: 検証用診療データ + 監査ログ保存
- medicalmodv23
  - 未実施理由: 本番相当での更新系検証未実施
  - 次回前提: 変更可能な診療データ + ロール/権限確認
- diseasegetv2
  - 未実施理由: 病名取得の実 API テストなし
  - 次回前提: 病名を持つ患者データ + ORCA Trial 接続
- diseasev3
  - 未実施理由: 病名更新の実 API テストなし
  - 次回前提: 病名編集権限 + 監査ログ保存
- incomeinfv2
  - 未実施理由: 収納情報の実 API テストなし
  - 次回前提: 会計データが存在する患者 + ORCA Trial 接続
- subjectiveslstv2
  - 未実施理由: 症状詳記の実 API テストなし
  - 次回前提: 詳記データがある患者 + 監査ログ保存
- subjectivesv2
  - 未実施理由: 症状詳記更新の実 API テストなし
  - 次回前提: 更新可能な詳記データ + 権限確認
- contraindicationcheckv2
  - 未実施理由: 禁忌チェックの実 API テストなし
  - 次回前提: 服薬/病名データがある患者
- medicationgetv2
  - 未実施理由: 投薬情報取得の実 API テストなし
  - 次回前提: 投薬データがある患者
- medicatonmodv2
  - 未実施理由: マスタ更新系の実 API テストなし
  - 次回前提: ORCA Trial のマスタ更新許可 + 監査ログ保存
- masterlastupdatev3
  - 未実施理由: マスタ更新時刻取得の実 API テストなし
  - 次回前提: ORCA Trial 接続 + 取得ログ保存
- systeminfv2
  - 未実施理由: システム状態取得の実 API テストなし
  - 次回前提: ORCA Trial 接続
- system01dailyv2
  - 未実施理由: 日次処理系の実 API テストなし
  - 次回前提: 実行可能時間帯 + ORCA Trial 接続
- insuranceinf1v2
  - 未実施理由: 保険情報取得の実 API テストなし
  - 次回前提: 保険情報がある患者 + ORCA Trial 接続
- medicalsetv2
  - 未実施理由: セット情報取得の実 API テストなし
  - 次回前提: セット定義がある環境 + ORCA Trial 接続
- patientlst7v2
  - 未実施理由: 患者メモ一覧の実 API テストなし
  - 次回前提: メモ登録済み患者 + 監査ログ保存
- patientmemomodv2
  - 未実施理由: 患者メモ更新の実 API テストなし
  - 次回前提: 更新可能なメモ + 監査ログ保存
- pusheventgetv2
  - 未実施理由: PUSH 通知の実 API テストなし（キャッシュ冪等化の証跡なし）
  - 次回前提: ORCA Trial 接続 + 受信イベント発生条件の準備
- prescriptionv2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- medicinenotebookv2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- karteno1v2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- karteno3v2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- invoicereceiptv2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- statementv2
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ

### ORCA 公式 XML プロキシ
- /api01rv2/acceptlstv2
  - 未実施理由: 実 API の XML 送受信検証未実施
  - 次回前提: ORCA Trial 接続 + XML2 payload の実データ
- /api01rv2/system01lstv2
  - 未実施理由: 実 API の XML 送受信検証未実施
  - 次回前提: ORCA Trial 接続 + XML2 payload の実データ
- /orca101/manageusersv2
  - 未実施理由: 管理系 API の権限検証未実施
  - 次回前提: 管理権限アカウント + 監査ログ保存
- /api01rv2/insprogetv2
  - 未実施理由: 保険情報取得の XML 実 API 検証未実施
  - 次回前提: 保険情報がある患者 + ORCA Trial 接続

### JSON ラッパー
- /orca/appointments/list
  - 未実施理由: 実 ORCA 接続の結合テスト未実施（MSW 依存）
  - 次回前提: 予約データを持つ検証環境 + 監査ログ保存
- /orca/appointments/mock
  - 未実施理由: mock/実環境切替の UI 体験検証未実施
  - 次回前提: UI 切替ログの保存（スクリーンショット）
- /orca/patients/local-search
  - 未実施理由: 実 ORCA 検索の結合テスト未実施
  - 次回前提: 検索対象患者 + 監査ログ保存
- /orca/patients/local-search/mock
  - 未実施理由: mock/実環境切替の UI 体験検証未実施
  - 次回前提: UI 切替ログの保存
- /orca12/patientmodv2/outpatient
  - 未実施理由: 実 ORCA 更新系テスト未実施
  - 次回前提: 更新可能な検証患者 + 監査ログ保存
- /orca12/patientmodv2/outpatient/mock
  - 未実施理由: mock での異常系 UI 体験検証不足
  - 次回前提: 失敗ケースの MSW シナリオ記録

### 内製ラッパー
- /orca/medical-sets
  - 未実施理由: 実データと stub 混在の UI 判別テスト未実施
  - 次回前提: stub/実データ混在環境 + 監査ログ保存
- /orca/tensu/sync
  - 未実施理由: 実環境同期の結合テスト未実施
  - 次回前提: 点数マスタ差分がある環境 + 監査ログ保存
- /orca/birth-delivery
  - 未実施理由: 実データ前提の UI/監査検証未実施
  - 次回前提: 出産関連データを持つ検証環境
- /orca/medical/records
  - 未実施理由: 実データ取得の結合テスト未実施
  - 次回前提: 診療履歴がある患者 + 監査ログ保存
- /orca/patient/mutation
  - 未実施理由: 実更新系テスト未実施
  - 次回前提: 更新可能な検証患者 + 監査ログ保存
- /orca/chart/subjectives
  - 未実施理由: 症状詳記同期の実結合テスト未実施
  - 次回前提: 詳記データがある患者 + 監査ログ保存

---

## 未実施・不足しているテスト（UI単位）

### Reception
- 例外一覧の「実 API 接続時の復旧導線」
  - 未実施理由: MSW 実行のみで実 API の障害再現が未実施
  - 次回前提: 実 API 障害系ログ + スクリーンショット
- 予約/来院の mock/実環境切替表示
  - 未実施理由: UI 切替の証跡未取得
  - 次回前提: 切替操作のスクリーンショット + 監査ログ

### Patients
- 実 ORCA 検索/更新の UI 体験
  - 未実施理由: 実 API 結合テスト未実施
  - 次回前提: 検索対象患者 + 監査ログ保存
- 未紐付警告の実データ再現
  - 未実施理由: 警告が出る実データ準備不足
  - 次回前提: 未紐付状態の検証患者

### Charts
- 送信/印刷ガードの実 API 経路
  - 未実施理由: 帳票 API 実結合テスト未実施
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- 復旧導線（再取得）の実 API 再現
  - 未実施理由: 実 API 障害再現未実施
  - 次回前提: 障害発生時の再取得ログ + スクリーンショット

### Administration
- ORCA 公式 XML プロキシ操作（エンドポイント切替/再送/テンプレ再生成）
  - 未実施理由: 実 ORCA 接続での UI 操作証跡なし
  - 次回前提: ORCA Trial 接続 + 操作ログ/スクリーンショット
- 監査検索 UI と API 検索結果の一致確認
  - 未実施理由: 検索 API の実結合テスト未実施
  - 次回前提: 監査ログ保存先 + 検索 API 実行ログ

### Debug
- デバッグ機能（権限ガード/ロール制限）の UI 体験
  - 未実施理由: 権限制御の実確認未実施
  - 次回前提: system_admin ロールでの動作確認ログ

### 共通（ナビゲーション/セッション共有）
- ログイン成功時の即リダイレクト（/f/{facilityId}/reception）
  - 未実施理由: UAT 証跡が古く最新変更の再取得なし
  - 次回前提: 直近 RUN_ID でのスクリーンショット
- 403 応答時の権限不足バナー/トースト表示（強制ログアウトしない）
  - 未実施理由: 403 再現の手順/証跡なし
  - 次回前提: 403 再現ログ + UI 証跡
- 新規タブ起動時の認証/runId/authFlags 復元
  - 未実施理由: Playwright の結果はあるが UI 証跡の整理が不足
  - 次回前提: テスト結果の保存先とスクリーンショットを紐付け
- ログアウト後のストレージ一括掃除
  - 未実施理由: 操作ログの証跡不足
  - 次回前提: Storage 状態の記録（スクリーンショット or 監査ログ）
- 複数タブでの失効イベント同期
  - 未実施理由: UI 体験の証跡不足
  - 次回前提: 同時タブのスクリーンショット + 失効ログ

---

## 監査ログ（不足証跡の整理）

### UI 表示
- 未実施理由: UI 表示のスクリーンショットが古い（2026-01-04 のみ）
- 次回前提: 直近 RUN_ID での UI 監査ログ表示の再取得

### 永続化
- 未実施理由: 監査ログの保存先（DB/ファイル）への書き込み確認ログなし
- 次回前提: server-modernized 側の保存ログ + 対象 runId の突合

### 検索 API
- 未実施理由: 監査検索 API の実結合テスト証跡なし
- 次回前提: 検索 API のリクエスト/レスポンスログ保存

### 異常系
- 未実施理由: 401/403/419/440、ORCA エラー（Api_Result != 0）、XML パース失敗の監査記録証跡が不足
- 次回前提: 異常系シナリオの再現ログ + UI 表示 + 保存ログ

---

## 証跡の有無/欠落理由/再取得内容
- E2E 実行ログ
  - 有無: あり（20260103T235314Z の1回のみ）
  - 欠落理由: 2026-01-20 以降の変更分に対する再取得未実施
  - 再取得内容: `artifacts/validation/e2e/logs/` / `screenshots/` / `README.md` を最新 RUN_ID で更新
- Playwright 実行証跡
  - 有無: あり（trace.zip のみ）
  - 欠落理由: HAR/スクリーンショットの保存先が文書化されていない
  - 再取得内容: trace/HAR/スクリーンショットの保存先を README に明記
- 監査ログ証跡
  - 有無: UI 表示のみ（2026-01-04）
  - 欠落理由: 永続化/検索 API/異常系の証跡が未取得
  - 再取得内容: 保存先ログ + 検索 API のリクエスト/レスポンス + 異常系の再現ログ

---

## 補足（次の検証で必要な前提）
- 実 API 結合テストは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を使用し、監査ログ保存先を事前準備する。
- ORCA 実環境接続は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（Legacy）に従い、ログを保存する。
