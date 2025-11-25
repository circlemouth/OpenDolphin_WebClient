# MML Letter/Labtest Evidence Plan (RUN_ID=20251116T134354Z)

## 1. Scope / Chain
- AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md → EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md §4.4
- Target endpoints: `GET /mml/letter/list/{facilityId}`, `GET /mml/letter/json/{pk}`, `GET /mml/labtest/list/{facilityId}`, `GET /mml/labtest/json/{pk}` (Legacy vs. Modernized parity)

## 2. Current Status (2025-11-16)
- Jakarta persistence now registers `LetterItem`, `LetterText`, `LetterDate`, enabling WildFly to hydrate nested collections once the container is rebuilt.
- Header template `tmp/parity-headers/mml_TEMPLATE.headers` updated to use MD5(`doctor2025`) and `X-Facility-Id` so CLI parity calls authenticate on both stacks.
- Legacy Compose stack locally confirms `letter/list` (`8`) and `letter/json/8` (JSON body) with the updated headers. `labtest/list` returns HTTP500 until lab data is reseeded; captured trace IDs are listed in the ops log.
- Modernized stack still runs the previous WAR; docker rebuild (handled by Ops) is required before re-sampling to clear the SessionOperation failures.

## 3. Evidence TODO
| Endpoint | Legacy capture | Modern capture | Diff | Notes |
| --- | --- | --- | --- | --- |
| letter_list | `artifacts/.../letter_list/legacy/response.txt` (pending) | `.../modern/response.txt` (pending) | `letter_list.diff` | Expect CSV of PKs. Compare ordering + newline parity. |
| letter_json | `.../letter_json/legacy/response.json` (pending) | `.../modern/response.json` (pending) | `letter_json.diff` | Validate nested `letterItems/texts/dates`. |
| labtest_list | pending | pending | `labtest_list.diff` | Requires lab module seed; block tracked in EXT-03. |
| labtest_json | pending | pending | `labtest_json.diff` | Compare `NLaboModuleConverter` output; expect deterministic ordering from ORDER BY fix. |

## 4. Next Steps
1. Ops rebuilds docker-compose (Legacy+Modernized) with the new WAR to load the updated persistence classes.
2. Run `ops/tools/send_parallel_request.sh --profile modernized-dev --endpoint <MML alias>` once helper script exposes the `--endpoint` alias (see Runbook §4.4). Until then, call directly:
   ```bash
   export RUN_ID=20251116T134354Z
   export PARITY_HEADER_FILE=tmp/parity-headers/mml_$RUN_ID.headers
   cp tmp/parity-headers/mml_TEMPLATE.headers "$PARITY_HEADER_FILE"
   TRACE_RUN_ID=$RUN_ID ops/tools/send_parallel_request.sh GET /mml/letter/list/1.3.6.1.4.1.9414.72.103 MML_LETTER_LIST
   ```
3. Copy `legacy/` and `modern/` outputs into this directory, add `diff -u` artifacts, then update `docs/server-modernization/phase2/operations/logs/20251116T134354Z-mml.md` + `DOC_STATUS` W22 to `[証跡取得済]`.

## 5. Trace IDs / Blockers
- Legacy letter_list (`GET`) trace IDs: `legacy-trace-20251116T134354Z-letter`. Lab endpoints currently HTTP500; track under EXT-03 with `LabSeedMissing` blocker until DB seeding task completes.
- Modernized letter_json currently `500 Session layer failure` because the running WildFly lacks the new persistence unit entries. Expect resolution after redeploy.

