# Blocked APIs (RUN_ID=20251116T170500Z)

> Trial 実測不可のラッパー API を `Spec-based` タグで管理。根拠: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等`。

## HTTP 405（管理業務系 POST 封鎖）
### appointmodv2
- 事象: `curl -vv -u trial:weborcatrial --data-binary @payloads/appointmod_trial.xml https://weborca-trial.orca.med.or.jp/orca14/appointmodv2?class=01` → `HTTP/1.1 405 Method Not Allowed (Allow=OPTIONS, GET)`。
- 根拠: trialsite §1「一部の管理業務を除き自由」→予約書込みは対象外。
- 対応状況: [Spec-based] DTO／サービス実装済（RUN_ID=`20251116T164200Z`）。Trial 開放待ち。Evidence 参照: `artifacts/orca-connectivity/20251116T164300Z/crud/appointmodv2/headers_*.txt`。

### acceptmodv2
- 事象: `curl -vv -u trial:weborcatrial --data-binary @payloads/acceptmod_trial.xml https://weborca-trial.orca.med.or.jp/orca11/acceptmodv2?class=01` → `HTTP/1.1 405 Method Not Allowed (Allow=OPTIONS, GET)`。
- 根拠: trialsite §1（管理業務封鎖）。
- 対応状況: [Spec-based] ラッパー設計・実装のみ。Trial 実測は doctor/patient seed 復旧＋POST 解放待ち。

## 管理メニュー閉鎖（POST 権限なし）
### system01lstv2
- 事象: Trial UI で 1010 システム管理メニューが非活性のため API 認証が通らない。`Api_Result=11`（対象なし）となり、診療科/職員マスタの差分が取得できない。
- 根拠: trialsite §1「システム管理マスタ登録」禁止。
- 対応状況: [Spec-based] DTO/サービスを `SystemMasterSnapshotRequest/Response` ベースで実装済。実測は ORMaster 環境での一次確認待ち。

### manageusersv2
- 事象: 職員情報メニュー（1010）が参照専用。POST は `HTTP 401/405` で拒否されるためユーザー CRUD が実施できない。
- 根拠: trialsite §1（システム管理業務は使用不可）。
- 対応状況: [Spec-based] `OrcaUserManagementRequest/Response` 実装済。Trial 実測不可のため、仕様ベースで API 状態を維持。

## 帳票印刷禁止
### receiptprintv3
- 事象: trialsite §4「帳票印刷関連についてはプリンタ出力できません」により `/orca42/receiptprintv3` が封鎖。`push-exchanger` や `/blobapi` も無効。
- 根拠: trialsite #limit §4。
- 対応状況: [Spec-based] `ReportPrintJobRequest/Response` と `ReportPrintJobService` 実装済。Trial 実測不可。ローカル ORMaster or 顧客環境での再測待ち。
