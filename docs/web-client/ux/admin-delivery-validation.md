# Administration 配信タイミング検証計画（RUN_ID=20251202T090000Z）

- 参照元: `docs/web-client/ux/patients-admin-ui-policy.md`
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`
- ORCA API 状態: `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`
- フラグ設計: `docs/web-client/ux/config-toggle-design.md`

## 1. 現行挙動の観測手順
- 観測順序: (1) Administration で設定変更（受付ステータス/ORCA送信ルール/ロール権限制御/自費メニュー/セッション初期化）→ (2) Reception/Charts/Patients へ遷移し即時反映確認 → (3) 再読込 → (4) 再ログイン → (5) キャッシュクリア有無で再確認 → (6) モック/実 API 切替（`VITE_USE_MOCK_ORCA_QUEUE` ON/OFF）で再度 1-5 を繰り返し差分を取得。
- フロントの通知/バナー/トースト表示を確認し、変更内容と配信結果の整合をスクリーンショットで取得。
- API 呼び出し（設定取得/配布 API）のレスポンス時刻と ETag/バージョン番号が変化するかを記録し、再取得条件を把握する。GraphQL/REST いずれの場合もレスポンスヘッダーの更新有無を比較する。
- キャッシュクリア（ハードリロード/Service Worker キャッシュ削除）の有無で挙動差分を観測し、配信ラグや古い設定混入を切り分ける。
- Reception/Charts 側で反映遅延が発生した場合は、バナーに最新適用版（ETag/`deliveryVersion`）と遅延理由を表示し、再取得/再ログイン/キャッシュクリアの導線を案内する。リトライ後も未反映なら `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` へ RUN_ID 付きで記録する。

## 2. 必要ログ（取得ポイント）
- 監査ログ: Administration での設定更新（誰が・いつ・何を変更）の記録を確認し、保持期間と削除/アーカイブ手順を併記する。
- ORCA 連携ログ: 接続テスト/マスタ同期/送信ルール適用時の API コール結果を取得し、失敗時のリトライ/ロールバック挙動を記録する（API 状態は `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` を参照）。
- 配信ログ: 設定配布 API のレスポンスログ（バージョン/タイムスタンプ）とフロントイベントログ（配信成功/失敗、再取得トリガー）を紐付けて保存する。`VITE_VERIFY_ADMIN_DELIVERY` ON 時は `x-admin-delivery-verification`, `x-admin-run-id`, `etag` の有無を比較し、OFF と並べて差分を記録する。
- ORCA キュー: `VITE_USE_MOCK_ORCA_QUEUE` ON/OFF で `/api/orca/queue` の `queueMode`/`deliveryVersion`/`x-orca-queue-mode` を比較し、監査ログ `storage (mock|live)` と整合するかを確認する。
- 収集コマンド例（シェル）:
  ```
  # フロント＋API ログをまとめて保存（例）
  npm run dev > logs/admin-dev.log &
  tail -f server_latest_logs.txt | tee logs/admin-server.log
  # 設定取得 API のレスポンス確認
  curl -i http://localhost:3000/api/admin/config | tee logs/admin-config-response.log
  ```
- 収集コマンド例（Playwright でネットワーク・コンソールログ採取）:
  ```
  npx playwright test --project=chromium --grep "Administration 配信" \
    --reporter=line \
    --output=playwright-report/admin-delivery \
    --timeout=600000
  # テスト内で page.on('response') / console をファイル出力するフックを有効化する想定
  ```

## 3. 権限制御の確認手順
- role=system_admin/管理者の操作でのみ設定変更が通ることを確認し、受付ロールや一般ロールでは UI/サーバー双方でブロックされることを検証する。
- 権限不足時の UI 表示（非活性/非表示/エラーメッセージ）とサーバー側拒否コードが一致するか確認する。
- 監査ログに権限エラー試行が記録されるか、成功/失敗で出力内容が変わるかを比較する。
- 権限制御を変えた場合の比較観測: role=system_admin/管理者で変更→受付ロールで同操作→一般ロールで同操作の順に試行し、UI ガードとサーバー拒否が一貫するかを確認する。

## 4. 未決事項の確定条件
- 配信タイミング: 即時配信/再読込/再ログインのどれで一貫させるかを決定し、Reception/Charts/Patients すべてで同一ポリシーにできるか確認する。
- 監査ログ保持期間: 患者基本情報・ORCA 連携設定・権限変更の保持期間と削除/アーカイブ手順を合意し、バックアップとの責務分界を明文化する。
- 権限ガード: 設定ごとに必要ロールを棚卸し、フロント/バック両方のガードと承認フローが矛盾なく動くことをテストで裏付ける。
- ORCA 連携設定の反映手順: 接続テスト→マスタ同期→送信ルール設定の順序と環境別設定の扱いを決め、モダナイズ版 API の可用性を `ORCA_API_STATUS` で確認してから適用する運用に合意する。`ORCA_API_STATUS` にブロッカー/警告がある場合は設定反映を保留し、エラー改善後に再実施する分岐手順を明示する。
- 失敗時の記録: 反映遅延/権限エラー/ヘッダー欠落などの異常は `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` に RUN_ID 付きで残し、DOC_STATUS 備考と README/manager checklist へリンクを再掲する。
