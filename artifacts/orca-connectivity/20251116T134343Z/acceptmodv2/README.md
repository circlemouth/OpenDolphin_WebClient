# RUN_ID=20251116T134343Z acceptmodv2 evidence stub

- Target: POST https://weborca-trial.orca.med.or.jp/orca11/acceptmodv2?class=01
- Payload template: `payloads/acceptmod_trial.xml`
- CLI sandbox network is restricted; curl execution deferred. See `docs/server-modernization/phase2/operations/logs/20251116T134343Z-acceptmod.md` for the recorded command plan and blockers.
- When re-running on a permitted terminal, store verbose curl output and HTTP response XML under this directory (`trial/`).
