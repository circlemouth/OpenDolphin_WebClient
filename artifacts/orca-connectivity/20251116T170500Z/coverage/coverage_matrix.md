# ORCA API Coverage (RUN_ID=20251116T170500Z)

- 対象: ORCA REST ラッパー（Matrix No.2/4/11/32/42）。
- 目的: Trial 実測可否と Blocker を整理し、Spec-based 実装の根拠を共有。
- Evidence: artifacts/orca-connectivity/20251116T170500Z/{coverage,blocked}

| Spec (Matrix) | Trial Availability | Notes |
| --- | --- | --- |
| appointmodv2 (No.2) | 仕様実装済／Trial不可(HTTP405) | [Spec-based] `curl -vv -u trial:weborcatrial --data-binary @payloads/appointmod_trial.xml https://weborca-trial.orca.med.or.jp/orca14/appointmodv2?class=01` は `HTTP/1.1 405 Method Not Allowed (Allow=OPTIONS, GET)`（RUN_ID=`20251116T164300Z`）。`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` の「一部の管理業務を除き自由」節と `blocked/README.md#appointmodv2` を参照。 |
| acceptmodv2 (No.4) | 仕様実装済／Trial不可(HTTP405) | [Spec-based] 同上。POST は封鎖されており CRUD 実測不可。Evidence: `artifacts/orca-connectivity/20251116T164300Z/crud/acceptmodv2/headers_*.txt`。Blocker 根拠: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` §1 / `blocked/README.md#acceptmodv2`. |
| system01lstv2 (No.11) | Trial非提供(管理メニュー制限) | [Spec-based] 管理メニュー（1010 職員情報）が Trial で閉鎖されており API 呼び出し権限なし。`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` §1「システム管理マスタ登録」参照。ラッパー実装は DTO/サービス合流のみで、実測は ORMaster 環境待ち。|
| manageusersv2 (No.32) | Trial非提供(管理メニュー制限) | [Spec-based] 職員ユーザー管理は Trial UI で参照専用のため POST 禁止。`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` §1 根拠 + `blocked/README.md#manageusersv2`。|
| receiptprintv3 (No.42) | Trial非提供(帳票印刷禁止) | [Spec-based] `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等` §4「帳票印刷関連についてはプリンタ出力できません」により `receiptprintv3` API が封鎖。`push-exchanger`/`/blobapi` 連携はローカル ORMaster でのみ検証可能。Blocked: `blocked/README.md#receiptprintv3`. |
