# Administration/配信ギャップ実装計画

- RUN_ID: `20260103T093344Z`
- 対象: BKL-001/002/009/012/04（管理メニュー/権限ガード/配信タイミング/証跡/監査）
- 優先度: P0

## 実装箇所（web-client）
- `web-client/src/features/administration/AdministrationPage.tsx`
- `web-client/src/features/administration/api.ts`
- `web-client/src/features/shared/AdminBroadcastBanner.tsx`

## server-modernized 連携
- `/api/admin/config` `/api/admin/delivery`
- system_admin ガード（サーバ側チェック）
- 監査イベントの永続化

## 進め方（ワーカー向け）
1. 管理メニュー構成（マスタ/権限/セット/通知/監査設定）を決定。
2. system_admin 以外のアクセスを画面/サーバ両面で遮断。
3. 配信タイミング（即時/次回リロード/再ログイン）を明示。
4. 配信バージョン/ETag/反映遅延を UI と監査に反映。

## 完了条件（DoD）
- 管理メニューの入口が統一され、権限ガードが UI とサーバで一致。
- 配信状態（バージョン/ETag/反映遅延）が UI と監査に記録される。

## テスト/証跡
- system_admin/非admin の画面差分
- 配信実行時の auditEvent 出力

## 参照
- `src/implementation_planning/モダナイズ版サーバー連携整理.md`
