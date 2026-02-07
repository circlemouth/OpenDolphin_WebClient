# cmd_20260207_16 完了条件検証（ashigaru8）

- task_id: cmd_20260207_16_sub_8
- run_id: 20260207T151714Z-cmd_20260207_16-validation
- timestamp_utc: 20260207T151714Z
- timestamp_local: 2026-02-08T00:17:14+0900

## 1) multi-agent-shogun 側: 誤配置残存チェック

### root ls
\n```text
total 488
drwxr-xr-x@ 32 Hayato  staff   1024 Feb  8 00:15 .
drwxr-xr-x@ 27 Hayato  staff    864 Feb  3 14:48 ..
drwxr-xr-x@  3 Hayato  staff     96 Feb  3 15:42 .claude
drwxr-xr-x@ 19 Hayato  staff    608 Feb  8 00:16 .git
-rw-r--r--@  1 Hayato  staff    102 Jan 31 16:55 .gitattributes
drwxr-xr-x@  3 Hayato  staff     96 Feb  3 14:09 .github
-rw-r--r--@  1 Hayato  staff    977 Feb  8 00:13 .gitignore
-rw-r--r--@  1 Hayato  staff   1316 Feb  2 15:43 .mcp.json.sample
-rw-r--r--@  1 Hayato  staff  16396 Feb  8 00:13 AGENTS.md
-rw-r--r--@  1 Hayato  staff  15331 Feb  3 14:40 CLAUDE.md
-rw-r--r--@  1 Hayato  staff   2960 Feb  2 15:43 CODEX_IMPLEMENTATION.md
-rw-r--r--@  1 Hayato  staff   1066 Jan 31 16:55 LICENSE
-rw-r--r--@  1 Hayato  staff  14515 Feb  3 15:43 README.md
-rw-r--r--@  1 Hayato  staff  34437 Feb  3 15:45 README_ja.md
drwxr-xr-x@ 42 Hayato  staff   1344 Jan 31 16:55 codex
drwxr-xr-x@  6 Hayato  staff    192 Feb  2 15:43 config
drwxr-xr-x@  3 Hayato  staff     96 Jan 31 16:55 context
-rw-r--r--@  1 Hayato  staff  21144 Feb  8 00:17 dashboard.md
drwxr-xr-x@  2 Hayato  staff     64 Feb  1 06:22 demo_output
drwxr-xr-x@ 20 Hayato  staff    640 Feb  6 15:07 docs
-rwxr-xr-x@  1 Hayato  staff  30969 Feb  3 14:40 first_setup.sh
-rw-r--r--@  1 Hayato  staff   5464 Jan 31 16:55 install.bat
drwxr-xr-x@  8 Hayato  staff    256 Feb  3 15:42 instructions
drwxr-xr-x@  6 Hayato  staff    192 Feb  3 14:09 logs
drwxr-xr-x@  4 Hayato  staff    128 Feb  1 09:49 memory
drwxr-xr-x@  6 Hayato  staff    192 Jan 31 17:21 queue
drwxr-xr-x@  4 Hayato  staff    128 Feb  6 21:10 scripts
-rwxr-xr-x@  1 Hayato  staff   1141 Jan 31 16:55 setup.sh
-rwxr-xr-x@  1 Hayato  staff  68796 Feb  3 16:02 shutsujin_departure.sh
drwxr-xr-x@  8 Hayato  staff    256 Feb  6 15:32 skills
drwxr-xr-x@  2 Hayato  staff     64 Feb  1 06:22 status
drwxr-xr-x@  3 Hayato  staff     96 Jan 31 16:55 templates
```\n
### existence + du
\n```text
EXISTS docs
248K	docs
MISSING artifacts
MISSING web-client
MISSING server-modernized
MISSING OpenDolphin_WebClient
```\n
### find suspicious dirs (maxdepth 2)
\n```text
```\n
### docs/verification-plan.md head
\n```text
-rw-r--r--@ 1 Hayato  staff  158327 Feb  7 08:32 docs/verification-plan.md
# 確認作業計画（完成版）

> 章立ては確定、本文は必要最低限。
> 画面一覧/サーバー機能/トレーサビリティは暫定表（代表行）を記載済み。詳細差し込みは追記予定。

## 1. 基本情報

- 対象名称: OpenDolphin WebClient 画面確認作業計画
- 対象範囲: OpenDolphin WebClient（Login/Reception/Charts/Patients/Administration/Print）＋Debug導線はルート/ガード確認のみ
- 目的 / 背景: 画面別の確認観点を明文化し、現有戦力で実施可能な確認計画と証跡取得方針を確定する
- 期間 / マイルストーン: 2026-02-03〜2026-02-09（準備→実施→レビュー→完了）
- 参照資料: `web-client/src/AppRouter.tsx` / `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` / `docs/web-client/architecture/web-client-api-mapping.md` / `docs/web-client/architecture/web-client-screen-review-template.md`
- 作成日: 2026-02-03
- 最終更新日: 2026-02-06
- 作成者: 足軽1（実務担当）
- 承認者: 家老

## cmd_20260206_10 残件（P0/P1/P2）

- 現状: P0 は material master の再現パスを追う部分確認、P1 は Api_Result matrix + queue live を含めて完了、P2 は chart-events SSE policy を安定確認済み（詳細は下の表）。
 

## modernized/ORCA 連携 未確認機能（P0/P1/P2）


| 優先度 | 対象機能 | 依存 API | 状態/未確認理由 | 完了条件 | RUN_ID | 証跡 |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Procedure Usage で /orca/master/material を経由する材料検索／例外 UI | `/orca/master/material` → `/orca/order/bundles` | 状態: ORCADS の `ORCA_DB_*` 未設定 → `DB_*` フォールバック → app DB 誤接続で 503 `MASTER_MATERIAL_UNAVAILABLE` が発生。ORCADS 修正後は `/orca/master/material` が 200/[] + UI 空表示（RUN_ID=`20260206T142053Z-cmd_20260206_15_sub_14-material-200`, `20260206T183713Z-cmd_20260206_15_sub_16-material-master-reverify28`, `20260206T183833Z-cmd_20260206_15_sub_16-material-master-reverify29`）に戻り、ORCA DB `tbl_material_*` が 0 件（RUN_ID=`20260206T190155Z-cmd_20260206_15_sub_18-material-items-rootcause`）で items=[] が正しい挙動。DEV 最小 seed(1件) で items>0→材料選択→`POST /orca/order/bundles` ペイロード保存（RUN_ID=`20260206T192539Z-cmd_20260206_15_sub_18-material-items-seeded-verify1`, cleanup済）も実証済。503 root cause は `20260206T120731Z-procedure-usage-material-master1` / `20260206T131817Z-cmd_20260206_15_sub_12-material-master-1` / `20260206T131921Z-cmd_20260206_15_sub_12-material-master-2` / `20260206T132023Z-cmd_20260206_15_sub_12-material-master-3` / `20260206T134719Z-cmd_20260206_15_sub_13-material-master-503-curl3` (`standalone-full.orcads-snippet.xml`) で記録。 | まとめ: ORCADS の 503 根本・200/empty/items=0/seeded items>0 経路および payload 保存の全証跡を整理して P0 を完了（items=0/empty + items>0 payload capture 両系統）。 | `20260206T120731Z-procedure-usage-material-master1` / `20260206T131817Z-cmd_20260206_15_sub_12-material-master-1` / `20260206T131921Z-cmd_20260206_15_sub_12-material-master-2` / `20260206T132023Z-cmd_20260206_15_sub_12-material-master-3` / `20260206T134719Z-cmd_20260206_15_sub_13-material-master-503-curl3` / `20260206T142053Z-cmd_20260206_15_sub_14-material-200` / `20260206T183713Z-cmd_20260206_15_sub_16-material-master-reverify28` / `20260206T183833Z-cmd_20260206_15_sub_16-material-master-reverify29` / `20260206T190155Z-cmd_20260206_15_sub_18-material-items-rootcause` / `20260206T192539Z-cmd_20260206_15_sub_18-material-items-seeded-verify1` | `OpenDolphin_WebClient/artifacts/verification/20260206T134719Z-cmd_20260206_15_sub_13-material-master-503-curl3/standalone-full.orcads-snippet.xml` + `OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T142053Z-cmd_20260206_15_sub_14-material-200/material-master/` + `OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T183713Z-cmd_20260206_15_sub_16-material-master-reverify28/material-master/` + `OpenDolphin_WebClient/artifacts/webclient/e2e/20260206T183833Z-cmd_20260206_15_sub_16-material-master-reverify29/material-master/` + `OpenDolphin_WebClient/artifacts/verification/20260206T190155Z-cmd_20260206_15_sub_18-material-items-rootcause/material-master-items-rootcause/` + `OpenDolphin_WebClient/artifacts/verification/20260206T192539Z-cmd_20260206_15_sub_18-material-items-seeded-verify1/material-master-items-seeded/` + `order-bundles-posts.json` |
| P1 | Api_Result=14/24/16 の ORCA 応答 vs Api_Result=90 の扱い | `/orca/visits/mutation` / `acceptmodv2` | 状態: 完了（`20260206T124058Z-api-result-matrix-retest2` で direct/modernized/web-client の Api_Result 14/24/16 が一致し、業務エラー扱いで HTTP 200/Api_Result 表示を許容）。Api_Result=90 は ORCA 側排他のため再現性不定で、既存 RUN_ID=`20260205T070802Z` を基に仕様差を許容。 | 14/24/16 matrix を evidence として docs に記録し、Api_Result=90 は「ORCA 側排他/不定」扱いの方針を statement する。 | `20260206T124058Z-api-result-matrix-retest2` / `20260205T070802Z` | `OpenDolphin_WebClient/artifacts/verification/20260206T124058Z-api-result-matrix-retest2/` + `OpenDolphin_WebClient/artifacts/verification/20260205T070802Z/` |
| P2 | chart-events (SSE) 5xx response の console spam 抑止 | `/chart-events` | 状態: 完了（MSW on/off で `20260206T125233Z-cmd_20260206_15_sub_11-chart-events-msw` により 5xx → guard banner/停止で excessive log なしを確認済）。 | Playwright/Vitest + MSW on/off run で 5xx 発生時の console spam を抑止し、再接続を停止する behavior を再検証。 | `20260206T125233Z-cmd_20260206_15_sub_11-chart-events-msw` | `OpenDolphin_WebClient/artifacts/verification/20260206T125233Z-cmd_20260206_15_sub_11-chart-events-msw/` |
```\n
## 2) multi-agent-shogun 側: 参照先整合（rg）

