# 01_phase2/screens 3 文書の棚卸 (RUN_ID=20251202T090000Z)

期間: 2025-12-02 09:00 〜 2025-12-04 09:00 (JST)

## ゴール
1. Phase2 の画面拡張を狙った docs/web-client/planning/phase2/screens 以下の 3 文書を読み解き、各画面が担うユースケースとデータ/API要件を抽出する。
2. Reception/Charts/Patients/Administration という実装候補画面を想定し、画面間遷移とログイン認証フローを再設計する仮説を整理する。
3. 抽出した内容を docs/web-client/ux のポリシードラフトおよび docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md へつなげるためのアウトラインとしてまとめ、DOC_STATUS 備考へ RUN_ID を記録するための手順を明文化する。

## 読解した 3 文書と画面要件
### 1. 受付状況処理画面 (docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md)
- 目的: 本日の患者フローを「受付状況／診察終了」タブ＋患者詳細パネルで可視化し、ひとつの画面から個別カルテ・基本情報編集・ステータス修正・ORCA連携を起動する。
- 必須 UI: タブ付きフィルタ（診療科、担当医、自費フラグ）、ステータス・待ち時間を含むテーブル、右パネルでの患者サマリ/履歴/メモ、操作ボタン（カルテを開く／基本情報編集／ORCA再送）。
- 遷移: 患者行の「カルテを開く」で Chart entry へ、同じパネルの「基本情報編集」ボタンで患者編集画面へ。受付側から診療ステータスを手動調整できるため、ステータス管理画面（Administration）との連携が前提。
- API要件: 受付一覧・ステータスは ORCA `/api01rv2/acceptlstv2` などの受付一覧 API と予約/診療データ（`/api01rv2/appointlstv2`, `/api/api21/medicalmodv2`）をモダナイズ版でラップしたリソースから取得。ORCA送信状況は `/orca11/acceptmodv2`/`/orca14/appointmodv2` をプロキシする ORCA連携ステータスリソースで確認し、会計連携結果やエラー情報を列挙する (MODERNIZED_API_DOCUMENTATION_GUIDE の ORCAセクションを参照)。基本情報編集・ステータス変更は予約/受付リソースへの POST/PUT で反映し、操作ログを残す。

### 2. カルテ記入画面 (docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md)
- 目的: ひとりの患者に対して診療録入力、病名管理、オーダー/処方/検査登録、DICOM画像参照、長期サマリをひとつのブラウザ内“擬似タブ”で扱う「本丸」。
- 必須 UI: 患者基本情報＋保険/自費切替のヘッダー、診療録タブ（フリー／SOAP切替＋テンプレ）、病名一覧＋病名未紐付チェック、オーダーサブタブ（処方/注射/検査/リハ/予防接種/文書）、結果/履歴タブ、画像タブ、文書/サマリタブ、右サイドバーのメモ・要チェック・候補セット。
- API要件: カルテ本体は Web クライアントの ChartResource もしくは `open.dolphin` 系 REST を通じて「診療録」「オーダー」「病名」「結果履歴」を取得・更新。オーダー登録時は ORCA マスタ（`/api/orca/master/generic-class`, `/generic-price`, `/youhou`, `/material`, `/kensa-sort`, `/hokenja`, `/address`）を参照することで薬剤/検査/保険病名候補をサジェストし、`ORCA_REST_IMPLEMENTATION_NOTES` が示す ORCA wrapper (`appointlstv2`, `medicalmodv2` 系など) に変換して送信。診療録テンプレート・サマリ・患者メモの CRUD は ChartResource 側で保持し、署名/承認フローは操作ログを付与。画像タブは DICOM サーバーと `DICOMResource` 連携し、画像を診療録に貼り付けるためのトリプル ID を API から取得。

