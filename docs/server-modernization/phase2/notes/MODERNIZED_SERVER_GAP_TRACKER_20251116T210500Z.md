# Modernized Server Gap Tracker（RUN_ID=20251116T210500Z）

## 0. 参照チェーンと証跡
- 本メモは AGENTS → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → 各領域チェックリストを踏まえて作成。
- 根拠ログ / 既存ノート  
  - カルテ機能: `docs/server-modernization/phase2/notes/karte-clinical-review-20251116T152300Z.md`, `docs/server-modernization/phase2/operations/logs/20251116T152300Z-karte-review.md`  
  - ORCA スタンプ/点数: `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`  
  - Messaging/JMS: `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md`（同 RUN_ID 更新済）  
  - Trace/Audit: `docs/server-modernization/phase2/operations/logs/20251116T151200Z-trace-audit-review.md`  
  - 外部 API ギャップ: `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md`

## 1. カルテ/添付系ギャップ
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| KRT-01 | 既存カルテ更新 API 不足（PUT `/karte/document`） | `KarteResource`/`KarteServiceBean` に Document 全体更新エンドポイントと差分保存処理を実装。UI (`web-client/src/features/charts/api/document-api.ts`) に合わせる。 | 調査ログ `…152300Z-karte-review.md` |
| KRT-02 | Masuda/SafetySummary API 欠如 (`/karte/routineMed.*`) | Legacy 実装を Jakarta 化し、REST インベントリと Web 要件を満たすエンドポイントを追加。 | 同上 |
| KRT-03 | GET `/karte/image/{id}` の @PathParam 名誤り | `@PathParam("param")` → `@PathParam("id")`。 | 同上 |
| KRT-04 | 添付ストレージ二重アップロード | `AttachmentStorageManager` 呼び出しを 1 回に統合し、例外時ロールバック。 | 同上 |

## 2. ORCA スタンプ／点数マスタ
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の WHERE 句に括弧がなく S% の hospnum フィルタが欠落 | SQL を `(inputcd like 'P%' or inputcd like 'S%')` で括り、両方に `hospnum=?` を適用。 | `…193200Z-orca-stamp-tensu.md` |
| ORCA-02 | `/orca/stamp/{setCd,name}` が診療日指定不可 | パラメータに `date` を追加し、`tbl_inputset` の有効期間チェックを呼び出し元で指定できるようにする。 | 同上 |
| ORCA-03 | `/orca/tensu/shinku` が必要列を返却しない | `TensuMaster` の `taniname`, `ykzkbn`, `yakkakjncd` などをレスポンスに含め、`/tensu/name` との整合を取る。 | 同上 |

## 3. Messaging / 監査 / RUN ガバナンス
| ID | 課題 | 対応方針 | 根拠 |
| --- | --- | --- | --- |
| MSG-01 | JMS 実測証跡不足 | `ops/tools/jms-probe.sh` 等で enqueue/ACK を取得し、`operations/logs/<RUN_ID>-jms-probe.md` に記録。 | Messaging レビュー報告、`docs/server-modernization/phase2/operations/logs/20251116T210500Z-C-jms-probe.md` |
| AUD-01 | `TRACE_PROPAGATION_CHECK.md` の §7 が未更新 | **完了（2025-11-16）**: RUN_ID=`20251116T210500Z-C`（§7.1）を記載し、JMS `messages-added`=6→9 / `d_audit_event` 0 件 / ブロッカー3件を整理。次 RUN で証跡を更新。 | Trace/Audit レビュー、`operations/logs/20251116T151200Z-trace-audit-review.md`, `operations/logs/20251116T210500Z-C-jms-probe.md` |
| AUD-02 | 4xx/5xx で AuditTrail まで Trace-ID が届かない | `LogFilter` が 4xx/5xx 応答を検知して `SessionAuditDispatcher` へ `REST_ERROR_RESPONSE` を送るよう改修（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`）。次 RUN で `TRACE_PROPAGATION_CHECK.md` の 401/500 行に監査行を追加し、JMS/Audit 両ルートを確認。 | Trace/Audit レビュー、`operations/logs/20251116T210500Z-C-trace-logfilter.md` |
| OPS-01 | `mac-dev-login.local.md` の資格情報ローテ | **完了（2025-11-16）**: `admin2025!C` / `doctor2025!C` へ更新し、`artifacts/mac-dev-login/20251116T210500Z-C/rotation.md` と ops ログへリンク。次回ローテは 2025-12-15 目安。 | `docs/web-client/operations/mac-dev-login.local.md`, `operations/logs/20251116T210500Z-C-trace-logfilter.md` |

## 4. 外部 API（PHR/予約/紹介状）
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| EXT-01 | PHR REST リソースが Spec-based で止まっている | `phr_access_key` Flyway 適用、Layer ID secrets、監査 ID を整備し Trial/ORMaster 両方で CRUD 証跡を取得。 | `external-api-gap-20251116T111329Z.md` |
| EXT-02 | 予約／受付ラッパーの Trial 実測不足 | `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` に沿って appointmodv2 / acceptmodv2 を実測し Blocker を解除。 | 同上 |
| EXT-03 | 紹介状／MML API 証跡欠落 | `/mml/letter*`, `/mml/labtest*` の差分ログを採取し、Runbook/DOC_STATUS にリンク。 | 同上 |

## 5. 次アクション（ワーカー指示案）
1. **Worker-A（カルテ担当）**: KRT-01〜04 を実装。`docs/server-modernization/phase2/notes/karte-clinical-review-20251116T152300Z.md` を進捗ログとして更新。  
2. **Worker-B（ORCAスタンプ/点数）**: ORCA-01〜03 を `/orca` リソースで対応し、同 RUN_ID の ops/logs に SQL 修正とテスト結果を記載。  
3. **Worker-C（Messaging/Audit/Ops）**: MSG-01, AUD-01/02, OPS-01 を担当し、Trace/Audit Runbook と mac-dev-login ドキュメントを更新。  
4. **Worker-D（外部 API）**: EXT-01〜03 の実装計画を立て、`external-api-gap-20251116T111329Z.md` に進捗を追記。