### rg: docs/verification-plan.md | artifacts/verification
\n```text
./AGENTS.md:15:- 検証計画（正本）: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md`
./AGENTS.md:16:- 検証証跡（保存先）: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/verification/<RUN_ID>/`
./AGENTS.md:21:- OpenDolphin 用の `docs/verification-plan.md` / `artifacts/verification/` / `web-client/scripts/` / `server-modernized/` を multi-agent-shogun 側に作るのは誤り。見つけたら直ちに正本へ移設せよ。
./scripts/tmux-send-2step-selftest.sh:6:# - Saves evidence (tmux capture-pane etc.) under artifacts/verification/<RUN_ID>/.
./scripts/tmux-send-2step-selftest.sh:23:  - Writes evidence to: artifacts/verification/<RUN_ID>/
./scripts/tmux-send-2step-selftest.sh:35:OUT_DIR="$ROOT/artifacts/verification/$RUN_ID"
./instructions/codex-ashigaru.md:169:- OpenDolphin の `docs/verification-plan.md` は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md` が正本である
./instructions/codex-ashigaru.md:170:- OpenDolphin の検証証跡は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/verification/<RUN_ID>/` に保存する
./instructions/codex-ashigaru.md:172:- OpenDolphin 用の `docs/verification-plan.md` / `artifacts/verification/` / `web-client/scripts/` / `server-modernized/` を multi-agent-shogun 側に作るのは誤配置。見つけたら直ちに正本へ移設する
./instructions/codex-karo.md:155:- 足軽への requirements には、正本パス（`/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md` / `.../artifacts/verification/<RUN_ID>/` / `.../web-client/scripts/`）を明記し、multi-agent-shogun 側の同名パス参照を避ける
```\n
### rg: "正本"
\n```text
AGENTS.md:10:## 正本宣言（OpenDolphin_WebClient）
AGENTS.md:12:multi-agent-shogun は「母艦（キュー/ダッシュボード/通知）」であり、OpenDolphin WebClient の実作業・成果物の正本ではない。
AGENTS.md:14:- 正本ルート: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient`
AGENTS.md:15:- 検証計画（正本）: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md`
AGENTS.md:17:- web-client scripts（正本）: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/scripts/`
AGENTS.md:21:- OpenDolphin 用の `docs/verification-plan.md` / `artifacts/verification/` / `web-client/scripts/` / `server-modernized/` を multi-agent-shogun 側に作るのは誤り。見つけたら直ちに正本へ移設せよ。
AGENTS.md:22:- multi-agent-shogun 配下に同名のコピーが存在しても、正本とはみなさない。参照は必ず上記の正本パスへ。
instructions/codex-karo.md:154:- OpenDolphin WebClient 関連の任では、正本は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient` である（詳細は `$SHOGUN_HOME/AGENTS.md` の「正本宣言（OpenDolphin_WebClient）」に従う）
instructions/codex-karo.md:155:- 足軽への requirements には、正本パス（`/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md` / `.../artifacts/verification/<RUN_ID>/` / `.../web-client/scripts/`）を明記し、multi-agent-shogun 側の同名パス参照を避ける
instructions/codex-ashigaru.md:168:- OpenDolphin WebClient 関連の任では、正本は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient` である（詳細は `$SHOGUN_HOME/AGENTS.md` の「正本宣言（OpenDolphin_WebClient）」に従う）
instructions/codex-ashigaru.md:169:- OpenDolphin の `docs/verification-plan.md` は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/verification-plan.md` が正本である
instructions/codex-ashigaru.md:171:- OpenDolphin の `web-client/scripts` は `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/scripts/` が正本である
instructions/codex-ashigaru.md:172:- OpenDolphin 用の `docs/verification-plan.md` / `artifacts/verification/` / `web-client/scripts/` / `server-modernized/` を multi-agent-shogun 側に作るのは誤配置。見つけたら直ちに正本へ移設する
docs/verification-plan-screen-review-integration-steps.md:15:   - 4章内に残す場合は「抜粋」表記を明記し、10章を正本とする。
docs/verification-plan.md:111:モダナイズ版サーバーで提供する REST API を、機能IDで管理する。一次の正本は `MODERNIZED_REST_API_INVENTORY.md` とし、本章では代表行を示す。最終版ではカテゴリ別に全行を展開する。
docs/verification-plan.md:2055:- モダナイズ版 REST API の OpenAPI（yaml/json）の正本が未確認。現時点の一次は `MODERNIZED_REST_API_INVENTORY.md`。
docs/verification-plan.md:2056:- 画面対応表の正本は分散（web-client-api-mapping + 各画面設計）。単一のトレーサビリティ表は未整備。
docs/verification-plan-placeholder-fill-guide.md:10:- 参照資料: 正本ドキュメント、設計書、API仕様、運用手順
docs/verification-plan-placeholder-fill-guide.md:31:- 画面一覧の正本（AppRouter / 設計書 / 画面遷移図）
docs/verification-plan-placeholder-fill-guide.md:61:- 画面一覧の正本と採番ルール
```\n
## 3) OpenDolphin_WebClient 側: 存在と git 管理状態

