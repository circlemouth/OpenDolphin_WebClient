# RUN_ID=20251204T160000Z Reception UX 設計とステークホルダー同期

- 期間: 2025-12-11 09:00 - 2025-12-12 09:00（優先度: high / 緊急度: medium）。Reception/OrderConsole の UX を `tone=server` バナー・`dataSourceTransition` ランタイムメタ・監査ログという共通トーンで連携し、docs・アーティファクト・マネージャーチェックリストへ引き継ぐ準備を行った。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → `docs/web-client/ux/reception-schedule-ui-policy.md` → `artifacts/webclient/ux-notes/20251204T160000Z-reception-design.md`。

## 1. 要件詰め
- `reception-schedule-ui-policy.md` に定義されたステータス別タブ/フィルタ・一覧・右パネル構成と、ヘッダー直下バナー（Error=赤・Warning=琥珀・Info=青）＋`aria-live`/`role=alert` の共通意図を OrderConsole にもキャリーオーバーする。
- バナー文言は `[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]` 構造とし、Reception/Charts/OrderConsole で `tone=server` の ORCA 送信エラー/遅延/未紐付を同じ `aria-live` 挙動でアナウンスする。
- OrderConsole 側では `tone=server` の結果に対して再送/再試行ボタンを含む UI セクションとし、tweak `role=alert` + `aria-live=assertive` でライブ更新。`tone=server` が `dataSourceTransition=server`/`missingMaster=false`/`fallbackUsed=false` とセットになる `AuditEvent` を `order-console` の ORCA 送信結果で発行する。

## 2. API・メタ依存
- 受付一覧・予約・ステータス変更 API（一覧取得と POST/PUT/DELETE）を Reception で再利用し、Response には `runId`/`tone`/`queueStatus`/`patientId`/`facilityId` などを保持。これを OrderConsole の送信結果にも流用し、監査ログで Reception と同じイベントを持てるようにする。
- Patients/Insurance リソースから取得する基本情報/履歴サマリを Reception 右パネルに表示し、OrderConsole で再送する片も同じ Patient ID で lookup できるよう `patientId` を `AuditEvent` に挿入。
- ORCA 連携リソース: `logOrcaQuery`/`send`/`resend` 経路で `tone=server` のエラーコードと `dataSourceTransition`（server→snapshot/msw/prefill）を送出、Reception/OrderConsole のバナーとトーンを同期。
- `src/LEGACY/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の `resolveMasterSource(masterType)` helper は `WEB_ORCA_MASTER_SOURCE` → `server|snapshot|mock|fallback` を判断し `dataSourceTransition` を付与する。Reception/OrderConsole では同 helper を使って `audit` 側の `dataSource`/`dataSourceTransition`/`missingMaster`/`fallbackUsed` を維持することを必須とする。

## 3. 証跡
- UX 補足: `artifacts/webclient/ux-notes/20251204T160000Z-reception-design.md` にスクリーンショット候補（Reception ヘッダー + OrderConsole tone=server バナー）と code reference を記録。
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` の Web クライアント UX/Features 行に本 RUN_ID と本ログファイルを明記し、`ux-documentation-plan.md` の reception セクションで補足を追記。

## 4. 次のアクション
1. Playwright/Stage Preview 環境で `tone=server` + `aria-live` + `dataSourceTransition=server` のバナーを再現し、スクリーンショットを `artifacts/webclient/ux-notes/20251204T160000Z-reception-design.md` へ追記。
2. `docs/server-modernization/phase2/operations/logs/20251204T160000Z-reception-design.md` と本 DOC_STATUS への反映を manager checklist でも共有し、UX/Features に RUN_ID を追記。
3. 次のマッピング/監査タスクで `OrderConsole` の `AuditEvent` に `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を確実に載せるため、API 仕様書（`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`）へのリンクを維持。
