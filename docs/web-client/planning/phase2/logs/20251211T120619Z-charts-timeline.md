# RUN_ID=20251211T120619Z / Charts データバインドとタイムライン実装 メモ

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` を確認済み。
- 対象: Charts DocumentTimeline / PatientsTab / OrcaSummary のデータバインド強化（Reception の runId・missingMaster・cacheHit・dataSourceTransition を carry over、/orca21/medicalmodv2/outpatient の応答バッジ表示、Patients 検索＋詳細で tone による編集不可ガード）。
- コード変更: `web-client/src/features/charts/{pages/ChartsPage.tsx,DocumentTimeline.tsx,PatientsTab.tsx,OrcaSummary.tsx,api.ts,styles.ts}`。Reception からの state を Charts へ反映し、ORCA summary API を React Query で取得、fallbackUsed を含むバッジを追加。
- テスト: `npm run lint` が未定義のため実行不可（npm error Missing script: "lint"）。動作確認はローカルの型エラーなしビルド前段まで。必要なら `npm run build` で再確認すること。
- 次アクション: Stage/Preview で `/orca21/medicalmodv2/outpatient` 応答を実データで確認し、Patients 編集ガードの tone 連動を Playwright に追加。DOC_STATUS/README へ本 RUN_ID を同期済み。
