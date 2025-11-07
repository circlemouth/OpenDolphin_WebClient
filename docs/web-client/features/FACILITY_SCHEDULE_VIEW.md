# 施設予約一覧（PatientSchedule Web 版）

## 概要
- オンプレ版 `PatientScheduleImpl` を参考に、施設全体の予約・予定カルテを俯瞰する `FacilitySchedulePage` を実装しました。
- `/schedule/pvt/{date}`（必要に応じて `/schedule/pvt/{orcaId,unassignedId,date}`）を利用し、日付単位で全受付データを取得します。
- Web 受付画面（`ReceptionPage`）と連携し、カルテへの遷移や受付メモ編集状況をリアルタイムに把握できるようにしました。

## UI/操作仕様
1. **フィルタ条件**
   - 対象日（`input[type=date]`）、担当医、状態（待機/呼出中/診察中）、キーワード（氏名・ID・メモ）で絞り込み可能。
   - `担当医のみ` チェックボックスを有効にすると ORCA 担当医コード（セッションの `userId`）を用いた `/schedule/pvt/{orcaId,unassignedId,date}` 呼び出しに切り替わります。未設定の場合は無効化され、案内メッセージを表示します。
   - 前日/翌日/今日ボタンで日付をシフト。
2. **サマリカード**
   - 予約総数、待機件数、呼出中、診察中を表示。状態判定は PatientVisitModel の `state` と `ownerUUID` を使用（オンプレのビット判定と互換）。
3. **詳細テーブル**
   - 時刻、患者情報（氏名・ID・カナ）、担当医/診療科、受付メモ・保険情報、最終カルテ保存日時、カルテ遷移ボタンを表示。
   - 行背景は状態に応じて変化（診察中: 強調、呼出中: ハイライト、待機: 通常）。
   - 「カルテを開く」ボタンで該当 `visitId` のカルテ画面へ遷移。
4. **予約詳細ダイアログ**
   - 操作列に「予約詳細」ボタンを追加し、`ScheduleReservationDialog` を表示。カルテ生成と予約削除を同一 UI で提供します。
   - カルテ生成時は `sendClaim` チェックボックスでレセ電送信フラグを切り替え。既にカルテが存在する、または担当者情報が未取得の場合はボタンを自動で無効化します。
   - 予約削除は Swing 版と同じ 3 要素識別子（`pvtPK,ptPK,date`）で実行し、完了後に一覧を再取得して該当行を除去します。
5. **アクセシビリティ**
   - テーブルはスクロールコンテナ内に配置し、ヘッダーを visually 目立たせた。フィルタ類は label と組み合わせ、キーボード操作に対応。

## API / 監査 / パフォーマンス
- `fetchFacilitySchedule` は `measureApiPerformance` で呼び出しを計測し、対象日・担当医絞り込みをメタデータとして監査ログへ送信します。
- 取得結果を ISO 時刻で昇順ソートし、`visitId`/`patientId` 欠損はフィルタで除外しているため UI 崩壊を防ぎます。
- React Query の `staleTime=30s` とし、頻繁な再取得を避けつつ手動リロードボタンで更新できます。
- 予約詳細ダイアログからの `POST /schedule/document` と `DELETE /schedule/pvt` は `measureApiPerformance` の新メトリクス（`schedule.document.create` / `schedule.document.delete`）で計測し、`recordOperationEvent` によって監査ログへ出力します。

## 運用・移行メモ
- ORCA 側で担当医コードが設定されていない場合は「担当医のみ」フィルタが無効になる旨を UI で案内。必要に応じて Swing 版と同様に ORCA ユーザー ID を登録してください。
- 既存データ構造に変更は無く、予約取消・追加 API（`/appo`）と併用しても問題ありません。
- 受付担当者向けマニュアル（`operations/RECEPTION_WEB_CLIENT_MANUAL.md`）を更新し、旧 PatientSchedule からの乗り換え手順と利用シナリオを追記しました。
- 予約削除は復元できないため、業務手順書では削除前に受付状態とカルテ作成状況を確認するステップを明記してください。カルテ生成機能は Swing 版と同じエンドポイントを利用するため、追加のデータ移行は不要です。
