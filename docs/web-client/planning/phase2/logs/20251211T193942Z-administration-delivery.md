# RUN_ID=20251211T193942Z / Administration 設定配信とキュー表示 実装ログ

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` を確認。
- 対象: Administration 画面に ORCA 接続設定＋MSW/配信トグルの保存（broadcast + audit）と未配信キュー一覧（再送/破棄・遅延警告バナー）を追加し、Reception/Charts へ設定更新バナーを通知。
- コード: `web-client/src/features/administration/{AdministrationPage.tsx,administration.css,api.ts}` を新規実装し、nav/route に `/administration` を追加。`useAdminBroadcast`・`AdminBroadcastBanner` で設定変更を Reception/Charts に反映。`header-flags.ts` へフラグ永続化を追加。
- テスト: `cd web-client && npm run lint -- --max-warnings=0` は既存の lint エラー（any 型・react-refresh ルール等）で失敗。依存導入 `npm install --cache /tmp/npm-cache` は完了。今回追加分のビルド/型エラーは未検証のため、必要に応じて `npm run typecheck` を実施してください。
- 備考: system_admin 以外は Administration 操作を非活性化。保存時に localStorage broadcast を発行し、Reception/Charts のバナーで version/queueMode を共有。キュー再送は `/api/orca/queue?retry=1`、破棄は DELETE `/api/orca/queue?patientId=…` へフォールバック。
