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
| EXT-01 | PHR REST リソースが Spec-based で止まっている | `phr_access_key` Flyway 適用、Layer ID secrets、監査 ID を整備し Trial/ORMaster 両方で CRUD 証跡を取得。RUN_ID=`20251116T210500Z-E1` で Flyway/Secrets 監査と 404/405 証跡を集約済（証跡: `operations/logs/20251116T210500Z-E1-phr.md`, `artifacts/orca-connectivity/20251116T210500Z-E1/`）。ORMaster seed/DNS 復旧後に 200 応答を採取し Spec-based を解除する。 | `external-api-gap-20251116T111329Z.md` §2.1, `DOC_STATUS.md` W22 |
| EXT-02 | 予約／受付ラッパーの Trial 実測不足 | モダナイズ REST（appointments/visits mutation）を実装済（RUN_ID=`20251116T134343Z`）。Trial で curl 実測し (`operations/logs/20251116T210500Z-E2-appointmod.md` 等、`artifacts/orca-connectivity/20251116T210500Z-E2/`)、HTTP405 / ORMaster DNS NXDOMAIN を記録。Ops による DNS/FW 開放後に 200 応答を取得し、`ORCA_API_STATUS.md` / `RESERVATION_BATCH_MIGRATION_NOTES.md` の before/after を更新する。 | `external-api-gap-20251116T111329Z.md` §2.2, `DOC_STATUS.md` W22 |
| EXT-03 | 紹介状／MML API 証跡欠落 | Jakarta Persistence (`persistence.xml`), parity headers (`tmp/parity-headers/mml_TEMPLATE.headers`), Runbook Sec.4.4 を RUN_ID=`20251116T134354Z` で更新し、`artifacts/external-interface/mml/20251116T134354Z/` に証跡構造を定義。Docker/ORMaster 解放後に `send_parallel_request.sh` で Legacy/Modernized の `/mml/letter{list,json}`, `/mml/labtest{list,json}` を取得し diff を保存、LabSeedMissing Blocker を解消して [証跡取得済] へ更新する。 | `external-api-gap-20251116T111329Z.md` §2.3, `operations/logs/20251116T134354Z-mml.md`, `DOC_STATUS.md` W22 |

## 5. 次アクション（ワーカー指示案）
1. **Worker-A（カルテ担当）**: KRT-01〜04 を実装。`docs/server-modernization/phase2/notes/karte-clinical-review-20251116T152300Z.md` を進捗ログとして更新。  
2. **Worker-B（ORCAスタンプ/点数）**: ORCA-01〜03 を `/orca` リソースで対応し、同 RUN_ID の ops/logs に SQL 修正とテスト結果を記載。  
3. **Worker-C（Messaging/Audit/Ops）**: MSG-01, AUD-01/02, OPS-01 を担当し、Trace/Audit Runbook と mac-dev-login ドキュメントを更新。  
4. **Worker-D（外部 API）**: EXT-01〜03 の実装/証跡取得を継続。E1/E2/E3 RUN（`20251116T210500Z-{E1,E2,E3}`）の成果を `external-api-gap-20251116T111329Z.md` と DOC_STATUS に反映しつつ、ORMaster 環境復旧後に CRUD 実測・diff 取得を完了させる。
