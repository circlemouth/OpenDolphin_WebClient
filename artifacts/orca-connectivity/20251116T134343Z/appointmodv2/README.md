# RUN_ID=20251116T134343Z appointmodv2 evidence stub

- Target: POST https://weborca-trial.orca.med.or.jp/orca14/appointmodv2?class=01
- Payload template: `payloads/appointmod_trial.xml`
- CLI sandboxでのネットワークが restricted のため curl 実行はブロックされた。代わりに実施した手順・コマンドは `docs/server-modernization/phase2/operations/logs/20251116T134343Z-appointmod.md` に記録。
- 実環境で再実行する場合は `curl -vv -u trial:weborcatrial --data-binary @payloads/appointmod_trial.xml https://weborca-trial.orca.med.or.jp/orca14/appointmodv2?class=01` を使用し、`trial/` 配下に request/response を保存する。