### existence + du
\n```text
EXISTS docs
 16M	docs
EXISTS artifacts/verification
913M	artifacts/verification
EXISTS web-client/scripts
412K	web-client/scripts
```\n
### git status
\n```text
## master...origin/master [ahead 2]
 M docker/orca/jma-receipt-docker
?? artifacts/verification/20260207T151600Z-cmd_20260207_16_sub_5-prevent-recurrence/
?? artifacts/verification/20260207T151714Z-cmd_20260207_16-validation/
?? docs/ops/
?? docs/verification-plan-checklist-insert.md
?? docs/verification-plan-checklist.md
?? docs/verification-plan-draft.md
?? docs/verification-plan-final-outline.md
?? docs/verification-plan-insert-snippets.md
?? docs/verification-plan-insert-steps.md
?? docs/verification-plan-integration-guide.md
?? docs/verification-plan-integration-order.md
?? docs/verification-plan-integration-playbook.md
?? docs/verification-plan-missing-items.md
?? docs/verification-plan-placeholder-fill-guide.md
?? docs/verification-plan-placeholder-map.md
?? docs/verification-plan-screen-review-integration-steps.md
?? docs/verification-plan-screen-review.md
?? docs/verification-plan-section-proposal.md
?? docs/verification-plan-template.md
```\n
### docs/verification-plan.md tracking
\n```text
-rw-r--r--@ 1 Hayato  wheel  138532 Feb  7 22:56 docs/verification-plan.md

git ls-files:
docs/verification-plan.md
```\n
## 4) OpenDolphin_WebClient 側: 移設コミットSHA探索

