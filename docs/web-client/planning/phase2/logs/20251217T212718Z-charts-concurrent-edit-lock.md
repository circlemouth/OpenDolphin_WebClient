# RUN_ID=20251217T212718Z / Charts 並行編集とロック表示

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` → 本ログ。
- 対象期間: 2026-01-09 09:00 〜 2026-01-11 09:00 (JST) / 優先度=medium / 緊急度=low / エージェント=gemini cli。
- 目的: 同一患者/受付の複数タブ・複数端末編集衝突を防ぎ、最終更新者/時刻表示と監査ログを統一するための設計を固める。

## 決定事項サマリ
1) 二段階ロックを採用（ブラウザ内 localStorage + サーバー soft-lock + ETag）。取得/保存/送信/診療終了時に `lockOwner`・`documentVersion` を必須で受渡し、衝突時はリクエストを送らず blocked で止める。
2) ヘッダーに「最終更新 <time> by <user(role)> [source]」ピルを常時表示し、閲覧専用・ロック期限切れ・ORCA pending の区別を suffix で示す。ToneBanner は warning(assertive) を 1 回のみ。
3) 誤上書き防止 UX: 衝突時は ToneBanner + モーダルで差分概要を提示し、「最新を再読込」「自分の変更を破棄」「強制引き継ぎ（上書き）」の 3 択を固定。閲覧専用時は ActionBar 全面 disable + tooltip 理由表示。
4) 監査/テレメトリ: `CHARTS_EDIT_LOCK` と `CHARTS_CONFLICT` を追加し、`lockRequestId`, `documentVersion`, `lockOwner*`, `resolution` を details に含める。既存 `ENCOUNTER_CLOSE`/`ORCA_SEND`/`DRAFT_SAVE` にも `lockRequestId` を付与。
5) DocumentTimeline/ARIA: `EDIT_LOCK` イベントを追加し、conflict/stolen では warning(assertive)、acquired/renewed は info(polite)。Pill は aria-live=off を徹底。

## 実装メモ
- `EncounterStateContext` に `editLock` ストアを追加予定（31 章と統合）。`fetchWithResolver` meta で `editLock/documentVersion/lastUpdated` をキャッシュし、ActionBar/Timeline/ヘッダーに共有。
- API 呼び出し時ヘッダー: `If-Match: <documentVersion>` / `X-Edit-Lock: <lockRequestId>` / 強制引き継ぎ時 `X-Force-Takeover: true`。409/412 を捕捉して UI ブロックに転換。
- localStorage key: `chartsLock:<patientId>:<appointmentId> = { runId, tabSessionId, expiresAt }`。TTL 5 分、60s ごとに refresh。タブ閉鎖は `storage` イベントで掃除。

## Next Action
- `src/charts_production_outpatient/workflow/34_並行編集とロック表示.md` を成果物として同期。
- DOC_STATUS/README へ RUN_ID 行とログパスを追記する。
- Stage/Preview で強制引き継ぎを実施する場合は管理者ロール限定で確認し、証跡に resolution=force_takeover を記録する。
