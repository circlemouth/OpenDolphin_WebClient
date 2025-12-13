# 11 監査ログ（auditEvent）統一（webclient charts production outpatient plan）

- RUN_ID: `20251213T125127Z`
- 期間: 2025-12-22 09:00 〜 2025-12-24 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: claude code
- YAML ID: `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` → 本書
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251213T125127Z-charts-audit-event.md`

---

## 0. 結論（本 RUN で固定したこと）
- Charts の UI 監査ログは `action/outcome/details` を必須とし、`details` に **runId/dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/traceId/requestId(任意)** を常に入れる。UI 表示と auditEvent の値を同一オブジェクトから描画することで乖離を防ぐ。
- 重要操作の記録を保証: 患者切替（CONTEXT_SWITCH）、診療終了（ENCOUNTER_CLOSE）、送信（ORCA_SEND）、印刷（PRINT_OUTPATIENT: デモ時は blocked/記録のみ）、失敗系（CHARTS_ACTION_FAILURE 相当）は outcome と理由を必ず残す。
- 個人情報の最小化: auditEvent.details には patientId / appointmentId までとし、氏名等は含めない。追跡用 ID（runId/traceId/requestId）を持たせて復元性を担保する。

---

## 1. 方針（語彙・フィールド統一）
- `action` は `01_外来機能の完全カバレッジ定義` の語彙に合わせ、Charts UI では以下を使用する:  
  - 患者切替: `CHARTS_PATIENT_SWITCH`（= CONTEXT_SWITCH）  
  - 診療終了: `ENCOUNTER_CLOSE`  
  - 送信: `ORCA_SEND`（再送/破棄は今後拡張）  
  - 印刷: `PRINT_OUTPATIENT`（デモ環境では blocked として記録）  
  - 失敗/例外: `CHARTS_ACTION_FAILURE`（`outcome=error` で詳細に理由を入れる）
- `outcome` は `success|error|blocked|started` を固定。durationMs が取れる場合は details に付与する。
- `details` の共通キー: `runId` / `traceId` / `requestId(任意)` / `dataSource` / `dataSourceTransition` / `cacheHit` / `missingMaster` / `fallbackUsed` / `patientId` / `appointmentId` / `note` / `durationMs` / `error`。  
  - `dataSource` は `dataSourceTransition` またはキャッシュ/フォールバック有無から推定（現行 meta に合わせた暫定）。

---

## 2. 実装反映（今回の変更点）
- `web-client/src/features/charts/audit.ts` を新設し、`recordChartsAuditEvent` と `normalizeAuditEventPayload` / `normalizeAuditEventLog` を追加。共通メタ（runId/traceId など）を自動で details に注入し、UI 表示と auditEvent を単一ソース化。
- `ChartsActionBar`: 送信/診療終了/ドラフト/キャンセルの各パスで `recordChartsAuditEvent` を利用し、`outcome=started|success|error|blocked` を記録。印刷ボタンを追加し、デモ環境では blocked/success を audit のみで残す。ログには durationMs（成功/失敗時）を含める。
- `PatientsTab`: 患者選択（手動・初期自動いずれも）で `CHARTS_PATIENT_SWITCH` を記録し、patientId/appointmentId のみを details に残す。再選択時は同一 ID への重複記録を防止。
- `ChartsPage`: 取得した `auditEvent` を `normalizeAuditEventPayload` で整形し、UI 表示（DocumentTimeline/PatientsTab）と監査ログが同一詳細を参照するようにした。

---

## 3. DoD（本 RUN の受け入れ基準）
- 重要操作（患者切替/送信/診療終了/印刷/失敗）が `action/outcome/details` 付きで `__AUDIT_EVENTS__` に記録され、DocumentTimeline/PatientsTab で同じ値が確認できる。
- details に `runId` と `dataSourceTransition/cacheHit/missingMaster/fallbackUsed` が必ず入っている。UI pill と auditEvent.details の値が一致する。
- 個人情報（氏名/住所など）が auditEvent に含まれていない（ID のみ）。

---

## 4. 残課題 / 今後の拡張
- サーバーから返る `requestId` をヘッダー経由で取得し、`normalizeAuditEventPayload` に追加する。（現状は traceId のみ）
- 再送/破棄/会計遷移/印刷 API 実装後に、`ORCA_RESEND`/`ORCA_DISCARD`/`CLAIM_STATE_CHANGE` などの action を追加する。
- Playwright で auditEvent.details のキー存在をアサートするフィクスチャを追加する。