### HEAD
\n```text
ca5c1feb255ac0befd24d1a453569841dfe2cef9
```\n
### git log --grep cmd_20260207_16
\n```text
ca5c1feb2 (HEAD -> master) cmd_20260207_16: move artifacts from shogun workspace
078787c5a cmd_20260207_16: consolidate web-client scripts from shogun workspace
```\n
### git log (recent 30)
\n```text
ca5c1feb2 (HEAD -> master) cmd_20260207_16: move artifacts from shogun workspace
078787c5a cmd_20260207_16: consolidate web-client scripts from shogun workspace
04390d063 (origin/master, origin/HEAD) chore: remove cached artifacts from repo
a10d8d6f7 WEBクライアントデバッグ
bb4d26377 Log login /api/user request lifecycle
9bd733a23 Add X-Facility-Id header to login
19e94b27a Force login API via /api on https
6b242e8e9 Log login abort details and add https hint
d52b2e4d6 Add login retry and timeout guard
28f54b0ed Guard login API base URL for https
0a61ce9b0 Fix deptinfo auth via httpFetch
9183d5c80 Fallback physician options when empty
0618099b2 Fix physicianOptions scope for reception
ba279a1b9 Fix selectedEntry TDZ for physician options
ffca3339d Ensure physician options include selected/filter
41a20f104 Stabilize department/physician selects for acceptance
98f89933c Limit department/physician options to avoid select lag
0fdacc3c1 Require physician selection for accept payload
4da8bbf87 Attach auth headers to direct accept requests
737780c22 Default department code when options unavailable
5beba96b9 Normalize department option labels
4937c0c43 Fetch deptinfo to populate department options
8d6a2af98 Populate department select options with fallbacks
6479600d5 Add department code select to accept form
b5f6cb836 Sync department select state for accept payload
a3d104c4e Harden department code resolution
32889893f Prioritize department filter in accept payload
39047e22a Ensure XHR debug panel always visible
5ebc0df78 Add XHR debug panel for forced accept send
19de321f1 Guard direct accept send when department missing
```\n
