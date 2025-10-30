# 予約管理とサマリ文書（FreeDocument）運用ガイド

Web クライアントに追加された受付予約管理機能と FreeDocument 編集機能の仕様をまとめます。既存オンプレ（Swing）クライアントとのデータ整合性と運用上の注意点を確認してください。

## 1. FreeDocument エディタ

- 対象画面: `カルテ > 右ペイン` の「サマリ文書（FreeDocument）」カード。
- 利用 API:
  - 取得: `GET /karte/freedocument/{patientId}` – 施設患者 ID を指定して既存 FreeDocument を取得。
  - 保存: `PUT /karte/freedocument` – `id` が存在すれば更新、無ければ新規作成。保存時は監査ログへイベントを記録。
- 仕様:
  - 保存完了後に自動で再取得し、Swing クライアントと同じ内容が表示されることを保証します。
  - 既存データが無い場合は新規作成し、`facilityPatId` には患者 ID を設定します（サーバー側で施設 ID と結合）。
  - 保存時にタイムスタンプを `YYYY-MM-DDTHH:mm:ss` 形式で送信し、最新保存時刻を UI に表示します。
- 既存ユーザーへの影響:
  - Swing 側の FreeDocument と完全に共有されるため、従来どおりの編集ポリシーで運用可能です。
  - 保存イベントは監査ログへ出力されるため、レビュー／追跡が容易になります。

## 2. 受付予約管理 (`AppointmentManager`)

- 対象画面: `受付患者一覧` の各カードに「予約を管理」ボタンを追加。クリックで患者別の予約管理パネルが表示されます。
- 利用 API:
  - 取得: `GET /karte/appo/{karteId,from,to}` – 60 日分の予約をまとめて取得。React Query でキャッシュ＆再取得を制御。
  - 保存: `PUT /appo` – `AppointmentModel` 相当のペイロードを送信。新規は `state=1`、更新・取消は `state=3` を利用。
- 仕様:
- 1 分以内の重複予約は UI でブロックし、エラーメッセージを表示します。
- 保存／取消成功時はインライン通知で結果をフィードバックし、一覧を再取得します。
- 予約一覧は最新順に整列し、メモ（任意）も併せて表示します。
- 保存処理が進行中はモーダルの「閉じる」ボタンと受付カード側の「予約を管理」ボタンを自動で無効化し、二重操作や状態不整合を防ぎます。
- 既存ユーザーへの影響:
  - Swing クライアントと同一の `/appo` API を利用するため、既存データと整合します。
  - 操作ログは監査経路（`measureApiPerformance` 経由の `recordOperationEvent`）で記録されます。
  - 既存の予約データ移行は不要ですが、Web 側での利用開始時に操作研修を実施してください。

## 3. テストと運用

- `src/features/reception/api/__tests__/appointment-api.test.ts` で CRUD ペイロードと変換ロジックを検証。
- `src/features/charts/api/__tests__/free-document-api.test.ts` で FreeDocument API の取得／保存を検証。
- フィールド運用ルールや業務マニュアルの更新は `planning/WEB_VS_ONPRE_CHECKLIST.md` に追記済み。受付スタッフ向け資料の改訂と合わせて参照してください。

## 4. 予約リマインダー送信フロー

- 対象画面: `受付患者一覧` → `予約を管理` → `AppointmentManager` の「リマインダー」ボタン。
- 送信手段:
  - メール: 件名/本文を自動生成し、クリップボードコピーまたは `mailto:` でメールアプリを起動。送信先メールアドレスを必須入力。
  - SMS: 送信先電話番号を記録し、本文をコピーして外部 SMS 端末に貼り付ける運用を想定。
- 送信記録:
  - `送信済みを記録` 操作で `/appo` PUT を発行し、予約メモ末尾に `【リマインダー】YYYY/MM/DD HH:mm メール(test@example.com) / 任意メモ by 受付 太郎` の形式でログを追記。
  - ログはオンプレ版と共有され、Web 側でも最新リマインダーがカードに表示される。
- 運用ドキュメント: `operations/RECEPTION_WEB_CLIENT_MANUAL.md` に受付スタッフ向け手順・研修スケジュールを掲載。ロールアウト時は SMS 運用端末と送信記録ルールの整合を確認する。
- テスト: `src/features/reception/components/__tests__/AppointmentManager.reminder.test.tsx` でリマインダー記録フローを統合テスト化。既存テストも新プロパティ（施設名・担当者名）に対応済み。
