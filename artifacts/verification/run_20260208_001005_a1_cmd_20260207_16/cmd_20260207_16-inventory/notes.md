# cmd_20260207_16 inventory (misplacements in multi-agent-shogun)

- Task: `cmd_20260207_16_sub_1`
- Worker: `ashigaru1`
- RUN_ID: `run_20260208_001005_a1_cmd_20260207_16`
- Generated: `2026-02-08T00:11:37+0900`

## Scope
棚卸し対象（multi-agent-shogun 側の誤配置候補）:
- `multi-agent-shogun/docs/`
- `multi-agent-shogun/artifacts/` (特に `artifacts/verification/` と `artifacts/webclient/`)
- `multi-agent-shogun/web-client/` (特に `web-client/scripts/`)
- `multi-agent-shogun/OpenDolphin_WebClient/` (誤複製。配下の `docs/` `artifacts/` `web-client/` `server-modernized/` を含む)

比較対象（移設先想定）:
- `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient`

## du (size)
`du-summary.txt` を参照。

主要ポイント:
- shogun 側で最大は `artifacts/verification` (約 149 MiB 相当)
- target 側の `artifacts/verification` は既に巨大 (約 763 MiB)

## find listing
`find-counts.txt` と `find-*.txt` を参照（maxdepth 3 の一覧をファイルに退避）。

## Move mapping proposal (source -> destination)
方針（要求仕様ベース）:
- `multi-agent-shogun/docs/` -> `OpenDolphin_WebClient/docs/`
- `multi-agent-shogun/artifacts/verification/` -> `OpenDolphin_WebClient/artifacts/verification/`
- `multi-agent-shogun/web-client/scripts/` -> `OpenDolphin_WebClient/web-client/scripts/`
- `multi-agent-shogun/OpenDolphin_WebClient/server-modernized/` -> `OpenDolphin_WebClient/server-modernized/`

補足（誤複製サブツリーからも同様の移設候補があるため dry-run を追加実施）:
- `multi-agent-shogun/OpenDolphin_WebClient/docs/` -> `OpenDolphin_WebClient/docs/`
- `multi-agent-shogun/OpenDolphin_WebClient/artifacts/verification/` -> `OpenDolphin_WebClient/artifacts/verification/`
- `multi-agent-shogun/OpenDolphin_WebClient/web-client/scripts/` -> `OpenDolphin_WebClient/web-client/scripts/`

## Top 10 move targets (size order)
`top10-size-kib.txt` を参照（KiB）。

## Collision / overwrite points (rsync --dry-run)
`rsync/*.txt` と `rsync-summary.txt` を参照。

上書き/更新が発生し得る候補（`>f.st....`）:
- docs:
  - `docs/verification-plan.md`
  - `docs/weborca-reception-checklist.md`
- web-client/scripts:
  - `web-client/scripts/qa-order-001-parity.mjs` (shogun 直下・誤複製どちらからも更新候補)
  - `web-client/scripts/qa-charts-do-copy-manual-regression.mjs` (誤複製側から更新候補)
- server-modernized:
  - `server-modernized/src/main/java/open/dolphin/rest/KarteRevisionResource.java`
  - `server-modernized/src/main/java/open/dolphin/session/KarteRevisionServiceBean.java`

新規追加が主体（`>f+++++++`）:
- `docs/verification-plan-*.md` 一式、`docs/ops/tmux-send-keys.md`
- `artifacts/verification/*` の過去RUN証跡ディレクトリ群

## Evidence files in this folder
- `du-summary.txt`
- `du-top.txt`
- `top10-size-kib.txt`
- `find-counts.txt`
- `find-*.txt`
- `rsync/*.txt`
- `rsync-summary.txt`