### 3. カルテ全般管理画面 (docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md)
- 目的: 施設・ユーザー・ロール・ステータス・カルテ記載設定・オーダー/セット/自費のマネジメント、ORCA接続/マスタ設定、DICOM/セキュリティ/監査ログを一元管理するバックオフィス。
- 必須 UI: 左メニューでカテゴリを選び、右ペインで詳細フォーム＋保存。ロール設定では医師/看護/事務ごとに診療録/オーダー/ORCA送信権限を切り替え、ステータス設定では表示色/遷移ルールを定義。カルテ記載設定では SOAP/フリー切替やテンプレ共有、患者メモカテゴリを制御。ORCA連携画面では接続情報・マスタ同期間隔・適用病名チェック（警告/エラーレベル）・送信トリガーを整備し、セキュリティではパスワードポリシー・ログ保存期間を設定。
- API要件: ユーザー/施設/ステータスは内部管理 API を通じて CRUD し、ORCA 接続設定は `ORCA_CONNECTIVITY_VALIDATION.md` で指定された Basic/TLS 認証情報・Runbook を反映した config リソースと同期。自費メニュー／セット管理は Chart admin Resource からオーダーセットを構築し、ORCA master API との整合性チェック（`ORCA_REST_IMPLEMENTATION_NOTES` で定義された薬剤⇔病名チェック、`ORCA_API_STATUS` での Blocker 管理）を活用。監査ログ・バックアップ設定は `SystemResource`/`LogResource` を介した設定管理を想定。

## Reception/Charts/Patients/Administration 画面間遷移と認証フロー仮説
1. ログイン後は `LoginScreen` が受け取った JWT もしくはセッション cookie を使い、Facility と Role をクライアント側で保持する。成功時に Reception をデフォルトルートとし、画面ヘッダーに「Reception / Charts / Patients / Administration」グローバルナビを表示。
2. Reception の患者行で「カルテを開く」あるいは Chart サイドバーの候補から Charts 画面へ遷移。Charts 画面は選択患者 ID をクエリパラメータとして受け取り、`PatientResource` から患者基本情報 + 最新診療録を取得。
3. Patients 管理画面は Reception の「基本情報編集」ボタンや Administration のロール設定から呼び出し可能。ここでも同じ認証トークンを使い、患者編集用の `PatientMaintenanceResource` と `InsuranceResource` を叩く。
4. Administration 画面は role=system_admin / admin でのみ表示し、ログイン時点で取得した role 情報と API の `AuthResource` から得た `roles`/`permissions` を比較して guard。各ルートには `AuthGuard` を設定し、Reception/Charts へアクセスする医師/看護師には `jwt` が `clinical` scope を含むことを確認。
5. ORCA への送信/再送は Charts 画面での `Submit` ボタンや Reception の「ORCA送信」ボタンから `/resources/api/orca/send` などを叩き、レスポンスで `Api_Result` を監視（`00=成功`、`13/14=データ不足` などを UI バナーで表示）。これにより `ORCA_API_STATUS.md` と連携した Runbook へのリンクを張る。

## UXポリシー草稿との接続ライン
- Reception の詳細モジュールは `docs/web-client/ux/reception-schedule-ui-policy.md` に集約される予定の受付スケジュール UX を参照し、フィルタ/ステータスアイコン/アラートバナーのトーンを合わせる。
- Chart entry は `docs/web-client/ux/charts-claim-ui-policy.md` を起点に、DocumentTimeline/OrderConsole のレイアウト比、ARIA ライブのガイド、メモのトーン（例: patient memos を `aria-live` で読み上げるべきか）を反映。
- Patients/Administration は `docs/web-client/ux/patients-admin-ui-policy.md` と UX チェックリスト（監査・アクセシビリティ要件）に基づき、権限による表示切り替えや操作ログ出力、ARIA ヘッダーを設計。
- 本文で抽出したユースケースは、該当する UX ポリシーの各章へ移植し、`docs/web-client/ux/ux-documentation-plan.md` の更新箇所と相関させる。Phase2 のマネージャーチェックリスト（`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`）に従い、AGENTS → README → INDEX → この plan → UX draft の順を守り、RUN_ID を同一に保って周知。

## DOC_STATUS / 証跡 / 次アクション
1. DOC_STATUS の `Web クライアント UX/Features` 行に RUN_ID=`20251202T090000Z` を追加し、本ファイルと `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` へのリンクを備考欄に記載する。
2. このページを参照した UX ドラフトが完成した箇所を README に追記し、README/DOC_STATUS/ログの連携を維持。
3. 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` に本棚卸しの要約（参照した 3 文書、必要 API、画面遷移案、RUN_ID）を記録。
4. 次工程: `docs/web-client/ux/` の草稿に各画面のユースケース＆API要件を移植し、その進捗を `DOC_STATUS` と manager checklist に追記。必要に応じて ORCA 接続証跡（`ORCA_CONNECTIVITY_VALIDATION.md` / `ORCA_API_STATUS.md`）をリンクする。
